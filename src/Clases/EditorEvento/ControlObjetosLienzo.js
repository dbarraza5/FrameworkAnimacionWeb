import {
    cadenaTransformaciones, destransformarPunto, mapaGrupos, normalizarTransformacion, transformarPunto
} from "../EditorAnimacion/TransformacionInstancia";

// Seleccion y manipulacion de objetos de la escena en el lienzo (Fase 2 de
// planeacion_escena_objetos.md). Trabaja en la modalidad "Evento":
//   - clic sobre un objeto: lo selecciona (Shift: agrega/quita de la seleccion);
//     clic en el vacio: deselecciona (y el arrastre panea la vista, como siempre).
//   - arrastrar el interior: mueve el/los objetos.
//   - manijas (un solo objeto): 4 esquinas = escala proporcional (Shift: libre),
//     4 lados = escala en un eje, circulo superior = rotacion (Shift: pasos de 15°).
//     Arrastrar una manija mas alla del ancla refleja el objeto (escala negativa).
//   - teclado: flechas = mover 1 (Shift: 10), Supr = borrar, Ctrl+D = duplicar,
//     Esc = deseleccionar.
// Todo pasa por la transformacion de instancia (Fase 1): no se tocan las figuras.

const COLOR = "#4c8dff";
const LADO_MANIJA = 8;        // px de pantalla
const DIST_ROTACION = 26;     // px de pantalla por encima del borde superior

// manijas: posicion relativa en el rectangulo (0..1) y que ejes escala
const MANIJAS = [
    {id: "nw", u: 0, v: 0, ejes: "xy"}, {id: "n", u: 0.5, v: 0, ejes: "y"}, {id: "ne", u: 1, v: 0, ejes: "xy"},
    {id: "e", u: 1, v: 0.5, ejes: "x"}, {id: "se", u: 1, v: 1, ejes: "xy"}, {id: "s", u: 0.5, v: 1, ejes: "y"},
    {id: "sw", u: 0, v: 1, ejes: "xy"}, {id: "w", u: 0, v: 0.5, ejes: "x"},
];

const sub = (a, b) => ({x: a.x - b.x, y: a.y - b.y});
const len = (a) => Math.hypot(a.x, a.y);

export default class ControlObjetosLienzo {
    seleccion = [];          // nombres de objetos seleccionados
    arrastre = null;         // operacion en curso
    alCambiar = null;        // callback(seleccion) -> React (Inspector)

    // ---- geometria ----

    // Datos de un objeto para dibujar/manipular: limites en su espacio propio,
    // cadena de transformaciones (en vivo) y esquinas ya transformadas.
    geometria(ev, nombre) {
        const lim = ev.limitesObjeto(nombre);
        const grupo = ev.gestion_grupos.getGrupo(nombre);
        if (!lim || !grupo) return null;
        const cadena = cadenaTransformaciones(grupo, mapaGrupos(ev.gestion_grupos.grupos_figuras));
        const local = (u, v) => ({x: lim.x0 + u * (lim.x1 - lim.x0), y: lim.y0 + v * (lim.y1 - lim.y0)});
        const aMundo = (p) => transformarPunto(cadena, p);
        const t = normalizarTransformacion(grupo.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0};
        const ox = parseFloat(grupo.cx_solid ?? grupo.cx) || 0, oy = parseFloat(grupo.cy_solid ?? grupo.cy) || 0;
        return {lim, grupo, cadena, local, aMundo, t,
            ancla: grupo.transformacion ? {x: ox + t.ancla_x, y: oy + t.ancla_y} : {x: (lim.x0 + lim.x1) / 2, y: lim.y1}};
    }

    // ¿El punto del dibujo `p` cae dentro del objeto (su rectangulo transformado)?
    contiene(geo, p) {
        const q = destransformarPunto(geo.cadena, p);
        const m = 2;
        return q.x >= geo.lim.x0 - m && q.x <= geo.lim.x1 + m && q.y >= geo.lim.y0 - m && q.y <= geo.lim.y1 + m;
    }

