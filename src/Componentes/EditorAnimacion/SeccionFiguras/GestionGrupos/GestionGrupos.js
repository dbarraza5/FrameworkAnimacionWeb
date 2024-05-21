import CrearGrupo from "./CrearGrupo";
import ListaGrupos from "../EditarGrupo/ListaGrupos";
import TablaGrupos from "./TablaGrupos";
import GestionGruposLienzo from "../GestionGrupoLienzo/GestionGruposLienzo";

function GestionGrupos(props){
    //https://getbootstrap.com/docs/5.0/components/accordion/
    return(<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <button className="nav-link active" id="crear-grupo-tab" data-bs-toggle="tab" data-bs-target="#home"
                        type="button" role="tab" aria-controls="home" aria-selected="true">Crear
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="editar-grupo-tab" data-bs-toggle="tab" data-bs-target="#profile"
                        type="button" role="tab" aria-controls="profile" aria-selected="false">Editar
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="operaciones-grupo-tab" data-bs-toggle="tab" data-bs-target="#contact"
                        type="button" role="tab" aria-controls="contact" aria-selected="false">Operaciones
                </button>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="crear-grupo-tab">
                <br/>
                <CrearGrupo {...props}/>
                <TablaGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="editar-grupo-tab">
                <br/>
                <ListaGrupos {...props}/>
            </div>
            <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="operaciones-grupo-tab">
                <GestionGruposLienzo {...props}/>
            </div>
        </div>
    </div>)
}

export default GestionGrupos;