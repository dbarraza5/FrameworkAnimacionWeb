// Fase 5 de planeacion_capacidades.md: DOS PERSONAJES CONVERSAN.
// Ana y Bruno, sentados en un banco al atardecer, dicen 4 lineas. Junta lo de las fases 1-4:
//   - bocas con morphing sincronizadas al texto (labios() -> claves.forma);
//   - voces sintetizadas aparte (voz_ana.json / voz_bruno.json, la misma linea de tiempo);
//   - quien escucha mira, parpadea y asiente; quien habla gesticula con una mano (IK) y
//     levanta las cejas; Bruno toma un sorbo de cafe (la taza sigue a la mano);
//   - mechones y aretes de Ana con inercia; Ana se sonroja con el cumplido (colores);
//   - la camara corta (claves "mantener") entre plano general y primeros planos.
//   node herramientas/ejemplos/conversacion/generar.mjs  -> asset_NN.json, escena.json, voz_*.json
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const marcas = {EventoGeneral: "no_lleva"};
const r1 = (v) => Math.round(v * 10) / 10;
const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const ovalo = (rx, ry, n, cx = 0, cy = 0) => Array.from({length: n}, (_, i) => [r1(cx + rx * Math.cos(i / n * 2 * Math.PI)), r1(cy + ry * Math.sin(i / n * 2 * Math.PI))]);

// ------------------------------------------------------------------ dialogo -> linea de tiempo
const DIALOGO = [
    {quien: "ana", texto: "Bruno, ¿te enteraste? Ahora las sombras siguen a la luz."},
    {quien: "bruno", texto: "¿En serio? Entonces probemos con dos farolas."},
    {quien: "ana", texto: "Ya lo hice. ¡Y el pelo se mueve solo!"},
    {quien: "bruno", texto: "Con razón te veo tan contenta. Te queda muy bien."},
];
function labios(texto, t0) {
    const plano = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/¿|¡/g, "");
    const ev = [], voz = [];
    let t = t0, az = 7 + texto.length;
    const variar = () => { az = (az * 16807) % 2147483647; return az / 2147483647; };
    const empuja = (v, d) => { ev.push({t: Math.round(t), v}); voz.push({t: Math.round(t), d: Math.round(d), v}); t += d; };
    for (let i = 0; i < plano.length; i++) {
        const c = plano[i], sig = plano[i + 1] || "";
        if ("aeiou".includes(c)) empuja(c, 110 + variar() * 60 + (",.?!".includes(sig) || sig === " " ? 40 : 0));
        else if ("mbp".includes(c)) empuja("m", 70);
        else if ("fv".includes(c)) empuja("f", 75);
        else if (c === "s" || c === "z") { voz.push({t: Math.round(t), d: 65, v: "s"}); t += 65; }
        else if (c === ",") empuja("cerrada", 220);
        else if (".?!".includes(c)) empuja("cerrada", i === plano.length - 1 ? 60 : 420);
        else if (c === " ") t += 22;
        else if (c === "h") continue;
        else { voz.push({t: Math.round(t), d: 38, v: "c"}); t += 38; }
    }
    return {cambios: ev.filter((e, i) => i === 0 || e.v !== ev[i - 1].v), voz, fin: Math.round(t)};
}
let cursor = 1300;
const LINEAS = DIALOGO.map((d) => {
    const L = labios(d.texto, cursor);
    const r = {...d, t0: cursor, t1: L.fin, ...L, pregunta: /\?/.test(d.texto)};
    cursor = L.fin + 650;
    return r;
});
const FIN_HABLA = LINEAS[LINEAS.length - 1].t1;
const DUR = FIN_HABLA + 3200;
const SONRISA = FIN_HABLA + 500;          // los dos sonrien al final (Ana sonrojada)

// cambios de boca -> claves de forma (transicion de ~70 ms centrada en cada cambio)
function clavesForma(cambios) {
    const k = [[0, "", "suave"]];
    let antes = "cerrada", t_ant = 0;
    for (const {t, v} of cambios) {
        if (v === antes) continue;
        const tr = Math.max(24, Math.min(70, (t - t_ant) * 0.6));
        const a = Math.round(t - tr / 2), b = Math.round(t + tr / 2);
        if (a > k[k.length - 1][0]) k.push([a, antes === "cerrada" ? "" : antes, "suave"]);
        if (b > k[k.length - 1][0]) k.push([b, v === "cerrada" ? "" : v, "suave"]);
        antes = v; t_ant = t;
    }
    return k;
}

