// Pruebas de arte (planeacion_pruebas_arte.md), fase 9: PANTALLA CRT RETRO.
// Escena original: "Transmisión perdida". Un noticiero espacial de los 80 en un televisor 4:3: se enciende
// el tubo, una presentadora robot da las noticias, la senal se corta con estatica y aparece un mensaje
// misterioso de otro planeta; despues, la carta de ajuste y el estudio vuelve, desconcertado.
// El estilo (estilo.pantalla + resplandor) hace de tubo: barrido, curvatura, colores corridos, vineta y
// la estatica animada con estilo.claves.estatica.
//   asset_01 Estudio de noticias, 02 Robot presentadora, 03 Mensaje alienígena, 04 Carta de ajuste, 05 Encendido del tubo
//   escena.json (16 s, 960x720)
//   node herramientas/ejemplos/arte/crt/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(80);
const W = 960, H = 720;
// el "7" del canal como poligono
const siete = (x, y, s) => [[0, 0], [60, 0], [60, 14], [26, 90], [10, 90], [42, 14], [0, 14]].map(([a, b]) => [r2(x + a * s), r2(y + b * s)]);

// ------------------------------------------------------------------ ESTUDIO (origen arriba a la izquierda; 960x720)
function estudio() {
    const DUR = 2000, partes = [
        {nombre: "fondo", capa: 0, rect: [-50, -50, W + 50, H + 50], degradado: lineal([0, 0], [0, H], [[0, "#1a1050"], [0.6, "#3a1a70"], [1, "#12082a"]])},
    ];
    for (let i = 0; i < 9; i++) partes.push({nombre: `rejilla_${i}`, capa: 1, rect: [-50, 80 + i * 50, W + 50, 82 + i * 50], color: "rgba(120,90,255,0.25)", borde: TRANSP});
    // logo del canal: anillo con el 7
    partes.push({nombre: "logo", capa: 2, en: [190, 220], partes: [
        {nombre: "logo_anillo", poligono: ovalo(0, 0, 110, 110, 40).concat(ovalo(0, 0, 92, 92, 40).reverse()), color: "#ff9a2a"},
        {nombre: "logo_7", poligono: siete(-34, -54, 1.15), color: "#ffe14a"},
        {nombre: "logo_brillo", circulo: {r: 150, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 150, [[0, "rgba(255,160,60,0.3)"], [1, "rgba(255,160,60,0)"]]), borde: TRANSP},
    ], claves: {rotacion: ciclo(DUR * 4, (u) => 4 * Math.sin(TAU * u))}, bucle: "repetir"});
    // monitor detras con un planeta anillado y una flecha que late
    partes.push({nombre: "monitor", capa: 2, en: [740, 200], partes: [
        {nombre: "monitor_marco", rect: [-150, -110, 150, 110], color: "#2a2a3a"},
        {nombre: "monitor_vidrio", rect: [-138, -98, 138, 98], degradado: radial([0, 0], 170, [[0, "#0a3a5a"], [1, "#020a1a"]])},
        {nombre: "planeta", en: [-20, 0], circulo: {r: 50, lados: 32}, degradado: radial([-15, -15], 70, [[0, "#7ae0ff"], [1, "#1a5a9a"]])},
        {nombre: "anillo", en: [-20, 0], poligono: ovalo(0, 0, 86, 18, 32).concat(ovalo(0, 0, 70, 12, 32).reverse()), color: "#ffcf7a", rotacion: -14},
        {nombre: "flecha", en: [90, -40], poligono: [[-20, -6], [6, -6], [6, -16], [24, 0], [6, 16], [6, 6], [-20, 6]], color: "#ff4a6a", claves: {opacidad: ciclo(800, (u) => (u < 0.5 ? 1 : 0.2), 2, "mantener")}, bucle: "repetir"},
        {nombre: "en_vivo", en: [-110, -76], circulo: {r: 8, lados: 12}, color: "#ff2a2a", claves: {opacidad: ciclo(1000, (u) => (u < 0.5 ? 1 : 0.25), 2, "mantener")}, bucle: "repetir"},
        {nombre: "en_vivo_barra", rect: [-96, -82, -50, -70], color: "#ff2a2a"},
    ]});
    // escritorio
    partes.push({nombre: "escritorio", capa: 4, poligono: [[60, 520], [900, 520], [940, 720], [20, 720]], degradado: lineal([0, 520], [0, 720], [[0, "#c8c8e0"], [0.1, "#7a7aa0"], [1, "#2a2a40"]])});
    partes.push({nombre: "franja", capa: 5, rect: [40, 560, 920, 576], color: "#ff9a2a"});
    partes.push({nombre: "papeles", capa: 5, poligono: [[600, 520], [700, 516], [710, 528], [606, 532]], color: "#f0f0f0"});
    return {tipo: "asset", nombre: "Estudio de noticias", duracion: DUR * 4, marcas, partes};
}

