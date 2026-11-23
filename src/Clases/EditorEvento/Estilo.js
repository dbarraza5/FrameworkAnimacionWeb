// Estilo de imagen de una escena (pruebas de arte, planeacion_pruebas_arte.md): un filtro que se aplica
// al cuadro ya dibujado (antes de los globos), en la vista previa, el MP4 y los renders.
//
//   escena.estilo = {
//     // --- tramado con paleta (fase 1: duotono) ---
//     paleta: ["#3a2440", "#f2b8c6"],   // de oscuro a claro, 2 o mas colores (duotono, tres tonos...)
//     tramado: "bayer4",                // "bayer2" | "bayer4" | "bayer8" | "ninguno" | "semitono"
//     pixel: 3,                         // tamano del pixel gordo, en pixeles de un video de 720 de ancho
//     contraste: 1, brillo: 0,          // ajuste de la luz antes de elegir el color (brillo de -1 a 1)
//     // --- semitono (fase 2: comic) ---
//     semitono: {celda: 7, angulo: 15, tinta: "#15121c", claro: 0.82, color: 0.95},
//     // --- lineas de grabado (fase 6: noir) ---
//     lineas: {celda: 6, angulo: 35, cruzado: true},   // con tramado: "lineas" y paleta [tinta, papel]
//     // --- contorno automatico (fase 2: comic) ---
//     contorno: {grosor: 2, color: "#111111", umbral: 60},
//     // --- resplandor (fase 3: neon) ---
//     resplandor: {umbral: 0.6, radio: 14, intensidad: 1.2},
//     // --- papel (fase 4: papel recortado) ---
//     papel: {intensidad: 0.1, fibras: 0.5, escala: 1},
//     // --- acuarela (fase 8) ---
//     acuarela: {desplazar: 3, escala: 18, velocidad: 0.3, lavado: 1.5, borde: 0.5, transparencia: 0.12},
//     // --- pantalla CRT (fase 9): va al final de todo ---
//     pantalla: {barrido: 0.3, curvatura: 0.1, aberracion: 1.5, ruido: 0.04, vineta: 0.4, parpadeo: 0.03},
//     // --- animar el estilo (fase 5: game boy) ---   (claves.estatica anima pantalla.ruido)
//     claves: {brillo: [[0, -0.3], [11000, 0.2, "suave"]], contraste: [...]},
//   }
//
// - Bayer: cada "pixel gordo" toma la luz media de su bloque; esa luz se reparte entre los colores de la
//   paleta y el umbral de la matriz de Bayer (fija a la pantalla) decide cual va.
// - "ninguno" con paleta: cada bloque toma el color de la paleta mas cercano en luz (tintas planas).
// - "semitono": como un comic impreso. Cada pixel conserva su color pero llevado a plena luz (la tinta
//   plana); la sombra se dibuja con PUNTOS de tinta en una grilla girada, mas grandes cuanto mas oscuro.
// - contorno: donde el color cambia de golpe (borde entre dos formas) se entinta una linea; los
//   degradados suaves no hacen borde. Se calcula sobre la imagen ORIGINAL y se dibuja al final.
// - acuarela: los bordes se corren con un ruido que cambia despacio (respiran), la pintura se funde
//   (lavado), el pigmento se acumula en los bordes de cada mancha y el papel se ve a traves.
// - papel: grano y fibras de papel (fijos a la pantalla) que oscurecen y aclaran apenas la imagen.
// - resplandor (bloom): lo luminoso se desenfoca y se suma encima (halo de neon). Va antes del tramado.
// Todos los tamanos van en pixeles de un video de 720 de ancho (se escalan con la salida).

// propiedades del estilo que se pueden animar con estilo.claves (t en ms de la escena)
export const ANIMABLES = ["brillo", "contraste", "estatica"];   // estatica: el ruido de estilo.pantalla
const SUAVE = (u) => u * u * (3 - 2 * u);
function valorClaves(lista, t) {
    const l = [...lista].map((k) => [Number(k[0]), Number(k[1]), k[2] || "lineal"]).sort((a, b) => a[0] - b[0]);
    if (t <= l[0][0]) return l[0][1];
    for (let i = 1; i < l.length; i++) if (t < l[i][0]) {
        const [t0, v0, interp] = l[i - 1], [t1, v1] = l[i], u = (t - t0) / ((t1 - t0) || 1);
        return interp === "mantener" ? v0 : v0 + (v1 - v0) * (interp === "suave" ? SUAVE(u) : u);
    }
    return l[l.length - 1][1];
}
// el estilo en el instante t (ms): aplica estilo.claves a sus propiedades
export function estiloEn(estilo, t) {
    if (!estilo || !estilo.claves) return estilo;
    const r = {...estilo};
    for (const prop of Object.keys(estilo.claves)) {
        if (!ANIMABLES.includes(prop) || !Array.isArray(estilo.claves[prop]) || !estilo.claves[prop].length) continue;
        const v = valorClaves(estilo.claves[prop], t);
        if (prop === "estatica") r.pantalla = {...(estilo.pantalla || {}), ruido: Math.max(0, Math.min(1, v))};
        else r[prop] = v;
    }
    return r;
}

