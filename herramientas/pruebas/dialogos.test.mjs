// Pruebas de los globos de dialogo (src/Clases/EditorEvento/Dialogos.js y el compilador).
// planeacion_zorro_cuervo.md, fase 2.   node --test herramientas/pruebas/
import {test} from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";

const {Compilador, Descompilador, GestionEvento, Render, Dialogos} = await cargarMotor();
const {cortarLineas, estadoGlobo, ubicarGlobo, letras} = Dialogos;
const medir = (s) => letras(s).length * 10;          // 10 px por letra

test("cortar lineas: por palabras, respeta saltos y parte palabras largas", () => {
    assert.deepEqual(cortarLineas("hola que tal amigo", 100, medir), ["hola que", "tal amigo"]);
    assert.deepEqual(cortarLineas("uno\ndos", 100, medir), ["uno", "dos"]);
    assert.deepEqual(cortarLineas("supercalifragilistico", 50, medir), ["super", "calif", "ragil", "istic", "o"]);
    assert.deepEqual(cortarLineas("¡Qué plumas!", 200, medir), ["¡Qué plumas!"]);
    for (const l of cortarLineas("Quien vive del halago paga con lo que tiene", 120, medir)) assert.ok(medir(l) <= 120, l);
});

test("estado en el tiempo: aparece con rebote, escribe letra por letra y se desvanece", () => {
    const d = {texto: "Hola mundo", desde: 1000, hasta: 3000, velocidad: 20};
    assert.equal(estadoGlobo(d, 999), null);
    assert.equal(estadoGlobo(d, 3001), null);
    const e0 = estadoGlobo(d, 1000);
    assert.equal(e0.letras, 0);
    assert.ok(e0.escala < 0.2);
    assert.ok(estadoGlobo(d, 1150).escala > 1, "el rebote pasa de 1");
    assert.equal(estadoGlobo(d, 1300).escala, 1);
    assert.equal(estadoGlobo(d, 1110 + 250).letras, 5);    // 250 ms a 20 letras/s
    assert.equal(estadoGlobo(d, 2900).letras, 10);           // nunca mas que el texto
    assert.ok(estadoGlobo(d, 2900).alfa < 1 && estadoGlobo(d, 2000).alfa === 1);
    assert.equal(estadoGlobo({...d, velocidad: 0}, 1001).letras, 10);
});

test("ubicar: arriba de quien habla, dentro del cuadro, abajo si no cabe y sin tapar otro globo", () => {
    const r = {x0: 0, y0: 0, w: 720, h: 1280};
    const base = {w: 300, h: 100, r, cola: 40, margen: 20};
    const a = ubicarGlobo({...base, caja: {x0: 300, y0: 600, x1: 420, y1: 800}});
    assert.equal(a.lado, "arriba");
    assert.ok(a.y1 <= 600 && a.punta.x === 360 && a.x0 === 210);
    // pegado al borde derecho: el globo entra en el cuadro
    const b = ubicarGlobo({...base, caja: {x0: 650, y0: 600, x1: 720, y1: 800}});
    assert.ok(b.x1 <= 700);
    // arriba del todo: va abajo
    const c = ubicarGlobo({...base, caja: {x0: 300, y0: 40, x1: 420, y1: 200}});
    assert.equal(c.lado, "abajo");
    assert.ok(c.y0 >= 200);
    // otro globo en el mismo lugar: se corre
    const d = ubicarGlobo({...base, caja: {x0: 300, y0: 600, x1: 420, y1: 800}, ocupados: [a]});
    assert.ok(d.y1 <= a.y0, "no tapa al primero");
});

