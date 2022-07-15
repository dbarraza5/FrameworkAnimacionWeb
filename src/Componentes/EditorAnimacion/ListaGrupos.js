import PropiedadGrupoFiguras from "./PropiedadGrupoFiguras";

function ListaGrupos(props){
    const grupos = props.animacion.grupos_figuras;
    const lista_name_grupos = props.animacion.get_lista_nombres_grupos();

    return(<div className="row">

        <div className="col-4">
            <div className="list-group" id="list-tab-grupo" role="tablist">
                {grupos.map((g, index)=>{
                    const clase = index === 0? "list-group-item list-group-item-action active":
                        "list-group-item list-group-item-action";
                    const id_grupo = "list-"+g.nombre+"-list"
                    const id_grupo_list = "#list-"+g.nombre;
                    return(
                        <a className={clase} id={id_grupo} data-bs-toggle="list"
                           href={id_grupo_list} role="tab" aria-controls="list-home">{g.nombre}</a>
                    );
                })}
            </div>
        </div>

        <div className="col-8">
            <div className="tab-content" id="nav-tabContent-grupo">
                {grupos.map((g, index)=>{
                    const clase = index === 0? "tab-pane fade show active":
                        "tab-pane fade";
                    const id_grupo = "list-"+g.nombre;
                    return(
                        <div className={clase} id={id_grupo} role="tabpanel"
                             aria-labelledby="list-home-list">
                            <PropiedadGrupoFiguras animacion={props.animacion} grupo={g} setAnimacion={props.setAnimacion}
                                                   index={index} lista_name_grupos={lista_name_grupos}/>
                        </div>
                    )
                })}

            </div>
        </div>


    </div>)
}

export default ListaGrupos;