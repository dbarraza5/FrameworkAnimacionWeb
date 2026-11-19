// Proyecto "Rostro", escena "Lía 2": la misma Lía de "Lía habla", rehecha con las mejoras de
// calidad del motor (documento/planeacion_calidad.md):
//   - una sola boca que se TRANSFORMA (morphing, claves.forma) entre 9 formas, en vez de 9 assets;
//   - jerarquia: un pivote "Cabeza" en el cuello mueve a la cabeza y a la boca (padre);
//   - piel, cabello, iris, labios y sueter con degradados; sombras, rubor y bokeh desenfocados;
//     luces con mezcla "suma" / "pantalla" y sombras con "multiplicar".
// Escribe asset_NN.json, escena.json y voz.json (linea de tiempo de la voz) en esta carpeta.
//   node herramientas/ejemplos/rostro2/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const TEXTO = "Hola. Me llamo Lía. Mi cara está hecha solo de polígonos, y cada palabra mueve mis labios, un fotograma a la vez. ¿Me escuchas?";
const C = {
    piel: "#e7b896", pielSombra: "#cf9874", pielOsc: "#b88464", pielLuz: "#f7d6bd", rubor: "#e8907f",
    pelo: "#3a2418", peloLuz: "#6a432c", peloOsc: "#1c100a",
    blanco: "#f6f1ea", iris: "#4f7a5a", irisOsc: "#2a4732", irisLuz: "#8fbf8a", pupila: "#140f0f", pestana: "#1d120d", ceja: "#4a2e1f",
    labioSup: "#a94c50", labioInf: "#bf5d60", labioLuz: "#eda0a0", boca: "#3a1218", diente: "#f4efe6", lengua: "#c45d62",
    sueter: "#2f5d62", sueterOsc: "#1a3a3e", sueterLuz: "#3f7a7e", oro: "#e0bb62", luz: "#ffe2bf", frio: "#5b8db0",
};
const r1 = (v) => Math.round(v * 10) / 10;
const R = (x0, y0, x1, y1) => ({rect: [x0, y0, x1, y1]});
const circ = (r, lados = 14) => ({circulo: {r, lados}});
const espejo = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const marcas = {EventoGeneral: "no_lleva"};
const desplaza = (pts, dx, dy) => pts.map(([x, y]) => [r1(x + dx), r1(y + dy)]);
const lineal = (de, a, colores) => ({degradado: {tipo: "lineal", de, a, colores}});
const radial = (centro, radio, colores) => ({degradado: {tipo: "radial", centro, radio, colores}});
// mancha de luz o sombra suave: circulo con degradado radial hasta transparente (sin desenfoque)
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mancha = (r, color, extra = {}) => ({circulo: {r, lados: 20}, ...radial([0, 0], r, [[0, rgba(color, 1)], [0.5, rgba(color, 0.5)], [1, rgba(color, 0)]]), ...extra});

// ------------------------------------------------------------------ linea de tiempo del habla
function labios(texto, t0) {
    const plano = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/¿|¡/g, "");
    const ev = [], voz = [];
    let t = t0, az = 7;
    const variar = () => { az = (az * 16807) % 2147483647; return az / 2147483647; };
    const empuja = (v, d) => { ev.push({t: Math.round(t), v}); voz.push({t: Math.round(t), d: Math.round(d), v}); t += d; };
    for (let i = 0; i < plano.length; i++) {
        const c = plano[i], sig = plano[i + 1] || "";
        if ("aeiou".includes(c)) empuja(c, 120 + variar() * 70 + (",.?".includes(sig) || sig === " " ? 50 : 0));
        else if ("mbp".includes(c)) empuja("m", 75);
        else if ("fv".includes(c)) empuja("f", 80);
        else if (c === "s" || c === "z") { voz.push({t: Math.round(t), d: 70, v: "s"}); t += 70; }
        else if (c === ",") empuja("cerrada", 260);
        else if (c === "." || c === "?") empuja("cerrada", 520);
        else if (c === " ") t += 25;
        else if (c === "h") continue;
        else { voz.push({t: Math.round(t), d: 40, v: "c"}); t += 40; }
    }
    return {cambios: ev.filter((e, i) => i === 0 || e.v !== ev[i - 1].v), voz, fin: Math.round(t)};
}
const T0 = 900;
const L = labios(TEXTO, T0);
const DUR = L.fin + 1600;
L.cambios.push({t: L.fin + 200, v: "sonrisa"});

