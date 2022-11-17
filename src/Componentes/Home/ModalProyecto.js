import config from "../../config";
import {useState} from "react";
import axios from "axios";

function ModalProyectos(props){

    const ingresarValorCampo = (e) => {
        /*let {name, value} = e.target;
        let nuevoDatos = {...proyecto, [name]: value};
        setProyecto(nuevoDatos)*/
    }

    const [mensaje_error, setMensajeError] = useState(null)

    const enviarFomrulario=async ()=>{
        const url = config.SERVIDOR_BACKEND + "/api/proyecto/id/"+
            document.getElementById("enviar-proyecto").value;
        const datos = {
            nombre: document.getElementById("nombre-proyecto").value,
            descripcion: document.getElementById("descripcion-proyecto").value,
        }

        const form = document.getElementById("form-proyecto")

        if (form.checkValidity()) {
            console.log("form validado");
            try {
                let res = await axios.put(url, datos)
                    .then(function (response) {
                        console.log("funciono1")
                        console.log(response.data);
                        //window.location = "/"
                        const nuevo_proyecto = response.data;
                        const proyectos_act = props.proyectos.map((p)=>{
                            if(p._id === nuevo_proyecto._id){
                                return nuevo_proyecto
                            }
                            return p;
                        })
                        props.setProyectos(proyectos_act);
                        const btn_cerrar = document.getElementById("btn-cerrar-modal")
                        btn_cerrar.click();
                    })
                    .catch(function (respuesta) {
                        const msj = respuesta.response.data.error[0]
                        console.log("error")
                        console.log(msj);
                        setMensajeError(msj)
                    });
            } catch (err) {
                //console.log(err);
            }
        } else {
            console.log("form invalidado")
            const btn = document.getElementById("agente-submit")
            btn.click();
        }
    }


    return (
        <div class="modal fade" id="modal-proyecto" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Actualizar Proyecto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        {(()=>{
                            if(mensaje_error !== null){
                                return(
                                    <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                        {mensaje_error}
                                        <button type="button" className="btn-close" data-bs-dismiss="alert"
                                                aria-label="Close"></button>
                                    </div>
                                )
                            }
                        })()}

                        <form id="form-proyecto" action="" onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-3">
                                <label htmlFor="exampleInputEmail1" className="form-label">Nombre</label>
                                <input type="text" className="form-control" id="nombre-proyecto"
                                       aria-describedby="emailHelp"
                                       onChange={ingresarValorCampo} required/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="exampleFormControlTextarea1">Descripción</label>
                                <textarea className="form-control" id="descripcion-proyecto" rows="3"
                                          onChange={ingresarValorCampo} maxlength="200"></textarea>
                            </div>
                            <button type="submit" id="agente-submit" hidden>subir</button>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btn-cerrar-modal" data-bs-dismiss="modal">Close</button>
                        <button  class="btn btn-primary" id="enviar-proyecto" onClick={enviarFomrulario}>Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalProyectos;