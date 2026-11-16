// Fase A1 (planeacion_autoria_asistida.md): formato de escena SIMPLE -> formato del editor.
//
// Permite describir un asset o una escena en pocas lineas y obtener grupos_figuras
// (figuras RECTA por lado + pintado), eventos y configuracion de la escena, con
// validacion y mensajes claros. Modulo puro: lo usan el editor, la API y las
// herramientas de Node (herramientas/autoria.mjs).
//
// ASSET
//   {tipo: "asset", nombre, duracion?, partes: [PARTE...], eventos?: [...] (tal cual, si no es solo EventoGeneral)}
// PARTE (un grupo; se anidan con `partes`)
//   {nombre, en?: [x, y] (relativo al padre), capa?, color?, borde?, visible?, opacidad?,
//    poligono?: [[x,y]...] | rect?: [x0,y0,x1,y1] | circulo?: r | {r, ry?, lados?} | elipse?: [rx, ry]
//      | crudo?: {lista_figuras, lista_pintado} (figuras del editor tal cual), clases?: [..],
//    pivote?: [x, y], rotacion?, escala?: n | [sx, sy],
//    claves?: {prop: [[t, v, interp?]...]}, bucle?: "repetir"|"ida_vuelta"|"continuar",
//    giro?: {desde, hasta, ms, interp?, modo?}  (atajo: claves de rotacion en bucle)
//    partes?: [PARTE...]}
// ESCENA
//   {tipo: "escena", nombre, duracion, profundidad?: bool, gravedad?, eventos?: [...],
//    camara?: {centro: [x,y], zoom?, tamano?: [w,h], claves?, bucle?, temblor?, nombre?, capa?},
//    objetos: [OBJETO...], efectos?: [EFECTO...]}
// OBJETO
//   instancia: {instancia: "<nombre del asset>", nombre?, en: [x,y] (pies), ancla?: [x,y],
//               escala?: n | [sx, sy], espejo?, rotacion?, plano?, capa?, borde?, fisica?: "fijo"|"rigido"|"desarmar"|{...},
//               evento?, bucle?, desfase?, version?, opacidad?, visible?,
//               claves?: {x|y: [[t, v_pies, interp?]], ...}, repetir?}
//   dibujo:    {nombre, en, ancla?, una forma de PARTE y/o partes: [PARTE...], plano?, fisica?, claves?...}
// EFECTO
//   {tipo: explosion|tornado|disparo|viento|particulas, nombre?, en: [x,y], capa?, claves?, repetir?, ...parametros}
// Lo inverso (editor -> simple) esta en Descompilador.js.

import {TIPOS_EFECTO, MODOS_FISICA, efectoDefecto} from "../EditorEvento/Fisica";
import {PROPIEDADES, INTERPOLACIONES, MODOS_BUCLE} from "../EditorEvento/Claves";
import {GENERADORES, expandirGenerador, claveTemblor} from "./Generadores";

const FORMAS = ["poligono", "rect", "circulo", "elipse"];

class Errores {
    constructor() { this.errores = []; this.avisos = []; }
    error(donde, msj) { this.errores.push(`${donde}: ${msj}`); }
    aviso(donde, msj) { this.avisos.push(`${donde}: ${msj}`); }
}

const num = (v) => typeof v === "number" && Number.isFinite(v);
const par = (v) => Array.isArray(v) && v.length === 2 && num(v[0]) && num(v[1]);

