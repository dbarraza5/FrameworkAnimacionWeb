// Pruebas de arte (planeacion_pruebas_arte.md), fase 4: PAPEL RECORTADO.
// Escena original: "El zorro de papel y la luna". Un zorro de cartulina (marioneta con broches en las
// articulaciones) cruza un bosque de capas de papel hacia una colina, donde se sienta a mirar la luna
// que sube. Las capas del fondo se mueven a distinta velocidad (paralaje), caen hojas de papel y la
// animacion va a 12 cuadros por segundo (stop-motion). El estilo agrega el grano del papel.
//   asset_01 Cielo de papel, 02 Luna de papel, 03 Colinas lejanas, 04 Colinas del medio, 05 Colina cercana,
//   06 Pino de papel, 07 Nube de papel, 08 Hoja de papel, 09 Casita de papel, 10 Zorro de papel;  escena.json (15 s)
//   node herramientas/ejemplos/arte/papel/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(41);
const P = {noche: "#1d2550", indigo: "#2f3a78", azulLejos: "#5a6fa0", verdeLejos: "#4f7f86", verdeMedio: "#3f7a52", verdeCerca: "#24533a",
    pino: "#1f4a33", pinoClaro: "#2d6646", crema: "#f4ead2", lunaSombra: "#e2d3ae", naranja: "#e8752e", naranjaOsc: "#b9541c", blanco: "#f7f2e6",
    marron: "#6a4026", rojo: "#c9452f", amarillo: "#f2c94c", gris: "#3a3550"};

// ---- ayudantes de papel ----
// borde "cortado a tijera": cada lado se parte en tramos y cada punto se corre un poco al azar
function recortar(pts, paso = 26, mov = 2.2) {
    const r = [];
    for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], l = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(l / paso));
        for (let k = 0; k < n; k++) { const u = k / n; r.push([r2(x0 + (x1 - x0) * u + (azar() - 0.5) * mov), r2(y0 + (y1 - y0) * u + (azar() - 0.5) * mov)]); }
    }
    return r;
}
// una pieza de papel con su sombra sobre la capa de atras (copia oscura corrida y desenfocada)
function pieza(nombre, pts, color, {capa = 1, sombra = [5, 7], blur = 3, opac = 0.38, extra = {}} = {}) {
    const forma = recortar(pts);
    const r = [];
    if (sombra) r.push({nombre: `${nombre}_sombra`, capa: capa - 0.5 < 0 ? 0 : capa, en: sombra, poligono: forma, color: `rgba(10,8,20,${opac})`, borde: TRANSP, ...(blur ? {desenfoque: blur} : {})});
    r.push({nombre, capa, poligono: forma, ...(typeof color === "string" ? {color} : {degradado: color}), borde: TRANSP, ...extra});
    return r;
}
// perfil de colinas: puntos de una linea ondulada de x0 a x1 alrededor de y, cerrada hacia abajo hasta `fondo`
function colina(x0, x1, y, amp, ondas, fondo, fase = 0) {
    const pts = [], n = 40;
    for (let i = 0; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u; pts.push([r2(x), r2(y - amp * (0.6 * Math.sin(u * ondas * TAU + fase) + 0.4 * Math.sin(u * ondas * 2.3 * TAU + fase * 2)))]); }
    return [...pts, [x1, fondo], [x0, fondo]];
}
const estrella5 = (r) => Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return [r2(Math.cos(a) * rr), r2(Math.sin(a) * rr)]; });

// ------------------------------------------------------------------ CIELO (origen arriba a la izquierda; 3000 x 900)
function cielo() {
    const partes = [{nombre: "fondo", capa: 0, rect: [-600, -100, 3400, 900], degradado: lineal([0, -100], [0, 700], [[0, P.noche], [0.6, P.indigo], [1, "#6a5a9a"]])}];
    for (let i = 0; i < 34; i++) {
        const x = -500 + azar() * 3800, y = azar() * 380, r = 5 + azar() * 7;
        partes.push(...pieza(`estrella_${i}`, estrella5(r).map(([a, b]) => [a + x, b + y]), P.amarillo, {capa: 1, sombra: [2, 3], blur: 0, opac: 0.3,
            extra: {claves: {opacidad: [[0, 1, "mantener"], [700 + (i % 5) * 330, 0.55, "mantener"], [1400 + (i % 3) * 200, 1, "mantener"], [3000, 1]]}, bucle: "repetir"}}));
    }
    return {tipo: "asset", nombre: "Cielo de papel", duracion: 3000, marcas, partes};
}

