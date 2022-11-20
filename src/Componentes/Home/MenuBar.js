import {Link, useNavigate} from "react-router-dom";
import useCookies from "react-cookie/cjs/useCookies";
import axios from "axios";
import config from "../../config";
import {useEffect, useState} from "react";

function MenuBar(props){
    const setUser = props.setUser;
    const [cookies, setCookie, removeCookie] = useCookies(['cookie-usuario']);


    const navigate = useNavigate();
    /*const [ir_login, setIrLogin] = useState(false);
    useEffect(() => {
        console.log("vamos ave4errr: "+ir_login)
        if(ir_login){
            console.log("IR AL LOGIN KBRON22222222222222222")
            navigate("/");
        }

    }, [ir_login]);*/

    const logout= async()=>{
        try {
            console.log("ussuario: ")
            console.log(props.user)
            const config = {
                method: 'get',
                url: "user/logout",
                headers: {
                    "Content-Type": "application/json",
                    'Accept': 'application/json'
                },
                withCredentials: true
            };

            let res = await axios(config)
                .then(function (response) {
                    console.log("IR AL LOGIN KBRON")
                    props.removeCookie('usuario', "/")
                    /*if(props.user != null){
                        console.log("seteando el USER")
                        setUser(null);
                    }*/
                    //setIrLogin(true)
                })
                .catch(function (error) {
                    console.log("error")
                    console.log(error);
                });
        } catch (err) {
            //console.log(err);
        }
    }

    return(<nav className="navbar navbar-expand-lg bg-light">
        <div className="container-fluid">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link active" aria-current="page" href="">Inicio</a>
                    </li>
                </ul>
            </div>
            <div className="d-flex align-items-center">
                <a className="nav-link active" aria-current="page" onClick={logout} href="#">Salir</a>
            </div>
        </div>
    </nav>)
}

export default MenuBar;