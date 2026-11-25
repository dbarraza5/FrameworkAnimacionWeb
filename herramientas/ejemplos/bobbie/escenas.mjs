// Escenas de "Bobbie, el perro maravilla" (guion_bobbie.md). Vertical 9:16; suelo en y = 1000.
//   node herramientas/ejemplos/bobbie/escenas.mjs   (despues de generar.mjs) -> escena_1.json ... escena_3.json
// Los tiempos son los del guion; la fase 5 (voces) los acomoda con voces.mjs --reubicar.
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const guardar = (n, x) => fs.writeFileSync(path.join(DIR, n), JSON.stringify(x, null, 1));

const SUELO = 1000;
const VERT = {tamano: [720, 1280], centro: [360, 640]};
// zona segura de TikTok (arriba el buscador, abajo el texto y la musica, a la derecha los botones): textos y narrador quedan dentro
const ZONA = {arriba: 0.1, abajo: 0.22, izquierda: 0.05, derecha: 0.14};
const fondo = (asset, x, extra = {}) => ({instancia: asset, nombre: `fondo_${asset.split(" ")[1].toLowerCase()}_${x}`, en: [x, SUELO], plano: -10, ...extra});
// textos de pantalla (pegados al cuadro)
const titulo = (texto, desde, hasta, extra = {}) => ({texto, desde, hasta, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 40, color: "#fff8e8",
    fuente: "serif", velocidad: 22, resplandor: 6, ...extra});
const narrador = (texto, desde, hasta) => ({texto, desde, hasta, estilo: "narrador", posicion: "abajo", velocidad: 16});
// partes de un farol con su luz (para colgar de una mano)
const farol = (nombre, padre) => ({nombre, padre, enganche: "mano", girar: false, partes: [
    {nombre: `${nombre}_luz`, en: [0, 22], circulo: {r: 120, lados: 28}, mezcla: "suma",
        degradado: {tipo: "radial", centro: [0, 0], radio: 120, colores: [[0, "rgba(255,210,120,0.55)"], [1, "rgba(255,170,60,0)"]]}},
    {nombre: `${nombre}_asa`, rect: [-1, 0, 1, 10], color: "#3a3a3a"},
    {nombre: `${nombre}_vidrio`, en: [0, 22], circulo: {r: 9, lados: 14}, color: "#ffd36b"},
    {nombre: `${nombre}_marco`, en: [0, 22], rect: [-8, -12, 8, 12], color: "rgba(0,0,0,0)", borde: "#3a3a3a"}]});
// pasajeros sentados en el auto (colgados del asiento): offset de los pies respecto del asiento
const pasajero = (instancia, nombre, auto, asiento, dx, escala = 1, extra = {}) =>
    ({instancia, nombre, padre: auto, enganche: asiento, en: [dx, Math.round(54 * escala + (1 - escala) * 0)], escala, evento: "Sentado", ...extra});

// ================================================================== 1. EL GANCHO (0 a 6,5 s)
// patas heridas en la nieve, "4.000 km" en grande desde el primer cuadro; la camara sube hasta ver a Bobbie mirando el horizonte.
// Capas de detalle para el primer plano: montones de nieve delante de las patas, destellos, pasto seco, piedras, rafagas
// a ras del suelo, huellas hundidas, pinos nevados cerca, nieve en el lomo, patas heridas, aliento, copos grandes y vineta.
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const X_INI = 230, X_FIN = 400, VEL = 45, T_LLEGA = Math.round((X_FIN - X_INI) / VEL * 1000);
const CAM1 = {
    x: [[0, 236, "suave"], [4800, 380, "suave"], [6500, 385]],
    y: [[0, 968, "suave"], [700, 968, "suave"], [4800, 870, "suave"], [6500, 865]],
    zoom: [[0, 4.2, "suave"], [700, 4.2, "suave"], [4800, 1.25, "suave"], [6500, 1.2]],
};
// valor de una pista de la camara (como el motor: la interpolacion de la clave de inicio)
const suave = (u) => u * u * (3 - 2 * u);
function enPista(p, t) {
    if (t <= p[0][0]) return p[0][1];
    for (let i = 0; i < p.length - 1; i++) if (t <= p[i + 1][0]) {
        const u = (t - p[i][0]) / (p[i + 1][0] - p[i][0]);
        return p[i][1] + (p[i + 1][1] - p[i][1]) * (p[i][2] === "suave" ? suave(u) : u);
    }
    return p[p.length - 1][1];
}
// vineta que sigue a la camara (claves muestreadas cada 100 ms)
const vineta = (() => {
    const x = [], y = [], ex = [], ey = [];
    for (let t = 0; t <= 6500; t += 100) {
        const z = enPista(CAM1.zoom, t);
        x.push([t, Math.round(enPista(CAM1.x, t) * 10) / 10]); y.push([t, Math.round(enPista(CAM1.y, t) * 10) / 10]);
        ex.push([t, Math.round(1000 / z) / 1000]); ey.push([t, Math.round(1000 / z) / 1000]);
    }
    return {nombre: "vineta", en: [236, 1010], plano: 8, rect: [-400, -700, 400, 700],
        degradado: {tipo: "radial", centro: [0, 0], radio: 760, colores: [[0, "rgba(0,0,0,0)"], [0.62, "rgba(0,0,0,0)"], [1, "rgba(8,16,36,0.6)"]]},
        claves: {x, y, escala_x: ex, escala_y: ey}};
})();
const huella = (i, x) => {
    const t = Math.max(1, Math.round((x - X_INI) / VEL * 1000));
    return {nombre: `huella_${i}`, en: [x, SUELO + 5], plano: -2, partes: [
        {nombre: `huella_${i}_borde`, elipse: [11, 4.5], color: "#ffffff"},
        {nombre: `huella_${i}_hueco`, en: [0, 0.8], elipse: [8.5, 3], color: "#8da4c2"}],
        claves: {opacidad: [[0, x < X_INI + 15 ? 1 : 0], [t, x < X_INI + 15 ? 1 : 0, "mantener"], [t + 120, 1]]}};
};
// montones de nieve delante de las patas (las patas "se hunden")
const montones = {nombre: "montones", en: [0, 0], plano: 3, partes: Array.from({length: 9}, (_, k) => {
    const x = 120 + k * 52 + azar() * 20, w = 40 + azar() * 34, h = 7 + azar() * 9;
    return {nombre: `monton_${k}`, color: "#f4f8fb", poligono: [[x - w / 2, SUELO + 14], [x - w * 0.35, SUELO + 4 - h * 0.4], [x - w * 0.1, SUELO + 2 - h],
        [x + w * 0.2, SUELO + 2 - h * 0.8], [x + w * 0.45, SUELO + 6 - h * 0.3], [x + w / 2, SUELO + 14]],
        degradado: {tipo: "lineal", de: [0, SUELO - h], a: [0, SUELO + 14], colores: [[0, "#ffffff"], [1, "#c9d8e8"]]}};
})};
const destellos = {nombre: "destellos", en: [0, 0], plano: 4, partes: Array.from({length: 34}, (_, k) => {
    const x = 110 + azar() * 520, y = SUELO + 2 + azar() * 70, r = 1 + azar() * 1.6, f = Math.round(400 + azar() * 900);
    return {nombre: `destello_${k}`, color: k % 3 ? "#ffffff" : "#cfe6ff", poligono: [[x, y - r * 2], [x + r * 0.6, y], [x, y + r * 2], [x - r * 0.6, y]],
        claves: {opacidad: [[0, 0.2], [f, 1, "suave"], [f * 2, 0.2]]}, bucle: "repetir"};
})};
const pasto = (n, x, plano) => ({nombre: n, en: [x, SUELO + 2], plano, partes: Array.from({length: 5}, (_, k) => ({nombre: `${n}_${k}`, color: k % 2 ? "#6b5a3e" : "#8a7350",
    poligono: [[k * 3 - 6, 0], [k * 3 - 4, 0], [k * 3 - 8 + (k - 2) * 4, -14 - (k % 3) * 6]]}))});
const piedra = (n, x, w, plano) => ({nombre: n, en: [x, SUELO + 6], plano, partes: [
    {nombre: `${n}_roca`, color: "#5e6a7a", poligono: [[-w, 0], [-w * 0.7, -w * 0.6], [w * 0.2, -w * 0.8], [w, -w * 0.3], [w, 0]]},
    {nombre: `${n}_nieve`, color: "#f6f9fc", poligono: [[-w * 0.75, -w * 0.55], [w * 0.2, -w * 0.8], [w * 0.9, -w * 0.32], [w * 0.3, -w * 0.5], [-w * 0.4, -w * 0.45]]}]});
const rafaga = (k) => ({nombre: `rafaga_${k}`, en: [-60 - k * 130, SUELO - 4 - (k % 3) * 9], plano: 5, color: "rgba(255,255,255,0.55)",
    poligono: [[0, 0], [90, -1.5], [140, 0], [90, 1.5]], claves: {x: [[0, -60 - k * 130], [1600, 700 - k * 130]]}, bucle: "repetir"});
const pinoNevado = (n, x, alto, plano) => ({nombre: n, en: [x, SUELO], plano, partes: [
    {nombre: `${n}_tronco`, color: "#3e2c22", poligono: [[-6, 0], [6, 0], [5, -alto * 0.22], [-5, -alto * 0.22]]},
    ...[0, 1, 2].map((k) => {
        const y0 = -alto * (0.18 + k * 0.26), w = alto * (0.34 - k * 0.09), h = alto * 0.38;
        return {nombre: `${n}_piso${k}`, color: "#2a4a3c", poligono: [[-w, y0], [0, y0 - h], [w, y0]], partes: [
            {nombre: `${n}_nieve${k}`, color: "#eef4f8", poligono: [[-w * 0.85, y0 - 2], [-w * 0.3, y0 - h * 0.42], [0, y0 - h * 0.3], [w * 0.35, y0 - h * 0.45], [w * 0.85, y0 - 2], [0, y0 - h * 0.12]]}]};
    })]});
const nieve = (n, x) => ({tipo: "particulas", nombre: n, en: [x, 120], inicio: 0, fin: 7000, tasa: 30, vida: 6000, velocidad: 170, angulo: 105, dispersion: 35,
    gravedad: 40, tam_ini: 4, tam_fin: 3, color_ini: "#ffffff", color_fin: "#dfe9f3", opacidad: 0.9});
