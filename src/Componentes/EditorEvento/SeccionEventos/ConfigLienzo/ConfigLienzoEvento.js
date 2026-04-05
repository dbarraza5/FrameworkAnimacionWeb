import ButtonNav from "../../../EditorMapa/ButtonNav";
import {
    TRABAJO_CONFIG_LIENZO_ATRIBUTOS,
    TRABAJO_CONFIG_LIENZO_IMAGENES
} from "../../../../Clases/EditorAnimacion/ConstanteAnimacion";
import ConfigGeneral from "../../../EditorAnimacion/SeccionFiguras/ConfigLienzo/ConfigGeneral";
import ConfigImagenes from "../../../EditorAnimacion/SeccionFiguras/ConfigLienzo/ConfigImagenes";


function ConfigLienzoEvento(props){
    return(<div>
        <br/>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-config-lienzo" data-bs-target="#nav-config-lienzo"
                           onClick={()=>props.cambioEspacioTrabajo(TRABAJO_CONFIG_LIENZO_ATRIBUTOS)}>Configuracion</ButtonNav>
            </li>
            {/*<li className="nav-item" role="presentation">*/}
            {/*    <ButtonNav id="btn-contact-tab1" data-bs-target="#nav-imagenes-lienzo"*/}
            {/*               onClick={()=>props.cambioEspacioTrabajo(TRABAJO_CONFIG_LIENZO_IMAGENES)}>Imagenes</ButtonNav>*/}
            {/*</li>*/}
        </ul>
        <div className="tab-content" id="myTabContentsad">
            <div className="tab-pane fade" id="nav-config-lienzo" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                {/*<ConfigGeneral {...props}/>*/}

            </div>
            {/*<div className="tab-pane fade" id="nav-imagenes-lienzo" role="tabpanel"*/}
            {/*     aria-labelledby="contact-tab1"*/}
            {/*     tabIndex="2">*/}
            {/*    <ConfigImagenes {...props}/>*/}
            {/*</div>*/}
        </div>
    </div>)
}


export default ConfigLienzoEvento;