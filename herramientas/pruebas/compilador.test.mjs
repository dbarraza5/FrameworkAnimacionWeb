// Pruebas del formato simple (Fase A1): compilador, descompilador y generadores.
// No usan la base de datos.   npm run pruebas   (dentro del contenedor del frontend)
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import {cargarMotor} from "../lib/motor.mjs";
import {diferencias} from "../lib/comparar.mjs";

const {Compilador, Descompilador, Generadores, Fisica} = await cargarMotor();
const opciones = {efectoDefecto: Fisica.efectoDefecto};

// catalogo de mentira para las escenas
const ASSETS = new Map([
    ["Casa", {id: "a00000000000000000000001", eventos: ["EventoGeneral"]}],
    ["Persona", {id: "a00000000000000000000002", eventos: ["EventoGeneral", "Caminar"]}],
]);
const buscar = (n) => ASSETS.get(n) || null;
const porId = (id) => [...ASSETS].find(([, v]) => v.id === id)?.[0] || null;
// sonidos de mentira (planeacion_sonido.md)
const SONIDOS = new Map([["Bang", "b0000000000000000000000a"], ["Golpe", "b0000000000000000000000b"], ["Musica", "b0000000000000000000000c"], ["Pasos", "b0000000000000000000000d"]]);
const buscarSon = (n) => (SONIDOS.has(n) ? {id: SONIDOS.get(n)} : null);
const nombreSon = (id) => [...SONIDOS].find(([, v]) => v === id)?.[0] || null;

const grupo = (r, nombre) => r.resultado.grupos_figuras.find((g) => g.nombre === nombre);
const contiene = (lista, texto) => assert.ok(lista.some((e) => e.includes(texto)), `se esperaba "${texto}" en:\n  ${lista.join("\n  ")}`);

// compilar -> descompilar -> compilar da lo mismo, y descompilar es estable
function idaYVuelta(def) {
    const r1 = Compilador.compilar(def, buscar, buscarSon);
    assert.deepEqual(r1.errores, []);
    const {def: d1, avisos} = Descompilador.descompilar(r1.resultado, porId, nombreSon);
    assert.deepEqual(avisos, []);
    const r2 = Compilador.compilar(d1, buscar, buscarSon);
    assert.deepEqual(r2.errores, []);
    assert.deepEqual(diferencias(r1.resultado, r2.resultado, opciones), []);
    assert.deepEqual(Descompilador.descompilar(r2.resultado, porId, nombreSon).def, d1);
    return d1;
}

test("rect: 4 rectas encadenadas y un contorno cerrado", () => {
    const r = Compilador.compilar({tipo: "asset", nombre: "x", partes: [{nombre: "a", rect: [0, 0, 10, 20], color: "#ff0000"}]});
    assert.equal(r.ok, true);
    const g = grupo(r, "a");
    assert.equal(g.lista_figuras.length, 4);
    assert.ok(g.lista_figuras.every((f) => f.tipo_figura === "RECTA"));
    assert.equal(g.lista_pintado[0].color, "#ff0000");
    assert.equal(g.lista_pintado[0].elementos[0].length, 4);
    const a = g.lista_figuras[0].atributos;
    assert.deepEqual([a.cx + a.x1, a.cy + a.y1], [0, 0]);
});

test("circulo: lados por defecto y configurables", () => {
    const r = Compilador.compilar({tipo: "asset", nombre: "x", partes: [
        {nombre: "a", circulo: 10}, {nombre: "b", circulo: {r: 10, ry: 5, lados: 8}}, {nombre: "c", elipse: [4, 2]}]});
    assert.equal(r.ok, true);
    assert.equal(grupo(r, "a").lista_figuras.length, 14);
    assert.equal(grupo(r, "b").lista_figuras.length, 8);
    assert.equal(grupo(r, "c").lista_figuras.length, 16);
});

