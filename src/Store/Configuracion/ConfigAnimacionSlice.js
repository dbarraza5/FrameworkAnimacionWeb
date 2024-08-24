import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchAnimacion} from "../Animacion/animacionSlice";

const inicializarState= {

    x_lienzo: 0,
    y_lienzo: 0,
    mostrar_info: false,
    pintar_animacion: false,
    mostrar_imagenes: true

    ,
    status: 'idle',
    error: null
}


const configAnimacionSlice = createSlice({
    name:"configuracion_general",
    initialState: inicializarState,

    reducers:{
        setEjex: (state, action) => {
            state.x_lienzo = action.payload;
        },
        setEjey: (state, action) => {
            state.y_lienzo = action.payload;
        },
        setCoordenadas: (state, action) => {
            state.x_lienzo = action.payload.x;
            state.y_lienzo = action.payload.y;
        },
        setConfiguracion: (state, action) => {
            state.x_lienzo = action.payload.x;
            state.y_lienzo = action.payload.y;
            state.mostrar_info = action.payload.mostrar_info;
            state.pintar_animacion = action.payload.pintar_animacion;
            state.mostrar_imagenes = action.payload.mostrar_imagenes;
        },
        mostrarInfoLienzo: (state, action) => {
            state.mostrar_info = action.payload;
        },
        pintarLienzo: (state, action) => {
            state.pintar_animacion = action.payload;
        },
        resetLienzo: (state) => {
            state.x_lienzo = 0;
            state.y_lienzo = 0;
        },
        restaurarState: ()=>inicializarState
    }
});

export const {
    setEjex, setEjey, mostrarInfoLienzo, pintarLienzo, resetLienzo,
    setCoordenadas, setConfiguracion
}=configAnimacionSlice.actions;

export default configAnimacionSlice.reducer;