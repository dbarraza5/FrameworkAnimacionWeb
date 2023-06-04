import React, { useState } from 'react';
import TreeViewElement from "../../../../TreeView/TreeViewElement";
import ArbolGrupos from "./ArbolGrupos";

function ModalTransferirGrupos(props) {
    const arbol=props.animacion.estructura_arbol_grupos();
    const arbol2=props.animacion2.estructura_arbol_grupos();
    const [nombre_grupo_origen, setNombreGrupoOrigen] = useState(null);
    const [nombre_grupo_export, setNombreGrupoExport] = useState(null);
    const [lista_seleccionados, setListaSeleccionados] = useState([])
    console.log(arbol2)
    console.log(props.animacion2)
    console.log(arbol)

    const agregar_grupo=()=>{
        if(nombre_grupo_origen !== null && lista_seleccionados.length >0){
            console.log("[LISTA de GRUPOS A AGREGAR]")
            console.log(lista_seleccionados)

            for(let i=0; i<lista_seleccionados.length; i++){
                const nombre = lista_seleccionados[i];
                const grupo = props.animacion2.getGrupo(nombre);
                if(!lista_seleccionados.includes(grupo.nodo_padre)){
                    grupo.nodo_padre = nombre_grupo_origen;
                }
                props.animacion.grupos_figuras.push(grupo)
            }
            props.setAnimacion({"edicion": props.animacion})
        }
    }

    return (
        <>
            <div className="container">
                <div className="row">
                    <div className="col-md-5">
                        <h4>Origen {nombre_grupo_export}</h4>
                        <TreeViewElement datos={arbol2.nodes} setListaSeleccionados={setListaSeleccionados} lista_select_={lista_seleccionados}/>
                    </div>
                    <div className="col-md-2 text-center">
                        <div className="d-grid gap-2">
                            <button className="btn btn-primary mt-2" onClick={agregar_grupo}>
                                agregar
                            </button>
                            <button className="btn btn-primary mt-2" onClick={console.log("")}>
                                fucionar
                            </button>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <h4>Destino {nombre_grupo_origen}</h4>
                        <ArbolGrupos datos={arbol} id_animacion="animacion1" setNombreGrupo={setNombreGrupoOrigen}/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalTransferirGrupos;
