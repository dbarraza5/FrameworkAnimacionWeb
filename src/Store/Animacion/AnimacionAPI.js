import axios from "axios";

export const obtenerAnimacion = async (token, id_animacion)=>{
        const url = "/api/animacion/id/" + id_animacion;
        const config = {
            method: 'get',
            url: url,
            headers: {
                "Content-Type": "application/json",
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            withCredentials: true
        };

        return await axios(config)
            .then(function (response) {
                //console.log("funciono")
                return response

            })
            .catch(function (response) {
                //console.log("error obtener proyectos")
                //console.log(response.response.data);
                //props.manejadorErrores(response.response.data)
                return response
            });
        //return await axios(config).get();
}