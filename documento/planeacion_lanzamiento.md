# Lanzamiento de un transbordador espacial (nov-2026)

**Pedido del usuario (2026-11-22):** un proyecto del lanzamiento de un transbordador espacial con buena calidad.

**Decisiones del usuario**
- **Estilo:** realista cinematográfico. Degradados, humo con muchas capas y partículas, resplandor del fuego, cielo que pasa del azul al negro del espacio.
- **Formato:** horizontal 16:9 (1280x720), de **60 a 90 s**, en varias escenas de un capítulo.
- **Momentos:** todos. Plataforma y cuenta regresiva, ignición y despegue, ascenso y separación de los cohetes, y órbita con la Tierra.
- **Sonido:** efectos, música y **voz del centro de control** (cuenta regresiva y anuncios), con ElevenLabs. **Las voces van en inglés** para que sea realista (pedido del usuario, 2026-11-22).

**Forma de trabajo:** una fase a la vez; el usuario revisa cada una antes de pasar a la siguiente.
- **Proyecto aparte:** "Lanzamiento del transbordador".
- **Generadores:** `herramientas/ejemplos/lanzamiento/`.

**Diseño propio:** un transbordador genérico, sin logos ni marcas reales. Misión **"Horizon-1"** y orbitador **"Aurora"**, con insignias inventadas.

## Fases

| # | Qué | Estado |
|---|---|---|
| 1 | **Guion y storyboard:** las escenas con su duración, planos de cámara, qué se ve, el texto de la voz de control, la música y los efectos de cada momento | hecha ([guion_lanzamiento.md](guion_lanzamiento.md)); voces en inglés |
| 2 | **El transbordador y la plataforma:** orbitador, tanque externo y dos cohetes laterales, con detalle (paneles, losetas térmicas, ventanillas, toberas); torre de servicio con brazos que se retiran, plataforma, foso de llamas, torre de agua y entorno costero al amanecer | hecha |
| 3 | **Efectos del lanzamiento:** vapor y escarcha que caen, chispas de ignición, llamas con resplandor y "diamantes de choque", **nube de humo** enorme y en capas que se expande, agua del sistema de supresión, temblor, estela de ascenso | hecha |
| 4 | **Ascenso y espacio:** cielo que oscurece, condensación al romper la barrera del sonido, separación de los cohetes (caen girando) y del tanque, la Tierra vista desde la órbita y la bodega que se abre | hecha |
| 5 | **Escenas del capítulo** con cámara cinematográfica: planos generales, primeros planos de los motores, cámara que sigue al ascenso, cortes y temblor | hecha |
| 6 | **Sonido y video final:** voz del centro de control, rugido de motores, vapor, viento y música épica (ElevenLabs), sincronizados; revisión con "Ver y exportar" y el MP4 | **hecha, a revisar** |

## Capacidades del motor que pueden hacer falta (se deciden en cada fase)

- **Humo voluminoso:** una nube que crece con muchas bolas suaves, con luz de un lado (el fuego la ilumina desde abajo) y que se deforma despacio. Quizás alcance con partículas grandes y degradados; si no, un **generador de humo** general.
- **Distorsión por calor:** el aire que tiembla sobre las llamas. Sería un filtro de estilo que ondula solo una zona, por ejemplo con una máscara de "calor".
- **Desenfoque de movimiento:** para el ascenso rápido; quizás alcance con estelas.
- **Ya existen:** resplandor (`estilo.resplandor`), temblor de cámara, partículas, morphing, claves del estilo (para el brillo del fogonazo) y la Tierra que gira (de un proyecto anterior).

## Fase 1: guion y storyboard (hecha, a revisar: ver guion_lanzamiento.md)

- **Escenas** (borrador; la fase 1 las fija):
  1. amanecer en la plataforma;
  2. T-10: cuenta regresiva;
  3. ignición y despegue;
  4. "Torre despejada": el ascenso;
  5. separación de los cohetes;
  6. separación del tanque y llegada al espacio;
  7. órbita, con la bodega que se abre frente a la Tierra.
- **Para cada escena:** duración, plano o planos de cámara, qué se ve, el texto de la voz de control (en español, con lenguaje real de lanzamientos: "T menos diez", "ignición", "despegue", "torre despejada", "separación de cohetes"…), la música y los efectos.

