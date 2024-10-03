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

    constructor() {
    }
    inicializar(lista_evento){
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
    }
};

export {GestionEvento}