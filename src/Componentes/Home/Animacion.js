import ModalProyecto from "./ModalProyecto";
import {useEffect, useState} from "react";
import {Cookies} from 'react-cookie';
import axios from "axios";
import {useNavigate} from "react-router-dom";
import ModalAddAnimacionEvento from "./ModalAddAnimacionEvento";

function Animacion(props) {
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [animaciones, setAnimaciones] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [animacionSelect, setAnimacionSelect] = useState( null);

    const navigate = useNavigate();

    const obtenerListaAnimaciones = async () => {
        try {
            const url = "/api/animacion/proyecto-slim/" + props.id_proyecto;

            const token = datos_usuario.token
            const config = {
                method: 'get',
                url: url,
                headers: {
                    "Content-Type": "application/json",
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                withCredentials: true
            };

            let res = await axios(config)
                .then(function (response) {
                    console.log("funciono")
                    console.log(response.data);
                    setAnimaciones(response.data)
                })
                .catch(function (response) {
                    console.log("error obtener proyectos")
                    console.log(response.response.data);
                    props.manejadorErrores(response.response.data)
                });
        } catch (err) {
            //console.log(err);
        }
    }

    const obtenerListaEventos = async () => {
        try {
            const url = "/api/eventos/proyecto-slim/" + props.id_proyecto;

            const token = datos_usuario.token
            const config = {
                method: 'get',
                url: url,
                headers: {
                    "Content-Type": "application/json",
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                withCredentials: true
            };

            let res = await axios(config)
                .then(function (response) {
                    console.log("funciono")
                    console.log(response.data);
                    setEventos(response.data)
                })
                .catch(function (response) {
                    console.log("error obtener proyectos")
                    console.log(response.response.data);
                    props.manejadorErrores(response.response.data)
                });
        } catch (err) {
            //console.log(err);
        }
    }

    const eliminarAnimacion=async (id_animacion)=>{
        const url = "/api/animacion/id/"+id_animacion;

        const token = props.user.usuario.token;
        const config_request = {
            method: 'delete',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            }
        }

        let res = await axios(config_request)
            .then(function (response) {
                const lista = animaciones.filter((anima_)=>{
                    return anima_._id !== id_animacion;
                });
                setAnimaciones(lista);
            })
            .catch(function (respuesta) {
                console.log(respuesta)
                const msj = respuesta.response.data.error[0]
                alert(msj);
            });
    }

    useEffect(()=>{
        obtenerListaAnimaciones();
        obtenerListaEventos();
    }, [])

    const editarDatosBasicos=(id_animacion)=>{
        //alert(id_animacion);
        setAnimacionSelect(id_animacion);
        const btn_modal = document.getElementById("btn-modal-actualizar")
        btn_modal.click();
    }

    const irEdicionAnimacion=(id_animacion)=>{
        navigate("/animacion/"+id_animacion)
    }

    const irEdicionEdicion=(id_evento)=>{
        navigate("/evento/"+id_evento)
    }

    const agregarAnimacion = (animacion_)=>{
        animaciones.push(animacion_);
        setAnimaciones([...animaciones]);
    }

    const actualizarAnimacion = (animacion_)=>{
        const lista = animaciones.map((anima_)=>{
            if(anima_._id === animacion_._id){
                return animacion_;
            }
            return anima_;
        });
        setAnimaciones(lista);
    }

    return (
        <div>
            <h2>Proyecto <b>{props.nombre_proyecto}</b></h2>
            <br/>
            <nav>
                <div className="nav nav-tabs" id="nav-tab" role="tablist">
                    <button className="nav-link active" id="nav-home-tab" data-bs-toggle="tab"
                            data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home"
                            aria-selected="true">Objetos
                    </button>
                    <button className="nav-link" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile"
                            type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Eventos
                    </button>
                    <button className="nav-link" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact"
                            type="button" role="tab" aria-controls="nav-contact" aria-selected="false">Movimientos
                    </button>
                </div>
            </nav>
            <div className="tab-content" id="nav-tabContent">
                <hr/>
                <div className="tab-pane fade show active" id="nav-home" role="tabpanel"
                     aria-labelledby="nav-home-tab">

                    <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                            data-bs-target="#modal-agregar-animacion"><i className="bi bi-plus-circle"></i>
                        <span>Agregar</span>
                    </button>
                    <ModalAddAnimacionEvento id_modal="modal-agregar-animacion" accion="post"
                                             user={props.user} proyectos={null} setProyectos={null}
                                             agregarAnimacion={agregarAnimacion}
                    />

                    <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                            id="btn-modal-actualizar"
                            data-bs-target="#modal-actualizar-animacion" hidden={true}>
                        <i className="bi bi-plus-circle"></i>
                        <span>editar</span>
                    </button>
                    <ModalAddAnimacionEvento id_modal="modal-actualizar-animacion" accion="put"
                                             user={props.user}
                                             id_animacion={animacionSelect}
                                             actualizarAnimacion={actualizarAnimacion}
                    />

                    <br/>
                    <div className="table-responsive">
                        <div className="table-wrapper">
                            <div className="table-title">

                                <div className="container-fluid">
                                </div>
                            </div>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Fecha Creación</th>
                                    <th scope="col">Fecha Actualización</th>
                                    <th scope="col">Opciones</th>
                                </tr>
                                </thead>
                                <tbody>
                                {animaciones.map((animacion, index) => {
                                    const fecha_creacion = new Date(animacion.fecha_creacion).toLocaleString();
                                    const fecha_actualizacion = new Date(animacion.fecha_actualizacion).toLocaleString();

                                    return (
                                        <tr>
                                            <th scope="row">{index + 1}</th>
                                            <td>{animacion.nombre_animacion}</td>
                                            <td>{fecha_creacion}</td>
                                            <td>{fecha_actualizacion}</td>
                                            <td>
                                                <div className="btn-group btn-group-sm" role="group"
                                                     aria-label="Basic outlined example">
                                                    <button type="button" className="btn btn-outline-primary"
                                                            // data-bs-toggle="modal"
                                                            // data-bs-target={"#modal-actualizar-proyecto"}
                                                            onClick={()=>editarDatosBasicos(animacion._id)}>
                                                        <i className="bi bi-pencil"></i></button>
                                                    <button type="button" className="btn btn-outline-primary" onClick={()=>irEdicionAnimacion(animacion._id)}>
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    <button type="button" className="btn btn-outline-primary"
                                                            onClick={() => eliminarAnimacion(animacion._id)}>
                                                        <i className="bi bi-eraser"></i>
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>

                                    )
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="tab-pane fade" id="nav-profile" role="tabpanel" aria-labelledby="nav-profile-tab">

                    <br/>
                    <div className="table-responsive">
                        <div className="table-wrapper">
                            <div className="table-title">

                                <div className="container-fluid">
                                </div>
                            </div>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Fecha Creación</th>
                                    <th scope="col">Fecha Actualización</th>
                                    <th scope="col">Opciones</th>
                                </tr>
                                </thead>
                                <tbody>
                                {eventos.map((evento, index) => {
                                    const fecha_creacion = new Date(evento.fecha_creacion).toLocaleString();
                                    const fecha_actualizacion = new Date(evento.fecha_actualizacion).toLocaleString();

                                    return (
                                        <tr>
                                            <th scope="row">{index + 1}</th>
                                            <td>{evento.nombre}</td>
                                            <td>{fecha_creacion}</td>
                                            <td>{fecha_actualizacion}</td>
                                            <td>
                                                <div className="btn-group btn-group-sm" role="group"
                                                     aria-label="Basic outlined example">
                                                    <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                                                            data-bs-target={"#modal-actualizar-proyecto"}
                                                            onClick={(e) => console.log("editar")}>
                                                        <i className="bi bi-pencil"></i></button>
                                                    <button type="button" className="btn btn-outline-primary" onClick={()=>irEdicionEdicion(evento._id)}>
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    <button type="button" className="btn btn-outline-primary"
                                                            onClick={() => console.log("eliminar")}>
                                                        <i className="bi bi-eraser"></i>
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>

                                    )
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
                <div className="tab-pane fade" id="nav-contact" role="tabpanel" aria-labelledby="nav-contact-tab">...
                </div>
            </div>

        </div>

    )
}

export default Animacion