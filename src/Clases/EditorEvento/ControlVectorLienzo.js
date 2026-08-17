// Control reutilizable para movimientos del tipo "pivote + magnitud" (Rotacion, Circular):
// dibuja linea punteada centro->pivote, circulo de trayectoria y una flecha-medidor de
// magnitud, y resuelve el arrastre con mouse para editar ambos. Un mismo `datos` puede
// usar nombres de campo distintos por tipo de movimiento, por eso se configura con
// `configurar(campos)` en vez de asumir nombres fijos.
class ControlVectorLienzo{

    constructor(opciones = {}){
        this.escala_velocidad = opciones.escala_velocidad ?? 2;
        this.largo_minimo = opciones.largo_minimo ?? 20;
        this.largo_maximo = opciones.largo_maximo ?? 200;
        this.color_linea = opciones.color_linea ?? '#8b5cf6';
        this.color_flecha = opciones.color_flecha ?? '#ef4444';
        this.color_flecha_editando = opciones.color_flecha_editando ?? '#f59e0b';

        this.campo_pivote_x = null;
        this.campo_pivote_y = null;
        this.campo_velocidad = null;

        this.edicion_pivote = false;
        this.edicion_velocidad = false;
    }

    configurar(campos){
        this.campo_pivote_x = campos.campo_pivote_x;
        this.campo_pivote_y = campos.campo_pivote_y;
        this.campo_velocidad = campos.campo_velocidad;
    }

    leerVector(datos, x_centro, y_centro){
        const vel = parseInt(datos[this.campo_velocidad]);
        const pivote_x = parseInt(datos[this.campo_pivote_x]) + x_centro;
        const pivote_y = parseInt(datos[this.campo_pivote_y]) + y_centro;
        return {vel, pivote_x, pivote_y};
    }

    calcularLargoFlecha(vel){
        if(vel === 0) return 0;
        const signo = Math.sign(vel);
        const magnitud = Math.abs(vel) * this.escala_velocidad;
        const magnitud_acotada = Math.min(
            Math.max(magnitud, this.largo_minimo),
            this.largo_maximo
        );
        return magnitud_acotada * signo;
    }

    // Detecta clicks sobre el pivote/flecha y resuelve el arrastre en curso.
    // Devuelve true cuando termino de guardar un cambio en `datos` (el llamador debe persistirlo).
    procesarInteraccion(x_mouse, y_mouse, mouse_only_click, datos, x_centro, y_centro){
        const {vel, pivote_x, pivote_y} = this.leerVector(datos, x_centro, y_centro);

        const distanciaPivote = Math.sqrt((x_mouse - pivote_x) ** 2 + (y_mouse - pivote_y) ** 2);

        const flecha_largo = this.calcularLargoFlecha(vel);
        const punta_x = pivote_x + flecha_largo;
        const distanciaPunta = Math.sqrt((x_mouse - punta_x) ** 2 + (y_mouse - pivote_y) ** 2);
        const clickEnPunta = distanciaPunta <= 8;

        if(!this.edicion_pivote && !this.edicion_velocidad){
            if(distanciaPivote <= 5 && mouse_only_click){
                this.edicion_pivote = true;
            } else if(clickEnPunta && mouse_only_click){
                this.edicion_velocidad = true;
            }
            return false;
        }

        if(this.edicion_pivote){
            if(mouse_only_click){
                this.edicion_pivote = false;
                datos[this.campo_pivote_x] = x_mouse - x_centro;
                datos[this.campo_pivote_y] = y_mouse - y_centro;
                return true;
            }
            return false;
        }

        if(this.edicion_velocidad && mouse_only_click){
            this.edicion_velocidad = false;
            const nuevo_largo = x_mouse - pivote_x;
            datos[this.campo_velocidad] = Math.round(nuevo_largo / this.escala_velocidad);
            return true;
        }

        return false;
    }

    dibujar(ctx, datos, x_centro, y_centro, x_mouse, y_mouse){
        let {vel, pivote_x, pivote_y} = this.leerVector(datos, x_centro, y_centro);

        if(this.edicion_pivote){
            pivote_x = x_mouse;
            pivote_y = y_mouse;
        }

        const dx = pivote_x - x_centro;
        const dy = pivote_y - y_centro;
        const radio = Math.sqrt(dx * dx + dy * dy);

        ctx.save();

        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color_linea;

        ctx.beginPath();
        ctx.moveTo(x_centro, y_centro);
        ctx.lineTo(pivote_x, pivote_y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pivote_x, pivote_y, radio, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.fillStyle = this.color_linea;
        ctx.arc(pivote_x, pivote_y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.setLineDash([]);
        ctx.lineWidth = 3;

        const estaEditandoVel = this.edicion_velocidad;
        const colorFlecha = estaEditandoVel ? this.color_flecha_editando : this.color_flecha;
        ctx.strokeStyle = colorFlecha;
        ctx.fillStyle = colorFlecha;

        let flecha_largo;
        let direccion;
        if(estaEditandoVel){
            flecha_largo = x_mouse - pivote_x;
            direccion = flecha_largo >= 0 ? 1 : -1;
        } else {
            flecha_largo = this.calcularLargoFlecha(vel);
            direccion = vel > 0 ? 1 : -1;
        }

        const destino_x = pivote_x + flecha_largo;
        const destino_y = pivote_y;

        if(vel !== 0 || estaEditandoVel){
            ctx.beginPath();
            ctx.moveTo(pivote_x, pivote_y);
            ctx.lineTo(destino_x, destino_y);
            ctx.stroke();

            const tamano_punta = 8;
            ctx.beginPath();
            ctx.moveTo(destino_x, destino_y);
            ctx.lineTo(destino_x - tamano_punta * direccion, destino_y - 5);
            ctx.lineTo(destino_x - tamano_punta * direccion, destino_y + 5);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

export default ControlVectorLienzo;
