// Fase 2 de planeacion_capacidades.md: prueba de la CINEMATICA INVERSA (IK).
// Un personaje (de perfil, mira a la derecha) camina sin que los pies patinen (los pies
// apoyados son claves CONSTANTES de su objetivo), se agacha (baja la cadera y las rodillas
// se doblan solas), toma una manzana de un banquito, se levanta y la mira.
// Brazos y piernas son cadenas `ik` de dos huesos; los objetivos son partes vacias con claves.
//   node herramientas/ejemplos/ik/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const C = {piel: "#e8b896", pielOsc: "#c99272", pelo: "#3a2418", camisa: "#3a6ea5", camisaOsc: "#2a5080", pantalon: "#3a4050", pantalonOsc: "#2a2e3a",
    zapato: "#5a3a22", zapatoOsc: "#3e2816", madera: "#9a6a3e", maderaOsc: "#6a4426"};

// ------------------------------------------------------------------ guion (ms, coordenadas del asset; el piso es y = 0)
const X0 = 120, PASO = 65, T_PASO = 450, N = 8, INICIO = 600;
const FIN_CAMINAR = INICIO + N * T_PASO;                 // 4200
const CERRAR = FIN_CAMINAR + T_PASO;                     // 4650: junta los pies
const XF = X0 + N * PASO;                                // cadera al terminar de caminar (640)
const BAJA_CADERA = 8;                                    // cadera un poco baja: la pierna nunca queda "corta"
const BANCO_X = XF + 40, BANCO_Y = -56, MANZANA = [BANCO_X, BANCO_Y - 7];
const T = {agacharse: 4700, toma: 5500, arriba: 6400, mira: 7600, alza: 8200, baja: 8800};
const DUR = 9600;

// pies: posiciones apoyadas y tramos de vuelo (el que vuela sube 16 px a mitad de paso)
function clavesPies() {
    const pie = {i: {x: [[0, X0 - 10]], y: [[0, -6]]}, d: {x: [[0, X0 + 10]], y: [[0, -6]]}};
    const pos = {i: X0 - 10, d: X0 + 10};
    const vuelo = (lado, t0, t1, destino) => {
        const k = pie[lado];
        k.x.push([t0, pos[lado]], [t1, r1(destino), "suave"]);
        k.y.push([t0, -6], [Math.round((t0 + t1) / 2), -22, "suave"], [t1, -6, "suave"]);
        pos[lado] = destino;
    };
    for (let k = 0; k < N; k++) {
        const lado = k % 2 === 0 ? "d" : "i";
        const t0 = INICIO + k * T_PASO, t1 = t0 + T_PASO;
        vuelo(lado, t0, t1, X0 + PASO * (k + 1) + 32);
    }
    const ultimo = N % 2 === 0 ? "d" : "i";                // el que quedo atras se junta con el otro
    vuelo(ultimo, FIN_CAMINAR, CERRAR, ultimo === "d" ? XF + 10 : XF - 10);
    const otro = ultimo === "d" ? "i" : "d";
    pie[otro].x.push([CERRAR, pos[otro]], [CERRAR + 250, ultimo === "d" ? XF - 10 : XF + 10, "suave"]);
    return pie;
}

// cadera: avanza parejo mientras camina, sube y baja con cada paso, se agacha y se levanta
function clavesCadera() {
    const x = [[0, X0], [INICIO, X0], [FIN_CAMINAR, XF, "lineal"], [CERRAR, XF + 4, "salir"]];
    const y = [[0, BAJA_CADERA], [INICIO, BAJA_CADERA]];
    for (let k = 0; k < N; k++) {
        const t0 = INICIO + k * T_PASO;
        y.push([t0 + T_PASO / 2, BAJA_CADERA - 3, "suave"], [t0 + T_PASO, BAJA_CADERA + 1, "suave"]);
    }
    y.push([CERRAR, BAJA_CADERA, "suave"], [T.agacharse, BAJA_CADERA, "suave"], [T.toma - 100, 36, "suave"], [T.toma + 150, 36, "suave"], [T.arriba, BAJA_CADERA, "suave"]);
    return {x: x.map(([t, v, i]) => [t, v, i || "lineal"]), y};
}

