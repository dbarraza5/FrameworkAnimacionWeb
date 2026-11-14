import MenuAnimacion from "../EditorAnimacion/MenuAnimacion";
import NavEditorAnimacion from "../EditorAnimacion/NavEditorAnimacion";
import ModalImportarGrupo from "../EditorAnimacion/SeccionFiguras/GestionGrupos/ImportarGrupos/ModalImportarGrupo";
import React, {useEffect, useRef, useState} from "react";
import MenuEvento from "./MenuEvento";
import OffcanvasAnimaciones, {MIME_ANIMACION} from "./SeccionEventos/OffcanvasAnimaciones";
import NavEventos from "./SeccionEventos/NavEventos";
import Inspector from "./SeccionEventos/Inspector";
import PanelObjetosEscena from "./SeccionEventos/PanelObjetosEscena";
import PanelHistorial from "./SeccionEventos/PanelHistorial";
import Historial from "../../Clases/EditorEvento/Historial";
import Lienzo from "../EditorAnimacion/Lienzo";
import Separador from "./Layout/Separador";
import BarraEstado from "./Layout/BarraEstado";
import "./EditorEvento.css";
import {exportarJSON} from "../../Utils/exportarJSON";
import NavEditorEvento from "./NavEditorEvento";
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import axios from "axios";
import {actualizarBackup, restaurarState, setNombreAnimacion} from "../../Store/Animacion/animacionSlice";
import {Cookies} from 'react-cookie';
import {GestionEvento} from "../../Clases/EditorEvento/GestionEvento";
import ControlEventoLienzoFigura from "../../Clases/EditorAnimacion/ControlEventoLienzoFigura";
// (useInterval ya no se usa: el lienzo corre con requestAnimationFrame)
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