test("errores con mensajes que dicen que hacer", () => {
    const r = Compilador.compilar({tipo: "asset", nombre: "x", partes: [
        {nombre: "a", rect: [0, 0, 1, 1], circulo: 3},
        {nombre: "a", rect: [0, 0, 1, 1]},
        {nombre: "b", rect: [0, 0, 1, 1], claves: {altura: [[0, 1]]}},
        {nombre: "c", rect: [0, 0, 1, 1], claves: {x: [[0, 1, "rapido"]]}},
        {nombre: "d", poligono: [[0, 0], [1, 1]]},
    ]});
    assert.equal(r.ok, false);
    contiene(r.errores, "una sola forma");
    contiene(r.errores, 'nombre repetido "a"');
    contiene(r.errores, 'propiedad animable desconocida "altura"');
    contiene(r.errores, 'interpolacion "rapido" desconocida');
    contiene(r.errores, "al menos 3 puntos");

    const e = Compilador.compilar({tipo: "escena", nombre: "e", objetos: [
        {instancia: "No existe", en: [0, 0]}, {instancia: "Persona", en: [0, 0], evento: "Volar"}, {instancia: "Casa", en: [0, 0], fisica: "flotar"}],
        efectos: [{tipo: "rayo", en: [0, 0]}, {tipo: "explosion", en: [0, 0], potencia: 3}]}, buscar);
    contiene(e.errores, "falta duracion");
    contiene(e.errores, 'no existe el asset "No existe"');
    contiene(e.errores, 'no tiene el evento "Volar"');
    contiene(e.errores, 'fisica "flotar" desconocida');
    contiene(e.errores, 'tipo de efecto desconocido "rayo"');
    contiene(e.avisos, 'parametro "potencia" no existe en explosion');
    assert.equal(Compilador.compilar({tipo: "otro"}).ok, false);
});

test("los ejemplos de herramientas/ejemplos compilan", () => {
    const molino = JSON.parse(fs.readFileSync(new URL("../ejemplos/molino.json", import.meta.url)));
    const r = Compilador.compilar(molino);
    assert.deepEqual(r.errores, []);
    const calle = JSON.parse(fs.readFileSync(new URL("../ejemplos/calle_molino.json", import.meta.url)));
    const nombres = new Set(calle.objetos.map((o) => o.instancia));
    const e = Compilador.compilar(calle, (n) => (nombres.has(n) ? {id: "b".repeat(24)} : null));
    assert.deepEqual(e.errores, []);
});

test("cada generador compila con sus valores por defecto y con parametros", () => {
    for (const [nombre, g] of Object.entries(Generadores.GENERADORES)) {
        const r = Compilador.compilar({tipo: "asset", nombre: "g", generador: nombre});
        assert.deepEqual(r.errores, [], nombre);
        assert.deepEqual(r.avisos, [], nombre);
        assert.ok(r.resultado.grupos_figuras.length > 1, nombre);
        idaYVuelta({tipo: "asset", nombre: "g", generador: nombre});
        assert.ok(Object.keys(g.parametros).length >= 0);
    }
    const r = Compilador.compilar({tipo: "asset", nombre: "g", generador: "casa", parametros: {pisos: 2, inventado: 1}});
    contiene(r.avisos, 'parametro "inventado" no existe en el generador casa');
    contiene(Compilador.compilar({tipo: "asset", nombre: "g", generador: "dragon"}).errores, 'generador "dragon" desconocido');
});

