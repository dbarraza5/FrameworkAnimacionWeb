// "Horizon-1": lanzamiento del transbordador Aurora (documento/planeacion_lanzamiento.md, guion_lanzamiento.md).
// Fase 2: el transbordador y la plataforma, con detalle realista (vista de perfil), y el entorno costero
// al amanecer. Escala: 10 px = 1 m.
//   asset_01 Cielo del amanecer, 02 Mar y costa, 03 Torre de agua, 04 Plataforma de lanzamiento, 05 Torre de servicio,
//   06 Tanque externo, 07 Cohete lateral, 08 Orbitador Aurora, 09 Gaviota
//   asset_10 Vapor del tanque, 11 Llama de motor principal, 12 Llama de cohete, 13 Agua de supresión, 14 Vapor de arranque,
//   15 Nube de humo, 16 Bocanada de estela (fase 3)
//   17 Tierra desde la altura, 18 Espacio profundo, 19 Cono de condensación, 20 Destello de separación, 21 Propulsores de maniobra,
//   22 Tierra desde la órbita, 23 Orbitador desde arriba, 24 Satélite (fase 4);  escena_ascenso.json: prueba de la fase 4
//   25 Columna de humo;  historia_1..7.json: las 7 escenas del guion (fase 5, capitulo "Horizon-1")
//   escena.json: muestra (no es del guion): plano general al amanecer, acercamiento, brazos que se retiran
//   escena_ignicion.json: prueba de la fase 3: agua, arranque de motores, ignicion, humo y despegue
//   node herramientas/ejemplos/lanzamiento/generar.mjs
// La pila se arma en la escena: el tanque es el padre; los cohetes y el orbitador van con `padre: "tanque"`
// (asi despegan juntos y despues se pueden separar con sus propias claves).
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TAU, r2, lineal, radial, ovalo, azar, sembrar, marcas, TRANSP, asset, ciclo, tramo} from "../arte/comun.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
sembrar(1981);
// sombreado de cilindro iluminado desde la izquierda (amanecer): de x0 a x1
const cil = (x0, x1, oscuro, medio, claro) => lineal([x0, 0], [x1, 0], [[0, oscuro], [0.22, claro], [0.45, medio], [0.85, oscuro], [1, oscuro]]);
const linea = (n, x0, y0, x1, y1, g, color, extra = {}) => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * g / 2, ny = dx / l * g / 2;
    return {nombre: n, poligono: [[r2(x0 + nx), r2(y0 + ny)], [r2(x1 + nx), r2(y1 + ny)], [r2(x1 - nx), r2(y1 - ny)], [r2(x0 - nx), r2(y0 - ny)]], color, borde: TRANSP, ...extra};
};

