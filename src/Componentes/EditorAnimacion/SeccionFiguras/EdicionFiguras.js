import SelectInstancias from "../../EditorMapa/SelectInstancias";
import PropiedadElemento from "../../EditorMapa/PropiedadElemento";
import ListadoElemento from "../../EditorMapa/ListadoElemento";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import {useEffect} from "react";
import Graph from "react-graph-vis";
import NavFiguras from "./NavFiguras";

function EdicionFiguras(props){

    let grupos = props.animacion.grupos_figuras;
    console.log(grupos)

    useEffect(() => {
        // Your code here

        //$('#tree').treeview({data: tree});
    }, []);

    return(
        <div>

            <br/>
            <div className="row">
                <NavFiguras animacion={props.animacion} setAnimacion={props.setAnimacion}/>
            </div>
        </div>
    )
}

export default EdicionFiguras