function FormularioRotacion({ datos, setDatos }) {
    return (
        <>
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