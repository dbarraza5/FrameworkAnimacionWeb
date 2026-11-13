import {Tiempo} from "./Tiempo";
import {GestionMovimientos} from "./GestionMovimientos";
import {GestionAnimacion} from "../EditorAnimacion/GestionAnimacion";
import {ImprimirAnimacion} from "../EditorAnimacion/ImprimirAnimacion";
import ConfiguracionLienzo from "../EditorAnimacion/ConfiguracionLienzo";
import TimelineCanvas from "./TimelineCanvas";
import {TIPO_EFECTO_MOV_FIGURAS, TIPO_EFECTO_MOV_OBJETOS} from "./ConstanteEvento";
import OperacionesGrupo, {origenGrupoX, origenGrupoY} from "../EditorAnimacion/OperacionesGrupo";
import {limitesGrupos, prepararGrupos} from "../EditorAnimacion/Miniatura";

let tiempo_universal=performance.now();

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
                this.aplicarMovimiento(objeto, movimiento, tiempo_virtual_mov, duracion_mov);
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
            this.procesarNodoEvento(hijo, Math.min(tiempo_local, fin_hijo)-inicio_hijo, visitados);
        }
    }

    aplicarMovimiento(objeto, movimiento, tiempo_mov, duracion_mov){
        const tipo = movimiento.tipo;
        const datos = movimiento.datos;

        if(movimiento.tipo_efecto === TIPO_EFECTO_MOV_OBJETOS){
            const resultado = GestionMovimientos.movimientoGrupo(tiempo_mov, tipo, datos, duracion_mov);
            if (resultado && objeto.id_objeto in this.movimientos_grupos) {
                this.movimientos_grupos[objeto.id_objeto].x+=resultado.x;
                this.movimientos_grupos[objeto.id_objeto].y+=resultado.y;
            }
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

            for (let nombre_grupo in this.movimientos_grupos){
                this.movimientos_grupos[nombre_grupo]['x']=0;
                this.movimientos_grupos[nombre_grupo]['y']=0;
            }
            // Pose de trabajo de este frame: parte de las figuras originales y cada
            // movimiento de figuras la va transformando en orden.
            this.grupos_trabajo = structuredClone(this.gestion_grupos_originales.grupos_figuras);

            const evento_ = this.obtenerEvento("EventoGeneral");
            const tiempo_evento = evento_.tiempo.cronometroC(tiempo_universal);
            // Se procesa siempre (reproduciendo, pausado o recien buscado con
            // buscarTiempo), no solo mientras this.reproducir es true -- asi el
            // lienzo siempre refleja la posicion real del grupo en el instante que
            // marca el reloj del evento, en vez de congelarse en la pose de reposo
            // apenas se pausa.
            this.procesandoEvento(evento_, tiempo_evento);

            for (let nombre_grupo in this.movimientos_grupos) {
                const grupo_ = this.gestion_grupos_originales.getGrupo(nombre_grupo)
                if (grupo_) {
                    const x = grupo_.cx+this.movimientos_grupos[grupo_.nombre].x;
                    const y = grupo_.cy+this.movimientos_grupos[grupo_.nombre].y;
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cx", x);
                    this.gestion_grupos.set_atributo_grupo(grupo_.nombre, "cy", y);
                }
            }

            // Vuelca la pose de trabajo completa (tambien las figuras sin movimiento
            // activo, para que al retroceder en el tiempo vuelvan a su forma original).
            for (let i=0; i<this.grupos_trabajo.length; i++){
                const g_trabajo = this.grupos_trabajo[i];
                const g_dinamico = this.gestion_grupos.getGrupo(g_trabajo.nombre);
                if(g_dinamico){
                    g_dinamico.lista_figuras = g_trabajo.lista_figuras;
                }
            }

        }
        if(this.detener){
            //this.tiempo.pausar();
        }

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

        const lista_grupo_root = []//animacion.grupos_figuras.filter((g) => g.nodo_padre === "root")
        this.gestion_grupos.procesarPosicionFinalFiguras()
        this.gestion_grupos.listaOrdenadasGrupos(lista_grupo_root)
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