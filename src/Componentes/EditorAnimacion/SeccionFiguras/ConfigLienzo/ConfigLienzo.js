import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {agregarIimagen} from "../../../../Store/Animacion/animacionSlice";
import axios from "axios";
import {Cookies} from 'react-cookie';

function ConfigLienzo(props){
    const [openIndex, setOpenIndex] = useState(null);
    const [imageName, setImageName] = useState('');
    const [imagen, setImage] = useState(null);

    const dispatch = useDispatch();
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");
    //const backup = useSelector((state) => state.animacion.backup);


    const obtenerImagen = async(data_img)=>{
        try {

            const url = "/api/imagen/"+data_img.url;
            const token = datos_usuario.token;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob' // Para obtener la respuesta como un blob
            });

            // Crear una URL local para el blob recibido
            const blobUrl = URL.createObjectURL(response.data);
            //console.log(blobUrl);
            const imagen = new Image();
            imagen.src = blobUrl;
            imagen.onload = function() {
                console.log('Imagen cargada:', imagen);
            };

            data_img.url_temp = blobUrl;
            data_img.img =imagen;
            //lista_imagenes.push(data_img);
            return data_img;
            //setListaImagenes([...lista_imagenes, data_img]);
        } catch (error) {
            console.error('Error al obtener la imagen:', error);
        }
        return null;
    }

    const [lista_imagenes, setListaImagenes] = useState(props.animacion.lista_imagenes);

    useEffect(() => {
        // Ejecutar lógica asincrónica en useEffect
        const fetchData = async () => {
            const updatedImages = await Promise.all(lista_imagenes.map((img) => obtenerImagen(img)));
            setListaImagenes(updatedImages);
            props.animacion.lista_imagenes =updatedImages;
            props.setAnimacion({"edicion": props.animacion})
        };

        fetchData();
    }, []);



    console.log("LISTA IMAGENES __________________________________");
    console.log(lista_imagenes)

    //props.animacion.lista_imagenes
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setImageName(file.name);
        setImage(file);
        /*
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('lienzo-animacion'); // Acceder al canvas usando document.getElementById
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas antes de dibujar
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Dibujar la imagen en el canvas


                setImageName(file.name);
                setImage(img);
            };
            img.src = event.target.result;
        };

        // Leer el archivo como URL
        if (file) {
            reader.readAsDataURL(file);
        }*/
    };

    const agregandoImagen =async ()=>{
        const id_animacion = props.animacion.id_animacion;

        const formData = new FormData();
        formData.append('image', imagen);

        try {
            const url = "/api/animacion/agregar-imagen/"+id_animacion;

            const token = datos_usuario.token;
            console.log("token: "+token);
            const config_request = {
                method: 'put',
                url: url,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': 'Bearer '+token,
                },
                data : formData
            }

            const response = await axios(config_request);
            console.log("funcionó imagen");
            console.log(response.data);

            const imagen_aux = await obtenerImagen(response.data);

            setListaImagenes(prevLista => [...prevLista, imagen_aux]);
            console.log("LISTA IAMGNES =>=========> "+lista_imagenes.length)
            props.animacion.lista_imagenes =[...lista_imagenes, imagen_aux];
            props.gestionLienzo.configuracion_lienzo.seleccionarImagenOperar(props.animacion.lista_imagenes.length-1);
            props.gestionLienzo.configuracion_lienzo.moverImagen();
        } catch (err) {
            console.log(err);
        }
    }

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newImages = [...lista_imagenes];
        newImages[index] = {
            ...newImages[index],
            [name]: type === 'checkbox' ? checked : value
        };
        // Aquí debes actualizar el estado correspondiente si estás utilizando un estado en el componente padre.
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Formulario enviado:', lista_imagenes);
    };

    return(<div>
        <br/>
        {lista_imagenes.length}
        <div id="lista_imagenes_animacion" hidden>
            {lista_imagenes.map((img)=>{
                return ( <img key={'img_'+img.url} id={'img_'+img.url} src={img.url_temp} alt={img.nombre} width={img.ancho} height={img.alto}/> )
            })}
        </div>
        <form id="formImagen" onSubmit={()=>console.log("subiendo...")}>
            <div className="mb-3">
                <input
                    type="text"
                    value={imageName}
                    placeholder="Nombre de la imagen"
                    className="form-control"
                />
                <label htmlFor="imagen" className="form-label">Selecciona una imagen:</label>
                <input type="file" className="form-control" onChange={handleFileChange} id="imagen" name="imagen" accept="image/*" />
            </div>
            <button type="button" onClick={agregandoImagen} className="btn btn-primary" disabled={imagen===null}>Subir</button>
        </form>

        <div className="accordion" id="accordionExample">
            {lista_imagenes.map((img, index) => (
                <div className="accordion-item" key={img._id}>
                    <h2 className="accordion-header" id={`heading${index}`}>
                        <button
                            className={`accordion-button ${openIndex === index ? '' : 'collapsed'}`}
                            type="button"
                            onClick={() => handleToggle(index)}
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
                            </form>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>)
}

export default ConfigLienzo;