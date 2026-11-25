// Pruebas de Formatos.js (planeacion_autoria_ia.md, fase IA-3): formatos de una escena y en: {cuadro}.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";

const {Compilador} = await cargarMotor();
const compilar = (def, formato) => Compilador.compilar(def, () => null, () => null, {formato});
const grupo = (r, n) => r.resultado.grupos_figuras.find((g) => g.nombre === n);

const BASE = {
    tipo: "escena", nombre: "Prueba", duracion: 4000,
    camara: {centro: [640, 360], zoom: 1},
    objetos: [
        {nombre: "sol", en: {cuadro: "arriba-derecha"}, circulo: {r: 10}},
        {nombre: "centro", en: {cuadro: [0.5, 0.5], desplazar: [10, -20]}, circulo: {r: 5}},
        {nombre: "solo_ancho", en: [100, 100], circulo: {r: 5}},
    ],
    dialogos: [{texto: "FIN", desde: 0, hasta: 2000, estilo: "texto", en: {cuadro: "abajo-centro"}, tamano: 30}],
    formatos: {
        vertical: {
            nombre: "Prueba (vertical)",
            camara: {tamano: [720, 1280], zoom: 2},
            objetos: {solo_ancho: null},
            dialogos: {"0": {tamano: 20}},
            agregar: {objetos: [{nombre: "extra", en: {cuadro: "arriba-centro"}, circulo: {r: 5}}]},
        },
    },
};

test("en: {cuadro} en la escena base (horizontal, zona segura del 5 %)", () => {
    const r = compilar(BASE);
    assert.ok(r.ok, JSON.stringify(r.errores));
    assert.deepEqual([grupo(r, "sol").cx, grupo(r, "sol").cy], [1280 * 0.95, 720 * 0.05]);
    assert.deepEqual([grupo(r, "centro").cx, grupo(r, "centro").cy], [650, 340]);
    assert.deepEqual(r.resultado.escena.dialogos[0].en, {cuadro: "abajo-centro"}, "los textos quedan pegados a la pantalla: se ubican al dibujar");
    assert.ok(grupo(r, "solo_ancho"));
    assert.equal(r.resultado.nombre, "Prueba");
});

test("formato vertical: camara, parches, quitar y agregar; cuadro con la camara del formato", () => {
    const r = compilar(BASE, "vertical");
    assert.ok(r.ok, JSON.stringify(r.errores));
    assert.equal(r.resultado.nombre, "Prueba (vertical)");
    const cam = r.resultado.grupos_figuras.find((g) => (g.clases || []).includes("camara"));
    assert.deepEqual([cam.camara.ancho, cam.camara.alto, cam.camara.zoom], [720, 1280, 2]);
    // la camara ve 360 x 640 alrededor de (640, 360): x0 = 460, y0 = 40; zona segura vertical: 6 % lados, 12 % arriba, 20 % abajo
    assert.deepEqual([grupo(r, "sol").cx, grupo(r, "sol").cy], [460 + 360 * 0.94, 40 + 640 * 0.12]);
    assert.deepEqual([grupo(r, "extra").cx, grupo(r, "extra").cy], [640, 40 + 640 * 0.12]);
    assert.equal(grupo(r, "solo_ancho"), undefined, "null lo quita");
    assert.equal(r.resultado.escena.dialogos[0].tamano, 20);

});

test("cuadro sigue a la camara en el instante t", () => {
    const def = {tipo: "escena", nombre: "T", duracion: 2000, camara: {centro: [0, 0], claves: {x: [[0, 0], [1000, 1000]]}},
        objetos: [{nombre: "a", en: {cuadro: [0.5, 0.5], t: 1000}, circulo: {r: 5}}, {nombre: "b", en: {cuadro: [0.5, 0.5], t: 500}, circulo: {r: 5}}]};
    const r = compilar(def);
    assert.ok(r.ok, JSON.stringify(r.errores));
    assert.equal(grupo(r, "a").cx, 1000);
    assert.equal(grupo(r, "b").cx, 500);
});

test("errores claros", () => {
    assert.match(compilar(BASE, "cuadrado").errores.join(" "), /formato "cuadrado" no existe \(hay: vertical\)/);
    const malo = {...BASE, formatos: {v: {objetos: {fantasma: {en: [0, 0]}}}}};
    assert.match(compilar(malo, "v").errores.join(" "), /"fantasma" no existe/);
    const lugar = {...BASE, objetos: [{nombre: "x", en: {cuadro: "arriba-medio"}, circulo: {r: 5}}]};
    assert.match(compilar(lugar).errores.join(" "), /cuadro "arriba-medio" desconocido/);
    const conQuien = {...BASE, dialogos: [{quien: "sol", texto: "hola", desde: 0, hasta: 2000, estilo: "texto", en: {cuadro: "centro"}, tamano: 20}]};
    assert.match(compilar(conQuien).errores.join(" "), /solo sin quien/);
});

test("un texto con en: {cuadro} queda pegado a la pantalla aunque la camara se mueva y haga zoom", async () => {
    const {GestionEvento, Render} = await cargarMotor();
    const {createCanvas} = await import("canvas");
    const def = {tipo: "escena", nombre: "P", duracion: 2000, camara: {centro: [640, 360], claves: {x: [[0, 640], [2000, 900]], zoom: [[0, 1], [2000, 2]]}},
        objetos: [{nombre: "a", en: [640, 360], circulo: {r: 5}}],
        dialogos: [{texto: "TITULO", desde: 0, hasta: 2000, estilo: "texto", en: {cuadro: "arriba-centro"}, tamano: 40, velocidad: 0}]};
    const r = compilar(def);
    assert.ok(r.ok, JSON.stringify(r.errores));
    const m = new GestionEvento();
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "x");
    m.asegurarCamara();
    m.escena = r.resultado.escena;
    m.configuracion_lienzo.x_delta_original = 0; m.configuracion_lienzo.y_delta_original = 0;
    const ctx = createCanvas(64, 36).getContext("2d");
    const enPantalla = (t) => {
        m._registro_dialogos = [];
        Render.dibujarCuadro(m, ctx, 64, 36, t);
        const c = m._registro_dialogos[0].caja, rc = m.rectCamara();
        delete m._registro_dialogos;
        // en fraccion del cuadro: debe ser la misma en los dos instantes
        return [(c.x0 + c.x1) / 2 - rc.x0, c.y0 - rc.y0, c.y1 - c.y0].map((v, i) => Math.round(v / (i === 0 ? rc.w : rc.h) * 1000) / 1000);
    };
    const a = enPantalla(0), b = enPantalla(1999);
    assert.deepEqual(a, b);
    assert.equal(a[0], 0.5, "centrado");
    assert.equal(a[1], 0.05, "cuelga de la zona segura (5 %)");
});
