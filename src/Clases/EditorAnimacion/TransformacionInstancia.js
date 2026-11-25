// Transformacion de instancia (planeacion_escena_objetos.md, Fase 1).
//
// Un grupo puede llevar `transformacion`:
//   { rotacion, escala_x, escala_y, ancla_x, ancla_y }
//   - rotacion: grados, positivo = sentido horario en pantalla (Y crece hacia abajo).
//   - escala_x / escala_y: 1 = tamano original; negativa = espejo en ese eje.
//   - ancla_x / ancla_y: punto fijo de la transformacion, relativo al origen del
//     grupo (su cx_solid/cy_solid). Por defecto, el centro inferior del objeto
//     ("los pies"), asi al escalarlo sigue apoyado en el suelo.
// La posicion del objeto sigue siendo el cx/cy del grupo (y los movimientos "Objeto"
// lo trasladan como siempre).
//
// La transformacion NO modifica las figuras: el motor calcula la pose del objeto en
// su espacio propio y la transformacion se aplica recien al dibujar. Por eso escalar
// o reflejar no rompe la animacion (pivotes, LERP y amplitudes estan en pixeles del
// objeto; ver decision D4).
//
// Si un grupo esta dentro de varios grupos con transformacion, se componen: la del
// ancestro mas externo se aplica por fuera.

export const TRANSFORMACION_NEUTRA = Object.freeze({rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0});

const num = (v, def) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : def;
};

// Normaliza (valores por defecto y numeros) una transformacion guardada.
export function normalizarTransformacion(t) {
    if (!t) return null;
    return {
        rotacion: num(t.rotacion, 0),
        escala_x: num(t.escala_x, 1),
        escala_y: num(t.escala_y, 1),
        ancla_x: num(t.ancla_x, 0),
        ancla_y: num(t.ancla_y, 0),
        // traslacion extra (solo la usan los eslabones que arma cadenaTransformaciones para "sin_giro")
        ...(t.tx || t.ty ? {tx: num(t.tx, 0), ty: num(t.ty, 0)} : {}),
    };
}

export function esNeutra(t) {
    return !t || (t.rotacion === 0 && t.escala_x === 1 && t.escala_y === 1 && !t.tx && !t.ty);
}

// Grupos con transformacion (no neutra) que afectan a `grupo`: el mismo y sus
// ancestros, ordenados del mas externo al mas interno. `mapa`: nombre -> grupo.
export function cadenaTransformaciones(grupo, mapa) {
    const cadena = [];
    const vistos = new Set();
    let g = grupo, sinGiro = null, interior = 0;
    while (g && !vistos.has(g.nombre)) {
        vistos.add(g.nombre);
        const t = normalizarTransformacion(g.transformacion);
        if (t && !esNeutra(t)) cadena.unshift({grupo: g, t});
        // "sin_giro" (escena: girar: false; IA-4): sigue la posicion de sus padres pero no su rotacion
        if (!sinGiro && g.sin_giro) { sinGiro = g; interior = cadena.length; }
        g = g.nodo_padre && g.nodo_padre !== "root" ? mapa.get(g.nodo_padre) : null;
    }
    if (!sinGiro) return cadena;
    const exterior = cadena.slice(0, cadena.length - interior), resto = cadena.slice(cadena.length - interior);
    if (!exterior.some((e) => e.t.rotacion)) return cadena;
    // el origen del grupo sin giro cae donde caeria con todo; sus padres le aplican solo escala (y espejo)
    const O = {x: num(sinGiro.cx_solid ?? sinGiro.cx, 0), y: num(sinGiro.cy_solid ?? sinGiro.cy, 0)};
    const sinRot = exterior.map((e) => ({grupo: e.grupo, t: {...e.t, rotacion: 0}}));
    const P = transformarPunto(exterior, O), Q = transformarPunto(sinRot, O);
    const mover = {grupo: {cx: 0, cy: 0}, t: {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0, tx: P.x - Q.x, ty: P.y - Q.y}};
    return [mover, ...sinRot, ...resto];
}

