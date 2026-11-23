// "El zorro y el cuervo" (planeacion_zorro_cuervo.md, fase 4): sintetiza los sonidos del proyecto
// y deja una llave temporal en /tmp/llave (600). Se corre en backend_container:
//   node /tmp/sonidos_backend.js            (crea los que falten)
//   node /tmp/sonidos_backend.js revocar     (borra la llave temporal)
// Bosque (ambiente en bucle), Pasos, Olfateo, Graznido, Salto, Mordida, Pop, Melodía, Melodía final.
const fs = require("node:fs");
const SR = 22050;
let s = 7;
const azar = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const ruido = () => azar() * 2 - 1;
const TAU = Math.PI * 2;
function wav(x, cruce = 0, pico = 0.85) {
    let n = x.length;
    if (cruce) { n -= cruce; for (let i = 0; i < cruce; i++) { const k = i / cruce; x[i] = x[i] * k + x[n + i] * (1 - k); } }
    let m = 1e-9; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(x[i]));
    const b = Buffer.alloc(44 + n * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(x[i] / m * pico * 32767), 44 + i * 2);
    const picos = [];
    for (let j = 0; j < 200; j++) { let p = 0; for (let i = Math.floor(j * n / 200); i < (j + 1) * n / 200; i++) p = Math.max(p, Math.abs(x[i] / m)); picos.push(Math.round(p * 1000) / 1000); }
    return {datos: b, ms: Math.round(n / SR * 1000), picos};
}
const buf = (seg) => new Float32Array(Math.floor(seg * SR));
// filtro pasabanda de dos polos (resonador)
function resonador(f, q) {
    const w = TAU * f / SR, r = Math.exp(-w / (2 * q)), a1 = -2 * r * Math.cos(w), a2 = r * r;
    let y1 = 0, y2 = 0;
    return (x) => { const y = (1 - r) * x - a1 * y1 - a2 * y2; y2 = y1; y1 = y; return y; };
}
// trino de pajarito: barridos rapidos y agudos
function trino(x, t0, f0, notas, vol) {
    for (let k = 0; k < notas; k++) {
        const i0 = Math.floor((t0 + k * 0.09) * SR), dur = Math.floor((0.05 + 0.03 * azar()) * SR), f1 = f0 * (0.9 + 0.3 * azar());
        let fase = 0;
        for (let i = 0; i < dur && i0 + i < x.length; i++) {
            const u = i / dur, f = f1 * (1 + 0.5 * Math.sin(Math.PI * u)) ;
            fase += TAU * f / SR;
            x[i0 + i] += vol * Math.sin(fase) * Math.sin(Math.PI * u);
        }
    }
}

