// Pruebas del estilo de imagen (src/Clases/EditorEvento/Estilo.js): duotono con tramado.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";

const {Estilo, Compilador, Descompilador} = await cargarMotor();
const OSC = "#3a2440", CLA = "#f2b8c6";

function lienzo(w, h, pintar) { const c = createCanvas(w, h), ctx = c.getContext("2d"); pintar(ctx); return ctx; }
const colores = (ctx) => {
    const d = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data, s = new Set();
    for (let i = 0; i < d.length; i += 4) s.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
    return s;
};

test("duotono: solo quedan los dos colores de la paleta", () => {
    const ctx = lienzo(64, 32, (c) => { const g = c.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, "#000"); g.addColorStop(1, "#fff"); c.fillStyle = g; c.fillRect(0, 0, 64, 32); });
    assert.ok(Estilo.aplicarEstilo(ctx, {paleta: [OSC, CLA], tramado: "bayer4", pixel: 1}, 0, 0, 64, 32, 64));
    assert.deepEqual([...colores(ctx)].sort(), ["242,184,198", "58,36,64"].sort());
});

test("el tramado reparte los grises: un gris medio sale mitad y mitad; negro y blanco, planos", () => {
    const cuenta = (gris) => {
        const ctx = lienzo(16, 16, (c) => { c.fillStyle = gris; c.fillRect(0, 0, 16, 16); });
        Estilo.aplicarEstilo(ctx, {paleta: ["#000000", "#ffffff"], tramado: "bayer4", pixel: 1}, 0, 0, 16, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data; let claros = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 128) claros++;
        return claros / 256;
    };
    assert.equal(cuenta("#000000"), 0);
    assert.equal(cuenta("#ffffff"), 1);
    const medio = cuenta("#808080");
    assert.ok(medio > 0.4 && medio < 0.6, `gris medio: ${medio}`);
});

test("pixel gordo: bloques del mismo color y region respetada", () => {
    const ctx = lienzo(40, 40, (c) => { c.fillStyle = "#777"; c.fillRect(0, 0, 40, 40); });
    Estilo.aplicarEstilo(ctx, {paleta: [OSC, CLA], pixel: 4, tramado: "bayer2"}, 10, 10, 20, 20, 20);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)).join(",");
    assert.equal(px(2, 2), "119,119,119", "fuera de la region no cambia");
    assert.equal(px(10, 10), px(13, 13), "un bloque es de un solo color");
});

test("validacion y compilador (ida y vuelta)", () => {
    assert.ok(Estilo.normalizarEstilo({paleta: ["#000"]}).errores.length);
    assert.ok(Estilo.normalizarEstilo({paleta: [OSC, CLA], tramado: "x"}).errores.length);
    assert.deepEqual(Estilo.normalizarEstilo({paleta: [OSC, CLA]}).errores, []);
    const def = {tipo: "escena", nombre: "e", duracion: 1000, estilo: {paleta: [OSC, CLA], tramado: "bayer8", pixel: 3}, objetos: []};
    const r = Compilador.compilar(def, () => null);
    assert.deepEqual(r.errores, []);
    assert.equal(r.resultado.escena.estilo.tramado, "bayer8");
    const {def: d2, avisos} = Descompilador.descompilar(r.resultado, () => null, () => null);
    assert.deepEqual(avisos, []);
    assert.equal(d2.estilo.pixel, 3);
    assert.ok(Compilador.compilar({...def, estilo: {paleta: ["rojo"]}}, () => null).errores.some((e) => /paleta/.test(e)));
});

test("semitono: sin puntos en la luz, puntos que crecen con la sombra, tinta plana debajo", () => {
    const oscuros = (gris) => {
        const ctx = lienzo(120, 120, (c) => { c.fillStyle = gris; c.fillRect(0, 0, 120, 120); });
        Estilo.aplicarEstilo(ctx, {tramado: "semitono", semitono: {celda: 10, angulo: 15, tinta: "#000000", claro: 0.82}}, 0, 0, 120, 120, 120);
        const d = ctx.getImageData(0, 0, 120, 120).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 60) n++;
        return n / (120 * 120);
    };
    assert.equal(oscuros("#ffffff"), 0, "luz plena: sin puntos");
    const medio = oscuros("#888888"), sombra = oscuros("#333333");
    assert.ok(medio > 0.05 && medio < sombra, `los puntos crecen: ${medio} < ${sombra}`);
    assert.ok(sombra > 0.5);
    // tinta plana: un rojo oscuro queda rojo brillante entre los puntos
    const ctx = lienzo(60, 60, (c) => { c.fillStyle = "#800000"; c.fillRect(0, 0, 60, 60); });
    Estilo.aplicarEstilo(ctx, {tramado: "semitono", semitono: {celda: 12, claro: 0.1}}, 0, 0, 60, 60, 60);
    const px = ctx.getImageData(30, 30, 1, 1).data;
    assert.ok(px[0] > 200 && px[1] < 30, `rojo pleno: ${px[0]},${px[1]}`);
});