// ---------------- geometria ----------------
function puntosDeForma(p, E, donde) {
    if (p.poligono !== undefined) {
        if (!Array.isArray(p.poligono) || p.poligono.length < 3 || !p.poligono.every(par)) {
            E.error(donde, "poligono necesita al menos 3 puntos [x, y]");
            return null;
        }
        return p.poligono.map(([x, y]) => [x, y]);
    }
    if (p.rect !== undefined) {
        if (!Array.isArray(p.rect) || p.rect.length !== 4 || !p.rect.every(num)) { E.error(donde, "rect es [x0, y0, x1, y1]"); return null; }
        const [x0, y0, x1, y1] = p.rect;
        return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    }
    if (p.circulo !== undefined || p.elipse !== undefined) {
        let rx, ry, n;
        if (p.elipse !== undefined) {
            if (!par(p.elipse)) { E.error(donde, "elipse es [rx, ry]"); return null; }
            [rx, ry] = p.elipse; n = 16;
        } else if (num(p.circulo)) { rx = ry = p.circulo; n = 14; }
        else if (p.circulo && num(p.circulo.r)) { rx = p.circulo.r; ry = num(p.circulo.ry) ? p.circulo.ry : rx; n = p.circulo.lados || 14; }
        else { E.error(donde, "circulo es un radio o {r, ry?, lados?}"); return null; }
        const pts = [];
        for (let i = 0; i < n; i++) {
            const a = i / n * 2 * Math.PI;
            pts.push([Math.round(rx * Math.cos(a) * 100) / 100, Math.round(ry * Math.sin(a) * 100) / 100]);
        }
        return pts;
    }
    return null;
}

// Poligono cerrado: una RECTA por lado; el pintado recorre el PUNTO1 de cada recta.
function figurasDePoligono(pts) {
    const lista_figuras = [], contorno = [];
    pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length];
        const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
        const nombre = "frec" + i;
        lista_figuras.push({nombre, tipo_figura: "RECTA",
            atributos: {x1: a[0] - cx, y1: a[1] - cy, x2: b[0] - cx, y2: b[1] - cy, cx, cy}});
        contorno.push({nombre, componente: "PUNTO1"});
    });
    return {lista_figuras, contorno};
}

function grupoBase(nombre, padre, cx, cy, capa) {
    return {nombre, nodo_padre: padre, visible: true, color: "#2b2b2b", cx, cy, capa, clases: [],
        lista_figuras: [], lista_pintado: [{color: "#000000", visible: true, elementos: [[]]}]};
}

// claves {prop: [[t, v, interp?]]} -> {prop: [{t, v, interp}]} (ordenadas), con validacion
function compilarClaves(claves, E, donde, ajuste) {
    if (!claves) return null;
    const r = {};
    for (const prop of Object.keys(claves)) {
        if (!PROPIEDADES[prop]) { E.error(donde, `propiedad animable desconocida "${prop}" (validas: ${Object.keys(PROPIEDADES).join(", ")})`); continue; }
        const lista = claves[prop];
        if (!Array.isArray(lista) || !lista.length) { E.error(donde, `claves.${prop} debe ser una lista de [t, valor, interp?]`); continue; }
        const pista = [];
        for (const k of lista) {
            if (!Array.isArray(k) || !num(k[0]) || !num(k[1])) { E.error(donde, `clave de ${prop} invalida: ${JSON.stringify(k)} (se espera [t_ms, valor, interp?])`); continue; }
            const interp = k[2] || "lineal";
            if (!INTERPOLACIONES[interp]) E.error(donde, `interpolacion "${interp}" desconocida (validas: ${Object.keys(INTERPOLACIONES).join(", ")})`);
            pista.push({t: Math.round(k[0]), v: ajuste ? ajuste(prop, k[1]) : k[1], interp});
        }
        pista.sort((a, b) => a.t - b.t);
        for (let i = 1; i < pista.length; i++) if (pista[i].t === pista[i - 1].t) E.error(donde, `dos claves de ${prop} en t=${pista[i].t}`);
        if (pista.length) r[prop] = pista;
    }
    return Object.keys(r).length ? r : null;
}

