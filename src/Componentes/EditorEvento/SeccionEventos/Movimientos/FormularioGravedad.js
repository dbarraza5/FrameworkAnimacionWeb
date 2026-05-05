function FormularioGravedad({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Velocidad inicial Y</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.v0y || ''}
                    onChange={(e) => setDatos({ ...datos, v0y: parseFloat(e.target.value) })}
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

export default FormularioGravedad