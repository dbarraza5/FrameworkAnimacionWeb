import SelectInstancias from "../../EditorMapa/SelectInstancias";
import PropiedadElemento from "../../EditorMapa/PropiedadElemento";
import ListadoElemento from "../../EditorMapa/ListadoElemento";
import SeleccionFigura from "./GestionFiguras/SeleccionFigura";
import {useEffect} from "react";
import Graph from "react-graph-vis";
import NavFiguras from "./NavFiguras";
import Lienzo from "../Lienzo";



import {useDispatch, useSelector} from "react-redux";
import {setListaGrupoTrabajo, deshacer, rehacer} from "../../../Store/Animacion/animacionSlice";
function EdicionFiguras(props){

    const backup = useSelector((state) => state.animacion.backup);

    //let grupos = props.animacion.grupos_figuras;
    const eventoLienzoFigura = props.eventoLienzoFigura;
    const animacion_redux = useSelector((state) => state.animacion.animacion);

    const dispatch = useDispatch();

    const cambiarListaTrabajo=(lista)=>{
        dispatch(setListaGrupoTrabajo(lista))
    }

    const editar_animacion=()=>{
        //console.log(props.gestionLienzo)
        props.gestionLienzo.procesarEventoLienzo(eventoLienzoFigura, props.setAnimacion, cambiarListaTrabajo)
        eventoLienzoFigura.reset()
    }

    useEffect(() => {
        const interval = setInterval(() => {
            //console.log('This will run every second!');
            props.gestionLienzo.procesarEventoLienzo(eventoLienzoFigura, props.setAnimacion, cambiarListaTrabajo)
        }, 500);
        return () => clearInterval(interval);
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
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h6 className="card-title mb-0 text-start">Animación <strong>{animacion_redux.nombre_animacion}</strong></h6>
                            <div className="d-flex">
                                <button className="btn btn-light me-2 btn-icon" onClick={()=>dispatch(deshacer())} disabled={backup.deshacer.length===0}>
                                    <i className="bi bi-arrow-left"></i>
                                </button>
                                <button className="btn btn-light btn-icon" onClick={()=>dispatch(rehacer())} disabled={backup.rehacer.length===0}>
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            </div>
                        </div>
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