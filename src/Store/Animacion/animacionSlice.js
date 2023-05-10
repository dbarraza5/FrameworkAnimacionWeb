import { createSlice } from '@reduxjs/toolkit';
import {GestionAnimacion} from "../../Clases/EditorAnimacion/GestionAnimacion";

const animacionSlice = createSlice({
   name:"animacion",
   initialState: new GestionAnimacion(),

    reducers:{
       actualizar: (state => {

       })
    }
});

export const {actualizar} = animacionSlice.actions;
export default animacionSlice.reducer;