// ------------------------------------------------------------------ CIELO DEL AMANECER (origen arriba a la izquierda; 3200 x 1100)
function cielo() {
    const partes = [
        // el cielo de altura: se oscurece hasta el negro del espacio (para el ascenso)
        {nombre: "cielo_alto", capa: 0, rect: [-800, -9000, 2800, -280], borde: TRANSP, degradado: lineal([0, -9000], [0, -300], [[0, "#000003"], [0.45, "#030618"], [0.8, "#0a1438"], [1, "#14204a"]])},
        {nombre: "cielo", capa: 0, rect: [-800, -300, 2800, 800], borde: TRANSP, degradado: lineal([0, -300], [0, 560], [[0, "#14204a"], [0.35, "#2f4a8a"], [0.62, "#8a7aa8"], [0.8, "#f0a070"], [0.92, "#ffcf8a"], [1, "#ffe2b0"]])},
        {nombre: "sol_halo", capa: 1, en: [1400, 560], circulo: {r: 520, lados: 48}, degradado: radial([0, 0], 520, [[0, "rgba(255,220,160,0.75)"], [0.35, "rgba(255,180,120,0.3)"], [1, "rgba(255,160,100,0)"]]), borde: TRANSP},
        {nombre: "sol", capa: 2, en: [1400, 568], circulo: {r: 46, lados: 40}, degradado: radial([0, 0], 46, [[0, "#fffbe8"], [1, "#ffd890"]])},
    ];
    // nubes alargadas iluminadas desde abajo (borde inferior dorado)
    for (let i = 0; i < 14; i++) {
        const x = -700 + azar() * 3300, y = 120 + azar() * 330, w = 160 + azar() * 380, h = 10 + azar() * 22;
        partes.push({nombre: `nube_${i}`, capa: 3, en: [r2(x), r2(y)], poligono: ovalo(0, 0, w, h, 24, (a) => 1 + 0.2 * Math.sin(a * 3 + i) + 0.1 * Math.sin(a * 7 + 2 * i)),
            degradado: lineal([0, -h], [0, h], [[0, "rgba(120,110,150,0.85)"], [0.6, "rgba(190,130,140,0.85)"], [1, "rgba(255,190,130,0.9)"]]), borde: TRANSP});
    }
    // estrellas que se apagan con el dia (en la parte alta)
    for (let i = 0; i < 40; i++) partes.push({nombre: `estrella_${i}`, capa: 1, en: [r2(-700 + azar() * 3400), r2(-280 + azar() * 260)], circulo: {r: r2(0.8 + azar() * 1.4), lados: 6}, color: "#ffffff", opacidad: r2(0.3 + azar() * 0.5)});
    return {tipo: "asset", nombre: "Cielo del amanecer", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ MAR Y COSTA (origen: horizonte en y = 0)
function marCosta() {
    const DUR = 3000, partes = [
        {nombre: "mar", capa: 0, rect: [-800, 0, 2800, 220], degradado: lineal([0, 0], [0, 220], [[0, "#c09090"], [0.15, "#6a7aa0"], [1, "#24365a"]])},
        // reflejo del sol en el agua: franjas doradas que titilan
        ...Array.from({length: 22}, (_, i) => { const y = 4 + i * 9 + azar() * 4, w = 18 + (y / 220) * 160 * (0.6 + azar() * 0.6);
            return {nombre: `reflejo_${i}`, capa: 1, en: [r2(1400 + (azar() - 0.5) * 60 * (1 + y / 60)), r2(y)], rect: [r2(-w), -1.4, r2(w), 1.4], color: "rgba(255,215,150,0.85)", borde: TRANSP,
                claves: {opacidad: ciclo(DUR, (u) => 0.3 + 0.7 * Math.max(0, Math.sin(TAU * u + i * 1.7))), escala_x: ciclo(DUR, (u) => 0.7 + 0.4 * Math.sin(TAU * u * 2 + i))}, bucle: "repetir"}; }),
        // olas: lineas claras que van y vienen
        ...Array.from({length: 10}, (_, i) => ({nombre: `ola_${i}`, capa: 1, en: [r2(-700 + azar() * 3300), r2(40 + azar() * 170)], rect: [-40, -0.8, 40, 0.8], color: "rgba(255,240,230,0.5)", borde: TRANSP,
            claves: {x: ciclo(DUR * 2, (u) => r2(-700 + ((i * 337) % 3300) + 30 * Math.sin(TAU * u)))}, bucle: "repetir"})),
        // playa y tierra baja (marisma con charcos)
        {nombre: "playa", capa: 2, poligono: [[-800, 220], [2800, 200], [2800, 250], [-800, 270]], degradado: lineal([0, 200], [0, 270], [[0, "#e8c89a"], [1, "#b89870"]])},
        {nombre: "tierra", capa: 3, rect: [-800, 250, 2800, 1100], degradado: lineal([0, 250], [0, 700], [[0, "#6a7048"], [0.4, "#4a5434"], [1, "#2a3020"]])},
    ];
    for (let i = 0; i < 16; i++) partes.push({nombre: `charco_${i}`, capa: 4, en: [r2(-700 + azar() * 3300), r2(300 + azar() * 400)], poligono: ovalo(0, 0, 40 + azar() * 120, 4 + azar() * 8, 18), color: "rgba(180,170,190,0.55)", borde: TRANSP});
    for (let i = 0; i < 60; i++) partes.push({nombre: `mata_${i}`, capa: 5, en: [r2(-700 + azar() * 3300), r2(270 + azar() * 600)], poligono: ovalo(0, 0, 14 + azar() * 30, 5 + azar() * 9, 10, (a) => 0.8 + 0.4 * Math.sin(a * 5 + i)), color: azar() < 0.5 ? "#3e4a2a" : "#56603a", borde: TRANSP});
    return {tipo: "asset", nombre: "Mar y costa", duracion: DUR * 2, marcas, partes};
}

// ------------------------------------------------------------------ TORRE DE AGUA (esfera sobre patas; pies en 0,0)
const torreAgua = () => ({tipo: "asset", nombre: "Torre de agua", duracion: 1000, marcas, partes: [
    ...[-38, -14, 14, 38].map((x, i) => linea(`pata_${i}`, x, 0, x * 0.45, -180, 4, "#6a6a70")),
    linea("riostra_1", -36, -60, 30, -120, 2, "#6a6a70"), linea("riostra_2", 36, -60, -30, -120, 2, "#6a6a70"),
    {nombre: "esfera", en: [0, -220], circulo: {r: 52, lados: 40}, degradado: radial([-20, -16], 70, [[0, "#ffffff"], [0.5, "#d8dce4"], [1, "#8a90a0"]])},
    {nombre: "franja", en: [0, -220], rect: [-52, -3, 52, 3], color: "#8a90a0"},
]});

// ------------------------------------------------------------------ PLATAFORMA DE LANZAMIENTO (plataforma movil sobre el foso; la pila apoya en y = 0)
function plataforma() {
    const partes = [
        // cerro de la plataforma (rampa de hormigon) y foso de llamas
        {nombre: "cerro", capa: 0, poligono: [[-700, 200], [-420, 70], [420, 70], [700, 200]], degradado: lineal([0, 70], [0, 200], [[0, "#a8a49a"], [1, "#6a665e"]])},
        {nombre: "foso", capa: 1, poligono: [[-160, 70], [160, 70], [190, 160], [-190, 160]], degradado: lineal([0, 70], [0, 160], [[0, "#2a2826"], [1, "#0a0908"]])},
        {nombre: "foso_deflector", capa: 2, poligono: [[-150, 150], [0, 96], [150, 150]], color: "#3a3632"},
        // plataforma movil: cubierta gris con pedestales y patas
        {nombre: "cubierta", capa: 3, rect: [-300, 0, 300, 52], degradado: lineal([0, 0], [0, 52], [[0, "#9a9a9e"], [0.15, "#c8c8cc"], [1, "#5a5a60"]])},
        {nombre: "cubierta_sombra", capa: 4, rect: [-300, 0, 300, 4], color: "#6a6a70"},
        ...[-250, -150, 150, 250].map((x, i) => ({nombre: `pata_${i}`, capa: 2, rect: [x - 16, 52, x + 16, 120], degradado: lineal([x - 16, 0], [x + 16, 0], [[0, "#4a4a50"], [1, "#8a8a90"]])})),
        // aberturas de escape bajo los motores (por donde baja el fuego al foso)
        {nombre: "escape_cohete", capa: 4, rect: [-26, 2, 26, 50], color: "#1a1816"},
        {nombre: "escape_motores", capa: 4, rect: [70, 2, 130, 50], color: "#1a1816"},
        // pedestales donde apoyan los cohetes
        {nombre: "pedestal", capa: 5, rect: [-34, -8, 34, 2], color: "#7a7a80"},
        // rociadores de agua (supresion de ruido) sobre la cubierta
        ...[-240, -180, -120, 180, 240].map((x, i) => ({nombre: `rociador_${i}`, capa: 5, en: [x, -2], partes: [
            {nombre: `rociador_${i}_tubo`, rect: [-3, -26, 3, 0], color: "#5a5a60"},
            {nombre: `rociador_${i}_boca`, rect: [-6, -30, 6, -24], color: "#4a4a50"}]})),
        // luces de la cubierta
        ...[-280, 280].map((x, i) => ({nombre: `luz_${i}`, capa: 6, en: [x, -6], circulo: {r: 4, lados: 10}, color: "#ffd890"})),
    ];
    return {tipo: "asset", nombre: "Plataforma de lanzamiento", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ TORRE DE SERVICIO (estructura reticulada con brazos; pies en 0,0, alta 620)
function torreServicio() {
    const H = 620, A = 70, partes = [];
    // columnas y vigas (enrejado)
    partes.push({nombre: "columna_i", capa: 1, rect: [-A, -H, -A + 8, 0], color: "#a04a2a"});
    partes.push({nombre: "columna_d", capa: 1, rect: [A - 8, -H, A, 0], color: "#c05a32"});
    for (let k = 0; k <= 15; k++) {
        const y = -k * 40;
        partes.push({nombre: `viga_${k}`, capa: 1, rect: [-A, y - 4, A, y], color: "#b0522e"});
        if (k < 15) {
            partes.push(linea(`diag_a_${k}`, -A + 4, y - 2, A - 4, y - 38, 2.5, "#8a3e22"));
            partes.push(linea(`diag_b_${k}`, A - 4, y - 2, -A + 4, y - 38, 2.5, "#8a3e22"));
        }
    }
    // pisos con plataformas grises y luces de obra que titilan
    for (let k = 1; k < 15; k += 3) {
        partes.push({nombre: `piso_${k}`, capa: 2, rect: [-A - 10, -k * 40 - 6, A + 10, -k * 40], color: "#7a7a80"});
        partes.push({nombre: `luz_${k}`, capa: 3, en: [-A - 6, -k * 40 - 10], circulo: {r: 3.2, lados: 8}, color: "#fff0b0",
            claves: {opacidad: [[0, 1, "mantener"], [1300 + k * 90, 0.3, "mantener"], [1500 + k * 90, 1, "mantener"], [3000, 1]]}, bucle: "repetir"});
    }
    // mastil pararrayos y luz roja
    partes.push({nombre: "mastil", capa: 1, poligono: [[-4, -H], [4, -H], [1.5, -H - 110], [-1.5, -H - 110]], color: "#8a8a90"});
    partes.push({nombre: "baliza", capa: 3, en: [0, -H - 112], circulo: {r: 4, lados: 10}, color: "#ff3a2a", claves: {opacidad: [[0, 1, "mantener"], [600, 0.15, "mantener"], [1200, 1]]}, bucle: "repetir"});
    // brazo de acceso de la tripulacion (a la escotilla del orbitador): se retira girando
    partes.push({nombre: "brazo_tripulacion", capa: 4, en: [-A, -404], pivote: [0, 0], partes: [
        {nombre: "brazo_tripulacion_pasarela", rect: [-58, -8, 0, 8], degradado: lineal([0, -8], [0, 8], [[0, "#d8d8dc"], [1, "#8a8a90"]])},
        {nombre: "brazo_tripulacion_cabina", rect: [-76, -22, -54, 12], color: "#e8e8ec"},
        {nombre: "brazo_tripulacion_ventana", rect: [-72, -17, -58, -7], color: "#3a5a7a"},
    ]});
    // brazo de ventilacion del tanque ("la gorra"): llega a la punta del tanque; se levanta y se retira
    partes.push({nombre: "brazo_gorra", capa: 4, en: [-A, -500], pivote: [0, 0], partes: [
        linea("gorra_viga", 0, 0, -150, -24, 7, "#9a9aa0"),
        linea("gorra_tirante", 0, -40, -140, -24, 3, "#7a7a80"),
        {nombre: "gorra_capucha", en: [-176, -18], poligono: ovalo(0, 0, 30, 22, 20).filter(([, y]) => y <= 4).concat([[30, 10], [-30, 10]]), degradado: lineal([0, -22], [0, 10], [[0, "#e8e8ec"], [1, "#a0a0a8"]])},
    ]});
    // retirar = el brazo gira en planta, alejandose de la camara: de perfil se ve acortarse (escala_x)
    const params = {bt: ["brazo_tripulacion", "escala_x"], bg: ["brazo_gorra", "escala_x"], bgy: ["brazo_gorra", "y"]};
    const base = {bt: 1, bg: 1, bgy: -500};
    const acciones = [
        {nombre: "Brazos puestos", dur: 1000, pose: () => ({})},
        {nombre: "Retirar brazo de tripulación", dur: 3000, pose: (tl) => ({bt: 1 - 0.82 * tramo(tl, 0, 3000)})},
        // la gorra sube un poco (se despega de la punta del tanque) y gira hacia la torre
        {nombre: "Retirar gorra", dur: 3200, pose: (tl) => ({bt: 0.18, bgy: -500 - 26 * tramo(tl, 0, 700), bg: 1 - 0.85 * tramo(tl, 600, 3200)})},
        {nombre: "Brazos retirados", dur: 1000, pose: () => ({bt: 0.18, bgy: -526, bg: 0.15})},
        {nombre: "Solo gorra", dur: 1000, pose: () => ({bt: 0.18})},
    ];
    return asset("Torre de servicio", acciones, params, base, partes);
}

// ------------------------------------------------------------------ TANQUE EXTERNO (base en 0,0; 84 de ancho, 470 de alto)
function tanque() {
    const R = 42, H = 470, partes = [];
    const ojiva = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, a = u * Math.PI / 2; ojiva.push([r2(-R * Math.cos(a) ** 0.8), r2(-330 - Math.sin(a) * 140)]); }
    const cuerpo = [[-R, 0], ...ojiva.slice().reverse().reverse(), ...ojiva.slice().reverse().map(([x, y]) => [-x, y]), [R, 0]];
    partes.push({nombre: "espuma", capa: 0, poligono: cuerpo, degradado: cil(-R, R, "#7a3a14", "#c8642a", "#f0a060")});
    // textura de espuma: vetas verticales apenas mas oscuras
    for (let i = 0; i < 9; i++) partes.push({nombre: `veta_${i}`, capa: 1, rect: [r2(-R + 6 + i * 9), -320, r2(-R + 7.5 + i * 9), -6], color: "rgba(90,40,10,0.12)", borde: TRANSP});
    // anillo intertanque (acanalado) y anillos de soldadura
    partes.push({nombre: "intertanque", capa: 1, rect: [-R, -318, R, -262], degradado: cil(-R, R, "#6a3412", "#b85a26", "#e08a50")});
    for (let i = 0; i < 7; i++) partes.push({nombre: `canal_${i}`, capa: 2, rect: [-R, -314 + i * 8, R, -312 + i * 8], color: "rgba(60,25,5,0.35)", borde: TRANSP});
    [-120, -40].forEach((y, i) => partes.push({nombre: `soldadura_${i}`, capa: 2, rect: [-R, y, R, y + 1.5], color: "rgba(80,35,10,0.4)", borde: TRANSP}));
    // linea de alimentacion de oxigeno (cano al costado) y bandeja de cables
    partes.push({nombre: "cano_lox", capa: 3, rect: [R - 8, -330, R - 3, -30], degradado: lineal([R - 8, 0], [R - 3, 0], [[0, "#a05020"], [1, "#e09060"]])});
    partes.push({nombre: "bandeja", capa: 3, rect: [-R + 3, -300, -R + 7, -20], color: "#8a4418"});
    // punta (ventilacion) y pararrayos
    partes.push({nombre: "punta", capa: 3, poligono: [[-5, -470], [5, -470], [2, -486], [-2, -486]], color: "#5a5a60"});
    return {tipo: "asset", nombre: "Tanque externo", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ COHETE LATERAL (base de la tobera en 0,0; 37 de ancho, ~470 de alto)
function cohete() {
    const R = 18.5, partes = [];
    partes.push({nombre: "tobera", capa: 0, poligono: [[-14, 0], [14, 0], [8, -26], [-8, -26]], degradado: cil(-14, 14, "#2a2a2e", "#5a5a60", "#9a9aa0")});
    partes.push({nombre: "faldon", capa: 1, poligono: [[-26, -22], [26, -22], [R, -60], [-R, -60]], degradado: cil(-26, 26, "#8a8a90", "#c8c8cc", "#f4f4f6")});
    partes.push({nombre: "cuerpo", capa: 1, rect: [-R, -400, R, -58], degradado: cil(-R, R, "#8a8e98", "#d8dae0", "#ffffff")});
    // juntas entre segmentos (anillos oscuros) y franjas negras de referencia
    [-110, -190, -270, -350].forEach((y, i) => partes.push({nombre: `junta_${i}`, capa: 2, rect: [-R, y, R, y + 4], color: "#6a6e78"}));
    partes.push({nombre: "franja_1", capa: 2, rect: [-R, -380, R, -372], color: "#2a2a30"});
    // anillo de union al tanque y cono de nariz con su punta
    partes.push({nombre: "anillo_union", capa: 2, rect: [-R - 2, -82, R + 2, -74], color: "#9a9aa2"});
    const nariz = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; nariz.push([r2(-R * (1 - u) ** 0.7), r2(-400 - u * 62)]); }
    partes.push({nombre: "nariz", capa: 1, poligono: [...nariz, ...nariz.slice().reverse().map(([x, y]) => [-x, y])], degradado: cil(-R, R, "#8a8e98", "#d8dae0", "#ffffff")});
    partes.push({nombre: "punta", capa: 2, poligono: [[-2, -460], [2, -460], [0, -472]], color: "#3a3a40"});
    return {tipo: "asset", nombre: "Cohete lateral", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ ORBITADOR AURORA (perfil: panza a la izquierda, nariz arriba; motores abajo en y = 0)
function orbitador() {
    const partes = [];
    // fuselaje: de la nariz (arriba) a la cola; ancho de perfil ~52
    const fus = [[0, -40], [0, -300], [6, -336], [18, -360], [32, -370], [44, -364], [52, -344], [54, -300], [56, -60], [52, -40]];
    partes.push({nombre: "fuselaje", capa: 1, poligono: fus, degradado: lineal([0, 0], [56, 0], [[0, "#9aa0aa"], [0.3, "#e8eaee"], [0.7, "#f8f8fa"], [1, "#b8bcc4"]])});
    // losetas negras de la panza (lado del tanque) y nariz oscura
    partes.push({nombre: "panza", capa: 2, poligono: [[0, -40], [0, -300], [6, -336], [12, -350], [10, -300], [9, -40]], color: "#1e1e22"});
    for (let i = 0; i < 24; i++) partes.push({nombre: `loseta_${i}`, capa: 3, rect: [1, r2(-60 - i * 10), 9, r2(-59.4 - i * 10)], color: "#3a3a42", borde: TRANSP});
    partes.push({nombre: "nariz", capa: 3, poligono: [[6, -336], [18, -360], [32, -370], [40, -367], [24, -354], [12, -334]], color: "#3a3a40"});
    // ventanillas de la cabina (con luz calida de los paneles)
    partes.push({nombre: "ventanas", capa: 3, poligono: [[40, -350], [50, -342], [50, -334], [38, -340]], color: "#1a2a40"});
    partes.push({nombre: "ventanas_luz", capa: 4, poligono: [[42, -347], [48, -341], [47, -338], [41, -342]], color: "#ffc870", opacidad: 0.7});
    // puertas de la bodega (lineas) y paneles
    partes.push({nombre: "bodega_linea", capa: 3, rect: [52, -296, 53.5, -110], color: "#8a8e98", borde: TRANSP});
    [-296, -240, -184, -128].forEach((y, i) => partes.push({nombre: `panel_${i}`, capa: 3, rect: [30, y, 54, y + 1], color: "#a8acb4", borde: TRANSP}));
    // ala (de canto, vista de perfil) con borde de ataque negro
    partes.push({nombre: "ala", capa: 0, poligono: [[4, -60], [4, -200], [-8, -190], [-30, -100], [-36, -60]], degradado: lineal([-36, 0], [4, 0], [[0, "#6a6e78"], [1, "#c8ccd4"]])});
    partes.push({nombre: "ala_borde", capa: 1, poligono: [[4, -200], [-8, -190], [-30, -100], [-34, -100], [-12, -194], [2, -206]], color: "#2a2a30"});
    // deriva (cola vertical), apunta al lado contrario del tanque
    partes.push({nombre: "deriva", capa: 0, poligono: [[50, -120], [104, -60], [104, -36], [54, -40]], degradado: lineal([50, -120], [104, -40], [[0, "#f4f4f6"], [1, "#b8bcc4"]])});
    partes.push({nombre: "deriva_borde", capa: 1, poligono: [[50, -120], [104, -60], [104, -54], [52, -112]], color: "#3a3a40"});
    partes.push({nombre: "timon", capa: 1, rect: [86, -58, 104, -40], color: "#d8dae0"});
    // insignia inventada de la mision (un circulo azul con una estela dorada) y bandera generica
    partes.push({nombre: "insignia", capa: 4, en: [36, -220], partes: [
        {nombre: "insignia_fondo", circulo: {r: 9, lados: 20}, color: "#1a3a8a"},
        {nombre: "insignia_estela", poligono: [[-6, 5], [5, -6], [7, -4], [-4, 7]], color: "#f2c94c"},
        {nombre: "insignia_aro", poligono: ovalo(0, 0, 9, 9, 20).concat(ovalo(0, 0, 7.5, 7.5, 20).reverse()), color: "#f2c94c"},
    ]});
    // capsulas de maniobra orbital (OMS) junto a la cola
    partes.push({nombre: "oms", capa: 2, poligono: [[40, -40], [40, -96], [50, -104], [62, -96], [62, -40]], degradado: lineal([40, 0], [62, 0], [[0, "#c8ccd4"], [1, "#f8f8fa"]])});
    partes.push({nombre: "oms_tobera", capa: 1, poligono: [[46, -40], [58, -40], [60, -30], [44, -30]], color: "#3a3a40"});
    // tres motores principales (se ven dos de perfil) y escudo termico de la cola
    partes.push({nombre: "base_motores", capa: 2, rect: [4, -46, 54, -38], color: "#5a5a62"});
    [[14, 0], [40, 1]].forEach(([x], i) => partes.push({nombre: `motor_${i}`, capa: 1, poligono: [[x - 8, -40], [x + 8, -40], [x + 13, -2], [x - 13, -2]], degradado: cil(x - 13, x + 13, "#2a2a30", "#6a6a72", "#b0b0b8")}));
    partes.push({nombre: "motor_2", capa: 0, poligono: [[22, -36], [32, -36], [36, -8], [18, -8]], color: "#3a3a40"});
    return {tipo: "asset", nombre: "Orbitador Aurora", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ GAVIOTA (aletea; centro en 0,0)
function gaviota() {
    const ala = (s) => [[0, 0], [s * 8, -6], [s * 18, -4], [s * 26, 2], [s * 16, 0], [s * 8, 2]];
    const abajo = (s) => ala(s).map(([x, y]) => [x, r2(-y + 3)]);
    const parte = (n, s) => ({nombre: n, poligono: ala(s), color: "#2a2a34", formas: {abajo: {poligono: abajo(s)}}, claves: {forma: [[0, "", "suave"], [260, "abajo", "suave"], [520, "", "suave"]]}, bucle: "repetir"});
    return {tipo: "asset", nombre: "Gaviota", duracion: 520, marcas, partes: [parte("ala_i", -1), parte("ala_d", 1), {nombre: "cuerpo", poligono: ovalo(0, 1, 6, 2.5, 10), color: "#2a2a34"}]};
}

// ------------------------------------------------------------------ MUESTRA (no es del guion): el amanecer en la plataforma
// La pila: tanque en la plataforma; los cohetes y el orbitador con padre "tanque".
export const PILA = {tanque: [0, 0], cohete: [0, 50], orbitador: [52, -10]};
function muestra() {
    const DUR = 14000, PAD = [1100, 760];
    return {
        tipo: "escena", nombre: "prueba_plataforma", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.8, radio: 14, intensidad: 0.6}},
        camara: {tamano: [1280, 720], centro: [1100, 420], zoom: 0.7, claves: {zoom: [[0, 0.7], [7000, 1.05, "suave"], [7001, 1.6], [DUR, 1.75, "suave"]],
            x: [[0, 1100], [7000, 1110, "suave"], [7001, 1180], [DUR, 1170, "suave"]], y: [[0, 420], [7000, 480, "suave"], [7001, 360], [DUR, 350, "suave"]]}},
        objetos: [
            {instancia: "Cielo del amanecer", nombre: "cielo", en: [0, 0], plano: -10},
            {instancia: "Mar y costa", nombre: "costa", en: [0, 560], plano: -9},
            {instancia: "Torre de agua", nombre: "torre_agua", en: [620, 830], plano: -7, escala: 0.9},
            {instancia: "Plataforma de lanzamiento", nombre: "plataforma", en: PAD, plano: -5},
            {instancia: "Torre de servicio", nombre: "torre", en: [PAD[0] + 250, PAD[1]], plano: -4, acciones: [[0, "Brazos puestos"], [3500, "Retirar brazo de tripulación", false], [8500, "Retirar gorra", false]]},
            {instancia: "Tanque externo", nombre: "tanque", en: [PAD[0], PAD[1] - 50], plano: -3},
            {instancia: "Cohete lateral", nombre: "cohete", en: PILA.cohete, padre: "tanque", plano: -2},
            {instancia: "Orbitador Aurora", nombre: "orbitador", en: PILA.orbitador, padre: "tanque", plano: -2.5},
            ...[[300, 380, 0], [520, 330, 300], [2000, 300, 700]].map(([x, y, d], i) => ({instancia: "Gaviota", nombre: `gaviota_${i}`, en: [x, y], plano: 0, escala: 1.2, desfase: d * 0.3,
                claves: {x: [[0, x], [DUR, x + (i === 2 ? -900 : 900), "lineal"]], y: [[0, y], [DUR / 2, y - 40, "suave"], [DUR, y + 10, "suave"]]}})),
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

// ================================================================== FASE 3: EFECTOS DEL LANZAMIENTO
// Todo con assets (sin capacidades nuevas): bocanadas con degradado radial que crecen, se mueven y se
// desvanecen; llamas con parpadeo rapido; agua en arcos. Posiciones relativas a la pila (origen = base
// del tanque): motores principales en (66, -12) y (92, -12); tobera del cohete en (0, 50).
const blanco = (a) => `rgba(255,255,255,${a})`;
// una bocanada de humo/vapor: circulo con luz arriba a la izquierda y borde que se desvanece
const bocanada = (n, r, extra = {}, tinte = [236, 232, 228]) => ({nombre: n, circulo: {r, lados: 28}, borde: TRANSP,
    degradado: radial([-r * 0.25, -r * 0.3], r * 1.15, [[0, `rgb(${tinte.map((c) => Math.min(255, c + 16)).join(",")})`], [0.55, `rgba(${tinte.join(",")},0.95)`], [0.85, `rgba(${tinte.map((c) => c - 50).join(",")},0.5)`], [1, `rgba(${tinte.map((c) => c - 60).join(",")},0)`]]), ...extra});
const fin = (lista, dur) => (lista[lista.length - 1][0] < dur ? [...lista, [dur, lista[lista.length - 1][1]]] : lista);

// ------------------------------------------------------------------ VAPOR DEL TANQUE (cae y se dispersa, en bucle; origen en la ventilacion)
function vaporTanque() {
    const DUR = 3600, partes = [];
    for (let i = 0; i < 9; i++) {
        const fase = Math.round(i * DUR / 9), lado = i % 2 ? 1 : -1, x = [], y = [], e = [], o = [];
        for (let t = 0; t <= DUR; t += 150) {
            const u = ((t + fase) % DUR) / DUR;
            x.push([t, r2(lado * (6 + 60 * u) + 8 * Math.sin(u * 7 + i)), "lineal"]); y.push([t, r2(140 * u * u + 20 * u), "lineal"]);
            e.push([t, r2(0.4 + 1.6 * u), "lineal"]); o.push([t, r2(u < 0.05 ? u * 7 : Math.max(0, 0.38 * (1 - u))), "lineal"]);
        }
        partes.push(bocanada(`vapor_${i}`, 14, {claves: {x, y, escala_x: e, escala_y: e, opacidad: o}, bucle: "repetir"}, [214, 222, 234]));
    }
    return {tipo: "asset", nombre: "Vapor del tanque", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ LLAMA DE MOTOR PRINCIPAL (tobera en 0,0; la llama baja; acciones Apagado, Arrancar, Encendido)
function llamaMotor() {
    const L = 170, partes = [
        {nombre: "resplandor", capa: 0, en: [0, 40], circulo: {r: 90, lados: 24}, mezcla: "suma", degradado: radial([0, 0], 90, [[0, "rgba(180,200,255,0.55)"], [1, "rgba(120,150,255,0)"]]), borde: TRANSP},
        {nombre: "pluma", capa: 1, pivote: [0, 0], mezcla: "suma", poligono: [[-11, 0], [11, 0], [16, L * 0.4], [6, L], [-6, L], [-16, L * 0.4]], borde: TRANSP,
            degradado: lineal([0, 0], [0, L], [[0, "rgba(255,240,230,0.95)"], [0.25, "rgba(170,190,255,0.75)"], [0.7, "rgba(140,120,255,0.35)"], [1, "rgba(120,100,255,0)"]])},
        {nombre: "nucleo", capa: 2, pivote: [0, 0], mezcla: "suma", poligono: [[-6, 0], [6, 0], [3, L * 0.5], [-3, L * 0.5]], color: "rgba(255,250,240,0.85)", borde: TRANSP},
        // diamantes de choque: rombos brillantes a lo largo de la llama
        ...[30, 62, 92, 118].map((y, i) => ({nombre: `diamante_${i}`, capa: 3, en: [0, y], mezcla: "suma", poligono: [[0, -9 + i], [7 - i, 0], [0, 9 - i], [-7 + i, 0]], color: "rgba(255,255,255,0.95)", borde: TRANSP})),
    ];
    const params = {op: ["pluma", "opacidad"], ex: ["pluma", "escala_x"], ey: ["pluma", "escala_y"], nu: ["nucleo", "opacidad"], re: ["resplandor", "opacidad"],
        d0: ["diamante_0", "opacidad"], d1: ["diamante_1", "opacidad"], d2: ["diamante_2", "opacidad"], d3: ["diamante_3", "opacidad"]};
    const base = {op: 0, ex: 1, ey: 1, nu: 0, re: 0, d0: 0, d1: 0, d2: 0, d3: 0};
    const encendido = (tl, k = 1) => { const f = 0.9 + 0.1 * Math.sin(TAU * tl / 70) * Math.sin(TAU * tl / 130);
        return {op: k * f, ex: 1 + 0.06 * Math.sin(TAU * tl / 90), ey: k * (0.95 + 0.08 * Math.sin(TAU * tl / 110)), nu: k, re: k * f, d0: k * f, d1: k * 0.9 * f, d2: k * 0.75 * f, d3: k * 0.6 * f}; };
    const acciones = [
        {nombre: "Apagado", dur: 1000, pose: () => ({})},
        // arranque escalonado: una llama roja sucia que se vuelve azul limpia
        {nombre: "Arrancar", dur: 1400, pose: (tl) => encendido(tl, tramo(tl, 0, 900))},
        {nombre: "Encendido", dur: 1400, pose: (tl) => encendido(tl, 1)},
    ];
    return asset("Llama de motor principal", acciones, params, base, partes);
}

// ------------------------------------------------------------------ LLAMA DE COHETE (tobera en 0,0; columna de fuego brillante; acciones Apagado, Encender, Encendido)
function llamaCohete() {
    const L = 460, partes = [
        {nombre: "resplandor", capa: 0, en: [0, 120], circulo: {r: 320, lados: 32}, mezcla: "suma", degradado: radial([0, 0], 320, [[0, "rgba(255,200,120,0.65)"], [0.5, "rgba(255,150,70,0.25)"], [1, "rgba(255,120,50,0)"]]), borde: TRANSP},
        {nombre: "fuego", capa: 1, pivote: [0, 0], mezcla: "suma", poligono: [[-15, 0], [15, 0], [34, L * 0.3], [26, L * 0.75], [8, L], [-8, L], [-26, L * 0.75], [-34, L * 0.3]], borde: TRANSP,
            degradado: lineal([0, 0], [0, L], [[0, "rgba(255,255,240,1)"], [0.2, "rgba(255,240,170,0.95)"], [0.55, "rgba(255,170,70,0.75)"], [1, "rgba(255,110,40,0)"]])},
        {nombre: "nucleo", capa: 2, pivote: [0, 0], mezcla: "suma", poligono: [[-10, 0], [10, 0], [14, L * 0.35], [0, L * 0.6], [-14, L * 0.35]], color: "rgba(255,255,250,0.95)", borde: TRANSP},
    ];
    const params = {op: ["fuego", "opacidad"], ex: ["fuego", "escala_x"], ey: ["fuego", "escala_y"], nu: ["nucleo", "opacidad"], nue: ["nucleo", "escala_y"], re: ["resplandor", "opacidad"], ree: ["resplandor", "escala_x"]};
    const base = {op: 0, ex: 1, ey: 1, nu: 0, nue: 1, re: 0, ree: 1};
    const vivo = (tl, k) => { const f = 0.88 + 0.12 * Math.sin(TAU * tl / 60) * Math.sin(TAU * tl / 97);
        return {op: k * f, ex: 1 + 0.08 * Math.sin(TAU * tl / 80), ey: k * (0.92 + 0.1 * Math.sin(TAU * tl / 120)), nu: k, nue: 0.9 + 0.15 * Math.sin(TAU * tl / 70), re: k * f, ree: 1 + 0.05 * Math.sin(TAU * tl / 150)}; };
    const acciones = [
        {nombre: "Apagado", dur: 1000, pose: () => ({})},
        {nombre: "Encender", dur: 600, pose: (tl) => { const k = tramo(tl, 0, 150); const v = vivo(tl, k); return {...v, re: Math.min(1.4, v.re * (1 + 0.8 * (1 - tramo(tl, 150, 600))))}; }},
        {nombre: "Encendido", dur: 1200, pose: (tl) => vivo(tl, 1)},
    ];
    return asset("Llama de cohete", acciones, params, base, partes);
}

// ------------------------------------------------------------------ AGUA DE SUPRESION (desde los rociadores de la plataforma; origen = origen de la plataforma)
function aguaSupresion() {
    const partes = [];
    [-240, -180, -120, 180, 240].forEach((x0, k) => {
        const hacia = x0 < 0 ? 1 : -1;
        // arco: de la boca del rociador hacia el centro, cae sobre la cubierta
        for (let j = 0; j < 3; j++) {
            const pts = [], ancho = 3 + j;
            for (let i = 0; i <= 10; i++) { const u = i / 10, x = x0 + hacia * u * (60 + j * 22), y = -30 - 50 * 4 * u * (1 - u) + u * 30; pts.push([r2(x), r2(y - ancho / 2)]); }
            for (let i = 10; i >= 0; i--) { const u = i / 10, x = x0 + hacia * u * (60 + j * 22), y = -30 - 50 * 4 * u * (1 - u) + u * 30; pts.push([r2(x), r2(y + ancho / 2)]); }
            partes.push({nombre: `chorro_${k}_${j}`, poligono: pts, color: blanco(0.35 - j * 0.08), borde: TRANSP});
        }
        partes.push(bocanada(`spray_${k}`, 30, {en: [r2(x0 + hacia * 80), -6], opacidad: 0.7}, [235, 240, 248]));
    });
    const params = {op: ["agua", "opacidad"]};
    const acciones = [
        {nombre: "Apagada", dur: 1000, pose: () => ({op: 0})},
        {nombre: "Rociar", dur: 600, pose: (tl) => ({op: tramo(tl, 0, 400) * (0.9 + 0.1 * Math.sin(TAU * tl / 120))})},
        {nombre: "Rociando", dur: 600, pose: (tl) => ({op: 0.9 + 0.1 * Math.sin(TAU * tl / 120)})},
    ];
    return asset("Agua de supresión", acciones, params, {op: 0}, [{nombre: "agua", partes}]);
}

// ------------------------------------------------------------------ NUBE (generador: humo o vapor que sale del foso hacia los costados y sube; una vez)
// origen = origen de la plataforma; las bocanadas salen por las bocas del foso (x = +-200, y = 140), corren
// hacia afuera, crecen y suben; el lado izquierdo lleva mas (como el lado principal del foso).
function nube(nombre, {n = 70, dur = 9000, alcance = 900, alto = 380, r = 46, tinte = [236, 232, 228], fuego = true, semilla = 1} = {}) {
    let s = semilla * 7919; const az = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const partes = [];
    if (fuego) partes.push({nombre: "luz_fuego", capa: 9, en: [0, 60], circulo: {r: 520, lados: 32}, mezcla: "suma", borde: TRANSP,
        degradado: radial([0, 0], 520, [[0, "rgba(255,170,80,0.55)"], [0.5, "rgba(255,130,60,0.2)"], [1, "rgba(255,120,50,0)"]]), claves: {opacidad: [[0, 0], [300, 1], [dur, 0.8]]}});
    for (let i = 0; i < n; i++) {
        const lado = az() < 0.68 ? -1 : 1, nace = Math.round(az() * dur * 0.55), vida = dur - nace;
        const dist = (0.35 + 0.65 * az()) * alcance, sube = (0.25 + az() * 0.75) * alto, rr = r * (0.7 + az() * 0.8);
        const x = [], y = [], e = [], o = [];
        x.push([0, lado * 190, "mantener"]); y.push([0, 140, "mantener"]); e.push([0, 0.2, "mantener"]); o.push([0, 0, "mantener"]);
        for (let t = 0; t <= vida; t += 300) {
            const u = t / vida, fx = 1 - (1 - u) ** 3;                              // sale rapido y frena
            x.push([nace + t, r2(lado * (190 + dist * fx)), "lineal"]); y.push([nace + t, r2(140 - sube * Math.pow(u, 0.8) + 10 * Math.sin(u * 5 + i)), "lineal"]);
            e.push([nace + t, r2(0.3 + 2.2 * Math.pow(u, 0.6)), "lineal"]); o.push([nace + t, r2(Math.min(1, u * 8) * (0.95 - 0.15 * u)), "lineal"]);
        }
        partes.push(bocanada(`bocanada_${i}`, r2(rr), {capa: Math.floor(az() * 8), claves: {x: fin(x, dur), y: fin(y, dur), escala_x: fin(e, dur), escala_y: fin(e, dur), opacidad: fin(o, dur)}}, tinte));
    }
    return {tipo: "asset", nombre, duracion: dur, marcas, partes};
}

// ------------------------------------------------------------------ BOCANADA DE ESTELA (un trozo de la columna de humo del ascenso; una vez: aparece, crece y se va)
function estela() {
    const DUR = 14000;
    return {tipo: "asset", nombre: "Bocanada de estela", duracion: DUR, marcas, partes: [
        bocanada("humo", 26, {claves: {escala_x: [[0, 0.5], [600, 1, "salir"], [DUR, 1.7, "lineal"]], escala_y: [[0, 0.7], [600, 1.05, "salir"], [DUR, 1.5, "lineal"]],
            opacidad: [[0, 0], [80, 0.95], [DUR * 0.4, 0.6], [DUR, 0.12]], x: [[0, 0], [DUR, 70, "lineal"]]}}, [226, 222, 218]),
        {nombre: "brasa", circulo: {r: 26, lados: 20}, mezcla: "suma", borde: TRANSP, degradado: radial([0, 0], 26, [[0, "rgba(255,200,120,0.9)"], [1, "rgba(255,150,80,0)"]]),
            claves: {opacidad: [[0, 0], [30, 1], [500, 0, "suave"]]}},
    ]};
}

// ------------------------------------------------------------------ PRUEBA DE IGNICION (no es del guion): de la cuenta al despegue
function pruebaIgnicion() {
    const DUR = 16000, PAD = [1100, 760], T_AGUA = 1500, T_MOT = 4000, T_CERO = 7000, T_SUBE = 7300;
    const TQ = [PAD[0], PAD[1] - 50];
    // despegue: sube acelerando (y en pixeles: 1/2 a t^2, con a creciente)
    const subeY = (t) => { const s = Math.max(0, t - T_SUBE) / 1000; return TQ[1] - (18 * s * s + 6 * s * s * s); };
    const ty = [[0, TQ[1]], [T_SUBE, TQ[1]]];
    for (let t = T_SUBE + 100; t <= DUR; t += 100) ty.push([t, r2(subeY(t)), "lineal"]);
    // estela: una bocanada cada 120 ms debajo de las toberas de los cohetes, donde va la pila en ese instante
    const estelas = [];
    // una bocanada cada 22 px de ascenso (columna continua aunque acelere)
    for (let t = T_SUBE + 200, k = 0, ultimo = Infinity; t < DUR; t += 20) {
        const y = subeY(t) + 50 + 120;
        if (ultimo - y < 22) continue;
        ultimo = y;
        estelas.push({instancia: "Bocanada de estela", nombre: `estela_${k}`, en: [r2(TQ[0] + (k % 2 ? 5 : -5)), r2(y)], plano: -3.5, bucle: false, desfase: t}); k++;
    }
    const camY = [[0, 470], [T_CERO, 470], [T_SUBE + 1500, 450, "suave"]];
    for (let t = T_SUBE + 2000; t <= DUR; t += 500) camY.push([t, r2(Math.min(450, subeY(t) - 120)), "suave"]);
    return {
        tipo: "escena", nombre: "prueba_ignicion", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.86, radio: 18, intensidad: 1.0}, claves: {brillo: [[0, 0], [T_CERO - 50, 0], [T_CERO + 80, 0.35, "lineal"], [T_CERO + 900, 0.05, "suave"], [DUR, 0]]}},
        camara: {tamano: [1280, 720], centro: [1130, 470], zoom: 1,
            // vibracion: leve al arrancar los motores principales, fuerte con los cohetes, y se calma en el ascenso
            temblor: [{desde: T_MOT, hasta: T_CERO, amplitud: 3, entrada: 900, decae: false, paso: 33},
                {desde: T_CERO, hasta: T_CERO + 3200, amplitud: 20, entrada: 150, decae: false, paso: 33},
                {desde: T_CERO + 3200, hasta: DUR, amplitud: 12, decae: true, paso: 33}],
            claves: {zoom: [[0, 1.1], [T_CERO, 1.15, "suave"], [T_SUBE + 2500, 0.9, "suave"], [DUR, 0.8, "suave"]], x: [[0, 1130], [DUR, 1110, "suave"]], y: camY}},
        objetos: [
            {instancia: "Cielo del amanecer", nombre: "cielo", en: [0, 0], plano: -10},
            {instancia: "Mar y costa", nombre: "costa", en: [0, 560], plano: -9},
            {instancia: "Torre de agua", nombre: "torre_agua", en: [620, 830], plano: -7, escala: 0.9},
            {instancia: "Plataforma de lanzamiento", nombre: "plataforma", en: PAD, plano: -5},
            {instancia: "Torre de servicio", nombre: "torre", en: [PAD[0] + 250, PAD[1]], plano: -4, acciones: [[0, "Brazos retirados"]]},
            {instancia: "Agua de supresión", nombre: "agua", en: PAD, plano: -4.5, acciones: [[0, "Apagada"], [T_AGUA, "Rociar", false], [T_AGUA + 600, "Rociando"]]},
            ...estelas,
            {instancia: "Tanque externo", nombre: "tanque", en: TQ, plano: -3, claves: {y: ty}},
            {instancia: "Vapor del tanque", nombre: "vapor_lox", en: [-20, -320], padre: "tanque", plano: -2.8, claves: {opacidad: [[0, 1], [T_CERO, 1], [T_SUBE + 400, 0, "suave"]]}},
            {instancia: "Vapor del tanque", nombre: "vapor_lh2", en: [30, -200], padre: "tanque", plano: -2.8, desfase: 1700, escala: 0.8, claves: {opacidad: [[0, 1], [T_CERO, 1], [T_SUBE + 400, 0, "suave"]]}},
            {instancia: "Cohete lateral", nombre: "cohete", en: PILA.cohete, padre: "tanque", plano: -2},
            {instancia: "Orbitador Aurora", nombre: "orbitador", en: PILA.orbitador, padre: "tanque", plano: -2.5},
            ...[[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: -2.6,
                acciones: [[0, "Apagado"], [T_MOT + i * 120, "Arrancar", false], [T_MOT + 1400 + i * 120, "Encendido"]]})),
            {instancia: "Llama de cohete", nombre: "llama_cohete", en: [0, 50], padre: "tanque", plano: -2.1, acciones: [[0, "Apagado"], [T_CERO, "Encender", false], [T_CERO + 600, "Encendido"]]},
            // vapor blanco del arranque de los motores (agua que hierve en el foso) y la gran nube de humo de los cohetes
            {instancia: "Vapor de arranque", nombre: "vapor_arranque", en: PAD, plano: -3.8, bucle: false, desfase: T_MOT + 200},
            {instancia: "Nube de humo", nombre: "humo", en: PAD, plano: -1, bucle: false, desfase: T_CERO + 50},
        ],
        efectos: [
            // chispas de los encendedores de hidrogeno, justo antes del arranque
            {tipo: "particulas", nombre: "chispas", en: [PAD[0] + 80, PAD[1] - 50], inicio: T_MOT - 600, fin: T_MOT + 500, tasa: 60, vida: 700, velocidad: 220, angulo: 90, dispersion: 120,
                gravedad: 300, tam_ini: 3, tam_fin: 1, color_ini: "#fff6c0", color_fin: "#ff8a30", suave: "si", opacidad: 0.95, mezcla: "suma", sonido: "no_lleva"},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

// ================================================================== FASE 4: ASCENSO Y ESPACIO
// ------------------------------------------------------------------ TIERRA DESDE LA ALTURA (horizonte curvo; origen = punto mas alto del horizonte)
function tierraAltura() {
    const R = 5200, partes = [];
    const arco = (r, a0 = -0.42, a1 = 0.42, n = 60) => Array.from({length: n + 1}, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [r2(Math.sin(a) * r), r2(R - Math.cos(a) * r)]; });
    // atmosfera: bandas finas sobre el horizonte (azul que se va al negro)
    partes.push({nombre: "atmosfera", capa: 0, poligono: [...arco(R + 120), ...arco(R).reverse()], borde: TRANSP,
        degradado: radial([0, R], R + 120, [[0.96, "rgba(120,190,255,0.9)"], [0.985, "rgba(80,140,255,0.45)"], [1, "rgba(40,60,160,0)"]])});
    // superficie: oceano y nubes
    partes.push({nombre: "superficie", capa: 1, poligono: [...arco(R), [r2(Math.sin(0.42) * R), 1800], [r2(-Math.sin(0.42) * R), 1800]], borde: TRANSP,
        degradado: lineal([0, 0], [0, 900], [[0, "#9ac8f0"], [0.06, "#3a7ac0"], [0.4, "#1a4a8a"], [1, "#0a2a5a"]])});
    for (let i = 0; i < 40; i++) {
        const x = (azar() - 0.5) * 3600, y = 10 + Math.pow(azar(), 1.6) * 700, w = 60 + azar() * 260 * (0.3 + y / 700), h = w * (0.04 + 0.12 * y / 700);
        partes.push({nombre: `nube_${i}`, capa: 2, en: [r2(x), r2(y + x * x / (2 * R))], poligono: ovalo(0, 0, w, h, 18, (a) => 1 + 0.2 * Math.sin(a * 3 + i)), color: `rgba(255,255,255,${r2(0.55 + azar() * 0.35)})`, borde: TRANSP});
    }
    partes.push({nombre: "brillo_borde", capa: 3, poligono: [...arco(R + 6), ...arco(R - 4).reverse()], color: "rgba(200,235,255,0.8)", borde: TRANSP});
    return {tipo: "asset", nombre: "Tierra desde la altura", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ ESPACIO PROFUNDO (fondo negro con estrellas y la Via Lactea; origen 0,0; cubre 4000 x 2400)
function espacio() {
    const partes = [{nombre: "negro", capa: 0, rect: [-2000, -1200, 2000, 1200], color: "#010208"},
        {nombre: "via_lactea", capa: 1, rotacion: -24, poligono: ovalo(0, 0, 1900, 170, 40, (a) => 1 + 0.25 * Math.sin(a * 4)), borde: TRANSP,
            degradado: lineal([0, -190], [0, 190], [[0, "rgba(120,120,170,0)"], [0.5, "rgba(150,140,190,0.12)"], [1, "rgba(120,120,170,0)"]])}];
    for (let i = 0; i < 380; i++) {
        const r = azar() < 0.93 ? 0.6 + azar() * 1.1 : 1.6 + azar() * 1.4;
        partes.push({nombre: `estrella_${i}`, capa: 2, en: [r2((azar() - 0.5) * 4000), r2((azar() - 0.5) * 2400)], circulo: {r: r2(r), lados: 6}, color: ["#ffffff", "#cfe0ff", "#fff0d8"][i % 3], opacidad: r2(0.4 + azar() * 0.6)});
    }
    return {tipo: "asset", nombre: "Espacio profundo", duracion: 1000, marcas, partes};
}

// ------------------------------------------------------------------ CONO DE CONDENSACION (nube blanca en forma de cono al romper la barrera del sonido; una vez)
const conoCondensacion = () => ({tipo: "asset", nombre: "Cono de condensación", duracion: 1600, marcas, partes: [
    {nombre: "cono", poligono: [[-30, -40], [30, -40], [110, 120], [80, 150], [-80, 150], [-110, 120]], borde: TRANSP,
        degradado: lineal([0, -40], [0, 150], [[0, "rgba(255,255,255,0)"], [0.25, "rgba(255,255,255,0.85)"], [0.7, "rgba(230,240,255,0.55)"], [1, "rgba(230,240,255,0)"]]),
        claves: {opacidad: [[0, 0], [150, 1, "salir"], [700, 0.8], [1600, 0, "suave"]], escala_x: [[0, 0.6], [400, 1, "salir"], [1600, 1.25]], escala_y: [[0, 0.7], [400, 1], [1600, 1.15]]}},
    {nombre: "anillo", en: [0, 60], poligono: ovalo(0, 0, 100, 22, 28).concat(ovalo(0, 0, 80, 14, 28).reverse()), color: "rgba(255,255,255,0.6)", borde: TRANSP,
        claves: {opacidad: [[0, 0], [150, 0.9], [900, 0, "suave"]], escala_x: [[0, 0.6], [900, 1.4]], escala_y: [[0, 0.6], [900, 1.4]]}},
]});

// ------------------------------------------------------------------ DESTELLO DE SEPARACION (los motorcitos que empujan los cohetes: fogonazo y humito; una vez)
const destelloSeparacion = () => ({tipo: "asset", nombre: "Destello de separación", duracion: 2000, marcas, partes: [
    {nombre: "fogonazo", circulo: {r: 40, lados: 20}, mezcla: "suma", borde: TRANSP, degradado: radial([0, 0], 40, [[0, "rgba(255,250,220,1)"], [0.4, "rgba(255,200,120,0.7)"], [1, "rgba(255,160,80,0)"]]),
        claves: {opacidad: [[0, 0], [40, 1], [400, 0, "suave"]], escala_x: [[0, 0.4], [200, 1.3]], escala_y: [[0, 0.4], [200, 1.3]]}},
    ...[[-1, -0.3], [-1, 0.4], [-0.6, -0.8]].map(([dx, dy], i) => bocanada(`humito_${i}`, 14, {claves: {x: [[0, 0], [2000, r2(dx * 120), "salir"]], y: [[0, 0], [2000, r2(dy * 120), "salir"]],
        escala_x: [[0, 0.3], [2000, 2.4]], escala_y: [[0, 0.3], [2000, 2.4]], opacidad: [[0, 0], [60, 0.9], [2000, 0, "suave"]]}}, [232, 228, 224])),
]});

// ------------------------------------------------------------------ PROPULSORES DE MANIOBRA (soplos blancos cortos; origen en la boquilla; apuntan a la derecha)
function propulsores() {
    const soplo = (n) => ({nombre: n, poligono: [[0, -3], [0, 3], [46, 14], [52, 0], [46, -14]], borde: TRANSP,
        degradado: lineal([0, 0], [52, 0], [[0, "rgba(255,255,255,0.95)"], [0.4, "rgba(240,245,255,0.6)"], [1, "rgba(240,245,255,0)"]])});
    const partes = [{nombre: "soplo", pivote: [0, 0], partes: [soplo("chorro")]}];
    const params = {op: ["soplo", "opacidad"], ex: ["soplo", "escala_x"]};
    const acciones = [
        {nombre: "Quieto", dur: 1000, pose: () => ({op: 0, ex: 0.5})},
        // tres soplos cortos
        {nombre: "Soplos", dur: 1500, pose: (tl) => { const on = [[0, 180], [500, 650], [1000, 1250]].some(([a, b]) => tl >= a && tl <= b); return {op: on ? 0.9 : 0, ex: on ? 1 + 0.2 * Math.sin(TAU * tl / 60) : 0.5}; }},
    ];
    return asset("Propulsores de maniobra", acciones, params, {op: 0, ex: 0.5}, partes);
}

// ------------------------------------------------------------------ TIERRA DESDE LA ORBITA (planeta grande que gira; centro en 0,0; radio 900)
// Igual que la Tierra de un proyecto anterior: cada continente y nube se proyecta sobre la esfera (x = R cos(lat) sen(lon)),
// se angosta cerca del borde y se apaga al pasar por detras. Aca mas realista: oceano profundo, desiertos, selvas,
// nubes en espiral y el terminador (lado de noche) a la derecha.
function tierraOrbita() {
    const R = 900, DUR = 90000, partes = [];
    partes.push({nombre: "atmosfera", capa: 0, circulo: {r: R + 40, lados: 96}, borde: TRANSP, degradado: radial([0, 0], R + 40, [[0.93, "rgba(120,190,255,0.85)"], [0.97, "rgba(70,130,255,0.35)"], [1, "rgba(40,80,200,0)"]])});
    partes.push({nombre: "oceano", capa: 1, circulo: {r: R, lados: 96}, degradado: radial([-R * 0.35, -R * 0.3], R * 1.4, [[0, "#2a78c0"], [0.4, "#14509a"], [0.8, "#0a2e66"], [1, "#061c48"]])});
    partes.push({nombre: "oceano_reflejo", capa: 1, circulo: {r: R, lados: 96}, borde: TRANSP, degradado: radial([-R * 0.4, -R * 0.35], R * 0.7, [[0, "rgba(120,190,240,0.35)"], [1, "rgba(120,190,240,0)"]])});
    const items = [];
    // continentes: varias manchas solapadas por continente (selva, llanura, desierto), con degradado y borde irregular
    const continentes = [[0.6, 0.2, 0.32, 0.26], [0.3, 1.4, 0.4, 0.3], [-0.2, 2.2, 0.3, 0.42], [0.1, 3.4, 0.5, 0.36], [-0.5, 4.3, 0.26, 0.2], [0.75, 5.2, 0.42, 0.16]];
    const tonos = [["#4f7a3a", "#2f5a2a"], ["#8a8a50", "#5a6a3a"], ["#c8a870", "#9a7a50"], ["#6a7a48", "#3a5a30"]];
    continentes.forEach(([lat, lon, w, h], k) => {
        for (let j = 0; j < 4; j++) {
            const [c1, c2] = tonos[(k + j) % 4], rx = w * R * (0.3 + azar() * 0.3), ry = h * R * (0.3 + azar() * 0.3);
            items.push({nombre: `continente_${k}_${j}`, lat: lat + (azar() - 0.5) * h * 0.8, lon: lon + (azar() - 0.5) * w * 0.9, rx, ry, capa: 2, irr: 0.32,
                degradado: radial([-rx * 0.2, -ry * 0.2], Math.max(rx, ry) * 1.1, [[0, c1], [1, c2]])});
        }
    });
    // nubes: muchas, finas y estiradas, con transparencias (y bandas de tormenta)
    for (let i = 0; i < 90; i++) items.push({nombre: `nube_${i}`, lat: (azar() - 0.5) * 2.6, lon: azar() * TAU, rx: (0.03 + azar() * 0.14) * R, ry: (0.008 + azar() * 0.03) * R,
        color: `rgba(255,255,255,${r2(0.35 + azar() * 0.5)})`, capa: 3, irr: 0.45, vel: 1.15});
    for (const it of items) {
        const x = [], e = [], o = [], y = r2(-R * Math.sin(it.lat));
        for (let t = 0; t <= DUR; t += 400) {
            const lon = it.lon + TAU * t / DUR * (it.vel || 1), c = Math.cos(lon);
            x.push([t, r2(R * Math.cos(it.lat) * Math.sin(lon)), "lineal"]); e.push([t, r2(Math.max(0.03, c)), "lineal"]); o.push([t, r2(c > 0.05 ? Math.min(1, c * 3) : 0), "lineal"]);
        }
        partes.push({nombre: it.nombre, capa: it.capa, en: [x[0][1], y], poligono: ovalo(0, 0, it.rx, it.ry, 20, (a) => 1 + it.irr * Math.sin(a * 3 + it.lat * 7) * 0.6 + it.irr * 0.4 * Math.sin(a * 5 + it.lon)),
            ...(it.degradado ? {degradado: it.degradado} : {color: it.color}), borde: TRANSP, claves: {x, escala_x: e, opacidad: o}, bucle: "repetir"});
    }
    // noche (terminador) a la derecha, brillo del sol en el mar y luz de borde
    partes.push({nombre: "noche", capa: 5, circulo: {r: R + 1, lados: 96}, borde: TRANSP, degradado: lineal([-R, 0], [R, 0], [[0, "rgba(0,0,10,0)"], [0.62, "rgba(0,0,10,0)"], [0.8, "rgba(0,2,16,0.75)"], [1, "rgba(0,2,16,0.95)"]])});
    partes.push({nombre: "brillo_sol", capa: 6, en: [-R * 0.38, -R * 0.32], circulo: {r: 160, lados: 32}, mezcla: "suma", borde: TRANSP, degradado: radial([0, 0], 160, [[0, "rgba(255,250,230,0.55)"], [1, "rgba(255,250,230,0)"]])});
    return {tipo: "asset", nombre: "Tierra desde la órbita", duracion: DUR, marcas, partes};
}

// ------------------------------------------------------------------ ORBITADOR DESDE ARRIBA (planta; nariz a la derecha; centro en 0,0; ~370 de largo)
// Acciones: Cerrada, Abrir (las dos puertas giran hacia afuera y muestran los radiadores) y Abierta.
function orbitadorArriba() {
    const partes = [
        {nombre: "ala", capa: 0, poligono: [[-185, 0], [-185, -132], [-150, -146], [-40, -60], [60, -40], [120, -34], [120, 34], [60, 40], [-40, 60], [-150, 146], [-185, 132]],
            degradado: lineal([0, -146], [0, 146], [[0, "#c8ccd4"], [0.5, "#f4f4f6"], [1, "#b8bcc4"]])},
        {nombre: "ala_bordes", capa: 1, poligono: [[-150, -146], [-40, -60], [60, -40], [120, -34], [120, -30], [60, -36], [-40, -55], [-150, -140]], color: "#2a2a30"},
        {nombre: "ala_bordes_2", capa: 1, poligono: [[-150, 146], [-40, 60], [60, 40], [120, 34], [120, 30], [60, 36], [-40, 55], [-150, 140]], color: "#2a2a30"},
        {nombre: "fuselaje", capa: 2, poligono: [[-195, -30], [150, -30], [175, -22], [190, -8], [194, 0], [190, 8], [175, 22], [150, 30], [-195, 30]],
            degradado: lineal([0, -30], [0, 30], [[0, "#b8bcc4"], [0.3, "#f8f8fa"], [0.7, "#f8f8fa"], [1, "#a8acb4"]])},
        {nombre: "nariz", capa: 3, poligono: [[175, -22], [190, -8], [194, 0], [190, 8], [175, 22], [168, 0]], color: "#3a3a40"},
        {nombre: "ventanas", capa: 3, poligono: [[150, -16], [162, -12], [162, 12], [150, 16]], color: "#1a2a40"},
        {nombre: "oms_i", capa: 3, poligono: [[-195, -30], [-120, -30], [-110, -20], [-195, -18]], color: "#e8eaee"},
        {nombre: "oms_d", capa: 3, poligono: [[-195, 30], [-120, 30], [-110, 20], [-195, 18]], color: "#e8eaee"},
        {nombre: "deriva", capa: 4, poligono: [[-200, -3], [-120, -3], [-110, 0], [-120, 3], [-200, 3]], color: "#d8dae0"},
        // bodega abierta: interior oscuro con el satelite
        {nombre: "bodega", capa: 3, rect: [-110, -26, 130, 26], degradado: lineal([0, -26], [0, 26], [[0, "#2a2e38"], [0.5, "#4a505c"], [1, "#2a2e38"]])},
        ...[-80, -40, 0, 40, 80].map((x, i) => ({nombre: `costilla_${i}`, capa: 4, rect: [x, -26, x + 2, 26], color: "#5a606c"})),
        // puertas: por fuera blancas (se cierran sobre la bodega); al abrirse giran sobre la bisagra del borde y
        // muestran por dentro los radiadores (franjas plateadas)
        ...[[-1, "i"], [1, "d"]].flatMap(([s, n]) => [
            {nombre: `puerta_${n}`, capa: 6, en: [0, s * 30], pivote: [0, 0], rect: [-112, s > 0 ? -30 : 0, 132, s > 0 ? 0 : 30], degradado: lineal([0, 0], [0, -s * 30], [[0, "#c8ccd4"], [1, "#f4f4f6"]])},
            {nombre: `radiador_${n}`, capa: 6, en: [0, s * 30], pivote: [0, 0], partes: [
                {nombre: `radiador_${n}_panel`, rect: [-112, s > 0 ? 0 : -30, 132, s > 0 ? 30 : 0], degradado: lineal([0, 0], [0, s * 30], [[0, "#9aa8bc"], [1, "#e0e8f4"]])},
                ...[0, 1, 2, 3].map((k) => ({nombre: `radiador_${n}_tubo_${k}`, rect: [-112, r2(s * (5 + k * 7)), 132, r2(s * (5 + k * 7) + 1)], color: "#6a7a90"})),
            ]},
        ]),
    ];
    const params = {pi: ["puerta_i", "escala_y"], pd: ["puerta_d", "escala_y"], ri: ["radiador_i", "escala_y"], rd: ["radiador_d", "escala_y"],
        opi: ["puerta_i", "opacidad"], opd: ["puerta_d", "opacidad"], ori: ["radiador_i", "opacidad"], ord: ["radiador_d", "opacidad"]};
    const base = {pi: 1, pd: 1, ri: 0, rd: 0, opi: 1, opd: 1, ori: 0, ord: 0};
    const abrir = (k) => { const a = Math.min(1, k * 2), b = Math.max(0, k * 2 - 1);   // primera mitad: la puerta se "acuesta"; segunda: aparece el radiador afuera
        return {pi: 1 - a, pd: 1 - a, opi: a < 1 ? 1 : 0, opd: a < 1 ? 1 : 0, ri: b, rd: b, ori: b > 0 ? 1 : 0, ord: b > 0 ? 1 : 0}; };
    const acciones = [
        {nombre: "Cerrada", dur: 1000, pose: () => ({})},
        {nombre: "Abrir", dur: 4000, pose: (tl) => abrir(tramo(tl, 0, 4000))},
        {nombre: "Abierta", dur: 1000, pose: () => abrir(1)},
    ];
    return asset("Orbitador desde arriba", acciones, params, base, partes);
}

// ------------------------------------------------------------------ SATELITE (en la bodega; despliega sus paneles; centro en 0,0)
function satelite() {
    const panel = (n, s) => ({nombre: n, pivote: [s * 22, 0], partes: [
        {nombre: `${n}_brazo`, rect: s > 0 ? [22, -2, 32, 2] : [-32, -2, -22, 2], color: "#8a8a90"},
        ...[0, 1, 2].map((k) => ({nombre: `${n}_celda_${k}`, rect: s > 0 ? [32 + k * 30, -16, 60 + k * 30, 16] : [-60 - k * 30, -16, -32 - k * 30, 16],
            degradado: lineal([0, -16], [0, 16], [[0, "#2a3a7a"], [0.5, "#4a6ab8"], [1, "#1a2a5a"]])})),
    ]});
    const partes = [
        {nombre: "cuerpo", rect: [-22, -18, 22, 18], degradado: lineal([-22, -18], [22, 18], [[0, "#f0c860"], [0.5, "#c89030"], [1, "#e8b850"]])},
        {nombre: "antena", en: [0, -22], poligono: ovalo(0, 0, 12, 5, 14), color: "#e8e8ec"},
        panel("panel_i", -1), panel("panel_d", 1),
    ];
    const params = {pi: ["panel_i", "escala_x"], pd: ["panel_d", "escala_x"]};
    const acciones = [
        {nombre: "Plegado", dur: 1000, pose: () => ({pi: 0.05, pd: 0.05})},
        {nombre: "Desplegar", dur: 2400, pose: (tl) => ({pi: 0.05 + 0.95 * tramo(tl, 0, 2400), pd: 0.05 + 0.95 * tramo(tl, 300, 2400)})},
        {nombre: "Desplegado", dur: 1000, pose: () => ({pi: 1, pd: 1})},
    ];
    return asset("Satélite", acciones, params, {pi: 0.05, pd: 0.05}, partes);
}

// ------------------------------------------------------------------ PRUEBA DEL ASCENSO (no es del guion): giro, cono, separaciones y orbita
function pruebaAscenso() {
    const DUR = 26000, T_CONO = 1500, T_SRB = 6500, T_MECO = 12500, T_ET = 13500, T_ORB = 16500;
    // la pila vuela inclinada (rumbo a la derecha), con la camara que la sigue; las coordenadas de la escena son de "cielo alto"
    const P0 = [800, 500];
    const pos = (t) => [r2(P0[0] + 0.03 * t), r2(P0[1] - 0.012 * t)];
    const xs = [], ys = [];
    for (let t = 0; t <= T_ORB; t += 200) { const [x, y] = pos(t); xs.push([t, x, "lineal"]); ys.push([t, y, "lineal"]); }
    const camX = xs.map(([t, x]) => [t, r2(x + 60), "lineal"]), camY = ys.map(([t, y]) => [t, r2(y - 40), "lineal"]);
    // cohetes: unidos hasta T_SRB; despues se alejan, caen y giran (claves relativas al tanque, que sigue)
    const srb = (lado, x0) => {
        const x = [[0, x0], [T_SRB, x0]], y = [[0, 50], [T_SRB, 50]], rot = [[0, 0], [T_SRB, 0]], op = [[0, 1], [T_SRB, 1]];
        for (let t = T_SRB + 200; t <= T_ORB; t += 200) {
            const s = (t - T_SRB) / 1000;
            x.push([t, r2(x0 + lado * (40 * s + 6 * s * s) - 0.03 * (t - T_SRB)), "lineal"]); y.push([t, r2(50 + 30 * s * s + 0.012 * (t - T_SRB)), "lineal"]);
            rot.push([t, r2(lado * (12 * s + 4 * s * s)), "lineal"]); op.push([t, r2(Math.max(0, 1 - Math.max(0, s - 4) / 2)), "lineal"]);
        }
        return {x, y, rotacion: rot, opacidad: op};
    };
    const tanqueClaves = {x: xs, y: ys, rotacion: [[0, 18], [T_ORB, 22, "suave"]]};
    return {
        tipo: "escena", nombre: "prueba_ascenso", duracion: DUR, precision: "decimal", profundidad: false,
        estilo: {resplandor: {umbral: 0.84, radio: 18, intensidad: 0.9}},
        camara: {tamano: [1280, 720], centro: [P0[0] + 60, P0[1] - 40], zoom: 1,
            temblor: [{desde: 0, hasta: T_MECO, amplitud: 5, decae: true, paso: 33}],
            claves: {x: [...camX, [T_ORB + 1, 0], [DUR, 60, "suave"]], y: [...camY, [T_ORB + 1, 200], [DUR, 180, "suave"]],
                zoom: [[0, 1], [T_SRB, 1.05, "suave"], [T_ET, 0.95, "suave"], [T_ORB, 0.95], [T_ORB + 1, 0.9], [DUR, 1.05, "suave"]]}},
        objetos: [
            // cielo de altura: negro arriba, azul en el horizonte; la Tierra curva abajo (se aleja)
            {instancia: "Espacio profundo", nombre: "espacio", en: [P0[0], P0[1]], plano: -10, claves: {x: camX.map(([t, x]) => [t, r2(x - 0)]), y: camY.map(([t, y]) => [t, r2(y)])}},
            {instancia: "Tierra desde la altura", nombre: "tierra_alta", en: [P0[0], P0[1] + 200], plano: -9, rotacion: -6, claves: {x: camX.map(([t, x]) => [t, r2(x - 80)]), y: camY.map(([t, y]) => [t, r2(y + 250 + 0.004 * t)])}},
            {instancia: "Tanque externo", nombre: "tanque", en: P0, plano: 0, claves: {...tanqueClaves,
                opacidad: [[0, 1], [T_ET, 1], [T_ORB - 600, 1], [T_ORB, 0]]}},
            {instancia: "Cohete lateral", nombre: "cohete_atras", en: [6, 50], padre: "tanque", plano: -0.5, claves: srb(1, 6)},
            {instancia: "Cohete lateral", nombre: "cohete", en: [0, 50], padre: "tanque", plano: 1, claves: srb(-1, 0)},
            {instancia: "Llama de cohete", nombre: "llama_cohete", en: [0, 50], padre: "tanque", plano: 0.9, acciones: [[0, "Encendido"]], claves: {opacidad: [[0, 1], [T_SRB - 300, 1], [T_SRB, 0]]}},
            {instancia: "Destello de separación", nombre: "destello_sep_1", en: [-10, -380], padre: "tanque", plano: 2, bucle: false, desfase: T_SRB},
            {instancia: "Destello de separación", nombre: "destello_sep_2", en: [-10, 30], padre: "tanque", plano: 2, bucle: false, desfase: T_SRB + 40},
            // el orbitador: con el tanque hasta T_ET; despues se separa (sube y se aleja) mientras el tanque cae
            {instancia: "Orbitador Aurora", nombre: "orbitador", en: [52, -10], padre: "tanque", plano: 0.5,
                claves: {x: [[0, 52], [T_ET, 52], [T_ET + 3000, 140, "salir"]], y: [[0, -10], [T_ET, -10], [T_ET + 3000, -160, "salir"]], opacidad: [[0, 1], [T_ORB - 600, 1], [T_ORB, 0]]}},
            ...[[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: 0.4, acciones: [[0, "Encendido"]],
                claves: {opacidad: [[0, 1], [T_MECO, 1], [T_MECO + 300, 0]]}})),
            {instancia: "Cono de condensación", nombre: "cono", en: [40, -200], padre: "tanque", plano: 1.5, bucle: false, desfase: T_CONO},
            {instancia: "Propulsores de maniobra", nombre: "rcs_nariz", en: [100, -340], padre: "tanque", plano: 1.6, acciones: [[0, "Quieto"], [T_ET + 100, "Soplos", false]],
                claves: {opacidad: [[0, 1], [T_ORB - 600, 1], [T_ORB, 0]]}},
            // ORBITA (desde T_ORB): la Tierra grande, el orbitador desde arriba con la bodega que se abre y el satelite
            {instancia: "Espacio profundo", nombre: "espacio_orbita", en: [0, 0], plano: 3, claves: {opacidad: [[0, 0], [T_ORB, 0, "mantener"], [T_ORB + 1, 1], [DUR, 1]]}},
            {instancia: "Tierra desde la órbita", nombre: "tierra_orbita", en: [-200, 1100], plano: 4, desfase: 20000, claves: {opacidad: [[0, 0], [T_ORB, 0, "mantener"], [T_ORB + 1, 1], [DUR, 1]]}},
            {instancia: "Orbitador desde arriba", nombre: "orbitador_arriba", en: [60, 140], plano: 5, escala: 1.4, rotacion: -8,
                acciones: [[0, "Cerrada"], [T_ORB + 1500, "Abrir", false], [T_ORB + 5500, "Abierta"]],
                claves: {opacidad: [[0, 0], [T_ORB, 0, "mantener"], [T_ORB + 1, 1], [DUR, 1]], x: [[T_ORB, 40], [DUR, 80, "suave"]], y: [[T_ORB, 150], [DUR, 132, "suave"]]}},
            {instancia: "Satélite", nombre: "satelite", en: [70, 138], plano: 4.9, escala: 1.1, rotacion: -8, acciones: [[0, "Plegado"], [T_ORB + 6500, "Desplegar", false], [T_ORB + 8900, "Desplegado"]],
                claves: {opacidad: [[0, 0], [T_ORB, 0, "mantener"], [T_ORB + 1, 1], [DUR, 1]], x: [[T_ORB, 50], [DUR, 90, "suave"]], y: [[T_ORB, 148], [T_ORB + 6000, 140, "suave"], [DUR, 60, "suave"]]}},
        ],
        marcas: {EventoGeneral: "no_lleva"},
    };
}

// ================================================================== FASE 5: LAS 7 ESCENAS DEL GUION (capitulo "Horizon-1")
// Voces y subtitulos en ingles (guion_lanzamiento.md). Control = narrador (subtitulo abajo); el comandante habla
// desde el orbitador. Las voces se generan en la fase 6 (por ahora `voces: {}`).
const PADX = 1100, PADY = 760, TQY = PADY - 50;
// ascenso desde el despegue (s en segundos): px hacia arriba
const sube = (s) => (s <= 0 ? 0 : 9 * s * s + 2 * s * s * s);
const ctrl = (texto, desde, hasta, extra = {}) => ({texto, desde, hasta, estilo: "narrador", posicion: "abajo", velocidad: 24, ...extra});
// Elenco (ElevenLabs, elegido por el usuario el 2026-11-22): Launch Control = Jonathan; comandante = Jenifer, por radio
const COMANDANTE = {motor: "elevenlabs", voz: "cKLbkUTUBoxzpe6oCPbr", radio: true};
const VOCES_L = {narrador: {motor: "elevenlabs", voz: "0F6wBri3KtnolnAMTeIU"}, orbitador: COMANDANTE, orbitador_arriba: COMANDANTE};
const escenaL = (nombre, dur, def) => ({tipo: "escena", nombre, duracion: dur, precision: "decimal", profundidad: false, voces: VOCES_L, marcas: {EventoGeneral: "no_lleva"}, ...def});
const visible = (desde, hasta, dur) => {
    const m = new Map([[0, 0], [dur, 0]]);
    m.set(desde, 1); if (hasta < dur) m.set(hasta, 0); else m.set(dur, 1);
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => [t, v, "mantener"]);
};
// la plataforma y la pila (en el suelo): objetos comunes de las escenas 1 a 3
function enLaPlataforma({torre = [[0, "Brazos puestos"]], agua = [[0, "Apagada"]], motores = [[0, "Apagado"]], cohetes = [[0, "Apagado"]], tanqueY = null, vapor = true, gaviotas = 0, dur = 10000} = {}) {
    const o = [
        {instancia: "Cielo del amanecer", nombre: "cielo", en: [0, 0], plano: -10},
        {instancia: "Mar y costa", nombre: "costa", en: [0, 560], plano: -9},
        {instancia: "Torre de agua", nombre: "torre_agua", en: [620, 830], plano: -7, escala: 0.9},
        {instancia: "Plataforma de lanzamiento", nombre: "plataforma", en: [PADX, PADY], plano: -5},
        {instancia: "Torre de servicio", nombre: "torre", en: [PADX + 250, PADY], plano: -4, acciones: torre},
        {instancia: "Agua de supresión", nombre: "agua", en: [PADX, PADY], plano: -4.5, acciones: agua},
        {instancia: "Tanque externo", nombre: "tanque", en: [PADX, TQY], plano: -3, ...(tanqueY ? {claves: {y: tanqueY}} : {})},
        {instancia: "Cohete lateral", nombre: "cohete", en: PILA.cohete, padre: "tanque", plano: -2},
        {instancia: "Orbitador Aurora", nombre: "orbitador", en: PILA.orbitador, padre: "tanque", plano: -2.5},
        ...[[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: -2.6, acciones: motores.map(([t, a, b], j) => [j === 0 ? t : t + i * 120, a, ...(b === false ? [false] : [])])})),
        {instancia: "Llama de cohete", nombre: "llama_cohete", en: [0, 50], padre: "tanque", plano: -2.1, acciones: cohetes},
    ];
    if (vapor) o.push(
        {instancia: "Vapor del tanque", nombre: "vapor_lox", en: [-20, -320], padre: "tanque", plano: -2.8},
        {instancia: "Vapor del tanque", nombre: "vapor_lh2", en: [30, -200], padre: "tanque", plano: -2.8, desfase: 1700, escala: 0.8});
    for (let i = 0; i < gaviotas; i++) { const x = 200 + i * 520, y = 300 + (i % 2) * 60; o.push({instancia: "Gaviota", nombre: `gaviota_${i}`, en: [x, y], plano: 0, escala: 1.2, desfase: i * 170,
        claves: {x: [[0, x], [dur, x + (i % 2 ? -700 : 700), "lineal"]], y: [[0, y], [dur / 2, y - 30, "suave"], [dur, y + 10, "suave"]]}}); }
    return o;
}
// estela de humo detras de la pila mientras sube (bocanadas por distancia); t_despegue en ms de la escena
function estelaSuelo(tDespegue, dur, alto = 9999999) {
    const r = [];
    for (let t = tDespegue + 150, k = 0, ultimo = Infinity; t < dur; t += 20) {
        const y = TQY - sube((t - tDespegue) / 1000) + 50 + 120;
        if (ultimo - y < 22 || TQY - y > alto) continue;
        ultimo = y;
        r.push({instancia: "Bocanada de estela", nombre: `estela_${k}`, en: [r2(PADX + (k % 2 ? 5 : -5)), r2(y)], plano: -3.5, bucle: false, desfase: t}); k++;
    }
    return r;
}

// ---------------------------------------------------------------- 1. Amanecer en la plataforma (12 s)
function escenaL1() {
    const DUR = 12000;
    return escenaL("1. Dawn on the pad", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 16, intensidad: 0.7}},
        camara: {tamano: [1280, 720], centro: [1000, 480], zoom: 0.55, claves: {zoom: [[0, 0.55], [DUR, 0.82, "suave"]], x: [[0, 1000], [DUR, 1110, "suave"]], y: [[0, 480], [DUR, 470, "suave"]]}},
        objetos: enLaPlataforma({torre: [[0, "Brazos puestos"], [8000, "Retirar brazo de tripulación", false]], gaviotas: 4, dur: DUR}),
        dialogos: [ctrl("This is Launch Control. All systems are go for mission Horizon-1.", 2000, 7800)],
        sonidos: [{sonido: "Viento y mar", t: 0, volumen: 0.6, bucle: true, fundido: {entrada: 1500, salida: 0}}, {sonido: "Vapor siseante", t: 0, volumen: 0.3, bucle: true}],
    });
}

// ---------------------------------------------------------------- 2. Cuenta regresiva (13 s): cabina, gorra, base de la plataforma
function escenaL2() {
    const DUR = 13000, T10 = 2000, T = (n) => T10 + (10 - n) * 1000, T_MOT = T(6) - 600;
    // posiciones utiles: cabina (orbitador en tanque + [52,-10]; ventanillas en ~[+44, -342]) y punta del tanque
    const CAB = [PADX + 52 + 44, TQY - 10 - 342], PUNTA = [PADX, TQY - 480], BASE = [PADX + 40, PADY - 60];
    return escenaL("2. Countdown", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 16, intensidad: 0.8}},
        camara: {tamano: [1280, 720], centro: CAB, zoom: 4,
            temblor: [{desde: T_MOT, hasta: DUR, amplitud: 2.5, entrada: 800, decae: false, paso: 33}],
            claves: {x: [[0, CAB[0]], [3400, CAB[0] - 6, "suave"], [3401, PUNTA[0] + 60], [5600, PUNTA[0] + 50, "suave"], [5601, BASE[0]], [DUR, BASE[0], "suave"]],
                y: [[0, CAB[1]], [3400, CAB[1], "suave"], [3401, PUNTA[1] + 20], [5600, PUNTA[1] + 10, "suave"], [5601, BASE[1]], [DUR, BASE[1] - 20, "suave"]],
                zoom: [[0, 4], [3400, 4.4, "suave"], [3401, 2.2], [5600, 2.4, "suave"], [5601, 1.6], [DUR, 1.75, "suave"]]}},
        objetos: enLaPlataforma({torre: [[0, "Solo gorra"], [3500, "Retirar gorra", false]],
            agua: [[0, "Apagada"], [1200, "Rociar", false], [1800, "Rociando"]], motores: [[0, "Apagado"], [T_MOT, "Arrancar", false], [T_MOT + 1400, "Encendido"]]})
            .concat([{instancia: "Vapor de arranque", nombre: "vapor_arranque", en: [PADX, PADY], plano: -3.8, bucle: false, desfase: T_MOT + 200}]),
        efectos: [{tipo: "particulas", nombre: "chispas", en: [PADX + 80, PADY - 50], inicio: T_MOT - 700, fin: T_MOT + 400, tasa: 60, vida: 700, velocidad: 220, angulo: 90, dispersion: 120,
            gravedad: 300, tam_ini: 3, tam_fin: 1, color_ini: "#fff6c0", color_fin: "#ff8a30", suave: "si", opacidad: 0.95, mezcla: "suma", sonido: "no_lleva"}],
        dialogos: [ctrl("T-minus ten… nine… eight… seven…", T(10), T(7) + 900, {velocidad: 9}), ctrl("Six… we have main engine start…", T(6), T(5) + 900, {velocidad: 22}),
            ctrl("Four… three… two… one…", T(4), DUR, {velocidad: 7})],
        sonidos: [{sonido: "Viento y mar", t: 0, volumen: 0.3, bucle: true}, {sonido: "Vapor siseante", t: 0, volumen: 0.28, bucle: true},
            ...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({sonido: "Pitido de cuenta", t: T(n), volumen: 0.35})),
            {sonido: "Agua de supresión", t: 1200, volumen: 0.5, bucle: true, fundido: {entrada: 600, salida: 0}}, {sonido: "Arranque de motores", t: T_MOT, volumen: 0.9}],
    });
}

// ---------------------------------------------------------------- 3. Ignicion y despegue (10 s): plano bajo y plano general
function escenaL3() {
    const DUR = 10000, T0 = 300, TD = 700, CORTE = 2600;
    const ty = [[0, TQY], [TD, TQY]];
    for (let t = TD + 100; t <= DUR; t += 100) ty.push([t, r2(TQY - sube((t - TD) / 1000)), "lineal"]);
    const camY = [[0, PADY - 40], [CORTE, PADY - 60, "suave"], [CORTE + 1, 430]];
    for (let t = CORTE + 500; t <= DUR; t += 500) camY.push([t, r2(Math.min(430, TQY - sube((t - TD) / 1000) - 60)), "suave"]);
    return escenaL("3. Ignition and liftoff", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 18, intensidad: 1}, claves: {brillo: [[0, 0], [T0 - 30, 0], [T0 + 80, 0.35, "lineal"], [T0 + 900, 0.05, "suave"], [DUR, 0.02]]}},
        camara: {tamano: [1280, 720], centro: [PADX - 60, PADY - 40], zoom: 2.4,
            temblor: [{desde: 0, hasta: T0, amplitud: 3, decae: false, paso: 33}, {desde: T0, hasta: CORTE + 2500, amplitud: 20, entrada: 150, decae: false, paso: 33}, {desde: CORTE + 2500, hasta: DUR, amplitud: 12, paso: 33}],
            claves: {x: [[0, PADX - 60], [CORTE, PADX - 40, "suave"], [CORTE + 1, PADX + 20], [DUR, PADX + 10, "suave"]], y: camY, zoom: [[0, 2.4], [CORTE, 2.1, "suave"], [CORTE + 1, 0.8], [DUR, 0.62, "suave"]]}},
        objetos: [...enLaPlataforma({torre: [[0, "Brazos retirados"]], agua: [[0, "Rociando"]], motores: [[0, "Encendido"]], cohetes: [[0, "Apagado"], [T0, "Encender", false], [T0 + 600, "Encendido"]], tanqueY: ty, vapor: false}),
            {instancia: "Nube de humo", nombre: "humo", en: [PADX, PADY], plano: -1, bucle: false, desfase: T0 + 50},
            ...estelaSuelo(TD, DUR)],
        dialogos: [ctrl("Zero, and booster ignition… and liftoff! Liftoff of Aurora, mission Horizon-1.", 200, DUR, {velocidad: 20})],
        sonidos: [{sonido: "Agua de supresión", t: 0, volumen: 0.4, bucle: true, recorte: [0, 3500], fundido: {entrada: 0, salida: 1500}}, {sonido: "Arranque de motores", t: 0, volumen: 0.5, recorte: [6000, 9000]},
            {sonido: "Ignición de cohetes", t: T0, volumen: 1}, {sonido: "Rugido del despegue", t: T0 + 1500, volumen: 0.9, bucle: true, fundido: {entrada: 900, salida: 0}}],
    });
}

// ---------------------------------------------------------------- cuadro de seguimiento (escenas 4 a 6): la pila queda en el centro y el mundo pasa
// La pila esta fija en P (con giro y vibracion); el cielo baja (se ve mas alto y oscuro); la estela queda atras.
const P = [640, 330];
function pilaVolando({rot = [[0, 0]], motores = true, cohetesFuego = true, conCohetes = true, extra = []} = {}) {
    return [
        {instancia: "Tanque externo", nombre: "tanque", en: P, plano: 0, claves: {rotacion: rot}},
        ...(conCohetes ? [{instancia: "Cohete lateral", nombre: "cohete_atras", en: [6, 50], padre: "tanque", plano: -0.5}, {instancia: "Cohete lateral", nombre: "cohete", en: [0, 50], padre: "tanque", plano: 1}] : []),
        ...(cohetesFuego ? [{instancia: "Llama de cohete", nombre: "llama_cohete", en: [0, 50], padre: "tanque", plano: 0.9, acciones: [[0, "Encendido"]]}] : []),
        {instancia: "Orbitador Aurora", nombre: "orbitador", en: [52, -10], padre: "tanque", plano: 0.5},
        ...(motores ? [[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: 0.4, acciones: [[0, "Encendido"]]})) : []),
        ...extra,
    ];
}
// estela en el cuadro de seguimiento: una bocanada cada `cada` ms en la tobera, que se va hacia abajo (y queda atras)
function estelaVuelo(dur, velIni, velFin, cada = 70, rot = 0, desde = 0, hasta = dur) {
    const r = [], a = rot * Math.PI / 180;
    for (let t0 = desde, k = 0; t0 < hasta; t0 += cada, k++) {
        const x = P[0] - Math.sin(a) * 170, y = P[1] + Math.cos(a) * 170, ys = [], xs = [];
        for (let t = t0; t <= Math.min(dur, t0 + 6000); t += 200) {
            const v = velIni + (velFin - velIni) * (t / dur), d = v * (t - t0);
            ys.push([t, r2(y + Math.cos(a) * d)], ); xs.push([t, r2(x - Math.sin(a) * d)]);
        }
        if (ys.length < 2) continue;
        r.push({instancia: "Bocanada de estela", nombre: `estela_${k}`, en: [r2(x), r2(y)], plano: -1, bucle: false, desfase: t0,
            claves: {x: xs.map(([t, v]) => [t, v, "lineal"]), y: ys.map(([t, v]) => [t, v, "lineal"])}});
    }
    return r;
}

