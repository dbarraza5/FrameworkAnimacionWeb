import { configureStore } from '@reduxjs/toolkit';
import animacionReducer from "./Animacion/animacionSlice"
import configuracionReducer from "./Configuracion/ConfigAnimacionSlice"
import eventoReducer from "./Evento/eventoSlice"

export default configureStore({
    reducer: {
        animacion: animacionReducer,
        configuracion: configuracionReducer,
        evento: eventoReducer
    },
});