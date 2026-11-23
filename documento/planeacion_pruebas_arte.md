# Pruebas de arte (nov-2026)

**Pedido del usuario (2026-11-22):** un proyecto de pruebas de estilos de arte distintos.
- Cada estilo va en un **capítulo**, con una **escena original** pensada para lucirlo; las escenas las inventa el asistente.
- Se trabaja **una fase a la vez**: el usuario revisa cada estilo antes de pasar al siguiente.

- **Proyecto:** "Pruebas de arte" `6b025b49f817be32e9f35a0f`.
- **Generadores:** `herramientas/ejemplos/arte/<estilo>/generar.mjs`.
- **Escenas:** de 12 a 20 s, horizontales (1280x720) salvo que el estilo pida otra cosa; sin diálogos (algún cartel si hace falta); con sonido de ambiente sintetizado o de ElevenLabs si el usuario lo pide.

**Regla:** cada estilo que pida algo nuevo del motor lo agrega como **capacidad general**, que sirve para cualquier escena. Ejemplos: un filtro de imagen, un contorno, un brillo. Siempre lleva sus pruebas automáticas, y en lo posible se ve también en la vista previa y en el MP4.

## Fases

| # | Estilo | Escena (original) | Capacidad nueva | Estado |
|---|---|---|---|---|
| 1 | **Duotono con tramado** | "La plaza de las agujas" | `escena.estilo`: paleta y tramado de Bayer | hecha |
| 2 | **Cómic con semitono** | "El robo del reloj" | tramado **semitono** (puntos de imprenta), **contorno automático** | hecha |
| 3 | **Neón / synthwave** | "Carretera a medianoche" | **resplandor** (*bloom*) de lo luminoso | hecha |
| 4 | **Papel recortado** | "El zorro de papel y la luna" | **textura** de papel, **stop-motion** (`fps_animacion`) y sombra entre capas | hecha |
| 5 | **Game Boy (4 tonos)** | "La cueva del cristal" | `estilo` con 4 colores y **claves del estilo** (brillo animado) | hecha |
| 6 | **Noir / grabado** | "Lluvia en la calle Ocho" | tramado de **líneas** (como grabado en madera) | hecha |
| 7 | **Teatro de sombras** | "El viaje del farolero" | ninguna (siluetas negras sobre cielos de degradado) | hecha |
| 8 | **Acuarela** | "Barcas en el lago" | **bordes irregulares** que respiran y **pigmento** acumulado en los bordes | hecha |
| 9 | **Pantalla CRT retro** | "Transmisión perdida" | filtro de **barrido**, curvatura y colores corridos | hecha |
| 10 | **Low poly / facetado** | "El valle de las montañas de cristal" | generador de **facetas**: polígonos en triángulos con luz por cara | **hecha, a revisar** |

**Orden sugerido:** el de la tabla. Va de lo que reusa más a lo que pide más motor, alternando estilos muy distintos. El usuario puede cambiarlo o saltar fases.

## Detalle de cada fase

### 1. Duotono con tramado (hecha)
Ver el resultado al final del documento.

### 2. Cómic con semitono: "El robo del reloj"
- **Estilo:**
  - colores planos y saturados (rojo, amarillo, cian);
  - sombras en **puntos de imprenta** que crecen con la oscuridad;
  - **contorno negro grueso** en cada figura;
  - viñetas o cartelitos de onomatopeya ("¡ZAS!").
- **Escena:** un gato ladrón con antifaz salta entre tejados de noche con un reloj robado. Un reflector lo sigue; salta, cae en un toldo y escapa. Rayos de velocidad y un cartel "¡BOING!".
- **Capacidades nuevas:**
  - **Semitono:** `tramado: "semitono"`, con círculos por celda cuyo radio depende de la luz, y su ángulo.
  - **Contorno:** `contorno: {grosor, color}` en un asset o una escena. Dibuja un trazo exterior alrededor de cada silueta; se genera desde la máscara del dibujo o con el borde de cada parte.

