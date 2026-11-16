import React, {useMemo, useState} from "react";
import axios from "axios";
import {Cookies} from "react-cookie";
import {GENERADORES} from "../../../Clases/Autoria/Generadores";
import {compilarAsset} from "../../../Clases/Autoria/Compilador";
import {MiniaturaAnimada} from "./OffcanvasAnimaciones";

// Biblioteca -> Generar... (Fase A5 de documento/planeacion_autoria_asistida.md).
// Crea un asset (dibujo + eventos) a partir de un generador con sus parametros: los
// mismos generadores que usa el asistente (src/Clases/Autoria/Generadores.js).
// El tipo de cada parametro sale de su valor por defecto: color (#...), numero o si/no.
const etiqueta = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function ModalGenerarAsset({idProyecto, nombreProyecto, onCerrar, onCreado}) {
    const nombres = Object.keys(GENERADORES);
    const [generador, setGenerador] = useState(nombres[0]);
    const [parametros, setParametros] = useState({...GENERADORES[nombres[0]].parametros});
    const [nombre, setNombre] = useState(etiqueta(nombres[0]));
    const [nombreTocado, setNombreTocado] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const elegir = (g) => {
        setGenerador(g);
        setParametros({...GENERADORES[g].parametros});
        if (!nombreTocado) setNombre(etiqueta(g));
        setMensaje("");
    };

    // compilado en vivo (la vista previa y lo que se guarda son lo mismo)
    const r = useMemo(() => compilarAsset({tipo: "asset", nombre: nombre.trim() || "x", generador, parametros}),
        [generador, parametros, nombre]);
    const vista = r.ok ? {_id: "vista", grupos_figuras: r.resultado.grupos_figuras, eventos: r.resultado.eventos} : null;

    const crear = async () => {
        if (!nombre.trim()) { setMensaje("Ponle un nombre."); return; }
        if (!r.ok) { setMensaje(r.errores.join("; ")); return; }
        setGuardando(true);
        setMensaje("");
        try {
            const usuario = new Cookies().get("usuario");
            const res = await axios({method: "post", url: `/api/proyecto/${idProyecto}/assets`, data: r.resultado,
                withCredentials: true, headers: {"Content-Type": "application/json", Authorization: `Bearer ${usuario?.token}`}});
            onCreado && onCreado(res.data);
            onCerrar();
        } catch (e) {
            const d = e?.response?.data;
            setMensaje((d && (d.errores ? d.errores.join("; ") : d.error)) || e.message);
        } finally {
            setGuardando(false);
        }
    };

    const campo = (k, defecto) => {
        const v = parametros[k];
        const cambiar = (x) => setParametros((p) => ({...p, [k]: x}));
        const opciones = (GENERADORES[generador].opciones || {})[k];
        if (opciones) {
            return <><label className="form-label mb-0">{etiqueta(k)}</label>
                <select className="form-select form-select-sm" value={v} onChange={(e) => cambiar(e.target.value)}>
                    {opciones.map((o) => <option key={o} value={o}>{etiqueta(o)}</option>)}
                </select></>;
        }
        if (typeof defecto === "boolean") {
            return <div className="form-check mt-1">
                <input className="form-check-input" type="checkbox" id={`gen-${k}`} checked={!!v} onChange={(e) => cambiar(e.target.checked)}/>
                <label className="form-check-label" htmlFor={`gen-${k}`}>{etiqueta(k)}</label>
            </div>;
        }
        if (typeof defecto === "string" && defecto.startsWith("#")) {
            return <><label className="form-label mb-0">{etiqueta(k)}</label>
                <input type="color" className="form-control form-control-sm form-control-color w-100" value={v} onChange={(e) => cambiar(e.target.value)}/></>;
        }
        if (typeof defecto === "number") {
            return <><label className="form-label mb-0">{etiqueta(k)}</label>
                <input type="number" className="form-control form-control-sm" value={v} step={defecto >= 100 ? 10 : 0.1}
                       onChange={(e) => cambiar(e.target.value === "" ? defecto : Number(e.target.value))}/></>;
        }
        return <><label className="form-label mb-0">{etiqueta(k)}</label>
            <input className="form-control form-control-sm" value={v} onChange={(e) => cambiar(e.target.value)}/></>;
    };

    return (
        <div className="ed-modal-fondo" onClick={(e) => { if (e.target === e.currentTarget && !guardando) onCerrar(); }}>
            <div className="ed-modal" style={{width: 520}}>
                <div className="d-flex align-items-center mb-2">
                    <h6 className="m-0 flex-grow-1"><i className="bi bi-magic me-2"/>Generar asset</h6>
                    <button className="btn-close btn-close-white" disabled={guardando} onClick={onCerrar}/>
                </div>
                <p className="small text-body-secondary mb-2">
                    Se crea en <b>{nombreProyecto}</b> como asset animado (dibujo + eventos), listo para arrastrarlo a la escena.
                </p>
                <div className="small" style={{display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8}}>
                    <div style={{gridColumn: "span 3"}}>
                        <label className="form-label mb-0">Tipo</label>
                        <select className="form-select form-select-sm" value={generador} disabled={guardando} onChange={(e) => elegir(e.target.value)}>
                            {nombres.map((g) => <option key={g} value={g}>{etiqueta(g)}</option>)}
                        </select>
                        <div className="text-body-secondary mt-1">{GENERADORES[generador].descripcion}</div>
                    </div>
                    <div style={{gridColumn: "span 3"}}>
                        <label className="form-label mb-0">Nombre</label>
                        <input className="form-control form-control-sm" value={nombre} disabled={guardando}
                               onChange={(e) => { setNombre(e.target.value); setNombreTocado(true); }}/>
                    </div>
                    <div style={{gridColumn: "span 6"}}>
                        {/* la clave fuerza un motor nuevo cuando cambian los parametros */}
                        {vista
                            ? <MiniaturaAnimada key={JSON.stringify([generador, parametros])} doc={vista} animar/>
                            : <div className="alert alert-danger py-1 mb-0">{r.errores.join("; ")}</div>}
                    </div>
                    {Object.entries(GENERADORES[generador].parametros).map(([k, defecto]) => (
                        <div style={{gridColumn: "span 2"}} key={generador + k}>{campo(k, defecto)}</div>
                    ))}
                </div>
                {mensaje && <div className="small text-danger mt-2">{mensaje}</div>}
                <div className="d-flex justify-content-between gap-2 mt-3">
                    <button className="btn btn-sm btn-outline-secondary" disabled={guardando}
                            onClick={() => setParametros({...GENERADORES[generador].parametros})}>Valores por defecto</button>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
                        <button className="btn btn-sm btn-primary" disabled={guardando || !r.ok} onClick={crear}>
                            <i className="bi bi-plus-lg me-1"/>{guardando ? "Creando…" : "Crear asset"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
