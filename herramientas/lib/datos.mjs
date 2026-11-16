// Lectura de documentos para las herramientas (render, reporte, pruebas).
// - Con AUTORIA_LLAVE (Fase A3 sobre A2): todo por la API /autoria con la llave del proyecto
//   (AUTORIA_URL, por defecto http://backend_container:5000/autoria). Es lo normal.
// - Sin llave (solo desarrollo): Mongo directo, en solo lectura (MONGO_URL, por defecto el
//   servicio db_mongo_docker de docker-compose).
import {MongoClient, ObjectId} from "mongodb";

const URL = process.env.MONGO_URL ||
    "mongodb://daniel:12345@db_mongo_docker:27017/framework-videojuego?authSource=admin";

let cliente = null;

export async function db() {
    if (!cliente) cliente = await new MongoClient(URL).connect();
    return cliente.db();
}

export async function cerrar() {
    if (cliente) await cliente.close();
    cliente = null;
}

export const oid = (id) => new ObjectId(String(id));
const esId = (s) => /^[0-9a-f]{24}$/i.test(String(s));

// ---------------- API con llave ----------------
export const usaApi = () => !!process.env.AUTORIA_LLAVE;

export async function pedirApi(ruta) {
    const base = (process.env.AUTORIA_URL || "http://backend_container:5000/autoria").replace(/\/$/, "");
    const r = await fetch(base + ruta, {headers: {"X-Llave-Autoria": process.env.AUTORIA_LLAVE}});
    const texto = await r.text();
    let datos; try { datos = JSON.parse(texto); } catch (e) { datos = {error: texto}; }
    if (!r.ok) throw new Error(`API GET ${ruta} (${r.status}): ${datos.error && (datos.error.msj || datos.error) || "error"}`);
    return datos;
}

// Documento de eventos (escena o asset) por id, o por nombre (con la llave: en su proyecto;
// sin llave: en id_proyecto si se da).
export async function documentoEventos(idONombre, id_proyecto) {
    if (usaApi()) {
        let id = idONombre;
        if (!esId(id)) {
            const {documentos} = await pedirApi("/catalogo");
            const d = documentos.find((x) => x.nombre === idONombre);
            if (!d) return null;
            id = d.id;
        }
        try { return await pedirApi(`/eventos/${id}`); } catch (e) { if (/\(404\)/.test(e.message)) return null; throw e; }
    }
    const col = (await db()).collection("eventos");
    if (esId(idONombre)) return col.findOne({_id: oid(idONombre)});
    return col.findOne(id_proyecto ? {id_proyecto, nombre: idONombre} : {nombre: idONombre});
}

// Cargador de assets para el motor: (id, version) -> documento.
export function cargadorAssets() {
    if (usaApi()) return (id, version) => pedirApi(version ? `/versiones/${version}` : `/eventos/${id}`);
    return async (id, version) => {
        const base = await db();
        if (version) {
            const v = await base.collection("versiones_eventos").findOne({_id: oid(version)});
            if (!v) throw new Error(`version ${version} no encontrada`);
            return {...v.contenido, _id: v.id_eventos, version: {_id: v._id, numero: v.numero}};
        }
        const d = await base.collection("eventos").findOne({_id: oid(id)});
        if (!d) throw new Error(`asset ${id} no encontrado`);
        return d;
    };
}