const escena1 = {
    tipo: "escena", nombre: "1. El gancho", duracion: 6500, precision: "decimal", zona_segura: ZONA,
    camara: {...VERT, claves: CAM1},
    objetos: [
        fondo("Fondo montañas", 360),
        {nombre: "neblina", en: [0, 0], plano: -7, rect: [-300, 760, 1100, 1000], degradado: {tipo: "lineal", de: [0, 760], a: [0, 1000], colores: [[0, "rgba(235,242,248,0)"], [1, "rgba(235,242,248,0.85)"]]}},
        pinoNevado("pino_izq", 70, 330, -6), pinoNevado("pino_der", 600, 380, -6), pinoNevado("pino_lejos", 470, 210, -7),
        piedra("piedra_1", 150, 16, -1), piedra("piedra_2", 520, 22, -1),
        pasto("pasto_1", 180, -1), pasto("pasto_2", 330, -1), pasto("pasto_3", 455, -1),
        ...[262, 301, 348, 392].map((x, i) => huella(i, x)),
        {instancia: "Bobbie", nombre: "bobbie", en: [X_INI, SUELO], evento: "Cojear"},
        // nieve pegada al lomo y patas heridas (siguen al cuerpo y a las patas)
        {nombre: "nieve_lomo", padre: "bobbie", enganche: "lomo", partes: [
            {nombre: "nieve_lomo_1", elipse: [12, 4], color: "#f6f9fc"}, {nombre: "nieve_lomo_2", en: [-22, 3], elipse: [8, 3], color: "#eef4f8"},
            {nombre: "nieve_lomo_3", en: [16, 2], elipse: [6, 2.5], color: "#ffffff"}]},
        {nombre: "herida_del", padre: "bobbie", enganche: {parte: "pierna_dc"}, en: [27, -3], elipse: [4, 2.2], color: "rgba(140,50,40,0.75)"},
        {nombre: "herida_tras", padre: "bobbie", enganche: {parte: "pierna_tc"}, en: [-35, -3], elipse: [4, 2.2], color: "rgba(140,50,40,0.6)"},
        montones, destellos, pasto("pasto_frente", 260, 4),
        ...Array.from({length: 5}, (_, k) => rafaga(k + 1)),
        // ventisca: un velo frio que late
        {nombre: "velo_frio", en: [0, 0], plano: 5, rect: [-400, -400, 1200, 1700], color: "rgba(70,100,150,0.14)"},
        {nombre: "ventisca", en: [0, 0], plano: 6, rect: [-400, -400, 1200, 1700], color: "#ffffff",
            claves: {opacidad: [[0, 0.04, "suave"], [900, 0.13, "suave"], [1800, 0.05, "suave"], [2700, 0.12, "suave"], [3600, 0.04, "suave"], [4500, 0.1, "suave"], [6500, 0.05]]}},
        vineta,
    ],
    efectos: [
        nieve("nieve_1", 60), nieve("nieve_2", 360), nieve("nieve_3", 660),
        // copos grandes cerca de la camara (pocos y suaves)
        {tipo: "particulas", nombre: "copos_cerca", en: [200, 700], inicio: 0, fin: 7000, tasa: 5, vida: 2500, velocidad: 230, angulo: 108, dispersion: 50,
            gravedad: 30, tam_ini: 7, tam_fin: 9, color_ini: "#ffffff", color_fin: "#ffffff", opacidad: 0.45},
        // aliento que se condensa (sale de la boca mientras camina)
        {tipo: "particulas", nombre: "aliento", en: [X_INI + 92, SUELO - 86], inicio: 200, fin: 6500, tasa: 7, vida: 900, velocidad: 28, angulo: -15, dispersion: 25,
            gravedad: -15, tam_ini: 3, tam_fin: 16, color_ini: "#ffffff", color_fin: "#e8f0f8", opacidad: 0.4, suave: "si",
            claves: {x: [[0, X_INI + 92], [T_LLEGA, X_FIN + 92]]}},
    ],
    pasos: [
        {caminar: "bobbie", a: [X_FIN, SUELO], desde: 0, velocidad: VEL, accion: "Cojear", luego: "Quieto"},
    ],
    dialogos: [
        {texto: "4.000 km", desde: 0, hasta: 6500, estilo: "texto", en: {cuadro: "centro", desplazar: [0, -300]}, tamano: 118, color: "#ffffff", fuente: "serif", velocidad: 0, resplandor: 14, entrada: 0},
        {texto: "HISTORIA REAL", desde: 0, hasta: 6500, estilo: "texto", en: {cuadro: "centro", desplazar: [0, -200]}, tamano: 34, color: "#ffe2a8", fuente: "sans", velocidad: 0, resplandor: 6, entrada: 0},
        narrador("Este perro caminó cuatro mil kilómetros… solo, en pleno invierno… para volver a casa.", 300, 6300),
    ],
};

