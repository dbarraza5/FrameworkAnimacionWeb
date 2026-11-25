# Planeación: mejorar la autoría con IA

> Pedido el 2026-11-24. Objetivo: que cualquier IA (Claude, ChatGPT, etc.) arme animaciones con menos prueba y error.
> Sale de lo aprendido en un proyecto largo con versión vertical: costó revisar los cuadros, varios errores los encontró el usuario y la versión vertical se hizo a mano.
> El servidor MCP queda fuera por ahora.
> Se trabaja **una fase a la vez** y el usuario revisa cada una antes de seguir. Cada fase tiene su proyecto de prueba propio ("Fase IA-N - …").

## Fases

| Fase | Punto | Qué | Estado |
|---|---|---|---|
| IA-1 | Ver lo que hizo | Zona en coordenadas del mundo, cajas con nombre, rejilla y lista de objetos por instante, en `render.mjs` y `render_memoria.mjs` | hecha |
| IA-2 | Validador | Más revisiones automáticas en `reporte.mjs`, también para escenas sin guardar | hecha |
| IA-3 | Posiciones relativas | Anclas al cuadro de la cámara y zona segura: la misma escena sirve en 16:9 y 9:16 | hecha |
| IA-4 | Enganches | Puntos con nombre en los assets (mano, cabeza); un objeto de la escena se pega a ellos y sigue sus acciones | hecha |
| IA-5 | Acciones de alto nivel | `caminar`, `mirar`, `tomar`, `plano` en la escena; el compilador las traduce a claves | hecha |
| IA-6 | Correcciones ancladas | En el editor: marcar instante, punto y comentario; la herramienta los lista con un recorte de la zona | hecha, a revisar |

## IA-1 · Que la IA vea lo que hizo

Problema: la hoja de cuadros ya traía el instante, pero
- el `--recorte` era en píxeles del cuadro: cambiaba con `--ancho` y no se podía pedir "la mano del personaje";
- recortar perdía resolución (se agrandaba un pedazo de un cuadro chico);
- para saber qué objeto era qué había que adivinar por el dibujo.

Qué se agrega (opciones nuevas, las de antes siguen igual):
- `--zona x,y,w,h`: dibuja solo esa zona **del mundo**, a la resolución de salida (no es un recorte).
- `--zona objeto:<nombre>[,margen]`: la zona es la caja del objeto en cada instante (sigue al objeto).
- `--cajas`: dibuja encima la caja de cada objeto con su nombre (o `--cajas ana,beto` para algunos).
- `--rejilla 100`: líneas cada 100 unidades del mundo con sus coordenadas, para leer posiciones.
- `--lista`: escribe, por instante, la cámara y los objetos que se ven: caja en el mundo, plano y acción.

Motor: `Render.dibujarCuadro` acepta `zona` (un rectángulo del mundo en vez de la cámara). Va en `src/Clases/Autoria/Render.js`, así que el editor no cambia si no se usa.
Código común de las dos herramientas: `herramientas/lib/vista.mjs`.

**Resultado (2026-11-24):**
- Probado con un proyecto privado: una escena en memoria (cajas, rejilla, lista y zona que sigue a `copa_mesa`) y una escena vertical guardada (zona fija con lista), solo lectura.
- `--lista` mostró al instante lo que antes costaba encontrar: la acción de cada personaje, objetos con opacidad 0 y planos.
- Regresión visual: 391 de 391 cuadros iguales. Pruebas: 101 pasan.
- No se tocó el editor: `zona` es opcional y la exportación no la usa.
- No hubo proyecto de prueba aparte: la fase solo agrega herramientas de lectura.

## IA-2 · Validador

