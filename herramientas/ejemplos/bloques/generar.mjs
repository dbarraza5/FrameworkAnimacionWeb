// Proyecto "Mundo de bloques": un mundo cubico ORIGINAL (no es de ningun juego: personajes, colores y texturas
// propios) para mostrar las capacidades del editor: pasos de alto nivel (IA-5), enganches (IA-4), formatos y
// posiciones relativas al cuadro (IA-3; solo horizontal), particulas, fisica que desarma y temblor de camara.
//   node herramientas/ejemplos/bloques/generar.mjs   -> asset_NN.json, escena_1.json (Amanecer), escena_2.json (La mina)
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const guardar = (n, x) => fs.writeFileSync(path.join(DIR, n), JSON.stringify(x, null, 1));

const B = 40;                 // lado de un bloque
const PISO = 560;             // y de la superficie
// azar con semilla (las texturas salen siempre iguales)
let semilla = 7;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const PALETA = {
    pasto: ["#5fae3e", "#4f9a33", "#6cc047"], tierra: ["#8a5a35", "#7a4e2d", "#9b6840"], piedra: ["#8c8f94", "#7a7d82", "#9da0a5"],
    piedra_osc: ["#5a5d63", "#4c4f55", "#676a70"], madera: ["#8b6236", "#7a5530", "#9a6e3e"], hojas: ["#3f8f3a", "#337a30", "#4ea546"],
    cristal: ["#b46cff", "#9a4dff", "#d9a8ff"],
};
// un bloque: cuadrado con borde (la grilla) y unas manchas de textura (pixeles de 10 px)
function bloque(nombre, x, y, tipo, manchas = 3, extra = {}) {
    const [base, osc, cla] = PALETA[tipo];
    const partes = [];
    for (let i = 0; i < manchas; i++) {
        const cx = Math.floor(azar() * 4) * 10, cy = Math.floor(azar() * 4) * 10;
        partes.push({nombre: `${nombre}_m${i}`, rect: [cx, cy, cx + 10, cy + 10], color: azar() < 0.5 ? osc : cla});
    }
    if (tipo === "pasto") partes.push({nombre: `${nombre}_borde_tierra`, rect: [0, 14, B, B], color: PALETA.tierra[0]},
        {nombre: `${nombre}_flecos`, rect: [0, 14, 10, 20], color: base}, {nombre: `${nombre}_flecos2`, rect: [20, 14, 30, 22], color: base});
    return {nombre, en: [x, y], rect: [0, 0, B, B], color: base, borde: osc, partes, ...extra};
}

// ------------------------------------------------------------------ ventanas de las acciones del minero
const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
    tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
const CAMINAR = [0, 800], QUIETO = [1000, 2000], PICAR = [2200, 2800], TOTAL = 2800;
// claves de rotacion de una extremidad: balanceo al caminar, quieta, y (solo el brazo delantero) el golpe de picar:
// de 160 (arriba, un poco atras) a 320 (adelante y abajo) PASANDO POR ARRIBA de la cabeza (de 150 a -40 pasaba por abajo)
const pista = (caminar, picar) => ({rotacion: [
    [0, caminar, "suave"], [400, -caminar, "suave"], [800, caminar, "lineal"],
    [1000, 0, "lineal"], [2000, 0, "lineal"],
    ...(picar ? [[2200, 160, "entrar"], [2450, 320, "salir"], [2800, 160, "lineal"]] : [[2200, 0, "lineal"], [2800, 0, "lineal"]]),
]});

