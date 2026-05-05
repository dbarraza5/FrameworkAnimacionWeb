function FormularioOscilatorio({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Amplitud</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.amplitud || ''}
                    onChange={(e) => setDatos({ ...datos, amplitud: parseFloat(e.target.value) })}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Frecuencia</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.frecuencia || ''}
                    onChange={(e) => setDatos({ ...datos, frecuencia: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioOscilatorio