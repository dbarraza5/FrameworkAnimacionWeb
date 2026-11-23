// Pruebas de arte (planeacion_pruebas_arte.md), fase 6: NOIR / GRABADO.
// Escena original: "Lluvia en la calle Ocho". Noche de lluvia en una calle de los anos 40: un detective con
// gabardina y sombrero camina hasta un farol, enciende un fosforo para mirar una fotografia y un auto que
// pasa lo bana de luz. Todo en grises; el estilo (tramado "lineas" + contorno) lo vuelve grabado en tinta.
//   asset_01 Edificios, 02 Calle mojada, 03 Farol noir, 04 Lluvia, 05 Detective, 06 Auto de los 40;  escena.json (15 s)
//   node herramientas/ejemplos/arte/noir/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(8);
const g = (v) => { const c = Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"); return `#${c}${c}${c}`; };
const luzA = (a) => `rgba(255,255,255,${a})`;
const ACERA = 560;   // linea de la vereda (pies del detective)

// ------------------------------------------------------------------ EDIFICIOS (fondo; origen arriba a la izquierda)
function edificios() {
    const partes = [{nombre: "cielo", capa: 0, rect: [-300, -200, 1700, 600], degradado: lineal([0, -200], [0, 300], [[0, g(25)], [1, g(55)]])}];
    let x = -300, k = 0;
    while (x < 1700) {
        const w = 180 + azar() * 160, top = 20 + azar() * 140;
        partes.push({nombre: `fachada_${k}`, capa: 1, rect: [r2(x), r2(top), r2(x + w), 560], degradado: lineal([x, 0], [x + w, 0], [[0, g(30)], [0.6, g(48)], [1, g(38)]])});
        partes.push({nombre: `cornisa_${k}`, capa: 2, rect: [r2(x - 4), r2(top), r2(x + w + 4), r2(top + 10)], color: g(70)});
        for (let f = 0; f < 6; f++) for (let c = 0; c < 4; c++) {
            const vx = x + 18 + c * (w - 36) / 4, vy = top + 34 + f * 72;
            if (vy > 470) continue;
            const prendida = azar() < 0.22;
            partes.push({nombre: `ventana_${k}_${f}_${c}`, capa: 2, rect: [r2(vx), r2(vy), r2(vx + 26), r2(vy + 40)], color: prendida ? g(225) : g(18)});
            if (prendida) partes.push({nombre: `persiana_${k}_${f}_${c}`, capa: 3, rect: [r2(vx), r2(vy + 14), r2(vx + 26), r2(vy + 17)], color: g(90)});
        }
        // escalera de incendio en algunos edificios
        if (k % 2 === 0) for (let f = 0; f < 3; f++) {
            const ey = top + 100 + f * 120;
            partes.push({nombre: `escalera_${k}_${f}`, capa: 3, rect: [r2(x + w * 0.55), r2(ey), r2(x + w * 0.95), r2(ey + 4)], color: g(10)});
            partes.push({nombre: `baranda_${k}_${f}`, capa: 3, rect: [r2(x + w * 0.55), r2(ey - 24), r2(x + w * 0.95), r2(ey - 22)], color: g(10)});
        }
        x += w + 6; k++;
    }
    // cartel luminoso de un hotel (sin letras: un marco de luz que parpadea)
    partes.push({nombre: "cartel", capa: 4, en: [980, 200], partes: [
        {nombre: "cartel_fondo", rect: [0, 0, 46, 180], color: g(20)},
        ...Array.from({length: 5}, (_, i) => ({nombre: `cartel_luz_${i}`, rect: [10, 14 + i * 32, 36, 36 + i * 32], color: g(235)})),
    ], claves: {opacidad: [[0, 1, "mantener"], [2300, 0.35, "mantener"], [2400, 1, "mantener"], [2500, 0.4, "mantener"], [2600, 1, "mantener"], [6000, 1]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Edificios", duracion: 6000, marcas, partes};
}

// ------------------------------------------------------------------ CALLE MOJADA (vereda, cordon, asfalto con reflejos)
function calle() {
    const partes = [
        {nombre: "vereda", capa: 0, rect: [-300, 540, 1700, 600], degradado: lineal([0, 540], [0, 600], [[0, g(80)], [1, g(55)]])},
        {nombre: "cordon", capa: 1, rect: [-300, 598, 1700, 610], color: g(120)},
        {nombre: "asfalto", capa: 0, rect: [-300, 610, 1700, 900], degradado: lineal([0, 610], [0, 900], [[0, g(40)], [1, g(20)]])},
    ];
    for (let i = 0; i < 26; i++) partes.push({nombre: `baldosa_${i}`, capa: 1, rect: [-300 + i * 80, 540, -298 + i * 80, 598], color: g(45)});
    // charcos con reflejos de las ventanas (rayas verticales claras)
    for (let i = 0; i < 9; i++) {
        const cx = -200 + i * 220 + azar() * 80, cy = 680 + azar() * 140, rx = 60 + azar() * 70;
        partes.push({nombre: `charco_${i}`, capa: 1, en: [r2(cx), r2(cy)], poligono: ovalo(0, 0, rx, rx * 0.18, 18), color: g(70)});
        for (let j = 0; j < 3; j++) partes.push({nombre: `reflejo_${i}_${j}`, capa: 2, en: [r2(cx - rx * 0.5 + j * rx * 0.45), r2(cy)], rect: [-3, -rx * 0.12, 3, rx * 0.12], color: g(190),
            claves: {escala_x: ciclo(900 + j * 200, (u) => 0.7 + 0.5 * Math.sin(TAU * u))}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Calle mojada", duracion: 1800, marcas, partes};
}

// ------------------------------------------------------------------ FAROL (pies en 0,0; cono de luz y charco iluminado)
const farol = () => ({tipo: "asset", nombre: "Farol noir", duracion: 3000, marcas, partes: [
    {nombre: "luz_suelo", capa: 0, en: [0, 0], poligono: ovalo(0, 0, 170, 36, 28), degradado: radial([0, 0], 170, [[0, luzA(0.85)], [1, luzA(0)]]), borde: TRANSP},
    {nombre: "cono", capa: 1, poligono: [[-14, -300], [14, -300], [170, 0], [-170, 0]], degradado: lineal([0, -300], [0, 0], [[0, luzA(0.55)], [1, luzA(0.12)]]), borde: TRANSP,
        claves: {opacidad: [[0, 1, "mantener"], [1700, 0.8, "mantener"], [1780, 1, "mantener"], [3000, 1]]}, bucle: "repetir"},
    {nombre: "poste", capa: 2, rect: [-5, -300, 5, 0], degradado: lineal([-5, 0], [5, 0], [[0, g(10)], [1, g(70)]])},
    {nombre: "base", capa: 2, rect: [-12, -20, 12, 0], color: g(15)},
    {nombre: "lampara", capa: 3, en: [0, -310], partes: [
        {nombre: "tapa", poligono: [[-22, 0], [0, -18], [22, 0]], color: g(10)},
        {nombre: "vidrio", poligono: [[-14, 0], [14, 0], [10, 20], [-10, 20]], color: g(255)},
        {nombre: "halo", en: [0, 10], circulo: {r: 60, lados: 24}, degradado: radial([0, 0], 60, [[0, luzA(0.8)], [1, luzA(0)]]), borde: TRANSP},
    ]},
]});

// ------------------------------------------------------------------ LLUVIA (rayas diagonales que caen, en bucle; cubre 1400 x 900)
function lluvia() {
    const DUR = 600, partes = [];
    for (let i = 0; i < 160; i++) {
        const x = -100 + azar() * 1500, y0 = -100 + azar() * 900, l = 18 + azar() * 22, fase = Math.round(azar() * DUR);
        // cae 900 en DUR*1.5 (con desfase propio); se dibuja como raya inclinada
        const ys = [], xs = [];
        for (let t = 0; t <= DUR; t += 50) { const u = ((t + fase) % DUR) / DUR; ys.push([t, r2(y0 + u * 260), "lineal"]); xs.push([t, r2(x - u * 90), "lineal"]); }
        partes.push({nombre: `gota_${i}`, capa: 0, poligono: [[0, 0], [2.2, 0], [-l * 0.35 + 2.2, l], [-l * 0.35, l]], color: luzA(0.75 + azar() * 0.25), borde: TRANSP,
            claves: {y: ys, x: xs}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Lluvia", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ DETECTIVE (perfil, mira a la derecha; pies en 0,0; ~190 de alto)
function detective() {
    const partes = [
        {nombre: "sombra", capa: 0, poligono: ovalo(6, 0, 40, 7, 16), color: "rgba(0,0,0,0.6)", borde: TRANSP},
        {nombre: "cuerpo", capa: 1, pivote: [0, -90], partes: [
            {nombre: "pierna_a", pivote: [-4, -80], partes: [{nombre: "pierna_a_t", rect: [-10, -80, 2, -4], color: g(25)}, {nombre: "zapato_a", poligono: [[-11, -6], [6, -6], [14, 0], [-11, 0]], color: g(8)}]},
            {nombre: "pierna_b", pivote: [4, -80], partes: [{nombre: "pierna_b_t", rect: [-2, -80, 10, -4], color: g(35)}, {nombre: "zapato_b", poligono: [[-3, -6], [14, -6], [22, 0], [-3, 0]], color: g(8)}]},
            // gabardina larga con cinturon y solapas
            {nombre: "gabardina", poligono: [[-22, -150], [16, -152], [26, -60], [30, -44], [-28, -44], [-24, -60]], degradado: lineal([-28, 0], [30, 0], [[0, g(60)], [0.6, g(95)], [1, g(130)]])},
            {nombre: "cinturon", rect: [-25, -100, 24, -94], color: g(25)},
            {nombre: "solapa", poligono: [[4, -150], [16, -150], [6, -116]], color: g(40)},
            {nombre: "cuello_alto", poligono: [[-6, -160], [14, -158], [16, -148], [-8, -148]], color: g(75)},
            {nombre: "cabeza", en: [6, -170], pivote: [0, 10], partes: [
                {nombre: "cara", poligono: [[-8, 8], [-9, -6], [-4, -12], [8, -12], [12, -4], [14, 2], [10, 4], [10, 10], [2, 14]], color: g(150)},
                {nombre: "cara_luz", poligono: [[2, -10], [8, -12], [12, -4], [14, 2], [10, 4], [10, 10], [4, 12]], color: g(250), opacidad: 0},
                {nombre: "sombrero_ala", poligono: [[-20, -10], [22, -12], [24, -8], [-20, -6]], color: g(15)},
                {nombre: "sombrero_copa", poligono: [[-12, -10], [-10, -26], [12, -26], [14, -11]], color: g(20)},
                {nombre: "cinta", rect: [-11, -15, 14, -12], color: g(60)},
            ]},
            {nombre: "brazo", pivote: [2, -144], partes: [
                {nombre: "manga", poligono: [[-4, -146], [8, -146], [10, -96], [0, -96]], color: g(80)},
                {nombre: "mano", en: [5, -92], circulo: {r: 5, lados: 10}, color: g(140)},
                {nombre: "foto", en: [8, -98], rect: [-2, -14, 14, 0], color: g(200), opacidad: 0},
                {nombre: "fosforo", en: [6, -100], partes: [
                    {nombre: "llama_halo", circulo: {r: 46, lados: 20}, degradado: radial([0, 0], 46, [[0, luzA(0.9)], [1, luzA(0)]]), borde: TRANSP},
                    {nombre: "llama", poligono: [[0, -7], [3, 0], [0, 3], [-3, 0]], color: g(255)},
                ], opacidad: 0},
            ]},
        ]},
    ];
    const params = {pa: ["pierna_a", "rotacion"], pb: ["pierna_b", "rotacion"], cy: ["cuerpo", "y"], br: ["brazo", "rotacion"], cab: ["cabeza", "rotacion"],
        fos: ["fosforo", "opacidad"], fos_e: ["fosforo", "escala_x"], cara: ["cara_luz", "opacidad"], foto: ["foto", "opacidad"]};
    const base = {pa: 0, pb: 0, cy: 0, br: 0, cab: 0, fos: 0, fos_e: 1, cara: 0, foto: 0};
    const acciones = [
        {nombre: "Caminar", dur: 1100, pose: (tl, d) => { const th = TAU * tl / d; return {pa: 18 * Math.sin(th), pb: -18 * Math.sin(th), cy: -2 * Math.abs(Math.sin(th)), br: -10 * Math.sin(th), cab: 6}; }},
        {nombre: "Quieto", dur: 2000, pose: (tl, d) => ({cy: -0.8 * Math.sin(TAU * tl / d), cab: 6})},
        // saca un fosforo, lo enciende (chispazo), lo acerca y mira la foto; la cara se ilumina
        {nombre: "Encender el fósforo", dur: 4200, pose: (tl) => {
            const sube = tramo(tl, 0, 600), chispa = tl > 900 ? 1 : 0, parpadeo = 0.85 + 0.15 * Math.sin(TAU * tl / 130);
            return {br: -70 * sube, fos: chispa * parpadeo, fos_e: tl > 900 && tl < 1050 ? 1.8 : 1, cara: chispa * 0.85 * parpadeo, foto: tramo(tl, 1300, 1700), cab: 6 + 14 * tramo(tl, 1200, 1700)}; }},
    ];
    return asset("Detective", acciones, params, base, partes);
}

// ------------------------------------------------------------------ AUTO DE LOS 40 (perfil, va a la izquierda; pies en 0,0)
const autoNoir = () => ({tipo: "asset", nombre: "Auto de los 40", duracion: 600, marcas, partes: [
    {nombre: "haz", capa: 0, poligono: [[-150, -48], [-700, -140], [-700, 40], [-150, -30]], degradado: lineal([-150, 0], [-700, 0], [[0, luzA(0.85)], [1, luzA(0)]]), borde: TRANSP},
    {nombre: "carroceria", capa: 1, poligono: [[-160, -30], [-150, -60], [-90, -66], [-60, -104], [40, -106], [80, -70], [150, -62], [164, -30], [150, -14], [-150, -14]],
        degradado: lineal([0, -106], [0, -14], [[0, g(70)], [0.5, g(40)], [1, g(15)]])},
    {nombre: "ventanas", capa: 2, poligono: [[-50, -96], [-10, -98], [-10, -70], [-70, -68]], color: g(110)},
    {nombre: "ventana_2", capa: 2, poligono: [[0, -98], [36, -98], [66, -72], [0, -70]], color: g(110)},
    {nombre: "cromado", capa: 2, rect: [-150, -40, 156, -36], color: g(200)},
    {nombre: "faro", capa: 3, en: [-152, -44], circulo: {r: 8, lados: 12}, color: g(255)},
    ...[-100, 100].map((x, i) => ({nombre: `rueda_${i}`, capa: 3, en: [x, -16], partes: [
        {nombre: `cubierta_${i}`, circulo: {r: 22, lados: 18}, color: g(10)},
        {nombre: `taza_${i}`, circulo: {r: 9, lados: 12}, color: g(170)},
        {nombre: `rayo_${i}`, rect: [-9, -1.5, 9, 1.5], color: g(10), claves: {rotacion: [[0, 0, "lineal"], [600, -360, "lineal"]]}, bucle: "repetir"},
    ]})),
]});

// ------------------------------------------------------------------ LA ESCENA (15 s)
function escena() {
    const DUR = 15000, LLEGA = 4600, T_AUTO = 10600;
    return {
        tipo: "escena", nombre: "Lluvia en la calle Ocho", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {paleta: ["#0d0d10", "#ece6d6"], tramado: "lineas", lineas: {celda: 5, angulo: 40, cruzado: true}, contraste: 1.25, brillo: 0.02,
            contorno: {grosor: 1.3, color: "#0d0d10", umbral: 85},
            claves: {brillo: [[0, 0.02], [T_AUTO + 600, 0.02, "lineal"], [T_AUTO + 1000, 0.2, "suave"], [T_AUTO + 1700, 0.02, "suave"]]}},
        camara: {tamano: [1280, 720], centro: [600, 400], zoom: 1, claves: {x: [[0, 560], [LLEGA, 700, "suave"], [DUR, 760, "suave"]], y: [[0, 400], [DUR, 420, "suave"]], zoom: [[0, 1], [LLEGA, 1.1, "suave"], [9500, 1.45, "suave"], [T_AUTO - 300, 1.45], [T_AUTO + 700, 1.1, "suave"], [DUR, 1.15, "suave"]]}},
        objetos: [
            {instancia: "Edificios", nombre: "edificios", en: [0, 0], plano: -10},
            {instancia: "Calle mojada", nombre: "calle", en: [0, 0], plano: -9},
            {instancia: "Farol noir", nombre: "farol", en: [850, ACERA + 10], plano: -5},
            {instancia: "Detective", nombre: "detective", en: [180, ACERA], plano: 0, escala: 1.2, claves: {x: [[0, 180], [LLEGA, 700, "lineal"]]},
                acciones: [[0, "Caminar"], [LLEGA, "Quieto"], [LLEGA + 900, "Encender el fósforo", false]]},
            {instancia: "Auto de los 40", nombre: "auto", en: [1900, 690], plano: 1, claves: {x: [[0, 1900], [T_AUTO, 1900], [T_AUTO + 2600, -500, "lineal"]]}},
            {instancia: "Lluvia", nombre: "lluvia", en: [0, 0], plano: 5},
            {instancia: "Lluvia", nombre: "lluvia_2", en: [300, 120], plano: 5, desfase: 230, escala: 1.2},
        ],
        dialogos: [{quien: "detective", texto: "Otra vez tú…", desde: LLEGA + 3200, hasta: LLEGA + 5600, estilo: "pensamiento", velocidad: 18}],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [edificios(), calle(), farol(), lluvia(), detective(), autoNoir()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
