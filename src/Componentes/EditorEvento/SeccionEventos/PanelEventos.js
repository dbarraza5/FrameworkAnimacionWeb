import { useState, useRef } from "react";

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}

function PanelEventos(props) {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [nombre, setNombre] = useState(props.evento?.evento?.nombre || "");
    const [milisegundos, setMilisegundos] = useState(0);
    const [bucle, setBucle] = useState(false);
    const [inicioMin, setInicioMin] = useState("00");
    const [inicioSeg, setInicioSeg] = useState("00");
    const [inicioMs, setInicioMs] = useState("000");

    const [finMin, setFinMin] = useState("00");
    const [finSeg, setFinSeg] = useState("00");
    const [finMs, setFinMs] = useState("000");
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
            <div className="mb-2">
                <label className="form-label">Evento padre</label>
                <select
                    className="form-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                >
                    <option value="">Seleccionar evento padre</option>
                    {props.eventoAnimacion.edicion.eventos.map((ev) => (
                        <option key={ev.evento.id} value={ev.evento.id}>
                            {ev.evento.nombre}
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


        </div>
    );
}

export default PanelEventos;
