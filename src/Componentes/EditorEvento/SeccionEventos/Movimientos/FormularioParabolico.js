function FormularioParabolico({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Velocidad inicial</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.velocidadInicial || ''}
                    onChange={(e) => setDatos({ ...datos, velocidadInicial: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Ángulo (grados)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.angulo || ''}
                    onChange={(e) => setDatos({ ...datos, angulo: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Gravedad (opcional)</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.g || ''}
                    onChange={(e) => setDatos({ ...datos, g: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioParabolico;
