// Notas de correccion ancladas (planeacion_autoria_ia.md, fase IA-6): el usuario marca un instante, un punto
// del dibujo y un comentario; la IA las lee (herramientas/notas.mjs) con un recorte de la zona.
// Viven en escena.notas: [{id, t (ms), x, y, objeto?, parte?, texto, resuelta, respuesta?, fecha}].
import {cajaMundo} from "../Autoria/Render";
import {mapaGrupos} from "../EditorAnimacion/TransformacionInstancia";

const SEP = "::";
export const CERCA_MS = 700;           // una nota se resalta cuando el reloj esta a menos de esto de su instante

export const nuevoIdNota = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Objeto (y parte de una instancia) bajo el punto (x, y) del dibujo: el de caja mas chica que lo contiene.
export function objetoEn(m, x, y) {
    const grupos = m.gestion_grupos.grupos_figuras;
    const mapa = mapaGrupos(grupos);
    const dentro = (c) => c && x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1;
    const area = (c) => (c.x1 - c.x0) * (c.y1 - c.y0);
    let mejor = null;
    for (const g of m.gestion_grupos_originales.grupos_figuras) {
        if (g._virtual || g.nombre === "default" || (g.clases || []).includes("camara") || g.efecto) continue;
        if (g.nodo_padre !== "root" && !(g.clases || []).includes("objeto_hijo") && !g.instancia) continue;
        const c = cajaMundo(m, g.nombre, mapa);
        if (dentro(c) && (!mejor || area(c) < mejor.a)) mejor = {objeto: g.nombre, a: area(c)};
    }
    if (!mejor) return null;
    // la parte mas chica de esa instancia que contiene el punto (la mano, la cabeza)
    let parte = null;
    for (const g of grupos) {
        if (!g._virtual || g._instancia !== mejor.objeto || !(g.lista_figuras || []).length) continue;
        const c = cajaMundo(m, g.nombre, mapa);
        if (dentro(c) && (!parte || area(c) < parte.a)) parte = {nombre: g.nombre.split(SEP).slice(1).join(SEP), a: area(c)};
    }
    return parte ? {objeto: mejor.objeto, parte: parte.nombre} : {objeto: mejor.objeto};
}

// Marcas de las notas en el lienzo del editor. ox, oy: paneo; px: tamano de un pixel de pantalla en el dibujo.
// seleccionada: id de la nota elegida en el panel (se dibuja mas grande).
export function dibujarNotas(ctx, notas, t, ox, oy, px, seleccionada) {
    if (!Array.isArray(notas) || !notas.length) return;
    ctx.save();
    ctx.setLineDash([]);
    notas.forEach((n, i) => {
        const cerca = Math.abs(n.t - t) <= CERCA_MS, elegida = n.id === seleccionada;
        const r = (elegida ? 13 : 10) * px, x = n.x + ox, y = n.y + oy;
        ctx.globalAlpha = n.resuelta ? 0.35 : cerca || elegida ? 1 : 0.55;
        // alfiler: circulo con el numero y una punta hacia el punto marcado
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - r * 0.6, y - r * 1.4);
        ctx.lineTo(x + r * 0.6, y - r * 1.4);
        ctx.closePath();
        ctx.arc(x, y - r * 2, r, 0, Math.PI * 2);
        ctx.fillStyle = n.resuelta ? "#6c757d" : cerca || elegida ? "#e8590c" : "#f59f00";
        ctx.fill();
        ctx.lineWidth = 1.5 * px;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(11 * px * 10) / 10}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.resuelta ? "✓" : String(i + 1), x, y - r * 2);
    });
    ctx.restore();
}