// cambios de boca -> claves de forma: se mantiene la forma y se pasa a la siguiente en ~80 ms
// (o menos si el tramo es corto), centrado en el instante del cambio
function clavesForma(cambios) {
    const k = [[0, "", "suave"]];
    let antes = "cerrada", t_ant = 0;
    for (const {t, v} of cambios) {
        if (v === antes) continue;
        const tr = Math.max(24, Math.min(80, (t - t_ant) * 0.6));
        const a = Math.round(t - tr / 2), b = Math.round(t + tr / 2);
        if (a > k[k.length - 1][0]) k.push([a, antes === "cerrada" ? "" : antes, "suave"]);
        if (b > k[k.length - 1][0]) k.push([b, v === "cerrada" ? "" : v, "suave"]);
        antes = v; t_ant = t;
    }
    return k;
}

// ------------------------------------------------------------------ fondo y cuerpo
function estudio() {
    const partes = [
        {nombre: "pared", ...R(-100, -100, 1400, 820), ...radial([420, 300], 1000, [[0, "#2a4352"], [0.55, "#18262f"], [1, "#0c1318"]])},
        {nombre: "luz_pared", en: [380, 260], ...mancha(420, "#f0c48a", {mezcla: "suma", opacidad: 0.16})},
    ];
    [[180, 160, 70], [1080, 120, 90], [1150, 520, 60], [120, 560, 80], [960, 330, 40], [320, 330, 30], [1220, 300, 26], [60, 330, 22]].forEach(([x, y, r], i) =>
        partes.push({nombre: `bokeh_${i}`, en: [x, y], ...circ(r, 20), ...radial([0, 0], r, [[0, rgba(i % 3 === 2 ? "#9cc8e8" : "#f3c58a", 0.9)], [0.75, rgba(i % 3 === 2 ? "#9cc8e8" : "#f3c58a", 0.7)], [1, rgba(i % 3 === 2 ? "#9cc8e8" : "#f3c58a", 0)]]), mezcla: "suma",
            claves: {opacidad: [[0, 0.1], [2500 + i * 400, 0.26]]}, bucle: "ida_vuelta"}));
    return {tipo: "asset", nombre: "Estudio (Lía 2)", duracion: 1000, marcas, partes};
}

const torso = () => ({tipo: "asset", nombre: "Torso de Lía 2", marcas, partes: [
    {nombre: "cuello", poligono: [[-58, -230], [58, -230], [64, -90], [-64, -90]], ...lineal([-60, 0], [60, 0], [[0, C.pielOsc], [0.45, C.piel], [1, C.pielSombra]])},
    {nombre: "sombra_menton", en: [0, -200], ...mancha(70, "#7a4a34", {mezcla: "multiplicar", opacidad: 0.6, escala: [1, 0.55]})},
    {nombre: "hombros", poligono: [[-360, 20], [-330, -60], [-210, -108], [-70, -128], [70, -128], [210, -108], [330, -60], [360, 20]],
        ...lineal([-300, -120], [300, 20], [[0, C.sueterLuz], [0.5, C.sueter], [1, C.sueterOsc]]), borde: C.sueterOsc},
    {nombre: "pliegue_1", poligono: [[-210, -60], [-150, -96], [-140, -90], [-200, -52]], color: C.sueterOsc, desenfoque: 4, opacidad: 0.25},
    {nombre: "pliegue_2", poligono: [[200, -40], [140, -90], [130, -84], [190, -32]], color: C.sueterOsc, desenfoque: 4, opacidad: 0.25},
    {nombre: "escote", poligono: [[-66, -128], [66, -128], [0, -40]], ...lineal([0, -128], [0, -40], [[0, C.pielOsc], [1, C.pielSombra]])},
    {nombre: "cuello_sueter", poligono: [[-74, -130], [-60, -132], [0, -50], [60, -132], [74, -130], [0, -34]], color: C.sueterOsc},
    {nombre: "clavicula_izq", poligono: [[-58, -113], [-24, -111], [-24, -108], [-58, -109]], color: C.pielOsc, desenfoque: 1.5, opacidad: 0.6},
    {nombre: "clavicula_der", poligono: [[24, -111], [58, -113], [58, -109], [24, -108]], color: C.pielOsc, desenfoque: 1.5, opacidad: 0.6},
    {nombre: "cadena", poligono: [[-42, -124], [0, -80], [42, -124], [42, -121], [0, -77], [-42, -121]], color: C.oro, opacidad: 0.85},
    {nombre: "dije", en: [0, -76], ...circ(5, 12), ...radial([-2, -2], 6, [[0, "#fff3c4"], [1, C.oro]])},
    {nombre: "dije_brillo", en: [-1, -78], ...mancha(7, "#fff0b0", {mezcla: "suma", opacidad: 0.8})},
]});

