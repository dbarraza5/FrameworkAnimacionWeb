function FormularioCircular({ datos, setDatos }) {
    // Función auxiliar para manejar cambios numéricos de forma segura
    const handleNumberChange = (field, value) => {
        setDatos({
            ...datos,
            [field]: value === '' ? '' : parseFloat(value)
        });
    };

    return (
        <>
            <div className="row mb-3">
                <label className="form-label">Coordenadas del Pivote</label>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">X</span>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={datos.pivote_x ?? ''}
                            onChange={(e) => handleNumberChange('pivote_x', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">Y</span>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={datos.pivote_y ?? ''}
                            onChange={(e) => handleNumberChange('pivote_y', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">Velocidad angular (rad/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.velocidad_angular ?? ''}
                    onChange={(e) => handleNumberChange('velocidad_angular', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Sentido</label>
                <select
                    className="form-select"
                    value={datos.sentido || 'Horario'}
                    onChange={(e) => setDatos({ ...datos, sentido: e.target.value })}
                >
                    <option value="Horario">Horario (CW)</option>
                    <option value="Antihorario">Antihorario (CCW)</option>
                </select>
            </div>
        </>
    );
}

export default FormularioCircular;
