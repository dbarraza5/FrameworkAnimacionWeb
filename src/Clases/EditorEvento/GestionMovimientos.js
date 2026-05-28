



// ===============================
// FUNCIONES DE MOVIMIENTO
// ===============================

// MRU
import {
    MOV_CIRCULAR, MOV_GRAVEDAD, MOV_LERP,
    MOV_OSCILATORIO, MOV_PARABOLICO_ANGULO,
    MOV_RECTILINEO_2D,
    MOV_RECTILINEO_ACELERADO,
    MOV_RECTILINEO_UNIFORME, MOV_ROTACION
} from "./ConstanteEvento";
import Fisica from "../EditorAnimacion/Fisica";
import OperacionesGrupo from "../EditorAnimacion/OperacionesGrupo";

function movRectilineoUniforme(t, v){
    return v * t;
}

// MRUA
function movRectilineoAcelerado(t, v0, a){
    return v0 * t + 0.5 * a * t * t;
}

// Movimiento 2D simple
function movRectilineo2D(t, vx, vy){
    return {
        x: vx * t,
        y: vy * t
    };
}

// Movimiento circular
function movCircular1(t, radio, velAngular){
    return {
        x: radio * Math.cos(velAngular * t),
        y: radio * Math.sin(velAngular * t)
    };
}

function movCircular(t, px, py, velAngular, sentido) {
    // 1. Ajustamos la velocidad según el sentido
    // Si es Horario, multiplicamos por -1 para que el ángulo disminuya
    const w = sentido === "Horario" ? -velAngular : velAngular;

    // 2. Calculamos radio y fase inicial desde el (0,0)
    const radio = Math.sqrt(px * px + py * py);
    const faseInicial = Math.atan2(-py, -px);

    // 3. Resultado de la posición
    return {
        x: px + radio * Math.cos(w * t + faseInicial),
        y: py + radio * Math.sin(w * t + faseInicial)
    };
}

// Oscilación (seno)
function movOscilatorio1(t, amplitud, frecuencia){
    return amplitud * Math.sin(frecuencia * t);
}

function movOscilatorio(
    t,
    amplitudX,
    frecuenciaX,
    amplitudY,
    frecuenciaY
){
    const resX = amplitudX * Math.sin(frecuenciaX * t);
    const resY = amplitudY * Math.sin(frecuenciaY * t);
    return {
        // Si el resultado es null o undefined, devuelve 0.
        // Si es 0, mantiene el 0.
        x: resX ?? 0,
        y: resY ?? 0
    };
}

// Interpolación lineal
function lerp(inicio, fin, t){
    return inicio + (fin - inicio) * t;
}

// Gravedad (solo eje Y)
function movGravedad(t, v0y, g = 9.8){
    return v0y * t - 0.5 * g * t * t;
}

// Parabólico con ángulo
function movParabolicoAngulo(t, velocidadInicial, angulo, g = 9.8){
    const rad = angulo * Math.PI / 180;

    const v0x = velocidadInicial * Math.cos(rad);
    const v0y = velocidadInicial * Math.sin(rad);

    return {
        x: v0x * t,
        y: v0y * t - 0.5 * g * t * t
    };
}


function calcularAnguloOrbita(velocidad, tiempo, anguloInicial, radio) {
    // Velocidad angular (rad/s) = velocidad lineal / radio
    const omega = velocidad / radio;

    // Ángulo girado en radianes
    const deltaAngulo = omega * tiempo;

    // Convertir ángulo inicial a radianes y sumar
    const anguloInicialRad = (anguloInicial * Math.PI) / 180;
    const anguloNuevoRad = anguloInicialRad + deltaAngulo;

    // Convertir a grados y normalizar entre 0° y 360°
    const anguloNuevo = (anguloNuevoRad * 180) / Math.PI;
    return ((anguloNuevo % 360) + 360) % 360;
}


/**
 * Calcula el nuevo ángulo en un movimiento circular.
 *
 * @param {Object} center - {x, y} Coordenadas del centro.
 * @param {Object} pivot - {x, y} Coordenadas del punto inicial (pivote).
 * @param {number} time - Tiempo transcurrido.
 * @param {number} velocity - Velocidad angular (radianes por unidad de tiempo).
 * @param {number} direction - 1 para horario, 2 para anti-horario.
 * @returns {number} - El nuevo ángulo en radianes.
 */
