// Fase 7: fotogramas clave (keyframes) de propiedades de objeto.
//
// Un objeto (grupo) puede tener `claves`: una pista por propiedad, cada una una
// lista de claves ordenada por tiempo:
//
//   claves: {
//     x:        [{t: 0, v: 300, interp: "suave"}, {t: 4000, v: 700, interp: "lineal"}],
//     rotacion: [...],
//   }
//
// `t` es el tiempo de la escena en ms (el reloj de EventoGeneral). Entre dos claves
// el valor se interpola segun el `interp` de la clave de la izquierda; antes de la
// primera y despues de la ultima se mantiene el valor de la clave extrema.
// Una propiedad sin pista usa su valor base (el que se edita sin claves).

export const PROPIEDADES = {
    x:        {etiqueta: "Posición X", base: (g) => num(g.cx, 0)},
    y:        {etiqueta: "Posición Y", base: (g) => num(g.cy, 0)},
    rotacion: {etiqueta: "Rotación",   base: (g) => num(g.transformacion?.rotacion, 0)},
    escala_x: {etiqueta: "Escala X",   base: (g) => num(g.transformacion?.escala_x, 1)},
    escala_y: {etiqueta: "Escala Y",   base: (g) => num(g.transformacion?.escala_y, 1)},
    opacidad: {etiqueta: "Opacidad",   base: (g) => num(g.opacidad, 1)},
    // 8A: solo la camara
    zoom:     {etiqueta: "Zoom",       base: (g) => num(g.camara?.zoom, 1)},
};

export const INTERPOLACIONES = {
    lineal:   {etiqueta: "Lineal",   f: (u) => u},
    suave:    {etiqueta: "Suave",    f: (u) => u * u * (3 - 2 * u)},       // entra y sale despacio
    entrar:   {etiqueta: "Acelera",  f: (u) => u * u},
    salir:    {etiqueta: "Frena",    f: (u) => 1 - (1 - u) * (1 - u)},
    mantener: {etiqueta: "Mantener", f: () => 0},                          // salto al llegar a la siguiente
};

export const INTERP_DEFECTO = "suave";
// dos claves a menos de esto (ms) se consideran el mismo instante
export const TOLERANCIA_MS = 1;

function num(v, defecto){
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : defecto;
}

export function tienePista(claves, prop){
    return !!(claves && Array.isArray(claves[prop]) && claves[prop].length);
}

// Valor de una pista en el instante t (ms). null si la pista esta vacia.
export function valorEn(pista, t){
    if(!pista || !pista.length) return null;
    if(t <= pista[0].t) return pista[0].v;
    const ultima = pista[pista.length - 1];
    if(t >= ultima.t) return ultima.v;
    // busqueda binaria del tramo [a, b] que contiene a t
    let lo = 0, hi = pista.length - 1;
    while(hi - lo > 1){
        const m = (lo + hi) >> 1;
        if(pista[m].t <= t) lo = m; else hi = m;
    }
    const a = pista[lo], b = pista[hi];
    const u = (t - a.t) / ((b.t - a.t) || 1);
    const f = (INTERPOLACIONES[a.interp] || INTERPOLACIONES[INTERP_DEFECTO]).f;
    return a.v + (b.v - a.v) * f(Math.max(0, Math.min(1, u)));
}

// Indice de la clave en el instante t (dentro de la tolerancia) o -1.
export function indiceClave(pista, t){
    if(!pista) return -1;
    return pista.findIndex((c) => Math.abs(c.t - t) <= TOLERANCIA_MS);
}

// Inserta o reemplaza la clave del instante t. Devuelve la pista nueva (ordenada).
export function ponerClave(pista, t, v, interp){
    const lista = (pista || []).slice();
    const i = indiceClave(lista, t);
    if(i >= 0){
        lista[i] = {...lista[i], v, ...(interp ? {interp} : {})};
    } else {
        lista.push({t: Math.round(t), v, interp: interp || INTERP_DEFECTO});
        lista.sort((a, b) => a.t - b.t);
    }
    return lista;
}

