import {Tiempo} from "./Tiempo";

class Evento{
  evento=null;
  tiempo=null;
  constructor(evento_) {
      this.evento=evento_;
      this.tiempo=new Tiempo();
  }
};

class GestionEvento{
    eventos=[];
    lista_raw_evento=[];
    constructor() {
    }
    inicializar(lista_evento){
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
    }
};

export {GestionEvento}