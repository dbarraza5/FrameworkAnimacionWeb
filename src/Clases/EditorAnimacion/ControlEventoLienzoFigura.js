

class ControlEventoLienzoFigura{

    mouse_x = 0;
    mouse_y = 0;
    mouse_sobre_lienzo = false;
    mouse_mueve_sobre_lienzo = false
    mouse_click_down = false;
    mouse_click_up = false;
    mouse_only_click = false;

    reset(){
        this.mouse_only_click = false;
    }
}

export default ControlEventoLienzoFigura;