    // Posiciones (dibujo) de las manijas y de la manija de rotacion.
    manijas(geo, escala_vista) {
        const lista = MANIJAS.map((h) => ({...h, p: geo.aMundo(geo.local(h.u, h.v))}));
        const arriba = geo.aMundo(geo.local(0.5, 0));
        const abajo = geo.aMundo(geo.local(0.5, 1));
        let dir = sub(arriba, abajo);
        const l = len(dir) || 1;
        dir = {x: dir.x / l, y: dir.y / l};
        const rot = {x: arriba.x + dir.x * DIST_ROTACION / escala_vista, y: arriba.y + dir.y * DIST_ROTACION / escala_vista};
        return {lista, rot, arriba};
    }

    _notificar() {
        if (this.alCambiar) this.alCambiar([...this.seleccion]);
    }

    seleccionar(nombres) {
        this.seleccion = nombres.filter(Boolean);
        this.arrastre = null;
        this._notificar();
    }

    // ---- interaccion (se llama en cada cuadro) ----
    // Devuelve true si el raton de este cuadro fue usado por los objetos (para que el
    // lienzo no arranque ademas un paneo). Primero el raton y despues el teclado: si
    // un clic y una tecla caen en el mismo cuadro (clic en el perro + Ctrl+D), la
    // tecla debe actuar sobre lo que el clic acaba de seleccionar.
    procesar(lienzo) {
        const ev = lienzo.eventos_;
        const io = lienzo.eventoLienzoEvento;
        // descartar seleccionados que ya no existen
        const existentes = new Set(ev.objetosEscena());
        if (this.seleccion.some((n) => !existentes.has(n))) {
            this.seleccion = this.seleccion.filter((n) => existentes.has(n));
            this._notificar();
        }
        const usado = this._procesarRaton(lienzo, ev, io);
        this._teclado(lienzo, ev, io);
        return usado;
    }

    _procesarRaton(lienzo, ev, io) {
        const escala_vista = lienzo.configuracion_lienzo.escala || 1;
        const m = {x: lienzo.x_mouse, y: lienzo.y_mouse};
        const shift = io.stack_event_teclado.includes("ShiftLeft") || io.stack_event_teclado.includes("ShiftRight");

        // --- arrastre en curso ---
        if (this.arrastre) {
            if (!io.mouse_click_down || io.mouse_only_click) {
                // se solto el boton: aplicar la ultima posicion (por si el movimiento
                // y el soltar ocurrieron dentro del mismo cuadro) y terminar
                if (!io.mouse_only_click) this._arrastrar(ev, m, shift);
                this.arrastre = null;
                this._notificar();          // valores finales al Inspector
                return true;
            }
            this._arrastrar(ev, m, shift);
            return true;
        }

        if (!io.mouse_only_click) return false;

        // los clics se evaluan en el punto donde se presiono el boton
        const mc = io.mouse_down_x !== undefined
            ? lienzo.configuracion_lienzo.pantallaAMundo(io.mouse_down_x, io.mouse_down_y) : m;
        const enCurso = this._clic(lienzo, ev, mc, shift, escala_vista);
        // si el boton ya se solto en este mismo cuadro, completar la operacion
        if (enCurso && this.arrastre && !io.mouse_click_down) {
            this._arrastrar(ev, m, shift);
            this.arrastre = null;
            this._notificar();
        }
        return enCurso;
    }