function aplicarComunes(g, p, E, donde) {
    if (p.visible === false) g.visible = false;
    if (num(p.opacidad)) g.opacidad = Math.max(0, Math.min(1, p.opacidad));
    const tieneT = p.pivote || num(p.rotacion) || p.escala !== undefined || p.giro || (p.claves && ["rotacion", "escala_x", "escala_y"].some((k) => p.claves[k]));
    if (tieneT) {
        const esc = Array.isArray(p.escala) ? p.escala : [p.escala ?? 1, p.escala ?? 1];
        const piv = p.pivote ? p.pivote : [0, 0];
        if (p.pivote && !par(p.pivote)) E.error(donde, "pivote es [x, y]");
        g.transformacion = {rotacion: num(p.rotacion) ? p.rotacion : 0, escala_x: esc[0], escala_y: esc[1],
            ancla_x: piv[0] || 0, ancla_y: piv[1] || 0};
    }
    let claves = compilarClaves(p.claves, E, donde);
    if (p.giro) {
        const gi = p.giro;
        if (!num(gi.desde) || !num(gi.hasta) || !num(gi.ms)) E.error(donde, "giro es {desde, hasta, ms, interp?, modo?}");
        else {
            claves = {...(claves || {}), rotacion: [{t: 0, v: gi.desde, interp: gi.interp || "lineal"}, {t: gi.ms, v: gi.hasta, interp: gi.interp || "lineal"}]};
            p = {...p, bucle: p.bucle || gi.modo || "repetir"};
        }
    }
    if (claves) g.claves = claves;
    if (p.bucle) {
        if (!MODOS_BUCLE[p.bucle]) E.error(donde, `bucle "${p.bucle}" desconocido (validos: ${Object.keys(MODOS_BUCLE).join(", ")})`);
        else if (p.bucle !== "mantener") g.claves_bucle = p.bucle;
    }
}

// Forma de una parte (o de un objeto dibujado) -> figuras y pintado del grupo.
// `crudo: {lista_figuras, lista_pintado}` copia figuras del editor tal cual (lo usa el
// descompilador para lo que no es un poligono simple: circulos, varios contornos...).
// Devuelve true si el grupo quedo con algo dibujado.
function aplicarForma(g, p, E, donde) {
    if (Array.isArray(p.clases) && p.clases.length) g.clases = [...p.clases];
    const formas = FORMAS.filter((f) => p[f] !== undefined);
    if (p.crudo !== undefined) formas.push("crudo");
    if (formas.length > 1) E.error(donde, `una parte tiene una sola forma (tiene ${formas.join(", ")}); usa partes hijas para combinar`);
    if (p.crudo !== undefined) {
        const c = p.crudo;
        if (!c || !Array.isArray(c.lista_figuras) || !Array.isArray(c.lista_pintado)) { E.error(donde, "crudo es {lista_figuras, lista_pintado}"); return false; }
        g.lista_figuras = JSON.parse(JSON.stringify(c.lista_figuras));
        g.lista_pintado = JSON.parse(JSON.stringify(c.lista_pintado));
        if (p.borde) g.color = p.borde;
        return g.lista_figuras.length > 0;
    }
    const pts = puntosDeForma(p, E, donde);
    if (pts) {
        const {lista_figuras, contorno} = figurasDePoligono(pts);
        g.lista_figuras = lista_figuras;
        g.lista_pintado = [{color: p.color || "#888888", visible: true, elementos: [contorno]}];
        g.color = p.borde || p.color || "#2b2b2b";
        return true;
    }
    if (p.borde) g.color = p.borde;
    return false;
}

// Partes (recursivo) -> lista de grupos
function compilarPartes(partes, padre, E, nombres, salida, prefijo) {
    (partes || []).forEach((p, i) => {
        const donde = `${prefijo}${p && p.nombre ? p.nombre : "#" + i}`;
        if (!p || typeof p !== "object") { E.error(donde, "cada parte es un objeto"); return; }
        if (!p.nombre || typeof p.nombre !== "string") { E.error(donde, "falta nombre"); return; }
        if (nombres.has(p.nombre)) { E.error(donde, `nombre repetido "${p.nombre}"`); return; }
        nombres.add(p.nombre);
        const en = p.en === undefined ? [0, 0] : p.en;
        if (!par(en)) E.error(donde, "en es [x, y]");
        const g = grupoBase(p.nombre, padre, en[0] || 0, en[1] || 0, num(p.capa) ? p.capa : i);
        if (!aplicarForma(g, p, E, donde) && !(p.partes && p.partes.length)) {
            E.aviso(donde, "parte sin forma ni partes (no se dibuja nada)");
        }
        aplicarComunes(g, p, E, donde);
        salida.push(g);
        compilarPartes(p.partes, p.nombre, E, nombres, salida, donde + " › ");
    });
}

const grupoDefault = () => ({nombre: "default", nodo_padre: "root", visible: true, color: "#000000", cx: 0, cy: 0,
    capa: 0, clases: ["root"], lista_figuras: [], lista_pintado: [{color: "#0d67c8", visible: true, elementos: [[]]}]});

const eventoGeneral = (fin) => ({nombre: "EventoGeneral", nodo_padre: "Nodo_Default", visible: true, bucle: false,
    tiempo_bucle: 0, tiempo_inicio: 0, tiempo_final: fin, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0,
    objetos: [], macros: [], script: null});

// ---------------- sonido (planeacion_sonido.md) ----------------
// Por NOMBRE de sonido del proyecto; buscarSonido(nombre) -> {id} | null.
//   sonidos: [{sonido, t?, volumen?, pan?, recorte?, bucle?, fundido?, evento?}]   (clips)
//   reacciones: {al_disparar: "Bang" | {sonido, volumen?, pan?, max?}, ...}
//   sonido: "lleva" | "no_lleva" (marca)          marcas: {<evento>: "lleva" | "no_lleva"}
//   audio: {volumen?, silencio?}  (instancias: ajuste del sonido heredado de su asset)
export const REACCIONES_VALIDAS = {explosion: ["al_detonar"], disparo: ["al_disparar", "al_impactar"], objeto: ["al_soltarse", "al_tocar_suelo"]};
const MARCAS_SONIDO = ["lleva", "no_lleva"];
const CAMPOS_CLIP = ["sonido", "t", "volumen", "pan", "recorte", "bucle", "fundido", "evento"];

