// Pruebas de arte (planeacion_pruebas_arte.md), fase 8: ACUARELA.
// Escena original: "Barcas en el lago". Amanece en un lago de montana: dos barcas se mecen, un pescador
// lanza la cana, los reflejos tiemblan en el agua, pasan nubes y una bandada. Se dibuja con manchas
// translucidas que se superponen; el estilo (estilo.acuarela + papel) corre los bordes, funde la pintura,
// acumula pigmento en los bordes y deja ver el papel.
//   asset_01 Cielo de acuarela, 02 Sol del alba, 03 Nube de acuarela, 04 Montañas lejanas, 05 Montañas cercanas,
//   06 Pinos de la orilla, 07 Lago, 08 Barca con pescador, 09 Barca vacía, 10 Juncos, 11 Bandada;  escena.json (15 s)
//   node herramientas/ejemplos/arte/acuarela/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(31);
const HOR = 410;   // horizonte (orilla del lago)
// mancha irregular (borde ondulado al azar, como una pincelada)
const mancha = (cx, cy, rx, ry, n = 28, irr = 0.12) => { const f = Array.from({length: 5}, () => azar() * TAU); return ovalo(cx, cy, rx, ry, n, (a) => 1 + irr * (Math.sin(a * 3 + f[0]) * 0.6 + Math.sin(a * 5 + f[1]) * 0.4)); };
// perfil de montanas desde x0 a x1 con base en y = 0 (pies en el horizonte)
function cordillera(x0, x1, picos, alto) {
    const pts = [[x0, 0]];
    picos.forEach(([u, h]) => pts.push([r2(x0 + (x1 - x0) * u), r2(-h * alto)]));
    pts.push([x1, 0]);
    // suavizar con puntos intermedios irregulares
    const r = [];
    for (let i = 0; i < pts.length - 1; i++) { r.push(pts[i]); const [a, b] = pts[i], [c, d] = pts[i + 1]; r.push([r2((a + c) / 2 + (azar() - 0.5) * 20), r2((b + d) / 2 + (azar() - 0.3) * 18)]); }
    r.push(pts[pts.length - 1]);
    return r;
}

// ------------------------------------------------------------------ CIELO (origen arriba a la izquierda)
const cielo = () => ({tipo: "asset", nombre: "Cielo de acuarela", duracion: 1000, marcas, partes: [
    {nombre: "papel", capa: 0, rect: [-200, -100, 1500, 820], color: "#f7f1e3"},
    {nombre: "lavado_azul", capa: 1, rect: [-200, -100, 1500, HOR + 10], degradado: lineal([0, -100], [0, HOR], [[0, "rgba(120,160,205,0.85)"], [0.55, "rgba(170,190,215,0.6)"], [1, "rgba(250,200,160,0.7)"]])},
    {nombre: "rubor", capa: 2, en: [820, HOR - 40], poligono: mancha(0, 0, 520, 150, 32, 0.18), degradado: radial([0, 0], 520, [[0, "rgba(250,170,120,0.55)"], [1, "rgba(250,170,120,0)"]]), borde: TRANSP},
]});
const sol = () => ({tipo: "asset", nombre: "Sol del alba", duracion: 1000, marcas, partes: [
    {nombre: "halo", circulo: {r: 150, lados: 32}, degradado: radial([0, 0], 150, [[0, "rgba(255,225,150,0.6)"], [1, "rgba(255,225,150,0)"]]), borde: TRANSP},
    {nombre: "disco", poligono: mancha(0, 0, 48, 48, 24, 0.05), color: "rgba(255,214,120,0.9)"},
]});
const nube = () => ({tipo: "asset", nombre: "Nube de acuarela", duracion: 1000, marcas, partes: [
    {nombre: "cuerpo", poligono: mancha(0, 0, 120, 30, 26, 0.25), color: "rgba(255,240,235,0.6)", borde: TRANSP},
    {nombre: "sombra", en: [10, 12], poligono: mancha(0, 0, 100, 16, 22, 0.25), color: "rgba(180,150,190,0.35)", borde: TRANSP},
]});

