import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";
import {obtenerAnimacion} from "./AnimacionAPI";
import {Cookies} from "react-cookie";


export const fetchAnimacion = createAsyncThunk('animacion/fetchAnimacion', async (id_animacion) => {
    const cookie = new Cookies();
    const datos_usuario = cookie.get("usuario")
    const response = await obtenerAnimacion(datos_usuario.token, id_animacion);
    console.log(response)
    return response.data;
});


const animacionSlice = createSlice({
   name:"animacion",
   initialState: {
       animacion: {
           id_proyecto: "",
           id_animacion: "",
           nombre_animacion: "",
           grupos_trabajando:[],
           // para poder retroceder crtl+z
           estado_anterior:[]

       },
       status: 'idle',
       error: null
   },//new GestionAnimacion(),

    reducers:{
        setNombreAnimacion: (state, action) => {
           state.animacion.nombre_animacion = action.payload
       },
        setListaGrupoTrabajo: (state, action) => {
            state.animacion.grupos_trabajando = action.payload
        },
    },
    extraReducers:
        (builder) => {
            builder
                .addCase(fetchAnimacion.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(fetchAnimacion.fulfilled, (state, action) => {
                    state.status = 'succeeded';
                    console.log("SUCCEEDED")
                    console.log(action.payload)
                    console.log(action.error)
                    state.animacion.id_animacion = action.payload._id;
                    state.animacion.nombre_animacion = action.payload.nombre_animacion;
                    state.animacion.meta_figuras = action.payload.meta_figuras
                    state.animacion.meta_movimientos = action.payload.meta_movimientos;
                    state.animacion.grupos_figuras = action.payload.grupos_figuras
                })
                .addCase(fetchAnimacion.rejected, (state, action) => {
                    state.status = 'failed';
                    state.error = action.error.message;
                    console.log("FAILEDDDD")
                });
        }
        /*{
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
    }*/
});

export const {setNombreAnimacion, setListaGrupoTrabajo} = animacionSlice.actions;
export default animacionSlice.reducer;