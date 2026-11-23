// "El zorro y el cuervo" (documento/planeacion_zorro_cuervo.md, fase 3): personajes y fondo.
//   asset_01 Zorro, asset_02 Cuervo, asset_03 Queso, asset_04 Árbol del cuervo, asset_05 Bosque
//   escena.json: muestra de todas las acciones (vertical 9:16), solo para revisar.
//
// Cada personaje tiene ACCIONES = eventos del asset (ventanas de su linea de tiempo). La pose
// de cada accion es una funcion del tiempo local que se muestrea en claves cada PASO ms. En la
// escena, `acciones: [[t, "Caminar"], [t2, "Hablar"]]` cambia de accion en el tiempo.
//   node herramientas/ejemplos/zorro/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PASO = 50;
const r2 = (v) => Math.round(v * 100) / 100;
const TAU = Math.PI * 2;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const ovalo = (cx, cy, rx, ry, n = 24, deforma = () => 1) =>
    Array.from({length: n}, (_, i) => { const a = (i / n) * TAU; const k = deforma(a); return [r2(cx + Math.cos(a) * rx * k), r2(cy + Math.sin(a) * ry * k)]; });
const suave = (x) => x * x * (3 - 2 * x);                      // 0..1 -> 0..1 con entrada y salida suaves
const tramo = (t, a, b) => suave(Math.max(0, Math.min(1, (t - a) / (b - a))));
const mezclar = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ acciones -> eventos + claves
// acciones: [{nombre, dur, bucle?, pose(tl, dur) -> {param: valor}}]; params: {param: [parte, prop]}
function armarAcciones(acciones, params, base) {
    let t = 0;
    const ventanas = [], K = {};
    for (const a of acciones) {
        const t0 = t;
        for (let tl = 0; tl <= a.dur; tl += PASO) {
            const p = {...base, ...a.pose(Math.min(tl, a.dur), a.dur)};
            for (const [n, [parte, prop]] of Object.entries(params)) {
                const v = p[n];
                (K[parte] ||= {})[prop] ||= [];
                K[parte][prop].push([t0 + Math.min(tl, a.dur), typeof v === "number" ? r2(v) : v, "lineal"]);
            }
            if (tl < a.dur && tl + PASO > a.dur) tl = a.dur - PASO;  // la ultima muestra cae justo en el final
        }
        ventanas.push({nombre: a.nombre, t0, t1: t0 + a.dur});
        t = t0 + a.dur + 200;                                 // separacion entre acciones
    }
    const total = t;
    const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
        tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
    const eventos = [ev("EventoGeneral", "Nodo_Default", 0, total), ...ventanas.map((v) => ev(v.nombre, "EventoGeneral", v.t0, v.t1))];
    return {K, eventos, total, ventanas};
}
// pone las claves calculadas en las partes (recorre el arbol)
function ponerClaves(partes, K) {
    for (const p of partes) {
        if (K[p.nombre]) p.claves = {...(p.claves || {}), ...K[p.nombre]};
        if (p.partes) ponerClaves(p.partes, K);
    }
}

// ================================================================== ZORRO (de perfil, mira a la derecha; pies en y = 0)
const Z = {naranja: "#e8782c", naranjaOsc: "#b9531b", naranjaClaro: "#f59a4c", crema: "#f7ead6", cremaOsc: "#e2cfb3",
    media: "#3a2318", mediaOsc: "#24150e", nariz: "#1b1210", ojo: "#e0a020", boca: "#5a1c1c"};

// pata: muslo (cadera) -> pierna (rodilla) -> pie. lado: "cerca" | "lejos"; adelante: delantera o trasera
function pataZorro(nombre, x, capa, lejos) {
    const c = lejos ? Z.naranjaOsc : Z.naranja, m = lejos ? Z.mediaOsc : Z.media;
    const yc = -84, yr = -44;
    return {nombre: `muslo_${nombre}`, capa, pivote: [x, yc], poligono: [[x - 10, yc - 6], [x + 10, yc - 6], [x + 7, yr], [x - 6, yr]], color: c,
        partes: [{nombre: `pierna_${nombre}`, pivote: [x, yr], poligono: [[x - 6, yr - 2], [x + 6, yr - 2], [x + 5, -6], [x - 5, -6]], color: m,
            partes: [{nombre: `pie_${nombre}`, poligono: [[x - 7, -9], [x + 4, -9], [x + 12, -4], [x + 12, 0], [x - 8, 0]], color: m}]}]};
}

function zorro() {
    const parpado = {
        "": [[112, -147], [122, -151], [132, -147], [132, -146.4], [122, -150], [112, -146.4]],
        cerrado: [[112, -147], [122, -151], [132, -147], [132, -138.5], [122, -135.5], [112, -138.5]],
        astuto: [[112, -147], [122, -151], [132, -147], [132, -143], [122, -141.5], [112, -143.5]],
    };
    const cabeza = {nombre: "cabeza", capa: 6, pivote: [74, -112], partes: [
        {nombre: "oreja_lejos", capa: 0, pivote: [80, -150], poligono: [[68, -150], [74, -196], [96, -156]], color: Z.naranjaOsc, borde: Z.mediaOsc},
        // boca: el interior (con lengua) queda tapado por la mandibula cerrada; al abrirla se ve
        // (gira un 70% de lo que gira la mandibula: siempre llena la abertura; lo que sobra queda tapado
        //  arriba por el craneo y abajo por la mandibula)
        {nombre: "garganta", capa: 0, poligono: [[94, -113], [120, -119], [128, -108], [112, -100], [96, -104]], color: Z.crema},
        {nombre: "boca_dentro", capa: 1, pivote: [118, -119], poligono: [[118, -119.5], [148, -130], [151, -122], [146, -115], [122, -113.5]], color: Z.boca,
            partes: [{nombre: "lengua", poligono: [[126, -116], [140, -117], [143, -114.5], [128, -114]], color: "#d9606a"}]},
        {nombre: "mandibula", capa: 2, pivote: [118, -119], poligono: [[116, -121.5], [158, -123], [154, -117], [140, -111], [121, -109.5]], color: Z.crema, borde: Z.cremaOsc,
            partes: [{nombre: "queso_boca", capa: 3, opacidad: 0, poligono: [[142, -122], [172, -128], [170, -110], [146, -112]],
                degradado: lineal([142, -128], [172, -110], [[0, "#ffe27a"], [1, "#f2b733"]]), borde: "#c98f1c",
                partes: [{nombre: "agujero_boca", en: [158, -118], elipse: [3, 2.4], color: "#d9a028"}]}]},
        {nombre: "craneo", capa: 4, poligono: [[60, -150], [72, -163], [96, -168], [118, -158], [140, -142], [160, -133], [170, -128], [166, -122], [150, -122], [120, -120], [96, -110], [70, -110]],
            degradado: lineal([90, -170], [100, -110], [[0, Z.naranjaOsc], [0.45, Z.naranja], [1, Z.naranjaClaro]]), borde: Z.naranjaOsc},
        // hocico blanco: solo arriba de la linea de la boca (no tapa la mandibula)
        {nombre: "hocico", capa: 5, poligono: [[94, -115], [98, -127], [114, -133], [138, -131.5], [156, -128.5], [164, -126.5], [165, -123.6], [150, -122.6], [118, -122]], color: Z.crema},
        {nombre: "colmillo", capa: 3, poligono: [[146, -122.4], [148.6, -117.6], [151, -122.6]], color: "#ffffff"},
        {nombre: "antifaz", capa: 5, poligono: [[106, -150], [126, -154], [140, -145], [124, -139], [108, -141]], color: Z.naranjaOsc, opacidad: 0.5},
        {nombre: "ojo", capa: 6, en: [122, -142], elipse: [8, 5.5], color: "#fffaf0"},
        {nombre: "iris", capa: 7, en: [124, -142], circulo: {r: 4.4, lados: 16}, degradado: radial([0, 0], 4.4, [[0, "#ffd24a"], [1, Z.ojo]])},
        {nombre: "pupila", capa: 8, en: [125, -142], elipse: [1.4, 3.4], color: "#120b08"},
        {nombre: "brillo", capa: 9, en: [126.5, -144], circulo: {r: 1.2, lados: 8}, color: "#ffffff"},
        {nombre: "parpado", capa: 10, poligono: parpado[""], formas: {cerrado: {poligono: parpado.cerrado}, astuto: {poligono: parpado.astuto}}, color: Z.naranja},
        {nombre: "nariz", capa: 11, en: [167, -127], elipse: [5.5, 4], color: Z.nariz},
        {nombre: "oreja", capa: 12, pivote: [92, -152], poligono: [[80, -152], [90, -202], [112, -158]], color: Z.naranja, borde: Z.naranjaOsc,
            partes: [{nombre: "oreja_dentro", poligono: [[88, -156], [91, -190], [104, -159]], color: Z.media}]},
    ]};
    const cola = {nombre: "cola", capa: 1, pivote: [-92, -96],
        poligono: [[-90, -110], [-122, -126], [-158, -132], [-188, -124], [-188, -96], [-152, -88], [-120, -86], [-92, -86]],
        degradado: lineal([-90, -130], [-90, -86], [[0, Z.naranjaOsc], [0.5, Z.naranja], [1, Z.naranjaClaro]]), borde: Z.naranjaOsc,
        partes: [{nombre: "cola_punta", pivote: [-184, -110], inercia: {rigidez: 2.2, amortiguacion: 0.18, limite: 25},
            poligono: [[-184, -126], [-212, -126], [-234, -112], [-236, -98], [-216, -88], [-186, -94]],
            degradado: lineal([-184, 0], [-236, 0], [[0, Z.naranja], [0.35, Z.crema], [1, "#ffffff"]]), borde: Z.cremaOsc}]};
    const cuerpo = {nombre: "cuerpo", capa: 3, poligono: ovalo(-8, -94, 96, 34, 28, (a) => 1 + 0.08 * Math.sin(a) - 0.05 * Math.cos(2 * a)),
        degradado: lineal([0, -130], [0, -60], [[0, Z.naranjaOsc], [0.4, Z.naranja], [1, Z.naranjaClaro]]), borde: Z.naranjaOsc};
    const partes = [{nombre: "torso", pivote: [0, -84], partes: [
        pataZorro("tras_lejos", -62, 0, true), pataZorro("del_lejos", 52, 0, true),
        cola, cuerpo,
        {nombre: "panza", capa: 4, poligono: ovalo(30, -72, 50, 14, 20), color: Z.crema},
        {nombre: "anca", capa: 4, poligono: ovalo(-62, -96, 30, 26, 20), color: Z.naranja, opacidad: 0.55},
        {nombre: "cuello", capa: 5, poligono: [[46, -116], [66, -136], [92, -140], [100, -112], [86, -96], [58, -96]],
            degradado: lineal([60, -140], [70, -96], [[0, Z.naranjaOsc], [1, Z.naranja]])},
        {nombre: "pecho", capa: 5, poligono: [[50, -118], [76, -122], [96, -110], [92, -84], [72, -70], [52, -80]], color: Z.crema},
        pataZorro("tras_cerca", -56, 7, false), pataZorro("del_cerca", 58, 7, false),
        cabeza,
    ]}];

    const params = {
        cuerpo_y: ["torso", "y"], cuerpo_rot: ["torso", "rotacion"], cabeza: ["cabeza", "rotacion"], mandibula: ["mandibula", "rotacion"],
        oreja: ["oreja", "rotacion"], oreja_l: ["oreja_lejos", "rotacion"], cola: ["cola", "rotacion"], parpado: ["parpado", "forma"],
        queso: ["queso_boca", "opacidad"], boca: ["boca_dentro", "rotacion"],
        tc: ["muslo_tras_cerca", "rotacion"], tcr: ["pierna_tras_cerca", "rotacion"], tl: ["muslo_tras_lejos", "rotacion"], tlr: ["pierna_tras_lejos", "rotacion"],
        dc: ["muslo_del_cerca", "rotacion"], dcr: ["pierna_del_cerca", "rotacion"], dl: ["muslo_del_lejos", "rotacion"], dlr: ["pierna_del_lejos", "rotacion"],
    };
    const base = {cuerpo_y: 0, cuerpo_rot: 0, cabeza: 0, mandibula: 0, boca: 0, oreja: 0, oreja_l: 0, cola: 0, parpado: "", queso: 0,
        tc: 0, tcr: 0, tl: 0, tlr: 0, dc: 0, dcr: 0, dl: 0, dlr: 0};
    // parpadeo: cerrado un instante alrededor de tb
    const parpadeo = (tl, tb, normal = "") => (Math.abs(tl - tb) < 60 ? "cerrado" : normal);
    // trote: patas en diagonal (delantera cerca con trasera lejos)
    const trote = (tl, P) => {
        const o = {};
        for (const [p, fase] of [["dc", 0], ["tl", 0], ["dl", 0.5], ["tc", 0.5]]) {
            const th = TAU * (tl / P + fase);
            o[p] = -24 * Math.sin(th);                                   // negativo: el pie va hacia adelante
            o[p + "r"] = 34 * Math.max(0, Math.cos(th)) * (p[0] === "d" ? 1 : -0.6);   // dobla al avanzar
        }
        o.cuerpo_y = -2.5 * Math.abs(Math.cos(TAU * tl / P));
        o.cabeza = 2 * Math.sin(TAU * tl / P * 2);
        o.cola = 7 * Math.sin(TAU * tl / P);
        return o;
    };
    const quieto = (tl, d) => ({cuerpo_y: 1.2 * Math.sin(TAU * tl / d), cola: 9 * Math.sin(TAU * tl / d),
        oreja: tl > d * 0.55 && tl < d * 0.62 ? -14 : 0, cabeza: 1.5 * Math.sin(TAU * tl / d), parpado: parpadeo(tl, d * 0.8)});
    // hablar mirando arriba (al cuervo): silabas irregulares
    const silabas = (tl) => Math.max(0, Math.sin(TAU * tl / 260) * 0.7 + Math.sin(TAU * tl / 410) * 0.5);
    const acciones = [
        {nombre: "Quieto", dur: 2400, pose: quieto},
        {nombre: "Caminar", dur: 800, pose: (tl) => trote(tl, 800)},
        {nombre: "Olfatear", dur: 1600, pose: (tl) => ({cabeza: 16 + (Math.floor(tl / 120) % 2 ? 2.5 : -1) * (tl % 800 < 480 ? 1 : 0),
            cuerpo_rot: 3, oreja: -10, oreja_l: -8, cola: 5 * Math.sin(TAU * tl / 1600), parpado: parpadeo(tl, 1300)})},
        {nombre: "Hablar", dur: 1240, pose: (tl, d) => ({cabeza: -20 + 3 * Math.sin(TAU * tl / d), mandibula: 16 * silabas(tl),
            cola: 10 * Math.sin(TAU * tl / d), parpado: parpadeo(tl, 1000, "astuto"), oreja: -6, cuerpo_y: 1 * Math.sin(TAU * tl / d)})},
        {nombre: "Mirar arriba", dur: 2400, pose: (tl, d) => ({...quieto(tl, d), cabeza: -22 + 1.5 * Math.sin(TAU * tl / d), parpado: parpadeo(tl, d * 0.7, "astuto")})},
        {nombre: "Atrapar", dur: 900, pose: (tl) => {
            const agacha = tramo(tl, 0, 220) - tramo(tl, 220, 330), salto = tramo(tl, 260, 480) - tramo(tl, 560, 820);
            const recoge = tramo(tl, 260, 420) - tramo(tl, 640, 820);
            return {cuerpo_y: 8 * agacha - 46 * salto, cabeza: -28 * tramo(tl, 100, 380) + 22 * tramo(tl, 600, 880), mandibula: 26 * (tramo(tl, 200, 380) - tramo(tl, 560, 640)),
                queso: tl >= 600 ? 1 : 0, dc: -30 * recoge, dcr: 50 * recoge, dl: -24 * recoge, dlr: 44 * recoge, tc: 20 * recoge, tcr: -30 * recoge, tl: 16 * recoge, tlr: -26 * recoge,
                cola: 18 * salto, parpado: tl > 640 && tl < 760 ? "cerrado" : ""};
        }},
        {nombre: "Quieto con queso", dur: 2400, pose: (tl, d) => ({...quieto(tl, d), queso: 1, cabeza: -6 + 1.5 * Math.sin(TAU * tl / d), mandibula: 3, parpado: parpadeo(tl, d * 0.8, "astuto")})},
        {nombre: "Hablar con queso", dur: 1240, pose: (tl, d) => ({queso: 1, cabeza: -10 + 3 * Math.sin(TAU * tl / d), mandibula: 3 + 5 * silabas(tl),
            cola: 10 * Math.sin(TAU * tl / d), parpado: parpadeo(tl, 1000, "astuto"), cuerpo_y: 1 * Math.sin(TAU * tl / d)})},
        {nombre: "Caminar con queso", dur: 800, pose: (tl) => ({...trote(tl, 800), queso: 1, mandibula: 3, parpado: "astuto"})},
        // mastica y se traga el queso: la mandibula sube y baja cada vez menos y el queso se desvanece
        {nombre: "Masticar", dur: 1100, pose: (tl, d) => {
            const k = 1 - tl / d;
            return {queso: Math.max(0, 1 - tl / 550), mandibula: 9 * k * Math.max(0, Math.sin(TAU * tl / 170)), cabeza: -4 + 2.5 * k * Math.sin(TAU * tl / 170),
                parpado: tl > 700 ? "astuto" : "", cola: 8 * Math.sin(TAU * tl / d), cuerpo_y: 0.8 * Math.sin(TAU * tl / 340)};
        }},
    ];
    // el interior de la boca sigue a la mandibula
    const conBoca = acciones.map((a) => ({...a, pose: (tl, d) => { const p = a.pose(tl, d); return {...p, boca: 0.7 * (p.mandibula || 0)}; }}));
    const {K, eventos, total} = armarAcciones(conBoca, params, base);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre: "Zorro", duracion: total, eventos, marcas: Object.fromEntries(eventos.map((e) => [e.nombre, "no_lleva"])), partes};
}

