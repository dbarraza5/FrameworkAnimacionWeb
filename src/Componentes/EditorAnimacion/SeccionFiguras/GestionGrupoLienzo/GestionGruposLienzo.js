import TreeViewElement from "../../../TreeView/TreeViewElement";


function GestionGruposLienzo(props){


    if(props.animacion.meta_figuras.length===0){
        return (<p>nada</p>)
    }
    const arbol=props.animacion.estructura_arbol_grupos()
    return (<div>
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
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1"/>
                        <label className="form-check-label" htmlFor="flexRadioDefault1">
                            Mover
                        </label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2"
                           checked/>
                        <label className="form-check-label" htmlFor="flexRadioDefault2">
                            Rotar
                        </label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2"
                           checked/>
                    <label className="form-check-label" htmlFor="flexRadioDefault2">
                        Aumentar
                    </label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2"
                           checked/>
                    <label className="form-check-label" htmlFor="flexRadioDefault2">
                        Reducir
                    </label>
                </div>
            </div>
        </div>
    </div>)
}

export default GestionGruposLienzo