import Fisica from "./Fisica";
import {normalizar_recta} from "./GestionAnimacion";

const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_LISTA_FIGURAS = 1;
const TRABAJO_GRUPO = 2;
const TRABAJO_GRUPOS = 3;

const MOVER_NADA = 0
const MOVER_CENTRO_FIGURA = 1;
const MOVER_RECTA_PUNTO1 = 2;
const MOVER_RECTA_PUNTO2 = 3;
const MOVER_RADIO_CIRCULO = 4;

const MOVER_CENTROS_FIGURAS = 5;
const MOVER_ROTAR_FIGURAS = 6;
const MOVER_INFLAR_FIGURAS = 7;
const MOVER_ELIMINAR_FIGURAS = 8;
const MOVER_DUPLICAR_FIGURAS = 9;
const MOVER_DESINFLAR_FIGURAS = 10;


class GestionLienzoAnimacion {

    categoria_trabajo = TRABAJO_NONE;

    id_figura_selec = null;
    id_grupo_selec = null;

    lista_id_figuras = []

    puntero = {
        x: 0,
        y: 0,
        w: 10,
        h: 10
    }

    puntero_seleccion = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    }

    seleccion_figuras = false;

    p1_recta = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    p2_recta = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    p_circulo = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    p_centro = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    mover_figura = MOVER_NADA;

    copia_lista_figuras = []
    mover_centros = {
        centro_x: 0,
        centro_y: 0,
        inf_hor: 0,
        sup_hor: 0,
        inf_ver: 0,
        sup_ver: 0,
        ancho: 0,
        alto: 0,
    }

    constructor() {
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
    }

    seleccionarFiguraMover(nombre_figura_, nombre_grupo_, tipo_movimiento = MOVER_CENTRO_FIGURA) {
        this.categoria_trabajo = TRABAJO_FIGURA;
        this.id_grupo_selec = nombre_grupo_;
        this.id_figura_selec = nombre_figura_;
        this.mover_figura = tipo_movimiento;
    }

    seleccionarFigurasTransformar(nombre_grupo_) {
        this.categoria_trabajo = TRABAJO_LISTA_FIGURAS;
        this.id_grupo_selec = nombre_grupo_;
        //this.id_figura_selec = nombre_figura_;
        //this.mover_figura = MOVER_CENTRO_FIGURA;
    }

    procesarSeleccionPuntero(eventoLienzoFigura, animacion){
        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;

        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        //console.log(this.mover_figura)
        if (this.mover_figura === MOVER_NADA) {//this.categoria_trabajo === TRABAJO_NONE
            if (eventoLienzoFigura.mouse_sobre_lienzo) {
                if (eventoLienzoFigura.mouse_click_down) {
                    if (eventoLienzoFigura.mouse_only_click) {
                        this.puntero_seleccion.x = eventoLienzoFigura.mouse_x;
                        this.puntero_seleccion.y = eventoLienzoFigura.mouse_y;
                        this.seleccion_figuras = true;
                        this.lista_id_figuras = []
                    }
                    this.puntero_seleccion.w = eventoLienzoFigura.mouse_x - this.puntero_seleccion.x;
                    this.puntero_seleccion.h = eventoLienzoFigura.mouse_y - this.puntero_seleccion.y;
                    console.log(this.puntero_seleccion)
                }
                if (eventoLienzoFigura.mouse_click_up) {
                    if(this.lista_id_figuras.length == 1 && this.seleccion_figuras){
                        console.log(this.puntero_seleccion)
                        this.seleccion_figuras = false
                        this.seleccionarFiguraMover(this.lista_id_figuras[0], nombre_grupo, MOVER_NADA)
                    }
                    if(this.lista_id_figuras.length>0 && this.seleccion_figuras){
                        this.seleccion_figuras = false
                        this.copia_lista_figuras = animacion.get_lista_figuras_duplicadas(nombre_grupo, this.lista_id_figuras)
                        this.seleccionarFigurasTransformar(nombre_grupo)
                    }
                }
            } else {
                this.seleccion_figuras = false
            }

        }

        if(this.seleccion_figuras) {
            if (nombre_grupo !== null) {
                const grupo = animacion.getGrupo(nombre_grupo)
                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    const figura = grupo.lista_figuras[j];
                    if (figura.tipo_figura === "RECTA") {
                        this.actualizarPuntosRectas(figura, grupo);
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        this.actualizarPuntoCentro(figura, grupo)
                    }

                    if (figura.tipo_figura === "CIRCULO") {
                        this.actualizarPuntosCirculo(figura, grupo)
                    }
                    if(rectsColliding(this.puntero_seleccion, this.p_centro)){
                        if(!this.lista_id_figuras.includes(figura.nombre)){
                            this.lista_id_figuras.push(figura.nombre);
                        }
                    }
                }
            }
        }
        //this.actualizarLienzo(animacion)
    }

    procesarTrabajoListaFiguras(eventoLienzoFigura, animacion, setAnimacion){

        if(eventoLienzoFigura.stack_event_teclado.includes("KeyQ")){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyE")){
                this.mover_figura = MOVER_CENTROS_FIGURAS;
                this.mover_centros=this.calcularCenTroFiguras(animacion)
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyB")){
                this.mover_figura = MOVER_ELIMINAR_FIGURAS;
                this.mover_centros=this.calcularCenTroFiguras(animacion)
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyD")){
                this.mover_figura = MOVER_DUPLICAR_FIGURAS;
                this.mover_centros=this.calcularCenTroFiguras(animacion)
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyF")){
                //this.mover_figura = MOVER_INFLAR_FIGURAS;
                //this.mover_centros=this.calcularCenTroFiguras(animacion)
            }
        }

        if(this.mover_figura === MOVER_NADA){
            //dibujar_circulo(ctx, "#14f7ff", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            let rect_seleccion = this.calcularCenTroFiguras(animacion)
            let p_sup = {
                x: rect_seleccion.sup_hor,
                y: rect_seleccion.sup_ver,
                w: 3,
                h: 3
            }
            if (eventoLienzoFigura.mouse_click_down && rectsColliding(this.puntero, p_sup)){
                console.log("INFLAR POR LA ESQUINA")
                this.mover_figura = MOVER_INFLAR_FIGURAS;
                this.copia_lista_figuras = animacion.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCenTroFiguras(animacion)
            }
        }

        if(this.mover_figura === MOVER_CENTROS_FIGURAS){
            console.log("MOVER CENTRO DE FIGURAS")
            //this.calcularCenTroFiguras(animacion)
            let nombre_grupo = this.id_grupo_selec;
            const grupo = animacion.getGrupo(nombre_grupo)
            let x = eventoLienzoFigura.mouse_x - grupo.cx;
            let y = eventoLienzoFigura.mouse_y - grupo.cy;
            let x_move =  x- this.mover_centros.centro_x;
            let y_move = y- this.mover_centros.centro_y;
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                if (this.lista_id_figuras.includes(figura.nombre)){
                    let f_copia = this.copia_lista_figuras.filter((f)=>f.nombre===figura.nombre)[0]
                    figura.atributos.cx = f_copia.atributos.cx + x_move;
                    figura.atributos.cy = f_copia.atributos.cy + y_move;
                }
            }
            if(eventoLienzoFigura.mouse_click_down){
                this.mover_figura = MOVER_NADA
            }
        }

        if(this.mover_figura === MOVER_ELIMINAR_FIGURAS){
            console.log("MOVER_ELIMINAR_FIGURAS 2222")
            console.log(this.id_grupo_selec)
            console.log(this.lista_id_figuras)
            console.log(animacion.getGrupo(this.id_grupo_selec))
            for (let i = 0; i < this.lista_id_figuras.length; i++) {
                animacion.borrar_figura(this.id_grupo_selec, this.lista_id_figuras[i])
            }
            this.mover_figura = MOVER_NADA;
            this.seleccion_figuras = true;
            this.lista_id_figuras = []
            setAnimacion({"edicion": animacion})
            console.log(animacion.getGrupo(this.id_grupo_selec))
        }

        if(this.mover_figura === MOVER_DUPLICAR_FIGURAS){
            console.log("MOVER_DUPLICAR_FIGURAS")
            animacion.duplicar_figuras_id_figuras(this.id_grupo_selec, this.lista_id_figuras)
            this.mover_figura = MOVER_CENTROS_FIGURAS
            setAnimacion({"edicion": animacion})
        }

        if(this.mover_figura === MOVER_INFLAR_FIGURAS){
            console.log("MOVER_INFLAR_FIGURAS")
            let nombre_grupo = this.id_grupo_selec;
            const grupo = animacion.getGrupo(nombre_grupo)

            if(eventoLienzoFigura.mouse_x> (this.mover_centros.centro_x+20)){
                const diff_ancho = (eventoLienzoFigura.mouse_x-10)-(this.mover_centros.sup_hor-10);
                const total_ancho = (this.mover_centros.ancho/2) -20
                const porcentaje = diff_ancho/total_ancho

                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    let figura = grupo.lista_figuras[j];
                    if (this.lista_id_figuras.includes(figura.nombre)){
                        let f_copia = this.copia_lista_figuras.filter((f)=>f.nombre===figura.nombre)[0]
                        if(figura.tipo_figura === "PUNTO"){
                            let x = this.mover_centros.centro_x - grupo.cx;
                            let y = this.mover_centros.centro_y - grupo.cy;

                            const angulo_figura = Fisica.angulo_recta(x, y,
                                f_copia.atributos.cx, f_copia.atributos.cy)
                            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                                f_copia.atributos.cx, f_copia.atributos.cy)

                            let dx = Math.cos(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
                            let dy = Math.sin(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
                            figura.atributos.cx = x+ dx
                            figura.atributos.cy = y+ dy
                        }
                        if(figura.tipo_figura === "RECTA"){

                            let x = this.mover_centros.centro_x - grupo.cx;
                            let y = this.mover_centros.centro_y - grupo.cy;

                            const x1 = f_copia.atributos.x1+f_copia.atributos.cx;
                            const y1 = f_copia.atributos.y1+f_copia.atributos.cy;

                            // solo se mueve los puntos, el problema es que se utiliza el centro de figura auxliar
                            const angulo_p1 = Fisica.angulo_recta(x, y, x1 ,y1)
                            const distancia_p1 = Fisica.distanciaEntreDosPuntos(x, y, x1 ,y1)
                            let dx = Math.cos(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)
                            let dy = Math.sin(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)

                            figura.atributos.x1 = parseInt(x+ dx)
                            figura.atributos.y1 = parseInt(y+ dy)


                            //x = this.mover_centros.centro_x - grupo.cx -figura1.atributos.cx;
                            //y = this.mover_centros.centro_y - grupo.cy -figura1.atributos.cy;

                            const x2 = f_copia.atributos.x2+f_copia.atributos.cx;
                            const y2 = f_copia.atributos.y2+f_copia.atributos.cy;

                            const angulo_p2 = Fisica.angulo_recta(x, y, x2 ,y2)
                            const distancia_p2 = Fisica.distanciaEntreDosPuntos(x, y, x2 ,y2)

                            dx = Math.cos(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)
                            dy = Math.sin(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)

                            figura.atributos.x2 = parseInt(x+ dx)
                            figura.atributos.y2 = parseInt(y+ dy)

                            x = this.mover_centros.centro_x - grupo.cx;
                            y = this.mover_centros.centro_y - grupo.cy;

                            const angulo_figura = Fisica.angulo_recta(x, y,
                                f_copia.atributos.cx, f_copia.atributos.cy)
                            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                                f_copia.atributos.cx, f_copia.atributos.cy)

                            dx = Math.cos(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
                            dy = Math.sin(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
                            figura.atributos.cx = 0
                            figura.atributos.cy = 0

                            animacion.set_figura(nombre_grupo, figura)
                            setAnimacion({"edicion": animacion})
                            //figura.atributos.cx =

                        }
                    }
                }
            }

            if(eventoLienzoFigura.mouse_click_up){
                this.mover_figura = MOVER_NADA;
            }
        }

        /*
        *
        * static double distanciaEntreDosPuntos(double x1, double y1, double x2, double y2)
        {
            return sqrt(pow(x2-x1, 2)+pow(y2-y1,2));
        }
        *
        * if(elemento->getTipoFigura()==PUNTO){
                PuntoObjeto * punto = (PuntoObjeto*)elemento;
                punto->p_aux[0]=punto->getXc();
                punto->p_aux[1]=punto->getYc();
                punto->setHipotenusa(Fisica::distanciaEntreDosPuntos(punto->getXc(), punto->getYc()
                                                                       , centrox_rotar, centroy_rotar));
            }

            if(elemento->getTipoFigura()==RECTA){
                RectaObjeto * r = (RectaObjeto*)elemento;
                int angulo_aux = (int)Fisica::angulo_recta(centrox_rotar, centroy_rotar,
                                                     r->getX1(), r->getY1());
                r->setAnguloP1(angulo_aux);

                angulo_aux = (int)Fisica::angulo_recta(centrox_rotar, centroy_rotar,
                                                     r->getX2(), r->getY2());
                r->setAnguloP2(angulo_aux);
                r->setHipotenusaP1(Fisica::distanciaEntreDosPuntos(r->getX1(), r->getY1(), centrox_rotar, centroy_rotar));
                r->setHipotenusaP2(Fisica::distanciaEntreDosPuntos(r->getX2(), r->getY2(), centrox_rotar, centroy_rotar));
                r->p1_aux[0]=r->getX1();
                r->p1_aux[1]=r->getY1();
                r->p2_aux[0]=r->getX2();
                r->p2_aux[1]=r->getY2();
            }
            if(elemento->getTipoFigura()==CIRCULO){
                CirculoObjeto * circulo = (CirculoObjeto*)elemento;
                circulo->setHipotenusa(Fisica::distanciaEntreDosPuntos(circulo->getXc(), circulo->getYc()
                                                                       , centrox_rotar, centroy_rotar));
                circulo->p_aux[0]=circulo->getXc();
                circulo->p_aux[1]=circulo->getYc();
                circulo->radio_aux = circulo->getRadioX();
            }
        * */
    }

    procesarTrabajoFigura(eventoLienzoFigura, animacion, setAnimacion){
        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;
        const grupo_ = animacion.getGrupo(nombre_grupo)
        let mover_centro_figura = false
        if (grupo_ != null) {
            const fig_ = animacion.get_figura(nombre_grupo, nombre_figura)

            if (fig_.tipo_figura === "RECTA" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosRectas(fig_, grupo_)
                if (rectsColliding(this.puntero, this.p1_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO1;
                } else if (rectsColliding(this.puntero, this.p2_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO2;
                } else if (this.mover_figura !== MOVER_CENTRO_FIGURA) {

                    if (rectsColliding(this.puntero, this.p_centro)) {
                        this.mover_figura = MOVER_CENTRO_FIGURA;
                        mover_centro_figura = true;
                    }
                }
            }

            if (fig_.tipo_figura === "CIRCULO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosCirculo(fig_, grupo_)
                if (rectsColliding(this.puntero, this.p_circulo)) {
                    this.mover_figura = MOVER_RADIO_CIRCULO;
                } else {
                    if (this.mover_figura !== MOVER_CENTRO_FIGURA) {
                        if (rectsColliding(this.puntero, this.p_centro)) {
                            this.mover_figura = MOVER_CENTRO_FIGURA;
                            mover_centro_figura = true;
                        }
                    }
                }
            }

            if (fig_.tipo_figura === "PUNTO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntoCentro(fig_, grupo_)
                if (this.mover_figura !== MOVER_CENTRO_FIGURA && rectsColliding(this.puntero, this.p_centro)) {
                    this.mover_figura = MOVER_CENTRO_FIGURA;
                    mover_centro_figura = true;
                }
            }

            if (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2) {
                let x = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy - fig_.atributos.cy;
                if (this.mover_figura === MOVER_RECTA_PUNTO1) {
                    fig_.atributos["x1"] = x;
                    fig_.atributos["y1"] = y;

                } else {
                    fig_.atributos["x2"] = x;
                    fig_.atributos["y2"] = y;
                }
                animacion.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": animacion})
            }

            if (this.mover_figura === MOVER_RADIO_CIRCULO) {
                let radio_ = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                if (radio_ > 0) {
                    fig_.atributos["radiox"] = radio_;
                    fig_.atributos["radioy"] = radio_;
                    animacion.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": animacion})
                }
            }

            if (this.mover_figura === MOVER_CENTRO_FIGURA) {
                let x = eventoLienzoFigura.mouse_x - grupo_.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy;
                fig_.atributos["cx"] = x;
                fig_.atributos["cy"] = y;
                animacion.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": animacion})
            }

            if (eventoLienzoFigura.mouse_click_up && (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2)) {
                this.mover_figura = MOVER_NADA;
            }

            if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_CENTRO_FIGURA && mover_centro_figura == false) {
                this.mover_figura = MOVER_NADA;
            }
            if (eventoLienzoFigura.mouse_click_up && this.mover_figura === MOVER_RADIO_CIRCULO) {
                this.mover_figura = MOVER_NADA;
            }
        }
    }

    procesarEventoLienzo(eventoLienzoFigura, animacion, setAnimacion) {
        if (this.categoria_trabajo === TRABAJO_FIGURA) {
            this.procesarTrabajoFigura(eventoLienzoFigura, animacion, setAnimacion)
        }

        if (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
            this.procesarTrabajoListaFiguras(eventoLienzoFigura, animacion, setAnimacion)
        }
        this.procesarSeleccionPuntero(eventoLienzoFigura, animacion);
        this.actualizarLienzo(animacion)
    }

    actualizarPuntoCentro(fig_, grupo_) {
        const x = parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y = parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        this.p_centro.x = x - 2
        this.p_centro.y = y - 2
    }

    actualizarPuntosCirculo(fig_, grupo_) {
        const x = parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y = parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        const rx = parseInt(fig_.atributos.radiox);

        this.p_circulo.x = x + rx + 2
        this.p_circulo.y = y - 2

        this.p_centro.x = x - 2
        this.p_centro.y = y - 2
    }

    actualizarPuntosRectas(fig_, grupo_) {
        const x1 = parseInt(fig_.atributos.x1) + parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y1 = parseInt(fig_.atributos.y1) + parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        const x2 = parseInt(fig_.atributos.x2) + parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y2 = parseInt(fig_.atributos.y2) + parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);

        this.p1_recta.x = x1 - this.p1_recta.w / 2;
        this.p1_recta.y = y1 - this.p1_recta.h / 2;

        this.p2_recta.x = x2 - this.p2_recta.w / 2;
        this.p2_recta.y = y2 - this.p2_recta.h / 2;

        this.p_centro.x = parseInt((x1 + x2) / 2) - 2
        this.p_centro.y = parseInt((y1 + y2) / 2) - 2
    }

    imprimir_recta(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        dibujar_linea(ctx, color_, x1, y1, x2, y2)
        if (seleccion) {
            this.actualizarPuntosRectas(figura, grupo)
            dibujar_rectangulo(ctx, color_seleccion, this.p1_recta.x, this.p1_recta.y,
                this.p1_recta.w, this.p1_recta.h)

            dibujar_rectangulo(ctx, color_seleccion, this.p2_recta.x, this.p2_recta.y,
                this.p2_recta.w, this.p2_recta.h)

            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    imprimir_circulo(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        const rx = parseInt(figura.atributos.radiox);
        const ry = parseInt(figura.atributos.radioy);
        dibujar_circulo(ctx, color_, x, y, rx, ry)
        this.actualizarPuntosCirculo(figura, grupo)
        if (seleccion) {
            dibujar_rectangulo(ctx, color_seleccion, this.p_circulo.x, this.p_circulo.y,
                this.p_circulo.w, this.p_circulo.h)
            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    imprimir_punto(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        dibujar_punto(ctx, color_, x, y, 2)
        if (seleccion) {
            this.actualizarPuntoCentro(figura, grupo)
            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    actualizarLienzo(animacion) {
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        for (let i = 0; i < lista_grupo_root.length; i++) {
            const grupo = lista_grupo_root[i]
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                let seleccion = null;
                let color_figura = grupo.color;
                if (this.categoria_trabajo === TRABAJO_FIGURA || this.categoria_trabajo === TRABAJO_LISTA_FIGURAS) {
                    seleccion = grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec;
                    if(this.lista_id_figuras.includes(figura.nombre)){
                        color_figura = "#ff00a1";
                    }
                    if (figura.tipo_figura === "RECTA") {
                        this.imprimir_recta(ctx, figura, grupo, color_figura, seleccion);
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        this.imprimir_punto(ctx, figura, grupo, color_figura, seleccion);
                    }

                    if (figura.tipo_figura === "CIRCULO") {
                        this.imprimir_circulo(ctx, figura, grupo, color_figura, seleccion);
                    }
                }
            }

        }
        if (this.seleccion_figuras) {
            //console.log(this.seleccion_figuras)
            dibujar_rectangulo(ctx, "#1447ff", this.puntero_seleccion.x, this.puntero_seleccion.y,
                this.puntero_seleccion.w, this.puntero_seleccion.h)
        }

        if(this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
            const rect_seleccion = this.calcularCenTroFiguras(animacion)
            dibujar_rectangulo(ctx, "#14f7ff", rect_seleccion.inf_hor, rect_seleccion.inf_ver,
                rect_seleccion.ancho, rect_seleccion.alto)
            dibujar_rectangulo(ctx, "#14f7ff", rect_seleccion.centro_x, rect_seleccion.centro_y,
                this.p_centro.w, this.p_centro.h)

            //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
                dibujar_circulo(ctx, "#14f7ff", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            //}
        }

    }

    calcularCenTroFiguras(animacion) {
        let nombre_grupo = this.id_grupo_selec;
        const grupo = animacion.getGrupo(nombre_grupo)
        if (grupo != null) {
            let inf_hor = Number.POSITIVE_INFINITY;
            let inf_ver = Number.POSITIVE_INFINITY;
            let sup_hor = Number.NEGATIVE_INFINITY;
            let sup_ver = Number.NEGATIVE_INFINITY;
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                if (this.lista_id_figuras.includes(figura.nombre)) {
                    if (figura.tipo_figura === "RECTA") {
                        const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        //console.log(x1, y1)
                        inf_hor = Math.min(...[x1, x2, inf_hor])
                        sup_hor = Math.max(...[x1, x2, sup_hor])

                        //----------------------------------------
                        inf_ver = Math.min(...[y1, y2, inf_ver])
                        sup_ver = Math.max(...[y1, y2, sup_ver])
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);

                        inf_hor = Math.min(...[x, inf_hor])
                        sup_hor = Math.max(...[x, sup_hor])
                        //----------------------------------------
                        inf_ver = Math.min(...[y, inf_ver])
                        sup_ver = Math.max(...[y, sup_ver])

                    }

                    if (figura.tipo_figura === "CIRCULO") {

                        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        const rx = parseInt(figura.atributos.radiox);
                        const ry = parseInt(figura.atributos.radioy);

                        inf_hor = Math.min(...[x - rx, inf_hor])
                        sup_hor = Math.max(...[x + rx, sup_hor])
                        //----------------------------------------
                        inf_ver = Math.min(...[y - ry, inf_ver])
                        sup_ver = Math.max(...[y + ry, sup_ver])
                    }
                }
            }
            let centro_figuras = {...this.mover_centros}
            const margen = 10;
            centro_figuras.inf_hor = inf_hor-margen;
            centro_figuras.sup_hor = sup_hor+margen;
            centro_figuras.inf_ver = inf_ver-margen;
            centro_figuras.sup_ver = sup_ver+margen;
            centro_figuras.ancho = (sup_hor-inf_hor)+margen*2;
            centro_figuras.alto = (sup_ver-inf_ver)+margen*2;
            centro_figuras.centro_x = inf_hor+(sup_hor-inf_hor)/2;
            centro_figuras.centro_y = inf_ver+(sup_ver-inf_ver)/2;
            return centro_figuras
        }
    }
};

function dibujar_punto(ctx, color, x, y, size=1) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    //ctx.stroke();
}

function dibujar_circulo(ctx, color, xc, yc, rx, ry) {
    let x = 0;
    let y = ry;
    const rx2 = Math.pow(rx, 2);
    const ry2 = Math.pow(ry, 2);
    let p1 = ry2 - (rx2 * ry) + (0.25 * rx2);
    while ((ry2 * x) < (rx2 * y)) {
        if (p1 < 0) {
            x++;
            p1 = p1 + (2 * ry2 * x) + ry2;
        } else {
            x++;
            y--;
            p1 = p1 + (2 * ry2 * x) - (2 * rx2 * y) + ry2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
        /*grupoPixeles.push_back(unPixel(xc+x, yc+y));
        grupoPixeles.push_back(unPixel(xc-x, yc+y));
        grupoPixeles.push_back(unPixel(xc+x, yc-y));
        grupoPixeles.push_back(unPixel(xc-x, yc-y));*/
    }
    let p2 = (ry2) * Math.pow((x + 0.5), 2) + (rx2) * Math.pow((y - 1), 2) - (rx2 * ry2);
    while (y > 0) {
        if (p2 > 0) {
            y--;
            p2 = p2 - (2 * rx2 * y) + rx2;
        } else {
            x++;
            y--;
            p2 = p2 + (2 * ry2 * x) - (2 * rx2 * y) + rx2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function dibujar_rectangulo(ctx, color, x, y, w, h) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
}

function rectsColliding(r1, r2) {
    if(r1.w === 0 || r1.h === 0 || r2.w === 0 || r2.h === 0){
        return false;
    }
   let r_1 = {...r1}
   if(r_1.w < 0){
       r_1.x+=r_1.w;
       r_1.w = r_1.w*-1
    }

    if(r_1.h < 0){
        r_1.y+=r_1.h;
        r_1.h = r_1.h*-1
    }

    return !(r_1.x > r2.x + r2.w || r_1.x + r_1.w < r2.x || r_1.y > r2.y + r2.h || r_1.y + r_1.h < r2.y);
}

export default GestionLienzoAnimacion