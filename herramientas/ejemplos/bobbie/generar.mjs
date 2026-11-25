// "Bobbie, el perro maravilla" (TikTok, historia real 1923-24): documento/planeacion_bobbie.md y guion_bobbie.md.
// Fase 2: mundo y personajes en estilo de libro ilustrado calido. Todo de perfil, mirando a la derecha, pies en y = 0.
//   node herramientas/ejemplos/bobbie/generar.mjs   -> asset_NN.json + galeria_personajes.json + galeria_fondos.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const guardar = (n, x) => fs.writeFileSync(path.join(DIR, n), JSON.stringify(x, null, 1));
const r2 = (v) => Math.round(v * 100) / 100;
const S = Math.sin, C = Math.cos, PI = Math.PI;
const max0 = (v) => Math.max(0, v);
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});

// ------------------------------------------------------------------ acciones (ventanas de la linea de tiempo del asset)
const PASO = 50;
const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
    tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
// acciones: [{nombre, dur, pose(tl, dur) -> {parte: {prop: v}}}]; neutro: todas las pistas animadas en reposo
function armarAcciones(acciones, neutro) {
    let t = 0;
    const K = {}, ventanas = [];
    for (const a of acciones) {
        const t0 = t, ts = [];
        for (let tl = 0; tl < a.dur; tl += PASO) ts.push(tl);
        ts.push(a.dur);
        for (const tl of ts) {
            const p = a.pose(tl, a.dur), todo = {};
            for (const [parte, props] of Object.entries(neutro)) todo[parte] = {...props, ...(p[parte] || {})};
            for (const [parte, props] of Object.entries(todo)) for (const [prop, v] of Object.entries(props)) ((K[parte] ||= {})[prop] ||= []).push([t0 + tl, r2(v), "lineal"]);
        }
        ventanas.push({nombre: a.nombre, t0, t1: t0 + a.dur});
        t = t0 + a.dur + 200;
    }
    const eventos = [ev("EventoGeneral", "Nodo_Default", 0, t), ...ventanas.map((v) => ev(v.nombre, "EventoGeneral", v.t0, v.t1))];
    return {K, eventos, total: t};
}
function ponerClaves(partes, K) {
    for (const p of partes) {
        if (K[p.nombre]) p.claves = {...(p.claves || {}), ...K[p.nombre]};
        if (p.partes) ponerClaves(p.partes, K);
    }
}

// ================================================================== BOBBIE (collie, mira a la derecha)
const PERRO_BOBBIE = {sable: "#c98a3e", sableOsc: "#a86a2c", sableLejos: "#94602a", crema: "#f4e7cf", blanco: "#fbf6ec", blancoLejos: "#ddd3c2",
    nariz: "#2a1d17", ojo: "#2b1a10", borde: "#6e4520"};
// una pata: muslo (con pivote arriba) -> pierna (pivote en la rodilla); lejos = mas oscura, detras del cuerpo
let PERRO = null;    // colores del perro que se esta dibujando
function pataPerro(id, x, yTop, yRod, lejos, trasera) {
    const c = lejos ? PERRO.sableLejos : PERRO.sable, b = lejos ? PERRO.blancoLejos : PERRO.blanco;
    const w = trasera ? 9 : 7;
    // (el muslo, del color del cuerpo y sin borde, se funde con el torso; forma redondeada)
    return {nombre: `muslo_${id}`, pivote: [x, yTop + 6], color: c,
        poligono: trasera ? [[x - 14, yTop - 6], [x - 2, yTop - 10], [x + 12, yTop - 4], [x + 11, yTop + 10], [x + 6, yRod], [x - 6, yRod + 2], [x - 13, yTop + 14]]
            : [[x - w, yTop - 4], [x + w, yTop - 4], [x + w, yTop + 10], [x + 6, yRod], [x - 5, yRod], [x - w, yTop + 10]],
        partes: [{nombre: `pierna_${id}`, pivote: [x, yRod], color: b, borde: PERRO.borde,
            poligono: [[x - 5, yRod - 2], [x + 5, yRod - 2], [x + 4, -5], [x + 10, -2], [x + 10, 0], [x - 5, 0], [x - 6, -4]]}]};
}
const bobbiePartes = (tonos) => [{nombre: "cuerpo", pivote: [-40, -40], partes: [
    pataPerro("tl", -32, -60, -30, true, true),
    pataPerro("dl", 30, -56, -30, true, false),
    {nombre: "cola", pivote: [-56, -66], color: PERRO.sable, borde: PERRO.borde,
        poligono: [[-52, -72], [-62, -66], [-74, -54], [-84, -40], [-92, -26], [-90, -16], [-82, -22], [-72, -36], [-60, -50], [-50, -60]],
        partes: [{nombre: "cola_punta", color: PERRO.blanco, poligono: [[-90, -30], [-94, -22], [-90, -14], [-84, -20], [-86, -28]]}]},
    {nombre: "torso", color: PERRO.sable, borde: PERRO.borde,
        poligono: [[-60, -66], [-44, -78], [-10, -82], [20, -82], [40, -76], [52, -62], [46, -42], [24, -36], [-20, -36], [-48, -40], [-60, -52]],
        degradado: lineal([0, -82], [0, -36], [[0, tonos[0]], [0.55, PERRO.sable], [1, tonos[1]]]),
        partes: [{nombre: "panza", color: PERRO.crema, poligono: [[-24, -38], [22, -37], [34, -44], [4, -44], [-30, -44]]},
            {nombre: "lomo_brillo", color: "rgba(255,230,180,0.35)", poligono: [[-40, -74], [-6, -80], [22, -79], [-4, -76], [-30, -72]]}]},
    pataPerro("tc", -38, -64, -30, false, true),
    pataPerro("dc", 26, -58, -30, false, false),
    {nombre: "pecho", color: PERRO.blanco, poligono: [[30, -84], [40, -90], [50, -86], [57, -74], [58, -62], [54, -50], [46, -42], [38, -44], [34, -52], [30, -60], [33, -70], [28, -76]]},
    {nombre: "cabeza", pivote: [46, -82], partes: [
        {nombre: "oreja_lejos", color: PERRO.sableOsc, poligono: [[50, -106], [55, -120], [60, -116], [60, -106]]},
        {nombre: "craneo", color: PERRO.sable, borde: PERRO.borde,
            poligono: [[40, -100], [48, -110], [62, -112], [72, -104], [76, -96], [72, -88], [56, -82], [44, -86]],
            degradado: lineal([50, -112], [60, -84], [[0, tonos[0]], [1, PERRO.sable]])},
        {nombre: "hocico", color: PERRO.sable, borde: PERRO.borde, poligono: [[68, -102], [86, -98], [96, -93], [95, -87], [76, -84], [66, -90]]},
        {nombre: "franja", color: PERRO.blanco, poligono: [[62, -112], [67, -112], [86, -97], [78, -96]]},
        {nombre: "mandibula", color: PERRO.crema, poligono: [[72, -86], [92, -87], [88, -83], [74, -82]]},
        {nombre: "nariz", en: [95, -91], circulo: {r: 3.6, lados: 12}, color: PERRO.nariz},
        {nombre: "ojo", en: [67, -100], circulo: {r: 2.8, lados: 12}, color: PERRO.ojo, partes: [
            {nombre: "ojo_brillo", en: [0.9, -0.9], circulo: {r: 0.9, lados: 8}, color: "#ffffff"}]},
        {nombre: "ceja", color: PERRO.sableOsc, poligono: [[62, -105], [70, -106], [70, -104], [63, -103]]},
        {nombre: "oreja", color: PERRO.sableOsc, borde: PERRO.borde, poligono: [[46, -106], [50, -122], [56, -121], [60, -112], [56, -108]],
            partes: [{nombre: "oreja_punta", color: PERRO.sableOsc, poligono: [[50, -122], [57, -126], [56, -121]]}]},
    ]},
]}];
// poses (grados; negativo = hacia adelante en las patas). p: fase 0..2pi
const NEUTRO_PERRO = Object.fromEntries([["cuerpo", {rotacion: 0, y: 0}], ["cabeza", {rotacion: 0}], ["cola", {rotacion: 15}],
    ...["dc", "dl", "tc", "tl"].flatMap((id) => [[`muslo_${id}`, {rotacion: 0}], [`pierna_${id}`, {rotacion: 0}]])]);
