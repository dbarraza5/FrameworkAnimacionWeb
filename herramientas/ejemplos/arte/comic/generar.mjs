// Pruebas de arte (planeacion_pruebas_arte.md), fase 2: COMIC CON SEMITONO.
// Escena original: "El robo del reloj". De noche, un gato ladron con antifaz huye por los tejados con
// el reloj de la torre: salta entre azoteas, rebota en un toldo (¡BOING!), se burla desde un tejado,
// un reflector lo encuentra y escapa. Colores planos y saturados; el estilo de la escena le pone los
// puntos de imprenta (semitono) y el contorno de tinta automatico.
//   asset_01 Cielo nocturno, 02 Ciudad lejana, 03 Torre del reloj, 04 Tejado, 05 Toldo, 06 Reflector,
//   07 Gato ladrón;  escena.json (horizontal 1280x720, 15 s)
//   node herramientas/ejemplos/arte/comic/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, trayectoria, tramo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(23);
const C = {
    noche: "#101a5a", violeta: "#2b2f9a", magenta: "#b34a9c", coral: "#e07a6a", luna: "#ffe27a", lunaSombra: "#e0902a",
    teal: "#2a8a9a", tealOsc: "#123a5a", ladrillo: "#c8502f", ladrilloOsc: "#7a2a1a", verde: "#2f9f6f", rojo: "#e0302a", naranja: "#f0952e",
    azul: "#3a7ac8", amarillo: "#ffd23a", blanco: "#f6f2ea", negro: "#16121c", gato: "#6a48a8", gatoOsc: "#3e2a6a", hocico: "#efe2f6", rosa: "#ff8aa8",
};

