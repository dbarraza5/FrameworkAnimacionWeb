#!/usr/bin/env node
// Fase A4: reporte de una escena por codigo (para encontrar problemas sin mirar capturas).
//
//   node herramientas/reporte.mjs <escena: id o nombre> [--proyecto <id>] [--t 0,2000,4000] [--json]
//
// Por defecto revisa un instante por segundo (y el final). Informa: objetos y su
// relacion con la camara (dentro / parcial / fuera), objetos que NUNCA se ven, piezas
// de la fisica que terminan fuera de cuadro, efectos que no afectan a nada, claves
// despues del final, assets que no cargan. Cada aviso trae una sugerencia.
import {cargarMotor} from "./lib/motor.mjs";
import {cerrar} from "./lib/datos.mjs";
import {prepararEscena} from "./render.mjs";

process.stdout.on("error", (e) => { if (e.code === "EPIPE") process.exit(0); });
const salida = (s) => process.stdout.write(s + "\n");

function argumentos(argv) {
    const a = {_: []};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            const k = argv[i].slice(2);
            a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
        } else a._.push(argv[i]);
    }
    return a;
}

const relacion = (c, r) => {
    if (!c) return "sin-dibujo";
    const fuera = c.x1 < r.x0 || c.x0 > r.x0 + r.w || c.y1 < r.y0 || c.y0 > r.y0 + r.h;
    if (fuera) return "fuera";
    const dentro = c.x0 >= r.x0 && c.x1 <= r.x0 + r.w && c.y0 >= r.y0 && c.y1 <= r.y0 + r.h;
    return dentro ? "dentro" : "parcial";
};
const red = (c) => c && {x0: Math.round(c.x0), y0: Math.round(c.y0), x1: Math.round(c.x1), y1: Math.round(c.y1)};

export async function reportar(idONombre, {proyecto, tiempos} = {}) {
    const {Render, Fisica} = await cargarMotor();
    const {m, doc, errores} = await prepararEscena(idONombre, {proyecto});
    const dur = Math.round((m.duracionReproduccion ? m.duracionReproduccion() : 0) * 1000);
    const ts = tiempos || [...Array(Math.floor(dur / 1000) + 1).keys()].map((s) => s * 1000).concat(dur % 1000 ? [dur] : []);
    const orig = m.gestion_grupos_originales.grupos_figuras.filter((g) => g.nodo_padre === "root" && !g._virtual);
    const objetos = orig.filter((g) => !(g.clases || []).includes("camara") && !Fisica.grupoEsEfecto(g) && g.nombre !== "default");
    const efectos = orig.filter((g) => Fisica.grupoEsEfecto(g));
    const avisos = [];
    const aviso = (tipo, msj, sugerencia) => avisos.push({tipo, msj, sugerencia});

    for (const e of errores) aviso("asset", `no carga el asset ${e}`, "revisar que el documento exista y sea del proyecto");

    // instantes
    const instantes = [];
    const vistos = new Map(objetos.map((g) => [g.nombre, false]));
    for (const t of ts) {
        Render.dibujarCuadro(m, fakeCtx(), 1, 1, t);              // lleva el motor a t (dibujo descartado)
        const r = m.rectCamara() || {x0: 0, y0: 0, w: 1280, h: 720};
        const filas = objetos.map((g) => {
            const c = Render.cajaMundo(m, g.nombre);
            const rel = relacion(c, r);
            if (rel === "dentro" || rel === "parcial") vistos.set(g.nombre, true);
            return {nombre: g.nombre, relacion: rel, caja: red(c), plano: g.plano || 0, visible: g.visible !== false};
        });
        let fisica = null;
        const est = m.fisica.estadosEn ? m.fisica.estadosEn(t) : null;
        if (est && m.fisica.cuerpos && m.fisica.cuerpos.length) {
            const sueltas = m.fisica.cuerpos.filter((b) => est[b.i]);
            const fuera = sueltas.filter((b) => { const s = est[b.i]; return s.x < r.x0 || s.x > r.x0 + r.w || s.y < r.y0 || s.y > r.y0 + r.h; });
            fisica = {piezas: m.fisica.cuerpos.length, sueltas: sueltas.length, fuera_de_cuadro: fuera.length,
                fuera: fuera.map((b) => `${b.objeto}/${b.nombre.split("::").pop()}`)};
        }
        instantes.push({t, camara: {x0: Math.round(r.x0), y0: Math.round(r.y0), w: Math.round(r.w), h: Math.round(r.h)}, objetos: filas, fisica});
    }

    // avisos generales
    for (const [n, visto] of vistos) {
        if (!visto) aviso("camara", `"${n}" nunca entra en cuadro en los instantes revisados`, "moverlo, o ajustar las claves/zoom de la Cámara");
    }
    const final = instantes[instantes.length - 1];
    if (final && final.fisica && final.fisica.fuera_de_cuadro) {
        const por = {};
        for (const f of final.fisica.fuera) { const o = f.split("/")[0]; por[o] = (por[o] || 0) + 1; }
        aviso("fisica", `${final.fisica.fuera_de_cuadro} piezas terminan fuera de cuadro (${Object.entries(por).map(([o, k]) => `${o}: ${k}`).join(", ")})`,
            "bajar la fuerza del efecto, alejar la Cámara (zoom < 1) o subir la masa de esos objetos");
    }
    const conFisica = objetos.filter((g) => g.fisica && g.fisica.modo && g.fisica.modo !== "fijo");
    for (const ef of efectos) {
        const tipo = ef.efecto.tipo;
        if (tipo !== "particulas" && !conFisica.length) aviso("efecto", `el efecto "${ef.nombre}" (${tipo}) no afecta a nada: ningún objeto tiene física`, 'poner Física "rigido" o "desarmar" a los objetos que deban reaccionar');
        for (const k of ["t", "inicio"]) if (ef.efecto[k] > dur) aviso("efecto", `"${ef.nombre}": ${k} = ${ef.efecto[k]} ms es despues del final (${dur} ms)`, "acortar el tiempo o alargar la escena");
    }
    if (final && final.fisica && final.fisica.sueltas === 0 && efectos.some((e) => e.efecto.tipo !== "particulas")) {
        aviso("fisica", "ninguna pieza se suelta en toda la escena", "subir la fuerza o el radio del efecto, o bajar su umbral");
    }
    for (const g of orig) {
        for (const prop in g.claves || {}) {
            const tarde = (g.claves[prop] || []).filter((c) => c.t > dur);
            if (tarde.length) aviso("claves", `"${g.nombre}": ${tarde.length} clave(s) de ${prop} despues del final (${dur} ms)`, "acortarlas o alargar la escena");
        }
        if (g.opacidad === 0 || g.visible === false) aviso("visibilidad", `"${g.nombre}" está oculto (visible=false u opacidad 0)`, "es intencional?");
    }
    return {escena: doc.nombre, id: String(doc._id), duracion_ms: dur, avisos, instantes};
}

