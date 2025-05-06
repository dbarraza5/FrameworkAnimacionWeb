import ButtonNav from "../../EditorMapa/ButtonNav";
import PanelEventos from "./PanelEventos";
import {useState} from "react";


function NavEventos(props){
    const [showModal, setShowModal] = useState(false);

    return (<div>
        <div className="mb-2 d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={() => setShowModal(true)}>
                Lista eventos
            </button>
            <button className="btn btn-outline-success">
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

        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade" id="nav-eventos" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <PanelEventos/>
            </div>
            <div className="tab-pane fade" id="nav-movimientos" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                movimientos
            </div>
            <div className="tab-pane fade" id="nav-grupos" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                grupos
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
                            <p>Contenido vacío por ahora.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>)
}

export default NavEventos;