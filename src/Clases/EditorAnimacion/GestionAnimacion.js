
class GestionAnimacion{
    meta_figuras = [
        {
            nombre: "PUNTO",
            atributos:{
                cx: "TIPO_INT",
                cy: "TIPO_INT",
            }

        },
        {
            nombre: "RECTA",
            atributos: {
                x1: "TIPO_INT",
                y1: "TIPO_INT",
                x2: "TIPO_INT",
                y2: "TIPO_INT",
                cx: "TIPO_INT",
                cy: "TIPO_INT",
            }

        },
        {
            nombre: "CIRCULO",
            atributos: {
                radiox: "TIPO_INT",
                radioy: "TIPO_INT",
                cx: "TIPO_INT",
                cy: "TIPO_INT",
            }
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
                        tipo_figura: "PUNTO",
                        atributos: {
                            cx: "10",
                            cy: "10",
                        }
                    },
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
}

export default GestionAnimacion