export const TRAMADOS = ["bayer2", "bayer4", "bayer8", "ninguno", "semitono", "lineas"];

function matrizBayer(n) {
    let m = [[0]];
    while (m.length < n) {
        const k = m.length, r = Array.from({length: 2 * k}, () => new Array(2 * k));
        for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
            const v = 4 * m[y][x];
            r[y][x] = v; r[y][x + k] = v + 2; r[y + k][x] = v + 3; r[y + k][x + k] = v + 1;
        }
        m = r;
    }
    const total = n * n;
    return m.map((fila) => fila.map((v) => (v + 0.5) / total));   // umbrales en (0, 1)
}
const MATRICES = {bayer2: matrizBayer(2), bayer4: matrizBayer(4), bayer8: matrizBayer(8)};

export function colorRgb(c) {
    const s = String(c || "").trim();
    let m = s.match(/^#([0-9a-f]{3})$/i);
    if (m) return m[1].split("").map((h) => parseInt(h + h, 16));
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return [1, 2, 3].map((i) => Math.round(Number(m[i])));
    return null;
}

// Valida y completa un estilo. Devuelve {estilo, errores}.
export function normalizarEstilo(e) {
    const errores = [];
    if (!e || typeof e !== "object" || Array.isArray(e)) return {estilo: null, errores: ["estilo es {paleta?, tramado?, pixel?, contraste?, brillo?, semitono?, contorno?}"]};
    const num = (v, d) => (v === undefined ? d : Number(v));
    const hayPaleta = e.paleta !== undefined;
    const paleta = Array.isArray(e.paleta) ? e.paleta.map(colorRgb) : [];
    if (hayPaleta && (paleta.length < 2 || paleta.some((c) => !c))) errores.push("estilo.paleta: una lista de 2 o mas colores (#rrggbb), de oscuro a claro");
    const tramado = e.tramado === undefined ? (hayPaleta ? "bayer4" : "ninguno") : e.tramado;
    if (!TRAMADOS.includes(tramado)) errores.push(`estilo.tramado "${tramado}" desconocido (validos: ${TRAMADOS.join(", ")})`);
    else if ((tramado.startsWith("bayer") || tramado === "lineas") && !hayPaleta) errores.push(`estilo.tramado "${tramado}" necesita una paleta`);
    const pixel = num(e.pixel, 2), contraste = num(e.contraste, 1), brillo = num(e.brillo, 0);
    if (!(pixel >= 1 && pixel <= 32)) errores.push("estilo.pixel: de 1 a 32");
    if (!(contraste > 0 && contraste <= 5)) errores.push("estilo.contraste: mayor que 0 (1 = sin cambio)");
    if (!(brillo >= -1 && brillo <= 1)) errores.push("estilo.brillo: de -1 a 1");
    const r = {tramado, pixel, contraste, brillo};
    if (hayPaleta) r.paleta = e.paleta;
    if (tramado === "semitono" || e.semitono !== undefined) {
        const s = e.semitono || {};
        if (typeof s !== "object" || Array.isArray(s)) errores.push("estilo.semitono es {celda?, angulo?, tinta?, claro?, color?}");
        const st = {celda: num(s.celda, 7), angulo: num(s.angulo, 15), tinta: s.tinta || "#15121c", claro: num(s.claro, 0.82), color: num(s.color, 0.95)};
        if (!(st.celda >= 2 && st.celda <= 40)) errores.push("estilo.semitono.celda: de 2 a 40");
        if (!Number.isFinite(st.angulo)) errores.push("estilo.semitono.angulo: un numero (grados)");
        if (!colorRgb(st.tinta)) errores.push("estilo.semitono.tinta: un color (#rrggbb)");
        if (!(st.claro > 0 && st.claro <= 1)) errores.push("estilo.semitono.claro: de 0 a 1 (luz desde la que ya no hay puntos)");
        if (!(st.color > 0 && st.color <= 1)) errores.push("estilo.semitono.color: de 0 a 1 (luz de la tinta plana)");
        r.semitono = st;
    }
    if (tramado === "lineas" || e.lineas !== undefined) {
        const l = e.lineas || {};
        if (typeof l !== "object" || Array.isArray(l)) errores.push("estilo.lineas es {celda?, angulo?, cruzado?}");
        const ll = {celda: num(l.celda, 6), angulo: num(l.angulo, 35), cruzado: l.cruzado !== false};
        if (!(ll.celda >= 2 && ll.celda <= 40)) errores.push("estilo.lineas.celda: de 2 a 40 (separacion entre lineas)");
        if (!Number.isFinite(ll.angulo)) errores.push("estilo.lineas.angulo: un numero (grados)");
        r.lineas = ll;
    }
    if (e.contorno !== undefined) {
        const c = e.contorno || {};
        if (typeof c !== "object" || Array.isArray(c)) errores.push("estilo.contorno es {grosor?, color?, umbral?}");
        const ct = {grosor: num(c.grosor, 2), color: c.color || "#111111", umbral: num(c.umbral, 60)};
        if (!(ct.grosor >= 0.5 && ct.grosor <= 12)) errores.push("estilo.contorno.grosor: de 0.5 a 12");
        if (!colorRgb(ct.color)) errores.push("estilo.contorno.color: un color (#rrggbb)");
        if (!(ct.umbral >= 1 && ct.umbral <= 255)) errores.push("estilo.contorno.umbral: de 1 a 255 (cuanto tiene que cambiar el color para que haya borde)");
        r.contorno = ct;
    }
    if (e.resplandor !== undefined) {
        const s = e.resplandor || {};
        if (typeof s !== "object" || Array.isArray(s)) errores.push("estilo.resplandor es {umbral?, radio?, intensidad?}");
        const rs = {umbral: num(s.umbral, 0.6), radio: num(s.radio, 14), intensidad: num(s.intensidad, 1.2)};
        if (!(rs.umbral >= 0 && rs.umbral < 1)) errores.push("estilo.resplandor.umbral: de 0 a 1 (luz desde la que brilla)");
        if (!(rs.radio >= 1 && rs.radio <= 120)) errores.push("estilo.resplandor.radio: de 1 a 120");
        if (!(rs.intensidad > 0 && rs.intensidad <= 6)) errores.push("estilo.resplandor.intensidad: mayor que 0");
        r.resplandor = rs;
    }
    if (e.papel !== undefined) {
        const p = e.papel || {};
        if (typeof p !== "object" || Array.isArray(p)) errores.push("estilo.papel es {intensidad?, fibras?, escala?}");
        const pp = {intensidad: num(p.intensidad, 0.1), fibras: num(p.fibras, 0.5), escala: num(p.escala, 1)};
        if (!(pp.intensidad >= 0 && pp.intensidad <= 1)) errores.push("estilo.papel.intensidad: de 0 a 1");
        if (!(pp.fibras >= 0 && pp.fibras <= 1)) errores.push("estilo.papel.fibras: de 0 a 1");
        if (!(pp.escala > 0 && pp.escala <= 8)) errores.push("estilo.papel.escala: mayor que 0");
        r.papel = pp;
    }
    if (e.acuarela !== undefined) {
        const a = e.acuarela || {};
        if (typeof a !== "object" || Array.isArray(a)) errores.push("estilo.acuarela es {desplazar?, escala?, velocidad?, lavado?, borde?, transparencia?}");
        const ac = {desplazar: num(a.desplazar, 3), escala: num(a.escala, 18), velocidad: num(a.velocidad, 0.3), lavado: num(a.lavado, 1.5), borde: num(a.borde, 0.5), transparencia: num(a.transparencia, 0.12)};
        if (!(ac.desplazar >= 0 && ac.desplazar <= 30)) errores.push("estilo.acuarela.desplazar: de 0 a 30 (cuanto se corren los bordes)");
        if (!(ac.escala >= 2 && ac.escala <= 200)) errores.push("estilo.acuarela.escala: de 2 a 200 (tamano de las ondulaciones)");
        if (!(ac.velocidad >= 0 && ac.velocidad <= 5)) errores.push("estilo.acuarela.velocidad: de 0 a 5 (que tan rapido respiran los bordes)");
        if (!(ac.lavado >= 0 && ac.lavado <= 10)) errores.push("estilo.acuarela.lavado: de 0 a 10 (desenfoque de la pintura mojada)");
        if (!(ac.borde >= 0 && ac.borde <= 1)) errores.push("estilo.acuarela.borde: de 0 a 1 (pigmento acumulado en los bordes)");
        if (!(ac.transparencia >= 0 && ac.transparencia <= 0.8)) errores.push("estilo.acuarela.transparencia: de 0 a 0.8 (cuanto se ve el papel a traves)");
        r.acuarela = ac;
    }
    if (e.pantalla !== undefined) {
        const p = e.pantalla || {};
        if (typeof p !== "object" || Array.isArray(p)) errores.push("estilo.pantalla es {barrido?, curvatura?, aberracion?, ruido?, vineta?, parpadeo?}");
        const pp = {barrido: num(p.barrido, 0.3), curvatura: num(p.curvatura, 0.1), aberracion: num(p.aberracion, 1.5), ruido: num(p.ruido, 0.04), vineta: num(p.vineta, 0.4), parpadeo: num(p.parpadeo, 0.03)};
        for (const [k, max] of [["barrido", 1], ["curvatura", 0.5], ["aberracion", 12], ["ruido", 1], ["vineta", 1], ["parpadeo", 0.5]])
            if (!(pp[k] >= 0 && pp[k] <= max)) errores.push(`estilo.pantalla.${k}: de 0 a ${max}`);
        r.pantalla = pp;
    }
    if (e.claves !== undefined) {
        const cl = e.claves || {};
        if (typeof cl !== "object" || Array.isArray(cl)) errores.push("estilo.claves es {brillo?|contraste?: [[t, v, interp?]...]}");
        else for (const prop of Object.keys(cl)) {
            if (!ANIMABLES.includes(prop)) { errores.push(`estilo.claves.${prop}: solo se animan ${ANIMABLES.join(", ")}`); continue; }
            const l = cl[prop];
            if (!Array.isArray(l) || !l.length || l.some((k) => !Array.isArray(k) || !Number.isFinite(Number(k[0])) || !Number.isFinite(Number(k[1])))) errores.push(`estilo.claves.${prop}: una lista de [t (ms), valor, interp?]`);
        }
        r.claves = cl;
    }
    return {estilo: errores.length ? null : r, errores};
}

const luz = (d, i) => (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;

// ---- textura de papel: ruido de valor (grano) + ruido estirado (fibras), fijo a la pantalla ----
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function ruidoValor(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hash2(x0, y0), b = hash2(x0 + 1, y0), c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}
const CACHE_PAPEL = new Map();
// mapa de -1..1 (w x h) con el grano y las fibras del papel; se guarda por tamano
export function mapaPapel(w, h, {fibras, escala}, unidad = 1) {
    const clave = `${w}x${h}:${fibras}:${escala}:${unidad}`;
    if (CACHE_PAPEL.has(clave)) return CACHE_PAPEL.get(clave);
    const m = new Float32Array(w * h), s = escala * unidad;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const u = x / s, v = y / s;
        const grano = ruidoValor(u / 3, v / 3) * 0.5 + ruidoValor(u / 1.2, v / 1.2) * 0.35 + hash2(x, y) * 0.15;
        const fibra = ruidoValor(u / 40, v / 2.2);                     // estirado en x: hebras horizontales
        const f = Math.abs(fibra - 0.5) < 0.04 ? 1 : 0;              // hebras finas
        m[y * w + x] = (grano - 0.5) * 2 * (1 - fibras * 0.5) - f * fibras * 0.9;
    }
    if (CACHE_PAPEL.size > 6) CACHE_PAPEL.clear();
    CACHE_PAPEL.set(clave, m);
    return m;
}

// ---- acuarela: bordes que respiran (desplazamiento por ruido), lavado, pigmento en los bordes, papel ----
// d se modifica en el lugar; t: ms de la escena (hace "respirar" los bordes)
export function acuarela(d, w, h, ac, escala, t = 0) {
    const N = w * h;
    // 1) desplazamiento: cada pixel toma el color de un vecino corrido por un ruido suave que cambia con el tiempo
    if (ac.desplazar > 0) {
        const src = new Uint8ClampedArray(d), amp = ac.desplazar * escala, s = ac.escala * escala, fase = t / 1000 * ac.velocidad;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const dx = (ruidoValor(x / s + fase, y / s) - 0.5) * 2 * amp, dy = (ruidoValor(x / s + 37.1, y / s - fase) - 0.5) * 2 * amp;
            const sx = Math.min(w - 1, Math.max(0, Math.round(x + dx))), sy = Math.min(h - 1, Math.max(0, Math.round(y + dy)));
            const i = (y * w + x) * 4, j = (sy * w + sx) * 4;
            d[i] = src[j]; d[i + 1] = src[j + 1]; d[i + 2] = src[j + 2];
        }
    }
    // 2) lavado: desenfoque leve (la pintura mojada funde los colores)
    const r = Math.round(ac.lavado * escala);
    if (r >= 1) {
        const f = new Float32Array(N * 3);
        for (let k = 0, i = 0; k < N; k++, i += 4) { f[k * 3] = d[i]; f[k * 3 + 1] = d[i + 1]; f[k * 3 + 2] = d[i + 2]; }
        const b = cajaBlur(cajaBlur(f, w, h, r), w, h, r);
        for (let k = 0, i = 0; k < N; k++, i += 4) { d[i] = b[k * 3]; d[i + 1] = b[k * 3 + 1]; d[i + 2] = b[k * 3 + 2]; }
    }
    // 3) pigmento en los bordes: donde el color cambia, se oscurece (de los dos lados), suavizado
    if (ac.borde > 0) {
        const m = new Float32Array(N * 3);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4, ir = x + 1 < w ? i + 4 : i, id = y + 1 < h ? i + w * 4 : i;
            const dif = Math.max(Math.abs(d[i] - d[ir]) + Math.abs(d[i + 1] - d[ir + 1]) + Math.abs(d[i + 2] - d[ir + 2]),
                Math.abs(d[i] - d[id]) + Math.abs(d[i + 1] - d[id + 1]) + Math.abs(d[i + 2] - d[id + 2])) / 3;
            m[(y * w + x) * 3] = Math.min(1, dif / 40);
        }
        const rb = Math.max(1, Math.round(1.5 * escala)), mb = cajaBlur(m, w, h, rb);
        for (let k = 0, i = 0; k < N; k++, i += 4) {
            const o = 1 - Math.min(0.6, mb[k * 3] * ac.borde * 2.2);
            d[i] *= o; d[i + 1] *= o; d[i + 2] *= o;
        }
    }
    // 4) transparencia: se mezcla con el papel (los colores de acuarela dejan ver el blanco)
    if (ac.transparencia > 0) {
        const a = ac.transparencia;
        for (let i = 0; i < N * 4; i += 4) { d[i] = d[i] * (1 - a) + 250 * a; d[i + 1] = d[i + 1] * (1 - a) + 246 * a; d[i + 2] = d[i + 2] * (1 - a) + 236 * a; }
    }
}

