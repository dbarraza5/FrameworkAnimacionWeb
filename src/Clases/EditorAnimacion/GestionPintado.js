class GestionPintado{
    grupo = null;
    grupo_copia = null;
    constructor() {
    }

    inicializarGrupo(grupo_){
        this.grupo = grupo_;
        this.grupo_copia = JSON.parse(JSON.stringify(grupo_))
    }
};