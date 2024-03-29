import TreeViewElement from "../../../TreeView/TreeViewElement";
import {useEffect, useState} from "react";
import CrearGrupo from "../GestionGrupos/CrearGrupo";
import TablaGrupos from "../GestionGrupos/TablaGrupos";

import { useSelector, useDispatch } from 'react-redux';
import {setListaGrupoTrabajo} from "../../../../Store/Animacion/animacionSlice"

function GestionGruposLienzo(props){
    const backup_actual = useSelector((state) => state.animacion.backup.actual);

    const grupos_trabajando = useSelector((state) => state.animacion.animacion.grupos_trabajando);
    const dispatch = useDispatch();

    const [operacion, setOperacion] = useState(null)
    const [lista_seleccionados, setListaSeleccionados] = useState(grupos_trabajando)

    const backup = useSelector((state) => state.animacion.backup);
    //console.log("NUEVOS GRUPOSSSSSSSS=======================>")
    //console.log(lista_seleccionados)
    useEffect(()=>{
        props.gestionLienzo.seleccionListaGrupos(lista_seleccionados)
        props.gestionLienzo.actualizarLienzo()
        dispatch(setListaGrupoTrabajo(lista_seleccionados));
    }, [lista_seleccionados])

    useEffect(()=>{
        setListaSeleccionados(grupos_trabajando)
    }, [grupos_trabajando])


    const [arbol, setArbol] = useState(null);

    useEffect(() => {
        console.log("const raw_grupos = props.animacion.estructura_arbol_grupos();")
        const raw_grupos = props.animacion.estructura_arbol_grupos();
        setArbol(raw_grupos);
    }, [backup.actual]);


    if(props.animacion.meta_figuras.length===0 || arbol === null){
        return (<p>nada</p>)
    }

    const mover_grupos=(operacion_)=>{
        props.gestionLienzo.seleccionListaGrupos(lista_seleccionados)
        if(operacion_ === "mover"){
            props.gestionLienzo.seleccionGrupoMover(lista_seleccionados)
        }

        if(operacion_ === "duplicar"){
            props.gestionLienzo.seleccionGrupoDuplicar(lista_seleccionados)
        }

        if(operacion_ === "rotar"){
            props.gestionLienzo.seleccionGrupoRotar(lista_seleccionados)
        }

        if(operacion_ === "tamano"){
            props.gestionLienzo.seleccionGrupoTamano(lista_seleccionados)
        }

        if(operacion_ === "centrar"){
            props.gestionLienzo.seleccionGrupoCentrar(lista_seleccionados)
        }

        if(operacion_ === "espejo"){
            props.gestionLienzo.seleccionGrupoEspejo(lista_seleccionados)
        }

        if(operacion_ === "borrar"){
            props.gestionLienzo.seleccionGrupoBorrar(lista_seleccionados)
        }
    }

    const seleccionSentidoReflejo=(sentido)=>{
        if(sentido === 1)
            props.gestionLienzo.espejoReflejoHorizontal()
        if(sentido === 2)
            props.gestionLienzo.espejoReflejoVertical()
    }

    const cambioOperacion = (e)=>{
        console.log(e.target.value)
        //setOperacion(e.target.value)
        console.log("cambio de operacion: "+e.target.value)
        mover_grupos(e.target.value)
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
                        <TreeViewElement datos={arbol.nodes} setListaSeleccionados={setListaSeleccionados} lista_select_={lista_seleccionados}/>
                    </div>
                </div>
            </div>
            <div className="col-6">
                <form>
                    <legend>Opciones</legend>

                    <div className="btn-group-vertical" role="group" aria-label="Basic checkbox toggle button group">
                        <input type="button" className="btn-check" id="radio_grupo_mover" name="radio_grupo" autoComplete="off"
                               value="mover" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_mover">Mover</label>

                        <input type="button" className="btn-check" id="radio_grupo_rotar" name="radio_grupo" autoComplete="off"
                               value="rotar" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_rotar">Rotar</label>

                        <input type="button" className="btn-check" id="radio_grupo_tamano" name="radio_grupo" autoComplete="off"
                               value="tamano" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_tamano">Tamaño</label>

                    </div>
                    <div className="btn-group-vertical" role="group" aria-label="Basic checkbox toggle button group">
                        <input type="button" className="btn-check" id="radio_grupo_duplicar" name="radio_grupo" autoComplete="off"
                               value="duplicar" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_duplicar">Duplicar</label>

                        <input type="button" className="btn-check" id="radio_grupo_espejo" name="radio_grupo" autoComplete="off"
                               value="espejo" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_espejo">Espejo</label>

                        <input type="button" className="btn-check" id="radio_grupo_borrar" name="radio_grupo" autoComplete="off"
                               value="borrar" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_borrar">Borrar</label>
                    </div>

                    <div className="btn-group-vertical" role="group" aria-label="Basic checkbox toggle button group">
                        <input type="button" className="btn-check" id="radio_grupo_centrar" name="radio_grupo" autoComplete="off"
                               value="centrar" onClick={cambioOperacion}/>
                        <label className="btn btn-outline-primary" htmlFor="radio_grupo_centrar">Centrar</label>
                    </div>
                </form>
                <br/>
                <div className="accordion" id="accordionExample">
                    <div className="accordion-item">
                        <h2 className="accordion-header" id="headingTwo">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                Configuración
                            </button>
                        </h2>
                        <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo"
                             data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                <div className="btn-group" role="group" aria-label="Basic outlined example">
                                    <button type="button" className="btn btn-outline-primary"
                                            onClick={()=>seleccionSentidoReflejo(1)}><i
                                        className="bi bi-arrow-left-right"></i></button>
                                    <button type="button" className="btn btn-outline-primary" onClick={()=>seleccionSentidoReflejo(2)}><i
                                        className="bi bi-arrow-down-up"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default GestionGruposLienzo