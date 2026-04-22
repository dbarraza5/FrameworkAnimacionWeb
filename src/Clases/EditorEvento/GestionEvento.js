import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
import TimelineCanvas from "./TimelineCanvas";

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

    procesandoEvento(){
        const evento_ = this.obtenerEvento("EventoGeneral");
        if(evento_){
            const tiempo_evento = evento_.tiempo.cronometroC(tiempo_universal);

            if(evento_.evento.tiempo_inicio<=tiempo_evento
                && evento_.evento.tiempo_final>=tiempo_evento){
                //console.log(tiempo_evento)
                if(!evento_.activar_tiempo){
                    evento_.activar_tiempo = true;
                    evento_.tiempo.modPasivo();
                    console.log("INICIALIZANDO EL TIEMPO DEL EVENTO")
                }else{
                    for(let obj_i=0; obj_i<evento_.evento.objetos.length; obj_i++){
                        const objeto = evento_.evento.objetos[obj_i];
                        for(let j=0; j<objeto.movimientos.length; j++){
                            const movimiento = objeto.movimientos[j];
                            const tipo = movimiento.tipo;
                            const datos = movimiento.datos;
                            const resultado = GestionMovimientos.movimientoGrupo(tiempo_evento, tipo, datos);
                            const x = resultado.x;
                            const y = resultado.y;

                            this.movimientos_grupos[objeto.id_objeto].x+=x;
                            this.movimientos_grupos[objeto.id_objeto].y+=y;
                        }
                    }
                }
            }
        }
    }

    procesandoEventos(){
        tiempo_universal=performance.now();
        const tiempo = this.tiempo.cronometroC(tiempo_universal);
        if(this.reproducir){
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
            // this.reseteoMovGrupos();
            //
            // for(let i=0; i<this.eventos.length; i++){
            //     const evento_ = this.eventos[i].evento;
            //     if(evento_.tiempo_inicio<=tiempo
            //         && evento_.tiempo_final>=tiempo){
            //         // if(this.eventos[i].inicio===false){
            //         //     this.eventos[i].inicio=true;
            //         //     this.eventos[i].tiempo.modPasivo();
            //         // }
            //         const tiempo_evento = this.eventos[i].tiempo.cronometroC(tiempo_universal);
            //         for(let obj_i=0; obj_i<evento_.objetos.length; obj_i++){
            //             const objeto = evento_.objetos[obj_i];
            //             for(let j=0; j<objeto.movimientos.length; j++){
            //                 const movimiento = objeto.movimientos[j];
            //                 const tipo = movimiento.tipo;
            //                 const datos = movimiento.datos;
            //                 const resultado = GestionMovimientos.movimientoGrupo(tiempo_evento, tipo, datos);
            //                 const x = resultado.x;
            //                 const y = resultado.y;
            //
            //                 this.movimientos_grupos[objeto.id_objeto].x+=x;
            //                 this.movimientos_grupos[objeto.id_objeto].y+=y;
            //             }
            //         }
            //
            //     }
            // }
            //
            this.procesandoEvento();
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
            //console.log("tiempo1: "+tiempo);

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