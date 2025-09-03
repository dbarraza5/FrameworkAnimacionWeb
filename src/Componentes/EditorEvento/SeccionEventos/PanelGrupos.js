import {useState, useRef, useEffect} from "react";
import ModalImportarGrupos from "./ModalImportarGrupos";


function PanelGrupos(props) {


    return (
        <div className="container-fluid">
            <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#dualListModal"
            >
                Abrir modal
            </button>

            <ModalImportarGrupos
                id="dualListModal"
                title="Mover elementos a la izquierda"
                // Puedes iniciar con algunos ya pasados a la izquierda:
                // initialSelected={[2, 5, 7]}
            />
        </div>
    );
}

export default PanelGrupos;
