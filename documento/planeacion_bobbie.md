# Planeación: "Bobbie, el perro maravilla" (TikTok)

> Pedido el 2026-11-25. Historia real (1923–1924), con guion propio: [guion_bobbie.md](guion_bobbie.md).

**Decisiones del usuario:**
- Formato y duración: vertical 9:16, de 60 a 90 s.
- Audio: narrador y personajes.
- Estilo: libro ilustrado cálido.
- Bobbie: perro realista que no habla.
- El guion tiene que atrapar desde el primer segundo y llevar narrador: el objetivo es atraer público.

Se trabaja **una fase a la vez** y el usuario revisa cada una antes de seguir.

| Fase | Qué | Estado |
|---|---|---|
| 1 | Guion con gancho en el segundo 0 (6 escenas, unos 78 s) | hecha, a revisar |
| 2 | Mundo y personajes: Bobbie (collie ilustrado con acciones caminar, correr, nadar, sentarse, mover la cola, cojear), la familia Brazier (ropa de los años 20), el auto antiguo, los fondos (Silverton, estación en Indiana, maizal, río, pradera nevada, Rocosas, bosque con lluvia) | hecha, a revisar |
| 3 | Escenas 1 a 3 (gancho, antes de todo, se pierde) | hecha, a revisar |
| 4 | Escenas 4 a 6 (viaje con contador, regreso, leyenda) | hecha, a revisar |
| 5 | Audio: voces de ElevenLabs (con la estimación de créditos antes de generar), música y efectos, y la boca de los personajes con su voz | hecha, a revisar |
| 6 | Revisión completa y "Ver y exportar" a 1080×1920 | pendiente |

**Herramientas que se usan:**
- `pasos` (caminar, mirar, planos): IA-5.
- Enganches para el farol y la comida: IA-4.
- Textos pegados a la pantalla para el contador, los años y los datos: IA-3.
- El validador antes de crear (IA-2) y las notas del editor para tus correcciones (IA-6).
- Partículas de nieve, lluvia y viento, **sin `suave`** salvo en pocas partículas (para que el editor no se trabe).

## Fase 2: resultado (2026-11-25)

- Proyecto **"Bobbie, el perro maravilla"** (`6b06db8148ac35e56294990f`). Generador: `herramientas/ejemplos/bobbie/generar.mjs`.
- **Assets:**
  - **Bobbie:** acciones Quieto, Caminar, Correr, Cola, Sentado, Cojear y Nadar; enganches `boca` y `lomo`.
  - **Frank, Elizabeth e Hija:** acciones Quieto, Caminar, Llamar, Buscar y Abrazar; enganches `mano` y `mano_tras`.
  - **Auto 1920:** acciones Quieto y Andar; enganches `estribo`, `asiento_tras` y `asiento_del`.
  - **8 fondos verticales** (suelo en y = 0, de x −460 a 460; en la escena van en `[360, 1000]`): Silverton, estación, maizal, río, pradera nevada, montañas, bosque y noche.
- **Galerías** (capítulo "Pruebas"):
  - "0. Galería de personajes" `6b06dbb8ed2927b3b6138d54`;
  - "0. Galería de fondos" `6b06dbbbed2927b3b6138db0`.
- **Probado en el editor:** las galerías van a 50–55 cuadros por segundo. Validador sin avisos.
- **Corregido:** los muslos de Bobbie (parecían cajas: ahora son del color del cuerpo y sin borde) y la pose de sentado (ángulos recalculados).

## Fase 3: resultado (2026-11-25)

Escenas en el capítulo "Bobbie", generadas con `herramientas/ejemplos/bobbie/escenas.mjs`:
- **"1. El gancho"** `6b06dee7ed2927b3b613a77d` (6,5 s): "4.000 km" y "HISTORIA REAL" en pantalla **desde el cuadro 0**. Primer plano de las patas cojeando en la nieve; la cámara se abre hasta ver a Bobbie frente a las montañas. Nieve, ventisca y huellas.
- **"2. Antes de todo"** `6b06dee9ed2927b3b613a80f` (9,5 s): Silverton, agosto de 1923. La familia va sentada en el auto, Bobbie llega corriendo, Frank grita "¡Arriba, Bobbie!" y Bobbie salta al estribo (una copia en el suelo y otra en el estribo). Después el auto parte.
- **"3. Se pierde"** `6b06deeced2927b3b613a851` (12,5 s): en Wolcott, dos perros del pueblo lo atacan y Bobbie huye. De noche, Elizabeth llama y Frank busca con un farol encendido. Al amanecer el auto se va sin él.

Nuevo en los assets:
- **"Perro negro" y "Perro manchado":** el mismo dibujo de Bobbie con otros colores.
- **Familia:** la acción "Sentado".
- **Auto:** la capota es más alta, para que los pasajeros quepan.

Motor (opcional, no cambia lo existente):
- Textos con `entrada` (ms del fundido; 0 = aparece de golpe, para el gancho).
- Si la escena tiene `zona_segura`, la franja del narrador queda dentro de ella. En TikTok: arriba 10 %, abajo 22 %, derecha 14 %.
- Pruebas: 121. Regresión visual: 391 de 391.

