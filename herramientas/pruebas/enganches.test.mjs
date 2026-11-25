// Pruebas de los enganches (planeacion_autoria_ia.md, fase IA-4): un objeto de la escena colgado de una
// parte de una instancia sigue su movimiento (y sus acciones).
import {test} from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";

const {Compilador, Descompilador, GestionEvento, Render} = await cargarMotor();

// asset: persona que camina (el brazo delantero se balancea), con la mano declarada como enganche
const ASSET = {tipo: "asset", nombre: "Ana", generador: "persona", parametros: {camina: true},
    enganches: {mano: {parte: "brazo_del", en: [0, 58]}, cabeza: {parte: "cabeza"}}};
const a = Compilador.compilar(ASSET, null, () => null);
const doc = {...a.resultado, _id: "a".repeat(24)};
const info = {id: doc._id, eventos: doc.eventos.map((e) => e.nombre), enganches: doc.escena.enganches,
    partes: doc.grupos_figuras.map((g) => g.nombre).filter((n) => n !== "default")};
const escena = (objetos) => Compilador.compilar({tipo: "escena", nombre: "P", duracion: 2000, camara: {centro: [640, 360]},
    objetos: [{instancia: "Ana", nombre: "ana", en: [640, 600]}, ...objetos]}, (n) => (n === "Ana" ? info : null), () => null);

test("el asset guarda sus enganches (relativos a la parte)", () => {
    assert.ok(a.ok, JSON.stringify(a.errores));
    // brazo_del nace en el hombro: la mano esta 58 mas abajo
    assert.deepEqual(doc.escena.enganches, {mano: {parte: "brazo_del", en: [0, 58]}, cabeza: {parte: "cabeza", en: [0, 0]}});
    const malo = Compilador.compilar({...ASSET, enganches: {pie: {parte: "zapato"}}}, null, () => null);
    assert.match(malo.errores.join(" "), /la parte "zapato" no existe/);
    // un asset con enganches sigue siendo asset (no escena)
    assert.equal(Descompilador.esEscena(doc), false);
});

test("en la escena: padre + enganche -> hijo de la parte de la instancia, en relativo al punto", () => {
    const r = escena([{nombre: "linterna", padre: "ana", enganche: "mano", en: [0, 4], rect: [-6, 0, 6, 24], color: "#ffcc00"},
        {nombre: "sombrero", padre: "ana", enganche: {parte: "cabeza"}, en: [0, -20], rect: [-15, -6, 15, 0]}]);
    assert.ok(r.ok, JSON.stringify(r.errores));
    const g = r.resultado.grupos_figuras.find((x) => x.nombre === "linterna");
    assert.equal(g.nodo_padre, "ana::brazo_del");
    assert.deepEqual([g.cx, g.cy], [0, 62]);
    assert.equal(r.resultado.grupos_figuras.find((x) => x.nombre === "sombrero").nodo_padre, "ana::cabeza");
});

test("errores claros del enganche", () => {
    assert.match(escena([{nombre: "x", padre: "ana", enganche: "pie", rect: [0, 0, 1, 1]}]).errores.join(" "), /no tiene el enganche "pie" \(tiene: mano, cabeza/);
    assert.match(escena([{nombre: "x", padre: "ana", enganche: {parte: "ala"}, rect: [0, 0, 1, 1]}]).errores.join(" "), /no tiene la parte "ala"/);
    assert.match(escena([{nombre: "x", enganche: "mano", rect: [0, 0, 1, 1]}]).errores.join(" "), /enganche va con padre/);
    assert.match(escena([{nombre: "caja", rect: [0, 0, 9, 9]}, {nombre: "x", padre: "caja", enganche: "mano", rect: [0, 0, 1, 1]}]).errores.join(" "), /tiene que ser una instancia/);
});

test("el objeto enganchado sigue a la mano mientras camina", async () => {
    const r = escena([{nombre: "linterna", padre: "ana", enganche: "mano", rect: [-6, 0, 6, 24], color: "#ffcc00"}]);
    const m = new GestionEvento();
    m.cargadorAssets = async () => doc;
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "e");
    m.asegurarCamara(); m.escena = r.resultado.escena || {};
    m.configuracion_lienzo.x_delta_original = 0; m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    for (let v = 0; v < 100 && [...m.assets.values()].some((x) => x.estado === "cargando"); v++) { await new Promise((q) => setTimeout(q, 10)); m.procesandoEventos(); }
    const ctx = createCanvas(32, 32).getContext("2d");
    const xs = [0, 250, 500].map((t) => {
        Render.dibujarCuadro(m, ctx, 32, 32, t);
        const l = Render.cajaMundo(m, "linterna"), b = Render.cajaMundo(m, "ana::brazo_del");
        assert.ok(l.y1 <= b.y1 + 0.5 && l.y0 >= b.y0 - 0.5, "la linterna queda en la caja del brazo (cuelga de la mano)");
        return Math.round((l.x0 + l.x1) / 2);
    });
    assert.ok(xs[0] - xs[2] > 40, `la mano va y viene al caminar: ${xs.join(", ")}`);
});

test("descompilar: vuelve como padre + enganche {parte} y da lo mismo", () => {
    const r = escena([{nombre: "linterna", padre: "ana", enganche: "mano", rect: [-6, 0, 6, 24], color: "#ffcc00"}]);
    const {def} = Descompilador.descompilar({...r.resultado, _id: "e"}, (id) => (id === doc._id ? "Ana" : null));
    const o = def.objetos.find((x) => x.nombre === "linterna");
    assert.deepEqual([o.padre, o.enganche, o.en], ["ana", {parte: "brazo_del"}, [0, 58]]);
    const r2 = Compilador.compilar(def, (n) => (n === "Ana" ? info : null), () => null);
    assert.ok(r2.ok, JSON.stringify(r2.errores));
    const g2 = r2.resultado.grupos_figuras.find((x) => x.nombre === "linterna");
    assert.deepEqual([g2.nodo_padre, g2.cx, g2.cy], ["ana::brazo_del", 0, 58]);
    // el asset vuelve con sus enganches tal cual
    assert.deepEqual(Descompilador.descompilar(doc).def.enganches, {mano: {parte: "brazo_del", en: [0, 58]}, cabeza: {parte: "cabeza"}});
});

test("girar: false: lo colgado sigue la posicion de la mano pero no su giro", async () => {
    const r = escena([{nombre: "farol", padre: "ana", enganche: "mano", girar: false, rect: [-6, 0, 6, 24], color: "#ffcc00"},
        {nombre: "farol_gira", padre: "ana", enganche: "mano", rect: [-6, 0, 6, 24], color: "#ffcc00"}]);
    assert.ok(r.ok, JSON.stringify(r.errores));
    assert.equal(r.resultado.grupos_figuras.find((x) => x.nombre === "farol").sin_giro, true);
    const m = new GestionEvento();
    m.cargadorAssets = async () => doc;
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "e");
    m.asegurarCamara(); m.escena = r.resultado.escena || {};
    m.configuracion_lienzo.x_delta_original = 0; m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    for (let v = 0; v < 100 && [...m.assets.values()].some((x) => x.estado === "cargando"); v++) { await new Promise((q) => setTimeout(q, 10)); m.procesandoEventos(); }
    const ctx = createCanvas(32, 32).getContext("2d");
    Render.dibujarCuadro(m, ctx, 32, 32, 0);        // el brazo esta girado (balanceo de caminar)
    const a = Render.cajaMundo(m, "farol"), b = Render.cajaMundo(m, "farol_gira");
    // sin giro: la caja mide lo mismo que el rect (12 x 24); girando, la caja se ensancha
    assert.ok(Math.abs((a.x1 - a.x0) - 12) < 0.01 && Math.abs((a.y1 - a.y0) - 24) < 0.01, JSON.stringify(a));
    assert.ok((b.x1 - b.x0) > 14, JSON.stringify(b));
    // y los dos cuelgan del mismo punto (la mano)
    const ca = [(a.x0 + a.x1) / 2, a.y0], cb = Render.cajaMundo(m, "ana::brazo_del");
    assert.ok(ca[1] > cb.y0 && ca[1] < cb.y1 + 30, "cuelga cerca de la mano");
    assert.match(escena([{nombre: "x", girar: false, rect: [0, 0, 1, 1]}]).errores.join(" "), /girar va con padre/);
});
