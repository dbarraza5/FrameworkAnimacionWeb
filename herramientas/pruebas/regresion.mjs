#!/usr/bin/env node
// Prueba de regresion visual: dibuja TODOS los documentos de eventos de la base (escenas y
// assets) en varios instantes y guarda un hash de los pixeles de cada cuadro.
//
//   node herramientas/pruebas/regresion.mjs guardar /tmp/base.json    (antes de cambiar el motor)
//   node herramientas/pruebas/regresion.mjs comparar /tmp/base.json   (despues: lista lo que cambio)
//
// Sirve para comprobar que un cambio del motor no altera animaciones ya hechas.
// Lee Mongo directo (sin llave), en solo lectura.
import fs from "fs";
import crypto from "crypto";
import {createCanvas} from "canvas";
import {prepararEscena, dibujarCuadro} from "../render.mjs";
import {db, cerrar} from "../lib/datos.mjs";

const [modo, archivo] = process.argv.slice(2);
if (!["guardar", "comparar"].includes(modo) || !archivo) {
    process.stdout.write("uso: regresion.mjs guardar|comparar <archivo.json>\n");
    process.exit(2);
}

const ANCHO = 320;

async function huellas() {
    const docs = await (await db()).collection("eventos").find({}, {projection: {_id: 1, nombre: 1, eventos: 1}}).toArray();
    const res = {};
    for (const d of docs) {
        const id = String(d._id);
        try {
            const {m, errores} = await prepararEscena(id);
            const raiz = (d.eventos || []).find((e) => e.nombre === "EventoGeneral") || (d.eventos || [])[0];
            const dur = raiz ? Math.max(0, (raiz.tiempo_final || 0) - (raiz.tiempo_inicio || 0)) : 0;
            const ts = [0, 0.13, 0.37, 0.61, 0.89].map((f) => Math.round(f * dur));
            const r = m.rectCamara() || {w: 1280, h: 720};
            const w = ANCHO, h = Math.round(ANCHO * r.h / r.w);
            const cuadros = [];
            for (const t of ts) {
                const c = createCanvas(w, h);
                await dibujarCuadro(m, c.getContext("2d"), w, h, t, {});
                cuadros.push(crypto.createHash("sha1").update(c.getContext("2d").getImageData(0, 0, w, h).data).digest("hex").slice(0, 16));
            }
            res[id] = {nombre: d.nombre, ts, cuadros, errores: errores.length};
        } catch (e) {
            res[id] = {nombre: d.nombre, error: String(e.message || e)};
        }
    }
    return res;
}

const actual = await huellas();
if (modo === "guardar") {
    fs.writeFileSync(archivo, JSON.stringify(actual, null, 1));
    process.stdout.write(`guardadas ${Object.keys(actual).length} huellas en ${archivo}\n`);
} else {
    const base = JSON.parse(fs.readFileSync(archivo, "utf8"));
    let iguales = 0, distintos = 0;
    for (const id in base) {
        const a = base[id], b = actual[id];
        if (!b) { process.stdout.write(`FALTA   ${a.nombre}\n`); distintos++; continue; }
        const cambio = a.error !== b.error || JSON.stringify(a.cuadros) !== JSON.stringify(b.cuadros);
        if (cambio) {
            distintos++;
            const cual = (a.cuadros || []).map((h, i) => (b.cuadros && b.cuadros[i] !== h ? `t=${a.ts[i]}` : null)).filter(Boolean).join(" ");
            process.stdout.write(`CAMBIO  ${a.nombre}  ${b.error || cual}\n`);
        } else iguales++;
    }
    process.stdout.write(`${iguales} iguales, ${distintos} distintos (de ${Object.keys(base).length})\n`);
    if (distintos) process.exitCode = 1;
}
await cerrar();
