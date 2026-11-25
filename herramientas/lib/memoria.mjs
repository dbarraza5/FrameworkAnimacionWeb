// Escenas de una carpeta de ejemplo (asset_NN.json + escenas .json) SIN guardarlas: compila los
// assets en memoria y prepara el motor. Lo usan pruebas/render_memoria.mjs y reporte.mjs --carpeta.
import fs from "fs";
import path from "path";
import {cargarMotor} from "./motor.mjs";

export async function cargarCarpeta(dir, {avisar = (...x) => console.error(...x)} = {}) {
    const {Compilador, GestionEvento} = await cargarMotor();
    const docs = new Map(), porNombre = new Map();
    let n = 0;
    for (const f of fs.readdirSync(dir).filter((f) => /^asset_\d+\.json$/.test(f)).sort()) {
        const def = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        const r = Compilador.compilar(def, null, () => ({id: "s"}));
        if (!r.ok) throw new Error(`${f}: ${JSON.stringify(r.errores)}`);
        if (r.avisos.length) avisar(f, "avisos:", r.avisos);
        const id = (++n).toString(16).padStart(24, "0");
        docs.set(id, {...r.resultado, _id: id});
        porNombre.set(def.nombre, {id, eventos: r.resultado.eventos.map((e) => e.nombre),
            enganches: (r.resultado.escena && r.resultado.escena.enganches) || null, caja: (r.resultado.escena && r.resultado.escena.caja) || null, partes: r.resultado.grupos_figuras.map((g) => g.nombre).filter((n) => n !== "default")});
    }
    // motor listo para una escena de la carpeta (con sus assets cargados): {m, doc, esc, errores}
    async function preparar(archivo, {formato} = {}) {
        const esc = JSON.parse(fs.readFileSync(path.join(dir, archivo), "utf8"));
        // (los sonidos quedan con su nombre como id: el validador los reconoce por nombre)
        const r = Compilador.compilar(esc, (nombre) => porNombre.get(nombre) || null, (nombre) => ({id: nombre}), {formato});
        if (!r.ok) throw new Error(`${archivo}: ${JSON.stringify(r.errores)}`);
        if (r.avisos.length) avisar(archivo, "avisos:", r.avisos);
        const m = new GestionEvento();
        m.cargadorAssets = async (id) => docs.get(id);
        m.inicializar(r.resultado.eventos, r.resultado.grupos_figuras, "escena");
        m.asegurarCamara();
        m.escena = r.resultado.escena || {};
        m.configuracion_lienzo.x_delta_original = 0;
        m.configuracion_lienzo.y_delta_original = 0;
        m.procesandoEventos();
        for (let v = 0; v < 100 && [...m.assets.values()].some((a) => a.estado === "cargando"); v++) { await new Promise((q) => setTimeout(q, 10)); m.procesandoEventos(); }
        m._duracion = esc.duracion || 3000;
        const errores = [...m.assets.values()].filter((a) => a.estado === "error").map((a) => `${a.id}: ${a.error}`);
        const doc = {...r.resultado, nombre: r.resultado.nombre || archivo, _id: archivo};
        return {m, doc, esc, errores};
    }
    return {docs, porNombre, preparar};
}