test("cada opcion de cada generador compila y vuelve exacta; una opcion invalida es error", () => {
    for (const [nombre, g] of Object.entries(Generadores.GENERADORES)) {
        for (const [k, lista] of Object.entries(g.opciones || {})) {
            for (const v of lista) {
                const def = {tipo: "asset", nombre: "g", generador: nombre, parametros: {[k]: v}};
                assert.deepEqual(Compilador.compilar(def).errores, [], `${nombre} ${k}=${v}`);
                idaYVuelta(def);
            }
        }
    }
    contiene(Compilador.compilar({tipo: "asset", nombre: "g", generador: "auto", parametros: {modelo: "tractor"}}).errores,
        'parametro "modelo" = "tractor" no es valido');
    // variantes que cambian el dibujo
    const partes = (p) => Compilador.compilar({tipo: "asset", nombre: "g", generador: "persona", parametros: p}).resultado.grupos_figuras.map((x) => x.nombre);
    assert.ok(partes({peinado: "largo"}).includes("melena"));
    assert.ok(!partes({}).includes("melena"));
    const edificio = (p) => Compilador.compilar({tipo: "asset", nombre: "g", generador: "edificio", parametros: p}).resultado.grupos_figuras.length;
    assert.ok(edificio({pisos: 8, columnas: 4}) > edificio({pisos: 3, columnas: 2}));
});

test("ida y vuelta: asset con todo", () => {
    const d = idaYVuelta({tipo: "asset", nombre: "Todo", duracion: 2400, partes: [
        {nombre: "cuerpo", en: [10, 20], rect: [-20, -40, 20, 0], color: "#3366ff", borde: "#111111", capa: 5, partes: [
            {nombre: "brazo", en: [18, -30], poligono: [[0, 0], [4, 0], [4, 25], [0, 25]], pivote: [2, 0],
                claves: {rotacion: [[0, -30, "suave"], [1200, 30, "suave"]]}, bucle: "ida_vuelta"},
            {nombre: "ojo", circulo: {r: 3, lados: 8}, opacidad: 0.5, visible: false, clases: ["cara"]},
        ]},
        {nombre: "aspa", elipse: [30, 6], giro: {desde: 0, hasta: 360, ms: 1000}},
        {nombre: "estirado", rect: [0, 0, 5, 5], escala: [2, 0.5], rotacion: 15},
        {nombre: "raro", crudo: {lista_figuras: [{nombre: "c1", tipo_figura: "CIRCULO", atributos: {cx: 0, cy: 0, radio: 7}}],
            lista_pintado: [{color: "#00ff00", visible: true, elementos: []}]}},
        {nombre: "vacio", borde: "#abcdef"},
    ]});
    const cuerpo = d.partes.find((p) => p.nombre === "cuerpo");
    assert.equal(cuerpo.borde, "#111111");
    assert.equal(cuerpo.capa, 5);
    assert.ok(d.partes.find((p) => p.nombre === "raro").crudo);
});

test("ida y vuelta: escena con todo", () => {
    idaYVuelta({tipo: "escena", nombre: "E", duracion: 6000, profundidad: true, gravedad: 900,
        camara: {nombre: "Cam", centro: [500, 300], zoom: 1.5, tamano: [800, 600], temblor: {desde: 1000, hasta: 1600, amplitud: 8}},
        objetos: [
            {instancia: "Casa", nombre: "casa", en: [300, 400], ancla: [0, 50], escala: [1.2, 0.9], espejo: true, plano: -1,
                fisica: {modo: "desarmar", nivel: 2}, borde: "#000000", capa: 7},
            {instancia: "Persona", en: [100, 500], evento: "Caminar", desfase: 300, bucle: false, version: "c00000000000000000000003",
                claves: {x: [[0, 100], [6000, 900, "entrar"]], opacidad: [[0, 0], [500, 1]]}, repetir: "repetir", fisica: "rigido"},
            {nombre: "cartel", en: [700, 450], ancla: [0, 40], rect: [-30, -40, 30, 0], color: "#ffffff", rotacion: 5,
                partes: [{nombre: "letra", en: [0, -20], rect: [-5, -5, 5, 5]}]},
        ],
        efectos: [
            {tipo: "explosion", nombre: "Bum", en: [300, 380], t: 2000, fuerza: 1150},
            {tipo: "particulas", en: [300, 380], inicio: 2000, fin: 2500, claves: {x: [[0, 300], [3000, 500]]}, repetir: "ida_vuelta"},
        ],
        eventos: [{nombre: "EventoGeneral", nodo_padre: "Nodo_Default", visible: true, bucle: false, tiempo_bucle: 0,
            tiempo_inicio: 0, tiempo_final: 6000, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0,
            objetos: [{nombre: "casa", movimientos: []}], macros: [], script: null}],
    });
});