// ------------------------------------------------------------------ boca con morphing (como Lia 2, a escala)
const N = 12;
function formaBoca({w, h = 0, s = 0, k = 1, redondo = false, f = false}, E, cy) {
    w *= E; h *= E; s *= E;
    const xs = Array.from({length: N + 1}, (_, i) => -w + 2 * w * i / N), rev = [...xs].reverse();
    const xd = Array.from({length: 7}, (_, i) => -0.72 * w + 1.44 * w * i / 6), xdr = [...xd].reverse();
    const borde = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), redondo ? 0.5 : 0.75);
    const grosor = (x) => Math.pow(Math.max(0, 1 - (x / w) ** 2), 0.6);
    const sube = (x) => -s * (x / w) ** 2;
    const supIn = (x) => -h / 2 * borde(x) + sube(x), infIn = (x) => h / 2 * borde(x) + sube(x);
    const supOut = (x) => supIn(x) - (9 * k * grosor(x) + 1.5) * E;
    const infOut = (x) => infIn(x) + (12 * k * grosor(x) + 1.5) * E;
    const P = (fx, lista = xs) => lista.map((x) => [r1(x), r1(fx(x) + cy)]);
    const altoSup = f ? 6 * E : Math.max(0, Math.min(7 * E, h - E));
    return {
        interior: [...P(supIn), ...P(infIn, rev)],
        dientes: [...P(supIn, xd), ...P((x) => supIn(x) + altoSup, xdr)],
        labio_inf: [...P(infIn), ...P(infOut, rev)],
        labio_sup: [...P(supOut), ...P(supIn, rev)],
    };
}
const VISEMAS = {
    cerrada: {w: 34}, sonrisa: {w: 42, s: 7}, m: {w: 32, k: 0.7}, f: {w: 34, h: 4, f: true},
    a: {w: 30, h: 24}, e: {w: 36, h: 11}, i: {w: 38, h: 6, s: 3}, o: {w: 22, h: 20, redondo: true}, u: {w: 17, h: 11, redondo: true, k: 1.2},
};
function boca(prefijo, cx, cy, E, claves_forma, colores) {
    const formas = Object.fromEntries(Object.entries(VISEMAS).map(([v, p]) => [v, formaBoca(p, E, 0)]));
    const estilo = {
        interior: {color: "#3a1218", borde: "#3a1218"},
        dientes: {color: "#ece6da", borde: "#ddd4c8"},
        labio_inf: {color: colores.inf, borde: colores.sup},
        labio_sup: {color: colores.sup, borde: colores.sup},
    };
    return {nombre: `${prefijo}boca`, en: [cx, cy], partes: Object.keys(formas.cerrada).map((p) => ({
        nombre: `${prefijo}${p}`, poligono: formas.cerrada[p], ...estilo[p],
        formas: Object.fromEntries(Object.keys(VISEMAS).filter((v) => v !== "cerrada").map((v) => [v, {poligono: formas[v][p]}])),
        claves: {forma: claves_forma},
    }))};
}

