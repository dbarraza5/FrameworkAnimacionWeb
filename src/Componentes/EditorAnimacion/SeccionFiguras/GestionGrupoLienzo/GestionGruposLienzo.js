import TreeViewElement from "../../../TreeView/TreeViewElement";


function GestionGruposLienzo(props){


    if(props.animacion.meta_figuras.length===0){
        return (<p>nada</p>)
    }
    const arbol=props.animacion.estructura_arbol_grupos()
    return (<div>
        <br/>
        <div className="row">
            <div className="col-6">
                <div className="card">
                    <div className="card-header">
                        Estructura Arbol
                    </div>
                    <div className="card-body">
                        <TreeViewElement datos={arbol.nodes}/>
                    </div>
                </div>
            </div>
            <div className="col-6">
                <form>
                    <legend>Opciones</legend>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_mover"/>
                        <label className="form-check-label" htmlFor="radio_grupo_mover">
                            Mover
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_rotar"
                               checked/>
                        <label className="form-check-label" htmlFor="radio_grupo_rotar">
                            Rotar
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_tamano"
                               />
                        <label className="form-check-label" htmlFor="radio_grupo_tamano">
                            Tamaño
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_duplicar"
                               />
                        <label className="form-check-label" htmlFor="radio_grupo_duplicar">
                            Duplicar
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_borrar"
                               checked/>
                        <label className="form-check-label" htmlFor="radio_grupo_borrar">
                            Borrar
                        </label>
                    </div>

                </form>

            </div>
        </div>
    </div>)
}

export default GestionGruposLienzo