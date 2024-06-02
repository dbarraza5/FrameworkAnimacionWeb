import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {agregarIimagen} from "../../../../Store/Animacion/animacionSlice";
import axios from "axios";
import {Cookies} from 'react-cookie';

function ConfigLienzo(props){

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
            data_img.url_temp = blobUrl;
            //lista_imagenes.push(data_img);
            return data_img;
            //setListaImagenes([...lista_imagenes, data_img]);
        } catch (error) {
            console.error('Error al obtener la imagen:', error);
        }
        return null;
    }

    /*const mapperListaImagenes = (imagenes_)=>{
        return imagenes_.map((img_)=>{
            //img_.url_temp = obtenerImagen(img_);
            return obtenerImagen(img_);
        })
    }*/



    const [lista_imagenes, setListaImagenes] = useState(props.animacion.lista_imagenes);

    useEffect(() => {
        // Ejecutar lógica asincrónica en useEffect
        const fetchData = async () => {
            const updatedImages = await Promise.all(lista_imagenes.map((img) => obtenerImagen(img)));
            setListaImagenes(updatedImages);
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
        /*const data ={
            img: imagen,
            nombre: imageName,
            visible: true,
            x:0,
            y:0,
            ancho:imagen.width,
            alto:imagen.height,
        };
        dispatch(agregarIimagen(data));*/
        //aqui agregar el dispach
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
        } catch (err) {
            console.log(err);
        }
    }



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
    </div>)
}

export default ConfigLienzo;