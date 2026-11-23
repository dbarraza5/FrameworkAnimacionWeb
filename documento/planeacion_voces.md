# Voces de los personajes con Kokoro (nov-2026)

**Pedido del usuario (2026-11-20):** poner voz a los personajes con un modelo que corra **en la computadora, sin costo**. Elegido: **Kokoro** (Kokoro-82M, licencia Apache 2.0: se puede usar en videos monetizados). Corre en procesador, sin tarjeta gráfica.

**Forma de trabajo:** una fase a la vez. El usuario la revisa y recién entonces se pasa a la siguiente. Todo es opcional: una escena sin voces queda igual que antes.

| Fase | Qué | Estado |
|---|---|---|
| 1 | **Kokoro en Docker** y muestras: las voces en español con variaciones de tono y velocidad, para elegir la voz del zorro, la del cuervo y la del narrador | hecha |
| 2 | **Voces de una escena:** de los `dialogos` de la escena a un WAV por línea con la voz de cada personaje, subidos como sonidos del proyecto; el globo dura lo que dura la voz | **hecha, a revisar** |
| 3 | **Boca desde la voz** (capacidad general): la mandíbula del zorro y el pico del cuervo se abren según el volumen del audio | **hecha, a revisar** (ver abajo) |
| 4 | **"El zorro y el cuervo" con voces:** las 4 escenas con voces, con los tiempos reajustados, y el MP4 del capítulo | **hecha con ElevenLabs, a revisar**; con boca sincronizada |

## Fase 1: Kokoro en Docker y muestras

- **Contenedor aparte**, `kokoro`, para no tocar el frontend ni el backend:
  - base Python;
  - `espeak-ng`, que Kokoro usa para pronunciar español;
  - el paquete `kokoro` y PyTorch para procesador.
- **Modelo:** `hexgrad/Kokoro-82M` de Hugging Face, unos 330 MB. Queda en un volumen, así que se baja una sola vez.
- **Un servicio mínimo** dentro de la red de Docker: recibe `{texto, voz, velocidad}` y devuelve un WAV. Lo usan las herramientas del frontend.
- **Muestras:**
  - las voces en español (al menos `ef_dora`, `em_alex` y `em_santa`) diciendo líneas de la historia;
  - variaciones de tono (más grave para el zorro, más agudo y áspero para el cuervo) y de velocidad.
- **Entrega:** carpeta con los WAV para escuchar y elegir.

## Fase 2: voces de una escena

- **En el formato simple de la escena:**
  - `voces: {zorro: {voz: "em_alex", tono: -2, velocidad: 0.95}, cuervo: {...}, narrador: {...}}`;
  - cada diálogo usa la voz de su `quien`, y el narrador la suya;
  - los pensamientos llevan voz o no, según lo que decida el usuario.
- **Herramienta** `herramientas/voces.mjs`: genera los WAV, los sube como sonidos del proyecto (con su forma de onda) y pone los clips en la escena, en el instante de cada globo.
  - Si la voz dura más que el globo, avisa o estira el globo.
- **Efectos de voz:** cambio de tono sin cambiar la velocidad, y algo de aspereza para el cuervo. Se hacen en el generador, sin programas externos.

## Fase 3: boca desde la voz

- **Asset:** declara qué parte es la boca y cómo se abre, por ejemplo `boca: {parte: "mandibula", prop: "rotacion", cerrada: 0, abierta: 16}`.
- **Escena:** con la voz de un diálogo, se generan las claves de apertura desde el volumen del WAV, suavizado y con cierres en los silencios. Sirve para cualquier personaje.

## Fase 4: la historia con voces

- **Voces:** las 4 escenas con las voces elegidas.
- **Tiempos:** se reajustan los globos y las acciones (hablar o mirar) a la duración real de cada línea.
- **Capítulo:** se revisa entero con "Ver y exportar" y se exporta el MP4 final.

### Resultado de la fase 1 (2026-11-20)

