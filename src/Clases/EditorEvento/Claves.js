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
