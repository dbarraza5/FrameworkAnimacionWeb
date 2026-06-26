import {useState, useRef, useEffect} from "react";
import ModalImportarGrupos from "./ModalImportarGrupos";

import {useDispatch, useSelector} from "react-redux";
import {
    MODALIDAD_ANIMACION,
    modalidadTrabajo,
    setEventoActual,
    TRABAJO_ANIMACION_EVENTOS
} from "../../../Store/Evento/eventoSlice";
import {Cookies} from 'react-cookie';
import axios from "axios";
import {actualizarBackup, restaurarState, setNombreAnimacion} from "../../../Store/Animacion/animacionSlice";
import {setGruposAsincronizar} from "../../../Store/Configuracion/ConfigEventoSlice";
function PanelGrupos(props) {

    const evento_redux = useSelector(state => state.evento);
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");
    const dispatch = useDispatch();
    const importarGruposFiguras = (grupos) =>{

        console.log(grupos);
        console.log(evento_redux)
        //dispatch(setEventoActual({edicion: eventoAnimacion.edicion}))
        obtenerGrupos(grupos[0])
    }

    const obtenerGrupos=async (id_animacion) => {
        try {
            const token = datos_usuario.token
            const url = "/api/animacion/id/" + id_animacion;
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
                    console.log("descarga animacion grupos");
                    console.log(response.data.grupos_figuras)
                    const grupos_string = JSON.stringify(response.data.grupos_figuras)
                    dispatch(setGruposAsincronizar(grupos_string));
                })
                .catch(function (response) {
                    console.log("error descarga animacion")
                    console.log(response.data);
                    props.manejadorErrores(response.data)
                });
        } catch (err) {
            console.log(err);
        }
    }


    return (
        <div className="container-fluid">
            <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#dualListModal"
            >
                Abrir modal
            </button>

            <ModalImportarGrupos
                id="dualListModal"
                title="Mover elementos a la izquierda"
                importarGruposFiguras={importarGruposFiguras}
                // Puedes iniciar con algunos ya pasados a la izquierda:
                // initialSelected={[2, 5, 7]}
            />
        </div>
    );
}

export default PanelGrupos;
