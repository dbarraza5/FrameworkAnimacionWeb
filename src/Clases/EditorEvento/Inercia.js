// Fase 3 de planeacion_capacidades.md: movimiento secundario (inercia).
//
// Una parte con `inercia: {rigidez?, amortiguacion?, fuerza?, limite?, punta?}` se comporta
// como un pendulo con resorte colgado de su pivote (transformacion.ancla): cuando el pivote
// acelera o el padre gira, la parte se queda atras, rebota y vuelve a su rotacion (la de
// sus claves, si tiene). Cabello, colas, bufandas, antenas, orejas, carteles colgantes...
//   - rigidez: frecuencia natural en Hz (2.5): mas alta = vuelve mas rapido.
//   - amortiguacion: 0..1 (0.25): 0 = oscila mucho, 1 = no rebota.
//   - fuerza: multiplica la reaccion (1).
//   - limite: angulo maximo en grados (70).
//   - punta: [x, y] el "peso" de la parte, en sus coordenadas (por defecto, el centro de
//     sus figuras); define el largo del pendulo.
//
// DETERMINISTA: se integra sobre una grilla fija (1/120 s) desde t = 0, con el movimiento
// que dan las CLAVES de la cadena (x, y, rotacion y escala de la parte y sus ancestros, y la
// inercia ya calculada de los ancestros). Los estados se guardan: ir a un instante da
// siempre el mismo resultado, sin importar desde donde se llegue. No ve el movimiento de
// la fisica, de la IK ni de los movimientos viejos (MRU, etc.).
import {cadenaTransformaciones, normalizarTransformacion, transformarPunto} from "../EditorAnimacion/TransformacionInstancia";
import * as Claves from "./Claves";

export const DT = 1 / 120;
const GRADOS = 180 / Math.PI;
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

export const parametrosInercia = (i) => ({
    rigidez: Math.max(0.05, num(i && i.rigidez, 2.5)),
    amortiguacion: Math.max(0, Math.min(2, num(i && i.amortiguacion, 0.25))),
    fuerza: num(i && i.fuerza, 1),
    limite: Math.max(1, Math.min(180, num(i && i.limite, 70))),
});

// centro de las figuras propias de un grupo (en el espacio sin transformar, relativo a su origen)
function centroFiguras(g) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of g.lista_figuras || []) {
        const a = f.atributos || {}, cx = num(a.cx, 0), cy = num(a.cy, 0);
        const pts = f.tipo_figura === "RECTA" ? [[cx + num(a.x1, 0), cy + num(a.y1, 0)], [cx + num(a.x2, 0), cy + num(a.y2, 0)]]
            : f.tipo_figura === "CIRCULO" ? [[cx - num(a.radiox, 0), cy - num(a.radioy, 0)], [cx + num(a.radiox, 0), cy + num(a.radioy, 0)]] : [[cx, cy]];
        for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    return x0 === Infinity ? null : {x: (x0 + x1) / 2, y: (y0 + y1) / 2};
}

// Cadena de la raiz a `g` (originales).
function cadena(g, mapa) {
    const r = [], vistos = new Set();
    for (let x = g; x && !vistos.has(x.nombre); x = x.nodo_padre && x.nodo_padre !== "root" ? mapa.get(x.nodo_padre) : null) {
        vistos.add(x.nombre);
        r.unshift(x);
    }
    return r;
}

// Firma de lo que define la simulacion de `g`: si cambia (el usuario edito algo), se rehace.
function firmaDe(lista, g) {
    return JSON.stringify([g.inercia, lista.map((x) => [x.nombre, x.cx, x.cy, x.transformacion, x.claves, x.claves_bucle, x.inercia])]);
}

// Pose (solo claves) de la cadena en el instante de escena tau (ms): grupos falsos con
// cx_solid / transformacion, listos para TransformacionInstancia. `extra(nombre, paso)` da la
// inercia ya simulada de un ancestro.
function poseCadena(lista, tau, reloj, extra, paso) {
    const mapa = new Map();
    let ox = 0, oy = 0;
    for (const x of lista) {
        const t = reloj(x, tau), c = x.claves, b = x.claves_bucle;
        const cx = Claves.tienePista(c, "x") ? Claves.valorObjeto(c, "x", t, b) : num(x.cx, 0);
        const cy = Claves.tienePista(c, "y") ? Claves.valorObjeto(c, "y", t, b) : num(x.cy, 0);
        ox += cx; oy += cy;
        const tr = {...(normalizarTransformacion(x.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0})};
        for (const p of ["rotacion", "escala_x", "escala_y"]) if (Claves.tienePista(c, p)) tr[p] = Claves.valorObjeto(c, p, t, b);
        tr.rotacion += extra(x.nombre, paso);
        mapa.set(x.nombre, {nombre: x.nombre, nodo_padre: x.nodo_padre, cx_solid: ox, cy_solid: oy, transformacion: tr});
    }
    return mapa;
}