// ================================================================== 2. ANTES DE TODO (Silverton, agosto de 1923)
// (la narracion dura unos 9 s: Bobbie llega corriendo al final y Frank grita cuando el narrador termino)
const T_SUBE = 10700, T_PARTE = 11600, T_FIN2 = 13600;
const escena2 = {
    tipo: "escena", nombre: "2. Antes de todo", duracion: T_FIN2, precision: "decimal", zona_segura: ZONA,
    camara: {...VERT, centro: [360, 700], zoom: 1.05, claves: {
        x: [[0, 330, "suave"], [T_SUBE - 400, 330, "suave"], [T_SUBE + 600, 400, "suave"], [T_PARTE + 300, 400, "suave"], [T_FIN2, 520]],
        y: [[0, 860, "suave"], [T_SUBE - 400, 860, "suave"], [T_SUBE + 600, 940, "suave"], [T_PARTE + 300, 940, "suave"], [T_FIN2, 900]],
        zoom: [[0, 1.05, "suave"], [T_SUBE - 400, 1.05, "suave"], [T_SUBE + 600, 1.9, "suave"], [T_PARTE + 300, 1.9, "suave"], [T_FIN2, 1.25]]}},
    objetos: [
        fondo("Fondo Silverton", 360),
        {instancia: "Auto 1920", nombre: "auto", en: [430, SUELO], evento: "Quieto", acciones: [[T_PARTE, "Andar"]],
            claves: {x: [[0, 430], [T_PARTE, 430, "entrar"], [T_FIN2, 1250]]}},
        pasajero("Frank", "frank", "auto", "asiento_del", 0),
        pasajero("Elizabeth", "elizabeth", "auto", "asiento_tras", -16),
        pasajero("Hija", "hija", "auto", "asiento_tras", 22, 0.8),
        // Bobbie llega corriendo y salta al estribo: una copia en el suelo y otra en el estribo (se prende al subir)
        {instancia: "Bobbie", nombre: "bobbie", en: [-120, SUELO], evento: "Quieto",
            claves: {y: [[0, SUELO], [T_SUBE - 300, SUELO, "salir"], [T_SUBE - 120, SUELO - 70, "entrar"], [T_SUBE, SUELO - 50]],
                opacidad: [[0, 1], [T_SUBE, 1, "mantener"], [T_SUBE + 1, 0]]}},
        {instancia: "Bobbie", nombre: "bobbie_estribo", padre: "auto", enganche: "estribo", evento: "Cola", escala: 0.85,
            claves: {opacidad: [[0, 0], [T_SUBE, 0, "mantener"], [T_SUBE + 1, 1]]}},
    ],
    pasos: [
        {caminar: "bobbie", a: [440, SUELO], desde: T_SUBE - 3600, hasta: T_SUBE - 300, accion: "Correr", luego: "Quieto"},
    ],
    dialogos: [
        titulo("Agosto de 1923", 200, 4200),
        titulo("Silverton, Oregón", 700, 4200, {en: {cuadro: "arriba-centro", desplazar: [0, 56]}, tamano: 28, color: "#ffe9c4"}),
        narrador("Agosto de 1923. La familia Brazier sale de viaje desde Oregón hasta Indiana. Y Bobbie, su perro, va con ellos.", 400, 10200),
        {quien: "frank", texto: "¡Arriba, Bobbie!", desde: T_SUBE - 950, hasta: T_SUBE + 700, estilo: "grito"},
    ],
};

// ================================================================== 3. SE PIERDE (Wolcott, Indiana)
// tres lugares uno al lado del otro; la camara salta entre ellos: A estacion (ataque), B noche (busqueda), C estacion al amanecer (se van)
const XA = 360, XB = 1360, XC = 2360, TB = 4800, TC = 9800;
const escena3 = {
    tipo: "escena", nombre: "3. Se pierde", duracion: 12500, precision: "decimal", zona_segura: ZONA,
    camara: {...VERT, centro: [XA, 760], zoom: 1.15, temblor: {desde: 1700, hasta: 2500, amplitud: 6},
        claves: {x: [[0, XA, "mantener"], [TB, XB, "mantener"], [TC, XC, "mantener"]],
            y: [[0, 880, "mantener"], [TB, 900, "suave"], [TC - 1, 890, "mantener"], [TC, 880]],
            zoom: [[0, 1.15, "mantener"], [TB, 1.5, "suave"], [TC - 1, 1.3, "mantener"], [TC, 1.1]]}},
    objetos: [
        // A: la estacion de servicio
        fondo("Fondo estación", XA),
        {instancia: "Auto 1920", nombre: "auto_a", en: [XA + 180, SUELO], escala: 0.9, plano: -3},
        {instancia: "Bobbie", nombre: "bobbie", en: [XA - 60, SUELO], evento: "Cola"},
        {instancia: "Perro negro", nombre: "perro_negro", en: [XA + 520, SUELO], espejo: true, escala: 1.08, evento: "Quieto"},
        {instancia: "Perro manchado", nombre: "perro_manchado", en: [XA + 600, SUELO], espejo: true, escala: 0.95, evento: "Quieto"},
        // B: de noche, lo buscan con un farol
        fondo("Fondo noche", XB),
        {instancia: "Elizabeth", nombre: "elizabeth", en: [XB - 90, SUELO], evento: "Llamar"},
        {instancia: "Frank", nombre: "frank", en: [XB + 330, SUELO], espejo: true, evento: "Quieto"},
        farol("farol", "frank"),
        // C: al amanecer, se van sin el
        fondo("Fondo estación", XC),
        {nombre: "amanecer", en: [XC, 0], plano: -9, rect: [-460, -200, 460, 1100], color: "rgba(255,170,120,0.22)", mezcla: "multiplicar"},
        {instancia: "Auto 1920", nombre: "auto_c", en: [XC - 60, SUELO], evento: "Quieto", acciones: [[TC + 400, "Andar"]],
            claves: {x: [[0, XC - 60], [TC + 400, XC - 60, "entrar"], [12500, XC + 700]]}},
        pasajero("Frank", "frank_c", "auto_c", "asiento_del", 0),
        pasajero("Elizabeth", "elizabeth_c", "auto_c", "asiento_tras", -16),
        pasajero("Hija", "hija_c", "auto_c", "asiento_tras", 22, 0.8),
    ],
    pasos: [
        {mirar: "bobbie", a: "derecha", t: 500},
        {caminar: "perro_negro", a: [XA + 120, SUELO], desde: 700, velocidad: 360, accion: "Correr", luego: "Quieto"},
        {caminar: "perro_manchado", a: [XA + 200, SUELO], desde: 900, velocidad: 330, accion: "Correr", luego: "Quieto"},
        {caminar: "bobbie", a: [XA - 600, SUELO], desde: 2300, velocidad: 430, accion: "Correr"},
        {caminar: "perro_negro", a: [XA - 520, SUELO], desde: 2700, velocidad: 400, accion: "Correr"},
        {caminar: "perro_manchado", a: [XA - 480, SUELO], desde: 2900, velocidad: 380, accion: "Correr"},
        {caminar: "frank", a: [XB + 90, SUELO], desde: TB + 300, velocidad: 70, accion: "Buscar", luego: "Quieto"},
    ],
    dialogos: [
        titulo("Wolcott, Indiana", 200, 4400),
        narrador("En un pueblo de Indiana, unos perros lo atacaron… y Bobbie desapareció.", 300, 4700),
        {quien: "elizabeth", texto: "¡Bobbie! ¡Bobbie!", desde: TB + 400, hasta: TB + 2400, estilo: "grito"},
        {quien: "frank", texto: "Tenemos que volver… sin él.", desde: TB + 2800, hasta: TC - 200},
        titulo("Días después…", TC + 100, 12400),
        narrador("Lo buscaron por días. Nunca apareció.", TC + 300, 12400),
    ],
};
// ================================================================== 4. EL VIAJE (montaje con contador de km)
// seis tramos uno al lado del otro (la camara salta); Bobbie va hacia el OESTE = hacia la izquierda.
const km = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// contador: el numero sube en pasos durante el tramo, y el mes queda debajo
function contador(t0, t1, k0, k1, mes) {
    const n = 6, d = [];
    for (let i = 0; i < n; i++) {
        const a = Math.round(t0 + (t1 - t0) * i / n), b = Math.round(t0 + (t1 - t0) * (i + 1) / n) - 1;
        const v = Math.round((k0 + (k1 - k0) * i / (n - 1)) / 50) * 50;
        d.push({texto: km(v) + " km", desde: a, hasta: b, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 76, color: "#ffffff", fuente: "serif", velocidad: 0, resplandor: 12, entrada: 0});
    }
    d.push({texto: mes, desde: t0, hasta: t1 - 1, estilo: "texto", en: {cuadro: "arriba-centro", desplazar: [0, 106]}, tamano: 28, color: "#ffe2a8", fuente: "serif", velocidad: 0, resplandor: 5, entrada: 0});
    return d;
}
const T4 = [0, 3200, 6200, 9500, 14200, 20400, 23700];      // limites de los tramos (a la medida de cada frase)
const X4 = [360, 1360, 2360, 3360, 4360, 5360];               // centro de cada tramo
const tramoCam = (k) => [[T4[k], X4[k] + 60, "lineal"], [T4[k + 1] - 1, X4[k] - 60, "mantener"]];
const bobbieTramo = (k, extra = {}) => ({instancia: "Bobbie", nombre: `bobbie_${k}`, en: [X4[k] + 330, SUELO], evento: "Caminar", ...extra});
const camina = (k, accion = "Caminar") => ({caminar: `bobbie_${k}`, a: [X4[k] - 330, (k === 1 ? SUELO + 60 : SUELO)], desde: T4[k], hasta: T4[k + 1] - 200, accion});
const lluvia = (n, x, t0, t1) => ({tipo: "particulas", nombre: n, en: [x, 80], inicio: t0, fin: t1, tasa: 90, vida: 1600, velocidad: 650, angulo: 100, dispersion: 6,
    gravedad: 0, tam_ini: 2.4, tam_fin: 2, color_ini: "#5f7488", color_fin: "#7d93a6", opacidad: 0.6});
