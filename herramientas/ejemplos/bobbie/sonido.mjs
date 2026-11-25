// Efectos y musica de "Bobbie" (fase 5), DESPUES de las voces (voces.mjs --reubicar corre los tiempos):
// lee cada escena_N.voces.json, saca los momentos reales (saltos de camara, acciones) y pone los clips.
// La musica es un solo tema de 92 s que sigue de escena en escena con `recorte` (desde donde quedo).
// Se puede volver a correr: reemplaza los clips que no son voces.
//   node herramientas/ejemplos/bobbie/sonido.mjs
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const leer = (n) => JSON.parse(fs.readFileSync(path.join(DIR, `escena_${n}.voces.json`), "utf8"));
const obj = (e, n) => e.objetos.find((o) => o.nombre === n);
const accion = (o, ev) => (o.acciones || []).find((a) => a[1] === ev)?.[0];
// instantes de la camara donde salta (claves "mantener"): inicio de cada tramo
const saltos = (e) => (e.camara.claves.x || []).filter((k, i, l) => i === 0 || l[i - 1][2] === "mantener").map((k) => k[0]);
const clip = (sonido, t, volumen, extra = {}) => ({sonido, t: Math.max(0, Math.round(t)), volumen, ...extra});
const ambiente = (sonido, volumen) => clip(sonido, 0, volumen, {bucle: true, fundido: {entrada: 600, salida: 900}});
// un tramo de un sonido largo: suena una vez entre t0 y t1 (sin bucle)
const tramo = (sonido, t0, t1, volumen, desde = 0) => clip(sonido, t0, volumen, {recorte: [desde, desde + (t1 - t0)], fundido: {entrada: 300, salida: 500}});

const efectos = {
    1: (e) => [ambiente("Ventisca", 0.55)],
    2: (e) => {
        const auto = obj(e, "auto"), bob = obj(e, "bobbie");
        const tSube = bob.claves.opacidad.find((k) => k[1] === 0)[0];          // cuando la copia del suelo se apaga = salta
        return [ambiente("Pájaros de verano", 0.3), clip("Ladrido feliz", tSube - 400, 0.55),
            clip("Auto antiguo", accion(auto, "Andar") - 2200, 0.55, {fundido: {entrada: 400, salida: 1200}})];
    },
    3: (e) => {
        const [, tB, tC] = saltos(e);
        return [clip("Perros gruñendo", 500, 0.65, {recorte: [0, tB - 700], fundido: {entrada: 100, salida: 600}}),
            tramo("Grillos de noche", tB, tC, 0.45),
            clip("Auto antiguo", tC + 100, 0.5, {fundido: {entrada: 300, salida: 1500}})];
    },
    4: (e) => {
        const t = saltos(e), fin = e.duracion;
        return [tramo("Río chapoteo", t[1], t[2], 0.55), tramo("Ventisca", t[2], t[3], 0.35),
            tramo("Ventisca", t[4], t[5], 0.65, 8000), tramo("Lluvia en el bosque", t[5], fin, 0.55)];
    },
    5: (e) => {
        // (la carrera esta en los pasos: caminar con accion "Correr")
        const tCorre = e.pasos.find((p) => p.caminar === "bobbie" && p.accion === "Correr").desde;
        return [ambiente("Llovizna", 0.4), clip("Ladrido feliz", tCorre + 200, 0.6)];
    },
    6: (e) => {
        const [, tB] = saltos(e);
        return [ambiente("Pájaros de verano", 0.22), clip("Diario girando", tB, 0.7)];
    },
};
// musica: volumen por escena (baja donde habla mucho el narrador, sube en el reencuentro y el cierre)
const VOL_MUSICA = {1: 0.42, 2: 0.32, 3: 0.32, 4: 0.42, 5: 0.5, 6: 0.55};
let ya = 0;
for (const n of [1, 2, 3, 4, 5, 6]) {
    const e = leer(n);
    const voces = (e.sonidos || []).filter((c) => /^voz /.test(c.sonido));
    const dur = e.duracion, hasta = Math.min(92000, ya + dur);
    const musica = clip("Música: Bobbie", 0, VOL_MUSICA[n], {recorte: [ya, hasta], fundido: {entrada: n === 1 ? 300 : 80, salida: n === 6 ? 1800 : 80}});
    e.sonidos = [...voces, ...efectos[n](e), musica];
    fs.writeFileSync(path.join(DIR, `escena_${n}.voces.json`), JSON.stringify(e, null, 1));
    console.log(`escena ${n} (${dur} ms): musica ${ya} -> ${hasta}; ${e.sonidos.length - voces.length - 1} efecto(s)`);
    ya += dur;
}
