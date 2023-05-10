import { createSlice } from '@reduxjs/toolkit';
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";

const animacionSlice = createSlice({
   name:"animacion",
   initialState: {nombre: "daniel"},//new GestionAnimacion(),

    reducers:{
        actAnimacion_: (state, action) => {
           state.nombre = action.payload
       },
    }
});

export const {actAnimacion_} = animacionSlice.actions;
export default animacionSlice.reducer;