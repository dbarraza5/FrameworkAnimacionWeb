# Plan: sonido en el editor de animación

> Pedido del usuario (2026-11-16): integrar sonido en el proyecto de animación, con una forma de **rastrear qué sonidos faltan** y de **marcar qué contenido lleva sonido o no**, para que el seguimiento no avise de lo que no lo necesita.

## Decisiones

| # | Decisión | Por qué |
|---|---|---|
| S-D1 | Un sonido es un **recurso del proyecto** (colección `sonidos`, el archivo en el storage). Escenas y assets guardan **referencias** (`clip`), nunca el audio. | Igual que las instancias: liviano, y un mismo sonido se usa en muchos lugares. |
| S-D2 | Un sonido puede existir **pendiente** (con nombre, sin archivo). Se coloca y sincroniza ya, y el seguimiento recuerda subirlo. | Es lo que pide el usuario: saber qué falta subir. También deja que el asistente prepare el sonido de una escena sin tener los archivos. |
| S-D3 | Una sola pieza genérica, el **clip** `{id, sonido, t, volumen, pan, recorte, bucle, fundido}`, en tres lugares: la **escena** (`escena.sonidos`, tiempo de la escena), un **evento** (`evento.sonidos`, tiempo relativo al evento; las instancias lo heredan) y un **objeto** (`grupo.sonidos.clips`). | Un solo formato que entienden el motor, la mezcla, el seguimiento y la autoría. |
| S-D4 | **Reacciones a sucesos de la física**: `grupo.sonidos.reacciones` en efectos (`al_detonar`, `al_disparar`, `al_impactar`) y objetos (`al_soltarse`, `al_tocar_suelo`). En un asset van en `escena.reacciones` y sus instancias las heredan. El instante sale de la simulación, que es determinista. | Un impacto no tiene tiempo fijo: si se mueve la persona o cambia la fuerza, el sonido se mueve solo. |
| S-D5 | **Ajuste por instancia** `instancia.audio = {volumen, silencio}`. | Mismo criterio que la escala por instancia: no tocar el asset. |
| S-D6 | **Marca de sonido** `sonido_marca: "lleva" \| "no_lleva"` en eventos, objetos y efectos, y `escena.sonido_marca` en la escena. Sin marca = sin decidir. | El seguimiento solo insiste en lo que lleva sonido; lo marcado "no lleva" deja de avisar. |
| S-D7 | **El audio no tiene reloj propio**: sigue al tiempo de la escena del motor (`_t_escena`). Se observa el motor y se reprograma al saltar, pausar o reiniciar. | Vista previa, línea de tiempo y exportación quedan alineadas, sin tocar cada botón del editor. |
| S-D8 | Exportar con sonido: **mezcla sin tiempo real** (`OfflineAudioContext`, mismo resultado siempre); AAC u Opus con WebCodecs dentro del MP4 (`mp4-muxer`), y `audio.wav` en la secuencia PNG. | Determinista y en el navegador, como el video. |

## Seguimiento (qué avisa)

| Nivel | Cuándo |
|---|---|
| **Falta subir** | un clip o una reacción usa un sonido **pendiente** (sin archivo) |
| **Sonido borrado** | un clip o una reacción apunta a un sonido que ya no existe |
| **Falta sonido** | el elemento está marcado **lleva** pero no tiene clips ni reacciones |
| **Sin decidir** (aviso suave) | eventos, efectos, objetos con física y la escena (música) sin marca ni sonido. Se resuelve poniéndole sonido o marcándolo **no lleva**. |

Se ve en el editor (pestaña **Sonido**) y para todo el proyecto (página del proyecto → **Sonido**), y lo reporta `reporte.mjs`.

## Fases

- **S1 — Datos y servidor:**
  - modelo `Sonido`; campos nuevos en los schemas (`sonidos`, `sonido_marca`, `instancia.audio`);
  - rutas con sesión: listar, crear pendiente, subir o reemplazar el archivo, renombrar, borrar (si no se usa) y servir el archivo;
  - en `/autoria`: listar y crear pendientes.
- **S2 — Motor:**
  - sucesos de la física (`SimFisica`);
  - `Clases/Sonido/Pista.js` (puro): clips de la escena en tiempo absoluto, sumando escena, eventos, instancias con su evento/desfase/bucle, objetos y reacciones;
  - `Clases/Sonido/Seguimiento.js` (puro);
  - pruebas.
- **S3 — Reproducción:** `Clases/Sonido/MotorAudio.js` (Web Audio) sincronizado con el editor.
- **S4 — Interfaz:**
  - pestaña **Sonido** en el editor: biblioteca del proyecto, sonido del elemento elegido (clips, reacciones, marca) y seguimiento;
  - pestaña **Sonido** en la página del proyecto: biblioteca y seguimiento de todos los documentos.
- **S5 — Exportar:** MP4 con pista de audio; `audio.wav` en el `.zip`.
- **S6 — Autoría:**
  - formato simple (`sonidos`, `reacciones`, `sonido` por nombre), compilador y descompilador;
  - catálogo de sonidos;
  - el reporte incluye el seguimiento;
  - documentos.