// ------------------------------------------------------------------ ROBOT PRESENTADORA (busto detras del escritorio; pies = base del busto en 0,0)
function robot() {
    const barras = Array.from({length: 7}, (_, i) => ({nombre: `boca_${i}`, en: [-30 + i * 10, 34], pivote: [0, 0], rect: [-3, -14, 3, 0], color: "#4affd0"}));
    const partes = [
        {nombre: "torso", capa: 0, poligono: [[-110, 0], [-96, -150], [96, -150], [110, 0]], degradado: lineal([-110, 0], [110, 0], [[0, "#3a3a6a"], [0.5, "#6a6aa0"], [1, "#3a3a6a"]])},
        {nombre: "solapa_i", capa: 1, poligono: [[-40, -150], [-6, -150], [-20, -60]], color: "#2a2a50"},
        {nombre: "solapa_d", capa: 1, poligono: [[6, -150], [40, -150], [20, -60]], color: "#2a2a50"},
        {nombre: "corbata", capa: 2, poligono: [[-8, -150], [8, -150], [12, -70], [0, -56], [-12, -70]], color: "#ff4a6a"},
        {nombre: "cuello", capa: 1, rect: [-20, -176, 20, -148], color: "#8a8ab0"},
        {nombre: "cabeza", capa: 3, en: [0, -250], pivote: [0, 70], partes: [
            {nombre: "caja", rect: [-90, -76, 90, 76], degradado: lineal([-90, 0], [90, 0], [[0, "#9a9ac0"], [0.5, "#e0e0f0"], [1, "#8a8ab0"]])},
            {nombre: "pantalla_cara", rect: [-72, -58, 72, 58], color: "#081a20"},
            {nombre: "ojo_i", en: [-32, -14], poligono: ovalo(0, 0, 14, 18, 16), color: "#4affd0"},
            {nombre: "ojo_d", en: [32, -14], poligono: ovalo(0, 0, 14, 18, 16), color: "#4affd0"},
            ...barras,
            {nombre: "oreja_i", rect: [-102, -24, -90, 24], color: "#6a6a90"},
            {nombre: "oreja_d", rect: [90, -24, 102, 24], color: "#6a6a90"},
            {nombre: "antena", rect: [-2, -112, 2, -76], color: "#6a6a90"},
            {nombre: "antena_luz", en: [0, -116], circulo: {r: 9, lados: 12}, color: "#ff4a6a", claves: {opacidad: ciclo(900, (u) => (u < 0.5 ? 1 : 0.2), 2, "mantener")}, bucle: "repetir"},
        ]},
    ];
    const params = {cab: ["cabeza", "rotacion"], oi: ["ojo_i", "escala_y"], od: ["ojo_d", "escala_y"], oix: ["ojo_i", "escala_x"], odx: ["ojo_d", "escala_x"],
        ...Object.fromEntries(barras.map((b, i) => [`b${i}`, [b.nombre, "escala_y"]]))};
    const base = {cab: 0, oi: 1, od: 1, oix: 1, odx: 1, ...Object.fromEntries(barras.map((_, i) => [`b${i}`, 0.2]))};
    const parpadeo = (tl, d) => (Math.abs(tl - d * 0.6) < 70 ? 0.1 : 1);
    const acciones = [
        {nombre: "Hablar", dur: 1600, pose: (tl, d) => { const o = {cab: 3 * Math.sin(TAU * tl / d), oi: parpadeo(tl, d), od: parpadeo(tl, d)};
            barras.forEach((_, i) => { o[`b${i}`] = 0.2 + 0.8 * Math.abs(Math.sin(TAU * tl / (180 + i * 37) + i * 1.3)) * (1 - Math.abs(i - 3) * 0.12); }); return o; }},
        {nombre: "Quieto", dur: 2000, pose: (tl, d) => ({cab: 1.5 * Math.sin(TAU * tl / d), oi: parpadeo(tl, d), od: parpadeo(tl, d)})},
        // desconcertada: inclina la cabeza, un ojo grande y otro chico
        {nombre: "Confundida", dur: 2400, pose: (tl) => { const k = tramo(tl, 0, 400); return {cab: -14 * k + 2 * Math.sin(TAU * tl / 1200), oi: 1 + 0.4 * k, oix: 1 + 0.3 * k, od: 1 - 0.5 * k, odx: 1 - 0.2 * k}; }},
    ];
    return asset("Robot presentadora", acciones, params, base, partes);
}

