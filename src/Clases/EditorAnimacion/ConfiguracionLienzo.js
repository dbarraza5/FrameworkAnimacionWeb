import {
    ARRAY_EVENTO_KEY_TRABAJO,
    ARRAY_EVENTO_TIPO_TRABAJOS,
    ARRAY_TITULO_MOVIMIENTO,
    ARRAY_TITULOS_TRABAJOS, EVENTO_KEY_CONFIG_LIENZO_ATRIBUTOS, EVENTO_KEY_CONFIG_LIENZO_IMAGENES,
    EVENTO_KEY_FIGURA,
    EVENTO_KEY_GRUPOS,
    EVENTO_KEY_LISTA_FIGURAS,
    EVENTO_KEY_NONE,
    EVENTO_KEY_PINTADO_GRUPO,
    MOVER_AUMENTO_LIENZO,
    MOVER_CENTRO_IMAGEN,
    MOVER_DESPLAZAR_LIENZO,
    MOVER_INFLAR_IMAGEN,
    MOVER_NADA,
    MOVER_REDUCCION_LIENZO,
    MOVER_SELECIONAR_IMAGEN, TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES,
    TRABAJO_FIGURA,
    TRABAJO_GRUPOS,
    TRABAJO_LISTA_FIGURAS,
    TRABAJO_NONE, TRABAJO_PINTADO_GRUPO
} from "./ConstanteAnimacion";

const PORCENTAJE = 0.1
const REDUCCION = 1-PORCENTAJE;
const AUMENTO = 1+PORCENTAJE;

class ConfiguracionLienzo{

    rect_figura_ = {
        x: 0,
        y: 0,
        h: 9,
        w: 9
    }

    puntero = {
        x: 0,
        y: 0,
        h: 5,
        w: 5
    }

    x_inicial_mouse = 0;
    y_inicial_mouse = 0;

    indice_imagen_seleccionada = -1;

    tipo_trabajo = MOVER_NADA;

    // diferencia de distancias con respecto a las coordenadas originales
    x_delta_original = 0;
    y_delta_original = 0;

    // diferencia en desplazamiento
    x_delta_desplazamiento = 0
    y_delta_desplazamiento = 0

    // diferencia en zoom
    x_delta_zoom = 0
    y_delta_zoom = 0

    // variables auxiliares
    x_original_aux = 0;
    y_original_aux = 0;
    // zoom 100% = normal
    zoom = 100;
    x_des_zoom = 0;
    y_des_zoom = 0;


    x_original_mouse = 0;
    y_original_mouse = 0;

    //area a la que le hara el zoom
    seleccion_zoom = {
        x: 0,
        y: 0,
        h: 5,
        w: 5
    }

    escala = 1;
    proporcion_escala = 1.1;
    aplicar_escala = false;

    titulo_categoria_trabajo = "#";
    titulo_tipo_movimiento = "#";

    ver_info_lienzo = true;
    presionado_s = false;

    pintar_animacion = false;
    presionado_p = false;

    funcion_editar_config = null;

    mostrar_imagenes = true;

