//const {canvas} = require("canvas");

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function eventMoveMouse(e){
    let pos = getMousePos(document.getElementById("lienzo-editor"), e);
    let x1 = parseInt(pos.x);
    let y1 = parseInt(pos.y);
    //console.log(x1, y1)
    //lienzo.moverElemento(x1, y1);
}

class GestionLienzo {
    constructor() {
        this.canvas = document.getElementById("lienzo-editor");
        //document.getElementById("lienzo-editor");;
        //this.ctx = this.canvas.getContext('2d');
        this.mostrar_objs = true;
        this.mostrar_mods = true;
        this.mostrar_coordenadas = true;
        this.x = 0;
        this.y = 0;
        //this.canvas.addEventListener('mousemove', eventMoveMouse)//.on("mousemove", eventMoveMouse);
        this.id_seleccionado="psnj18";
    }

    moverElemento(x1 , y1) {
        let objeto = this.listado_objetos.find(obj_ => obj_.ID === this.id_seleccionado);
        let config = this.config_meta.find(conf_ => conf_.nombre === objeto.TIPO);
        objeto["atributos"]["x"] = x1;
        objeto["atributos"]["y"] = y1;
        //setPropiedadObjeto(this.id_seleccionado);
        this.actualizarLienzo();
        //console.log("x: "+ x1+ " y: "+ y1);
    }

    actualizarLienzo(listado_objetos, config_meta) {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < listado_objetos.length; i++) {
            let obj = listado_objetos[i];
            if (obj["TIPO"] === "PERSONAJE" || obj["TIPO"] === "PLATAFORMA") {
                let x = obj["atributos"]["x"];
                let y = obj["atributos"]["y"];
                let ancho = obj["atributos"]["ancho"];
                let largo = obj["atributos"]["largo"];

                ctx.fillStyle = obj["TIPO"] === "PERSONAJE" ? 'blue' : 'red'
                ctx.fillRect(x, y, ancho, largo)
            }
        }
    }
}

export default GestionLienzo