Encuadre: el suelo queda a cerca del 60 % del alto, para que la franja del narrador no tape a los personajes. En el editor van a 28–61 cuadros por segundo. Los tiempos son los del guion; las voces (fase 5) los acomodan.

**Correcciones del usuario a la fase 3 (2026-11-25):**
1. **Farol:** Frank lo llevaba con el codo en ángulo recto. Ahora "Buscar" estira el brazo adelante y abajo, y el farol cuelga derecho con **`girar: false`**. Es una capacidad nueva y general del motor: lo colgado sigue la posición del padre, no su giro (`cadenaTransformaciones`, campo `sin_giro`). Se probó y está en la guía.
2. **Vestido:** la pierna se dibujaba sobre la falda. Ahora la falda va después de las dos piernas.
3. **Primer plano en la nieve:** se veía plano. Se agregó:
   - montones de nieve delante de las patas, destellos, pasto seco, piedras nevadas, ráfagas a ras del suelo y huellas hundidas;
   - pinos nevados cerca, nieve en el lomo y patas heridas;
   - el aliento, copos grandes cerca de la cámara y una viñeta que la sigue.

   Sin `suave` en los copos, el editor va a 59 cuadros por segundo.

## Fase 4: resultado (2026-11-25)

Bobbie viaja **hacia la izquierda** (oeste), porque el auto se fue hacia la derecha (este).

- **"4. El viaje"** `6b06e8b4a7f2cb091c7b3447` (28 s): seis tramos de 4 a 5 s, con un **contador de km** que sube en pasos y el mes debajo (de septiembre de 1923 a febrero de 1924):
  - el maizal con hojas que caen;
  - el río helado, que cruza a nado (el agua de adelante tapa medio cuerpo y salpica);
  - la pradera con viento y nieve;
  - la granja: la **Granjera** (asset nuevo) sale con un plato (tomar), lo deja en el suelo (soltar) y vuelve; Bobbie come y sigue;
  - las Rocosas de noche con ventisca, cojeando;
  - el bosque de Oregón con lluvia.
- **"5. El regreso"** `6b06e8b7a7f2cb091c7b3517` (13 s): Silverton gris, con llovizna y charcos. La hija camina, Bobbie llega cojeando con barro y las patas heridas. Ella dice "¿Bobbie…?" y luego "¡BOBBIE!", él corre y ella se arrodilla a abrazarlo mientras la cámara se acerca.
- **"6. La leyenda"** `6b06e8bba7f2cb091c7b35db` (11 s):
  - la familia en el porche con Bobbie sentado moviendo la cola;
  - el **diario** entra girando ("EL PERRO MARAVILLA", con la foto de Bobbie en sepia);
  - primer plano al atardecer con "Algunos amores no conocen distancia." y "Historia real · 1923–1924".
- **Corrección del usuario (Oregón se veía mal):** se rehizo el "Fondo bosque" con abetos en capas, niebla, troncos con musgo, un sendero, helechos y un tronco caído. La lluvia pasó a ser de trazos (antes eran puntos invisibles), también la llovizna de la escena 5.
- No hay mural (el guion lo mencionaba): el diario cumple ese papel. Validador sin avisos.
- **Editor:** el viaje va a unos 15 cuadros por segundo (los seis paisajes y sus partículas en un mismo lienzo); las demás escenas, a 48–61.

## Fase 5: resultado (2026-11-25)

- **Voces** (ElevenLabs eleven_v4, flujo `IHZTrjhsndLihs1zJcbx`): narrador **Japa**, Frank **Marco Ruiz**, Elizabeth **Emma**, hija **Denisse**. Son 19 líneas, con indicaciones de actuación en el texto de la petición (no cambian el diálogo) y 1.058 créditos.
- **Boca:** se mueve con la voz (`voces` + `boca` en cada escena; la parte "boca" de las personas tiene ahora un pivote).
- **Música:** "Música: Bobbie", un tema orquestal de 92 s con el arco de la historia (900 créditos). `sonido.mjs` lo reparte escena por escena con `recorte`.
- **Efectos** (10, 170 créditos): Ventisca, Auto antiguo, Perros gruñendo, Grillos de noche, Río chapoteo, Lluvia en el bosque, Llovizna, Pájaros de verano, Diario girando y Ladrido feliz. Se suben con `son_subir.sh` (scratchpad): descarga, WAV, `preparar_sonido` (recorte o bucle) y `crear_sonido`.
- **Duración final: 92 s** (meta 60–90). Para eso se acortaron la escena 2 (la narración va primero y el grito de Frank después), los tramos del viaje (a la medida de cada frase) y el final de la escena 5.
- **Error del motor corregido:** `insertarTiempo` (voces.mjs) no corría los `pasos` de IA-5, así que Bobbie corría antes del "¡BOBBIE!". Ahora los corre como a las claves, con su prueba (123 pruebas).
- **Total gastado en ElevenLabs:** unos 2.130 créditos.

**Cambio de narrador (pedido del usuario):** Japa sonaba muy dramático. Se eligió **Damián** entre muestras y se regeneraron las 14 líneas con tono de documental, sobrio (unos 1.400 créditos). Duración final: **90,7 s**. Validador sin avisos.

**Estimación de voces (fase 5):** unos 1.100 caracteres en total (narrador unos 950, personajes unos 150). Se confirma antes de generar.
