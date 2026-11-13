import React, {useEffect, useRef, useState} from "react";
import {dibujarMiniatura} from "../../../Clases/EditorAnimacion/Miniatura";

// Panel "Objetos" (Fase 3): lista de los objetos de la escena -- o de las partes del
// objeto en el que se "entro" -- con miniatura, visibilidad, bloqueo, orden de capa
// y nombre editable. Clic = seleccionar; doble clic = entrar a editar sus partes.
// Lee el estado del editor con un sondeo liviano (cambia desde el lienzo).

function Miniatura({grupos}) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) dibujarMiniatura(ref.current, grupos, 3);
    }, [grupos]);
    return <canvas ref={ref} width={44} height={32} className="ed-obj-mini"/>;
}

export default function PanelObjetosEscena({refLienzo, ruta, seleccion}) {
    const [items, setItems] = useState([]);
    const [editando, setEditando] = useState(null);   // nombre que se esta renombrando
    const [texto, setTexto] = useState("");
    const [error, setError] = useState("");
    const firma = useRef("");

    const ev = () => refLienzo.current.eventos_;
    const control = () => refLienzo.current.control_objetos;

    useEffect(() => {
        const leer = () => {
            const e = ev();
            const contexto = ruta.length ? ruta[ruta.length - 1] : "root";
            const originales = e.gestion_grupos_originales.grupos_figuras;
            const nombres = e.objetosEscena(contexto).slice().reverse();   // arriba = adelante
            const lista = nombres.map((n) => {
                // sub-arbol con su raiz como raiz (para la miniatura)
                const sub = e.subarbol(n, originales).map((g) => (g.nombre === n ? {...g, nodo_padre: "root"} : g));
                const g = e.gestion_grupos_originales.getGrupo(n);
                return {
                    nombre: n,
                    visible: e.esVisible(n),
                    bloqueado: e.estaBloqueado(n),
                    partes: e.objetosEscena(n).length,
                    grupos: sub,
                    // Fase 6: instancia por referencia (su dibujo viene de otro proyecto)
                    instancia: g && g.instancia && g.instancia.id_eventos
                        ? `${(e.infoAsset(g.instancia.id_eventos) || {}).nombre || "asset"} · ${g.instancia.evento || "EventoGeneral"}`
                        : null,
                };
            });
            // solo re-renderizar si algo cambio (la miniatura se redibuja con sus grupos)
            const f = JSON.stringify(lista.map((x) => [x.nombre, x.visible, x.bloqueado, x.partes, x.instancia,
                x.grupos.map((g) => [g.nombre, g.cx, g.cy, g.visible, (g.lista_figuras || []).length])]));
            if (f !== firma.current) {
                firma.current = f;
                setItems(lista);
            }
        };
        leer();
        const id = setInterval(leer, 400);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ruta]);

    const confirmarNombre = (viejo) => {
        const err = ev().renombrarObjeto(viejo, texto);
        if (err) { setError(err); return; }
        setError("");
        setEditando(null);
        if (seleccion.includes(viejo)) control().seleccionar(seleccion.map((n) => (n === viejo ? texto.trim() : n)));
        firma.current = "";
    };

    const nivelActual = ruta.length;

    return (
        <div className="d-flex flex-column h-100">
            {/* migas: Escena › perro › cabeza */}
            <div className="ed-migas px-2 py-1 small">
                <button className={`btn btn-link btn-sm p-0 ${nivelActual === 0 ? "fw-semibold text-body" : ""}`}
                        onClick={() => control().irANivel(0)}>Escena</button>
                {ruta.map((n, i) => (
                    <span key={n}>
                        <i className="bi bi-chevron-right mx-1 text-body-secondary"/>
                        <button className={`btn btn-link btn-sm p-0 ${i === nivelActual - 1 ? "fw-semibold text-body" : ""}`}
                                onClick={() => control().irANivel(i + 1)}>{n}</button>
                    </span>
                ))}
            </div>

            {items.length === 0 && (
                <div className="p-3 small text-body-secondary">
                    {nivelActual ? "Este objeto no tiene partes con dibujo." : "La escena no tiene objetos. Agrégalos desde la Biblioteca."}
                </div>
            )}

            <ul className="list-unstyled mb-0 flex-grow-1 overflow-auto">
                {items.map((it, idx) => {
                    const sel = seleccion.includes(it.nombre);
                    return (
                        <li key={it.nombre}
                            className={`ed-obj-fila ${sel ? "seleccionada" : ""} ${it.visible ? "" : "oculta"}`}
                            onClick={(e) => {
                                if (editando) return;
                                control().seleccionar(e.shiftKey
                                    ? (sel ? seleccion.filter((n) => n !== it.nombre) : [...seleccion, it.nombre])
                                    : [it.nombre]);
                            }}
                            onDoubleClick={() => { if (it.partes && !it.instancia) control().entrar(it.nombre); }}
                            title={it.instancia ? `Instancia de ${it.instancia}` : it.partes ? "Doble clic para editar sus partes" : it.nombre}>
                            <Miniatura grupos={it.grupos}/>
                            <div className="flex-grow-1 text-truncate">
                                {editando === it.nombre ? (
                                    <input className="form-control form-control-sm" autoFocus value={texto}
                                           onClick={(e) => e.stopPropagation()}
                                           onChange={(e) => setTexto(e.target.value)}
                                           onKeyDown={(e) => {
                                               if (e.key === "Enter") confirmarNombre(it.nombre);
                                               if (e.key === "Escape") { setEditando(null); setError(""); }
                                           }}
                                           onBlur={() => confirmarNombre(it.nombre)}/>
                                ) : (
                                    <>
                                        <span className="ed-obj-nombre">
                                            {it.instancia && <i className="bi bi-link-45deg me-1 text-info" title="Instancia por referencia"/>}
                                            {it.nombre}
                                        </span>
                                        {it.instancia
                                            ? <span className="ed-obj-partes">{it.instancia}</span>
                                            : it.partes > 0 && <span className="ed-obj-partes">{it.partes} partes</span>}
                                    </>
                                )}
                            </div>
                            <div className="ed-obj-acciones" onClick={(e) => e.stopPropagation()}>
                                <button title="Renombrar" onClick={() => { setEditando(it.nombre); setTexto(it.nombre); setError(""); }}>
                                    <i className="bi bi-pencil"/>
                                </button>
                                <button title="Subir (más adelante)" disabled={idx === 0}
                                        onClick={() => { ev().moverCapa(it.nombre, +1); firma.current = ""; }}>
                                    <i className="bi bi-chevron-up"/>
                                </button>
                                <button title="Bajar (más atrás)" disabled={idx === items.length - 1}
                                        onClick={() => { ev().moverCapa(it.nombre, -1); firma.current = ""; }}>
                                    <i className="bi bi-chevron-down"/>
                                </button>
                                <button title={it.visible ? "Ocultar" : "Mostrar"}
                                        onClick={() => { ev().fijarVisible(it.nombre, !it.visible); firma.current = ""; }}>
                                    <i className={`bi ${it.visible ? "bi-eye" : "bi-eye-slash"}`}/>
                                </button>
                                <button title={it.bloqueado ? "Desbloquear" : "Bloquear (no se puede seleccionar en el lienzo)"}
                                        className={it.bloqueado ? "activo" : ""}
                                        onClick={() => { ev().fijarBloqueado(it.nombre, !it.bloqueado); firma.current = ""; }}>
                                    <i className={`bi ${it.bloqueado ? "bi-lock-fill" : "bi-unlock"}`}/>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {error && <div className="alert alert-danger py-1 px-2 m-2 small">{error}</div>}
            <div className="px-2 py-1 small text-body-secondary border-top">
                Clic: seleccionar · Doble clic: entrar a sus partes · Esc en el lienzo: salir
            </div>
        </div>
    );
}
