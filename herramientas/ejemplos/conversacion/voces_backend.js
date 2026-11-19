// Fase 5: crea el proyecto "Fase 5 - Dos personajes conversan", sintetiza las voces de Ana y
// Bruno (de /tmp/voz_ana.json y /tmp/voz_bruno.json) y el ambiente, y deja una llave temporal.
// uso: node /tmp/conv_proyecto.js        |  node /tmp/conv_proyecto.js revocar
const fs = require("node:fs");
const SR = 22050;
let s = 23;
const azar = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const ruido = () => azar() * 2 - 1;
function wav(x, cruce = 0) {
    let n = x.length;
    if (cruce) { n -= cruce; for (let i = 0; i < cruce; i++) { const k = i / cruce; x[i] = x[i] * k + x[n + i] * (1 - k); } }
    let m = 1e-9; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(x[i]));
    const b = Buffer.alloc(44 + n * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(x[i] / m * 0.85 * 32767), 44 + i * 2);
    const picos = [];
    for (let j = 0; j < 200; j++) { let p = 0; for (let i = Math.floor(j * n / 200); i < (j + 1) * n / 200; i++) p = Math.max(p, Math.abs(x[i] / m)); picos.push(Math.round(p * 1000) / 1000); }
    return {datos: b, ms: Math.round(n / SR * 1000), picos};
}
function resonador() {
    let y1 = 0, y2 = 0;
    return (x, F, B) => { const r = Math.exp(-Math.PI * B / SR), c = 2 * r * Math.cos(2 * Math.PI * F / SR), d = -r * r; const y = (1 - c - d) * x + c * y1 + d * y2; y2 = y1; y1 = y; return y; };
}
const VOZ_F = {a: [850, 1400, 2800, 3900], e: [520, 2100, 2850, 4000], i: [330, 2600, 3200, 4100], o: [540, 980, 2750, 3800], u: [370, 820, 2650, 3700],
    m: [280, 1250, 2600, 3700], f: [500, 1600, 2700, 3800], s: [450, 1800, 2800, 3900], c: [450, 1700, 2700, 3800], cerrada: [450, 1600, 2700, 3800]};
const AV = {a: 1, e: 0.95, i: 0.85, o: 0.95, u: 0.8, m: 0.35, f: 0, s: 0, c: 0.45, cerrada: 0};
const AF = {f: 0.12, s: 0.32, c: 0.08};

// voz: {f0: [inicio, fin] de cada frase, sube en preguntas; escala de formantes; aire}
function sintetizar(V, {f0i, f0f, sube, escala, aire}) {
    const n = Math.ceil(V.dur / 1000 * SR), x = new Float32Array(n), ev = V.eventos;
    const R = [resonador(), resonador(), resonador(), resonador()], Rs = resonador(), Rf = resonador(), Rn = resonador();
    const F = [450, 1600, 2700, 3800].map((f) => f * escala);
    let av = 0, af = 0, fase = 0, k = 0, lp = 0, lpAnt = 0, prev = 0, jit = 0;
    const kF = 1 - Math.exp(-1 / (0.012 * SR)), kA = 1 - Math.exp(-1 / (0.008 * SR));
    for (let i = 0; i < n; i++) {
        const t = i / SR * 1000;
        while (k + 1 < ev.length && ev[k + 1].t <= t) k++;
        const e = ev[k] && ev[k].t <= t && t < ev[k].t + ev[k].d ? ev[k] : null;
        const v = e ? e.v : "cerrada";
        const rafaga = v === "c" && e && t - e.t < 15 ? 0.25 : 0;
        const obj = (VOZ_F[v] || VOZ_F.cerrada).map((f) => f * escala);
        for (let j = 0; j < 4; j++) F[j] += (obj[j] - F[j]) * kF;
        av += ((AV[v] ?? 0) - av) * kA;
        af += (((AF[v] ?? 0) + rafaga) - af) * kA;
        const L = V.lineas.find((l) => t >= l.t0 && t <= l.t1 + 200) || V.lineas[0];
        const p = Math.min(1, Math.max(0, (t - L.t0) / Math.max(1, L.t1 - L.t0)));
        const pregunta = L.pregunta && t > L.t1 - 700;
        const acento = 1 + 0.06 * Math.sin(2 * Math.PI * t / 560);
        const f0 = (pregunta ? f0f + (f0i - f0f) * 0.4 + sube * ((t - (L.t1 - 700)) / 700) ** 2 : f0i + (f0f - f0i) * p) * acento * (1 + 0.006 * Math.sin(2 * Math.PI * 5.2 * t / 1000)) * (1 + jit);
        fase += f0 / SR;
        let g = 0;
        if (fase >= 1) { fase -= 1; jit = (azar() - 0.5) * 0.012; }
        if (fase < 0.42) g = 0.5 * (1 - Math.cos(Math.PI * fase / 0.42));
        else if (fase < 0.58) g = Math.cos(Math.PI / 2 * (fase - 0.42) / 0.16);
        const dg = g - prev; prev = g;
        let y = (dg * 18 + ruido() * aire * (g > 0.2 ? 1 : 0.4)) * av;
        y = R[0](y, F[0], 70); y = R[1](y, F[1], 95); y = R[2](y, F[2], 140); y = R[3](y, F[3], 220);
        if (v === "m") y = y * 0.6 + Rn(dg * 6 * av, 250 * escala, 60) * 0.5;
        const rr = ruido();
        y += Rs(rr, 6800, 2600) * af * (v === "s" ? 1.8 : 0.4) + Rf(rr, 3200, 4500) * af * (v === "f" ? 1.2 : 0.3);
        lp += 0.8 * (y - lp);
        x[i] = lp + 0.9 * (lp - lpAnt); lpAnt = lp;
    }
    return wav(x);
}
function parque() {            // viento suave en bucle + pajaros que pian de vez en cuando
    const seg = 10, c = SR, n = seg * SR + c, x = new Float32Array(n); let a = 0, b = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, corte = 0.008 + 0.012 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 6.3)); a += corte * (ruido() - a); b += corte * (a - b); x[i] = b * 0.8; }
    for (let k = 0; k < 14; k++) {
        const t0 = 0.3 + azar() * (seg - 1), f0 = 2800 + azar() * 1600, notas = 2 + Math.floor(azar() * 3);
        for (let q = 0; q < notas; q++) {
            const i0 = Math.floor((t0 + q * 0.11) * SR), dur = Math.floor(0.07 * SR);
            let fase = 0;
            for (let i = 0; i < dur && i0 + i < n; i++) { const u = i / dur, f = f0 * (1 + 0.25 * Math.sin(Math.PI * u)); fase += 2 * Math.PI * f / SR; x[i0 + i] += 0.05 * Math.sin(fase) * Math.sin(Math.PI * u) ** 2; }
        }
    }
    return wav(x, c);
}