// contexto 2D vacio (para mover el motor sin dibujar de verdad)
function fakeCtx() {
    const nada = () => {};
    return new Proxy({}, {get: (o, k) => (k in o ? o[k] : nada), set: (o, k, v) => { o[k] = v; return true; }});
}

async function principal() {
    const a = argumentos(process.argv.slice(2));
    if (!a._[0]) { salida("uso: reporte.mjs <escena> [--proyecto <id>] [--t 0,2000] [--json]"); process.exitCode = 2; return; }
    const tiempos = a.t ? String(a.t).split(",").map((x) => parseInt(x, 10)) : null;
    const r = await reportar(a._[0], {proyecto: a.proyecto, tiempos});
    if (a.json) { salida(JSON.stringify(r, null, 1)); return; }
    salida(`Escena "${r.escena}" (${r.id}), ${r.duracion_ms} ms, ${r.instantes.length} instantes revisados`);
    salida(r.avisos.length ? `\nAVISOS (${r.avisos.length}):` : "\nSin avisos.");
    for (const v of r.avisos) salida(`  [${v.tipo}] ${v.msj}\n      → ${v.sugerencia}`);
    salida("\nPor instante (dentro / parcial / fuera de la cámara):");
    for (const i of r.instantes) {
        const cuenta = (rel) => i.objetos.filter((o) => o.relacion === rel).length;
        const fis = i.fisica ? ` · física: ${i.fisica.sueltas}/${i.fisica.piezas} sueltas, ${i.fisica.fuera_de_cuadro} fuera` : "";
        salida(`  t=${String(i.t).padStart(5)} ms  ${cuenta("dentro")} / ${cuenta("parcial")} / ${cuenta("fuera")}${fis}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    principal().catch((e) => { process.stderr.write(`ERROR: ${e.stack || e}\n`); process.exitCode = 1; }).finally(cerrar);
}
