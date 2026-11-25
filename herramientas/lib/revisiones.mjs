// Validador (planeacion_autoria_ia.md, fase IA-2): revisiones que se suman a las de reporte.mjs.
// Cada aviso: {nivel: "error" | "aviso" | "revisar", tipo, msj, sugerencia, t?}
//   error   = casi seguro un problema (texto fuera de cuadro, globo de alguien que no se ve)
//   aviso   = probable problema (voces que se pisan, globos encimados, claves despues del final)
//   revisar = puede ser a proposito; confirmar contra el guion (una parte que se oculta y no vuelve)
import {createCanvas} from "canvas";

const SEP = "::";
const seg = (t) => `${(t / 1000).toFixed(1)} s`;
const dentroDe = (c, r, tol = 1) => c.x0 >= r.x0 - tol && c.y0 >= r.y0 - tol && c.x1 <= r.x0 + r.w + tol && c.y1 <= r.y0 + r.h + tol;
const toca = (c, r) => c && !(c.x1 < r.x0 || c.x0 > r.x0 + r.w || c.y1 < r.y0 || c.y0 > r.y0 + r.h);
const solapan = (a, b, tol = 2) => a.x0 < b.x1 - tol && b.x0 < a.x1 - tol && a.y0 < b.y1 - tol && b.y0 < a.y1 - tol;

// Tramos que se pisan en una lista [{nombre, t, fin}] (ordenada por t): [{a, b, desde, hasta}]
export function tramosQueSePisan(lista, tol = 50) {
    const orden = [...lista].sort((a, b) => a.t - b.t), r = [];
    for (let i = 0; i < orden.length; i++)
        for (let j = i + 1; j < orden.length && orden[j].t < orden[i].fin - tol; j++)
            r.push({a: orden[i], b: orden[j], desde: orden[j].t, hasta: Math.min(orden[i].fin, orden[j].fin)});
    return r;
}

// Partes de instancias que se ocultan (claves_partes.opacidad) mientras su objeto sigue en cuadro y
// no vuelven a verse. muestras: [{t, partes: Map("obj::parte" -> opacidad), duenos: Map(obj -> {op, enCuadro})}]
export function partesQueSeOcultan(muestras, umbral = 0.05) {
    const r = [], estado = new Map();     // "obj::parte" -> {visto, oculta_en, dueno_visible_despues_hasta}
    for (const mu of muestras) {
        for (const [k, op] of mu.partes) {
            const obj = k.split(SEP)[0], d = mu.duenos.get(obj);
            const duenoVisible = d && d.op > umbral && d.enCuadro;
            const e = estado.get(k) || {visto: false, oculta_en: null, hasta: null};
            if (op > umbral) { e.visto = true; e.oculta_en = null; e.hasta = null; }
            else if (e.visto && e.oculta_en === null && duenoVisible) e.oculta_en = mu.t;
            if (e.oculta_en !== null && duenoVisible) e.hasta = mu.t;
            estado.set(k, e);
        }
    }
    for (const [k, e] of estado) if (e.oculta_en !== null && e.hasta > e.oculta_en) r.push({objeto: k.split(SEP)[0], parte: k.split(SEP).slice(1).join(SEP), t: e.oculta_en, hasta: e.hasta});
    return r;
}