### 3. Neón / synthwave: "Carretera a medianoche"
- **Estilo:**
  - fondo casi negro;
  - líneas de neón rosa y cian que brillan;
  - sol a franjas sobre el horizonte;
  - grilla en perspectiva que avanza;
  - palmeras en silueta.
- **Escena:** un auto retro avanza por una autopista infinita hacia un sol a franjas. Pasan carteles de neón, una ciudad lejana titila, y al final hay un relámpago y el título "MEDIANOCHE".
- **Capacidad nueva:** **resplandor**, `estilo.resplandor = {umbral, radio, intensidad}` (`estilo.brillo` ya era el ajuste de luz). Toma lo más luminoso del cuadro, lo desenfoca y lo suma encima. Es el halo típico del neón y sirve para cualquier escena.

### 4. Papel recortado: "El zorro de papel y la luna"
- **Estilo:**
  - capas de cartulina de colores mate;
  - bordes un poco irregulares;
  - **sombra suave entre capas**, que da profundidad;
  - textura de papel;
  - movimientos "a tirones" como en *stop-motion* (12 cuadros por segundo).
- **Escena:** un zorro de papel cruza un bosque de capas hacia una colina, donde la luna (un círculo de papel) sube. Las capas del fondo se mueven a distinta velocidad (paralaje) y caen unas hojas de papel.
- **Capacidades nuevas:**
  - **Textura de papel:** `textura: "papel"` en una parte, un ruido fino que oscurece apenas.
  - **Cuadros por segundo de la animación:** `escena.fps_animacion = 12`. Las poses se congelan a ese ritmo, aunque el video vaya a 30.
  - **Sombra entre capas:** ya existe `sombra`; se ajusta para que caiga sobre la capa de atrás.

### 5. Game Boy: "La cueva del cristal"
- **Estilo:** 4 verdes (`#0f380f`, `#306230`, `#8bac0f`, `#9bbc0f`), pixel gordo, tramado `bayer2` y animación entrecortada.
- **Escena:** un pequeño explorador baja por una cueva con antorcha. Pasa murciélagos y estalactitas que gotean, y encuentra un cristal que ilumina la cueva entera: la paleta pasa de oscura a clara.
- **Capacidad nueva:** ninguna, solo se usa `estilo`. Puede sumarse **animar el estilo**: `estilo.claves.brillo`, para que la cueva se ilumine con el cristal.

### 6. Noir / grabado: "Lluvia en la calle Ocho"
- **Estilo:**
  - blanco y negro de alto contraste;
  - sombras con **líneas paralelas** (como grabado o cómic noir) en vez de puntos;
  - lluvia diagonal;
  - un farol que hace un cono de luz.
- **Escena:** un detective con sombrero camina bajo la lluvia, se detiene bajo un farol y enciende un fósforo que ilumina su cara. Un auto pasa y lo baña de luz.
- **Capacidad nueva:** `tramado: "lineas"`, con líneas cuyo grosor depende de la oscuridad y su ángulo. Es otro modo del mismo filtro.

### 7. Teatro de sombras: "El viaje del farolero"
- **Estilo:**
  - todo en **siluetas negras** recortadas, con calados y adornos;
  - cielos de degradado cálido (atardecer a noche);
  - personajes articulados con varillas (las articulaciones se ven).
- **Escena:** un farolero recorre un pueblo de tejados, encendiendo faroles uno a uno al caer la noche. Pasa un gato por un tejado y salen las estrellas.
- **Capacidad nueva:** ninguna (siluetas, degradados y articulaciones ya existen). Sirve para medir cuánto da el editor sin agregar nada.

### 8. Acuarela: "Barcas en el lago"
- **Estilo:**
  - manchas de color transparentes que se superponen;
  - bordes irregulares y más oscuros (el pigmento se acumula);
  - papel blanco que se ve entre manchas;
  - colores que "respiran".
- **Escena:** amanece en un lago con montañas. Dos barcas se mecen, un pescador lanza la caña, los reflejos tiemblan en el agua y pasa una bandada de pájaros.
- **Capacidades nuevas:**
  - **Borde acuarela:** `acuarela: {borde, irregular}` en una parte. Deforma un poco el contorno con un ruido que cambia despacio y le pone un borde más oscuro.
  - **Textura de papel:** la misma de la fase 4, para toda la escena.

### 9. Pantalla CRT retro: "Transmisión perdida"
- **Estilo:** imagen de televisor viejo, con líneas de barrido, bordes curvos y oscuros, colores que se corren (rojo y azul desplazados), parpadeo y estática.
- **Escena:** un noticiero espacial de los 80. Una presentadora robot anuncia algo, la señal se corta con estática y aparece un mensaje misterioso de otro planeta antes de volver.
- **Capacidad nueva:** **filtro CRT**, `escena.pantalla = {barrido, curvatura, aberracion, ruido}`, aplicado al final, después del estilo. La estática se anima con claves.

### 10. Low poly / facetado: "El valle de las montañas de cristal"
- **Estilo:** todo hecho de triángulos planos, cada cara con su luz (claro hacia el sol y oscuro del otro lado), colores pastel y cielo en degradado de triángulos.
- **Escena:** amanecer en un valle. El sol sale y las caras de las montañas cambian de luz, corre un río de triángulos y pasan nubes facetadas y un ciervo.
- **Capacidad nueva:** **generador de facetas**, `facetas: {luz: [x, y], detalle}` en una parte. Parte el polígono en triángulos y les da un tono según la dirección de la luz. Si la luz se anima, las caras cambian.

## Fuera de esta ronda (ideas para después)
- **Pixel art de verdad:** sprites dibujados a mano en una grilla.
- **Tiza en pizarrón.**
- **Bordado o punto de cruz.**
- **Vitral:** plomos negros y vidrios de color con luz detrás.
- **Ukiyo-e:** grabado japonés, con olas y nubes estilizadas.
- **Blueprint:** líneas blancas sobre azul.

---

## Resultado de la fase 1: duotono con tramado (2026-11-22)

### Capacidad general: estilo de imagen de la escena
- **Formato:** `escena.estilo = {paleta: [colores de oscuro a claro], tramado: bayer2|bayer4|bayer8|ninguno, pixel, contraste, brillo}`.
- **Cómo funciona** (`src/Clases/EditorEvento/Estilo.js`):
  - se aplica al cuadro ya dibujado, antes de los globos;
  - cada pixel gordo toma la luz media de su bloque, y la matriz de Bayer reparte esa luz entre los colores de la paleta.
- **Dónde se ve:** en todo lo que pasa por `Render.dibujarCuadro`: la vista previa del capítulo, el MP4, `render.mjs` y `render_memoria`. **No se ve** en el lienzo del editor mientras se edita.
- **Archivos:**
  - compilador y descompilador: `estilo`;
  - pruebas: `pruebas/estilo.test.mjs`.

### "La plaza de las agujas" (16 s, horizontal 1280x720)
- **La escena:** un peregrino encapuchado cruza una plaza de agujas talladas, con mascarones de piedra, faroles que se mecen, estandartes, arbustos oscuros, vasijas y grava. Lo cruzan sombras de nubes y lo rodean motas de polvo. Al llegar, un portal en el suelo se abre con un haz de luz.
- **Cómo se dibuja:** todo en grises, pensando en la luz. El estilo lo convierte a rosa `#f2b8c6` y violeta `#3a2440`, con `bayer4`, `pixel` 1.5, `contraste` 1.4 y `brillo` 0.06.
- **Lo que aprendimos al afinar:**
  - **Fondo:** el suelo tiene que ser casi blanco para que quede liso.
  - **Siluetas:** muy oscuras, para que salgan sólidas.
  - **Sombras y grava:** grises medios, para que salgan como puntillado.

## Resultado de la fase 2: cómic con semitono (2026-11-22)

### Capacidades generales (dentro de `escena.estilo`, `Estilo.js`)
- **Semitono:** `tramado: "semitono", semitono: {celda, angulo, tinta, claro, color}`.
  - Cada pixel conserva su tono, pero llevado a plena luz: es la tinta plana.
  - La sombra se dibuja con **puntos de tinta** en una grilla girada; el área del punto es proporcional a lo oscuro.
  - Por encima de `claro` no hay puntos.
