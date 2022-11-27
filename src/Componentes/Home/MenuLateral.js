function MenuLateral(props) {
    return (
        <div>
            <div className="offcanvas offcanvas-start w-25" tabIndex="-1" id="offcanvas" data-bs-keyboard="false"
                 data-bs-backdrop="false">
                <div className="bg-dark">
                    <div
                        className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
                        <a href="/"
                           className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                            <span className="fs-5 d-none d-sm-inline">Menu</span>
                        </a>
                        <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start"
                            id="menu">
                            <li className="nav-item">
                                <a href={() => false} className="nav-link align-middle px-0">
                                    <i className="fs-4 bi-house"></i> <span
                                    className="ms-1 d-none d-sm-inline">Home</span>
                                </a>
                            </li>
                            <li>
                                <a href="#submenu1" data-bs-toggle="collapse" className="nav-link px-0 align-middle">
                                    <i className="fs-4 bi-speedometer2"></i> <span
                                    className="ms-1 d-none d-sm-inline">Dashboard</span> </a>
                                <ul className="collapse show nav flex-column ms-1" id="submenu1" data-bs-parent="#menu">
                                    <li className="w-100">
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Item</span> 1 </a>
                                    </li>
                                    <li>
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Item</span> 2 </a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a href={() => false} className="nav-link px-0 align-middle">
                                    <i className="fs-4 bi-table"></i> <span
                                    className="ms-1 d-none d-sm-inline">Orders</span></a>
                            </li>
                            <li>
                                <a href="#submenu2" data-bs-toggle="collapse" className="nav-link px-0 align-middle ">
                                    <i className="fs-4 bi-bootstrap"></i> <span
                                    className="ms-1 d-none d-sm-inline">Bootstrap</span></a>
                                <ul className="collapse nav flex-column ms-1" id="submenu2" data-bs-parent="#menu">
                                    <li className="w-100">
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Item</span> 1</a>
                                    </li>
                                    <li>
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Item</span> 2</a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a href="#submenu3" data-bs-toggle="collapse" className="nav-link px-0 align-middle">
                                    <i className="fs-4 bi-grid"></i> <span
                                    className="ms-1 d-none d-sm-inline">Products</span> </a>
                                <ul className="collapse nav flex-column ms-1" id="submenu3" data-bs-parent="#menu">
                                    <li className="w-100">
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Product</span> 1</a>
                                    </li>
                                    <li>
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Product</span> 2</a>
                                    </li>
                                    <li>
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Product</span> 3</a>
                                    </li>
                                    <li>
                                        <a href={() => false} className="nav-link px-0"> <span
                                            className="d-none d-sm-inline">Product</span> 4</a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a href={() => false} className="nav-link px-0 align-middle">
                                    <i className="fs-4 bi-people"></i> <span
                                    className="ms-1 d-none d-sm-inline">Customers</span> </a>
                            </li>
                        </ul>
                        <hr/>
                        <div className="dropdown pb-4">
                            <a href={() => false}
                               className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                               id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                                <img src="https://github.com/mdo.png" alt="hugenerd" width="30" height="30"
                                     className="rounded-circle"/>
                                <span className="d-none d-sm-inline mx-1">loser</span>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-dark text-small shadow">
                                <li><a className="dropdown-item" href={() => false}>New project...</a></li>
                                <li><a className="dropdown-item" href={() => false}>Settings</a></li>
                                <li><a className="dropdown-item" href={() => false}>Profile</a></li>
                                <li>
                                    <hr className="dropdown-divider"/>
                                </li>
                                <li><a className="dropdown-item" href={() => false}>Sign out</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid">
                <div className="row">
                    <div className="col min-vh-100 py-3">

                        <button className="btn float-end" data-bs-toggle="offcanvas" data-bs-target="#offcanvas"
                                role="button">
                            <i className="bi bi-arrow-right-square-fill fs-3" data-bs-toggle="offcanvas"
                               data-bs-target="#offcanvas"></i>
                        </button>
                        {props.children}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default MenuLateral;