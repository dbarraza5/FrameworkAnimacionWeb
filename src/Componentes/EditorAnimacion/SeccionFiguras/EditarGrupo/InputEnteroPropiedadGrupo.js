function InputEnteroPropiedadGrupo(props){
    return(<div className="input-group input-group-sm mb-3">
        <span className="input-group-text" id="inputGroup-sizing-sm">{props.nombre_input}</span>

        <input type="text" className="form-control" value={props.valor}
               onChange={(e)=>props.cambioPropiedadGrupo(props.valor, props.tipo, e.target.value)}
               id={props.tipo+"-grupo-"+props.nombre} {...props.desactivar}/>
    </div>)
}

export default InputEnteroPropiedadGrupo;