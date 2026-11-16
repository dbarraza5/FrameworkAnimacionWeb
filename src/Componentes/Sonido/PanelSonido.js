import React, {useEffect, useMemo, useState} from "react";
import BibliotecaSonidos from "./BibliotecaSonidos";
import {ETIQUETA_REACCION, MARCAS, idClip, iniciosEventos} from "../../Clases/Sonido/Pista";
import {NIVELES, seguimiento} from "../../Clases/Sonido/Seguimiento";

// Pestana "Sonido" del editor de eventos (planeacion_sonido.md):
//  - el sonido del elemento elegido (escena, evento, efecto u objeto): marca lleva / no lleva,
//    clips, reacciones a la fisica y, en instancias, el ajuste del sonido heredado;
//  - el seguimiento de lo que falta en esta escena;
//  - la biblioteca de sonidos del proyecto.
// Todo se edita sobre los datos del motor (se guarda con "Subir" y entra al historial).

const REACCIONES_POR_EFECTO = {explosion: ["al_detonar"], disparo: ["al_disparar", "al_impactar"]};
const REACCIONES_OBJETO = ["al_soltarse", "al_tocar_suelo"];
const tieneFisica = (g) => g.fisica && (g.fisica.modo === "rigido" || g.fisica.modo === "desarmar");

function elementosDe(m) {
    if (!m) return [];
    if (!m.escena) m.escena = {};
    const r = [{clave: "escena", tipo: "escena", nombre: "Escena (música, ambiente)", obj: m.escena, clips: true}];
    for (const e of m.eventos.map((x) => x.evento)) r.push({clave: "ev:" + e.nombre, tipo: "evento", nombre: `Evento · ${e.nombre}`, obj: e, clips: true});
    for (const g of m.gestion_grupos_originales.grupos_figuras) {
        if (g._virtual || g.nodo_padre !== "root" || g.nombre === "default" || (g.clases || []).includes("camara")) continue;
        const reacciones = g.efecto ? (REACCIONES_POR_EFECTO[g.efecto.tipo] || []) : (tieneFisica(g) || g.instancia ? REACCIONES_OBJETO : []);
        r.push({clave: "g:" + g.nombre, tipo: g.efecto ? "efecto" : "objeto", nombre: `${g.efecto ? "Efecto" : g.instancia ? "Instancia" : "Objeto"} · ${g.nombre}`,
            obj: g, clips: true, reacciones, grupo: true});
    }
    r.push({clave: "asset", tipo: "asset", nombre: "Reacciones que heredan las instancias de este asset", obj: m.escena, reacciones: REACCIONES_OBJETO, asset: true});
    return r;
}

// clips y reacciones del elemento (crea los contenedores al escribir)
const clipsDe = (el) => (el.grupo ? (el.obj.sonidos && el.obj.sonidos.clips) : el.obj.sonidos) || [];
function ponerClips(el, lista) {
    if (el.grupo) { el.obj.sonidos = {...(el.obj.sonidos || {}), clips: lista}; if (!lista.length) delete el.obj.sonidos.clips; }
    else if (lista.length) el.obj.sonidos = lista; else delete el.obj.sonidos;
}
const reaccionesDe = (el) => (el.asset ? el.obj.reacciones : el.obj.sonidos && el.obj.sonidos.reacciones) || {};
function ponerReaccion(el, clave, valor) {
    const actual = {...reaccionesDe(el)};
    if (valor) actual[clave] = valor; else delete actual[clave];
    if (el.asset) { if (Object.keys(actual).length) el.obj.reacciones = actual; else delete el.obj.reacciones; }
    else { el.obj.sonidos = {...(el.obj.sonidos || {}), reacciones: actual}; if (!Object.keys(actual).length) delete el.obj.sonidos.reacciones; }
}

function SelectorSonido({sonidos, valor, onCambio, vacio = "— elegir —"}) {
    return (
        <select className="form-select form-select-sm" value={valor || ""} onChange={(e) => onCambio(e.target.value || null)}>
            <option value="">{vacio}</option>
            {sonidos.map((s) => <option key={s._id} value={s._id}>{s.nombre}{s.estado !== "listo" ? " (pendiente)" : ""}</option>)}
            {valor && !sonidos.some((s) => s._id === valor) && <option value={valor}>(sonido borrado)</option>}
        </select>
    );
}

