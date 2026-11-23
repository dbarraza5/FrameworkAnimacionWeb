// Globos de dialogo (documento/planeacion_zorro_cuervo.md, fase 2).
//
// Una escena puede tener escena.dialogos = [DIALOGO...]:
//   {quien: "<objeto>", texto, desde, hasta,                       (ms)
//    estilo?: "dialogo" | "grito" | "pensamiento" | "narrador",    (por defecto "dialogo")
//    velocidad?: letras por segundo (28; 0 = todo de una vez),
//    lado?: "arriba" | "abajo" (donde va el globo respecto de quien habla; por defecto arriba, y
//           si no cabe en la camara, abajo),
//    parte?: "<parte>" (a que parte de quien apunta la cola; por defecto su "cabeza" si la tiene,
//           si no, todo el objeto),
//    desplazar?: [dx, dy] (corre la punta de la cola, en unidades del dibujo),
//    posicion?: "arriba" | "abajo" (solo narrador: franja arriba o abajo del cuadro)}
// "narrador" no necesita quien: es un cartel en el borde del cuadro, sin cola.
// "texto": letras que viven EN la escena, sin globo (un monitor,
//   un holograma, palabras en el aire). Se escalan con la camara como cualquier dibujo:
//   en: [x, y] (en el dibujo; con quien, desde el centro de su caja o de su parte), tamano (px del dibujo),
//   color?, fuente?: sans|serif|mono, ancho? (corta lineas), alinear?: izquierda|centro|derecha,
//   cursor?: true (un bloque que sigue a la ultima letra y parpadea al terminar), resplandor?: px.
//
// El globo sigue a quien habla en cada cuadro (su caja en el dibujo), aparece con un rebote,
// el texto se escribe letra por letra y se desvanece al final. El tamano es relativo a lo que
// ve la camara (se lee igual con zoom) y el globo se acomoda dentro del cuadro sin tapar a
// los otros globos que estan al mismo tiempo.
//
// Lo puro (cortar lineas, estado en el tiempo, ubicar) se prueba sin dibujo:
// herramientas/pruebas/dialogos.test.mjs.

import {cajaMundo} from "../Autoria/Render";

export const ESTILOS_GLOBO = ["dialogo", "grito", "pensamiento", "narrador"];
const FUENTES_TEXTO = {sans: '"Trebuchet MS", "Segoe UI", Arial, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: '"Courier New", Consolas, monospace'};
const CURSOR_MS = 530;                     // medio periodo del parpadeo del cursor
export const VELOCIDAD_DEFECTO = 28;      // letras por segundo
const POP_MS = 220;                        // aparicion con rebote
const SALIDA_MS = 220;                     // desvanecerse al final
const SEP = "::";                          // partes de una instancia: "<objeto>::<parte>" (GestionEvento.SEPARADOR_INSTANCIA)
// Caja a la que apunta la cola: la parte pedida (o la "cabeza") de quien habla, o el objeto entero.
export function cajaHablante(d, cajaDe) {
    for (const p of d.parte ? [d.parte] : ["cabeza"]) {
        const c = cajaDe(`${d.quien}${SEP}${p}`);
        if (c) return c;
    }
    return cajaDe(d.quien);
}
const FUENTE = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';

// ---------------------------------------------------------------- puro

// Letras de un texto (cuenta bien acentos y signos de varios bytes).
export const letras = (texto) => Array.from(String(texto == null ? "" : texto));

// Corta el texto en lineas que midan como mucho maxAncho (medir(texto) -> ancho).
// Respeta los saltos "\n"; una palabra mas larga que la linea se parte.
export function cortarLineas(texto, maxAncho, medir) {
    const lineas = [];
    for (const parrafo of String(texto == null ? "" : texto).split("\n")) {
        let actual = "";
        for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
            const prueba = actual ? actual + " " + palabra : palabra;
            if (medir(prueba) <= maxAncho) { actual = prueba; continue; }
            if (actual) lineas.push(actual);
            // palabra sola demasiado larga: partirla
            let resto = palabra;
            while (medir(resto) > maxAncho && letras(resto).length > 1) {
                const ls = letras(resto);
                let k = ls.length - 1;
                while (k > 1 && medir(ls.slice(0, k).join("")) > maxAncho) k--;
                lineas.push(ls.slice(0, k).join(""));
                resto = ls.slice(k).join("");
            }
            actual = resto;
        }
        lineas.push(actual);
    }
    return lineas;
}

