import MenuAnimacion from "../EditorAnimacion/MenuAnimacion";
import NavEditorAnimacion from "../EditorAnimacion/NavEditorAnimacion";
import ModalImportarGrupo from "../EditorAnimacion/SeccionFiguras/GestionGrupos/ImportarGrupos/ModalImportarGrupo";
import React from "react";
import MenuEvento from "./MenuEvento";
import NavEditorEvento from "./NavEditorEvento";


function EditorEvento(props){
    return(<div>
        <div className="row">
            <MenuEvento />
            <hr/>
            <NavEditorEvento>
            </NavEditorEvento>

        </div>
    </div>)
}

export default EditorEvento