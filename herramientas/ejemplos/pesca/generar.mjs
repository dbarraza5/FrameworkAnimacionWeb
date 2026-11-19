// Fase 9 de planeacion_capacidades.md: PESCA EN EL MAR.
// Un hombre pesca desde un bote. Todo el movimiento sale de FUNCIONES del tiempo, muestreadas en
// claves, para que encaje entre si:
//   - las olas (3 capas senoidales que avanzan en bucle) y el bote, que sube/baja y se inclina con
//     la altura y la pendiente de la MISMA ola donde esta;
//   - la cana (3 tramos que se curvan), las manos (IK: los objetivos son los punos de la cana);
//   - el sedal: un trazo de la punta de la cana al corcho / pez, con posicion, rotacion y largo
//     calculados cada 50 ms a partir de la pose del bote y de la cana.
// Historia: el corcho flota, el pez mordisquea, lo hunde, pelea bajo el agua, salta y al final
// cuelga del sedal coleteando.
//   node herramientas/ejemplos/pesca/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const rad = (g) => g * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
const suave = (u) => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
const tramo = (t, a, b) => suave((t - a) / (b - a));
let semilla = 3;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };

const DUR = 14500, PASO = 50;
const T = {pica1: 4700, pica2: 5150, tira: 6200, salta: 9500, cae: 10300, sale: 11300, alza: 12600};
const AGUA_Y = 520, BX = 500, ESC = 1.45, BOB_X = 900;
// capas de olas: [y base, amplitud, largo de onda, periodo (ms)]
const OLAS = {fondo: [430, 2.5, 120, 2300], medio: [470, 4.5, 190, 2700], frente: [AGUA_Y, 7, 260, 3200]};
const ola = (capa, x, t) => { const [y, A, L, P] = OLAS[capa]; const s = L * ((t % P) / P); return y + A * Math.sin(2 * Math.PI * (x - s) / L); };
const pendiente = (capa, x, t) => { const [, A, L, P] = OLAS[capa]; const s = L * ((t % P) / P); return A * 2 * Math.PI / L * Math.cos(2 * Math.PI * (x - s) / L); };

// ------------------------------------------------------------------ guion como funciones del tiempo
const boteY = (t) => ola("frente", BX, t);
const boteRot = (t) => deg(Math.atan(pendiente("frente", BX, t))) * 0.8;
// cana: r1 = giro de la cana entera; b = curva (los tramos 2 y 3 giran b y 1.4 b)
function canaR1(t) {
    if (t < T.tira) return 0;
    if (t < T.tira + 250) return -22 * tramo(t, T.tira, T.tira + 250);
    if (t < T.salta) return -22 + 6 * Math.sin(2 * Math.PI * (t - T.tira) / 900);
    if (t < T.cae) return -22 - 6 * tramo(t, T.salta, T.salta + 300);
    if (t < T.sale) return -28 + 8 * tramo(t, T.cae, T.sale);
    if (t < T.alza) return -20 + 5 * tramo(t, T.sale, T.sale + 600);
    return -15 - 22 * tramo(t, T.alza, T.alza + 700);
}
function canaB(t) {
    const pica = (c) => 4 * Math.exp(-(((t - c) / 90) ** 2));
    if (t < T.tira) return 2 + pica(T.pica1) + pica(T.pica2);
    if (t < T.salta) return 2 + 10 * tramo(t, T.tira, T.tira + 200) + 6 * Math.sin(2 * Math.PI * (t - T.tira) / 700 + 1);
    if (t < T.cae) return 5;
    if (t < T.sale) return 12 + 4 * Math.sin(2 * Math.PI * (t - T.cae) / 600);
    return 7 + 2 * Math.sin(2 * Math.PI * (t - T.sale) / 380) * Math.exp(-(t - T.sale) / 2500);
}
const torsoRot = (t) => (t < T.tira ? 0 : t < T.salta ? -9 * tramo(t, T.tira, T.tira + 300) - 2 * Math.sin(2 * Math.PI * (t - T.tira) / 900)
    : t < T.alza ? -9 + 5 * tramo(t, T.sale, T.sale + 800) : -4 - 8 * tramo(t, T.alza, T.alza + 700));