const fase = (tl, dur) => 2 * PI * tl / dur;
const patas = (f) => ({
    muslo_dc: {rotacion: f.dc[0]}, pierna_dc: {rotacion: f.dc[1]}, muslo_dl: {rotacion: f.dl[0]}, pierna_dl: {rotacion: f.dl[1]},
    muslo_tc: {rotacion: f.tc[0]}, pierna_tc: {rotacion: f.tc[1]}, muslo_tl: {rotacion: f.tl[0]}, pierna_tl: {rotacion: f.tl[1]}});
const delantera = (q, a = 18, b = 22) => [-a * S(q), b * max0(-C(q))];
const trasera = (q, a = 16, b = 18) => [-a * S(q), -b * max0(-C(q))];
const ACCIONES_PERRO = [
    {nombre: "Quieto", dur: 1600, pose: (tl, d) => { const p = fase(tl, d); return {cuerpo: {y: -0.8 * S(p)}, cabeza: {rotacion: 2 * S(p)}, cola: {rotacion: 12 + 4 * S(p)}}; }},
    {nombre: "Caminar", dur: 800, pose: (tl, d) => { const p = fase(tl, d);
        return {...patas({dc: delantera(p), tl: trasera(p), dl: delantera(p + PI), tc: trasera(p + PI)}),
            cuerpo: {y: -1.5 * Math.abs(S(2 * p))}, cabeza: {rotacion: 3 * S(2 * p)}, cola: {rotacion: 18 + 8 * S(p)}}; }},
    {nombre: "Correr", dur: 480, pose: (tl, d) => { const p = fase(tl, d);
        return {...patas({dc: delantera(p, 38, 34), dl: delantera(p + 0.35, 38, 34), tc: trasera(p + 2.4, 32, 30), tl: trasera(p + 2.75, 32, 30)}),
            cuerpo: {rotacion: 5 * S(p + 1), y: -7 * max0(S(p))}, cabeza: {rotacion: -4 * S(p)}, cola: {rotacion: 38 + 10 * S(2 * p)}}; }},
    {nombre: "Cola", dur: 600, pose: (tl, d) => { const p = fase(tl, d); return {cola: {rotacion: 32 + 24 * S(2 * p)}, cabeza: {rotacion: -5 + 3 * S(p)}, cuerpo: {y: -1 * Math.abs(S(p))}}; }},
    {nombre: "Sentado", dur: 1600, pose: (tl, d) => { const p = fase(tl, d);
        // (cuerpo inclinado -28 sobre la cadera: patas delanteras verticales (+28), muslo trasero hacia adelante y abajo, garron en el suelo)
        return {...patas({dc: [28, 0], dl: [28, 0], tc: [-32, 127], tl: [-30, 124]}), cuerpo: {rotacion: -28, y: 28 - 0.8 * S(p)}, cabeza: {rotacion: 22 + 2 * S(p)}, cola: {rotacion: 42 + 3 * S(p)}}; }},
    {nombre: "Cojear", dur: 1100, pose: (tl, d) => { const p = fase(tl, d);
        return {...patas({dc: [-26, 42], tl: trasera(p, 12, 12), dl: delantera(p + PI, 14, 16), tc: trasera(p + PI, 12, 12)}),
            cuerpo: {y: -3 * max0(S(p)), rotacion: 3 * max0(S(p))}, cabeza: {rotacion: 14 + 4 * S(p)}, cola: {rotacion: 4}}; }},
    {nombre: "Nadar", dur: 1000, pose: (tl, d) => { const p = fase(tl, d);
        return {...patas({dc: [-30 + 30 * S(p), 40 * max0(C(p))], dl: [-30 + 30 * S(p + PI), 40 * max0(C(p + PI))], tc: [20 * S(p + PI), -20 * max0(C(p))], tl: [20 * S(p), -20 * max0(C(p + PI))]}),
            cuerpo: {rotacion: -10, y: 1.5 * S(p)}, cabeza: {rotacion: 8}, cola: {rotacion: 48}}; }},
];
function asset_perro(nombre, colores, oscuroTorso = ["#b3772f", "#e0ac62"]) {
    PERRO = colores;
    const partes = bobbiePartes(oscuroTorso);
    const {K, eventos, total} = armarAcciones(ACCIONES_PERRO, NEUTRO_PERRO);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre, duracion: total, eventos, partes,
        enganches: {boca: {parte: "cabeza", en: [90, -84]}, lomo: {parte: "torso", en: [-6, -82]}}};
}
const asset_bobbie = () => asset_perro("Bobbie", PERRO_BOBBIE);
// perros del pueblo de Indiana (los que atacan a Bobbie): mismos movimientos, otros colores
const PERRO_NEGRO = {sable: "#3a3634", sableOsc: "#24201e", sableLejos: "#2a2624", crema: "#6a625c", blanco: "#5a524c", blancoLejos: "#4a433e", nariz: "#111111", ojo: "#e0b040", borde: "#151210"};
const PERRO_MANCHADO = {sable: "#8a7a6a", sableOsc: "#5e5044", sableLejos: "#6e6052", crema: "#d8ccbc", blanco: "#c8bcac", blancoLejos: "#a89c8c", nariz: "#221a16", ojo: "#2b1a10", borde: "#3e342a"};

