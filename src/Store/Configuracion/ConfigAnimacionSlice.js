import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchAnimacion} from "../Animacion/animacionSlice";

const inicializarState= {

    x_lienzo: 0,
    y_lienzo: 0,
    mostrar_info: false,
    pintar_animacion: false

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
        mostrarInfoLienzo: (state, action) => {
            state.mostrar_info = action.payload;
        },
        pintarLienzo: (state, action) => {
            state.pintar_animacion = action.payload;
        },
        resetLienzo: (state) => {
            state.ejex = 0;
            state.ejey = 0;
        },
        restaurarState: ()=>inicializarState
    }
});

export const {
    setEjex, setEjey, mostrarInfoLienzo, pintarLienzo, resetLienzo
}=configAnimacionSlice.actions;

export default configAnimacionSlice.reducer;