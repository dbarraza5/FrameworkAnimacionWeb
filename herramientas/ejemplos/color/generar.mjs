// Fase 1 de planeacion_capacidades.md: prueba del MORPHING DE COLOR.
// Un paisaje pasa de dia a atardecer y a noche (degradado del cielo, montes, sol, luces de la
// casa); en primer plano un herrero calienta una barra (gris -> rojo -> amarillo blanco) y se
// le enrojece la cara con el calor. Todo con `colores` + `claves.forma` (misma geometria, otro color).
//   node herramientas/ejemplos/color/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 9000;
const marcas = {EventoGeneral: "no_lleva"};
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const ovalo = (rx, ry, n = 20, dx = 0, dy = 0) => Array.from({length: n}, (_, i) => [Math.round((dx + rx * Math.cos(i / n * 2 * Math.PI)) * 10) / 10, Math.round((dy + ry * Math.sin(i / n * 2 * Math.PI)) * 10) / 10]);

// instantes del ciclo: dia (0-1500) -> atardecer (4000) -> noche (7000)
const CICLO = (interp = "suave") => [[0, ""], [1500, "", interp], [4000, "tarde", interp], [7000, "noche", interp]];

function paisaje() {
    const cerro = (pts, dia, tarde, noche, nombre) => ({nombre, poligono: pts, color: dia, colores: {tarde, noche}, claves: {forma: CICLO()}});
    const ventana = (x, y, nombre) => ({nombre, rect: [x, y, x + 22, y + 26], color: "#3a4450", borde: "#2a3038",
        colores: {tarde: {color: "#7a6a50"}, noche: {color: "#ffd27a", borde: "#ffe9b0"}}, claves: {forma: [[0, ""], [4600, ""], [5400, "tarde", "suave"], [6200, "noche", "suave"]]}});
    return {tipo: "asset", nombre: "Paisaje que cambia de color", duracion: DUR, marcas, partes: [
        {nombre: "cielo", rect: [0, 0, 1280, 560], color: "#7ec0ee",
            degradado: lineal([0, 0], [0, 560], [[0, "#3d7fd1"], [0.6, "#8cc7f0"], [1, "#d6efff"]]),
            colores: {
                tarde: {degradado: lineal([0, 0], [0, 560], [[0, "#3a3270"], [0.6, "#e0705a"], [1, "#ffc46a"]])},
                noche: {degradado: lineal([0, 0], [0, 560], [[0, "#050a1c"], [0.6, "#101c3c"], [1, "#24304e"]])},
            }, claves: {forma: CICLO()}},
        ...Array.from({length: 40}, (_, i) => ({nombre: `estrella_${i}`, en: [(i * 317) % 1280, (i * 131) % 360 + 10], circulo: {r: 1.2 + (i % 3) * 0.6, lados: 6},
            color: "#ffffff", opacidad: 0, claves: {opacidad: [[0, 0], [5200, 0], [7000 + (i % 5) * 150, 0.5 + (i % 4) * 0.12, "suave"]]}})),
        {nombre: "sol", en: [880, 150], circulo: {r: 46, lados: 28}, color: "#fff3b0",
            colores: {tarde: "#ff8a3a", noche: "#d84a2a"}, claves: {forma: CICLO(), y: [[0, 150], [1500, 160, "suave"], [4000, 470, "suave"], [6000, 640, "entrar"]]}},
        {nombre: "halo_sol", en: [880, 150], circulo: {r: 190, lados: 28}, color: "#fff3b0",
            degradado: radial([0, 0], 160, [[0, rgba("#fff3b0", 0.55)], [1, rgba("#fff3b0", 0)]]), mezcla: "suma",
            colores: {tarde: {degradado: radial([0, 0], 190, [[0, rgba("#ff8a3a", 0.75)], [1, rgba("#ff8a3a", 0)]])}, noche: {degradado: radial([0, 0], 120, [[0, rgba("#d84a2a", 0)], [1, rgba("#d84a2a", 0)]])}},
            claves: {forma: CICLO(), y: [[0, 150], [1500, 160, "suave"], [4000, 470, "suave"], [6000, 640, "entrar"]]}},
        {nombre: "luna", en: [260, 120], circulo: {r: 26, lados: 24}, color: "#f2f0e6", opacidad: 0, claves: {opacidad: [[0, 0], [5500, 0], [7200, 1, "suave"]], y: [[0, 220], [5500, 220], [8500, 110, "suave"]]}},
        cerro([[0, 430], [180, 330], [360, 400], [520, 300], [700, 380], [880, 290], [1060, 360], [1280, 310], [1280, 560], [0, 560]], "#6f93b0", "#7a4a6a", "#141a30", "cerros_lejos"),
        cerro([[0, 500], [240, 420], [480, 470], [760, 400], [1040, 460], [1280, 420], [1280, 600], [0, 600]], "#4f8a4a", "#5a3a3a", "#0e1420", "cerros_cerca"),
        {nombre: "suelo", rect: [0, 560, 1280, 720], color: "#5a9a44",
            degradado: lineal([0, 560], [0, 720], [[0, "#6aaa50"], [1, "#3f7a32"]]),
            colores: {tarde: {degradado: lineal([0, 560], [0, 720], [[0, "#7a5a40"], [1, "#4a3020"]])}, noche: {degradado: lineal([0, 560], [0, 720], [[0, "#141c22"], [1, "#0a0e12"]])}},
            claves: {forma: CICLO()}},
        {nombre: "casa", en: [220, 560], partes: [
            {nombre: "pared", rect: [0, -110, 150, 0], color: "#d8c8a8", colores: {tarde: "#c08a6a", noche: "#2a2a34"}, claves: {forma: CICLO()}},
            {nombre: "techo", poligono: [[-14, -108], [75, -170], [164, -108]], color: "#a0463a", colores: {tarde: "#7a3030", noche: "#1a1418"}, claves: {forma: CICLO()}},
            ventana(22, -84, "ventana_1"), ventana(104, -84, "ventana_2"),
            {nombre: "luz_ventanas", en: [75, -70], circulo: {r: 110, lados: 24}, degradado: radial([0, 0], 110, [[0, rgba("#ffd27a", 0.5)], [1, rgba("#ffd27a", 0)]]),
                mezcla: "suma", opacidad: 0, claves: {opacidad: [[0, 0], [5400, 0], [6400, 1, "suave"]]}},
        ]},
    ]};
}

