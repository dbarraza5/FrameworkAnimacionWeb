import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import { Cookies } from "react-cookie";
import axios from "axios";

export default function ModalImportarGrupos({
                                                id = "dualListModal",
                                                title = "Importando Grupos",
                                            }) {
    const headingId = useId();
    const modalRef = useRef(null);

    // Cookies / auth
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario"); // { id, token, ... }

    // Estado API
    const [projects, setProjects] = useState([]);            // [{id, nombre, animaciones:[{id,label,projectId,projectName, ...}]}]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasFetched, setHasFetched] = useState(false);     // para no recargar si ya se cargó una vez

    // Proyecto seleccionado (derecha)
    const [projectId, setProjectId] = useState(null);

    // 🔸 Seleccionados globales (izquierda): Set con ids de animaciones
    const [leftSet, setLeftSet] = useState(new Set());

    // Checks temporales
    const [rightChecked, setRightChecked] = useState(new Set());
    const [leftChecked, setLeftChecked] = useState(new Set());

    // --- Carga diferida: sólo cuando el modal se abre
    useEffect(() => {
        if (!modalRef.current) return;

        const el = modalRef.current;
        const onShow = () => {
            if (hasFetched) return; // ya cargado
            void obtenerListaProyectos(); // dispara la carga
        };

        el.addEventListener("show.bs.modal", onShow);
        return () => el.removeEventListener("show.bs.modal", onShow);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasFetched]);

    // --- Fetch API
    const obtenerListaProyectos = async () => {
        if (!datos_usuario?.id || !datos_usuario?.token) {
            setError("No se encontró la sesión de usuario en las cookies.");
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError("");

        try {
            const url = `/api/proyecto-animacion/${datos_usuario.id}`;
            const config = {
                method: "get",
                url,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${datos_usuario.token}`,
                },
                signal: controller.signal,
            };

            const response = await axios(config);
            const lista = Array.isArray(response.data) ? response.data : [];

            // Normalización inmutable
            const norm = lista.map((obj) => {
                const animaciones_ = (obj.animaciones ?? []).map((a) => ({
                    id: a.id_animacion,
                    label: a.nombre_animacion,
                    fecha_creacion: a.fecha_creacion,
                    fecha_actualizacion: a.fecha_actualizacion,
                    projectId: obj.id_proyecto,
                    projectName: obj.nombre_proyecto,
                }));
                return {
                    id: obj.id_proyecto,
                    nombre: obj.nombre_proyecto,
                    animaciones: animaciones_,
                };
            });

            setProjects(norm);
            setHasFetched(true);

            // Seleccionar proyecto por defecto si no hay
            if (norm.length > 0 && !projectId) {
                setProjectId(norm[0].id);
            }
        } catch (e) {
            console.error(e);
            setError(
                e?.response?.data?.message ||
                e?.message ||
                "Error al obtener la lista de proyectos."
            );
        } finally {
            setLoading(false);
        }
    };

    // Cambiar de proyecto limpia selección de la derecha
    useEffect(() => {
        setRightChecked(new Set());
    }, [projectId]);

    // Índices útiles
    const allItems = useMemo(
        () => projects.flatMap((p) => p.animaciones ?? []),
        [projects]
    );

    const itemById = useMemo(() => {
        const map = new Map();
        allItems.forEach((it) => map.set(it.id, it));
        return map;
    }, [allItems]);

    // Derivados (lista derecha = proyecto actual - los que ya están en la izquierda global)
    const currentProject = useMemo(
        () => projects.find((p) => p.id === projectId) || null,
        [projects, projectId]
    );

    const rightItems = useMemo(() => {
        if (!currentProject) return [];
        return (currentProject.animaciones ?? []).filter((it) => !leftSet.has(it.id));
    }, [currentProject, leftSet]);

    // Lista izquierda GLOBAL ordenada
    const leftItems = useMemo(() => {
        return Array.from(leftSet)
            .map((id) => itemById.get(id))
            .filter(Boolean)
            .sort(
                (a, b) =>
                    a.projectName.localeCompare(b.projectName) ||
                    a.label.localeCompare(b.label)
            );
    }, [leftSet, itemById]);

    // Handlers derecha
    const toggleRightCheck = (id) => {
        setRightChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const selectAllRight = () =>
        setRightChecked(new Set(rightItems.map((it) => it.id)));
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
    const selectAllLeft = () =>
        setLeftChecked(new Set(leftItems.map((it) => it.id)));
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

    // UI helpers
    const renderRightList = () => {
        if (loading) {
            return (
                <div className="p-3 d-flex align-items-center gap-2">
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span className="small">Cargando proyectos…</span>
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-3 text-danger small">
                    {error}
                </div>
            );
        }
        if (!projects.length) {
            return (
                <div className="p-3 text-body-secondary small">
                    No hay proyectos disponibles.
                </div>
            );
        }
        if (!currentProject) {
            return (
                <div className="p-3 text-body-secondary small">
                    Selecciona un proyecto para ver sus animaciones.
                </div>
            );
        }
        if (rightItems.length === 0) {
            return (
                <div className="p-3 text-body-secondary small">
                    No hay más elementos para seleccionar
                </div>
            );
        }
        return (
            <ul
                className="list-group list-group-flush overflow-auto"
                style={{ maxHeight: 360 }}
            >
                {rightItems.map((it) => {
                    const inputId = `right-${id}-${it.id}`;
                    const checked = rightChecked.has(it.id);
                    return (
                        <li
                            key={it.id}
                            className="list-group-item d-flex align-items-center"
                        >
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
        );
    };

    return (
        <div
            ref={modalRef}
            className="modal fade"
            id={id}
            tabIndex="-1"
            aria-labelledby={headingId}
            aria-hidden="true"
        >
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id={headingId}>
                            {title}
                        </h1>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Cerrar"
                        />
                    </div>

                    <div className="modal-body">
                        <div className="row g-3">
                            {/* Izquierda: selección global */}
                            <div className="col-12 col-md-6">
                                <div className="card h-100">
                                    <div className="card-header py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <strong>Seleccionados (global)</strong>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={selectAllLeft}
                                                disabled={leftItems.length === 0}
                                            >
                                                Seleccionar todo
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={deselectAllLeft}
                                                disabled={leftChecked.size === 0}
                                            >
                                                Deseleccionar todo
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger"
                                                onClick={removeFromLeft}
                                                disabled={leftChecked.size === 0}
                                                title="Quitar seleccionados (volverán a su proyecto en la derecha)"
                                            >
                                                Quitar ←
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-0">
                                        {leftItems.length === 0 ? (
                                            <div className="p-3 text-body-secondary small">
                                                Sin elementos aún
                                            </div>
                                        ) : (
                                            <ul
                                                className="list-group list-group-flush overflow-auto"
                                                style={{ maxHeight: 360 }}
                                            >
                                                {leftItems.map((it) => {
                                                    const inputId = `left-${id}-${it.id}`;
                                                    const checked = leftChecked.has(it.id);
                                                    return (
                                                        <li
                                                            key={it.id}
                                                            className="list-group-item d-flex align-items-center justify-content-between"
                                                        >
                                                            <div className="form-check">
                                                                <input
                                                                    id={inputId}
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={checked}
                                                                    onChange={() => toggleLeftCheck(it.id)}
                                                                />
                                                                <label
                                                                    className="form-check-label"
                                                                    htmlFor={inputId}
                                                                >
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
                                                value={projectId || ""}
                                                onChange={(e) => setProjectId(e.target.value)}
                                                disabled={loading || !!error || projects.length === 0}
                                            >
                                                {projects.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={selectAllRight}
                                                disabled={loading || rightItems.length === 0}
                                            >
                                                Seleccionar todo
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={deselectAllRight}
                                                disabled={rightChecked.size === 0}
                                            >
                                                Deseleccionar todo
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={moveRightToLeft}
                                                disabled={rightChecked.size === 0}
                                                title="Pasar seleccionados a la izquierda (global)"
                                            >
                                                Pasar →
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-0">{renderRightList()}</div>
                                </div>
                            </div>
                            {/* fin derecha */}
                        </div>
                    </div>

                    <div className="modal-footer">
                        {/* Ejemplo de lectura para enviar al backend */}
                        {/* <button className="btn btn-primary" onClick={() => console.log('Seleccionados:', Array.from(leftSet))}>Importar</button> */}
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
