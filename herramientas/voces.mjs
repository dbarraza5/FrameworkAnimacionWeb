#!/usr/bin/env node
// Voces de una escena con Kokoro (documento/planeacion_voces.md, fase 2).
//
// Lee una escena en formato simple con `voces` y `dialogos`, genera la voz de cada linea con el
// servicio Kokoro (kokoro_container, local), la sube como sonido del proyecto (API de autoria, con
// llave) y escribe la escena con los clips de voz y los globos ajustados a la duracion de la voz.
//
//   "voces": {"narrador": {"voz": "ef_dora"}, "zorro": {"voz": "em_alex", "tono": -2, "velocidad": 0.95},
//             "cuervo": {"voz": "em_alex", "tono": 3, "velocidad": 1.05}}
//   (por objeto que habla, mas "narrador"; opcional por voz: volumen)
//   en un dialogo: "voz": false -> sin voz
//   motor: "kokoro" (por defecto, local) | "elevenlabs": el audio crudo de cada linea se genera AFUERA
//     (el asistente, con la conexion MCP de ElevenLabs) y se deja en la carpeta de cache como
//     <cache>/elevenlabs_<resumen>.wav (24 kHz, 16 bits, mono). Con --pendientes la herramienta solo
//     lista las lineas que faltan (y las escribe en <cache>/pendientes.json); sin cache completa, avisa.
//     "voz" es el voice_id de ElevenLabs; tono y velocidad no se aplican.
//   los pensamientos van con la misma voz y ECO; {radio: true} en una voz la pasa por un filtro de radio
//
//   AUTORIA_LLAVE=... node herramientas/voces.mjs escena.json [--salida escena_con_voces.json]
//   opciones: --kokoro http://kokoro_container:8880   --cache <carpeta> (por defecto <carpeta de la escena>/voces)
//             --pendientes (solo listar lo que falta)   AUTORIA_URL (por defecto http://backend_container:5000/autoria)
//             --reubicar: si una voz pisaria a la anterior, INSERTA TIEMPO en la escena antes de ese dialogo;
//               si una voz no entra en su globo, inserta lo que falta donde el globo terminaba
//               (se corre todo lo que viene despues: camara, acciones, claves, efectos, sonidos y globos)
//               y al final alarga la escena para que entre el ultimo globo
//
// Una linea que no cambio (mismo texto, voz, tono, velocidad y estilo) reusa su sonido: el nombre
// lleva un resumen del contenido ("voz zorro 1a2b3c4d"). Volver a correrla reemplaza los clips de voz.
import fs from "fs";
import {envolvente, clavesBoca, tramosDeAcciones} from "./lib/boca.mjs";
import path from "path";
import crypto from "crypto";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const CON_VALOR = new Set(["--salida", "--kokoro", "--cache", "--llave"]);
const archivo = args.find((a, i) => !a.startsWith("--") && !CON_VALOR.has(args[i - 1]));
const salida = opt("salida", archivo && archivo.replace(/\.json$/, ".voces.json"));
const KOKORO = opt("kokoro", "http://kokoro_container:8880");
const API = (process.env.AUTORIA_URL || "http://backend_container:5000/autoria").replace(/\/$/, "");
const LLAVE = opt("llave", process.env.AUTORIA_LLAVE);
const PREFIJO = "voz ";
const CACHE = opt("cache", archivo ? path.join(path.dirname(archivo), "voces") : "voces");
const SOLO_PENDIENTES = args.includes("--pendientes");
const REUBICAR = args.includes("--reubicar");
const SEPARACION_MS = 250;              // silencio minimo entre dos voces
const POP_MS = 150;                     // la voz arranca despues del "pop" del globo
const COLA_MS = 700;                    // el globo queda despues de que termina la voz (para leerlo)