test("un parametro de efecto que falta vale su valor por defecto", () => {
    const a = {grupos_figuras: [{nombre: "e", clases: ["efecto"], efecto: {tipo: "disparo", t: 100}}], eventos: []};
    const b = {grupos_figuras: [{nombre: "e", clases: ["efecto"], efecto: {...Fisica.efectoDefecto("disparo"), t: 100}}], eventos: []};
    assert.deepEqual(diferencias(a, b, opciones), []);
    assert.notDeepEqual(diferencias(a, b), []);
});

test("sonido en el formato simple: clips, reacciones, marcas y ajuste de instancia (ida y vuelta)", () => {
    const d = idaYVuelta({tipo: "escena", nombre: "Con sonido", duracion: 5000, sonido: "lleva",
        sonidos: [{sonido: "Musica", t: 0, bucle: true, volumen: 0.5}, {sonido: "Pasos", t: 1000, evento: "EventoGeneral"}],
        marcas: {EventoGeneral: "lleva"}, reacciones: {al_soltarse: "Golpe"},
        objetos: [{instancia: "Casa", nombre: "casa", en: [0, 0], fisica: "desarmar", sonido: "lleva",
            reacciones: {al_soltarse: "Golpe", al_tocar_suelo: {sonido: "Golpe", max: 2}}, audio: {volumen: 0.3}},
            {instancia: "Persona", nombre: "p", en: [10, 0], sonido: "no_lleva", audio: {silencio: true}}],
        efectos: [{tipo: "disparo", nombre: "Tiro", en: [0, 0], reacciones: {al_disparar: "Bang", al_impactar: {sonido: "Golpe", volumen: 0.9}},
            sonidos: [{sonido: "Bang", t: 100}]}]});
    assert.equal(d.efectos[0].reacciones.al_disparar, "Bang");
    const r = Compilador.compilar(d, buscar, buscarSon).resultado;
    assert.equal(r.escena.sonidos[0].sonido, SONIDOS.get("Musica"));
    assert.equal(r.eventos[0].sonidos[0].t, 1000);
    assert.equal(r.grupos_figuras.find((g) => g.nombre === "casa").instancia.audio.volumen, 0.3);
    // asset: clips por evento y reacciones que heredan sus instancias
    idaYVuelta({tipo: "asset", nombre: "Perro", generador: "persona", sonidos: [{sonido: "Pasos", t: 250}], reacciones: {al_soltarse: "Golpe"}, marcas: {EventoGeneral: "lleva"}});
});

test("sonido: errores claros (sonido inexistente, reaccion que no aplica, marca invalida)", () => {
    const r = Compilador.compilar({tipo: "escena", nombre: "e", duracion: 1000, sonido: "quizas", sonidos: [{sonido: "Ladrido", t: 0}],
        objetos: [{instancia: "Casa", en: [0, 0], reacciones: {al_disparar: "Bang"}}],
        efectos: [{tipo: "explosion", en: [0, 0], reacciones: {al_impactar: "Golpe"}}]}, buscar, buscarSon);
    contiene(r.errores, 'no existe el sonido "Ladrido"');
    contiene(r.errores, 'reaccion "al_disparar" no aplica aqui');
    contiene(r.errores, 'reaccion "al_impactar" no aplica aqui (validas: al_detonar)');
    contiene(r.errores, 'sonido (marca) es "lleva" o "no_lleva"');
    // sin catalogo de sonidos
    contiene(Compilador.compilar({tipo: "escena", nombre: "e", duracion: 1000, sonidos: [{sonido: "Bang"}], objetos: []}, buscar).errores, "no hay catalogo de sonidos");
});

