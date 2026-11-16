// Carga el motor REAL del editor (src/Clases) en Node. Los fuentes usan imports sin
// extension (estilo Create React App), asi que se empaquetan con esbuild en un solo
// modulo ESM, que se guarda en node_modules/.cache/autoria y se rehace solo cuando
// cambia algun fuente.
import {build} from "esbuild";
import fs from "fs";
import path from "path";
import {fileURLToPath, pathToFileURL} from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const CACHE = path.join(RAIZ, "node_modules/.cache/autoria");

const ENTRADA = `
export {GestionEvento} from "./src/Clases/EditorEvento/GestionEvento.js";
export * as Fisica from "./src/Clases/EditorEvento/Fisica.js";
export * as Claves from "./src/Clases/EditorEvento/Claves.js";
export * as Compilador from "./src/Clases/Autoria/Compilador.js";
export * as Render from "./src/Clases/Autoria/Render.js";
export * as Generadores from "./src/Clases/Autoria/Generadores.js";
export * as Descompilador from "./src/Clases/Autoria/Descompilador.js";
`;

function ultimaModificacion(dir) {
    let t = 0;
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
        const p = path.join(dir, e.name);
        t = Math.max(t, e.isDirectory() ? ultimaModificacion(p) : fs.statSync(p).mtimeMs);
    }
    return t;
}

let cargado = null;

export async function cargarMotor() {
    if (cargado) return cargado;
    fs.mkdirSync(CACHE, {recursive: true});
    const salida = path.join(CACHE, "motor.mjs");
    const fuentes = ultimaModificacion(path.join(RAIZ, "src/Clases"));
    if (!fs.existsSync(salida) || fs.statSync(salida).mtimeMs < fuentes) {
        await build({
            stdin: {contents: ENTRADA, resolveDir: RAIZ, loader: "js"},
            bundle: true, platform: "node", format: "esm", outfile: salida, logLevel: "error",
            // el motor no necesita React ni el DOM; si algun modulo los importa, que falle claro
            external: ["react", "react-dom"],
        });
    }
    // el motor escribe mucho por console.log: silenciarlo salvo con DEBUG=1
    if (!process.env.DEBUG) console.log = () => {};
    cargado = await import(pathToFileURL(salida).href + `?v=${fs.statSync(salida).mtimeMs}`);
    return cargado;
}
