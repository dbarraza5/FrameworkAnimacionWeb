import MenuAnimacion from "../EditorAnimacion/MenuAnimacion";
import NavEditorAnimacion from "../EditorAnimacion/NavEditorAnimacion";
import ModalImportarGrupo from "../EditorAnimacion/SeccionFiguras/GestionGrupos/ImportarGrupos/ModalImportarGrupo";
import React, {useEffect} from "react";
import MenuEvento from "./MenuEvento";
import NavEditorEvento from "./NavEditorEvento";
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import axios from "axios";
import {actualizarBackup, restaurarState, setNombreAnimacion} from "../../Store/Animacion/animacionSlice";
import {Cookies} from 'react-cookie';


function EditorEvento(props){
    //const [eventoAnimacion, setEventoAnimacion]= useCustomAnimacion({edicion: new GestionAnimacion()});

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