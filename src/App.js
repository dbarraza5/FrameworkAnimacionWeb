import logo from './logo.svg';
import Editor from "./Componentes/EditorMapa/Editor";
import GestionMapa from "./Clases/EditorMapa/GestionMapa"
import styles from './App.css';
import React, {Component} from "react";
import {Switch, Route, Link} from 'react-router-dom'
import EditorAnimacion from "./Componentes/EditorAnimacion/EditorAnimacion";
import Login from "./Componentes/Autentificacion/Login";
import RoutesMain from "./Routes/RoutesMain";

/*function App() {

    let mapa = new GestionMapa();
    return (
        <div className="container">
            <Editor/>
        </div>
    );
}*/


class App extends Component {


    constructor() {
        super();
        //this.mapa = new GestionMapa();

    }

    render() {
        //const mapa= new GestionMapa()
        //<EditorAnimacion/>
        return (
            <div>
                <RoutesMain/>
            </div>
        );
    }
}

export default App;
