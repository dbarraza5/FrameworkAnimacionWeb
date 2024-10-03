let tiempo_universal=performance.now();

class Tiempo {
    constructor() {
        this.contador = 0;
        this.tiempoActual = 0;
        this.tiempoGuardar = 0;
        this.segmentacion = 0;
        this.estado = false;
        this.rapidez = 0;
        this.tiempoActualAux = 0;
        this.tiempoRelativo = 0;//0.22;
        this.guardarTiempoRelativo = 0;
        this.cambiarTiempoRelativo = false;
        this.nuevoTiempoRelativo = false;
        this.sumatoriaTiempoPausa = 0;
        this.tiempodePausa = 0;
        this.tiempoComienzoPausa = 0;
        this.tiempoEstaPausado = false;
        this.comienzoPausa = false;
        this.desPausarTiempo = false;
        this.pausa_y_relatividad = false;
    }

    modPasivo() {
        this.segmentacion = this.tiempoGuardar = this.tiempoActual = tiempo_universal;
        this.contador = 0;
        this.estado = false;
        this.tiempodePausa = 0;
        this.tiempoComienzoPausa = 0;
        this.sumatoriaTiempoPausa = 0;
        this.tiempoEstaPausado = false;
        this.comienzoPausa = false;
        this.nuevoTiempoRelativo = false;
        this.tiempoActualAux = 0;
        this.guardarTiempoRelativo = 0;
        this.cambiarTiempoRelativo = false;
        this.nuevoTiempoRelativo = false;
    }

    cronometroC() {
        const estaPausa = this.tiempodePausa || this.tiempoEstaPausado;
        const estaCambioRelativo = this.cambiarTiempoRelativo || this.nuevoTiempoRelativo;

        if (!estaPausa && !estaCambioRelativo) {
            this.pausa_y_relatividad = false;
            return this.procesoNormalTiempo();
        }

        if (estaPausa && !estaCambioRelativo && !this.pausa_y_relatividad) {
            return this.procesoPausar();
        }

        if (!estaPausa && estaCambioRelativo && !this.pausa_y_relatividad) {
            return this.procesoCambiarRelatividad();
        }

        if ((estaPausa && estaCambioRelativo) || this.pausa_y_relatividad) {
            this.pausa_y_relatividad = true;
            return this.procesoPausar_Y_CambiarRelatividad();
        }
    }

    procesoPausar() {
        const tiempo_ = tiempo_universal;
        if (this.tiempoEstaPausado) {
            if (this.comienzoPausa) {
                this.tiempoComienzoPausa = tiempo_;
                this.comienzoPausa = false;
            }
            this.tiempodePausa = tiempo_ - this.tiempoComienzoPausa;
            return this.tiempoActual;
        } else {
            if (this.desPausarTiempo) {
                this.sumatoriaTiempoPausa += this.tiempodePausa;
                this.desPausarTiempo = false;
            }

            const tiempo_aux = tiempo_ - this.tiempoGuardar - this.sumatoriaTiempoPausa;

            if (this.tiempoRelativo !== 0)
                this.tiempoActual = tiempo_aux / this.tiempoRelativo;

            this.tiempoActual = this.tiempoActual / 1000;
            this.tiempoActualAux = this.tiempoActual;
            return this.tiempoActual;
        }
    }

    procesoCambiarRelatividad() {
        const tiempo_ = tiempo_universal;

        if (this.cambiarTiempoRelativo) {
            this.guardarTiempoRelativo = tiempo_;
            this.cambiarTiempoRelativo = false;
            this.nuevoTiempoRelativo = true;
        }
        if (this.nuevoTiempoRelativo) {
            if (this.tiempoRelativo !== 0) {
                const ex = (tiempo_ - this.guardarTiempoRelativo) / this.tiempoRelativo;
                this.tiempoActualAux = ex / 1000 + this.tiempoActual;
                return ex / 1000 + this.tiempoActual;
            }
        }
    }

    procesoNormalTiempo() {
        const tiempo_ = tiempo_universal;
        this.tiempoActual = tiempo_ - this.tiempoGuardar;
        if (this.tiempoRelativo !== 0)
            this.tiempoActual = this.tiempoActual / this.tiempoRelativo;

        this.tiempoActual = this.tiempoActual / 1000;
        this.tiempoActualAux = this.tiempoActual;
        return this.tiempoActual;
    }

    procesoPausar_Y_CambiarRelatividad() {
        const tiempo_ = tiempo_universal;

        if (this.cambiarTiempoRelativo) {
            if (!this.comienzoPausa && this.tiempoEstaPausado)
                this.guardarTiempoRelativo = this.tiempoComienzoPausa - this.sumatoriaTiempoPausa;
            else
                this.guardarTiempoRelativo = tiempo_ - this.sumatoriaTiempoPausa;

            this.cambiarTiempoRelativo = false;
            this.nuevoTiempoRelativo = true;
        }

        if (this.tiempoEstaPausado) {
            if (this.comienzoPausa) {
                this.tiempoComienzoPausa = tiempo_;
                this.comienzoPausa = false;
            }
            this.tiempodePausa = tiempo_ - this.tiempoComienzoPausa;
            return this.tiempoActualAux;
        } else {
            if (this.desPausarTiempo) {
                this.sumatoriaTiempoPausa += this.tiempodePausa;
                this.desPausarTiempo = false;
            }

            const tiempo_aux = tiempo_ - this.guardarTiempoRelativo - this.sumatoriaTiempoPausa;

            if (this.nuevoTiempoRelativo) {
                if (this.tiempoRelativo !== 0) {
                    const ex = tiempo_aux / this.tiempoRelativo;
                    this.tiempoActualAux = ex / 1000 + this.tiempoActual;
                    return ex / 1000 + this.tiempoActual;
                }
            }

            if (this.tiempoRelativo !== 0)
                this.tiempoActual = tiempo_aux / this.tiempoRelativo;

            this.tiempoActual = this.tiempoActual / 1000;
            this.tiempoActualAux = this.tiempoActual;
            return this.tiempoActual;
        }
    }

    setTiempoRelativo(t_relatividad) {
        if (t_relatividad !== this.tiempoRelativo) {
            this.tiempoRelativo = t_relatividad;
            this.cambiarTiempoRelativo = true;
            this.tiempoActual = this.tiempoActualAux;
        }
    }

    pausar() {
        if (!this.tiempoEstaPausado) {
            this.tiempoEstaPausado = true;
            this.comienzoPausa = true;
        }
    }

    despausar() {
        if (this.tiempoEstaPausado) {
            this.tiempoEstaPausado = false;
            this.desPausarTiempo = true;
        }
    }

    getTiempoRelativo() {
        return this.tiempoRelativo;
    }
}

export {Tiempo}