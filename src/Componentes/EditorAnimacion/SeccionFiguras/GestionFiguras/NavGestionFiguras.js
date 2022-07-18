import ButtonNav from "../../../EditorMapa/ButtonNav";
import PropiedadFigura from "./PropiedadFigura";
import {useState} from "react";

function NavGestionFiguras(props){


    return(<div>
        <ul className="nav nav-tabs" id="myTab1234" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="btn-propiedad-tab" data-bs-target="#propiedad-tab-pane">Propiedad</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-administrar-tab" data-bs-target="#administrar-tab-pane">Administrar</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="propiedad-tab-pane" role="tabpanel"
                 aria-labelledby="home-tab"
                 tabIndex="0">
                {props.propiedad_figura}
            </div>
            <div className="tab-pane fade" id="administrar-tab-pane" role="tabpanel"
                 aria-labelledby="profile-tab"
                 tabIndex="1">2
            </div>
        </div>
    </div>)
}

export default NavGestionFiguras;