// Estado del globo en el instante t (ms): null si no se ve; si no,
// {letras: cuantas se ven, escala: rebote de aparicion, alfa: desvanecido final}.
export function estadoGlobo(d, t) {
    if (!d || !(t >= d.desde) || !(t <= d.hasta)) return null;
    const total = letras(d.texto).length;
    const dt = t - d.desde;
    const vel = typeof d.velocidad === "number" ? d.velocidad : VELOCIDAD_DEFECTO;
    const escrito = vel <= 0 ? total : Math.floor(Math.max(0, dt - POP_MS / 2) * vel / 1000);
    const p = Math.min(1, dt / POP_MS);
    // rebote ("ease out back"): pasa un poco de 1 y vuelve
    const c = 1.7, q = p - 1;
    const escala = p >= 1 ? 1 : Math.max(0.05, 1 + (c + 1) * q * q * q + c * q * q);
    const alfa = Math.max(0, Math.min(1, (d.hasta - t) / SALIDA_MS));
    return {letras: Math.min(total, escrito), escala, alfa};
}

// Estado de un "texto" en t (ms): null si no se ve; si no, {letras, alfa, cursor: se ve el cursor}.
// Sin rebote: aparece con un fundido corto, se escribe y se desvanece al final.
export function estadoTexto(d, t) {
    if (!d || !(t >= d.desde) || !(t <= d.hasta)) return null;
    const total = letras(d.texto).length, dt = t - d.desde;
    const vel = typeof d.velocidad === "number" ? d.velocidad : VELOCIDAD_DEFECTO;
    const escrito = vel <= 0 ? total : Math.min(total, Math.floor(dt * vel / 1000));
    const alfa = Math.max(0, Math.min(1, dt / 120, (d.hasta - t) / SALIDA_MS));
    // mientras escribe, el cursor queda fijo; al terminar, parpadea
    const fin = vel <= 0 ? 0 : total * 1000 / vel;
    const cursor = !!d.cursor && (dt < fin || Math.floor((dt - fin) / CURSOR_MS) % 2 === 0);
    return {letras: escrito, alfa, cursor};
}

