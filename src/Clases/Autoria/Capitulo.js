// Un capitulo como una sola pelicula (documento/planeacion_zorro_cuervo.md, fase 5): sus escenas
// en orden, con el mismo motor y el mismo dibujo que el editor y "Exportar video" (Render.js),
// el sonido de cada escena mezclado sin tiempo real (Mezcla.js) y unido en una sola pista,
// y una transicion opcional (fundido a negro) entre escenas.
//
//   const motores = await Promise.all(docs.map((d) => prepararEscena(d, cargadorAssets)));
//   const plan = planCapitulo(motores);                       // duraciones e inicios
//   const pista = await mezclaCapitulo(plan, buffer);         // AudioBuffer (o null sin sonido)
//   cuadroCapitulo(plan, ctx, w, h, t_ms, {fundido})          // un cuadro de la pelicula
//   const blob = await exportarCapitulo({plan, ancho, fps, fundido, pista, progreso, cancelado});
import {GestionEvento} from "../EditorEvento/GestionEvento";
import {dibujarCuadro, tamanoSalida} from "./Render";
import {Mp4, par} from "./Mp4";
import {mezclar} from "../Sonido/Mezcla";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Motor de una escena (documento de eventos) listo para dibujar, con sus assets cargados.
export async function prepararEscena(doc, cargadorAssets) {
    const m = new GestionEvento();
    m.cargadorAssets = cargadorAssets;
    m.inicializar(doc.eventos, doc.grupos_figuras, doc._id);
    m.asegurarCamara();
    m.escena = doc.escena || {};
    m.nombre_doc = doc.nombre;
    m.configuracion_lienzo.x_delta_original = 0;
    m.configuracion_lienzo.y_delta_original = 0;
    m.procesandoEventos();
    // las instancias piden sus assets al dibujar: esperar a que lleguen (hasta ~20 s)
    for (let v = 0; v < 800 && [...m.assets.values()].some((a) => a.estado === "cargando"); v++) {
        await esperar(25);
        m.procesandoEventos();
    }
    return m;
}

// Duracion e inicio (ms) de cada escena en la pelicula.
export function planCapitulo(motores) {
    let t = 0;
    const escenas = motores.map((m) => {
        const dur = Math.max(1, m.duracionEscenaMs ? m.duracionEscenaMs() : 1000);
        const e = {m, inicio: t, dur, nombre: m.nombre_doc || ""};
        t += dur;
        return e;
    });
    return {escenas, total: t};
}

// Que escena y que instante de ella corresponde al instante t (ms) de la pelicula.
export function escenaEn(plan, t) {
    const {escenas} = plan;
    for (let i = 0; i < escenas.length; i++) {
        const e = escenas[i];
        if (t < e.inicio + e.dur || i === escenas.length - 1) return {i, e, t: Math.max(0, Math.min(e.dur - 1, t - e.inicio))};
    }
    return null;
}

// Opacidad del negro en el instante t: fundido de `fundido` ms al entrar y al salir de cada escena
// (tambien al principio y al final de la pelicula). 0 = sin transicion (corte).
export function negroEn(plan, t, fundido) {
    if (!(fundido > 0)) return 0;
    const x = escenaEn(plan, t);
    if (!x) return 0;
    const a = Math.min(1, x.t / fundido, (x.e.dur - x.t) / fundido);
    return Math.max(0, 1 - a);
}

// Dibuja el cuadro del instante t (ms) de la pelicula.
export function cuadroCapitulo(plan, ctx, w, h, t, {fundido = 0} = {}) {
    const x = escenaEn(plan, t);
    if (!x) return;
    dibujarCuadro(x.e.m, ctx, w, h, x.t);
    const negro = negroEn(plan, t, fundido);
    if (negro > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = negro;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}

// Sonido de todo el capitulo: cada escena mezclada aparte y pegada en su lugar (asi queda
// sincronizado con los cuadros aunque una escena tenga sonidos que se pasan de su final).
// buffer(id) -> Promise<AudioBuffer|null>. Devuelve null si ninguna escena suena.
export async function mezclaCapitulo(plan, buffer, {muestreo = 48000, canales = 2, alProgresar} = {}) {
    const partes = [];
    let usados = 0;
    for (const [i, e] of plan.escenas.entries()) {
        const r = await mezclar(e.m.clipsAudio(e.dur), buffer, 0, e.dur, {muestreo, canales});
        usados += r.usados;
        partes.push(r.audio);
        if (alProgresar) alProgresar((i + 1) / plan.escenas.length);
    }
    if (!usados) return null;
    const largo = Math.max(1, Math.round(plan.total / 1000 * muestreo));
    const salida = new AudioBuffer({length: largo, numberOfChannels: canales, sampleRate: muestreo});
    plan.escenas.forEach((e, i) => {
        const desde = Math.round(e.inicio / 1000 * muestreo);
        for (let c = 0; c < canales; c++) {
            const datos = partes[i].getChannelData(Math.min(c, partes[i].numberOfChannels - 1));
            salida.copyToChannel(datos.subarray(0, Math.max(0, Math.min(datos.length, largo - desde))), c, desde);
        }
    });
    return salida;
}

// Tamano del video (H.264: medidas pares), segun la camara de la primera escena.
export function tamanoCapitulo(plan, ancho) {
    const t = tamanoSalida(plan.escenas[0].m, ancho);
    return {w: par(t.w), h: par(t.h)};
}

// MP4 de todo el capitulo. progreso(0..1); cancelado() -> true para cortar (devuelve null).
export async function exportarCapitulo({plan, ancho = 720, fps = 30, fundido = 0, pista = null, progreso, cancelado}) {
    const {w, h} = tamanoCapitulo(plan, ancho);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", {willReadFrequently: true});
    const paso = 1000 / fps, total = Math.max(1, Math.round(plan.total / paso));
    const video = await Mp4.crear(w, h, fps, pista ? {audio: {canales: pista.numberOfChannels, muestreo: pista.sampleRate}} : {});
    for (let i = 0; i < total; i++) {
        if (cancelado && cancelado()) { video.cancelar(); return null; }
        cuadroCapitulo(plan, ctx, w, h, i * paso, {fundido});
        await video.cuadro(canvas);
        if (progreso) progreso((i + 1) / total, escenaEn(plan, i * paso));
        if (i % 3 === 2) await esperar(0);            // dejar respirar a la pagina
    }
    if (pista) await video.audio(pista);
    return {blob: await video.terminar(), w, h, cuadros: total};
}
