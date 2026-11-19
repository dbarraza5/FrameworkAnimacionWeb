import {getCoorPunto, getCoorRecta, numPos} from "./GestionAnimacion";
import {aplicarEnCanvas, cadenaTransformaciones, mapaGrupos, transformarPunto} from "./TransformacionInstancia";

// Un grupo se dibuja solo si el y todos sus ancestros estan visibles.
function visibleEfectivo(grupo, mapa) {
    const vistos = new Set();
    let g = grupo;
    while (g && !vistos.has(g.nombre)) {
        if (g.visible === false) return false;
        vistos.add(g.nombre);
        g = g.nodo_padre && g.nodo_padre !== "root" ? mapa.get(g.nodo_padre) : null;
    }
    return true;
}

// Fase 7: opacidad heredada (0..1), producto de la del grupo y sus ancestros.
function opacidadEfectiva(grupo, mapa) {
    const vistos = new Set();
    let g = grupo, a = 1;
    while (g && !vistos.has(g.nombre)) {
        if (g.opacidad !== undefined && g.opacidad !== null) a *= Math.max(0, Math.min(1, Number(g.opacidad)));
        vistos.add(g.nombre);
        g = g.nodo_padre && g.nodo_padre !== "root" ? mapa.get(g.nodo_padre) : null;
    }
    return Number.isFinite(a) ? a : 1;
}

// Estilo de dibujo heredado: el valor del grupo o del ancestro mas cercano que lo tenga.
// Lo usan "mezcla" (modo de fusion) y "desenfoque" (px). Sin el campo, no cambia nada.
function heredado(grupo, mapa, campo) {
    const vistos = new Set();
    let g = grupo;
    while (g && !vistos.has(g.nombre)) {
        if (g[campo] !== undefined && g[campo] !== null) return g[campo];
        vistos.add(g.nombre);
        g = g.nodo_padre && g.nodo_padre !== "root" ? mapa.get(g.nodo_padre) : null;
    }
    return null;
}

// ---------------- Fase 4 de planeacion_capacidades.md: sombras proyectadas ----------------
// Un objeto con `sombra: [{luz?, angulo?, piso, largo?, aplastar?, opacidad?, desenfoque?, color?}]`
// proyecta su silueta (todas sus partes) sobre el piso y = piso:
//   - luz: [x, y] (punto fijo) o "<nombre de un grupo>" (su origen, cada cuadro: luces que se
//     mueven); sin luz, `angulo` (grados desde la vertical; 0 = luz justo arriba).
//   - alcance (con luz): a esa distancia horizontal de la luz la sombra ya no se ve.
//   - aplastar: alto de la sombra respecto del objeto (0.3); negativo = la sombra cae hacia
//     adelante (luz detras del objeto). largo multiplica la inclinacion.
//   - si el objeto se despega del piso (salta), la sombra se aclara y se desenfoca.
// La silueta se arma en un lienzo aparte (asi las partes superpuestas no oscurecen el doble)
// y se pega con su opacidad. Se dibuja justo antes del primer objeto de su plano.
const numS = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

function lienzoAparte(ctx) {
    const c = ctx && ctx.canvas;
    if (!c || !c.width || !c.height) return null;
    try {
        if (typeof document !== "undefined" && document.createElement) {
            const o = document.createElement("canvas");
            o.width = c.width; o.height = c.height;
            return o;
        }
        return new c.constructor(c.width, c.height);
    } catch (e) {
        return null;
    }
}

function esDescendiente(g, raiz, mapa) {
    const vistos = new Set();
    for (let x = g; x && !vistos.has(x.nombre); x = x.nodo_padre && x.nodo_padre !== "root" ? mapa.get(x.nodo_padre) : null) {
        if (x.nombre === raiz) return true;
        vistos.add(x.nombre);
    }
    return false;
}

function origenVisto(g, mapa, ax = 0, ay = 0) {
    return transformarPunto(cadenaTransformaciones(g, mapa), {x: numS(g.cx_solid, numS(g.cx, 0)) + ax, y: numS(g.cy_solid, numS(g.cy, 0)) + ay});
}