test("contorno: entinta el borde entre dos colores, no los degradados", () => {
    const mascara = (pintar) => {
        const ctx = lienzo(40, 20, pintar), d = ctx.getImageData(0, 0, 40, 20).data;
        return Estilo.mascaraContorno(d, 40, 20, 60, 1).reduce((s, v) => s + v, 0);
    };
    assert.equal(mascara((c) => { c.fillStyle = "#c33"; c.fillRect(0, 0, 20, 20); c.fillStyle = "#3c3"; c.fillRect(20, 0, 20, 20); }), 20, "una columna de borde");
    assert.equal(mascara((c) => { const g = c.createLinearGradient(0, 0, 40, 0); g.addColorStop(0, "#000"); g.addColorStop(1, "#fff"); c.fillStyle = g; c.fillRect(0, 0, 40, 20); }), 0, "degradado: sin borde");
    const ctx = lienzo(40, 20, (c) => { c.fillStyle = "#fff"; c.fillRect(0, 0, 40, 20); c.fillStyle = "#36c"; c.fillRect(10, 5, 20, 10); });
    Estilo.aplicarEstilo(ctx, {contorno: {grosor: 2, color: "#000000"}}, 0, 0, 40, 20, 40);
    assert.deepEqual(Array.from(ctx.getImageData(10, 10, 1, 1).data.slice(0, 3)), [0, 0, 0], "el borde del rectangulo queda negro");
    assert.deepEqual(Array.from(ctx.getImageData(20, 10, 1, 1).data.slice(0, 3)), [51, 102, 204], "adentro no cambia");
});

test("validacion de semitono y contorno", () => {
    assert.deepEqual(Estilo.normalizarEstilo({tramado: "semitono"}).errores, []);
    assert.ok(Estilo.normalizarEstilo({tramado: "bayer4"}).errores.some((e) => /paleta/.test(e)));
    assert.ok(Estilo.normalizarEstilo({tramado: "semitono", semitono: {celda: 100}}).errores.length);
    assert.ok(Estilo.normalizarEstilo({contorno: {grosor: 50}}).errores.length);
    assert.equal(Estilo.normalizarEstilo({contorno: {}}).estilo.contorno.umbral, 60);
});

test("resplandor: lo luminoso brilla alrededor; lo oscuro no", () => {
    const ctx = lienzo(80, 40, (c) => { c.fillStyle = "#000"; c.fillRect(0, 0, 80, 40); c.fillStyle = "#ff40c0"; c.fillRect(38, 0, 4, 40); });
    Estilo.aplicarEstilo(ctx, {resplandor: {umbral: 0.3, radio: 12, intensidad: 1.5}}, 0, 0, 80, 40, 80);
    const px = (x) => Array.from(ctx.getImageData(x, 20, 1, 1).data.slice(0, 3));
    assert.ok(px(46)[0] > 8, `halo al costado de la linea: ${px(46)}`);
    assert.ok(px(46)[0] > px(46)[1], "el halo tiene el color del neon");
    assert.deepEqual(px(2), [0, 0, 0], "lejos queda negro");
    const oscuro = lienzo(20, 20, (c) => { c.fillStyle = "#303030"; c.fillRect(0, 0, 20, 20); });
    Estilo.aplicarEstilo(oscuro, {resplandor: {umbral: 0.5}}, 0, 0, 20, 20, 20);
    assert.deepEqual(Array.from(oscuro.getImageData(10, 10, 1, 1).data.slice(0, 3)), [48, 48, 48], "debajo del umbral no cambia");
    assert.ok(Estilo.normalizarEstilo({resplandor: {umbral: 2}}).errores.length);
});

test("papel: grano que varia la luz apenas, igual en cada cuadro", () => {
    const hacer = () => { const ctx = lienzo(60, 40, (c) => { c.fillStyle = "#c08060"; c.fillRect(0, 0, 60, 40); }); Estilo.aplicarEstilo(ctx, {papel: {intensidad: 0.15}}, 0, 0, 60, 40, 60); return ctx.getImageData(0, 0, 60, 40).data; };
    const a = hacer(), b = hacer();
    let min = 255, max = 0;
    for (let i = 0; i < a.length; i += 4) { min = Math.min(min, a[i]); max = Math.max(max, a[i]); }
    assert.ok(max - min > 8 && max - min < 90, `variacion del rojo: ${min}..${max}`);
    assert.deepEqual(a, b, "la misma textura en cada cuadro (fija)");
    assert.ok(Estilo.normalizarEstilo({papel: {intensidad: 3}}).errores.length);
});

test("fps_animacion: se compila y la animacion avanza a saltos", () => {
    const def = {tipo: "escena", nombre: "e", duracion: 1000, fps_animacion: 12, objetos: []};
    const r = Compilador.compilar(def, () => null);
    assert.deepEqual(r.errores, []);
    assert.equal(r.resultado.escena.fps_animacion, 12);
    assert.equal(Descompilador.descompilar(r.resultado, () => null, () => null).def.fps_animacion, 12);
    assert.ok(Compilador.compilar({...def, fps_animacion: 200}, () => null).errores.length);
});

