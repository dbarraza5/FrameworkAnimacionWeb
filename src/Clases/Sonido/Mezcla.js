// Mezcla del sonido de una escena SIN tiempo real (planeacion_sonido.md, S-D8): mismo
// resultado siempre, para exportar (MP4 con audio, audio.wav en la secuencia PNG).
// Usa los mismos tramos y envolventes que la reproduccion del editor (MotorAudio.js).
/* global OfflineAudioContext */
import {tramos, envolvente} from "./MotorAudio";

// clips: de motor.clipsAudio(); buffer(id) -> Promise<AudioBuffer|null>; desde/hasta en ms
export async function mezclar(clips, buffer, desde, hasta, {muestreo = 48000, canales = 2} = {}) {
    const largo = Math.max(1, Math.round((hasta - desde) / 1000 * muestreo));
    const ctx = new OfflineAudioContext(canales, largo, muestreo);
    let usados = 0;
    for (const c of clips) {
        if (c.t >= hasta) continue;
        const buf = await buffer(c.sonido);
        if (!buf) continue;
        for (const p of tramos(c, buf.duration * 1000, desde)) {
            if (p.inicio >= hasta) continue;
            const cuando = (p.inicio - desde) / 1000;
            const f = ctx.createBufferSource();
            f.buffer = buf;
            const g = ctx.createGain();
            envolvente(g.gain, c, p, cuando);
            f.connect(g);
            let ultimo = g;
            if (c.pan && ctx.createStereoPanner) {
                const pan = ctx.createStereoPanner();
                pan.pan.value = c.pan;
                g.connect(pan);
                ultimo = pan;
            }
            ultimo.connect(ctx.destination);
            f.start(cuando, p.desde / 1000, p.largo / 1000);
            usados++;
        }
    }
    const audio = await ctx.startRendering();
    return {audio, usados};
}

// AudioBuffer -> WAV PCM de 16 bits
export function wav(audio) {
    const n = audio.length, ch = audio.numberOfChannels, sr = audio.sampleRate;
    const datos = n * ch * 2;
    const b = new DataView(new ArrayBuffer(44 + datos));
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
    txt(0, "RIFF"); b.setUint32(4, 36 + datos, true); txt(8, "WAVE");
    txt(12, "fmt "); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, ch, true);
    b.setUint32(24, sr, true); b.setUint32(28, sr * ch * 2, true); b.setUint16(32, ch * 2, true); b.setUint16(34, 16, true);
    txt(36, "data"); b.setUint32(40, datos, true);
    const canales = [...Array(ch)].map((_, k) => audio.getChannelData(k));
    let o = 44;
    for (let i = 0; i < n; i++) {
        for (let k = 0; k < ch; k++) {
            const v = Math.max(-1, Math.min(1, canales[k][i]));
            b.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
            o += 2;
        }
    }
    return new Uint8Array(b.buffer);
}

// Duracion y forma de onda de un archivo de audio (al subirlo): {duracion_ms, picos: [0..1] x n}
export async function analizar(arrayBuffer, n = 200) {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const audio = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const d = audio.getChannelData(0), paso = Math.max(1, Math.floor(d.length / n));
    const picos = [];
    for (let i = 0; i < n && i * paso < d.length; i++) {
        let m = 0;
        for (let j = i * paso; j < Math.min(d.length, (i + 1) * paso); j += 4) m = Math.max(m, Math.abs(d[j]));
        picos.push(Math.round(m * 100) / 100);
    }
    return {duracion_ms: Math.round(audio.duration * 1000), picos};
}