test("compilador: valida dialogos y la ida y vuelta es exacta", () => {
    const esc = (dialogos) => ({tipo: "escena", nombre: "d", duracion: 5000, camara: {tamano: [720, 1280]},
        objetos: [{nombre: "zorro", en: [200, 900], circulo: {r: 60}, color: "#d2691e"}], dialogos});
    const ok = Compilador.compilar(esc([
        {quien: "zorro", texto: "¡Hola!", desde: 0, hasta: 2000},
        {quien: "zorro", texto: "Mmm…", desde: 2000, hasta: 3000, estilo: "pensamiento", lado: "abajo"},
        {texto: "Moraleja", desde: 3000, hasta: 5000, estilo: "narrador", posicion: "abajo"},
    ]), () => null, () => null);
    assert.ok(ok.ok, JSON.stringify(ok.errores));
    assert.equal(ok.resultado.escena.dialogos.length, 3);
    assert.equal(ok.resultado.escena.dialogos[2].quien, undefined);
    const vuelta = Descompilador.descompilar({...ok.resultado, nombre: "d"}, () => null, () => null);
    assert.deepEqual(vuelta.def.dialogos, ok.resultado.escena.dialogos);
    assert.ok(!vuelta.avisos.some((a) => /dialogos/.test(a)));

    const mal = Compilador.compilar(esc([
        {quien: "lobo", texto: "x", desde: 0, hasta: 1000},
        {quien: "zorro", texto: "", desde: 0, hasta: 1000},
        {quien: "zorro", texto: "x", desde: 1000, hasta: 500},
        {quien: "zorro", texto: "x", desde: 0, hasta: 1000, estilo: "susurro"},
        {quien: "zorro", texto: "x", desde: 0, hasta: 1000, color: "rojo"},
    ]), () => null, () => null);
    assert.ok(!mal.ok);
    for (const patron of [/lobo/, /falta texto/, /hasta > desde/, /susurro/, /color/]) {
        assert.ok(mal.errores.some((e) => patron.test(e)), `falta error ${patron}: ${mal.errores.join(" | ")}`);
    }
    // sin dialogos: la escena no cambia
    assert.equal(Compilador.compilar(esc(undefined), () => null, () => null).resultado.escena.dialogos, undefined);
});

test("render: el globo se dibuja sobre quien habla y el narrador en el borde", () => {
    const def = {tipo: "escena", nombre: "d", duracion: 4000, camara: {tamano: [720, 1280]},
        objetos: [{nombre: "fondo", en: [0, 0], rect: [-50, -50, 770, 1330], color: "#000000"},
                  {nombre: "zorro", en: [360, 900], circulo: {r: 60}, color: "#000000"}],
        dialogos: [{quien: "zorro", texto: "Hola", desde: 0, hasta: 4000, velocidad: 0},
                   {texto: "Narrador", desde: 0, hasta: 4000, estilo: "narrador", posicion: "arriba", velocidad: 0}]};
    const r = Compilador.compilar(def, () => null, () => null);
    const m = new GestionEvento();
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "escena");
    m.asegurarCamara();
    m.escena = r.resultado.escena;
    m.configuracion_lienzo.x_delta_original = 0;
    m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    const cv = createCanvas(360, 640), ctx = cv.getContext("2d");
    Render.dibujarCuadro(m, ctx, 360, 640, 2000);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    // fondo negro; el globo blanco queda arriba del zorro (zorro en y=900 de 1280 -> 450 de 640)
    let blancos = 0;
    for (let y = 300; y < 420; y += 4) if (px(180, y)[0] > 230) blancos++;
    assert.ok(blancos > 3, "hay globo blanco arriba del zorro");
    // el narrador: franja oscura con texto blanco arriba (no es negro puro)
    let franja = 0;
    for (let y = 10; y < 70; y += 2) { const p = px(30, y); if (p[0] > 10 && p[0] < 60) franja++; }
    assert.ok(franja > 3, "franja del narrador arriba");
});

test("la cola apunta a la cabeza de quien habla (o a la parte pedida), si no al objeto entero", () => {
    const {cajaHablante} = Dialogos;
    const cajas = {"zorro": {x0: 0, y0: 0, x1: 300, y1: 200}, "zorro::cabeza": {x0: 220, y0: 10, x1: 290, y1: 80}, "zorro::boca": {x0: 270, y0: 60, x1: 290, y1: 70}};
    const cajaDe = (n) => cajas[n] || null;
    assert.deepEqual(cajaHablante({quien: "zorro"}, cajaDe), cajas["zorro::cabeza"]);
    assert.deepEqual(cajaHablante({quien: "zorro", parte: "boca"}, cajaDe), cajas["zorro::boca"]);
    assert.deepEqual(cajaHablante({quien: "zorro", parte: "cola"}, cajaDe), cajas.zorro, "parte que no existe: el objeto entero");
    assert.deepEqual(cajaHablante({quien: "arbol"}, (n) => (n === "arbol" ? {x0: 1, y0: 1, x1: 2, y1: 2} : null)), {x0: 1, y0: 1, x1: 2, y1: 2});
});

test("nube de pensamiento: el contorno siempre cierra (sin NaN en el feston de la derecha)", () => {
    const {geometriaNube} = Dialogos;
    const M = {fuente: 22, relleno: 14};
    for (let w = 40; w <= 600; w += 0.37) for (const h of [30, 47.5, 76, 104.3]) {
        const g = geometriaNube({x0: 10, y0: 20, x1: 10 + w, y1: 20 + h}, M);
        assert.equal(g.angulos.length, g.n + 1);
        assert.ok(g.angulos.every(Number.isFinite), `NaN con w=${w} h=${h}`);
        assert.equal(g.angulos[g.n], Math.PI * 2);
        for (let i = 1; i <= g.n; i++) assert.ok(g.angulos[i] > g.angulos[i - 1], `angulos sin orden con w=${w} h=${h}`);
    }
});

