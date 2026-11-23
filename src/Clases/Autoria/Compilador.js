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
//    formas?: {clave: FORMA}  (morphing: formas de destino; claves.forma: [[t, "clave" | "", interp?]])
//    inercia?: true | {rigidez?, amortiguacion?, fuerza?, limite?, punta?}  (movimiento secundario: pendulo con resorte)
//    ik?: {hasta, punta: [x,y], objetivo, doblez?: 1|-1, orientar?}  (cinematica inversa de 2 huesos; claves.ik_peso 0..1)
//    colores?: {clave: "#color" | {color?, borde?, degradado?}}  (misma geometria, otro color: se interpola)
//    degradado?: {tipo: "lineal", de, a, colores: [[pos, color]...]} | {tipo: "radial", centro, radio, colores}
//    desenfoque?: px, mezcla?: normal|suma|pantalla|multiplicar|superponer|aclarar|oscurecer  (se heredan)
//    facetas?: {luz: [x, y, z] | luces: [[t, [x, y, z]]...], detalle?, relieve?, azar?, semilla?, sombra?, luzMax?}  (low poly: triangulos con luz por cara, Facetas.js)
//    partes?: [PARTE...]}
// ESCENA
//   {tipo: "escena", nombre, duracion, profundidad?: bool, precision?: "decimal", gravedad?, eventos?: [...],
//    camara?: {centro: [x,y], zoom?, tamano?: [w,h], claves?, bucle?, temblor?: {desde, hasta, amplitud?, entrada?, decae?} | [...], nombre?, capa?},
//    objetos: [OBJETO...], efectos?: [EFECTO...],
//    fps_animacion?: 1..60  (stop-motion: las poses cambian a ese ritmo),
//    estilo?: {paleta: [colores de oscuro a claro], tramado?: bayer2|bayer4|bayer8|ninguno, pixel?, contraste?, brillo?}  (filtro de imagen, Estilo.js),
//    dialogos?: [{quien: "<objeto>", parte?: "<parte>" (por defecto "cabeza" si existe), texto, desde, hasta, estilo?: dialogo|grito|pensamiento|narrador,
//                 velocidad?: letras/s, lado?: arriba|abajo, desplazar?: [dx, dy], posicion?: arriba|abajo}]}  (globos, Dialogos.js)
//                 estilo "texto": texto que vive EN la escena (un monitor, letras en el aire), sin globo: en: [x,y] (en el
//                 dibujo; con quien, desde el centro de su caja o de su parte), tamano (px del dibujo), color?, fuente?:
//                 sans|serif|mono, ancho? (corta lineas), alinear?: izquierda|centro|derecha, cursor?: true, resplandor?: px
// OBJETO
//   instancia: {instancia: "<nombre del asset>", nombre?, en: [x,y] (pies), ancla?: [x,y],
//               escala?: n | [sx, sy], espejo?, rotacion?, plano?, capa?, borde?, fisica?: "fijo"|"rigido"|"desarmar"|{...},
//               evento?, bucle?, desfase?, version?, opacidad?, visible?,
//               acciones?: [[t, "<evento>", bucle?]...]  (desde t ms reproduce ese evento desde su comienzo; bucle por defecto true),
//               claves_partes?: {"<parte>": {rotacion|escala_x|escala_y|opacidad: [[t, v, interp?]], peso?: [[t, 0..1]]}}  (claves de una parte del asset en esta instancia; t de la escena; peso mezcla con la animacion del asset),
//               claves?: {x|y: [[t, v_pies, interp?]], ...}, repetir?,
//               padre?: "<otro objeto>" (en y claves relativos al origen del padre; hereda su movimiento),
//               desenfoque?, mezcla?,
//               sombra?: true | {luz?: [x,y] | "<objeto>", angulo?, piso?, largo?, aplastar?, opacidad?, desenfoque?, color?} | [...]}
//   dibujo:    {nombre, en, ancla?, una forma de PARTE y/o partes: [PARTE...], plano?, fisica?, claves?...}
// EFECTO
//   {tipo: explosion|tornado|disparo|viento|particulas, nombre?, en: [x,y], capa?, claves?, repetir?, ...parametros}
// Lo inverso (editor -> simple) esta en Descompilador.js.

import {TIPOS_EFECTO, MODOS_FISICA, efectoDefecto} from "../EditorEvento/Fisica";
import {expandirFacetas} from "./Facetas";
import {normalizarEstilo} from "../EditorEvento/Estilo";
import {PROPIEDADES, INTERPOLACIONES, MODOS_BUCLE, PISTA_FORMA, formasCompatibles, valorEn} from "../EditorEvento/Claves";
import {GENERADORES, expandirGenerador, claveTemblor} from "./Generadores";
import {PISTA_PESO} from "../EditorEvento/Ik";

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
        const esForma = prop === PISTA_FORMA;
        if (!PROPIEDADES[prop] && !esForma && prop !== PISTA_PESO) { E.error(donde, `propiedad animable desconocida "${prop}" (validas: ${[...Object.keys(PROPIEDADES), PISTA_FORMA, PISTA_PESO].join(", ")})`); continue; }
        const lista = claves[prop];
        if (!Array.isArray(lista) || !lista.length) { E.error(donde, `claves.${prop} debe ser una lista de [t, valor, interp?]`); continue; }
        const pista = [];
        for (const k of lista) {
            if (esForma) {
                if (!Array.isArray(k) || !num(k[0]) || typeof k[1] !== "string") { E.error(donde, `clave de forma invalida: ${JSON.stringify(k)} (se espera [t_ms, "nombre de la parte con la forma", interp?])`); continue; }
            } else if (!Array.isArray(k) || !num(k[0]) || !num(k[1])) { E.error(donde, `clave de ${prop} invalida: ${JSON.stringify(k)} (se espera [t_ms, valor, interp?])`); continue; }
            const interp = k[2] || "lineal";
            if (!INTERPOLACIONES[interp]) E.error(donde, `interpolacion "${interp}" desconocida (validas: ${Object.keys(INTERPOLACIONES).join(", ")})`);
            pista.push({t: Math.round(k[0]), v: ajuste && !esForma ? ajuste(prop, k[1]) : k[1], interp});
        }
        pista.sort((a, b) => a.t - b.t);
        for (let i = 1; i < pista.length; i++) if (pista[i].t === pista[i - 1].t) E.error(donde, `dos claves de ${prop} en t=${pista[i].t}`);
        if (pista.length) r[prop] = pista;
    }
    return Object.keys(r).length ? r : null;
}

function aplicarComunes(g, p, E, donde) {
    aplicarEstilo(g, p, E, donde);
    if (p.forma_color === true) g.forma_color = true;     // (lo escribe el descompilador)
    if (p.inercia !== undefined) {                         // fase 3 de capacidades (movimiento secundario)
        const i = p.inercia === true ? {} : p.inercia;
        const CAMPOS = ["rigidez", "amortiguacion", "fuerza", "limite", "punta"];
        if (!i || typeof i !== "object" || Array.isArray(i)) E.error(donde, "inercia es true o {rigidez?: Hz, amortiguacion?: 0..1, fuerza?, limite?: grados, punta?: [x, y]}");
        else {
            const malos = Object.keys(i).filter((k) => !CAMPOS.includes(k));
            if (malos.length) E.error(donde, `inercia: campos desconocidos ${malos.join(", ")} (validos: ${CAMPOS.join(", ")})`);
            for (const k of ["rigidez", "amortiguacion", "fuerza", "limite"]) if (i[k] !== undefined && !num(i[k])) E.error(donde, `inercia.${k} es un numero`);
            if (i.rigidez !== undefined && num(i.rigidez) && i.rigidez <= 0) E.error(donde, "inercia.rigidez (Hz) tiene que ser mayor que 0");
            if (i.punta !== undefined && !par(i.punta)) E.error(donde, "inercia.punta es [x, y]");
            g.inercia = {...i};
            if (!p.pivote) E.aviso(donde, "inercia sin pivote: la parte cuelga de su origen (pone pivote: [x, y] donde se sujeta)");
        }
    }
    if (p.ik !== undefined) {                              // fase 2 de capacidades (se valida al final: validarIk)
        const k = p.ik;
        if (!k || typeof k !== "object" || typeof k.hasta !== "string" || typeof k.objetivo !== "string") E.error(donde, "ik es {hasta: \"<segundo hueso>\", punta: [x, y], objetivo: \"<grupo>\", doblez?: 1 | -1, orientar?: \"<grupo>\"}");
        else if (k.punta !== undefined && !par(k.punta)) E.error(donde, "ik.punta es [x, y] (en coordenadas del segundo hueso)");
        else if (k.doblez !== undefined && k.doblez !== 1 && k.doblez !== -1) E.error(donde, "ik.doblez es 1 o -1");
        else g.ik = {hasta: k.hasta, punta: k.punta || [0, 0], objetivo: k.objetivo, ...(k.doblez ? {doblez: k.doblez} : {}), ...(k.orientar ? {orientar: k.orientar} : {})};
    }
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

// degradado: {tipo: "lineal", de: [x,y], a: [x,y], colores: [[pos 0..1, color]...]}
//         o  {tipo: "radial", centro: [x,y], radio, radio_ini?, colores}   (coordenadas de la parte)
function compilarDegradado(d, E, donde) {
    if (d === undefined) return null;
    const malo = (m) => { E.error(donde, `degradado: ${m}`); return null; };
    if (!d || typeof d !== "object") return malo("es {tipo: lineal|radial, ..., colores: [[pos, color]...]}");
    if (!Array.isArray(d.colores) || d.colores.length < 2 || !d.colores.every((c) => Array.isArray(c) && num(c[0]) && typeof c[1] === "string")) {
        return malo("colores es una lista de al menos 2 [posicion 0..1, \"#color\"]");
    }
    const colores = d.colores.map(([p, c]) => [Math.max(0, Math.min(1, p)), c]);
    if (d.tipo === "radial") {
        if (d.centro !== undefined && !par(d.centro)) return malo("centro es [x, y]");
        if (!num(d.radio)) return malo("radial necesita radio");
        return {tipo: "radial", centro: d.centro || [0, 0], radio: d.radio, ...(num(d.radio_ini) ? {radio_ini: d.radio_ini} : {}), colores};
    }
    if (d.tipo !== undefined && d.tipo !== "lineal") return malo(`tipo "${d.tipo}" desconocido (lineal o radial)`);
    if (!par(d.de) || !par(d.a)) return malo("lineal necesita de: [x, y] y a: [x, y]");
    return {tipo: "lineal", de: d.de, a: d.a, colores};
}

// Fase 4 de capacidades: sombra proyectada de un objeto de escena.
//   sombra: true | {luz?: [x, y] | "<objeto>", alcance?, angulo?, piso?, largo?, aplastar?, opacidad?, desenfoque?, color?} | [ ...varias luces ]
// piso por defecto: donde estan los pies del objeto (en[1]).
const CAMPOS_SOMBRA = ["luz", "angulo", "piso", "largo", "aplastar", "opacidad", "desenfoque", "color", "alcance"];
function compilarSombra(v, pieY, E, donde) {
    if (v === undefined || v === false) return null;
    const lista = Array.isArray(v) ? v : [v === true ? {} : v];
    const r = [];
    lista.forEach((s, i) => {
        const d = lista.length > 1 ? `${donde} › sombra #${i}` : `${donde} › sombra`;
        if (!s || typeof s !== "object" || Array.isArray(s)) { E.error(d, "sombra es true, {luz?, angulo?, piso?, largo?, aplastar?, opacidad?, desenfoque?, color?} o una lista de esas"); return; }
        const malos = Object.keys(s).filter((k) => !CAMPOS_SOMBRA.includes(k));
        if (malos.length) E.error(d, `campos desconocidos ${malos.join(", ")} (validos: ${CAMPOS_SOMBRA.join(", ")})`);
        if (s.luz !== undefined && !par(s.luz) && typeof s.luz !== "string") E.error(d, "luz es [x, y] o el nombre de un objeto de la escena");
        for (const k of ["angulo", "piso", "largo", "aplastar", "opacidad", "desenfoque", "alcance"]) if (s[k] !== undefined && !num(s[k])) E.error(d, `${k} es un numero`);
        if (s.color !== undefined && typeof s.color !== "string") E.error(d, "color es un texto (\"#000000\")");
        r.push({piso: pieY, ...s});
    });
    return r.length ? r : null;
}

// las luces de las sombras nombran objetos que existen
function validarSombras(grupos, E) {
    const nombres = new Set(grupos.map((g) => g.nombre));
    for (const g of grupos) for (const s of g.sombra || []) if (typeof s.luz === "string" && !nombres.has(s.luz)) E.error(g.nombre, `sombra: la luz "${s.luz}" no es un objeto de la escena`);
}

// desenfoque (px) y mezcla (modo de fusion): se heredan a las partes hijas.
const MEZCLAS = ["normal", "suma", "pantalla", "multiplicar", "superponer", "aclarar", "oscurecer"];
function aplicarEstilo(g, p, E, donde) {
    if (p.desenfoque !== undefined) {
        if (!num(p.desenfoque) || p.desenfoque < 0) E.error(donde, "desenfoque es un numero de px (>= 0)");
        else if (p.desenfoque > 0) g.desenfoque = p.desenfoque;
    }
    if (p.mezcla !== undefined) {
        if (!MEZCLAS.includes(p.mezcla)) E.error(donde, `mezcla "${p.mezcla}" desconocida (validas: ${MEZCLAS.join(", ")})`);
        else if (p.mezcla !== "normal") g.mezcla = p.mezcla;
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
        const dg = compilarDegradado(p.degradado, E, donde);
        if (dg) {
            g.lista_pintado[0].degradado = dg;
            if (!p.color) g.lista_pintado[0].color = dg.colores[0][1];
            if (!p.borde) g.color = dg.colores[dg.colores.length - 1][1];
        }
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
        // facetas (low poly): la parte se convierte en triangulos con luz por cara (Facetas.js)
        if (p.facetas !== undefined) p = expandirFacetas(p, E, donde);
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
        compilarFormas(g, p, E, nombres, salida, donde);
        compilarPartes(p.partes, p.nombre, E, nombres, salida, donde + " › ");
    });
}

// Morphing: `formas: {clave: FORMA}` en una parte -> grupos hijos ocultos
// "<parte>~<clave>" con esa forma; `claves.forma` puede nombrarlos por la clave corta.
const SEP_FORMA = "~";
// Fase 1 de capacidades: `colores: {clave: "#color" | {color?, borde?, degradado?}}` -> formas con la
// MISMA geometria que la parte y otro color. Si alguna forma o `colores` trae color, la parte
// queda con `forma_color: true` y el motor interpola tambien los colores.
const CAMPOS_COLOR = ["color", "borde", "degradado"];
function compilarFormas(g, p, E, nombres, salida, donde) {
    if (p.formas === undefined && p.colores === undefined) return;
    const formas = {};
    if (p.formas !== undefined) {
        if (!p.formas || typeof p.formas !== "object" || Array.isArray(p.formas)) { E.error(donde, "formas es {nombre: {poligono | rect | circulo | elipse}}"); return; }
        Object.assign(formas, p.formas);
    }
    if (p.colores !== undefined) {
        if (!p.colores || typeof p.colores !== "object" || Array.isArray(p.colores)) { E.error(donde, "colores es {nombre: \"#color\" | {color, borde, degradado}}"); return; }
        const geometria = Object.fromEntries([...FORMAS, "crudo"].filter((k) => p[k] !== undefined).map((k) => [k, p[k]]));
        if (!Object.keys(geometria).length) { E.error(donde, "colores necesita que la parte tenga una forma (poligono, rect, circulo, elipse)"); return; }
        for (const [k, c] of Object.entries(p.colores)) {
            if (formas[k] !== undefined) { E.error(donde, `"${k}" esta en formas y en colores: usa una sola`); continue; }
            const col = typeof c === "string" ? {color: c} : c;
            if (!col || typeof col !== "object" || !CAMPOS_COLOR.some((x) => col[x] !== undefined)) { E.error(donde, `colores.${k}: se espera "#color" o {color, borde, degradado}`); continue; }
            formas[k] = {...geometria, ...col};
        }
    }
    const conColor = Object.values(formas).some((f) => f && CAMPOS_COLOR.some((x) => f[x] !== undefined));
    const base = g.lista_pintado[0] || {};
    for (const [k, f] of Object.entries(formas)) {
        const nombre = `${p.nombre}${SEP_FORMA}${k}`;
        if (nombres.has(nombre)) { E.error(donde, `forma repetida "${k}"`); continue; }
        nombres.add(nombre);
        const h = grupoBase(nombre, p.nombre, 0, 0, 0);
        h.visible = false;
        h.clases = ["forma"];
        // lo que la forma no dice, igual que la parte (asi solo cambia lo que se pide)
        const def = conColor ? {color: f.color || base.color || p.color, borde: f.borde || (f.color && !p.borde ? f.color : g.color),
            ...(f.degradado || base.degradado ? {degradado: f.degradado || base.degradado} : {})} : {color: f.color || p.color};
        if (!aplicarForma(h, {...f, ...def}, E, `${donde} › formas.${k}`)) continue;
        salida.push(h);
    }
    if (conColor) g.forma_color = true;
    const pista = g.claves && g.claves[PISTA_FORMA];
    if (pista) for (const c of pista) if (c.v && c.v !== p.nombre && formas[c.v] !== undefined) c.v = `${p.nombre}${SEP_FORMA}${c.v}`;
}

// IK: el segundo hueso es hijo directo, el objetivo existe y no es parte de la cadena.
function validarIk(grupos, E) {
    const mapa = new Map(grupos.map((g) => [g.nombre, g]));
    const dentroDe = (g, raiz) => { const vistos = new Set(); for (let x = g; x && !vistos.has(x.nombre); x = mapa.get(x.nodo_padre)) { if (x.nombre === raiz) return true; vistos.add(x.nombre); } return false; };
    for (const g of grupos) {
        const k = g.ik;
        if (!k) continue;
        const b = mapa.get(k.hasta), t = mapa.get(k.objetivo);
        if (!b) { E.error(g.nombre, `ik.hasta "${k.hasta}" no existe`); continue; }
        if (b.nodo_padre !== g.nombre) E.error(g.nombre, `ik.hasta "${k.hasta}" tiene que ser hijo directo de "${g.nombre}"`);
        if (!t) E.error(g.nombre, `ik.objetivo "${k.objetivo}" no existe`);
        else if (dentroDe(t, g.nombre)) E.error(g.nombre, `ik.objetivo "${k.objetivo}" no puede estar dentro de la cadena (se moveria con ella)`);
        if (k.orientar) { const c = mapa.get(k.orientar); if (!c || c.nodo_padre !== k.hasta) E.error(g.nombre, `ik.orientar "${k.orientar}" tiene que ser hijo directo de "${k.hasta}"`); }
        if (!g.transformacion) E.aviso(g.nombre, "ik sin pivote: el hueso gira sobre su origen (pone pivote: [x, y] en la articulacion)");
        if (b && !b.transformacion) E.aviso(k.hasta, "segundo hueso de ik sin pivote: gira sobre su origen (pone pivote: [x, y] en la articulacion)");
    }
}

// Las claves de forma nombran grupos que existen y se pueden interpolar con la parte.
function validarFormas(grupos, E) {
    const mapa = new Map(grupos.map((g) => [g.nombre, g]));
    for (const g of grupos) {
        const pista = g.claves && g.claves[PISTA_FORMA];
        if (!pista) continue;
        for (const c of pista) {
            if (!c.v || c.v === g.nombre) continue;
            const h = mapa.get(c.v);
            if (!h) { E.error(g.nombre, `la clave de forma en t=${c.t} nombra "${c.v}", que no existe`); continue; }
            if (!formasCompatibles(g.lista_figuras, h.lista_figuras)) {
                E.aviso(g.nombre, `la forma "${c.v}" no tiene las mismas figuras que la parte (${(h.lista_figuras || []).length} contra ${(g.lista_figuras || []).length}): salta en vez de transformarse`);
            }
        }
    }
}

// Globos de dialogo (planeacion_zorro_cuervo.md, fase 2): se validan y quien habla pasa a ser
// el nombre del grupo (el objeto puede haberse renombrado al compilar).
// Acciones de una instancia: [[t, "Evento", bucle?]] -> [{t, evento, bucle}] ordenadas por t.
function compilarAcciones(lista, asset, nombre, donde, E) {
    if (!Array.isArray(lista) || !lista.length) { E.error(donde, 'acciones es una lista de [t, "evento", bucle?]'); return null; }
    const salida = [];
    for (const [i, x] of lista.entries()) {
        if (!Array.isArray(x) || !num(x[0]) || typeof x[1] !== "string" || (x[2] !== undefined && typeof x[2] !== "boolean")) {
            E.error(`${donde} › acciones[${i}]`, 'cada accion es [t (ms), "evento", bucle? (true/false)]'); continue;
        }
        if (asset.eventos && !asset.eventos.includes(x[1])) {
            E.error(`${donde} › acciones[${i}]`, `el asset "${nombre}" no tiene el evento "${x[1]}" (tiene: ${asset.eventos.join(", ")})`); continue;
        }
        salida.push({t: x[0], evento: x[1], bucle: x[2] !== false});
    }
    for (let i = 1; i < salida.length; i++) {
        if (salida[i].t <= salida[i - 1].t) E.error(`${donde} › acciones`, "los tiempos tienen que ir en aumento");
    }
    return salida.length ? salida : null;
}

