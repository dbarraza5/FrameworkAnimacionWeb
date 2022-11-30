import MenuLateral from "./MenuLateral";
import {useNavigate} from "react-router-dom";

function Home(props){
    return (
        <div>
            <MenuLateral {...props}/>
            <div className="container-xl">
                <div className="row">
                    <div className="col min-vh-100 py-3">
                        <button className="btn float-end" data-bs-toggle="offcanvas" data-bs-target="#offcanvas"
                                role="button">
                            <i className="bi bi-three-dots-vertical fs-3" data-bs-toggle="offcanvas"
                               data-bs-target="#offcanvas"></i>
                        </button>
                        {props.children}
                    </div>
                </div>
            </div>
        </div>

    )
    /*return(<div>
        <MenuBar {...props}/>
    </div>)*/
}

export default Home