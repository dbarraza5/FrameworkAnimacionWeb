import {useEffect, useState} from "react";
import {isDisabled} from "@testing-library/user-event/dist/utils";

function PropiedadGrupoFiguras(props){
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
        }
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
        seleccion_grupo = (<div className="mb-3">
            <label htmlFor={"id_seleccion_grupo_"+grupo.nombre}
                   className="form-label">Seleccion de grupo</label>
            <select id={"id_seleccion_grupo_"+grupo.nombre} className="form-select" aria-label="seleccione un objeto..."
                    autoComplete="off" onChange={(e)=>console.log("cambiar figura")}>
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
        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Nombre grupo</label>
            <input type="text" className="form-control" value={grupo.nombre}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "nombre", e.target.value)}
                   id={"nombre-grupo-"+grupo.nombre} {...desactivar}/>
        </div>

        {seleccion_grupo}

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Tiempo Inicial</label>
            <input type="number" className="form-control" value={grupo.tiempo_inicial}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "tiempo_inicial", e.target.value)}
                   id={"tiempo_inicial-grupo-"+grupo.nombre}/>
        </div>

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Tiempo Final</label>
            <input type="number" className="form-control" value={grupo.tiempo_final}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "tiempo_final", e.target.value)}
                   id={"tiempo_final-grupo-"+grupo.nombre}/>
        </div>

        <div className="mb-3">
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value=""
                       id="flexCheckDefault" {...checked}
                       onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "ciclo", parseInt(e.target.checked*1))}
                />
                    <label className="form-check-label" htmlFor="flexCheckDefault">
                        Ciclos
                    </label>
            </div>
        </div>

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Centro x</label>
            <input type="number" className="form-control" value={grupo.cx}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "cx", e.target.value)}
                   id={"cx-grupo-"+grupo.nombre}/>
        </div>

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Centro y</label>
            <input type="number" className="form-control" value={grupo.cy}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "cy", e.target.value)}
                   id={"cy-grupo-"+grupo.nombre}/>
        </div>

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Capa</label>
            <input type="number" className="form-control" value={grupo.capa} min="0" max="10"
                   id={"capa-grupo-"+grupo.nombre} key={"capa-grupo-"+grupo.nombre}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "capa", e.target.value)}/>
        </div>

        <div className="mb-3">
            <label htmlFor="exampleFormControlInput1" className="form-label">Color</label>
            <input type="color" className="form-control" value={grupo.color}
                   onChange={(e)=>cambioPropiedadGrupo(grupo.nombre, "color", e.target.value)}
                   id={"color-grupo-"+grupo.nombre}/>
        </div>
    </div>)
}

export default PropiedadGrupoFiguras;