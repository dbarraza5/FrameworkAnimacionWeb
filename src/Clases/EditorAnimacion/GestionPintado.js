import OperacionesGrupo from "./OperacionesGrupo";
import Fisica from "./Fisica";
import {getCoorPunto, getCoorRecta} from "./GestionAnimacion";

class GestionPintado {
    grupo = null;
    grupo_copia = null;
    elementos_pintar = []//{nombre: f1, comp: punto1}
    indice_seleccion_pintado = -1;

    rect_figura_ = {
        x: 0,
        y: 0,
        h: 5,
        w: 5
    }

    puntero = {
        x: 0,
        y: 0,
        h: 5,
        w: 5
    }

    relleno_pintura = false;

    mover_grupo = false;
    x_inicial = 0;
    y_inicial = 0;
    escalaZoom = 0.2

    arrastrando_punto =false;
    componente_arrastrado = null;
    constructor() {
    }

    inicializarGrupo(grupo_) {
        this.grupo = grupo_;
        this.grupo_copia = JSON.parse(JSON.stringify(grupo_))
        let centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados([this.grupo_copia])
        const max_medida = centro_grupo.alto>centro_grupo.ancho? centro_grupo.alto : centro_grupo.ancho;
        const porcentaje = (600 -max_medida)/600

        OperacionesGrupo.moverGrupo(this.grupo_copia, grupo_, centro_grupo.centro_x,
            centro_grupo.centro_y, 300, 300)
        console.log(centro_grupo)
        console.log(porcentaje)
        this.zoomGrupo(porcentaje)

    }

    zoomGrupo(porcentaje){
        const grupo_aux = JSON.parse(JSON.stringify(this.grupo_copia))
        const centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados(
            [grupo_aux])
        this.inflar_grupo(this.grupo_copia, grupo_aux,porcentaje, centro_grupo.centro_x,
            centro_grupo.centro_y)
    }

    figuraSeleccionada(nombre_figura, indice){
        if(this.grupo.lista_pintado.length>indice && indice>-1){
            //console.log("console.log(this.grupo_copia.lista_pintado)")
            //console.log(this.grupo_copia.lista_pintado)
            const elementos = (this.grupo_copia.lista_pintado[indice]).elementos;
            //console.log(elementos, indice)
            const filtro_elemento = elementos.filter(e=>e.nombre === nombre_figura)
            if(filtro_elemento.length>0){
                return filtro_elemento.map(e=>e.componente)
            }
        }
        return null;
    }

    agregarAristaPintado(nombre_figura, nombre_componente, indice_pintado, indice = -1){
        console.log("PINTARRRR: ", indice_pintado)
        const pintar = this.grupo_copia.lista_pintado[indice_pintado]
        console.log(this.grupo_copia.lista_pintado)
        const componente = {
            nombre: nombre_figura,
            componente: nombre_componente
        }
        if(indice<0){
            pintar.elementos.push(componente)
        }else{
            pintar.elementos.splice(indice, 0, componente)
        }

    }

    getPintadoGrupo(indice){
        return this.grupo_copia.lista_pintado[indice]
    }

    getIndiceComponente(indice_pintado, nombre_figura, componente){
        const elementos = (this.grupo_copia.lista_pintado[indice_pintado]).elementos;
        for(let i=0; i<elementos.length; i++){
            const elemento = elementos[i];
            if(elemento.nombre === nombre_figura && componente === elemento.componente){
                return i;
            }
        }
        return -1;
    }


