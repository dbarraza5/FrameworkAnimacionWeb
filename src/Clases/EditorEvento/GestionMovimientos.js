



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
function getNewAngle(center, pivot, time, velocity, direction) {
    // 1. Calcular el radio (distancia entre centro y pivote)
    // Usamos el teorema de Pitágoras: r = sqrt((x2-x1)^2 + (y2-y1)^2)
    const dx = pivot.x - center.x;
    const dy = pivot.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // 2. Calcular el ángulo inicial (en radianes) usando arcotangente
    // Math.atan2 devuelve el ángulo entre el eje X positivo y el punto (dx, dy)
    const initialAngle = Math.atan2(dy, dx);

    // 3. Calcular el desplazamiento angular (Δθ = ω * t)
    const deltaAngle = velocity * time;

    // 4. Determinar el nuevo ángulo según el sentido
    // Sentido Horario (1): El ángulo disminuye en el sistema de coordenadas estándar
    // Sentido Anti-horario (2): El ángulo aumenta
    let finalAngle;
    if (direction === 1) {
        finalAngle = initialAngle - deltaAngle;
    } else {
        finalAngle = initialAngle + deltaAngle;
    }

    // Opcional: Normalizar el ángulo entre -PI y PI (o 0 y 2PI)
    // Esto es útil para mantener los valores dentro de un rango estándar
    return Math.atan2(Math.sin(finalAngle), Math.cos(finalAngle));
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
            console.log("MOV_ROTACION")
            const velocidad = datos.velAngular;
            const piv_x = datos.pivoteX;
            const piv_y = datos.pivoteY;
            const sentido = datos.sentido;

            // const angulo_rotacion = Fisica.angulo_recta(piv_x, piv_y
            //     ,0, 0)*(80*tiempo);

            //const angulo_rotacion = calcularAnguloOrbita(velocidad, tiempo, 45, 20)
            const centro_=OperacionesGrupo.calcularCentroGruposSeleccionados(lista_grupos)

            // const angulo_rotacion = Fisica.angulo_recta(200, 200
            //      ,0, 0)*(80*tiempo);

            const angulo_new = getNewAngle({ x: piv_x, y: piv_y },
                { x: centro_.centro_x, y: centro_.centro_y }, // Claves x e y definidas
                                       // Claves x e y definidas
                tiempo,
                velocidad,
                sentido
            );
            const anguloGrados = angulo_new * (180 / Math.PI);
            // console.log(centro_)
            // console.log("NEW ANGULO: ", anguloGrados)
            //
            // console.log("angulo: ", angulo_rotacion);
            // console.log(lista_grupos);
            animacion.moverGruposRotacionLienzoPivote(lista_grupos, anguloGrados, piv_x,
                piv_y)
        }
        return null;
    }
}

export {GestionMovimientos}