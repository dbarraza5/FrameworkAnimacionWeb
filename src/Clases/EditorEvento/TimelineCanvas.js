import index from "@mui/material/darkScrollbar";

export default class TimelineCanvas {
    constructor(canvasElem, config = {}) {
        this.canvasElem = canvasElem;
        this.ctx = this.canvasElem.getContext('2d');

        // Configuración
        this.escala = .1;//config.escala || 0.5;
        this.interval = config.interval || 500;
        this.ancho_canvas = 600;
        this.alto_canvas =  600;
        this.alto_evento = 30;
        this.sep_entre_even =  5;
        this.altura_timeline = config.timelineHeight || 200;
        this.y_timeline = this.alto_canvas - this.altura_timeline;

        this.segmento_px = 100;//px
        this.segundo_seg=1;
        this.num_segmentos = (this.segundo_seg*this.ancho_canvas)/this.segmento_px;


        this.canvasElem.width = this.ancho_canvas;
        this.canvasElem.height = this.alto_canvas;

        this.lista_eventos = [
            { inicio: 0, fin: 500 },
            { inicio: 800, fin: 1600 },
            { inicio: 1000, fin: 2600 },
            { inicio: 400, fin: 1500 },
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
        const pasos =this.num_segmentos; //Math.ceil(this.ancho_canvas / (this.interval * this.escala));
        for (let i = 0; i <= pasos; i++) {
            //const x = i * this.interval * this.escala;
            const x = i * this.segmento_px;
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
        const x = ev.inicio * this.escala;
        const width = (ev.fin - ev.inicio) * this.escala;
        const salto = this.alto_evento + this.sep_entre_even;
        const centerY = this.y_timeline + this.altura_timeline / 2 - this.alto_evento / 2;
        const offsetY =this.y_timeline + this._getLaneOffset(idx, salto);
        const y =  offsetY;

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
        const num_elementos = this.lista_eventos.length;
        const alto_rectangulo  = num_elementos*this.alto_evento+(num_elementos-1)*this.sep_entre_even;
        const segmento = alto_rectangulo/num_elementos;
        return segmento*idx + (this.altura_timeline-alto_rectangulo)/2;

        // const factor = Math.floor(idx / 2) + 1;
        // const dir = idx % 2 === 0 ? -1 : +1;
        // return dir * factor * salto;
    }

    _onMouseDown(e) {
        const mx = e.offsetX;
        const my = e.offsetY;

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
        if (!this.selected) return;

        const mx = e.offsetX;

        if (this.isResizing) {
            const x = this.selected.inicio * this.escala;
            const w = (this.selected.fin - this.selected.inicio) * this.escala;

            if (this.resizeSide === 'left') {
                const newInicio = Math.min(this.selected.fin - 10, mx / this.escala);
                this.selected.inicio = Math.max(0, Math.floor(newInicio));
            } else if (this.resizeSide === 'right') {
                const newFin = Math.max(this.selected.inicio + 10, mx / this.escala);
                this.selected.fin = Math.floor(newFin);
            }
        } else {
            const newInicio = (mx - this.offsetX) / this.escala;
            const duracion = this.selected.fin - this.selected.inicio;
            this.selected.inicio = Math.max(0, Math.floor(newInicio));
            this.selected.fin = this.selected.inicio + duracion;
        }

        this.redibujarTodo();
    }

    _onMouseUp() {
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