// ---------------------------------------------------------------- audio (WAV PCM 16 bits, mono)
export function leerWav(buf) {
    let o = 12, fmt = null, datos = null;
    while (o + 8 <= buf.length) {
        const id = buf.toString("ascii", o, o + 4), n = buf.readUInt32LE(o + 4);
        if (id === "fmt ") fmt = {canales: buf.readUInt16LE(o + 10), muestreo: buf.readUInt32LE(o + 12), bits: buf.readUInt16LE(o + 22)};
        if (id === "data") datos = buf.subarray(o + 8, o + 8 + n);
        o += 8 + n + (n % 2);
    }
    if (!fmt || !datos || fmt.bits !== 16) throw new Error("WAV no soportado (se espera PCM de 16 bits)");
    const n = datos.length / 2 / fmt.canales, x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = datos.readInt16LE(i * 2 * fmt.canales) / 32768;
    return {x, muestreo: fmt.muestreo};
}
export function escribirWav(x, muestreo) {
    const b = Buffer.alloc(44 + x.length * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(muestreo, 24);
    b.writeUInt32LE(muestreo * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
    for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
    return b;
}
// quita el silencio del principio y del final (deja un margen)
export function recortarSilencio(x, muestreo, umbral = 0.012, margen_ms = 40) {
    let a = 0, b = x.length - 1;
    while (a < x.length && Math.abs(x[a]) < umbral) a++;
    while (b > a && Math.abs(x[b]) < umbral) b--;
    const m = Math.round(margen_ms / 1000 * muestreo);
    return x.subarray(Math.max(0, a - m), Math.min(x.length, b + m + 1));
}
export function normalizar(x, pico = 0.9) {
    let p = 1e-9; for (const v of x) p = Math.max(p, Math.abs(v));
    const g = Math.min(6, pico / p), y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
    return y;
}
// eco de "voz interior" (v2, mas tenue y prolijo): tres repeticiones suaves y cada vez mas
// oscuras (pasabajos), con una cola corta. ECO_COLA_MS: lo que el eco alarga la voz.
export const ECO_COLA_MS = 450;
export function eco(x, muestreo) {
    const ecos = [[0.11, 0.2, 0.45], [0.22, 0.1, 0.3], [0.34, 0.045, 0.2]];   // [retardo s, volumen, brillo 0..1]
    const extra = Math.round(ECO_COLA_MS / 1000 * muestreo), y = new Float32Array(x.length + extra);
    for (let i = 0; i < x.length; i++) y[i] += x[i];
    for (const [s, g, a] of ecos) {
        const d = Math.round(s * muestreo);
        let lp = 0;
        for (let i = 0; i < x.length; i++) { lp += a * (x[i] - lp); y[i + d] += lp * g; }
    }
    return y;
}
// filtro de RADIO (voz por transmisor): pasa banda ~300-3200 Hz, saturacion suave, soplido leve y un
// "clic" de microfono al principio y al final. En las voces: {voz, radio: true}.
export function radio(x, muestreo) {
    const k = (f) => 1 - Math.exp(-2 * Math.PI * f / muestreo);
    const aHp = k(320), aLp = k(3200), clic = Math.round(0.03 * muestreo), pad = Math.round(0.06 * muestreo);
    const y = new Float32Array(x.length + pad * 2);
    let lp1 = 0, lp2 = 0, hp = 0, hp2 = 0, s = 12345;
    const ruido = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    for (let i = 0; i < x.length; i++) {
        hp += aHp * (x[i] - hp); const pa1 = x[i] - hp; hp2 += aHp * (pa1 - hp2); const pasaAltos = pa1 - hp2;   // quita graves (2 polos)
        lp1 += aLp * (pasaAltos - lp1); lp2 += aLp * (lp1 - lp2);             // quita agudos (2 polos)
        y[i + pad] = Math.tanh(lp2 * 2.2) * 0.7 + ruido() * 0.012;          // saturacion y soplido
    }
    for (let i = 0; i < pad; i++) { y[i] = ruido() * 0.02; y[y.length - 1 - i] = ruido() * 0.02; }
    for (const c0 of [0, y.length - pad]) for (let i = 0; i < clic; i++) y[c0 + i] += ruido() * 0.5 * Math.exp(-i / (clic / 4));
    return y;
}
export function picos(x, n = 200) {
    let m = 1e-9; for (const v of x) m = Math.max(m, Math.abs(v));
    return Array.from({length: n}, (_, j) => {
        let p = 0; for (let i = Math.floor(j * x.length / n); i < (j + 1) * x.length / n; i++) p = Math.max(p, Math.abs(x[i]));
        return Math.round(p / m * 1000) / 1000;
    });
}

// ---------------------------------------------------------------- escena
const letras = (s) => Array.from(String(s || "")).length;
const resumen = (o) => crypto.createHash("sha1").update(JSON.stringify(o)).digest("hex").slice(0, 8);

// Que voz lleva cada dialogo: {rol, cfg, eco} o null (sin voz)
export function vozDe(d, voces) {
    if (!voces || d.voz === false) return null;
    const rol = d.estilo === "narrador" ? "narrador" : d.quien;
    const cfg = rol ? voces[rol] : null;
    return cfg ? {rol, cfg, eco: d.estilo === "pensamiento"} : null;
}

// Ajusta un dialogo a su voz: clip, duracion del globo y velocidad de escritura (texto al ritmo de la voz)
export function ajustarDialogo(d, dur_ms, conPop) {
    const t = d.desde + (conPop ? POP_MS : 0);
    const hasta = Math.max(d.hasta, Math.round(t + dur_ms + COLA_MS));
    const r = {...d, hasta};
    if (d.velocidad !== 0) r.velocidad = Math.max(10, Math.min(60, Math.round(letras(d.texto) / Math.max(0.3, dur_ms * 0.9 / 1000))));
    return {dialogo: r, t_voz: Math.round(t), fin_voz: Math.round(t + dur_ms)};
}

// Inserta `delta` ms en el instante `t` de una escena en formato simple: todo lo que pasa en t o
// despues se corre (claves de la camara y de los objetos, acciones, efectos, dialogos y sonidos) y
// la escena se alarga. Un tramo de claves que cruza t queda mas lento (se estira). Devuelve una copia.
export function insertarTiempo(esc, t, delta) {
    if (!(delta > 0)) return esc;
    const e = JSON.parse(JSON.stringify(esc));
    const mover = (v) => (typeof v === "number" && v >= t ? v + delta : v);
    const claves = (k) => { for (const lista of Object.values(k || {})) if (Array.isArray(lista)) for (const c of lista) if (Array.isArray(c)) c[0] = mover(c[0]); };
    const objeto = (o) => {
        claves(o.claves);
        for (const k of Object.values(o.claves_partes || {})) claves(k);     // claves de una parte del asset en esta instancia
        if (Array.isArray(o.acciones)) for (const a of o.acciones) a[0] = mover(a[0]);
        for (const p of o.partes || []) objeto(p);
    };
    if (e.camara) claves(e.camara.claves);
    for (const o of e.objetos || []) objeto(o);
    for (const ef of e.efectos || []) {
        claves(ef.claves);
        if (typeof ef.inicio === "number") ef.inicio = mover(ef.inicio);
        if (typeof ef.fin === "number") ef.fin = ef.fin >= t ? ef.fin + delta : ef.fin;
    }
    // pasos de alto nivel (IA-5: caminar, mirar, tomar, soltar, plano): como las claves; un tramo que cruza el punto se estira
    for (const p of e.pasos || []) for (const k of ["t", "desde", "hasta"]) if (typeof p[k] === "number") p[k] = mover(p[k]);
    // un globo que ya empezo no se estira (su duracion la decide su propia voz); uno que empieza despues, se corre entero
    for (const d of e.dialogos || []) { if (d.desde >= t) { d.desde += delta; d.hasta += delta; } }
    for (const c of e.sonidos || []) {
        c.t = mover(c.t);
        // un sonido recortado que esta sonando cuando se inserta el tiempo, se alarga
        if (Array.isArray(c.recorte) && c.t < t && c.t + (c.recorte[1] - c.recorte[0]) > t) c.recorte = [c.recorte[0], c.recorte[1] + delta];
    }
    if (typeof e.duracion === "number") e.duracion += delta;
    return e;
}

// Voces que se pisan (dos personajes hablando a la vez): [{i, j, desde}]
export function choques(tramos) {
    const r = [];
    for (let a = 0; a < tramos.length; a++) for (let b = a + 1; b < tramos.length; b++) {
        const x = tramos[a], y = tramos[b];
        if (x.t < y.fin && y.t < x.fin) r.push({i: x.i, j: y.i, desde: Math.max(x.t, y.t), hasta: Math.min(x.fin, y.fin)});
    }
    return r;
}

// ---------------------------------------------------------------- servicios
async function api(metodo, ruta, cuerpo) {
    const r = await fetch(API + ruta, {method: metodo, headers: {"Content-Type": "application/json", "X-Llave-Autoria": LLAVE},
        body: cuerpo ? JSON.stringify(cuerpo) : undefined});
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch (e) { j = {error: t}; }
    if (!r.ok) throw new Error(`API ${metodo} ${ruta} (${r.status}): ${(j.errores || [j.error]).join("; ")}`);
    return j;
}
async function kokoro(texto, cfg) {
    const r = await fetch(KOKORO + "/tts", {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({texto, voz: cfg.voz, velocidad: cfg.velocidad || 1, tono: cfg.tono || 0})});
    if (!r.ok) throw new Error(`Kokoro (${r.status}): ${await r.text()}`);
    return Buffer.from(await r.arrayBuffer());
}

// Archivo de cache del audio crudo de una linea generada afuera (independiente del eco: el mismo
// audio sirve para la voz normal y para el pensamiento).
export const archivoCache = (motor, texto, voz) => `${motor}_${resumen({motor, texto, voz})}.wav`;

async function audioCrudo(d, cfg) {
    const motor = cfg.motor || "kokoro";
    if (motor === "kokoro") return leerWav(await kokoro(d.texto, cfg));
    const f = path.join(CACHE, archivoCache(motor, d.texto, cfg.voz));
    if (!fs.existsSync(f)) return null;
    return leerWav(fs.readFileSync(f));
}

async function principal() {
    if (!archivo) throw new Error("uso: voces.mjs escena.json [--salida x.json]   (con AUTORIA_LLAVE)");
    const esc = JSON.parse(fs.readFileSync(archivo, "utf8"));
    if (!esc.voces) throw new Error('la escena no tiene "voces" ({"narrador": {"voz": "ef_dora"}, "<objeto>": {...}})');
    // lineas de motores externos que todavia no tienen su audio en la cache
    const pendientes = [];
    for (const [i, d] of (esc.dialogos || []).entries()) {
        const v = vozDe(d, esc.voces);
        const motor = v && (v.cfg.motor || "kokoro");
        if (!v || motor === "kokoro") continue;
        const nombre = archivoCache(motor, d.texto, v.cfg.voz);
        if (!fs.existsSync(path.join(CACHE, nombre))) pendientes.push({i, rol: v.rol, motor, voz: v.cfg.voz, texto: d.texto, archivo: nombre});
    }
    if (pendientes.length || SOLO_PENDIENTES) {
        fs.mkdirSync(CACHE, {recursive: true});
        fs.writeFileSync(path.join(CACHE, "pendientes.json"), JSON.stringify(pendientes, null, 1));
        for (const p of pendientes) console.log(`FALTA [${p.i}] ${p.rol.padEnd(9)} ${p.motor} ${p.voz} -> ${p.archivo}  "${p.texto}"`);
        console.log(`${pendientes.length} linea(s) sin audio (lista en ${path.join(CACHE, "pendientes.json")})`);
        if (pendientes.length) process.exitCode = 2;
        return;
    }
    if (!LLAVE) throw new Error("falta la llave (AUTORIA_LLAVE o --llave)");
    const existentes = new Map((await api("GET", "/sonidos")).map((s) => [s.nombre, s]));
    // 1) la voz de cada dialogo: generar o reusar y subir; queda su sonido y su duracion
    const voces = [];
    for (const [i, d] of (esc.dialogos || []).entries()) {
        const v = vozDe(d, esc.voces);
        if (!v) { voces.push(null); continue; }
        const motor = v.cfg.motor || "kokoro";
        const firma = motor === "kokoro"
            ? {texto: d.texto, voz: v.cfg.voz, tono: v.cfg.tono || 0, velocidad: v.cfg.velocidad || 1, eco: v.eco ? 2 : false, ...(v.cfg.radio ? {radio: 1} : {})}
            : {motor, texto: d.texto, voz: v.cfg.voz, eco: v.eco ? 2 : false, ...(v.cfg.radio ? {radio: 1} : {})};    // eco 2: version del eco (otra voz si cambia)
        const nombre = `${PREFIJO}${v.rol} ${resumen(firma)}`;
        let dur = existentes.get(nombre) && existentes.get(nombre).estado === "listo" ? existentes.get(nombre).duracion_ms : null;
        if (dur == null) {
            const {x, muestreo} = await audioCrudo(d, v.cfg);
            let y = normalizar(recortarSilencio(x, muestreo), 0.9);
            if (v.eco) y = normalizar(eco(y, muestreo), 0.8);
            if (v.cfg.radio) y = normalizar(radio(y, muestreo), 0.85);
            dur = Math.round(y.length / muestreo * 1000);
            await api("POST", "/sonidos/voz", {nombre, wav: escribirWav(y, muestreo).toString("base64"), duracion_ms: dur, picos: picos(y),
                nota: `${v.rol}: "${d.texto.slice(0, 120)}" (${motor === "kokoro" ? "Kokoro" : motor} ${v.cfg.voz}${v.cfg.tono && motor === "kokoro" ? `, tono ${v.cfg.tono}` : ""}${v.eco ? ", eco" : ""})`});
            console.log(`VOZ   [${i}] ${v.rol.padEnd(9)} ${String(dur).padStart(5)} ms  "${d.texto}"`);
        } else console.log(`IGUAL [${i}] ${v.rol.padEnd(9)} ${String(dur).padStart(5)} ms  "${d.texto}"`);
        // los ecos no cuentan para "hablar a la vez" ni para el globo: solo la voz
        // boca desde la voz: solo quien habla en voz alta (no el narrador ni los pensamientos)
        let env = null;
        if (v.cfg.boca && !v.eco && d.estilo !== "narrador" && d.quien) {
            const cruda = await audioCrudo(d, v.cfg);
            if (cruda) env = envolvente(normalizar(recortarSilencio(cruda.x, cruda.muestreo), 0.9), cruda.muestreo);
        }
        voces.push({nombre, dur_voz: v.eco ? Math.max(200, dur - ECO_COLA_MS) : dur, volumen: v.cfg.volumen ?? 1, env, quien: d.quien, boca: v.cfg.boca});
    }
    // 2) tiempos: con --reubicar, se inserta tiempo antes de cada voz que pisaria a la anterior
    let escena = esc;
    if (REUBICAR) {
        let fin_anterior = -Infinity;
        // en orden de tiempo (la lista puede no estar ordenada); el orden se recalcula despues de cada insercion
        const hechos = new Set();
        for (;;) {
            const pendiente = voces.map((v, i) => (v && !hechos.has(i) ? i : -1)).filter((i) => i >= 0)
                .sort((x, y) => escena.dialogos[x].desde - escena.dialogos[y].desde);
            if (!pendiente.length) break;
            const i = pendiente[0], v = voces[i];
            hechos.add(i);
            const d = escena.dialogos[i], pop = d.estilo !== "narrador";
            const inicio = d.desde + (pop ? POP_MS : 0);
            const falta = Math.round(fin_anterior + SEPARACION_MS - inicio);
            if (falta > 0) {
                escena = insertarTiempo(escena, d.desde, falta);
                console.log(`      +${falta} ms antes de dialogos[${i}] (en ${d.desde} ms) para que no pise la voz anterior`);
            }
            // la escena ESPERA a que termine la linea: si la voz no entra en su globo, se inserta el tiempo
            // que falta donde el globo terminaba (asi el corte de camara y lo que sigue se corren tambien)
            const di = escena.dialogos[i], necesario = Math.round(di.desde + (pop ? POP_MS : 0) + v.dur_voz + COLA_MS);
            if (necesario > di.hasta) {
                const extra = necesario - di.hasta;
                escena = insertarTiempo(escena, di.hasta, extra);
                console.log(`      +${extra} ms despues de dialogos[${i}] (en ${di.hasta} ms) para que su voz termine`);
            }
            fin_anterior = escena.dialogos[i].desde + (pop ? POP_MS : 0) + v.dur_voz;
        }
    }
    const dialogos = [], clips = [], tramos = [];
    for (const [i, d] of (escena.dialogos || []).entries()) {
        const v = voces[i];
        if (!v) { dialogos.push(d); continue; }
        const a = ajustarDialogo(d, v.dur_voz, d.estilo !== "narrador");
        if (a.dialogo.hasta !== d.hasta) console.log(`      globo [${i}] hasta ${d.hasta} -> ${a.dialogo.hasta} ms`);
        dialogos.push(a.dialogo);
        clips.push({sonido: v.nombre, t: a.t_voz, volumen: v.volumen});
        tramos.push({i, t: a.t_voz, fin: a.fin_voz});
    }
    for (const c of choques(tramos)) console.log(`AVISO las voces de dialogos[${c.i}] y dialogos[${c.j}] se pisan entre ${c.desde} y ${c.hasta} ms`);
    const fin = Math.max(...dialogos.map((d) => d.hasta || 0));
    if (escena.duracion && fin > escena.duracion) {
        // con --reubicar: la escena se alarga (al final) para que entre el ultimo globo
        if (REUBICAR) { escena = insertarTiempo(escena, escena.duracion, fin + 300 - escena.duracion); console.log(`      escena alargada a ${escena.duracion} ms`); }
        else console.log(`AVISO un globo termina en ${fin} ms, despues del final de la escena (${escena.duracion} ms)`);
    }
    // la boca de cada objeto que habla, desde el volumen de su voz (claves_partes de la instancia)
    const lineasDe = new Map();
    for (const tr of tramos) {
        const v = voces[tr.i];
        if (!v || !v.env) continue;
        if (!lineasDe.has(v.quien)) lineasDe.set(v.quien, {boca: v.boca, lineas: []});
        lineasDe.get(v.quien).lineas.push({t: tr.t, env: v.env});
    }
    const objetos = (escena.objetos || []).map((o) => {
        const b = lineasDe.get(o.nombre);
        const resto = {...o};
        const partesBoca = b ? [b.boca].flat().map((x) => x.parte || "boca") : [];
        if (resto.claves_partes && b) { resto.claves_partes = {...resto.claves_partes}; for (const p of partesBoca) delete resto.claves_partes[p]; }
        if (!b) return resto;
        const cp = clavesBoca(b.boca, b.lineas, tramosDeAcciones(o.acciones, escena.duracion));
        console.log(`BOCA  ${o.nombre}: ${b.lineas.length} linea(s), partes ${partesBoca.join(", ")}`);
        return {...resto, claves_partes: {...(resto.claves_partes || {}), ...cp}};
    });
    const sinVoces = (escena.sonidos || []).filter((c) => !String(c.sonido).startsWith(PREFIJO));
    fs.writeFileSync(salida, JSON.stringify({...escena, objetos, dialogos, sonidos: [...sinVoces, ...clips]}, null, 1));
    console.log(`escrito ${salida}: ${clips.length} voces`);
}

if (import.meta.url === `file://${process.argv[1]}`) principal().catch((e) => { console.error("ERROR:", e.message || e); process.exitCode = 1; });