(async () => {
    const mongoose = require("/home/app/node_modules/mongoose");
    const Proyecto = require("/home/app/modelo/Proyecto");
    const {Sonido} = require("/home/app/modelo/Sonido");
    const {LlaveAutoria, hashLlave, generarLlave} = require("/home/app/modelo/LlaveAutoria");
    await mongoose.connect("mongodb://daniel:12345@db_mongo_docker:27017/framework-videojuego?authSource=admin");
    if (process.argv[2] === "revocar") {
        const r = await LlaveAutoria.deleteMany({nombre: "temporal fase"});
        console.log("llaves borradas:", r.deletedCount);
        return mongoose.disconnect();
    }
    const ciudad = await Proyecto.findOne({nombre: "Ciudad"});
    const nombre = "Fase 5 - Dos personajes conversan";
    let p = await Proyecto.findOne({usuario_id: ciudad.usuario_id, nombre});
    if (!p) {
        p = new Proyecto({nombre, usuario_id: ciudad.usuario_id, descripcion: "Pruebas de capacidad, fase 5 (planeacion_capacidades.md): Ana y Bruno conversan en un banco; bocas con morphing, voces sintetizadas, gestos con IK, inercia, color y cortes de camara."});
        await p.save(); console.log("proyecto creado");
    } else console.log("el proyecto ya existia");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {
        "Voz de Ana": () => sintetizar(JSON.parse(fs.readFileSync("/tmp/voz_ana.json", "utf8")), {f0i: 232, f0f: 192, sube: 80, escala: 1, aire: 0.06}),
        "Voz de Bruno": () => sintetizar(JSON.parse(fs.readFileSync("/tmp/voz_bruno.json", "utf8")), {f0i: 128, f0f: 102, sube: 45, escala: 0.84, aire: 0.04}),
        "Parque al atardecer": parque,
    };
    for (const nom of Object.keys(GEN)) {
        const viejo = await Sonido.findOne({id_proyecto: String(p._id), nombre: nom});
        if (viejo) { console.log("ya existe:", nom); continue; }
        const w = GEN[nom]();
        const so = new Sonido({id_proyecto: String(p._id), nombre: nom, nota: "sintetizado (provisorio)", duracion_ms: w.ms, picos: w.picos});
        const ruta = `${carpeta}/${so._id}.wav`;
        fs.writeFileSync(ruta, w.datos);
        Object.assign(so, {archivo: {ruta, tipo: "audio/wav", tamano: w.datos.length, original: nom + ".wav"}, estado: "listo", revision: 1});
        await so.save();
        console.log("sonido:", nom, w.ms, "ms");
    }
    const k = generarLlave();
    await LlaveAutoria.create({id_proyecto: String(p._id), nombre: "temporal fase", prefijo: k.slice(0, 10), hash: hashLlave(k)});
    fs.writeFileSync("/tmp/llave", k, {mode: 0o600});
    await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
