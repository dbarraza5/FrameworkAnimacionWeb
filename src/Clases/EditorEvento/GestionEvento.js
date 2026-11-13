import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
import TimelineCanvas from "./TimelineCanvas";
import {TIPO_EFECTO_MOV_FIGURAS, TIPO_EFECTO_MOV_OBJETOS} from "./ConstanteEvento";
import OperacionesGrupo, {origenGrupoX, origenGrupoY} from "../EditorAnimacion/OperacionesGrupo";
import {limitesGrupos, prepararGrupos} from "../EditorAnimacion/Miniatura";
import {normalizarTransformacion, transformarVector} from "../EditorAnimacion/TransformacionInstancia";
import * as Claves from "./Claves";
import {SimFisica, grupoEsEfecto, particulasEn, TIPOS_EFECTO, efectoDefecto} from "./Fisica";

let tiempo_universal=performance.now();

// Bucle (Fase 5): dado el tiempo transcurrido `t` (segundos) dentro de la ventana de
// un evento o movimiento, devuelve {t (dentro del ciclo), vueltas (completas),
// periodo} si tiene bucle activo con tiempo_bucle > 0, o null si no repite.
// Justo al final de una vuelta se toma como el final de esa vuelta (no el inicio de
// la siguiente), asi un ciclo que termina la ventana queda congelado en su pose final.
export function cicloBucle(t, bucle, tiempo_bucle){
    const periodo = (parseFloat(tiempo_bucle) || 0) / 1000;
    if(!bucle || !(periodo > 0) || t < 0) return null;
    let vueltas = Math.floor(t / periodo + 1e-9);
    let t_ciclo = t - vueltas * periodo;
    if(t_ciclo < 1e-9 && vueltas > 0){
        vueltas -= 1;
        t_ciclo = periodo;
    }
    return {t: t_ciclo, vueltas, periodo};
}

class Evento{
  evento=null;
  tiempo=null;
  inicio=false;
  activar_tiempo = false;
  constructor(evento_) {
      this.evento=evento_;
      this.tiempo=new Tiempo();
  }
};

class GestionEvento{
    grupos=[];
    eventos=[];
    lista_raw_evento=[];

    tiempo=new Tiempo();

    movimientos_grupos = {};
    movimientos_figuras = {};
    grupos_trabajo = [];  // pose de las figuras del frame actual (ver procesandoEventos)
    _figuras_clonadas = new Set();  // grupos de grupos_trabajo con figuras ya clonadas
    copia_grupos = [];
    gestion_eventos = null;
    gestion_grupos = null;
    imprimir_animacion = null;
    configuracion_lienzo = null;
    id_canvas = null;
    tiempo_animacion = 0;
    version=1;
    _id=null;

    reproducir = false;
    detener = true;
    reiniciar = false;

    id_evento_seleccionado = null;



    constructor() {
        this.id_canvas = "lienzo-evento"
        this.gestion_eventos= new GestionMovimientos();
        this.gestion_grupos = new GestionAnimacion();
        this.gestion_grupos_originales = new GestionAnimacion();
        this.configuracion_lienzo = new ConfiguracionLienzo();
        this.imprimir_animacion = new ImprimirAnimacion(this.imprimir_animacion,this.configuracion_lienzo, this.id_canvas);
    }

    reseteoMovGrupos(){
        for(let i=0; i<this.gestion_grupos_originales.grupos_figuras.length; i++){
            const grupo_ = this.gestion_grupos_originales.grupos_figuras[i];
            this.movimientos_grupos[grupo_.nombre] = {x: 0, y:0};
        }
    }

