import ButtonNav from "../../EditorMapa/ButtonNav";
import ListaGrupos from "./EditarGrupo/ListaGrupos";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import GestionGrupos from "./GestionGrupos/GestionGrupos";
import GestionFiguras from "./GestionFiguras/GestionFiguras";

function NavFiguras(props){
    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="home-tab1" data-bs-target="#home-tab-pane1">Gestion</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-propiedades-grupo" data-bs-target="#nav-propiedades-grupo">Grupos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab1" data-bs-target="#contact-tab-pane1">Figuras</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane1" role="tabpanel"
                 aria-labelledby="home-tab1"
                 tabIndex="0">
                <br/>
                <GestionGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="nav-propiedades-grupo" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <ListaGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="contact-tab-pane1" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <GestionFiguras {...props}/>
            </div>
        </div>
    </div>)
}

export default NavFiguras;