// ================================================================== PERSONAS (perfil, mira a la derecha; cadera en y -110)
const PIEL = "#eab48c", PIEL_OSC = "#d59a72", BORDE_PIEL = "#a9714f";
// ropa: {pantalon?, piernas, zapatos, torso, chaleco?, manga, falda?, sombrero, pelo, bigote?, lazo?}
function persona(r) {
    const pierna = (id, lejos) => ({nombre: `muslo_${id}`, pivote: [0, -106], color: lejos ? r.piernasLejos : r.piernas, borde: r.bordeRopa,
        poligono: [[-9, -112], [9, -112], [7, -58], [-7, -58]], partes: [
            {nombre: `espinilla_${id}`, pivote: [0, -58], color: lejos ? r.mediasLejos : r.medias, borde: r.bordeRopa, poligono: [[-7, -60], [7, -60], [5, -6], [-5, -6]],
                partes: [{nombre: `zapato_${id}`, color: r.zapatos, poligono: [[-7, -8], [6, -8], [16, -3], [16, 0], [-7, 0]]}]}]});
    const brazo = (id, lejos) => ({nombre: `brazo_${id}`, pivote: [0, -176], color: lejos ? r.mangaLejos : r.manga, borde: r.bordeRopa,
        poligono: [[-7, -182], [7, -182], [6, -140], [-6, -140]], partes: [
            {nombre: `antebrazo_${id}`, pivote: [0, -141], color: lejos ? r.mangaLejos : r.manga, borde: r.bordeRopa, poligono: [[-6, -142], [6, -142], [5, -108], [-5, -108]],
                partes: [{nombre: `mano_${id}`, en: [0, -103], circulo: {r: 6, lados: 12}, color: lejos ? PIEL_OSC : PIEL, borde: BORDE_PIEL}]}]});
    const cabeza = {nombre: "cabeza", pivote: [2, -190], partes: [
        {nombre: "cuello", color: PIEL_OSC, poligono: [[-4, -194], [6, -194], [6, -184], [-4, -184]]},
        ...(r.trenza ? [{nombre: "trenza", color: r.pelo, borde: r.bordePelo, poligono: [[-14, -206], [-22, -190], [-24, -170], [-18, -168], [-16, -186], [-8, -200]]}] : []),
        {nombre: "craneo", en: [6, -210], circulo: {r: 19, lados: 24}, color: PIEL, borde: BORDE_PIEL},
        {nombre: "nariz", color: PIEL, borde: BORDE_PIEL, poligono: [[23, -214], [29, -205], [23, -203]]},
        {nombre: "mejilla", en: [16, -202], circulo: {r: 4, lados: 10}, color: "rgba(230,120,110,0.35)"},
        {nombre: "ojo", en: [17, -213], circulo: {r: 2.4, lados: 10}, color: "#2b1d16", partes: [{nombre: "ojo_brillo", en: [0.8, -0.8], circulo: {r: 0.8, lados: 6}, color: "#ffffff"}]},
        {nombre: "ceja", color: r.pelo, poligono: [[13, -219], [21, -219], [21, -217], [13, -217]]},
        // (pivote en el centro: la boca se abre con la voz escalando en y; voces.mjs boca)
        {nombre: "boca", color: "#7a3328", pivote: [20, -198], poligono: [[16.5, -199.5], [23.5, -199.5], [22.5, -196.5], [17, -196.5]]},
        {nombre: "oreja", en: [1, -209], elipse: [3.5, 5], color: PIEL_OSC, borde: BORDE_PIEL},
        {nombre: "pelo", color: r.pelo, borde: r.bordePelo, poligono: r.peinado},
        ...(r.bigote ? [{nombre: "bigote", color: r.pelo, poligono: [[17, -203], [26, -203], [25, -200], [17, -200]]}] : []),
        ...(r.lazo ? [{nombre: "lazo", color: r.lazo, poligono: [[-14, -226], [-6, -222], [-14, -216], [-20, -222]]}] : []),
        ...r.sombrero,
    ]};
    const torso = {nombre: "torso", color: r.torso, borde: r.bordeRopa, poligono: [[-12, -186], [10, -186], [14, -176], [12, -112], [-12, -112], [-14, -150]],
        partes: [...(r.chaleco ? [{nombre: "chaleco", color: r.chaleco, borde: r.bordeRopa, poligono: [[-12, -180], [4, -184], [12, -150], [12, -116], [-12, -116]]},
            {nombre: "botones", color: "#d9c48a", poligono: [[8, -160], [10, -160], [10, -126], [8, -126]]}] : []),
            {nombre: "cuello_ropa", color: r.cuello || "#f3efe6", poligono: [[-2, -188], [8, -188], [10, -180], [0, -182]]},
            ...(r.cinturon ? [{nombre: "cinturon", color: r.cinturon, poligono: [[-12, -118], [12, -118], [12, -112], [-12, -112]]}] : [])]};
    const falda = r.falda ? [{nombre: "falda", color: r.torso, borde: r.bordeRopa, poligono: r.falda, degradado: lineal([0, -116], [0, r.falda[2][1]], [[0, r.torso], [1, r.torsoOsc || r.torso]])}] : [];
    // (la falda va despues de las dos piernas: las cubre)
    return [{nombre: "cuerpo", pivote: [0, -106], partes: [brazo("tras", true), pierna("tras", true), torso, pierna("del", false), ...falda, cabeza, brazo("del", false)]}];
}
const NEUTRO_PERSONA = Object.fromEntries([["cuerpo", {y: 0}], ["cabeza", {rotacion: 0}],
    ...["del", "tras"].flatMap((id) => [[`muslo_${id}`, {rotacion: 0}], [`espinilla_${id}`, {rotacion: 0}], [`brazo_${id}`, {rotacion: 0}], [`antebrazo_${id}`, {rotacion: -6}]])]);
const piernasPersona = (p, a = 22, b = 28) => ({muslo_del: {rotacion: -a * S(p)}, espinilla_del: {rotacion: b * max0(S(p))}, muslo_tras: {rotacion: a * S(p)}, espinilla_tras: {rotacion: b * max0(-S(p))}});
const ACCIONES_PERSONA = [
    {nombre: "Quieto", dur: 2000, pose: (tl, d) => { const p = fase(tl, d); return {cuerpo: {y: -0.8 * S(p)}, cabeza: {rotacion: 1.5 * S(p)}, brazo_del: {rotacion: 2 * S(p)}, brazo_tras: {rotacion: -2 * S(p)}}; }},
    {nombre: "Caminar", dur: 900, pose: (tl, d) => { const p = fase(tl, d);
        return {...piernasPersona(p), brazo_del: {rotacion: 18 * S(p)}, brazo_tras: {rotacion: -18 * S(p)}, antebrazo_del: {rotacion: -12}, antebrazo_tras: {rotacion: -12},
            cuerpo: {y: -2.5 * Math.abs(C(p))}, cabeza: {rotacion: 1.5 * S(2 * p)}}; }},
    // llamar a gritos: mano en la boca, cabeza arriba
    {nombre: "Llamar", dur: 1400, pose: (tl, d) => { const p = fase(tl, d);
        return {brazo_del: {rotacion: -62}, antebrazo_del: {rotacion: -146}, brazo_tras: {rotacion: 6}, cabeza: {rotacion: -10 + 4 * S(p)}, cuerpo: {y: -1 * max0(S(p))}}; }},
    // caminar lento con el brazo estirado adelante y abajo (el farol cuelga derecho de la mano: en la escena, girar: false)
    {nombre: "Buscar", dur: 1400, pose: (tl, d) => { const p = fase(tl, d);
        return {...piernasPersona(p, 15, 20), brazo_del: {rotacion: -42 + 2 * S(p)}, antebrazo_del: {rotacion: -14}, brazo_tras: {rotacion: -12 * S(p)},
            cuerpo: {y: -1.5 * Math.abs(C(p))}, cabeza: {rotacion: 4 * S(p) - 3}}; }},
    // sentado (en el asiento del auto): cadera 52 mas abajo, muslos horizontales, brazos adelante (manejar / apoyarse)
    {nombre: "Sentado", dur: 1600, pose: (tl, d) => { const p = fase(tl, d);
        return {cuerpo: {y: 52 - 0.6 * S(p)}, muslo_del: {rotacion: -90}, espinilla_del: {rotacion: 90}, muslo_tras: {rotacion: -86}, espinilla_tras: {rotacion: 86},
            brazo_del: {rotacion: -62}, antebrazo_del: {rotacion: -20}, brazo_tras: {rotacion: -55}, antebrazo_tras: {rotacion: -25}, cabeza: {rotacion: 1.5 * S(p)}}; }},
    // arrodillada abrazando (al perro, adelante y abajo)
    {nombre: "Abrazar", dur: 1600, pose: (tl, d) => { const p = fase(tl, d);
        return {cuerpo: {y: 50 - 1 * S(p)}, muslo_del: {rotacion: -88}, espinilla_del: {rotacion: 88}, muslo_tras: {rotacion: 8}, espinilla_tras: {rotacion: 92},
            brazo_del: {rotacion: -58 + 3 * S(p)}, antebrazo_del: {rotacion: -22}, brazo_tras: {rotacion: -48 + 3 * S(p)}, antebrazo_tras: {rotacion: -26}, cabeza: {rotacion: 12}}; }},
];
const SOMBRERO_FEDORA = [{nombre: "sombrero_ala", color: "#4a3b2c", poligono: [[-16, -224], [30, -224], [28, -220], [-14, -220]]},
    {nombre: "sombrero_copa", color: "#5a4836", borde: "#3a2c20", poligono: [[-10, -224], [-8, -240], [8, -243], [22, -238], [24, -224]], partes: [
        {nombre: "sombrero_cinta", color: "#2a211a", poligono: [[-9, -230], [23, -230], [24, -225], [-10, -225]]}]}];
