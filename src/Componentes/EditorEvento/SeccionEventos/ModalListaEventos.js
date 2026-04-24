import { useMemo, useState } from "react";

const styles = {
    overlay: {
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
    },
    treeContainer: {
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "12px",
        minHeight: "200px",
        maxHeight: "420px",
        overflowY: "auto",
        fontFamily: "'Fira Code', monospace",
        fontSize: "13.5px",
    },
    nodeRow: (isSelected) => ({
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 8px",
        borderRadius: "6px",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: isSelected ? "#e0f2fe" : "transparent",
        borderLeft: isSelected ? "3px solid #0284c7" : "3px solid transparent",
        color: isSelected ? "#0369a1" : "#1e293b",
        fontWeight: isSelected ? 600 : 400,
        transition: "background 0.15s, color 0.15s",
    }),
    chevron: (isOpen) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        fontSize: "10px",
        color: "#64748b",
        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
    }),
    leafIcon: {
        width: "16px",
        height: "16px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "10px",
    },
    folderIcon: (isOpen) => ({
        fontSize: "14px",
        color: isOpen ? "#f59e0b" : "#fbbf24",
        transition: "color 0.15s",
    }),
    childrenContainer: {
        paddingLeft: "20px",
        borderLeft: "1px dashed #cbd5e1",
        marginLeft: "10px",
    },
    selectedLabel: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        backgroundColor: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: "6px",
        fontSize: "13px",
        color: "#0369a1",
        marginBottom: "12px",
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
        color: "#94a3b8",
        gap: "8px",
    },
};

function TreeNode({ nodo, path, openNodes, toggleNode, handleSelect, selectedPath }) {
    const currentPath = path ? `${path}/${nodo.nombre}` : nodo.nombre;
    const hasChildren = nodo.hijos && nodo.hijos.length > 0;
    const isOpen = openNodes.has(currentPath);
    const isSelected = selectedPath === currentPath;

    return (
        <li style={{ listStyle: "none", marginBottom: "2px" }}>
            <div
                style={styles.nodeRow(isSelected)}
                onClick={() => {
                    if (hasChildren) toggleNode(currentPath);
                    handleSelect(currentPath, nodo.nombre);
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
            >
                {/* Ícono de carpeta o hoja */}
                {hasChildren ? (
                    <span style={styles.folderIcon(isOpen)}>{isOpen ? "📂" : "📁"}</span>
                ) : (
                    <span style={styles.leafIcon}>◆</span>
                )}

                <span style={{ flex: 1 }}>{nodo.nombre}</span>

                {/* Chevron para expandir */}
                {hasChildren && (
                    <span style={styles.chevron(isOpen)}>▶</span>
                )}
            </div>

            {hasChildren && isOpen && (
                <ul style={{ ...styles.childrenContainer, padding: "4px 0 4px 20px", listStyle: "none", marginLeft: "10px" }}>
                    {nodo.hijos.map((hijo) => (
                        <TreeNode
                            key={hijo.nombre}
                            nodo={hijo}
                            path={currentPath}
                            openNodes={openNodes}
                            toggleNode={toggleNode}
                            handleSelect={handleSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

function ModalListaEventos({ show, onClose, onGuardar, lista_eventos }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [openNodes, setOpenNodes] = useState(new Set());
    const [selectedPath, setSelectedPath] = useState(null);

    const arbol_animacion = useMemo(() => {
        const mapa = new Map();
        const nodos = [];
        lista_eventos.forEach((item) => {
            const nombre = item.evento.nombre;
            mapa.set(nombre, { nombre, hijos: [] });
        });
        lista_eventos.forEach((item) => {
            const { nombre, nodo_padre } = item.evento;
            if (nodo_padre && nodo_padre !== "Nodo_Default" && mapa.has(nodo_padre)) {
                mapa.get(nodo_padre).hijos.push(mapa.get(nombre));
            } else {
                nodos.push(mapa.get(nombre));
            }
        });
        return { eventos: nodos };
    }, [lista_eventos]);

    const toggleNode = (path) => {
        const next = new Set(openNodes);
        next.has(path) ? next.delete(path) : next.add(path);
        setOpenNodes(next);
    };

    const handleSelect = (path, name) => {
        setSelectedPath(path);
        setSelectedNode(name);
    };

    return (
        <div
            className={`modal fade ${show ? "show d-block" : "d-none"}`}
            tabIndex="-1"
            role="dialog"
            style={styles.overlay}
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content border-0 shadow-lg">

                    {/* Header */}
                    <div className="modal-header border-bottom pb-3">
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: "20px" }}>🌿</span>
                            <h5 className="modal-title mb-0 fw-semibold">Árbol de Eventos</h5>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        {/* Selección actual */}
                        {selectedNode && (
                            <div style={styles.selectedLabel}>
                                <span>✔</span>
                                <span>Seleccionado:</span>
                                <strong>{selectedNode}</strong>
                            </div>
                        )}

                        {/* Árbol */}
                        <div style={styles.treeContainer}>
                            {arbol_animacion.eventos.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <span style={{ fontSize: "32px" }}>🌱</span>
                                    <span>Sin eventos disponibles</span>
                                </div>
                            ) : (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {arbol_animacion.eventos.map((ev) => (
                                        <TreeNode
                                            key={ev.nombre}
                                            nodo={ev}
                                            path=""
                                            openNodes={openNodes}
                                            toggleNode={toggleNode}
                                            handleSelect={handleSelect}
                                            selectedPath={selectedPath}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-top pt-3">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={!selectedNode}
                            onClick={() => {
                                onGuardar(selectedNode);
                                onClose();
                            }}
                        >
                            ✔ Seleccionar
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ModalListaEventos;