// ---------------- calidad: morphing, jerarquia, degradado, desenfoque, mezcla ----------------
const ovalo = (w, h) => Array.from({length: 10}, (_, i) => [Math.round(w * Math.cos(i / 10 * 2 * Math.PI)), Math.round(h * Math.sin(i / 10 * 2 * Math.PI))]);

test("morphing: formas -> grupos ocultos, claves.forma con nombres completos (ida y vuelta)", () => {
    const def = {tipo: "asset", nombre: "Boca", partes: [
        {nombre: "labios", poligono: ovalo(30, 4), color: "#b03a48",
            formas: {a: {poligono: ovalo(26, 22)}, o: {poligono: ovalo(14, 16)}},
            claves: {forma: [[0, ""], [300, "a", "suave"], [600, "o"]]}}]};
    const r = Compilador.compilar(def, buscar, buscarSon);
    assert.deepEqual(r.errores, []);
    assert.deepEqual(r.avisos, []);
    const a = grupo(r, "labios~a");
    assert.equal(a.visible, false);
    assert.equal(a.nodo_padre, "labios");
    assert.deepEqual(grupo(r, "labios").claves.forma.map((c) => c.v), ["", "labios~a", "labios~o"]);
    idaYVuelta(def);
});

test("morphing: forma inexistente es error; topologia distinta es aviso", () => {
    const r = Compilador.compilar({tipo: "asset", nombre: "B", partes: [
        {nombre: "x", poligono: ovalo(10, 10), formas: {t: {rect: [0, 0, 5, 5]}}, claves: {forma: [[0, "t"], [100, "nada"]]}}]}, buscar, buscarSon);
    contiene(r.errores, '"nada", que no existe');
    contiene(r.avisos, "salta en vez de transformarse");
});

test("morphing: el motor interpola los puntos entre dos formas", async () => {
    const {Claves} = await cargarMotor();
    const fa = [{tipo_figura: "RECTA", atributos: {x1: 0, y1: 0, x2: 10, y2: 0, cx: 0, cy: 0}}];
    const fb = [{tipo_figura: "RECTA", atributos: {x1: 0, y1: 10, x2: 20, y2: 0, cx: 4, cy: 0}}];
    const m = Claves.interpolarFiguras(fa, fb, 0.5)[0].atributos;
    assert.deepEqual([m.y1, m.x2, m.cx], [5, 15, 2]);
    const f = Claves.formaEn({forma: [{t: 0, v: "", interp: "lineal"}, {t: 100, v: "b", interp: "lineal"}]}, 25);
    assert.deepEqual(f, {a: "", b: "b", u: 0.25});
});

