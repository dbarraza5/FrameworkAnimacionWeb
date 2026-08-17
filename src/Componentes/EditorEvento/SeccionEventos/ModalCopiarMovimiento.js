import React, { useEffect, useState } from "react";
import SeleccionGrupoArbol from "./SeleccionGrupoArbol";
import {
    MOVIMIENTOS_FIGURAS_CORTOS,
    MOVIMIENTOS_OBJETOS_CORTOS,
    TIPO_EFECTO_MOV_FIGURAS,
    TIPO_EFECTO_MOV_OBJETOS
} from "../../../Clases/EditorEvento/ConstanteEvento";

function ModalCopiarMovimiento({ show, onClose, evento, grupos, aplicarCopia }) {
    const [grupoOrigen, setGrupoOrigen] = useState(null);
    const [movimientosOrigen, setMovimientosOrigen] = useState([]);
    const [seleccionados, setSeleccionados] = useState(new Set());

    useEffect(() => {
        if (!show) {
            setGrupoOrigen(null);
            setMovimientosOrigen([]);
            setSeleccionados(new Set());
        }
    }, [show]);

    useEffect(() => {
        if (grupoOrigen && evento) {
            const objeto_ = evento.objetos.find(obj => obj.id_objeto === grupoOrigen);
            setMovimientosOrigen(objeto_ ? objeto_.movimientos : []);
        } else {
            setMovimientosOrigen([]);
        }
        setSeleccionados(new Set());
    }, [grupoOrigen, evento]);

    if (!show) return null;

    const toggleSeleccionado = (index) => {
        const nuevos = new Set(seleccionados);
        if (nuevos.has(index)) {
            nuevos.delete(index);
        } else {
            nuevos.add(index);
        }
        setSeleccionados(nuevos);
    };

    const aplicar = () => {
        const movimientosCopiados = movimientosOrigen
            .filter((mov, index) => seleccionados.has(index))
            .map((mov) => ({ ...mov }));

        if (movimientosCopiados.length > 0) {
            aplicarCopia(movimientosCopiados);
        }
        onClose();
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Copiar movimiento de otro grupo</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Grupo origen</label>
                            <SeleccionGrupoArbol
                                datosFiguras={grupos}
                                id_grupo_seleccionado={grupoOrigen}
                                alSeleccionarGrupo={setGrupoOrigen}
                            />
                        </div>

                        {grupoOrigen && (
                            movimientosOrigen.length === 0 ? (
                                <small className="text-muted">Este grupo no tiene movimientos.</small>
                            ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table className="table table-hover table-sm align-middle">
                                        <thead className="table-light sticky-top">
                                        <tr>
                                            <th scope="col" style={{ width: '40px' }} className="text-center">Sel.</th>
                                            <th scope="col" style={{ width: '40px' }}>#</th>
                                            <th scope="col">Tipo</th>
                                            <th scope="col">Efecto</th>
                                            <th scope="col" className="text-center" style={{ width: '70px' }}>Activo</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {movimientosOrigen.map((mov, index) => {
                                            const estaSeleccionado = seleccionados.has(index);
                                            return (
                                                <tr
                                                    key={index}
                                                    onClick={() => toggleSeleccionado(index)}
                                                    className={estaSeleccionado ? "table-primary" : ""}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={estaSeleccionado}
                                                            onChange={() => toggleSeleccionado(index)}
                                                        />
                                                    </td>
                                                    <th scope="row" className="text-muted">{index + 1}</th>
                                                    <td>
                                                        {mov.tipo_efecto === TIPO_EFECTO_MOV_OBJETOS && MOVIMIENTOS_OBJETOS_CORTOS[mov.tipo]}
                                                        {mov.tipo_efecto === TIPO_EFECTO_MOV_FIGURAS && MOVIMIENTOS_FIGURAS_CORTOS[mov.tipo]}
                                                    </td>
                                                    <td>
                                                        {mov.tipo_efecto === TIPO_EFECTO_MOV_OBJETOS ? "Obj" : "Fig"}
                                                    </td>
                                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={mov.activo}
                                                            disabled
                                                            readOnly
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button
                            className="btn btn-primary"
                            onClick={aplicar}
                            disabled={seleccionados.size === 0}
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalCopiarMovimiento;
