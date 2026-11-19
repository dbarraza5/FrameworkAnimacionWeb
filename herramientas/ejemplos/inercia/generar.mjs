// Fase 3 de planeacion_capacidades.md: prueba del MOVIMIENTO SECUNDARIO (inercia).
// Una chica en skate con un perrito parado adelante: acelera, pasea, salta un bache y frena
// en seco. Nada de lo que "cuelga" tiene claves: la cola de caballo (3 segmentos
// encadenados), la bufanda, el llavero de la mochila y las orejas y la cola del perro
// reaccionan solos con `inercia`. Las claves solo mueven la escena (la instancia) y el cuerpo.
//   node herramientas/ejemplos/inercia/generar.mjs [--sin-inercia]   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SIN = process.argv.includes("--sin-inercia");          // para comparar (no se guarda)
const marcas = {EventoGeneral: "no_lleva"};
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const iner = (o) => (SIN ? {} : {inercia: o});
const C = {piel: "#e8b896", pielOsc: "#c99272", pelo: "#c0602a", peloOsc: "#8a3e18", buzo: "#2f8a7a", buzoOsc: "#1f6a5c", jean: "#34507a", jeanOsc: "#24385a",
    bufanda: "#e0b030", bufandaOsc: "#b08018", tabla: "#c0392b", rueda: "#f0e6d0", perro: "#d9a066", perroOsc: "#a86e3a"};

// segmento de una cadena colgante: trapecio de a -> b, con su pivote en a
const segmento = (nombre, a, b, w0, w1, color, inercia, partes = [], extra = {}) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const p = (q, w, s) => [Math.round((q[0] + s * nx * w / 2) * 10) / 10, Math.round((q[1] + s * ny * w / 2) * 10) / 10];
    return {nombre, poligono: [p(a, w0, 1), p(b, w1, 1), p(b, w1, -1), p(a, w0, -1)], color, pivote: a, ...iner(inercia), ...extra, partes};
};

// ------------------------------------------------------------------ guion (ms)
const T = {arranca: 400, crucero: 2200, bache: 4200, frena: 6400, quieta: 7000};
const DUR = 9000;
// x de la tabla en la escena: acelera, va parejo, frena en seco
const X = [[0, 140], [T.arranca, 140], [T.crucero, 420, "entrar"], [T.frena, 1010, "lineal"], [T.quieta, 1050, "salir"]];
const Y = [[0, 600], [T.bache - 200, 600], [T.bache, 540, "salir"], [T.bache + 260, 600, "entrar"], [T.bache + 360, 604, "salir"], [T.bache + 480, 600, "suave"]];

