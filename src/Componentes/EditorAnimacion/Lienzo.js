import {useEffect, useRef} from "react";


const style = {

}
function Lienzo(props){

    const eventoMouseMove=(e)=>{
        const canvas = e.target
        let rect = canvas.getBoundingClientRect();
        const x = parseInt(e.clientX - rect.left);
        const y = parseInt(e.clientY - rect.top);
        props.lienzo.mouse_x=x;
        props.lienzo.mouse_y=y;
        props.lienzo.mouse_mueve_sobre_lienzo = true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
        //console.log(x ,y)
    }

    const eventoMouseUp=(e)=>{

        console.log("levantar click")
        console.log(e.button)
        console.log(e.buttons)
        props.lienzo.mouse_click_down=false;
        props.lienzo.mouse_click_up=true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseDown=(e)=>{

        console.log("apretar click")
        console.log(e.button)
        console.log(e.buttons)
        props.lienzo.mouse_type_button = e.button
        props.lienzo.mouse_click_down=true;
        props.lienzo.mouse_click_up=false;
        props.lienzo.mouse_only_click = true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseEntrada=(e)=>{
        //console.log("entrada al lienzo")
        props.lienzo.mouse_sobre_lienzo = true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
        document.getElementById("lienzo-animacion").focus();
    }

    const eventoMouseSalida=(e)=>{
        console.log("salida al lienzo")
        props.lienzo.mouse_sobre_lienzo = false;
        props.lienzo.mouse_mueve_sobre_lienzo = false;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
        props.lienzo.stack_event_teclado = []
    }

    const eventoKeyDown=(e)=>{
        const name = e.key;
        const  code = e.code;
        if(!props.lienzo.stack_event_teclado.includes(code)){
            props.lienzo.stack_event_teclado.push(code)

        }
        //console.log(props.lienzo.stack_event_teclado)
        //console.log("key: "+code)
        props.editar_animacion()
    }

    const eventoKeyUp=(e)=>{
        const name = e.key;
        const  code = e.code;
        //console.log(name)
        //console.log(code)
        props.lienzo.stack_event_teclado = props.lienzo.stack_event_teclado.filter((v)=>v!==code)
        props.editar_animacion()
    }

    const manejarRueda = (event) => {
        const movimiento = event.deltaY;
        props.lienzo.mouse_delta_scroll = movimiento;
        //console.log("EL RATON RATON: ",movimiento);
    }


    return(<canvas {...props}
                   autofocus
                   onKeyDown={(e)=>eventoKeyDown(e)}
                   onKeyUp={(e)=>eventoKeyUp(e)}
                   onMouseMove={(e)=>eventoMouseMove(e)}
                   onMouseUp={(e)=>eventoMouseUp(e)}
                   onMouseDown={(e)=>eventoMouseDown(e)}
                   onMouseOver={(e)=>eventoMouseEntrada(e)}
                   onMouseOut={(e)=>eventoMouseSalida(e)}
                   tabindex='0'

                   onWheel={manejarRueda}
                   width="600" height="600" style={style}></canvas>)
}

export default Lienzo