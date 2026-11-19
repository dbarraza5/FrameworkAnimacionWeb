#!/usr/bin/env node
// Sincronia de labios desde un AUDIO (WAV): escucha la voz y propone la boca de cada
// instante, como claves de la pista `forma` (morphing, ver Claves.formaEn).
//
//   node herramientas/labios.mjs voz.wav [--salida boca.json] [--desfase 0] [--formas a=a,e=e,i=i,o=o,u=u,m=m,f=f,cerrada=]
//
// Como funciona (sin servicios externos):
//   - corta el audio en ventanas de 20 ms;
//   - el volumen dice si hay voz (si no: boca cerrada);
//   - en lo sonoro estima los dos primeros formantes (F1, F2) con LPC y elige la vocal
//     mas cercana (a, e, i, o, u); el ruido agudo sin tono es una fricativa (f / s);
//   - una caida breve del volumen entre dos sonidos es un cierre de labios (m / b / p);
//   - junta ventanas iguales y descarta tramos de menos de 60 ms.
// Es una estimacion: funciona mejor con una voz limpia, sin musica de fondo.
//
// Salida (JSON): {duracion, visemas: [{t, v, d}], claves: {forma: [[t, "<forma>", "suave"]...]}}
// `--formas` traduce cada visema al nombre de la forma de tu boca (clave corta de `formas`
// o nombre de grupo); "cerrada=" (vacio) es la forma base de la parte.
import fs from "fs";

function argumentos(argv) {
    const a = {_: []};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            const k = argv[i].slice(2);
            a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
        } else a._.push(argv[i]);
    }
    return a;
}

// ---------------- WAV (PCM 8/16/24/32 bits o float 32) -> mono Float32 ----------------
export function leerWav(buf) {
    if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error("no es un WAV (RIFF/WAVE); convierte el audio a .wav");
    let p = 12, fmt = null, datos = null;
    while (p + 8 <= buf.length) {
        const id = buf.toString("ascii", p, p + 4), n = buf.readUInt32LE(p + 4);
        if (id === "fmt ") fmt = {formato: buf.readUInt16LE(p + 8), canales: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22)};
        if (id === "data") datos = buf.subarray(p + 8, Math.min(buf.length, p + 8 + n));
        p += 8 + n + (n % 2);
    }
    if (!fmt || !datos) throw new Error("WAV sin bloque fmt o data");
    const {formato, canales, sr, bits} = fmt;
    const bpm = bits / 8, n = Math.floor(datos.length / (bpm * canales));
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let s = 0;
        for (let c = 0; c < canales; c++) {
            const o = (i * canales + c) * bpm;
            let v;
            if (formato === 3 && bits === 32) v = datos.readFloatLE(o);
            else if (bits === 16) v = datos.readInt16LE(o) / 32768;
            else if (bits === 8) v = (datos[o] - 128) / 128;
            else if (bits === 24) v = datos.readIntLE(o, 3) / 8388608;
            else if (bits === 32) v = datos.readInt32LE(o) / 2147483648;
            else throw new Error(`WAV de ${bits} bits no soportado`);
            s += v;
        }
        x[i] = s / canales;
    }
    return {x, sr};
}

// ---------------- analisis ----------------
// Coeficientes LPC (Levinson-Durbin) de una ventana.
function lpc(v, orden) {
    const r = new Float64Array(orden + 1);
    for (let k = 0; k <= orden; k++) { let s = 0; for (let i = k; i < v.length; i++) s += v[i] * v[i - k]; r[k] = s; }
    if (r[0] <= 0) return null;
    r[0] *= 1.0001;
    const a = new Float64Array(orden + 1); a[0] = 1;
    let e = r[0];
    for (let i = 1; i <= orden; i++) {
        let acc = r[i];
        for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
        const k = -acc / e;
        const prev = a.slice();
        for (let j = 1; j < i; j++) a[j] = prev[j] + k * prev[i - j];
        a[i] = k;
        e *= 1 - k * k;
        if (e <= 0) return null;
    }
    return a;
}

// Picos de la envolvente LPC (formantes aproximados), en Hz.
function formantes(a, sr) {
    const N = 256, mag = new Float64Array(N);
    for (let k = 0; k < N; k++) {
        const w = Math.PI * k / N;
        let re = 0, im = 0;
        for (let j = 0; j < a.length; j++) { re += a[j] * Math.cos(w * j); im -= a[j] * Math.sin(w * j); }
        mag[k] = 1 / Math.max(1e-12, re * re + im * im);
    }
    const picos = [];
    for (let k = 1; k < N - 1; k++) if (mag[k] > mag[k - 1] && mag[k] >= mag[k + 1]) picos.push(k * sr / 2 / N);
    return picos.filter((f) => f > 200 && f < 4000);
}

// Vocales de referencia del español (F1, F2 en Hz, voz media). Se comparan en escala
// logaritmica, que tolera mejor las diferencias entre voces graves y agudas.
const VOCALES = {a: [750, 1300], e: [480, 1900], i: [310, 2300], o: [500, 900], u: [340, 750]};

export function analizar(x, sr) {
    // pre-enfasis y remuestreo simple a ~11 kHz para el LPC (los formantes que importan son < 4 kHz)
    const paso = Math.max(1, Math.floor(sr / 11025)), sr2 = sr / paso;
    const y = new Float32Array(Math.floor(x.length / paso));
    for (let i = 0; i < y.length; i++) { let s = 0; for (let j = 0; j < paso; j++) s += x[i * paso + j]; y[i] = s / paso; }
    const VENT = Math.round(0.03 * sr2), SALTO = Math.round(0.02 * sr2);
    const ventanas = [];
    for (let i0 = 0; i0 + VENT <= y.length; i0 += SALTO) {
        const v = new Float64Array(VENT);
        let e = 0, cruces = 0, eAgudo = 0;
        for (let i = 0; i < VENT; i++) {
            const s = y[i0 + i], ant = i0 + i > 0 ? y[i0 + i - 1] : 0;
            const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (VENT - 1));
            v[i] = (s - 0.95 * ant) * w;
            e += s * s;
            eAgudo += (s - ant) * (s - ant);
            if (i && (s >= 0) !== (ant >= 0)) cruces++;
        }
        const rms = Math.sqrt(e / VENT);
        const a = lpc(v, Math.min(20, Math.round(2 + sr2 / 1000)));
        ventanas.push({t: Math.round((i0 + VENT / 2) / sr2 * 1000), rms, zcr: cruces / VENT, agudo: eAgudo / Math.max(1e-12, e), F: a ? formantes(a, sr2) : []});
    }
    if (!ventanas.length) return [];
    // umbrales relativos al audio
    const vol = ventanas.map((w) => w.rms).sort((p, q) => p - q);
    const alto = vol[Math.floor(vol.length * 0.95)] || 1e-6;
    const umbral = Math.max(alto * 0.08, vol[Math.floor(vol.length * 0.2)] * 2);
    for (const w of ventanas) {
        if (w.rms < umbral) { w.v = "cerrada"; continue; }
        if (w.zcr > 0.3 && w.agudo > 1.2) { w.v = "f"; continue; }         // ruido agudo sin tono
        const [F1, F2] = w.F.length >= 2 ? w.F : [500, 1500];
        w.F1 = F1; w.F2 = F2;
    }
    for (const w of ventanas.filter((q) => q.F1)) {
        let mejor = "a", d = Infinity;
        for (const [n, [r1, r2]] of Object.entries(VOCALES)) {
            // F2 pesa mas: en voces agudas el F1 se corre hacia el armonico mas cercano
            const dd = (Math.log(w.F1 / r1) / 0.35) ** 2 + (Math.log(w.F2 / r2) / 0.2) ** 2;
            if (dd < d) { d = dd; mejor = n; }
        }
        w.v = mejor;
    }
    // caida breve del volumen entre dos sonidos (comparada con lo que la rodea, +-120 ms):
    // labios casi cerrados (m / b / p)
    for (let i = 0; i < ventanas.length; i++) {
        const w = ventanas[i];
        if (!w.F1) continue;
        let izq = 0, der = 0;
        for (let j = Math.max(0, i - 6); j < i; j++) izq = Math.max(izq, ventanas[j].rms);
        for (let j = i + 1; j <= Math.min(ventanas.length - 1, i + 6); j++) der = Math.max(der, ventanas[j].rms);
        if (w.rms < 0.4 * Math.min(izq, der)) w.v = "m";
    }
    return ventanas;
}

// Junta ventanas iguales en tramos y descarta los de menos de `minimo` ms (se los queda el vecino).
export function tramos(ventanas, minimo = 60) {
    const r = [];
    for (const w of ventanas) {
        const u = r[r.length - 1];
        if (u && u.v === w.v) u.fin = w.t + 10;
        else r.push({t: Math.max(0, w.t - 10), fin: w.t + 10, v: w.v});
    }
    for (let pasada = 0; pasada < 3; pasada++) {
        for (let i = 0; i < r.length; i++) {
            if (r[i].fin - r[i].t >= minimo || r.length < 2) continue;
            const j = i > 0 ? i - 1 : i + 1;
            if (j < i) r[j].fin = r[i].fin; else r[j].t = r[i].t;
            r.splice(i, 1); i--;
        }
        for (let i = 1; i < r.length; i++) if (r[i].v === r[i - 1].v) { r[i - 1].fin = r[i].fin; r.splice(i, 1); i--; }
    }
    return r.map((x) => ({t: x.t, v: x.v, d: x.fin - x.t}));
}

// Tramos -> claves de forma. Cada boca llega a su forma un poco despues de empezar el
// tramo (la transicion la hace el morphing con "suave").
export function clavesForma(lista, formas, desfase = 0) {
    const nombre = (v) => (v in formas ? formas[v] : v === "cerrada" ? "" : v);
    const claves = [];
    for (const x of lista) {
        const t = Math.round(desfase + x.t + (claves.length ? Math.min(60, x.d * 0.35) : 0));
        if (claves.length && t <= claves[claves.length - 1][0]) continue;
        claves.push([t, nombre(x.v), "suave"]);
    }
    if (!claves.length || claves[0][0] > desfase) claves.unshift([Math.round(desfase), nombre("cerrada"), "suave"]);
    return claves;
}

async function principal() {
    const a = argumentos(process.argv.slice(2));
    if (!a._[0]) {
        process.stdout.write("uso: labios.mjs voz.wav [--salida boca.json] [--desfase ms] [--formas a=a,e=e,...,cerrada=]\n");
        process.exit(2);
    }
    const {x, sr} = leerWav(fs.readFileSync(a._[0]));
    const formas = {};
    if (typeof a.formas === "string") for (const par of a.formas.split(",")) { const [k, v = ""] = par.split("="); formas[k.trim()] = v.trim(); }
    const lista = tramos(analizar(x, sr));
    const res = {duracion: Math.round(x.length / sr * 1000), visemas: lista, claves: {forma: clavesForma(lista, formas, parseFloat(a.desfase) || 0)}};
    const texto = JSON.stringify(res, null, 1);
    if (a.salida) { fs.writeFileSync(a.salida, texto); process.stdout.write(`${lista.length} tramos (${res.duracion} ms) -> ${a.salida}\n`); }
    else process.stdout.write(texto + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) principal().catch((e) => { process.stderr.write(`ERROR: ${e.message}\n`); process.exit(1); });
