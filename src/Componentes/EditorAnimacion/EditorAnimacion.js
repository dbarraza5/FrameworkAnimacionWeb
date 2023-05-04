/*const {Component} = require("react");

class EditorAnimacion extends Component{

}*/

import NavEditorAnimacion from "./NavEditorAnimacion";
import SeleccionFigura from "./SeccionFiguras/GestionFiguras/SeleccionFigura";
import React, {useEffect, useState} from "react";
import EdicionFiguras from "./SeccionFiguras/EdicionFiguras";
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import GestionLienzoAnimacion from "../../Clases/EditorAnimacion/GestionLienzoAnimacion";
import Lienzo from "./Lienzo";
import ControlEventoLienzoFigura from "../../Clases/EditorAnimacion/ControlEventoLienzoFigura";
import EditorCompisicion from "./Composicion/EditorComposicion";
import axios from "axios";
import {Cookies} from 'react-cookie';
import MenuAnimacion from "./MenuAnimacion";
import Home from "../Home/Home";

const useCustomAnimacion=(valor_inicial=null)=>{
    const [animacion_, setAnimacion_] = useState(valor_inicial);

    function setCustomAnimacion(animacion_aux){
        console.log("set animacion custom")

        setAnimacion_(animacion_aux)
    }

    return [animacion_, setCustomAnimacion]
}


function EditorAnimacion(props) {

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [animacion, setAnimacion] = useCustomAnimacion({edicion: new GestionAnimacion()});
    const [gestionLienzo, setGestionLienzo] = useState(new GestionLienzoAnimacion(animacion));
    const [eventoLienzoFigura, setEventLienzoFigura] = useState(new ControlEventoLienzoFigura());

    useEffect(()=>{
        gestionLienzo.animacion_=animacion.edicion;
        gestionLienzo.actualizarLienzo(animacion.edicion)
    },[animacion])

    const obtenerAnimacion=async ()=>{
        try {
            const url = "/api/animacion/id/" + props.id_animacion;

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
                    animacion.edicion.meta_figuras = response.data.meta_figuras
                    animacion.edicion.meta_movimientos = response.data.meta_movimientos;
                    animacion.edicion.grupos_figuras = response.data.grupos_figuras

                    animacion.edicion.id_proyecto = response.data._id;
                    animacion.edicion.nombre_proyecto = response.data.nombre_animacion;
                    //customSetAnimacion(animacion)
                    setAnimacion({"edicion": animacion.edicion})
                    //setAnimaciones(response.data)
                })
                .catch(function (response) {
                    console.log("error obtener proyectos")
                    console.log(response.response.data);
                    props.manejadorErrores(response.response.data)
                });


        } catch (err) {
            console.log(err);
        }
    }

    const subirAnimacion=async ()=>{
        console.log("SUBBBBBBEEEEEEEE!!!!")
        try{
            const datos = {
                grupos_figuras: animacion.edicion.grupos_figuras
            }

            const url = "/api/animacion/id/" + props.id_animacion;
            const token = datos_usuario.token
            const config = {
                method: 'put',
                url: url,
                headers: {
                    "Content-Type": "application/json",
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                withCredentials: true,
                data : datos
            };

            let res = await axios(config)
                .then(function (response) {
                    console.log("SUBIENDO ANIMACION")
                    console.log(response.data);
                })
                .catch(function (response) {
                    console.log("error subir proyectos")
                    console.log(response.response.data);
                    props.manejadorErrores(response.response.data)
                });
        }catch (err){
            console.log(err)
        }
    }

    const exportandoAnimacion = async () => {
        console.log("EXPORTANDO LA ANIMACION")
        console.log(animacion)
        const miArray = animacion.edicion.grupos_figuras;

        const jsonString = JSON.stringify(miArray);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "miArchivo.json";
        a.click();

        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        //const liezo = new GestionLienzoAnimacion()
        //console.log(gestionLienzo)
        console.log("[==============================ANIMACION===========================]")
        obtenerAnimacion();
    },[]);

    const editar_animacion=(animacion_)=>{
        setAnimacion(animacion_)
        //const liezo = new GestionLienzoAnimacion()
        //lienzo.actualizarLienzo(animacion_.edicion)
    }

    if(animacion.edicion.meta_figuras.length>0){
        const paquete_datos = { animacion:animacion.edicion, setAnimacion:editar_animacion,
            eventoLienzoFigura :eventoLienzoFigura, setEventLienzoFigura:setEventLienzoFigura,
            gestionLienzo :gestionLienzo, setGestionLienzo:setGestionLienzo};

        const edicion_figuras = <EdicionFiguras {...paquete_datos}/>
        const composicion = <EditorCompisicion {...paquete_datos}/>
        return (
            <div className="row">
                <MenuAnimacion subirAnimacion={subirAnimacion} exportarAnimacion={exportandoAnimacion}/>
                <hr/>
            <NavEditorAnimacion edicion_figuras ={edicion_figuras}
                                composicion = {composicion}>
            </NavEditorAnimacion>
        </div>)
    }

    return <h1> Sin Servicio</h1>
}

export default EditorAnimacion