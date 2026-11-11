// Guarda `datos` como archivo .json.
// Usa la ventana "Guardar como" (showSaveFilePicker) cuando el navegador la soporta
// (Chrome/Edge/Opera); si no existe (Firefox/Safari) o falla, cae a una descarga
// clasica con <a download>, que funciona en todos los navegadores.
const descargarConEnlace = (blob, nombreArchivo) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportarJSON = async (datos, nombre) => {
    const nombreArchivo = nombre.endsWith(".json") ? nombre : nombre + ".json";
    const blob = new Blob([JSON.stringify(datos)], {type: "application/json"});

    if ("showSaveFilePicker" in window) {
        try {
            const handle = await window.showSaveFilePicker({
                types: [{description: "Archivos JSON", accept: {"application/json": [".json"]}}],
                suggestedName: nombreArchivo
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (error) {
            // El usuario cerro la ventana sin guardar: no hacer nada.
            if (error && error.name === "AbortError") {
                return;
            }
            console.error("Fallo showSaveFilePicker, se usa descarga directa:", error);
        }
    }
    descargarConEnlace(blob, nombreArchivo);
};