// ================================================================== CUERVO (de perfil, mira a la derecha; patas en y = 0)
const K_ = {negro: "#1b1b25", negroAzul: "#2c3150", brillo: "#6d82c4", pico: "#33333b", picoClaro: "#5c5c66", pata: "#2a2a30"};

function cuervo() {
    const parpado = {
        "": [[25, -110], [32, -112.5], [39, -110], [39, -109.6], [32, -111.9], [25, -109.6]],
        cerrado: [[25, -110], [32, -112.5], [39, -110], [39, -101], [32, -97.5], [25, -101]],
        feliz: [[25, -110], [32, -112.5], [39, -110], [39, -104], [32, -106.5], [25, -104]],
    };
    const pata = (n, x, capa) => ({nombre: `pata_${n}`, capa, poligono: [[x - 2, -36], [x + 2, -36], [x + 2, -4], [x - 2, -4]], color: K_.pata,
        partes: [{nombre: `dedos_${n}`, poligono: [[x - 8, -4], [x + 12, -5], [x + 14, 0], [x + 4, 2], [x - 10, 1]], color: K_.pata}]});
    const cabeza = {nombre: "cabeza", capa: 6, pivote: [16, -86], partes: [
        {nombre: "cabeza_forma", poligono: ovalo(26, -102, 21, 19, 22), degradado: radial([20, -112], 26, [[0, K_.negroAzul], [1, K_.negro]])},
        {nombre: "ojo", en: [32, -105], circulo: {r: 6, lados: 16}, color: "#f4f2ea"},
        {nombre: "pupila", en: [33.5, -105], circulo: {r: 3.6, lados: 14}, color: "#0a0a10"},
        {nombre: "brillo_ojo", en: [35, -107], circulo: {r: 1.3, lados: 8}, color: "#ffffff"},
        {nombre: "parpado", poligono: parpado[""], formas: {cerrado: {poligono: parpado.cerrado}, feliz: {poligono: parpado.feliz}}, color: K_.negro},
        {nombre: "pico_inf", pivote: [42, -95], poligono: [[41, -97], [74, -97], [67, -91], [44, -90]], degradado: lineal([42, -97], [42, -90], [[0, K_.picoClaro], [1, K_.pico]]),
            partes: [{nombre: "queso_pico", opacidad: 0, poligono: [[56, -98], [80, -95], [78, -79], [58, -82]],
                degradado: lineal([56, -98], [80, -80], [[0, "#ffe27a"], [1, "#f2b733"]]), borde: "#c98f1c",
                partes: [{nombre: "agujero_pico", en: [68, -88], elipse: [2.8, 2.2], color: "#d9a028"}]}]},
        {nombre: "pico_sup", pivote: [42, -98], poligono: [[39, -107], [62, -103], [80, -97.5], [44, -95.5]], degradado: lineal([40, -107], [40, -96], [[0, K_.picoClaro], [1, K_.pico]])},
    ]};
    const partes = [{nombre: "cuerpo_pivote", pivote: [0, -36], partes: [
        pata("lejos", -4, 0),
        {nombre: "cola", capa: 1, pivote: [-26, -54], poligono: [[-24, -62], [-58, -46], [-82, -30], [-76, -24], [-60, -28], [-22, -46]], color: K_.negro, borde: K_.negroAzul},
        {nombre: "ala_lejos", capa: 2, pivote: [6, -80], poligono: [[6, -84], [-20, -78], [-46, -56], [-30, -54], [-8, -62]], color: "#121219"},
        {nombre: "cuerpo", capa: 3, poligono: ovalo(-2, -62, 34, 28, 24, (a) => 1 + 0.12 * Math.cos(a - 0.6)),
            degradado: lineal([-10, -92], [10, -34], [[0, K_.negroAzul], [0.55, K_.negro], [1, "#101018"]])},
        {nombre: "brillo_cuerpo", capa: 4, poligono: ovalo(4, -74, 18, 9, 16), color: K_.brillo, opacidad: 0.35, mezcla: "pantalla"},
        pata("cerca", 6, 5),
        {nombre: "ala", capa: 5, pivote: [8, -80], poligono: [[8, -84], [24, -76], [18, -58], [-6, -40], [-40, -32], [-52, -36], [-28, -50], [-6, -66]],
            degradado: lineal([0, -84], [-30, -34], [[0, "#22263c"], [1, "#0e0e15"]]), borde: "#30344f",
            partes: [{nombre: "plumas_ala", poligono: [[-2, -52], [-26, -40], [-46, -36], [-24, -46], [-4, -58]], color: "#2c3150", opacidad: 0.8}]},
        cabeza,
    ]}];
    const params = {
        cuerpo_esc: ["cuerpo_pivote", "escala_y"], cuerpo_rot: ["cuerpo_pivote", "rotacion"], cabeza: ["cabeza", "rotacion"],
        pico_s: ["pico_sup", "rotacion"], pico_i: ["pico_inf", "rotacion"], ala: ["ala", "rotacion"], ala_l: ["ala_lejos", "rotacion"],
        cola: ["cola", "rotacion"], parpado: ["parpado", "forma"], queso: ["queso_pico", "opacidad"],
    };
    const base = {cuerpo_esc: 1, cuerpo_rot: 0, cabeza: 0, pico_s: 0, pico_i: 0, ala: 0, ala_l: 0, cola: 0, parpado: "", queso: 0};
    const parpadeo = (tl, tb, normal = "") => (Math.abs(tl - tb) < 60 ? "cerrado" : normal);
    const quieto = (queso) => (tl, d) => ({queso, cuerpo_esc: 1 + 0.015 * Math.sin(TAU * tl / d * 2), cabeza: 4 * Math.sin(TAU * tl / d) + (tl > d * 0.3 && tl < d * 0.5 ? -6 : 0),
        cola: tl > d * 0.6 && tl < d * 0.68 ? -12 : 0, parpado: parpadeo(tl, d * 0.85)});
    const acciones = [
        {nombre: "Quieto", dur: 3000, pose: quieto(1)},
        {nombre: "Mirar abajo", dur: 2000, pose: (tl, d) => ({queso: 1, cabeza: 16 + 3 * Math.sin(TAU * tl / d), cuerpo_esc: 1 + 0.015 * Math.sin(TAU * tl / d * 2), parpado: parpadeo(tl, d * 0.6)})},
        {nombre: "Orgulloso", dur: 2000, pose: (tl, d) => ({queso: 1, cuerpo_esc: 1.06 + 0.02 * Math.sin(TAU * tl / d), cabeza: -14 + 4 * Math.sin(TAU * tl / d),
            cuerpo_rot: -3, ala: -6 + 3 * Math.sin(TAU * tl / d * 2), cola: 6 * Math.sin(TAU * tl / d), parpado: "feliz"})},
        {nombre: "Cantar", dur: 1500, pose: (tl) => {
            const abre = tramo(tl, 120, 320) - tramo(tl, 1150, 1450);
            const aletea = tramo(tl, 150, 400) - tramo(tl, 1100, 1450);
            return {queso: tl < 300 ? 1 : 0, cabeza: -26 * tramo(tl, 0, 300) + 26 * tramo(tl, 1100, 1450), pico_s: -16 * abre, pico_i: 32 * abre,
                ala: -40 * aletea + 12 * aletea * Math.sin(TAU * tl / 260), ala_l: -30 * aletea, cuerpo_esc: 1 + 0.05 * aletea, parpado: abre > 0.5 ? "cerrado" : ""};
        }},
        {nombre: "Sorprendido", dur: 2000, pose: (tl, d) => ({cabeza: 20 + 2 * Math.sin(TAU * tl / d * 3), pico_i: 16, pico_s: -4, cola: -10, ala: 6,
            cuerpo_esc: 1 + 0.01 * Math.sin(TAU * tl / 160)})},
        {nombre: "Quieto sin queso", dur: 3000, pose: quieto(0)},
    ];
    const {K, eventos, total} = armarAcciones(acciones, params, base);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre: "Cuervo", duracion: total, eventos, marcas: Object.fromEntries(eventos.map((e) => [e.nombre, "no_lleva"])), partes};
}

