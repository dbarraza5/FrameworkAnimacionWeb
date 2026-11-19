// Fase 6 de planeacion_capacidades.md: PLANO CINEMATOGRAFICO CON CLIMA.
// Un plano largo de noche bajo la lluvia: la camara baja del cielo a la calle y se acerca a
// una persona con paraguas que camina hasta una farola y se detiene. Relampagos (rayo +
// destello + truenos con retraso), lluvia en 3 capas, salpicaduras, charcos con ondas, gotas
// del paraguas, foco que pasa del horizonte a la calle y barrotes desenfocados en primer plano.
//   node herramientas/ejemplos/lluvia/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
let semilla = 11;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };

const DUR = 13000, PISO = 600, FAROLA_X = 820, LUZ_Y = 270;
const RAYOS = [1700, 6200, 10200];               // destellos: uno lejano, uno triple (cerca) y uno simple
const TOPE = [0.16, 0.3, 0.26];                  // intensidad de cada destello
const PARA = 8600;                               // la persona se detiene bajo la farola
const X_INI = 150, X_FIN = FAROLA_X - 70, ESC = 1.45;

// ------------------------------------------------------------------ lluvia: 3 capas de trazos en bucle
function lluvia() {
    const ANCHO = 1900, TILE = 700, X0 = -300, Y0 = -500;
    const capa = (nombre, n, largo, ancho, color, opacidad, periodo, viento, extra = {}) => {
        const trazos = [];
        for (let i = 0; i < n; i++) {
            const x = X0 + azar() * ANCHO, y = Y0 + azar() * TILE;
            for (const dy of [0, TILE, 2 * TILE]) {            // tres copias apiladas: el bucle no se nota
                const a = [x, y + dy], b = [x + viento * largo, y + dy + largo];
                trazos.push({nombre: `${nombre}_${i}_${dy}`, poligono: [[r1(a[0]), r1(a[1])], [r1(a[0] + ancho), r1(a[1])], [r1(b[0] + ancho), r1(b[1])], [r1(b[0]), r1(b[1])]], color});
            }
        }
        return {nombre, opacidad, ...extra, claves: {y: [[0, 0], [periodo, TILE, "lineal"]], x: [[0, 0], [periodo, r1(viento * TILE), "lineal"]]}, bucle: "repetir", partes: trazos};
    };
    return {tipo: "asset", nombre: "Lluvia en capas", duracion: 1000, marcas, partes: [
        capa("lejos", 110, 16, 0.9, "#9fb4d0", 0.35, 900, 0.18),
        capa("medio", 80, 30, 1.4, "#b8c8e0", 0.4, 560, 0.2),
        capa("cerca", 30, 64, 3, "#d0dcf0", 0.3, 330, 0.22, {desenfoque: 1.5}),
    ]};
}

