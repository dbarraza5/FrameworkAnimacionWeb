// Posiciones relativas al cuadro y formatos de una misma escena (planeacion_autoria_ia.md, fase IA-3).
// Se aplica al formato simple ANTES de compilar (Compilador.compilarEscena), asi que el resultado
// guardado es el de siempre (numeros), y el editor no cambia.
//
// 1) formatos: lo que cambia en cada formato, sin copiar la escena:
//    formatos: {"vertical": {nombre?, camara?: {...}, objetos?: {"<nombre>": {...} | null}, efectos?: {"<nombre>": {...} | null},
//               dialogos?: {"<indice>": {...} | null}, agregar?: {objetos?: [...], efectos?: [...], dialogos?: [...]},
//               zona_segura?, ...otros campos de la escena}}
//    Se elige al compilar ({formato: "vertical"}). Cada parche se MEZCLA con lo que reemplaza (un nivel:
//    {claves: {...}} reemplaza todas las claves). null quita el objeto, efecto o dialogo en ese formato.
//    Sin formato elegido, "formatos" se ignora (es la escena base).
//
// 2) en: {cuadro: "<lugar>" | [fx, fy], desplazar?: [dx, dy], t?: ms} en objetos y efectos: un punto de lo
//    que ve la camara en el instante t (0 por defecto); se resuelve al compilar (queda fijo en el mundo).
//    En textos (dialogos estilo "texto" sin quien) el texto queda PEGADO A LA PANTALLA: Dialogos.js lo ubica
//    en cada cuadro, con tamano, ancho y desplazar en px del video (como los globos), y se alinea segun el
//    lugar ("arriba-..." cuelga hacia abajo, "...-derecha" se alinea a la derecha) salvo alinear / vertical.
//    - lugar: "arriba-izquierda" | "arriba-centro" | "arriba-derecha" | "centro-izquierda" | "centro" |
//      "centro-derecha" | "abajo-izquierda" | "abajo-centro" | "abajo-derecha": los bordes de la ZONA SEGURA.
//    - [fx, fy]: fraccion del cuadro entero (0..1; [0.5, 0.5] es el centro), sin zona segura.
//    - desplazar: en unidades del dibujo. En instancias, el punto es donde quedan los pies.
//    zona_segura (de la escena): {arriba, abajo, izquierda, derecha} en fraccion del cuadro. Por defecto
//    5 % en horizontal; en vertical 6 % a los lados, 12 % arriba y 20 % abajo (la interfaz de las apps).
import {valorEn} from "../EditorEvento/Claves";

export const LUGARES = {
    "arriba-izquierda": [0, 0], "arriba-centro": [0.5, 0], "arriba-derecha": [1, 0],
    "centro-izquierda": [0, 0.5], "centro": [0.5, 0.5], "centro-derecha": [1, 0.5],
    "abajo-izquierda": [0, 1], "abajo-centro": [0.5, 1], "abajo-derecha": [1, 1],
};

export function zonaSeguraDefecto(tamano) {
    return tamano[1] > tamano[0] ? {arriba: 0.12, abajo: 0.2, izquierda: 0.06, derecha: 0.06} : {arriba: 0.05, abajo: 0.05, izquierda: 0.05, derecha: 0.05};
}

const esObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const num = (x) => typeof x === "number" && Number.isFinite(x);
const nombreDe = (o) => o && (o.nombre || o.instancia);

