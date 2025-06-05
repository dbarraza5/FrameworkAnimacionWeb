function FormularioMRU({ datos, setDatos }) {
    return (
        <div className="mb-3">
            <label className="form-label">Velocidad (m/s)</label>
            <input
                type="number"
                className="form-control"
                value={datos.velocidad || ''}
                onChange={(e) => setDatos({ ...datos, velocidad: parseFloat(e.target.value) })}
            />
        </div>
    );
}

export default FormularioMRU;
