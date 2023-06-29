import Fisica from "./Fisica";
const REFLEJO_NONE = 0;
const REFLEJO_HORIZONTAL = 1;
const REFLEJO_VERTICAL = 2;


class OperacionesGrupo{

    static moverGrupo(grupo_, grupo_copia, orig_x, orig_y, des_x,  des_y){
        let x = des_x ;
        let y = des_y ;
        let x_move =  x- orig_x;
        let y_move = y- orig_y;

        for (let j = 0; j < grupo_.lista_figuras.length; j++) {
            const figura = grupo_.lista_figuras[j];
            const f_copia = grupo_copia.lista_figuras[j];
            figura.atributos.cx = f_copia.atributos.cx + x_move;
            figura.atributos.cy = f_copia.atributos.cy + y_move;
        }
    }

    static calcularLimitesFigura(figura, grupo, inf_hor, sup_hor, inf_ver, sup_ver){
        if (figura.tipo_figura === "RECTA") {
            const x1 = parseInt(figura.atributos.x1) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y1 = parseInt(figura.atributos.y1) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            const x2 = parseInt(figura.atributos.x2) + parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y2 = parseInt(figura.atributos.y2) + parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            //console.log(x1, y1)
            inf_hor = Math.min(...[x1, x2, inf_hor])
            sup_hor = Math.max(...[x1, x2, sup_hor])

            //----------------------------------------
            inf_ver = Math.min(...[y1, y2, inf_ver])
            sup_ver = Math.max(...[y1, y2, sup_ver])
        }

        if (figura.tipo_figura === "PUNTO") {
            const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);

            inf_hor = Math.min(...[x, inf_hor])
            sup_hor = Math.max(...[x, sup_hor])
            //----------------------------------------
            inf_ver = Math.min(...[y, inf_ver])
            sup_ver = Math.max(...[y, sup_ver])

        }

