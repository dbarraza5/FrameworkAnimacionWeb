import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
import TimelineCanvas from "./TimelineCanvas";
import {TIPO_EFECTO_MOV_FIGURAS, TIPO_EFECTO_MOV_OBJETOS} from "./ConstanteEvento";
import OperacionesGrupo from "../EditorAnimacion/OperacionesGrupo";

let tiempo_universal=performance.now();

class Evento{
  evento=null;
  tiempo=null;
  inicio=false;
  activar_tiempo = false;
  constructor(evento_) {
      this.evento=evento_;
      this.tiempo=new Tiempo();
  }
};

class GestionEvento{
    grupos=[];
    eventos=[];
    lista_raw_evento=[];

    tiempo=new Tiempo();

    movimientos_grupos = {};
    movimientos_figuras = {};
    copia_grupos = [];
    gestion_eventos = null;
    gestion_grupos = null;
    imprimir_animacion = null;
    configuracion_lienzo = null;
    id_canvas = null;
    tiempo_animacion = 0;
    version=1;
    _id=null;

    reproducir = false;
    detener = true;
    reiniciar = false;

    id_evento_seleccionado = null;



    constructor() {
        this.id_canvas = "lienzo-evento"
        this.gestion_eventos= new GestionMovimientos();
        this.gestion_grupos = new GestionAnimacion();
        this.gestion_grupos_originales = new GestionAnimacion();
        this.configuracion_lienzo = new ConfiguracionLienzo();
        this.imprimir_animacion = new ImprimirAnimacion(this.imprimir_animacion,this.configuracion_lienzo, this.id_canvas);
    }

    reseteoMovGrupos(){
        for(let i=0; i<this.gestion_grupos_originales.grupos_figuras.length; i++){
            const grupo_ = this.gestion_grupos_originales.grupos_figuras[i];
            this.movimientos_grupos[grupo_.nombre] = {x: 0, y:0};
        }
    }

    reiniciarEventos(){
        this.gestion_grupos.grupos_figuras=structuredClone(this.gestion_grupos_originales.grupos_figuras)
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.modPasivo();
        }
    }

    pausarDesEventos(){
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            //this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.despausar();
        }
    }

    pausarEventos(){
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            //this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.pausar();
        }
    }

    inicializar(lista_evento, grupos, id){
        //this.grupos = grupos;
        this._id =id;
        this.gestion_grupos.grupos_figuras=JSON.parse(JSON.stringify(grupos));
        this.gestion_grupos_originales.grupos_figuras = JSON.parse(JSON.stringify(grupos))
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        console.log(this.lista_raw_evento)
        this.eventos = [];
        for(let i=0; i<this.lista_raw_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
        console.log(this.gestion_grupos.grupos_figuras);
        //this.imprimirEventos();
        this.tiempo.modPasivo();
        this.reseteoMovGrupos();
        console.log("[LISTA EVENTOS] => "+this.eventos.length);
        this.tiempo.pausar();
    }

    iniciarRelojes(){
        tiempo_universal=performance.now();
        this.tiempo.modPasivo();
    }

    agregarEvento(evento_){
        this.eventos.push(new Evento(evento_));
    }

    obtenerHijos(id_padre){
        console.log(id_padre);
        return this.eventos.filter((e) => {
            return e.evento["nodo_padre"] === id_padre;
        });
    }
    obtenerEvento(nombreEvento) {
        return this.eventos.find(evento => evento.evento.nombre === nombreEvento) || null;
    }

    obtenerMovimiento(nombreEvento, id_objeto, indice_movimiento){
        // 1. Buscamos el evento de forma directa por su nombre
        const eventoEncontrado = this.eventos.find(e => e.evento.nombre === nombreEvento);

        if (!eventoEncontrado) return null;

        // 2. Buscamos el objeto dentro de la lista de objetos de ese evento
        const objetoEncontrado = eventoEncontrado.evento.objetos.find(obj => obj.id_objeto === id_objeto);

        if (!objetoEncontrado) return null;

        // 3. Accedemos al movimiento por su índice usando el método .at() o validando la posición
        const movimiento = objetoEncontrado.movimientos[indice_movimiento];

        // Si existe el movimiento en ese índice, lo devuelve; si no, devuelve null
        return movimiento || null;
    }


    actualizarDatosMovimiento(nombreEvento, id_objeto, indice_movimiento, nuevosDatos) {
        // 1. Buscar evento
        const eventoEncontrado = this.eventos.find(
            e => e.evento.nombre === nombreEvento
        );

        if (!eventoEncontrado) return false;

        // 2. Buscar objeto
        const objetoEncontrado = eventoEncontrado.evento.objetos.find(
            obj => obj.id_objeto === id_objeto
        );

        if (!objetoEncontrado) return false;

        // 3. Buscar movimiento
        const movimiento = objetoEncontrado.movimientos[indice_movimiento];

        if (!movimiento) return false;

        // 4. Reemplazar datos
        movimiento.datos = nuevosDatos;

        return true;
    }

    obtenerIndiceEvento(nombreEvento) {
        return this.eventos.findIndex(evento => evento.evento.nombre === nombreEvento);
    }

    procesandoEvento(evento_, tiempo_evento){

        if(evento_){
            //console.log(tiempo_evento)
            if(!evento_.activar_tiempo){
                evento_.activar_tiempo = true;
                this.gestion_grupos_originales.procesarPosicionFinalFiguras()
                evento_.tiempo.modPasivo();
                console.log("INICIALIZANDO EL TIEMPO DEL EVENTO")
            }else{
                const tiempo_inicio = evento_.evento.tiempo_inicio/1000;
                const tiempo_fin = evento_.evento.tiempo_final/1000;
                const tiempo_virtual = tiempo_evento-tiempo_inicio;

                if(tiempo_inicio<=tiempo_evento
                    && tiempo_fin>=tiempo_evento){
                    for(let obj_i=0; obj_i<evento_.evento.objetos.length; obj_i++){
                        const objeto = evento_.evento.objetos[obj_i];
                        console.log("[=============================")
                        for(let j=0; j<objeto.movimientos.length; j++){
                            const movimiento = objeto.movimientos[j];
                            if(!movimiento.activo){
                                continue;
                            }
                            const tiempo_inicio_mov = movimiento.tiempo_inicio/1000;
                            const tiempo_fin_mov = movimiento.tiempo_final/1000;
                            const tiempo_virtual_mov = tiempo_virtual-tiempo_inicio_mov;

                            if(tiempo_inicio_mov<=tiempo_evento
                                && tiempo_fin_mov>=tiempo_evento){
                                const tipo = movimiento.tipo;
                                const tipoEfecto = movimiento.tipo_efecto;
                                const datos = movimiento.datos;
                                let resultado_grupos = null;
                                let resultado_figuras = null;
                                if(tipoEfecto === TIPO_EFECTO_MOV_OBJETOS){
                                    resultado_grupos = GestionMovimientos.movimientoGrupo(tiempo_virtual_mov, tipo, datos);
                                }
                                if(tipoEfecto === TIPO_EFECTO_MOV_FIGURAS){
                                    // console.log("NOMBRE OBJETO: ",objeto.nombre);
                                    // console.log(objeto);
                                    const lista_grupos_originales = this.gestion_grupos_originales.get_grupos_padre_ehijos(objeto.id_objeto);
                                    //const lista_grupos = this.gestion_grupos.get_grupos_padre_ehijos(objeto.nombre);

                                    resultado_figuras = GestionMovimientos.movimientoFiguras(tiempo_virtual_mov, tipo, datos, this.gestion_grupos, lista_grupos_originales);
                                    console.log(resultado_figuras)
                                }
                                if(resultado_grupos){
                                    const x = resultado_grupos.x;
                                    const y = resultado_grupos.y;

                                    this.movimientos_grupos[objeto.id_objeto].x+=x;
                                    this.movimientos_grupos[objeto.id_objeto].y+=y;
                                }

                                if(resultado_figuras){
                                    //this.movimientos_figuras
                                    for (const hash in resultado_figuras) {
                                        const nuevo = resultado_figuras[hash];
                                        // Primera vez que aparece la figura
                                        if (!this.movimientos_figuras[hash]) {
                                            this.movimientos_figuras[hash] = structuredClone(nuevo);
                                            continue;
                                        }

                                        const acumulado = this.movimientos_figuras[hash];
                                        for (const atributo in nuevo) {
                                            // No sumar strings
                                            if (typeof nuevo[atributo] !== "number") {
                                                acumulado[atributo] = nuevo[atributo];
                                                continue;
                                            }
                                            if (typeof acumulado[atributo] !== "number") {
                                                acumulado[atributo] = nuevo[atributo];
                                                continue;
                                            }
                                            const es_centro = atributo==="centro_x" || atributo==="centro_y";
                                            if(!es_centro){
                                                acumulado[atributo] += nuevo[atributo];
                                            }

                                        }
                                    }
                                }

                            }
                        }
                        console.log(this.movimientos_figuras)
                        console.log("=============================]")
                    }
                    //console.log(JSON.parse(JSON.stringify(this.movimientos_grupos)))
                }else{
                    if(tiempo_fin<tiempo_evento){
                        console.log("SE TERMINO EL TIEMPO: ", tiempo_evento)
                        this.reiniciarEventos();
                        this.reiniciarProceso();
                    }
                }
            }
        }
    }

    procesandoEventos(){
        tiempo_universal=performance.now();
        const tiempo = this.tiempo.cronometroC(tiempo_universal);
        if(true)//(this.reproducir)
        {
            //console.log('tiempo universal: ', tiempo_universal);
            this.tiempo_animacion = tiempo;
            for(let i=0; i<this.eventos.length; i++){
                for(let j=0; j<this.eventos[i].evento.objetos.length; j++){
                    this.eventos[i].evento.objetos[j].x_mov =0;
                    this.eventos[i].evento.objetos[j].y_mov =0;
                }
            }

            for (let nombre_grupo in this.movimientos_grupos){
                this.movimientos_grupos[nombre_grupo]['x']=0;
                this.movimientos_grupos[nombre_grupo]['y']=0;
            }
            this.movimientos_figuras = {};

            const evento_ = this.obtenerEvento("EventoGeneral");
            const tiempo_evento = evento_.tiempo.cronometroC(tiempo_universal);
            if(this.reproducir){
                this.procesandoEvento(evento_, tiempo_evento);
            }else{
                //this.procesandoEvento(evento_, 0.5);
            }



            for (let nombre_grupo in this.movimientos_grupos) {
                const grupo_ = this.gestion_grupos_originales.getGrupo(nombre_grupo)
                if (grupo_) {
                    const x = grupo_.cx+this.movimientos_grupos[grupo_.nombre].x;
                    const y = grupo_.cy+this.movimientos_grupos[grupo_.nombre].y;
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cx", x);
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cy", y);
                }
            }

            for (const [clave, valor] of Object.entries(this.movimientos_figuras)) {
                console.log(`K ${clave}: ${valor}`);
                console.log(valor)
                const lista_grupos_originales = this.gestion_grupos_originales.get_grupos_padre_ehijos(valor.nombre_grupo);
                const centro_=OperacionesGrupo.calcularCentroGruposSeleccionados(lista_grupos_originales)
                const grupo_ = this.gestion_grupos_originales.getGrupo(valor.nombre_grupo)
                const figura1_=this.gestion_grupos_originales.get_figura(valor.nombre_grupo, valor.nombre_figura, true)
                if (figura1_){
                    const pivote_x = 0;
                    const pivote_y = 0;
                    let x = valor.pivote_x+valor.centro_x//pivote_x - grupo_.cx+centro_.centro_x;
                    let y = valor.pivote_y+valor.centro_y//pivote_y - grupo_.cy+centro_.centro_y;
                    if (figura1_.tipo_figura === "PUNTO" || figura1_.tipo_figura === "CIRCULO") {
                        figura1_.atributos.cx = x+valor.cx;
                        figura1_.atributos.cy = y+valor.cy;
                        this.gestion_grupos.set_figura(valor.nombre_grupo, figura1_)
                    }

                    if (figura1_.tipo_figura === "RECTA") {
                        figura1_.atributos.x1 = valor.x1+x;
                        figura1_.atributos.y1 = valor.y1+y;

                        figura1_.atributos.x2 = valor.x2+x;
                        figura1_.atributos.y2 = valor.y2+y;

                        figura1_.atributos.cx = valor.cx;
                        figura1_.atributos.cy = valor.cy;

                        console.log("[figura1_]")
                        //console.log(figura1_)
                        this.gestion_grupos.set_figura(valor.nombre_grupo, figura1_)
                        console.log(this.gestion_grupos.get_figura(valor.nombre_grupo, valor.nombre_figura))
                    }


                }
            }

        }
        if(this.detener){
            //this.tiempo.pausar();
        }

    }

    movimientos(tiempo, lista_mov, objetos){
        for(let i=0; i<lista_mov.length; i++){
            this.gestion_eventos.movimientoGrupo(tiempo,lista_mov[i], objetos)
        }
    }

    imprimirEventos(){
        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        //ctx.clearRect(0, 0, canvas.width, canvas.height);

        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.gestion_grupos.procesarPosicionFinalFiguras()
        this.gestion_grupos.listaOrdenadasGrupos(lista_grupo_root)
        this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, [], [], [],
            null, null, null, null, true)
    }

    reproducirProceso(){
        this.reproducir = true;
        this.detener = false;
        this.reiniciar = false;
        this.tiempo.despausar();
    }

    detenerProceso(){
        this.reproducir = false;
        this.detener = true;
        this.reiniciar = false;
    }

    reiniciarProceso(){
        this.reiniciar = true;
        this.detener = false;
        this.reproducir = false;
    }

    resetearProceso(){
        this.reiniciar = false;
        this.detener = false;
        this.reproducir = false;
    }
};

export {GestionEvento}