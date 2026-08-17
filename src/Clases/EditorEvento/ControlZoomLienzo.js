// Control para el movimiento Zoom: mismo mecanismo de pivote arrastrable que
// ControlVectorLienzo, pero sin flecha de velocidad -- el zoom es radial, no
// direccional, asi que en su lugar se dibujan dos circulos concentricos
// centrados en el pivote (radio actual / radio proyectado a `tiempo_preview`
// segundos, usando la misma formula de porcentaje que GestionMovimientos.js).
// La velocidad de zoom se sigue editando por formulario, no se arrastra.
class ControlZoomLienzo{

    constructor(opciones = {}){
        this.color_linea = opciones.color_linea ?? '#8b5cf6';
        this.color_radio_actual = opciones.color_radio_actual ?? '#8b5cf6';
        this.color_radio_proyectado = opciones.color_radio_proyectado ?? '#22c55e';
        this.tiempo_preview = opciones.tiempo_preview ?? 1;

        this.campo_pivote_x = null;
        this.campo_pivote_y = null;
        this.campo_velocidad = null;

        this.edicion_pivote = false;
    }

    configurar(campos){
        this.campo_pivote_x = campos.campo_pivote_x;
        this.campo_pivote_y = campos.campo_pivote_y;
        this.campo_velocidad = campos.campo_velocidad;
    }

    leerPivote(datos, x_centro, y_centro){
        const pivote_x = (parseInt(datos[this.campo_pivote_x]) || 0) + x_centro;
        const pivote_y = (parseInt(datos[this.campo_pivote_y]) || 0) + y_centro;
        const velocidad = parseFloat(datos[this.campo_velocidad]) || 0;
        return {pivote_x, pivote_y, velocidad};
    }

    procesarInteraccion(x_mouse, y_mouse, mouse_only_click, datos, x_centro, y_centro){
        const {pivote_x, pivote_y} = this.leerPivote(datos, x_centro, y_centro);
        const distanciaPivote = Math.sqrt((x_mouse - pivote_x) ** 2 + (y_mouse - pivote_y) ** 2);

        if(!this.edicion_pivote){
            if(distanciaPivote <= 5 && mouse_only_click){
                this.edicion_pivote = true;
            }
            return false;
        }

        if(mouse_only_click){
            this.edicion_pivote = false;
            datos[this.campo_pivote_x] = x_mouse - x_centro;
            datos[this.campo_pivote_y] = y_mouse - y_centro;
            return true;
        }

        return false;
    }

    dibujar(ctx, datos, x_centro, y_centro, x_mouse, y_mouse){
        let {pivote_x, pivote_y, velocidad} = this.leerPivote(datos, x_centro, y_centro);

        if(this.edicion_pivote){
            pivote_x = x_mouse;
            pivote_y = y_mouse;
        }

        const dx = pivote_x - x_centro;
        const dy = pivote_y - y_centro;
        const radio_actual = Math.sqrt(dx * dx + dy * dy);
        const porcentaje_preview = velocidad * this.tiempo_preview;
        const radio_proyectado = Math.max(radio_actual + radio_actual * porcentaje_preview, 0);

        ctx.save();

        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color_linea;
        ctx.beginPath();
        ctx.moveTo(x_centro, y_centro);
        ctx.lineTo(pivote_x, pivote_y);
        ctx.stroke();

        ctx.strokeStyle = this.color_radio_actual;
        ctx.beginPath();
        ctx.arc(pivote_x, pivote_y, radio_actual, 0, Math.PI * 2);
        ctx.stroke();

        if(velocidad !== 0){
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = this.color_radio_proyectado;
            ctx.beginPath();
            ctx.arc(pivote_x, pivote_y, radio_proyectado, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.fillStyle = this.color_linea;
        ctx.arc(pivote_x, pivote_y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export default ControlZoomLienzo;