// Modos de mezcla (nombres del formato simple -> canvas).
export const MODOS_MEZCLA = {
    normal: "source-over", suma: "lighter", pantalla: "screen", multiplicar: "multiply",
    superponer: "overlay", aclarar: "lighten", oscurecer: "darken",
};

// Relleno de un pintado: color plano, o degradado (lineal / radial) en coordenadas del
// grupo. degradado: {tipo: "lineal", de: [x,y], a: [x,y], colores: [[pos, color]...]}
//              o    {tipo: "radial", centro: [x,y], radio, radio_ini?, colores}
function rellenoDe(ctx, pintura, ox, oy) {
    const d = pintura.degradado;
    if (!d || !Array.isArray(d.colores) || d.colores.length < 2) return pintura.color;
    let gr;
    try {
        if (d.tipo === "radial") {
            const c = d.centro || [0, 0];
            gr = ctx.createRadialGradient(ox + c[0], oy + c[1], Math.max(0, Number(d.radio_ini) || 0), ox + c[0], oy + c[1], Math.max(1, Number(d.radio) || 1));
        } else {
            const a = d.de || [0, 0], b = d.a || [0, 1];
            gr = ctx.createLinearGradient(ox + a[0], oy + a[1], ox + b[0], oy + b[1]);
        }
        for (const [p, col] of d.colores) gr.addColorStop(Math.max(0, Math.min(1, Number(p) || 0)), col);
    } catch (e) {
        return pintura.color;
    }
    return gr;
}


class ImprimirAnimacion{
  animacion_=null;
  configuracion_lienzo=null;
  ctx=null;
  seccion_pintar = false;
  id_canvas = null;
  constructor(animacion_, config_lienzo, id_canvas) {
      this.animacion_ = animacion_;
      this.configuracion_lienzo = config_lienzo;
      this.id_canvas = id_canvas;
  }

  imprimirListaGrupoPintado(lista_grupo_root){
      this.seccion_pintar = false;
      if(this.ctx === null){
          const canvas = document.getElementById(this.id_canvas);
          this.ctx = canvas.getContext('2d');
      }


      for (let i = 0; i < lista_grupo_root.length; i++) {
          const grupo = lista_grupo_root[i]

          if(!grupo.visible){
              continue;
          }

          for(let j = 0; j<grupo.lista_pintado.length; j++){
              const pintura = grupo.lista_pintado[j];
              this.pintarGrupoAnimacion(grupo, pintura, true)
          }
      }
  }