    // Clic nuevo en el punto `m` del dibujo: manijas, objetos o vacio.
    _clic(lienzo, ev, m, shift, escala_vista) {

        // --- nuevo clic: manijas del objeto seleccionado ---
        if (this.seleccion.length === 1) {
            const nombre = this.seleccion[0];
            const geo = this.geometria(ev, nombre);
            if (geo) {
                const radio = (LADO_MANIJA + 4) / escala_vista;
                const {lista, rot} = this.manijas(geo, escala_vista);
                if (len(sub(m, rot)) <= radio) {
                    this._iniciar(ev, nombre, geo, "rotar", null, m);
                    return true;
                }
                const h = lista.find((x) => len(sub(m, x.p)) <= radio);
                if (h) {
                    this._iniciar(ev, nombre, geo, "escalar", h, m);
                    return true;
                }
            }
        }

        // --- clic sobre un objeto (el de mas arriba primero) ---
        const objetos = ev.objetosEscena().slice().reverse();
        for (const nombre of objetos) {
            const geo = this.geometria(ev, nombre);
            if (geo && this.contiene(geo, m)) {
                if (shift) {
                    this.seleccion = this.seleccion.includes(nombre)
                        ? this.seleccion.filter((n) => n !== nombre)
                        : [...this.seleccion, nombre];
                    this._notificar();
                    return true;
                }
                if (!this.seleccion.includes(nombre)) {
                    this.seleccion = [nombre];
                    this._notificar();
                }
                this._iniciar(ev, nombre, geo, "mover", null, m);
                return true;
            }
        }

        // --- clic en el vacio: deseleccionar (el lienzo panea) ---
        if (this.seleccion.length && !shift) {
            this.seleccion = [];
            this._notificar();
        }
        return false;
    }

    _iniciar(ev, nombre, geo, tipo, manija, m) {
        if (tipo !== "mover") ev.asegurarTransformacion(nombre);
        // geometria de nuevo: asegurarTransformacion pudo crear el ancla
        const g = tipo !== "mover" ? this.geometria(ev, nombre) : geo;
        this.arrastre = {
            tipo, manija, inicio: m, nombre,
            t0: g.t, ancla: g.ancla,
            posiciones: Object.fromEntries(this.seleccion.map((n) => [n, ev.posicionObjeto(n)])),
            // vector ancla -> manija en el espacio propio (sin escala ni rotacion)
            w0: manija ? sub(g.local(manija.u, manija.v), {x: g.ancla.x, y: g.ancla.y}) : null,
        };
    }

    _arrastrar(ev, m, shift) {
        const a = this.arrastre;
        if (a.tipo === "mover") {
            const dx = m.x - a.inicio.x, dy = m.y - a.inicio.y;
            for (const [n, p] of Object.entries(a.posiciones)) {
                if (p) ev.fijarPosicionObjeto(n, p.x + dx, p.y + dy);
            }
            return;
        }
        const A = a.ancla, t0 = a.t0;
        if (a.tipo === "rotar") {
            const ang = (p) => Math.atan2(p.y - A.y, p.x - A.x) * 180 / Math.PI;
            let rot = t0.rotacion + ang(m) - ang(a.inicio);
            if (shift) rot = Math.round(rot / 15) * 15;
            rot = ((rot + 180) % 360 + 360) % 360 - 180;   // -180..180
            ev.cambiarTransformacion(a.nombre, {rotacion: Math.round(rot * 10) / 10});
            return;
        }
        // escalar: mouse en el marco rotado del objeto, relativo al ancla
        const rad = -t0.rotacion * Math.PI / 180;
        const d = sub(m, A);
        const r = {x: d.x * Math.cos(rad) - d.y * Math.sin(rad), y: d.x * Math.sin(rad) + d.y * Math.cos(rad)};
        const w0 = a.w0;
        const lim = (s) => (Math.abs(s) < 0.05 ? (s < 0 ? -0.05 : 0.05) : s);
        const redondeo = (s) => Math.round(s * 1000) / 1000;
        let sx = t0.escala_x, sy = t0.escala_y;
        const usaX = a.manija.ejes.includes("x") && Math.abs(w0.x) > 1e-3;
        const usaY = a.manija.ejes.includes("y") && Math.abs(w0.y) > 1e-3;
        if (a.manija.ejes === "xy" && !shift) {
            // esquina: proporcional (factor sobre el vector actual ancla -> manija)
            const d0 = {x: w0.x * t0.escala_x, y: w0.y * t0.escala_y};
            const f = (r.x * d0.x + r.y * d0.y) / ((d0.x * d0.x + d0.y * d0.y) || 1);
            sx = t0.escala_x * f;
            sy = t0.escala_y * f;
        } else {
            if (usaX) sx = r.x / w0.x;
            if (usaY) sy = r.y / w0.y;
        }
        ev.cambiarTransformacion(a.nombre, {escala_x: redondeo(lim(sx)), escala_y: redondeo(lim(sy))});
    }