const MINERO = {
    tipo: "asset", nombre: "Minero", duracion: TOTAL,
    eventos: [ev("EventoGeneral", "Nodo_Default", 0, TOTAL), ev("Caminar", "EventoGeneral", ...CAMINAR), ev("Quieto", "EventoGeneral", ...QUIETO), ev("Picar", "EventoGeneral", ...PICAR)],
    enganches: {mano: {parte: "brazo_del", en: [0, 50]}, cabeza: {parte: "cabeza", en: [0, -40]}},
    partes: [{nombre: "cuerpo", partes: [
        {nombre: "brazo_tras", en: [0, -112], rect: [-7, 0, 7, 52], color: "#8e2b23", borde: "#5e1a14", claves: pista(25)},
        {nombre: "pierna_tras", en: [0, -60], rect: [-9, 0, 9, 60], color: "#5c4326", borde: "#3d2c18", claves: pista(-28)},
        {nombre: "torso", rect: [-12, -116, 12, -58], color: "#c0392b", borde: "#7a1f17", partes: [
            {nombre: "cuadro_1", rect: [-12, -106, 12, -102], color: "#7a1f17"}, {nombre: "cuadro_2", rect: [-12, -90, 12, -86], color: "#7a1f17"},
            {nombre: "cuadro_3", rect: [-2, -116, 2, -58], color: "#7a1f17"},
            {nombre: "overol", rect: [-12, -80, 12, -58], color: "#7a5a33", borde: "#4d381f"}, {nombre: "tirante", rect: [4, -116, 9, -80], color: "#7a5a33"},
            {nombre: "boton", rect: [4, -84, 9, -80], color: "#e9c46a"}]},
        {nombre: "pierna_del", en: [0, -60], rect: [-9, 0, 9, 60], color: "#7a5a33", borde: "#4d381f", claves: pista(28), partes: [
            {nombre: "bota", rect: [-9, 50, 12, 60], color: "#3b2a1e"}]},
        {nombre: "cabeza", en: [0, -116], rect: [-20, -40, 20, 0], color: "#e0aa7e", borde: "#b8845c", partes: [
            {nombre: "pelo_nuca", rect: [-20, -36, -8, -14], color: "#b5651d"},
            {nombre: "barba", rect: [-4, -14, 20, 0], color: "#b5651d"}, {nombre: "bigote", rect: [6, -16, 20, -12], color: "#8a4b12"},
            {nombre: "nariz", rect: [18, -24, 24, -16], color: "#d4906a"},
            {nombre: "ojo", rect: [8, -28, 14, -22], color: "#2b2b2b"}, {nombre: "ceja", rect: [6, -32, 16, -30], color: "#8a4b12"},
            {nombre: "casco", rect: [-22, -50, 22, -36], color: "#ffd23f", borde: "#c9a020"}, {nombre: "visera", rect: [12, -40, 30, -36], color: "#ffd23f", borde: "#c9a020"},
            {nombre: "lampara", rect: [-2, -48, 8, -40], color: "#fffbe0"}]},
        {nombre: "brazo_del", en: [0, -112], rect: [-7, 0, 7, 52], color: "#c0392b", borde: "#7a1f17", claves: pista(-25, true), partes: [
            {nombre: "guante", rect: [-8, 40, 8, 54], color: "#6b4a2b"}]},
    ]}],
};
const ARBOL = {
    tipo: "asset", nombre: "Árbol de bloques",
    partes: [{nombre: "arbol", partes: [
        ...[0, 1, 2, 3].map((k) => bloque(`tronco_${k}`, -20, -B * (k + 1), "madera", 2)),
        ...[[-2, 4], [-1, 4], [0, 4], [1, 4], [-2, 5], [-1, 5], [0, 5], [1, 5], [-1, 6], [0, 6], [-3, 4], [2, 4]].map(([c, f], i) => bloque(`hoja_${i}`, -20 + c * B, -B * (f + 1), "hojas", 2)),
    ]}],
};
// pared de la mina: cada bloque es una pieza que la explosion puede soltar
const PARED = {
    tipo: "asset", nombre: "Pared de piedra",
    partes: Array.from({length: 4 * 6}, (_, i) => {
        const c = i % 4, f = Math.floor(i / 4);
        return bloque(`pared_${i}`, -80 + c * B, -B * (f + 1), (c + f) % 3 === 0 ? "piedra_osc" : "piedra", 1);
    }),
};
guardar("asset_01.json", MINERO);
guardar("asset_02.json", ARBOL);
guardar("asset_03.json", PARED);