  imprimirListaGrupos(lista_grupo_root, id_grupo_selec, id_figura_selec, lista_id_figuras,
                                 p_centro, p1_recta, p2_recta, p_circulo, pintado){
      this.seccion_pintar = false;
      if(this.ctx === null){
          const canvas = document.getElementById(this.id_canvas);
          this.ctx = canvas.getContext('2d');
      }


        // Transformacion de instancia (Fase 1): cada grupo se dibuja con la
        // transformacion de sus contenedores aplicada al canvas (ver
        // TransformacionInstancia.js). Sin transformaciones no cambia nada.
        const mapa = mapaGrupos(lista_grupo_root);
        const ox = !this.seccion_pintar ? this.configuracion_lienzo.x_delta_original : 0;
        const oy = !this.seccion_pintar ? this.configuracion_lienzo.y_delta_original : 0;

        // fase 4 de capacidades: objetos que proyectan sombra (se dibujan antes que su plano)
        // Cada sombra va justo despues del ultimo objeto de un plano mas atras (el piso, el fondo),
        // y nunca despues del propio objeto.
        const plano = (g) => parseInt(g.plano, 10) || 0;
        const raiz = (g) => !g.nodo_padre || g.nodo_padre === "root";
        const turno_sombras = new Map();                    // indice -> objetos cuya sombra va antes de el
        if(pintado){
            lista_grupo_root.forEach((c, i_c) => {
                if(!raiz(c) || !Array.isArray(c.sombra) || !c.sombra.length) return;
                let ultimo_atras = -1;
                lista_grupo_root.forEach((g, i) => { if(raiz(g) && plano(g) < plano(c)) ultimo_atras = i; });
                let pos = Math.min(i_c, ultimo_atras + 1);
                while(pos < i_c && !raiz(lista_grupo_root[pos])) pos++;          // no en medio de las partes de otro
                if(!turno_sombras.has(pos)) turno_sombras.set(pos, []);
                turno_sombras.get(pos).push(c);
            });
        }

        for (let i = 0; i < lista_grupo_root.length; i++) {
            const grupo = lista_grupo_root[i]
            if(turno_sombras.has(i)){
                for(const c of turno_sombras.get(i)) this.dibujarSombras(c, lista_grupo_root, mapa, ox, oy);
            }
            // visibilidad heredada: un grupo oculto oculta tambien a sus descendientes
            if(!visibleEfectivo(grupo, mapa)){
                continue;
            }
            /*for(let j = 0; j<grupo.lista_pintado.length; j++){
                const pintura = grupo.lista_pintado[j];
                this.pintarGrupoAnimacion(grupo, pintura, true)
            }*/

            const cadena = cadenaTransformaciones(grupo, mapa);
            // Fase 3: al "entrar" a un objeto, lo que queda fuera se dibuja atenuado
            const atenuado = !!(this.atenuados && this.atenuados.has(grupo.nombre));
            const alfa = opacidadEfectiva(grupo, mapa) * (atenuado ? 0.25 : 1);
            if(alfa <= 0.001){
                continue;
            }
            const mezcla = heredado(grupo, mapa, "mezcla");
            const modo = mezcla && mezcla !== "normal" && MODOS_MEZCLA[mezcla] ? MODOS_MEZCLA[mezcla] : null;
            const desenfoque = Math.max(0, Number(heredado(grupo, mapa, "desenfoque")) || 0);
            const con_estado = cadena.length > 0 || alfa < 1 || !!modo || desenfoque > 0;
            if(con_estado){
                this.ctx.save();
                if(cadena.length) aplicarEnCanvas(this.ctx, cadena, ox, oy);
                if(alfa < 1) this.ctx.globalAlpha = alfa;
                if(modo) this.ctx.globalCompositeOperation = modo;
            }
            this._desenfoque = desenfoque;

            if(pintado){
                for(let j = 0; j<grupo.lista_pintado.length; j++){
                    const pintura = grupo.lista_pintado[j];
                    this.pintarGrupoAnimacion(grupo, pintura, true)
                }
            }

            // desenfocado: sin las lineas nitidas del contorno
            const n_figuras = desenfoque > 0 && pintado ? 0 : grupo.lista_figuras.length;
            for (let j = 0; j < n_figuras; j++) {
                const figura = grupo.lista_figuras[j];
                let seleccion = null;
                let color_figura = grupo.color;

                seleccion = grupo.nombre === id_grupo_selec && figura.nombre === id_figura_selec;
                if(lista_id_figuras.includes(figura.nombre) && id_grupo_selec === grupo.nombre){
                    color_figura = "#ff00a1";
                }
                if (figura.tipo_figura === "RECTA") {
                    this.imprimir_recta(figura, grupo, color_figura,p1_recta, p2_recta, p_centro,
                        seleccion);
                }

                if (figura.tipo_figura === "PUNTO") {
                    this.imprimir_punto(figura, grupo, color_figura, p_centro, seleccion);
                }

                if (figura.tipo_figura === "CIRCULO") {
                    this.imprimir_circulo(figura, grupo, color_figura, p_circulo, p_centro, seleccion);
                }

            }

            this._desenfoque = 0;
            if(con_estado){
                this.ctx.restore();
            }
        }
    }

    imprimir_recta(figura, grupo, color_, p1_recta, p2_recta, p_centro,
                            seleccion = false,color_seleccion = "#39ff14" ) {
        const x_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.x_delta_original : 0;
        const y_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.y_delta_original : 0;

        const coor = getCoorRecta(figura, grupo)
        const x1_ = coor.x1+x_delta_original_;
        const y1_ = coor.y1+y_delta_original_;
        const x2_ = coor.x2+x_delta_original_;
        const y2_ = coor.y2+y_delta_original_;

        dibujar_linea(this.ctx, color_, x1_, y1_, x2_, y2_)

        if (seleccion) {
            const xp1_ = p1_recta.x+x_delta_original_;
            const xp2_ = p2_recta.x+x_delta_original_;
            const xpc_ = p_centro.x+x_delta_original_;
            const yp1_ = p1_recta.y+y_delta_original_;
            const yp2_ = p2_recta.y+y_delta_original_;
            const ypc_ = p_centro.y+y_delta_original_;
            dibujar_rectangulo(this.ctx, color_seleccion, xp1_, yp1_,
                p1_recta.w, p1_recta.h)

            dibujar_rectangulo(this.ctx, color_seleccion, xp2_, yp2_,
                p2_recta.w, p2_recta.h)

            dibujar_rectangulo(this.ctx, color_seleccion, xpc_, ypc_,
                p_centro.w, p_centro.h)
        }
    }

