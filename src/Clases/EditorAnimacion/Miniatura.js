import {GestionAnimacion, getCoorPunto, getCoorRecta} from "./GestionAnimacion";

// Dibuja una animacion (sus grupos_figuras) ajustada al tamano de un canvas chico,
// para usarla como miniatura. Pinta los rellenos (lista_pintado) y encima el trazo
// de las figuras, respetando el orden de capas y la visibilidad de los grupos.

// Prepara los grupos: posiciones absolutas (cx_solid) y orden de dibujo.
export function prepararGrupos(grupos_figuras){
    const gestion = new GestionAnimacion();
    gestion.grupos_figuras = structuredClone(grupos_figuras || []);
    gestion.procesarPosicionFinalFiguras();
    const orden = [];
    gestion.listaOrdenadasGrupos(orden);
    return orden;
}

// Rectangulo que encierra todas las figuras de los grupos visibles (o null si no hay).
export function limitesGrupos(orden){
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const incluir = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const grupo of orden) {
        if (grupo.visible === false) continue;
        for (const figura of grupo.lista_figuras) {
            if (figura.tipo_figura === "RECTA") {
                const c = getCoorRecta(figura, grupo);
                incluir(c.x1, c.y1); incluir(c.x2, c.y2);
            } else if (figura.tipo_figura === "PUNTO") {
                const c = getCoorPunto(figura, grupo);
                incluir(c.x, c.y);
            } else if (figura.tipo_figura === "CIRCULO") {
                const c = getCoorPunto(figura, grupo);
                const rx = parseInt(figura.atributos.radiox) || 0, ry = parseInt(figura.atributos.radioy) || 0;
                incluir(c.x - rx, c.y - ry); incluir(c.x + rx, c.y + ry);
            }
        }
    }
    return x0 === Infinity ? null : {x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2};
}

function puntoContorno(grupo, elemento){
    const figura = grupo.lista_figuras.find((f) => f.nombre === elemento.nombre);
    if (!figura) return null;
    if (figura.tipo_figura === "RECTA") {
        const c = getCoorRecta(figura, grupo);
        if (elemento.componente === "PUNTO1") return {x: c.x1, y: c.y1};
        if (elemento.componente === "PUNTO2") return {x: c.x2, y: c.y2};
    }
    if (figura.tipo_figura === "PUNTO") {
        return getCoorPunto(figura, grupo);
    }
    return null;
}

export function dibujarMiniatura(canvas, grupos_figuras, margen = 8){
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const orden = prepararGrupos(grupos_figuras);
    const lim = limitesGrupos(orden);
    if (!lim) return false;

    const ancho = Math.max(lim.x1 - lim.x0, 1), alto = Math.max(lim.y1 - lim.y0, 1);
    const escala = Math.min((canvas.width - 2 * margen) / ancho, (canvas.height - 2 * margen) / alto, 4);
    const T = (p) => ({
        x: canvas.width / 2 + (p.x - lim.cx) * escala,
        y: canvas.height / 2 + (p.y - lim.cy) * escala,
    });

    for (const grupo of orden) {
        if (grupo.visible === false) continue;

        for (const pintura of grupo.lista_pintado || []) {
            if (pintura.visible === false) continue;
            for (const elementos of pintura.elementos || []) {
                const pts = (elementos || []).map((e) => puntoContorno(grupo, e)).filter(Boolean).map(T);
                if (pts.length < 3) continue;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                ctx.closePath();
                ctx.fillStyle = pintura.color;
                ctx.fill();
            }
        }

        ctx.strokeStyle = grupo.color || "#000000";
        ctx.lineWidth = 1;
        for (const figura of grupo.lista_figuras) {
            if (figura.tipo_figura === "RECTA") {
                const c = getCoorRecta(figura, grupo);
                const a = T({x: c.x1, y: c.y1}), b = T({x: c.x2, y: c.y2});
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            } else if (figura.tipo_figura === "CIRCULO") {
                const c = T(getCoorPunto(figura, grupo));
                ctx.beginPath();
                ctx.ellipse(c.x, c.y, (parseInt(figura.atributos.radiox) || 0) * escala,
                    (parseInt(figura.atributos.radioy) || 0) * escala, 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    }
    return true;
}