- **Contorno automático:** `contorno: {grosor, color, umbral}`.
  - Donde el color cambia de golpe (borde entre dos formas) se entinta una línea; los degradados suaves no hacen borde.
  - Se calcula sobre la imagen original y se dibuja al final.
  - Sirve solo o junto a cualquier tramado.
- **La paleta ya no es obligatoria:** solo la piden los tramados Bayer. `ninguno` con paleta da tintas planas.
- **Pruebas:** `pruebas/estilo.test.mjs`, 7 en total.
- **Ayudantes comunes de los generadores de arte:** `ejemplos/arte/comun.mjs` (acciones, ciclos y `trayectoria` con saltos en arco).

### "El robo del reloj" (15 s, horizontal 1280x720)
- **La escena:**
  - de noche, un gato ladrón con antifaz y remera a rayas huye por los tejados con el reloj de la torre (la torre quedó sin agujas y con la sirena girando);
  - corre, salta entre azoteas, cae en un toldo que rebota ("¡BOING!", globo de grito) y sube a otro tejado;
  - ahí se burla ("¡Ja! ¿Buscaban esto?"); el reflector lo encuentra ("¡UPS!") y escapa;
  - hay cartelitos de narrador al principio ("Medianoche…") y al final ("Continuará…").
- **Assets:** Cielo nocturno (con luna), Ciudad lejana, Torre del reloj, Tejado, Toldo (acción Rebotar), Reflector (se gira con la rotación de la instancia) y Gato ladrón (Correr, Saltar, Caer, Burlarse, Asustado, con líneas de velocidad).
- **Estilo:** semitono con celda 5, ángulo 20°, tinta `#1b1430` y claro 0.8, más contorno de 1.6.
- **Lo que aprendimos:**
  - **Los degradados del cielo, la luna y las paredes** son los que dan los puntos.
  - **Los colores planos y saturados** quedan lisos.
  - **Los globos** necesitan lugar arriba del personaje en los primeros planos.

## Resultado de la fase 3: neón / synthwave (2026-11-22)

### Capacidad general: resplandor (*bloom*)
- **Formato:** `estilo.resplandor = {umbral, radio, intensidad}`, en `Estilo.js`.
- **Cómo funciona:**
  - lo que pasa de `umbral` de luz se toma con su color, se reduce y se desenfoca (tres pasadas de caja, que se parecen a un gaussiano);
  - ese brillo se **suma** encima de la imagen;
  - va antes del tramado, así que se puede combinar con cualquier estilo.
- **Pruebas:** `pruebas/estilo.test.mjs`, 8 en total (85 en toda la suite).

### "Carretera a medianoche" (15 s, horizontal 1280x720, cámara fija)
- **La escena:**
  - un auto retro visto de atrás corre por una autopista infinita hacia un sol a franjas;
  - la grilla magenta en perspectiva y las líneas del centro avanzan en bucle;
  - hay montañas con aristas de neón cian y rosa, una ciudad lejana con luces y palmeras y carteles de neón que se acercan por los costados;
  - a los 11,8 s, un relámpago con destello y el título "MEDIANOCHE".
- **Perspectiva:** a mano, con `y = horizonte + K / z` y `x = centro + X·K / z`.
  - Las líneas y los trazos del centro son claves muestreadas en bucle.
  - Lo que se acerca (palmeras, carteles) lleva claves de posición, escala y opacidad.
- **Estilo:** `resplandor: {umbral: 0.42, radio: 16, intensidad: 1.4}`, sin tramado.
- **Lo que aprendimos:** el halo del sol que asoma por los huecos de las franjas les da un tono rosa, que funciona bien en este estilo.

## Resultado de la fase 4: papel recortado (2026-11-22)

