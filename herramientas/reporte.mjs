#!/usr/bin/env node
// Fase A4: reporte de una escena por codigo (para encontrar problemas sin mirar capturas).
//
//   node herramientas/reporte.mjs <escena: id o nombre> [--proyecto <id>] [--t 0,2000,4000] [--json]
//   node herramientas/reporte.mjs --carpeta <dir> --escena historia_1.json [--formato vertical]   (archivos de un generador, SIN guardar)
//
// Fase IA-2 (planeacion_autoria_ia.md): ademas, lib/revisiones.mjs (textos y globos, voces que se pisan,
// partes que se ocultan, claves de partes y acciones despues del final). Cada aviso tiene nivel:
// error / aviso / revisar. Sale con codigo 1 si hay algun error (para usarlo antes de crear).
//
// Por defecto revisa un instante por segundo (y el final). Informa: objetos y su
// relacion con la camara (dentro / parcial / fuera), objetos que NUNCA se ven, piezas
// de la fisica que terminan fuera de cuadro, efectos que no afectan a nada, claves
// despues del final, assets que no cargan. Cada aviso trae una sugerencia.
import {createCanvas} from "canvas";
import {cargarMotor} from "./lib/motor.mjs";
import {cerrar, db, pedirApi, usaApi} from "./lib/datos.mjs";

// sonidos del proyecto (por la API con llave, o de la base en desarrollo)
async function sonidosDelProyecto(id_proyecto) {
    try {
        if (usaApi()) return await pedirApi("/sonidos");
        return (await (await db()).collection("sonidos").find({id_proyecto}).toArray()).map((x) => ({...x, _id: String(x._id)}));
    } catch (e) { return []; }
}
import {prepararEscena} from "./render.mjs";
import {cargarCarpeta} from "./lib/memoria.mjs";
import {revisar} from "./lib/revisiones.mjs";

// voces de cualquier proyecto por nombre (para la duracion de los clips "voz ..." de una escena en memoria)
async function sonidosPorNombre() {
    try { return await (await db()).collection("sonidos").find({nombre: /^voz /}, {projection: {nombre: 1, duracion_ms: 1}}).toArray(); } catch (e) { return []; }
}

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