### Resultado de la fase 2 (2026-11-22)

- **Proyecto:** "Lanzamiento del transbordador" `6b02f9eb04ea28c7b6f72fb9`.
- **Generador:** `herramientas/ejemplos/lanzamiento/generar.mjs`. Escala: 10 px = 1 m. Vista de perfil.

| Asset | Qué tiene |
|---|---|
| **Cielo del amanecer** | Degradado de noche a naranja, sol con halo, 14 nubes alargadas iluminadas desde abajo, estrellas que se apagan |
| **Mar y costa** | Mar con el reflejo del sol que titila, olas, playa, marisma con charcos y matas |
| **Torre de agua** | Esfera sobre patas con riostras |
| **Plataforma de lanzamiento** | Cerro de hormigón, foso de llamas con deflector, plataforma móvil con patas, aberturas de escape, pedestal, rociadores de agua y luces |
| **Torre de servicio** | Torre reticulada roja (columnas, vigas y diagonales), pisos con luces que titilan, pararrayos con baliza roja. **Brazo de la tripulación** y **brazo de ventilación (la "gorra")**, con acciones *Brazos puestos*, *Retirar brazo de tripulación*, *Retirar gorra* y *Brazos retirados*: los brazos giran alejándose de la cámara (`escala_x`) y la gorra antes se despega hacia arriba |
| **Tanque externo** | Espuma naranja con sombreado cilíndrico (luz de la izquierda), vetas, intertanque acanalado, soldaduras, caño de oxígeno, bandeja de cables y punta de ventilación |
| **Cohete lateral** | Tobera, faldón, cuerpo blanco cilíndrico, juntas entre segmentos, franja negra, anillo de unión y cono de nariz |
| **Orbitador Aurora** | Perfil con la panza de losetas negras hacia el tanque, nariz oscura, ventanillas con luz de cabina, líneas de la bodega y paneles, ala de canto, deriva con timón, cápsula de maniobra, tres motores principales y una insignia inventada de la misión |
| **Gaviota** | Aleteo con morphing |

- **Cómo se arma la pila:** el tanque es el padre; el cohete y el orbitador van con `padre: "tanque"` (en `PILA`). Así despegan juntos y después se separan con sus propias claves.
- **Muestra** `prueba_plataforma` (14 s, no es del guion): plano general al amanecer con gaviotas y acercamiento; se retira el brazo de la tripulación; corte a un plano cercano de la cabina; se retira la gorra.

### Resultado de la fase 3 (2026-11-22)

- **Sin capacidades nuevas del motor.** Todo es "bocanadas": círculos con degradado radial (luz arriba a la izquierda y borde que se desvanece) con claves de posición, escala y opacidad. Se suman llamas con `mezcla: suma` y un parpadeo rápido, el resplandor del estilo y el temblor de la cámara.
- **La distorsión por calor** no hizo falta por ahora.

| Asset | Qué hace |
|---|---|
| **Vapor del tanque** | Bocanadas tenues que caen por los costados del tanque y se disipan, en bucle |
| **Llama de motor principal** | Pluma azulada translúcida con núcleo blanco y cuatro **diamantes de choque**; acciones *Apagado*, *Arrancar* (crece) y *Encendido* (parpadea) |
| **Llama de cohete** | Columna de fuego blanco-amarillo de 46 m con un gran resplandor naranja; *Encender* (fogonazo) y *Encendido* |
| **Agua de supresión** | Arcos de agua desde los rociadores y spray sobre la cubierta; *Apagada*, *Rociar* y *Rociando* |
| **Vapor de arranque** | Nube blanca que sale del foso cuando arrancan los motores (generador `nube()`) |
| **Nube de humo** | 90 bocanadas que salen por las bocas del foso, más hacia la izquierda, corren hacia afuera frenando, crecen y suben, iluminadas por una luz de fuego naranja (generador `nube()`) |
| **Bocanada de estela** | Un trozo de la columna del ascenso: aparece con una brasa, crece despacio y se disipa. La escena pone una cada 22 px de ascenso, con `desfase` en el instante en que pasa la pila |

