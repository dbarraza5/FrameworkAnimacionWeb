import ButtonNav from "../EditorMapa/ButtonNav";
import ListaGrupos from "./ListaGrupos";
import SeleccionFigura from "./SeleccionFigura";

function NavFiguras(props){
    let meta_figuras = props.animacion.meta_figuras;
    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="home-tab1" data-bs-target="#home-tab-pane1">Grafo</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="profile-tab1" data-bs-target="#profile-tab-pane1">Grupos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab1" data-bs-target="#contact-tab-pane1">Figuras</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane1" role="tabpanel"
                 aria-labelledby="home-tab1"
                 tabIndex="0">
                1
            </div>
            <div className="tab-pane fade" id="profile-tab-pane1" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <ListaGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="contact-tab-pane1" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <SeleccionFigura meta_figuras={meta_figuras} agregar_elemento={()=>console.log("aver que no pasa nada")}/>
            </div>
        </div>
    </div>)
}

export default NavFiguras;