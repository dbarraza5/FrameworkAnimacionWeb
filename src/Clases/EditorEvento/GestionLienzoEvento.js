import ConfiguracionLienzoEvento from "./ConfiguracionLienzoEvento";
import {TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES} from "../EditorAnimacion/ConstanteAnimacion";
import TimelineCanvas from "./TimelineCanvas";
import {
    MODALIDAD_MOVIMIENTOS, MOV_ROTACION, TRABAJO_EDICION_MOVIMIENTO,
    TRABAJO_NADA_LIENZO,
    TRABAJO_REPRODUCCION,
    TRABAJO_SELECCION_GRUPO
} from "./ConstanteEvento";
import OperacionesGrupo from "../EditorAnimacion/OperacionesGrupo";
import {dibujar_rec_transparencia, dibujar_rectangulo} from "../EditorAnimacion/ImprimirAnimacion";


class GestionLienzoEvento{
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

    editar_lienzo = false;
    funcion_editar_lienzo = null;

    x_mouse = 0;
    y_mouse = 0;

    eventos_ = null;

    configuracion_lienzo = new ConfiguracionLienzoEvento();

    tipo_modalidad = null;
    tipo_trabajo = TRABAJO_NADA_LIENZO;
    index_mov_seleccionado =null;
    id_evento_seleccionado =null;

    timelineInstance = null;
    eventoLienzoEvento =null;

    grupos_disponibles_generales = [];
    grupo_seleccionado = null;

    funcionCambioTrabajo = null;

    edicion_mov_rotacion_pivote = false;
    edicion_mov_rotacion_velocidad = false;

    constructor(eventos_, eventoLienzoEvento, setEventoAnimacion, seleccionarGrupo) {
        this.id_canvas = "lienzo-evento"
        this.x = 0;
        this.y = 0;
        this.eventos_ = eventos_;
        this.id_grupo_selec = null;
        // this.imprimir_animacion = new ImprimirAnimacion(animacion_,this.configuracion_lienzo, this.id_canvas);
        this.eventoLienzoEvento = eventoLienzoEvento;
        this.timelineInstance = new TimelineCanvas(eventoLienzoEvento, eventos_, setEventoAnimacion);
        this.seleccionarGrupo = seleccionarGrupo;
    }

    inicializar(){
        this.timelineInstance.inicializar()
    }

    limpiar(){
        this.timelineInstance.dispose();
    }


    actualizarLienzo() {

        const configuracion_ = this.configuracion_lienzo.getConfiguracionGeneral();

        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        // this.animacion_.procesarPosicionFinalFiguras()
        // this.animacion_.listaOrdenadasGrupos(lista_grupo_root)


        this.configuracion_lienzo.inicioZoomLienzo(ctx);


        this.configuracion_lienzo.finZoomLienzo(ctx);

        this.eventos_.imprimirEventos();

        if(this.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
            if(this.tipo_trabajo === TRABAJO_SELECCION_GRUPO){
                for (let i=0; i < this.grupos_disponibles_generales.length; i++){
                    const grupos_ = [this.grupos_disponibles_generales[i]]
                    const rect_seleccion =
                        OperacionesGrupo.calcularCentroGruposSeleccionados(
                            this.eventos_.gestion_grupos.get_lista_grupos_by_IDs(grupos_)
                        )

                    const x_select_g = rect_seleccion.inf_hor+this.configuracion_lienzo.x_delta_original;
                    const y_select_g = rect_seleccion.inf_ver+this.configuracion_lienzo.y_delta_original;
                    dibujar_rectangulo(ctx, "#76ff14", x_select_g, y_select_g,
                        rect_seleccion.ancho, rect_seleccion.alto)
                    if(this.grupo_seleccionado===this.grupos_disponibles_generales[i]){
                        dibujar_rec_transparencia(ctx, "#76ff14","#c73cee", x_select_g, y_select_g,
                            rect_seleccion.ancho, rect_seleccion.alto)
                    }
                }
            }
            if(this.tipo_trabajo === TRABAJO_EDICION_MOVIMIENTO){
                 // console.log("[evento seleccionado]: ", this.id_evento_seleccionado)
                 // console.log("[grupo  seleccionado]: ", this.grupo_seleccionado)
                 // console.log("[movimu seleccionado]: ", this.index_mov_seleccionado)

                //this.eventos_.
                this.imprimiendoMovimientosObjeto()
            }

        }

        this.configuracion_lienzo.imprimirVariablesLienzo(ctx);
        this.timelineInstance.imprimir();
    }

