import Fisica from "./Fisica";
import {normalizar_recta} from "./GestionAnimacion";

const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_LISTA_FIGURAS = 1;
const TRABAJO_GRUPOS = 2;
//const TRABAJO_GRUPOS = 3;

const MOVER_NADA = 0
const MOVER_CENTRO_FIGURA = 1;
const MOVER_RECTA_PUNTO1 = 2;
const MOVER_RECTA_PUNTO2 = 3;
const MOVER_RADIO_CIRCULO = 4;
const MOVER_FIGURA_AGREGADA = 5;

const MOVER_CENTROS_FIGURAS = 6;
const MOVER_ROTAR_FIGURAS = 7;
const MOVER_INFLAR_FIGURAS = 8;
const MOVER_ELIMINAR_FIGURAS = 9;
const MOVER_DUPLICAR_FIGURAS = 10;

const MOVER_CENTRO_GRUPOS = 11;
const MOVER_ROTAR_GRUPOS = 12;
const MOVER_INFLAR_GRUPOS = 13;
const MOVER_DUPLICAR_GRUPOS = 14;
const MOVER_BORRAR_GRUPOS = 15;
const MOVER_CENTRAR_GRUPOS = 16;
const MOVER_ESPEJO_GRUPOS = 17;

const REFLEJO_NONE = 0;
const REFLEJO_HORIZONTAL = 1;
const REFLEJO_VERTICAL = 2;