// ------------------------------------------------------------------ piezas de escena comunes
// franja de bloques (liviana): un rectangulo por fila, la grilla con lineas y unas manchas de textura
function franja(nombre, x0, x1, y0, filas, tipos, extra = {}, densidad = 0.25) {
    const partes = [], cols = Math.ceil((x1 - x0) / B), alto = filas * B;
    for (let f = 0; f < filas; f++) {
        const t = tipos(f), [base, osc] = PALETA[t];
        partes.push({nombre: `${nombre}_fila${f}`, rect: [x0, y0 + f * B, x0 + cols * B, y0 + (f + 1) * B], color: t === "pasto" ? PALETA.tierra[0] : base});
        if (t === "pasto") partes.push({nombre: `${nombre}_pasto`, rect: [x0, y0, x0 + cols * B, y0 + 14], color: base});
        partes.push({nombre: `${nombre}_h${f}`, rect: [x0, y0 + (f + 1) * B - 2, x0 + cols * B, y0 + (f + 1) * B], color: "rgba(0,0,0,0.22)"});
    }
    // (lineas de la grilla en un tono neutro: sirven para todas las filas)
    for (let c = 0; c <= cols; c++) partes.push({nombre: `${nombre}_v${c}`, rect: [x0 + c * B - 1, y0, x0 + c * B + 1, y0 + alto], color: "rgba(0,0,0,0.22)"});
    for (let k = 0; k < cols * filas * densidad; k++) {
        const c = Math.floor(azar() * cols), f = Math.floor(azar() * filas), t = tipos(f);
        const x = x0 + c * B + Math.floor(azar() * 4) * 10, y = y0 + f * B + Math.floor(azar() * 4) * 10;
        if (t === "pasto" && y < y0 + 14) continue;
        partes.push({nombre: `${nombre}_m${k}`, rect: [x, y, x + 10, y + 10], color: azar() < 0.5 ? PALETA[t === "pasto" ? "tierra" : t][1] : PALETA[t === "pasto" ? "tierra" : t][2]});
    }
    return {nombre, en: [0, 0], plano: -3, partes, ...extra};
}
const terreno = (nombre, x0, x1, filas, tipos) => {
    const f = franja(nombre, x0, x1, PISO, filas, tipos);
    f.partes.unshift({nombre: `${nombre}_relleno`, rect: [x0, PISO + filas * B, x1, PISO + 1200], color: "#4a4d52"});
    return f;
};
const pico = (nombre, en, extra = {}) => ({nombre, en, partes: [
    {nombre: `${nombre}_mango`, rect: [-3, -6, 3, 46], color: "#8b6236", borde: "#5a3b22"},
    {nombre: `${nombre}_cabeza`, poligono: [[-26, 36], [-14, 30], [14, 30], [26, 36], [14, 42], [-14, 42]], color: "#b8c4cc", borde: "#6c7a84"}], ...extra});
const nube = (nombre, x, y, ancho, dx, dur) => ({nombre, en: [x, y], plano: -8, opacidad: 0.9, partes: [
    {nombre: `${nombre}_a`, rect: [0, 0, ancho, 30], color: "#ffffff"}, {nombre: `${nombre}_b`, rect: [30, -20, ancho - 40, 0], color: "#ffffff"}],
    claves: {x: [[0, x], [dur, x + dx]]}});
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});

