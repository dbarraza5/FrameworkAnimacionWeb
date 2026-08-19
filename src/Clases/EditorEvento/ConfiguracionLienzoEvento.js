
import {
    ARRAY_EVENTO_TIPO_MODALIDAD,
    ARRAY_TITULO_TRABAJO, ARRAY_TITULOS_MODALIDAD,
    MODALIDAD_EVENTOS,
    TRABAJO_NADA_LIENZO
} from "./ConstanteEvento";

const PORCENTAJE = 0.1
const REDUCCION = 1-PORCENTAJE;
const AUMENTO = 1+PORCENTAJE;

class ConfiguracionLienzoEvento{

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

    tipo_modalidad = MODALIDAD_EVENTOS;
    tipo_trabajo = TRABAJO_NADA_LIENZO;

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

    // Botones de zoom dibujados en la esquina superior derecha del lienzo (fijos,
    // fuera del area escalada -- ver dibujarBotonesZoom/procesarClickBotonesZoom).
    boton_zoom_menos = {x: 528, y: 6, w: 26, h: 22};
    boton_zoom_mas = {x: 560, y: 6, w: 26, h: 22};

    titulo_modalidad = "#";
    titulo_tipo_trabajo = "#";
    index_movimiento = null;
    ver_info_lienzo = true;
    presionado_s = false;

    pintar_animacion = false;
    presionado_p = false;

    funcion_editar_config = null;

    mostrar_imagenes = true;