## Estado

- [x] S1 · [x] S2 · [x] S3 · [x] S4 · [x] S5 · [x] S6 (2026-11-16)

## Alcance realizado (2026-11-16)

- **S1 (backend):**
  - modelo `Sonido` (colección `sonidos`, nombre único por proyecto, `estado` pendiente/listo, `revision`, `duracion_ms`, `picos`, `nota`);
  - `routes/Sonidos.js` con sesión y solo para el dueño: listar, crear (con archivo queda listo; sin archivo, pendiente), subir o reemplazar el archivo, renombrar, ver usos, borrar (409 si se usa, salvo `?forzar=1`) y servir el archivo. Audio de hasta 15 MB;
  - schemas: `sonidos` y `sonido_marca` en eventos y grupos, y `instancia.audio`;
  - `/autoria/sonidos`: listar, y crear pendientes con nota.
- **S2 (motor):**
  - `SimFisica.sucesos(hasta)`: `detonar`, `disparar`, `impactar`, `soltarse` y `tocar_suelo`, deterministas;
  - `Clases/Sonido/Pista.js` (`clipsEscena`, `referencias`) y `Clases/Sonido/Seguimiento.js`;
  - `GestionEvento.clipsAudio()`: el asset cargado guarda sus clips y reacciones (`a.audio`).
- **S3:**
  - `Clases/Sonido/MotorAudio.js`: Web Audio con recorte, bucle, fundidos, pan y velocidad, y botón de silencio;
  - observa el motor cada 100 ms y reprograma al saltar;
  - el motor guarda *cuándo* midió `_t_escena`, para estimar el instante entre cuadros;
  - la pausa del editor (relojes pausados con `reproducir` aún en true) cuenta como detenido.
- **S4:**
  - pestaña **Sonido** del editor (`Componentes/Sonido/PanelSonido.js`): elemento elegido (o el objeto seleccionado en el lienzo), marca, clips en el instante actual, reacciones según el tipo, ajuste por instancia, seguimiento con "ir a" y "No lleva", y biblioteca;
  - pestaña **Sonido** del proyecto (`SonidoProyecto.js`): biblioteca y seguimiento de todos los documentos;
  - `BibliotecaSonidos.js`: subir varios, crear pendiente, escuchar, subir o reemplazar, borrar avisando dónde se usa.
- **S5:**
  - `Clases/Sonido/Mezcla.js` (`mezclar` con `OfflineAudioContext`, `wav`, `analizar`);
  - `Mp4.audio()`: AAC u Opus con WebCodecs;
  - casilla **Con sonido** en *Exportar video*: pista del MP4, o `audio.wav` en el `.zip`.
- **S6:**
  - formato simple: `sonidos` (con `evento` opcional), `reacciones` (forma corta `"al_disparar": "Bang"`), `sonido` (marca), `marcas` por evento, `audio` en instancias;
  - el compilador valida nombres, reacciones por tipo y marcas, y el descompilador hace la vuelta exacta;
  - `autoria.mjs`: comandos `sonidos` y `sonido-pendiente`, y opción `--crear-pendientes`;
  - `reporte.mjs`: sección Sonido, y sus avisos.

**Verificado** (copia `prueba_S Disparo` y sonidos sintetizados `prueba_S …`, todo borrado al final):
- [x] Subir 3 WAV con duración y forma de onda, y crear un pendiente desde la interfaz.
- [x] Reacciones del Disparo y de la víctima, y clip de música en bucle. Los clips calculados: bang, golpe y quiebre a los 2500 ms, golpe al suelo a los 2883 ms (sale de la física; con máx. 1). Los mismos instantes en el navegador y en `reporte.mjs`.
- [x] Seguimiento: "Falta subir" por el pendiente y "Sin decidir" por los candidatos. "No lleva" lo quita. Subir el archivo del pendiente quita "Falta subir".
- [x] **Subir** guarda clips, reacciones y marcas (comprobado en la base).
- [x] Reproducir programa lo esperado. Saltar a 2,4 s reprograma desde ahí (la música sigue a 486 ms de su segunda vuelta). Pausar silencia.
- [x] MP4 con sonido de 4 s: pista de audio de 4,10 s en estéreo. Volumen RMS de 0,26 con la música y de 0,60 en el impacto.
- [x] `.zip` con `audio.wav` del rango exportado.
- [x] Página del proyecto: seguimiento de los 21 documentos.
- [x] Pruebas: 19/19, incluidas las de pista, herencia, reacciones, seguimiento, sucesos deterministas, formato simple con sonido y vuelta exacta.

**No probado:** escuchar de verdad (en el navegador controlado solo se pudo verificar lo programado y la mezcla); archivos MP3/OGG reales (se probó con WAV); un proyecto con muchos sonidos largos (memoria de los buffers).

**Límites conocidos:** los eventos con **bucle** del propio documento no repiten sus clips (las instancias sí); los sonidos `espaciales` (pan según la posición) quedaron fuera; los clips no tienen claves de volumen (sí fundidos).