// ------------------------------------------------------------------ MONTANAS (pies en el horizonte, y = 0)
const montanasLejos = () => ({tipo: "asset", nombre: "Montañas lejanas", duracion: 1000, marcas, partes: [
    {nombre: "cordillera", capa: 0, poligono: cordillera(-200, 1500, [[0.08, 0.5], [0.2, 0.9], [0.32, 0.6], [0.45, 1], [0.6, 0.55], [0.74, 0.85], [0.88, 0.5]], 230),
        degradado: lineal([0, -230], [0, 0], [[0, "rgba(130,120,175,0.75)"], [1, "rgba(175,160,195,0.55)"]]), borde: TRANSP},
    {nombre: "nieve", capa: 1, poligono: [[r2(-200 + 1700 * 0.43), -205], [r2(-200 + 1700 * 0.45), -230], [r2(-200 + 1700 * 0.47), -200], [r2(-200 + 1700 * 0.455), -190]], color: "rgba(255,255,255,0.7)", borde: TRANSP},
]});
const montanasCerca = () => ({tipo: "asset", nombre: "Montañas cercanas", duracion: 1000, marcas, partes: [
    {nombre: "ladera", capa: 0, poligono: cordillera(-200, 1500, [[0.05, 0.7], [0.18, 0.4], [0.3, 0.2], [0.7, 0.25], [0.82, 0.6], [0.95, 0.9]], 170),
        degradado: lineal([0, -170], [0, 0], [[0, "rgba(80,110,120,0.8)"], [1, "rgba(110,140,130,0.65)"]]), borde: TRANSP},
]});

