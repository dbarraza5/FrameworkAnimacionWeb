// Pestana "Escenas" de la pagina del proyecto: la historia por capitulos
// (documento/planeacion_organizacion.md, fase 2).
//   - Los capitulos viven en el proyecto (en orden) y solo agrupan escenas; los assets no van en capitulos.
//   - Cada escena tiene su capitulo (o ninguno) y su orden dentro de el.
// Animacion.js pasa los datos de GET /api/proyecto/:id/documentos y una funcion `peticion` para la API.
import {useState} from "react";
import ModalCapitulo from "./ModalCapitulo";

const fecha = (f) => (f ? new Date(f).toLocaleString() : "");
const SIN = "__sin__"; // clave de la seccion "Sin capitulo"

// orden manual primero (las que no tienen orden van al final, la mas reciente primero)
const ordenar = (lista) => lista.slice().sort((a, b) => {
    const oa = a.orden == null ? Infinity : a.orden, ob = b.orden == null ? Infinity : b.orden;
    if (oa !== ob) return oa - ob;
    return new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion);
});

function HistoriaEscenas({id_proyecto, capitulos, setCapitulos, documentos, actualizarFilas, agregarFila, abrir, cambiar, peticion}) {
    const [filtro, setFiltro] = useState("");
    const [cerrados, setCerrados] = useState({});
    const [ocupado, setOcupado] = useState(false);
    const [verCapitulo, setVerCapitulo] = useState(null);   // {titulo, escenas}: ver de corrido / exportar MP4 (fase 5)
    const texto = filtro.trim().toLowerCase();
    const escenas = documentos.filter((d) => d.tipo === "escena");
    const ids_cap = new Set(capitulos.map((c) => c._id));
    const capituloDe = (d) => (d.capitulo && ids_cap.has(d.capitulo) ? d.capitulo : SIN);
    const deCapitulo = (clave) => ordenar(escenas.filter((d) => capituloDe(d) === clave));
    const principal = escenas.find((d) => d.principal);
    const base = "/api/proyecto/" + id_proyecto;

    // corre una llamada a la API con el boton bloqueado y muestra el error si falla
    const hacer = async (fn) => {
        setOcupado(true);
        try { await fn(); } catch (e) {
            console.log("error historia", e);
            alert((e.response && e.response.data && e.response.data.error) || "No se pudo guardar el cambio");
        } finally { setOcupado(false); }
    };

    const nuevoCapitulo = () => {
        const nombre = window.prompt("Nombre del capítulo nuevo", "Capítulo " + (capitulos.length + 1));
        if (!nombre || !nombre.trim()) return;
        hacer(async () => setCapitulos((await peticion("post", base + "/capitulos", {nombre})).capitulos));
    };
    const renombrar = (c) => {
        const nombre = window.prompt("Nuevo nombre del capítulo", c.nombre);
        if (!nombre || !nombre.trim() || nombre.trim() === c.nombre) return;
        hacer(async () => setCapitulos((await peticion("patch", base + "/capitulos/" + c._id, {nombre})).capitulos));
    };
    const moverCapitulo = (c, mover) => hacer(async () =>
        setCapitulos((await peticion("patch", base + "/capitulos/" + c._id, {mover})).capitulos));
    const borrarCapitulo = (c) => {
        const n = deCapitulo(c._id).length;
        if (!window.confirm(`¿Borrar el capítulo "${c.nombre}"?` + (n ? `\nSus ${n} escena(s) NO se borran: pasan a "Sin capítulo".` : ""))) return;
        hacer(async () => {
            setCapitulos((await peticion("delete", base + "/capitulos/" + c._id)).capitulos);
            actualizarFilas(deCapitulo(c._id).map((d) => ({...d, capitulo: null, orden: null})));
        });
    };
    const nuevaEscena = (clave) => {
        const nombre = window.prompt("Nombre de la escena nueva");
        if (!nombre || !nombre.trim()) return;
        hacer(async () => {
            const fila = await peticion("post", base + "/escenas", {nombre, capitulo: clave === SIN ? null : clave});
            agregarFila(fila);
            if (window.confirm(`Escena "${fila.nombre}" creada. ¿Abrirla en el editor?`)) abrir(fila._id);
        });
    };
    // guarda el orden de un capitulo (y mete ahi las escenas de la lista)
    const guardarOrden = (clave, ids) => hacer(async () =>
        actualizarFilas((await peticion("put", base + "/escenas/orden", {capitulo: clave === SIN ? null : clave, ids})).documentos));
    const moverEscena = (clave, i, paso) => {
        const ids = deCapitulo(clave).map((d) => d._id), j = i + paso;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        guardarOrden(clave, ids);
    };
    const pasarA = (d, destino) => guardarOrden(destino, deCapitulo(destino).map((x) => x._id).filter((id) => id !== d._id).concat([d._id]));

    const secciones = capitulos.map((c) => ({clave: c._id, cap: c, nombre: c.nombre}));
    const sueltas = deCapitulo(SIN);
    // "Sin capitulo" siempre que tenga escenas, o si todavia no hay capitulos
    if (sueltas.length || !capitulos.length) secciones.push({clave: SIN, cap: null, nombre: "Sin capítulo"});
    const opcionesMover = [...capitulos.map((c) => ({clave: c._id, nombre: c.nombre})), {clave: SIN, nombre: "Sin capítulo"}];

    const filaEscena = (d, i, total, clave) => (
        <tr key={d._id} className={d.principal ? "table-warning" : ""}>
            <td className="text-center" style={{width: 36}}>
                <button type="button" className={"btn btn-sm btn-link p-0 " + (d.principal ? "text-warning" : "text-secondary")}
                        title={d.principal ? "Escena principal (clic para quitarla)" : "Marcar como escena principal"}
                        disabled={ocupado} onClick={() => cambiar(d, {principal: !d.principal})}>
                    <i className={"bi " + (d.principal ? "bi-star-fill" : "bi-star")}/>
                </button>
            </td>
            <td className="text-muted" style={{width: 36}}><small>{i + 1}</small></td>
            <td style={{width: "45%"}}>
                <button type="button" className="btn btn-link p-0 text-start" onClick={() => abrir(d._id)}>
                    {d.principal ? <b>{d.nombre}</b> : d.nombre}
                </button>
                {d.principal && <span className="badge bg-warning text-dark ms-2">principal</span>}
                {d.manual && <span className="badge bg-light text-secondary border ms-2"
                                   title={`Lo marcaste como escena; automáticamente sería ${d.tipo_auto}`}>elegido a mano</span>}
            </td>
            <td style={{width: 180}}><small>{fecha(d.fecha_actualizacion)}</small></td>
            <td className="text-nowrap" style={{width: 1}}>
                <div className="d-flex gap-1 align-items-center">
                    <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-secondary" title="Subir" disabled={ocupado || !!texto || i === 0}
                                onClick={() => moverEscena(clave, i, -1)}><i className="bi bi-arrow-up"/></button>
                        <button type="button" className="btn btn-outline-secondary" title="Bajar" disabled={ocupado || !!texto || i === total - 1}
                                onClick={() => moverEscena(clave, i, 1)}><i className="bi bi-arrow-down"/></button>
                    </div>
                    <select className="form-select form-select-sm" style={{width: 150}} value="" disabled={ocupado}
                            title="Mover a otro capítulo" onChange={(e) => e.target.value && pasarA(d, e.target.value)}>
                        <option value="">Mover a…</option>
                        {opcionesMover.filter((o) => o.clave !== clave).map((o) => <option key={o.clave} value={o.clave}>{o.nombre}</option>)}
                    </select>
                    <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-primary" title="Abrir en el editor" onClick={() => abrir(d._id)}>
                            <i className="bi bi-eye"/>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" disabled={ocupado} title="Pasar a assets"
                                onClick={() => cambiar(d, {tipo: "asset", ...(d.principal ? {principal: false} : {})})}>
                            <i className="bi bi-box-seam"/>
                        </button>
                        {d.manual && (
                            <button type="button" className="btn btn-outline-secondary" disabled={ocupado}
                                    title={`Volver a la clasificación automática (${d.tipo_auto})`} onClick={() => cambiar(d, {tipo: null})}>
                                <i className="bi bi-arrow-counterclockwise"/>
                            </button>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );

    return (
        <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <button type="button" className="btn btn-primary btn-sm" disabled={ocupado} onClick={nuevoCapitulo}>
                    <i className="bi bi-journal-plus me-1"/>Nuevo capítulo
                </button>
                <button type="button" className="btn btn-outline-primary btn-sm" disabled={ocupado} onClick={() => nuevaEscena(SIN)}
                        title="Escena sin capítulo (después la puedes mover)">
                    <i className="bi bi-plus-circle me-1"/>Nueva escena
                </button>
                <div className="input-group input-group-sm" style={{maxWidth: 280}}>
                    <span className="input-group-text"><i className="bi bi-search"/></span>
                    <input className="form-control" placeholder="Buscar escena..." value={filtro} onChange={(e) => setFiltro(e.target.value)}/>
                </div>
                <small className="text-muted">{capitulos.length} capítulo(s), {escenas.length} escena(s)</small>
            </div>

            {principal && !texto && (
                <div className="alert alert-warning py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-star-fill"/> Escena principal: <b>{principal.nombre}</b>
                    <button type="button" className="btn btn-sm btn-outline-dark ms-2" onClick={() => abrir(principal._id)}>Abrir</button>
                </div>
            )}

            {verCapitulo && (
                <ModalCapitulo titulo={verCapitulo.titulo} escenas={verCapitulo.escenas} id_proyecto={id_proyecto}
                               peticion={peticion} onCerrar={() => setVerCapitulo(null)}/>
            )}

            {secciones.map((s) => {
                const todas = deCapitulo(s.clave);
                const lista = texto ? todas.filter((d) => (d.nombre || "").toLowerCase().includes(texto)) : todas;
                if (texto && !lista.length) return null;
                const abierto = !cerrados[s.clave] || !!texto;
                const pos = capitulos.findIndex((c) => c._id === s.clave);
                return (
                    <div key={s.clave} className="card mb-3">
                        <div className="card-header d-flex align-items-center gap-2">
                            <button type="button" className="btn btn-sm btn-link p-0 text-reset text-decoration-none"
                                    onClick={() => setCerrados({...cerrados, [s.clave]: abierto})}>
                                <i className={"bi me-1 " + (abierto ? "bi-chevron-down" : "bi-chevron-right")}/>
                                <i className={"bi me-1 " + (s.cap ? "bi-journal-bookmark" : "bi-collection")}/>
                                {s.cap ? <b>{s.nombre}</b> : <span className="text-muted">{s.nombre}</span>}
                            </button>
                            <span className="badge bg-secondary">{todas.length}</span>
                            <div className="ms-auto d-flex gap-1">
                                {!!todas.length && (
                                    <button type="button" className="btn btn-sm btn-success" disabled={ocupado}
                                            title="Ver todas las escenas de corrido, con sonido, y exportarlas como un solo MP4"
                                            onClick={() => setVerCapitulo({titulo: s.nombre, escenas: todas})}>
                                        <i className="bi bi-collection-play me-1"/>Ver y exportar
                                    </button>
                                )}
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={ocupado} onClick={() => nuevaEscena(s.clave)}>
                                    <i className="bi bi-plus-circle me-1"/>Nueva escena
                                </button>
                                {s.cap && (
                                    <div className="btn-group btn-group-sm">
                                        <button type="button" className="btn btn-outline-secondary" title="Renombrar" disabled={ocupado} onClick={() => renombrar(s.cap)}>
                                            <i className="bi bi-pencil"/></button>
                                        <button type="button" className="btn btn-outline-secondary" title="Subir capítulo" disabled={ocupado || pos === 0}
                                                onClick={() => moverCapitulo(s.cap, -1)}><i className="bi bi-arrow-up"/></button>
                                        <button type="button" className="btn btn-outline-secondary" title="Bajar capítulo" disabled={ocupado || pos === capitulos.length - 1}
                                                onClick={() => moverCapitulo(s.cap, 1)}><i className="bi bi-arrow-down"/></button>
                                        <button type="button" className="btn btn-outline-danger" title="Borrar capítulo (sus escenas no se borran)" disabled={ocupado}
                                                onClick={() => borrarCapitulo(s.cap)}><i className="bi bi-trash"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {abierto && (
                            lista.length ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <tbody>{lista.map((d, i) => filaEscena(d, i, lista.length, s.clave))}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="card-body py-2 text-muted"><small>
                                    {s.cap ? "Capítulo vacío: crea una escena aquí o mueve una con \"Mover a…\"."
                                        : "Todavía no hay escenas. Usa \"Nueva escena\", o marca un asset como escena desde Assets."}
                                </small></div>
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default HistoriaEscenas;
