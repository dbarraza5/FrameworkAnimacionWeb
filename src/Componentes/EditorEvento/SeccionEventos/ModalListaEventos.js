import {useMemo, useState} from "react";

function ModalListaEventos({ show, onClose, onGuardar, lista_eventos }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [openNodes, setOpenNodes] = useState(new Set());
    const [selectedPath, setSelectedPath] = useState(null);

    // 🧠 Construir árbol jerárquico desde lista_eventos
    const arbol_animacion = useMemo(() => {
        const mapa = new Map();
        const nodos = [];

        // Primero crear nodos
        lista_eventos.forEach((item) => {
            const nombre = item.evento.nombre;
            mapa.set(nombre, { nombre, hijos: [] });
        });

        // Luego asignar hijos a sus padres
        lista_eventos.forEach((item) => {
            const { nombre, nodo_padre } = item.evento;
            if (nodo_padre && mapa.has(nodo_padre)) {
                mapa.get(nodo_padre).hijos.push(mapa.get(nombre));
            } else {
                // Si no tiene padre válido, lo tratamos como raíz
                nodos.push(mapa.get(nombre));
            }
        });

        return { eventos: nodos };
    }, [lista_eventos]);

    const toggleNode = (path) => {
        const newOpenNodes = new Set(openNodes);
        newOpenNodes.has(path) ? newOpenNodes.delete(path) : newOpenNodes.add(path);
        setOpenNodes(newOpenNodes);
    };

    const handleSelect = (path, name) => {
        setSelectedPath(path);      // para resaltado visual
        setSelectedNode(name);      // para usar en onGuardar
    };

    const renderTree = (nodo, path = '') => {
        const currentPath = path ? `${path}/${nodo.nombre}` : nodo.nombre;
        const hasChildren = nodo.hijos && nodo.hijos.length > 0;
        const isOpen = openNodes.has(currentPath);
        const isSelected = selectedPath === currentPath;

        return (
            <li key={currentPath}>
                <div
                    onClick={() => {
                        if (hasChildren) toggleNode(currentPath);
                        handleSelect(currentPath, nodo.nombre); // ← ahora enviamos ambos
                    }}
                    style={{
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#d1e7dd" : "transparent",
                        borderLeft: isSelected ? "3px solid #0f5132" : "none",
                        borderRadius: "4px",
                        padding: "2px 4px"
                    }}
                >
                    🔘 {nodo.nombre}
                    {hasChildren && (
                        <span style={{ marginLeft: "4px", fontSize: "12px", color: "#555" }}>
                        {isOpen ? '▼' : '▶'}
                    </span>
                    )}
                </div>
                {hasChildren && isOpen && (
                    <ul style={{ listStyle: "none", paddingLeft: "16px" }}>
                        {nodo.hijos.map((hijo) => renderTree(hijo, currentPath))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" role="dialog"
             style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Árbol de Eventos</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <ul style={{ listStyle: "none", paddingLeft: "0" }}>
                            {arbol_animacion.eventos.map((ev) =>
                                renderTree(ev)
                            )}
                        </ul>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                        <button type="button" className="btn btn-primary" onClick={() => onGuardar(selectedNode)}>
                            Seleccionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalListaEventos;