// brazos: balanceo con claves mientras camina; el derecho pasa a IK para tomar la manzana
function clavesBrazos() {
    const giro = (lado) => {
        const k = [[0, 0]];
        for (let i = 0; i <= N; i++) {
            const t = INICIO + i * T_PASO, s = (i % 2 === 0 ? 1 : -1) * (lado === "d" ? 1 : -1);
            k.push([t, i === 0 || i === N ? 0 : 16 * s, "suave"]);
        }
        return k;
    };
    const mano = [XF + 3, -96 + BAJA_CADERA];             // donde cuelga la mano al llegar (aprox.)
    const objetivoMano = {
        x: [[0, mano[0]], [T.agacharse, mano[0]], [T.toma, MANZANA[0], "suave"], [T.toma + 150, MANZANA[0]], [T.arriba, XF + 40, "suave"], [T.mira, XF + 40], [T.alza, XF + 30, "suave"], [T.baja, XF + 40, "suave"]],
        y: [[0, mano[1]], [T.agacharse, mano[1]], [T.toma, MANZANA[1], "suave"], [T.toma + 150, MANZANA[1]], [T.arriba, -146, "suave"], [T.mira, -150], [T.alza, -212, "suave"], [T.baja, -146, "suave"]],
    };
    return {giro_i: giro("i"), giro_d: giro("d"), objetivoMano, peso: [[0, 0], [T.agacharse, 0], [T.agacharse + 450, 1, "suave"]]};
}

// ------------------------------------------------------------------ el personaje
function pierna(lado, color, colorOsc, capa) {
    return {nombre: `muslo_${lado}`, capa, poligono: [[-8, -98], [8, -98], [6, -50], [-6, -50]], color, pivote: [0, -95],
        ik: {hasta: `pantorrilla_${lado}`, punta: [0, -6], objetivo: `obj_pie_${lado}`, doblez: 1, orientar: `pie_${lado}`},
        partes: [{nombre: `pantorrilla_${lado}`, poligono: [[-6, -53], [6, -53], [5, -6], [-5, -6]], color: colorOsc, pivote: [0, -50],
            partes: [
                {nombre: `rodilla_${lado}`, en: [0, -50], circulo: {r: 6.5, lados: 12}, color},
                {nombre: `pie_${lado}`, poligono: [[-7, -10], [5, -10], [22, -4], [23, 0], [-8, 0]], color: C.zapato, borde: C.zapatoOsc, pivote: [0, -6]},
            ]}]};
}
function brazo(lado, color, capa, extra = {}) {
    return {nombre: `brazo_${lado}`, capa, poligono: [[-6, -160], [7, -160], [6, -125], [-4, -125]], color, pivote: [1, -155],
        ik: {hasta: `antebrazo_${lado}`, punta: [1, -96], objetivo: `obj_mano_${lado}`, doblez: -1},
        ...extra,
        partes: [{nombre: `antebrazo_${lado}`, poligono: [[-4, -128], [6, -128], [5, -97], [-3, -97]], color: C.piel, pivote: [1, -126],
            claves: {rotacion: [[0, -8]]},
            partes: [
                {nombre: `manga_${lado}`, poligono: [[-5, -129], [7, -129], [6, -120], [-4, -120]], color},
                {nombre: `mano_${lado}`, en: [1, -91], circulo: {r: 6, lados: 12}, color: C.piel, borde: C.pielOsc},
            ]}]};
}

