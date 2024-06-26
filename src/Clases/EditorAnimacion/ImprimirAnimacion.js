import {getCoorPunto, getCoorRecta} from "./GestionAnimacion";

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
            if(lista_id_figuras.includes(figura.nombre) && id_grupo_selec === grupo.nombre){
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

function imprimirGrupoPintado(ctx, gestion_pintado){
    const grupo = gestion_pintado.grupo_copia

    if(gestion_pintado.indice_seleccion_pintado !== -1){
        if(gestion_pintado.pintar_todo){
            for(let i = 0; i<grupo.lista_pintado.length; i++){
                const pintura = grupo.lista_pintado[i];
                pintarDimensionGrupo(ctx, grupo, pintura, gestion_pintado.relleno_pintura)
            }
        }else{
            if(gestion_pintado.indice_seleccion_pintado>-1){
                const pintura = grupo.lista_pintado[gestion_pintado.indice_seleccion_pintado]
                pintarDimensionGrupo(ctx, grupo, pintura, gestion_pintado.relleno_pintura)
            }
        }
    }


    if(gestion_pintado.indice_seleccion_pintado !== -1)
    for (let j = 0; j < grupo.lista_figuras.length; j++) {
        const figura = grupo.lista_figuras[j];
        let seleccion = null;
        let color_figura = grupo.color;


        const pintura_ = grupo.lista_pintado[gestion_pintado.indice_seleccion_pintado];
        //const grupo_pintura = pintura_[gestion_pintado.indice_seleccion_grupo_pintado];
        let validar_p1 = null, validar_p2 = null;
        let validar_punto = null;
        for(let k=0; k<pintura_.elementos.length; k++ ){
            const componente_g = gestion_pintado.figuraSeleccionada(figura.nombre,
                gestion_pintado.indice_seleccion_pintado, k);


            if (figura.tipo_figura === "RECTA") {
                /*if(componente_g === null){
                    validar_p1= true;
                    validar_p2= true;
                }else{
                    if(validar_p1===true)
                    validar_p1 = !componente_g.includes("PUNTO1")
                    if(validar_p2 === true)
                    validar_p2 = !componente_g.includes("PUNTO2")
                }*/
                if(validar_p1 == null && componente_g === null){
                    validar_p1 = false;
                }else
                if(validar_p1 == null && componente_g !== null){
                    validar_p1 = componente_g.includes("PUNTO1")
                }else
                if(validar_p1 === false && componente_g !== null){
                    validar_p1 = componente_g.includes("PUNTO1")
                }

                if(validar_p2 == null && componente_g === null){
                    validar_p2 = false;
                }else
                if(validar_p2 == null && componente_g !== null){
                    validar_p2 = componente_g.includes("PUNTO2")
                }else
                if(validar_p2 === false && componente_g !== null){
                    validar_p2= componente_g.includes("PUNTO2")
                }

                const coor = getCoorRecta(figura, grupo)

                const color_cr1 = validar_p1? "#008000"  : "#ff0000";

                dibujar_rectangulo(ctx, color_cr1, coor.x1-4, coor.y1-4, 9, 9, true);

                const color_cr2 = validar_p2? "#008000"  : "#ff0000";
                dibujar_rectangulo(ctx, color_cr2, coor.x2-4, coor.y2-4, 9, 9, true);
                imprimir_recta(ctx, figura, grupo, color_figura);
                //console.log("dibujar_circulo");

                if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO1")){
                    dibujar_circulo(ctx, "#008000", coor.x1, coor.y1, 11, 11)
                }

                if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO2")){
                    dibujar_circulo(ctx, "#008000", coor.x2, coor.y2, 11, 11)
                }

            }

            if (figura.tipo_figura === "PUNTO") {

                /*if(componente_g === null){
                    validar_punto=  true
                }else{
                    if(validar_punto === false)
                    validar_punto = !componente_g.includes("PUNTO_C")
                }*/

                if(validar_punto == null && componente_g === null){
                    validar_punto = false;
                }else
                if(validar_punto == null && componente_g !== null){
                    validar_punto = componente_g.includes("PUNTO_C")
                }else
                if(validar_punto === false && componente_g !== null){
                    validar_punto= componente_g.includes("PUNTO_C")
                }

                const coor = getCoorPunto(figura, grupo)
                const color_p = validar_punto? "#008000" : "#FF0000";

                dibujar_rectangulo(ctx, color_p, coor.x-4, coor.y-4, 9, 9, true);
                imprimir_punto(ctx, figura, grupo, color_figura);

                if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO_C")){
                    dibujar_circulo(ctx, "#008000", coor.x, coor.y, 11, 11)
                }

            }

            if (figura.tipo_figura === "CIRCULO") {
                imprimir_circulo(ctx, figura, grupo, color_figura);
            }
        }
        //console.log(componente_g)
    }
}

