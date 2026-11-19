// Fase 7 de planeacion_capacidades.md: DESTRUCCION ENCADENADA (demolicion controlada).
// Una torre vieja de 10 pisos (40 paneles con ventanas + tanque y antena) se desarma con la
// fisica del motor:
//   1. cargas en la base, en secuencia (explosiones chicas con fuerza + destellos);
//   2. "onda de liberacion": explosiones debiles, desde muy abajo a la izquierda, con radio
//      creciente cada 170 ms: sueltan los paneles DE ABAJO HACIA ARRIBA -> la torre se hunde
//      piso por piso y se inclina a la derecha (las piezas caen con gravedad a su piso);
//   3. polvo que sube y rueda, camara que tiembla, sonidos (cargas, estruendo y escombros por
//      `al_tocar_suelo`, que salen de la propia simulacion).
//   node herramientas/ejemplos/demolicion/generar.mjs   -> asset_NN.json + escena.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
let semilla = 5;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };

const DUR = 11000, PISO = 610, TX = 700;                // x de la torre en la escena
const PISOS = 10, ALTO_PISO = 50, ANCHO_PANEL = 58, PANELES = 4;
const ANCHO = PANELES * ANCHO_PANEL;                    // 232
const T_CARGAS = 3000, T_LIBERA = 3550, CADA = 45;       // ondas muy seguidas: la torre baja casi en bloque

// ------------------------------------------------------------------ la torre (asset): paneles sueltos
function torre() {
    const partes = [];
    for (let k = 0; k < PISOS; k++) {
        const y1 = -k * ALTO_PISO, y0 = y1 - ALTO_PISO;
        for (let j = 0; j < PANELES; j++) {
            const x0 = -ANCHO / 2 + j * ANCHO_PANEL, x1 = x0 + ANCHO_PANEL;
            const tono = 0.85 + azar() * 0.25;
            const c = (v) => Math.round(Math.min(255, v * tono)).toString(16).padStart(2, "0");
            const muro = `#${c(150)}${c(138)}${c(122)}`;
            const ventanas = [];
            for (let w = 0; w < 2; w++) {
                const vx = x0 + 9 + w * 24, vy = y0 + 12;
                const prendida = azar() < 0.15;
                ventanas.push({nombre: `v_${k}_${j}_${w}`, rect: [vx, vy, vx + 16, vy + 22], color: prendida ? "#c8a060" : "#2a3038", borde: "#4a4038"});
                if (azar() < 0.3) ventanas.push({nombre: `rota_${k}_${j}_${w}`, poligono: [[vx + 2, vy + 2], [vx + 10, vy + 6], [vx + 5, vy + 14]], color: "#14181c"});
            }
            partes.push({nombre: `panel_${k}_${j}`, partes: [
                {nombre: `muro_${k}_${j}`, rect: [x0, y0, x1, y1], degradado: lineal([x0, 0], [x1, 0], [[0, muro], [1, j === PANELES - 1 ? "#6a6050" : muro]]), borde: "#5a5244"},
                {nombre: `losa_${k}_${j}`, rect: [x0, y1 - 5, x1, y1], color: "#7a7062"},
                ...ventanas,
            ]});
        }
    }
    const techo = -PISOS * ALTO_PISO;
    partes.push({nombre: "cornisa", partes: [{nombre: "cornisa_r", rect: [-ANCHO / 2 - 6, techo - 8, ANCHO / 2 + 6, techo], color: "#6a6252"}]});
    partes.push({nombre: "tanque", partes: [
        {nombre: "tanque_cuerpo", rect: [-60, techo - 46, -20, techo - 18], degradado: lineal([-60, 0], [-20, 0], [[0, "#8a6a4a"], [1, "#5a4430"]])},
        {nombre: "tanque_techo", poligono: [[-64, techo - 46], [-40, techo - 60], [-16, techo - 46]], color: "#4a3828"},
        {nombre: "tanque_patas", rect: [-56, techo - 18, -24, techo - 8], color: "#3a3028"}]});
    partes.push({nombre: "antena", partes: [{nombre: "antena_palo", rect: [50, techo - 70, 53, techo - 8], color: "#2a2a2a"},
        {nombre: "antena_travesano", rect: [40, techo - 58, 63, techo - 55], color: "#2a2a2a"}]});
    return {tipo: "asset", nombre: "Torre vieja", duracion: 1000, marcas, partes: [{nombre: "torre", partes}]};
}

// curiosos detras de la valla (siluetas; uno senala y otro se tapa la cara)
function curiosos() {
    const persona = (n, x, alto, color, extra = []) => ({nombre: n, en: [x, 0], partes: [
        {nombre: `${n}_cuerpo`, poligono: [[-13, 0], [-15, -alto * 0.62], [-9, -alto * 0.72], [9, -alto * 0.72], [15, -alto * 0.62], [13, 0]], color},
        {nombre: `${n}_cabeza`, en: [0, -alto * 0.82], circulo: {r: alto * 0.1, lados: 14}, color}, ...extra]});
    const brazo = (n, color, a0, a1) => ({nombre: `${n}_brazo`, poligono: [[-3, 0], [3, 0], [3, 34], [-3, 34]], color, en: [10, -112], pivote: [0, 0],
        claves: {rotacion: [[0, a0], [T_CARGAS + 300, a0], [T_CARGAS + 700, a1, "suave"]]}});
    return {tipo: "asset", nombre: "Curiosos", duracion: DUR, marcas, partes: [
        persona("c1", 0, 160, "#1e2228", [brazo("c1", "#1e2228", 10, -120)]),
        persona("c2", 46, 150, "#262a30"),
        persona("c3", 92, 172, "#1a1d22", [brazo("c3", "#1a1d22", 15, -160)]),
        persona("c4", 150, 140, "#22262c"),
        persona("c5", 1020, 168, "#1e2228", [brazo("c5", "#1e2228", 10, -95)]),
        persona("c6", 1066, 150, "#262a30"),
    ]};
}

const ASSETS = [torre(), curiosos()];

// ------------------------------------------------------------------ efectos
const CARGAS = [[-90, -20], [90, -20], [-30, -22], [30, -22], [-90, -72], [90, -72], [-30, -72], [30, -72]];
const efectos = [];
CARGAS.forEach(([x, y], i) => efectos.push({tipo: "explosion", nombre: `carga_${i}`, en: [TX + x, PISO + y], t: T_CARGAS + i * 70, fuerza: 520, radio: 70, arriba: 0.25, umbral: 60}));
// onda de liberacion: el punto esta MUY abajo (y un poco a la izquierda): asi la distancia depende
// casi solo de la altura y cada onda suelta un piso entero, con el mismo empujon (el piso cae junto)
const P = [TX - 1000, PISO + 20000];
const dist = (x, y) => Math.hypot(x - P[0], y - P[1]);
for (let k = 0; k <= PISOS + 1; k++) {
    // (la ultima onda alcanza el tanque y la antena del techo)
    const yTop = k > PISOS ? PISO - PISOS * ALTO_PISO - 80 : PISO - (k + 1) * ALTO_PISO + 4, far = dist(TX + ANCHO / 2, yTop);
    efectos.push({tipo: "explosion", nombre: `libera_${k}`, en: P, t: T_LIBERA + k * CADA, fuerza: 7000, radio: Math.round(far + 6), arriba: 0, umbral: 0.5});
}
// polvo: sube desde la base y rueda por el piso
for (let i = 0; i < 4; i++) {
    efectos.push({tipo: "particulas", nombre: `polvo_${i}`, en: [TX - 150 + i * 100, PISO - 10], inicio: T_CARGAS + 200 + i * 120, fin: 8000, tasa: 20, vida: 4600,
        velocidad: 95, angulo: -90, dispersion: 110, gravedad: -14, tam_ini: 30, tam_fin: 300, color_ini: "#c8b8a0", color_fin: "#7a7468", suave: "si", opacidad: 0.5});
}
for (const [dx, ang] of [[-120, 180], [120, 0]]) {
    efectos.push({tipo: "particulas", nombre: `polvo_rueda_${ang}`, en: [TX + dx, PISO - 10], inicio: T_LIBERA + 500, fin: 8200, tasa: 16, vida: 3800,
        velocidad: 220, angulo: ang, dispersion: 18, gravedad: -8, tam_ini: 40, tam_fin: 240, color_ini: "#b8a890", color_fin: "#8a8070", suave: "si", opacidad: 0.45});
}
efectos.push({tipo: "particulas", nombre: "chispas", en: [TX, PISO - 40], inicio: T_CARGAS, fin: T_CARGAS + 600, tasa: 120, vida: 600, velocidad: 380, angulo: -90, dispersion: 160,
    gravedad: 900, tam_ini: 4, tam_fin: 1, color_ini: "#fff0a0", color_fin: "#ff6a20", suave: "si", opacidad: 0.9, mezcla: "suma"});

