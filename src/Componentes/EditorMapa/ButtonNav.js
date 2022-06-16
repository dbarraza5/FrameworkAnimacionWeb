const {Component} = require("react");


class ButtonNav extends Component{
    render() {
        console.log(this.props)
        return (
            <button className="nav-link" {...this.props} data-bs-toggle="tab"
                    type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">{this.props.children}
            </button>
        );
    }
}

export default ButtonNav