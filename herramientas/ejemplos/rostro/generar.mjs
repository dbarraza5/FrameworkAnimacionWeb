// Proyecto "Rostro": retrato de una mujer (Lia, diseno propio) que habla.
// La boca cambia entre 9 formas (visemas) segun un texto: `labios(texto)` convierte las letras en
// una linea de tiempo, y la misma linea de tiempo genera voz.json para sintetizar la voz.
// Escribe asset_NN.json, escena.json y voz.json en esta carpeta.
//   node herramientas/ejemplos/rostro/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const TEXTO = "Hola. Me llamo Lía. Mi cara está hecha solo de polígonos, y cada palabra mueve mis labios, un fotograma a la vez. ¿Me escuchas?";
const C = {
    piel: "#e7b896", pielSombra: "#cf9874", pielOsc: "#b88464", pielLuz: "#f4cfb4", rubor: "#e8907f",
    pelo: "#3a2418", peloLuz: "#5a3826", peloOsc: "#24150d",
    blanco: "#f6f1ea", iris: "#4f7a5a", irisOsc: "#2f4f38", pupila: "#1a1414", pestana: "#21140f", ceja: "#4a2e1f",
    labioSup: "#a94c50", labioInf: "#bf5d60", labioLuz: "#e08a8a", boca: "#4a1a20", diente: "#f4efe6", lengua: "#c45d62",
    sueter: "#2f5d62", sueterOsc: "#21454a", oro: "#d9b25a",
};
const r1 = (v) => Math.round(v * 10) / 10;
const R = (x0, y0, x1, y1) => ({rect: [x0, y0, x1, y1]});
const circ = (r, lados = 14) => ({circulo: {r, lados}});
const espejo = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const marcas = {EventoGeneral: "no_lleva"};
const desplaza = (pts, dx, dy) => pts.map(([x, y]) => [r1(x + dx), r1(y + dy)]);

// ------------------------------------------------------------------ fondo y cuerpo
function estudio() {
    const bandas = ["#14212a", "#172731", "#1b2d38", "#1f343f", "#223845", "#1f343f", "#1b2d38"];
    const partes = bandas.map((c, i) => ({nombre: `banda_${i}`, ...R(-100, i * 110 - 20, 1400, i * 110 + 95), color: c}));
    [[180, 160, 70], [1080, 120, 90], [1150, 520, 60], [120, 560, 80], [960, 330, 40], [320, 330, 30]].forEach(([x, y, r], i) =>
        partes.push({nombre: `bokeh_${i}`, en: [x, y], ...circ(r, 20), color: "#f3c58a", claves: {opacidad: [[0, 0.06], [2500 + i * 400, 0.13]]}, bucle: "ida_vuelta"}));
    return {tipo: "asset", nombre: "Estudio", duracion: 1000, marcas, partes};
}

const torso = () => ({tipo: "asset", nombre: "Torso de Lía", marcas, partes: [
    {nombre: "cuello", poligono: [[-58, -230], [58, -230], [64, -90], [-64, -90]], color: C.pielSombra},
    {nombre: "sombra_menton", poligono: [[-60, -215], [60, -215], [48, -165], [-48, -165]], color: C.pielOsc, opacidad: 0.7},
    {nombre: "hombros", poligono: [[-360, 20], [-330, -60], [-210, -108], [-70, -128], [70, -128], [210, -108], [330, -60], [360, 20]], color: C.sueter, borde: C.sueterOsc},
    {nombre: "escote", poligono: [[-66, -128], [66, -128], [0, -40]], color: C.pielSombra},
    {nombre: "cuello_sueter", poligono: [[-74, -130], [-60, -132], [0, -50], [60, -132], [74, -130], [0, -34]], color: C.sueterOsc},
    {nombre: "clavicula_izq", ...R(-56, -112, -24, -109), color: C.pielOsc, opacidad: 0.5},
    {nombre: "clavicula_der", ...R(24, -112, 56, -109), color: C.pielOsc, opacidad: 0.5},
    {nombre: "dije", en: [0, -78], ...circ(5, 10), color: C.oro},
    {nombre: "cadena_izq", ...R(-40, -122, -2, -120), color: C.oro, opacidad: 0.7, rotacion: 0},
]});

