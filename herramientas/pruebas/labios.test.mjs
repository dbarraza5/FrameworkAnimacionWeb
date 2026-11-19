// Pruebas de herramientas/labios.mjs (sincronia de labios desde un audio). Sin base de datos.
// Sintetiza una voz con vocales conocidas (resonadores en cascada, como un sintetizador de
// formantes clasico) y comprueba que la herramienta reconoce cuando hay voz y que vocal suena.
import {test} from "node:test";
import assert from "node:assert/strict";
import {analizar, tramos, clavesForma, leerWav} from "../labios.mjs";

const SR = 16000;
const FORM = {a: [750, 1250, 2600], e: [480, 1850, 2650], i: [300, 2250, 3000], o: [480, 850, 2500], u: [330, 750, 2400]};

function resonador(F, B) {           // 2 polos con ganancia 1 en continua
    const r = Math.exp(-Math.PI * B / SR), c = 2 * r * Math.cos(2 * Math.PI * F / SR), d = -r * r, g = 1 - c - d;
    let y1 = 0, y2 = 0;
    return (x) => { const y = g * x + c * y1 + d * y2; y2 = y1; y1 = y; return y; };
}

// secuencia [[vocal | null (silencio), ms]...] -> muestras; f0 distinto por voz
function voz(secuencia, f0 = 200) {
    const total = secuencia.reduce((s, [, ms]) => s + ms, 0), x = new Float32Array(Math.round(total / 1000 * SR));
    let i = 0, fase = 0;
    for (const [v, ms] of secuencia) {
        const n = Math.round(ms / 1000 * SR);
        const [F1, F2, F3] = FORM[v] || FORM.a, R = [resonador(F1, 80), resonador(F2, 100), resonador(F3, 150)];
        for (let k = 0; k < n; k++, i++) {
            fase += f0 * (1 + 0.03 * Math.sin(i / SR * 2 * Math.PI * 4)) / SR;
            let s = 0;
            if (fase >= 1) { fase -= 1; s = 1; }                       // tren de pulsos (rico en armonicos)
            const env = Math.min(1, k / 160, (n - k) / 160);
            let y = v ? s * env : 0;
            for (const r of R) y = r(y);
            x[i] = y * 3;
        }
    }
    return x;
}

const SEC = [[null, 300], ["a", 300], [null, 150], ["e", 300], [null, 150], ["i", 300], [null, 150], ["o", 300], [null, 150], ["u", 300], [null, 300]];

function acierto(x, sec) {
    const ts = [];
    let t = 0;
    for (const [v, ms] of sec) { ts.push({t0: t, t1: t + ms, v: v || "cerrada"}); t += ms; }
    const lista = tramos(analizar(x, SR));
    const en = (q) => (lista.find((l) => q >= l.t && q < l.t + l.d) || {v: "cerrada"}).v;
    const r = {};
    for (const s of ts) {
        let ok = 0, n = 0;
        for (let q = s.t0 + 70; q < s.t1 - 70; q += 20) { n++; if (en(q) === s.v) ok++; }
        r[s.v] = (r[s.v] || []).concat([ok / Math.max(1, n)]);
    }
    return {r, lista};
}

for (const f0 of [100, 120, 160, 210, 260]) {
    test(`labios: reconoce silencio y las 5 vocales (voz de ${f0} Hz)`, () => {
        const {r, lista} = acierto(voz(SEC, f0), SEC);
        const resumen = Object.fromEntries(Object.entries(r).map(([k, l]) => [k, Math.round(l.reduce((a, b) => a + b, 0) / l.length * 100)]));
        for (const v of ["cerrada", "a", "e", "i", "o", "u"]) assert.ok(resumen[v] >= 60, `vocal ${v}: ${resumen[v]}% (todo: ${JSON.stringify(resumen)}; tramos: ${lista.map((l) => l.v).join(" ")})`);
    });
}

test("labios: claves de forma con nombres propios y desfase", () => {
    const c = clavesForma([{t: 0, v: "cerrada", d: 200}, {t: 200, v: "a", d: 300}], {a: "abierta"}, 1000);
    assert.deepEqual(c, [[1000, "", "suave"], [1260, "abierta", "suave"]]);
});

test("labios: lee WAV de 16 bits estereo", () => {
    const n = 100, b = Buffer.alloc(44 + n * 4);
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 4, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
    b.write("data", 36); b.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) { b.writeInt16LE(16384, 44 + i * 4); b.writeInt16LE(0, 46 + i * 4); }
    const {x, sr} = leerWav(b);
    assert.equal(sr, 8000);
    assert.equal(x.length, n);
    assert.ok(Math.abs(x[0] - 0.25) < 1e-6);
});