function skater() {
    const cabeza = [0, -176];
    const cola = segmento("cola_1", [-13, -184], [-25, -164], 12, 10, C.pelo, {rigidez: 2.2, amortiguacion: 0.32, limite: 40}, [
        segmento("cola_2", [-25, -164], [-33, -143], 10, 8, C.pelo, {rigidez: 2.6, amortiguacion: 0.32, limite: 25, fuerza: 0.7}, [
            segmento("cola_3", [-33, -143], [-36, -122], 8, 3, C.peloOsc, {rigidez: 3, amortiguacion: 0.32, limite: 20, fuerza: 0.6})])]);
    const bufanda = segmento("bufanda_1", [-6, -150], [-22, -140], 9, 8, C.bufanda, {rigidez: 2.4, amortiguacion: 0.3, limite: 45, punta: [-22, -140]}, [
        segmento("bufanda_2", [-22, -140], [-36, -128], 8, 7, C.bufandaOsc, {rigidez: 2.8, amortiguacion: 0.3, limite: 40, punta: [-36, -128]}, [
            {nombre: "flecos", poligono: [[-34, -132], [-42, -124], [-38, -122], [-40, -118], [-35, -122]], color: C.bufandaOsc}])]);
    const llavero = segmento("cordon", [-24, -118], [-24, -100], 2, 2, "#444", {rigidez: 1.8, amortiguacion: 0.12}, [
        {nombre: "dije", en: [-24, -96], circulo: {r: 5, lados: 12}, color: "#e04a8a"}]);
    // cuerpo: se agacha al arrancar y al saltar, se echa atras al frenar
    const inclinacion = [[0, 0], [T.arranca, 6, "suave"], [T.crucero, 2, "suave"], [T.bache - 250, 8, "suave"], [T.bache + 300, -2, "suave"], [T.frena - 150, 2, "suave"], [T.frena + 100, -14, "salir"], [T.quieta + 500, 0, "suave"]];
    const agache = [[0, 0], [T.bache - 250, 0], [T.bache - 50, 10, "suave"], [T.bache + 200, 0, "suave"], [T.bache + 420, 8, "salir"], [T.bache + 700, 0, "suave"]];
    return {tipo: "asset", nombre: "Skater con perrito", duracion: DUR, marcas, partes: [
        {nombre: "tabla", partes: [
            {nombre: "lija", poligono: [[-46, -16], [46, -16], [54, -20], [56, -16], [50, -11], [-50, -11], [-56, -16], [-54, -20]], degradado: lineal([0, -20], [0, -11], [[0, "#e04a3a"], [1, "#8a1e14"]])},
            {nombre: "eje", rect: [-34, -11, 34, -8], color: "#888"},
            {nombre: "rueda_1", en: [-30, -5], circulo: {r: 5.5, lados: 10}, color: C.rueda, borde: "#a89a80", giro: {desde: 0, hasta: 360, ms: 500}},
            {nombre: "rueda_2", en: [30, -5], circulo: {r: 5.5, lados: 10}, color: C.rueda, borde: "#a89a80", giro: {desde: 0, hasta: 360, ms: 500}},
        ]},
        {nombre: "perro", en: [34, -18], partes: [
            {nombre: "cola_perro_1", ...segmento("cola_perro_1", [-12, -14], [-20, -24], 4, 3.5, C.perroOsc, {rigidez: 3, amortiguacion: 0.15}, [
                segmento("cola_perro_2", [-20, -24], [-24, -34], 3.5, 2, C.perroOsc, {rigidez: 3.5, amortiguacion: 0.15})])},
            {nombre: "patas", poligono: [[-10, -8], [-7, -8], [-7, 0], [-10, 0], [-10, -8]], color: C.perroOsc},
            {nombre: "patas_2", poligono: [[6, -8], [9, -8], [9, 0], [6, 0]], color: C.perroOsc},
            {nombre: "lomo", en: [0, -12], elipse: [14, 7], degradado: radial([-3, -3], 15, [[0, "#ecc08a"], [1, C.perroOsc]])},
            {nombre: "cabeza_perro", en: [13, -21], circulo: {r: 7, lados: 14}, color: C.perro},
            {nombre: "hocico", en: [19, -19], elipse: [4, 3], color: "#ecc08a"},
            {nombre: "nariz_perro", en: [22.5, -20], circulo: {r: 1.5, lados: 6}, color: "#2a1a10"},
            {nombre: "ojo_perro", en: [15, -23], circulo: {r: 1.2, lados: 6}, color: "#2a1a10"},
            segmento("oreja_atras", [9, -26], [5, -16], 4, 5, C.perroOsc, {rigidez: 2.4, amortiguacion: 0.15}),
            segmento("oreja", [12, -27], [9, -17], 4, 5.5, "#8a5428", {rigidez: 2.2, amortiguacion: 0.15}),
        ]},
        {nombre: "cuerpo", pivote: [0, -20], claves: {rotacion: inclinacion, y: agache}, partes: [
            {nombre: "pierna_atras", poligono: [[-16, -86], [-6, -86], [-14, -20], [-22, -20]], color: C.jeanOsc},
            {nombre: "zapa_atras", rect: [-28, -22, -10, -16], color: "#f0f0f0"},
            {nombre: "pierna", poligono: [[-4, -86], [8, -86], [14, -20], [6, -20]], color: C.jean},
            {nombre: "zapa", rect: [2, -22, 22, -16], color: "#ffffff", borde: "#bbb"},
            {nombre: "mochila", poligono: [[-28, -146], [-12, -150], [-10, -100], [-26, -96]], degradado: lineal([-28, 0], [-10, 0], [[0, "#5a3a7a"], [1, "#7a5a9a"]])},
            llavero,
            {nombre: "buzo", poligono: [[-12, -86], [12, -86], [16, -142], [8, -154], [-8, -154], [-14, -142]], degradado: lineal([-14, 0], [16, 0], [[0, C.buzoOsc], [1, "#3fa08e"]])},
            {nombre: "brazo", poligono: [[4, -146], [12, -146], [26, -108], [20, -104]], color: C.buzoOsc, pivote: [8, -146], claves: {rotacion: [[0, -10], [T.frena, -10], [T.frena + 150, -55, "salir"], [T.quieta + 600, -10, "suave"]]},
                partes: [{nombre: "mano", en: [24, -104], circulo: {r: 4.5, lados: 10}, color: C.piel}]},
            {nombre: "cuello", rect: [-4, -160, 5, -150], color: C.pielOsc},
            {nombre: "cabeza", pivote: [0, -160], claves: {rotacion: [[0, 0], [T.frena, 0], [T.frena + 200, -10, "salir"], [T.quieta + 800, 4, "suave"], [DUR, 0, "suave"]]}, partes: [
                cola,
                {nombre: "cara", en: cabeza, circulo: {r: 14, lados: 20}, degradado: radial([4, -4], 17, [[0, "#f4ccaa"], [1, C.pielOsc]])},
                {nombre: "pelo", poligono: [[-14, -178], [-12, -190], [0, -194], [12, -190], [15, -182], [6, -186], [-4, -184], [-10, -176], [-14, -170]], color: C.pelo},
                {nombre: "ojo", en: [8, -177], circulo: {r: 1.8, lados: 8}, color: "#1a1410"},
                {nombre: "sonrisa", poligono: [[6, -167], [12, -168], [10, -165]], color: "#8a3a3a"},
                {nombre: "casco", poligono: [[-16, -182], [-12, -196], [2, -201], [14, -196], [17, -184]], degradado: lineal([0, -201], [0, -182], [[0, "#f6f6f6"], [1, "#b8c0c8"]])},
            ]},
            bufanda,
            {nombre: "nudo", en: [-4, -151], circulo: {r: 5, lados: 10}, color: C.bufanda},
        ]},
    ]};
}

