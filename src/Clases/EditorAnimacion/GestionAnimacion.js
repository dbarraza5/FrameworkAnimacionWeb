
class GestionAnimacion{
    meta_figuras = [
        {
            nombre: "PUNTO",
            atributos:[
                {nombre:"cx",tipo: "TIPO_INT", valor_defecto: 0},
                {nombre:"cy",tipo: "TIPO_INT", valor_defecto: 0},
            ]

        },
        {
            nombre: "RECTA",
            atributos: [
                {nombre:"x1", tipo: "TIPO_INT", valor_defecto: 0},
                {nombre:"y1", tipo: "TIPO_INT", valor_defecto: 0},
                {nombre:"x2", tipo: "TIPO_INT", valor_defecto: 5},
                {nombre:"y2", tipo: "TIPO_INT", valor_defecto: 5},
                {nombre:"cx", tipo: "TIPO_INT", valor_defecto: 0},
                {nombre:"cy", tipo: "TIPO_INT", valor_defecto: 0},
            ]

        },
        {
            nombre: "CIRCULO",
            atributos: [
                {nombre:"radiox", tipo: "TIPO_INT", valor_defecto: 10},
                {nombre:"radioy", tipo: "TIPO_INT", valor_defecto: 10},
                {nombre:"cx", tipo: "TIPO_INT", valor_defecto: 0},
                {nombre:"cy", tipo: "TIPO_INT", valor_defecto: 0},
            ]
        },
    ]

    meta_movimientos = [
        {
            nombre: "MRU",
            velocidad: "TIPO_FLOAT",
            sentido: "TIPO_BOOL",
            direccion: "TIPO_BOOL",
        },
        {
            nombre: "MRUA",
            velocidad: "TIPO_FLOAT",
            aceleracion: "TIPO_FLOAT",
            sentido: "TIPO_BOOL",
            direccion: "TIPO_BOOL",
        },
        {
            nombre: "PARABOLA",
            velocidad: "TIPO_FLOAT",
            aceleracion: "TIPO_FLOAT",
            angulo: "TIPO_FLOAT",
            gravedad: "TIPO_FLOAT",
        },
        {
            nombre: "CIRCULO",
            velocidad: "TIPO_FLOAT",
            aceleracion: "TIPO_FLOAT",
            sentido: "TIPO_BOOL",
            direccion: "TIPO_BOOL",
        },
    ]

    constructor() {
        this.grupos_figuras = [
            {
                nombre: "default",
                nodo_padre: "root",
                tiempo_inicial: 500,
                tiempo_final: 2000,
                ciclo: 1,
                color: "#2851e3",
                cx: 10,
                cy: 0,
                capa: 0,
                grupo_movimientos: ["default"],

                lista_figuras: [
                    {
                        nombre:"fr1",
                        tipo_figura: "RECTA",
                        atributos: {
                            x1: "1",
                            y1: "1",
                            x2: "5",
                            y2: "5",
                            cx: "7",
                            cy: "7",
                        }
                    },
                ],
            },
            {
                nombre: "grupo1",
                nodo_padre: "root",
                tiempo_inicial: 0,
                tiempo_final: 2000,
                ciclo: 0,
                color: "#e328a5",
                cx: 0,
                cy: 20,
                capa: 0,
                grupo_movimientos: [],

                lista_figuras: [
                    {
                        nombre:"fp1",
                        tipo_figura: "PUNTO",
                        atributos: {
                            cx: "10",
                            cy: "10",
                        }
                    },
                ],
            },
            {
                nombre: "grupo9",
                nodo_padre: "grupo1",
                tiempo_inicial: 0,
                tiempo_final: 2000,
                ciclo: 0,
                color: "#28e331",
                cx: 0,
                cy: 20,
                capa: 1,
                grupo_movimientos: [],

                lista_figuras: [
                    {
                        nombre:"fp213",
                        tipo_figura: "PUNTO",
                        atributos: {
                            cx: "10",
                            cy: "10",
                        }
                    },
                    {
                        nombre:"fr15",
                        tipo_figura: "RECTA",
                        atributos: {
                            x1: "1",
                            y1: "1",
                            x2: "5",
                            y2: "5",
                            cx: "7",
                            cy: "7",
                        }
                    }
                ],
            }
        ]

        this.grupo_movimientos = [
            {
                nombre: "default",
                lista_movimientos: [
                    {
                        tipo: "MRU",
                        velocidad: 20,
                        sentido: true,
                        direccion: false,
                    }
                ]
            }
        ]
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
                    console.log(id_temp)
                    return id_temp;
                }
                contador+=1;
                if(contador>1000)
                    break;
            }
            return null
        }
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
        console.log(figura)
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
}

export default GestionAnimacion