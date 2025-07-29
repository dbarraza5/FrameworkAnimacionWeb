import ButtonNav from "../../EditorMapa/ButtonNav";
import PanelEventos from "./PanelEventos";
import {useEffect, useState} from "react";
import PanelMovimientos from "./PanelMovimientos";
import PanelScripts from "./PanelScripts";
import PanelAnimacion from "./PanelAnimacion";
import ModalAgregarEvento from "./ModalAgregarEvento";


function NavEventos(props){
    const [showModal, setShowModal] = useState(false);
    const [evento, setEvento] = useState(null);
    const [indexIvento, setIndexEvento] = useState(null);
    const [modalAddEvento, setModalAddEvento] = useState(false);

    const seleccionEvento=(index)=>{
        setEvento(props.eventoAnimacion.edicion.eventos[index].evento);
        setIndexEvento(index);
        props.eventoAnimacion.edicion.seleccion_evento = index;
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const editandoMovEvento=(movimientos)=>{
        console.log("[editandoMovEvento]");
        console.log(movimientos);
        evento.movimientos = movimientos;
        props.eventoAnimacion.edicion.eventos[indexIvento].evento =evento;
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const editandoEvento=(evento_)=>{
        console.log("[editandoEvento]");
        console.log(evento_);
        props.eventoAnimacion.edicion.eventos[indexIvento].evento = {...props.eventoAnimacion.edicion.eventos[indexIvento].evento, ...evento_};
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const agregandoEvento=(evento_)=>{
        console.log("[agregandoEvento]");
        console.log(evento_);

    }

    // useEffect(() => {
    //     console.log("[PREVIEW CAMBIO EVENTO]");
    //     if(indexIvento!==null){
    //         console.log("[***Cambio de Evento***]");
    //         console.log(evento);
    //         const evento_new = props.eventoAnimacion.edicion.eventos[indexIvento].evento;
    //         setEvento({...evento_new});
    //     }
    // }, [evento]);

    useEffect(() => {
        console.log("[PREVIEW CAMBIO indexIvento]");
        if(indexIvento!==null){
            console.log("[***Cambio de indexIvento***]");
            console.log(evento);
            const evento_new = props.eventoAnimacion.edicion.eventos[indexIvento].evento;
            setEvento({...evento_new});
        }
    }, [indexIvento]);

    return (<div>
        {evento ? (
            <p>Hay un evento seleccionado {evento.nombre}</p>
        ) : (
            <p>No hay evento seleccionado</p>
        )}
        <div className="mb-2 d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={() => setShowModal(true)}>
                Lista eventos
            </button>
            <button className="btn btn-outline-success" onClick={() => setModalAddEvento(true)}>
                <i className="bi bi-plus"></i>
            </button>
        </div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">

            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-eventos" data-bs-target="#nav-eventos"
                           onClick={()=>console.log("animacion")}>Eventos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-movimientos" data-bs-target="#nav-movimientos"
                           onClick={()=>console.log("edicion")}>Movimientos</ButtonNav>
            </li>

            <li className="nav-item" role="presentation">
                <ButtonNav id="btnnav-grupos" data-bs-target="#nav-grupos"
                           onClick={()=>console.log("edicion")}>Grupos</ButtonNav>
            </li>

            <li className="nav-item" role="presentation">
                <ButtonNav id="btnnav-scrips" data-bs-target="#nav-scrips"
                           onClick={()=>console.log("edicion")}>Scripts</ButtonNav>
            </li>

            <li className="nav-item" role="presentation">
                <ButtonNav id="btnnav-animacion" data-bs-target="#nav-animacion"
                           onClick={()=>console.log("animacion")}>Animacion</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade" id="nav-eventos" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <PanelEventos {...props} evento={evento} guardandoEvento={editandoEvento}/>
            </div>
            <div className="tab-pane fade" id="nav-movimientos" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <br/>
                <PanelMovimientos {...props} evento={evento} editandoMovEvento={editandoMovEvento}/>
            </div>
            <div className="tab-pane fade" id="nav-grupos" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                grupos
            </div>

            <div className="tab-pane fade" id="nav-scrips" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <br/>
                <PanelScripts {...props}/>
            </div>
            <div className="tab-pane fade" id="nav-animacion" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <br/>
                <PanelAnimacion {...props}/>
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
    </div>)
}

export default NavEventos;