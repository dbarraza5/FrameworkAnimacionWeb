import {useState} from "react";
import {actualizarBackup} from "../../../../Store/Animacion/animacionSlice";
import {useDispatch} from "react-redux";

function CrearGrupo(props){
    const [nombre, setNombre] = useState("")

    const dispatch = useDispatch();

    const crear_grupo=()=>{
        const check = props.animacion.agregar_grupo_nuevo(nombre)
        if(check){
            props.setAnimacion({"edicion": props.animacion})
            setNombre("")
        }
        editar_lienzo();
    }

    const editar_lienzo=()=>{
        const raw_animacion = JSON.stringify(props.animacion.grupos_figuras);
        dispatch(actualizarBackup(raw_animacion))
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