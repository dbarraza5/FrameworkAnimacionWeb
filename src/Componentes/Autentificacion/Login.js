import {useState} from "react"
import axios from "axios"
import {Link} from "react-router-dom";
import config from "../../config";
import useCookies from "react-cookie/cjs/useCookies";


function Login(props) {
    const user = props.user;
    const setUser = props.setUser;
    const [cookies, setCookie, removeCookie] = useCookies(['cookie-usuario']);

    const [datos, setDatos] = useState({
        email: "",
        password: ""
    })

    const enviarFormulario = async () => {
        console.log("enviar formulario")
        console.log(datos)
        const form = document.getElementById("form-login")

        if (form.checkValidity()) {
            console.log("form validado");
            try {
                let res = await axios.post(config.SERVIDOR_BACKEND + "/user/login", datos)
                    .then(function (response) {
                        console.log("funciono")
                        console.log(response.data);
                        console.log(cookies)
                        setCookie( "usuario",response.data, "/");
                        setUser(response.data);
                    })
                    .catch(function (error) {
                        console.log("error")
                        console.log(error);
                    });
            } catch (err) {
                //console.log(err);
            }
        } else {
            console.log("form invalidado")
            const btn = document.getElementById("agente-submit")
            btn.click();
        }
    }

    const ingresarValorCampo = (e) => {
        let {name, value} = e.target;
        let nuevoDatos = {...datos, [name]: value};
        setDatos(nuevoDatos)
    }

    return (<div className="container">

        <div className="outer">
            <div className="middle">
                <div className="inner">
                    <div className="row">
                        <div className="col">

                        </div>
                        <div className="col">
                            <div className="card">
                                <div className="card-body ">
                                    <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
                                    <form action="" onSubmit={(e) => e.preventDefault()} id="form-login">
                                        <div className="mb-3">
                                            <label htmlFor="exampleInputEmail1" className="form-label">Email
                                                address</label>
                                            <input type="email" name="email" id="email" className="form-control"
                                                   id="exampleInputEmail1" aria-describedby="emailHelp"
                                                   onChange={ingresarValorCampo}
                                                   required/>

                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="exampleInputPassword1"
                                                   className="form-label">Password</label>
                                            <input type="password" className="form-control" id="exampleInputPassword1"
                                                   name="password" id="password"
                                                   onChange={ingresarValorCampo}
                                                   required/>
                                        </div>

                                        <button className="btn btn-primary" onClick={enviarFormulario}>Submit</button>
                                        <p>Not a member? <Link to="/register">Register</Link></p>

                                        <button type="submit" id="agente-submit" hidden>subir</button>
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
    </div>)
}

export default Login;