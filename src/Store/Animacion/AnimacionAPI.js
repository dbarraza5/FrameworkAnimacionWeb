import axios from "axios";

export const obtenerAnimacion = async (token, id_animacion) => {
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

    const axiosInstance = axios.create(config);
    return await axiosInstance.get(url)
    //return await axios(config).get()
    //return await axios(config).get();
}