**Hecho**
- **Imagen** `img_kokoro:1.0` (`compose-frameworkweb/kokoro/`: `Dockerfile`, `servidor.py` y `muestras.py`):
  - Python 3.11 slim, espeak-ng, PyTorch y torchaudio para procesador, `kokoro` y `soundfile`;
  - descargas autorizadas por el usuario (unos 650 MB).
- **Contenedor** `kokoro_container`:
  - en la red `compose-frameworkweb_vu-network`, **sin puertos publicados**;
  - el modelo queda en el volumen `kokoro_modelos`;
  - se levantó con `docker run` y no está en el `docker-compose.yml`: sumarlo es una decisión del usuario.
- **Servicio:**
  - `GET /voces` devuelve `ef_dora`, `em_alex` y `em_santa`;
  - `POST /tts {texto, voz, velocidad, tono}` devuelve un WAV de 24 kHz;
  - el tono se cambia en semitonos con `torchaudio.functional.pitch_shift`, sin cambiar la duración.
- **11 muestras** con líneas de la historia: las 3 voces tal cual, 2 narradores, 3 zorros y 3 cuervos.
- **Velocidad:** unos 3 a 6 s de cálculo por cada 3 a 5 s de audio, en procesador; más o menos tiempo real.

**Para la fase 2**
- normalizar el volumen: las voces con tono cambiado salen más bajas, con un pico de 0,3 contra 0,5;
- que el usuario elija la voz de cada personaje y decida si los pensamientos llevan voz.

**Elección del usuario (2026-11-20):**
- **Narrador:** Dora.
- **Zorro**, astuto: grave (`em_alex`, tono −2, velocidad 0,95).
- **Cuervo:** más agudo (`em_alex`, tono +3, velocidad 1,05).
- **Pensamientos:** la misma voz, con eco.

### Resultado de la fase 2 (2026-11-20)

**Hecho**
- `herramientas/voces.mjs` (nuevo): `AUTORIA_LLAVE=... node herramientas/voces.mjs escena.json [--salida x.json]`.
  - **Entrada:** la escena en formato simple con `voces: {narrador: {voz, tono?, velocidad?, volumen?}, <objeto>: {...}}`. Con `voz: false`, un diálogo no lleva voz.
  - **Proceso de cada línea:**
    - Kokoro (`kokoro_container`);
    - recorte de los silencios del principio y del final, y volumen normalizado;
    - en los pensamientos, eco (ecos a 150, 300, 450 y 600 ms, que se apagan);
    - subida como sonido del proyecto, con duración y forma de onda.
  - **Reuso:** el nombre del sonido es `voz <rol> <resumen>`. Si el texto y la voz no cambiaron, se reusa y no se regenera.
  - **Escena de salida:**
    - el clip de voz 150 ms después del "pop" del globo;
    - el globo dura por lo menos hasta la voz más 700 ms;
    - el texto se escribe al ritmo de la voz;
    - los clips de voz anteriores se reemplazan.
  - **Avisos:** voces que se pisan y globos que terminan después del final de la escena.
- **Backend:** `POST /autoria/sonidos/voz {nombre, wav (base64), duracion_ms, picos, nota}`.
  - Solo WAV, hasta 5 MB.
  - Reemplaza un sonido solo si lo creó la misma llave.
  - Es la única forma en que el asistente sube audio, y solo para voces generadas.
- **Compilador:** acepta `voz` en un diálogo.

**Verificado**
- 67 pruebas (`voces.test.mjs`): qué voz lleva cada diálogo, el ajuste del globo y la velocidad, las voces que se pisan, y el audio (ida y vuelta del WAV, recorte, normalizado, eco y forma de onda).
- **Prueba real:**
  - `prueba_voces`, una copia de "2. La adulación" sin capítulo, con 7 voces de 1,7 a 4 s;
  - 3 globos se estiraron;
  - el reporte muestra los 15 clips en su lugar;
  - en una segunda corrida se reusaron las voces.