const ASSETS = [skater()];
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Inercia: skate y perrito", duracion: DUR, profundidad: true,
    // la camara sigue a la tabla (un poco adelantada), sin salirse de la calle
    camara: {centro: [380, 430], zoom: 1.7, claves: {x: X.map(([t, v, i]) => [t, Math.max(380, Math.min(1010, v + 60)), i || "lineal"])}},
    objetos: [
        {nombre: "cielo", en: [0, 0], plano: -3, rect: [-100, -100, 1400, 560], degradado: lineal([0, -100], [0, 560], [[0, "#6ab0e8"], [1, "#d8eefa"]])},
        {nombre: "sol", en: [1080, 120], plano: -3, circulo: {r: 160, lados: 28}, mezcla: "suma", degradado: radial([0, 0], 160, [[0, rgba("#fff4c0", 0.8)], [0.25, rgba("#fff4c0", 0.35)], [1, rgba("#fff4c0", 0)]])},
        {nombre: "edificios", en: [0, 0], plano: -2, poligono: [[-100, 560], [-100, 380], [80, 380], [80, 320], [220, 320], [220, 400], [360, 400], [360, 300], [520, 300], [520, 420], [700, 420], [700, 340], [860, 340], [860, 390], [1020, 390], [1020, 300], [1180, 300], [1180, 410], [1400, 410], [1400, 560]],
            degradado: lineal([0, 300], [0, 560], [[0, "#9ab8cc"], [1, "#7a98ae"]])},
        {nombre: "vereda", en: [0, 0], plano: -1, rect: [-100, 560, 1400, 610], color: "#b8b0a0"},
        {nombre: "calle", en: [0, 0], plano: -1, rect: [-100, 610, 1400, 820], degradado: lineal([0, 610], [0, 820], [[0, "#5a5a60"], [1, "#3a3a40"]])},
        {nombre: "bache", en: [0, 0], plano: -1, poligono: [[640, 600], [660, 588], [690, 586], [712, 600]], color: "#8a8478"},
        {instancia: "Skater con perrito", nombre: "skater", en: [140, 600], escala: 1.7, bucle: false, claves: {x: X, y: Y}},
    ],
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms${SIN ? " (SIN inercia)" : ""}\n`);