    procesarGeneral(eventoLienzoFigura, tipo_modalidad, tipo_trabajo, index_mov, id_grupo){

    //     if(tipo_trabajo === MOVER_NADA){
    // if(eventoLienzoFigura.stack_event_teclado.includes("ShiftLeft")){
    //             //FIGURA
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_NONE)){
    //                 tipo_modalidad = TRABAJO_NONE;
    //             }else
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_FIGURA)){
    //                 tipo_modalidad = TRABAJO_FIGURA;
    //             }else
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_LISTA_FIGURAS)){
    //                 tipo_modalidad = TRABAJO_LISTA_FIGURAS;
    //             }else
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_GRUPOS)){
    //                 tipo_modalidad = TRABAJO_GRUPOS;
    //             }else
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_CONFIG_LIENZO_ATRIBUTOS)){
    //                 tipo_modalidad = TRABAJO_CONFIG_LIENZO_ATRIBUTOS;
    //             }else
    //             if(eventoLienzoFigura.stack_event_teclado.includes(EVENTO_KEY_CONFIG_LIENZO_IMAGENES)){
    //                 tipo_modalidad = TRABAJO_CONFIG_LIENZO_IMAGENES;
    //             }
    //         }
    //     }

        this.titulo_modalidad = ARRAY_TITULOS_MODALIDAD[tipo_modalidad];
        this.titulo_tipo_trabajo = ARRAY_TITULO_TRABAJO[tipo_trabajo];
        this.index_movimiento = index_mov;
        this.id_grupo =  id_grupo;
        return tipo_modalidad;
    }


    getConfiguracionGeneral(){
        return {
            "pintar": this.pintar_animacion
        };
    }

    procesarTrabajoConfiguracionAtributosLienzo(eventoLienzoFigura){
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        // El zoom con tecla Z + rueda del mouse (como en el editor de dibujo) se probo
        // y daba error en este editor, asi que se descarto a favor de los botones +/-
        // del lienzo -- ver aumentarZoom/disminuirZoom/procesarClickBotonesZoom.

        this.aplicar_escala = this.escala !== 1;

        if(this.funcion_editar_config){
            this.funcion_editar_config();
        }
    }

    // Un paso de zoom in/out, con centro fijo en (300,300) -- misma formula que el
    // editor de dibujo (ConfiguracionLienzo.js), pero disparada por un click de boton
    // en vez de tecla+rueda del mouse.
    aumentarZoom(){
        if(this.escala === 1){
            this.x_des_zoom = 0;
            this.y_des_zoom = 0;
        }
        if(this.escala < 3){
            this.escala *= this.proporcion_escala;
            this.x_des_zoom = 300 - (300 - this.x_des_zoom) * this.proporcion_escala;
            this.y_des_zoom = 300 - (300 - this.y_des_zoom) * this.proporcion_escala;
        }
        this.aplicar_escala = this.escala !== 1;
    }

    disminuirZoom(){
        if(this.escala === 1){
            this.x_des_zoom = 0;
            this.y_des_zoom = 0;
        }
        if(this.escala > 1){
            this.escala /= this.proporcion_escala;
            this.x_des_zoom = 300 - (300 - this.x_des_zoom) / this.proporcion_escala;
            this.y_des_zoom = 300 - (300 - this.y_des_zoom) / this.proporcion_escala;
        }
        this.aplicar_escala = this.escala !== 1;
    }

    // Hit-test de los botones +/- del lienzo, en coordenadas de pantalla (sin pan ni
    // escala -- los botones son parte de la UI fija, no del contenido del lienzo).
    // Devuelve true si el click cayo en alguno de los dos.
    procesarClickBotonesZoom(mouse_x, mouse_y, click){
        if(!click) return false;
        const dentro = (b) => mouse_x >= b.x && mouse_x <= b.x + b.w && mouse_y >= b.y && mouse_y <= b.y + b.h;
        if(dentro(this.boton_zoom_mas)){
            this.aumentarZoom();
            return true;
        }
        if(dentro(this.boton_zoom_menos)){
            this.disminuirZoom();
            return true;
        }
        return false;
    }

    dibujarBotonesZoom(ctx){
        ctx.save();
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        [this.boton_zoom_menos, this.boton_zoom_mas].forEach((b) => {
            ctx.fillStyle = "#2b2b3d";
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = "#fff";
            ctx.fillText(b === this.boton_zoom_mas ? "+" : "−", b.x + b.w / 2, b.y + b.h / 2 + 1);
        });
        ctx.restore();
    }

    procesarTrabajoConfiguracionImagenesLiento(eventoLienzoFigura, animacion_){
        this.puntero.x = eventoLienzoFigura.mouse_virtual_x;
        this.puntero.y = eventoLienzoFigura.mouse_virtual_y;

        //console.log(eventoLienzoFigura.stack_event_teclado);
        if(this.indice_imagen_seleccionada >= 0){
            const elemento = animacion_.lista_imagenes[this.indice_imagen_seleccionada];
            // if(this.tipo_trabajo === MOVER_CENTRO_IMAGEN){
            //     elemento.x = this.puntero.x;
            //     elemento.y = this.puntero.y;
            //
            //     if(eventoLienzoFigura.mouse_only_click){
            //         this.tipo_trabajo=MOVER_NADA;
            //     }
            // }

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
        // if(this.tipo_trabajo === MOVER_NADA){
        //     const mover = eventoLienzoFigura.stack_event_teclado.includes("KeyE");
        //     if(mover){
        //         this.tipo_trabajo = MOVER_CENTRO_IMAGEN;
        //         console.log("MOVER LA IMAGEN: "+this.indice_imagen_seleccionada);
        //     }
        // }
    }

    imprimirVariablesLienzo(ctx, tipo_trabajo = 0) {

        ctx.font = '11px Arial';
        ctx.fillStyle = 'blue';

        if (this.ver_info_lienzo) {

            const tiempo = 1.3;

            const lineHeight = 11;
            let y = 10;

            ctx.fillText(
                `Pos:(${this.x_delta_original},${this.y_delta_original})`,
                0,
                y
            );

            y += lineHeight;

            ctx.fillText(
                `Mod:${this.titulo_modalidad}`,
                0,
                y
            );
            y += lineHeight;
            ctx.fillText(
                `Tipo:${this.titulo_tipo_trabajo}`,
                0,
                y
            );
            y += lineHeight;
            ctx.fillText(
                `Grp:${this.id_grupo}`,
                0,
                y
            );
            y += lineHeight;
            ctx.fillText(
                `Mov:${this.index_movimiento}`,
                0,
                y
            );
            y += lineHeight;

            ctx.fillText(
                `Sec:${tiempo}`,
                0,
                y
            );
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
            // if(this.tipo_trabajo === MOVER_REDUCCION_LIENZO || this.tipo_trabajo === MOVER_AUMENTO_LIENZO)
            // this.tipo_trabajo = MOVER_NADA;
        }
    }

    // seleccionarImagenOperar(indice){
    //     this.indice_imagen_seleccionada = indice;
    // }
    //
    // moverImagen(){
    //     this.tipo_trabajo = MOVER_CENTRO_IMAGEN;
    // }
    //
    // camabiarTamImagen(){
    //     this.tipo_trabajo = MOVER_INFLAR_IMAGEN;
    // }
    //
    // seleccionarImagen(){
    //     this.tipo_trabajo = MOVER_SELECIONAR_IMAGEN;
    // }

    actualizarValoresServidor(){
        //axios
    }

};


export default  ConfiguracionLienzoEvento;