// ------------------------------------------------------------------ personaje
// Busto de frente, sentado (el origen es el asiento; un seto tapa de la cintura para abajo).
// `mira`: hacia donde esta el otro (+1 derecha, -1 izquierda): la cara se gira un poco y los
// ojos lo miran. La linea de tiempo (boca, gestos, cabeza...) va dentro del asset (dura DUR).
function persona(P) {
    const s = P.mira, dx = 6 * s;
    const yo = LINEAS.filter((l) => l.quien === P.id), otro = LINEAS.filter((l) => l.quien !== P.id);
    // boca
    const cambios = yo.flatMap((l) => l.cambios.concat([{t: l.t1 + 40, v: "cerrada"}]));
    cambios.push({t: SONRISA, v: "sonrisa"});
    // parpadeos (cada ~2,6-3,6 s) -- el parpado en reposo esta a 0.25
    const parp = [[0, 0.25]];
    for (let t = 1500 + (P.id === "ana" ? 0 : 900); t < DUR - 400; t += 2600 + ((t * 7) % 1000)) parp.push([t, 0.25], [t + 70, 1], [t + 160, 0.25]);
    // cejas: suben al empezar cada linea propia y en las preguntas; quien escucha, sorpresa en "¿En serio?"
    const cejas = [[0, 0, "suave"]];
    for (const l of yo) { cejas.push([l.t0 - 100, 0, "suave"], [l.t0 + 150, -4, "suave"], [l.t0 + 700, 0, "suave"]); if (l.pregunta) cejas.push([l.t1 - 300, 0, "suave"], [l.t1 - 50, -5, "suave"], [l.t1 + 400, 0, "suave"]); }
    if (P.id === "ana") { const l = LINEAS[3]; cejas.push([l.t0 + 900, 0, "suave"], [l.t0 + 1200, -3, "suave"], [l.t1 + 600, -1, "suave"]); }
    cejas.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < cejas.length; i++) if (cejas[i][0] <= cejas[i - 1][0]) cejas[i][0] = cejas[i - 1][0] + 1;
    // cabeza: hacia el otro un poco; asiente al escuchar; acompana al hablar
    const rot = [[0, 2 * s, "suave"]], cy = [[0, 0, "suave"]];
    for (const l of yo) for (let t = l.t0; t < l.t1; t += 520) rot.push([t, r1(2 * s + 2.5 * Math.sin(t / 300)), "suave"]);
    for (const l of otro) { const m = (l.t0 + l.t1) / 2; rot.push([l.t0, 4 * s, "suave"]); cy.push([m - 250, 0, "suave"], [m, 4, "suave"], [m + 250, 0, "suave"], [m + 500, 3, "suave"], [m + 750, 0, "suave"]); }
    rot.push([SONRISA, 5 * s, "suave"], [DUR, 3 * s, "suave"]);
    rot.sort((a, b) => a[0] - b[0]); cy.sort((a, b) => a[0] - b[0]);
    const unico = (k) => k.filter((x, i) => i === 0 || x[0] > k[i - 1][0]);
    // mano de gesto (del lado del otro) -- objetivo del IK
    const reposo = [s * 26, -44], gx = [[0, reposo[0]]], gy = [[0, reposo[1]]];
    for (const l of yo) {
        gx.push([l.t0 + 100, reposo[0]], [l.t0 + 450, s * 58, "suave"]); gy.push([l.t0 + 100, reposo[1]], [l.t0 + 450, -132, "suave"]);
        for (let t = l.t0 + 800, i = 0; t < l.t1 - 300; t += 420, i++) { gx.push([t, r1(s * (58 + 8 * Math.sin(i * 1.7))), "suave"]); gy.push([t, r1(-132 + 10 * Math.cos(i * 1.3)), "suave"]); }
        gx.push([l.t1 + 400, reposo[0], "suave"]); gy.push([l.t1 + 400, reposo[1], "suave"]);
    }
    // otra mano: en el regazo; Bruno la usa para la taza (sorbo mientras escucha la linea 3)
    const otraRep = [-s * 24, -46], ox = [[0, otraRep[0]]], oy = [[0, otraRep[1]]];
    const sorbo = P.taza ? LINEAS[2] : null;
    if (sorbo) {
        const a = sorbo.t0 + 300, b = a + 900, c = b + 900, d = c + 700;
        ox.push([a, otraRep[0]], [b, r1(dx - s * 2), "suave"], [c, r1(dx - s * 2)], [d, otraRep[0], "suave"]);
        oy.push([a, otraRep[1]], [b, -176, "suave"], [c, -176], [d, otraRep[1], "suave"]);
        rot.push([b - 200, r1(-3 * s), "suave"], [c, r1(-3 * s)], [d, 2 * s, "suave"]);
        rot.sort((x, y) => x[0] - y[0]);
    }
    const brazo = (lado, objetivo, capa, codo_abajo) => {
        const sx = lado;
        return {nombre: `brazo_${lado > 0 ? "d" : "i"}`, capa, poligono: [[sx * 46, -148], [sx * 62, -146], [sx * 66, -94], [sx * 54, -92]], color: P.ropa, pivote: [sx * 54, -140],
            ik: {hasta: `antebrazo_${lado > 0 ? "d" : "i"}`, punta: [sx * 56, -42], objetivo, doblez: (lado > 0 ? 1 : -1) * (codo_abajo ? -1 : 1)},
            partes: [{nombre: `antebrazo_${lado > 0 ? "d" : "i"}`, poligono: [[sx * 53, -96], [sx * 66, -94], [sx * 61, -44], [sx * 51, -44]], color: P.ropaOsc, pivote: [sx * 60, -92],
                partes: [{nombre: `mano_${lado > 0 ? "d" : "i"}`, en: [sx * 56, -38], circulo: {r: 7, lados: 12}, degradado: radial([-2, -2], 9, [[0, P.piel], [1, P.pielOsc]])}]}]};
    };
    const ojo = (lado) => {
        const cx = dx + lado * 15, cyo = -212;
        const n = lado > 0 ? "d" : "i";
        return [
            {nombre: `blanco_${n}`, poligono: ovalo(8, 4.6, 12, cx, cyo), color: "#f6f1ea"},
            {nombre: `iris_${n}`, en: [cx + 2.2 * s, cyo], circulo: {r: 3.6, lados: 12}, degradado: radial([0, 1], 4, [[0, P.irisLuz], [1, P.iris]]),
                ...(P.taza ? {claves: {y: [[0, 0], [(sorbo.t0 + 1100), 0], [(sorbo.t0 + 1300), 1.6, "suave"], [(sorbo.t0 + 2000), 1.6], [(sorbo.t0 + 2300), 0, "suave"]].map(([t, v, i]) => [t, cyo + v, i || "lineal"])}} : {})},
            {nombre: `pupila_${n}`, en: [cx + 2.2 * s, cyo], circulo: {r: 1.8, lados: 8}, color: "#140f0f",
                ...(P.taza ? {claves: {y: [[0, cyo], [sorbo.t0 + 1100, cyo], [sorbo.t0 + 1300, cyo + 1.6, "suave"], [sorbo.t0 + 2000, cyo + 1.6], [sorbo.t0 + 2300, cyo, "suave"]]}} : {})},
            {nombre: `brillo_${n}`, en: [cx + 3 * s + 1, cyo - 1.5], circulo: {r: 1, lados: 6}, color: "#ffffff"},
            {nombre: `parpado_${n}`, pivote: [cx, cyo - 6], claves: {escala_y: parp}, partes: [
                {nombre: `piel_parpado_${n}`, rect: [cx - 10, cyo - 6, cx + 10, cyo + 6], color: P.piel},
                {nombre: `pestanas_${n}`, poligono: [[cx - 9, cyo + 4], [cx + 9, cyo + 4], [cx + 10, cyo + 6], [cx - 9, cyo + 6]], color: "#1d120d"}]},
        ];
    };
    const cara = ovalo(37, 47, 22, dx, -207);
    const pelo = P.pelo(dx);
    return {tipo: "asset", nombre: P.nombre, duracion: DUR, marcas, partes: [
        ...pelo.atras,
        {nombre: "torso", poligono: [[-48, 0], [-50, -110], [-62, -142], [-30, -152], [30, -152], [62, -142], [50, -110], [48, 0]],
            degradado: lineal([-60, 0], [60, 0], s > 0 ? [[0, P.ropaOsc], [1, P.ropa]] : [[0, P.ropa], [1, P.ropaOsc]]), borde: P.ropaOsc},
        {nombre: "cuello", rect: [dx - 9, -168, dx + 9, -146], color: P.pielOsc},
        ...(P.cuello ? [P.cuello(dx)] : []),
        {nombre: "cabeza", pivote: [0, -160], claves: {rotacion: unico(rot), y: unico(cy)}, partes: [
            ...pelo.nuca,
            {nombre: "oreja_i", en: [dx - 37, -207], elipse: [6, 10], color: P.pielOsc},
            {nombre: "oreja_d", en: [dx + 37, -207], elipse: [6, 10], color: P.pielOsc},
            {nombre: "cara", poligono: cara, degradado: radial([dx - 10 * s, -222], 62, [[0, P.pielLuz], [0.6, P.piel], [1, P.pielOsc]])},
            {nombre: "sombra_cara", poligono: ovalo(30, 44, 16, dx - 14 * s, -205), color: P.pielOsc, opacidad: 0.25, desenfoque: 8, mezcla: "multiplicar"},
            ...["i", "d"].map((n, j) => ({nombre: `rubor_${n}`, en: [dx + (j ? 1 : -1) * 22, -194], circulo: {r: 10, lados: 16},
                degradado: radial([0, 0], 10, [[0, rgba(P.rubor, 0.3)], [1, rgba(P.rubor, 0)]]),
                colores: {rojo: {degradado: radial([0, 0], 10, [[0, rgba("#e8504a", P.id === "ana" ? 0.75 : 0.35)], [1, rgba("#e8504a", 0)]])}},
                claves: {forma: [[0, ""], [LINEAS[3].t0 + 1300, ""], [LINEAS[3].t1 + 200, "rojo", "suave"]]}})),
            {nombre: "nariz", poligono: [[dx + 1 * s, -214], [dx + 5 * s, -194], [dx - 1 * s, -191], [dx - 4 * s, -194]], color: P.pielOsc, opacidad: 0.55},
            ...ojo(-1), ...ojo(1),
            {nombre: "cejas", claves: {y: cejas}, partes: [-1, 1].map((l) => ({nombre: `ceja_${l > 0 ? "d" : "i"}`, poligono: [[dx + l * 7, -224], [dx + l * 15, -227], [dx + l * 23, -224], [dx + l * 22, -222], [dx + l * 15, -225], [dx + l * 7, -222]], color: P.ceja}))},
            ...(P.extraCara ? P.extraCara(dx) : []),
            boca(`${P.id}_`, dx, -184, 0.42, clavesForma(cambios), P.labios),
            ...pelo.frente,
        ]},
        brazo(-s, "obj_otra", 3),
        brazo(s, "obj_gesto", 4, true),
        ...(P.taza ? [{nombre: "taza", claves: {x: ox.map(([t, v, i]) => [t, r1(v + s * 3), i]), y: oy.map(([t, v, i]) => [t, r1(v + 4), i])}, capa: 5, partes: [
            {nombre: "taza_cuerpo", poligono: [[-8, -10], [8, -10], [6, 6], [-6, 6]], degradado: lineal([-8, 0], [8, 0], [[0, "#f4f0e8"], [1, "#c8c0b4"]])},
            {nombre: "asa", poligono: [[8, -6], [13, -5], [13, 2], [7, 3], [7, 0], [10, -1], [10, -3], [8, -3]], color: "#d8d0c4"},
            {nombre: "vapor", en: [0, -14], circulo: {r: 6, lados: 12}, degradado: radial([0, 0], 6, [[0, rgba("#ffffff", 0.35)], [1, rgba("#ffffff", 0)]]),
                claves: {y: [[0, -14], [1200, -26]], opacidad: [[0, 0.8], [1200, 0]]}, bucle: "repetir"}]}] : []),
        {nombre: "obj_gesto", partes: [], claves: {x: unico(gx), y: unico(gy)}},
        {nombre: "obj_otra", partes: [], claves: {x: unico(ox), y: unico(oy)}},
    ]};
}

