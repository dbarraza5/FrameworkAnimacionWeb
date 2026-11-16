// Pruebas del sonido (planeacion_sonido.md): pista (clips en tiempo absoluto) y seguimiento.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";

const {Pista, Seguimiento} = await cargarMotor();
const ev = (nombre, padre, ini, fin, extra = {}) => ({nombre, nodo_padre: padre, tiempo_inicio: ini, tiempo_final: fin, ...extra});
const tiempos = (clips) => clips.map((c) => [c.sonido, c.t]);

test("escena y eventos: tiempos absolutos (los sub-eventos suman el inicio de su padre)", () => {
    const clips = Pista.clipsEscena({
        duracion: 10000,
        escena: {sonidos: [{sonido: "musica", t: 0, bucle: true}]},
        eventos: [ev("EventoGeneral", "Nodo_Default", 0, 10000), ev("A", "EventoGeneral", 2000, 6000, {sonidos: [{sonido: "a", t: 500}]}),
            ev("B", "A", 1000, 3000, {sonidos: [{sonido: "b", t: 200}, {sonido: "fuera", t: 99999}]})],
    });
    assert.deepEqual(tiempos(clips), [["musica", 0], ["a", 2500], ["b", 3200]]);
    assert.equal(clips.find((c) => c.sonido === "a").fin, 6000);
});

test("instancias: heredan los clips del evento elegido, con desfase, bucle, volumen y corte al soltarse", () => {
    const asset = {nombre: "Perro", eventos: [ev("EventoGeneral", "Nodo_Default", 0, 6000), ev("Caminar", "EventoGeneral", 0, 1000, {sonidos: [{sonido: "paso", t: 100, volumen: 0.5}]}),
        ev("Sentarse", "EventoGeneral", 4000, 6000, {sonidos: [{sonido: "ladrido", t: 0}]})], reacciones: {al_soltarse: {sonido: "aullido"}}};
    const grupos = [
        {nombre: "perro_1", nodo_padre: "root", instancia: {id_eventos: "P", evento: "Caminar", bucle: true, desfase: 300, audio: {volumen: 0.5}}},
        {nombre: "perro_2", nodo_padre: "root", instancia: {id_eventos: "P", evento: "Caminar", bucle: true, audio: {silencio: true}}},
        {nombre: "perro_3", nodo_padre: "root", instancia: {id_eventos: "P", evento: "Sentarse", bucle: false}},
    ];
    const clips = Pista.clipsEscena({duracion: 4000, grupos, assetDe: (id) => (id === "P" ? asset : null),
        sucesos: [{tipo: "soltarse", objeto: "perro_1", t: 2500}]});
    const p1 = clips.filter((c) => c.origen.nombre === "perro_1");
    // pasos en 400, 1400, 2400 (el de 3400 no: se solto en 2500) + el aullido heredado al soltarse
    assert.deepEqual(tiempos(p1), [["paso", 400], ["paso", 1400], ["paso", 2400], ["aullido", 2500]]);
    assert.equal(p1[0].volumen, 0.25);                      // 0,5 del clip x 0,5 de la instancia
    assert.equal(clips.filter((c) => c.origen.nombre === "perro_2").length, 0);   // silencio
    assert.deepEqual(tiempos(clips.filter((c) => c.origen.nombre === "perro_3")), [["ladrido", 0]]);
});

test("reacciones: efecto (al disparar, al impactar) y objeto (al tocar el suelo, con maximo)", () => {
    const grupos = [
        {nombre: "Disparo", nodo_padre: "root", clases: ["efecto"], efecto: {tipo: "disparo", t: 2500},
            sonidos: {reacciones: {al_disparar: {sonido: "bang"}, al_impactar: {sonido: "golpe", volumen: 0.9}}}},
        {nombre: "persona", nodo_padre: "root", fisica: {modo: "desarmar"},
            sonidos: {reacciones: {al_soltarse: {sonido: "quiebre"}, al_tocar_suelo: {sonido: "seco", max: 2}}}},
    ];
    const sucesos = [{tipo: "disparar", efecto: "Disparo", t: 2500}, {tipo: "impactar", efecto: "Disparo", objeto: "persona", t: 2500},
        {tipo: "soltarse", objeto: "persona", t: 2500}, {tipo: "tocar_suelo", objeto: "persona", t: 2900},
        {tipo: "tocar_suelo", objeto: "persona", t: 3000}, {tipo: "tocar_suelo", objeto: "persona", t: 3100}];
    const clips = Pista.clipsEscena({duracion: 5000, grupos, sucesos});
    assert.deepEqual(tiempos(clips).sort(), [["bang", 2500], ["golpe", 2500], ["quiebre", 2500], ["seco", 2900], ["seco", 3000]].sort());
});

test("seguimiento: falta subir, borrado, falta sonido, sin decidir; 'no lleva' no avisa", () => {
    const doc = {
        escena: {sonido_marca: "no_lleva"},
        eventos: [ev("EventoGeneral", "Nodo_Default", 0, 5000, {sonido_marca: "lleva"}), ev("Caminar", "EventoGeneral", 0, 1000, {sonidos: [{sonido: "s1", t: 0}]}),
            ev("Sentarse", "EventoGeneral", 1000, 2000), ev("Dormir", "EventoGeneral", 2000, 3000, {sonido_marca: "no_lleva"})],
        grupos: [{nombre: "Explosión", clases: ["efecto"], efecto: {tipo: "explosion"}, sonidos: {reacciones: {al_detonar: {sonido: "zzz"}}}},
            {nombre: "casa", fisica: {modo: "desarmar"}}, {nombre: "nube"}],
    };
    const r = Seguimiento.seguimiento(doc, [{_id: "s1", nombre: "Pasos", estado: "pendiente"}]);
    const resumen = (n) => r.avisos.filter((a) => a.nivel === n).map((a) => a.nombre_sonido || a.sonido || a.elemento.nombre);
    assert.deepEqual(resumen("falta_subir"), ["Pasos"]);
    assert.deepEqual(resumen("sonido_borrado"), ["zzz"]);
    assert.deepEqual(resumen("falta_sonido"), ["EventoGeneral"]);
    assert.deepEqual(resumen("sin_decidir"), ["Sentarse", "casa"]);     // Dormir y la escena: "no lleva"; nube: no es candidato
    assert.equal(r.pendientes, 3);
    const listo = Seguimiento.seguimiento(doc, [{_id: "s1", nombre: "Pasos", estado: "listo"}, {_id: "zzz", nombre: "Bum", estado: "listo"}]);
    assert.equal(listo.resumen.falta_subir + listo.resumen.sonido_borrado, 0);
});
