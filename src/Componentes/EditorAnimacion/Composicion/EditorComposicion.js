import {useEffect, useState} from "react";



function EditorCompisicion(props){

    const obtener_animacion=()=>{
        console.log("obtener animacion")
        const a1 = props.animacion.getDatosAnimacion()
        console.log(a1)
    }


    return <div>
        <button onClick={obtener_animacion}> animacion </button>
    </div>
}


export default EditorCompisicion