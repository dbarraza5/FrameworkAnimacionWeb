import ButtonNav from "../../EditorMapa/ButtonNav";
import ListaGrupos from "./EditarGrupo/ListaGrupos";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import GestionGrupos from "./GestionGrupos/GestionGrupos";
import GestionFiguras from "./GestionFiguras/GestionFiguras";
import TreeViewElement from "../../TreeView/TreeViewElement";
import GestionGruposLienzo from "./GestionGrupoLienzo/GestionGruposLienzo";
import PintadoGrupo from "./PintadoGrupo/PintadoGrupo";
import {
    TRABAJO_GRUPOS,
    TRABAJO_LISTA_FIGURAS,
    TRABAJO_PINTADO_GRUPO
} from "../../../Clases/EditorAnimacion/ConstanteAnimacion";
import {useState} from "react";


function NavFiguras(props){

    const [selectNav, setSelectNav] = useState(0);

    const cambioEspacioTrabajo=(id_)=>{
        props.gestionLienzo.categoria_trabajo = id_;
        setSelectNav(id_);
    }

    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">

            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-propiedades-grupo" data-bs-target="#nav-propiedades-grupo"
                           onClick={()=>cambioEspacioTrabajo(TRABAJO_GRUPOS)}>Grupos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab1" data-bs-target="#contact-tab-pane1" onClick={()=>cambioEspacioTrabajo(TRABAJO_LISTA_FIGURAS)}>Figuras</ButtonNav>
            </li>
            <li className="nav-item" role="presentation" >
                <ButtonNav id="puntero-tab" data-bs-target="#puntero-tab-panel">Lienzo</ButtonNav>
            </li>

            <li className="nav-item" role="presentation" onClick={()=>cambioEspacioTrabajo(TRABAJO_PINTADO_GRUPO)}>
                <ButtonNav id="puntero-tab" data-bs-target="#pintar-tab-panel">Pintar</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade" id="nav-propiedades-grupo" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <br/>
                <GestionGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="contact-tab-pane1" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <GestionFiguras {...props}/>
            </div>
            <div className="tab-pane fade" id="puntero-tab-panel" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                Aqui la configuracion del lienzo
            </div>
            <div className="tab-pane fade" id="pintar-tab-panel" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <PintadoGrupo {...props} selectNav={selectNav}/>
            </div>
        </div>
    </div>)
}

export default NavFiguras;