const cabelloAtras = () => ({tipo: "asset", nombre: "Cabello de Lía (atrás)", duracion: 1000, marcas, partes: [
    {nombre: "melena", pivote: [0, -560], claves: {rotacion: [[0, -0.8], [2600, 0.8]]}, bucle: "ida_vuelta", partes: [
        {nombre: "masa", poligono: [[-200, -480], [-192, -580], [-122, -642], [0, -662], [122, -642], [192, -580], [206, -460], [212, -300], [226, -170],
            [190, -138], [150, -170], [110, -240], [-110, -240], [-150, -170], [-192, -138], [-228, -170], [-214, -300]], color: C.peloOsc},
        {nombre: "puntas_izq", poligono: [[-228, -170], [-212, -150], [-190, -138], [-160, -165], [-170, -200], [-214, -205]], color: C.pelo},
        {nombre: "puntas_der", poligono: [[226, -170], [212, -150], [190, -138], [160, -165], [170, -200], [214, -205]], color: C.pelo},
    ]},
]});

// ------------------------------------------------------------------ rostro
function ojo(lado) {               // lado -1 = izquierda de la imagen
    const cx = 62 * lado, cy = -372;
    const almendra = [[-28, 1], [-17, -11], [0, -14], [17, -12], [29, -3], [16, 8], [0, 11], [-15, 8]].map(([x, y]) => [r1(cx + x * lado), r1(cy + y)]);
    const parpadeo = {escala_y: [[0, 0.3], [2950, 0.3], [3030, 1], [3120, 0.3], [5300, 0.3], [5380, 1], [5470, 0.3], [5700, 0.3]]};
    return [
        {nombre: `pliegue_${lado}`, poligono: desplaza([[-27, -14], [0, -22], [27, -16], [27, -13], [0, -19], [-27, -11]].map(([x, y]) => [x * lado, y]), cx, cy - 4), color: C.pielOsc, opacidad: 0.55},
        {nombre: `sombra_ojo_${lado}`, en: [cx, cy - 8], elipse: [34, 14], color: C.pielSombra, opacidad: 0.5},
        {nombre: `blanco_${lado}`, poligono: almendra, color: C.blanco},
        {nombre: `mirada_${lado}`, claves: {x: [[0, 0], [1800, 0], [1900, 5], [3600, 5], [3700, -3], [4800, -3], [4900, 0], [5700, 0]]}, bucle: "repetir", partes: [
            {nombre: `iris_${lado}`, en: [cx, cy], ...circ(13, 18), color: C.iris, borde: C.irisOsc},
            {nombre: `iris_luz_${lado}`, en: [cx + 2, cy + 4], ...circ(7, 12), color: "#6e9a74", opacidad: 0.6},
            {nombre: `pupila_${lado}`, en: [cx, cy], ...circ(6, 12), color: C.pupila},
            {nombre: `brillo_${lado}`, en: [cx + 4, cy - 5], ...circ(3, 8), color: "#ffffff"},
        ]},
        {nombre: `pestana_inf_${lado}`, poligono: desplaza([[-24, 7], [0, 11.5], [16, 8.5], [16, 10], [0, 13], [-24, 8.5]].map(([x, y]) => [x * lado, y]), cx, cy), color: C.pielOsc, opacidad: 0.7},
        {nombre: `parpado_${lado}`, pivote: [cx, cy - 18], claves: parpadeo, bucle: "repetir", partes: [
            {nombre: `piel_parpado_${lado}`, ...R(cx - 33, cy - 18, cx + 33, cy + 15), color: C.piel},
            {nombre: `pestanas_${lado}`, poligono: desplaza([[-30, 12], [0, 14], [26, 11], [36, 5], [30, 13], [0, 17.5], [-30, 15]].map(([x, y]) => [x * lado, y]), cx, cy), color: C.pestana},
        ]},
    ];
}

