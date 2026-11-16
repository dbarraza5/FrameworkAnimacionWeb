// Sonido (planeacion_sonido.md): de los datos de una escena a la lista de clips que suenan,
// en tiempo ABSOLUTO de la escena (ms). Modulo puro: lo usan el editor (MotorAudio), la
// exportacion (Mezcla) y las herramientas de Node.
//
// CLIP (lo que se guarda)   {id, sonido: <id>, t (ms), volumen?, pan?, recorte?: [ini, fin] ms,
//                            bucle?: bool, fundido?: {entrada, salida} ms}
// REACCION                  {sonido, volumen?, pan?, max?}   (max: cuantas veces como mucho)
//
// Donde van:
//   escena.sonidos: [CLIP]                  t = tiempo de la escena
//   evento.sonidos: [CLIP]                  t = desde el inicio del evento (las instancias lo heredan)
//   grupo.sonidos = {clips: [CLIP], reacciones: {al_detonar, al_disparar, al_impactar,   (efectos)
//                                               al_soltarse, al_tocar_suelo}}           (objetos)
//   escena.reacciones (en un asset): reacciones que heredan sus instancias
//   grupo.instancia.audio = {volumen, silencio}: ajuste del sonido heredado
//
// CLIP RESUELTO (lo que devuelve clipsEscena)
//   {sonido, t, fin, volumen, pan, recorte, bucle, fundido, origen: {tipo, nombre, detalle}}
//   fin = hasta cuando puede sonar (final de su evento o de la escena), para el bucle.

export const REACCIONES_EFECTO = {detonar: "al_detonar", disparar: "al_disparar", impactar: "al_impactar"};
export const REACCIONES_OBJETO = {soltarse: "al_soltarse", tocar_suelo: "al_tocar_suelo"};
export const ETIQUETA_REACCION = {
    al_detonar: "Al detonar", al_disparar: "Al disparar", al_impactar: "Al impactar",
    al_soltarse: "Al soltarse / romperse", al_tocar_suelo: "Al tocar el suelo",
};
export const MARCAS = {lleva: "Lleva sonido", no_lleva: "No lleva sonido"};

const num = (v, d) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : d);
const lista = (x) => (Array.isArray(x) ? x : []);

// Inicio (ms, absoluto) de cada evento: tiempo_inicio es relativo al padre
export function iniciosEventos(eventos) {
    const porNombre = new Map(lista(eventos).map((e) => [e.nombre, e]));
    const memo = new Map();
    const inicio = (nombre, prof = 0) => {
        if (memo.has(nombre)) return memo.get(nombre);
        const e = porNombre.get(nombre);
        if (!e || prof > 50) return 0;
        const v = num(e.tiempo_inicio, 0) + (porNombre.has(e.nodo_padre) ? inicio(e.nodo_padre, prof + 1) : 0);
        memo.set(nombre, v);
        return v;
    };
    return new Map(lista(eventos).map((e) => [e.nombre, inicio(e.nombre)]));
}

function resolver(c, t, fin, origen, vol = 1) {
    if (!c || !c.sonido) return null;
    return {
        sonido: String(c.sonido), t, fin,
        volumen: Math.max(0, num(c.volumen, 1)) * vol, pan: Math.max(-1, Math.min(1, num(c.pan, 0))),
        recorte: Array.isArray(c.recorte) && c.recorte.length === 2 ? [num(c.recorte[0], 0), num(c.recorte[1], 0)] : null,
        bucle: !!c.bucle, fundido: c.fundido || null, origen,
    };
}

// Descendientes de un evento (incluido) con su desplazamiento (ms) respecto de el
function eventoYDescendientes(eventos, nombre) {
    const hijos = new Map();
    for (const e of lista(eventos)) {
        if (!hijos.has(e.nodo_padre)) hijos.set(e.nodo_padre, []);
        hijos.get(e.nodo_padre).push(e);
    }
    const raiz = lista(eventos).find((e) => e.nombre === nombre);
    if (!raiz) return [];
    const r = [{e: raiz, off: 0}];
    for (let i = 0; i < r.length && i < 500; i++) {
        for (const h of hijos.get(r[i].e.nombre) || []) r.push({e: h, off: r[i].off + num(h.tiempo_inicio, 0)});
    }
    return r;
}

