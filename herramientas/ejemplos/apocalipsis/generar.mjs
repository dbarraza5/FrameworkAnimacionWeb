// Proyecto "Ciudad en ruinas": ciudad apocaliptica de noche, con zombis en las calles.
// Un sobreviviente con linterna frontal lanza una bengala para desviar a los zombis y se mete a un refugio.
// Escribe un archivo por asset (asset_NN.json, para "crear") y escena.json en esta carpeta.
//   node herramientas/ejemplos/apocalipsis/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const C = {
    cielo: ["#05070f", "#080b17", "#0b0f1f", "#101528", "#171a30"], horizonte: "#2a1c28",
    luna: "#e9e6cf", lunaSombra: "#cfcab0", estrella: "#dfe6ff",
    lejano: "#0e1222", ruina: ["#1a1f2e", "#1e2333", "#232838"], ruinaBorde: "#0c0e16", ventana: "#07080d", fierro: "#4a3a30",
    fuego: "#f0a04a", fuegoVivo: "#ffd27a", fuegoOsc: "#c0391b", frio: "#8fa4c4",
    vereda: "#262931", cordon: "#3b3f49", asfalto: "#14161c", raya: "#5f5a48", grieta: "#0b0c10", charco: "#2c3550",
    metal: "#2d3139", oxido: "#5a3726", quemado: "#2a2624", quemadoOsc: "#141212",
    piel: "#7d8f6a", pielOsc: "#5b6b4c", ojoZ: "#d6e89a", herida: "#5a1f1f", boca: "#1a0f0f",
    chaqueta: "#4a5238", chaquetaOsc: "#363c29", pantalon: "#2a2d33", mochila: "#3b3226", caraS: "#c9a58a", linterna: "#ffeeb0",
    bengala: "#ff3b30", bengalaLuz: "#ff8a7a",
};
const r1 = (v) => Math.round(v * 10) / 10;
const R = (x0, y0, x1, y1) => ({rect: [r1(x0), r1(y0), r1(x1), r1(y1)]});
const circ = (r, lados = 12) => ({circulo: {r, lados}});
const marcas = {EventoGeneral: "no_lleva"};
function barra(a, b, w) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    return {poligono: [[r1(a[0] + nx), r1(a[1] + ny)], [r1(b[0] + nx), r1(b[1] + ny)], [r1(b[0] - nx), r1(b[1] - ny)], [r1(a[0] - nx), r1(a[1] - ny)]]};
}
function azarDe(semilla) { let s = semilla; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

// ------------------------------------------------------------------ cielo y fondo
function cielo(ancho = 3600) {
    const az = azarDe(11), partes = [];
    C.cielo.forEach((c, i) => partes.push({nombre: `banda_${i}`, ...R(-200, i * 120, ancho, i * 120 + 125), color: c}));
    partes.push({nombre: "brillo_incendios", ...R(-200, 430, ancho, 620), color: C.horizonte, opacidad: 0.7});
    for (let i = 0; i < 70; i++) {
        const x = az() * ancho, y = az() * 380, r = 0.8 + az() * 1.6, titila = i % 4 === 0;
        partes.push({nombre: `estrella_${i}`, en: [r1(x), r1(y)], ...circ(r1(r), 6), color: C.estrella, opacidad: r1(0.3 + az() * 0.6),
            ...(titila ? {claves: {opacidad: [[0, 0.9], [700 + Math.round(az() * 1500), 0.15]]}, bucle: "ida_vuelta"} : {})});
    }
    return {tipo: "asset", nombre: "Cielo nocturno", duracion: 1000, marcas, partes};
}

const luna = () => ({tipo: "asset", nombre: "Luna", marcas, partes: [
    {nombre: "halo_grande", ...circ(150, 24), color: "#9aa6c8", opacidad: 0.04},
    {nombre: "halo", ...circ(85, 24), color: "#c9cfe0", opacidad: 0.08},
    {nombre: "disco", ...circ(46, 24), color: C.luna},
    {nombre: "sombra", en: [12, 6], ...circ(38, 20), color: C.lunaSombra, opacidad: 0.5},
    ...[[-14, -12, 8], [10, 14, 6], [18, -16, 4], [-6, 20, 5]].map(([x, y, r], i) => ({nombre: `crater_${i}`, en: [x, y], ...circ(r, 10), color: "#bdb79c"})),
]});

// silueta lejana de la ciudad (se mueve mas lento que la camara)
function ruinasLejanas(ancho = 2600) {
    const az = azarDe(7), pts = [[0, 0]], partes = [];
    let x = 0;
    while (x < ancho) {
        const w = 60 + az() * 120, h = 120 + az() * 200, roto = az() < 0.4;
        pts.push([r1(x), -r1(h)]);
        if (roto) { pts.push([r1(x + w * 0.4), -r1(h - 30 - az() * 50)]); pts.push([r1(x + w * 0.6), -r1(h - 10)]); }
        pts.push([r1(x + w), -r1(h)]);
        for (let k = 0; k < 3; k++) if (az() < 0.25) partes.push({nombre: `luz_${partes.length}`, ...R(x + 10 + az() * (w - 20), -h + 20 + az() * (h - 50), 0, 0), color: C.fuego, opacidad: 0.5});
        x += w;
    }
    pts.push([ancho, 0]);
    // las luces se arman con tamano fijo
    partes.forEach((p) => { const [x0, y0] = p.rect; p.rect = [x0, y0, r1(x0 + 5), r1(y0 + 7)]; });
    return {tipo: "asset", nombre: "Ruinas lejanas", duracion: 1000, marcas, partes: [{nombre: "silueta", poligono: pts, color: C.lejano}, ...partes]};
}

// edificio en ruinas: origen abajo a la izquierda
function edificio(nombre, ancho, alto, semilla, {tono = 0, luces = [], puerta = false} = {}) {
    const az = azarDe(semilla), color = C.ruina[tono], partes = [];
    const caida = (x) => {                  // cuanto baja el borde superior en x (derrumbe)
        const centro = ancho * (0.3 + 0.4 * (semilla % 3) / 2), d = Math.abs(x - centro) / (ancho * 0.35);
        return (d < 1 ? (1 - d) * (70 + (semilla % 4) * 20) : 0) + az() * 14;
    };
    const perfil = [[0, 0]];
    for (let x = 0; x <= ancho; x += 18 + az() * 18) perfil.push([r1(Math.min(x, ancho)), -r1(alto - caida(x))]);
    perfil.push([ancho, -r1(alto - caida(ancho))], [ancho, 0]);
    partes.push({nombre: "cuerpo", poligono: perfil, color, borde: C.ruinaBorde});
    for (let y = -60; y > -alto + 60; y -= 62) partes.push({nombre: `piso_${-y}`, ...R(0, y, ancho, y + 5), color: C.ruinaBorde, opacidad: 0.6});
    let n = 0;
    for (let y = -alto + 100; y < -40; y += 62) {
        for (let x = 16; x < ancho - 30; x += 42) {
            if (puerta && Math.abs(x + 9 - ancho / 2) < 50 && y > -110) continue;
            const idx = n++, lado = az();
            if (lado < 0.12) continue;      // pared derrumbada
            const luz = luces.find((l) => l[0] === idx);
            if (luz) {
                const [, col, parpadea] = luz;
                partes.push({nombre: `ventana_${idx}`, ...R(x, y, x + 18, y + 26), color: col,
                    ...(parpadea ? {claves: {opacidad: [[0, 0.95], [250 + idx * 37 % 300, 0.55], [600, 0.85]]}, bucle: "ida_vuelta"} : {opacidad: 0.85})});
            } else if (lado < 0.3) {
                partes.push({nombre: `ventana_${idx}`, poligono: [[x, y], [x + 18, y + 3], [x + 15, y + 26], [x + 4, y + 22], [x - 2, y + 12]], color: C.ventana});
            } else partes.push({nombre: `ventana_${idx}`, ...R(x, y, x + 18, y + 26), color: C.ventana});
        }
    }
    for (let i = 0; i < 4; i++) {
        const x = 20 + az() * (ancho - 40), y = -alto + caida(x) + 4;
        partes.push({nombre: `fierro_${i}`, ...barra([x, y], [x + (az() - 0.5) * 30, y - 16 - az() * 22], 2.2), color: C.fierro});
    }
    for (let i = 0; i < 2; i++) {
        const x = 20 + az() * (ancho - 60), y = -alto + 120 + az() * (alto - 200);
        partes.push({nombre: `grieta_${i}`, poligono: [[x, y], [x + 8, y + 20], [x + 3, y + 34], [x + 12, y + 60], [x + 7, y + 60], [x - 2, y + 36], [x + 3, y + 22], [x - 3, y + 4]], color: C.ruinaBorde});
    }
    if (puerta) {
        const x0 = ancho / 2 - 34;
        partes.push({nombre: "marco_puerta", ...R(x0, -112, x0 + 68, 0), color: "#101218"});
        partes.push({nombre: "dintel", ...R(x0 - 6, -120, x0 + 74, -110), color: "#2e3342"});
        partes.push({nombre: "saco_izq", poligono: [[x0 - 40, 0], [x0 - 38, -20], [x0 - 6, -22], [x0 - 4, 0]], color: "#4a4536"});
        partes.push({nombre: "saco_der", poligono: [[x0 + 72, 0], [x0 + 74, -22], [x0 + 106, -20], [x0 + 108, 0]], color: "#4a4536"});
        partes.push({nombre: "pintada", poligono: [[x0 - 30, -150], [x0 + 100, -152], [x0 + 98, -146], [x0 - 30, -144]], color: "#8a2a24", opacidad: 0.7});
    }
    return {tipo: "asset", nombre, marcas, duracion: 1000, partes};
}

function calle(ancho = 3200) {
    const az = azarDe(23), partes = [
        {nombre: "vereda", ...R(-200, 0, ancho, 25), color: C.vereda},
        {nombre: "cordon", ...R(-200, 25, ancho, 31), color: C.cordon},
        {nombre: "asfalto", ...R(-200, 31, ancho, 145), color: C.asfalto},
    ];
    for (let x = 0, i = 0; x < ancho; x += 200, i++) partes.push({nombre: `junta_${i}`, ...R(x, 0, x + 2, 25), color: "#1d2027"});
    for (let x = 0, i = 0; x < ancho; x += 200, i++) if (az() > 0.35) partes.push({nombre: `raya_${i}`, ...R(x, 86, x + 40 + az() * 30, 90), color: C.raya, opacidad: 0.5});
    for (let i = 0; i < 8; i++) {
        const x = az() * ancho, y = 40 + az() * 90, w = 30 + az() * 60;
        partes.push({nombre: `grieta_${i}`, poligono: [[x, y], [x + w * 0.3, y + 4], [x + w * 0.5, y - 2], [x + w, y + 5], [x + w * 0.5, y + 3], [x + w * 0.3, y + 7]], color: C.grieta});
    }
    for (let i = 0; i < 6; i++) {
        const x = 200 + i * 540 + az() * 120, y = 100 + az() * 30;
        partes.push({nombre: `charco_${i}`, en: [r1(x), r1(y)], elipse: [60 + Math.round(az() * 40), 7], color: C.charco, opacidad: 0.55});
        partes.push({nombre: `reflejo_${i}`, en: [r1(x + 10), r1(y)], elipse: [14, 2], color: "#8a93a8", opacidad: 0.3});
    }
    return {tipo: "asset", nombre: "Calle en ruinas", marcas, partes};
}

const escombros = () => ({tipo: "asset", nombre: "Escombros", marcas, partes: [
    {nombre: "losa_1", poligono: [[-80, 0], [-60, -30], [-20, -42], [10, -20], [0, 0]], color: "#3a3c42", borde: "#1c1d22"},
    {nombre: "losa_2", poligono: [[-10, 0], [6, -38], [44, -52], [70, -14], [80, 0]], color: "#2c2e34", borde: "#1c1d22"},
    {nombre: "bloque", poligono: [[-40, 0], [-36, -18], [-14, -20], [-12, 0]], color: "#45474e"},
    {nombre: "fierro_1", ...barra([20, -40], [36, -78], 2.5), color: C.fierro},
    {nombre: "fierro_2", ...barra([30, -36], [58, -66], 2.5), color: C.fierro},
    {nombre: "polvo", ...R(-90, -4, 90, 0), color: "#1b1c21"},
]});

function autoQuemado() {
    return {tipo: "asset", nombre: "Auto quemado", marcas, partes: [
        {nombre: "carroceria", poligono: [[-120, -18], [-118, -52], [-70, -58], [-40, -92], [50, -94], [85, -60], [120, -52], [122, -18]], color: C.quemado, borde: C.quemadoOsc},
        {nombre: "ventana_tras", poligono: [[-62, -60], [-36, -86], [0, -87], [0, -60]], color: "#0a0a0b"},
        {nombre: "ventana_del", poligono: [[8, -60], [8, -88], [46, -88], [72, -60]], color: "#0a0a0b"},
        {nombre: "oxido_1", poligono: [[-110, -48], [-80, -54], [-70, -30], [-104, -24]], color: C.oxido, opacidad: 0.8},
        {nombre: "oxido_2", poligono: [[60, -50], [110, -46], [100, -26], [70, -30]], color: C.oxido, opacidad: 0.7},
        {nombre: "ceniza", poligono: [[-20, -92], [30, -94], [20, -80], [-10, -82]], color: "#3b3836"},
        {nombre: "rueda_tras", en: [-70, -16], ...circ(18, 12), color: "#0e0e10"},
        {nombre: "rueda_del", en: [72, -16], ...circ(18, 12), color: "#0e0e10"},
        {nombre: "llanta_tras", en: [-70, -16], ...circ(7, 8), color: "#3a3532"},
        {nombre: "llanta_del", en: [72, -16], ...circ(7, 8), color: "#3a3532"},
    ]};
}

const autoVolcado = () => ({tipo: "asset", nombre: "Auto volcado", marcas, partes: [
    {nombre: "techo", poligono: [[-46, 0], [52, 0], [84, -30], [120, -38], [122, -76], [-118, -76], [-120, -40], [-76, -32]], color: "#3a4150", borde: "#161921"},
    {nombre: "ventanas", poligono: [[-40, -4], [46, -4], [70, -28], [-62, -28]], color: "#0b0d12"},
    {nombre: "bajos", ...R(-112, -86, 116, -76), color: "#1a1c22"},
    {nombre: "eje", ...R(-80, -92, 80, -86), color: "#2a2c33"},
    {nombre: "rueda_a", en: [-70, -96], ...circ(18, 12), color: "#121317"},
    {nombre: "rueda_b", en: [72, -96], ...circ(18, 12), color: "#121317"},
    {nombre: "llanta_a", en: [-70, -96], ...circ(7, 8), color: "#5a606c"},
    {nombre: "llanta_b", en: [72, -96], ...circ(7, 8), color: "#5a606c"},
    {nombre: "oxido", poligono: [[80, -70], [116, -66], [112, -44], [86, -48]], color: C.oxido, opacidad: 0.6},
    {nombre: "foco_roto", ...R(116, -60, 124, -48), color: "#6a6a50"},
]});

const bidon = () => ({tipo: "asset", nombre: "Bidón en llamas", duracion: 1000, marcas, partes: [
    {nombre: "resplandor", en: [0, -40], elipse: [120, 70], color: C.fuego, opacidad: 0.1, claves: {opacidad: [[0, 0.12], [380, 0.06], [700, 0.1]]}, bucle: "ida_vuelta"},
    {nombre: "cuerpo", ...R(-20, -58, 20, 0), color: C.oxido, borde: "#2a1a10"},
    {nombre: "aro_1", ...R(-21, -44, 21, -40), color: "#3a2416"},
    {nombre: "aro_2", ...R(-21, -18, 21, -14), color: "#3a2416"},
    {nombre: "brasas", ...R(-18, -62, 18, -56), color: C.fuegoOsc},
]});

const farola = () => ({tipo: "asset", nombre: "Farola", marcas, partes: [
    {nombre: "base", ...R(-10, -14, 10, 0), color: C.metal},
    {nombre: "poste", ...R(-4, -252, 4, -14), color: C.metal},
    {nombre: "brazo", ...barra([0, -250], [60, -262], 6), color: C.metal},
    {nombre: "cabeza", poligono: [[44, -268], [76, -268], [70, -258], [50, -258]], color: "#3a3f49"},
]});

// la luz va aparte para poder apagarla; origen en la lampara
const luzFarola = () => ({tipo: "asset", nombre: "Luz de farola", duracion: 3000, marcas, partes: [
    {nombre: "cono", poligono: [[-12, 2], [12, 2], [150, 320], [-150, 320]], color: "#f3d9a0", opacidad: 0.1},
    {nombre: "charco_luz", en: [0, 322], elipse: [150, 16], color: "#f3d9a0", opacidad: 0.12},
    {nombre: "halo", en: [0, 2], ...circ(34, 14), color: "#ffe2a0", opacidad: 0.25},
    {nombre: "foco", en: [0, 1], elipse: [10, 4], color: "#fff4d0", claves: {opacidad: [[0, 1], [2300, 1], [2350, 0.4], [2420, 1]]}, bucle: "repetir"},
]});

const semaforo = () => ({tipo: "asset", nombre: "Semáforo roto", duracion: 1000, marcas, partes: [
    {nombre: "poste", ...barra([0, 0], [34, -230], 8), color: C.metal},
    {nombre: "caja", poligono: [[22, -280], [48, -276], [44, -206], [18, -210]], color: "#22252c", borde: "#101216"},
    {nombre: "rojo", en: [34, -262], ...circ(7, 10), color: "#3a1414"},
    {nombre: "ambar", en: [32, -243], ...circ(7, 10), color: "#e0a030", claves: {opacidad: [[0, 0.9], [500, 0.9], [520, 0.1], [1000, 0.1]]}, bucle: "repetir"},
    {nombre: "verde", en: [30, -224], ...circ(7, 10), color: "#123018"},
]});

const puertaRefugio = () => ({tipo: "asset", nombre: "Puerta del refugio", marcas, partes: [
    {nombre: "hoja", ...R(0, -110, 66, 0), color: "#3a3d44", borde: "#1c1e22"},
    {nombre: "tabla_1", ...barra([4, -96], [62, -76], 8), color: "#4a3a2a"},
    {nombre: "tabla_2", ...barra([4, -34], [62, -54], 8), color: "#4a3a2a"},
    {nombre: "pomo", en: [56, -54], ...circ(3, 8), color: "#8a8f99"},
]});

const luzRefugio = () => ({tipo: "asset", nombre: "Luz del refugio", duracion: 1000, marcas, partes: [
    {nombre: "derrame", poligono: [[0, 0], [66, 0], [110, 26], [-44, 26]], color: "#f1b866", opacidad: 0.22},
    {nombre: "interior", ...R(0, -110, 66, 0), color: "#f1b866", claves: {opacidad: [[0, 0.95], [500, 0.8]]}, bucle: "ida_vuelta"},
]});

const bengala = () => ({tipo: "asset", nombre: "Bengala", duracion: 1000, marcas, partes: [
    {nombre: "luz_suelo", en: [0, 0], elipse: [160, 22], color: C.bengala, opacidad: 0.18, claves: {opacidad: [[0, 0.2], [160, 0.12], [300, 0.22]]}, bucle: "ida_vuelta"},
    {nombre: "halo", en: [10, -6], ...circ(70, 16), color: C.bengala, opacidad: 0.14, claves: {escala_x: [[0, 1], [200, 1.15]], escala_y: [[0, 1], [200, 1.15]]}, bucle: "ida_vuelta"},
    {nombre: "palo", ...R(-8, -5, 12, 0), color: "#b8221c"},
    {nombre: "punta", en: [13, -3], ...circ(4, 8), color: "#fff0e8"},
]});

// ------------------------------------------------------------------ personajes
// pierna de a (cadera) a b (rodilla) a c (pie)
const pierna = (n, cad, rod, pie, color, bota, claves) => ({nombre: n, pivote: cad, ...(claves ? {claves: {rotacion: claves}, bucle: "ida_vuelta"} : {}), partes: [
    {nombre: `${n}_muslo`, ...barra(cad, rod, 13), color},
    {nombre: `${n}_canilla`, ...barra(rod, pie, 11), color},
    {nombre: `${n}_pie`, poligono: [[pie[0] - 7, pie[1] - 6], [pie[0] + 9, pie[1] - 6], [pie[0] + 13, pie[1] + 3], [pie[0] - 7, pie[1] + 3]], color: bota},
]});

// Sobreviviente (mira a la derecha), con linterna en la frente. pose: caminando | agachado | sigilo | lanzando
function sobreviviente(nombre, pose) {
    const b = pose === "agachado" || pose === "sigilo" ? 22 : 0, Y = (y) => y + b;
    const cad = [0, Y(-52)], rod = b ? [16, -26] : [2, -27], pie = [0, -3];
    const paso = pose === "caminando" ? 420 : 640, amp = pose === "caminando" ? 22 : pose === "sigilo" ? 14 : 0;
    const kl = (f) => amp ? [[0, f * amp], [paso, -f * amp]] : null;
    const hombro = [2, Y(-88)];
    const rotBrazo = pose === "lanzando" ? null : pose === "caminando" ? [[0, 22], [paso, -22]] : null;
    const brazo = {nombre: "brazo", pivote: hombro, rotacion: pose === "agachado" ? -35 : pose === "sigilo" ? -45 : 0,
        ...(rotBrazo ? {claves: {rotacion: rotBrazo}, bucle: "ida_vuelta"} : {}),
        ...(pose === "lanzando" ? {claves: {rotacion: [[0, 150], [180, 165], [420, -70, "salir"], [1000, -40]]}} : {}),
        partes: [
            {nombre: "manga", ...barra(hombro, [hombro[0] + 1, hombro[1] + 18], 11), color: C.chaqueta},
            {nombre: "antebrazo", ...barra([hombro[0] + 1, hombro[1] + 17], [hombro[0] + 2, hombro[1] + 32], 9), color: C.chaquetaOsc},
            {nombre: "mano", en: [hombro[0] + 2, hombro[1] + 35], ...circ(4.5, 8), color: C.caraS},
        ]};
    const cabeza = [
        {nombre: "capucha", poligono: [[-12, Y(-116)], [6, Y(-118)], [13, Y(-108)], [13, Y(-96)], [-11, Y(-94)], [-15, Y(-104)]], color: C.chaquetaOsc},
        {nombre: "cara", poligono: [[4, Y(-110)], [13, Y(-108)], [14, Y(-98)], [8, Y(-95)], [3, Y(-97)]], color: C.caraS},
        {nombre: "linterna", ...R(4, Y(-114), 13, Y(-109)), color: "#5a5e66"},
        {nombre: "foco", en: [14, Y(-111.5)], ...circ(2.2, 6), color: C.linterna},
        {nombre: "haz", poligono: [[14, Y(-112)], [430, Y(-200)], [430, 6], [14, Y(-110)]], color: C.linterna, opacidad: 0.1},
        {nombre: "haz_centro", poligono: [[14, Y(-112)], [300, Y(-150)], [300, Y(-50)], [14, Y(-110)]], color: C.linterna, opacidad: 0.08},
    ];
    return {tipo: "asset", nombre, duracion: 1000, marcas, partes: [
        pierna("pierna_tras", cad, rod, pie, "#22252a", "#121316", kl(1)),
        {nombre: "mochila", poligono: [[-24, Y(-96)], [-8, Y(-98)], [-6, Y(-58)], [-24, Y(-60)]], color: C.mochila, borde: "#1e1a12"},
        {nombre: "saco_dormir", ...R(-26, Y(-104), -6, Y(-96)), color: "#3a4452"},
        {nombre: "torso", poligono: [[-12, Y(-96)], [12, Y(-96)], [16, Y(-66)], [12, Y(-50)], [-12, Y(-50)], [-15, Y(-66)]], color: C.chaqueta, borde: "#1c2014"},
        {nombre: "bolsillo", ...R(2, Y(-72), 12, Y(-62)), color: C.chaquetaOsc},
        {nombre: "cinturon", ...R(-12, Y(-55), 12, Y(-50)), color: "#1a1a1a"},
        pierna("pierna_frente", cad, rod, pie, C.pantalon, "#121316", kl(-1)),
        ...cabeza,
        brazo,
    ]};
}

// Zombi (mira a la derecha): cojea, los brazos hacia adelante y el torso inclinado
function zombi(nombre, {camisa, pantalon = "#2b2a2e", piel = C.piel, periodo = 760, incl = 14, semilla = 1}) {
    const az = azarDe(semilla);
    const cad = [0, -52];
    const brazo = (n, color, base, amp, per) => ({nombre: n, pivote: [3, -88], claves: {rotacion: [[0, base - amp], [per, base + amp]]}, bucle: "ida_vuelta", partes: [
        {nombre: `${n}_manga`, ...barra([3, -88], [4, -72], 11), color: camisa},
        {nombre: `${n}_brazo`, ...barra([4, -73], [5, -54], 8), color},
        {nombre: `${n}_mano`, poligono: [[1, -56], [9, -56], [10, -48], [6, -46], [2, -49]], color},
    ]});
    return {tipo: "asset", nombre, duracion: 2000, marcas, partes: [
        brazo("brazo_tras", C.pielOsc, -76, 7, periodo * 1.1),
        pierna("pierna_tras", cad, [3, -27], [0, -3], "#1f1e22", "#101012", [[0, -12], [periodo, 16]]),
        {nombre: "cuerpo", pivote: cad, claves: {rotacion: [[0, incl - 5], [periodo, incl + 5]]}, bucle: "ida_vuelta", partes: [
            {nombre: "torso", poligono: [[-12, -96], [11, -96], [15, -68], [12, -50], [-12, -50], [-14, -68]], color: camisa, borde: "#121214"},
            {nombre: "jirones", poligono: [[-12, -54], [-6, -44], [-2, -52], [4, -42], [8, -51], [12, -46], [12, -52], [-12, -52]], color: camisa},
            {nombre: "herida", poligono: [[-2, -84], [8, -82], [6, -72], [-3, -76]], color: C.herida},
            {nombre: "cuello", ...R(-4, -100, 5, -94), color: C.pielOsc},
            {nombre: "cabeza", pivote: [0, -98], claves: {rotacion: [[0, 6 + az() * 6], [periodo * 1.4, 22 + az() * 8]]}, bucle: "ida_vuelta", partes: [
                {nombre: "craneo", poligono: [[-11, -118], [6, -120], [13, -110], [13, -99], [6, -95], [-9, -96], [-13, -106]], color: piel, borde: "#2a3322"},
                {nombre: "pelo", poligono: [[-11, -118], [6, -120], [8, -115], [-2, -114], [-8, -110], [-13, -108]], color: "#1c1a18"},
                {nombre: "cuenca", ...R(4, -112, 11, -106), color: "#1c2116"},
                {nombre: "ojo", en: [8, -109], ...circ(1.6, 6), color: C.ojoZ},
                {nombre: "boca", poligono: [[5, -102], [13, -101], [12, -96], [6, -97]], color: C.boca},
                {nombre: "mancha", en: [-4, -104], ...circ(3, 8), color: C.herida, opacidad: 0.7},
            ]},
        ]},
        pierna("pierna_frente", cad, [3, -27], [0, -3], pantalon, "#101012", [[0, 14], [periodo, -8]]),
        brazo("brazo_frente", piel, -84, 9, periodo * 0.9),
    ]};
}

function zombiArrastra() {
    return {tipo: "asset", nombre: "Zombi arrastrándose", duracion: 2000, marcas, partes: [
        {nombre: "piernas", pivote: [-20, -12], claves: {rotacion: [[0, -3], [900, 3]]}, bucle: "ida_vuelta", partes: [
            {nombre: "pierna_a", ...barra([-20, -12], [-78, -6], 11), color: "#2b2a2e"},
            {nombre: "pierna_b", ...barra([-20, -16], [-72, -14], 10), color: "#1f1e22"},
            {nombre: "pie", poligono: [[-84, -12], [-74, -12], [-74, 0], [-84, 0]], color: "#101012"},
        ]},
        {nombre: "brazo_tras", pivote: [10, -26], claves: {rotacion: [[0, -100], [900, -40]]}, bucle: "ida_vuelta", partes: [
            {nombre: "brazo_tras_b", ...barra([10, -26], [12, 4], 8), color: C.pielOsc},
        ]},
        {nombre: "torso", poligono: [[-24, -10], [-20, -28], [16, -34], [22, -18], [16, -8]], color: "#4a3a3a", borde: "#121214"},
        {nombre: "cabeza", pivote: [20, -30], claves: {rotacion: [[0, -10], [1300, 8]]}, bucle: "ida_vuelta", partes: [
            {nombre: "craneo", poligono: [[18, -42], [32, -44], [38, -34], [34, -24], [22, -24]], color: C.piel, borde: "#2a3322"},
            {nombre: "ojo", en: [32, -36], ...circ(1.6, 6), color: C.ojoZ},
            {nombre: "boca", poligono: [[30, -29], [37, -29], [35, -25], [31, -25]], color: C.boca},
        ]},
        {nombre: "brazo_frente", pivote: [14, -28], claves: {rotacion: [[0, -40], [900, -105]]}, bucle: "ida_vuelta", partes: [
            {nombre: "brazo_frente_b", ...barra([14, -28], [16, 2], 8), color: C.piel},
        ]},
    ]};
}

function niebla(ancho = 3400) {
    const az = azarDe(41), partes = [];
    for (let i = 0; i < 12; i++) {
        const x = i * ancho / 12 + az() * 120, d = 2500 + Math.round(az() * 2500), dx = 40 + Math.round(az() * 50);
        partes.push({nombre: `banda_${i}`, en: [r1(x), r1(-10 + az() * 20)], elipse: [200 + Math.round(az() * 160), 18 + Math.round(az() * 14)],
            color: "#7a88a6", opacidad: r1(0.03 + az() * 0.03), claves: {x: [[0, -dx], [d, dx]]}, bucle: "ida_vuelta"});
    }
    return {tipo: "asset", nombre: "Niebla baja", duracion: 1000, marcas, partes};
}

const ASSETS = [cielo(), luna(), ruinasLejanas(), niebla(),
    edificio("Edificio en ruinas A", 260, 340, 3, {tono: 0, luces: [[4, C.fuego, true], [9, C.fuego, true]]}),
    edificio("Edificio en ruinas B", 220, 260, 8, {tono: 1}),
    edificio("Edificio en ruinas C", 300, 400, 5, {tono: 2, luces: [[14, C.frio, false]]}),
    edificio("Edificio del refugio", 300, 290, 12, {tono: 1, puerta: true}),
    calle(), escombros(), autoQuemado(), autoVolcado(), bidon(), farola(), luzFarola(), semaforo(), puertaRefugio(), luzRefugio(), bengala(),
    sobreviviente("Sobreviviente caminando", "caminando"), sobreviviente("Sobreviviente agachado", "agachado"),
    sobreviviente("Sobreviviente sigilo", "sigilo"), sobreviviente("Sobreviviente lanzando", "lanzando"),
    zombi("Zombi A", {camisa: "#4a5a6a", semilla: 3}), zombi("Zombi B", {camisa: "#6a4a3a", pantalon: "#23262c", periodo: 900, incl: 20, semilla: 9}),
    zombi("Zombi C", {camisa: "#5a5a4a", piel: "#87957a", periodo: 680, incl: 10, semilla: 5}), zombiArrastra()];

// ------------------------------------------------------------------ escena
const DUR = 18000, VEREDA = 585, PISO = 655;
const visible = (desde, hasta) => {
    const k = desde > 0 ? [[0, 0, "mantener"], [desde, 1, "mantener"]] : [[0, 1, "mantener"]];
    if (hasta < DUR) k.push([hasta, 0]);
    return k;
};
const np = {sonido: "no_lleva"};
const CAM = [[0, 640], [6000, 760], [7700, 820], [8800, 1250], [9600, 1150], [12200, 1050], [13800, 1050], [DUR, 1500]];
// paralaje: el objeto acompana a la camara en una fraccion f (1 = fijo en pantalla)
const paralaje = (x0, f) => CAM.map(([t, x]) => [t, r1(x0 + (x - CAM[0][1]) * f), "suave"]);

const edificios = [["Edificio en ruinas B", -60], ["Edificio en ruinas A", 170], ["Edificio en ruinas C", 440], ["Edificio en ruinas B", 750],
    ["Edificio del refugio", 900], ["Edificio en ruinas A", 1215], ["Edificio en ruinas C", 1480], ["Edificio en ruinas B", 1800],
    ["Edificio en ruinas A", 2030], ["Edificio en ruinas C", 2300], ["Edificio en ruinas B", 2610]];

const objetos = [
    {instancia: "Cielo nocturno", nombre: "cielo", en: [-200, 0], plano: -5, claves: {x: paralaje(-200, 0.9)}},
    {instancia: "Luna", nombre: "luna", en: [1010, 120], plano: -5, claves: {x: paralaje(1010, 1)}},
    {instancia: "Ruinas lejanas", nombre: "ruinas_lejanas", en: [-300, 470], plano: -4, claves: {x: paralaje(-300, 0.6)}},
    ...edificios.map(([a, x], i) => ({instancia: a, nombre: `edificio_${i}`, en: [x, VEREDA], plano: -3, espejo: i % 3 === 2, ...(i % 3 === 2 ? {en: [x + (a.endsWith("C") ? 300 : a.endsWith("A") ? 260 : 220), VEREDA]} : {})})),
    {nombre: "ventana_refugio", en: [1030, 400], plano: -3, ...R(0, 0, 18, 26), color: "#f1b866", claves: {opacidad: [[0, 0, "mantener"], [13800, 0], [14100, 0.9]]}},
    {instancia: "Calle en ruinas", nombre: "calle", en: [0, 575], plano: -2},
    {instancia: "Escombros", nombre: "escombros_1", en: [140, 600], plano: -1},
    {instancia: "Escombros", nombre: "escombros_2", en: [2380, 605], escala: 1.2, plano: -1, espejo: true},
    {instancia: "Semáforo roto", nombre: "semaforo", en: [1560, 598], plano: -1},
    {instancia: "Farola", nombre: "farola", en: [1250, 590], plano: -1},
    {instancia: "Luz de farola", nombre: "luz_farola", en: [1310, 330], plano: 1,
        claves: {opacidad: [[0, 1, "mantener"], [6200, 0.15, "mantener"], [6270, 1, "mantener"], [6340, 0, "mantener"], [6420, 0.7, "mantener"], [6500, 0]]}},
    {instancia: "Bidón en llamas", nombre: "bidon", en: [2130, 615], plano: -1},
    {instancia: "Auto quemado", nombre: "auto_quemado", en: [380, 628], plano: -1},
    {instancia: "Puerta del refugio", nombre: "puerta_refugio_luz", en: [1016, VEREDA], plano: -3},
    {instancia: "Luz del refugio", nombre: "luz_refugio", en: [1016, VEREDA], plano: -2, claves: {opacidad: [[0, 0, "mantener"], [12000, 0], [12300, 1, "mantener"], [13100, 1], [13400, 0]]}},
    {instancia: "Puerta del refugio", nombre: "puerta_refugio", en: [1016, VEREDA], plano: -2, claves: {escala_x: [[12000, 1], [12400, 0.08, "salir"], [13000, 0.08], [13400, 1, "entrar"]]}},

    // zombis: vienen por la derecha y, al caer la bengala, se dan vuelta hacia ella
    {instancia: "Zombi A", nombre: "zombi_a_viene", en: [1600, 650], espejo: true, claves: {x: [[0, 1700], [8900, 1250]], opacidad: visible(0, 8900)}},
    {instancia: "Zombi A", nombre: "zombi_a_va", en: [1250, 650], desfase: 300, claves: {x: [[8900, 1250], [DUR, 1960]], opacidad: visible(8900, DUR)}},
    {instancia: "Zombi B", nombre: "zombi_b_viene", en: [1850, 668], espejo: true, claves: {x: [[0, 1900], [9100, 1420]], opacidad: visible(0, 9100)}},
    {instancia: "Zombi B", nombre: "zombi_b_va", en: [1420, 668], desfase: 500, claves: {x: [[9100, 1420], [DUR, 2010]], opacidad: visible(9100, DUR)}},
    {instancia: "Zombi arrastrándose", nombre: "arrastra_viene", en: [2000, 640], espejo: true, claves: {x: [[0, 2000], [9400, 1700]], opacidad: visible(0, 9400)}},
    {instancia: "Zombi arrastrándose", nombre: "arrastra_va", en: [1700, 640], claves: {x: [[9400, 1700], [DUR, 1940]], opacidad: visible(9400, DUR)}},
    {instancia: "Zombi C", nombre: "zombi_c_fondo", en: [2400, 598], escala: 0.8, plano: -1, espejo: true, claves: {x: [[0, 2500], [9000, 2240]], opacidad: visible(0, 9000)}},
    {instancia: "Zombi C", nombre: "zombi_c_fondo_va", en: [2240, 598], escala: 0.8, plano: -1, claves: {x: [[9000, 2240], [DUR, 2090]], opacidad: visible(9000, DUR)}, espejo: true},
    {instancia: "Zombi B", nombre: "zombi_lejos", en: [2750, 596], escala: 0.75, plano: -1, desfase: 200, espejo: true, claves: {x: [[0, 2780], [DUR, 2450]]}},
    // niebla baja: bandas translucidas que derivan
    {instancia: "Niebla baja", nombre: "niebla_atras", en: [-200, 600], plano: -1},
    {instancia: "Niebla baja", nombre: "niebla_frente", en: [-100, 690], plano: 1, desfase: 2500, escala: [1, 1.3]},

    // sobreviviente
    {instancia: "Sobreviviente caminando", nombre: "sob_llega", en: [-60, PISO], claves: {x: [[0, -60], [6000, 720, "salir"]], opacidad: visible(0, 6000)}},
    {instancia: "Sobreviviente agachado", nombre: "sob_escondido", en: [720, PISO], claves: {opacidad: visible(6000, 7700)}},
    {instancia: "Sobreviviente lanzando", nombre: "sob_lanza", en: [720, PISO], bucle: false, desfase: 7700, claves: {opacidad: visible(7700, 8500)}},
    {instancia: "Sobreviviente agachado", nombre: "sob_mira", en: [720, PISO], claves: {opacidad: visible(8500, 9600)}},
    {instancia: "Sobreviviente sigilo", nombre: "sob_se_escabulle", en: [720, PISO], claves: {
        x: [[9600, 720], [11400, 990], [12200, 1049], [12800, 1060]], y: [[11400, PISO], [12200, VEREDA + 3]],
        escala_x: [[11400, 1], [12200, 0.9]], escala_y: [[11400, 1], [12200, 0.9]],
        opacidad: [[0, 0, "mantener"], [9600, 1], [12400, 1], [12800, 0]]}},
    {instancia: "Auto volcado", nombre: "auto_volcado", en: [820, 664], plano: 1},

    // bengala: vuela en arco y queda en el suelo
    {instancia: "Bengala", nombre: "bengala_vuela", en: [745, 545], plano: 1, claves: {
        x: [[7900, 745], [8800, 2050]], y: [[7900, 545], [8350, 300, "salir"], [8800, 640, "entrar"]], rotacion: [[7900, 0], [8800, 1080]],
        opacidad: [[0, 0, "mantener"], [7900, 1, "mantener"], [8800, 0]]}},
    {instancia: "Bengala", nombre: "bengala_suelo", en: [2050, 640], claves: {opacidad: visible(8800, DUR)}},
];

const fuego = (nombre, en, ancho, mucho) => ({tipo: "particulas", nombre, en, inicio: 0, fin: DUR, tasa: mucho ? 70 : 40, vida: 750, velocidad: 90,
    angulo: -90, dispersion: ancho, gravedad: -80, tam_ini: mucho ? 16 : 10, tam_fin: 3, color_ini: C.fuegoVivo, color_fin: C.fuegoOsc, ...np});
const humo = (nombre, en, tam = 1) => ({tipo: "particulas", nombre, en, inicio: 0, fin: DUR, tasa: 7, vida: 3400, velocidad: 45,
    angulo: -95, dispersion: 25, gravedad: -18, tam_ini: 18 * tam, tam_fin: 70 * tam, color_ini: "#3a3335", color_fin: "#0b0d14", ...np});

const efectos = [
    fuego("Fuego del auto", [380, 560], 50, true), humo("Humo del auto", [380, 520], 1.2),
    fuego("Fuego del bidón", [2130, 552], 20, false), humo("Humo del bidón", [2130, 520], 0.7),
    {tipo: "particulas", nombre: "Fuego en el edificio", en: [300, 300], inicio: 0, fin: DUR, tasa: 20, vida: 600, velocidad: 50, angulo: -90, dispersion: 30,
        gravedad: -60, tam_ini: 9, tam_fin: 2, color_ini: C.fuegoVivo, color_fin: C.fuegoOsc, ...np},
    humo("Humo del edificio", [300, 270], 1.6),
    ...[0, 900, 1800].map((x, i) => ({tipo: "particulas", nombre: `Cenizas ${i + 1}`, en: [x + 300, 640], inicio: 0, fin: DUR, tasa: 5, vida: 5000,
        velocidad: 30, angulo: -70, dispersion: 60, gravedad: -6, tam_ini: 2.5, tam_fin: 1, color_ini: C.fuego, color_fin: "#3a1a10", ...np})),
    {tipo: "particulas", nombre: "Chispas de la farola", en: [1310, 334], inicio: 6200, fin: 6520, tasa: 120, vida: 600, velocidad: 140,
        angulo: 90, dispersion: 120, gravedad: 600, tam_ini: 3, tam_fin: 1, color_ini: "#fff4d0", color_fin: C.fuego, ...np},
    {tipo: "particulas", nombre: "Estela de la bengala", en: [745, 545], inicio: 7900, fin: 8800, tasa: 90, vida: 400, velocidad: 20, angulo: -90,
        dispersion: 180, gravedad: 100, tam_ini: 5, tam_fin: 1, color_ini: "#fff0e8", color_fin: C.bengala, ...np,
        claves: {x: [[7900, 745], [8800, 2050]], y: [[7900, 545], [8350, 300, "salir"], [8800, 640, "entrar"]]}},
    {tipo: "particulas", nombre: "Chispas de la bengala", en: [2062, 636], inicio: 8800, fin: DUR, tasa: 60, vida: 500, velocidad: 110,
        angulo: -80, dispersion: 70, gravedad: 300, tam_ini: 4, tam_fin: 1, color_ini: "#fff0e8", color_fin: C.bengala, ...np},
    {tipo: "particulas", nombre: "Humo de la bengala", en: [2062, 630], inicio: 8800, fin: DUR, tasa: 9, vida: 3200, velocidad: 40,
        angulo: -95, dispersion: 25, gravedad: -15, tam_ini: 12, tam_fin: 60, color_ini: "#8a3a40", color_fin: "#120b10", ...np},
];

const escena = {
    tipo: "escena", nombre: "Ciudad en ruinas (noche)", duracion: DUR, profundidad: true,
    sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Viento nocturno", t: 0, volumen: 0.5, bucle: true, fundido: {entrada: 1500, salida: 2000}},
        {sonido: "Ambiente tenso", t: 0, volumen: 0.4, bucle: true, fundido: {entrada: 3000, salida: 2500}},
        {sonido: "Fuego crepitando", t: 0, volumen: 0.35, bucle: true, pan: -0.5},
        {sonido: "Gemido de zombi", t: 2500, volumen: 0.5, pan: 0.6},
        {sonido: "Pasos sigilosos", t: 1500, volumen: 0.45},
        {sonido: "Pasos sigilosos", t: 3500, volumen: 0.45},
        {sonido: "Gemido grave", t: 4600, volumen: 0.6, pan: 0.5},
        {sonido: "Gemido de zombi", t: 6900, volumen: 0.7, pan: 0.4},
        {sonido: "Farola que se apaga", t: 6200, volumen: 0.8, pan: 0.3},
        {sonido: "Lanzamiento", t: 7850, volumen: 0.8},
        {sonido: "Bengala", t: 8800, volumen: 0.55, bucle: true, pan: 0.6, fundido: {entrada: 200, salida: 1500}},
        {sonido: "Gemido grave", t: 9200, volumen: 0.8, pan: 0.6},
        {sonido: "Pasos sigilosos", t: 9700, volumen: 0.3},
        {sonido: "Gemido de zombi", t: 11000, volumen: 0.6, pan: 0.7},
        {sonido: "Pasos sigilosos", t: 11000, volumen: 0.3},
        {sonido: "Puerta", t: 12000, volumen: 0.8, pan: -0.1},
        {sonido: "Puerta", t: 13000, volumen: 0.7, pan: -0.1},
        {sonido: "Gemido grave", t: 15000, volumen: 0.6, pan: 0.5},
    ],
    camara: {centro: [640, 360], zoom: 1, claves: {x: CAM.map(([t, x], i) => i < CAM.length - 1 ? [t, x, "suave"] : [t, x])}},
    objetos, efectos,
};

ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
console.log(`assets: ${ASSETS.length}, objetos: ${objetos.length}, efectos: ${efectos.length}`);
