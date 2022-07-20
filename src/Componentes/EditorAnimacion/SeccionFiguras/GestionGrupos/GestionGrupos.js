import CrearGrupo from "./CrearGrupo";
import ListaGrupos from "../EditarGrupo/ListaGrupos";
import TablaGrupos from "./TablaGrupos";

function GestionGrupos(props){
    //https://getbootstrap.com/docs/5.0/components/accordion/
    return(<div>

        <div className="accordion" id="accordionExample">
            <div className="accordion-item">
                <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                        Crear un Grupo
                    </button>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne"
                     data-bs-parent="#accordionExample">
                    <div className="accordion-body">
                        <CrearGrupo {...props}/>
                    </div>
                </div>
            </div>
            <div className="accordion-item">
                <h2 className="accordion-header" id="headingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                        Listado de Grupos
                    </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo"
                     data-bs-parent="#accordionExample">
                    <div className="accordion-body">
                        <TablaGrupos {...props}/>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default GestionGrupos;