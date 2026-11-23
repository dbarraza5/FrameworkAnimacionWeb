// Reparte la musica del capitulo "Horizon-1" entre las escenas, DESPUES de las voces (que pueden alargar las
// escenas): cada tema empieza en una escena y sigue en las siguientes con `recorte` (desde donde se quedo).
//   node herramientas/ejemplos/lanzamiento/musica.mjs      (lee y reescribe historia_N.voces.json)
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMAS = [
    {sonido: "Música: tensión", escenas: [1, 2], volumen: 0.42, largo: 23217},
    {sonido: "Música: épica", escenas: [3, 4, 5], volumen: 0.5, largo: 31691},
    {sonido: "Música: espacio", escenas: [6, 7], volumen: 0.5, largo: 21816},
];
const archivo = (n) => path.join(DIR, `historia_${n}.voces.json`);
for (const tema of TEMAS) {
    let ya = 0;
    tema.escenas.forEach((n, k) => {
        const esc = JSON.parse(fs.readFileSync(archivo(n), "utf8"));
        const dur = esc.duracion, sonidos = (esc.sonidos || []).filter((c) => c.sonido !== tema.sonido);
        if (ya < tema.largo) {
            const hasta = Math.min(tema.largo, ya + dur);
            sonidos.push({sonido: tema.sonido, t: 0, volumen: tema.volumen, recorte: [ya, hasta],
                fundido: {entrada: k === 0 ? 1200 : 0, salida: hasta >= tema.largo || k === tema.escenas.length - 1 ? 1500 : 0}});
        }
        ya += dur;
        fs.writeFileSync(archivo(n), JSON.stringify({...esc, sonidos}, null, 1));
        console.log(`escena ${n} (${dur} ms): ${tema.sonido} ${ya - dur} -> ${Math.min(ya, tema.largo)}`);
    });
}
