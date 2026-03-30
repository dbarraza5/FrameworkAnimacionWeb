import MenuAnimacion from "../EditorAnimacion/MenuAnimacion";
import NavEditorAnimacion from "../EditorAnimacion/NavEditorAnimacion";
import ModalImportarGrupo from "../EditorAnimacion/SeccionFiguras/GestionGrupos/ImportarGrupos/ModalImportarGrupo";
import React, {useEffect, useState} from "react";
import MenuEvento from "./MenuEvento";
import NavEditorEvento from "./NavEditorEvento";
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import axios from "axios";
import {actualizarBackup, restaurarState, setNombreAnimacion} from "../../Store/Animacion/animacionSlice";
import {Cookies} from 'react-cookie';
import {GestionEvento} from "../../Clases/EditorEvento/GestionEvento";
import ControlEventoLienzoFigura from "../../Clases/EditorAnimacion/ControlEventoLienzoFigura";
import {useInterval} from "react-use";
import TimelineCanvas from "../../Clases/EditorEvento/TimelineCanvas";
import {
    MODALIDAD_ANIMACION,
    modalidadTrabajo, setEventoActual,
    TRABAJO_ANIMACION_EVENTOS,
    TRABAJO_ANIMACION_MOVIMIENTOS
} from "../../Store/Evento/eventoSlice";
import {useDispatch, useSelector} from "react-redux";

const useCustomEvento=(valor_inicial=null)=>{
    const [evento_, setEvento_] = useState(valor_inicial);
    function setCustomEvento(evento_aux){
        evento_aux.edicion.version+=1
        setEvento_(evento_aux)
    }
    return [evento_, setCustomEvento]
}

function EditorEvento(props){
    const [eventoAnimacion, setEventoAnimacion]= useCustomEvento({edicion: new GestionEvento()});
    const [eventoLienzoFigura, setEventLienzoFigura] = useState(new ControlEventoLienzoFigura());
    const [timelineInstance, setTimelineInstance] = useState(null);

    const tipo_modalidad = useSelector(state => state.evento.tipo_modalidad);
    const tipo_modalidad_trabajo = useSelector(state => state.evento.tipo_modalidad_trabajo);
    const id_evento_seleccionado = useSelector(state => state.evento.id_evento_seleccionado);
    const evento_redux = useSelector(state => state.evento.evento);

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [startLoopLienzo, setStartLoopLienzo] = useState(false);
    const dispatch = useDispatch();

    const [tipoModalidadTrabajo, setTipoModalidadTrabajo] = useState(tipo_modalidad_trabajo);


    console.log("========================> modalida: ", tipo_modalidad);
    useEffect(() => {
        console.log("****CAMBIAR MODALIDAD TRABAJO: ", tipo_modalidad_trabajo);
        //setTipoModalidadTrabajo(tipo_modalidad_trabajo);
    }, [tipo_modalidad_trabajo]);

    useEffect(() => {
        console.log("****CAMBIAR MODALIDAD: ", tipo_modalidad);
        //setTipoModalidadTrabajo(tipo_modalidad_trabajo);
    }, [tipo_modalidad]);

    useEffect(() => {
        console.log("Se actualizo El evento por redux")
    }, [evento_redux]);

    const obtenerEvento=async ()=>{
        const token = datos_usuario.token
        try {
            const url = "/api/evento/id/" + props.id_evento;
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
                    console.log("funcionaaa DESCARGAAAAA")
                    console.log(response.data);
                    eventoAnimacion.edicion.inicializar(response.data.eventos,
                        response.data.grupos_figuras, response.data._id);
                    setEventoAnimacion(eventoAnimacion)
                    setStartLoopLienzo(true);
                    dispatch(modalidadTrabajo({
                        tipo_modalidad: MODALIDAD_ANIMACION,
                        tipo_modalidad_trabajo: TRABAJO_ANIMACION_EVENTOS,
                        id_evento_seleccionado: "EventoGeneral"}));
                    const evento_flat = JSON.parse(JSON.stringify(eventoAnimacion.edicion));
                    dispatch(setEventoActual({edicion: evento_flat}))
                })
                .catch(function (response) {
                    console.log("error obtener proyectos")
                    console.log(response.data);
                    props.manejadorErrores(response.data)
                });
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        console.log("[==============================Evento===========================]")
        obtenerEvento();
        const instance = new TimelineCanvas(eventoLienzoFigura, eventoAnimacion, setEventoAnimacion);
        setTimelineInstance(instance);
    }, []);

    useEffect(() => {
        console.log(eventoAnimacion.edicion.seleccion_evento);
        if(eventoAnimacion.edicion.seleccion_evento!==null){
            const evento_ = eventoAnimacion.edicion.eventos[eventoAnimacion.edicion.seleccion_evento];
            console.log("[cambio de evento]: "+eventoAnimacion.edicion.version);
            console.log(evento_.evento);

            if(tipo_modalidad===TRABAJO_ANIMACION_EVENTOS){
                const nombre_event = evento_.evento["nombre"];
                const lista_hijos=eventoAnimacion.edicion.obtenerHijos(nombre_event);

                const list_evento = lista_hijos.map((event_)=>{
                    return {
                        id: event_.evento.nombre,
                        inicio: event_.evento.tiempo_inicio,
                        fin: event_.evento.tiempo_final
                    }
                });
                console.log("[*lista de hijos*]");
                console.log(lista_hijos);
                console.log(list_evento);
                timelineInstance.cambiarEventos(list_evento);
            }
            if(tipo_modalidad===TRABAJO_ANIMACION_MOVIMIENTOS){
                const list_evento = evento_.evento.movimientos.map((mov, index)=>{
                    return {
                        id: index,
                        inicio: mov.tiempo_inicio,
                        fin: mov.tiempo_final
                    }
                });
                console.log(list_evento);
                timelineInstance.cambiarEventos(list_evento);
            }


            //integrar el evento con el timeline
        }
    }, [eventoAnimacion]);

    useEffect(() => {
        console.log("[CAMBIO DE MODALIDAD]");
        console.log("modalidad: "+tipo_modalidad_trabajo);
        console.log("evento   : "+id_evento_seleccionado);
        if(timelineInstance){
            timelineInstance.cambioModalidad(tipo_modalidad_trabajo, id_evento_seleccionado);
        }
    }, [tipo_modalidad_trabajo, id_evento_seleccionado]);

    useInterval(() => {

        if(tipo_modalidad === MODALIDAD_ANIMACION){
            eventoAnimacion.edicion.procesandoEventos();
            eventoAnimacion.edicion.imprimirEventos();
            timelineInstance.procesar();
        }

        //timelineInstance.redibujarTodo();
    }, startLoopLienzo ? 100 : null);


    const subirAnimacion1=async()=>{
        console.log("SUBBBBBBEEEEEEEE eventooooo!!!!")
        try{
            const eventos_ = eventoAnimacion.edicion.eventos.map((evento)=>{
                return evento.evento;
            });
            const datos = {
                "eventos": eventos_
            };

            const url = "/api/evento/id/" + eventoAnimacion.edicion._id;
            const token = datos_usuario.token;
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
                    console.log("SUBIENDO evento")
                    console.log(response.data);
                })
                .catch(function (response) {
                    console.log("error subir evento")
                    console.log(response.response.data);
                    props.manejadorErrores(response.response.data)
                });
        }catch (err){
            console.log(err)
        }
    };


    return(<div>
        <div className="row">
            <MenuEvento  subirAnimacion={subirAnimacion1}
            />
            <hr/>
            <NavEditorEvento eventoAnimacion={eventoAnimacion}
                             setEventoAnimacion = {setEventoAnimacion}
                             eventoLienzoFigura={eventoLienzoFigura}
                             setEventLienzoFigura={setEventLienzoFigura}
                             tipoModalidad={tipo_modalidad}
                             setTipoModalidad={setTipoModalidadTrabajo}
            >
            </NavEditorEvento>

        </div>
    </div>)
}

export default EditorEvento