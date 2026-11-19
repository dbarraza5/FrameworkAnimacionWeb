// Fase 7: crea el proyecto "Fase 7 - Demolición", sintetiza sus sonidos y deja una llave temporal
// en /tmp/llave (600). Se corre en backend_container:
//   node /tmp/sonidos_backend.js   |   node /tmp/sonidos_backend.js revocar
//   - Cargas: 8 estallidos secos cada 70 ms (como en la escena)
//   - Derrumbe: estruendo grave largo (lo dispara "al_soltarse" de la torre)
//   - Escombros: golpe corto de piedra y crujido (lo dispara "al_tocar_suelo", hasta 10 veces)
//   - Ciudad lejana: rumor de trafico en bucle
const fs = require("node:fs");
const SR = 22050;
let s = 77;
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
const buf = (seg) => new Float32Array(Math.floor(seg * SR));
function estallido(x, t0, fuerza) {                 // golpe seco: ruido brillante + golpe grave
    const i0 = Math.floor(t0 * SR); let lp = 0;
    for (let i = 0; i < 0.5 * SR && i0 + i < x.length; i++) {
        const t = i / SR;
        lp += 0.25 * (ruido() - lp);
        x[i0 + i] += fuerza * (ruido() * Math.exp(-t / 0.02) * 0.8 + lp * Math.exp(-t / 0.12) * 1.5 + Math.sin(2 * Math.PI * (60 - 30 * t) * t) * Math.exp(-t / 0.15));
    }
}
function cargas() { const x = buf(2.2); for (let k = 0; k < 8; k++) estallido(x, 0.02 + k * 0.07, 0.7 + azar() * 0.3); return wav(x); }
function derrumbe() {                              // estruendo grave que crece, rueda y se apaga, con crujidos
    const seg = 7, x = buf(seg); let a = 0, b = 0, c = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR;
        a += 0.02 * (ruido() - a); b += 0.02 * (a - b); c += 0.08 * (ruido() - c);
        const env = Math.min(1, t / 0.6) * Math.exp(-Math.max(0, t - 1.6) * 0.75);
        x[i] = env * (b * 10 + c * 0.35 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3.3 * t)));
    }
    for (let k = 0; k < 40; k++) estallido(x, 0.3 + azar() * 3.5, 0.15 + azar() * 0.25);
    return wav(x);
}
function escombros() {                             // piedra que golpea y se desmorona
    const x = buf(0.9);
    estallido(x, 0.0, 1);
    for (let k = 0; k < 9; k++) { const i0 = Math.floor((0.05 + azar() * 0.5) * SR); for (let i = 0; i < 300; i++) x[i0 + i] += 0.3 * ruido() * Math.exp(-i / 60); }
    return wav(x);
}
function ciudad() {                                // rumor de trafico lejano + bocina ocasional
    const seg = 10, cr = SR, n = seg * SR + cr, x = new Float32Array(n); let a = 0, b = 0;
    for (let i = 0; i < n; i++) { const t = i / SR; a += 0.01 * (ruido() - a); b += 0.01 * (a - b); x[i] = b * 3 * (0.8 + 0.2 * Math.sin(2 * Math.PI * t / 4.1)); }
    for (const t0 of [2.3, 7.1]) { const i0 = Math.floor(t0 * SR); for (let i = 0; i < 0.35 * SR; i++) { const t = i / SR; x[i0 + i] += 0.04 * Math.sign(Math.sin(2 * Math.PI * 420 * t)) * Math.min(1, t / 0.02) * Math.min(1, (0.35 - t) / 0.05); } }
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
    const ciudadP = await Proyecto.findOne({nombre: "Ciudad"});
    const nombre = "Fase 7 - Demolición";
    let p = await Proyecto.findOne({usuario_id: ciudadP.usuario_id, nombre});
    if (!p) {
        p = new Proyecto({nombre, usuario_id: ciudadP.usuario_id, descripcion: "Pruebas de capacidad, fase 7 (planeacion_capacidades.md): demolicion controlada de una torre; cargas, colapso en cadena con la fisica de piezas, polvo, temblor y sonidos."});
        await p.save(); console.log("proyecto creado");
    } else console.log("el proyecto ya existia");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {"Cargas": cargas, "Derrumbe": derrumbe, "Escombros": escombros, "Ciudad lejana": ciudad};
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
