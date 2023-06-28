function obtenerPuntosGrupo(grupo){
    let x, y;
    let lista_puntos = [];
    for (let j = 0; j < grupo.lista_figuras.length; j++) {
        const figura = grupo.lista_figuras[j];

        if (figura.tipo_figura === "PUNTO") {
            x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
        }

        /*if (figura.tipo_figura === "PUNTO") {
            imprimir_punto(ctx, figura, grupo, color_figura, seleccion);
        }

        if (figura.tipo_figura === "CIRCULO") {
            imprimir_circulo(ctx, figura, grupo, color_figura, seleccion);
        }*/
        lista_puntos.push({
            x: x,
            y: y
        })
    }
    return lista_puntos;
}

function pintarGrupo(ctx, grupo) {
    const lista_puntos = obtenerPuntosGrupo(grupo)
    const color = grupo.color;

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Color de relleno (rojo semitransparente en este caso)
    ctx.lineWidth = 2; // Grosor de la línea de contorno


    for(let i = 0; i < lista_puntos.length; i++){
        const punto_act = lista_puntos[i];
        //dibujar_linea(ctx, color, punto_act.x, punto_act.y, punto_sig.x, punto_sig.y )
        if (i === 0) {
            ctx.moveTo(punto_act.x, punto_act.y);
        } else {
            ctx.lineTo(punto_act.x, punto_act.y);
        }
    }

    ctx.closePath();
    ctx.stroke();

// Rellenar el interior con otro color
    ctx.fill();
}


function imprimirListaGrupos(ctx, lista_grupo_root, id_grupo_selec, id_figura_selec, lista_id_figuras,
                             p_centro, p1_recta, p2_recta, p_circulo){
    for (let i = 0; i < lista_grupo_root.length; i++) {
        const grupo = lista_grupo_root[i]
        for (let j = 0; j < grupo.lista_figuras.length; j++) {
            const figura = grupo.lista_figuras[j];
            let seleccion = null;
            let color_figura = grupo.color;

            seleccion = grupo.nombre === id_grupo_selec && figura.nombre === id_figura_selec;
            if(lista_id_figuras.includes(figura.nombre)){
                color_figura = "#ff00a1";
            }
            if (figura.tipo_figura === "RECTA") {
                imprimir_recta(ctx, figura, grupo, color_figura,p1_recta, p2_recta, p_centro,
                    seleccion);
            }

            if (figura.tipo_figura === "PUNTO") {
                imprimir_punto(ctx, figura, grupo, color_figura, p_centro, seleccion);
            }

            if (figura.tipo_figura === "CIRCULO") {
                imprimir_circulo(ctx, figura, grupo, color_figura, p_circulo, p_centro, seleccion);
            }

        }
    }
}

function imprimirGrupoPintado(ctx, grupo){
    for (let j = 0; j < grupo.lista_figuras.length; j++) {
        const figura = grupo.lista_figuras[j];
        let seleccion = null;
        let color_figura = grupo.color;

        if (figura.tipo_figura === "RECTA") {
            imprimir_recta(ctx, figura, grupo, color_figura);
        }

        if (figura.tipo_figura === "PUNTO") {
            imprimir_punto(ctx, figura, grupo, color_figura);
        }

        if (figura.tipo_figura === "CIRCULO") {
            imprimir_circulo(ctx, figura, grupo, color_figura);
        }
    }
}

function imprimir_recta(ctx, figura, grupo, color_, p1_recta, p2_recta, p_centro,
                        seleccion = false,color_seleccion = "#39ff14" ) {
    const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    dibujar_linea(ctx, color_, x1, y1, x2, y2)

    if (seleccion) {
        dibujar_rectangulo(ctx, color_seleccion, p1_recta.x, p1_recta.y,
            p1_recta.w, p1_recta.h)

        dibujar_rectangulo(ctx, color_seleccion, p2_recta.x, p2_recta.y,
            p2_recta.w, p2_recta.h)

        dibujar_rectangulo(ctx, color_seleccion, p_centro.x, p_centro.y,
            p_centro.w, p_centro.h)
    }
}

function imprimir_circulo(ctx, figura, grupo, color_, p_circulo, p_centro, seleccion = false,
                          color_seleccion = "#39ff14") {
    const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    const rx = parseInt(figura.atributos.radiox);
    const ry = parseInt(figura.atributos.radioy);
    dibujar_circulo(ctx, color_, x, y, rx, ry);

    if (seleccion) {
        dibujar_rectangulo(ctx, color_seleccion, p_circulo.x, p_circulo.y,
            p_circulo.w, p_circulo.h)
        dibujar_rectangulo(ctx, color_seleccion, p_centro.x, p_centro.y,
            p_centro.w, p_centro.h)
    }

}

function imprimir_punto(ctx, figura, grupo, color_, p_centro,
                        seleccion = false, color_seleccion = "#39ff14") {
    const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    dibujar_punto(ctx, color_, x, y, 2)
    if (seleccion) {
        //this.actualizarPuntoCentro(figura, grupo)
        dibujar_rectangulo(ctx, color_seleccion, p_centro.x, p_centro.y,
            p_centro.w, p_centro.h)
    }
}

function dibujar_punto(ctx, color, x, y, size = 1) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    //ctx.stroke();
}

function dibujar_circulo(ctx, color, xc, yc, rx, ry) {
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

    function zoomLocalizacion() {
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function dibujar_linea_segmentada(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
}

function dibujar_rectangulo(ctx, color, x, y, w, h) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
}


export {pintarGrupo, imprimirListaGrupos, imprimirGrupoPintado,imprimir_recta, imprimir_circulo, imprimir_punto,
    dibujar_punto, dibujar_circulo, dibujar_linea, dibujar_rectangulo, dibujar_linea_segmentada};