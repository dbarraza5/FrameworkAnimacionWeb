import {useState} from "react";
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

            let res = await axios(config_request)
                .then(function (response) {
                    console.log("funciono imageen")
                    console.log(response.data);
                })
                .catch(function (respuesta) {
                    console.log(respuesta);
                });
        } catch (err) {
            console.log(err);
        }
    }

    return(<div>
        <br/>
        <div id="lista_imagenes_animacion">

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