function caminante() {
    const pies = clavesPies(), cad = clavesCadera(), br = clavesBrazos();
    const torso = {nombre: "torso", pivote: [0, -95], claves: {rotacion: [[0, 3], [T.agacharse, 3], [T.toma - 100, 32, "suave"], [T.toma + 150, 32, "suave"], [T.arriba, 3, "suave"]]}, partes: [
        brazo("i", C.camisaOsc, 0, {claves: {rotacion: br.giro_i, ik_peso: [[0, 0]]}}),
        {nombre: "camisa", capa: 1, poligono: [[-13, -92], [13, -92], [15, -150], [9, -162], [-9, -162], [-13, -150]],
            degradado: lineal([-13, 0], [15, 0], [[0, C.camisaOsc], [0.6, C.camisa], [1, "#4a80b8"]]), borde: C.camisaOsc},
        {nombre: "cinturon", capa: 2, rect: [-13, -100, 13, -93], color: "#2a2018"},
        {nombre: "cabeza", capa: 3, pivote: [0, -162], claves: {rotacion: [[0, 0], [T.toma - 200, 18, "suave"], [T.arriba, -4, "suave"], [T.mira, 10, "suave"], [T.alza, -12, "suave"], [T.baja, 4, "suave"]]}, partes: [
            {nombre: "cuello", rect: [-4, -168, 5, -158], color: C.pielOsc},
            {nombre: "cara", en: [2, -180], circulo: {r: 15, lados: 20}, degradado: radial([-4, -4], 18, [[0, "#f4ccaa"], [1, C.pielOsc]])},
            {nombre: "pelo", poligono: [[-14, -182], [-12, -194], [0, -198], [12, -195], [17, -187], [10, -188], [-2, -186], [-8, -178], [-14, -172]], color: C.pelo},
            {nombre: "ojo", en: [10, -181], circulo: {r: 1.8, lados: 8}, color: "#1a1410"},
            {nombre: "nariz", poligono: [[15, -180], [20, -174], [15, -173]], color: C.pielOsc},
            {nombre: "boca", rect: [10, -170, 15, -169], color: "#8a4a3a"},
            {nombre: "oreja", en: [-2, -179], elipse: [3, 4.5], color: C.pielOsc},
        ]},
        brazo("d", C.camisa, 4, {claves: {rotacion: br.giro_d, ik_peso: br.peso}}),
    ]};
    return {tipo: "asset", nombre: "Caminante (IK)", duracion: DUR, marcas, partes: [
        {nombre: "sombra", en: [X0, 0], elipse: [30, 5], degradado: radial([0, 0], 30, [[0, rgba("#000000", 0.35)], [1, rgba("#000000", 0)]]),
            claves: {x: cad.x}},
        {nombre: "banco", en: [BANCO_X, 0], partes: [
            {nombre: "pata_1", rect: [-14, -50, -9, 0], color: C.maderaOsc},
            {nombre: "pata_2", rect: [9, -50, 14, 0], color: C.maderaOsc},
            {nombre: "asiento", rect: [-20, -56, 20, -49], degradado: lineal([0, -56], [0, -49], [[0, "#b8844e"], [1, C.maderaOsc]])},
        ]},
        {nombre: "cuerpo", claves: {x: cad.x, y: cad.y}, partes: [
            pierna("i", C.pantalonOsc, "#22262f", 0),
            pierna("d", C.pantalon, C.pantalonOsc, 1),
            {...torso, capa: 2},
        ]},
        {nombre: "manzana", en: MANZANA, claves: {x: br.objetivoMano.x.map(([t, v, i]) => [t, t <= T.toma ? MANZANA[0] : v, i]).filter(([t]) => t >= T.toma || t === 0),
            y: br.objetivoMano.y.map(([t, v, i]) => [t, t <= T.toma ? MANZANA[1] : v, i]).filter(([t]) => t >= T.toma || t === 0)}, partes: [
            {nombre: "fruta", circulo: {r: 7.5, lados: 18}, degradado: radial([-2.5, -2.5], 9, [[0, "#ff6a5a"], [0.6, "#d8282a"], [1, "#8a1218"]])},
            {nombre: "tallo", rect: [-0.8, -11, 0.8, -6], color: "#5a3a1a"},
            {nombre: "hoja", poligono: [[1, -9], [6, -12], [3, -8]], color: "#4a9a3a"},
        ]},
        // objetivos del IK (partes vacias: no se dibujan)
        {nombre: "obj_pie_i", partes: [], claves: pies.i},
        {nombre: "obj_pie_d", partes: [], claves: pies.d},
        {nombre: "obj_mano_d", partes: [], claves: br.objetivoMano},
        {nombre: "obj_mano_i", partes: [], claves: {x: [[0, X0]], y: [[0, -90]]}},
    ]};
}

// ------------------------------------------------------------------ escena
const ESC = 1.6, PISO = 640;
const ASSETS = [caminante()];
const escena = {
    tipo: "escena", precision: "decimal", nombre: "IK: caminar y tomar la manzana", duracion: DUR, profundidad: true,
    camara: {centro: [640, 360], claves: {zoom: [[0, 1], [CERRAR, 1, "suave"], [T.toma, 1.45, "suave"], [T.baja + 400, 1.45], [DUR, 1.3, "suave"]],
        x: [[0, 640], [CERRAR, 640, "suave"], [T.toma, ESC * (XF + 20), "suave"]], y: [[0, 360], [CERRAR, 360, "suave"], [T.toma, PISO - ESC * 105, "suave"]]}},
    objetos: [
        {nombre: "pared", en: [0, 0], plano: -3, rect: [-200, -100, 1600, PISO], degradado: lineal([0, -100], [0, PISO], [[0, "#2c3e50"], [1, "#4a6278"]])},
        {nombre: "ventana_luz", en: [300, 260], plano: -3, circulo: {r: 300, lados: 28}, mezcla: "suma", degradado: radial([0, 0], 300, [[0, rgba("#ffe2a8", 0.25)], [1, rgba("#ffe2a8", 0)]])},
        {nombre: "zocalo", en: [0, 0], plano: -2, rect: [-200, PISO - 30, 1600, PISO], color: "#3a4a5a"},
        {nombre: "piso", en: [0, 0], plano: -2, rect: [-200, PISO, 1600, 820], degradado: lineal([0, PISO], [0, 820], [[0, "#8a6a4a"], [1, "#4a3424"]])},
        {instancia: "Caminante (IK)", nombre: "caminante", en: [0, PISO], escala: ESC, bucle: false},
    ],
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
console.log(`assets: ${ASSETS.length}, duracion ${DUR} ms, cadera final x ${XF}`);
