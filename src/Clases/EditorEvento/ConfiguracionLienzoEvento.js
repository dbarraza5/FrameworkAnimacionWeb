
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
    escala_min = 0.1;
    escala_max = 8;

    // Tamano actual del canvas en pixeles CSS (lo fija GestionLienzoEvento en cada
    // tick a partir del contenedor; antes era 600x600 fijo).
    ancho = 600;
    alto = 600;

    // Area del documento (la "escena") en coordenadas del dibujo: se pinta clara
    // sobre la mesa de trabajo oscura. Ver planeacion_escena_objetos.md, pregunta P6.
    documento = {x: 0, y: 0, ancho: 1280, alto: 720};

    // Transformacion de vista: pantalla = x_des_zoom + escala * (mundo + x_delta_original).
    // (x_delta_original es el paneo, que los dibujos suman a mano a cada coordenada;
    // x_des_zoom/escala se aplican con ctx.translate/scale en inicioZoomLienzo.)

    // Botones dibujados en la esquina superior derecha del lienzo (fijos, fuera del
    // area escalada -- ver dibujarBotones/procesarClickBotones). Se reubican segun el
    // ancho del canvas en actualizarTamano().
    boton_centrar = {x: 492, y: 6, w: 30, h: 22};
    boton_zoom_menos = {x: 528, y: 6, w: 26, h: 22};
    boton_zoom_mas = {x: 560, y: 6, w: 26, h: 22};

    actualizarTamano(ancho, alto){
        this.ancho = ancho;
        this.alto = alto;
        const y = 26, h = 24;  // debajo de la regla superior
        this.boton_zoom_mas = {x: ancho - 8 - 28, y, w: 28, h};
        this.boton_zoom_menos = {x: ancho - 8 - 28 * 2 - 4, y, w: 28, h};
        this.boton_centrar = {x: ancho - 8 - 28 * 3 - 8, y, w: 28, h};
    }

    // Punto de pantalla (pixeles CSS del canvas) -> coordenadas del dibujo.
    pantallaAMundo(x, y){
        return {
            x: (x - this.x_des_zoom) / this.escala - this.x_delta_original,
            y: (y - this.y_des_zoom) / this.escala - this.y_delta_original,
        };
    }

    // Zoom multiplicando la escala por `factor`, dejando fijo el punto de pantalla
    // (sx, sy) -- con la rueda, el punto bajo el cursor.
    zoomEnPunto(factor, sx, sy){
        const nueva = Math.min(this.escala_max, Math.max(this.escala_min, this.escala * factor));
        const f = nueva / this.escala;
        this.x_des_zoom = sx - f * (sx - this.x_des_zoom);
        this.y_des_zoom = sy - f * (sy - this.y_des_zoom);
        this.escala = nueva;
    }

    // Encuadra el documento completo en el canvas, con un margen.
    ajustarVista(margen = 24){
        const d = this.documento;
        const e = Math.min((this.ancho - 2 * margen) / d.ancho, (this.alto - 2 * margen) / d.alto);
        if(!(e > 0)) return;
        this.escala = Math.min(this.escala_max, Math.max(this.escala_min, e));
        this.x_delta_original = 0;
        this.y_delta_original = 0;
        this.x_des_zoom = (this.ancho - this.escala * d.ancho) / 2 - this.escala * d.x;
        this.y_des_zoom = (this.alto - this.escala * d.alto) / 2 - this.escala * d.y;
    }

    // Zoom 100 % manteniendo el centro de la vista.
    zoomReal(){
        this.zoomEnPunto(1 / this.escala, this.ancho / 2, this.alto / 2);
    }

    // Area del documento: solo un contorno punteado sutil sobre el plano (sin hoja
    // blanca, a pedido del usuario: el lienzo es un unico plano con la misma
    // cuadricula en todas partes). Se dibuja dentro del wrap de zoom.
    dibujarDocumento(ctx){
        const d = this.documento;
        const px = 1 / this.escala;
        ctx.save();
        ctx.strokeStyle = "rgba(200,205,212,0.45)";
        ctx.lineWidth = px;
        ctx.setLineDash([6 * px, 4 * px]);
        ctx.strokeRect(d.x + this.x_delta_original, d.y + this.y_delta_original, d.ancho, d.alto);
        ctx.restore();
    }

    // Paneo del lienzo (arrastrar el fondo para mover la vista).
    arrastrando_lienzo = false;

    titulo_modalidad = "#";
    titulo_tipo_trabajo = "#";
    index_movimiento = null;
    // HUD de depuracion (texto arriba a la izquierda): oculto por defecto, la barra de
    // estado del editor ya muestra esa informacion.
    ver_info_lienzo = false;
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
        // del lienzo -- ver aumentarZoom/disminuirZoom/procesarClickBotones.

        this.aplicar_escala = this.escala !== 1;

        if(this.funcion_editar_config){
            this.funcion_editar_config();
        }
    }

    // Un paso de zoom in/out (botones +/-), centrado en el medio del canvas.
    aumentarZoom(){
        this.zoomEnPunto(this.proporcion_escala, this.ancho / 2, this.alto / 2);
    }

    disminuirZoom(){
        this.zoomEnPunto(1 / this.proporcion_escala, this.ancho / 2, this.alto / 2);
    }

    // Boton "centrar": encuadra el documento completo.
    centrarLienzo(){
        this.ajustarVista();
    }

    // Arrastrar el fondo del lienzo (fuera de botones/grupos/controles de movimiento)
    // panea la vista. GestionLienzoEvento decide cuando llamar a estos dos segun si el
    // click de este tick fue reclamado por otra cosa -- ver procesoEdicionMovimientos.
    iniciarArrastreLienzo(mouse_x, mouse_y){
        this.x_original_mouse = mouse_x;
        this.y_original_mouse = mouse_y;
        this.x_original_aux = this.x_delta_original;
        this.y_original_aux = this.y_delta_original;
        this.arrastrando_lienzo = true;
    }

    procesarArrastreLienzo(mouse_x, mouse_y, mouse_click_up, mouse_only_click){
        if(!this.arrastrando_lienzo) return;
        // Un mousedown nuevo (mouse_only_click) en medio de un arrastre significa que
        // el mouseup que lo termino ya paso, aunque ningun tick puntual haya alcanzado
        // a leer ese "mouse_click_up=true" (mousedown lo pisa a false de inmediato) --
        // sin este chequeo, el arrastre quedaba pegado en true para siempre y cada click
        // posterior (ej. el boton Centrar) se procesaba primero pero despues se pisaba
        // aca mismo, recalculando el pan con el mouse del click nuevo contra el ancla
        // vieja del arrastre.
        if(mouse_click_up || mouse_only_click){
            this.arrastrando_lienzo = false;
            return;
        }
        // el paneo esta en unidades del dibujo: el desplazamiento del mouse (pantalla)
        // se divide por la escala para que el contenido siga al cursor con cualquier zoom.
        this.x_delta_original = this.x_original_aux + (mouse_x - this.x_original_mouse) / this.escala;
        this.y_delta_original = this.y_original_aux + (mouse_y - this.y_original_mouse) / this.escala;
    }

    // Hit-test de los botones del lienzo (zoom y centrar), en coordenadas de pantalla
    // (sin pan ni escala -- son UI fija, no contenido del lienzo). Devuelve true si el
    // click cayo en alguno de los tres.
    procesarClickBotones(mouse_x, mouse_y, click){
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
        if(dentro(this.boton_centrar)){
            this.centrarLienzo();
            return true;
        }
        return false;
    }

    dibujarBotones(ctx){
        ctx.save();
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        [this.boton_centrar, this.boton_zoom_menos, this.boton_zoom_mas].forEach((b) => {
            ctx.fillStyle = "#2b2b3d";
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = "#fff";
            let texto = b === this.boton_zoom_mas ? "+" : "−";
            if(b === this.boton_centrar){
                texto = "⊙";
            }
            ctx.fillText(texto, b.x + b.w / 2, b.y + b.h / 2 + 1);
        });
        ctx.restore();
    }

    // ---- Cuadricula y reglas (plano de coordenadas del dibujo) ----
    // Convencion de pantalla: X crece a la derecha, Y crece HACIA ABAJO (igual que todo
    // el motor y los datos guardados). El origen (0,0) es la esquina superior izquierda
    // del documento.
    mostrar_grilla = true;
    mostrar_reglas = true;
    alto_regla = 18;

    // Paso "lindo" (1, 2 o 5 x 10^n) en unidades del dibujo para que las lineas
    // secundarias queden separadas al menos `px_min` pixeles en pantalla.
    pasoGrilla(px_min = 10){
        const bruto = px_min / this.escala;
        const exp = Math.pow(10, Math.floor(Math.log10(bruto)));
        for(const m of [1, 2, 5, 10]){
            if(m * exp >= bruto) return m * exp;
        }
        return 10 * exp;
    }

    // Rectangulo del dibujo visible en el canvas.
    limitesVisibles(){
        const a = this.pantallaAMundo(0, 0);
        const b = this.pantallaAMundo(this.ancho, this.alto);
        return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
    }

    // Cuadricula infinita (cubre todo lo visible, tambien la mesa de trabajo), en
    // coordenadas del dibujo -- se dibuja dentro del wrap inicioZoomLienzo/finZoomLienzo.
    // Lineas secundarias cada `paso`, principales cada 5 pasos y los ejes X (rojo) e
    // Y (verde) por el origen. El grosor se compensa con la escala (~1 px en pantalla).
    dibujarGrilla(ctx){
        if(!this.mostrar_grilla) return;
        const paso = this.pasoGrilla(10);
        const principal = paso * 5;
        const {x0, y0, x1, y1} = this.limitesVisibles();
        const ox = this.x_delta_original, oy = this.y_delta_original;
        const px = 1 / this.escala;
        const linea = (xa, ya, xb, yb) => {
            ctx.beginPath();
            ctx.moveTo(xa + ox, ya + oy);
            ctx.lineTo(xb + ox, yb + oy);
            ctx.stroke();
        };
        ctx.save();
        ctx.lineWidth = px;
        // gris neutro semitransparente: se ve sobre la hoja blanca y sobre la mesa oscura
        for(let x = Math.floor(x0 / paso) * paso; x <= x1; x += paso){
            const es_principal = Math.abs(x / principal - Math.round(x / principal)) < 1e-6;
            ctx.strokeStyle = es_principal ? "rgba(128,128,128,0.32)" : "rgba(128,128,128,0.14)";
            linea(x, y0, x, y1);
        }
        for(let y = Math.floor(y0 / paso) * paso; y <= y1; y += paso){
            const es_principal = Math.abs(y / principal - Math.round(y / principal)) < 1e-6;
            ctx.strokeStyle = es_principal ? "rgba(128,128,128,0.32)" : "rgba(128,128,128,0.14)";
            linea(x0, y, x1, y);
        }
        // ejes por el origen
        ctx.lineWidth = 1.5 * px;
        ctx.strokeStyle = "rgba(220,70,70,0.85)";   // eje X (y = 0)
        linea(x0, 0, x1, 0);
        ctx.strokeStyle = "rgba(60,170,90,0.85)";   // eje Y (x = 0)
        linea(0, y0, 0, y1);
        // rotulos de los ejes, cerca del borde visible
        ctx.font = `${11 * px}px sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(220,70,70,0.95)";
        ctx.fillText("X →", x1 - 34 * px + ox, -4 * px + oy);
        ctx.fillStyle = "rgba(60,170,90,0.95)";
        ctx.fillText("Y ↓", 5 * px + ox, y1 - 6 * px + oy);
        ctx.restore();
    }

    // Reglas con numeros arriba y a la izquierda (en pantalla, fuera del wrap de zoom).
    // `mouse` (opcional): posicion del cursor en el canvas, se marca en ambas reglas.
    dibujarReglas(ctx, mouse = null){
        if(!this.mostrar_reglas) return;
        const h = this.alto_regla;
        const paso = this.pasoGrilla(10);
        const principal = paso * 5;
        const etiqueta = this.pasoGrilla(60) >= principal ? this.pasoGrilla(60) : principal;
        const {x0, y0, x1, y1} = this.limitesVisibles();
        const sx = (x) => this.x_des_zoom + this.escala * (x + this.x_delta_original);
        const sy = (y) => this.y_des_zoom + this.escala * (y + this.y_delta_original);
        const es_mult = (v, m) => Math.abs(v / m - Math.round(v / m)) < 1e-6;
        const fmt = (v) => String(Math.round(v * 1000) / 1000);

        ctx.save();
        ctx.fillStyle = "#26282c";
        ctx.fillRect(0, 0, this.ancho, h);
        ctx.fillRect(0, 0, h, this.alto);
        ctx.strokeStyle = "#5b6068";
        ctx.fillStyle = "#aab0b8";
        ctx.lineWidth = 1;
        ctx.font = "10px sans-serif";

        // regla superior (X)
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        for(let x = Math.floor(x0 / paso) * paso; x <= x1; x += paso){
            const p = Math.round(sx(x)) + 0.5;
            if(p < h) continue;
            const largo = es_mult(x, principal) ? 7 : 3;
            ctx.beginPath(); ctx.moveTo(p, h); ctx.lineTo(p, h - largo); ctx.stroke();
            if(es_mult(x, etiqueta)) ctx.fillText(fmt(x), p + 2, 1);
        }
        // regla izquierda (Y), numeros girados
        for(let y = Math.floor(y0 / paso) * paso; y <= y1; y += paso){
            const p = Math.round(sy(y)) + 0.5;
            if(p < h) continue;
            const largo = es_mult(y, principal) ? 7 : 3;
            ctx.beginPath(); ctx.moveTo(h, p); ctx.lineTo(h - largo, p); ctx.stroke();
            if(es_mult(y, etiqueta)){
                ctx.save();
                ctx.translate(1, p - 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(fmt(y), 0, 0);
                ctx.restore();
            }
        }
        // origen marcado con el color de cada eje
        const ox_p = sx(0), oy_p = sy(0);
        if(ox_p >= h && ox_p <= this.ancho){ ctx.fillStyle = "rgba(60,170,90,0.95)"; ctx.fillRect(ox_p - 1, 0, 2, h); }
        if(oy_p >= h && oy_p <= this.alto){ ctx.fillStyle = "rgba(220,70,70,0.95)"; ctx.fillRect(0, oy_p - 1, h, 2); }
        // posicion del cursor
        if(mouse && mouse.x > h && mouse.y > h){
            ctx.fillStyle = "#4c8dff";
            ctx.fillRect(Math.round(mouse.x) - 0.5, 0, 1, h);
            ctx.fillRect(0, Math.round(mouse.y) - 0.5, h, 1);
        }
        // esquina
        ctx.fillStyle = "#1e1f22";
        ctx.fillRect(0, 0, h, h);
        ctx.strokeStyle = "#3c3f45";
        ctx.beginPath();
        ctx.moveTo(0, h + 0.5); ctx.lineTo(this.ancho, h + 0.5);
        ctx.moveTo(h + 0.5, 0); ctx.lineTo(h + 0.5, this.alto);
        ctx.stroke();
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
        ctx.fillStyle = '#a9b1bb';

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

    // Siempre se aplica: con "ajustar a la vista" puede haber traslacion aunque la
    // escala sea 1.
    inicioZoomLienzo(ctx){
        ctx.save();
        ctx.translate(this.x_des_zoom, this.y_des_zoom);
        ctx.scale(this.escala, this.escala);
    }

    finZoomLienzo(ctx){
        {
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