import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchAnimacion} from "../Animacion/animacionSlice";
import {
    MODALIDAD_MOVIMIENTOS,
    TRABAJO_NADA_LIENZO,
    TRABAJO_SELECCION_GRUPO
} from "../../Clases/EditorEvento/ConstanteEvento";

const inicializarState= {

    x_lienzo: 0,
    y_lienzo: 0,
    mostrar_info: false,
    pintar_animacion: false,
    // mostrar_imagenes: true,
    status: 'idle',
    error: null,

    tipo_modalidad: null,
    tipo_modalidad_trabajo: TRABAJO_NADA_LIENZO,
    id_grupo_seleccionado: "",
    id_evento_seleccionado: null,
    index_mov_seleccionado: null,
    grupos_a_sincronizar:null
}


const configEventoSlice = createSlice({
    name:"configuracion_general_evento",
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
            // state.mostrar_imagenes = action.payload.mostrar_imagenes;
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
        setTipoModalidad: (state, action)=>{
            state.tipo_modalidad =  action.payload;
            if(state.tipo_modalidad === MODALIDAD_MOVIMIENTOS){
                state.tipo_modalidad_trabajo = TRABAJO_SELECCION_GRUPO;
            }
        },
        setTipoTrabajo: (state, action)=>{
            state.tipo_modalidad_trabajo = action.payload;
        },
        setIdEventoSeleccionado: (state, action)=>{
            state.id_evento_seleccionado = action.payload;
            state.id_grupo_seleccionado = null;
            state.index_mov_seleccionado = null;
        },

        setIdGrupoSeleccionado: (state, action)=>{
            state.id_grupo_seleccionado = action.payload;
            state.index_mov_seleccionado = null;
        },
        setIndexMovSeleccionado: (state, action)=>{
            state.index_mov_seleccionado = action.payload;
        },
        setGruposAsincronizar: (state, action)=>{
            state.grupos_a_sincronizar = action.payload;
        },
        restaurarState: ()=>inicializarState
    }
});

export const {
    setEjex, setEjey, mostrarInfoLienzo, pintarLienzo, resetLienzo,
    setCoordenadas, setConfiguracion, setTipoModalidad, setTipoTrabajo, setIdEventoSeleccionado,
    setGruposAsincronizar,setIdGrupoSeleccionado, setIndexMovSeleccionado
}=configEventoSlice.actions;

export default configEventoSlice.reducer;