// ------------------------------------------------------------------ LUNA (centro en 0,0)
const luna = () => ({tipo: "asset", nombre: "Luna de papel", duracion: 1000, marcas, partes: [
    {nombre: "halo", capa: 0, circulo: {r: 170, lados: 40}, degradado: radial([0, 0], 170, [[0, "rgba(255,245,210,0.35)"], [1, "rgba(255,245,210,0)"]]), borde: TRANSP},
    ...pieza("disco", ovalo(0, 0, 92, 92, 40), radial([-25, -25], 130, [[0, P.crema], [1, P.lunaSombra]]), {capa: 1, sombra: [6, 8], blur: 4}),
    ...[[-28, -20, 18], [30, 18, 13], [-6, 40, 10], [36, -32, 8]].flatMap(([x, y, r], k) => pieza(`crater_${k}`, ovalo(x, y, r, r * 0.9, 14), P.lunaSombra, {capa: 3, sombra: [1.5, 2], blur: 0, opac: 0.25})),
]});

// ------------------------------------------------------------------ COLINAS (tres capas; origen arriba a la izquierda, mundo de 3000 de ancho)
const colinas = (nombre, y, amp, ondas, color, fondo, fase, sombra) => ({tipo: "asset", nombre, duracion: 1000, marcas,
    partes: pieza("capa", colina(-600, 3400, y, amp, ondas, fondo, fase), color, {capa: 1, sombra, blur: 5, opac: 0.42})});

// ------------------------------------------------------------------ PINO (pies en 0,0; ~260 de alto)
function pino() {
    const pisos = [[0, -40, 80, 100], [0, -110, 64, 90], [0, -170, 46, 80]];
    return {tipo: "asset", nombre: "Pino de papel", duracion: 2400, marcas, partes: [
        ...pieza("tronco", [[-9, 0], [9, 0], [8, -50], [-8, -50]], P.marron, {capa: 1, sombra: [4, 5], blur: 2}),
        {nombre: "copa", capa: 2, pivote: [0, -40], claves: {rotacion: ciclo(2400, (u) => 2 * Math.sin(TAU * u))}, bucle: "repetir",
            partes: pisos.flatMap(([x, y, w, h], k) => pieza(`piso_${k}`, [[x - w, y], [x + w, y], [x, y - h]], k % 2 ? P.pinoClaro : P.pino, {capa: 1 + k, sombra: [4, 6], blur: 3}))},
    ]};
}

// ------------------------------------------------------------------ NUBE (centro en 0,0)
// contorno de arriba = el borde superior de la union de tres circulos; abajo, recta
function contornoNube() {
    const bolas = [[-50, 0, 52], [20, -18, 62], [90, 0, 46]], pts = [];
    for (let x = -102; x <= 136; x += 6) {
        let y = 10;
        for (const [cx, cy, r] of bolas) if (Math.abs(x - cx) < r) y = Math.min(y, cy - Math.sqrt(r * r - (x - cx) * (x - cx)));
        pts.push([x, r2(Math.min(y, 10))]);
    }
    return [...pts, [136, 10], [-102, 10]];
}
const nube = () => ({tipo: "asset", nombre: "Nube de papel", duracion: 1000, marcas, partes:
    pieza("nube", contornoNube(), P.blanco, {capa: 1, sombra: [6, 8], blur: 4, opac: 0.3})});

