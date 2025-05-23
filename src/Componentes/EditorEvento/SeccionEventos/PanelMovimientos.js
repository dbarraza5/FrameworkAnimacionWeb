import {useEffect, useState} from "react";

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
                                        onChange={(e) => console.log("asdsda das")}
                                    />
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm" role="group" aria-label="Basic outlined example">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={() => null}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-primary">
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


            {/* Modal vacío (placeholder) */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Lista de movimientos</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Select tipo acción */}
                                <div className="mb-3">
                                    <label className="form-label">Tipo de acción</label>
                                    <select
                                        className="form-select"
                                        value={tipoAccion}
                                        onChange={(e) => null}
                                    >
                                        <option value="MRU">MRU</option>
                                        <option value="MRUA">MRUA</option>
                                        <option value="Trayectoria Parabólica">Trayectoria Parabólica</option>
                                    </select>
                                </div>

                                {/* Tiempo de inicio */}
                                <div className="mb-3">
                                    <label className="form-label">Tiempo de inicio</label>
                                    <div className="d-flex gap-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="mm"
                                            value={inicioMin}
                                            onChange={(e) => null}
                                        />
                                        <span>:</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="ss"
                                            value={inicioSeg}
                                            onChange={(e) => null}
                                        />
                                        <span>:</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="ms"
                                            value={inicioMs}
                                            onChange={(e) => null}
                                        />
                                    </div>
                                </div>

                                {/* Tiempo de fin */}
                                <div className="mb-3">
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
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PanelMovimientos;