// ---- pantalla CRT: curvatura del tubo, colores corridos, barrido, estatica (con cortes de linea), vineta, parpadeo ----
export function pantalla(d, w, h, p, escala, t = 0) {
    const src = new Uint8ClampedArray(d), k = p.curvatura, ab = p.aberracion * escala, cuadro = Math.floor(t / 33);
    const per = Math.max(2, Math.round(3 * escala)), brillo = 1 - p.parpadeo * (0.5 + 0.5 * Math.sin(t / 1000 * TAU_ * 7.3));
    // cortes horizontales cuando hay mucha estatica: algunas franjas se corren
    const corte = (y) => (p.ruido > 0.25 && hash2(Math.floor(y / (8 * escala)), cuadro) < p.ruido * 0.35 ? (hash2(cuadro, Math.floor(y / (8 * escala)) + 9) - 0.5) * 80 * escala * p.ruido : 0);
    const muestra = (x, y, c) => { const xi = Math.round(x), yi = Math.round(y); if (xi < 0 || yi < 0 || xi >= w || yi >= h) return 0; return src[(yi * w + xi) * 4 + c]; };
    for (let y = 0; y < h; y++) {
        const dx = corte(y), linea = 1 - p.barrido * (((y % per) / per) < 0.5 ? 0 : 1);
        for (let x = 0; x < w; x++) {
            // curvatura (barril): de pantalla a imagen
            const nx = (x / w) * 2 - 1, ny = (y / h) * 2 - 1, r2_ = nx * nx + ny * ny, f = 1 + k * r2_;
            const sx = ((nx * f + 1) / 2) * w + dx, sy = ((ny * f + 1) / 2) * h;
            const i = (y * w + x) * 4;
            if (Math.abs(nx * f) > 1 || Math.abs(ny * f) > 1) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
            let rr = muestra(sx + ab, sy, 0), gg = muestra(sx, sy, 1), bb = muestra(sx - ab, sy, 2);
            // estatica
            if (p.ruido > 0) { const n = (hash2(x + cuadro * 131, y + cuadro * 71) - 0.5) * 255 * p.ruido * 1.6; rr = rr * (1 - p.ruido * 0.6) + n + 128 * p.ruido * 0.6; gg = gg * (1 - p.ruido * 0.6) + n + 128 * p.ruido * 0.6; bb = bb * (1 - p.ruido * 0.6) + n + 128 * p.ruido * 0.6; }
            // vineta
            const v = 1 - p.vineta * Math.pow(Math.min(1, r2_ / 2), 1.5) * 1.2;
            const m = linea * brillo * Math.max(0, v);
            d[i] = Math.min(255, Math.max(0, rr * m)); d[i + 1] = Math.min(255, Math.max(0, gg * m)); d[i + 2] = Math.min(255, Math.max(0, bb * m)); d[i + 3] = 255;
        }
    }
}
const TAU_ = Math.PI * 2;

