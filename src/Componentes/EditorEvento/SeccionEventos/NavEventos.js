import ButtonNav from "../../EditorMapa/ButtonNav";
import PanelEventos from "./PanelEventos";
import React, {useEffect, useState} from "react";
import PanelMovimientos from "./PanelMovimientos";
import PanelScripts from "./PanelScripts";
import PanelAnimacion from "./PanelAnimacion";
import ModalAgregarEvento from "./ModalAgregarEvento";
import {nanoid} from "nanoid";
import ModalListaEventos from "./ModalListaEventos";
import PanelGrupos from "./PanelGrupos";
import ConfigLienzoEvento from "./ConfigLienzo/ConfigLienzoEvento";
import {
    MODALIDAD_CONFIG,
    MODALIDAD_EVENTOS, MODALIDAD_GRUPOS,
    MODALIDAD_MACRO,
    MODALIDAD_MOVIMIENTOS,
    MODALIDAD_SCRIPT
} from "../../../Clases/EditorEvento/ConstanteEvento";
import {setTipoModalidad} from "../../../Store/Configuracion/ConfigEventoSlice";
import {useDispatch, useSelector} from "react-redux";
import SeleccionEvento from "./SeleccionEvento";


function NavEventos(props){
    // const [showModal, setShowModal] = useState(false);
    // const [showModalListaEvento, setShowModalListaEvento] = useState(false);
    const [evento, setEvento] = useState(null);
    const [indexIvento, setIndexEvento] = useState(null);
    // const [modalAddEvento, setModalAddEvento] = useState(false);
    const id_evento_seleccionado = useSelector(state => state.config_evento.id_evento_seleccionado);
    const dispatch = useDispatch();
    //
    // const seleccionEvento=(index)=>{
    //     setEvento(props.eventoAnimacion.edicion.eventos[index].evento);
    //     setIndexEvento(index);
    //     props.eventoAnimacion.edicion.seleccion_evento = index;
    //     props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    // }
    //
    const editandoMovEvento=(evento_)=>{
        console.log("[editandoMovEvento]");
        // console.log(movimientos);
        // evento.movimientos = movimientos;
        props.eventoAnimacion.edicion.eventos[indexIvento].evento =evento_;
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }

    const editandoEvento=(evento_)=>{
        console.log("[editandoEvento]");
        console.log(evento_);
        props.eventoAnimacion.edicion.eventos[indexIvento].evento = {...props.eventoAnimacion.edicion.eventos[indexIvento].evento, ...evento_};
        props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    }
    //
    // const agregandoEvento=(evento_)=>{
    //     console.log("[agregandoEvento]");
    //     console.log(evento_);
    //     evento_ = {
    //         //"_id":  nanoid(8),
    //         "movimientos": [],
    //         ...evento_
    //     }
    //     props.eventoAnimacion.edicion.agregarEvento(evento_);
    //     props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    // }
    //
    // const eliminarEvento=(indice)=>{
    //     props.eventoAnimacion.edicion.eventos = props.eventoAnimacion.edicion.eventos.filter((evento_, index)=>{
    //         return index !==indice;
    //     });
    //     props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
    // }
    //
    // const seleccionarEvento=(nombre)=>{
    //     //props.eventoAnimacion.edicion.seleccion_evento = nombre;
    //     let indice_seleccionado = -1;
    //     for(let i=0; props.eventoAnimacion.edicion.eventos; i++){
    //         const evento_ = props.eventoAnimacion.edicion.eventos[i];
    //         if(evento_["evento"]["nombre"] === nombre){
    //             console.log("[index]: "+i);
    //             indice_seleccionado = i;
    //             break;
    //         }
    //     }
    //     if(indice_seleccionado>-1){
    //         seleccionEvento(indice_seleccionado);
    //     }
    //     console.log("[nombre evento]: "+nombre);
    // }

    useEffect(() => {

        const evento_ = props.eventoAnimacion.edicion.obtenerEvento(id_evento_seleccionado);
        if(evento_){
            const index_ = props.eventoAnimacion.edicion.obtenerIndiceEvento(id_evento_seleccionado);
            const evento_selec = {...evento_.evento}
            setEvento(evento_selec);
            setIndexEvento(index_);
            props.eventoAnimacion.edicion.seleccion_evento = index_;
            props.setEventoAnimacion({edicion: props.eventoAnimacion.edicion})
            console.log('CAMMMMMMMMMMMMMMMBIOOOOOOOOOOOOOOOOOOOOOOOOOOO')
        }

        console.log("[id_evento_seleccionado]");
        console.log(evento_)
    }, [id_evento_seleccionado]);

    const seleccionarModalidad=(tipo_modalidad)=>{
        //console.log(tipo_modalidad);
        dispatch(setTipoModalidad(tipo_modalidad));
    }


    // useEffect(() => {
    //     console.log("[PREVIEW CAMBIO indexIvento]");
    //     if(indexIvento!==null){
    //         console.log("[***Cambio de indexIvento***]");
    //         console.log(evento);
    //         const evento_new = props.eventoAnimacion.edicion.eventos[indexIvento].evento;
    //         setEvento({...evento_new});
    //     }
    // }, [indexIvento]);

    return (<div>
        <div className="container-fluid">
            {/* --- NAVEGACIÓN PRINCIPAL --- */}
            <ul className="nav nav-tabs" id="myTab" role="tablist">
                <li className="nav-item" role="presentation">
                    <ButtonNav
                        id="btn-nav-eventos"
                        data-bs-target="#nav-eventos"
                        onClick={() => seleccionarModalidad(MODALIDAD_EVENTOS)}
                    >
                        Eventos
                    </ButtonNav>
                </li>
                <li className="nav-item" role="presentation">
                    <ButtonNav
                        id="btnnav-grupos"
                        data-bs-target="#nav-grupos"
                        onClick={() => seleccionarModalidad(MODALIDAD_GRUPOS)}
                    >
                        Grupos
                    </ButtonNav>
                </li>
                <li className="nav-item" role="presentation">
                    <ButtonNav
                        id="btnnav-config-lienzo"
                        data-bs-target="#nav-config-lienzo"
                        onClick={() => seleccionarModalidad(MODALIDAD_CONFIG)}
                    >
                        Config
                    </ButtonNav>
                </li>
            </ul>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="tab-content" id="myTabContent">

                {/* TAB DE EVENTOS (CONTIENE EL SUB-NAV) */}
                <div className="tab-pane fade show active" id="nav-eventos" role="tabpanel" tabIndex="1">
                    <div className="p-3">
                        <SeleccionEvento {...props}/>
                        {/* --- SUB-NAVEGACIÓN --- */}
                        {evento !== null && (
                            <section>
                                <ul className="nav nav-pills mb-3" id="subnav-eventos" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link active" id="sub-evento-tab" data-bs-toggle="pill"
                                                data-bs-target="#sub-pane-evento" type="button" role="tab"
                                                onClick={() => seleccionarModalidad(MODALIDAD_EVENTOS)}>
                                            Evento
                                        </button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="sub-movimiento-tab" data-bs-toggle="pill"
                                                data-bs-target="#sub-pane-movimiento" type="button" role="tab"
                                                onClick={() => seleccionarModalidad(MODALIDAD_MOVIMIENTOS)}>
                                            Movimiento
                                        </button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="sub-script-tab" data-bs-toggle="pill"
                                                data-bs-target="#sub-pane-script" type="button" role="tab"
                                                onClick={() => seleccionarModalidad(MODALIDAD_SCRIPT)}>
                                            Script
                                        </button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="sub-macro-tab" data-bs-toggle="pill"
                                                data-bs-target="#sub-pane-macro" type="button" role="tab"
                                                onClick={() => seleccionarModalidad(MODALIDAD_MACRO)}>
                                            Macro
                                        </button>
                                    </li>
                                </ul>

                                {/* --- CONTENIDO DEL SUB-NAV --- */}
                                <div className="tab-content border p-3 rounded" id="subnav-content">
                                    <div className="tab-pane fade show active" id="sub-pane-evento" role="tabpanel">

                                        <PanelEventos
                                            {...props}
                                            evento={evento}
                                            guardandoEvento={editandoEvento}
                                            key={`panel-${evento?.evento?.nombre || 'sin-nombre'}`}
                                        />
                                    </div>
                                    <div className="tab-pane fade" id="sub-pane-movimiento" role="tabpanel">
                                        <PanelMovimientos {...props} evento={evento} editandoMovEvento={editandoMovEvento}/>
                                    </div>
                                    <div className="tab-pane fade" id="sub-pane-script" role="tabpanel">
                                        <PanelScripts {...props}/>
                                    </div>
                                    <div className="tab-pane fade" id="sub-pane-macro" role="tabpanel">
                                        {/* <PanelAnimacion {...props}/> */}
                                        <div className="text-muted">Panel de Macro (En desarrollo)</div>
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                </div>

                {/* TAB DE GRUPOS */}
                <div className="tab-pane fade" id="nav-grupos" role="tabpanel" tabIndex="2">
                    <div className="p-3">
                        <PanelGrupos {...props}/>
                    </div>
                </div>

                {/* TAB DE CONFIGURACIÓN */}
                <div className="tab-pane fade" id="nav-config-lienzo" role="tabpanel" tabIndex="3">
                    <div className="p-3">
                        <ConfigLienzoEvento {...props}/>
                    </div>
                </div>

            </div>
        </div>
    </div>)
}

export default NavEventos;