function obtenerPuntosContorno(grupo_, elementos){
    const lista_coor = []
    for (let i = 0; i < elementos.length; i++) {
        const e = elementos[i];
        let figura = grupo_.lista_figuras.filter((f)=>f.nombre===e.nombre)
        let x, y;
        if(figura.length>0){
            figura = figura[0];
            if (figura.tipo_figura === "RECTA"){
                const coor = getCoorRecta(figura, grupo_)
                if(e.componente === "PUNTO1"){
                    x = coor.x1;
                    y = coor.y1;
                }
                if(e.componente === "PUNTO2"){
                    x = coor.x2;
                    y = coor.y2;
                }
            }
            if (figura.tipo_figura === "PUNTO"){
                const coor = getCoorPunto(figura, grupo_)
                if(e.componente === "PUNTO_C"){
                    x = coor.x;
                    y = coor.y;
                }
            }
            lista_coor.push({
                x: x,
                y: y
            })
        }
    }
    return lista_coor;
}

function pintarDimensionGrupo(ctx, grupo_, pintura, relleno=false){
    const grupo_elementos = pintura.elementos

    for (let i_elementos=0; i_elementos<grupo_elementos.length; i_elementos++){
        const elementos = grupo_elementos[i_elementos];
        const lista_puntos = obtenerPuntosContorno(grupo_, elementos);
        //console.log(lista_puntos)
        ctx.beginPath();
        if(relleno){
            ctx.strokeStyle = 'black';
            ctx.fillStyle = pintura.color; // Color de relleno (rojo semitransparente en este caso)
            ctx.lineWidth = 2; // Grosor de la línea de contorno
        }


        for (let i=0; i<lista_puntos.length-1; i++){
            const p1 = lista_puntos[i]
            const p2 = lista_puntos[i+1]

            if(relleno){
                if (i === 0) {
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                } else {
                    ctx.lineTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
            }else{
                dibujar_linea_segmentada(ctx, "#39ff14", p1.x, p1.y, p2.x, p2.y)
            }
        }
        if(relleno){
            ctx.stroke();
            if(lista_puntos.length>2){
                const p1 = lista_puntos[0];
                ctx.lineTo(p1.x, p1.y);
                ctx.fill();
            }
            ctx.closePath();
        }
    }


}

function imprimir_recta(ctx, figura, grupo, color_, p1_recta, p2_recta, p_centro,
                        seleccion = false,color_seleccion = "#39ff14" ) {
    const coor = getCoorRecta(figura, grupo)
    dibujar_linea(ctx, color_, coor.x1, coor.y1, coor.x2, coor.y2)

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
    const coor = getCoorPunto(figura, grupo)
    const x = coor.x;
    const y = coor.y;
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

function dibujar_rectangulo(ctx, color, x, y, w, h, relleno=false) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
    if(relleno){
        ctx.fillStyle = color;
        ctx.fill()
    }

}


export {pintarGrupo, imprimirListaGrupos, imprimirGrupoPintado,imprimir_recta, imprimir_circulo, imprimir_punto,
    dibujar_punto, dibujar_circulo, dibujar_linea, dibujar_rectangulo, dibujar_linea_segmentada};