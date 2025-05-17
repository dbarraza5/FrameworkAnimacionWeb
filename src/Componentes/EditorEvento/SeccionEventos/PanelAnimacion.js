import {useRef, useState} from "react";


function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}

function PanelAnimacion(props) {
    const [eventoSeleccionado, setEventoSeleccionado] = useState("");
    const [milisegundos, setMilisegundos] = useState(0);
    const intervalRef = useRef(null);

    const STEP = 100;
    const MAX = 60000;
    const MIN = 0;

    const handleSeleccion = (e) => {
        setEventoSeleccionado(e.target.value);
    };

    const handleReproducir = () => {
        if (props.onReproducir) props.onReproducir(eventoSeleccionado);
    };

    const handleDetener = () => {
        if (props.onDetener) props.onDetener();
    };

    const handleResetear = () => {
        setEventoSeleccionado("");
        if (props.onResetear) props.onResetear();
    };

    const startChangingTime = (type) => {
        stopChangingTime();
        intervalRef.current = setInterval(() => {
            setMilisegundos((prev) => {
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

    return (
        <div>
            <div className="mb-2">
                <label className="form-label">Evento</label>
                <select
                    className="form-select"
                    value={eventoSeleccionado}
                    onChange={handleSeleccion}
                >
                    <option value="">Seleccionar evento</option>
                    {/*{props.eventos.map((ev) => (*/}
                    {/*    <option key={ev.id} value={ev.id}>*/}
                    {/*        {ev.nombre}*/}
                    {/*    </option>*/}
                    {/*))}*/}
                </select>
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

            <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                    className="btn btn-primary"
                    onClick={handleReproducir}
                    disabled={!eventoSeleccionado}
                >
                    Reproducir
                </button>
                <button className="btn btn-warning" onClick={handleDetener}>
                    Detener
                </button>
                <button className="btn btn-secondary" onClick={handleResetear}>
                    Resetear
                </button>
            </div>
        </div>
    );
}

export default PanelAnimacion;
