import {
    cadenaTransformaciones, destransformarPunto, mapaGrupos, normalizarTransformacion, transformarPunto,
    transformarVector
} from "../EditorAnimacion/TransformacionInstancia";
import {limitesGrupos} from "../EditorAnimacion/Miniatura";

// Fase 9A: efectos (campos de fuerza y particulas) y fisica de piezas.
//
// Un EFECTO es un objeto de la escena (como la camara): un grupo sin figuras con la
// clase "efecto" y `efecto: {tipo, ...parametros}`. Su posicion (cx, cy, con claves)
// es donde actua. Tipos: explosion, tornado, disparo, viento, particulas.
//
// Cada objeto de primer nivel decide como reacciona con `fisica: {modo, nivel, ...}`:
//   fijo (por defecto: no se mueve), rigido (vuela entero) o desarmar (sus partes
//   pasan a ser piezas independientes; `nivel` 2 tambien desarma las partes de partes).
//
// La simulacion es determinista: se calcula desde t = 0 con paso fijo (60 por s) y
// se guarda cada paso, asi se puede mover el cursor de tiempo hacia atras y adelante.
// Antes de que una pieza "se suelte", sigue al objeto (sus claves de posicion); al
// soltarse toma esa posicion y desde ahi la mueve la fisica (gravedad, suelo propio
// = altura de los pies del objeto, rebote, friccion). Las piezas no chocan entre si.

export const PASO = 1 / 60;
const PASO_MS = 1000 * PASO;
const T_MAX_MS = 180000;
const V_MAX = 1200;

// Parametros por tipo: [clave, etiqueta, paso (o "texto"/"lista:..."), valor por defecto]
export const TIPOS_EFECTO = {
    explosion: {etiqueta: "Explosión", icono: "bi-asterisk", params: [
        ["t", "Detona en (ms)", 100, 3000], ["fuerza", "Fuerza", 100, 1500], ["radio", "Radio", 10, 700],
        ["arriba", "Hacia arriba (0–1)", 0.1, 0.6], ["umbral", "Umbral para soltar", 10, 120]]},
    tornado: {etiqueta: "Tornado", icono: "bi-tornado", params: [
        ["inicio", "Desde (ms)", 100, 0], ["fin", "Hasta (ms)", 100, 15000], ["radio", "Radio", 10, 240],
        ["fuerza", "Fuerza", 50, 900], ["elevacion", "Elevación", 50, 1600], ["alto", "Alto", 10, 520],
        ["giro", "Giro", 0.5, 5], ["umbral", "Umbral para soltar", 10, 150]]},
    disparo: {etiqueta: "Disparo", icono: "bi-crosshair", params: [
        ["t", "Dispara en (ms)", 100, 2500], ["angulo", "Dirección (°)", 5, 0], ["fuerza", "Fuerza", 50, 900],
        ["alcance", "Alcance", 50, 1200], ["umbral", "Umbral para soltar", 10, 50],
        ["impacto", "Al impactar", "lista:pieza,objeto", "pieza"], ["radio_impacto", "Radio del impacto", 10, 140],
        ["dispersion", "Dispersión (°)", 5, 40]]},
    viento: {etiqueta: "Viento", icono: "bi-wind", params: [
        ["inicio", "Desde (ms)", 100, 0], ["fin", "Hasta (ms)", 100, 10000], ["angulo", "Dirección (°)", 5, 0],
        ["fuerza", "Fuerza", 50, 400], ["umbral", "Umbral para soltar", 10, 300]]},
    particulas: {etiqueta: "Partículas", icono: "bi-stars", params: [
        ["inicio", "Desde (ms)", 100, 0], ["fin", "Hasta (ms)", 100, 2000], ["tasa", "Por segundo", 5, 40],
        ["vida", "Vida (ms)", 100, 1200], ["velocidad", "Velocidad", 10, 160], ["angulo", "Dirección (°)", 5, -90],
        ["dispersion", "Dispersión (°)", 5, 40], ["gravedad", "Gravedad", 50, 0], ["tam_ini", "Tamaño inicial", 1, 10],
        ["tam_fin", "Tamaño final", 1, 26], ["color_ini", "Color inicial", "texto", "#ffcc33"],
        ["color_fin", "Color final", "texto", "#555555"], ["modo", "Modo", "lista:chorro,remolino", "chorro"],
        ["radio", "Radio (remolino)", 10, 120], ["alto", "Alto (remolino)", 10, 400],
        ["suave", "Bordes suaves", "lista:no,si", "no"], ["opacidad", "Opacidad máxima", 0.05, 0.9],
        ["mezcla", "Mezcla", "lista:normal,suma,pantalla", "normal"]]},
};

