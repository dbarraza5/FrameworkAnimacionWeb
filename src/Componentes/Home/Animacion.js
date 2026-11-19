import ModalProyecto from "./ModalProyecto";
import {useEffect, useState} from "react";
import {Cookies} from 'react-cookie';
import axios from "axios";
import {useNavigate} from "react-router-dom";
import ModalAddAnimacionEvento from "./ModalAddAnimacionEvento";
import LlavesAutoria from "./LlavesAutoria";
import SonidoProyecto from "../Sonido/SonidoProyecto";
import ListaDocumentos from "./ListaDocumentos";
import HistoriaEscenas from "./HistoriaEscenas";

function Animacion(props) {
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [animaciones, setAnimaciones] = useState([]);
    // organizacion (documento/planeacion_organizacion.md): escenas y assets del proyecto
    const [documentos, setDocumentos] = useState([]);
    const [proyecto, setProyecto] = useState(null);
    const [capitulos, setCapitulos] = useState([]);
    const [ocupado, setOcupado] = useState(false);
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

    const configApi = (method, url, data) => ({
        method, url, data,
        headers: {"Content-Type": "application/json", 'Accept': 'application/json', 'Authorization': 'Bearer ' + datos_usuario.token},
        withCredentials: true,
    });

    // escenas y assets (con su tipo automatico o elegido a mano) y el nombre del proyecto
    const obtenerDocumentos = async () => {
        try {
            const r = await axios(configApi("get", "/api/proyecto/" + props.id_proyecto + "/documentos"));
            setDocumentos(r.data.documentos || []);
            setProyecto(r.data.proyecto || null);
            setCapitulos(r.data.capitulos || []);
        } catch (e) {
            console.log("error obtener documentos", e);
            if (e.response) props.manejadorErrores(e.response.data);
        }
    }

    // capitulos (fase 2): llamada a la API que devuelve los datos; las filas que vuelven reemplazan a las de la lista
    const peticion = async (method, url, data) => (await axios(configApi(method, url, data))).data;
    const actualizarFilas = (filas) => setDocumentos((lista) => {
        const nuevas = new Map(filas.map((f) => [f._id, f]));
        return lista.map((d) => nuevas.get(d._id) || d);
    });
    const agregarFila = (fila) => setDocumentos((lista) => lista.concat([fila]));

    // {tipo?: "escena" | "asset" | null, principal?: bool}
    const cambiarOrganizacion = async (doc, cambios) => {
        setOcupado(true);
        try {
            const r = await axios(configApi("patch", "/api/eventos/" + doc._id + "/organizacion", cambios));
            setDocumentos((lista) => lista.map((d) => {
                if (d._id === r.data._id) return r.data;
                // solo una escena principal por proyecto
                if (cambios.principal === true && d.principal) return {...d, principal: false};
                return d;
            }));
        } catch (e) {
            console.log("error organizacion", e);
            alert((e.response && e.response.data && e.response.data.error) || "No se pudo guardar el cambio");
        } finally {
            setOcupado(false);
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
        obtenerDocumentos();
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
            <h2>Proyecto <b>{proyecto ? proyecto.nombre : ""}</b></h2>
            <br/>
            <nav>
                <div className="nav nav-tabs" id="nav-tab" role="tablist">
                    <button className="nav-link active" id="nav-escenas-tab" data-bs-toggle="tab"
                            data-bs-target="#nav-escenas" type="button" role="tab" aria-controls="nav-escenas"
                            aria-selected="true">
                        <i className="bi bi-film me-1"/>Escenas <span className="badge bg-secondary">{documentos.filter((d) => d.tipo === "escena").length}</span>
                    </button>
                    <button className="nav-link" id="nav-assets-tab" data-bs-toggle="tab" data-bs-target="#nav-assets"
                            type="button" role="tab" aria-controls="nav-assets" aria-selected="false">
                        <i className="bi bi-box-seam me-1"/>Assets <span className="badge bg-secondary">{documentos.filter((d) => d.tipo === "asset" && !(d.nombre === "evento_default" && !d.manual)).length}</span>
                    </button>
                    <button className="nav-link" id="nav-home-tab" data-bs-toggle="tab"
                            data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home"
                            aria-selected="false"><i className="bi bi-brush me-1"/>Dibujos
                    </button>
                    <button className="nav-link" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact"
                            type="button" role="tab" aria-controls="nav-contact" aria-selected="false">Movimientos
                    </button>
                    <button className="nav-link" id="nav-asistente-tab" data-bs-toggle="tab" data-bs-target="#nav-asistente"
                            type="button" role="tab" aria-controls="nav-asistente" aria-selected="false">
                        <i className="bi bi-robot me-1"/>Asistente
                    </button>
                    <button className="nav-link" id="nav-sonido-tab" data-bs-toggle="tab" data-bs-target="#nav-sonido"
                            type="button" role="tab" aria-controls="nav-sonido" aria-selected="false">
                        <i className="bi bi-volume-up me-1"/>Sonido
                    </button>
                </div>
            </nav>
            <div className="tab-content" id="nav-tabContent">
                <hr/>
                <div className="tab-pane fade show active" id="nav-escenas" role="tabpanel" aria-labelledby="nav-escenas-tab">
                    <HistoriaEscenas id_proyecto={props.id_proyecto} capitulos={capitulos} setCapitulos={setCapitulos}
                                     documentos={documentos} actualizarFilas={actualizarFilas} agregarFila={agregarFila}
                                     abrir={irEdicionEdicion} cambiar={cambiarOrganizacion} peticion={peticion}/>
                </div>
                <div className="tab-pane fade" id="nav-assets" role="tabpanel" aria-labelledby="nav-assets-tab">
                    <ListaDocumentos tipo="asset" documentos={documentos} abrir={irEdicionEdicion} cambiar={cambiarOrganizacion} ocupado={ocupado}/>
                </div>
                <div className="tab-pane fade" id="nav-home" role="tabpanel"
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
                <div className="tab-pane fade" id="nav-contact" role="tabpanel" aria-labelledby="nav-contact-tab">...
                </div>
                <div className="tab-pane fade" id="nav-asistente" role="tabpanel" aria-labelledby="nav-asistente-tab">
                    <LlavesAutoria id_proyecto={props.id_proyecto}/>
                </div>
                <div className="tab-pane fade" id="nav-sonido" role="tabpanel" aria-labelledby="nav-sonido-tab">
                    <SonidoProyecto id_proyecto={props.id_proyecto}/>
                </div>
            </div>

        </div>

    )
}

export default Animacion