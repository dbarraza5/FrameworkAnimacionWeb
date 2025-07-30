import {useState, useRef, useEffect} from "react";
import * as yup from 'yup';
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}


function msToTimeParts(ms) {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    const miliseg = ms % 1000;
    return {
        min: minutos.toString().padStart(2, '0'),
        seg: segundos.toString().padStart(2, '0'),
        ms: miliseg.toString().padStart(3, '0'),
    };
}

function PanelEventos(props) {
    const inicio = msToTimeParts(props.evento?.tiempo_inicio || 0);
    const fin = msToTimeParts(props.evento?.tiempo_final || 0);


    const [selectedEvent, setSelectedEvent] = useState(props.evento?.nodo_padre|| "");
    const [nombre, setNombre] = useState(props.evento?.nombre || "");
    const [bucle, setBucle] = useState(props.evento?.bucle || false);
    const [visible, setVisible] = useState(props.evento?.visible || false);
    const [reposicionar, setReposicionar] = useState(false);
    const [inicioMin, setInicioMin] = useState(inicio?.min||'00');
    const [inicioSeg, setInicioSeg] = useState(inicio?.seg||'00');
    const [inicioMs, setInicioMs] = useState(inicio?.ms||'00');

    const [finMin, setFinMin] = useState(fin?.min||'00');
    const [finSeg, setFinSeg] = useState(fin?.seg||'00');
    const [finMs, setFinMs] = useState(fin?.ms||'00');
    const intervalRef = useRef(null);

    const [coordX, setCoordX] = useState(props.evento?.x||'');
    const [coordY, setCoordY] = useState(props.evento?.y||'');
    const [tiempoRelativo, setTiempoRelativo] = useState(props.evento?.tiempo_relativo||0);
    const [tiempoBucle, setTiempoBucle] = useState(props.evento?.tiempo_bucle||0);
    const STEP = 100;
    const MAX = 60000;
    const MIN = 0;


    const schema = yup.object().shape({
        nombre: yup.string().required("El nombre es obligatorio"),
        nodo_padre: yup.string().required("Debes seleccionar un evento padre"),
    });

    useEffect(() => {
        console.log("[EVENTO]1");
        console.log(props.evento)

        setNombre(props.evento?.nombre || "");

        if(props.evento){
            // Calcular valores desde tiempo_inicio
            const inicio = props.evento.tiempo_inicio ?? 0;
            const inicioMin = Math.floor(inicio / 60000);
            const inicioSeg = Math.floor((inicio % 60000) / 1000);
            const inicioMs = inicio % 1000;

            setInicioMin(String(inicioMin).padStart(2, "0"));
            setInicioSeg(String(inicioSeg).padStart(2, "0"));
            setInicioMs(String(inicioMs).padStart(3, "0"));

            // Calcular valores desde tiempo_final
            const fin = props.evento.tiempo_final ?? 0;
            const finMin = Math.floor(fin / 60000);
            const finSeg = Math.floor((fin % 60000) / 1000);
            const finMs = fin % 1000;

            setFinMin(String(finMin).padStart(2, "0"));
            setFinSeg(String(finSeg).padStart(2, "0"));
            setFinMs(String(finMs).padStart(3, "0"));

            setCoordX(props.evento.x);
            setCoordY(props.evento.y);

            setBucle(props.evento.bucle);
            setReposicionar(props.evento.reposicionar);
            setVisible(props.evento.visible);
            setTiempoRelativo(props.evento.tiempo_relativo);
            setSelectedEvent(props.evento.nodo_padre);
            setTiempoBucle(props.evento.tiempo_bucle);
        }


    }, [props.evento]);

    const stopChangingTime = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };


    const guardar = async () => {
        try {
            // Validar nombre y evento padre
            await schema.validate({ nombre, nodo_padre: selectedEvent }, { abortEarly: false });

            const tiempo_inicio = parseInt(inicioMin) * 60000 + parseInt(inicioSeg) * 1000 + parseInt(inicioMs);
            const tiempo_final = parseInt(finMin) * 60000 + parseInt(finSeg) * 1000 + parseInt(finMs);

            const evento = {
                nombre: nombre.trim(),
                nodo_padre: selectedEvent || null,
                tiempo_inicio,
                tiempo_final,
                tiempo_bucle: parseInt(tiempoBucle) || 0,
                tiempo_relativo: parseInt(tiempoRelativo) || 0,
                x: parseFloat(coordX) || 0,
                y: parseFloat(coordY) || 0,
                bucle: !!bucle,
                reposicionar: !!reposicionar,
                visible: !!visible
            };

            props.guardandoEvento(evento);

        } catch (error) {
            if (error.inner) {
                const mensajes = error.inner.map(e => `• ${e.message}`).join('\n');
                alert("Errores en el formulario:\n\n" + mensajes);
            } else {
                alert("Error inesperado en la validación.");
            }
        }
    };

    return (
        <div className="container-fluid">
            {/* Fila completa: Evento padre */}
            <div className="mb-2">
                <label className="form-label">Evento padre</label>
                <select
                    className="form-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                required={true}>
                    <option value="">Seleccionar evento padre </option>
                    <option value="Nodo_Default">Nodo Default</option>
                    {props.eventoAnimacion.edicion.eventos
                        .filter(ev => ev.evento._id !== props.evento?._id)
                        .map((ev) => (
                            <option key={ev.evento._id} value={ev.evento.nombre}>
                                {ev.evento.nombre}
                            </option>
                        ))}
                </select>
            </div>

            {/* Fila completa: Nombre */}
            <div className="mb-2">
                <label className="form-label">Nombre</label>
                <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del evento"
                    required={true}
                />
            </div>

            {/* Fila: Tiempo de inicio y fin */}
            <div className="row mb-2">
                <div className="col-md-6">
                    <label className="form-label">Tiempo de inicio</label>
                    <div className="d-flex gap-2">
                        <input type="text" className="form-control" placeholder="mm" value={inicioMin} onChange={(e) => setInicioMin(e.target.value)} />
                        <span>:</span>
                        <input type="text" className="form-control" placeholder="ss" value={inicioSeg} onChange={(e) => setInicioSeg(e.target.value)} />
                        <span>:</span>
                        <input type="text" className="form-control" placeholder="ms" value={inicioMs} onChange={(e) => setInicioMs(e.target.value)} />
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label">Tiempo de fin</label>
                    <div className="d-flex gap-2">
                        <input type="text" className="form-control" placeholder="mm" value={finMin} onChange={(e) => setFinMin(e.target.value)} />
                        <span>:</span>
                        <input type="text" className="form-control" placeholder="ss" value={finSeg} onChange={(e) => setFinSeg(e.target.value)} />
                        <span>:</span>
                        <input type="text" className="form-control" placeholder="ms" value={finMs} onChange={(e) => setFinMs(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Fila: Tiempo bucle y tiempo relativo */}
            <div className="row mb-2">
                <div className="col-md-6">
                    <label className="form-label">Tiempo bucle (ms)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={tiempoBucle}
                        onChange={(e) => setTiempoBucle(e.target.value)}
                        placeholder="Ej: +500ms o -1s"
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label">Tiempo relativo</label>
                    <input
                        type="text"
                        className="form-control"
                        value={tiempoRelativo}
                        onChange={(e) => setTiempoRelativo(e.target.value)}
                        placeholder="Ej: +500ms o -1s"
                    />
                </div>
            </div>

            {/* Fila: Coordenadas */}
            <div className="row mb-2">
                <div className="col-md-6">
                    <label className="form-label">Coordenada X</label>
                    <input
                        type="number"
                        className="form-control"
                        value={coordX}
                        onChange={(e) => setCoordX(e.target.value)}
                        placeholder="Ej: 100"
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label">Coordenada Y</label>
                    <input
                        type="number"
                        className="form-control"
                        value={coordY}
                        onChange={(e) => setCoordY(e.target.value)}
                        placeholder="Ej: 200"
                    />
                </div>
            </div>

            {/* Fila: Checkboxes en una línea */}
            <div className="mb-2 d-flex gap-4">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="bucleCheck"
                        checked={bucle}
                        onChange={() => setBucle(!bucle)}
                    />
                    <label className="form-check-label" htmlFor="bucleCheck">
                        Bucle
                    </label>
                </div>

                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="reposicionarCheck"
                        checked={reposicionar}
                        onChange={() => setReposicionar(!reposicionar)}
                    />
                    <label className="form-check-label" htmlFor="reposicionarCheck">
                        Reposicionar
                    </label>
                </div>

                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="visibleCheck"
                        checked={visible}
                        onChange={() => setVisible(!visible)}
                    />
                    <label className="form-check-label" htmlFor="visibleCheck">
                        Visible
                    </label>
                </div>
            </div>
            {/* Botón Aplicar */}
            <div className="mt-3 d-flex justify-content-start">
                <button className="btn btn-primary" onClick={guardar}>
                    Guardar
                </button>
            </div>
        </div>
    );
}

export default PanelEventos;
