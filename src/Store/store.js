import { configureStore } from '@reduxjs/toolkit';
import animacionReducer from "./Animacion/animacionSlice"
import configuracionReducer from "./Configuracion/ConfigAnimacionSlice"

export default configureStore({
    reducer: {
        animacion: animacionReducer,
        configuracion: configuracionReducer
    },
});