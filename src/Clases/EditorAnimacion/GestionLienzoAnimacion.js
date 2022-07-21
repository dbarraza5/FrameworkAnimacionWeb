
class GestionLienzoAnimacion{
    constructor(){
        this.canvas = document.getElementById("lienzo-animacion");
        this.x = 0;
        this.y = 0;
        //console.log(this.canvas)
        //this.canvas.addEventListener('mousemove', eventMoveMouse)//.on("mousemove", eventMoveMouse);
    }

    actualizarLienzo(animacion){
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const lista_grupo_root = animacion.grupos_figuras.filter((g)=>g.nodo_padre==="root")
        for(let i=0; i<lista_grupo_root.length; i++){
            const grupo = lista_grupo_root[i]
            for(let j=0; j<grupo.lista_figuras.length; j++){
                const figura = grupo.lista_figuras[j];
                if(figura.tipo_figura === "RECTA"){
                    const x1 = parseInt(figura.atributos.x1)+parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y1 = parseInt(figura.atributos.y1)+parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    const x2 = parseInt(figura.atributos.x2)+parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y2 = parseInt(figura.atributos.y2)+parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = grupo.color;
                    ctx.stroke();
                    /*console.log(x1)
                    console.log(y1)
                    console.log(x2)
                    console.log(y2)*/
                }
            }
        }
    }
};

export default GestionLienzoAnimacion