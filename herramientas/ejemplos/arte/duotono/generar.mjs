// Pruebas de arte (planeacion_pruebas_arte.md), prueba 1: DUOTONO CON TRAMADO.
// Escena original: "La plaza de las agujas". Un peregrino encapuchado cruza una plaza de torres
// talladas hasta un portal en el suelo. Todo se dibuja en grises (luz y sombra); el estilo de la
// escena (escena.estilo, Estilo.js) lo convierte en dos colores con tramado de Bayer.
//   asset_01 Suelo de la plaza, 02 Aguja, 03 Mascarón, 04 Arbusto oscuro, 05 Farol, 06 Peregrino,
//   07 Portal, 08 Sombra de nube, 09 Estandarte
//   escena.json: la escena (horizontal 1280x720, 16 s)
//   node herramientas/ejemplos/arte/duotono/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TAU = Math.PI * 2;
const r2 = (v) => Math.round(v * 100) / 100;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const ovalo = (cx, cy, rx, ry, n = 24, k = () => 1) =>
    Array.from({length: n}, (_, i) => { const a = (i / n) * TAU, f = k(a); return [r2(cx + Math.cos(a) * rx * f), r2(cy + Math.sin(a) * ry * f)]; });
let semilla = 11;
const azar = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
const marcas = {EventoGeneral: "no_lleva"};
const g = (v) => { const c = Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"); return `#${c}${c}${c}`; };   // gris
const sombraA = (a) => `rgba(0,0,0,${a})`;
const luzA = (a) => `rgba(255,255,255,${a})`;
const TRANSP = "rgba(0,0,0,0)";

// ------------------------------------------------------------------ acciones (como en el zorro)
const PASO = 50;
function armarAcciones(acciones, params, base) {
    let t = 0;
    const K = {}, ventanas = [];
    for (const a of acciones) {
        const t0 = t;
        for (let tl = 0; tl <= a.dur; tl += PASO) {
            const p = {...base, ...a.pose(Math.min(tl, a.dur), a.dur)};
            for (const [n, [parte, prop]] of Object.entries(params)) ((K[parte] ||= {})[prop] ||= []).push([t0 + Math.min(tl, a.dur), r2(p[n]), "lineal"]);
            if (tl < a.dur && tl + PASO > a.dur) tl = a.dur - PASO;
        }
        ventanas.push({nombre: a.nombre, t0, t1: t0 + a.dur});
        t = t0 + a.dur + 200;
    }
    const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
        tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
    return {K, total: t, eventos: [ev("EventoGeneral", "Nodo_Default", 0, t), ...ventanas.map((v) => ev(v.nombre, "EventoGeneral", v.t0, v.t1))]};
}
function ponerClaves(partes, K) {
    for (const p of partes) {
        if (K[p.nombre]) p.claves = {...(p.claves || {}), ...K[p.nombre]};
        if (p.partes) ponerClaves(p.partes, K);
    }
}
const asset = (nombre, acciones, params, base, partes) => {
    const {K, eventos, total} = armarAcciones(acciones, params, base);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre, duracion: total, eventos, marcas: Object.fromEntries(eventos.map((e) => [e.nombre, "no_lleva"])), partes};
};
// claves en bucle de una sola propiedad: f(u) con u en [0,1)
const ciclo = (dur, f, n = 24) => Array.from({length: n + 1}, (_, i) => [Math.round(dur * i / n), r2(f(i / n)), "suave"]);