// ------------------------------------------------------------------ CIELO NOCTURNO (centro en 0,0; 3800 x 1600)
function cielo() {
    const partes = [
        {nombre: "fondo", capa: 0, rect: [-1900, -800, 1900, 800], degradado: lineal([0, -800], [0, 800], [[0, C.noche], [0.45, C.violeta], [0.75, C.magenta], [1, C.coral]])},
        {nombre: "halo_luna", capa: 1, en: [400, -260], circulo: {r: 260, lados: 40}, mezcla: "suma", degradado: radial([0, 0], 260, [[0, "rgba(255,230,150,0.35)"], [1, "rgba(255,230,150,0)"]]), borde: TRANSP},
        // luna: la sombra de un lado sale en puntos de semitono
        {nombre: "luna", capa: 2, en: [400, -260], circulo: {r: 120, lados: 48}, degradado: radial([-40, -40], 170, [[0, C.luna], [0.55, C.luna], [1, C.lunaSombra]])},
        ...[[-30, -20, 18], [40, 30, 12], [-10, 55, 9]].map(([x, y, r], k) => ({nombre: `crater_${k}`, capa: 3, en: [400 + x, -260 + y], circulo: {r, lados: 16}, color: "#f0c050"})),
    ];
    for (let i = 0; i < 70; i++) {
        const x = (azar() - 0.5) * 3700, y = -780 + azar() * 900, s = 3 + azar() * 6;
        partes.push({nombre: `estrella_${i}`, capa: 1, en: [r2(x), r2(y)], poligono: [[0, -s], [s * 0.3, -s * 0.3], [s, 0], [s * 0.3, s * 0.3], [0, s], [-s * 0.3, s * 0.3], [-s, 0], [-s * 0.3, -s * 0.3]],
            color: C.blanco, claves: {opacidad: ciclo(3000, (u) => 0.6 + 0.4 * Math.sin(TAU * u + i))}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Cielo nocturno", duracion: 3000, marcas, partes};
}

// ------------------------------------------------------------------ CIUDAD LEJANA (pies en 0,0; de x -1600 a 1600)
function ciudad() {
    const partes = [];
    let x = -1600, k = 0;
    while (x < 1600) {
        const w = 90 + azar() * 140, h = 180 + azar() * 260;
        partes.push({nombre: `edificio_${k}`, capa: 0, rect: [r2(x), r2(-h), r2(x + w), 0], degradado: lineal([0, -h], [0, 0], [[0, C.teal], [1, C.tealOsc]])});
        for (let j = 0; j < 6; j++) {
            if (azar() < 0.45) continue;
            const wx = x + 14 + azar() * (w - 34), wy = -h + 20 + azar() * (h - 60);
            partes.push({nombre: `ventana_${k}_${j}`, capa: 1, en: [r2(wx), r2(wy)], rect: [0, 0, 12, 16], color: C.amarillo,
                ...(azar() < 0.3 ? {claves: {opacidad: [[0, 1, "mantener"], [1500 + j * 300, 0.15, "mantener"], [3000 + k * 50, 1, "mantener"], [6000, 1]]}, bucle: "repetir"} : {})});
        }
        x += w + 8; k++;
    }
    return {tipo: "asset", nombre: "Ciudad lejana", duracion: 6000, marcas, partes};
}

// ------------------------------------------------------------------ TORRE DEL RELOJ (pies en 0,0; alta 640)
function torre() {
    const DUR = 1200, partes = [];
    partes.push({nombre: "cuerpo", capa: 0, rect: [-80, -640, 80, 0], degradado: lineal([-80, 0], [80, 0], [[0, C.ladrilloOsc], [0.4, C.ladrillo], [1, "#e87a55"]])});
    for (let f = 0; f < 14; f++) partes.push({nombre: `ladrillo_${f}`, capa: 1, rect: [-80, -640 + f * 46 + 20, 80, -640 + f * 46 + 23], color: C.ladrilloOsc});
    partes.push({nombre: "techo", capa: 2, poligono: [[-100, -640], [0, -820], [100, -640]], degradado: lineal([-100, 0], [100, 0], [[0, "#1f6f4a"], [1, C.verde]])});
    // reloj sin agujas (las robaron): esfera blanca y un hueco oscuro
    partes.push({nombre: "esfera", capa: 3, en: [0, -480], partes: [
        {nombre: "esfera_aro", circulo: {r: 66, lados: 40}, color: C.amarillo},
        {nombre: "esfera_cara", circulo: {r: 56, lados: 40}, color: C.blanco},
        ...Array.from({length: 12}, (_, i) => { const a = i / 12 * TAU; return {nombre: `marca_${i}`, en: [r2(Math.sin(a) * 46), r2(-Math.cos(a) * 46)], circulo: {r: i % 3 ? 3 : 5, lados: 8}, color: C.negro}; }),
        {nombre: "hueco", circulo: {r: 14, lados: 16}, color: C.negro},
    ]});
    // sirena roja que gira en la punta
    partes.push({nombre: "sirena", capa: 4, en: [0, -830], circulo: {r: 14, lados: 16}, color: C.rojo,
        claves: {opacidad: [[0, 1, "mantener"], [300, 0.35, "mantener"], [600, 1, "mantener"], [900, 0.35, "mantener"], [DUR, 1]]}, bucle: "repetir"});
    partes.push({nombre: "destello", capa: 5, en: [0, -830], pivote: [0, 0], poligono: [[0, 0], [260, -40], [260, 40]], mezcla: "suma", degradado: lineal([0, 0], [260, 0], [[0, "rgba(255,80,60,0.8)"], [1, "rgba(255,80,60,0)"]]), borde: TRANSP,
        claves: {rotacion: [[0, 0, "lineal"], [DUR, 360, "lineal"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Torre del reloj", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ TEJADO (azotea donde se corre en y = 0; de x -280 a 280)
function tejado() {
    const partes = [
        {nombre: "pared", capa: 0, rect: [-280, 0, 280, 760], degradado: lineal([0, 0], [0, 600], [[0, C.naranja], [1, "#8a3a1a"]])},
        {nombre: "cornisa", capa: 2, rect: [-292, -2, 292, 26], color: C.rojo},
        {nombre: "cornisa_sombra", capa: 1, rect: [-280, 26, 280, 46], color: "#a83a1a"},
        {nombre: "chimenea", capa: 1, rect: [150, -90, 196, 0], degradado: lineal([150, 0], [196, 0], [[0, C.ladrilloOsc], [1, C.ladrillo]])},
        {nombre: "chimenea_tapa", capa: 2, rect: [144, -100, 202, -88], color: C.negro},
        {nombre: "antena", capa: 1, poligono: [[-180, 0], [-176, 0], [-176, -120], [-180, -120]], color: C.negro},
        {nombre: "antena_brazo", capa: 1, rect: [-206, -110, -150, -106], color: C.negro},
    ];
    for (let f = 0; f < 3; f++) for (let c = 0; c < 4; c++) {
        const x = -230 + c * 125, y = 90 + f * 150, prendida = (f + c * 2) % 3 === 0;
        partes.push({nombre: `ventana_${f}_${c}`, capa: 1, rect: [x, y, x + 70, y + 90], color: prendida ? C.amarillo : "#24306a"});
        partes.push({nombre: `marco_${f}_${c}`, capa: 2, rect: [x + 33, y, x + 37, y + 90], color: C.negro});
    }
    return {tipo: "asset", nombre: "Tejado", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ TOLDO (superficie donde rebota en y = 0)
function toldo() {
    const franjas = [];
    for (let i = 0; i < 8; i++) {
        const a = -140 + i * 35, b = a + 35, A = -160 + i * 40, B = A + 40;
        franjas.push({nombre: `franja_${i}`, poligono: [[a, 0], [b, 0], [B, 56], [A, 56]], color: i % 2 ? C.blanco : C.rojo});
        franjas.push({nombre: `festón_${i}`, en: [(A + B) / 2, 56], poligono: ovalo(0, 0, 20, 12, 12).filter(([, y]) => y >= 0).concat([[-20, 0]]), color: i % 2 ? C.blanco : C.rojo});
    }
    const partes = [
        {nombre: "pared", capa: 0, rect: [-190, 20, 190, 760], degradado: lineal([0, 20], [0, 600], [[0, C.azul], [1, "#1a3a6a"]])},
        {nombre: "puerta", capa: 1, rect: [-50, 120, 50, 300], color: "#5a2a1a"},
        {nombre: "farolito", capa: 1, en: [90, 150], circulo: {r: 12, lados: 12}, color: C.amarillo},
        {nombre: "lona", capa: 2, pivote: [0, 0], partes: franjas},
    ];
    const params = {e: ["lona", "escala_y"], ex: ["lona", "escala_x"]};
    const base = {e: 1, ex: 1};
    const acciones = [
        {nombre: "Quieto", dur: 1000, pose: () => ({})},
        {nombre: "Rebotar", dur: 900, pose: (tl) => { const amort = Math.exp(-tl / 260); return {e: 1 - 0.45 * amort * Math.cos(TAU * tl / 380), ex: 1 + 0.08 * amort * Math.cos(TAU * tl / 380)}; }},
    ];
    return asset("Toldo", acciones, params, base, partes);
}

// ------------------------------------------------------------------ REFLECTOR (base en 0,0; el haz apunta hacia arriba; se gira con la rotacion de la instancia)
const reflector = () => ({tipo: "asset", nombre: "Reflector", duracion: 1000, marcas, partes: [
    {nombre: "haz", capa: 0, poligono: [[-22, -30], [22, -30], [260, -1400], [-260, -1400]], mezcla: "suma",
        degradado: lineal([0, -30], [0, -1400], [[0, "rgba(255,250,200,0.75)"], [0.6, "rgba(255,250,200,0.35)"], [1, "rgba(255,250,200,0.1)"]]), borde: TRANSP},
    {nombre: "foco", capa: 1, en: [0, -20], circulo: {r: 30, lados: 20}, color: "#8a8a96"},
    {nombre: "lente", capa: 2, en: [0, -32], circulo: {r: 18, lados: 16}, color: "#fffbe0"},
]});

// ------------------------------------------------------------------ GATO LADRON (mira a la derecha; pies en 0,0; alto ~130)
function gato() {
    const T = (x0, x1, y) => [x0, y];   // (ayuda de lectura)
    // remera a rayas: trapecio con franjas negras que siguen el borde
    const ancho = (y) => 15 + (y + 82) / 44 * 5;            // medio ancho del torso en y (de -82 a -38)
    const torso = [[-ancho(-82), -82], [ancho(-82), -82], [ancho(-38), -38], [-ancho(-38), -38]];
    const rayas = [-74, -62, -50].map((y, k) => ({nombre: `raya_${k}`, poligono: [[-ancho(y), y], [ancho(y), y], [ancho(y + 6), y + 6], [-ancho(y + 6), y + 6]], color: C.negro}));
    const pierna = (n, x, color) => ({nombre: `pierna_${n}`, pivote: [x, -40], partes: [
        {nombre: `muslo_${n}`, rect: [x - 6, -42, x + 6, -10], color},
        {nombre: `zapato_${n}`, poligono: [[x - 7, -12], [x + 7, -12], [x + 16, -4], [x + 16, 0], [x - 7, 0]], color: C.negro},
    ]});
    const brazo = (n, x, color, reloj) => ({nombre: `brazo_${n}`, pivote: [x, -76], partes: [
        {nombre: `manga_${n}`, rect: [x - 5, -78, x + 5, -50], color: n === "del" ? C.blanco : "#d8d2e0"},
        {nombre: `mano_${n}`, en: [x, -48], circulo: {r: 6, lados: 12}, color},
        ...(reloj ? [{nombre: "reloj", en: [x + 2, -40], partes: [
            {nombre: "reloj_cadena", rect: [-1, -10, 1, 0], color: C.amarillo},
            {nombre: "reloj_caja", circulo: {r: 13, lados: 20}, degradado: radial([-4, -4], 16, [[0, "#fff3a0"], [1, "#d89a10"]])},
            {nombre: "reloj_cara", circulo: {r: 9, lados: 16}, color: C.blanco},
            {nombre: "reloj_aguja_1", rect: [-0.8, -7, 0.8, 0], color: C.negro},
            {nombre: "reloj_aguja_2", poligono: [[0, -0.8], [6, -0.8], [6, 0.8], [0, 0.8]], color: C.negro},
        ]}] : []),
    ]});
    const cabeza = {nombre: "cabeza", en: [4, -100], pivote: [0, 12], partes: [
        {nombre: "oreja_1", poligono: [[-20, -10], [-16, -34], [-4, -18]], color: C.gato},
        {nombre: "oreja_2", poligono: [[4, -18], [16, -34], [20, -10]], color: C.gato},
        {nombre: "oreja_in", poligono: [[8, -18], [15, -28], [16, -14]], color: C.rosa},
        {nombre: "craneo", circulo: {r: 22, lados: 28}, degradado: radial([-6, -8], 30, [[0, "#8a68c8"], [1, C.gatoOsc]])},
        {nombre: "hocico", en: [10, 8], poligono: ovalo(0, 0, 13, 9, 16), color: C.hocico},
        {nombre: "nariz", en: [18, 3], poligono: [[-4, -2], [4, -2], [0, 3]], color: C.rosa},
        {nombre: "antifaz", en: [4, -4], poligono: [[-24, -2], [-10, -9], [6, -7], [26, -9], [26, 3], [6, 5], [-10, 5], [-24, 4]], color: C.negro},
        {nombre: "ojo_1", en: [-4, -4], poligono: ovalo(0, 0, 5, 3.5, 12), color: C.blanco},
        {nombre: "ojo_2", en: [14, -4], poligono: ovalo(0, 0, 5, 3.5, 12), color: C.blanco},
        {nombre: "pupila_1", en: [-2, -4], circulo: {r: 1.8, lados: 8}, color: C.negro},
        {nombre: "pupila_2", en: [16, -4], circulo: {r: 1.8, lados: 8}, color: C.negro},
        {nombre: "boca", en: [12, 13], poligono: [[-7, -1], [0, 2], [7, -2], [7, 0], [0, 4], [-7, 1]], color: C.negro},
        ...[-1, 1].map((s, k) => ({nombre: `bigote_${k}`, en: [22, 8 + s * 3], rect: [0, -0.7, 16, 0.7], rotacion: s * 10, color: C.negro})),
    ]};
    const partes = [
        {nombre: "sombra", capa: 0, poligono: ovalo(4, 0, 30, 6, 16), color: "rgba(0,0,0,0.45)", borde: TRANSP},
        {nombre: "estela", capa: 0, partes: [[-62, -86, 34], [-74, -66, 44], [-58, -46, 30]].map(([x, y, l], k) => ({nombre: `linea_${k}`, rect: [x, y - 1.5, x + l, y + 1.5], color: C.blanco}))},
        {nombre: "cuerpo", capa: 1, pivote: [0, -40], partes: [
            {nombre: "cola", pivote: [-14, -46], poligono: [[-14, -50], [-34, -60], [-50, -82], [-56, -104], [-50, -110], [-44, -98], [-38, -78], [-24, -62], [-12, -44]], color: C.gato},
            {nombre: "cola_punta", en: [-53, -104], circulo: {r: 6, lados: 10}, color: C.blanco},
            brazo("atras", -8, C.gatoOsc, false),
            pierna("atras", -6, C.gatoOsc),
            pierna("del", 8, C.gato),
            {nombre: "torso", poligono: torso, color: C.blanco},
            ...rayas,
            cabeza,
            brazo("del", 10, C.gato, true),
        ]},
    ];
    const params = {cy: ["cuerpo", "y"], rot: ["cuerpo", "rotacion"], esc: ["cuerpo", "escala_y"], cab: ["cabeza", "rotacion"],
        pa: ["pierna_atras", "rotacion"], pd: ["pierna_del", "rotacion"], ba: ["brazo_atras", "rotacion"], bd: ["brazo_del", "rotacion"],
        cola: ["cola", "rotacion"], est: ["estela", "opacidad"]};
    const base = {cy: 0, rot: 0, esc: 1, cab: 0, pa: 0, pd: 0, ba: 0, bd: 0, cola: 0, est: 0};
    const acciones = [
        {nombre: "Correr", dur: 480, pose: (tl, d) => { const th = TAU * tl / d;
            return {pa: -45 * Math.sin(th), pd: 45 * Math.sin(th), ba: 50 * Math.sin(th), bd: -50 * Math.sin(th), rot: 14, cy: -4 * Math.abs(Math.sin(th)),
                cola: -25 + 10 * Math.sin(th), cab: -6, est: 0.9}; }},
        {nombre: "Saltar", dur: 900, pose: (tl) => { const k = tramo(tl, 0, 250);
            return {pa: -60 * k, pd: 40 * k, ba: -130 * k, bd: -110 * k, rot: 18 * k, cola: -50 * k, cab: -10 * k, est: 0.6, esc: 1 + 0.06 * k}; }},
        {nombre: "Caer", dur: 700, pose: (tl) => { const k = tramo(tl, 0, 200);
            return {pa: 70 * k, pd: 80 * k, ba: 70 * k, bd: 60 * k, rot: -10 * k, esc: 1 - 0.12 * k, cola: 30 * k, cab: 8 * k}; }},
        {nombre: "Burlarse", dur: 1600, pose: (tl, d) => { const th = TAU * tl / d;
            return {bd: -150 + 12 * Math.sin(th * 2), ba: 25, cab: 10 * Math.sin(th), cola: 18 * Math.sin(th * 2), cy: -2 * Math.abs(Math.sin(th * 2)), pa: 6, pd: -6}; }},
        {nombre: "Asustado", dur: 1000, pose: (tl) => {
            return {esc: 1.12, ba: -165 + 8 * Math.sin(TAU * tl / 90), bd: -160 + 8 * Math.sin(TAU * tl / 110), cab: -12, cola: -80, cy: -6 + 2 * Math.sin(TAU * tl / 80), pa: -8, pd: 8}; }},
    ];
    return asset("Gato ladrón", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LA ESCENA (horizontal, 15 s)
function escena() {
    const DUR = 15000;
    const R1 = [420, 560], R2 = [1130, 500], TL = [1560, 650], R3 = [1960, 460], R4 = [2560, 520];
    // recorrido del gato (pies): corre, salta, cae al toldo, rebota, se burla, huye
    const recorrido = [
        [0, 180, R1[1]], [2400, 670, R1[1]], [3300, 950, R2[1], {arco: 170}], [4300, 1370, R2[1]], [5000, TL[0] - 10, TL[1], {arco: 50}],
        [6200, R3[0] - 120, R3[1], {arco: 420}], [9600, R3[0] - 120, R3[1]], [11500, R3[0] + 260, R3[1]], [12300, R4[0] - 200, R4[1], {arco: 130}], [14400, 2950, R4[1]],
    ];
    const tr = trayectoria(recorrido);
    const posEn = (t) => { const i = Math.min(tr.x.length - 1, Math.max(0, Math.round(t / 50))); return [tr.x[i][1], tr.y[i][1]]; };
    // camara: sigue al gato; se acerca cuando se burla
    const cx = [], cy = [], zoom = [];
    for (let t = 0; t <= DUR; t += 500) {
        const [x, y] = posEn(Math.max(0, t - 300));
        const cerca = t >= 6300 && t <= 9400;
        cx.push([t, r2(Math.min(2360, Math.max(640, x + (cerca ? 40 : 180)))), "suave"]);
        cy.push([t, r2(Math.min(520, Math.max(240, y - (cerca ? 200 : 120)))), "suave"]);
        zoom.push([t, cerca ? 1.3 : 1, "suave"]);
    }
    return {
        tipo: "escena", nombre: "El robo del reloj", duracion: DUR, precision: "decimal", profundidad: true,
        estilo: {tramado: "semitono", semitono: {celda: 5, angulo: 20, tinta: "#1b1430", claro: 0.8, color: 0.96}, contorno: {grosor: 1.6, color: "#141018", umbral: 70}},
        camara: {tamano: [1280, 720], centro: [cx[0][1], cy[0][1]], zoom: 1, claves: {x: cx, y: cy, zoom}},
        objetos: [
            {instancia: "Cielo nocturno", nombre: "cielo", en: [1500, 420], plano: -10},
            {instancia: "Ciudad lejana", nombre: "ciudad", en: [1500, 900], plano: -8},
            {instancia: "Torre del reloj", nombre: "torre", en: [600, 640], plano: -6},
            {instancia: "Reflector", nombre: "reflector", en: [1450, 1060], plano: -7,
                claves: {rotacion: [[0, -35, "suave"], [2500, 30, "suave"], [5000, -20, "suave"], [7000, 12, "suave"], [8300, 18, "suave"], [8650, 29, "suave"], [9600, 29, "suave"], [11500, 40, "suave"], [13000, 20, "suave"]]}},
            {instancia: "Tejado", nombre: "tejado_1", en: R1, plano: 0},
            {instancia: "Tejado", nombre: "tejado_2", en: R2, plano: 0, espejo: true},
            {instancia: "Toldo", nombre: "toldo", en: TL, plano: 0, acciones: [[0, "Quieto"], [5000, "Rebotar", false]]},
            {instancia: "Tejado", nombre: "tejado_3", en: R3, plano: 0},
            {instancia: "Tejado", nombre: "tejado_4", en: R4, plano: 0, espejo: true},
            {instancia: "Gato ladrón", nombre: "gato", en: recorrido[0].slice(1, 3), plano: 2, escala: 1.7, claves: tr,
                acciones: [[0, "Correr"], [2400, "Saltar", false], [3300, "Correr"], [4300, "Caer", false], [5000, "Saltar", false], [6200, "Burlarse"],
                    [8600, "Asustado"], [9600, "Correr"], [11500, "Saltar", false], [12300, "Correr"]]},
        ],
        dialogos: [
            {texto: "Medianoche. Alguien acaba de robar el corazón de la torre…", desde: 300, hasta: 4200, estilo: "narrador", velocidad: 30},
            {quien: "toldo", texto: "¡BOING!", desde: 5000, hasta: 6300, estilo: "grito", velocidad: 0},
            {quien: "gato", texto: "¡Ja! ¿Buscaban esto?", desde: 6600, hasta: 8500},
            {quien: "gato", texto: "¡UPS!", desde: 8700, hasta: 9700, estilo: "grito", velocidad: 0},
            {texto: "Continuará…", desde: 12900, hasta: DUR, estilo: "narrador", posicion: "abajo", velocidad: 0},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cielo(), ciudad(), torre(), tejado(), toldo(), reflector(), gato()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
