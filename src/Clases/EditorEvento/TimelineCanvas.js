import index from "@mui/material/darkScrollbar";
import {TRABAJO_ANIMACION_EVENTOS, TRABAJO_ANIMACION_MOVIMIENTOS} from "../../Store/Evento/eventoSlice";

const ALTO_EVENTO_=30;

function dibujarTrianguloEquilatero(ctx, p, ejeX, ejeY) {
    const height = p * Math.sqrt(3) / 2;

    const x1 = ejeX - p / 2, y1 = ejeY - height;
    const x2 = ejeX + p / 2, y2 = ejeY - height;
    const x3 = ejeX,          y3 = ejeY;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();

    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
}

function dibujarLinea(ctx, p1x, p1y, p2x, p2y) {
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

export default class TimelineCanvas {
    constructor(eventoLienzo, eventoAnimacion, setEventoAnimacion) {
        console.log("INICIALIZACION DEL TIMELINE");

        this.eventoLienzo = eventoLienzo;
        this.eventoAnimacion = eventoAnimacion;
        this.setEventoAnimacion = setEventoAnimacion;

        this.escala = .1;
        this.interval = 500;
        this.ancho_canvas = 600;
        this.alto_canvas =  600;
        this.alto_evento = ALTO_EVENTO_;
        this.sep_entre_even =  5;

        // --- NUEVOS ESTADOS PARA LA CORTINA ---
        this.altura_timeline_original = 200; // Guarda la altura base
        this.altura_timeline = this.altura_timeline_original;
        this.isCollapsed = false;            // Estado de la cortina

        this.y_timeline = this.alto_canvas - this.altura_timeline;

        this.segmento_px = 100;
        this.segundo_seg = 1;
        this.num_segmentos = (this.segundo_seg * this.ancho_canvas) / this.segmento_px;

        this.desplazamiento_x = 0;
        this.desplazamiento_y = 0;
        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.shiftPresionado = false;

        this.x_linea_tiempo = 120;
        this.isDraggingLineaTiempo = false;
        this.offsetDragLineaTiempo = 0;

        this.lista_objetos = [];
        this.selected = null;
        this.offsetX = 0;
        this.isResizing = false;
        this.resizeSide = null;

        this.tipo_modalidad_trabajo = null;
        this.id_evento_seleccionado = null;
        this.play = false;
        this.reset = false;
        this.reiniciar();

        // Agregamos el botón 'cortina' al inicio del array de nombres
        this._nombresBotones = ["cortina", "restablecer", "play", "velocidad"];
        this._botonW = 28;
        this._botonH = 28;
        this._separacion = 8;
        this._altoUI = 44;
        this.playing = false;
        this._speeds = [0.25, 0.5, 1, 1.5, 2, 4];
        this._speedIndex = 2;

        this.eventos_elanzados = false;
        this.click_reproducir = false;
        this.click_reiniciar = false;
    }

    reiniciar(){
        this.click_reproducir = false;
        this.click_detener = false;
        this.click_reiniciar = false;
    }

    inicializar(){
        this.canvasElem = document.getElementById('lienzo-evento');
        this.ctx = this.canvasElem.getContext('2d');
        this.canvasElem.width = this.ancho_canvas;
        this.canvasElem.height = this.alto_canvas;
        if(!this.eventos_elanzados){
            this._bindEvents();
            this._layoutBotones();
            this.eventos_elanzados = true;
        }
    }

    // Modificado para posicionar de forma especial el botón 'cortina'
    _layoutBotones() {
        const totalOtros = (this._nombresBotones.length - 1) * this._botonW + (this._nombresBotones.length - 2) * this._separacion;
        const centroX = (this.ancho_canvas - totalOtros) / 2;
        const posY = this.y_timeline - this._altoUI + (this._altoUI - this._botonH) / 2;

        this.botones = this._nombresBotones.map((nombre, i) => {
            if (nombre === "cortina") {
                // Posición fija: arriba a la izquierda del timeline
                return {
                    nombre,
                    x: 15,
                    y: Math.round(posY),
                    w: this._botonW,
                    h: this._botonH
                };
            } else {
                // Los demás botones se mantienen centrados como antes
                const indiceCentrado = i - 1;
                return {
                    nombre,
                    x: Math.round(centroX + indiceCentrado * (this._botonW + this._separacion)),
                    y: Math.round(posY),
                    w: this._botonW,
                    h: this._botonH
                };
            }
        });
    }

    // Función para alternar el colapso (Efecto cortina)
    toggleCortina() {
        this.isCollapsed = !this.isCollapsed;

        // Si está colapsado la altura pasa a ser 0 (o un valor mínimo si prefieres)
        this.altura_timeline = this.isCollapsed ? 0 : this.altura_timeline_original;

        // Recalculamos el origen Y del timeline en base a la nueva altura
        this.y_timeline = this.alto_canvas - this.altura_timeline;

        // Reposicionar todos los botones a la nueva altura correspondiente
        this._layoutBotones();
    }

    cambioModalidad(modalidad, id_evento){
        this.tipo_modalidad_trabajo = modalidad;
        this.id_evento_seleccionado = id_evento;
    }

    _bindEvents() {
        this.canvasElem.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvasElem.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvasElem.addEventListener('mouseup', this._onMouseUp.bind(this));
    }

    dibujarLineaTiempo(){
        // Si está colapsado, no pintamos la línea de tiempo
        if (this.isCollapsed) return;

        const x_line_punto = this.x_linea_tiempo - this.desplazamiento_x;
        dibujarTrianguloEquilatero(this.ctx, 10, x_line_punto, this.y_timeline);
        dibujarLinea(this.ctx, x_line_punto, this.y_timeline, x_line_punto, this.y_timeline + this.altura_timeline);
    }

    cambiarEventos(lista_eventos_){
        this.lista_objetos = lista_eventos_;
    }

    modalidadEventos(){ this.tipo_edicion = 1; }
    modalidadMovimientos(){ this.tipo_edicion = 2; }

    procesar(){
        this.x_linea_tiempo = this.eventoAnimacion.tiempo_animacion * 100;
    }

    imprimir() {
        const ctx = this.ctx;
        if(!ctx) return;

        // 1. Dibujar la barra de herramientas y botones siempre (quedan flotando al borde inferior si se colapsa)
        this.dibujarBotones();

        // Si está colapsado por completo, saltamos el renderizado del cuerpo del timeline
        if (this.isCollapsed) return;

        // Fondo del Timeline
        ctx.fillStyle = '#1e1e2f';
        ctx.fillRect(0, this.y_timeline, this.ancho_canvas, this.altura_timeline);

        ctx.fillStyle = 'white';
        const i_paso_ = Math.floor(this.desplazamiento_x / this.segmento_px);
        const pasos = this.num_segmentos + i_paso_;

        for (let i = i_paso_; i <= pasos; i++) {
            const x = i * this.segmento_px - this.desplazamiento_x;
            ctx.beginPath();
            ctx.moveTo(x, this.y_timeline);
            ctx.lineTo(x, this.alto_canvas);
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
            ctx.fillText(`${i} seg`, x + 2, this.y_timeline + 12);
        }

        this.lista_objetos.forEach((ev, idx) => {
            this._dibujarEvento(ev, idx);
        });

        this.dibujarLineaTiempo();
    }

    _dibujarEvento(ev, idx) {
        const ctx = this.ctx;
        const x = ev.inicio * this.escala - this.desplazamiento_x;
        const width = (ev.fin - ev.inicio) * this.escala;
        const salto = this.alto_evento + this.sep_entre_even;
        const offsetY = this.y_timeline + this._getLaneOffset(idx, salto);
        const y = offsetY - this.desplazamiento_y;

        if(y < this.y_timeline) return;

        ev._renderX = x;
        ev._renderY = y;
        ev._renderW = width;
        ev._renderH = this.alto_evento;

        ctx.fillStyle = '#FFA11B';
        ctx.fillRect(x, y, width, this.alto_evento);
        ctx.fillStyle = 'black';
        ctx.fillText(`${ev.inicio}–${ev.fin}`, x + width / 2 - 20, y + this.alto_evento / 2 + 5);
    }

    _getLaneOffset(idx, salto) {
        let num_elementos = this.lista_objetos.length > 4 ? 4 : this.lista_objetos.length;
        if(idx <= 3){
            const alto_rectangulo = num_elementos * this.alto_evento + (num_elementos - 1) * this.sep_entre_even;
            const segmento = alto_rectangulo / num_elementos;
            return segmento * idx + (this.altura_timeline - alto_rectangulo) / 2;
        } else {
            num_elementos = 4;
            const alto_rectangulo = num_elementos * this.alto_evento + (num_elementos - 1) * this.sep_entre_even;
            const segmento = alto_rectangulo / num_elementos;
            const y_evento = segmento * 3 + (this.altura_timeline - alto_rectangulo) / 2;
            return y_evento + (this.alto_evento + this.sep_entre_even) * (idx - 3);
        }
    }

    _onMouseDown(e) {
        const mx = e.offsetX;
        const my = e.offsetY;

        // --- DETECCIÓN DE CLICK EN BOTONES (MÁXIMA PRIORIDAD) ---
        for (let b of this.botones) {
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (b.nombre === "cortina")     this.toggleCortina();
                if (b.nombre === "restablecer") this.reiniciarAnimacion();
                if (b.nombre === "play")        this.reproducirAnimacion();
                if (b.nombre === "velocidad")   this.cambiarVelocidad();
                return; // Bloquea cualquier otra acción del canvas
            }
        }

        // Si la cortina está cerrada, ignoramos interacciones internas del timeline
        if (this.isCollapsed) return;

        const dentro_area = my >= this.y_timeline && my <= this.alto_canvas;

        if (dentro_area && this.eventoLienzo.stack_event_teclado.includes("KeyX")) {
            this.isDraggingTimelineX = true;
            this.dragStartX = mx;
        }

        if (dentro_area && this.eventoLienzo.stack_event_teclado.includes("KeyY")) {
            this.isDraggingTimelineY = true;
            this.dragStartY = my;
        }

        for (let ev of this.lista_objetos) {
            const { _renderX: x, _renderY: y, _renderW: w, _renderH: h } = ev;
            if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
                this.selected = ev;
                if (mx <= x + 5) {
                    this.isResizing = true;
                    this.resizeSide = 'left';
                } else if (mx >= x + w - 5) {
                    this.isResizing = true;
                    this.resizeSide = 'right';
                } else {
                    this.offsetX = mx - x;
                }
                break;
            }
        }

        const sizeColision = 15;
        const x_col = this.x_linea_tiempo - this.desplazamiento_x - sizeColision / 2;
        const y_col = this.y_timeline - sizeColision;

        if (mx >= x_col && mx <= x_col + sizeColision && my >= y_col && my <= y_col + sizeColision) {
            this.isDraggingLineaTiempo = true;
            this.offsetDragLineaTiempo = mx - this.x_linea_tiempo;
            return;
        }
    }

    _onMouseMove(e) {
        if (this.isCollapsed) return; // Desactivar movimientos si está cerrado

        const mx = e.offsetX;
        const mx_delta = mx - - this.desplazamiento_x;

        if (this.isDraggingTimelineX) {
            const delta = mx - this.dragStartX;
            this.dragStartX = mx;
            this.desplazamiento_x -= delta;
            if (this.desplazamiento_x < 0) this.desplazamiento_x = 0;
        }

        const my = e.offsetY;
        if (this.isDraggingTimelineY) {
            const delta = my - this.dragStartY;
            this.dragStartY = my;
            const espacio_eventos = (this.alto_evento + this.sep_entre_even) * (this.lista_objetos.length - 4);
            const esta_limite = Math.abs(this.desplazamiento_y - delta) < espacio_eventos;
            if (esta_limite){
                this.desplazamiento_y -= delta;
                if (this.desplazamiento_y < 0) this.desplazamiento_y = 0;
            }
        }

        if (this.selected){
            if (this.isResizing) {
                if (this.resizeSide === 'left') {
                    const newInicio = Math.min(this.selected.fin - 10, mx_delta / this.escala);
                    this.selected.inicio = Math.max(0, Math.floor(newInicio));
                } else if (this.resizeSide === 'right') {
                    const newFin = Math.max(this.selected.inicio + 10, mx_delta / this.escala);
                    this.selected.fin = Math.floor(newFin);
                }
            } else {
                const newInicio = (mx_delta - this.offsetX) / this.escala;
                const duracion = this.selected.fin - this.selected.inicio;
                this.selected.inicio = Math.max(0, Math.floor(newInicio));
                this.selected.fin = this.selected.inicio + duracion;
            }
        }

        if (this.isDraggingLineaTiempo) {
            this.x_linea_tiempo = mx - this.offsetDragLineaTiempo;
            if (this.x_linea_tiempo < 0) this.x_linea_tiempo = 0;
        }
    }

    _onMouseUp() {
        if (this.isCollapsed) {
            this.isDraggingTimelineX = false;
            this.isDraggingTimelineY = false;
            this.isDraggingLineaTiempo = false;
            return;
        }

        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.selected = null;
        this.isResizing = false;
        this.resizeSide = null;
        this.isDraggingLineaTiempo = false;

        if(this.eventoAnimacion.seleccion_evento >= 0){
            if(this.tipo_modalidad_trabajo === TRABAJO_ANIMACION_MOVIMIENTOS){
                const evento_ = this.eventoAnimacion.eventos[this.eventoAnimacion.seleccion_evento];
                if(evento_ && this.lista_objetos.length === evento_.evento.movimientos.length){
                    for(let i = 0; i < evento_.evento.movimientos.length; i++){
                        evento_.evento.movimientos[i].tiempo_inicio = this.lista_objetos[i].inicio;
                        evento_.evento.movimientos[i].tiempo_final = this.lista_objetos[i].fin;
                    }
                    this.eventoAnimacion.eventos[this.eventoAnimacion.seleccion_evento] = evento_;
                    this.setEventoAnimacion({edicion: this.eventoAnimacion});
                }
            }
            if(this.tipo_modalidad_trabajo === TRABAJO_ANIMACION_EVENTOS){
                let cambio = false;
                for(let i = 0; i < this.lista_objetos.length; i++){
                    const obj = this.lista_objetos[i];
                    for(let j = 0; j < this.eventoAnimacion.eventos.length; j++){
                        if(this.eventoAnimacion.eventos[j].evento["nombre"] === obj["id"]){
                            this.eventoAnimacion.eventos[j].evento["tiempo_inicio"] = obj.inicio;
                            this.eventoAnimacion.eventos[j].evento["tiempo_final"] = obj.fin;
                            cambio = true;
                            break;
                        }
                    }
                }
                if (cambio){
                    this.setEventoAnimacion({edicion: this.eventoAnimacion});
                }
            }
        }
    }

    agregarEvento(inicio, fin) {
        if (isNaN(inicio) || isNaN(fin) || fin <= inicio) {
            alert('Valores inválidos.');
            return;
        }
        this.lista_objetos.push({ inicio, fin });
    }

    dibujarBotones() {
        const ctx = this.ctx;
        if(!ctx) return;
        ctx.save();

        // Limpia la franja donde residen los controles
        ctx.clearRect(0, this.y_timeline - this._altoUI, this.ancho_canvas, this._altoUI);

        this.botones.forEach(b => {
            ctx.save();

            ctx.fillStyle = "#2b2b3d";
            const r = 6;
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.fill();

            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 1;
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const cx = b.x + b.w / 2, cy = b.y + b.h / 2;

            // --- RENDERIZADO DE ICONOS ---
            if (b.nombre === "cortina") {
                // Si está colapsado muestra flecha hacia abajo (desplegar), si no, hacia arriba (colapsar)
                ctx.fillText(this.isCollapsed ? "🔽" : "🔼", cx, cy);
            }
            if (b.nombre === "play"){
                if (this.play){
                    ctx.fillText("■", cx, cy);
                } else {
                    ctx.fillText(this.playing ? "⏸" : "▶", cx, cy);
                }
            }
            if (b.nombre === "restablecer") ctx.fillText("↺", cx, cy);
            if (b.nombre === "velocidad")   ctx.fillText("⏩", cx, cy);

            if (b.nombre === "velocidad") {
                ctx.font = "10px sans-serif";
                ctx.fillText(this._speeds[this._speedIndex] + "x", cx, cy + b.h / 2 + 8);
            }

            ctx.restore();
        });

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    dispose() {
        if(!this.canvasElem) return;
        this.canvasElem.removeEventListener('mousedown', this._onMouseDown);
        this.canvasElem.removeEventListener('mousemove', this._onMouseMove);
        this.canvasElem.removeEventListener('mouseup', this._onMouseUp);
    }

    reiniciarAnimacion() {
        this.play = false;
        this.click_reproducir = false;
        this.click_reiniciar = true;
    }

    reproducirAnimacion() {
        this.play = !this.play;
        this.click_reproducir = true;
    }

    detenerAnimacion() { alert("detenerAnimacion"); }
    cambiarVelocidad() { alert("detenerAnimacion"); }
}