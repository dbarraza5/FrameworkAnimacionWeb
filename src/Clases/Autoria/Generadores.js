// Fase A5: generadores de assets y recetas, en el formato SIMPLE (ver Compilador.js).
// Antes vivian en scripts sueltos (ciudad.js, escenas9.js). Todos dibujan con los pies
// en y = 0 y centrados en x = 0 (salvo calle: origen arriba a la izquierda).
//
// Uso en un archivo de asset:
//   {"tipo": "asset", "nombre": "Casa verde", "generador": "casa", "parametros": {"pared": "#9fd59a"}}

const rect = (x0, y0, x1, y1) => ({rect: [x0, y0, x1, y1]});
const oscila = (desde, hasta, ms) => ({claves: {rotacion: [[0, desde, "suave"], [ms, hasta]]}, bucle: "ida_vuelta"});
// rueda que gira (1 vuelta por segundo), con los pies en y = 0
const rueda = (nombre, x, r = 24) => ({nombre, en: [x, -r], circulo: {r, lados: 16}, color: "#222222", borde: "#111111",
    giro: {desde: 0, hasta: 360, ms: 1000}, partes: [
        {nombre: nombre + "_taza", circulo: {r: Math.round(r * 11 / 24), lados: 12}, color: "#b8bcc2", borde: "#6b6f75"},
        {nombre: nombre + "_rayo", ...rect(-2, -(r - 4), 2, r - 4), color: "#8d9196", borde: "#555555"},
    ]});

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
        descripcion: "Auto (mira a la derecha) con ruedas que giran (1 vuelta por segundo); modelo sedan, camioneta o deportivo",
        parametros: {color: "#d63a3a", borde: "#7a1f1f", vidrio: "#cfe9f7", modelo: "sedan"},
        opciones: {modelo: ["sedan", "camioneta", "deportivo"]},
        crear: (p) => {
            const v = (nombre, poligono) => ({nombre, poligono, color: p.vidrio, borde: "#5b6b75"});
            const luz = (nombre, x, y, color, borde) => ({nombre, en: [x, y], ...rect(-6, -6, 7, 6), color, borde});
            if (p.modelo === "camioneta") {
                return [{nombre: "auto", partes: [
                    {nombre: "carroceria", poligono: [[-132, -28], [-132, -118], [-120, -132], [58, -132], [96, -90], [132, -80], [136, -28]], color: p.color, borde: p.borde},
                    {nombre: "parrilla", en: [127, -46], ...rect(-4, -11, 4, 11), color: "#3a3d42", borde: "#222222"},
                    v("ventana_tras", [[-120, -92], [-120, -122], [-44, -122], [-44, -92]]),
                    v("ventana_med", [[-36, -92], [-36, -122], [18, -122], [18, -92]]),
                    v("ventana_del", [[26, -92], [26, -122], [54, -122], [84, -92]]),
                    {nombre: "manilla", en: [-10, -84], ...rect(-8, -2, 8, 2), color: "#2b2b2b", borde: "#2b2b2b"},
                    luz("faro", 126, -66, "#fff3b0", "#a08a2a"), luz("luz_tras", -127, -74, "#ff6a3d", "#7a1f1f"),
                    rueda("rueda_tras", -82, 27), rueda("rueda_del", 86, 27),
                ]}];
            }
            if (p.modelo === "deportivo") {
                return [{nombre: "auto", partes: [
                    {nombre: "aleron", poligono: [[-122, -54], [-128, -66], [-102, -66], [-98, -57]], color: p.borde, borde: "#1b1b1b"},
                    {nombre: "carroceria", poligono: [[-130, -22], [-126, -54], [-62, -64], [-30, -90], [38, -90], [80, -62], [134, -50], [138, -22]], color: p.color, borde: p.borde},
                    v("ventana", [[-48, -64], [-24, -84], [34, -84], [64, -64]]),
                    {nombre: "toma_aire", poligono: [[-8, -40], [22, -40], [30, -30], [-2, -30]], color: "#2b2b2b", borde: "#111111"},
                    luz("faro", 128, -44, "#fff3b0", "#a08a2a"), luz("luz_tras", -126, -46, "#ff6a3d", "#7a1f1f"),
                    rueda("rueda_tras", -76, 22), rueda("rueda_del", 82, 22),
                ]}];
            }
            return [{nombre: "auto", partes: [
                {nombre: "carroceria", poligono: [[-125, -28], [-120, -72], [-75, -78], [-48, -118], [55, -118], [85, -78], [122, -70], [128, -28]], color: p.color, borde: p.borde},
                v("ventana_tras", [[-62, -80], [-42, -110], [0, -110], [0, -80]]),
                v("ventana_del", [[8, -80], [8, -110], [50, -110], [72, -80]]),
                {nombre: "faro", en: [118, -60], ...rect(-6, -6, 8, 6), color: "#fff3b0", borde: "#a08a2a"},
                {nombre: "luz_tras", en: [-121, -60], ...rect(-5, -6, 6, 6), color: "#ff6a3d", borde: "#7a1f1f"},
                rueda("rueda_tras", -72), rueda("rueda_del", 78),
            ]}];
        },
    },
    persona: {
        descripcion: "Persona (mira a la derecha) que camina en el lugar: un paso cada 0,5 s; peinado corto, largo o gorra, y vestido",
        parametros: {ropa: "#2e86de", pantalon: "#2c3e66", piel: "#f1c27d", pelo: "#3b2414", camina: true,
            peinado: "corto", vestido: false, gorra: "#c0392b"},
        opciones: {peinado: ["corto", "largo", "gorra"]},
        crear: (p) => {
            const pierna = [[-7, 0], [7, 0], [6, 66], [14, 70], [-7, 70]];
            const brazo = [[-5, 0], [5, 0], [4, 58], [-4, 58]];
            const mov = (a, b) => (p.camina ? oscila(a, b, 500) : {});
            // con vestido, las piernas son de piel y el torso baja como falda
            const piernas = p.vestido ? p.piel : p.pantalon, borde_piernas = p.vestido ? "#7a5236" : "#1d2a44";
            const torso = p.vestido ? [[-15, -150], [15, -150], [17, -104], [27, -56], [-27, -56]] : [[-15, -150], [15, -150], [17, -68], [-17, -68]];
            const pelo = p.peinado === "gorra"
                ? {nombre: "pelo", poligono: [[-17, -3], [-15, -15], [-3, -20], [11, -17], [16, -8], [29, -6], [29, -2], [15, -3]], color: p.gorra, borde: "#5e1a14"}
                : {nombre: "pelo", poligono: [[-17, -2], [-14, -14], [-2, -19], [12, -16], [17, -6], [4, -9], [-10, -6]], color: p.pelo, borde: "#1b120c"};
            return [{nombre: "persona", partes: [
                {nombre: "brazo_tras", en: [0, -142], poligono: brazo, color: p.piel, borde: "#7a5236", ...mov(22, -22)},
                {nombre: "pierna_tras", en: [0, -70], poligono: pierna, color: piernas, borde: borde_piernas, ...mov(-25, 25)},
                ...(p.peinado === "largo" ? [{nombre: "melena", en: [2, -170], poligono: [[-18, -4], [-15, -16], [-3, -21], [11, -18], [15, -8], [-2, -6], [-6, 16], [-12, 34], [-21, 30]], color: p.pelo, borde: "#1b120c"}] : []),
                {nombre: "torso", poligono: torso, color: p.ropa, borde: "#2b2b2b"},
                {nombre: "pierna_del", en: [0, -70], poligono: pierna, color: piernas, borde: borde_piernas, ...mov(25, -25)},
                {nombre: "cabeza", en: [2, -170], circulo: 17, color: p.piel, borde: "#7a5236", partes: [
                    pelo,
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
    edificio: {
        descripcion: "Edificio de varios pisos: clásico (ventanas, cornisa, toldo, tanque) o moderno (bandas de vidrio)",
        parametros: {ancho: 240, pisos: 6, alto_piso: 64, columnas: 3, estilo: "clasico", fachada: "#d9c7a7", base: "#8c7b6b",
            ventana: "#a9cfe8", marco: "#6d5f52", toldo: "#b8433a", luces: true},
        opciones: {estilo: ["clasico", "moderno"]},
        crear: (p) => {
            const w = Math.round(p.ancho / 2), pb = 90, ap = p.alto_piso;
            const pisos = Math.max(1, Math.round(p.pisos)), cols = Math.max(1, Math.round(p.columnas));
            const H = pb + pisos * ap;
            const luz = "#ffe9a3";
            const encendida = (i, j) => p.luces && (i * 7 + j * 3) % 5 === 0;
            const partes = [
                {nombre: "cuerpo", ...rect(-w, -H, w, -pb), color: p.fachada, borde: p.marco},
                {nombre: "planta_baja", ...rect(-w, -pb, w, 0), color: p.base, borde: p.marco},
                {nombre: "moldura", ...rect(-w - 4, -pb - 6, w + 4, -pb), color: p.marco, borde: p.marco},
            ];
            if (p.estilo === "moderno") {
                for (let i = 0; i < pisos; i++) {
                    const y = -pb - (i + 1) * ap;
                    partes.push({nombre: `banda_${i}`, ...rect(-w + 8, y + 8, w - 8, y + ap - 6),
                        color: encendida(i, 0) ? luz : p.ventana, borde: p.marco});
                }
                for (let j = 1; j < cols; j++) {
                    const x = Math.round(-w + j * (2 * w / cols));
                    partes.push({nombre: `parteluz_${j}`, ...rect(x - 3, -H + 4, x + 3, -pb - 4), color: p.fachada, borde: p.marco});
                }
                partes.push({nombre: "parapeto", en: [0, -H], ...rect(-w, -14, w, 0), color: p.marco, borde: p.marco});
                partes.push({nombre: "vitrina", ...rect(-w + 10, -78, w - 10, -6), color: p.ventana, borde: p.marco});
                partes.push({nombre: "puerta", ...rect(-20, -72, 20, 0), color: "#3f4a54", borde: "#22282e"});
            } else {
                const ancho_col = 2 * w / cols;
                const vw = Math.min(Math.round(ancho_col * 0.5), 46), vh = Math.round(ap * 0.55);
                for (let i = 0; i < pisos; i++) {
                    for (let j = 0; j < cols; j++) {
                        const x = Math.round(-w + (j + 0.5) * ancho_col), y = Math.round(-pb - i * ap - ap / 2);
                        partes.push({nombre: `ventana_${i}_${j}`, en: [x, y], ...rect(-vw / 2, -vh / 2, vw / 2, vh / 2),
                            color: encendida(i, j) ? luz : p.ventana, borde: p.marco});
                        partes.push({nombre: `alfeizar_${i}_${j}`, en: [x, y + vh / 2], ...rect(-vw / 2 - 4, 0, vw / 2 + 4, 5), color: p.marco, borde: p.marco});
                    }
                }
                partes.push({nombre: "cornisa", en: [0, -H], poligono: [[-w - 10, 0], [w + 10, 0], [w + 10, -8], [w + 4, -16], [-w - 4, -16], [-w - 10, -8]],
                    color: p.marco, borde: "#3a332c"});
                if (w > 80) {
                    partes.push({nombre: "vitrina_izq", ...rect(-w + 12, -70, -34, -14), color: p.ventana, borde: p.marco});
                    partes.push({nombre: "vitrina_der", ...rect(34, -70, w - 12, -14), color: p.ventana, borde: p.marco});
                }
                partes.push({nombre: "puerta", ...rect(-22, -70, 22, 0), color: "#4a3a2c", borde: "#2a2018", partes: [
                    {nombre: "puerta_division", ...rect(-1, -70, 1, 0), color: "#2a2018", borde: "#2a2018"}]});
                partes.push({nombre: "toldo", en: [0, -72], poligono: [[-42, 0], [42, 0], [36, -16], [-36, -16]], color: p.toldo, borde: "#5e1f1a"});
                partes.push({nombre: "tanque", en: [Math.round(w * 0.45), -H - 16], partes: [
                    {nombre: "tanque_patas", ...rect(-16, -10, 16, 0), color: "#5a5048", borde: "#3a332c"},
                    {nombre: "tanque_cuerpo", ...rect(-20, -46, 20, -10), color: "#7b6a58", borde: "#3a332c"},
                    {nombre: "tanque_tapa", en: [0, -46], poligono: [[-22, 0], [22, 0], [0, -14]], color: "#5a5048", borde: "#3a332c"},
                ]});
            }
            partes.push({nombre: "antena", en: [-Math.round(w * 0.5), -H - (p.estilo === "moderno" ? 14 : 16)], partes: [
                {nombre: "antena_mastil", ...rect(-2, -56, 2, 0), color: "#4a4a4a", borde: "#2b2b2b"},
                {nombre: "antena_barra", en: [0, -44], ...rect(-14, -2, 14, 2), color: "#4a4a4a", borde: "#2b2b2b"},
            ]});
            return [{nombre: "edificio", partes}];
        },
    },
    autobus: {
        descripcion: "Autobús (mira a la derecha) con franja, ventanas, puerta delantera y ruedas que giran",
        parametros: {color: "#f2b632", franja: "#2a5ea8", vidrio: "#bfe0f2", largo: 520, letrero: "#ffb347"},
        crear: (p) => {
            const w = Math.round(p.largo / 2), H = 180;
            const partes = [
                {nombre: "carroceria", poligono: [[-w, -26], [-w, -H + 8], [-w + 8, -H], [w - 40, -H], [w - 8, -H + 30], [w, -70], [w, -26]], color: p.color, borde: "#7a5a12"},
                {nombre: "franja", ...rect(-w, -82, w - 1, -64), color: p.franja, borde: p.franja},
            ];
            let n = 0;
            for (let x = -w + 22; x + 56 < w - 122; x += 70, n++) {
                partes.push({nombre: `ventana_${n}`, ...rect(x, -H + 22, x + 56, -96), color: p.vidrio, borde: "#5b6b75"});
            }
            partes.push(
                {nombre: "parabrisas", poligono: [[w - 52, -H + 18], [w - 36, -H + 18], [w - 12, -H + 40], [w - 6, -96], [w - 52, -96]], color: p.vidrio, borde: "#5b6b75"},
                {nombre: "puerta", ...rect(w - 114, -156, w - 62, -30), color: "#8fb8cf", borde: "#3a4a55", partes: [
                    {nombre: "puerta_division", ...rect(w - 89, -156, w - 87, -30), color: "#3a4a55", borde: "#3a4a55"}]},
                {nombre: "letrero", ...rect(w - 120, -H + 4, w - 46, -H + 16), color: p.letrero, borde: "#5e3a00"},
                {nombre: "parachoques", ...rect(-w - 4, -34, w + 4, -22), color: "#3a3a3a", borde: "#1e1e1e"},
                {nombre: "faro", en: [w - 6, -50], ...rect(-6, -7, 6, 7), color: "#fff3b0", borde: "#a08a2a"},
                {nombre: "luz_tras", en: [-w + 4, -56], ...rect(-4, -8, 6, 8), color: "#ff6a3d", borde: "#7a1f1f"},
                rueda("rueda_tras", -w + 92, 30), rueda("rueda_del", w - 104, 30),
            );
            return [{nombre: "autobus", partes}];
        },
    },
    parada: {
        descripcion: "Parada de autobús: refugio con techo, vidrio, banco y cartel",
        parametros: {techo: "#2f4f6f", vidrio: "#cfe8f5", cartel: "#2a5ea8"},
        crear: (p) => [{nombre: "parada", partes: [
            {nombre: "vidrio", ...rect(-80, -190, 80, -40), color: p.vidrio, borde: "#7f9fb3", opacidad: 0.6},
            {nombre: "poste_izq", ...rect(-86, -200, -80, 0), color: "#4a5560", borde: "#2b3138"},
            {nombre: "poste_der", ...rect(80, -200, 86, 0), color: "#4a5560", borde: "#2b3138"},
            {nombre: "techo", en: [0, -200], poligono: [[-100, 0], [100, 0], [94, -14], [-94, -14]], color: p.techo, borde: "#1c3044"},
            {nombre: "banco", ...rect(-60, -50, 60, -42), color: "#8a5a32", borde: "#4d3018", partes: [
                {nombre: "banco_pata_izq", ...rect(-54, -42, -48, 0), color: "#4a5560", borde: "#2b3138"},
                {nombre: "banco_pata_der", ...rect(48, -42, 54, 0), color: "#4a5560", borde: "#2b3138"}]},
            {nombre: "cartel", en: [118, 0], partes: [
                {nombre: "cartel_poste", ...rect(-2, -230, 2, 0), color: "#4a5560", borde: "#2b3138"},
                {nombre: "cartel_disco", en: [0, -244], circulo: {r: 18, lados: 16}, color: p.cartel, borde: "#1c3044", partes: [
                    {nombre: "cartel_bus", ...rect(-9, -6, 9, 6), color: "#ffffff", borde: "#ffffff"}]},
            ]},
        ]}],
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
// entrada: ms en que la vibracion crece desde 0; decae: true (se va calmando hasta el final) | false (pareja)
export function claveTemblor(centro, {desde, hasta, amplitud = 14, paso = 40, entrada = 0, decae = true}) {
    const [cx, cy] = centro;
    // (si empieza en 0, una sola clave inicial: dos en el mismo instante no valen)
    const x = desde > 0 ? [[0, cx], [desde, cx]] : [[0, cx]], y = desde > 0 ? [[0, cy], [desde, cy]] : [[0, cy]];
    let k = 0;
    for (let t = desde + paso; t < hasta; t += paso, k++) {
        const sube = entrada > 0 ? Math.min(1, (t - desde) / entrada) : 1;
        const baja = decae ? 1 - (t - desde) / (hasta - desde) : Math.min(1, (hasta - t) / Math.max(paso, 200));
        const a = amplitud * sube * baja;
        x.push([t, Math.round((cx + (k % 2 ? a : -a) * (0.6 + 0.4 * Math.sin(k * 1.7))) * 10) / 10]);
        y.push([t, Math.round((cy + (k % 3 === 0 ? a : -a * 0.7)) * 10) / 10]);
    }
    x.push([hasta, cx]); y.push([hasta, cy]);
    return {x, y};
}