// lluvia de trazos (las particulas son puntos): lineas finas que caen en bucle, cada una desfasada
// y(t) = arriba + ((f + t / periodo) mod 1) * alto  -> claves con un salto "mantener" al llegar abajo
let semillaLluvia = 5;
const azarL = () => ((semillaLluvia = (semillaLluvia * 16807) % 2147483647) / 2147483647);
function lluviaTrazos(nombre, x0, x1, arriba, alto, n, {periodo = 520, largo = 34, color = "rgba(90,110,130,0.55)", t0 = 0, t1 = null, plano = 6} = {}) {
    const partes = Array.from({length: n}, (_, k) => {
        const f = azarL(), x = x0 + azarL() * (x1 - x0), tb = Math.round((1 - f) * periodo);
        const y = [[0, Math.round(arriba + f * alto), "lineal"], [tb, arriba + alto, "mantener"], [tb + 1, arriba, "lineal"], [periodo, Math.round(arriba + f * alto)]];
        return {nombre: `${nombre}_${k}`, en: [x, 0], color, poligono: [[0, 0], [1.6, 0], [-4, largo], [-5.6, largo]], claves: {y: tb > 0 && tb < periodo - 1 ? y : [[0, arriba], [periodo, arriba + alto]]}, bucle: "repetir"};
    });
    const o = {nombre, en: [0, 0], plano, partes};
    if (t1 !== null) o.claves = {opacidad: [[0, 0], [Math.max(1, t0) - 1, 0, "mantener"], [t0, 1], [t1 - 1, 1, "mantener"], [t1, 0]]};
    return o;
}
const ventisca = (n, x, t0, t1, tasa = 45) => ({tipo: "particulas", nombre: n, en: [x, 500], inicio: t0, fin: t1, tasa, vida: 2600, velocidad: 380, angulo: 12, dispersion: 25,
    gravedad: 30, tam_ini: 4, tam_fin: 3, color_ini: "#ffffff", color_fin: "#dfe9f3", opacidad: 0.9});
