// Respaldo de proyectos: exportar a .zip e importar (backend: routes/Respaldo.js).
import axios from "axios";
import {Cookies} from "react-cookie";

const auth = () => ({Authorization: `Bearer ${new Cookies().get("usuario")?.token}`});

async function error(e) {
    // con responseType "blob" el error del servidor tambien llega como blob
    const d = e?.response?.data;
    if (d instanceof Blob) { try { return new Error(JSON.parse(await d.text()).error); } catch (x) { /* sigue */ } }
    return new Error(d?.error || e?.message || String(e));
}

function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const nombreDe = (r, defecto) => {
    const m = /filename="([^"]+)"/.exec(r.headers["content-disposition"] || "");
    return m ? m[1] : defecto;
};

async function bajar(url, defecto) {
    try {
        const r = await axios({method: "get", url, withCredentials: true, headers: auth(), responseType: "blob"});
        const nombre = nombreDe(r, defecto);
        descargar(r.data, nombre);
        return nombre;
    } catch (e) { throw await error(e); }
}

export const exportarProyecto = (id) => bajar(`/api/proyecto/${id}/exportar`, "proyecto.zip");
export const exportarTodos = () => bajar("/api/proyectos/exportar", "proyectos.zip");

// -> [{_id, nombre, renombrado, conteos, archivos, avisos} | {archivo, error}]
export async function importarProyectos(archivo) {
    const fd = new FormData();
    fd.append("archivo", archivo);
    try {
        const r = await axios({method: "post", url: "/api/proyectos/importar", data: fd, withCredentials: true, headers: auth()});
        return r.data;
    } catch (e) { throw await error(e); }
}
