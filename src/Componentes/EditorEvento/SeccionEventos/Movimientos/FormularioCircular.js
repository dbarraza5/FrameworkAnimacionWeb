function FormularioCircular({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Radio (m)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.radio || ''}
                    onChange={(e) => setDatos({ ...datos, radio: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Velocidad angular (rad/s)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.velocidad_angular || ''}
                    onChange={(e) => setDatos({ ...datos, velocidad_angular: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Sentido</label>
                <select
                    className="form-select"
                    value={datos.sentido || 'Horario'}
                    onChange={(e) => setDatos({ ...datos, sentido: e.target.value })}
                >
                    <option value="Horario">Horario</option>
                    <option value="Antihorario">Antihorario</option>
                </select>
            </div>
        </>
    );
}

export default FormularioCircular;
