// Fase 8 de planeacion_capacidades.md: CRIATURA (un dragon).
// Al atardecer un dragon llega volando, queda suspendido, ruge y le echa fuego a una torre de
// vigia de madera que se incendia y se carboniza; despues se va.
//   - alas articuladas: hueso, antebrazo, 3 dedos y membrana festoneada, en 8 poses del aleteo
//     (el antebrazo se pliega al subir); el MORPHING pasa de una pose a otra en bucle;
//   - cuello con IK (2 huesos, la cabeza toma la rotacion del objetivo); mandibula que se abre;
//   - cola de 5 segmentos con INERCIA; fuego, humo y resplandor con particulas;
//   - la torre se oscurece (morphing de COLOR); sombra tenue en el suelo; temblor al rugir.
//   node herramientas/ejemplos/dragon/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const rad = (g) => g * Math.PI / 180;
const C = {escama: "#3a6a4a", escamaOsc: "#1e3a2a", escamaLuz: "#6a9a5a", panza: "#c8b070", membrana: "#7a3a2a", membranaOsc: "#4a2018", hueso: "#2a1a14", cuerno: "#e8dcc0", ojo: "#ffd040"};

// ------------------------------------------------------------------ guion (ms)
const DUR = 13000, FLAP = 720;
const T = {llega: 3800, rugeA: 4700, rugeB: 6000, fuegoA: 6400, fuegoB: 9500, prende: 6900, vaA: 10300, vaB: 12600};

// ------------------------------------------------------------------ ala articulada (puntos con topologia fija)
// p: fase del aleteo 0..1 (0 = arriba). Coordenadas relativas al hombro (y hacia abajo).
function poseAla(p, escala = 1) {
    // el ala apunta hacia atras y barre de arriba (elevacion 70) a abajo (-45); el antebrazo se
    // pliega hacia atras al subir (recupera) y se estira al bajar (empuja)
    const c = 0.5 - 0.5 * Math.cos(2 * Math.PI * p);              // 0 arriba -> 1 abajo -> 0
    const elev = 70 - 115 * c;
    const a1 = 180 + elev;                                         // 250 (= -110, arriba) .. 135 (abajo-atras)
    const pliegue = p < 0.5 ? 0.15 : 0.15 + 0.85 * Math.sin(2 * Math.PI * (p - 0.5));
    const a2 = a1 - (22 + 48 * pliegue);
    const abre = 0.7 + 0.3 * Math.sin(Math.PI * c);
    const L1 = 64 * escala, L2 = 78 * escala, LF = [96, 118, 84].map((l) => l * escala);
    const S = [0, 0], E = [L1 * Math.cos(rad(a1)), L1 * Math.sin(rad(a1))];
    const W = [E[0] + L2 * Math.cos(rad(a2)), E[1] + L2 * Math.sin(rad(a2))];
    const dedos = [8, 42, 76].map((d, k) => { const a = a2 + d * abre; return [W[0] + LF[k] * Math.cos(rad(a)), W[1] + LF[k] * Math.sin(rad(a))]; });
    const B = [-78 * escala, 22 * escala];                         // donde la membrana se une al cuerpo
    const entre = (a, b, k = 0.28) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return [m[0] + (W[0] - m[0]) * k, m[1] + (W[1] - m[1]) * k]; };
    const membrana = [S, E, W, dedos[0], entre(dedos[0], dedos[1]), dedos[1], entre(dedos[1], dedos[2]), dedos[2], entre(dedos[2], B, 0.18), B, [-20 * escala, 8 * escala]];
    const hueso = (a, b, w0, w1) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        return [[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]];
    };
    const R = (pts) => pts.map(([x, y]) => [r1(x), r1(y)]);
    return {
        membrana: R(membrana),
        brazo: R(hueso(S, E, 5 * escala, 4 * escala)), antebrazo: R(hueso(E, W, 4 * escala, 3 * escala)),
        dedo_1: R(hueso(W, dedos[0], 2.5 * escala, 0.8)), dedo_2: R(hueso(W, dedos[1], 2.5 * escala, 0.8)), dedo_3: R(hueso(W, dedos[2], 2.5 * escala, 0.8)),
        garra: R([[W[0] - 3, W[1]], [W[0] + 1, W[1] - 9 * escala], [W[0] + 4, W[1] + 1]]),
    };
}
const FASES = 8;
function ala(nombre, en, escala, colores, capa) {
    const poses = Array.from({length: FASES}, (_, i) => poseAla(i / FASES, escala));
    const claves = [...poses.map((_, i) => [Math.round(i * FLAP / FASES), i === 0 ? "" : `f${i}`, "suave"]), [FLAP, "", "suave"]];
    const estilo = {
        membrana: {degradado: lineal([0, -150 * escala], [0, 80 * escala], [[0, colores.mem], [1, colores.memOsc]]), borde: colores.memOsc, opacidad: 0.95},
        brazo: {color: colores.hueso}, antebrazo: {color: colores.hueso}, dedo_1: {color: colores.hueso}, dedo_2: {color: colores.hueso}, dedo_3: {color: colores.hueso},
        garra: {color: C.cuerno},
    };
    return {nombre, en, capa, partes: Object.keys(poses[0]).map((p) => ({
        nombre: `${nombre}_${p}`, poligono: poses[0][p], ...estilo[p],
        formas: Object.fromEntries(poses.slice(1).map((po, i) => [`f${i + 1}`, {poligono: po[p]}])),
        claves: {forma: claves}, bucle: "repetir",
    }))};
}

// ------------------------------------------------------------------ el dragon (asset)
function dragon() {
    // objetivo del cuello: reposo, ruge (arriba), fuego (adelante-abajo), se va (adelante-arriba)
    const OBJ = {reposo: [128, -64, 0], ruge: [112, -104, -32], fuego: [146, -40, 16], va: [140, -78, -12]};
    const k = (prop) => {
        const i = {x: 0, y: 1, r: 2}[prop];
        return [[0, OBJ.reposo[i]], [T.rugeA, OBJ.reposo[i]], [T.rugeA + 400, OBJ.ruge[i], "suave"], [T.rugeB - 200, OBJ.ruge[i]], [T.fuegoA, OBJ.fuego[i], "suave"],
            [T.fuegoB, OBJ.fuego[i]], [T.vaA, OBJ.va[i], "suave"]];
    };
    const mandibula = [[0, 4], [T.rugeA + 100, 4], [T.rugeA + 400, 30, "salir"], [T.rugeB - 250, 30], [T.rugeB, 8, "suave"], [T.fuegoA - 100, 8], [T.fuegoA + 150, 26, "salir"], [T.fuegoB, 26], [T.fuegoB + 300, 4, "suave"]];
    const pecho = [[0, 1], [T.rugeB - 100, 1], [T.fuegoA - 50, 1.08, "suave"], [T.fuegoA + 200, 1, "suave"]];
    // vaiven del cuerpo con el aleteo (sube cuando el ala baja)
    const vaiven = [[0, 6, "suave"], [FLAP * 0.55, -7, "suave"], [FLAP, 6, "suave"]];
    const cola = (() => {
        const pts = [[-62, 6], [-104, 14], [-142, 24], [-176, 36], [-204, 50], [-226, 64]];
        let parte = {nombre: "cola_punta", poligono: [[-222, 58], [-246, 58], [-234, 78], [-226, 66]], color: C.escamaOsc};
        for (let i = pts.length - 2; i >= 0; i--) {
            const a = pts[i], b = pts[i + 1], w0 = 16 - i * 2.6, w1 = 16 - (i + 1) * 2.6;
            parte = {nombre: `cola_${i}`, poligono: [[a[0], a[1] - w0 / 2], [b[0], b[1] - w1 / 2], [b[0], b[1] + w1 / 2], [a[0], a[1] + w0 / 2]].map(([x, y]) => [r1(x), r1(y)]),
                degradado: lineal([0, a[1] - 10], [0, a[1] + 10], [[0, C.escama], [1, C.escamaOsc]]), pivote: a,
                inercia: {rigidez: 1.4 + i * 0.25, amortiguacion: 0.22, limite: 22, fuerza: 0.9}, partes: [parte]};
        }
        return parte;
    })();
    return {tipo: "asset", nombre: "Dragón", duracion: DUR, marcas, partes: [
        {nombre: "dragon", claves: {y: vaiven}, bucle: "repetir", partes: [
            ala("ala_lejos", [6, -30], 0.92, {mem: "#5a2a20", memOsc: "#2a1010", hueso: "#1a100c"}, 0),
            {...cola, capa: 1},
            {nombre: "pata_atras", capa: 2, poligono: [[-44, 18], [-28, 18], [-34, 44], [-22, 54], [-40, 54], [-46, 40]], color: C.escamaOsc},
            {nombre: "cuerpo", capa: 3, pivote: [0, 0], claves: {escala_y: pecho}, partes: [
                {nombre: "torso", poligono: [[-70, 4], [-50, -22], [-10, -34], [40, -30], [66, -14], [70, 8], [44, 30], [0, 36], [-46, 28]],
                    degradado: lineal([0, -34], [0, 36], [[0, C.escamaLuz], [0.45, C.escama], [1, C.escamaOsc]])},
                {nombre: "panza", poligono: [[-46, 20], [-4, 32], [40, 26], [60, 8], [44, 18], [0, 22], [-40, 12]], color: C.panza},
                ...Array.from({length: 6}, (_, i) => ({nombre: `pua_${i}`, poligono: [[-48 + i * 18, -24 + Math.abs(i - 2) * 2], [-40 + i * 18, -38 + Math.abs(i - 2) * 2], [-34 + i * 18, -26 + Math.abs(i - 2) * 2]], color: C.escamaOsc})),
                {nombre: "pata_adelante", poligono: [[34, 22], [48, 22], [52, 42], [62, 50], [46, 50], [38, 38]], color: C.escamaOsc},
            ]},
            {nombre: "cuello_1", capa: 4, poligono: [[48, -26], [64, -4], [100, -38], [86, -52]], degradado: lineal([0, -52], [0, -4], [[0, C.escamaLuz], [1, C.escama]]), pivote: [56, -14],
                ik: {hasta: "cuello_2", punta: [128, -64], objetivo: "obj_cabeza", doblez: -1, orientar: "cabeza"},
                partes: [{nombre: "cuello_2", poligono: [[86, -52], [100, -38], [132, -56], [124, -70]], degradado: lineal([0, -70], [0, -38], [[0, C.escamaLuz], [1, C.escama]]), pivote: [93, -45],
                    partes: [{nombre: "cabeza", pivote: [128, -64], partes: [
                        {nombre: "craneo", poligono: [[118, -76], [146, -80], [174, -70], [182, -62], [160, -58], [130, -54], [118, -62]], degradado: lineal([0, -80], [0, -54], [[0, C.escamaLuz], [1, C.escama]])},
                        {nombre: "cuerno_1", poligono: [[124, -76], [104, -96], [132, -80]], color: C.cuerno},
                        {nombre: "cuerno_2", poligono: [[134, -78], [122, -100], [142, -80]], color: C.cuerno},
                        {nombre: "ojo", en: [146, -71], elipse: [4, 2.6], color: C.ojo},
                        {nombre: "brillo_ojo", en: [146, -71], circulo: {r: 9, lados: 14}, mezcla: "suma", degradado: radial([0, 0], 9, [[0, rgba("#ffd040", 0.6)], [1, rgba("#ffd040", 0)]])},
                        {nombre: "fosa", en: [176, -66], circulo: {r: 1.6, lados: 6}, color: "#1a0a08"},
                        {nombre: "mandibula", pivote: [130, -58], claves: {rotacion: mandibula}, partes: [
                            {nombre: "mandibula_hueso", poligono: [[122, -60], [160, -56], [176, -54], [150, -48], [124, -50]], color: C.escamaOsc},
                            {nombre: "dientes", poligono: [[150, -56], [154, -52], [158, -56], [162, -52], [166, -55], [170, -52], [172, -55]], color: C.cuerno},
                            {nombre: "lengua", poligono: [[132, -55], [160, -54], [150, -51], [134, -52]], color: "#a02028"}]},
                        {nombre: "boca_fuego", en: [176, -57], circulo: {r: 10, lados: 14}, mezcla: "suma", degradado: radial([0, 0], 10, [[0, rgba("#fff0a0", 0.9)], [1, rgba("#ff6020", 0)]]),
                            claves: {opacidad: [[0, 0], [T.fuegoA - 50, 0], [T.fuegoA + 100, 1, "salir"], [T.fuegoB, 1], [T.fuegoB + 250, 0, "entrar"]]}},
                    ]}]}]},
            ala("ala", [12, -28], 1, {mem: C.membrana, memOsc: C.membranaOsc, hueso: C.hueso}, 5),
        ]},
        {nombre: "obj_cabeza", partes: [], claves: {x: k("x"), y: k("y"), rotacion: k("r")}, pivote: [0, 0]},
    ]};
}

// ------------------------------------------------------------------ escena
const ESC = 1.3, PISO = 640;
// trayectoria de la instancia (el origen es el centro del cuerpo)
const X = [[0, -300], [T.llega, 470, "salir"], [T.vaA, 500, "suave"], [T.vaB, 1550, "entrar"]];
const Y = [[0, 240], [T.llega * 0.5, 210, "suave"], [T.llega, 300, "suave"], [T.vaA, 290, "suave"], [T.vaB, -120, "entrar"]];
// la boca en la escena durante el fuego: posicion de la instancia + objetivo del cuello + punta del hocico
const BOCA = [470 + ESC * (146 + 30), 300 + ESC * (-40 + 9)];
const TORRE = [1060, PISO];

function torre() {
    const madera = (n, pts, claro, oscuro) => ({nombre: n, poligono: pts, color: claro,
        degradado: lineal([0, -260], [0, 0], [[0, claro], [1, oscuro]]),
        colores: {quemada: {degradado: lineal([0, -260], [0, 0], [[0, "#2a1a12"], [1, "#100a06"]]), borde: "#000000"}},
        claves: {forma: [[0, ""], [T.prende, ""], [T.prende + 2600, "quemada", "suave"]]}});
    return [
        madera("pata_i", [[-56, 0], [-46, 0], [-26, -200], [-34, -200]], "#8a5a30", "#5a3a1e"),
        madera("pata_d", [[46, 0], [56, 0], [34, -200], [26, -200]], "#7a4e28", "#4a3018"),
        madera("cruz_1", [[-48, -40], [-40, -48], [40, -120], [32, -112]], "#6a4422", "#4a3018"),
        madera("cruz_2", [[40, -40], [48, -48], [-32, -120], [-40, -112]], "#6a4422", "#4a3018"),
        madera("plataforma", [[-56, -200], [56, -200], [56, -212], [-56, -212]], "#9a6a3a", "#6a4422"),
        madera("baranda", [[-52, -212], [-46, -212], [-46, -244], [46, -244], [46, -212], [52, -212], [52, -250], [-52, -250]], "#8a5a30", "#5a3a1e"),
        madera("techo", [[-66, -250], [66, -250], [0, -300]], "#a04a2a", "#6a2a18"),
    ];
}

