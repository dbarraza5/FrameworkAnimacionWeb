// Prueba rapida (sin base de datos) de morphing (claves.forma), jerarquia (padre) y
// relleno avanzado. Dibuja una hoja de cuadros en /tmp/render/mejoras.png.
//   node herramientas/pruebas/prueba_mejoras.mjs
import fs from "fs";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";
import {prepararEscena, dibujarCuadro} from "../render.mjs";

const {Compilador} = await cargarMotor();
const boca = (w, h) => {        // 12 puntos: misma topologia para todas las bocas
    const p = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI; p.push([Math.round(w * Math.cos(a)), Math.round(h * Math.sin(a))]); }
    return p;
};
const def = {
    tipo: "escena", nombre: "prueba_mejoras", duracion: 4000,
    camara: {centro: [640, 360]},
    objetos: [
        {nombre: "Fondo", en: [0, 0], rect: [0, 0, 1280, 720], color: "#20242c",
            degradado: {tipo: "lineal", de: [0, 0], a: [0, 720], colores: [[0, "#3a4a6a"], [1, "#101218"]]}},
        {nombre: "Halo", en: [640, 330], circulo: 220, color: "#ffd27a", desenfoque: 40, mezcla: "suma", opacidad: 0.5},
        {nombre: "Cabeza", en: [640, 420], partes: [],
            claves: {x: [[0, 520], [2000, 760, "suave"], [4000, 520, "suave"]], rotacion: [[0, -15], [2000, 15, "suave"], [4000, -15, "suave"]]}},
        {nombre: "Cara", padre: "Cabeza", en: [0, -120], circulo: {r: 110, ry: 130}, color: "#e8b48f",
            degradado: {tipo: "radial", centro: [-30, -40], radio: 160, colores: [[0, "#f6d0b0"], [1, "#b97c58"]]}},
        {nombre: "Ojos", padre: "Cabeza", en: [0, -150], partes: [
            {nombre: "ojo_i", en: [-40, 0], elipse: [14, 9], color: "#222"},
            {nombre: "ojo_d", en: [40, 0], elipse: [14, 9], color: "#222"}]},
        {nombre: "Boca", padre: "Cabeza", en: [0, -70], partes: [
            {nombre: "labios", poligono: boca(30, 4), color: "#b03a48",
                formas: {a: {poligono: boca(26, 22)}, o: {poligono: boca(14, 16)}, e: {poligono: boca(34, 10)}},
                claves: {forma: [[0, ""], [500, "a", "suave"], [1000, "o", "suave"], [1500, "e", "suave"], [2000, "", "suave"], [2600, "a", "suave"], [3200, "o"]]}}]},
    ],
};
const r = Compilador.compilarEscena(def, () => null, () => null);
if (!r.ok) { console.log(r.errores); process.exit(1); }
if (r.avisos.length) console.log("avisos:", r.avisos);
const {m} = await prepararEscena({...r.resultado, _id: "prueba"});
const ts = [0, 250, 500, 750, 1000, 1250, 1500, 2000];
const w = 320, h = 180, hoja = createCanvas(w * 4, h * 2), cx = hoja.getContext("2d");
for (let i = 0; i < ts.length; i++) {
    const c = createCanvas(w, h);
    await dibujarCuadro(m, c.getContext("2d"), w, h, ts[i], {});
    cx.drawImage(c, (i % 4) * w, Math.floor(i / 4) * h);
    cx.fillStyle = "#fff"; cx.font = "12px sans-serif"; cx.fillText(`t=${ts[i]}`, (i % 4) * w + 6, Math.floor(i / 4) * h + 14);
}
fs.mkdirSync("/tmp/render", {recursive: true});
fs.writeFileSync("/tmp/render/mejoras.png", hoja.toBuffer("image/png"));
console.log("ok /tmp/render/mejoras.png");
