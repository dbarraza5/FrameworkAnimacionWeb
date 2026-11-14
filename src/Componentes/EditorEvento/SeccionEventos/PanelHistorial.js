import React from "react";

// Panel "Historial": la lista de cambios hechos en esta sesion (como en Photoshop).
// Clic en una entrada = volver a ese punto (lo de mas abajo queda atenuado y se puede
// rehacer). `historial` es la instancia de Clases/EditorEvento/Historial; `version`
// cambia cada vez que el historial cambia (para volver a dibujar).
export default function PanelHistorial({historial, version, onDeshacer, onRehacer, onRestaurar}) {
    if (!historial || !historial.listo()) {
        return <div className="p-3 small text-body-secondary">Cargando…</div>;
    }
    const hora = (f) => new Date(f).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
    const entradas = historial.entradas;
    return (
        <div className="d-flex flex-column h-100" data-version={version}>
            <div className="d-flex gap-1 p-2 border-bottom">
                <button className="btn btn-sm btn-outline-secondary" disabled={!historial.puedeDeshacer()} onClick={onDeshacer}
                        title="Deshacer (Ctrl+Z)"><i className="bi bi-arrow-counterclockwise"/></button>
                <button className="btn btn-sm btn-outline-secondary" disabled={!historial.puedeRehacer()} onClick={onRehacer}
                        title="Rehacer (Ctrl+Y)"><i className="bi bi-arrow-clockwise"/></button>
                <span className="flex-grow-1"/>
                <button className="btn btn-sm btn-outline-warning" onClick={onRestaurar}
                        title="Descartar los cambios sin subir y volver a lo guardado en el servidor">
                    <i className="bi bi-cloud-arrow-down me-1"/>Restaurar lo guardado
                </button>
            </div>
            <ul className="list-unstyled mb-0 flex-grow-1 overflow-auto small">
                {entradas.map((e, i) => {
                    const actual = i === historial.pos, futuro = i > historial.pos;
                    return (
                        <li key={i + "-" + e.fecha}
                            className={`ed-hist-fila ${actual ? "actual" : ""} ${futuro ? "futuro" : ""}`}
                            onClick={() => historial.irA(i)}
                            title={actual ? "Estado actual" : futuro ? "Clic para rehacer hasta aquí" : "Clic para volver a este punto"}>
                            <i className={`bi ${i === 0 ? "bi-folder2-open" : actual ? "bi-caret-right-fill" : "bi-dot"} me-1`}/>
                            <span className="flex-grow-1 text-truncate">{e.etiqueta}</span>
                            <span className="text-body-secondary ms-2">{hora(e.fecha)}</span>
                        </li>
                    );
                })}
            </ul>
            <div className="px-2 py-1 small text-body-secondary border-top">
                {historial.sinGuardar()
                    ? <><i className="bi bi-circle-fill text-warning me-1" style={{fontSize: "0.5rem"}}/>Hay cambios sin subir.</>
                    : <><i className="bi bi-check2 text-success me-1"/>Todo guardado.</>}
                {" "}Ctrl+Z deshace · Ctrl+Y rehace.
            </div>
        </div>
    );
}
