function InputAtributoFigura(props){
    return(<div className="input-group input-group-sm mb-3">
        <span className="input-group-text" id="inputGroup-sizing-sm">{props.name_attr}</span>
        <input type="number" className="form-control" aria-label="Sizing example input"
               aria-describedby="inputGroup-sizing-sm"/>
    </div>)
}

export default InputAtributoFigura