export function quitarClave(pista, t){
    return (pista || []).filter((c) => Math.abs(c.t - t) > TOLERANCIA_MS);
}

// Mueve la clave de t_desde a t_hasta (si ya habia una en t_hasta, la reemplaza).
export function moverClave(pista, t_desde, t_hasta){
    const i = indiceClave(pista, t_desde);
    if(i < 0) return pista;
    const c = pista[i];
    const resto = quitarClave(quitarClave(pista, t_desde), t_hasta);
    resto.push({...c, t: Math.max(0, Math.round(t_hasta))});
    return resto.sort((a, b) => a.t - b.t);
}

// Instantes (ms) con al menos una clave, ordenados y sin repetir.
export function instantesConClaves(claves){
    const ts = [];
    for(const prop in (claves || {})){
        for(const c of claves[prop] || []){
            if(!ts.some((t) => Math.abs(t - c.t) <= TOLERANCIA_MS)) ts.push(c.t);
        }
    }
    return ts.sort((a, b) => a - b);
}

// ---------------- Fase 7B: bucle de claves por objeto ----------------
// Que hace el objeto despues de su ultima clave. El tramo que se repite va de la
// primera a la ultima clave del objeto (todas sus propiedades juntas, para que
// sigan sincronizadas).
export const MODOS_BUCLE = {
    mantener:   {etiqueta: "Quedarse en la última"},
    repetir:    {etiqueta: "Repetir"},
    ida_vuelta: {etiqueta: "Ir y volver"},
    continuar:  {etiqueta: "Continuar (acumula)"},
};

// Propiedades que acumulan en el modo "continuar" (las demas solo se repiten).
export const ACUMULAN = new Set(["x", "y", "rotacion"]);

// Tramo [t0, t1] con claves de un objeto (null si no hay al menos dos instantes).
export function tramoClaves(claves){
    let t0 = Infinity, t1 = -Infinity;
    for(const prop in (claves || {})){
        const p = claves[prop];
        if(!p || !p.length) continue;
        t0 = Math.min(t0, p[0].t);
        t1 = Math.max(t1, p[p.length - 1].t);
    }
    return t1 > t0 ? {t0, t1} : null;
}

// Lleva el instante t al tramo segun el modo: {t, vueltas} (vueltas completadas,
// para acumular en "continuar"). Antes del tramo, o en "mantener", t no cambia.
export function tiempoEnBucle(t, tramo, modo){
    if(!tramo || !modo || modo === "mantener" || t <= tramo.t1) return {t, vueltas: 0};
    const span = tramo.t1 - tramo.t0;
    const k = Math.floor((t - tramo.t0) / span);
    const u = (t - tramo.t0) - k * span;
    if(modo === "ida_vuelta") return {t: k % 2 === 0 ? tramo.t0 + u : tramo.t1 - u, vueltas: 0};
    return {t: tramo.t0 + u, vueltas: modo === "continuar" ? k : 0};
}

// Valor de una propiedad de un objeto con su bucle aplicado.
export function valorObjeto(claves, prop, t, modo){
    const pista = claves && claves[prop];
    if(!pista || !pista.length) return null;
    const tramo = modo && modo !== "mantener" ? tramoClaves(claves) : null;
    const b = tiempoEnBucle(t, tramo, modo);
    let v = valorEn(pista, b.t);
    if(b.vueltas && ACUMULAN.has(prop)){
        v += b.vueltas * (valorEn(pista, tramo.t1) - valorEn(pista, tramo.t0));
    }
    return v;
}

// ---------------- Morphing: pista "forma" ----------------
// Una parte puede llevar `claves.forma: [{t, v: "<nombre de grupo>", interp}]`. Cada
// valor nombra un grupo hermano (normalmente oculto) que guarda una forma de destino
// con la MISMA topologia (mismo numero y tipo de figuras, en el mismo orden). Entre dos
// claves, los puntos de las figuras se interpolan de una forma a la otra. Un valor
// vacio ("") o el propio nombre de la parte es su forma base. No es una propiedad
// numerica: no esta en PROPIEDADES y el editor de claves no la edita (todavia).
export const PISTA_FORMA = "forma";

// Tramo de la pista de forma en t: {a, b, u} (nombres de las formas y avance 0..1 ya
// con la interpolacion aplicada). null si no hay pista. Respeta el bucle del objeto.
export function formaEn(claves, t, modo){
    const pista = claves && claves[PISTA_FORMA];
    if(!pista || !pista.length) return null;
    const tramo = modo && modo !== "mantener" ? tramoClaves(claves) : null;
    const tt = tiempoEnBucle(t, tramo, modo).t;
    if(tt <= pista[0].t) return {a: pista[0].v, b: pista[0].v, u: 0};
    const ultima = pista[pista.length - 1];
    if(tt >= ultima.t) return {a: ultima.v, b: ultima.v, u: 0};
    let lo = 0, hi = pista.length - 1;
    while(hi - lo > 1){
        const m = (lo + hi) >> 1;
        if(pista[m].t <= tt) lo = m; else hi = m;
    }
    const a = pista[lo], b = pista[hi];
    const u = (tt - a.t) / ((b.t - a.t) || 1);
    const f = (INTERPOLACIONES[a.interp] || INTERPOLACIONES[INTERP_DEFECTO]).f;
    return {a: a.v, b: b.v, u: f(Math.max(0, Math.min(1, u)))};
}

// Mismas figuras (cantidad, tipo y orden): se pueden interpolar.
export function formasCompatibles(fa, fb){
    if(!Array.isArray(fa) || !Array.isArray(fb) || fa.length !== fb.length) return false;
    for(let i = 0; i < fa.length; i++) if(fa[i].tipo_figura !== fb[i].tipo_figura) return false;
    return true;
}

// Figuras interpoladas entre dos listas compatibles (u = 0 -> fa, 1 -> fb). Se
// interpolan todos los atributos numericos; los demas se toman de fa. Si no son
// compatibles se salta de una a la otra a la mitad del tramo.
export function interpolarFiguras(fa, fb, u){
    if(u <= 0 || fa === fb) return fa;
    if(u >= 1) return fb;
    if(!formasCompatibles(fa, fb)) return u < 0.5 ? fa : fb;
    return fa.map((f, i) => {
        const g = fb[i], A = f.atributos || {}, B = g.atributos || {};
        const atributos = {...A};
        for(const k in A){
            const x = parseFloat(A[k]), y = parseFloat(B[k]);
            if(Number.isFinite(x) && Number.isFinite(y)) atributos[k] = x + (y - x) * u;
        }
        return {...f, atributos};
    });
}

// ---------------- Morphing de color (planeacion_capacidades.md, fase 1) ----------------
// Solo si la parte lo pide (`forma_color: true`): sus formas de destino traen otro color
// (pintado, borde o degradado) y se interpola junto con los puntos.

