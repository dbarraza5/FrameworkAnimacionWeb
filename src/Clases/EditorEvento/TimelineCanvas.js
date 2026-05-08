import index from "@mui/material/darkScrollbar";
import {TRABAJO_ANIMACION_EVENTOS, TRABAJO_ANIMACION_MOVIMIENTOS} from "../../Store/Evento/eventoSlice";

const ALTO_EVENTO_=30;

function dibujarTrianguloEquilatero(ctx, p, ejeX, ejeY) {
    const height = p * Math.sqrt(3) / 2; // altura del triángulo equilátero

    // Los puntos se definen relativo al vértice inferior (ejeX, ejeY)
    const x1 = ejeX - p / 2, y1 = ejeY - height; // izquierda de la base
    const x2 = ejeX + p / 2, y2 = ejeY - height; // derecha de la base
    const x3 = ejeX,          y3 = ejeY;         // vértice inferior

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
    ctx.lineWidth = 2; // opcional, grosor de la línea
    ctx.stroke();
    ctx.closePath(); // opcional
}

export default class TimelineCanvas {
    constructor(eventoLienzo, eventoAnimacion, setEventoAnimacion) {
        console.log("INICIALIZACION DEL TIMELINE");
        console.log(eventoAnimacion);
        //this.canvasElem = canvasElem;

        this.eventoLienzo = eventoLienzo;
        this.eventoAnimacion = eventoAnimacion;
        this.setEventoAnimacion = setEventoAnimacion;
        // Configuración
        this.escala = .1;//config.escala || 0.5;
        this.interval = 500;
        this.ancho_canvas = 600;
        this.alto_canvas =  600;
        this.alto_evento = ALTO_EVENTO_;
        this.sep_entre_even =  5;
        this.altura_timeline =  200;
        this.y_timeline = this.alto_canvas - this.altura_timeline;

        this.segmento_px = 100;//px
        this.segundo_seg=1;
        this.num_segmentos = (this.segundo_seg*this.ancho_canvas)/this.segmento_px;

        this.desplazamiento_x=0;
        this.desplazamiento_y=0;
        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.shiftPresionado = false;

        this.x_linea_tiempo = 120;
        this.isDraggingLineaTiempo = false;
        this.offsetDragLineaTiempo = 0;

        this.lista_objetos = [
        ];

        // Interacción
        this.selected = null;
        this.offsetX = 0;
        this.isResizing = false;
        this.resizeSide = null;


        //this.redibujarTodo();
        
        // 0: nada
        // 1: eventos
        // 2: movimientos
        this.tipo_modalidad_trabajo= null;
        this.id_evento_seleccionado= null;
        this.play = false;
        this.reset = false;
        this.reiniciar();

        this.botones = [
            { nombre: 'restablecer', x: 10,  y: this.y_timeline - 40, w: 32, h: 32 },
            { nombre: 'play',        x: 50,  y: this.y_timeline - 40, w: 32, h: 32 },
            // { nombre: 'stop',        x: 90,  y: this.y_timeline - 40, w: 32, h: 32 },
            { nombre: 'velocidad',   x: 130, y: this.y_timeline - 40, w: 32, h: 32 }
        ];
        // en constructor, después de setear this.y_timeline:
        this._nombresBotones = ["restablecer",
            "play",
            // "stop",
            "velocidad"];
        this._botonW = 28;       // más compacto
        this._botonH = 28;
        this._separacion = 8;    // más juntos
        this._altoUI = 44;       // franja de UI sobre el timeline
        this.playing = false;
        this._speeds = [0.25, 0.5, 1, 1.5, 2, 4];
        this._speedIndex = 2;    // arranca en 1x

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
            this._layoutBotones();   // calcula posiciones centradas
            this.eventos_elanzados = true;
        }

    }

    _layoutBotones() {
        const total = this._nombresBotones.length * this._botonW +
            (this._nombresBotones.length - 1) * this._separacion;
        const inicioX = (this.ancho_canvas - total) / 2;
        const posY = this.y_timeline - this._altoUI + (this._altoUI - this._botonH) / 2;

        this.botones = this._nombresBotones.map((nombre, i) => ({
            nombre,
            x: Math.round(inicioX + i * (this._botonW + this._separacion)),
            y: Math.round(posY),
            w: this._botonW,
            h: this._botonH
        }));
    }

    cambioModalidad(modalidad, id_evento){
        this.tipo_modalidad_trabajo = modalidad;
        this.id_evento_seleccionado = id_evento;
    }

    _bindEvents() {
        this.canvasElem.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvasElem.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvasElem.addEventListener('mouseup', this._onMouseUp.bind(this));
        console.log("[_bindEvents]=>2222222222222222222222222222222222222222222222222222222222222222222222222222")
    }

    dibujarLineaTiempo(){
        const x_line_punto =this.x_linea_tiempo - this.desplazamiento_x;
        dibujarTrianguloEquilatero(this.ctx, 10, x_line_punto,this.y_timeline);
        dibujarLinea(this.ctx, x_line_punto, this.y_timeline, x_line_punto, this.y_timeline+this.altura_timeline);
    }

    cambiarEventos(lista_eventos_){
        console.log("[TAM]="+lista_eventos_.length)
        this.lista_objetos = lista_eventos_;
    }
    
    modalidadEventos(){
        this.tipo_edicion = 1;
    }
    
    modalidadMovimientos(){
        this.tipo_edicion = 2;
    }

    procesar(){
        //this.reiniciar();
        this.x_linea_tiempo = this.eventoAnimacion.tiempo_animacion*100;
        //console.log(this.eventoLienzo )
        //this.imprimir();
    }

    imprimir() {
        const ctx = this.ctx;
        //ctx.clearRect(0, 0, this.ancho_canvas, this.alto_canvas);
        if(!ctx) return

        // Dibuja botones primero
        this.dibujarBotones();

        // Línea de tiempo
        ctx.fillStyle = '#1e1e2f';
        ctx.fillRect(0, this.y_timeline, this.ancho_canvas, this.altura_timeline);

        ctx.fillStyle = 'white';
        const i_paso_ = Math.floor(this.desplazamiento_x / this.segmento_px);
        const pasos =this.num_segmentos+i_paso_; //Math.ceil(this.ancho_canvas / (this.interval * this.escala));

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
        const centerY = this.y_timeline + this.altura_timeline / 2 - this.alto_evento / 2;
        const offsetY =this.y_timeline + this._getLaneOffset(idx, salto);
        const y =  offsetY-this.desplazamiento_y;

        if(y<this.y_timeline) return;

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
        let num_elementos = this.lista_objetos.length>4?4:this.lista_objetos.length;
        if(idx<=3){
            const alto_rectangulo  = num_elementos*this.alto_evento+(num_elementos-1)*this.sep_entre_even;
            const segmento = alto_rectangulo/num_elementos;
            return segmento*idx + (this.altura_timeline-alto_rectangulo)/2;
        }else{
            num_elementos=4;
            const alto_rectangulo  = num_elementos*this.alto_evento+(num_elementos-1)*this.sep_entre_even;
            const segmento = alto_rectangulo/num_elementos;
            const y_evento = segmento*3 + (this.altura_timeline-alto_rectangulo)/2;
            return y_evento+(this.alto_evento+this.sep_entre_even)*(idx-3);//+this.alto_evento;
        }
    }

    _onMouseDown(e) {
        const mx = e.offsetX;
        const my = e.offsetY;

        const dentro_area = my >= this.y_timeline && my <= this.alto_canvas;
        // Drag del timeline
        if (dentro_area && this.eventoLienzo.stack_event_teclado.includes("KeyX")) {
            this.isDraggingTimelineX = true;
            this.dragStartX = mx;
            //return;
        }

        // Drag del timeline
        if (dentro_area && this.eventoLienzo.stack_event_teclado.includes("KeyY")) {
            this.isDraggingTimelineY = true;
            this.dragStartY = my;
            //return;
        }
        console.log(this.eventoLienzo.stack_event_teclado);


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

        //--------------------------------------------------------------------
        const sizeColision = 15; // tamaño del cuadrado
        const x_col = this.x_linea_tiempo- this.desplazamiento_x - sizeColision / 2;
        const y_col = this.y_timeline - sizeColision ;/// 2;

        if (mx >= x_col && mx <= x_col + sizeColision && my >= y_col && my <= y_col + sizeColision) {
            this.isDraggingLineaTiempo = true;
            this.offsetDragLineaTiempo = mx - this.x_linea_tiempo;
            return; // prioridad a mover el triángulo
        }


        // --- detección de click en botones (primero) ---
        for (let b of this.botones) {
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (b.nombre === "restablecer") this.reiniciarAnimacion();
                if (b.nombre === "play")        this.reproducirAnimacion();
                // if (b.nombre === "stop")        this.detenerAnimacion();
                if (b.nombre === "velocidad")   this.cambiarVelocidad();
                return; // no seguir con selección/drag del timeline
            }
        }
    }

    _onMouseMove(e) {
        //if (!this.selected) return;

        const mx = e.offsetX;
        const mx_delta = mx- - this.desplazamiento_x;
        if (this.isDraggingTimelineX) {
            const delta = mx - this.dragStartX;
            this.dragStartX = mx;
            this.desplazamiento_x -= delta;
            if (this.desplazamiento_x < 0) this.desplazamiento_x = 0;
            //this.redibujarTodo();
            //return;
        }

        const my = e.offsetY;
        const my_delta = my- - this.desplazamiento_y;
        if (this.isDraggingTimelineY) {
            const delta = my - this.dragStartY;
            this.dragStartY = my;
            const espacio_eventos = (this.alto_evento+this.sep_entre_even)*(this.lista_objetos.length-4);
            const esta_limite = Math.abs(this.desplazamiento_y - delta)<espacio_eventos;
            if (esta_limite){
                this.desplazamiento_y -= delta;
                if (this.desplazamiento_y < 0) this.desplazamiento_y = 0;
            }
        }
        console.log("desplzamieto y: "+this.desplazamiento_y);

        if (this.selected){
            if (this.isResizing) {
                const x = this.selected.inicio * this.escala;
                const w = (this.selected.fin - this.selected.inicio) * this.escala;

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
            // Límite dentro del canvas
            if (this.x_linea_tiempo < 0) this.x_linea_tiempo = 0;
            //if (this.x_linea_tiempo > this.ancho_canvas) this.x_linea_tiempo = this.ancho_canvas;
        }

        //this.redibujarTodo();
    }

    _onMouseUp() {
        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.selected = null;
        this.isResizing = false;
        this.resizeSide = null;
        this.isDraggingLineaTiempo = false;
        if(this.eventoAnimacion.seleccion_evento>=0){
            if(this.tipo_modalidad_trabajo===TRABAJO_ANIMACION_MOVIMIENTOS){
                const evento_ = this.eventoAnimacion.eventos[this.eventoAnimacion.seleccion_evento];
                if(evento_ && this.lista_objetos.length === evento_.evento.movimientos.length){
                    console.log("timeline evento");
                    console.log(evento_);
                    for(let i=0; i<evento_.evento.movimientos.length; i++){
                        evento_.evento.movimientos[i].tiempo_inicio = this.lista_objetos[i].inicio;
                        evento_.evento.movimientos[i].tiempo_final = this.lista_objetos[i].fin;
                    }
                    this.eventoAnimacion.eventos[this.eventoAnimacion.seleccion_evento] = evento_;
                    this.setEventoAnimacion({edicion:this.eventoAnimacion});
                }
            }
            if(this.tipo_modalidad_trabajo===TRABAJO_ANIMACION_EVENTOS){
                let cambio = false;
                for(let i=0; i<this.lista_objetos.length; i++){
                    const obj = this.lista_objetos[i];
                    for(let j=0; j<this.eventoAnimacion.eventos.length; j++){
                        if(this.eventoAnimacion.eventos[j].evento["nombre"] === obj["id"]){
                            this.eventoAnimacion.eventos[j].evento["tiempo_inicio"] = obj.inicio;
                            this.eventoAnimacion.eventos[j].evento["tiempo_final"] = obj.fin;
                            cambio = true;
                            break;
                        }
                    }
                }
                if (cambio){
                    console.log("cambio en el tiempo de los eventos sssssssssssss=============1")
                    console.log(this.eventoAnimacion.eventos);
                    this.setEventoAnimacion({edicion:this.eventoAnimacion});
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
        //this.redibujarTodo();
    }


    dibujarBotones() {
        const ctx = this.ctx;
        if(!ctx) return
        ctx.save();

        // Limpia la franja de UI
        ctx.clearRect(0, this.y_timeline - this._altoUI, this.ancho_canvas, this._altoUI);

        // (opcional) una banda de fondo tenue
        // ctx.fillStyle = "#0f0f18";
        // ctx.fillRect(0, this.y_timeline - this._altoUI, this.ancho_canvas, this._altoUI);

        this.botones.forEach(b => {
            ctx.save();

            // botón
            ctx.fillStyle = "#2b2b3d";
            const r = 6; // esquinas redondeadas
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.fill();

            // borde sutil
            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 1;
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.stroke();

            // icono
            ctx.fillStyle = "#fff";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const cx = b.x + b.w/2, cy = b.y + b.h/2;

            if (b.nombre === "play"){
                if (this.play){
                    ctx.fillText("■", cx, cy);
                }else{
                    ctx.fillText(this.playing ? "⏸" : "▶", cx, cy);
                }

            }
            // if (b.nombre === "stop")        ctx.fillText("■", cx, cy);
            if (b.nombre === "restablecer") ctx.fillText("↺", cx, cy);
            if (b.nombre === "velocidad")   ctx.fillText("⏩", cx, cy);

            // (opcional) mostrar 1x, 2x pequeño debajo del icono de velocidad
            if (b.nombre === "velocidad") {
                ctx.font = "10px sans-serif";
                ctx.fillText(this._speeds[this._speedIndex] + "x", cx, cy + b.h/2 + 8);
            }

            ctx.restore();
        });

        ctx.restore();
    }

    // helper para rectángulos redondeados
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
        if(!this.canvasElem) return
        this.canvasElem.removeEventListener('mousedown', this._onMouseDown);
        this.canvasElem.removeEventListener('mousemove', this._onMouseMove);
        this.canvasElem.removeEventListener('mouseup', this._onMouseUp);
    }

    reiniciarAnimacion() {
        //alert("reiniciarAnimacion");
        this.play = false;
        this.click_reproducir = false;
        this.click_reiniciar = true;
    }

    reproducirAnimacion() {
        //alert("reproducirAnimacion");
        // const nombre_event = this.eventoAnimacion.eventos[this.eventoAnimacion.seleccion_evento].evento["nombre"];
        // const l=this.eventoAnimacion.obtenerHijos(nombre_event);
        // console.log("[lista de hijos]");
        // console.log(l);
        this.play = !this.play;
        this.click_reproducir = true;
        //console.log(this.play);
    }

    detenerAnimacion() {
        alert("detenerAnimacion");
    }

    cambiarVelocidad() {
        alert("detenerAnimacion");
    }
}