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
        console.log(props.eventoLienzoFigura)
        const nombre_grupo = props.eventoLienzoFigura.id_grupo_selec;
        const nombre_figura = props.eventoLienzoFigura.id_figura_selec;
        if(props.eventoLienzoFigura.mouse_click_down){
            if(props.eventoLienzoFigura.categoria_trabajo === 0){
                const grupo_ = props.animacion.getGrupo(nombre_grupo)
                const fig_ = props.animacion.get_figura(nombre_grupo, nombre_figura)
                let x = props.eventoLienzoFigura.mouse_x-grupo_.cx;
                let y = props.eventoLienzoFigura.mouse_y-grupo_.cy;
                fig_.atributos["cx"] = x;
                fig_.atributos["cy"] = y;
                props.animacion.set_figura(nombre_grupo, fig_)
                props.setAnimacion({"edicion": props.animacion})
                console.log(fig_)
                console.log(grupo_)
            }
        }


    }

    useEffect(() => {
        // Your code here

        //$('#tree').treeview({data: tree});
    }, []);

    return(
        <div>
            <br/>
            <div className="row">
                <div className="col">
                    <NavFiguras animacion={props.animacion} setAnimacion={props.setAnimacion}
                                eventoLienzoFigura = {eventoLienzoFigura} setEventLienzoFigura={props.setEventLienzoFigura}/>
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