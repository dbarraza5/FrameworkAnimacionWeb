function FormularioParabolico({ datos, setDatos }) {
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
                <label className="form-label">Ángulo (°)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.angulo || ''}
                    onChange={(e) => setDatos({ ...datos, angulo: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioParabolico;
