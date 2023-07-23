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
        h: 9,
        w: 9
    }

    puntero = {
        x: 0,
        y: 0,
        h: 5,
        w: 5
    }

    relleno_pintura = false;
    //aplicar todas las pinturas
    pintar_todo = false

    mover_grupo = false;
    x_inicial_mouse = 0;
    y_inicial_mouse = 0;
    x_inicial_group = 0;
    y_inicial_group = 0;

    escalaZoom = 0.2

    arrastrando_punto =false;
    componente_arrastrado = null;

    ultimo_componente_agregado = null

    //seleccion de componente para borrar
    list_comp_select = [];
    act_select_comp = false;

    //funcion del backup
    funcion_editar_lienzo = null;

    constructor() {
    }

    inicializarGrupo(grupo_) {
        this.grupo = grupo_;
        this.grupo_copia = JSON.parse(JSON.stringify(grupo_))
        this.grupo_copia.cx_solid = 0;
        this.grupo_copia.cy_solid = 0;
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

    aplicarCambioGrupo(){
        this.grupo.lista_pintado = [...this.grupo_copia.lista_pintado]
        this.funcion_editar_lienzo()
    }

    figuraSeleccionada(nombre_figura, indice){
        if(this.grupo_copia.lista_pintado.length>indice && indice>-1){
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
        if(this.getIndiceComponente(this.indice_seleccion_pintado, nombre_figura, nombre_componente)===-1){
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
            this.ultimo_componente_agregado = {...componente, indice_pintado: this.indice_seleccion_pintado}
        }
    }

    eliminarUltimoComponente(){
        if(this.indice_seleccion_pintado === this.ultimo_componente_agregado.indice_pintado){
            const indice = this.getIndiceComponente(this.indice_seleccion_pintado,
                this.ultimo_componente_agregado.nombre,
                this.ultimo_componente_agregado.componente)
            if(indice>=0)
            this.grupo_copia.lista_pintado[this.indice_seleccion_pintado].splice(indice, 1)
        }
    }

    eliminarPintura(indice){
        this.grupo_copia.lista_pintado = this.grupo_copia.lista_pintado.filter((p, index)=>indice !==index)
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
        if(eventoLienzoFigura.stack_event_teclado.includes("Delete")){
            console.log(this.list_comp_select)
            for (let i=0; i<this.list_comp_select.length; i++){
                const clave_comp = this.list_comp_select[i];
                const comp_ = clave_comp.split("|")
                const indice = this.getIndiceComponente(this.indice_seleccion_pintado, comp_[0], comp_[1])

                if(indice>=0){
                    const pintado = this.grupo_copia.lista_pintado[this.indice_seleccion_pintado]
                    pintado.elementos = pintado.elementos.filter((e, index)=>index!==indice)
                }
            }
            this.list_comp_select = []
        }

        this.act_select_comp = eventoLienzoFigura.stack_event_teclado.includes("KeyS")// && !this.act_select_comp;
        //console.log(eventoLienzoFigura.stack_event_teclado)

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

                this.rect_figura_.x = coor.x1-4;
                this.rect_figura_.y = coor.y1-4;
                const col_punt_comp1 = Fisica.rectsColliding(this.puntero, this.rect_figura_ )

                if(this.act_select_comp){
                    if(col_punt_comp1 && eventoLienzoFigura.mouse_only_click){
                        this.seleccionarComponente(figura.nombre+"|"+"PUNTO1")
                    }
                    //continue;
                }

                this.rect_figura_.x = coor.x2-4;
                this.rect_figura_.y = coor.y2-4;
                const col_punt_comp2 = Fisica.rectsColliding(this.puntero, this.rect_figura_ )

                if(this.act_select_comp){
                    if(col_punt_comp2 && eventoLienzoFigura.mouse_only_click){
                        this.seleccionarComponente(figura.nombre+"|"+"PUNTO2")
                    }
                    //continue;
                }

                if(this.arrastrando_punto === false){
                    if (!this.act_select_comp){
                        if(col_punt_comp1 &&
                            eventoLienzoFigura.mouse_click_down && validar_p1){
                            this.agregarAristaPintado(figura.nombre, "PUNTO1",
                                this.indice_seleccion_pintado)
                        }

                        if(col_punt_comp1 &&
                            eventoLienzoFigura.mouse_click_down && validar_p1===false && !this.arrastrando_punto){
                            console.log("ARRASTRANDO EL PUNTOOOO1111 de la RECTA")
                            this.arrastrando_punto = true;
                            this.componente_arrastrado = {
                                nombre: figura.nombre,
                                componente: "PUNTO1"
                            }
                        }

                        if(col_punt_comp2 &&
                            eventoLienzoFigura.mouse_click_down && validar_p2){
                            this.agregarAristaPintado(figura.nombre, "PUNTO2",
                                this.indice_seleccion_pintado)
                        }

                        if(col_punt_comp2 &&
                            eventoLienzoFigura.mouse_click_down && validar_p2===false && !this.arrastrando_punto){
                            console.log("ARRASTRANDO EL PUNTOOOO2222 de la RECTA")
                            this.arrastrando_punto = true;
                            this.componente_arrastrado = {
                                nombre: figura.nombre,
                                componente: "PUNTO2"
                            }
                        }
                    }
                }else{
                    if(eventoLienzoFigura.mouse_click_up){
                        if(true)//(this.componente_arrastrado.nombre !== figura.nombre)
                        {
                            //console.log(this.puntero, this.rect_figura_)
                            if(col_punt_comp1){
                                const indice_arista = this.getIndiceComponente(this.indice_seleccion_pintado,
                                    this.componente_arrastrado.nombre,
                                    this.componente_arrastrado.componente)
                                this.agregarAristaPintado(figura.nombre, "PUNTO1",
                                    this.indice_seleccion_pintado, indice_arista+1)
                                break;
                            }

                            if(col_punt_comp2){
                                const indice_arista = this.getIndiceComponente(this.indice_seleccion_pintado,
                                    this.componente_arrastrado.nombre,
                                    this.componente_arrastrado.componente)
                                this.agregarAristaPintado(figura.nombre, "PUNTO2",
                                    this.indice_seleccion_pintado, indice_arista+1)
                                break;
                            }
                            //const pintado = this.grupo_copia.lista_pintado[this.indice_seleccion_pintado]
                            //console.log(pintado)
                        }
                    }
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

                const col_punt_comp = Fisica.rectsColliding(this.puntero, this.rect_figura_ )
                if(this.act_select_comp && col_punt_comp && eventoLienzoFigura.mouse_only_click){
                    this.seleccionarComponente(figura.nombre+"|"+"PUNTO_C")
                    continue;
                }
                

                if(this.arrastrando_punto === false){
                    if(col_punt_comp &&
                        eventoLienzoFigura.mouse_click_down && validar_punto){
                        console.log("Colision CIRCULO CENTRO")
                        this.agregarAristaPintado(figura.nombre, "PUNTO_C",
                            this.indice_seleccion_pintado)
                    }
                    if(col_punt_comp &&
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
                        //const col_punt_comp = Fisica.rectsColliding(this.puntero, this.rect_figura_ )
                        if(this.componente_arrastrado.nombre !== figura.nombre){
                            //console.log(this.puntero, this.rect_figura_)
                            if(col_punt_comp){
                                const indice_arista = this.getIndiceComponente(this.indice_seleccion_pintado,
                                    this.componente_arrastrado.nombre,
                                    this.componente_arrastrado.componente)
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
                this.x_inicial_mouse=eventoLienzoFigura.mouse_x;
                this.y_inicial_mouse=eventoLienzoFigura.mouse_y;
                this.x_inicial_group = this.grupo_copia.cx_solid;
                this.y_inicial_group = this.grupo_copia.cy_solid;
            }
            const diff_x = eventoLienzoFigura.mouse_x - this.x_inicial_mouse;
            const diff_y = eventoLienzoFigura.mouse_y - this.y_inicial_mouse;
            this.grupo_copia.cx_solid = this.x_inicial_group+diff_x;
            this.grupo_copia.cy_solid = this.y_inicial_group+diff_y;
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

    seleccionarComponente(nombre_compuesto){
        if(this.list_comp_select.includes(nombre_compuesto)){
            this.list_comp_select=
                this.list_comp_select.filter(comp=>comp !== nombre_compuesto)
        }else{
            this.list_comp_select.push(nombre_compuesto)
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