import {useState} from "react";

function CrearGrupo(props){
    const [nombre, setNombre] = useState("")
    const crear_grupo=()=>{
        const check = props.animacion.agregar_grupo_nuevo(nombre)
        if(check){
            props.setAnimacion({"edicion": props.animacion})
            setNombre("")
        }
    }
    return(<div className="mb-3 row">
        <label htmlFor="inputPassword" className="col-sm-2 col-form-label">Nombre</label>
        <div className="col-sm-8">
            <input type="text" className="form-control" value={nombre} onChange={(e)=>setNombre(e.target.value)}
                   id="input-nombre-nuevo-grupo"/>
        </div>
        <button type="button" className="col-sm-2 btn btn-primary" onClick={crear_grupo}>Crear</button>
    </div>)
}

export default CrearGrupo;