const ESTILOS_DIALOGO = ["dialogo", "grito", "pensamiento", "narrador", "texto"];
const CAMPOS_TEXTO = ["en", "tamano", "color", "fuente", "ancho", "alinear", "cursor", "resplandor"];
function compilarDialogos(lista, porNombre, dur, E) {
    if (lista === undefined) return null;
    if (!Array.isArray(lista)) { E.error("dialogos", "dialogos es una lista de {quien, texto, desde, hasta}"); return null; }
    const salida = [];
    lista.forEach((d, i) => {
        const donde = `dialogos[${i}]`;
        if (!d || typeof d !== "object") { E.error(donde, "cada dialogo es {quien, texto, desde, hasta}"); return; }
        // (voz: false = sin voz; lo usa herramientas/voces.mjs, no se guarda)
        const conocidos = ["quien", "texto", "desde", "hasta", "estilo", "velocidad", "lado", "desplazar", "posicion", "parte", "voz", ...CAMPOS_TEXTO];
        const raros = Object.keys(d).filter((k) => !conocidos.includes(k));
        if (raros.length) E.error(donde, `campos desconocidos: ${raros.join(", ")} (validos: ${conocidos.join(", ")})`);
        const estilo = d.estilo === undefined ? "dialogo" : d.estilo;
        if (!ESTILOS_DIALOGO.includes(estilo)) E.error(donde, `estilo "${d.estilo}" desconocido (validos: ${ESTILOS_DIALOGO.join(", ")})`);
        if (typeof d.texto !== "string" || !d.texto.trim()) E.error(donde, "falta texto");
        if (!num(d.desde) || !num(d.hasta) || d.hasta <= d.desde) E.error(donde, "desde y hasta son ms, con hasta > desde");
        else if (num(dur) && d.desde >= dur) E.aviso(donde, `empieza en ${d.desde} ms, despues de que termina la escena (${dur} ms)`);
        if (d.velocidad !== undefined && !(num(d.velocidad) && d.velocidad >= 0)) E.error(donde, "velocidad es letras por segundo (0 = todo de una vez)");
        // que se alcance a leer: escribirse completo y quedar al menos 0,8 s (28 letras/s por defecto)
        else if (typeof d.texto === "string" && num(d.desde) && num(d.hasta)) {
            const vel = d.velocidad === undefined ? 28 : d.velocidad;
            const escribir = vel > 0 ? Array.from(d.texto).length / vel * 1000 + 110 : 0;
            if (escribir + 800 > d.hasta - d.desde) E.aviso(donde, `"${d.texto.slice(0, 24)}…" tarda ${Math.round(escribir)} ms en escribirse: dale mas tiempo (hasta) o mas velocidad`);
        }
        if (d.lado !== undefined && !["arriba", "abajo"].includes(d.lado)) E.error(donde, 'lado es "arriba" o "abajo"');
        if (d.posicion !== undefined && !["arriba", "abajo"].includes(d.posicion)) E.error(donde, 'posicion es "arriba" o "abajo" (solo narrador)');
        if (d.desplazar !== undefined && !par(d.desplazar)) E.error(donde, "desplazar es [dx, dy]");
        const esTexto = estilo === "texto";
        const ajenos = CAMPOS_TEXTO.filter((k) => d[k] !== undefined);
        if (!esTexto && ajenos.length) E.error(donde, `${ajenos.join(", ")} solo valen con estilo "texto"`);
        if (esTexto) {
            if (!par(d.en)) E.error(donde, "texto: en es [x, y] (en el dibujo; con quien, relativo al centro de su caja)");
            if (!(num(d.tamano) && d.tamano > 0)) E.error(donde, "texto: tamano es el alto de la letra en px del dibujo (> 0)");
            if (d.color !== undefined && typeof d.color !== "string") E.error(donde, "texto: color es un texto (\"#7dff9a\")");
            if (d.fuente !== undefined && !["sans", "serif", "mono"].includes(d.fuente)) E.error(donde, 'texto: fuente es "sans", "serif" o "mono"');
            if (d.ancho !== undefined && !(num(d.ancho) && d.ancho > 0)) E.error(donde, "texto: ancho es px del dibujo (> 0)");
            if (d.alinear !== undefined && !["izquierda", "centro", "derecha"].includes(d.alinear)) E.error(donde, 'texto: alinear es "izquierda", "centro" o "derecha"');
            if (d.cursor !== undefined && typeof d.cursor !== "boolean") E.error(donde, "texto: cursor es true o false");
            if (d.resplandor !== undefined && !(num(d.resplandor) && d.resplandor >= 0)) E.error(donde, "texto: resplandor es px (>= 0)");
        }
        const g = d.quien !== undefined ? porNombre.get(d.quien) : null;
        if (esTexto && d.quien !== undefined && !g) E.error(donde, `quien "${d.quien}" no es un objeto de la escena`);
        if (estilo !== "narrador" && !esTexto && !g) E.error(donde, d.quien === undefined ? "falta quien (el objeto que habla)" : `quien "${d.quien}" no es un objeto de la escena`);
        const o = {quien: g ? g.nombre : null, texto: d.texto, desde: d.desde, hasta: d.hasta};
        if (estilo !== "dialogo") o.estilo = estilo;
        if (d.parte !== undefined && (typeof d.parte !== "string" || !d.parte.trim())) E.error(donde, "parte es el nombre de una parte de quien habla (por ejemplo \"cabeza\" o \"boca\")");
        for (const k of ["velocidad", "lado", "desplazar", "posicion", "parte", ...CAMPOS_TEXTO]) if (d[k] !== undefined) o[k] = d[k];
        if (o.quien === null) delete o.quien;
        salida.push(o);
    });
    return salida.length ? salida : null;
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
    validarFormas(grupos, E);
    validarIk(grupos, E);
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

// Temblor de camara: sin claves x / y es la receta tal cual (alrededor del centro). Si la camara
// YA tiene claves x / y, el temblor se SUMA a ese movimiento (antes las reemplazaba y la camara
// quedaba quieta en el centro): fuera de la ventana del temblor quedan sus claves; dentro, cada
// clave del temblor vale "donde va la camara en ese instante" + la sacudida.
function temblorSobreClaves(claves, centro, temblor) {
    const sac = claveTemblor(centro, temblor);
    const r = {...claves};
    [["x", 0], ["y", 1]].forEach(([eje, i]) => {
        const propia = claves[eje];
        if (!Array.isArray(propia) || !propia.length || !propia.every((k) => Array.isArray(k) && num(k[0]) && num(k[1]))) { r[eje] = sac[eje]; return; }
        const pista = propia.map(([t, v, interp]) => ({t, v, interp: interp || "lineal"})).sort((a, b) => a.t - b.t);
        const desde = temblor.desde, hasta = temblor.hasta;
        const fuera = propia.filter(([t]) => t < desde || t > hasta);
        const dentro = sac[eje].filter(([t]) => t >= desde && t <= hasta).map(([t, v]) => [t, Math.round((valorEn(pista, t) + v - centro[i]) * 10) / 10, "lineal"]);
        // la ultima clave antes del temblor sigue con su interpolacion hasta el comienzo del temblor
        r[eje] = [...fuera, ...dentro].sort((a, b) => a[0] - b[0]).filter((k, j, l) => j === 0 || k[0] !== l[j - 1][0]);
    });
    return r;
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
    const padres = [], porNombre = new Map();
    const unico = (base) => { let n = base, k = 2; while (nombres.has(n)) n = `${base}_${k++}`; nombres.add(n); return n; };

    // camara
    const cam = (def && def.camara) || {};
    // tamano del cuadro (la forma del video): [1280, 720] horizontal; [720, 1280] vertical 9:16
    let tam = cam.tamano || [1280, 720];
    if (!par(tam) || !(tam[0] > 0 && tam[1] > 0)) { E.error("camara", "tamano es [ancho, alto] positivos (p. ej. [720, 1280] para vertical)"); tam = [1280, 720]; }
    const centro = cam.centro || [tam[0] / 2, tam[1] / 2];
    if (!par(centro)) E.error("camara", "centro es [x, y]");
    const gcam = {...grupoBase(unico(cam.nombre || "Cámara"), "root", centro[0], centro[1], num(cam.capa) ? cam.capa : 999), color: "#f0b429",
        clases: ["camara"], camara: {ancho: tam[0], alto: tam[1], zoom: num(cam.zoom) ? cam.zoom : 1}};
    // Fase A5: receta "temblor": {desde, hasta, amplitud?} -> claves de x / y de la camara
    // temblor: uno o una lista de {desde, hasta, amplitud?, entrada?, decae?, paso?} (si se pisan, se suman)
    const temblores = cam.temblor ? (Array.isArray(cam.temblor) ? cam.temblor : [cam.temblor]) : [];
    const claves_cam = temblores.length ? temblores.reduce((cl, tb) => temblorSobreClaves(cl, centro, tb), cam.claves || {}) : cam.claves;
    if (temblores.some((tb) => !tb || !(num(tb.desde) && num(tb.hasta)) || tb.hasta <= tb.desde)) E.error("camara", "temblor es {desde, hasta, amplitud?, entrada?, decae?} en ms (o una lista de esos)");
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
            if (o.acciones !== undefined) {
                const acc = compilarAcciones(o.acciones, a, o.instancia, donde, E);
                if (acc) g.instancia.acciones = acc;
            }
            // claves propias de partes del asset en esta instancia: {"<parte>": {prop: [[t, v, interp?]], peso?: [...]}}
            if (o.claves_partes !== undefined) {
                if (!o.claves_partes || typeof o.claves_partes !== "object" || Array.isArray(o.claves_partes)) E.error(donde, "claves_partes es {\"<parte>\": {prop: [[t, v, interp?]], peso?: [[t, v]]}}");
                else {
                    const cp = {};
                    for (const parte of Object.keys(o.claves_partes)) {
                        const pistas = o.claves_partes[parte] || {};
                        for (const prop of Object.keys(pistas)) if (!["rotacion", "escala_x", "escala_y", "opacidad", "peso"].includes(prop)) E.error(`${donde} › claves_partes.${parte}`, `propiedad desconocida "${prop}" (rotacion, escala_x, escala_y, opacidad, peso)`);
                        const {peso, ...resto} = pistas, dd = `${donde} › claves_partes.${parte}`;
                        const cl = compilarClaves(resto, E, dd) || {};
                        if (peso) { const cw = compilarClaves({opacidad: peso}, E, dd + " › peso"); if (cw) cl.peso = cw.opacidad; }
                        if (Object.keys(cl).length) cp[parte] = cl;
                    }
                    if (Object.keys(cp).length) g.instancia.claves_partes = cp;
                }
            }
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
        aplicarEstilo(g, o, E, donde);
        const so = compilarSombra(o.sombra, en[1], E, donde);
        if (so) g.sombra = so;
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
        // morphing (formas / colores) tambien en objetos dibujados de la escena
        if (o.formas !== undefined || o.colores !== undefined) {
            if (o.instancia) E.error(donde, "formas y colores son de objetos dibujados o partes, no de instancias");
            else compilarFormas(g, o, E, nombres, grupos, donde);
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
        if (o.padre !== undefined) padres.push({g, padre: o.padre, donde});
        porNombre.set(g.nombre, g);
        if (o.nombre && o.nombre !== g.nombre) porNombre.set(o.nombre, g);
    });

    // Jerarquia: un objeto con `padre` va dentro de otro objeto; su `en` y sus claves
    // x / y son relativos al origen del padre, y hereda su movimiento, rotacion, escala,
    // opacidad y visibilidad. Se dibuja junto con el padre (no se reordena por profundidad
    // entre los demas objetos).
    for (const {g, padre, donde} of padres) {
        const p = typeof padre === "string" ? porNombre.get(padre) : null;
        if (!p) { E.error(donde, `padre "${padre}" no es un objeto de la escena`); continue; }
        if (p === g) { E.error(donde, "un objeto no puede ser su propio padre"); continue; }
        g.nodo_padre = p.nombre;
        g.clases = [...(g.clases || []), "objeto_hijo"];
    }
    for (const {g, donde} of padres) {
        const vistos = new Set();
        let x = g;
        while (x && x.nodo_padre !== "root") {
            if (vistos.has(x.nombre)) { E.error(donde, "la cadena de padres forma un ciclo"); g.nodo_padre = "root"; break; }
            vistos.add(x.nombre);
            x = grupos.find((y) => y.nombre === x.nodo_padre);
        }
    }

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

    validarFormas(grupos, E);
    validarIk(grupos, E);
    validarSombras(grupos, E);
    const escena = {};
    if (def && def.profundidad) escena.orden_profundidad = true;
    // precision de dibujo: "decimal" no redondea las coordenadas (figuras chicas con zoom o escala)
    if (def && def.precision !== undefined) {
        if (def.precision === "decimal") escena.precision = "decimal";
        else if (def.precision !== "entera") E.error("escena", `precision "${def.precision}" desconocida (validas: decimal, entera)`);
    }
    if (def && num(def.gravedad)) escena.fisica = {gravedad: def.gravedad};
    // stop-motion: la animacion avanza a saltos de 1/fps s (el video sigue a su fps)
    if (def && def.fps_animacion !== undefined) {
        if (num(def.fps_animacion) && def.fps_animacion >= 1 && def.fps_animacion <= 60) escena.fps_animacion = def.fps_animacion;
        else E.error("escena", "fps_animacion: de 1 a 60 cuadros por segundo");
    }
    const dialogos = compilarDialogos(def && def.dialogos, porNombre, dur, E);
    if (dialogos) escena.dialogos = dialogos;
    // estilo de imagen (Estilo.js): duotono con tramado, pixelado...
    if (def && def.estilo !== undefined) {
        const {estilo, errores} = normalizarEstilo(def.estilo);
        errores.forEach((x) => E.error("escena", x));
        if (estilo) escena.estilo = estilo;
    }
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
