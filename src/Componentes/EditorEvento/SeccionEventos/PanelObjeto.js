import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {Cookies} from "react-cookie";
import {normalizarTransformacion} from "../../../Clases/EditorAnimacion/TransformacionInstancia";

// 6C: llamadas a la API de versiones de un documento de eventos.
const configApi = (method, url) => ({
    method, url, withCredentials: true,
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${new Cookies().get("usuario")?.token}`},
});

// Inspector -> Objeto (Fase 2): propiedades del objeto seleccionado en el lienzo:
// posicion, rotacion, escala, espejo y capa, mas duplicar / borrar.
// Los valores se leen del editor con un sondeo liviano (asi siguen a las manijas
// mientras se arrastra) salvo el campo que se esta escribiendo.
export default function PanelObjeto({refLienzo, seleccion}) {
    const [valores, setValores] = useState(null);
    const enfocado = useRef(null);
    const ev = () => refLienzo.current.eventos_;
    const control = () => refLienzo.current.control_objetos;
    const unico = seleccion.length === 1 ? seleccion[0] : null;

    const leer = () => {
        if (!unico) return null;
        const g = ev().gestion_grupos_originales.getGrupo(unico);
        if (!g) return null;
        const t = normalizarTransformacion(g.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0};
        const inst = g.instancia && g.instancia.id_eventos ? g.instancia : null;
        const asset = inst ? ev().infoAsset(inst.id_eventos, inst.version) : null;
        return {x: g.cx, y: g.cy, rotacion: t.rotacion, escala_x: t.escala_x, escala_y: t.escala_y,
            ancla_x: t.ancla_x, ancla_y: t.ancla_y, capa: g.capa, tiene_t: !!g.transformacion,
            // Fase 6: datos de la instancia por referencia
            inst_evento: inst ? (inst.evento || "EventoGeneral") : null,
            inst_bucle: inst ? inst.bucle !== false : null,
            desfase: inst ? (inst.desfase || 0) : null,
            asset_estado: asset ? asset.estado : (inst ? "cargando" : null),
            asset_nombre: inst ? ev().nombreAsset(g) : "",
            asset_eventos: asset ? asset.eventos : [],
            asset_error: asset ? asset.error : "",
            id_eventos: inst ? inst.id_eventos : null,
            inst_version: inst ? (inst.version || "") : null};
    };

    // 6C: versiones congeladas del asset de la instancia seleccionada
    const [versiones, setVersiones] = useState([]);
    const [msjVersion, setMsjVersion] = useState("");
    const idAsset = valores && valores.id_eventos;
    const cargarVersiones = () => {
        if (!idAsset) { setVersiones([]); return; }
        axios(configApi("get", `/api/evento/id/${idAsset}/versiones`))
            .then((r) => setVersiones(r.data || []))
            .catch((e) => setMsjVersion("No se pudieron leer las versiones: " + (e?.message || e)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setMsjVersion(""); cargarVersiones(); }, [idAsset]);

    const fijarVersionActual = async () => {
        try {
            setMsjVersion("Guardando versión…");
            const r = await axios(configApi("post", `/api/evento/id/${idAsset}/versiones`));
            ev().cambiarInstancia(unico, {version: r.data._id});
            setMsjVersion(`Fijada en la versión ${r.data.numero}.`);
            cargarVersiones();
        } catch (e) {
            setMsjVersion("No se pudo crear la versión: " + (e?.response?.data?.error || e?.message || e));
        }
    };

    useEffect(() => {
        setValores(leer());
        const id = setInterval(() => {
            const nuevos = leer();
            setValores((prev) => {
                if (!nuevos || !prev) return nuevos;
                // no pisar el campo que el usuario esta escribiendo
                return enfocado.current ? {...nuevos, [enfocado.current]: prev[enfocado.current]} : nuevos;
            });
        }, 200);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unico]);

    if (!seleccion.length) return null;

    const aplicar = (campo, texto) => {
        const v = parseFloat(texto);
        if (!Number.isFinite(v) || !unico) return;
        if (campo === "x" || campo === "y") {
            const p = ev().posicionObjeto(unico);
            ev().fijarPosicionObjeto(unico, campo === "x" ? v : p.x, campo === "y" ? v : p.y);
        } else if (campo === "desfase") {
            ev().cambiarInstancia(unico, {desfase: Math.round(v)});
        } else if (campo === "capa") {
            for (const g of [ev().gestion_grupos_originales.getGrupo(unico), ev().gestion_grupos.getGrupo(unico)]) {
                if (g) g.capa = Math.round(v);
            }
        } else {
            ev().cambiarTransformacion(unico, {[campo]: v});
        }
    };

    const espejo = (eje) => {
        for (const n of seleccion) {
            const t = ev().asegurarTransformacion(n);
            ev().cambiarTransformacion(n, eje === "x" ? {escala_x: -t.escala_x} : {escala_y: -t.escala_y});
        }
    };
    const restablecer = () => seleccion.forEach((n) => ev().cambiarTransformacion(n, {rotacion: 0, escala_x: 1, escala_y: 1}));
    const duplicar = () => {
        const copias = seleccion.map((n) => ev().duplicarObjeto(n)).filter(Boolean);
        if (copias.length) control().seleccionar(copias);
    };
    const borrar = () => {
        seleccion.forEach((n) => ev().eliminarObjeto(n));
        control().seleccionar([]);
    };

    const campo = (nombre, etiqueta, paso = 1, sufijo = "") => (
        <div className="col-6">
            <label className="form-label small mb-0 text-body-secondary">{etiqueta}</label>
            <div className="input-group input-group-sm">
                <input type="number" step={paso} className="form-control form-control-sm"
                       value={valores ? (valores[nombre] ?? "") : ""}
                       onFocus={() => { enfocado.current = nombre; }}
                       onBlur={(e) => { enfocado.current = null; aplicar(nombre, e.target.value); }}
                       onChange={(e) => {
                           setValores((v) => ({...v, [nombre]: e.target.value}));
                           aplicar(nombre, e.target.value);
                       }}/>
                {sufijo && <span className="input-group-text">{sufijo}</span>}
            </div>
        </div>
    );

    return (
        <div className="p-2 d-flex flex-column gap-2">
            <div className="small">
                <span className="text-body-secondary text-uppercase fw-semibold" style={{fontSize: "0.65rem"}}>
                    {seleccion.length === 1 ? "Objeto" : "Objetos"}
                </span>
                <div className="fw-semibold text-truncate">
                    {unico || `${seleccion.length} seleccionados`}
                </div>
            </div>

            {unico && valores && (
                <div className="ed-objeto-campos">
                    <div className="row g-2">
                        {campo("x", "Posición X")}
                        {campo("y", "Posición Y")}
                        {campo("rotacion", "Rotación", 1, "°")}
                        {campo("capa", "Capa")}
                        {campo("escala_x", "Escala X", 0.05)}
                        {campo("escala_y", "Escala Y", 0.05)}
                        {campo("ancla_x", "Ancla X")}
                        {campo("ancla_y", "Ancla Y")}
                    </div>
                </div>
            )}

            {unico && valores && valores.inst_evento !== null && (
                <div className="ed-objeto-campos">
                    <div className="small fw-semibold mb-1">
                        <i className="bi bi-link-45deg text-info me-1"/>Instancia de {valores.asset_nombre || "asset"}
                        {valores.asset_estado === "cargando" && <span className="spinner-border spinner-border-sm ms-2"/>}
                    </div>
                    {valores.asset_estado === "error" && (
                        <div className="alert alert-danger py-1 px-2 small mb-2">No se pudo cargar el asset: {valores.asset_error}</div>
                    )}
                    <div className="row g-2">
                        <div className="col-12">
                            <label className="form-label small mb-0 text-body-secondary">Evento que reproduce</label>
                            <select className="form-select form-select-sm" value={valores.inst_evento}
                                    onChange={(e) => ev().cambiarInstancia(unico, {evento: e.target.value})}>
                                {(valores.asset_eventos.length ? valores.asset_eventos : [valores.inst_evento]).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        {campo("desfase", "Desfase", 100, "ms")}
                        <div className="col-6 d-flex align-items-end">
                            <div className="form-check form-switch small mb-1">
                                <input className="form-check-input" type="checkbox" id="inst-bucle"
                                       checked={valores.inst_bucle}
                                       onChange={(e) => ev().cambiarInstancia(unico, {bucle: e.target.checked})}/>
                                <label className="form-check-label" htmlFor="inst-bucle">Repetir</label>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="form-label small mb-0 text-body-secondary">Versión del asset</label>
                        <div className="input-group input-group-sm">
                            <select className="form-select form-select-sm" value={valores.inst_version}
                                    onChange={(e) => { ev().cambiarInstancia(unico, {version: e.target.value}); setMsjVersion(""); }}>
                                <option value="">Última (se actualiza sola)</option>
                                {versiones.map((v) => (
                                    <option key={v._id} value={v._id}>
                                        v{v.numero} · {new Date(v.fecha_creacion).toLocaleString()}{v.descripcion ? ` · ${v.descripcion}` : ""}
                                    </option>
                                ))}
                            </select>
                            <button className="btn btn-outline-secondary" onClick={fijarVersionActual}
                                    title="Guarda una foto del asset tal como está ahora y fija esta instancia en ella: ya no cambiará aunque se edite el original.">
                                <i className="bi bi-pin-angle me-1"/>Fijar actual
                            </button>
                        </div>
                        {msjVersion && <div className="small text-body-secondary mt-1">{msjVersion}</div>}
                    </div>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                        <button className="btn btn-sm btn-outline-info"
                                title="Abre el proyecto del asset en otra pestaña. Al guardar allí con Subir y volver aquí, las instancias que siguen la última versión se actualizan solas."
                                onClick={() => window.open(`/evento/${valores.id_eventos}`, "_blank", "noopener")}>
                            <i className="bi bi-box-arrow-up-right me-1"/>Abrir para editar
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" title="Volver a leer el asset del servidor"
                                onClick={() => { void ev().recargarAssets(); cargarVersiones(); }}>
                            <i className="bi bi-arrow-clockwise me-1"/>Recargar
                        </button>
                    </div>
                    <div className="small text-body-secondary mt-1">
                        El dibujo y los movimientos vienen del asset; para cambiarlos edita su proyecto.
                    </div>
                    <button className="btn btn-sm btn-outline-warning mt-2" disabled={valores.asset_estado !== "listo"}
                            title="Convertir en una copia del dibujo, editable parte por parte. Deja de seguir al asset y queda quieta (sin sus eventos)."
                            onClick={() => {
                                if (!window.confirm(`¿Desvincular "${unico}"? Pasará a ser una copia del dibujo, sin los eventos del asset, y ya no se actualizará si cambia el original.`)) return;
                                const r = ev().desvincularInstancia(unico);
                                if (r.error) { alert(r.error); return; }
                                control().seleccionar([r.nombre]);
                            }}>
                        <i className="bi bi-link-45deg me-1"/>Desvincular (copia editable)
                    </button>
                </div>
            )}

            <div className="d-flex flex-wrap gap-1">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => espejo("x")} title="Reflejar horizontalmente">
                    <i className="bi bi-symmetry-vertical me-1"/>Espejo H
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => espejo("y")} title="Reflejar verticalmente">
                    <i className="bi bi-symmetry-horizontal me-1"/>Espejo V
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={restablecer} title="Rotación 0, escala 1">
                    <i className="bi bi-arrow-counterclockwise me-1"/>Restablecer
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={duplicar} title="Duplicar (Ctrl+D)">
                    <i className="bi bi-copy me-1"/>Duplicar
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={borrar} title="Borrar (Supr)">
                    <i className="bi bi-trash me-1"/>Borrar
                </button>
            </div>

            <div className="small text-body-secondary">
                Arrastra el objeto para moverlo; las manijas de las esquinas escalan (Shift: libre),
                las de los lados escalan en un eje y el círculo de arriba rota (Shift: de a 15°).
                Flechas: mover · Supr: borrar · Ctrl+D: duplicar · Esc: deseleccionar.
                <br/>Recuerda <strong>Subir</strong> para guardar.
            </div>
            <button className="btn btn-sm btn-link p-0 text-start" onClick={() => control().seleccionar([])}>
                <i className="bi bi-arrow-left me-1"/>Volver a las propiedades del evento
            </button>
        </div>
    );
}
