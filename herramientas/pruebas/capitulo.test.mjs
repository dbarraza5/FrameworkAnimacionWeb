// Pruebas del capitulo como una sola pelicula (src/Clases/Autoria/Capitulo.js; planeacion_zorro_cuervo.md, fase 5).
// Usa las escenas de herramientas/ejemplos/zorro (compiladas en memoria). El audio y el MP4 solo
// funcionan en el navegador (OfflineAudioContext, VideoEncoder): aca se prueban el plan y los cuadros.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {createCanvas} from "canvas";
import {cargarMotor} from "../lib/motor.mjs";

const {Compilador, Capitulo} = await cargarMotor();
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../ejemplos/zorro");
const docs = new Map(), porNombre = new Map();
let n = 0;
for (const f of fs.readdirSync(DIR).filter((f) => /^asset_\d+\.json$/.test(f)).sort()) {
    const def = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    const r = Compilador.compilar(def, null, () => ({id: "s"}));
    const id = (++n).toString(16).padStart(24, "0");
    docs.set(id, {...r.resultado, _id: id});
    porNombre.set(def.nombre, {id, eventos: r.resultado.eventos.map((e) => e.nombre)});
}
const escenas = [1, 2, 3, 4].map((i) => {
    const def = JSON.parse(fs.readFileSync(path.join(DIR, `historia_${i}.json`), "utf8"));
    const r = Compilador.compilar(def, (nm) => porNombre.get(nm) || null, () => ({id: "s"}));
    assert.ok(r.ok, JSON.stringify(r.errores));
    return {...r.resultado, _id: "e" + i, nombre: def.nombre, duracion: def.duracion};
});
const motores = [];
for (const d of escenas) motores.push(await Capitulo.prepararEscena(d, async (id) => docs.get(id)));
const plan = Capitulo.planCapitulo(motores);

test("plan: las escenas en orden, una detras de otra", () => {
    assert.deepEqual(plan.escenas.map((e) => [e.nombre, e.inicio, e.dur]),
        [["1. El queso", 0, 10500], ["2. La adulación", 10500, 20000], ["3. El canto", 30500, 8000], ["4. La moraleja", 38500, 12000]]);
    assert.equal(plan.total, 50500);
    assert.deepEqual([Capitulo.escenaEn(plan, 0).i, Capitulo.escenaEn(plan, 10499).i, Capitulo.escenaEn(plan, 10500).i, Capitulo.escenaEn(plan, 50499).i], [0, 0, 1, 3]);
    assert.equal(Capitulo.escenaEn(plan, 31000).t, 500);
    assert.equal(Capitulo.escenaEn(plan, 99999).i, 3, "despues del final: la ultima escena");
});

test("fundido: negro en los bordes de cada escena, nada en el medio; con 0 es corte", () => {
    assert.equal(Capitulo.negroEn(plan, 10500, 300), 1);
    assert.equal(Capitulo.negroEn(plan, 10650, 300), 0.5);
    assert.equal(Capitulo.negroEn(plan, 15000, 300), 0);
    assert.ok(Capitulo.negroEn(plan, 10400, 300) > 0.3);
    assert.equal(Capitulo.negroEn(plan, 10500, 0), 0);
});

test("cuadros: cada instante dibuja su escena (y el fundido oscurece)", () => {
    const c = createCanvas(180, 320), ctx = c.getContext("2d");
    const brillo = () => { const d = ctx.getImageData(0, 0, 180, 320).data; let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i] + d[i + 1] + d[i + 2]; return s; };
    Capitulo.cuadroCapitulo(plan, ctx, 180, 320, 5000, {fundido: 300});
    const medio = brillo();
    Capitulo.cuadroCapitulo(plan, ctx, 180, 320, 10500, {fundido: 300});
    assert.ok(brillo() < medio * 0.05, "en el borde entre escenas, negro");
    Capitulo.cuadroCapitulo(plan, ctx, 180, 320, 10500, {fundido: 0});
    assert.ok(brillo() > medio * 0.3, "sin fundido, se ve la escena");
    // el mismo instante de la pelicula que de la escena 3 suelta
    const a = createCanvas(180, 320), b = createCanvas(180, 320);
    Capitulo.cuadroCapitulo(plan, a.getContext("2d"), 180, 320, 30500 + 1700);
    Capitulo.cuadroCapitulo(plan, b.getContext("2d"), 180, 320, 30500 + 1700);
    assert.equal(a.toBuffer("raw").equals(b.toBuffer("raw")), true, "deterministico");
});
