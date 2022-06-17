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
        console.log("id_objeto: ",id_objeto, " check: ", seleccionado)
        if (seleccionado){
            const mapa_ = this.state.mapa
            mapa_.id_obj_select = id_objeto
            this.setState({'mapa': mapa_})
        }
    }

    edit_elemento_attr = (id_elemento, nombre_attr, valor)=>{
        console.log("id3: "+id_elemento+ " | attr: "+nombre_attr+ " | value: "+valor)
        this.state.mapa.set_value_attr(id_elemento, nombre_attr, valor)
        this.setState({mapa: this.state.mapa})
        this.state.lienzo.actualizarLienzo(this.state.mapa.elementos_mapa, this.state.mapa.des_mapa)
        //console.log(this.state.mapa)
    }
    render(){
        return (
            <div className="row">
                <div className="col">
                    <NavEditor>
                        <ObjetoMapa mapa={this.state.mapa} edit_elemento_attr={this.edit_elemento_attr}
                                    seleccionarObjeto={this.seleccionarObjeto}/>
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