function herrero() {
    // cara redonda con rubor que se intensifica mientras la barra se calienta (2500 -> 6500)
    const calor = [[0, ""], [2500, ""], [4500, "tibio", "suave"], [6500, "caliente", "suave"]];
    return {tipo: "asset", nombre: "Herrero (sonrojo)", duracion: DUR, marcas, partes: [
        {nombre: "cuerpo", poligono: [[-70, 0], [-62, -120], [-30, -150], [30, -150], [62, -120], [70, 0]], color: "#5a4a3a",
            degradado: lineal([-70, 0], [70, 0], [[0, "#6a5846"], [1, "#3a2e24"]])},
        {nombre: "delantal", poligono: [[-40, 0], [-36, -120], [36, -120], [40, 0]], color: "#8a6a4a"},
        {nombre: "cabeza", en: [0, -205], circulo: {r: 52, ry: 58, lados: 28}, color: "#e8b896",
            degradado: radial([-16, -18], 70, [[0, "#f6d2b6"], [1, "#d49a78"]]),
            colores: {tibio: {degradado: radial([-16, -18], 70, [[0, "#f8c8ac"], [1, "#d88a6a"]])}, caliente: {degradado: radial([-16, -18], 70, [[0, "#ffb89a"], [1, "#d46a52"]])}},
            claves: {forma: calor}},
        {nombre: "rubor_izq", en: [-26, -192], circulo: {r: 16, lados: 18}, degradado: radial([0, 0], 16, [[0, rgba("#e8907f", 0.25)], [1, rgba("#e8907f", 0)]]),
            colores: {tibio: {degradado: radial([0, 0], 18, [[0, rgba("#e06a5a", 0.6)], [1, rgba("#e06a5a", 0)]])}, caliente: {degradado: radial([0, 0], 21, [[0, rgba("#e0403a", 0.9)], [1, rgba("#e0403a", 0)]])}},
            claves: {forma: calor}},
        {nombre: "rubor_der", en: [26, -192], circulo: {r: 16, lados: 18}, degradado: radial([0, 0], 16, [[0, rgba("#e8907f", 0.25)], [1, rgba("#e8907f", 0)]]),
            colores: {tibio: {degradado: radial([0, 0], 18, [[0, rgba("#e06a5a", 0.6)], [1, rgba("#e06a5a", 0)]])}, caliente: {degradado: radial([0, 0], 21, [[0, rgba("#e0403a", 0.9)], [1, rgba("#e0403a", 0)]])}},
            claves: {forma: calor}},
        {nombre: "ojo_izq", en: [-18, -214], circulo: {r: 5, lados: 10}, color: "#2a1a14"},
        {nombre: "ojo_der", en: [18, -214], circulo: {r: 5, lados: 10}, color: "#2a1a14"},
        {nombre: "barba", poligono: [[-46, -196], [-30, -160], [0, -146], [30, -160], [46, -196], [30, -176], [0, -170], [-30, -176]], color: "#5a3a26"},
        {nombre: "boca", poligono: [[-12, -178], [12, -178], [8, -173], [-8, -173]], color: "#7a3a30"},
        {nombre: "sudor", en: [40, -238], poligono: [[0, -7], [4, 0], [0, 5], [-4, 0]], color: "#bfe3ff", opacidad: 0,
            claves: {opacidad: [[0, 0], [5200, 0], [5800, 0.9, "suave"]], y: [[0, -238], [5800, -238], [7500, -200, "lineal"]]}},
    ]};
}

