import config from "../../config";
import {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router";

function ModalAddAnimacionEvento(props){
    const [mensaje_error, setMensajeError] = useState(null);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [id_animacion, setIdAnimacion] = useState(props.id_animacion);

    useEffect(() => {
        setIdAnimacion(props.id_animacion);
    }, [props.id_animacion]);

    const { id_proyecto } = useParams();

    const actualizarAnimacion=async ()=>{
        const url = "/api/animacion/id/"+id_animacion;

        const token = props.user.usuario.token;
        const config_request = {
            method: 'put',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            },
            data : {
                nombre_animacion: nombre,
                descripcion: descripcion,
            }
        }

        let res = await axios(config_request)
            .then(function (response) {
                console.log("actualizar animacion")
                console.log(response.data);
                props.actualizarAnimacion(response.data);
                const btn_cerrar = document.getElementById("btn-cerrar-modal-"+props.accion)
                btn_cerrar.click();
            })
            .catch(function (respuesta) {
                console.log(respuesta)
                const msj = respuesta.response.data.error[0]
                setMensajeError(msj)
            });
    }

    const crearAnimacion=async()=>{
        const url = "/api/animacion";

        const token = props.user.usuario.token;
        const config_request = {
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            },
            data : {
                id_proyecto: id_proyecto,
                nombre: nombre,
                descripcion: descripcion,
            }
        }

        let res = await axios(config_request)
            .then(function (response) {
                console.log("Crear animacion")
                console.log(response.data);
                props.agregarAnimacion(response.data);
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
        const form = document.getElementById("form-proyecto-"+props.accion)

        if (form.checkValidity()) {
            console.log("form validado");
            try {
                if (props.accion === "put"){
                    actualizarAnimacion();
                }
                if (props.accion === "post"){
                    crearAnimacion();
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
                        <h5 class="modal-title" id="exampleModalLabel">{props.accion === "put"? "Actualizar": "Crear"} Animacion</h5>
                        <h6 class="modal-title"> {id_animacion}</h6>
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
                                <input type="text" className="form-control"
                                       aria-describedby="emailHelp" maxLength="20"
                                       onChange={(e)=>setNombre(e.target.value)}
                                       value={nombre} required/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="exampleFormControlTextarea1">Descripción</label>
                                <textarea className="form-control"  rows="3"
                                          value={descripcion}
                                          onChange={(e)=>setDescripcion(e.target.value)}
                                          maxlength="200"></textarea>
                            </div>
                            <button type="submit" id={"agente-submit-"+props.accion} hidden>subir</button>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id={"btn-cerrar-modal-"+props.accion} data-bs-dismiss="modal">Cerrar</button>
                        <button  class="btn btn-primary" id="enviar-proyecto" onClick={enviarFomrulario}>Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModalAddAnimacionEvento;