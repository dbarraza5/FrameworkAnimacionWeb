// Ver lo que hizo (planeacion_autoria_ia.md, fase IA-1): lo comun a render.mjs y
// pruebas/render_memoria.mjs para revisar una escena sin adivinar.
//   --zona x,y,w,h            dibuja esa zona DEL MUNDO a la resolucion de salida (no es un recorte)
//   --zona objeto:<n>[,m]     la zona es la caja del objeto en cada instante, con m de margen (por defecto 30)
//   --cajas [a,b]             caja y nombre de cada objeto (o solo de esos)
//   --rejilla 100             lineas cada 100 unidades del mundo, con su coordenada
//   --lista                   por instante: la camara y los objetos que se ven (caja, plano, accion)
import {cargarMotor} from "./motor.mjs";

const COLORES = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#9a6324", "#000075", "#808000"];

// Objetos de la escena (sin camara, efectos ni "default"): los de primer nivel, las instancias y los objetos con padre.
export function objetosEscena(m, Fisica) {
    return m.gestion_grupos_originales.grupos_figuras.filter((g) => !g._virtual && g.nombre !== "default"
        && (g.nodo_padre === "root" || g.instancia || (g.clases || []).includes("objeto_hijo")) && !(g.clases || []).includes("camara") && !Fisica.grupoEsEfecto(g));
}

// Valor de --zona -> opcion `zona` de Render.dibujarCuadro (null si no hay)
export function leerZona(valor, Render) {
    if (!valor || valor === true) return null;
    const s = String(valor);
    if (s.startsWith("objeto:")) {
        const [nombre, margen] = s.slice(7).split(",");
        const mg = margen !== undefined ? parseFloat(margen) : 30;
        return (m) => {
            const c = Render.cajaMundo(m, nombre);
            if (!c) throw new Error(`--zona: el objeto "${nombre}" no existe o no tiene dibujo en este instante`);
            return {x0: c.x0 - mg, y0: c.y0 - mg, w: c.x1 - c.x0 + 2 * mg, h: c.y1 - c.y0 + 2 * mg};
        };
    }
    const n = s.split(",").map(Number);
    if (n.length !== 4 || n.some((x) => !Number.isFinite(x)) || n[2] <= 0 || n[3] <= 0) throw new Error(`--zona: se espera x,y,w,h u objeto:<nombre>, no "${s}"`);
    return {x0: n[0], y0: n[1], w: n[2], h: n[3]};
}

// Proporcion de la salida: la de la zona fija, o la de la camara
export function proporcion(m, zona) {
    if (zona && typeof zona === "object") return zona.h / zona.w;
    const r = m.rectCamara() || {w: 1280, h: 720};
    return r.h / r.w;
}

// Lo que se ve en el instante actual del motor (llamar despues de dibujar el cuadro)
export function listar(m, {Render, Fisica, GestionEvento}, t, vista) {
    const cam = m.rectCamara();
    const r = vista.r;
    const filas = [];
    for (const g of objetosEscena(m, Fisica)) {
        const c = Render.cajaMundo(m, g.nombre);
        if (!c || c.x1 < r.x0 || c.x0 > r.x0 + r.w || c.y1 < r.y0 || c.y0 > r.y0 + r.h) continue;
        const d = m.gestion_grupos.getGrupo(g.nombre) || g;
        const op = d.opacidad ?? 1;
        const fila = {nombre: g.nombre, caja: [c.x0, c.y0, c.x1, c.y1].map(Math.round), plano: g.plano || 0};
        if (op < 1) fila.opacidad = Math.round(op * 100) / 100;
        if (d.visible === false) fila.oculto = true;
        if (g.instancia) { const a = GestionEvento.accionEn(g.instancia, t / 1000); if (a.evento) fila.accion = a.evento; }
        filas.push(fila);
    }
    filas.sort((a, b) => a.plano - b.plano || a.caja[1] - b.caja[1]);
    return {t, camara: cam && {x0: Math.round(cam.x0), y0: Math.round(cam.y0), w: Math.round(cam.w), h: Math.round(cam.h), zoom: cam.zoom},
        vista: [r.x0, r.y0, r.w, r.h].map(Math.round), objetos: filas};
}

