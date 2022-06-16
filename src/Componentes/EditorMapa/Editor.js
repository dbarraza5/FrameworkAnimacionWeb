import NavEditor from "./NavEditor";
import ObjetoMapa from "./ObjetoMapa";
import {Component} from "react";


class Editor extends Component{
    edit_elemento_attr = (id_elemento, nombre_attr, valor)=>{
        console.log("id: "+id_elemento+ " | attr: "+nombre_attr+ " | value: "+valor)
    }
    render(){
        return (
            <div className="row">
                <div className="col">
                    <NavEditor>
                        <ObjetoMapa mapa={this.props.mapa} edit_elemento_attr={this.edit_elemento_attr}/>
                    </NavEditor>
                </div>
                <div className="col">
                </div>
            </div>
        )
    }
}

export default Editor