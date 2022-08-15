
const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_FIGURAS = 1;
const TRABAJO_GRUPO = 2;
const TRABAJO_GRUPOS = 3;

const MOVER_NADA = 0
const MOVER_CENTRO_FIGURA = 1;
const MOVER_RECTA_PUNTO1 = 2;
const MOVER_RECTA_PUNTO2 = 3;
const MOVER_RADIO_CIRCULO = 4;


class GestionLienzoAnimacion{

    categoria_trabajo = TRABAJO_NONE;

    id_figura_selec = null;
    id_grupo_selec = null;

    lista_id_figuras = []

    puntero = {
        x: 0,
        y: 0,
        w: 10,
        h: 10
    }

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

    p_circulo = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    p_centro = {
        x: 0,
        y: 0,
        w: 5,
        h: 5
    }

    mover_figura = MOVER_NADA;

    constructor(){
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
        //this.var_1 = 9999
        //console.log(this.canvas)
        //this.canvas.addEventListener('mousemove', eventMoveMouse)//.on("mousemove", eventMoveMouse);

    }

    seleccionarFiguraMover(nombre_figura_, nombre_grupo_){
        this.categoria_trabajo = TRABAJO_FIGURA;
        this.id_grupo_selec = nombre_grupo_;
        this.id_figura_selec = nombre_figura_;
        this.mover_figura = MOVER_CENTRO_FIGURA;
    }

