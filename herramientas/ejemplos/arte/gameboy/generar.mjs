// Pruebas de arte (planeacion_pruebas_arte.md), fase 5: GAME BOY (4 tonos de verde).
// Escena original: "La cueva del cristal". Un pequeno explorador con antorcha baja por una cueva oscura
// (cornisas, estalactitas que gotean, murcielagos); en el fondo encuentra un cristal: al tocarlo, un
// destello y la cueva entera se ilumina (estilo.claves.brillo). Pantalla 10:9 como la consola, pixel gordo,
// paleta de 4 verdes con tramado, animacion a 12 cps.
// Todo se dibuja en grises (luz); la paleta lo convierte.
//   asset_01 Roca de fondo, 02 Cornisas, 03 Techo con estalactitas, 04 Gota, 05 Murciélago, 06 Cristal,
//   07 Luz de antorcha, 08 Explorador;  escena.json (16 s)
//   node herramientas/ejemplos/arte/gameboy/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, trayectoria, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(77);
const g = (v) => { const c = Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"); return `#${c}${c}${c}`; };
const negroA = (a) => `rgba(0,0,0,${a})`;
// niveles del piso de la cueva: [x0, x1, y]
const NIVELES = [[-200, 720, 300], [720, 1180, 420], [1180, 1620, 540], [1620, 2700, 640]];

// ------------------------------------------------------------------ ROCA DE FONDO (pared del fondo; origen 0,0)
function roca() {
    const partes = [{nombre: "pared", capa: 0, rect: [-400, -200, 2900, 1100], degradado: lineal([0, -200], [0, 1100], [[0, g(60)], [0.5, g(80)], [1, g(55)]])}];
    for (let i = 0; i < 70; i++) {
        const x = -300 + azar() * 3100, y = -100 + azar() * 1100, r = 20 + azar() * 70;
        partes.push({nombre: `piedra_${i}`, capa: 1, en: [r2(x), r2(y)], poligono: ovalo(0, 0, r, r * (0.5 + azar() * 0.4), 8, (a) => 0.8 + 0.3 * Math.sin(a * 3 + i)), color: g(55 + azar() * 70), borde: TRANSP});
    }
    // columnas de roca al fondo
    [300, 950, 1500, 2050].forEach((x, k) => partes.push({nombre: `columna_${k}`, capa: 2, poligono: [[x - 40, -200], [x + 40, -200], [x + 22, 300], [x + 50, 1100], [x - 50, 1100], [x - 22, 300]],
        degradado: lineal([x - 50, 0], [x + 50, 0], [[0, g(40)], [1, g(115)]])}));
    return {tipo: "asset", nombre: "Roca de fondo", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ CORNISAS (pisos escalonados; origen 0,0)
function cornisas() {
    const partes = [];
    NIVELES.forEach(([x0, x1, y], k) => {
        const borde = [];
        for (let x = x0; x <= x1; x += 30) borde.push([x, r2(y + (x === x0 || x >= x1 ? 0 : (azar() - 0.5) * 6))]);
        partes.push({nombre: `nivel_${k}`, capa: 1, poligono: [...borde, [x1, 1200], [x0, 1200]], degradado: lineal([0, y], [0, y + 260], [[0, g(175)], [0.1, g(150)], [1, g(40)]])});
        partes.push({nombre: `filo_${k}`, capa: 2, rect: [x0, y, x1, y + 6], color: g(200)});
        // piedritas sobre el piso
        for (let i = 0; i < 5; i++) partes.push({nombre: `guijarro_${k}_${i}`, capa: 2, en: [r2(x0 + 40 + azar() * (x1 - x0 - 80)), y], poligono: ovalo(0, -4, 7 + azar() * 6, 5, 8), color: g(120)});
    });
    return {tipo: "asset", nombre: "Cornisas", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ TECHO CON ESTALACTITAS (origen 0,0)
function techo() {
    const pts = [[-400, -400], [2900, -400]];
    const borde = [];
    for (let x = 2900; x >= -400; x -= 60) {
        const largo = azar() < 0.35 ? 60 + azar() * 90 : 10 + azar() * 25;
        borde.push([x, 60 + azar() * 20], [x - 30, r2(60 + largo)], [x - 45, 70]);
    }
    return {tipo: "asset", nombre: "Techo con estalactitas", duracion: 1000, marcas, partes: [
        {nombre: "techo", capa: 0, poligono: [...pts, ...borde], degradado: lineal([0, -100], [0, 200], [[0, g(15)], [0.7, g(55)], [1, g(110)]])},
    ]};
}

// ------------------------------------------------------------------ GOTA (cae desde la punta, en bucle; origen en la punta)
const gota = () => ({tipo: "asset", nombre: "Gota", duracion: 2200, marcas, partes: [
    {nombre: "gota", capa: 0, poligono: [[0, -6], [4, 0], [3, 4], [0, 6], [-3, 4], [-4, 0]], color: g(230),
        claves: {y: [[0, 0, "entrar"], [1100, 0, "entrar"], [1900, 420, "lineal"], [2200, 420]], opacidad: [[0, 0, "lineal"], [600, 1, "lineal"], [1900, 1, "mantener"], [1950, 0, "mantener"], [2200, 0]]}, bucle: "repetir"},
    {nombre: "salpicon", capa: 0, en: [0, 420], poligono: [[-12, 0], [-6, -6], [0, -2], [6, -6], [12, 0]], color: g(230),
        claves: {opacidad: [[0, 0, "mantener"], [1900, 1, "mantener"], [2050, 0, "mantener"], [2200, 0]]}, bucle: "repetir"},
]});

// ------------------------------------------------------------------ MURCIELAGO (aletea en bucle; centro en 0,0)
function murcielago() {
    const ala = (s) => [[0, 0], [s * 10, -10], [s * 22, -14], [s * 30, -6], [s * 24, -2], [s * 18, 4], [s * 10, 2]];
    const formasAbajo = (s) => ala(s).map(([x, y]) => [x, r2(-y * 0.8 + 2)]);
    const parte = (n, s) => ({nombre: `ala_${n}`, poligono: ala(s), color: g(20), formas: {abajo: {poligono: formasAbajo(s)}},
        claves: {forma: [[0, "", "lineal"], [150, "abajo", "lineal"], [300, "", "lineal"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Murciélago", duracion: 300, marcas, partes: [
        parte("i", -1), parte("d", 1),
        {nombre: "cuerpo", poligono: ovalo(0, 0, 6, 8, 10), color: g(20)},
        {nombre: "oreja_i", poligono: [[-5, -6], [-3, -12], [-1, -7]], color: g(20)},
        {nombre: "oreja_d", poligono: [[1, -7], [3, -12], [5, -6]], color: g(20)},
        {nombre: "ojos", rect: [-3, -3, 3, -1.5], color: g(230)},
    ]};
}

// ------------------------------------------------------------------ CRISTAL (racimo que late; acciones Latir y Despertar)
function cristal() {
    const punta = (n, x, h, w, inc) => ({nombre: n, poligono: [[x - w, 0], [x - w * 0.8 + inc, -h * 0.75], [x + inc, -h], [x + w * 0.8 + inc, -h * 0.75], [x + w, 0]],
        degradado: lineal([x - w, 0], [x + w, 0], [[0, g(150)], [0.5, g(255)], [1, g(180)]])});
    const partes = [
        {nombre: "halo", capa: 0, en: [0, -60], circulo: {r: 170, lados: 32}, degradado: radial([0, 0], 170, [[0, "rgba(255,255,255,0.7)"], [1, "rgba(255,255,255,0)"]]), borde: TRANSP},
        {nombre: "racimo", capa: 1, partes: [punta("p1", -30, 70, 16, -10), punta("p2", 28, 80, 18, 12), punta("p3", 0, 120, 22, 0), punta("p4", -52, 40, 12, -14), punta("p5", 50, 46, 12, 14)]},
        {nombre: "brillo", capa: 2, en: [-2, -96], poligono: [[0, -14], [3, -3], [14, 0], [3, 3], [0, 14], [-3, 3], [-14, 0], [-3, -3]], color: g(255)},
        {nombre: "destello", capa: 3, en: [0, -60], circulo: {r: 600, lados: 32}, degradado: radial([0, 0], 600, [[0, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]]), borde: TRANSP},
    ];
    const params = {halo: ["halo", "opacidad"], halo_e: ["halo", "escala_x"], halo_ey: ["halo", "escala_y"], br: ["brillo", "opacidad"], br_r: ["brillo", "rotacion"], des: ["destello", "opacidad"]};
    const base = {halo: 0.5, halo_e: 1, halo_ey: 1, br: 0.6, br_r: 0, des: 0};
    const acciones = [
        {nombre: "Latir", dur: 1600, pose: (tl, d) => { const s = 0.5 + 0.5 * Math.sin(TAU * tl / d); return {halo: 0.35 + 0.35 * s, halo_e: 0.9 + 0.2 * s, halo_ey: 0.9 + 0.2 * s, br: s, br_r: 45 * tl / d}; }},
        {nombre: "Despertar", dur: 2400, pose: (tl) => { const f = Math.max(0, 1 - Math.max(0, tl - 150) / 1400);
            return {des: Math.min(1, tl / 120) * f, halo: 1, halo_e: 1.4 + 0.3 * Math.sin(TAU * tl / 800), halo_ey: 1.4 + 0.3 * Math.sin(TAU * tl / 800), br: 1, br_r: 90 * tl / 1000}; }},
    ];
    return asset("Cristal", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LUZ DE ANTORCHA (oscuridad con un hueco de luz; sigue al explorador con `padre`)
const luzAntorcha = () => ({tipo: "asset", nombre: "Luz de antorcha", duracion: 400, marcas, partes: [
    {nombre: "oscuridad", capa: 0, en: [0, -40], circulo: {r: 1500, lados: 48},
        degradado: radial([0, 0], 1500, [[0, negroA(0)], [0.15, negroA(0)], [0.27, negroA(0.6)], [0.42, negroA(0.88)], [1, negroA(0.93)]]), borde: TRANSP,
        claves: {escala_x: ciclo(400, (u) => 1 + 0.03 * Math.sin(TAU * u * 2)), escala_y: ciclo(400, (u) => 1 + 0.03 * Math.sin(TAU * u * 2))}, bucle: "repetir"},
]});

// ------------------------------------------------------------------ EXPLORADOR (mira a la derecha; pies en 0,0; ~60 de alto)
function explorador() {
    const partes = [
        {nombre: "cuerpo", pivote: [0, -20], partes: [
            {nombre: "pierna_a", pivote: [-3, -18], rect: [-6, -18, -1, 0], color: g(40)},
            {nombre: "pierna_b", pivote: [3, -18], rect: [1, -18, 6, 0], color: g(60)},
            {nombre: "mochila", poligono: [[-14, -40], [-6, -42], [-6, -20], [-14, -22]], color: g(90)},
            {nombre: "torso", poligono: [[-7, -42], [8, -42], [9, -18], [-7, -18]], color: g(170)},
            {nombre: "cinto", rect: [-7, -22, 9, -19], color: g(40)},
            {nombre: "cabeza", en: [2, -50], pivote: [0, 6], partes: [
                {nombre: "cara", poligono: ovalo(0, 0, 7, 8, 12), color: g(220)},
                {nombre: "ojo", en: [4, -1], rect: [-1, -1.5, 1, 1.5], color: g(20)},
                {nombre: "sombrero", poligono: [[-12, -4], [14, -4], [14, -2], [-12, -2]], color: g(50)},
                {nombre: "copa", poligono: [[-7, -4], [-6, -12], [7, -12], [8, -4]], color: g(50)},
            ]},
            {nombre: "brazo", pivote: [6, -38], partes: [
                {nombre: "manga", rect: [4, -38, 9, -24], color: g(150)},
                {nombre: "antorcha", en: [7, -24], partes: [
                    {nombre: "palo", rect: [-1.5, -20, 1.5, 4], color: g(80)},
                    {nombre: "llama", en: [0, -24], poligono: [[0, -10], [4, -2], [3, 3], [0, 5], [-3, 3], [-4, -2]], color: g(255),
                        claves: {escala_y: ciclo(400, (u) => 1 + 0.25 * Math.sin(TAU * u * 3), 12), escala_x: ciclo(400, (u) => 1 - 0.15 * Math.sin(TAU * u * 3), 12)}, bucle: "repetir"},
                ]},
            ]},
        ]},
    ];
    const params = {pa: ["pierna_a", "rotacion"], pb: ["pierna_b", "rotacion"], cy: ["cuerpo", "y"], br: ["brazo", "rotacion"], cab: ["cabeza", "rotacion"]};
    const base = {pa: 0, pb: 0, cy: 0, br: 0, cab: 0};
    const acciones = [
        {nombre: "Caminar", dur: 600, pose: (tl, d) => { const th = TAU * tl / d; return {pa: 30 * Math.sin(th), pb: -30 * Math.sin(th), cy: -2 * Math.abs(Math.sin(th)), br: 8 * Math.sin(th)}; }},
        {nombre: "Saltar", dur: 700, pose: (tl) => { const k = tramo(tl, 0, 150); return {pa: -35 * k, pb: 25 * k, br: -40 * k, cy: -2 * k}; }},
        {nombre: "Quieto", dur: 1600, pose: (tl, d) => ({cy: -1 * Math.sin(TAU * tl / d)})},
        {nombre: "Alzar la antorcha", dur: 2000, pose: (tl) => { const k = tramo(tl, 0, 400); return {br: -110 * k, cab: -15 * k}; }},
    ];
    return asset("Explorador", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LA ESCENA (pantalla 10:9; 16 s; 12 cps)
function escena() {
    const DUR = 16000, T_TOCA = 11200;
    const [L1, L2, L3, L4] = NIVELES.map((n) => n[2]);
    const recorrido = [[0, 80, L1], [3000, 690, L1], [3700, 790, L2, {arco: 60}], [5400, 1150, L2], [6100, 1250, L3, {arco: 60}], [7800, 1590, L3], [8500, 1700, L4, {arco: 60}], [10600, 2080, L4], [16000, 2080, L4]];
    const tr = trayectoria(recorrido);
    const posEn = (t) => { const i = Math.min(tr.x.length - 1, Math.round(t / 50)); return [tr.x[i][1], tr.y[i][1]]; };
    const cx = [], cy = [];
    for (let t = 0; t <= DUR; t += 250) { const [x, y] = posEn(Math.max(0, t - 300)); cx.push([t, r2(Math.max(400, x + 80)), "lineal"]); cy.push([t, r2(y - 160), "lineal"]); }
    return {
        tipo: "escena", nombre: "La cueva del cristal", duracion: DUR, precision: "decimal", profundidad: false, fps_animacion: 12,
        estilo: {paleta: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], tramado: "bayer2", pixel: 4.5, contraste: 1.45,
            claves: {brillo: [[0, 0.04], [T_TOCA, 0.04, "lineal"], [T_TOCA + 200, 0.4, "suave"], [T_TOCA + 2200, 0.16, "suave"]]}},
        camara: {tamano: [800, 720], centro: [cx[0][1], cy[0][1]], zoom: 1, claves: {x: cx, y: cy, zoom: [[0, 1], [T_TOCA, 1, "suave"], [DUR, 0.85, "suave"]]}},
        objetos: [
            {instancia: "Roca de fondo", nombre: "roca", en: [0, 0], plano: -10},
            {instancia: "Cristal", nombre: "cristal", en: [2200, L4], plano: -3, escala: 1.1, acciones: [[0, "Latir"], [T_TOCA, "Despertar", false]]},
            {instancia: "Cornisas", nombre: "cornisas", en: [0, 0], plano: -4},
            {instancia: "Techo con estalactitas", nombre: "techo", en: [0, 0], plano: -2},
            ...[[260, 0], [880, 700], [1380, 1400], [1880, 300], [2400, 1000]].map(([x, d], i) => ({instancia: "Gota", nombre: `gota_${i}`, en: [x, 120], plano: -1, desfase: d})),
            // murcielagos que cruzan
            ...[[1500, -1, 2600, 4400, 200], [2600, -1, 7400, 9600, 260], [-100, 1, 12600, 15000, 180]].map(([x0, s, t0, t1, y0], i) => ({instancia: "Murciélago", nombre: `murcielago_${i}`, en: [x0, y0], plano: 0,
                claves: {x: [[t0, x0], [t1, x0 + s * -1 * -1 * (s > 0 ? 1600 : -1600), "lineal"]], y: [[t0, y0], [(t0 + t1) / 2, y0 + 70, "suave"], [t1, y0 - 20, "suave"]]}})),
            {instancia: "Explorador", nombre: "explorador", en: recorrido[0].slice(1, 3), plano: 1, escala: 2.2, claves: tr,
                acciones: [[0, "Caminar"], [3000, "Saltar", false], [3700, "Caminar"], [5400, "Saltar", false], [6100, "Caminar"], [7800, "Saltar", false], [8500, "Caminar"],
                    [10600, "Quieto"], [10900, "Alzar la antorcha", false]]},
            // la oscuridad sigue al explorador y se va cuando la cueva se ilumina
            {instancia: "Luz de antorcha", nombre: "luz", en: [0, 0], plano: 5, padre: "explorador", escala: 0.5, claves: {opacidad: [[0, 1], [T_TOCA, 1], [T_TOCA + 500, 0, "suave"]]}},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [roca(), cornisas(), techo(), gota(), murcielago(), cristal(), luzAntorcha(), explorador()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
