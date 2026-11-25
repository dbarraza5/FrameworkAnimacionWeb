// Acciones de alto nivel en la escena (planeacion_autoria_ia.md, fase IA-5). Se traducen, antes de compilar,
// a lo de siempre (claves, acciones, objetos), asi que lo guardado no cambia y se puede retocar a mano.
//
//   pasos: [
//     {caminar: "<objeto>", a: [x, y] | {cuadro} | "<otro objeto>", desde, hasta? | velocidad? (px/s, 140),
//      accion?: "<evento>" (por defecto "Caminar" si el asset lo tiene), luego?: "<evento>", girar?: true,
//      separacion?: 120 (si a es un objeto: se detiene a esa distancia), interp?: "lineal"},
//     {mirar: "<objeto>", a: "<otro objeto>" | "izquierda" | "derecha", t},
//     {tomar: "<objeto que toma>", objeto: "<objeto>", enganche: "<enganche>" | {parte}, t, en?: [dx, dy]},
//     {soltar: "<objeto que suelta>", objeto: "<objeto>", t, en: [x, y] (donde queda)},
//     {plano: "general" | "medio" | "primer", de: "<objeto>" | ["a", "b"], desde, hasta? (desde + 800), interp?: "suave"},
//   ]
// Supuestos: los assets miran a la derecha sin espejo; "caja" del asset (escena.caja, la calcula el compilador
// de assets) para encuadrar; sin caja se usa una de 100 x 200 sobre los pies.
import {valorEn} from "../EditorEvento/Claves";
import {puntoCuadro} from "./Formatos";

const num = (x) => typeof x === "number" && Number.isFinite(x);
const par = (x) => Array.isArray(x) && x.length === 2 && x.every(num);
const nombreDe = (o) => o && (o.nombre || o.instancia);
const red = (v) => Math.round(v * 100) / 100;
const CAJA_DEFECTO = {x0: -50, y0: -200, x1: 50, y1: 0};

// pista del formato simple [[t, v, interp?]] -> la del motor [{t, v, interp}]
const pista = (l) => (Array.isArray(l) && l.length ? l.map((k) => ({t: k[0], v: k[1], interp: k[2] || "lineal"})).sort((a, b) => a.t - b.t) : null);

