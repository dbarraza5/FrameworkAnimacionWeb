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

    movimientos_grupos = {};
    copia_grupos = [];
    gestion_eventos = null;
    gestion_grupos = null;
    imprimir_animacion = null;
    configuracion_lienzo = null;
    id_canvas = null;
    constructor() {
        this.id_canvas = "lienzo-animacion"
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

    inicializar(lista_evento, grupos){
        //this.grupos = grupos;
        this.gestion_grupos.grupos_figuras=grupos;
        this.gestion_grupos_originales.grupos_figuras = JSON.parse(JSON.stringify(grupos))
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        console.log(this.lista_raw_evento)
        for(let i=0; i<lista_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
        console.log(this.gestion_grupos.grupos_figuras);
        this.imprimirEventos();
        this.tiempo.modPasivo();
        this.reseteoMovGrupos();
    }

    iniciarRelojes(){
        tiempo_universal=performance.now();
        this.tiempo.modPasivo();
    }

    procesandoEventos(){
        tiempo_universal=performance.now();
        const tiempo = this.tiempo.cronometroC()/1000;

        // for(let i=0; i<this.eventos.length; i++){
        //     for(let j=0; j<this.eventos[i].evento.objetos.length; j++){
        //         this.eventos[i].evento.objetos[j].x_mov =0;
        //         this.eventos[i].evento.objetos[j].y_mov =0;
        //     }
        // }
        this.reseteoMovGrupos();

        for(let i=0; i<this.eventos.length; i++){
            if(this.eventos[i].evento.tiempo_inicio>=tiempo
                && this.eventos[i].evento.tiempo_final<=tiempo){
                if(this.eventos[i].inicio===false){
                    this.eventos[i].inicio=true;
                    this.eventos[i].tiempo.modPasivo();
                }
                const tiempo_evento = this.eventos[i].tiempo.cronometroC()/1000;

                for(let j=0; j<this.eventos[i].movimientos.length; j++){
                    const movimiento = this.eventos[i].movimientos[j];
                    const tipo = movimiento.tipo;
                    const datos = movimiento.datos;
                    const resultado = GestionMovimientos.movimientoGrupo(tiempo_evento, tipo, datos);
                    const x = resultado.x;
                    const y = resultado.y;
                    console.log("[1] MOV ${x}, ${y}");
                    for(let k=0; k<movimiento.ids_grupos.length; k++){
                        const id_grupo = movimiento.ids_grupos[k];
                        const indice = this.eventos[i].objetos.findIndex((objeto)=>objeto.id_objeto===id_grupo);
                        console.log("indice: ".indice);
                        if(indice >= 0){
                            // this.eventos[i].objetos[indice].x_mov+=x;
                            // this.eventos[i].objetos[indice].y_mov+=y;
                            console.log("[2] MOV ${x}, ${y}");
                            this.movimientos_grupos[id_grupo].x+=x;
                            this.movimientos_grupos[id_grupo].y+=y;
                        }
                    }
                }
            }
        }
        for(let i=0; i<this.eventos.length; i++){
            for(let j=0; j<this.eventos[i].evento.objetos.length; j++){
                const objeto_ = this.eventos[i].evento.objetos[j];
                const grupo_original = this.gestion_grupos_originales.getGrupo();

                // this.eventos[i].evento.objetos[j].x_mov =0;
                // this.eventos[i].evento.objetos[j].y_mov =0;
            }
        }
        for(let i=0; i<this.gestion_grupos.grupos_figuras.length; i++){
            const grupo_ = this.gestion_grupos_originales.grupos_figuras[i];
            const x = grupo_.cx+this.movimientos_grupos[grupo_.nombre].x;
            const y = grupo_.cy+this.movimientos_grupos[grupo_.nombre].y;
            this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cx", x);
            this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cy", y);
        }
        console.log("tiempo1: "+tiempo_universal);
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