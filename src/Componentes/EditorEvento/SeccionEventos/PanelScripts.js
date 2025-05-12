import { useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEffect, useRef } from "react";

function PanelScripts() {
    const [showModal, setShowModal] = useState(false);
    const [codigoJS, setCodigoJS] = useState(`funcion = (tiempo, movimientos, grupos) => {
  // tu código aquí
}`);
    const editorRef = useRef(null);

    const [nombreScript, setNombreScript] = useState("");

    const lista_movimiento = [
        { nombre: 'mov1' }
    ];

    useEffect(() => {
        if (showModal && editorRef.current) {
            const state = EditorState.create({
                doc: codigoJS,
                extensions: [
                    javascript(),
                    oneDark,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            const newCode = update.state.doc.toString();
                            setCodigoJS(newCode);
                        }
                    })
                ]
            });

            const view = new EditorView({
                state,
                parent: editorRef.current
            });

            return () => view.destroy(); // Limpieza al cerrar modal
        }
    }, [showModal]);

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
                        <th>#</th>
                        <th>nombre</th>
                        <th>activo</th>
                        <th>operaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lista_movimiento.map((mov, index) => (
                        <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{mov.nombre}</td>
                            <td>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`flexCheckDefault-${index}`}
                                    onChange={() => console.log("checkbox toggled")}
                                />
                            </td>
                            <td>
                                <div className="btn-group btn-group-sm" role="group">
                                    <button className="btn btn-outline-primary">
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-outline-primary">
                                        <i className="bi bi-files"></i>
                                    </button>
                                    <button className="btn btn-outline-primary">
                                        <i className="bi bi-eraser"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Modal con CodeMirror */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Script JS</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Nombre del script</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={nombreScript}
                                        onChange={(e) => setNombreScript(e.target.value)}
                                        placeholder="Ej: movimientoHorizontal"
                                    />
                                </div>

                                <div
                                    ref={editorRef}
                                    style={{
                                        border: "1px solid #ccc",
                                        height: "300px",
                                        overflow: "auto",
                                        fontSize: "14px"
                                    }}
                                />

                                <div className="mt-3 d-flex gap-2">
                                    <button className="btn btn-primary" onClick={() => eval(codigoJS)}>
                                        Ejecutar
                                    </button>
                                    <button className="btn btn-success" onClick={() => {
                                        console.log("Script guardado:", nombreScript);
                                        console.log("Código JS:", codigoJS);
                                        // Aquí podrías agregar la lógica para guardar el script en tu backend o estado
                                        setShowModal(false);
                                    }}>
                                        Aceptar
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
