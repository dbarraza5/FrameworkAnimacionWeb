// Fase 2 de planeacion_capacidades.md: cinematica inversa (IK) de dos huesos.
// Sin base de datos: compila assets en memoria y los evalua con el motor real.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";
import {diferencias} from "../lib/comparar.mjs";

const M = await cargarMotor();
const {Compilador, Descompilador, GestionEvento} = M;

// brazo: hombro en (0,0), codo en (60,0), muneca en (110,0); objetivo con claves
function brazo(objetivo, extra = {}) {
    return {tipo: "asset", nombre: "Brazo", duracion: 2000, partes: [
        {nombre: "torso", rect: [-20, -10, 0, 80], color: "#888", rotacion: extra.torso || 0, pivote: [0, 0], partes: [
            {nombre: "brazo", poligono: [[0, -5], [60, -5], [60, 5], [0, 5]], pivote: [0, 0], color: "#c00",
                ik: {hasta: "antebrazo", punta: [50, 0], objetivo: "obj", doblez: extra.doblez || 1, ...(extra.orientar ? {orientar: "mano"} : {})},
                ...(extra.peso ? {claves: {ik_peso: extra.peso, rotacion: [[0, 90], [2000, 90]]}} : {}),
                partes: [
                    {nombre: "antebrazo", en: [60, 0], poligono: [[0, -4], [50, -4], [50, 4], [0, 4]], pivote: [0, 0], color: "#0c0", partes: [
                        {nombre: "mano", en: [50, 0], rect: [0, -6, 14, 6], pivote: [0, 0], color: "#00c"}]}]}]},
        {nombre: "obj", en: objetivo[0], claves: {x: objetivo.map((p, i) => [i * 1000, p[0]]), y: objetivo.map((p, i) => [i * 1000, p[1]])}, partes: [],
            ...(extra.rotObj !== undefined ? {rotacion: extra.rotObj, pivote: [0, 0]} : {})},
    ]};
}

async function pose(def, t) {
    const r = Compilador.compilar(def, () => null, () => null);
    assert.deepEqual(r.errores, []);
    const m = new GestionEvento();
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "x");
    m.gestion_grupos_originales.procesarPosicionFinalFiguras();
    m.reseteoMovGrupos();
    const p = m.evaluarEn("EventoGeneral", t / 1000, false);
    m.gestion_grupos.procesarPosicionFinalFiguras();
    return {m, p, rot: (n) => p.find((g) => g.nombre === n).transformacion?.rotacion ?? 0};
}

// punta de la mano (muneca) como se ve: sumando las rotaciones de la cadena
function muneca(rot, torso = 0) {
    const a1 = (torso + rot("brazo")) * Math.PI / 180, a2 = a1 + rot("antebrazo") * Math.PI / 180;
    return [60 * Math.cos(a1) + 50 * Math.cos(a2), 60 * Math.sin(a1) + 50 * Math.sin(a2)];
}
const cerca = (a, b, tol = 1.5) => assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) <= tol, `${a.map((v) => v.toFixed(1))} lejos de ${b}`);

test("ik: la muneca llega al objetivo (y lo sigue en el tiempo)", async () => {
    const def = brazo([[70, 50], [30, -80]]);
    for (const [t, obj] of [[0, [70, 50]], [1000, [30, -80]], [500, [50, -15]]]) {
        const {rot} = await pose(def, t);
        cerca(muneca(rot), obj);
    }
});

test("ik: doblez elige el lado del codo; fuera de alcance, el brazo apunta estirado", async () => {
    const a = await pose(brazo([[70, 50]], {doblez: 1}), 0), b = await pose(brazo([[70, 50]], {doblez: -1}), 0);
    cerca(muneca(a.rot), [70, 50]); cerca(muneca(b.rot), [70, 50]);
    assert.ok(Math.sign(a.rot("antebrazo")) === -Math.sign(b.rot("antebrazo")), "los codos deberian doblarse a lados opuestos");
    const lejos = await pose(brazo([[300, 0]]), 0);
    assert.ok(Math.abs(lejos.rot("brazo")) < 0.5 && Math.abs(lejos.rot("antebrazo")) < 0.5, "estirado hacia la derecha");
});

test("ik: con el torso girado el objetivo sigue en coordenadas del dibujo", async () => {
    const {rot} = await pose(brazo([[40, 70]], {torso: 30}), 0);
    cerca(muneca(rot, 30), [40, 70]);
});

test("ik: orientar deja la mano con la rotacion del objetivo; ik_peso 0 deja las claves", async () => {
    const {rot} = await pose(brazo([[70, 50]], {orientar: true, rotObj: 20}), 0);
    assert.ok(Math.abs(rot("brazo") + rot("antebrazo") + rot("mano") - 20) < 0.01);
    const p0 = await pose(brazo([[70, 50]], {peso: [[0, 0]]}), 0);
    assert.equal(p0.rot("brazo"), 90);
    const p5 = await pose(brazo([[70, 50]], {peso: [[0, 0.5]]}), 0), p1 = await pose(brazo([[70, 50]]), 0);
    assert.ok(Math.abs(p5.rot("brazo") - (90 + (p1.rot("brazo") - 90) / 2)) < 0.01);
});

test("ik: el mismo instante da siempre la misma pose (no depende de los cuadros anteriores)", async () => {
    const def = brazo([[70, 50], [30, -80]], {peso: [[0, 0.5]]});
    const a = await pose(def, 700);
    a.m.evaluarEn("EventoGeneral", 0.2, false);
    const b = a.m.evaluarEn("EventoGeneral", 0.7, false);
    assert.equal(b.find((g) => g.nombre === "brazo").transformacion.rotacion, a.rot("brazo"));
});

test("ik: validacion y ida y vuelta", () => {
    const def = brazo([[70, 50]], {orientar: true});
    const r1 = Compilador.compilar(def, () => null, () => null);
    assert.deepEqual(r1.errores, []);
    const {def: d1, avisos} = Descompilador.descompilar(r1.resultado);
    assert.deepEqual(avisos, []);
    const r2 = Compilador.compilar(d1, () => null, () => null);
    assert.deepEqual(diferencias(r1.resultado, r2.resultado), []);
    const malo = (ik) => Compilador.compilar({tipo: "asset", nombre: "M", partes: [
        {nombre: "a", rect: [0, 0, 1, 1], pivote: [0, 0], ik, partes: [{nombre: "b", rect: [0, 0, 1, 1], partes: [{nombre: "c", rect: [0, 0, 1, 1]}]}]},
        {nombre: "z", partes: [], rect: [0, 0, 1, 1]}]}, () => null, () => null);
    const err = (ik) => malo(ik).errores.join(" | ");
    assert.match(err({hasta: "c", objetivo: "z"}), /hijo directo/);
    assert.match(err({hasta: "b", objetivo: "nada"}), /no existe/);
    assert.match(err({hasta: "b", objetivo: "c"}), /dentro de la cadena/);
    assert.match(err({hasta: "b", objetivo: "z", doblez: 2}), /doblez/);
    assert.match(err({hasta: "b"}), /ik es/);
    assert.match(malo({hasta: "b", objetivo: "z"}).avisos.join(" | "), /segundo hueso de ik sin pivote/);
});