// ------------------------------------------------------------------ HOJA QUE CAE (cae y gira en zigzag, en bucle; origen arriba)
function hoja() {
    const DUR = 5000, y = [], x = [], rot = [];
    for (let t = 0; t <= DUR; t += 100) { const u = t / DUR; y.push([t, r2(u * 760), "lineal"]); x.push([t, r2(40 * Math.sin(u * TAU * 2.5)), "suave"]); rot.push([t, r2(40 * Math.sin(u * TAU * 2.5 + 1)), "suave"]); }
    return {tipo: "asset", nombre: "Hoja de papel", duracion: DUR, marcas, partes: [
        {nombre: "hoja", capa: 1, claves: {y, x, rotacion: rot, opacidad: [[0, 0, "mantener"], [100, 1, "mantener"], [DUR - 200, 0, "mantener"], [DUR, 0]]}, bucle: "repetir",
            partes: pieza("lamina", [[0, -12], [7, -4], [6, 6], [0, 12], [-6, 6], [-7, -4]], P.naranja, {capa: 1, sombra: [2, 3], blur: 0, opac: 0.3})},
    ]};
}

// ------------------------------------------------------------------ CASITA (pies en 0,0; ventana encendida)
const casita = () => ({tipo: "asset", nombre: "Casita de papel", duracion: 2000, marcas, partes: [
    ...pieza("pared", [[-40, 0], [40, 0], [40, -50], [-40, -50]], "#d9b98a", {capa: 1, sombra: [4, 5], blur: 2}),
    ...pieza("techo", [[-50, -48], [50, -48], [0, -92]], P.rojo, {capa: 2, sombra: [4, 5], blur: 2}),
    ...pieza("ventana", [[-12, -36], [8, -36], [8, -18], [-12, -18]], P.amarillo, {capa: 3, sombra: false, extra: {claves: {opacidad: [[0, 1, "mantener"], [1300, 0.75, "mantener"], [1500, 1, "mantener"], [2000, 1]]}, bucle: "repetir"}}),
    ...pieza("puerta", [[16, 0], [30, 0], [30, -26], [16, -26]], P.marron, {capa: 3, sombra: false}),
]});

