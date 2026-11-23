// Pruebas de la boca desde la voz (planeacion_voces.md, fase 3): herramientas/lib/boca.mjs,
// Claves.aplicarClavesParte y claves_partes en el compilador.
import {test} from "node:test";
import assert from "node:assert/strict";
import {envolvente, clavesBoca, tramosDeAcciones, VENTANA_MS} from "../lib/boca.mjs";
import {cargarMotor} from "../lib/motor.mjs";

const {Claves, Compilador} = await cargarMotor();

const SR = 24000;
// 0,2 s de silencio, 0,4 s de "voz" fuerte, 0,2 s de silencio, 0,2 s de voz suave
function voz() {
    const x = new Float32Array(Math.round(SR * 1.0));
    for (let i = 0; i < x.length; i++) {
        const t = i / SR, a = t >= 0.2 && t < 0.6 ? 0.8 : t >= 0.8 ? 0.3 : 0;
        x[i] = a * Math.sin(2 * Math.PI * 180 * t);
    }
    return x;
}

test("la envolvente abre la boca con la voz y la cierra en el silencio", () => {
    const env = envolvente(voz(), SR);
    assert.equal(env[1][0], VENTANA_MS);
    const en = (ms) => env[Math.floor(ms / VENTANA_MS)][1];
    assert.ok(en(100) < 0.05, "silencio: cerrada");
    assert.ok(en(450) > 0.8, "voz fuerte: abierta");
    assert.ok(en(740) < 0.2, "pausa: se cierra");
    const suave = en(950);
    assert.ok(suave > 0.1 && suave < en(450), "voz suave: abre menos");
});

test("claves de la boca: valores entre cerrada y abierta, peso solo cuando habla", () => {
    const env = [[0, 0], [40, 1], [80, 0.5], [120, 0.5], [160, 0]];
    const cp = clavesBoca({parte: "boca", prop: "escala_y", cerrada: 0.2, abierta: 1}, [{t: 1000, env}], [[900, 3000]]);
    const pista = cp.boca.escala_y;
    assert.ok(pista.every(([, v]) => v >= 0.2 && v <= 1));
    assert.deepEqual(pista.find(([t]) => t === 1040), [1040, 1, "lineal"]);
    assert.ok(!pista.some(([t]) => t === 1120), "sin repetir un valor quieto en el medio");
    const ts = pista.map(([t]) => t);
    assert.deepEqual(ts, [...ts].sort((a, b) => a - b));
    assert.equal(new Set(ts).size, ts.length);
    // peso: 0 antes, 1 desde el "Hablar" (900) hasta 3000, 0 despues
    const peso = cp.boca.peso.map((c) => ({t: c[0], v: c[1], interp: c[2]}));
    assert.equal(Claves.valorEn(peso, 500), 0);
    assert.equal(Claves.valorEn(peso, 2000), 1);
    assert.equal(Claves.valorEn(peso, 3500), 0);
    assert.equal(clavesBoca(null, [{t: 0, env}]), null);
});

test("tramos de las acciones de hablar", () => {
    const acc = [[0, "Quieto"], [1000, "Hablar"], [3000, "Quieto"], [5000, "Hablar triste"]];
    assert.deepEqual(tramosDeAcciones(acc, 8000), [[1000, 3000], [5000, 8000]]);
    assert.deepEqual(tramosDeAcciones(undefined, 8000), []);
});

test("aplicarClavesParte mezcla con la pose del asset segun el peso", () => {
    const pistas = {escala_y: [{t: 0, v: 1, interp: "lineal"}], peso: [{t: 0, v: 0, interp: "lineal"}, {t: 1000, v: 1, interp: "lineal"}]};
    const pose = {transformacion: {escala_y: 0.2, rotacion: 5}};
    const g = {...pose};
    Claves.aplicarClavesParte(g, pistas, 500);
    assert.ok(Math.abs(g.transformacion.escala_y - 0.6) < 1e-9);
    assert.equal(g.transformacion.rotacion, 5, "no toca otras propiedades");
    assert.equal(pose.transformacion.escala_y, 0.2, "no cambia la pose compartida");
    const h = {transformacion: {escala_y: 0.2}};
    Claves.aplicarClavesParte(h, pistas, 0);
    assert.equal(h.transformacion.escala_y, 0.2, "peso 0: la del asset");
    const o = {opacidad: 1};
    Claves.aplicarClavesParte(o, {opacidad: [{t: 0, v: 0.5, interp: "lineal"}]}, 10);
    assert.equal(o.opacidad, 0.5, "sin peso: la clave manda");
});

test("el compilador acepta claves_partes en una instancia y avisa propiedades desconocidas", () => {
    const asset = {id: "a1", eventos: ["EventoGeneral", "Hablar"]};
    const buscar = (n) => (n === "Kiru" ? asset : null);
    const esc = (cp) => ({tipo: "escena", nombre: "x", duracion: 2000, objetos: [{instancia: "Kiru", nombre: "kiru", en: [0, 0], claves_partes: cp}]});
    const r = Compilador.compilar(esc({boca: {escala_y: [[0, 0.2], [500, 1]], peso: [[0, 1]]}}), buscar);
    assert.equal(r.errores.length, 0, JSON.stringify(r.errores));
    const g = r.resultado.grupos_figuras.find((x) => x.nombre === "kiru");
    assert.equal(g.instancia.claves_partes.boca.escala_y[1].v, 1);
    assert.equal(g.instancia.claves_partes.boca.peso[0].v, 1);
    const mal = Compilador.compilar(esc({boca: {altura: [[0, 1]]}}), buscar);
    assert.ok(mal.errores.some((e) => /altura/.test(e)));
});

test("boca con varias partes: todas siguen la misma voz", () => {
    const env = [[0, 0], [40, 1], [80, 0]];
    const cp = clavesBoca([{parte: "mandibula", prop: "rotacion", cerrada: 0, abierta: 16}, {parte: "boca_dentro", prop: "rotacion", cerrada: 0, abierta: 11}], [{t: 0, env}]);
    assert.deepEqual(Object.keys(cp), ["mandibula", "boca_dentro"]);
    assert.equal(Math.max(...cp.mandibula.rotacion.map((c) => c[1])), 16);
    assert.equal(Math.max(...cp.boca_dentro.rotacion.map((c) => c[1])), 11);
});
