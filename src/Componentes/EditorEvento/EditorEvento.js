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

const useCustomEvento=(valor_inicial=null)=>{
    const [evento_, setEvento_] = useState(valor_inicial);
    function setCustomEvento(evento_aux){
        evento_aux.edicion.version+=1
        setEvento_()(evento_aux)
    }
    return [evento_, setCustomEvento]
}


function EditorEvento(props){
    const [eventoAnimacion, setEventoAnimacion]= useCustomEvento({edicion: new GestionEvento()});

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")

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
                    eventoAnimacion.edicion.inicializar(response.data.eventos);

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
    }, []);


    return(<div>
        <div className="row">
            <MenuEvento />
            <hr/>
            <NavEditorEvento>
            </NavEditorEvento>

        </div>
    </div>)
}

export default EditorEvento