function getNewAngle(currentAngle, deltaTime, velocity, direction) {

    const deltaAngle = velocity * deltaTime;

    if (direction === 1) {
        currentAngle += deltaAngle;
    } else {
        currentAngle -= deltaAngle;
    }

    return deltaAngle;
}


class GestionMovimientos{

    constructor() {
    }

    static movimientoGrupo(tiempo, tipo, datos){
        let x=0;
        let y=0;
        switch(tipo){

            case MOV_RECTILINEO_UNIFORME:
                x = movRectilineoUniforme(tiempo, datos.velocidad);
                break;

            case MOV_RECTILINEO_ACELERADO:
                x = movRectilineoAcelerado(tiempo, datos.v0, datos.a);
                break;

            case MOV_RECTILINEO_2D:
                const pos2D = movRectilineo2D(tiempo, datos.vx, datos.vy);
                x = pos2D.x;
                y = pos2D.y;
                break;

            case MOV_CIRCULAR:
                console.log(datos)
                const circ = movCircular(
                    tiempo,
                    datos.pivote_x,
                    datos.pivote_y,
                    datos.velocidad_angular,
                    datos.sentido
                );
                x = circ.x;
                y = circ.y;
                break;

            case MOV_OSCILATORIO:

                const osc = movOscilatorio(
                    tiempo,
                    parseFloat(datos.amplitudX) || 0,
                    parseFloat(datos.frecuenciaX) || 0,
                    parseFloat(datos.amplitudY) || 0,
                    parseFloat(datos.frecuenciaY) || 0
                );
                console.log(JSON.parse(JSON.stringify(osc)))
                x = osc.x;
                y = osc.y;
                break

            case MOV_GRAVEDAD:
                y = movGravedad(tiempo, datos.v0y, datos.g);
                break;

            case MOV_LERP:
                x = lerp(datos.inicio, datos.fin, tiempo);
                break;

            case MOV_PARABOLICO_ANGULO:
                const par = movParabolicoAngulo(
                    tiempo,
                    datos.velocidadInicial,
                    datos.angulo,
                    datos.g
                );
                x = par.x;
                y = par.y*-1;
                break;
        }

        // Opcional: aplicar origen
        if(datos.origenX !== undefined){
            x += datos.origenX;
        }

        if(datos.origenY !== undefined){
            y += datos.origenY;
        }
        return {
            x: x,
            y: y
        }
    }


    static movimientoFiguras(tiempo, tipo, datos, animacion, lista_grupos){

        if(tipo === MOV_ROTACION){
            //console.log("MOV_ROTACION")
            const velocidad = datos.velAngular;
            const piv_x = datos.pivoteX;
            const piv_y = datos.pivoteY;
            const sentido = 1//datos.sentido;


            //const angulo_rotacion = calcularAnguloOrbita(velocidad, tiempo, 45, 20)
            const centro_=OperacionesGrupo.calcularCentroGruposSeleccionados(lista_grupos)

             // const angulo_rotacion = Fisica.angulo_recta(centro_.centro_x, centro_.centro_y
             //        ,piv_x, piv_y);

            const angulo_rotacion = Fisica.angulo_recta(piv_x, piv_y, centro_.centro_x, centro_.centro_y);

            //const angulo_rotacion = 45//45;
            console.log("angulo original: ",angulo_rotacion);
            const angulo_radianes = getNewAngle(angulo_rotacion,
                tiempo,
                velocidad,
                sentido
            );

            // let anguloGrados = (angulo_radianes * 180 / Math.PI) % 360;
             console.log("angulo nuevo: =",angulo_radianes);

            animacion.moverGruposRotacionLienzoPivote(lista_grupos, angulo_radianes, piv_x,
                piv_y)

            // const angulo_radianes = getNewAngle({ x: centro_.centro_x, y: centro_.centro_y },
            //     { x: piv_x, y: piv_y },
        }
        return null;
    }
}

export {GestionMovimientos}