import {useEffect, useState} from "react";

//className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100"
function MenuEvento(props) {
    const [darkMode, setDarkMode] = useState('light');

    const toggleDarkMode = (mode) => {
        document.documentElement.setAttribute('data-bs-theme', mode);
        setDarkMode(mode);
    };

    return (
        <>
            {/* BOTÓN DISPARADOR: Flotante para no ocupar espacio en el layout */}
            <button
                className="btn btn-dark position-fixed top-0 start-0 m-3 shadow-sm"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#menuLateralEvento"
                aria-controls="menuLateralEvento"
                style={{ zIndex: 1000, borderRadius: '50%', width: '50px', height: '50px' }}
            >
                <i className="bi bi-list"></i> {/* Puedes usar un icono de Bootstrap Icons aquí */}
            </button>

            {/* ESTRUCTURA DEL OFFCANVAS */}
            <div className="offcanvas offcanvas-start" tabIndex="-1" id="menuLateralEvento" aria-labelledby="offcanvasLabel">
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title" id="offcanvasLabel">Panel de Control</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>

                <div className="offcanvas-body p-0">
                    <div className="list-group list-group-flush">

                        {/* SECCIÓN ARCHIVO */}
                        <div className="p-3 bg-light fw-bold small text-uppercase">Archivo</div>
                        <button className="list-group-item list-group-item-action border-0 ps-4" onClick={() => props.subirAnimacion()}>
                            <i className="bi bi-upload me-2"></i> Subir
                        </button>
                        <button className="list-group-item list-group-item-action border-0 ps-4">
                            <i className="bi bi-arrow-clockwise me-2"></i> Refrescar
                        </button>
                        <button className="list-group-item list-group-item-action border-0 ps-4">
                            <i className="bi bi-save me-2"></i> Guardar Como
                        </button>
                        <button className="list-group-item list-group-item-action border-0 ps-4" onClick={() => props.exportarAnimacion()}>
                            <i className="bi bi-download me-2"></i> Exportar
                        </button>
                        <button className="list-group-item list-group-item-action border-0 ps-4" data-bs-toggle="modal" data-bs-target="#modal-importal-json">
                            <i className="bi bi-filetype-json me-2"></i> Importar
                        </button>

                        {/* SECCIÓN EDITAR */}
                        <div className="p-3 bg-light fw-bold small text-uppercase mt-2">Editar</div>
                        <button className="list-group-item list-group-item-action border-0 ps-4">
                            <i className="bi bi-arrow-90deg-left me-2"></i> Deshacer
                        </button>
                        <button className="list-group-item list-group-item-action border-0 ps-4">
                            <i className="bi bi-arrow-90deg-right me-2"></i> Rehacer
                        </button>

                        {/* SECCIÓN NAVEGACIÓN */}
                        <div className="p-3 bg-light fw-bold small text-uppercase mt-2">Navegación</div>
                        <a href="#" className="list-group-item list-group-item-action border-0 ps-4">Home</a>
                        <a href="#" className="list-group-item list-group-item-action border-0 ps-4">Features</a>
                        <a href="#" className="list-group-item list-group-item-action border-0 ps-4">Pricing</a>

                        {/* CONFIGURACIÓN DE MODO */}
                        <div className="p-3 bg-light fw-bold small text-uppercase mt-2">Configuración</div>
                        <div className="d-flex justify-content-around p-3">
                            <button
                                className={`btn btn-sm ${darkMode === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => toggleDarkMode('light')}
                            >
                                ☀️ Claro
                            </button>
                            <button
                                className={`btn btn-sm ${darkMode === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => toggleDarkMode('dark')}
                            >
                                🌙 Oscuro
                            </button>
                        </div>

                    </div>
                </div>

                <div className="offcanvas-footer p-3 border-top text-center">
                    <small className="text-muted">Evento App v1.0</small>
                </div>
            </div>
        </>
    );
}


export default MenuEvento;