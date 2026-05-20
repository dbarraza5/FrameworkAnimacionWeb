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
import EdicionFiguras from "../EditorAnimacion/SeccionFiguras/EdicionFiguras";
import GestionLienzoAnimacion from "../../Clases/EditorAnimacion/GestionLienzoAnimacion";
import GestionLienzoEvento from "../../Clases/EditorEvento/GestionLienzoEvento";
import {
    setIdEventoSeleccionado,
    setIdGrupoSeleccionado,
    setTipoTrabajo
} from "../../Store/Configuracion/ConfigEventoSlice";

const useCustomEvento=(valor_inicial=null)=>{
    const [evento_, setEvento_] = useState(valor_inicial);
    function setCustomEvento(evento_aux){
        evento_aux.edicion.version+=1
        setEvento_(evento_aux)
    }
    return [evento_, setCustomEvento]
}

const useCustomAnimacion=(valor_inicial=null)=>{
    const [animacion_, setAnimacion_] = useState(valor_inicial);
    function setCustomAnimacion(animacion_aux){
        //console.log("set animacion custom")
        animacion_aux.edicion.version+=1
        setAnimacion_(animacion_aux)
    }
    return [animacion_, setCustomAnimacion]
}


function EditorEvento(props){

    const seleccionarGrupo=(id_grupo)=>{
        console.log("[seleccionarGrupo]: ", id_grupo);
        dispatch(setIdGrupoSeleccionado(id_grupo));
    }

    const [eventoAnimacion, setEventoAnimacion]= useCustomEvento({edicion: new GestionEvento()});
    const [eventoLienzoEvento, setEventLienzoEvento] = useState(new ControlEventoLienzoFigura());
    const [gestionEventoLienzo, setGestionEventoLienzo] = useState(
        new GestionLienzoEvento(
            eventoAnimacion.edicion,
            eventoLienzoEvento,
            setEventoAnimacion,
            seleccionarGrupo
        ));

    //const [timelineInstance, setTimelineInstance] = useState(null);

    const tipo_modalidad = useSelector(state => state.config_evento.tipo_modalidad);
    const tipo_modalidad_trabajo = useSelector(state => state.config_evento.tipo_modalidad_trabajo);
    const index_mov_seleccionado = useSelector(state => state.config_evento.index_mov_seleccionado);
    const id_evento_seleccionado = useSelector(state => state.config_evento.id_evento_seleccionado);
    const evento_redux = useSelector(state => state.evento.evento);
    const grupos_a_sincronizar = useSelector(state => state.config_evento.grupos_a_sincronizar);
    const id_grupo_seleccionado = useSelector(state => state.config_evento.id_grupo_seleccionado);


    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [startLoopLienzo, setStartLoopLienzo] = useState(false);
    const dispatch = useDispatch();

    const [tipoModalidadTrabajo, setTipoModalidadTrabajo] = useState(tipo_modalidad_trabajo);



    console.log("========================> modalida: ", tipo_modalidad);
    useEffect(() => {
        console.log("****CAMBIAR MODALIDAD TRABAJO123: ", tipo_modalidad_trabajo);
        //setTipoModalidadTrabajo(tipo_modalidad_trabajo);
        gestionEventoLienzo.tipo_trabajo =tipo_modalidad_trabajo;
    }, [tipo_modalidad_trabajo]);

    useEffect(() => {
        console.log("****CAMBIAR MODALIDAD: ", tipo_modalidad);
        //setTipoModalidadTrabajo(tipo_modalidad_trabajo);
        gestionEventoLienzo.tipo_modalidad = tipo_modalidad
    }, [tipo_modalidad]);

    useEffect(() => {
        console.log("****CAMBIAR index_mov_seleccionado: ", index_mov_seleccionado);
        //setTipoModalidadTrabajo(tipo_modalidad_trabajo);
        gestionEventoLienzo.index_mov_seleccionado = index_mov_seleccionado
    }, [index_mov_seleccionado]);

    // useEffect(() => {
    //     gestionEventoLienzo.index_mov_seleccionado = index_mov_seleccionado
    // }, [id_grupo_seleccionado]);

    useEffect(() => {
        console.log("Se actualizo El evento por redux")
    }, [evento_redux]);

    useEffect(() => {
        console.log("Se actualizo El grupos_a_sincronizar");
        console.log(grupos_a_sincronizar);
        eventoAnimacion.edicion.gestion_grupos.grupos_figuras = JSON.parse(grupos_a_sincronizar);
        eventoAnimacion.edicion.gestion_grupos_originales.grupos_figuras = JSON.parse(grupos_a_sincronizar);
        //animacion.edicion.grupos_figuras = JSON.parse(grupos_a_sincronizar);
    }, [grupos_a_sincronizar]);

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

                    animacion.edicion.meta_figuras = response.data.meta_figuras
                    animacion.edicion.meta_movimientos = []//response.data.meta_movimientos;
                    animacion.edicion.grupos_figuras = JSON.parse(JSON.stringify(response.data.grupos_figuras));//response.data.grupos_figuras;
                    animacion.edicion.lista_imagenes = []//response.data.lista_imagenes;
                    gestionLienzo.grupos_figuras_concurrent = null;
                    //animacion.edicion.setGrupoFigurasCurrent(response.data.grupos_figuras)
                    animacion.edicion.id_animacion = 'n5843n3458n5438'//response.data._id;
                    animacion.edicion.nombre_animacion = 'gffgdfghhgf343f'//response.data.nombre_animacion;


                    dispatch(modalidadTrabajo({
                        tipo_modalidad: MODALIDAD_ANIMACION,
                        tipo_modalidad_trabajo: TRABAJO_ANIMACION_EVENTOS,
                        id_evento_seleccionado: "EventoGeneral"}));
                    const evento_flat = JSON.parse(JSON.stringify(eventoAnimacion.edicion));
                    dispatch(setEventoActual({edicion: evento_flat}))

                    dispatch(restaurarState())
                    const raw_animacion = JSON.stringify(response.data.grupos_figuras);
                    dispatch(actualizarBackup(raw_animacion))
                    dispatch(setNombreAnimacion(response.data.nombre_animacion))
                    editar_animacion({"edicion": animacion.edicion})

                    gestionEventoLienzo.inicializar()
                    gestionEventoLienzo.funcionCambioTrabajo = cambiarTipoTrabajo
                    setStartLoopLienzo(true);
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

    const cambiarTipoTrabajo = (tipo_trabajo) =>{
        dispatch(setTipoTrabajo(tipo_trabajo))
    }

    useInterval(() => {
        // procesoAnimacion();
        gestionEventoLienzo.procesarEventoLienzo(setEventoAnimacion, null)
    }, startLoopLienzo ? 100 : null);

    const procesoAnimacion=()=>{
        if(tipo_modalidad === MODALIDAD_ANIMACION){
            eventoAnimacion.edicion.procesandoEventos();
            eventoAnimacion.edicion.imprimirEventos();
            //timelineInstance.procesar();

        }
    }

    useEffect(() => {
        console.log("[==============================Evento===========================]")
        obtenerEvento();
        // const instance = new TimelineCanvas(eventoLienzoEvento, eventoAnimacion, setEventoAnimacion);
        // setTimelineInstance(instance);
        return () => {
            console.log("Limpiando Canvas anterior...");
            // Aquí deberías llamar a un método que destruya el canvas o limpie los eventos
            gestionEventoLienzo.limpiar()
        };
    }, []);

    useEffect(() => {
        console.log(eventoAnimacion.edicion.seleccion_evento);
        if(eventoAnimacion.edicion.seleccion_evento!==null){
            const evento_ = eventoAnimacion.edicion.eventos[eventoAnimacion.edicion.seleccion_evento];
            if(evento_){
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
                    //timelineInstance.cambiarEventos(list_evento);
                }
                if(tipo_modalidad===TRABAJO_ANIMACION_MOVIMIENTOS){
                    // const list_evento = evento_.evento.movimientos.map((mov, index)=>{
                    //     return {
                    //         id: index,
                    //         inicio: mov.tiempo_inicio,
                    //         fin: mov.tiempo_final
                    //     }
                    // });
                    // console.log(list_evento);
                    //timelineInstance.cambiarEventos(list_evento);
                }

            }


            //integrar el evento con el timeline
        }
    }, [eventoAnimacion]);

    useEffect(() => {
        console.log("[CAMBIO DE MODALIDAD]");
        console.log("modalidad: "+tipo_modalidad_trabajo);
        console.log("evento   : "+id_evento_seleccionado);
        // if(timelineInstance){
        //     timelineInstance.cambioModalidad(tipo_modalidad_trabajo, id_evento_seleccionado);
        // }
    }, [tipo_modalidad_trabajo, id_evento_seleccionado]);




    const subirAnimacion1=async()=>{
        console.log("SUBBBBBBEEEEEEEE eventooooo!!!!")
        try{
            const eventos_ = eventoAnimacion.edicion.eventos.map((evento)=>{
                return evento.evento;
            });
            const datos = {
                "eventos": eventos_,
                "grupos_figuras": eventoAnimacion.edicion.gestion_grupos_originales.grupos_figuras
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

    const editar_animacion=(animacion_)=>{
        setAnimacion({edicion: animacion_.edicion})
    }

    const [animacion, setAnimacion]= useCustomAnimacion({edicion: new GestionAnimacion()});
    const [gestionLienzo, setGestionLienzo] = useState(new GestionLienzoAnimacion(animacion.edicion));
    const [eventoLienzoFiguraAnimacion, setEventLienzoFiguraAnimacion] = useState(new ControlEventoLienzoFigura());

    const editar_lienzo=()=>{
        //dispatch(actualizarBackup(raw_animacion))
        //console.log("MOVER_FIGURA: "+gestionLienzo.mover_figura)
        const raw_animacion = JSON.stringify(animacion.edicion.grupos_figuras);
        dispatch(actualizarBackup(raw_animacion))
    }

    gestionLienzo.setFuncionEditarLienzo(editar_lienzo);

    const paquete_datos = { animacion: animacion.edicion, setAnimacion: editar_animacion,
        eventoLienzoFigura :eventoLienzoFiguraAnimacion, setEventLienzoFigura:setEventLienzoFiguraAnimacion,
        gestionLienzo :gestionLienzo, setGestionLienzo:setGestionLienzo,
        cambiarListaTrabajo:()=>{}};

    const edicion_figuras = <EdicionFiguras key={'edicion-figuras'} {...paquete_datos}/>

    return(<div>
        <div className="row">
            <MenuEvento  subirAnimacion={subirAnimacion1}
            />
            <hr/>
            <NavEditorEvento eventoAnimacion={eventoAnimacion}
                             setEventoAnimacion = {setEventoAnimacion}
                             eventoLienzoFigura={eventoLienzoEvento}
                             setEventLienzoFigura={setEventLienzoEvento}
                             tipoModalidad={tipo_modalidad}
                             setTipoModalidad={setTipoModalidadTrabajo}
                             edicion_figuras = {edicion_figuras}
            >
            </NavEditorEvento>

        </div>
    </div>)
}

export default EditorEvento