// ---------------- Ana: melena corta, mechones y aretes con inercia
const ANA = {id: "ana", nombre: "Ana (conversación)", mira: 1, piel: "#e9b996", pielOsc: "#c58c6a", pielLuz: "#f6d4b8", rubor: "#e88a7a",
    ropa: "#c0504a", ropaOsc: "#8a3430", iris: "#3a5a8a", irisLuz: "#7a9ac8", ceja: "#3a2216", labios: {sup: "#a8424a", inf: "#c05a5e"},
    pelo: (dx) => ({
        atras: [{nombre: "melena", poligono: [[-46, -248], [-20, -264], [20, -264], [46, -248], [54, -200], [52, -158], [36, -150], [-36, -150], [-52, -158], [-54, -200]].map(([x, y]) => [x + dx, y]),
            degradado: lineal([0, -264], [0, -150], [[0, "#5a3420"], [1, "#2a160c"]])}],
        nuca: [],
        frente: [
            {nombre: "flequillo", poligono: [[-40, -232], [-30, -254], [0, -262], [30, -254], [42, -226], [30, -238], [10, -232], [-8, -240], [-24, -230]].map(([x, y]) => [x + dx, y]),
                degradado: lineal([0, -262], [0, -228], [[0, "#7a4a2c"], [1, "#4a2a18"]])},
            ...[-1, 1].map((l) => ({nombre: `mechon_${l > 0 ? "d" : "i"}`, poligono: [[l * 36, -232], [l * 44, -230], [l * 46, -186], [l * 40, -172], [l * 34, -190]].map(([x, y]) => [x + dx, y]),
                color: "#4a2a18", pivote: [dx + l * 40, -232], inercia: {rigidez: 2.2, amortiguacion: 0.3, limite: 25}})),
            ...[-1, 1].map((l) => ({nombre: `arete_${l > 0 ? "d" : "i"}`, pivote: [dx + l * 38, -198], inercia: {rigidez: 1.8, amortiguacion: 0.15, limite: 35}, partes: [
                {nombre: `arete_aro_${l > 0 ? "d" : "i"}`, en: [dx + l * 38, -196], circulo: {r: 2, lados: 8}, color: "#e0bb62"},
                {nombre: `arete_gota_${l > 0 ? "d" : "i"}`, en: [dx + l * 38, -189], elipse: [2.4, 4], color: "#e0bb62"}]})),
        ],
    }),
};
// ---------------- Bruno: pelo corto, barba, anteojos y la taza
const BRUNO = {id: "bruno", nombre: "Bruno (conversación)", mira: -1, taza: true, piel: "#d8a07a", pielOsc: "#a87050", pielLuz: "#ecc09c", rubor: "#d87a6a",
    ropa: "#3a6a8a", ropaOsc: "#264a62", iris: "#4a3420", irisLuz: "#8a6a4a", ceja: "#2a1a10", labios: {sup: "#8a4a44", inf: "#a05a52"},
    pelo: (dx) => ({
        atras: [],
        nuca: [{nombre: "pelo", poligono: [[-40, -222], [-36, -248], [-14, -260], [14, -260], [36, -248], [40, -222], [34, -236], [12, -244], [-12, -244], [-34, -236]].map(([x, y]) => [x + dx, y]), color: "#2a1a10"}],
        frente: [],
    }),
    extraCara: (dx) => [
        {nombre: "barba", poligono: [[-34, -200], [-28, -176], [-14, -164], [0, -160], [14, -164], [28, -176], [34, -200], [24, -186], [10, -178], [-10, -178], [-24, -186]].map(([x, y]) => [x + dx, y]),
            degradado: lineal([0, -200], [0, -160], [[0, "#4a3020"], [1, "#2a1a10"]])},
        {nombre: "bigote", poligono: [[-12, -190], [0, -193], [12, -190], [10, -187], [0, -189], [-10, -187]].map(([x, y]) => [x + dx, y]), color: "#2a1a10"},
        ...[-1, 1].map((l) => ({nombre: `lente_${l > 0 ? "d" : "i"}`, en: [dx + l * 15, -212], partes: [
            {nombre: `aro_${l > 0 ? "d" : "i"}_a`, poligono: [...ovalo(11, 8, 14), ...ovalo(9.5, 6.5, 14).reverse()], color: "#1a1a1a"},
            {nombre: `vidrio_${l > 0 ? "d" : "i"}`, poligono: ovalo(9.5, 6.5, 14), color: "#bfe3ff", opacidad: 0.12, mezcla: "pantalla"}]})),
        {nombre: "puente", rect: [dx - 4, -214, dx + 4, -212], color: "#1a1a1a"},
    ],
};

