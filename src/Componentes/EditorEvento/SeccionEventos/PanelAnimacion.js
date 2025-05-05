import { useState, useRef } from "react";

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}

function PanelAnimacion({ eventos = [] }) {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [nombre, setNombre] = useState("");
    const [milisegundos, setMilisegundos] = useState(0);
    const [bucle, setBucle] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const intervalRef = useRef(null);

    const STEP = 100;
    const MAX = 60000;
    const MIN = 0;

    const startChangingTime = (type) => {
        stopChangingTime();
        intervalRef.current = setInterval(() => {
            setMilisegundos(prev => {
                if (type === "aumentar") return Math.min(prev + STEP, MAX);
                if (type === "disminuir") return Math.max(prev - STEP, MIN);
                return prev;
            });
        }, 100);
    };

    const stopChangingTime = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handlePlay = () => {
        console.log("Reproduciendo:", {
            eventoPadre: selectedEvent,
            nombre,
            tiempo: formatTime(milisegundos),
            bucle
        });
    };

    const handleStop = () => {
        console.log("Detenido");
    };

    const handleReset = () => {
        setMilisegundos(0);
        setNombre("");
        setSelectedEvent("");
        setBucle(false);
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
                <label className="form-label">Evento padre</label>
                <select
                    className="form-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                >
                    <option value="">Seleccionar evento padre</option>
                    {eventos.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del evento"
                />
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

            <div className="form-check mb-3">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="bucleCheck"
                    checked={bucle}
                    onChange={() => setBucle(!bucle)}
                />
                <label className="form-check-label" htmlFor="bucleCheck">
                    Bucle
                </label>
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