// Rectangulo que ve la camara (formato simple) en el instante t: {x0, y0, w, h}
export function camaraEn(camara, t = 0) {
    const cam = camara || {};
    const tam = Array.isArray(cam.tamano) ? cam.tamano : [1280, 720];
    const centro = Array.isArray(cam.centro) ? cam.centro : [tam[0] / 2, tam[1] / 2];
    const pista = (prop) => {
        const l = cam.claves && cam.claves[prop];
        return Array.isArray(l) && l.length ? l.map((k) => ({t: k[0], v: k[1], interp: k[2] || "lineal"})).sort((a, b) => a.t - b.t) : null;
    };
    const val = (prop, base) => { const p = pista(prop); return p ? valorEn(p, t) : base; };
    const zoom = Math.max(0.01, val("zoom", num(cam.zoom) ? cam.zoom : 1));
    const cx = val("x", centro[0]), cy = val("y", centro[1]);
    const w = tam[0] / zoom, h = tam[1] / zoom;
    return {x0: cx - w / 2, y0: cy - h / 2, w, h, tamano: tam};
}

// Fraccion [fx, fy] del cuadro para cuadro: "<lugar>" (con zona segura) | [fx, fy]; null si no es valido
export function fraccionCuadro(cuadro, tamano, zona) {
    if (typeof cuadro === "string") {
        const l = LUGARES[cuadro];
        if (!l) return null;
        const z = {...zonaSeguraDefecto(tamano), ...(zona || {})};
        return [z.izquierda + l[0] * (1 - z.izquierda - z.derecha), z.arriba + l[1] * (1 - z.arriba - z.abajo)];
    }
    return Array.isArray(cuadro) && cuadro.length === 2 && cuadro.every(num) ? cuadro : null;
}

// Alineacion de un texto anclado al cuadro: la que pide el lugar (si no la dice el texto)
export function alineacionLugar(cuadro) {
    const l = typeof cuadro === "string" && LUGARES[cuadro];
    if (!l) return {alinear: "centro", vertical: "centro"};
    return {alinear: ["izquierda", "centro", "derecha"][l[0] * 2], vertical: ["arriba", "centro", "abajo"][l[1] * 2]};
}

// Punto del mundo para en: {cuadro, desplazar?, t?}. errores: lista donde anotar.
export function puntoCuadro(en, camara, zona, errores, donde) {
    const r = camaraEn(camara, num(en.t) ? en.t : 0);
    const f = fraccionCuadro(en.cuadro, r.tamano, zona);
    if (!f) {
        errores.push(typeof en.cuadro === "string" ? `${donde}: cuadro "${en.cuadro}" desconocido (validos: ${Object.keys(LUGARES).join(", ")})`
            : `${donde}: cuadro es un lugar ("arriba-centro"...) o [fx, fy] (fraccion del cuadro)`);
        return [0, 0];
    }
    const d = Array.isArray(en.desplazar) && en.desplazar.length === 2 && en.desplazar.every(num) ? en.desplazar : [0, 0];
    if (en.desplazar !== undefined && d !== en.desplazar) errores.push(`${donde}: desplazar es [dx, dy]`);
    const red = (v) => Math.round(v * 100) / 100;
    return [red(r.x0 + f[0] * r.w + d[0]), red(r.y0 + f[1] * r.h + d[1])];
}

// Mezcla de un nivel: lista de objetos por nombre (o dialogos por indice) con sus parches
function parchar(lista, parches, clave, errores, donde) {
    if (!parches) return lista;
    if (!esObj(parches)) { errores.push(`${donde}: es {"<${clave}>": {...} | null}`); return lista; }
    const salida = [];
    const usados = new Set();
    (lista || []).forEach((o, i) => {
        const k = clave === "indice" ? String(i) : nombreDe(o);
        if (k === undefined || !(k in parches)) { salida.push(o); return; }
        usados.add(k);
        const p = parches[k];
        if (p === null) return;
        if (!esObj(p)) { errores.push(`${donde}.${k}: el parche es un objeto (o null para quitarlo)`); salida.push(o); return; }
        salida.push({...o, ...p});
    });
    for (const k of Object.keys(parches)) if (!usados.has(k)) errores.push(`${donde}: "${k}" no existe en la escena base`);
    return salida;
}