function forja() {
    // la barra: gris -> rojo oscuro -> naranja -> amarillo blanco, con un brillo que crece (suma)
    const temple = [[0, ""], [2500, ""], [3800, "rojo", "suave"], [5200, "naranja", "suave"], [6500, "blanco", "suave"]];
    return {tipo: "asset", nombre: "Yunque y barra", duracion: DUR, marcas, partes: [
        {nombre: "yunque", poligono: [[-90, -60], [90, -60], [110, -80], [-60, -80], [-110, -70], [-90, -60], [-40, -60], [-30, -20], [-60, 0], [60, 0], [30, -20], [40, -60]], color: "#3a3e44",
            degradado: lineal([0, -80], [0, 0], [[0, "#6a7078"], [1, "#24272c"]])},
        {nombre: "brillo_barra", en: [10, -92], circulo: {r: 180, lados: 28}, degradado: radial([0, 0], 120, [[0, rgba("#ff8a3a", 0)], [1, rgba("#ff8a3a", 0)]]), mezcla: "suma",
            colores: {rojo: {degradado: radial([0, 0], 120, [[0, rgba("#ff3a1a", 0.35)], [1, rgba("#ff3a1a", 0)]])},
                naranja: {degradado: radial([0, 0], 150, [[0, rgba("#ff8a2a", 0.6)], [1, rgba("#ff8a2a", 0)]])},
                blanco: {degradado: radial([0, 0], 180, [[0, rgba("#fff0a0", 0.8)], [1, rgba("#ffb040", 0)]])}},
            claves: {forma: temple}},
        {nombre: "barra", poligono: [[-90, -98], [110, -98], [114, -92], [110, -86], [-90, -86]], color: "#6a6e74",
            degradado: lineal([0, -98], [0, -86], [[0, "#9aa0a8"], [1, "#4a4e54"]]),
            colores: {rojo: {degradado: lineal([0, -98], [0, -86], [[0, "#c0402a"], [1, "#6a1a10"]])},
                naranja: {degradado: lineal([0, -98], [0, -86], [[0, "#ffa040"], [1, "#d04a1a"]])},
                blanco: {degradado: lineal([0, -98], [0, -86], [[0, "#fffbe0"], [1, "#ffc040"]])}},
            claves: {forma: temple}},
        {nombre: "mango", rect: [-170, -96, -90, -88], color: "#5a3a22"},
    ]};
}

const ASSETS = [paisaje(), herrero(), forja()];
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Prueba de color", duracion: DUR, profundidad: true,
    camara: {centro: [640, 360]},
    objetos: [
        {instancia: "Paisaje que cambia de color", nombre: "paisaje", en: [0, 0], plano: -3, bucle: false},
        {instancia: "Herrero (sonrojo)", nombre: "herrero", en: [820, 690], bucle: false, escala: 1.3},
        {instancia: "Yunque y barra", nombre: "forja", en: [1010, 700], bucle: false, escala: 1.3},
    ],
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
console.log(`assets: ${ASSETS.length}, duracion ${DUR} ms`);
