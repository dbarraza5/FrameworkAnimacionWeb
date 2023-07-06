import OperacionesGrupo from "./OperacionesGrupo";
import Fisica from "./Fisica";
import {getCoorRecta} from "./GestionAnimacion";

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

    constructor() {
    }

    inicializarGrupo(grupo_) {
        this.grupo = grupo_;
        this.grupo_copia = JSON.parse(JSON.stringify(grupo_))
        let centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados([this.grupo_copia])
        OperacionesGrupo.moverGrupo(this.grupo_copia, grupo_, centro_grupo.centro_x,
            centro_grupo.centro_y, 300, 300)
        console.log(centro_grupo)
        const grupo_aux = JSON.parse(JSON.stringify(this.grupo_copia))
        centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados(
            [grupo_aux])
        const max_medida = centro_grupo.alto>centro_grupo.ancho? centro_grupo.alto : centro_grupo.ancho;
        const porcentaje = (600 -max_medida)/600
        console.log(porcentaje)
        this.inflar_grupo(this.grupo_copia, grupo_aux,porcentaje, centro_grupo.centro_x,
            centro_grupo.centro_y)
    }

    figuraSeleccionada(nombre_figura, indice){
        if(this.grupo.lista_pintado.length>indice && indice>-1){
            console.log("console.log(this.grupo_copia.lista_pintado)")
            console.log(this.grupo_copia.lista_pintado)
            const elementos = (this.grupo_copia.lista_pintado[indice]).elementos;
            console.log(elementos, indice)
            const filtro_elemento = elementos.filter(e=>e.nombre === nombre_figura)
            if(filtro_elemento.length>0){
                return filtro_elemento.map(e=>e.componente)
            }
        }
        return null;
    }

    agregarAristaPintado(nombre_figura, nombre_componente, indice_pintado){
        console.log("PINTARRRR: ", indice_pintado)
        const pintar = this.grupo_copia.lista_pintado[indice_pintado]
        console.log(this.grupo_copia.lista_pintado)
        pintar.elementos.push({
            nombre: nombre_figura,
            componente: nombre_componente
        })
    }

    procesarTrabajoPintado(eventoLienzoFigura){
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        //console.log("procesarTrabajoPintado")
        for (let j = 0; j < this.grupo_copia.lista_figuras.length; j++){
            const figura = this.grupo_copia.lista_figuras[j];
            if (figura.tipo_figura === "RECTA"){

                const componente_g = this.figuraSeleccionada(figura.nombre,
                    this.indice_seleccion_pintado);
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