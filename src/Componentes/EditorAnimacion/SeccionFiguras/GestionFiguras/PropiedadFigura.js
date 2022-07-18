import InputAtributoFigura from "./InputAtributoFigura";

function PropiedadFigura(props) {
    //const tipo_figura = props.tipo_figura;
    //const nombre_grupo = props.nombre_grupo;
    const propiedad_figura = props.propiedad_figura;
    const valor_propiedad = props.valor_propiedad;

    const des_figura = props.animacion.getMetaFigura(props.tipo_figura)
    const nombre_figura = props.nombre_figura !==null? props.nombre_figura: "Sin Nombre"

    let lista_input = []
    /*Object.keys(des_figura.atributos).map((name_attr) => {
        const tipo = des_figura.atributos[name_attr]
        if(tipo === "TIPO_INT"){
            lista_input.push(
                <div className="input-group input-group-sm mb-3">
                    <span className="input-group-text" id="inputGroup-sizing-sm">{name_attr}</span>
                    <input type="number" className="form-control" aria-label="Sizing example input"
                           aria-describedby="inputGroup-sizing-sm"/>
                </div>
            )
        }
    })*/
    const lista_atributos = Object.keys(des_figura.atributos);
    const resto = lista_atributos.length%2;
    const num_filas = (lista_atributos.length - resto)
    for (let i=0; i<num_filas; i+=2){
        lista_input.push(<div className="row">
            <div className="col">
                <InputAtributoFigura name_attr={lista_atributos[i]}/>
            </div>
            <div className="col">
                <InputAtributoFigura name_attr={lista_atributos[i+1]}/>
            </div>
        </div>)
    }
    if(resto>0){
        lista_input.push(<div className="row">
            <div className="col">
                <InputAtributoFigura name_attr={lista_atributos.at(-1)}/>
            </div>
            <div className="col">

            </div>
        </div>)
    }

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

        <div className="card text-bg-light mb-3" >
            <div className="card-header">Atributos</div>
            <div className="card-body">
                {lista_input}
            </div>
        </div>


    </div>)
}

export default PropiedadFigura