    procesarEventoLienzo(eventoLienzoFigura, animacion, setAnimacion){
        const nombre_grupo = this.id_grupo_selec;
        const nombre_figura = this.id_figura_selec;
        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;

        if(this.categoria_trabajo === TRABAJO_FIGURA){
            console.log("TRABAJO_FIGURA")
            const grupo_ = animacion.getGrupo(nombre_grupo)
            let mover_centro_figura = false
            if(grupo_ != null){
                const fig_ = animacion.get_figura(nombre_grupo, nombre_figura)

                if(fig_.tipo_figura === "RECTA" && eventoLienzoFigura.mouse_only_click){// && this.mover_figura === MOVER_NADA){
                    const x1 = parseInt(fig_.atributos.x1)+parseInt(fig_.atributos.cx) +parseInt(grupo_.cx);
                    const y1 = parseInt(fig_.atributos.y1)+parseInt(fig_.atributos.cy) +parseInt(grupo_.cy);
                    const x2 = parseInt(fig_.atributos.x2)+parseInt(fig_.atributos.cx) +parseInt(grupo_.cx);
                    const y2 = parseInt(fig_.atributos.y2)+parseInt(fig_.atributos.cy) +parseInt(grupo_.cy);
                    this.actualizarPuntosRectas(x1, y1, x2, y2)

                    if (rectsColliding(this.puntero, this.p1_recta)){
                        console.log("MOVER EL PUNTO 1")
                        this.mover_figura = MOVER_RECTA_PUNTO1;
                    }else
                    if (rectsColliding(this.puntero, this.p2_recta)){
                        console.log("MOVER EL PUNTO 2")
                        this.mover_figura = MOVER_RECTA_PUNTO2;
                    }else
                    if(this.mover_figura !== MOVER_CENTRO_FIGURA){
                        this.p_centro.x = parseInt((x1 + x2)/2)-2
                        this.p_centro.y = parseInt((y1 + y2)/2)-2
                        if (rectsColliding(this.puntero, this.p_centro)){
                            console.log("MOVER  RECTA")
                            this.mover_figura = MOVER_CENTRO_FIGURA;
                            mover_centro_figura = true;
                        }
                    }
                }

                if(fig_.tipo_figura === "CIRCULO" && eventoLienzoFigura.mouse_only_click){
                    const x = parseInt(fig_.atributos.cx) +parseInt(grupo_.cx);
                    const y = parseInt(fig_.atributos.cy) +parseInt(grupo_.cy);
                    const rx = parseInt(fig_.atributos.radiox);

                    this.p_circulo.x = x+rx+2
                    this.p_circulo.y = y-2

                    if (rectsColliding(this.puntero, this.p_circulo)){
                        console.log("MOVER RADIO CIRCULO")
                        this.mover_figura = MOVER_RADIO_CIRCULO;
                    }else{
                        if(this.mover_figura !== MOVER_CENTRO_FIGURA){
                            this.p_centro.x = x -2
                            this.p_centro.y = y -2
                            if (rectsColliding(this.puntero, this.p_centro)){
                                console.log("MOVER  CIRCULO")
                                this.mover_figura = MOVER_CENTRO_FIGURA;
                                mover_centro_figura = true;
                            }
                        }
                    }
                }

                if(fig_.tipo_figura === "PUNTO" && eventoLienzoFigura.mouse_only_click){
                    const x = parseInt(fig_.atributos.cx) +parseInt(grupo_.cx);
                    const y = parseInt(fig_.atributos.cy) +parseInt(grupo_.cy);
                    this.p_centro.x = x -2
                    this.p_centro.y = y -2
                    if (this.mover_figura !== MOVER_CENTRO_FIGURA && rectsColliding(this.puntero, this.p_centro)){
                        console.log("MOVER  PUNTO")
                        this.mover_figura = MOVER_CENTRO_FIGURA;
                        mover_centro_figura = true;
                    }
                }

                if(this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2){
                    let x = eventoLienzoFigura.mouse_x-grupo_.cx-fig_.atributos.cx;
                    let y = eventoLienzoFigura.mouse_y-grupo_.cy -fig_.atributos.cy;
                    if(this.mover_figura === MOVER_RECTA_PUNTO1){
                        fig_.atributos["x1"] = x;
                        fig_.atributos["y1"] = y;

                    }else{
                        fig_.atributos["x2"] = x;
                        fig_.atributos["y2"] = y;
                    }
                    animacion.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": animacion})
                }

                if(this.mover_figura === MOVER_RADIO_CIRCULO){
                    let radio_ = eventoLienzoFigura.mouse_x-grupo_.cx -fig_.atributos.cx;
                    if(radio_>0){
                        fig_.atributos["radiox"] = radio_;
                        fig_.atributos["radioy"] = radio_;
                        animacion.set_figura(nombre_grupo, fig_)
                        setAnimacion({"edicion": animacion})
                    }
                }

                if(this.mover_figura === MOVER_CENTRO_FIGURA ){
                    let x = eventoLienzoFigura.mouse_x-grupo_.cx;
                    let y = eventoLienzoFigura.mouse_y-grupo_.cy;
                    fig_.atributos["cx"] = x;
                    fig_.atributos["cy"] = y;
                    animacion.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": animacion})
                }

                if(eventoLienzoFigura.mouse_click_up && (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2)){
                    this.mover_figura = MOVER_NADA;
                }

                if(eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_CENTRO_FIGURA && mover_centro_figura == false){
                    this.mover_figura = MOVER_NADA;
                }
                if(eventoLienzoFigura.mouse_click_up && this.mover_figura === MOVER_RADIO_CIRCULO ){
                    this.mover_figura = MOVER_NADA;
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

                        this.p_centro.x = parseInt((x1 + x2)/2)-2
                        this.p_centro.y = parseInt((y1 + y2)/2)-2
                        dibujar_rectangulo(ctx, "#39ff14", this.p_centro.x, this.p_centro.y,
                            this.p_centro.w, this.p_centro.h)
                        //this->xc=(this->p1x+this->p2x)/2;
                        //this->yc=(this->p1y+this->p2y)/2;
                    }
                }

                if(figura.tipo_figura === "PUNTO"){
                    const x = parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y = parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    dibujar_punto(ctx, grupo.color, x, y)
                    if(grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec){
                        this.p_centro.x = x -2
                        this.p_centro.y = y -2
                        dibujar_rectangulo(ctx, "#39ff14", this.p_centro.x, this.p_centro.y,
                            this.p_centro.w, this.p_centro.h)
                    }
                }

                if(figura.tipo_figura === "CIRCULO"){
                    const x = parseInt(figura.atributos.cx) +parseInt(grupo.cx);
                    const y = parseInt(figura.atributos.cy) +parseInt(grupo.cy);
                    const rx = parseInt(figura.atributos.radiox);
                    const ry = parseInt(figura.atributos.radioy);
                    bibujar_circulo(ctx, grupo.color, x, y, rx, ry)

                    if(grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec){
                        this.p_circulo.x = x+rx
                        this.p_circulo.y = y-2
                        dibujar_rectangulo(ctx, "#39ff14", this.p_circulo.x, this.p_circulo.y,
                            this.p_circulo.w, this.p_circulo.h)


                        this.p_centro.x = x -2
                        this.p_centro.y = y -2
                        dibujar_rectangulo(ctx, "#39ff14", this.p_centro.x, this.p_centro.y,
                            this.p_centro.w, this.p_centro.h)
                    }
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

function rectsColliding(r1,r2){
    return !(r1.x>r2.x+r2.w || r1.x+r1.w<r2.x || r1.y>r2.y+r2.h || r1.y+r1.h<r2.y);
}

export default GestionLienzoAnimacion