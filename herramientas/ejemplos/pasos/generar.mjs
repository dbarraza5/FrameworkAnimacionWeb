// Ejemplo de la fase IA-5 (planeacion_autoria_ia.md): un personaje con acciones "Caminar" y "Quieto"
// (asset_01.json) y la escena "La copa" (escena.json), armada solo con pasos de alto nivel.
//   node herramientas/ejemplos/pasos/generar.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const DIR = path.dirname(fileURLToPath(import.meta.url));

// ventanas de las acciones en la linea de tiempo del asset
const CAMINAR = [0, 1000], QUIETO = [1200, 2200];
const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
    tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
// balanceo de una extremidad: amplitud a (grados) al caminar, quieta despues
const balanceo = (a) => ({rotacion: [[0, a, "suave"], [500, -a, "suave"], [1000, a, "lineal"], [1200, 0, "lineal"], [2200, 0, "lineal"]]});
const brazo = [[-5, 0], [5, 0], [4, 58], [-4, 58]], pierna = [[-7, 0], [7, 0], [6, 66], [14, 70], [-7, 70]];

const asset = (nombre, c) => ({
    tipo: "asset", nombre, duracion: 2200,
    eventos: [ev("EventoGeneral", "Nodo_Default", 0, 2200), ev("Caminar", "EventoGeneral", ...CAMINAR), ev("Quieto", "EventoGeneral", ...QUIETO)],
    enganches: {mano: {parte: "brazo_del", en: [0, 54]}, cabeza: {parte: "cabeza", en: [0, -16]}},
    partes: [{nombre: "cuerpo", partes: [
        {nombre: "brazo_tras", en: [0, -142], poligono: brazo, color: c.piel_osc, claves: balanceo(22)},
        {nombre: "pierna_tras", en: [0, -70], poligono: pierna, color: c.pantalon_osc, claves: balanceo(-25)},
        {nombre: "torso", poligono: [[-15, -150], [15, -150], [17, -68], [-17, -68]], color: c.ropa},
        {nombre: "pierna_del", en: [0, -70], poligono: pierna, color: c.pantalon, claves: balanceo(25)},
        {nombre: "cabeza", en: [2, -170], circulo: 17, color: c.piel, partes: [
            {nombre: "pelo", poligono: [[-17, -2], [-14, -14], [-2, -19], [12, -16], [17, -6], [4, -9], [-10, -6]], color: c.pelo},
            {nombre: "ojo", en: [9, -2], circulo: {r: 2, lados: 6}, color: "#111111"}]},
        {nombre: "brazo_del", en: [0, -142], poligono: brazo, color: c.piel, claves: balanceo(-22)},
    ]}],
});
fs.writeFileSync(path.join(DIR, "asset_01.json"), JSON.stringify(asset("Caminante", {piel: "#f1c27d", piel_osc: "#d9a866", ropa: "#2e86de", pantalon: "#2c3e66", pantalon_osc: "#1f2c4a", pelo: "#3b2414"}), null, 1));
fs.writeFileSync(path.join(DIR, "asset_02.json"), JSON.stringify(asset("Caminante 2", {piel: "#c68642", piel_osc: "#a86f34", ropa: "#c0392b", pantalon: "#5b3a29", pantalon_osc: "#43291d", pelo: "#111111"}), null, 1));

const escena = {
    tipo: "escena", nombre: "La copa", duracion: 14000,
    camara: {centro: [640, 360]},
    objetos: [
        {nombre: "fondo", en: [0, 0], plano: -10, rect: [-400, -300, 1700, 900], degradado: {tipo: "lineal", de: [0, 0], a: [0, 600], colores: [[0, "#f3e3c3"], [1, "#d9b98a"]]}},
        {nombre: "piso", en: [0, 600], plano: -9, rect: [-400, 0, 1700, 400], color: "#8a5a3b"},
        {nombre: "mesa", en: [640, 600], plano: -2, partes: [
            {nombre: "tablero", rect: [-70, -128, 70, -118], color: "#6b3f22"},
            {nombre: "pata_izq", rect: [-60, -118, -52, 0], color: "#5a341c"},
            {nombre: "pata_der", rect: [52, -118, 60, 0], color: "#5a341c"}]},
        {nombre: "copa", en: [650, 472], plano: -1, capa: 9, partes: [
            {nombre: "vino", poligono: [[-6, -20], [6, -20], [4, -11], [-4, -11]], color: "#9b1d3a"},
            {nombre: "vidrio", poligono: [[-7, -27], [7, -27], [5, -11], [0, -7], [-5, -11]], color: "rgba(255,255,255,0.35)", borde: "#ffffff"},
            {nombre: "pie", rect: [-1, -7, 1, -1], color: "#ffffff"},
            {nombre: "base", rect: [-5, -1, 5, 0], color: "#ffffff"}]},
        {instancia: "Caminante", nombre: "beto", en: [120, 600], escala: 1.3, evento: "Quieto"},
        {instancia: "Caminante 2", nombre: "ana", en: [1180, 600], escala: 1.3, espejo: true, evento: "Quieto"},
    ],
    pasos: [
        {caminar: "beto", a: [580, 600], desde: 300, velocidad: 170, luego: "Quieto"},
        {tomar: "beto", objeto: "copa", enganche: "mano", t: 3400},
        {plano: "medio", de: "beto", desde: 3000, hasta: 4000},
        {caminar: "ana", a: "beto", desde: 4600, velocidad: 170, luego: "Quieto"},
        {mirar: "beto", a: "ana", t: 5200},
        {plano: "general", de: ["beto", "ana"], desde: 5600, hasta: 6600},
        {soltar: "beto", objeto: "copa", t: 8200, en: [610, 472]},
        {caminar: "beto", a: [-200, 600], desde: 8800, velocidad: 170, luego: "Quieto"},
        {caminar: "ana", a: [-200, 600], desde: 9300, velocidad: 230, luego: "Quieto"},
        {plano: "general", de: "ana", desde: 9000, hasta: 10500},
    ],
    dialogos: [
        {quien: "ana", texto: "¿Esa copa es mía?", desde: 6400, hasta: 7900},
        {quien: "beto", texto: "Perdón…", desde: 8000, hasta: 9200},
        {texto: "Escena armada solo con pasos", desde: 200, hasta: 2800, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 28, color: "#5a341c", velocidad: 0},
    ],
};
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(escena, null, 1));
console.log("escrito en", DIR);
