// Fase 6: crea el proyecto "Fase 6 - Plano de cine con lluvia", sintetiza sus sonidos (lluvia en
// bucle, trueno cercano y trueno lejano) y deja una llave temporal en /tmp/llave (600).
// Se corre en backend_container:  node /tmp/sonidos_backend.js   |   node /tmp/sonidos_backend.js revocar
const fs = require("node:fs");
const SR = 22050;
let s = 41;
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
// lluvia: ruido rosado filtrado (cortina) + miles de gotitas cortas + algunas gotas grandes
function lluvia() {
    const seg = 8, c = SR, n = seg * SR + c, x = new Float32Array(n);
    let b0 = 0, b1 = 0, b2 = 0, hp = 0, prev = 0;
    for (let i = 0; i < n; i++) {
        const w = ruido();
        b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
        const rosa = b0 + b1 + b2 + w * 0.1848;
        hp = 0.97 * (hp + rosa - prev); prev = rosa;
        x[i] = hp * 0.12 * (0.85 + 0.15 * Math.sin(2 * Math.PI * i / SR / 3.1));
    }
    for (let k = 0; k < seg * 900; k++) {
        const i0 = Math.floor(azar() * (n - 300)), a = 0.04 + azar() * 0.1, f = 2500 + azar() * 4000, L = 60 + Math.floor(azar() * 140);
        for (let i = 0; i < L; i++) x[i0 + i] += a * Math.sin(2 * Math.PI * f * i / SR) * Math.exp(-i / (L / 4));
    }
    for (let k = 0; k < seg * 6; k++) {
        const i0 = Math.floor(azar() * (n - 2000)), f = 600 + azar() * 600;
        for (let i = 0; i < 1600; i++) x[i0 + i] += 0.25 * Math.sin(2 * Math.PI * f * (1 + i / 3000) * i / SR) * Math.exp(-i / 300);
    }
    return wav(x, c);
}
// trueno: chasquido (solo el cercano) + estruendo grave que rueda y se apaga
function trueno(cercano) {
    const seg = cercano ? 6 : 7, n = seg * SR, x = new Float32Array(n);
    let a = 0, b = 0, c2 = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const corte = cercano ? 0.03 + 0.05 * Math.exp(-t * 1.5) : 0.012;
        a += corte * (ruido() - a); b += corte * (a - b); c2 += 0.5 * corte * (b - c2);
        const env = (cercano ? Math.min(1, t / 0.05) : Math.min(1, t / 0.8)) * Math.exp(-t * (cercano ? 0.55 : 0.45)) *
            (0.6 + 0.4 * Math.abs(Math.sin(2 * Math.PI * t * 0.7 + Math.sin(t * 3))));
        x[i] = (c2 * 9 + b * 2) * env;
    }
    if (cercano) for (let i = 0; i < 0.25 * SR; i++) { const t = i / SR; x[i] += ruido() * 1.4 * Math.exp(-t / 0.035) + ruido() * 0.5 * Math.exp(-(((t - 0.12) / 0.03) ** 2)); }
    return wav(x);
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
    const nombre = "Fase 6 - Plano de cine con lluvia";
    let p = await Proyecto.findOne({usuario_id: ciudad.usuario_id, nombre});
    if (!p) {
        p = new Proyecto({nombre, usuario_id: ciudad.usuario_id, descripcion: "Pruebas de capacidad, fase 6 (planeacion_capacidades.md): plano largo de noche con lluvia, relampagos, charcos, profundidad de campo y camara en grua."});
        await p.save(); console.log("proyecto creado");
    } else console.log("el proyecto ya existia");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {"Lluvia": lluvia, "Trueno": () => trueno(true), "Trueno lejano": () => trueno(false)};
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
