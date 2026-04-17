import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import ModalEditarMovimiento from "./ModalEditarMovimiento";
import ModalAgregarMovimiento from "./ModalAgregarMovimiento";

function PanelMovimientos(props) {
    const [showModalEditar, setShowEditarModal] = useState(false);
    const [showModalAgregar, setShowAgregarModal] = useState(false);
    const [tipoAccion, setTipoAccion] = useState("MRU");

    const [inicioMin, setInicioMin] = useState("00");
    const [inicioSeg, setInicioSeg] = useState("00");
    const [inicioMs, setInicioMs] = useState("000");

    const [finMin, setFinMin] = useState("00");
    const [finSeg, setFinSeg] = useState("00");
    const [finMs, setFinMs] = useState("000");

    const [lista_movimiento, setListaMovimientos] = useState([]);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [movIndexSeleccionado, setmovIndexSeleccionado] = useState(null);
    const [versionKey, setVerionKey] = useState(0);

    const id_grupo_seleccionado = useSelector(state => state.config_evento.id_grupo_seleccionado);

    const seleccionarMov=(index)=>{
        setMovimientoSeleccionado(props.evento.movimientos[index]);
        setmovIndexSeleccionado(index);
    };

    const tipos_movimientos = {
        1: "MRU",
        2: "MRUA",
        3: "Parabolico",
        4: "Circular"
    };

    const agregarMovimiento=(evento)=>{
        console.log(evento);
        //props.evento.movimientos[movIndexSeleccionado]  = movimientoSeleccionado;
        props.evento.movimientos.push(evento);
        props.editandoMovEvento(props.evento.movimientos)
    }

    const eliminarMovimiento=(indice)=>{
        props.evento.movimientos = props.evento.movimientos.filter((mov, index)=>{
           return index !== indice;
        });
        props.editandoMovEvento(props.evento.movimientos)
        setListaMovimientos(props.evento.movimientos)
    }

    useEffect(() => {
        console.log("[EVENTO][MOV]");
        console.log(props.evento)

        if(props.evento){
            setListaMovimientos(props.evento.movimientos)
        }
    }, [props.evento]);


    useEffect(() => {
        console.log("[CAMBIO][VERSION]="+props.eventoAnimacion.edicion.version);
        setVerionKey(props.eventoAnimacion.edicion.version);

    }, [props.eventoAnimacion.edicion.version]);


    useEffect(() => {
        console.log("[***Cambio de MOVIMIENTO***]="+movIndexSeleccionado);
        if(movimientoSeleccionado !== null){
            console.log(movimientoSeleccionado);
            props.evento.movimientos[movIndexSeleccionado]  = movimientoSeleccionado;
            props.editandoMovEvento(props.evento.movimientos)
        }
    }, [movimientoSeleccionado]);


    return (
        <div>
            {/* Botones */}
            <div className="mb-2 d-flex gap-2 align-items-center">
                <span>{id_grupo_seleccionado}</span>
                <button className="btn btn-outline-success" onClick={() => setShowAgregarModal(true)}>
                    <i className="bi bi-plus"></i>
                </button>
            </div>

            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="table">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">tipo</th>
                        <th scope="col">activo</th>
                        <th scope="col">operaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lista_movimiento.map((mov, index) => {
                        return (
                            <tr key={index}>
                                <th scope="row">{index + 1}</th>
                                <td>{tipos_movimientos[mov.tipo]}</td>
                                <td>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`flexCheckDefault-${index}`}
                                        checked={mov.activo}
                                        onChange={(e) => console.log("asdsda das")}
                                    />
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm" role="group" aria-label="Basic outlined example">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={() => {
                                                seleccionarMov(index);
                                                setShowEditarModal(true);
                                            }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-primary"
                                        >
                                            <i className="bi bi-files"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={() => eliminarMovimiento(index)}
                                        >
                                            <i className="bi bi-eraser"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            {movimientoSeleccionado && (
                <ModalEditarMovimiento
                    key={`modal-movimiento-${movIndexSeleccionado}-${versionKey}`}
                    show={showModalEditar}
                    onClose={() => setShowEditarModal(false)}
                    movimiento={movimientoSeleccionado}
                    setMovimientoSeleccionado={setMovimientoSeleccionado}
                />
            )}

            <ModalAgregarMovimiento
                key={`modal-agregar-movimiento`}
                show={showModalAgregar}
                onClose={() => setShowAgregarModal(false)}
                // movimiento={movimientoSeleccionado}
                agregarMovimiento={agregarMovimiento}
            />
        </div>
    );
}

export default PanelMovimientos;
