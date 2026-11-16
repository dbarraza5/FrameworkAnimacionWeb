// Fase A5: generadores de assets y recetas, en el formato SIMPLE (ver Compilador.js).
// Antes vivian en scripts sueltos (ciudad.js, escenas9.js). Todos dibujan con los pies
// en y = 0 y centrados en x = 0 (salvo calle: origen arriba a la izquierda).
//
// Uso en un archivo de asset:
//   {"tipo": "asset", "nombre": "Casa verde", "generador": "casa", "parametros": {"pared": "#9fd59a"}}

const rect = (x0, y0, x1, y1) => ({rect: [x0, y0, x1, y1]});
const oscila = (desde, hasta, ms) => ({claves: {rotacion: [[0, desde, "suave"], [ms, hasta]]}, bucle: "ida_vuelta"});

export const GENERADORES = {
    arbol: {
        descripcion: "Árbol: tronco y copa de tres círculos",
        parametros: {tronco: "#7a4a1e", copa: "#47a043", copa_clara: "#55b350", copa_oscura: "#3f8f3a", escala: 1},
        crear: (p) => [{nombre: "arbol", escala: p.escala !== 1 ? p.escala : undefined, partes: [
            {nombre: "tronco", poligono: [[-12, 0], [12, 0], [9, -95], [-9, -95]], color: p.tronco, borde: "#4d2e12"},
            {nombre: "copa_izq", en: [-32, -125], circulo: 46, color: p.copa_oscura, borde: "#2b6328"},
            {nombre: "copa_der", en: [32, -128], circulo: 46, color: p.copa, borde: "#2b6328"},
            {nombre: "copa_alta", en: [0, -170], circulo: 52, color: p.copa_clara, borde: "#2b6328"},
        ]}],
    },
    casa: {
        descripcion: "Casa: pared, techo, puerta, dos ventanas y chimenea",
        parametros: {ancho: 220, alto: 170, pared: "#e8a28f", techo: "#8f2f24", puerta: "#6b3b1f", ventana: "#bfe3f5"},
        crear: (p) => {
            const w = p.ancho / 2, h = p.alto;
            return [{nombre: "casa", partes: [
                {nombre: "chimenea", en: [w * 0.45, -h - 40], ...rect(-14, -40, 14, 40), color: "#8a3b2a", borde: "#4d2018"},
                {nombre: "pared", ...rect(-w, -h, w, 0), color: p.pared, borde: "#3a3a3a"},
                {nombre: "techo", en: [0, -h], poligono: [[-w - 22, 0], [0, -h * 0.55], [w + 22, 0]], color: p.techo, borde: "#3a1d14"},
                {nombre: "puerta", ...rect(-20, -72, 20, 0), color: p.puerta, borde: "#3a2414"},
                {nombre: "pomo", en: [12, -36], circulo: {r: 3, lados: 8}, color: "#f2d16b", borde: "#8a6d1f"},
                {nombre: "ventana_izq", en: [-w * 0.55, -h * 0.55], ...rect(-24, -22, 24, 22), color: p.ventana, borde: "#f4f4f4"},
                {nombre: "ventana_der", en: [w * 0.55, -h * 0.55], ...rect(-24, -22, 24, 22), color: p.ventana, borde: "#f4f4f4"},
            ]}];
        },
    },
    auto: {
        descripcion: "Auto (mira a la derecha) con ruedas que giran (1 vuelta por segundo)",
        parametros: {color: "#d63a3a", borde: "#7a1f1f", vidrio: "#cfe9f7"},
        crear: (p) => {
            const rueda = (nombre, x) => ({nombre, en: [x, -24], circulo: {r: 24, lados: 16}, color: "#222222", borde: "#111111",
                giro: {desde: 0, hasta: 360, ms: 1000}, partes: [
                    {nombre: nombre + "_taza", circulo: {r: 11, lados: 12}, color: "#b8bcc2", borde: "#6b6f75"},
                    {nombre: nombre + "_rayo", ...rect(-2, -20, 2, 20), color: "#8d9196", borde: "#555555"},
                ]});
            return [{nombre: "auto", partes: [
                {nombre: "carroceria", poligono: [[-125, -28], [-120, -72], [-75, -78], [-48, -118], [55, -118], [85, -78], [122, -70], [128, -28]], color: p.color, borde: p.borde},
                {nombre: "ventana_tras", poligono: [[-62, -80], [-42, -110], [0, -110], [0, -80]], color: p.vidrio, borde: "#5b6b75"},
                {nombre: "ventana_del", poligono: [[8, -80], [8, -110], [50, -110], [72, -80]], color: p.vidrio, borde: "#5b6b75"},
                {nombre: "faro", en: [118, -60], ...rect(-6, -6, 8, 6), color: "#fff3b0", borde: "#a08a2a"},
                {nombre: "luz_tras", en: [-121, -60], ...rect(-5, -6, 6, 6), color: "#ff6a3d", borde: "#7a1f1f"},
                rueda("rueda_tras", -72), rueda("rueda_del", 78),
            ]}];
        },
    },
    persona: {
        descripcion: "Persona (mira a la derecha) que camina en el lugar: un paso cada 0,5 s",
        parametros: {ropa: "#2e86de", pantalon: "#2c3e66", piel: "#f1c27d", pelo: "#3b2414", camina: true},
        crear: (p) => {
            const pierna = [[-7, 0], [7, 0], [6, 66], [14, 70], [-7, 70]];
            const brazo = [[-5, 0], [5, 0], [4, 58], [-4, 58]];
            const mov = (a, b) => (p.camina ? oscila(a, b, 500) : {});
            return [{nombre: "persona", partes: [
                {nombre: "brazo_tras", en: [0, -142], poligono: brazo, color: p.piel, borde: "#7a5236", ...mov(22, -22)},
                {nombre: "pierna_tras", en: [0, -70], poligono: pierna, color: p.pantalon, borde: "#1d2a44", ...mov(-25, 25)},
                {nombre: "torso", poligono: [[-15, -150], [15, -150], [17, -68], [-17, -68]], color: p.ropa, borde: "#2b2b2b"},
                {nombre: "pierna_del", en: [0, -70], poligono: pierna, color: p.pantalon, borde: "#1d2a44", ...mov(25, -25)},
                {nombre: "cabeza", en: [2, -170], circulo: 17, color: p.piel, borde: "#7a5236", partes: [
                    {nombre: "pelo", poligono: [[-17, -2], [-14, -14], [-2, -19], [12, -16], [17, -6], [4, -9], [-10, -6]], color: p.pelo, borde: "#1b120c"},
                    {nombre: "ojo", en: [9, -2], circulo: {r: 2, lados: 6}, color: "#111111", borde: "#111111"},
                ]},
                {nombre: "brazo_del", en: [0, -142], poligono: brazo, color: p.piel, borde: "#7a5236", ...mov(-22, 22)},
            ]}];
        },
    },
    farol: {
        descripcion: "Farol de calle",
        parametros: {poste: "#3d4652", luz: "#ffe680"},
        crear: (p) => [{nombre: "farol", partes: [
            {nombre: "base", poligono: [[-14, 0], [14, 0], [8, -18], [-8, -18]], color: "#2f3640", borde: "#1b1f24"},
            {nombre: "poste", ...rect(-4, -230, 4, -18), color: p.poste, borde: "#1b1f24"},
            {nombre: "brazo", en: [0, -230], poligono: [[-4, 0], [46, -6], [46, 0], [0, 6]], color: p.poste, borde: "#1b1f24"},
            {nombre: "lampara", en: [46, -222], poligono: [[-14, -6], [14, -6], [8, 10], [-8, 10]], color: p.luz, borde: "#a08a2a"},
        ]}],
    },
    nube: {
        descripcion: "Nube de tres bultos",
        parametros: {color: "#ffffff", borde: "#dfe6ec"},
        crear: (p) => [{nombre: "nube", partes: [
            {nombre: "bulto_1", en: [-45, -25], circulo: {r: 32, ry: 24, lados: 14}, color: p.color, borde: p.borde},
            {nombre: "bulto_2", en: [0, -40], circulo: {r: 40, ry: 32, lados: 14}, color: p.color, borde: p.borde},
            {nombre: "bulto_3", en: [48, -26], circulo: {r: 34, ry: 24, lados: 14}, color: p.color, borde: p.borde},
        ]}],
    },
    pajaro: {
        descripcion: "Pájaro (mira a la derecha) que aletea: un golpe cada 0,25 s",
        parametros: {cuerpo: "#3d5170", ala: "#4a6285", pico: "#f2b33d"},
        crear: (p) => [{nombre: "pajaro", partes: [
            {nombre: "ala_tras", en: [-2, -14], poligono: [[0, 0], [-10, -26], [12, -20]], color: "#2f3e52", borde: "#1b2533", ...oscila(-30, 30, 250)},
            {nombre: "cuerpo", en: [0, -12], circulo: {r: 16, ry: 8, lados: 12}, color: p.cuerpo, borde: "#1b2533"},
            {nombre: "pico", en: [16, -13], poligono: [[0, -3], [9, 0], [0, 3]], color: p.pico, borde: "#8a6d1f"},
            {nombre: "ala_del", en: [-2, -14], poligono: [[0, 0], [-14, -30], [14, -22]], color: p.ala, borde: "#1b2533", ...oscila(30, -30, 250)},
        ]}],
    },
    sol: {
        descripcion: "Sol con rayos que giran (una vuelta cada 20 s)",
        parametros: {disco: "#ffd23f", rayo: "#ffe066", vuelta_ms: 20000},
        crear: (p) => {
            const rayos = [];
            for (let i = 0; i < 12; i++) {
                const a = i / 12 * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a), r = (v) => Math.round(v);
                rayos.push({nombre: "rayo_" + i, poligono: [[r(52 * c - 5 * s), r(52 * s + 5 * c)], [r(78 * c), r(78 * s)], [r(52 * c + 5 * s), r(52 * s - 5 * c)]],
                    color: p.rayo, borde: "#e0a800"});
            }
            return [{nombre: "sol", partes: [
                {nombre: "rayos", en: [0, -80], giro: {desde: 0, hasta: 360, ms: p.vuelta_ms}, partes: rayos},
                {nombre: "disco", en: [0, -80], circulo: {r: 44, lados: 18}, color: p.disco, borde: "#e0a800"},
            ]}];
        },
        duracion: (p) => p.vuelta_ms,
    },
    meteorito: {
        descripcion: "Meteorito con resplandor (centro en y = -45)",
        parametros: {roca: "#6b5a4e", resplandor: "#ff9a3c"},
        crear: (p) => [{nombre: "meteorito", partes: [
            {nombre: "resplandor", en: [0, -45], circulo: {r: 62, lados: 16}, color: p.resplandor, borde: p.resplandor},
            {nombre: "roca", en: [0, -45], poligono: [[-40, -10], [-22, -38], [8, -42], [36, -24], [42, 8], [24, 36], [-12, 40], [-38, 22]], color: p.roca, borde: "#3b2f27"},
            {nombre: "crater_1", en: [-12, -55], circulo: {r: 9, lados: 10}, color: "#4e4038", borde: "#3b2f27"},
            {nombre: "crater_2", en: [14, -32], circulo: {r: 7, lados: 10}, color: "#4e4038", borde: "#3b2f27"},
            {nombre: "brasa", en: [22, -62], circulo: {r: 6, lados: 8}, color: "#ffcc33", borde: "#e08a00"},
        ]}],
    },
    molino: {
        descripcion: "Molino con aspas que giran",
        parametros: {torre: "#e8dcc4", techo: "#9b3d2e", aspa: "#f4f1e8", vuelta_ms: 4000},
        crear: (p) => {
            const aspa = (n, rot) => ({nombre: "aspa_" + n, rotacion: rot || undefined, poligono: [[-6, 0], [6, 0], [10, -95], [-10, -95]], color: p.aspa, borde: "#6b6b6b"});
            return [{nombre: "molino", partes: [
                {nombre: "torre", poligono: [[-38, 0], [38, 0], [22, -190], [-22, -190]], color: p.torre, borde: "#8a7d63"},
                {nombre: "techo", en: [0, -190], poligono: [[-30, 0], [0, -40], [30, 0]], color: p.techo, borde: "#5e2117"},
                {nombre: "puerta", ...rect(-12, -40, 12, 0), color: "#6b4423", borde: "#3b2414"},
                {nombre: "ventana", en: [0, -120], circulo: 9, color: "#bfe3f5", borde: "#8a7d63"},
                {nombre: "aspas", en: [0, -175], giro: {desde: 0, hasta: 360, ms: p.vuelta_ms}, partes: [
                    aspa(1, 0), aspa(2, 90), aspa(3, 180), aspa(4, 270),
                    {nombre: "eje", circulo: 9, color: "#4a4a4a", borde: "#222222"},
                ]},
            ]}];
        },
        duracion: (p) => p.vuelta_ms,
    },
    calle: {
        descripcion: "Calle larga con cielo, veredas, asfalto y líneas (origen arriba a la izquierda; base en y = 720)",
        parametros: {largo: 3000, cielo: "#9fd3f0", asfalto: "#4a4d52", vereda: "#d3cdc2", pasto: "#6fb35a"},
        crear: (p) => {
            const L = p.largo;
            const lineas = [];
            for (let x = 40, i = 0; x < L; x += 160, i++) lineas.push({nombre: "linea_" + i, en: [x, 545], ...rect(0, -3, 80, 3), color: "#f4f1e8", borde: "#d8d4c8"});
            return [{nombre: "calle", partes: [
                {nombre: "cielo", ...rect(0, 0, L, 425), color: p.cielo, borde: p.cielo},
                {nombre: "vereda_fondo", ...rect(0, 425, L, 475), color: "#c9c3b8", borde: "#9b958a"},
                {nombre: "cordon_fondo", ...rect(0, 475, L, 482), color: "#8f8a80", borde: "#6f6a60"},
                {nombre: "asfalto", ...rect(0, 482, L, 610), color: p.asfalto, borde: "#3a3d42"},
                {nombre: "cordon_frente", ...rect(0, 610, L, 617), color: "#8f8a80", borde: "#6f6a60"},
                {nombre: "vereda_frente", ...rect(0, 617, L, 680), color: p.vereda, borde: "#9b958a"},
                {nombre: "pasto", ...rect(0, 680, L, 720), color: p.pasto, borde: "#4f8a3e"},
                ...lineas,
            ]}];
        },
    },
};

