# El zorro y el cuervo: historia corta para TikTok (nov-2026)

**Pedido del usuario (2026-11-19):** armar una historia corta que ya exista, con diálogos, en formato de video para TikTok. Las nuevas capacidades deben servir para cualquier historia, no solo para esta.

**Decisiones del usuario**
- **Historia:** "El zorro y el cuervo", fábula de Esopo de dominio público. Los diálogos se escriben nuevos, en español.
- **Diálogos:** en **globos de diálogo** que salen del personaje que habla, con el texto apareciendo letra por letra. No hay voz.
- **Duración:** de 45 a 60 s, vertical 9:16.
- **Proyecto:** uno nuevo, con la historia como **capítulo** y sus escenas en orden (planeacion_organizacion.md).

**Forma de trabajo:** una fase a la vez; el usuario la revisa y recién entonces se pasa a la siguiente. Las capacidades nuevas son opcionales y la regresión visual compara todos los documentos: nada de lo existente cambia.

| Fase | Qué | Estado |
|---|---|---|
| 1 | **Formato vertical 9:16:** cámara vertical en la autoría y el editor, exportar MP4 vertical (ancho 720 o 1080) y render con cámara vertical | hecha (falta verla en el editor: sesión vencida) |
| 2 | **Globos de diálogo** (capacidad nueva del motor) | hecha |
| 3 | **Personajes y fondo:** zorro, cuervo (con pico que se abre), queso, árbol y bosque, más **acciones de instancia** en el motor | hecha |
| 4 | **Las escenas** del capítulo, con sonido | hecha |
| 5 | **Video del capítulo:** exportar un capítulo entero, con sus escenas en orden, como un solo MP4 vertical | **hecha, a revisar** |

## Fase 1: vertical 9:16

- **Autoría:** `camara: {tamano: [720, 1280]}`. El tamaño es en unidades del dibujo; se usa 720×1280 para que la escala de los personajes sea la misma que en 16:9, con 720 de alto. La resolución del video se elige al exportar. Se revisa que el compilador, el render en memoria y el reporte ("fuera de cámara") ya funcionen con una cámara vertical, y se corrige lo que no.
- **Exportar video:** el ancho se elige pensando en una cámara horizontal (320 a 1280). Se agregan 720 y 1080 para que un video vertical salga de 720×1280 o 1080×1920.
- **Editor:** el marco de la cámara y la "Vista de cámara" con proporción vertical.
- **Prueba:** una escena corta vertical, renderizada y exportada.

## Fase 2: globos de diálogo

Es una capacidad genérica. En el formato simple de la escena:

```json
"dialogos": [
  {"quien": "Zorro", "texto": "¡Qué plumas tan brillantes!", "desde": 4000, "hasta": 7000},
  {"quien": "Cuervo", "texto": "...", "desde": 7500, "hasta": 9000, "estilo": "pensamiento"}
]
```

- **Anclaje:** el globo sigue al objeto `quien` (su posición en cada cuadro). El texto se corta en líneas solo y la cola apunta al personaje.
- **Estilos:** `dialogo` (normal), `grito` (borde en picos) y `pensamiento` (nubes y burbujas).
- **Animación:** el globo aparece con un pequeño rebote, el texto se escribe letra por letra (velocidad configurable) y el globo desaparece al final.
- **Encuadre:** si el globo se sale de la cámara, se corre hacia adentro; los globos que coinciden en el tiempo se apilan sin taparse.
- **Fuente** legible en el teléfono, con un tamaño relativo a la cámara.
- **Edición:**
  - el compilador valida (`quien` existe, los tiempos y los estilos);
  - el descompilador hace la ida y vuelta;
  - el editor muestra los globos al reproducir y en el video exportado.
- **Pruebas:** ajuste del texto en líneas, posición dentro de la cámara y escritura letra por letra en el tiempo.

## Fase 3: personajes y fondo

- **Zorro:**
  - de perfil, con cola esponjosa;
  - camina con piernas articuladas (IK de la fase 3 de capacidades);
  - cabeza y orejas expresivas;
  - la cola con inercia.
- **Cuervo:**
  - en la rama;
  - el pico se abre: arriba y abajo por separado, para "cantar" y soltar el queso;
  - alas que se acomodan, plumas negras con brillo azulado (degradado) y ojos que parpadean.
- **Queso:** cae con física y rebota.
- **Árbol y bosque:**
  - planos de profundidad, luz de mañana y sombras;
  - partículas suaves: hojas y polvo de luz.
- **Prueba:** una hoja de render de cada asset.

## Fase 4: escenas (capítulo "El zorro y el cuervo")

Guion tentativo, de unos 50 s:

1. **El queso** (unos 8 s): el cuervo se posa en la rama con un queso en el pico. Entra el zorro olfateando y se le iluminan los ojos.
2. **La adulación** (unos 20 s): el zorro elogia las plumas y la elegancia del cuervo y le pide que cante. El cuervo, en pensamiento: "¿Cantar?… ¡Claro que sí!".
3. **El canto** (unos 10 s): el cuervo abre el pico para un "¡CRAAA!" (globo de grito). El queso cae, rebota y el zorro lo atrapa.
4. **La moraleja** (unos 10 s): el zorro se va con el queso y dice: "Quien vive del halago, paga con lo que tiene". El cuervo queda boquiabierto. Al final aparece la moraleja en pantalla.

Sonido: ambiente de bosque, pájaros, el graznido, el golpe del queso y los pasos del zorro, todo sintetizado como en las fases anteriores.

## Fase 5: video del capítulo

- **Exportar el capítulo:** desde la página del proyecto, un botón en el capítulo que renderiza sus escenas en orden y las une en un solo MP4 vertical, con el audio de cada escena.
- **Transición:** opcional, un corte o un fundido corto entre escenas.
- **Herramienta sin navegador:** `render_memoria` con `--capitulo`, para revisar el video completo.
- **Entrega:** el MP4 final de 1080×1920 listo para subir.

### Resultado de la fase 1 (2026-11-19)

**Hecho**
- **Compilador:**
  - `camara.tamano` se valida: un par de números positivos;
  - sin `centro`, la cámara se centra en su cuadro (`[360, 640]` en vertical);
  - en horizontal queda igual que antes, `[640, 360]`.
- **Editor** (Inspector de la cámara): un selector de **Formato** con Horizontal 16:9 (1280×720), Vertical 9:16 (720×1280), Cuadrado 1:1 y Vertical 4:5. El marco y la "Vista de cámara" ya seguían el tamaño de la cámara.
- **Exportar video:**
  - anchos nuevos de 720 y 1080;
  - cada opción muestra el tamaño final; con cámara vertical, 1080 da **1080×1920**;
  - Chrome codifica 1080×1920 en H.264 (perfil Main o High, unos 9 Mbit/s a 30 cuadros por segundo).
- **Arreglo:**
  - la Biblioteca mostraba el error del backend como un objeto (`{name, msj}`, por ejemplo con la sesión vencida), y eso **tumbaba todo el editor**;
  - ahora lo muestra como texto (`textoError`).

**Verificado**
- 53 pruebas del frontend, entre ellas la de la cámara vertical: tamaño, centro, error y la ida y vuelta.
- `render_memoria` de una escena vertical de prueba: el cuadro de 720×1280 sale completo, con un paneo y un zoom de cámara.
- Proyecto **"El zorro y el cuervo"** creado, con la escena `prueba_vertical`. Se borra al empezar la fase 4.
- **Pendiente** (la sesión del navegador venció): ver en el editor el selector de Formato y el marco vertical.

### Resultado de la fase 2 (2026-11-19)

**Hecho**
- `src/Clases/EditorEvento/Dialogos.js` (nuevo):
  - funciones puras: `cortarLineas`, `estadoGlobo` (el rebote al aparecer, las letras escritas y el desvanecido) y `ubicarGlobo` (arriba o abajo de quien habla, dentro del cuadro y sin tapar otros globos);
  - `dibujarDialogos`, que dibuja los 4 estilos: globo redondeado con cola, grito con picos, nube con burbujas y franja de narrador.
- **Motor:** `GestionEvento.dibujarDialogos(ctx, ox, oy)` se llama después de los efectos, en el editor (`GestionLienzoEvento`) y en `Render.dibujarCuadro` (exportar video, `render.mjs` y `render_memoria`).
- **Tamaño:** relativo a la cámara. El texto mide un 5% del lado corto del cuadro, unos 54 px en un video de 1080 de ancho, y con zoom se lee igual.
- **Compilador:**
  - `dialogos` va a `escena.dialogos`, y `quien` se convierte en el nombre del grupo;
  - valida los campos, los estilos, los tiempos y que `quien` exista;
  - avisa si un texto no alcanza a escribirse.
