import { useState } from "react";
import PanelEventos from "./PanelEventos";

function ModalAgregarEvento({ show, onClose, onGuardar, eventoAnimacion }) {
    const [evento, setEvento] = useState(null);

    const handleGuardar = (nuevoEvento) => {
        onGuardar(nuevoEvento);  // Devuelve el evento al padre
        onClose();                // Cierra el modal
    };

    return (
        <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog"
             style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Agregar Evento</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <PanelEventos
                            evento={{}} // Evento vacío para agregar
                            eventoAnimacion={eventoAnimacion}
                            guardandoEvento={handleGuardar}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalAgregarEvento;
