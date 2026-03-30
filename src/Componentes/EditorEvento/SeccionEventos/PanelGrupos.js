import {useState, useRef, useEffect} from "react";
import ModalImportarGrupos from "./ModalImportarGrupos";

import {useDispatch, useSelector} from "react-redux";
import {setEventoActual} from "../../../Store/Evento/eventoSlice";
function PanelGrupos(props) {

    const evento_redux = useSelector(state => state.evento);
    const importarGruposFiguras = (grupos) =>{

        console.log(grupos);
        console.log(evento_redux)
        //dispatch(setEventoActual({edicion: eventoAnimacion.edicion}))
    }


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
                importarGruposFiguras={importarGruposFiguras}
                // Puedes iniciar con algunos ya pasados a la izquierda:
                // initialSelected={[2, 5, 7]}
            />
        </div>
    );
}

export default PanelGrupos;
