import ElementoCheckBox from "./ElementoCheckBox";

const {Component} = require("react");


class ListadoElemento extends Component{
    render() {
        const lista_elemento = this.props.lista_elemento
        const resto = (lista_elemento.length % 2)
        const size_list = lista_elemento.length - resto
        const lista_checkbox = []
        for(let i=0; i<size_list; i+=2){
            lista_checkbox.push(
                <div className="row">
                    <div className="col">
                        <ElementoCheckBox obj={lista_elemento[i]}/>
                    </div>
                    <div className="col">
                        <ElementoCheckBox obj={lista_elemento[i+1]}/>
                    </div>
                </div>
            )
        }
        if(resto>0){
            lista_checkbox.push(
                <div className="row">
                    <div className="col">
                        <ElementoCheckBox obj={lista_elemento[lista_elemento.length - 1]}/>
                    </div>
                    <div className="col">
                    </div>
                </div>
            )
        }
        //<p>{lista_elemento[i].ID} - {lista_elemento[i+1].ID}</p>
        console.log(lista_checkbox)
        return(
            <div>
                {lista_checkbox}
            </div>
        )
    }
}

export default ListadoElemento