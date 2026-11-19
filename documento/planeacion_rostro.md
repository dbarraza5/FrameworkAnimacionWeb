# Proyecto "Rostro": una mujer que habla (prueba de capacidad)

> Pedido del usuario (2026-11-19): generar el rostro de una mujer hablando, como prueba de capacidad.

## La escena "Lía habla" (16,3 s)

Retrato frontal de **Lía** (diseño propio):
- melena castaña con flequillo de lado;
- ojos verdes;
- suéter verde azulado y aretes dorados.

Dice: *"Hola. Me llamo Lía. Mi cara está hecha solo de polígonos, y cada palabra mueve mis labios, un fotograma a la vez. ¿Me escuchas?"*.

- **Boca sincronizada con el texto (lip sync):**
  - Hay 9 formas de boca (visemas), cada una como asset: `a`, `e`, `i`, `o`, `u`, `m` (m, b, p), `f` (f, v), `cerrada` y `sonrisa`.
  - `labios(texto, t0)` recorre las letras y arma la línea de tiempo: unos 150 ms por vocal, pausas en las comas y los puntos, y la "h" muda.
  - Cada boca es una instancia con claves de opacidad `mantener`, prendida solo en su tramo.
  - Al final queda la sonrisa.
- **Voz:**
  - La **misma** línea de tiempo se guarda en `voz.json`. Con ella se sintetiza la voz por **formantes**: un pulso glotal pasa por tres resonadores con los formantes de cada vocal, más ruido para la "s" y la "f".
  - La entonación baja en cada frase y sube en la pregunta final.
  - Suena robótica, pero coincide con la boca.
- **Vida:**
  - parpadeo con `escala_y` de los párpados;
  - la mirada cambia de lugar: el iris y la pupila se mueven con claves `x` en `repetir`;
  - las cejas se levantan en "Lía", "polígonos", "labios" y "escuchas";
  - la cabeza se mece (x, y y rotación cada 950 ms, `suave`);
  - el flequillo, la melena y los aretes se balancean;
  - la cámara se acerca de a poco (zoom de 1 a 1,07).

## Cómo está hecho

- **Generador:** `herramientas/ejemplos/rostro/generar.mjs` escribe `asset_01..16.json`, `escena.json` y `voz.json`.
- **Assets:**
  - Estudio, Torso de Lía;
  - Cabello de Lía (atrás), Rostro de Lía, Ojos de Lía, Cabello de Lía (adelante), Cejas de Lía;
  - las 9 bocas.
- **Cómo se mueve la cabeza:** cara, ojos, cabello, cejas y bocas son objetos separados, todos con el mismo origen (la base del cuello) y **las mismas claves**. Así se mueven juntos. Las cejas suman su propio alzado a la `y` de la cabeza.
- **Orden de dibujo:** la escena usa `profundidad: false`. Con profundidad, el orden por altura ponía las cejas detrás de la cara cuando se movían.
- **Límite del backend:** el rostro en un solo asset (511 figuras) supera el tamaño de request. Por eso se dividió en cara, ojos y cabello.
- **Sonido:** "Voz de Lía" (sintetizada desde `voz.json`) y "Ambiente de estudio" (en bucle). Los dos son provisorios: se pueden reemplazar por una voz grabada con el mismo texto.

## Verificado

- Los 16 assets y la escena validan y se crearon con una llave temporal, que ya se revocó.
- El render en 12 instantes muestra la boca que cambia, el parpadeo, las cejas, la mirada y la sonrisa final.
- `reporte.mjs` no da avisos y muestra 2 clips de sonido.

**No probado:**
- Cómo se ve en el editor.
- Cómo suena la voz. Se sintetizó, pero nadie la escuchó.

## Lía 2 (2026-11-19): la misma escena con las mejoras de calidad

Escena **"Lía 2"** (16,3 s), en el mismo proyecto. Se genera con `herramientas/ejemplos/rostro2/generar.mjs`, que produce 4 assets: *Estudio (Lía 2)*, *Torso de Lía 2*, *Cabeza de Lía 2* y *Boca de Lía 2*. "Lía habla" no se tocó.

- **Boca:** una sola, con **morphing** entre 9 formas (`formas` + `claves.forma`). Cada parte (interior, lengua, dientes, labios, comisuras) tiene siempre la misma cantidad de puntos; lo que "no está" en un visema queda con alto 0. Los cambios de `labios()` se convierten en claves: la forma se mantiene y pasa a la siguiente en unos 80 ms.
- **Jerarquía:** el pivote **"Cabeza"** está en la nuca y mueve a la cabeza y a la boca (`padre`). Las claves de movimiento son una sola pista, y no 13 copias. La escena usa `profundidad: true` sin problemas.
- **Un solo asset para toda la cabeza** (706 figuras) y la boca con 1636 figuras: ahora entran porque el límite del backend es de 15 MB.
- **Luz:**
  - piel, cabello, iris, labios y suéter llevan **degradados**;
  - las sombras de la cara llevan **desenfoque** con `multiplicar`;
  - hay luces con `pantalla`, luz de borde fría y bokeh con `suma`.
  - Para las manchas redondas se usa `mancha()`, un círculo con degradado radial que se desvanece. Es mucho más barato que el desenfoque: con desenfoque grande el render tardaba unos 0,7 s por cuadro a 1280 px.
- **Voz "Voz de Lía 2":** formantes F1–F4 en cascada con ganancia normalizada, pulso glotal de Rosenberg con radiación, aire, nasal para m, ruido filtrado para s/f y un realce de presencia. Medida con `labios.mjs`, reconoce el **99 %** de las vocales; con la voz vieja, el 0 %. Sigue sonando sintética.
- **Verificado:** render desde la base, reporte sin avisos (2 clips) y GIF de 6 s. **No se abrió en el editor ni se escuchó.**
