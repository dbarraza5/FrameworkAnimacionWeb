
class GestionAnimacion{
    meta_figuras = [
    ]

    meta_movimientos = [
    ]
    id_animacion = "12hh21j"
    nombre_animacion = "automovil"

    constructor() {
        this.grupos_figuras = [
        ]

        this.grupo_movimientos = [
        ]
    }

    getDatosAnimacion(){
        return {
            id_animacion: this.id_animacion,
            nombre_animacion: this.nombre_animacion,
            meta_figuras: this.meta_figuras,
            meta_movimiento: this.meta_movimientos,
            grupos_figuras: this.grupos_figuras,
            grupo_movimientos: this.grupo_movimientos
        }
    }

    getMetaFigura(tipo_figura){
        const fig = this.meta_figuras.filter((f)=>{
            return f.nombre === tipo_figura
        })
        if(fig.length>0){
            return fig[0];
        }
        return null;
    }

    borrar_grupo(nombre){
        const tam_lista = this.grupos_figuras.length;
        this.grupos_figuras = this.grupos_figuras.filter((g)=>{
            if(g.nombre != nombre){
                return true;
            }
            return false;
        })
        if(tam_lista>this.grupos_figuras.length){
            this.cambiar_dependencias_nombre_grupo(nombre, "root")
        }
    }

    borrar_figura(nombre_grupo, nombre_figura){
        this.grupos_figuras = this.grupos_figuras.map((g)=>{
            if(g.nombre === nombre_grupo){
                g.lista_figuras = g.lista_figuras.filter((fig)=>{
                    return fig.nombre !== nombre_figura
                })
            }
            return g;
        })
    }

    crear_grupo(nombre){
        const lista_nombre = this.get_lista_nombres_grupos();
        if(!lista_nombre.includes(nombre)){
            return {
                nombre: nombre,
                nodo_padre: "root",
                tiempo_inicial: 0,
                tiempo_final: 5000,
                ciclo: 0,
                color: "#285de3",
                cx: 0,
                cy: 0,
                capa: 0,
                grupo_movimientos: [],

                lista_figuras: [
                ],
            }
        }
        return null;
    }

    crear_id_figura(nombre_grupo, tipo_figura){
        const grupos = this.grupos_figuras.filter((g)=>{
            return g.nombre === nombre_grupo
        })
        if(grupos.length>0){
            const grupo = grupos[0]
            const lista_nombre_fig = grupo.lista_figuras.map((f)=>f.nombre)
            let id_encontrado = false;
            let id_temp = ""
            const prefix=tipo_figura.toLowerCase().substr(0, 3)
            let contador=0;
            while(!id_encontrado){
                id_temp = "f"+prefix+contador;
                if(!lista_nombre_fig.includes(id_temp)){
                    return id_temp;
                }
                contador+=1;
                if(contador>1000)
                    break;
            }
            return null
        }
    }

    crear_id_grupo(){
        const lis_nombre_grupos = this.grupos_figuras.map((g)=>g.nombre)
        let id_temp = ""
        let id_encontrado = false;
        let contador=0;
        while(!id_encontrado){
            id_temp = "grup_"+contador;
            if(!lis_nombre_grupos.includes(id_temp)){
                return id_temp;
            }
            contador+=1;
            if(contador>1000)
                break;
        }
        return null
    }

    crear_figura(nombre_grupo, tipo_figura){
        const id_figura = this.crear_id_figura(nombre_grupo, tipo_figura)
        let figura = {
            nombre: id_figura,
            'tipo_figura': tipo_figura,
            atributos:{}
        };

        const des_fig = this.meta_figuras.filter((f)=>f.nombre===tipo_figura)[0]

        des_fig.atributos.map((attr)=>{
            figura.atributos[attr.nombre] = attr.valor_defecto;
        })
        //console.log(figura)
        this.agregar_figura_grupo(nombre_grupo, figura);
        return figura;
    }

    agregar_figura_grupo(nombre_grupo, figura){
        this.grupos_figuras = this.grupos_figuras.map((g)=>{
            if(g.nombre === nombre_grupo){
                g.lista_figuras.push(figura)
                return g
            }
            return g;
        })
    }

    get_figura(nombre_grupo, nombre_figura){
        const grupo = this.grupos_figuras.filter((g)=>{
            return g.nombre===nombre_grupo
        })
        if(grupo.length>0){
            const figura = grupo[0].lista_figuras.filter((f)=>f.nombre===nombre_figura)
            if(figura.length>0){
                return figura[0]
            }
        }
        return null;
    }