// Punto de anclaje en coordenadas del dibujo (depende de la posicion actual del
// grupo, que incluye la traslacion de sus movimientos).
export function anclaAbsoluta(eslabon) {
    const g = eslabon.grupo;
    const ox = parseFloat(g.cx_solid ?? g.cx) || 0;
    const oy = parseFloat(g.cy_solid ?? g.cy) || 0;
    return {x: ox + eslabon.t.ancla_x, y: oy + eslabon.t.ancla_y};
}

function aplicarUno(t, A, p) {
    const rad = t.rotacion * Math.PI / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    const dx = (p.x - A.x) * t.escala_x;
    const dy = (p.y - A.y) * t.escala_y;
    return {x: A.x + dx * c - dy * s + (t.tx || 0), y: A.y + dx * s + dy * c + (t.ty || 0)};
}

function invertirUno(t, A, p) {
    const rad = t.rotacion * Math.PI / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    const dx = p.x - (t.tx || 0) - A.x, dy = p.y - (t.ty || 0) - A.y;
    const rx = dx * c + dy * s;      // rotar -angulo
    const ry = -dx * s + dy * c;
    return {
        x: A.x + (t.escala_x !== 0 ? rx / t.escala_x : 0),
        y: A.y + (t.escala_y !== 0 ? ry / t.escala_y : 0),
    };
}

// Punto del espacio propio del objeto -> punto en el dibujo (como se ve).
export function transformarPunto(cadena, p) {
    let q = {x: p.x, y: p.y};
    for (let i = cadena.length - 1; i >= 0; i--) {   // de adentro hacia afuera
        q = aplicarUno(cadena[i].t, anclaAbsoluta(cadena[i]), q);
    }
    return q;
}

// Inversa: punto en el dibujo (ej. el mouse) -> espacio propio del objeto.
export function destransformarPunto(cadena, p) {
    let q = {x: p.x, y: p.y};
    for (let i = 0; i < cadena.length; i++) {         // de afuera hacia adentro
        q = invertirUno(cadena[i].t, anclaAbsoluta(cadena[i]), q);
    }
    return q;
}

// Aplica la cadena al contexto del canvas (el llamador hace save/restore). `ox/oy`:
// el paneo que el dibujo suma a cada coordenada (x_delta_original).
export function aplicarEnCanvas(ctx, cadena, ox = 0, oy = 0) {
    for (const eslabon of cadena) {                  // de afuera hacia adentro
        const A = anclaAbsoluta(eslabon);
        const ax = A.x + ox, ay = A.y + oy;
        if (eslabon.t.tx || eslabon.t.ty) ctx.translate(eslabon.t.tx || 0, eslabon.t.ty || 0);
        ctx.translate(ax, ay);
        ctx.rotate(eslabon.t.rotacion * Math.PI / 180);
        ctx.scale(eslabon.t.escala_x, eslabon.t.escala_y);
        ctx.translate(-ax, -ay);
    }
}

// Parte lineal (escala + rotacion, sin ancla) aplicada a un vector. Se usa para que
// el desplazamiento propio de un objeto transformado (sus movimientos "Objeto") se
// interprete en su marco: reflejado avanza hacia donde mira; escalado al 60 %
// avanza el 60 % (no "patina").
export function transformarVector(t, v) {
    const n = normalizarTransformacion(t);
    if (!n || esNeutra(n)) return {x: v.x, y: v.y};
    const rad = n.rotacion * Math.PI / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    const dx = v.x * n.escala_x, dy = v.y * n.escala_y;
    return {x: dx * c - dy * s, y: dx * s + dy * c};
}

// Mapa nombre -> grupo, para resolver ancestros.
export function mapaGrupos(grupos) {
    const m = new Map();
    for (const g of grupos || []) m.set(g.nombre, g);
    return m;
}