// desenfoque de caja (una pasada horizontal y una vertical) sobre 3 canales en Float32Array
function cajaBlur(src, w, h, r) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), n = 2 * r + 1;
    for (let y = 0; y < h; y++) for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += src[(y * w + Math.min(w - 1, Math.max(0, k))) * 3 + c];
        for (let x = 0; x < w; x++) {
            tmp[(y * w + x) * 3 + c] = s / n;
            s += src[(y * w + Math.min(w - 1, x + r + 1)) * 3 + c] - src[(y * w + Math.max(0, x - r)) * 3 + c];
        }
    }
    for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += tmp[(Math.min(h - 1, Math.max(0, k)) * w + x) * 3 + c];
        for (let y = 0; y < h; y++) {
            out[(y * w + x) * 3 + c] = s / n;
            s += tmp[(Math.min(h - 1, y + r + 1) * w + x) * 3 + c] - tmp[(Math.max(0, y - r) * w + x) * 3 + c];
        }
    }
    return out;
}

// Resplandor (bloom): lo que pasa de `umbral` de luz se toma con su color, se reduce, se desenfoca
// (tres pasadas de caja ~ gaussiano) y se SUMA encima de la imagen: los neones y las luces brillan.
export function resplandor(d, w, h, {umbral, radio, intensidad}) {
    const f = Math.max(1, Math.round(radio / 4)), W = Math.ceil(w / f), H = Math.ceil(h / f);
    const chico = new Float32Array(W * H * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, l = luz(d, i);
        if (l <= umbral) continue;
        const k = (l - umbral) / (1 - umbral), j = (Math.floor(y / f) * W + Math.floor(x / f));
        chico[j * 3] += d[i] * k; chico[j * 3 + 1] += d[i + 1] * k; chico[j * 3 + 2] += d[i + 2] * k;
    }
    const area = f * f;
    for (let j = 0; j < chico.length; j++) chico[j] /= area;
    const r = Math.max(1, Math.round(radio / f / 2));
    let b = cajaBlur(chico, W, H, r); b = cajaBlur(b, W, H, r); b = cajaBlur(b, W, H, r);
    // sumar (interpolando el buffer chico)
    for (let y = 0; y < h; y++) {
        const fy = Math.min(H - 1, Math.max(0, (y + 0.5) / f - 0.5)), y0 = Math.floor(fy), y1 = Math.min(H - 1, y0 + 1), ty = fy - y0;
        for (let x = 0; x < w; x++) {
            const fx = Math.min(W - 1, Math.max(0, (x + 0.5) / f - 0.5)), x0 = Math.floor(fx), x1 = Math.min(W - 1, x0 + 1), tx = fx - x0;
            const i = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
                const v = (b[(y0 * W + x0) * 3 + c] * (1 - tx) + b[(y0 * W + x1) * 3 + c] * tx) * (1 - ty) + (b[(y1 * W + x0) * 3 + c] * (1 - tx) + b[(y1 * W + x1) * 3 + c] * tx) * ty;
                d[i + c] = Math.min(255, d[i + c] + v * intensidad);
            }
        }
    }
}

