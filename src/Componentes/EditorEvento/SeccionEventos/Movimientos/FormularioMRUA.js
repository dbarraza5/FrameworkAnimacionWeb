function FormularioMRUA({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Velocidad inicial (m/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.velocidad || ''}
                    onChange={(e) => setDatos({ ...datos, velocidad: parseFloat(e.target.value) })}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Aceleración (m/s²)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.aceleracion || ''}
                    onChange={(e) => setDatos({ ...datos, aceleracion: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioMRUA;