- **Descompilador:** la ida y vuelta es exacta.
- Guía (§ Globos de diálogo y formato vertical).

**Verificado**
- 58 pruebas (`dialogos.test.mjs`):
  - cortar líneas (con acentos y palabras largas);
  - el tiempo (rebote, letras y desvanecido);
  - la ubicación (borde, cambio de lado, apilado);
  - el compilador (errores y la ida y vuelta);
  - el render real con los píxeles del globo y del narrador.
- **Regresión:** 178 documentos iguales a `base8`.
- Escena `prueba_globos`, vertical y con los 4 estilos, en el proyecto "El zorro y el cuervo", más un GIF de revisión. Se borra al empezar la fase 4.
- **Pendiente** (la sesión del navegador venció): verla en el editor al reproducir.

### Resultado de la fase 3 (2026-11-19)

**Capacidad nueva del motor: acciones de una instancia.**
- En la escena, `acciones: [[t, "Evento", bucle?]...]` en una instancia. Desde `t`, la instancia reproduce ese evento del asset **desde su comienzo**, en bucle salvo `false`. Por ejemplo, el zorro camina, olfatea, habla y salta sin armar una instancia por acción.
- `GestionEvento.accionEn(inst, t)` decide el evento vigente. Lo usan `aplicarInstancias` y el reloj de las claves (`_relojClaves`, para que la inercia siga a la acción).
- Backend: `instancia.acciones` en el esquema (`modelo/Animacion.js`).
- El compilador valida que los eventos existan en el asset y que los tiempos vayan en aumento. El descompilador hace la ida y vuelta.
- **Límite:** los sonidos heredados del asset (`Pista.js`) siguen el `evento` de la instancia, no sus acciones.

**Assets** (`herramientas/ejemplos/zorro/generar.mjs`; cada acción es un evento del asset y su pose es una función del tiempo muestreada cada 50 ms):

| Asset | Acciones (eventos) | Notas |
|---|---|---|
| **Zorro** | Quieto, Caminar (trote de 800 ms), Olfatear, Hablar (mirando arriba, ojos astutos), Mirar arriba, Atrapar (una vez: se agacha, salta, abre la boca y queda con el queso), Quieto con queso, Hablar con queso, Caminar con queso | Mira a la derecha. Cola con inercia en la punta, párpado con formas (abierto, cerrado y astuto), mandíbula articulada y queso en la boca que aparece con la opacidad. |
| **Cuervo** | Quieto, Mirar abajo, Orgulloso (pecho inflado, ojos felices), Cantar (una vez: abre el pico y las alas; el queso del pico desaparece a los 300 ms), Sorprendido, Quieto sin queso | Mira a la derecha (en la escena va con `espejo`). El pico de arriba y el de abajo van por separado, y el queso cuelga del de abajo. |
| **Queso** | — | Cuña con agujeros, base en y = 0. Es el que cae, con claves en la escena. |
| **Árbol del cuervo** | — | La rama larga va a la **izquierda**. Percha del cuervo: `[-232, -628]` desde los pies del árbol. El follaje se mece. |
| **Bosque** | — | Fondo de 1040 × 1800: cielo de mañana, sol con brillo, colinas, pinos lejanos, bruma, pasto, sendero, matas y flores. Suelo en y = 0. |

**Escena de muestra** `prueba_personajes`, vertical, de unos 12,6 s, solo para revisar:
- el zorro llega caminando, olfatea y habla mirando arriba;
- el cuervo, orgulloso, canta: el queso cae del pico, el zorro salta y lo atrapa;
- el cuervo queda sorprendido y el zorro se va caminando con el queso;
- incluye globos.

**Verificado**
- 59 pruebas, entre ellas la de las acciones: compilar, validar, la ida y vuelta, y `accionEn`.
- **Regresión:** 178 documentos iguales.
- Render de cerca de cada acción, con el zorro y el cuervo a 1080 px.
- La escena guardada en la base se dibuja igual (`render.mjs`, por la API).
- Assets creados en el proyecto "El zorro y el cuervo": Zorro `6aff9b4a…e353`, Cuervo `…e622`, Queso `…e7bb`, Árbol del cuervo `…e9b5` y Bosque `…ed5c`. También la escena `prueba_personajes` `…ef80`.

**Para la fase 4**
- Los personajes se ven chicos en el cuadro completo: usar zoom y planos de cámara (generales, medios y primeros planos).
- Ajustar la caída del queso a la boca del zorro con su pose real.