// ------------------------------------------------------------------ persona con paraguas
function persona(nombre, caminar) {
    const paso = 560;
    const vaiven = (amp, fase = 1) => (caminar ? {claves: {rotacion: [[0, amp * fase, "suave"], [paso, -amp * fase, "suave"]]}, bucle: "ida_vuelta"} : {});
    // quieta: mira hacia arriba con el segundo relampago (su reloj empieza al detenerse)
    const mira = caminar ? {} : {claves: {rotacion: [[0, 0], [RAYOS[2] - PARA + 150, 0], [RAYOS[2] - PARA + 600, -14, "suave"], [RAYOS[2] - PARA + 2200, -14], [RAYOS[2] - PARA + 2900, -3, "suave"]]}};
    return {tipo: "asset", nombre, duracion: caminar ? paso * 2 : DUR, marcas, partes: [
        {nombre: "pierna_atras", poligono: [[-6, -88], [6, -88], [4, -4], [-4, -4]], color: "#2a2e3a", pivote: [0, -86], ...vaiven(20, -1),
            partes: [{nombre: "bota_atras", poligono: [[-6, -10], [10, -10], [13, 0], [-6, 0]], color: "#3a2418"}]},
        {nombre: "piloto", poligono: [[-16, -70], [18, -70], [17, -150], [8, -160], [-10, -160], [-16, -150]],
            degradado: lineal([-16, 0], [18, 0], [[0, "#c89a10"], [0.6, "#f0c020"], [1, "#ffe070"]]), borde: "#a07a08"},
        {nombre: "pierna", poligono: [[-6, -88], [6, -88], [4, -4], [-4, -4]], color: "#363b4a", pivote: [0, -86], ...vaiven(20),
            partes: [{nombre: "bota", poligono: [[-6, -10], [10, -10], [13, 0], [-6, 0]], color: "#4a2e1e"}]},
        {nombre: "cabeza", pivote: [2, -160], ...mira, partes: [
            {nombre: "cara", en: [4, -174], circulo: {r: 12, lados: 18}, degradado: radial([4, -3], 14, [[0, "#f0c8a8"], [1, "#b48060"]])},
            {nombre: "capucha", poligono: [[-12, -170], [-10, -186], [2, -192], [14, -188], [17, -178], [10, -182], [-2, -184], [-6, -168]], color: "#e0b018"},
            {nombre: "ojo", en: [11, -176], circulo: {r: 1.4, lados: 6}, color: "#1a1410"},
        ]},
        // brazo que sostiene el paraguas (el paraguas se mece apenas con el viento)
        {nombre: "brazo", poligono: [[4, -150], [12, -150], [22, -118], [15, -114]], color: "#e0b018", partes: [
            {nombre: "mano", en: [19, -114], circulo: {r: 4, lados: 10}, color: "#e0b896"},
            {nombre: "paraguas", pivote: [19, -116], claves: {rotacion: [[0, -3, "suave"], [1700, 3, "suave"]]}, bucle: "ida_vuelta", partes: [
                {nombre: "baston", rect: [18, -232, 20, -110], color: "#2a2020"},
                {nombre: "mango", poligono: [[18, -112], [20, -112], [20, -104], [24, -100], [22, -98], [18, -102]], color: "#2a2020"},
                {nombre: "tela", poligono: [[-46, -200], [-36, -214], [-16, -226], [19, -232], [54, -226], [74, -214], [84, -200], [70, -204], [52, -200], [34, -205], [19, -201], [4, -205], [-14, -200], [-32, -204]],
                    degradado: lineal([0, -232], [0, -200], [[0, "#a02838"], [1, "#5a1420"]]), borde: "#4a1018"},
                {nombre: "brillo_tela", poligono: [[-20, -222], [10, -229], [12, -226], [-18, -219]], color: "#ff90a0", opacidad: 0.25, desenfoque: 2, mezcla: "pantalla"},
            ]},
        ]},
    ]};
}

function farola() {
    const alto = PISO - LUZ_Y;
    return {tipo: "asset", nombre: "Farola mojada", duracion: 1000, marcas, partes: [
        {nombre: "base", rect: [-14, -18, 14, 0], color: "#141820"},
        {nombre: "poste", rect: [-5, -alto + 4, 5, -16], degradado: lineal([-5, 0], [5, 0], [[0, "#4a5868"], [0.4, "#2a3440"], [1, "#0e1216"]])},
        {nombre: "cabezal", poligono: [[-22, -alto + 4], [22, -alto + 4], [14, -alto - 14], [-14, -alto - 14]], color: "#1a2028"},
        {nombre: "foco", en: [0, -alto + 6], elipse: [14, 4], color: "#fff4cc"},
    ]};
}

// ------------------------------------------------------------------ escena
const ASSETS = [lluvia(), persona("Persona con paraguas (camina)", true), persona("Persona con paraguas (quieta)", false), farola()];

