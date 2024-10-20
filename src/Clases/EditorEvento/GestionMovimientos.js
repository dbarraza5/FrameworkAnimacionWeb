
const MOV_RECTILINEO_UNIFORME = 1;


function movRectilineoUniforme(tiempo, velocidad){
    return tiempo*velocidad;
}

class GestionMovimientos{

    constructor() {
    }

    movimientoGrupo(tiempo, movimiento, objetos){
        const tipo = movimiento["tipo"]
        /*for(let i=0; i<objetos.length; i++){
            if(tipo === MOV_RECTILINEO_UNIFORME){
                const x=movRectilineoUniforme(tiempo, movimiento.datos.velocidad);
                objetos[i].x_mov=x;
            }
        }*/

        if(tipo === MOV_RECTILINEO_UNIFORME){
            const x=movRectilineoUniforme(tiempo, movimiento.datos.velocidad);
            objetos[i].x_mov=x;
        }
    }


}

export {GestionMovimientos}