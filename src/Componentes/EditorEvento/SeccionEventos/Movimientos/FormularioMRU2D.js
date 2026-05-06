function FormularioMRU2D({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Velocidad X (m/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.vx ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, vx: e.target.value })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Velocidad Y (m/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.vy ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, vy: e.target.value })
                    }
                />
            </div>
        </>
    );
}

export default FormularioMRU2D