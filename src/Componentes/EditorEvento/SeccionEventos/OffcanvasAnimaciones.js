import React, {useCallback, useEffect, useRef, useState} from "react";
import {Cookies} from "react-cookie";
import axios from "axios";
import {dibujarMiniatura} from "../../../Clases/EditorAnimacion/Miniatura";

// Tipo MIME propio para el arrastre: el lienzo de eventos solo acepta este tipo.
export const MIME_ANIMACION = "application/x-framework-animacion";

const ANCHO_MINI = 168;
const ALTO_MINI = 112;

function Miniatura({grupos}) {
    const ref = useRef(null);
    const [vacia, setVacia] = useState(false);
    useEffect(() => {
        if (ref.current) setVacia(!dibujarMiniatura(ref.current, grupos));
    }, [grupos]);
    return (
        <div className="position-relative bg-body-tertiary rounded" style={{height: ALTO_MINI}}>
            <canvas ref={ref} width={ANCHO_MINI} height={ALTO_MINI} className="d-block mx-auto"
                    style={{maxWidth: "100%", pointerEvents: "none"}}/>
            {vacia && (
                <span className="position-absolute top-50 start-50 translate-middle small text-body-secondary">
                    Sin figuras
                </span>
            )}
        </div>
    );
}

// Panel lateral (derecha) con las animaciones de cada proyecto como miniaturas.
// Cada miniatura se puede arrastrar y soltar sobre el lienzo de eventos, o
// seleccionar y agregar al centro de la vista con el boton. `onAgregar(animacion)`
// recibe {id, nombre, grupos_figuras}.
// `embebido`: se dibuja como contenido de un panel del editor (sin el envoltorio
// offcanvas) y carga los proyectos al montarse.
export default function OffcanvasAnimaciones({id = "offcanvasAnimaciones", onAgregar, embebido = false}) {
    const panelRef = useRef(null);
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");

    const [proyectos, setProyectos] = useState([]);      // [{id, nombre, animaciones:[{id, nombre}]}]
    const [proyectoId, setProyectoId] = useState(null);
    const [grupos, setGrupos] = useState({});            // id_animacion -> grupos_figuras
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [seleccion, setSeleccion] = useState(null);    // id_animacion
    const [filtro, setFiltro] = useState("");

    const configAxios = (method, url, data) => ({
        method, url, data,
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${datos_usuario?.token}`},
        withCredentials: true,
    });

    const cargarProyectos = useCallback(async () => {
        if (!datos_usuario?.id) {
            setError("No se encontro la sesion de usuario.");
            return;
        }
        setCargando(true);
        setError("");
        try {
            const res = await axios(configAxios("get", `/api/proyecto-animacion/${datos_usuario.id}`));
            const lista = (Array.isArray(res.data) ? res.data : []).map((p) => ({
                id: p.id_proyecto,
                nombre: p.nombre_proyecto,
                animaciones: (p.animaciones || []).map((a) => ({id: a.id_animacion, nombre: a.nombre_animacion})),
            }));
            setProyectos(lista);
            if (lista.length > 0) setProyectoId((actual) => actual || lista[0].id);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Error al obtener los proyectos.");
        } finally {
            setCargando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Se carga (o refresca) cada vez que se abre el panel.
    useEffect(() => {
        if (embebido) {
            void cargarProyectos();
            return;
        }
        const el = panelRef.current;
        if (!el) return;
        const alAbrir = () => { void cargarProyectos(); };
        el.addEventListener("show.bs.offcanvas", alAbrir);
        return () => el.removeEventListener("show.bs.offcanvas", alAbrir);
    }, [cargarProyectos, embebido]);

    const proyecto = proyectos.find((p) => p.id === proyectoId) || null;

    // Trae los grupos (para las miniaturas) de las animaciones del proyecto que
    // todavia no estan en cache, en una sola llamada.
    useEffect(() => {
        if (!proyecto) return;
        const faltan = proyecto.animaciones.map((a) => a.id).filter((idA) => !(idA in grupos));
        if (faltan.length === 0) return;
        let cancelado = false;
        (async () => {
            try {
                const res = await axios(configAxios("post", "/api/animaciones/lista", {ids: faltan}));
                if (cancelado) return;
                setGrupos((prev) => {
                    const next = {...prev};
                    for (const a of res.data || []) next[a._id] = a.grupos_figuras || [];
                    for (const idA of faltan) if (!(idA in next)) next[idA] = [];
                    return next;
                });
            } catch (e) {
                if (!cancelado) setError(e?.response?.data?.error || e?.message || "Error al cargar las miniaturas.");
            }
        })();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proyecto, grupos]);

    const animaciones = (proyecto?.animaciones || [])
        .filter((a) => a.nombre.toLowerCase().includes(filtro.trim().toLowerCase()));

    const paquete = (a) => ({id: a.id, nombre: a.nombre, grupos_figuras: grupos[a.id] || []});

    const alArrastrar = (e, a) => {
        if (!(a.id in grupos)) { e.preventDefault(); return; }
        e.dataTransfer.setData(MIME_ANIMACION, JSON.stringify(paquete(a)));
        e.dataTransfer.effectAllowed = "copy";
        setSeleccion(a.id);
    };

    const seleccionada = proyecto?.animaciones.find((a) => a.id === seleccion) || null;

    return (
        <div ref={panelRef} id={id}
             {...(embebido
                 ? {className: "d-flex flex-column h-100"}
                 : {className: "offcanvas offcanvas-end", tabIndex: "-1", "data-bs-scroll": "true",
                    "data-bs-backdrop": "false", "aria-labelledby": `${id}-titulo`, style: {width: 420}})}>
            {!embebido && (
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title" id={`${id}-titulo`}>
                        <i className="bi bi-collection me-2"/>Animaciones
                    </h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"/>
                </div>
            )}

            <div className={embebido
                ? "flex-grow-1 overflow-auto p-2 d-flex flex-column gap-2"
                : "offcanvas-body d-flex flex-column gap-3"}>
                <div className="d-flex gap-2">
                    <select className="form-select form-select-sm" value={proyectoId || ""}
                            onChange={(e) => { setProyectoId(e.target.value); setSeleccion(null); }}
                            disabled={cargando || proyectos.length === 0} aria-label="Proyecto">
                        {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <button className="btn btn-sm btn-outline-secondary" onClick={cargarProyectos}
                            disabled={cargando} title="Recargar">
                        <i className="bi bi-arrow-clockwise"/>
                    </button>
                </div>
                <input type="search" className="form-control form-control-sm" placeholder="Buscar animacion…"
                       value={filtro} onChange={(e) => setFiltro(e.target.value)}/>

                <div className="small text-body-secondary">
                    Arrastra una miniatura al lienzo para agregarla donde la sueltes, o seleccionala y usa
                    &laquo;Agregar al centro&raquo;.
                </div>

                {error && <div className="alert alert-danger py-2 small mb-0">{error}</div>}
                {cargando && (
                    <div className="d-flex align-items-center gap-2 small">
                        <div className="spinner-border spinner-border-sm" role="status"/> Cargando proyectos…
                    </div>
                )}
                {!cargando && proyecto && animaciones.length === 0 && (
                    <div className="small text-body-secondary">No hay animaciones en este proyecto.</div>
                )}

                <div className="row row-cols-2 g-2 overflow-auto">
                    {animaciones.map((a) => {
                        const activa = seleccion === a.id;
                        const lista = a.id in grupos;
                        return (
                            <div className="col" key={a.id}>
                                <div role="button" tabIndex={0} draggable={lista}
                                     onDragStart={(e) => alArrastrar(e, a)}
                                     onClick={() => setSeleccion(activa ? null : a.id)}
                                     onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSeleccion(a.id); }}
                                     className={`card h-100 ${activa ? "border-primary border-2 shadow-sm" : ""}`}
                                     style={{cursor: lista ? "grab" : "progress"}}
                                     title={a.nombre}>
                                    <div className="card-body p-2">
                                        {lista
                                            ? <Miniatura grupos={grupos[a.id]}/>
                                            : <div className="placeholder-glow"><span className="placeholder col-12 rounded" style={{height: ALTO_MINI}}/></div>}
                                        <div className="small text-truncate mt-1">{a.nombre}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-top p-3 d-flex justify-content-between align-items-center gap-2">
                <span className="small text-truncate text-body-secondary">
                    {seleccionada ? seleccionada.nombre : "Ninguna seleccionada"}
                </span>
                <button className="btn btn-primary btn-sm" disabled={!seleccionada || !(seleccionada.id in grupos)}
                        onClick={() => onAgregar && onAgregar(paquete(seleccionada))}>
                    <i className="bi bi-plus-lg me-1"/>Agregar al centro
                </button>
            </div>
        </div>
    );
}
