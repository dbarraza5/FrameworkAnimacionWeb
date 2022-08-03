const TRABAJO_NONE = -1
const TRABAJO_FIGURA = 0;
const TRABAJO_FIGURAS = 1;
const TRABAJO_GRUPO = 2;
const TRABAJO_GRUPOS = 3;


class ControlEventoLienzoFigura{

    /*control_grupo_figura = false;

    mover_figura = false;
    mover_grupos = false;
    rotar_grupos =false;
    inflar_grupos = false;
    reducir_grupos = false;

    click_izq_mantenido = false;
    click_der_mantenido = false;

    mouse_x = 0;
    mouse_y = 0;

    control_grupos = false;
    id_grupo_selec = null;

    control_figura = false;
    id_figura_selec = null;
    */
    mouse_x = 0;
    mouse_y = 0;
    mouse_sobre_lienzo = false;
    mouse_mueve_sobre_lienzo = false
    mouse_click_down = false;
    mouse_click_up = false;

    categoria_trabajo = TRABAJO_NONE;

    id_figura_selec = null;
    id_grupo_selec = null;



}

export default ControlEventoLienzoFigura;