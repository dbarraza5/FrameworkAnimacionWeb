// Fase A1: formato del editor -> formato SIMPLE (lo inverso de Compilador.js).
//
// Sirve para que el asistente lea una escena o un asset existente en pocas lineas, lo
// modifique y lo vuelva a compilar (`autoria.mjs descompilar`). La vuelta es exacta:
// compilar(descompilar(doc)) da los mismos grupos, figuras, pintado, transformaciones,
// claves, instancias, efectos y eventos (lo comprueba herramientas/pruebas/).
//
// - Un grupo con un solo contorno de RECTAs encadenadas (lo normal) -> `poligono`.
//   Cualquier otra cosa (circulos, varios contornos...) -> `crudo` (figuras tal cual).
// - Los eventos se copian tal cual si no son solo el EventoGeneral vacio.
// - Los campos que el formato no conoce se informan en `avisos` (no se pierden en silencio).
//
// nombreAsset(id_eventos) -> nombre del asset (lo da quien llama, con el catalogo).

import {efectoDefecto} from "../EditorEvento/Fisica";

const CONOCIDOS = new Set(["_id", "nombre", "nodo_padre", "visible", "color", "cx", "cy", "capa", "clases",
    "lista_figuras", "lista_pintado", "transformacion", "claves", "claves_bucle", "camara", "instancia",
    "plano", "fisica", "efecto", "opacidad"]);
const CLASES_PROPIAS = new Set(["root", "camara", "efecto"]);
const r4 = (v) => Math.round(v * 10000) / 10000;
const igual = (a, b) => Math.abs(a - b) < 1e-6;

function sinIds(o) {
    return JSON.parse(JSON.stringify(o, (k, v) => (k === "_id" ? undefined : v)));
}

// lista_figuras + lista_pintado -> puntos del poligono, o null si no es un poligono simple
function poligonoDe(g) {
    const figs = g.lista_figuras || [], pint = g.lista_pintado || [];
    if (!figs.length || pint.length !== 1 || pint[0].visible === false) return null;
    const conts = pint[0].elementos || [];
    if (conts.length !== 1) return null;
    const c = conts[0];
    if (c.length !== figs.length || c.length < 3) return null;
    const porNombre = new Map(figs.map((f) => [f.nombre, f]));
    const pts = [];
    for (const e of c) {
        const f = porNombre.get(e.nombre);
        if (!f || f.tipo_figura !== "RECTA" || e.componente !== "PUNTO1") return null;
        const a = f.atributos;
        pts.push({p1: [a.cx + a.x1, a.cy + a.y1], p2: [a.cx + a.x2, a.cy + a.y2]});
    }
    // cerrado y encadenado: el PUNTO2 de cada recta es el PUNTO1 de la siguiente
    for (let i = 0; i < pts.length; i++) {
        const b = pts[(i + 1) % pts.length].p1, a2 = pts[i].p2;
        if (!igual(a2[0], b[0]) || !igual(a2[1], b[1])) return null;
    }
    return pts.map((p) => [r4(p.p1[0]), r4(p.p1[1])]);
}

const clavesSimple = (claves, ajuste) => {
    if (!claves) return undefined;
    const r = {};
    for (const [prop, pista] of Object.entries(claves)) {
        if (!Array.isArray(pista) || !pista.length) continue;
        r[prop] = pista.map((k) => {
            const v = ajuste ? ajuste(prop, k.v) : k.v;
            return k.interp && k.interp !== "lineal" ? [k.t, v, k.interp] : [k.t, v];
        });
    }
    return Object.keys(r).length ? r : undefined;
};

function avisarDesconocidos(g, avisos) {
    const extra = Object.keys(g).filter((k) => !CONOCIDOS.has(k));
    if (extra.length) avisos.push(`${g.nombre}: campos que el formato simple no guarda: ${extra.join(", ")}`);
}

