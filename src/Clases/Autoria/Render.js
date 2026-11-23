// Dibujo de un cuadro de la escena "como se vera el resultado" (lo que ve la camara),
// compartido por el editor (Archivo -> Exportar video, Fase A7) y la herramienta de
// Node (herramientas/render.mjs, Fase A3). No depende del DOM: recibe un contexto 2D.

import {cadenaTransformaciones, mapaGrupos, transformarPunto} from "../EditorAnimacion/TransformacionInstancia";
import {aplicarEstilo, estiloEn} from "../EditorEvento/Estilo";

// Caja de un objeto en el dibujo (con escala, espejo y rotacion de su cadena), en el
// estado actual del motor. null si no tiene nada dibujado.
export function cajaMundo(m, nombre, mapa = mapaGrupos(m.gestion_grupos.grupos_figuras)) {
    const g = mapa.get(nombre);
    const lim = g ? m.limitesObjeto(nombre) : null;
    if (!lim) return null;
    const cad = cadenaTransformaciones(g, mapa);
    const q = [[lim.x0, lim.y0], [lim.x1, lim.y0], [lim.x1, lim.y1], [lim.x0, lim.y1]].map(([x, y]) => transformarPunto(cad, {x, y}));
    const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
    return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
}

// Caja de todo lo dibujado (para --todo o escenas sin camara).
export function limitesEscena(m) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const g of m.gestion_grupos.grupos_figuras) {
        if (!g.lista_figuras || !g.lista_figuras.length) continue;
        const lim = m.limitesObjeto(g.nombre);
        if (!lim) continue;
        x0 = Math.min(x0, lim.x0); y0 = Math.min(y0, lim.y0); x1 = Math.max(x1, lim.x1); y1 = Math.max(y1, lim.y1);
    }
    return x0 === Infinity ? null : {x0, y0, x1, y1};
}

// Lleva el motor al instante t (ms) y dibuja el cuadro en ctx (w x h pixeles).
export function dibujarCuadro(m, ctx, w, h, t, {todo = false, fondo = "#ffffff"} = {}) {
    // tiempo FORZADO (no los relojes del editor: pausar/buscar se pisan entre si)
    const forzado_antes = m._t_forzado;
    // stop-motion (escena.fps_animacion): el instante se redondea hacia abajo a pasos de 1/fps
    const fps_anim = m.escena && m.escena.fps_animacion;
    if (fps_anim > 0) t = Math.floor(t * fps_anim / 1000 + 1e-6) * 1000 / fps_anim;
    m._t_forzado = t / 1000;
    try { m.procesandoEventos(); } finally { m._t_forzado = forzado_antes; }
    m.gestion_grupos.procesarPosicionFinalFiguras();
    let r = m.rectCamara();
    if (todo || !r) {
        const lim = limitesEscena(m);
        r = lim ? {x0: lim.x0, y0: lim.y0, w: lim.x1 - lim.x0, h: lim.y1 - lim.y0} : {x0: 0, y0: 0, w: 1280, h: 720};
    }
    const esc = Math.min(w / r.w, h / r.h);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(esc, 0, 0, esc, (w - r.w * esc) / 2 - r.x0 * esc, (h - r.h * esc) / 2 - r.y0 * esc);
    // el dibujo del motor suma el paneo del editor a cada coordenada: aqui va en 0
    const imp = m.imprimir_animacion;
    const cfg = imp.configuracion_lienzo || m.configuracion_lienzo;
    const dx = cfg.x_delta_original, dy = cfg.y_delta_original;
    cfg.x_delta_original = 0; cfg.y_delta_original = 0;
    const ctx_antes = imp.ctx, atenuados = imp.atenuados;
    imp.ctx = ctx;
    imp.atenuados = null;
    try {
        imp.imprimirListaGrupos(m.ordenDibujo(), [], [], [], null, null, null, null, true);
        m.dibujarEfectos(ctx, 0, 0, 1 / esc, false);
        // estilo de imagen de la escena (duotono con tramado, etc.): sobre lo que ve la camara, antes de los globos
        const estilo = m.escena && m.escena.estilo;
        if (estilo) aplicarEstilo(ctx, estiloEn(estilo, t), (w - r.w * esc) / 2, (h - r.h * esc) / 2, r.w * esc, r.h * esc, 720, t);
        if (m.dibujarDialogos) m.dibujarDialogos(ctx, 0, 0);
    } finally {
        imp.ctx = ctx_antes;
        imp.atenuados = atenuados;
        cfg.x_delta_original = dx; cfg.y_delta_original = dy;
        ctx.restore();
    }
}

// Tamano de salida: ancho dado, alto segun la proporcion de la camara.
export function tamanoSalida(m, ancho = 640) {
    const r = m.rectCamara() || {w: 1280, h: 720};
    return {w: Math.round(ancho), h: Math.round(ancho * r.h / r.w)};
}