// ------------------------------------------------------------------ escena
const ASSETS = [persona(ANA), persona(BRUNO)];
const PISO = 615, ESC = 1.7, XA = 470, XB = 810;
const caraX = (x, s) => x + 6 * s * ESC, caraY = PISO - 207 * ESC;
const plano = {
    general: {x: 640, y: 380, zoom: 1},
    ana: {x: caraX(XA, 1) - 10, y: caraY + 40, zoom: 2.6},
    bruno: {x: caraX(XB, -1) + 10, y: caraY + 40, zoom: 2.6},
    dos: {x: 640, y: caraY + 60, zoom: 1.55},
};
const cortes = [[0, "general"], [LINEAS[0].t0 - 250, "ana"], [LINEAS[1].t0 - 250, "bruno"], [LINEAS[2].t0 - 250, "dos"], [LINEAS[3].t0 - 250, "bruno"], [LINEAS[3].t1 + 150, "ana"], [SONRISA + 1300, "general"]];
const cam = {x: [], y: [], zoom: []};
for (const [t, p] of cortes) for (const k of ["x", "y", "zoom"]) cam[k].push([t, r1(plano[p][k]), "mantener"]);
const escena = {
    tipo: "escena", precision: "decimal", nombre: "Conversación en el banco", duracion: DUR, profundidad: true, sonido: "lleva", marcas: {EventoGeneral: "no_lleva"},
    sonidos: [
        {sonido: "Voz de Ana", t: 0, volumen: 1, pan: -0.25},
        {sonido: "Voz de Bruno", t: 0, volumen: 1, pan: 0.25},
        {sonido: "Parque al atardecer", t: 0, volumen: 0.3, bucle: true, fundido: {entrada: 800, salida: 1200}},
    ],
    camara: {centro: [640, 380], claves: cam},
    objetos: [
        {nombre: "cielo", en: [0, 0], plano: -4, rect: [-100, -100, 1400, 520], degradado: lineal([0, -100], [0, 520], [[0, "#3a3270"], [0.55, "#e0705a"], [1, "#ffc46a"]])},
        {nombre: "sol", en: [1010, 400], plano: -4, circulo: {r: 220, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 220, [[0, rgba("#fff0b0", 0.9)], [0.12, rgba("#ffd080", 0.6)], [1, rgba("#ff9a4a", 0)]])},
        {nombre: "arboles", en: [0, 0], plano: -3, poligono: [[-100, 520], [-100, 380], [-40, 330], [40, 350], [100, 300], [180, 340], [260, 310], [330, 360], [420, 330], [480, 380], [900, 380], [960, 320], [1040, 300], [1120, 340], [1200, 310], [1280, 350], [1400, 330], [1400, 520]],
            degradado: lineal([0, 300], [0, 520], [[0, "#3a2a40"], [1, "#2a1e30"]])},
        {nombre: "pasto", en: [0, 0], plano: -3, rect: [-100, 500, 1400, 820], degradado: lineal([0, 500], [0, 820], [[0, "#6a5a3a"], [1, "#2a2418"]])},
        {nombre: "respaldo", en: [0, 0], plano: -2, partes: [
            {nombre: "tabla_1", rect: [300, PISO - 190, 980, PISO - 172], degradado: lineal([0, PISO - 190], [0, PISO - 172], [[0, "#9a6a3e"], [1, "#5a3a20"]])},
            {nombre: "tabla_2", rect: [300, PISO - 150, 980, PISO - 132], degradado: lineal([0, PISO - 150], [0, PISO - 132], [[0, "#9a6a3e"], [1, "#5a3a20"]])},
            {nombre: "pata_i", rect: [320, PISO - 196, 334, PISO + 40], color: "#2a2a30"},
            {nombre: "pata_d", rect: [946, PISO - 196, 960, PISO + 40], color: "#2a2a30"}]},
        {instancia: "Ana (conversación)", nombre: "ana", en: [XA, PISO], escala: ESC, bucle: false},
        {instancia: "Bruno (conversación)", nombre: "bruno", en: [XB, PISO], escala: ESC, bucle: false},
        {nombre: "seto", en: [0, 0], plano: 2, poligono: [[-100, 820], [-100, 545], ...Array.from({length: 30}, (_, i) => [r1(-100 + i * 52), r1(540 + 14 * Math.sin(i * 1.9) + 8 * Math.cos(i * 3.1))]), [1400, 545], [1400, 820]],
            degradado: lineal([0, 520], [0, 720], [[0, "#3a5a2a"], [1, "#142010"]])},
        {nombre: "luz_borde", en: [0, 0], plano: 3, rect: [-100, -100, 1400, 820], mezcla: "pantalla", degradado: lineal([1280, 0], [500, 0], [[0, rgba("#ff9a4a", 0.18)], [1, rgba("#ff9a4a", 0)]])},
    ],
};
ASSETS.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a, null, 1)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
for (const id of ["ana", "bruno"]) {
    const ls = LINEAS.filter((l) => l.quien === id);
    fs.writeFileSync(path.join(DIR, `voz_${id}.json`), JSON.stringify({dur: DUR, lineas: ls.map((l) => ({t0: l.t0, t1: l.t1, pregunta: l.pregunta})), eventos: ls.flatMap((l) => l.voz)}));
}
process.stdout.write(`assets: ${ASSETS.length}, duracion ${DUR} ms, lineas: ${LINEAS.map((l) => `${l.quien} ${l.t0}-${l.t1}`).join(" | ")}\n`);
