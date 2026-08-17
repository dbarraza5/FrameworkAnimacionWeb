// Control reutilizable para movimientos con origen fijo (el centro del grupo, sin pivote
// propio) y una flecha que se arrastra directamente desde ese origen: libre en 360°
// (MRU 2D, Parabolico) o restringida a un eje (MRU, MRUA, Gravedad). A diferencia de
// ControlVectorLienzo (pivote arrastrable + flecha-medidor siempre horizontal), aqui la
// punta de la flecha ES la posicion real que se arrastra, en cualquier direccion.
//
// `leerVector`/`guardarVector` traducen entre las unidades propias de cada tipo de
// movimiento (m/s, grados, etc.) y un vector {x, y} generico, porque no todos los
// movimientos guardan su vector en cartesianas (Parabolico usa velocidad+angulo).
class ControlFlechaLienzo{

    constructor(opciones = {}){
        this.escala = opciones.escala ?? 2;
        this.largo_minimo = opciones.largo_minimo ?? 20;
        this.largo_maximo = opciones.largo_maximo ?? 200;
        this.color_flecha = opciones.color_flecha ?? '#3b82f6';
        this.color_flecha_editando = opciones.color_flecha_editando ?? '#f59e0b';
        this.color_trayectoria = opciones.color_trayectoria ?? '#22c55e';

        this.restriccion_eje = null;
        this.leerVector = null;
        this.guardarVector = null;
        this.calcularTrayectoria = null;

        this.edicion = false;
    }

    // `calcularTrayectoria(vector, datos, duracion)` es opcional: si se provee, devuelve
    // una lista de puntos {x, y} (en las mismas unidades que `leerVector`/`guardarVector`)
    // que se dibujan como una curva desde el origen, actualizandose en vivo mientras se
    // arrastra la flecha. Sirve para movimientos no lineales como Parabolico.
    configurar({restriccion_eje = null, leerVector, guardarVector, calcularTrayectoria = null}){
        this.restriccion_eje = restriccion_eje;
        this.leerVector = leerVector;
        this.guardarVector = guardarVector;
        this.calcularTrayectoria = calcularTrayectoria;
    }

    // Convierte un vector en unidades propias del movimiento a pixeles para dibujar/detectar
    // clicks, acotando el largo visible (igual criterio que ControlVectorLienzo).
    vectorAPixeles(vector){
        const distancia = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if(distancia === 0) return {x: 0, y: 0};
        let largo_px = distancia * this.escala;
        largo_px = Math.min(Math.max(largo_px, this.largo_minimo), this.largo_maximo);
        const factor = largo_px / distancia;
        return {x: vector.x * factor, y: vector.y * factor};
    }

    procesarInteraccion(x_mouse, y_mouse, mouse_only_click, datos, origen_x, origen_y){
        const punta_px = this.vectorAPixeles(this.leerVector(datos));
        const punta_x = origen_x + punta_px.x;
        const punta_y = origen_y + punta_px.y;

        if(!this.edicion){
            const distancia = Math.sqrt((x_mouse - punta_x) ** 2 + (y_mouse - punta_y) ** 2);
            if(distancia <= 8 && mouse_only_click){
                this.edicion = true;
            }
            return false;
        }

        if(mouse_only_click){
            this.edicion = false;
            let dx_px = x_mouse - origen_x;
            let dy_px = y_mouse - origen_y;
            if(this.restriccion_eje === 'x') dy_px = 0;
            if(this.restriccion_eje === 'y') dx_px = 0;
            this.guardarVector(datos, dx_px / this.escala, dy_px / this.escala);
            return true;
        }

        return false;
    }

    dibujar(ctx, datos, origen_x, origen_y, x_mouse, y_mouse, duracion = 1){
        let punta_x, punta_y;
        let vectorActual;

        if(this.edicion){
            punta_x = this.restriccion_eje === 'y' ? origen_x : x_mouse;
            punta_y = this.restriccion_eje === 'x' ? origen_y : y_mouse;
            vectorActual = {x: (punta_x - origen_x) / this.escala, y: (punta_y - origen_y) / this.escala};
        } else {
            vectorActual = this.leerVector(datos);
            const punta_px = this.vectorAPixeles(vectorActual);
            punta_x = origen_x + punta_px.x;
            punta_y = origen_y + punta_px.y;
        }

        if(this.calcularTrayectoria){
            this.dibujarTrayectoria(ctx, vectorActual, datos, origen_x, origen_y, duracion);
        }

        ctx.save();
        const color = this.edicion ? this.color_flecha_editando : this.color_flecha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(origen_x, origen_y, 4, 0, Math.PI * 2);
        ctx.fill();

        const dx = punta_x - origen_x;
        const dy = punta_y - origen_y;

        if(Math.abs(dx) > 1 || Math.abs(dy) > 1){
            ctx.beginPath();
            ctx.moveTo(origen_x, origen_y);
            ctx.lineTo(punta_x, punta_y);
            ctx.stroke();

            const angulo = Math.atan2(dy, dx);
            const tamano_punta = 8;
            const p1x = punta_x - tamano_punta * Math.cos(angulo - Math.PI / 6);
            const p1y = punta_y - tamano_punta * Math.sin(angulo - Math.PI / 6);
            const p2x = punta_x - tamano_punta * Math.cos(angulo + Math.PI / 6);
            const p2y = punta_y - tamano_punta * Math.sin(angulo + Math.PI / 6);

            ctx.beginPath();
            ctx.moveTo(punta_x, punta_y);
            ctx.lineTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    dibujarTrayectoria(ctx, vector, datos, origen_x, origen_y, duracion){
        const puntos = this.calcularTrayectoria(vector, datos, duracion);
        if(!puntos || puntos.length < 2) return;

        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color_trayectoria;

        ctx.beginPath();
        ctx.moveTo(origen_x, origen_y);
        for(const punto of puntos){
            ctx.lineTo(origen_x + punto.x * this.escala, origen_y + punto.y * this.escala);
        }
        ctx.stroke();
        ctx.restore();
    }
}

export default ControlFlechaLienzo;
