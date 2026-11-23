// Ayudantes compartidos por los generadores de "Pruebas de arte" (planeacion_pruebas_arte.md).
export const TAU = Math.PI * 2;
export const r2 = (v) => Math.round(v * 100) / 100;
export const lineal = (de, a, colores) => ({tipo: "lineal", de, a, colores});
export const radial = (centro, radio, colores) => ({tipo: "radial", centro, radio, colores});
export const ovalo = (cx, cy, rx, ry, n = 24, k = () => 1) =>
    Array.from({length: n}, (_, i) => { const a = (i / n) * TAU, f = k(a); return [r2(cx + Math.cos(a) * rx * f), r2(cy + Math.sin(a) * ry * f)]; });
let semilla = 11;
export const sembrar = (s) => { semilla = s >>> 0; };
export const azar = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
export const marcas = {EventoGeneral: "no_lleva"};
export const TRANSP = "rgba(0,0,0,0)";
export const suave = (x) => x * x * (3 - 2 * x);
export const tramo = (t, a, b) => suave(Math.max(0, Math.min(1, (t - a) / (b - a))));

// Acciones de un personaje: cada accion es un evento del asset; la pose es funcion del tiempo local,
// muestreada cada PASO ms (como en el zorro).
export const PASO = 50;
export function armarAcciones(acciones, params, base) {
    let t = 0;
    const K = {}, ventanas = [];
    for (const a of acciones) {
        const t0 = t;
        for (let tl = 0; tl <= a.dur; tl += PASO) {
            const p = {...base, ...a.pose(Math.min(tl, a.dur), a.dur)};
            for (const [n, [parte, prop]] of Object.entries(params)) ((K[parte] ||= {})[prop] ||= []).push([t0 + Math.min(tl, a.dur), r2(p[n]), "lineal"]);
            if (tl < a.dur && tl + PASO > a.dur) tl = a.dur - PASO;
        }
        ventanas.push({nombre: a.nombre, t0, t1: t0 + a.dur});
        t = t0 + a.dur + 200;
    }
    const ev = (nombre, padre, ti, tf) => ({nombre, nodo_padre: padre, visible: true, bucle: false, tiempo_bucle: 0,
        tiempo_inicio: ti, tiempo_final: tf, x: 0, y: 0, reposicionar: true, tiempo_relativo: 0, objetos: [], macros: [], script: null});
    return {K, total: t, eventos: [ev("EventoGeneral", "Nodo_Default", 0, t), ...ventanas.map((v) => ev(v.nombre, "EventoGeneral", v.t0, v.t1))]};
}
function ponerClaves(partes, K) {
    for (const p of partes) {
        if (K[p.nombre]) p.claves = {...(p.claves || {}), ...K[p.nombre]};
        if (p.partes) ponerClaves(p.partes, K);
    }
}
export const asset = (nombre, acciones, params, base, partes) => {
    const {K, eventos, total} = armarAcciones(acciones, params, base);
    ponerClaves(partes, K);
    return {tipo: "asset", nombre, duracion: total, eventos, marcas: Object.fromEntries(eventos.map((e) => [e.nombre, "no_lleva"])), partes};
};
// claves en bucle de una propiedad: f(u) con u en [0, 1)
export const ciclo = (dur, f, n = 24, interp = "suave") => Array.from({length: n + 1}, (_, i) => [Math.round(dur * i / n), r2(f(i / n)), interp]);

// Trayectoria por tramos para un objeto de la escena: [[t, x, y, "recta" | {arco: altura}], ...] ->
// claves x / y cada `paso` ms (los arcos son parabolas: saltos).
export function trayectoria(puntos, paso = 50) {
    const x = [], y = [];
    for (let i = 0; i < puntos.length - 1; i++) {
        const [t0, x0, y0] = puntos[i], [t1, x1, y1, modo] = puntos[i + 1];
        const arco = modo && modo.arco ? modo.arco : 0;
        for (let t = t0; t < t1; t += paso) {
            const u = (t - t0) / (t1 - t0);
            x.push([t, r2(x0 + (x1 - x0) * u), "lineal"]);
            y.push([t, r2(y0 + (y1 - y0) * u - arco * 4 * u * (1 - u)), "lineal"]);
        }
    }
    const [tf, xf, yf] = puntos[puntos.length - 1];
    x.push([tf, xf, "lineal"]); y.push([tf, yf, "lineal"]);
    return {x, y};
}