// columna de humo continua detras de la pila (en el cuadro de seguimiento); origen en la tobera, baja
function columnaHumo() {
    const L = 1100, DUR = 2000;
    const borde = (s) => Array.from({length: 23}, (_, i) => { const u = i / 22; return [r2(s * (14 + 90 * Math.pow(u, 0.8))), r2(u * L)]; });
    return {tipo: "asset", nombre: "Columna de humo", duracion: DUR, marcas, partes: [
        {nombre: "columna", poligono: [...borde(-1), ...borde(1).reverse()], borde: TRANSP,
            degradado: lineal([0, 0], [0, L], [[0, "rgba(250,246,240,0.95)"], [0.35, "rgba(232,228,224,0.75)"], [1, "rgba(210,206,204,0)"]]),
            claves: {escala_x: ciclo(DUR, (u) => 1 + 0.06 * Math.sin(TAU * u * 2)), escala_y: [[0, 1]]}, bucle: "repetir"},
        {nombre: "nucleo", poligono: [...borde(-0.45), ...borde(0.45).reverse()], borde: TRANSP,
            degradado: lineal([0, 0], [0, L * 0.6], [[0, "rgba(255,255,255,0.9)"], [1, "rgba(255,255,255,0)"]])},
    ]};
}

// ---------------------------------------------------------------- 4. Torre despejada: el ascenso (14 s)
function escenaL4() {
    const DUR = 14000, T_CONO = 9200;
    // el cielo baja: se ve cada vez mas arriba (de celeste a azul oscuro); el suelo cae al principio
    const cieloY = [[0, 380], [DUR, 380 + 3600, "entrar"]];
    return escenaL("4. Tower clear: the climb", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 18, intensidad: 0.9}},
        camara: {tamano: [1280, 720], centro: P, zoom: 0.9, temblor: [{desde: 0, hasta: DUR, amplitud: 9, decae: true, paso: 33}], claves: {zoom: [[0, 0.95], [DUR, 0.75, "suave"]]}},
        objetos: [
            {instancia: "Cielo del amanecer", nombre: "cielo", en: [-460, 380], plano: -10, claves: {y: cieloY}},
            {instancia: "Mar y costa", nombre: "costa", en: [-460, 940], plano: -9, claves: {y: [[0, 940], [5000, 2600, "entrar"]]}},
            {instancia: "Plataforma de lanzamiento", nombre: "plataforma", en: [640, 1200], plano: -8, claves: {y: [[0, 1200], [3000, 2400, "entrar"]]}},
            {instancia: "Torre de servicio", nombre: "torre", en: [890, 1200], plano: -8, acciones: [[0, "Brazos retirados"]], claves: {y: [[0, 1200], [3000, 2400, "entrar"]]}},

            {instancia: "Columna de humo", nombre: "columna", en: [0, 230], padre: "tanque", plano: -0.8, claves: {opacidad: [[0, 0.4], [3000, 1, "suave"]]}},
            {instancia: "Cono de condensación", nombre: "cono", en: [40, -200], padre: "tanque", plano: 1.5, bucle: false, desfase: T_CONO},
            // giro de la pila (maniobra de rolido y cabeceo): se inclina hacia la derecha
            ...pilaVolando({rot: [[0, 0], [3500, 0], [9000, 22, "suave"], [DUR, 26, "suave"]]}),
        ],
        dialogos: [ctrl("Tower clear.", 400, 2800, {velocidad: 14}), ctrl("Aurora, go at throttle up.", 5200, 8400),
            {quien: "orbitador", texto: "Roger, go at throttle up.", desde: 8800, hasta: 12500, velocidad: 20}],
        sonidos: [{sonido: "Rugido del despegue", t: 0, volumen: 0.8, bucle: true, recorte: [0, 3000], fundido: {entrada: 0, salida: 2000}}, {sonido: "Rugido lejano", t: 1000, volumen: 0.75, bucle: true, fundido: {entrada: 1500, salida: 0}},
            {sonido: "Estampido sónico", t: T_CONO, volumen: 0.9}],
    });
}

// ---------------------------------------------------------------- 5. Separacion de cohetes (10 s)
function escenaL5() {
    const DUR = 10000, T_SRB = 3200, ROT = 28;
    const srb = (lado, x0) => {
        const x = [[0, x0], [T_SRB, x0]], y = [[0, 50], [T_SRB, 50]], rot = [[0, 0], [T_SRB, 0]], op = [[0, 1], [T_SRB, 1]];
        for (let t = T_SRB + 200; t <= DUR; t += 200) { const s = (t - T_SRB) / 1000;
            x.push([t, r2(x0 + lado * (40 * s + 8 * s * s)), "lineal"]); y.push([t, r2(50 + 60 * s * s), "lineal"]); rot.push([t, r2(lado * (14 * s + 5 * s * s)), "lineal"]); op.push([t, r2(Math.max(0, 1 - Math.max(0, s - 4.5) / 2)), "lineal"]); }
        return {x, y, rotacion: rot, opacidad: op};
    };
    return escenaL("5. Booster separation", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 18, intensidad: 0.9}},
        camara: {tamano: [1280, 720], centro: [P[0] + 40, P[1] + 10], zoom: 1.15, temblor: [{desde: 0, hasta: T_SRB, amplitud: 5, decae: false, paso: 33}, {desde: T_SRB, hasta: T_SRB + 600, amplitud: 10, paso: 33}],
            claves: {zoom: [[0, 1.15], [T_SRB, 1.2, "suave"], [DUR, 0.95, "suave"]]}},
        objetos: [
            {instancia: "Espacio profundo", nombre: "espacio", en: [640, 360], plano: -10},
            {instancia: "Tierra desde la altura", nombre: "tierra_alta", en: [560, 640], plano: -9, rotacion: -8, claves: {y: [[0, 640], [DUR, 700, "suave"]]}},
            ...estelaVuelo(DUR, 0.5, 0.6, 90, ROT, 0, T_SRB),
            {instancia: "Tanque externo", nombre: "tanque", en: P, plano: 0, rotacion: ROT},
            {instancia: "Cohete lateral", nombre: "cohete_atras", en: [6, 50], padre: "tanque", plano: -0.5, claves: srb(1, 6)},
            {instancia: "Cohete lateral", nombre: "cohete", en: [0, 50], padre: "tanque", plano: 1, claves: srb(-1, 0)},
            {instancia: "Llama de cohete", nombre: "llama_cohete", en: [0, 50], padre: "tanque", plano: 0.9, acciones: [[0, "Encendido"]], claves: {opacidad: [[0, 1], [T_SRB - 400, 1], [T_SRB, 0, "suave"]]}},
            {instancia: "Destello de separación", nombre: "destello_1", en: [-10, -380], padre: "tanque", plano: 2, bucle: false, desfase: T_SRB},
            {instancia: "Destello de separación", nombre: "destello_2", en: [-10, 30], padre: "tanque", plano: 2, bucle: false, desfase: T_SRB + 40},
            {instancia: "Orbitador Aurora", nombre: "orbitador", en: [52, -10], padre: "tanque", plano: 0.5},
            ...[[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: 0.4, acciones: [[0, "Encendido"]]})),
        ],
        dialogos: [ctrl("Booster separation confirmed. Aurora continues its climb.", 4400, DUR)],
        sonidos: [{sonido: "Rugido lejano", t: 0, volumen: 0.5, bucle: true, fundido: {entrada: 0, salida: 0}}, {sonido: "Separación de cohetes", t: T_SRB, volumen: 0.9}],
    });
}

// ---------------------------------------------------------------- 6. Separacion del tanque y espacio (10 s)
function escenaL6() {
    const DUR = 10000, T_MECO = 1800, T_ET = 4600, ROT = 34;
    return escenaL("6. Tank separation", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 18, intensidad: 0.9}},
        camara: {tamano: [1280, 720], centro: [P[0] + 60, P[1] - 30], zoom: 1, temblor: [{desde: 0, hasta: T_MECO, amplitud: 3, paso: 33}],
            claves: {zoom: [[0, 1], [DUR, 0.85, "suave"]], x: [[0, P[0] + 60], [T_ET, P[0] + 60], [DUR, P[0] + 150, "suave"]], y: [[0, P[1] - 30], [T_ET, P[1] - 30], [DUR, P[1] - 130, "suave"]]}},
        objetos: [
            {instancia: "Espacio profundo", nombre: "espacio", en: [640, 360], plano: -10},
            {instancia: "Tierra desde la altura", nombre: "tierra_alta", en: [560, 720], plano: -9, rotacion: -10, escala: 1.2},
            {instancia: "Tanque externo", nombre: "tanque", en: P, plano: 0, claves: {rotacion: [[0, ROT], [T_ET, ROT], [DUR, ROT + 18, "suave"]], x: [[0, P[0]], [T_ET, P[0]], [DUR, P[0] - 120, "entrar"]], y: [[0, P[1]], [T_ET, P[1]], [DUR, P[1] + 260, "entrar"]]}},
            // el orbitador: con el tanque hasta T_ET; despues se queda (el tanque cae y se aleja)
            {instancia: "Orbitador Aurora", nombre: "orbitador_suelto", en: [r2(P[0] + 52 * Math.cos(ROT * Math.PI / 180) + 10 * Math.sin(ROT * Math.PI / 180)), r2(P[1] + 52 * Math.sin(ROT * Math.PI / 180) - 10 * Math.cos(ROT * Math.PI / 180))], plano: 0.5, rotacion: ROT,
                claves: {opacidad: visible(T_ET, DUR, DUR), x: [[T_ET, r2(P[0] + 52 * Math.cos(ROT * Math.PI / 180) + 10 * Math.sin(ROT * Math.PI / 180))], [DUR, r2(P[0] + 52 * Math.cos(ROT * Math.PI / 180) + 10 * Math.sin(ROT * Math.PI / 180) + 40), "salir"]]}},
            {instancia: "Orbitador Aurora", nombre: "orbitador", en: [52, -10], padre: "tanque", plano: 0.5, claves: {opacidad: visible(0, T_ET, DUR)}},
            ...[[66, -12], [92, -12]].map(([x, y], i) => ({instancia: "Llama de motor principal", nombre: `llama_motor_${i}`, en: [x, y], padre: "tanque", plano: 0.4, acciones: [[0, "Encendido"]],
                claves: {opacidad: [[0, 1], [T_MECO, 1], [T_MECO + 400, 0, "suave"]]}})),
            {instancia: "Propulsores de maniobra", nombre: "rcs", en: [100, -340], padre: "tanque", plano: 1.6, acciones: [[0, "Quieto"], [T_ET - 200, "Soplos", false]], claves: {opacidad: visible(0, T_ET + 1600, DUR)}},
        ],
        dialogos: [ctrl("Main engine cutoff.", T_MECO + 200, T_MECO + 2500, {velocidad: 16}), ctrl("External tank separation.", T_ET + 300, DUR, {velocidad: 16})],
        sonidos: [{sonido: "Rugido lejano", t: 0, volumen: 0.35, bucle: true, recorte: [0, T_MECO + 600], fundido: {entrada: 0, salida: 700}},
            {sonido: "Separación de cohetes", t: T_ET, volumen: 0.35}, {sonido: "Propulsores", t: T_ET - 200, volumen: 0.6}],
    });
}

