import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Cookies} from "react-cookie";
import BibliotecaSonidos from "./BibliotecaSonidos";
import {listarSonidos} from "./apiSonido";
import {NIVELES, seguimiento} from "../../Clases/Sonido/Seguimiento";

// Pagina del proyecto -> pestana Sonido (planeacion_sonido.md): la biblioteca de sonidos y el
// seguimiento de TODOS los documentos de eventos del proyecto (que falta subir, que esta
// marcado con sonido y no tiene, que esta sin decidir), con un enlace para abrir cada uno.
const auth = () => ({Authorization: `Bearer ${new Cookies().get("usuario")?.token}`});

export default function SonidoProyecto({id_proyecto}) {
    const [sonidos, setSonidos] = useState([]);
    const [docs, setDocs] = useState(null);       // [{_id, nombre, resultado}]
    const [error, setError] = useState("");
    const [abierto, setAbierto] = useState(null);
    const [verSinDecidir, setVerSinDecidir] = useState(false);

    const recargar = useCallback(async () => {
        setError("");
        try {
            const lista = await listarSonidos(id_proyecto);
            setSonidos(lista);
            const r = await axios({method: "get", url: `/api/eventos/proyecto-slim/${id_proyecto}`, withCredentials: true, headers: auth()});
            const completos = await Promise.all((r.data || []).map((d) => axios({method: "get", url: `/api/evento/id/${d._id}`, withCredentials: true, headers: auth()})
                .then((x) => x.data).catch(() => null)));
            setDocs(completos.filter(Boolean).map((d) => {
                const grupos = d.grupos_figuras || [];
                const esEscena = grupos.some((g) => (g.instancia && g.instancia.id_eventos) || g.efecto) || !!(d.escena && d.escena.orden_profundidad);
                return {_id: d._id, nombre: d.nombre, esEscena,
                    resultado: seguimiento({escena: d.escena || {}, eventos: d.eventos || [], grupos}, lista, {esEscena})};
            }));
        } catch (e) {
            setError(e?.response?.data?.error || e.message);
        }
    }, [id_proyecto]);

    useEffect(() => { void recargar(); }, [recargar]);

    const total = (k) => (docs || []).reduce((n, d) => n + d.resultado.resumen[k], 0);

    return (
        <div className="p-2 small" style={{maxWidth: 1000}}>
            <p className="text-body-secondary">
                Aquí están los <b>sonidos del proyecto</b> y el <b>seguimiento</b> de lo que falta. En el editor (pestaña <b>Sonido</b>)
                se colocan los sonidos y se marca qué <b>lleva</b> o <b>no lleva</b> sonido; lo marcado "no lleva" deja de aparecer como pendiente.
            </p>
            {error && <div className="alert alert-danger py-1">{error}</div>}
            <div className="row g-3">
                <div className="col-md-5">
                    <h6>Sonidos</h6>
                    <BibliotecaSonidos idProyecto={id_proyecto} sonidos={sonidos} recargar={recargar}/>
                </div>
                <div className="col-md-7" data-seguimiento-proyecto>
                    <h6 className="d-flex align-items-center gap-2">
                        Seguimiento
                        <button className="btn btn-sm btn-outline-secondary py-0" onClick={recargar} title="Volver a revisar"><i className="bi bi-arrow-clockwise"/></button>
                    </h6>
                    {!docs && <div className="text-body-secondary">Revisando…</div>}
                    {docs && (
                        <>
                            <div className="d-flex flex-wrap gap-1 mb-2">
                                {Object.keys(NIVELES).map((k) => (
                                    <span key={k} className={`badge text-bg-${total(k) ? NIVELES[k].color : "light"}`}>{NIVELES[k].etiqueta}: {total(k)}</span>
                                ))}
                                <div className="form-check form-check-inline ms-2 mb-0">
                                    <input className="form-check-input" type="checkbox" id="ver-sin-decidir" checked={verSinDecidir} onChange={(e) => setVerSinDecidir(e.target.checked)}/>
                                    <label className="form-check-label" htmlFor="ver-sin-decidir">mostrar "sin decidir"</label>
                                </div>
                            </div>
                            <table className="table table-sm align-middle">
                                <thead><tr><th>Documento</th><th>Pendiente</th><th>Sin decidir</th><th/></tr></thead>
                                <tbody>
                                    {docs.map((d) => {
                                        const avisos = d.resultado.avisos.filter((a) => verSinDecidir || a.nivel !== "sin_decidir");
                                        return (
                                            <React.Fragment key={d._id}>
                                                <tr data-doc={d.nombre}>
                                                    <td>
                                                        <button className="btn btn-link btn-sm p-0" disabled={!avisos.length} onClick={() => setAbierto(abierto === d._id ? null : d._id)}>
                                                            <i className={`bi ${abierto === d._id ? "bi-chevron-down" : "bi-chevron-right"} me-1`}/>{d.nombre}
                                                        </button>
                                                        <span className="text-body-secondary ms-1">({d.esEscena ? "escena" : "asset"})</span>
                                                    </td>
                                                    <td>{d.resultado.pendientes ? <span className="badge text-bg-danger">{d.resultado.pendientes}</span> : <span className="text-success">✓</span>}</td>
                                                    <td>{d.resultado.resumen.sin_decidir || ""}</td>
                                                    <td><a className="btn btn-sm btn-outline-primary py-0" href={`/evento/${d._id}`}>Abrir</a></td>
                                                </tr>
                                                {abierto === d._id && avisos.map((a, i) => (
                                                    <tr key={i} className="table-light">
                                                        <td colSpan={4}><span className={`badge text-bg-${NIVELES[a.nivel].color} me-2`}>{NIVELES[a.nivel].etiqueta}</span>{a.mensaje}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