// ------------------------------------------------------------------ ZORRO DE PAPEL (marioneta articulada; mira a la derecha; pies en 0,0)
function zorro() {
    const broche = (nombre, x, y) => ({nombre, en: [x, y], circulo: {r: 2.6, lados: 10}, color: "#c9b07a", borde: TRANSP});
    const pata = (n, x, color, capa) => ({nombre: `pata_${n}`, capa, pivote: [x, -46], partes: [
        ...pieza(`pata_${n}_papel`, [[x - 7, -50], [x + 7, -50], [x + 6, -8], [x + 12, -6], [x + 12, 0], [x - 7, 0]], color, {capa: 1, sombra: [2, 3], blur: 0, opac: 0.3}),
        {...broche(`pata_${n}_broche`, x, -44), capa: 3},
    ]});
    const partes = [
        {nombre: "sombra_suelo", capa: 0, poligono: ovalo(0, 2, 70, 7, 18), color: "rgba(10,8,20,0.3)", borde: TRANSP},
        {nombre: "cuerpo", capa: 1, pivote: [0, -50], partes: [
            {nombre: "cola", capa: 0, pivote: [-48, -66], partes: [
                ...pieza("cola_papel", [[-46, -72], [-80, -86], [-112, -82], [-126, -64], [-104, -60], [-76, -58], [-46, -56]], P.naranja, {capa: 1, sombra: [3, 4], blur: 0}),
                ...pieza("cola_punta", [[-104, -84], [-126, -66], [-108, -60], [-98, -72]], P.blanco, {capa: 2, sombra: false}),
                {...broche("cola_broche", -48, -64), capa: 3},
            ]},
            pata("atras_lejos", -34, P.naranjaOsc, 1),
            pata("del_lejos", 28, P.naranjaOsc, 1),
            ...pieza("torso", [[-52, -78], [30, -84], [52, -70], [48, -44], [-50, -42]], P.naranja, {capa: 2, sombra: [3, 4], blur: 0}),
            ...pieza("panza", [[-30, -48], [36, -50], [44, -62], [10, -56]], P.blanco, {capa: 3, sombra: false}),
            pata("atras_cerca", -40, P.naranja, 4),
            pata("del_cerca", 34, P.naranja, 4),
            {nombre: "cabeza", capa: 5, en: [46, -84], pivote: [0, 8], partes: [
                ...pieza("oreja_1", [[-4, -10], [4, -38], [14, -12]], P.naranjaOsc, {capa: 1, sombra: false}),
                ...pieza("craneo", [[-14, 8], [-16, -12], [0, -22], [16, -14], [40, 2], [42, 8], [20, 14], [-4, 16]], P.naranja, {capa: 2, sombra: [3, 4], blur: 0}),
                ...pieza("cara_blanca", [[14, 6], [40, 4], [42, 8], [22, 14], [8, 12]], P.blanco, {capa: 3, sombra: false}),
                ...pieza("oreja_2", [[6, -12], [16, -40], [24, -10]], P.naranja, {capa: 3, sombra: [2, 3], blur: 0}),
                {nombre: "nariz", capa: 4, en: [42, 4], circulo: {r: 3.6, lados: 10}, color: P.gris, borde: TRANSP},
                {nombre: "ojo", capa: 4, en: [18, -6], poligono: [[-4, 0], [0, -2.5], [4, 0], [0, 2]], color: P.gris, borde: TRANSP},
                {...broche("cabeza_broche", 0, 8), capa: 4},
            ]},
        ]},
    ];
    const params = {cy: ["cuerpo", "y"], rot: ["cuerpo", "rotacion"], cab: ["cabeza", "rotacion"], cola: ["cola", "rotacion"],
        ac: ["pata_atras_cerca", "rotacion"], al: ["pata_atras_lejos", "rotacion"], dc: ["pata_del_cerca", "rotacion"], dl: ["pata_del_lejos", "rotacion"]};
    const base = {cy: 0, rot: 0, cab: 0, cola: 0, ac: 0, al: 0, dc: 0, dl: 0};
    const acciones = [
        {nombre: "Caminar", dur: 1000, pose: (tl, d) => { const th = TAU * tl / d;
            return {ac: 22 * Math.sin(th), dl: 22 * Math.sin(th), al: -22 * Math.sin(th), dc: -22 * Math.sin(th), cy: -3 * Math.abs(Math.sin(th)), cab: 3 * Math.sin(th * 2), cola: 8 * Math.sin(th)}; }},
        {nombre: "Quieto", dur: 2000, pose: (tl, d) => ({cola: 6 * Math.sin(TAU * tl / d), cab: 2 * Math.sin(TAU * tl / d)})},
        // se sienta (cuerpo inclinado hacia atras, patas de atras dobladas) y levanta la cabeza a la luna
        {nombre: "Mirar la luna", dur: 3000, pose: (tl) => { const k = tramo(tl, 0, 700), m = tramo(tl, 500, 1300);
            return {rot: -28 * k, cy: 10 * k, ac: -62 * k, al: -62 * k, dc: 28 * k, dl: 28 * k, cab: -30 * m + 2 * Math.sin(TAU * tl / 1500), cola: 30 * k + 8 * Math.sin(TAU * tl / 1200)}; }},
    ];
    return asset("Zorro de papel", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LA ESCENA (15 s, stop-motion a 12 cps)
function escena() {
    const DUR = 15000, PISO = 610, LLEGA = 9000;
    // camara: paneo de izquierda a derecha siguiendo al zorro, despues quieta mirando la colina y la luna
    const camX = (t) => 640 + 820 * tramo(t, 0, LLEGA + 600);
    const cx = [], cy = [], zoom = [];
    for (let t = 0; t <= DUR; t += 250) { cx.push([t, r2(camX(t)), "lineal"]); cy.push([t, r2(380 - 30 * tramo(t, LLEGA, DUR)), "lineal"]); zoom.push([t, r2(1 + 0.12 * tramo(t, LLEGA, DUR)), "lineal"]); }
    // paralaje: una capa con factor f se corre con la camara f * desplazamiento (f = 1: queda fija en pantalla)
    const paralaje = (base, f) => cx.map(([t, x]) => [t, r2(base + (x - 640) * f), "lineal"]);
    // el zorro camina por la colina cercana hasta la cima y se sienta
    const zx = [[0, 220], [LLEGA, 1700, "lineal"]];
    const objetos = [
        {instancia: "Cielo de papel", nombre: "cielo", en: [0, 0], plano: -10, claves: {x: paralaje(0, 0.9)}},
        {instancia: "Luna de papel", nombre: "luna", en: [1650, 640], plano: -9, claves: {x: paralaje(1080, 0.8), y: [[0, 640], [12000, 210, "suave"]]}},
        {instancia: "Nube de papel", nombre: "nube_1", en: [400, 150], plano: -8, claves: {x: paralaje(300, 0.75).map(([t, x]) => [t, r2(x + t * 0.02), "lineal"])}},
        {instancia: "Nube de papel", nombre: "nube_2", en: [1400, 90], plano: -8, escala: 0.8, claves: {x: paralaje(1300, 0.75).map(([t, x]) => [t, r2(x + t * 0.015), "lineal"])}},
        {instancia: "Colinas lejanas", nombre: "colinas_lejos", en: [0, 0], plano: -7, claves: {x: paralaje(0, 0.6)}},
        {instancia: "Casita de papel", nombre: "casita", en: [1200, 470], plano: -6.5, escala: 0.7, claves: {x: paralaje(1520, 0.6)}},
        {instancia: "Colinas del medio", nombre: "colinas_medio", en: [0, 0], plano: -6, claves: {x: paralaje(0, 0.35)}},
        ...[[300, 560, 0.7], [520, 545, 0.6], [980, 560, 0.75], [1500, 540, 0.65], [1900, 555, 0.7]].map(([x, y, e], i) =>
            ({instancia: "Pino de papel", nombre: `pino_medio_${i}`, en: [x, y], plano: -5.5, escala: e, desfase: i * 400, claves: {x: paralaje(x, 0.35)}})),
        {instancia: "Colina cercana", nombre: "colina_cerca", en: [0, 0], plano: -4},
        ...[[120, 640, 1.2], [760, 650, 1.35], [1180, 640, 1.1], [2150, 650, 1.3]].map(([x, y, e], i) => ({instancia: "Pino de papel", nombre: `pino_cerca_${i}`, en: [x, y], plano: 2, escala: e, desfase: i * 700})),
        {instancia: "Zorro de papel", nombre: "zorro", en: [220, PISO], plano: 1, escala: 1.1, claves: {x: zx, y: [[0, PISO], [LLEGA, PISO - 40, "suave"]]},
            acciones: [[0, "Caminar"], [LLEGA, "Quieto"], [LLEGA + 500, "Mirar la luna", false]]},
        // hojas que caen (en primer plano y en el medio)
        ...Array.from({length: 9}, (_, i) => ({instancia: "Hoja de papel", nombre: `hoja_${i}`, en: [r2(300 + i * 230 + azar() * 100), -40], plano: i % 2 ? 3 : -5, escala: i % 2 ? 1.3 : 0.8, desfase: r2(i * 610 + azar() * 400)})),
    ];
    return {
        tipo: "escena", nombre: "El zorro de papel y la luna", duracion: DUR, precision: "decimal", profundidad: false, fps_animacion: 12,
        estilo: {papel: {intensidad: 0.12, fibras: 0.5, escala: 1}},
        camara: {tamano: [1280, 720], centro: [640, 380], zoom: 1, claves: {x: cx, y: cy, zoom}},
        objetos,
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cielo(), luna(),
    colinas("Colinas lejanas", 470, 40, 3, P.azulLejos, 900, 0.3, [6, 8]),
    colinas("Colinas del medio", 545, 32, 4, lineal([0, 500], [0, 760], [[0, P.verdeLejos], [1, "#355f5a"]]), 900, 1.7, [6, 9]),
    colinas("Colina cercana", 640, 26, 1.6, lineal([0, 600], [0, 800], [[0, P.verdeMedio], [1, P.verdeCerca]]), 900, 4.1, [6, 10]),
    pino(), nube(), hoja(), casita(), zorro()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
