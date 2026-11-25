// Pruebas de Clases/EditorEvento/Notas.js (planeacion_autoria_ia.md, fase IA-6): que objeto (y parte) queda bajo
// el punto donde el usuario marca una nota.
import {test} from "node:test";
import assert from "node:assert/strict";
import path from "path";
import {fileURLToPath} from "url";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";
import {cargarCarpeta} from "../lib/memoria.mjs";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../ejemplos/enganches");
const {Render, Notas} = await cargarMotor();

test("objeto y parte bajo el punto (lo mas chico que lo contiene)", async () => {
    const fn = Notas.objetoEn;
    const {m} = await (await cargarCarpeta(DIR, {avisar: () => {}})).preparar("escena.json");
    Render.dibujarCuadro(m, createCanvas(16, 16).getContext("2d"), 16, 16, 600);
    const cabeza = Render.cajaMundo(m, "beto::cabeza");
    const r = fn(m, (cabeza.x0 + cabeza.x1) / 2, (cabeza.y0 + cabeza.y1) / 2 + 4);
    assert.equal(r.objeto, "beto");
    assert.ok(["cabeza", "ojo", "pelo"].includes(r.parte), JSON.stringify(r));
    const copa = Render.cajaMundo(m, "copa");
    assert.equal(fn(m, (copa.x0 + copa.x1) / 2, (copa.y0 + copa.y1) / 2).objeto, "copa", "la copa enganchada es mas chica que beto");
    assert.equal(fn(m, -5000, -5000), null);
});
