import SelectInstancias from "../../EditorMapa/SelectInstancias";
import PropiedadElemento from "../../EditorMapa/PropiedadElemento";
import ListadoElemento from "../../EditorMapa/ListadoElemento";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import {useEffect} from "react";
import Graph from "react-graph-vis";
import NavFiguras from "./NavFiguras";
import Lienzo from "../Lienzo";

function EdicionFiguras(props){

    //let grupos = props.animacion.grupos_figuras;
    const eventoLienzoFigura = props.eventoLienzoFigura;

    const editar_animacion=()=>{
        //console.log(props.gestionLienzo)
        props.gestionLienzo.procesarEventoLienzo(eventoLienzoFigura, props.setAnimacion)
        eventoLienzoFigura.reset()
    }

    useEffect(() => {

    }, []);

    return(
        <div>
            <br/>
            <div className="row">
                <div className="col">
                    <NavFiguras {...props}/>
                </div>
                <div className="col">
                    <div className="card text-bg-light mb-3">
                        <div className="card-header">Animación</div>
                        <div className="card-body">
                            <Lienzo lienzo = {eventoLienzoFigura} id="lienzo-animacion" editar_animacion={editar_animacion}
                                    setEventLienzoFigura={props.setEventLienzoFigura}/>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default EdicionFiguras