`reporte.mjs` ya revisaba objetos fuera de cámara, física, claves tarde, ocultos y sonido. Se agrega (`herramientas/lib/revisiones.mjs`):
- **Niveles:** `error` (casi seguro un problema), `aviso` (probable), `revisar` (puede ser a propósito). Sale con código 1 si hay errores.
- **Escenas sin guardar:** `reporte.mjs --carpeta <dir> --escena historia_1.json` (los archivos del generador; `herramientas/lib/memoria.mjs`, que también usa `render_memoria.mjs`).
- **Textos** que se salen del cuadro (y por qué lado).
- **Globos** que se tapan entre sí, de alguien que no se dibuja, invisible o fuera de cuadro.
- **Voces que se pisan:** clips "voz …" con la duración del sonido.
- **Partes** (`claves_partes.opacidad`) que se ocultan con su dueño en cuadro y no vuelven (nivel `revisar`).
- **Después del final:** claves de partes, acciones y globos.
- Motor: `Dialogos.js` anota dónde quedó cada globo y texto si existe `m._registro_dialogos` (no cambia el dibujo).
- Arreglo: el reporte usaba un lienzo falso que fallaba con `escena.estilo`; ahora usa uno real de 16 px.

**Resultado (2026-11-24):**
- Escenas reales de un proyecto privado: una da un solo "revisar" (una copa que el personaje deja en la mesa: es a propósito); otra, sin avisos.
- Copia con errores puestos a propósito (`/tmp/ia2_prueba` en el contenedor): detectó a un personaje invisible mientras habla, dos voces que se pisan, una parte que se oculta 6 s antes (el error viejo de `insertarTiempo`) y el texto de créditos que se sale por los dos lados. Código de salida 1.
- **Encontró un error real** en una escena vertical: una estrella (y = −150) queda sobre el borde de arriba del cuadro (y = −114) y se apaga sin verse. Sin corregir: falta el visto bueno del usuario.
- Pruebas: 104 pasan (3 nuevas en `pruebas/revisiones.test.mjs`). Regresión visual: 391 de 391 iguales.

## IA-3 · Posiciones relativas

Módulo nuevo `src/Clases/Autoria/Formatos.js`, que el compilador aplica antes de compilar (lo guardado sigue siendo el formato de siempre):
- **`formatos`** en la escena: `{"vertical": {nombre?, camara?, objetos?: {"<nombre>": parche | null}, efectos?, dialogos?: {"<índice>": parche | null}, agregar?, …}}`. Cada parche se mezcla con lo que reemplaza; `null` lo quita. Se elige con `--formato vertical` en `autoria.mjs` (validar, compilar, crear, actualizar), `reporte.mjs --carpeta` y `render_memoria.mjs`. Sin `--formato`, es la escena base.
- **`en: {cuadro: "<lugar>" | [fx, fy], desplazar?, t?}`**:
  - En **objetos y efectos**: un punto de lo que ve la cámara en el instante `t` (0 por defecto). Se resuelve al compilar y queda fijo en el mundo.
  - En **textos** (`estilo: "texto"` sin `quien`): el texto queda **pegado a la pantalla**. `Dialogos.js` lo ubica en cada cuadro; tamaño, ancho y desplazar van en px del video y se alinea según el lugar ("arriba-…" cuelga hacia abajo, "abajo-…" crece hacia arriba).
  - Lugares: `arriba|centro|abajo` - `izquierda|centro|derecha` (y `centro`), en el borde de la **zona segura**. `[fx, fy]` es una fracción del cuadro entero.
- **Zona segura** (`zona_segura` de la escena): por defecto 5 % en horizontal; en vertical 6 % a los lados, 12 % arriba y 20 % abajo (la interfaz de las apps).
- **Textos:** campo nuevo `vertical: arriba|centro|abajo`, también para textos con `[x, y]`.

**Resultado (2026-11-24):**
- Proyecto **"Fase IA-3 - Formatos"** (`6b06455f959c301debc9b271`), un archivo (`herramientas/ejemplos/formatos/escena.json`) y dos escenas:
  - "Atardecer" `6b064567f9c72bdb74b952e3` (capítulo "Horizontal 16:9");
  - "Atardecer (vertical)" `6b064571f9c72bdb74b95388` (capítulo "Vertical 9:16"). Lo único propio del vertical: cámara 720×1280, el texto de abajo y el nombre.
