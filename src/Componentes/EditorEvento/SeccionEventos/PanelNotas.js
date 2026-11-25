import React, {useEffect, useState} from "react";
import {objetoEn, nuevoIdNota, CERCA_MS} from "../../../Clases/EditorEvento/Notas";

// Panel "Notas" (planeacion_autoria_ia.md, fase IA-6): correcciones ancladas a un instante y a un punto
// del dibujo, para que la IA sepa exactamente donde mirar (herramientas/notas.mjs).
// notas / setNotas: las del documento (se guardan al tiro con guardar(notas), sin "Subir").
// activo: la pestana esta visible (solo entonces se dibujan las marcas en el lienzo).
export default function PanelNotas({refEvento, refLienzo, notas, guardar, activo}) {
    const [marcando, setMarcando] = useState(false);
    const [borrador, setBorrador] = useState(null);       // {t, x, y, objeto?, parte?, texto}
    const [elegida, setElegida] = useState(null);
    const [verResueltas, setVerResueltas] = useState(false);
    const [borrar, setBorrar] = useState(null);           // id a confirmar
    const [error, setError] = useState(null);
    const lienzo = refLienzo.current;

    // marcas en el lienzo y cursor de "apuntar"
    useEffect(() => {
        lienzo.notas = notas;
        lienzo.notas_visibles = activo;
        lienzo.nota_seleccionada = elegida;
    }, [lienzo, notas, activo, elegida]);
    useEffect(() => {
        const c = document.getElementById("lienzo-evento");
        if (c) c.style.cursor = marcando ? "crosshair" : "";
        return () => { if (c) c.style.cursor = ""; };
    }, [marcando]);
    // al salir de la pestana se cancela el modo de marcar
    useEffect(() => { if (!activo && marcando) { lienzo.capturarClic = null; setMarcando(false); } }, [activo, marcando, lienzo]);

    const ed = () => refEvento.current.edicion;
    const irA = (t) => { ed().pausarEventos && ed().pausarEventos(); ed().buscarTiempo(t / 1000); ed().tiempo_animacion = t / 1000; };
    const seg = (t) => `${(t / 1000).toFixed(1)} s`;

    const empezar = () => {
        setError(null);
        setBorrador(null);
        setMarcando(true);
        lienzo.capturarClic = (p) => {
            setMarcando(false);
            const o = objetoEn(ed(), p.x, p.y) || {};
            setBorrador({t: Math.round(p.t), x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, ...o, texto: ""});
        };
    };
    const cancelar = () => { lienzo.capturarClic = null; setMarcando(false); setBorrador(null); };
    const subir = async (lista) => {
        setError(null);
        try { await guardar(lista); return true; }
        catch (e) { setError(e?.response?.data?.error || e?.message || String(e)); return false; }
    };
    const crear = async () => {
        if (!borrador.texto.trim()) return;
        const n = {id: nuevoIdNota(), ...borrador, texto: borrador.texto.trim(), resuelta: false, fecha: new Date().toISOString()};
        if (await subir([...notas, n])) { setBorrador(null); setElegida(n.id); }
    };
    const cambiar = (id, cambios) => subir(notas.map((n) => (n.id === id ? {...n, ...cambios} : n)));
    const quitar = async (id) => { if (await subir(notas.filter((n) => n.id !== id))) setBorrar(null); };

    const pendientes = notas.filter((n) => !n.resuelta).length;
    const visibles = notas.map((n, i) => ({n, i})).filter(({n}) => verResueltas || !n.resuelta);
    const tAhora = ed().tiempoActualMs ? ed().tiempoActualMs() : 0;
    return (
        <div className="d-flex flex-column h-100 small">
            <div className="p-2 border-bottom d-flex flex-column gap-2">
                {!marcando && !borrador && (
                    <button className="btn btn-sm btn-warning" onClick={empezar} title="Marca en el lienzo dónde está el problema, en el instante actual">
                        <i className="bi bi-pin-angle me-1"/>Nueva nota
                    </button>
                )}
                {marcando && (
                    <div className="alert alert-warning py-1 px-2 mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-crosshair"/><span className="flex-grow-1">Haz clic en el lienzo, donde está el problema.</span>
                        <button className="btn btn-sm btn-link p-0" onClick={cancelar}>Cancelar</button>
                    </div>
                )}
                {borrador && (
                    <div className="d-flex flex-column gap-1">
                        <div className="text-body-secondary">
                            <i className="bi bi-geo-alt me-1"/>{seg(borrador.t)}
                            {borrador.objeto ? ` · ${borrador.objeto}${borrador.parte ? " › " + borrador.parte : ""}` : " · (fondo)"}
                        </div>
                        <textarea className="form-control form-control-sm" rows={3} autoFocus value={borrador.texto}
                                  placeholder="¿Qué hay que corregir aquí?" data-prueba="texto-nota"
                                  onChange={(e) => setBorrador({...borrador, texto: e.target.value})}
                                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) crear(); e.stopPropagation(); }}/>
                        <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-primary" onClick={crear} disabled={!borrador.texto.trim()}>Guardar nota</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={cancelar}>Cancelar</button>
                        </div>
                    </div>
                )}
                {error && <div className="text-danger">{error}</div>}
                <div className="d-flex align-items-center gap-2 text-body-secondary">
                    <span className="flex-grow-1">{pendientes} pendiente{pendientes === 1 ? "" : "s"} de {notas.length}</span>
                    <label className="form-check-label d-flex align-items-center gap-1">
                        <input type="checkbox" className="form-check-input m-0" checked={verResueltas} onChange={(e) => setVerResueltas(e.target.checked)}/>
                        resueltas
                    </label>
                </div>
            </div>
            <ul className="list-unstyled mb-0 flex-grow-1 overflow-auto">
                {!visibles.length && <li className="p-3 text-body-secondary">Sin notas. Pausa en el momento del problema y usa "Nueva nota".</li>}
                {visibles.map(({n, i}) => {
                    const cerca = Math.abs(n.t - tAhora) <= CERCA_MS;
                    return (
                        <li key={n.id} className={`border-bottom px-2 py-2 ${elegida === n.id ? "bg-warning-subtle" : ""} ${n.resuelta ? "opacity-50" : ""}`}
                            onClick={() => { setElegida(n.id); irA(n.t); }} style={{cursor: "pointer"}} title="Ir a ese instante">
                            <div className="d-flex align-items-center gap-1">
                                <span className={`badge ${n.resuelta ? "text-bg-secondary" : cerca ? "text-bg-danger" : "text-bg-warning"}`}>{n.resuelta ? "✓" : i + 1}</span>
                                <span className="fw-semibold">{seg(n.t)}</span>
                                <span className="text-body-secondary text-truncate flex-grow-1">{n.objeto ? `${n.objeto}${n.parte ? " › " + n.parte : ""}` : ""}</span>
                                <button className="btn btn-sm p-0 px-1" title={n.resuelta ? "Volver a abrir" : "Marcar como resuelta"}
                                        onClick={(e) => { e.stopPropagation(); cambiar(n.id, {resuelta: !n.resuelta}); }}>
                                    <i className={`bi ${n.resuelta ? "bi-arrow-counterclockwise" : "bi-check2-circle"}`}/>
                                </button>
                                {borrar === n.id ? (
                                    <button className="btn btn-sm btn-danger py-0 px-1" onClick={(e) => { e.stopPropagation(); quitar(n.id); }}>¿Borrar?</button>
                                ) : (
                                    <button className="btn btn-sm p-0 px-1 text-danger" title="Borrar la nota"
                                            onClick={(e) => { e.stopPropagation(); setBorrar(n.id); }}><i className="bi bi-trash"/></button>
                                )}
                            </div>
                            <div className="mt-1" style={{whiteSpace: "pre-wrap"}}>{n.texto}</div>
                            {n.respuesta && <div className="mt-1 text-success"><i className="bi bi-robot me-1"/>{n.respuesta}</div>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