export function expandirPasos(def, buscarAsset) {
    const errores = [], avisos = [];
    if (!def || def.pasos === undefined) return {def, errores, avisos};
    if (!Array.isArray(def.pasos)) return {def, errores: ["pasos es una lista de acciones ({caminar}, {mirar}, {tomar}, {soltar}, {plano})"], avisos};
    // copias de trabajo
    const objetos = (def.objetos || []).map((o) => ({...o, claves: o.claves ? JSON.parse(JSON.stringify(o.claves)) : undefined}));
    const porNombre = new Map(objetos.map((o) => [nombreDe(o), o]));
    const camara = {...(def.camara || {})};
    camara.claves = camara.claves ? JSON.parse(JSON.stringify(camara.claves)) : undefined;
    const asset = (o) => (o && o.instancia && buscarAsset ? buscarAsset(o.instancia) : null);

    const valor = (o, prop, t, base) => { const p = pista(o.claves && o.claves[prop]); return p ? valorEn(p, t) : base; };
    const pos = (o, t) => [valor(o, "x", t, (o.en || [0, 0])[0]), valor(o, "y", t, (o.en || [0, 0])[1])];
    const escalaBase = (o) => (par(o.escala) ? o.escala[0] : num(o.escala) ? o.escala : 1);
    // clave de un tramo t0 -> t1 (sin pisar otras claves en el medio)
    const tramo = (cl, prop, t0, t1, v0, v1, interp, donde) => {
        const l = cl[prop] || [];
        if (l.some((k) => k[0] > t0 && k[0] < t1)) { errores.push(`${donde}: se pisa con otras claves de ${prop} entre ${t0} y ${t1} ms`); return; }
        cl[prop] = [...l.filter((k) => k[0] !== t0 && k[0] !== t1), [t0, red(v0), interp], [t1, red(v1), interp]].sort((a, b) => a[0] - b[0]);
    };
    // un salto en t (desde ahi vale v): claves "mantener"
    const salto = (cl, prop, t, v, antes) => {
        const l = (cl[prop] || []).filter((k) => k[0] !== t);
        if (!l.length && antes !== undefined && t > 0) l.push([0, antes, "mantener"]);
        l.push([t, v, "mantener"]);
        cl[prop] = l.sort((a, b) => a[0] - b[0]);
    };
    const objeto = (n, donde) => { const o = porNombre.get(n); if (!o) errores.push(`${donde}: "${n}" no es un objeto de la escena`); return o; };
    const agregarAccion = (o, t, evento, bucle, donde) => {
        const a = asset(o);
        if (!a) { errores.push(`${donde}: "${nombreDe(o)}" no es una instancia (no tiene acciones)`); return; }
        if (a.eventos && !a.eventos.includes(evento)) { errores.push(`${donde}: el asset "${o.instancia}" no tiene el evento "${evento}" (tiene: ${a.eventos.join(", ")})`); return; }
        o.acciones = [...(o.acciones || []).filter((x) => x[0] !== t), [t, evento, ...(bucle === false ? [false] : [])]].sort((x, y) => x[0] - y[0]);
    };
    // hacia donde mira (1 derecha, -1 izquierda) y darse vuelta en t
    const mira = (o, t) => { const v = valor(o, "escala_x", t, (o.espejo ? -1 : 1) * escalaBase(o)); return v < 0 ? -1 : 1; };
    const girarA = (o, t, lado) => {
        if (mira(o, t) === lado) return;
        o.claves = o.claves || {};
        const base = (o.espejo ? -1 : 1) * escalaBase(o);
        salto(o.claves, "escala_x", t, lado * Math.abs(escalaBase(o)), base);
    };

    // orden: primero el movimiento (caminar, mirar), despues tomar/soltar y al final los planos (usan las posiciones)
    const tipo = (p) => ["caminar", "mirar", "tomar", "soltar", "plano"].find((k) => p && p[k] !== undefined);
    const lista = def.pasos.map((p, i) => ({p, i, k: tipo(p)}));
    for (const x of lista) if (!x.k) errores.push(`pasos[${x.i}]: no se reconoce (validos: caminar, mirar, tomar, soltar, plano)`);
    const ORDEN = {caminar: 0, mirar: 0, tomar: 1, soltar: 1, plano: 2};
    lista.filter((x) => x.k).sort((a, b) => ORDEN[a.k] - ORDEN[b.k] || a.i - b.i).forEach(({p, i, k}) => {
        const donde = `pasos[${i}] (${k})`;
        if (k === "caminar") {
            const o = objeto(p.caminar, donde); if (!o) return;
            if (!num(p.desde)) { errores.push(`${donde}: falta desde (ms)`); return; }
            const p0 = pos(o, p.desde);
            let destino;
            if (par(p.a)) destino = p.a;
            else if (p.a && typeof p.a === "object" && p.a.cuadro !== undefined) destino = puntoCuadro({...p.a, t: p.a.t ?? p.desde}, camara, def.zona_segura, errores, donde);
            else if (typeof p.a === "string") {
                const otro = objeto(p.a, donde); if (!otro) return;
                const q = pos(otro, p.desde), sep = num(p.separacion) ? p.separacion : 120;
                destino = [q[0] + (p0[0] <= q[0] ? -sep : sep), q[1]];
            } else { errores.push(`${donde}: a es [x, y], {cuadro} o el nombre de otro objeto`); return; }
            const dist = Math.hypot(destino[0] - p0[0], destino[1] - p0[1]);
            const hasta = num(p.hasta) ? p.hasta : Math.round(p.desde + dist / (num(p.velocidad) && p.velocidad > 0 ? p.velocidad : 140) * 1000);
            if (!(hasta > p.desde)) { errores.push(`${donde}: hasta tiene que ser despues de desde`); return; }
            o.claves = o.claves || {};
            const interp = p.interp || "lineal";
            if (Math.abs(destino[0] - p0[0]) > 0.01) tramo(o.claves, "x", p.desde, hasta, p0[0], destino[0], interp, donde);
            if (Math.abs(destino[1] - p0[1]) > 0.01) tramo(o.claves, "y", p.desde, hasta, p0[1], destino[1], interp, donde);
            if (p.girar !== false && Math.abs(destino[0] - p0[0]) > 1) girarA(o, p.desde, destino[0] > p0[0] ? 1 : -1);
            const a = asset(o);
            const accion = p.accion !== undefined ? p.accion : a && a.eventos && a.eventos.includes("Caminar") ? "Caminar" : null;
            if (accion) agregarAccion(o, p.desde, accion, true, donde);
            if (p.luego) agregarAccion(o, hasta, p.luego, true, donde);
            else if (accion && a && a.eventos) avisos.push(`${donde}: sin luego, "${nombreDe(o)}" sigue con "${accion}" al llegar (luego: "<evento>" para pararlo)`);
        } else if (k === "mirar") {
            const o = objeto(p.mirar, donde); if (!o) return;
            if (!num(p.t)) { errores.push(`${donde}: falta t (ms)`); return; }
            let lado;
            if (p.a === "derecha") lado = 1; else if (p.a === "izquierda") lado = -1;
            else if (typeof p.a === "string") { const otro = objeto(p.a, donde); if (!otro) return; lado = pos(otro, p.t)[0] >= pos(o, p.t)[0] ? 1 : -1; }
            else { errores.push(`${donde}: a es "izquierda", "derecha" o el nombre de otro objeto`); return; }
            girarA(o, p.t, lado);
        } else if (k === "plano") {
            const n = Array.isArray(p.de) ? p.de : [p.de];
            const os = n.map((x) => objeto(x, donde));
            if (os.some((o) => !o)) return;
            if (!num(p.desde)) { errores.push(`${donde}: falta desde (ms)`); return; }
            // (que parte del cuerpo se encuadra y que fraccion del alto del cuadro ocupa; con margen para la cabeza)
            const MARCO = {general: {arriba: 0, abajo: 1, llena: 0.5}, medio: {arriba: 0, abajo: 0.6, llena: 0.55}, primer: {arriba: 0, abajo: 0.3, llena: 0.5}};
            const m = MARCO[p.plano];
            if (!m) { errores.push(`${donde}: plano es "general", "medio" o "primer"`); return; }
            // caja de cada objeto en desde (de los pies hacia arriba, con su escala)
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (const o of os) {
                const a = asset(o), c = (a && a.caja) || CAJA_DEFECTO, [px, py] = pos(o, p.desde);
                if (!(a && a.caja)) avisos.push(`${donde}: "${nombreDe(o)}" no tiene caja (asset sin recompilar o dibujo): se supone 100 × 200`);
                const sx = Math.abs(escalaBase(o)), sy = par(o.escala) ? o.escala[1] : sx;
                const izq = mira(o, p.desde) < 0;
                const cx0 = izq ? -c.x1 : c.x0, cx1 = izq ? -c.x0 : c.x1;
                const alto = (c.y1 - c.y0) * sy, top = py + c.y0 * sy;
                x0 = Math.min(x0, px + cx0 * sx); x1 = Math.max(x1, px + cx1 * sx);
                y0 = Math.min(y0, top + alto * m.arriba); y1 = Math.max(y1, top + alto * m.abajo);
            }
            const tam = Array.isArray(camara.tamano) ? camara.tamano : [1280, 720];
            // zoom para que la zona llene "llena" del alto (o del ancho, si es mas ancha)
            const zoom = red(Math.min(tam[1] * m.llena / (y1 - y0), tam[0] * 0.9 / (x1 - x0)));
            const destino = {x: red((x0 + x1) / 2), y: red((y0 + y1) / 2), zoom};
            const hasta = num(p.hasta) ? p.hasta : p.desde + 800;
            const cen = Array.isArray(camara.centro) ? camara.centro : [tam[0] / 2, tam[1] / 2];
            const base = {x: cen[0], y: cen[1], zoom: num(camara.zoom) ? camara.zoom : 1};
            camara.claves = camara.claves || {};
            for (const prop of ["x", "y", "zoom"]) {
                const v0 = valorEn(pista(camara.claves[prop]), p.desde) ?? base[prop];
                if (hasta === p.desde) salto(camara.claves, prop, p.desde, destino[prop], base[prop]);
                else tramo(camara.claves, prop, p.desde, hasta, v0, destino[prop], p.interp || "suave", donde);
            }
        }
    });

    // tomar / soltar: el objeto tiene una copia suelta (en el mundo) y una colgada de cada quien que lo toma;
    // se prende una u otra con opacidad "mantener"
    const cambios = lista.filter((x) => x.k === "tomar" || x.k === "soltar");
    const porObjeto = new Map();
    for (const {p, i, k} of cambios) {
        const donde = `pasos[${i}] (${k})`;
        if (typeof p.objeto !== "string") { errores.push(`${donde}: falta objeto (el que se toma o se suelta)`); continue; }
        if (!num(p.t)) { errores.push(`${donde}: falta t (ms)`); continue; }
        const quien = objeto(p[k], donde), o = objeto(p.objeto, donde);
        if (!quien || !o) continue;
        if (o.instancia) { errores.push(`${donde}: por ahora solo se toman objetos dibujados (no instancias)`); continue; }
        if (k === "tomar" && p.enganche === undefined) { errores.push(`${donde}: falta enganche (de "${p.tomar}": p. ej. "mano")`); continue; }
        if (k === "soltar" && !par(p.en)) { errores.push(`${donde}: falta en: [x, y] (donde queda el objeto)`); continue; }
        if (!porObjeto.has(p.objeto)) porObjeto.set(p.objeto, []);
        porObjeto.get(p.objeto).push({k, t: p.t, quien: p[k], enganche: p.enganche, en: p.en, donde});
    }
    const nuevos = [];
    for (const [nombre, l] of porObjeto) {
        l.sort((a, b) => a.t - b.t);
        const suelto = porNombre.get(nombre);
        suelto.claves = suelto.claves || {};
        const opBase = num(suelto.opacidad) ? suelto.opacidad : 1;
        // copia colgada por cada (quien, enganche)
        const colgadas = new Map();
        let en_mano = null;            // clave de la copia que lo tiene ahora
        for (const c of l) {
            if (c.k === "tomar") {
                if (en_mano) { errores.push(`${c.donde}: "${nombre}" ya lo tiene "${colgadas.get(en_mano).padre}"`); continue; }
                const clave = `${c.quien}|${JSON.stringify(c.enganche)}`;
                if (!colgadas.has(clave)) {
                    const {claves, en, padre, enganche, plano, ...dibujo} = suelto;
                    // (los nombres de las partes son unicos en la escena: la copia lleva "@quien")
                    const renombrar = (ps) => ps.map((x) => ({...x, nombre: `${x.nombre}@${c.quien}`, ...(x.partes ? {partes: renombrar(x.partes)} : {})}));
                    colgadas.set(clave, {...dibujo, ...(dibujo.partes ? {partes: renombrar(dibujo.partes)} : {}),
                        nombre: `${nombre}@${c.quien}`, padre: c.quien, enganche: c.enganche, en: par(c.en) ? c.en : [0, 0], claves: {}});
                }
                const h = colgadas.get(clave);
                salto(h.claves, "opacidad", c.t, opBase, 0);
                salto(suelto.claves, "opacidad", c.t, 0, opBase);
                en_mano = clave;
            } else {
                if (!en_mano || !en_mano.startsWith(`${c.quien}|`)) { errores.push(`${c.donde}: "${c.quien}" no tiene "${nombre}" en t = ${c.t}`); continue; }
                salto(colgadas.get(en_mano).claves, "opacidad", c.t, 0, opBase);
                salto(suelto.claves, "opacidad", c.t, opBase, opBase);
                // queda donde se suelta (desde t)
                const [x, y] = pos(suelto, c.t);
                salto(suelto.claves, "x", c.t, c.en[0], x);
                salto(suelto.claves, "y", c.t, c.en[1], y);
                en_mano = null;
            }
        }
        // antes de la primera clave la copia colgada no se ve
        for (const h of colgadas.values()) { if (h.claves.opacidad[0][0] > 0) h.claves.opacidad.unshift([0, 0, "mantener"]); nuevos.push(h); }
    }
    const {pasos, ...resto} = def;
    return {def: {...resto, camara, objetos: [...objetos, ...nuevos]}, errores, avisos};
}
