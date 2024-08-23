import SeleccionGrupo from "../GestionFiguras/SeleccionGrupo";
import {useEffect, useState} from "react";
import CrearGrupo from "../GestionGrupos/CrearGrupo";
import TablaGrupos from "../GestionGrupos/TablaGrupos";
import SelectorColor from "./SelectorColor";
//import 'bootstrap/dist/css/bootstrap.min.css';
//import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Importa Bootstrap explícitamente si no está en `window`
import * as bootstrap from 'bootstrap';

function PintadoGrupo(props){
    const gestion_pintado=props.gestionLienzo.gestion_pintado;

    const lista_grupos = ["...", ...props.animacion.get_lista_nombres_grupos()];
    //lista_grupos = ["...", ...lista_grupos]
    const [nombre_grupo, setNombreGrupo] = useState("...");
    const [indice_pintura, setIndicePintado] = useState(0)
    const [indice_grupo_pintura, setIndiceGrupoPintado] = useState(0)

    const grupo = props.animacion.getGrupo(nombre_grupo);
    const [lista_pintado, setListadoPintado] = useState(grupo === null? []: [...grupo.lista_pintado])

    const [porcentaje_zoom, setPorcentajeZoom] = useState(0)
    const escalaZoom = 0.1

    const [indice_color, setIndiceColor] = useState(0);

    const seleccion_color_canvas = (color)=>{
        cambiarColor(indice_color, color);
    }

    const abrirModalElegirColor=(indice_color_)=>{
        setIndiceColor(indice_color_);
        const modalElement = document.getElementById('selector-color-modal'); // Obtener el modal por su ID
        const modal = new bootstrap.Modal(modalElement); // Crear instancia del modal
        modal.show(); // Mostrar el modal
    }

    useEffect(() => {
        //setAtributoHijo(props.nuevoValor);
        setNombreGrupo('...');
        gestion_pintado.indice_seleccion_pintado = -1;
        setListadoPintado([]);
        //console.log("CAMBIO DE NAVVVVV");
    }, [props.selectNav]);

    const zoomGrupoSeleccionado=(zoom)=>{
        let zoom_truncate =parseFloat(porcentaje_zoom+zoom)//.toFixed(3) ;
        setPorcentajeZoom(zoom_truncate)
        gestion_pintado.zoomGrupo(zoom)

    }

    const cambiar_grupo=(nombre_grupo_)=>{
        if(nombre_grupo_ !== "..."){
            props.gestionLienzo.seleccionGrupoPintar(nombre_grupo_)
            const grupo_copia = gestion_pintado.grupo_copia
            setListadoPintado(grupo_copia === null? []: [...grupo_copia.lista_pintado])
            if(grupo_copia.lista_pintado.length>0){
                setIndicePintado(0);
                setIndiceGrupoPintado(0);
                setActiveIndex(0);
                gestion_pintado.indice_seleccion_pintado = 0;
                gestion_pintado.indice_seleccion_grupo_pintado=0;
            }

        }
        setNombreGrupo(nombre_grupo_)
    }

    const agregar_pintura=()=>{
        if(gestion_pintado.grupo_copia !== null){
            gestion_pintado.grupo_copia.lista_pintado.push({
                color: "#000000",
                visible: true,
                elementos: [
                    []
                ]
            })
            setListadoPintado([...gestion_pintado.grupo_copia.lista_pintado])
            setIndiceGrupoPintado(0);
            if(gestion_pintado.grupo_copia.lista_pintado.length ===1){
                const index_aux = gestion_pintado.grupo_copia.lista_pintado.length-1;
                gestion_pintado.indice_seleccion_pintado = index_aux;
            }
        }
    }

    const eliminar_pintura=(indice)=>{
        if(gestion_pintado.grupo_copia !== null){
            gestion_pintado.indice_seleccion_pintado = -1;
            gestion_pintado.eliminarPintura(indice)
            setListadoPintado([...gestion_pintado.grupo_copia.lista_pintado])
            if(gestion_pintado.grupo_copia.lista_pintado.length>0){
                gestion_pintado.indice_seleccion_pintado = 0;
                setIndiceGrupoPintado(0);
                setActiveIndex(0);
            }

        }
    }

    const agregar_grupo_pintado =(indece_pintura_, indice_posicion)=>{
        console.log("agregar_grupo_pintado: "+indece_pintura_+" | "+indice_posicion);
        gestion_pintado.grupo_copia.lista_pintado[indece_pintura_].elementos.splice(indice_posicion, 0, [])
        //console.log(gestion_pintado.grupo_copia);
        setListadoPintado([...gestion_pintado.grupo_copia.lista_pintado])
        setIndiceGrupoPintado(indice_posicion)
        gestion_pintado.indice_seleccion_grupo_pintado=indice_posicion;
    }

    const vaciar_grupo_pintado =(indece_pintura_, indice_grupo_pintura_)=>{
        gestion_pintado.grupo_copia.lista_pintado[indece_pintura_].elementos[indice_grupo_pintura_] = [];
        //gestion_pintado.indice_seleccion_grupo_pintado=0;
        //setListadoPintado([...gestion_pintado.grupo_copia.lista_pintado])
    }

    const eliminar_grupo_pintado =(indece_pintura_, indice_grupo_pintura_)=>{
        gestion_pintado.grupo_copia.lista_pintado[indece_pintura_].elementos.splice(indice_grupo_pintura_, 1);
        gestion_pintado.indice_seleccion_grupo_pintado=0;
        setListadoPintado([...gestion_pintado.grupo_copia.lista_pintado])
        setIndiceGrupoPintado(0);
    }

    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(index === activeIndex ? null : index);
        gestion_pintado.indice_seleccion_pintado = index;
        gestion_pintado.indice_seleccion_grupo_pintado=0;
        setIndiceGrupoPintado(0);
        setIndicePintado(index)
        console.log(index)
    };

    const seleccionIndiceGrupoPintado=(index_grupo_p)=>{
        setIndiceGrupoPintado(index_grupo_p)
        gestion_pintado.indice_seleccion_grupo_pintado=index_grupo_p;
        console.log("seleccionIndiceGrupoPintado: "+index_grupo_p)
    }

    const rellenarPintura=(event)=>{
        console.log(event.target.checked)
        gestion_pintado.relleno_pintura = event.target.checked
    };

    const pintar_todo=(event)=>{
        console.log(event.target.checked)
        gestion_pintado.pintar_todo= event.target.checked
    };

    const cambiarColor=(indice, color)=>{
        const pintura = gestion_pintado.getPintadoGrupo(parseInt(indice))
        pintura.color = color;
        const grupo_copia = gestion_pintado.grupo_copia
        setListadoPintado(grupo_copia === null? []: [...grupo_copia.lista_pintado])
        console.log("indice: ", indice)
        console.log("color: ", color)
    }

    const aplicaCambios=()=>{
        console.log("aplicando cambiossss")
        gestion_pintado.aplicarCambioGrupo()
    }

    //const grupo = props.animacion.getGrupo(nombre_grupo);
    //const lista_pintado = grupo === null? []: grupo.lista_pintado;
    return (<>
        <br/>
        <SeleccionGrupo lista_grupos={lista_grupos} setNombreGrupo={cambiar_grupo} nombre_grupo={nombre_grupo}/>
        <div className="row">
            <div className="col-3">
                <div className="btn-group" role="group" aria-label="Basic example">
                    <button type="button" className="btn btn-primary" onClick={agregar_pintura}>
                        Agregar
                    </button>
                </div>
            </div>

            <div className="col-3">
                <div className="form-check form-switch">
                    <input className="form-check-input" onChange={pintar_todo} type="checkbox" id="cambio-visibilidad" />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                        pintar todo
                    </label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" onChange={rellenarPintura} type="checkbox" id="flexSwitchCheckDefault" />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                        Relleno
                    </label>
                </div>
            </div>

            <div className="col-3">
                <div className="d-flex">
                    <button id="zoomInBtn" className="btn btn-primary me-2" onClick={()=>zoomGrupoSeleccionado(escalaZoom)}>
                        <i className="bi bi-plus"></i>
                    </button>
                    <button id="zoomOutBtn" className="btn btn-primary me-2" onClick={()=>zoomGrupoSeleccionado(escalaZoom*-1)}>
                        <i className="bi bi-dash"></i>
                    </button>
                    {/*<input id="zoomValue" className="form-control form-control-sm" type="number" value={porcentaje_zoom} readOnly />*/}
                </div>
            </div>

            <div className="col-3">
                <div className="btn-group" role="group" aria-label="Basic example">
                    <button type="button" className="btn btn-primary" onClick={aplicaCambios}>
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
        <hr/>

        <div className="accordion" id="accordionExample">
            {lista_pintado.map((item, index) => {

                const checked = {}
                if(item.visible === true){
                    checked['checked'] = 'checked'
                }

                return (
                    <div className="accordion-item" key={index}>
                        <h2 className="accordion-header" id={`heading${index}`}>
                            <button
                                className={`accordion-button ${activeIndex === index ? '' : 'collapsed'}`}
                                type="button"
                                onClick={() => toggleAccordion(index)}
                                aria-expanded={activeIndex === index ? 'true' : 'false'}
                                aria-controls={`collapse${index}`}
                            >
                                Pintura - {index}
                            </button>
                        </h2>
                        <div
                            id={`collapse${index}`}
                            className={`accordion-collapse collapse ${activeIndex === index ? 'show' : ''}`}
                            aria-labelledby={`heading${index}`}
                            data-bs-parent="#accordionExample"
                        >
                            <div className="accordion-body d-flex">
                                <div className="row w-100">
                                    <div className="col">
                                        <div className="row w-100">
                                            <div className="col">
                                                <div className="input-group input-group-sm mb-3">
                                                    <label htmlFor="exampleFormControlInput1" className="input-group-text">Color</label>
                                                    <input type="color" className="form-control" value={item.color}
                                                           onChange={(e)=>cambiarColor(index, e.target.value)}
                                                    />
                                                    <button onClick={(e)=>abrirModalElegirColor(index)}
                                                            className="btn btn-outline-primary btn-sm"
                                                    >open</button>
                                                </div>
                                            </div>

                                            <div className="col">
                                                <div className="input-group input-group-sm mb-3">
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="checkbox" value=""
                                                               id="flexCheckDefault" {...checked}
                                                               onChange={(e)=>console.log("dsfdsfsdf")}
                                                        />
                                                        <label className="form-check-label" htmlFor="flexCheckDefault">
                                                            Visible
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <div className="input-group input-group-sm mb-3">
                                                    <div className="btn-group" role="group" aria-label="Basic outlined example">
                                                        <button type="button" className="btn btn-outline-primary btn-sm"
                                                                onClick={()=>eliminar_pintura(index)}><i
                                                            className="bi bi-eraser"></i></button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="row w-100">
                                            <div className="col">
                                                <table className="table">
                                                    <thead>
                                                    <tr>
                                                        <th scope="col">#</th>
                                                        <th scope="col">item</th>
                                                        <th scope="col">operaciones</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {item.elementos.map((grupo_p, index_gr_p)=>{
                                                        const primero_radio_btn = indice_grupo_pintura === index_gr_p;
                                                        return(<tr>
                                                            <th scope="row">{index_gr_p+1}</th>
                                                            <td>
                                                                <input className="form-check-input" type="radio" onClick={(e)=>seleccionIndiceGrupoPintado(index_gr_p)}
                                                                       name={`radio-${nombre_grupo}-pintura-${index}`} id={`radio-${nombre_grupo}-pintura-${index}-index-${index_gr_p}`} value={index_gr_p}
                                                                       checked={primero_radio_btn}
                                                                />
                                                            </td>
                                                            <td>
                                                                <button type="button" className="btn btn-outline-primary btn-sm"
                                                                        onClick={()=>agregar_grupo_pintado(index, index_gr_p+1)}><i
                                                                    className="bi bi-plus"></i></button>
                                                                <button type="button" className="btn btn-outline-primary btn-sm"
                                                                        onClick={()=>vaciar_grupo_pintado(index, index_gr_p)}><i
                                                                    className="bi bi-trash"></i></button>
                                                                <button type="button" className="btn btn-outline-primary btn-sm"
                                                                        onClick={()=>eliminar_grupo_pintado(index, index_gr_p)}
                                                                        hidden={index_gr_p === 0}
                                                                ><i
                                                                    className="bi bi-eraser"></i></button>
                                                            </td>
                                                        </tr>);
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>

        <SelectorColor {...props} cambiarColor={seleccion_color_canvas}/>
    </>)
}

export default PintadoGrupo