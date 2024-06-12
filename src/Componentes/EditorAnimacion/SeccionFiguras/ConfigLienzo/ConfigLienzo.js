import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {agregarIimagen} from "../../../../Store/Animacion/animacionSlice";
import axios from "axios";
import {Cookies} from 'react-cookie';
import SubirImagen from "./SubirImagen";
import TablaImagenes from "./TablaImagenes";

function ConfigLienzo(props){

    const [imageName, setImageName] = useState('');
    const [imagen, setImage] = useState(null);

    const dispatch = useDispatch();
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario");
    //const backup = useSelector((state) => state.animacion.backup);

    const [lista_imagenes, setListaImagenes] = useState(props.animacion.lista_imagenes);

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


    return(<div>
        <br/>
        <SubirImagen lista_imagenes={lista_imagenes} setListaImagenes={setListaImagenes}
                     obtenerImagen={obtenerImagen} {...props}/>

        <br/>
         <TablaImagenes lista_imagenes={lista_imagenes} {...props}/>
    </div>)
}

export default ConfigLienzo;