// "#rgb" | "#rrggbb" | "rgb(r,g,b)" | "rgba(r,g,b,a)" -> [r, g, b, a] o null
export function leerColor(c){
    if(typeof c !== "string") return null;
    const s = c.trim();
    let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if(m){
        const h = m[1].length === 3 ? m[1].split("").map((k) => k + k).join("") : m[1];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    }
    m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
    if(m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    return null;
}

// Color intermedio; si alguno no se puede leer, salta a la mitad del tramo.
export function interpolarColor(a, b, u){
    if(a === b || u <= 0) return a;
    if(u >= 1) return b;
    const A = leerColor(a), B = leerColor(b);
    if(!A || !B) return u < 0.5 ? a : b;
    const c = A.map((x, i) => x + (B[i] - x) * u);
    const r = (v) => Math.round(Math.max(0, Math.min(255, v)));
    const al = Math.round(Math.max(0, Math.min(1, c[3])) * 1000) / 1000;
    return al >= 1 ? `rgb(${r(c[0])},${r(c[1])},${r(c[2])})` : `rgba(${r(c[0])},${r(c[1])},${r(c[2])},${al})`;
}

const mezclaNum = (x, y, u) => (Number.isFinite(x) && Number.isFinite(y) ? x + (y - x) * u : x);
const mezclaPar = (p, q, u) => (Array.isArray(p) && Array.isArray(q) && p.length === q.length ? p.map((v, i) => mezclaNum(v, q[i], u)) : p);

// Degradado intermedio (misma cantidad de paradas y mismo tipo); si no, salta. Si el
// destino no tiene degradado se mantiene el de la parte.
export function interpolarDegradado(a, b, u){
    if(!a || !b || a === b || u <= 0) return a;
    if(a.tipo !== b.tipo || !Array.isArray(a.colores) || !Array.isArray(b.colores) || a.colores.length !== b.colores.length){
        return u < 0.5 ? a : b;
    }
    return {
        ...a,
        de: mezclaPar(a.de, b.de, u), a: mezclaPar(a.a, b.a, u), centro: mezclaPar(a.centro, b.centro, u),
        radio: mezclaNum(a.radio, b.radio, u), radio_ini: mezclaNum(a.radio_ini, b.radio_ini, u),
        colores: a.colores.map(([p, c], i) => [mezclaNum(p, b.colores[i][0], u), interpolarColor(c, b.colores[i][1], u)]),
    };
}

// Pintado intermedio: por indice, color y degradado (los contornos son los de `pa`).
export function interpolarPintado(pa, pb, u){
    if(!Array.isArray(pa) || !Array.isArray(pb) || pa === pb || u <= 0) return pa;
    return pa.map((p, i) => {
        const q = pb[i];
        if(!q) return p;
        const color = interpolarColor(p.color, q.color, u);
        const degradado = p.degradado ? interpolarDegradado(p.degradado, q.degradado || p.degradado, u) : undefined;
        if(color === p.color && degradado === p.degradado) return p;
        return degradado ? {...p, color, degradado} : {...p, color};
    });
}

// ---------------- Claves propias de partes de una instancia (planeacion_voces.md, fase 3) ----------------
// La escena puede animar una parte del asset en UNA instancia: inst.claves_partes =
//   {"<parte>": {escala_y: [{t, v, interp}], peso?: [{t, v}]}}   (t: ms de la escena)
// `g` es la parte ya posada por el asset; el valor final es asset + (clave - asset) * peso
// (sin pista de peso, peso 1: la clave manda). Props: rotacion, escala_x, escala_y, opacidad.
const PROPS_PARTE = {
    rotacion: {leer: (g) => num(g.transformacion?.rotacion, 0)},
    escala_x: {leer: (g) => num(g.transformacion?.escala_x, 1)},
    escala_y: {leer: (g) => num(g.transformacion?.escala_y, 1)},
    opacidad: {leer: (g) => num(g.opacidad, 1)},
};
export function aplicarClavesParte(g, pistas, t){
    if(!g || !pistas) return;
    const peso = tienePista(pistas, "peso") ? Math.max(0, Math.min(1, valorEn(pistas.peso, t))) : 1;
    if(peso <= 0) return;
    for(const prop in pistas){
        const def = PROPS_PARTE[prop];
        if(!def || !tienePista(pistas, prop)) continue;
        const base = def.leer(g), v = base + (valorEn(pistas[prop], t) - base) * peso;
        if(prop === "opacidad") g.opacidad = v;
        else g.transformacion = {...(g.transformacion || {}), [prop]: v};   // copia: la pose puede estar compartida
    }
}
