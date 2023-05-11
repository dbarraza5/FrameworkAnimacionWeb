import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import {obtenerAnimacion} from "./AnimacionAPI";
import {Cookies} from "react-cookie";


export const fetchAnimacion = createAsyncThunk('animacion/fetchAnimacion', async () => {
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")
    const response = await obtenerAnimacion(datos_usuario.token,"63881cb471c3843157059664");
    console.log(response)
    return response.data;
});


const animacionSlice = createSlice({
   name:"animacion",
   initialState: {
       todos: [],
       animacion: new GestionAnimacion(),
       status: 'idle',
       error: null
   },//new GestionAnimacion(),

    reducers:{
        actAnimacion_: (state, action) => {
           state.nombre = action.payload
       },
    },
    extraReducers: {
        [fetchAnimacion.pending]: (state) => {
            state.status = 'loading';
        },
        [fetchAnimacion.fulfilled]: (state, action) => {
            state.status = 'succeeded';
            state.animacion.id_animacion = action.payload._id;
            state.animacion.nombre_animacion = action.payload.nombre_animacion;
            state.animacion.meta_figuras = action.payload.meta_figuras
            state.animacion.meta_movimientos = action.payload.meta_movimientos;
            state.animacion.grupos_figuras = action.payload.grupos_figuras
        },
        [fetchAnimacion.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        },
    }
});

export const {actAnimacion_} = animacionSlice.actions;
export default animacionSlice.reducer;