import {Link, useNavigate} from "react-router-dom";
import useCookies from "react-cookie/cjs/useCookies";
import axios from "axios";
import config from "../../config";
import {useEffect, useState} from "react";

//className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100"
function MenuAnimacion(props){


    return(<nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
            <div className="collapse navbar-collapse" id="navbarNavDropdown">
                <ul className="navbar-nav">
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                           data-bs-toggle="dropdown" aria-expanded="false">
                            Archivo
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                            <li><a className="dropdown-item" onClick={()=>props.subirAnimacion()}>Subir</a></li>
                            <li><a className="dropdown-item" href="#">Refrescar</a></li>
                            <li><a className="dropdown-item" href="#">Guardor Como</a></li>
                            <li><a className="dropdown-item" onClick={()=>props.exportarAnimacion()}>Exportar</a></li>
                            <li><a className="dropdown-item" onClick={()=>console.log("importar")}>Importar</a></li>
                            <li><a className="dropdown-item" href="#">Salir</a></li>
                        </ul>
                    </li>

                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                           data-bs-toggle="dropdown" aria-expanded="false">
                            Editar
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                            <li><a className="dropdown-item" href="#">Deshacer</a></li>
                            <li><a className="dropdown-item" href="#">Rehacer</a></li>
                        </ul>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link active" aria-current="page" href="#">Home</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">Features</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">Pricing</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>)
}

export default MenuAnimacion;