test("jerarquia: padre, en relativo al padre, ciclo y padre inexistente; estilo (ida y vuelta)", () => {
    const def = {tipo: "escena", nombre: "E", duracion: 1000, objetos: [
        {nombre: "Cabeza", en: [600, 400], partes: [], claves: {rotacion: [[0, -10], [1000, 10, "suave"]]}},
        {nombre: "Cara", padre: "Cabeza", en: [0, -100], circulo: 80, color: "#e8b48f",
            degradado: {tipo: "radial", centro: [-20, -20], radio: 120, colores: [[0, "#ffffff"], [1, "#b97c58"]]}},
        {instancia: "Casa", nombre: "Sombrero", padre: "Cabeza", en: [0, -180], escala: 0.2, mezcla: "multiplicar"},
        {nombre: "Brillo", en: [100, 100], rect: [0, 0, 50, 50], color: "#ffff00", desenfoque: 12, mezcla: "suma",
            degradado: {tipo: "lineal", de: [0, 0], a: [0, 50], colores: [[0, "#ffff00"], [1, "#ff8800"]]}},
    ]};
    const r = Compilador.compilar(def, buscar, buscarSon);
    assert.deepEqual(r.errores, []);
    assert.equal(grupo(r, "Cara").nodo_padre, "Cabeza");
    assert.deepEqual([grupo(r, "Cara").cx, grupo(r, "Cara").cy], [0, -100]);
    assert.equal(grupo(r, "Sombrero").nodo_padre, "Cabeza");
    assert.equal(grupo(r, "Brillo").desenfoque, 12);
    assert.equal(grupo(r, "Brillo").lista_pintado[0].degradado.tipo, "lineal");
    idaYVuelta(def);
    const malo = Compilador.compilar({tipo: "escena", nombre: "E", duracion: 1000, objetos: [
        {nombre: "A", padre: "B", en: [0, 0], rect: [0, 0, 1, 1]}, {nombre: "B", padre: "A", en: [0, 0], rect: [0, 0, 1, 1]},
        {nombre: "C", padre: "Z", en: [0, 0], rect: [0, 0, 1, 1]}, {nombre: "D", en: [0, 0], rect: [0, 0, 1, 1], mezcla: "rara", desenfoque: -1}]}, buscar, buscarSon);
    contiene(malo.errores, "ciclo");
    contiene(malo.errores, 'padre "Z"');
    contiene(malo.errores, 'mezcla "rara"');
    contiene(malo.errores, "desenfoque es un numero");
});

// ---------------- capacidades, fase 1: morphing de color ----------------
test("color: interpolacion de colores, degradados y pintado", async () => {
    const {Claves} = await cargarMotor();
    assert.equal(Claves.interpolarColor("#000000", "#ffffff", 0.5), "rgb(128,128,128)");
    assert.equal(Claves.interpolarColor("#f00", "rgba(0,0,255,0)", 0.5), "rgba(128,0,128,0.5)");
    assert.equal(Claves.interpolarColor("#123456", "#123456", 0.3), "#123456");
    assert.equal(Claves.interpolarColor("rojo", "#ffffff", 0.4), "rojo");          // ilegible: salta a la mitad
    assert.equal(Claves.interpolarColor("rojo", "#ffffff", 0.6), "#ffffff");
    const a = {tipo: "lineal", de: [0, 0], a: [0, 100], colores: [[0, "#000000"], [1, "#000000"]]};
    const b = {tipo: "lineal", de: [0, 0], a: [0, 200], colores: [[0, "#ffffff"], [1, "#000000"]]};
    const m = Claves.interpolarDegradado(a, b, 0.5);
    assert.deepEqual([m.a, m.colores[0][1], m.colores[1][1]], [[0, 150], "rgb(128,128,128)", "#000000"]);
    const pa = [{color: "#000000", visible: true, elementos: [[]]}];
    assert.equal(Claves.interpolarPintado(pa, [{color: "#000000"}], 0.5)[0], pa[0]);  // mismo color: el mismo objeto
});

test("color: atajo colores -> formas con la misma geometria, forma_color y ida y vuelta", () => {
    const def = {tipo: "asset", nombre: "Cielo", partes: [
        {nombre: "cielo", rect: [0, 0, 100, 50], color: "#7ec0ee",
            degradado: {tipo: "lineal", de: [0, 0], a: [0, 50], colores: [[0, "#4a90d9"], [1, "#bfe3ff"]]},
            colores: {tarde: {degradado: {tipo: "lineal", de: [0, 0], a: [0, 50], colores: [[0, "#5b3a7a"], [1, "#ff9a4a"]]}}, noche: "#0b1530"},
            claves: {forma: [[0, ""], [1000, "tarde", "lineal"], [2000, "noche", "lineal"]]}},
        {nombre: "boca", poligono: ovalo(10, 3), color: "#aa4444", formas: {a: {poligono: ovalo(9, 8)}}, claves: {forma: [[0, ""], [100, "a"]]}}]};
    const r = Compilador.compilar(def, buscar, buscarSon);
    assert.deepEqual(r.errores, []);
    assert.equal(grupo(r, "cielo").forma_color, true);
    assert.equal(grupo(r, "boca").forma_color, undefined);          // solo geometria: como antes
    const tarde = grupo(r, "cielo~tarde"), noche = grupo(r, "cielo~noche");
    assert.equal(tarde.lista_figuras.length, grupo(r, "cielo").lista_figuras.length);
    assert.equal(tarde.lista_pintado[0].degradado.colores[1][1], "#ff9a4a");
    assert.equal(noche.lista_pintado[0].color, "#0b1530");
    assert.equal(noche.lista_pintado[0].degradado.colores[0][1], "#4a90d9");   // lo que no dice, igual que la parte
    idaYVuelta(def);
    const malo = Compilador.compilar({tipo: "asset", nombre: "M", partes: [
        {nombre: "x", rect: [0, 0, 1, 1], formas: {a: {rect: [0, 0, 2, 2]}}, colores: {a: "#fff", b: 5}},
        {nombre: "y", partes: [], colores: {a: "#fff"}}]}, buscar, buscarSon);
    contiene(malo.errores, "esta en formas y en colores");
    contiene(malo.errores, "colores.b");
    contiene(malo.errores, "colores necesita que la parte tenga una forma");
});

test("color: formas y colores tambien en objetos dibujados de la escena", () => {
    const def = {tipo: "escena", nombre: "E", duracion: 1000, objetos: [
        {nombre: "cielo", en: [0, 0], rect: [0, 0, 100, 50], color: "#102040", colores: {flash: "#8090c0"}, claves: {forma: [[0, ""], [500, "flash", "salir"]]}}]};
    const r = Compilador.compilar(def, buscar, buscarSon);
    assert.deepEqual(r.errores, []);
    assert.equal(grupo(r, "cielo").forma_color, true);
    assert.deepEqual(grupo(r, "cielo").claves.forma.map((c) => c.v), ["", "cielo~flash"]);
    assert.equal(grupo(r, "cielo~flash").nodo_padre, "cielo");
    const malo = Compilador.compilar({tipo: "escena", nombre: "E", duracion: 1000, objetos: [{instancia: "Casa", colores: {a: "#fff"}}]}, buscar, buscarSon);
    contiene(malo.errores, "no de instancias");
});

test("camara: el temblor se suma a las claves x/y de la camara (no las reemplaza)", () => {
    const esc = (claves) => ({tipo: "escena", nombre: "E", duracion: 4000, camara: {centro: [100, 100], temblor: {desde: 1000, hasta: 2000, amplitud: 10}, claves}, objetos: [{nombre: "a", en: [0, 0], rect: [0, 0, 1, 1]}]});
    const cam = (r) => r.resultado.grupos_figuras.find((g) => (g.clases || []).includes("camara"));
    // sin claves propias: la receta de siempre, alrededor del centro
    const solo = cam(Compilador.compilar(esc(undefined), buscar, buscarSon));
    assert.ok(solo.claves.x.every((k) => Math.abs(k.v - 100) <= 10));
    // con claves: la camara viaja de 0 a 4000 y tiembla encima de ese viaje
    const r = Compilador.compilar(esc({x: [[0, 0], [4000, 4000]]}), buscar, buscarSon);
    assert.deepEqual(r.errores, []);
    const x = cam(r).claves.x;
    assert.equal(x[0].v, 0);
    assert.equal(x[x.length - 1].v, 4000);
    const medio = x.filter((k) => k.t > 1000 && k.t < 2000);
    assert.ok(medio.length > 5 && medio.every((k) => Math.abs(k.v - k.t) <= 10), "dentro del temblor: el viaje + la sacudida");
});
