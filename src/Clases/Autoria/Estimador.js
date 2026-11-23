// Estimador de tiempo restante para tareas largas con progreso 0..1 (exportar video, etc.).
// Usa la velocidad promedio suavizada (no la del ultimo cuadro, que salta) y no da numero hasta
// tener algo de muestra (avance >= 2% y >= 2 s), para no mostrar estimaciones locas al principio.
//
//   const est = crearEstimador();          // al empezar
//   const {transcurrido, restante, total} = est.actualizar(progreso);   // en cada avance (ms; restante null = calculando)
//   formatoDuracion(ms) -> "1 min 05 s" | "42 s"
export function crearEstimador(ahora = () => Date.now()) {
    const inicio = ahora();
    let velocidad = null;            // progreso por ms, suavizado
    let ultimo = {t: inicio, p: 0};
    return {
        actualizar(p) {
            const t = ahora(), transcurrido = t - inicio;
            p = Math.max(0, Math.min(1, p));
            if (t - ultimo.t >= 500 && p > ultimo.p) {
                const v = (p - ultimo.p) / (t - ultimo.t);
                velocidad = velocidad == null ? v : velocidad * 0.8 + v * 0.2;
                ultimo = {t, p};
            }
            // mezcla del promedio total (estable) y la velocidad reciente (sigue los cambios)
            const media = p > 0 ? p / Math.max(1, transcurrido) : null;
            const v = velocidad == null ? media : media == null ? velocidad : 0.5 * media + 0.5 * velocidad;
            const listo = p >= 0.02 && transcurrido >= 2000 && v > 0;
            const restante = p >= 1 ? 0 : listo ? Math.round((1 - p) / v) : null;
            return {transcurrido, restante, total: restante == null ? null : transcurrido + restante};
        },
    };
}

export function formatoDuracion(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ${String(s % 60).padStart(2, "0")} s`;
    return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

// Texto para mostrar debajo de la barra de progreso
export function textoEstimacion(e) {
    if (!e) return "";
    const ya = `Transcurrido: ${formatoDuracion(e.transcurrido)}`;
    return e.restante == null ? `${ya} · calculando lo que falta…` : `${ya} · Quedan aprox. ${formatoDuracion(e.restante)}`;
}
