import {useEffect, useState} from "react";

//className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100"
function MenuEvento(props) {
    const [darkMode, setDarkMode] = useState('light');

    const toggleDarkMode = (mode) => {
        document.documentElement.setAttribute('data-bs-theme', mode);
        setDarkMode(mode);
    };

    return (
        <nav className={`navbar navbar-expand-lg `}>
            <div className="container-fluid">
                <div className="collapse navbar-collapse" id="navbarNavDropdown">
                    <ul className="navbar-nav">
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                               data-bs-toggle="dropdown" aria-expanded="false">
                                Archivo
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                <li><a className="dropdown-item" onClick={() => props.subirAnimacion()}>Subir</a></li>
                                <li><a className="dropdown-item" href="#">Refrescar</a></li>
                                <li><a className="dropdown-item" href="#">Guardar Como</a></li>
                                <li><a className="dropdown-item" onClick={() => props.exportarAnimacion()}>Exportar</a></li>
                                <li><a className="dropdown-item" data-bs-target="#modal-importal-json" data-bs-toggle="modal"
                                       onClick={() => console.log("importar")}>Importar</a></li>
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
                        <li className="nav-item ms-auto">
                            <a className="nav-link" href="#">Pricing</a>
                        </li>
                    </ul>
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="modo-dark" role="button"
                               data-bs-toggle="dropdown" aria-expanded="false">
                                Modo
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="modo-dark">
                                <li><a className="dropdown-item" href="#" onClick={() => toggleDarkMode('light')}>Light</a></li>
                                <li><a className="dropdown-item" href="#" onClick={() => toggleDarkMode('dark')}>Dark</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}


export default MenuEvento;