// destello: dos picos rapidos (y un tercero chico en el primer rayo)
const destello = () => {
    const k = [[0, 0]];
    RAYOS.forEach((t, i) => {
        const tope = TOPE[i];
        k.push([t - 1, 0], [t + 40, tope, "salir"], [t + 140, 0.05, "entrar"]);
        if (i === 1) k.push([t + 220, tope * 0.9, "salir"], [t + 420, 0.04, "entrar"], [t + 520, tope * 0.35, "salir"], [t + 900, 0, "entrar"]);
        else k.push([t + 700, 0, "entrar"]);
    });
    return k;
};
const visibleEnRayos = () => {          // el rayo se ve solo durante los picos
    const k = [[0, 0, "mantener"]];
    RAYOS.forEach((t, i) => { k.push([t, 1, "mantener"], [t + 160, 0, "mantener"]); if (i === 1) k.push([t + 220, 1, "mantener"], [t + 440, 0, "mantener"]); });
    return k;
};
const rayo = (() => {                   // zigzag del rayo (con una rama)
    const p = [[1060, -420]];
    let x = 1060, y = -420;
    while (y < 180) { x += (azar() - 0.45) * 60; y += 30 + azar() * 40; p.push([r1(x), r1(y)]); }
    const ida = p.map(([px, py]) => [px - 3, py]), vuelta = p.map(([px, py]) => [px + 3, py]).reverse();
    return [...ida, ...vuelta];
})();

const charco = (nombre, x, y, rx) => [
    {nombre, en: [x, y], plano: -1, circulo: {r: rx, lados: 28}, escala: [1, 0.18], degradado: radial([0, 0], rx, [[0, "#3a4a62"], [0.7, "#202a3a"], [1, rgba("#202a3a", 0)]])},
    {nombre: `${nombre}_reflejo`, en: [x, y], plano: -1, circulo: {r: rx * 0.7, lados: 24}, escala: [0.5, 0.14], mezcla: "suma",
        degradado: radial([0, 0], rx * 0.7, [[0, rgba("#ffd890", Math.max(0.05, 0.55 - Math.abs(x - FAROLA_X) / 900))], [1, rgba("#ffd890", 0)]])},
    ...[0, 1, 2].map((k) => ({nombre: `${nombre}_onda_${k}`, en: [r1(x + (k - 1) * rx * 0.35), y], plano: -1, escala: [0.1, 0.02],
        poligono: [...Array.from({length: 18}, (_, i) => [r1(rx * 0.4 * Math.cos(i / 18 * 2 * Math.PI)), r1(rx * 0.4 * Math.sin(i / 18 * 2 * Math.PI))]),
            ...Array.from({length: 18}, (_, i) => [r1(rx * 0.36 * Math.cos(-i / 18 * 2 * Math.PI)), r1(rx * 0.36 * Math.sin(-i / 18 * 2 * Math.PI))])],
        color: "#b8c8e0", claves: {escala_x: [[k * 230, 0.1], [k * 230 + 700, 1.1, "salir"]], escala_y: [[k * 230, 0.02], [k * 230 + 700, 0.22, "salir"]], opacidad: [[k * 230, 0.6], [k * 230 + 700, 0, "lineal"]]}, repetir: "repetir"})),
];

