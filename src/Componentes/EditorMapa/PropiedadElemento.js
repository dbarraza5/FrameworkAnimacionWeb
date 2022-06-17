import {Component} from "react";


class PropiedadElemento extends Component{

    render() {
        const meta_objetos = this.props.meta_objetos
        return (
            <div className="d-flex align-items-start border">
                <div className="nav flex-column nav-pills me-3" id="objetos_tab" role="tablist"
                     aria-orientation="vertical">
                    {meta_objetos.map((obj, index)=>{
                        const id_ = "v-pills-"+obj.nombre+"-tab"
                        const data_bs_target="#v-pills-"+obj.nombre
                        const clase = index === 0? "nav-link active":"nav-link"
                        return(
                            <button className= {clase}
                                    id={id_} data-bs-toggle="pill" data-bs-target={data_bs_target} type="button"
                                    role="tab" aria-controls="v-pills-{{ objeto.nombre }}"
                                    aria-selected="true">{obj.nombre.toLowerCase()}</button>
                        )
                    })}
                </div>
                <div className="tab-content" id="v-pills-tabContent">
                    {meta_objetos.map((obj, index)=>{
                        const id_ = "v-pills-"+obj.nombre
                        const data_bs_target="#v-pills-"+obj.nombre
                        const clase = index === 0? "tab-pane active":"tab-pane "
                        const id_button = "btn-propiedad-"+obj.nombre
                        return(
                            <div className={clase}  id={id_} role="tabpanel"
                                 aria-labelledby="v-pills-{{ objeto_.nombre }}-tab" tabIndex="0">
                                <div id={"propiedad-"+obj.nombre}>
                                    <button id={id_button} value="none" hidden></button>
                                    <div className="mb-2">
                                        <label htmlFor={"id-"+obj.nombre}
                                               className="form-label">Id</label>
                                        <input className="form-control" type="text" id={"id-"+obj.nombre}
                                               value={this.props.mapa.id_obj_select} autoComplete="off"
                                               disabled/>
                                    </div>
                                    {
                                        Object.keys(obj.atributos).map((name_attr, index)=>{
                                            const tipo = obj.atributos[name_attr]
                                            const id_input = obj.nombre+"-"+name_attr
                                            const valor = this.props.mapa.get_value_attr(this.props.id_seleccionado, name_attr)
                                            if(tipo === "TIPO_INT"){
                                                return (
                                                    <div className="mb-2">
                                                        <label htmlFor={id_input}
                                                               className="form-label">{name_attr}</label>
                                                        <input className="form-control" type="number" id={id_input} key={id_input}
                                                               onChange={(e)=>
                                                                  this.props.edit_elemento_attr(this.props.id_seleccionado, name_attr, e.target.value)}
                                                               autoComplete="off"
                                                               value={valor}
                                                               />
                                                    </div>
                                                )
                                            }
                                            if(tipo === "TIPO_BOOL"){
                                                const id_input = obj.nombre+"-"+name_attr
                                                const seleccionado = parseInt(valor)
                                                return (
                                                    <div className="mb-2">
                                                        <input className="form-check-input" type="checkbox" value=""
                                                               id={id_input}
                                                               onChange={(e)=>
                                                                  this.props.edit_elemento_attr(this.props.id_seleccionado, name_attr, e.target.checked)}
                                                               autoComplete="off" checked={seleccionado === 1? 'checked': ''}/>
                                                        <label className="form-check-label"
                                                               htmlFor={id_input}>
                                                            {name_attr}
                                                        </label>
                                                    </div>
                                                )
                                            }

                                        })
                                    }
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
}

export default PropiedadElemento