// ================================================================== QUESO (base en y = 0)
function queso() {
    return {tipo: "asset", nombre: "Queso", duracion: 1000, marcas: {EventoGeneral: "no_lleva"}, partes: [
        {nombre: "lado", poligono: [[-20, -8], [18, -16], [20, 0], [-20, 0]], color: "#f0b43a", borde: "#c98f1c"},
        {nombre: "cara", poligono: [[-20, -8], [-6, -26], [20, -16], [18, -16]], degradado: lineal([-20, -26], [20, -8], [[0, "#fff09a"], [1, "#ffd75e"]]), borde: "#c98f1c"},
        {nombre: "frente", poligono: [[-20, -8], [-20, 0], [-6, -18], [-6, -26]], color: "#f6c64a", borde: "#c98f1c"},
        {nombre: "agujero_1", en: [-2, -6], elipse: [3.4, 2.6], color: "#d9a028"},
        {nombre: "agujero_2", en: [10, -9], elipse: [2.2, 1.8], color: "#d9a028"},
        {nombre: "agujero_3", en: [2, -16], elipse: [2.6, 1.6], color: "#e6b23a"},
    ]};
}

// ================================================================== ÁRBOL (pies en y = 0; la rama larga va hacia la izquierda)
// PERCHA: donde se para el cuervo (arriba de la rama), en coordenadas del arbol
const PERCHA = [-232, -628];
function arbol() {
    const corteza = lineal([-46, 0], [46, 0], [[0, "#4a2f1d"], [0.45, "#6e4a30"], [1, "#3a2416"]]);
    const follaje = [
        [0, -880, 190, 120], [-150, -800, 130, 95], [150, -810, 140, 100], [-70, -960, 140, 90], [90, -960, 130, 85],
        [-210, -720, 95, 60], [200, -720, 100, 62], [10, -740, 160, 80],
    ];
    const hojas = follaje.map(([x, y, rx, ry], i) => ({nombre: `follaje_${i}`, capa: 5 + (i % 3), pivote: [x, y + ry],
        poligono: ovalo(x, y, rx, ry, 30, (a) => 1 + 0.07 * Math.sin(a * 5 + i) + 0.04 * Math.sin(a * 9 + i * 2)),
        degradado: radial([x - rx * 0.3, y - ry * 0.4], Math.max(rx, ry) * 1.3, [[0, "#7cc35a"], [0.55, "#4c9a3c"], [1, "#2e6b2a"]]),
        claves: {rotacion: [[0, 0], [1800 + i * 230, (i % 2 ? 1.6 : -1.6), "suave"], [3800 + i * 400, 0, "suave"]]}, bucle: "repetir"}));
    return {tipo: "asset", nombre: "Árbol del cuervo", duracion: 6000, marcas: {EventoGeneral: "no_lleva"}, partes: [
        {nombre: "raices", capa: 0, poligono: [[-90, 0], [-50, -40], [-44, -120], [44, -120], [52, -40], [96, 0]], degradado: corteza},
        {nombre: "tronco", capa: 1, poligono: [[-46, -100], [-38, -420], [-30, -760], [30, -760], [36, -420], [46, -100]], degradado: corteza},
        {nombre: "vetas", capa: 2, poligono: [[-20, -140], [-14, -380], [-10, -380], [-14, -140]], color: "#3a2416", opacidad: 0.6},
        {nombre: "vetas_2", capa: 2, poligono: [[12, -260], [16, -520], [20, -520], [17, -260]], color: "#3a2416", opacidad: 0.5},
        {nombre: "hueco", capa: 2, en: [6, -330], elipse: [10, 16], color: "#24150c"},
        {nombre: "rama", capa: 3, poligono: [[-30, -600], [-120, -628], [-250, -626], [-330, -644], [-336, -636], [-250, -612], [-120, -606], [-32, -566]],
            degradado: lineal([0, -640], [0, -590], [[0, "#6e4a30"], [1, "#3a2416"]])},
        {nombre: "ramita", capa: 3, poligono: [[-300, -638], [-320, -676], [-314, -678], [-292, -640]], color: "#4a2f1d"},
        {nombre: "hojas_rama", capa: 4, poligono: ovalo(-330, -690, 40, 26, 18, (a) => 1 + 0.1 * Math.sin(a * 4)),
            degradado: radial([-340, -700], 45, [[0, "#7cc35a"], [1, "#2e6b2a"]]), claves: {rotacion: [[0, 0], [2000, 3, "suave"], [4000, 0, "suave"]]}, pivote: [-310, -665], bucle: "repetir"},
        {nombre: "rama_alta", capa: 3, poligono: [[20, -700], [120, -790], [130, -780], [26, -680]], color: "#4a2f1d"},
        ...hojas,
    ]};
}

// ================================================================== ENTORNO VIVO
// meneo: rotacion de ida y vuelta (viento). Periodos distintos para que no se muevan todos juntos.
const meneo = (amp, periodo) => ({claves: {rotacion: [[0, -amp], [Math.round(periodo / 2), amp, "suave"]]}, bucle: "ida_vuelta"});
const DUR_BOSQUE = 40000;

// mata de pasto: hojas en zigzag desde la base (x, y), que se mece desde la base
function pasto(nombre, x, y, alto, ancho, n, color, capa, i = 0) {
    const pts = [[x - ancho / 2, y]];
    for (let k = 0; k < n; k++) {
        const bx = x - ancho / 2 + (ancho * (k + 0.5)) / n, h = alto * (0.6 + 0.4 * Math.abs(Math.sin(k * 2.1 + i)));
        pts.push([r2(bx - ancho / n * 0.3 + Math.sin(k + i) * 6), r2(y - h)], [r2(bx + ancho / n * 0.35), r2(y - h * 0.25)]);
    }
    pts.push([x + ancho / 2, y]);
    return {nombre, capa, pivote: [x, y], poligono: pts, color, ...meneo(2.5 + (i % 3), 2600 + (i * 370) % 1400)};
}
// nube: varias elipses blancas; avanza despacio de un lado a otro
function nube(nombre, x, y, esc, dx) {
    const bultos = [[0, 0, 70, 34], [-55, 10, 48, 26], [55, 8, 52, 28], [20, -22, 46, 30], [-25, -14, 40, 26]];
    return {nombre, capa: 1, partes: bultos.map(([bx, by, rx, ry], k) => ({nombre: `${nombre}_${k}`, en: [r2(x + bx * esc), r2(y + by * esc)], elipse: [r2(rx * esc), r2(ry * esc)],
        degradado: radial([0, -ry * esc * 0.4], rx * esc * 1.1, [[0, "rgba(255,255,255,0.95)"], [1, "rgba(236,242,250,0.85)"]])})),
        claves: {x: [[0, 0], [DUR_BOSQUE, dx, "suave"]]}, bucle: "ida_vuelta"};
}
// pajaro lejano: una "v" que aletea (formas) y cruza el cielo
function pajaro(nombre, x, y, i) {
    const arriba = [[-9, -6], [0, 0], [9, -6], [9, -4.5], [0, 2], [-9, -4.5]], abajo = [[-9, 2], [0, 0], [9, 2], [9, 3.5], [0, 2], [-9, 3.5]];
    const forma = [];
    for (let t = 0; t <= DUR_BOSQUE; t += 260) forma.push([t, (t / 260) % 2 ? "abajo" : "", "suave"]);
    const yk = [];
    for (let t = 0; t <= DUR_BOSQUE; t += 2000) yk.push([t, r2(y + 18 * Math.sin(t / 3000 + i)), "suave"]);
    return {nombre, capa: 2, poligono: arriba, formas: {abajo: {poligono: abajo}}, color: "#3d4b5c", opacidad: 0.75,
        claves: {forma, x: [[0, x], [DUR_BOSQUE, x + 1300, "lineal"]], y: yk}, bucle: "repetir"};
}
// arbol intermedio (lejos: colores apagados por la distancia)
function arbolMedio(nombre, x, y, alto, i) {
    const copa = [[0, -alto * 0.78, alto * 0.32, alto * 0.24], [-alto * 0.2, -alto * 0.62, alto * 0.24, alto * 0.18], [alto * 0.2, -alto * 0.64, alto * 0.25, alto * 0.18]];
    return {nombre, capa: 4, pivote: [x, y], ...meneo(0.8, 3600 + i * 500), partes: [
        {nombre: `${nombre}_tronco`, poligono: [[x - 7, y], [x - 5, y - alto * 0.55], [x + 5, y - alto * 0.55], [x + 7, y]], color: "#6b5a4a"},
        ...copa.map(([cx, cy, rx, ry], k) => ({nombre: `${nombre}_copa_${k}`, poligono: ovalo(x + cx, y + cy, rx, ry, 22, (a) => 1 + 0.08 * Math.sin(a * 5 + k + i)),
            degradado: radial([x + cx - rx * 0.3, y + cy - ry * 0.5], Math.max(rx, ry) * 1.3, [[0, "#9cc883"], [1, "#5f8f55"]])})),
    ]};
}

