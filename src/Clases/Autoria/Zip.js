// .zip minimo, sin compresion ("store"), sin dependencias (Fase A7: secuencia de PNG).
// Los PNG ya vienen comprimidos, asi que comprimir de nuevo casi no ahorra nada.
//   const zip = new Zip(); zip.agregar("cuadro_0001.png", bytes); const blob = zip.blob();

const TABLA_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

export function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function fechaDos(d) {
    const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return {hora, fecha};
}

export class Zip {
    constructor() { this.partes = []; this.centrales = []; this.offset = 0; }

    agregar(nombre, datos, fecha = new Date()) {
        const n = new TextEncoder().encode(nombre);
        const crc = crc32(datos), {hora, fecha: dia} = fechaDos(fecha);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);       // firma
        local.setUint16(4, 20, true);               // version necesaria
        local.setUint16(6, 0x0800, true);           // nombres en UTF-8
        local.setUint16(8, 0, true);                // sin compresion
        local.setUint16(10, hora, true);
        local.setUint16(12, dia, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, datos.length, true);
        local.setUint32(22, datos.length, true);
        local.setUint16(26, n.length, true);
        local.setUint16(28, 0, true);
        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, 0x02014b50, true);
        central.setUint16(4, 20, true);
        central.setUint16(6, 20, true);
        central.setUint16(8, 0x0800, true);
        central.setUint16(10, 0, true);
        central.setUint16(12, hora, true);
        central.setUint16(14, dia, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, datos.length, true);
        central.setUint32(24, datos.length, true);
        central.setUint16(28, n.length, true);
        central.setUint32(42, this.offset, true);   // donde empieza su cabecera local
        this.partes.push(new Uint8Array(local.buffer), n, datos);
        this.centrales.push(new Uint8Array(central.buffer), n);
        this.offset += 30 + n.length + datos.length;
    }

    blob() {
        const tam = this.centrales.reduce((s, p) => s + p.length, 0);
        const fin = new DataView(new ArrayBuffer(22));
        const cantidad = this.centrales.length / 2;
        fin.setUint32(0, 0x06054b50, true);
        fin.setUint16(8, cantidad, true);
        fin.setUint16(10, cantidad, true);
        fin.setUint32(12, tam, true);
        fin.setUint32(16, this.offset, true);
        return new Blob([...this.partes, ...this.centrales, new Uint8Array(fin.buffer)], {type: "application/zip"});
    }
}
