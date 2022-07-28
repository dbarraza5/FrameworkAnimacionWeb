function SelectAtributo(props){
    return (<div className="input-group">
        <select id="id_seleccion_objetos" className="form-select" aria-label="seleccione un objeto..."
                autoComplete="off" onChange={(e)=>props.setTipoFigura(e.target.value)}>
            <option>...</option>
            {props.lista_atributos.map((attr)=>{
                return <option>{attr.nombre}</option>
            })}
        </select>
    </div>)
}

export default SelectAtributo;