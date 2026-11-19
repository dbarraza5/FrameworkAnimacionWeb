// Fase 3 de planeacion_capacidades.md: movimiento secundario (inercia). Sin base de datos.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";
import {diferencias} from "../lib/comparar.mjs";

const {Compilador, Descompilador, GestionEvento} = await cargarMotor();

// un "carro" que acelera a la derecha (0-1000), va parejo y frena en seco (2000);
// de el cuelga un pendulo (pivote arriba, peso abajo)
const carro = (inercia = {}, claves) => ({tipo: "asset", nombre: "Carro", duracion: 6000, partes: [
    {nombre: "carro", rect: [-30, -10, 30, 10], color: "#888", claves: claves || {x: [[0, 0], [1000, 100, "entrar"], [2000, 300, "lineal"]]}, partes: [
        {nombre: "pendulo", poligono: [[-3, 0], [3, 0], [3, 80], [-3, 80]], color: "#c00", pivote: [0, 0], inercia}]}]});

function motor(def, extra) {
    const r = Compilador.compilar(def, (n) => extra && extra.buscar(n), () => null);
    assert.deepEqual(r.errores, []);
    const m = new GestionEvento();
    if (extra) m.cargadorAssets = extra.cargar;
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "x");
    m.asegurarCamara();
    m.gestion_grupos_originales.procesarPosicionFinalFiguras();
    m.reseteoMovGrupos();
    m.procesandoEventos();                    // primer cuadro: arranca los relojes
    return m;
}
function rot(m, t, nombre) {
    m._t_forzado = t / 1000;
    try { m.procesandoEventos(); } finally { m._t_forzado = null; }
    const g = m.gestion_grupos.grupos_figuras.find((x) => x.nombre === nombre);
    return (g.transformacion && g.transformacion.rotacion) || 0;
}

test("inercia: se queda atras al acelerar, se va adelante al frenar y se asienta", () => {
    const m = motor(carro());
    const arranque = Math.max(...[50, 100, 150, 200].map((t) => rot(m, t, "pendulo")));
    assert.ok(arranque > 2, `al acelerar a la derecha, el peso queda atras: gira en sentido horario (${arranque.toFixed(1)})`);
    const frenado = Math.min(...[2100, 2150, 2200, 2250, 2300].map((t) => rot(m, t, "pendulo")));
    assert.ok(frenado < -5, `al frenar se va adelante (${frenado.toFixed(1)})`);
    assert.ok(Math.abs(rot(m, 5900, "pendulo")) < 1, "despues se asienta");
});

test("inercia: determinista (mismo instante, mismo resultado, se llegue desde donde se llegue)", () => {
    const a = motor(carro()), b = motor(carro());
    const directo = rot(a, 2300, "pendulo");
    rot(b, 5000, "pendulo"); rot(b, 100, "pendulo");
    assert.equal(rot(b, 2300, "pendulo"), directo);
});

test("inercia: quieto no se mueve; con rotacion por claves la suma; rigidez alta reacciona menos", () => {
    const quieto = motor(carro({}, {x: [[0, 0]]}));
    assert.equal(rot(quieto, 1500, "pendulo"), 0);
    const blando = Math.abs(rot(motor(carro({rigidez: 1.5})), 2250, "pendulo"));
    const duro = Math.abs(rot(motor(carro({rigidez: 8})), 2250, "pendulo"));
    assert.ok(duro < blando, `rigidez alta (${duro.toFixed(1)}) < baja (${blando.toFixed(1)})`);
    const lim = Math.abs(Math.min(...[2100, 2200, 2300].map((t) => rot(motor(carro({limite: 5})), t, "pendulo"))));
    assert.ok(lim <= 5.0001, "limite");
});

test("inercia: en una instancia reacciona al movimiento que le da la escena", async () => {
    // asset: el pendulo cuelga de un soporte quieto; la escena mueve la instancia
    const asset = Compilador.compilar({tipo: "asset", nombre: "Colgante", duracion: 1000, partes: [
        {nombre: "soporte", rect: [-10, -5, 10, 5], color: "#888", partes: [
            {nombre: "pendulo", poligono: [[-3, 0], [3, 0], [3, 80], [-3, 80]], color: "#c00", pivote: [0, 0], inercia: {}}]}]}, null, () => null).resultado;
    const doc = {...asset, _id: "a1"};
    const esc = {tipo: "escena", nombre: "E", duracion: 6000, objetos: [
        {instancia: "Colgante", nombre: "colgante", en: [0, 0], claves: {x: [[0, 0], [1000, 100, "entrar"], [2000, 300, "lineal"]]}}]};
    const m = motor(esc, {buscar: () => ({id: "a1", eventos: ["EventoGeneral"]}), cargar: async () => doc});
    rot(m, 0, "colgante");
    await new Promise((r) => setTimeout(r, 20));
    rot(m, 0, "colgante");
    assert.ok(Math.max(...[50, 100, 150, 200].map((t) => rot(m, t, "colgante::pendulo"))) > 2);
    assert.ok(Math.min(...[2100, 2200, 2300].map((t) => rot(m, t, "colgante::pendulo"))) < -5);
});

test("inercia: validacion y ida y vuelta", () => {
    const def = carro({rigidez: 3, amortiguacion: 0.2, punta: [0, 70]});
    const r1 = Compilador.compilar(def, () => null, () => null);
    const {def: d1, avisos} = Descompilador.descompilar(r1.resultado);
    assert.deepEqual(avisos, []);
    assert.deepEqual(diferencias(r1.resultado, Compilador.compilar(d1, () => null, () => null).resultado), []);
    const malo = (inercia, pivote = [0, 0]) => Compilador.compilar({tipo: "asset", nombre: "M", partes: [{nombre: "x", rect: [0, 0, 1, 1], ...(pivote ? {pivote} : {}), inercia}]}, () => null, () => null);
    assert.match(malo({rigidez: "mucha"}).errores.join("|"), /inercia.rigidez es un numero/);
    assert.match(malo({rigidez: 0}).errores.join("|"), /mayor que 0/);
    assert.match(malo({resorte: 1}).errores.join("|"), /campos desconocidos/);
    assert.match(malo(true, null).avisos.join("|"), /inercia sin pivote/);
    assert.deepEqual(malo(true).errores, []);
});