// ------------------------------------------------------------------ MENSAJE ALIENIGENA (pantalla completa)
function mensaje() {
    const DUR = 4000, glifo = (k) => [[[-8, -8], [8, -8], [8, -4], [-4, -4], [-4, 8], [-8, 8]], [[-8, -8], [-4, -8], [0, 0], [4, -8], [8, -8], [0, 8]], [[-8, 0], [0, -8], [8, 0], [0, 8]], [[-8, -2], [8, -2], [8, 2], [-8, 2]], [[-2, -8], [2, -8], [2, 8], [-2, 8]]][k % 5];
    return {tipo: "asset", nombre: "Mensaje alienígena", duracion: DUR, marcas, partes: [
        {nombre: "fondo", capa: 0, rect: [-50, -50, W + 50, H + 50], degradado: radial([W / 2, H / 2], 600, [[0, "#0a3a1a"], [1, "#000a02"]])},
        {nombre: "anillo_glifos", capa: 1, en: [W / 2, H / 2 - 20], partes: Array.from({length: 16}, (_, i) => { const a = i / 16 * TAU; return {nombre: `glifo_${i}`, en: [r2(Math.cos(a) * 250), r2(Math.sin(a) * 250)], poligono: glifo(i), color: "#5aff7a"}; }),
            claves: {rotacion: [[0, 0, "lineal"], [DUR, 90, "lineal"]]}, bucle: "repetir"},
        {nombre: "alien", capa: 2, en: [W / 2, H / 2 + 10], partes: [
            {nombre: "cabeza", poligono: ovalo(0, -40, 120, 150, 40, (a) => (Math.sin(a) > 0 ? 0.75 + 0.25 * Math.cos(a) ** 2 : 1)), degradado: radial([0, -80], 200, [[0, "#3a8a4a"], [1, "#0a2a12"]])},
            {nombre: "ojo_i", en: [-50, -40], rotacion: 25, poligono: ovalo(0, 0, 40, 22, 20), color: "#000000"},
            {nombre: "ojo_d", en: [50, -40], rotacion: -25, poligono: ovalo(0, 0, 40, 22, 20), color: "#000000"},
            {nombre: "brillo_i", en: [-58, -48], circulo: {r: 6, lados: 10}, color: "#c8ffd0"},
            {nombre: "brillo_d", en: [42, -48], circulo: {r: 6, lados: 10}, color: "#c8ffd0"},
            {nombre: "boca", en: [0, 40], rect: [-12, -1.5, 12, 1.5], color: "#000000"},
        ], claves: {escala_x: ciclo(DUR, (u) => 1 + 0.03 * Math.sin(TAU * u * 2)), escala_y: ciclo(DUR, (u) => 1 + 0.03 * Math.sin(TAU * u * 2))}, bucle: "repetir"},
        // onda de la senal abajo
        ...Array.from({length: 30}, (_, i) => ({nombre: `onda_${i}`, capa: 3, en: [r2(180 + i * 20), 640], pivote: [0, 0], rect: [-5, -30, 5, 0], color: "#5aff7a",
            claves: {escala_y: ciclo(1200, (u) => 0.15 + 0.85 * Math.abs(Math.sin(TAU * u + i * 0.5)) * Math.abs(Math.sin(i * 0.7))), opacidad: [[0, 0.9]]}, bucle: "repetir"})),
    ]};
}

// ------------------------------------------------------------------ CARTA DE AJUSTE (barras de color)
const carta = () => {
    const colores = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"], ancho = W / 7;
    return {tipo: "asset", nombre: "Carta de ajuste", duracion: 1000, marcas, partes: [
        ...colores.map((c, i) => ({nombre: `barra_${i}`, rect: [r2(i * ancho), 0, r2((i + 1) * ancho), 480], color: c})),
        ...colores.slice().reverse().map((c, i) => ({nombre: `barra_baja_${i}`, rect: [r2(i * ancho), 480, r2((i + 1) * ancho), 560], color: i % 2 ? "#101010" : c})),
        {nombre: "franja_baja", rect: [0, 560, W, H], degradado: lineal([0, 0], [W, 0], [[0, "#000000"], [0.5, "#ffffff"], [1, "#000000"]])},
        {nombre: "circulo", en: [W / 2, 280], poligono: ovalo(0, 0, 150, 150, 40).concat(ovalo(0, 0, 140, 140, 40).reverse()), color: "#ffffff"},
    ]};
};

