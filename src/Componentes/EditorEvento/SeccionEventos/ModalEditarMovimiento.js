import React, { useEffect, useState } from "react";
import FormularioMRU from "./Movimientos/FormularioMRU";
import FormularioMRUA from "./Movimientos/FormularioMRUA";
import FormularioParabolico from "./Movimientos/FormularioParabolico";
import FormularioCircular from "./Movimientos/FormularioCircular";
import FormularioMRU2D from "./Movimientos/FormularioMRU2D";
import FormularioOscilatorio from "./Movimientos/FormularioOscilatorio";
import FormularioLerp from "./Movimientos/FormularioLerp";
import FormularioGravedad from "./Movimientos/FormularioGravedad";

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

function ModalEditarMovimiento({ show, onClose, movimiento, setMovimientoSeleccionado }) {

    const inicio = msToTimeParts(movimiento?.tiempo_inicio || 0);
    const fin = msToTimeParts(movimiento?.tiempo_final || 0);

    const [tipo, setTipo] = useState(movimiento?.tipo || 1);
    const [inicioMin, setInicioMin] = useState(inicio?.min||'00');
    const [inicioSeg, setInicioSeg] = useState(inicio?.seg||'00');
    const [inicioMs, setInicioMs] = useState(inicio?.ms||'00');

    const [finMin, setFinMin] = useState(fin?.min||'00');
    const [finSeg, setFinSeg] = useState(fin?.seg||'00');
    const [finMs, setFinMs] = useState(fin?.ms||'00');
    const [tiempoBucle, setTiempoBucle] = useState(movimiento?.tiempo_bucle || 0);
    const [bucle, setBucle] = useState(movimiento?.bucle || false);
    const [activo, setActivo] = useState(movimiento?.activo || false);


    const [datos, setDatos] = useState(movimiento?.datos || {});

    const MOVIMIENTOS = {
        1: "Movimiento Rectilíneo Uniforme (MRU)",
        2: "Movimiento Rectilíneo Acelerado (MRUA)",
        3: "Movimiento Rectilíneo 2D",
        4: "Movimiento Circular",
        5: "Movimiento Oscilatorio",
        6: "Interpolación Lineal (LERP)",
        7: "Gravedad",
        8: "Parabólico con Ángulo"
    };

    useEffect(() => {
        // const tiempo_inicio = timePartsToMs(inicioMin, inicioSeg, inicioMs);
        // const tiempo_final = timePartsToMs(finMin, finSeg, finMs);
        // if(movimiento){
        //     movimiento.tipo = tipo;
        //     movimiento.tiempo_inicio = tiempo_inicio;
        //     movimiento.tiempo_final = tiempo_final;
        //     movimiento.bucle = bucle;
        //     movimiento.activo = activo;
        //     movimiento.datos = datos;
        //     // setMovimientoSeleccionado({
        //     //     ...movimiento
        //     // });
        // }

    }, [tipo, inicioMin, inicioSeg, inicioMs,
        finMin, finSeg, finMs, bucle,
        activo, datos]);

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

    if (!show) return null;

    const guardar = () => {
        const tiempo_inicio = timePartsToMs(inicioMin, inicioSeg, inicioMs);
        const tiempo_final = timePartsToMs(finMin, finSeg, finMs);

        const actualizado = {
            ...movimiento,
            tipo,
            tiempo_inicio,
            tiempo_final,
            bucle,
            activo,
            datos: {
                ...movimiento.datos,
            }
        };

        if(movimiento){
            movimiento.tipo = tipo;
            movimiento.tiempo_inicio = tiempo_inicio;
            movimiento.tiempo_final = tiempo_final;
            movimiento.tiempo_bucle = tiempoBucle;
            movimiento.bucle = bucle;
            movimiento.activo = activo;
            movimiento.datos = datos;
            setMovimientoSeleccionado({
                ...movimiento
            });
        }

        //console.log("Movimiento actualizado:", actualizado);
        onClose(); // podrías pasar `actualizado` al padre si quieres emitirlo
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
                        <h5 className="modal-title">Editar movimiento</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Tipo */}
                        <div className="mb-3">
                            <label className="form-label">Tipo</label>
                            <select
                                className="form-select"
                                value={tipo}
                                onChange={(e) => setTipo(parseInt(e.target.value))}
                            >
                                {Object.entries(MOVIMIENTOS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
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
                                placeholder="Ej: +500ms o -1s"
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="bucleCheck2" name="bucleCheck2"
                                   checked={bucle} onChange={() => setBucle(!bucle)} />
                            <label className="form-check-label" htmlFor="bucleCheck2">Bucle</label>
                        </div>

                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="activoCheck" name="activoCheck"
                                   checked={activo} onChange={() => setActivo(!activo)} />
                            <label className="form-check-label" htmlFor="activoCheck">Activo</label>
                        </div>

                        <hr/>
                        {/* Formulario dinámico según tipo */}
                        <RenderFormulario
                            tipo={tipo}
                            datos={datos}
                            setDatos={setDatos}
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                        <button className="btn btn-primary" onClick={guardar}>Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalEditarMovimiento;
