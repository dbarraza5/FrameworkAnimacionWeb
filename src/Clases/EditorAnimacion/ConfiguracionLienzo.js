
const MOVER_NADA = -1;
const MOVER_CENTRO_IMAGEN = 18;
const MOVER_INFLAR_IMAGEN = 19;
const MOVER_SELECIONAR_IMAGEN = 20;

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

    procesarTrabajoConfiguracion(eventoLienzoFigura, animacion_){
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        //console.log(eventoLienzoFigura.stack_event_teclado);
        if(this.indice_imagen_seleccionada >= 0){
            const elemento = animacion_.lista_imagenes[this.indice_imagen_seleccionada];
            if(this.tipo_trabajo === MOVER_CENTRO_IMAGEN){
                elemento.x = this.puntero.x;
                elemento.y = this.puntero.y;

                const cambiarTamano = eventoLienzoFigura.stack_event_teclado.includes("KeyT");
                const cambiarOpacidad = eventoLienzoFigura.stack_event_teclado.includes("KeyO");
                console.log("size: "+cambiarTamano);
                if(eventoLienzoFigura.mouse_delta_scroll>0){
                    if(cambiarTamano){
                        elemento.ancho=Math.round(elemento.ancho*REDUCCION);
                        elemento.alto=Math.round(elemento.alto*REDUCCION);
                    }
                    if(cambiarOpacidad){
                        if(elemento.opacidad > 0.1){
                            elemento.opacidad=elemento.opacidad-0.1;
                        }
                    }
                }
                if(eventoLienzoFigura.mouse_delta_scroll<0){
                    if(cambiarTamano){
                        elemento.ancho=Math.round(elemento.ancho*AUMENTO);
                        elemento.alto=Math.round(elemento.alto*AUMENTO);
                    }
                    if(cambiarOpacidad){
                        if(elemento.opacidad < 1){
                            elemento.opacidad=elemento.opacidad+0.1;
                        }
                    }
                }

                if(eventoLienzoFigura.mouse_only_click){
                    this.tipo_trabajo=MOVER_NADA;
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

    imprimirImagenesLienzo(ctx, animacion_){
        animacion_.lista_imagenes.map((imagen)=>{
            if(imagen.img){
                if(imagen.visible){
                    //console.log(imagen.nombre);
                    ctx.globalAlpha = imagen.opacidad;
                    ctx.drawImage(imagen.img, imagen.x, imagen.y, imagen.ancho, imagen.alto);
                    ctx.globalAlpha = 1.0;
                }
            }
        });
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