// Pruebas de arte (planeacion_pruebas_arte.md), fase 7: TEATRO DE SOMBRAS.
// Escena original: "El viaje del farolero". Al caer la tarde, un farolero (marioneta de sombra con sus
// varillas de control a la vista) recorre una calle de tejados encendiendo los faroles uno por uno; el
// cielo pasa del atardecer a la noche, salen las estrellas y un gato lo mira desde un tejado.
// Sin capacidades nuevas: siluetas negras, degradados, articulaciones y opacidad; el estilo solo agrega
// el resplandor de las luces (fase 3) y una textura muy suave de tela (fase 4).
//   asset_01 Cielo del atardecer, 02 Cielo de noche, 03 Sol poniente, 04 Tejados, 05 Farol de sombra,
//   06 Farolero, 07 Gato de sombra, 08 Árbol de encaje, 09 Bandada, 10 Marco del teatro;  escena.json (18 s)
//   node herramientas/ejemplos/arte/sombras/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(19);
const N = "#0b0807";
const LEJOS = "#2a1c2e";                   // la fila de casas del fondo (sombra mas lejana: un poco mas clara)                       // la sombra (casi negra, un poco calida)
const CALLE = 600;                         // linea del suelo
const FAROLES = [420, 820, 1220, 1620, 2020];

// ------------------------------------------------------------------ CIELOS (origen arriba a la izquierda; 3200 x 800)
const cieloTarde = () => ({tipo: "asset", nombre: "Cielo del atardecer", duracion: 1000, marcas, partes: [
    {nombre: "cielo", capa: 0, rect: [-400, -100, 2800, 800], degradado: lineal([0, -100], [0, 620], [[0, "#3b2a6a"], [0.45, "#c2507a"], [0.75, "#f08a4a"], [1, "#ffd27a"]])},
]});
function cieloNoche() {
    const partes = [{nombre: "cielo", capa: 0, rect: [-400, -100, 2800, 800], degradado: lineal([0, -100], [0, 620], [[0, "#070a24"], [0.6, "#1a2050"], [1, "#3a2f5a"]])}];
    for (let i = 0; i < 80; i++) partes.push({nombre: `estrella_${i}`, capa: 1, en: [r2(-350 + azar() * 3100), r2(-80 + azar() * 460)], circulo: {r: r2(1 + azar() * 2), lados: 6}, color: "#fff6dc",
        claves: {opacidad: ciclo(2600, (u) => 0.55 + 0.45 * Math.sin(TAU * u + i * 2.1))}, bucle: "repetir"});
    partes.push({nombre: "luna", capa: 1, en: [1900, 130], partes: [
        {nombre: "luna_halo", circulo: {r: 110, lados: 32}, degradado: radial([0, 0], 110, [[0, "rgba(255,240,200,0.35)"], [1, "rgba(255,240,200,0)"]]), borde: TRANSP},
        {nombre: "luna_disco", circulo: {r: 46, lados: 32}, color: "#fff2c8"},
        {nombre: "luna_mordida", en: [18, -10], circulo: {r: 42, lados: 32}, color: "#101436"},
    ]});
    return {tipo: "asset", nombre: "Cielo de noche", duracion: 2600, marcas, partes};
}
const solPoniente = () => ({tipo: "asset", nombre: "Sol poniente", duracion: 1000, marcas, partes: [
    {nombre: "halo", circulo: {r: 260, lados: 40}, degradado: radial([0, 0], 260, [[0, "rgba(255,230,150,0.55)"], [1, "rgba(255,230,150,0)"]]), borde: TRANSP},
    {nombre: "disco", circulo: {r: 90, lados: 40}, color: "#fff0b0"},
]});

