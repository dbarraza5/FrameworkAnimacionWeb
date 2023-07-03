import SeleccionGrupo from "../GestionFiguras/SeleccionGrupo";
import {useState} from "react";
import CrearGrupo from "../GestionGrupos/CrearGrupo";
import TablaGrupos from "../GestionGrupos/TablaGrupos";

function PintadoGrupo(props){
    const lista_grupos = props.animacion.get_lista_nombres_grupos();
    const [nombre_grupo, setNombreGrupo] = useState("default");

    const cambiar_grupo=(nombre_grupo_)=>{
        props.gestionLienzo.seleccionGrupoPintar(nombre_grupo_)
        setNombreGrupo(nombre_grupo_)
    }

    const agregar_pintura=()=>{
        props.animacion.agregar_pintado_grupo(nombre_grupo)
        props.setAnimacion({"edicion": props.animacion})
    }

    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(index === activeIndex ? null : index);
    };

    const grupo = props.animacion.getGrupo(nombre_grupo)
    return (<>
        <br/>
        <row>
            <SeleccionGrupo lista_grupos={lista_grupos} setNombreGrupo={cambiar_grupo} nombre_grupo={nombre_grupo}/>
            <div className="btn-group" role="group" aria-label="Basic example">
                <button type="button" className="btn btn-primary"
                        onClick={agregar_pintura}>Agregar
                </button>
            </div>
            <hr/>
        </row>


        <div className="accordion" id="accordionExample">
            {grupo.lista_pintado.map((item, index) => {

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
                                <div className="input-group input-group-sm mb-3">
                                    <label htmlFor="exampleFormControlInput1" className="input-group-text">Color</label>
                                    <input type="color" className="form-control" value={item.color}
                                           onChange={(e)=>console.log("fsdfsdsdfsdf")}
                                    />
                                </div>
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

                                <div className="btn-group" role="group" aria-label="Basic outlined example">
                                    <button type="button" className="btn btn-outline-primary"><i
                                        className="bi bi-eraser"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    </>)
}

export default PintadoGrupo