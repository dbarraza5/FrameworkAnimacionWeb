import SeleccionFigura from "./SeleccionFigura";
import SeleccionGrupo from "./SeleccionGrupo";
import NavGestionFiguras from "./NavGestionFiguras";
import {useState} from "react";
import PropiedadFigura from "./PropiedadFigura";
import TablaFiguras from "./TablaFiguras";

function GestionFiguras(props){
    const meta_figuras = props.animacion.meta_figuras;
    const lista_grupos = props.animacion.get_lista_nombres_grupos();

    const [tipo_figura, setTipoFigura] = useState(props.animacion.meta_figuras[0].nombre);
    const [nombre_grupo, setNombreGrupo] = useState("default");
    const [nombre_figura, setNombreFigura] = useState(null);
    const [figura, setFigura] = useState(null)

    // control de error al cambiar el nombre del grupo
    const lista_nom_grupos = props.animacion.get_lista_nombres_grupos()
    if(!lista_nom_grupos.includes(nombre_grupo)){
        setNombreGrupo("default")

    }

    const agregar_figura=()=>{
        const f = props.animacion.crear_figura(nombre_grupo, tipo_figura)
        setFigura(f)
        props.setAnimacion({"edicion": props.animacion})
        props.gestionLienzo.categoria_trabajo = 0;
        props.gestionLienzo.id_grupo_selec = nombre_grupo;
        props.gestionLienzo.id_figura_selec = f.nombre;
        props.gestionLienzo.mover_figura = 1
        props.setGestionLienzo(props.gestionLienzo)
    }

    const cambiar_grupo=(nombre_grupo_)=>{
        setFigura(null)
        setNombreGrupo(nombre_grupo_)
    }

    const cambiar_tipo_figura=(tipo_figura_)=>{
        setFigura(null)
        setTipoFigura(tipo_figura_)
    }

    const cambio_atributo_figura=(nombre_attr, valor)=>{
        console.log("Cambio atributos")
        console.log(nombre_attr+"_"+valor)
        figura.atributos[nombre_attr] = parseInt(valor);
        props.animacion.set_figura(nombre_grupo, figura)
        props.setAnimacion({"edicion": props.animacion})
        setFigura({...figura})
        console.log(figura)
    }

    const selet_figura_editar=(nombre_figura_, tipo_figura_)=>{
        console.log("vamos aver "+nombre_figura_)
        const fig_ = props.animacion.get_figura(nombre_grupo, nombre_figura_)
        setTipoFigura(tipo_figura_)
        setFigura(fig_)
        const tab_figura = document.getElementById("btn-propiedad-tab");
        tab_figura.click();
    }

    return(<div>
        <br/>
        <div className="row">
            <div className="col-4">
                <SeleccionGrupo lista_grupos={lista_grupos} setNombreGrupo={cambiar_grupo} nombre_grupo={nombre_grupo}/>
                <SeleccionFigura meta_figuras={meta_figuras} setTipoFigura={cambiar_tipo_figura}
                                 agregar_figura={agregar_figura} tipo_figura={tipo_figura}/>
            </div>
            <div className="col-8">
                <NavGestionFiguras
                    propiedad_figura={<PropiedadFigura nombre_grupo = {nombre_grupo}
                                                       tipo_figura={tipo_figura}
                                                       nombre_figura={nombre_figura}
                                                       animacion={props.animacion}
                                                       figura={figura}
                                                       cambio_atributo_figura={cambio_atributo_figura}
                    />}
                    tabla_figuras ={<TablaFiguras nombre_grupo = {nombre_grupo}
                                                  animacion={props.animacion}
                                                  setAnimacion={props.setAnimacion}
                                                  selet_figura_editar = {selet_figura_editar}
                    />}
                />
            </div>
        </div>
    </div>)
}

export default GestionFiguras