    procesarTrabajoPintado(eventoLienzoFigura){
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        //console.log("SCROLL: ", eventoLienzoFigura.mouse_delta_scroll)
        for (let j = 0; j < this.grupo_copia.lista_figuras.length; j++){
            const figura = this.grupo_copia.lista_figuras[j];
            const componente_g = this.figuraSeleccionada(figura.nombre,
                this.indice_seleccion_pintado);

            if (figura.tipo_figura === "RECTA"){
                let validar_p1 = false, validar_p2 = false;
                if(componente_g === null){
                    validar_p1= validar_p2= true
                }else{
                    validar_p1 = !componente_g.includes("PUNTO1")
                    validar_p2 = !componente_g.includes("PUNTO2")
                }
                const coor = getCoorRecta(figura, this.grupo_copia)
                this.rect_figura_.x = coor.x1;
                this.rect_figura_.y = coor.y1;
                if(Fisica.rectsColliding(this.puntero, this.rect_figura_ )&&
                    eventoLienzoFigura.mouse_click_down && validar_p1){
                    console.log("Colision recta P1")
                    this.agregarAristaPintado(figura.nombre, "PUNTO1",
                        this.indice_seleccion_pintado)
                }

                this.rect_figura_.x = coor.x2;
                this.rect_figura_.y = coor.y2;
                if(Fisica.rectsColliding(this.puntero, this.rect_figura_ )&&
                    eventoLienzoFigura.mouse_click_down && validar_p2){
                    console.log("Colision recta P2")
                    this.agregarAristaPintado(figura.nombre, "PUNTO2",
                        this.indice_seleccion_pintado)
                }
            }

            if (figura.tipo_figura === "PUNTO"){
                let validar_punto = false;
                if(componente_g === null){
                    validar_punto=  true
                }else{
                    validar_punto = !componente_g.includes("PUNTO_C")
                }

                const coor = getCoorPunto(figura, this.grupo_copia)
                this.rect_figura_.x = coor.x;
                this.rect_figura_.y = coor.y;

                if(this.arrastrando_punto === false){
                    if(Fisica.rectsColliding(this.puntero, this.rect_figura_ )&&
                        eventoLienzoFigura.mouse_click_down && validar_punto){
                        console.log("Colision CIRCULO CENTRO")
                        this.agregarAristaPintado(figura.nombre, "PUNTO_C",
                            this.indice_seleccion_pintado)
                    }
                    if(Fisica.rectsColliding(this.puntero, this.rect_figura_ )&&
                        eventoLienzoFigura.mouse_click_down && validar_punto===false && !this.arrastrando_punto){
                        console.log("ARRASTRANDO EL PUNTOOOO")
                        this.arrastrando_punto = true;
                        this.componente_arrastrado = {
                            nombre: figura.nombre,
                            componente: "PUNTO_C"
                        }
                    }
                }else{
                    if(eventoLienzoFigura.mouse_click_up){
                        if(this.componente_arrastrado.nombre !== figura.nombre){
                            console.log(this.puntero, this.rect_figura_)
                            if(Fisica.rectsColliding(this.puntero, this.rect_figura_ )){
                                const indice_arista = this.getIndiceComponente(this.indice_seleccion_pintado,
                                    this.componente_arrastrado.nombre,
                                    this.componente_arrastrado.componente)
                                console.log("Colision ARRASTREEEEEEEE!!!!!", indice_arista)
                                this.agregarAristaPintado(figura.nombre, "PUNTO_C",
                                    this.indice_seleccion_pintado, indice_arista+1)
                            }
                        }
                    }
                }
            }
        }

        if(eventoLienzoFigura.mouse_click_up){
            this.arrastrando_punto = false;
            this.componente_arrastrado = null;
        }

        if(eventoLienzoFigura.mouse_click_down && eventoLienzoFigura.mouse_type_button === 1){
            console.log("ARRASTRAR CON SCROLL!!!")
            if(!this.mover_grupo){
                this.mover_grupo = true;
                this.x_inicial=eventoLienzoFigura.mouse_x;
                this.y_inicial=eventoLienzoFigura.mouse_y;
            }
            const diff_x = eventoLienzoFigura.mouse_x - this.x_inicial;
            const diff_y = eventoLienzoFigura.mouse_y - this.y_inicial;
            this.grupo_copia.cx_solid = diff_x;
            this.grupo_copia.cy_solid = diff_y;
            console.log(diff_x)

        }else{
            this.mover_grupo= false;
        }
        if(eventoLienzoFigura.mouse_delta_scroll !==0){
            if(eventoLienzoFigura.mouse_delta_scroll<0){
                this.zoomGrupo(this.escalaZoom)
            }else{
                this.zoomGrupo(this.escalaZoom*-1)
            }
        }
    }

    inflar_grupo(grupo_, grupo_copia_, porcentaje, centrox, centroy) {
        for (let j = 0; j < grupo_copia_.lista_figuras.length; j++) {
            let figura = grupo_.lista_figuras[j];
            let f_copia = grupo_copia_.lista_figuras[j];

            OperacionesGrupo.inflar_figura(figura, f_copia, grupo_, centrox,
                centroy, porcentaje)

        }
    }
};


export default GestionPintado;