// ------------------------------------------------------------------ cabeza (un solo asset)
function ojo(lado) {
    const cx = 62 * lado, cy = -372;
    const almendra = [[-28, 1], [-17, -11], [0, -14], [17, -12], [29, -3], [16, 8], [0, 11], [-15, 8]].map(([x, y]) => [r1(cx + x * lado), r1(cy + y)]);
    const parpadeo = {escala_y: [[0, 0.3], [2950, 0.3], [3030, 1], [3120, 0.3], [5300, 0.3], [5380, 1], [5470, 0.3], [5700, 0.3]]};
    return [
        {nombre: `cuenca_${lado}`, en: [cx, cy - 6], ...mancha(42, "#9a6650", {mezcla: "multiplicar", opacidad: 0.45, escala: [1, 0.55]})},
        {nombre: `blanco_${lado}`, poligono: almendra, ...lineal([0, cy - 14], [0, cy + 11], [[0, "#cdbfb4"], [0.45, C.blanco], [1, "#efe6dc"]])},
        {nombre: `mirada_${lado}`, claves: {x: [[0, 0], [1800, 0], [1900, 5], [3600, 5], [3700, -3], [4800, -3], [4900, 0], [5700, 0]]}, bucle: "repetir", partes: [
            {nombre: `iris_${lado}`, en: [cx, cy], ...circ(13, 20), ...radial([0, 3], 13, [[0, C.irisLuz], [0.55, C.iris], [1, C.irisOsc]]), borde: C.irisOsc},
            {nombre: `pupila_${lado}`, en: [cx, cy], ...circ(5.5, 14), color: C.pupila},
            {nombre: `brillo_${lado}`, en: [cx + 4, cy - 5], ...circ(3, 10), color: "#ffffff"},
            {nombre: `brillo2_${lado}`, en: [cx - 4, cy + 5], ...circ(1.6, 8), color: "#ffffff", opacidad: 0.7},
        ]},
        {nombre: `sombra_parpado_${lado}`, poligono: desplaza([[-28, -2], [0, -13], [28, -5], [28, 0], [0, -8], [-28, 3]].map(([x, y]) => [x * lado, y]), cx, cy),
            color: "#6b4636", desenfoque: 3, mezcla: "multiplicar", opacidad: 0.45},
        {nombre: `pestana_inf_${lado}`, poligono: desplaza([[-24, 7], [0, 11.5], [16, 8.5], [16, 10], [0, 13], [-24, 8.5]].map(([x, y]) => [x * lado, y]), cx, cy), color: C.pielOsc, opacidad: 0.7},
        {nombre: `parpado_${lado}`, pivote: [cx, cy - 18], claves: parpadeo, bucle: "repetir", partes: [
            {nombre: `piel_parpado_${lado}`, ...R(cx - 33, cy - 18, cx + 33, cy + 15), ...lineal([0, cy - 18], [0, cy + 15], lado < 0 ? [[0, "#f3cfb3"], [1, "#e3b293"]] : [[0, "#eec5a7"], [1, "#d9a585"]])},
            {nombre: `pestanas_${lado}`, poligono: desplaza([[-30, 12], [0, 14], [26, 11], [38, 4], [31, 13], [0, 17.5], [-30, 15]].map(([x, y]) => [x * lado, y]), cx, cy), color: C.pestana},
        ]},
    ];
}

function cabeza(tiempoDe) {
    const media = [[0, -566], [70, -558], [120, -526], [148, -466], [156, -392], [151, -330], [139, -270], [116, -214], [82, -174], [42, -151], [0, -145]];
    const cara = [...espejo(media.slice(1)), ...media.slice(0, -1)];
    const lado = (s) => [[148 * s, -466], [156 * s, -392], [151 * s, -330], [139 * s, -270], [116 * s, -214], [82 * s, -174], [64 * s, -186], [100 * s, -232], [120 * s, -300], [128 * s, -380], [124 * s, -450]];
    const ceja = (s) => desplaza([[-36, 7], [-22, -4], [0, -9], [20, -7], [34, 1], [20, 0], [0, -2], [-22, 3]].map(([x, y]) => [x * s, y]), 62 * s, -414);
    // cejas: se levantan en las palabras con enfasis
    const cejasY = [[0, 0, "suave"]];
    for (const p of ["lia", "poligonos", "labios", "escuchas"]) { const t = tiempoDe(p); cejasY.push([t - 150, 0, "suave"], [t + 50, -9, "suave"], [t + 500, 0, "suave"]); }
    cejasY.sort((a, b) => a[0] - b[0]);
    const piel = radial([-55, -430], 300, [[0, C.pielLuz], [0.45, C.piel], [1, C.pielSombra]]);
    return {tipo: "asset", nombre: "Cabeza de Lía 2", duracion: DUR, marcas, partes: [
        // cabello de atras (se mece apenas)
        {nombre: "melena", pivote: [0, -560], claves: {rotacion: [[0, -0.8], [2600, 0.8]]}, bucle: "ida_vuelta", partes: [
            {nombre: "masa", poligono: [[-200, -480], [-192, -580], [-122, -642], [0, -662], [122, -642], [192, -580], [206, -460], [212, -300], [226, -170],
                [190, -138], [150, -170], [110, -240], [-110, -240], [-150, -170], [-192, -138], [-228, -170], [-214, -300]],
                ...lineal([0, -660], [0, -140], [[0, C.pelo], [0.6, C.peloOsc], [1, "#120a06"]])},
            {nombre: "puntas_izq", poligono: [[-228, -170], [-212, -150], [-190, -138], [-160, -165], [-170, -200], [-214, -205]], color: C.pelo},
            {nombre: "puntas_der", poligono: [[226, -170], [212, -150], [190, -138], [160, -165], [170, -200], [214, -205]], color: C.pelo},
        ]},
        {nombre: "oreja_izq", en: [-152, -352], elipse: [19, 36], ...radial([4, -6], 34, [[0, C.piel], [1, C.pielOsc]])},
        {nombre: "oreja_der", en: [152, -352], elipse: [19, 36], ...radial([-4, -6], 34, [[0, C.pielSombra], [1, C.pielOsc]])},
        {nombre: "oreja_izq_in", en: [-150, -352], elipse: [9, 22], color: "#8f5a44", desenfoque: 3, opacidad: 0.6},
        {nombre: "oreja_der_in", en: [150, -352], elipse: [9, 22], color: "#8f5a44", desenfoque: 3, opacidad: 0.6},
        {nombre: "cara", poligono: cara, ...piel},
        // modelado de luz: sombras suaves (multiplicar) y brillos (pantalla / suma)
        {nombre: "sombra_der", poligono: lado(1), color: "#b07a5c", desenfoque: 12, mezcla: "multiplicar", opacidad: 0.5},
        {nombre: "sombra_izq", poligono: lado(-1), color: "#c08a6a", desenfoque: 12, mezcla: "multiplicar", opacidad: 0.25},
        {nombre: "sombra_menton", en: [0, -166], ...mancha(58, "#a06a50", {mezcla: "multiplicar", opacidad: 0.5, escala: [1, 0.35]})},
        {nombre: "sombra_sien_izq", en: [-112, -470], ...mancha(48, "#a87252", {mezcla: "multiplicar", opacidad: 0.35, escala: [0.7, 1]})},
        {nombre: "sombra_sien_der", en: [112, -470], ...mancha(48, "#a87252", {mezcla: "multiplicar", opacidad: 0.45, escala: [0.7, 1]})},
        {nombre: "luz_frente", en: [-30, -500], ...mancha(80, C.luz, {mezcla: "pantalla", opacidad: 0.4, escala: [1, 0.5]})},
        {nombre: "luz_pomulo", en: [-80, -340], ...mancha(44, C.luz, {mezcla: "pantalla", opacidad: 0.35, escala: [1, 0.6]})},
        {nombre: "luz_borde", poligono: [[148, -466], [156, -392], [151, -330], [139, -270], [116, -214], [110, -218], [136, -280], [148, -340], [152, -400], [144, -460]],
            color: C.frio, desenfoque: 5, mezcla: "suma", opacidad: 0.3},
        {nombre: "rubor_izq", en: [-84, -296], ...mancha(44, C.rubor, {opacidad: 0.5, escala: [1, 0.55]})},
        {nombre: "rubor_der", en: [84, -296], ...mancha(44, C.rubor, {opacidad: 0.45, escala: [1, 0.55]})},
        // nariz
        {nombre: "nariz_sombra", poligono: [[-14, -400], [-6, -400], [-7, -316], [-20, -300], [-26, -306]], color: "#a26e52", desenfoque: 6, mezcla: "multiplicar", opacidad: 0.35},
        {nombre: "nariz_punta", en: [0, -293], elipse: [19, 12], ...radial([-4, -4], 20, [[0, "#f0bfa0"], [1, "#d39a7a"]])},
        {nombre: "nariz_luz", en: [-2, -312], ...mancha(12, "#fff0e0", {mezcla: "pantalla", opacidad: 0.7, escala: [0.4, 1]})},
        {nombre: "fosa_izq", en: [-9, -287], elipse: [5.5, 3], color: "#7a4234", desenfoque: 1},
        {nombre: "fosa_der", en: [9, -287], elipse: [5.5, 3], color: "#7a4234", desenfoque: 1},
        {nombre: "filtrum", poligono: [[-6, -282], [6, -282], [8, -262], [-8, -262]], color: "#b07a5c", desenfoque: 3, mezcla: "multiplicar", opacidad: 0.35},
        ...ojo(-1), ...ojo(1),
        {nombre: "cejas", claves: {y: cejasY}, partes: [
            {nombre: "ceja_izq", poligono: ceja(-1), ...lineal([-100, 0], [-26, 0], [[0, C.ceja], [1, "#5e3c29"]])},
            {nombre: "ceja_der", poligono: ceja(1), ...lineal([26, 0], [100, 0], [[0, "#5e3c29"], [1, C.ceja]])},
        ]},
        // cabello de adelante
        {nombre: "mechon_izq", poligono: [[-162, -480], [-146, -400], [-148, -300], [-160, -220], [-176, -186], [-186, -260], [-186, -400], [-178, -470]], ...lineal([0, -480], [0, -186], [[0, C.peloLuz], [1, C.peloOsc]])},
        {nombre: "mechon_der", poligono: [[162, -470], [176, -460], [188, -400], [190, -280], [180, -196], [166, -230], [152, -320], [150, -420]], ...lineal([0, -470], [0, -196], [[0, C.pelo], [1, C.peloOsc]])},
        {nombre: "sombra_flequillo", en: [-10, -486], ...mancha(130, "#8a5a40", {mezcla: "multiplicar", opacidad: 0.5, escala: [1, 0.2]})},
        {nombre: "flequillo", pivote: [0, -600], claves: {rotacion: [[0, -0.6], [2200, 0.8]]}, bucle: "ida_vuelta", partes: [
            {nombre: "flequillo_masa", poligono: [[-170, -470], [-160, -560], [-96, -612], [10, -622], [110, -600], [164, -540], [170, -440], [150, -478], [118, -526],
                [60, -540], [0, -520], [-60, -486], [-112, -452], [-150, -430]], ...lineal([-120, -620], [80, -460], [[0, C.peloLuz], [0.45, C.pelo], [1, C.peloOsc]])},
            {nombre: "brillo_pelo_1", poligono: [[-136, -556], [-100, -584], [-50, -604], [-44, -600], [-96, -578], [-130, -550]], color: "#7a4a30", desenfoque: 4, mezcla: "suma", opacidad: 0.4},
            {nombre: "brillo_pelo_2", poligono: [[30, -606], [70, -600], [104, -586], [100, -582], [68, -594], [28, -601]], color: "#7a4a30", desenfoque: 4, mezcla: "suma", opacidad: 0.35},
        ]},
        {nombre: "arete_izq", pivote: [-156, -322], claves: {rotacion: [[0, -6], [1400, 6]]}, bucle: "ida_vuelta", partes: [
            {nombre: "arete_izq_aro", en: [-156, -318], ...circ(4, 10), color: C.oro},
            {nombre: "arete_izq_gota", en: [-156, -304], elipse: [4, 7], ...radial([-1, -2], 7, [[0, "#fff3c4"], [1, C.oro]])},
            {nombre: "arete_izq_brillo", en: [-157, -306], ...circ(3, 8), color: "#fff0b0", desenfoque: 3, mezcla: "suma", opacidad: 0.7}]},
        {nombre: "arete_der", pivote: [156, -322], claves: {rotacion: [[0, 6], [1400, -6]]}, bucle: "ida_vuelta", partes: [
            {nombre: "arete_der_aro", en: [156, -318], ...circ(4, 10), color: C.oro},
            {nombre: "arete_der_gota", en: [156, -304], elipse: [4, 7], ...radial([-1, -2], 7, [[0, "#fff3c4"], [1, C.oro]])}]},
    ]};
}

