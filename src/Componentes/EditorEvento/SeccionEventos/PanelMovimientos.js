import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import ModalEditarMovimiento from "./ModalEditarMovimiento";
import ModalAgregarMovimiento from "./ModalAgregarMovimiento";
import ModalCopiarMovimiento from "./ModalCopiarMovimiento";
import {
    MOVIMIENTOS_FIGURAS_CORTOS,
    MOVIMIENTOS_OBJETOS_CORTOS, TIPO_EFECTO_MOV_FIGURAS,
    TIPO_EFECTO_MOV_OBJETOS, TRABAJO_EDICION_MOVIMIENTO
} from "../../../Clases/EditorEvento/ConstanteEvento";
import {
    setIdGrupoSeleccionado,
    setIndexMovSeleccionado,
    setTipoTrabajo
} from "../../../Store/Configuracion/ConfigEventoSlice";
import SeleccionGrupoArbol from "./SeleccionGrupoArbol";

function PanelMovimientos(props) {
    const [showModalEditar, setShowEditarModal] = useState(false);
    const [showModalAgregar, setShowAgregarModal] = useState(false);
    const [showModalCopiar, setShowCopiarModal] = useState(false);

    const [lista_movimiento, setListaMovimientos] = useState([]);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [movIndexSeleccionado, setmovIndexSeleccionado] = useState(null);
    const [versionKey, setVerionKey] = useState(0);

    const id_grupo_seleccionado = useSelector(state => state.config_evento.id_grupo_seleccionado);

    const [grupos, setGrupos] = useState([]);

    const dispatch = useDispatch();

    const seleccionarMov=(index)=>{
        const mov_ = lista_movimiento[index];
        setMovimientoSeleccionado(mov_);
        setmovIndexSeleccionado(index);
        dispatch(setIndexMovSeleccionado(index))
        dispatch(setTipoTrabajo(TRABAJO_EDICION_MOVIMIENTO))
    };


    const agregarMovimientosAlGrupo=(movimientosNuevos)=>{
        const nuevosObjetos = [...props.evento.objetos];
        let indiceObjeto = nuevosObjetos.findIndex(obj => obj.id_objeto === id_grupo_seleccionado);

        if (indiceObjeto !== -1) {
            nuevosObjetos[indiceObjeto] = {
                ...nuevosObjetos[indiceObjeto],
                movimientos: [...nuevosObjetos[indiceObjeto].movimientos, ...movimientosNuevos]
            };
        } else {
            const nuevoObjeto = {
                tipo: 1,
                id_objeto: id_grupo_seleccionado,
                x_inicial: 0,
                y_inicial: 0,
                movimientos: movimientosNuevos,
                operaciones: [],
            };
            nuevosObjetos.push(nuevoObjeto);
            indiceObjeto = nuevosObjetos.length-1;
            setmovIndexSeleccionado(0)
        }

        const eventoActualizado = {
            ...props.evento,
            objetos: nuevosObjetos
        };

        props.editandoMovEvento(eventoActualizado);
        setListaMovimientos(nuevosObjetos[indiceObjeto].movimientos);
    }

    const agregarMovimiento=(mov_)=>{
        console.log("[agregarMovimiento]")
        console.log(mov_);
        agregarMovimientosAlGrupo([mov_]);
    }

    const aplicarCopiaMovimientos=(movimientosCopiados)=>{
        console.log("[aplicarCopiaMovimientos]")
        console.log(movimientosCopiados);
        agregarMovimientosAlGrupo(movimientosCopiados);
    }

    const eliminarMovimiento=(indice)=>{
        let indiceObjeto = props.evento.objetos.findIndex(obj => obj.id_objeto === id_grupo_seleccionado);
        if (indiceObjeto !== -1){
            props.evento.objetos[indiceObjeto].movimientos = props.evento.objetos[indiceObjeto].movimientos.filter((mov, index)=>{
                return index !== indice;
            });
            props.editandoMovEvento(props.evento)
            setListaMovimientos(props.evento.objetos[indiceObjeto].movimientos)

            // Si eliminamos el movimiento que estaba seleccionado, limpiamos la selección
            if (movIndexSeleccionado === indice) {
                setMovimientoSeleccionado(null);
                setmovIndexSeleccionado(null);
            }
        }
    }

    useEffect(() => {
        console.log("[EVENTO][MOV]");
        console.log(props.evento)
    }, [props.evento]);

    useEffect(() => {
        console.log("[PANEL DE MOVIEMIENTO]: ", id_grupo_seleccionado);
        if(props.evento){
            const objeto_ = props.evento.objetos.filter((obj)=>{
                return obj.id_objeto===id_grupo_seleccionado
            })
            if(objeto_.length>0){
                setListaMovimientos(objeto_[0]['movimientos'])
                return;
            }
        }
        setListaMovimientos([])
        setMovimientoSeleccionado(null);
        setmovIndexSeleccionado(null);
        setGrupos(props.eventoAnimacion.edicion.gestion_grupos_originales.grupos_figuras);

    }, [id_grupo_seleccionado]);


    useEffect(() => {
        console.log("[CAMBIO][VERSION]="+props.eventoAnimacion.edicion.version);
        setVerionKey(props.eventoAnimacion.edicion.version);
    }, [props.eventoAnimacion.edicion.version]);


    useEffect(() => {
        console.log("[***Cambio de MOVIMIENTO***]="+movIndexSeleccionado);
        if(movimientoSeleccionado !== null && movIndexSeleccionado !== null){
            if(props.evento){
                for(let i=0; i<props.evento.objetos.length; i++){
                    if(props.evento.objetos[i].id_objeto === id_grupo_seleccionado){
                        props.evento.objetos[i].movimientos[movIndexSeleccionado] = movimientoSeleccionado;
                        break;
                    }
                }
                props.editandoMovEvento(props.evento)
            }
        }
    }, [movimientoSeleccionado]);

    const seleccion_grupo = (nombre)=>{
        console.log(nombre)
        dispatch(setIdGrupoSeleccionado(nombre))
    }

    return (
        <div>
            {/* Aquí insertas el nuevo componente ajustado */}
            <SeleccionGrupoArbol
                datosFiguras={grupos}
                id_grupo_seleccionado={id_grupo_seleccionado}
                alSeleccionarGrupo={seleccion_grupo} // Tu función de estado aquí
            />
            {/* Header con título y botón agregar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-semibold text-secondary">
                    <i className="bi bi-collection me-2"></i>
                    {id_grupo_seleccionado ? id_grupo_seleccionado : "Sin grupo seleccionado"}
                </h6>
                {(id_grupo_seleccionado)&&(
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowCopiarModal(true)}
                        >
                            <i className="bi bi-copy me-1"></i>
                            Copiar
                        </button>
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => setShowAgregarModal(true)}
                        >
                            <i className="bi bi-plus-lg me-1"></i>
                            Agregar
                        </button>
                    </div>
                )}
            </div>

            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="table table-hover table-sm align-middle">
                    <thead className="table-light sticky-top">
                    <tr>
                        <th scope="col" style={{ width: '40px' }} className="text-center">Sel.</th>
                        <th scope="col" style={{ width: '40px' }}>#</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Efecto</th>
                        <th scope="col" className="text-center" style={{ width: '70px' }}>Activo</th>
                        <th scope="col" className="text-center" style={{ width: '120px' }}>Operaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lista_movimiento.map((mov, index) => {
                        const estaSeleccionado = movIndexSeleccionado === index;
                        return (
                            <tr
                                key={index}
                                onClick={() => seleccionarMov(index)}
                                className={estaSeleccionado ? "table-primary" : ""}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Columna del Radio Button */}
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="movimientoSeleccionadoRadio"
                                        checked={estaSeleccionado}
                                        onChange={() => seleccionarMov(index)}
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

                                {/* Detener propagación para que el click no altere la selección de fila */}
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`flexCheckDefault-${index}`}
                                        checked={mov.activo}
                                        onChange={(e) => {
                                            // Aquí maneja tu lógica del checkbox activo
                                            console.log("Cambio activo", e.target.checked);
                                        }}
                                    />
                                </td>
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            title="Editar"
                                            onClick={() => {
                                                seleccionarMov(index);
                                                setShowEditarModal(true);
                                            }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            title="Duplicar"
                                        >
                                            <i className="bi bi-files"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger"
                                            title="Eliminar"
                                            onClick={() => eliminarMovimiento(index)}
                                        >
                                            <i className="bi bi-trash"></i>
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
                agregarMovimiento={agregarMovimiento}
            />
            <ModalCopiarMovimiento
                key={`modal-copiar-movimiento`}
                show={showModalCopiar}
                onClose={() => setShowCopiarModal(false)}
                evento={props.evento}
                grupos={props.eventoAnimacion.edicion.gestion_grupos_originales.grupos_figuras}
                aplicarCopia={aplicarCopiaMovimientos}
            />
        </div>
    );
}

export default PanelMovimientos;