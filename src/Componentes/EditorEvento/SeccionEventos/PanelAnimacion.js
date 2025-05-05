import { useState, useRef } from "react";

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}

function PanelAnimacion({ eventos = [] }) {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [milisegundos, setMilisegundos] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const intervalRef = useRef(null);

    const STEP = 100;
    const MAX = 60000;
    const MIN = 0;

    const startChangingTime = (type) => {
        stopChangingTime(); // por si acaso ya hay uno activo
        intervalRef.current = setInterval(() => {
            setMilisegundos(prev => {
                if (type === "aumentar") return Math.min(prev + STEP, MAX);
                if (type === "disminuir") return Math.max(prev - STEP, MIN);
                return prev;
            });
        }, 100); // cada 100ms cambia
    };

    const stopChangingTime = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handlePlay = () => {
        console.log("Reproduciendo:", selectedEvent, "desde", formatTime(milisegundos));
    };

    const handleStop = () => {
        console.log("Detenido");
    };

    const handleReset = () => {
        setMilisegundos(0);
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

            <div className="mb-3 text-center">
                <label className="form-label">Tiempo (mm:ss:ms)</label>
                <div className="d-flex justify-content-center align-items-center gap-2">
                    <button
                        className="btn btn-outline-danger"
                        onMouseDown={() => startChangingTime("disminuir")}
                        onMouseUp={stopChangingTime}
                        onMouseLeave={stopChangingTime}
                    >
                        –
                    </button>
                    <div style={{ minWidth: '120px', fontWeight: 'bold' }}>{formatTime(milisegundos)}</div>
                    <button
                        className="btn btn-outline-primary"
                        onMouseDown={() => startChangingTime("aumentar")}
                        onMouseUp={stopChangingTime}
                        onMouseLeave={stopChangingTime}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="d-flex gap-2">
                <button className="btn btn-success" onClick={handlePlay}>Reproducir</button>
                <button className="btn btn-warning" onClick={handleStop}>Detener</button>
                <button className="btn btn-secondary" onClick={handleReset}>Resetear</button>
            </div>

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
