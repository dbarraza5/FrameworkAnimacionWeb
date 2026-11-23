// Boca desde la voz (planeacion_voces.md, fase 3): del audio de cada linea sale cuanto se abre la
// boca en cada instante, y de eso las claves de una parte del asset en la instancia que habla
// (`claves_partes`, ver Claves.aplicarClavesParte). Sirve para cualquier personaje que declare
// su boca en las voces de la escena:
//   voces: {kiru: {..., boca: {parte: "boca", prop: "escala_y", cerrada: 0.22, abierta: 1}}}
//   (o una lista: boca: [{parte: "mandibula", prop: "rotacion", cerrada: 0, abierta: 16}, {...}])

export const VENTANA_MS = 40;

// Apertura 0..1 cada VENTANA_MS: volumen (RMS) normalizado por el percentil 90 de la linea,
// con un umbral de silencio, una curva que abre mas las vocales y un suavizado que abre rapido
// y cierra un poco mas despacio (como una mandibula).
export function envolvente(x, muestreo, ventana_ms = VENTANA_MS) {
    const n = Math.max(1, Math.round(ventana_ms / 1000 * muestreo)), rms = [];
    for (let i = 0; i < x.length; i += n) {
        let s = 0, c = 0;
        for (let j = i; j < Math.min(x.length, i + n); j++) { s += x[j] * x[j]; c++; }
        rms.push(Math.sqrt(s / Math.max(1, c)));
    }
    const orden = rms.filter((v) => v > 0.01).sort((a, b) => a - b);
    const p90 = orden.length ? orden[Math.floor(orden.length * 0.9)] : 1;
    const crudo = rms.map((v) => Math.max(0, Math.min(1, (v / (p90 || 1) - 0.12) / 0.88)) ** 0.7);
    const r = [];
    let y = 0;
    for (const v of crudo) { y += (v > y ? 0.75 : 0.45) * (v - y); r.push(Math.round(y * 100) / 100); }
    return r.map((v, k) => [k * ventana_ms, v]);
}

// Junta intervalos [a, b] que se tocan o se pisan.
function unir(intervalos) {
    const s = intervalos.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]), r = [];
    for (const [a, b] of s) {
        if (r.length && a <= r[r.length - 1][1] + 1) r[r.length - 1][1] = Math.max(r[r.length - 1][1], b);
        else r.push([a, b]);
    }
    return r;
}

// Claves de la parte de la boca para un objeto:
//   lineas: [{t (ms de la escena donde arranca la voz), env: envolvente(...)}]
//   hablar: intervalos [a, b] (ms) donde la boca la manda la voz aunque no suene (p. ej. una
//           accion "Hablar" que sigue despues de la linea: asi no mueve la boca en silencio)
// Devuelve {"<parte>": {"<prop>": [[t, v, "lineal"]...], peso: [[t, 0|1, "lineal"]...]}} o null.
// `boca` puede ser una lista de partes (p. ej. la mandibula y el interior de la boca): todas siguen la misma voz.
export function clavesBoca(boca, lineas, hablar = [], rampa_ms = 60) {
    if (!boca || !lineas.length) return null;
    if (Array.isArray(boca)) return boca.reduce((r, b) => ({...r, ...clavesBoca(b, lineas, hablar, rampa_ms)}), {});
    const {parte = "boca", prop = "escala_y", cerrada = 0, abierta = 1} = boca;
    const valor = (a) => Math.round((cerrada + (abierta - cerrada) * a) * 1000) / 1000;
    const pista = new Map();
    const poner = (t, v) => pista.set(Math.round(t), v);
    for (const {t, env} of [...lineas].sort((p, q) => p.t - q.t)) {
        poner(t - 1, valor(0));
        let ant = null;
        env.forEach(([ms, a], k) => {
            const v = valor(a), ultimo = k === env.length - 1;
            if (v !== ant || ultimo) poner(t + ms, v);   // sin claves repetidas en los tramos quietos
            ant = v;
        });
        poner(t + (env.length ? env[env.length - 1][0] : 0) + VENTANA_MS, valor(0));
    }
    const claves = [...pista.entries()].sort((p, q) => p[0] - q[0]).map(([t, v]) => [Math.max(0, t), v, "lineal"]);
    // peso: 1 mientras suena cada linea (y en los tramos de "hablar"), 0 afuera, con rampas cortas
    const fin = (l) => l.t + (l.env.length ? l.env[l.env.length - 1][0] : 0) + VENTANA_MS;
    const tramos = unir([...lineas.map((l) => [l.t - 1, fin(l)]), ...hablar]);
    const peso = [];
    for (const [a, b] of tramos) peso.push([Math.max(0, a - rampa_ms), 0, "lineal"], [Math.max(0, a), 1, "lineal"], [b, 1, "lineal"], [b + rampa_ms, 0, "lineal"]);
    // sin dos claves en el mismo instante (tramos pegados)
    const pesoLimpio = [];
    for (const k of peso) {
        const u = pesoLimpio[pesoLimpio.length - 1];
        if (u && k[0] <= u[0]) { if (k[1] === 1) u[1] = 1; continue; }
        pesoLimpio.push(k);
    }
    // claves de la boca tambien sin repetir instante (ya vienen de un Map) y en orden
    return {[parte]: {[prop]: claves, peso: pesoLimpio}};
}

// Intervalos [a, b] (ms) de las acciones de un objeto cuyo evento empieza con `prefijo` ("Hablar").
export function tramosDeAcciones(acciones, duracion, prefijo = "Hablar") {
    const lista = (acciones || []).map((a) => ({t: a[0], evento: a[1]})).sort((p, q) => p.t - q.t);
    return lista.map((a, k) => [a.t, k + 1 < lista.length ? lista[k + 1].t : duracion, a.evento])
        .filter(([, , e]) => String(e).startsWith(prefijo)).map(([a, b]) => [a, b]);
}
