import React, { useState } from 'react';
import TreeViewElement from "../../../TreeView/TreeViewElement";

function ModalTransferirGrupos(props) {
    const arbol=props.animacion.estructura_arbol_grupos();
    const arbol2=props.animacion2.estructura_arbol_grupos();
    const [lista_seleccionados, setListaSeleccionados] = useState([])
    console.log(arbol2)
    console.log(props.animacion2)
    console.log(arbol)

    return (
        <>
            <div className="container">
                <div className="row">
                    <div className="col-md-5">
                        <h4>Contenedor 1</h4>
                        <TreeViewElement datos={arbol.nodes} setListaSeleccionados={setListaSeleccionados} lista_select_={lista_seleccionados}/>
                    </div>
                    <div className="col-md-2 text-center">
                        <div className="d-grid gap-2">
                            <button className="btn btn-primary mt-2" onClick={console.log("")}>
                                <i className="bi bi-arrow-right"></i>
                            </button>
                            <button className="btn btn-primary mt-2" onClick={console.log("")}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <h4>Contenedor 2</h4>
                        <TreeViewElement datos={arbol2.nodes} setListaSeleccionados={setListaSeleccionados} lista_select_={lista_seleccionados}/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalTransferirGrupos;