class Sonidos {
    constructor(buscar, E) { this.buscar = buscar; this.E = E; this.n = 0; }
    id(nombre, donde) {
        if (!this.buscar) { this.E.error(donde, "hay sonidos pero no hay catalogo de sonidos (compilar con buscarSonido)"); return null; }
        const s = typeof nombre === "string" ? this.buscar(nombre) : null;
        if (!s) this.E.error(donde, `no existe el sonido "${nombre}" en el proyecto (subelo, o crealo pendiente: autoria.mjs sonido-pendiente "${nombre}")`);
        return s ? String(s.id) : null;
    }
    clips(lista, donde, dur) {
        if (lista === undefined) return [];
        if (!Array.isArray(lista)) { this.E.error(donde, "sonidos es una lista de clips [{sonido, t, ...}]"); return []; }
        const r = [];
        lista.forEach((c, i) => {
            const d = `${donde} › sonido #${i}`;
            if (!c || typeof c !== "object") { this.E.error(d, "cada clip es {sonido: <nombre>, t: <ms>, ...}"); return; }
            for (const k of Object.keys(c)) if (!CAMPOS_CLIP.includes(k)) this.E.aviso(d, `campo "${k}" desconocido (validos: ${CAMPOS_CLIP.join(", ")})`);
            const id = this.id(c.sonido, d);
            if (!id) return;
            const t = num(c.t) ? Math.round(c.t) : 0;
            if (dur && t > dur) this.E.aviso(d, `empieza en ${t} ms, despues del final (${dur} ms): no va a sonar`);
            const clip = {id: "s" + ++this.n, sonido: id, t};
            for (const k of ["volumen", "pan", "recorte", "bucle", "fundido"]) if (c[k] !== undefined) clip[k] = c[k];
            r.push({clip, evento: c.evento});
        });
        return r;
    }
    reacciones(obj, validas, donde) {
        if (!obj) return null;
        const r = {};
        for (const [k, v] of Object.entries(obj)) {
            if (!validas.includes(k)) { this.E.error(donde, `reaccion "${k}" no aplica aqui (validas: ${validas.join(", ") || "ninguna"})`); continue; }
            const x = typeof v === "string" ? {sonido: v} : v;
            const id = this.id(x && x.sonido, `${donde} › ${k}`);
            if (!id) continue;
            r[k] = {...x, sonido: id};
        }
        return Object.keys(r).length ? r : null;
    }
    marca(v, donde) {
        if (v === undefined) return null;
        if (!MARCAS_SONIDO.includes(v)) { this.E.error(donde, `sonido (marca) es "lleva" o "no_lleva", no "${v}"`); return null; }
        return v;
    }
    // clips a los eventos (clip.evento o el evento por defecto) y marcas por evento
    aEventos(eventos, clips, marcas, porDefecto, donde) {
        const ev = (n) => eventos.find((e) => e.nombre === n);
        for (const {clip, evento} of clips) {
            const e = ev(evento || porDefecto);
            if (!e) { this.E.error(donde, `no existe el evento "${evento}" (hay: ${eventos.map((x) => x.nombre).join(", ")})`); continue; }
            e.sonidos = [...(e.sonidos || []), clip];
        }
        for (const [n, m] of Object.entries(marcas || {})) {
            const e = ev(n);
            if (!e) { this.E.error(donde, `marcas: no existe el evento "${n}"`); continue; }
            const v = this.marca(m, donde);
            if (v) e.sonido_marca = v;
        }
    }
    // sonidos, reacciones y marca de un objeto o efecto
    grupo(g, o, validas, donde, dur) {
        const clips = this.clips(o.sonidos, donde, dur).map((x) => x.clip);
        const rx = this.reacciones(o.reacciones, validas, donde);
        if (clips.length || rx) g.sonidos = {...(clips.length ? {clips} : {}), ...(rx ? {reacciones: rx} : {})};
        const m = this.marca(o.sonido, donde);
        if (m) g.sonido_marca = m;
    }
}

// ---------------- asset ----------------
export function compilarAsset(def, buscarSonido) {
    const E = new Errores();
    // Fase A5: {generador: "casa", parametros: {...}} -> partes del generador
    if (def && def.generador) {
        const ex = expandirGenerador(def);
        if (!ex) {
            E.error("asset", `generador "${def.generador}" desconocido (validos: ${Object.keys(GENERADORES).join(", ")})`);
            return {ok: false, errores: E.errores, avisos: E.avisos, resultado: null};
        }
        const desconocidos = Object.keys(def.parametros || {}).filter((k) => !(k in GENERADORES[def.generador].parametros));
        for (const k of desconocidos) E.aviso("asset", `parametro "${k}" no existe en el generador ${def.generador} (validos: ${Object.keys(GENERADORES[def.generador].parametros).join(", ")})`);
        // parametros con valores fijos (opciones del generador)
        for (const [k, lista] of Object.entries(GENERADORES[def.generador].opciones || {})) {
            const v = (def.parametros || {})[k];
            if (v !== undefined && !lista.includes(v)) E.error("asset", `parametro "${k}" = "${v}" no es valido en el generador ${def.generador} (validos: ${lista.join(", ")})`);
        }
        if (E.errores.length) return {ok: false, errores: E.errores, avisos: E.avisos, resultado: null};
        const r = compilarAsset({...def, generador: undefined, partes: [...ex.partes, ...(def.partes || [])], duracion: ex.duracion}, buscarSonido);
        return {...r, avisos: [...E.avisos, ...r.avisos]};
    }
    if (!def || def.tipo !== "asset") E.error("asset", 'tipo debe ser "asset"');
    if (!def || !def.nombre) E.error("asset", "falta nombre");
    const grupos = [grupoDefault()];
    const nombres = new Set(["default"]);
    compilarPartes(def && def.partes, "root", E, nombres, grupos, "");
    if (grupos.length === 1) E.error("asset", "no tiene partes");
    const dur = def && num(def.duracion) ? def.duracion : 1000;
    const eventos = def && def.eventos ? JSON.parse(JSON.stringify(def.eventos)) : [eventoGeneral(dur)];
    const escena = {};
    if (def && (def.sonidos || def.marcas || def.reacciones)) {
        const S = new Sonidos(buscarSonido, E);
        S.aEventos(eventos, S.clips(def.sonidos, "asset", null), def.marcas, "EventoGeneral", "asset");
        const rx = S.reacciones(def.reacciones, REACCIONES_VALIDAS.objeto, "asset › reacciones");
        if (rx) escena.reacciones = rx;
    }
    return {ok: !E.errores.length, errores: E.errores, avisos: E.avisos,
        resultado: {nombre: def && def.nombre, grupos_figuras: grupos, eventos, escena}};
}