// ---------------------------------------------------------------- 7. Orbita (12 s)
function escenaL7() {
    const DUR = 12000;
    return escenaL("7. Orbit", DUR, {
        estilo: {resplandor: {umbral: 0.86, radio: 16, intensidad: 0.7}},
        camara: {tamano: [1280, 720], centro: [0, 200], zoom: 0.85, claves: {zoom: [[0, 0.85], [DUR, 1.05, "suave"]], x: [[0, 0], [DUR, 50, "suave"]], y: [[0, 200], [DUR, 170, "suave"]]}},
        objetos: [
            {instancia: "Espacio profundo", nombre: "espacio", en: [0, 0], plano: -10},
            {instancia: "Tierra desde la órbita", nombre: "tierra", en: [-200, 1100], plano: -9, desfase: 20000},
            {instancia: "Orbitador desde arriba", nombre: "orbitador_arriba", en: [40, 150], plano: 2, escala: 1.4, rotacion: -8, acciones: [[0, "Cerrada"], [1800, "Abrir", false], [5800, "Abierta"]],
                claves: {x: [[0, 40], [DUR, 80, "suave"]], y: [[0, 150], [DUR, 132, "suave"]]}},
            {instancia: "Satélite", nombre: "satelite", en: [50, 148], plano: 1.9, escala: 1.1, rotacion: -8, acciones: [[0, "Plegado"], [6500, "Desplegar", false], [8900, "Desplegado"]],
                claves: {x: [[0, 50], [DUR, 90, "suave"]], y: [[0, 148], [6000, 140, "suave"], [DUR, 70, "suave"]]}},
        ],
        dialogos: [
            {quien: "orbitador_arriba", texto: "Control, this is Aurora. We are in orbit. The view is incredible.", desde: 800, hasta: 5600, velocidad: 20},
            ctrl("Welcome to space, Aurora.", 6200, 9000),
            {texto: "MISSION HORIZON-1", desde: 9300, hasta: DUR, estilo: "narrador", velocidad: 0, voz: false},
        ],
        sonidos: [{sonido: "Servos de la bodega", t: 1800, volumen: 0.45}],
    });
}

