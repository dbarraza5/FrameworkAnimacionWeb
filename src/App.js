import logo from './logo.svg';
import Editor from "./Componentes/EditorMapa/Editor";
import GestionMapa from "./Clases/EditorMapa/GestionMapa"
import styles from './App.css';
import React, {Component, useState} from "react";
import {Switch, Route, Link} from 'react-router-dom'
import EditorAnimacion from "./Componentes/EditorAnimacion/EditorAnimacion";
import Login from "./Componentes/Autentificacion/Login";
import RoutesMain from "./Routes/RoutesMain";
import useCookies from "react-cookie/cjs/useCookies";

/*function App() {

    let mapa = new GestionMapa();
    return (
        <div className="container">
            <Editor/>
        </div>
    );
}*/


function App(){
    const [user, setUser] = useState(null);
    const [cookies, setCookie, removeCookie] = useCookies(['cookie-usuario']);
    const user_cookie = cookies.usuario;

    console.log("cookie:")
    console.log(user_cookie)

    if(user == null && user_cookie !== undefined){
        //user = user_cookie;
        setUser(user_cookie)
    }

    const info=()=>{
        console.log("info: ")
        console.log(cookies)
        console.log(user)
    }

    return (
        <div>
            <RoutesMain user={user} setUser={setUser}/>
            <button onClick={info}>ftreter</button>
        </div>
    );
}

export default App;
