import { useEffect, useState } from "react";
import {setConfiguracion, setCoordenadas} from "../../../../Store/Configuracion/ConfigAnimacionSlice";
import {useDispatch, useSelector} from "react-redux";

function ConfigGeneral(props) {
    const [ejex, setEjex] = useState(props.gestionLienzo.configuracion_lienzo.x_delta_original);
    const [ejey, setEjey] = useState(props.gestionLienzo.configuracion_lienzo.y_delta_original);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [paintScreen, setPaintScreen] = useState(false);
    const [mostrarImagenes, setMostrarImagenes] = useState(true);

    const dispatch = useDispatch();
    const x_lienzo_dis = useSelector((state) => state.configuracion.x_lienzo);
    const y_lienzo_dis = useSelector((state) => state.configuracion.y_lienzo);
    const mostrar_info_dis = useSelector((state) => state.configuracion.mostrar_info);
    const pintar_animacion_dis = useSelector((state) => state.configuracion.pintar_animacion);
    const mostrar_imagenes_dis = useSelector((state) => state.configuracion.mostrar_imagenes);

    useEffect(() => {
       setEjex(x_lienzo_dis)
    }, [x_lienzo_dis]);

    useEffect(() => {
        setEjey(y_lienzo_dis)
    }, [y_lienzo_dis]);

    useEffect(() => {
        setShowCoordinates(mostrar_info_dis)
    }, [mostrar_info_dis]);

    useEffect(() => {
        setPaintScreen(pintar_animacion_dis)
    }, [pintar_animacion_dis]);

    useEffect(() => {
        setMostrarImagenes(mostrar_imagenes_dis)
    }, [mostrar_imagenes_dis]);

    const editar_config=()=>{
        const datos = {
            x: props.gestionLienzo.configuracion_lienzo.x_delta_original,
            y: props.gestionLienzo.configuracion_lienzo.y_delta_original,
            mostrar_info: props.gestionLienzo.configuracion_lienzo.ver_info_lienzo,
            pintar_animacion : props.gestionLienzo.configuracion_lienzo.pintar_animacion,
            mostrar_imagenes : props.gestionLienzo.configuracion_lienzo.mostrar_imagenes
        }
        dispatch(setConfiguracion(datos));
        //dispatch(setEjex(props.gestionLienzo.configuracion_lienzo.y_delta_original));
    }

    props.gestionLienzo.configuracion_lienzo.funcion_editar_config = editar_config;

    const resetCoordinates = () => {
        setEjex(0);
        setEjey(0);
        props.gestionLienzo.configuracion_lienzo.x_delta_original = 0;
        props.gestionLienzo.configuracion_lienzo.y_delta_original = 0;
    };

    const handleEjexChange = (e) => {
        setEjex(parseFloat(e.target.value));
        props.gestionLienzo.configuracion_lienzo.x_delta_original=parseFloat(e.target.value);
    };

    const handleEjeyChange = (e) => {
        setEjey(parseFloat(e.target.value));
        props.gestionLienzo.configuracion_lienzo.y_delta_original=parseFloat(e.target.value);
    };

    const handleMostrarInfo = (valor)=>{
        setShowCoordinates(valor);
        props.gestionLienzo.configuracion_lienzo.ver_info_lienzo = valor;
    }

    const handlePintar= (valor)=>{
        setPaintScreen(valor);
        props.gestionLienzo.configuracion_lienzo.pintar_animacion = valor;
    }

    const handleMostrarImagenes= (valor)=>{
        setMostrarImagenes(valor);
        props.gestionLienzo.configuracion_lienzo.mostrar_imagenes = valor;
    }

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
                        onChange={(e) => handleMostrarInfo(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showCoordinates">
                        Mostrar Coordenadas en Pantalla
                    </label>
                </div>

                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="mostrarImagenes"
                        checked={mostrarImagenes}
                        onChange={(e) => handleMostrarImagenes(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="mostrarImagenes">
                        Mostrar Imagenes
                    </label>
                </div>

                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="paintScreen"
                        checked={paintScreen}
                        onChange={(e) => handlePintar(e.target.checked)}
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
        </div>
    );
}

export default ConfigGeneral;