    imprimir_circulo(figura, grupo, color_, p_circulo, p_centro, seleccion = false,
                              color_seleccion = "#39ff14") {
        // Mismo offset de pan que imprimir_recta/imprimir_punto -- faltaba aca, asi que
        // los CIRCULO nunca se movian al arrastrar el lienzo aunque el resto de la
        // figura si.
        const x_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.x_delta_original : 0;
        const y_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.y_delta_original : 0;

        const x = numPos(figura.atributos.cx, grupo) + numPos(grupo.cx_solid, grupo) + x_delta_original_;
        const y = numPos(figura.atributos.cy, grupo) + numPos(grupo.cy_solid, grupo) + y_delta_original_;
        const rx = numPos(figura.atributos.radiox, grupo);
        const ry = numPos(figura.atributos.radioy, grupo);
        dibujar_circulo(this.ctx, color_, x, y, rx, ry);

        if (seleccion) {
            dibujar_rectangulo(this.ctx, color_seleccion, p_circulo.x, p_circulo.y,
                p_circulo.w, p_circulo.h)
            dibujar_rectangulo(this.ctx, color_seleccion, p_centro.x, p_centro.y,
                p_centro.w, p_centro.h)
        }

    }

    imprimir_punto(figura, grupo, color_, p_centro,
                            seleccion = false, color_seleccion = "#39ff14") {
        const x_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.x_delta_original : 0;
        const y_delta_original_ = !this.seccion_pintar? this.configuracion_lienzo.y_delta_original : 0;

        const coor = getCoorPunto(figura, grupo)
        const x = coor.x+x_delta_original_;
        const y = coor.y+y_delta_original_;

        dibujar_punto(this.ctx, color_, x, y, 2)
        if (seleccion) {
            const xpc_ = p_centro.x+x_delta_original_;
            const ypc_ = p_centro.y+y_delta_original_;
            //this.actualizarPuntoCentro(figura, grupo)
            dibujar_rectangulo(this.ctx, color_seleccion, xpc_, ypc_,
                p_centro.w, p_centro.h)
        }
    }

