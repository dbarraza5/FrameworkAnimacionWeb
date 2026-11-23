// Pruebas de arte (planeacion_pruebas_arte.md), fase 10: LOW POLY / FACETADO.
// Escena original: "El valle de las montañas de cristal". Amanece en un valle hecho de triangulos: el sol
// sale y la luz que llega a las caras de las montanas cambia (facetas.luces), corre un rio, pasan nubes
// facetadas y un ciervo baja a beber. El estilo sube el brillo con el amanecer (estilo.claves.brillo).
//   asset_01 Cielo facetado, 02 Sol facetado, 03 Cordillera lejana, 04 Montañas de cristal, 05 Colinas,
//   06 Río facetado, 07 Pino low poly, 08 Nube facetada, 09 Ciervo low poly;  escena.json (15 s)
//   node herramientas/ejemplos/arte/lowpoly/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(55);
const DUR = 15000, HOR = 470;
// la luz del amanecer: llega rasante desde la izquierda y va subiendo
const LUCES = [[0, [-1, -0.15, 0.35]], [5000, [-1, -0.45, 0.6]], [10000, [-0.7, -0.8, 0.85]], [DUR, [-0.45, -1, 1]]];
const monte = (x0, x1, picos) => [[x0, 0], ...picos.map(([u, h]) => [r2(x0 + (x1 - x0) * u), r2(-h)]), [x1, 0]];

// ------------------------------------------------------------------ CIELO (tres bandas facetadas; origen arriba a la izquierda)
const cielo = () => ({tipo: "asset", nombre: "Cielo facetado", duracion: 1000, marcas, partes: [
    {nombre: "alto", capa: 0, poligono: [[-200, -120], [1500, -120], [1500, 160], [-200, 200]], color: "#5a6ab0", facetas: {luz: [0, -1, 1], detalle: 110, relieve: 0.15, sombra: 0.9, luzMax: 1.08, semilla: 1}},
    {nombre: "medio", capa: 1, poligono: [[-200, 200], [1500, 160], [1500, 360], [-200, 380]], color: "#c88ab0", facetas: {luz: [0, -1, 1], detalle: 100, relieve: 0.15, sombra: 0.9, luzMax: 1.08, semilla: 2}},
    {nombre: "bajo", capa: 2, poligono: [[-200, 380], [1500, 360], [1500, 900], [-200, 900]], color: "#f4b88a", facetas: {luz: [0, -1, 1], detalle: 90, relieve: 0.15, sombra: 0.9, luzMax: 1.1, semilla: 3}},
]});
const sol = () => ({tipo: "asset", nombre: "Sol facetado", duracion: 1000, marcas, partes: [
    {nombre: "halo", circulo: {r: 170, lados: 12}, color: "rgba(255,230,170,0.25)", borde: TRANSP},
    {nombre: "disco", poligono: ovalo(0, 0, 70, 70, 10), color: "#ffd88a", facetas: {luz: [-0.5, -0.5, 1], detalle: 36, relieve: 0.6, sombra: 0.85, luzMax: 1.15, semilla: 4}},
]});

// ------------------------------------------------------------------ MONTANAS (pies en el horizonte)
const cordillera = () => ({tipo: "asset", nombre: "Cordillera lejana", duracion: DUR, marcas, partes: [
    {nombre: "cordillera", poligono: monte(-200, 1500, [[0.06, 120], [0.16, 200], [0.27, 140], [0.38, 230], [0.5, 150], [0.62, 210], [0.74, 120], [0.86, 190], [0.96, 110]]),
        color: "#9a8ac8", facetas: {luces: LUCES, detalle: 70, relieve: 0.9, semilla: 5}},
]});
function montanasCristal() {
    const partes = [];
    [[-120, 380, 360, 1.0, 6], [260, 760, 300, 0.85, 7], [700, 1200, 400, 1.1, 8], [1060, 1460, 280, 0.8, 9]].forEach(([x0, x1, h, e, sem], k) => {
        const cima = [r2((x0 + x1) / 2 + (azar() - 0.5) * 60), -h];
        partes.push({nombre: `monte_${k}`, capa: k % 2 ? 0 : 1, poligono: [[x0, 0], [r2(x0 + (x1 - x0) * 0.25), r2(-h * 0.55)], cima, [r2(x0 + (x1 - x0) * 0.72), r2(-h * 0.6)], [x1, 0]],
            color: k % 2 ? "#5a8ab8" : "#4a78a8", facetas: {luces: LUCES, detalle: 55, relieve: 1.2, semilla: sem}});
        // nieve facetada en la punta
        const [cx, cy] = cima;
        partes.push({nombre: `nieve_${k}`, capa: 2, poligono: [[r2(cx - h * 0.22), r2(cy + h * 0.24)], [cx, cy], [r2(cx + h * 0.2), r2(cy + h * 0.22)], [r2(cx + h * 0.08), r2(cy + h * 0.3)], [r2(cx - h * 0.06), r2(cy + h * 0.26)]],
            color: "#eef2ff", facetas: {luces: LUCES, detalle: 26, relieve: 1, semilla: sem + 10, sombra: 0.6}});
    });
    return {tipo: "asset", nombre: "Montañas de cristal", duracion: DUR, marcas, partes};
}
const colinas = () => ({tipo: "asset", nombre: "Colinas", duracion: DUR, marcas, partes: [
    {nombre: "colinas", poligono: [[-200, 0], [-200, -60], [100, -110], [400, -70], [700, -120], [1000, -60], [1300, -100], [1500, -70], [1500, 300], [-200, 300]],
        color: "#6aa86a", facetas: {luces: LUCES, detalle: 70, relieve: 0.5, semilla: 12}},
]});

