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


class GestionLienzoAnimacion {

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

    puntero_seleccion = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    }

    seleccion_figuras = false;

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

    constructor() {
        this.id_canvas = "lienzo-animacion"
        this.x = 0;
        this.y = 0;
    }

    seleccionarFiguraMover(nombre_figura_, nombre_grupo_) {
        this.categoria_trabajo = TRABAJO_FIGURA;
        this.id_grupo_selec = nombre_grupo_;
        this.id_figura_selec = nombre_figura_;
        this.mover_figura = MOVER_CENTRO_FIGURA;
    }

    procesarSeleccionPuntero(eventoLienzoFigura, animacion){
        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;

        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        console.log(this.mover_figura)
        if (this.mover_figura === MOVER_NADA) {//this.categoria_trabajo === TRABAJO_NONE
            console.log("SELECIONAR ALGO ")
            if (eventoLienzoFigura.mouse_sobre_lienzo) {
                if (eventoLienzoFigura.mouse_click_down) {
                    if (eventoLienzoFigura.mouse_only_click) {
                        this.puntero_seleccion.x = eventoLienzoFigura.mouse_x;
                        this.puntero_seleccion.y = eventoLienzoFigura.mouse_y;
                        this.seleccion_figuras = true;
                        this.lista_id_figuras = []
                    }
                    this.puntero_seleccion.w = eventoLienzoFigura.mouse_x - this.puntero_seleccion.x;
                    this.puntero_seleccion.h = eventoLienzoFigura.mouse_y - this.puntero_seleccion.y;
                    console.log("apretar mouse")
                    console.log(this.puntero_seleccion)
                    //this.actualizarLienzo(animacion)
                }
                if (eventoLienzoFigura.mouse_click_up) {
                    console.log("desapretar mouse")
                    this.seleccion_figuras = false
                    if(this.lista_id_figuras.length == 1){
                        console.log(this.puntero_seleccion)
                        this.seleccionarFiguraMover(this.lista_id_figuras[0], nombre_grupo)
                    }
                    //this.actualizarLienzo(animacion)
                }
            } else {
                this.seleccion_figuras = false
                //this.actualizarLienzo(animacion)
            }

        }

        if(this.seleccion_figuras) {
            if (nombre_grupo !== null) {
                const grupo = animacion.getGrupo(nombre_grupo)
                for (let j = 0; j < grupo.lista_figuras.length; j++) {
                    const figura = grupo.lista_figuras[j];
                    if (figura.tipo_figura === "RECTA") {
                        this.actualizarPuntosRectas(figura, grupo);
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        this.actualizarPuntoCentro(figura, grupo)
                    }

                    if (figura.tipo_figura === "CIRCULO") {
                        this.actualizarPuntosCirculo(figura, grupo)
                    }
                    if(rectsColliding(this.puntero_seleccion, this.p_centro)){
                        if(!this.lista_id_figuras.includes(figura.nombre)){
                            this.lista_id_figuras.push(figura.nombre);
                        }
                    }
                }
            }
        }
    }

    procesarTrabajoFigura(eventoLienzoFigura, animacion, setAnimacion){
        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;
        const grupo_ = animacion.getGrupo(nombre_grupo)
        let mover_centro_figura = false
        if (grupo_ != null) {
            const fig_ = animacion.get_figura(nombre_grupo, nombre_figura)

            if (fig_.tipo_figura === "RECTA" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosRectas(fig_, grupo_)
                if (rectsColliding(this.puntero, this.p1_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO1;
                } else if (rectsColliding(this.puntero, this.p2_recta)) {
                    this.mover_figura = MOVER_RECTA_PUNTO2;
                } else if (this.mover_figura !== MOVER_CENTRO_FIGURA) {

                    if (rectsColliding(this.puntero, this.p_centro)) {
                        this.mover_figura = MOVER_CENTRO_FIGURA;
                        mover_centro_figura = true;
                    }
                }
            }

            if (fig_.tipo_figura === "CIRCULO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntosCirculo(fig_, grupo_)
                if (rectsColliding(this.puntero, this.p_circulo)) {
                    this.mover_figura = MOVER_RADIO_CIRCULO;
                } else {
                    if (this.mover_figura !== MOVER_CENTRO_FIGURA) {
                        if (rectsColliding(this.puntero, this.p_centro)) {
                            this.mover_figura = MOVER_CENTRO_FIGURA;
                            mover_centro_figura = true;
                        }
                    }
                }
            }

            if (fig_.tipo_figura === "PUNTO" && eventoLienzoFigura.mouse_only_click) {
                this.actualizarPuntoCentro(fig_, grupo_)
                if (this.mover_figura !== MOVER_CENTRO_FIGURA && rectsColliding(this.puntero, this.p_centro)) {
                    this.mover_figura = MOVER_CENTRO_FIGURA;
                    mover_centro_figura = true;
                }
            }

            if (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2) {
                let x = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy - fig_.atributos.cy;
                if (this.mover_figura === MOVER_RECTA_PUNTO1) {
                    fig_.atributos["x1"] = x;
                    fig_.atributos["y1"] = y;

                } else {
                    fig_.atributos["x2"] = x;
                    fig_.atributos["y2"] = y;
                }
                animacion.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": animacion})
            }

            if (this.mover_figura === MOVER_RADIO_CIRCULO) {
                let radio_ = eventoLienzoFigura.mouse_x - grupo_.cx - fig_.atributos.cx;
                if (radio_ > 0) {
                    fig_.atributos["radiox"] = radio_;
                    fig_.atributos["radioy"] = radio_;
                    animacion.set_figura(nombre_grupo, fig_)
                    setAnimacion({"edicion": animacion})
                }
            }

            if (this.mover_figura === MOVER_CENTRO_FIGURA) {
                let x = eventoLienzoFigura.mouse_x - grupo_.cx;
                let y = eventoLienzoFigura.mouse_y - grupo_.cy;
                fig_.atributos["cx"] = x;
                fig_.atributos["cy"] = y;
                animacion.set_figura(nombre_grupo, fig_)
                setAnimacion({"edicion": animacion})
            }

            if (eventoLienzoFigura.mouse_click_up && (this.mover_figura === MOVER_RECTA_PUNTO1 || this.mover_figura === MOVER_RECTA_PUNTO2)) {
                this.mover_figura = MOVER_NADA;
            }

            if (eventoLienzoFigura.mouse_only_click && this.mover_figura === MOVER_CENTRO_FIGURA && mover_centro_figura == false) {
                this.mover_figura = MOVER_NADA;
            }
            if (eventoLienzoFigura.mouse_click_up && this.mover_figura === MOVER_RADIO_CIRCULO) {
                this.mover_figura = MOVER_NADA;
            }
        }
    }

    procesarEventoLienzo(eventoLienzoFigura, animacion, setAnimacion) {


        if (this.categoria_trabajo === TRABAJO_FIGURA) {
            this.procesarTrabajoFigura(eventoLienzoFigura, animacion, setAnimacion)
        }

        this.procesarSeleccionPuntero(eventoLienzoFigura, animacion);
    }

    actualizarPuntoCentro(fig_, grupo_) {
        const x = parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y = parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        this.p_centro.x = x - 2
        this.p_centro.y = y - 2
    }

    actualizarPuntosCirculo(fig_, grupo_) {
        const x = parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y = parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        const rx = parseInt(fig_.atributos.radiox);

        this.p_circulo.x = x + rx + 2
        this.p_circulo.y = y - 2

        this.p_centro.x = x - 2
        this.p_centro.y = y - 2
    }

    actualizarPuntosRectas(fig_, grupo_) {
        const x1 = parseInt(fig_.atributos.x1) + parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y1 = parseInt(fig_.atributos.y1) + parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);
        const x2 = parseInt(fig_.atributos.x2) + parseInt(fig_.atributos.cx) + parseInt(grupo_.cx);
        const y2 = parseInt(fig_.atributos.y2) + parseInt(fig_.atributos.cy) + parseInt(grupo_.cy);

        this.p1_recta.x = x1 - this.p1_recta.w / 2;
        this.p1_recta.y = y1 - this.p1_recta.h / 2;

        this.p2_recta.x = x2 - this.p2_recta.w / 2;
        this.p2_recta.y = y2 - this.p2_recta.h / 2;

        this.p_centro.x = parseInt((x1 + x2) / 2) - 2
        this.p_centro.y = parseInt((y1 + y2) / 2) - 2
    }

    imprimir_recta(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        dibujar_linea(ctx, color_, x1, y1, x2, y2)
        if (seleccion) {
            this.actualizarPuntosRectas(figura, grupo)
            dibujar_rectangulo(ctx, color_seleccion, this.p1_recta.x, this.p1_recta.y,
                this.p1_recta.w, this.p1_recta.h)

            dibujar_rectangulo(ctx, color_seleccion, this.p2_recta.x, this.p2_recta.y,
                this.p2_recta.w, this.p2_recta.h)

            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    imprimir_circulo(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        const rx = parseInt(figura.atributos.radiox);
        const ry = parseInt(figura.atributos.radioy);
        bibujar_circulo(ctx, color_, x, y, rx, ry)
        this.actualizarPuntosCirculo(figura, grupo)
        if (seleccion) {
            dibujar_rectangulo(ctx, color_seleccion, this.p_circulo.x, this.p_circulo.y,
                this.p_circulo.w, this.p_circulo.h)
            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    imprimir_punto(ctx, figura, grupo, color_, seleccion = false, color_seleccion = "#39ff14") {
        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
        dibujar_punto(ctx, color_, x, y)
        if (seleccion) {
            this.actualizarPuntoCentro(figura, grupo)
            dibujar_rectangulo(ctx, color_seleccion, this.p_centro.x, this.p_centro.y,
                this.p_centro.w, this.p_centro.h)
        }
    }

    actualizarLienzo(animacion) {
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lista_grupo_root = animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        for (let i = 0; i < lista_grupo_root.length; i++) {
            const grupo = lista_grupo_root[i]
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                let seleccion = null;
                let color_figura = grupo.color;
                if (this.categoria_trabajo === TRABAJO_FIGURA) {
                    seleccion = grupo.nombre === this.id_grupo_selec && figura.nombre === this.id_figura_selec;
                    if(this.lista_id_figuras.includes(figura.nombre)){
                        color_figura = "#ff00a1";
                    }
                    if (figura.tipo_figura === "RECTA") {
                        this.imprimir_recta(ctx, figura, grupo, color_figura, seleccion);
                    }

                    if (figura.tipo_figura === "PUNTO") {
                        this.imprimir_punto(ctx, figura, grupo, color_figura, seleccion);
                    }

                    if (figura.tipo_figura === "CIRCULO") {
                        this.imprimir_circulo(ctx, figura, grupo, color_figura, seleccion);
                    }
                }
            }
        }
        if (this.seleccion_figuras) {
            dibujar_rectangulo(ctx, "#1447ff", this.puntero_seleccion.x, this.puntero_seleccion.y,
                this.puntero_seleccion.w, this.puntero_seleccion.h)
        }

    }
};

function dibujar_punto(ctx, color, x, y) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
    //ctx.stroke();
}

function bibujar_circulo(ctx, color, xc, yc, rx, ry) {
    let x = 0;
    let y = ry;
    const rx2 = Math.pow(rx, 2);
    const ry2 = Math.pow(ry, 2);
    let p1 = ry2 - (rx2 * ry) + (0.25 * rx2);
    while ((ry2 * x) < (rx2 * y)) {
        if (p1 < 0) {
            x++;
            p1 = p1 + (2 * ry2 * x) + ry2;
        } else {
            x++;
            y--;
            p1 = p1 + (2 * ry2 * x) - (2 * rx2 * y) + ry2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
        /*grupoPixeles.push_back(unPixel(xc+x, yc+y));
        grupoPixeles.push_back(unPixel(xc-x, yc+y));
        grupoPixeles.push_back(unPixel(xc+x, yc-y));
        grupoPixeles.push_back(unPixel(xc-x, yc-y));*/
    }
    let p2 = (ry2) * Math.pow((x + 0.5), 2) + (rx2) * Math.pow((y - 1), 2) - (rx2 * ry2);
    while (y > 0) {
        if (p2 > 0) {
            y--;
            p2 = p2 - (2 * rx2 * y) + rx2;
        } else {
            x++;
            y--;
            p2 = p2 + (2 * ry2 * x) - (2 * rx2 * y) + rx2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function dibujar_rectangulo(ctx, color, x, y, w, h) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
}

function rectsColliding(r1, r2) {
    return !(r1.x > r2.x + r2.w || r1.x + r1.w < r2.x || r1.y > r2.y + r2.h || r1.y + r1.h < r2.y);
}

export default GestionLienzoAnimacion