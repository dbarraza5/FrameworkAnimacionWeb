#!/usr/bin/env node
// Fase A3: dibuja una escena (documento de eventos) SIN navegador, con el motor real.
//
//   node herramientas/render.mjs <escena: id o nombre> --t 3000 [--salida cuadro.png]
//   node herramientas/render.mjs <escena> --desde 0 --hasta 8000 --fps 12 --gif salida.gif
//   node herramientas/render.mjs <escena> --t 0,2000,4000 --hoja hoja.png   (varios cuadros en una imagen)
//
// Opciones: --ancho 640 (alto segun la camara) · --todo (encuadra toda la escena en vez de la camara)
//           --fondo "#ffffff" · --proyecto <id> (sin llave, para buscar la escena por nombre)
// Con AUTORIA_LLAVE lee todo por la API /autoria (proyecto de la llave); sin llave, Mongo directo (desarrollo).
// Corre dentro del contenedor del frontend (docker exec -w /home/app frontend_container node herramientas/render.mjs ...).
import fs from "fs";

// salida cortada (p. ej. con "| head"): terminar sin error
process.stdout.on("error", (e) => { if (e.code === "EPIPE") process.exit(0); });
import {createCanvas} from "canvas";
import gifenc from "gifenc";
import {cargarMotor} from "./lib/motor.mjs";
import {documentoEventos, cargadorAssets, cerrar} from "./lib/datos.mjs";

const {GIFEncoder, quantize, applyPalette} = gifenc;

function argumentos(argv) {
    const a = {_: []};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            const k = argv[i].slice(2);
            const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
            a[k] = v;
        } else a._.push(argv[i]);
    }
    return a;
}

// Prepara el motor con la escena y espera a que carguen todos sus assets.
export async function prepararEscena(idONombre, {proyecto} = {}) {
    const {GestionEvento} = await cargarMotor();
    // (tambien acepta el documento ya armado, p. ej. recien compilado, sin guardarlo)
    const doc = idONombre && typeof idONombre === "object" ? idONombre : await documentoEventos(idONombre, proyecto);
    if (!doc) throw new Error(`no existe la escena "${idONombre}"`);
    const m = new GestionEvento();
    m.cargadorAssets = cargadorAssets();
    m.inicializar(doc.eventos || [], doc.grupos_figuras || [], String(doc._id));
    m.asegurarCamara();
    m.escena = doc.escena || {};
    m.configuracion_lienzo.x_delta_original = 0;
    m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();                       // primer cuadro: activa relojes y pide los assets
    // esperar los assets (y los assets que pidan al cargarse)
    for (let vuelta = 0; vuelta < 200; vuelta++) {
        const pendientes = [...m.assets.values()].filter((a) => a.estado === "cargando");
        if (!pendientes.length) break;
        await new Promise((r) => setTimeout(r, 20));
        if (vuelta % 5 === 4) m.procesandoEventos();
    }
    const errores = [...m.assets.values()].filter((a) => a.estado === "error").map((a) => `${a.id}: ${a.error}`);
    m.procesandoEventos();
    return {m, doc, errores};
}

// El dibujo de cada cuadro es el mismo del editor (src/Clases/Autoria/Render.js).
export async function dibujarCuadro(m, ctx, w, h, t, opciones) {
    const {Render} = await cargarMotor();
    Render.dibujarCuadro(m, ctx, w, h, t, opciones);
}

function tamano(m, a) {
    const r = m.rectCamara() || {w: 1280, h: 720};
    const ancho = parseInt(a.ancho || "640", 10);
    return {w: ancho, h: Math.round(ancho * (a.todo ? 9 / 16 : r.h / r.w))};
}

async function principal() {
    const a = argumentos(process.argv.slice(2));
    if (!a._[0]) {
        process.stdout.write("uso: render.mjs <escena> (--t 3000 [--salida x.png] | --t 0,2000 --hoja x.png | --desde 0 --hasta 8000 --fps 12 --gif x.gif)\n");
        process.exit(2);
    }
    const inicio = Date.now();
    const {m, doc, errores} = await prepararEscena(a._[0], {proyecto: a.proyecto});
    if (errores.length) process.stdout.write(`AVISO: assets que no cargaron: ${errores.join("; ")}\n`);
    const {w, h} = tamano(m, a);
    const opciones = {todo: !!a.todo, fondo: a.fondo || "#ffffff"};

    if (a.gif) {
        const desde = parseInt(a.desde || "0", 10);
        const hasta = parseInt(a.hasta || String(m.duracionReproduccion() * 1000), 10);
        const fps = parseFloat(a.fps || "12");
        const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
        const gif = GIFEncoder();
        let n = 0;
        for (let t = desde; t <= hasta; t += 1000 / fps, n++) {
            await dibujarCuadro(m, ctx, w, h, t, opciones);
            const {data} = ctx.getImageData(0, 0, w, h);
            const paleta = quantize(data, 256);
            gif.writeFrame(applyPalette(data, paleta), w, h, {palette: paleta, delay: Math.round(1000 / fps)});
        }
        gif.finish();
        fs.writeFileSync(a.gif, gif.bytes());
        process.stdout.write(`GIF ${a.gif}: ${n} cuadros ${w}x${h} de "${doc.nombre}" en ${((Date.now() - inicio) / 1000).toFixed(1)} s\n`);
    } else {
        const tiempos = String(a.t ?? "0").split(",").map((x) => parseInt(x, 10));
        if (tiempos.length > 1 || a.hoja) {
            const cols = Math.min(tiempos.length, 3), filas = Math.ceil(tiempos.length / cols);
            const hoja = createCanvas(w * cols, h * filas), hc = hoja.getContext("2d");
            const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
            for (const [i, t] of tiempos.entries()) {
                await dibujarCuadro(m, ctx, w, h, t, opciones);
                hc.drawImage(canvas, (i % cols) * w, Math.floor(i / cols) * h);
                hc.fillStyle = "rgba(0,0,0,0.6)";
                hc.fillRect((i % cols) * w, Math.floor(i / cols) * h, 70, 20);
                hc.fillStyle = "#fff";
                hc.font = "13px sans-serif";
                hc.fillText(`${(t / 1000).toFixed(2)} s`, (i % cols) * w + 6, Math.floor(i / cols) * h + 14);
            }
            const salida = (typeof a.hoja === "string" && a.hoja) || a.salida || "hoja.png";
            fs.writeFileSync(salida, hoja.toBuffer("image/png"));
            process.stdout.write(`PNG ${salida}: ${tiempos.length} cuadros de "${doc.nombre}"\n`);
        } else {
            const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
            await dibujarCuadro(m, ctx, w, h, tiempos[0], opciones);
            const salida = a.salida || "cuadro.png";
            fs.writeFileSync(salida, canvas.toBuffer("image/png"));
            process.stdout.write(`PNG ${salida}: "${doc.nombre}" en t=${tiempos[0]} ms (${w}x${h})\n`);
        }
    }
    await cerrar();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    principal().catch(async (e) => { process.stderr.write(`ERROR: ${e.stack || e}\n`); await cerrar(); process.exit(1); });
}