- El sol, la nube, el título y el pie se reubican solos en cada formato.
- El validador de IA-2 encontró al principio el título saliéndose por arriba cuando la cámara hacía zoom. De ahí salió que los textos con `cuadro` queden pegados a la pantalla.
- Pruebas: 109 pasan (5 nuevas en `pruebas/formatos.test.mjs`, incluida una que comprueba que el texto no se mueve en pantalla con zoom y paneo). Regresión visual: 391 de 391 iguales.
- No probado en el navegador: el editor usa el mismo `Dialogos.js`, pero no lo abrí.

## IA-4 · Enganches

- **Asset:** `enganches: {"mano": {parte: "brazo_del", en: [0, 56]}}`. `en` es relativo al origen de la parte, como el `en` de una parte hija (sin `en`, el origen). Se guarda en `escena.enganches` del asset, que sigue siendo asset.
- **Escena:** `{nombre: "copa", padre: "beto", enganche: "mano", ...}` o `enganche: {parte: "cabeza"}` sin declararlo. El `en` del objeto y sus claves x/y son relativos al punto del enganche.
- El objeto queda como hijo de la parte de la instancia (`nodo_padre: "beto::brazo_del"`): sigue su posición, giro y escala, también el espejo y las acciones del asset. El motor ya lo soportaba; faltaba el lenguaje.
- El catálogo de autoría trae `enganches` y `partes` de cada asset, para validar con errores claros.
- Backend: acepta un padre `<instancia>::<parte>` (la parte existe solo en el motor); `enganches` no convierte un asset en escena.
- Descompilador: vuelve como `padre` + `enganche: {parte}` (vuelta exacta). También guarda `zona_segura` de IA-3, que faltaba.

**Resultado (2026-11-24):**
- Proyecto **"Fase IA-4 - Enganches"**: assets "Paseante" y "Paseante con vestido" (generador persona, con enganches `mano` y `cabeza`) y la escena "Paseo con copa" `6b064a7501e5e9b55bd037be` (capítulo "Enganches"). Uno camina con una copa en la mano y sombrero; la otra, espejada, con un farol. Todo sigue el balanceo del brazo.
- Lección: al principio el `en` del enganche iba en coordenadas del asset, y me equivoqué yo mismo al declarar la cabeza (el sombrero quedó en los pies). Se cambió a "relativo a la parte", la convención de siempre.
- Pruebas: 114 del frontend (5 nuevas en `pruebas/enganches.test.mjs`) y 6 del backend. Regresión visual: 391 de 391 iguales.
- No probado en el navegador: cómo muestra el editor un objeto colgado de una parte de instancia (árbol, "entrar" al padre, guardar desde el editor).
- Idea para después: `girar: false` para que lo colgado siga la posición pero no el giro (un farol que cuelga siempre vertical).

## IA-5 · Acciones de alto nivel

Módulo nuevo `src/Clases/Autoria/Pasos.js`. El compilador traduce `pasos` (después de `formatos`) a claves, acciones y objetos de siempre. Lo guardado no cambia y se puede retocar a mano; al descompilar quedan las claves.
- **`caminar`:** `{caminar: "beto", a: [x, y] | {cuadro} | "ana", desde, hasta? | velocidad? (140 px/s), accion?, luego?, girar?, separacion? (120)}`.
  - Claves de x/y desde donde esté en `desde`, así que se encadenan.
  - Se da vuelta hacia donde va (`escala_x` con "mantener"; supone que el asset mira a la derecha).
  - Pone la acción "Caminar" si el asset la tiene, y `luego` al llegar.
  - Hacia otro objeto, se detiene a `separacion`.
  - Error si se pisa con otras claves.
- **`mirar`:** `{mirar: "beto", a: "ana" | "izquierda" | "derecha", t}`.
- **`tomar` / `soltar`:** `{tomar: "beto", objeto: "copa", enganche: "mano", t}` y `{soltar: "beto", objeto: "copa", t, en: [x, y]}`.
  - El objeto tiene una copia suelta y una colgada del enganche (`copa@beto`, IA-4), y se prende una u otra con opacidad.
  - La mano no se estira: eso lo hace una acción del asset. Por ahora solo se toman objetos dibujados.