export const MODOS_FISICA = {
    fijo: {etiqueta: "Fijo (no le afectan los efectos)"},
    rigido: {etiqueta: "Rígido (vuela entero)"},
    desarmar: {etiqueta: "Se desarma en sus partes"},
};

export function efectoDefecto(tipo) {
    const e = {tipo};
    for (const [k, , , v] of (TIPOS_EFECTO[tipo] || {params: []}).params) e[k] = v;
    return e;
}

export const grupoEsEfecto = (g) => !!(g && g.efecto && (g.clases || []).includes("efecto"));

// ---------------- utilidades ----------------
function azar(i, j = 0) {                       // determinista en [0, 1)
    const s = Math.sin(i * 12.9898 + j * 78.233 + 0.5) * 43758.5453;
    return s - Math.floor(s);
}
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
function mezclarColor(a, b, u) {
    const h = (c) => { const x = String(c || "#000").replace("#", ""); return x.length === 3 ? x.split("").map((k) => k + k).join("") : x.padEnd(6, "0"); };
    const A = h(a), B = h(b);
    const p = (s, i) => parseInt(s.substr(i, 2), 16) || 0;
    const m = (i) => Math.round(p(A, i) + (p(B, i) - p(A, i)) * u);
    return `rgb(${m(0)},${m(2)},${m(4)})`;
}

// Particulas de un emisor en el instante t (ms), sin estado: cada particula i nace en
// inicio + i/tasa y su posicion es una formula de su edad. posEn(t) = posicion del emisor.
export function particulasEn(ef, posEn, t) {
    const inicio = num(ef.inicio, 0), fin = num(ef.fin, 0), tasa = Math.max(0.1, num(ef.tasa, 20));
    const vida = Math.max(50, num(ef.vida, 1000));
    if (t < inicio || t > fin + vida) return [];
    const dt = 1000 / tasa;
    const primero = Math.max(0, Math.floor((t - vida - inicio) / dt));
    const ultimo = Math.floor((Math.min(t, fin) - inicio) / dt);
    const r = [];
    const remolino = ef.modo === "remolino";
    const Pt = remolino ? posEn(t) : null;
    for (let i = Math.max(primero, ultimo - 800); i <= ultimo; i++) {
        const nace = inicio + i * dt;
        const edad = t - nace;
        if (edad < 0 || edad > vida) continue;
        const u = edad / vida, a = edad / 1000;
        let x, y;
        if (remolino) {
            const alto = num(ef.alto, 400), radio = num(ef.radio, 120);
            const h = Math.min(alto, num(ef.velocidad, 160) * a * (0.7 + 0.6 * azar(i, 1)));
            const rad = radio * (0.25 + 0.75 * h / alto) * (0.7 + 0.5 * azar(i, 2));
            const ang = azar(i, 3) * Math.PI * 2 + a * 7;
            x = Pt.x + Math.cos(ang) * rad;
            y = Pt.y - h + Math.sin(ang) * rad * 0.15;
        } else {
            const P0 = posEn(nace);
            const ang = (num(ef.angulo, -90) + (azar(i, 1) - 0.5) * num(ef.dispersion, 40)) * Math.PI / 180;
            const v = num(ef.velocidad, 160) * (0.6 + 0.8 * azar(i, 2));
            x = P0.x + Math.cos(ang) * v * a;
            y = P0.y + Math.sin(ang) * v * a + 0.5 * num(ef.gravedad, 0) * a * a;
        }
        r.push({x, y, tam: num(ef.tam_ini, 10) + (num(ef.tam_fin, 26) - num(ef.tam_ini, 10)) * u,
            color: mezclarColor(ef.color_ini, ef.color_fin, u), alfa: (1 - u) * (1 - u) * num(ef.opacidad, 0.9) + 0.05});
    }
    return r;
}

