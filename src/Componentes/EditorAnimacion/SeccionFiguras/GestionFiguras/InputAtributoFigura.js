function InputAtributoFigura(props){

    const desactivar={};
    if(props.valor==null){
        desactivar["disabled"] = "disabled"
    }

    return(<div className="input-group input-group-sm mb-3">
        <span className="input-group-text" id="inputGroup-sizing-sm">{props.name_attr}</span>
        <input id={props.id} key={props.id} type="number" className="form-control" aria-label="Sizing example input"
               aria-describedby="inputGroup-sizing-sm" value={props.valor} {...desactivar}
               onChange={(e)=>props.cambio_atributo_figura(props.name_attr, e.target.value)}/>
    </div>)
}

export default InputAtributoFigura