const RECTA_MOVER_TODO = 0;
const RECTA_MOVER_P1 = 1;


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
    anterior_mover_figura = MOVER_NADA;

    editar_lienzo = false;
    funcion_editar_lienzo = null;

    lista_grupos_trabajando = [];
    copia_lista_grupos = []

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

    pivote_rotacion = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }
    moviendo_pivote_r = false
    rotar_lista_grupos = false

    inflar_grupos = false


    //trabajando sobre el espejo de los grupos
    espejo_sentido_reflejo = REFLEJO_NONE;
    reflejo_original_horz=false;
    reflejo_original_vert=false;

    //trabajando sobre figuras agregadas recientemente
    movimiento_recta_agregada = MOVER_NADA;

    //evitar conflicto por concurrencia
    act_grupos_concurrente = false
    grupos_figuras_concurrent = null;
    //desactivar el proceso principal
    proceso_principal_activo = true


    constructor(animacion_) {
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
        this.animacion_ = animacion_
    }

    setGrupoFigurasCurrent(grupos_){
        this.act_grupos_concurrente =true;
        this.grupos_figuras_concurrent = grupos_;
    }

    aplicarCambiosConcurrente(){
        if(this.act_grupos_concurrente && this.grupos_figuras_concurrent !== null){
            console.log("APLICAR GRUPOS CONCURRENTES!!!!")
            this.animacion_.grupos_figuras = this.grupos_figuras_concurrent;
            this.act_grupos_concurrente = false;
            this.mover_figura = MOVER_NADA
            this.categoria_trabajo = TRABAJO_NONE;
        }
    }


    //proceso que es llamado por componente de react para proceder a intereactuar a nivel de grupo
    seleccionListaGrupos(lista_grupos){
        this.lista_grupos_trabajando = lista_grupos;
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
        this.mover_centros=this.calcularCentroGruposSeleccionados()
        this.pivote_rotacion.x = this.mover_centros.centro_x;
        this.pivote_rotacion.y = this.mover_centros.centro_y;

    }

    seleccionGrupoMover(lista_grupos){
        console.log("seleccionarGRUPOS")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_CENTRO_GRUPOS;
        //this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
        //this.mover_centros=this.calcularCentroGruposSeleccionados()
        console.log("[CALCULO CENTRO DE GRUPOS]")
        console.log(this.mover_centros)
    }

    seleccionGrupoCentrar(lista_grupos){
        console.log("seleccionGrupoCentrar")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_CENTRAR_GRUPOS;
    }

    seleccionGrupoDuplicar(lista_grupos){
        console.log("seleccionarGRUPOSDuplicar")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_DUPLICAR_GRUPOS;
        //this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
        //this.mover_centros=this.calcularCentroGruposSeleccionados()
    }

    seleccionGrupoRotar(lista_grupos){
        console.log("seleccionGrupoRotar231432432423")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_ROTAR_GRUPOS;
        this.actualizarLienzo();
    }

    seleccionGrupoTamano(lista_grupos){
        console.log("seleccionGrupoTamano")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_INFLAR_GRUPOS;
        //this.actualizarLienzo();
    }

    seleccionGrupoBorrar(lista_grupos){
        console.log("seleccionGrupoBorrar")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_BORRAR_GRUPOS;
    }

    seleccionGrupoEspejo(lista_grupos){
        console.log("seleccionGrupoEspejo")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_ESPEJO_GRUPOS;
        this.reflejo_original_horz=false;
        this.reflejo_original_vert=false;
    }

    espejoReflejoHorizontal(lista_grupos){
        console.log("espejoReflejoHorizontal")
        this.espejo_sentido_reflejo = REFLEJO_HORIZONTAL;
        this.reflejo_original_horz = !this.reflejo_original_horz;
    }
    espejoReflejoVertical(lista_grupos){
        console.log("espejoReflejoVertical")
        this.espejo_sentido_reflejo = REFLEJO_VERTICAL;
        this.reflejo_original_vert = !this.reflejo_original_vert;
    }

    seleccionarFiguraAgregada(nombre_figura_, nombre_grupo_){
        this.categoria_trabajo = TRABAJO_FIGURA;
        this.id_grupo_selec = nombre_grupo_;
        this.id_figura_selec = nombre_figura_;
        this.mover_figura = MOVER_FIGURA_AGREGADA;
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

    procesarSeleccionPuntero(eventoLienzoFigura){
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
                        this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(nombre_grupo, this.lista_id_figuras)
                        this.seleccionarFigurasTransformar(nombre_grupo)
                    }
                }
            } else {
                this.seleccion_figuras = false
            }

        }

        if(this.seleccion_figuras) {
            if (nombre_grupo !== null) {
                const grupo = this.animacion_.getGrupo(nombre_grupo)
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

    procesarTrabajoListaFiguras(eventoLienzoFigura, setAnimacion){

        if(eventoLienzoFigura.stack_event_teclado.includes("KeyQ") && this.mover_figura === MOVER_NADA){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyE")){
                this.mover_figura = MOVER_CENTROS_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyB")){
                this.mover_figura = MOVER_ELIMINAR_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyD")){
                this.mover_figura = MOVER_DUPLICAR_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyF")){
                //this.mover_figura = MOVER_INFLAR_FIGURAS;
                //this.mover_centros=this.calcularCentroFigurasSeleccionadas(animacion)
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyG")){
                this.mover_figura = MOVER_ROTAR_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
        }

        this.anterior_mover_figura = this.mover_figura;

        if(this.mover_figura === MOVER_NADA){
            //dibujar_circulo(ctx, "#14f7ff", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            let rect_seleccion = this.calcularCentroFigurasSeleccionadas()
            let p_sup = {
                x: rect_seleccion.sup_hor,
                y: rect_seleccion.sup_ver,
                w: 3,
                h: 3
            }
            if (eventoLienzoFigura.mouse_click_down && rectsColliding(this.puntero, p_sup)){
                console.log("INFLAR POR LA ESQUINA")
                this.mover_figura = MOVER_INFLAR_FIGURAS;
                this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
        }

        if(this.mover_figura === MOVER_CENTROS_FIGURAS){
            console.log("MOVER CENTRO DE FIGURAS")
            //this.calcularCentroFigurasSeleccionadas(animacion)
            let nombre_grupo = this.id_grupo_selec;
            const grupo = this.animacion_.getGrupo(nombre_grupo)
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
            console.log(this.animacion_.getGrupo(this.id_grupo_selec))
            for (let i = 0; i < this.lista_id_figuras.length; i++) {
                this.animacion_.borrar_figura(this.id_grupo_selec, this.lista_id_figuras[i])
            }
            this.mover_figura = MOVER_NADA;
            this.seleccion_figuras = true;
            this.lista_id_figuras = []
            setAnimacion({"edicion": this.animacion_})
            console.log(this.animacion_.getGrupo(this.id_grupo_selec))
        }

        if(this.mover_figura === MOVER_DUPLICAR_FIGURAS){
            console.log("MOVER_DUPLICAR_FIGURAS")
            this.animacion_.duplicar_figuras_id_figuras(this.id_grupo_selec, this.lista_id_figuras)
            this.mover_figura = MOVER_CENTROS_FIGURAS
            setAnimacion({"edicion": this.animacion_})
        }

        if(this.mover_figura === MOVER_INFLAR_FIGURAS){
            console.log("MOVER_INFLAR_FIGURAS")
            let nombre_grupo = this.id_grupo_selec;
            const grupo = this.animacion_.getGrupo(nombre_grupo)

            if(eventoLienzoFigura.mouse_x> (this.mover_centros.centro_x+20)){
                const diff_ancho = (eventoLienzoFigura.mouse_x-10)-(this.mover_centros.sup_hor-10);
                const total_ancho = (this.mover_centros.ancho/2) -20
                const porcentaje = diff_ancho/total_ancho

                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    let figura = grupo.lista_figuras[j];
                    if (this.lista_id_figuras.includes(figura.nombre)){
                        let f_copia = this.copia_lista_figuras.filter((f)=>f.nombre===figura.nombre)[0]

                        this.inflar_figura(figura, f_copia, grupo, this.mover_centros.centro_x,
                            this.mover_centros.centro_y, porcentaje)
                    }
                }
                setAnimacion({"edicion": this.animacion_})
            }

            if(eventoLienzoFigura.mouse_click_up){
                this.mover_figura = MOVER_NADA;
                this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
        }

        if(this.mover_figura === MOVER_ROTAR_FIGURAS){
            console.log("MOVER_ROTAR_FIGURAS")
            let nombre_grupo = this.id_grupo_selec;
            const grupo = this.animacion_.getGrupo(nombre_grupo)

            if(true){
                const angulo_rotacion = Fisica.angulo_recta(this.mover_centros.centro_x, this.mover_centros.centro_y
                    ,eventoLienzoFigura.mouse_x, eventoLienzoFigura.mouse_y);

                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    let figura = grupo.lista_figuras[j];
                    if (this.lista_id_figuras.includes(figura.nombre)){
                        let f_copia = this.copia_lista_figuras.filter((f)=>f.nombre===figura.nombre)[0]
                        this.rotar_figura(figura, f_copia, grupo,angulo_rotacion,
                            this.mover_centros.centro_x, this.mover_centros.centro_y)
                    }
                }
                setAnimacion({"edicion": this.animacion_})
            }
            if(eventoLienzoFigura.mouse_click_down){
                this.mover_figura = MOVER_NADA
                this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }

        }

        if(this.anterior_mover_figura !== MOVER_NADA && this.mover_figura === MOVER_NADA){
            this.editar_lienzo = true;
        }
    }

    procesarTrabajoFigura(eventoLienzoFigura, setAnimacion){


        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;
        const grupo_ = this.animacion_.getGrupo(nombre_grupo)
        let mover_centro_figura = false
        if (grupo_ != null) {
            const fig_ = this.animacion_.get_figura(nombre_grupo, nombre_figura)

            if(this.mover_figura === MOVER_FIGURA_AGREGADA && fig_.tipo_figura !== "RECTA"){
                this.mover_figura = MOVER_CENTRO_FIGURA;
            }

            if (fig_.tipo_figura === "RECTA" && eventoLienzoFigura.mouse_only_click && this.mover_figura !== MOVER_FIGURA_AGREGADA) {
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

                }
                if (this.mover_figura === MOVER_RECTA_PUNTO2){
                    fig_.atributos["x2"] = x;
                    fig_.atributos["y2"] = y;
                }


                this.animacion_.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": this.animacion_})
            }

            if(this.mover_figura === MOVER_FIGURA_AGREGADA){
                let x = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy - fig_.atributos.cy;
                if (this.movimiento_recta_agregada === RECTA_MOVER_TODO){
                    fig_.atributos["x1"] = fig_.atributos["x2"] = x;
                    fig_.atributos["y1"] = fig_.atributos["y2"] = y;
                }
            }

            if (this.mover_figura === MOVER_RADIO_CIRCULO) {
                let radio_ = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                if (radio_ > 0) {
                    fig_.atributos["radiox"] = radio_;
                    fig_.atributos["radioy"] = radio_;
                    this.animacion_.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": this.animacion_})
                }
            }

            if (this.mover_figura === MOVER_CENTRO_FIGURA) {
                let x = eventoLienzoFigura.mouse_x - grupo_.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy;
                fig_.atributos["cx"] = x;
                fig_.atributos["cy"] = y;
                this.animacion_.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": this.animacion_})
            }

            this.anterior_mover_figura = this.mover_figura;

            if (eventoLienzoFigura.mouse_click_up && (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2)) {
                this.mover_figura = MOVER_NADA;
            }

            if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_CENTRO_FIGURA && mover_centro_figura == false) {
                this.mover_figura = MOVER_NADA;
            }
            if (eventoLienzoFigura.mouse_click_up && this.mover_figura === MOVER_RADIO_CIRCULO) {
                this.mover_figura = MOVER_NADA;
            }

            if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_FIGURA_AGREGADA && fig_.tipo_figura === "RECTA") {
                console.log("MOVER AHORA EL PUNTO1")
                this.mover_figura = MOVER_RECTA_PUNTO1;
            }

            if(this.anterior_mover_figura !== MOVER_NADA && this.mover_figura === MOVER_NADA){
                this.editar_lienzo = true;
            }
        }
    }

    procesarTrabajoListaGrupos(eventoLienzoFigura, setAnimacion, actListaTrabajo){
        if(eventoLienzoFigura.stack_event_teclado.includes("KeyQ") && this.mover_figura === MOVER_NADA){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyE")){
                console.log("[SELECCION DE GRUPOS]")
                this.mover_figura = MOVER_CENTRO_GRUPOS;
                this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(["marco","rayos_rueda"])
                this.mover_centros=this.calcularCentroGruposSeleccionados()
            }
        }

        if(eventoLienzoFigura.stack_event_teclado.includes("KeyQ") &&
            this.mover_figura === MOVER_ROTAR_GRUPOS){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyG")){
                console.log("rotar_lista_grupos")
                this.rotar_lista_grupos = true;
            }
        }
        this.anterior_mover_figura = this.mover_figura;

        if(this.mover_figura === MOVER_INFLAR_GRUPOS){
            let rect_seleccion = this.calcularCentroGruposSeleccionados()
            let p_sup = {
                x: rect_seleccion.sup_hor,
                y: rect_seleccion.sup_ver,
                w: 3,
                h: 3
            }
            if(this.inflar_grupos === false){
                if(eventoLienzoFigura.mouse_click_down && rectsColliding(this.puntero, p_sup)){
                    console.log("inflar_lista_grupos")
                    this.inflar_grupos = true;
                    this.mover_centros=this.calcularCentroGruposSeleccionados()
                }
            }else{
                if(eventoLienzoFigura.mouse_click_down){
                    this.inflar_grupos = false;
                    setAnimacion({"edicion": this.animacion_})
                    let lista_grupos = this.copia_lista_grupos.map(g=>g.nombre)
                    this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
                    this.editar_lienzo = true;
                }
            }
        }

        if(this.mover_figura === MOVER_CENTRO_GRUPOS){
            this.mover_lista_grupos(this.mover_centros.centro_x, this.mover_centros.centro_y,
                eventoLienzoFigura.mouse_x, eventoLienzoFigura.mouse_y  )
            if(eventoLienzoFigura.mouse_click_down){
                setAnimacion({"edicion": this.animacion_})
                this.mover_figura = MOVER_NADA
            }
        }

        if(this.mover_figura === MOVER_DUPLICAR_GRUPOS){
            const lista_nombre_grupos = this.copia_lista_grupos.map((g)=>{
                return g.nombre
            })
            const nombre_grupo_duplicado = this.animacion_.duplicar_internamente_lista_grupos_(lista_nombre_grupos)
            this.mover_figura = MOVER_CENTRO_GRUPOS;
            this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(nombre_grupo_duplicado)
            this.lista_grupos_trabajando = nombre_grupo_duplicado
            setAnimacion({"edicion": this.animacion_})
            console.log(this.lista_grupos_trabajando)
            actListaTrabajo(nombre_grupo_duplicado)
            //this.actualizarLienzo()
        }

        if(this.mover_figura === MOVER_ROTAR_GRUPOS){
            let tocando_pivote = rectsColliding(this.puntero, this.pivote_rotacion) &&
                eventoLienzoFigura.mouse_only_click;

            if(this.rotar_lista_grupos === false){
                if(this.moviendo_pivote_r === false){
                    if (tocando_pivote) {
                        console.log("haciendo click en el pivote")
                        this.moviendo_pivote_r = true;
                    }
                }else{
                    if (tocando_pivote){
                        this.moviendo_pivote_r = false;
                    }
                    this.pivote_rotacion.x = this.puntero.x;
                    this.pivote_rotacion.y = this.puntero.y;
                }
            }else{

                if(eventoLienzoFigura.mouse_only_click){
                    this.rotar_lista_grupos = false
                    setAnimacion({"edicion": this.animacion_})
                    this.editar_lienzo = true;
                }

                const angulo_rotacion = Fisica.angulo_recta(this.pivote_rotacion.x, this.pivote_rotacion.y
                    ,eventoLienzoFigura.mouse_x, eventoLienzoFigura.mouse_y);

                for (let i=0; i<this.copia_lista_grupos.length; i++){
                    const grupo_copia = this.copia_lista_grupos[i]
                    const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);

                    for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                        let figura = grupo_.lista_figuras[j];

                        let f_copia = grupo_copia.lista_figuras[j];
                        let f_nuevo=this.rotar_figura(figura, f_copia, grupo_,angulo_rotacion,
                            this.pivote_rotacion.x, this.pivote_rotacion.y)

                        //this.animacion_.set_figura(grupo_.nombre, f_nuevo)

                    }
                }

            }
        }

        if(this.mover_figura === MOVER_INFLAR_GRUPOS){
            if (this.inflar_grupos){
                if(eventoLienzoFigura.mouse_x> (this.mover_centros.centro_x+20)){
                    const diff_ancho = (eventoLienzoFigura.mouse_x-10)-(this.mover_centros.sup_hor-10);
                    const total_ancho = (this.mover_centros.ancho/2) -20
                    const porcentaje = diff_ancho/total_ancho

                    for (let i=0; i<this.copia_lista_grupos.length; i++){
                        const grupo_copia = this.copia_lista_grupos[i]
                        const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);

                        for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                            let figura = grupo_.lista_figuras[j];
                            if (true){//(this.lista_id_figuras.includes(figura.nombre)){
                                let f_copia = grupo_copia.lista_figuras[j];

                                this.inflar_figura(figura, f_copia, grupo_, this.mover_centros.centro_x,
                                    this.mover_centros.centro_y, porcentaje)
                            }
                        }
                    }
                }
            }
        }

        if(this.mover_figura === MOVER_CENTRAR_GRUPOS){
            this.mover_centros=this.calcularCentroGruposSeleccionados()
            this.mover_lista_grupos(this.mover_centros.centro_x, this.mover_centros.centro_y,
                300,300)
            this.mover_figura = MOVER_NADA;
        }

        if(this.mover_figura === MOVER_ESPEJO_GRUPOS){
            if(this.espejo_sentido_reflejo !== REFLEJO_NONE){
                this.mover_centros=this.calcularCentroGruposSeleccionados(true);
                for (let i=0; i<this.copia_lista_grupos.length; i++){
                    const grupo_copia = this.copia_lista_grupos[i]
                    const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);
                    let centrox = this.mover_centros.centro_x;
                    let centroy = this.mover_centros.centro_y;
                    for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                        const figura = grupo_.lista_figuras[j];
                        const f_copia = grupo_copia.lista_figuras[j];
                        this.espejo_figura(figura, f_copia, grupo_copia,centrox, centroy)
                    }
                }
                this.espejo_sentido_reflejo = REFLEJO_NONE;
                this.editar_lienzo = true;
            }
        }

        if(this.mover_figura === MOVER_BORRAR_GRUPOS){
            for (let i=0; i<this.copia_lista_grupos.length; i++){
                const grupo_copia = this.copia_lista_grupos[i];
                this.animacion_.borrar_grupo(grupo_copia.nombre)
            }
            actListaTrabajo([]);
            this.mover_figura = MOVER_NADA;
            console.log("[Terminado de borrar los grupos]")
        }

        if(this.anterior_mover_figura !== MOVER_NADA && this.mover_figura === MOVER_NADA){
            this.editar_lienzo = true;
        }
    }

    espejo_figura(figura, f_copia,grupo_copia, centrox, centroy){
        let deff_x = 0;
        let deff_y = 0;
        if(figura.tipo_figura === "PUNTO" || figura.tipo_figura === "CIRCULO"){
            if(this.espejo_sentido_reflejo === REFLEJO_HORIZONTAL){
                if(this.reflejo_original_horz){
                    deff_x = centrox*2-(f_copia.atributos.cx+grupo_copia.cx*2);
                    figura.atributos.cx = deff_x
                }else{
                    figura.atributos.cx = f_copia.atributos.cx
                }
            }
            if(this.espejo_sentido_reflejo === REFLEJO_VERTICAL){
                if(this.reflejo_original_vert){
                    deff_y = centroy*2-(f_copia.atributos.cy+grupo_copia.cy*2);
                    figura.atributos.cy = deff_y
                }else{
                    figura.atributos.cy = f_copia.atributos.cy
                }
            }
        }

        if(figura.tipo_figura === "RECTA"){
            if(this.espejo_sentido_reflejo === REFLEJO_HORIZONTAL){

                if(this.espejo_sentido_reflejo === REFLEJO_HORIZONTAL){
                    if(this.reflejo_original_horz){
                        deff_x = centrox*2-(f_copia.atributos.cx+grupo_copia.cx*2);
                        figura.atributos.cx = deff_x
                        figura.atributos.x1 = figura.atributos.x1*-1;
                        figura.atributos.x2 = figura.atributos.x2*-1;
                    }else{
                        figura.atributos.cx = f_copia.atributos.cx
                        figura.atributos.x1 = f_copia.atributos.x1
                        figura.atributos.x2 = f_copia.atributos.x2
                    }
                }
            }
            if(this.espejo_sentido_reflejo === REFLEJO_VERTICAL){
                if(this.reflejo_original_vert){
                    deff_y = centroy*2-(f_copia.atributos.cy+grupo_copia.cy*2);
                    figura.atributos.cy = deff_y

                    figura.atributos.y1 = figura.atributos.y1*-1;
                    figura.atributos.y2 = figura.atributos.y2*-1;
                }else{
                    figura.atributos.cy = f_copia.atributos.cy
                    figura.atributos.y1 = f_copia.atributos.y1
                    figura.atributos.y2 = f_copia.atributos.y2
                }

            }
        }
    }

    rotar_figura(figura, f_copia, grupo, angulo_rotacion, pivote_x, pivote_y){
        if(figura.tipo_figura === "PUNTO"  || figura.tipo_figura === "CIRCULO" ){
            console.log("rotar punto: ", figura.nombre)
            let x = pivote_x - grupo.cx;
            let y = pivote_y - grupo.cy;

            const angulo_figura = Fisica.angulo_recta(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)
            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)

            const algulo_nuevo = angulo_rotacion+ angulo_figura;

            let dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo))*distancia;
            let dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo))*distancia;
            figura.atributos.cx = parseInt(x+ dx)
            figura.atributos.cy = parseInt(y+ dy)
        }
        if(figura.tipo_figura === "RECTA"){
            let x = pivote_x - grupo.cx;
            let y = pivote_y - grupo.cy;

            const x1 = f_copia.atributos.x1+f_copia.atributos.cx;
            const y1 = f_copia.atributos.y1+f_copia.atributos.cy;

            const angulo_p1 = Fisica.angulo_recta(x, y, x1 ,y1)
            const distancia_p1 = Fisica.distanciaEntreDosPuntos(x, y, x1 ,y1)

            const algulo_nuevo_p1 = angulo_rotacion+ angulo_p1;
            let dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo_p1))*distancia_p1
            let dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo_p1))*distancia_p1

            figura.atributos.x1 = parseInt(x+ dx)
            figura.atributos.y1 = parseInt(y+ dy)

            const x2 = f_copia.atributos.x2+f_copia.atributos.cx;
            const y2 = f_copia.atributos.y2+f_copia.atributos.cy;

            const angulo_p2 = Fisica.angulo_recta(x, y, x2 ,y2)
            const distancia_p2 = Fisica.distanciaEntreDosPuntos(x, y, x2 ,y2)

            const algulo_nuevo_p2 = angulo_rotacion+ angulo_p2;

            dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo_p2))*distancia_p2
            dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo_p2))*distancia_p2

            figura.atributos.x2 = parseInt(x+ dx)
            figura.atributos.y2 = parseInt(y+ dy)

            figura.atributos.cx = 0
            figura.atributos.cy = 0

            //this.animacion_.set_figura(nombre_grupo, figura)
        }
        return figura
    }

    inflar_figura(figura, f_copia, grupo_, centrox, centroy, porcentaje){
        if(figura.tipo_figura === "PUNTO" || figura.tipo_figura === "CIRCULO"){
            let x = centrox - grupo_.cx;
            let y = centroy - grupo_.cy;

            const angulo_figura = Fisica.angulo_recta(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)
            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)

            let dx = Math.cos(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
            let dy = Math.sin(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
            figura.atributos.cx = parseInt(x+ dx)
            figura.atributos.cy = parseInt(y+ dy)

            if(figura.tipo_figura === "CIRCULO"){
                figura.atributos.radiox = parseInt(f_copia.atributos.radiox+ f_copia.atributos.radiox*porcentaje)
                figura.atributos.radioy = parseInt(f_copia.atributos.radioy+ f_copia.atributos.radioy*porcentaje)
            }
        }
        if(figura.tipo_figura === "RECTA"){

            let x = centrox - grupo_.cx;
            let y = centroy - grupo_.cy;

            const x1 = f_copia.atributos.x1+f_copia.atributos.cx;
            const y1 = f_copia.atributos.y1+f_copia.atributos.cy;

            const angulo_p1 = Fisica.angulo_recta(x, y, x1 ,y1)
            const distancia_p1 = Fisica.distanciaEntreDosPuntos(x, y, x1 ,y1)
            let dx = Math.cos(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)
            let dy = Math.sin(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)

            figura.atributos.x1 = parseInt(x+ dx)
            figura.atributos.y1 = parseInt(y+ dy)

            const x2 = f_copia.atributos.x2+f_copia.atributos.cx;
            const y2 = f_copia.atributos.y2+f_copia.atributos.cy;

            const angulo_p2 = Fisica.angulo_recta(x, y, x2 ,y2)
            const distancia_p2 = Fisica.distanciaEntreDosPuntos(x, y, x2 ,y2)

            dx = Math.cos(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)
            dy = Math.sin(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)

            figura.atributos.x2 = parseInt(x+ dx)
            figura.atributos.y2 = parseInt(y+ dy)

            figura.atributos.cx = 0
            figura.atributos.cy = 0

            //this.animacion_.set_figura(nombre_grupo, figura)
        }
    }

    mover_lista_grupos(orig_x, orig_y, des_x,  des_y){
        for (let i=0; i<this.copia_lista_grupos.length; i++){
            const grupo_copia = this.copia_lista_grupos[i]
            const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);
            let x = des_x ;
            let y = des_y ;
            let x_move =  x- orig_x;
            let y_move = y- orig_y;

            for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                const figura = grupo_.lista_figuras[j];
                const f_copia = grupo_copia.lista_figuras[j];
                figura.atributos.cx = f_copia.atributos.cx + x_move;
                figura.atributos.cy = f_copia.atributos.cy + y_move;
            }
        }
    }

    procesarEventoLienzo(eventoLienzoFigura, setAnimacion, actListaTrabajo) {

        if(this.proceso_principal_activo){
            if (this.categoria_trabajo === TRABAJO_FIGURA) {
                this.procesarTrabajoFigura(eventoLienzoFigura, setAnimacion)
            }

            if (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
                this.procesarTrabajoListaFiguras(eventoLienzoFigura, setAnimacion)
            }

            if(this.categoria_trabajo === TRABAJO_GRUPOS){
                this.procesarTrabajoListaGrupos(eventoLienzoFigura, setAnimacion, actListaTrabajo)

            }
            this.procesarSeleccionPuntero(eventoLienzoFigura);
            this.actualizarLienzo()
            this.aplicarCambiosConcurrente();

            if(this.editar_lienzo){
                console.log("[EDITAR EL LIENZO]")
                this.funcion_editar_lienzo();
                this.editar_lienzo = false;
            }
        }
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
        const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
        const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
        const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
        const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
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
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
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
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
        dibujar_punto(ctx, color_, x, y, 2)
        if (seleccion) {
            this.actualizarPuntoCentro(figura, grupo)
            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    actualizarLienzo() {
        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.animacion_.procesarPosicionFinalFiguras()
        this.animacion_.listaOrdenadasGrupos(lista_grupo_root)
        for (let i = 0; i < lista_grupo_root.length; i++) {
            const grupo = lista_grupo_root[i]
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                let seleccion = null;
                let color_figura = grupo.color;
                if (true)//(this.categoria_trabajo === TRABAJO_FIGURA || this.categoria_trabajo === TRABAJO_LISTA_FIGURAS)
                {
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
            const rect_seleccion = this.calcularCentroFigurasSeleccionadas()
            dibujar_rectangulo(ctx, "#14f7ff", rect_seleccion.inf_hor, rect_seleccion.inf_ver,
                rect_seleccion.ancho, rect_seleccion.alto)
            dibujar_rectangulo(ctx, "#14f7ff", rect_seleccion.centro_x, rect_seleccion.centro_y,
                this.p_centro.w, this.p_centro.h)

            //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
                dibujar_circulo(ctx, "#14f7ff", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            //}
        }


        if(this.categoria_trabajo === TRABAJO_GRUPOS){
            const rect_seleccion = this.calcularCentroGruposSeleccionados()
            dibujar_rectangulo(ctx, "#76ff14", rect_seleccion.inf_hor, rect_seleccion.inf_ver,
                rect_seleccion.ancho, rect_seleccion.alto)
            //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
            dibujar_circulo(ctx, "#76ff14", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            //}
            dibujar_rectangulo(ctx, "#76ff14", rect_seleccion.centro_x, rect_seleccion.centro_y,
                this.p_centro.w, this.p_centro.h)
            if(this.mover_figura === MOVER_ROTAR_GRUPOS){
                console.log("imprime el pivote 12121212")
                dibujar_circulo(ctx, "#ff2f14", this.pivote_rotacion.x, this.pivote_rotacion.y, 5, 5)
                dibujar_linea_segmentada(ctx, "#ff2f14", this.pivote_rotacion.x+2, this.pivote_rotacion.y-2,
                    rect_seleccion.centro_x+1, rect_seleccion.centro_y-1)

                if(this.rotar_lista_grupos){
                    dibujar_linea_segmentada(ctx, "#ff2f14", this.pivote_rotacion.x+2, this.pivote_rotacion.y-2,
                        this.puntero.x, this.puntero.y)
                }
            }else{

            }
        }

    }

    calcularCentroFigurasSeleccionadas(){
        let nombre_grupo = this.id_grupo_selec;
        const grupo = this.animacion_.getGrupo(nombre_grupo)
        let figuras_select = []
        if(grupo != null){
            figuras_select= grupo.lista_figuras.filter((f)=>this.lista_id_figuras.includes(f.nombre))
        }
        return this.calcularCenTroFiguras(figuras_select, grupo)
    }

    calcularCentroGruposSeleccionados(copia=false){

        let inf_hor = Number.POSITIVE_INFINITY;
        let inf_ver = Number.POSITIVE_INFINITY;
        let sup_hor = Number.NEGATIVE_INFINITY;
        let sup_ver = Number.NEGATIVE_INFINITY;

        for (let i=0; i<this.copia_lista_grupos.length; i++){
            let grupo_ = null;
            if(copia){
                grupo_ = this.copia_lista_grupos[i];
            }else{
                grupo_ = this.animacion_.getGrupo(this.copia_lista_grupos[i].nombre);
            }

            for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                const figura = grupo_.lista_figuras[j];
                [inf_hor, sup_hor, inf_ver, sup_ver]=this.calcularLimitesFigura(figura, grupo_,
                    inf_hor, sup_hor, inf_ver, sup_ver)
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

    calcularCenTroFiguras(lista_figuras_, grupo) {

        let inf_hor = Number.POSITIVE_INFINITY;
        let inf_ver = Number.POSITIVE_INFINITY;
        let sup_hor = Number.NEGATIVE_INFINITY;
        let sup_ver = Number.NEGATIVE_INFINITY;
        if(grupo != null)
        for (let j = 0; j < lista_figuras_.length; j++) {
            const figura = lista_figuras_[j];
            [inf_hor, sup_hor, inf_ver, sup_ver]=this.calcularLimitesFigura(figura, grupo,
                inf_hor, sup_hor, inf_ver, sup_ver)
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

    calcularLimitesFigura(figura, grupo, inf_hor, sup_hor, inf_ver, sup_ver){
        if (figura.tipo_figura === "RECTA") {
            const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            //console.log(x1, y1)
            inf_hor = Math.min(...[x1, x2, inf_hor])
            sup_hor = Math.max(...[x1, x2, sup_hor])

            //----------------------------------------
            inf_ver = Math.min(...[y1, y2, inf_ver])
            sup_ver = Math.max(...[y1, y2, sup_ver])
        }

        if (figura.tipo_figura === "PUNTO") {
            const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);

            inf_hor = Math.min(...[x, inf_hor])
            sup_hor = Math.max(...[x, sup_hor])
            //----------------------------------------
            inf_ver = Math.min(...[y, inf_ver])
            sup_ver = Math.max(...[y, sup_ver])

        }

        if (figura.tipo_figura === "CIRCULO") {

            const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            const rx = parseInt(figura.atributos.radiox);
            const ry = parseInt(figura.atributos.radioy);

            inf_hor = Math.min(...[x - rx, inf_hor])
            sup_hor = Math.max(...[x + rx, sup_hor])
            //----------------------------------------
            inf_ver = Math.min(...[y - ry, inf_ver])
            sup_ver = Math.max(...[y + ry, sup_ver])
        }
        return [inf_hor, sup_hor, inf_ver, sup_ver]
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

    function zoomLocalizacion(){
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function dibujar_linea_segmentada(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
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