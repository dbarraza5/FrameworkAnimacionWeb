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
        // Grupo cuyos movimientos se estan mostrando/editando en este timeline (nivel
        // "movimientos"). Null = no hay nada que mostrar (se limpia lista_objetos).
        this.grupo_seleccionado = null;
        // Que representan las barras de lista_objetos: 'movimientos' (movimientos del
        // grupo seleccionado, id = indice) o 'eventos' (sub-eventos del evento
        // seleccionado, id = nombre del evento). Lo fija GestionLienzoEvento.
        this.nivel = 'movimientos';
        this.evento_padre_timeline = null;
        this.play = false;
        this.reset = false;
        this.reiniciar();

        // El timeline vive en su propio canvas (panel inferior del editor): plegarlo es
        // cosa del panel, asi que ya no hay boton "cortina".
        this.id_canvas = 'timeline-evento';
        // columna izquierda con el nombre de cada pista (alineada con su barra)
        this.ancho_pistas = 150;
        this._nombresBotones = ["restablecer", "play", "velocidad"];
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
        this.canvasElem = document.getElementById(this.id_canvas);
        if(!this.canvasElem) return;
        this.ctx = this.canvasElem.getContext('2d');
        // los listeners se enganchan al elemento concreto (si React lo vuelve a montar,
        // hay que engancharlos de nuevo al elemento nuevo)
        if(this._elemento_con_eventos !== this.canvasElem){
            this._bindEvents();
            this._elemento_con_eventos = this.canvasElem;
            this.eventos_elanzados = true;
        }
        this._ajustarTamano();
    }

    // Ajusta el canvas al tamano de su panel (pixeles CSS) y a devicePixelRatio, y
    // recalcula la geometria: cabecera de controles arriba (_altoUI) y el cuerpo del
    // timeline debajo. Devuelve false si el canvas no esta visible.
    _ajustarTamano(){
        const c = this.canvasElem;
        if(!c || c.clientWidth === 0 || c.clientHeight === 0) return false;
        const dpr = window.devicePixelRatio || 1;
        const ancho = Math.round(c.clientWidth), alto = Math.round(c.clientHeight);
        if(c.width !== Math.round(ancho * dpr) || c.height !== Math.round(alto * dpr)){
            c.width = Math.round(ancho * dpr);
            c.height = Math.round(alto * dpr);
        }
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if(ancho !== this.ancho_canvas || alto !== this.alto_canvas || !this.botones){
            this.ancho_canvas = ancho;
            this.alto_canvas = alto;
            this.y_timeline = this._altoUI;
            this.altura_timeline_original = Math.max(0, alto - this._altoUI);
            this.altura_timeline = this.altura_timeline_original;
            this.num_segmentos = Math.ceil(ancho / this.segmento_px) + 1;
            this._layoutBotones();
        }
        return true;
    }

    // Controles de reproduccion centrados en la cabecera.
    _layoutBotones() {
        const n = this._nombresBotones.length;
        const total = n * this._botonW + (n - 1) * this._separacion;
        const x0 = (this.ancho_canvas - total) / 2;
        const posY = this.y_timeline - this._altoUI + (this._altoUI - this._botonH) / 2;

        this.botones = this._nombresBotones.map((nombre, i) => ({
            nombre,
            x: Math.round(x0 + i * (this._botonW + this._separacion)),
            y: Math.round(posY),
            w: this._botonW,
            h: this._botonH
        }));
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
        // Mientras se arrastra la linea de tiempo, su posicion la dicta el mouse
        // (ver _onMouseMove) -- si se siguiera pisando con el reloj real aca, el
        // arrastre se veria "peleado" con el valor que buscarTiempo() acaba de fijar.
        if(this.isDraggingLineaTiempo) return;
        this.x_linea_tiempo = this.eventoAnimacion.tiempo_animacion * 100;
    }

    imprimir() {
        if(!this.ctx || !this.canvasElem || !this.canvasElem.isConnected){
            // el canvas pudo montarse despues (o volver a montarse): reintentar
            this.canvasElem = null;
            this.inicializar();
        }
        const ctx = this.ctx;
        if(!ctx || !this._ajustarTamano()) return;
        ctx.clearRect(0, 0, this.ancho_canvas, this.alto_canvas);

        // 1. Dibujar la barra de herramientas y botones siempre (quedan flotando al borde inferior si se colapsa)
        this.dibujarBotones();
        this._dibujarTiempo();

        // Si está colapsado por completo, saltamos el renderizado del cuerpo del timeline
        if (this.isCollapsed) return;

        // Fondo del Timeline
        ctx.fillStyle = '#1e1e2f';
        ctx.fillRect(0, this.y_timeline, this.ancho_canvas, this.altura_timeline);

        // Area de barras: a la derecha de la columna de pistas. Se dibuja trasladada en
        // x0 y recortada, asi todas las coordenadas internas (barras, regla, linea roja,
        // _renderX) siguen siendo "locales al area" como antes de existir la columna.
        const x0 = this._x0();
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, this.y_timeline - 12, this.ancho_canvas - x0, this.altura_timeline + 12);
        ctx.clip();
        ctx.translate(x0, 0);

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
        ctx.restore();

        this._dibujarPistas();
    }

    // Ancho de la columna de pistas (0 si el panel es muy angosto).
    _x0() {
        return this.ancho_canvas >= 420 ? this.ancho_pistas : 0;
    }

    _yCarril(idx) {
        const salto = this.alto_evento + this.sep_entre_even;
        return this.y_timeline + this._getLaneOffset(idx, salto) - this.desplazamiento_y;
    }

    // Columna izquierda: el nombre de cada pista, alineado con su barra.
    _dibujarPistas() {
        const x0 = this._x0();
        if (!x0) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#232428';
        ctx.fillRect(0, this.y_timeline, x0, this.altura_timeline);
        ctx.strokeStyle = '#3c3f45';
        ctx.beginPath();
        ctx.moveTo(x0 - 0.5, this.y_timeline);
        ctx.lineTo(x0 - 0.5, this.alto_canvas);
        ctx.stroke();

        ctx.font = '11px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#9aa0a6';
        const titulo = this.nivel === 'eventos' ? 'SUB-EVENTOS' : 'MOVIMIENTOS';
        ctx.fillText(titulo, 10, this.y_timeline + 10);

        const es_evento = this.nivel === 'eventos';
        ctx.beginPath();
        ctx.rect(0, this.y_timeline + 20, x0 - 1, this.altura_timeline - 20);
        ctx.clip();
        this.lista_objetos.forEach((ev, idx) => {
            const y = this._yCarril(idx);
            if (y < this.y_timeline) return;
            const yc = y + this.alto_evento / 2;
            ctx.fillStyle = es_evento ? '#4FA3FF' : '#FFA11B';
            ctx.fillRect(10, yc - 5, 10, 10);
            ctx.fillStyle = this.selected === ev ? '#ffffff' : '#d6d9de';
            const texto = ev.etiqueta || `Pista ${idx + 1}`;
            ctx.fillText(texto, 28, yc, x0 - 36);
        });
        if (this.lista_objetos.length === 0) {
            ctx.fillStyle = '#6c7179';
            ctx.fillText(es_evento ? 'Sin sub-eventos' : 'Sin movimientos', 10, this.y_timeline + 36);
        }
        ctx.restore();
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

        const es_evento = this.nivel === 'eventos';
        ctx.fillStyle = es_evento ? '#4FA3FF' : '#FFA11B';
        ctx.fillRect(x, y, width, this.alto_evento);

        // texto recortado al ancho de la barra (los nombres de evento pueden ser largos)
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, this.alto_evento);
        ctx.clip();
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const texto = ev.etiqueta
            ? `${ev.etiqueta}  ${ev.inicio}–${ev.fin}`
            : `${ev.inicio}–${ev.fin}`;
        ctx.fillText(texto, x + width / 2, y + this.alto_evento / 2);
        ctx.restore();
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
        const mx_canvas = e.offsetX;
        const my = e.offsetY;

        // --- DETECCIÓN DE CLICK EN BOTONES (MÁXIMA PRIORIDAD) ---
        for (let b of this.botones) {
            if (mx_canvas >= b.x && mx_canvas <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (b.nombre === "cortina")     this.toggleCortina();
                if (b.nombre === "restablecer") this.reiniciarAnimacion();
                if (b.nombre === "play")        this.reproducirAnimacion();
                if (b.nombre === "velocidad")   this.cambiarVelocidad();
                return; // Bloquea cualquier otra acción del canvas
            }
        }

        // Si la cortina está cerrada, ignoramos interacciones internas del timeline
        if (this.isCollapsed) return;

        // Desde aca, x en coordenadas del area de barras (a la derecha de las pistas).
        // Un click sobre la columna de pistas no arrastra nada.
        if (mx_canvas < this._x0()) return;
        const mx = mx_canvas - this._x0();

        const dentro_area = my >= this.y_timeline && my <= this.alto_canvas;

        // La linea de tiempo (playhead) tiene prioridad sobre el arrastre de fondo,
        // asi que se detecta primero. Arrastrarla pausa la reproduccion -- si no, el
        // reloj real seguiria avanzando y pelearia con la posicion que marca el mouse.
        const sizeColision = 15;
        const x_col = this.x_linea_tiempo - this.desplazamiento_x - sizeColision / 2;
        const y_col = this.y_timeline - sizeColision;
        // La zona de agarre cubre el triangulo de arriba Y todo el largo de la linea
        // (no solo la puntita), para que sea facil tomarla en cualquier punto.
        const y_col_max = this.alto_canvas;

        if (mx >= x_col && mx <= x_col + sizeColision && my >= y_col && my <= y_col_max) {
            this.isDraggingLineaTiempo = true;
            this.offsetDragLineaTiempo = mx - this.x_linea_tiempo;
            this.play = false;
            this.eventoAnimacion.pausarEventos();
            return;
        }

        if (dentro_area && this.eventoLienzo.stack_event_teclado.includes("KeyY")) {
            this.isDraggingTimelineY = true;
            this.dragStartY = my;
        }

        let bloque_golpeado = false;
        for (let ev of this.lista_objetos) {
            const { _renderX: x, _renderY: y, _renderW: w, _renderH: h } = ev;
            if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
                bloque_golpeado = true;
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

        // Arrastrar el fondo del timeline (fuera de un bloque de movimiento o de la
        // linea de tiempo) desplaza el eje horizontal -- ya no hace falta mantener
        // presionada ninguna tecla para esto.
        if (dentro_area && !bloque_golpeado) {
            this.isDraggingTimelineX = true;
            this.dragStartX = mx;
        }
    }

    _onMouseMove(e) {
        if (this.isCollapsed) return; // Desactivar movimientos si está cerrado

        const mx = e.offsetX - this._x0();   // coordenadas del area de barras
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
            let nuevo_x = mx - this.offsetDragLineaTiempo;
            if (nuevo_x < 0) nuevo_x = 0;

            // No dejar arrastrar mas alla del final del evento que se reproduce (el
            // seleccionado) -- pasado ese punto el motor reinicia en el proximo tick.
            const x_max = this.eventoAnimacion.duracionReproduccion() * 100;
            if (x_max > 0 && nuevo_x > x_max) nuevo_x = x_max;

            this.x_linea_tiempo = nuevo_x;
            this.eventoAnimacion.buscarTiempo(this.x_linea_tiempo / 100);
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

        // Nivel "eventos": escribe inicio/fin arrastrados/estirados en los sub-eventos
        // reales (tiempos relativos a su evento padre).
        if(this.nivel === 'eventos'){
            let cambio = false;
            for(const obj of this.lista_objetos){
                const evento_ = this.eventoAnimacion.obtenerEvento(obj.id);
                if(!evento_) continue;
                const ev = evento_.evento;
                if(ev.tiempo_inicio !== obj.inicio || ev.tiempo_final !== obj.fin){
                    ev.tiempo_inicio = obj.inicio;
                    ev.tiempo_final = obj.fin;
                    cambio = true;
                }
            }
            if(cambio){
                this.setEventoAnimacion({edicion: this.eventoAnimacion});
            }
            return;
        }

        // Nivel "movimientos": escribe de vuelta inicio/fin arrastrados/estirados en
        // los movimientos reales del grupo activo.
        if(this.grupo_seleccionado && this.id_evento_seleccionado){
            const movimientos = this.eventoAnimacion.obtenerMovimientosDeGrupo(
                this.id_evento_seleccionado, this.grupo_seleccionado
            );
            if(movimientos && movimientos.length === this.lista_objetos.length){
                let cambio = false;
                for(let i = 0; i < movimientos.length; i++){
                    const obj = this.lista_objetos[i];
                    if(movimientos[i].tiempo_inicio !== obj.inicio || movimientos[i].tiempo_final !== obj.fin){
                        movimientos[i].tiempo_inicio = obj.inicio;
                        movimientos[i].tiempo_final = obj.fin;
                        cambio = true;
                    }
                }
                if(cambio){
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

    // Tiempo actual / duracion del evento que se reproduce, a la derecha de la cabecera.
    _dibujarTiempo() {
        const ctx = this.ctx;
        const fmt = (s) => {
            s = Math.max(0, s || 0);
            const m = Math.floor(s / 60);
            return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
        };
        const actual = this.eventoAnimacion.tiempo_animacion;
        const total = this.eventoAnimacion.duracionReproduccion ? this.eventoAnimacion.duracionReproduccion() : 0;
        ctx.save();
        ctx.font = "12px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.fillStyle = "#d6d9de";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        // deja lugar al boton de plegar el panel (esquina superior derecha, HTML)
        ctx.fillText(`${fmt(actual)} / ${fmt(total)}`, this.ancho_canvas - 44, this._altoUI / 2);
        const evento = this.eventoAnimacion.eventoReproduccion ? this.eventoAnimacion.eventoReproduccion() : null;
        if (evento) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#9aa0a6";
            ctx.fillText(`Evento: ${evento.nombre}`, 12, this._altoUI / 2);
        }
        ctx.restore();
    }

    dibujarBotones() {
        const ctx = this.ctx;
        if(!ctx) return;
        ctx.save();

        // Fondo de la franja de controles (cabecera del panel)
        ctx.fillStyle = "#26282c";
        ctx.fillRect(0, this.y_timeline - this._altoUI, this.ancho_canvas, this._altoUI);

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
                ctx.textAlign = "left";
                ctx.fillText(this._speeds[this._speedIndex] + "x", b.x + b.w + 6, cy);
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