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


    static calcularTangente(cx, cy, r, px, py){
        const dx = cx- px;
        const dy = cy -py;
        //angulo de la recta
        const a_r= Math.atan2(dy, dx)
        //distancia entre punto y centro
        const d = Math.sqrt(Math.pow(dx, 2)+ Math.pow(dy,2))
        const a = Math.atan(r/d)


        const g = a+a_r//(a * (180 / Math.PI))+a_r;
        const h = Math.sqrt(Math.pow(d,2)+Math.pow(r,2))//d/Math.cos(a)
        const x = Math.cos(g)*h
        const y = Math.sin(g)*h
        //console.log(x+", "+y)

        const new_x = x+px;
        const new_y = y+py;
        //console.log(new_x+", "+new_y)
        //console.log
        return [a_r, g]
    }

    static rectsColliding(r1, r2) {
        if(r1.w === 0 || r1.h === 0 || r2.w === 0 || r2.h === 0){
            return false;
        }
        let r_1 = {...r1}
        if(r_1.w < 0){
            r_1.x+=r_1.w;
            r_1.w = r_1.w*-1
        }
        if(r_1.h < 0){
            r_1.y+=r_1.h;
            r_1.h = r_1.h*-1
        }
        return !(r_1.x > r2.x + r2.w || r_1.x + r_1.w < r2.x || r_1.y > r2.y + r2.h || r_1.y + r_1.h < r2.y);
    }

    //console.log(calcularTangente(6, 6, 2, 9, 9))
}

export default Fisica