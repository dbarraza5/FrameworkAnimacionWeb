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


function imprimir_recta(ctx, figura, grupo, color_) {
    const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    dibujar_linea(ctx, color_, x1, y1, x2, y2)
}

function imprimir_circulo(ctx, figura, grupo, color_) {
    const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    const rx = parseInt(figura.atributos.radiox);
    const ry = parseInt(figura.atributos.radioy);
    dibujar_circulo(ctx, color_, x, y, rx, ry)
}

function imprimir_punto(ctx, figura, grupo, color_) {
    const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
    const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
    dibujar_punto(ctx, color_, x, y, 2)
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


export default pintarGrupo;