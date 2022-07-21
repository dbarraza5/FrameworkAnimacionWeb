function InputEnteroPropiedadGrupo(props){
    let tipo_entrada = props.tipo_entrada
    if(props.tipo_entrada == null){
        tipo_entrada={type: "number"}
    }
    return(<div className="input-group input-group-sm mb-3">
        <span className="input-group-text" id="inputGroup-sizing-sm">{props.nombre_input}</span>

        <input {...tipo_entrada} className="form-control" value={props.valor}
               onChange={(e)=>props.cambioPropiedadGrupo(props.nombre_grupo, props.tipo, e.target.value)}
               id={props.tipo+"-grupo-"+props.nombre} {...props.desactivar}/>
    </div>)
}

export default InputEnteroPropiedadGrupo;