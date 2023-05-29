import React, { useState } from 'react';

function ModalTransferirGrupos() {
    const [checkboxes, setCheckboxes] = useState([
        { nombre: 'Checkbox 1', valor: Math.random() > 0.5 },
        { nombre: 'Checkbox 2', valor: Math.random() > 0.5 },
        { nombre: 'Checkbox 3', valor: Math.random() > 0.5 },
        { nombre: 'Checkbox 4', valor: Math.random() > 0.5 },
    ]);

    const [contenedor1, setContenedor1] = useState(checkboxes);
    const [contenedor2, setContenedor2] = useState([]);

    const handleAgregar = () => {
        const checkboxesSeleccionados = contenedor1.filter((checkbox) => checkbox.valor);
        setContenedor1(contenedor1.filter((checkbox) => !checkbox.valor));
        setContenedor2([...contenedor2, ...checkboxesSeleccionados]);
    };

    const handleRemover = () => {
        const checkboxesSeleccionados = contenedor2.filter((checkbox) => checkbox.valor);
        setContenedor2(contenedor2.filter((checkbox) => !checkbox.valor));
        setContenedor1([...contenedor1, ...checkboxesSeleccionados]);
    };

    const handleSeleccionar1 = () => {
        const todosSeleccionados = contenedor1.every((checkbox) => checkbox.valor);
        const nuevosCheckboxes = contenedor1.map((checkbox) => ({
            ...checkbox,
            valor: !todosSeleccionados,
        }));
        setContenedor1(nuevosCheckboxes);
    };

    const handleSeleccionar2 = () => {
        const todosSeleccionados = contenedor2.every((checkbox) => checkbox.valor);
        const nuevosCheckboxes = contenedor2.map((checkbox) => ({
            ...checkbox,
            valor: !todosSeleccionados,
        }));
        setContenedor2(nuevosCheckboxes);
    };

    return (
        <>
            <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#miModal">
                Abrir Modal
            </button>

            <div className="modal fade" id="miModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Modal con Contenedores Verticales y Checkboxes Dinámicos</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div className="modal-body">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-4">
                                        <h4>Contenedor 1</h4>
                                        <button className="btn btn-primary mb-2" onClick={handleSeleccionar1}>
                                            {contenedor1.every((checkbox) => checkbox.valor) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                        </button>
                                        {contenedor1.map((checkbox, index) => (
                                            <div className="form-check" key={index}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={checkbox.valor}
                                                    onChange={() => {
                                                        const nuevosCheckboxes = [...contenedor1];
                                                        nuevosCheckboxes[index].valor = !nuevosCheckboxes[index].valor;
                                                        setContenedor1(nuevosCheckboxes);
                                                    }}
                                                />
                                                <label className="form-check-label">{checkbox.nombre}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="col-md-2 text-center">
                                        <div className="d-grid gap-2">
                                            <button className="btn btn-primary mt-2" onClick={handleAgregar}>
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                            <button className="btn btn-primary mt-2" onClick={handleRemover}>
                                                <i className="bi bi-arrow-left"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h4>Contenedor 2</h4>
                                        <button className="btn btn-primary mb-2" onClick={handleSeleccionar2}>
                                            {contenedor2.every((checkbox) => checkbox.valor) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                        </button>
                                        {contenedor2.map((checkbox, index) => (
                                            <div className="form-check" key={index}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={checkbox.valor}
                                                    onChange={() => {
                                                        const nuevosCheckboxes = [...contenedor2];
                                                        nuevosCheckboxes[index].valor = !nuevosCheckboxes[index].valor;
                                                        setContenedor2(nuevosCheckboxes);
                                                    }}
                                                />
                                                <label className="form-check-label">{checkbox.nombre}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                Cerrar
                            </button>
                            <button type="button" className="btn btn-primary">
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalTransferirGrupos;
