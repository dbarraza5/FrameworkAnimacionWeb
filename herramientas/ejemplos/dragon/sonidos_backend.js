// Fase 8: crea el proyecto "Fase 8 - Dragón", sintetiza sus sonidos y deja una llave temporal en
// /tmp/llave (600). Se corre en backend_container:  node /tmp/sonidos_backend.js  |  ... revocar
//   - Aleteo: 4 golpes de ala cada 720 ms (el periodo del aleteo de la escena), en bucle
//   - Rugido: voz grave con formantes que se abren, aspera (ruido modulado)
//   - Llamarada: soplido de fuego de 3 s; Fuego crepitando (bucle); Viento de montana (bucle)
const fs = require("node:fs");
const SR = 22050;
let s = 99;
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
function resonador() { let y1 = 0, y2 = 0; return (x, F, B) => { const r = Math.exp(-Math.PI * B / SR), c = 2 * r * Math.cos(2 * Math.PI * F / SR), d = -r * r; const y = (1 - c - d) * x + c * y1 + d * y2; y2 = y1; y1 = y; return y; }; }

function aleteo() {                                // golpe de tela grave + silbido, 4 por vuelta
    const periodo = 0.72, n = Math.round(4 * periodo * SR), x = new Float32Array(n);
    for (let k = 0; k < 4; k++) {
        const i0 = Math.round((k * periodo + 0.32) * SR); let a = 0, b = 0;   // golpe a mitad de la bajada
        for (let i = 0; i < 0.4 * SR; i++) {
            const t = i / SR, env = Math.min(1, t / 0.06) * Math.exp(-t / 0.09);
            a += 0.06 * (ruido() - a); b += 0.06 * (a - b);
            x[(i0 + i) % n] += env * (b * 8 + 0.4 * Math.sin(2 * Math.PI * (70 - 40 * t) * t));
        }
    }
    return wav(x);
}
function rugido() {
    const seg = 2.4, n = Math.round(seg * SR), x = new Float32Array(n);
    const R = [resonador(), resonador(), resonador()]; let fase = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR, u = t / seg;
        const f0 = 70 + 40 * Math.sin(Math.PI * Math.min(1, u * 1.6)) - 20 * u;
        fase += f0 / SR; if (fase >= 1) fase -= 1;
        const pulso = fase < 0.5 ? 1 : -0.6;
        const aspero = 0.6 + 0.4 * Math.sin(2 * Math.PI * 31 * t) * (1 + 0.3 * ruido());
        let y = (pulso * 0.6 + ruido() * 0.5) * aspero;
        const ab = Math.sin(Math.PI * Math.min(1, u * 1.3));
        y = R[0](y, 300 + 400 * ab, 140) * 1.2 + R[1](y, 900 + 500 * ab, 220) * 0.7 + R[2](y, 2200, 400) * 0.3;
        x[i] = y * Math.min(1, t / 0.12) * Math.min(1, (seg - t) / 0.6);
    }
    return wav(x);
}
function llamarada() {                             // soplido rugiente: ruido grave + medio, con turbulencia
    const seg = 3.4, n = Math.round(seg * SR), x = new Float32Array(n); let a = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        a += 0.04 * (ruido() - a); b += 0.04 * (a - b); c += 0.3 * (ruido() - c);
        const tur = 0.7 + 0.3 * Math.sin(2 * Math.PI * 9 * t + 2 * Math.sin(2 * Math.PI * 1.3 * t));
        x[i] = (b * 9 + c * 0.25) * tur * Math.min(1, t / 0.15) * Math.min(1, (seg - t) / 0.4);
    }
    return wav(x);
}
function crepitar() {
    const seg = 6, cr = Math.floor(0.5 * SR), n = seg * SR + cr, x = new Float32Array(n); let lp = 0;
    for (let i = 0; i < n; i++) { lp += 0.02 * (ruido() - lp); x[i] = lp * 1.5; }
    for (let k = 0; k < 260; k++) { const i0 = Math.floor(azar() * (n - 400)), a = 0.2 + azar() * 0.8, l = 40 + Math.floor(azar() * 200); for (let i = 0; i < l; i++) x[i0 + i] += a * ruido() * Math.exp(-i / (l / 4)); }
    return wav(x, cr);
}
function viento() {
    const seg = 8, cr = SR, n = seg * SR + cr, x = new Float32Array(n); let a = 0, b = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, corte = 0.01 + 0.03 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 5.3)); a += corte * (ruido() - a); b += corte * (a - b); x[i] = b * (0.6 + 0.4 * Math.sin(2 * Math.PI * t / 3.7 + 1)); }
    return wav(x, cr);
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
    const nombre = "Fase 8 - Dragón";
    let p = await Proyecto.findOne({usuario_id: ciudad.usuario_id, nombre});
    if (!p) {
        p = new Proyecto({nombre, usuario_id: ciudad.usuario_id, descripcion: "Pruebas de capacidad, fase 8 (planeacion_capacidades.md): un dragon con alas articuladas (morphing), cuello con IK y cola con inercia le echa fuego a una torre."});
        await p.save(); console.log("proyecto creado");
    } else console.log("el proyecto ya existia");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {"Aleteo": aleteo, "Rugido": rugido, "Llamarada": llamarada, "Fuego crepitando": crepitar, "Viento de montaña": viento};
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
