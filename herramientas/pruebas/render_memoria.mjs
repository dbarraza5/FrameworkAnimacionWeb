// Render de una carpeta de ejemplo (asset_NN.json + escena.json) SIN guardarla: compila los
// assets en memoria, se los da al motor y dibuja una hoja de cuadros. Sirve para revisar un
// generador antes de crear nada en la base.
//   node herramientas/pruebas/render_memoria.mjs <carpeta> --t 0,1000,2000 --hoja /tmp/render/x.png [--ancho 480] [--recorte x0,y0,w,h]
//   [--escena historia_1.json]: otra escena de la carpeta (por defecto escena.json) · [--formato vertical] (IA-3)
//   [--escena a.json,b.json,c.json] con --gif: las escenas una tras otra, cada una completa (sin --hasta)
//   node herramientas/pruebas/render_memoria.mjs <carpeta> --desde 0 --hasta 6000 --fps 12 --gif /tmp/render/x.gif [--ancho 480]
//   --zona x,y,w,h | objeto:<nombre>[,margen] (en el MUNDO) · --cajas [a,b] · --rejilla 100 · --lista  (lib/vista.mjs)
import fs from "fs";
import path from "path";
import {createCanvas} from "canvas";
import gifenc from "gifenc";
import {cargarMotor} from "../lib/motor.mjs";
import {cargarCarpeta} from "../lib/memoria.mjs";
import {cuadro, leerZona, proporcion, textoLista} from "../lib/vista.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0];
const {Render} = await cargarMotor();
const carpeta = await cargarCarpeta(dir).catch((e) => { console.error(e.message); process.exit(1); });
const prepararMotor = async (archivo) => (await carpeta.preparar(archivo, {formato: opt("formato")})).m;
const escenas = opt("escena", "escena.json").split(",");
const m = await prepararMotor(escenas[0]);

const ancho = parseInt(opt("ancho", "480"), 10);
// IA-1 (lib/vista.mjs): --zona en el mundo, --cajas, --rejilla, --lista
const bandera = (k) => { const i = args.indexOf("--" + k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const zona = leerZona(opt("zona"), Render);
const ayudas = {zona, cajas: bandera("cajas"), rejilla: opt("rejilla"), lista: !!bandera("lista")};
const w = ancho, h = Math.round(ancho * proporcion(m, zona));
if (opt("gif")) {
    const {GIFEncoder, quantize, applyPalette} = gifenc;
    const fps = parseFloat(opt("fps", "12"));
    const gif = GIFEncoder(), c = createCanvas(w, h), cx = c.getContext("2d");
    let n = 0;
    for (const [i, archivo] of escenas.entries()) {
        const me = i === 0 ? m : await prepararMotor(archivo);
        // una sola escena: --desde/--hasta; varias: cada una completa
        const desde = escenas.length > 1 ? 0 : parseFloat(opt("desde", "0"));
        const hasta = escenas.length > 1 ? me._duracion : parseFloat(opt("hasta", "3000"));
        for (let t = desde; t < hasta; t += 1000 / fps, n++) {
            await cuadro(me, cx, w, h, t, {...ayudas, lista: false});
            const data = cx.getImageData(0, 0, w, h).data, paleta = quantize(data, 256);
            gif.writeFrame(applyPalette(data, paleta), w, h, {palette: paleta, delay: Math.round(1000 / fps)});
        }
    }
    gif.finish();
    fs.mkdirSync(path.dirname(opt("gif")), {recursive: true});
    fs.writeFileSync(opt("gif"), gif.bytes());
    process.stderr.write(`GIF ${n} cuadros -> ${opt("gif")}\n`);
    process.exit(0);
}
const ts = opt("t", "0").split(",").map(Number);
const rec = opt("recorte") ? opt("recorte").split(",").map(Number) : null;   // en pixeles del cuadro
const cw = rec ? rec[2] : w, ch = rec ? rec[3] : h;
const cols = Math.min(ts.length, parseInt(opt("columnas", "4"), 10));
const hoja = createCanvas(cw * cols, ch * Math.ceil(ts.length / cols)), hx = hoja.getContext("2d");
const t0 = Date.now();
for (let i = 0; i < ts.length; i++) {
    const c = createCanvas(w, h);
    const l = await cuadro(m, c.getContext("2d"), w, h, ts[i], ayudas);
    if (l) process.stdout.write(textoLista(l) + "\n");
    hx.drawImage(c, rec ? rec[0] : 0, rec ? rec[1] : 0, cw, ch, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    hx.fillStyle = "#fff"; hx.font = "12px sans-serif"; hx.fillText(`t=${ts[i]}`, (i % cols) * cw + 6, Math.floor(i / cols) * ch + 14);
}
const salida = opt("hoja", "/tmp/render/memoria.png");
fs.mkdirSync(path.dirname(salida), {recursive: true});
fs.writeFileSync(salida, hoja.toBuffer("image/png"));
process.stderr.write(`${ts.length} cuadros en ${Date.now() - t0} ms -> ${salida}\n`);