// ================================================================== BOSQUE (fondo; suelo en y = 0, centrado en x = 0)
function bosque() {
    const ondas = (y0, amp, n, seed) => Array.from({length: n + 1}, (_, i) => {
        const x = -520 + (1040 * i) / n;
        return [r2(x), r2(y0 - amp * (0.6 + 0.4 * Math.sin(i * 1.7 + seed)) * (0.7 + 0.3 * Math.cos(i * 0.6 + seed)))];
    });
    const lejanos = Array.from({length: 13}, (_, i) => {
        const x = -500 + i * 82 + (i % 3) * 14, h = 90 + (i * 37) % 60;
        return {nombre: `pino_lejos_${i}`, capa: 3, poligono: [[x - 24, -300], [x, -300 - h], [x + 24, -300]], color: i % 2 ? "#6f9a78" : "#66906f", opacidad: 0.85};
    });
    const sol = [190, -1060];
    const rayos = [[-260, 70, 0.9], [-90, 50, 0.7], [60, 90, 1], [260, 60, 0.6]].map(([xb, w, k], i) => ({nombre: `rayo_${i}`, capa: 5, mezcla: "suma",
        poligono: [[sol[0] - 12, sol[1]], [sol[0] + 12, sol[1]], [xb + w, 40], [xb - w, 40]],
        degradado: lineal(sol, [xb, 40], [[0, "rgba(255,244,200,0.35)"], [0.6, "rgba(255,240,190,0.12)"], [1, "rgba(255,240,190,0)"]]),
        claves: {opacidad: [[0, r2(0.4 * k)], [3000 + i * 900, k, "suave"]]}, bucle: "ida_vuelta"}));
    const matas = [[-300, -10, 90, 50], [-130, 6, 70, 36], [300, -8, 110, 56], [460, 4, 80, 40]].map(([x, y, rx, ry], i) => ({
        nombre: `mata_${i}`, capa: 8, pivote: [x, y], ...meneo(1.2, 3000 + i * 410), poligono: ovalo(x, y - ry * 0.6, rx, ry, 24, (a) => (Math.sin(a) > 0.2 ? 0.2 : 1 + 0.12 * Math.sin(a * 6 + i))),
        degradado: radial([x - rx * 0.3, y - ry], rx * 1.2, [[0, "#6aa84a"], [1, "#2f6a2c"]])}));
    const flores = Array.from({length: 22}, (_, i) => {
        const x = -480 + ((i * 131) % 960), y = 30 + ((i * 53) % 220), h = 14 + (i % 4) * 4, xt = r2(x + Math.sin(i) * 3);
        return {nombre: `flor_${i}`, capa: 9, pivote: [x, y], ...meneo(5, 2200 + (i * 290) % 1500), partes: [
            {nombre: `flor_${i}_tallo`, poligono: [[x - 1, y], [xt - 1, y - h], [xt + 1, y - h], [x + 1, y]], color: "#3f7a2e"},
            {nombre: `flor_${i}_petalos`, en: [xt, y - h], circulo: {r: 4.5 + (i % 3), lados: 10}, color: ["#ffffff", "#ffd84a", "#f28bb8", "#b98af2", "#ff8a5c"][i % 5]},
            {nombre: `flor_${i}_centro`, en: [xt, y - h], circulo: {r: 1.8, lados: 8}, color: "#e0a020"}]};
    });
    const matasPasto = Array.from({length: 16}, (_, i) => pasto(`pasto_${i}`, -500 + ((i * 197) % 1000), 60 + ((i * 89) % 280), 26 + (i % 4) * 8, 40 + (i % 3) * 14, 5, i % 2 ? "#4f8f37" : "#5a9a3e", 9, i));
    const pastoLejos = Array.from({length: 10}, (_, i) => pasto(`pasto_lejos_${i}`, -500 + i * 104 + (i % 2) * 30, -100 + (i % 3) * 30, 14, 30, 4, "#79ad52", 6, i));
    const piedras = [[-410, 140, 26, 14], [380, 210, 34, 18], [120, 300, 18, 10]].map(([x, y, rx, ry], i) => ({nombre: `piedra_${i}`, capa: 9,
        poligono: ovalo(x, y - ry * 0.5, rx, ry, 14, (a) => (Math.sin(a) > 0.3 ? 0.5 : 1 + 0.1 * Math.sin(a * 3 + i))),
        degradado: radial([x - rx * 0.3, y - ry], rx * 1.2, [[0, "#b9b6ad"], [1, "#7c786e"]])}));
    const hongos = [[-350, 170], [-334, 176], [410, 236]].map(([x, y], i) => ({nombre: `hongo_${i}`, capa: 10, partes: [
        {nombre: `hongo_${i}_pie`, rect: [x - 2.5, y - 10, x + 2.5, y], color: "#f4ecd8"},
        {nombre: `hongo_${i}_sombrero`, poligono: ovalo(x, y - 10, 9, 6, 14, (a) => (Math.sin(a) > 0 ? 0.25 : 1)), color: "#d8452f"},
        {nombre: `hongo_${i}_punto`, en: [x - 2, y - 13], circulo: {r: 1.4, lados: 6}, color: "#ffffff"}]}));
    return {tipo: "asset", nombre: "Bosque", duracion: DUR_BOSQUE, marcas: {EventoGeneral: "no_lleva"}, partes: [
        {nombre: "cielo", capa: 0, rect: [-520, -1420, 520, -150], degradado: lineal([0, -1420], [0, -150], [[0, "#6fa8e0"], [0.6, "#b8d8ee"], [1, "#fbe7bd"]])},
        nube("nube_0", -280, -1240, 1.1, 220), nube("nube_1", 160, -1330, 0.8, -160), nube("nube_2", -60, -980, 0.6, 140),
        {nombre: "sol", capa: 1, en: sol, circulo: {r: 230, lados: 48}, mezcla: "suma",
            degradado: radial([0, 0], 230, [[0, "rgba(255,248,214,1)"], [0.16, "rgba(255,236,170,0.75)"], [1, "rgba(255,214,140,0)"]]),
            claves: {escala_x: [[0, 0.96], [4000, 1.04, "suave"]], escala_y: [[0, 0.96], [4000, 1.04, "suave"]]}, bucle: "ida_vuelta"},
        pajaro("pajaro_0", -620, -900, 0), pajaro("pajaro_1", -660, -870, 1), pajaro("pajaro_2", -1100, -1010, 2),
        {nombre: "colinas_lejos", capa: 2, poligono: [...ondas(-300, 120, 14, 0.3), [520, -140], [-520, -140]], color: "#9cc0ab"},
        ...lejanos,
        {nombre: "colinas", capa: 3, poligono: [...ondas(-200, 90, 12, 1.9), [520, -100], [-520, -100]], color: "#7fab74"},
        arbolMedio("arbol_m0", -440, -110, 240, 0), arbolMedio("arbol_m1", -250, -120, 190, 1), arbolMedio("arbol_m2", 40, -125, 170, 2),
        arbolMedio("arbol_m3", 330, -115, 230, 3), arbolMedio("arbol_m4", 480, -105, 200, 4),
        {nombre: "bruma", capa: 4, rect: [-520, -280, 520, -100], degradado: lineal([0, -280], [0, -100], [[0, "rgba(255,244,220,0)"], [1, "rgba(255,244,220,0.5)"]]), borde: "rgba(255,244,220,0)"},
        ...rayos,
        {nombre: "pasto_lejos", capa: 6, rect: [-520, -140, 520, 40], degradado: lineal([0, -140], [0, 40], [[0, "#8dbf5c"], [1, "#6aa846"]])},
        ...pastoLejos,
        {nombre: "pasto", capa: 7, rect: [-520, 30, 520, 380], degradado: lineal([0, 30], [0, 380], [[0, "#6aa846"], [1, "#3f7a2e"]])},
        {nombre: "sendero", capa: 7, poligono: [[-60, -140], [10, -140], [180, 380], [-260, 380]], degradado: lineal([0, -140], [0, 380], [[0, "#d9c39a"], [1, "#b39466"]]), opacidad: 0.8},
        {nombre: "sombra_arbol", capa: 7, en: [210, 10], elipse: [190, 34], color: "#2c5a24", opacidad: 0.35},
        ...matas, ...piedras, ...matasPasto, ...flores, ...hongos,
    ]};
}