function rostro() {
    const media = [[0, -566], [70, -558], [120, -526], [148, -466], [156, -392], [151, -330], [139, -270], [116, -214], [82, -174], [42, -151], [0, -145]];
    const cara = [...espejo(media.slice(1)), ...media.slice(0, -1)];   // de la barbilla, por la izquierda, a la frente y de vuelta
    const lado = (s) => [[148 * s, -466], [156 * s, -392], [151 * s, -330], [139 * s, -270], [116 * s, -214], [82 * s, -174], [64 * s, -186], [100 * s, -232], [120 * s, -300], [128 * s, -380], [124 * s, -450]];
    return {tipo: "asset", nombre: "Rostro de Lía", duracion: 6000, marcas, partes: [
        {nombre: "oreja_izq", en: [-152, -352], elipse: [19, 36], color: C.pielSombra},
        {nombre: "oreja_der", en: [152, -352], elipse: [19, 36], color: C.pielSombra},
        {nombre: "oreja_izq_in", en: [-150, -352], elipse: [9, 22], color: C.pielOsc, opacidad: 0.6},
        {nombre: "oreja_der_in", en: [150, -352], elipse: [9, 22], color: C.pielOsc, opacidad: 0.6},
        {nombre: "cara", poligono: cara, color: C.piel},
        {nombre: "sombra_izq", poligono: lado(-1), color: C.pielSombra, opacidad: 0.45},
        {nombre: "sombra_der", poligono: lado(1), color: C.pielSombra, opacidad: 0.35},
        {nombre: "sombra_menton", en: [0, -170], elipse: [44, 16], color: C.pielSombra, opacidad: 0.4},
        {nombre: "rubor_izq", en: [-84, -298], elipse: [34, 18], color: C.rubor, opacidad: 0.28},
        {nombre: "rubor_der", en: [84, -298], elipse: [34, 18], color: C.rubor, opacidad: 0.28},
        {nombre: "nariz_sombra", poligono: [[-16, -392], [-8, -392], [-9, -312], [-20, -300], [-24, -306]], color: C.pielSombra, opacidad: 0.55},
        {nombre: "nariz_punta", en: [0, -293], elipse: [19, 12], color: "#dda383"},
        {nombre: "nariz_luz", en: [3, -310], elipse: [4, 10], color: C.pielLuz, opacidad: 0.7},
        {nombre: "fosa_izq", en: [-9, -287], elipse: [5.5, 3], color: "#8a4f40"},
        {nombre: "fosa_der", en: [9, -287], elipse: [5.5, 3], color: "#8a4f40"},
        {nombre: "filtrum", poligono: [[-6, -282], [6, -282], [8, -262], [-8, -262]], color: C.pielSombra, opacidad: 0.3},
        {nombre: "arete_izq", pivote: [-156, -322], claves: {rotacion: [[0, -6], [1400, 6]]}, bucle: "ida_vuelta", partes: [
            {nombre: "arete_izq_aro", en: [-156, -318], ...circ(4, 8), color: C.oro},
            {nombre: "arete_izq_gota", en: [-156, -304], elipse: [4, 7], color: C.oro}]},
        {nombre: "arete_der", pivote: [156, -322], claves: {rotacion: [[0, 6], [1400, -6]]}, bucle: "ida_vuelta", partes: [
            {nombre: "arete_der_aro", en: [156, -318], ...circ(4, 8), color: C.oro},
            {nombre: "arete_der_gota", en: [156, -304], elipse: [4, 7], color: C.oro}]},
    ]};
}

// el rostro va en tres assets (cara, ojos, cabello de adelante): uno solo supera el tamano de request del backend
const ojos = () => ({tipo: "asset", nombre: "Ojos de Lía", duracion: 6000, marcas, partes: [...ojo(-1), ...ojo(1)]});