- **Pendiente:** que el usuario escuche `prueba_voces` en el editor o con "Ver y exportar", en la sección "Sin capítulo".

### Prueba de otro modelo: Chatterbox Multilingual (2026-11-20, pedido del usuario)

- **Qué es:** Resemble AI, licencia MIT, español, control de emoción (`exageracion`) y clonación de una voz con unos 10 s de referencia. Incluye la marca de agua inaudible Perth.
- **Equipo:** GTX 1650 de 4 GB, controlador 516.94. Funciona con PyTorch 2.6 para CUDA 11.8.
- **Imagen** `img_chatterbox:1.0` (`compose-frameworkweb/chatterbox/`) y **contenedor** `chatterbox_container`:
  - con `--gpus all`, en la red del proyecto y sin puertos;
  - volúmenes `chatterbox_modelos` y `chatterbox_refs`;
  - servicio `POST /tts {texto, referencia, exageracion, cfg, temperatura, tono}` en :8881.
- **Referencias:** unos 10 s de las voces de Kokoro elegidas (narrador Dora, zorro grave y cuervo agudo), con un texto neutro.
- **Muestras** (`cb_*.wav`): la voz por defecto, el narrador, y el zorro y el cuervo en "normal" (exageración 0,5) y "actuado" (0,8 a 0,9, cfg 0,35).
- **Velocidad:** de 17 a 55 s de cálculo por línea de 4 a 6 s, entre 4 y 10 veces el tiempo real en la GTX 1650. Unas 20 líneas serían unos 7 minutos, y se reusan las que no cambian.
- **Pendiente:** que el usuario compare con Kokoro y elija.

### ElevenLabs (2026-11-20): elenco final e integración

- **Conexión:** MCP alojado de ElevenLabs, agregado con `claude mcp add --scope user --transport http elevenlabs https://api.elevenlabs.io/v1/mcp`.
  - El usuario se autenticó con OAuth, sin API key.
  - Al principio quedó registrado para `D:/projecto_animacion`, con D mayúscula, y la sesión de VS Code (`d:\…`) no lo cargaba. Por eso se registró a nivel de usuario.
- **Plan:** Starter (unos 30.000 créditos al mes y licencia comercial).
- **Velocidad:**
  - en el plan gratis, la fila compartida (`free_shared`) rechazaba aproximadamente una de cada dos generaciones;
  - con Starter, 17 líneas en 2 min 50 s, sin rechazos;
  - con 3 líneas a la vez (6 tomas) aparece "concurrency limit": ElevenLabs las reintenta solo.
- **Elenco** (`VOCES` en `ejemplos/zorro/generar.mjs`, modelo `eleven_v4`):
  - narradora **Daniela** `2aDqA8lxxUgkAZpuP7vg`;
  - zorro **Ezequiel** `EGuq18jUC3ilTnuBn2wj`;
  - cuervo **Chuysito** `dcEM0WOwbt9XwI31mBIu`.
  - Al cuervo se le marcó la actuación con etiquetas: `[shouting] ¡CRAAA!` y `[shocked] ¡¿Mi queso?!`.
- **Flujo** (`voces.mjs` con `motor: "elevenlabs"`):
  1. `--pendientes` lista las líneas sin audio en `<carpeta>/voces/pendientes.json`.
  2. El asistente las genera con el MCP (flujo de ElevenLabs "El zorro y el cuervo – voces"), baja la toma 1 y la convierte a WAV de 24 kHz mono con el ffmpeg de `chatterbox_container`, como `voces/elevenlabs_<resumen>.wav`.
  3. `voces.mjs escena.json --reubicar` sube las voces y arma la escena con voces.
- **`--reubicar`** (`insertarTiempo`, una capacidad general de la herramienta):
  - si una voz pisaría a la anterior, **inserta tiempo** antes de su diálogo;
  - si una voz no entra en su globo, **la escena espera**: inserta lo que falta donde el globo terminaba;
  - todo lo que viene después se corre (cámara, acciones, claves, efectos, sonidos y globos);
  - los tramos de claves que cruzan el punto se estiran, y un globo que ya empezó no se estira.