export function textoLista(l) {
    const c = l.camara ? `cámara [${l.camara.x0}, ${l.camara.y0}, ${l.camara.w}×${l.camara.h}] zoom ${l.camara.zoom}` : "sin cámara";
    const lineas = [`t=${l.t} ms · ${c} · vista [${l.vista.join(", ")}]`];
    for (const o of l.objetos) {
        const extra = [o.accion && `acción ${o.accion}`, o.opacidad !== undefined && `opacidad ${o.opacidad}`, o.oculto && "OCULTO"].filter(Boolean).join(" · ");
        lineas.push(`   ${o.nombre.padEnd(24)} caja [${o.caja.join(", ")}] plano ${o.plano}${extra ? " · " + extra : ""}`);
    }
    return lineas.join("\n");
}

// Encima del cuadro: rejilla del mundo y cajas con nombre (en pixeles del cuadro)
export function dibujarAyudas(ctx, m, {Render, Fisica}, vista, {cajas, rejilla}) {
    const {r, esc, ox, oy} = vista;
    const px = (x) => x * esc + ox, py = (y) => y * esc + oy;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.font = "11px sans-serif";
    const paso = parseFloat(rejilla);
    if (paso > 0) {
        ctx.strokeStyle = "rgba(255,0,255,0.35)"; ctx.fillStyle = "rgba(255,0,255,0.9)"; ctx.lineWidth = 1;
        for (let x = Math.ceil(r.x0 / paso) * paso; x <= r.x0 + r.w; x += paso) {
            ctx.beginPath(); ctx.moveTo(px(x), py(r.y0)); ctx.lineTo(px(x), py(r.y0 + r.h)); ctx.stroke();
            ctx.fillText(String(x), px(x) + 2, py(r.y0) + 11);
        }
        for (let y = Math.ceil(r.y0 / paso) * paso; y <= r.y0 + r.h; y += paso) {
            ctx.beginPath(); ctx.moveTo(px(r.x0), py(y)); ctx.lineTo(px(r.x0 + r.w), py(y)); ctx.stroke();
            ctx.fillText(String(y), px(r.x0) + 2, py(y) - 2);
        }
    }
    if (cajas) {
        const solo = cajas === true ? null : new Set(String(cajas).split(","));
        let i = 0;
        for (const g of objetosEscena(m, Fisica)) {
            if (solo && !solo.has(g.nombre)) continue;
            const c = Render.cajaMundo(m, g.nombre);
            if (!c) continue;
            const color = COLORES[i++ % COLORES.length];
            ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
            ctx.strokeRect(px(c.x0), py(c.y0), (c.x1 - c.x0) * esc, (c.y1 - c.y0) * esc);
            ctx.setLineDash([]);
            // la etiqueta siempre dentro del cuadro (aunque la caja empiece afuera)
            const tw = ctx.measureText(g.nombre).width + 6, W = ctx.canvas.width, H = ctx.canvas.height;
            const lx = Math.min(Math.max(0, px(c.x0)), W - tw), ly = Math.min(Math.max(14, py(c.y0)), H);
            ctx.fillStyle = color; ctx.fillRect(lx, ly - 14, tw, 14);
            ctx.fillStyle = "#fff"; ctx.fillText(g.nombre, lx + 3, ly - 3);
        }
    }
    ctx.restore();
}

// Un cuadro con todo: dibujo, ayudas y (si se pide) la lista. Devuelve la lista o null.
export async function cuadro(m, ctx, w, h, t, opciones = {}) {
    return (await cuadroConVista(m, ctx, w, h, t, opciones)).lista;
}
// Igual, pero devuelve tambien como se paso del mundo al cuadro: {vista: {r, esc, ox, oy}, lista}
export async function cuadroConVista(m, ctx, w, h, t, {zona, cajas, rejilla, lista, fondo, todo} = {}) {
    const motor = await cargarMotor();
    const vista = motor.Render.dibujarCuadro(m, ctx, w, h, t, {zona, fondo, todo});
    if (cajas || rejilla) dibujarAyudas(ctx, m, motor, vista, {cajas, rejilla});
    return {vista, lista: lista ? listar(m, motor, t, vista) : null};
}
