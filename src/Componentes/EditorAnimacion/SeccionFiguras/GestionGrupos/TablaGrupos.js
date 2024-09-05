import {actualizarBackup} from "../../../../Store/Animacion/animacionSlice";
import {useDispatch, useSelector} from "react-redux";
const style ={
    width: "25%"
}


function TablaGrupos(props){
    const lista_grupos = props.animacion.grupos_figuras;
    const dispatch = useDispatch();

    const editarGrupo=(nombre_grupo)=>{
        const tab_grupos = document.getElementById("btn-nav-propiedades-grupo");
        tab_grupos.click();
        const id_grupo = "list-"+nombre_grupo+"-list"
        const tab_g = document.getElementById(id_grupo)
        tab_g.click()
    }

    const borrar_grupo=(nombre)=>{
        props.animacion.borrar_grupo(nombre);
        props.setAnimacion({"edicion": props.animacion})
        editar_lienzo();
    }
    const editar_lienzo=()=>{
        const raw_animacion = JSON.stringify(props.animacion.grupos_figuras);
        dispatch(actualizarBackup(raw_animacion))
    }

    return(<table className="table">
        <thead>
        <tr>
            <th scope="col">#</th>
            <th scope="col">Nombre</th>
            <th scope="col">Root</th>
            <th style={style} scope="col">Operaciones</th>
        </tr>
        </thead>
        <tbody>
        {lista_grupos.map((g, index)=>{
            let btn_borrar = null;
            if(g.nombre !== "default"){
                btn_borrar = (<button type="button" className="btn btn-outline-primary" onClick={()=>borrar_grupo(g.nombre)}>
                    <i className="bi bi-eraser"></i>
                </button>)
            }
            return(
                <tr>
                    <th scope="row">{index+1}</th>
                    <td>{g.nombre}</td>
                    <td>{g.nodo_padre}</td>
                    <td>
                        <div className="btn-group" role="group" aria-label="Basic outlined example">
                            <button type="button" className="btn btn-outline-primary" onClick={()=>editarGrupo(g.nombre)}>
                                <i className="bi bi-pencil"></i>
                            </button>
                            <button type="button" className="btn btn-outline-primary"><i className="bi bi-files"></i></button>
                            {btn_borrar}
                        </div>
                    </td>

                </tr>
            );
        })}

        </tbody>
    </table>)
}

export default TablaGrupos