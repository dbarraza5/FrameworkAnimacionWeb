function FormularioLerp({ datos, setDatos }) {
    return (
        <>
            <div className="row mb-3">
                <label className="form-label">Punto de inicio</label>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">X</span>
                        <input
                            type="number"
                            className="form-control"
                            value={datos.inicio_x ?? ''}
                            onChange={(e) => setDatos({ ...datos, inicio_x: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">Y</span>
                        <input
                            type="number"
                            className="form-control"
                            value={datos.inicio_y ?? ''}
                            onChange={(e) => setDatos({ ...datos, inicio_y: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            <div className="row mb-3">
                <label className="form-label">Punto final</label>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">X</span>
                        <input
                            type="number"
                            className="form-control"
                            value={datos.fin_x ?? ''}
                            onChange={(e) => setDatos({ ...datos, fin_x: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="col">
                    <div className="input-group">
                        <span className="input-group-text">Y</span>
                        <input
                            type="number"
                            className="form-control"
                            value={datos.fin_y ?? ''}
                            onChange={(e) => setDatos({ ...datos, fin_y: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default FormularioLerp