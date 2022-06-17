import logo from './logo.svg';
import './App.css';
import Editor from "./Componentes/EditorMapa/Editor";
import GestionMapa from "./Clases/EditorMapa/GestionMapa"
import {Component} from "react";

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
    render(){
        //const mapa= new GestionMapa()
        return(
            <div className="container-xxl">
                <Editor/>
            </div>
        );
    }
}

export default App;
