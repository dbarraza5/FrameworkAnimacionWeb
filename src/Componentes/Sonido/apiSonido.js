// Llamadas al backend para los sonidos de un proyecto (planeacion_sonido.md).
import axios from "axios";
import {Cookies} from "react-cookie";
import {analizar} from "../../Clases/Sonido/Mezcla";

const auth = () => ({Authorization: `Bearer ${new Cookies().get("usuario")?.token}`});
const pedir = (method, url, data, extra = {}) => axios({method, url, data, withCredentials: true, headers: {...auth(), ...(extra.headers || {})}, ...extra})
    .then((r) => r.data)
    .catch((e) => { throw new Error(e?.response?.data?.error || e?.message || String(e)); });

export const listarSonidos = (id_proyecto) => pedir("get", `/api/proyecto/${id_proyecto}/sonidos`);
export const crearPendiente = (id_proyecto, nombre, nota = "") => pedir("post", `/api/proyecto/${id_proyecto}/sonidos`, {nombre, nota});
export const usosSonido = (id) => pedir("get", `/api/sonido/${id}/usos`);
export const borrarSonido = (id, forzar = false) => pedir("delete", `/api/sonido/${id}${forzar ? "?forzar=1" : ""}`);
export const renombrarSonido = (id, nombre) => pedir("patch", `/api/sonido/${id}`, {nombre});

// El archivo como ArrayBuffer (con la revision en la URL para el cache del navegador)
export const cargarArchivo = (id, revision = 0) => pedir("get", `/api/sonido/${id}/archivo?r=${revision}`, undefined, {responseType: "arraybuffer"});

// Formulario con el archivo + duracion y forma de onda (las calcula el navegador)
async function formulario(archivo, campos = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(campos)) fd.append(k, v);
    try {
        const {duracion_ms, picos} = await analizar(await archivo.arrayBuffer());
        fd.append("duracion_ms", String(duracion_ms));
        fd.append("picos", JSON.stringify(picos));
    } catch (e) {
        throw new Error(`no se pudo leer el audio de "${archivo.name}" (¿formato no soportado?)`);
    }
    fd.append("archivo", archivo);
    return fd;
}

export const subirSonido = async (id_proyecto, archivo, nombre) =>
    pedir("post", `/api/proyecto/${id_proyecto}/sonidos`, await formulario(archivo, nombre ? {nombre} : {}));
export const reemplazarArchivo = async (id, archivo) => pedir("put", `/api/sonido/${id}/archivo`, await formulario(archivo));

export const duracionTexto = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, "0")}` : `${(ms / 1000).toFixed(1)} s`);