// ---------------- simulacion ----------------
export class SimFisica {
    constructor(motor) {
        // referencia al motor NO enumerable: el editor copia el motor con
        // JSON.stringify y una referencia circular lo haria fallar (y el editor no
        // terminaria de cargar)
        Object.defineProperty(this, "m", {value: motor, enumerable: false, writable: true});
        this.firma = null;
        this.sobrescritos = new Set();
    }

    // La simulacion es estado calculado: no se copia ni se guarda.
    toJSON() {
        return null;
    }

    _orig() { return this.m.gestion_grupos_originales.grupos_figuras; }

    efectos() {
        return this._orig().filter((g) => grupoEsEfecto(g) && !g._virtual);
    }

    _firmaEscena() {
        const gs = this._orig();
        const rel = gs.filter((g) => g.efecto || g.fisica || (g.nodo_padre === "root" && g.claves));
        return JSON.stringify(rel.map((g) => [g.nombre, g.efecto, g.fisica, g.claves, g.claves_bucle, g.cx, g.cy,
            g.transformacion])) + "|" + gs.length + "|" + JSON.stringify((this.m.escena || {}).fisica || {});
    }

    // Posicion de un objeto (sus claves) en t ms.
    _pos(nombre, t) {
        return {x: this.m.valorPropiedad(nombre, "x", t), y: this.m.valorPropiedad(nombre, "y", t)};
    }

    // Partes de un objeto que se desarma: baja por contenedores sin dibujo con un solo
    // hijo dibujado (p. ej. instancia -> raiz del asset) y toma sus hijos con dibujo.
    _piezas(nombre, nivel, hijos, con_figuras, propias) {
        let nodo = nombre;
        for (let k = 0; k < 6; k++) {
            const hs = (hijos.get(nodo) || []).filter((g) => con_figuras(g.nombre));
            if (!propias(nodo) && hs.length === 1) nodo = hs[0].nombre; else break;
        }
        let piezas = (hijos.get(nodo) || []).filter((g) => con_figuras(g.nombre)).map((g) => g.nombre);
        if (propias(nodo)) piezas.unshift(nodo);
        if (!piezas.length) piezas = [nombre];
        if (nivel >= 2) {
            const mas = [];
            for (const p of piezas) {
                if (p === nodo) continue;
                for (const h of (hijos.get(p) || []).filter((g) => con_figuras(g.nombre))) mas.push(h.nombre);
            }
            piezas = piezas.concat(mas);
        }
        return piezas;
    }

    _preparar() {
        const gs = this._orig();
        this.m.gestion_grupos_originales.procesarPosicionFinalFiguras();
        const mapa = mapaGrupos(gs);
        const {hijos, con_figuras} = this.m._indice(gs);
        const propias = (n) => ((mapa.get(n) || {}).lista_figuras || []).length > 0;
        const subarbol = (n) => this.m.subarbol(n, gs);
        const profundidad = (n) => { let d = 0, g = mapa.get(n); while (g && g.nodo_padre !== "root" && d < 50) { d++; g = mapa.get(g.nodo_padre); } return d; };
        // caja del sub-arbol en el dibujo (con todas las transformaciones)
        const cajaMundo = (n) => {
            const g = mapa.get(n);
            const lim = limitesGrupos(subarbol(n).filter((x) => Number.isFinite(x.cx_solid)));
            if (!g || !lim) return null;
            const cad = cadenaTransformaciones(g, mapa);
            const q = [[lim.x0, lim.y0], [lim.x1, lim.y0], [lim.x1, lim.y1], [lim.x0, lim.y1]].map(([x, y]) => transformarPunto(cad, {x, y}));
            const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
            return {lim, cad, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)};
        };

