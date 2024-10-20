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
    grupos=[];
    eventos=[];
    lista_raw_evento=[];

    tiempo=new Tiempo();

    gestion_eventos = null;
    constructor() {
        this.gestion_eventos=new GestionMovimientos();
    }
    inicializar(lista_evento, grupos){
        this.grupos = grupos;
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
        console.log(grupos);
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

                    for(let k=0; k<movimiento.ids_grupos.length; k++){
                        const id_grupo = movimiento.ids_grupos[k];
                        const filtro = this.eventos[i].objetos.filter((objeto)=>objeto.id_objeto===id_grupo);
                        if(filtro.length > 0){
                            const grupo_ = filtro[0];
                            this.gestion_eventos.movimientoGrupo(tiempo_evento, )
                        }
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