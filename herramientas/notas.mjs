#!/usr/bin/env node
// Notas de correccion del usuario (planeacion_autoria_ia.md, fase IA-6): las marca en el editor (pestana
// Notas) en un instante y un punto del dibujo. Esta herramienta se las muestra a la IA y le deja responderlas.
//
//   node herramientas/notas.mjs <escena: id o nombre> [--todas]            lista las pendientes (--todas: tambien las resueltas)
//   node herramientas/notas.mjs <escena> --recortes /tmp/render/notas      ademas, una imagen por nota: la zona alrededor del
//                                                                           punto en ese instante, con la marca (y el cuadro entero)
//   AUTORIA_LLAVE=... node herramientas/notas.mjs <escena> --responder <id_nota> --texto "qué se hizo" [--resuelta]
//
// Con AUTORIA_LLAVE lee por la API /autoria (proyecto de la llave); sin llave, Mongo directo (desarrollo, solo leer).
import fs from "fs";
import path from "path";
import {createCanvas} from "canvas";
import {cerrar, documentoEventos, pedirApi, usaApi} from "./lib/datos.mjs";
import {prepararEscena} from "./render.mjs";
import {cuadroConVista} from "./lib/vista.mjs";

process.stdout.on("error", (e) => { if (e.code === "EPIPE") process.exit(0); });
const salida = (s) => process.stdout.write(s + "\n");
const seg = (t) => `${(t / 1000).toFixed(1)} s`;

function argumentos(argv) {
    const a = {_: []};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            const k = argv[i].slice(2);
            a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
        } else a._.push(argv[i]);
    }
    return a;
}

// marca de la nota sobre un cuadro: un circulo en el punto (en pixeles del cuadro)
function marcar(ctx, vista, n, num) {
    const x = n.x * vista.esc + vista.ox, y = n.y * vista.esc + vista.oy;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = 3; ctx.strokeStyle = "#e8590c";
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#e8590c"; ctx.font = "bold 14px sans-serif"; ctx.fillText(String(num), x + 18, y - 12);
    ctx.restore();
}

async function principal() {
    const a = argumentos(process.argv.slice(2));
    if (!a._[0]) { salida('uso: notas.mjs <escena> [--todas] [--recortes <carpeta>] | --responder <id> --texto "..." [--resuelta]'); process.exitCode = 2; return; }
    const doc = await documentoEventos(a._[0], a.proyecto);
    if (!doc) throw new Error(`no existe la escena "${a._[0]}"`);
    const notas = (doc.escena && doc.escena.notas) || [];

    if (a.responder) {
        if (!usaApi()) throw new Error("responder necesita AUTORIA_LLAVE (escribe por la API)");
        const cuerpo = {};
        if (typeof a.texto === "string") cuerpo.respuesta = a.texto;
        if (a.resuelta) cuerpo.resuelta = true;
        if (!Object.keys(cuerpo).length) throw new Error('falta --texto "qué se hizo" y/o --resuelta');
        const r = await pedirApi(`/eventos/${doc._id}/notas/${a.responder}`, "PUT", cuerpo);
        salida(`nota ${r.nota.id}: ${r.nota.resuelta ? "resuelta" : "abierta"}${r.nota.respuesta ? ` · "${r.nota.respuesta}"` : ""}`);
        return;
    }

    const lista = notas.map((n, i) => ({n, num: i + 1})).filter(({n}) => a.todas || !n.resuelta);
    const pend = notas.filter((n) => !n.resuelta).length;
    salida(`Escena "${doc.nombre}" (${doc._id}): ${pend} nota(s) pendiente(s) de ${notas.length}`);
    for (const {n, num} of lista) {
        salida(`\n#${num} [${n.id}] ${n.resuelta ? "RESUELTA" : "PENDIENTE"} · t=${n.t} ms (${seg(n.t)}) · punto [${n.x}, ${n.y}]` +
            (n.objeto ? ` · ${n.objeto}${n.parte ? " › " + n.parte : ""}` : ""));
        salida(`   "${n.texto}"`);
        if (n.respuesta) salida(`   respuesta: ${n.respuesta}`);
    }
    if (!a.recortes || !lista.length) return;
    const dir = typeof a.recortes === "string" ? a.recortes : "/tmp/render/notas";
    fs.mkdirSync(dir, {recursive: true});
    const {m} = await prepararEscena(doc);
    for (const {n, num} of lista) {
        // la zona: un cuarto del ancho de lo que ve la camara, alrededor del punto; y el cuadro entero al lado
        const rc0 = m.rectCamara() || {w: 1280, h: 720};
        const w = Math.max(160, rc0.w * 0.35), h = w * 0.75;
        const hoja = createCanvas(960, 360), hx = hoja.getContext("2d");
        const c1 = createCanvas(480, 360), c2 = createCanvas(480, Math.round(480 * rc0.h / rc0.w));
        const {vista: v1} = await cuadroConVista(m, c1.getContext("2d"), 480, 360, n.t, {zona: {x0: n.x - w / 2, y0: n.y - h / 2, w, h}, cajas: n.objeto || undefined});
        marcar(c1.getContext("2d"), v1, n, num);
        hx.fillStyle = "#222"; hx.fillRect(0, 0, 960, 360);
        hx.drawImage(c1, 0, 0);
        const {vista: v2} = await cuadroConVista(m, c2.getContext("2d"), c2.width, c2.height, n.t);
        marcar(c2.getContext("2d"), v2, n, num);
        hx.drawImage(c2, 480, Math.round((360 - c2.height) / 2));
        hx.fillStyle = "rgba(0,0,0,0.65)"; hx.fillRect(0, 0, 960, 22);
        hx.fillStyle = "#fff"; hx.font = "13px sans-serif";
        hx.fillText(`#${num} · ${seg(n.t)} · ${n.objeto || ""}${n.parte ? " › " + n.parte : ""} · ${n.texto.slice(0, 90)}`, 6, 15);
        const archivo = path.join(dir, `nota_${num}_${n.id}.png`);
        fs.writeFileSync(archivo, hoja.toBuffer("image/png"));
        salida(`   imagen: ${archivo}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    principal().catch((e) => { process.stderr.write(`ERROR: ${e.message || e}\n`); process.exitCode = 1; }).finally(cerrar);
}