const escena4 = {
    tipo: "escena", nombre: "4. El viaje", duracion: T4[6], precision: "decimal", zona_segura: ZONA,
    camara: {...VERT, centro: [X4[0], 905], zoom: 1.5, claves: {x: [0, 1, 2, 3, 4, 5].flatMap((k) => tramoCam(k)), y: [[0, 905]], zoom: [[0, 1.5]]}},
    objetos: [
        // 1) maizal de otono
        fondo("Fondo maizal", X4[0]), bobbieTramo(0),
        // 2) rio helado: nada (el agua de adelante tapa la mitad de abajo del cuerpo)
        fondo("Fondo río", X4[1]), bobbieTramo(1, {en: [X4[1] + 330, SUELO + 60], evento: "Nadar"}),
        {nombre: "agua_frente", en: [0, 0], plano: 2, rect: [X4[1] - 460, SUELO + 8, X4[1] + 460, SUELO + 420],
            degradado: {tipo: "lineal", de: [0, SUELO + 8], a: [0, SUELO + 200], colores: [[0, "rgba(120,160,195,0.78)"], [1, "rgba(60,100,140,0.92)"]]}},
        {nombre: "espuma", en: [0, 0], plano: 3, rect: [X4[1] - 460, SUELO + 6, X4[1] + 460, SUELO + 11], color: "rgba(255,255,255,0.6)"},
        // 3) pradera nevada con viento
        fondo("Fondo pradera nevada", X4[2]), bobbieTramo(2),
        // 4) una granjera le deja un plato de comida (la casa de Silverton hace de granja, con nieve)
        fondo("Fondo Silverton", X4[3]),
        {nombre: "nieve_granja", en: [0, 0], plano: -9, rect: [X4[3] - 460, SUELO - 2, X4[3] + 460, SUELO + 520], color: "#eef3f6"},
        {nombre: "cielo_invierno", en: [0, 0], plano: -9, rect: [X4[3] - 460, -200, X4[3] + 460, SUELO - 2], color: "rgba(150,160,175,0.55)", mezcla: "multiplicar"},
        {instancia: "Granjera", nombre: "granjera", en: [X4[3] - 40, SUELO], evento: "Quieto"},
        {nombre: "plato", en: [0, 0], partes: [
            {nombre: "plato_base", elipse: [16, 5], color: "#e9e1cf", borde: "#a89a7a"},
            {nombre: "plato_comida", en: [0, -3], elipse: [10, 4], color: "#9a5a32"}]},
        bobbieTramo(3),
        // 5) las Rocosas de noche, con ventisca
        fondo("Fondo montañas", X4[4]),
        {nombre: "noche_rocosas", en: [0, 0], plano: -9, rect: [X4[4] - 460, -200, X4[4] + 460, SUELO + 520], color: "rgba(40,55,110,0.62)", mezcla: "multiplicar"},
        bobbieTramo(4, {evento: "Cojear"}),
        // 6) el bosque de Oregon con lluvia
        fondo("Fondo bosque", X4[5]), bobbieTramo(5),
        {nombre: "gris_lluvia", en: [0, 0], plano: 4, rect: [X4[5] - 460, -200, X4[5] + 460, SUELO + 520], color: "rgba(90,110,120,0.18)", borde: "rgba(0,0,0,0)"},
        lluviaTrazos("lluvia", X4[5] - 300, X4[5] + 320, 400, 760, 70, {t0: T4[5], t1: T4[6]}),
    ],
    efectos: [
        {tipo: "particulas", nombre: "hojas_maiz", en: [X4[0] + 200, 600], inicio: 0, fin: T4[1], tasa: 6, vida: 3500, velocidad: 70, angulo: 160, dispersion: 40,
            gravedad: 40, tam_ini: 5, tam_fin: 4, color_ini: "#d9a441", color_fin: "#a8662a"},
        {tipo: "particulas", nombre: "salpicaduras", en: [X4[1], SUELO + 8], inicio: T4[1], fin: T4[2], tasa: 18, vida: 600, velocidad: 90, angulo: -90, dispersion: 70,
            gravedad: 300, tam_ini: 3, tam_fin: 2, color_ini: "#ffffff", color_fin: "#cfe3f0", opacidad: 0.8,
            claves: {x: [[T4[1], X4[1] + 400], [T4[2] - 200, X4[1] - 260]]}},
        ventisca("viento_pradera_1", X4[2] - 460, T4[2], T4[3]), ventisca("viento_pradera_2", X4[2] - 460, T4[2], T4[3], 30),
        ventisca("ventisca_1", X4[4] - 460, T4[4], T4[5], 70), ventisca("ventisca_2", X4[4] - 300, T4[4], T4[5], 50),
    ],
    pasos: [
        camina(0), camina(1, "Nadar"), camina(2), camina(4, "Cojear"), camina(5),
        // la granjera sale con el plato, lo deja en el suelo y vuelve a la puerta; Bobbie llega, come y sigue
        {tomar: "granjera", objeto: "plato", enganche: "mano", t: 0},
        {caminar: "granjera", a: [X4[3] + 60, SUELO], desde: T4[3] + 200, velocidad: 90, luego: "Quieto"},
        {soltar: "granjera", objeto: "plato", t: T4[3] + 1500, en: [X4[3] + 95, SUELO]},
        {caminar: "granjera", a: [X4[3] - 40, SUELO], desde: T4[3] + 1800, velocidad: 110, luego: "Quieto"},
        {mirar: "granjera", a: "derecha", t: T4[3] + 2800},
        {caminar: "bobbie_3", a: [X4[3] + 125, SUELO], desde: T4[3] + 900, hasta: T4[3] + 2700, accion: "Caminar", luego: "Quieto"},
        {caminar: "bobbie_3", a: [X4[3] - 120, SUELO], desde: T4[3] + 3900, hasta: T4[4] - 100, accion: "Caminar"},
    ],
    dialogos: [
        ...contador(T4[0], T4[1], 0, 800, "Septiembre de 1923"),
        ...contador(T4[1], T4[2], 800, 1500, "Octubre"),
        ...contador(T4[2], T4[3], 1500, 2300, "Noviembre"),
        ...contador(T4[3], T4[4], 2300, 2800, "Diciembre"),
        ...contador(T4[4], T4[5], 2800, 3500, "Enero de 1924"),
        ...contador(T4[5], T4[6], 3500, 3900, "Febrero · Oregón"),
        narrador("Pero Bobbie no se rindió.", T4[0] + 400, T4[1] - 200),
        narrador("Cruzó ríos helados.", T4[1] + 400, T4[2] - 200),
        narrador("Atravesó praderas y nevadas.", T4[2] + 400, T4[3] - 200),
        narrador("Hubo desconocidos que le dieron comida… y él siguió.", T4[3] + 400, T4[4] - 200),
        narrador("Siempre hacia el oeste. Hasta subir las Montañas Rocosas, en pleno invierno.", T4[4] + 300, T4[5] - 200),
    ],
};
// Bobbie come del plato (quieto un momento) y mueve la cola antes de seguir
escena4.objetos.find((o) => o.nombre === "bobbie_3").acciones = [[T4[3] + 2700, "Quieto"], [T4[3] + 3300, "Cola"]];

