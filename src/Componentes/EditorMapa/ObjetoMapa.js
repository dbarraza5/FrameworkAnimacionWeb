import SelectInstancias from "./SelectInstancias";
import PropiedadElemento from "./PropiedadElemento";
import {Component} from "react";
import ListadoElemento from "./ListadoElemento";
const style = {
    'max-width': '18rem'
}
class ObjetoMapa extends Component{
    render(){
        const id_seleccionado =this.props.mapa.id_obj_select
        const meta_mapa = this.props.mapa.des_mapa
        const meta_objetos = meta_mapa.filter(obj=> obj.id_tipo_categoria === "CATEGORIA_OBJETOS")
        const f = meta_mapa.filter((e)=> e.id_tipo_categoria === "CATEGORIA_OBJETOS").map(e=>e.nombre)
        const lista_elemento = this.props.mapa.elementos_mapa.filter((e)=> f.includes(e.TIPO) )
        return(
            <div>
                <SelectInstancias meta_objetos={meta_objetos}/>
                <br/>
                <div className="row">
                    <div className="col">
                        <PropiedadElemento id_seleccionado={id_seleccionado} meta_objetos={meta_objetos}
                                           edit_elemento_attr={this.props.edit_elemento_attr}
                                           mapa={this.props.mapa}/>
                    </div>
                    <div className="col">
                        <div className="card text-bg-light mb-3" style={style}>
                            <div className="card-header">Operaciones</div>
                            <div className="card-body">
                                operaciones borrar, copiar
                            </div>
                        </div>
                        <div className="card text-bg-light mb-3" style={style}>
                            <div className="card-header">Listado Objetos</div>
                            <div className="card-body">
                                <ListadoElemento lista_elemento={lista_elemento}
                                                 seleccionarObjeto={this.props.seleccionarObjeto}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ObjetoMapa