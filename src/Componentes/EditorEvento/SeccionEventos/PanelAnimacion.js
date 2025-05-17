import { useState } from "react";

function PanelAnimacion(props) {
    const [eventoSeleccionado, setEventoSeleccionado] = useState("");

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
