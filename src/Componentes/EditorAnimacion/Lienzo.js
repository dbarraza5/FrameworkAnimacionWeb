

const style = {

}
function Lienzo(props){

    const eventoMouseMove=(e)=>{
        const canvas = e.target
        let rect = canvas.getBoundingClientRect();
        const x = parseInt(e.clientX - rect.left);
        const y = parseInt(e.clientY - rect.top);
        //console.log(x ,y)
    }

    const eventoMouseUp=(e)=>{
        console.log(e.buttons)
        console.log("levantar click")
    }

    const eventoMouseDown=(e)=>{
        console.log(e.buttons)
        console.log("apretar click")
    }

    const eventoMouseEntrada=(e)=>{
        console.log("entrada al lienzo")
    }

    const eventoMouseSalida=(e)=>{
        console.log("salida al lienzo")
    }

    return(<canvas id="lienzo-animacion"
                   onMouseMove={(e)=>eventoMouseMove(e)}
                   onMouseUp={(e)=>eventoMouseUp(e)}
                   onMouseDown={(e)=>eventoMouseDown(e)}
                   onMouseOver={(e)=>eventoMouseEntrada(e)}
                   onMouseOut={(e)=>eventoMouseSalida(e)}
                   width="600" height="600" style={style}></canvas>)
}

export default Lienzo