// Mascara de bordes (1 = borde) sobre la imagen original: cambio fuerte de color con el vecino de la
// derecha o de abajo, engrosado a `grosor` pixeles.
export function mascaraContorno(d, w, h, umbral, grosor) {
    const borde = new Uint8Array(w * h);
    const dif = (i, j) => Math.max(Math.abs(d[i] - d[j]), Math.abs(d[i + 1] - d[j + 1]), Math.abs(d[i + 2] - d[j + 2]));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if ((x + 1 < w && dif(i, i + 4) >= umbral) || (y + 1 < h && dif(i, i + w * 4) >= umbral)) borde[y * w + x] = 1;
    }
    const r = Math.max(0, Math.round(grosor) - 1);
    if (!r) return borde;
    // engrosar: maximo en un cuadrado de (2r+1) (separable: filas y despues columnas)
    const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
    const a = Math.floor(r / 2), b = r - a;   // el trazo crece hacia los dos lados
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = 0; for (let k = -a; k <= b && !v; k++) { const xx = x - k; if (xx >= 0 && xx < w) v = borde[y * w + xx]; }
        tmp[y * w + x] = v;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = 0; for (let k = -a; k <= b && !v; k++) { const yy = y - k; if (yy >= 0 && yy < h) v = tmp[yy * w + x]; }
        out[y * w + x] = v;
    }
    return out;
}

