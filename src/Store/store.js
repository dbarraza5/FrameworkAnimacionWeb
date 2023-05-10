import { configureStore } from '@reduxjs/toolkit';
import animacionReducer from "./Animacion/animacionSlice"

export default configureStore({
    reducer: {
        animacion: animacionReducer,
    },
});