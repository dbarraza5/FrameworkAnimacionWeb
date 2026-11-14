// Historial del editor de eventos: deshacer / rehacer, lista de cambios, "sin guardar".
//
// Guarda FOTOS del estado editable (motor.estadoEditable(): eventos, objetos sin las
// partes virtuales y configuracion de la escena). No hace falta avisarle de cada
// accion: revisar() se llama cada ~250 ms, compara el estado con la ultima foto y,
// cuando cambio y ya no cambia mas (y no se esta arrastrando), registra una entrada
// nueva con un nombre que describe el cambio. Asi un arrastre o un numero que se
// escribe cuentan como un solo paso, y cualquier cambio nuevo del editor queda
// cubierto sin tocar su codigo.

const LIMITE = 150;

// cx_solid / cy_solid son calculados (no son parte de lo que el usuario edita)
const sinCalculados = (k, v) => (k === "cx_solid" || k === "cy_solid" ? undefined : v);

export default class Historial {
    constructor(motor) {
        this.m = motor;
        this.entradas = [];
        this.pos = -1;
        this.firmaGuardada = null;
        this.firmaActual = null;
        this._pendiente = null;
        this._vistas = 0;
        this.alCambiar = null;          // callback() -> React
    }

    _firma() {
        return JSON.stringify(this.m.estadoEditable(), sinCalculados);
    }

    // Empieza de cero (al cargar la escena). La foto inicial cuenta como "guardada".
    iniciar(etiqueta = "Abrir escena") {
        const firma = this._firma();
        this.entradas = [{etiqueta, firma, estado: JSON.parse(firma), fecha: Date.now()}];
        this.pos = 0;
        this.firmaGuardada = firma;
        this.firmaActual = firma;
        this._pendiente = null;
        this._avisar();
    }

    listo() {
        return this.pos >= 0;
    }

    // Se llama periodicamente. `ocupado`: el usuario esta arrastrando (no registrar aun).
    revisar(ocupado) {
        if (!this.listo()) return false;
        const firma = this._firma();
        const cambio_sin_guardar = (firma !== this.firmaActual);
        this.firmaActual = firma;
        const actual = this.entradas[this.pos];
        if (firma === actual.firma) {
            this._pendiente = null;
            if (cambio_sin_guardar) this._avisar();
            return false;
        }
        if (ocupado) { this._pendiente = null; return false; }
        // esperar a que el cambio se estabilice (dos revisiones iguales seguidas)
        if (this._pendiente !== firma) { this._pendiente = firma; this._vistas = 1; return false; }
        if (++this._vistas < 2) return false;
        this._registrar(firma, null);
        return true;
    }

    // Registra ya el estado actual con un nombre (importar, restaurar lo guardado...).
    registrarAhora(etiqueta) {
        if (!this.listo()) return;
        const firma = this._firma();
        this.firmaActual = firma;
        if (firma === this.entradas[this.pos].firma) return;
        this._registrar(firma, etiqueta);
    }

    _registrar(firma, etiqueta) {
        const estado = JSON.parse(firma);
        const anterior = this.entradas[this.pos].estado;
        this.entradas = this.entradas.slice(0, this.pos + 1);
        this.entradas.push({etiqueta: etiqueta || describir(anterior, estado), firma, estado, fecha: Date.now()});
        if (this.entradas.length > LIMITE) this.entradas.splice(1, this.entradas.length - LIMITE);   // se conserva la inicial
        this.pos = this.entradas.length - 1;
        this._pendiente = null;
        this._avisar();
    }

    irA(i) {
        if (i < 0 || i >= this.entradas.length || i === this.pos) return;
        this.m.restaurarEstado(this.entradas[i].estado);
        this.pos = i;
        this.firmaActual = this._firma();
        // por si restaurar normalizo algo (p. ej. agrego la camara), la entrada queda igual a lo que hay
        this.entradas[i] = {...this.entradas[i], firma: this.firmaActual, estado: JSON.parse(this.firmaActual)};
        this._pendiente = null;
        this._avisar();
    }

    puedeDeshacer() { return this.pos > 0; }
    puedeRehacer() { return this.pos < this.entradas.length - 1; }
    deshacer() { if (this.puedeDeshacer()) this.irA(this.pos - 1); }
    rehacer() { if (this.puedeRehacer()) this.irA(this.pos + 1); }

    sinGuardar() {
        return this.listo() && this.firmaActual !== this.firmaGuardada;
    }

    marcarGuardado() {
        this.firmaActual = this._firma();
        this.firmaGuardada = this.firmaActual;
        this._avisar();
    }

    estadoActual() {
        return JSON.parse(this.firmaActual || this._firma());
    }

    _avisar() {
        if (this.alCambiar) this.alCambiar();
    }
}

// ---------------- nombre de cada cambio ----------------
function describir(a, b) {
    const ga = new Map((a.grupos || []).map((g) => [g.nombre, g]));
    const gb = new Map((b.grupos || []).map((g) => [g.nombre, g]));
    const raiz = (m, n) => { const g = m.get(n); return !g || g.nodo_padre === "root" || !m.has(g.nodo_padre); };
    const agregados = [...gb.keys()].filter((n) => !ga.has(n) && raiz(gb, n));
    const borrados = [...ga.keys()].filter((n) => !gb.has(n) && raiz(ga, n));
    if (agregados.length === 1 && borrados.length === 1) return `Renombrar ${borrados[0]} → ${agregados[0]}`;
    if (agregados.length) return agregados.length === 1 ? `Agregar ${agregados[0]}` : `Agregar ${agregados.length} objetos`;
    if (borrados.length) return borrados.length === 1 ? `Borrar ${borrados[0]}` : `Borrar ${borrados.length} objetos`;

    const cambiados = [];
    for (const [n, g] of gb) {
        const o = ga.get(n);
        if (o && JSON.stringify(o) !== JSON.stringify(g)) cambiados.push([n, o, g]);
    }
    if (cambiados.length === 1) {
        const [n, o, g] = cambiados[0];
        const distinto = (k) => JSON.stringify(o[k]) !== JSON.stringify(g[k]);
        if (distinto("claves") || distinto("claves_bucle")) return `Claves de ${n}`;
        if (distinto("efecto")) return `Ajustar ${n}`;
        if (distinto("fisica")) return `Física de ${n}`;
        if (distinto("instancia")) return `Instancia ${n}`;
        if (distinto("camara")) return `Cámara`;
        if (distinto("cx") || distinto("cy")) return `Mover ${n}`;
        if (distinto("transformacion")) return `Transformar ${n}`;
        if (distinto("visible")) return g.visible === false ? `Ocultar ${n}` : `Mostrar ${n}`;
        if (distinto("clases")) return `Bloqueo de ${n}`;
        if (distinto("capa") || distinto("plano")) return `Orden de ${n}`;
        if (distinto("opacidad")) return `Opacidad de ${n}`;
        return `Cambio en ${n}`;
    }
    if (cambiados.length > 1) {
        const raices = new Set(cambiados.map(([n]) => n));
        return cambiados.length <= 3 ? `Cambios en ${[...raices].join(", ")}` : `Cambios en ${cambiados.length} objetos`;
    }
    if (JSON.stringify(a.eventos) !== JSON.stringify(b.eventos)) return "Editar eventos";
    if (JSON.stringify(a.escena) !== JSON.stringify(b.escena)) return "Configuración de la escena";
    return "Cambio";
}
