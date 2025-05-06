import ButtonNav from "../../EditorMapa/ButtonNav";
import PanelAnimacion from "./PanelAnimacion";


function NavEventos(props){

    return (<div>
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
                <PanelAnimacion/>
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
    </div>)
}

export default NavEventos;