function dibujarTexto(ctx, d, e, ox, oy, cajaDe) {
    let x = d.en[0], y = d.en[1];
    if (d.quien) {
        const c = d.parte ? cajaDe(`${d.quien}${SEP}${d.parte}`) || cajaDe(d.quien) : cajaDe(d.quien);
        if (!c) return;                                   // su objeto no se dibuja
        x += (c.x0 + c.x1) / 2; y += (c.y0 + c.y1) / 2;
    }
    x += ox; y += oy;
    const tam = d.tamano, alinear = d.alinear || "izquierda";
    ctx.save();
    ctx.globalAlpha *= e.alfa;
    ctx.font = `${tam}px ${FUENTES_TEXTO[d.fuente] || FUENTES_TEXTO.sans}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const medir = (s) => ctx.measureText(s).width;
    const lineas = d.ancho ? cortarLineas(d.texto, d.ancho, medir) : String(d.texto).split("\n");
    const alto = tam * 1.25;
    const color = d.color || "#ffffff";
    ctx.fillStyle = color;
    if (d.resplandor) { ctx.shadowColor = color; ctx.shadowBlur = d.resplandor; }
    let quedan = e.letras, cx = x, cy = y;
    lineas.forEach((ln, i) => {
        const w = medir(ln);
        const x0 = alinear === "centro" ? x - w / 2 : alinear === "derecha" ? x - w : x;
        const ly = y + i * alto;
        if (quedan > 0) {
            const parte = letras(ln).slice(0, quedan).join("");
            ctx.fillText(parte, x0, ly);
            cx = x0 + medir(parte); cy = ly;
        } else if (quedan === 0 && i > 0) { cx = x0; cy = ly; }   // la linea siguiente aun no empieza
        quedan -= letras(ln).length + 1;                          // (+1: el espacio o salto que se corto)
    });
    if (e.cursor) ctx.fillRect(cx + tam * 0.08, cy - tam * 0.45, tam * 0.55, tam * 0.9);
    ctx.restore();
}

const solapan = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

// Ubica un globo de ancho w y alto h para alguien con caja `caja` (en el dibujo), dentro del
// rectangulo `r` ({x0, y0, w, h}: lo que ve la camara), sin tapar `ocupados` ([{x0,y0,x1,y1}]).
// cola: largo de la cola; margen: distancia minima al borde del cuadro.
// Devuelve {x0, y0, x1, y1, punta: {x, y}, lado: "arriba" | "abajo"}.
export function ubicarGlobo({caja, w, h, r, cola, margen, lado = "arriba", desplazar = [0, 0], ocupados = []}) {
    const lim = {x0: r.x0 + margen, y0: r.y0 + margen, x1: r.x0 + r.w - margen, y1: r.y0 + r.h - margen};
    const sep = cola * 0.25;
    const punta = (l) => ({
        x: Math.min(lim.x1, Math.max(lim.x0, (caja.x0 + caja.x1) / 2 + desplazar[0])),
        y: (l === "arriba" ? caja.y0 - sep : caja.y1 + sep) + desplazar[1],
    });
    const caja_en = (l, p) => {
        const x0 = Math.min(lim.x1 - w, Math.max(lim.x0, p.x - w / 2));
        const y0 = l === "arriba" ? p.y - cola - h : p.y + cola;
        return {x0, y0, x1: x0 + w, y1: y0 + h};
    };
    const cabe = (b) => b.y0 >= lim.y0 && b.y1 <= lim.y1;
    // lado pedido; si no cabe en el cuadro, el otro
    let l = lado === "abajo" ? "abajo" : "arriba";
    let p = punta(l), b = caja_en(l, p);
    if (!cabe(b)) {
        const otro = l === "arriba" ? "abajo" : "arriba";
        const p2 = punta(otro), b2 = caja_en(otro, p2);
        if (cabe(b2)) { l = otro; p = p2; b = b2; }
    }
    // no tapar a los otros globos: correrse hacia afuera de quien habla
    for (let i = 0; i < 8; i++) {
        const choca = ocupados.find((o) => solapan(b, o));
        if (!choca) break;
        const dy = l === "arriba" ? choca.y0 - b.y1 - margen * 0.5 : choca.y1 - b.y0 + margen * 0.5;
        b = {x0: b.x0, x1: b.x1, y0: b.y0 + dy, y1: b.y1 + dy};
    }
    // siempre dentro del cuadro (aunque tape: es lo que menos molesta)
    const dy = b.y0 < lim.y0 ? lim.y0 - b.y0 : b.y1 > lim.y1 ? lim.y1 - b.y1 : 0;
    b = {x0: b.x0, x1: b.x1, y0: b.y0 + dy, y1: b.y1 + dy};
    return {...b, punta: {x: p.x, y: Math.min(lim.y1, Math.max(lim.y0, p.y))}, lado: l};
}

// ---------------------------------------------------------------- dibujo

// Medidas base en pixeles de la camara (se multiplican por 1/zoom para quedar en el dibujo).
function medidas(cam) {
    const base = Math.min(cam.ancho, cam.alto);
    const fuente = Math.round(base * 0.05);            // ~54 px en un video de 1080 de ancho
    return {fuente, relleno: fuente * 0.6, cola: fuente * 1.3, margen: fuente * 0.6, ancho_max: cam.ancho * 0.66,
        linea: fuente * 1.22, borde: Math.max(2, fuente * 0.1)};
}

function caminoRedondeado(ctx, b, rad, punta, ancho_cola) {
    const {x0, y0, x1, y1} = b, r = Math.min(rad, (x1 - x0) / 2, (y1 - y0) / 2);
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    // borde de arriba (con la cola si el globo esta abajo de quien habla)
    if (punta && punta.y < y0) {
        const cx = Math.min(x1 - r - ancho_cola, Math.max(x0 + r + ancho_cola, punta.x));
        ctx.lineTo(cx - ancho_cola / 2, y0); ctx.lineTo(punta.x, punta.y); ctx.lineTo(cx + ancho_cola / 2, y0);
    }
    ctx.arcTo(x1, y0, x1, y1, r);
    ctx.arcTo(x1, y1, x0, y1, r);
    // borde de abajo (cola hacia quien habla, que esta debajo)
    if (punta && punta.y > y1) {
        const cx = Math.min(x1 - r - ancho_cola, Math.max(x0 + r + ancho_cola, punta.x));
        ctx.lineTo(cx + ancho_cola / 2, y1); ctx.lineTo(punta.x, punta.y); ctx.lineTo(cx - ancho_cola / 2, y1);
    }
    ctx.arcTo(x0, y1, x0, y0, r);
    ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath();
}

// Globo de grito: picos alrededor de una elipse, uno de ellos hacia quien habla.
function caminoGrito(ctx, b, punta) {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const rx = (b.x1 - b.x0) / 2 * 1.28, ry = (b.y1 - b.y0) / 2 * 1.5;
    const n = 22;
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = i % 2 ? 1.0 : 1.16 + 0.06 * Math.sin(i * 2.3);
        pts.push({x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k, pico: !(i % 2)});
    }
    if (punta) {
        // el pico mas cercano a la punta se estira hasta ella
        let mejor = 0, dmin = Infinity;
        pts.forEach((p, i) => { if (!p.pico) return; const d = (p.x - punta.x) ** 2 + (p.y - punta.y) ** 2; if (d < dmin) { dmin = d; mejor = i; } });
        pts[mejor] = {...punta};
    }
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
}

// Nube de pensamiento: UN solo contorno ondulado (festones hacia afuera alrededor de una elipse)
// y burbujas que bajan hacia quien piensa. NUBE.extra: cuanto sobresale la nube de la caja del texto.
const NUBE = {bulto: 0.55};          // altura de cada feston, en letras de alto (igual en todo el contorno)
export function geometriaNube(b, M) {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const rx = (b.x1 - b.x0) / 2 + M.relleno * 0.5, ry = (b.y1 - b.y0) / 2 + M.relleno * 0.45;
    // un feston cada ~1,7 letras de alto de perimetro (minimo 7): bultos parejos en globos anchos o chicos
    const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = Math.max(7, Math.round(per / (M.fuente * 1.7)));
    // angulos repartidos por LARGO del contorno (no por angulo): festones parejos aunque la elipse sea ancha
    const muestras = 360, largo = [0];
    for (let i = 1; i <= muestras; i++) {
        const a0 = ((i - 1) / muestras) * Math.PI * 2, a1 = (i / muestras) * Math.PI * 2;
        largo.push(largo[i - 1] + Math.hypot(rx * (Math.cos(a1) - Math.cos(a0)), ry * (Math.sin(a1) - Math.sin(a0))));
    }
    const total = largo[muestras], angulos = [];
    for (let k = 0, j = 0; k <= n; k++) {
        // el ultimo cierra exacto en 2π (antes, por redondeo, a veces salia NaN y el feston de la
        // derecha desaparecia en algunos cuadros: parpadeaba mientras se escribia el texto)
        if (k === n) { angulos.push(Math.PI * 2); break; }
        const objetivo = (total * (k + 0.1 * Math.sin(k * 2.7) * (k % n ? 1 : 0))) / n;
        while (j < muestras - 1 && largo[j + 1] < objetivo) j++;
        const u = (objetivo - largo[j]) / Math.max(1e-9, largo[j + 1] - largo[j]);
        angulos.push(((j + Math.min(1, Math.max(0, u))) / muestras) * Math.PI * 2);
    }
    return {cx, cy, rx, ry, n, angulos, bulto: M.fuente * NUBE.bulto};
}
// lo que la nube sobresale de la caja del texto (para ubicarla entera dentro del cuadro)
function extraNube(w, h, M) {
    const g = geometriaNube({x0: 0, y0: 0, x1: w, y1: h}, M);
    return [g.rx + g.bulto - w / 2, g.ry + g.bulto - h / 2];
}
function caminoNube(ctx, g) {
    const {cx, cy, rx, ry, n, angulos, bulto} = g;
    // punto de la elipse en el angulo a, corrido d hacia afuera por la normal
    const en = (a, d = 0) => {
        const nx = Math.cos(a) / rx, ny = Math.sin(a) / ry, l = Math.hypot(nx, ny) || 1;
        return [cx + Math.cos(a) * rx + (nx / l) * d, cy + Math.sin(a) * ry + (ny / l) * d];
    };
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const a0 = angulos[i], a1 = angulos[i + 1];
        const da = a1 - a0;
        const p0 = en(a0), p1 = en(a1), c1 = en(a0 + da * 0.1, bulto * 1.33), c2 = en(a0 + da * 0.9, bulto * 1.33);
        if (i === 0) ctx.moveTo(p0[0], p0[1]);
        ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p1[0], p1[1]);
    }
    ctx.closePath();
}
function dibujarNube(ctx, b, punta, M, colores) {
    const g = geometriaNube(b, M);
    caminoNube(ctx, g);
    ctx.fillStyle = colores.fondo; ctx.fill();
    ctx.lineWidth = M.borde; ctx.strokeStyle = colores.borde; ctx.stroke();
    if (!punta) return;
    // burbujas: del borde de la nube hacia la punta, cada vez mas chicas
    const borde = {x: g.cx + (punta.x - g.cx) * 0.35, y: punta.y < g.cy ? g.cy - g.ry - g.bulto * 0.7 : g.cy + g.ry + g.bulto * 0.7};
    for (const [f, rr] of [[0.3, 0.3], [0.62, 0.2], [0.9, 0.12]]) {
        ctx.beginPath();
        ctx.ellipse(borde.x + (punta.x - borde.x) * f, borde.y + (punta.y - borde.y) * f, M.fuente * rr * 1.25, M.fuente * rr, 0, 0, Math.PI * 2);
        ctx.fillStyle = colores.fondo; ctx.fill();
        ctx.lineWidth = M.borde * 0.9; ctx.strokeStyle = colores.borde; ctx.stroke();
    }
}

const COLORES = {
    dialogo: {fondo: "#ffffff", borde: "#1d1d1f", texto: "#1d1d1f"},
    pensamiento: {fondo: "#ffffff", borde: "#5a5a66", texto: "#2d2d36"},
    grito: {fondo: "#fff6b8", borde: "#1d1d1f", texto: "#b3121b"},
    narrador: {fondo: "rgba(18,18,26,0.82)", borde: "rgba(255,255,255,0.25)", texto: "#ffffff"},
};

// Dibuja los globos del instante t. m: motor (GestionEvento); ox, oy: paneo del editor.
// cajaDe(nombre) -> {x0,y0,x1,y1} en el dibujo (por defecto cajaMundo).
export function dibujarDialogos(m, ctx, ox, oy, t, cajaDe = (n) => cajaMundo(m, n)) {
    const lista = (m.escena && m.escena.dialogos) || [];
    // (contextos de prueba, como el del reporte, no miden texto: no se dibujan globos)
    if (!lista.length || typeof ctx.measureText !== "function") return;
    const prueba = ctx.measureText("M");
    if (!prueba || typeof prueba.width !== "number") return;
    const rc = m.rectCamara ? m.rectCamara() : null;
    const cam = rc ? {ancho: rc.ancho, alto: rc.alto} : {ancho: 1280, alto: 720};
    const r = rc ? {x0: rc.x0, y0: rc.y0, w: rc.w, h: rc.h} : {x0: 0, y0: 0, w: 1280, h: 720};
    const k = rc ? rc.w / rc.ancho : 1;                    // 1 / zoom: tamano constante en el video
    const M0 = medidas(cam);
    const M = Object.fromEntries(Object.entries(M0).map(([n, v]) => [n, v * k]));
    const ocupados = [];
    // textos en la escena (no son globos: no ocupan lugar ni se acomodan)
    for (const d of lista) {
        if (d.estilo !== "texto" || !Array.isArray(d.en) || !(d.tamano > 0)) continue;
        const e = estadoTexto(d, t);
        if (e) dibujarTexto(ctx, d, e, ox, oy, cajaDe);
    }
    const activos = lista.filter((d) => d.estilo !== "texto").map((d) => ({d, e: estadoGlobo(d, t)})).filter((x) => x.e)
        .sort((a, b) => a.d.desde - b.d.desde);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const {d, e} of activos) {
        const estilo = ESTILOS_GLOBO.includes(d.estilo) ? d.estilo : "dialogo";
        const col = COLORES[estilo];
        const fuente = estilo === "grito" ? M.fuente * 1.15 : M.fuente;
        ctx.font = `${estilo === "grito" ? "bold " : estilo === "narrador" ? "italic " : ""}${fuente}px ${FUENTE}`;
        const medir = (s) => ctx.measureText(s).width;
        // (el pensamiento, mas angosto: la nube queda redonda y no aplastada)
        const ancho_max = estilo === "narrador" ? r.w - M.margen * 2 - M.relleno * 2 : estilo === "pensamiento" ? M.ancho_max * 0.72 : M.ancho_max;
        const lineas = cortarLineas(d.texto, ancho_max, medir);
        const w_texto = Math.max(...lineas.map(medir), fuente);
        const w = (estilo === "narrador" ? r.w - M.margen * 2 : w_texto + M.relleno * 2);
        const h = lineas.length * M.linea + M.relleno * 1.4;
        let b, punta = null;
        if (estilo === "narrador") {
            const y0 = d.posicion === "abajo" ? r.y0 + r.h - M.margen * 2 - h : r.y0 + M.margen * 2;
            b = {x0: r.x0 + M.margen, y0, x1: r.x0 + M.margen + w, y1: y0 + h};
        } else {
            const caja = d.quien ? cajaHablante(d, cajaDe) : null;
            if (!caja) continue;                          // quien habla no esta (o no se dibuja)
            // lo que la forma sobresale de la caja del texto (para ubicarla entera dentro del cuadro)
            const [ex, ey] = estilo === "grito" ? [w * 0.28 + M.fuente * 0.3, h * 0.5 + M.fuente * 0.3]
                : estilo === "pensamiento" ? extraNube(w, h, M)
                : [0, 0];
            const u = ubicarGlobo({caja, w: w + ex * 2, h: h + ey * 2, r, cola: M.cola, margen: M.margen,
                lado: d.lado, desplazar: Array.isArray(d.desplazar) ? d.desplazar : [0, 0], ocupados});
            b = {x0: u.x0 + ex, y0: u.y0 + ey, x1: u.x1 - ex, y1: u.y1 - ey};
            punta = u.punta;
            ocupados.push({x0: u.x0, y0: u.y0, x1: u.x1, y1: u.y1});
        }
        // al dibujo del editor se le suma el paneo
        const mover = (o) => ({...o, x0: o.x0 + ox, x1: o.x1 + ox, y0: o.y0 + oy, y1: o.y1 + oy});
        b = mover(b);
        if (punta) punta = {x: punta.x + ox, y: punta.y + oy};
        // aparicion: escala desde la punta (o el centro)
        const o = punta || {x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2};
        ctx.save();
        ctx.globalAlpha = e.alfa;
        ctx.translate(o.x, o.y); ctx.scale(e.escala, e.escala); ctx.translate(-o.x, -o.y);
        ctx.lineJoin = "round";
        if (estilo === "pensamiento") dibujarNube(ctx, b, punta, M, col);
        else {
            if (estilo === "grito") caminoGrito(ctx, b, punta);
            else caminoRedondeado(ctx, b, estilo === "narrador" ? M.fuente * 0.35 : M.fuente * 0.7, punta, M.fuente * 0.9);
            ctx.fillStyle = col.fondo; ctx.fill();
            ctx.lineWidth = estilo === "grito" ? M.borde * 1.4 : M.borde;
            ctx.strokeStyle = col.borde; ctx.stroke();
        }
        // texto, letra por letra (las lineas ya estan cortadas con el texto completo: el globo no cambia de tamano)
        ctx.fillStyle = col.texto;
        let quedan = e.letras;
        const y_primera = (b.y0 + b.y1) / 2 - (lineas.length - 1) * M.linea / 2;
        lineas.forEach((ln, i) => {
            if (quedan <= 0) return;
            const ls = letras(ln);
            const parte = ls.slice(0, quedan).join("");
            quedan -= ls.length + 1;                          // (+1: el espacio o salto que se corto)
            // alineado como la linea completa (el texto no "baila" mientras se escribe)
            const x_izq = (b.x0 + b.x1) / 2 - medir(ln) / 2;
            ctx.textAlign = "left";
            ctx.fillText(parte, x_izq, y_primera + i * M.linea);
        });
        ctx.restore();
    }
    ctx.restore();
}
