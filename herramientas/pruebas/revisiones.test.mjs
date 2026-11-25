// Pruebas de lib/revisiones.mjs (planeacion_autoria_ia.md, fase IA-2): las partes puras.
import {test} from "node:test";
import assert from "node:assert/strict";
import {tramosQueSePisan, partesQueSeOcultan} from "../lib/revisiones.mjs";

test("voces que se pisan", () => {
    const r = tramosQueSePisan([{nombre: "b", t: 1500, fin: 3000}, {nombre: "a", t: 0, fin: 2000}, {nombre: "c", t: 3000, fin: 4000}]);
    assert.equal(r.length, 1);
    assert.deepEqual([r[0].a.nombre, r[0].b.nombre, r[0].desde, r[0].hasta], ["a", "b", 1500, 2000]);
    assert.equal(tramosQueSePisan([{nombre: "a", t: 0, fin: 1030}, {nombre: "b", t: 1000, fin: 2000}]).length, 0, "un roce de menos de 50 ms no cuenta");
});

const muestra = (t, op, dueno = {op: 1, enCuadro: true}) => ({t, partes: new Map([["tomas::copa", op]]), duenos: new Map([["tomas", dueno]])});

test("una parte que se oculta con su dueño en cuadro y no vuelve", () => {
    const r = partesQueSeOcultan([muestra(0, 1), muestra(200, 1), muestra(400, 0), muestra(600, 0), muestra(800, 0)]);
    assert.deepEqual(r, [{objeto: "tomas", parte: "copa", t: 400, hasta: 800}]);
});

test("no avisa si vuelve, si nunca se vio o si el dueño tambien se va", () => {
    assert.equal(partesQueSeOcultan([muestra(0, 1), muestra(200, 0), muestra(400, 1)]).length, 0, "vuelve");
    assert.equal(partesQueSeOcultan([muestra(0, 0), muestra(200, 0), muestra(400, 0)]).length, 0, "nunca se vio");
    const fuera = {op: 1, enCuadro: false};
    assert.equal(partesQueSeOcultan([muestra(0, 1), muestra(200, 0, fuera), muestra(400, 0, fuera)]).length, 0, "el dueño salio de cuadro");
    const invisible = {op: 0, enCuadro: true};
    assert.equal(partesQueSeOcultan([muestra(0, 1), muestra(200, 0, invisible), muestra(400, 0, invisible)]).length, 0, "el dueño se desvanecio con ella");
});
