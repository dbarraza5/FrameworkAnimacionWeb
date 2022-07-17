import SeleccionFigura from "./SeleccionFigura";
import SeleccionGrupo from "./SeleccionGrupo";

function GestionFiguras(props){
    const meta_figuras = props.animacion.meta_figuras;
    const lista_grupos = props.animacion.get_lista_nombres_grupos()
    return(<div>
        <br/>
        <div className="row">
            <div className="col">
                <SeleccionGrupo lista_grupos={lista_grupos}/>
            </div>
            <div className="col">
                <SeleccionFigura meta_figuras={meta_figuras} agregar_elemento={()=>console.log("aver que no pasa nada")}/>
            </div>
        </div>


    </div>)
}

export default GestionFiguras