// ------------------------------------------------------------------ escena
const flash = (t) => [[0, 0], [t - 1, 0], [t + 30, 1, "salir"], [t + 260, 0, "entrar"]];
const objetos = [
    {nombre: "cielo", en: [0, 0], plano: -5, rect: [-200, -300, 1500, PISO], degradado: lineal([0, -300], [0, PISO], [[0, "#6a7a8e"], [1, "#c8ccd0"]])},
    {nombre: "edificios_lejos", en: [0, 0], plano: -4, desenfoque: 2, poligono: [[-200, PISO], [-200, 380], [-60, 380], [-60, 300], [80, 300], [80, 350], [200, 350], [200, 260], [330, 260], [330, 400],
        [1020, 400], [1020, 290], [1150, 290], [1150, 330], [1300, 330], [1300, 250], [1500, 250], [1500, PISO]], degradado: lineal([0, 250], [0, PISO], [[0, "#8a96a4"], [1, "#6a7480"]])},
    {nombre: "vecino_izq", en: [0, 0], plano: -2, rect: [400, 330, 540, PISO], degradado: lineal([400, 0], [540, 0], [[0, "#7a6a5a"], [1, "#5a4e42"]])},
    {nombre: "vecino_der", en: [0, 0], plano: -2, rect: [870, 380, 1010, PISO], degradado: lineal([870, 0], [1010, 0], [[0, "#6a5e52"], [1, "#4a4038"]])},
    {nombre: "terreno", en: [0, 0], plano: -3, rect: [-200, PISO, 1500, 900], degradado: lineal([0, PISO], [0, 900], [[0, "#7a6a54"], [1, "#4a3e30"]])},
    {instancia: "Torre vieja", nombre: "torre", en: [TX, PISO], plano: -1,
        fisica: {modo: "desarmar", nivel: 1, rebote: 0.15, friccion: 0.9},
        reacciones: {al_soltarse: "Derrumbe", al_tocar_suelo: {sonido: "Escombros", max: 10}}},
    ...CARGAS.map(([x, y], i) => ({nombre: `fogonazo_${i}`, en: [TX + x, PISO + y], plano: 1, circulo: {r: 60, lados: 20}, mezcla: "suma",
        degradado: radial([0, 0], 60, [[0, rgba("#fff4c0", 0.95)], [0.4, rgba("#ffb040", 0.6)], [1, rgba("#ff6020", 0)]]), claves: {opacidad: flash(T_CARGAS + i * 70)}})),
    {nombre: "valla", en: [0, 0], plano: 2, partes: [
        {nombre: "valla_tabla", rect: [-200, 640, 1500, 660], color: "#d8c020"},
        ...Array.from({length: 24}, (_, i) => ({nombre: `raya_${i}`, poligono: [[-200 + i * 72, 660], [-170 + i * 72, 640], [-150 + i * 72, 640], [-180 + i * 72, 660]], color: "#1a1a1a"})),
        ...Array.from({length: 9}, (_, i) => ({nombre: `poste_${i}`, rect: [-150 + i * 190, 630, -142 + i * 190, 760], color: "#3a3a3a"}))]},
    {instancia: "Curiosos", nombre: "curiosos", en: [60, 790], plano: 3, escala: 1.05, bucle: false},
];
// sonido: las cargas suenan como un clip de la escena; efectos y objetos decorativos no llevan sonido propio
for (const e of efectos) e.sonido = "no_lleva";
for (const o of objetos) if (o.nombre !== "torre") o.sonido = "no_lleva";
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Demolición de la torre", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Ciudad lejana", t: 0, volumen: 0.4, bucle: true, fundido: {entrada: 1000, salida: 1500}},
        {sonido: "Cargas", t: T_CARGAS, volumen: 1},
    ],
    camara: {centro: [660, 380], zoom: 1, temblor: {desde: T_CARGAS, hasta: T_LIBERA + PISOS * CADA + 2200, amplitud: 7},
        claves: {zoom: [[0, 1], [T_CARGAS, 1.08, "suave"], [DUR, 1.18, "suave"]]}},
    objetos, efectos,
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
process.stdout.write(`assets: ${ASSETS.length}, efectos: ${efectos.length}, duracion ${DUR} ms\n`);
