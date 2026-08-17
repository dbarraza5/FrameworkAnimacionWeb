// Control para el movimiento Oscilatorio: origen fijo (centro del grupo, igual que
// ControlFlechaLienzo) pero en vez de una flecha dibuja una elipse punteada que
// representa el rango de oscilacion (ancho = 2*amplitudX, alto = 2*amplitudY), con un
// mango arrastrable en cada eje para ajustar la amplitud correspondiente. `frecuencia`
// no tiene representacion geometrica razonable y se sigue editando solo por formulario.
class ControlOscilatorioLienzo{

    constructor(opciones = {}){
        this.color_elipse = opciones.color_elipse ?? '#8b5cf6';
        this.color_mango = opciones.color_mango ?? '#3b82f6';
        this.color_mango_editando = opciones.color_mango_editando ?? '#f59e0b';

        this.campo_amplitud_x = null;
        this.campo_amplitud_y = null;

        this.edicion_x = false;
        this.edicion_y = false;
    }

    configurar(campos){
        this.campo_amplitud_x = campos.campo_amplitud_x;
        this.campo_amplitud_y = campos.campo_amplitud_y;
    }

    leerAmplitudes(datos){
        const amplitudX = Math.abs(parseFloat(datos[this.campo_amplitud_x]) || 0);
        const amplitudY = Math.abs(parseFloat(datos[this.campo_amplitud_y]) || 0);
        return {amplitudX, amplitudY};
    }

    procesarInteraccion(x_mouse, y_mouse, mouse_only_click, datos, origen_x, origen_y){
        const {amplitudX, amplitudY} = this.leerAmplitudes(datos);
        const mango_x = origen_x + amplitudX;
        const mango_y = origen_y - amplitudY;

        if(!this.edicion_x && !this.edicion_y){
            const distX = Math.sqrt((x_mouse - mango_x) ** 2 + (y_mouse - origen_y) ** 2);
            const distY = Math.sqrt((x_mouse - origen_x) ** 2 + (y_mouse - mango_y) ** 2);

            if(distX <= 8 && mouse_only_click){
                this.edicion_x = true;
            } else if(distY <= 8 && mouse_only_click){
                this.edicion_y = true;
            }
            return false;
        }

        if(this.edicion_x){
            if(mouse_only_click){
                this.edicion_x = false;
                datos[this.campo_amplitud_x] = Math.round(Math.abs(x_mouse - origen_x));
                return true;
            }
            return false;
        }

        if(this.edicion_y && mouse_only_click){
            this.edicion_y = false;
            datos[this.campo_amplitud_y] = Math.round(Math.abs(y_mouse - origen_y));
            return true;
        }

        return false;
    }

    dibujar(ctx, datos, origen_x, origen_y, x_mouse, y_mouse){
        let {amplitudX, amplitudY} = this.leerAmplitudes(datos);
        let mango_x = origen_x + amplitudX;
        let mango_y = origen_y - amplitudY;

        if(this.edicion_x){
            amplitudX = Math.abs(x_mouse - origen_x);
            mango_x = x_mouse;
        }
        if(this.edicion_y){
            amplitudY = Math.abs(y_mouse - origen_y);
            mango_y = y_mouse;
        }

        ctx.save();

        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color_elipse;
        ctx.beginPath();
        ctx.ellipse(origen_x, origen_y, amplitudX, amplitudY, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.fillStyle = this.color_elipse;
        ctx.arc(origen_x, origen_y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = this.edicion_x ? this.color_mango_editando : this.color_mango;
        ctx.arc(mango_x, origen_y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = this.edicion_y ? this.color_mango_editando : this.color_mango;
        ctx.arc(origen_x, mango_y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export default ControlOscilatorioLienzo;