- **El cielo:** "Cielo del amanecer" ahora sigue hacia arriba con un degradado que llega al **negro del espacio** (`cielo_alto`), para el ascenso. Además, sus rectángulos tienen `borde` transparente, porque el borde de un degradado se dibujaba como una línea.
- **Prueba** `prueba_ignicion` (16 s, no es del guion):
  - vapor y agua;
  - chispas de los encendedores;
  - arranque de los motores principales con vapor del foso;
  - "cero": fogonazo (brillo animado), llamas de los cohetes, **nube de humo** y temblor;
  - **despegue** acelerado con la estela;
  - el cielo se oscurece al subir.
- **Lo que aprendimos:**
  - **El resplandor** alto (umbral 0.72) convertía el vapor blanco en bolas brillantes; ahora usa umbral 0.86.
  - **Una instancia con `desfase`** muestra su primer cuadro antes de tiempo, así que todo lo que deba estar oculto tiene que empezar con opacidad 0. Eso le pasaba a la brasa de la estela.

### Vibración de la cámara (2026-11-22, pedido del usuario)

- **Capacidad general:** `camara.temblor` ahora acepta **una lista de ventanas**, cada una `{desde, hasta, amplitud, entrada?, decae?, paso?}`.
  - `entrada` hace crecer la vibración de a poco; `decae: false` la mantiene pareja.
  - Si dos ventanas se pisan, se suman.
  - Archivos: `Generadores.claveTemblor` y `Compilador`. Tiene su prueba en `compilador.test.mjs` (96 en total).
- **En `prueba_ignicion`:**
  - vibración leve (3 px) mientras arrancan los motores principales;
  - sacudida fuerte (20 px) desde la ignición de los cohetes, pareja durante 3,2 s;
  - en el ascenso, una vibración de 12 px que se va calmando;
  - el paso es de 33 ms, más rápido que antes.

### Resultado de la fase 4 (2026-11-22)

- **Sin capacidades nuevas del motor.** Las separaciones son claves relativas al padre: los cohetes y el orbitador siguen al tanque hasta su instante y después se alejan con sus propias claves.

| Asset | Qué tiene |
|---|---|
| **Tierra desde la altura** | Horizonte curvo (radio 5.200): océano con degradado, nubes que se achican hacia el borde, banda de atmósfera azul y un filo brillante. En la escena sigue a la cámara |
| **Espacio profundo** | Negro con 380 estrellas de tres tonos y una Vía Láctea muy tenue (degradado a lo ancho, sin bordes) |
| **Cono de condensación** | Cono blanco que aparece al romper la barrera del sonido y se disipa, con un anillo |
| **Destello de separación** | Fogonazo de los motorcitos de separación y humito que se abre |
| **Propulsores de maniobra** | Soplos blancos cortos; acción *Soplos* (tres soplos) |
| **Tierra desde la órbita** | Radio 900 y una vuelta en 90 s; océano con reflejo, **24 manchas de continente** con degradados (selva, llanura, desierto) y borde irregular, **90 nubes** finas con transparencias, atmósfera, terminador (noche a la derecha) y brillo del sol. Proyección esférica como en un proyecto anterior |
| **Orbitador desde arriba** | Planta con ala delta, bordes negros, nariz, ventanillas, cápsulas de maniobra y deriva. **Bodega**: las puertas giran sobre su bisagra y muestran por dentro los **radiadores**; acciones *Cerrada*, *Abrir* y *Abierta* |
| **Satélite** | Cuerpo dorado con antena y dos paneles solares que se despliegan (*Plegado*, *Desplegar*, *Desplegado*) |

- **Prueba** `prueba_ascenso` (26 s, no es del guion):
  - la pila sube inclinada sobre el horizonte curvo, con vibración;
  - aparece el cono de condensación;
  - separación de los cohetes: destellos, los dos cohetes caen girando (el de atrás aparece desde detrás del tanque) y se apaga su fuego;
  - apagado de los motores principales, separación del tanque y soplos de los propulsores;
  - corte a la órbita: la Tierra grande que gira, el orbitador visto desde arriba abre la bodega y el satélite despliega sus paneles.
- **Lo que aprendimos:**
  - **La Tierra del ascenso** tiene que seguir a la cámara; si no, queda fuera de cuadro.
  - **La Tierra orbital** con pocas manchas grandes parecía de dibujo animado; muchas nubes finas y continentes en varias manchas con degradado la hacen más realista.
  - **Una elipse muy alargada** con degradado radial deja bordes rectos (la Vía Láctea); hace falta un degradado a lo ancho.

