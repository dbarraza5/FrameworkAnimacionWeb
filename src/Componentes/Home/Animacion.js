import ModalProyecto from "./ModalProyecto";
import {useEffect, useState} from "react";
import {Cookies} from 'react-cookie';
import axios from "axios";
import {useNavigate} from "react-router-dom";

function Animacion(props) {
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [animaciones, setAnimaciones] = useState([]);
    const [eventos, setEventos] = useState([]);
    //const [nombre_pro, setAnimaciones] = useState([]);

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

    useEffect(()=>{
        obtenerListaAnimaciones();
        obtenerListaEventos();
    }, [])

    const irEdicionAnimacion=(id_animacion)=>{
        navigate("/animacion/"+id_animacion)
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
                <div className="tab-pane fade show active" id="nav-home" role="tabpanel"
                     aria-labelledby="nav-home-tab">
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
                                                    <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                                                            data-bs-target={"#modal-actualizar-proyecto"}
                                                            onClick={(e) => console.log("editar")}>
                                                        <i className="bi bi-pencil"></i></button>
                                                    <button type="button" className="btn btn-outline-primary" onClick={()=>irEdicionAnimacion(animacion._id)}>
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
                                                    <button type="button" className="btn btn-outline-primary" onClick={()=>irEdicionAnimacion(evento._id)}>
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