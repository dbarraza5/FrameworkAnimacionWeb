import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Cookies} from "react-cookie";

// Llaves de autoria asistida (Fase A2 de documento/planeacion_autoria_asistida.md).
// Una llave da al asistente acceso a /autoria SOLO para este proyecto: leer, crear y
// actualizar assets y escenas (con respaldo automatico). No puede borrar. La llave
// completa se ve una sola vez, al crearla; se puede revocar cuando se quiera.
export default function LlavesAutoria({id_proyecto}) {
    const [llaves, setLlaves] = useState([]);
    const [nombre, setNombre] = useState("Asistente");
    const [nueva, setNueva] = useState(null);       // {llave, nombre} recien creada
    const [error, setError] = useState("");
    const [copiada, setCopiada] = useState(false);

    const config = (method, url, data) => ({
        method, url, data, withCredentials: true,
        headers: {"Content-Type": "application/json", Authorization: "Bearer " + new Cookies().get("usuario")?.token},
    });

    const cargar = useCallback(async () => {
        if (!id_proyecto) return;
        try {
            const r = await axios(config("get", `/api/proyecto/${id_proyecto}/llaves`));
            setLlaves(r.data || []);
            setError("");
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "No se pudieron leer las llaves");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id_proyecto]);

    useEffect(() => { void cargar(); }, [cargar]);

    const crear = async () => {
        try {
            const r = await axios(config("post", `/api/proyecto/${id_proyecto}/llaves`, {nombre}));
            setNueva(r.data);
            setCopiada(false);
            void cargar();
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "No se pudo crear la llave");
        }
    };

    const revocar = async (l) => {
        if (!window.confirm(`¿Revocar la llave "${l.nombre}" (${l.prefijo}…)? Dejará de funcionar de inmediato.`)) return;
        try {
            await axios(config("delete", `/api/proyecto/${id_proyecto}/llaves/${l._id}`));
            if (nueva && nueva._id === l._id) setNueva(null);
            void cargar();
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "No se pudo revocar");
        }
    };

    const fecha = (f) => (f ? new Date(f).toLocaleString() : "—");

    return (
        <div className="p-2" style={{maxWidth: 900}}>
            <p className="text-body-secondary small mb-3">
                Una <b>llave de asistente</b> permite que el asistente (Claude) cree y actualice assets y escenas
                de <b>este proyecto</b> sin usar tu sesión ni tu contraseña. Solo puede borrar lo que ella misma creó, y antes de modificar
                algo existente guarda un respaldo (una versión) que puedes restaurar. Revócala cuando ya no la necesites.
            </p>

            <div className="d-flex gap-2 mb-3" style={{maxWidth: 520}}>
                <input className="form-control form-control-sm" value={nombre} onChange={(e) => setNombre(e.target.value)}
                       placeholder="Nombre de la llave (para reconocerla)"/>
                <button className="btn btn-sm btn-primary text-nowrap" onClick={crear}>
                    <i className="bi bi-key me-1"/>Crear llave
                </button>
            </div>

            {nueva && (
                <div className="alert alert-warning py-2">
                    <div className="small mb-1"><b>Copia esta llave ahora:</b> no se volverá a mostrar.</div>
                    <div className="d-flex gap-2 align-items-center">
                        <code className="user-select-all text-break flex-grow-1">{nueva.llave}</code>
                        <button className="btn btn-sm btn-outline-dark text-nowrap"
                                onClick={() => { navigator.clipboard?.writeText(nueva.llave); setCopiada(true); }}>
                            <i className={`bi ${copiada ? "bi-check2" : "bi-clipboard"} me-1`}/>{copiada ? "Copiada" : "Copiar"}
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setNueva(null)} title="Ocultar">
                            <i className="bi bi-x"/>
                        </button>
                    </div>
                </div>
            )}
            {error && <div className="alert alert-danger py-1 small">{error}</div>}

            <table className="table table-sm">
                <thead>
                <tr><th>Nombre</th><th>Llave</th><th>Creada</th><th>Último uso</th><th>Estado</th><th/></tr>
                </thead>
                <tbody>
                {llaves.length === 0 && <tr><td colSpan={6} className="text-body-secondary small">No hay llaves.</td></tr>}
                {llaves.map((l) => (
                    <tr key={l._id} className={l.revocada ? "text-body-secondary" : ""}>
                        <td>{l.nombre}</td>
                        <td><code>{l.prefijo}…</code></td>
                        <td className="small">{fecha(l.creada)}</td>
                        <td className="small">{fecha(l.ultimo_uso)}</td>
                        <td>{l.revocada ? <span className="badge text-bg-secondary">revocada</span> : <span className="badge text-bg-success">activa</span>}</td>
                        <td>{!l.revocada && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => revocar(l)}>Revocar</button>
                        )}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
