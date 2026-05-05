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
    const [objeto, setObjeto] = useState(null);

    const seleccionarMov=(index)=>{
        const mov_ = lista_movimiento[index];
        setMovimientoSeleccionado(mov_);//(props.evento.movimientos[index]);
        setmovIndexSeleccionado(index);
    };

    const tipos_movimientos = {
        1: "MRU",
        2: "MRUA",
        3: "MRU 2D",
        4: "Circular",
        5: "Oscil.",
        6: "LERP",
        7: "Grav.",
        8: "Parab."
    };

    const agregarMovimiento=(mov_)=>{
        console.log("[agregarMovimiento]")
        console.log(mov_);
        // 1. Creamos una copia profunda o superficial del array de objetos para no mutar las props
        const nuevosObjetos = [...props.evento.objetos];

        // 2. Buscamos si ya existe el objeto por su ID
        let indiceObjeto = nuevosObjetos.findIndex(obj => obj.id_objeto === id_grupo_seleccionado);

        if (indiceObjeto !== -1) {
            // ESCENARIO A: El objeto existe, añadimos el movimiento a su lista
            // Clonamos el objeto para mantener inmutabilidad
            nuevosObjetos[indiceObjeto] = {
                ...nuevosObjetos[indiceObjeto],
                movimientos: [...nuevosObjetos[indiceObjeto].movimientos, mov_]
            };
        } else {
            // ESCENARIO B: El objeto NO existe, lo creamos de cero
            const nuevoObjeto = {
                tipo: 1, // O el tipo por defecto que corresponda
                id_objeto: id_grupo_seleccionado,
                x_inicial: 0, // Valores iniciales por defecto
                y_inicial: 0,
                movimientos: [mov_],
                operaciones: [],
                // No agregamos _id aquí, usualmente lo genera la base de datos
            };
            nuevosObjetos.push(nuevoObjeto);
            indiceObjeto = 0;
            setmovIndexSeleccionado(0)
        }

        // 3. Actualizamos el evento completo con la nueva lista de objetos
        const eventoActualizado = {
            ...props.evento,
            objetos: nuevosObjetos
        };

        // 4. Notificamos al componente padre
        props.editandoMovEvento(eventoActualizado);
        setListaMovimientos(nuevosObjetos[indiceObjeto].movimientos);
    }

    const eliminarMovimiento=(indice)=>{

        let indiceObjeto = props.evento.objetos.findIndex(obj => obj.id_objeto === id_grupo_seleccionado);
        if (indiceObjeto !== -1){
            props.evento.objetos[indiceObjeto].movimientos = props.evento.objetos[indiceObjeto].movimientos.filter((mov, index)=>{
                return index !== indice;
            });
            props.editandoMovEvento(props.evento)
            setListaMovimientos(props.evento.objetos[indiceObjeto].movimientos)
        }
    }

    useEffect(() => {
        console.log("[EVENTO][MOV]");
        console.log(props.evento)

        // if(props.evento){
        //     setListaMovimientos(props.evento.movimientos)
        // }
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
    }, [id_grupo_seleccionado]);


    useEffect(() => {
        console.log("[CAMBIO][VERSION]="+props.eventoAnimacion.edicion.version);
        setVerionKey(props.eventoAnimacion.edicion.version);

    }, [props.eventoAnimacion.edicion.version]);


    useEffect(() => {
        console.log("[***Cambio de MOVIMIENTO***]="+movIndexSeleccionado);
        if(movimientoSeleccionado !== null){
            console.log(movimientoSeleccionado);
            if(props.evento){
                for(let i=0; i<props.evento.objetos.length; i++){
                    if(props.evento.objetos[i].id_objeto === id_grupo_seleccionado){
                        props.evento.objetos[i].movimientos[movIndexSeleccionado] = movimientoSeleccionado;
                        break;
                    }
                }
                props.editandoMovEvento(props.evento)            }
        }
    }, [movimientoSeleccionado]);


    return (
        <div>
            {/* Header con título y botón agregar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-semibold text-secondary">
                    <i className="bi bi-collection me-2"></i>
                    {id_grupo_seleccionado}
                </h6>
                <button
                    className="btn btn-success btn-sm"
                    onClick={() => setShowAgregarModal(true)}
                >
                    <i className="bi bi-plus-lg me-1"></i>
                    Agregar
                </button>
            </div>

            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="table table-hover table-sm align-middle">
                    <thead className="table-light sticky-top">
                    <tr>
                        <th scope="col" style={{ width: '40px' }}>#</th>
                        <th scope="col">Tipo</th>
                        <th scope="col" className="text-center" style={{ width: '70px' }}>Activo</th>
                        <th scope="col" className="text-center" style={{ width: '120px' }}>Operaciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lista_movimiento.map((mov, index) => (
                        <tr key={index}>
                            <th scope="row" className="text-muted">{index + 1}</th>
                            <td>{tipos_movimientos[mov.tipo]}</td>
                            <td className="text-center">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`flexCheckDefault-${index}`}
                                    checked={mov.activo}
                                    onChange={(e) => console.log("asdsda das")}
                                />
                            </td>
                            <td className="text-center">
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
                    ))}
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
        </div>
    );
}

export default PanelMovimientos;
