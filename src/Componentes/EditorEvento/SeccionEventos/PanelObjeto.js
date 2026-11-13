import React, {useEffect, useRef, useState} from "react";
import {normalizarTransformacion} from "../../../Clases/EditorAnimacion/TransformacionInstancia";

// Inspector -> Objeto (Fase 2): propiedades del objeto seleccionado en el lienzo:
// posicion, rotacion, escala, espejo y capa, mas duplicar / borrar.
// Los valores se leen del editor con un sondeo liviano (asi siguen a las manijas
// mientras se arrastra) salvo el campo que se esta escribiendo.
export default function PanelObjeto({refLienzo, seleccion}) {
    const [valores, setValores] = useState(null);
    const enfocado = useRef(null);
    const ev = () => refLienzo.current.eventos_;
    const control = () => refLienzo.current.control_objetos;
    const unico = seleccion.length === 1 ? seleccion[0] : null;

    const leer = () => {
        if (!unico) return null;
        const g = ev().gestion_grupos_originales.getGrupo(unico);
        if (!g) return null;
        const t = normalizarTransformacion(g.transformacion) || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0};
        return {x: g.cx, y: g.cy, rotacion: t.rotacion, escala_x: t.escala_x, escala_y: t.escala_y,
            ancla_x: t.ancla_x, ancla_y: t.ancla_y, capa: g.capa, tiene_t: !!g.transformacion};
    };

    useEffect(() => {
        setValores(leer());
        const id = setInterval(() => {
            const nuevos = leer();
            setValores((prev) => {
                if (!nuevos || !prev) return nuevos;
                // no pisar el campo que el usuario esta escribiendo
                return enfocado.current ? {...nuevos, [enfocado.current]: prev[enfocado.current]} : nuevos;
            });
        }, 200);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unico]);

    if (!seleccion.length) return null;

    const aplicar = (campo, texto) => {
        const v = parseFloat(texto);
        if (!Number.isFinite(v) || !unico) return;
        if (campo === "x" || campo === "y") {
            const p = ev().posicionObjeto(unico);
            ev().fijarPosicionObjeto(unico, campo === "x" ? v : p.x, campo === "y" ? v : p.y);
        } else if (campo === "capa") {
            for (const g of [ev().gestion_grupos_originales.getGrupo(unico), ev().gestion_grupos.getGrupo(unico)]) {
                if (g) g.capa = Math.round(v);
            }
        } else {
            ev().cambiarTransformacion(unico, {[campo]: v});
        }
    };

    const espejo = (eje) => {
        for (const n of seleccion) {
            const t = ev().asegurarTransformacion(n);
            ev().cambiarTransformacion(n, eje === "x" ? {escala_x: -t.escala_x} : {escala_y: -t.escala_y});
        }
    };
    const restablecer = () => seleccion.forEach((n) => ev().cambiarTransformacion(n, {rotacion: 0, escala_x: 1, escala_y: 1}));
    const duplicar = () => {
        const copias = seleccion.map((n) => ev().duplicarObjeto(n)).filter(Boolean);
        if (copias.length) control().seleccionar(copias);
    };
    const borrar = () => {
        seleccion.forEach((n) => ev().eliminarObjeto(n));
        control().seleccionar([]);
    };

    const campo = (nombre, etiqueta, paso = 1, sufijo = "") => (
        <div className="col-6">
            <label className="form-label small mb-0 text-body-secondary">{etiqueta}</label>
            <div className="input-group input-group-sm">
                <input type="number" step={paso} className="form-control form-control-sm"
                       value={valores ? (valores[nombre] ?? "") : ""}
                       onFocus={() => { enfocado.current = nombre; }}
                       onBlur={(e) => { enfocado.current = null; aplicar(nombre, e.target.value); }}
                       onChange={(e) => {
                           setValores((v) => ({...v, [nombre]: e.target.value}));
                           aplicar(nombre, e.target.value);
                       }}/>
                {sufijo && <span className="input-group-text">{sufijo}</span>}
            </div>
        </div>
    );

    return (
        <div className="p-2 d-flex flex-column gap-2">
            <div className="small">
                <span className="text-body-secondary text-uppercase fw-semibold" style={{fontSize: "0.65rem"}}>
                    {seleccion.length === 1 ? "Objeto" : "Objetos"}
                </span>
                <div className="fw-semibold text-truncate">
                    {unico || `${seleccion.length} seleccionados`}
                </div>
            </div>

            {unico && valores && (
                <div className="ed-objeto-campos">
                    <div className="row g-2">
                        {campo("x", "Posición X")}
                        {campo("y", "Posición Y")}
                        {campo("rotacion", "Rotación", 1, "°")}
                        {campo("capa", "Capa")}
                        {campo("escala_x", "Escala X", 0.05)}
                        {campo("escala_y", "Escala Y", 0.05)}
                        {campo("ancla_x", "Ancla X")}
                        {campo("ancla_y", "Ancla Y")}
                    </div>
                </div>
            )}

            <div className="d-flex flex-wrap gap-1">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => espejo("x")} title="Reflejar horizontalmente">
                    <i className="bi bi-symmetry-vertical me-1"/>Espejo H
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => espejo("y")} title="Reflejar verticalmente">
                    <i className="bi bi-symmetry-horizontal me-1"/>Espejo V
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={restablecer} title="Rotación 0, escala 1">
                    <i className="bi bi-arrow-counterclockwise me-1"/>Restablecer
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={duplicar} title="Duplicar (Ctrl+D)">
                    <i className="bi bi-copy me-1"/>Duplicar
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={borrar} title="Borrar (Supr)">
                    <i className="bi bi-trash me-1"/>Borrar
                </button>
            </div>

            <div className="small text-body-secondary">
                Arrastra el objeto para moverlo; las manijas de las esquinas escalan (Shift: libre),
                las de los lados escalan en un eje y el círculo de arriba rota (Shift: de a 15°).
                Flechas: mover · Supr: borrar · Ctrl+D: duplicar · Esc: deseleccionar.
                <br/>Recuerda <strong>Subir</strong> para guardar.
            </div>
            <button className="btn btn-sm btn-link p-0 text-start" onClick={() => control().seleccionar([])}>
                <i className="bi bi-arrow-left me-1"/>Volver a las propiedades del evento
            </button>
        </div>
    );
}
