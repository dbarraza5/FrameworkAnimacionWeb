import React, { useState } from 'react';
import TreeViewElement from "../../../../TreeView/TreeViewElement";
import ArbolGrupos from "./ArbolGrupos";

function ModalTransferirGrupos(props) {
    const arbol=props.animacion.estructura_arbol_grupos();
    const arbol2=props.animacion2.estructura_arbol_grupos();
    const [nombre_grupo_origen, setNombreGrupoOrigen] = useState(null);
    const [nombre_grupo_export, setNombreGrupoExport] = useState(null);
    console.log(arbol2)
    console.log(props.animacion2)
    console.log(arbol)

    return (
        <>
            <div className="container">
                <div className="row">
                    <div className="col-md-5">
                        <h4>Contenedor 1 {nombre_grupo_origen}</h4>
                        <ArbolGrupos datos={arbol.nodes} id_animacion="animacion1" setNombreGrupo={setNombreGrupoOrigen}/>
                    </div>
                    <div className="col-md-2 text-center">
                        <div className="d-grid gap-2">
                            <button className="btn btn-primary mt-2" onClick={console.log("")}>
                                agregar
                            </button>
                            <button className="btn btn-primary mt-2" onClick={console.log("")}>
                                fucionar
                            </button>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <h4>Contenedor 2 {nombre_grupo_export}</h4>
                        <ArbolGrupos datos={arbol2.nodes} id_animacion="animacion2" setNombreGrupo={setNombreGrupoExport}/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalTransferirGrupos;