// ---- estilo "texto": letras en la escena
test("texto en escena: se escribe, el cursor parpadea al terminar y el compilador lo valida", () => {
    const d = {texto: "HOLA", desde: 1000, hasta: 5000, velocidad: 10, cursor: true};
    assert.equal(Dialogos.estadoTexto(d, 900), null);
    assert.equal(Dialogos.estadoTexto(d, 1250).letras, 2);
    assert.equal(Dialogos.estadoTexto(d, 1250).cursor, true);           // fijo mientras escribe
    assert.equal(Dialogos.estadoTexto(d, 1400 + 100).letras, 4);
    const fin = 1000 + 400;                                              // 4 letras a 10/s
    assert.equal(Dialogos.estadoTexto(d, fin + 100).cursor, true);
    assert.equal(Dialogos.estadoTexto(d, fin + 600).cursor, false);       // parpadeo
    assert.equal(Dialogos.estadoTexto({...d, cursor: undefined}, 1250).cursor, false);

    const esc = (dialogos) => ({tipo: "escena", nombre: "d", duracion: 5000,
        objetos: [{nombre: "monitor", en: [300, 300], rect: [-100, -60, 100, 60], color: "#000000"}], dialogos});
    const ok = Compilador.compilar(esc([
        {quien: "monitor", texto: "DATOS INSUFICIENTES", desde: 0, hasta: 4000, estilo: "texto", en: [-90, 0], tamano: 14,
            fuente: "mono", color: "#7dff9a", ancho: 180, cursor: true, resplandor: 6},
        {texto: "Hágase la luz", desde: 0, hasta: 4000, estilo: "texto", en: [640, 360], tamano: 40, alinear: "centro"},
    ]), () => null, () => null);
    assert.ok(ok.ok, JSON.stringify(ok.errores));
    assert.equal(ok.resultado.escena.dialogos[0].fuente, "mono");
    assert.equal(ok.resultado.escena.dialogos[1].quien, undefined);
    const vuelta = Descompilador.descompilar({...ok.resultado, nombre: "d"}, () => null, () => null);
    assert.deepEqual(vuelta.def.dialogos, ok.resultado.escena.dialogos);
    const mal = Compilador.compilar(esc([
        {texto: "x", desde: 0, hasta: 2000, estilo: "texto"},
        {texto: "x", desde: 0, hasta: 2000, estilo: "texto", en: [0, 0], tamano: 10, fuente: "gotica"},
        {quien: "monitor", texto: "x", desde: 0, hasta: 2000, tamano: 10},
    ]), () => null, () => null);
    for (const patron of [/en es \[x, y\]/, /tamano/, /gotica|fuente/, /solo valen con estilo "texto"/]) {
        assert.ok(mal.errores.some((e) => patron.test(e)), `falta error ${patron}: ${mal.errores.join(" | ")}`);
    }
});

test("texto en escena: se dibuja donde dice, relativo a su objeto, y sigue el zoom de la camara", () => {
    const def = {tipo: "escena", nombre: "d", duracion: 4000, camara: {centro: [640, 360], zoom: 2},
        objetos: [{nombre: "fondo", en: [0, 0], rect: [-100, -100, 1400, 900], color: "#000000"},
                  {nombre: "monitor", en: [640, 360], rect: [-60, -30, 60, 30], color: "#000000"}],
        dialogos: [{quien: "monitor", texto: "████", desde: 0, hasta: 4000, estilo: "texto", en: [0, 0], tamano: 20,
            alinear: "centro", color: "#00ff00", velocidad: 0}]};
    const r = Compilador.compilar(def, () => null, () => null);
    assert.ok(r.ok, JSON.stringify(r.errores));
    const m = new GestionEvento();
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "escena");
    m.asegurarCamara();
    m.escena = r.resultado.escena;
    m.configuracion_lienzo.x_delta_original = 0;
    m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    const cv = createCanvas(640, 360), ctx = cv.getContext("2d");
    Render.dibujarCuadro(m, ctx, 640, 360, 1000);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    // centro del cuadro: verde (el texto en el centro del monitor); lejos del centro: negro
    assert.ok(px(320, 180)[1] > 150, `centro verde: ${px(320, 180)}`);
    assert.ok(px(60, 40)[1] < 30, "esquina negra");
    // con zoom 2 y salida de la mitad de 1280: alto de letra ~20 px; a 25 px del centro ya no hay verde
    assert.ok(px(320, 180 + 25)[1] < 60, `debajo del texto: ${px(320, 205)}`);
});
