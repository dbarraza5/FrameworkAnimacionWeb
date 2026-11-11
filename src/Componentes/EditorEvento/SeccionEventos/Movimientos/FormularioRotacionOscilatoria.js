// Rotacion de vaiven: angulo = amplitud * sin(frecuencia * t), alrededor de un pivote
// relativo al centro del grupo (igual que la Rotacion normal).
function FormularioRotacionOscilatoria({ datos, setDatos }) {
    const campo = (nombre, etiqueta, ayuda) => (
        <div className="mb-3">
            <label className="form-label">{etiqueta}</label>
            <input
                type="number"
                className="form-control"
                value={datos[nombre] ?? ''}
                onChange={(e) => setDatos({ ...datos, [nombre]: e.target.value })}
            />
            {ayuda && <div className="form-text">{ayuda}</div>}
        </div>
    );

    return (
        <>
            {campo("amplitud", "Amplitud (grados)", "Angulo maximo hacia cada lado. Negativo = empieza hacia el otro lado (contrafase).")}
            {campo("frecuencia", "Frecuencia (rad/s)", "6.28 = un vaiven completo por segundo.")}
            {campo("pivoteX", "Pivote X", "Relativo al centro del grupo.")}
            {campo("pivoteY", "Pivote Y", "Relativo al centro del grupo (ej. negativo = parte de arriba, para una cadera).")}
        </>
    );
}

export default FormularioRotacionOscilatoria
