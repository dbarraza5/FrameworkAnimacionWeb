

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
        console.log(e.buttons)
        console.log("levantar click")
        props.lienzo.mouse_click_down=false;
        props.lienzo.mouse_click_up=true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseDown=(e)=>{
        console.log(e.buttons)
        console.log("apretar click")
        props.lienzo.mouse_click_down=true;
        props.lienzo.mouse_click_up=false;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseEntrada=(e)=>{
        console.log("entrada al lienzo")
        props.lienzo.mouse_sobre_lienzo = true;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    const eventoMouseSalida=(e)=>{
        console.log("salida al lienzo")
        props.lienzo.mouse_sobre_lienzo = false;
        props.lienzo.mouse_mueve_sobre_lienzo = false;
        props.setEventLienzoFigura(props.lienzo);
        props.editar_animacion()
    }

    return(<canvas {...props}
                   onMouseMove={(e)=>eventoMouseMove(e)}
                   onMouseUp={(e)=>eventoMouseUp(e)}
                   onMouseDown={(e)=>eventoMouseDown(e)}
                   onMouseOver={(e)=>eventoMouseEntrada(e)}
                   onMouseOut={(e)=>eventoMouseSalida(e)}
                   width="600" height="600" style={style}></canvas>)
}

export default Lienzo