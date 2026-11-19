// Fase 4 de planeacion_capacidades.md: prueba de SOMBRAS PROYECTADAS.
// Calle de noche con dos farolas. Un paseante cruza bajo las dos: cada farola le proyecta
// una sombra que gira, se estira y se desvanece con la distancia (`alcance`). Entre las
// farolas rebota una pelota: su sombra queda en el piso y se aclara al subir. Un farol de
// mano que lleva el paseante NO tiene sombra propia (es la luz), pero ilumina con `suma`.
//   node herramientas/ejemplos/sombras/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const DUR = 11000, PISO = 610;
const FAROLAS = [{nombre: "a", x: 330}, {nombre: "b", x: 960}];
const ALTO_LUZ = 250;                                         // y de la lampara (las farolas estan contra el muro, detras: las sombras caen hacia adelante, aplastar < 0)

// paseante de perfil (camina en el lugar: piernas y brazos con claves ida_vuelta)
function paseante() {
    const paso = 520;
    const vaiven = (amp, fase = 1) => ({rotacion: [[0, amp * fase, "suave"], [paso, -amp * fase, "suave"]]});
    return {tipo: "asset", nombre: "Paseante", duracion: paso * 2, marcas, partes: [
        {nombre: "pierna_atras", poligono: [[-6, -92], [6, -92], [4, -4], [-4, -4]], color: "#2a2e3a", pivote: [0, -90], claves: vaiven(22, -1), bucle: "ida_vuelta",
            partes: [{nombre: "zapato_atras", poligono: [[-6, -6], [12, -6], [14, 0], [-6, 0]], color: "#1e1410"}]},
        {nombre: "brazo_atras", poligono: [[-4, -150], [5, -150], [4, -100], [-3, -100]], color: "#5a3424", pivote: [0, -148], claves: vaiven(20), bucle: "ida_vuelta"},
        {nombre: "abrigo", poligono: [[-14, -88], [14, -88], [16, -152], [8, -160], [-10, -160], [-15, -150]], degradado: lineal([-15, 0], [16, 0], [[0, "#4a2a1a"], [1, "#7a4a2e"]])},
        {nombre: "cabeza", en: [3, -174], circulo: {r: 13, lados: 18}, degradado: radial([4, -4], 15, [[0, "#f0c8a8"], [1, "#b88464"]])},
        {nombre: "sombrero", poligono: [[-16, -180], [20, -180], [20, -177], [-16, -177], [-16, -180], [-9, -180], [-8, -196], [12, -196], [13, -180]], color: "#1a1a22"},
        {nombre: "pierna", poligono: [[-6, -92], [6, -92], [4, -4], [-4, -4]], color: "#363b4a", pivote: [0, -90], claves: vaiven(22), bucle: "ida_vuelta",
            partes: [{nombre: "zapato", poligono: [[-6, -6], [12, -6], [14, 0], [-6, 0]], color: "#2a1c14"}]},
        {nombre: "brazo", poligono: [[-4, -150], [5, -150], [4, -100], [-3, -100]], color: "#6a3e2a", pivote: [0, -148], claves: vaiven(20, -1), bucle: "ida_vuelta"},
    ]};
}

function farola(nombre) {
    return {tipo: "asset", nombre, duracion: 1000, marcas, partes: [
        {nombre: "base", rect: [-12, -16, 12, 0], color: "#1a1e24"},
        {nombre: "poste", rect: [-4, -(PISO - ALTO_LUZ) + 6, 4, -14], degradado: lineal([-4, 0], [4, 0], [[0, "#3a4048"], [1, "#14181c"]])},
        {nombre: "brazo", poligono: [[-4, -(PISO - ALTO_LUZ) + 10], [0, -(PISO - ALTO_LUZ) + 2], [30, -(PISO - ALTO_LUZ) - 4], [30, -(PISO - ALTO_LUZ) + 2]], color: "#2a3038"},
        {nombre: "lampara", poligono: [[18, -(PISO - ALTO_LUZ) + 2], [42, -(PISO - ALTO_LUZ) + 2], [38, -(PISO - ALTO_LUZ) + 12], [22, -(PISO - ALTO_LUZ) + 12]], color: "#2a3038"},
        {nombre: "foco", en: [30, -(PISO - ALTO_LUZ) + 13], elipse: [8, 3], color: "#fff4cc"},
    ]};
}

const ASSETS = [paseante(), farola("Farola")];
const X0 = -60, X1 = 1340;
const objetos = [
    {nombre: "cielo", en: [0, 0], plano: -4, rect: [-100, -100, 1400, 470], degradado: lineal([0, -100], [0, 470], [[0, "#04060e"], [1, "#141c30"]])},
    {nombre: "muro", en: [0, 0], plano: -4, rect: [-100, 300, 1400, PISO], degradado: lineal([0, 300], [0, PISO], [[0, "#26222a"], [1, "#3a3238"]])},
    ...Array.from({length: 12}, (_, i) => ({nombre: `ladrillo_${i}`, en: [0, 0], plano: -4, rect: [i * 120 - 40, 360 + (i % 3) * 70, i * 120 + 30, 364 + (i % 3) * 70], color: "#1e1a20", opacidad: 0.6})),
    {nombre: "vereda", en: [0, 0], plano: -3, rect: [-100, PISO, 1400, 820], degradado: lineal([0, PISO], [0, 820], [[0, "#3a3a40"], [1, "#15151a"]])},
    // conos de luz de las farolas (sobre muro y piso, con suma)
    ...FAROLAS.flatMap((f) => [
        {nombre: `cono_${f.nombre}`, en: [f.x + 30, ALTO_LUZ + 14], plano: -2, poligono: [[-8, 0], [8, 0], [230, PISO - ALTO_LUZ - 14], [-230, PISO - ALTO_LUZ - 14]],
            degradado: lineal([0, 0], [0, PISO - ALTO_LUZ], [[0, rgba("#ffe0a0", 0.2)], [1, rgba("#ffe0a0", 0.02)]]), mezcla: "suma"},
        {nombre: `charco_${f.nombre}`, en: [f.x + 30, PISO + 18], plano: -2, circulo: {r: 260, lados: 32}, escala: [1, 0.2],
            degradado: radial([0, 0], 260, [[0, rgba("#ffd890", 0.45)], [1, rgba("#ffd890", 0)]]), mezcla: "suma"},
        {nombre: `halo_${f.nombre}`, en: [f.x + 30, ALTO_LUZ + 12], plano: 2, circulo: {r: 70, lados: 24},
            degradado: radial([0, 0], 70, [[0, rgba("#fff0c0", 0.7)], [1, rgba("#fff0c0", 0)]]), mezcla: "suma"},
        // la luz: un objeto vacio donde esta el foco (las sombras la nombran)
        {nombre: `luz_${f.nombre}`, en: [f.x + 30, ALTO_LUZ + 14], plano: -2, partes: []},
        {instancia: "Farola", nombre: `farola_${f.nombre}`, en: [f.x, PISO], plano: -1},
    ]),
    {instancia: "Paseante", nombre: "paseante", en: [X0, PISO + 8], escala: 1.5, bucle: true,
        claves: {x: [[0, X0], [DUR, X1, "lineal"]]},
        sombra: FAROLAS.map((f) => ({luz: `luz_${f.nombre}`, alcance: 560, opacidad: 0.7, desenfoque: 3, aplastar: -0.3, piso: PISO + 8}))},
    {nombre: "pelota", en: [645, PISO + 2], circulo: {r: 18, lados: 24}, ancla: [0, 18],
        degradado: radial([-6, -6], 24, [[0, "#ff8a6a"], [0.6, "#d83a2a"], [1, "#6a1010"]]),
        claves: {y: Array.from({length: 12}, (_, i) => [i * 450, i % 2 ? PISO - 150 : PISO + 2, i % 2 ? "salir" : "entrar"])},
        sombra: FAROLAS.map((f) => ({luz: `luz_${f.nombre}`, alcance: 560, opacidad: 0.7, desenfoque: 2, aplastar: -0.3, piso: PISO + 2}))},
];
const escena = {tipo: "escena", precision: "decimal", nombre: "Sombras: calle de noche", duracion: DUR, profundidad: true, camara: {centro: [640, 380]}, objetos};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms\n`);
