import ConfiguracionLienzoEvento from "./ConfiguracionLienzoEvento";
import {TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES} from "../EditorAnimacion/ConstanteAnimacion";
import TimelineCanvas from "./TimelineCanvas";
import {MODALIDAD_MOVIMIENTOS} from "./ConstanteEvento";
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
    tipo_trabajo = null;

    timelineInstance = null;
    eventoLienzoEvento =null;

    grupos_disponibles_generales = [];
    grupo_seleccionado = null;

    constructor(eventos_, eventoLienzoEvento, setEventoAnimacion, seleccionarGrupo) {
        this.id_canvas = "lienzo-evento"
        this.x = 0;
        this.y = 0;
        this.eventos_ = eventos_;
        this.id_grupo_selec = "default";
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

                // console.log(this.grupos_disponibles_generales[i])
                // console.log(this.grupo_seleccionado)
                // console.log("=============================")
                if(this.grupo_seleccionado===this.grupos_disponibles_generales[i]){
                    dibujar_rec_transparencia(ctx, "#76ff14","#c73cee", x_select_g, y_select_g,
                        rect_seleccion.ancho, rect_seleccion.alto)
                }
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

        this.tipo_modalidad = this.configuracion_lienzo.procesarGeneral(this.eventoLienzoEvento, this.tipo_modalidad,
            this.tipo_trabajo)
        //console.log(this.eventoLienzoEvento.stack_event_teclado)
        if(true){
            this.timelineInstance.procesar();

            if(this.timelineInstance.click_reproducir){
                console.log("click_reproducir: ", this.timelineInstance.click_reproducir);
                this.eventos_.reiniciarEventos();
                this.eventos_.reproducirProceso();
            }

            if(this.timelineInstance.click_reiniciar){
                this.eventos_.reiniciarEventos();
                this.eventos_.reiniciarProceso();
                console.log("ugvyghgcgvh")
            }

            this.eventos_.procesandoEventos();


            if(this.eventos_.reiniciar){
                console.log("DEBERIA AVISAR QUE TERMINO")
                this.timelineInstance.reiniciarAnimacion();
            }

            if(this.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
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

            this.actualizarLienzo();
            this.timelineInstance.reiniciar();

        }

        this.eventoLienzoEvento.reset()
    }


}

export default GestionLienzoEvento