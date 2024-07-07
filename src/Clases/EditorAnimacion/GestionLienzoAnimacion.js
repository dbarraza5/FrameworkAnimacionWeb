import Fisica from "./Fisica";
import {normalizar_recta} from "./GestionAnimacion";
import {
    pintarGrupo,
    imprimirListaGrupos,
    dibujar_rectangulo,
    dibujar_circulo,
    dibujar_linea_segmentada, dibujar_linea, dibujar_punto, imprimir_recta, imprimirGrupoPintado, ImprimirAnimacion
} from "./ImprimirAnimacion";
import OperacionesGrupo from "./OperacionesGrupo";
import GestionPintado from "./GestionPintado";
import {TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES} from "./ConstanteAnimacion";
import ConfiguracionLienzo from "./ConfiguracionLienzo";

const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_LISTA_FIGURAS = 1;
const TRABAJO_GRUPOS = 2;
const TRABAJO_PINTADO_GRUPO = 3;
const TRABAJO_EDICION_FIGURAS = [TRABAJO_FIGURA, TRABAJO_LISTA_FIGURAS, TRABAJO_GRUPOS]

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

function generarID() {
    const timestamp = Date.now().toString(); // Obtiene la marca de tiempo actual como una cadena
    const randomNum = Math.random().toString().slice(2, 8); // Genera un número aleatorio de 6 dígitos
    const id = timestamp + randomNum; // Concatena la marca de tiempo y el número aleatorio
    return id;
}


class GestionLienzoAnimacion {

    ID = generarID();

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
    proceso_principal_activo = true;

    gestion_pintado = new GestionPintado();
    configuracion_lienzo = new ConfiguracionLienzo();
    imprimir_animacion = null;


    constructor(animacion_) {
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
        this.animacion_ = animacion_;
        this.id_grupo_selec = "default";
        this.imprimir_animacion = new ImprimirAnimacion(animacion_,this.configuracion_lienzo, this.id_canvas);
    }

