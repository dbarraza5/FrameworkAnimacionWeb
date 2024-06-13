import {useState} from "react";
import axios from "axios";
import {Cookies} from 'react-cookie';

function TablaImagenes(props){

    const [openIndex, setOpenIndex] = useState(null);

    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");

    const seleccionAcordeonImagen = (index) => {
        setOpenIndex(openIndex === index ? null : index);
        props.gestionLienzo.configuracion_lienzo.seleccionarImagenOperar(index);
    };

    const handleChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newImages = [...props.lista_imagenes];
        newImages[index] = {
            ...newImages[index],
            [name]: type === 'checkbox' ? checked : value
        };
        // Aquí debes actualizar el estado correspondiente si estás utilizando un estado en el componente padre.
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        //console.log('Formulario enviado:', lista_imagenes);
    };

    const eliminarImagenLienzo = async (index)=>{
        const id_animacion = props.animacion.id_animacion;
        const id_imagen = props.lista_imagenes[index]._id;
        console.log(id_animacion);
        console.log(id_imagen);


        const url = "/api/animacion/eliminar-imagen/"+id_animacion+'/'+id_imagen;

        const token = datos_usuario.token;
        console.log("token: "+token);
        const config_request = {
            method: 'get',
            url: url,
            headers: {
                "Content-Type": "application/json",
                'Accept': 'application/json',
                'Authorization': 'Bearer '+token,
            }
        }

        try {
            const response = await axios(config_request);
            // Mostrar alerta de éxito si la solicitud se realiza correctamente
            props.animacion.eliminar_imagen(id_imagen);
            props.setListaImagenes(props.animacion.lista_imagenes)
            alert('Imagen eliminada exitosamente');
        } catch (error) {
            // Mostrar alerta de fallo si ocurre algún error
            alert('Error al eliminar la imagen');
            console.error('Error:', error);
        }
    }


    return (
        <div className="accordion" id="accordionExample">
            {props.lista_imagenes.map((img, index) => (
                <div className="accordion-item" key={img._id}>
                    <h2 className="accordion-header" id={`heading${index}`}>
                        <button
                            className={`accordion-button ${openIndex === index ? '' : 'collapsed'}`}
                            type="button"
                            onClick={() => seleccionAcordeonImagen(index)}
                            aria-expanded={openIndex === index}
                            aria-controls={`collapse${index}`}
                        >
                            Imagen #{index}
                        </button>
                    </h2>
                    <div
                        id={`collapse${index}`}
                        className={`accordion-collapse collapse ${openIndex === index ? 'show' : ''}`}
                        aria-labelledby={`heading${index}`}
                        data-bs-parent="#accordionExample"
                    >
                        <div className="accordion-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label htmlFor={`nombre${index}`} className="form-label">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id={`nombre${index}`}
                                            name="nombre"
                                            value={img.nombre}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label htmlFor={`x${index}`} className="form-label">X</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`x${index}`}
                                            name="x"
                                            value={img.x}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label htmlFor={`y${index}`} className="form-label">Y</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`y${index}`}
                                            name="y"
                                            value={img.y}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label htmlFor={`ancho${index}`} className="form-label">Ancho</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`ancho${index}`}
                                            name="ancho"
                                            value={img.ancho}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label htmlFor={`alto${index}`} className="form-label">Alto</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`alto${index}`}
                                            name="alto"
                                            value={img.alto}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label htmlFor={`ancho_original${index}`} className="form-label">Ancho Original</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`ancho_original${index}`}
                                            name="ancho_original"
                                            value={img.ancho_original}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label htmlFor={`alto_original${index}`} className="form-label">Alto Original</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id={`alto_original${index}`}
                                            name="alto_original"
                                            value={img.alto_original}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label htmlFor={`opacidad${index}`} className="form-label">Opacidad</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            className="form-control"
                                            id={`opacidad${index}`}
                                            name="opacidad"
                                            value={img.opacidad}
                                            onChange={(e) => handleChange(index, e)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id={`visible${index}`}
                                                name="visible"
                                                checked={img.visible}
                                                onChange={(e) => handleChange(index, e)}
                                            />
                                            <label className="form-check-label" htmlFor={`visible${index}`}>Visible</label>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">Enviar</button>
                                <button className="btn btn-primary" onClick={()=>eliminarImagenLienzo(index)}>Borrar</button>
                            </form>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TablaImagenes;