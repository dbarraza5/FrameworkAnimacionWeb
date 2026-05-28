import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
import TimelineCanvas from "./TimelineCanvas";
import {TIPO_EFECTO_MOV_FIGURAS, TIPO_EFECTO_MOV_OBJETOS} from "./ConstanteEvento";

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
                // console.log("tiempo inicio : ", tiempo_inicio)
                 //console.log("tiempo real   : ", tiempo_evento)
                // console.log("tiempo virtual: ", tiempo_virtual)
                // console.log("tiempo final  : ", tiempo_fin)
                // console.log()
                if(tiempo_inicio<=tiempo_evento
                    && tiempo_fin>=tiempo_evento){
                    for(let obj_i=0; obj_i<evento_.evento.objetos.length; obj_i++){
                        const objeto = evento_.evento.objetos[obj_i];
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
                                let resultado = null;
                                if(tipoEfecto === TIPO_EFECTO_MOV_OBJETOS){
                                    resultado = GestionMovimientos.movimientoGrupo(tiempo_virtual_mov, tipo, datos);
                                }
                                if(tipoEfecto === TIPO_EFECTO_MOV_FIGURAS){
                                    // console.log("NOMBRE OBJETO: ",objeto.nombre);
                                    // console.log(objeto);
                                    const lista_grupos_originales = this.gestion_grupos_originales.get_grupos_padre_ehijos(objeto.id_objeto);
                                    //const lista_grupos = this.gestion_grupos.get_grupos_padre_ehijos(objeto.nombre);
                                    resultado = GestionMovimientos.movimientoFiguras(tiempo_virtual_mov, tipo, datos, this.gestion_grupos, lista_grupos_originales);
                                }
                                if(resultado){
                                    const x = resultado.x;
                                    const y = resultado.y;

                                    this.movimientos_grupos[objeto.id_objeto].x+=x;
                                    this.movimientos_grupos[objeto.id_objeto].y+=y;
                                }

                            }
                        }
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
                // const objeto = this.movimientos_grupos[nombre_grupo];
                // console.log(objeto)
                this.movimientos_grupos[nombre_grupo]['x']=0;
                this.movimientos_grupos[nombre_grupo]['y']=0;
            }

            const evento_ = this.obtenerEvento("EventoGeneral");
            const tiempo_evento = evento_.tiempo.cronometroC(tiempo_universal);
            if(this.reproducir){
                this.procesandoEvento(evento_, tiempo_evento);
            }else{
                //this.procesandoEvento(evento_, 0.5);
            }


            // for(let i=0; i<this.gestion_grupos.grupos_figuras.length; i++){
            //     const grupo_ = this.gestion_grupos_originales.grupos_figuras[i];
            //     const x = grupo_.cx+this.movimientos_grupos[grupo_.nombre].x;
            //     const y = grupo_.cy+this.movimientos_grupos[grupo_.nombre].y;
            //     this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cx", x);
            //     this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cy", y);
            //     //console.log(`[CXY] MOV ${x}, ${y}`);
            // }

            for (let nombre_grupo in this.movimientos_grupos) {
                const grupo_ = this.gestion_grupos_originales.getGrupo(nombre_grupo)
                if (grupo_) {
                    const x = grupo_.cx+this.movimientos_grupos[grupo_.nombre].x;
                    const y = grupo_.cy+this.movimientos_grupos[grupo_.nombre].y;
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cx", x);
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cy", y);
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