// ------------------------------------------------------------------ escena 1: Amanecer
const escena1 = {
    tipo: "escena", nombre: "1. Amanecer", duracion: 13000, precision: "decimal",
    camara: {centro: [640, 360]},
    objetos: [
        {nombre: "cielo", en: [0, 0], plano: -10, rect: [-400, -600, 1700, PISO], degradado: lineal([0, -200], [0, PISO], [[0, "#2b2d6e"], [0.55, "#e07a5f"], [1, "#f6c28b"]])},
        {nombre: "cielo_dia", en: [0, 0], plano: -9, rect: [-400, -600, 1700, PISO], degradado: lineal([0, -200], [0, PISO], [[0, "#4ea8de"], [1, "#bde0fe"]]),
            claves: {opacidad: [[0, 0], [3000, 0, "suave"], [9000, 1]]}},
        // sol cuadrado: queda en la esquina de arriba a la derecha de cada formato y sube desde el horizonte
        {nombre: "sol", en: {cuadro: "arriba-derecha", desplazar: [-70, 70]}, plano: -8, partes: [
            {nombre: "sol_halo", rect: [-46, -46, 46, 46], color: "rgba(255,230,140,0.35)",
                claves: {y: [[0, 420], [7000, 0, "salir"]]}, partes: [
                {nombre: "sol_disco", rect: [-30, -30, 30, 30], color: "#ffd166", borde: "#f4a261"}]}]},
        nube("nube_1", 80, 120, 180, 260, 13000), nube("nube_2", 700, 70, 140, 200, 13000), nube("nube_3", 1050, 170, 120, 160, 13000),
        {nombre: "colinas", en: [0, 0], plano: -7, partes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((k) => ({
            nombre: `colina_${k}`, rect: [-200 + k * 100, PISO - 40 - ((k * 37) % 5) * 20, -100 + k * 100, PISO], color: k % 2 ? "#3c7a52" : "#356c48"}))},
        terreno("suelo", -200, 1520, 4, (f) => (f === 0 ? "pasto" : f < 3 ? "tierra" : "piedra")),
        {instancia: "Árbol de bloques", nombre: "arbol", en: [780, PISO], plano: -2},
        pico("pico", [720, PISO - 26], {plano: -1, rotacion: -70}),
        {instancia: "Minero", nombre: "minero", en: [-80, PISO], evento: "Quieto"},
    ],
    efectos: [
        // hojas que caen cuando tala
        {tipo: "particulas", nombre: "hojas", en: [780, PISO - 230], inicio: 6900, fin: 9300, tasa: 14, vida: 2200, velocidad: 40, angulo: 90, dispersion: 140,
            gravedad: 60, tam_ini: 7, tam_fin: 6, color_ini: "#4ea546", color_fin: "#337a30"},
        // astillas al golpear el tronco
        {tipo: "particulas", nombre: "astillas", en: [760, PISO - 70], inicio: 6900, fin: 9300, tasa: 18, vida: 600, velocidad: 160, angulo: -150, dispersion: 60,
            gravedad: 500, tam_ini: 5, tam_fin: 3, color_ini: "#9a6e3e", color_fin: "#5a3b22"},
    ],
    pasos: [
        {caminar: "minero", a: [700, PISO], desde: 600, velocidad: 150, luego: "Quieto"},
        {plano: "medio", de: "minero", desde: 5400, hasta: 6300},
        {tomar: "minero", objeto: "pico", enganche: "mano", t: 6000},
        {plano: "general", de: ["minero", "arbol"], desde: 9400, hasta: 10400},
        {caminar: "minero", a: [1400, PISO], desde: 10600, velocidad: 320, luego: "Quieto"},
    ],
    dialogos: [
        {texto: "MUNDO DE BLOQUES", desde: 300, hasta: 4600, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 46, color: "#ffffff", fuente: "mono", velocidad: 0, resplandor: 8},
        {texto: "Escena 1 · Amanecer", desde: 900, hasta: 4600, estilo: "texto", en: {cuadro: "abajo-centro"}, tamano: 24, color: "#fff6e0", fuente: "mono", velocidad: 18},
        {quien: "minero", texto: "¡A trabajar!", desde: 6300, hasta: 8000, estilo: "grito"},
    ],
};
// acciones a mano (los pasos ponen Caminar/Quieto): talar
escena1.objetos.find((o) => o.nombre === "minero").acciones = [[7000, "Picar"], [9200, "Quieto"]];
guardar("escena_1.json", escena1);

