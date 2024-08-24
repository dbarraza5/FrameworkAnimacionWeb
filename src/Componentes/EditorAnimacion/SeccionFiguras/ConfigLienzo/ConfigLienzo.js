import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {agregarIimagen} from "../../../../Store/Animacion/animacionSlice";
import axios from "axios";
import {Cookies} from 'react-cookie';
import SubirImagen from "./SubirImagen";
import TablaImagenes from "./TablaImagenes";
import ButtonNav from "../../../EditorMapa/ButtonNav";
import {
    TRABAJO_CONFIG_LIENZO_ATRIBUTOS, TRABAJO_CONFIG_LIENZO_IMAGENES,
    TRABAJO_GRUPOS,
    TRABAJO_LISTA_FIGURAS, TRABAJO_PINTADO_GRUPO
} from "../../../../Clases/EditorAnimacion/ConstanteAnimacion";

import ConfigImagenes from "./ConfigImagenes";
import ConfigGeneral from "./ConfigGeneral";

function ConfigLienzo(props){


    return(<div>
        <br/>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-nav-config-lienzo" data-bs-target="#nav-config-lienzo"
                           onClick={()=>props.cambioEspacioTrabajo(TRABAJO_CONFIG_LIENZO_ATRIBUTOS)}>Configuracion</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="btn-contact-tab1" data-bs-target="#nav-imagenes-lienzo"
                           onClick={()=>props.cambioEspacioTrabajo(TRABAJO_CONFIG_LIENZO_IMAGENES)}>Imagenes</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade" id="nav-config-lienzo" role="tabpanel"
                 aria-labelledby="profile-tab1"
                 tabIndex="1">
                <ConfigGeneral {...props}/>

            </div>
            <div className="tab-pane fade" id="nav-imagenes-lienzo" role="tabpanel"
                 aria-labelledby="contact-tab1"
                 tabIndex="2">
                <ConfigImagenes {...props}/>
            </div>
        </div>
    </div>)
}

export default ConfigLienzo;