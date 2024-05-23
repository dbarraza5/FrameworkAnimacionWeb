import {useState} from "react";

function ConfigLienzo(props){

    const [imageName, setImageName] = useState('');
    const [imagen, setImage] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
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
        }
    };

    const agregandoImagen =()=>{
        const data ={
            img: imagen,
            nombre: imageName,
            visible: true,
            x:0,
            y:0,
            ancho:imagen.width,
            alto:imagen.height,
        };

        //aqui agregar el dispach
    }

    return(<div>
        <br/>
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