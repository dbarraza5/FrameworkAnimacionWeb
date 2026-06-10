import React, { useState } from 'react';

// --- COMPONENTE PRINCIPAL (ADAPTADO COMO DROPDOWN CON SCROLL) ---
const SeleccionGrupoArbol = ({ datosFiguras, id_grupo_seleccionado, alSeleccionarGrupo }) => {
    // Controla si el menú desplegable está abierto
    const [isOpen, setIsOpen] = useState(false);
    // Guarda qué carpetas/ramas del árbol están expandidas
    const [expandidos, setExpandidos] = useState(new Set());

    const toggleExpandir = (nombre, e) => {
        e.stopPropagation(); // Evita que se cierre el dropdown al abrir una carpeta
        const nuevosExpandidos = new Set(expandidos);
        if (nuevosExpandidos.has(nombre)) {
            nuevosExpandidos.delete(nombre);
        } else {
            nuevosExpandidos.add(nombre);
        }
        setExpandidos(nuevosExpandidos);
    };

    // Filtrar los nodos raíz (los que no tienen padre)
    const nodosRaiz = datosFiguras.filter(nodo => nodo.nodo_padre === "root");

    return (
        <div className="dropdown mb-3" style={{ position: 'relative' }}>
            {/* Botón que despliega el árbol */}
            <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center"
                type="button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>
                    <i className="bi bi-diagram-3 me-2"></i>
                    {id_grupo_seleccionado ? `Grupo: ${id_grupo_seleccionado}` : "Seleccionar Grupo / Árbol"}
                </span>
            </button>

            {/* Contenedor del Árbol con Scroll e interactividad */}
            {isOpen && (
                <>
                    {/* Fondo invisible para cerrar el dropdown si hacen clic afuera */}
                    {/* 1. Fondo invisible: subimos de 998 a 1040 */}
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 2. Contenedor del Árbol: subimos de 999 a 1050 */}
                    <div
                        className="card shadow-sm p-2"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1050, // <-- Esto lo posiciona por encima de la cabecera sticky-top
                            maxHeight: '250px',
                            overflowY: 'auto',
                            marginTop: '4px'
                        }}
                    >
                        {nodosRaiz.length === 0 ? (
                            <small className="text-muted p-2">No hay grupos definidos</small>
                        ) : (
                            nodosRaiz.map(nodo => (
                                <NodoArbol
                                    key={nodo.nombre}
                                    nodo={nodo}
                                    todosLosDatos={datosFiguras}
                                    seleccionado={id_grupo_seleccionado}
                                    alSeleccionar={(nombre) => {
                                        alSeleccionarGrupo(nombre);
                                        setIsOpen(false); // Cierra el menú al seleccionar un elemento definitivo
                                    }}
                                    expandidos={expandidos}
                                    toggleExpandir={toggleExpandir}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- SUBCOMPONENTE RECURSIVO ---
const NodoArbol = ({ nodo, todosLosDatos, seleccionado, alSeleccionar, expandidos, toggleExpandir }) => {
    const hijos = todosLosDatos.filter(n => n.nodo_padre === nodo.nombre);
    const tieneHijos = hijos.length > 0;
    const estaExpandido = expandidos.has(nodo.nombre);
    const estaSeleccionado = seleccionado === nodo.nombre;

    return (
        <div style={{ marginLeft: '12px' }}>
            <div
                className={`d-flex align-items-center rounded px-2 py-1 ${estaSeleccionado ? 'bg-primary text-white' : ''}`}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => alSeleccionar(nodo.nombre)}
            >
                {/* Flecha para expandir/colapsar ramas */}
                <span
                    onClick={(e) => tieneHijos && toggleExpandir(nodo.nombre, e)}
                    className="me-1 d-flex align-items-center justify-content-center"
                    style={{
                        width: '16px',
                        height: '16px',
                        color: estaSeleccionado ? '#fff' : (tieneHijos ? '#0d6efd' : '#ccc'),
                        cursor: tieneHijos ? 'pointer' : 'default'
                    }}
                >
                    {tieneHijos ? (estaExpandido ? <i className="bi bi-chevron-down small"></i> : <i className="bi bi-chevron-right small"></i>) : '•'}
                </span>

                {/* Ícono visual de carpeta o archivo */}
                <i className={`bi ${tieneHijos ? 'bi-folder2-open' : 'bi-file-earmark'} me-2 ${estaSeleccionado ? 'text-white' : 'text-muted'}`}></i>

                {/* Nombre de la figura/nodo */}
                <small className="user-select-none">{nodo.nombre}</small>
            </div>

            {/* Llamada recursiva si la carpeta está abierta */}
            {tieneHijos && estaExpandido && (
                <div className="border-start ms-2 ps-1" style={{ borderColor: '#dee2e6 !important' }}>
                    {hijos.map(hijo => (
                        <NodoArbol
                            key={hijo.nombre}
                            nodo={hijo}
                            todosLosDatos={todosLosDatos}
                            seleccionado={seleccionado}
                            alSeleccionar={alSeleccionar}
                            expandidos={expandidos}
                            toggleExpandir={toggleExpandir}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeleccionGrupoArbol;