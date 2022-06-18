import NavEditor from "./NavEditor";
import ObjetoMapa from "./ObjetoMapa";
import {Component} from "react";
import GestionMapa from "../../Clases/EditorMapa/GestionMapa";
import GestionLienzo from "../../Clases/EditorMapa/GestionLienzo";
import {LienzoComponent, getMousePos} from "./LienzoComponent";


class Editor extends Component{
    state = {
        mapa: new GestionMapa(),
    }


    componentDidMount(){
        const lienzo = new GestionLienzo()
        lienzo.actualizarLienzo(this.state.mapa.elementos_mapa, this.state.mapa.des_mapa)
        this.state.lienzo = lienzo
    }

    eventMoveMouse = (e)=>{
        let pos = getMousePos(document.getElementById("lienzo-editor"), e);
        let x1 = parseInt(pos.x);
        let y1 = parseInt(pos.y);
        console.log(x1, y1)
        //lienzo.moverElemento(x1, y1);
    }

    seleccionarObjeto = (seleccionado, id_objeto)=>{
        if (seleccionado){
            const mapa_ = this.state.mapa
            const resultado = mapa_.filter_by_id_elemento(id_objeto)
            if(resultado.length >0){
                const obj = resultado[0]
                console.log(obj)
                mapa_.id_obj_select = id_objeto
                this.setState({'mapa': mapa_})
                const id = "#v-pills-"+obj.TIPO;
                const id_comp = '#objetos_tab button[data-bs-target="'+id+'"]';
                const triggerEl = document.querySelector(id_comp);
                triggerEl.click();
            }

        }
    }

    edit_elemento_attr = (id_elemento, nombre_attr, valor)=>{
        console.log("id3: "+id_elemento+ " | attr: "+nombre_attr+ " | value: "+valor)
        this.state.mapa.set_value_attr(id_elemento, nombre_attr, valor)
        this.setState({mapa: this.state.mapa})
        this.state.lienzo.actualizarLienzo(this.state.mapa.elementos_mapa,
            this.state.mapa.des_mapa)
        //console.log(this.state.mapa)
    }

    agregar_elemento = (tipo_elemento)=>{
        console.log("agregando un elemento de tipo: ", tipo_elemento)
        const mapa = this.state.mapa
        const elemento = mapa.create_elemento(tipo_elemento)
        if(elemento != null){
            if(tipo_elemento === "PERSONAJE"){
                elemento.atributos.x = 10
                elemento.atributos.y = 10
                elemento.atributos.ancho = 10
                elemento.atributos.largo = 10
            }

            if(tipo_elemento === "PLATAFORMA"){
                elemento.atributos.x = 50
                elemento.atributos.y = 50
                elemento.atributos.ancho = 50
                elemento.atributos.largo = 10
            }
            mapa.elementos_mapa.push(elemento)
            this.setState({mapa: mapa})
            this.state.lienzo.actualizarLienzo(mapa.elementos_mapa,
                mapa.des_mapa)
        }

    }
    render(){
        return (
            <div className="row">
                <div className="col">
                    <NavEditor>
                        <ObjetoMapa mapa={this.state.mapa} edit_elemento_attr={this.edit_elemento_attr}
                                    seleccionarObjeto={this.seleccionarObjeto}
                                    agregar_elemento = {this.agregar_elemento}/>
                    </NavEditor>
                </div>
                <div className="col">
                    <LienzoComponent eventMoveMouse={this.eventMoveMouse}/>
                </div>
            </div>
        )
    }
}

export default Editor