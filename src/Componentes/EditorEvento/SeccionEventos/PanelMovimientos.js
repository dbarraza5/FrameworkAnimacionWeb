import { useState } from "react";

function PanelMovimientos() {
    const [showModal, setShowModal] = useState(false);
    const [tipoAccion, setTipoAccion] = useState("MRU");

    const [inicioMin, setInicioMin] = useState("00");
    const [inicioSeg, setInicioSeg] = useState("00");
    const [inicioMs, setInicioMs] = useState("000");

    const [finMin, setFinMin] = useState("00");
    const [finSeg, setFinSeg] = useState("00");
    const [finMs, setFinMs] = useState("000");

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

            {/* Select tipo acción */}
            <div className="mb-3">
                <label className="form-label">Tipo de acción</label>
                <select
                    className="form-select"
                    value={tipoAccion}
                    onChange={(e) => setTipoAccion(e.target.value)}
                >
                    <option value="MRU">MRU</option>
                    <option value="MRUA">MRUA</option>
                    <option value="Trayectoria Parabólica">Trayectoria Parabólica</option>
                </select>
            </div>

            {/* Tiempo de inicio */}
            <div className="mb-3">
                <label className="form-label">Tiempo de inicio</label>
                <div className="d-flex gap-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="mm"
                        value={inicioMin}
                        onChange={(e) => setInicioMin(e.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="ss"
                        value={inicioSeg}
                        onChange={(e) => setInicioSeg(e.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="ms"
                        value={inicioMs}
                        onChange={(e) => setInicioMs(e.target.value)}
                    />
                </div>
            </div>

            {/* Tiempo de fin */}
            <div className="mb-3">
                <label className="form-label">Tiempo de fin</label>
                <div className="d-flex gap-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="mm"
                        value={finMin}
                        onChange={(e) => setFinMin(e.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="ss"
                        value={finSeg}
                        onChange={(e) => setFinSeg(e.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="ms"
                        value={finMs}
                        onChange={(e) => setFinMs(e.target.value)}
                    />
                </div>
            </div>

            {/* Modal vacío (placeholder) */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal-dialog"
                        onClick={(e) => e.stopPropagation()}
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
            )}
        </div>
    );
}

export default PanelMovimientos;
