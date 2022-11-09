function Register(){
    return(
        <div className="container">

            <div className="outer">
                <div className="middle">
                    <div className="inner">
                        <div className="row">
                            <div className="col">

                            </div>
                            <div className="col">
                                <div className="card">
                                    <div className="card-body ">
                                        <h2 className="fw-bold mb-2 text-uppercase">Registrar</h2>
                                        <form action="/register" method="POST">
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputEmail1" className="form-label">Email
                                                    address</label>
                                                <input name="email" id="email" type="email" className="form-control"
                                                       id="exampleInputEmail1" aria-describedby="emailHelp"
                                                       required />

                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputPassword1"
                                                       className="form-label">Password</label>
                                                <input type="password" name="password" id="password"
                                                       className="form-control" id="exampleInputPassword1"
                                                       minLength="6" required  />
                                            </div>

                                            <button type="submit" href="index.html" className="btn btn-primary">Submit
                                            </button>

                                        </form>
                                    </div>
                                </div>

                            </div>
                            <div className="col">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register