// preparado (opcional): {m, doc, errores} ya listos (p. ej. de lib/memoria.mjs); entonces no se mira el sonido del proyecto
export async function reportar(idONombre, {proyecto, tiempos, preparado} = {}) {
    const motor = await cargarMotor();
    const {Render, Fisica, Seguimiento} = motor;
    const {m, doc, errores} = preparado || await prepararEscena(idONombre, {proyecto});
    const dur = Math.round((m.duracionReproduccion ? m.duracionReproduccion() : 0) * 1000);
    const ts = tiempos || [...Array(Math.floor(dur / 1000) + 1).keys()].map((s) => s * 1000).concat(dur % 1000 ? [dur] : []);
    const orig = m.gestion_grupos_originales.grupos_figuras.filter((g) => g.nodo_padre === "root" && !g._virtual);
    const objetos = orig.filter((g) => !(g.clases || []).includes("camara") && !Fisica.grupoEsEfecto(g) && g.nombre !== "default");
    const efectos = orig.filter((g) => Fisica.grupoEsEfecto(g));
    const avisos = [];
    const aviso = (tipo, msj, sugerencia, nivel = tipo === "visibilidad" ? "revisar" : tipo === "asset" ? "error" : "aviso") => avisos.push({nivel, tipo, msj, sugerencia});

    for (const e of errores) aviso("asset", `no carga el asset ${e}`, "revisar que el documento exista y sea del proyecto");

    // instantes
    const instantes = [];
    const vistos = new Map(objetos.map((g) => [g.nombre, false]));
    // lienzo real chico (uno falso se rompe con escena.estilo, que lee los pixeles)
    const lienzo = createCanvas(16, 16).getContext("2d");
    for (const t of ts) {
        Render.dibujarCuadro(m, lienzo, 16, 16, t);               // lleva el motor a t (dibujo descartado)
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
    // sonido (planeacion_sonido.md): que suena y que falta (en memoria no hay proyecto: solo las voces por nombre)
    const sonidos = preparado ? await sonidosPorNombre() : await sonidosDelProyecto(doc.id_proyecto);
    // IA-2: revisiones nuevas
    for (const v of revisar(m, doc, motor, {dur, sonidos})) avisos.push(v);
    const ORDEN = {error: 0, aviso: 1, revisar: 2};
    avisos.sort((a, b) => ORDEN[a.nivel] - ORDEN[b.nivel] || (a.t ?? 0) - (b.t ?? 0));
    const nombre = new Map(sonidos.map((x) => [String(x._id), x.nombre]));
    const clips = m.clipsAudio(m.duracionEscenaMs());
    const segui = preparado ? {avisos: [], resumen: {falta_subir: 0, sonido_borrado: 0, falta_sonido: 0, sin_decidir: 0}} : Seguimiento.seguimiento({escena: doc.escena || {}, eventos: doc.eventos || [], grupos: doc.grupos_figuras || []}, sonidos);
    for (const v of segui.avisos.filter((x) => x.nivel !== "sin_decidir")) {
        aviso("sonido", v.mensaje, v.nivel === "falta_subir" ? "subir el archivo en Proyecto → Sonido (o en el editor, pestaña Sonido)"
            : v.nivel === "sonido_borrado" ? "elegir otro sonido o quitar el clip" : 'ponerle un sonido o marcarlo "no lleva"');
    }
    const sonido = {clips: clips.map((c) => ({t: Math.round(c.t), sonido: nombre.get(c.sonido) || c.sonido,
        origen: [c.origen.tipo, c.origen.nombre, c.origen.detalle].filter(Boolean).join(" · ")})), resumen: segui.resumen};
    return {escena: doc.nombre, id: String(doc._id), duracion_ms: dur, avisos, instantes, sonido};
}


async function principal() {
    const a = argumentos(process.argv.slice(2));
    if (!a._[0] && !a.carpeta) { salida("uso: reporte.mjs <escena> [--proyecto <id>] [--t 0,2000] [--json]  |  reporte.mjs --carpeta <dir> --escena x.json"); process.exitCode = 2; return; }
    const tiempos = a.t ? String(a.t).split(",").map((x) => parseInt(x, 10)) : null;
    let preparado = null;
    if (a.carpeta) {
        const c = await cargarCarpeta(a.carpeta, {avisar: () => {}});
        preparado = await c.preparar(typeof a.escena === "string" ? a.escena : "escena.json", {formato: typeof a.formato === "string" ? a.formato : undefined});
    }
    const r = await reportar(a._[0], {proyecto: a.proyecto, tiempos, preparado});
    if (r.avisos.some((v) => v.nivel === "error")) process.exitCode = 1;
    if (a.json) { salida(JSON.stringify(r, null, 1)); return; }
    salida(`Escena "${r.escena}" (${r.id}), ${r.duracion_ms} ms, ${r.instantes.length} instantes revisados`);
    const cuenta = (n) => r.avisos.filter((v) => v.nivel === n).length;
    salida(r.avisos.length ? `\nAVISOS: ${cuenta("error")} error(es) · ${cuenta("aviso")} aviso(s) · ${cuenta("revisar")} a revisar` : "\nSin avisos.");
    for (const v of r.avisos) salida(`  ${v.nivel.toUpperCase().padEnd(7)} [${v.tipo}] ${v.msj}\n      → ${v.sugerencia}`);
    const rs = r.sonido.resumen;
    salida(`\nSonido: ${r.sonido.clips.length} clip(s) · falta subir ${rs.falta_subir} · borrados ${rs.sonido_borrado} · falta sonido ${rs.falta_sonido} · sin decidir ${rs.sin_decidir}`);
    for (const c of r.sonido.clips.slice(0, 30)) salida(`  ${String(c.t).padStart(6)} ms  ${c.sonido}  (${c.origen})`);
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
