
const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_FIGURAS = 1;
const TRABAJO_GRUPO = 2;
const TRABAJO_GRUPOS = 3;


class GestionLienzoAnimacion{

    categoria_trabajo = TRABAJO_NONE;

    id_figura_selec = null;
    id_grupo_selec = null;

    lista_id_figuras = []

    p1_recta = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    p2_recta = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    constructor(){
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
        //this.var_1 = 9999
        //console.log(this.canvas)
        //this.canvas.addEventListener('mousemove', eventMoveMouse)//.on("mousemove", eventMoveMouse);

    }

    procesarEventoLienzo(eventoLienzoFigura, animacion, setAnimacion){
        const nombre_grupo = this.id_grupo_selec;
        const nombre_figura = this.id_figura_selec;
        if(eventoLienzoFigura.mouse_click_down){
            if(this.categoria_trabajo === 0){
                const grupo_ = animacion.getGrupo(nombre_grupo)
                if(grupo_ != null){
                    const fig_ = animacion.get_figura(nombre_grupo, nombre_figura)
                    let x = eventoLienzoFigura.mouse_x-grupo_.cx;
                    let y = eventoLienzoFigura.mouse_y-grupo_.cy;
                    fig_.atributos["cx"] = x;
                    fig_.atributos["cy"] = y;
                    animacion.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": animacion})
                }
            }
        }
    }

    actualizarPuntosRectas(x1, y1, x2, y2){
        this.p1_recta.x = x1 - this.p1_recta.w/2;
        this.p1_recta.y = y1 - this.p1_recta.h/2;

        this.p2_recta.x = x2 - this.p2_recta.w/2;
        this.p2_recta.y = y2 - this.p2_recta.h/2;
    }

    actualizarLienzo(animacion){
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
                    if(grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec){
                        this.actualizarPuntosRectas(x1, y1, x2, y2)
                        dibujar_rectangulo(ctx, "#39ff14", this.p1_recta.x, this.p1_recta.y,
                            this.p1_recta.w, this.p1_recta.h)

                        dibujar_rectangulo(ctx, "#39ff14", this.p2_recta.x, this.p2_recta.y,
                            this.p2_recta.w, this.p2_recta.h)
                    }
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

function dibujar_rectangulo(ctx, color, x, y, w, h){
    ctx.beginPath();
    ctx.strokeStyle  = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
}

export default GestionLienzoAnimacion