import {Component} from "react";

class SelectInstancias extends Component{
    state = {
        selector: null
    }

    seleccionar_objeto=(event)=>{
        console.log("valor: ", event.target.value)
        this.setState({selector: event.target.value})
    }

    render() {
        const meta_objetos = this.props.meta_objetos
        return(
            <div id="opciones" className="row">
                <div className="d-grid gap-3">
                    <label htmlFor="id_seleccion_objetos"
                           className="form-label">Seleccion de opciones</label>
                    <select id="id_seleccion_objetos" className="form-select" aria-label="seleccione un objeto..."
                            autoComplete="off" onChange={(e)=>this.seleccionar_objeto(e)}>
                        <option>...</option>
                        {meta_objetos.map((obj)=>{
                            return <option value={obj.nombre}>{obj.nombre}</option>
                        })}
                    </select>
                    <button type="button" onClick={(e)=>this.props.agregar_elemento(this.state.selector)}
                            className="btn btn-outline-info">Agregar</button>
                </div>
            </div>
        )
    }
}

export default SelectInstancias