const camina = {x: [[0, X_INI], [PARA, X_FIN, "lineal"]]};
const objetos = [
    {nombre: "cielo", en: [0, 0], plano: -6, rect: [-300, -700, 1700, 480], degradado: lineal([0, -700], [0, 480], [[0, "#04060c"], [0.6, "#0e1626"], [1, "#1c2a40"]]),
        colores: {flash: {degradado: lineal([0, -700], [0, 480], [[0, "#2a3450"], [0.6, "#5a6a90"], [1, "#8090b8"]])},
            flash_lejos: {degradado: lineal([0, -700], [0, 480], [[0, "#121a2c"], [0.6, "#2a3654"], [1, "#3a4a6a"]])}},
        claves: {forma: (() => { const k = [[0, ""]]; RAYOS.forEach((t, i) => k.push([t - 1, ""], [t + 40, i === 0 ? "flash_lejos" : "flash", "salir"], [t + 600, "", "entrar"])); return k; })()}},
    {nombre: "rayo", en: [0, 0], plano: -6, poligono: rayo, color: "#f0f4ff", mezcla: "suma", claves: {opacidad: visibleEnRayos()}},
    {nombre: "halo_rayo", en: [1080, -100], plano: -6, circulo: {r: 420, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 420, [[0, rgba("#c8d4ff", 0.45)], [1, rgba("#c8d4ff", 0)]]), claves: {opacidad: visibleEnRayos()}},
    // horizonte: nitido al principio (la camara mira el cielo), borroso cuando baja a la calle
    ...[["horizonte", {}, [[0, 1], [3200, 1], [4800, 0, "suave"]]], ["horizonte_borroso", {desenfoque: 3.5}, [[0, 0], [3200, 0], [4800, 1, "suave"]]]].map(([n, extra, op]) => ({
        nombre: n, en: [0, 0], plano: -5, ...extra, claves: {opacidad: op},
        poligono: [[-300, 480], [-300, 300], ...Array.from({length: 26}, (_, i) => { const x = -300 + i * 80, h = 120 + ((i * 53) % 7) * 34 + (i % 3) * 20; return [[x, 480 - h], [x + 70, 480 - h]]; }).flat(), [1780, 300], [1780, 480]],
        degradado: lineal([0, 180], [0, 480], [[0, "#1a2030"], [1, "#0e121c"]])})),
    ...Array.from({length: 40}, (_, i) => ({nombre: `ventana_lejos_${i}`, en: [0, 0], plano: -5, rect: [r1(-280 + azar() * 2000), r1(220 + azar() * 220), 0, 0].map((v, j, a) => (j < 2 ? v : a[j - 2] + (j === 2 ? 6 : 8))), color: azar() < 0.7 ? "#e0b060" : "#80a0d0", opacidad: 0.35 + azar() * 0.3, claves: {opacidad: [[0, 0.5], [3200, 0.5], [4800, 0.25, "suave"]]}})),
    {nombre: "muro", en: [0, 0], plano: -4, rect: [-300, 380, 1700, PISO], degradado: lineal([0, 380], [0, PISO], [[0, "#1a1e28"], [1, "#262a34"]])},
    {nombre: "calle", en: [0, 0], plano: -3, rect: [-300, PISO, 1700, 900], degradado: lineal([0, PISO], [0, 900], [[0, "#202630"], [1, "#0a0c10"]])},
    {nombre: "brillo_calle", en: [FAROLA_X, PISO + 40], plano: -3, circulo: {r: 320, lados: 32}, escala: [1, 0.3], mezcla: "suma", degradado: radial([0, 0], 320, [[0, rgba("#ffd890", 0.22)], [1, rgba("#ffd890", 0)]])},
    ...charco("charco_1", 640, PISO + 34, 90), ...charco("charco_2", 980, PISO + 60, 120), ...charco("charco_3", 330, PISO + 46, 70),
    {nombre: "cono_luz", en: [FAROLA_X, LUZ_Y + 8], plano: -2, poligono: [[-14, 0], [14, 0], [210, PISO - LUZ_Y], [-210, PISO - LUZ_Y]], mezcla: "suma",
        degradado: lineal([0, 0], [0, PISO - LUZ_Y], [[0, rgba("#ffe0a0", 0.16)], [1, rgba("#ffe0a0", 0.02)]])},
    {nombre: "luz_farola", en: [FAROLA_X, LUZ_Y + 8], plano: -2, partes: []},
    {instancia: "Farola mojada", nombre: "farola", en: [FAROLA_X, PISO], plano: -1},
    {instancia: "Persona con paraguas (camina)", nombre: "persona", en: [X_INI, PISO + 6], escala: ESC, bucle: true,
        claves: {x: camina.x, opacidad: [[0, 1, "mantener"], [PARA, 0, "mantener"]]},
        sombra: {luz: "luz_farola", alcance: 520, aplastar: -0.3, opacidad: 0.6, desenfoque: 3, piso: PISO + 6}},
    {instancia: "Persona con paraguas (quieta)", nombre: "persona_quieta", en: [X_FIN, PISO + 6], escala: ESC, bucle: false, desfase: PARA,
        claves: {opacidad: [[0, 0, "mantener"], [PARA, 1, "mantener"]]},
        sombra: {luz: "luz_farola", alcance: 520, aplastar: -0.3, opacidad: 0.6, desenfoque: 3, piso: PISO + 6}},
    {nombre: "halo_farola", en: [FAROLA_X, LUZ_Y + 6], plano: 2, circulo: {r: 90, lados: 28}, mezcla: "suma", degradado: radial([0, 0], 90, [[0, rgba("#fff0c0", 0.75)], [1, rgba("#fff0c0", 0)]])},
    {instancia: "Lluvia en capas", nombre: "lluvia", en: [0, 0], plano: 3},
    // barrotes de una reja en primer plano, desenfocados (profundidad de campo)
    {nombre: "reja", en: [0, 0], plano: 4, desenfoque: 7, opacidad: 0.9, partes: [
        {nombre: "travesano", rect: [880, 640, 1500, 652], color: "#0a0c10"},
        ...Array.from({length: 7}, (_, i) => ({nombre: `barrote_${i}`, rect: [900 + i * 90, 560, 912 + i * 90, 820], color: "#0a0c10"}))]},
    {nombre: "destello", en: [0, 0], plano: 5, rect: [-300, -700, 1700, 900], color: "#dfe8ff", mezcla: "suma", claves: {opacidad: destello()}},
];
const efectos = [
    // salpicaduras: emisores que barren la calle muy rapido (cada gota nace en otro lugar)
    ...[[137, 0], [173, 300], [211, 600]].map(([periodo, dx], i) => ({tipo: "particulas", nombre: `salpicaduras_${i}`, en: [-200 + dx, PISO + 30 + i * 40],
        claves: {x: [[0, -200 + dx], [periodo, 1500 + dx, "lineal"]]}, repetir: "repetir",
        inicio: 0, fin: DUR, tasa: 90, vida: 240, velocidad: 70, angulo: -90, dispersion: 120, gravedad: 900, tam_ini: 2.5, tam_fin: 1,
        color_ini: "#d8e4ff", color_fin: "#7a8aa8", suave: "si", opacidad: 0.55, mezcla: "suma"})),
    // gotas que caen del borde del paraguas (siguen a la persona)
    ...[-1, 1].map((l, i) => ({tipo: "particulas", nombre: `gotas_paraguas_${i}`, en: [X_INI, PISO],
        claves: {x: [[0, r1(X_INI + (l < 0 ? -44 : 82) * ESC)], [PARA, r1(X_FIN + (l < 0 ? -44 : 82) * ESC), "lineal"]], y: [[0, r1(PISO + 6 - 202 * ESC)]]},
        inicio: 0, fin: DUR, tasa: 9, vida: 650, velocidad: 15, angulo: 90, dispersion: 10, gravedad: 900, tam_ini: 2.5, tam_fin: 2,
        color_ini: "#d8e4ff", color_fin: "#a0b4d8", suave: "si", opacidad: 0.8})),
];
// camara: grua desde el cielo hasta la calle, luego se acerca despacio a la persona
const camara = {centro: [760, -120], zoom: 1.15, claves: {
    x: [[0, 900], [1200, 900, "suave"], [4800, 640, "suave"], [PARA, r1(X_FIN + 40), "suave"], [DUR, r1(X_FIN + 30), "suave"]],
    y: [[0, -160], [1200, -160, "suave"], [4800, 380, "suave"], [PARA, 430, "suave"], [DUR, 410, "suave"]],
    zoom: [[0, 1.15], [4800, 1, "suave"], [PARA, 1.35, "suave"], [DUR, 1.75, "suave"]]}};
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Lluvia de noche (plano)", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Lluvia", t: 0, volumen: 0.8, bucle: true, fundido: {entrada: 1500, salida: 1500}},
        {sonido: "Trueno lejano", t: RAYOS[0] + 2200, volumen: 0.5},
        {sonido: "Trueno", t: RAYOS[1] + 700, volumen: 1},
        {sonido: "Trueno lejano", t: RAYOS[2] + 1300, volumen: 0.8},
    ],
    camara, objetos, efectos,
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms\n`);
