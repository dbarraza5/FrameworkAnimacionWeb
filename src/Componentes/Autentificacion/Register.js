import {useEffect, useState} from "react";
import axios from "axios";
import config from "../../config";

import { useNavigate  } from "react-router-dom"

function Register(props){

    const [datos, setDatos] = useState({
        email: "",
        password: "",
        name: "",
        surname: ""
    })
    const navigate = useNavigate();
    const [ir_login, setIrLogin] = useState(false);
    useEffect(() => {
        if(ir_login){
            props.setRegistrado(true)
            navigate("/");
        }else{
            props.setRegistrado(false)
        }

    }, [ir_login]);

    const enviarFormulario = async () =>{
        console.log("enviar formulario")
        console.log(datos)
        const form = document.getElementById("form-register")
        //let navigate = useNavigate();
        //navigate("/");



        if (form.checkValidity()){
            console.log("form validado");
            try {
                let res = await axios.post(config.SERVIDOR_BACKEND + "/user/register", datos)
                    .then(function (response) {
                        console.log("funciono")
                        console.log(response.data);
                        setIrLogin(true);
                        //setCookie( "usuario",response.data, "/");
                        //setUser(response.data);
                    })
                    .catch(function (error) {
                        console.log("error")
                        console.log(error);
                    });
            } catch (err) {
                //console.log(err);
            }
        }else {
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
                                        <form action="" onSubmit={(e) => e.preventDefault()} id="form-register">
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputEmail1" className="form-label">Email
                                                    address</label>
                                                <input name="email" id="email" type="email" className="form-control"
                                                       id="exampleInputEmail1" aria-describedby="emailHelp"
                                                       onChange={ingresarValorCampo}
                                                       required />

                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputEmail1" className="form-label">Nombre</label>
                                                <input name="name" id="name" type="text" className="form-control"
                                                       id="exampleInputEmail1" aria-describedby="emailHelp"
                                                       onChange={ingresarValorCampo}
                                                       required />

                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputEmail1" className="form-label">Apellido</label>
                                                <input name="surname" id="surname" type="text" className="form-control"
                                                       id="exampleInputEmail1" aria-describedby="emailHelp"
                                                       onChange={ingresarValorCampo}
                                                       required />

                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="exampleInputPassword1"
                                                       className="form-label">Password</label>
                                                <input type="password" name="password" id="password"
                                                       className="form-control" id="exampleInputPassword1"
                                                       onChange={ingresarValorCampo}
                                                       minLength="6" required  />
                                            </div>

                                            <button className="btn btn-primary" onClick={enviarFormulario}>Submit
                                            </button>
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
        </div>
    )
}

export default Register