// La escena del formato elegido (o la base) con los "cuadro" resueltos. -> {def, errores}
export function prepararFormato(def, formato) {
    const errores = [];
    if (!esObj(def)) return {def, errores};
    let d = def;
    if (formato !== undefined && formato !== null) {
        const f = def.formatos && def.formatos[formato];
        if (!esObj(f)) errores.push(`formato "${formato}" no existe (hay: ${Object.keys(def.formatos || {}).join(", ") || "ninguno"})`);
        else {
            const {camara, objetos, efectos, dialogos, agregar, ...resto} = f;
            d = {...def, ...resto};
            if (camara !== undefined) d.camara = esObj(camara) ? {...(def.camara || {}), ...camara} : (errores.push(`formatos.${formato}.camara es un objeto`), def.camara);
            d.objetos = parchar(def.objetos, objetos, "nombre", errores, `formatos.${formato}.objetos`);
            d.efectos = parchar(def.efectos, efectos, "nombre", errores, `formatos.${formato}.efectos`);
            d.dialogos = parchar(def.dialogos, dialogos, "indice", errores, `formatos.${formato}.dialogos`);
            if (agregar !== undefined) {
                if (!esObj(agregar)) errores.push(`formatos.${formato}.agregar es {objetos?, efectos?, dialogos?}`);
                else for (const k of ["objetos", "efectos", "dialogos"]) if (agregar[k]) d[k] = [...(d[k] || []), ...agregar[k]];
            }
            if (d.efectos && !d.efectos.length && !def.efectos) delete d.efectos;
            if (d.dialogos && !d.dialogos.length && !def.dialogos) delete d.dialogos;
        }
    }
    if (d.formatos !== undefined) { d = {...d}; delete d.formatos; }
    // posiciones relativas al cuadro
    const zona = d.zona_segura;
    if (zona !== undefined && !(esObj(zona) && Object.values(zona).every((v) => num(v) && v >= 0 && v < 0.5))) errores.push("zona_segura es {arriba, abajo, izquierda, derecha} en fraccion del cuadro (0 a 0.5)");
    const resolver = (lista, nombre) => (lista || []).map((o, i) => {
        if (!o || !esObj(o.en)) return o;
        const donde = `${nombre}[${i}]${nombreDe(o) ? ` (${nombreDe(o)})` : ""}`;
        if (o.en.cuadro === undefined) { errores.push(`${donde}: en es [x, y] o {cuadro, desplazar?, t?}`); return o; }
        // textos: se quedan PEGADOS a la pantalla (los ubica Dialogos.js en cada cuadro); aqui solo se validan
        if (nombre === "dialogos") {
            if (o.estilo !== "texto") return o;
            if (o.quien !== undefined) errores.push(`${donde}: un texto con quien va relativo a su objeto; en: {cuadro} es solo sin quien`);
            if (o.en.t !== undefined) errores.push(`${donde}: un texto con en: {cuadro} sigue a la camara siempre (sin t)`);
            if (!fraccionCuadro(o.en.cuadro, [16, 9], zona)) errores.push(`${donde}: cuadro "${o.en.cuadro}" desconocido (validos: ${Object.keys(LUGARES).join(", ")} o [fx, fy])`);
            if (o.en.desplazar !== undefined && !(Array.isArray(o.en.desplazar) && o.en.desplazar.length === 2 && o.en.desplazar.every(num))) errores.push(`${donde}: desplazar es [dx, dy]`);
            return o;
        }
        return {...o, en: puntoCuadro(o.en, d.camara, zona, errores, donde)};
    });
    if ([d.objetos, d.efectos, d.dialogos].some((l) => (l || []).some((o) => o && esObj(o.en)))) {
        d = {...d, objetos: resolver(d.objetos, "objetos"), ...(d.efectos ? {efectos: resolver(d.efectos, "efectos")} : {}),
            ...(d.dialogos ? {dialogos: resolver(d.dialogos, "dialogos")} : {})};
    }
    return {def: d, errores};
}
