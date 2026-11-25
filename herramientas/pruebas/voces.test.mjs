// Pruebas de herramientas/voces.mjs (planeacion_voces.md, fase 2): lo que no necesita Kokoro ni la API.
import {test} from "node:test";
import assert from "node:assert/strict";
import {leerWav, escribirWav, recortarSilencio, normalizar, eco, picos, vozDe, ajustarDialogo, choques} from "../voces.mjs";

const VOCES = {narrador: {voz: "ef_dora"}, zorro: {voz: "em_alex", tono: -2}, cuervo: {voz: "em_alex", tono: 3}};

test("que voz lleva cada dialogo", () => {
    assert.equal(vozDe({quien: "zorro", texto: "Hola"}, VOCES).cfg.tono, -2);
    assert.equal(vozDe({texto: "Había una vez", estilo: "narrador"}, VOCES).rol, "narrador");
    assert.equal(vozDe({quien: "cuervo", texto: "Mmm", estilo: "pensamiento"}, VOCES).eco, true);
    assert.equal(vozDe({quien: "zorro", texto: "x", voz: false}, VOCES), null);
    assert.equal(vozDe({quien: "arbol", texto: "x"}, VOCES), null, "sin voz configurada");
    assert.equal(vozDe({quien: "zorro", texto: "x"}, undefined), null);
});

test("el globo dura lo que la voz y el texto se escribe a su ritmo", () => {
    const d = {quien: "zorro", texto: "¡Buenos días, señor Cuervo!", desde: 600, hasta: 2000};
    const a = ajustarDialogo(d, 2400, true);
    assert.equal(a.t_voz, 750);                       // despues del pop
    assert.equal(a.dialogo.hasta, 750 + 2400 + 700);  // se estira
    assert.equal(a.dialogo.velocidad, Math.round(27 / (2400 * 0.9 / 1000)));
    assert.equal(ajustarDialogo({...d, hasta: 9000}, 1000, true).dialogo.hasta, 9000, "si ya alcanza, no se acorta");
    assert.equal(ajustarDialogo({...d, velocidad: 0}, 1000, true).dialogo.velocidad, 0, "texto de una vez: se respeta");
    assert.equal(ajustarDialogo({...d, estilo: "narrador"}, 1000, false).t_voz, 600);
});

test("voces que se pisan", () => {
    assert.deepEqual(choques([{i: 0, t: 0, fin: 2000}, {i: 1, t: 1500, fin: 3000}, {i: 2, t: 3000, fin: 4000}]), [{i: 0, j: 1, desde: 1500, hasta: 2000}]);
});

test("audio: ida y vuelta del WAV, recorte de silencio, normalizar, eco y forma de onda", () => {
    const sr = 24000, x = new Float32Array(sr);                       // 1 s: silencio, tono de 0,5 s, silencio
    for (let i = sr / 4; i < sr * 3 / 4; i++) x[i] = 0.3 * Math.sin(2 * Math.PI * 220 * i / sr);
    const w = leerWav(escribirWav(x, sr));
    assert.equal(w.muestreo, sr);
    assert.equal(w.x.length, sr);
    assert.ok(Math.abs(w.x[sr / 2] - x[sr / 2]) < 1e-3);
    const r = recortarSilencio(w.x, sr);
    assert.ok(r.length > sr * 0.5 && r.length < sr * 0.6, "queda el tono con un margen");
    const n = normalizar(r, 0.9);
    assert.ok(Math.abs(Math.max(...n.map(Math.abs)) - 0.9) < 0.01);
    const e = eco(n, sr);
    assert.equal(e.length, n.length + Math.round(0.45 * sr), "el eco alarga la cola");
    assert.ok(Math.abs(e[n.length + Math.round(0.2 * sr)]) > 0, "se oye despues de la voz");
    let pv = 0, pe = 0;
    for (let i = 0; i < n.length; i++) pv = Math.max(pv, Math.abs(n[i]));
    for (let i = n.length + 200; i < e.length; i++) pe = Math.max(pe, Math.abs(e[i]));
    assert.ok(pe < pv * 0.3, "el eco es tenue frente a la voz");
    const p = picos(e);
    assert.equal(p.length, 200);
    assert.equal(Math.max(...p), 1);
});

