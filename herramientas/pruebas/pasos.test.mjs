// Pruebas de Pasos.js (planeacion_autoria_ia.md, fase IA-5): acciones de alto nivel -> claves, acciones y objetos.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";

const {Compilador} = await cargarMotor();
// asset de mentira: mira a la derecha, 60 de ancho y 200 de alto sobre los pies
const ASSET = {id: "a".repeat(24), eventos: ["EventoGeneral", "Caminar", "Quieto"], caja: {x0: -30, y0: -200, x1: 30, y1: 0},
    enganches: {mano: {parte: "brazo", en: [0, 50]}}, partes: ["brazo", "cabeza"]};
const compilar = (def) => Compilador.compilar({tipo: "escena", nombre: "P", duracion: 8000, camara: {centro: [640, 360]}, ...def},
    (n) => (n === "Persona" ? ASSET : null), () => null);
const grupo = (r, n) => r.resultado.grupos_figuras.find((g) => g.nombre === n);
const claves = (g, p) => (g.claves[p] || []).map((k) => [k.t, k.v, k.interp]);
const BETO = {instancia: "Persona", nombre: "beto", en: [200, 600]};
const ANA = {instancia: "Persona", nombre: "ana", en: [1000, 600], espejo: true};

test("caminar: claves de x, se da vuelta y cambia de accion", () => {
    const r = compilar({objetos: [BETO], pasos: [{caminar: "beto", a: [500, 600], desde: 1000, velocidad: 150, luego: "Quieto"}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    const g = grupo(r, "beto");
    assert.deepEqual(claves(g, "x"), [[1000, 200, "lineal"], [3000, 500, "lineal"]], "300 px a 150 px/s = 2 s");
    assert.deepEqual(g.instancia.acciones.map((a) => [a.t, a.evento]), [[1000, "Caminar"], [3000, "Quieto"]]);
    assert.equal(g.claves.escala_x, undefined, "ya miraba a la derecha");
});

test("caminar hacia otro objeto: se detiene a la separacion y gira", () => {
    const r = compilar({objetos: [BETO, ANA], pasos: [{caminar: "ana", a: "beto", desde: 0, hasta: 2000, luego: "Quieto"}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    const g = grupo(r, "ana");
    assert.deepEqual(claves(g, "x"), [[0, 1000, "lineal"], [2000, 320, "lineal"]], "se queda 120 a la derecha de beto");
    assert.equal(g.claves.escala_x, undefined, "ya miraba a la izquierda (espejo)");
});

test("caminar dos veces, ida y vuelta: encadena posiciones y se da vuelta", () => {
    const r = compilar({objetos: [BETO], pasos: [{caminar: "beto", a: [600, 600], desde: 0, hasta: 2000}, {caminar: "beto", a: [300, 600], desde: 3000, hasta: 4000, luego: "Quieto"}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    const g = grupo(r, "beto");
    assert.deepEqual(claves(g, "x").map((k) => [k[0], k[1]]), [[0, 200], [2000, 600], [3000, 600], [4000, 300]]);
    assert.deepEqual(claves(g, "escala_x"), [[0, 1, "mantener"], [3000, -1, "mantener"]]);
});

test("mirar a otro y errores de pasos", () => {
    const r = compilar({objetos: [BETO, ANA], pasos: [{mirar: "beto", a: "izquierda", t: 500}, {mirar: "beto", a: "ana", t: 1500}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    assert.deepEqual(claves(grupo(r, "beto"), "escala_x"), [[0, 1, "mantener"], [500, -1, "mantener"], [1500, 1, "mantener"]]);
    const e = compilar({objetos: [BETO], pasos: [{saltar: "beto"}, {caminar: "nadie", a: [0, 0], desde: 0}, {caminar: "beto", a: [0, 0], desde: 0, accion: "Volar"}]}).errores.join(" ");
    assert.match(e, /no se reconoce/);
    assert.match(e, /"nadie" no es un objeto/);
    assert.match(e, /no tiene el evento "Volar"/);
    const pisa = compilar({objetos: [{...BETO, claves: {x: [[0, 200], [1500, 250], [3000, 300]]}}], pasos: [{caminar: "beto", a: [900, 600], desde: 1000, hasta: 2000}]});
    assert.match(pisa.errores.join(" "), /se pisa con otras claves de x/);
});

test("tomar y soltar: copia colgada de la mano y copia suelta, con opacidad", () => {
    const COPA = {nombre: "copa", en: [400, 520], rect: [-5, -20, 5, 0], color: "#ffffff", capa: 3};
    const r = compilar({objetos: [BETO, COPA], pasos: [{tomar: "beto", objeto: "copa", enganche: "mano", t: 2000}, {soltar: "beto", objeto: "copa", t: 5000, en: [700, 520]}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    const suelta = grupo(r, "copa"), mano = grupo(r, "copa@beto");
    assert.equal(mano.nodo_padre, "beto::brazo");
    assert.deepEqual([mano.cx, mano.cy], [0, 50]);
    assert.deepEqual(claves(mano, "opacidad"), [[0, 0, "mantener"], [2000, 1, "mantener"], [5000, 0, "mantener"]]);
    assert.deepEqual(claves(suelta, "opacidad"), [[0, 1, "mantener"], [2000, 0, "mantener"], [5000, 1, "mantener"]]);
    assert.deepEqual(claves(suelta, "x").map((k) => [k[0], k[1]]), [[0, 400], [5000, 700]], "queda donde se suelta");
    const mal = compilar({objetos: [BETO, COPA], pasos: [{soltar: "beto", objeto: "copa", t: 100, en: [0, 0]}]});
    assert.match(mal.errores.join(" "), /no tiene "copa"/);
});

test("plano: encuadra con la caja del asset", () => {
    const r = compilar({objetos: [BETO], pasos: [{plano: "medio", de: "beto", desde: 1000, hasta: 2000}]});
    assert.ok(r.ok, JSON.stringify(r.errores));
    const cam = r.resultado.grupos_figuras.find((g) => (g.clases || []).includes("camara"));
    // medio: del tope (y = 400) al 60 % del alto (y = 520): centro 460; 120 de alto llenan el 55 % de 720 -> zoom 3.3
    assert.deepEqual(claves(cam, "x"), [[1000, 640, "suave"], [2000, 200, "suave"]]);
    assert.deepEqual(claves(cam, "y"), [[1000, 360, "suave"], [2000, 460, "suave"]]);
    assert.deepEqual(claves(cam, "zoom"), [[1000, 1, "suave"], [2000, 3.3, "suave"]]);
});