### Capacidades generales
- **Textura de papel:** `estilo.papel = {intensidad, fibras, escala}`, en `Estilo.js`.
  - Es grano de ruido de valor con hebras estiradas, fijo a la pantalla.
  - Oscurece y aclara apenas la imagen.
  - Se calcula una vez por tamaño de cuadro y se guarda.
  - Va sobre toda la escena, no por parte como decía el plan, porque así no hace falta tocar el dibujo de cada forma.
- **Stop-motion:** `escena.fps_animacion = 12`.
  - Al dibujar el cuadro (`Render.dibujarCuadro`), el instante se redondea hacia abajo a pasos de 1/12 s.
  - Las poses cambian "a tirones" aunque el video vaya a 30 cps.
  - Lo aceptan el compilador y el descompilador.
- **Sombra entre capas:** no hizo falta tocar el motor. El generador duplica cada pieza en oscuro, corrida y con `desenfoque` (ayudante `pieza()`).
- **Bordes cortados a tijera:** el ayudante `recortar()` parte cada lado en tramos y mueve un poco cada punto.
- **Pruebas:** 87 en total.

### "El zorro de papel y la luna" (15 s, horizontal 1280x720, 12 cps)
- **La escena:**
  - un zorro de cartulina, armado como marioneta con broches dorados en las articulaciones, cruza un bosque de capas de papel;
  - hay cielo con estrellas de papel, nubes, tres capas de colinas, pinos que se mecen, una casita con la ventana encendida y hojas que caen;
  - el zorro llega a una colina, se sienta y levanta la cabeza hacia la luna, que sube detrás.
- **Paralaje:** cada capa del fondo se corre con la cámara en una fracción distinta de su movimiento (0,9 el cielo, 0,6 las colinas lejanas, 0,35 las del medio).
- **Estilo:** `papel: {intensidad: 0.12, fibras: 0.5}` y `fps_animacion: 12`.

## Resultado de la fase 5: Game Boy (2026-11-22)

### Capacidad general: animar el estilo
- **Formato:** `estilo.claves = {brillo?: [[t, v, interp?]], contraste?: [...]}`, con t en ms de la escena.
- **Cómo funciona:** `Estilo.estiloEn(estilo, t)` da el estilo de ese instante, y `Render.dibujarCuadro` lo usa. Las interpolaciones son `lineal`, `suave` y `mantener`.
- **Para qué sirve:** amaneceres, apagones, destellos o que un lugar se ilumine.
- **Pruebas:** 88 en total.

### "La cueva del cristal" (16 s, pantalla 10:9 de 800x720, 12 cps)
- **La escena:**
  - un explorador con sombrero, mochila y antorcha baja saltando por las cornisas de una cueva;
  - hay estalactitas que gotean (con salpicón), murciélagos que aletean (morphing de alas) y columnas de roca;
  - la oscuridad es un asset ("Luz de antorcha", un círculo negro con un hueco de luz) que **sigue al explorador con `padre`**;
  - al final alza la antorcha frente a un racimo de cristales que late; al tocarlo hay un destello, la oscuridad se va y el brillo del estilo sube: **la cueva entera se ilumina**.
- **Estilo:** paleta `#0f380f #306230 #8bac0f #9bbc0f`, `bayer2`, `pixel` 4.5 (unos 160 pixeles de ancho, como la consola), `contraste` 1.45 y brillo animado.
- **Lo que aprendimos:**
  - **Contraste alto** (1.45) y el tramado chico (`bayer2`) separan bien los 4 tonos; con grises medios y `bayer4` todo se empastaba.
  - **Un objeto con `padre` hereda la escala del padre:** la luz necesitó `escala: 0.5` para compensar la del explorador.

## Resultado de la fase 6: noir / grabado (2026-11-22)

### Capacidad general: tramado de líneas
- **Formato:** `estilo.tramado = "lineas"`, con `lineas: {celda, angulo, cruzado}` y paleta `[tinta, papel]`, en `Estilo.js`.
- **Cómo funciona:**
  - líneas paralelas de tinta cuyo grosor crece con la sombra;
  - con `cruzado`, en lo muy oscuro (más de 0,55 de sombra) se suma una segunda familia perpendicular, como el grabado o la plumilla.
