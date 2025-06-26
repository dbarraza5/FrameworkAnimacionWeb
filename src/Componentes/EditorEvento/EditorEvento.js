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

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

    const [startLoopLienzo, setStartLoopLienzo] = useState(false);

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
                        response.data.grupos_figuras);
                    setEventoAnimacion(eventoAnimacion)
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

    useEffect(() => {
        console.log("[==============================Evento===========================]")
        obtenerEvento();

        const instance = new TimelineCanvas(eventoLienzoFigura);
        setTimelineInstance(instance);
    }, []);

    useEffect(() => {
        console.log(eventoAnimacion.edicion.seleccion_evento);
        if(eventoAnimacion.edicion.seleccion_evento!==null){
            const evento_ = eventoAnimacion.edicion.eventos[eventoAnimacion.edicion.seleccion_evento];
            console.log("[cambio de evento]: ");
            console.log(evento_);
        }
    }, [eventoAnimacion]);

    useInterval(() => {
        eventoAnimacion.edicion.procesandoEventos();
        eventoAnimacion.edicion.imprimirEventos();
        timelineInstance.procesar(eventoAnimacion.edicion);
        //timelineInstance.redibujarTodo();
    }, startLoopLienzo ? 100 : null);


    return(<div>
        <div className="row">
            <MenuEvento />
            <hr/>
            <NavEditorEvento eventoAnimacion={eventoAnimacion}
                             setEventoAnimacion = {setEventoAnimacion}
                             eventoLienzoFigura={eventoLienzoFigura}
                             setEventLienzoFigura={setEventLienzoFigura}>
            </NavEditorEvento>

        </div>
    </div>)
}

export default EditorEvento