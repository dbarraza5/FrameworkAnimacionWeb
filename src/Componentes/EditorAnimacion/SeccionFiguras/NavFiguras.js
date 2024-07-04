import ButtonNav from "../../EditorMapa/ButtonNav";
import ListaGrupos from "./EditarGrupo/ListaGrupos";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import GestionGrupos from "./GestionGrupos/GestionGrupos";
import GestionFiguras from "./GestionFiguras/GestionFiguras";
import TreeViewElement from "../../TreeView/TreeViewElement";
import GestionGruposLienzo from "./GestionGrupoLienzo/GestionGruposLienzo";
import PintadoGrupo from "./PintadoGrupo/PintadoGrupo";
import {
    MOVER_FIGURA_AGREGADA, MOVER_NADA,
    TRABAJO_CONFIG_LIENZO_IMAGENES, TRABAJO_EDICION_FIGURAS, TRABAJO_FIGURA,
    TRABAJO_GRUPOS,
    TRABAJO_LISTA_FIGURAS,
    TRABAJO_PINTADO_GRUPO
} from "../../../Clases/EditorAnimacion/ConstanteAnimacion";
import {useState} from "react";
import ConfigLienzo from "./ConfigLienzo/ConfigLienzo";


function NavFiguras(props){

    const [selectNav, setSelectNav] = useState(0);

    const cambioEspacioTrabajo=(id_)=>{
        props.gestionLienzo.categoria_trabajo = id_;
        //props.gestionLienzo.mover_figura = MOVER_NADA;
        setSelectNav(id_);
    }

    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">

            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-propiedades-grupo" data-bs-target="#nav-propiedades-grupo"
                           onClick={()=>cambioEspacioTrabajo(TRABAJO_GRUPOS)}>Grupos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab1" data-bs-target="#contact-tab-pane1"
                           onClick={()=>cambioEspacioTrabajo(TRABAJO_LISTA_FIGURAS)}>Figuras</ButtonNav>
            </li>
            <li className="nav-item" role="presentation" >
                <ButtonNav id="puntero-tab" data-bs-target="#puntero-tab-panel"
                           onClick={()=>null}>Lienzo</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="puntero-tab" data-bs-target="#pintar-tab-panel"
                           onClick={()=>cambioEspacioTrabajo(TRABAJO_PINTADO_GRUPO)}>Pintar</ButtonNav>
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
                <ConfigLienzo {...props} cambioEspacioTrabajo={cambioEspacioTrabajo}/>
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