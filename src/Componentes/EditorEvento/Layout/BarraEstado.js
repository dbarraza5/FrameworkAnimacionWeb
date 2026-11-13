import {useEffect, useState} from "react";
import {ARRAY_TITULOS_MODALIDAD} from "../../../Clases/EditorEvento/ConstanteEvento";

// Barra de estado inferior: zoom, coordenadas del cursor (en el dibujo), modalidad,
// grupo seleccionado y cuadros por segundo. Lee el estado del lienzo con un sondeo
// liviano (4 veces por segundo) en vez de re-renderizar el editor en cada cuadro.
export default function BarraEstado({refLienzo}) {
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const id = setInterval(() => {
            const l = refLienzo.current;
            if (!l) return;
            const c = l.configuracion_lienzo;
            setInfo({
                zoom: Math.round((c.escala || 1) * 100),
                x: Math.round(l.x_mouse || 0),
                y: Math.round(l.y_mouse || 0),
                fps: Math.round(l.fps || 0),
                modalidad: ARRAY_TITULOS_MODALIDAD[l.tipo_modalidad] || "-",
                grupo: l.grupo_seleccionado || "-",
                ancho: Math.round(c.ancho || 0),
                alto: Math.round(c.alto || 0),
            });
        }, 250);
        return () => clearInterval(id);
    }, [refLienzo]);

    if (!info) return <footer className="ed-estado"/>;
    return (
        <footer className="ed-estado">
            <span title="Zoom del lienzo"><i className="bi bi-zoom-in me-1"/>{info.zoom} %</span>
            <span title="Posicion del cursor en el dibujo">x: {info.x} &nbsp; y: {info.y}</span>
            <span title="Modalidad">{info.modalidad}</span>
            <span title="Grupo seleccionado"><i className="bi bi-bounding-box me-1"/>{info.grupo}</span>
            <span className="ms-auto" title="Tamano del lienzo">{info.ancho}×{info.alto}</span>
            <span title="Cuadros por segundo">{info.fps} fps</span>
        </footer>
    );
}