// ------------------------------------------------------------------ boca con morphing
// Cada parte tiene SIEMPRE la misma cantidad de puntos en todos los visemas (si no, no se
// puede interpolar): lo que "no esta" en un visema queda con alto 0.
const BOCA_Y = -236;
const N = 16;
function formaBoca({w, h = 0, s = 0, k = 1, redondo = false, f = false}) {
    const xs = Array.from({length: N + 1}, (_, i) => -w + 2 * w * i / N), rev = [...xs].reverse();
    const xd = Array.from({length: 9}, (_, i) => -0.75 * w + 1.5 * w * i / 8), xdr = [...xd].reverse();
    const borde = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), redondo ? 0.5 : 0.75);
    const grosor = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), 0.6);
    const sube = (x) => -s * (x / w) ** 2;
    const arco = (x) => 3 * Math.exp(-(((Math.abs(x) - w * 0.24) / (w * 0.14)) ** 2));
    const supIn = (x) => -h / 2 * borde(x) + sube(x), infIn = (x) => h / 2 * borde(x) + sube(x);
    const supOut = (x) => supIn(x) - (9 * k * grosor(x) + 1.5) - arco(x) + 2 * Math.exp(-((x / (w * 0.08)) ** 2));
    const infOut = (x) => infIn(x) + (13 * k * grosor(x) + 1.5);
    const P = (fx, lista = xs) => lista.map((x) => [r1(x), r1(fx(x) + BOCA_Y)]);
    const elipse = (cx, cy, rx, ry, n) => Array.from({length: n}, (_, i) => [r1(cx + rx * Math.cos(i / n * 2 * Math.PI)), r1(cy + ry * Math.sin(i / n * 2 * Math.PI) + BOCA_Y)]);
    const altoSup = f ? 6 : Math.max(0, Math.min(8, h - 1));                    // dientes de arriba
    const altoInf = Math.max(0, Math.min(5, h - 13));                           // dientes de abajo
    const lengua = Math.max(0, Math.min(1, (h - 8) / 10));
    return {
        interior: [...P(supIn), ...P(infIn, rev)],
        lengua: elipse(0, h / 2 * 0.62, w * 0.45 * lengua, h * 0.22 * lengua, 14),
        dientes_inf: [...P((x) => infIn(x) - altoInf, xd), ...P(infIn, xdr)],
        labio_inf: [...P(infIn), ...P(infOut, rev)],
        labio_inf_luz: elipse(-w * 0.08, infIn(0) + 7 * k, w * 0.32, 2.6 * k, 12),
        dientes: [...P(supIn, xd), ...P((x) => supIn(x) + altoSup, xdr)],
        labio_sup: [...P(supOut), ...P(supIn, rev)],
        comisura_izq: elipse(-w - 1, sube(w), 2.4, 2, 8),
        comisura_der: elipse(w + 1, sube(w), 2.4, 2, 8),
    };
}
const VISEMAS = {
    cerrada: {w: 36}, sonrisa: {w: 42, s: 6}, m: {w: 34, k: 0.7}, f: {w: 36, h: 4, f: true},
    a: {w: 32, h: 26}, e: {w: 38, h: 12}, i: {w: 40, h: 7, s: 3}, o: {w: 24, h: 22, redondo: true}, u: {w: 18, h: 12, redondo: true, k: 1.2},
};
function boca(claves_forma) {
    const formas = Object.fromEntries(Object.entries(VISEMAS).map(([v, p]) => [v, formaBoca(p)]));
    const estilo = {
        interior: {color: C.boca, borde: C.boca},
        lengua: {color: C.lengua},
        dientes_inf: {color: "#e4ddd2", opacidad: 0.9},
        labio_inf: {...lineal([0, BOCA_Y - 4], [0, BOCA_Y + 16], [[0, "#9c4248"], [0.4, C.labioInf], [1, "#a94c50"]]), borde: "#a94c50"},
        labio_inf_luz: {color: C.labioLuz, desenfoque: 2.5, mezcla: "pantalla", opacidad: 0.6},
        dientes: {...lineal([0, BOCA_Y - 10], [0, BOCA_Y + 4], [[0, "#cfc4b6"], [1, "#ebe4d8"]]), borde: "#ddd4c8"},
        labio_sup: {...lineal([0, BOCA_Y - 14], [0, BOCA_Y], [[0, "#b8585b"], [1, "#8e3a40"]]), borde: "#8e3a40"},
        comisura_izq: {color: "#8a5040", desenfoque: 2, opacidad: 0.7},
        comisura_der: {color: "#8a5040", desenfoque: 2, opacidad: 0.7},
    };
    const partes = Object.keys(formas.cerrada).map((p) => ({
        nombre: p, poligono: formas.cerrada[p], ...estilo[p],
        formas: Object.fromEntries(Object.keys(VISEMAS).filter((v) => v !== "cerrada").map((v) => [v, {poligono: formas[v][p]}])),
        claves: {forma: claves_forma},
    }));
    partes.push({nombre: "sombra_labio", en: [0, BOCA_Y + 20], elipse: [30, 7], color: "#a06a50", desenfoque: 6, mezcla: "multiplicar", opacidad: 0.45});
    return {tipo: "asset", nombre: "Boca de Lía 2", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ escena
const plano = TEXTO.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tiempoDe = (palabra) => Math.round(T0 + (L.fin - T0) * plano.indexOf(palabra) / plano.length);
const ASSETS = [estudio(), torso(), cabeza(tiempoDe), boca(clavesForma(L.cambios))];

// la cabeza gira desde el cuello: el pivote "Cabeza" esta en la nuca y sus hijos se dibujan
// 200 px mas abajo (el origen de los assets es la base del torso)
const ORIGEN = [640, 740], CUELLO = 200, NUCA = [ORIGEN[0], ORIGEN[1] - CUELLO];
const cab = {x: [], y: [], rotacion: []};
for (let t = 0, i = 0; t <= DUR; t += 950, i++) {
    cab.x.push([t, r1(NUCA[0] + 6 * Math.sin(i * 1.3)), "suave"]);
    cab.y.push([t, r1(NUCA[1] + 3 * Math.sin(i * 0.9 + 1)), "suave"]);
    cab.rotacion.push([t, r1(2.6 * Math.sin(i * 0.7)), "suave"]);
}
// asentir un poco al terminar cada frase
for (const p of ["lia.", "vez.", "escuchas"]) {
    const t = tiempoDe(p) + 250;
    const k = cab.rotacion.findIndex((c) => c[0] > t);
    if (k > 0) cab.y.splice(k, 0, [t, r1(NUCA[1] + 6), "suave"]);
}
cab.y.sort((a, b) => a[0] - b[0]);
for (let i = 1; i < cab.y.length; i++) if (cab.y[i][0] === cab.y[i - 1][0]) cab.y.splice(i--, 1);

const objetos = [
    {instancia: "Estudio (Lía 2)", nombre: "estudio", en: [0, 0], plano: -3},
    {instancia: "Torso de Lía 2", nombre: "torso", en: ORIGEN, plano: -1, claves: {escala_y: [[0, 1, "suave"], [2100, 1.008, "suave"]]}, repetir: "ida_vuelta"},
    {nombre: "Cabeza", en: NUCA, partes: [], claves: cab},
    {instancia: "Cabeza de Lía 2", nombre: "cabeza", padre: "Cabeza", en: [0, CUELLO], bucle: false},
    {instancia: "Boca de Lía 2", nombre: "boca", padre: "Cabeza", en: [0, CUELLO], bucle: false},
];

const escena = {
    tipo: "escena", precision: "decimal", nombre: "Lía 2", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Ambiente de estudio", t: 0, volumen: 0.25, bucle: true, fundido: {entrada: 800, salida: 1000}},
        {sonido: "Voz de Lía 2", t: 0, volumen: 1},
    ],
    camara: {centro: [640, 360], zoom: 1, claves: {zoom: [[0, 1, "suave"], [DUR, 1.08]], y: [[0, 360, "suave"], [DUR, 340]]}},
    objetos, efectos: [],
};

ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
fs.writeFileSync(path.join(DIR, "voz.json"), JSON.stringify({dur: DUR, fin: L.fin, eventos: L.voz}));
console.log(`assets: ${ASSETS.length}, cambios de boca: ${L.cambios.length}, claves de forma: ${clavesForma(L.cambios).length}, duracion ${DUR} ms`);
