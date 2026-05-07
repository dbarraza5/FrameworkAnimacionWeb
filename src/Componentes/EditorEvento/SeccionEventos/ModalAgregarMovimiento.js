import React, { useEffect, useState } from "react";
import FormularioMRU from "./Movimientos/FormularioMRU";
import FormularioMRUA from "./Movimientos/FormularioMRUA";
import FormularioParabolico from "./Movimientos/FormularioParabolico";
import FormularioCircular from "./Movimientos/FormularioCircular";
import {nanoid} from "nanoid";
import FormularioMRU2D from "./Movimientos/FormularioMRU2D";
import FormularioOscilatorio from "./Movimientos/FormularioOscilatorio";
import FormularioLerp from "./Movimientos/FormularioLerp";
import FormularioGravedad from "./Movimientos/FormularioGravedad";
import {
    MOV_CIRCULAR, MOV_GRAVEDAD, MOV_LERP, MOV_OSCILATORIO, MOV_PARABOLICO_ANGULO,
    MOV_RECTILINEO_2D,
    MOV_RECTILINEO_ACELERADO,
    MOV_RECTILINEO_UNIFORME, MOV_ROTACION, MOV_ZOOM, MOVIMIENTOS_FIGURAS, MOVIMIENTOS_OBJETOS
} from "../../../Clases/EditorEvento/ConstanteEvento";
import FormularioRotacion from "./Movimientos/FormularioRotacion";
import FormularioZoom from "./Movimientos/FormularioZoom";

function msToTimeParts(ms) {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    const miliseg = ms % 1000;
    return {
        min: minutos.toString().padStart(2, '0'),
        seg: segundos.toString().padStart(2, '0'),
        ms: miliseg.toString().padStart(3, '0'),
    };
}

function timePartsToMs(min, seg, ms) {
    return parseInt(min || 0) * 60000 + parseInt(seg || 0) * 1000 + parseInt(ms || 0);
}

function ModalAgregarMovimiento({ show, onClose, agregarMovimiento }) {
    const [tipo, setTipo] = useState(1);
    const [tipoEfecto, setTipoEfecto] = useState(1);
    const [inicioMin, setInicioMin] = useState('00');
    const [inicioSeg, setInicioSeg] = useState('00');
    const [inicioMs, setInicioMs] = useState('000');

    const [finMin, setFinMin] = useState('00');
    const [finSeg, setFinSeg] = useState('00');
    const [finMs, setFinMs] = useState('000');

    const [tiempoBucle, setTiempoBucle] = useState(0);
    const [bucle, setBucle] = useState(false);
    const [activo, setActivo] = useState(false);
    const [datos, setDatos] = useState({});


    if (!show) return null;

    const guardar = () => {
        const tiempo_inicio = timePartsToMs(inicioMin, inicioSeg, inicioMs);
        const tiempo_final = timePartsToMs(finMin, finSeg, finMs);

        const nuevoMovimiento = {
            //_id: nanoid(8),
            tipo:tipo,
            tipo_efecto:tipoEfecto,
            tiempo_inicio:tiempo_inicio,
            tiempo_final:tiempo_final,
            tiempo_bucle: tiempoBucle,
            bucle:bucle,
            activo:activo,
            datos:datos,
            ids_grupos:[]
        };

        agregarMovimiento(nuevoMovimiento);
        onClose();
    };

    function RenderFormulario({ tipo, datos, setDatos }) {
        switch (tipo) {
            case 1: return <FormularioMRU datos={datos} setDatos={setDatos} />;
            case 2: return <FormularioMRUA datos={datos} setDatos={setDatos} />;
            case 3: return <FormularioMRU2D datos={datos} setDatos={setDatos} />;
            case 4: return <FormularioCircular datos={datos} setDatos={setDatos} />;
            case 5: return <FormularioOscilatorio datos={datos} setDatos={setDatos} />;
            case 6: return <FormularioLerp datos={datos} setDatos={setDatos} />;
            case 7: return <FormularioGravedad datos={datos} setDatos={setDatos} />;
            case 8: return <FormularioParabolico datos={datos} setDatos={setDatos} />;
            default: return null;
        }
    }

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
                        <h5 className="modal-title">Agregar nuevo movimiento</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Tipo Efecto</label>
                            <select
                                className="form-select"
                                value={tipoEfecto}
                                onChange={(e) => setTipoEfecto(parseInt(e.target.value))}
                            >
                                <option value={1}>Objeto</option>
                                <option value={2}>Figuras</option>
                            </select>
                        </div>
                        {/* Tipo */}
                        <div className="mb-3">
                            <label className="form-label">Tipo</label>
                            <select
                                className="form-select"
                                value={tipo}
                                onChange={(e) => setTipo(parseInt(e.target.value))}
                            >
                                {tipoEfecto === 1 && (
                                    Object.entries(MOVIMIENTOS_OBJETOS).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ))
                                )}
                                {tipoEfecto === 2 && (
                                    Object.entries(MOVIMIENTOS_FIGURAS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>



                        {/* Tiempo de inicio */}
                        <div className="mb-3">
                            <label className="form-label">Tiempo de inicio</label>
                            <div className="d-flex gap-2">
                                <input type="text" className="form-control" placeholder="mm" value={inicioMin} onChange={(e) => setInicioMin(e.target.value)} />
                                <span>:</span>
                                <input type="text" className="form-control" placeholder="ss" value={inicioSeg} onChange={(e) => setInicioSeg(e.target.value)} />
                                <span>:</span>
                                <input type="text" className="form-control" placeholder="ms" value={inicioMs} onChange={(e) => setInicioMs(e.target.value)} />
                            </div>
                        </div>

                        {/* Tiempo de fin */}
                        <div className="mb-3">
                            <label className="form-label">Tiempo final</label>
                            <div className="d-flex gap-2">
                                <input type="text" className="form-control" placeholder="mm" value={finMin} onChange={(e) => setFinMin(e.target.value)} />
                                <span>:</span>
                                <input type="text" className="form-control" placeholder="ss" value={finSeg} onChange={(e) => setFinSeg(e.target.value)} />
                                <span>:</span>
                                <input type="text" className="form-control" placeholder="ms" value={finMs} onChange={(e) => setFinMs(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label">Tiempo bucle(ms)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={tiempoBucle}
                                onChange={(e) => setTiempoBucle(e.target.value)}
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="bucleCheck" checked={bucle} onChange={() => setBucle(!bucle)} />
                            <label className="form-check-label" htmlFor="bucleCheck">Bucle</label>
                        </div>

                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="activoCheck" checked={activo} onChange={() => setActivo(!activo)} />
                            <label className="form-check-label" htmlFor="activoCheck">Activo</label>
                        </div>

                        <hr />
                        {/* Formulario dinámico renderizado directamente */}
                        {tipo === MOV_RECTILINEO_UNIFORME && <FormularioMRU datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_RECTILINEO_ACELERADO && <FormularioMRUA datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_RECTILINEO_2D && <FormularioMRU2D datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_CIRCULAR && <FormularioCircular datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_OSCILATORIO && <FormularioOscilatorio datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_LERP && <FormularioLerp datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_GRAVEDAD && <FormularioGravedad datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_PARABOLICO_ANGULO && <FormularioParabolico datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_ROTACION && <FormularioRotacion datos={datos} setDatos={setDatos} />}
                        {tipo === MOV_ZOOM && <FormularioZoom datos={datos} setDatos={setDatos} />}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardar}>Agregar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalAgregarMovimiento;
