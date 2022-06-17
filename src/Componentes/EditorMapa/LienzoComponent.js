const {Component} = require("react");
const style = {
    border: "1px solid black"
}
const getMousePos = (canvas, evt)=> {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
class LienzoComponent extends Component{
    render() {
        return (
            <canvas id="lienzo-editor" onMouseMove={(e)=>this.props.eventMoveMouse(e)}
                    width="600" height="600" style={style}></canvas>
        );
    }
}

export {LienzoComponent, getMousePos}