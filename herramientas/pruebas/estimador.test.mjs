// Pruebas del estimador de tiempo restante (src/Clases/Autoria/Estimador.js), con un reloj simulado.
import {test} from "node:test";
import assert from "node:assert/strict";
import {cargarMotor} from "../lib/motor.mjs";

const {Estimador} = await cargarMotor();

test("estima lo que falta a ritmo parejo y no inventa al principio", () => {
    let t = 0;
    const est = Estimador.crearEstimador(() => t);
    assert.equal(est.actualizar(0).restante, null);
    t = 1000; assert.equal(est.actualizar(0.01).restante, null, "muy poca muestra: calculando");
    // 10% por cada 6 s -> 60 s en total
    for (let k = 1; k <= 5; k++) { t = k * 6000; est.actualizar(k / 10); }
    const e = est.actualizar(0.5);
    assert.equal(e.transcurrido, 30000);
    assert.ok(Math.abs(e.restante - 30000) < 3000, `falta ~30 s (±10%), dio ${e.restante}`);
    t = 60000; assert.equal(est.actualizar(1).restante, 0);
});

test("formato de duraciones y texto", () => {
    assert.equal(Estimador.formatoDuracion(42000), "42 s");
    assert.equal(Estimador.formatoDuracion(65000), "1 min 05 s");
    assert.equal(Estimador.formatoDuracion(3723000), "1 h 02 min");
    assert.match(Estimador.textoEstimacion({transcurrido: 5000, restante: null}), /calculando/);
    assert.match(Estimador.textoEstimacion({transcurrido: 5000, restante: 125000}), /Quedan aprox\. 2 min 05 s/);
});
