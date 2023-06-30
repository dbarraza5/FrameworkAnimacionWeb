import OperacionesGrupo from "./OperacionesGrupo";

class GestionPintado {
    grupo = null;
    grupo_copia = null;

    constructor() {
    }

    inicializarGrupo(grupo_) {
        this.grupo = grupo_;
        this.grupo_copia = JSON.parse(JSON.stringify(grupo_))
        let centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados([this.grupo_copia])
        OperacionesGrupo.moverGrupo(this.grupo_copia, grupo_, centro_grupo.centro_x,
            centro_grupo.centro_y, 300, 300)
        const grupo_aux = JSON.parse(JSON.stringify(this.grupo_copia))
        centro_grupo = OperacionesGrupo.calcularCentroGruposSeleccionados(
            [grupo_aux])
        this.inflar_grupo(this.grupo_copia, grupo_aux,0.5, centro_grupo.centro_x,
            centro_grupo.centro_y)
    }

    inflar_grupo(grupo_, grupo_copia_, porcentaje, centrox, centroy) {
        for (let j = 0; j < grupo_copia_.lista_figuras.length; j++) {
            let figura = grupo_.lista_figuras[j];
            let f_copia = grupo_copia_.lista_figuras[j];

            OperacionesGrupo.inflar_figura(figura, f_copia, grupo_, centrox,
                centroy, porcentaje)

        }
    }
};


export default GestionPintado;