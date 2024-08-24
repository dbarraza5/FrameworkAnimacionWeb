import { useEffect, useState } from "react";

function ConfigGeneral(props) {
    const [ejex, setEjex] = useState(props.gestionLienzo.configuracion_lienzo.x_delta_original);
    const [ejey, setEjey] = useState(props.gestionLienzo.configuracion_lienzo.y_delta_original);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [paintScreen, setPaintScreen] = useState(false);

    // Update ejex only if it has actually changed in props
    useEffect(() => {
        if (ejex !== props.gestionLienzo.configuracion_lienzo.x_delta_original) {
            setEjex(props.gestionLienzo.configuracion_lienzo.x_delta_original);
        }
    }, [props.gestionLienzo.configuracion_lienzo.x_delta_original]);

    // Update ejey only if it has actually changed in props
    useEffect(() => {
        if (ejey !== props.gestionLienzo.configuracion_lienzo.y_delta_original) {
            setEjey(props.gestionLienzo.configuracion_lienzo.y_delta_original);
        }
    }, [props.gestionLienzo.configuracion_lienzo.y_delta_original]);

    const resetCoordinates = () => {
        setEjex(0);
        setEjey(0);
        props.gestionLienzo.configuracion_lienzo.x_delta_original = 0;
        props.gestionLienzo.configuracion_lienzo.y_delta_original = 0;
    };

    const handleEjexChange = (e) => {
        setEjex(parseFloat(e.target.value));
    };

    const handleEjeyChange = (e) => {
        setEjey(parseFloat(e.target.value));
    };

    return (
        <div className="container mt-4">
            <form>
                <div className="mb-3">
                    <label htmlFor="ejex" className="form-label">Eje X</label>
                    <input
                        type="number"
                        className="form-control"
                        id="ejex"
                        value={ejex}
                        onChange={handleEjexChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="ejey" className="form-label">Eje Y</label>
                    <input
                        type="number"
                        className="form-control"
                        id="ejey"
                        value={ejey}
                        onChange={handleEjeyChange}
                    />
                </div>
                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="showCoordinates"
                        checked={showCoordinates}
                        onChange={(e) => setShowCoordinates(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showCoordinates">
                        Mostrar Coordenadas en Pantalla
                    </label>
                </div>
                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="paintScreen"
                        checked={paintScreen}
                        onChange={(e) => setPaintScreen(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="paintScreen">
                        Pintar la Pantalla
                    </label>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={resetCoordinates}
                >
                    Reset
                </button>
            </form>

            {showCoordinates && (
                <div className="mt-4">
                    <p>Coordenadas:</p>
                    <p>Eje X: {ejex}</p>
                    <p>Eje Y: {ejey}</p>
                </div>
            )}

            {paintScreen && (
                <div className="mt-4" style={{ width: '100%', height: '100px', backgroundColor: 'lightblue' }}>
                    <p className="text-center">Pantalla Pintada</p>
                </div>
            )}
        </div>
    );
}

export default ConfigGeneral;
