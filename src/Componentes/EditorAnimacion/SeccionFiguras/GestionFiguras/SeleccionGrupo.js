function SeleccionGrupo(props){
    const lista_grupos = props.lista_grupos
    return(<div id="opciones" className="row">
        <div className="mb-3">
            <label htmlFor="id_seleccion_objetos"
                   className="form-label">Seleccion de grupo</label>
            <select id="id_seleccion_objetos" className="form-select" aria-label="seleccione un objeto..."
                    autoComplete="off" onChange={(e)=>props.setNombreGrupo(e.target.value)}>
                {lista_grupos.map((nombre)=>{
                    if(props.nombre_grupo === nombre){
                        return <option value={nombre} selected="selected">{nombre}</option>
                    }else{
                        return <option value={nombre}>{nombre}</option>
                    }
                })}
            </select>
        </div>
    </div>)
}

export default SeleccionGrupo;