// Forma + comunes de un grupo -> campos de la PARTE (sin nombre/en/partes)
function formaYComunes(g, p, avisos) {
    const pts = poligonoDe(g);
    const pintado = (g.lista_pintado || [])[0];
    if (pts) {
        p.poligono = pts;
        p.color = pintado.color;
        if (g.color !== pintado.color) p.borde = g.color;
    } else if ((g.lista_figuras || []).length) {
        p.crudo = sinIds({lista_figuras: g.lista_figuras, lista_pintado: g.lista_pintado});
        if (g.color && g.color !== "#2b2b2b") p.borde = g.color;
    } else if (g.color && g.color !== "#2b2b2b") {
        p.borde = g.color;
    }
    const clases = (g.clases || []).filter((c) => !CLASES_PROPIAS.has(c));
    if (clases.length) p.clases = clases;
    if (g.visible === false) p.visible = false;
    if (typeof g.opacidad === "number") p.opacidad = g.opacidad;
    avisarDesconocidos(g, avisos);
}

function transformacionParte(g, p) {
    const t = g.transformacion;
    if (!t) return;
    if (t.rotacion) p.rotacion = t.rotacion;
    const sx = t.escala_x ?? 1, sy = t.escala_y ?? 1;
    if (sx !== 1 || sy !== 1) p.escala = sx === sy ? sx : [sx, sy];
    if (t.ancla_x || t.ancla_y) p.pivote = [t.ancla_x || 0, t.ancla_y || 0];
    // una transformacion identidad sin claves de rotacion/escala no la crearia el compilador:
    // se marca con escala 1 explicita para que la vuelta sea exacta
    if (!p.rotacion && p.escala === undefined && !p.pivote && !(g.claves && ["rotacion", "escala_x", "escala_y"].some((k) => g.claves[k]))) p.escala = 1;
}

function parteDe(g, hijos, i, avisos) {
    const p = {nombre: g.nombre};
    if (g.cx || g.cy) p.en = [g.cx, g.cy];
    if (g.capa !== i) p.capa = g.capa;
    formaYComunes(g, p, avisos);
    transformacionParte(g, p);
    const cl = clavesSimple(g.claves);
    if (cl) p.claves = cl;
    if (g.claves_bucle) p.bucle = g.claves_bucle;
    const sub = partesDe(g.nombre, hijos, avisos);
    if (sub.length) p.partes = sub;
    return p;
}

function partesDe(padre, hijos, avisos) {
    return (hijos.get(padre) || []).map((g, i) => parteDe(g, hijos, i, avisos));
}

function mapaHijos(grupos) {
    const m = new Map();
    for (const g of grupos) {
        if (!m.has(g.nodo_padre)) m.set(g.nodo_padre, []);
        m.get(g.nodo_padre).push(g);
    }
    return m;
}

// duracion + eventos (solo si no son el EventoGeneral vacio que genera el compilador)
function eventosDe(doc, def) {
    const ev = doc.eventos || [];
    const g = ev.find((e) => e.nombre === "EventoGeneral");
    def.duracion = g ? g.tiempo_final : 1000;
    const vacio = ev.length === 1 && g && !(g.objetos || []).length && !(g.macros || []).length && !g.script &&
        g.tiempo_inicio === 0 && !g.bucle && g.nodo_padre === "Nodo_Default";
    if (!vacio) def.eventos = sinIds(ev);
}

export function esEscena(doc) {
    const gs = doc.grupos_figuras || [];
    return gs.some((g) => g.instancia || g.efecto || (g.clases || []).includes("camara")) ||
        Object.keys(doc.escena || {}).length > 0;
}

