
function CrearGrupo(props){
    return(<div className="mb-3 row">
        <label htmlFor="inputPassword" className="col-sm-4 col-form-label">Nombre del grupo</label>
        <div className="col-sm-8">
            <input type="text" className="form-control" id="inputPassword"/>
        </div>
    </div>)
}

export default CrearGrupo;