
const MOV_RECTILINEO_UNIFORME = 1;


function movRectilineoUniforme(tiempo, velocidad){
    return tiempo*20;
}

class GestionMovimientos{

    constructor() {
    }

    static movimientoGrupo(tiempo, tipo, datos){
        let x=0;
        let y=0;
        if(tipo === MOV_RECTILINEO_UNIFORME){
            x=movRectilineoUniforme(tiempo, datos.velocidad);
            console.log("[velx: "+x+"] [tiempo: "+tiempo);
        }
        return {
            x: x,
            y: y
        }
    }
}

export {GestionMovimientos}