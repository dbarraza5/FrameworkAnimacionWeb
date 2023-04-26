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
        /*console.log("[MOVER GRUPOS]")
        console.log("[Lista Grupos Seleccionado]")
        console.log(lista_seleccionados)
        console.log("[Operaciones]")
        console.log(operacion)*/
        props.gestionLienzo.seleccionListaGrupos(lista_seleccionados)
        if(operacion === "mover"){
            props.gestionLienzo.seleccionGrupoMover(lista_seleccionados)
        }

        if(operacion === "duplicar"){
            props.gestionLienzo.seleccionGrupoDuplicar(lista_seleccionados)
        }

        if(operacion === "rotar"){
            props.gestionLienzo.seleccionGrupoRotar(lista_seleccionados)
        }

        if(operacion === "tamano"){
            props.gestionLienzo.seleccionGrupoTamano(lista_seleccionados)
        }
    }

    const cambioOperacion = (e)=>{
        console.log(e.target.value)
        setOperacion(e.target.value)
        console.log("cambio de operacion: "+e.target.value)
        //mover_grupos()
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

                    <div className="btn-group-vertical" role="group" aria-label="Basic checkbox toggle button group">
                        <input type="radio" className="btn-check" id="radio_grupo_mover" name="radio_grupo" autoComplete="off"
                               value="mover" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_mover">Mover</label>

                        <input type="radio" className="btn-check" id="radio_grupo_rotar" name="radio_grupo" autoComplete="off"
                               value="rotar" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_rotar">Rotar</label>

                        <input type="radio" className="btn-check" id="radio_grupo_tamano" name="radio_grupo" autoComplete="off"
                               value="tamano" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_tamano">Tamaño</label>

                    </div>
                    <div className="btn-group-vertical" role="group" aria-label="Basic checkbox toggle button group">
                        <input type="radio" className="btn-check" id="radio_grupo_duplicar" name="radio_grupo" autoComplete="off"
                               value="duplicar" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_duplicar">Duplicar</label>

                        <input type="radio" className="btn-check" id="radio_grupo_espejo" name="radio_grupo" autoComplete="off"
                               value="espejo" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_espejo">Espejo</label>

                        <input type="radio" className="btn-check" id="radio_grupo_borrar" name="radio_grupo" autoComplete="off"
                               value="borrar" onChange={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_borrar">Borrar</label>
                    </div>

                    <br/>
                    <input type="button" className="btn-check" autoComplete="off"
                           value="tamano" onChange={mover_grupos}/>
                    <label className="btn btn-outline-primary" htmlFor="radio_grupo_tamano">aplicar</label>
                </form>

            </div>
        </div>
        <button onClick={mover_grupos}>moverrrrsh</button>
    </div>)
}

export default GestionGruposLienzo