// geometria de la cana (coordenadas del bote; el origen del bote es el centro en la linea de agua)
const H = [22, -52], TH0 = -40, LC = [72, 66, 56];
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
function canaLocal(t) {
    const a1 = TH0 + canaR1(t), b = canaB(t);
    const J1 = [H[0] + LC[0] * dir(a1)[0], H[1] + LC[0] * dir(a1)[1]];
    const a2 = a1 + b, J2 = [J1[0] + LC[1] * dir(a2)[0], J1[1] + LC[1] * dir(a2)[1]];
    const a3 = a2 + 1.4 * b, P = [J2[0] + LC[2] * dir(a3)[0], J2[1] + LC[2] * dir(a3)[1]];
    return {a1, J1, J2, P};
}
function aMundo(p, t) {          // punto del bote -> escena
    const r = rad(boteRot(t)), c = Math.cos(r), s = Math.sin(r);
    return [BX + ESC * (p[0] * c - p[1] * s), boteY(t) + ESC * (p[0] * s + p[1] * c)];
}
const punta = (t) => aMundo(canaLocal(t).P, t);
// el otro extremo del sedal
function extremo(t) {
    const pica = (c) => 7 * Math.exp(-(((t - c) / 80) ** 2));
    if (t < T.tira) return [BOB_X, ola("frente", BOB_X, t) - 4 + pica(T.pica1) + pica(T.pica2)];
    if (t < T.salta) {                                  // pelea bajo el agua, se acerca
        const u = (t - T.tira) / (T.salta - T.tira);
        return [BOB_X - 90 * u + 40 * Math.sin(2 * Math.PI * (t - T.tira) / 1300), AGUA_Y + 26 * tramo(t, T.tira, T.tira + 300) + 6 * Math.sin(t / 300)];
    }
    if (t < T.cae) {                                    // salto: parabola fuera del agua
        const u = (t - T.salta) / (T.cae - T.salta), x0 = BOB_X - 90, x1 = BOB_X - 170;
        return [x0 + (x1 - x0) * u, AGUA_Y + 20 - 150 * 4 * u * (1 - u) - 20 * u];
    }
    if (t < T.sale) {                                   // otra vez abajo, viene hacia el bote
        const u = tramo(t, T.cae, T.sale), x1 = BOB_X - 170, p = punta(t);
        return [x1 + (p[0] + 6 - x1) * u, AGUA_Y + 24];
    }
    const p = punta(t), largo = 150 - 85 * tramo(t, T.sale, T.alza + 500);   // cuelga y lo va subiendo
    return [p[0] + 4 * Math.sin((t - T.sale) / 260), p[1] + largo];
}

// muestreo -> claves
const muestras = (f, t0 = 0, t1 = DUR) => { const k = []; for (let t = t0; t <= t1; t += PASO) k.push([t, r1(f(t)), "lineal"]); return k; };

// ------------------------------------------------------------------ bote con el pescador (asset)
function bote() {
    const grip = (d) => (t) => { const a1 = TH0 + canaR1(t); return [H[0] + d * dir(a1)[0], H[1] + d * dir(a1)[1]]; };
    const g1 = grip(4), g2 = grip(22);
    const brazo = (n, objetivo, color, capa) => ({nombre: `brazo_${n}`, capa, poligono: [[-9, -80], [1, -82], [10, -58], [2, -55]], color, pivote: [-4, -78],
        ik: {hasta: `antebrazo_${n}`, punta: [20, -48], objetivo, doblez: 1},
        partes: [{nombre: `antebrazo_${n}`, poligono: [[2, -60], [10, -58], [22, -50], [18, -45]], color, pivote: [6, -57],
            partes: [{nombre: `mano_${n}`, en: [20, -48], circulo: {r: 4.5, lados: 10}, color: "#e0b090"}]}]});
    return {tipo: "asset", nombre: "Bote con pescador", duracion: DUR, marcas, partes: [
        {nombre: "remo", capa: 0, poligono: [[-70, -22], [-130, 8], [-150, 10], [-152, 4], [-132, 2], [-72, -26]], color: "#8a6a44"},
        {nombre: "casco_interior", capa: 1, poligono: [[-92, -16], [96, -22], [90, -12], [-90, -8]], color: "#4a3020"},
        {nombre: "brazo_atras_g", capa: 2, partes: [brazo("atras", "obj_mano_atras", "#2a4a6a", 0)]},
        {nombre: "torso", capa: 3, pivote: [-10, -28], claves: {rotacion: muestras(torsoRot)}, partes: [
            {nombre: "piernas", poligono: [[-16, -30], [24, -30], [34, -20], [30, -14], [-14, -18]], color: "#3a3a2a"},
            {nombre: "chaqueta", poligono: [[-24, -26], [4, -26], [8, -80], [-2, -88], [-18, -88], [-26, -78]], degradado: lineal([-26, 0], [8, 0], [[0, "#c03a28"], [1, "#e86040"]])},
            {nombre: "cabeza", pivote: [-8, -90], claves: {rotacion: muestras((t) => (t < T.tira ? 0 : t < T.sale ? 6 : t < T.alza ? 14 : 4 - 10 * tramo(t, T.alza, T.alza + 600)))}, partes: [
                {nombre: "cara", en: [-6, -102], circulo: {r: 12, lados: 18}, degradado: radial([3, -3], 14, [[0, "#f0c8a0"], [1, "#b8845c"]])},
                {nombre: "barba", poligono: [[-16, -100], [2, -98], [8, -94], [2, -88], [-10, -88], [-16, -94]], color: "#8a8a8a"},
                {nombre: "gorro", poligono: [[-20, -106], [-18, -118], [-6, -122], [6, -118], [8, -108], [16, -106], [16, -104], [-20, -104]], color: "#2a4a6a"},
                {nombre: "ojo", en: [2, -104], circulo: {r: 1.4, lados: 6}, color: "#1a1410"},
                {nombre: "sonrisa", poligono: [[0, -95], [6, -96], [4, -93]], color: "#6a3a2a", opacidad: 0, claves: {opacidad: [[0, 0], [T.alza + 300, 0], [T.alza + 700, 1]]}},
            ]},
        ]},
        // la cana: 3 tramos que se curvan (rotacion de cada tramo muestreada del guion)
        {nombre: "cana_1", capa: 4, poligono: [[H[0], H[1] - 1.8], [H[0] + LC[0], H[1] - 1.4], [H[0] + LC[0], H[1] + 1.4], [H[0], H[1] + 1.8]].map(([x, y]) => [r1(x), r1(y)]),
            color: "#3a2a1a", pivote: H, claves: {rotacion: muestras((t) => canaR1(t) + TH0)}, partes: [
                {nombre: "mango", rect: [H[0] - 2, H[1] - 3, H[0] + 26, H[1] + 3], color: "#1a1410"},
                {nombre: "carrete", en: [H[0] + 14, H[1] + 6], circulo: {r: 5, lados: 12}, color: "#8a8a90"},
                {nombre: "cana_2", poligono: [[H[0] + LC[0], H[1] - 1.4], [H[0] + LC[0] + LC[1], H[1] - 1], [H[0] + LC[0] + LC[1], H[1] + 1], [H[0] + LC[0], H[1] + 1.4]].map(([x, y]) => [r1(x), r1(y)]),
                    color: "#5a4028", pivote: [H[0] + LC[0], H[1]], claves: {rotacion: muestras((t) => canaB(t))}, partes: [
                        {nombre: "cana_3", poligono: [[H[0] + LC[0] + LC[1], H[1] - 1], [H[0] + LC[0] + LC[1] + LC[2], H[1] - 0.5], [H[0] + LC[0] + LC[1] + LC[2], H[1] + 0.5], [H[0] + LC[0] + LC[1], H[1] + 1]].map(([x, y]) => [r1(x), r1(y)]),
                            color: "#7a5a38", pivote: [H[0] + LC[0] + LC[1], H[1]], claves: {rotacion: muestras((t) => 1.4 * canaB(t))}}]}]},
        {nombre: "brazo_frente_g", capa: 5, partes: [brazo("frente", "obj_mano_frente", "#c03a28", 0)]},
        {nombre: "casco", capa: 6, poligono: [[-100, -18], [104, -26], [96, -8], [74, 14], [-82, 14], [-102, -4]],
            degradado: lineal([0, -26], [0, 14], [[0, "#d8d0c0"], [0.25, "#3a6a8a"], [1, "#1e3a4e"]]), borde: "#1a2a36"},
        {nombre: "franja", capa: 7, poligono: [[-100, -14], [103, -22], [102, -19], [-100, -11]], color: "#f0e8d8"},
        {nombre: "obj_mano_atras", partes: [], claves: {x: muestras((t) => g1(t)[0]), y: muestras((t) => g1(t)[1])}},
        {nombre: "obj_mano_frente", partes: [], claves: {x: muestras((t) => g2(t)[0]), y: muestras((t) => g2(t)[1])}},
    ]};
}

