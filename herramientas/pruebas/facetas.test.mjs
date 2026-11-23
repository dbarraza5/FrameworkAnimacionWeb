// Pruebas del generador de facetas (src/Clases/Autoria/Facetas.js): low poly.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";

const {Facetas, Compilador} = await cargarMotor();
const E = () => { const e = {errores: [], avisos: []}; return {error: (d, m) => e.errores.push(m), aviso: (d, m) => e.avisos.push(m), e}; };
const montana = [[-200, 0], [0, -180], [200, 0]];

test("delaunay: triangula un cuadrado con un punto al centro en 4 triangulos", () => {
    const t = Facetas.delaunay([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]]);
    assert.equal(t.length, 4);
});

test("facetas: la parte se vuelve triangulos; la cara que mira a la luz es mas clara", () => {
    const e = E();
    const r = Facetas.expandirFacetas({nombre: "m", poligono: montana, color: "#8090a0", facetas: {luz: [-1, -0.6, 0.6], detalle: 40, semilla: 3}}, e, "m");
    assert.deepEqual(e.e.errores, []);
    assert.equal(r.poligono, undefined, "sin forma propia");
    assert.ok(r.partes.length > 10, `triangulos: ${r.partes.length}`);
    assert.ok(r.partes.every((p) => p.poligono.length === 3 && /^#[0-9a-f]{6}$/.test(p.color)));
    // luz de la izquierda: en promedio, los triangulos de la izquierda son mas claros que los de la derecha
    const luz = (p) => parseInt(p.color.slice(1, 3), 16);
    const cx = (p) => (p.poligono[0][0] + p.poligono[1][0] + p.poligono[2][0]) / 3;
    const izq = r.partes.filter((p) => cx(p) < -60), der = r.partes.filter((p) => cx(p) > 60);
    const media = (l) => l.reduce((s, p) => s + luz(p), 0) / l.length;
    assert.ok(media(izq) > media(der), `izquierda ${media(izq)} > derecha ${media(der)}`);
});

test("facetas con luz que se mueve: colores por estado y claves de forma", () => {
    const e = E();
    const r = Facetas.expandirFacetas({nombre: "m", poligono: montana, color: "#8090a0", facetas: {luces: [[0, [-1, -0.5, 0.5]], [5000, [1, -0.5, 0.5]]], detalle: 60}}, e, "m");
    const t = r.partes[0];
    assert.deepEqual(Object.keys(t.colores), ["l0", "l1"]);
    assert.deepEqual(t.claves.forma.map((k) => k[1]), ["l0", "l1"]);
});

test("el compilador acepta facetas en un asset y avisa errores", () => {
    const ok = Compilador.compilar({tipo: "asset", nombre: "a", partes: [{nombre: "m", poligono: montana, color: "#8090a0", facetas: {luz: [-1, -1, 1]}}]});
    assert.deepEqual(ok.errores, []);
    assert.ok(ok.resultado.grupos_figuras.filter((g) => /^m_f\d+$/.test(g.nombre)).length > 5);
    const mal = Compilador.compilar({tipo: "asset", nombre: "a", partes: [{nombre: "m", rect: [0, 0, 10, 10], color: "#8090a0", facetas: {}}]});
    assert.ok(mal.errores.some((x) => /poligono/.test(x)));
});
