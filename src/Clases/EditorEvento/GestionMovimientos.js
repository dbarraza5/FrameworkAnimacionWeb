
// ===============================
// TIPOS DE MOVIMIENTO
// ===============================
const MOV_RECTILINEO_UNIFORME = 1;
const MOV_RECTILINEO_ACELERADO = 2;
const MOV_RECTILINEO_2D = 3;
const MOV_CIRCULAR = 4;
const MOV_OSCILATORIO = 5;
const MOV_LERP = 6;
const MOV_GRAVEDAD = 7;
const MOV_PARABOLICO_ANGULO = 8;


// ===============================
// FUNCIONES DE MOVIMIENTO
// ===============================

// MRU
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
function movOscilatorio(t, amplitud, frecuencia){
    return amplitud * Math.sin(frecuencia * t);
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
                y = movOscilatorio(tiempo, datos.amplitud, datos.frecuencia);
                break;

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
}

export {GestionMovimientos}