function tramarBayer(d, w, h, e, p) {
    const pal = e.paleta.map(colorRgb), n = pal.length - 1;
    const mat = MATRICES[e.tramado] || null, tm = mat ? mat.length : 1;
    for (let by = 0; by < h; by += p) {
        for (let bx = 0; bx < w; bx += p) {
            let s = 0, c = 0;
            const x1 = Math.min(w, bx + p), y1 = Math.min(h, by + p);
            for (let yy = by; yy < y1; yy++) for (let xx = bx; xx < x1; xx++) { s += luz(d, (yy * w + xx) * 4); c++; }
            let l = s / c;
            l = Math.max(0, Math.min(1, (l - 0.5) * e.contraste + 0.5 + e.brillo));
            const v = l * n, base = Math.min(n - 1, Math.floor(v)), f = v - base;
            const umbral = mat ? mat[(by / p) % tm][(bx / p) % tm] : 0.5;
            const col = pal[f > umbral ? base + 1 : base];
            for (let yy = by; yy < y1; yy++) for (let xx = bx; xx < x1; xx++) {
                const i = (yy * w + xx) * 4;
                d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
            }
        }
    }
}

// Lineas (grabado): lineas paralelas de tinta cuyo grosor crece con la sombra; si "cruzado", en lo muy
// oscuro se suma una segunda familia perpendicular. Paleta: [tinta, papel] (o mas colores: oscuro -> claro).
function tramarLineas(d, w, h, e, escala) {
    const pal = e.paleta.map(colorRgb), tinta = pal[0], papel = pal[pal.length - 1];
    const L = e.lineas, P = Math.max(2, L.celda * escala), a = L.angulo * Math.PI / 180;
    const c1 = Math.cos(a) / P, s1 = Math.sin(a) / P, c2 = Math.cos(a + Math.PI / 2) / P, s2 = Math.sin(a + Math.PI / 2) / P;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let l = luz(d, i);
        l = Math.max(0, Math.min(1, (l - 0.5) * e.contraste + 0.5 + e.brillo));
        const oscuro = 1 - l;
        let u = (x * c1 + y * s1) % 1; if (u < 0) u += 1;
        let ink = Math.abs(u - 0.5) * 2 < oscuro * 1.15 - 0.05;
        if (!ink && L.cruzado && oscuro > 0.55) {
            let v = (x * c2 + y * s2) % 1; if (v < 0) v += 1;
            ink = Math.abs(v - 0.5) * 2 < (oscuro - 0.55) * 2;
        }
        const col = ink ? tinta : papel;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
}

