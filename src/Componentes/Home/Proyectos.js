import { Cookies } from 'react-cookie';
import {useEffect, useState} from "react";
import axios from "axios";
import config from "../../config";
import ModalProyecto from "./ModalProyecto";



function Proyectos(){
    //const [cookies, setCookie, removeCookie] = useCookies(['cookie-name']);
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")
    console.log("Cookie: ")
    console.log(datos_usuario)
    const [proyectos, setProyectos] = useState([])



    const obtenerListaProyectos=async()=>{
        console.log("obteniendo proyectos");
        try {
            const url = config.SERVIDOR_BACKEND + "/api/proyecto/user/"+datos_usuario.id;
            console.log("url: "+url)
            if(true){
                let res = await axios.get(url)
                    .then(function (response) {
                        console.log("funciono")
                        console.log(response.data);
                        setProyectos(response.data)
                    })
                    .catch(function (error) {
                        console.log("error")
                        console.log(error);
                    });
            }

        } catch (err) {
            //console.log(err);
        }
    }

    const CambioValoresProyecto=(e, p)=>{
        proyectos.map((proyecto)=>{
            if(proyecto._id === p._id){

            }
            return proyecto;
        })
    }

    useEffect(()=>{
        obtenerListaProyectos();
    },[])

    return(
        <div className="table-responsive">
            <div className="table-wrapper">
                <div className="table-title">

                    <div className="container-fluid">

                        <div className="row">
                            <div className="col-sm-9">
                                <h2>Proyecto <b>Animación</b></h2>
                            </div>
                            <div className="col-sm-3">
                                <button type="button" className="btn btn-outline-primary">
                                    <i className="bi bi-plus-circle"></i> <span>Agregar</span>
                                </button>
                                <button type="button" className="btn btn-outline-primary">
                                    <i className="bi bi-eraser"></i> <span>Borrar</span>
                                </button>


                            </div>
                        </div>

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
                                        <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target={"#"+id_modal}>
                                            <i className="bi bi-eye"></i></button>
                                        <button type="button" className="btn btn-outline-primary">
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-primary">
                                            <i className="bi bi-eraser"></i>
                                        </button>
                                    </div>
                                </td>
                                <ModalProyecto id = {id_modal} p={p}/>
                            </tr>

                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>


    )
}

export default Proyectos;