    // Sombras proyectadas de un objeto (ver arriba "Fase 4"). `lista`: todos los grupos en
    // orden de dibujo; `mapa`: nombre -> grupo.
    dibujarSombras(objeto, lista, mapa, ox, oy){
        const ctx = this.ctx;
        if(!ctx || typeof ctx.getTransform !== "function" || !visibleEfectivo(objeto, mapa)) return;
        const alfa_objeto = opacidadEfectiva(objeto, mapa);
        if(alfa_objeto <= 0.001) return;
        const partes = lista.filter((g) => esDescendiente(g, objeto.nombre, mapa) && visibleEfectivo(g, mapa) && (g.lista_pintado || []).length);
        if(!partes.length) return;
        const base = ctx.getTransform();
        if(!base || !Number.isFinite(base.a)) return;          // (contextos de prueba, como el del reporte)
        const esc_vista = Math.sqrt(Math.abs(base.a * base.d - base.b * base.c)) || 1;
        const t = objeto.transformacion || {};
        const pie = origenVisto(objeto, mapa, numS(t.ancla_x, 0), numS(t.ancla_y, 0));
        for(const s of objeto.sombra){
            if(!s) continue;
            const P = numS(s.piso, pie.y);
            // inclinacion: desde la luz (punto o grupo) o con un angulo fijo
            let k, lejania = 1;
            if(typeof s.luz === "string" || Array.isArray(s.luz)){
                let L = null;
                if(Array.isArray(s.luz)) L = {x: numS(s.luz[0], 0), y: numS(s.luz[1], 0)};
                else { const gl = mapa.get(s.luz); if(gl) L = origenVisto(gl, mapa); }
                if(!L || P - L.y < 1) continue;                  // luz perdida o por debajo del piso
                k = (pie.x - L.x) / (P - L.y);
                // alcance: lejos de la luz la sombra se desvanece (farolas)
                const alcance = numS(s.alcance, 0);
                if(alcance > 0) lejania = Math.max(0, 1 - Math.abs(pie.x - L.x) / alcance);
            } else {
                k = Math.tan(numS(s.angulo, 0) * Math.PI / 180);
            }
            k *= numS(s.largo, 1);
            const aplastar = numS(s.aplastar, 0.3);
            const altura = Math.max(0, P - pie.y);              // se despego del piso (salto)
            const opacidad = Math.max(0, Math.min(1, numS(s.opacidad, 0.35))) * alfa_objeto * Math.max(0.15, 1 - altura / 300) * lejania;
            const blur = Math.max(0, numS(s.desenfoque, 4)) + altura * 0.06;
            if(opacidad <= 0.002) continue;
            const o = lienzoAparte(ctx);
            if(!o) return;
            const octx = o.getContext("2d");
            octx.setTransform(base.a, base.b, base.c, base.d, base.e, base.f);
            const Pp = P + oy;
            // x' = x + k (P - y) ;  y' = P - (P - y) aplastar
            octx.transform(1, 0, -k, aplastar, k * Pp, Pp * (1 - aplastar));
            const ctx_antes = this.ctx, silueta_antes = this._silueta;
            this.ctx = octx;
            this._silueta = s.color || "#000000";
            try {
                for(const g of partes){
                    const cad = cadenaTransformaciones(g, mapa);
                    octx.save();
                    if(cad.length) aplicarEnCanvas(octx, cad, ox, oy);
                    for(const pintura of g.lista_pintado) if(pintura.visible !== false) this.pintarGrupoAnimacion(g, pintura, true);
                    octx.restore();
                }
            } finally {
                this.ctx = ctx_antes;
                this._silueta = silueta_antes;
            }
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = opacidad;
            if(blur > 0.2){
                const LEJOS = 20000;
                ctx.shadowColor = s.color || "#000000";
                ctx.shadowBlur = 2 * blur * esc_vista;
                ctx.shadowOffsetX = LEJOS;
                ctx.drawImage(o, -LEJOS, 0);
            } else {
                ctx.drawImage(o, 0, 0);
            }
            ctx.restore();
        }
    }

