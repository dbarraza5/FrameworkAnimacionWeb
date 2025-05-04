import ButtonNav from "../../EditorMapa/ButtonNav";
import PanelAnimacion from "./PanelAnimacion";


function NavEventos(props){

    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">

            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-propiedades-grupo" data-bs-target="#nav-propiedades-grupo"
                           onClick={()=>console.log("animacion")}>animacion</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab1" data-bs-target="#contact-tab-pane1"
                           onClick={()=>console.log("edicion")}>edicion</ButtonNav>
            </li>

        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade" id="nav-propiedades-grupo" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <PanelAnimacion/>
            </div>
            <div className="tab-pane fade" id="contact-tab-pane1" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                edicion
            </div>

        </div>
    </div>)
}

export default NavEventos;