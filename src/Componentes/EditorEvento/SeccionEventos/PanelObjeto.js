import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {Cookies} from "react-cookie";
import {normalizarTransformacion} from "../../../Clases/EditorAnimacion/TransformacionInstancia";
import {INTERPOLACIONES, MODOS_BUCLE} from "../../../Clases/EditorEvento/Claves";
import {TIPOS_EFECTO, MODOS_FISICA} from "../../../Clases/EditorEvento/Fisica";

// Propiedades que se pueden animar con fotogramas clave (Fase 7).
const PROPS_CLAVE = ["x", "y", "rotacion", "escala_x", "escala_y", "opacidad", "zoom"];

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
        // Fase 7: valores en el instante actual (con claves) y estado de cada rombo
        const e = ev();
        const val = (p) => Math.round(e.valorPropiedad(unico, p) * 1000) / 1000;
        const rombos = {};
        for (const p of PROPS_CLAVE) {
            const c = e.claveEn(unico, p);
            rombos[p] = c ? {estado: "clave", interp: c.interp} : {estado: e.tieneClaves(unico, p) ? "pista" : "no"};
        }
        return {x: val("x"), y: val("y"), rotacion: val("rotacion"), escala_x: val("escala_x"), escala_y: val("escala_y"),
            opacidad: val("opacidad"), rombos, t_ms: e.tiempoActualMs(),
            // Fase 8A: camara
            es_camara: e.esCamara(unico), zoom: val("zoom"),
            // Fase 9A: efecto y reaccion fisica
            es_efecto: e.esEfecto(unico), efecto: g.efecto ? {...g.efecto} : null, fisica: e.fisicaDe(unico),
            plano: e.planoObjeto(unico),
            cam_ancho: g.camara ? g.camara.ancho : null, cam_alto: g.camara ? g.camara.alto : null,
            vista_camara: !!refLienzo.current.configuracion_lienzo.vista_camara,
            bucle_claves: e.bucleClaves(unico), tramo: e.tramoClaves(unico),
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

    // formatos de la camara: [clave, ancho, alto, texto] (la escala del dibujo es la de 16:9: 720 de alto)
    const FORMATOS_CAMARA = [["16:9", 1280, 720, "Horizontal 16:9"], ["9:16", 720, 1280, "Vertical 9:16 (TikTok, Reels)"],
        ["1:1", 900, 900, "Cuadrado 1:1"], ["4:5", 864, 1080, "Vertical 4:5"]];

    const aplicar = (campo, texto) => {
        const v = parseFloat(texto);
        if (!Number.isFinite(v) || !unico) return;
        if (campo === "x" || campo === "y") {
            const p = ev().posicionObjeto(unico);
            ev().fijarPosicionObjeto(unico, campo === "x" ? v : p.x, campo === "y" ? v : p.y);
        } else if (campo === "zoom" || campo === "cam_ancho" || campo === "cam_alto") {
            ev().fijarCamara(unico, campo.replace("cam_", ""), v);
        } else if (campo === "plano") {
            ev().fijarPlano(unico, v);
        } else if (campo === "opacidad") {
            ev().fijarOpacidad(unico, v);
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
            ev().asegurarTransformacion(n);
            const p = eje === "x" ? "escala_x" : "escala_y";
            ev().cambiarTransformacion(n, {[p]: -ev().valorPropiedad(n, p)});
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

    // Rombo de fotograma clave (Fase 7) junto a la etiqueta de una propiedad animable.
    const rombo = (nombre) => {
        const r = valores && valores.rombos && valores.rombos[nombre];
        if (!r) return null;
        const titulo = r.estado === "clave" ? "Quitar la clave de este instante"
            : r.estado === "pista" ? "Agregar una clave en este instante (la propiedad ya está animada)"
                : "Animar: crea la primera clave en este instante. Desde ahí, cada cambio crea o ajusta una clave.";
        return (
            <button type="button" className={`ed-rombo ${r.estado}`} title={titulo}
                    onClick={() => ev().alternarClave(unico, nombre)}>
                <i className={`bi ${r.estado === "clave" ? "bi-diamond-fill" : "bi-diamond"}`}/>
            </button>
        );
    };

    const campo = (nombre, etiqueta, paso = 1, sufijo = "") => (
        <div className="col-6">
            <label className="form-label small mb-0 text-body-secondary d-flex align-items-center gap-1">
                {PROPS_CLAVE.includes(nombre) && rombo(nombre)}{etiqueta}
            </label>
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
                    {valores.es_camara ? (
                        // Fase 8A: la camara -- centro de lo que ve, zoom y tamano del cuadro
                        <>
                            <div className="row g-2">
                                {campo("x", "Centro X")}
                                {campo("y", "Centro Y")}
                                {campo("zoom", "Zoom", 0.1, "×")}
                                <div className="col-6 d-flex align-items-end">
                                    <div className="form-check form-switch small mb-1">
                                        <input className="form-check-input" type="checkbox" id="vista-camara"
                                               checked={valores.vista_camara}
                                               onChange={(e) => { refLienzo.current.configuracion_lienzo.vista_camara = e.target.checked; }}/>
                                        <label className="form-check-label" htmlFor="vista-camara">Vista de cámara</label>
                                    </div>
                                </div>
                                {campo("cam_ancho", "Ancho del cuadro", 10, "px")}
                                {campo("cam_alto", "Alto del cuadro", 10, "px")}
                                <div className="col-12">
                                    <label className="form-label small mb-0">Formato</label>
                                    <select className="form-select form-select-sm" title="Proporción del cuadro de la cámara (el video sale con esta forma)"
                                            value={(FORMATOS_CAMARA.find(([, w, h]) => w === valores.cam_ancho && h === valores.cam_alto) || ["otro"])[0]}
                                            onChange={(e) => {
                                                const fmt = FORMATOS_CAMARA.find(([n]) => n === e.target.value);
                                                if (!fmt || !unico) return;
                                                ev().fijarCamara(unico, "ancho", fmt[1]);
                                                ev().fijarCamara(unico, "alto", fmt[2]);
                                            }}>
                                        {FORMATOS_CAMARA.map(([n, w, h, t]) => <option key={n} value={n}>{t} ({w}×{h})</option>)}
                                        <option value="otro" disabled>Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="small text-body-secondary mt-1">
                                Ve {Math.round(valores.cam_ancho / (valores.zoom || 1))} × {Math.round(valores.cam_alto / (valores.zoom || 1))} del dibujo.
                                Arrástrala por su borde; anima su centro y su zoom con los rombos para recorrer la escena.
                            </div>
                        </>
                    ) : (
                    <div className="row g-2">
                        {campo("x", "Posición X")}
                        {campo("y", "Posición Y")}
                        {campo("rotacion", "Rotación", 1, "°")}
                        {campo("capa", "Capa")}
                        {campo("escala_x", "Escala X", 0.05)}
                        {campo("escala_y", "Escala Y", 0.05)}
                        {campo("ancla_x", "Ancla X")}
                        {campo("ancla_y", "Ancla Y")}
                        {campo("opacidad", "Opacidad", 0.1)}
                        {campo("plano", "Plano (profundidad)")}
                    </div>
                    )}
                    {/* Fase 7: interpolacion de las claves que hay en este instante */}
                    {valores.rombos && PROPS_CLAVE.some((p) => valores.rombos[p].estado === "clave") && (
                        <div className="d-flex align-items-center gap-2 mt-2 small">
                            <i className="bi bi-diamond-fill ed-rombo-color"/>
                            <span className="text-body-secondary text-nowrap">Clave en {(valores.t_ms / 1000).toFixed(2)} s · hacia la siguiente:</span>
                            <select className="form-select form-select-sm"
                                    value={PROPS_CLAVE.map((p) => valores.rombos[p]).find((r) => r.estado === "clave").interp || "suave"}
                                    onChange={(e) => PROPS_CLAVE.filter((p) => valores.rombos[p].estado === "clave")
                                        .forEach((p) => ev().cambiarInterpolacion(unico, p, valores.t_ms, e.target.value))}>
                                {Object.entries(INTERPOLACIONES).map(([k, v]) => <option key={k} value={k}>{v.etiqueta}</option>)}
                            </select>
                        </div>
                    )}
                    {/* Fase 7B: que hace despues de la ultima clave */}
                    {valores.tramo && (
                        <div className="d-flex align-items-center gap-2 mt-2 small">
                            <i className="bi bi-repeat ed-rombo-color"/>
                            <span className="text-body-secondary text-nowrap"
                                  title={`Tramo con claves: ${(valores.tramo.t0 / 1000).toFixed(2)} s – ${(valores.tramo.t1 / 1000).toFixed(2)} s`}>
                                Después de la última clave:
                            </span>
                            <select className="form-select form-select-sm" value={valores.bucle_claves}
                                    onChange={(e) => ev().fijarBucleClaves(unico, e.target.value)}>
                                {Object.entries(MODOS_BUCLE).map(([k, v]) => <option key={k} value={k}>{v.etiqueta}</option>)}
                            </select>
                        </div>
                    )}
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

            {/* Fase 9A: parametros de un efecto */}
            {unico && valores && valores.es_efecto && valores.efecto && (
                <div className="ed-objeto-campos">
                    <div className="small fw-semibold mb-1">
                        <i className={`bi ${(TIPOS_EFECTO[valores.efecto.tipo] || {}).icono || "bi-stars"} me-1 text-warning`}/>
                        {(TIPOS_EFECTO[valores.efecto.tipo] || {}).etiqueta || valores.efecto.tipo}
                    </div>
                    <div className="row g-2">
                        {((TIPOS_EFECTO[valores.efecto.tipo] || {}).params || []).map(([k, etiqueta, paso]) => (
                            <div className="col-6" key={k}>
                                <label className="form-label small mb-0 text-body-secondary">{etiqueta}</label>
                                {typeof paso === "string" && paso.startsWith("lista:") ? (
                                    <select className="form-select form-select-sm" value={valores.efecto[k] ?? ""}
                                            onChange={(e) => ev().fijarEfecto(unico, k, e.target.value)}>
                                        {paso.slice(6).split(",").map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : paso === "texto" ? (
                                    <input type="color" className="form-control form-control-sm form-control-color w-100"
                                           value={valores.efecto[k] || "#000000"}
                                           onChange={(e) => ev().fijarEfecto(unico, k, e.target.value)}/>
                                ) : (
                                    <input type="number" step={paso} className="form-control form-control-sm"
                                           defaultValue={valores.efecto[k]} key={`${unico}-${k}`}
                                           onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) ev().fijarEfecto(unico, k, v); }}/>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="small text-body-secondary mt-1">
                        Muévelo con el mouse o anima su posición con claves (por ejemplo, un tornado que avanza).
                        Solo afecta a los objetos que no son "Fijos".
                    </div>
                </div>
            )}

            {/* Fase 9A: como reacciona el objeto a los efectos */}
            {unico && valores && !valores.es_efecto && !valores.es_camara && (
                <div className="ed-objeto-campos">
                    <div className="row g-2">
                        <div className="col-8">
                            <label className="form-label small mb-0 text-body-secondary">Física (ante efectos)</label>
                            <select className="form-select form-select-sm" value={valores.fisica.modo || "fijo"}
                                    onChange={(e) => ev().fijarFisica(unico, {modo: e.target.value})}>
                                {Object.entries(MODOS_FISICA).map(([k, v]) => <option key={k} value={k}>{v.etiqueta}</option>)}
                            </select>
                        </div>
                        {valores.fisica.modo === "desarmar" && (
                            <div className="col-4">
                                <label className="form-label small mb-0 text-body-secondary">Nivel</label>
                                <select className="form-select form-select-sm" value={valores.fisica.nivel || 1}
                                        title="1: sus partes. 2: también las partes de sus partes."
                                        onChange={(e) => ev().fijarFisica(unico, {nivel: parseInt(e.target.value, 10)})}>
                                    <option value={1}>1</option><option value={2}>2</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!(valores && valores.es_camara) && <div className="d-flex flex-wrap gap-1">
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
            </div>}

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
