import { useState } from "react";

function PanelScripts() {
    const [showModal, setShowModal] = useState(false);

    const lista_movimiento = [
        {
            nombre:'mov1',
        }
    ];

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
                        <th scope="col">activo</th>
                        <th scope="col">operaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lista_movimiento.map((mov, index) => {
                        return (
                            <tr key={index}>
                                <th scope="row">{index + 1}</th>
                                <td>{mov.nombre}</td>
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
                                <h5 className="modal-title">Script</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">

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

export default PanelScripts;
