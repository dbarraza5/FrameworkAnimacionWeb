import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import PanelEventos from "./PanelEventos";
import PanelMovimientos from "./PanelMovimientos";
import PanelScripts from "./PanelScripts";
import {
    MODALIDAD_EVENTOS,
    MODALIDAD_MACRO,
    MODALIDAD_MOVIMIENTOS,
    MODALIDAD_SCRIPT
} from "../../../Clases/EditorEvento/ConstanteEvento";
import {setTipoModalidad} from "../../../Store/Configuracion/ConfigEventoSlice";

const SECCIONES = [
    {modalidad: MODALIDAD_EVENTOS, titulo: "Evento", icono: "bi-calendar-event"},
    {modalidad: MODALIDAD_MOVIMIENTOS, titulo: "Movimiento", icono: "bi-arrows-move"},
    {modalidad: MODALIDAD_SCRIPT, titulo: "Script", icono: "bi-code-slash"},
    {modalidad: MODALIDAD_MACRO, titulo: "Macro", icono: "bi-grid-3x3-gap"},
];

// Inspector (panel derecho): propiedades del evento seleccionado y sus movimientos.
// Antes vivia como sub-pestanas dentro del panel izquierdo (NavEventos). La seccion
// activa sigue la modalidad global (redux): elegir "Movimiento" aca pone el lienzo y
// el timeline en modo movimientos, igual que antes.
export default function Inspector(props) {
    const dispatch = useDispatch();
    const id_evento_seleccionado = useSelector(state => state.config_evento.id_evento_seleccionado);
    const tipo_modalidad = useSelector(state => state.config_evento.tipo_modalidad);
    const [evento, setEvento] = useState(null);
    const [indexEvento, setIndexEvento] = useState(null);

    // Busca el evento seleccionado; tambien cuando terminan de llegar los datos (al
    // abrir, la seleccion inicial "EventoGeneral" llega antes que los eventos).
    useEffect(() => {
        const evento_ = props.eventoAnimacion.edicion.obtenerEvento(id_evento_seleccionado);
        if (evento_) {
            const index_ = props.eventoAnimacion.edicion.obtenerIndiceEvento(id_evento_seleccionado);
            setEvento({...evento_.evento});
            setIndexEvento(index_);
            props.eventoAnimacion.edicion.seleccion_evento = index_;
            props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion});
        } else {
            setEvento(null);
            setIndexEvento(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id_evento_seleccionado, props.eventoAnimacion.edicion.eventos.length]);

    const editandoEvento = (evento_) => {
        props.eventoAnimacion.edicion.eventos[indexEvento].evento =
            {...props.eventoAnimacion.edicion.eventos[indexEvento].evento, ...evento_};
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion});
    };

    const editandoMovEvento = (evento_) => {
        props.eventoAnimacion.edicion.eventos[indexEvento].evento = evento_;
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion});
        setEvento({...evento_});
    };

    const seccion_activa = SECCIONES.some((s) => s.modalidad === tipo_modalidad)
        ? tipo_modalidad : MODALIDAD_EVENTOS;

    if (!evento) {
        return (
            <div className="p-3 small text-body-secondary">
                Selecciona un evento en el panel <strong>Escena</strong> para ver sus propiedades.
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100">
            <div className="px-2 pt-2 pb-1 small">
                <span className="text-body-secondary text-uppercase fw-semibold" style={{fontSize: "0.65rem"}}>Evento</span>
                <div className="fw-semibold text-truncate">{evento.nombre}</div>
            </div>
            <ul className="nav nav-pills nav-fill px-2 gap-1 small" role="tablist">
                {SECCIONES.map((s) => (
                    <li className="nav-item" key={s.modalidad} role="presentation">
                        <button type="button" role="tab"
                                className={`nav-link py-1 px-2 ${seccion_activa === s.modalidad ? "active" : ""}`}
                                aria-selected={seccion_activa === s.modalidad}
                                onClick={() => dispatch(setTipoModalidad(s.modalidad))}
                                title={s.titulo}>
                            <i className={`bi ${s.icono} me-1`}/>{s.titulo}
                        </button>
                    </li>
                ))}
            </ul>
            <hr className="my-2"/>
            {/* Las secciones quedan montadas (solo se ocultan) para no perder su estado
                interno al cambiar de una a otra. */}
            <div className="flex-grow-1 overflow-auto px-2 pb-3">
                <div className={seccion_activa === MODALIDAD_EVENTOS ? "" : "d-none"}>
                    <PanelEventos {...props} evento={evento} guardandoEvento={editandoEvento}
                                  key={`panel-${evento?.nombre || "sin-nombre"}`}/>
                </div>
                <div className={seccion_activa === MODALIDAD_MOVIMIENTOS ? "" : "d-none"}>
                    <PanelMovimientos {...props} evento={evento} editandoMovEvento={editandoMovEvento}/>
                </div>
                <div className={seccion_activa === MODALIDAD_SCRIPT ? "" : "d-none"}>
                    <PanelScripts {...props}/>
                </div>
                <div className={seccion_activa === MODALIDAD_MACRO ? "" : "d-none"}>
                    <div className="text-body-secondary small">Panel de Macro (en desarrollo)</div>
                </div>
            </div>
        </div>
    );
}