    pintarGrupoAnimacion(grupo_, pintura, relleno=false){
        const grupo_elementos = pintura.elementos
        // desenfoque (px del dibujo): la forma se dibuja muy lejos y queda solo su sombra
        // borrosa en el lugar (funciona igual en el navegador y en node-canvas)
        // (contextos de prueba, como el del reporte, pueden no tener getTransform)
        const m = relleno && !this._silueta && this._desenfoque > 0 && typeof this.ctx.getTransform === "function" ? this.ctx.getTransform() : null;
        const blur = m && Number.isFinite(m.a) ? this._desenfoque : 0;
        if(blur){
            const LEJOS = 20000;
            const esc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
            this.ctx.save();
            this.ctx.setTransform(m.a, m.b, m.c, m.d, m.e - LEJOS, m.f);
            this.ctx.shadowColor = pintura.color;
            this.ctx.shadowBlur = 2 * blur * esc;
            this.ctx.shadowOffsetX = LEJOS;
            this.ctx.shadowOffsetY = 0;
        }
        const avanzado = relleno && this._silueta ? this._silueta : relleno && pintura.degradado && !blur
            ? rellenoDe(this.ctx, pintura, (numPos(grupo_.cx_solid, grupo_) || 0) + this.configuracion_lienzo.x_delta_original, (numPos(grupo_.cy_solid, grupo_) || 0) + this.configuracion_lienzo.y_delta_original)
            : null;

        for (let i_elementos=0; i_elementos<grupo_elementos.length; i_elementos++){
            const elementos = grupo_elementos[i_elementos];
            const lista_puntos = obtenerPuntosContorno(grupo_, elementos);
            //console.log(lista_puntos)
            this.ctx.beginPath();
            if(relleno){
                this.ctx.strokeStyle = avanzado || pintura.color;//'black';
                this.ctx.fillStyle = avanzado || pintura.color; // Color de relleno (rojo semitransparente en este caso)
                this.ctx.lineWidth = 0; // Grosor de la línea de contorno
            }


            for (let i=0; i<lista_puntos.length-1; i++){
                const p1 = lista_puntos[i]
                const p2 = lista_puntos[i+1]

                p1.x+=this.configuracion_lienzo.x_delta_original;
                p1.y+=this.configuracion_lienzo.y_delta_original;

                //if(i===){
                p2.x+=this.configuracion_lienzo.x_delta_original;
                p2.y+=this.configuracion_lienzo.y_delta_original;
                //}
                if(relleno){
                    if (i === 0) {
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                    } else {
                        //this.ctx.lineTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                    }
                }else{
                    dibujar_linea_segmentada(this.ctx, "#39ff14", p1.x, p1.y, p2.x, p2.y)
                }
            }
            if(relleno){
                this.ctx.stroke();
                if(lista_puntos.length>2){
                    const p1 = lista_puntos[0];
                    //p1.x+=this.configuracion_lienzo.x_delta_original;
                    //p1.y+=this.configuracion_lienzo.y_delta_original;
                    //this.ctx.lineTo(p1.x, p1.y);
                    this.ctx.fill();
                }
                this.ctx.closePath();
            }
        }
        if(blur) this.ctx.restore();
    }

    pintarDimensionGrupo(grupo_, pintura, relleno=false){
        const grupo_elementos = pintura.elementos

        for (let i_elementos=0; i_elementos<grupo_elementos.length; i_elementos++){
            const elementos = grupo_elementos[i_elementos];
            const lista_puntos = obtenerPuntosContorno(grupo_, elementos);
            //console.log(lista_puntos)
            this.ctx.beginPath();
            if(relleno){
                this.ctx.strokeStyle = 'black';
                this.ctx.fillStyle = pintura.color; // Color de relleno (rojo semitransparente en este caso)
                this.ctx.lineWidth = 2; // Grosor de la línea de contorno
            }


            for (let i=0; i<lista_puntos.length-1; i++){
                const p1 = lista_puntos[i]
                const p2 = lista_puntos[i+1]

                if(relleno){
                    if (i === 0) {
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                    } else {
                        this.ctx.lineTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                    }
                }else{
                    dibujar_linea_segmentada(this.ctx, "#39ff14", p1.x, p1.y, p2.x, p2.y)
                }
            }
            if(relleno){
                this.ctx.stroke();
                if(lista_puntos.length>2){
                    const p1 = lista_puntos[0];
                    this.ctx.lineTo(p1.x, p1.y);
                    this.ctx.fill();
                }
                this.ctx.closePath();
            }
        }
    }

    imprimirGrupoPintado(gestion_pintado){
        const grupo = gestion_pintado.grupo_copia

        if(gestion_pintado.indice_seleccion_pintado !== -1){
            if(gestion_pintado.pintar_todo){
                for(let i = 0; i<grupo.lista_pintado.length; i++){
                    const pintura = grupo.lista_pintado[i];
                    this.pintarDimensionGrupo(grupo, pintura, gestion_pintado.relleno_pintura)
                }
            }else{
                if(gestion_pintado.indice_seleccion_pintado>-1){
                    const pintura = grupo.lista_pintado[gestion_pintado.indice_seleccion_pintado]
                    this.pintarDimensionGrupo(grupo, pintura, gestion_pintado.relleno_pintura)
                }
            }
        }

        this.seccion_pintar = true;
        if(gestion_pintado.indice_seleccion_pintado !== -1)
            for (let j = 0; j < grupo.lista_figuras.length; j++) {
                const figura = grupo.lista_figuras[j];
                let seleccion = null;
                let color_figura = grupo.color;


                const pintura_ = grupo.lista_pintado[gestion_pintado.indice_seleccion_pintado];
                //const grupo_pintura = pintura_[gestion_pintado.indice_seleccion_grupo_pintado];
                let validar_p1 = null, validar_p2 = null;
                let validar_punto = null;
                for(let k=0; k<pintura_.elementos.length; k++ ){
                    const componente_g = gestion_pintado.figuraSeleccionada(figura.nombre,
                        gestion_pintado.indice_seleccion_pintado, k);


                    if (figura.tipo_figura === "RECTA") {
                        if(validar_p1 == null && componente_g === null){
                            validar_p1 = false;
                        }else
                        if(validar_p1 == null && componente_g !== null){
                            validar_p1 = componente_g.includes("PUNTO1")
                        }else
                        if(validar_p1 === false && componente_g !== null){
                            validar_p1 = componente_g.includes("PUNTO1")
                        }

                        if(validar_p2 == null && componente_g === null){
                            validar_p2 = false;
                        }else
                        if(validar_p2 == null && componente_g !== null){
                            validar_p2 = componente_g.includes("PUNTO2")
                        }else
                        if(validar_p2 === false && componente_g !== null){
                            validar_p2= componente_g.includes("PUNTO2")
                        }

                        const coor = getCoorRecta(figura, grupo)

                        const color_cr1 = validar_p1? "#008000"  : "#ff0000";

                        dibujar_rectangulo(this.ctx, color_cr1, coor.x1-4, coor.y1-4, 9, 9, true);

                        const color_cr2 = validar_p2? "#008000"  : "#ff0000";
                        dibujar_rectangulo(this.ctx, color_cr2, coor.x2-4, coor.y2-4, 9, 9, true);
                        this.imprimir_recta(figura, grupo, color_figura);
                        //console.log("dibujar_circulo");

                        if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO1")){
                            dibujar_circulo(this.ctx, "#008000", coor.x1, coor.y1, 11, 11)
                        }

                        if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO2")){
                            dibujar_circulo("#008000", coor.x2, coor.y2, 11, 11)
                        }

                    }

                    if (figura.tipo_figura === "PUNTO") {
                        if(validar_punto == null && componente_g === null){
                            validar_punto = false;
                        }else
                        if(validar_punto == null && componente_g !== null){
                            validar_punto = componente_g.includes("PUNTO_C")
                        }else
                        if(validar_punto === false && componente_g !== null){
                            validar_punto= componente_g.includes("PUNTO_C")
                        }

                        const coor = getCoorPunto(figura, grupo)
                        const color_p = validar_punto? "#008000" : "#FF0000";

                        dibujar_rectangulo(this.ctx, color_p, coor.x-4, coor.y-4, 9, 9, true);
                        this.imprimir_punto(figura, grupo, color_figura);

                        if(gestion_pintado.list_comp_select.includes(figura.nombre+"|"+"PUNTO_C")){
                            dibujar_circulo(this.ctx, "#008000", coor.x, coor.y, 11, 11)
                        }

                    }

                    if (figura.tipo_figura === "CIRCULO") {
                        this.imprimir_circulo(figura, grupo, color_figura);
                    }
                }
            }

