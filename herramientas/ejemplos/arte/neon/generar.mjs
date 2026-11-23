// Pruebas de arte (planeacion_pruebas_arte.md), fase 3: NEON / SYNTHWAVE.
// Escena original: "Carretera a medianoche". Un auto retro (visto de atras) corre por una autopista
// infinita hacia un sol a franjas: grilla en perspectiva que avanza, montanas con aristas de neon,
// palmeras y carteles que pasan, ciudad lejana; al final un relampago y el titulo. El estilo de la
// escena (estilo.resplandor, Estilo.js) hace brillar todo lo luminoso.
// La camara es fija: el mundo esta en coordenadas de pantalla (1280x720), horizonte en y = 400.
//   asset_01 Cielo synthwave, 02 Sol a franjas, 03 Montañas de neón, 04 Ciudad de neón, 05 Grilla,
//   06 Carretera, 07 Palmera, 08 Cartel de neón, 09 Auto retro, 10 Relámpago;  escena.json (15 s)
//   node herramientas/ejemplos/arte/neon/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, ciclo} from "../comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(5);
const C = {negro: "#07000f", violeta: "#1a0638", purpura: "#3c0a5e", magenta: "#ff2fa8", rosa: "#ff6ad5", cian: "#29f0ff", amarillo: "#ffe45a", naranja: "#ff8a3c", rojo: "#ff2040"};
// perspectiva del piso: profundidad z (1 = abajo de la pantalla) -> y en pantalla; X lateral en "carriles"
const HOR = 400, K = 330, CX = 640;
const yDe = (z) => HOR + K / z;
const xDe = (X, z) => CX + X * K / z;
// banda delgada (linea de neon) entre dos puntos, de grosor g
function banda(p, q, g) {
    const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * g / 2, ny = dx / l * g / 2;
    return [[r2(p[0] + nx), r2(p[1] + ny)], [r2(q[0] + nx), r2(q[1] + ny)], [r2(q[0] - nx), r2(q[1] - ny)], [r2(p[0] - nx), r2(p[1] - ny)]];
}
// polilinea gruesa como varias bandas
const trazo = (nombre, pts, g, color, capa = 3, extra = {}) => pts.slice(1).map((q, i) => ({nombre: `${nombre}_${i}`, capa, poligono: banda(pts[i], q, g), color, borde: TRANSP, ...extra}));

