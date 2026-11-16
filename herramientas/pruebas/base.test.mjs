// Pruebas contra la base (solo lectura, Fase A1): cada documento del proyecto de ejemplo
// se descompila y se vuelve a compilar sin cambios, y en las escenas el render del
// original y el de la vuelta son identicos pixel a pixel (mismo dibujo y misma fisica).
// Si la base no responde, se saltan.   PRUEBAS_PROYECTO=<id> para otro proyecto.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";
import {diferencias} from "../lib/comparar.mjs";
import {db, cerrar} from "../lib/datos.mjs";
import {prepararEscena, dibujarCuadro} from "../render.mjs";

const PROYECTO = process.env.PRUEBAS_PROYECTO || "6af48d71b2479cd1dfc94dea";
const {Compilador, Descompilador, Fisica} = await cargarMotor();

let docs = null;
try {
    const base = await Promise.race([db(), new Promise((_, no) => setTimeout(() => no(new Error("sin respuesta")), 3000))]);
    docs = await base.collection("eventos").find({id_proyecto: PROYECTO}).toArray();
} catch (e) {
    docs = null;
}
const sinBase = !docs || !docs.length ? "la base no responde o el proyecto no tiene documentos" : false;

const catalogo = new Map((docs || []).map((d) => [d.nombre, {id: String(d._id), eventos: (d.eventos || []).map((e) => e.nombre)}]));
const nombrePorId = new Map((docs || []).map((d) => [String(d._id), d.nombre]));

function vuelta(doc) {
    const {def} = Descompilador.descompilar(doc, (id) => nombrePorId.get(String(id)) || null);
    const r = Compilador.compilar(def, (n) => catalogo.get(n) || null);
    assert.deepEqual(r.errores, [], doc.nombre);
    return {def, resultado: {...r.resultado, _id: doc._id}};
}

test("cada documento del proyecto: descompilar y compilar da lo mismo", {skip: sinBase}, () => {
    for (const doc of docs) {
        const {resultado} = vuelta(doc);
        assert.deepEqual(diferencias(doc, resultado, {efectoDefecto: Fisica.efectoDefecto}), [], doc.nombre);
    }
});

test("escenas: el render del original y el de la vuelta son identicos", {skip: sinBase}, async () => {
    const escenas = docs.filter((d) => Descompilador.esEscena(d));
    assert.ok(escenas.length > 0);
    const w = 320;
    for (const doc of escenas) {
        const a = await prepararEscena(doc);
        const b = await prepararEscena(vuelta(doc).resultado);
        const h = Math.round(w * 9 / 16);
        const ca = createCanvas(w, h), cb = createCanvas(w, h);
        const dur = (doc.eventos.find((e) => e.nombre === "EventoGeneral") || {}).tiempo_final || 4000;
        for (const t of [0, Math.round(dur * 0.4), Math.round(dur * 0.8)]) {
            await dibujarCuadro(a.m, ca.getContext("2d"), w, h, t);
            await dibujarCuadro(b.m, cb.getContext("2d"), w, h, t);
            const pa = ca.getContext("2d").getImageData(0, 0, w, h).data, pb = cb.getContext("2d").getImageData(0, 0, w, h).data;
            let distintos = 0;
            for (let i = 0; i < pa.length; i += 4) if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2]) distintos++;
            assert.equal(distintos, 0, `${doc.nombre} en t=${t}: ${distintos} pixeles distintos`);
        }
    }
});

test.after(() => cerrar());
