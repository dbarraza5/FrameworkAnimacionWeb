function FormularioCircular({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Radio</label>
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
                    value={datos.velAngular || ''}
                    onChange={(e) => setDatos({ ...datos, velAngular: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}

export default FormularioCircular