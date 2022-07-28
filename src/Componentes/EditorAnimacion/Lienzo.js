const style = {

}
function Lienzo(props){
    return(<canvas id="lienzo-animacion" onMouseMove={(e)=>1}
                   width="600" height="600" style={style}></canvas>)
}

export default Lienzo