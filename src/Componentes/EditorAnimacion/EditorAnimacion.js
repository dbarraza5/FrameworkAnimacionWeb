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

import {setNombreAnimacion, setListaGrupoTrabajo,restaurarState, actualizarBackup} from "../../Store/Animacion/animacionSlice";
import {useDispatch, useSelector} from "react-redux";
import ModalImportarGrupo from "./SeccionFiguras/GestionGrupos/ImportarGrupos/ModalImportarGrupo";

const useCustomAnimacion=(valor_inicial=null)=>{
    const [animacion_, setAnimacion_] = useState(valor_inicial);
    function setCustomAnimacion(animacion_aux){
        //console.log("set animacion custom")
        animacion_aux.edicion.version+=1
        setAnimacion_(animacion_aux)
    }
    return [animacion_, setCustomAnimacion]
}


function EditorAnimacion(props) {

    const backup = useSelector((state) => state.animacion.backup);
    //console.log("ANIMACION REDUX ================================")
    //console.log(animacion_redux)
    const dispatch = useDispatch();

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [animacion, setAnimacion]= useCustomAnimacion({edicion: new GestionAnimacion()});
    const [gestionLienzo, setGestionLienzo] = useState(new GestionLienzoAnimacion(animacion.edicion));
    const [eventoLienzoFigura, setEventLienzoFigura] = useState(new ControlEventoLienzoFigura());

    //const setAnimacion=(animacion_)=>{
    //    dispatch(setAnimacionR(animacion_))
    //}

    /*useEffect(()=>{
        gestionLienzo.animacion_=animacion_redux;
        gestionLienzo.actualizarLienzo(animacion_redux)
        setGestionLienzo(gestionLienzo)
    },[animacion_redux])*/

    //useEffect(() => {
    //    dispatch(fetchAnimacion(props.id_animacion));
    //}, [dispatch]);



    useEffect(() => {
        //const liezo = new GestionLienzoAnimacion()
        //console.log(gestionLienzo)
        console.log("[==============================ANIMACION===========================]")
        //
        //
        obtenerAnimacion();
    },[]);

    /*useEffect(() => {
        console.log("MOVER_FIGURA: "+gestionLienzo.mover_figura)
    },[gestionLienzo.mover_figura]);*/

    const editar_lienzo=()=>{
        //dispatch(actualizarBackup(raw_animacion))
        console.log("MOVER_FIGURA: "+gestionLienzo.mover_figura)
        const raw_animacion = JSON.stringify(animacion.edicion.grupos_figuras);
        dispatch(actualizarBackup(raw_animacion))
    }
    gestionLienzo.funcion_editar_lienzo = editar_lienzo;

    const obtenerAnimacion=async ()=>{
        const token = datos_usuario.token
        try {
            const url = "/api/animacion/id/" + props.id_animacion;
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

                    animacion.edicion.id_animacion = response.data._id;
                    animacion.edicion.nombre_animacion = response.data.nombre_animacion;

                    dispatch(setNombreAnimacion(response.data.nombre_animacion))
                    dispatch(restaurarState())
                    //customSetAnimacion(animacion)
                    editar_animacion({"edicion": animacion.edicion})
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
        if ('showSaveFilePicker' in window) {
            try {
                const miArray = animacion.edicion.grupos_figuras;
                const nombre = animacion.edicion.nombre_animacion + animacion.edicion.id_animacion;
                const jsonString = JSON.stringify(miArray);
                const blob = new Blob([jsonString], { type: "application/json" });

                const handle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Archivos JSON',
                        accept: { 'application/json': ['.json'] }
                    }],
                    suggestedName: nombre + ".json"
                });

                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (error) {
                console.error('Error al exportar la animación:', error);
            }
        } else {
            console.error('La función showSaveFilePicker() no está soportada en este navegador.');
        }
    }

    const editar_animacion=(animacion_)=>{
        //const raw_animacion = JSON.stringify(animacion_.edicion.grupos_figuras);
        //console.log(raw_animacion)
        //dispatch(actualizarBackup(raw_animacion))

        setAnimacion(animacion_)
        //const liezo = new GestionLienzoAnimacion()
        //lienzo.actualizarLienzo(animacion_.edicion)
    }

    useEffect(() => {
        const arr = JSON.parse(backup.actual);
        if(arr !==null){
            gestionLienzo.setGrupoFigurasCurrent(arr)
            dispatch(setListaGrupoTrabajo([]))
        }
    },[backup.estado]);


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
                <ModalImportarGrupo animacion={animacion.edicion} setAnimacion={setAnimacion}/>
            </div>
        )
    }

    return <h1> Sin Servicio</h1>
}

export default EditorAnimacion