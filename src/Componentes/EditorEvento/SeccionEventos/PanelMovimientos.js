import { useState } from "react";

function PanelMovimientos() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            {/* Botones */}
            <div className="mb-2 d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={() => setShowModal(true)}>
                    Lista movimientos
                </button>
                <button className="btn btn-outline-success">
                    <i className="bi bi-plus"></i>
                </button>
            </div>

            {/* Modal (simulado) */}
            {showModal && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                        onClick={() => setShowModal(false)}
                    >
                        <div
                            className="modal-dialog"
                            onClick={(e) => e.stopPropagation()} // evita cerrar si haces click dentro del modal
                        >
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Lista de movimientos</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>(Modal vacío por ahora)</p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default PanelMovimientos;