- **Pruebas:** 89 en total.

### "Lluvia en la calle Ocho" (15 s, horizontal 1280x720)
- **La escena:**
  - noche de lluvia en una calle de los años 40, con edificios con ventanas encendidas, escaleras de incendio y un cartel luminoso que parpadea;
  - la vereda está mojada y hay charcos con reflejos que tiemblan;
  - un detective de gabardina y sombrero camina hasta el cono de luz de un farol y enciende un fósforo para mirar una foto: la cara se le ilumina y piensa "Otra vez tú…";
  - pasa un auto de los 40 y lo baña con sus faros; el brillo del estilo sube un momento.
- **Decisión:** el fósforo es para mirar una foto, no para fumar.
- **Estilo:** `lineas` (celda 5, ángulo 40°, cruzado), paleta `#0d0d10 / #ece6d6`, contraste 1.25, contorno 1.3 y brillo animado con los faros.

## Resultado de la fase 7: teatro de sombras (2026-11-22)

- **Sin capacidades nuevas:** solo siluetas, degradados, articulaciones, opacidad, morphing (los pájaros) y `acciones`. Del estilo se reusan el resplandor (fase 3) y una textura muy suave, como la tela de la pantalla (fase 4).
- **"El viaje del farolero"** (18 s, horizontal):
  - un farolero, marioneta de sombra con broches en las articulaciones, botones calados y **varillas de control** a la vista, recorre la calle y enciende cinco faroles uno por uno;
  - el cielo pasa del atardecer a la noche (dos cielos cruzados con opacidad), el sol se pone, salen las estrellas y la luna, y las ventanas se prenden de a poco;
  - pasa una bandada, un gato sentado sobre un farol mueve la cola y la cabeza, y hay árboles de "encaje" (hojitas separadas por donde pasa la luz);
  - un marco de teatro (festón arriba y viñeta cálida) sigue a la cámara.
- **Lo que aprendimos:**
  - En el teatro de sombras, las figuras tienen que **recortarse contra la luz**. Con casas negras detrás, el farolero desaparecía.
  - La solución fue una fila de casas **baja y un poco más clara** (violeta oscuro, "más lejos"), con las figuras negras delante del cielo.

## Resultado de la fase 8: acuarela (2026-11-22)

### Capacidad general: acuarela
- **Formato:** `estilo.acuarela = {desplazar, escala, velocidad, lavado, borde, transparencia}`, en `Estilo.js`. Es un filtro sobre la imagen terminada, así que no hace falta tocar cada forma.
- **Los cuatro pasos:**
  1. **Desplazamiento:** cada pixel toma el color de un vecino corrido por un ruido suave que avanza con el tiempo, así los bordes **respiran**. El tiempo de la escena llega a `aplicarEstilo` por un parámetro nuevo, `t`.
  2. **Lavado:** un desenfoque leve, como pintura mojada.
  3. **Pigmento en los bordes:** donde el color cambia, se oscurece con un borde suavizado.
  4. **Transparencia:** una mezcla con el color del papel.
- **Se combina** con `papel` (fase 4) para el grano.
- **Pruebas:** 90 en total.

### "Barcas en el lago" (15 s, horizontal 1280x720)
- **La escena:**
  - amanece en un lago de montaña: el cielo pasa del azul al durazno, el sol sube entre las montañas y pasan nubes;
  - en las orillas hay pinos, y los juncos del primer plano se mecen;
  - **reflejos** de las montañas, los pinos, el sol y las barcas: son las mismas instancias con `escala: [1, -1]`, más tenues y con un temblor horizontal;
  - dos barcas se mecen; el pescador lanza la caña (acción "Lanzar") y espera con la boya; pasa una bandada.
- **Estilo:** `acuarela {desplazar 3, escala 22, velocidad 0.35, lavado 1.4, borde 0.55, transparencia 0.1}` y `papel {intensidad 0.045}`.
- **Lo que aprendimos:**
  - **Los nombres de los assets son únicos en todo el proyecto.** La "Bandada" de la fase 7 chocó con la de esta escena; se renombró a "Bandada de acuarela" y se actualizó la escena.
  - **Con el papel fuerte** (0.08) la imagen parecía lija; 0.045 queda mejor con la acuarela.

