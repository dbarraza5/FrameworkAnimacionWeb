import {useEffect, useState} from "react";
import ModalMovimiento from "./ModalMovimiento";

function PanelMovimientos(props) {
    const [showModal, setShowModal] = useState(false);
    const [tipoAccion, setTipoAccion] = useState("MRU");

    const [inicioMin, setInicioMin] = useState("00");
    const [inicioSeg, setInicioSeg] = useState("00");
    const [inicioMs, setInicioMs] = useState("000");

    const [finMin, setFinMin] = useState("00");
    const [finSeg, setFinSeg] = useState("00");
    const [finMs, setFinMs] = useState("000");

    const [lista_movimiento, setListaMovimientos] = useState([]);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);


    useEffect(() => {
        console.log("[EVENTO][MOV]");
        console.log(props.evento)

        if(props.evento){
            setListaMovimientos(props.evento.movimientos)
        }
    }, [props.evento]);


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

            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="table">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">nombre</th>
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
                                <td>{mov._id}</td>
                                <td>{mov.tipo}</td>
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
                                                setMovimientoSeleccionado(mov);
                                                setShowModal(true);
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
                                            onClick={() => null}
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
            <ModalMovimiento
                show={showModal}
                onClose={() => setShowModal(false)}
                movimiento={movimientoSeleccionado}
            />
        </div>
    );
}

export default PanelMovimientos;