// ------------------------------------------------------------------ RIO (franja sinuosa facetada con destellos que corren)
function rio() {
    const borde = (k) => Array.from({length: 15}, (_, i) => { const u = i / 14; return [r2(-200 + u * 1700), r2(70 + u * 150 + 40 * Math.sin(u * TAU * 1.3) + k)]; });
    const sup = borde(0), inf = borde(70).reverse();
    const partes = [{nombre: "agua", capa: 0, poligono: [...sup, ...inf], color: "#7ac0e0", facetas: {luces: LUCES, detalle: 45, relieve: 0.3, sombra: 0.75, luzMax: 1.15, semilla: 13}}];
    for (let i = 0; i < 14; i++) {
        const u0 = azar(), xs = [], ys = [];
        for (let t = 0; t <= 4000; t += 200) { const u = (u0 + t / 4000) % 1; xs.push([t, r2(-200 + u * 1700), "lineal"]); ys.push([t, r2(105 + u * 150 + 40 * Math.sin(u * TAU * 1.3) + (i % 3 - 1) * 15), "lineal"]); }
        partes.push({nombre: `destello_${i}`, capa: 1, poligono: [[-10, 0], [0, -3], [10, 0]], color: "#ffffff", opacidad: 0.8, claves: {x: xs, y: ys}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Río facetado", duracion: 4000, marcas, partes};
}

// ------------------------------------------------------------------ PINO LOW POLY (dos caras por piso: luz y sombra)
const pino = () => ({tipo: "asset", nombre: "Pino low poly", duracion: 1000, marcas, partes: [
    {nombre: "tronco", rect: [-4, -20, 4, 0], color: "#6a4a3a"},
    ...[0, 1, 2].flatMap((k) => { const y = -20 - k * 30, w = 34 - k * 8, h = 50 - k * 6; return [
        {nombre: `piso_${k}_luz`, poligono: [[-w, y], [0, y - h], [0, y + 4]], color: "#4a9a5a"},
        {nombre: `piso_${k}_sombra`, poligono: [[0, y - h], [w, y], [0, y + 4]], color: "#2f6a42"},
    ]; }),
]});

// ------------------------------------------------------------------ NUBE FACETADA
const nube = () => ({tipo: "asset", nombre: "Nube facetada", duracion: 1000, marcas, partes: [
    {nombre: "nube", poligono: [[-90, 10], [-70, -14], [-30, -30], [10, -40], [50, -28], [85, -8], [95, 12]], color: "#f6f0ff", facetas: {luz: [-0.6, -0.8, 1], detalle: 34, relieve: 0.8, sombra: 0.72, luzMax: 1.05, semilla: 21}},
]});

// ------------------------------------------------------------------ CIERVO LOW POLY (mira a la derecha; pies en 0,0)
function ciervo() {
    const T = (n, pts, color, extra = {}) => ({nombre: n, poligono: pts, color, ...extra});
    const pata = (n, x, color) => ({nombre: `pata_${n}`, pivote: [x, -46], partes: [T(`pata_${n}_t`, [[x - 4, -48], [x + 4, -48], [x + 2, 0], [x - 2, 0]], color)]});
    const partes = [
        {nombre: "cuerpo", pivote: [0, -50], partes: [
            pata("tras_lejos", -26, "#8a5a3a"), pata("del_lejos", 22, "#8a5a3a"),
            T("lomo", [[-34, -76], [20, -80], [0, -60]], "#c8844a"),
            T("panza", [[-34, -76], [0, -60], [-30, -50]], "#a8683a"),
            T("pecho", [[20, -80], [32, -64], [0, -60]], "#b8743f"),
            T("vientre", [[0, -60], [32, -64], [24, -50], [-30, -50]], "#9a5e34"),
            T("cola", [[-34, -76], [-42, -82], [-38, -70]], "#f0e0d0"),
            pata("tras_cerca", -30, "#a8683a"), pata("del_cerca", 26, "#a8683a"),
            {nombre: "cuello_cabeza", pivote: [24, -76], partes: [
                T("cuello", [[18, -80], [28, -110], [36, -104], [32, -66]], "#b8743f"),
                T("cabeza_a", [[28, -110], [52, -104], [36, -100]], "#c8844a"),
                T("cabeza_b", [[36, -100], [52, -104], [36, -94]], "#9a5e34"),
                T("oreja", [[30, -110], [24, -122], [34, -112]], "#8a5a3a"),
                {nombre: "ojo", en: [40, -104], circulo: {r: 1.6, lados: 6}, color: "#1a1010"},
                T("asta_1", [[30, -112], [26, -140], [29, -140], [33, -112]], "#e8d8b8"),
                T("asta_2", [[27, -128], [16, -136], [18, -138], [28, -131]], "#e8d8b8"),
                T("asta_3", [[28, -136], [36, -148], [38, -146], [30, -134]], "#e8d8b8"),
            ]},
        ]},
    ];
    const params = {tl: ["pata_tras_lejos", "rotacion"], dl: ["pata_del_lejos", "rotacion"], tc: ["pata_tras_cerca", "rotacion"], dc: ["pata_del_cerca", "rotacion"], cy: ["cuerpo", "y"], cab: ["cuello_cabeza", "rotacion"]};
    const base = {tl: 0, dl: 0, tc: 0, dc: 0, cy: 0, cab: 0};
    const acciones = [
        {nombre: "Caminar", dur: 1000, pose: (tl, d) => { const th = TAU * tl / d; return {tc: 18 * Math.sin(th), dl: 18 * Math.sin(th), tl: -18 * Math.sin(th), dc: -18 * Math.sin(th), cy: -1.5 * Math.abs(Math.sin(th)), cab: 3 * Math.sin(th * 2)}; }},
        // baja la cabeza al agua, bebe, la levanta y mira
        {nombre: "Beber", dur: 4000, pose: (tl) => { const baja = tramo(tl, 0, 700) - tramo(tl, 2800, 3400); return {cab: 62 * baja + 2 * Math.sin(TAU * tl / 500) * baja, dl: 8 * baja, dc: 8 * baja}; }},
        {nombre: "Mirar", dur: 2000, pose: (tl, d) => ({cab: -8 + 3 * Math.sin(TAU * tl / d)})},
    ];
    return asset("Ciervo low poly", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LA ESCENA (camara casi fija; 15 s)
function escena() {
    const LLEGA = 6000;
    return {
        tipo: "escena", nombre: "El valle de las montañas de cristal", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.78, radio: 14, intensidad: 0.6}, claves: {brillo: [[0, -0.12], [DUR, 0.04, "suave"]]}},
        camara: {tamano: [1280, 720], centro: [640, 380], zoom: 1, claves: {zoom: [[0, 1], [DUR, 1.1, "suave"]], x: [[0, 620], [DUR, 700, "suave"]], y: [[0, 380], [DUR, 400, "suave"]]}},
        objetos: [
            {instancia: "Cielo facetado", nombre: "cielo", en: [0, 0], plano: -10},
            {instancia: "Sol facetado", nombre: "sol", en: [300, HOR], plano: -9.5, claves: {y: [[0, HOR + 30], [DUR, HOR - 240, "suave"]], x: [[0, 280], [DUR, 360, "suave"]]}},
            {instancia: "Nube facetada", nombre: "nube_1", en: [200, 70], plano: -9, escala: 0.8, claves: {x: [[0, 150], [DUR, 380, "lineal"]]}},
            {instancia: "Nube facetada", nombre: "nube_2", en: [900, 40], plano: -9, escala: 1, claves: {x: [[0, 880], [DUR, 1060, "lineal"]]}},
            {instancia: "Nube facetada", nombre: "nube_3", en: [1200, 110], plano: -9, escala: 0.6, claves: {x: [[0, 1180], [DUR, 1300, "lineal"]]}},
            {instancia: "Cordillera lejana", nombre: "cordillera", en: [0, HOR], plano: -8},
            {instancia: "Montañas de cristal", nombre: "montanas", en: [0, HOR + 30], plano: -7},
            {instancia: "Colinas", nombre: "colinas", en: [0, HOR + 120], plano: -6},
            {instancia: "Río facetado", nombre: "rio", en: [0, HOR + 60], plano: -5},
            ...[[80, 600, 1.4], [150, 640, 1.1], [1040, 580, 1.2], [1110, 610, 1.5], [1190, 590, 1.0], [420, 560, 0.9], [760, 565, 0.8]].map(([x, y, e], i) =>
                ({instancia: "Pino low poly", nombre: `pino_${i}`, en: [x, y], plano: y > 600 ? 2 : -4, escala: e})),
            {instancia: "Ciervo low poly", nombre: "ciervo", en: [460, 650], plano: 1, escala: 1.4, claves: {x: [[0, 380], [LLEGA, 640, "lineal"]], y: [[0, 600], [LLEGA, 645, "suave"]]},
                acciones: [[0, "Caminar"], [LLEGA, "Beber", false], [LLEGA + 4000, "Mirar"]]},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cielo(), sol(), cordillera(), montanasCristal(), colinas(), rio(), pino(), nube(), ciervo()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
