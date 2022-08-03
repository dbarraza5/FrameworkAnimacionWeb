/*const {Component} = require("react");

class EditorAnimacion extends Component{

}*/

import NavEditorAnimacion from "./NavEditorAnimacion";
import SeleccionFigura from "./SeccionFiguras/GestionFiguras/SeleccionFigura";
import {useEffect, useState} from "react";
import EdicionFiguras from "./SeccionFiguras/EdicionFiguras";
import GestionAnimacion from "../../Clases/EditorAnimacion/GestionAnimacion";
import GestionLienzoAnimacion from "../../Clases/EditorAnimacion/GestionLienzoAnimacion";
import Lienzo from "./Lienzo";
import ControlEventoLienzoFigura from "../../Clases/EditorAnimacion/ControlEventoLienzoFigura";




function EditorAnimacion() {

    const [animacion, setAnimacion] = useState({edicion: new GestionAnimacion()});
    const [lienzo, setAlienzo] = useState(new GestionLienzoAnimacion());
    const [eventoLienzoFigura, setEventLienzoFigura] = useState(new ControlEventoLienzoFigura())

    useEffect(() => {
        //const liezo = new GestionLienzoAnimacion()
        console.log(lienzo)
        lienzo.actualizarLienzo(animacion.edicion)
    });

    const editar_animacion=(animacion_)=>{
        setAnimacion(animacion_)
        //const liezo = new GestionLienzoAnimacion()
        //lienzo.actualizarLienzo(animacion_.edicion)
    }


    return (<div className="row">
        <NavEditorAnimacion>
            <EdicionFiguras animacion={animacion.edicion} setAnimacion={editar_animacion}
                            eventoLienzoFigura ={eventoLienzoFigura} setEventLienzoFigura={setEventLienzoFigura}
            />
        </NavEditorAnimacion>
    </div>)
}

export default EditorAnimacion