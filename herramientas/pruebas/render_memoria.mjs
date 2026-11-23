// Render de una carpeta de ejemplo (asset_NN.json + escena.json) SIN guardarla: compila los
// assets en memoria, se los da al motor y dibuja una hoja de cuadros. Sirve para revisar un
// generador antes de crear nada en la base.
//   node herramientas/pruebas/render_memoria.mjs <carpeta> --t 0,1000,2000 --hoja /tmp/render/x.png [--ancho 480] [--recorte x0,y0,w,h]
//   [--escena historia_1.json]: otra escena de la carpeta (por defecto escena.json)
//   [--escena a.json,b.json,c.json] con --gif: las escenas una tras otra, cada una completa (sin --hasta)
//   node herramientas/pruebas/render_memoria.mjs <carpeta> --desde 0 --hasta 6000 --fps 12 --gif /tmp/render/x.gif [--ancho 480]
import fs from "fs";
import path from "path";
import {createCanvas} from "canvas";
import gifenc from "gifenc";
import {cargarMotor} from "../lib/motor.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0];
const {Compilador, GestionEvento, Render} = await cargarMotor();

const docs = new Map(), porNombre = new Map();
let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => /^asset_\d+\.json$/.test(f)).sort()) {
    const def = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const r = Compilador.compilar(def, null, () => ({id: "s"}));
    if (!r.ok) { console.error(f, r.errores); process.exit(1); }
    if (r.avisos.length) console.error(f, "avisos:", r.avisos);
    const id = (++n).toString(16).padStart(24, "0");
    docs.set(id, {...r.resultado, _id: id});
    porNombre.set(def.nombre, {id, eventos: r.resultado.eventos.map((e) => e.nombre)});
}
// motor listo para una escena de la carpeta (con sus assets cargados)
async function prepararMotor(archivo) {
    const esc = JSON.parse(fs.readFileSync(path.join(dir, archivo), "utf8"));
    const r = Compilador.compilar(esc, (nombre) => porNombre.get(nombre) || null, () => ({id: "s"}));
    if (!r.ok) { console.error(archivo, r.errores); process.exit(1); }
    if (r.avisos.length) console.error(archivo, "avisos:", r.avisos);
    const m = new GestionEvento();
    m.cargadorAssets = async (id) => docs.get(id);
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "escena");
    m.asegurarCamara();
    m.escena = r.resultado.escena || {};
    m.configuracion_lienzo.x_delta_original = 0;
    m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    for (let v = 0; v < 100 && [...m.assets.values()].some((a) => a.estado === "cargando"); v++) { await new Promise((q) => setTimeout(q, 10)); m.procesandoEventos(); }
    m._duracion = esc.duracion || 3000;
    return m;
}
const escenas = opt("escena", "escena.json").split(",");
const m = await prepararMotor(escenas[0]);

const ancho = parseInt(opt("ancho", "480"), 10);
const rc = m.rectCamara() || {w: 1280, h: 720};
const w = ancho, h = Math.round(ancho * rc.h / rc.w);
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
            Render.dibujarCuadro(me, cx, w, h, t, {});
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
    Render.dibujarCuadro(m, c.getContext("2d"), w, h, ts[i], {});
    hx.drawImage(c, rec ? rec[0] : 0, rec ? rec[1] : 0, cw, ch, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    hx.fillStyle = "#fff"; hx.font = "12px sans-serif"; hx.fillText(`t=${ts[i]}`, (i % cols) * cw + 6, Math.floor(i / cols) * ch + 14);
}
const salida = opt("hoja", "/tmp/render/memoria.png");
fs.mkdirSync(path.dirname(salida), {recursive: true});
fs.writeFileSync(salida, hoja.toBuffer("image/png"));
process.stderr.write(`${ts.length} cuadros en ${Date.now() - t0} ms -> ${salida}\n`);