function bosque() {                                  // viento suave + pajaritos lejanos; 12 s en bucle
    const seg = 12, cr = SR, x = new Float32Array(Math.round(seg * SR) + cr);
    let a = 0, b = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR, rafaga = 0.5 + 0.5 * Math.sin(TAU * t / 6.5) * Math.sin(TAU * t / 2.9 + 1);
        a += 0.012 * (ruido() - a); b += 0.02 * (a - b);
        x[i] = b * (0.5 + 0.8 * rafaga) * 3;
    }
    for (let k = 0; k < 14; k++) trino(x, azar() * (seg - 1), 2800 + azar() * 2200, 2 + Math.floor(azar() * 5), 0.05 + azar() * 0.05);
    return wav(x, cr, 0.6);
}
function pasos() {                                   // patas sobre el pasto: un paso cada 200 ms (trote), 8 s
    const x = buf(8);
    for (let t = 0.02, k = 0; t < 7.9; t += 0.2, k++) {
        const i0 = Math.floor(t * SR), dur = Math.floor(0.07 * SR), v = k % 2 ? 0.7 : 1; let lp = 0, hp = 0;
        for (let i = 0; i < dur; i++) {
            const u = i / dur, n = ruido();
            lp += 0.08 * (n - lp); hp = n - lp;
            x[i0 + i] += v * (lp * 2.2 + hp * 0.25 * (1 - u)) * Math.min(1, u * 12) * Math.exp(-u * 5);
        }
    }
    return wav(x, 0, 0.5);
}
function olfateo() {                                 // tres inspiraciones cortas por la nariz, dos veces
    const x = buf(1.7), bp = resonador(3800, 2.5);
    for (const t0 of [0.05, 0.22, 0.39, 0.95, 1.12, 1.29]) {
        const i0 = Math.floor(t0 * SR), dur = Math.floor(0.11 * SR);
        for (let i = 0; i < dur; i++) { const u = i / dur; x[i0 + i] += bp(ruido()) * Math.sin(Math.PI * u) ** 1.5 * (0.7 + 0.6 * u); }
    }
    return wav(x, 0, 0.55);
}
function graznido() {                                // "¡CRAAA!": voz aspera con formantes y aspereza
    const x = buf(1.15), f1 = resonador(1100, 6), f2 = resonador(1900, 7), f3 = resonador(2900, 8);
    let fase = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR, dur = 0.95, u = Math.min(1, t / dur);
        const f0 = 430 * (1 + 0.12 * Math.sin(Math.PI * u) - 0.18 * u) * (1 + 0.04 * ruido());
        fase += TAU * f0 / SR;
        let fuente = 0; for (let h = 1; h <= 12; h++) fuente += Math.sin(h * fase) / h;     // diente de sierra
        fuente = fuente * (0.75 + 0.25 * Math.sin(TAU * 38 * t)) + ruido() * 0.35;      // aspereza
        const env = Math.min(1, t / 0.03) * (t < dur ? 1 - 0.3 * u : Math.max(0, 1 - (t - dur) / 0.12));
        x[i] = (f1(fuente) * 1.0 + f2(fuente) * 0.8 + f3(fuente) * 0.45) * env;
    }
    return wav(x, 0, 0.9);
}
function salto() {                                   // impulso + "fuuu" que sube
    const x = buf(0.55), bp = resonador(900, 1.8); let lp = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR, u = t / 0.55;
        lp += 0.3 * (ruido() - lp);
        x[i] = bp(ruido()) * Math.sin(Math.PI * u) * 0.9 + (t < 0.06 ? lp * (1 - t / 0.06) * 1.4 : 0);
    }
    return wav(x, 0, 0.6);
}
function mordida() {                                 // "ñam": clic de los dientes + golpe sordo
    const x = buf(0.4); let lp = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR;
        lp += 0.12 * (ruido() - lp);
        x[i] = (ruido() * Math.exp(-t / 0.004)) * 0.8 + lp * Math.exp(-t / 0.05) * 2 + Math.sin(TAU * 140 * t) * Math.exp(-t / 0.06) * 0.6;
    }
    return wav(x, 0, 0.75);
}
function pop() {                                     // aparece un globo: "pop" suave
    const x = buf(0.14);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = Math.sin(TAU * (950 - 3200 * t) * t) * Math.exp(-t / 0.03); }
    return wav(x, 0, 0.45);
}
// cuerda pulsada (Karplus-Strong)
function pulsar(x, t0, f, dur, vol) {
    const n = Math.max(2, Math.round(SR / f)), linea = Float32Array.from({length: n}, () => ruido());
    const i0 = Math.floor(t0 * SR), total = Math.floor(dur * SR);
    for (let i = 0, j = 0; i < total && i0 + i < x.length; i++) {
        const a = linea[j], b = linea[(j + 1) % n];
        linea[j] = 0.497 * (a + b);
        x[i0 + i] += vol * a * Math.min(1, (total - i) / (0.05 * SR));
        j = (j + 1) % n;
    }
}
const NOTA = (n) => 261.63 * Math.pow(2, n / 12);   // 0 = do
function melodia(final) {                            // tonada alegre de pentatonica (do mayor)
    const x = buf(final ? 6.5 : 8), negra = 0.3;
    const tema = final
        ? [[0, 7], [1, 9], [2, 12], [3, 9], [4, 7], [5, 4], [6, 2], [7, 4], [8, 0], [8, 7], [8, 12]]
        : [[0, 0], [1, 4], [2, 7], [3, 9], [4, 7], [5, 4], [6, 7], [8, 9], [9, 12], [10, 9], [11, 7], [12, 4], [13, 2], [14, 4], [16, 0], [16, 7]];
    for (const [b, n] of tema) pulsar(x, 0.1 + b * negra, NOTA(n), final && b === 8 ? 3 : 1.4, 0.5);
    const bajos = final ? [[0, -12], [4, -17], [8, -12]] : [[0, -12], [4, -17], [8, -15], [12, -17], [16, -12]];
    for (const [b, n] of bajos) pulsar(x, 0.1 + b * negra, NOTA(n), final && b === 8 ? 3 : 1.6, 0.4);
    return wav(x, 0, 0.7);
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
    const p = await Proyecto.findOne({usuario_id: ciudad.usuario_id, nombre: "El zorro y el cuervo"});
    if (!p) throw new Error("no existe el proyecto El zorro y el cuervo");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {"Bosque": bosque, "Pasos": pasos, "Olfateo": olfateo, "Graznido": graznido, "Salto": salto, "Mordida": mordida,
        "Pop": pop, "Melodía": () => melodia(false), "Melodía final": () => melodia(true)};
    for (const nom of Object.keys(GEN)) {
        if (await Sonido.findOne({id_proyecto: String(p._id), nombre: nom})) { console.log("ya existe:", nom); continue; }
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
