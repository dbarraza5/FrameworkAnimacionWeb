function FormularioZoom({ datos, setDatos }) {

    // valores por defecto
    const pivoteX = datos.pivoteX ?? 0;
    const pivoteY = datos.pivoteY ?? 0;

    return (
        <>
            <div className="mb-3">
                <label className="form-label">Velocidad de zoom</label>
                <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={datos.velocidad ?? ''}
                    onChange={(e) =>
                        setDatos({ ...datos, velocidad: e.target.value })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Pivote X</label>
                <input
                    type="number"
                    className="form-control"
                    value={pivoteX}
                    onChange={(e) =>
                        setDatos({ ...datos, pivoteX: e.target.value })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Pivote Y</label>
                <input
                    type="number"
                    className="form-control"
                    value={pivoteY}
                    onChange={(e) =>
                        setDatos({ ...datos, pivoteY: e.target.value })
                    }
                />
            </div>
        </>
    );
}

export default FormularioZoom;