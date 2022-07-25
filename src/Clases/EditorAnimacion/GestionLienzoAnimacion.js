
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
                    dibujar_linea(ctx, grupo.color, x1, y1, x2, y2)
                }

                if(figura.tipo_figura === "PUNTO"){
                    const x = parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y = parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    dibujar_punto(ctx, grupo.color, x, y)
                }

                if(figura.tipo_figura === "CIRCULO"){
                    const x = parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y = parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    const rx = parseInt(figura.atributos.radiox);
                    const ry = parseInt(figura.atributos.radioy);
                    bibujar_circulo(ctx, grupo.color, x, y, rx, ry)
                }
            }
        }
    }
};

function dibujar_punto(ctx, color, x, y){
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x,y,1,1);
    //ctx.stroke();
}

function bibujar_circulo(ctx, color, xc, yc, rx, ry){
    let x=0;
    let y=ry;
    const rx2=Math.pow(rx,2);
    const ry2=Math.pow(ry,2);
    let p1=ry2-(rx2*ry)+(0.25*rx2);
    while((ry2*x)<(rx2*y))
    {
        if(p1<0)
        { x++;
            p1=p1+(2*ry2*x)+ry2;
        }
        else
        {
            x++; y--;
            p1=p1+(2*ry2*x)-(2*rx2*y)+ry2;
        }
        dibujar_punto(ctx, color, xc+x, yc+y)
        dibujar_punto(ctx, color, xc-x, yc+y)
        dibujar_punto(ctx, color, xc+x, yc-y)
        dibujar_punto(ctx, color, xc-x, yc-y)
        /*grupoPixeles.push_back(unPixel(xc+x, yc+y));
        grupoPixeles.push_back(unPixel(xc-x, yc+y));
        grupoPixeles.push_back(unPixel(xc+x, yc-y));
        grupoPixeles.push_back(unPixel(xc-x, yc-y));*/
    }
    let p2=(ry2)*Math.pow((x+0.5),2)+(rx2)*Math.pow((y-1),2)-(rx2*ry2);
    while(y>0)
    {
        if (p2>0)
        {
            y--;
            p2=p2-(2*rx2*y) +rx2;
        }
        else
        {
            x++; y--;
            p2=p2+ (2*ry2*x)-(2*rx2*y)+rx2;
        }
        dibujar_punto(ctx, color, xc+x, yc+y)
        dibujar_punto(ctx, color, xc-x, yc+y)
        dibujar_punto(ctx, color, xc+x, yc-y)
        dibujar_punto(ctx, color, xc-x, yc-y)
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

export default GestionLienzoAnimacion