        this.seccion_pintar = false;
    }
};



function obtenerPuntosGrupo(grupo){
    let x, y;
    let lista_puntos = [];
    for (let j = 0; j < grupo.lista_figuras.length; j++) {
        const figura = grupo.lista_figuras[j];

        if (figura.tipo_figura === "PUNTO") {
            x = numPos(figura.atributos.cx, grupo) + numPos(grupo.cx_solid, grupo);
            y = numPos(figura.atributos.cy, grupo) + numPos(grupo.cy_solid, grupo);
        }

        /*if (figura.tipo_figura === "PUNTO") {
            imprimir_punto(ctx, figura, grupo, color_figura, seleccion);
        }

        if (figura.tipo_figura === "CIRCULO") {
            imprimir_circulo(ctx, figura, grupo, color_figura, seleccion);
        }*/
        lista_puntos.push({
            x: x,
            y: y
        })
    }
    return lista_puntos;
}

function pintarGrupo(ctx, grupo) {
    const lista_puntos = obtenerPuntosGrupo(grupo)
    const color = grupo.color;

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Color de relleno (rojo semitransparente en este caso)
    ctx.lineWidth = 2; // Grosor de la línea de contorno


    for(let i = 0; i < lista_puntos.length; i++){
        const punto_act = lista_puntos[i];
        //dibujar_linea(ctx, color, punto_act.x, punto_act.y, punto_sig.x, punto_sig.y )
        if (i === 0) {
            ctx.moveTo(punto_act.x, punto_act.y);
        } else {
            ctx.lineTo(punto_act.x, punto_act.y);
        }
    }

    ctx.closePath();
    ctx.stroke();

// Rellenar el interior con otro color
    ctx.fill();
}




