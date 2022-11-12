import {Route, Routes, BrowserRouter, Link, redirect, useNavigate} from "react-router-dom";
import styles from "../App.css";
import Login from "../Componentes/Autentificacion/Login";
import React, {useEffect, useState} from "react";
import EditorAnimacion from "../Componentes/EditorAnimacion/EditorAnimacion";
import Register from "../Componentes/Autentificacion/Register";
import Home from "../Componentes/Home/Home";
import useCookies from "react-cookie/cjs/useCookies";


function RoutesMain(props){

    const user = props.user;

    const [cookies, setCookie, removeCookie] = useCookies(['cookie-usuario']);
    const user_cookie = cookies.usuario;

    console.log("cookie:")
    console.log(user_cookie)

    const [resgistrado, setRegistrado] = useState(false);
    useEffect(() => {
        if(resgistrado)
        {
            setTimeout(() => {
                alert("registrado!!!");
            }, 1000)
        }
    }, [resgistrado]);


    if(props.user == null && user_cookie !== undefined){
        //user = user_cookie;
        props.setUser(user_cookie)
    }

    /*useEffect(() => {
        if(props.user == null){
            props.setUser(user_cookie)
        }
    }, [props.user]);*/


    return (
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={user != null ? SectionHome(props) :SectionLogin(props)}/>

                    <Route exact path="/register" element={<SectionRegister setRegistrado={setRegistrado}/>} />

                    <Route exact path="/home" element={<SectionHome />} />

                    <Route exact path="/home/animacion" element={<SectionAnimacion />} />
                </Routes>
            </BrowserRouter>
    )
}

function SectionLogin(props) {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Login {...props}/>
            </div>
        </section>
    );
}

function SectionRegister(props) {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Register {...props}/>
            </div>
        </section>
    );
}


function SectionHome(props) {
    return (
        <section className="vh-100 gradientCustom" style={styles}>
            <div className="container-xxl">
                <Home {...props} />
            </div>
        </section>
    );
}

function SectionAnimacion(props) {
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