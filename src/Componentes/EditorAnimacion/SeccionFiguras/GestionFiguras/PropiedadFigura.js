import InputAtributoFigura from "./InputAtributoFigura";
import SelectAtributo from "./SelectAtributo";

function PropiedadFigura(props) {
    const des_figura = props.animacion.getMetaFigura(props.tipo_figura)
    const figura = props.figura
    const nombre_figura = figura !== null? figura.nombre: "Sin Nombre"

    let lista_input = []

    const lista_atributos = des_figura.atributos;
    const resto = lista_atributos.length%2;
    const num_filas = (lista_atributos.length - resto)
    //console.log("figura: ", figura)
    for (let i=0; i<num_filas; i+=2){
        const nombre_attr1 = lista_atributos[i].nombre
        const nombre_attr2 = lista_atributos[i+1].nombre
        const valor1 = figura !== null? figura.atributos[nombre_attr1]: null;
        const valor2 = figura !== null? figura.atributos[nombre_attr2]: null;
        const id1 = "id_"+props.nombre_grupo+nombre_figura+props.tipo_figura+nombre_attr1
        const id2 = "id_"+props.nombre_grupo+nombre_figura+props.tipo_figura+nombre_attr2
        /*console.log("attr1: ", nombre_attr1)
        console.log("attr2: ", nombre_attr2)
        console.log("valor1: ", valor1)
        console.log("valor2: ", valor2)*/
        lista_input.push(<div className="row">
            <div className="col">
                <InputAtributoFigura id={id1} name_attr={lista_atributos[i].nombre} valor={valor1}
                                     cambio_atributo_figura={props.cambio_atributo_figura}/>
            </div>
            <div className="col">
                <InputAtributoFigura id={id2} name_attr={lista_atributos[i+1].nombre} valor={valor2}
                                     cambio_atributo_figura={props.cambio_atributo_figura}/>
            </div>
        </div>)
    }
    if(resto>0){
        const ultimo_nombre = lista_atributos.at(-1).nombre;
        const valor1 = figura !== null? figura.atributos[ultimo_nombre]: null;
        const id = "id_"+props.nombre_grupo+nombre_figura+props.tipo_figura+ultimo_nombre
        lista_input.push(<div className="row">
            <div className="col">
                <InputAtributoFigura id={id} name_attr={ultimo_nombre} valor={valor1}
                                     cambio_atributo_figura={props.cambio_atributo_figura}/>
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