// Fase 2 de planeacion_capacidades.md: cinematica inversa (IK) de dos huesos.
//
// Una parte (el primer hueso: brazo, muslo...) puede llevar
//   ik: {hasta: "<segundo hueso>", punta: [x, y], objetivo: "<grupo>", doblez?: 1 | -1, orientar?: "<grupo>"}
//   - hasta: hijo directo de la parte (antebrazo, pierna). Los dos giran sobre su ancla
//     (transformacion.ancla_x/y = el hombro y el codo).
//   - punta: el punto del segundo hueso que tiene que llegar al objetivo (la muneca, el
//     tobillo), en coordenadas del segundo hueso (como sus figuras).
//   - objetivo: cualquier grupo del documento; se usa su origen (y su rotacion para
//     `orientar`). Normalmente una parte vacia con claves x / y.
//   - doblez: hacia que lado se dobla la articulacion (1 o -1).
//   - orientar: un hijo del segundo hueso (la mano, el pie) que toma la rotacion del
//     objetivo, asi el pie queda plano aunque la pierna gire.
// Claves opcionales en la parte: `ik_peso` (0..1) mezcla la rotacion de sus claves con la
// del IK (0 = solo claves, 1 = solo IK).
//
// Se calcula en cada cuadro DESPUES de las claves (GestionEvento._aplicarClaves): pisa la
// rotacion de los dos huesos (y de `orientar`). Si el objetivo no se alcanza, el brazo
// apunta hacia el estirado. No contempla espejos ni escalas dentro de la cadena.
import {cadenaTransformaciones, destransformarPunto, mapaGrupos, normalizarTransformacion, transformarPunto} from "../EditorAnimacion/TransformacionInstancia";
import * as Claves from "./Claves";

export const PISTA_PESO = "ik_peso";
const GRADOS = 180 / Math.PI;

const neutra = () => ({rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0});
const angulo = (a) => { let x = ((a + 180) % 360 + 360) % 360 - 180; return x === -180 ? 180 : x; };
const mezclarAngulo = (a, b, p) => a + angulo(b - a) * p;
const rotacionMundo = (g, mapa) => cadenaTransformaciones(g, mapa).reduce((s, e) => s + e.t.rotacion, 0);

export const tieneIk = (grupos) => grupos.some((g) => g.ik && g.ik.hasta && g.ik.objetivo);

// Resuelve una cadena: rotaciones (grados) del primer y segundo hueso para que `punta`
// llegue a `T`. S = hombro, E0 = codo y P0 = punta en reposo (mismo espacio que T).
export function resolverDosHuesos(S, E0, P0, T, doblez = 1) {
    const L1 = Math.hypot(E0.x - S.x, E0.y - S.y), L2 = Math.hypot(P0.x - E0.x, P0.y - E0.y);
    if (L1 < 1e-6 || L2 < 1e-6) return null;
    const a1 = Math.atan2(E0.y - S.y, E0.x - S.x), a2 = Math.atan2(P0.y - E0.y, P0.x - E0.x);
    const base = Math.atan2(T.y - S.y, T.x - S.x);
    const d = Math.min(L1 + L2 - 1e-6, Math.max(Math.abs(L1 - L2) + 1e-6, Math.hypot(T.x - S.x, T.y - S.y)));
    const alfa = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const t1 = base - (doblez < 0 ? -1 : 1) * alfa;
    const E = {x: S.x + L1 * Math.cos(t1), y: S.y + L1 * Math.sin(t1)};
    const Q = {x: S.x + d * Math.cos(base), y: S.y + d * Math.sin(base)};      // el objetivo (o el punto alcanzable mas cercano)
    const t2 = Math.atan2(Q.y - E.y, Q.x - E.x);
    return {r1: angulo((t1 - a1) * GRADOS), r2: angulo(((t2 - t1) - (a2 - a1)) * GRADOS), alcanza: d >= Math.hypot(T.x - S.x, T.y - S.y) - 1e-3};
}

// Aplica todas las cadenas IK de `originales` sobre los grupos dinamicos `dinamicos`
// (con cx_solid / cy_solid ya calculados) en el instante t_ms.
export function aplicarIk(originales, dinamicos, t_ms) {
    const mapa = mapaGrupos(dinamicos), orig = mapaGrupos(originales);
    // rotacion "sin IK" de un hueso en este cuadro: la de sus claves (ya aplicadas) o la
    // guardada; nunca la del cuadro anterior (asi el resultado no depende del pasado)
    const base = (g) => {
        const og = orig.get(g.nombre);
        const t = og && Claves.tienePista(og.claves, "rotacion") ? g.transformacion : og && og.transformacion;
        return {...neutra(), ...(normalizarTransformacion(g.transformacion) || {}), rotacion: (normalizarTransformacion(t) || neutra()).rotacion};
    };
    for (const o of originales) {
        const ik = o.ik;
        if (!ik || !ik.hasta || !ik.objetivo) continue;
        const A = mapa.get(o.nombre), B = mapa.get(ik.hasta), T = mapa.get(ik.objetivo);
        if (!A || !B || !T || B.nodo_padre !== A.nombre) continue;
        const peso = Claves.tienePista(o.claves, PISTA_PESO) ? Math.max(0, Math.min(1, Claves.valorObjeto(o.claves, PISTA_PESO, t_ms, o.claves_bucle))) : 1;
        if (peso <= 0) continue;
        const tA = base(A), tB = base(B);
        const punta = Array.isArray(ik.punta) ? ik.punta : [0, 0];
        const ax = Number(A.cx_solid) || 0, ay = Number(A.cy_solid) || 0, bx = Number(B.cx_solid) || 0, by = Number(B.cy_solid) || 0;
        const S = {x: ax + tA.ancla_x, y: ay + tA.ancla_y};
        const E0 = {x: bx + tB.ancla_x, y: by + tB.ancla_y};
        const P0 = {x: bx + (Number(punta[0]) || 0), y: by + (Number(punta[1]) || 0)};
        // objetivo: su origen como se ve, llevado al espacio del padre del primer hueso
        const Tw = transformarPunto(cadenaTransformaciones(T, mapa), {x: Number(T.cx_solid) || 0, y: Number(T.cy_solid) || 0});
        const padre = A.nodo_padre && A.nodo_padre !== "root" ? mapa.get(A.nodo_padre) : null;
        const Tp = padre ? destransformarPunto(cadenaTransformaciones(padre, mapa), Tw) : Tw;
        const r = resolverDosHuesos(S, E0, P0, Tp, ik.doblez);
        if (!r) continue;
        const r1 = mezclarAngulo(tA.rotacion, r.r1, peso), r2 = mezclarAngulo(tB.rotacion, r.r2, peso);
        A.transformacion = {...tA, rotacion: r1};
        B.transformacion = {...tB, rotacion: r2};
        if (ik.orientar) {
            const C = mapa.get(ik.orientar);
            if (C && C.nodo_padre === B.nombre) {
                const tC = base(C);
                const deseada = rotacionMundo(T, mapa) - (padre ? rotacionMundo(padre, mapa) : 0) - r1 - r2;
                C.transformacion = {...tC, rotacion: mezclarAngulo(tC.rotacion, angulo(deseada), peso)};
            }
        }
    }
}