function obtenerPuntosContorno(grupo_, elementos){
    const lista_coor = []
    for (let i = 0; i < elementos.length; i++) {
        const e = elementos[i];
        let figura = grupo_.lista_figuras.filter((f)=>f.nombre===e.nombre)
        let x, y;
        if(figura.length>0){
            figura = figura[0];
            if (figura.tipo_figura === "RECTA"){
                const coor = getCoorRecta(figura, grupo_)
                if(e.componente === "PUNTO1"){
                    x = coor.x1;
                    y = coor.y1;
                }
                if(e.componente === "PUNTO2"){
                    x = coor.x2;
                    y = coor.y2;
                }
            }
            if (figura.tipo_figura === "PUNTO"){
                const coor = getCoorPunto(figura, grupo_)
                if(e.componente === "PUNTO_C"){
                    x = coor.x;
                    y = coor.y;
                }
            }
            lista_coor.push({
                x: x,
                y: y
            })
        }
    }
    return lista_coor;
}





function dibujar_punto(ctx, color, x, y, size = 1) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    //ctx.stroke();
}

function dibujar_circulo(ctx, color, xc, yc, rx, ry) {
    let x = 0;
    let y = ry;
    const rx2 = Math.pow(rx, 2);
    const ry2 = Math.pow(ry, 2);
    let p1 = ry2 - (rx2 * ry) + (0.25 * rx2);
    while ((ry2 * x) < (rx2 * y)) {
        if (p1 < 0) {
            x++;
            p1 = p1 + (2 * ry2 * x) + ry2;
        } else {
            x++;
            y--;
            p1 = p1 + (2 * ry2 * x) - (2 * rx2 * y) + ry2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
        /*grupoPixeles.push_back(unPixel(xc+x, yc+y));
        grupoPixeles.push_back(unPixel(xc-x, yc+y));
        grupoPixeles.push_back(unPixel(xc+x, yc-y));
        grupoPixeles.push_back(unPixel(xc-x, yc-y));*/
    }
    let p2 = (ry2) * Math.pow((x + 0.5), 2) + (rx2) * Math.pow((y - 1), 2) - (rx2 * ry2);
    while (y > 0) {
        if (p2 > 0) {
            y--;
            p2 = p2 - (2 * rx2 * y) + rx2;
        } else {
            x++;
            y--;
            p2 = p2 + (2 * ry2 * x) - (2 * rx2 * y) + rx2;
        }
        dibujar_punto(ctx, color, xc + x, yc + y)
        dibujar_punto(ctx, color, xc - x, yc + y)
        dibujar_punto(ctx, color, xc + x, yc - y)
        dibujar_punto(ctx, color, xc - x, yc - y)
    }

    function zoomLocalizacion() {
        const canvas = document.getElementById(this.id_canvas);
        const ctx = canvas.getContext('2d');
    }
}

function dibujar_linea(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function dibujar_linea_segmentada(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
}

function dibujar_rectangulo(ctx, color, x, y, w, h, relleno=false) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(x, y, w, h);
    ctx.stroke();
    if(relleno){
        ctx.fillStyle = color;
        ctx.fill()
    }

}


function dibujar_rec_transparencia(ctx, colorBorde, colorRelleno, x, y, w, h, alpha = 0.4) {
    ctx.beginPath();

    // 1. Dibujar el borde primero
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 2; // Opcional: grosor del borde
    ctx.rect(x, y, w, h);
    ctx.stroke();

    // 2. Dibujar el relleno con transparencia
    // Guardamos el estado actual para no afectar otros dibujos posteriores
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colorRelleno;
    ctx.fill();
    ctx.restore(); // Restauramos el estado original (alpha = 1.0)
}


export {pintarGrupo,
    dibujar_punto, dibujar_circulo, dibujar_linea, dibujar_rectangulo, dibujar_linea_segmentada,dibujar_rec_transparencia, ImprimirAnimacion};