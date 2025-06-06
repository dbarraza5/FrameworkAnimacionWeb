// TimelineCanvas.js
import { Canvas, Rect, Text, Line } from 'fabric';

export default class TimelineCanvas {
    constructor(canvasElem, config = {}) {
        this.canvasElem = canvasElem;
        this.container = this.canvasElem.parentElement;
        this.escala = config.escala || 0.5;
        this.totalMs = config.totalMs || 10000;
        this.interval = config.interval || 500;
        this.canvasWidth = this.totalMs * this.escala;

        this.fabricCanvas = new Canvas(this.canvasElem, {
            backgroundColor: '#1e1e2f',
            selection: false
        });

        this.ajustarCanvas();
        this.dibujarMarcas();

        window.addEventListener('resize', () => this.ajustarCanvas());
        this.fabricCanvas.on('object:moving', (e) => this.actualizarEtiqueta(e));
        this.fabricCanvas.on('object:scaling', (e) => this.actualizarEtiqueta(e));
        this.fabricCanvas.on('object:modified', (e) => this.actualizarEtiqueta(e));
    }

    ajustarCanvas() {
        const contHeight = this.container.clientHeight;
        this.canvasElem.width = this.canvasWidth;
        this.canvasElem.height = contHeight;
        this.fabricCanvas.setWidth(this.canvasWidth);
        this.fabricCanvas.setHeight(contHeight);
        this.dibujarMarcas();
    }

    dibujarMarcas() {
        this.fabricCanvas.getObjects().filter(obj => obj.type === 'timeMarker').forEach(obj => this.fabricCanvas.remove(obj));
        for (let ms = 0; ms <= this.totalMs; ms += this.interval) {
            const x = ms * this.escala;
            const linea = new Line([x, 0, x, this.fabricCanvas.getHeight()], {
                stroke: '#ccc',
                selectable: false,
                evented: false,
                strokeWidth: 1,
                objectCaching: false,
                type: 'timeMarker'
            });
            const etiqueta = new Text(`${ms}ms`, {
                left: x,
                top: 5,
                fill: 'white',
                fontSize: 12,
                selectable: false,
                evented: false,
                objectCaching: false,
                originX: 'left',
                originY: 'top',
                type: 'timeMarker'
            });
            this.fabricCanvas.add(linea, etiqueta);
        }
        const timeMarkers = this.fabricCanvas.getObjects().filter(obj => obj.type === 'timeMarker');
        timeMarkers.forEach(obj => this.fabricCanvas.sendToBack(obj));
        this.fabricCanvas.renderAll();
    }

    agregarEvento(inicio, fin) {
        if (isNaN(inicio) || isNaN(fin) || fin <= inicio) {
            alert("Valores inválidos.");
            return;
        }
        const x = inicio * this.escala;
        const width = (fin - inicio) * this.escala;
        const height = 30;
        const y = (this.fabricCanvas.getHeight() / 2) - (height / 2);

        const rect = new Rect({
            left: x,
            top: y,
            fill: '#FFA11B',
            width: width,
            height: height,
            hasRotatingPoint: false,
            lockScalingY: true,
            lockRotation: true,
            lockMovementY: true,
            objectCaching: false
        });

        const etiqueta = new Text(`${inicio}–${fin}ms`, {
            left: x + width / 2,
            top: y + height / 2,
            fill: '#000',
            fontSize: 14,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            objectCaching: false
        });

        rect.etiqueta = etiqueta;
        rect.inicio = inicio;
        rect.fin = fin;

        rect.on('selected', () => {
            rect.set({ hasControls: true, borderColor: '#006fb3', cornerColor: '#fff', cornerSize: 10 });
            this.fabricCanvas.bringToFront(rect.etiqueta);
        });

        rect.on('deselected', () => {
            rect.set({ hasControls: false });
        });

        rect.set({ hasControls: false });

        this.fabricCanvas.add(rect, etiqueta);
        this.fabricCanvas.bringToFront(etiqueta);
        this.fabricCanvas.renderAll();
    }

    actualizarEtiqueta(e) {
        const obj = e.target;
        if (obj && obj.type === 'rect' && obj.etiqueta) {
            const nuevoInicio = Math.round(obj.left / this.escala);
            const nuevoFin = Math.round((obj.left + obj.width * obj.scaleX) / this.escala);
            obj.inicio = nuevoInicio;
            obj.fin = nuevoFin;

            obj.set({
                width: obj.width * obj.scaleX,
                scaleX: 1,
                left: nuevoInicio * this.escala
            });

            obj.etiqueta.set({
                left: obj.left + obj.width / 2,
                top: obj.top + obj.height / 2,
                text: `${nuevoInicio}–${nuevoFin}ms`
            });

            this.fabricCanvas.bringToFront(obj.etiqueta);
            this.fabricCanvas.renderAll();
        }
    }

    dispose() {
        if (this.fabricCanvas) {
            this.fabricCanvas.dispose();
            this.fabricCanvas = null;
        }
    }
}