    // Atajos. Se leen de la cola de pulsaciones (`cola_teclas`, la llena Lienzo.js en
    // cada keydown): el lienzo procesa ~10 veces por segundo y una pulsacion rapida
    // (presionar y soltar en < 100 ms) no alcanzaria a verse en stack_event_teclado.
    _teclado(lienzo, ev, io) {
        const cola = io.cola_teclas || [];
        io.cola_teclas = [];
        if (!this.seleccion.length) return;
        for (const k of cola) {
            const paso = k.shift ? 10 : 1;
            const flechas = {ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso]};
            if (flechas[k.code]) {
                const [dx, dy] = flechas[k.code];
                this.seleccion.forEach((n) => ev.moverObjeto(n, dx, dy));
            } else if (k.code === "Delete" || k.code === "Backspace") {
                this.seleccion.forEach((n) => ev.eliminarObjeto(n));
                this.seleccion = [];
                this._notificar();
                return;
            } else if (k.code === "Escape") {
                this.seleccion = [];
                this._notificar();
                return;
            } else if (k.code === "KeyD" && k.ctrl) {
                const copias = this.seleccion.map((n) => ev.duplicarObjeto(n)).filter(Boolean);
                if (copias.length) this.seleccion = copias;
                this._notificar();
            }
        }
    }

    // ---- dibujo (dentro del wrap de zoom del lienzo; ox/oy = paneo) ----
    dibujar(ctx, lienzo) {
        if (!this.seleccion.length) return;
        const ev = lienzo.eventos_;
        const c = lienzo.configuracion_lienzo;
        const ox = c.x_delta_original, oy = c.y_delta_original;
        const px = 1 / (c.escala || 1);
        const P = (p) => ({x: p.x + ox, y: p.y + oy});
        ctx.save();
        ctx.lineWidth = 1.5 * px;
        ctx.strokeStyle = COLOR;
        for (const nombre of this.seleccion) {
            const geo = this.geometria(ev, nombre);
            if (!geo) continue;
            const esquinas = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => P(geo.aMundo(geo.local(u, v))));
            ctx.beginPath();
            esquinas.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.closePath();
            ctx.stroke();
            if (this.seleccion.length !== 1) continue;

            const {lista, rot, arriba} = this.manijas(geo, c.escala || 1);
            // linea y circulo de rotacion
            const pa = P(arriba), pr = P(rot);
            ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();
            ctx.beginPath(); ctx.arc(pr.x, pr.y, 5 * px, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
            // manijas de escala
            const s = LADO_MANIJA * px;
            for (const h of lista) {
                const q = P(h.p);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
                ctx.strokeRect(q.x - s / 2, q.y - s / 2, s, s);
            }
            // ancla (punto fijo de la transformacion)
            const pa2 = P(geo.ancla);
            ctx.beginPath();
            ctx.moveTo(pa2.x - 6 * px, pa2.y); ctx.lineTo(pa2.x + 6 * px, pa2.y);
            ctx.moveTo(pa2.x, pa2.y - 6 * px); ctx.lineTo(pa2.x, pa2.y + 6 * px);
            ctx.strokeStyle = "#ff8a3d";
            ctx.stroke();
            ctx.strokeStyle = COLOR;
            // nombre del objeto
            ctx.font = `${11 * px}px sans-serif`;
            ctx.fillStyle = COLOR;
            const e0 = esquinas[0];
            ctx.fillText(nombre, e0.x, e0.y - 6 * px);
        }
        ctx.restore();
    }
}