const fuego = (t0, t1) => ({inicio: t0, fin: t1, suave: "si", mezcla: "suma"});
const efectos = [
    // llamarada: de la boca hacia la torre
    {tipo: "particulas", nombre: "llamarada", en: BOCA, ...fuego(T.fuegoA, T.fuegoB), tasa: 150, vida: 720, velocidad: 560, angulo: 21, dispersion: 17, gravedad: -140,
        tam_ini: 10, tam_fin: 115, color_ini: "#ffd870", color_fin: "#e02800", opacidad: 0.7},
    {tipo: "particulas", nombre: "humo_llamarada", en: BOCA, inicio: T.fuegoA + 200, fin: T.fuegoB + 200, tasa: 30, vida: 1400, velocidad: 380, angulo: 18, dispersion: 22, gravedad: -160,
        tam_ini: 20, tam_fin: 120, color_ini: "#6a4a3a", color_fin: "#2a2420", suave: "si", opacidad: 0.35},
    // la torre arde
    ...[-30, 0, 30].map((dx, i) => ({tipo: "particulas", nombre: `fuego_torre_${i}`, en: [TORRE[0] + dx, TORRE[1] - 150 - i * 30], ...fuego(T.prende + i * 300, DUR),
        tasa: 40, vida: 900, velocidad: 110, angulo: -90, dispersion: 40, gravedad: -200, tam_ini: 22, tam_fin: 75, color_ini: "#ffc850", color_fin: "#d82a08", opacidad: 0.65})),
    {tipo: "particulas", nombre: "humo_torre", en: [TORRE[0], TORRE[1] - 290], inicio: T.prende + 600, fin: DUR, tasa: 12, vida: 4200, velocidad: 70, angulo: -98, dispersion: 30, gravedad: -30,
        tam_ini: 30, tam_fin: 220, color_ini: "#3a3230", color_fin: "#6a6460", suave: "si", opacidad: 0.4},
    {tipo: "particulas", nombre: "brasas", en: [TORRE[0], TORRE[1] - 180], ...fuego(T.prende + 400, DUR), tasa: 18, vida: 2200, velocidad: 90, angulo: -90, dispersion: 90, gravedad: -40,
        tam_ini: 3, tam_fin: 1, color_ini: "#ffd060", color_fin: "#ff4010", opacidad: 1},
].map((e) => ({...e, sonido: "no_lleva"}));

