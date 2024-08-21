import {useEffect, useRef, useState} from "react";


function SelectorColor(props){

    const lista_imagen = props.animacion.lista_imagenes;

    const [color, setColor] = useState('#ff0000');
    const [hexCode, setHexCode] = useState('#ff0000');
    const canvasRef = useRef(null);

    let imagen = null;


    const handleColorChange = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        setHexCode(newColor);
        props.cambiarColor(newColor);
    };

    const handleHexCodeChange = (e) => {
        const newHexCode = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(newHexCode)) {
            setHexCode(newHexCode);
            setColor(newHexCode);
            props.cambiarColor(newHexCode);
        } else {
            // Opcional: puedes manejar un código hexadecimal inválido aquí
        }
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const newColor = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
        setColor(newColor);
        setHexCode(newColor);
        props.cambiarColor(newColor);
    };

    const handleSelectChange=(e)=>{

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const indice = e.target.value;

        if(indice){
            imagen = lista_imagen[indice];
            ctx.drawImage(imagen.img, 0, 0, imagen.ancho, imagen.alto);
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Puedes dibujar algo en el canvas para probar. Ejemplo:
        /*ctx.fillStyle = '#ff0000';
        ctx.fillRect(10, 10, 100, 100);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(120, 10, 100, 100);
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(230, 10, 100, 100);*/
    }, []);

    return (
        <div className="container mt-5">
            {/* Botón para abrir el modal */}
            {/*<button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#colorModal">*/}
            {/*    Abrir Modal*/}
            {/*</button>*/}

            {/* Modal */}
            <div className="modal fade" id="selector-color-modal" tabIndex="-1" aria-labelledby="colorModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="colorModalLabel">Formulario de Color y Lienzo</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form id="colorForm" className="mb-4">
                                <div className="mb-3">
                                    <label htmlFor="colorPicker" className="form-label">Selecciona un color:</label>
                                    <input
                                        type="color"
                                        id="colorPicker"
                                        className="form-control form-control-color"
                                        value={color}
                                        onChange={handleColorChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="hexCode" className="form-label">Código Hexadecimal:</label>
                                    <input
                                        type="text"
                                        id="hexCode"
                                        className="form-control"
                                        placeholder="#ff0000"
                                        value={hexCode}
                                        onChange={handleHexCodeChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="selectOption" className="form-label">Selecciona una opción:</label>
                                    <select
                                        id="selectOption"
                                        className="form-select"
                                        onChange={handleSelectChange}
                                    >
                                        <option>...</option>
                                        {lista_imagen.map((imagen, index)=>{
                                            return (<option value={index}>{imagen.nombre}</option>)
                                        })}

                                    </select>
                                </div>
                            </form>
                            <div id="canvasContainer" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #000', padding: '10px', margin: '0 auto' }}>
                                <canvas
                                    ref={canvasRef}
                                    width="600"
                                    height="600"
                                    style={{ display: 'block', margin: '0 auto' }}
                                    onClick={handleCanvasClick}
                                ></canvas>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            {/*<button type="button" className="btn btn-primary">Guardar Cambios</button>*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SelectorColor;