const assets = [cielo(), marCosta(), torreAgua(), plataforma(), torreServicio(), tanque(), cohete(), orbitador(), gaviota(),
    vaporTanque(), llamaMotor(), llamaCohete(), aguaSupresion(),
    nube("Vapor de arranque", {n: 34, dur: 6000, alcance: 520, alto: 220, r: 36, tinte: [246, 246, 250], fuego: false, semilla: 2}),
    nube("Nube de humo", {n: 90, dur: 9000, alcance: 1000, alto: 460, r: 52, semilla: 3}), estela(),
    tierraAltura(), espacio(), conoCondensacion(), destelloSeparacion(), propulsores(), tierraOrbita(), orbitadorArriba(), satelite(), columnaHumo()];
assets.forEach((a, i) => fs.writeFileSync(path.join(DIR, `asset_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(a)));
fs.writeFileSync(path.join(DIR, "escena.json"), JSON.stringify(muestra(), null, 1));
fs.writeFileSync(path.join(DIR, "escena_ignicion.json"), JSON.stringify(pruebaIgnicion(), null, 1));
fs.writeFileSync(path.join(DIR, "escena_ascenso.json"), JSON.stringify(pruebaAscenso(), null, 1));
[escenaL1(), escenaL2(), escenaL3(), escenaL4(), escenaL5(), escenaL6(), escenaL7()].forEach((e, i) => fs.writeFileSync(path.join(DIR, `historia_${i + 1}.json`), JSON.stringify(e, null, 1)));
console.log(assets.map((a) => `${a.nombre}: ${a.duracion} ms`).join("\n"));
