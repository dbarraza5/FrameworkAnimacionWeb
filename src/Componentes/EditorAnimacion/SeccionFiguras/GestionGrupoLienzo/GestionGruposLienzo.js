import TreeViewElement from "../../../TreeView/TreeViewElement";
import {useEffect, useState} from "react";


function GestionGruposLienzo(props){

    const [operacion, setOperacion] = useState(null)
    const [lista_seleccionados, setListaSeleccionados] = useState([])

    useEffect(()=>{
        props.gestionLienzo.seleccionListaGrupos(lista_seleccionados)
        props.gestionLienzo.actualizarLienzo()
    }, [lista_seleccionados])

    if(props.animacion.meta_figuras.length===0){
        return (<p>nada</p>)
    }
    const arbol=props.animacion.estructura_arbol_grupos()

    const mover_grupos=()=>{
        console.log("[MOVER GRUPOS]")
        console.log("[Lista Grupos Seleccionado]")
        console.log(lista_seleccionados)
        console.log("[Operaciones]")
        console.log(operacion)
        if(operacion === "mover"){
            props.gestionLienzo.seleccionGrupoMover(lista_seleccionados)
        }

        if(operacion === "duplicar"){
            props.gestionLienzo.seleccionGrupoDuplicar(lista_seleccionados)
        }

        if(operacion === "rotar"){
            props.gestionLienzo.seleccionGrupoRotar(lista_seleccionados)
        }


    }

    const cambioOperacion = (e)=>{
        console.log(e.target.value)
        setOperacion(e.target.value)
    }

    return (<div>
        <br/>
        <div className="row">
            <div className="col-6">
                <div className="card">
                    <div className="card-header">
                        Estructura Arbol
                    </div>
                    <div className="card-body">
                        <TreeViewElement datos={arbol.nodes} setListaSeleccionados={setListaSeleccionados}/>
                    </div>
                </div>
            </div>
            <div className="col-6">
                <form>
                    <legend>Opciones</legend>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_mover"
                            value="mover" onChange={cambioOperacion}/>
                        <label className="form-check-label" htmlFor="radio_grupo_mover">
                            Mover
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_rotar"
                               value="rotar" onChange={cambioOperacion}/>
                        <label className="form-check-label" htmlFor="radio_grupo_rotar">
                            Rotar
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_tamano"
                               value="tamano" onChange={cambioOperacion}/>
                        <label className="form-check-label" htmlFor="radio_grupo_tamano">
                            Tamaño
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_duplicar"
                               value="duplicar" onChange={cambioOperacion}/>
                        <label className="form-check-label" htmlFor="radio_grupo_duplicar">
                            Duplicar
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="radio_grupo" id="radio_grupo_borrar"
                               value="borrar" onChange={cambioOperacion}/>
                        <label className="form-check-label" htmlFor="radio_grupo_borrar">
                            Borrar
                        </label>
                    </div>

                </form>

            </div>
        </div>
        <button onClick={mover_grupos}>moverrrrsh</button>
    </div>)
}

export default GestionGruposLienzo