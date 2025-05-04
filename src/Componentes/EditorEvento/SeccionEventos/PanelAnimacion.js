import { useState } from "react";

function PanelAnimacion({ eventos = [] }) {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [tiempo, setTiempo] = useState("00:00:000");
    const [showModal, setShowModal] = useState(false);

    const handlePlay = () => {
        console.log("Reproduciendo:", selectedEvent, "desde", tiempo);
    };

    const handleStop = () => {
        console.log("Detenido");
    };

    const handleReset = () => {
        setTiempo("00:00:000");
        setSelectedEvent("");
        console.log("Reset");
    };

    return (
        <div>
            <h5>Controles de animación</h5>

            <div className="mb-3 d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={() => setShowModal(true)}>
                    Lista eventos
                </button>
                <button className="btn btn-outline-success">
                    <i className="bi bi-plus"></i>
                </button>
            </div>

            <div className="mb-3">
                <label>Tiempo (mm:ss:ms)</label>
                <input
                    type="text"
                    className="form-control"
                    value={tiempo}
                    onChange={(e) => setTiempo(e.target.value)}
                    placeholder="00:00:000"
                />
            </div>

            <div className="d-flex gap-2">
                <button className="btn btn-success" onClick={handlePlay}>Reproducir</button>
                <button className="btn btn-warning" onClick={handleStop}>Detener</button>
                <button className="btn btn-secondary" onClick={handleReset}>Resetear</button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Lista de eventos</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Contenido vacío por ahora.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PanelAnimacion;