## Resultado de la fase 9: pantalla CRT retro (2026-11-22)

### Capacidad general: pantalla CRT
- **Formato:** `estilo.pantalla = {barrido, curvatura, aberracion, ruido, vineta, parpadeo}`, en `Estilo.js`. Va al final de todo, después del tramado y del resplandor.
- **Qué hace cada parámetro:**
  - **curvatura:** tubo en forma de barril, con las esquinas negras;
  - **aberracion:** el rojo y el azul corridos hacia los costados;
  - **barrido:** líneas oscuras alternadas;
  - **ruido:** estática por pixel que cambia cada cuadro y, con mucho ruido, franjas que se corren;
  - **vineta** y **parpadeo** del brillo.
- **Estática animable:** `estilo.claves.estatica` anima `pantalla.ruido`, por ejemplo para que la señal se corte.
- **Pruebas:** 91 en total.

### "Transmisión perdida" (16 s, televisor 4:3 de 960x720)
- **La escena:**
  - se enciende el tubo (una línea blanca que se abre);
  - un estudio de noticias de los 80 con el logo del Canal 7, un monitor con un planeta anillado y la luz de "en vivo";
  - una robot presentadora con cara de pantalla (ojos y una boca de barras de ecualizador) da las noticias;
  - la estática corta la señal y aparece un **mensaje alienígena** (cabeza verde, anillo de glifos que gira, onda de señal y el subtítulo "…no están solos…");
  - más estática, la **carta de ajuste** y la vuelta al estudio, con la robot desconcertada ("¿…Hola? ¿Seguimos al aire?").
- **Cortes:** cada "canal" es una capa con opacidad en saltos (`mantener`).
- **Estilo:** `pantalla {barrido 0.32, curvatura 0.12, aberracion 2, ruido 0.05, vineta 0.55, parpadeo 0.04}`, resplandor y la estática animada.

## Resultado de la fase 10: low poly / facetado (2026-11-22)

### Capacidad general: facetas
- **Formato:** `facetas: {luz | luces, detalle, relieve, azar, semilla, sombra, luzMax}` en una parte con `poligono` y `color`. Está en `src/Clases/Autoria/Facetas.js` y el compilador la expande antes de compilar las partes.
- **Cómo funciona:**
  - pone puntos en el borde (uno cada `detalle`) y en una grilla interior con azar;
  - los une con una **triangulación de Delaunay** (Bowyer-Watson) y se queda con los triángulos que tienen el centro adentro;
  - cada punto recibe una **altura imaginaria**, mayor lejos del borde y con algo de azar;
  - la normal de cada cara 3D contra la luz da su tono: `sombra` es el de la cara más oscura y `luzMax` el de la más iluminada.
- **Luz que se mueve:** con `luces: [[t, [x, y, z]], …]`, cada triángulo lleva un color por estado (`colores`) y `claves.forma`, y las caras cambian de tono con el morphing de color que ya existía.
- **Sin rayitas entre triángulos:** cada triángulo lleva `borde` del mismo color que su relleno, para tapar las uniones.
- **Pruebas:** `pruebas/facetas.test.mjs`, 4 (95 en toda la suite).

### "El valle de las montañas de cristal" (15 s, horizontal 1280x720)
- **La escena:**
  - amanece en un valle de triángulos, con cielo en tres bandas facetadas y un sol facetado que sube;
  - hay una cordillera lejana lila, montañas de cristal azules con nieve, colinas verdes, pinos de dos caras y nubes facetadas;
  - un río con destellos que corren;
  - un ciervo low poly baja hasta la orilla, bebe y levanta la cabeza.
- **El amanecer:** la luz llega rasante desde la izquierda y va subiendo, así que las caras de montañas, colinas y río cambian de tono. Además, `estilo.claves.brillo` aclara toda la imagen de a poco.