**Entorno con vida** (pedido del usuario: el entorno se veía vacío y estático)
- **Bosque** (40 s en bucle):
  - nubes que avanzan, un sol que respira y pájaros lejanos que aletean y cruzan;
  - 5 árboles intermedios que se mecen, con colores apagados por la distancia;
  - rayos de sol (`mezcla: suma`) que suben y bajan de intensidad;
  - pasto en matas, flores con tallo, matas, piedras y hongos, todo con viento a ritmos distintos;
  - la sombra del árbol.
- **Assets nuevos:**
  - **Mariposa amarilla** y **Mariposa azul**: aletean en el lugar y el vuelo en ochos lo dan las claves de la escena;
  - **Hoja**: cae en 7 s dando vueltas y bamboleándose; se instancia varias veces con `desfase`;
  - **Helechos**: primer plano en sombra, que da profundidad.
- **En la escena:** partículas de **motas de luz** (`suave`, `suma`).
- **Rendimiento:** unos 90 ms por cuadro a 1080×1920 en Node.

### Resultado de la fase 4 (2026-11-19)

**Escenas** del capítulo **"El zorro y el cuervo"**, en orden: 50,5 s en total, verticales, con `precision: "decimal"` y profundidad. "1. El queso" es la principal.

| Escena | Dur. | Qué pasa | Cámara |
|---|---|---|---|
| **1. El queso** | 10,5 s | Título; el narrador presenta al cuervo con el queso; el cuervo piensa en su desayuno; entra el zorro caminando, olfatea, mira arriba y piensa "Ese queso… ¡será mío!" | general → acercamiento al cuervo → corte al suelo → primer plano de la cara del zorro |
| **2. La adulación** | 20 s | El zorro saluda y elogia las plumas; el cuervo desconfía y después se infla de orgullo; el zorro le pide una canción; "¿Cantar? ¡Claro que sí!" | plano de los dos y primeros planos alternados, con cortes |
| **3. El canto** | 8 s | "¡CRAAA!"; el queso cae girando; el zorro salta y lo atrapa ("¡Ñam!"); "¡¿Mi queso?!" | primer plano del cuervo → la cámara sigue al queso hasta la boca → plano de los dos → cara del zorro |
| **4. La moraleja** | 12 s | "Amigo Cuervo: quien vive del halago… ¡paga con lo que tiene!"; el zorro se va con el queso; el cuervo, arrepentido; moraleja y "Fábula de Esopo" | primer plano → los dos → el plano se abre al general |

- **Encuadres** (`generar.mjs`, `PLANO` y `camara()`): `[t, cx, cy, zoom, paso]` con paso "corte", "suave" o "lineal". Un corte son dos claves separadas por 1 ms.
- **Sincronía:**
  - la boca del zorro a los 600 ms de "Atrapar" se calculó desde su pose: `[ZX + 138, PISO − 196]`;
  - el queso de la escena aparece cuando desaparece el del pico (a los 300 ms de "Cantar") y llega a la boca justo cuando aparece el de la boca del zorro.
- **Sonidos sintetizados** (`ejemplos/zorro/sonidos_backend.js`, todos "listos"):
  - Bosque (viento y pajaritos, en bucle), Pasos (recortados a lo que dura la caminata), Olfateo, Graznido (diente de sierra con formantes y aspereza), Salto, Mordida, Pop (uno por globo);
  - Melodía y Melodía final (cuerda pulsada Karplus-Strong, pentatónica).
  - El seguimiento queda en 0: el evento general y las motas de luz van marcados "no lleva".
- `render_memoria` tiene `--escena <archivo>` para renderizar las otras escenas de la carpeta (`historia_1..4.json`).

**Arreglos**
- **Línea clara sobre el fondo:**
  - una parte con degradado y sin `borde` dibuja su contorno con el último color del degradado (`Compilador.js`, línea 273);
  - en la bruma, que es translúcida, se veía como una línea al hacer zoom;
  - se resolvió con `borde` transparente en el asset; el motor no se tocó, para no cambiar las 178 animaciones.
- **Globos con el contexto falso del reporte:** `measureText` no da el ancho, así que no se dibujan y el reporte ya no falla.
- **Nube de pensamiento:** más ancha (72% del ancho máximo), para no cortar el texto en tantas líneas.

