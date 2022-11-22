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

    const actualizarProyecto=async (datos)=>{
        const url = "api/proyecto/id/"+
            document.getElementById("enviar-proyecto").value;

        const token = props.user.usuario.token;
        const config_request = {
            method: 'put',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            },
            data : datos
        }

        let res = await axios(config_request)
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
                const btn_cerrar = document.getElementById("btn-cerrar-modal-"+props.accion)
                btn_cerrar.click();
            })
            .catch(function (respuesta) {
                const msj = respuesta.response.data.error[0]
                setMensajeError(msj)
            });
    }

    const crearProyecto=async(datos)=>{
        const url = "api/proyecto";

        const token = props.user.usuario.token;
        const config_request = {
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            },
            data : datos
        }

        let res = await axios(config_request)
            .then(function (response) {
                console.log("Crear Proyecto")
                console.log(response.data);
                //window.location = "/"
                const nuevo_proyecto = response.data;
                props.proyectos.push(nuevo_proyecto)
                console.log(props.proyectos)
                props.setProyectos([...props.proyectos]);
                const btn_cerrar = document.getElementById("btn-cerrar-modal-"+props.accion)
                btn_cerrar.click();
            })
            .catch(function (respuesta) {
                console.log(respuesta)
                const msj = respuesta.response.data.error[0]
                setMensajeError(msj)
            });
    }

    const enviarFomrulario=async ()=>{
        const datos = {
            nombre: document.getElementById("nombre-proyecto-"+props.accion).value,
            descripcion: document.getElementById("descripcion-proyecto-"+props.accion).value,
        }

        const form = document.getElementById("form-proyecto-"+props.accion)

        if (form.checkValidity()) {
            console.log("form validado");
            try {
                if (props.accion === "put"){
                    actualizarProyecto(datos);
                }
                if (props.accion === "post"){
                    crearProyecto(datos);
                }
            } catch (err) {
                //console.log(err);
            }
        } else {
            console.log("form invalidado")
            const btn = document.getElementById("agente-submit-"+props.accion)
            btn.click();
        }
    }


    return (
        <div class="modal fade" id={props.id_modal} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">{props.accion === "put"? "Actualizar": "Crear"} Proyecto</h5>
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

                        <form id={"form-proyecto-"+props.accion} action="" onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-3">
                                <label htmlFor="exampleInputEmail1" className="form-label">Nombre</label>
                                <input type="text" className="form-control" id={"nombre-proyecto-"+props.accion}
                                       aria-describedby="emailHelp" maxLength="20"
                                       onChange={ingresarValorCampo} required/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="exampleFormControlTextarea1">Descripción</label>
                                <textarea className="form-control" id={"descripcion-proyecto-"+props.accion} rows="3"
                                          onChange={ingresarValorCampo} maxlength="200"></textarea>
                            </div>
                            <button type="submit" id={"agente-submit-"+props.accion} hidden>subir</button>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id={"btn-cerrar-modal-"+props.accion} data-bs-dismiss="modal">Close</button>
                        <button  class="btn btn-primary" id="enviar-proyecto" onClick={enviarFomrulario}>Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalProyectos;