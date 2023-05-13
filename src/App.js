import Editor from "./Componentes/EditorMapa/Editor";
import GestionMapa from "./Clases/EditorMapa/GestionMapa"
import styles from './App.css';
import React, {Component, useState} from "react";
import {Switch, Route, Link} from 'react-router-dom'
import EditorAnimacion from "./Componentes/EditorAnimacion/EditorAnimacion";
import Login from "./Componentes/Autentificacion/Login";
import RoutesMain from "./Routes/RoutesMain";
import { useCookies } from 'react-cookie';
import store from "./Store/store";
import {Provider} from "react-redux";

/*function App() {

    let mapa = new GestionMapa();
    return (
        <div className="container">
            <Editor/>
        </div>
    );
}*/


function App(){
    //const [user, setUser] = useState(null);
    const [user, setUser, removeCookie] = useCookies();
    //const user_cookie = cookies.usuario;

    //console.log("user cookie:")
    //console.log(user)

    const setCookieUser=(datos)=>{
        console.log("[CAMBIANDO LOS VALORES DE LA COOKIE]")
        setUser("usuario", datos, "/")
    }

    const removeCookieUser=()=>{
        console.log("[REMOVINEDO COOKIE]")
        removeCookie('usuario','/')
    }


    return (
        <Provider store={store}>
            <RoutesMain user={user} setUser={setCookieUser} removeCookieUser={removeCookieUser}/>
        </Provider>
    );
}

export default App;
