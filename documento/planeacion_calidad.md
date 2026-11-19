# Mejoras de calidad del motor (nov-2026)

Sale de lo que costó armar las escenas de prueba (P.U.L.S.E, Ferro, Ciudad en ruinas y Lía).

**Regla:** todo es **opcional y aditivo**. Un documento sin los campos nuevos se dibuja exactamente igual que antes. Se comprobó con la regresión visual: los 137 documentos de la base, en 5 instantes cada uno, dan los mismos píxeles antes y después.

## Qué se hizo

| # | Mejora | Dónde | Campo |
|---|---|---|---|
| 1 | **Morphing**: una forma se transforma en otra con la misma cantidad de puntos | `Claves.js` (`formaEn`, `interpolarFiguras`), `GestionEvento._aplicarClaves` | `claves.forma: [{t, v: "<grupo>", interp}]`; en el formato simple, `formas: {k: FORMA}` en la parte |
| 2 | **Jerarquía en escenas**: un objeto dentro de otro (hereda posición, rotación, escala, opacidad y visibilidad) | Compilador (`padre`) | `nodo_padre` = otro objeto + clase `objeto_hijo` |
| 3 | **Orden de los personajes compuestos**: los hijos se dibujan con su padre y no se reordenan por profundidad | (sale de 2, `ordenDibujo` ya lo hacía) | — |
| 4 | **Relleno degradado** lineal y radial | `ImprimirAnimacion.rellenoDe` | `lista_pintado[i].degradado` |
| 5 | **Desenfoque** | `ImprimirAnimacion.pintarGrupoAnimacion` (sombra desplazada, porque node-canvas no tiene `ctx.filter`) | `desenfoque` (px, se hereda) |
| 6 | **Modos de mezcla** | `ImprimirAnimacion` (`MODOS_MEZCLA`) | `mezcla` (se hereda) |
| 7 | **Partículas suaves** | `Fisica.js`, `GestionEvento.dibujarEfectos` | `suave`, `opacidad` y `mezcla` del efecto |
| 8 | **Límite del backend**: de 100 kB a 15 MB | backend `app.js` | — |
| 9 | **Boca desde un audio** (WAV → claves de forma) | `herramientas/labios.mjs` | — |
| 10 | **Regresión visual** de toda la base | `herramientas/pruebas/regresion.mjs` | — |

Backend: el esquema (`modelo/Animacion.js`) suma `desenfoque`, `mezcla` y `lista_pintado.degradado`; sin eso, Mongoose los descartaría al guardar. `claves` ya era `Mixed`.

## Decisiones

- **Las formas de destino son grupos hermanos ocultos** (`<parte>~<clave>`, clase `forma`) y no datos escondidos dentro del grupo. Así se pueden ver y editar en el editor de dibujo como cualquier grupo, y el descompilador los recupera.
- **Morphing por índice de figura:** se interpolan todos los atributos numéricos de la figura i con los de la figura i de la otra forma. Si la cantidad o el tipo no coinciden, salta a la mitad del tramo y el validador avisa.
- **El desenfoque usa la sombra del canvas:** la forma se dibuja 20000 px fuera de pantalla y su sombra borrosa cae en el lugar. Se ve igual en el navegador y en el render de Node. Como la sombra es de un solo color, con desenfoque el degradado se ignora.
- **La boca desde audio no usa servicios externos:** LPC de orden ≈ sr/1000 + 2 para los formantes, comparación logarítmica con vocales de referencia del español (F2 pesa más, porque en voces agudas el F1 se corre al armónico cercano), fricativas por cruces por cero y energía aguda, y "m" como caída breve del volumen respecto de lo que la rodea.
- **No se tocó la precisión de posición** (el motor redondea a enteros con `parseInt`): cambiarla movería medio píxel todas las escenas existentes.

## Pendiente / no hecho

- **Editor (interfaz):** no hay controles para `forma`, `formas`, `degradado`, `desenfoque`, `mezcla` ni `padre`. Se usan desde el formato simple y se ven en el editor. Las partículas sí muestran sus parámetros nuevos en el inspector, porque salen de `TIPOS_EFECTO`.
- **No se probó en el navegador**, porque la sesión vence. Solo se probó con el render de Node, que usa el mismo `ImprimirAnimacion`.
- **Morphing de color:** se interpolan los puntos, no los colores del pintado.
- **La boca desde audio solo lee WAV.** Se probó con voces sintéticas y no con una voz real grabada.
- La voz sintética de "Lía habla" casi no tiene energía por encima de 500 Hz, y por eso suena apagada. Se puede rehacer con resonadores en cascada, como la voz de `pruebas/labios.test.mjs`.
- ~~**Subpíxel** (posiciones con decimales) como opción por escena.~~ Hecho: `precision: "decimal"` (ver `planeacion_capacidades.md`, "Después de las fases").

## Uso real: "Lía 2"

Ver `planeacion_rostro.md`. Lo que se aprendió:
- conviene preferir manchas con degradado radial antes que desenfoques grandes;
- `reporte.mjs` dibuja con un contexto falso, así que el desenfoque se salta si `getTransform()` no devuelve una matriz.

## Pruebas

- `node --test herramientas/pruebas/`: 30 pruebas, entre ellas morphing, jerarquía, estilo y labios.
- `node herramientas/pruebas/prueba_mejoras.mjs`: escena en memoria con todo lo nuevo. Deja la hoja de cuadros en `/tmp/render/mejoras.png`.
- `node herramientas/pruebas/regresion.mjs guardar|comparar <archivo>`.
- `node herramientas/pruebas/render_memoria.mjs <carpeta de ejemplo> --t …`: compila y dibuja sin guardar nada en la base.