// ------------------------------------------------------------------ SUELO (centro en 0,0; 2600 x 1500)
function suelo() {
    const partes = [];
    // luz general: centro claro, bordes en penumbra (el tramado hace la textura)
    partes.push({nombre: "base", capa: 0, rect: [-1300, -750, 1300, 750], degradado: radial([100, -40], 1450, [[0, g(252)], [0.5, g(232)], [0.8, g(175)], [1, g(110)]])});
    // bandas de adoquines: franjas apenas mas oscuras que dan ritmo al tramado
    for (let k = 0; k < 22; k++) {
        const y = -720 + k * 68 + (k % 2) * 6;
        partes.push({nombre: `banda_${k}`, capa: 1, poligono: [[-1300, y], [1300, y - 60], [1300, y - 40], [-1300, y + 20]], color: sombraA(0.07)});
    }
    // manchas de piedra suelta (grupos de puntos oscuros)
    for (let i = 0; i < 140; i++) {
        const x = (azar() - 0.5) * 2500, y = (azar() - 0.5) * 1420, r = 3 + azar() * 7;
        partes.push({nombre: `piedra_${i}`, capa: 2, en: [r2(x), r2(y)], poligono: ovalo(0, 0, r, r * 0.6, 8, (a) => 0.8 + 0.4 * Math.sin(a * 3 + i)), color: g(70 + azar() * 60)});
    }
    // camino: una franja mas clara en diagonal, con bordes de lajas
    partes.push({nombre: "camino", capa: 1, poligono: [[-1300, 260], [-600, 180], [200, 40], [700, -40], [1300, -120], [1300, 40], [700, 110], [200, 190], [-600, 320], [-1300, 400]],
        degradado: lineal([0, -40], [0, 300], [[0, luzA(0.35)], [1, luzA(0.15)]])});
    for (let i = 0; i < 46; i++) {
        const u = i / 45, x = -1300 + u * 2600, y = 330 - u * 450 + (i % 2 ? 70 : -78) - 10;
        partes.push({nombre: `laja_${i}`, capa: 2, en: [r2(x), r2(y)], poligono: [[-16, -5], [14, -7], [17, 4], [-13, 6]], color: g(120 + (i % 3) * 20)});
    }
    // parches de grava: manchas grises irregulares (el tramado las vuelve puntillado, como arena)
    for (let i = 0; i < 38; i++) {
        const x = (azar() - 0.5) * 2400, y = (azar() - 0.5) * 1300, rx = 60 + azar() * 160, ry = rx * (0.35 + azar() * 0.25), k = i;
        partes.push({nombre: `grava_${i}`, capa: 1, en: [r2(x), r2(y)], poligono: ovalo(0, 0, rx, ry, 22, (an) => 1 + 0.25 * Math.sin(an * 3 + k) + 0.12 * Math.sin(an * 7 + 2 * k)),
            degradado: radial([0, 0], rx, [[0, sombraA(0.3 + azar() * 0.15)], [0.7, sombraA(0.18)], [1, sombraA(0)]]), borde: TRANSP});
    }
    // vasijas y bolardos de piedra
    for (let i = 0; i < 22; i++) {
        const x = (azar() - 0.5) * 2300, y = (azar() - 0.5) * 1250, s = 0.7 + azar() * 0.6;
        partes.push({nombre: `vasija_${i}`, capa: 3, en: [r2(x), r2(y)], partes: [
            {nombre: `vasija_${i}_sombra`, en: [14 * s, 0], poligono: ovalo(0, 0, 22 * s, 7 * s, 14), color: sombraA(0.45), borde: TRANSP},
            {nombre: `vasija_${i}_cuerpo`, poligono: [...ovalo(0, -14 * s, 13 * s, 14 * s, 16).filter(([, yy]) => yy > -18 * s), [-7 * s, -26 * s], [7 * s, -26 * s]].sort((p, q) => Math.atan2(p[1] + 14 * s, p[0]) - Math.atan2(q[1] + 14 * s, q[0])),
                degradado: lineal([-13 * s, 0], [13 * s, 0], [[0, g(20)], [1, g(140)]])},
            {nombre: `vasija_${i}_boca`, en: [0, -26 * s], poligono: ovalo(0, 0, 8 * s, 3 * s, 10), color: g(10)},
        ]});
    }
    return {tipo: "asset", nombre: "Suelo de la plaza", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ AGUJA (torre tallada; pies en 0,0)
function aguja() {
    const DUR = 6000, H = 420, partes = [];
    // sombra larga hacia abajo a la derecha (luz de arriba a la izquierda)
    partes.push({nombre: "sombra", capa: 0, poligono: [[-55, -6], [55, -6], [190, 100], [130, 125]], degradado: lineal([0, 0], [170, 115], [[0, sombraA(0.5)], [1, sombraA(0)]]), borde: TRANSP});
    // basamento escalonado
    partes.push({nombre: "base", capa: 1, poligono: ovalo(0, 0, 82, 30, 28), degradado: lineal([-82, 0], [82, 0], [[0, g(60)], [1, g(150)]])});
    partes.push({nombre: "base_2", capa: 2, en: [0, -14], poligono: ovalo(0, 0, 66, 24, 28), degradado: lineal([-66, 0], [66, 0], [[0, g(45)], [1, g(170)]])});
    // cuerpo que se afina, curvo: oscuro a la izquierda, claro a la derecha (volumen)
    const cuerpo = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20, w = 54 * (1 - u) ** 0.8 + 4; cuerpo.push([r2(-w), r2(-20 - u * H)]); }
    for (let i = 20; i >= 0; i--) { const u = i / 20, w = 54 * (1 - u) ** 0.8 + 4; cuerpo.push([r2(w + 8 * Math.sin(u * 3)), r2(-20 - u * H)]); }
    partes.push({nombre: "cuerpo", capa: 3, poligono: cuerpo, degradado: lineal([-55, 0], [60, 0], [[0, g(12)], [0.6, g(45)], [1, g(150)]])});
    // anillos tallados
    [0.12, 0.3, 0.48, 0.64].forEach((u, k) => {
        const w = 54 * (1 - u) ** 0.8 + 6, y = -20 - u * H;
        partes.push({nombre: `anillo_${k}`, capa: 4, poligono: [[-w, y - 4], [w, y - 4], [w, y + 4], [-w, y + 4]], degradado: lineal([-w, 0], [w, 0], [[0, g(90)], [1, g(230)]])});
    });
    // ventanas en arco que titilan (luz adentro)
    [[-12, -130, 9, 20], [16, -205, 7, 16], [-6, -280, 6, 13], [10, -95, 6, 12]].forEach(([x, y, w, h], k) => {
        partes.push({nombre: `ventana_${k}`, capa: 5, en: [x, y], poligono: [[-w, h], [-w, 0], ...ovalo(0, 0, w, w * 1.1, 12).filter(([, yy]) => yy <= 0).sort((a, b) => a[0] - b[0]), [w, 0], [w, h]],
            color: g(240), claves: {opacidad: ciclo(DUR, (u) => 0.75 + 0.25 * Math.sin(TAU * (u * (k + 2)) + k))}, bucle: "repetir"});
    });
    // mascara tallada en el cuerpo
    partes.push({nombre: "mascara", capa: 5, en: [4, -165], partes: [
        {nombre: "mascara_cara", poligono: ovalo(0, 0, 22, 28, 20, (a) => (Math.sin(a) > 0 ? 0.9 : 1)), degradado: lineal([-22, 0], [22, 0], [[0, g(70)], [1, g(210)]])},
        {nombre: "mascara_ojo_1", en: [-8, -4], poligono: [[-6, 0], [0, -3], [6, 0], [0, 2]], color: g(15)},
        {nombre: "mascara_ojo_2", en: [9, -4], poligono: [[-6, 0], [0, -3], [6, 0], [0, 2]], color: g(15)},
        {nombre: "mascara_boca", en: [1, 12], rect: [-8, -2, 8, 2], color: g(20)},
    ]});
    // remate: punta curva con banderin que flamea
    partes.push({nombre: "punta", capa: 6, en: [0, -20 - H], poligono: [[-6, 4], [6, 4], [10, -30], [22, -48], [4, -34]], color: g(30)});
    partes.push({nombre: "banderin", capa: 6, en: [6, -20 - H - 20], pivote: [0, 0], poligono: [[0, 0], [46, 6], [34, 12], [44, 20], [0, 16]],
        degradado: lineal([0, 0], [46, 0], [[0, g(120)], [1, g(220)]]),
        claves: {escala_x: ciclo(1400, (u) => 0.85 + 0.15 * Math.sin(TAU * u)), rotacion: ciclo(1400, (u) => 6 * Math.sin(TAU * u + 1))}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Aguja", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ MASCARON (cabeza de piedra gigante; pies en 0,0)
function mascaron() {
    const DUR = 4000;
    return {tipo: "asset", nombre: "Mascarón", duracion: DUR, marcas, partes: [
        {nombre: "sombra", capa: 0, poligono: [[-80, -4], [80, -4], [190, 90], [100, 110]], degradado: lineal([0, 0], [160, 100], [[0, sombraA(0.5)], [1, sombraA(0)]]), borde: TRANSP},
        {nombre: "pedestal", capa: 1, poligono: [[-70, 0], [-56, -60], [56, -60], [70, 0]], degradado: lineal([-70, 0], [70, 0], [[0, g(40)], [1, g(160)]])},
        // cabeza: casco con cuernos, cara alargada con franjas
        {nombre: "cabeza", capa: 2, en: [0, -60], poligono: [[-86, -40], [-120, -150], [-70, -120], [-40, -170], [0, -150], [40, -170], [70, -120], [120, -150], [86, -40], [50, 0], [-50, 0]],
            degradado: lineal([-120, 0], [120, 0], [[0, g(20)], [0.5, g(55)], [1, g(150)]])},
        {nombre: "frente", capa: 3, en: [0, -130], poligono: ovalo(0, 0, 52, 26, 20), degradado: lineal([-52, 0], [52, 0], [[0, g(60)], [1, g(200)]])},
        {nombre: "ojo_1", capa: 4, en: [-24, -126], poligono: [[-16, 0], [0, -6], [16, 0], [0, 5]], color: g(245),
            claves: {opacidad: ciclo(DUR, (u) => 0.55 + 0.45 * Math.sin(TAU * u) ** 2)}, bucle: "repetir"},
        {nombre: "ojo_2", capa: 4, en: [24, -126], poligono: [[-16, 0], [0, -6], [16, 0], [0, 5]], color: g(245),
            claves: {opacidad: ciclo(DUR, (u) => 0.55 + 0.45 * Math.sin(TAU * u) ** 2)}, bucle: "repetir"},
        // boca con dientes (franjas claras y oscuras: muy de este estilo)
        {nombre: "boca", capa: 3, en: [0, -82], partes: Array.from({length: 7}, (_, k) => ({nombre: `diente_${k}`, rect: [-35 + k * 10, -14, -29 + k * 10, 14], color: g(k % 2 ? 230 : 25)}))},
        {nombre: "brillo", capa: 5, en: [0, -125], circulo: {r: 90, lados: 28}, mezcla: "suma", degradado: radial([0, 0], 90, [[0, luzA(0.25)], [1, luzA(0)]]),
            claves: {opacidad: ciclo(DUR, (u) => 0.4 + 0.6 * Math.sin(TAU * u) ** 2)}, bucle: "repetir"},
    ]};
}

// ------------------------------------------------------------------ ARBUSTO OSCURO (masa de follaje; pies en 0,0)
function arbusto() {
    const DUR = 5000, partes = [];
    partes.push({nombre: "sombra", capa: 0, poligono: ovalo(60, 0, 170, 50, 24), degradado: radial([60, 0], 170, [[0, sombraA(0.5)], [1, sombraA(0)]]), borde: TRANSP});
    const bolas = [[-80, -60, 70], [0, -90, 85], [80, -55, 65], [-30, -150, 60], [50, -140, 55], [-120, -20, 45], [120, -15, 45]];
    bolas.forEach(([x, y, r], k) => partes.push({nombre: `follaje_${k}`, capa: 1 + (y > -100 ? 1 : 0), en: [x, y], poligono: ovalo(0, 0, r, r * 0.85, 22, (a) => 1 + 0.08 * Math.sin(a * 7 + k)),
        degradado: radial([-r * 0.3, -r * 0.4], r * 1.3, [[0, g(120)], [0.5, g(45)], [1, g(15)]]),
        claves: {rotacion: ciclo(DUR, (u) => 2 * Math.sin(TAU * u + k))}, bucle: "repetir"}));
    // motas de luz sobre las hojas
    for (let i = 0; i < 30; i++) {
        const b = bolas[i % bolas.length], a = azar() * TAU, d = azar() * b[2] * 0.7;
        partes.push({nombre: `hoja_luz_${i}`, capa: 3, en: [r2(b[0] + Math.cos(a) * d - b[2] * 0.2), r2(b[1] + Math.sin(a) * d * 0.8 - b[2] * 0.25)], poligono: ovalo(0, 0, 4, 2.5, 6), color: g(200)});
    }
    return {tipo: "asset", nombre: "Arbusto oscuro", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ FAROL (poste con linterna que se mece; pies en 0,0)
function farol() {
    const DUR = 3000;
    return {tipo: "asset", nombre: "Farol", duracion: DUR, marcas, partes: [
        {nombre: "sombra", capa: 0, poligono: [[-6, 0], [6, 0], [80, 50], [70, 56]], color: sombraA(0.35), borde: TRANSP},
        {nombre: "halo_suelo", capa: 0, en: [30, 0], poligono: ovalo(0, 0, 90, 30, 24), degradado: radial([0, 0], 90, [[0, luzA(0.5)], [1, luzA(0)]]), borde: TRANSP},
        {nombre: "poste", capa: 1, rect: [-4, -150, 4, 0], degradado: lineal([-4, 0], [4, 0], [[0, g(20)], [1, g(110)]])},
        {nombre: "brazo", capa: 1, poligono: [[0, -150], [0, -158], [34, -164], [36, -156]], color: g(30)},
        {nombre: "linterna", capa: 2, en: [34, -160], pivote: [0, 0], partes: [
            {nombre: "cuerda", rect: [-1, 0, 1, 14], color: g(30)},
            {nombre: "caja", en: [0, 26], poligono: [[-9, -12], [9, -12], [7, 12], [-7, 12]], color: g(250)},
            {nombre: "techo", en: [0, 12], poligono: [[-12, 3], [0, -6], [12, 3]], color: g(25)},
            {nombre: "luz", en: [0, 26], circulo: {r: 40, lados: 20}, mezcla: "suma", degradado: radial([0, 0], 40, [[0, luzA(0.6)], [1, luzA(0)]])},
        ], claves: {rotacion: ciclo(DUR, (u) => 7 * Math.sin(TAU * u))}, bucle: "repetir"},
    ]};
}

// ------------------------------------------------------------------ PEREGRINO (encapuchado pequenito; mira a la derecha; pies en 0,0)
function peregrino() {
    const partes = [
        {nombre: "sombra", capa: 0, poligono: ovalo(10, 0, 22, 7, 16), color: sombraA(0.5), borde: TRANSP},
        {nombre: "cuerpo", pivote: [0, -4], partes: [
            {nombre: "pierna_1", capa: 1, pivote: [-3, -14], rect: [-6, -14, -1, 0], color: g(20)},
            {nombre: "pierna_2", capa: 1, pivote: [4, -14], rect: [1, -14, 6, 0], color: g(35)},
            {nombre: "capa", capa: 2, pivote: [0, -40], poligono: [[-6, -42], [8, -42], [16, -10], [12, -6], [-14, -6], [-18, -12]],
                degradado: lineal([-18, 0], [16, 0], [[0, g(15)], [1, g(90)]])},
            {nombre: "bolso", capa: 3, en: [-12, -24], poligono: ovalo(0, 0, 5, 7, 10), color: g(60)},
            {nombre: "cabeza", capa: 4, en: [2, -48], partes: [
                {nombre: "capucha", poligono: [[-10, 4], [-11, -6], [-4, -14], [6, -13], [11, -4], [10, 6]], color: g(25)},
                {nombre: "punta_capucha", poligono: [[-9, -8], [-20, -2], [-10, -2]], color: g(25)},
                {nombre: "cara", en: [4, -2], poligono: ovalo(0, 0, 4.5, 5.5, 12), color: g(15)},
                {nombre: "ojo", en: [6, -3], circulo: {r: 1.4, lados: 6}, color: g(250)},
            ]},
            {nombre: "baculo", capa: 5, en: [12, -26], pivote: [0, 0], rect: [-1.2, -26, 1.2, 26], color: g(140)},
        ]},
    ];
    const params = {pc: ["pierna_1", "rotacion"], pl: ["pierna_2", "rotacion"], cy: ["cuerpo", "y"], capa: ["capa", "escala_x"], cab: ["cabeza", "rotacion"], bac: ["baculo", "rotacion"]};
    const base = {pc: 0, pl: 0, cy: 0, capa: 1, cab: 0, bac: 0};
    const acciones = [
        {nombre: "Caminar", dur: 800, pose: (tl, d) => { const th = TAU * tl / d;
            return {pc: 24 * Math.sin(th), pl: -24 * Math.sin(th), cy: -1.5 * Math.abs(Math.sin(th)), capa: 1 + 0.06 * Math.sin(th * 2), cab: 2 * Math.sin(th), bac: 10 * Math.sin(th)}; }},
        {nombre: "Quieto", dur: 3000, pose: (tl, d) => ({cy: -0.6 * Math.sin(TAU * tl / d), capa: 1 + 0.03 * Math.sin(TAU * tl / d), cab: 2 * Math.sin(TAU * tl / d)})},
        {nombre: "Mirar arriba", dur: 2000, pose: (tl, d) => ({cab: -18 * Math.min(1, tl / 500), cy: -0.5 * Math.sin(TAU * tl / d)})},
    ];
    return asset("Peregrino", acciones, params, base, partes);
}

// ------------------------------------------------------------------ PORTAL (rombo en el suelo; centro en 0,0)
// Acciones: "Latir" (en bucle) y "Abrirse" (una vez: un destello y queda brillando)
function portal() {
    const partes = [
        {nombre: "marco", capa: 0, poligono: [[0, -30], [62, 0], [0, 30], [-62, 0]], degradado: lineal([-62, 0], [62, 0], [[0, g(10)], [1, g(70)]])},
        {nombre: "hueco", capa: 1, poligono: [[0, -22], [46, 0], [0, 22], [-46, 0]], degradado: radial([0, 0], 50, [[0, g(250)], [0.6, g(170)], [1, g(60)]])},
        {nombre: "rayo", capa: 2, poligono: [[-30, 0], [-8, -260], [8, -260], [30, 0]], mezcla: "suma", degradado: lineal([0, 0], [0, -260], [[0, luzA(0.7)], [1, luzA(0)]]), borde: TRANSP},
        {nombre: "halo", capa: 2, circulo: {r: 120, lados: 28}, mezcla: "suma", degradado: radial([0, 0], 120, [[0, luzA(0.55)], [1, luzA(0)]]), borde: TRANSP},
    ];
    const params = {hueco: ["hueco", "opacidad"], rayo: ["rayo", "opacidad"], rayo_e: ["rayo", "escala_x"], halo: ["halo", "opacidad"], halo_e: ["halo", "escala_x"], halo_ey: ["halo", "escala_y"]};
    const base = {hueco: 0.7, rayo: 0, rayo_e: 1, halo: 0.3, halo_e: 1, halo_ey: 1};
    const acciones = [
        {nombre: "Latir", dur: 2400, pose: (tl, d) => { const s = 0.5 + 0.5 * Math.sin(TAU * tl / d); return {hueco: 0.55 + 0.35 * s, halo: 0.2 + 0.3 * s, halo_e: 0.9 + 0.2 * s, halo_ey: 0.9 + 0.2 * s}; }},
        {nombre: "Abrirse", dur: 2400, pose: (tl) => { const k = Math.min(1, tl / 300), f = Math.max(0, 1 - Math.max(0, tl - 300) / 1500);
            return {hueco: 1, rayo: k * (0.6 + 0.4 * f), rayo_e: 0.4 + 0.6 * k + 0.5 * f, halo: 0.6 + 0.4 * f, halo_e: 1 + 1.2 * f, halo_ey: 1 + 1.2 * f}; }},
    ];
    return asset("Portal", acciones, params, base, partes);
}

// ------------------------------------------------------------------ SOMBRA DE NUBE (mancha suave que cruza el suelo)
const sombraNube = () => ({tipo: "asset", nombre: "Sombra de nube", duracion: 1000, marcas, partes: [
    {nombre: "mancha", poligono: ovalo(0, 0, 420, 170, 32, (a) => 1 + 0.15 * Math.sin(a * 3) + 0.08 * Math.sin(a * 7)), degradado: radial([0, 0], 420, [[0, sombraA(0.42)], [0.6, sombraA(0.25)], [1, sombraA(0)]]), borde: TRANSP},
]});

// ------------------------------------------------------------------ ESTANDARTE (mastil con tela larga que ondea; pies en 0,0)
function estandarte() {
    const DUR = 2000, tela = (fase) => (u) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const s = i / 10; pts.push([r2(4 + 8 * Math.sin(TAU * (u - s * 0.8) + fase) * s), r2(-200 + s * 120)]); }
        for (let i = 10; i >= 0; i--) { const s = i / 10; pts.push([r2(34 + 8 * Math.sin(TAU * (u - s * 0.8) + fase) * s), r2(-200 + s * 120 + (i === 10 ? 20 : 0))]); }
        return pts;
    };
    const formas = {}, pista = [];
    for (let k = 0; k < 8; k++) { formas[`f${k}`] = {poligono: tela(0)(k / 8)}; pista.push([Math.round(DUR * k / 8), `f${k}`, "lineal"]); }
    pista.push([DUR, "f0", "lineal"]);
    return {tipo: "asset", nombre: "Estandarte", duracion: DUR, marcas, partes: [
        {nombre: "sombra", capa: 0, poligono: [[-4, 0], [4, 0], [110, 70], [100, 76]], color: sombraA(0.35), borde: TRANSP},
        {nombre: "mastil", capa: 1, rect: [-3, -210, 3, 0], degradado: lineal([-3, 0], [3, 0], [[0, g(20)], [1, g(120)]])},
        {nombre: "tela", capa: 2, poligono: tela(0)(0), degradado: lineal([0, -200], [0, -60], [[0, g(200)], [0.5, g(140)], [1, g(60)]]), formas, claves: {forma: pista}, bucle: "repetir"},
        {nombre: "ojo_tela", capa: 3, en: [19, -150], poligono: [[-9, 0], [0, -5], [9, 0], [0, 5]], color: g(20)},
    ]};
}

// ------------------------------------------------------------------ LA ESCENA (horizontal, 16 s)
function escena() {
    const DUR = 16000, CAMINO = [[180, 930], [700, 860], [1150, 760], [1600, 660], [1730, 640]], LLEGA = 11500;
    // el peregrino recorre el camino a velocidad pareja hasta LLEGA
    const largo = [0];
    for (let i = 1; i < CAMINO.length; i++) largo.push(largo[i - 1] + Math.hypot(CAMINO[i][0] - CAMINO[i - 1][0], CAMINO[i][1] - CAMINO[i - 1][1]));
    const enCamino = (u) => { const d = u * largo[largo.length - 1]; let i = 1; while (i < largo.length - 1 && largo[i] < d) i++;
        const k = (d - largo[i - 1]) / (largo[i] - largo[i - 1]); return [CAMINO[i - 1][0] + (CAMINO[i][0] - CAMINO[i - 1][0]) * k, CAMINO[i - 1][1] + (CAMINO[i][1] - CAMINO[i - 1][1]) * k]; };
    const px = [], py = [], cx = [], cy = [];
    for (let t = 0; t <= LLEGA; t += 250) {
        const [x, y] = enCamino(t / LLEGA);
        px.push([t, r2(x), "lineal"]); py.push([t, r2(y), "lineal"]);
    }
    // la camara sigue al peregrino con retraso, un poco por delante
    for (let t = 0; t <= DUR; t += 500) {
        const [x, y] = enCamino(Math.min(1, Math.max(0, (t - 600) / LLEGA)));
        cx.push([t, r2(Math.min(1640, Math.max(660, x + 120))), "suave"]); cy.push([t, r2(Math.min(780, Math.max(420, y - 120))), "suave"]);
    }
    const zoom = [[0, 1, "suave"], [LLEGA, 1.08, "suave"], [LLEGA + 1500, 1.25, "suave"], [DUR, 1.3, "suave"]];
    return {
        tipo: "escena", nombre: "La plaza de las agujas", duracion: DUR, precision: "decimal", profundidad: true,
        estilo: {paleta: ["#3a2440", "#f2b8c6"], tramado: "bayer4", pixel: 1.5, contraste: 1.4, brillo: 0.06},
        camara: {tamano: [1280, 720], centro: [cx[0][1], cy[0][1]], zoom: 1, claves: {x: cx, y: cy, zoom}},
        objetos: [
            {instancia: "Suelo de la plaza", nombre: "suelo", en: [1200, 700], plano: -10},
            {instancia: "Sombra de nube", nombre: "nube_1", en: [300, 500], plano: -9, claves: {x: [[0, 200], [DUR, 900, "lineal"]], y: [[0, 420], [DUR, 520, "lineal"]]}},
            {instancia: "Sombra de nube", nombre: "nube_2", en: [1500, 1000], plano: -9, escala: 0.8, claves: {x: [[0, 1300], [DUR, 1950, "lineal"]], y: [[0, 1050], [DUR, 1120, "lineal"]]}},
            // agujas
            {instancia: "Aguja", nombre: "aguja_1", en: [430, 470], escala: 1.15},
            {instancia: "Aguja", nombre: "aguja_2", en: [980, 330], escala: 0.85, desfase: 1700},
            {instancia: "Aguja", nombre: "aguja_3", en: [1480, 420], escala: 1.25, desfase: 900, espejo: true},
            {instancia: "Aguja", nombre: "aguja_4", en: [2080, 520], escala: 1, desfase: 2600},
            {instancia: "Aguja", nombre: "aguja_5", en: [1290, 1290], escala: 1.2, desfase: 400},
            {instancia: "Aguja", nombre: "aguja_6", en: [2000, 1150], escala: 0.9, desfase: 3100, espejo: true},
            {instancia: "Mascarón", nombre: "mascaron", en: [190, 560], escala: 1.1},
            {instancia: "Mascarón", nombre: "mascaron_2", en: [1880, 330], escala: 0.75, desfase: 1500},
            // follaje en los bordes (la masa oscura de la izquierda, como un marco)
            {instancia: "Arbusto oscuro", nombre: "arbusto_1", en: [90, 1160], escala: 2.2},
            {instancia: "Arbusto oscuro", nombre: "arbusto_2", en: [640, 260], escala: 1.2, desfase: 1200},
            {instancia: "Arbusto oscuro", nombre: "arbusto_3", en: [2230, 860], escala: 1.6, desfase: 2500},
            {instancia: "Arbusto oscuro", nombre: "arbusto_4", en: [760, 1270], escala: 1.4, desfase: 600},
            // faroles junto al camino y estandartes
            {instancia: "Farol", nombre: "farol_1", en: [560, 820], desfase: 0},
            {instancia: "Farol", nombre: "farol_2", en: [1040, 720], desfase: 800},
            {instancia: "Farol", nombre: "farol_3", en: [1520, 610], desfase: 1600},
            {instancia: "Estandarte", nombre: "estandarte_1", en: [820, 960], desfase: 300},
            {instancia: "Estandarte", nombre: "estandarte_2", en: [1340, 860], desfase: 1100},
            // el portal y el peregrino
            {instancia: "Portal", nombre: "portal", en: [1810, 640], plano: -8, acciones: [[0, "Latir"], [LLEGA + 600, "Abrirse", false]]},
            {instancia: "Peregrino", nombre: "peregrino", en: CAMINO[0], escala: 1.3, claves: {x: px, y: py},
                acciones: [[0, "Caminar"], [LLEGA, "Quieto"], [LLEGA + 500, "Mirar arriba", false]]},
        ],
        // motas de polvo que flotan (varios emisores repartidos por la plaza)
        efectos: [[400, 900], [900, 650], [1300, 900], [1700, 600], [1100, 400]].map(([x, y], i) => ({tipo: "particulas", nombre: `motas_${i}`, en: [x, y],
            inicio: 0, fin: DUR, tasa: 3, vida: 7000, velocidad: 12, angulo: -90, dispersion: 180, gravedad: -1, tam_ini: 3, tam_fin: 5,
            color_ini: "#ffffff", color_fin: "#ffffff", suave: "si", opacidad: 0.85, mezcla: "suma", sonido: "no_lleva"})),
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [suelo(), aguja(), mascaron(), arbusto(), farol(), peregrino(), portal(), sombraNube(), estandarte()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
