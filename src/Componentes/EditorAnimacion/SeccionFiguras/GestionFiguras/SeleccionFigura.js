
function SeleccionFigura(props){
    let meta_figuras = props.meta_figuras
    return(<div id="opciones" className="row">
        <label htmlFor="id_seleccion_objetos"
               className="form-label">Seleccion de figura</label>
        <div className="input-group mb-3">

            <select id="id_seleccion_objetos" className="form-select" aria-label="seleccione un objeto..."
                    autoComplete="off" onChange={(e)=>props.setTipoFigura(e.target.value)}>
                {meta_figuras.map((fig)=>{
                    if(props.tipo_figura === fig.nombre){
                        return <option value={fig.nombre} selected="selected">{fig.nombre}</option>
                    }else{
                        return <option value={fig.nombre}>{fig.nombre}</option>
                    }
                })}
            </select>
            <button type="button" onClick={(e)=>props.agregar_figura()}
                    className="btn btn-outline-info">Agregar</button>
        </div>
    </div>)
}

export default SeleccionFigura

