// Fase 4 de planeacion_capacidades.md: sombras proyectadas. Sin base de datos: compila una
// escena en memoria, la dibuja y mide pixeles.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";
import {diferencias} from "../lib/comparar.mjs";

const {Compilador, Descompilador, GestionEvento, Render} = await cargarMotor();

// piso blanco; un "poste" (rect de 20 x 200) con los pies en (640, 600)
const escena = (sombra, extra = {}) => ({tipo: "escena", nombre: "S", duracion: 2000, camara: {centro: [640, 360]}, objetos: [
    {nombre: "piso", en: [0, 0], plano: -1, rect: [0, 0, 1280, 720], color: "#ffffff"},
    ...(extra.lampara ? [{nombre: "lampara", en: [0, 0], plano: -1, partes: [], claves: {x: [[0, 200], [2000, 1080]], y: [[0, 300]]}}] : []),
    {nombre: "poste", en: [640, 600], rect: [-10, -200, 10, 0], color: "#ffffff", ...(sombra !== undefined ? {sombra} : {}), ...(extra.claves ? {claves: extra.claves} : {})},
]});

function dibujar(def, t = 0) {
    const r = Compilador.compilar(def, () => null, () => null);
    assert.deepEqual(r.errores, []);
    const m = new GestionEvento();
    m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "x");
    m.asegurarCamara();
    m.escena = r.resultado.escena || {};
    m.configuracion_lienzo.x_delta_original = 0; m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    const c = createCanvas(1280, 720), ctx = c.getContext("2d");
    Render.dibujarCuadro(m, ctx, 1280, 720, t, {});
    return (x, y) => ctx.getImageData(x, y, 1, 1).data[0];    // rojo (0 = negro, 255 = blanco)
}

test("sombra: sin el campo no hay sombra; con sombra se oscurece el piso detras de los pies", () => {
    // angulo 30: el punto a 100 px de altura cae en x = 640 + 100 tan30 = 698, y = 600 - 100 * 0.3 = 570
    const sin = dibujar(escena(undefined)), con = dibujar(escena({angulo: 30, desenfoque: 0}));
    assert.equal(sin(698, 570), 255);
    assert.ok(Math.abs(con(698, 570) - 166) <= 3, `opacidad 0.35 sobre blanco (${con(698, 570)})`);
    assert.equal(con(698, 630), 255, "no cae delante del piso");
});

test("sombra: luz a la izquierda la inclina a la derecha (y al reves); aplastar negativo cae adelante", () => {
    const izq = dibujar(escena({luz: [240, 300], desenfoque: 0, opacidad: 1})), der = dibujar(escena({luz: [1040, 300], desenfoque: 0, opacidad: 1}));
    // k = (640 - 240) / (600 - 300) = 1.33: a 183 px de altura cae en x = 640 + 244 = 884, y = 545
    assert.ok(izq(884, 545) < 100 && izq(396, 545) === 255, "luz a la izquierda -> sombra a la derecha");
    assert.ok(der(396, 545) < 100 && der(884, 545) === 255, "luz a la derecha -> sombra a la izquierda");
    const adelante = dibujar(escena({angulo: 30, aplastar: -0.3, desenfoque: 0, opacidad: 1}));
    assert.ok(adelante(698, 630) < 100 && adelante(698, 570) === 255);
});

test("sombra: la luz puede ser un objeto que se mueve; al saltar la sombra se aclara", () => {
    const def = escena({luz: "lampara", desenfoque: 0, opacidad: 1}, {lampara: true});
    const t0 = dibujar(def, 0), t1 = dibujar(def, 2000);
    // lampara en (200, 300) -> k = 1.47 -> x = 908; en (1080, 300) -> x = 372
    assert.ok(t0(908, 545) < 100 && t1(372, 545) < 100, "la sombra gira con la lampara");
    const salto = escena({angulo: 30, desenfoque: 0, opacidad: 1}, {claves: {y: [[0, 600], [1000, 450]]}});
    // pies a 150 px del piso: caen en x = 640 + 150 tan30 = 727, y = 600 - 45 = 555
    const piso = dibujar(salto, 0)(698, 570), aire = dibujar(salto, 1000)(727, 552);
    assert.ok(aire > piso, `en el aire es mas clara (${aire} > ${piso})`);
});

