function FormularioOscilatorio({ datos, setDatos }) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Amplitud X</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.amplitudX ?? ''}
                    onChange={(e) =>
                        setDatos({
                            ...datos,
                            amplitudX: e.target.value
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Frecuencia X</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.frecuenciaX ?? ''}
                    onChange={(e) =>
                        setDatos({
                            ...datos,
                            frecuenciaX: e.target.value
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Amplitud Y</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.amplitudY ?? ''}
                    onChange={(e) =>
                        setDatos({
                            ...datos,
                            amplitudY: e.target.value
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Frecuencia Y</label>
                <input
                    type="number"
                    className="form-control"
                    value={datos.frecuenciaY ?? ''}
                    onChange={(e) =>
                        setDatos({
                            ...datos,
                            frecuenciaY: e.target.value
                        })
                    }
                />
            </div>
        </>
    );
}

export default FormularioOscilatorio