        this.efs = this.efectos().map((g) => ({nombre: g.nombre, ef: g.efecto}));
        this.cuerpos = [];
        if (!this.efs.some((e) => e.ef.tipo !== "particulas")) return;
        const objetos = gs.filter((g) => g.nodo_padre === "root" && g.fisica && !g._virtual &&
            (g.fisica.modo === "rigido" || g.fisica.modo === "desarmar") && !grupoEsEfecto(g));
        let i = 0;
        for (const obj of objetos) {
            const caja_obj = cajaMundo(obj.nombre);
            if (!caja_obj) continue;
            const p0 = this._pos(obj.nombre, 0);
            // instancia: su asset puede avanzar por su cuenta (p. ej. el perro "Caminar"
            // tiene un MRU). Se guarda su grupo raiz para sumar ese avance (_deltaInterno).
            if (obj.instancia && obj.instancia.id_eventos) {
                let nodo = obj.nombre;
                for (let k = 0; k < 6; k++) {
                    const hs = (hijos.get(nodo) || []).filter((g) => con_figuras(g.nombre));
                    if (!propias(nodo) && hs.length === 1) nodo = hs[0].nombre; else break;
                }
                const raiz = mapa.get(nodo);
                if (raiz && raiz._virtual && raiz._original) {
                    this.internos.set(obj.nombre, {inst: obj.instancia, original: raiz._original,
                        reposo: {x: parseFloat(raiz.cx) || 0, y: parseFloat(raiz.cy) || 0}, t: obj.transformacion});
                }
            }
            const nombres = obj.fisica.modo === "rigido" ? [obj.nombre]
                : this._piezas(obj.nombre, num(obj.fisica.nivel, 1), hijos, con_figuras, propias);
            for (const n of nombres) {
                const g = mapa.get(n);
                const c = cajaMundo(n);
                if (!g || !c) continue;
                const area = Math.max(30, (c.x1 - c.x0) * (c.y1 - c.y0));
                const t = normalizarTransformacion(g.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1};
                this.cuerpos.push({
                    i: i++, nombre: n, objeto: obj.nombre, prof: profundidad(n), p0,
                    c0: {x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2},
                    hx: (c.x1 - c.x0) / 2, hy: (c.y1 - c.y0) / 2,
                    suelo0: caja_obj.y1,
                    masa: num(obj.fisica.masa, 0) || Math.min(4, Math.max(0.6, area / 6000)),
                    rebote: num(obj.fisica.rebote, 0.3), friccion: num(obj.fisica.friccion, 0.8),
                    // ancla de rotacion = centro de la pieza, en su espacio propio
                    ancla: {x: (c.lim.x0 + c.lim.x1) / 2 - (g.cx_solid || 0), y: (c.lim.y0 + c.lim.y1) / 2 - (g.cy_solid || 0)},
                    rot0: t.rotacion || 0, esc: {x: t.escala_x, y: t.escala_y},
                });
            }
        }
        this.cuerpos.sort((a, b) => a.prof - b.prof);
    }

    // Centro y suelo de un cuerpo que todavia no se solto (sigue a su objeto).
    // Avance propio del asset de una instancia en t ms (en el dibujo), respecto de su
    // pose de reposo. Si alguna pieza del objeto ya se solto, su animacion quedo
    // congelada en ese instante (ver aplicar), asi que se evalua ahi.
    _deltaInterno(objeto, t) {
        const info = this.internos.get(objeto);
        if (!info) return {x: 0, y: 0};
        const ts = this.soltadoObj.get(objeto);
        const te = ts != null ? Math.min(t, ts) : t;
        const clave = objeto + "|" + Math.round(te);
        if (this.cacheInterno.has(clave)) return this.cacheInterno.get(clave);
        let r = {x: 0, y: 0};
        const a = this.m._asset(info.inst.id_eventos, info.inst.version);
        if (a && a.motor) {
            const tA = te / 1000 - (parseFloat(info.inst.desfase) || 0) / 1000;
            const pose = a.motor.evaluarEn(info.inst.evento || "EventoGeneral", tA, info.inst.bucle !== false) || [];
            const p = pose.find((q) => q.nombre === info.original);
            if (p) {
                const tr = {...(info.t || {}), rotacion: this.m.valorPropiedad(objeto, "rotacion", te),
                    escala_x: this.m.valorPropiedad(objeto, "escala_x", te), escala_y: this.m.valorPropiedad(objeto, "escala_y", te)};
                r = transformarVector(tr, {x: (parseFloat(p.cx) || 0) - info.reposo.x, y: (parseFloat(p.cy) || 0) - info.reposo.y});
            }
        }
        this.cacheInterno.set(clave, r);
        return r;
    }

    _previo(b, t) {
        const p = this._pos(b.objeto, t);
        const di = this._deltaInterno(b.objeto, t);
        const dx = p.x - b.p0.x + di.x, dy = p.y - b.p0.y + di.y;
        return {x: b.c0.x + dx, y: b.c0.y + dy, suelo: b.suelo0 + dy};
    }

    _reiniciar() {
        this.internos = new Map();
        this.cacheInterno = new Map();
        this.soltadoObj = new Map();     // objeto -> primer instante (ms) en que se solto una pieza
        this.sucesosSim = [];            // sonido: sucesos que salen de la simulacion (ver sucesos())
        this._preparar();
        this.pasos = [];          // pasos[k] = estados (null = sin soltar) en t = k * PASO
        this.estado = this.cuerpos.map(() => null);
        this.k = 0;
    }

    _soltar(b, t) {
        const p = this._previo(b, t);
        if (!this.soltadoObj.has(b.objeto)) {
            this.soltadoObj.set(b.objeto, t);
            this.sucesosSim.push({tipo: "soltarse", objeto: b.objeto, t, en: {x: p.x, y: p.y}});
        }
        return {x: p.x, y: p.y, vx: 0, vy: 0, ang: 0, w: 0, suelo: p.suelo, quieto: false, ts: t};
    }

    _paso() {
        const t = this.k * PASO_MS, t0 = t - PASO_MS;
        const G = num(((this.m.escena || {}).fisica || {}).gravedad, 1400);
        const est = this.estado;
        const centro = (b) => (est[b.i] ? est[b.i] : this._previo(b, t));
        const empujar = (b, dvx, dvy, umbral, w) => {
            const mag = Math.hypot(dvx, dvy);
            if (!est[b.i]) { if (mag < umbral) return; est[b.i] = this._soltar(b, t); }
            const s = est[b.i];
            const f = Math.min(1, V_MAX / Math.max(1, Math.hypot(s.vx + dvx, s.vy + dvy)));
            s.vx = (s.vx + dvx) * f; s.vy = (s.vy + dvy) * f; s.w += w || 0; s.quieto = false;
        };
        const acelerar = {};
        for (const {nombre, ef} of this.efs) {
            const tipo = ef.tipo;
            if (tipo === "explosion") {
                const td = num(ef.t, 0);
                if (!(td > t0 && td <= t)) continue;
                const P = this._pos(nombre, td), R = Math.max(1, num(ef.radio, 600));
                for (const b of this.cuerpos) {
                    const c = centro(b);
                    let dx = c.x - P.x, dy = c.y - P.y;
                    const d = Math.hypot(dx, dy);
                    if (d >= R) continue;
                    if (d < 1e-3) { dx = azar(b.i) - 0.5; dy = -1; }
                    const n = Math.hypot(dx, dy);
                    let ux = dx / n, uy = dy / n - num(ef.arriba, 0.5);
                    const m = Math.hypot(ux, uy); ux /= m; uy /= m;
                    const dv = num(ef.fuerza, 1500) * Math.pow(1 - d / R, 1.2) / Math.sqrt(b.masa);
                    empujar(b, ux * dv * (0.85 + 0.3 * azar(b.i, 7)), uy * dv * (0.85 + 0.3 * azar(b.i, 8)),
                        num(ef.umbral, 100), (azar(b.i, 5) - 0.5) * dv / 130);
                }
            } else if (tipo === "disparo") {
                const td = num(ef.t, 0);
                if (!(td > t0 && td <= t)) continue;
                const P = this._pos(nombre, td), a = num(ef.angulo, 0) * Math.PI / 180;
                const ux = Math.cos(a), uy = Math.sin(a), alcance = num(ef.alcance, 1000);
                let mejor = null;
                for (const b of this.cuerpos) {
                    const c = centro(b);
                    const proy = (c.x - P.x) * ux + (c.y - P.y) * uy;
                    if (proy <= 0 || proy > alcance) continue;
                    const perp = Math.abs((c.x - P.x) * uy - (c.y - P.y) * ux);
                    if (perp > Math.max(b.hx, b.hy) * 0.9) continue;
                    if (!mejor || proy < mejor.proy) mejor = {b, proy, c};
                }
                if (mejor) this.sucesosSim.push({tipo: "impactar", efecto: nombre, objeto: mejor.b.objeto, t: td,
                    en: {x: P.x + ux * mejor.proy, y: P.y + uy * mejor.proy}});
                if (mejor && ef.impacto === "objeto") {
                    // "Desarma el objeto": todas las partes del objeto alcanzado se sueltan y
                    // salen hacia atras (en la direccion del disparo), mas fuerte cerca del
                    // impacto y cada una con un angulo algo distinto
                    const H = {x: P.x + ux * mejor.proy, y: P.y + uy * mejor.proy};
                    const R = Math.max(1, num(ef.radio_impacto, 140)), disp = num(ef.dispersion, 40) * Math.PI / 180;
                    for (const bb of this.cuerpos) {
                        if (bb.objeto !== mejor.b.objeto) continue;
                        const c = centro(bb);
                        const f = 0.3 + 0.7 * Math.max(0, 1 - Math.hypot(c.x - H.x, c.y - H.y) / R);
                        const ang = a + (azar(bb.i, 11) - 0.5) * disp;
                        const dv = num(ef.fuerza, 900) * f / Math.sqrt(bb.masa);
                        // giro en el sentido del disparo: asi tambien caen las piezas lejanas (piernas)
                        empujar(bb, Math.cos(ang) * dv, Math.sin(ang) * dv - dv * 0.3, 0, (ux >= 0 ? 1 : -1) * (2 + 3 * azar(bb.i, 12)));
                    }
                } else if (mejor) {
                    const {b, proy, c} = mejor;
                    const dv = num(ef.fuerza, 900) / Math.sqrt(b.masa);
                    const hx = P.x + ux * proy - c.x, hy = P.y + uy * proy - c.y;   // punto de impacto - centro
                    const r2 = Math.max(100, b.hx * b.hx + b.hy * b.hy);
                    empujar(b, ux * dv, uy * dv - dv * 0.15, num(ef.umbral, 40), (hx * uy * dv - hy * ux * dv) / r2 * 1.6);
                }
            } else if (tipo === "tornado" || tipo === "viento") {
                if (t < num(ef.inicio, 0) || t > num(ef.fin, 0)) continue;
                const P = this._pos(nombre, t);
                for (const b of this.cuerpos) {
                    const c = centro(b);
                    let ax, ay, w = 0;
                    if (tipo === "viento") {
                        const a = num(ef.angulo, 0) * Math.PI / 180, f = num(ef.fuerza, 400) / Math.sqrt(b.masa);
                        ax = Math.cos(a) * f; ay = Math.sin(a) * f;
                        if (!est[b.i]) { if (f < num(ef.umbral, 300)) continue; est[b.i] = this._soltar(b, t); }
                    } else {
                        const dx = c.x - P.x, R = num(ef.radio, 240), alto = num(ef.alto, 500);
                        if (Math.abs(dx) > R || c.y < P.y - alto - 150 || c.y > P.y + 120) continue;
                        const s = 1 - Math.abs(dx) / R;
                        const f = num(ef.fuerza, 900) * s / Math.sqrt(b.masa);
                        if (!est[b.i]) { if (f < num(ef.umbral, 150)) continue; est[b.i] = this._soltar(b, t); }
                        const st = est[b.i];
                        const giro = num(ef.giro, 5);
                        ax = -dx * 6 * s - st.vx * 2 * s + Math.cos(t / 1000 * giro + b.i) * f * 1.5;
                        ay = -num(ef.elevacion, 1600) * (0.4 + 0.6 * s) / Math.sqrt(b.masa) - st.vy * 1.2 * s;
                        if (c.y < P.y - alto) ay += num(ef.elevacion, 1600) * 1.2;      // techo del remolino
                        w = giro * s * (azar(b.i, 4) > 0.5 ? 1 : -1);
                    }
                    const acc = acelerar[b.i] || (acelerar[b.i] = {ax: 0, ay: 0, w: 0});
                    acc.ax += ax; acc.ay += ay; acc.w += w;
                }
            }
        }
        for (const b of this.cuerpos) {
            const s = est[b.i];
            if (!s) continue;
            const acc = acelerar[b.i];
            if (acc) { s.vx += acc.ax * PASO; s.vy += acc.ay * PASO; s.w += acc.w * PASO; s.quieto = false; }
            if (s.quieto) continue;
            s.vy += G * PASO;
            s.x += s.vx * PASO; s.y += s.vy * PASO; s.ang += s.w * PASO;
            s.vx *= 0.99; s.vy *= 0.995;
            // suelo propio: la altura de los pies del objeto al soltarse
            const ext = Math.abs(b.hy * Math.cos(s.ang)) + Math.abs(b.hx * Math.sin(s.ang));
            if (s.y + ext >= s.suelo && !acc) {
                if (!s.toco && s.vy > 90) {       // primera vez que la pieza golpea el suelo
                    s.toco = true;
                    this.sucesosSim.push({tipo: "tocar_suelo", objeto: b.objeto, pieza: b.nombre, t, en: {x: s.x, y: s.suelo}});
                }
                s.y = s.suelo - ext;
                if (s.vy > 0) s.vy = s.vy > 90 ? -s.vy * b.rebote : 0;
                s.vx *= 0.7 - (1 - b.friccion) * 0.3;
                s.w *= 0.9;
                // se apoya sobre el lado mas cercano (multiplo de 90)... salvo que este
                // inclinado mas alla de su punto de vuelco (el centro queda fuera de la
                // base): entonces sigue cayendo hacia el siguiente lado
                const Q = Math.PI / 2;
                let obj = Math.round(s.ang / Q) * Q;
                const desvio = s.ang - obj;
                const parado = Math.round(obj / Q) % 2 === 0;           // apoyado sobre su base original
                const critico = Math.atan2(parado ? b.hx : b.hy, parado ? b.hy : b.hx);
                if (Math.abs(desvio) > critico * 0.85) {
                    obj += Math.sign(desvio) * Q;
                    s.w = Math.sign(desvio) * Math.max(Math.abs(s.w), 3.5);
                    s.quieto = false;
                    s.ang += s.w * PASO * 0.5;
                    continue;
                }
                // se acomoda solo cuando casi no gira (si no, le ganaria a su propio giro)
                if (Math.abs(s.w) < 1.2) s.ang += (obj - s.ang) * 0.12;
                if (Math.abs(s.vx) < 4 && Math.abs(s.vy) < 4 && Math.abs(s.w) < 0.05 && Math.abs(obj - s.ang) < 0.01) {
                    s.ang = obj; s.vx = s.vy = s.w = 0; s.quieto = true;
                }
            }
        }
        this.pasos[this.k] = est.map((s) => (s ? {x: s.x, y: s.y, ang: s.ang, ts: s.ts} : null));
        this.k++;
    }

    // Estados de los cuerpos en t ms (null = la pieza sigue a su objeto).
    estadosEn(t) {
        const f = this._firmaEscena();
        if (f !== this.firma) { this.firma = f; this._reiniciar(); }
        if (!this.cuerpos.length) return null;
        const k = Math.max(0, Math.min(Math.floor(Math.min(t, T_MAX_MS) / PASO_MS), T_MAX_MS / PASO_MS));
        while (this.k <= k) this._paso();
        return this.pasos[k];
    }

    // Sucesos hasta `hasta` ms, para los sonidos de reaccion (planeacion_sonido.md):
    // {tipo: detonar|disparar (efecto, a su tiempo), impactar (efecto -> objeto),
    //  soltarse (primera pieza de un objeto), tocar_suelo (cada pieza, la primera vez),
    //  efecto?, objeto?, pieza?, t (ms), en: {x, y}}. Determinista: siempre los mismos.
    sucesos(hasta) {
        const f = this._firmaEscena();
        if (f !== this.firma) { this.firma = f; this._reiniciar(); }
        const r = [];
        for (const {nombre, ef} of this.efs || []) {
            if (ef.tipo !== "explosion" && ef.tipo !== "disparo") continue;
            const td = num(ef.t, 0);
            if (td <= hasta) r.push({tipo: ef.tipo === "explosion" ? "detonar" : "disparar", efecto: nombre, t: td, en: this._pos(nombre, td)});
        }
        if (this.cuerpos.length) {
            this.estadosEn(hasta);
            for (const s of this.sucesosSim) if (s.t <= hasta) r.push(s);
        }
        return r.sort((a, b) => a.t - b.t);
    }

    // En cada cuadro (despues de claves e instancias): coloca las piezas sueltas.
    aplicar(t) {
        const dinamicos = this.m.gestion_grupos;
        const estados = this.estadosEn(t);
        const ahora = new Set();
        if (estados) {
            dinamicos.procesarPosicionFinalFiguras();
            const mapa = mapaGrupos(dinamicos.grupos_figuras);
            for (const b of this.cuerpos) {
                const s = estados[b.i];
                if (!s) continue;
                const d = mapa.get(b.nombre);
                if (!d) continue;
                const padre = d.nodo_padre && d.nodo_padre !== "root" ? mapa.get(d.nodo_padre) : null;
                const cad = padre ? cadenaTransformaciones(padre, mapa) : [];
                const local = destransformarPunto(cad, {x: s.x, y: s.y});
                const base = padre ? {x: parseFloat(padre.cx_solid) || 0, y: parseFloat(padre.cy_solid) || 0} : {x: 0, y: 0};
                // espejo del padre: la rotacion se invierte
                const o = transformarPunto(cad, {x: 0, y: 0}), ex = transformarPunto(cad, {x: 1, y: 0}), ey = transformarPunto(cad, {x: 0, y: 1});
                const espejo = ((ex.x - o.x) * (ey.y - o.y) - (ex.y - o.y) * (ey.x - o.x)) < 0;
                const grados = s.ang * 180 / Math.PI;
                d.cx = local.x - base.x - b.ancla.x;
                d.cy = local.y - base.y - b.ancla.y;
                d.transformacion = {rotacion: b.rot0 + (espejo ? -grados : grados),
                    escala_x: b.esc.x, escala_y: b.esc.y, ancla_x: b.ancla.x, ancla_y: b.ancla.y};
                // posiciones absolutas al dia para los hijos que tambien son piezas
                d.cx_solid = (padre ? base.x : 0) + d.cx;
                d.cy_solid = (padre ? base.y : 0) + d.cy;
                ahora.add(b.nombre);
            }
        }
        // Al soltarse algo, la animacion propia de su objeto se congela en ese instante
        // (como un "ragdoll"): si es una instancia, su asset deja de avanzar.
        const congelar = new Map();
        if (estados) {
            for (const b of this.cuerpos) {
                const s = estados[b.i];
                if (s && (!congelar.has(b.objeto) || s.ts < congelar.get(b.objeto))) congelar.set(b.objeto, s.ts);
            }
        }
        for (const n of new Set([...(this.congelados || []), ...congelar.keys()])) {
            const d = dinamicos.getGrupo(n);
            if (!d) continue;
            if (congelar.has(n)) d._t_congelado = congelar.get(n) / 1000; else delete d._t_congelado;
        }
        this.congelados = [...congelar.keys()];

        // las que dejaron de estar sueltas (se volvio atras en el tiempo) recuperan su transformacion
        for (const n of this.sobrescritos) {
            if (ahora.has(n)) continue;
            const o = this.m.gestion_grupos_originales.getGrupo(n), d = dinamicos.getGrupo(n);
            if (o && d) d.transformacion = o.transformacion ? {...o.transformacion} : o.transformacion;
        }
        this.sobrescritos = ahora;
    }
}
