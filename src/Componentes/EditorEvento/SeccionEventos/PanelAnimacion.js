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
    const [inicioMin, setInicioMin] = useState("00");
    const [inicioSeg, setInicioSeg] = useState("00");
    const [inicioMs, setInicioMs] = useState("000");

    const [finMin, setFinMin] = useState("00");
    const [finSeg, setFinSeg] = useState("00");
    const [finMs, setFinMs] = useState("000");
    const [showModal, setShowModal] = useState(false);
    const intervalRef = useRef(null);

    const [coordX, setCoordX] = useState("");
    const [coordY, setCoordY] = useState("");
    const [tiempoRelativo, setTiempoRelativo] = useState("");

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


    const handleStop = () => {
        console.log("Detenido");
    };

    return (
        <div>
            <h5>Controles de animación</h5>

            <div className="mb-2 d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={() => setShowModal(true)}>
                    Lista eventos
                </button>
                <button className="btn btn-outline-success">
                    <i className="bi bi-plus"></i>
                </button>
            </div>

            <div className="mb-2">
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

            <div className="mb-2">
                <label className="form-label">Nombre</label>
                <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del evento"
                />
            </div>

            <div className="mb-2 text-center">
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

            <div className="form-check mb-2">
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

            <div className="mb-2">
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

            <div className="mb-2">
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

            <div className="mb-2 d-flex gap-2">
                <div className="w-100">
                    <label className="form-label">Coordenada X</label>
                    <input
                        type="number"
                        className="form-control"
                        value={coordX}
                        onChange={(e) => setCoordX(e.target.value)}
                        placeholder="Ej: 100"
                    />
                </div>
                <div className="w-100">
                    <label className="form-label">Coordenada Y</label>
                    <input
                        type="number"
                        className="form-control"
                        value={coordY}
                        onChange={(e) => setCoordY(e.target.value)}
                        placeholder="Ej: 200"
                    />
                </div>
            </div>

            <div className="mb-2">
                <label className="form-label">Tiempo relativo</label>
                <input
                    type="text"
                    className="form-control"
                    value={tiempoRelativo}
                    onChange={(e) => setTiempoRelativo(e.target.value)}
                    placeholder="Ej: +500ms o -1s"
                />
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