// Simula (o continua la simulacion de) un grupo hasta el paso `hasta`. Devuelve el estado.
function simular(g, lista, est, hasta, reloj, extra) {
    const P = parametrosInercia(g.inercia);
    const k = (2 * Math.PI * P.rigidez) ** 2, c = 2 * P.amortiguacion * Math.sqrt(k), lim = P.limite / GRADOS;
    const ancla = normalizarTransformacion(g.transformacion) || {ancla_x: 0, ancla_y: 0};
    const punta = Array.isArray(g.inercia && g.inercia.punta) ? {x: num(g.inercia.punta[0], 0), y: num(g.inercia.punta[1], 0)}
        : centroFiguras(g) || {x: ancla.ancla_x, y: ancla.ancla_y + 40};
    // muestra del "palo" del pendulo en el paso i: pivote y direccion como se ven
    const muestra = (i) => {
        const pose = poseCadena(lista, i * DT * 1000, reloj, extra, i), yo = pose.get(g.nombre);
        const cad = cadenaTransformaciones(yo, pose);
        const piv = transformarPunto(cad, {x: yo.cx_solid + ancla.ancla_x, y: yo.cy_solid + ancla.ancla_y});
        const pun = transformarPunto(cad, {x: yo.cx_solid + punta.x, y: yo.cy_solid + punta.y});
        const det = cad.reduce((s, e) => s * Math.sign(e.t.escala_x * e.t.escala_y || 1), 1);
        return {x: piv.x, y: piv.y, u: Math.atan2(pun.y - piv.y, pun.x - piv.x), L: Math.max(4, Math.hypot(pun.x - piv.x, pun.y - piv.y)), signo: det < 0 ? -1 : 1};
    };
    if (!est.th) {
        const m0 = muestra(0);
        Object.assign(est, {th: [0], m: [m0, m0, m0], w: 0});
    }
    while (est.th.length <= hasta) {
        const i = est.th.length;
        const [m2, m1] = [est.m[est.m.length - 2], est.m[est.m.length - 1]];
        const m = muestra(i);
        let du = m.u - m1.u, du1 = m1.u - m2.u;
        du = Math.atan2(Math.sin(du), Math.cos(du)); du1 = Math.atan2(Math.sin(du1), Math.cos(du1));
        const ax = (m.x - 2 * m1.x + m2.x) / (DT * DT), ay = (m.y - 2 * m1.y + m2.y) / (DT * DT), alfa = (du - du1) / (DT * DT);
        const th = est.th[i - 1], ang = m.u + th * m.signo;
        // aceleracion tangencial que "ve" la punta en el marco del pivote, mas el giro del padre
        const tang = -(ax * -Math.sin(ang) + ay * Math.cos(ang)) / m.L;
        const acc = m.signo * P.fuerza * (tang - alfa) - k * th - c * est.w;
        est.w += acc * DT;
        let nth = th + est.w * DT;
        if (nth > lim) { nth = lim; est.w = Math.min(0, est.w); }
        if (nth < -lim) { nth = -lim; est.w = Math.max(0, est.w); }
        est.th.push(nth);
        est.m = [m1, m];
    }
    return est;
}

// Aplica la inercia de todos los grupos con `inercia` en el instante t_ms (de escena).
//   originales: grupos guardados (con claves); dinamicos: mapa nombre -> grupo del cuadro;
//   reloj(g, tau_ms): instante en el reloj de las claves de g; cache: Map persistente.
export function aplicarInercia(originales, dinamicos, t_ms, reloj, cache) {
    const con = originales.filter((g) => g.inercia);
    if (!con.length) return;
    const mapa = new Map(originales.map((g) => [g.nombre, g]));
    // de afuera hacia adentro: un mechon hijo usa la inercia ya simulada del padre
    const profundidad = (g) => cadena(g, mapa).length;
    con.sort((a, b) => profundidad(a) - profundidad(b));
    const paso = Math.max(0, t_ms / 1000 / DT);
    const i0 = Math.floor(paso), u = paso - i0;
    const angulo = (nombre, i) => {
        const e = cache.get(nombre);
        return e && e.th && e.th.length > i ? e.th[i] * GRADOS : 0;
    };
    for (const g of con) {
        const lista = cadena(g, mapa);
        const firma = firmaDe(lista, g);
        let est = cache.get(g.nombre);
        if (!est || est.firma !== firma) { est = {firma}; cache.set(g.nombre, est); }
        // los ancestros con inercia ya estan simulados hasta i0 + 1 (se procesan antes)
        simular(g, lista, est, i0 + 1, reloj, (n, i) => (n === g.nombre ? 0 : angulo(n, i)));
        const th = (est.th[i0] + (est.th[i0 + 1] - est.th[i0]) * u) * GRADOS;
        const d = dinamicos.get(g.nombre);
        if (!d) continue;
        // rotacion sin inercia de este cuadro: la de sus claves (ya aplicadas) o la guardada
        const base = Claves.tienePista(g.claves, "rotacion") ? normalizarTransformacion(d.transformacion) : normalizarTransformacion(g.transformacion);
        const t = normalizarTransformacion(d.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0};
        d.transformacion = {...t, rotacion: ((base && base.rotacion) || 0) + th};
    }
}