- **Resultado:**
  - escenas de 21,5 s, 27,5 s, 9,4 s y 21,8 s: unos 80 s en total (antes eran 50 s);
  - **"historia_N.voces.json"** es lo que está en la base: el generador produce `historia_N.json` y `voces.mjs --reubicar` le agrega las voces;
  - reporte: de 10 a 15 clips por escena, 0 pendientes;
  - se borró la escena `prueba_voces` y sus 7 voces de Kokoro;
  - 68 pruebas.
- **Pendiente:** la boca sincronizada con la voz (fase 3) y la revisión del usuario con "Ver y exportar".

### Retoques después de escuchar la historia (2026-11-20, pedido del usuario)

1. **El cuervo tenía como orejas:** era el "copete", dos picos de plumas en la cabeza. Se quitó y el asset Cuervo se actualizó.
2. **Después del "¡Ñam!" el zorro seguía con el queso:**
   - el Zorro tiene una acción nueva, **Masticar** (1,1 s): la mandíbula baja cada vez menos y el queso se desvanece;
   - escena 3: Atrapar → Masticar → Mirar arriba;
   - escena 4: Hablar y Caminar sin queso.
3. **Los pasos sonaban a robot:**
   - el sonido "Pasos" se reemplazó (mismo nombre, revisión 2) por **efectos de sonido de ElevenLabs** (`eleven_text_to_sound_v3`): "soft footsteps of a small fox trotting lightly on short grass…", 8 s, 4 variantes por unos 70 créditos; se usa la 1;
   - herramienta: `scratchpad/reemplazar_sonido.js` (reemplaza el archivo de un sonido por nombre).
4. **El eco de los pensamientos, más tenue y prolijo** (`voces.mjs`, eco v2):
   - 3 repeticiones a 110, 220 y 340 ms, con volúmenes 0,2, 0,1 y 0,045 y filtradas cada vez más oscuras;
   - cola de 450 ms, antes 650;
   - la versión del eco entra en el nombre del sonido, así que los pensamientos se regeneraron solos y se borraron los 7 con el eco viejo.
- Escenas regeneradas con `voces.mjs --reubicar` y subidas (respaldo: versión 3).
- 68 pruebas; una nueva comprueba que el eco es tenue frente a la voz.

### Resultado de la fase 3: boca desde la voz (2026-11-20)

- **Motor (general):** una instancia puede llevar claves propias de partes de su asset: `claves_partes: {"<parte>": {rotacion|escala_x|escala_y|opacidad: [[t, v, interp?]], peso?: [[t, 0..1]]}}`, con t en ms de la escena.
  - `peso` mezcla la clave con la animación del asset: 0 deja la del asset, 1 manda la clave; sin `peso`, manda siempre la clave.
  - Archivos: `Claves.aplicarClavesParte`, `GestionEvento` (después de la pose del asset), `Compilador` y `Descompilador`; en el backend, `instancia.claves_partes` en `modelo/Animacion.js`.
- **Herramienta:** en `voces`, cada personaje declara su boca: `boca: {parte, prop, cerrada, abierta}` o una lista de partes.
  - `voces.mjs` mide el volumen de cada línea cada 40 ms (`lib/boca.mjs`) y escribe las claves.
  - El `peso` vale 1 mientras suena la voz y durante las acciones que empiezan con "Hablar", para que la boca no se mueva en silencio; afuera vale 0.
  - El narrador y los pensamientos no mueven la boca.
- **Aplicado a:**
  - el zorro: mandíbula de 0 a 16° y el interior de la boca de 0 a 11,2°;
  - el cuervo: pico inferior de 0 a 26° y pico superior de 0 a −8°;
  - Ilun y Kiru: `boca` con `escala_y` de 0,22 a 1.
- **Pruebas:** `pruebas/boca.test.mjs`.