// ================================================================== 5. EL REGRESO (Silverton, febrero de 1924)
const heridas = (padre) => [
    {nombre: `herida_del_${padre}`, padre, enganche: {parte: "pierna_dc"}, en: [27, -3], elipse: [4, 2.2], color: "rgba(140,50,40,0.75)"},
    {nombre: `herida_tras_${padre}`, padre, enganche: {parte: "pierna_tc"}, en: [-35, -3], elipse: [4, 2.2], color: "rgba(140,50,40,0.6)"}];
const escena5 = {
    tipo: "escena", nombre: "5. El regreso", duracion: 12600, precision: "decimal", zona_segura: ZONA,
    // camara fija y, en el reencuentro, se acerca (sin salirse del fondo)
    camara: {...VERT, centro: [380, 880], zoom: 1.2, claves: {x: [[0, 380, "suave"], [7200, 380, "suave"], [8400, 320]], y: [[0, 880, "suave"], [7200, 880, "suave"], [8400, 905]],
        zoom: [[0, 1.2, "suave"], [7200, 1.2, "suave"], [8400, 1.85]]}},
    objetos: [
        fondo("Fondo Silverton", 360),
        {nombre: "gris_febrero", en: [0, 0], plano: -9, rect: [-200, -200, 920, SUELO + 520], color: "rgba(140,150,165,0.5)", mezcla: "multiplicar"},
        {nombre: "charcos", en: [0, 0], plano: -2, partes: [[150, 26, 8], [430, 34, 6], [600, 22, 5]].map(([x, w, h], k) => ({nombre: `charco_${k}`, en: [x, SUELO + 30], elipse: [w, h], color: "rgba(160,175,190,0.6)"}))},
        {instancia: "Hija", nombre: "hija", en: [60, SUELO], escala: 0.85, evento: "Quieto"},
        {instancia: "Bobbie", nombre: "bobbie", en: [820, SUELO], evento: "Cojear"},
        ...heridas("bobbie"),
        lluviaTrazos("llovizna", 40, 760, 300, 860, 45, {periodo: 760, largo: 22, color: "rgba(120,135,150,0.45)"}),
        {nombre: "barro", padre: "bobbie", enganche: "lomo", partes: [{nombre: "barro_1", en: [-10, 30], elipse: [14, 4], color: "rgba(90,70,50,0.45)"},
            {nombre: "barro_2", en: [20, 34], elipse: [9, 3], color: "rgba(90,70,50,0.4)"}]},
    ],
    pasos: [
        {caminar: "hija", a: [250, SUELO], desde: 200, hasta: 2600, luego: "Quieto"},
        {caminar: "bobbie", a: [520, SUELO], desde: 900, hasta: 5000, accion: "Cojear", luego: "Quieto"},
        {caminar: "bobbie", a: [340, SUELO], desde: 6500, hasta: 7300, accion: "Correr", luego: "Cola"},
    ],
    dialogos: [
        titulo("6 meses después", 200, 4200),
        titulo("Silverton, febrero de 1924", 700, 4200, {en: {cuadro: "arriba-centro", desplazar: [0, 56]}, tamano: 28, color: "#ffe9c4"}),
        narrador("Seis meses después, en Silverton, una de las hijas lo vio en la calle.", 300, 4900),
        {quien: "hija", texto: "¿Bobbie…?", desde: 5050, hasta: 6200},
        {quien: "hija", texto: "¡BOBBIE!", desde: 6300, hasta: 7600, estilo: "grito"},
        narrador("Flaco, con las patas destrozadas… pero en casa.", 7900, 12400),
    ],
};
escena5.objetos.find((o) => o.nombre === "hija").acciones = [[7200, "Abrazar"]];

// ================================================================== 6. LA LEYENDA
const XA6 = 360, XB6 = 1360, XC6 = 2360, TB6 = 3600, TC6 = 7000;
const diario = {nombre: "diario", en: [XB6, 760], plano: 5, partes: [
    {nombre: "diario_papel", rect: [-190, -250, 190, 250], color: "#efe6d2", borde: "#b9a882"},
    {nombre: "diario_cabecera", rect: [-170, -232, 170, -196], color: "#2a2420"},
    {nombre: "diario_raya", rect: [-170, -188, 170, -185], color: "#2a2420"},
    {nombre: "diario_foto", rect: [-150, -60, 150, 150], color: "#c9b48a", borde: "#6a5a40"},
    ...Array.from({length: 6}, (_, k) => ({nombre: `diario_linea_${k}`, rect: [-150, 166 + k * 12, k % 2 ? 90 : 150, 172 + k * 12], color: "rgba(60,50,40,0.45)"}))],
    claves: {rotacion: [[0, 540], [TB6, 540, "salir"], [TB6 + 900, 0]], escala_x: [[0, 0.05], [TB6, 0.05, "salir"], [TB6 + 900, 1]], escala_y: [[0, 0.05], [TB6, 0.05, "salir"], [TB6 + 900, 1]]}};
