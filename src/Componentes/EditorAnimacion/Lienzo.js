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

        //console.log("levantar click")
        //console.log(e.button)
        //console.log(e.buttons)
        props.lienzo.mouse_click_down=false;
        props.lienzo.mouse_click_up=true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseDown=(e)=>{

        //console.log("apretar click")
        //console.log(e.button)
        //console.log(e.buttons)
        props.lienzo.mouse_type_button = e.button
        // punto exacto donde se presiono (el lienzo procesa ~10 veces por segundo: si
        // se presiona y suelta dentro del mismo cuadro, mouse_x ya seria el de soltar)
        const rect_down = e.target.getBoundingClientRect();
        props.lienzo.mouse_down_x = e.clientX - rect_down.left;
        props.lienzo.mouse_down_y = e.clientY - rect_down.top;
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
        // foco al canvas sobre el que entro el mouse (antes siempre "lienzo-animacion",
        // lo que en el editor de eventos le quitaba el teclado al lienzo de eventos)
        if(e.target && e.target.focus) e.target.focus({preventScroll: true});
    }

    const eventoMouseSalida=(e)=>{
        //console.log("salida al lienzo")
        props.lienzo.mouse_sobre_lienzo = false;
        props.lienzo.mouse_mueve_sobre_lienzo = false;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
        props.lienzo.stack_event_teclado = []
    }

    const eventoKeyDown=(e)=>{
        const name = e.key;
        const  code = e.code;
        // Ctrl+D (duplicar en el lienzo) no debe abrir "agregar marcador" del navegador
        if((e.ctrlKey || e.metaKey) && code === "KeyD") e.preventDefault();
        // cola de pulsaciones: no se pierden aunque se suelten antes del proximo cuadro
        if(!e.repeat){
            props.lienzo.cola_teclas = (props.lienzo.cola_teclas || []).concat(
                {code, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey});
        }
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


    // solo los atributos HTML van al <canvas>; lienzo/editar_animacion/
    // setEventLienzoFigura son props del componente (React avisaba en consola)
    const {lienzo, editar_animacion, setEventLienzoFigura, ...atributos_canvas} = props;
    return(<canvas {...atributos_canvas}
                   autoFocus
                   onKeyDown={(e)=>eventoKeyDown(e)}
                   onKeyUp={(e)=>eventoKeyUp(e)}
                   onMouseMove={(e)=>eventoMouseMove(e)}
                   onMouseUp={(e)=>eventoMouseUp(e)}
                   onMouseDown={(e)=>eventoMouseDown(e)}
                   onMouseOver={(e)=>eventoMouseEntrada(e)}
                   onMouseOut={(e)=>eventoMouseSalida(e)}
                   tabIndex={0}
                   onWheel={manejarRueda}
                   width="600" height="600" style={props.style || style}></canvas>)
}

export default Lienzo