- **`plano`:** `{plano: "general" | "medio" | "primer", de: "beto" | ["beto", "ana"], desde, hasta? (+800), interp?}`. Mueve la cámara (x, y, zoom) para encuadrar.
  - Usa la **caja** del asset, que ahora el compilador calcula y guarda en `escena.caja` y el catálogo la entrega.
  - Los assets guardados antes no tienen caja hasta recompilarlos; se supone una de 100 × 200 y avisa.
- Orden: primero caminar y mirar (en el orden de la lista), después tomar y soltar, y al final los planos (usan las posiciones).

**Resultado (2026-11-24):**
- Proyecto **"Fase IA-5 - Acciones"**: assets "Caminante" y "Caminante 2" (acciones "Caminar" y "Quieto", enganches `mano` y `cabeza`) y la escena **"La copa"** `6b064de16933e9130912f4ac` (capítulo "Acciones").
- La escena está armada solo con `pasos` (10 pasos, ninguna clave a mano). Beto camina a la mesa y se detiene, toma la copa (plano medio), Ana se acerca, Beto se da vuelta para mirarla (plano general), deja la copa en la mesa y se van.
- El validador (IA-2) se mejoró de paso: revisa los globos también al aparecer. Antes no vio dos globos que se tapaban a los 7,8 s.
- Pruebas: 120 (6 nuevas en `pruebas/pasos.test.mjs`). La prueba de ida y vuelta ignora `escena.caja` (es derivada). Regresión visual: 391 de 391.
- `escena.caja` no convierte un asset en escena (frontend y backend).
- No probado en el navegador.

## IA-6 · Correcciones ancladas

- **En el editor:** pestaña **Notas** en el panel izquierdo (con un contador de pendientes).
  - "Nueva nota", clic en el lienzo y texto: guarda el instante, el punto del dibujo, el objeto y la parte bajo el punto (lo más chico que lo contiene; `Clases/EditorEvento/Notas.js`).
  - Las notas se ven como alfileres numerados en el lienzo; se resaltan cerca de su instante.
  - Clic en una nota lleva a su instante. Se marcan como resueltas o se borran (con confirmación en el mismo botón).
  - Si la IA respondió, se ve su respuesta.
- **Dónde viven:** `escena.notas`, con ruta propia `PUT /api/evento/id/:id/notas` (solo el dueño), que guarda al instante. **No** pasan por la escena editable, el historial ni "Subir". Así deshacer no las toca, y las conservan "Subir" (`PUT /api/evento/id/:id`) y `autoria.mjs actualizar` (`controller/Notas.js`, `conservarNotas`).
- **Para la IA:** `herramientas/notas.mjs <escena>` lista las pendientes. `--recortes <dir>` saca una imagen por nota: la zona alrededor del punto en ese instante, con la caja del objeto, la marca y el cuadro entero. `--responder <id> --texto "…" [--resuelta]` contesta por la API de autoría (`PUT /autoria/eventos/:id/notas/:id_nota`).
- `notas` no convierte un asset en escena ni la descompila el formato simple.

**Resultado (2026-11-25):**
- Proyecto **"Fase IA-6 - Notas"**: la escena "La copa" `6b064fced9ebed812df4dd38` (capítulo "Notas") con dos notas de prueba puestas directo en la base. Una sigue pendiente (la copa a los 4,3 s); la otra está resuelta con una respuesta escrita con `notas.mjs --responder`.
- Comprobado: la lista, los recortes (`/tmp/render/notas` en el contenedor), que `autoria.mjs actualizar` no las borra y la respuesta.
- Pruebas: 121 del frontend (1 nueva, `objetoEn`) y 9 del backend (3 nuevas, `pruebas/notas.test.js`). Regresión visual: 391 de 391. El editor compila sin avisos nuevos.
- **Probado en el navegador (2026-11-25):** la pestaña muestra las notas con alfileres numerados; "ir a la nota" lleva al instante; una nota nueva con clic sobre Ana guardó "ana › pelo" a los 4,3 s; resolver, ver resueltas con la respuesta de la IA y borrar (con confirmación) funcionan.
- "Subir" llegó a la base y las notas se conservaron (comprobado con una marca temporal que después se quitó). Las notas no crean entradas en el historial. Al recargar siguen ahí.
- Detalle: el panel tarda un momento en mostrar la nota recién guardada (espera la respuesta del servidor).
