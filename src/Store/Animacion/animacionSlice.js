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
       backup:{
           deshacer: [],
           rehacer: [],
           actual: null,
           max_distancia: 5,
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
        deshacer: ()=>{
            if(state.backup.deshacer.length > 0){
                const auxiliar = state.backup.actual;
                state.backup.actual = state.backup.deshacer.pop();
                state.backup.rehacer.unshift(auxiliar);
            }
        },
        rehacer: ()=>{
            if(state.backup.rehacer.length > 0){
                const auxiliar = state.backup.actual;
                state.backup.actual = state.backup.rehacer.shift();
                state.backup.deshacer.push(auxiliar);
            }
        },
        actualizarBackup: (state, action)=>{
            state.backup.deshacer.push(state.backup.actual)
            state.backup.rehacer.clean()
            state.backup.actual = action.payload;
        }
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
});

export const {setNombreAnimacion, setListaGrupoTrabajo} = animacionSlice.actions;
export default animacionSlice.reducer;