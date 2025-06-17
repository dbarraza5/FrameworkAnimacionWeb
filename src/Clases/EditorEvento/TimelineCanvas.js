import index from "@mui/material/darkScrollbar";

const ALTO_EVENTO_=30;

export default class TimelineCanvas {
    constructor(canvasElem, eventoLienzo) {
        this.canvasElem = canvasElem;
        this.ctx = this.canvasElem.getContext('2d');
        this.eventoLienzo = eventoLienzo;
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


        this.canvasElem.width = this.ancho_canvas;
        this.canvasElem.height = this.alto_canvas;

        this.desplazamiento_x=0;
        this.desplazamiento_y=0;
        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.shiftPresionado = false;

        this.lista_eventos = [
            { inicio: 0, fin: 500 },
            { inicio: 800, fin: 1600 },
            { inicio: 1000, fin: 2600 },
            { inicio: 400, fin: 1500 },
            { inicio: 1600, fin: 2000 },
            { inicio: 2100, fin: 2600 },
        ];

        // Interacción
        this.selected = null;
        this.offsetX = 0;
        this.isResizing = false;
        this.resizeSide = null;

        this._bindEvents();
        this.redibujarTodo();
    }

    _bindEvents() {
        this.canvasElem.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvasElem.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvasElem.addEventListener('mouseup', this._onMouseUp.bind(this));
    }

    redibujarTodo() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.ancho_canvas, this.alto_canvas);

        // Línea de tiempo
        ctx.fillStyle = '#1e1e2f';
        ctx.fillRect(0, this.y_timeline, this.ancho_canvas, this.altura_timeline);

        ctx.fillStyle = 'white';
        const i_paso_ = Math.floor(this.desplazamiento_x / this.segmento_px);
        const pasos =this.num_segmentos+i_paso_; //Math.ceil(this.ancho_canvas / (this.interval * this.escala));

        for (let i = i_paso_; i <= pasos; i++) {
            //const x = i * this.interval * this.escala;
            const x = i * this.segmento_px - this.desplazamiento_x;
            ctx.beginPath();
            ctx.moveTo(x, this.y_timeline);
            ctx.lineTo(x, this.alto_canvas);
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
            ctx.fillText(`${i} seg`, x + 2, this.y_timeline + 12);
        }


        this.lista_eventos.forEach((ev, idx) => {
            this._dibujarEvento(ev, idx);
        });
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
        let num_elementos = this.lista_eventos.length>4?4:this.lista_eventos.length;
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


        for (let ev of this.lista_eventos) {
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
            const espacio_eventos = (this.alto_evento+this.sep_entre_even)*(this.lista_eventos.length-4);
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

        this.redibujarTodo();
    }

    _onMouseUp() {
        this.isDraggingTimelineX = false;
        this.isDraggingTimelineY = false;
        this.selected = null;
        this.isResizing = false;
        this.resizeSide = null;
    }

    agregarEvento(inicio, fin) {
        if (isNaN(inicio) || isNaN(fin) || fin <= inicio) {
            alert('Valores inválidos.');
            return;
        }
        this.lista_eventos.push({ inicio, fin });
        this.redibujarTodo();
    }

    dispose() {
        this.canvasElem.removeEventListener('mousedown', this._onMouseDown);
        this.canvasElem.removeEventListener('mousemove', this._onMouseMove);
        this.canvasElem.removeEventListener('mouseup', this._onMouseUp);
    }
}