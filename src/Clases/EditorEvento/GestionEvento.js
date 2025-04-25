import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
let tiempo_universal=performance.now();

class Evento{
  evento=null;
  tiempo=null;
  inicio=false;
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

    gestion_eventos = null;
    gestion_grupos = null;
    imprimir_animacion = null;
    configuracion_lienzo = null;
    id_canvas = null;
    constructor() {
        this.id_canvas = "lienzo-animacion"
        this.gestion_eventos= new GestionMovimientos();
        this.gestion_grupos = new GestionAnimacion();
        this.configuracion_lienzo = new ConfiguracionLienzo();
        this.imprimir_animacion = new ImprimirAnimacion(this.imprimir_animacion,this.configuracion_lienzo, this.id_canvas);
    }
    inicializar(lista_evento, grupos){
        //this.grupos = grupos;
        this.gestion_grupos.grupos_figuras=grupos;
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
        console.log(this.gestion_grupos.grupos_figuras);
        this.imprimirEventos();
        this.tiempo.modPasivo();
    }

    iniciarRelojes(){
        tiempo_universal=performance.now();
        this.tiempo.modPasivo();
    }

    procesandoEventos(){
        tiempo_universal=performance.now();
        const tiempo = this.tiempo.cronometroC();
        for(let i=0; i<this.eventos.length; i++){
            if(this.eventos[i].evento.tiempo_inicio>=tiempo
                && this.eventos[i].evento.tiempo_final<=tiempo){
                if(this.eventos[i].inicio===false){
                    this.eventos[i].inicio=true;
                    this.eventos[i].tiempo.modPasivo();
                }
                const tiempo_evento = this.eventos[i].tiempo.cronometroC();

                for(let j=0; j<this.eventos[i].movimientos.length; j++){
                    const movimiento = this.eventos[i].movimientos[j];
                    const tipo = movimiento.tipo;
                    const datos = movimiento.datos;
                    const resultado = this.gestion_eventos.movimientoGrupo(tiempo_evento, tipo, datos);
                    const x = resultado.x;
                    const y = resultado.y;

                    for(let k=0; k<movimiento.ids_grupos.length; k++){
                        const id_grupo = movimiento.ids_grupos[k];
                        const indice = this.eventos[i].objetos.findIndex((objeto)=>objeto.id_objeto===id_grupo);
                        if(indice > 0){
                            this.eventos[i].objetos[indice].x_mov=x;
                            this.eventos[i].objetos[indice].y_mov=y;
                        }
                    }
                }
            }
        }
        console.log("tiempo: "+tiempo_universal);
    }

    movimientos(tiempo, lista_mov, objetos){
        for(let i=0; i<lista_mov.length; i++){
            this.gestion_eventos.movimientoGrupo(tiempo,lista_mov[i], objetos)
        }
    }

    imprimirEventos(){
        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.gestion_grupos.procesarPosicionFinalFiguras()
        this.gestion_grupos.listaOrdenadasGrupos(lista_grupo_root)
        this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, [], [], [],
            null, null, null, null, true)
    }
};

export {GestionEvento}