import React, { useEffect, useMemo, useState, useId } from "react";
import {Cookies} from 'react-cookie';
import axios from "axios";

export default function ModalImportarGrupos({
                                                id = "dualListModal",
                                                title = "Importando Grupos",
                                            }) {
    // 🔹 Datos dummy: proyectos y sus animaciones
    const projects = [
        {
            id: "p1",
            nombre: "Proyecto Alfa",
            animaciones: Array.from({ length: 6 }, (_, i) => ({
                id: `p1-a${i + 1}`,
                label: `Animación Alfa ${i + 1}`,
                projectId: "p1",
                projectName: "Proyecto Alfa",
            })),
        },
        {
            id: "p2",
            nombre: "Proyecto Beta",
            animaciones: Array.from({ length: 7 }, (_, i) => ({
                id: `p2-b${i + 1}`,
                label: `Animación Beta ${i + 1}`,
                projectId: "p2",
                projectName: "Proyecto Beta",
            })),
        },
        {
            id: "p3",
            nombre: "Proyecto Gamma",
            animaciones: Array.from({ length: 5 }, (_, i) => ({
                id: `p3-c${i + 1}`,
                label: `Animación Gamma ${i + 1}`,
                projectId: "p3",
                projectName: "Proyecto Gamma",
            })),
        },
    ];

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")


    // const removerCookieUser_=props.removeCookieUser;
    //
    const obtenerListaProyectos=async()=>{
        // try {
        //     const url = "api/proyecto/user/"+datos_usuario.id;
        //     //console.log("url: "+url)
        //     if(true){
        //         //console.log(cookie)
        //         const token = datos_usuario.token
        //         const config = {
        //             method: 'get',
        //             url: url,
        //             headers: {
        //                 "Content-Type": "application/json",
        //                 'Accept': 'application/json',
        //                 'Authorization': 'Bearer '+token,
        //                 //'Cookie': 'app.sid=s%3AvQpGktI'
        //             },
        //             withCredentials: true
        //         };
        //
        //         let res = await axios(config)
        //             .then(function (response) {
        //                 //console.log("funciono")
        //                 //console.log(response.data);
        //                 setProyectos(response.data)
        //             })
        //             .catch(function (response) {
        //                 console.log("error obtener proyectos")
        //                 console.log(response.response.data);
        //                 props.manejadorErrores(response.response.data)
        //             });
        //     }
        //
        // } catch (err) {
        //     //console.log(err);
        // }
    }

    useEffect(()=>{

    },[])

    // Índices útiles
    const allItems = useMemo(
        () => projects.flatMap((p) => p.animaciones),
        [projects]
    );
    const itemById = useMemo(() => {
        const map = new Map();
        allItems.forEach((it) => map.set(it.id, it));
        return map;
    }, [allItems]);

    // Proyecto seleccionado (derecha)
    const [projectId, setProjectId] = useState(projects[0].id);

    // 🔸 Seleccionados globales (izquierda): Set con ids de animaciones
    const [leftSet, setLeftSet] = useState(new Set());

    // Checks temporales
    const [rightChecked, setRightChecked] = useState(new Set());
    const [leftChecked, setLeftChecked] = useState(new Set());

    // Cambiar de proyecto limpia selección de la derecha
    useEffect(() => {
        setRightChecked(new Set());
    }, [projectId]);

    // Derivados (lista derecha = proyecto actual - los que ya están en la izquierda global)
    const currentProject = projects.find((p) => p.id === projectId) ?? projects[0];
    const rightItems = useMemo(
        () => currentProject.animaciones.filter((it) => !leftSet.has(it.id)),
        [currentProject, leftSet]
    );

    // Lista izquierda GLOBAL: todos los ítems cuyo id esté en leftSet, con etiqueta de proyecto
    const leftItems = useMemo(
        () =>
            Array.from(leftSet)
                .map((id) => itemById.get(id))
                .filter(Boolean)
                // ordenar por nombre de proyecto, luego label (opcional)
                .sort((a, b) =>
                    a.projectName.localeCompare(b.projectName) || a.label.localeCompare(b.label)
                ),
        [leftSet, itemById]
    );

    // Handlers derecha
    const toggleRightCheck = (id) => {
        setRightChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const selectAllRight = () => setRightChecked(new Set(rightItems.map((it) => it.id)));
    const deselectAllRight = () => setRightChecked(new Set());
    const moveRightToLeft = () => {
        if (rightChecked.size === 0) return;
        setLeftSet((prev) => {
            const next = new Set(prev);
            rightChecked.forEach((id) => next.add(id));
            return next;
        });
        setRightChecked(new Set());
    };

    // Handlers izquierda (global)
    const toggleLeftCheck = (id) => {
        setLeftChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const selectAllLeft = () => setLeftChecked(new Set(leftItems.map((it) => it.id)));
    const deselectAllLeft = () => setLeftChecked(new Set());
    const removeFromLeft = () => {
        if (leftChecked.size === 0) return;
        setLeftSet((prev) => {
            const next = new Set(prev);
            leftChecked.forEach((id) => next.delete(id));
            return next;
        });
        setLeftChecked(new Set());
    };

    const headingId = useId();

    return (
        <div className="modal fade" id={id} tabIndex="-1" aria-labelledby={headingId} aria-hidden="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id={headingId}>{title}</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>

                    <div className="modal-body">
                        <div className="row g-3">
                            {/* Izquierda: selección global */}
                            <div className="col-12 col-md-6">
                                <div className="card h-100">
                                    <div className="card-header py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <strong>Seleccionados (global)</strong>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-sm btn-outline-secondary"
                                                    onClick={selectAllLeft} disabled={leftItems.length === 0}>
                                                Seleccionar todo
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary"
                                                    onClick={deselectAllLeft} disabled={leftChecked.size === 0}>
                                                Deseleccionar todo
                                            </button>
                                            <button type="button" className="btn btn-sm btn-danger"
                                                    onClick={removeFromLeft} disabled={leftChecked.size === 0}
                                                    title="Quitar seleccionados (volverán a su proyecto en la derecha)">
                                                Quitar ←
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-0">
                                        {leftItems.length === 0 ? (
                                            <div className="p-3 text-body-secondary small">Sin elementos aún</div>
                                        ) : (
                                            <ul className="list-group list-group-flush overflow-auto" style={{ maxHeight: 360 }}>
                                                {leftItems.map((it) => {
                                                    const inputId = `left-${id}-${it.id}`;
                                                    const checked = leftChecked.has(it.id);
                                                    return (
                                                        <li key={it.id} className="list-group-item d-flex align-items-center justify-content-between">
                                                            <div className="form-check">
                                                                <input
                                                                    id={inputId}
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={checked}
                                                                    onChange={() => toggleLeftCheck(it.id)}
                                                                />
                                                                <label className="form-check-label" htmlFor={inputId}>
                                                                    {it.label}
                                                                    <span className="ms-2 badge text-bg-light border">
                                    {it.projectName}
                                  </span>
                                                                </label>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Derecha: proyecto + animaciones disponibles */}
                            <div className="col-12 col-md-6">
                                <div className="card h-100">
                                    <div className="card-header py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <strong>Origen (derecha)</strong>
                                            <span className="text-body-secondary small">· Proyecto</span>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 240 }}
                                                value={projectId}
                                                onChange={(e) => setProjectId(e.target.value)}
                                            >
                                                {projects.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-sm btn-outline-secondary"
                                                    onClick={selectAllRight} disabled={rightItems.length === 0}>
                                                Seleccionar todo
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary"
                                                    onClick={deselectAllRight} disabled={rightChecked.size === 0}>
                                                Deseleccionar todo
                                            </button>
                                            <button type="button" className="btn btn-sm btn-primary"
                                                    onClick={moveRightToLeft} disabled={rightChecked.size === 0}
                                                    title="Pasar seleccionados a la izquierda (global)">
                                                Pasar →
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-0">
                                        {rightItems.length === 0 ? (
                                            <div className="p-3 text-body-secondary small">No hay más elementos para seleccionar</div>
                                        ) : (
                                            <ul className="list-group list-group-flush overflow-auto" style={{ maxHeight: 360 }}>
                                                {rightItems.map((it) => {
                                                    const inputId = `right-${id}-${it.id}`;
                                                    const checked = rightChecked.has(it.id);
                                                    return (
                                                        <li key={it.id} className="list-group-item d-flex align-items-center">
                                                            <div className="form-check">
                                                                <input
                                                                    id={inputId}
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={checked}
                                                                    onChange={() => toggleRightCheck(it.id)}
                                                                />
                                                                <label className="form-check-label" htmlFor={inputId}>
                                                                    {it.label}
                                                                </label>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* fin derecha */}
                        </div>
                    </div>

                    <div className="modal-footer">
                        {/* Si quieres, aquí puedes leer Array.from(leftSet) para enviar al backend */}
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
