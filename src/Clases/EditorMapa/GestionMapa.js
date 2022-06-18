//const {Component} = require("react");

class GestionMapa{


    constructor() {
        this.elementos_mapa = [
            {
                "ID": "ESC_0",
                "TIPO": "ESCENARIO",
                "atributos": {
                    "tiempo_limite": "300000",
                    "tiempo_relativo": "0.15",
                    "tipo_camara": "3"
                }
            },
            {
                "ID": "psnj18",
                "TIPO": "PERSONAJE",
                "atributos": {
                    "x": "222",
                    "y": "380",
                    "ancho": "20",
                    "largo": "20",
                    "protagonista": "1",
                    "manipula_otros": "0",
                    "visible": "1",
                    "solido": "0",
                    "activo": "1"
                }
            },
            {
                "ID": "psnj184",
                "TIPO": "PERSONAJE",
                "atributos": {
                    "x": "100",
                    "y": "380",
                    "ancho": "20",
                    "largo": "20",
                    "protagonista": "1",
                    "manipula_otros": "0",
                    "visible": "1",
                    "solido": "0",
                    "activo": "1"
                }
            },
            {
                "ID": "PLA_0",
                "TIPO": "PLATAFORMA",
                "atributos": {
                    "x": "226",
                    "y": "440",
                    "ancho": "101",
                    "largo": "10",
                    "visible": "1",
                    "solido": "1"
                }
            },
            {
                "ID": "PLA_43",
                "TIPO": "PLATAFORMA",
                "atributos": {
                    "x": "426",
                    "y": "383",
                    "ancho": "10",
                    "largo": "20",
                    "visible": "1",
                    "solido": "1"
                }
            },
            {
                "ID": "PLA_33",
                "TIPO": "PLATAFORMA",
                "atributos": {
                    "x": "426",
                    "y": "200",
                    "ancho": "10",
                    "largo": "60",
                    "visible": "1",
                    "solido": "1"
                }
            },
            {
                "ID": "RIE_0",
                "TIPO": "RIEL",
                "atributos": {
                    "x": "270",
                    "y": "266",
                    "puntos": {
                        "punto": [
                            {
                                "x": "100",
                                "y": "100"
                            },
                            {
                                "x": "100",
                                "y": "200"
                            }
                        ]
                    },
                    "velicidad": "20",
                    "solo_ida": "1",
                    "id_asociacion": {
                        "id": [
                            "PLA_1",
                            "PLA_0"
                        ]
                    },
                    "activo": "1"
                }
            }
        ]
        this.des_mapa = [
            {
                "nombre": "ESCENARIO",
                "id_tipo_categoria": "CATEGORIA_CONFIG",
                "atributos": {
                    "tiempo_limite": "TIPO_INT",
                    "tiempo_relativo": "TIPO_INT",
                    "tipo_camara": "TIPO_INT"
                }
            },
            {
                "nombre": "PLATAFORMA",
                "id_tipo_categoria": "CATEGORIA_OBJETOS",
                "atributos": {
                    "x": "TIPO_INT",
                    "y": "TIPO_INT",
                    "ancho": "TIPO_INT",
                    "largo": "TIPO_INT",
                    "visible": "TIPO_BOOL",
                    "solido": "TIPO_BOOL"
                }
            },
            {
                "nombre": "PERSONAJE",
                "id_tipo_categoria": "CATEGORIA_OBJETOS",
                "atributos": {
                    "x": "TIPO_INT",
                    "y": "TIPO_INT",
                    "ancho": "TIPO_INT",
                    "largo": "TIPO_INT",
                    "protagonista": "TIPO_BOOL",
                    "manipula_otros": "TIPO_BOOL",
                    "visible": "TIPO_BOOL",
                    "solido": "TIPO_BOOL",
                    "activo": "TIPO_BOOL"
                }
            },
            {
                "nombre": "RIEL",
                "id_tipo_categoria": "CATEGORIA_MODS",
                "atributos": {
                    "x": "TIPO_INT",
                    "y": "TIPO_INT",
                    "puntos": "TIPO_LIST_TUPLA",
                    "tiempo_relativo": "TIPO_INT",
                    "velicidad": "TIPO_INT",
                    "solo_ida": "TIPO_BOOL",
                    "id_asociacion": "TIPO_LIST",
                    "activo": "TIPO_BOOL"
                }
            }
        ]
        this.id_obj_select = null//"psnj18";
    }


    get_value_attr = (id_elemento, nombre_attr)=>{
        const arr = this.elementos_mapa.filter(e=>e.ID ===id_elemento)
        if(arr.length>0){
            const elemento = arr[0]
            if(nombre_attr in elemento.atributos){
                return elemento.atributos[nombre_attr]
            }
        }
        return null
    }

    set_value_attr = (id_elemento, nombre_attr, valor)=>{
        this.elementos_mapa = this.elementos_mapa.map((element)=>{
            if(element.ID === id_elemento){
                element.atributos = {...element.atributos, [nombre_attr]: valor}
            }
            return element
        })
    }

    filter_by_id_elemento = (id_elemento) =>{
        return this.elementos_mapa.filter(e=>e.ID ===id_elemento)
    }

    generar_id_elemento = (prefijo=null)=>{
        let salir = false
        let contador = 0
        let id_ = null
        while(!salir){
            id_ = prefijo+contador
            let r = this.filter_by_id_elemento(id_)
            if(r.length === 0){
                return id_
            }
            contador+=1
        }
    }

    generar_atributos = (des)=>{
        let atributos = {}
        for(let nombre_attr in des.atributos){
            const tipo = des.atributos[nombre_attr]
            if(tipo === "TIPO_INT"){
                atributos[nombre_attr] = 0
            }
            if(tipo === "TIPO_BOOL"){
                atributos[nombre_attr] = false
            }
            if(tipo === "TIPO_LIST"){
                atributos[nombre_attr] = []
            }
        }
        return atributos
    }

    create_elemento = (tipo_elemento)=>{
        const des_element = this.des_mapa.filter(e=>e.nombre === tipo_elemento)
        if(des_element.length>0){
            const des_ = des_element[0]
            const prefijo = tipo_elemento.slice(0,3).toLowerCase()
            const id = this.generar_id_elemento(prefijo)

            const elemento = {
                "ID": id,
                "TIPO": tipo_elemento,
                "atributos": this.generar_atributos(des_)
            }
            return elemento
        }
        return null
    }

}

export default GestionMapa