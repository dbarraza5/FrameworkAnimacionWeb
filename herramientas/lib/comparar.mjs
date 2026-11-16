// Compara dos documentos de eventos "por lo que significan" (Fase A1): mismos grupos con
// el mismo dibujo, pintado, transformacion, claves, instancia, efecto, fisica y eventos.
// Ignora lo que no cambia el resultado: _id, nombres internos de figuras, orden de los
// grupos, una transformacion identidad frente a ninguna, nivel de fisica 1 por defecto.
// Devuelve una lista de diferencias (vacia = equivalentes).

const r3 = (v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v);

// JSON con claves ordenadas (el orden de los campos no importa)
const estable = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));

function sinIds(o) {
    return JSON.parse(JSON.stringify(o ?? null, (k, v) => (k === "_id" ? undefined : v)));
}

// dibujo del grupo: recorrido de puntos de cada contorno (independiente de los nombres)
function dibujo(g) {
    const figs = new Map((g.lista_figuras || []).map((f) => [f.nombre, f]));
    const usados = new Set();
    const pint = (g.lista_pintado || []).map((p) => ({color: p.color, visible: p.visible !== false,
        contornos: (p.elementos || []).map((c) => c.map((e) => {
            usados.add(e.nombre);
            const f = figs.get(e.nombre);
            if (!f) return ["?", e.nombre];
            const a = f.atributos || {};
            if (f.tipo_figura === "RECTA") {
                const k = e.componente === "PUNTO2" ? 2 : 1;
                return [r3((a.cx || 0) + a["x" + k]), r3((a.cy || 0) + a["y" + k])];
            }
            return [f.tipo_figura, e.componente, ...Object.values(a).map(r3)];
        }))}));
    // figuras que no estan en ningun contorno (se dibujan como trazo)
    const sueltas = (g.lista_figuras || []).filter((f) => !usados.has(f.nombre))
        .map((f) => [f.tipo_figura, ...Object.entries(f.atributos || {}).sort().map(([k, v]) => `${k}=${r3(v)}`)]);
    const vacio = !(g.lista_figuras || []).length;
    return {pint: vacio ? [] : pint, sueltas};
}

function transformacion(t) {
    if (!t) return null;
    const n = {rotacion: t.rotacion || 0, escala_x: t.escala_x ?? 1, escala_y: t.escala_y ?? 1, ancla_x: t.ancla_x || 0, ancla_y: t.ancla_y || 0};
    const identidad = !n.rotacion && n.escala_x === 1 && n.escala_y === 1 && !n.ancla_x && !n.ancla_y;
    return identidad ? null : Object.fromEntries(Object.entries(n).map(([k, v]) => [k, r3(v)]));
}

function claves(c) {
    if (!c) return null;
    const r = {};
    for (const k of Object.keys(c).sort()) r[k] = c[k].map((x) => [x.t, r3(x.v), x.interp || "lineal"]);
    return Object.keys(r).length ? r : null;
}

// sonido: los ids de los clips son internos (como los nombres de figuras); se ignoran
const sinIdClip = (o) => JSON.parse(JSON.stringify(o ?? null, (k, v) => (k === "_id" ? undefined : v &&
    typeof v === "object" && !Array.isArray(v) && typeof v.sonido === "string" && "t" in v ? {...v, id: undefined} : v)));
const audioInstancia = (i) => {
    if (!i) return null;
    const a = i.audio && Object.keys(sinIds(i.audio)).length ? sinIds(i.audio) : undefined;
    return sinIds({...i, nombre: undefined, audio: a});
};

export function canonico(g, {efectoDefecto} = {}) {
    return {
        padre: g.nodo_padre, visible: g.visible !== false, color: g.color, cx: r3(g.cx), cy: r3(g.cy), capa: g.capa,
        clases: [...(g.clases || [])].sort(), dibujo: dibujo(g), transformacion: transformacion(g.transformacion),
        claves: claves(g.claves), claves_bucle: g.claves_bucle || null, camara: sinIds(g.camara),
        instancia: audioInstancia(g.instancia),
        sonidos: g.sonidos ? sinIdClip(g.sonidos) : null, sonido_marca: g.sonido_marca || null,
        plano: g.plano || 0, fisica: g.fisica ? {nivel: 1, ...sinIds(g.fisica)} : null,
        // un parametro de efecto que falta vale su valor por defecto (asi lo lee el motor)
        efecto: g.efecto && efectoDefecto ? sinIds({...efectoDefecto(g.efecto.tipo), ...g.efecto}) : sinIds(g.efecto),
        opacidad: g.opacidad ?? null,
    };
}

export function diferencias(a, b, opciones = {}) {
    const d = [];
    const ga = new Map((a.grupos_figuras || []).map((g) => [g.nombre, g]));
    const gb = new Map((b.grupos_figuras || []).map((g) => [g.nombre, g]));
    for (const n of ga.keys()) if (!gb.has(n)) d.push(`falta el grupo "${n}"`);
    for (const n of gb.keys()) if (!ga.has(n)) d.push(`sobra el grupo "${n}"`);
    for (const [n, g] of ga) {
        if (!gb.has(n)) continue;
        const ca = canonico(g, opciones), cb = canonico(gb.get(n), opciones);
        for (const k of Object.keys(ca)) {
            const x = estable(ca[k]), y = estable(cb[k]);
            if (x !== y) d.push(`${n}.${k}: ${x.slice(0, 120)} != ${y.slice(0, 120)}`);
        }
    }
    const ea = estable(sinIdClip(a.eventos)), eb = estable(sinIdClip(b.eventos));
    if (ea !== eb) d.push(`eventos distintos: ${ea.slice(0, 160)} != ${eb.slice(0, 160)}`);
    const sa = estable(sinIdClip(a.escena || {})), sb = estable(sinIdClip(b.escena || {}));
    if (sa !== sb) d.push(`escena distinta: ${sa} != ${sb}`);
    return d;
}
