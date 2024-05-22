import {useEffect, useState} from "react";
import {isDisabled} from "@testing-library/user-event/dist/utils";
import InputEnteroPropiedadGrupo from "./InputEnteroPropiedadGrupo";
import {useDispatch, useSelector} from "react-redux";
import {actualizarBackup} from "../../../../Store/Animacion/animacionSlice";

function PropiedadGrupoFiguras(props){
    const backup = useSelector((state) => state.animacion.backup);
    const dispatch = useDispatch();

    let grupo = props.grupo;

    const seleccionado = grupo.ciclo;
    const checked = {}
    if(seleccionado === 1){
        checked['checked'] = 'checked'
    }

    const desactivar={};
    if(grupo.nombre === "default"){
        desactivar["disabled"] = "disabled"
    }
    const list_nombre_grupos = props.lista_name_grupos.filter((e)=>{
        return grupo.nombre !== e;
    })

    const cambioPropiedadGrupo = (nombre, atributo, valor)=>{
        let validacion = true;

        if(atributo==="nombre"){
            if(valor.length>20){
                validacion = false;
            }
        }
        if(validacion){
            props.animacion.set_atributo_grupo(nombre, atributo, valor);
            props.setAnimacion({"edicion":props.animacion})

            const raw_animacion = JSON.stringify(props.animacion.grupos_figuras);
            dispatch(actualizarBackup(raw_animacion))
        }
        console.log("[===========cambio de propiedades del gruo======================]")
        console.log(nombre)
        console.log(atributo)
        console.log(valor)
        console.log(props.animacion)
    }
    
    useEffect(() => {
        // Your code here
    }, []);


    let seleccion_grupo = null;

    if(grupo.nombre !== "default"){
        const grupo_selecionado = grupo.nodo_padre;
        seleccion_grupo = (<div className="input-group input-group-sm mb-3">
            <label htmlFor={"id_seleccion_grupo_"+grupo.nombre}
                   className="input-group-text">Grupo raiz</label>
            <select id={"id_seleccion_grupo_"+grupo.nombre} className="form-select" aria-label="seleccione un objeto..."
                    autoComplete="off" onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "nodo_padre", e.target.value)}>
                <option>root</option>
                {list_nombre_grupos.map((nombre)=>{
                    if(nombre === grupo_selecionado){
                        return <option value={nombre} selected={"selected"}>{nombre}</option>
                    }
                    return <option value={nombre}>{nombre}</option>
                })}
            </select>
        </div>)
    }


    return(<div>
        <InputEnteroPropiedadGrupo nombre_input="Nombre grupo" valor={grupo.nombre} tipo="nombre" tipo_entrada="text"
                                   cambioPropiedadGrupo={cambioPropiedadGrupo}
                                   desactivar={desactivar}
                                   nombre_grupo={grupo.nombre}
        />
        {seleccion_grupo}

        <InputEnteroPropiedadGrupo nombre_input="Centro x"
                                   valor={grupo.cx}
                                   tipo="cx"
                                   cambioPropiedadGrupo={cambioPropiedadGrupo} nombre_grupo={grupo.nombre}/>

        <InputEnteroPropiedadGrupo nombre_input="Centro y"
                                   valor={grupo.cy}
                                   tipo="cy"
                                   cambioPropiedadGrupo={cambioPropiedadGrupo} nombre_grupo={grupo.nombre}/>


        <InputEnteroPropiedadGrupo nombre_input="Capa"
                                   valor={grupo.capa}
                                   tipo="capa"
                                   cambioPropiedadGrupo={cambioPropiedadGrupo} nombre_grupo={grupo.nombre}/>

        <div className="input-group input-group-sm mb-3">
            <label htmlFor="exampleFormControlInput1" className="input-group-text">Color</label>
            <input type="color" className="form-control" value={grupo.color}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "color", e.target.value)}
                   id={"color-grupo-"+grupo.nombre}/>
        </div>
    </div>)
}

export default PropiedadGrupoFiguras;