import ButtonNav from "../EditorMapa/ButtonNav";

function NavEditorAnimacion({children}){

    const graph = {
        nodes: [
            { id: 1, label: "Node 1", title: "node 1 tootip text" },
            { id: 2, label: "Node 2", title: "node 2 tootip text" },
            { id: 3, label: "Node 3", title: "node 3 tootip text" },
            { id: 4, label: "Node 4", title: "node 4 tootip text" },
            { id: 5, label: "Node 5", title: "node 5 tootip text" }
        ],
        edges: [
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 2, to: 4 },
            { from: 2, to: 5 }
        ]
    };

    const options = {
        layout: {
            hierarchical: true
        },
        edges: {
            color: "#000000"
        },
        height: "500px"
    };

    const events = {
        select: function(event) {
            var { nodes, edges } = event;
            console.log(nodes)
        }
    };

    return (<div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <ButtonNav className="nav-link active" id="home-tab" data-bs-target="#home-tab-pane">Figuras</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="profile-tab" data-bs-target="#profile-tab-pane">Movimientos</ButtonNav>
            </li>
            <li className="nav-item" role="presentation">
                <ButtonNav id="contact-tab" data-bs-target="#contact-tab-pane">Composicion</ButtonNav>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane" role="tabpanel"
                 aria-labelledby="home-tab"
                 tabIndex="0">{children}
            </div>
            <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel"
                 aria-labelledby="profile-tab"
                 tabIndex="1">


            </div>
            <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel"
                 aria-labelledby="contact-tab"
                 tabIndex="2">
                figuras
            </div>
        </div>
    </div>)
}

export default NavEditorAnimacion