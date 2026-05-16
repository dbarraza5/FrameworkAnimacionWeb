function FormularioRotacion({ datos, setDatos }) {
    return (
        <>
            {/* Nuevo campo: Sentido de giro */}
            <div className="mb-3">
                <label className="form-label">Sentido de giro</label>
                <select
                    className="form-select"
                    value={datos.sentido ?? 1}
                    onChange={(e) =>
                        setDatos({ ...datos, sentido: parseInt(e.target.value) })
                    }
                >
                    <option value={1}>Sentido Horario (Clockwise)</option>
                    <option value={2}>Sentido Anti-horario (Counter-clockwise)</option>
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label">Velocidad angular (rad/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.velAngular ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, velAngular: e.target.value })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Pivote X</label>
                <input
                    type="number"
                    className="form-control"j
                    value={datos.pivoteX ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, pivoteX: e.target.value })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Pivote Y</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.pivoteY ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, pivoteY: e.target.value })
                    }
                />
            </div>
        </>
    );
}

export default FormularioRotacion