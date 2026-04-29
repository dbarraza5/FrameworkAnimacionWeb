import {useEffect, useState} from "react";
import ModalAgregarEvento from "./ModalAgregarEvento";
import ModalListaEventos from "./ModalListaEventos";
import {useDispatch} from "react-redux";
import {setIdEventoSeleccionado, setTipoModalidad} from "../../../Store/Configuracion/ConfigEventoSlice";


function SeleccionEvento(props){
    const [modalAddEvento, setModalAddEvento] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showModalListaEvento, setShowModalListaEvento] = useState(false);
    const [evento, setEvento] = useState(null);
    const [indexIvento, setIndexEvento] = useState(null);
    const dispatch = useDispatch();

    const seleccionEvento=(index)=>{
        // setEvento(props.eventoAnimacion.edicion.eventos[index].evento);
        // setIndexEvento(index);
        // props.eventoAnimacion.edicion.seleccion_evento = index;
        // props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
        const evento_ = props.eventoAnimacion.edicion.eventos[index]
        console.log(evento_.evento.nombre)
        dispatch(setIdEventoSeleccionado(evento_.evento.nombre))
        setEvento(evento_.evento);
    }

    // const editandoMovEvento=(movimientos)=>{
    //     console.log("[editandoMovEvento]");
    //     console.log(movimientos);
    //     evento.movimientos = movimientos;
    //     props.eventoAnimacion.edicion.eventos[indexIvento].evento =evento;
    //     props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    // }
    //
    // const editandoEvento=(evento_)=>{
    //     console.log("[editandoEvento]");
    //     console.log(evento_);
    //     props.eventoAnimacion.edicion.eventos[indexIvento].evento = {...props.eventoAnimacion.edicion.eventos[indexIvento].evento, ...evento_};
    //     props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    // }

    const agregandoEvento=(evento_)=>{
        console.log("[agregandoEvento]");
        console.log(evento_);
        evento_ = {
            //"_id":  nanoid(8),
            "movimientos": [],
            ...evento_
        }
        props.eventoAnimacion.edicion.agregarEvento(evento_);
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const eliminarEvento=(indice)=>{
        props.eventoAnimacion.edicion.eventos = props.eventoAnimacion.edicion.eventos.filter((evento_, index)=>{
            return index !==indice;
        });
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const seleccionarEvento=(nombre)=>{
        //props.eventoAnimacion.edicion.seleccion_evento = nombre;
        let indice_seleccionado = -1;
        for(let i=0; props.eventoAnimacion.edicion.eventos; i++){
            const evento_ = props.eventoAnimacion.edicion.eventos[i];
            if(evento_["evento"]["nombre"] === nombre){
                console.log("[index]: "+i);
                indice_seleccionado = i;
                break;
            }
        }
        if(indice_seleccionado>-1){
            seleccionEvento(indice_seleccionado);
        }
        console.log("[nombre evento]: "+nombre);
    }

    const seleccionarModalidad=(tipo_modalidad)=>{
        //console.log(tipo_modalidad);
        dispatch(setTipoModalidad(tipo_modalidad));
    }


    useEffect(() => {
        console.log("[PREVIEW CAMBIO indexIvento]");
        if(indexIvento!==null){
            console.log("[***Cambio de indexIvento***]");
            console.log(evento);
            const evento_new = props.eventoAnimacion.edicion.eventos[indexIvento].evento;
            setEvento({...evento_new});
        }
    }, [indexIvento]);

    return (
        <div>
            <div className="container-fluid py-1 bg-light border-bottom mb-2">
                <div className="d-flex justify-content-between align-items-center flex-nowrap overflow-hidden">

                    {/* Información del Evento: Reducido a una sola línea */}
                    <div className="d-flex align-items-center flex-shrink-1 text-truncate">
                        <div className={`me-2 px-2 py-1 rounded border ${evento ? 'border-primary text-primary' : 'border-secondary text-secondary'} bg-white small`}>
                            <i className={`bi ${evento ? 'bi-calendar-check' : 'bi-calendar-x'}`}></i>
                        </div>
                        <div className="text-truncate">
                            <span className="text-muted small fw-bold text-uppercase me-2" style={{ fontSize: '0.65rem' }}>Evento:</span>
                            <span className="small fw-semibold text-dark">
                    {evento ? evento.nombre : "Ninguno"}
                </span>
                        </div>
                    </div>

                    {/* Acciones: Unificadas en un solo grupo de botones pequeño */}
                    <div className="d-flex align-items-center gap-1 ms-3">
                        <div className="btn-group btn-group-sm">
                            <button
                                className="btn btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
                                title="Ver Lista"
                                onClick={() => setShowModal(true)}
                            >
                                <i className="bi bi-list-ul"></i> <span className="d-none d-md-inline">Lista</span>
                            </button>
                            <button
                                className="btn btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
                                title="Ver Árbol"
                                onClick={() => setShowModalListaEvento(true)}
                            >
                                <i className="bi bi-diagram-3"></i> <span className="d-none d-md-inline">Árbol</span>
                            </button>
                        </div>

                        <button
                            className="btn btn-success btn-sm py-0 px-2 d-flex align-items-center gap-1 shadow-sm"
                            onClick={() => setModalAddEvento(true)}
                        >
                            <i className="bi bi-plus-lg"></i>
                            <span className="d-none d-sm-inline">Nuevo</span>
                        </button>
                    </div>

                </div>
            </div>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Lista de eventos</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
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
                                        {props.eventoAnimacion.edicion.eventos.map((item, index) => {
                                            return (
                                                <tr key={index}>
                                                    <th scope="row">{index + 1}</th>
                                                    <td>{item.evento.nombre}</td>
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
                                                                onClick={() => seleccionEvento(index)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button type="button" className="btn btn-outline-primary">
                                                                <i className="bi bi-files"></i>
                                                            </button>
                                                            {
                                                                item.evento.nombre !== "EventoGeneral"&&
                                                                (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-primary"
                                                                        onClick={() => eliminarEvento(index)}
                                                                    >
                                                                        <i className="bi bi-eraser"></i>
                                                                    </button>
                                                                )
                                                            }

                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ModalAgregarEvento
                show={modalAddEvento}
                onClose={() => setModalAddEvento(false)}
                onGuardar={agregandoEvento}
                eventoAnimacion={props.eventoAnimacion}
            />

            <ModalListaEventos
                id={'modal-seleccion'}
                key={`modal-seleccion-${props.eventoAnimacion.edicion.version}`}
                show={showModalListaEvento}
                onClose={() => setShowModalListaEvento(false)}
                onGuardar={seleccionarEvento}
                lista_eventos={props.eventoAnimacion.edicion.eventos}
            />
        </div>
        );
}


export default SeleccionEvento;