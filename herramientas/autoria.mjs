#!/usr/bin/env node
// Fases A1 + A2: compilar / validar / crear / actualizar assets y escenas desde el
// formato SIMPLE (src/Clases/Autoria/Compilador.js; guia: documento/guia_armar_escenas.md).
//
// Con LLAVE de proyecto (A2, recomendado): la llave define el proyecto, se usa la API /autoria
//   AUTORIA_LLAVE=anim_... node herramientas/autoria.mjs catalogo
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs validar  escena.json
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs crear    escena.json
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs actualizar escena.json --id <id_eventos>   (respaldo automatico)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs compilar escena.json [--salida x.json]
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs descompilar "<nombre>" | --id <id> [--salida x.json]   (editor -> formato simple)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs borrar --id <id_eventos> [--forzar]   (solo lo que creo esa llave)
//   node herramientas/autoria.mjs generadores                           (lista de generadores y parametros)
// Sin llave, solo desarrollo: --directo --proyecto <id> (lee y escribe Mongo directo).
// Opciones: --llave <llave> (en vez de la variable), AUTORIA_URL (por defecto http://backend_container:5000/autoria).
//
// "crear" nunca sobrescribe: falla si ya existe un documento con ese nombre en el proyecto.
import fs from "fs";
import {cargarMotor} from "./lib/motor.mjs";
import {db, cerrar, oid} from "./lib/datos.mjs";

// salida cortada (p. ej. con "| head"): terminar sin error
process.stdout.on("error", (e) => { if (e.code === "EPIPE") process.exit(0); });

const salida = (s) => process.stdout.write(s + "\n");

function argumentos(argv) {
    const a = {_: []};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            const k = argv[i].slice(2);
            a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
        } else a._.push(argv[i]);
    }
    return a;
}

// ---------------- acceso: API con llave (A2) o Mongo directo (desarrollo) ----------------
function conexion(a) {
    const llave = a.llave || process.env.AUTORIA_LLAVE;
    if (llave && !a.directo) return new ViaApi(llave, process.env.AUTORIA_URL || "http://backend_container:5000/autoria");
    if (!a.directo) throw new Error("falta la llave (AUTORIA_LLAVE o --llave); para desarrollo sin llave: --directo --proyecto <id>");
    if (!a.proyecto) throw new Error("con --directo hace falta --proyecto <id>");
    return new ViaMongo(a.proyecto);
}

class ViaApi {
    constructor(llave, base) { this.llave = llave; this.base = base.replace(/\/$/, ""); }
    async pedir(metodo, ruta, cuerpo) {
        const r = await fetch(this.base + ruta, {method: metodo,
            headers: {"Content-Type": "application/json", "X-Llave-Autoria": this.llave},
            body: cuerpo ? JSON.stringify(cuerpo) : undefined});
        const texto = await r.text();
        let datos; try { datos = JSON.parse(texto); } catch (e) { datos = {error: texto}; }
        if (!r.ok) {
            const errores = datos.errores || [datos.error && (datos.error.msj || datos.error) || `HTTP ${r.status}`];
            throw new Error(`API ${metodo} ${ruta} (${r.status}): ${errores.join("; ")}`);
        }
        return datos;
    }
    async catalogo() {
        const d = await this.pedir("GET", "/catalogo");
        this.id_proyecto = d.id_proyecto;
        return new Map(d.documentos.map((x) => [x.nombre, {id: String(x.id), tipo: x.tipo, eventos: x.eventos.map((e) => e.nombre)}]));
    }
    async crear(tipo, resultado) {
        return this.pedir("POST", tipo === "asset" ? "/assets" : "/escenas", resultado);
    }
    async documento(id) { return this.pedir("GET", `/eventos/${id}`); }
    async actualizar(id, resultado) {
        const {grupos_figuras, eventos, escena} = resultado;
        return this.pedir("PUT", `/eventos/${id}`, {grupos_figuras, eventos, escena});
    }
}