const CLOCHE = [{nombre: "cloche", color: "#8c2f39", borde: "#5e1c24", poligono: [[-16, -208], [-14, -224], [-4, -232], [12, -232], [24, -224], [27, -214], [20, -215], [8, -220], [-8, -214]], partes: [
    {nombre: "cloche_cinta", color: "#d9b25a", poligono: [[-15, -216], [24, -219], [25, -215], [-15, -212]]}]}];
const PANUELO = [{nombre: "panuelo", color: "#c96a3a", borde: "#8a4524", poligono: [[-18, -206], [-16, -224], [-4, -232], [12, -231], [24, -222], [24, -214], [14, -220], [-2, -218], [-10, -206], [-20, -194]]},
    {nombre: "panuelo_nudo", color: "#b55a2e", poligono: [[-18, -202], [-26, -196], [-22, -190], [-14, -196]]}];
const ROPA = {
    Frank: {piernas: "#5b4636", piernasLejos: "#4a3a2d", medias: "#5b4636", mediasLejos: "#4a3a2d", zapatos: "#1f1a17", torso: "#f3efe6", chaleco: "#6d6f73",
        manga: "#f3efe6", mangaLejos: "#d8d2c6", bordeRopa: "#3b3430", pelo: "#4a3426", bordePelo: "#2e1f16", bigote: true, cinturon: "#2a211a",
        peinado: [[-12, -222], [6, -230], [22, -224], [20, -218], [4, -222], [-10, -216], [-13, -206]], sombrero: SOMBRERO_FEDORA},
    Elizabeth: {piernas: "#5f8fa8", piernasLejos: "#4f7a91", medias: "#e2c3a8", mediasLejos: "#cdae94", zapatos: "#3a2a22", torso: "#5f8fa8", torsoOsc: "#4f7a91",
        manga: "#5f8fa8", mangaLejos: "#4f7a91", bordeRopa: "#2f4a5a", pelo: "#6b3e26", bordePelo: "#43261a", cuello: "#f6f1e6",
        peinado: [[-14, -222], [6, -228], [22, -222], [22, -214], [10, -218], [-4, -214], [-12, -196], [-18, -200]], sombrero: CLOCHE,
        falda: [[-14, -116], [14, -116], [24, -44], [-22, -44]]},
    Hija: {piernas: "#e9b949", piernasLejos: "#d4a43c", medias: "#f6f1e6", mediasLejos: "#ddd6c8", zapatos: "#5a2a2a", torso: "#e9b949", torsoOsc: "#d4a43c",
        manga: "#e9b949", mangaLejos: "#d4a43c", bordeRopa: "#8a6a20", pelo: "#8a5a2b", bordePelo: "#5e3b1a", cuello: "#ffffff", trenza: true, lazo: "#c0392b",
        peinado: [[-14, -222], [6, -230], [22, -224], [22, -216], [10, -220], [-6, -216], [-14, -204]], sombrero: [],
        falda: [[-14, -116], [14, -116], [22, -64], [-20, -64]]},
    // granjera de las Grandes Llanuras (le da comida a Bobbie en el viaje): panuelo, vestido cafe y delantal
    Granjera: {piernas: "#7a4a32", piernasLejos: "#653c28", medias: "#3a2a22", mediasLejos: "#2e221c", zapatos: "#2a1e18", torso: "#7a4a32", torsoOsc: "#5e3826",
        chaleco: "#efe7d4", manga: "#7a4a32", mangaLejos: "#653c28", bordeRopa: "#3e2418", pelo: "#6e6a66", bordePelo: "#4a4642", cuello: "#efe7d4",
        peinado: [[-14, -218], [6, -226], [20, -220], [18, -214], [6, -216], [-8, -212], [-14, -200]], sombrero: PANUELO,
        falda: [[-14, -116], [14, -116], [24, -40], [-22, -40]]},
};
function asset_persona(nombre) {
    const partes = persona(ROPA[nombre]);
    const {K, eventos, total} = armarAcciones(ACCIONES_PERSONA, NEUTRO_PERSONA);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre, duracion: total, eventos, partes,
        enganches: {mano: {parte: "antebrazo_del", en: [0, -100]}, mano_tras: {parte: "antebrazo_tras", en: [0, -100]}}};
}

