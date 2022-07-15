/*const {Component} = require("react");

class EditorAnimacion extends Component{

}*/

import NavEditorAnimacion from "./NavEditorAnimacion";
import SeleccionFigura from "./SeleccionFigura";
import {useState} from "react";
import EdicionFiguras from "./EdicionFiguras";
import GestionAnimacion from "../../Clases/EditorAnimacion/GestionAnimacion";

const style = {

}
const gestion_animacion  = new GestionAnimacion();
const data_set = {nombre: "daniel"}
function EditorAnimacion() {

    const [animacion, setAnimacion] = useState({edicion: new GestionAnimacion()});
    const [test_name, func_test] = useState(data_set);
    const test1 =()=>{

        animacion.edicion.grupos_figuras[0].nombre="aver";
        setAnimacion({edicion: animacion.edicion})
        //func_test({nombre: "dark"})
        console.log("cambiendo la niamcion!!!!!")
        console.log(animacion)
    }

    return (<div className="row">
        <div className="col">
            <NavEditorAnimacion>
                <EdicionFiguras animacion={animacion.edicion} setAnimacion={setAnimacion}/>
            </NavEditorAnimacion>
        </div>
        <div className="col">
            <div className="card text-bg-light mb-3" style={style}>
                <div className="card-header">Animación</div>
                <div className="card-body">
                    {test_name.nombre} <br/>
                    {animacion.edicion.grupos_figuras[0].nombre}<br/>
                    <button onClick={test1}>prueba</button>
                </div>
            </div>
        </div>
    </div>)
}

export default EditorAnimacion