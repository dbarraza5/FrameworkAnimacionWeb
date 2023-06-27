import SeleccionGrupo from "../GestionFiguras/SeleccionGrupo";
import {useState} from "react";

function PintadoGrupo(props){
    const lista_grupos = props.animacion.get_lista_nombres_grupos();
    const [nombre_grupo, setNombreGrupo] = useState("default");

    const cambiar_grupo=(nombre_grupo_)=>{
        setNombreGrupo(nombre_grupo_)
    }
    return (<>
        <br/>
        <row>
            <SeleccionGrupo lista_grupos={lista_grupos} setNombreGrupo={cambiar_grupo} nombre_grupo={nombre_grupo}/>
        </row>
    </>)
}

export default PintadoGrupo