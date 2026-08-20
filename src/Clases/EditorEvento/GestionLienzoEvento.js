import ConfiguracionLienzoEvento from "./ConfiguracionLienzoEvento";
import {TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES} from "../EditorAnimacion/ConstanteAnimacion";
import TimelineCanvas from "./TimelineCanvas";
import {
    MODALIDAD_MOVIMIENTOS, MOV_CIRCULAR, MOV_GRAVEDAD, MOV_LERP, MOV_OSCILATORIO, MOV_PARABOLICO_ANGULO,
    MOV_RECTILINEO_2D, MOV_RECTILINEO_ACELERADO, MOV_RECTILINEO_UNIFORME,
    MOV_ROTACION, MOV_ZOOM, TRABAJO_EDICION_MOVIMIENTO,
    TRABAJO_NADA_LIENZO,
    TRABAJO_REPRODUCCION,
    TRABAJO_SELECCION_GRUPO
} from "./ConstanteEvento";
import OperacionesGrupo from "../EditorAnimacion/OperacionesGrupo";
import {dibujar_rec_transparencia, dibujar_rectangulo} from "../EditorAnimacion/ImprimirAnimacion";
import ControlVectorLienzo from "./ControlVectorLienzo";
import ControlFlechaLienzo from "./ControlFlechaLienzo";
import ControlZoomLienzo from "./ControlZoomLienzo";
import ControlOscilatorioLienzo from "./ControlOscilatorioLienzo";

// Nombres de campo en `datos` para cada tipo de movimiento que usa ControlVectorLienzo
// (pivote propio + flecha-medidor de magnitud).
const CAMPOS_VECTOR_POR_TIPO = {
    [MOV_ROTACION]: {campo_pivote_x: 'pivoteX', campo_pivote_y: 'pivoteY', campo_velocidad: 'velAngular'},
    [MOV_CIRCULAR]: {campo_pivote_x: 'pivote_x', campo_pivote_y: 'pivote_y', campo_velocidad: 'velocidad_angular'},
};

const numero = (valor) => parseFloat(valor) || 0;

// Lectura/escritura del vector en unidades propias de cada tipo, para los movimientos
// con origen fijo (centro del grupo) que usa ControlFlechaLienzo.
const CONFIG_FLECHA_POR_TIPO = {
    [MOV_RECTILINEO_UNIFORME]: {
        restriccion_eje: 'x',
        leerVector: (datos) => ({x: numero(datos.velocidad), y: 0}),
        guardarVector: (datos, x) => { datos.velocidad = Math.round(x); },
    },
    [MOV_RECTILINEO_ACELERADO]: {
        restriccion_eje: 'x',
        leerVector: (datos) => ({x: numero(datos.velocidad), y: 0}),
        guardarVector: (datos, x) => { datos.velocidad = Math.round(x); },
    },
    [MOV_RECTILINEO_2D]: {
        restriccion_eje: null,
        leerVector: (datos) => ({x: numero(datos.vx), y: numero(datos.vy)}),
        guardarVector: (datos, x, y) => { datos.vx = Math.round(x); datos.vy = Math.round(y); },
    },
    [MOV_GRAVEDAD]: {
        restriccion_eje: 'y',
        leerVector: (datos) => ({x: 0, y: numero(datos.v0y)}),
        guardarVector: (datos, x, y) => { datos.v0y = Math.round(y); },
    },
    [MOV_LERP]: {
        // igual que los demas: parte de (0,0) -- la posicion real del grupo -- y
        // el vector es directamente el punto final relativo a ese origen.
        restriccion_eje: null,
        leerVector: (datos) => ({x: numero(datos.fin_x), y: numero(datos.fin_y)}),
        guardarVector: (datos, x, y) => { datos.fin_x = Math.round(x); datos.fin_y = Math.round(y); },
    },
    [MOV_PARABOLICO_ANGULO]: {
        restriccion_eje: null,
        // el dato real es polar (velocidadInicial + angulo); se convierte a cartesiano
        // solo para poder dibujarlo/arrastrarlo como flecha. El signo de Y se invierte
        // porque GestionMovimientos ya invierte Y al aplicar el movimiento (lanzamiento
        // hacia arriba = angulo positivo), y la flecha debe apuntar hacia donde se lanza.
        leerVector: (datos) => {
            const v = numero(datos.velocidadInicial);
            const rad = numero(datos.angulo) * Math.PI / 180;
            return {x: v * Math.cos(rad), y: -v * Math.sin(rad)};
        },
        guardarVector: (datos, x, y) => {
            datos.velocidadInicial = Math.round(Math.sqrt(x * x + y * y));
            datos.angulo = Math.round(Math.atan2(-y, x) * 180 / Math.PI);
        },
        // Misma formula que GestionMovimientos.movParabolicoAngulo (x = v0x*t,
        // y_pantalla = -(v0y*t - 0.5*g*t^2)), pero expresada directo en terminos de
        // `vector` (que ya es {v0x, -v0y}) para no tener que reconvertir a angulo/modulo.
        calcularTrayectoria: (vector, datos, duracion) => {
            // mismo criterio que GestionMovimientos.movParabolicoAngulo: g=9.8 solo si
            // no se definio, sin pisar un g=0 puesto a proposito.
            const g = (datos.g === undefined || datos.g === '' || datos.g === null)
                ? 9.8 : parseFloat(datos.g);
            const t_max = duracion > 0 ? duracion : 1;
            const pasos = 24;
            const puntos = [];
            for(let i = 1; i <= pasos; i++){
                const t = t_max * (i / pasos);
                puntos.push({
                    x: vector.x * t,
                    y: vector.y * t + 0.5 * g * t * t,
                });
            }
            return puntos;
        },
    },
};

// Nombres de campo para el pivote/velocidad de Zoom (ControlZoomLienzo).
const CAMPOS_ZOOM_POR_TIPO = {
    [MOV_ZOOM]: {campo_pivote_x: 'pivoteX', campo_pivote_y: 'pivoteY', campo_velocidad: 'velocidad'},
};

// Nombres de campo de amplitud para Oscilatorio (ControlOscilatorioLienzo).
// `frecuenciaX`/`frecuenciaY` quedan solo en el formulario, sin control en el lienzo.
const CAMPOS_OSCILATORIO_POR_TIPO = {
    [MOV_OSCILATORIO]: {campo_amplitud_x: 'amplitudX', campo_amplitud_y: 'amplitudY'},
};



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
    // Ultimo grupo cuyos movimientos se cargaron en el timeline (para detectar
    // cuando hay que refrescarlo -- ver actualizarTimelineMovimientos).
    _grupo_timeline_cargado = null;

    funcionCambioTrabajo = null;

    control_vector = new ControlVectorLienzo();
    control_flecha = new ControlFlechaLienzo();
    control_zoom = new ControlZoomLienzo();
    control_oscilatorio = new ControlOscilatorioLienzo();

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

        // GestionEvento (eventos_) construye su propia ConfiguracionLienzo por su cuenta
        // y ya se la paso a su ImprimirAnimacion -- una instancia totalmente separada de
        // esta ConfiguracionLienzoEvento de aca. Sin unificarlas, el pan/zoom que se
        // maneja en este archivo (arrastre, centrar, zoom) nunca llega al dibujo real
        // del grupo (imprimirEventos -> ImprimirAnimacion), solo a los overlays propios
        // (grilla, rectangulos de seleccion) que ya leen this.configuracion_lienzo
        // directamente -- por eso el fondo se movia pero las figuras no. Se reapuntan
        // ambas referencias (la de GestionEvento y la que ya capturo ImprimirAnimacion
        // en su constructor) a esta misma instancia.
        this.eventos_.configuracion_lienzo = this.configuracion_lienzo;
        if(this.eventos_.imprimir_animacion){
            this.eventos_.imprimir_animacion.configuracion_lienzo = this.configuracion_lienzo;
        }
    }

    inicializar(){
        this.timelineInstance.inicializar()
    }

    // Elige que control de lienzo (y su configuracion de campos) corresponde al tipo
    // de movimiento actual. Devuelve null si ese tipo todavia no tiene overlay.
    resolverControl(tipo){
        if(CAMPOS_VECTOR_POR_TIPO[tipo]){
            return {control: this.control_vector, config: CAMPOS_VECTOR_POR_TIPO[tipo]};
        }
        if(CONFIG_FLECHA_POR_TIPO[tipo]){
            return {control: this.control_flecha, config: CONFIG_FLECHA_POR_TIPO[tipo]};
        }
        if(CAMPOS_ZOOM_POR_TIPO[tipo]){
            return {control: this.control_zoom, config: CAMPOS_ZOOM_POR_TIPO[tipo]};
        }
        if(CAMPOS_OSCILATORIO_POR_TIPO[tipo]){
            return {control: this.control_oscilatorio, config: CAMPOS_OSCILATORIO_POR_TIPO[tipo]};
        }
        return null;
    }

    limpiar(){
        this.timelineInstance.dispose();
    }

    // Mantiene this.timelineInstance.lista_objetos sincronizada con los movimientos
    // reales del grupo seleccionado (nivel "movimientos" del timeline), sin pisar un
    // arrastre/estiramiento en curso.
    actualizarTimelineMovimientos(){
        if(this.tipo_modalidad !== MODALIDAD_MOVIMIENTOS){
            return;
        }

        const t = this.timelineInstance;
        const interactuando = t.selected || t.isResizing || t.isDraggingLineaTiempo
            || t.isDraggingTimelineX || t.isDraggingTimelineY;
        if(interactuando){
            return;
        }

        if(!this.grupo_seleccionado){
            if(this._grupo_timeline_cargado !== null){
                t.cambiarEventos([]);
                this._grupo_timeline_cargado = null;
            }
            return;
        }

        t.id_evento_seleccionado = this.id_evento_seleccionado;
        t.grupo_seleccionado = this.grupo_seleccionado;

        const movimientos = this.eventos_.obtenerMovimientosDeGrupo(this.id_evento_seleccionado, this.grupo_seleccionado);
        if(!movimientos){
            return;
        }

        const desactualizado = this.grupo_seleccionado !== this._grupo_timeline_cargado
            || movimientos.length !== t.lista_objetos.length
            || movimientos.some((mov, i) => {
                const actual = t.lista_objetos[i];
                return !actual || actual.inicio !== mov.tiempo_inicio || actual.fin !== mov.tiempo_final;
            });

        if(desactualizado){
            t.cambiarEventos(movimientos.map((mov, index) => ({
                id: index,
                inicio: mov.tiempo_inicio,
                fin: mov.tiempo_final
            })));
            this._grupo_timeline_cargado = this.grupo_seleccionado;
        }
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


        // inicioZoomLienzo/finZoomLienzo deben envolver el dibujo real (el grupo, sus
        // overlays de seleccion/edicion) para que el zoom se vea reflejado -- antes se
        // llamaban una justo despues de la otra sin nada en el medio, asi que aunque
        // `escala` cambiara no tenia ningun efecto visible. El HUD de texto y el
        // timeline quedan afuera a proposito (UI fija, no debe escalarse).
        this.configuracion_lienzo.inicioZoomLienzo(ctx);

        // Grilla de referencia (sutil, detras del dibujo) -- ayuda a ubicarse al panear
        // y a notar cuando se volvio exactamente a (0,0).
        this.configuracion_lienzo.dibujarGrilla(ctx);

        this.eventos_.imprimirEventos();

        if(this.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
            this.dibujarGrupoSeleccionado(ctx);

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

        this.configuracion_lienzo.finZoomLienzo(ctx);

        this.configuracion_lienzo.imprimirVariablesLienzo(ctx);
        this.configuracion_lienzo.dibujarBotones(ctx);
        this.timelineInstance.imprimir();
    }

    procesarEventoLienzo(setAnimacion, actListaTrabajo) {

        this.puntero_real.x= this.eventoLienzoEvento.mouse_x;
        this.puntero_real.y= this.eventoLienzoEvento.mouse_y;

        // Los botones (zoom y centrar) son UI fija en coordenadas de pantalla (sin pan
        // ni escala), asi que se resuelven con el mouse crudo antes de calcular las
        // coordenadas virtuales de mas abajo. Si el click cayo en un boton, no debe
        // interpretarse tambien como click sobre el lienzo (seleccion de grupo, arrastre
        // del pivote, paneo, etc.).
        const click_en_boton = this.configuracion_lienzo.procesarClickBotones(
            this.eventoLienzoEvento.mouse_x, this.eventoLienzoEvento.mouse_y, this.eventoLienzoEvento.mouse_only_click
        );

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


            // Paneo del lienzo: arrastrar sobre el fondo (no sobre un boton, un grupo
            // seleccionable o el control de un movimiento en edicion) mueve la vista. Si
            // ya se estaba arrastrando, se continua sin volver a correr los hit-test de
            // grupo/pivote de mas abajo (evita que un drag largo termine seleccionando
            // algo por el camino). El area del timeline (abajo) queda afuera -- ese click
            // ya lo maneja TimelineCanvas por su cuenta.
            if(this.configuracion_lienzo.arrastrando_lienzo){
                this.configuracion_lienzo.procesarArrastreLienzo(
                    this.eventoLienzoEvento.mouse_x, this.eventoLienzoEvento.mouse_y, this.eventoLienzoEvento.mouse_click_up
                );
            }else if(!click_en_boton){
                const interactuo = this.procesoEdicionMovimientos();
                const y_limite_lienzo = this.timelineInstance.y_timeline - this.timelineInstance._altoUI;
                const click_en_area_lienzo = this.eventoLienzoEvento.mouse_y < y_limite_lienzo;
                if(!interactuo && this.eventoLienzoEvento.mouse_only_click && click_en_area_lienzo){
                    this.configuracion_lienzo.iniciarArrastreLienzo(
                        this.eventoLienzoEvento.mouse_x, this.eventoLienzoEvento.mouse_y
                    );
                }
            }
            this.actualizarTimelineMovimientos();
            this.actualizarLienzo();
            this.timelineInstance.reiniciar();

        }

        this.eventoLienzoEvento.reset()
    }

    // Devuelve true si el click de este tick fue "reclamado" por algo del lienzo
    // (seleccionar un grupo, empezar/continuar/terminar de editar el pivote de un
    // movimiento) -- GestionLienzoEvento.procesarEventoLienzo() usa esto para no
    // arrancar tambien un arrastre de paneo del lienzo con el mismo click.
    procesoEdicionMovimientos(){
        let interactuo = false;
        if(this.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
            //console.log(this.tipo_trabajo)
            if(this.tipo_trabajo === TRABAJO_SELECCION_GRUPO){
                this.grupos_disponibles_generales = this.eventos_.gestion_grupos.get_nombres_grupos_hijos(this.grupo_seleccionado);
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
                        interactuo = true;
                    }
                }
            }

            if(this.tipo_trabajo === TRABAJO_EDICION_MOVIMIENTO){
                // gestion_grupos_originales (posicion de reposo), no gestion_grupos (la
                // posicion en vivo, ya desplazada por este mismo movimiento) -- si no, el
                // pivote/circulo se recalcula cada frame relativo a donde el grupo ya
                // llego, y el overlay "persigue" al grupo en vez de quedarse fijo en el
                // espacio mientras el grupo orbita/avanza sobre el.
                const grupo_seleccionado_ = this.eventos_.gestion_grupos_originales.get_grupos_padre_ehijos(this.grupo_seleccionado);
                const rect_seleccion =
                    OperacionesGrupo.calcularCentroGruposSeleccionados(
                        grupo_seleccionado_
                    )
                const movimiento = this.eventos_.obtenerMovimiento(this.id_evento_seleccionado, this.grupo_seleccionado, this.index_mov_seleccionado)

                if(movimiento){
                    const tipo = movimiento.tipo;
                    const datos = movimiento.datos;

                    const resuelto = this.resolverControl(tipo);

                    if(resuelto){
                        const {control, config} = resuelto;
                        control.configurar(config);
                        const guardo_cambio = control.procesarInteraccion(
                            this.x_mouse, this.y_mouse, this.eventoLienzoEvento.mouse_only_click,
                            datos, rect_seleccion.centro_x, rect_seleccion.centro_y
                        );
                        if(guardo_cambio){
                            this.eventos_.actualizarDatosMovimiento(this.id_evento_seleccionado,
                                this.grupo_seleccionado,
                                this.index_mov_seleccionado,
                                datos);
                        }
                        // Cualquier flag "edicionXxx" del control (empezo, sigue o termino de
                        // editar el pivote/flecha/mango) cuenta como que este click es suyo.
                        interactuo = guardo_cambio ||
                            Object.keys(control).some((k) => k.startsWith("edicion") && control[k]);
                    }
                }
            }
        }
        return interactuo;
    }

    // Resalta el grupo actualmente elegido en la seccion de Movimientos con un
    // rectangulo azul, sin importar el sub-estado (navegando hijos o editando un
    // movimiento) -- a diferencia del rectangulo verde de TRABAJO_SELECCION_GRUPO,
    // que solo marca los grupos hijos disponibles mientras se esta navegando.
    dibujarGrupoSeleccionado(ctx){
        if(!this.grupo_seleccionado) return;

        const grupo_seleccionado_ = this.eventos_.gestion_grupos.get_grupos_padre_ehijos(this.grupo_seleccionado);
        if(grupo_seleccionado_.length === 0) return;

        const rect_seleccion = OperacionesGrupo.calcularCentroGruposSeleccionados(grupo_seleccionado_);
        if(!isFinite(rect_seleccion.inf_hor) || !isFinite(rect_seleccion.inf_ver)) return;

        const x_select_g = rect_seleccion.inf_hor + this.configuracion_lienzo.x_delta_original;
        const y_select_g = rect_seleccion.inf_ver + this.configuracion_lienzo.y_delta_original;

        dibujar_rec_transparencia(ctx, "#0066ff", "#0066ff", x_select_g, y_select_g,
            rect_seleccion.ancho, rect_seleccion.alto, 0.15);
    }

    imprimiendoMovimientosObjeto(){
        // Ver comentario en procesoEdicionMovimientos(): el overlay se ancla a la
        // posicion de reposo, no a la posicion en vivo ya desplazada.
        const grupo_seleccionado_ = this.eventos_.gestion_grupos_originales.get_grupos_padre_ehijos(this.grupo_seleccionado);
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

            const resuelto = this.resolverControl(tipo);

            if(resuelto){
                const {control, config} = resuelto;
                const duracion = (movimiento.tiempo_final - movimiento.tiempo_inicio) / 1000;
                control.configurar(config);
                control.dibujar(
                    ctx, datos, rect_seleccion.centro_x, rect_seleccion.centro_y,
                    this.x_mouse, this.y_mouse, duracion
                );
            }
        }

    }
}

export default GestionLienzoEvento