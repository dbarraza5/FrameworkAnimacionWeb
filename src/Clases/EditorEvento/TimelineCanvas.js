import { Canvas, Rect, Text, Line, Group } from 'fabric';

export default class TimelineCanvas {
    constructor(canvasElem, config = {}) {
        this.canvasElem = canvasElem;
        this.container  = this.canvasElem.parentElement;

        // Configuración de escala y tiempo
        this.escala    = config.escala    || 0.5;
        this.interval  = config.interval  || 500;

        // Dimensiones del canvas
        this.ancho_canvas = config.width  || 600;
        this.alto_canvas  = config.height || 600;

        // Datos de eventos
        this.lista_eventos   = [];
        this.eventHeight     = config.eventHeight     || 30;
        this.verticalSpacing = config.verticalSpacing|| 10;

        // Línea del timeline
        this.altura_timeline = config.timelineHeight || 200;
        this.y_timeline      = this.alto_canvas - this.altura_timeline;

        // Inicializar Fabric.js
        this.fabricCanvas = new Canvas(this.canvasElem, {
            backgroundColor: config.backgroundColor || 'white',
            selection: false
        });

        // Ajustes y marcas
        this.ajustarCanvas();
        this.dibujarMarcas();

        // Eventos de prueba (mantener en constructor)
        this.lista_eventos.push({ inicio: 200, fin: 600 });
        this.lista_eventos.push({ inicio: 800, fin: 1600 });
        //this.lista_eventos.push({ inicio: 300, fin: 500 });
        this._redibujarEventos();

        // Listener de interacción para escalar y modificar
        this.fabricCanvas.on('object:scaling', e => this.actualizarEtiqueta(e));
        this.fabricCanvas.on('object:modified', e => this.actualizarEtiqueta(e));
    }

    // Ajusta tamaño y redesigna marcas
    ajustarCanvas() {
        this.canvasElem.width  = this.ancho_canvas;
        this.canvasElem.height = this.alto_canvas;
        this.fabricCanvas.setWidth(this.ancho_canvas);
        this.fabricCanvas.setHeight(this.alto_canvas);
        this.dibujarMarcas();
    }

    // Dibuja la línea de tiempo y sus marcas
    dibujarMarcas() {
        this.fabricCanvas.getObjects()
            .filter(o => o.type === 'timelineBackground')
            .forEach(o => this.fabricCanvas.remove(o));

        const fondo = new Rect({
            left: 0, top: this.y_timeline,
            width: this.ancho_canvas,
            height: this.altura_timeline,
            fill: '#1e1e2f',
            selectable: false, evented: false,
            objectCaching: false,
            type: 'timelineBackground'
        });
        this.fabricCanvas.add(fondo);

        this.fabricCanvas.getObjects()
            .filter(o => o.type === 'timeMarker')
            .forEach(o => this.fabricCanvas.remove(o));

        const pasos = Math.ceil(this.ancho_canvas / (this.interval * this.escala));
        for (let i = 0; i <= pasos; i++) {
            const x = i * this.interval * this.escala;
            this.fabricCanvas.add(
                new Line([x, this.y_timeline, x, this.y_timeline + this.altura_timeline], {
                    stroke: '#ccc', selectable: false, evented: false,
                    strokeWidth: 1, objectCaching: false, type: 'timeMarker'
                }),
                new Text(`${i} seg`, {
                    left: x, top: this.y_timeline + 5,
                    fill: 'white', fontSize: 12,
                    selectable: false, evented: false,
                    objectCaching: false,
                    originX: 'left', originY: 'top',
                    type: 'timeMarker'
                })
            );
        }

        //this.fabricCanvas.sendToBack(fondo);
        this.fabricCanvas.renderAll();
    }

    /** Añade un evento y lo muestra en una pista nueva */
    agregarEvento(inicio, fin) {
        if (isNaN(inicio) || isNaN(fin) || fin <= inicio) {
            alert('Valores inválidos.');
            return;
        }
        this.lista_eventos.push({ inicio, fin });
        this._redibujarEventos();
    }

    /** Redibuja todos los eventos asignándoles cada uno una pista distinta */
    _redibujarEventos() {
        // Eliminar previos
        this.fabricCanvas.getObjects()
            .filter(o => o.type === 'eventoGroup')
            .forEach(o => this.fabricCanvas.remove(o));

        // Dibujar según índice en lista_eventos
        this.lista_eventos.forEach((ev, idx) => {
            this._dibujarEventoGroup(ev.inicio, ev.fin, idx);
        });

        this.fabricCanvas.renderAll();
    }

    /** Dibuja un grupo (rect + texto) para el evento en pista idx */
    _dibujarEventoGroup(inicio, fin, pistaIndex) {
        const x      = inicio * this.escala;
        const width  = (fin - inicio) * this.escala;
        const h      = this.eventHeight;
        const salto  = h + this.verticalSpacing;
        const centerY = this.y_timeline + this.altura_timeline/2 - h/2;
        const offsetY = this._getLaneOffset(pistaIndex, salto);
        const y       = centerY + offsetY;

        const rect = new Rect({ left: 0, top: 0, width, height: h, fill: '#FFA11B' });
        const text = new Text(`${inicio}–${fin}ms`, {
            left: width/2, top: h/2,
            originX: 'center', originY: 'center',
            fontSize: 14
        });

        const group = new Group([rect, text], {
            left: x, top: y,
            hasRotatingPoint: false,
            lockScalingY: true,
            lockRotation: true,
            lockMovementY: true,
            objectCaching: false,
            type: 'eventoGroup'
        });

        // permitir solo mover en X y escalar en X
        group.on('scaling', () => {
            // al escalar, actualizar ancho de rect y reposicionar el texto
            const scaleX = group.scaleX;
            rect.set({ width: width * scaleX });
            text.set({ left: (width * scaleX) / 2 });
            group.set({ scaleX: 1 });
        });

        this.fabricCanvas.add(group);
    }

    /** Offset vertical alternado para cada pista */
    _getLaneOffset(idx, salto) {
        const factor = Math.floor(idx / 2) + 1;
        const dir    = idx % 2 === 0 ? -1 : +1;
        return dir * factor * salto;
    }

    /** Ajusta etiqueta tras escalar el grupo */
    actualizarEtiqueta(e) {
        const obj = e.target;
        if (obj && obj.type === 'eventoGroup') {
            // el handler en 'scaling' del grupo ya actualiza rect y texto
            this.fabricCanvas.renderAll();
        }
    }

    /** Limpia canvas */
    dispose() {
        if (this.fabricCanvas) {
            this.fabricCanvas.dispose();
            this.fabricCanvas = null;
        }
    }
}