function cabelloFrente() {
    return {tipo: "asset", nombre: "Cabello de Lía (adelante)", duracion: 1000, marcas, partes: [
        // mechones a los lados y flequillo de lado
        {nombre: "mechon_izq", poligono: [[-162, -480], [-146, -400], [-148, -300], [-160, -220], [-176, -186], [-186, -260], [-186, -400], [-178, -470]], color: C.pelo},
        {nombre: "mechon_der", poligono: [[162, -470], [176, -460], [188, -400], [190, -280], [180, -196], [166, -230], [152, -320], [150, -420]], color: C.pelo},
        {nombre: "flequillo", pivote: [0, -600], claves: {rotacion: [[0, -0.6], [2200, 0.8]]}, bucle: "ida_vuelta", partes: [
            {nombre: "flequillo_masa", poligono: [[-170, -470], [-160, -560], [-96, -612], [10, -622], [110, -600], [164, -540], [170, -440], [150, -478], [118, -526],
                [60, -540], [0, -520], [-60, -486], [-112, -452], [-150, -430]], color: C.pelo},
            {nombre: "flequillo_luz_1", poligono: [[-120, -560], [-40, -600], [-30, -594], [-110, -552]], color: C.peloLuz},
            {nombre: "flequillo_luz_2", poligono: [[20, -604], [100, -584], [96, -576], [16, -596]], color: C.peloLuz},
            {nombre: "raya", ...R(-58, -616, -50, -560), color: C.peloOsc, rotacion: 0},
        ]},
    ]};
}

const cejas = () => {
    const ceja = (s) => desplaza([[-36, 7], [-22, -4], [0, -9], [20, -7], [34, 1], [20, 0], [0, -2], [-22, 3]].map(([x, y]) => [x * s, y]), 62 * s, -414);
    return {tipo: "asset", nombre: "Cejas de Lía", marcas, partes: [
        {nombre: "ceja_izq", poligono: ceja(-1), color: C.ceja},
        {nombre: "ceja_der", poligono: ceja(1), color: C.ceja},
    ]};
};

// ------------------------------------------------------------------ bocas (visemas)
// w: medio ancho, h: apertura, s: comisuras arriba, k: grosor de labios, redondo, f: dientes sobre el labio
const BOCA_Y = -236;
function boca(nombre, {w, h = 0, s = 0, k = 1, redondo = false, f = false}) {
    const N = 16, xs = Array.from({length: N + 1}, (_, i) => -w + 2 * w * i / N);
    const borde = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), redondo ? 0.5 : 0.75);
    const grosor = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), 0.6);
    const sube = (x) => -s * (x / w) ** 2;
    const arco = (x) => 3 * Math.exp(-(((Math.abs(x) - w * 0.24) / (w * 0.14)) ** 2));
    const supIn = (x) => -h / 2 * borde(x) + sube(x), infIn = (x) => h / 2 * borde(x) + sube(x);
    const supOut = (x) => supIn(x) - (9 * k * grosor(x) + 1.5) - arco(x) + 2 * Math.exp(-((x / (w * 0.08)) ** 2));
    const infOut = (x) => infIn(x) + (13 * k * grosor(x) + 1.5);
    const P = (fx, lista = xs) => lista.map((x) => [r1(x), r1(fx(x) + BOCA_Y)]);
    const rev = [...xs].reverse(), partes = [];
    if (h > 0) {
        partes.push({nombre: "interior", poligono: [...P(supIn), ...P(infIn, rev)], color: C.boca});
        if (h > 14) partes.push({nombre: "lengua", en: [0, r1(BOCA_Y + h / 2 * 0.62)], elipse: [r1(w * 0.45), r1(h * 0.22)], color: C.lengua});
        const xd = xs.filter((x) => Math.abs(x) <= w * 0.75);
        if (!f) partes.push({nombre: "dientes", poligono: [...P(supIn, xd), ...P((x) => Math.min(supIn(x) + 8, infIn(x) - 1), [...xd].reverse())], color: C.diente});
        if (h > 18) partes.push({nombre: "dientes_inf", poligono: [...P((x) => Math.max(infIn(x) - 5, supIn(x) + 9), xd), ...P(infIn, [...xd].reverse())], color: C.diente, opacidad: 0.85});
    }
    partes.push({nombre: "labio_inf", poligono: [...P(infIn), ...P(infOut, rev)], color: C.labioInf});
    partes.push({nombre: "labio_inf_luz", en: [0, r1(infIn(0) + 7 * k + BOCA_Y)], elipse: [r1(w * 0.35), r1(3 * k)], color: C.labioLuz, opacidad: 0.55});
    if (f) {
        const xd = xs.filter((x) => Math.abs(x) <= w * 0.7);
        partes.push({nombre: "dientes", poligono: [...P(supIn, xd), ...P((x) => supIn(x) + 6, [...xd].reverse())], color: C.diente});
    }
    partes.push({nombre: "labio_sup", poligono: [...P(supOut), ...P(supIn, rev)], color: C.labioSup});
    if (h === 0) partes.push({nombre: "linea", poligono: [...P(supIn), ...P((x) => supIn(x) + 1.6, rev)], color: "#6e2a30"});
    partes.push({nombre: "comisura_izq", en: [r1(-w - 1), r1(sube(w) + BOCA_Y)], ...circ(2, 6), color: C.pielOsc, opacidad: 0.6});
    partes.push({nombre: "comisura_der", en: [r1(w + 1), r1(sube(w) + BOCA_Y)], ...circ(2, 6), color: C.pielOsc, opacidad: 0.6});
    return {tipo: "asset", nombre, marcas, partes};
}
const VISEMAS = {
    cerrada: {w: 36}, sonrisa: {w: 42, s: 6}, m: {w: 34, k: 0.7}, f: {w: 36, h: 4, f: true},
    a: {w: 32, h: 26}, e: {w: 38, h: 12}, i: {w: 40, h: 7, s: 3}, o: {w: 24, h: 22, redondo: true}, u: {w: 18, h: 12, redondo: true, k: 1.2},
};
const nombreBoca = (v) => `Boca ${v}`;

