function TablaFiguras(props){

    const grupo = props.animacion.getGrupo(props.nombre_grupo)

    const borrar_figura=(nombre_grupo, nombre_figura)=>{
        props.animacion.borrar_figura(nombre_grupo, nombre_figura)
        props.setAnimacion({"edicion": props.animacion})
    }

    if(grupo!=null){
        return(
            <table className="table">
                <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">nombre</th>
                    <th scope="col">tipo</th>
                    <th scope="col">visible</th>
                    <th scope="col">operaciones</th>
                </tr>
                </thead>
                <tbody>
                {grupo.lista_figuras.map((fig, index)=>{
                    return(<tr>
                        <th scope="row">{index+1}</th>
                        <td>{fig.nombre}</td>
                        <td>{fig.tipo_figura}</td>
                        <td>
                            <input className="form-check-input" type="checkbox" value=""
                                   id="flexCheckDefault"
                                   onChange={(e)=>console.log("asdsda das")}
                            />
                        </td>
                        <td>
                            <div className="btn-group btn-group-sm" role="group" aria-label="Basic outlined example">
                                <button type="button" className="btn btn-outline-primary" onClick={()=>props.selet_figura_editar(fig.nombre, fig.tipo_figura)}>
                                    <i className="bi bi-pencil"></i>
                                </button>
                                <button type="button" className="btn btn-outline-primary"><i className="bi bi-files"></i></button>
                                <button type="button" className="btn btn-outline-primary"
                                        onClick={()=>borrar_figura(props.nombre_grupo, fig.nombre)}>
                                    <i className="bi bi-eraser"></i>
                                </button>
                            </div>
                        </td>
                    </tr>)
                })}

                </tbody>
            </table>
        )
    }
    return(<div> sin grupo</div>)


}
export default TablaFiguras;