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
        <div className="container-fluid d-flex flex-wrap gap-2">
            {/* Biblioteca (offcanvas a la derecha, se monta en EditorEvento): agrega
                animaciones como instancias arrastrandolas al lienzo. */}
            <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasAnimaciones"
                aria-controls="offcanvasAnimaciones"
            >
                <i className="bi bi-collection me-1"/> Animaciones
            </button>
            {/* Comportamiento anterior: reemplaza TODOS los grupos del lienzo por los de
                la animacion elegida (sincronizar). */}
            <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-toggle="modal"
                data-bs-target="#dualListModal"
                title="Reemplaza todos los grupos del lienzo por los de una animacion"
            >
                Reemplazar grupos…
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
