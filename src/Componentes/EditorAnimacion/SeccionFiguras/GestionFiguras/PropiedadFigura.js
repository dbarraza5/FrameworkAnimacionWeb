function PropiedadFigura(props) {
    //const tipo_figura = props.tipo_figura;
    //const nombre_grupo = props.nombre_grupo;
    const propiedad_figura = props.propiedad_figura;
    const valor_propiedad = props.valor_propiedad;

    const des_figura = props.animacion.getMetaFigura(props.tipo_figura)
    const nombre_figura = props.nombre_figura !==null? props.nombre_figura: "Sin Nombre"

    return (<div>
        <table className="table">
            <thead>
            <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Tipo</th>
                <th scope="col">Nombre Grupo</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td scope="row">{nombre_figura}</td>
                <td>{props.tipo_figura}</td>
                <td>{props.nombre_grupo}</td>
            </tr>
            </tbody>
        </table>
        {Object.keys(des_figura.atributos).map((name_attr) => {
            const tipo = des_figura.atributos[name_attr]
            if(tipo === "TIPO_INT"){
                return (
                <div className="input-group input-group-sm mb-3">
                    <span className="input-group-text" id="inputGroup-sizing-sm">{name_attr}</span>
                    <input type="number" className="form-control" aria-label="Sizing example input"
                           aria-describedby="inputGroup-sizing-sm"/>
                </div>
                )
            }
        })}
    </div>)
}

export default PropiedadFigura