// ------------------------------------------------------------------ TEJADOS (siluetas con ventanas recortadas; origen arriba a la izquierda)
function tejados() {
    const partes = [{nombre: "suelo", capa: 0, rect: [-400, CALLE, 2800, 900], color: N}];
    let x = -400, k = 0;
    while (x < 2800) {
        const w = 160 + azar() * 140, h = 90 + azar() * 90, top = CALLE - h, tipo = k % 3;
        const techo = tipo === 0 ? [[x, top], [x + w / 2, top - 70], [x + w, top]] : tipo === 1 ? [[x, top], [x + w * 0.2, top - 50], [x + w * 0.8, top - 50], [x + w, top]] : [[x, top], [x + w, top - 40]];
        partes.push({nombre: `casa_${k}`, capa: 1, poligono: [...techo, [x + w, CALLE], [x, CALLE]].map(([a, b]) => [r2(a), r2(b)]), color: LEJOS});
        // chimenea con humo de sombra
        if (k % 2 === 0) {
            const cx = x + w * 0.7;
            partes.push({nombre: `chimenea_${k}`, capa: 1, rect: [r2(cx), r2(top - 60), r2(cx + 22), r2(top)], color: LEJOS});
        }
        // ventanas: recortes encendidos (luz calida) que se prenden de a poco al anochecer
        for (let f = 0; f < 2; f++) for (let c = 0; c < 2; c++) {
            if (azar() < 0.35) continue;
            const vx = x + 30 + c * (w - 90), vy = top + 22 + f * 46, enciende = 3000 + azar() * 9000;
            partes.push({nombre: `ventana_${k}_${f}_${c}`, capa: 2, partes: [
                {nombre: `vidrio_${k}_${f}_${c}`, rect: [r2(vx), r2(vy), r2(vx + 30), r2(vy + 38)], color: "#ffcf6a"},
                {nombre: `cruz_v_${k}_${f}_${c}`, rect: [r2(vx + 13), r2(vy), r2(vx + 17), r2(vy + 38)], color: LEJOS},
                {nombre: `cruz_h_${k}_${f}_${c}`, rect: [r2(vx), r2(vy + 17), r2(vx + 30), r2(vy + 21)], color: LEJOS},
            ], claves: {opacidad: [[0, 0, "mantener"], [Math.round(enciende), 1, "mantener"], [18000, 1]]}});
        }
        x += w; k++;
    }
    return {tipo: "asset", nombre: "Tejados", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ FAROL (poste de hierro con adornos; acciones Apagado y Encendido)
function farolSombra() {
    const partes = [
        {nombre: "poste", capa: 1, rect: [-4, -230, 4, 0], color: N},
        {nombre: "base", capa: 1, poligono: [[-16, 0], [-10, -24], [10, -24], [16, 0]], color: N},
        {nombre: "voluta_1", capa: 1, poligono: ovalo(-16, -200, 12, 12, 12).concat(ovalo(-16, -200, 7, 7, 12).reverse()), color: N},
        {nombre: "voluta_2", capa: 1, poligono: ovalo(16, -200, 12, 12, 12).concat(ovalo(16, -200, 7, 7, 12).reverse()), color: N},
        {nombre: "luz", capa: 0, en: [0, -258], circulo: {r: 130, lados: 32}, degradado: radial([0, 0], 130, [[0, "rgba(255,210,120,0.95)"], [0.25, "rgba(255,190,90,0.5)"], [1, "rgba(255,170,70,0)"]]), borde: TRANSP},
        {nombre: "llama", capa: 2, en: [0, -258], poligono: [[0, -14], [6, -2], [4, 6], [0, 9], [-4, 6], [-6, -2]], color: "#fff0b0"},
        {nombre: "farola", capa: 3, en: [0, -258], partes: [
            {nombre: "farola_marco_i", poligono: [[-18, -18], [-14, -18], [-10, 22], [-14, 22]], color: N},
            {nombre: "farola_marco_d", poligono: [[14, -18], [18, -18], [14, 22], [10, 22]], color: N},
            {nombre: "farola_techo", poligono: [[-24, -18], [0, -40], [24, -18]], color: N},
            {nombre: "farola_punta", en: [0, -44], circulo: {r: 5, lados: 10}, color: N},
            {nombre: "farola_base", rect: [-16, 22, 16, 28], color: N},
        ]},
    ];
    const params = {luz: ["luz", "opacidad"], llama: ["llama", "opacidad"], le: ["llama", "escala_y"], lz: ["luz", "escala_x"], lzy: ["luz", "escala_y"]};
    const base = {luz: 0, llama: 0, le: 1, lz: 1, lzy: 1};
    const acciones = [
        {nombre: "Apagado", dur: 1000, pose: () => ({})},
        {nombre: "Encendido", dur: 1600, pose: (tl) => { const k = tramo(tl, 0, 500), s = 0.92 + 0.08 * Math.sin(TAU * tl / 400);
            return {luz: k * s, llama: k, le: (0.6 + 0.4 * k) * (1 + 0.15 * Math.sin(TAU * tl / 260)), lz: 0.6 + 0.4 * k * s, lzy: 0.6 + 0.4 * k * s}; }},
    ];
    // "Encendido" en bucle despues de la primera vez: la escena lo usa con bucle (el tramo inicial vuelve a 0..1 -> se usa una accion aparte)
    acciones.push({nombre: "Ardiendo", dur: 1600, pose: (tl) => { const s = 0.92 + 0.08 * Math.sin(TAU * tl / 400); return {luz: s, llama: 1, le: 1 + 0.15 * Math.sin(TAU * tl / 260), lz: s, lzy: s}; }});
    return asset("Farol de sombra", acciones, params, base, partes);
}

// ------------------------------------------------------------------ FAROLERO (marioneta de sombra; mira a la derecha; pies en 0,0; ~190 de alto)
// Articulaciones con broches (pequenos circulos con luz) y VARILLAS de control: una al cuerpo y otra a la mano,
// que bajan hasta fuera del cuadro (asi se ve que es una marioneta).
function farolero() {
    const broche = (n, x, y) => ({nombre: n, en: [x, y], circulo: {r: 2.2, lados: 8}, color: "#6a4a30"});
    const partes = [
        {nombre: "varilla_cuerpo", capa: 0, poligono: [[-1, -100], [1, -100], [2, 260], [0, 260]], color: N},
        {nombre: "cuerpo", capa: 1, pivote: [0, -90], partes: [
            {nombre: "pierna_a", pivote: [-4, -70], partes: [
                {nombre: "pierna_a_s", poligono: [[-9, -72], [1, -72], [0, -6], [-8, -6]], color: N},
                {nombre: "bota_a", poligono: [[-10, -8], [8, -8], [14, 0], [-10, 0]], color: N}, broche("broche_pa", -4, -70)]},
            {nombre: "pierna_b", pivote: [5, -70], partes: [
                {nombre: "pierna_b_s", poligono: [[0, -72], [10, -72], [9, -6], [1, -6]], color: N},
                {nombre: "bota_b", poligono: [[-1, -8], [17, -8], [23, 0], [-1, 0]], color: N}, broche("broche_pb", 5, -70)]},
            // abrigo con faldon recortado en picos (tipico de las marionetas de sombra)
            {nombre: "abrigo", poligono: [[-20, -150], [14, -152], [22, -100], [26, -66], [18, -72], [12, -62], [4, -72], [-4, -62], [-12, -72], [-20, -62], [-26, -70], [-22, -110]], color: N},
            // calado: dos "botones" de luz en el abrigo (agujeros por donde pasa la luz)
            ...[[-2, -130], [0, -112], [2, -94]].map(([x, y], i) => ({nombre: `boton_${i}`, en: [x, y], circulo: {r: 2.4, lados: 8}, color: "#d27a3a"})),
            {nombre: "cabeza", en: [0, -164], pivote: [0, 10], partes: [
                {nombre: "cara", poligono: [[-9, 10], [-10, -6], [-2, -14], [8, -12], [12, -2], [17, 2], [11, 5], [10, 12], [0, 14]], color: N},
                {nombre: "gorra_copa", poligono: [[-12, -10], [-10, -32], [10, -30], [12, -10]], color: N},
                {nombre: "gorra_ala", poligono: [[-16, -10], [20, -12], [20, -8], [-16, -6]], color: N},
                {nombre: "ojo", en: [7, -3], circulo: {r: 1.6, lados: 6}, color: "#d27a3a"},
                {nombre: "bigote", poligono: [[6, 4], [16, 3], [12, 7], [6, 7]], color: N},
                broche("broche_cab", 0, 10),
            ]},
            {nombre: "brazo", pivote: [4, -142], partes: [
                {nombre: "brazo_s", poligono: [[0, -146], [10, -146], [12, -92], [2, -92]], color: N},
                {nombre: "mano", en: [7, -88], circulo: {r: 5, lados: 10}, color: N},
                broche("broche_br", 4, -142),
                // la vara del farolero, con la mecha encendida en la punta
                {nombre: "vara", en: [7, -88], pivote: [0, 0], partes: [
                    {nombre: "vara_s", poligono: [[-1.5, 30], [1.5, 30], [1.5, -170], [-1.5, -170]], color: N},
                    {nombre: "gancho", poligono: [[0, -170], [12, -182], [16, -176], [4, -166]], color: N},
                    {nombre: "mecha", en: [14, -186], partes: [
                        {nombre: "mecha_luz", circulo: {r: 26, lados: 16}, degradado: radial([0, 0], 26, [[0, "rgba(255,200,110,0.9)"], [1, "rgba(255,180,90,0)"]]), borde: TRANSP},
                        {nombre: "mecha_llama", poligono: [[0, -6], [3, 0], [0, 4], [-3, 0]], color: "#fff0b0"},
                    ]},
                ]},
                // varilla de control de la mano (baja hasta fuera del cuadro)
                {nombre: "varilla_mano", poligono: [[6, -88], [8, -88], [40, 260], [38, 260]], color: N},
            ]},
        ]},
    ];
    const params = {pa: ["pierna_a", "rotacion"], pb: ["pierna_b", "rotacion"], cy: ["cuerpo", "y"], br: ["brazo", "rotacion"], va: ["vara", "rotacion"], cab: ["cabeza", "rotacion"]};
    const base = {pa: 0, pb: 0, cy: 0, br: 0, va: 0, cab: 0};
    const acciones = [
        // paso de marioneta: un balanceo de pendulo (las piernas cuelgan y se mecen), con saltito
        {nombre: "Caminar", dur: 900, pose: (tl, d) => { const th = TAU * tl / d; return {pa: 20 * Math.sin(th), pb: -20 * Math.sin(th), cy: -5 * Math.abs(Math.sin(th)), br: 10 + 6 * Math.sin(th), va: -14, cab: 3 * Math.sin(th * 2)}; }},
        // levanta la vara hacia el farol, la sostiene y la baja
        {nombre: "Encender", dur: 1400, pose: (tl) => { const k = tramo(tl, 0, 400) - tramo(tl, 1000, 1400); return {br: 10 - 75 * k, va: -14 + 34 * k, cab: -16 * k, cy: -3 * k}; }},
    ];
    return asset("Farolero", acciones, params, base, partes);
}

// ------------------------------------------------------------------ GATO DE SOMBRA (sentado en un tejado; mueve la cola y la cabeza)
const gatoSombra = () => ({tipo: "asset", nombre: "Gato de sombra", duracion: 3000, marcas, partes: [
    {nombre: "cuerpo", poligono: [[-14, 0], [-18, -20], [-12, -38], [0, -44], [10, -38], [14, -20], [16, 0]], color: N},
    {nombre: "cabeza", en: [4, -50], pivote: [0, 6], partes: [
        {nombre: "craneo", poligono: ovalo(0, 0, 11, 10, 14), color: N},
        {nombre: "oreja_1", poligono: [[-9, -4], [-7, -18], [-1, -8]], color: N},
        {nombre: "oreja_2", poligono: [[1, -8], [7, -18], [9, -4]], color: N},
        {nombre: "ojo_1", en: [-4, -1], poligono: [[-2.5, 0], [0, -1.6], [2.5, 0], [0, 1.6]], color: "#f2d26a"},
        {nombre: "ojo_2", en: [5, -1], poligono: [[-2.5, 0], [0, -1.6], [2.5, 0], [0, 1.6]], color: "#f2d26a"},
    ], claves: {rotacion: [[0, 0, "suave"], [1200, 0, "suave"], [1600, 14, "suave"], [2600, 14, "suave"], [3000, 0, "suave"]]}, bucle: "repetir"},
    {nombre: "cola", pivote: [-14, -4], poligono: [[-14, -2], [-34, -6], [-44, -24], [-40, -40], [-36, -38], [-38, -24], [-30, -10], [-14, -8]], color: N,
        claves: {rotacion: ciclo(3000, (u) => 12 * Math.sin(TAU * u))}, bucle: "repetir"},
]});

// ------------------------------------------------------------------ ARBOL DE ENCAJE (tronco y copa calada; pies en 0,0)
function arbolEncaje() {
    const partes = [{nombre: "tronco", capa: 0, poligono: [[-12, 0], [12, 0], [8, -120], [24, -170], [16, -172], [4, -140], [-4, -175], [-12, -172], [-6, -120]], color: N}];
    // copa: muchas hojitas separadas (el "encaje": se ve el cielo entre ellas)
    for (let i = 0; i < 70; i++) {
        const a = azar() * TAU, d = Math.sqrt(azar()) * 90, x = Math.cos(a) * d * 1.2, y = -230 + Math.sin(a) * d * 0.8;
        partes.push({nombre: `hoja_${i}`, capa: 1, en: [r2(x), r2(y)], rotacion: r2(azar() * 180), poligono: [[0, -9], [5, 0], [0, 9], [-5, 0]], color: N});
    }
    return {tipo: "asset", nombre: "Árbol de encaje", duracion: 4000, marcas, partes: [
        partes[0], {nombre: "copa", capa: 1, pivote: [0, -170], partes: partes.slice(1), claves: {rotacion: ciclo(4000, (u) => 1.5 * Math.sin(TAU * u))}, bucle: "repetir"}]};
}

// ------------------------------------------------------------------ BANDADA (pajaros en V que aletean; centro en 0,0)
function bandada() {
    const pajaro = (n, x, y, fase) => ({nombre: n, en: [x, y], poligono: [[-10, 0], [-4, -3], [0, 0], [4, -3], [10, 0], [4, -1], [0, 2], [-4, -1]], color: N,
        formas: {abajo: {poligono: [[-10, 3], [-4, 1], [0, 0], [4, 1], [10, 3], [4, 2], [0, 2], [-4, 2]]}},
        claves: {forma: [[0, fase ? "abajo" : "", "lineal"], [200, fase ? "" : "abajo", "lineal"], [400, fase ? "abajo" : "", "lineal"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Bandada", duracion: 400, marcas, partes: [[0, 0], [-22, 12], [-44, 24], [22, 12], [44, 24], [-66, 36]].map(([x, y], i) => pajaro(`pajaro_${i}`, x, y, i % 2))};
}

// ------------------------------------------------------------------ MARCO DEL TEATRO (bordes oscuros y vineta calida: fijo a la camara)
const marco = () => ({tipo: "asset", nombre: "Marco del teatro", duracion: 1000, marcas, partes: [
    {nombre: "vineta", capa: 0, rect: [-700, -400, 700, 400], degradado: radial([0, 0], 760, [[0, "rgba(0,0,0,0)"], [0.6, "rgba(0,0,0,0)"], [0.85, "rgba(20,8,0,0.45)"], [1, "rgba(10,4,0,0.85)"]]), borde: TRANSP},
    {nombre: "borde_arriba", capa: 1, rect: [-700, -400, 700, -340], color: N},
    {nombre: "festón", capa: 1, poligono: Array.from({length: 29}, (_, i) => [-700 + i * 50, i % 2 ? -312 : -340]).concat([[700, -340], [700, -400], [-700, -400]]), color: N},
    {nombre: "borde_abajo", capa: 1, rect: [-700, 330, 700, 400], color: N},
]});

// ------------------------------------------------------------------ LA ESCENA (18 s)
function escena() {
    const DUR = 18000, VEL = 0.21;   // px por ms
    // recorrido del farolero: camina, se para delante de cada farol, lo enciende y sigue
    const xs = [[0, 150, "lineal"]], acc = [[0, "Caminar"]], encendidos = [];
    let t = 0, x = 150;
    for (const fx of FAROLES) {
        const parar = fx - 70, dt = Math.round((parar - x) / VEL);
        t += dt; x = parar; xs.push([t, x, "lineal"]);
        acc.push([t, "Encender", false]); encendidos.push(t + 450);
        t += 1400; xs.push([t, x, "lineal"]); acc.push([t, "Caminar"]);
    }
    const fin = Math.min(DUR, t + Math.round((2500 - x) / VEL)); xs.push([fin, r2(x + (fin - t) * VEL), "lineal"]);
    const camX = xs.map(([tt, xx]) => [tt, r2(Math.min(1900, Math.max(640, xx + 160))), "suave"]);
    return {
        tipo: "escena", nombre: "El viaje del farolero", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.62, radio: 18, intensidad: 1.1}, papel: {intensidad: 0.05, fibras: 0.2, escala: 1.5}},
        camara: {tamano: [1280, 720], centro: [640, 330], zoom: 1, claves: {x: camX}},
        objetos: [
            {instancia: "Cielo del atardecer", nombre: "cielo_tarde", en: [0, 0], plano: -10, claves: {x: camX.map(([tt, xx]) => [tt, r2((xx - 640) * 0.9), "suave"])}},
            {instancia: "Sol poniente", nombre: "sol", en: [900, 380], plano: -9.5, claves: {y: [[0, 380], [9000, 640, "suave"]], x: camX.map(([tt, xx]) => [tt, r2(900 + (xx - 640) * 0.85), "suave"])}},
            {instancia: "Cielo de noche", nombre: "cielo_noche", en: [0, 0], plano: -9, claves: {opacidad: [[0, 0], [3000, 0], [15000, 1, "suave"]], x: camX.map(([tt, xx]) => [tt, r2((xx - 640) * 0.9), "suave"])}},
            {instancia: "Bandada", nombre: "bandada", en: [200, 200], plano: -8, claves: {x: [[0, 200], [9000, 1700, "lineal"]], y: [[0, 220], [9000, 120, "suave"]], opacidad: [[0, 1], [8500, 1], [9000, 0]]}},
            {instancia: "Tejados", nombre: "tejados", en: [0, 0], plano: -6},
            {instancia: "Gato de sombra", nombre: "gato", en: [1224, CALLE - 300], plano: -2, escala: 1.3},
            ...[[90, 1.2], [1000, 0.9], [2300, 1.1]].map(([ax, e], i) => ({instancia: "Árbol de encaje", nombre: `arbol_${i}`, en: [ax, CALLE], plano: -4, escala: e, desfase: i * 900})),
            ...FAROLES.map((fx, i) => ({instancia: "Farol de sombra", nombre: `farol_${i}`, en: [fx, CALLE], plano: -3,
                acciones: [[0, "Apagado"], [encendidos[i], "Encendido", false], [encendidos[i] + 1600, "Ardiendo"]]})),
            {instancia: "Farolero", nombre: "farolero", en: [150, CALLE], plano: 0, escala: 1.15, claves: {x: xs}, acciones: acc},
            {instancia: "Marco del teatro", nombre: "marco", en: [640, 330], plano: 10, claves: {x: camX}},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cieloTarde(), cieloNoche(), solPoniente(), tejados(), farolSombra(), farolero(), gatoSombra(), arbolEncaje(), bandada(), marco()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
