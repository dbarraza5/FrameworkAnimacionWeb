// Reproduccion del sonido en el editor (planeacion_sonido.md, decision S-D7): el audio NO
// tiene reloj propio. `sincronizar(m)` se llama seguido (cada ~100 ms): mira si el motor
// esta reproduciendo y en que instante de la escena va (_t_escena); si salto (buscar,
// reiniciar, cambio de velocidad) o cambiaron los clips, reprograma todo desde ahi.
//
//   const audio = new MotorAudio({cargar: (id, revision) => Promise<ArrayBuffer>});
//   audio.ponerSonidos(lista);  setInterval(() => audio.sincronizar(motor), 100);

export class MotorAudio {
    constructor({cargar}) {
        this.cargar = cargar;
        this.sonidos = new Map();        // id -> {estado, revision, ...}
        this.buffers = new Map();        // id|revision -> {estado, buffer}
        this.fuentes = [];
        this.sonando = false;
        this.silencio = false;
        this.firma = "";
        this.volumen = 1;
        this.ultimo = [];                // lo programado la ultima vez (para pruebas y depuracion)
    }

    ponerSonidos(lista) {
        this.sonidos = new Map((lista || []).map((s) => [String(s._id), s]));
        this.firma = "";                 // reprogramar (un sonido pudo pasar a "listo")
    }

    _ctx() {
        if (!this.ctx) {
            const C = window.AudioContext || window.webkitAudioContext;
            if (!C) return null;
            this.ctx = new C();
            this.salida = this.ctx.createGain();
            this.salida.connect(this.ctx.destination);
        }
        return this.ctx;
    }

    _clave(id) { const s = this.sonidos.get(id); return s ? `${id}|${s.revision || 0}` : null; }

    // AudioBuffer listo de un sonido, o null (y lo pide si hace falta)
    buffer(id) {
        const s = this.sonidos.get(id);
        if (!s || s.estado !== "listo") return null;
        const clave = this._clave(id);
        const b = this.buffers.get(clave);
        if (b) return b.buffer || null;
        const ctx = this._ctx();
        if (!ctx) return null;
        const entrada = {estado: "cargando", buffer: null};
        this.buffers.set(clave, entrada);
        Promise.resolve(this.cargar(id, s.revision || 0))
            .then((ab) => ctx.decodeAudioData(ab))
            .then((buf) => { entrada.buffer = buf; entrada.estado = "listo"; this.firma = ""; })
            .catch((e) => { entrada.estado = "error"; console.warn("No se pudo cargar el sonido", s.nombre, e); });
        return null;
    }

    async bufferListo(id) {
        const s = this.sonidos.get(id);
        if (!s || s.estado !== "listo") return null;
        for (let i = 0; i < 300; i++) {
            const b = this.buffer(id);
            if (b) return b;
            const e = this.buffers.get(this._clave(id));
            if (e && e.estado === "error") return null;
            await new Promise((r) => setTimeout(r, 50));
        }
        return null;
    }

    silenciar(v) {
        this.silencio = !!v;
        if (this.salida) this.salida.gain.value = this.silencio ? 0 : this.volumen;
    }

    detener() {
        for (const f of this.fuentes) { try { f.stop(); } catch (e) { /* ya termino */ } }
        this.fuentes = [];
        this.sonando = false;
    }

    // velocidad de reproduccion del editor (tiempo relativo: 0 = normal)
    static velocidad(m) {
        const r = m && m.tiempo && m.tiempo.tiempoRelativo;
        return r && r > 0 ? 1 / r : 1;
    }

    sincronizar(m) {
        if (!m) return;
        // el boton de pausa detiene los relojes sin apagar m.reproducir
        const reproduciendo = !!m.reproducir && !(m.tiempo && m.tiempo.tiempoEstaPausado);
        if (!reproduciendo) { if (this.sonando) this.detener(); return; }
        const ctx = this._ctx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const vel = MotorAudio.velocidad(m);
        // _t_escena se actualiza al dibujar cada cuadro: se corrige con lo que paso desde entonces
        const t = (m._t_escena || 0) * 1000 + (m._t_escena_en ? Math.max(0, performance.now() - m._t_escena_en) * vel : 0);
        let clips;
        try { clips = m.clipsAudio(); } catch (e) { return; }
        const firma = JSON.stringify(clips.map((c) => [c.sonido, c.t, c.volumen, c.pan, c.recorte, c.bucle, c.fin])) + "|" + vel +
            "|" + clips.map((c) => (this.buffer(c.sonido) ? 1 : 0)).join("");
        const esperado = this.sonando ? this.t0 + (ctx.currentTime - this.ctx0) * 1000 * vel : null;
        if (this.sonando && firma === this.firma && Math.abs(t - esperado) < 250) return;
        this.programar(clips, t, vel);
        this.firma = firma;
    }

