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

const inicializarState= {
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
        tiempo_ultimo_cambio: null,
        //tiempo de espera para poder guardar los cambios | en milisegundos
        tiempo_espera: 1000,
        //0: se mantiene o se acutaliza | 1: se rehace el estado | -1: se dehace
        estado: 0
    },
    status: 'idle',
    error: null
}

const animacionSlice = createSlice({
   name:"animacion",
   initialState: inicializarState,//new GestionAnimacion(),

    reducers:{
        setNombreAnimacion: (state, action) => {
           state.animacion.nombre_animacion = action.payload
       },
        setListaGrupoTrabajo: (state, action) => {
            state.animacion.grupos_trabajando = action.payload
        },
        deshacer: (state)=>{
            if(state.backup.deshacer.length > 0){
                const auxiliar = state.backup.actual;
                state.backup.actual = state.backup.deshacer.pop();
                state.backup.rehacer.unshift(auxiliar);
                state.backup.estado+= -1;
            }
        },
        rehacer: (state)=>{
            if(state.backup.rehacer.length > 0){
                const auxiliar = state.backup.actual;
                state.backup.actual = state.backup.rehacer.shift();
                state.backup.deshacer.push(auxiliar);
                state.backup.estado+= 1;
            }
        },
        actualizarBackup: (state, action)=>{
            const tiempoActual = new Date().getTime();
            if ((state.backup.tiempo_ultimo_cambio === null ||
                tiempoActual - state.backup.tiempo_ultimo_cambio >= state.backup.tiempo_espera) &&
                state.backup.actual !== action.payload ) {
                console.log("Mensaje cada 5 segundos");
                if(state.backup.actual !== null){
                    state.backup.deshacer.push(state.backup.actual)
                    if(state.backup.deshacer.length > state.backup.max_distancia){
                        state.backup.deshacer.shift()
                    }
                }
                state.backup.rehacer=[]
                state.backup.actual = action.payload;
                state.backup.tiempo_ultimo_cambio = tiempoActual;
                state.backup.estado = 0;
            }
        },

        restaurarState: ()=>inicializarState
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

export const {setNombreAnimacion, setListaGrupoTrabajo, deshacer, rehacer, actualizarBackup, restaurarState} = animacionSlice.actions;
export default animacionSlice.reducer;