    reiniciarEventos(){
        this.gestion_grupos.grupos_figuras=structuredClone(this.gestion_grupos_originales.grupos_figuras)
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.modPasivo();
        }
        // this.tiempo (reloj de clase, el que mueve la linea roja del timeline) puede
        // haber quedado en un instante no-cero por un buscarTiempo() previo -- hay que
        // resetearlo tambien, si no "Reiniciar" deja la linea congelada donde estaba.
        this.tiempo.modPasivo();
        // modPasivo() deja los relojes despausados; como procesandoEvento() ya corre
        // siempre (no solo con reproducir=true), hay que volver a pausarlos aca -- si
        // no, "Reiniciar" dejaria la animacion reproduciendose sola desde el inicio.
        this.pausarEventos();
    }

    pausarDesEventos(){
        this.tiempo.despausar();
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            //this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.despausar();
        }
    }

    pausarEventos(){
        this.tiempo.pausar();
        for(let evento_i=0; evento_i<this.eventos.length; evento_i++){
            //this.eventos[evento_i].activar_tiempo = false;
            this.eventos[evento_i].tiempo.pausar();
        }
    }

    // Mueve el reloj global y el de EventoGeneral a un instante especifico (en
    // segundos, relativo al inicio del evento seleccionado -- ver
    // eventoReproduccion), sin necesidad de reproducir -- para que el lienzo muestre la
    // posicion real del grupo en ese momento (ej. al seleccionar un movimiento,
    // saltar a su tiempo_inicio). No cambia this.reproducir: si estaba pausado,
    // sigue pausado, solo que ahora "pausado en" el instante indicado.
    buscarTiempo(segundos){
        const tiempo_universal_ = performance.now();
        this.tiempo.establecer(segundos, tiempo_universal_);

        const evento_ = this.obtenerEvento("EventoGeneral");
        if(evento_){
            evento_.tiempo.establecer(segundos, tiempo_universal_);
            // si el reloj del evento nunca se activo (modPasivo nunca corrio),
            // marcarlo activo para que el proximo tick no lo pise reseteandolo a 0.
            evento_.activar_tiempo = true;
        }
    }

    inicializar(lista_evento, grupos, id){
        //this.grupos = grupos;
        this._id =id;
        this.gestion_grupos.grupos_figuras=JSON.parse(JSON.stringify(grupos));
        this.gestion_grupos_originales.grupos_figuras = JSON.parse(JSON.stringify(grupos))
        this.lista_raw_evento = lista_evento;
        console.log("LSITA EVENTOS: ");
        console.log(this.lista_raw_evento.length)
        console.log(this.lista_raw_evento)
        this.eventos = [];
        for(let i=0; i<this.lista_raw_evento.length; i++){
            this.eventos.push(new Evento(lista_evento[i]));
        }
        console.log(this.gestion_grupos.grupos_figuras);
        //this.imprimirEventos();
        this.tiempo.modPasivo();
        this.reseteoMovGrupos();
        console.log("[LISTA EVENTOS] => "+this.eventos.length);
        this.tiempo.pausar();
        // Antes, procesandoEvento() solo corria si this.reproducir era true, asi que
        // el reloj de cada evento nunca arrancaba hasta el primer click en Play. Ahora
        // que procesandoEvento() corre siempre (para poder ver la pose real del grupo
        // sin reproducir), hay que pausar tambien estos relojes desde el arranque --
        // si no, la animacion se reproduciria sola apenas carga la pagina.
        this.pausarEventos();
    }

    iniciarRelojes(){
        tiempo_universal=performance.now();
        this.tiempo.modPasivo();
    }

    agregarEvento(evento_){
        this.eventos.push(new Evento(evento_));
    }

    obtenerHijos(id_padre){
        console.log(id_padre);
        return this.eventos.filter((e) => {
            return e.evento["nodo_padre"] === id_padre;
        });
    }
    obtenerEvento(nombreEvento) {
        return this.eventos.find(evento => evento.evento.nombre === nombreEvento) || null;
    }

    obtenerMovimiento(nombreEvento, id_objeto, indice_movimiento){
        // 1. Buscamos el evento de forma directa por su nombre
        const eventoEncontrado = this.eventos.find(e => e.evento.nombre === nombreEvento);

        if (!eventoEncontrado) return null;

        // 2. Buscamos el objeto dentro de la lista de objetos de ese evento
        const objetoEncontrado = eventoEncontrado.evento.objetos.find(obj => obj.id_objeto === id_objeto);

        if (!objetoEncontrado) return null;

        // 3. Accedemos al movimiento por su índice usando el método .at() o validando la posición
        const movimiento = objetoEncontrado.movimientos[indice_movimiento];

        // Si existe el movimiento en ese índice, lo devuelve; si no, devuelve null
        return movimiento || null;
    }


    // Devuelve el array completo de movimientos de un grupo (no un movimiento puntual),
    // para el timeline: necesita verlos todos a la vez, no uno por indice.
    obtenerMovimientosDeGrupo(nombreEvento, id_objeto){
        const eventoEncontrado = this.eventos.find(e => e.evento.nombre === nombreEvento);
        if (!eventoEncontrado) return null;

        const objetoEncontrado = eventoEncontrado.evento.objetos.find(obj => obj.id_objeto === id_objeto);
        if (!objetoEncontrado) return null;

        return objetoEncontrado.movimientos;
    }

    actualizarDatosMovimiento(nombreEvento, id_objeto, indice_movimiento, nuevosDatos) {
        // 1. Buscar evento
        const eventoEncontrado = this.eventos.find(
            e => e.evento.nombre === nombreEvento
        );

        if (!eventoEncontrado) return false;

        // 2. Buscar objeto
        const objetoEncontrado = eventoEncontrado.evento.objetos.find(
            obj => obj.id_objeto === id_objeto
        );

        if (!objetoEncontrado) return false;

        // 3. Buscar movimiento
        const movimiento = objetoEncontrado.movimientos[indice_movimiento];

        if (!movimiento) return false;

        // 4. Reemplazar datos
        movimiento.datos = nuevosDatos;

        return true;
    }

    obtenerIndiceEvento(nombreEvento) {
        return this.eventos.findIndex(evento => evento.evento.nombre === nombreEvento);
    }

    procesandoEvento(evento_, tiempo_evento){

        if(evento_){
            //console.log(tiempo_evento)
            if(!evento_.activar_tiempo){
                evento_.activar_tiempo = true;
                this.gestion_grupos_originales.procesarPosicionFinalFiguras()
                evento_.tiempo.modPasivo();
                // modPasivo() siempre despausa. Antes esto era inofensivo porque esta
                // rama solo se ejecutaba en el primer tick DESPUES de apretar Play; ahora
                // que procesandoEvento corre siempre (incluso en carga inicial/pausado),
                // hay que volver a pausar aca si no estamos reproduciendo -- si no, el
                // evento arranca a correr solo apenas se activa por primera vez.
                if(!this.reproducir){
                    evento_.tiempo.pausar();
                }
                console.log("INICIALIZANDO EL TIEMPO DEL EVENTO")
            }else{
                // tiempo_evento: segundos desde el inicio del evento SELECCIONADO (es lo
                // que mide el reloj y muestra el timeline). Se reproduce "en contexto":
                // el arbol completo se evalua en el instante absoluto equivalente, asi
                // los eventos anteriores ya terminados aportan su efecto congelado (ej.
                // "Sentarse" arranca donde termino "Caminar").
                const seleccionado = this.eventoReproduccion();
                if(tiempo_evento <= this.duracionReproduccion()){
                    const raiz = evento_.evento;
                    const tiempo_absoluto = this.inicioAbsoluto(seleccionado) + tiempo_evento;
                    this._t_escena = tiempo_absoluto;   // Fase 6: reloj de las instancias
                    this.procesarNodoEvento(raiz, tiempo_absoluto - raiz.tiempo_inicio/1000, new Set());
                }else{
                    console.log("SE TERMINO EL TIEMPO: ", tiempo_evento)
                    this.reiniciarEventos();
                    this.reiniciarProceso();
                }
            }
        }
    }

    // Agrega una animacion completa (sus grupos_figuras) a la escena como una
    // INSTANCIA: todos sus grupos quedan dentro de un grupo contenedor nuevo
    // ("<nombre>_<n>") ubicado de modo que el centro del dibujo caiga en (x, y), y se
    // renombran con ese prefijo para no chocar con los grupos existentes (los nombres
    // deben ser unicos: los eventos referencian grupos por nombre). Los grupos vacios
    // (sin figuras propias ni en sus descendientes, ej. "default") se omiten.
    // Devuelve el nombre del contenedor, o null si la animacion no tiene figuras.
    agregarInstanciaAnimacion(grupos_asset, nombre_animacion, x, y){
        const asset = structuredClone(grupos_asset || []);
        const hijos_de = (nombre) => asset.filter((g) => g.nodo_padre === nombre);
        const util = new Map();
        const tieneFiguras = (g) => {
            if(util.has(g.nombre)) return util.get(g.nombre);
            util.set(g.nombre, false); // proteccion contra ciclos
            const r = (g.lista_figuras || []).length > 0 || hijos_de(g.nombre).some(tieneFiguras);
            util.set(g.nombre, r);
            return r;
        };
        const grupos = asset.filter(tieneFiguras);
        if(grupos.length === 0){
            return null;
        }

        const lim = limitesGrupos(prepararGrupos(grupos));
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras.map((g) => g.nombre));
        const base = String(nombre_animacion || "animacion").replace(/[^A-Za-z0-9_-]+/g, "_") || "animacion";
        let n = 1, contenedor;
        do {
            contenedor = `${base}_${n++}`;
        } while(existentes.has(contenedor) || grupos.some((g) => existentes.has(`${contenedor}_${g.nombre}`)));

        const nombres = new Set(grupos.map((g) => g.nombre));
        const sinIds = (obj) => {
            if(Array.isArray(obj)) return obj.map(sinIds);
            if(obj && typeof obj === "object"){
                const copia = {};
                for(const k in obj){ if(k !== "_id") copia[k] = sinIds(obj[k]); }
                return copia;
            }
            return obj;
        };
        const nuevos = grupos.map((g) => ({
            ...sinIds(g),
            nombre: `${contenedor}_${g.nombre}`,
            nodo_padre: nombres.has(g.nodo_padre) ? `${contenedor}_${g.nodo_padre}` : contenedor,
        }));
        nuevos.forEach((g) => { delete g.cx_solid; delete g.cy_solid; });

        const capa_max = Math.max(0, ...this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g.nodo_padre === "root").map((g) => Number(g.capa) || 0));
        const grupo_contenedor = {
            nombre: contenedor,
            nodo_padre: "root",
            visible: true,
            color: "#000000",
            cx: Math.round(x - lim.cx),
            cy: Math.round(y - lim.cy),
            capa: capa_max + 1,
            clases: [],
            lista_figuras: [],
            lista_pintado: [{color: "#000000", visible: true, elementos: [[]]}],
            // Fase 1: transformacion de instancia neutra, con el ancla en el centro
            // inferior del objeto ("los pies"), relativa al origen del contenedor
            // (el contenedor no tiene figuras propias; su origen es cx/cy).
            transformacion: {
                rotacion: 0, escala_x: 1, escala_y: 1,
                ancla_x: Math.round(lim.cx), ancla_y: Math.round(lim.y1),
            },
        };

        const agregados = [grupo_contenedor, ...nuevos];
        this.gestion_grupos_originales.grupos_figuras.push(...structuredClone(agregados));
        this.gestion_grupos.grupos_figuras.push(...structuredClone(agregados));
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        for(const g of agregados){
            this.movimientos_grupos[g.nombre] = {x: 0, y: 0};
        }
        return contenedor;
    }

    // ================================================================
    // Objetos de la escena (Fase 2): un "objeto" es un grupo de primer nivel
    // (nodo_padre "root") que tiene figuras en su sub-arbol (perro, casa, una
    // instancia de la Biblioteca...). Estas operaciones escriben tanto en los grupos
    // originales (lo que se guarda con "Subir") como en la copia en vivo, para que
    // el cambio se vea en el mismo cuadro.
    // ================================================================

    // Indice de una lista de grupos (Fase 4: estas consultas corren en cada cuadro):
    // nombre -> grupo, padre -> hijos y "tiene figuras en su sub-arbol". O(n).
    _indice(lista){
        const por_nombre = new Map();
        const hijos = new Map();
        for(const g of lista){
            por_nombre.set(g.nombre, g);
            if(!hijos.has(g.nodo_padre)) hijos.set(g.nodo_padre, []);
            hijos.get(g.nodo_padre).push(g);
        }
        const memo = new Map();
        const con_figuras = (nombre, visitando = new Set()) => {
            if(memo.has(nombre)) return memo.get(nombre);
            if(visitando.has(nombre)) return false;   // ciclo en nodo_padre
            visitando.add(nombre);
            const g = por_nombre.get(nombre);
            const r = (!!g && (g.lista_figuras || []).length > 0)
                || (hijos.get(nombre) || []).some((h) => con_figuras(h.nombre, visitando));
            memo.set(nombre, r);
            return r;
        };
        return {por_nombre, hijos, con_figuras};
    }

    // Grupo y todos sus descendientes, de una lista de grupos.
    subarbol(nombre, lista){
        const {por_nombre, hijos} = this._indice(lista);
        const resultado = [];
        const pendientes = [nombre];
        const vistos = new Set();
        while(pendientes.length){
            const n = pendientes.pop();
            if(vistos.has(n)) continue;
            vistos.add(n);
            const g = por_nombre.get(n);
            if(g) resultado.push(g);
            (hijos.get(n) || []).forEach((x) => pendientes.push(x.nombre));
        }
        return resultado;
    }

    // Nombres de los objetos de la escena, en orden de dibujo (el ultimo queda arriba).
    objetosEscena(padre = "root"){
        // (con `padre` distinto de "root": las partes de un objeto en el que se "entro",
        // Fase 3)
        const {hijos, con_figuras} = this._indice(this.gestion_grupos.grupos_figuras);
        return (hijos.get(padre) || [])
            .filter((g) => con_figuras(g.nombre) || GestionEvento.grupoEsCamara(g) || grupoEsEfecto(g))
            .sort((a, b) => (Number(a.capa) || 0) - (Number(b.capa) || 0))
            .map((g) => g.nombre);
    }

    // ================================================================
    // Fase 8A: camara
    // ================================================================
    // La camara es un objeto mas de la escena (como en After Effects): un grupo sin
    // figuras con `camara: {ancho, alto, zoom}` y la clase "camara". Su posicion
    // (cx, cy) es el CENTRO de lo que se ve; lo visible mide ancho/zoom x alto/zoom.
    // Asi reutiliza seleccion, mover, claves (x, y, zoom), linea de tiempo y
    // trayectoria. No se dibuja: el lienzo muestra su marco.

    static CLASE_CAMARA = "camara";
    static CAMARA_DEFECTO = {ancho: 1280, alto: 720, zoom: 1};

    static grupoEsCamara(g){
        return !!(g && g.camara && (g.clases || []).includes(GestionEvento.CLASE_CAMARA));
    }

    esCamara(nombre){
        return GestionEvento.grupoEsCamara(this.gestion_grupos_originales.getGrupo(nombre));
    }

    nombreCamara(){
        const g = this.gestion_grupos_originales.grupos_figuras.find((x) => GestionEvento.grupoEsCamara(x));
        return g ? g.nombre : null;
    }

    // Garantiza que la escena tenga camara (encuadrando el area de documento por
    // defecto 1280x720, la misma de antes). Se guarda con Subir.
    asegurarCamara(){
        if(this.nombreCamara()) return this.nombreCamara();
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras.map((g) => g.nombre));
        let nombre = "Cámara", n = 2;
        while(existentes.has(nombre)) nombre = `Cámara ${n++}`;
        const d = GestionEvento.CAMARA_DEFECTO;
        const capa = Math.max(0, ...this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g.nodo_padre === "root").map((g) => Number(g.capa) || 0)) + 1;
        const g = {
            nombre, nodo_padre: "root", visible: true, color: "#f0b429",
            cx: d.ancho / 2, cy: d.alto / 2, capa, clases: [GestionEvento.CLASE_CAMARA],
            lista_figuras: [], lista_pintado: [{color: "#000000", visible: true, elementos: [[]]}],
            camara: {...d},
        };
        this.gestion_grupos_originales.grupos_figuras.push(structuredClone(g));
        this.gestion_grupos.grupos_figuras.push(structuredClone(g));
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        this.movimientos_grupos[nombre] = {x: 0, y: 0};
        return nombre;
    }

    // ================================================================
    // Fase 8B: profundidad
    // ================================================================
    // En un nivel con "orden por profundidad" (la escena: escena.orden_profundidad;
    // un objeto: su grupo.orden_profundidad) los hijos se dibujan por `plano` (menor
    // = mas atras, por defecto 0) y, dentro del mismo plano, por la altura de sus pies
    // (lo de mas abajo en pantalla queda delante). Como y_sort + z_index de Godot.
    // Sin profundidad se usa la capa, como siempre.

    escena = {};

    ordenProfundidad(contexto = "root"){
        if(contexto === "root") return !!(this.escena && this.escena.orden_profundidad);
        const g = this.gestion_grupos_originales.getGrupo(contexto);
        return !!(g && g.orden_profundidad);
    }

    fijarOrdenProfundidad(contexto, activo){
        if(contexto === "root"){
            this.escena = {...(this.escena || {}), orden_profundidad: !!activo};
            return;
        }
        this._ambos(contexto).forEach((g) => { if(activo) g.orden_profundidad = true; else delete g.orden_profundidad; });
    }

    planoObjeto(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return g ? (parseInt(g.plano, 10) || 0) : 0;
    }

    fijarPlano(nombre, plano){
        const p = Math.round(Number(plano) || 0);
        this._ambos(nombre).forEach((g) => { if(p) g.plano = p; else delete g.plano; });
    }

    // Lista de grupos en orden de dibujo (de atras hacia adelante), con sus partes
    // a continuacion de cada objeto. Usa la copia en vivo (posiciones del cuadro).
    ordenDibujo(){
        const lista = this.gestion_grupos.grupos_figuras;
        const hijos = new Map();
        for(const g of lista){
            const p = g.nodo_padre || "root";
            if(!hijos.has(p)) hijos.set(p, []);
            hijos.get(p).push(g);
        }
        const originales = new Map(this.gestion_grupos_originales.grupos_figuras.map((g) => [g.nombre, g]));
        // altura de los pies: origen absoluto + ancla (si tiene transformacion)
        const pie = (g) => {
            const t = g.transformacion;
            const y0 = Number.isFinite(g.cy_solid) ? g.cy_solid : (parseFloat(g.cy) || 0);
            return y0 + (t && Number.isFinite(parseFloat(t.ancla_y)) ? parseFloat(t.ancla_y) : 0);
        };
        const capa = (g) => Number(g.capa) || 0;
        const resultado = [];
        const vistos = new Set();
        const visitar = (padre, profundo) => {
            const hs = (hijos.get(padre) || []).slice();
            if(profundo){
                const plano = (g) => parseInt((originales.get(g.nombre) || g).plano, 10) || 0;
                hs.sort((a, b) => (plano(a) - plano(b)) || (pie(a) - pie(b)) || (capa(a) - capa(b)));
            } else {
                hs.sort((a, b) => capa(a) - capa(b));
            }
            for(const g of hs){
                if(vistos.has(g.nombre)) continue;
                vistos.add(g.nombre);
                resultado.push(g);
                const o = originales.get(g.nombre);
                visitar(g.nombre, !!(o && o.orden_profundidad));
            }
        };
        visitar("root", this.ordenProfundidad("root"));
        return resultado;
    }

    // ================================================================
    // Fase 9A: efectos (fuerzas y particulas) y reaccion fisica (ver Fisica.js)
    // ================================================================
    fisica = new SimFisica(this);

    esEfecto(nombre){
        return grupoEsEfecto(this.gestion_grupos_originales.getGrupo(nombre));
    }

    agregarEfecto(tipo, x, y){
        if(!TIPOS_EFECTO[tipo]) return null;
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras.map((g) => g.nombre));
        const base = TIPOS_EFECTO[tipo].etiqueta;
        let nombre = base, n = 2;
        while(existentes.has(nombre)) nombre = `${base} ${n++}`;
        const capa = Math.max(0, ...this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g.nodo_padre === "root").map((g) => Number(g.capa) || 0)) + 1;
        const g = {nombre, nodo_padre: "root", visible: true, color: "#ff8a3d", cx: Math.round(x), cy: Math.round(y),
            capa, clases: ["efecto"], lista_figuras: [],
            lista_pintado: [{color: "#000000", visible: true, elementos: [[]]}], efecto: efectoDefecto(tipo)};
        this.gestion_grupos_originales.grupos_figuras.push(structuredClone(g));
        this.gestion_grupos.grupos_figuras.push(structuredClone(g));
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        this.movimientos_grupos[nombre] = {x: 0, y: 0};
        return nombre;
    }

    fijarEfecto(nombre, clave, valor){
        this._ambos(nombre).forEach((g) => { if(g.efecto) g.efecto = {...g.efecto, [clave]: valor}; });
    }

    fisicaDe(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return (g && g.fisica) || {modo: "fijo"};
    }

    fijarFisica(nombre, cambios){
        this._ambos(nombre).forEach((g) => {
            const f = {...(g.fisica || {modo: "fijo"}), ...cambios};
            if(f.modo === "fijo" && Object.keys(f).length === 1) delete g.fisica; else g.fisica = f;
        });
    }

    // Particulas y (en el editor) los iconos de los efectos, en coordenadas del dibujo.
    dibujarEfectos(ctx, ox, oy, px, mostrar_iconos){
        const t = this.tiempoActualMs();
        const efs = this.gestion_grupos_originales.grupos_figuras.filter((g) => grupoEsEfecto(g) && !g._virtual);
        for(const g of efs){
            const ef = g.efecto;
            if(ef.tipo !== "particulas") continue;
            const pos = (tt) => ({x: this.valorPropiedad(g.nombre, "x", tt), y: this.valorPropiedad(g.nombre, "y", tt)});
            for(const p of particulasEn(ef, pos, t)){
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alfa));
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x + ox, p.y + oy, Math.max(0.5, p.tam / 2), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        if(!mostrar_iconos) return;
        ctx.save();
        ctx.lineWidth = 1.5 * px;
        for(const g of efs){
            const ef = g.efecto, x = this.valorPropiedad(g.nombre, "x", t) + ox, y = this.valorPropiedad(g.nombre, "y", t) + oy;
            ctx.strokeStyle = ef.tipo === "disparo" ? "#ff5252" : "#ff8a3d";
            ctx.setLineDash([5 * px, 4 * px]);
            ctx.beginPath();
            if(ef.tipo === "explosion") ctx.arc(x, y, Math.max(1, ef.radio || 0), 0, Math.PI * 2);
            else if(ef.tipo === "tornado") ctx.rect(x - (ef.radio || 0), y - (ef.alto || 0), 2 * (ef.radio || 0), ef.alto || 0);
            else if(ef.tipo === "disparo" || ef.tipo === "viento"){
                const a = (ef.angulo || 0) * Math.PI / 180, L = ef.tipo === "disparo" ? (ef.alcance || 0) : 120;
                ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath(); ctx.arc(x, y, 6 * px, 0, Math.PI * 2); ctx.fill();
            ctx.font = `${11 * px}px sans-serif`;
            ctx.fillText(g.nombre, x + 9 * px, y - 8 * px);
        }
        ctx.restore();
    }

    // Lo que ve la camara ahora (con sus claves): rectangulo en coordenadas del dibujo.
    rectCamara(){
        const nombre = this.nombreCamara();
        if(!nombre) return null;
        const d = this.gestion_grupos.getGrupo(nombre) || this.gestion_grupos_originales.getGrupo(nombre);
        const cam = {...GestionEvento.CAMARA_DEFECTO, ...(d.camara || {})};
        const zoom = Math.max(0.01, parseFloat(cam.zoom) || 1);
        const w = cam.ancho / zoom, h = cam.alto / zoom;
        const cx = parseFloat(d.cx) || 0, cy = parseFloat(d.cy) || 0;
        return {nombre, cx, cy, zoom, ancho: cam.ancho, alto: cam.alto, w, h, x0: cx - w / 2, y0: cy - h / 2};
    }

    // Cambia zoom (con claves si esta animado), ancho o alto de la camara.
    fijarCamara(nombre, campo, v){
        if(!this.esCamara(nombre) || !Number.isFinite(v)) return;
        if(campo === "zoom"){
            const z = Math.max(0.05, Math.min(20, Math.round(v * 1000) / 1000));
            if(this.tieneClaves(nombre, "zoom")) { this.ponerClave(nombre, "zoom", z); return; }
            this._ambos(nombre).forEach((g) => { g.camara = {...g.camara, zoom: z}; });
        } else if(campo === "ancho" || campo === "alto"){
            const n = Math.max(16, Math.round(v));
            this._ambos(nombre).forEach((g) => { g.camara = {...g.camara, [campo]: n}; });
        }
    }

    // Rectangulo del objeto en su espacio propio (sin su transformacion ni la de sus
    // ancestros), con la pose actual (en vivo). Usa las posiciones absolutas
    // (cx_solid) que el dibujo calcula en cada cuadro, sin clonar nada; si todavia no
    // existen (primer cuadro), las calcula sobre una copia.
    limitesObjeto(nombre){
        // 9A: un efecto se toma por su centro
        if(this.esEfecto(nombre)){
            const g = this.gestion_grupos.getGrupo(nombre) || this.gestion_grupos_originales.getGrupo(nombre);
            const x = parseFloat(g.cx) || 0, y = parseFloat(g.cy) || 0;
            return {x0: x - 14, y0: y - 14, x1: x + 14, y1: y + 14, cx: x, cy: y};
        }
        // 8A: la camara no tiene figuras; sus limites son lo que ve
        if(this.esCamara(nombre)){
            const r = this.rectCamara();
            return r ? {x0: r.x0, y0: r.y0, x1: r.x0 + r.w, y1: r.y0 + r.h, cx: r.cx, cy: r.cy} : null;
        }
        const sub = this.subarbol(nombre, this.gestion_grupos.grupos_figuras);
        if(!sub.length) return null;
        if(sub.every((g) => Number.isFinite(g.cx_solid) && Number.isFinite(g.cy_solid))){
            return limitesGrupos(sub);
        }
        const nombres = new Set(sub.map((g) => g.nombre));
        return limitesGrupos(prepararGrupos(this.gestion_grupos.grupos_figuras).filter((g) => nombres.has(g.nombre)));
    }

    // ---- propiedades de objeto para el panel de la escena (Fase 3) ----

    esVisible(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return !!g && g.visible !== false;
    }

    fijarVisible(nombre, visible){
        this._ambos(nombre).forEach((g) => { g.visible = !!visible; });
    }

    // "Bloqueado" (no se puede seleccionar en el lienzo) se guarda como la clase
    // "bloqueado" en `clases`, que ya existe en el esquema del backend.
    estaBloqueado(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return !!g && (g.clases || []).includes("bloqueado");
    }

    fijarBloqueado(nombre, bloqueado){
        this._ambos(nombre).forEach((g) => {
            const clases = (g.clases || []).filter((c) => c !== "bloqueado");
            g.clases = bloqueado ? [...clases, "bloqueado"] : clases;
        });
    }

    // Sube (+1) o baja (-1) el objeto un lugar en el orden de dibujo entre sus
    // hermanos, renumerando las capas de todos ellos (0, 1, 2...).
    moverCapa(nombre, direccion){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g) return;
        const hermanos = this.gestion_grupos_originales.grupos_figuras
            .filter((x) => x.nodo_padre === g.nodo_padre)
            .sort((a, b) => (Number(a.capa) || 0) - (Number(b.capa) || 0));
        const i = hermanos.findIndex((x) => x.nombre === nombre);
        const j = i + direccion;
        if(i < 0 || j < 0 || j >= hermanos.length) return;
        [hermanos[i], hermanos[j]] = [hermanos[j], hermanos[i]];
        hermanos.forEach((h, k) => this._ambos(h.nombre).forEach((x) => { x.capa = k; }));
    }

    // Renombra un objeto (grupo): actualiza los hijos (nodo_padre) y los eventos que
    // lo referencian. Devuelve un mensaje de error o null si salio bien.
    renombrarObjeto(viejo, nuevo){
        nuevo = String(nuevo || "").trim();
        if(!nuevo) return "El nombre no puede estar vacío.";
        if(nuevo === viejo) return null;
        if(nuevo === "root") return "Nombre reservado.";
        if(this.gestion_grupos_originales.getGrupo(nuevo)) return `Ya existe un grupo llamado "${nuevo}".`;
        for(const gestion of [this.gestion_grupos_originales, this.gestion_grupos]){
            for(const g of gestion.grupos_figuras){
                if(g.nombre === viejo) g.nombre = nuevo;
                if(g.nodo_padre === viejo) g.nodo_padre = nuevo;
            }
        }
        for(const e of this.eventos){
            for(const o of e.evento.objetos || []){
                if(o.id_objeto === viejo) o.id_objeto = nuevo;
            }
        }
        if(this.movimientos_grupos[viejo]){
            this.movimientos_grupos[nuevo] = this.movimientos_grupos[viejo];
            delete this.movimientos_grupos[viejo];
        }
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        return null;
    }

    // Los dos grupos (original y en vivo) de un nombre.
    _ambos(nombre){
        return [this.gestion_grupos_originales.getGrupo(nombre), this.gestion_grupos.getGrupo(nombre)]
            .filter(Boolean);
    }

    // Garantiza que el objeto tenga `transformacion` (neutra, ancla en los pies) y la
    // devuelve. Los objetos dibujados a mano (ej. "perro") no la traen de fabrica.
    asegurarTransformacion(nombre){
        const original = this.gestion_grupos_originales.getGrupo(nombre);
        if(!original) return null;
        if(!original.transformacion){
            // posiciones absolutas con todo el arbol (sirve tambien para partes)
            const nombres = new Set(this.subarbol(nombre, this.gestion_grupos_originales.grupos_figuras).map((g) => g.nombre));
            const orden = prepararGrupos(this.gestion_grupos_originales.grupos_figuras);
            const lim = limitesGrupos(orden.filter((g) => nombres.has(g.nombre)));
            const propio = orden.find((g) => g.nombre === nombre);
            const origen_x = propio ? propio.cx_solid : 0, origen_y = propio ? propio.cy_solid : 0;
            const t = {rotacion: 0, escala_x: 1, escala_y: 1,
                ancla_x: lim ? Math.round(lim.cx - origen_x) : 0,
                ancla_y: lim ? Math.round(lim.y1 - origen_y) : 0};
            this._ambos(nombre).forEach((g) => { g.transformacion = {...t}; });
        }
        return normalizarTransformacion(original.transformacion);
    }

    // Cambia campos de la transformacion de un objeto (en original y en vivo).
    // Fase 7: una propiedad con pista de claves no cambia su valor base: pone una
    // clave en el instante actual (como el cronometro de After Effects).
    cambiarTransformacion(nombre, cambios){
        this.asegurarTransformacion(nombre);
        const base = {};
        for(const prop in cambios){
            if(this.tieneClaves(nombre, prop)) this.ponerClave(nombre, prop, cambios[prop]);
            else base[prop] = cambios[prop];
        }
        if(Object.keys(base).length){
            this._ambos(nombre).forEach((g) => { g.transformacion = {...g.transformacion, ...base}; });
        }
    }

    // Posicion (cx, cy) del objeto (con claves: la del instante actual).
    posicionObjeto(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g) return null;
        return {x: this.valorPropiedad(nombre, "x"), y: this.valorPropiedad(nombre, "y")};
    }

    fijarPosicionObjeto(nombre, x, y){
        const r = (v) => Math.round(v * 100) / 100;
        const con_x = this.tieneClaves(nombre, "x"), con_y = this.tieneClaves(nombre, "y");
        if(con_x) this.ponerClave(nombre, "x", r(x));
        if(con_y) this.ponerClave(nombre, "y", r(y));
        if(!con_x || !con_y){
            this._ambos(nombre).forEach((g) => {
                if(!con_x) g.cx = r(x);
                if(!con_y) g.cy = r(y);
            });
            this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        }
    }

    // ================================================================
    // Fase 7: fotogramas clave (ver Claves.js)
    // ================================================================
    // Las claves viven en el grupo original (`claves`, se guardan con el documento);
    // en cada cuadro _aplicarClaves escribe los valores interpolados en la copia en
    // vivo, encima de los desplazamientos de los movimientos.

    // Opacidad base del objeto (0..1), o clave si la propiedad esta animada.
    fijarOpacidad(nombre, v){
        const a = Math.max(0, Math.min(1, Math.round(v * 1000) / 1000));
        if(this.tieneClaves(nombre, "opacidad")) this.ponerClave(nombre, "opacidad", a);
        else this._ambos(nombre).forEach((g) => { g.opacidad = a; });
    }

    // Instante actual de la escena en ms (el que marca la linea de tiempo).
    tiempoActualMs(){
        return Math.round((this._t_escena || 0) * 1000);
    }

    tieneClaves(nombre, prop){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return !!(g && Claves.tienePista(g.claves, prop));
    }

    // Valor de una propiedad en el instante t (ms; por defecto el actual).
    valorPropiedad(nombre, prop, t = this.tiempoActualMs()){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g || !Claves.PROPIEDADES[prop]) return null;
        const v = Claves.tienePista(g.claves, prop) ? Claves.valorObjeto(g.claves, prop, t, g.claves_bucle) : null;
        return v !== null ? v : Claves.PROPIEDADES[prop].base(g);
    }

    _cambiarPista(nombre, prop, fn){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g) return;
        const claves = {...(g.claves || {})};
        const pista = fn(claves[prop] || []);
        if(pista && pista.length) claves[prop] = pista; else delete claves[prop];
        const final = Object.keys(claves).length ? claves : undefined;
        this._ambos(nombre).forEach((x) => { if(final) x.claves = final; else delete x.claves; });
        // sin pista: la copia en vivo vuelve al valor base
        if(!final || !final[prop]) this._restaurarBase(nombre, prop);
    }

    _restaurarBase(nombre, prop){
        const o = this.gestion_grupos_originales.getGrupo(nombre);
        const d = this.gestion_grupos.getGrupo(nombre);
        if(!o || !d) return;
        if(prop === "opacidad") d.opacidad = o.opacidad;
        else if(prop === "zoom") d.camara = o.camara ? {...o.camara} : o.camara;
        else if(prop !== "x" && prop !== "y") d.transformacion = o.transformacion ? {...o.transformacion} : o.transformacion;
    }

    // Pone (o reemplaza) la clave de `prop` en el instante t con el valor v.
    ponerClave(nombre, prop, v, t = this.tiempoActualMs(), interp){
        if(!Claves.PROPIEDADES[prop]) return;
        if(prop !== "x" && prop !== "y" && prop !== "opacidad" && prop !== "zoom") this.asegurarTransformacion(nombre);
        this._cambiarPista(nombre, prop, (p) => Claves.ponerClave(p, t, v, interp));
    }

    quitarClave(nombre, prop, t = this.tiempoActualMs()){
        this._cambiarPista(nombre, prop, (p) => Claves.quitarClave(p, t));
    }

    // Boton ◆ del Inspector: si hay clave en el instante la quita; si no, la crea
    // con el valor que tiene ahora (la primera clave "enciende" la pista).
    alternarClave(nombre, prop, t = this.tiempoActualMs()){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g) return;
        if(Claves.indiceClave(g.claves && g.claves[prop], t) >= 0) this.quitarClave(nombre, prop, t);
        else this.ponerClave(nombre, prop, this.valorPropiedad(nombre, prop, t), t);
    }

    // Quita toda la pista (la propiedad vuelve a su valor base).
    quitarPista(nombre, prop){
        this._cambiarPista(nombre, prop, () => []);
    }

    claveEn(nombre, prop, t = this.tiempoActualMs()){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        const p = g && g.claves && g.claves[prop];
        const i = Claves.indiceClave(p, t);
        return i >= 0 ? p[i] : null;
    }

    // Todas las claves de un objeto: [{prop, t, v, interp}] (para la linea de tiempo).
    clavesDe(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        const r = [];
        for(const prop in (g && g.claves) || {}){
            for(const c of g.claves[prop]) r.push({prop, ...c});
        }
        return r.sort((a, b) => a.t - b.t);
    }

    // Mueve en el tiempo las claves de un objeto que estan en t_desde (todas sus
    // propiedades, o solo `props`).
    moverClaves(nombre, t_desde, t_hasta, props){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        for(const prop of props || Object.keys((g && g.claves) || {})){
            this._cambiarPista(nombre, prop, (p) => Claves.moverClave(p, t_desde, t_hasta));
        }
    }

    cambiarInterpolacion(nombre, prop, t, interp){
        this._cambiarPista(nombre, prop, (p) => p.map((c) =>
            (Math.abs(c.t - t) <= Claves.TOLERANCIA_MS ? {...c, interp} : c)));
    }

    // ---- Fase 7B: bucle y edicion de varias claves ----

    bucleClaves(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return (g && g.claves_bucle) || "mantener";
    }

    fijarBucleClaves(nombre, modo){
        this._ambos(nombre).forEach((g) => {
            if(!modo || modo === "mantener") delete g.claves_bucle; else g.claves_bucle = modo;
        });
    }

    // Tramo que se repite (primera a ultima clave del objeto) o null.
    tramoClaves(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return g ? Claves.tramoClaves(g.claves) : null;
    }

    // Reescribe todas las pistas del objeto con fn(prop, pista) -> pista.
    _cambiarTodas(nombre, fn){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g || !g.claves) return;
        for(const prop of Object.keys(g.claves)) this._cambiarPista(nombre, prop, (p) => fn(prop, p));
    }

    // Borra las claves (de todas las propiedades) en esos instantes.
    eliminarClavesEn(nombre, instantes){
        const en = (t) => instantes.some((x) => Math.abs(x - t) <= Claves.TOLERANCIA_MS);
        this._cambiarTodas(nombre, (prop, p) => p.filter((c) => !en(c.t)));
    }

    // Corre en el tiempo las claves de esos instantes (todas juntas). Una clave no
    // seleccionada que quede en el mismo instante que una movida se reemplaza.
    desplazarInstantes(nombre, instantes, delta_ms){
        const en = (t) => instantes.some((x) => Math.abs(x - t) <= Claves.TOLERANCIA_MS);
        const minimo = Math.min(...instantes);
        const d = Math.round(Math.max(delta_ms, -minimo));          // no antes de 0
        this._cambiarTodas(nombre, (prop, p) => {
            const movidas = p.filter((c) => en(c.t)).map((c) => ({...c, t: c.t + d}));
            const quietas = p.filter((c) => !en(c.t) &&
                !movidas.some((m) => Math.abs(m.t - c.t) <= Claves.TOLERANCIA_MS));
            return quietas.concat(movidas).sort((a, b) => a.t - b.t);
        });
        return instantes.map((t) => t + d);
    }

    // Copia las claves de esos instantes: {claves: [{prop, dt, v, interp}]} con dt
    // relativo al primer instante (se pegan a partir del cursor).
    copiarClaves(nombre, instantes){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        if(!g || !g.claves || !instantes.length) return null;
        const base = Math.min(...instantes);
        const en = (t) => instantes.some((x) => Math.abs(x - t) <= Claves.TOLERANCIA_MS);
        const claves = [];
        for(const prop in g.claves){
            for(const c of g.claves[prop]) if(en(c.t)) claves.push({prop, dt: c.t - base, v: c.v, interp: c.interp});
        }
        return claves.length ? {claves} : null;
    }

    // Pega lo copiado en el objeto (puede ser otro) a partir del instante t.
    // Devuelve los instantes donde quedaron claves.
    pegarClaves(nombre, copia, t = this.tiempoActualMs()){
        if(!copia || !copia.claves) return [];
        const ts = new Set();
        for(const c of copia.claves){
            this.ponerClave(nombre, c.prop, c.v, t + c.dt, c.interp);
            ts.add(t + c.dt);
        }
        return [...ts];
    }

    // En cada cuadro: valores interpolados -> copia en vivo. Posicion: reemplaza la
    // base y conserva el desplazamiento de los movimientos del cuadro.
    _aplicarClaves(t_ms){
        const dinamicos = new Map(this.gestion_grupos.grupos_figuras.map((g) => [g.nombre, g]));
        for(const o of this.gestion_grupos_originales.grupos_figuras){
            if(!o.claves) continue;
            const d = dinamicos.get(o.nombre);
            if(!d) continue;
            const c = o.claves;
            const con_x = Claves.tienePista(c, "x"), con_y = Claves.tienePista(c, "y");
            if(con_x || con_y){
                // desplazamiento de los movimientos de este cuadro (en el marco del objeto, D11)
                const mov = transformarVector(o.transformacion, this.movimientos_grupos[o.nombre] || {x: 0, y: 0});
                if(con_x) d.cx = Claves.valorObjeto(c, "x", t_ms, o.claves_bucle) + mov.x;
                if(con_y) d.cy = Claves.valorObjeto(c, "y", t_ms, o.claves_bucle) + mov.y;
            }
            if(Claves.tienePista(c, "opacidad")) d.opacidad = Math.max(0, Math.min(1, Claves.valorObjeto(c, "opacidad", t_ms, o.claves_bucle)));
            if(Claves.tienePista(c, "zoom") && o.camara) d.camara = {...o.camara, zoom: Math.max(0.05, Claves.valorObjeto(c, "zoom", t_ms, o.claves_bucle))};
            const props_t = ["rotacion", "escala_x", "escala_y"].filter((p) => Claves.tienePista(c, p));
            if(props_t.length){
                const t = {...(o.transformacion || {rotacion: 0, escala_x: 1, escala_y: 1, ancla_x: 0, ancla_y: 0})};
                for(const p of props_t) t[p] = Claves.valorObjeto(c, p, t_ms, o.claves_bucle);
                d.transformacion = t;
            }
        }
    }

    moverObjeto(nombre, dx, dy){
        const p = this.posicionObjeto(nombre);
        if(p) this.fijarPosicionObjeto(nombre, p.x + dx, p.y + dy);
    }

    // Borra el objeto y todo su sub-arbol (los movimientos de eventos que lo
    // referencian quedan sin efecto).
    eliminarObjeto(nombre){
        if(this.esCamara(nombre)) return;          // 8A: la escena siempre tiene camara
        for(const gestion of [this.gestion_grupos_originales, this.gestion_grupos]){
            const quitar = new Set(this.subarbol(nombre, gestion.grupos_figuras).map((g) => g.nombre));
            gestion.grupos_figuras = gestion.grupos_figuras.filter((g) => !quitar.has(g.nombre));
        }
        delete this.movimientos_grupos[nombre];
    }

    // Copia el objeto (con su sub-arbol y su transformacion) desplazado (dx, dy). Los
    // grupos se renombran: el prefijo "<objeto>_" pasa a "<copia>_" y los que no lo
    // tenian lo reciben. Devuelve el nombre de la copia.
    duplicarObjeto(nombre, dx = 20, dy = 20){
        if(this.esCamara(nombre)) return null;
        // sin las partes virtuales de instancias (Fase 6): las regenera su asset
        const sub = structuredClone(this.subarbol(nombre, this.gestion_grupos_originales.grupos_figuras).filter((g) => !g._virtual));
        if(!sub.length) return null;
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras.map((g) => g.nombre));
        const base = nombre.replace(/_\d+$/, "");
        let n = 1, nuevo;
        do { nuevo = `${base}_${n++}`; } while(existentes.has(nuevo));
        const renombrar = (x) => x === nombre ? nuevo
            : x.startsWith(nombre + "_") ? nuevo + x.slice(nombre.length) : `${nuevo}_${x}`;
        const nombres = new Set(sub.map((g) => g.nombre));
        const copia = sub.map((g) => {
            const c = {...g, nombre: renombrar(g.nombre),
                nodo_padre: nombres.has(g.nodo_padre) ? renombrar(g.nodo_padre) : g.nodo_padre};
            delete c._id; delete c.cx_solid; delete c.cy_solid;
            return c;
        });
        if(copia.some((g) => existentes.has(g.nombre))) return null;  // choque de nombres
        const raiz = copia.find((g) => g.nombre === nuevo);
        raiz.cx = (parseFloat(raiz.cx) || 0) + dx;
        raiz.cy = (parseFloat(raiz.cy) || 0) + dy;
        raiz.capa = Math.max(0, ...this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g.nodo_padre === raiz.nodo_padre).map((g) => Number(g.capa) || 0)) + 1;  // encima de sus hermanos
        this.gestion_grupos_originales.grupos_figuras.push(...structuredClone(copia));
        this.gestion_grupos.grupos_figuras.push(...structuredClone(copia));
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        copia.forEach((g) => { this.movimientos_grupos[g.nombre] = {x: 0, y: 0}; });
        return nuevo;
    }

    // Sub-eventos (hijos directos) de un evento, en el orden en que estan guardados.
    obtenerSubEventos(nombre){
        return this.eventos
            .filter((e) => e.evento.nodo_padre === nombre && e.evento.nombre !== nombre)
            .map((e) => e.evento);
    }

    // Evento que se reproduce: el seleccionado por el usuario o, si no hay (o ya no
    // existe), EventoGeneral.
    eventoReproduccion(){
        const seleccionado = this.id_evento_seleccionado && this.obtenerEvento(this.id_evento_seleccionado);
        const evento_ = seleccionado || this.obtenerEvento("EventoGeneral");
        return evento_ ? evento_.evento : null;
    }

    // Duracion (segundos) del evento que se reproduce = largo del timeline.
    duracionReproduccion(){
        const evento = this.eventoReproduccion();
        return evento ? (evento.tiempo_final - evento.tiempo_inicio)/1000 : 0;
    }

    // Instante (segundos, en el reloj de EventoGeneral) en que empieza `evento`: los
    // tiempos de cada sub-evento son relativos a su padre, asi que se acumulan
    // subiendo por nodo_padre hasta la raiz.
    inicioAbsoluto(evento){
        let inicio = 0;
        const visitados = new Set();
        while(evento && !visitados.has(evento.nombre)){
            visitados.add(evento.nombre);
            inicio += evento.tiempo_inicio/1000;
            if(evento.nombre === "EventoGeneral"){
                break;
            }
            const padre = this.obtenerEvento(evento.nodo_padre);
            evento = padre ? padre.evento : null;
        }
        return inicio;
    }

    // Cambia el evento a reproducir. Si cambia, vuelve al inicio y pausa (el reloj
    // pasa a medir otro evento, seguir desde el instante anterior no tendria sentido).
    seleccionarEvento(nombre){
        if(nombre === this.id_evento_seleccionado){
            return;
        }
        this.id_evento_seleccionado = nombre;
        this.reiniciarEventos();
        this.reiniciarProceso();
    }

    // Procesa un evento y, recursivamente, sus sub-eventos (los que tienen
    // nodo_padre === evento.nombre). `tiempo_local` (segundos) es el tiempo medido
    // desde el inicio de ESTE evento.
    //
    // Semantica de la jerarquia (igual que la de los movimientos):
    //  - tiempo_inicio/tiempo_final de un sub-evento son relativos al inicio de su padre.
    //  - antes de su tiempo_inicio el sub-evento no aporta nada.
    //  - despues de su tiempo_final queda congelado en su ultimo instante: su efecto
    //    se conserva (el perro que termino de caminar se queda donde llego), asi los
    //    eventos hermanos se pueden encadenar uno detras de otro.
    //
    // Bucle (Fase 5), para sub-eventos y movimientos:
    //  - la ventana [tiempo_inicio, tiempo_final] sigue diciendo CUANTO dura;
    //  - con `bucle` y `tiempo_bucle` > 0, el contenido se repite cada tiempo_bucle
    //    ms dentro de la ventana; al terminar la ventana queda congelado como siempre;
    //  - los desplazamientos (movimientos "Objeto") se ACUMULAN entre repeticiones:
    //    cada vuelta sigue desde donde quedo la anterior (el perro que camina en bucle
    //    avanza, no vuelve al punto de partida). Las figuras no se acumulan: se
    //    evaluan en el instante del ciclo en curso.
    //  - EventoGeneral (la raiz) no hace bucle: es el rango de reproduccion.
    procesarNodoEvento(evento, tiempo_local, visitados){
        if(visitados.has(evento.nombre)){
            return; // proteccion contra ciclos en nodo_padre
        }
        visitados.add(evento.nombre);

        for(let obj_i=0; obj_i<evento.objetos.length; obj_i++){
            const objeto = evento.objetos[obj_i];
            for(let j=0; j<objeto.movimientos.length; j++){
                const movimiento = objeto.movimientos[j];
                if(!movimiento.activo){
                    continue;
                }
                const tiempo_inicio_mov = movimiento.tiempo_inicio/1000;
                const tiempo_fin_mov = movimiento.tiempo_final/1000;
                const duracion_mov = tiempo_fin_mov-tiempo_inicio_mov;
                if(tiempo_local < tiempo_inicio_mov){
                    continue;
                }
                // Una vez que el movimiento arranca, sigue aportando su desplazamiento
                // aunque su propia ventana ya haya terminado -- congelado en el valor que
                // tenia al llegar a tiempo_final (si no, el grupo saltaria de vuelta).
                const tiempo_virtual_mov = Math.min(tiempo_local-tiempo_inicio_mov, duracion_mov);
                const c = cicloBucle(tiempo_virtual_mov, movimiento.bucle, movimiento.tiempo_bucle);
                if(c){
                    // vueltas completas: solo el desplazamiento acumulado (Objeto)
                    if(c.vueltas > 0 && movimiento.tipo_efecto === TIPO_EFECTO_MOV_OBJETOS){
                        this.aplicarMovimiento(objeto, movimiento, c.periodo, c.periodo, c.vueltas);
                    }
                    this.aplicarMovimiento(objeto, movimiento, c.t, c.periodo);
                }else{
                    this.aplicarMovimiento(objeto, movimiento, tiempo_virtual_mov, duracion_mov);
                }
            }
        }

        const hijos = this.eventos.filter((e) => e.evento.nodo_padre === evento.nombre);
        for(let i=0; i<hijos.length; i++){
            const hijo = hijos[i].evento;
            const inicio_hijo = hijo.tiempo_inicio/1000;
            const fin_hijo = hijo.tiempo_final/1000;
            if(tiempo_local < inicio_hijo){
                continue;
            }
            const t_hijo = Math.min(tiempo_local, fin_hijo)-inicio_hijo;
            const c = cicloBucle(t_hijo, hijo.bucle, hijo.tiempo_bucle);
            if(c){
                // vueltas completas del sub-evento: desplazamiento de un ciclo entero
                // (evaluado una vez, sin tocar figuras) multiplicado por las vueltas
                if(c.vueltas > 0){
                    const ciclo = this.desplazamientosDe(hijo, c.periodo);
                    const destino = this._captura || this.movimientos_grupos;
                    for(const nombre in ciclo){
                        if(!destino[nombre]) destino[nombre] = {x: 0, y: 0};
                        destino[nombre].x += ciclo[nombre].x * c.vueltas;
                        destino[nombre].y += ciclo[nombre].y * c.vueltas;
                    }
                }
                this.procesarNodoEvento(hijo, c.t, visitados);
            }else{
                this.procesarNodoEvento(hijo, t_hijo, visitados);
            }
        }
    }

    // Desplazamientos (movimientos "Objeto") que produce `evento` en el instante
    // `tiempo` de su reloj, sin aplicar movimientos de figuras ni tocar el estado del
    // cuadro. Se usa para acumular las vueltas completas de un sub-evento en bucle.
    desplazamientosDe(evento, tiempo){
        const captura_previa = this._captura;
        this._captura = {};
        try{
            this.procesarNodoEvento(evento, tiempo, new Set());
            return this._captura;
        }finally{
            this._captura = captura_previa;
        }
    }

    // `repeticiones` (> 0): suma el desplazamiento de este instante esa cantidad de
    // veces (vueltas completas de un movimiento en bucle); los de figuras se ignoran.
    aplicarMovimiento(objeto, movimiento, tiempo_mov, duracion_mov, repeticiones = 0){
        const tipo = movimiento.tipo;
        const datos = movimiento.datos;

        if(movimiento.tipo_efecto === TIPO_EFECTO_MOV_OBJETOS){
            const resultado = GestionMovimientos.movimientoGrupo(tiempo_mov, tipo, datos, duracion_mov);
            const destino = this._captura || this.movimientos_grupos;
            if(this._captura && !destino[objeto.id_objeto]) destino[objeto.id_objeto] = {x: 0, y: 0};
            if (resultado && objeto.id_objeto in destino) {
                const k = repeticiones > 0 ? repeticiones : 1;
                destino[objeto.id_objeto].x += resultado.x * k;
                destino[objeto.id_objeto].y += resultado.y * k;
            }
        }

        // durante una captura (desplazamientosDe) o al sumar vueltas completas, las
        // figuras no se tocan
        if(this._captura || repeticiones > 0){
            return;
        }

        if(movimiento.tipo_efecto === TIPO_EFECTO_MOV_FIGURAS){
            // El pivote se define respecto al centro ORIGINAL del grupo (estable, no
            // se corre al deformarse), pero se transforma la pose ACTUAL de las
            // figuras (grupos_trabajo): asi varios movimientos de figuras sobre la
            // misma figura se componen en cadena (ej. rotacion de caminar congelada +
            // rotacion de sentarse) en vez de sumar posiciones absolutas.
            const id = objeto.id_objeto;
            const originales = this.gestion_grupos_originales.get_grupos_padre_ehijos(id);
            const trabajo = this.grupos_trabajo.filter((g) => g.nodo_padre === id || g.nombre === id);
            const resultado = GestionMovimientos.movimientoFiguras(tiempo_mov, tipo, datos,
                {grupos_figuras: trabajo}, trabajo, originales);
            if(!resultado){
                return;
            }
            // copia al escribir (Fase 4): la lista de figuras de un grupo se clona
            // recien cuando un movimiento de figuras la va a modificar
            for(const g of trabajo){
                if(!this._figuras_clonadas.has(g.nombre)){
                    g.lista_figuras = structuredClone(g.lista_figuras);
                    this._figuras_clonadas.add(g.nombre);
                }
            }
            for (const hash in resultado) {
                const valor = resultado[hash];
                const grupo_ = trabajo.find((g) => g.nombre === valor.nombre_grupo);
                const figura = grupo_ && grupo_.lista_figuras.find((f) => f.nombre === valor.nombre_figura);
                if(!figura){
                    continue;
                }
                // pivote absoluto -> local al grupo (los atributos de la figura son
                // locales: al dibujar se les suma el cx_solid del grupo, que ademas
                // incluye la traslacion de los movimientos "Objeto" de sus ancestros).
                const x = valor.pivote_x+valor.centro_x - origenGrupoX(grupo_);
                const y = valor.pivote_y+valor.centro_y - origenGrupoY(grupo_);
                if (figura.tipo_figura === "PUNTO" || figura.tipo_figura === "CIRCULO") {
                    figura.atributos.cx = x+valor.cx;
                    figura.atributos.cy = y+valor.cy;
                }
                if (figura.tipo_figura === "RECTA") {
                    figura.atributos.x1 = valor.x1+x;
                    figura.atributos.y1 = valor.y1+y;
                    figura.atributos.x2 = valor.x2+x;
                    figura.atributos.y2 = valor.y2+y;
                    figura.atributos.cx = valor.cx;
                    figura.atributos.cy = valor.cy;
                }
            }
        }
    }

    procesandoEventos(){
        tiempo_universal=performance.now();
        const tiempo = this.tiempo.cronometroC(tiempo_universal);
        if(true)//(this.reproducir)
        {
            this.tiempo_animacion = tiempo;
            for(let i=0; i<this.eventos.length; i++){
                for(let j=0; j<this.eventos[i].evento.objetos.length; j++){
                    this.eventos[i].evento.objetos[j].x_mov =0;
                    this.eventos[i].evento.objetos[j].y_mov =0;
                }
            }

            this._prepararCuadro();

            const evento_ = this.obtenerEvento("EventoGeneral");
            const tiempo_evento = evento_.tiempo.cronometroC(tiempo_universal);
            // Se procesa siempre (reproduciendo, pausado o recien buscado con
            // buscarTiempo), no solo mientras this.reproducir es true -- asi el
            // lienzo siempre refleja la posicion real del grupo en el instante que
            // marca el reloj del evento, en vez de congelarse en la pose de reposo
            // apenas se pausa.
            this.procesandoEvento(evento_, tiempo_evento);

            this._volcarCuadro();

            // Fase 7: fotogramas clave de propiedades de objeto
            this._aplicarClaves((this._t_escena || 0) * 1000);

            // Fase 6: instancias por referencia (sus partes las anima el motor de su asset)
            this.aplicarInstancias(this._t_escena || 0);

            // Fase 9A: efectos y fisica de piezas (despues de claves e instancias)
            try { this.fisica.aplicar(this.tiempoActualMs()); } catch (err) { console.error("fisica", err); }
        }
        if(this.detener){
            //this.tiempo.pausar();
        }

    }

    // Pone en cero los desplazamientos y arma la pose de trabajo del cuadro.
    _prepararCuadro(){
        for (let nombre_grupo in this.movimientos_grupos){
            this.movimientos_grupos[nombre_grupo]['x']=0;
            this.movimientos_grupos[nombre_grupo]['y']=0;
        }
        // Pose de trabajo de este frame: parte de las figuras originales y cada
        // movimiento de figuras la va transformando en orden. Fase 4: copia
        // superficial de los grupos (barata); la lista de figuras de un grupo se
        // clona solo si un movimiento de figuras la modifica (aplicarMovimiento).
        // Las listas no clonadas se comparten con los originales: la copia en
        // vivo no debe modificar sus figuras (nada del editor de eventos lo hace).
        this.grupos_trabajo = this.gestion_grupos_originales.grupos_figuras.map((g) => ({...g}));
        this._figuras_clonadas = new Set();
    }

    // Vuelca desplazamientos y figuras del cuadro en la copia en vivo.
    _volcarCuadro(){
        // indices por nombre (Fase 4: antes getGrupo recorria la lista por cada
        // grupo, O(n^2) por cuadro)
        const originales_por_nombre = new Map(this.gestion_grupos_originales.grupos_figuras.map((g) => [g.nombre, g]));
        const dinamicos_por_nombre = new Map(this.gestion_grupos.grupos_figuras.map((g) => [g.nombre, g]));

        for (let nombre_grupo in this.movimientos_grupos) {
            const grupo_ = originales_por_nombre.get(nombre_grupo);
            const dinamico = dinamicos_por_nombre.get(nombre_grupo);
            if (grupo_ && dinamico) {
                // si el grupo tiene transformacion de instancia, su desplazamiento
                // propio va en su marco (reflejado avanza hacia donde mira)
                const d = transformarVector(grupo_.transformacion, this.movimientos_grupos[grupo_.nombre]);
                dinamico.cx = grupo_.cx + d.x;
                dinamico.cy = grupo_.cy + d.y;
            }
        }

        // Vuelca la pose de trabajo completa (tambien las figuras sin movimiento
        // activo, para que al retroceder en el tiempo vuelvan a su forma original).
        for (let i=0; i<this.grupos_trabajo.length; i++){
            const g_trabajo = this.grupos_trabajo[i];
            const g_dinamico = dinamicos_por_nombre.get(g_trabajo.nombre);
            if(g_dinamico){
                g_dinamico.lista_figuras = g_trabajo.lista_figuras;
            }
        }
    }

    // ================================================================
    // Fase 6: instancias por referencia
    // ================================================================
    // Un grupo con `instancia: {id_eventos, evento, bucle, desfase}` es el
    // contenedor de un asset (el documento de eventos de otro proyecto). Las partes
    // del asset se agregan como grupos VIRTUALES debajo del contenedor
    // ("<contenedor>::<grupo>", `_virtual: true`): no se guardan (ver
    // gruposParaGuardar) y en cada cuadro el motor del asset les da la pose de su
    // evento en el instante t_escena - desfase.

    static SEPARADOR_INSTANCIA = "::";

    // fn(id_eventos) => Promise<documento de eventos>; la asigna el editor (axios)
    cargadorAssets = null;
    assets = new Map();   // id_eventos -> {estado, motor, error}

    // Evalua ESTE motor (usado como motor de un asset) en el instante `t` (segundos)
    // de `nombre_evento`, en contexto. Con `bucle`, el evento se repite y los
    // desplazamientos se acumulan entre vueltas (como D12). Devuelve la pose:
    // [{nombre, cx, cy, visible, lista_figuras}] (objetos nuevos; las listas de
    // figuras son de solo lectura).
    evaluarEn(nombre_evento, t, bucle){
        const raiz_ = this.obtenerEvento("EventoGeneral");
        if(!raiz_) return null;
        const elegido = (this.obtenerEvento(nombre_evento) || raiz_).evento;
        const raiz = raiz_.evento;
        const duracion = Math.max(0, (elegido.tiempo_final - elegido.tiempo_inicio) / 1000);
        this._prepararCuadro();
        let t_evento = Math.min(Math.max(0, t), duracion);
        if(bucle && duracion > 0){
            const c = cicloBucle(Math.max(0, t), true, duracion * 1000);
            t_evento = c.t;
            if(c.vueltas > 0){
                // Por vuelta solo avanza el objeto entero (grupos de primer nivel): las
                // partes (cola, patas...) vuelven a su pose al empezar cada vuelta. Si se
                // acumularan, lo que mueven para sentarse quedaria desplazado.
                const ciclo = this.desplazamientosDe(elegido, duracion);
                const primer_nivel = new Set(this.gestion_grupos_originales.grupos_figuras
                    .filter((g) => g.nodo_padre === "root").map((g) => g.nombre));
                for(const n in ciclo){
                    if(!primer_nivel.has(n)) continue;
                    if(!this.movimientos_grupos[n]) this.movimientos_grupos[n] = {x: 0, y: 0};
                    this.movimientos_grupos[n].x += ciclo[n].x * c.vueltas;
                    this.movimientos_grupos[n].y += ciclo[n].y * c.vueltas;
                }
            }
        }
        this.procesarNodoEvento(raiz, this.inicioAbsoluto(elegido) + t_evento - raiz.tiempo_inicio / 1000, new Set());
        this._volcarCuadro();
        this._aplicarClaves((this.inicioAbsoluto(elegido) + t_evento) * 1000);
        return this.gestion_grupos.grupos_figuras.map((g) => ({
            nombre: g.nombre, cx: g.cx, cy: g.cy, visible: g.visible, lista_figuras: g.lista_figuras,
            transformacion: g.transformacion, opacidad: g.opacidad,
        }));
    }

    // Clave del cache de assets: el documento, o el documento en una version fija (6C).
    static claveAsset(id, version){
        return version ? `${id}@${version}` : id;
    }

    // Asset (motor propio) de un documento de eventos -- o de una version congelada
    // suya -- ; lo pide la primera vez. `cargadorAssets(id, version)` devuelve el doc.
    _asset(id, version){
        if(!id) return null;
        const clave = GestionEvento.claveAsset(id, version);
        let a = this.assets.get(clave);
        // si fallo (red caida, sesion vencida...) se reintenta cada 5 s
        if(a && a.estado === "error" && !a.motor && performance.now() > (a.reintentar_en || 0)){
            this.assets.delete(clave);
            a = null;
        }
        if(!a && this.cargadorAssets){
            a = {estado: "cargando", rev: 0, id, version: version || null};
            this.assets.set(clave, a);
            this._cargarAsset(a);
        }
        return a && a.motor ? a : null;
    }

    _cargarAsset(a){
        return this.cargadorAssets(a.id, a.version).then((doc) => {
            const motor = new GestionEvento();
            motor.inicializar(doc.eventos || [], doc.grupos_figuras || [], doc._id);
            motor.gestion_grupos_originales.procesarPosicionFinalFiguras();
            motor.reseteoMovGrupos();
            a.motor = motor;
            a.nombre = doc.nombre;
            a.eventos = (doc.eventos || []).map((e) => e.nombre);
            a.numero_version = doc.version ? doc.version.numero : null;
            a.estado = "listo";
            a.error = "";
            a.rev++;                       // cambia la firma -> se reinyectan las partes
        }).catch((e) => {
            a.estado = "error";
            a.error = e?.response?.data?.error?.msj || e?.response?.data?.error || e?.message || String(e);
            a.reintentar_en = performance.now() + 5000;
            console.error("No se pudo cargar el asset", a.id, a.version, e);
        });
    }

    // Vuelve a pedir los assets que siguen "la ultima" (las versiones fijas no
    // cambian). Mientras tanto las instancias siguen con lo que tenian.
    recargarAssets(){
        const pendientes = [];
        for(const a of this.assets.values()){
            if(a.version || a.estado === "cargando") continue;
            if(!a.motor) a.estado = "cargando";
            pendientes.push(this._cargarAsset(a));
        }
        return Promise.all(pendientes);
    }

    // Contenedores de instancias de la escena (grupos reales con `instancia`).
    contenedoresInstancia(){
        return this.gestion_grupos_originales.grupos_figuras.filter((g) => g.instancia && g.instancia.id_eventos && !g._virtual);
    }

    // Grupos que se guardan con "Subir"/Exportar: sin las partes virtuales.
    gruposParaGuardar(){
        return this.gestion_grupos_originales.grupos_figuras.filter((g) => !g._virtual);
    }

    // Agrega/quita las partes virtuales segun las instancias existentes y sus
    // assets ya cargados. Barato si nada cambio (compara una firma).
    sincronizarInstancias(){
        const contenedores = this.contenedoresInstancia();
        const firma = contenedores.map((c) => {
            const a = this._asset(c.instancia.id_eventos, c.instancia.version);
            return `${c.nombre}|${GestionEvento.claveAsset(c.instancia.id_eventos, c.instancia.version)}|${a ? a.rev : "-"}`;
        }).join(";");
        if(firma === this._firma_instancias) return;
        this._firma_instancias = firma;

        const SEP = GestionEvento.SEPARADOR_INSTANCIA;
        for(const gestion of [this.gestion_grupos_originales, this.gestion_grupos]){
            gestion.grupos_figuras = gestion.grupos_figuras.filter((g) => !g._virtual);
        }
        for(const c of contenedores){
            const asset = this._asset(c.instancia.id_eventos, c.instancia.version);
            if(!asset) continue;
            const grupos = asset.motor.gestion_grupos_originales.grupos_figuras
                .filter((g) => !g.instancia && !g._virtual && !GestionEvento.grupoEsCamara(g) && !grupoEsEfecto(g));   // sin instancias anidadas (6A) ni camara/efectos del asset
            const nombres = new Set(grupos.map((g) => g.nombre));
            const virtuales = grupos.map((g) => {
                const v = {...g, nombre: `${c.nombre}${SEP}${g.nombre}`,
                    nodo_padre: nombres.has(g.nodo_padre) ? `${c.nombre}${SEP}${g.nodo_padre}` : c.nombre,
                    _virtual: true, _instancia: c.nombre, _original: g.nombre};
                delete v._id; delete v.cx_solid; delete v.cy_solid;
                return v;
            });
            this.gestion_grupos_originales.grupos_figuras.push(...virtuales.map((v) => ({...v})));
            this.gestion_grupos.grupos_figuras.push(...virtuales.map((v) => ({...v})));
            // primera vez: ubicar el contenedor para que el dibujo quede donde se solto
            if(c._ubicar){
                this._ubicarInstancia(c, virtuales);
            }
        }
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
    }

    // Centra el dibujo de una instancia recien agregada en el punto donde se solto y
    // pone el ancla de su transformacion en los pies.
    _ubicarInstancia(contenedor, virtuales){
        const {x, y} = contenedor._ubicar;
        const nombre = contenedor.nombre;
        const orden = prepararGrupos(virtuales.map((v) => (v.nodo_padre === nombre ? {...v, nodo_padre: "root"} : v)));
        const lim = limitesGrupos(orden);
        if(!lim) return;
        this._ambos(nombre).forEach((g) => {
            g.cx = Math.round(x - lim.cx);
            g.cy = Math.round(y - lim.cy);
            g.transformacion = {rotacion: 0, escala_x: 1, escala_y: 1,
                ancla_x: Math.round(lim.cx), ancla_y: Math.round(lim.y1)};
            delete g._ubicar;
        });
    }

    // En cada cuadro: pose de cada instancia segun su asset y su evento.
    aplicarInstancias(t_escena){
        this.sincronizarInstancias();
        const contenedores = this.contenedoresInstancia();
        if(!contenedores.length) return;
        const SEP = GestionEvento.SEPARADOR_INSTANCIA;
        const dinamicos = new Map(this.gestion_grupos.grupos_figuras.map((g) => [g.nombre, g]));
        const cache = new Map();   // misma pose para instancias con igual asset/evento/instante
        for(const c of contenedores){
            const asset = this._asset(c.instancia.id_eventos, c.instancia.version);
            if(!asset) continue;
            const inst = c.instancia;
            // 9A: si la fisica solto al objeto (o a una pieza suya), su animacion se congela
            const dc = dinamicos.get(c.nombre);
            const t_obj = dc && dc._t_congelado != null ? Math.min(t_escena, dc._t_congelado) : t_escena;
            const t = t_obj - (parseFloat(inst.desfase) || 0) / 1000;
            const clave = `${GestionEvento.claveAsset(inst.id_eventos, inst.version)}|${inst.evento}|${!!inst.bucle}|${t.toFixed(4)}`;
            let pose = cache.get(clave);
            if(!pose){
                pose = asset.motor.evaluarEn(inst.evento || "EventoGeneral", t, !!inst.bucle);
                cache.set(clave, pose);
            }
            for(const p of pose || []){
                const v = dinamicos.get(`${c.nombre}${SEP}${p.nombre}`);
                if(!v) continue;
                v.cx = p.cx;
                v.cy = p.cy;
                v.visible = p.visible;
                v.lista_figuras = p.lista_figuras;
                // Fase 7: claves del asset (rotacion, escala, opacidad de sus partes)
                if(p.transformacion !== undefined) v.transformacion = p.transformacion;
                if(p.opacidad !== undefined) v.opacidad = p.opacidad;
            }
        }
    }

    // Agrega una instancia por referencia del documento de eventos `id_eventos` en el
    // punto (x, y) del dibujo. Se ubica cuando el asset termina de cargar.
    agregarInstanciaReferencia(id_eventos, nombre_asset, x, y, evento = "EventoGeneral"){
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras.map((g) => g.nombre));
        // "proyecto · documento" -> el objeto se llama como el documento (con un solo
        // documento en el proyecto, el nombre del asset ya es el del proyecto)
        const base = String(nombre_asset || "instancia").split(" · ").pop()
            .replace(/[^A-Za-z0-9_-]+/g, "_") || "instancia";
        let n = 1, nombre;
        do { nombre = `${base}_${n++}`; } while(existentes.has(nombre));
        const capa = Math.max(0, ...this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g.nodo_padre === "root").map((g) => Number(g.capa) || 0)) + 1;
        const contenedor = {
            nombre, nodo_padre: "root", visible: true, color: "#000000",
            cx: Math.round(x), cy: Math.round(y), capa, clases: [],
            lista_figuras: [],
            lista_pintado: [{color: "#000000", visible: true, elementos: [[]]}],
            // `nombre`: como se llama el asset en la Biblioteca (nombre del proyecto)
            instancia: {id_eventos, nombre: nombre_asset || "", evento, bucle: true, desfase: 0},
            _ubicar: {x, y},
        };
        this.gestion_grupos_originales.grupos_figuras.push(structuredClone(contenedor));
        this.gestion_grupos.grupos_figuras.push(structuredClone(contenedor));
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        this.movimientos_grupos[nombre] = {x: 0, y: 0};
        this._asset(id_eventos);   // empezar a cargarlo
        return nombre;
    }

    // Fase 6B: "Desvincular". Convierte la instancia en una copia normal del dibujo
    // del asset (en su pose de reposo), editable parte por parte. Deja de seguir
    // al asset y no trae sus eventos (queda quieta). Devuelve el nombre del
    // contenedor, o un mensaje de error si el asset todavia no esta cargado.
    desvincularInstancia(nombre){
        const c = this.gestion_grupos_originales.getGrupo(nombre);
        if(!c || !c.instancia || !c.instancia.id_eventos) return {error: "No es una instancia."};
        if(!this._asset(c.instancia.id_eventos, c.instancia.version)) return {error: "El asset todavía no está cargado."};
        const SEP = GestionEvento.SEPARADOR_INSTANCIA;
        const existentes = new Set(this.gestion_grupos_originales.grupos_figuras
            .filter((g) => !(g._virtual && g._instancia === nombre)).map((g) => g.nombre));
        // nombre real de cada parte: <contenedor>_<grupo> (como las copias de la Biblioteca)
        const renombre = new Map();
        for(const g of this.gestion_grupos_originales.grupos_figuras){
            if(!(g._virtual && g._instancia === nombre)) continue;
            let nuevo = `${nombre}_${g._original}`, k = 2;
            while(existentes.has(nuevo)) nuevo = `${nombre}_${g._original}_${k++}`;
            existentes.add(nuevo);
            renombre.set(g.nombre, nuevo);
        }
        const convertir = (g) => {
            if(!(g._virtual && g._instancia === nombre)) return g;
            const r = {...g, nombre: renombre.get(g.nombre),
                nodo_padre: renombre.get(g.nodo_padre) || g.nodo_padre};
            delete r._virtual; delete r._instancia; delete r._original;
            return r;
        };
        // las partes de la lista original (pose de reposo) pasan a las dos listas
        const reales = this.gestion_grupos_originales.grupos_figuras
            .filter((g) => g._virtual && g._instancia === nombre).map(convertir);
        for(const gestion of [this.gestion_grupos_originales, this.gestion_grupos]){
            gestion.grupos_figuras = gestion.grupos_figuras
                .filter((g) => !(g._virtual && g._instancia === nombre))
                .concat(structuredClone(reales));
        }
        this._ambos(nombre).forEach((g) => { delete g.instancia; });
        for(const g of reales) this.movimientos_grupos[g.nombre] = {x: 0, y: 0};
        this._firma_instancias = null;
        this.gestion_grupos_originales.procesarPosicionFinalFiguras();
        return {nombre};
    }

    // Nombre visible del asset de una instancia (el de la Biblioteca si se guardo).
    nombreAsset(grupo){
        const inst = grupo && grupo.instancia;
        if(!inst) return "";
        return inst.nombre || (this.infoAsset(inst.id_eventos, inst.version) || {}).nombre || "asset";
    }

    esInstancia(nombre){
        const g = this.gestion_grupos_originales.getGrupo(nombre);
        return !!(g && g.instancia && g.instancia.id_eventos);
    }

    // Datos del asset de una instancia (para el Inspector): nombre y eventos.
    infoAsset(id_eventos, version){
        const a = this.assets.get(GestionEvento.claveAsset(id_eventos, version));
        return a ? {estado: a.motor && a.estado === "error" ? "listo" : a.estado, nombre: a.nombre, eventos: a.eventos || [],
            error: a.error, numero_version: a.numero_version} : null;
    }

    // Cambia campos de la instancia (evento, bucle, desfase).
    cambiarInstancia(nombre, cambios){
        this._ambos(nombre).forEach((g) => { if(g.instancia) g.instancia = {...g.instancia, ...cambios}; });
    }

    movimientos(tiempo, lista_mov, objetos){
        for(let i=0; i<lista_mov.length; i++){
            this.gestion_eventos.movimientoGrupo(tiempo,lista_mov[i], objetos)
        }
    }

    imprimirEventos(){
        const canvas = document.getElementById(this.id_canvas);
        if(canvas === null)
            return null;
        const ctx = canvas.getContext('2d');
        //ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.gestion_grupos.procesarPosicionFinalFiguras()
        // Fase 8B: orden de dibujo con profundidad (por capa, o por plano y altura)
        const lista_grupo_root = this.ordenDibujo();
        this.imprimir_animacion.imprimirListaGrupos(lista_grupo_root, [], [], [],
            null, null, null, null, true)
    }

    reproducirProceso(){
        this.reproducir = true;
        this.detener = false;
        this.reiniciar = false;
        this.tiempo.despausar();
    }

    detenerProceso(){
        this.reproducir = false;
        this.detener = true;
        this.reiniciar = false;
    }

    reiniciarProceso(){
        this.reiniciar = true;
        this.detener = false;
        this.reproducir = false;
    }

    resetearProceso(){
        this.reiniciar = false;
        this.detener = false;
        this.reproducir = false;
    }
};

export {GestionEvento}