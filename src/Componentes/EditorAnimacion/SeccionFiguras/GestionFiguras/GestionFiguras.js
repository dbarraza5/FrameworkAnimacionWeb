import SeleccionFigura from "./SeleccionFigura";
import SeleccionGrupo from "./SeleccionGrupo";
import NavGestionFiguras from "./NavGestionFiguras";
import {useState} from "react";
import PropiedadFigura from "./PropiedadFigura";

function GestionFiguras(props){
    const meta_figuras = props.animacion.meta_figuras;
    const lista_grupos = props.animacion.get_lista_nombres_grupos();

    const [tipo_figura, setTipoFigura] = useState(props.animacion.meta_figuras[0].nombre);
    const [nombre_grupo, setNombreGrupo] = useState("default");
    const [nombre_figura, setNombreFigura] = useState(null);

    return(<div>
        <br/>
        <div className="row">
            <div className="col">
                <SeleccionGrupo lista_grupos={lista_grupos} setNombreGrupo={setNombreGrupo}/>
            </div>
            <div className="col">
                <SeleccionFigura meta_figuras={meta_figuras} setTipoFigura={setTipoFigura}/>
            </div>
        </div>
        <br/>
        <NavGestionFiguras
            propiedad_figura={<PropiedadFigura nombre_grupo = {nombre_grupo}
                                               tipo_figura={tipo_figura}
                                               nombre_figura={nombre_figura}
                                                animacion={props.animacion}/>}
        />
    </div>)
}

export default GestionFiguras