// ------------------------------------------------------------------ PINOS DE LA ORILLA (pies en y = 0; varios pinos en manchas)
function pinos() {
    const partes = [];
    [[-40, 1.1], [30, 0.8], [90, 1.3], [160, 0.9], [230, 1.05], [1150, 1.0], [1220, 1.3], [1300, 0.85]].forEach(([x, e], k) => {
        const h = 150 * e;
        for (let p = 0; p < 4; p++) {
            const y = -h * (0.2 + p * 0.22), w = 40 * e * (1 - p * 0.22);
            partes.push({nombre: `pino_${k}_${p}`, capa: 1, en: [x, r2(y)], poligono: [[-w, 18 * e], [r2((azar() - 0.5) * 6), -h * 0.32], [w, 18 * e]].map(([a, b]) => [r2(a), r2(b)]),
                color: `rgba(${40 + p * 12},${90 + p * 10},${70 + p * 6},0.72)`, borde: TRANSP});
        }
        partes.push({nombre: `tronco_${k}`, capa: 0, rect: [x - 3, r2(-h * 0.2), x + 3, 0], color: "rgba(90,60,40,0.7)", borde: TRANSP});
    });
    return {tipo: "asset", nombre: "Pinos de la orilla", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ LAGO (de la orilla hacia abajo; origen arriba a la izquierda)
function lago() {
    const DUR = 3000, partes = [
        {nombre: "agua", capa: 0, rect: [-200, HOR, 1500, 820], degradado: lineal([0, HOR], [0, 820], [[0, "rgba(170,195,215,0.75)"], [0.4, "rgba(110,160,185,0.75)"], [1, "rgba(60,110,140,0.85)"]])},
    ];
    // brillos del sol sobre el agua: pinceladas horizontales que titilan
    for (let i = 0; i < 26; i++) {
        const y = HOR + 12 + azar() * 260, w = 20 + azar() * 60, x = 820 + (azar() - 0.5) * (80 + (y - HOR) * 0.9);
        partes.push({nombre: `brillo_${i}`, capa: 2, en: [r2(x), r2(y)], poligono: mancha(0, 0, w, 3, 10, 0.3), color: "rgba(255,240,200,0.8)", borde: TRANSP,
            claves: {opacidad: ciclo(DUR, (u) => 0.35 + 0.65 * Math.max(0, Math.sin(TAU * u + i * 1.3))), escala_x: ciclo(DUR, (u) => 0.8 + 0.3 * Math.sin(TAU * u * 2 + i))}, bucle: "repetir"});
    }
    // ondas oscuras
    for (let i = 0; i < 18; i++) {
        const y = HOR + 30 + azar() * 380, x = -100 + azar() * 1500;
        partes.push({nombre: `onda_${i}`, capa: 2, en: [r2(x), r2(y)], poligono: mancha(0, 0, 40 + azar() * 70, 2.5, 10, 0.3), color: "rgba(40,80,110,0.4)", borde: TRANSP,
            claves: {x: ciclo(DUR * 2, (u) => r2(x + 20 * Math.sin(TAU * u + i)))}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Lago", duracion: DUR * 2, marcas, partes};
}

// ------------------------------------------------------------------ BARCAS (pies = linea de flotacion en 0,0; se mecen)
const casco = (nombre, largo, color) => ({nombre, poligono: [[-largo, -26], [largo, -26], [largo * 0.82, -4], [largo * 0.55, 6], [-largo * 0.6, 6], [-largo * 0.85, -4]], color, borde: TRANSP});
function barcaPescador() {
    const partes = [
        {nombre: "barca", pivote: [0, 0], partes: [
            casco("casco", 110, "rgba(150,90,55,0.85)"),
            {nombre: "borda", rect: [-110, -30, 110, -24], color: "rgba(100,55,35,0.85)", borde: TRANSP},
            {nombre: "franja", poligono: [[-100, -18], [100, -18], [96, -12], [-96, -12]], color: "rgba(230,200,120,0.75)", borde: TRANSP},
            // pescador sentado con sombrero
            {nombre: "pescador", en: [-20, -30], partes: [
                {nombre: "torso", poligono: [[-14, 0], [14, 0], [10, -40], [-10, -40]], color: "rgba(70,100,150,0.85)", borde: TRANSP},
                {nombre: "cabeza", en: [0, -50], circulo: {r: 10, lados: 14}, color: "rgba(235,190,150,0.9)", borde: TRANSP},
                {nombre: "sombrero", en: [0, -58], poligono: [[-20, 2], [20, 2], [10, -4], [6, -14], [-6, -14], [-10, -4]], color: "rgba(220,190,110,0.9)", borde: TRANSP},
                {nombre: "brazo", pivote: [6, -34], partes: [
                    {nombre: "manga", poligono: [[2, -36], [10, -36], [26, -22], [20, -16]], color: "rgba(70,100,150,0.85)", borde: TRANSP},
                    // cana con hilo y boya
                    {nombre: "cana", en: [24, -20], pivote: [0, 0], partes: [
                        {nombre: "vara", poligono: [[-1.5, 0], [1.5, 0], [150, -110], [148, -112]], color: "rgba(80,50,30,0.9)", borde: TRANSP},
                        {nombre: "hilo", poligono: [[149, -111], [150, -111], [190, 60], [189, 60]], color: "rgba(60,60,60,0.6)", borde: TRANSP},
                        {nombre: "boya", en: [190, 60], circulo: {r: 4, lados: 10}, color: "rgba(220,60,40,0.95)", borde: TRANSP},
                    ]},
                ]},
            ]},
        ]},
    ];
    const params = {rot: ["barca", "rotacion"], y: ["barca", "y"], br: ["brazo", "rotacion"], cana: ["cana", "rotacion"]};
    const base = {rot: 0, y: 0, br: 0, cana: 0};
    const mecer = (tl) => ({rot: 3 * Math.sin(TAU * tl / 3000), y: 3 * Math.sin(TAU * tl / 1500)});
    const acciones = [
        {nombre: "Esperar", dur: 3000, pose: (tl) => ({...mecer(tl), cana: 2 * Math.sin(TAU * tl / 1500)})},
        // lanza: lleva la cana atras y la tira hacia adelante; despues espera
        {nombre: "Lanzar", dur: 2400, pose: (tl) => { const atras = tramo(tl, 0, 600) - tramo(tl, 700, 900); return {...mecer(tl), br: -40 * atras + 10 * tramo(tl, 700, 900) * (1 - tramo(tl, 1200, 1800)), cana: -50 * atras + 12 * tramo(tl, 700, 900) * (1 - tramo(tl, 1000, 1800))}; }},
    ];
    return asset("Barca con pescador", acciones, params, base, partes);
}
const barcaVacia = () => ({tipo: "asset", nombre: "Barca vacía", duracion: 3600, marcas, partes: [
    {nombre: "barca", pivote: [0, 0], claves: {rotacion: ciclo(3600, (u) => 4 * Math.sin(TAU * u)), y: ciclo(3600, (u) => 3 * Math.sin(TAU * u * 2 + 1))}, bucle: "repetir", partes: [
        casco("casco", 80, "rgba(120,140,110,0.85)"),
        {nombre: "borda", rect: [-80, -30, 80, -24], color: "rgba(80,90,70,0.85)", borde: TRANSP},
        {nombre: "remo", poligono: [[-30, -28], [-26, -30], [50, 10], [56, 22], [46, 18]], color: "rgba(160,120,70,0.85)", borde: TRANSP},
    ]},
]});

// ------------------------------------------------------------------ JUNCOS (primer plano; se mecen)
function juncos() {
    const partes = [];
    for (let i = 0; i < 14; i++) {
        const x = i * 14 + (azar() - 0.5) * 8, h = 120 + azar() * 90, curva = (azar() - 0.5) * 30;
        partes.push({nombre: `junco_${i}`, pivote: [x, 0], poligono: [[x - 2.5, 0], [x + 2.5, 0], [r2(x + curva + 1), r2(-h)], [r2(x + curva - 1), r2(-h)]], color: `rgba(${70 + i * 3},${100 + i * 2},50,0.8)`, borde: TRANSP,
            claves: {rotacion: ciclo(2600 + i * 120, (u) => 3 * Math.sin(TAU * u + i))}, bucle: "repetir"});
        if (i % 3 === 0) partes.push({nombre: `espiga_${i}`, en: [r2(x + curva), r2(-h + 10)], poligono: mancha(0, 0, 4, 16, 10, 0.1), color: "rgba(110,70,40,0.85)", borde: TRANSP});
    }
    return {tipo: "asset", nombre: "Juncos", duracion: 4000, marcas, partes};
}

// ------------------------------------------------------------------ BANDADA (trazos de tinta que aletean)
function bandada() {
    const pajaro = (n, x, y, fase) => ({nombre: n, en: [x, y], poligono: [[-9, 0], [-4, -4], [0, 0], [4, -4], [9, 0], [4, -2], [0, 2], [-4, -2]], color: "rgba(50,45,60,0.85)", borde: TRANSP,
        formas: {abajo: {poligono: [[-9, 3], [-4, 1], [0, 0], [4, 1], [9, 3], [4, 2], [0, 2], [-4, 2]]}},
        claves: {forma: [[0, fase ? "abajo" : "", "lineal"], [220, fase ? "" : "abajo", "lineal"], [440, fase ? "abajo" : "", "lineal"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Bandada de acuarela", duracion: 440, marcas, partes: [[0, 0], [-20, 10], [-40, 20], [20, 10], [40, 20], [-60, 30], [60, 30]].map(([x, y], i) => pajaro(`pajaro_${i}`, x, y, i % 2))};
}

// ------------------------------------------------------------------ LA ESCENA (camara fija; 15 s)
function escena() {
    const DUR = 15000;
    // reflejo: el mismo asset espejado hacia abajo desde el horizonte, mas tenue y con un temblor horizontal
    const reflejo = (inst, nombre, x, plano, opac = 0.42, extra = {}) => ({instancia: inst, nombre, en: [x, HOR], plano, escala: [1, -1], opacidad: opac, ...extra,
        claves: {...(extra.claves || {}), x: ciclo(2400, (u) => r2(x + 3 * Math.sin(TAU * u))).map(([t, v, i]) => [t, v, i])}});
    const temblor = (x, dur) => { const r = []; for (let t = 0; t <= DUR; t += 300) r.push([t, r2(x + 3 * Math.sin(TAU * t / dur)), "suave"]); return r; };
    return {
        tipo: "escena", nombre: "Barcas en el lago", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {acuarela: {desplazar: 3, escala: 22, velocidad: 0.35, lavado: 1.4, borde: 0.55, transparencia: 0.1}, papel: {intensidad: 0.045, fibras: 0.25, escala: 1.6}},
        camara: {tamano: [1280, 720], centro: [640, 380], zoom: 1, claves: {zoom: [[0, 1], [DUR, 1.08, "suave"]], x: [[0, 640], [DUR, 670, "suave"]]}},
        objetos: [
            {instancia: "Cielo de acuarela", nombre: "cielo", en: [0, 0], plano: -10},
            {instancia: "Sol del alba", nombre: "sol", en: [820, HOR - 20], plano: -9.5, claves: {y: [[0, HOR - 90], [DUR, HOR - 230, "suave"]]}},
            {instancia: "Nube de acuarela", nombre: "nube_1", en: [300, 140], plano: -9, claves: {x: [[0, 250], [DUR, 420, "lineal"]]}},
            {instancia: "Nube de acuarela", nombre: "nube_2", en: [1000, 90], plano: -9, escala: 0.8, claves: {x: [[0, 980], [DUR, 1120, "lineal"]]}},
            {instancia: "Montañas lejanas", nombre: "montanas_lejos", en: [0, HOR], plano: -8},
            {instancia: "Montañas cercanas", nombre: "montanas_cerca", en: [0, HOR], plano: -7},
            {instancia: "Pinos de la orilla", nombre: "pinos", en: [0, HOR], plano: -6},
            {instancia: "Lago", nombre: "lago", en: [0, 0], plano: -5},
            // reflejos (encima del agua, debajo de las barcas)
            {instancia: "Montañas lejanas", nombre: "reflejo_lejos", en: [0, HOR], plano: -4.8, escala: [1, -0.85], opacidad: 0.35, claves: {x: temblor(0, 2600)}},
            {instancia: "Montañas cercanas", nombre: "reflejo_cerca", en: [0, HOR], plano: -4.7, escala: [1, -0.9], opacidad: 0.4, claves: {x: temblor(0, 2200)}},
            {instancia: "Pinos de la orilla", nombre: "reflejo_pinos", en: [0, HOR], plano: -4.6, escala: [1, -0.9], opacidad: 0.45, claves: {x: temblor(0, 1800)}},
            {instancia: "Sol del alba", nombre: "reflejo_sol", en: [820, HOR + 90], plano: -4.5, escala: [0.7, -1.5], opacidad: 0.3, claves: {y: [[0, HOR + 90], [DUR, HOR + 230, "suave"]]}},
            {instancia: "Bandada de acuarela", nombre: "bandada", en: [-100, 160], plano: -3, claves: {x: [[2000, -100], [11000, 1400, "lineal"]], y: [[2000, 180], [11000, 110, "suave"]]}},
            // barcas y sus reflejos
            {instancia: "Barca vacía", nombre: "reflejo_barca_2", en: [980, 520], plano: -2.5, escala: [0.8, -0.8], opacidad: 0.35, desfase: 900},
            {instancia: "Barca vacía", nombre: "barca_2", en: [980, 520], plano: -2, escala: 0.8, desfase: 900},
            {instancia: "Barca con pescador", nombre: "reflejo_barca_1", en: [520, 600], plano: -1.5, escala: [1.1, -1.1], opacidad: 0.3, acciones: [[0, "Esperar"], [5200, "Lanzar", false], [7600, "Esperar"]]},
            {instancia: "Barca con pescador", nombre: "barca_1", en: [520, 600], plano: -1, escala: 1.1, acciones: [[0, "Esperar"], [5200, "Lanzar", false], [7600, "Esperar"]]},
            {instancia: "Juncos", nombre: "juncos", en: [20, 760], plano: 2, escala: 1.4},
            {instancia: "Juncos", nombre: "juncos_2", en: [1130, 780], plano: 2, escala: 1.2, desfase: 1300},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cielo(), sol(), nube(), montanasLejos(), montanasCerca(), pinos(), lago(), barcaPescador(), barcaVacia(), juncos(), bandada()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