const parpadeo = (t0, t1, base, amp) => { const k = [[0, 0], [t0 - 1, 0]]; for (let t = t0, i = 0; t < t1; t += 90, i++) k.push([t, r1(base + amp * Math.sin(i * 2.3) * Math.cos(i * 0.7)), "suave"]); k.push([Math.min(DUR, t1 + 400), 0, "suave"]); return k.filter((c, i) => i === 0 || c[0] > k[i - 1][0]); };
const objetos = [
    {nombre: "cielo", en: [0, 0], plano: -6, rect: [-400, -400, 1800, PISO], degradado: lineal([0, -400], [0, PISO], [[0, "#2a2050"], [0.5, "#a04a4a"], [1, "#f0a050"]])},
    {nombre: "sol", en: [300, 470], plano: -6, circulo: {r: 240, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 240, [[0, rgba("#fff0b0", 0.9)], [0.15, rgba("#ffc060", 0.55)], [1, rgba("#ff8030", 0)]])},
    {nombre: "montes_lejos", en: [0, 0], plano: -5, desenfoque: 1.5, poligono: [[-400, PISO], [-400, 430], [-200, 360], [0, 420], [220, 330], [420, 410], [640, 340], [860, 420], [1080, 350], [1300, 410], [1500, 330], [1800, 420], [1800, PISO]],
        degradado: lineal([0, 330], [0, PISO], [[0, "#6a4a6a"], [1, "#4a3450"]])},
    {nombre: "montes_cerca", en: [0, 0], plano: -4, poligono: [[-400, PISO], [-400, 520], [-100, 470], [200, 540], [500, 490], [800, 560], [1200, 500], [1500, 550], [1800, 500], [1800, PISO]],
        degradado: lineal([0, 470], [0, PISO], [[0, "#3a2a3a"], [1, "#2a1e2a"]])},
    {nombre: "pasto", en: [0, 0], plano: -3, rect: [-400, PISO - 20, 1800, 900], degradado: lineal([0, PISO - 20], [0, 900], [[0, "#4a3a28"], [1, "#1e160e"]])},
    {nombre: "resplandor_torre", en: [TORRE[0], TORRE[1] - 160], plano: -2, circulo: {r: 340, lados: 32}, mezcla: "suma",
        degradado: radial([0, 0], 340, [[0, rgba("#ff8a30", 0.55)], [1, rgba("#ff8a30", 0)]]), claves: {opacidad: parpadeo(T.prende, DUR, 0.75, 0.25)}},
    {nombre: "torre", en: TORRE, plano: -1, partes: torre()},
    {instancia: "Dragón", nombre: "dragon", en: [X[0][1], Y[0][1]], escala: ESC, bucle: false, claves: {x: X, y: Y},
        sombra: {angulo: 12, piso: PISO, opacidad: 0.45, desenfoque: 6, aplastar: 0.12}},
    {nombre: "resplandor_llamarada", en: [BOCA[0] + 260, BOCA[1] + 110], plano: 1, circulo: {r: 420, lados: 32}, mezcla: "suma",
        degradado: radial([0, 0], 420, [[0, rgba("#ffb040", 0.4)], [1, rgba("#ffb040", 0)]]), claves: {opacidad: parpadeo(T.fuegoA + 100, T.fuegoB, 0.8, 0.2)}},
].map((o) => (o.nombre === "dragon" ? o : {...o, sonido: "no_lleva"}));
const escena = {
    tipo: "escena", precision: "decimal", nombre: "El dragón y la torre", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Viento de montaña", t: 0, volumen: 0.4, bucle: true, fundido: {entrada: 1200, salida: 1500}},
        {sonido: "Aleteo", t: 0, volumen: 0.7, bucle: true, fundido: {entrada: 800, salida: 600}},
        {sonido: "Rugido", t: T.rugeA + 150, volumen: 1},
        {sonido: "Llamarada", t: T.fuegoA, volumen: 0.9},
        {sonido: "Fuego crepitando", t: T.prende, volumen: 0.6, bucle: true, fundido: {entrada: 1500, salida: 1500}},
    ],
    camara: {centro: [300, 300], zoom: 1.25, temblor: {desde: T.rugeA + 200, hasta: T.rugeB - 300, amplitud: 5}, claves: {
        x: [[0, 120], [T.llega, 600, "suave"], [T.fuegoA, 700, "suave"], [T.vaA, 720], [T.vaB, 900, "suave"]],
        y: [[0, 260], [T.llega, 380, "suave"], [T.vaB, 330, "suave"]],
        zoom: [[0, 1.25], [T.llega, 1.05, "suave"], [T.rugeA, 1.2, "suave"], [T.rugeB, 1.2], [T.fuegoA + 300, 1, "suave"], [T.vaB, 1, "suave"]]}},
    objetos, efectos,
};
const ASSETS = [dragon()];
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms\n`);
