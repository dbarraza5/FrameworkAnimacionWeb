import {useNavigate} from "react-router-dom";
import axios from "axios";

function MenuLateral(props) {
    const setUser = props.setUser;

    const navigate = useNavigate();

    const logout= async()=>{
        try {
            const config = {
                method: 'get',
                url: "/user/logout",
                headers: {
                    "Content-Type": "application/json",
                    'Accept': 'application/json'
                },
                withCredentials: true
            };

            let res = await axios(config)
                .then(function (response) {
                    //console.log("IR AL LOGIN KBRON")
                    props.removeCookieUser()
                    navigate("/")
                })
                .catch(function (error) {
                    console.log("error")
                    console.log(error);
                });
        } catch (err) {
            //console.log(err);
        }
    }

    const style = {
        //width: "280px"
    }

    return(
        <div className="offcanvas offcanvas-start w-25" tabIndex="-1" id="offcanvas" data-bs-keyboard="false"
             data-bs-backdrop="false">
            <div className="d-flex flex-column flex-shrink-0 p-3 min-vh-100 bg-light" style={style}>
                <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
                    <svg className="bi me-2" width="40" height="32">

                    </svg>
                    <span className="fs-4">Sidebar</span>
                </a>
                <hr/>
                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item">
                        <a onClick={() => navigate("/")} className="nav-link ">
                            <svg className="bi me-2" width="16" height="16">

                            </svg>
                            <i className="fs-4 bi-house"></i> <span
                            className="ms-1 d-none d-sm-inline">Home</span>
                        </a>
                    </li>
                    <li>
                        <a href={() => false} className="nav-link link-dark">
                            <svg className="bi me-2" width="16" height="16">

                            </svg>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a href={() => false} className="nav-link link-dark">
                            <svg className="bi me-2" width="16" height="16">

                            </svg>
                            Orders
                        </a>
                    </li>
                    <li>
                        <a href={() => false} className="nav-link link-dark">
                            <svg className="bi me-2" width="16" height="16">

                            </svg>
                            Products
                        </a>
                    </li>
                    <li>
                        <a href={() => false} className="nav-link link-dark">
                            <svg className="bi me-2" width="16" height="16">

                            </svg>
                            Customers
                        </a>
                    </li>
                </ul>
                <hr/>
                <div className="dropdown">
                    <a href={() => false} className="d-flex align-items-center link-dark text-decoration-none dropdown-toggle"
                       id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="https://github.com/mdo.png" alt="" className="rounded-circle me-2" width="32"
                             height="32"/>
                        <strong>mdo</strong>
                    </a>
                    <ul className="dropdown-menu text-small shadow" aria-labelledby="dropdownUser2">
                        <li><a className="dropdown-item" href={() => false}>New project...</a></li>
                        <li><a className="dropdown-item" href={() => false}>Settings</a></li>
                        <li><a className="dropdown-item" href={() => false}>Profile</a></li>
                        <li>
                            <hr className="dropdown-divider"/>
                        </li>
                        <li><a className="dropdown-item" onClick={() => logout()}>Sign out</a></li>
                    </ul>
                </div>
            </div>
        </div>

    )
}

export default MenuLateral;