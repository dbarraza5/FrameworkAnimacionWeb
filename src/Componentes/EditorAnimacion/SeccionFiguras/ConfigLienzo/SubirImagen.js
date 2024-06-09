import {useState} from "react";
import axios from "axios";
import {useDispatch} from "react-redux";
import {Cookies} from 'react-cookie';


function SubirImagen(props){

    const [imagen, setImage] = useState(null);
    const [imageName, setImageName] = useState('');

    const dispatch = useDispatch();
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setImageName(file.name);
        setImage(file);
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

            const imagen_aux = await props.obtenerImagen(response.data);

            props.setListaImagenes(prevLista => [...prevLista, imagen_aux]);
            props.animacion.lista_imagenes =[...props.lista_imagenes, imagen_aux];
            props.gestionLienzo.configuracion_lienzo.seleccionarImagenOperar(props.animacion.lista_imagenes.length-1);
            props.gestionLienzo.configuracion_lienzo.moverImagen();
        } catch (err) {
            console.log(err);
        }
    }

    return (
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
    )
}

export default SubirImagen;