// Revisiones con el motor (m ya preparado). sonidos: [{_id, nombre, duracion_ms}] (para las voces).
export function revisar(m, doc, motor, {dur, sonidos = [], paso = 200} = {}) {
    const {Render, Fisica} = motor;
    const avisos = [];
    const aviso = (nivel, tipo, msj, sugerencia, t) => avisos.push({nivel, tipo, msj, sugerencia, ...(t !== undefined ? {t} : {})});
    const orig = m.gestion_grupos_originales.grupos_figuras.filter((g) => !g._virtual);
    const instancias = orig.filter((g) => g.instancia && g.instancia.id_eventos);
    const lienzo = createCanvas(320, 320), ctx = lienzo.getContext("2d");
    const dialogos = (m.escena && m.escena.dialogos) || [];

    // 1) claves despues del final (lo que reporte.mjs no miraba)
    for (const g of instancias) {
        const inst = g.instancia;
        for (const [parte, pistas] of Object.entries(inst.claves_partes || {}))
            for (const [prop, cl] of Object.entries(pistas || {})) {
                const tarde = (cl || []).filter((c) => (c.t ?? c[0]) > dur);
                if (tarde.length) aviso("aviso", "claves", `"${g.nombre}" › parte "${parte}": ${tarde.length} clave(s) de ${prop} después del final (${dur} ms)`, "acortarlas o alargar la escena");
            }
        for (const a of inst.acciones || []) if (a.t > dur) aviso("aviso", "claves", `"${g.nombre}": la acción "${a.evento}" empieza en ${a.t} ms, después del final`, "quitarla o alargar la escena");
    }
    dialogos.forEach((d, i) => {
        if (d.hasta > dur + 1) aviso("aviso", "dialogo", `dialogos[${i}] ("${String(d.texto).slice(0, 30)}…") termina en ${d.hasta} ms, después del final (${dur} ms)`, "acortarlo o alargar la escena");
        if (d.quien && !orig.some((g) => g.nombre === d.quien)) aviso("error", "dialogo", `dialogos[${i}]: quien "${d.quien}" no es un objeto de la escena`, "corregir el nombre");
    });

    // 2) recorrido fino: partes que se ocultan con su dueño en cuadro
    const conPartes = instancias.filter((g) => Object.values(g.instancia.claves_partes || {}).some((p) => p.opacidad));
    if (conPartes.length) {
        const muestras = [];
        for (let t = 0; t <= dur; t += paso) {
            Render.dibujarCuadro(m, ctx, 32, 32, t, {});
            const r = m.rectCamara() || {x0: 0, y0: 0, w: 1280, h: 720};
            const partes = new Map(), duenos = new Map();
            for (const g of conPartes) {
                const d = m.gestion_grupos.getGrupo(g.nombre) || g;
                duenos.set(g.nombre, {op: d.visible === false ? 0 : (d.opacidad ?? 1), enCuadro: toca(Render.cajaMundo(m, g.nombre), r)});
                for (const [parte, p] of Object.entries(g.instancia.claves_partes)) {
                    if (!p.opacidad) continue;
                    const dp = m.gestion_grupos.getGrupo(`${g.nombre}${SEP}${parte}`);
                    if (dp) partes.set(`${g.nombre}${SEP}${parte}`, dp.visible === false ? 0 : (dp.opacidad ?? 1));
                }
            }
            muestras.push({t, partes, duenos});
        }
        for (const x of partesQueSeOcultan(muestras))
            aviso("revisar", "visibilidad", `la parte "${x.parte}" de "${x.objeto}" se oculta en ${seg(x.t)} y no vuelve, aunque "${x.objeto}" sigue en cuadro hasta ${seg(x.hasta)}`,
                "¿es a propósito (la deja en otro lado)? Si no, revisar sus claves_partes.opacidad (¿se corrieron al insertar tiempo?)", x.t);
    }

    // 3) globos y textos: al empezar cada dialogo (cuando aparece al lado de los que ya estan) y con el
    //    texto casi completo (el globo ya tiene su tamano final desde que aparece)
    const vistos = new Set(), pares = new Set();
    const instantes = [...new Set(dialogos.filter((d) => d.hasta > d.desde).flatMap((d) =>
        [Math.min(d.desde + 250, d.hasta), Math.max(d.desde, Math.min(d.hasta - 250, d.desde + (d.hasta - d.desde) * 0.6))].map(Math.round)))].sort((x, y) => x - y);
    for (const t of instantes) {
        const reg = [];
        m._registro_dialogos = reg;
        try { Render.dibujarCuadro(m, ctx, 320, 320, t, {}); } finally { delete m._registro_dialogos; }
        const r = m.rectCamara() || {x0: 0, y0: 0, w: 1280, h: 720};
        for (const x of reg) {
            const dd = dialogos[x.i], clave = `${x.i}`;
            if (vistos.has(clave)) continue;
            vistos.add(clave);
            const cita = `dialogos[${x.i}] ("${String(dd.texto).slice(0, 30)}…")`;
            if (x.tipo === "sin_hablante") { aviso("error", "dialogo", `${cita}: "${dd.quien}" no se dibuja en ${seg(t)}, el globo no aparece`, "revisar quien, su opacidad o su visibilidad", t); continue; }
            if (x.tipo === "texto" && !dentroDe(x.caja, r)) {
                const lados = [x.caja.x0 < r.x0 && "izquierda", x.caja.x1 > r.x0 + r.w && "derecha", x.caja.y0 < r.y0 && "arriba", x.caja.y1 > r.y0 + r.h && "abajo"].filter(Boolean);
                aviso("error", "dialogo", `${cita}: el texto se sale del cuadro por ${lados.join(" y ")} en ${seg(t)}`, "bajar tamano, poner ancho (corta en líneas) o mover en", t);
            }
            if (x.tipo === "globo" && dd.quien && dd.estilo !== "narrador") {
                const g = m.gestion_grupos.getGrupo(dd.quien);
                const op = g ? (g.visible === false ? 0 : (g.opacidad ?? 1)) : 0;
                if (op < 0.05) aviso("error", "dialogo", `${cita}: habla "${dd.quien}", que está invisible en ${seg(t)}`, "revisar su opacidad o quitar quien", t);
                else if (!toca(Render.cajaMundo(m, dd.quien), r)) aviso("aviso", "dialogo", `${cita}: habla "${dd.quien}", que está fuera de cuadro en ${seg(t)}`, "¿es a propósito (voz en off)? Si no, mover la cámara", t);
            }
        }
        const globos = reg.filter((x) => x.caja && x.tipo !== "sin_hablante");
        for (let a = 0; a < globos.length; a++) for (let b = a + 1; b < globos.length; b++) {
            const k = `${Math.min(globos[a].i, globos[b].i)}-${Math.max(globos[a].i, globos[b].i)}`;
            if (pares.has(k) || !solapan(globos[a].caja, globos[b].caja)) continue;
            pares.add(k);
            aviso("aviso", "dialogo", `dialogos[${globos[a].i}] y dialogos[${globos[b].i}] se tapan en ${seg(t)}`, "separarlos en el tiempo, usar lado/desplazar o mover el texto", t);
        }
    }

    // 4) voces que se pisan (clips cuyo sonido se llama "voz ...", con la duracion del sonido)
    const porId = new Map(sonidos.map((s) => [String(s._id), s])), porNombre = new Map(sonidos.map((s) => [s.nombre, s]));
    const voces = [];
    for (const c of m.clipsAudio ? m.clipsAudio(dur) : []) {
        const s = porId.get(String(c.sonido)) || porNombre.get(String(c.sonido));
        const nombre = s ? s.nombre : String(c.sonido);
        if (!/^voz /i.test(nombre)) continue;
        if (!s || !(s.duracion_ms > 0)) continue;
        voces.push({nombre, t: c.t, fin: c.t + s.duracion_ms});
    }
    for (const x of tramosQueSePisan(voces))
        aviso("aviso", "voces", `"${x.a.nombre}" y "${x.b.nombre}" se pisan entre ${seg(x.desde)} y ${seg(x.hasta)}`, "correr una (o usar voces.mjs --reubicar)", x.desde);

    return avisos;
}
