import React, {useEffect, useRef, useState} from "react";
import {borrarSonido, cargarArchivo, crearPendiente, duracionTexto, reemplazarArchivo, subirSonido, usosSonido} from "./apiSonido";

// Sonidos de un proyecto (planeacion_sonido.md): subir, crear pendientes (con nombre y sin
// archivo, para subirlo despues), escuchar, subir/reemplazar el archivo y borrar.
// La usan la pestana Sonido del editor y la pagina del proyecto.

export function FormaOnda({picos, ancho = 90, alto = 22, color = "#6ea8fe"}) {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const x = c.getContext("2d");
        x.clearRect(0, 0, ancho, alto);
        x.fillStyle = color;
        const n = (picos || []).length;
        for (let i = 0; i < n; i++) {
            const h = Math.max(1, picos[i] * (alto - 2));
            x.fillRect(i * ancho / n, (alto - h) / 2, Math.max(1, ancho / n - 0.5), h);
        }
    }, [picos, ancho, alto, color]);
    return <canvas ref={ref} width={ancho} height={alto} style={{width: ancho, height: alto}}/>;
}

let audioActual = null;
export async function escuchar(s) {
    if (audioActual) { audioActual.pause(); audioActual = null; }
    const ab = await cargarArchivo(s._id, s.revision);
    const url = URL.createObjectURL(new Blob([ab], {type: (s.archivo && s.archivo.tipo) || "audio/mpeg"}));
    audioActual = new Audio(url);
    audioActual.onended = () => URL.revokeObjectURL(url);
    await audioActual.play();
}

export default function BibliotecaSonidos({idProyecto, sonidos, recargar, destacar, onSubido}) {
    const [nombre, setNombre] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const refNuevo = useRef(null);
    const refReemplazo = useRef(null);
    const reemplazarId = useRef(null);
    const [filtro, setFiltro] = useState("");

    const correr = async (f, ok) => {
        setOcupado(true);
        setMensaje("");
        try { const r = await f(); if (ok) setMensaje(ok); await recargar(); if (onSubido) onSubido(r); }
        catch (e) { setMensaje("Error: " + e.message); }
        finally { setOcupado(false); }
    };

    const subirNuevos = (archivos) => correr(async () => {
        for (const a of archivos) await subirSonido(idProyecto, a);
    }, `${archivos.length} sonido(s) subido(s).`);

    const pendiente = () => {
        if (!nombre.trim()) return;
        correr(() => crearPendiente(idProyecto, nombre.trim()), `"${nombre.trim()}" quedó pendiente de subir.`).then(() => setNombre(""));
    };

    const borrar = (s) => correr(async () => {
        const {usos} = await usosSonido(s._id);
        const aviso = usos.length ? `"${s.nombre}" se usa en: ${usos.join(", ")}.\nSi lo borras, esos lugares quedarán con un sonido borrado.` : `¿Borrar "${s.nombre}"?`;
        if (!window.confirm(aviso)) throw new Error("cancelado");
        await borrarSonido(s._id, usos.length > 0);
    }, `"${s.nombre}" borrado.`);

    const lista = (sonidos || []).filter((s) => s.nombre.toLowerCase().includes(filtro.trim().toLowerCase()));
    const pendientes = (sonidos || []).filter((s) => s.estado !== "listo").length;

    return (
        <div className="d-flex flex-column gap-2 small">
            <div className="d-flex gap-2 align-items-center">
                <button className="btn btn-sm btn-primary text-nowrap" disabled={ocupado} onClick={() => refNuevo.current.click()}>
                    <i className="bi bi-upload me-1"/>Subir sonidos…
                </button>
                <input ref={refNuevo} type="file" accept="audio/*" multiple hidden
                       onChange={(e) => { const f = [...e.target.files]; e.target.value = ""; if (f.length) subirNuevos(f); }}/>
                <input type="search" className="form-control form-control-sm" placeholder="Buscar…" value={filtro} onChange={(e) => setFiltro(e.target.value)}/>
            </div>
            <div className="input-group input-group-sm">
                <input className="form-control" placeholder="Nombre de un sonido que falta (ej. Ladrido)" value={nombre}
                       onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") pendiente(); }}/>
                <button className="btn btn-outline-secondary" disabled={ocupado || !nombre.trim()} onClick={pendiente}
                        title="Crea el sonido sin archivo: ya se puede usar en la escena y el seguimiento recuerda subirlo">
                    <i className="bi bi-hourglass-split me-1"/>Pendiente
                </button>
            </div>
            {mensaje && <div className={mensaje.startsWith("Error") ? "text-danger" : "text-success"}>{mensaje}</div>}
            {!lista.length && <div className="text-body-secondary">Todavía no hay sonidos en este proyecto.</div>}
            {pendientes > 0 && <div className="text-warning"><i className="bi bi-exclamation-triangle me-1"/>{pendientes} sonido(s) pendiente(s) de subir.</div>}
            <input ref={refReemplazo} type="file" accept="audio/*" hidden onChange={(e) => {
                const f = e.target.files[0]; e.target.value = "";
                if (f && reemplazarId.current) correr(() => reemplazarArchivo(reemplazarId.current, f), "Archivo subido.");
            }}/>
            <div className="d-flex flex-column gap-1">
                {lista.map((s) => {
                    const listo = s.estado === "listo";
                    return (
                        <div key={s._id} className={`d-flex align-items-center gap-2 border rounded px-2 py-1 ${destacar === s._id ? "border-warning" : ""}`}
                             data-sonido={s._id}>
                            {listo ? <FormaOnda picos={s.picos}/> : <span className="badge text-bg-warning" style={{width: 90}}>Pendiente</span>}
                            <div className="flex-grow-1 text-truncate" title={s.nota || s.nombre}>
                                {s.nombre}
                                <div className="text-body-secondary" style={{fontSize: "0.75em"}}>
                                    {listo ? duracionTexto(s.duracion_ms) : "sin archivo"}{s.nota ? ` · ${s.nota}` : ""}
                                </div>
                            </div>
                            {listo && <button className="btn btn-sm btn-outline-secondary py-0" title="Escuchar" onClick={() => escuchar(s).catch((e) => setMensaje("Error: " + e.message))}>
                                <i className="bi bi-play-fill"/></button>}
                            <button className={`btn btn-sm py-0 ${listo ? "btn-outline-secondary" : "btn-warning"}`} disabled={ocupado}
                                    title={listo ? "Reemplazar el archivo" : "Subir el archivo"}
                                    onClick={() => { reemplazarId.current = s._id; refReemplazo.current.click(); }}>
                                <i className={`bi ${listo ? "bi-arrow-repeat" : "bi-upload"}`}/>{listo ? "" : " Subir"}
                            </button>
                            <button className="btn btn-sm btn-outline-danger py-0" disabled={ocupado} title="Borrar" onClick={() => borrar(s)}>
                                <i className="bi bi-trash"/></button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