// ================================================================== AUTO de los años 20 (mira a la derecha)
function rueda(id, x) {
    return {nombre: `rueda_${id}`, en: [x, -34], pivote: [0, 0], partes: [
        {nombre: `neumatico_${id}`, circulo: {r: 34, lados: 28}, color: "#1b1b1f"},
        {nombre: `llanta_${id}`, circulo: {r: 25, lados: 24}, color: "#e9dcc0", borde: "#b9a882"},
        ...Array.from({length: 10}, (_, k) => ({nombre: `rayo_${id}_${k}`, rotacion: k * 36, color: "#c9b88e", poligono: [[-1.6, 0], [1.6, 0], [1.2, -24], [-1.2, -24]]})),
        {nombre: `cubo_${id}`, circulo: {r: 6, lados: 12}, color: "#b8902e"}]};
}
function asset_auto() {
    const partes = [{nombre: "auto", partes: [
        {nombre: "carroceria", partes: [
            // capota de lona alta (los pasajeros sentados caben debajo): techo fino, panel de atras y postes
            {nombre: "capota", color: "#b8a47a", borde: "#7d6c4a", poligono: [[-152, -246], [54, -246], [58, -236], [-148, -236]]},
            {nombre: "capota_atras", color: "#a8946a", borde: "#7d6c4a", poligono: [[-156, -104], [-152, -246], [-138, -246], [-140, -104]]},
            {nombre: "poste_capota", color: "#3a3226", poligono: [[48, -240], [52, -240], [58, -96], [54, -96]]},
            {nombre: "poste_medio", color: "#3a3226", poligono: [[-46, -240], [-42, -240], [-42, -104], [-46, -104]]},
            {nombre: "asiento_tras", color: "#6b3a2a", poligono: [[-138, -108], [-128, -152], [-104, -152], [-96, -104]]},
            {nombre: "asiento_del", color: "#6b3a2a", poligono: [[-34, -108], [-26, -146], [-6, -146], [4, -104]]},
            {nombre: "parabrisas", color: "rgba(200,225,235,0.55)", borde: "#3a3a3a", poligono: [[56, -200], [62, -200], [64, -96], [58, -96]]},
            {nombre: "caja", color: "#22252b", borde: "#0f1014", poligono: [[-156, -50], [-156, -104], [-100, -106], [-92, -92], [40, -92], [60, -98], [140, -96], [152, -66], [152, -50]],
                degradado: lineal([0, -106], [0, -50], [[0, "#3a3f48"], [0.5, "#22252b"], [1, "#16181c"]])},
            {nombre: "brillo_caja", color: "rgba(255,255,255,0.18)", poligono: [[-150, -98], [-100, -100], [40, -88], [140, -90], [140, -86], [40, -84], [-150, -92]]},
            {nombre: "puerta", color: "rgba(0,0,0,0)", borde: "#0f1014", poligono: [[-60, -92], [-12, -92], [-12, -54], [-60, -54]]},
            {nombre: "manija", color: "#c9a24a", poligono: [[-20, -80], [-12, -80], [-12, -77], [-20, -77]]},
            {nombre: "capot_rejilla", color: "#2e323a", poligono: [[70, -90], [140, -88], [140, -84], [70, -86]]},
            {nombre: "radiador", color: "#c9a24a", borde: "#8a6a24", poligono: [[148, -102], [160, -102], [160, -56], [148, -56]]},
            {nombre: "faro", en: [164, -86], circulo: {r: 9, lados: 16}, color: "#f6e7a8", borde: "#8a6a24"},
            {nombre: "guardabarros_tras", color: "#16181c", poligono: [[-146, -52], [-136, -72], [-100, -80], [-66, -72], [-58, -50]]},
            {nombre: "guardabarros_del", color: "#16181c", poligono: [[62, -52], [76, -74], [108, -80], [140, -70], [156, -48]]},
            {nombre: "estribo", color: "#4a4f57", poligono: [[-62, -46], [66, -46], [66, -40], [-62, -40]]},
            {nombre: "volante", en: [16, -122], elipse: [3, 10], color: "#3a2a1a"}]},
        rueda("tras", -102), rueda("del", 108)]}];
    const ACC = [
        {nombre: "Quieto", dur: 1000, pose: () => ({})},
        {nombre: "Andar", dur: 600, pose: (tl, d) => ({rueda_tras: {rotacion: 360 * tl / d}, rueda_del: {rotacion: 360 * tl / d}, carroceria: {y: -1.5 * Math.abs(S(fase(tl, d)))}})},
    ];
    const {K, eventos, total} = armarAcciones(ACC, {rueda_tras: {rotacion: 0}, rueda_del: {rotacion: 0}, carroceria: {y: 0}});
    ponerClaves(partes, K);
    return {tipo: "asset", nombre: "Auto 1920", duracion: total, eventos, partes,
        enganches: {estribo: {parte: "estribo", en: [10, -46]}, asiento_tras: {parte: "asiento_tras", en: [-110, -104]}, asiento_del: {parte: "asiento_del", en: [-10, -104]}}};
}

// ================================================================== FONDOS (para el cuadro vertical 720 x 1280; suelo en y = 0, x de -460 a 460)
const X0 = -460, X1 = 460;
const cielo = (n, c) => ({nombre: `${n}_cielo`, rect: [X0, -1150, X1, 0], degradado: lineal([0, -1150], [0, 0], c)});
const suelo = (n, c) => ({nombre: `${n}_suelo`, rect: [X0, 0, X1, 520], degradado: lineal([0, 0], [0, 520], c)});
// loma: poligono ondulado entre x0 y x1 a una altura base, con semilla
function loma(nombre, y, amp, color, borde, semilla = 1, extra = {}) {
    const pts = [[X0, 40]];
    for (let x = X0; x <= X1; x += 40) pts.push([x, y - amp * (0.5 + 0.5 * S(x * 0.008 + semilla) * C(x * 0.013 + semilla * 2))]);
    pts.push([X1, 40]);
    return {nombre, color, ...(borde ? {borde} : {}), poligono: pts.map(([a, b]) => [Math.round(a), Math.round(b)]), ...extra};
}
const pino = (n, x, y, alto, color, oscuro) => ({nombre: n, partes: [
    {nombre: `${n}_tronco`, color: "#4a3426", poligono: [[x - 4, y], [x + 4, y], [x + 3, y - alto * 0.25], [x - 3, y - alto * 0.25]]},
    {nombre: `${n}_copa`, color, borde: oscuro, poligono: [[x, y - alto], [x + alto * 0.18, y - alto * 0.62], [x + alto * 0.12, y - alto * 0.62], [x + alto * 0.28, y - alto * 0.3],
        [x - alto * 0.28, y - alto * 0.3], [x - alto * 0.12, y - alto * 0.62], [x - alto * 0.18, y - alto * 0.62]]}]});
// abeto de pisos (abeto de Douglas): tronco fino y varios pisos de ramas que se achican hacia arriba, con un lado en sombra
function abeto(n, x, y, alto, color, sombra, pisos = 6) {
    const partes = [{nombre: `${n}_tronco`, color: "#4a3a2e", poligono: [[x - 3, y], [x + 3, y], [x + 2, y - alto * 0.3], [x - 2, y - alto * 0.3]]}];
    for (let k = 0; k < pisos; k++) {
        const base = y - alto * (0.12 + k * 0.8 / pisos), alt = alto * 0.26, w = alto * 0.2 * (1 - k / (pisos + 1));
        partes.push({nombre: `${n}_piso${k}`, color, poligono: [[x - w, base], [x - w * 0.55, base - alt * 0.35], [x, base - alt], [x + w * 0.55, base - alt * 0.35], [x + w, base], [x + w * 0.3, base - alt * 0.12], [x - w * 0.3, base - alt * 0.12]]});
        partes.push({nombre: `${n}_sombra${k}`, color: sombra, poligono: [[x, base - alt], [x + w * 0.55, base - alt * 0.35], [x + w, base], [x + w * 0.3, base - alt * 0.12], [x, base - alt * 0.15]]});
    }
    return {nombre: n, partes};
}
// helecho: frondas en abanico (cada fronda, una hoja larga y curva)
const helecho = (n, x, y, e = 1) => ({nombre: n, partes: [-62, -38, -14, 12, 36, 60].map((a, k) => {
    const r = (a * PI) / 180, L = (46 + (k % 2) * 14) * e, ex = x + S(r) * L, ey = y - C(r) * L * 0.8;
    const nx = C(r) * 7 * e, ny = S(r) * 5 * e;
    return {nombre: `${n}_fronda${k}`, color: k % 2 ? "#5f9450" : "#4f8244",
        poligono: [[x, y], [(x + ex) / 2 - nx, (y + ey) / 2 - ny], [ex, ey], [(x + ex) / 2 + nx, (y + ey) / 2 + ny]]};
})});
const nubes = (n, ys, color) => ys.map(([x, y, w], i) => ({nombre: `${n}_nube${i}`, color, poligono: [[x, y], [x + w * 0.2, y - 16], [x + w * 0.45, y - 24], [x + w * 0.7, y - 14], [x + w, y], [x + w * 0.9, y + 8], [x + w * 0.1, y + 8]]}));
const estrellas = (n, k) => Array.from({length: k}, (_, i) => ({nombre: `${n}_e${i}`, en: [Math.round(X0 + ((i * 97) % 920)), Math.round(-1120 + ((i * 263) % 700))],
    circulo: {r: i % 4 === 0 ? 2.4 : 1.4, lados: 6}, color: i % 3 ? "#fff8e0" : "#cfe3ff"}));

