import ButtonNav from "../EditorMapa/ButtonNav";
import NavFiguras from "../EditorAnimacion/SeccionFiguras/NavFiguras";
import {deshacer, rehacer} from "../../Store/Animacion/animacionSlice";
import Lienzo from "../EditorAnimacion/Lienzo";
import NavEventos from "./SeccionEventos/NavEventos";
import {useEffect, useRef, useState} from "react";
import TimelineCanvas from "../../Clases/EditorEvento/TimelineCanvas";

function NavEditorEvento(props){

    const editar_animacion=()=>{
        //console.log(props.gestionLienzo)
        //props.gestionLienzo.procesarEventoLienzo(props.eventoLienzoFigura, props.setAnimacion, props.cambiarListaTrabajo)
    }

    useEffect(() => {

    }, []);


    const agregarEvento = () => {
        const inicio = parseInt(prompt("Tiempo de inicio (ms):"), 10);
        const fin = parseInt(prompt("Tiempo de fin (ms):"), 10);
    };

    console.log("NAV EDITOR");
    console.log(props.eventoAnimacion.edicion.lista_raw_evento)
    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="home-tab" data-bs-target="#home-tab-pane">Edicion</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="profile-tab" data-bs-target="#profile-tab-pane">Animacion</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab" data-bs-target="#contact-tab-pane">Exportar</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane" role="tabpanel"
                 aria-labelledby="home-tab"
                 tabIndex="0">
                <div>
                    <br/>
                    <div className="row">
                        <div className="col">
                            <NavEventos {...props}/>
                        </div>
                        <div className="col">
                            <div className="card text-bg-light mb-3">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h6 className="card-title mb-0 text-start">evento <strong>;D</strong></h6>

                                    <div className="btn-group" role="group" aria-label="Basic example">
                                        <button type="button" className="btn btn-primary"

                                        >
                                            <i className="bi bi-arrow-left"></i>
                                        </button>
                                        <button type="button" className="btn btn-primary"
                                        >
                                            <i className="bi bi-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <Lienzo lienzo = {props.eventoLienzoFigura} id="lienzo-evento" editar_animacion={editar_animacion}
                                            setEventLienzoFigura={props.setEventLienzoFigura}/>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel"
                 aria-labelledby="profile-tab"
                 tabIndex="1">
                {props.edicion_figuras}
            </div>
            <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel"
                 aria-labelledby="contact-tab"
                 tabIndex="2">

            </div>
        </div>

    </div>)
}

export default NavEditorEvento