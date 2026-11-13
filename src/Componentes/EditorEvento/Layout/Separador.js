import {useRef, useState} from "react";

// Borde arrastrable para redimensionar un panel. `orientacion`: "vertical" (cambia
// un ancho) u "horizontal" (cambia un alto). `onArrastrar(delta)` recibe el
// desplazamiento del puntero en pixeles desde el ultimo movimiento.
export default function Separador({orientacion = "vertical", onArrastrar, onFin, titulo}) {
    const ultimo = useRef(0);
    const [activo, setActivo] = useState(false);

    const alPresionar = (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        ultimo.current = orientacion === "vertical" ? e.clientX : e.clientY;
        setActivo(true);
    };
    const alMover = (e) => {
        if (!activo) return;
        const pos = orientacion === "vertical" ? e.clientX : e.clientY;
        const delta = pos - ultimo.current;
        ultimo.current = pos;
        if (delta !== 0 && onArrastrar) onArrastrar(delta);
    };
    const alSoltar = (e) => {
        if (!activo) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setActivo(false);
        if (onFin) onFin();
    };

    return (
        <div className={`ed-separador ${orientacion} ${activo ? "activo" : ""}`}
             role="separator" aria-orientation={orientacion} title={titulo}
             onPointerDown={alPresionar} onPointerMove={alMover}
             onPointerUp={alSoltar} onPointerCancel={alSoltar}/>
    );
}