function fondo(nombre, partes) { return {tipo: "asset", nombre, partes: [{nombre: nombre.toLowerCase().replace(/[^a-z]+/g, "_"), partes}]}; }

const FONDOS = [
    fondo("Fondo Silverton", [
        cielo("sil", [[0, "#7fb4d9"], [0.7, "#cfe3e8"], [1, "#f3e6c4"]]),
        ...nubes("sil", [[-380, -940, 180], [80, -1010, 220], [200, -780, 150]], "rgba(255,255,255,0.85)"),
        loma("sil_colina_lejos", -260, 120, "#9cb89a", null, 2),
        loma("sil_colina", -150, 80, "#7aa070", null, 5),
        pino("sil_pino1", -400, -120, 260, "#4f7a52", "#365a3a"), pino("sil_pino2", 400, -110, 300, "#4f7a52", "#365a3a"),
        // casa de los Brazier: madera pintada, porche
        {nombre: "casa", partes: [
            {nombre: "casa_muro", color: "#e8d9b5", borde: "#9a8458", poligono: [[-300, 0], [-300, -260], [60, -260], [60, 0]],
                partes: Array.from({length: 12}, (_, k) => ({nombre: `casa_tabla${k}`, color: "rgba(120,90,50,0.18)", poligono: [[-300, -20 - k * 21], [60, -20 - k * 21], [60, -18 - k * 21], [-300, -18 - k * 21]]}))},
            {nombre: "casa_techo", color: "#8c4a3a", borde: "#5e2f24", poligono: [[-330, -250], [-120, -400], [90, -250]]},
            {nombre: "casa_ventana_alta", color: "#fff1c8", borde: "#5e4a30", poligono: [[-150, -360], [-90, -360], [-90, -300], [-150, -300]]},
            {nombre: "casa_ventana", color: "#cfe3e8", borde: "#5e4a30", poligono: [[-260, -200], [-180, -200], [-180, -120], [-260, -120]]},
            {nombre: "casa_puerta", color: "#6b4a2b", borde: "#3e2a18", poligono: [[-60, 0], [-60, -150], [0, -150], [0, 0]]},
            {nombre: "casa_porche_techo", color: "#a85a46", poligono: [[-120, -170], [80, -170], [70, -186], [-110, -186]]},
            {nombre: "casa_poste1", color: "#f3efe6", poligono: [[-112, 0], [-104, 0], [-104, -170], [-112, -170]]},
            {nombre: "casa_poste2", color: "#f3efe6", poligono: [[62, 0], [70, 0], [70, -170], [62, -170]]},
            {nombre: "casa_escalon", color: "#b49a6e", poligono: [[-80, 0], [20, 0], [20, -12], [-80, -12]]}]},
        {nombre: "cerca", partes: [{nombre: "cerca_barra", color: "#f6f1e6", poligono: [[100, -46], [460, -46], [460, -38], [100, -38]]},
            ...Array.from({length: 9}, (_, k) => ({nombre: `cerca_tabla${k}`, color: "#f6f1e6", borde: "#c9bba3", poligono: [[110 + k * 40, 0], [126 + k * 40, 0], [126 + k * 40, -70], [118 + k * 40, -80], [110 + k * 40, -70]]}))]},
        suelo("sil", [[0, "#b8935e"], [0.2, "#a88352"], [1, "#7a5c38"]]),
        {nombre: "sil_pasto", color: "#7aa070", poligono: [[X0, 0], [X1, 0], [X1, 10], [X0, 10]]},
    ]),
    fondo("Fondo estación", [
        cielo("est", [[0, "#5d6fa3"], [0.6, "#e7a46a"], [1, "#f6d18a"]]),
        loma("est_campo", -40, 20, "#c9a75a", null, 3),
        {nombre: "cobertizo", partes: [{nombre: "cob_muro", color: "#9a3b2e", borde: "#5e2219", poligono: [[-420, 0], [-420, -220], [-160, -220], [-160, 0]]},
            {nombre: "cob_techo", color: "#5a4a3e", poligono: [[-440, -210], [-290, -300], [-140, -210]]},
            {nombre: "cob_letrero", color: "#f3e6c4", borde: "#3a2a1a", poligono: [[-400, -270], [-180, -270], [-180, -232], [-400, -232]]},
            {nombre: "cob_puerta", color: "#3e2a1e", poligono: [[-330, 0], [-330, -140], [-260, -140], [-260, 0]]}]},
        // surtidor de gasolina de los años 20: cuerpo rojo alto y globo de vidrio
        {nombre: "surtidor", partes: [{nombre: "surt_base", color: "#3a3a3a", poligono: [[40, 0], [100, 0], [96, -14], [44, -14]]},
            {nombre: "surt_cuerpo", color: "#c1272d", borde: "#7a1418", poligono: [[48, -14], [92, -14], [88, -230], [52, -230]],
                degradado: lineal([48, 0], [92, 0], [[0, "#d9343a"], [1, "#9a1c22"]])},
            {nombre: "surt_ventana", color: "#f3e6c4", borde: "#5e2219", poligono: [[58, -200], [82, -200], [82, -160], [58, -160]]},
            {nombre: "surt_globo", en: [70, -258], circulo: {r: 26, lados: 22}, color: "rgba(255,250,235,0.9)", borde: "#9a1c22"},
            {nombre: "surt_manguera", color: "#1f1f1f", poligono: [[90, -120], [118, -100], [120, -60], [116, -58], [114, -96], [88, -114]]}]},
        suelo("est", [[0, "#9a8a70"], [1, "#6a5c48"]]),
    ]),
    fondo("Fondo maizal", [
        cielo("mai", [[0, "#e98a4a"], [0.6, "#f6c27a"], [1, "#fbe3b0"]]),
        loma("mai_lejos", -120, 40, "#c98f4a", null, 4),
        ...Array.from({length: 16}, (_, k) => {
            const x = X0 + 20 + k * 58, h = 220 + ((k * 53) % 70);
            return {nombre: `maiz${k}`, color: "#c9a44a", borde: "#8a6a24", poligono: [[x - 4, 0], [x + 4, 0], [x + 2, -h], [x - 2, -h]], partes: [
                {nombre: `maiz${k}_hoja1`, color: "#b8903e", poligono: [[x, -h * 0.4], [x + 34, -h * 0.55], [x + 4, -h * 0.46]]},
                {nombre: `maiz${k}_hoja2`, color: "#d4b25a", poligono: [[x, -h * 0.65], [x - 30, -h * 0.78], [x - 4, -h * 0.7]]},
                {nombre: `maiz${k}_mazorca`, color: "#e9c46a", poligono: [[x + 3, -h * 0.5], [x + 12, -h * 0.62], [x + 6, -h * 0.66]]}]};
        }),
        suelo("mai", [[0, "#9a6a3a"], [1, "#6a4626"]]),
        {nombre: "mai_camino", color: "#c9a06a", poligono: [[-120, 0], [120, 0], [260, 520], [-260, 520]]},
    ]),
    fondo("Fondo río", [
        cielo("rio", [[0, "#8a9aaa"], [1, "#d9e1e6"]]),
        loma("rio_orilla_lejos", -60, 30, "#8f9a8a", null, 6),
        pino("rio_pino1", -380, -50, 200, "#5a6e5e", "#3e4e42"), pino("rio_pino2", -320, -40, 160, "#5a6e5e", "#3e4e42"), pino("rio_pino3", 360, -45, 220, "#5a6e5e", "#3e4e42"),
        {nombre: "agua", color: "#5f88a8", poligono: [[X0, -20], [X1, -20], [X1, 360], [X0, 360]], degradado: lineal([0, -20], [0, 360], [[0, "#8fb0c8"], [1, "#3e6582"]])},
        ...Array.from({length: 6}, (_, k) => ({nombre: `ola${k}`, color: "rgba(255,255,255,0.35)", poligono: [[X0 + k * 160, 40 + k * 46], [X0 + k * 160 + 120, 36 + k * 46], [X0 + k * 160 + 120, 40 + k * 46], [X0 + k * 160, 44 + k * 46]],
            claves: {x: [[0, 0, "suave"], [2000, 40, "suave"], [4000, 0]]}, bucle: "repetir"})),
        ...[[-300, 100], [120, 60], [260, 200]].map(([x, y], k) => ({nombre: `hielo${k}`, color: "#eef5f8", borde: "#a9c3d2", poligono: [[x, y], [x + 60, y - 6], [x + 80, y + 6], [x + 20, y + 14]],
            claves: {x: [[0, 0, "suave"], [3000, 20, "suave"], [6000, 0]]}, bucle: "repetir"})),
        {nombre: "rio_orilla", color: "#7a8a70", poligono: [[X0, 360], [X1, 360], [X1, 520], [X0, 520]]},
    ]),
    fondo("Fondo pradera nevada", [
        cielo("pra", [[0, "#9aa7b4"], [1, "#e6ebee"]]),
        loma("pra_loma_lejos", -140, 60, "#dfe6ea", null, 7),
        loma("pra_loma", -40, 40, "#eef3f5", null, 9),
        ...[[-360, -60], [300, -80]].map(([x, y], k) => ({nombre: `arbol_seco${k}`, color: "#4a3a30", poligono: [[x - 5, y], [x + 5, y], [x + 3, y - 160], [x + 30, y - 210], [x + 26, y - 214], [x, y - 176], [x - 22, y - 220], [x - 26, y - 216], [x - 3, y - 160]]})),
        ...Array.from({length: 7}, (_, k) => ({nombre: `poste${k}`, color: "#5a4a3a", poligono: [[X0 + 40 + k * 140, 0], [X0 + 48 + k * 140, 0], [X0 + 48 + k * 140, -80], [X0 + 40 + k * 140, -80]]})),
        {nombre: "alambre", color: "#5a4a3a", poligono: [[X0, -62], [X1, -58], [X1, -56], [X0, -60]]},
        suelo("pra", [[0, "#f4f7f9"], [1, "#cfdbe2"]]),
    ]),
    fondo("Fondo montañas", [
        cielo("mon", [[0, "#3f5a8a"], [0.7, "#a8b8d0"], [1, "#e3e8ee"]]),
        {nombre: "pico_lejos", color: "#8a98b0", poligono: [[X0, -200], [-260, -620], [-120, -460], [40, -760], [220, -500], [340, -640], [X1, -380], [X1, -100], [X0, -100]],
            partes: [{nombre: "nieve_lejos", color: "#eef2f7", poligono: [[-300, -560], [-260, -620], [-222, -560], [-240, -570], [-262, -548], [-284, -566]]},
                {nombre: "nieve_lejos2", color: "#eef2f7", poligono: [[-20, -650], [40, -760], [96, -660], [70, -672], [40, -640], [10, -666]]},
                {nombre: "nieve_lejos3", color: "#eef2f7", poligono: [[300, -580], [340, -640], [384, -580], [360, -590], [340, -570], [318, -592]]}]},
        {nombre: "pico_cerca", color: "#5f6f86", poligono: [[X0, -60], [-200, -420], [-60, -260], [120, -480], [X1, -120], [X1, 0], [X0, 0]],
            degradado: lineal([0, -480], [0, 0], [[0, "#6c7c94"], [1, "#3e4a5c"]]),
            partes: [{nombre: "nieve_cerca", color: "#f4f7fa", poligono: [[-250, -350], [-200, -420], [-150, -350], [-180, -362], [-200, -336], [-224, -366]]},
                {nombre: "nieve_cerca2", color: "#f4f7fa", poligono: [[60, -380], [120, -480], [190, -380], [160, -396], [130, -366], [96, -400]]}]},
        ...[-420, -330, 330, 420].map((x, k) => pino(`mon_pino${k}`, x, -10, 170 + k * 15, "#2f4a3e", "#1e3028")),
        suelo("mon", [[0, "#f6f9fb"], [1, "#d2dde6"]]),
    ]),
    // bosque de Oregon (abetos de Douglas) bajo la lluvia: capas con niebla, troncos que enmarcan, sendero y helechos
    fondo("Fondo bosque", [
        cielo("bos", [[0, "#8a9a9c"], [0.6, "#b9c6c4"], [1, "#d3dcd8"]]),
        ...Array.from({length: 13}, (_, k) => abeto(`bos_lejos${k}`, X0 + 10 + k * 74, -70, 360 + ((k * 89) % 230), "#9fb2b0", "#8fa3a1", 6)),
        // (la niebla llega hasta el suelo: sin borde visible entre los abetos)
        {nombre: "bos_niebla_alta", rect: [X0, -460, X1, 10], borde: "rgba(0,0,0,0)", degradado: lineal([0, -460], [0, 10], [[0, "rgba(215,225,222,0)"], [1, "rgba(215,225,222,0.8)"]])},
        ...Array.from({length: 9}, (_, k) => abeto(`bos_medio${k}`, X0 + 40 + k * 108, -14, 470 + ((k * 137) % 260), "#4f6f5e", "#3e5b4b", 7)),
        {nombre: "bos_niebla_baja", rect: [X0, -150, X1, 10], borde: "rgba(0,0,0,0)", degradado: lineal([0, -150], [0, 10], [[0, "rgba(220,228,224,0)"], [1, "rgba(220,228,224,0.55)"]])},
        suelo("bos", [[0, "#5d6b45"], [0.3, "#4a5838"], [1, "#2f3a24"]]),
        {nombre: "bos_sendero", color: "#8a7050", poligono: [[-70, 0], [60, 0], [140, 120], [230, 300], [300, 520], [-180, 520], [-120, 300], [-110, 120]],
            degradado: lineal([0, 0], [0, 520], [[0, "#9a8060"], [1, "#6e5638"]])},
        {nombre: "bos_tronco_caido", partes: [
            {nombre: "bos_caido", color: "#5e4632", borde: "#3e2c1e", poligono: [[180, -8], [400, -30], [410, -4], [190, 18]]},
            {nombre: "bos_caido_anillo", en: [184, 5], elipse: [9, 13], color: "#b08a5e", borde: "#5e4632"},
            {nombre: "bos_caido_musgo", color: "#6e8a3e", poligono: [[230, -14], [300, -22], [330, -20], [260, -10]]},
            {nombre: "bos_hongo1", color: "#d9c39a", poligono: [[320, -24], [332, -32], [344, -24]]},
            {nombre: "bos_hongo2", color: "#d9c39a", poligono: [[350, -27], [358, -33], [366, -27]]}]},
        ...[[-430, 30, 1], [-300, 46, 0.8], [-170, 20, 0.7], [110, 34, 0.9], [270, 60, 1.1], [420, 26, 0.8], [-380, 140, 1.4], [380, 150, 1.5]].map(([x, y, e], k) => helecho(`bos_helecho${k}`, x, y, e)),
        ...[[-410, 86], [410, 80]].map(([x, w], k) => ({nombre: `bos_tronco${k}`, partes: [
            {nombre: `bos_tronco${k}_corteza`, color: "#5a4030", poligono: [[x - w / 2, 80], [x - w / 2 + 6, -1150], [x + w / 2 - 6, -1150], [x + w / 2, 80]],
                degradado: lineal([x - w / 2, 0], [x + w / 2, 0], [[0, "#3e2c20"], [0.45, "#6a4c38"], [1, "#3a281c"]])},
            ...Array.from({length: 7}, (_, j) => ({nombre: `bos_tronco${k}_grieta${j}`, color: "rgba(30,20,14,0.45)",
                poligono: [[x - w / 2 + 12 + (j % 3) * 18, 60 - j * 170], [x - w / 2 + 16 + (j % 3) * 18, 60 - j * 170], [x - w / 2 + 14 + (j % 3) * 18, -60 - j * 170]]})),
            {nombre: `bos_tronco${k}_musgo`, color: "#6e8a3e", poligono: [[x - w / 2, 80], [x - w / 2 + 4, -120], [x - w / 2 + 22, -60], [x - w / 2 + 18, 80]]}]})),
    ]),
    fondo("Fondo noche", [
        cielo("noc", [[0, "#0b1430"], [0.7, "#243a6a"], [1, "#3e4a6a"]]),
        ...estrellas("noc", 40),
        {nombre: "luna", en: [260, -900], circulo: {r: 46, lados: 28}, color: "#f4ecd0", partes: [{nombre: "luna_halo", circulo: {r: 90, lados: 28}, color: "rgba(244,236,208,0.12)"}]},
        loma("noc_campo", -40, 30, "#1e2a3e", null, 3),
        suelo("noc", [[0, "#1a2232"], [1, "#0e131c"]]),
    ]),
];