// ---------------- escena ----------------
// buscarAsset(nombre) -> {id} | null  (lo da quien llama: la API o la herramienta)
export function compilarEscena(def, buscarAsset, buscarSonido) {
    const E = new Errores();
    const S = new Sonidos(buscarSonido, E);
    if (!def || def.tipo !== "escena") E.error("escena", 'tipo debe ser "escena"');
    if (!def || !def.nombre) E.error("escena", "falta nombre");
    const dur = def && num(def.duracion) ? def.duracion : null;
    if (!dur) E.error("escena", "falta duracion (ms)");
    const grupos = [grupoDefault()];
    const nombres = new Set(["default"]);
    let capa = 1;
    const unico = (base) => { let n = base, k = 2; while (nombres.has(n)) n = `${base}_${k++}`; nombres.add(n); return n; };

    // camara
    const cam = (def && def.camara) || {};
    const centro = cam.centro || [640, 360];
    if (!par(centro)) E.error("camara", "centro es [x, y]");
    const tam = cam.tamano || [1280, 720];
    const gcam = {...grupoBase(unico(cam.nombre || "Cámara"), "root", centro[0], centro[1], num(cam.capa) ? cam.capa : 999), color: "#f0b429",
        clases: ["camara"], camara: {ancho: tam[0], alto: tam[1], zoom: num(cam.zoom) ? cam.zoom : 1}};
    // Fase A5: receta "temblor": {desde, hasta, amplitud?} -> claves de x / y de la camara
    const claves_cam = cam.temblor ? {...(cam.claves || {}), ...claveTemblor(centro, cam.temblor)} : cam.claves;
    if (cam.temblor && !(num(cam.temblor.desde) && num(cam.temblor.hasta))) E.error("camara", "temblor es {desde, hasta, amplitud?} en ms");
    const ccam = compilarClaves(claves_cam, E, "camara");
    if (ccam) gcam.claves = ccam;
    if (cam.bucle && cam.bucle !== "mantener") gcam.claves_bucle = cam.bucle;
    grupos.push(gcam);

    const fisica = (f, donde) => {
        if (!f) return null;
        const o = typeof f === "string" ? {modo: f} : f;
        if (!MODOS_FISICA[o.modo]) { E.error(donde, `fisica "${o.modo}" desconocida (validas: ${Object.keys(MODOS_FISICA).join(", ")})`); return null; }
        return o.modo === "fijo" ? null : {nivel: 1, ...o};
    };

    ((def && def.objetos) || []).forEach((o, i) => {
        const donde = `objeto ${o && (o.nombre || o.instancia) ? (o.nombre || o.instancia) : "#" + i}`;
        if (!o || typeof o !== "object") { E.error(donde, "cada objeto es un objeto JSON"); return; }
        const en = o.en || [0, 0];
        if (!par(en)) E.error(donde, "en es [x, y] (donde quedan los pies)");
        const ancla = o.ancla || [0, 0];
        if (!par(ancla)) E.error(donde, "ancla es [x, y]");
        if (o.escala !== undefined && !num(o.escala) && !par(o.escala)) E.error(donde, "escala es un numero o [sx, sy]");
        const [esx, esy] = par(o.escala) ? o.escala : [num(o.escala) ? o.escala : 1, num(o.escala) ? o.escala : 1];
        const capa_o = num(o.capa) ? o.capa : capa;
        capa++;
        let g;
        if (o.instancia) {
            const a = buscarAsset ? buscarAsset(o.instancia) : null;
            if (!a) { E.error(donde, `no existe el asset "${o.instancia}"`); return; }
            g = grupoBase(unico(o.nombre || o.instancia.replace(/[^A-Za-z0-9_-]+/g, "_")), "root", en[0] - ancla[0], en[1] - ancla[1], capa_o);
            g.instancia = {id_eventos: a.id, nombre: o.instancia, evento: o.evento || "EventoGeneral",
                bucle: o.bucle !== false, desfase: num(o.desfase) ? o.desfase : 0};
            if (o.version) g.instancia.version = o.version;
            if (a.eventos && o.evento && !a.eventos.includes(o.evento)) E.error(donde, `el asset "${o.instancia}" no tiene el evento "${o.evento}" (tiene: ${a.eventos.join(", ")})`);
        } else if (o.partes || o.crudo !== undefined || FORMAS.some((f) => o[f] !== undefined)) {
            if (!o.nombre) { E.error(donde, "un objeto dibujado necesita nombre"); return; }
            if (nombres.has(o.nombre)) { E.error(donde, `nombre repetido "${o.nombre}"`); return; }
            nombres.add(o.nombre);
            g = grupoBase(o.nombre, "root", en[0] - ancla[0], en[1] - ancla[1], capa_o);
            aplicarForma(g, o, E, donde);
            const hijos = [];
            compilarPartes(o.partes, o.nombre, E, nombres, hijos, donde + " › ");
            grupos.push(g, ...hijos);
        } else {
            E.error(donde, "un objeto es una instancia (instancia: nombre del asset) o un dibujo (una forma y/o partes: [...])");
            return;
        }
        g.transformacion = {rotacion: num(o.rotacion) ? o.rotacion : 0, escala_x: (o.espejo ? -1 : 1) * esx, escala_y: esy,
            ancla_x: ancla[0], ancla_y: ancla[1]};
        if (num(o.plano) && o.plano !== 0) g.plano = o.plano;
        if (num(o.opacidad)) g.opacidad = o.opacidad;
        if (o.visible === false) g.visible = false;
        if (o.instancia && o.borde) g.color = o.borde;
        const f = fisica(o.fisica, donde);
        if (f) g.fisica = f;
        // claves de x / y en coordenadas de los pies -> origen del contenedor
        const ajuste = (prop, v) => (prop === "x" ? v - ancla[0] : prop === "y" ? v - ancla[1] : v);
        const cl = compilarClaves(o.claves, E, donde, ajuste);
        if (cl) {
            g.claves = cl;
            for (const p in cl) if (cl[p].some((k) => k.t > dur)) E.aviso(donde, `hay claves de ${p} despues del final de la escena (${dur} ms)`);
        }
        if (o.repetir) {
            if (!MODOS_BUCLE[o.repetir]) E.error(donde, `repetir "${o.repetir}" desconocido`);
            else if (o.repetir !== "mantener") g.claves_bucle = o.repetir;
        }
        S.grupo(g, o, REACCIONES_VALIDAS.objeto, donde, dur);
        if (o.audio) {
            if (!o.instancia) E.aviso(donde, "audio (ajuste del sonido heredado) solo sirve en instancias");
            else g.instancia.audio = {...(num(o.audio.volumen) ? {volumen: o.audio.volumen} : {}), ...(o.audio.silencio ? {silencio: true} : {})};
        }
        if (o.instancia) grupos.push(g);
    });

    ((def && def.efectos) || []).forEach((ef, i) => {
        const donde = `efecto ${ef && (ef.nombre || ef.tipo) ? (ef.nombre || ef.tipo) : "#" + i}`;
        if (!ef || !TIPOS_EFECTO[ef.tipo]) { E.error(donde, `tipo de efecto desconocido "${ef && ef.tipo}" (validos: ${Object.keys(TIPOS_EFECTO).join(", ")})`); return; }
        const en = ef.en || [0, 0];
        if (!par(en)) E.error(donde, "en es [x, y]");
        const params = {...efectoDefecto(ef.tipo)};
        const validos = new Set(TIPOS_EFECTO[ef.tipo].params.map((p) => p[0]));
        for (const k of Object.keys(ef)) {
            if (["tipo", "nombre", "en", "claves", "repetir", "capa", "sonidos", "reacciones", "sonido"].includes(k)) continue;
            if (!validos.has(k)) E.aviso(donde, `parametro "${k}" no existe en ${ef.tipo} (se ignora); validos: ${[...validos].join(", ")}`);
            else params[k] = ef[k];
        }
        const g = {...grupoBase(unico(ef.nombre || TIPOS_EFECTO[ef.tipo].etiqueta), "root", en[0], en[1], num(ef.capa) ? ef.capa : capa),
            color: "#ff8a3d", clases: ["efecto"], efecto: params};
        const cl = compilarClaves(ef.claves, E, donde);
        if (cl) g.claves = cl;
        if (ef.repetir && ef.repetir !== "mantener") g.claves_bucle = ef.repetir;
        S.grupo(g, ef, REACCIONES_VALIDAS[ef.tipo] || [], donde, dur);
        capa++;
        grupos.push(g);
    });

    const escena = {};
    if (def && def.profundidad) escena.orden_profundidad = true;
    if (def && num(def.gravedad)) escena.fisica = {gravedad: def.gravedad};
    const eventos = def && Array.isArray(def.eventos) ? JSON.parse(JSON.stringify(def.eventos)) : [eventoGeneral(dur || 1000)];
    // sonido: clips sin "evento" van a la pista de la escena; con "evento", a ese evento
    const clips = S.clips(def && def.sonidos, "escena", dur);
    const deEscena = clips.filter((c) => !c.evento).map((c) => c.clip);
    if (deEscena.length) escena.sonidos = deEscena;
    S.aEventos(eventos, clips.filter((c) => c.evento), def && def.marcas, "EventoGeneral", "escena");
    const m = S.marca(def && def.sonido, "escena");
    if (m) escena.sonido_marca = m;
    const rxa = S.reacciones(def && def.reacciones, REACCIONES_VALIDAS.objeto, "escena › reacciones");
    if (rxa) escena.reacciones = rxa;
    return {ok: !E.errores.length, errores: E.errores, avisos: E.avisos,
        resultado: {nombre: def && def.nombre, grupos_figuras: grupos, eventos, escena}};
}

// buscarSonido(nombre) -> {id} | null: solo hace falta si el documento usa sonidos
export function compilar(def, buscarAsset, buscarSonido) {
    if (def && def.tipo === "asset") return compilarAsset(def, buscarSonido);
    if (def && def.tipo === "escena") return compilarEscena(def, buscarAsset, buscarSonido);
    return {ok: false, errores: ['tipo debe ser "asset" o "escena"'], avisos: [], resultado: null};
}
