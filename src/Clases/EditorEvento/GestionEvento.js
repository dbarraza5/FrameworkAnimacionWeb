import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
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
    eventos=[];
    lista_raw_evento=[];

    tiempo=new Tiempo();

    gestion_eventos = null;
    constructor() {
        this.gestion_eventos=new GestionMovimientos();
    }
    inicializar(lista_evento){
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
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
                //this.gestion_eventos.movimientoGrupo()
                for(let j=0; j<this.eventos[i].movimientos.length; j++){
                    const movimiento = this.eventos[i].movimientos[j];
                    for(let k=0; k<movimiento.ids_grupos.length; k++){
                        const id_grupo = movimiento.ids_grupos[k];
                    }
                }
            }
        }
    }

    movimientos(tiempo, lista_mov, objetos){
        for(let i=0; i<lista_mov.length; i++){
            this.gestion_eventos.movimientoGrupo(tiempo,lista_mov[i], objetos)
        }
    }
};

export {GestionEvento}