// ------------------------------------------------------------------ escritura de assets
const ASSETS = [asset_bobbie(), asset_persona("Frank"), asset_persona("Elizabeth"), asset_persona("Hija"), asset_auto(), ...FONDOS,
    asset_perro("Perro negro", PERRO_NEGRO, ["#24201e", "#4a4440"]), asset_perro("Perro manchado", PERRO_MANCHADO, ["#6e6052", "#a89c8c"]),
    asset_persona("Granjera")];
ASSETS.forEach((a, i) => guardar(`asset_${String(i + 1).padStart(2, "0")}.json`, a));

// ------------------------------------------------------------------ galerias (para revisar la fase 2)
const VERT = {tamano: [720, 1280], centro: [360, 640]};
const etiqueta = (texto, desde, hasta) => ({texto, desde, hasta, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 34, color: "#ffffff", fuente: "serif", velocidad: 0, resplandor: 6});
const accionesBobbie = ["Quieto", "Caminar", "Correr", "Cola", "Sentado", "Cojear", "Nadar"];
const accionesPersona = ["Quieto", "Caminar", "Llamar", "Buscar", "Abrazar"];
const galeria1 = {
    tipo: "escena", nombre: "0. Galería de personajes", duracion: 2500 * accionesBobbie.length, precision: "decimal",
    camara: VERT,
    objetos: [
        {instancia: "Fondo Silverton", nombre: "fondo", en: [360, 1000], plano: -10},
        {instancia: "Frank", nombre: "frank", en: [110, 760], escala: 1.15, acciones: accionesPersona.map((a, i) => [i * 3400, a])},
        {instancia: "Elizabeth", nombre: "elizabeth", en: [330, 760], escala: 1.15, acciones: accionesPersona.map((a, i) => [i * 3400 + 300, a])},
        {instancia: "Hija", nombre: "hija", en: [540, 760], escala: 0.85, acciones: accionesPersona.map((a, i) => [i * 3400 + 600, a])},
        {nombre: "farol", padre: "frank", enganche: "mano", partes: [
            {nombre: "farol_asa", rect: [-1, 0, 1, 10], color: "#3a3a3a"},
            {nombre: "farol_luz", en: [0, 22], circulo: {r: 9, lados: 14}, color: "#ffd36b"},
            {nombre: "farol_marco", en: [0, 22], rect: [-8, -12, 8, 12], color: "rgba(0,0,0,0)", borde: "#3a3a3a"}]},
        {instancia: "Bobbie", nombre: "bobbie", en: [300, 1060], escala: 2.2, acciones: accionesBobbie.map((a, i) => [i * 2500, a])},
    ],
    dialogos: accionesBobbie.map((a, i) => etiqueta(`Bobbie: ${a}`, i * 2500 + 100, i * 2500 + 2400)),
};
guardar("galeria_personajes.json", galeria1);