// ------------------------------------------------------------------ CIELO (pantalla completa, origen 0,0 arriba a la izquierda)
function cieloS() {
    const partes = [{nombre: "fondo", capa: 0, rect: [-100, -100, 1380, 820], degradado: lineal([0, 0], [0, HOR], [[0, C.negro], [0.55, C.violeta], [0.85, C.purpura], [1, "#8a1a6a"]])}];
    for (let i = 0; i < 90; i++) {
        const x = azar() * 1280, y = azar() * 300, s = 1 + azar() * 1.8;
        partes.push({nombre: `estrella_${i}`, capa: 1, en: [r2(x), r2(y)], circulo: {r: s, lados: 6}, color: i % 5 ? "#ffffff" : C.cian,
            claves: {opacidad: ciclo(2400, (u) => 0.5 + 0.5 * Math.sin(TAU * u + i * 1.7))}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Cielo synthwave", duracion: 2400, marcas, partes};
}

// ------------------------------------------------------------------ SOL A FRANJAS (centro en 0,0; radio 210; franjas que bajan)
function sol() {
    const R = 210, DUR = 4000, partes = [];
    partes.push({nombre: "halo", capa: 0, circulo: {r: 380, lados: 48}, mezcla: "suma", degradado: radial([0, 0], 380, [[0, "rgba(255,90,170,0.45)"], [1, "rgba(255,90,170,0)"]]), borde: TRANSP});
    // tajadas horizontales del circulo; los huecos crecen hacia abajo. Cada tajada se mueve hacia abajo y
    // se angosta (claves), en bucle: las franjas "caen" despacio dentro del sol.
    const deg = lineal([0, -R], [0, R], [[0, C.amarillo], [0.45, C.naranja], [1, C.magenta]]);
    const cuerda = (y0, y1) => {
        const pts = [], n = Math.max(4, Math.round(Math.abs(y1 - y0) / 4));
        for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push([r2(Math.sqrt(Math.max(0, R * R - y * y))), r2(y)]); }
        for (let i = n; i >= 0; i--) { const y = y0 + (y1 - y0) * i / n; pts.push([r2(-Math.sqrt(Math.max(0, R * R - y * y))), r2(y)]); }
        return pts;
    };
    partes.push({nombre: "casquete", capa: 1, poligono: cuerda(-R, 10), degradado: deg});
    for (let k = 0; k < 7; k++) {
        const y0 = 10 + k * 30, hueco = 5 + k * 3.5;
        if (y0 + hueco >= R) break;
        partes.push({nombre: `franja_${k}`, capa: 1, poligono: cuerda(Math.min(R - 1, y0 + hueco), Math.min(R, y0 + 30)), degradado: deg});
    }
    return {tipo: "asset", nombre: "Sol a franjas", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ MONTANAS (pies en el horizonte, y = 0; de x -700 a 700)
function montanas() {
    const partes = [];
    const capa = (nombre, picos, altoMax, fill, linea, c) => {
        const pts = [[-700, 0]];
        picos.forEach(([x, h]) => pts.push([x, -h * altoMax]));
        pts.push([700, 0]);
        partes.push({nombre: `${nombre}_masa`, capa: c, poligono: pts, degradado: lineal([0, -altoMax], [0, 0], [[0, fill[0]], [1, fill[1]]])});
        partes.push(...trazo(`${nombre}_arista`, pts, 3, linea, c + 1));
        // aristas internas de "alambre": de cada pico al pie
        picos.forEach(([x, h], i) => { if (i % 2 === 0) partes.push(...trazo(`${nombre}_alambre_${i}`, [[x, -h * altoMax], [x + (i % 4 ? 60 : -60), 0]], 1.6, linea, c + 1, {opacidad: 0.6})); });
    };
    capa("lejos", [[-620, 0.3], [-520, 0.7], [-430, 0.45], [-330, 0.9], [-220, 0.5], [-120, 0.2], [120, 0.25], [230, 0.6], [340, 0.95], [450, 0.5], [540, 0.75], [640, 0.3]], 170, ["#2a0a50", "#120024"], C.cian, 0);
    capa("cerca", [[-690, 0.5], [-600, 0.85], [-500, 0.4], [-430, 0.2], [430, 0.25], [510, 0.6], [600, 0.95], [690, 0.4]], 120, ["#3a0a46", "#14001e"], C.magenta, 2);
    return {tipo: "asset", nombre: "Montañas de neón", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ CIUDAD DE NEON (pies en el horizonte; chiquita, lejana)
function ciudadNeon() {
    const partes = [];
    let x = -170, k = 0;
    while (x < 170) {
        const w = 14 + azar() * 22, h = 30 + azar() * 70;
        partes.push({nombre: `torre_${k}`, capa: 0, rect: [r2(x), r2(-h), r2(x + w), 0], color: "#16052a"});
        partes.push({nombre: `borde_${k}`, capa: 1, rect: [r2(x), r2(-h), r2(x + w), r2(-h + 2)], color: k % 2 ? C.cian : C.rosa});
        for (let j = 0; j < 3; j++) partes.push({nombre: `luz_${k}_${j}`, capa: 1, en: [r2(x + 3 + azar() * (w - 6)), r2(-h + 8 + azar() * (h - 14))], rect: [0, 0, 2.5, 2.5], color: C.amarillo,
            claves: {opacidad: ciclo(3000, (u) => (Math.sin(TAU * u * (1 + j) + k) > -0.3 ? 1 : 0.1), 12, "mantener")}, bucle: "repetir"});
        x += w + 3; k++;
    }
    return {tipo: "asset", nombre: "Ciudad de neón", duracion: 3000, marcas, partes};
}

// ------------------------------------------------------------------ GRILLA (piso en perspectiva; avanza en bucle)
const VEL = 7, DZ = 2, NL = 15, CICLO = Math.round(DZ * 1000 / VEL) * 1;   // una linea avanza DZ en CICLO ms (y el patron se repite)
function grilla() {
    const partes = [{nombre: "piso", capa: 0, rect: [-100, HOR, 1380, 820], degradado: lineal([0, HOR], [0, 720], [[0, "#2a0640"], [0.15, "#0d0018"], [1, C.negro]])}];
    // lineas que convergen al punto de fuga
    for (let X = -14; X <= 14; X++) {
        partes.push({nombre: `fuga_${X + 14}`, capa: 1, poligono: [[r2(xDe(X - 0.04, 0.8)), r2(yDe(0.8))], [r2(xDe(X + 0.04, 0.8)), r2(yDe(0.8))], [r2(xDe(X, 60)), r2(yDe(60))]], color: C.magenta, borde: TRANSP});
    }
    // lineas horizontales: cada una avanza de z = 1 + NL*DZ a z = 1 en NL*CICLO ms y vuelve atras
    const LARGO = NL * CICLO;
    for (let k = 0; k < NL; k++) {
        const y = [], e = [], o = [];
        for (let t = 0; t <= LARGO; t += 50) {
            const z = 0.9 + ((k * DZ - (t / 1000) * VEL) % (NL * DZ) + NL * DZ) % (NL * DZ);
            y.push([t, r2(yDe(z)), "lineal"]); e.push([t, r2(Math.max(0.25, 2.2 / z)), "lineal"]); o.push([t, r2(Math.min(1, (NL * DZ - z) / 6)), "lineal"]);
        }
        partes.push({nombre: `horizontal_${k}`, capa: 2, rect: [-100, -2, 1380, 2], color: C.magenta, borde: TRANSP, claves: {y, escala_y: e, opacidad: o}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Grilla", duracion: LARGO, marcas, partes};
}

// ------------------------------------------------------------------ CARRETERA (asfalto, bordes de neon y lineas del centro que avanzan)
function carretera() {
    const A = 1.25, partes = [
        {nombre: "asfalto", capa: 0, poligono: [[r2(xDe(-A, 0.8)), r2(yDe(0.8))], [r2(xDe(A, 0.8)), r2(yDe(0.8))], [r2(xDe(A, 80)), r2(yDe(80))], [r2(xDe(-A, 80)), r2(yDe(80))]],
            degradado: lineal([0, HOR], [0, 720], [[0, "#1a0630"], [1, "#05000c"]])},
        ...[-A, A].map((X, i) => ({nombre: `borde_${i}`, capa: 1, poligono: [[r2(xDe(X - 0.05, 0.8)), r2(yDe(0.8))], [r2(xDe(X + 0.05, 0.8)), r2(yDe(0.8))], [r2(xDe(X, 80)), r2(yDe(80))]], color: C.cian, borde: TRANSP})),
    ];
    // trazos del centro: avanzan como las lineas de la grilla (mismo ritmo); cada trazo se dibuja a z=1 y se escala
    const N = 8, ESP = 4, LARGO = Math.round(N * ESP * 1000 / VEL);
    for (let k = 0; k < N; k++) {
        const y = [], s = [], o = [];
        for (let t = 0; t <= LARGO; t += 50) {
            const z = 0.9 + ((k * ESP - (t / 1000) * VEL) % (N * ESP) + N * ESP) % (N * ESP);
            y.push([t, r2(yDe(z + 0.6)), "lineal"]); s.push([t, r2(1 / z), "lineal"]); o.push([t, r2(Math.min(1, (N * ESP - z) / 8)), "lineal"]);
        }
        partes.push({nombre: `trazo_${k}`, capa: 2, en: [CX, 0], rect: [-7, -60, 7, 60], color: C.amarillo, borde: TRANSP, claves: {y, escala_x: s, escala_y: s, opacidad: o}, bucle: "repetir"});
    }
    return {tipo: "asset", nombre: "Carretera", duracion: LARGO, marcas, partes};
}

// ------------------------------------------------------------------ PALMERA (silueta negra con borde rosa; pies en 0,0; alta ~420)
function palmera() {
    const DUR = 2000, partes = [];
    const tronco = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; tronco.push([r2(-9 + 40 * u * u), r2(-u * 380)]); }
    for (let i = 12; i >= 0; i--) { const u = i / 12; tronco.push([r2(9 + 40 * u * u - 4 * u), r2(-u * 380)]); }
    partes.push({nombre: "tronco", capa: 0, poligono: tronco, color: "#05000a"});
    partes.push(...trazo("brillo_tronco", tronco.slice(13), 2.5, C.rosa, 1));
    // hojas: arcos que cuelgan, se mecen
    const hojas = [];
    for (let k = 0; k < 7; k++) {
        const a = -150 + k * 50, L = 150 + (k % 2) * 40, pts = [];
        for (let i = 0; i <= 8; i++) { const u = i / 8, ang = (a + 70 * u * u * (a < 0 ? -1 : 1)) * Math.PI / 180; pts.push([r2(Math.cos(ang) * L * u), r2(Math.sin(ang) * L * u * 0.8 + 50 * u * u)]); }
        const ancho = (u) => 14 * Math.sin(Math.PI * u);
        const sup = pts.map(([x, y], i) => [x, r2(y - ancho(i / 8))]), inf = pts.map(([x, y], i) => [x, r2(y + ancho(i / 8))]).reverse();
        hojas.push({nombre: `hoja_${k}`, poligono: [...sup, ...inf], color: "#05000a", borde: C.rosa});
    }
    partes.push({nombre: "copa", capa: 2, en: [36, -380], pivote: [0, 0], partes: hojas, claves: {rotacion: ciclo(DUR, (u) => 3 * Math.sin(TAU * u))}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Palmera", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ CARTEL DE NEON (poste y cartel con tubos que parpadean; pies en 0,0)
function cartel() {
    const DUR = 3000, tubo = (nombre, pts, color, extra = {}) => trazo(nombre, pts, 6, color, 3, extra);
    const parpadeo = {claves: {opacidad: [[0, 1, "mantener"], [900, 0.2, "mantener"], [980, 1, "mantener"], [1060, 0.3, "mantener"], [1140, 1, "mantener"], [DUR, 1]]}, bucle: "repetir"};
    const corazon = ovalo(0, 0, 1, 1, 24).map(([x, y], i) => { const t = i / 24 * TAU; return [r2(150 + 16 * Math.sin(t) ** 3 * 3.2), r2(-235 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 3.2)]; });
    return {tipo: "asset", nombre: "Cartel de neón", duracion: DUR, marcas, partes: [
        {nombre: "poste", capa: 0, rect: [-6, -170, 6, 0], color: "#14061f"},
        {nombre: "tablero", capa: 1, rect: [-20, -320, 260, -160], color: "#0c0016"},
        ...tubo("marco", [[-12, -312], [252, -312], [252, -168], [-12, -168], [-12, -312]], C.cian),
        ...tubo("flecha", [[20, -240], [110, -240], [90, -262], [110, -240], [90, -218]], C.amarillo),
        {nombre: "corazon", capa: 3, partes: trazo("corazon_t", [...corazon, corazon[0]], 6, C.magenta), ...parpadeo},
    ]};
}

// ------------------------------------------------------------------ AUTO RETRO (visto de atras; pies en 0,0; ancho ~300)
function auto() {
    const DUR = 1200, partes = [
        {nombre: "sombra", capa: 0, poligono: ovalo(0, 0, 170, 18, 20), color: "rgba(0,0,0,0.7)", borde: TRANSP},
        {nombre: "carro", capa: 1, pivote: [0, -10], partes: [
            {nombre: "rueda_1", rect: [-140, -40, -96, 4], color: "#050008"},
            {nombre: "rueda_2", rect: [96, -40, 140, 4], color: "#050008"},
            {nombre: "chasis", poligono: [[-150, -30], [-156, -78], [-120, -100], [120, -100], [156, -78], [150, -30], [110, -18], [-110, -18]],
                degradado: lineal([0, -100], [0, -18], [[0, "#3a0f5a"], [1, "#12021e"]])},
            {nombre: "cabina", poligono: [[-100, -100], [-74, -150], [74, -150], [100, -100]], degradado: lineal([0, -150], [0, -100], [[0, "#2a0a40"], [1, "#16052a"]])},
            {nombre: "luneta", poligono: [[-86, -104], [-66, -142], [66, -142], [86, -104]], degradado: lineal([-86, 0], [86, 0], [[0, "#0a2a4a"], [0.5, "#1a6a9a"], [1, "#0a2a4a"]])},
            {nombre: "reflejo", poligono: [[-40, -108], [-20, -140], [-6, -140], [-26, -108]], color: "rgba(140,240,255,0.5)", borde: TRANSP},
            ...trazo("filo", [[-156, -78], [-120, -100], [120, -100], [156, -78]], 3, C.magenta, 2),
            ...trazo("filo_techo", [[-74, -150], [74, -150]], 2.5, C.cian, 2),
            {nombre: "faro_1", rect: [-146, -74, -86, -58], color: C.rojo},
            {nombre: "faro_2", rect: [86, -74, 146, -58], color: C.rojo},
            {nombre: "barra", rect: [-80, -70, 80, -64], color: "#ff5060"},
            {nombre: "patente", rect: [-34, -52, 34, -32], color: "#d8d0ff"},
            {nombre: "patente_linea", rect: [-24, -44, 24, -40], color: "#2a1040"},
            {nombre: "escape", en: [-110, -22], circulo: {r: 6, lados: 10}, color: "#5a5a6a"},
        ]},
    ];
    return {tipo: "asset", nombre: "Auto retro", duracion: DUR, marcas, partes: partes.map((p) => (p.nombre === "carro"
        ? {...p, claves: {y: ciclo(DUR, (u) => -1.5 * Math.abs(Math.sin(TAU * u * 2))), rotacion: ciclo(DUR, (u) => 0.6 * Math.sin(TAU * u))}, bucle: "repetir"} : p))};
}

// ------------------------------------------------------------------ RELAMPAGO (rayo en zigzag + destello de pantalla; una vez)
function relampago() {
    const pts = [[0, 0], [-30, 90], [10, 110], [-40, 220], [0, 240], [-50, 380]];
    return {tipo: "asset", nombre: "Relámpago", duracion: 1600, marcas, partes: [
        {nombre: "destello", capa: 0, rect: [-1400, -400, 1400, 1200], color: "#c8a0ff", mezcla: "suma", borde: TRANSP,
            claves: {opacidad: [[0, 0], [60, 0.55, "lineal"], [160, 0.05, "lineal"], [260, 0.4, "lineal"], [600, 0, "suave"]]}},
        {nombre: "rayo", capa: 1, partes: [...trazo("rayo_t", pts, 7, "#e8f8ff"), ...trazo("rayo_r", [[0, 240], [40, 300], [30, 340]], 4, "#e8f8ff")],
            claves: {opacidad: [[0, 0], [60, 1, "mantener"], [160, 0.2, "mantener"], [260, 1, "mantener"], [700, 0, "suave"]]}},
    ]};
}

// ------------------------------------------------------------------ LA ESCENA (camara fija; 15 s)
function escena() {
    const DUR = 15000, T_RAYO = 11800;
    // algo que se acerca por el costado: de z = 25 a z = 0.7 en `dur` ms, desde t0, repetido cada `cada` ms
    const acercar = (X, t0, dur, cada, escalaBase) => {
        const x = [], y = [], e = [], o = [];
        for (let c = t0; c < DUR; c += cada) {
            for (let t = 0; t < dur; t += 50) {
                const tt = c + t; if (tt > DUR) break;
                const u = t / dur, z = 1 / (1 / 25 + (1 / 0.7 - 1 / 25) * u * u);   // acelera al acercarse
                x.push([tt, r2(xDe(X, z)), "lineal"]); y.push([tt, r2(yDe(z)), "lineal"]); e.push([tt, r2(escalaBase / z), "lineal"]);
                o.push([tt, r2(t === 0 || t >= dur - 50 ? 0 : Math.min(1, u * 6)), "mantener"]);
            }
        }
        return {x, y, escala_x: e, escala_y: e, opacidad: o};
    };
    const objetos = [
        {instancia: "Cielo synthwave", nombre: "cielo", en: [0, 0], plano: -10},
        {instancia: "Sol a franjas", nombre: "sol", en: [CX, HOR - 110], plano: -9, claves: {y: [[0, HOR - 90], [DUR, HOR - 140, "suave"]]}},
        {instancia: "Ciudad de neón", nombre: "ciudad", en: [CX + 260, HOR], plano: -8},
        {instancia: "Montañas de neón", nombre: "montanas", en: [CX, HOR], plano: -7},
        {instancia: "Grilla", nombre: "grilla", en: [0, 0], plano: -6},
        {instancia: "Carretera", nombre: "carretera", en: [0, 0], plano: -5},
        {instancia: "Relámpago", nombre: "relampago", en: [CX - 230, 40], plano: -8, bucle: false, desfase: T_RAYO},
        {instancia: "Auto retro", nombre: "auto", en: [CX, 690], plano: 5, claves: {x: [[0, CX - 20], [4000, CX + 30, "suave"], [8000, CX - 40, "suave"], [12000, CX + 20, "suave"], [DUR, CX, "suave"]]}},
    ];
    // palmeras y carteles que pasan a los costados (siluetas que crecen al acercarse)
    [[-3.2, 0, 2600, 1300], [3.4, 650, 2600, 1300]].forEach(([X, t0, dur, cada], i) => {
        for (let r = 0; r < 2; r++) objetos.push({instancia: "Palmera", nombre: `palmera_${i}_${r}`, en: [xDe(X, 25), yDe(25)], plano: 0, espejo: X > 0,
            claves: acercar(X, t0 + r * cada, dur, cada * 2, 0.9)});
    });
    objetos.push({instancia: "Cartel de neón", nombre: "cartel_1", en: [xDe(4.2, 25), yDe(25)], plano: 1, claves: acercar(4.2, 1800, 3200, 5200, 0.8)});
    objetos.push({instancia: "Cartel de neón", nombre: "cartel_2", en: [xDe(-4.6, 25), yDe(25)], plano: 1, espejo: true, claves: acercar(-4.6, 4400, 3200, 5200, 0.8)});
    return {
        tipo: "escena", nombre: "Carretera a medianoche", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.42, radio: 16, intensidad: 1.4}},
        camara: {tamano: [1280, 720], centro: [CX, 360], zoom: 1, claves: {zoom: [[0, 1], [DUR, 1.06, "suave"]], y: [[0, 360], [DUR, 352, "suave"]]}},
        objetos,
        dialogos: [{texto: "MEDIANOCHE", desde: T_RAYO + 300, hasta: DUR, estilo: "narrador", velocidad: 0}],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

const assets = [cieloS(), sol(), montanas(), ciudadNeon(), grilla(), carretera(), palmera(), cartel(), auto(), relampago()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena(), null, 1));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