// gaviota: dos alas que aletean (morphing arriba / abajo)
function gaviota() {
    const ala = (s) => ({arriba: [[0, 0], [s * 14, -14], [s * 30, -18], [s * 18, -6]], abajo: [[0, 0], [s * 14, 4], [s * 30, 12], [s * 16, 4]]});
    const parte = (n, s) => ({nombre: n, poligono: ala(s).arriba, color: "#f4f4f0", borde: "#8a8a8a",
        formas: {abajo: {poligono: ala(s).abajo}}, claves: {forma: [[0, ""], [260, "abajo", "suave"], [520, "", "suave"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Gaviota", duracion: 1000, marcas, partes: [
        parte("ala_i", -1), {nombre: "cuerpo_g", en: [2, 0], elipse: [10, 4], color: "#ffffff", borde: "#9a9a9a"},
        {nombre: "pico", poligono: [[11, -1], [17, 0], [11, 1]], color: "#e0a020"}, parte("ala_d", 1)]};
}
const ASSETS = [bote(), gaviota()];

// ------------------------------------------------------------------ escena
const capaOlas = (capa, plano, colores, extra = {}) => {
    const [y, A, L, P] = OLAS[capa], pts = [];
    for (let x = -400 - L; x <= 1800; x += L / 12) pts.push([r1(x), r1(y + A * Math.sin(2 * Math.PI * x / L))]);
    return {nombre: `mar_${capa}`, en: [0, 0], plano, poligono: [...pts, [1800, 900], [-400 - L, 900]],
        degradado: lineal([0, y - A], [0, 900], colores), claves: {x: [[0, 0], [P, L, "lineal"]]}, repetir: "repetir", ...extra};
};
const salpicadura = (n, [x, y], t) => [
    {tipo: "particulas", nombre: `salpica_${n}`, en: [r1(x), r1(y)], inicio: t, fin: t + 140, tasa: 260, vida: 750, velocidad: 230, angulo: -90, dispersion: 70, gravedad: 900,
        tam_ini: 6, tam_fin: 2, color_ini: "#ffffff", color_fin: "#a8d0e8", suave: "si", opacidad: 0.9, sonido: "no_lleva"},
];
const onda = (n, [x, y], t, r = 50) => ({nombre: `onda_${n}`, en: [r1(x), r1(y + 3)], plano: 1, escala: [0.1, 0.03],
    poligono: [...Array.from({length: 20}, (_, i) => [r1(r * Math.cos(i / 20 * 2 * Math.PI)), r1(r * Math.sin(i / 20 * 2 * Math.PI))]),
        ...Array.from({length: 20}, (_, i) => [r1(r * 0.86 * Math.cos(-i / 20 * 2 * Math.PI)), r1(r * 0.86 * Math.sin(-i / 20 * 2 * Math.PI))])],
    color: "#e8f4ff", claves: {escala_x: [[0, 0.1], [t, 0.1], [t + 1200, 1.4, "salir"]], escala_y: [[0, 0.03], [t, 0.03], [t + 1200, 0.3, "salir"]], opacidad: [[0, 0], [t - 1, 0], [t, 0.8], [t + 1200, 0]]}, sonido: "no_lleva"});
const E = (t) => extremo(t);
const sedal = () => {
    const L0 = 100, dx = (t) => E(t)[0] - punta(t)[0], dy = (t) => E(t)[1] - punta(t)[1];
    return {nombre: "sedal", en: punta(0).map(r1), plano: 0, rect: [-0.6, 0, 0.6, L0], color: "#e8e8e0", opacidad: 0.85,
        claves: {x: muestras((t) => punta(t)[0]), y: muestras((t) => punta(t)[1]),
            rotacion: muestras((t) => deg(Math.atan2(dy(t), dx(t))) - 90), escala_y: muestras((t) => Math.hypot(dx(t), dy(t)) / L0)}};
};
const pez = () => {
    const rotPez = (t) => {
        if (t < T.cae) { const a = E(t), b = E(t + PASO); return deg(Math.atan2(b[1] - a[1], b[0] - a[0])) + 180; }   // la cola atras del avance
        return -90 + 28 * Math.sin((t - T.sale) / 110) * Math.exp(-(t - T.sale) / 2600);
    };
    return {nombre: "pez", en: E(0).map(r1), plano: 0, partes: [
        {nombre: "pez_cuerpo", poligono: [[0, 0], [-8, -7], [-22, -9], [-36, -6], [-44, 0], [-36, 6], [-22, 9], [-8, 7]], degradado: lineal([0, -9], [0, 9], [[0, "#5a7a8a"], [0.5, "#c8d8e0"], [1, "#f0f4f4"]])},
        {nombre: "pez_cola", poligono: [[-42, 0], [-56, -10], [-52, 0], [-56, 10]], color: "#5a7a8a"},
        {nombre: "pez_aleta", poligono: [[-18, -8], [-26, -15], [-30, -8]], color: "#5a7a8a"},
        {nombre: "pez_ojo", en: [-6, -2], circulo: {r: 1.6, lados: 8}, color: "#101010"},
    ], claves: {x: muestras((t) => E(t)[0], T.salta - 100), y: muestras((t) => E(t)[1], T.salta - 100), rotacion: muestras(rotPez, T.salta - 100),
        opacidad: [[0, 0, "mantener"], [T.salta - 50, 1, "mantener"], [T.cae + 60, 0, "mantener"], [T.sale - 80, 1, "mantener"]]}, sonido: "no_lleva"};
};
const destellos = Array.from({length: 46}, (_, i) => {
    const x = 760 + azar() * 460, y = 440 + azar() * 110, w = 4 + azar() * 10, f = Math.round(azar() * 900);
    return {nombre: `destello_${i}`, en: [0, 0], plano: 2, rect: [r1(x), r1(y), r1(x + w), r1(y + 1.4)], color: "#fff8d0", mezcla: "suma",
        claves: {opacidad: [[f, 0], [f + 300, 0.9, "suave"], [f + 700, 0, "suave"], [f + 1300, 0]]}, repetir: "repetir", sonido: "no_lleva"};
});
const boteK = {y: muestras(boteY), rotacion: muestras(boteRot)};
const objetos = [
    {nombre: "cielo", en: [0, 0], plano: -6, rect: [-400, -300, 1800, 470], degradado: lineal([0, -300], [0, 440], [[0, "#4a86c8"], [0.7, "#a8d0ec"], [1, "#f4e8d0"]])},
    {nombre: "sol", en: [1000, 330], plano: -6, circulo: {r: 150, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 150, [[0, rgba("#fffbe0", 1)], [0.12, rgba("#fff0b0", 0.7)], [1, rgba("#ffd890", 0)]])},
    ...[[200, 150, 1.0], [700, 90, 0.8], [1250, 170, 1.2]].map(([x, y, e], i) => ({nombre: `nube_${i}`, en: [x, y], plano: -6, escala: e, partes: [
        {nombre: `nube_${i}_a`, circulo: {r: 40, ry: 22, lados: 18}, color: "#ffffff", opacidad: 0.85, desenfoque: 3},
        {nombre: `nube_${i}_b`, en: [36, 6], circulo: {r: 32, ry: 18, lados: 18}, color: "#ffffff", opacidad: 0.85, desenfoque: 3}],
        claves: {x: [[0, x], [DUR, x + 60]]}, sonido: "no_lleva"})),
    {nombre: "isla", en: [0, 0], plano: -5, poligono: [[60, 432], [120, 412], [200, 404], [280, 418], [330, 432]], color: "#5a7a8a", desenfoque: 1.2},
    capaOlas("fondo", -4, [[0, "#7ab0d0"], [1, "#4a80a8"]]),
    capaOlas("medio", -3, [[0, "#4a8ab8"], [1, "#2a5a88"]]),
    {nombre: "brillo_sol_agua", en: [1000, 480], plano: -2, circulo: {r: 260, lados: 32}, escala: [1, 0.25], mezcla: "suma", degradado: radial([0, 0], 260, [[0, rgba("#fff0c0", 0.5)], [1, rgba("#fff0c0", 0)]])},
    {nombre: "corcho", en: [BOB_X, ola("frente", BOB_X, 0)], plano: 0, partes: [
        {nombre: "corcho_rojo", poligono: [[-5, -4], [5, -4], [4, 2], [-4, 2]], color: "#e02a20"},
        {nombre: "corcho_blanco", poligono: [[-4, 2], [4, 2], [0, 9]], color: "#f4f4f0"},
        {nombre: "corcho_palo", rect: [-0.8, -12, 0.8, -4], color: "#e02a20"}],
        claves: {x: [[0, BOB_X]], y: muestras((t) => extremo(Math.min(t, T.tira - 1))[1] + (t > T.tira ? 30 * tramo(t, T.tira, T.tira + 200) : 0), 0, T.tira + 400),
            opacidad: [[0, 1, "mantener"], [T.tira + 220, 0, "mantener"]]}, sonido: "no_lleva"},
    ...Array.from({length: 4}, (_, i) => onda(`corcho_${i}`, [BOB_X, AGUA_Y], 600 + i * 1000, 26)),
    onda("pica", [BOB_X, AGUA_Y], T.pica2, 40), onda("tira", [BOB_X, AGUA_Y], T.tira, 60),
    onda("salta", E(T.salta), T.salta, 70), onda("cae", E(T.cae - 1), T.cae, 70), onda("sale", [E(T.sale)[0], AGUA_Y], T.sale, 60),
    {instancia: "Bote con pescador", nombre: "bote", en: [BX, AGUA_Y], escala: ESC, bucle: false, claves: boteK},
    sedal(), pez(),
    capaOlas("frente", 1, [[0, "#2a6a98"], [0.4, "#1a4a78"], [1, "#0e2a48"]], {opacidad: 0.93}),
    ...destellos,
    {instancia: "Gaviota", nombre: "gaviota_1", en: [-100, 160], escala: 1.3, claves: {x: [[0, -100], [9000, 1500]], y: [[0, 160], [3000, 120, "suave"], [6000, 180, "suave"], [9000, 130, "suave"]]}},
    {instancia: "Gaviota", nombre: "gaviota_2", en: [1500, 110], escala: [-1, 1], desfase: 200, claves: {x: [[0, 1500], [3500, 1500], [13500, -100]], y: [[0, 110], [8000, 150, "suave"], [13500, 100, "suave"]]}},
];
const efectos = [...salpicadura("tira", [BOB_X, AGUA_Y], T.tira), ...salpicadura("salta", E(T.salta), T.salta), ...salpicadura("cae", E(T.cae - 1), T.cae),
    ...salpicadura("sale", [E(T.sale)[0], AGUA_Y], T.sale)];
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Pescando en el mar", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Mar", t: 0, volumen: 0.7, bucle: true, fundido: {entrada: 1500, salida: 1500}},
        {sonido: "Gaviotas", t: 800, volumen: 0.5},
        {sonido: "Chapuzón", t: T.tira, volumen: 0.8},
        {sonido: "Carrete", t: T.tira + 300, volumen: 0.6},
        {sonido: "Salpicadura", t: T.salta, volumen: 1},
        {sonido: "Chapuzón", t: T.cae, volumen: 0.9},
        {sonido: "Salpicadura", t: T.sale, volumen: 0.8},
        {sonido: "Carrete", t: T.sale + 200, volumen: 0.6},
    ],
    camara: {centro: [640, 360], claves: {
        x: [[0, 640], [T.pica1 - 500, 640], [T.tira + 300, 700, "suave"], [T.salta, 720, "suave"], [T.cae + 400, 690, "suave"], [T.alza, 640, "suave"], [DUR, 630, "suave"]],
        y: [[0, 360], [T.pica1 - 500, 360], [T.tira + 300, 400, "suave"], [T.sale, 380, "suave"], [T.alza, 330, "suave"], [DUR, 320, "suave"]],
        zoom: [[0, 1], [T.pica1 - 500, 1], [T.tira + 300, 1.3, "suave"], [T.salta, 1.2, "suave"], [T.cae + 400, 1.3, "suave"], [T.alza, 1.4, "suave"], [DUR, 1.45, "suave"]]}},
    objetos, efectos,
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms, claves por pista: ${Math.round(DUR / PASO) + 1}\n`);