// Semitono: tinta plana (el color llevado a plena luz) + puntos de tinta en una grilla girada.
// Devuelve la lista de puntos [x, y, radio] (en pixeles de la region) para dibujarlos con el ctx.
function semitono(d, w, h, e, escala) {
    const st = e.semitono, celda = Math.max(2, st.celda * escala), ang = st.angulo * Math.PI / 180;
    const luces = new Float32Array(w * h);
    for (let k = 0, i = 0; k < w * h; k++, i += 4) {
        let l = luz(d, i);
        l = Math.max(0, Math.min(1, (l - 0.5) * e.contraste + 0.5 + e.brillo));
        luces[k] = l;
        // tinta plana: mismo tono, llevado a la luz `color` (los oscuros profundos quedan oscuros: los tapa la tinta)
        const m = Math.max(d[i], d[i + 1], d[i + 2], 1), f = Math.min(4, (255 * st.color) / m);
        d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f); d[i + 3] = 255;
    }
    const cos = Math.cos(ang), sin = Math.sin(ang), puntos = [];
    // grilla girada que cubre la region: centros (u, v) en el sistema girado
    const diag = Math.hypot(w, h), n = Math.ceil(diag / celda) + 2, cx = w / 2, cy = h / 2;
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const u = i * celda, v = j * celda;
        const x = cx + u * cos - v * sin, y = cy + u * sin + v * cos;
        if (x < -celda || y < -celda || x > w + celda || y > h + celda) continue;
        const xi = Math.min(w - 1, Math.max(0, Math.round(x))), yi = Math.min(h - 1, Math.max(0, Math.round(y)));
        const l = luces[yi * w + xi];
        const oscuro = Math.max(0, Math.min(1, (st.claro - l) / st.claro));
        if (oscuro <= 0.02) continue;
        // area del punto proporcional a lo oscuro; a 0.785 de oscuridad los puntos se tocan
        puntos.push([x, y, celda * Math.sqrt(oscuro / Math.PI) * 1.05]);
    }
    return puntos;
}