**Verificado**
- 59 pruebas.
- **Regresión:** 178 iguales.
- Hojas de render de cada escena y `reporte.mjs` de las 4: 28 clips en su lugar, 0 pendientes.
- GIF de cada escena renderizado desde la base.
- Se borraron las escenas de prueba (`prueba_vertical`, `prueba_globos` y `prueba_personajes`). El proyecto quedó con los 9 assets, las 4 escenas y el `evento_default`.
- **Pendiente** (la sesión del navegador venció): escuchar el sonido en el editor y medir qué tan fluido se reproduce.

### Resultado de la fase 5 (2026-11-19)

**Hecho**
- `src/Clases/Autoria/Capitulo.js` (nuevo), que sirve para cualquier capítulo:
  - `prepararEscena(doc, cargadorAssets)` arma un motor por escena, con sus assets cargados;
  - `planCapitulo`, `escenaEn` y `negroEn` (el fundido a negro al entrar y salir de cada escena);
  - `cuadroCapitulo` dibuja con el mismo `Render.dibujarCuadro` que el editor y "Exportar video";
  - `mezclaCapitulo` mezcla cada escena sin tiempo real (`Mezcla.mezclar`) y la pega en su lugar en una sola pista;
  - `exportarCapitulo` arma el MP4 H.264 (`Mp4.js`) con la pista de audio.
- **Página del proyecto:** en cada capítulo con escenas, el botón **"Ver y exportar"** abre `ModalCapitulo.js`:
  - vista previa de corrido con sonido: el reloj es el del audio y, si el dibujo no llega a tiempo, salta cuadros sin perder la sincronía;
  - barra para buscar e índice de escenas;
  - opciones: ancho (540, 720 o 1080 → 1080×1920), 24 o 30 cuadros por segundo, corte o fundido entre escenas, y sonido sí o no;
  - **Exportar MP4**, con progreso por escena y botón para cancelar.
- `render_memoria`: con `--escena a,b,c` y `--gif`, encadena varias escenas en un solo GIF, para revisar sin navegador.
- `motor.mjs` exporta `Capitulo`.

**Verificado**
- 62 pruebas (`capitulo.test.mjs`, con las 4 escenas reales):
  - el plan (inicios, duraciones y total de 50,5 s);
  - en qué escena cae cada instante;
  - el fundido (negro en los bordes, nada en el medio, corte con 0);
  - los cuadros son deterministas.
- **En el navegador**, con la sesión del usuario:
  - el panel carga las 4 escenas en unos 3 s;
  - la vista previa avanza a tiempo real con sonido;
  - **MP4 exportado:** 540×960, 50 s, 24 cuadros por segundo, con sonido, 12,1 MB, en unos 80 s.

**Ajuste después de revisar el video (pedido del usuario):** la cola del globo apuntaba al centro de la caja del personaje, que en el zorro incluye la cola. Ahora apunta a la parte **`cabeza`** del asset, si existe (`Dialogos.cajaHablante`); con `parte: "…"` se elige otra. Hay una prueba nueva y van 63.

**Boca del zorro rehecha (pedido del usuario: "se ve un poco rara"):**
- **Antes:**
  - el cachete blanco tapaba la mandíbula, así que al hablar solo asomaba una cuña oscura;
  - con la boca cerrada asomaba el interior rojo;
  - el bigote era un palito recto.
- **Ahora:**
  - hocico blanco solo arriba de la línea de la boca;
  - mandíbula que tapa del todo el interior al cerrarse;
  - interior con lengua que gira un 70% de lo que gira la mandíbula, así siempre llena la abertura;
  - garganta blanca detrás de la bisagra y un colmillito;
  - sin bigote.
- Zorro actualizado en la base (respaldo: versión 1).

**Bosque actualizado en la base** (respaldo: versión 2): la corrección del borde de la bruma (la línea clara) estaba en el generador, pero no se había subido.

**Nube de pensamiento rehecha** (pedido del usuario: "parece como si tuviera bolas"):
- **Antes:** era una elipse con círculos pegados alrededor, que en globos anchos parecían bolas sueltas.
- **Ahora** (`Dialogos.js`: `geometriaNube`, `caminoNube` y `extraNube`):
  - un solo contorno con festones (curvas Bézier hacia afuera, por la normal de la elipse);
  - festones repartidos por el largo del contorno y de altura fija (0,55 letras), así salen parejos en globos anchos o chicos;
  - tres burbujas ovaladas que bajan hacia quien piensa.
- El cambio está en el motor: lo toman las escenas sin volver a subirlas. Van 63 pruebas.