    procesarGeneral(eventoLienzoFigura, categoria_trabajo, tipo_movimiento){

        if(tipo_movimiento === MOVER_NADA){
            if(eventoLienzoFigura.stack_event_teclado.includes("ShiftLeft")){
                //FIGURA
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_NONE)){
                    categoria_trabajo = TRABAJO_NONE;
                }else
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_FIGURA)){
                    categoria_trabajo = TRABAJO_FIGURA;
                }else
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_LISTA_FIGURAS)){
                    categoria_trabajo = TRABAJO_LISTA_FIGURAS;
                }else
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_GRUPOS)){
                    categoria_trabajo = TRABAJO_GRUPOS;
                }else
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_CONFIG_LIENZO_ATRIBUTOS)){
                    categoria_trabajo = TRABAJO_CONFIG_LIENZO_ATRIBUTOS;
                }else
                if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_CONFIG_LIENZO_IMAGENES)){
                    categoria_trabajo = TRABAJO_CONFIG_LIENZO_IMAGENES;
                }
            }
        }

        this.titulo_categoria_trabajo = ARRAY_TITULOS_TRABAJOS[categoria_trabajo];
        this.titulo_tipo_movimiento = ARRAY_TITULO_MOVIMIENTO[tipo_movimiento];
        return categoria_trabajo;
    }


    getConfiguracionGeneral(){
        return {
            "pintar": this.pintar_animacion
        };
    }

    procesarTrabajoConfiguracionAtributosLienzo(eventoLienzoFigura){
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        if(this.tipo_trabajo === MOVER_NADA){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyE") && eventoLienzoFigura.mouse_click_down){
                this.x_original_mouse = eventoLienzoFigura.mouse_x;
                this.y_original_mouse = eventoLienzoFigura.mouse_y;
                this.x_original_aux = this.x_delta_original;
                this.y_original_aux = this.y_delta_original;
                this.tipo_trabajo = MOVER_DESPLAZAR_LIENZO;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyZ")){
                if(eventoLienzoFigura.mouse_delta_scroll<0){
                    this.tipo_trabajo = MOVER_AUMENTO_LIENZO;
                }
                if(eventoLienzoFigura.mouse_delta_scroll>0){
                    this.tipo_trabajo = MOVER_REDUCCION_LIENZO;
                    //this.escala/=this.proporcion_escala;
                }
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyR")){
                this.x_delta_original = 0;
                this.y_delta_original = 0;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyS") && !this.presionado_s){
                this.ver_info_lienzo = !this.ver_info_lienzo;
                this.presionado_s = true;
            }else{
                this.presionado_s = false;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyP") && !this.presionado_p){
                this.pintar_animacion = !this.pintar_animacion;
                this.presionado_p = true;
            }else{
                this.presionado_p = false;
            }
        }

        if(this.tipo_trabajo === MOVER_DESPLAZAR_LIENZO){
            const x_delta = eventoLienzoFigura.mouse_x - this.x_original_mouse;
            const y_delta = eventoLienzoFigura.mouse_y - this.y_original_mouse;
            this.x_delta_desplazamiento = this.x_original_aux+ x_delta;
            this.y_delta_desplazamiento = this.y_original_aux+ y_delta;
            this.x_delta_original = this.x_delta_desplazamiento + this.x_delta_zoom;
            this.y_delta_original = this.y_delta_desplazamiento + this.y_delta_zoom;
            if(eventoLienzoFigura.mouse_click_up){
                this.tipo_trabajo = MOVER_NADA;
            }
        }

        if(this.tipo_trabajo === MOVER_AUMENTO_LIENZO){
            if(this.escala === 1){
                this.x_des_zoom = 0;
                this.y_des_zoom = 0;
            }
            if(this.escala<3){
                this.escala*=this.proporcion_escala;
                this.x_des_zoom  = 300 - (300- this.x_des_zoom) * this.proporcion_escala;
                this.y_des_zoom  = 300 - (300- this.y_des_zoom) * this.proporcion_escala;
            }
            this.tipo_trabajo = MOVER_NADA;
        }

        if(this.tipo_trabajo === MOVER_REDUCCION_LIENZO){
            if(this.escala === 1){
                this.x_des_zoom = 0;
                this.y_des_zoom = 0;
            }
            if(this.escala>1){
                this.escala/=this.proporcion_escala;
                //this.x_des_zoom  = this.puntero.x - (this.puntero.x - this.x_des_zoom) / this.proporcion_escala;
                //this.y_des_zoom  = this.puntero.y - (this.puntero.y - this.y_des_zoom) / this.proporcion_escala;
                this.x_des_zoom  = 300 - (300- this.x_des_zoom) / this.proporcion_escala;
                this.y_des_zoom  = 300 - (300- this.y_des_zoom) / this.proporcion_escala;
            }
            this.tipo_trabajo = MOVER_NADA;
        }

        this.aplicar_escala = this.escala !== 1;

        if(this.funcion_editar_config){
            this.funcion_editar_config();
        }
    }

    procesarTrabajoConfiguracionImagenesLiento(eventoLienzoFigura, animacion_){
        this.puntero.x = eventoLienzoFigura.mouse_virtual_x;
        this.puntero.y = eventoLienzoFigura.mouse_virtual_y;

        //console.log(eventoLienzoFigura.stack_event_teclado);
        if(this.indice_imagen_seleccionada >= 0){
            const elemento = animacion_.lista_imagenes[this.indice_imagen_seleccionada];
            if(this.tipo_trabajo === MOVER_CENTRO_IMAGEN){
                elemento.x = this.puntero.x;
                elemento.y = this.puntero.y;

                if(eventoLienzoFigura.mouse_only_click){
                    this.tipo_trabajo=MOVER_NADA;
                }
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyT")){
                if(eventoLienzoFigura.mouse_delta_scroll>0){
                    elemento.ancho=Math.round(elemento.ancho*REDUCCION);
                    elemento.alto=Math.round(elemento.alto*REDUCCION);
                }
                if(eventoLienzoFigura.mouse_delta_scroll<0){
                    elemento.ancho=Math.round(elemento.ancho*AUMENTO);
                    elemento.alto=Math.round(elemento.alto*AUMENTO);
                }
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyO")){
                console.log(eventoLienzoFigura.mouse_delta_scroll);
                if(eventoLienzoFigura.mouse_delta_scroll>0){
                    if(elemento.opacidad > 0.2){
                        elemento.opacidad=elemento.opacidad-0.1;
                    }
                }
                if(eventoLienzoFigura.mouse_delta_scroll<0){
                    if(elemento.opacidad < 1){
                        elemento.opacidad=elemento.opacidad+0.1;
                    }
                }
            }
        }
        if(this.tipo_trabajo === MOVER_NADA){
            const mover = eventoLienzoFigura.stack_event_teclado.includes("KeyE");
            if(mover){
                this.tipo_trabajo = MOVER_CENTRO_IMAGEN;
                console.log("MOVER LA IMAGEN: "+this.indice_imagen_seleccionada);
            }
        }
    }

    imprimirVariablesLienzo(ctx, tipo_trabajo=0){
        ctx.font = '15px Arial';        // Tamaño y fuente del texto
        ctx.fillStyle = 'blue';         // Color del texto

        // Dibujar el texto en el canvas
        const coor = '('+this.x_delta_original+', '+this.y_delta_original+')'
        //ctx.fillText(coor, 0, 15);

        if(this.ver_info_lienzo){
            ctx.fillText("x: "+this.x_delta_original, 0, 15);
            ctx.fillText("y: "+this.y_delta_original, 0, 30);

            ctx.fillText("t: "+this.titulo_categoria_trabajo, 0, 45);
            ctx.fillText("m: "+this.titulo_tipo_movimiento, 0, 60);
        }
    }

    imprimirImagenesLienzo(ctx, animacion_){

        if(this.mostrar_imagenes){
            animacion_.lista_imagenes.map((imagen)=>{
                if(imagen.img){
                    if(imagen.visible){
                        //console.log(imagen.nombre);
                        ctx.globalAlpha = imagen.opacidad;
                        const x_image = imagen.x+this.x_delta_original;
                        const y_image = imagen.y+this.y_delta_original;
                        ctx.drawImage(imagen.img, x_image, y_image, imagen.ancho, imagen.alto);
                        ctx.globalAlpha = 1.0;
                    }
                }
            });
        }
    }

    inicioZoomLienzo(ctx){
        if(this.aplicar_escala){
            ctx.save();
            ctx.translate(this.x_des_zoom, this.y_des_zoom);
            ctx.scale(this.escala, this.escala);
        }
    }

    finZoomLienzo(ctx){
        if(this.aplicar_escala){
            ctx.restore();
            if(this.tipo_trabajo === MOVER_REDUCCION_LIENZO || this.tipo_trabajo === MOVER_AUMENTO_LIENZO)
            this.tipo_trabajo = MOVER_NADA;
        }
    }

    seleccionarImagenOperar(indice){
        this.indice_imagen_seleccionada = indice;
    }

    moverImagen(){
        this.tipo_trabajo = MOVER_CENTRO_IMAGEN;
    }

    camabiarTamImagen(){
        this.tipo_trabajo = MOVER_INFLAR_IMAGEN;
    }

    seleccionarImagen(){
        this.tipo_trabajo = MOVER_SELECIONAR_IMAGEN;
    }

    actualizarValoresServidor(){
        //axios
    }
};


export default  ConfiguracionLienzo;