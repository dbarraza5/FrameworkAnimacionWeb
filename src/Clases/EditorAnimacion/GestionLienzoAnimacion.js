const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_LISTA_FIGURAS = 1;
const TRABAJO_GRUPO = 2;
const TRABAJO_GRUPOS = 3;

const MOVER_NADA = 0
const MOVER_CENTRO_FIGURA = 1;
const MOVER_RECTA_PUNTO1 = 2;
const MOVER_RECTA_PUNTO2 = 3;
const MOVER_RADIO_CIRCULO = 4;

const MOVER_CENTROS_FIGURAS = 5;
const MOVER_ROTAR_FIGURAS = 6;
const MOVER_INFLAR_FIGURAS = 7;


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

    mover_centros = {
        centro_x: 0,
        centro_y: 0,
        inf_hor: 0,
        sup_hor: 0,
        inf_ver: 0,
        sup_ver: 0,
        ancho: 0,
        alto: 0,
    }

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

    seleccionarFigurasTransformar(nombre_grupo_) {
        this.categoria_trabajo = TRABAJO_LISTA_FIGURAS;
        this.id_grupo_selec = nombre_grupo_;
        //this.id_figura_selec = nombre_figura_;
        //this.mover_figura = MOVER_CENTRO_FIGURA;
    }

    procesarSeleccionPuntero(eventoLienzoFigura, animacion){
        let nombre_grupo = this.id_grupo_selec;
        let nombre_figura = this.id_figura_selec;

        this.puntero.x = eventoLienzoFigura.mouse_x;
        this.puntero.y = eventoLienzoFigura.mouse_y;
        console.log(this.mover_figura)
        if (this.mover_figura === MOVER_NADA) {//this.categoria_trabajo === TRABAJO_NONE
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
                    console.log(this.puntero_seleccion)
                }
                if (eventoLienzoFigura.mouse_click_up) {
                    if(this.lista_id_figuras.length == 1 && this.seleccion_figuras){
                        console.log(this.puntero_seleccion)
                        this.seleccion_figuras = false
                        this.seleccionarFiguraMover(this.lista_id_figuras[0], nombre_grupo)
                    }
                    if(this.lista_id_figuras.length>1 && this.seleccion_figuras){
                        this.seleccion_figuras = false
                        this.seleccionarFigurasTransformar(nombre_grupo)
                    }
                }
            } else {
                this.seleccion_figuras = false
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
                        console.log("COLISION!!!!")
                        console.log(this.puntero_seleccion)
                        if(!this.lista_id_figuras.includes(figura.nombre)){
                            this.lista_id_figuras.push(figura.nombre);
                        }
                    }
                }
            }
        }
        this.actualizarLienzo(animacion)
    }

    procesarTrabajoListaFiguras(eventoLienzoFigura, animacion, setAnimacion){

        if(eventoLienzoFigura.stack_event_teclado.includes("KeyQ")){
            if(eventoLienzoFigura.stack_event_teclado.includes("KeyE")){
                this.mover_figura = MOVER_CENTROS_FIGURAS;
            }
        }

        if(this.mover_figura === MOVER_CENTROS_FIGURAS){
            console.log("MOVER GRUPO DE FIGURAS")
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

        if (this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){
            this.procesarTrabajoListaFiguras(eventoLienzoFigura, animacion, setAnimacion)
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
                if (this.categoria_trabajo === TRABAJO_FIGURA || this.categoria_trabajo === TRABAJO_LISTA_FIGURAS) {
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
            console.log(this.seleccion_figuras)
            dibujar_rectangulo(ctx, "#1447ff", this.puntero_seleccion.x, this.puntero_seleccion.y,
                this.puntero_seleccion.w, this.puntero_seleccion.h)
        }

        if(this.categoria_trabajo === TRABAJO_LISTA_FIGURAS){

            this.calcularCenTroFiguras(animacion)
            console.log(this.lista_id_figuras)
            console.log(this.mover_centros)
            dibujar_rectangulo(ctx, "#14f7ff", this.mover_centros.inf_hor, this.mover_centros.inf_ver,
                this.mover_centros.ancho, this.mover_centros.alto)
            dibujar_rectangulo(ctx, "#14f7ff", this.mover_centros.centro_x, this.mover_centros.centro_y,
                this.p_centro.w, this.p_centro.h)
        }

    }

    calcularCenTroFiguras(animacion) {
        let nombre_grupo = this.id_grupo_selec;
        const grupo = animacion.getGrupo(nombre_grupo)
        if (grupo != null) {
            let inf_hor = Number.POSITIVE_INFINITY;
            let inf_ver = Number.POSITIVE_INFINITY;
            let sup_hor = Number.NEGATIVE_INFINITY;
            let sup_ver = Number.NEGATIVE_INFINITY;
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                if (this.lista_id_figuras.includes(figura.nombre)){


                    if (figura.tipo_figura === "RECTA") {
                        const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        console.log(x1, y1)
                        if(inf_hor > x1){
                            inf_hor = x1
                        }
                        if(sup_hor < x1){
                            sup_hor = x1
                        }

                        if(inf_hor > x2){
                            inf_hor = x2
                        }
                        if(sup_hor < x2){
                            sup_hor = x2
                        }
                        //----------------------------------------
                        if(inf_ver > y1){
                            inf_ver = y1
                        }
                        if(inf_ver > y2){
                            inf_ver = y2
                        }

                        if(sup_ver < y1){
                            sup_ver = y1
                        }
                        if(sup_ver < y2){
                            sup_ver = y2
                        }

                    }

                    if (figura.tipo_figura === "PUNTO") {
                        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        if(inf_hor > x){
                            inf_hor = x
                        }
                        if(sup_hor < x){
                            sup_hor = x
                        }
                        if(inf_ver > y){
                            inf_ver = y
                        }
                        if(sup_ver < y){
                            sup_ver = y
                        }
                    }

                    if (figura.tipo_figura === "CIRCULO") {

                        const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx);
                        const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy);
                        const rx = parseInt(figura.atributos.radiox);
                        const ry = parseInt(figura.atributos.radioy);
                        if(inf_hor > x-rx){
                            inf_hor = x-rx
                        }
                        if(sup_hor < x+rx){
                            sup_hor = x+rx
                        }
                        if(inf_ver > y-ry){
                            inf_ver = y-ry
                        }
                        if(sup_ver < y+ry){
                            sup_ver = y+ry
                        }
                    }
                }
            }
            console.log("inforrr: ",inf_hor)
            this.mover_centros.inf_hor = inf_hor;
            this.mover_centros.sup_hor = sup_hor;
            this.mover_centros.inf_ver = inf_ver;
            this.mover_centros.sup_ver = sup_ver;
            this.mover_centros.ancho = (sup_hor-inf_hor);
            this.mover_centros.alto = (sup_ver-inf_ver);
            this.mover_centros.centro_x = inf_hor+(sup_hor-inf_hor)/2;
            this.mover_centros.centro_y = inf_ver+(sup_ver-inf_ver)/2;
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
    if(r1.w === 0 || r1.h === 0 || r2.w === 0 || r2.h === 0){
        return false;
    }
   let r_1 = {...r1}
   if(r_1.w < 0){
       r_1.x+=r_1.w;
       r_1.w = r_1.w*-1
    }

    if(r_1.h < 0){
        r_1.y+=r_1.h;
        r_1.h = r_1.h*-1
    }

    return !(r_1.x > r2.x + r2.w || r_1.x + r_1.w < r2.x || r_1.y > r2.y + r2.h || r_1.y + r_1.h < r2.y);
}

export default GestionLienzoAnimacion