test("claves del estilo: el brillo se anima en el tiempo", () => {
    const e = {paleta: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], claves: {brillo: [[0, -0.4], [1000, 0.4, "lineal"]]}};
    assert.deepEqual(Estilo.normalizarEstilo(e).errores, []);
    assert.equal(Estilo.estiloEn(e, 0).brillo, -0.4);
    assert.ok(Math.abs(Estilo.estiloEn(e, 500).brillo) < 1e-9);
    assert.equal(Estilo.estiloEn(e, 5000).brillo, 0.4);
    assert.equal(Estilo.estiloEn({paleta: e.paleta}, 300).brillo, undefined, "sin claves: igual");
    assert.ok(Estilo.normalizarEstilo({...e, claves: {pixel: [[0, 1]]}}).errores.length, "solo brillo y contraste");
});

test("lineas de grabado: mas tinta cuanto mas oscuro, cruzadas en lo muy oscuro", () => {
    const tinta = (gris, cruzado = true) => {
        const ctx = lienzo(60, 60, (c) => { c.fillStyle = gris; c.fillRect(0, 0, 60, 60); });
        Estilo.aplicarEstilo(ctx, {paleta: ["#000000", "#ffffff"], tramado: "lineas", lineas: {celda: 6, angulo: 30, cruzado}}, 0, 0, 60, 60, 60);
        const d = ctx.getImageData(0, 0, 60, 60).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 128) n++;
        return n / 3600;
    };
    assert.equal(tinta("#ffffff"), 0, "blanco: sin lineas");
    const claro = tinta("#bbbbbb"), medio = tinta("#777777"), oscuro = tinta("#222222");
    assert.ok(claro > 0 && claro < medio && medio < oscuro, `${claro} < ${medio} < ${oscuro}`);
    assert.ok(tinta("#222222", true) > tinta("#222222", false), "el cruzado suma tinta en lo oscuro");
    assert.ok(Estilo.normalizarEstilo({tramado: "lineas"}).errores.some((e) => /paleta/.test(e)));
});

test("acuarela: bordes que se corren con el tiempo, pigmento oscuro en el borde, papel que se ve", () => {
    const pintar = (c) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, 80, 60); c.fillStyle = "#3a7ac8"; c.fillRect(20, 15, 40, 30); };
    const hacer = (t, ac) => { const ctx = lienzo(80, 60, pintar); Estilo.aplicarEstilo(ctx, {acuarela: ac}, 0, 0, 80, 60, 80, t); return ctx; };
    const ac = {desplazar: 3, escala: 10, velocidad: 2, lavado: 0, borde: 0.8, transparencia: 0.15};
    const a = hacer(0, ac).getImageData(0, 0, 80, 60).data, b = hacer(1500, ac).getImageData(0, 0, 80, 60).data;
    assert.notDeepEqual(a, b, "los bordes respiran: cambian con el tiempo");
    const centro = hacer(0, {...ac, desplazar: 0}), px = (x, y) => Array.from(centro.getImageData(x, y, 1, 1).data.slice(0, 3));
    assert.ok(px(21, 30)[2] < px(40, 30)[2], `el borde es mas oscuro que el centro: ${px(21, 30)} vs ${px(40, 30)}`);
    assert.ok(px(40, 30)[0] > 58, "transparencia: el azul se aclara hacia el papel");
    assert.ok(Estilo.normalizarEstilo({acuarela: {borde: 4}}).errores.length);
});

test("pantalla CRT: barrido, bordes curvos negros, estatica animable", () => {
    const hacer = (p, t = 0) => { const ctx = lienzo(80, 60, (c) => { c.fillStyle = "#c0c0c0"; c.fillRect(0, 0, 80, 60); }); Estilo.aplicarEstilo(ctx, {pantalla: p}, 0, 0, 80, 60, 80, t); return ctx; };
    const base = {barrido: 0.5, curvatura: 0.15, aberracion: 0, ruido: 0, vineta: 0, parpadeo: 0};
    const ctx = hacer(base), px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
    assert.deepEqual(px(0, 0), [0, 0, 0], "la esquina queda negra (tubo curvo)");
    assert.notDeepEqual(px(40, 30), px(40, 32), "lineas de barrido alternadas");
    const a = hacer({...base, ruido: 0.6}, 0).getImageData(0, 0, 80, 60).data, b = hacer({...base, ruido: 0.6}, 500).getImageData(0, 0, 80, 60).data;
    assert.notDeepEqual(a, b, "la estatica cambia con el tiempo");
    const e = {pantalla: base, claves: {estatica: [[0, 0], [1000, 1]]}};
    assert.deepEqual(Estilo.normalizarEstilo(e).errores, []);
    assert.equal(Estilo.estiloEn(e, 500).pantalla.ruido, 0.5);
    assert.ok(Estilo.normalizarEstilo({pantalla: {curvatura: 3}}).errores.length);
});
