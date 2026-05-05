function FormularioLerp({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Inicio</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.inicio || ''}
                    onChange={(e) => setDatos({ ...datos, inicio: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Fin</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.fin || ''}
                    onChange={(e) => setDatos({ ...datos, fin: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioLerp