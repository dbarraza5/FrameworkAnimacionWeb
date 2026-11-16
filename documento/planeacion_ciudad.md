# Plan: proyecto "Ciudad"

> Pedido del usuario (2026-11-16): un proyecto nuevo, más complejo que el de ejemplo, con una ciudad hecha con más polígonos: edificios, un autobús, 2 autos distintos y más personas.
> Se arma con las herramientas de autoría ([`planeacion_autoria_asistida.md`](planeacion_autoria_asistida.md), guía: [`guia_armar_escenas.md`](guia_armar_escenas.md)).

## Decisiones

- **Lo nuevo va en generadores** (`src/Clases/Autoria/Generadores.js`), no en dibujos sueltos. Así sirven para cualquier proyecto, quedan en *Biblioteca → Generar…* y los cubren las pruebas.
- Los generadores existentes ganan **variantes por parámetro** (modelo de auto, peinado y vestido de persona) en vez de generadores nuevos casi iguales. Con los valores por defecto dibujan exactamente lo mismo que antes.
- Los parámetros con valores fijos se declaran en `opciones` (por ejemplo `estilo: ["clasico", "moderno"]`). El compilador los valida y el formulario *Generar…* los muestra como lista.
- Todo vive en un **proyecto nuevo, "Ciudad"**: las instancias solo pueden usar assets del mismo proyecto.

## Fases

### C1 — Generadores nuevos y variantes
- `edificio`: ancho, pisos, alto de piso, columnas de ventanas, estilo (`clasico`: ventanas con alféizar, cornisa, toldo, vitrinas, tanque y antena; `moderno`: bandas de vidrio y parteluces), colores y ventanas encendidas.
- `autobus`: carrocería, franja, fila de ventanas, parabrisas, puerta, letrero, parachoques y ruedas que giran.
- `parada`: refugio de autobús con techo, vidrio, banco y cartel.
- `auto`: `modelo` = `sedan` (el de siempre), `camioneta` o `deportivo`.
- `persona`: `peinado` = `corto` (el de siempre), `largo` o `gorra`, más `vestido`.
- Verificación: `npm run pruebas` (todos los generadores compilan y vuelven exactos), y los valores por defecto de auto y persona no cambian el dibujo.

### C2 — Proyecto y assets
- Crear el proyecto "Ciudad" desde la interfaz y una llave de asistente para él.
- Crear unos 20 assets con los generadores: calle, 6 edificios (cerca y lejos), autobús, parada, 2 autos, 6 personas (4 que caminan y 2 de pie), árbol, farol, nube, sol y pájaro.

### C3 — Escena "Ciudad (escena)"
- 16 s, con profundidad.
- **Fondo:** edificios lejanos más chicos y desaturados (plano −2) y edificios cercanos (plano −1), con árboles y faroles en la vereda.
- **Autobús:** llega frenando a la parada, espera, y una persona sube (se desvanece en la puerta); después arranca.
- **Autos:** un deportivo pasa rápido antes del autobús, y una camioneta va por el otro carril en sentido contrario.
- **Personas:** caminan por las dos veredas en ambos sentidos (una más chica, como niño); dos esperan en la parada.
- **Cámara:** acompaña al autobús. Además, pájaros y nubes.

### C4 — Verificación y entrega
- Render en varios instantes y un GIF; reporte de escena sin avisos importantes; abrir en el editor (modo prueba) y comprobar que carga.
- Entregar los ids, cómo verla y qué no se probó.

## Estado

- [x] C1 · [x] C2 · [x] C3 · [x] C4 (2026-11-16)

## Alcance realizado (2026-11-16)

- **C1:**
  - generadores `edificio` (clásico y moderno), `autobus` y `parada`;
  - `auto` con `modelo` (sedan, camioneta, deportivo) y `persona` con `peinado` (corto, largo, gorra) y `vestido`;
  - `opciones` validadas por el compilador y mostradas como lista en *Generar…*;
  - la rueda que gira es una función compartida (auto y autobús).
  - Pruebas: 12/12. Incluyen cada opción de cada generador (ida y vuelta exacta) y, contra la base, que el auto, la persona, la casa, el árbol y el farol por defecto tienen las mismas partes, posiciones y cajas (±1,5 px) que los assets de ejemplo.
- **C2:**
  - proyecto **Ciudad** `6afb111e2a252769672eb496`, creado desde la interfaz;
  - 22 assets creados con la llave desde [`herramientas/ejemplos/ciudad/assets.json`](../herramientas/ejemplos/ciudad/assets.json).
- **C3:** **Ciudad (escena)** `6afb122d2a252769672edde2`, desde [`herramientas/ejemplos/ciudad/escena.json`](../herramientas/ejemplos/ciudad/escena.json):
  - 53 objetos: 12 edificios cercanos y 10 lejanos, autobús, 2 autos, 7 personas (una es un niño), parada, árboles, faroles, pájaros y nubes;
  - escape del autobús con partículas.
  - El reporte encontró que `joven_frente` nunca entraba en cuadro: se dio vuelta y se actualizó (respaldo: versión 1).
- **C4:**
  - render en 6 instantes revisado; el reporte sale sin avisos;
  - el editor real la abre en 1,6 s (1238 grupos con las partes de las instancias);
  - GIF completo: 192 cuadros a 640×360 en 18,5 s.
  - La llave del asistente quedó **revocada** al terminar.

**Rendimiento (no resuelto):** dibujar un cuadro completo de esta escena cuesta 60–90 ms, frente a 18–40 ms de la escena de ejemplo (225 grupos). En el editor se estima que se verá a unos 12–18 cuadros por segundo. No se pudo medir directo, porque el navegador controlado frena `requestAnimationFrame` a ~1 por segundo también en la escena de ejemplo. Exportar video no se ve afectado. Posible mejora genérica: guardar en un bitmap el dibujo de las instancias que no cambian (edificios, calle) y redibujarlo solo cuando cambian.

## C5 — Sonido (2026-11-16)

Con la integración de sonido (`planeacion_sonido.md`):
- **9 sonidos sintetizados (provisorios)** en el proyecto, todos `listo`: Ambiente de ciudad (16 s, bucle), Motor de autobús, Acelerar autobús, Freno de aire, Puertas del autobús, Auto pasando, Motor de camioneta, Bocina y Pájaros. La nota de cada uno dice "sintetizado (provisorio)". Para cambiarlos por grabaciones reales: **Reemplazar** en la biblioteca, sin tocar la escena.
- **Escena:** 14 clips en `escena.sonidos` (`ejemplos/ciudad/escena.json`), con la escena marcada "lleva", `EventoGeneral` "no lleva" y el efecto *Escape del autobús* "no lleva":
  - ambiente en bucle; el deportivo que pasa al empezar; pájaros a 1,5, 9,5 y 13,5 s;
  - autobús: motor al llegar (recorte de 0 a 5 s), freno a 4,7 s, motor en ralentí más bajo, puertas a 5,4 y 7,9 s, acelerar a 8,5 s y motor alejándose desde 11,4 s;
  - camioneta: motor desde 6,5 s y bocina a 8,2 s.
- Los 22 assets de la ciudad (todos estáticos) quedaron con `EventoGeneral` marcado "no lleva". El seguimiento de la escena queda en 0 avisos.
- Verificado en el editor: los 9 audios se decodifican y los 14 clips se programan en sus instantes.