class ViaMongo {
    constructor(id_proyecto) { this.id_proyecto = id_proyecto; }
    async documento(id) {
        const d = await (await db()).collection("eventos").findOne({_id: oid(id), id_proyecto: this.id_proyecto});
        if (!d) throw new Error(`no existe el documento ${id} en el proyecto`);
        return d;
    }
    async catalogo() {
        const docs = await (await db()).collection("eventos")
            .find({id_proyecto: this.id_proyecto}, {projection: {nombre: 1, "eventos.nombre": 1}}).toArray();
        return new Map(docs.map((d) => [d.nombre, {id: String(d._id), eventos: (d.eventos || []).map((e) => e.nombre)}]));
    }
    async crear(tipo, resultado) {
        const base = await db(), id_proyecto = this.id_proyecto;
        const {nombre, grupos_figuras, eventos, escena} = resultado;
        if (await base.collection("eventos").findOne({id_proyecto, nombre})) throw new Error(`ya existe "${nombre}" en el proyecto (no se sobrescribe)`);
        const plantilla = await base.collection("eventos").findOne({id_proyecto}, {projection: {meta_figuras: 1}});
        const meta = (plantilla && plantilla.meta_figuras) || [];
        const ahora = new Date();
        let id_dibujo = null;
        if (tipo === "asset") {
            const nombre_animacion = nombre.replace(/[^A-Za-z0-9_-]+/g, "_").toLowerCase();
            const verif = `${id_proyecto}.${nombre_animacion}`;
            if (await base.collection("animacions").findOne({nombre_verificacion: verif})) throw new Error(`ya existe el dibujo "${nombre_animacion}"`);
            const anim = await base.collection("animacions").findOne({id_proyecto}, {projection: {meta_movimientos: 1, meta_figuras: 1}});
            const d = await base.collection("animacions").insertOne({id_proyecto, nombre_animacion, descripcion: nombre,
                nombre_verificacion: verif, raiz: false, id_copia_consolidado: null, consolidado: false,
                meta_figuras: (anim && anim.meta_figuras) || meta, meta_movimientos: (anim && anim.meta_movimientos) || [],
                grupos_figuras, lista_imagenes: [], fecha_actualizacion: ahora, fecha_creacion: ahora, __v: 0});
            id_dibujo = String(d.insertedId);
        }
        const ev = await base.collection("eventos").insertOne({id_proyecto, nombre, eventos, grupos_figuras,
            meta_figuras: meta, escena, fecha_actualizacion: ahora, fecha_creacion: ahora, __v: 0});
        return {id_eventos: String(ev.insertedId), id_dibujo};
    }
    async actualizar(id) {
        throw new Error(`actualizar (${id}) solo esta disponible con llave (hace un respaldo automatico)`);
    }
}

// ---------------- comandos ----------------
async function compilarArchivo(archivo, cat) {
    const {Compilador} = await cargarMotor();
    let def;
    try { def = JSON.parse(fs.readFileSync(archivo, "utf8")); }
    catch (e) { return {ok: false, errores: [`no se pudo leer ${archivo}: ${e.message}`], avisos: []}; }
    return {...Compilador.compilar(def, (nombre) => cat.get(nombre) || null), def};
}

function informar(r) {
    for (const e of r.errores) salida(`ERROR  ${e}`);
    for (const a of r.avisos) salida(`aviso  ${a}`);
    if (r.ok) {
        const g = r.resultado.grupos_figuras;
        salida(`OK: "${r.resultado.nombre}" -> ${g.length} grupos, ${g.reduce((n, x) => n + x.lista_figuras.length, 0)} figuras`);
    }
}