const ASSETS = [estudio(), torso(), cabelloAtras(), rostro(), ojos(), cabelloFrente(), cejas(), ...Object.entries(VISEMAS).map(([v, p]) => boca(nombreBoca(v), p))];

// ------------------------------------------------------------------ labios: texto -> linea de tiempo
function labios(texto, t0) {
    const plano = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/¿|¡/g, "");
    const ev = [];                       // {t, v} cambios de boca
    const voz = [];                      // {t, d, v} para la voz
    let t = t0, az = 7;
    const variar = () => { az = (az * 16807) % 2147483647; return az / 2147483647; };
    const empuja = (v, d) => { ev.push({t: Math.round(t), v}); voz.push({t: Math.round(t), d: Math.round(d), v}); t += d; };
    for (let i = 0; i < plano.length; i++) {
        const c = plano[i], sig = plano[i + 1] || "";
        if ("aeiou".includes(c)) empuja(c, 120 + variar() * 70 + (",.?".includes(sig) || sig === " " ? 50 : 0));
        else if ("mbp".includes(c)) empuja("m", 75);
        else if ("fv".includes(c)) empuja("f", 80);
        else if (c === "s" || c === "z") { voz.push({t: Math.round(t), d: 70, v: "s"}); t += 70; }
        else if (c === "," ) empuja("cerrada", 260);
        else if (c === "." || c === "?") empuja("cerrada", 520);
        else if (c === " ") t += 25;
        else if (c === "h") continue;
        else { voz.push({t: Math.round(t), d: 40, v: "c"}); t += 40; }
    }
    const limpio = ev.filter((e, i) => i === 0 || e.v !== ev[i - 1].v);
    return {cambios: limpio, voz, fin: Math.round(t)};
}

const T0 = 900;
const L = labios(TEXTO, T0);
const DUR = L.fin + 1600;
L.cambios.push({t: L.fin + 200, v: "sonrisa"});

