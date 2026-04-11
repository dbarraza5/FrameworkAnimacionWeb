import ConfiguracionLienzoEvento from "./ConfiguracionLienzoEvento";
import {TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES} from "../EditorAnimacion/ConstanteAnimacion";


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

    constructor(eventos_) {
        this.id_canvas = "lienzo-evento"
        this.x = 0;
        this.y = 0;
        this.eventos_ = eventos_;
        this.id_grupo_selec = "default";
        // this.imprimir_animacion = new ImprimirAnimacion(animacion_,this.configuracion_lienzo, this.id_canvas);
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



        /*if(imprimir_lienzo_completo || this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_IMAGENES ||
            this.categoria_trabajo === TRABAJO_CONFIG_LIENZO_ATRIBUTOS){
            this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, this.id_grupo_selec, this.id_figura_selec, this.lista_id_figuras,
                this.p_centro, this.p1_recta, this.p2_recta, this.p_circulo)
        }*/

        // if(this.categoria_trabajo === TRABAJO_PINTADO_GRUPO){
        //     this.imprimir_animacion.imprimirGrupoPintado(this.gestion_pintado)
        //
        // }

        this.configuracion_lienzo.imprimirVariablesLienzo(ctx);
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

        this.tipo_modalidad = this.configuracion_lienzo.procesarGeneral(eventoLienzoFigura, this.tipo_modalidad,
            this.tipo_trabajo)
        //console.log(eventoLienzoFigura.stack_event_teclado)
        if(true){
            // if (this.categoria_trabajo === TRABAJO_FIGURA) {
            //     this.procesarTrabajoFigura(eventoLienzoFigura, setAnimacion)
            // }
            this.actualizarLienzo();
            this.eventos_.procesandoEventos();
            this.eventos_.imprimirEventos();

            // this.aplicarCambiosConcurrente();


            if(this.editar_lienzo){
                console.log("[EDITAR EL LIENZO]")
                this.funcion_editar_lienzo();
                this.editar_lienzo = false;
            }
            eventoLienzoFigura.reset()
        }
    }
}

export default GestionLienzoEvento