import ButtonNav from "./ButtonNav";

const {Component} = require("react");

const style ={
    border: "1px solid black"
}
class NavEditor extends Component {
    render() {
        return (
            <div>
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <ButtonNav className="nav-link active" id="home-tab" data-bs-target="#home-tab-pane">Archivos</ButtonNav>
                    </li>
                    <li className="nav-item" role="presentation">
                        <ButtonNav id="profile-tab" data-bs-target="#profile-tab-pane">Objetos</ButtonNav>
                    </li>
                    <li className="nav-item" role="presentation">
                        <ButtonNav id="contact-tab" data-bs-target="#contact-tab-pane">Mods</ButtonNav>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div className="tab-pane fade show active" id="home-tab-pane" role="tabpanel"
                         aria-labelledby="home-tab"
                         tabIndex="0">1
                    </div>
                    <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel"
                         aria-labelledby="profile-tab"
                         tabIndex="1">
                        {this.props.children}
                    </div>
                    <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel"
                         aria-labelledby="contact-tab"
                         tabIndex="2">
                        3
                    </div>
                </div>
            </div>
        )
    }
}

export default NavEditor