async function principal() {
    const a = argumentos(process.argv.slice(2));
    const [cmd, archivo] = a._;
    const comandos = ["catalogo", "generadores", "validar", "compilar", "descompilar", "crear", "actualizar", "borrar"];
    if (cmd === "generadores") {
        const {Generadores} = await cargarMotor();
        for (const [n, g] of Object.entries(Generadores.GENERADORES)) salida(`${n.padEnd(10)} ${g.descripcion}
           parametros: ${JSON.stringify(g.parametros)}`);
        return;
    }
    if (!comandos.includes(cmd)) {
        salida(`uso: autoria.mjs (${comandos.join("|")}) [archivo.json] [--id <id>]   (con AUTORIA_LLAVE, o --directo --proyecto <id>)`);
        process.exitCode = 2;
        return;
    }
    const c = conexion(a);
    const cat = await c.catalogo();
    if (cmd === "catalogo") {
        salida(`proyecto ${c.id_proyecto}`);
        for (const [n, v] of cat) salida(`${v.tipo ? v.tipo.padEnd(7) : ""}${n}  ${v.id}  eventos: ${v.eventos.join(", ")}`);
        return;
    }
    if (cmd === "borrar") {
        // Fase A6: solo lo que creo esta misma llave (la API rechaza lo demas)
        if (!(c instanceof ViaApi)) throw new Error("borrar solo funciona con llave (y solo borra lo que creo esa llave)");
        if (!a.id) throw new Error("borrar necesita --id <id del documento de eventos>");
        const d = await c.pedir("DELETE", `/eventos/${a.id}${a.forzar ? "?forzar=1" : ""}`);
        salida(`BORRADO "${d.borrado}" (dibujos: ${d.dibujos}, versiones: ${d.versiones})`);
        return;
    }
    if (cmd === "descompilar") {
        // Fase A1: documento del editor -> formato simple (por id o por nombre)
        const {Descompilador, Compilador} = await cargarMotor();
        const ref = a.id || archivo;
        if (!ref) throw new Error("descompilar necesita --id <id> o el nombre del documento");
        const fila = cat.get(ref) || [...cat.values()].find((v) => v.id === ref);
        if (!fila) throw new Error(`no existe "${ref}" en el proyecto`);
        const doc = await c.documento(fila.id);
        const porId = new Map([...cat].map(([n, v]) => [v.id, n]));
        const {def, avisos} = Descompilador.descompilar(doc, (id) => porId.get(String(id)) || null);
        for (const x of avisos) process.stderr.write(`aviso  ${x}\n`);
        // comprobacion: compilar lo descompilado da lo mismo
        const {diferencias} = await import("./lib/comparar.mjs");
        const r = Compilador.compilar(def, (n) => cat.get(n) || null);
        const {Fisica} = await cargarMotor();
        const dif = r.ok ? diferencias(doc, r.resultado, {efectoDefecto: Fisica.efectoDefecto}) : r.errores;
        if (dif.length) process.stderr.write(`ATENCION: la vuelta no es exacta:\n  ${dif.slice(0, 10).join("\n  ")}\n`);
        const texto = JSON.stringify(def, null, 1);
        if (a.salida) { fs.writeFileSync(a.salida, texto); salida(`escrito ${a.salida}${dif.length ? "" : " (vuelta exacta)"}`); }
        else salida(texto);
        return;
    }
    if (!archivo) throw new Error(`uso: autoria.mjs ${cmd} <archivo.json>`);
    const r = await compilarArchivo(archivo, cat);
    informar(r);
    if (!r.ok) { process.exitCode = 1; return; }
    if (cmd === "compilar") {
        const destino = a.salida || archivo.replace(/\.json$/, ".compilado.json");
        fs.writeFileSync(destino, JSON.stringify(r.resultado, null, 1));
        salida(`escrito ${destino}`);
    } else if (cmd === "crear") {
        const d = await c.crear(r.def.tipo, r.resultado);
        salida(`CREADO "${r.resultado.nombre}": eventos ${d.id_eventos}${d.id_dibujo ? `, dibujo ${d.id_dibujo}` : ""}`);
    } else if (cmd === "actualizar") {
        if (!a.id) throw new Error("actualizar necesita --id <id del documento de eventos>");
        const d = await c.actualizar(a.id, r.resultado);
        salida(`ACTUALIZADO ${d.id_eventos} (respaldo: version ${d.respaldo.numero}, ${d.respaldo.id_version})`);
    }
}

principal().catch((e) => { process.stderr.write(`ERROR: ${e.message || e}\n`); process.exitCode = 1; }).finally(cerrar);
