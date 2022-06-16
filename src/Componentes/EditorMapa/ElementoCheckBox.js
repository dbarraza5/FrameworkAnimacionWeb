const {Component} = require("react");

class ElementoCheckBox extends Component{
    render() {
        const obj = this.props.obj
        return (
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id={"check-objeto-"+ obj.ID }
                       onChange="setPropiedadObjeto('{{ obj.ID }}')" autoComplete="off"/>
                    <label className="form-check-label" htmlFor={"check-objeto-"+ obj.ID }>
                        {obj.ID}
                    </label>
            </div>
        );
    }
}
export default ElementoCheckBox
