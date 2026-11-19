// Fase 9: crea el proyecto "Fase 9 - Pesca en el mar", sintetiza sus sonidos y deja una llave
// temporal en /tmp/llave (600). Se corre en backend_container:  node /tmp/sonidos_backend.js | ... revocar
//   - Mar: olas que rompen suave y vuelven (bucle) + agua contra el bote
//   - Gaviotas: graznidos; Carrete: tic-tic que se acelera; Chapuzon; Salpicadura
const fs = require("node:fs");
const SR = 22050;
let s = 12;
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
function mar() {
    const seg = 9.6, cr = SR, n = Math.round(seg * SR) + cr, x = new Float32Array(n); let a = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR, ola = Math.pow(0.5 + 0.5 * Math.sin(2 * Math.PI * t / 3.2 - 1.2), 3);
        const corte = 0.02 + 0.08 * ola;
        a += corte * (ruido() - a); b += corte * (a - b); c += 0.004 * (ruido() - c);
        x[i] = b * (0.25 + 0.9 * ola) + c * 2;
    }
    for (let k = 0; k < 30; k++) {                  // golpecitos de agua contra el casco
        const i0 = Math.floor(azar() * (n - 3000)); let lp = 0;
        for (let i = 0; i < 2200; i++) { lp += 0.15 * (ruido() - lp); x[i0 + i] += 0.25 * lp * Math.sin(Math.PI * i / 2200); }
    }
    return wav(x, cr);
}
function gaviotas() {
    const x = buf(4);
    for (const [t0, f0] of [[0.1, 1500], [0.55, 1700], [0.95, 1450], [2.4, 1600], [2.75, 1800]]) {
        const i0 = Math.floor(t0 * SR), dur = Math.floor(0.32 * SR); let fase = 0;
        for (let i = 0; i < dur; i++) {
            const u = i / dur, f = f0 * (1 + 0.35 * Math.sin(Math.PI * u) - 0.25 * u);
            fase += 2 * Math.PI * f / SR;
            const v = Math.sin(fase) + 0.5 * Math.sin(2 * fase) + 0.25 * Math.sin(3 * fase);
            x[i0 + i] += 0.3 * v * Math.sin(Math.PI * u) ** 0.7 * (0.8 + 0.2 * ruido());
        }
    }
    return wav(x);
}
function carrete() {                                // tic-tic de la manivela, primero rapido y despues lento
    const x = buf(2.6); let t = 0.05, paso = 0.035;
    while (t < 2.5) {
        const i0 = Math.floor(t * SR);
        for (let i = 0; i < 260 && i0 + i < x.length; i++) x[i0 + i] += (ruido() * 0.6 + Math.sin(2 * Math.PI * 3200 * i / SR) * 0.4) * Math.exp(-i / 40);
        t += paso; paso *= 1.03;
    }
    return wav(x);
}
function chapuzon() {                               // "plop": golpe grave con burbuja que sube
    const x = buf(1.2); let lp = 0;
    for (let i = 0; i < x.length; i++) {
        const t = i / SR;
        lp += 0.2 * (ruido() - lp);
        x[i] = lp * Math.exp(-t / 0.08) * 1.2 + Math.sin(2 * Math.PI * (180 + 900 * t) * t) * Math.exp(-t / 0.12) * 0.8;
    }
    return wav(x);
}
function salpicadura() {                            // agua que se rompe y gotas que caen
    const x = buf(1.6); let lp = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR; lp += 0.5 * (ruido() - lp); x[i] = lp * Math.min(1, t / 0.01) * Math.exp(-t / 0.25); }
    for (let k = 0; k < 40; k++) { const i0 = Math.floor((0.15 + azar() * 1.2) * SR), f = 1200 + azar() * 2500; for (let i = 0; i < 500 && i0 + i < x.length; i++) x[i0 + i] += 0.2 * Math.sin(2 * Math.PI * f * (1 + i / 900) * i / SR) * Math.exp(-i / 90); }
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
    const nombre = "Fase 9 - Pesca en el mar";
    let p = await Proyecto.findOne({usuario_id: ciudad.usuario_id, nombre});
    if (!p) {
        p = new Proyecto({nombre, usuario_id: ciudad.usuario_id, descripcion: "Pruebas de capacidad, fase 9 (planeacion_capacidades.md): un hombre pesca desde un bote; olas, balanceo, cana que se curva, sedal y un pez que salta."});
        await p.save(); console.log("proyecto creado");
    } else console.log("el proyecto ya existia");
    const carpeta = `/home/app/storage/usuarios/${p.usuario_id}/proyectos/${p._id}/sonidos`;
    fs.mkdirSync(carpeta, {recursive: true});
    const GEN = {"Mar": mar, "Gaviotas": gaviotas, "Carrete": carrete, "Chapuzón": chapuzon, "Salpicadura": salpicadura};
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