// ------------------------------------------------------------------ escena 2: La mina
const T_MECHA = 8400, T_BOOM = 11400;
const flash = (t) => [[0, 0], [t - 1, 0], [t + 30, 1, "salir"], [t + 300, 0, "entrar"]];
const escena2 = {
    tipo: "escena", nombre: "2. La mina", duracion: 16000, precision: "decimal", profundidad: false,
    camara: {centro: [640, 360], temblor: {desde: T_BOOM, hasta: T_BOOM + 1800, amplitud: 9}},
    objetos: [
        {nombre: "fondo_cueva", en: [0, 0], plano: -10, rect: [-400, -400, 1700, 1000], color: "#2a2b33"},
                franja("techo", -200, 1520, 40, 2, () => "piedra_osc", {plano: -6}),
        franja("muro_trasero", -200, 1520, 120, 11, () => "piedra_osc", {plano: -9, opacidad: 0.35}, 0.04),
        // el cristal que aparece detras de la pared
        {nombre: "cristal", en: [940, PISO], plano: -5, partes: [
            {nombre: "cristal_brillo", rect: [-70, -150, 70, 0], color: "rgba(180,108,255,0.25)", claves: {opacidad: [[0, 0.3], [T_BOOM + 800, 0.3], [T_BOOM + 1600, 1, "suave"]]}},
            bloque("cristal_1", -40, -B, "cristal", 4), bloque("cristal_2", 0, -B, "cristal", 4), bloque("cristal_3", -20, -2 * B, "cristal", 4)]},
        terreno("suelo", -200, 1520, 3, () => "piedra"),
        {instancia: "Pared de piedra", nombre: "pared", en: [940, PISO], plano: -2, fisica: {modo: "desarmar", nivel: 1, rebote: 0.25, friccion: 0.85}},
        // antorcha en la pared de la izquierda
        {nombre: "antorcha", en: [180, 330], plano: -4, partes: [{nombre: "antorcha_palo", rect: [-4, 0, 4, 40], color: "#8b6236"},
            {nombre: "antorcha_luz", circulo: {r: 90, lados: 24}, mezcla: "suma", degradado: {tipo: "radial", centro: [0, 0], radio: 90, colores: [[0, "rgba(255,180,80,0.45)"], [1, "rgba(255,120,40,0)"]]}}]},
        // un bloque suelto que el minero pica
        bloque("bloque_suelto", 560, PISO - B, "piedra", 4, {plano: -1, claves: {opacidad: [[0, 1], [6400, 1, "mantener"], [6420, 0]]}}),
        // barril explosivo (diseño propio) con su mecha
        {nombre: "barril", en: [870, PISO], plano: 1, partes: [
            {nombre: "barril_cuerpo", rect: [-20, -46, 20, 0], color: "#c1272d", borde: "#7a1418"},
            {nombre: "barril_aro1", rect: [-20, -38, 20, -34], color: "#3a3a3a"}, {nombre: "barril_aro2", rect: [-20, -12, 20, -8], color: "#3a3a3a"},
            {nombre: "barril_marca", rect: [-8, -28, 8, -18], color: "#ffd166"}, {nombre: "barril_mecha", rect: [-2, -60, 2, -46], color: "#d9c7a0"}],
            claves: {opacidad: [[0, 1], [T_BOOM, 1, "mantener"], [T_BOOM + 10, 0]]}},
        {nombre: "fogonazo", en: [880, PISO - 60], plano: 3, circulo: {r: 220, lados: 28}, mezcla: "suma",
            degradado: {tipo: "radial", centro: [0, 0], radio: 220, colores: [[0, "rgba(255,244,192,0.95)"], [0.4, "rgba(255,176,64,0.6)"], [1, "rgba(255,96,32,0)"]]}, claves: {opacidad: flash(T_BOOM)}},
        {instancia: "Minero", nombre: "minero", en: [-80, PISO], evento: "Quieto"},
        pico("pico", [0, 0], {plano: 0}),
    ],
    efectos: [
        {tipo: "particulas", nombre: "fuego", en: [180, 322], inicio: 0, fin: 16000, tasa: 26, vida: 700, velocidad: 50, angulo: -90, dispersion: 30,
            gravedad: -40, tam_ini: 9, tam_fin: 2, color_ini: "#ffd166", color_fin: "#e85d04", mezcla: "suma"},
        {tipo: "particulas", nombre: "polvo_bloque", en: [580, PISO - 20], inicio: 5100, fin: 6500, tasa: 30, vida: 900, velocidad: 110, angulo: -90, dispersion: 120,
            gravedad: 300, tam_ini: 6, tam_fin: 4, color_ini: "#9da0a5", color_fin: "#5a5d63"},
        {tipo: "particulas", nombre: "chispas_mecha", en: [870, PISO - 62], inicio: T_MECHA, fin: T_BOOM, tasa: 40, vida: 400, velocidad: 90, angulo: -90, dispersion: 120,
            gravedad: 200, tam_ini: 3, tam_fin: 1, color_ini: "#fff0a0", color_fin: "#ff6a20", mezcla: "suma"},
        {tipo: "explosion", nombre: "estallido", en: [880, PISO - 110], t: T_BOOM, fuerza: 700, radio: 280, arriba: 0.35, umbral: 25},
        {tipo: "particulas", nombre: "polvo_explosion", en: [900, PISO - 60], inicio: T_BOOM, fin: T_BOOM + 1400, tasa: 40, vida: 2600, velocidad: 140, angulo: -90, dispersion: 200,
            gravedad: -10, tam_ini: 20, tam_fin: 60, color_ini: "#8c8f94", color_fin: "#2a2b30", opacidad: 0.55},
        {tipo: "particulas", nombre: "brillo_cristal", en: [940, PISO - 60], inicio: T_BOOM + 1200, fin: 16000, tasa: 10, vida: 1400, velocidad: 25, angulo: -90, dispersion: 180,
            gravedad: -10, tam_ini: 5, tam_fin: 1, color_ini: "#ffffff", color_fin: "#b46cff", mezcla: "suma"},
    ],
    pasos: [
        {tomar: "minero", objeto: "pico", enganche: "mano", t: 0},
        {caminar: "minero", a: [510, PISO], desde: 300, velocidad: 150, luego: "Quieto"},
        {plano: "medio", de: "minero", desde: 4400, hasta: 5100},
        {plano: "general", de: ["minero", "pared"], desde: 6600, hasta: 7300},
        {caminar: "minero", a: [810, PISO], desde: 6800, velocidad: 170, luego: "Quieto"},
        {caminar: "minero", a: [240, PISO], desde: 9000, velocidad: 280, luego: "Quieto"},
        {mirar: "minero", a: "derecha", t: 11100},
        {plano: "general", de: ["minero", "pared"], desde: 12200, hasta: 13400},
    ],
    dialogos: [
        {texto: "Escena 2 · La mina", desde: 300, hasta: 3000, estilo: "texto", en: {cuadro: "arriba-izquierda"}, tamano: 26, color: "#ffd166", fuente: "mono", velocidad: 18},
        {quien: "minero", texto: "Esa pared suena hueca…", desde: 7400, hasta: 8900, estilo: "pensamiento"},
        {quien: "minero", texto: "¡Un cristal!", desde: 13500, hasta: 15600, estilo: "grito"},
    ],
};
escena2.objetos.find((o) => o.nombre === "minero").acciones = [[5000, "Picar"], [6500, "Quieto"]];
guardar("escena_2.json", escena2);
console.log("escrito en", DIR);