        if (figura.tipo_figura === "CIRCULO") {

            const x = parseInt(figura.atributos.cx) + parseInt(grupo.cx_solid);
            const y = parseInt(figura.atributos.cy) + parseInt(grupo.cy_solid);
            const rx = parseInt(figura.atributos.radiox);
            const ry = parseInt(figura.atributos.radioy);

            inf_hor = Math.min(...[x - rx, inf_hor])
            sup_hor = Math.max(...[x + rx, sup_hor])
            //----------------------------------------
            inf_ver = Math.min(...[y - ry, inf_ver])
            sup_ver = Math.max(...[y + ry, sup_ver])
        }
        return [inf_hor, sup_hor, inf_ver, sup_ver]
    }

    static calcularCentroGruposSeleccionados(copia_lista_grupos){

        let inf_hor = Number.POSITIVE_INFINITY;
        let inf_ver = Number.POSITIVE_INFINITY;
        let sup_hor = Number.NEGATIVE_INFINITY;
        let sup_ver = Number.NEGATIVE_INFINITY;

        for (let i=0; i<copia_lista_grupos.length; i++){
            let grupo_ = copia_lista_grupos[i];

            for (let j = 0; j < grupo_.lista_figuras.length; j++) {
                const figura = grupo_.lista_figuras[j];
                [inf_hor, sup_hor, inf_ver, sup_ver]=OperacionesGrupo.calcularLimitesFigura(figura, grupo_,
                    inf_hor, sup_hor, inf_ver, sup_ver)
            }
        }

        let centro_figuras = {}
        const margen = 10;
        centro_figuras.inf_hor = inf_hor-margen;
        centro_figuras.sup_hor = sup_hor+margen;
        centro_figuras.inf_ver = inf_ver-margen;
        centro_figuras.sup_ver = sup_ver+margen;
        centro_figuras.ancho = (sup_hor-inf_hor)+margen*2;
        centro_figuras.alto = (sup_ver-inf_ver)+margen*2;
        centro_figuras.centro_x = inf_hor+(sup_hor-inf_hor)/2;
        centro_figuras.centro_y = inf_ver+(sup_ver-inf_ver)/2;
        return centro_figuras
    }

    static inflar_figura(figura, f_copia, grupo_, centrox, centroy, porcentaje){
        if(figura.tipo_figura === "PUNTO" || figura.tipo_figura === "CIRCULO"){
            let x = centrox - grupo_.cx;
            let y = centroy - grupo_.cy;

            const angulo_figura = Fisica.angulo_recta(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)
            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)

            let dx = Math.cos(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
            let dy = Math.sin(Fisica.angulo_radianaes(angulo_figura))*(distancia+distancia*porcentaje)
            figura.atributos.cx = parseInt(x+ dx)
            figura.atributos.cy = parseInt(y+ dy)

            if(figura.tipo_figura === "CIRCULO"){
                figura.atributos.radiox = parseInt(f_copia.atributos.radiox+ f_copia.atributos.radiox*porcentaje)
                figura.atributos.radioy = parseInt(f_copia.atributos.radioy+ f_copia.atributos.radioy*porcentaje)
            }
        }
        if(figura.tipo_figura === "RECTA"){

            let x = centrox - grupo_.cx;
            let y = centroy - grupo_.cy;

            const x1 = f_copia.atributos.x1+f_copia.atributos.cx;
            const y1 = f_copia.atributos.y1+f_copia.atributos.cy;

            const angulo_p1 = Fisica.angulo_recta(x, y, x1 ,y1)
            const distancia_p1 = Fisica.distanciaEntreDosPuntos(x, y, x1 ,y1)
            let dx = Math.cos(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)
            let dy = Math.sin(Fisica.angulo_radianaes(angulo_p1))*(distancia_p1+distancia_p1*porcentaje)

            figura.atributos.x1 = parseInt(x+ dx)
            figura.atributos.y1 = parseInt(y+ dy)

            const x2 = f_copia.atributos.x2+f_copia.atributos.cx;
            const y2 = f_copia.atributos.y2+f_copia.atributos.cy;

            const angulo_p2 = Fisica.angulo_recta(x, y, x2 ,y2)
            const distancia_p2 = Fisica.distanciaEntreDosPuntos(x, y, x2 ,y2)

            dx = Math.cos(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)
            dy = Math.sin(Fisica.angulo_radianaes(angulo_p2))*(distancia_p2+distancia_p2*porcentaje)

            figura.atributos.x2 = parseInt(x+ dx)
            figura.atributos.y2 = parseInt(y+ dy)

            figura.atributos.cx = 0
            figura.atributos.cy = 0

            //this.animacion_.set_figura(nombre_grupo, figura)
        }
    }

    static espejo_figura(figura, f_copia,grupo_copia, centrox, centroy, espejo_sentido_reflejo,
                         reflejo_original_vert, reflejo_original_horz){
        let deff_x = 0;
        let deff_y = 0;
        if(figura.tipo_figura === "PUNTO" || figura.tipo_figura === "CIRCULO"){
            if(espejo_sentido_reflejo === REFLEJO_HORIZONTAL){
                if(reflejo_original_horz){
                    deff_x = centrox*2-(f_copia.atributos.cx+grupo_copia.cx*2);
                    figura.atributos.cx = deff_x
                }else{
                    figura.atributos.cx = f_copia.atributos.cx
                }
            }
            if(espejo_sentido_reflejo === REFLEJO_VERTICAL){
                if(reflejo_original_vert){
                    deff_y = centroy*2-(f_copia.atributos.cy+grupo_copia.cy*2);
                    figura.atributos.cy = deff_y
                }else{
                    figura.atributos.cy = f_copia.atributos.cy
                }
            }
        }

        if(figura.tipo_figura === "RECTA"){
            if(espejo_sentido_reflejo === REFLEJO_HORIZONTAL){

                if(espejo_sentido_reflejo === REFLEJO_HORIZONTAL){
                    if(reflejo_original_horz){
                        deff_x = centrox*2-(f_copia.atributos.cx+grupo_copia.cx*2);
                        figura.atributos.cx = deff_x
                        figura.atributos.x1 = figura.atributos.x1*-1;
                        figura.atributos.x2 = figura.atributos.x2*-1;
                    }else{
                        figura.atributos.cx = f_copia.atributos.cx
                        figura.atributos.x1 = f_copia.atributos.x1
                        figura.atributos.x2 = f_copia.atributos.x2
                    }
                }
            }
            if(espejo_sentido_reflejo === REFLEJO_VERTICAL){
                if(reflejo_original_vert){
                    deff_y = centroy*2-(f_copia.atributos.cy+grupo_copia.cy*2);
                    figura.atributos.cy = deff_y

                    figura.atributos.y1 = figura.atributos.y1*-1;
                    figura.atributos.y2 = figura.atributos.y2*-1;
                }else{
                    figura.atributos.cy = f_copia.atributos.cy
                    figura.atributos.y1 = f_copia.atributos.y1
                    figura.atributos.y2 = f_copia.atributos.y2
                }

            }
        }
    }

    static rotar_figura(figura, f_copia, grupo, angulo_rotacion, pivote_x, pivote_y){
        if(figura.tipo_figura === "PUNTO"  || figura.tipo_figura === "CIRCULO" ){
            console.log("rotar punto: ", figura.nombre)
            let x = pivote_x - grupo.cx;
            let y = pivote_y - grupo.cy;

            const angulo_figura = Fisica.angulo_recta(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)
            const distancia = Fisica.distanciaEntreDosPuntos(x, y,
                f_copia.atributos.cx, f_copia.atributos.cy)

            const algulo_nuevo = angulo_rotacion+ angulo_figura;

            let dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo))*distancia;
            let dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo))*distancia;
            figura.atributos.cx = parseInt(x+ dx)
            figura.atributos.cy = parseInt(y+ dy)
        }
        if(figura.tipo_figura === "RECTA"){
            let x = pivote_x - grupo.cx;
            let y = pivote_y - grupo.cy;

            const x1 = f_copia.atributos.x1+f_copia.atributos.cx;
            const y1 = f_copia.atributos.y1+f_copia.atributos.cy;

            const angulo_p1 = Fisica.angulo_recta(x, y, x1 ,y1)
            const distancia_p1 = Fisica.distanciaEntreDosPuntos(x, y, x1 ,y1)

            const algulo_nuevo_p1 = angulo_rotacion+ angulo_p1;
            let dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo_p1))*distancia_p1
            let dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo_p1))*distancia_p1

            figura.atributos.x1 = parseInt(x+ dx)
            figura.atributos.y1 = parseInt(y+ dy)

            const x2 = f_copia.atributos.x2+f_copia.atributos.cx;
            const y2 = f_copia.atributos.y2+f_copia.atributos.cy;

            const angulo_p2 = Fisica.angulo_recta(x, y, x2 ,y2)
            const distancia_p2 = Fisica.distanciaEntreDosPuntos(x, y, x2 ,y2)

            const algulo_nuevo_p2 = angulo_rotacion+ angulo_p2;

            dx = Math.cos(Fisica.angulo_radianaes(algulo_nuevo_p2))*distancia_p2
            dy = Math.sin(Fisica.angulo_radianaes(algulo_nuevo_p2))*distancia_p2

            figura.atributos.x2 = parseInt(x+ dx)
            figura.atributos.y2 = parseInt(y+ dy)

            figura.atributos.cx = 0
            figura.atributos.cy = 0

            //animacion_.set_figura(nombre_grupo, figura)
        }
        return figura
    }
}

export default OperacionesGrupo;