#!/usr/bin/env node
// Fases A1 + A2: compilar / validar / crear / actualizar assets y escenas desde el
// formato SIMPLE (src/Clases/Autoria/Compilador.js; guia: documento/guia_armar_escenas.md).
//
// Con LLAVE de proyecto (A2, recomendado): la llave define el proyecto, se usa la API /autoria
//   AUTORIA_LLAVE=anim_... node herramientas/autoria.mjs catalogo
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs validar  escena.json
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs crear    escena.json [--capitulo "Capítulo 1"]   (la escena queda al final de ese capitulo; se crea si no existe)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs capitulo "<escena>" "Capítulo 2" | --sin-capitulo   (mover una escena de capitulo)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs actualizar escena.json --id <id_eventos>   (respaldo automatico)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs compilar escena.json [--salida x.json]
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs descompilar "<nombre>" | --id <id> [--salida x.json]   (editor -> formato simple)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs borrar --id <id_eventos> [--forzar]   (solo lo que creo esa llave)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs sonidos                 (sonidos del proyecto: listos y pendientes)
//   AUTORIA_LLAVE=...       node herramientas/autoria.mjs sonido-pendiente "<nombre>" [--nota "como debe sonar"]
//   crear / actualizar ... --crear-pendientes: los sonidos que usa el archivo y no existen se crean PENDIENTES
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
        this.capitulos = d.capitulos || [];
        return new Map(d.documentos.map((x) => [x.nombre, {id: String(x.id), tipo: x.tipo, eventos: x.eventos.map((e) => e.nombre),
            capitulo: x.capitulo || null, orden: x.orden, principal: !!x.principal}]));
    }
    async crear(tipo, resultado, capitulo) {
        if (capitulo && tipo === "asset") throw new Error("--capitulo es solo para escenas: los assets son de todo el proyecto");
        return this.pedir("POST", tipo === "asset" ? "/assets" : "/escenas", capitulo ? {...resultado, capitulo} : resultado);
    }
    async moverCapitulo(id, capitulo) { return this.pedir("PUT", `/eventos/${id}/capitulo`, {capitulo}); }
    async documento(id) { return this.pedir("GET", `/eventos/${id}`); }
    async sonidos() { return this.pedir("GET", "/sonidos"); }
    async crearPendiente(nombre, nota) { return this.pedir("POST", "/sonidos", {nombre, nota}); }
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
    async sonidos() {
        return (await (await db()).collection("sonidos").find({id_proyecto: this.id_proyecto}).toArray()).map((s) => ({...s, _id: String(s._id)}));
    }
    async crearPendiente() { throw new Error("crear sonidos pendientes solo con llave"); }
    async catalogo() {
        const docs = await (await db()).collection("eventos")
            .find({id_proyecto: this.id_proyecto}, {projection: {nombre: 1, "eventos.nombre": 1}}).toArray();
        return new Map(docs.map((d) => [d.nombre, {id: String(d._id), eventos: (d.eventos || []).map((e) => e.nombre)}]));
    }
    async crear(tipo, resultado, capitulo) {
        if (capitulo) throw new Error("--capitulo solo funciona con llave");
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
// sonidos del proyecto por nombre (o por id)
const buscadorSonidos = (lista) => (n) => {
    const s = lista.find((x) => x.nombre === n || String(x._id) === n);
    return s ? {id: String(s._id)} : null;
};

async function compilarArchivo(archivo, cat, sonidos) {
    const {Compilador} = await cargarMotor();
    let def;
    try { def = JSON.parse(fs.readFileSync(archivo, "utf8")); }
    catch (e) { return {ok: false, errores: [`no se pudo leer ${archivo}: ${e.message}`], avisos: []}; }
    return {...Compilador.compilar(def, (nombre) => cat.get(nombre) || null, buscadorSonidos(sonidos)), def};
}

// nombres de sonidos que faltan, sacados de los errores del compilador
const sonidosQueFaltan = (errores) => [...new Set(errores.map((e) => (e.match(/no existe el sonido "([^"]+)"/) || [])[1]).filter(Boolean))];

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
    const comandos = ["catalogo", "generadores", "validar", "compilar", "descompilar", "crear", "actualizar", "borrar", "sonidos", "sonido-pendiente", "capitulo"];
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
    let sonidos = await c.sonidos();
    if (cmd === "sonidos") {
        for (const s of sonidos) salida(`${s.estado === "listo" ? "listo    " : "PENDIENTE"} ${s.nombre}  ${s._id}${s.duracion_ms ? `  ${s.duracion_ms} ms` : ""}${s.nota ? `  (${s.nota})` : ""}`);
        if (!sonidos.length) salida("(el proyecto no tiene sonidos)");
        return;
    }
    if (cmd === "sonido-pendiente") {
        // el asistente no sube audio: deja el sonido con nombre (y una nota de como debe sonar) para que lo suba el usuario
        if (!archivo) throw new Error('uso: autoria.mjs sonido-pendiente "<nombre>" [--nota "como debe sonar"]');
        const s = await c.crearPendiente(archivo, typeof a.nota === "string" ? a.nota : "");
        salida(`PENDIENTE "${s.nombre}" ${s._id}`);
        return;
    }
    if (cmd === "catalogo") {
        salida(`proyecto ${c.id_proyecto}`);
        const linea = (n, v) => `${v.tipo ? v.tipo.padEnd(7) : ""}${v.principal ? "* " : ""}${n}  ${v.id}  eventos: ${v.eventos.join(", ")}`;
        if (!c.capitulos) { for (const [n, v] of cat) salida(linea(n, v)); return; }
        // con llave: assets (de todo el proyecto) y escenas por capitulo, en su orden (* = principal)
        const filas = [...cat];
        const porOrden = (a, b) => (a[1].orden ?? Infinity) - (b[1].orden ?? Infinity) || a[0].localeCompare(b[0]);
        salida("ASSETS");
        for (const [n, v] of filas.filter(([, v]) => v.tipo !== "escena").sort((a, b) => a[0].localeCompare(b[0]))) salida("  " + linea(n, v));
        for (const cap of c.capitulos.concat([null])) {
            const esc = filas.filter(([, v]) => v.tipo === "escena" && v.capitulo === cap).sort(porOrden);
            if (cap === null && !esc.length) continue;
            salida(cap === null ? "ESCENAS SIN CAPITULO" : `CAPITULO "${cap}"`);
            for (const [n, v] of esc) salida("  " + linea(n, v));
            if (!esc.length) salida("  (vacio)");
        }
        return;
    }
    if (cmd === "capitulo") {
        // mover una escena de capitulo (solo organiza; no cambia el contenido)
        if (!(c instanceof ViaApi)) throw new Error("capitulo solo funciona con llave");
        const destino = a["sin-capitulo"] ? null : a._[2];
        if (!archivo || (destino === undefined)) throw new Error('uso: autoria.mjs capitulo "<escena>" "<capitulo>"   |   autoria.mjs capitulo "<escena>" --sin-capitulo');
        const fila = cat.get(archivo) || [...cat.values()].find((v) => v.id === archivo);
        if (!fila) throw new Error(`no existe "${archivo}" en el proyecto`);
        const d = await c.moverCapitulo(fila.id, destino);
        salida(d.capitulo ? `"${archivo}" -> capitulo "${d.capitulo}" (al final)` : `"${archivo}" -> sin capitulo`);
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
        const sonPorId = new Map(sonidos.map((x) => [String(x._id), x.nombre]));
        const {def, avisos} = Descompilador.descompilar(doc, (id) => porId.get(String(id)) || null, (id) => sonPorId.get(String(id)) || null);
        for (const x of avisos) process.stderr.write(`aviso  ${x}\n`);
        // comprobacion: compilar lo descompilado da lo mismo
        const {diferencias} = await import("./lib/comparar.mjs");
        const r = Compilador.compilar(def, (n) => cat.get(n) || null, buscadorSonidos(sonidos));
        const {Fisica} = await cargarMotor();
        const dif = r.ok ? diferencias(doc, r.resultado, {efectoDefecto: Fisica.efectoDefecto}) : r.errores;
        if (dif.length) process.stderr.write(`ATENCION: la vuelta no es exacta:\n  ${dif.slice(0, 10).join("\n  ")}\n`);
        const texto = JSON.stringify(def, null, 1);
        if (a.salida) { fs.writeFileSync(a.salida, texto); salida(`escrito ${a.salida}${dif.length ? "" : " (vuelta exacta)"}`); }
        else salida(texto);
        return;
    }
    if (!archivo) throw new Error(`uso: autoria.mjs ${cmd} <archivo.json>`);
    let r = await compilarArchivo(archivo, cat, sonidos);
    // --crear-pendientes: los sonidos que faltan se crean PENDIENTES (el seguimiento del editor
    // le recuerda al usuario subirlos) y se vuelve a compilar
    const faltan = sonidosQueFaltan(r.errores || []);
    if (faltan.length && a["crear-pendientes"] && (cmd === "crear" || cmd === "actualizar")) {
        for (const n of faltan) { await c.crearPendiente(n, ""); salida(`PENDIENTE "${n}" (creado; falta subir el audio)`); }
        sonidos = await c.sonidos();
        r = await compilarArchivo(archivo, cat, sonidos);
    } else if (faltan.length) salida(`(sonidos que faltan: ${faltan.join(", ")}. Con --crear-pendientes en crear/actualizar se crean pendientes)`);
    informar(r);
    if (!r.ok) { process.exitCode = 1; return; }
    if (cmd === "compilar") {
        const destino = a.salida || archivo.replace(/\.json$/, ".compilado.json");
        fs.writeFileSync(destino, JSON.stringify(r.resultado, null, 1));
        salida(`escrito ${destino}`);
    } else if (cmd === "crear") {
        const capitulo = typeof a.capitulo === "string" ? a.capitulo : null;
        const d = await c.crear(r.def.tipo, r.resultado, capitulo);
        salida(`CREADO "${r.resultado.nombre}": eventos ${d.id_eventos}${d.id_dibujo ? `, dibujo ${d.id_dibujo}` : ""}${d.capitulo ? ` (capitulo "${d.capitulo}")` : ""}`);
    } else if (cmd === "actualizar") {
        if (!a.id) throw new Error("actualizar necesita --id <id del documento de eventos>");
        const d = await c.actualizar(a.id, r.resultado);
        salida(`ACTUALIZADO ${d.id_eventos} (respaldo: version ${d.respaldo.numero}, ${d.respaldo.id_version})`);
    }
}

principal().catch((e) => { process.stderr.write(`ERROR: ${e.message || e}\n`); process.exitCode = 1; }).finally(cerrar);