const escena6 = {
    tipo: "escena", nombre: "6. La leyenda", duracion: 11000, precision: "decimal", zona_segura: ZONA,
    camara: {...VERT, centro: [XA6, 880], zoom: 1.15, claves: {
        x: [[0, XA6 + 20, "mantener"], [TB6, XB6, "mantener"], [TC6, XC6 + 70, "suave"], [11000, XC6 + 76]],
        y: [[0, 880, "mantener"], [TB6, 760, "mantener"], [TC6, 880, "suave"], [11000, 878]],
        zoom: [[0, 1.15, "mantener"], [TB6, 1.0, "mantener"], [TC6, 2.6, "suave"], [11000, 2.75]]}},
    objetos: [
        // A: la familia en el porche, con Bobbie
        fondo("Fondo Silverton", XA6),
        {instancia: "Frank", nombre: "frank", en: [XA6 - 200, SUELO], evento: "Quieto"},
        {instancia: "Elizabeth", nombre: "elizabeth", en: [XA6 - 130, SUELO], evento: "Quieto"},
        {instancia: "Hija", nombre: "hija", en: [XA6 - 50, SUELO], escala: 0.85, evento: "Quieto"},
        {instancia: "Bobbie", nombre: "bobbie", en: [XA6 + 60, SUELO], evento: "Sentado", acciones: [[1600, "Cola"]]},
        // B: el diario entra girando (con la foto de Bobbie en sepia)
        fondo("Fondo Silverton", XB6),
        {nombre: "oscuro_diario", en: [0, 0], plano: 4, rect: [XB6 - 460, -200, XB6 + 460, SUELO + 520], color: "rgba(30,20,12,0.7)"},
        diario,
        {instancia: "Bobbie", nombre: "bobbie_foto", padre: "diario", en: [-30, 140], escala: 1.25, evento: "Sentado"},
        {nombre: "foto_sepia", padre: "diario", en: [0, 0], rect: [-150, -60, 150, 150], color: "rgba(150,110,60,0.35)", mezcla: "multiplicar"},
        // C: al atardecer, primer plano de Bobbie
        fondo("Fondo Silverton", XC6),
        {nombre: "atardecer", en: [0, 0], plano: -9, rect: [XC6 - 460, -200, XC6 + 460, SUELO + 520], color: "rgba(255,150,90,0.35)", mezcla: "multiplicar"},
        {nombre: "sol_bajo", en: [XC6 + 220, 620], plano: -9, circulo: {r: 140, lados: 30}, mezcla: "suma",
            degradado: {tipo: "radial", centro: [0, 0], radio: 140, colores: [[0, "rgba(255,220,150,0.7)"], [1, "rgba(255,160,80,0)"]]}},
        {instancia: "Bobbie", nombre: "bobbie_final", en: [XC6, SUELO], evento: "Sentado", acciones: [[TC6 + 900, "Cola"]]},
    ],
    dialogos: [
        narrador("Bobbie se volvió una leyenda.", 300, TB6 - 100),
        {quien: "diario", texto: "EL PERRO MARAVILLA", desde: TB6 + 1000, hasta: TC6 - 100, estilo: "texto", en: [0, -100], tamano: 30, color: "#2a2420", fuente: "serif", velocidad: 0, alinear: "centro"},
        {quien: "diario", texto: "Caminó 4.000 km para volver a casa", desde: TB6 + 1200, hasta: TC6 - 100, estilo: "texto", en: [0, -70], tamano: 17, color: "#4a3e34", fuente: "serif", velocidad: 0, alinear: "centro"},
        narrador("Todavía hoy su pueblo lo recuerda.", TB6 + 300, TC6 - 100),
        {texto: "Algunos amores no conocen distancia.", desde: TC6 + 1200, hasta: 11000, estilo: "texto", en: {cuadro: "centro", desplazar: [0, -260]}, tamano: 46, color: "#fff8e8",
            fuente: "serif", velocidad: 0, resplandor: 10, ancho: 520, alinear: "centro", entrada: 700},
        narrador("Porque algunos amores… no conocen distancia.", TC6 + 300, 10800),
        titulo("Historia real · 1923–1924", TC6 + 2400, 11000, {tamano: 24, color: "#ffe2a8", velocidad: 0}),
    ],
};

// ------------------------------------------------------------------ voces (fase 5, ElevenLabs; voces.mjs)
// narrador Damián (sobrio); Frank: Marco Ruiz; Elizabeth: Emma; la hija: Denisse. La boca de las personas se abre con su voz.
const BOCA = {parte: "boca", prop: "escala_y", cerrada: 0.6, abierta: 2.6};
const VOCES = {
    narrador: {motor: "elevenlabs", voz: "BPwS5yO6aXvwg8auqNwS"},   // Damián, relato sobrio (antes Japa)
    frank: {motor: "elevenlabs", voz: "Yzf6MbjAm6T3WgC7SBWE", boca: BOCA},
    elizabeth: {motor: "elevenlabs", voz: "tbfu7H6JPPlpF9clW89V", boca: BOCA},
    hija: {motor: "elevenlabs", voz: "JLjbyFxQ9y50fnjDTvoD", boca: BOCA},
};
for (const e of [escena1, escena2, escena3, escena4, escena5, escena6]) e.voces = VOCES;

guardar("escena_1.json", escena1);
guardar("escena_2.json", escena2);
guardar("escena_3.json", escena3);
guardar("escena_4.json", escena4);
guardar("escena_5.json", escena5);
guardar("escena_6.json", escena6);
console.log("escenas 1 a 6 escritas en", DIR);