// movimiento de la cabeza: vaiven suave + asentir al final de cada frase
const ORIGEN = [640, 740];
const cabeza = {x: [], y: [], rotacion: []};
for (let t = 0, i = 0; t <= DUR; t += 950, i++) {
    cabeza.x.push([t, r1(ORIGEN[0] + 6 * Math.sin(i * 1.3)), "suave"]);
    cabeza.y.push([t, r1(ORIGEN[1] + 3 * Math.sin(i * 0.9 + 1)), "suave"]);
    cabeza.rotacion.push([t, r1(2.2 * Math.sin(i * 0.7)), "suave"]);
}
const conCabeza = (extra = {}) => ({claves: {x: cabeza.x, y: cabeza.y, rotacion: cabeza.rotacion, ...extra}});

// cejas: se levantan en las palabras con enfasis
const enfasis = ["lia", "poligonos", "labios", "escuchas"];
const plano = TEXTO.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tiempoDe = (palabra) => {         // instante aproximado: proporcional a la posicion en el texto
    const k = plano.indexOf(palabra);
    return Math.round(T0 + (L.fin - T0) * k / plano.length);
};
const cejasY = [[0, 0, "suave"]];
for (const p of enfasis) { const t = tiempoDe(p); cejasY.push([t - 150, 0, "suave"], [t + 50, -9, "suave"], [t + 500, 0, "suave"]); }
cejasY.sort((a, b) => a[0] - b[0]);
// la y de las cejas suma el vaiven de la cabeza (misma grilla de 950 ms, interpolada)
const yCabeza = (t) => { const k = Math.min(cabeza.y.length - 2, Math.floor(t / 950)); const a = cabeza.y[k], b = cabeza.y[k + 1]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); };
const cejasClaves = cejasY.map(([t, dy]) => [t, r1(yCabeza(t) + dy), "suave"]);

const opacidadDe = (v) => {
    const k = [[0, v === "cerrada" ? 1 : 0, "mantener"]];
    let actual = "cerrada";
    for (const {t, v: w} of L.cambios) {
        if (w === actual) continue;
        if (w === v) k.push([t, 1, "mantener"]); else if (actual === v) k.push([t, 0, "mantener"]);
        actual = w;
    }
    return k;
};

const objetos = [
    {instancia: "Estudio", nombre: "estudio", en: [0, 0], plano: -3},
    {instancia: "Cabello de Lía (atrás)", nombre: "cabello_atras", en: ORIGEN, plano: -2, ...conCabeza()},
    {instancia: "Torso de Lía", nombre: "torso", en: ORIGEN, plano: -1},
    {instancia: "Rostro de Lía", nombre: "rostro", en: ORIGEN, ...conCabeza()},
    {instancia: "Ojos de Lía", nombre: "ojos", en: ORIGEN, ...conCabeza()},
    {instancia: "Cabello de Lía (adelante)", nombre: "cabello_frente", en: ORIGEN, ...conCabeza()},
    {instancia: "Cejas de Lía", nombre: "cejas", en: ORIGEN, claves: {x: cabeza.x, y: cejasClaves, rotacion: cabeza.rotacion}},
    ...Object.keys(VISEMAS).map((v) => ({instancia: nombreBoca(v), nombre: `boca_${v}`, en: ORIGEN, ...conCabeza({opacidad: opacidadDe(v)})})),
];

const escena = {
    tipo: "escena", nombre: "Lía habla", duracion: DUR, profundidad: false, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Ambiente de estudio", t: 0, volumen: 0.25, bucle: true, fundido: {entrada: 800, salida: 1000}},
        {sonido: "Voz de Lía", t: 0, volumen: 1},
    ],
    camara: {centro: [640, 360], zoom: 1, claves: {zoom: [[0, 1, "suave"], [DUR, 1.07]]}},
    objetos, efectos: [],
};

ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
fs.writeFileSync(path.join(DIR, "voz.json"), JSON.stringify({dur: DUR, fin: L.fin, eventos: L.voz}));
console.log(`assets: ${ASSETS.length}, cambios de boca: ${L.cambios.length}, voz: ${L.voz.length} eventos, duracion ${DUR} ms`);
