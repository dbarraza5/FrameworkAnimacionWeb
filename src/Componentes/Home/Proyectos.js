import { Cookies } from 'react-cookie';
import {useEffect, useRef, useState} from "react";
import {exportarProyecto, exportarTodos, importarProyectos} from "./apiRespaldo";
import axios from "axios";
import config from "../../config";
import ModalProyecto from "./ModalProyecto";
import {redirect} from "react-router-dom";
import {useNavigate} from "react-router";


function Proyectos(props){
    //const [cookies, setCookie, removeCookie] = useCookies(['cookie-name']);
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")
    //console.log("Cookie: ")
    //console.log(datos_usuario)
    const [proyectos, setProyectos] = useState([])

    const removerCookieUser_=props.removeCookieUser;

    const obtenerListaProyectos=async()=>{
        //console.log("obteniendo proyectos");
        try {
            const url = "api/proyecto/user/"+datos_usuario.id;
            //console.log("url: "+url)
            if(true){
                //console.log(cookie)
                const token = datos_usuario.token
                const config = {
                    method: 'get',
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                        'Accept': 'application/json',
                        'Authorization': 'Bearer '+token,
                        //'Cookie': 'app.sid=s%3AvQpGktI'
                    },
                    withCredentials: true
                };

                let res = await axios(config)
                    .then(function (response) {
                        //console.log("funciono")
                        //console.log(response.data);
                        setProyectos(response.data)
                    })
                    .catch(function (response) {
                        console.log("error obtener proyectos")
                        console.log(response.response.data);
                        props.manejadorErrores(response.response.data)
                    });
            }

        } catch (err) {
            //console.log(err);
        }
    }

    const abrirModal=(p)=>{
        const input_nombre = document.getElementById("nombre-proyecto-put")
        input_nombre.value = p.nombre;

        const input_descripcion = document.getElementById("descripcion-proyecto-put")
        input_descripcion.value = p.descripcion;

        const btn_enviar = document.getElementById("enviar-proyecto")
        btn_enviar.value = p._id
    }

    const eliminarProyecto=async (id_proyecto)=>{
        const url ="api/proyecto/id/"+id_proyecto;

        const token = props.user.usuario.token;
        const config_request = {
            method: 'delete',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token,
            }
        }

        try {
            let res = await axios(config_request)
                .then(function (response) {
                    console.log("Borrando animacion")
                    //console.log(response.data);
                    //const nuevo_proyecto = response.data;
                    const proyectos_act = proyectos.filter((p)=>{
                        if(p._id !== id_proyecto){
                            return true;
                        }
                        return false
                    })
                    console.log(proyectos_act)
                    console.log("TERMIINO DEL PROE")
                    setProyectos(proyectos_act);
                    const btn_cerrar = document.getElementById("btn-cerrar-modal-"+props.accion)
                    btn_cerrar.click();
                })
                .catch(function (respuesta) {
                    //const msj = respuesta.response.data.error[0]
                    //props.setMensajeError(msj)
                });
        }
        catch(err) {
            console.log(err)
            //document.getElementById("demo").innerHTML = err.message;
        }



    }

    useEffect(()=>{
        obtenerListaProyectos();
    },[])

    // Respaldo: exportar a .zip / importar (apiRespaldo.js)
    const [respaldo, setRespaldo] = useState(null);     // {ocupado, tipo: "info"|"success"|"danger", texto}
    const refImportar = useRef(null);
    const conRespaldo = async (inicio, accion) => {
        setRespaldo({ocupado: true, tipo: "info", texto: inicio});
        try { setRespaldo({ocupado: false, ...(await accion())}); }
        catch (e) { setRespaldo({ocupado: false, tipo: "danger", texto: e.message}); }
    };
    const exportar = (p) => conRespaldo(`Exportando "${p.nombre}"…`, async () =>
        ({tipo: "success", texto: `Descargado ${await exportarProyecto(p._id)}`}));
    const exportarTodo = () => conRespaldo("Exportando todos los proyectos…", async () =>
        ({tipo: "success", texto: `Descargado ${await exportarTodos()}`}));
    const importar = (archivo) => conRespaldo(`Importando ${archivo.name}…`, async () => {
        const r = await importarProyectos(archivo);
        await obtenerListaProyectos();
        const bien = r.filter((x) => !x.error), mal = r.filter((x) => x.error);
        const linea = (x) => `"${x.nombre}"${x.renombrado ? " (el nombre ya existía)" : ""}: ${x.conteos.eventos} assets/escenas, ` +
            `${x.conteos.animaciones} dibujos, ${x.conteos.sonidos} sonidos, ${x.archivos} archivos` + (x.avisos.length ? ` — ${x.avisos.join("; ")}` : "");
        return {tipo: mal.length ? (bien.length ? "warning" : "danger") : "success",
            texto: [`Importado(s) ${bien.length} proyecto(s)`, ...bien.map(linea), ...mal.map((x) => `${x.archivo}: ${x.error}`)].join("\n")};
    });

    const navigate = useNavigate();

    return(
        <div className="table-responsive">
            <div className="table-wrapper">
                <div className="table-title">

                    <div className="container-fluid">

                        <div className="row">
                            <div className="col-sm-6">
                                <h2>Proyecto <b>Animación</b></h2>
                            </div>
                            <div className="col-sm-6 d-flex justify-content-end gap-2 flex-wrap">
                                <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                                        data-bs-target={"#modal-crear-proyecto"}>
                                    <i className="bi bi-plus-circle"></i> <span>Agregar</span>
                                </button>
                                <button type="button" className="btn btn-outline-secondary" disabled={respaldo && respaldo.ocupado}
                                        title="Recuperar un proyecto (o varios) desde un .zip exportado"
                                        onClick={() => refImportar.current && refImportar.current.click()}>
                                    <i className="bi bi-upload"></i> <span>Importar</span>
                                </button>
                                <button type="button" className="btn btn-outline-secondary" disabled={(respaldo && respaldo.ocupado) || !proyectos.length}
                                        title="Un .zip con todos tus proyectos: datos, imágenes y sonidos"
                                        onClick={exportarTodo}>
                                    <i className="bi bi-download"></i> <span>Exportar todos</span>
                                </button>
                                <input type="file" accept=".zip,application/zip" ref={refImportar} style={{display: "none"}}
                                       data-prueba="importar-proyecto"
                                       onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) importar(f); }}/>
                            </div>
                        </div>
                        {respaldo && (
                            <div className={`alert alert-${respaldo.tipo} py-2 mt-2 mb-0 d-flex align-items-start`} style={{whiteSpace: "pre-line"}}>
                                {respaldo.ocupado && <span className="spinner-border spinner-border-sm me-2 mt-1"></span>}
                                <div className="flex-grow-1">{respaldo.texto}</div>
                                {!respaldo.ocupado && <button type="button" className="btn-close" onClick={() => setRespaldo(null)}></button>}
                            </div>
                        )}

                    </div>
                </div>
                <table className="table">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Descripción</th>
                        <th scope="col">Fecha Creación</th>
                        <th scope="col">Fecha Actualización</th>
                        <th scope="col">Opciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {proyectos.map((p, index)=>{
                        const fecha_creacion = new Date(p.fecha_creacion).toLocaleString();
                        const fecha_actualizacion = new Date(p.fecha_actualizacion).toLocaleString();

                        const id_modal = "modal_proyec_"+p._id;

                        return(
                            <tr>
                                <th scope="row">{index+1}</th>
                                <td>{p.nombre}</td>
                                <td>{p.descripcion?p.descripcion.substring(0, 30): ""}...</td>
                                <td>{fecha_creacion}</td>
                                <td>{fecha_actualizacion}</td>
                                <td>
                                    <div className="btn-group btn-group-sm" role="group" aria-label="Basic outlined example">
                                        <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal"
                                                data-bs-target={"#modal-actualizar-proyecto"} onClick={(e)=>abrirModal(p)}>
                                            <i className="bi bi-pencil"></i></button>
                                        <button type="button" className="btn btn-outline-primary"
                                        onClick={()=>navigate("list-animaciones/"+p._id)}>
                                            <i className="bi bi-eye"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-primary" title="Exportar a .zip (respaldo completo)"
                                                disabled={respaldo && respaldo.ocupado} onClick={() => exportar(p)}>
                                            <i className="bi bi-download"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-primary" onClick={()=>eliminarProyecto(p._id)}>
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
            <ModalProyecto id_modal="modal-actualizar-proyecto" accion="put" user={props.user} proyectos={proyectos} setProyectos={setProyectos}/>
            <ModalProyecto id_modal="modal-crear-proyecto" accion="post" user={props.user} proyectos={proyectos} setProyectos={setProyectos}/>
        </div>
    )
}

export default Proyectos;