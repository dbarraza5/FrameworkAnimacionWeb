/*const {Component} = require("react");

class EditorAnimacion extends Component{

}*/

import NavEditorAnimacion from "./NavEditorAnimacion";
import SeleccionFigura from "./SeccionFiguras/GestionFiguras/SeleccionFigura";
import {useEffect, useState} from "react";
import EdicionFiguras from "./SeccionFiguras/EdicionFiguras";
import GestionAnimacion from "../../Clases/EditorAnimacion/GestionAnimacion";
import GestionLienzoAnimacion from "../../Clases/EditorAnimacion/GestionLienzoAnimacion";

const style = {

}
const gestion_animacion  = new GestionAnimacion();
const data_set = {nombre: "daniel"}
function EditorAnimacion() {

    const [animacion, setAnimacion] = useState({edicion: new GestionAnimacion()});

    useEffect(() => {
        const liezo = new GestionLienzoAnimacion()
        liezo.actualizarLienzo(animacion.edicion)
    });

    const editar_animacion=(animacion_)=>{
        setAnimacion(animacion_)
        const liezo = new GestionLienzoAnimacion()
        liezo.actualizarLienzo(animacion_.edicion)
    }


    return (<div className="row">
        <div className="col">
            <NavEditorAnimacion>
                <EdicionFiguras animacion={animacion.edicion} setAnimacion={editar_animacion}/>
            </NavEditorAnimacion>
        </div>
        <div className="col">
            <div className="card text-bg-light mb-3" style={style}>
                <div className="card-header">Animación</div>
                <div className="card-body">
                    <canvas id="lienzo-animacion" onMouseMove={(e)=>1}
                            width="600" height="600" style={style}></canvas>
                </div>
            </div>
        </div>
    </div>)
}

export default EditorAnimacion