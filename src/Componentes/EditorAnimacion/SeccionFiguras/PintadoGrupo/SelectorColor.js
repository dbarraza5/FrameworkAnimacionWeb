import {useEffect, useState} from "react";

function SelectorColor(props){

    const lista_imagen = props.animacion.lista_imagenes;

    return(
        <div>
            <button className="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight"
                    aria-controls="offcanvasRight">Toggle right offcanvas
            </button>

            <div className="offcanvas offcanvas-start offcanvas-custom" tabIndex="-1" id="offcanvasRight"
                 aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">Offcanvas right</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <div className="container mt-5">
                        <h2>Formulario de Ejemplo</h2>
                        <form>

                            <div className="mb-3">
                                <label htmlFor="nombre" className="form-label">Nombre</label>
                                <input type="text" className="form-control" id="nombre" placeholder="Ingresa tu nombre"/>
                            </div>


                            <div className="mb-3">
                                <label htmlFor="opciones" className="form-label">Selecciona una opción</label>
                                <select className="form-select" id="opciones">
                                    <option selected>Elige...</option>
                                    {lista_imagen.map((imagen)=>{
                                        return (<option>{imagen.nombre}</option>)
                                    })}
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary">Enviar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SelectorColor;