export function descompilar(doc, nombreAsset = () => null) {
    const avisos = [];
    const grupos = (doc.grupos_figuras || []).filter((g) => g.nombre !== "default");
    const def_ = (doc.grupos_figuras || []).find((g) => g.nombre === "default");
    if (def_ && (def_.lista_figuras || []).length) avisos.push("default: tiene figuras propias (se pierden)");
    const hijos = mapaHijos(grupos);

    if (!esEscena(doc)) {
        const def = {tipo: "asset", nombre: doc.nombre};
        eventosDe(doc, def);
        def.partes = partesDe("root", hijos, avisos);
        return {def, avisos};
    }

    const def = {tipo: "escena", nombre: doc.nombre};
    eventosDe(doc, def);
    const esc = doc.escena || {};
    if (esc.orden_profundidad) def.profundidad = true;
    if (esc.fisica && typeof esc.fisica.gravedad === "number") def.gravedad = esc.fisica.gravedad;
    const otros = Object.keys(esc).filter((k) => !["orden_profundidad", "fisica"].includes(k));
    if (otros.length) avisos.push(`escena: campos que el formato simple no guarda: ${otros.join(", ")}`);

    const raiz = hijos.get("root") || [];
    def.objetos = [];
    def.efectos = [];
    let capa = 1;                                    // el compilador numera objetos y efectos en orden
    for (const g of raiz) {
        if ((g.clases || []).includes("camara")) {
            const c = {centro: [g.cx, g.cy]};
            if (g.nombre !== "Cámara") c.nombre = g.nombre;
            if (g.capa !== 999) c.capa = g.capa;
            const cam = g.camara || {};
            if (cam.zoom !== undefined && cam.zoom !== 1) c.zoom = cam.zoom;
            if ((cam.ancho ?? 1280) !== 1280 || (cam.alto ?? 720) !== 720) c.tamano = [cam.ancho, cam.alto];
            const cl = clavesSimple(g.claves);
            if (cl) c.claves = cl;
            if (g.claves_bucle) c.bucle = g.claves_bucle;
            if ((hijos.get(g.nombre) || []).length) avisos.push(`${g.nombre}: la camara tiene hijos (se pierden)`);
            def.camara = c;
            continue;
        }
        if (g.efecto) {
            const base = efectoDefecto(g.efecto.tipo);
            const e = {tipo: g.efecto.tipo, nombre: g.nombre, en: [g.cx, g.cy]};
            for (const [k, v] of Object.entries(g.efecto)) if (k !== "tipo" && base[k] !== v) e[k] = v;
            if (g.capa !== capa) e.capa = g.capa;
            const cl = clavesSimple(g.claves);
            if (cl) e.claves = cl;
            if (g.claves_bucle) e.repetir = g.claves_bucle;
            def.efectos.push(e);
            capa++;
            continue;
        }
        // objeto: instancia o dibujo
        const t = g.transformacion || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0};
        const ax = t.ancla_x || 0, ay = t.ancla_y || 0;
        const o = {};
        if (g.instancia) {
            const i = g.instancia;
            o.instancia = nombreAsset(i.id_eventos) || i.nombre;
            if (!o.instancia) avisos.push(`${g.nombre}: no se encontro el nombre del asset ${i.id_eventos}`);
            o.nombre = g.nombre;
            if (i.evento && i.evento !== "EventoGeneral") o.evento = i.evento;
            if (i.bucle === false) o.bucle = false;
            if (i.desfase) o.desfase = i.desfase;
            if (i.version) o.version = i.version;
        } else {
            o.nombre = g.nombre;
        }
        o.en = [r4(g.cx + ax), r4(g.cy + ay)];
        if (ax || ay) o.ancla = [ax, ay];
        const sx = t.escala_x ?? 1, sy = t.escala_y ?? 1;
        if (sx < 0) o.espejo = true;
        if (Math.abs(sx) !== sy) o.escala = [Math.abs(sx), sy];
        else if (sy !== 1) o.escala = sy;
        if (t.rotacion) o.rotacion = t.rotacion;
        if (g.capa !== capa) o.capa = g.capa;
        if (g.plano) o.plano = g.plano;
        if (g.fisica) {
            const f = g.fisica, ks = Object.keys(f);
            o.fisica = ks.every((k) => k === "modo" || (k === "nivel" && f.nivel === 1)) ? f.modo : {...f};
        }
        if (!g.instancia) formaYComunes(g, o, avisos);
        else {
            if (g.visible === false) o.visible = false;
            if (typeof g.opacidad === "number") o.opacidad = g.opacidad;
            if (g.color && g.color !== "#2b2b2b") o.borde = g.color;
            avisarDesconocidos(g, avisos);
            if ((g.lista_figuras || []).length) avisos.push(`${g.nombre}: la instancia tiene figuras propias (se pierden)`);
        }
        const cl = clavesSimple(g.claves, (prop, v) => (prop === "x" ? v + ax : prop === "y" ? v + ay : v));
        if (cl) o.claves = cl;
        if (g.claves_bucle) o.repetir = g.claves_bucle;
        const sub = partesDe(g.nombre, hijos, avisos);
        if (sub.length) {
            if (g.instancia) avisos.push(`${g.nombre}: la instancia tiene hijos guardados (se pierden)`);
            else o.partes = sub;
        }
        def.objetos.push(o);
        capa++;
    }
    if (!def.efectos.length) delete def.efectos;
    return {def, avisos};
}