    programar(clips, t, vel = 1) {
        this.detener();
        const ctx = this._ctx();
        if (!ctx) return;
        this.t0 = t;
        this.ctx0 = ctx.currentTime;
        this.sonando = true;
        this.ultimo = [];
        for (const c of clips) {
            const buf = this.buffer(c.sonido);
            if (!buf) continue;
            for (const p of tramos(c, buf.duration * 1000, t)) {
                const cuando = this.ctx0 + Math.max(0, p.inicio - t) / 1000 / vel;
                const fuente = ctx.createBufferSource();
                fuente.buffer = buf;
                fuente.playbackRate.value = vel;
                const gan = ctx.createGain();
                envolvente(gan.gain, c, p, cuando, vel);
                let ultimo = gan;
                if (c.pan && ctx.createStereoPanner) {
                    const pan = ctx.createStereoPanner();
                    pan.pan.value = c.pan;
                    gan.connect(pan);
                    ultimo = pan;
                }
                fuente.connect(gan);
                ultimo.connect(this.salida);
                fuente.start(cuando, p.desde / 1000, p.largo / 1000);
                this.fuentes.push(fuente);
                this.ultimo.push({sonido: c.sonido, en: p.inicio, desde: p.desde, largo: p.largo});
            }
        }
        if (this.salida) this.salida.gain.value = this.silencio ? 0 : this.volumen;
    }
}

// Tramos que hay que reproducir de un clip a partir del instante `t` (ms de la escena):
// [{inicio (ms escena), desde (ms dentro del archivo), largo (ms), rel (ms desde el inicio del tramo)}]
// Lo usan la reproduccion y la mezcla (Mezcla.js).
export function tramos(c, dur_archivo, t = 0) {
    const a = c.recorte ? Math.max(0, c.recorte[0]) : 0;
    const b = c.recorte ? Math.min(dur_archivo, c.recorte[1] || dur_archivo) : dur_archivo;
    const largo = b - a;
    if (!(largo > 1)) return [];
    const r = [];
    const repeticiones = c.bucle ? Math.ceil(Math.max(0, c.fin - c.t) / largo) : 1;
    for (let k = 0; k < Math.min(repeticiones, 5000); k++) {
        const ini = c.t + k * largo;
        const fin = Math.min(ini + largo, c.fin != null ? c.fin : Infinity);
        if (fin <= t || fin <= ini) continue;
        const salto = Math.max(0, t - ini);
        r.push({inicio: ini + salto, desde: a + salto, largo: fin - ini - salto, rel: salto, k});
    }
    return r;
}

// Volumen con fundido de entrada (al inicio del clip) y de salida (al final de su ultimo tramo)
export function envolvente(g, c, p, cuando, vel = 1) {
    const v = c.volumen;
    const ent = (c.fundido && c.fundido.entrada) || 0, sal = (c.fundido && c.fundido.salida) || 0;
    g.setValueAtTime(v, cuando);
    if (ent > 0 && p.k === 0 && p.rel < ent) {
        g.setValueAtTime(v * p.rel / ent, cuando);
        g.linearRampToValueAtTime(v, cuando + (ent - p.rel) / 1000 / vel);
    }
    const fin_clip = c.bucle ? c.fin : p.inicio - p.rel + (p.largo + p.rel);
    const fin_tramo = p.inicio + p.largo;
    if (sal > 0 && fin_tramo >= fin_clip - 1 && p.largo > 0) {
        const t_sal = cuando + Math.max(0, p.largo - sal) / 1000 / vel;
        g.setValueAtTime(v, t_sal);
        g.linearRampToValueAtTime(0, cuando + p.largo / 1000 / vel);
    }
}