    set_figura(nombre_grupo, figura_){
        this.grupos_figuras = this.grupos_figuras.map((g)=>{
            if(g.nombre === nombre_grupo){
                g.lista_figuras.map((figura)=>{
                    if(figura.nombre === figura_.nombre){
                        if(figura_.tipo_figura === "RECTA"){
                            //console.log(figura_)
                            return this.set_recta(figura_)
                        }
                        return this.duplicar_figura(figura_)
                    }
                    return figura;
                })
                return g;
            }
            return g;
        })
    }

    duplicar_figuras_id_figuras(nombre_grupo, lista_id_figuras){
        let lista_figuras = this.get_lista_figuras_duplicadas(nombre_grupo, lista_id_figuras);
        for (let i = 0; i < lista_figuras.length; i++) {
            lista_figuras[i].nombre = this.crear_id_figura(nombre_grupo, lista_figuras[i].tipo_figura)
            this.agregar_figura_grupo(nombre_grupo, lista_figuras[i])
        }
    }

    get_lista_figuras_duplicadas(nombre_grupo, lista_id_figuras){
        const grupo = this.getGrupo(nombre_grupo);
        const lista_figuras = grupo.lista_figuras.filter((e)=>lista_id_figuras.includes(e.nombre));
        return lista_figuras.map((f)=>{
            return this.duplicar_figura(f)
        })
    }

    duplicar_figura(figura){
        return JSON.parse(JSON.stringify(figura))
    }

    set_recta(recta){
        return normalizar_recta(recta)
    }

    set_atributo_figura(nombre_grupo, nombre_figura, nombre_atributo, valor){
        this.grupos_figuras = this.grupos_figuras.map((g)=>{
            if(g.nombre === nombre_grupo){
                g.lista_figuras.map((figura)=>{
                    if(figura.nombre === nombre_figura){
                        figura.atributos[nombre_atributo] = parseInt(valor);
                    }
                    return figura;
                })
                return g;
            }
            return g;
        })
    }

    agregar_grupo_nuevo(nombre){
        const grupo_ = this.crear_grupo(nombre)
        if(grupo_ != null){
            this.grupos_figuras.push(grupo_);
            return true;
        }
        return false
    }

    cambiar_dependencias_nombre_grupo(nombre_actual, nombre_nuevo){
        this.grupos_figuras = this.grupos_figuras.map((grupo)=>{
            if(grupo.nodo_padre === nombre_actual){
                return {...grupo, nodo_padre:nombre_nuevo};
            }
            return grupo;
        })
    }

    set_atributo_grupo(nombre, atributo, valor){
        if(atributo === "nombre"){
            this.cambiar_dependencias_nombre_grupo(nombre, valor);
        }
        this.grupos_figuras = this.grupos_figuras.map((g) => {
            if(g.nombre === nombre){
                return { ...g, [atributo]: valor}
            }
            return g;
        })
    }

    get_lista_nombres_grupos(){
        return this.grupos_figuras.reduce((anterior, actual) =>anterior.concat(actual.nombre), [])
    }

    getGrupo(nombre_grupo){
        const grupo = this.grupos_figuras.filter((g)=>{
            return g.nombre===nombre_grupo
        })
        if(grupo.length>0){
            return grupo[0]
        }
        return null;
    }

    get_nombres_grupos_hijos(nombre_grupo){
        let lista = this.grupos_figuras.filter((grupo)=>grupo.nodo_padre===nombre_grupo)
        let lista_nombres = lista.map((g)=>g.nombre)
        return lista_nombres
    }

    estructura_arbol_grupos(nombre_grupo="root"){
        let lista_grupo = this.get_nombres_grupos_hijos(nombre_grupo)
        let lista_nodos = []
        //console.log(lista_grupo)
        if(lista_grupo.length===0){
            return {
                text: nombre_grupo
            }
        }
        for (let i=0; i<lista_grupo.length; i++){
            lista_nodos.push(this.estructura_arbol_grupos(lista_grupo[i]))
        }
        return {
            text:nombre_grupo,
            nodes: lista_nodos
        }
    }
    get_grupos_hijos(nombre_grupo){
        return this.grupos_figuras.filter((grupo)=>grupo.nodo_padre===nombre_grupo)
    }