// Autoguardado local (por si se cierra el navegador sin subir): una copia por escena.
const claveAutoguardado = (id) => `autoguardado_evento_${id}`;


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
    // Historial (deshacer / rehacer / sin guardar / autoguardado)
    const refHistorial = useRef(null);
    const [versionHist, setVersionHist] = useState(0);
    const [recuperable, setRecuperable] = useState(null);   // autoguardado local para ofrecer recuperar
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

     useEffect(() => {
         gestionEventoLienzo.grupo_seleccionado = id_grupo_seleccionado
    }, [id_grupo_seleccionado]);

    useEffect(() => {
        console.log("Se actualizo El evento por redux")
    }, [evento_redux]);

    useEffect(() => {
        console.log("Se actualizo El grupos_a_sincronizar");
        console.log(grupos_a_sincronizar);
        // al montar vale null: no hay nada que sincronizar (antes se asignaba null a
        // los grupos y el motor fallaba si el primer tick llegaba antes de la descarga)
        if(!grupos_a_sincronizar) return;
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
                    // Fase 8A: toda escena tiene camara (se crea si falta; se guarda con Subir)
                    eventoAnimacion.edicion.asegurarCamara();
                    // Fase 8B: configuracion de la escena (orden por profundidad...)
                    eventoAnimacion.edicion.escena = response.data.escena || {};
                    // datos para "Guardar como"
                    eventoAnimacion.edicion.id_proyecto = response.data.id_proyecto;
                    eventoAnimacion.edicion.meta_figuras_doc = response.data.meta_figuras || [];
                    eventoAnimacion.edicion.nombre_doc = response.data.nombre;
                    // Historial: la foto inicial es lo guardado en el servidor
                    const hist = new Historial(eventoAnimacion.edicion);
                    hist.alCambiar = () => setVersionHist((v) => v + 1);
                    hist.iniciar("Abrir escena");
                    refHistorial.current = hist;
                    // autoguardado local de una sesion anterior que no se subio
                    try {
                        const crudo = localStorage.getItem(claveAutoguardado(response.data._id));
                        const guardado = crudo ? JSON.parse(crudo) : null;
                        if (guardado && guardado.estado && JSON.stringify(guardado.estado) !== JSON.stringify(hist.estadoActual())) {
                            setRecuperable(guardado);
                        }
                    } catch (e) { /* sin almacenamiento local: no se ofrece recuperar */ }
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
                    // la seleccion que leen los paneles (Escena, Inspector) y el lienzo
                    // vive en config_evento: arrancar con EventoGeneral seleccionado
                    // (antes quedaba en null y se mostraba "Evento: Ninguno").
                    dispatch(setIdEventoSeleccionado("EventoGeneral"));
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
                    // error del servidor (axios) o error de programa al preparar el editor:
                    // este ultimo no tiene `response` y antes se perdia sin rastro
                    if(!response || !response.response){
                        console.error("Error al preparar el editor de eventos:", response);
                        return;
                    }
                    console.log("error obtener evento", response.response.data);
                    props.manejadorErrores(response.response.data)
                });
        } catch (err) {
            console.log(err);
        }
    }

    const cambiarTipoTrabajo = (tipo_trabajo) =>{
        dispatch(setTipoTrabajo(tipo_trabajo))
    }

    // Bucle del lienzo (Fase 4): requestAnimationFrame, sincronizado con la pantalla
    // (~60 cuadros por segundo; el navegador lo pausa si la pestana no esta visible).
    // Antes era useInterval(..., 100) = ~10 cuadros por segundo.
    const refSetEvento = useRef(setEventoAnimacion);
    refSetEvento.current = setEventoAnimacion;
    useEffect(() => {
        if(!startLoopLienzo) return;
        let id = null;
        let errores = 0;
        const cuadro = () => {
            try{
                gestionEventoLienzo.procesarEventoLienzo(refSetEvento.current, null);
            }catch(e){
                // un error en un cuadro no debe detener el bucle (se informa pocas veces)
                if(errores++ < 5) console.error("Error en el cuadro del lienzo:", e);
            }
            id = requestAnimationFrame(cuadro);
        };
        id = requestAnimationFrame(cuadro);
        return () => cancelAnimationFrame(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startLoopLienzo]);

    const procesoAnimacion=()=>{
        if(tipo_modalidad === MODALIDAD_ANIMACION){
            eventoAnimacion.edicion.procesandoEventos();
            eventoAnimacion.edicion.imprimirEventos();
            //timelineInstance.procesar();

        }
    }

    // ---- Biblioteca de animaciones: agregar una animacion como instancia ----
    // Refs a las instancias actuales (React StrictMode puede reconstruir estos objetos;
    // los listeners del canvas deben usar siempre los vigentes).
    const refEvento = useRef(eventoAnimacion);
    const refLienzo = useRef(gestionEventoLienzo);
    refEvento.current = eventoAnimacion;
    refLienzo.current = gestionEventoLienzo;
    // Fase 2: la seleccion de objetos del lienzo llega a React (Inspector -> Objeto)
    const [objetosSeleccionados, setObjetosSeleccionados] = useState([]);
    refLienzo.current.control_objetos.alCambiar = setObjetosSeleccionados;
    // Fase 3: ruta de objetos en los que se "entro" (doble clic)
    const [rutaObjetos, setRutaObjetos] = useState([]);
    refLienzo.current.control_objetos.alCambiarRuta = setRutaObjetos;

    // Solo en desarrollo: acceso desde la consola del navegador para pruebas
    // (ej. cambiar la transformacion de una instancia antes de que existan las
    // manijas de la Fase 2). No existe en el build de produccion.
    if(process.env.NODE_ENV === "development"){
        window.__editorEvento = {evento: refEvento, lienzo: refLienzo};
    }

    // Fase 6: el motor carga los assets de las instancias por referencia (documentos
    // de eventos de otros proyectos) con esta funcion.
    // Con `version` (6C) trae la foto congelada en vez del documento actual.
    if(!refEvento.current.edicion.cargadorAssets){
        refEvento.current.edicion.cargadorAssets = (id, version) => axios({
            method: "get", url: version ? "/api/evento/version/" + version : "/api/evento/id/" + id,
            withCredentials: true,
            headers: {"Content-Type": "application/json", Authorization: "Bearer " + datos_usuario?.token},
        }).then((r) => r.data);
    }

    // 6C: al volver a esta pestaña (por ejemplo, despues de editar un asset en otra)
    // se vuelven a pedir los assets que siguen "la ultima" version.
    useEffect(() => {
        let ultimo = 0;
        const alVolver = () => {
            if(document.visibilityState !== "visible") return;
            const ahora = performance.now();
            if(ahora - ultimo < 2000) return;
            ultimo = ahora;
            const edicion = refEvento.current?.edicion;
            if(edicion && edicion.assets && edicion.assets.size) void edicion.recargarAssets();
        };
        window.addEventListener("focus", alVolver);
        document.addEventListener("visibilitychange", alVolver);
        return () => {
            window.removeEventListener("focus", alVolver);
            document.removeEventListener("visibilitychange", alVolver);
        };
    }, []);

    const agregarAnimacionEnPunto = (animacion, x_canvas, y_canvas) => {
        const lienzo = refLienzo.current;
        const evento = refEvento.current;
        const {x, y} = lienzo.coordenadasMundo(x_canvas, y_canvas);
        if(animacion.tipo === "instancia"){
            // instancia por referencia: dibujo y eventos vienen del asset
            const nombre = evento.edicion.agregarInstanciaReferencia(animacion.id_eventos, animacion.nombre, x, y,
                animacion.evento || "EventoGeneral");
            setEventoAnimacion({edicion: evento.edicion});
            return nombre;
        }
        const contenedor = evento.edicion.agregarInstanciaAnimacion(animacion.grupos_figuras, animacion.nombre, x, y);
        if(contenedor){
            setEventoAnimacion({edicion: evento.edicion});
        }
        return contenedor;
    };

    // "Agregar al centro": centro de la vista del lienzo.
    const agregarAnimacionAlCentro = (animacion) => {
        const c = refLienzo.current.configuracion_lienzo;
        agregarAnimacionEnPunto(animacion, c.ancho / 2, c.alto / 2);
    };

    useEffect(() => {
        if(!startLoopLienzo) return;
        const canvas = document.getElementById("lienzo-evento");
        if(!canvas) return;
        const esAnimacion = (e) => Array.from(e.dataTransfer?.types || []).includes(MIME_ANIMACION);
        // pixeles CSS del canvas (el canvas real esta escalado por devicePixelRatio,
        // pero todo el dibujo y el mouse trabajan en pixeles CSS)
        const aCanvas = (e) => {
            const r = canvas.getBoundingClientRect();
            return {x: e.clientX - r.left, y: e.clientY - r.top};
        };
        // Rueda: zoom alrededor del cursor.
        const alRueda = (e) => {
            e.preventDefault();
            const p = aCanvas(e);
            const factor = Math.exp(-e.deltaY * 0.0015);
            refLienzo.current.configuracion_lienzo.zoomEnPunto(factor, p.x, p.y);
        };
        canvas.addEventListener("wheel", alRueda, {passive: false});
        const alPasar = (e) => {
            if(!esAnimacion(e)) return;
            const p = aCanvas(e);
            if(refLienzo.current.esZonaTimeline(p.y)) return; // no se suelta sobre el timeline
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        };
        const alSoltar = (e) => {
            if(!esAnimacion(e)) return;
            e.preventDefault();
            const p = aCanvas(e);
            if(refLienzo.current.esZonaTimeline(p.y)) return;
            try{
                agregarAnimacionEnPunto(JSON.parse(e.dataTransfer.getData(MIME_ANIMACION)), p.x, p.y);
            }catch(err){
                console.error("No se pudo agregar la animacion soltada:", err);
            }
        };
        canvas.addEventListener("dragover", alPasar);
        canvas.addEventListener("drop", alSoltar);
        return () => {
            canvas.removeEventListener("wheel", alRueda);
            canvas.removeEventListener("dragover", alPasar);
            canvas.removeEventListener("drop", alSoltar);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startLoopLienzo]);

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
        gestionEventoLienzo.id_evento_seleccionado = id_evento_seleccionado;
    }, [tipo_modalidad_trabajo, id_evento_seleccionado]);




    const subirAnimacion1=async()=>{
        console.log("SUBBBBBBEEEEEEEE eventooooo!!!!")
        try{
            const eventos_ = eventoAnimacion.edicion.eventos.map((evento)=>{
                return evento.evento;
            });
            const datos = {
                "eventos": eventos_,
                "grupos_figuras": eventoAnimacion.edicion.gruposParaGuardar(),  // sin partes virtuales de instancias
                "escena": eventoAnimacion.edicion.escena || {}                  // Fase 8B: configuracion de la escena
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
                    // lo subido pasa a ser "lo guardado"; ya no hace falta el autoguardado
                    if(refHistorial.current) refHistorial.current.marcarGuardado();
                    try { localStorage.removeItem(claveAutoguardado(eventoAnimacion.edicion._id)); } catch (e) { /* nada */ }
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

    // Exporta el mismo contenido que se sube al backend (eventos + grupos de figuras).
    // ---------------- Historial, restaurar, importar, guardar como ----------------

    // Revisa cada 250 ms si el estado cambio (el historial registra solo los cambios
    // ya terminados) y mantiene la copia local de lo que no se subio.
    useEffect(() => {
        const id = setInterval(() => {
            const h = refHistorial.current;
            if (!h || !h.listo()) return;
            const io = refLienzo.current && refLienzo.current.eventoLienzoEvento;
            const ocupado = !!(io && io.mouse_click_down);
            const antes = h.sinGuardar();
            const registro = h.revisar(ocupado);
            if (registro || antes !== h.sinGuardar()) {
                try {
                    const clave = claveAutoguardado(refEvento.current.edicion._id);
                    if (h.sinGuardar()) localStorage.setItem(clave, JSON.stringify({fecha: Date.now(), estado: h.estadoActual()}));
                    else localStorage.removeItem(clave);
                } catch (e) { /* almacenamiento lleno o bloqueado: se sigue sin copia */ }
            }
        }, 250);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refrescarPaneles = () => setEventoAnimacion({edicion: refEvento.current.edicion});
    const deshacer = () => { if (refHistorial.current) { refHistorial.current.deshacer(); refrescarPaneles(); } };
    const rehacer = () => { if (refHistorial.current) { refHistorial.current.rehacer(); refrescarPaneles(); } };

    // Ctrl+Z / Ctrl+Y (y Ctrl+Shift+Z). En un campo de texto se deja el deshacer del navegador.
    useEffect(() => {
        const alTeclear = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
            const k = e.key.toLowerCase();
            if (k === "z" && !e.shiftKey) { e.preventDefault(); deshacer(); }
            else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); rehacer(); }
        };
        window.addEventListener("keydown", alTeclear);
        return () => window.removeEventListener("keydown", alTeclear);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Aviso del navegador al cerrar o recargar con cambios sin subir.
    useEffect(() => {
        const alSalir = (e) => {
            if (refHistorial.current && refHistorial.current.sinGuardar()) { e.preventDefault(); e.returnValue = ""; }
        };
        window.addEventListener("beforeunload", alSalir);
        return () => window.removeEventListener("beforeunload", alSalir);
    }, []);

    const configApi = (method, url, data) => ({
        method, url, data, withCredentials: true,
        headers: {"Content-Type": "application/json", Authorization: "Bearer " + datos_usuario?.token},
    });

    // Vuelve a lo guardado en el servidor (queda en el historial: se puede deshacer).
    const restaurarGuardado = async () => {
        const h = refHistorial.current;
        if (!h) return;
        if (h.sinGuardar() && !window.confirm("¿Descartar los cambios sin subir y volver a lo guardado en el servidor? (Se puede deshacer con Ctrl+Z)")) return;
        try {
            const r = await axios(configApi("get", "/api/evento/id/" + refEvento.current.edicion._id));
            refEvento.current.edicion.restaurarEstado({eventos: r.data.eventos, grupos: r.data.grupos_figuras, escena: r.data.escena});
            h.registrarAhora("Restaurar lo guardado");
            h.marcarGuardado();
            refrescarPaneles();
        } catch (e) {
            alert("No se pudo leer lo guardado: " + (e?.response?.data?.error || e?.message || e));
        }
    };

    // Recuperar el autoguardado local de una sesion anterior.
    const recuperarAutoguardado = () => {
        if (!recuperable || !refHistorial.current) return;
        refEvento.current.edicion.restaurarEstado(recuperable.estado);
        refHistorial.current.registrarAhora("Recuperar autoguardado");
        setRecuperable(null);
        refrescarPaneles();
    };
    const descartarAutoguardado = () => {
        try { localStorage.removeItem(claveAutoguardado(refEvento.current.edicion._id)); } catch (e) { /* nada */ }
        setRecuperable(null);
    };

    // Importar una escena exportada (JSON con eventos y grupos_figuras).
    const refArchivo = useRef(null);
    const importarArchivo = (archivo) => {
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
            try {
                const d = JSON.parse(lector.result);
                if (!Array.isArray(d.grupos_figuras) || !Array.isArray(d.eventos)) throw new Error("el archivo no tiene eventos y grupos_figuras");
                refEvento.current.edicion.restaurarEstado({eventos: d.eventos, grupos: d.grupos_figuras, escena: d.escena || {}});
                refHistorial.current && refHistorial.current.registrarAhora(`Importar ${archivo.name}`);
                refrescarPaneles();
            } catch (e) {
                alert("No se pudo importar: " + e.message);
            }
        };
        lector.readAsText(archivo);
    };

    // Guardar como: crea un documento de eventos nuevo en el proyecto y lo abre.
    const guardarComo = async () => {
        const ed = refEvento.current.edicion;
        const nombre = window.prompt("Nombre de la copia:", `${ed.nombre_doc || "Escena"} (copia)`);
        if (!nombre || !nombre.trim()) return;
        try {
            const est = ed.estadoEditable();
            const r = await axios(configApi("post", "/api/eventos", {
                id_proyecto: ed.id_proyecto, nombre: nombre.trim(), eventos: est.eventos,
                grupos_figuras: est.grupos, escena: est.escena, meta_figuras: ed.meta_figuras_doc || [],
            }));
            if (window.confirm(`Se guardó "${r.data.nombre}". ¿Abrirla ahora? (esta escena queda como estaba)`)) {
                window.location.assign("/evento/" + r.data._id);
            }
        } catch (e) {
            alert("No se pudo guardar la copia: " + (e?.response?.data?.error || e?.message || e));
        }
    };

    const exportarEvento = async () => {
        try {
            const edicion = eventoAnimacion.edicion;
            const datos = {
                "eventos": edicion.eventos.map((evento) => evento.evento),
                "grupos_figuras": edicion.gruposParaGuardar(),
                "escena": edicion.escena || {}
            };
            await exportarJSON(datos, "evento_" + edicion._id);
        } catch (error) {
            console.error('Error al exportar el evento:', error);
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

    // ---- Distribucion del editor (Fase 0): tamanos y visibilidad de paneles ----
    const [layout, setLayout] = useState(() => {
        const base = {izq: 320, der: 320, abajo: 230, ver_izq: true, ver_der: true, ver_abajo: true,
            pestana_der: "inspector", pestana_izq: "objetos", grilla: true, reglas: true};
        try{
            return {...base, ...JSON.parse(localStorage.getItem(CLAVE_LAYOUT) || "{}")};
        }catch(e){
            return base;
        }
    });
    const [modo, setModo] = useState("animar"); // "animar" | "dibujo"
    // al seleccionar un objeto en el lienzo, mostrar el Inspector (no la Biblioteca)
    useEffect(() => {
        if(objetosSeleccionados.length){
            setLayout((l) => (l.pestana_der === "inspector" && l.ver_der) ? l
                : {...l, pestana_der: "inspector", ver_der: true});
        }
    }, [objetosSeleccionados.length]);

    useEffect(() => {
        try{ localStorage.setItem(CLAVE_LAYOUT, JSON.stringify(layout)); }catch(e){ /* sin almacenamiento */ }
        // cuadricula y reglas viven en la configuracion del lienzo
        const c = refLienzo.current.configuracion_lienzo;
        c.mostrar_grilla = layout.grilla !== false;
        c.mostrar_reglas = layout.reglas !== false;
    }, [layout]);
    const redimensionar = (clave, delta, min, max) =>
        setLayout((l) => ({...l, [clave]: Math.min(max, Math.max(min, l[clave] + delta))}));
    const alternar = (clave) => setLayout((l) => ({...l, [clave]: !l[clave]}));
    const lienzoAccion = (accion) => {
        const c = refLienzo.current.configuracion_lienzo;
        if(accion === "ajustar") c.ajustarVista();
        if(accion === "100") c.zoomReal();
        if(accion === "mas") c.aumentarZoom();
        if(accion === "menos") c.disminuirZoom();
    };

    const props_paneles = {
        eventoAnimacion, setEventoAnimacion,
        eventoLienzoFigura: eventoLienzoEvento, setEventLienzoFigura: setEventLienzoEvento,
        tipoModalidad: tipo_modalidad, setTipoModalidad: setTipoModalidadTrabajo,
        edicion_figuras, manejadorErrores: props.manejadorErrores,
        // Fase 3: objeto en el que se "entro" (el arbol de grupos de Movimientos se
        // limita a sus partes)
        objetoActivo: rutaObjetos.length ? rutaObjetos[rutaObjetos.length - 1] : null,
    };

    const clases = ["editor-pro", `modo-${modo}`,
        layout.ver_izq ? "" : "sin-izq", layout.ver_der ? "" : "sin-der", layout.ver_abajo ? "" : "sin-abajo"].join(" ");

    return(
        <div className={clases} data-bs-theme="dark"
             style={{
                 // un panel oculto mide 0 (el estilo inline le gana a la clase .sin-*)
                 "--ed-izq": `${layout.ver_izq ? layout.izq : 0}px`,
                 "--ed-der": `${layout.ver_der ? layout.der : 0}px`,
                 "--ed-abajo": `${layout.ver_abajo ? layout.abajo : 0}px`,
             }}>

            {/* ---- barra superior ---- */}
            <header className="ed-barra">
                <button className="btn btn-sm btn-outline-secondary border-0" data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvas" title="Menu de la aplicacion">
                    <i className="bi bi-list fs-5"/>
                </button>
                <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary border-0 dropdown-toggle" data-bs-toggle="dropdown">
                        Archivo
                    </button>
                    <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={deshacer}
                                    disabled={!(refHistorial.current && refHistorial.current.puedeDeshacer())}>
                            <i className="bi bi-arrow-counterclockwise me-2"/>Deshacer<small className="ms-3 text-body-secondary">Ctrl+Z</small></button></li>
                        <li><button className="dropdown-item" onClick={rehacer}
                                    disabled={!(refHistorial.current && refHistorial.current.puedeRehacer())}>
                            <i className="bi bi-arrow-clockwise me-2"/>Rehacer<small className="ms-3 text-body-secondary">Ctrl+Y</small></button></li>
                        <li><button className="dropdown-item" onClick={() => setLayout((l) => ({...l, ver_izq: true, pestana_izq: "historial"}))}>
                            <i className="bi bi-clock-history me-2"/>Historial</button></li>
                        <li><hr className="dropdown-divider"/></li>
                        <li><button className="dropdown-item" onClick={subirAnimacion1}><i className="bi bi-upload me-2"/>Subir</button></li>
                        <li><button className="dropdown-item" onClick={guardarComo}><i className="bi bi-files me-2"/>Guardar como…</button></li>
                        <li><button className="dropdown-item" onClick={restaurarGuardado}><i className="bi bi-cloud-arrow-down me-2"/>Restaurar lo guardado</button></li>
                        <li><hr className="dropdown-divider"/></li>
                        <li><button className="dropdown-item" onClick={() => refArchivo.current && refArchivo.current.click()}>
                            <i className="bi bi-box-arrow-in-down me-2"/>Importar…</button></li>
                        <li><button className="dropdown-item" onClick={exportarEvento}><i className="bi bi-download me-2"/>Exportar</button></li>
                    </ul>
                    <input ref={refArchivo} type="file" accept=".json,application/json" className="d-none"
                           onChange={(e) => { importarArchivo(e.target.files && e.target.files[0]); e.target.value = ""; }}/>
                </div>
                <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary border-0 dropdown-toggle" data-bs-toggle="dropdown">
                        Ver
                    </button>
                    <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => alternar("ver_izq")}>
                            <i className={`bi ${layout.ver_izq ? "bi-check2" : "bi-dot"} me-2`}/>Panel de escena</button></li>
                        <li><button className="dropdown-item" onClick={() => alternar("ver_der")}>
                            <i className={`bi ${layout.ver_der ? "bi-check2" : "bi-dot"} me-2`}/>Panel derecho</button></li>
                        <li><button className="dropdown-item" onClick={() => alternar("ver_abajo")}>
                            <i className={`bi ${layout.ver_abajo ? "bi-check2" : "bi-dot"} me-2`}/>Linea de tiempo</button></li>
                        <li><hr className="dropdown-divider"/></li>
                        <li><button className="dropdown-item" onClick={() => alternar("grilla")}>
                            <i className={`bi ${layout.grilla !== false ? "bi-check2" : "bi-dot"} me-2`}/>Cuadrícula</button></li>
                        <li><button className="dropdown-item" onClick={() => alternar("reglas")}>
                            <i className={`bi ${layout.reglas !== false ? "bi-check2" : "bi-dot"} me-2`}/>Reglas</button></li>
                        <li><hr className="dropdown-divider"/></li>
                        <li><button className="dropdown-item" onClick={() => lienzoAccion("ajustar")}><i className="bi bi-arrows-fullscreen me-2"/>Ajustar a la vista</button></li>
                        <li><button className="dropdown-item" onClick={() => lienzoAccion("100")}><i className="bi bi-1-square me-2"/>Zoom 100 %</button></li>
                    </ul>
                </div>

                <span className="ed-titulo ms-2">Editor de eventos <small>· {props.id_evento}</small></span>
                <span className="ed-espacio"/>

                <div className="btn-group btn-group-sm" role="group" aria-label="Modo">
                    <button className={`btn ${modo === "animar" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setModo("animar")}>Animar</button>
                    <button className={`btn ${modo === "dibujo" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setModo("dibujo")}>Dibujo</button>
                </div>
                <span className="ed-espacio"/>
                {/* mostrar/ocultar paneles (siempre visibles, aunque el panel este oculto) */}
                <div className="btn-group btn-group-sm me-2" role="group" aria-label="Paneles">
                    {[["ver_izq", "bi-layout-sidebar", "Panel de escena (izquierda)"],
                      ["ver_abajo", "bi-layout-text-window-reverse", "Línea de tiempo (abajo)"],
                      ["ver_der", "bi-layout-sidebar-reverse", "Panel derecho (Inspector / Biblioteca)"]].map(([clave, icono, texto]) => (
                        <button key={clave} type="button"
                                className={`btn ${layout[clave] ? "btn-secondary" : "btn-outline-secondary"}`}
                                onClick={() => alternar(clave)} aria-pressed={layout[clave]}
                                title={`${layout[clave] ? "Ocultar" : "Mostrar"}: ${texto}`}>
                            <i className={`bi ${icono}`}/>
                        </button>
                    ))}
                </div>
                <div className="btn-group btn-group-sm me-2" role="group" aria-label="Historial" data-version={versionHist}>
                    <button type="button" className="btn btn-outline-secondary" onClick={deshacer}
                            disabled={!(refHistorial.current && refHistorial.current.puedeDeshacer())} title="Deshacer (Ctrl+Z)">
                        <i className="bi bi-arrow-counterclockwise"/>
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={rehacer}
                            disabled={!(refHistorial.current && refHistorial.current.puedeRehacer())} title="Rehacer (Ctrl+Y)">
                        <i className="bi bi-arrow-clockwise"/>
                    </button>
                </div>
                {refHistorial.current && refHistorial.current.sinGuardar() && (
                    <span className="ed-sin-guardar me-2" title="Hay cambios que todavía no se subieron al servidor">
                        <i className="bi bi-circle-fill me-1" style={{fontSize: "0.5rem"}}/>Sin guardar
                    </span>
                )}
                <button className="btn btn-sm btn-primary" onClick={subirAnimacion1} title="Guardar en el servidor">
                    <i className="bi bi-cloud-upload me-1"/>Subir
                </button>
            </header>

            {/* ---- panel izquierdo: Objetos de la escena / Eventos ---- */}
            <aside className="ed-panel ed-izq">
                <div className="ed-cabecera ed-pestanas">
                    <div className="d-flex h-100">
                        {[["objetos", "bi-boxes", "Objetos"], ["eventos", "bi-calendar-event", "Eventos"],
                          ["historial", "bi-clock-history", "Historial"]].map(([clave, icono, texto]) => (
                            <button key={clave} type="button"
                                    className={`ed-pestana ${(layout.pestana_izq || "objetos") === clave ? "activa" : ""}`}
                                    onClick={() => setLayout((l) => ({...l, pestana_izq: clave}))}>
                                <i className={`bi ${icono} me-1`}/>{texto}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-sm p-0 text-secondary" onClick={() => alternar("ver_izq")} title="Ocultar panel">
                        <i className="bi bi-chevron-double-left"/>
                    </button>
                </div>
                {/* ambas pestanas quedan montadas */}
                <div className={`ed-cuerpo ${(layout.pestana_izq || "objetos") === "objetos" ? "" : "d-none"}`}>
                    <PanelObjetosEscena refLienzo={refLienzo} ruta={rutaObjetos} seleccion={objetosSeleccionados}/>
                </div>
                <div className={`ed-cuerpo ${layout.pestana_izq === "eventos" ? "" : "d-none"}`}>
                    <NavEventos {...props_paneles}/>
                </div>
                <div className={`ed-cuerpo ${layout.pestana_izq === "historial" ? "" : "d-none"}`}>
                    <PanelHistorial historial={refHistorial.current} version={versionHist}
                                    onDeshacer={deshacer} onRehacer={rehacer} onRestaurar={restaurarGuardado}/>
                </div>
                <Separador orientacion="vertical" titulo="Arrastrar para cambiar el ancho"
                           onArrastrar={(d) => redimensionar("izq", d, 220, 640)}/>
            </aside>

            {/* ---- lienzo ---- */}
            <main className="ed-lienzo">
                <Lienzo lienzo={eventoLienzoEvento} id="lienzo-evento" editar_animacion={() => {}}
                        setEventLienzoFigura={setEventLienzoEvento}/>
                {/* autoguardado de una sesion anterior que no se subio */}
                {recuperable && (
                    <div className="ed-recuperar">
                        <i className="bi bi-life-preserver text-warning"/>
                        <span>Hay cambios sin subir de {new Date(recuperable.fecha).toLocaleString()}.</span>
                        <button className="btn btn-sm btn-warning py-0" onClick={recuperarAutoguardado}>Recuperar</button>
                        <button className="btn btn-sm btn-outline-secondary py-0" onClick={descartarAutoguardado}>Descartar</button>
                    </div>
                )}
                {/* Fase 3: migas del objeto en el que se entro (clic = volver a ese nivel) */}
                {rutaObjetos.length > 0 && (
                    <div className="ed-migas-lienzo">
                        <button onClick={() => refLienzo.current.control_objetos.irANivel(0)}>
                            <i className="bi bi-arrow-left me-1"/>Escena
                        </button>
                        {rutaObjetos.map((n, i) => (
                            <span key={n}>
                                <i className="bi bi-chevron-right mx-1"/>
                                <button className={i === rutaObjetos.length - 1 ? "actual" : ""}
                                        onClick={() => refLienzo.current.control_objetos.irANivel(i + 1)}>{n}</button>
                            </span>
                        ))}
                        <span className="ms-2 opacity-75">· Esc para salir</span>
                    </div>
                )}
                {/* pestanas en el borde para volver a abrir un panel oculto */}
                {!layout.ver_izq && (
                    <button type="button" className="ed-reabrir izq" onClick={() => alternar("ver_izq")}
                            title="Mostrar el panel de escena">
                        <i className="bi bi-chevron-double-right"/><span>Escena</span>
                    </button>
                )}
                {!layout.ver_der && (
                    <button type="button" className="ed-reabrir der" onClick={() => alternar("ver_der")}
                            title="Mostrar el panel derecho">
                        <i className="bi bi-chevron-double-left"/><span>Inspector</span>
                    </button>
                )}
                {!layout.ver_abajo && (
                    <button type="button" className="ed-reabrir abajo" onClick={() => alternar("ver_abajo")}
                            title="Mostrar la línea de tiempo">
                        <i className="bi bi-chevron-double-up me-1"/>Línea de tiempo
                    </button>
                )}
            </main>

            {/* ---- panel derecho: Inspector (lo seleccionado) / Biblioteca ---- */}
            <aside className="ed-panel ed-der">
                <div className="ed-cabecera ed-pestanas">
                    <div className="d-flex h-100">
                        {[["inspector", "bi-sliders", "Inspector"], ["biblioteca", "bi-collection", "Biblioteca"]].map(([clave, icono, texto]) => (
                            <button key={clave} type="button"
                                    className={`ed-pestana ${layout.pestana_der === clave ? "activa" : ""}`}
                                    onClick={() => setLayout((l) => ({...l, pestana_der: clave}))}>
                                <i className={`bi ${icono} me-1`}/>{texto}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-sm p-0 text-secondary" onClick={() => alternar("ver_der")} title="Ocultar panel">
                        <i className="bi bi-chevron-double-right"/>
                    </button>
                </div>
                {/* ambas pestanas quedan montadas (la biblioteca no recarga al volver) */}
                <div className={`ed-cuerpo ${layout.pestana_der === "inspector" ? "" : "d-none"}`}>
                    <Inspector {...props_paneles} refLienzo={refLienzo} objetosSeleccionados={objetosSeleccionados}/>
                </div>
                <div className={`ed-cuerpo ${layout.pestana_der === "biblioteca" ? "" : "d-none"}`}>
                    <OffcanvasAnimaciones id="bibliotecaAnimaciones" embebido onAgregar={agregarAnimacionAlCentro}/>
                </div>
                <Separador orientacion="vertical" titulo="Arrastrar para cambiar el ancho"
                           onArrastrar={(d) => redimensionar("der", -d, 220, 640)}/>
            </aside>

            {/* ---- linea de tiempo ---- */}
            <section className="ed-panel ed-abajo">
                <canvas id="timeline-evento"/>
                <button type="button" className="ed-ocultar-abajo" onClick={() => alternar("ver_abajo")}
                        title="Ocultar la línea de tiempo">
                    <i className="bi bi-chevron-double-down"/>
                </button>
                <Separador orientacion="horizontal" titulo="Arrastrar para cambiar el alto"
                           onArrastrar={(d) => redimensionar("abajo", -d, 120, 520)}/>
            </section>

            {/* ---- modo Dibujo: editor de figuras (aun con su aspecto anterior) ---- */}
            <div className="ed-dibujo">
                {edicion_figuras}
            </div>

            <BarraEstado refLienzo={refLienzo}/>
        </div>
    )
}

const CLAVE_LAYOUT = "editor_evento_layout_v1";

export default EditorEvento