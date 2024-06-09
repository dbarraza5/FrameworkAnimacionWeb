
const MOVER_NADA = -1;
const MOVER_CENTRO_IMAGEN = 18;
const MOVER_INFLAR_IMAGEN = 19;
const MOVER_SELECIONAR_IMAGEN = 20;


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
        console.log("TRABAJO CONFIG_ LIENZO");
        if(this.indice_imagen_seleccionada > MOVER_NADA){
            if(this.tipo_trabajo === MOVER_CENTRO_IMAGEN){
                animacion_.lista_imagenes[this.indice_imagen_seleccionada].x = this.puntero.x;
                animacion_.lista_imagenes[this.indice_imagen_seleccionada].y = this.puntero.y;
                console.log("MOVIENDO LA  IMAGEN DEL LIENZO")
                if(eventoLienzoFigura.mouse_only_click){
                    this.tipo_trabajo=MOVER_NADA;
                }
            }
        }
    }

    imprimirImagenesLienzo(ctx, animacion_){

        /*
        ctx.globalAlpha = 0.7;
            ctx.drawImage(img1, 50, 50);

            // Dibujar la segunda imagen (encima de la primera) con opacidad 0.5 (50%)
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img2, 100, 100);

            // Restaurar la opacidad global si es necesario
            ctx.globalAlpha = 1.0;


            var x = 50;
            var y = 50;
            var width = 200;
            var height = 150;
            ctx.drawImage(img, x, y, width, height);
         */
        //console.log("IMPRIMIR IMAGENES DEL LIENZO");
        //console.log(animacion_.lista_imagenes);
        animacion_.lista_imagenes.map((imagen)=>{
            if(imagen.img){
                //console.log(imagen.nombre);
                ctx.globalAlpha = imagen.opacidad;
                ctx.drawImage(imagen.img, imagen.x, imagen.y, imagen.ancho, imagen.alto);
                ctx.globalAlpha = 1.0;
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