test("sombra: alcance la desvanece lejos de la luz", () => {
    const cerca = dibujar(escena({luz: [540, 300], alcance: 1000, desenfoque: 0, opacidad: 1}));
    const lejos = dibujar(escena({luz: [540, 300], alcance: 120, desenfoque: 0, opacidad: 1}));
    // k = 100/300: a 100 px de altura cae en x = 673, y = 570
    assert.ok(cerca(673, 570) < lejos(673, 570), "con poco alcance, mas clara");
    assert.equal(dibujar(escena({luz: [540, 300], alcance: 90, desenfoque: 0, opacidad: 1}))(673, 570), 255, "fuera del alcance no hay sombra");
});

test("sombra: superposiciones no oscurecen el doble (silueta unica)", () => {
    const def = escena({angulo: 30, desenfoque: 0, opacidad: 0.5});
    def.objetos[1].partes = [{nombre: "a", rect: [-10, -100, 10, 0], color: "#fff"}, {nombre: "b", rect: [-10, -100, 10, 0], color: "#fff"}];
    const px = dibujar(def);
    assert.ok(Math.abs(px(660, 590) - 128) <= 3, `opacidad 0.5 sobre blanco = gris medio (${px(660, 590)})`);
});

test("sombra: validacion y ida y vuelta (piso por defecto en los pies)", () => {
    const def = escena([{luz: [100, 100]}, {angulo: 30, opacidad: 0.2}]);
    const r1 = Compilador.compilar(def, () => null, () => null);
    assert.deepEqual(r1.resultado.grupos_figuras.find((g) => g.nombre === "poste").sombra.map((s) => s.piso), [600, 600]);
    const {def: d1, avisos} = Descompilador.descompilar(r1.resultado);
    assert.deepEqual(avisos, []);
    assert.deepEqual(diferencias(r1.resultado, Compilador.compilar(d1, () => null, () => null).resultado), []);
    const err = (s) => Compilador.compilar(escena(s), () => null, () => null).errores.join(" | ");
    assert.match(err({luz: "nadie"}), /no es un objeto de la escena/);
    assert.match(err({luz: 5}), /luz es/);
    assert.match(err({sol: 1}), /campos desconocidos/);
    assert.match(err({opacidad: "mucha"}), /opacidad es un numero/);
});

test("precision decimal: sin el campo se redondea como siempre; con \"decimal\" no", () => {
    // un rect de 0.4 px de ancho en x = 640.6: entero -> se redondea a 640..640 (casi nada); decimal -> se ve
    const def = (precision) => ({tipo: "escena", nombre: "P", duracion: 1000, ...(precision ? {precision} : {}), camara: {centro: [640, 360], zoom: 8},
        objetos: [{nombre: "piso", en: [0, 0], plano: -1, rect: [0, 0, 1280, 720], color: "#ffffff"},
            {nombre: "barra", en: [640.6, 300], rect: [0, 0, 0.9, 120], color: "#000000"}]});
    const r = Compilador.compilar(def("decimal"), () => null, () => null);
    assert.equal(r.resultado.escena.precision, "decimal");
    const ent = dibujar(def()), dec = dibujar(def("decimal"));
    // con zoom 8, x = 640.6 cae 4.8 px a la derecha del centro (640 de la imagen) en decimal, y en 640 redondeado
    assert.ok(dec(645, 360) < 128 && dec(639, 360) > 200, `decimal: la barra empieza en 644.8 (${dec(645, 360)}, ${dec(639, 360)})`);
    assert.ok(ent(641, 360) < 128 || ent(640, 360) < 128, "entero: la barra quedo en 640");
    assert.match(Compilador.compilar(def("media"), () => null, () => null).errores.join("|"), /precision "media"/);
});