test("insertar tiempo: corre todo lo que pasa despues y alarga la escena", async () => {
    const {insertarTiempo} = await import("../voces.mjs");
    const esc = {duracion: 10000, camara: {claves: {x: [[0, 1], [5000, 2], [8000, 3]]}},
        objetos: [{nombre: "z", claves: {x: [[1000, 0], [6000, 10]]}, acciones: [[0, "A"], [7000, "B", false]], partes: [{nombre: "p", claves: {y: [[6500, 1]]}}]}],
        efectos: [{tipo: "particulas", inicio: 0, fin: 10000, claves: {x: [[9000, 5]]}}],
        dialogos: [{texto: "a", desde: 1000, hasta: 3000}, {texto: "b", desde: 5000, hasta: 7000}, {texto: "c", desde: 4000, hasta: 6000}],
        sonidos: [{sonido: "pasos", t: 4000, recorte: [0, 2000]}, {sonido: "pop", t: 5000}]};
    const r = insertarTiempo(esc, 5000, 1500);
    assert.equal(r.duracion, 11500);
    assert.deepEqual(r.camara.claves.x.map((c) => c[0]), [0, 6500, 9500]);
    assert.deepEqual(r.objetos[0].claves.x.map((c) => c[0]), [1000, 7500], "el tramo que cruza se estira");
    assert.deepEqual(r.objetos[0].acciones.map((a) => a[0]), [0, 8500]);
    assert.equal(r.objetos[0].partes[0].claves.y[0][0], 8000);
    assert.deepEqual([r.efectos[0].inicio, r.efectos[0].fin, r.efectos[0].claves.x[0][0]], [0, 11500, 10500]);
    assert.deepEqual(r.dialogos.map((d) => [d.desde, d.hasta]), [[1000, 3000], [6500, 8500], [4000, 6000]], "el que ya empezo no se estira");
    assert.deepEqual(r.sonidos[0], {sonido: "pasos", t: 4000, recorte: [0, 3500]}, "lo que suena al insertar, se alarga");
    assert.equal(r.sonidos[1].t, 6500);
    assert.equal(esc.duracion, 10000, "no cambia la original");
});

test("insertar tiempo: tambien corre las claves_partes de una instancia", async () => {
    const {insertarTiempo} = await import("../voces.mjs");
    const esc = {duracion: 10000, objetos: [{instancia: "Tomás", nombre: "t", claves_partes: {copa: {opacidad: [[0, 1], [6900, 1, "mantener"], [7000, 0, "mantener"]]}}}]};
    const r = insertarTiempo(esc, 5000, 1500);
    assert.deepEqual(r.objetos[0].claves_partes.copa.opacidad.map((c) => c[0]), [0, 8400, 8500]);
});

test("insertar tiempo: tambien corre los pasos de alto nivel (IA-5)", async () => {
    const {insertarTiempo} = await import("../voces.mjs");
    const esc = {duracion: 10000, objetos: [], pasos: [
        {caminar: "a", a: [0, 0], desde: 1000, hasta: 6000},          // cruza el punto: se estira
        {caminar: "a", a: [9, 0], desde: 6000, velocidad: 100},         // despues: se corre
        {mirar: "a", a: "izquierda", t: 7000}, {plano: "medio", de: "a", desde: 2000, hasta: 3000}]};
    const r = insertarTiempo(esc, 5000, 1500);
    assert.deepEqual(r.pasos.map((p) => [p.t, p.desde, p.hasta]), [[undefined, 1000, 7500], [undefined, 7500, undefined], [8500, undefined, undefined], [undefined, 2000, 3000]]);
});

test("filtro de radio: recorta los graves y suma silencio con clic al principio y al final", async () => {
    const {radio} = await import("../voces.mjs");
    const SR = 24000, x = new Float32Array(SR / 2);
    for (let i = 0; i < x.length; i++) x[i] = 0.6 * Math.sin(2 * Math.PI * 80 * i / SR) + 0.3 * Math.sin(2 * Math.PI * 1000 * i / SR);
    const y = radio(x, SR);
    assert.ok(y.length > x.length, "agrega los bordes con el clic");
    // energia de 80 Hz (grave) casi eliminada: correlacion con un seno de 80 Hz baja frente a la de 1 kHz
    const corr = (f) => { let s = 0, c = 0; const off = Math.round(0.06 * SR); for (let i = 2000; i < x.length; i++) { s += y[i + off] * Math.sin(2 * Math.PI * f * i / SR); c += y[i + off] * Math.cos(2 * Math.PI * f * i / SR); } return Math.hypot(s, c); };
    assert.ok(corr(80) < corr(1000) * 0.5, `grave ${corr(80)} vs medio ${corr(1000)}`);
});
