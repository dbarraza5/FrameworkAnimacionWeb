import React, {useRef, useState} from "react";
import {GIFEncoder, quantize, applyPalette} from "gifenc";
import {dibujarCuadro, tamanoSalida} from "../../Clases/Autoria/Render";
import {Zip} from "../../Clases/Autoria/Zip";
import {Mp4, mp4Disponible, par} from "../../Clases/Autoria/Mp4";

// Archivo -> Exportar video (Fase A7 de documento/planeacion_autoria_asistida.md).
// Dibuja la escena "como se vera" (lo que ve la camara) cuadro a cuadro con el mismo
// motor y el mismo codigo de dibujo que la herramienta de Node (Clases/Autoria/Render.js)
// y arma un MP4 (H.264, con el codificador del navegador), un GIF animado, una secuencia de PNG en un .zip (para montarla en un editor de
// video) o un PNG del cuadro actual. Todo en el navegador.
export default function ModalExportarVideo({refEvento, nombre, onCerrar}) {
    const motor = () => refEvento.current.edicion;
    const duracion = Math.round((motor().duracionReproduccion ? motor().duracionReproduccion() : 8) * 10) / 10;
    const [desde, setDesde] = useState(0);
    const [hasta, setHasta] = useState(duracion);
    const [fps, setFps] = useState(12);
    const [ancho, setAncho] = useState(640);
    const [formato, setFormato] = useState(mp4Disponible() ? "mp4" : "gif");
    const [progreso, setProgreso] = useState(null);     // 0..1 mientras exporta
    const [mensaje, setMensaje] = useState("");
    const cancelar = useRef(false);

    const descargar = (blob, archivo) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = archivo;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    const base = (nombre || "escena").replace(/[^A-Za-z0-9_-]+/g, "_");

    const exportar = async () => {
        const m = motor();
        const t_antes = (m.tiempo_animacion || 0);       // segundos, para volver al terminar
        const estaba = !!m.reproducir;
        // (no se pausan los relojes: el render usa un tiempo forzado, ver Render.js)
        cancelar.current = false;
        setMensaje("");
        const t = tamanoSalida(m, ancho);
        const {w, h} = formato === "mp4" ? {w: par(t.w), h: par(t.h)} : t;     // H.264: medidas pares
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d", {willReadFrequently: true});
        try {
            if (formato === "png") {
                dibujarCuadro(m, ctx, w, h, t_antes * 1000);
                await new Promise((r) => canvas.toBlob((b) => { descargar(b, `${base}_${t_antes.toFixed(2)}s.png`); r(); }, "image/png"));
                setMensaje(`Listo: PNG de ${w}×${h} en ${t_antes.toFixed(2)} s.`);
                return;
            }
            const t0 = Math.max(0, desde * 1000), t1 = Math.max(t0, hasta * 1000), paso = 1000 / Math.max(1, fps);
            const total = Math.floor((t1 - t0) / paso) + 1;
            if (formato === "mp4") {
                const video = await Mp4.crear(w, h, fps);
                for (let i = 0; i < total; i++) {
                    if (cancelar.current) { video.cancelar(); setMensaje("Cancelado."); return; }
                    dibujarCuadro(m, ctx, w, h, t0 + i * paso);
                    await video.cuadro(canvas);
                    setProgreso((i + 1) / total);
                    if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
                }
                const blob = await video.terminar();
                descargar(blob, `${base}.mp4`);
                setMensaje(`Listo: MP4 de ${total} cuadros, ${w}×${h} a ${fps} cuadros por segundo (${Math.round(blob.size / 1024)} KB).`);
                return;
            }
            if (formato === "zip") {
                const zip = new Zip();
                const cifras = Math.max(4, String(total).length);
                for (let i = 0; i < total; i++) {
                    if (cancelar.current) { setMensaje("Cancelado."); return; }
                    dibujarCuadro(m, ctx, w, h, t0 + i * paso);
                    const b = await new Promise((r) => canvas.toBlob(r, "image/png"));
                    zip.agregar(`${base}_${String(i + 1).padStart(cifras, "0")}.png`, new Uint8Array(await b.arrayBuffer()));
                    setProgreso((i + 1) / total);
                }
                descargar(zip.blob(), `${base}_${fps}fps.zip`);
                setMensaje(`Listo: ${total} PNG de ${w}×${h} a ${fps} cuadros por segundo.`);
                return;
            }
            const gif = GIFEncoder();
            for (let i = 0; i < total; i++) {
                if (cancelar.current) { setMensaje("Cancelado."); return; }
                dibujarCuadro(m, ctx, w, h, t0 + i * paso);
                const {data} = ctx.getImageData(0, 0, w, h);
                const paleta = quantize(data, 256);
                gif.writeFrame(applyPalette(data, paleta), w, h, {palette: paleta, delay: Math.round(paso)});
                setProgreso((i + 1) / total);
                if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));   // dejar respirar a la pagina
            }
            gif.finish();
            descargar(new Blob([gif.bytes()], {type: "image/gif"}), `${base}.gif`);
            setMensaje(`Listo: GIF de ${total} cuadros, ${w}×${h}.`);
        } catch (e) {
            setMensaje("No se pudo exportar: " + (e && e.message ? e.message : e));
        } finally {
            setProgreso(null);
            m.buscarTiempo(t_antes);                     // el editor vuelve a donde estaba
            if (estaba && m.reproducirProceso) m.reproducirProceso();
        }
    };

    const exportando = progreso !== null;
    return (
        <div className="ed-modal-fondo" onClick={(e) => { if (e.target === e.currentTarget && !exportando) onCerrar(); }}>
            <div className="ed-modal">
                <div className="d-flex align-items-center mb-2">
                    <h6 className="m-0 flex-grow-1"><i className="bi bi-film me-2"/>Exportar video</h6>
                    <button className="btn-close btn-close-white" disabled={exportando} onClick={onCerrar}/>
                </div>
                <p className="small text-body-secondary">
                    Se exporta lo que ve la <b>Cámara</b> (como en "Vista de cámara"), con física, partículas y todo.
                </p>
                <div className="small" style={{display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8}}>
                    <div style={{gridColumn: "span 2"}}>
                        <label className="form-label mb-0">Formato</label>
                        <select className="form-select form-select-sm" value={formato} disabled={exportando} onChange={(e) => setFormato(e.target.value)}>
                            {mp4Disponible() && <option value="mp4">Video MP4</option>}
                            <option value="gif">GIF animado</option>
                            <option value="zip">Secuencia de PNG (.zip)</option>
                            <option value="png">PNG del cuadro actual</option>
                        </select>
                    </div>
                    {formato !== "png" && <>
                        <div><label className="form-label mb-0">Desde (s)</label>
                            <input type="number" step="0.5" min="0" className="form-control form-control-sm" value={desde} disabled={exportando}
                                   onChange={(e) => setDesde(parseFloat(e.target.value) || 0)}/></div>
                        <div><label className="form-label mb-0">Hasta (s)</label>
                            <input type="number" step="0.5" min="0" className="form-control form-control-sm" value={hasta} disabled={exportando}
                                   onChange={(e) => setHasta(parseFloat(e.target.value) || 0)}/></div>
                        <div><label className="form-label mb-0">Cuadros por segundo</label>
                            <select className="form-select form-select-sm" value={fps} disabled={exportando} onChange={(e) => setFps(parseInt(e.target.value, 10))}>
                                {[8, 10, 12, 15, 20, 24, 30].map((f) => <option key={f} value={f}>{f}</option>)}
                            </select></div>
                    </>}
                    <div><label className="form-label mb-0">Ancho (px)</label>
                        <select className="form-select form-select-sm" value={ancho} disabled={exportando} onChange={(e) => setAncho(parseInt(e.target.value, 10))}>
                            {[320, 480, 640, 960, 1280].map((a) => <option key={a} value={a}>{a}</option>)}
                        </select></div>
                </div>
                {exportando && (
                    <div className="progress mt-3" style={{height: 8}}>
                        <div className="progress-bar" style={{width: `${Math.round(progreso * 100)}%`}}/>
                    </div>
                )}
                {mensaje && <div className="small mt-2">{mensaje}</div>}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    {exportando
                        ? <button className="btn btn-sm btn-outline-secondary" onClick={() => { cancelar.current = true; }}>Cancelar</button>
                        : <button className="btn btn-sm btn-outline-secondary" onClick={onCerrar}>Cerrar</button>}
                    <button className="btn btn-sm btn-primary" disabled={exportando} onClick={exportar}>
                        <i className="bi bi-download me-1"/>Exportar
                    </button>
                </div>
            </div>
        </div>
    );
}