    setFuncionEditarLienzo(funcion){
        this.funcion_editar_lienzo = funcion
        this.gestion_pintado.funcion_editar_lienzo = funcion
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

    seleccionGrupoPintar(nombre_grupo){
        this.categoria_trabajo = TRABAJO_PINTADO_GRUPO;
        this.gestion_pintado.inicializarGrupo(this.animacion_.getGrupo(nombre_grupo))
    }


    //proceso que es llamado por componente de react para proceder a intereactuar a nivel de grupo
    seleccionListaGrupos(lista_grupos){
        this.lista_grupos_trabajando = lista_grupos;
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
        this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
        this.pivote_rotacion.x = this.mover_centros.centro_x;
        this.pivote_rotacion.y = this.mover_centros.centro_y;

    }

    seleccionGrupoMover(lista_grupos){
        console.log("seleccionarGRUPOS")
        this.categoria_trabajo = TRABAJO_GRUPOS;
        this.mover_figura = MOVER_CENTRO_GRUPOS;
        //this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(lista_grupos)
        //this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
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
        //this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
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
                    //console.log(this.puntero_seleccion)
                }
                if (eventoLienzoFigura.mouse_click_up && this.categoria_trabajo === TRABAJO_LISTA_FIGURAS) {
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
                    if(Fisica.rectsColliding(this.puntero_seleccion, this.p_centro)){
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
            if (eventoLienzoFigura.mouse_only_click && Fisica.rectsColliding(this.puntero, p_sup)){
                console.log("INFLAR POR LA ESQUINA")
                this.mover_figura = MOVER_INFLAR_FIGURAS;
                this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
            /*p_sup.x = rect_seleccion.centro_x;
            p_sup.y = rect_seleccion.centro_y;
            if (eventoLienzoFigura.mouse_only_click && Fisica.rectsColliding(this.puntero, p_sup)){
                this.mover_figura = MOVER_CENTROS_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }*/
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

                        OperacionesGrupo.inflar_figura(figura, f_copia, grupo, this.mover_centros.centro_x,
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
                        OperacionesGrupo.rotar_figura(figura, f_copia, grupo,angulo_rotacion,
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
                if (Fisica.rectsColliding(this.puntero, this.p1_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO1;
                } else if (Fisica.rectsColliding(this.puntero, this.p2_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO2;
                } else if (this.mover_figura !== MOVER_CENTRO_FIGURA) {

                    if (Fisica.rectsColliding(this.puntero, this.p_centro)) {
                        this.mover_figura = MOVER_CENTRO_FIGURA;
                        mover_centro_figura = true;
                    }
                }
            }

            if (fig_.tipo_figura === "CIRCULO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosCirculo(fig_, grupo_)
                if (Fisica.rectsColliding(this.puntero, this.p_circulo)) {
                    this.mover_figura = MOVER_RADIO_CIRCULO;
                } else {
                    if (this.mover_figura !== MOVER_CENTRO_FIGURA) {
                        if (Fisica.rectsColliding(this.puntero, this.p_centro)) {
                            this.mover_figura = MOVER_CENTRO_FIGURA;
                            mover_centro_figura = true;
                        }
                    }
                }
            }

            if (fig_.tipo_figura === "PUNTO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntoCentro(fig_, grupo_)
                if (this.mover_figura !== MOVER_CENTRO_FIGURA && Fisica.rectsColliding(this.puntero, this.p_centro)) {
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
                //console.log("[SELECCION DE GRUPOS]")
                //this.mover_figura = MOVER_CENTRO_GRUPOS;
                //this.copia_lista_grupos = this.animacion_.duplicar_lista_grupos(["marco","rayos_rueda"])
                //this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
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
            let rect_seleccion = OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
            let p_sup = {
                x: rect_seleccion.sup_hor,
                y: rect_seleccion.sup_ver,
                w: 3,
                h: 3
            }
            if(this.inflar_grupos === false){
                if(eventoLienzoFigura.mouse_click_down && Fisica.rectsColliding(this.puntero, p_sup)){
                    console.log("inflar_lista_grupos")
                    this.inflar_grupos = true;
                    this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
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
            let tocando_pivote = Fisica.rectsColliding(this.puntero, this.pivote_rotacion) &&
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
                        let f_nuevo=OperacionesGrupo.rotar_figura(figura, f_copia, grupo_,angulo_rotacion,
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

                                OperacionesGrupo.inflar_figura(figura, f_copia, grupo_, this.mover_centros.centro_x,
                                    this.mover_centros.centro_y, porcentaje)
                            }
                        }
                    }
                }
            }
        }

        if(this.mover_figura === MOVER_CENTRAR_GRUPOS){
            this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos)
            this.mover_lista_grupos(this.mover_centros.centro_x, this.mover_centros.centro_y,
                300,300)
            this.mover_figura = MOVER_NADA;
        }

        if(this.mover_figura === MOVER_ESPEJO_GRUPOS){
            if(this.espejo_sentido_reflejo !== REFLEJO_NONE){
                this.mover_centros=OperacionesGrupo.calcularCentroGruposSeleccionados(this.copia_lista_grupos.map(
                    (g)=>this.animacion_.getGrupo(g.nombre)
                ));
                for (let i=0; i<this.copia_lista_grupos.length; i++){
                    const grupo_copia = this.copia_lista_grupos[i]
                    const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);
                    let centrox = this.mover_centros.centro_x;
                    let centroy = this.mover_centros.centro_y;
                    for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                        const figura = grupo_.lista_figuras[j];
                        const f_copia = grupo_copia.lista_figuras[j];
                        OperacionesGrupo.espejo_figura(figura, f_copia, grupo_copia,centrox, centroy, this.espejo_sentido_reflejo,
                            this.reflejo_original_vert, this.reflejo_original_horz)
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

    mover_lista_grupos( orig_x, orig_y, des_x,  des_y){
        for (let i=0; i<this.copia_lista_grupos.length; i++){
            const grupo_copia = this.copia_lista_grupos[i]
            const grupo_ =this.animacion_.getGrupo(grupo_copia.nombre);
            OperacionesGrupo.moverGrupo(grupo_, grupo_copia, orig_x, orig_y, des_x,  des_y)
        }
    }

    procesarEventoLienzo(eventoLienzoFigura, setAnimacion, actListaTrabajo) {

        if(true){
            if (this.categoria_trabajo === TRABAJO_FIGURA) {
                this.procesarTrabajoFigura(eventoLienzoFigura, setAnimacion)
            }

            if (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
                this.procesarTrabajoListaFiguras(eventoLienzoFigura, setAnimacion)
            }

            if(this.categoria_trabajo === TRABAJO_GRUPOS){
                this.procesarTrabajoListaGrupos(eventoLienzoFigura, setAnimacion, actListaTrabajo)

            }

            if(this.categoria_trabajo === TRABAJO_PINTADO_GRUPO){
                this.gestion_pintado.procesarTrabajoPintado(eventoLienzoFigura)
            }

            if(this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_ATRIBUTOS){
                this.configuracion_lienzo.procesarTrabajoConfiguracionAtributosLienzo(eventoLienzoFigura);
            }

            if(this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_IMAGENES){
                this.configuracion_lienzo.procesarTrabajoConfiguracionImagenesLiento(eventoLienzoFigura, this.animacion_);
            }

            if (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS || this.categoria_trabajo === TRABAJO_FIGURA ||
                this.categoria_trabajo === TRABAJO_GRUPOS)
            this.procesarSeleccionPuntero(eventoLienzoFigura);

            if(this.categoria_trabajo === TRABAJO_FIGURA){
                const grupo = this.animacion_.getGrupo(this.id_grupo_selec);
                const figura =  this.animacion_.get_figura(grupo.nombre, this.id_figura_selec);
                if (figura.tipo_figura === "RECTA") {
                    this.actualizarPuntosRectas(figura, grupo);
                }

                if (figura.tipo_figura === "PUNTO") {
                    this.actualizarPuntoCentro(figura, grupo)
                }
            }else{
                this.id_figura_selec = null;
            }

            this.aplicarCambiosConcurrente();
            this.actualizarLienzo()

            if(this.editar_lienzo){
                console.log("[EDITAR EL LIENZO]")
                this.funcion_editar_lienzo();
                this.editar_lienzo = false;
            }
            eventoLienzoFigura.reset()
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

    actualizarLienzo() {
        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.animacion_.procesarPosicionFinalFiguras()
        this.animacion_.listaOrdenadasGrupos(lista_grupo_root)

        //imprimir las imagenes del lienzo de configuracion
        this.configuracion_lienzo.imprimirImagenesLienzo(ctx, this.animacion_);


        const espacio_trabajo_val = TRABAJO_EDICION_FIGURAS.includes(this.categoria_trabajo);
        const imprimir_lienzo_completo = this.categoria_trabajo === TRABAJO_NONE
            || espacio_trabajo_val;

        if(imprimir_lienzo_completo || this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_IMAGENES ||
            this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_ATRIBUTOS){
            this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, this.id_grupo_selec, this.id_figura_selec, this.lista_id_figuras,
                this.p_centro, this.p1_recta, this.p2_recta, this.p_circulo)
        }

        if(espacio_trabajo_val){
            if (this.seleccion_figuras) {
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
        }

        if(this.categoria_trabajo === TRABAJO_GRUPOS){
            const rect_seleccion =
                OperacionesGrupo.calcularCentroGruposSeleccionados(this.animacion_.get_lista_grupos_by_IDs(this.lista_grupos_trabajando))
            dibujar_rectangulo(ctx, "#76ff14", rect_seleccion.inf_hor, rect_seleccion.inf_ver,
                rect_seleccion.ancho, rect_seleccion.alto)
            //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
            dibujar_circulo(ctx, "#76ff14", rect_seleccion.sup_hor, rect_seleccion.sup_ver, 3, 3)
            //}
            dibujar_rectangulo(ctx, "#76ff14", rect_seleccion.centro_x, rect_seleccion.centro_y,
                this.p_centro.w, this.p_centro.h)
            if(this.mover_figura === MOVER_ROTAR_GRUPOS){
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

        //this.categoria_trabajo = TRABAJO_PINTADO_GRUPO

        if(this.categoria_trabajo === TRABAJO_PINTADO_GRUPO){
            this.imprimir_animacion.imprimirGrupoPintado(this.gestion_pintado)

        }

        this.configuracion_lienzo.imprimirVariablesLienzo(ctx);
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

    calcularCenTroFiguras(lista_figuras_, grupo) {

        let inf_hor = Number.POSITIVE_INFINITY;
        let inf_ver = Number.POSITIVE_INFINITY;
        let sup_hor = Number.NEGATIVE_INFINITY;
        let sup_ver = Number.NEGATIVE_INFINITY;
        if(grupo != null)
        for (let j = 0; j < lista_figuras_.length; j++) {
            const figura = lista_figuras_[j];
            [inf_hor, sup_hor, inf_ver, sup_ver]=OperacionesGrupo.calcularLimitesFigura(figura, grupo,
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


};




export default GestionLienzoAnimacion