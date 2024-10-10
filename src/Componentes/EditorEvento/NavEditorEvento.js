import ButtonNav from "../EditorMapa/ButtonNav";
import NavFiguras from "../EditorAnimacion/SeccionFiguras/NavFiguras";
import {deshacer, rehacer} from "../../Store/Animacion/animacionSlice";
import Lienzo from "../EditorAnimacion/Lienzo";

function NavEditorEvento(props){

    const graph = {
        nodes: [
            { id: 1, label: "Node 1", title: "node 1 tootip text" },
            { id: 2, label: "Node 2", title: "node 2 tootip text" },
            { id: 3, label: "Node 3", title: "node 3 tootip text" },
            { id: 4, label: "Node 4", title: "node 4 tootip text" },
            { id: 5, label: "Node 5", title: "node 5 tootip text" }
        ],
        edges: [
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 2, to: 4 },
            { from: 2, to: 5 }
        ]
    };

    const options = {
        layout: {
            hierarchical: true
        },
        edges: {
            color: "#000000"
        },
        height: "500px"
    };

    const events = {
        select: function(event) {
            var { nodes, edges } = event;
            console.log(nodes)
        }
    };
    console.log("NAV EDITOR");
    console.log(props.eventoAnimacion.edicion.lista_raw_evento)
    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="home-tab" data-bs-target="#home-tab-pane">Grupos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="profile-tab" data-bs-target="#profile-tab-pane">Movimientos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab" data-bs-target="#contact-tab-pane">Composicion</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane" role="tabpanel"
                 aria-labelledby="home-tab"
                 tabIndex="0">figuras

                <div>
                    <br/>
                    <div className="row">
                        <div className="col">
                            {/*<NavFiguras {...props}/>*/}
                            sdfsdfsfd;
                            {JSON.stringify(props.eventoAnimacion.edicion.lista_raw_evento)}
                        </div>
                        <div className="col">
                            <div className="card text-bg-light mb-3">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h6 className="card-title mb-0 text-start">evento <strong>;D</strong></h6>

                                    <div className="btn-group" role="group" aria-label="Basic example">
                                        <button type="button" className="btn btn-primary"

                                                >
                                            <i className="bi bi-arrow-left"></i>
                                        </button>
                                        <button type="button" className="btn btn-primary"
                                                >
                                            <i className="bi bi-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <Lienzo lienzo = {null} id="lienzo-animacion" editar_animacion={null}
                                            setEventLienzoFigura={props.setEventLienzoFigura}/>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel"
                 aria-labelledby="profile-tab"
                 tabIndex="1">

            </div>
            <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel"
                 aria-labelledby="contact-tab"
                 tabIndex="2">
                composicion
            </div>
        </div>
    </div>)
}

export default NavEditorEvento