// Expande {generador, parametros} -> {partes, duracion}; null si no existe el generador.
export function expandirGenerador(def) {
    const g = GENERADORES[def.generador];
    if (!g) return null;
    const p = {...g.parametros, ...(def.parametros || {})};
    return {partes: g.crear(p), duracion: def.duracion || (g.duracion ? g.duracion(p) : 1000)};
}

// ---------------- recetas para escenas ----------------

// Temblor de camara: claves de x / y alrededor de `centro`, decrecientes, entre desde y hasta (ms).
export function claveTemblor(centro, {desde, hasta, amplitud = 14, paso = 40}) {
    const [cx, cy] = centro;
    const x = [[0, cx], [desde, cx]], y = [[0, cy], [desde, cy]];
    let k = 0;
    for (let t = desde + paso; t < hasta; t += paso, k++) {
        const a = amplitud * (1 - (t - desde) / (hasta - desde));
        x.push([t, Math.round((cx + (k % 2 ? a : -a) * (0.6 + 0.4 * Math.sin(k * 1.7))) * 10) / 10]);
        y.push([t, Math.round((cy + (k % 3 === 0 ? a : -a * 0.7)) * 10) / 10]);
    }
    x.push([hasta, cx]); y.push([hasta, cy]);
    return {x, y};
}
