import Fisica from "./Fisica";
import {getCoorPunto, getCoorRecta, normalizar_recta} from "./GestionAnimacion";
import {
    pintarGrupo,
    imprimirListaGrupos,
    dibujar_rectangulo,
    dibujar_circulo,
    dibujar_linea_segmentada, dibujar_linea, dibujar_punto, imprimir_recta, imprimirGrupoPintado, ImprimirAnimacion
} from "./ImprimirAnimacion";
import OperacionesGrupo from "./OperacionesGrupo";
import GestionPintado from "./GestionPintado";
import {
    MOVER_AUMENTO_LIENZO, MOVER_REDUCCION_LIENZO,
    TRABAJO_CONFIG_LIENZO_ATRIBUTOS,
    TRABAJO_CONFIG_LIENZO_IMAGENES
} from "./ConstanteAnimacion";
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

    puntero_virtual = {
        x: 0,
        y: 0,
        w: 10,
        h: 10
    }

    puntero_real = {
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

    pulsando_agregar_figura = false;

    //evitar conflicto por concurrencia
    act_grupos_concurrente = false
    grupos_figuras_concurrent = null;
    //desactivar el proceso principal
    proceso_principal_activo = true;

    gestion_pintado = new GestionPintado();
    configuracion_lienzo = new ConfiguracionLienzo();
    imprimir_animacion = null;

    x_mouse = 0;
    y_mouse = 0;


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
        this.movimiento_recta_agregada = 1;
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

        this.puntero_virtual.x = eventoLienzoFigura.mouse_virtual_x;
        this.puntero_virtual.y = eventoLienzoFigura.mouse_virtual_y;

        const btn_presionado = eventoLienzoFigura.stack_event_teclado.includes("KeyF");
        if(btn_presionado && (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS || this.categoria_trabajo === TRABAJO_FIGURA) &&
            this.mover_figura === MOVER_NADA){
            //agregar un evento para la seccion de figuras

            if (eventoLienzoFigura.mouse_only_click) {
                //console.log("EMPEZAR LA SELECCION ");
                this.puntero_seleccion.x = eventoLienzoFigura.mouse_virtual_x;
                this.puntero_seleccion.y = eventoLienzoFigura.mouse_virtual_y;
                this.seleccion_figuras = true;
                this.lista_id_figuras = []
            }
            // cambia de color las figuras que son seleccionadas por el rectangulo
            if(this.seleccion_figuras && eventoLienzoFigura.mouse_click_down){
                this.puntero_seleccion.w = eventoLienzoFigura.mouse_virtual_x - this.puntero_seleccion.x;
                this.puntero_seleccion.h = eventoLienzoFigura.mouse_virtual_y - this.puntero_seleccion.y;

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

            if(this.seleccion_figuras && eventoLienzoFigura.mouse_click_down === false){
                //console.log("LEVANTAR EL MOUSESS PARA LA SELECCION: "+this.lista_id_figuras.length);
                if(this.lista_id_figuras.length === 1){
                    //console.log(this.puntero_seleccion)
                    //console.log("SELECCION DE UNA FIGURA");
                    this.seleccionarFiguraMover(this.lista_id_figuras[0], nombre_grupo, MOVER_NADA)
                }
                if(this.lista_id_figuras.length>1){
                    this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(nombre_grupo, this.lista_id_figuras)
                    this.seleccionarFigurasTransformar(nombre_grupo)
                }
                this.seleccion_figuras = false
            }
        }
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
            if (eventoLienzoFigura.mouse_only_click && Fisica.rectsColliding(this.puntero_virtual, p_sup)){
                console.log("INFLAR POR LA ESQUINA")
                this.mover_figura = MOVER_INFLAR_FIGURAS;
                this.copia_lista_figuras = this.animacion_.get_lista_figuras_duplicadas(this.id_grupo_selec, this.lista_id_figuras)
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }
            /*p_sup.x = rect_seleccion.centro_x;
            p_sup.y = rect_seleccion.centro_y;
            if (eventoLienzoFigura.mouse_only_click && Fisica.rectsColliding(this.puntero_virtual, p_sup)){
                this.mover_figura = MOVER_CENTROS_FIGURAS;
                this.mover_centros=this.calcularCentroFigurasSeleccionadas()
            }*/
        }

        if(this.mover_figura === MOVER_CENTROS_FIGURAS){
            console.log("MOVER CENTRO DE FIGURAS")
            //this.calcularCentroFigurasSeleccionadas(animacion)
            let nombre_grupo = this.id_grupo_selec;
            const grupo = this.animacion_.getGrupo(nombre_grupo)
            let x = eventoLienzoFigura.mouse_virtual_x - grupo.cx;
            let y = eventoLienzoFigura.mouse_virtual_y - grupo.cy;
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

            if(eventoLienzoFigura.mouse_virtual_x> (this.mover_centros.centro_x+20)){
                const diff_ancho = (eventoLienzoFigura.mouse_virtual_x-10)-(this.mover_centros.sup_hor-10);
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
                    ,eventoLienzoFigura.mouse_virtual_x, eventoLienzoFigura.mouse_virtual_y);

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
        let mover_centro_figura = false;
        let fig_ = this.animacion_.get_figura(nombre_grupo, nombre_figura)

        let evento_agregar_figura = false;
        let evento_iman_componente = false;
        let evento_mov_solo_x = false;
        let evento_mov_solo_y = false;

        //eventos de trabajo de figuras
        if(eventoLienzoFigura.stack_event_teclado.includes("ShiftLeft")){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyA") &&
                this.mover_figura === MOVER_NADA){
                this.movimiento_recta_agregada = 1;
                evento_agregar_figura = true;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyS")){
                evento_iman_componente = true;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyX")){
                evento_mov_solo_x = true;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyY")){
                evento_mov_solo_y= true;
            }

            if(eventoLienzoFigura.stack_event_teclado.includes("KeyB")){
                //evento_mov_solo_y= true;
                if(fig_){
                    this.animacion_.borrar_figura(nombre_grupo, fig_.nombre);
                    this.id_figura_selec = null;
                }
            }
        }

        if(fig_ != null && this.mover_figura === MOVER_NADA){
            if(evento_agregar_figura){
                fig_ = this.animacion_.crear_figura(nombre_grupo, fig_.tipo_figura)
                this.id_figura_selec = fig_.nombre;
                this.mover_figura=MOVER_FIGURA_AGREGADA;
            }
        }

        if(this.movimiento_recta_agregada === 2 && fig_ != null && this.mover_figura===MOVER_FIGURA_AGREGADA){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyA")){
                if(!this.pulsando_agregar_figura){
                    console.log("agregando otra figura");
                    let fig_nuevo = this.animacion_.crear_figura(nombre_grupo, fig_.tipo_figura)
                    this.id_figura_selec = fig_nuevo.nombre;
                    this.mover_figura=MOVER_FIGURA_AGREGADA;
                    fig_nuevo.atributos["x1"] = fig_.atributos["x2"];
                    fig_nuevo.atributos["y1"] = fig_.atributos["y2"];
                    //fig_nuevo.atributos["x2"] = fig_.atributos["x2"];
                    //fig_nuevo.atributos["y2"] = fig_.atributos["y2"];
                    fig_nuevo.atributos["cx"] = fig_.atributos["cx"];
                    fig_nuevo.atributos["cy"] = fig_.atributos["cy"];
                    fig_ = fig_nuevo;

                    this.pulsando_agregar_figura = true;
                }
            }else{
                this.pulsando_agregar_figura = false;
            }
            //fig_nuevo.atributos["x1"] = fig_.atributos["x1"];
            //fig_nuevo.atributos["y1"] = fig_.atributos["y1"];
        }


        if (grupo_ != null && fig_ != null) {
            if(this.mover_figura === MOVER_FIGURA_AGREGADA && fig_.tipo_figura !== "RECTA"){
                this.mover_figura = MOVER_CENTRO_FIGURA;
            }

            if (fig_.tipo_figura === "RECTA" && eventoLienzoFigura.mouse_only_click && this.mover_figura !== MOVER_FIGURA_AGREGADA) {
                this.actualizarPuntosRectas(fig_, grupo_)
                if (Fisica.rectsColliding(this.puntero_virtual, this.p1_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO1;
                } else if (Fisica.rectsColliding(this.puntero_virtual, this.p2_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO2;
                } else if (this.mover_figura !== MOVER_CENTRO_FIGURA) {

                    if (Fisica.rectsColliding(this.puntero_virtual, this.p_centro)) {
                        this.mover_figura = MOVER_CENTRO_FIGURA;
                        mover_centro_figura = true;
                    }
                }
            }

            if (fig_.tipo_figura === "CIRCULO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosCirculo(fig_, grupo_)
                if (Fisica.rectsColliding(this.puntero_virtual, this.p_circulo)) {
                    this.mover_figura = MOVER_RADIO_CIRCULO;
                } else {
                    if (this.mover_figura !== MOVER_CENTRO_FIGURA) {
                        if (Fisica.rectsColliding(this.puntero_virtual, this.p_centro)) {
                            this.mover_figura = MOVER_CENTRO_FIGURA;
                            mover_centro_figura = true;
                        }
                    }
                }
            }

            if (fig_.tipo_figura === "PUNTO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntoCentro(fig_, grupo_)
                if (this.mover_figura !== MOVER_CENTRO_FIGURA && Fisica.rectsColliding(this.puntero_virtual, this.p_centro)) {
                    this.mover_figura = MOVER_CENTRO_FIGURA;
                    mover_centro_figura = true;
                }
            }

            if (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2 ||
                this.mover_figura === MOVER_FIGURA_AGREGADA) {
                let x = eventoLienzoFigura.mouse_virtual_x - grupo_.cx - fig_.atributos.cx;
                let y = eventoLienzoFigura.mouse_virtual_y - grupo_.cy - fig_.atributos.cy;

                if(evento_iman_componente){
                    //console.log("IMANTADO");
                    for(let i=0; i<grupo_.lista_figuras.length; i++){
                        const figura_col = grupo_.lista_figuras[i];
                        if(figura_col.nombre !== fig_.nombre){
                            const punto_colision = {
                                x: eventoLienzoFigura.mouse_virtual_x,
                                y: eventoLienzoFigura.mouse_virtual_y,
                                w: 5,
                                h: 5
                            };
                            if(figura_col.tipo_figura === "RECTA"){
                                //---------------------COLISION CON EL PUNTO 1----------------------------------------------
                                let x_set = parseInt(figura_col.atributos.x1) + parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                let y_set = parseInt(figura_col.atributos.y1) + parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                let punto_recta_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_recta_)){
                                    x = x_set- grupo_.cx - fig_.atributos.cx;
                                    y = y_set- grupo_.cy - fig_.atributos.cy;
                                    break;
                                }
                                //---------------------COLISION CON EL PUNTO 2----------------------------------------------
                                x_set = parseInt(figura_col.atributos.x2) + parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                y_set = parseInt(figura_col.atributos.y2) + parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                punto_recta_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_recta_)){
                                    x = x_set- grupo_.cx - fig_.atributos.cx;
                                    y = y_set- grupo_.cy - fig_.atributos.cy;
                                    break;
                                }

                            }

                            if(figura_col.tipo_figura === "PUNTO"){
                                let x_set = parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                let y_set = parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                const punto_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_)){
                                    x = x_set- grupo_.cx - fig_.atributos.cx;
                                    y = y_set- grupo_.cy - fig_.atributos.cy;
                                    break;
                                }
                            }
                        }

                    }
                }


                if(evento_mov_solo_x){
                    x = this.mover_figura === MOVER_RECTA_PUNTO1 ? fig_.atributos["x2"] : fig_.atributos["x1"];
                }

                if(evento_mov_solo_y){
                    y = this.mover_figura === MOVER_RECTA_PUNTO1 ? fig_.atributos["y2"] : fig_.atributos["y1"];
                }

                if (this.mover_figura === MOVER_RECTA_PUNTO1) {
                    fig_.atributos["x1"] = x;
                    fig_.atributos["y1"] = y;

                }
                if (this.mover_figura === MOVER_RECTA_PUNTO2){
                    fig_.atributos["x2"] = x;
                    fig_.atributos["y2"] = y;
                }

                if(this.mover_figura === MOVER_FIGURA_AGREGADA){

                    if(this.movimiento_recta_agregada === 1){
                        fig_.atributos["x1"] = fig_.atributos["x2"] = x;
                        fig_.atributos["y1"] = fig_.atributos["y2"] = y;
                    }

                    if(this.movimiento_recta_agregada === 2){
                        fig_.atributos["x2"] = x;
                        fig_.atributos["y2"] = y;
                    }

                    //this.mover_figura = MOVER_RECTA_PUNTO2;
                    if(eventoLienzoFigura.mouse_only_click){
                        //this.mover_figura = MOVER_RECTA_PUNTO2;
                        this.movimiento_recta_agregada++;
                    }
                    if(this.movimiento_recta_agregada === 3){
                        this.mover_figura = MOVER_NADA;
                    }
                }
                else
                if(eventoLienzoFigura.mouse_click_up){
                    this.mover_figura = MOVER_NADA;
                }

                this.animacion_.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": this.animacion_})
            }

            /*if(this.mover_figura === MOVER_FIGURA_AGREGADA){
                let x = eventoLienzoFigura.mouse_virtual_x - grupo_.cx - fig_.atributos.cx;
                let y = eventoLienzoFigura.mouse_virtual_y - grupo_.cy - fig_.atributos.cy;
                if (this.movimiento_recta_agregada === RECTA_MOVER_TODO){
                    fig_.atributos["x1"] = fig_.atributos["x2"] = x;
                    fig_.atributos["y1"] = fig_.atributos["y2"] = y;
                }
            }*/

            if (this.mover_figura === MOVER_RADIO_CIRCULO) {
                let radio_ = eventoLienzoFigura.mouse_virtual_x - grupo_.cx - fig_.atributos.cx;
                if (radio_ > 0) {
                    fig_.atributos["radiox"] = radio_;
                    fig_.atributos["radioy"] = radio_;
                    this.animacion_.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": this.animacion_})
                }
            }

            if (this.mover_figura === MOVER_CENTRO_FIGURA) {
                let x = eventoLienzoFigura.mouse_virtual_x - grupo_.cx;
                let y = eventoLienzoFigura.mouse_virtual_y - grupo_.cy;

                if(fig_.tipo_figura === "PUNTO" && evento_iman_componente){
                    for(let i=0; i<grupo_.lista_figuras.length; i++){
                        const figura_col = grupo_.lista_figuras[i];
                        if(figura_col.nombre !== fig_.nombre){
                            const punto_colision = {
                                x: eventoLienzoFigura.mouse_virtual_x,
                                y: eventoLienzoFigura.mouse_virtual_y,
                                w: 5,
                                h: 5
                            };
                            if(figura_col.tipo_figura === "RECTA"){
                                //---------------------COLISION CON EL PUNTO 1----------------------------------------------
                                let x_set = parseInt(figura_col.atributos.x1) + parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                let y_set = parseInt(figura_col.atributos.y1) + parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                let punto_recta_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_recta_)){
                                    x = x_set- grupo_.cx// - fig_.atributos.cx;
                                    y = y_set- grupo_.cy// - fig_.atributos.cy;
                                    break;
                                }
                                //---------------------COLISION CON EL PUNTO 2----------------------------------------------
                                x_set = parseInt(figura_col.atributos.x2) + parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                y_set = parseInt(figura_col.atributos.y2) + parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                punto_recta_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_recta_)){
                                    x = x_set- grupo_.cx;// - fig_.atributos.cx;
                                    y = y_set- grupo_.cy; //- fig_.atributos.cy;
                                    break;
                                }

                            }

                            if(figura_col.tipo_figura === "PUNTO"){
                                let x_set = parseInt(figura_col.atributos.cx) + parseInt(grupo_.cx);
                                let y_set = parseInt(figura_col.atributos.cy) + parseInt(grupo_.cy);

                                const punto_ ={
                                    x: x_set,
                                    y: y_set,
                                    w: 5,
                                    h: 5
                                }

                                if(Fisica.rectsColliding(punto_colision, punto_)){
                                    x = x_set- grupo_.cx;// - fig_.atributos.cx;
                                    y = y_set- grupo_.cy;// - fig_.atributos.cy;
                                    break;
                                }
                            }
                        }

                    }
                }

                fig_.atributos["cx"] = x;
                fig_.atributos["cy"] = y;
                this.animacion_.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": this.animacion_})
            }

            this.anterior_mover_figura = this.mover_figura;

            /*if (eventoLienzoFigura.mouse_only_click && (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2)) {
                this.mover_figura = MOVER_NADA;
            }*/

            if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_CENTRO_FIGURA && mover_centro_figura === false) {
                this.mover_figura = MOVER_NADA;
            }
            if (eventoLienzoFigura.mouse_click_up && this.mover_figura === MOVER_RADIO_CIRCULO) {
                this.mover_figura = MOVER_NADA;
            }

            /*if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_FIGURA_AGREGADA && fig_.tipo_figura === "RECTA") {
                console.log("MOVER AHORA EL PUNTO1")
                this.mover_figura = MOVER_RECTA_PUNTO1;
            }*/

            //if(this.anterior_mover_figura !== MOVER_NADA && this.mover_figura === MOVER_NADA){
            //    this.editar_lienzo = true;
            //}

            if(this.mover_figura === MOVER_NADA){
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
                if(eventoLienzoFigura.mouse_click_down && Fisica.rectsColliding(this.puntero_virtual, p_sup)){
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
                eventoLienzoFigura.mouse_virtual_x, eventoLienzoFigura.mouse_virtual_y  )
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
            let tocando_pivote = Fisica.rectsColliding(this.puntero_virtual, this.pivote_rotacion) &&
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
                    this.pivote_rotacion.x = this.puntero_virtual.x;
                    this.pivote_rotacion.y = this.puntero_virtual.y;
                }
            }else{

                if(eventoLienzoFigura.mouse_only_click){
                    this.rotar_lista_grupos = false
                    setAnimacion({"edicion": this.animacion_})
                    this.editar_lienzo = true;
                }

                const angulo_rotacion = Fisica.angulo_recta(this.pivote_rotacion.x, this.pivote_rotacion.y
                    ,eventoLienzoFigura.mouse_virtual_x, eventoLienzoFigura.mouse_virtual_y);

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
                if(eventoLienzoFigura.mouse_virtual_x> (this.mover_centros.centro_x+20)){
                    const diff_ancho = (eventoLienzoFigura.mouse_virtual_x-10)-(this.mover_centros.sup_hor-10);
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

        this.puntero_real.x= eventoLienzoFigura.mouse_x;
        this.puntero_real.y= eventoLienzoFigura.mouse_y;

        const deltax =this.puntero_real.x-(300- (300-this.puntero_real.x)/this.configuracion_lienzo.escala);
        const deltay =this.puntero_real.y-(300- (300-this.puntero_real.y)/this.configuracion_lienzo.escala);

        eventoLienzoFigura.mouse_virtual_x = eventoLienzoFigura.mouse_x -this.configuracion_lienzo.x_delta_original-deltax;
        eventoLienzoFigura.mouse_virtual_y = eventoLienzoFigura.mouse_y -this.configuracion_lienzo.y_delta_original-deltay;
        this.x_mouse = eventoLienzoFigura.mouse_virtual_x;
        this.y_mouse = eventoLienzoFigura.mouse_virtual_y;

        this.categoria_trabajo = this.configuracion_lienzo.procesarGeneral(eventoLienzoFigura, this.categoria_trabajo,
            this.mover_figura)

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
                if(figura != null){
                    if (figura.tipo_figura === "RECTA") {
                        this.actualizarPuntosRectas(figura, grupo);
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        this.actualizarPuntoCentro(figura, grupo)
                    }
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

        const configuracion_ = this.configuracion_lienzo.getConfiguracionGeneral();

        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.animacion_.procesarPosicionFinalFiguras()
        this.animacion_.listaOrdenadasGrupos(lista_grupo_root)


        this.configuracion_lienzo.inicioZoomLienzo(ctx);

        //imprimir las imagenes del lienzo de configuracion
        this.configuracion_lienzo.imprimirImagenesLienzo(ctx, this.animacion_);


        const espacio_trabajo_val = TRABAJO_EDICION_FIGURAS.includes(this.categoria_trabajo);
        const imprimir_lienzo_completo = this.categoria_trabajo === TRABAJO_NONE
            || espacio_trabajo_val;

        if(imprimir_lienzo_completo || this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_IMAGENES ||
            this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_ATRIBUTOS){

            this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, this.id_grupo_selec, this.id_figura_selec, this.lista_id_figuras,
                this.p_centro, this.p1_recta, this.p2_recta, this.p_circulo, configuracion_["pintar"])

            /*if(configuracion_["pintar"]){
                this.imprimir_animacion.imprimirListaGrupoPintado(lista_grupo_root)
            }*/
        }

        if(espacio_trabajo_val){
            if (this.seleccion_figuras) {
                const x_select = this.puntero_seleccion.x+this.configuracion_lienzo.x_delta_original;
                const y_select = this.puntero_seleccion.y+this.configuracion_lienzo.y_delta_original;
                dibujar_rectangulo(ctx, "#1447ff", x_select, y_select,
                    this.puntero_seleccion.w, this.puntero_seleccion.h)
            }

            if(this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
                const rect_seleccion = this.calcularCentroFigurasSeleccionadas();
                const x_select = rect_seleccion.inf_hor+this.configuracion_lienzo.x_delta_original;
                const y_select = rect_seleccion.inf_ver+this.configuracion_lienzo.y_delta_original;
                dibujar_rectangulo(ctx, "#14f7ff", x_select, y_select,
                    rect_seleccion.ancho, rect_seleccion.alto)

                const x_centro = rect_seleccion.centro_x+this.configuracion_lienzo.x_delta_original;
                const y_centro = rect_seleccion.centro_y+this.configuracion_lienzo.y_delta_original;
                dibujar_rectangulo(ctx, "#14f7ff", x_centro, y_centro,
                    this.p_centro.w, this.p_centro.h)

                //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
                const x_tam = rect_seleccion.sup_hor+this.configuracion_lienzo.x_delta_original;
                const y_ram = rect_seleccion.sup_ver+this.configuracion_lienzo.y_delta_original;
                dibujar_circulo(ctx, "#14f7ff", x_tam, y_ram, 3, 3)
                //}
            }
        }

        if(this.categoria_trabajo === TRABAJO_GRUPOS){
            const rect_seleccion =
                OperacionesGrupo.calcularCentroGruposSeleccionados(this.animacion_.get_lista_grupos_by_IDs(this.lista_grupos_trabajando))

            const x_select_g = rect_seleccion.inf_hor+this.configuracion_lienzo.x_delta_original;
            const y_select_g = rect_seleccion.inf_ver+this.configuracion_lienzo.y_delta_original;
            dibujar_rectangulo(ctx, "#76ff14", x_select_g, y_select_g,
                rect_seleccion.ancho, rect_seleccion.alto)
            //if(this.mover_figura === MOVER_INFLAR_FIGURAS){
            const x_circulo = rect_seleccion.sup_hor+this.configuracion_lienzo.x_delta_original;
            const y_circulo = rect_seleccion.sup_ver+this.configuracion_lienzo.y_delta_original;
            dibujar_circulo(ctx, "#76ff14", x_circulo, y_circulo, 3, 3)
            //}

            const x_centro = rect_seleccion.centro_x+this.configuracion_lienzo.x_delta_original;
            const y_centro = rect_seleccion.centro_y+this.configuracion_lienzo.y_delta_original;
            dibujar_rectangulo(ctx, "#76ff14", x_centro, y_centro,
                this.p_centro.w, this.p_centro.h)
            if(this.mover_figura === MOVER_ROTAR_GRUPOS){
                const x_circulo_r = this.pivote_rotacion.x+this.configuracion_lienzo.x_delta_original;
                const y_circulo_r = this.pivote_rotacion.y+this.configuracion_lienzo.y_delta_original;
                dibujar_circulo(ctx, "#ff2f14", x_circulo_r, y_circulo_r, 5, 5)
                const x_pivote = this.pivote_rotacion.x+2+this.configuracion_lienzo.x_delta_original;
                const y_pivote = this.pivote_rotacion.y-2+this.configuracion_lienzo.y_delta_original;
                dibujar_linea_segmentada(ctx, "#ff2f14", x_pivote, y_pivote,
                    x_centro+1, y_centro-1)

                if(this.rotar_lista_grupos){
                    const x_puntero = this.puntero_virtual.x + this.configuracion_lienzo.x_delta_original;
                    const y_puntero = this.puntero_virtual.y + this.configuracion_lienzo.y_delta_original;
                    dibujar_linea_segmentada(ctx, "#ff2f14", x_pivote, y_pivote,
                        x_puntero, y_puntero)
                }
            }else{

            }
        }
        this.configuracion_lienzo.finZoomLienzo(ctx);

        if(false){
            dibujar_circulo(ctx, "#39ff14", this.x_mouse, this.y_mouse, 3, 3);
            for (let i = 0; i < lista_grupo_root.length; i++) {
                const grupo = lista_grupo_root[i]
                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    const figura = grupo.lista_figuras[j];
                    let seleccion = null;
                    let color_figura = grupo.color;

                    seleccion = grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec;
                    //if(lista_id_figuras.includes(figura.nombre) && id_grupo_selec === grupo.nombre){
                    color_figura = "#ff00a1";
                    //}
                    if (figura.tipo_figura === "RECTA") {
                        //this.imprimir_animacion.imprimir_recta(figura, grupo, color_figura,this.p1_recta, this.p2_recta, this.p_centro,
                        //    seleccion);

                        const coor = getCoorRecta(figura, grupo)
                        const x1_ = coor.x1;
                        const y1_ = coor.y1;
                        const x2_ = coor.x2;
                        const y2_ = coor.y2;

                        dibujar_linea(ctx, color_figura, x1_, y1_, x2_, y2_)


                        const xp1_ = this.p1_recta.x;
                        const xp2_ = this.p2_recta.x;
                        const xpc_ = this.p_centro.x;
                        const yp1_ = this.p1_recta.y;
                        const yp2_ = this.p2_recta.y;
                        const ypc_ = this.p_centro.y;
                        dibujar_rectangulo(ctx, color_figura, xp1_, yp1_,
                            this.p1_recta.w, this.p1_recta.h)

                        dibujar_rectangulo(ctx, color_figura, xp2_, yp2_,
                            this.p2_recta.w, this.p2_recta.h)

                        dibujar_rectangulo(ctx, color_figura, xpc_, ypc_,
                            this.p_centro.w, this.p_centro.h)

                    }

                    if (figura.tipo_figura === "PUNTO") {
                        //this.imprimir_animacion.imprimir_punto(figura, grupo, color_figura, this.p_centro, seleccion);
                        const coor = getCoorPunto(figura, grupo)
                        const x = coor.x;
                        const y = coor.y;
                        const xpc_ = this.p_centro.x;
                        const ypc_ = this.p_centro.y;
                        dibujar_punto(ctx, color_figura, x, y, 2)
                        //if (seleccion) {
                        //this.actualizarPuntoCentro(figura, grupo)
                        dibujar_rectangulo(ctx, color_figura, xpc_, ypc_,
                            this.p_centro.w, this.p_centro.h)
                        //}
                    }
                }
            }
        }

        /*if(imprimir_lienzo_completo || this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_IMAGENES ||
            this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_ATRIBUTOS){
            this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, this.id_grupo_selec, this.id_figura_selec, this.lista_id_figuras,
                this.p_centro, this.p1_recta, this.p2_recta, this.p_circulo)
        }*/

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