// ================================================================== MARIPOSA (aletea en el lugar; el vuelo lo dan las claves de la escena)
function mariposa(nombre, c1, c2) {
    const ala = (n, pts, capa) => ({nombre: n, capa, pivote: [0, -2], poligono: pts, degradado: radial([0, -8], 16, [[0, c1], [1, c2]]), borde: "#3a2a20",
        claves: {escala_y: [[0, 1], [110, 0.15, "suave"], [220, 1, "suave"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre, duracion: 220, marcas: {EventoGeneral: "no_lleva"}, partes: [
        ala("ala_atras", [[0, -2], [-6, -18], [-16, -16], [-12, -4]], 0),
        ala("ala_adelante", [[0, -2], [4, -20], [16, -20], [12, -6], [6, 2], [0, 4]], 2),
        {nombre: "cuerpo", capa: 1, poligono: [[-7, -1], [8, -3], [9, -1], [-7, 1]], color: "#2a1e18"},
        {nombre: "antena", capa: 1, poligono: [[8, -3], [14, -9], [14.6, -8.4], [9, -2]], color: "#2a1e18"},
    ]};
}

// ================================================================== HOJA (cae dando vueltas y bamboleandose; 7 s)
function hoja() {
    const DUR = 7000, x = [], y = [], rot = [], esc = [], op = [];
    for (let t = 0; t <= DUR; t += 100) {
        const k = t / DUR;
        x.push([t, r2(55 * Math.sin(t / 700) + 30 * k), "lineal"]);
        y.push([t, r2(820 * k), "lineal"]);
        rot.push([t, r2(35 * Math.sin(t / 700 + 1) + 40 * k), "lineal"]);
        esc.push([t, r2(Math.cos(t / 450)), "lineal"]);
        op.push([t, r2(Math.max(0, Math.min(1, t / 400, (DUR - t) / 500))), "lineal"]);
    }
    return {tipo: "asset", nombre: "Hoja", duracion: DUR, marcas: {EventoGeneral: "no_lleva"}, partes: [
        {nombre: "hoja", claves: {x, y, rotacion: rot, escala_x: esc, opacidad: op}, partes: [
            {nombre: "lamina", poligono: [[0, -14], [6, -9], [7, -2], [3, 4], [0, 6], [-3, 4], [-7, -2], [-6, -9]],
                degradado: lineal([0, -14], [0, 6], [[0, "#9fd060"], [1, "#d9a83a"]]), borde: "#6d8a2a"},
            {nombre: "nervio", poligono: [[-0.5, -12], [0.5, -12], [0.5, 8], [-0.5, 8]], color: "#6d8a2a"},
        ]},
    ]};
}

// ================================================================== HELECHOS (primer plano, en sombra)
function helechos() {
    const fronda = (n, x, y, largo, ang, i) => {
        const der = [], izq = [], N = 9;
        for (let k = 0; k <= N; k++) {
            const u = k / N, a = (ang + 30 * u * u) * Math.PI / 180;
            const px = x + Math.sin(a) * largo * u, py = y - Math.cos(a) * largo * u;
            const w = 16 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (k % 2 ? 1 : 0.55) + 1;
            const nx = Math.cos(a), ny = Math.sin(a);
            der.push([r2(px + nx * w), r2(py + ny * w)]);
            izq.unshift([r2(px - nx * w), r2(py - ny * w)]);
        }
        return {nombre: n, pivote: [x, y], poligono: [...der, ...izq], degradado: lineal([x, y], [x, y - largo], [[0, "#1f4a1e"], [1, "#3f7d36"]]), ...meneo(2.5, 2400 + i * 330)};
    };
    return {tipo: "asset", nombre: "Helechos", duracion: 1000, marcas: {EventoGeneral: "no_lleva"}, partes: [
        fronda("fronda_0", -10, 0, 150, -38, 0), fronda("fronda_1", 0, 0, 180, -8, 1), fronda("fronda_2", 8, 0, 160, 24, 2),
        fronda("fronda_3", -6, 0, 120, -62, 3), fronda("fronda_4", 4, 0, 130, 52, 4),
        pasto("pasto_alto", 0, 0, 120, 90, 7, "#2a5a24", 0, 3),
    ]};
}

// ================================================================== escena de muestra (vertical 9:16)
// vuelo de mariposa: ochos alrededor de (x, y), muestreado en claves
function vuelo(x, y, ax, ay, fase, dur = 12600) {
    const kx = [], ky = [];
    for (let t = 0; t <= dur; t += 100) {
        const u = t / 1000 + fase;
        kx.push([t, r2(x + ax * Math.sin(u * 0.7) + 25 * Math.sin(u * 2.3)), "lineal"]);
        ky.push([t, r2(y + ay * Math.sin(u * 1.4) + 12 * Math.sin(u * 5.1)), "lineal"]);
    }
    return {x: kx, y: ky};
}

function muestra() {
    const PISO = 1110, ARBOL = [560, 1090], P = [ARBOL[0] + PERCHA[0], ARBOL[1] + PERCHA[1]];
    // caida del queso: del pico del cuervo (espejado) a la boca del zorro
    const T_SUELTA = 6800, T_LLEGA = 7330;
    const de = [P[0] - 68, P[1] - 82], a = [258, 998];
    const caida = {x: [], y: [], rotacion: [], opacidad: [[0, 0], [T_SUELTA - 1, 0], [T_SUELTA, 1], [T_LLEGA, 1], [T_LLEGA + 1, 0]]};
    for (let t = T_SUELTA; t <= T_LLEGA; t += 40) {
        const k = (t - T_SUELTA) / (T_LLEGA - T_SUELTA);
        caida.x.push([t, r2(mezclar(de[0], a[0], k)), "lineal"]);
        caida.y.push([t, r2(de[1] + (a[1] - de[1]) * k * k), "lineal"]);
        caida.rotacion.push([t, r2(-200 * k), "lineal"]);
    }
    return {
        tipo: "escena", nombre: "prueba_personajes", duracion: 12600, precision: "decimal", profundidad: true,
        camara: {tamano: [720, 1280]},
        objetos: [
            {instancia: "Bosque", nombre: "bosque", en: [360, PISO], plano: -5},
            {instancia: "Árbol del cuervo", nombre: "arbol", en: ARBOL, plano: -2},
            ...[[470, 330, 0, 0.9], [620, 280, 2300, 1.1], [540, 420, 4100, 0.8], [400, 300, 5600, 1], [660, 400, 1200, 0.9]].map(([x, y, d, e], i) =>
                ({instancia: "Hoja", nombre: `hoja_${i}`, en: [x, y], escala: e, desfase: d, plano: i % 2 ? 1 : -1})),
            {instancia: "Mariposa amarilla", nombre: "mariposa_0", en: [120, 900], plano: 1, claves: vuelo(120, 880, 160, 70, 0)},
            {instancia: "Mariposa azul", nombre: "mariposa_1", en: [560, 980], plano: 1, escala: 0.85, claves: vuelo(560, 960, 120, 60, 2)},
            {instancia: "Helechos", nombre: "helechos_izq", en: [30, 1300], escala: 1.5, plano: 2},
            {instancia: "Helechos", nombre: "helechos_der", en: [705, 1310], escala: [-1.3, 1.3], plano: 2},
            {instancia: "Cuervo", nombre: "cuervo", en: P, espejo: true, plano: -1,
                acciones: [[0, "Quieto"], [2000, "Mirar abajo"], [4600, "Orgulloso"], [6500, "Cantar", false], [8000, "Sorprendido"], [10200, "Quieto sin queso"]]},
            {instancia: "Queso", nombre: "queso", en: de, plano: 1, claves: caida},
            {instancia: "Zorro", nombre: "zorro", en: [-120, PISO], plano: 0,
                acciones: [[0, "Caminar"], [1500, "Olfatear"], [3000, "Mirar arriba"], [3600, "Hablar"], [6200, "Mirar arriba"], [6900, "Atrapar", false],
                    [7800, "Quieto con queso"], [8400, "Hablar con queso"], [10000, "Caminar con queso"]],
                claves: {x: [[0, -120], [1500, 120, "lineal"], [10000, 120], [12600, 540, "lineal"]]}},
        ],
        efectos: [{tipo: "particulas", nombre: "motas_de_luz", en: [400, 640], inicio: 0, fin: 12600, tasa: 5, vida: 7000, velocidad: 16, angulo: 100, dispersion: 180,
            gravedad: -3, tam_ini: 3, tam_fin: 6, color_ini: "#fff8d0", color_fin: "#ffe9a0", suave: "si", opacidad: 0.55, mezcla: "suma"}],
        dialogos: [
            {texto: "Muestra de personajes: el zorro llega caminando…", desde: 0, hasta: 2800, estilo: "narrador"},
            {quien: "zorro", texto: "¡Buenos días, señor Cuervo!", desde: 3700, hasta: 6100},
            {quien: "cuervo", texto: "¡Soy precioso!", desde: 4700, hasta: 6400, estilo: "pensamiento"},
            {quien: "cuervo", texto: "¡CRAAA!", desde: 6600, hasta: 7800, estilo: "grito"},
            {quien: "zorro", texto: "¡Gracias por el queso!", desde: 8400, hasta: 10200},
        ],
    };
}

// ================================================================== LA HISTORIA (fase 4): 4 escenas del capitulo
// Mismo lugar en las 4: el bosque, el arbol (percha del cuervo) y el zorro parado en ZX.
const PISO = 1110, ARBOL = [560, 1090], PER = [ARBOL[0] + PERCHA[0], ARBOL[1] + PERCHA[1]];   // cuervo en [328, 462]
const ZX = 130;                                        // donde se para el zorro (atrapa el queso ahi)
const BOCA_SALTO = [ZX + 138, PISO - 196];             // boca del zorro en "Atrapar" a los 600 ms (pose calculada)
const PICO = [PER[0] - 55, PER[1] - 85];               // queso en el pico del cuervo (espejado) al cantar

// planos de camara: [t, cx, cy, zoom, paso] con paso "corte" (salta), "suave" o "lineal" (viene del anterior)
function camara(planos) {
    const k = {x: [], y: [], zoom: []};
    let ant = null;
    for (const [t, x, y, z, paso = "suave"] of planos) {
        if (ant && paso === "corte") for (const [p, v] of [["x", ant[1]], ["y", ant[2]], ["zoom", ant[3]]]) k[p].push([t - 1, v, "lineal"]);
        for (const [p, v] of [["x", x], ["y", y], ["zoom", z]]) k[p].push([t, v, paso === "corte" || !ant ? "lineal" : paso]);
        ant = [t, x, y, z];
    }
    return {tamano: [720, 1280], centro: [planos[0][1], planos[0][2]], zoom: planos[0][3], claves: k};
}
// encuadres que se repiten
const PLANO = {
    general: [360, 640, 1],
    dos: [300, 720, 1.15],                 // zorro y cuervo
    cuervo: [322, 450, 2.3],               // primer plano del cuervo
    zorro: [205, 950, 2.1],                // primer plano del zorro
    zorroCara: [245, 905, 2.7],
};
const P = (t, nombre, paso) => [t, ...PLANO[nombre], paso];

// lo que esta siempre: fondo, arbol, hojas, mariposas, helechos y las motas de luz
function entorno(dur) {
    return {
        objetos: [
            {instancia: "Bosque", nombre: "bosque", en: [360, PISO], plano: -5},
            {instancia: "Árbol del cuervo", nombre: "arbol", en: ARBOL, plano: -2},
            ...[[470, 330, 0, 0.9], [620, 280, 2300, 1.1], [540, 420, 4100, 0.8], [400, 300, 5600, 1], [660, 400, 1200, 0.9]].map(([x, y, d, e], i) =>
                ({instancia: "Hoja", nombre: `hoja_${i}`, en: [x, y], escala: e, desfase: d, plano: i % 2 ? 1 : -1})),
            {instancia: "Mariposa amarilla", nombre: "mariposa_0", en: [120, 900], plano: 1, claves: vuelo(120, 880, 160, 70, 0, dur)},
            {instancia: "Mariposa azul", nombre: "mariposa_1", en: [560, 980], plano: 1, escala: 0.85, claves: vuelo(560, 960, 120, 60, 2, dur)},
            {instancia: "Helechos", nombre: "helechos_izq", en: [30, 1300], escala: 1.5, plano: 2},
            {instancia: "Helechos", nombre: "helechos_der", en: [705, 1310], escala: [-1.3, 1.3], plano: 2},
        ],
        efectos: [{tipo: "particulas", nombre: "motas_de_luz", en: [400, 640], inicio: 0, fin: dur, tasa: 5, vida: 7000, velocidad: 16, angulo: 100, dispersion: 180,
            gravedad: -3, tam_ini: 3, tam_fin: 6, color_ini: "#fff8d0", color_fin: "#ffe9a0", suave: "si", opacidad: 0.55, mezcla: "suma", sonido: "no_lleva"}],
    };
}
const cuervo_ = (acciones) => ({instancia: "Cuervo", nombre: "cuervo", en: PER, espejo: true, plano: -1, acciones});
const zorro_ = (acciones, claves) => ({instancia: "Zorro", nombre: "zorro", en: [ZX, PISO], plano: 0, acciones, ...(claves ? {claves} : {})});
// un "pop" por cada globo (menos el narrador) y el ambiente del bosque
const pops = (dialogos) => dialogos.filter((d) => d.estilo !== "narrador").map((d) => ({sonido: "Pop", t: d.desde, volumen: 0.5}));
// Elenco de voces (planeacion_voces.md): ElevenLabs, elegidas por el usuario el 2026-11-20
// `boca`: las partes que se abren con el volumen de la voz (voces.mjs -> claves_partes)
const VOCES = {
    narrador: {motor: "elevenlabs", voz: "2aDqA8lxxUgkAZpuP7vg"},   // Daniela - calida, emotiva
    zorro: {motor: "elevenlabs", voz: "EGuq18jUC3ilTnuBn2wj",      // Ezequiel - sabio y misterioso
        boca: [{parte: "mandibula", prop: "rotacion", cerrada: 0, abierta: 16}, {parte: "boca_dentro", prop: "rotacion", cerrada: 0, abierta: 11.2}]},
    cuervo: {motor: "elevenlabs", voz: "dcEM0WOwbt9XwI31mBIu",     // Chuysito - joven
        boca: [{parte: "pico_inf", prop: "rotacion", cerrada: 0, abierta: 26}, {parte: "pico_sup", prop: "rotacion", cerrada: 0, abierta: -8}]},
};

function escena(n, nombre, dur, {camara: cam, objetos, dialogos, sonidos}) {
    const e = entorno(dur);
    return {tipo: "escena", nombre, duracion: dur, precision: "decimal", profundidad: true, camara: cam, voces: VOCES,
        objetos: [...e.objetos, ...objetos], efectos: e.efectos, dialogos, marcas: {EventoGeneral: "no_lleva"},
        sonidos: [{sonido: "Bosque", t: 0, volumen: 0.45, bucle: true, fundido: {entrada: n === 1 ? 800 : 0, salida: 0}}, ...pops(dialogos), ...sonidos]};
}

// ---------------------------------------------------------------- 1. El queso (10 s)
function escena1() {
    const dialogos = [
        {texto: "El zorro y el cuervo", desde: 200, hasta: 2600, estilo: "narrador", velocidad: 0},
        {texto: "Un cuervo encontró un gran queso y voló a un árbol para comérselo tranquilo.", desde: 2600, hasta: 6200, estilo: "narrador", posicion: "abajo", velocidad: 40},
        {quien: "cuervo", texto: "¡Qué desayuno tan rico!", desde: 3700, hasta: 5300, estilo: "pensamiento", velocidad: 40},
        {quien: "zorro", texto: "Mmm… ¡huele a queso!", desde: 7300, hasta: 8780, estilo: "pensamiento", velocidad: 40},
        {quien: "zorro", texto: "Ese queso… ¡será mío!", desde: 8800, hasta: 10500, estilo: "pensamiento", velocidad: 40},
    ];
    return escena(1, "1. El queso", 10500, {
        camara: camara([P(0, "general"), [2600, 340, 560, 1.3, "suave"], P(3500, "cuervo", "suave"), P(5300, "cuervo"),
            [5400, 150, 980, 1.7, "corte"], [7300, 175, 970, 1.8, "suave"], P(8700, "zorroCara", "suave"), P(10500, "zorroCara")]),
        objetos: [cuervo_([[0, "Quieto"]]),
            zorro_([[0, "Caminar"], [7300, "Olfatear"], [8700, "Mirar arriba"]], {x: [[0, -300], [5300, -300], [7300, ZX, "lineal"]]})],
        dialogos,
        sonidos: [{sonido: "Melodía", t: 0, volumen: 0.35}, {sonido: "Pasos", t: 5450, volumen: 0.55, recorte: [0, 1850]},
            {sonido: "Olfateo", t: 7400, volumen: 0.6}],
    });
}

// ---------------------------------------------------------------- 2. La adulación (20 s)
function escena2() {
    const dialogos = [
        {quien: "zorro", texto: "¡Buenos días, señor Cuervo!", desde: 600, hasta: 3000},
        {quien: "cuervo", texto: "¿Y este quién es?", desde: 3500, hasta: 5500, estilo: "pensamiento"},
        {quien: "zorro", texto: "¡Qué plumas tan brillantes! ¡Qué porte tan elegante!", desde: 5900, hasta: 9300},
        {quien: "cuervo", texto: "¡Por fin alguien lo nota!", desde: 9600, hasta: 11700, estilo: "pensamiento"},
        {quien: "zorro", texto: "Si su voz es tan bella como sus plumas… ¡usted sería el rey del bosque!", desde: 12100, hasta: 16000},
        {quien: "zorro", texto: "¿Me regalaría una canción?", desde: 16200, hasta: 18200},
        {quien: "cuervo", texto: "¿Cantar? ¡Claro que sí!", desde: 18300, hasta: 20000, estilo: "pensamiento", velocidad: 40},
    ];
    return escena(2, "2. La adulación", 20000, {
        camara: camara([P(0, "dos"), P(3200, "dos"), P(3600, "cuervo", "suave"), P(5700, "cuervo"), P(5800, "zorro", "corte"), [9300, 215, 940, 2.25, "suave"],
            P(9400, "cuervo", "corte"), [11800, 322, 455, 2.4, "suave"], P(11900, "dos", "corte"), [16000, 300, 730, 1.25, "suave"],
            P(16100, "zorroCara", "corte"), P(18200, "zorroCara"), P(18300, "cuervo", "corte"), [20000, 322, 445, 2.5, "suave"]]),
        objetos: [cuervo_([[0, "Quieto"], [3000, "Mirar abajo"], [9300, "Orgulloso"]]),
            zorro_([[0, "Mirar arriba"], [600, "Hablar"], [3000, "Mirar arriba"], [5800, "Hablar"], [9300, "Mirar arriba"], [12000, "Hablar"], [18200, "Mirar arriba"]])],
        dialogos,
        sonidos: [],
    });
}

// ---------------------------------------------------------------- 3. El canto (8 s)
function escena3() {
    const T_CANTA = 800, T_SUELTA = T_CANTA + 300, T_LLEGA = T_SUELTA + 700, T_SALTA = T_LLEGA - 600;
    // caida del queso: del pico a la boca del zorro (aceleracion constante, gira)
    const caida = {x: [], y: [], rotacion: [], opacidad: [[0, 0], [T_SUELTA - 1, 0], [T_SUELTA, 1], [T_LLEGA - 20, 1], [T_LLEGA, 0]]};
    for (let t = T_SUELTA; t <= T_LLEGA; t += 35) {
        const k = Math.min(1, (t - T_SUELTA) / (T_LLEGA - T_SUELTA));
        caida.x.push([t, r2(mezclar(PICO[0], BOCA_SALTO[0], k)), "lineal"]);
        caida.y.push([t, r2(PICO[1] + (BOCA_SALTO[1] - PICO[1]) * k * k), "lineal"]);
        caida.rotacion.push([t, r2(-260 * k), "lineal"]);
    }
    const dialogos = [
        {quien: "cuervo", texto: "¡CRAAA!", desde: T_CANTA + 150, hasta: T_CANTA + 1500, estilo: "grito", velocidad: 0},
        {quien: "cuervo", texto: "¡¿Mi queso?!", desde: 3400, hasta: 5300, estilo: "grito", lado: "arriba"},
        {quien: "zorro", texto: "¡Ñam!", desde: T_LLEGA + 50, hasta: T_LLEGA + 1100, velocidad: 0},
    ];
    return escena(3, "3. El canto", 8000, {
        camara: camara([P(0, "cuervo"), [T_SUELTA, 322, 450, 2.3, "suave"], [T_LLEGA, 230, 860, 1.7, "suave"], [2600, 235, 880, 1.75, "suave"],
            P(3200, "dos", "corte"), P(5400, "dos"), P(5500, "zorroCara", "corte"), [8000, 250, 905, 2.9, "suave"]]),
        objetos: [cuervo_([[0, "Orgulloso"], [T_CANTA, "Cantar", false], [T_CANTA + 1500, "Sorprendido"]]),
            {instancia: "Queso", nombre: "queso", en: PICO, plano: 1, claves: caida},
            zorro_([[0, "Mirar arriba"], [T_SALTA, "Atrapar", false], [T_SALTA + 900, "Masticar", false], [T_SALTA + 2000, "Mirar arriba"]])],
        dialogos,
        sonidos: [{sonido: "Graznido", t: T_CANTA + 150, volumen: 0.9}, {sonido: "Salto", t: T_SALTA + 240, volumen: 0.6},
            {sonido: "Mordida", t: T_LLEGA, volumen: 0.8}],
    });
}

// ---------------------------------------------------------------- 4. La moraleja (12 s)
function escena4() {
    const T_SE_VA = 5600;
    const dialogos = [
        {quien: "zorro", texto: "Amigo Cuervo: quien vive del halago…", desde: 400, hasta: 3200},
        {quien: "zorro", texto: "…¡paga con lo que tiene!", desde: 3300, hasta: 5500},
        {quien: "cuervo", texto: "Nunca más me fiaré de un adulador…", desde: 7000, hasta: 9600, estilo: "pensamiento"},
        {texto: "Moraleja: no confíes en quien te adula; siempre quiere algo a cambio.", desde: 9000, hasta: 12000, estilo: "narrador", posicion: "abajo", velocidad: 45},
        {texto: "Fábula de Esopo", desde: 10000, hasta: 12000, estilo: "narrador", velocidad: 0},
    ];
    return escena(4, "4. La moraleja", 12000, {
        camara: camara([P(0, "zorro"), [3200, 215, 945, 2.2, "suave"], P(3300, "dos", "corte"), P(5600, "dos"), P(6800, "general", "suave"),
            [8800, 330, 600, 1.35, "suave"], P(12000, "general", "suave")]),
        objetos: [cuervo_([[0, "Sorprendido"], [7000, "Quieto sin queso"]]),
            zorro_([[0, "Hablar"], [T_SE_VA, "Caminar"]], {x: [[0, ZX], [T_SE_VA, ZX], [9200, 860, "lineal"]]})],
        dialogos,
        sonidos: [{sonido: "Pasos", t: T_SE_VA + 50, volumen: 0.5, recorte: [0, 3500], fundido: {entrada: 0, salida: 1200}},
            {sonido: "Melodía final", t: 8900, volumen: 0.4}],
    });
}

const assets = [zorro(), cuervo(), queso(), arbol(), bosque(), mariposa("Mariposa amarilla", "#ffe066", "#f2a51a"),
    mariposa("Mariposa azul", "#8fd3ff", "#3a7bd5"), hoja(), helechos()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(muestra(), null, 1));
[escena1(), escena2(), escena3(), escena4()].forEach((e, i) => fs.writeFileSync(path.join(DIR, `historia_${i + 1}.json`), JSON.stringify(e, null, 1)));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms${a.eventos ? ", acciones " + a.eventos.slice(1).map((e) => e.nombre).join(", ") : ""}`).join("\n"));
