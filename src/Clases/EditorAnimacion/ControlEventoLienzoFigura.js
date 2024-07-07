

class ControlEventoLienzoFigura{

    // coordenadas reales dentro del lienzo
    mouse_x = 0;
    mouse_y = 0;
    // coordenadas ficticias de desplazamiento
    mouse_virtual_x = 0;
    mouse_virtual_y = 0;

    mouse_sobre_lienzo = false;
    mouse_mueve_sobre_lienzo = false
    mouse_click_down = false;
    mouse_click_up = false;
    mouse_only_click = false;
    /*
    click_left: 0
    click_right: 2
    click_scroll: 1
    * */
    mouse_type_button = -1

    mouse_delta_scroll = 0

    stack_event_teclado = []

    reset(){
        this.mouse_only_click = false;
        this.mouse_delta_scroll = 0;
    }
}

export default ControlEventoLienzoFigura;