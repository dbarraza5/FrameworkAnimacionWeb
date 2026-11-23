// Ver un capitulo de corrido (con sonido) y exportarlo como un solo MP4
// (documento/planeacion_zorro_cuervo.md, fase 5). Lo abre HistoriaEscenas.js desde un capitulo.
import {useEffect, useRef, useState} from "react";
import {prepararEscena, planCapitulo, mezclaCapitulo, cuadroCapitulo, exportarCapitulo, escenaEn, tamanoCapitulo} from "../../Clases/Autoria/Capitulo";
import {mp4Disponible} from "../../Clases/Autoria/Mp4";
import {crearEstimador, textoEstimacion, formatoDuracion} from "../../Clases/Autoria/Estimador";
import {MotorAudio} from "../../Clases/Sonido/MotorAudio";
import {listarSonidos, cargarArchivo} from "../Sonido/apiSonido";

const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

function ModalCapitulo({titulo, escenas, id_proyecto, peticion, onCerrar}) {
    const [estado, setEstado] = useState("cargando");     // cargando | listo | error
    const [carga, setCarga] = useState("");
    const [plan, setPlan] = useState(null);
    const [tiempo, setTiempo] = useState(800);            // ms de la vista previa (pasado el fundido de entrada)
    const [reproduciendo, setReproduciendo] = useState(false);
    const [opc, setOpc] = useState({ancho: 1080, fps: 30, fundido: 300, sonido: true});
    const [progreso, setProgreso] = useState(null);       // 0..1 mientras exporta
    const [mensaje, setMensaje] = useState("");
    const [estimacion, setEstimacion] = useState(null);   // {transcurrido, restante} mientras exporta
    const refCanvas = useRef(null);
    const refAudio = useRef(null);
    const refPista = useRef(null);                         // mezcla de todo el capitulo (se hace una vez)
    const refRepro = useRef(null);                         // {fuente, ctx, inicio, desde, raf}
    const cancelar = useRef(false);

    // cargar las escenas (y sus assets) y los sonidos del proyecto
    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const audio = new MotorAudio({cargar: cargarArchivo});
                audio.ponerSonidos(await listarSonidos(id_proyecto));
                refAudio.current = audio;
                const cargador = (id, version) => peticion("get", version ? "/api/evento/version/" + version : "/api/evento/id/" + id);
                const motores = [];
                for (const [i, e] of escenas.entries()) {
                    if (cancelado) return;
                    setCarga(`Preparando escena ${i + 1} de ${escenas.length}: ${e.nombre}`);
                    motores.push(await prepararEscena(await peticion("get", "/api/evento/id/" + e._id), cargador));
                }
                if (cancelado) return;
                setPlan(planCapitulo(motores));
                setCarga("");
                setEstado("listo");
            } catch (err) {
                console.log("capitulo", err);
                if (!cancelado) { setEstado("error"); setCarga((err.response && err.response.data && err.response.data.error) || err.message || String(err)); }
            }
        })();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // dibujar la vista previa cuando cambia el instante (y al terminar de cargar)
    useEffect(() => {
        if (!plan || !refCanvas.current) return;
        const c = refCanvas.current;
        cuadroCapitulo(plan, c.getContext("2d"), c.width, c.height, tiempo, {fundido: opc.fundido});
    }, [plan, tiempo, opc.fundido]);

    const buffer = (id) => refAudio.current.bufferListo(id);
    const pista = async () => {
        if (!refPista.current) refPista.current = mezclaCapitulo(plan, buffer, {alProgresar: (p) => setCarga(`Mezclando el sonido… ${Math.round(p * 100)}%`)});
        const p = await refPista.current;
        setCarga("");
        return p;
    };

    const detener = () => {
        const r = refRepro.current;
        if (!r) return;
        cancelAnimationFrame(r.raf);
        try { r.fuente && r.fuente.stop(); } catch (e) { /* ya termino */ }
        refRepro.current = null;
        setReproduciendo(false);
    };
    useEffect(() => () => detener(), []);   // al cerrar

    // reproduccion en tiempo real: el reloj es el del audio (si hay); los cuadros que no
    // alcanzan a dibujarse se saltan, pero siempre en sincronia con el sonido
    const reproducir = async () => {
        if (reproduciendo) { detener(); return; }
        const desde = tiempo >= plan.total - 50 ? 0 : tiempo;
        const p = opc.sonido ? await pista() : null;
        const C = window.AudioContext || window.webkitAudioContext;
        const ctx = new C();
        let fuente = null;
        if (p) { fuente = ctx.createBufferSource(); fuente.buffer = p; fuente.connect(ctx.destination); fuente.start(0, desde / 1000); }
        const r = {fuente, ctx, inicio: ctx.currentTime, desde, raf: 0};
        refRepro.current = r;
        setReproduciendo(true);
        const cuadro = () => {
            if (refRepro.current !== r) return;
            const t = r.desde + (ctx.currentTime - r.inicio) * 1000;
            if (t >= plan.total) { setTiempo(plan.total - 1); detener(); ctx.close(); return; }
            setTiempo(t);
            r.raf = requestAnimationFrame(cuadro);
        };
        r.raf = requestAnimationFrame(cuadro);
    };

    const descargar = (blob, archivo) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = archivo;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    const exportar = async () => {
        detener();
        cancelar.current = false;
        setMensaje("");
        setProgreso(0);
        const est = crearEstimador();
        setEstimacion(est.actualizar(0));
        try {
            const p = opc.sonido ? await pista() : null;
            const r = await exportarCapitulo({plan, ancho: opc.ancho, fps: opc.fps, fundido: opc.fundido, pista: p,
                progreso: (x, donde) => { setProgreso(x); setEstimacion(est.actualizar(x)); if (donde) setCarga(`Escena ${donde.i + 1} de ${plan.escenas.length}: ${donde.e.nombre}`); },
                cancelado: () => cancelar.current});
            if (!r) { setMensaje("Cancelado."); return; }
            const nombre = (titulo || "capitulo").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_");
            descargar(r.blob, `${nombre}.mp4`);
            setMensaje(`Listo en ${formatoDuracion(est.actualizar(1).transcurrido)}: ${nombre}.mp4, ${r.w}×${r.h}, ${seg(plan.total)} a ${opc.fps} cuadros por segundo${p ? ", con sonido" : ""} (${(r.blob.size / 1048576).toFixed(1)} MB).`);
        } catch (e) {
            setMensaje("No se pudo exportar: " + (e && e.message ? e.message : e));
        } finally {
            setProgreso(null);
            setEstimacion(null);
            setCarga("");
        }
    };

    const exportando = progreso !== null;
    const actual = plan ? escenaEn(plan, tiempo) : null;
    const tam = plan ? tamanoCapitulo(plan, opc.ancho) : null;
    const vertical = tam && tam.h > tam.w;
    const vista = vertical ? {w: 270, h: Math.round(270 * tam.h / tam.w)} : {w: 480, h: tam ? Math.round(480 * tam.h / tam.w) : 270};
    const fila = {display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8};

    return (
        <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: 16}}
             onClick={(e) => { if (e.target === e.currentTarget && !exportando) { detener(); onCerrar(); } }}>
            <div className="bg-body rounded shadow p-3" style={{maxWidth: 820, width: "100%", maxHeight: "95vh", overflow: "auto"}}>
                <div className="d-flex align-items-center mb-2">
                    <h5 className="m-0 flex-grow-1"><i className="bi bi-collection-play me-2"/>{titulo}</h5>
                    <button className="btn-close" disabled={exportando} onClick={() => { detener(); onCerrar(); }}/>
                </div>
                {estado === "cargando" && <div className="d-flex align-items-center gap-2 my-4"><div className="spinner-border spinner-border-sm"/>{carga}</div>}
                {estado === "error" && <div className="alert alert-danger">No se pudo preparar el capítulo: {carga}</div>}
                {estado === "listo" && plan && (
                    <div style={{display: "grid", gridTemplateColumns: `${vista.w}px minmax(240px, 1fr)`, gap: 16}}>
                        <div>
                            <canvas ref={refCanvas} width={vista.w * 2} height={vista.h * 2} className="rounded border d-block bg-dark"
                                    style={{width: vista.w, height: vista.h}}/>
                            <input type="range" className="form-range mt-2" min={0} max={plan.total - 1} step={10} value={Math.round(tiempo)} disabled={exportando}
                                   onChange={(e) => { detener(); setTiempo(parseFloat(e.target.value)); }} style={{width: vista.w}}/>
                            <div className="d-flex align-items-center gap-2" style={{width: vista.w}}>
                                <button className="btn btn-sm btn-primary" disabled={exportando} onClick={reproducir}>
                                    <i className={"bi " + (reproduciendo ? "bi-pause-fill" : "bi-play-fill")}/>
                                </button>
                                <small className="text-muted">{seg(tiempo)} / {seg(plan.total)}</small>
                            </div>
                            <small className="text-muted d-block text-truncate" style={{width: vista.w}}>
                                {actual ? `Escena ${actual.i + 1}: ${actual.e.nombre}` : ""}
                            </small>
                        </div>
                        <div>
                            <ol className="small ps-3">
                                {plan.escenas.map((e, i) => (
                                    <li key={i}><button type="button" className={"btn btn-link btn-sm p-0 text-start " + (actual && actual.i === i ? "fw-bold" : "")}
                                                        disabled={exportando} onClick={() => { detener(); setTiempo(e.inicio); }}>{e.nombre}</button>
                                        <span className="text-muted"> · {seg(e.dur)}</span></li>
                                ))}
                            </ol>
                            <div className="small" style={fila}>
                                <div><label className="form-label mb-0">Ancho</label>
                                    <select className="form-select form-select-sm" value={opc.ancho} disabled={exportando} onChange={(e) => setOpc({...opc, ancho: parseInt(e.target.value, 10)})}>
                                        {[540, 720, 1080].map((a) => { const t = tamanoCapitulo(plan, a); return <option key={a} value={a}>{t.w}×{t.h}</option>; })}
                                    </select></div>
                                <div><label className="form-label mb-0">Cuadros por segundo</label>
                                    <select className="form-select form-select-sm" value={opc.fps} disabled={exportando} onChange={(e) => setOpc({...opc, fps: parseInt(e.target.value, 10)})}>
                                        {[24, 30].map((f) => <option key={f} value={f}>{f}</option>)}
                                    </select></div>
                                <div><label className="form-label mb-0">Entre escenas</label>
                                    <select className="form-select form-select-sm" value={opc.fundido} disabled={exportando} onChange={(e) => setOpc({...opc, fundido: parseInt(e.target.value, 10)})}>
                                        <option value={0}>Corte</option><option value={300}>Fundido corto</option><option value={600}>Fundido largo</option>
                                    </select></div>
                                <div className="d-flex align-items-end">
                                    <div className="form-check mb-1">
                                        <input className="form-check-input" type="checkbox" id="cap-sonido" checked={opc.sonido} disabled={exportando}
                                               onChange={(e) => { detener(); setOpc({...opc, sonido: e.target.checked}); }}/>
                                        <label className="form-check-label" htmlFor="cap-sonido">Con sonido</label>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex gap-2 mt-3">
                                {!exportando
                                    ? <button className="btn btn-success btn-sm" disabled={!mp4Disponible()} onClick={exportar}
                                              title={mp4Disponible() ? "Un solo video con todas las escenas" : "Este navegador no codifica MP4 (probar con Chrome o Edge)"}>
                                        <i className="bi bi-download me-1"/>Exportar MP4</button>
                                    : <button className="btn btn-outline-danger btn-sm" onClick={() => { cancelar.current = true; }}>Cancelar</button>}
                            </div>
                            {exportando && <div className="progress mt-2" style={{height: 8}}><div className="progress-bar" style={{width: `${Math.round(progreso * 100)}%`}}/></div>}
                            {exportando && <div className="small mt-1"><b>{Math.round(progreso * 100)}%</b> · {textoEstimacion(estimacion)}</div>}
                            {carga && <div className="small text-muted mt-1">{carga}</div>}
                            {mensaje && <div className="small mt-2">{mensaje}</div>}
                            <p className="small text-muted mt-3 mb-0">
                                La vista previa salta cuadros si la computadora no llega a dibujarlos a tiempo; el MP4 sale con todos.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModalCapitulo;
