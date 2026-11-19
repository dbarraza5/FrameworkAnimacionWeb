// Lista de documentos de eventos de un proyecto de un tipo (documento/planeacion_organizacion.md).
// Animacion.js la usa para la pestana Assets (las escenas van por capitulos en HistoriaEscenas.js).
// Los assets son de todo el proyecto: no van en capitulos.
import {useState} from "react";

const fecha = (f) => (f ? new Date(f).toLocaleString() : "");
// el documento que se crea solo con cada proyecto nuevo (modelo/Eventos.js del backend): se oculta salvo que se pida
const esPorDefecto = (d) => d.nombre === "evento_default" && !d.manual;

function ListaDocumentos({tipo, documentos, abrir, cambiar, ocupado}) {
    const [filtro, setFiltro] = useState("");
    const [verDefecto, setVerDefecto] = useState(false);
    const esEscenas = tipo === "escena";
    const texto = filtro.trim().toLowerCase();
    const ocultos = documentos.filter((d) => d.tipo === tipo && esPorDefecto(d)).length;
    const lista = documentos
        .filter((d) => d.tipo === tipo && (!texto || (d.nombre || "").toLowerCase().includes(texto)))
        .filter((d) => verDefecto || !esPorDefecto(d))
        // la principal arriba; despues lo ultimo que se toco
        .sort((a, b) => (b.principal - a.principal) || (new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion)));

    return (
        <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="input-group input-group-sm" style={{maxWidth: 320}}>
                    <span className="input-group-text"><i className="bi bi-search"/></span>
                    <input className="form-control" placeholder={esEscenas ? "Buscar escena..." : "Buscar asset..."}
                           value={filtro} onChange={(e) => setFiltro(e.target.value)}/>
                </div>
                <small className="text-muted">{lista.length} {esEscenas ? (lista.length === 1 ? "escena" : "escenas") : (lista.length === 1 ? "asset" : "assets")}</small>
                {!!ocultos && (
                    <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => setVerDefecto(!verDefecto)}
                            title="Documento de ejemplo que se crea con cada proyecto nuevo">
                        {verDefecto ? "ocultar evento_default" : "mostrar evento_default (de ejemplo)"}
                    </button>
                )}
            </div>
            {!lista.length && (
                <p className="text-muted">
                    {texto ? "Nada coincide con la búsqueda." : esEscenas
                        ? "Todavía no hay escenas. Un documento es escena si tiene cámara, instancias o efectos (o si lo marcas como escena desde Assets)."
                        : "Todavía no hay assets."}
                </p>
            )}
            {!!lista.length && (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                        <tr>
                            <th scope="col" style={{width: 36}}></th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Actualizado</th>
                            <th scope="col">Creado</th>
                            <th scope="col" style={{width: 1}}>Opciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lista.map((d) => (
                            <tr key={d._id} className={d.principal ? "table-warning" : ""}>
                                <td className="text-center">
                                    {esEscenas && (
                                        <button type="button" className={"btn btn-sm btn-link p-0 " + (d.principal ? "text-warning" : "text-secondary")}
                                                title={d.principal ? "Escena principal (clic para quitarla)" : "Marcar como escena principal"}
                                                disabled={ocupado} onClick={() => cambiar(d, {principal: !d.principal})}>
                                            <i className={"bi " + (d.principal ? "bi-star-fill" : "bi-star")}/>
                                        </button>
                                    )}
                                </td>
                                <td>
                                    <button type="button" className="btn btn-link p-0 text-start" onClick={() => abrir(d._id)}>
                                        {d.principal && <b>{d.nombre}</b>}{!d.principal && d.nombre}
                                    </button>
                                    {d.principal && <span className="badge bg-warning text-dark ms-2">principal</span>}
                                    {d.manual && (
                                        <span className="badge bg-light text-secondary border ms-2"
                                              title={`Lo marcaste como ${d.tipo}; automáticamente sería ${d.tipo_auto}`}>
                                            elegido a mano
                                        </span>
                                    )}
                                </td>
                                <td><small>{fecha(d.fecha_actualizacion)}</small></td>
                                <td><small className="text-muted">{fecha(d.fecha_creacion)}</small></td>
                                <td className="text-nowrap">
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button type="button" className="btn btn-outline-primary" title="Abrir en el editor" onClick={() => abrir(d._id)}>
                                            <i className="bi bi-eye"/>
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" disabled={ocupado}
                                                title={esEscenas ? "Pasar a assets" : "Pasar a escenas"}
                                                onClick={() => cambiar(d, {tipo: esEscenas ? "asset" : "escena", ...(esEscenas && d.principal ? {principal: false} : {})})}>
                                            <i className={"bi " + (esEscenas ? "bi-box-seam" : "bi-film")}/>
                                            <span className="ms-1">{esEscenas ? "A assets" : "A escenas"}</span>
                                        </button>
                                        {d.manual && (
                                            <button type="button" className="btn btn-outline-secondary" disabled={ocupado}
                                                    title={`Volver a la clasificación automática (${d.tipo_auto})`}
                                                    onClick={() => cambiar(d, {tipo: null})}>
                                                <i className="bi bi-arrow-counterclockwise"/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ListaDocumentos;
