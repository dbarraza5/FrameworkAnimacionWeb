import {createSlice} from "@reduxjs/toolkit";



// Constantes exportadas
export const MODALIDAD_ANIMACION = 1;
export const MODALIDAD_GRUPOS = 2;
export const MODALIDAD_COMPOSICION = 3;

export const TRABAJO_ANIMACION_EVENTOS = 1;
export const TRABAJO_ANIMACION_MOVIMIENTOS = 2;

export const TRABAJO_GRUPOS_POSICION = 1;
export const TRABAJO_GRUPOS_ROTACION = 2;
export const TRABAJO_GRUPOS_TAMANO = 3;
export const TRABAJO_GRUPOS_ESPEJO = 4;



const inicializarState= {
    tipo_modalidad: null,
    tipo_modalidad_trabajo: null,
    id_evento_seleccionado: null,
    evento: {
        id_proyecto: "",
        id_evento: "",
        nombre_evento: "",
        grupos_trabajando:[],
        // para poder retroceder crtl+z
        estado_anterior:[],
        id_hilo_lienzo: null
    },
    backup:{
        deshacer: [],
        rehacer: [],
        actual: null,
        max_distancia: 5,
        tiempo_ultimo_cambio: null,
        //tiempo de espera para poder guardar los cambios | en milisegundos
        tiempo_espera: 100,
        //0: se mantiene o se acutaliza | 1: se rehace el estado | -1: se dehace
        estado: 0
    }
    ,
    status: 'idle',
    error: null
}


const eventoSlice = createSlice({
    name:"animacion",
    initialState: inicializarState,//new GestionAnimacion(),

    reducers:{
        modalidadTrabajo: (state, action) => {
            state.tipo_modalidad =  action.payload.tipo_modalidad//MODALIDAD_ANIMACION;
            state.tipo_modalidad_trabajo = action.payload.tipo_modalidad_trabajo;
            state.id_evento_seleccionado = action.payload.id_evento_seleccionado;
        },

        setEventoActual: (state, action) =>{
            console.log("[GUARDANDO STORE]");
            console.log(action.payload);
            state.evento = action.payload;
        },

        setNombreAnimacion: (state, action) => {
            state.animacion.nombre_animacion = action.payload
        }
        ,
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
});

export const {
    deshacer, rehacer, actualizarBackup, restaurarState,
    setIdHiloLienzo, modalidadTrabajo, setEventoActual} = eventoSlice.actions;
export default eventoSlice.reducer;