// Seguimiento del sonido de un documento (planeacion_sonido.md). Modulo puro: lo usan la
// pestana Sonido del editor, la pagina del proyecto y reporte.mjs.
//
// Avisos, de mas a menos importante:
//   falta_subir     un clip o reaccion usa un sonido PENDIENTE (sin archivo)
//   sonido_borrado  un clip o reaccion apunta a un sonido que ya no existe
//   falta_sonido    el elemento esta marcado "lleva" y no tiene clips ni reacciones
//   sin_decidir     candidato sin marca ni sonido (eventos, efectos, objetos con fisica,
//                   la escena): se resuelve poniendole sonido o marcandolo "no_lleva"
import {referencias} from "./Pista";

export const NIVELES = {
    falta_subir: {orden: 0, etiqueta: "Falta subir", color: "danger"},
    sonido_borrado: {orden: 1, etiqueta: "Sonido borrado", color: "danger"},
    falta_sonido: {orden: 2, etiqueta: "Falta sonido", color: "warning"},
    sin_decidir: {orden: 3, etiqueta: "Sin decidir", color: "secondary"},
};

const lista = (x) => (Array.isArray(x) ? x : []);
const tieneFisica = (g) => g.fisica && (g.fisica.modo === "rigido" || g.fisica.modo === "desarmar");

// Elementos que pueden llevar sonido: [{tipo, nombre, marca, tiene (bool), candidato (bool)}]
export function elementos({escena = {}, eventos = [], grupos = []}, {esEscena = true} = {}) {
    const r = [];
    if (esEscena) r.push({tipo: "escena", nombre: "Escena", marca: escena.sonido_marca || null,
        tiene: lista(escena.sonidos).length > 0, candidato: true});
    for (const e of lista(eventos)) {
        r.push({tipo: "evento", nombre: e.nombre, marca: e.sonido_marca || null, tiene: lista(e.sonidos).length > 0, candidato: true});
    }
    for (const g of lista(grupos)) {
        if (g._virtual || g.nombre === "default" || (g.clases || []).includes("camara")) continue;
        const son = g.sonidos || {};
        const tiene = lista(son.clips).length > 0 || Object.values(son.reacciones || {}).some((x) => x && x.sonido);
        const candidato = !!g.efecto || tieneFisica(g);
        if (!candidato && !tiene && !g.sonido_marca) continue;
        r.push({tipo: g.efecto ? "efecto" : "objeto", nombre: g.nombre, marca: g.sonido_marca || null, tiene, candidato});
    }
    return r;
}

// sonidos: Map(id -> {nombre, estado}) o lista de {_id, nombre, estado}
export function seguimiento(doc, sonidos, opciones = {}) {
    const mapa = sonidos instanceof Map ? sonidos : new Map(lista(sonidos).map((s) => [String(s._id), s]));
    const avisos = [];
    // referencias a sonidos pendientes o borrados (un aviso por sonido, con donde se usa)
    const porSonido = new Map();
    for (const ref of referencias(doc)) {
        if (!porSonido.has(ref.sonido)) porSonido.set(ref.sonido, []);
        porSonido.get(ref.sonido).push(ref.donde);
    }
    for (const [id, donde] of porSonido) {
        const s = mapa.get(id);
        if (!s) avisos.push({nivel: "sonido_borrado", sonido: id, donde, mensaje: `Un sonido que ya no existe se usa en ${donde.length} lugar(es)`});
        else if (s.estado !== "listo") avisos.push({nivel: "falta_subir", sonido: id, nombre_sonido: s.nombre, donde,
            mensaje: `Falta subir el archivo de "${s.nombre}" (se usa en ${donde.length} lugar(es))`});
    }
    for (const el of elementos(doc, opciones)) {
        if (el.marca === "lleva" && !el.tiene) avisos.push({nivel: "falta_sonido", elemento: el, mensaje: `"${el.nombre}" está marcado con sonido pero todavía no tiene ninguno`});
        else if (!el.marca && !el.tiene && el.candidato) avisos.push({nivel: "sin_decidir", elemento: el, mensaje: `¿"${el.nombre}" lleva sonido?`});
    }
    avisos.sort((a, b) => NIVELES[a.nivel].orden - NIVELES[b.nivel].orden);
    const resumen = Object.fromEntries(Object.keys(NIVELES).map((k) => [k, avisos.filter((a) => a.nivel === k).length]));
    return {avisos, resumen, pendientes: resumen.falta_subir + resumen.sonido_borrado + resumen.falta_sonido};
}