export default function PanelSonido({refEvento, idProyecto, sonidos, recargarSonidos, objetosSeleccionados, audio, activo}) {
    const [tick, setTick] = useState(0);
    const [clave, setClave] = useState("escena");
    const [silencio, setSilencio] = useState(false);
    const [destacar, setDestacar] = useState(null);
    const m = refEvento.current && refEvento.current.edicion;
    const cambio = () => setTick((x) => x + 1);

    // al seleccionar un objeto en el lienzo, mostrar su sonido
    const sel = (objetosSeleccionados || [])[0];
    useEffect(() => { if (sel && activo) setClave("g:" + (typeof sel === "string" ? sel : sel.nombre)); }, [sel, activo]);
    // refresco periodico mientras la pestana esta abierta (otros paneles cambian la escena)
    useEffect(() => { if (!activo) return; const id = setInterval(cambio, 1500); return () => clearInterval(id); }, [activo]);

    const elementos = useMemo(() => elementosDe(m), [m, tick]);  // eslint-disable-line react-hooks/exhaustive-deps
    const el = elementos.find((e) => e.clave === clave) || elementos[0];
    const segui = useMemo(() => {
        if (!m) return null;
        const grupos = m.gestion_grupos_originales.grupos_figuras;
        const esEscena = grupos.some((g) => (g.instancia && g.instancia.id_eventos) || g.efecto) || !!(m.escena && m.escena.orden_profundidad);
        return seguimiento({escena: m.escena || {}, eventos: m.eventos.map((x) => x.evento), grupos}, sonidos, {esEscena});
    }, [m, sonidos, tick]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (!m) return null;
    const t_ahora = Math.round((m._t_escena || 0) * 1000);
    const inicioEl = el && el.tipo === "evento" ? (iniciosEventos(m.eventos.map((x) => x.evento)).get(el.obj.nombre) || 0) : 0;
    const marca = el && !el.asset ? el.obj.sonido_marca || "" : null;

    const ponerMarca = (v) => { if (v) el.obj.sonido_marca = v; else delete el.obj.sonido_marca; cambio(); };
    const clips = el && el.clips ? clipsDe(el) : [];
    const editarClip = (i, cambios) => { const l = clips.map((c, k) => (k === i ? {...c, ...cambios} : c)); ponerClips(el, l); cambio(); };
    const agregarClip = () => {
        const primero = sonidos[0];
        ponerClips(el, [...clips, {id: idClip(), sonido: primero ? primero._id : null, t: Math.max(0, t_ahora - inicioEl), volumen: 1}]);
        if (!el.asset && !el.obj.sonido_marca) el.obj.sonido_marca = "lleva";
        cambio();
    };

    const irAviso = (a) => {
        if (a.elemento) {
            const k = a.elemento.tipo === "escena" ? "escena" : a.elemento.tipo === "evento" ? "ev:" + a.elemento.nombre : "g:" + a.elemento.nombre;
            setClave(k);
        } else if (a.donde && a.donde[0]) {
            const d = a.donde[0];
            setClave(d.tipo === "escena" ? "escena" : d.tipo === "evento" ? "ev:" + d.nombre : d.tipo === "asset" ? "asset" : "g:" + d.nombre);
            setDestacar(a.sonido);
        }
    };
    const marcarNoLleva = (a) => {
        const e = elementos.find((x) => x.clave === (a.elemento.tipo === "escena" ? "escena" : a.elemento.tipo === "evento" ? "ev:" + a.elemento.nombre : "g:" + a.elemento.nombre));
        if (e) { e.obj.sonido_marca = "no_lleva"; cambio(); }
    };

    return (
        <div className="p-2 d-flex flex-column gap-3 small" data-panel="sonido">
            <div className="d-flex align-items-center gap-2">
                <button className={`btn btn-sm ${silencio ? "btn-warning" : "btn-outline-secondary"}`}
                        title={silencio ? "Activar el sonido del editor" : "Silenciar el editor"}
                        onClick={() => { audio && audio.silenciar(!silencio); setSilencio(!silencio); }}>
                    <i className={`bi ${silencio ? "bi-volume-mute" : "bi-volume-up"}`}/>
                </button>
                <span className="text-body-secondary">El sonido sigue a la reproducción (▶) y a la línea de tiempo.</span>
            </div>

            {/* ---- elemento elegido ---- */}
            <section>
                <label className="form-label mb-1 fw-semibold">Sonido de</label>
                <select className="form-select form-select-sm mb-2" value={el ? el.clave : ""} onChange={(e) => setClave(e.target.value)}>
                    {elementos.map((e) => <option key={e.clave} value={e.clave}>{e.nombre}</option>)}
                </select>
                {el && !el.asset && (
                    <div className="btn-group btn-group-sm w-100 mb-2" role="group">
                        {[["", "Sin decidir"], ["lleva", MARCAS.lleva], ["no_lleva", MARCAS.no_lleva]].map(([v, t]) => (
                            <button key={v} type="button" className={`btn ${marca === v ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => ponerMarca(v)}>{t}</button>
                        ))}
                    </div>
                )}
                {el && el.clips && (
                    <div className="d-flex flex-column gap-1">
                        {clips.map((c, i) => (
                            <div key={c.id || i} className="border rounded p-1 d-flex flex-wrap gap-1 align-items-center" data-clip={c.id}>
                                <div style={{flex: "1 1 140px"}}><SelectorSonido sonidos={sonidos} valor={c.sonido} onCambio={(v) => editarClip(i, {sonido: v})}/></div>
                                <div className="input-group input-group-sm" style={{width: 96}} title={el.tipo === "evento" ? "Segundos desde el inicio del evento" : "Segundo de la escena"}>
                                    <span className="input-group-text px-1">t</span>
                                    <input type="number" step="0.1" min="0" className="form-control px-1" value={Math.round((c.t || 0) / 100) / 10}
                                           onChange={(e) => editarClip(i, {t: Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 1000))})}/>
                                </div>
                                <div className="input-group input-group-sm" style={{width: 90}} title="Volumen (1 = normal)">
                                    <span className="input-group-text px-1"><i className="bi bi-volume-down"/></span>
                                    <input type="number" step="0.1" min="0" max="3" className="form-control px-1" value={c.volumen ?? 1}
                                           onChange={(e) => editarClip(i, {volumen: Math.max(0, parseFloat(e.target.value) || 0)})}/>
                                </div>
                                <div className="form-check form-check-inline m-0" title="Repetir hasta el final del evento o de la escena">
                                    <input className="form-check-input" type="checkbox" checked={!!c.bucle} id={`bucle-${i}`} onChange={(e) => editarClip(i, {bucle: e.target.checked || undefined})}/>
                                    <label className="form-check-label" htmlFor={`bucle-${i}`}>bucle</label>
                                </div>
                                <button className="btn btn-sm btn-outline-secondary py-0" title="Llevar el clip al instante actual"
                                        onClick={() => editarClip(i, {t: Math.max(0, t_ahora - inicioEl)})}><i className="bi bi-crosshair"/></button>
                                <button className="btn btn-sm btn-outline-danger py-0" title="Quitar" onClick={() => { ponerClips(el, clips.filter((_, k) => k !== i)); cambio(); }}>
                                    <i className="bi bi-x-lg"/></button>
                            </div>
                        ))}
                        <button className="btn btn-sm btn-outline-primary" onClick={agregarClip} disabled={!sonidos.length}
                                title={sonidos.length ? "" : "Primero sube un sonido o crea uno pendiente (abajo)"}>
                            <i className="bi bi-plus-lg me-1"/>Clip en el instante actual ({(Math.max(0, t_ahora - inicioEl) / 1000).toFixed(1)} s)
                        </button>
                    </div>
                )}
                {el && el.reacciones && el.reacciones.length > 0 && (
                    <div className="mt-2">
                        <div className="fw-semibold mb-1">{el.asset ? "Reacciones (las heredan sus instancias)" : "Reacciones a la física"}</div>
                        {el.reacciones.map((k) => {
                            const rx = reaccionesDe(el)[k];
                            return (
                                <div key={k} className="d-flex gap-1 align-items-center mb-1" data-reaccion={k}>
                                    <span style={{width: 130}}>{ETIQUETA_REACCION[k]}</span>
                                    <div className="flex-grow-1"><SelectorSonido sonidos={sonidos} valor={rx && rx.sonido} vacio="— ninguno —"
                                        onCambio={(v) => { ponerReaccion(el, k, v ? {...(rx || {}), sonido: v} : null); if (v && !el.asset && !el.obj.sonido_marca) el.obj.sonido_marca = "lleva"; cambio(); }}/></div>
                                    {rx && <input type="number" step="0.1" min="0" className="form-control form-control-sm" style={{width: 60}} title="Volumen"
                                                  value={rx.volumen ?? 1} onChange={(e) => { ponerReaccion(el, k, {...rx, volumen: Math.max(0, parseFloat(e.target.value) || 0)}); cambio(); }}/>}
                                    {rx && k === "al_tocar_suelo" && <input type="number" min="0" className="form-control form-control-sm" style={{width: 56}}
                                        title="Cuántas piezas como máximo (0 = todas)" value={rx.max ?? 0}
                                        onChange={(e) => { ponerReaccion(el, k, {...rx, max: Math.max(0, parseInt(e.target.value, 10) || 0) || undefined}); cambio(); }}/>}
                                </div>
                            );
                        })}
                        {!el.asset && el.obj.instancia && <div className="text-body-secondary">Si no eliges nada, usa las del asset (si las tiene).</div>}
                    </div>
                )}
                {el && el.grupo && el.obj.instancia && (
                    <div className="mt-2 d-flex gap-2 align-items-center" data-audio-instancia>
                        <span className="fw-semibold">Sonido heredado del asset:</span>
                        <input type="number" step="0.1" min="0" className="form-control form-control-sm" style={{width: 64}} title="Volumen"
                               value={(el.obj.instancia.audio && el.obj.instancia.audio.volumen) ?? 1}
                               onChange={(e) => { el.obj.instancia.audio = {...(el.obj.instancia.audio || {}), volumen: Math.max(0, parseFloat(e.target.value) || 0)}; cambio(); }}/>
                        <div className="form-check m-0">
                            <input className="form-check-input" type="checkbox" id="silencio-inst" checked={!!(el.obj.instancia.audio && el.obj.instancia.audio.silencio)}
                                   onChange={(e) => { el.obj.instancia.audio = {...(el.obj.instancia.audio || {}), silencio: e.target.checked || undefined}; cambio(); }}/>
                            <label className="form-check-label" htmlFor="silencio-inst">silenciar</label>
                        </div>
                    </div>
                )}
            </section>

            {/* ---- seguimiento ---- */}
            {segui && (
                <section data-seguimiento>
                    <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                        Seguimiento
                        {Object.entries(segui.resumen).filter(([, n]) => n).map(([k, n]) => (
                            <span key={k} className={`badge text-bg-${NIVELES[k].color}`}>{NIVELES[k].etiqueta}: {n}</span>
                        ))}
                        {!segui.avisos.length && <span className="badge text-bg-success">Todo en orden</span>}
                    </div>
                    <div className="d-flex flex-column gap-1" style={{maxHeight: 220, overflow: "auto"}}>
                        {segui.avisos.map((a, i) => (
                            <div key={i} className="d-flex align-items-center gap-1 border rounded px-2 py-1" data-aviso={a.nivel}>
                                <span className={`badge text-bg-${NIVELES[a.nivel].color}`}>{NIVELES[a.nivel].etiqueta}</span>
                                <button className="btn btn-link btn-sm p-0 text-start flex-grow-1 text-truncate" onClick={() => irAviso(a)} title={a.mensaje}>{a.mensaje}</button>
                                {a.nivel === "sin_decidir" && <button className="btn btn-sm btn-outline-secondary py-0 text-nowrap" onClick={() => marcarNoLleva(a)}>No lleva</button>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ---- biblioteca ---- */}
            <section>
                <div className="fw-semibold mb-1">Sonidos del proyecto</div>
                <BibliotecaSonidos idProyecto={idProyecto} sonidos={sonidos} recargar={recargarSonidos} destacar={destacar}/>
            </section>
        </div>
    );
}
