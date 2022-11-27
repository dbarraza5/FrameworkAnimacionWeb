import {Route, Routes, BrowserRouter, Link, redirect, useNavigate, useParams} from "react-router-dom";
import styles from "../App.css";
import Login from "../Componentes/Autentificacion/Login";
import React, {useEffect, useState} from "react";
import EditorAnimacion from "../Componentes/EditorAnimacion/EditorAnimacion";
import Register from "../Componentes/Autentificacion/Register";
import Home from "../Componentes/Home/Home";
import useCookies from "react-cookie/cjs/useCookies";
import Proyectos from "../Componentes/Home/Proyectos";
import Animacion from "../Componentes/Home/Animacion";
import MenuLateral from "../Componentes/Home/MenuLateral";


function RoutesMain(props){

    const user = props.user;


    //console.log("[COOKIE USER]")
    //console.log(user)
    //console.log("[END COOKIE]")
    //props.setUser( "usuario",null, "/");
    //props.removeCookie('usuario','/');
    const [resgistrado, setRegistrado] = useState(false);
    useEffect(() => {
        if(resgistrado)
        {
            setTimeout(() => {
                alert("registrado!!!");
            }, 1000)
        }
    }, [resgistrado]);

    const [mensajeError, setMensajeError] = useState(null);
    useEffect(() => {
        console.log("cambiar el mensaje de error")
        if(mensajeError)
        {
            setTimeout(() => {
                alert(mensajeError);
            }, 1000)
        }
    }, [mensajeError]);


    const manejadorErrores = (datos)=>{
        const tipo_error = datos.error.name;
        if(tipo_error === "TokenExpiredError" || tipo_error === "NoAutenticado"){
            console.log("tu session expiro brooo¬¬¬");
            props.removeCookieUser();
            setMensajeError("tu sesión expiro0122")
        }
    }

    return (
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={user.usuario != null ? SectionHome({...props, manejadorErrores:manejadorErrores}) :SectionLogin(props)}/>

                    <Route exact path="/register" element={<SectionRegister setRegistrado={setRegistrado}/>} />

                    <Route exact path="/home" element={<SectionHome {...props} setMensajeError={setMensajeError}/>} />

                    <Route exact path="/home/animacion" element={<SectionAnimacion />} />

                    <Route exact path="/list-animaciones/:id_proyecto" element={<SectionListaAnimacion {...props} manejadorErrores={manejadorErrores}/>} />

                    <Route exact path="/animacion/:id_animacion" element={<SectionEdicionAnimacion {...props} manejadorErrores={manejadorErrores}/>} />
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
        <section className="" >
            <div className="container-xxl">
                <Home {...props} />
                <hr/>

                <div className="container-xxl">
                    <Proyectos {...props}/>
                </div>
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

function SectionListaAnimacion(props) {
    const {id_proyecto} = useParams();
    return (
        <section className="" style={styles}>
            <div className="container-xxl">
                <Home {...props}/>
                <hr/>
                <Animacion {...props} id_proyecto={id_proyecto} nombre_proyecto="sin nombre"/>
            </div>
        </section>
    );
}

function SectionEdicionAnimacion(props) {
    const {id_animacion} = useParams();
    return (
        <section className="" style={styles}>
            <MenuLateral>
                <EditorAnimacion id_animacion={id_animacion}/>
            </MenuLateral>
        </section>
    );
}
/*
<div className="container-xxl">
                <Home {...props}/>
                <hr/>
                <EditorAnimacion id_animacion={id_animacion}/>
            </div>
*
* */

export default RoutesMain