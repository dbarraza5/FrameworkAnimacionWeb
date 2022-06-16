import {Component} from "react";

class SelectInstancias extends Component{
    render() {
        const meta_objetos = this.props.meta_objetos
        return(
            <div id="opciones" className="row">
                <div className="d-grid gap-3">
                    <label htmlFor="id_seleccion_objetos"
                           className="form-label">Seleccion de opciones</label>
                    <select id="id_seleccion_objetos" className="form-select" aria-label="seleccione un objeto..."
                            autoComplete="off">
                        {meta_objetos.map((obj)=>{
                            return <option value={obj.nombre}>{obj.nombre}</option>
                        })}
                    </select>
                    <button type="button" className="btn btn-outline-info">Agregar</button>
                </div>
            </div>
        )
    }
}

export default SelectInstancias