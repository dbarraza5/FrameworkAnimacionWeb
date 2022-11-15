import config from "../../config";
import {useState} from "react";

function ModalProyectos(props){
    const url = config.SERVIDOR_BACKEND + "/api/proyecto/id/"+props.p._id;
    console.log("url_proyecto: "+url);
    //const proyecto = {...props.p}
    const [proyecto, setProyecto] = useState({...props.p})

    const ingresarValorCampo = (e) => {
        let {name, value} = e.target;
        let nuevoDatos = {...proyecto, [name]: value};
        setProyecto(nuevoDatos)
    }

    return (
        <div class="modal fade" id={props.id} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Proyecto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form method="PUT" action={url}>
                            <div className="mb-3">
                                <label htmlFor="exampleInputEmail1" className="form-label">Nombre</label>
                                <input type="email" className="form-control" id="nombre"
                                       aria-describedby="emailHelp" value={proyecto.nombre}
                                       onChange={ingresarValorCampo}/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="exampleFormControlTextarea1">Descripción</label>
                                <textarea className="form-control" id="descripcion" rows="3" value={proyecto.descripcion}
                                          onChange={ingresarValorCampo}></textarea>
                            </div>

                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalProyectos;