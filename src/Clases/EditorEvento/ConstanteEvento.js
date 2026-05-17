export const MODALIDAD_EVENTOS = 1;
export const MODALIDAD_MOVIMIENTOS = 2;
export const MODALIDAD_MACRO = 3;
export const MODALIDAD_GRUPOS = 4;
export const MODALIDAD_SCRIPT = 5;
export const MODALIDAD_CONFIG = 6;


export const TITULO_MODALIDAD_EVENTOS = "eventos";
export const TITULO_MODALIDAD_MOVIMIENTOS = "movimientos";
export const TITULO_MODALIDAD_MACRO = "macro";
export const TITULO_MODALIDAD_GRUPOS = "grupos";
export const TITULO_MODALIDAD_SCRIPT = "script";
export const TITULO_MODALIDAD_CONFIG = "config";


export const ARRAY_TITULOS_MODALIDAD = {
    [MODALIDAD_EVENTOS]: TITULO_MODALIDAD_EVENTOS,
    [MODALIDAD_MOVIMIENTOS]: TITULO_MODALIDAD_MOVIMIENTOS,
    [MODALIDAD_MACRO]: TITULO_MODALIDAD_MACRO,
    [MODALIDAD_GRUPOS]: TITULO_MODALIDAD_GRUPOS,
    [MODALIDAD_SCRIPT]: TITULO_MODALIDAD_SCRIPT,
    [MODALIDAD_CONFIG]: TITULO_MODALIDAD_CONFIG,
};


export const EVENTO_KEY_EVENTOS = "Digit0";
export const EVENTO_KEY_MOVIMIENTOS = "Digit1";
export const EVENTO_KEY_MACRO = "Digit2";
export const EVENTO_KEY_GRUPOS = "Digit3";
export const EVENTO_KEY_SCRIPT = "Digit4";
export const EVENTO_KEY_CONFIG = "Digit5";


export const ARRAY_EVENTO_KEY_MODALIDAD = [EVENTO_KEY_EVENTOS, EVENTO_KEY_MOVIMIENTOS, EVENTO_KEY_MACRO,
    EVENTO_KEY_GRUPOS, EVENTO_KEY_SCRIPT, EVENTO_KEY_CONFIG
];


export const ARRAY_EVENTO_TIPO_MODALIDAD = {
    [EVENTO_KEY_EVENTOS]: EVENTO_KEY_EVENTOS,
    [EVENTO_KEY_MOVIMIENTOS]: EVENTO_KEY_MOVIMIENTOS,
    [EVENTO_KEY_MACRO]: EVENTO_KEY_MACRO,
    [EVENTO_KEY_GRUPOS]: EVENTO_KEY_GRUPOS,
    [EVENTO_KEY_SCRIPT]: EVENTO_KEY_SCRIPT,
    [EVENTO_KEY_CONFIG]: EVENTO_KEY_CONFIG,
};

export const TRABAJO_NADA_LIENZO = 0;
export const TRABAJO_MOVER_LIENZO = 1;
export const TRABAJO_AUMENTO_LIENZO = 2;
export const TRABAJO_REDUCCION_LIENZO = 3;
export const TRABAJO_POSICIONAR_MACRO = 4;

export const ARRAY_TITULO_TRABAJO = {
    [TRABAJO_NADA_LIENZO]: "nada",
    [TRABAJO_MOVER_LIENZO]: "mover lienzo",
    [TRABAJO_AUMENTO_LIENZO]: "aumento lienzo",
    [TRABAJO_REDUCCION_LIENZO]: "reduc lienzo",
    [TRABAJO_POSICIONAR_MACRO]: "pos macro",
};


// ===============================
// TIPOS DE MOVIMIENTO
// ===============================
export const MOV_RECTILINEO_UNIFORME = 1;
export const MOV_RECTILINEO_ACELERADO = 2;
export const MOV_RECTILINEO_2D = 3;
export const MOV_CIRCULAR = 4;
export const MOV_OSCILATORIO = 5;
export const MOV_LERP = 6;
export const MOV_GRAVEDAD = 7;
export const MOV_PARABOLICO_ANGULO = 8;

export const MOV_ROTACION = 9;
export const MOV_ZOOM = 10;

export const TIPO_EFECTO_MOV_OBJETOS = 1;
export const TIPO_EFECTO_MOV_FIGURAS = 2;

export const MOVIMIENTOS_OBJETOS = {
    [MOV_RECTILINEO_UNIFORME]: "Movimiento Rectilíneo Uniforme (MRU)",
    [MOV_RECTILINEO_ACELERADO]: "Movimiento Rectilíneo Acelerado (MRUA)",
    [MOV_RECTILINEO_2D]: "Movimiento Rectilíneo 2D",
    [MOV_CIRCULAR]: "Movimiento Circular",
    [MOV_OSCILATORIO]: "Movimiento Oscilatorio",
    [MOV_LERP]: "Interpolación Lineal (LERP)",
    [MOV_GRAVEDAD]: "Gravedad",
    [MOV_PARABOLICO_ANGULO]: "Parabólico con Ángulo"
};


export const MOVIMIENTOS_OBJETOS_CORTOS = {
    [MOV_RECTILINEO_UNIFORME]: "MRU",
    [MOV_RECTILINEO_ACELERADO]: "MRUA",
    [MOV_RECTILINEO_2D]: "2D",
    [MOV_CIRCULAR]: "Circ",
    [MOV_OSCILATORIO]: "Osc",
    [MOV_LERP]: "LERP",
    [MOV_GRAVEDAD]: "Grav",
    [MOV_PARABOLICO_ANGULO]: "Parab"
};

export const MOVIMIENTOS_FIGURAS = {
    [MOV_ROTACION]: "Movimiento Rotacion",
    [MOV_ZOOM]: "Movimiento Zoom",
};

export const MOVIMIENTOS_FIGURAS_CORTOS = {
    [MOV_ROTACION]: "Rot",
    [MOV_ZOOM]: "Zoom"
};