    procesarPosicionFinalFiguras(nombre_grupo="root"){
        const grupo_padre = this.getGrupo(nombre_grupo);
        const lista_grupos = this.get_grupos_hijos(nombre_grupo)

        for(let i=0; i<lista_grupos.length; i++){
            const grupo_ = lista_grupos[i];
            if(nombre_grupo === "root"){
                grupo_.cx_solid = parseInt(grupo_.cx);
                grupo_.cy_solid = parseInt(grupo_.cy);
            }else{
                grupo_.cx_solid = parseInt(grupo_.cx) +
                    parseInt(grupo_padre.cx_solid);
                grupo_.cy_solid = parseInt(grupo_.cy) +
                    parseInt(grupo_padre.cy_solid);
            }
            this.procesarPosicionFinalFiguras(grupo_.nombre)
        }
    }

    listaOrdenadasGrupos(lista_ordenada, nombre_grupo="root"){
        const lista_grupos = this.get_grupos_hijos(nombre_grupo)
        lista_grupos.sort((a, b)=>{
            if(a.capa>b.capa){
                return 1;
            }
            return 0;
        })

        for(let i=0; i<lista_grupos.length; i++){
            const grupo_ = lista_grupos[i]
            lista_ordenada.push(grupo_);
            this.listaOrdenadasGrupos(lista_ordenada, grupo_.nombre)
        }
    }

    moverListaGrupos(lista_nombres_grupos, deltax, deltay){
        for(let i=0; i<lista_nombres_grupos.length; i++){
            const grupo_ = this.getGrupo(lista_nombres_grupos[i])
            this.set_atributo_grupo(grupo_.nombre, "cx",grupo_.cx+deltax)
            this.set_atributo_grupo(grupo_.nombre, "cy",grupo_.cy+deltay)
        }
    }

    duplicar_grupo(nombre_grupo){
        const grupo_ = this.getGrupo(nombre_grupo)
        const grupo_duplicado = JSON.parse(JSON.stringify(grupo_))
        return grupo_duplicado;
    }

    duplicar_lista_grupos(lista_nombres_grupos){
        return lista_nombres_grupos.map((nombre)=>this.duplicar_grupo(nombre))
    }

    duplicar_internamente_lista_grupos_(lista_nombres_grupos){
        const lista_duplicada = lista_nombres_grupos.map((nombre)=>this.duplicar_grupo(nombre))
        const lista_orinal = lista_duplicada.map((g)=>g.nombre)

        for (let i=0; i<lista_duplicada.length; i++){
            const id_grupo_ = this.crear_id_grupo();
            lista_duplicada[i].nombre = id_grupo_;
            this.grupos_figuras.push(lista_duplicada[i]);
        }

        for(let i=0; i<lista_orinal.length; i++)
        {
            const grupo_= lista_duplicada[i];
            if(lista_orinal.includes(grupo_.nodo_padre)){
                const index = lista_orinal.findIndex((nombre)=>{
                    return grupo_.nodo_padre === nombre;
                })
                grupo_.nodo_padre = lista_duplicada[index].nombre;
            }
        }
        return lista_duplicada.map((g)=>g.nombre)
    }
}

function normalizar_recta(recta1){
    const x1 = parseInt(recta1.atributos.x1);
    const y1 = parseInt(recta1.atributos.y1);
    const x2 = parseInt(recta1.atributos.x2);
    const y2 = parseInt(recta1.atributos.y2);

    const cx_ = parseInt((x1 + x2)/2)
    const cy_ = parseInt((y1 + y2)/2)

    const x1_ = x1 - cx_;
    const y1_ = y1 - cy_;
    const x2_ = x2 - cx_;
    const y2_ = y2 - cy_;
    //let recta_nueva = this.duplicar_figura(recta)
    //recta_nueva["atributos"]={...(recta.atributos)}
    let recta = {
        nombre:recta1.nombre,
        tipo_figura: recta1.tipo_figura,
        atributos: {}
    }
    recta1.atributos["x1"] = x1_;
    recta1.atributos["y1"] = y1_;
    recta1.atributos["x2"] = x2_;
    recta1.atributos["y2"] = y2_;
    recta1.atributos["cx"] = parseInt(recta1.atributos.cx)+cx_;
    recta1.atributos["cy"] = parseInt(recta1.atributos.cy)+cy_;
    //console.log(recta_nueva)
    return recta
}

export {GestionAnimacion, normalizar_recta}