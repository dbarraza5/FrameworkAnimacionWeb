import {Route, Routes,BrowserRouter , Link } from "react-router-dom";
import styles from "../App.css";
import Login from "../Componentes/Autentificacion/Login";
import React from "react";
import EditorAnimacion from "../Componentes/EditorAnimacion/EditorAnimacion";
import Register from "../Componentes/Autentificacion/Register";
import Home from "../Componentes/Home/Home";


function RoutesMain(){
    return (
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={<SectionLogin />} />

                    <Route exact path="/register" element={<SectionRegister />} />

                    <Route exact path="/home" element={<SectionHome />} />

                    <Route exact path="/home/animacion" element={<SectionAnimacion />} />
                </Routes>
            </BrowserRouter>
    )
}

function SectionLogin() {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Login/>
            </div>
        </section>
    );
}

function SectionRegister() {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Register/>
            </div>
        </section>
    );
}

function SectionHome() {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Home />
            </div>
        </section>
    );
}

function SectionAnimacion() {
    return (
        <section className="" style={styles}>
            <div className="container-xxl">
                <Home />
                <hr/>
                <EditorAnimacion/>
            </div>
        </section>
    );
}

export default RoutesMain