// Aplica el estilo a una region (x, y, w, h) del canvas, en pixeles del canvas. `ancho_ref`: ancho del
// video al que se refieren los tamanos (720 por defecto).
export function aplicarEstilo(ctx, estilo, x = 0, y = 0, w = ctx.canvas.width, h = ctx.canvas.height, ancho_ref = 720, t = 0) {
    const {estilo: e} = normalizarEstilo(estilo);
    if (!e || w <= 0 || h <= 0) return false;
    x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
    w = Math.min(ctx.canvas.width - x, Math.round(w)); h = Math.min(ctx.canvas.height - y, Math.round(h));
    if (w <= 0 || h <= 0) return false;
    const escala = w / ancho_ref;
    const img = ctx.getImageData(x, y, w, h), d = img.data;
    const borde = e.contorno ? mascaraContorno(d, w, h, e.contorno.umbral, Math.max(1, e.contorno.grosor * escala)) : null;
    if (e.acuarela) acuarela(d, w, h, e.acuarela, escala, t);
    if (e.resplandor) resplandor(d, w, h, {...e.resplandor, radio: Math.max(1, e.resplandor.radio * escala)});
    if (e.papel && e.papel.intensidad > 0) {
        const m = mapaPapel(w, h, e.papel, escala), k = e.papel.intensidad;
        for (let j = 0, i = 0; j < w * h; j++, i += 4) { const f = 1 + m[j] * k; d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f); }
    }
    let puntos = null;
    if (e.tramado === "semitono") puntos = semitono(d, w, h, e, escala);
    else if (e.tramado === "lineas") tramarLineas(d, w, h, e, escala);
    else if (e.paleta) tramarBayer(d, w, h, e, Math.max(1, Math.round(e.pixel * escala)));
    if (borde && !puntos) {
        const c = colorRgb(e.contorno.color);
        for (let k = 0, i = 0; k < w * h; k++, i += 4) if (borde[k]) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
    }
    if (e.pantalla && !puntos) pantalla(d, w, h, e.pantalla, escala, t);
    ctx.putImageData(img, x, y);
    if (puntos) {
        // los puntos se dibujan con el ctx (circulos suaves), recortados a la region; el contorno va encima
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.fillStyle = e.semitono.tinta;
        ctx.beginPath();
        for (const [px, py, r] of puntos) { ctx.moveTo(x + px + r, y + py); ctx.arc(x + px, y + py, r, 0, Math.PI * 2); }
        ctx.fill();
        ctx.restore();
        if (borde) {
            const img2 = ctx.getImageData(x, y, w, h), d2 = img2.data, c = colorRgb(e.contorno.color);
            for (let k = 0, i = 0; k < w * h; k++, i += 4) if (borde[k]) { d2[i] = c[0]; d2[i + 1] = c[1]; d2[i + 2] = c[2]; d2[i + 3] = 255; }
            ctx.putImageData(img2, x, y);
        }
    }
    return true;
}
