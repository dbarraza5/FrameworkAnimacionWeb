import {Link} from "react-router-dom";
import useCookies from "react-cookie/cjs/useCookies";
import axios from "axios";
import config from "../../config";

function MenuBar(props){
    const setUser = props.setUser;
    const [cookies, setCookie, removeCookie] = useCookies(['cookie-usuario']);

    const logout= async()=>{
        try {
            let res = await axios.get(config.SERVIDOR_BACKEND + "/user/logout")
                .then(function (response) {
                    removeCookie('usuario', "/")
                    setUser(null);
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