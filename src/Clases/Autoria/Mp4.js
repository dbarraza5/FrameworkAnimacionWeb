// MP4 (H.264) en el navegador, cuadro a cuadro (Fase A7): WebCodecs (el codificador de
// video del propio navegador) + mp4-muxer (empaqueta los cuadros en el archivo .mp4).
//   const v = await Mp4.crear(w, h, fps);  for (...) await v.cuadro(canvas);  const blob = await v.terminar();
/* global VideoEncoder, VideoFrame */
import {Muxer, ArrayBufferTarget} from "mp4-muxer";

// H.264 pide ancho y alto pares
export const par = (n) => Math.max(2, Math.floor(n / 2) * 2);

export const mp4Disponible = () => typeof window !== "undefined" && "VideoEncoder" in window && "VideoFrame" in window;

// Perfiles de menor a mayor nivel: se usa el primero que el navegador acepta para ese tamano
const CODECS = ["avc1.42001f", "avc1.4d0028", "avc1.640028", "avc1.640033"];

export class Mp4 {
    static async crear(w, h, fps, {bitrate} = {}) {
        if (!mp4Disponible()) throw new Error("este navegador no puede codificar video (falta WebCodecs); usa Chrome o Edge");
        if (w % 2 || h % 2) throw new Error("ancho y alto deben ser pares");
        const tasa = bitrate || Math.round(w * h * fps * 0.15);     // ~2,5 Mbit/s a 640x360x30
        let config = null;
        for (const codec of CODECS) {
            const c = {codec, width: w, height: h, bitrate: tasa, framerate: fps};
            const s = await VideoEncoder.isConfigSupported(c).catch(() => null);
            if (s && s.supported) { config = c; break; }
        }
        if (!config) throw new Error(`el navegador no codifica H.264 a ${w}×${h}`);
        return new Mp4(w, h, fps, config);
    }

    constructor(w, h, fps, config) {
        this.fps = fps;
        this.n = 0;
        this.error = null;
        this.muxer = new Muxer({target: new ArrayBufferTarget(), video: {codec: "avc", width: w, height: h, frameRate: fps},
            fastStart: "in-memory"});
        this.enc = new VideoEncoder({
            output: (chunk, meta) => this.muxer.addVideoChunk(chunk, meta),
            error: (e) => { this.error = e; },
        });
        this.enc.configure(config);
    }

    // agrega el contenido actual del canvas como el siguiente cuadro
    async cuadro(canvas) {
        if (this.error) throw this.error;
        const dur = 1e6 / this.fps;
        const frame = new VideoFrame(canvas, {timestamp: Math.round(this.n * dur), duration: Math.round(dur)});
        this.enc.encode(frame, {keyFrame: this.n % (this.fps * 2) === 0});       // un cuadro clave cada 2 s
        frame.close();
        this.n++;
        // no acumular demasiados cuadros sin codificar (memoria)
        while (this.enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
    }

    async terminar() {
        await this.enc.flush();
        if (this.error) throw this.error;
        this.enc.close();
        this.muxer.finalize();
        return new Blob([this.muxer.target.buffer], {type: "video/mp4"});
    }

    cancelar() {
        try { this.enc.close(); } catch (e) { /* ya cerrado */ }
    }
}