// datos = {escena, eventos (crudos), grupos (sin partes virtuales), duracion (ms),
//          sucesos: [...] (de SimFisica.sucesos), assetDe(id, version) -> {eventos, reacciones} | null}
export function clipsEscena({escena = {}, eventos = [], grupos = [], duracion = 0, sucesos = [], assetDe = () => null}) {
    const r = [];
    const agregar = (c) => { if (c && c.t >= 0 && c.t < duracion) r.push(c); };
    const fin = duracion;

    // 1. pista de la escena
    for (const c of lista(escena.sonidos)) agregar(resolver(c, num(c.t, 0), fin, {tipo: "escena", nombre: "Escena"}));

    // 2. eventos del documento
    const inicios = iniciosEventos(eventos);
    for (const e of lista(eventos)) {
        const t0 = inicios.get(e.nombre) || 0, t1 = t0 + Math.max(0, num(e.tiempo_final, 0) - num(e.tiempo_inicio, 0));
        for (const c of lista(e.sonidos)) agregar(resolver(c, t0 + num(c.t, 0), Math.min(t1, fin), {tipo: "evento", nombre: e.nombre}));
    }

    // momento en que la fisica solto cada objeto (su animacion -y sus pasos- se congelan)
    const soltado = new Map();
    for (const s of lista(sucesos)) if (s.tipo === "soltarse" && s.objeto && !soltado.has(s.objeto)) soltado.set(s.objeto, s.t);

    for (const g of lista(grupos)) {
        if (g._virtual) continue;
        const son = g.sonidos || {};
        // 3. clips propios del objeto o efecto
        for (const c of lista(son.clips)) agregar(resolver(c, num(c.t, 0), fin, {tipo: g.efecto ? "efecto" : "objeto", nombre: g.nombre}));

        // 4. instancias: clips heredados de los eventos de su asset
        const inst = g.instancia;
        const audio = (inst && inst.audio) || {};
        const a = inst && inst.id_eventos ? assetDe(inst.id_eventos, inst.version) : null;
        if (a && !audio.silencio) {
            const vol = num(audio.volumen, 1);
            const elegido = inst.evento || "EventoGeneral";
            const evs = eventoYDescendientes(a.eventos, elegido);
            const E = evs[0] && evs[0].e;
            const dur = E ? Math.max(0, num(E.tiempo_final, 0) - num(E.tiempo_inicio, 0)) : 0;
            const base = num(inst.desfase, 0);
            const corte = soltado.has(g.nombre) ? soltado.get(g.nombre) : fin;
            const vueltas = inst.bucle && dur > 0 ? Math.ceil((fin - base) / dur) : 1;
            for (let k = 0; k < Math.min(vueltas, 2000); k++) {
                const t_vuelta = base + k * dur;
                for (const {e, off} of evs) {
                    for (const c of lista(e.sonidos)) {
                        const rel = off + num(c.t, 0);
                        if (dur > 0 && rel >= dur) continue;
                        const t = t_vuelta + rel;
                        if (t >= corte) continue;
                        agregar(resolver(c, t, Math.min(t_vuelta + dur, corte), {tipo: "instancia", nombre: g.nombre, detalle: `${a.nombre || "asset"} · ${e.nombre}`}, vol));
                    }
                }
            }
        }

        // 5. reacciones a sucesos de la fisica
        const propias = son.reacciones || {};
        const heredadas = a && !audio.silencio ? (a.reacciones || {}) : {};
        const volInst = a ? num(audio.volumen, 1) : 1;
        const cuenta = {};
        for (const s of lista(sucesos)) {
            let clave = null;
            if (g.efecto && s.efecto === g.nombre && REACCIONES_EFECTO[s.tipo]) clave = REACCIONES_EFECTO[s.tipo];
            else if (!g.efecto && s.objeto === g.nombre && REACCIONES_OBJETO[s.tipo]) clave = REACCIONES_OBJETO[s.tipo];
            if (!clave) continue;
            const rx = propias[clave] || heredadas[clave];
            if (!rx || !rx.sonido) continue;
            cuenta[clave] = (cuenta[clave] || 0) + 1;
            if (num(rx.max, 0) > 0 && cuenta[clave] > num(rx.max, 0)) continue;
            agregar(resolver(rx, s.t, fin, {tipo: g.efecto ? "efecto" : "objeto", nombre: g.nombre, detalle: ETIQUETA_REACCION[clave]},
                propias[clave] ? 1 : volInst));
        }
    }
    return r.sort((x, y) => x.t - y.t);
}

// Todas las referencias a sonidos de un documento: [{sonido, donde: {tipo, nombre, detalle}}]
export function referencias({escena = {}, eventos = [], grupos = []}) {
    const r = [];
    for (const c of lista(escena.sonidos)) if (c && c.sonido) r.push({sonido: String(c.sonido), donde: {tipo: "escena", nombre: "Escena"}});
    for (const [k, rx] of Object.entries(escena.reacciones || {})) if (rx && rx.sonido) r.push({sonido: String(rx.sonido), donde: {tipo: "asset", nombre: "Reacciones del asset", detalle: ETIQUETA_REACCION[k] || k}});
    for (const e of lista(eventos)) for (const c of lista(e.sonidos)) if (c && c.sonido) r.push({sonido: String(c.sonido), donde: {tipo: "evento", nombre: e.nombre}});
    for (const g of lista(grupos)) {
        if (g._virtual || !g.sonidos) continue;
        const tipo = g.efecto ? "efecto" : "objeto";
        for (const c of lista(g.sonidos.clips)) if (c && c.sonido) r.push({sonido: String(c.sonido), donde: {tipo, nombre: g.nombre}});
        for (const [k, rx] of Object.entries(g.sonidos.reacciones || {})) if (rx && rx.sonido) r.push({sonido: String(rx.sonido), donde: {tipo, nombre: g.nombre, detalle: ETIQUETA_REACCION[k] || k}});
    }
    return r;
}

// id corto para un clip nuevo
export const idClip = () => "c" + Math.random().toString(36).slice(2, 9);
