export const TRABAJO_NONE = -1
export const TRABAJO_FIGURA = 0;
export const TRABAJO_LISTA_FIGURAS = 1;
export const TRABAJO_GRUPOS = 2;
export const TRABAJO_PINTADO_GRUPO = 3;
export const TRABAJO_CONFIG_LIENZO_ATRIBUTOS = 4;
export const TRABAJO_CONFIG_LIENZO_IMAGENES = 5;
export const TRABAJO_EDICION_FIGURAS = [TRABAJO_FIGURA, TRABAJO_LISTA_FIGURAS, TRABAJO_GRUPOS]

export const TITULO_TRABAJO_NONE = "ninguno";
export const TITULO_TRABAJO_FIGURA = "figura";
export const TITULO_TRABAJO_LISTA_FIGURAS = "lista figuras";
export const TITULO_TRABAJO_GRUPOS = "grupos";
export const TITULO_TRABAJO_PINTADO_GRUPO = "pintado";
export const TITULO_TRABAJO_CONFIG_LIENZO_ATRIBUTOS = "atributos lienzo";
export const TITULO_TRABAJO_CONFIG_LIENZO_IMAGENES = "imágenes lienzo";

export const ARRAY_TITULOS_TRABAJOS = {
    [TRABAJO_NONE]: TITULO_TRABAJO_NONE,
    [TRABAJO_FIGURA]: TITULO_TRABAJO_FIGURA,
    [TRABAJO_LISTA_FIGURAS]: TITULO_TRABAJO_LISTA_FIGURAS,
    [TRABAJO_GRUPOS]: TITULO_TRABAJO_GRUPOS,
    [TRABAJO_PINTADO_GRUPO]: TITULO_TRABAJO_PINTADO_GRUPO,
    [TRABAJO_CONFIG_LIENZO_ATRIBUTOS]: TITULO_TRABAJO_CONFIG_LIENZO_ATRIBUTOS,
    [TRABAJO_CONFIG_LIENZO_IMAGENES]: TITULO_TRABAJO_CONFIG_LIENZO_IMAGENES
};
export const MOVER_NADA = 0
export const MOVER_CENTRO_FIGURA = 1;
export const MOVER_RECTA_PUNTO1 = 2;
export const MOVER_RECTA_PUNTO2 = 3;
export const MOVER_RADIO_CIRCULO = 4;
export const MOVER_FIGURA_AGREGADA = 5;

export const MOVER_CENTROS_FIGURAS = 6;
export const MOVER_ROTAR_FIGURAS = 7;
export const MOVER_INFLAR_FIGURAS = 8;
export const MOVER_ELIMINAR_FIGURAS = 9;
export const MOVER_DUPLICAR_FIGURAS = 10;

export const MOVER_CENTRO_GRUPOS = 11;
export const MOVER_ROTAR_GRUPOS = 12;
export const MOVER_INFLAR_GRUPOS = 13;
export const MOVER_DUPLICAR_GRUPOS = 14;
export const MOVER_BORRAR_GRUPOS = 15;
export const MOVER_CENTRAR_GRUPOS = 16;
export const MOVER_ESPEJO_GRUPOS = 17;

export const MOVER_CENTRO_IMAGEN = 18;
export const MOVER_INFLAR_IMAGEN = 19;
export const MOVER_SELECIONAR_IMAGEN = 20;

export const MOVER_OPACIDAD_IMAGEN = 21;

export const MOVER_AUMENTO_LIENZO = 23;
export const MOVER_REDUCCION_LIENZO = 24;
export const MOVER_DESPLAZAR_LIENZO = 25;

export const REFLEJO_NONE = 0;
export const REFLEJO_HORIZONTAL = 1;
export const REFLEJO_VERTICAL = 2;

export const RECTA_MOVER_TODO = 0;
export const RECTA_MOVER_P1 = 1;


export const ARRAY_TITULO_MOVIMIENTO = {
    [MOVER_NADA]: "nada",
    [MOVER_CENTRO_FIGURA]: "centro figura",
    [MOVER_RECTA_PUNTO1]: "recta punto 1",
    [MOVER_RECTA_PUNTO2]: "recta punto 2",
    [MOVER_RADIO_CIRCULO]: "radio circulo",
    [MOVER_FIGURA_AGREGADA]: "figura agregada",
    [MOVER_CENTROS_FIGURAS]: "centros figuras",
    [MOVER_ROTAR_FIGURAS]: "rotar figuras",
    [MOVER_INFLAR_FIGURAS]: "inflar figuras",
    [MOVER_ELIMINAR_FIGURAS]: "eliminar figuras",
    [MOVER_DUPLICAR_FIGURAS]: "duplicar figuras",
    [MOVER_CENTRO_GRUPOS]: "centro grupos",
    [MOVER_ROTAR_GRUPOS]: "rotar grupos",
    [MOVER_INFLAR_GRUPOS]: "inflar grupos",
    [MOVER_DUPLICAR_GRUPOS]: "duplicar grupos",
    [MOVER_BORRAR_GRUPOS]: "borrar grupos",
    [MOVER_CENTRAR_GRUPOS]: "centrar grupos",
    [MOVER_ESPEJO_GRUPOS]: "espejo grupos",
    [MOVER_CENTRO_IMAGEN]: "centro imagen",
    [MOVER_INFLAR_IMAGEN]: "inflar imagen",
    [MOVER_SELECIONAR_IMAGEN]: "seleccionar imagen",
    [MOVER_OPACIDAD_IMAGEN]: "opacidad imagen",
    [MOVER_AUMENTO_LIENZO]: "aumento lienzo",
    [MOVER_REDUCCION_LIENZO]: "reducción lienzo",
    [MOVER_DESPLAZAR_LIENZO]: "desplazar lienzo",
    [REFLEJO_NONE]: "sin reflejo",
    [REFLEJO_HORIZONTAL]: "reflejo horizontal",
    [REFLEJO_VERTICAL]: "reflejo vertical",
    [RECTA_MOVER_TODO]: "mover todo",
    [RECTA_MOVER_P1]: "mover p1"
};