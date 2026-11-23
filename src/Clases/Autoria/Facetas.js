// Generador de facetas (pruebas de arte, planeacion_pruebas_arte.md, fase 10: low poly).
// Una PARTE con `facetas` se parte en triangulos planos y cada uno toma un tono segun hacia donde "mira"
// respecto de la luz:
//
//   {nombre: "montana", poligono: [...], color: "#7a9ac0",
//    facetas: {luz: [-1, -1, 0.8],               // direccion DESDE donde llega la luz (x, y, z hacia el que mira)
//              luces?: [[t, [x, y, z]], ...],    // o una luz que se mueve: las caras cambian de tono (morphing de color)
//              detalle?: 50,                     // separacion entre puntos (px): mas chico = mas triangulos
//              relieve?: 1,                      // cuanto "sobresale" el centro (alto imaginario)
//              azar?: 0.35, semilla?: 1,         // irregularidad de los puntos y de las alturas
//              sombra?: 0.45, luzMax?: 1.15}}    // tono de la cara mas oscura y de la mas iluminada (factor del color)
//
// Como: puntos en el borde (cada `detalle`) y adentro (grilla con azar) -> triangulacion de Delaunay
// (Bowyer-Watson) -> se quedan los triangulos con el centro adentro -> cada punto tiene una altura
// imaginaria (mayor lejos del borde, con azar) -> la normal de cada cara 3D contra la luz da su tono.
// La parte queda con `partes` (los triangulos) y sin forma propia; conserva nombre, en, claves, etc.

function rgb(c) {
    const m = String(c || "").match(/^#([0-9a-f]{6})$/i);
    return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
}
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const r2 = (v) => Math.round(v * 100) / 100;

function adentro(px, py, pol) {
    let c = false;
    for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
        const [xi, yi] = pol[i], [xj, yj] = pol[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
}
function distBorde(px, py, pol) {
    let m = Infinity;
    for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
        const [x1, y1] = pol[j], [x2, y2] = pol[i], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
        m = Math.min(m, Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy)));
    }
    return m;
}

// Delaunay (Bowyer-Watson): devuelve triangulos como triples de indices
export function delaunay(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const d = Math.max(x1 - x0, y1 - y0) * 20 + 10, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const P = [...pts, [cx - d, cy - d], [cx + d, cy - d], [cx, cy + d]], n = pts.length;
    const circ = (a, b, c) => {
        const [ax, ay] = P[a], [bx, by] = P[b], [cx_, cy_] = P[c];
        const D = 2 * (ax * (by - cy_) + bx * (cy_ - ay) + cx_ * (ay - by)) || 1e-12;
        const ux = ((ax * ax + ay * ay) * (by - cy_) + (bx * bx + by * by) * (cy_ - ay) + (cx_ * cx_ + cy_ * cy_) * (ay - by)) / D;
        const uy = ((ax * ax + ay * ay) * (cx_ - bx) + (bx * bx + by * by) * (ax - cx_) + (cx_ * cx_ + cy_ * cy_) * (bx - ax)) / D;
        return {a, b, c, ux, uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2};
    };
    let tris = [circ(n, n + 1, n + 2)];
    for (let i = 0; i < n; i++) {
        const [px, py] = P[i], malos = [], buenos = [];
        for (const t of tris) ((px - t.ux) ** 2 + (py - t.uy) ** 2 < t.r2 ? malos : buenos).push(t);
        const bordes = new Map();
        for (const t of malos) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
            const k = u < v ? `${u},${v}` : `${v},${u}`;
            bordes.set(k, bordes.has(k) ? null : [u, v]);
        }
        tris = buenos;
        for (const e of bordes.values()) if (e) tris.push(circ(e[0], e[1], i));
    }
    return tris.filter((t) => t.a < n && t.b < n && t.c < n).map((t) => [t.a, t.b, t.c]);
}

export function expandirFacetas(p, E, donde) {
    const f = p.facetas;
    if (!f || typeof f !== "object") { E.error(donde, "facetas es {luz: [x, y, z] | luces: [[t, [x, y, z]]...], detalle?, relieve?, azar?, semilla?}"); return p; }
    if (!Array.isArray(p.poligono) || p.poligono.length < 3) { E.error(donde, "facetas necesita un poligono"); return p; }
    const base = rgb(p.color);
    if (!base) { E.error(donde, "facetas necesita color \"#rrggbb\" (el color de la cara de frente)"); return p; }
    const luces = Array.isArray(f.luces) && f.luces.length ? f.luces : [[0, f.luz || [-1, -1, 0.8]]];
    if (luces.some((l) => !Array.isArray(l) || !Number.isFinite(Number(l[0])) || !Array.isArray(l[1]) || l[1].length !== 3)) { E.error(donde, "facetas.luces es [[t, [x, y, z]]...]"); return p; }
    const detalle = Math.max(8, Number(f.detalle) || 50), relieve = Number.isFinite(f.relieve) ? f.relieve : 1, azarK = Number.isFinite(f.azar) ? f.azar : 0.35;
    const sombra = Number.isFinite(f.sombra) ? f.sombra : 0.45, luzMax = Number.isFinite(f.luzMax) ? f.luzMax : 1.15;
    let s = (Number(f.semilla) || 1) * 2654435761 >>> 0;
    const azar = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const pol = p.poligono.map(([x, y]) => [Number(x), Number(y)]);
    // puntos: el borde subdividido y una grilla interior con azar
    const pts = [];
    for (let i = 0; i < pol.length; i++) {
        const [xa, ya] = pol[i], [xb, yb] = pol[(i + 1) % pol.length], n = Math.max(1, Math.round(Math.hypot(xb - xa, yb - ya) / detalle));
        for (let k = 0; k < n; k++) pts.push([xa + (xb - xa) * k / n, ya + (yb - ya) * k / n, true]);
    }
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const [x, y] of pol) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
    for (let y = by0 + detalle / 2; y < by1; y += detalle * 0.87) for (let x = bx0 + detalle / 2; x < bx1; x += detalle) {
        const px = x + (azar() - 0.5) * detalle * azarK * 1.6, py = y + (azar() - 0.5) * detalle * azarK * 1.6;
        if (adentro(px, py, pol) && distBorde(px, py, pol) > detalle * 0.35) pts.push([px, py, false]);
    }
    if (pts.length > 1500) E.aviso(donde, `facetas: ${pts.length} puntos (muchos triangulos: subi "detalle")`);
    // alturas: lejos del borde = mas alto (normalizado), con azar
    const dist = pts.map(([x, y, b]) => (b ? 0 : distBorde(x, y, pol))), dmax = Math.max(1, ...dist);
    const z = pts.map((_, i) => (dist[i] / dmax) * relieve * dmax * 0.9 * (1 + (azar() - 0.5) * azarK * 1.4));
    const tris = delaunay(pts.map(([x, y]) => [x, y])).filter(([a, b, c]) => adentro((pts[a][0] + pts[b][0] + pts[c][0]) / 3, (pts[a][1] + pts[b][1] + pts[c][1]) / 3, pol));
    const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
    const tono = (t, L) => {
        const [a, b, c] = t, A = [pts[a][0], pts[a][1], z[a]], B = [pts[b][0], pts[b][1], z[b]], C = [pts[c][0], pts[c][1], z[c]];
        const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
        let nrm = norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
        if (nrm[2] < 0) nrm = nrm.map((x) => -x);               // que mire hacia el espectador
        const l = norm(L.map(Number)), k = Math.max(0, nrm[0] * l[0] + nrm[1] * l[1] + nrm[2] * l[2]);
        const fac = sombra + (luzMax - sombra) * k;
        return hex(base.map((ch) => ch * fac));
    };
    const partes = tris.map((t, i) => {
        const pol3 = t.map((k) => [r2(pts[k][0]), r2(pts[k][1])]);
        const cols = luces.map(([, L]) => tono(t, L));
        const tri = {nombre: `${p.nombre}_f${i}`, capa: 0, poligono: pol3, color: cols[0], borde: cols[0]};
        if (luces.length > 1) {
            tri.colores = Object.fromEntries(cols.map((c, j) => [`l${j}`, {color: c, borde: c}]));
            tri.claves = {forma: luces.map(([tt], j) => [Number(tt), `l${j}`, "lineal"])};
        }
        return tri;
    });
    const {facetas, poligono, color, borde, degradado, ...resto} = p;
    return {...resto, partes: [...partes, ...(p.partes || [])]};
}
