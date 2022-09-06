const PI =3.1415926535897932384626433832795

class Fisica{

    static radianes(angulo)
    {
        return (angulo / 180.0)*PI;
    }

    static distanciaEntreDosPuntos(x1, y1, x2, y2)
    {
        return Math.sqrt(Math.pow(x2-x1, 2)+Math.pow(y2-y1,2));
    }

    static angulo_recta( x1,  y1,  x2,  y2)
    {
        let xDiff = x2-x1;
        let yDiff = y2-y1;
        return Math.atan2(yDiff, xDiff)*180.0/PI;
    }


    static radianes_angulo(radianes) {
        return radianes * 180 / Math.PI;
    }

    static angulo_radianaes(grados) {
        return grados * Math.PI / 180;
    }
}

export default Fisica