    procesarEventoLienzo(setAnimacion, actListaTrabajo) {

        this.puntero_real.x= this.eventoLienzoEvento.mouse_x;
        this.puntero_real.y= this.eventoLienzoEvento.mouse_y;

        const deltax =this.puntero_real.x-(300- (300-this.puntero_real.x)/this.configuracion_lienzo.escala);
        const deltay =this.puntero_real.y-(300- (300-this.puntero_real.y)/this.configuracion_lienzo.escala);

        this.eventoLienzoEvento.mouse_virtual_x = this.eventoLienzoEvento.mouse_x -this.configuracion_lienzo.x_delta_original-deltax;
        this.eventoLienzoEvento.mouse_virtual_y = this.eventoLienzoEvento.mouse_y -this.configuracion_lienzo.y_delta_original-deltay;
        this.x_mouse = this.eventoLienzoEvento.mouse_virtual_x;
        this.y_mouse = this.eventoLienzoEvento.mouse_virtual_y;

        this.tipo_modalidad = this.configuracion_lienzo.procesarGeneral(this.eventoLienzoEvento,
            this.tipo_modalidad, this.tipo_trabajo, this.index_mov_seleccionado, this.grupo_seleccionado)
        //console.log(this.eventoLienzoEvento.stack_event_teclado)
        if(true){
            this.timelineInstance.procesar();

            if(this.timelineInstance.click_reproducir){
                console.log("click_reproducir: ", this.timelineInstance.click_reproducir);
                if(this.timelineInstance.play){
                    this.eventos_.pausarDesEventos();
                    this.eventos_.reproducirProceso();
                    this.tipo_trabajo = TRABAJO_REPRODUCCION;
                    this.funcionCambioTrabajo(TRABAJO_REPRODUCCION)
                }else{
                    this.eventos_.pausarEventos()
                }
                //this.eventos_.reiniciarEventos();
                //this.eventos_.reproducirProceso();
            }

            if(this.timelineInstance.click_reiniciar){
                this.eventos_.reiniciarEventos();
                this.eventos_.reiniciarProceso();
                console.log("ugvyghgcgvh")
            }

            this.eventos_.procesandoEventos();


            if(this.eventos_.reiniciar){
                //console.log("DEBERIA AVISAR QUE TERMINO")
                this.timelineInstance.reiniciarAnimacion();
            }


            this.procesoEdicionMovimientos();
            this.actualizarLienzo();
            this.timelineInstance.reiniciar();

        }

        this.eventoLienzoEvento.reset()
    }

    procesoEdicionMovimientos(){
        if(this.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
            //console.log(this.tipo_trabajo)
            if(this.tipo_trabajo === TRABAJO_SELECCION_GRUPO){
                this.grupos_disponibles_generales = this.eventos_.gestion_grupos.get_nombres_grupos_hijos("root");
                //console.log(this.grupos_disponibles_generales);

                for (let i=0; i < this.grupos_disponibles_generales.length; i++){
                    const grupos_ = [this.grupos_disponibles_generales[i]]
                    const rect_seleccion =
                        OperacionesGrupo.calcularCentroGruposSeleccionados(
                            this.eventos_.gestion_grupos.get_lista_grupos_by_IDs(grupos_)
                        )

                    const x_select_g = rect_seleccion.inf_hor+this.configuracion_lienzo.x_delta_original;
                    const y_select_g = rect_seleccion.inf_ver+this.configuracion_lienzo.y_delta_original;

                    const ancho = rect_seleccion.ancho;
                    const alto = rect_seleccion.alto;

                    // 2. Validar si el mouse está dentro de este rectángulo
                    const isHover = this.x_mouse >= x_select_g &&
                        this.x_mouse <= x_select_g + ancho &&
                        this.y_mouse >= y_select_g &&
                        this.y_mouse <= y_select_g + alto;

                    if(isHover && this.eventoLienzoEvento.mouse_only_click){
                        console.log("Deteccion de grupo: ", grupos_);
                        this.grupo_seleccionado = this.grupos_disponibles_generales[i];
                        this.seleccionarGrupo(this.grupo_seleccionado);
                    }
                }
            }

            if(this.tipo_trabajo === TRABAJO_EDICION_MOVIMIENTO){
                const grupo_seleccionado_ = this.eventos_.gestion_grupos.get_grupos_padre_ehijos(this.grupo_seleccionado);
                const rect_seleccion =
                    OperacionesGrupo.calcularCentroGruposSeleccionados(
                        grupo_seleccionado_
                    )
                const movimiento = this.eventos_.obtenerMovimiento(this.id_evento_seleccionado, this.grupo_seleccionado, this.index_mov_seleccionado)

                if(movimiento){
                    const tipo = movimiento.tipo;
                    const datos = movimiento.datos;
                    if(tipo === MOV_ROTACION){
                        //console.log(tipo)
                        const x_centro = rect_seleccion.centro_x;
                        const y_centro = rect_seleccion.centro_y;
                        const vel_angular = parseInt(datos.velAngular);
                        let pivote_x = parseInt(datos.pivoteX)+x_centro;
                        let pivote_y = parseInt(datos.pivoteY)+y_centro;

                        // 1. DISTANCIA AL PIVOTE
                        const distanciaMouse = Math.sqrt(
                            (this.x_mouse - pivote_x) ** 2 +
                            (this.y_mouse - pivote_y) ** 2
                        );

                        // ========================================================
                        // 2. DETECCIÓN DE LA CABEZA DE LA FLECHA
                        // ========================================================
                        const flecha_largo = vel_angular * 0.3;
                        const punta_x = pivote_x + flecha_largo;
                        const punta_y = pivote_y;

                        // Calculamos la distancia entre el mouse y la punta de la flecha
                        const distanciaPuntaFlecha = Math.sqrt(
                            (this.x_mouse - punta_x) ** 2 +
                            (this.y_mouse - punta_y) ** 2
                        );

                        // Le damos un radio de tolerancia de 8 píxeles para que sea fácil de cliquear
                        const clickEnPuntaFlecha = distanciaPuntaFlecha <= 8;
                        // ========================================================

                        // LÓGICA DE EDICIÓN DEL PIVOTE
                        if(!this.edicion_mov_rotacion_pivote && !this.edicion_mov_rotacion_velocidad){

                            if(distanciaMouse <= 5 && this.eventoLienzoEvento.mouse_only_click){
                                this.edicion_mov_rotacion_pivote = true;
                            }
                            // Si el usuario toca la flecha, activamos su propio modo de edición
                            else if(clickEnPuntaFlecha && this.eventoLienzoEvento.mouse_only_click){
                                this.edicion_mov_rotacion_velocidad = true;
                            }

                        } else if(this.edicion_mov_rotacion_pivote) {
                            // Guardar pivote existente...
                            if(this.eventoLienzoEvento.mouse_only_click){
                                this.edicion_mov_rotacion_pivote = false;
                                datos.pivoteX = this.x_mouse;
                                datos.pivoteY = this.y_mouse;
                                this.eventos_.actualizarDatosMovimiento(this.id_evento_seleccionado,
                                    this.grupo_seleccionado,
                                    this.index_mov_seleccionado,
                                    datos);
                            }
                        }
                        // LÓGICA PARA MODIFICAR LA VELOCIDAD CON EL MOUSE
                        else if(this.edicion_mov_rotacion_velocidad) {
                            if(this.eventoLienzoEvento.mouse_only_click){
                                this.edicion_mov_rotacion_velocidad = false;

                                // Calculamos la nueva velocidad basada en la distancia del mouse al pivote
                                // Si el mouse está a la izquierda del pivote, la velocidad debe ser negativa
                                const nuevo_largo = this.x_mouse - pivote_x;
                                const nueva_vel = Math.round(nuevo_largo / 0.3);

                                datos.velAngular = nueva_vel;

                                this.eventos_.actualizarDatosMovimiento(this.id_evento_seleccionado,
                                    this.grupo_seleccionado,
                                    this.index_mov_seleccionado,
                                    datos);
                            }
                        }
                    }
                }
            }
        }
    }

    imprimiendoMovimientosObjeto(){
        const grupo_seleccionado_ = this.eventos_.gestion_grupos.get_grupos_padre_ehijos(this.grupo_seleccionado);
        const rect_seleccion =
            OperacionesGrupo.calcularCentroGruposSeleccionados(
                grupo_seleccionado_
            )
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
        const movimiento = this.eventos_.obtenerMovimiento(this.id_evento_seleccionado, this.grupo_seleccionado, this.index_mov_seleccionado)

        if(movimiento){
            const tipo = movimiento.tipo;
            const datos = movimiento.datos;

            if(tipo === MOV_ROTACION){
                console.log(tipo)
                const x_centro = rect_seleccion.centro_x;
                const y_centro = rect_seleccion.centro_y;
                const vel_angular = parseInt(datos.velAngular);
                let pivote_x = parseInt(datos.pivoteX)+x_centro;
                let pivote_y = parseInt(datos.pivoteY)+y_centro;
                if(this.edicion_mov_rotacion_pivote){
                    pivote_x = this.x_mouse;
                    pivote_y = this.y_mouse;
                }



                //console.log(x_centro, " ", y_centro)
                //console.log(pivote_x, " ", pivote_y)
                // =========================
                // DISTANCIA / RADIO
                // =========================
                const dx = pivote_x - x_centro;
                const dy = pivote_y - y_centro;

                const radio = Math.sqrt(dx * dx + dy * dy);

                ctx.save();

                // =========================
                // ESTILO PUNTEADO
                // =========================
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#8b5cf6';

                // =========================
                // LINEA CENTRO -> PIVOTE
                // =========================
                ctx.beginPath();
                ctx.moveTo(x_centro, y_centro);
                ctx.lineTo(pivote_x, pivote_y);
                ctx.stroke();

                // =========================
                // CIRCULO DE TRAYECTORIA
                // =========================
                ctx.beginPath();
                ctx.arc(
                    pivote_x,
                    pivote_y,
                    radio,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();


                // =========================
                // PEQUEÑA CIRCUNFERENCIA EN EL PIVOTE
                // =========================
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.fillStyle = '#8b5cf6';

                ctx.arc(
                    pivote_x,
                    pivote_y,
                    5,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                // =========================
// FLECHA DE VELOCIDAD ANGULAR
// =========================
                ctx.setLineDash([]); // Línea continua
                ctx.lineWidth = 3;

// 1. CONTROL DE ESTADO: Si está editando, cambia a un color llamativo (ej: Amarillo/Naranja #f59e0b)
                const estaEditandoVel = this.edicion_mov_rotacion_velocidad;
                const colorFlecha = estaEditandoVel ? '#f59e0b' : '#ef4444';

                ctx.strokeStyle = colorFlecha;
                ctx.fillStyle = colorFlecha;

// 2. CÁLCULO DEL LARGO DINÁMICO
                let flecha_largo = 0;
                let direccion = 1;

                if (estaEditandoVel) {
                    // Si edita, el largo es la distancia directa en X desde el pivote al mouse
                    flecha_largo = this.x_mouse - pivote_x;
                    direccion = flecha_largo >= 0 ? 1 : -1;
                } else {
                    // Si no edita, usa el valor guardado
                    flecha_largo = vel_angular * 0.3;
                    direccion = vel_angular > 0 ? 1 : -1;
                }

// Definimos el punto final de la flecha en el eje X
                const destino_x = pivote_x + flecha_largo;
                const destino_y = pivote_y;

// Dibujamos si hay velocidad guardada O si el usuario está arrastrando el mouse
                if (vel_angular !== 0 || estaEditandoVel) {

                    // 1. Dibujar el cuerpo de la flecha (línea recta)
                    ctx.beginPath();
                    ctx.moveTo(pivote_x, pivote_y);
                    ctx.lineTo(destino_x, destino_y);
                    ctx.stroke();

                    // 2. Dibujar la punta de la flecha
                    const tamaño_punta = 8; // Tamaño del triángulo

                    ctx.beginPath();
                    ctx.moveTo(destino_x, destino_y);
                    // Los otros dos puntos del triángulo retroceden en base a la dirección calculada
                    ctx.lineTo(destino_x - tamaño_punta * direccion, destino_y - 5);
                    ctx.lineTo(destino_x - tamaño_punta * direccion, destino_y + 5);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
                //console.log(movimiento)
            }

        }

    }
}

export default GestionLienzoEvento