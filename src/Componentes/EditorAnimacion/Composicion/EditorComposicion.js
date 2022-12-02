import {useEffect, useState} from "react";



function EditorCompisicion(props){

    const obtener_animacion=()=>{
        console.log("obtener animacion")
        const a1 = props.animacion.getDatosAnimacion()
        //console.log(a1)
        const lista = [];
        props.animacion.listaOrdenadasGrupos(lista)
        console.log(lista)
    }


    return <div>
        <button onClick={obtener_animacion}> animacion </button>
    </div>
}


export default EditorCompisicion