// ------------------------------------------------------------------ ENCENDIDO DEL TUBO (negro y una linea blanca que se abre; una vez)
const encendido = () => ({tipo: "asset", nombre: "Encendido del tubo", duracion: 900, marcas, partes: [
    {nombre: "negro", capa: 0, rect: [-50, -50, W + 50, H + 50], color: "#000000", claves: {opacidad: [[0, 1], [500, 1], [900, 0, "suave"]]}},
    {nombre: "linea", capa: 1, en: [W / 2, H / 2], rect: [-W / 2, -3, W / 2, 3], color: "#ffffff",
        claves: {escala_x: [[0, 0.02], [250, 1, "salir"]], escala_y: [[0, 1], [250, 1], [600, 120, "entrar"]], opacidad: [[0, 1], [450, 1], [800, 0, "suave"]]}},
]});

// ------------------------------------------------------------------ LA ESCENA (16 s; 4:3)
function escena() {
    const DUR = 16000, CORTE = 7000, MSJ = 8000, VUELVE_CARTA = 12600, VUELVE = 13600;
    // una capa que se ve solo en ciertos tramos [a, b) (cortes secos)
    const ver = (tramos) => {
        const m = new Map([[0, 0], [DUR, 0]]);
        for (const [a, b] of tramos) { m.set(a, 1); if (b < DUR) m.set(b, 0); else m.set(DUR, 1); }
        return {opacidad: [...m.entries()].sort((p, q) => p[0] - q[0]).map(([t, v]) => [t, v, "mantener"])};
    };
    return {
        tipo: "escena", nombre: "Transmisión perdida", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {pantalla: {barrido: 0.32, curvatura: 0.12, aberracion: 2, ruido: 0.05, vineta: 0.55, parpadeo: 0.04}, resplandor: {umbral: 0.62, radio: 10, intensidad: 0.8},
            claves: {estatica: [[0, 0.05], [CORTE - 400, 0.05], [CORTE, 0.9, "suave"], [MSJ - 100, 1], [MSJ + 300, 0.35, "suave"], [9800, 0.25], [10400, 0.6, "lineal"], [10700, 0.3], [11400, 0.4],
                [VUELVE_CARTA - 800, 0.5], [VUELVE_CARTA - 300, 1, "suave"], [VUELVE_CARTA, 0.2], [VUELVE - 100, 0.15], [VUELVE + 300, 0.06, "suave"], [DUR, 0.05]]}},
        camara: {tamano: [W, H], centro: [W / 2, H / 2], zoom: 1, claves: {zoom: [[0, 1], [1500, 1, "suave"], [6500, 1.15, "suave"], [VUELVE, 1.05], [DUR, 1.12, "suave"]], y: [[0, 360], [6500, 330, "suave"], [VUELVE, 350], [DUR, 340, "suave"]]}},
        objetos: [
            {instancia: "Estudio de noticias", nombre: "estudio", en: [0, 0], plano: -10, claves: ver([[0, MSJ], [VUELVE, DUR]])},
            {instancia: "Robot presentadora", nombre: "robot", en: [480, 560], plano: -8, claves: ver([[0, MSJ], [VUELVE, DUR]]),
                acciones: [[0, "Quieto"], [1300, "Hablar"], [6600, "Quieto"], [VUELVE, "Confundida", false]]},
            {instancia: "Mensaje alienígena", nombre: "mensaje", en: [0, 0], plano: 0, claves: ver([[MSJ, VUELVE_CARTA]])},
            {instancia: "Carta de ajuste", nombre: "carta", en: [0, 0], plano: 1, claves: ver([[VUELVE_CARTA, VUELVE]])},
            {instancia: "Encendido del tubo", nombre: "encendido", en: [0, 0], plano: 5, bucle: false},
        ],
        dialogos: [
            {quien: "robot", texto: "Buenas noches, galaxia. Estas son las noticias del Canal 7.", desde: 1400, hasta: 4100},
            {quien: "robot", texto: "Hoy, en el anillo de Kepler, se inauguró el puerto espacial más gran…", desde: 4300, hasta: 7000},
            {texto: "…no están solos…", desde: MSJ + 900, hasta: VUELVE_CARTA - 400, estilo: "narrador", posicion: "abajo", velocidad: 8},
            {quien: "robot", texto: "¿…Hola? ¿Seguimos al aire?", desde: VUELVE + 400, hasta: DUR, velocidad: 30},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [estudio(), robot(), mensaje(), carta(), encendido()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