const nombresFondos = FONDOS.map((f) => f.nombre);
const T = 2200;
const galeria2 = {
    tipo: "escena", nombre: "0. Galería de fondos", duracion: T * (nombresFondos.length + 1), precision: "decimal",
    camara: {...VERT, claves: {x: [[0, 360, "mantener"], ...nombresFondos.map((_, i) => [T * (i + 1), 360 + (i + 1) * 1000, "mantener"])]}},
    objetos: [
        {instancia: "Fondo Silverton", nombre: "fondo_auto", en: [360, 1000], plano: -10},
        {instancia: "Auto 1920", nombre: "auto", en: [-200, 1000], escala: 1.2, evento: "Andar", claves: {x: [[0, -200], [T, 900]]}},
        {instancia: "Bobbie", nombre: "bobbie", padre: "auto", enganche: "estribo", evento: "Cola"},
        ...nombresFondos.map((n, i) => ({instancia: n, nombre: `fondo_${i}`, en: [360 + (i + 1) * 1000, 1000], plano: -10})),
    ],
    dialogos: [etiqueta("Auto 1920 + Bobbie en el estribo", 100, T - 100), ...nombresFondos.map((n, i) => etiqueta(n, T * (i + 1) + 100, T * (i + 2) - 100))],
};
guardar("galeria_fondos.json", galeria2);
console.log(`escrito en ${DIR}: ${ASSETS.length} assets y 2 galerías`);