### Resultado de la fase 5 (2026-11-22)

- **Capítulo "Horizon-1":** 7 escenas en `historia_1..7.json`, unos 81 s.

| # | Escena | Dur. | Cámara y acción |
|---|---|---|---|
| 1 | Dawn on the pad | 12 s | Plano general de la costa al amanecer con acercamiento lento; gaviotas, vapor; se retira el brazo de la tripulación |
| 2 | Countdown | 13 s | Cortes: primer plano de la cabina, la gorra que se retira y la base de la plataforma. Agua, chispas, arranque de los motores a T-6 con vapor del foso y vibración que crece |
| 3 | Ignition and liftoff | 10 s | Plano bajo en el foso (fogonazo y humo) y corte a plano general que sigue el despegue con la estela; sacudida fuerte |
| 4 | Tower clear: the climb | 14 s | Cámara de seguimiento: la pila al centro, el suelo cae y el cielo pasa a azul oscuro; maniobra de giro (se inclina), columna de humo continua y cono de condensación |
| 5 | Booster separation | 10 s | Sobre el horizonte curvo: destellos, los cohetes caen girando y se apaga su fuego |
| 6 | Tank separation | 10 s | Apagado de motores, el tanque se separa y cae, soplos de maniobra y estrellas |
| 7 | Orbit | 12 s | El orbitador visto desde arriba sobre la Tierra: abre la bodega, el satélite despliega sus paneles y el título "MISSION HORIZON-1" |

- **Subtítulos en inglés con sus tiempos** (listos para la voz de la fase 6):
  - Control: cartel de narrador abajo;
  - el comandante: globo desde el orbitador;
  - el título: sin voz.
  - Las escenas tienen `voces: {}`, que se completa en la fase 6.
- **Asset nuevo:** **Columna de humo** (la estela continua en el cuadro de seguimiento). La **Torre de servicio** suma la acción *Solo gorra*.
- **Motor:** se corrigió el temblor que empieza en 0 (repetía la clave inicial de la cámara). Tiene su prueba; son 97 en total.
- **Lo que aprendimos:**
  - **Para el ascenso conviene un "cuadro de seguimiento":** la pila queda fija y el mundo pasa (cielo, suelo, estela), en vez de mover la cámara kilómetros.
  - **La estela en bocanadas** se ve como puntos a alta velocidad; la columna continua funciona mejor.
  - **`autoria capitulo`** sirve para reordenar las escenas de un capítulo, porque cada una se mueve al final.

### Resultado de la fase 6 (2026-11-22)

- **Voces en inglés (ElevenLabs, 13 líneas):**
  - Launch Control: voz "Jonathan" (narrador);
  - el comandante: voz "Jenifer", con filtro de radio.
  - Las escenas se reubicaron según la voz (`voces.mjs --reubicar`). Duraciones finales: 12 / 16 / 10 / 14 / 10 / 10 / 13.5 s, unos 86 s en total.
- **Filtro de radio nuevo en `voces.mjs`** (`radio: true` en el reparto):
  - paso alto 320 Hz y paso bajo 3200 Hz, de 2 polos;
  - saturación, siseo y chasquidos;
  - entra en la firma de la caché. Tiene su prueba; son 98 en total.
- **12 efectos de sonido:** vapor, agua, chispas, arranque de motores, rugido, estruendo del despegue, viento, estampido de condensación, separación, propulsores de maniobra, silencio espacial y la bodega que se abre.
- **3 temas de música:**
  - "tensión" en las escenas 1–2;
  - "épica" en las 3–5;
  - "espacio" en las 6–7.
  - Cada tema sigue de una escena a la otra con `recorte` y fundidos (`lanzamiento/musica.mjs`, que se corre después de las voces).
- **Créditos usados:** unos 3.800 (voces ~870, efectos ~200, música 2.700).
- **Falta:** revisar con "Ver y exportar" en el capítulo "Horizon-1" y exportar el MP4.
- **Lo que aprendimos:** la música va después de las voces, porque las voces cambian la duración de las escenas y los recortes se calculan con la duración final.
