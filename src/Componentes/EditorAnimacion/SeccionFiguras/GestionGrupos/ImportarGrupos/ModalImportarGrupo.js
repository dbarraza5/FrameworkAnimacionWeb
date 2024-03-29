import TreeViewElement from "../../../../TreeView/TreeViewElement";
import React, {useState} from "react";
import TransferirGrupos from "./TransferirGrupos";
import {GestionAnimacion} from "../../../../../Clases/EditorAnimacion/GestionAnimacion";

function ModalImportarGrupo(props){

    const [grupos_imp, setGruposImp] = useState([])

    const animacion_imp = new GestionAnimacion();
    animacion_imp.grupos_figuras = grupos_imp;

    const handleFileSelect = (event) => {
        console.log("[Cargando el archivo JSON]");
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const jsonData = event.target.result;
            const parsedData = JSON.parse(jsonData);
            console.log(jsonData)
            console.log(parsedData);
            // Aquí puedes realizar operaciones con los datos JSON cargados
            setGruposImp(parsedData)
        };

        reader.readAsText(file);
    };

    return (
        <>
            <div className="modal fade" id="modal-importal-json" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Importar animación de un archivo JSON</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div className="modal-body">
                            <TransferirGrupos {...props} animacion2={animacion_imp}/>
                            <hr/>
                            <div className="form-group">
                                <input type="file" className="form-control" id="archivo"
                                       onChange={handleFileSelect} accept=".json"/>
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

export default ModalImportarGrupo;