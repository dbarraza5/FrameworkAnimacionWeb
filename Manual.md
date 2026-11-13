# Manual de uso — Framework de Animación 2D

Manual para quien anima con el editor. Explica cómo se usa cada parte y crece a medida que se agregan funciones: lo nuevo de cada versión aparece primero en **Novedades**, y cada sección indica qué está *en desarrollo*.

> Última actualización: 2026-11-13 · Rama `animacion`
> Para levantar el proyecto con Docker, ver `MANUAL_DOCKER.md`. Para el plan de desarrollo, ver `documento/planeacion_escena_objetos.md`.

---

## Novedades

**2026-11-13 (cámara y profundidad)**
- **Cámara:** cada escena tiene una cámara que se puede mover, acercar y animar con claves. Con **Vista de cámara** ves cómo quedará el resultado. Ver [§7e](#7e-cámara-y-profundidad).
- **Profundidad:** el botón *Profundidad* del panel Objetos hace que lo que está más abajo se dibuje delante. El campo **Plano** del Inspector manda algo siempre al fondo o al frente.

**2026-11-13 (fotogramas clave, 3)**
- **Camino en el lienzo:** el objeto con claves de posición muestra su recorrido como una línea punteada con un rombo por clave. Arrastra los rombos para acomodar el camino. Ver [El camino en el lienzo](#el-camino-en-el-lienzo).
- **Selección por rectángulo** de claves en la línea de tiempo.

**2026-11-13 (fotogramas clave, 2)**
- **Repetir las claves:** después de la última clave, un objeto puede quedarse, repetir, ir y volver o continuar acumulando, por ejemplo un auto que da vueltas o alguien que sigue caminando. Ver [Repetir](#repetir-qué-pasa-después-de-la-última-clave).
- **Editar varias claves** en la línea de tiempo: Shift + clic para seleccionar, arrastrar para moverlas juntas, Supr para borrarlas y Ctrl + C / Ctrl + V para copiarlas, incluso a otro objeto.

**2026-11-13 (fotogramas clave)**
- **Animar cualquier propiedad con fotogramas clave:** posición, rotación, escala y la nueva **opacidad**. Usa el rombo ◆ del Inspector, mueve el cursor de tiempo y cambia el objeto. Las claves se ven y se arrastran en la línea de tiempo. Ver [§7d](#7d-animar-con-fotogramas-clave).

**2026-11-13 (assets animados, 3)**
- **Versiones:** una instancia puede quedar **fijada** a una versión del asset y ya no cambia aunque se edite el original. Botón *Fijar actual* en el Inspector.
- **Abrir para editar** el proyecto de un asset desde la escena. Al volver, la escena se actualiza sola.

**2026-11-13 (assets animados, 2)**
- **Desvincular:** convierte una instancia en una copia editable del dibujo. Ver [Assets animados](#assets-animados-instancias-por-referencia).
- **Elegir el evento antes de agregar** un asset, en el selector de su tarjeta. **Miniatura animada:** pasa el mouse por la tarjeta para verlo moverse.
- **Bucle de assets corregido:** en cada vuelta el objeto sigue avanzando pero sus partes vuelven a su pose. Antes, la segunda vuelta de "caminar y sentarse" dejaba la cola y las patas fuera de lugar.

**2026-11-13 (assets animados)**
- **Assets animados:** en la Biblioteca aparecen los proyectos con eventos. Al agregar uno a la escena se mueve solo con sus propios eventos (Caminar, Sentarse…). En el Inspector eliges qué evento reproduce, con qué desfase y si se repite. Si el proyecto original cambia, todas sus instancias cambian. Ver [§7](#7-biblioteca-agregar-objetos-a-la-escena).

**2026-11-13 (bucle)**
- **Bucle:** eventos y movimientos se pueden repetir cada *Tiempo bucle* ms dentro de su duración; los desplazamientos se acumulan (un perro en bucle sigue avanzando). La línea de tiempo marca cada vuelta. Ver [Bucle](#bucle-repetir-un-ciclo).

**2026-11-13 (más tarde)**
- **El editor ahora corre a 60 cuadros por segundo** (antes ~10): la animación y el arrastre de objetos se ven fluidos, incluso con 20 perros caminando a la vez.

**2026-11-13 (noche)**
- **Panel Objetos:** la pestaña *Objetos* del panel izquierdo lista los objetos de la escena con miniatura; desde ahí se ocultan, bloquean, renombran y se cambian de capa. Ver [§7c](#7c-panel-objetos-y-entrar-a-un-objeto).
- **Entrar a un objeto** con doble clic para editar sus partes (rotar la cabeza, mover una pata…); lo demás se atenúa. Esc para salir.
- Ocultar un grupo ahora oculta también sus partes.

**2026-11-13 (tarde)**
- **Seleccionar y manipular objetos con el mouse:** clic sobre un objeto (perro, casa…) y aparecen manijas para **mover, escalar, rotar y reflejar**. El Inspector muestra el objeto con sus valores editables. Atajos: flechas, Supr, Ctrl+D, Esc. Ver [§7b](#7b-objetos-en-la-escena-seleccionar-mover-escalar-rotar).
- **Un objeto reflejado camina hacia donde mira,** y uno escalado avanza en proporción a su tamaño.
- **Modalidad Movimiento:** los controles (pivote, flecha) se alinean bien con objetos escalados o rotados.

**2026-11-13**
- **Escala, rotación y espejo por objeto** (sin deformar su animación).

**2026-11-12**
- **Nueva pantalla del editor de eventos**, con distribución de editor profesional: lienzo grande, panel Escena, Inspector, Biblioteca, línea de tiempo abajo y barra de estado. Ver [§3](#3-la-pantalla-del-editor-de-eventos).
- **Cuadrícula infinita con ejes y reglas**, zoom con la rueda del mouse alrededor del cursor, "Ajustar a la vista".
- **Inspector:** las propiedades del evento y sus movimientos se editan en el panel derecho.
- **Línea de tiempo con columna de pistas**, que muestra los sub-eventos o los movimientos de un grupo.
- **Biblioteca de animaciones:** se arrastra una miniatura al lienzo para agregarla a la escena. Ver [§7](#7-biblioteca-agregar-objetos-a-la-escena).

**2026-11-11**
- **Eventos encadenados:** los sub-eventos se reproducen uno detrás de otro (ej. "Caminar" y luego "Sentarse"). Ver [§5](#5-eventos).
- **Play reproduce el evento seleccionado.**
- **Nuevo movimiento "Rotación Oscilatoria"** (vaivén), ideal para patas, colas y péndulos.
- **Rotar grupos anidados** ya funciona bien.

---

## Índice

1. [Conceptos](#1-conceptos)
2. [Empezar](#2-empezar)
3. [La pantalla del editor de eventos](#3-la-pantalla-del-editor-de-eventos)
4. [El lienzo: navegar y coordenadas](#4-el-lienzo-navegar-y-coordenadas)
5. [Eventos](#5-eventos)
6. [Movimientos](#6-movimientos)
7. [Biblioteca: agregar objetos a la escena](#7-biblioteca-agregar-objetos-a-la-escena)
7b. [Objetos en la escena: seleccionar, mover, escalar, rotar](#7b-objetos-en-la-escena-seleccionar-mover-escalar-rotar)
7c. [Panel Objetos y entrar a un objeto](#7c-panel-objetos-y-entrar-a-un-objeto)
7d. [Animar con fotogramas clave](#7d-animar-con-fotogramas-clave)
7e. [Cámara y profundidad](#7e-cámara-y-profundidad)
8. [Línea de tiempo](#8-línea-de-tiempo)
9. [Para desarrolladores](#9-para-desarrolladores)
10. [Editor de dibujo y sus atajos](#10-editor-de-dibujo-y-sus-atajos)
11. [Ejemplo paso a paso: un perro que camina y se sienta](#11-ejemplo-paso-a-paso-un-perro-que-camina-y-se-sienta)
11b. [Ejemplo incluido: una calle](#11b-ejemplo-incluido-una-calle)
12. [Limitaciones conocidas](#12-limitaciones-conocidas)

---

## 1. Conceptos

El framework está pensado para **animaciones poligonales simples**. Cada trazo del dibujo es un objeto que se puede animar.

| Concepto | Qué es |
|---|---|
| **Proyecto** | Agrupa animaciones. Al crearlo se generan una animación y un documento de eventos. |
| **Animación** | El dibujo: un árbol de **grupos**. |
| **Grupo** | Un conjunto de figuras con posición (`cx`, `cy`) relativa a su grupo padre. Los grupos se anidan: mover el padre mueve a los hijos. Ej.: `perro` → `cabeza` → `oreja`. |
| **Figura** | `PUNTO`, `RECTA` o `CIRCULO`. |
| **Pintado** | El relleno de color de un grupo: un polígono que une extremos de rectas y puntos, en orden. |
| **Capa** | Orden de dibujo entre grupos hermanos (mayor = más adelante). Un hijo siempre se dibuja sobre su padre. |
| **Evento** | Una ventana de tiempo con movimientos aplicados a grupos. Los eventos forman un árbol; la raíz es `EventoGeneral`. |
| **Movimiento** | Cómo se mueve un grupo dentro de un evento (trasladarse, rotar, oscilar…), con tiempo de inicio y de fin. |

Hay dos editores:
- **Editor de dibujo** (`/animacion/:id`): para dibujar figuras, grupos y rellenos. Ver [§10](#10-editor-de-dibujo-y-sus-atajos).
- **Editor de eventos** (`/evento/:id`): para animar. Tiene su propia copia de los grupos, así que se puede seguir dibujando sin romper la animación.

---

## 2. Empezar

1. Abre http://localhost:3000 e inicia sesión. Si no tienes cuenta, usa **Register**.
2. En la página principal aparecen tus proyectos y sus animaciones. Desde ahí se abren los editores.
3. **Guarda seguido** con **Subir**: los cambios viven en el navegador hasta que se suben al servidor. Si recargas la página antes de subir, se pierden.

> Si entras al editor sin haber iniciado sesión, la página muestra un error en vez de mandarte al inicio de sesión (limitación conocida). Vuelve a http://localhost:3000 e inicia sesión.

---

## 3. La pantalla del editor de eventos

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ☰  Archivo  Ver   Editor de eventos      [Animar|Dibujo]  ▯ ▭ ▯  ⤓ Subir │ barra superior
├──────────────┬────────────────────────────────────────┬──────────────────┤
│ ESCENA       │  reglas                                 │ INSPECTOR │ BIBL.│
│ Eventos      │                                         │                  │
│ Grupos       │              LIENZO                     │ propiedades del  │
│ Config       │                                         │ evento y sus     │
│              │                                 ⊙ − +   │ movimientos      │
├──────────────┴────────────────────────────────────────┴──────────────────┤
│ Evento: …            ↺  ▶  ⏩ 1x                    00:00.00 / 00:06.50 ⌄ │ línea de
│ PISTAS     │ 0 seg   1 seg   2 seg …                                      │ tiempo
├──────────────────────────────────────────────────────────────────────────┤
│ zoom %   x / y del cursor   modalidad   grupo   tamaño lienzo   fps      │ barra de estado
└──────────────────────────────────────────────────────────────────────────┘
```

### Barra superior

| Elemento | Para qué sirve |
|---|---|
| **☰** | Menú de la aplicación (proyectos, cerrar sesión). |
| **Archivo** | **Subir** (guardar en el servidor) y **Exportar** (descargar los eventos y grupos como `.json`). |
| **Ver** | Mostrar u ocultar paneles, **Cuadrícula**, **Reglas**, **Ajustar a la vista**, **Zoom 100 %**. |
| **Animar / Dibujo** | *Animar*: la pantalla descrita aquí. *Dibujo*: el editor de figuras de los grupos de este documento (todavía con su aspecto anterior). |
| **▯ ▭ ▯** | Mostrar u ocultar el panel izquierdo, la línea de tiempo y el panel derecho. Están resaltados cuando el panel está visible. |
| **Subir** | Guarda en el servidor. |

### Paneles

- **Panel izquierdo:** tiene dos pestañas.
  - **Objetos:** la lista de objetos de la escena ([§7c](#7c-panel-objetos-y-entrar-a-un-objeto)).
  - **Eventos:** el evento seleccionado, los botones **Lista**, **Árbol** y **Nuevo**, y las sub-pestañas **Grupos** (reemplazar grupos) y **Config**.
- **Inspector (derecha):** propiedades del evento seleccionado, en cuatro secciones: **Evento**, **Movimiento**, **Script** y **Macro**.
- **Biblioteca (derecha, segunda pestaña):** las animaciones de tus proyectos en miniatura.
- **Línea de tiempo (abajo).**
- **Barra de estado (abajo):** zoom, posición del cursor en el dibujo, modalidad, grupo seleccionado, tamaño del lienzo y cuadros por segundo.

**Manejar los paneles:**
- **Cambiar el tamaño:** arrastra su borde.
- **Ocultar:** con el botón « / » de su cabecera, ⌄ en la línea de tiempo, o los botones de la barra superior.
- **Volver a mostrar:** un panel oculto deja una **pestaña en el borde del lienzo** ("Escena", "Inspector", "Línea de tiempo"); haz clic en ella. También sirven los botones de la barra superior o el menú **Ver**.
- Tamaños, paneles visibles y pestaña elegida **se recuerdan** en el navegador.

---

## 4. El lienzo: navegar y coordenadas

| Acción | Cómo |
|---|---|
| Zoom | **Rueda del mouse** (acerca o aleja alrededor del cursor), o los botones **−** / **+** (alrededor del centro). Entre 10 % y 800 %. |
| Ajustar a la vista | Botón **⊙**, o **Ver → Ajustar a la vista**: encuadra el documento completo. |
| Zoom 100 % | **Ver → Zoom 100 %**. |
| Mover la vista | **Arrastra el fondo** del lienzo (donde no haya un control). |

**Coordenadas**
- La cuadrícula es el plano de coordenadas del dibujo y se adapta al zoom: una línea secundaria cada 1, 2 o 5 × 10ⁿ unidades y una principal cada 5.
- **Eje X (rojo):** crece hacia la **derecha**. **Eje Y (verde):** crece hacia **abajo**, como en todas las pantallas. Para subir algo se resta a Y.
- El origen (0, 0) es la esquina superior izquierda del **documento** (1280 × 720), que se ve como un contorno punteado. Se puede dibujar y animar fuera de él.
- Las **reglas** muestran las coordenadas y marcan el cursor; la barra de estado da su posición exacta.

---

## 5. Eventos

### Crear y seleccionar

- **Nuevo:** crea un evento. Se elige su *evento padre*, su nombre y sus tiempos.
- **Lista:** todos los eventos. El botón ✏️ de una fila lo selecciona.
- **Árbol:** los eventos como jerarquía.

Al abrir el editor queda seleccionado `EventoGeneral`. El evento seleccionado se muestra en la pestaña Eventos del panel izquierdo, el Inspector y la línea de tiempo. Los botones Nuevo, Lista y Árbol están en esa pestaña.

### Propiedades (Inspector → Evento)

| Campo | Significado |
|---|---|
| Evento padre | De qué evento es hijo. |
| Nombre | Debe ser único. |
| Tiempo de inicio / fin | `minutos : segundos : milisegundos`, **relativos al inicio del evento padre**. |
| Bucle + Tiempo bucle (ms) | Repite el contenido del evento cada *tiempo bucle* dentro de su ventana. Ver [Bucle](#bucle-repetir-un-ciclo). |
| Tiempo relativo, Coordenada X/Y, Reposicionar | *En desarrollo:* se guardan pero todavía no tienen efecto. |

### Cómo se reproducen los eventos encadenados

- **Tiempos relativos:** un sub-evento empieza en su *tiempo de inicio*, medido desde el comienzo de su padre.
- **Antes de empezar,** no hace nada.
- **Al terminar, queda congelado** en su último instante: conserva su efecto. Por eso, si "Caminar" va de 0 a 4 s y "Sentarse" de 4 a 6,5 s, el perro se sienta **donde terminó de caminar**.

### Bucle: repetir un ciclo

Sirve para todo lo repetitivo: un paso de caminata, el giro de una rueda, un semáforo, una bandera al viento.

- **Inicio y fin** dicen **cuánto dura** en total.
- **Con Bucle activo,** el contenido se repite cada **Tiempo bucle** (ms) dentro de esa ventana. Al terminar la ventana queda congelado, como cualquier evento.
- **Se aplica a eventos y a movimientos** (cada uno tiene su casilla *Bucle* y su *Tiempo bucle*).
- **Los desplazamientos se acumulan:** un perro que camina en bucle **sigue avanzando** en cada vuelta y no vuelve al punto de partida. Las rotaciones y oscilaciones simplemente se repiten.
- **En la línea de tiempo,** una barra en bucle muestra **↻ N ms** y una marca por cada vuelta.
- `EventoGeneral` no hace bucle: es el rango que reproduce Play.

**Ejemplo, caminar 10 segundos con un paso de 0,8 s:**
- **Evento "Caminar":** inicio 0, fin 10 000, Bucle activo y Tiempo bucle 800.
- **Sus movimientos:** van de 0 a 800 ms, un solo paso. Las patas hacen un vaivén completo en esos 800 ms y el perro avanza con un MRU.
- **Resultado:** camina los 10 s y avanza 30 × 10 = 300 unidades. Un evento "Sentarse" de 10 000 a 12 500 lo sienta donde terminó.

Lo mismo se puede hacer **por movimiento**: deja el evento sin bucle y activa *Bucle* con *Tiempo bucle* 800 en cada movimiento, con su ventana de 0 a 10 000.

### Reproducir

**Play (▶)** reproduce el **evento seleccionado**, *en contexto*:
- **La línea de tiempo** va de 0 a la duración de ese evento.
- **Lo que se ve** incluye el efecto de los eventos anteriores. Al seleccionar "Sentarse" y dar Play, el perro aparece donde terminó "Caminar" y se sienta.
- **Para ver todo de corrido,** selecciona `EventoGeneral`.

Cambiar de evento vuelve el tiempo a 0 y pausa.

---

## 6. Movimientos

Se manejan en **Inspector → Movimiento**:

1. **Elige el grupo** con el selector de árbol ("Seleccionar Grupo / Árbol"). En el lienzo aparece un rectángulo sobre él y en la línea de tiempo sus movimientos.
2. **Agregar:** elige el **efecto** (*Objeto* o *Figuras*), el tipo, los tiempos y los datos.
3. **La tabla** lista los movimientos del grupo en el evento seleccionado:
   - **Sel.** (círculo): lo selecciona y lleva el tiempo a su inicio. En el lienzo aparecen sus **controles**: pivote, flecha y elipse, según el tipo.
   - **Activo:** lo enciende o apaga sin borrarlo.
   - **Operaciones:** editar, duplicar y borrar.
4. **Copiar:** pasa movimientos de un grupo a otros.

**Editar en el lienzo:** con un movimiento seleccionado, haz clic sobre su control (el pivote o la punta de la flecha) para tomarlo, mueve el mouse y vuelve a hacer clic para soltarlo.

### Efectos

- **Objeto:** traslada el grupo completo, con sus hijos, como un bloque.
- **Figuras:** rota o escala las figuras del grupo (y de sus hijos directos) alrededor de un **pivote**. El pivote se indica relativo al **centro** del grupo; por ejemplo, `pivoteY` negativo = parte de arriba.

Si un movimiento termina antes que su evento, **se congela** en su último valor.

### Tipos de movimiento

Las velocidades y distancias están en **unidades del dibujo** (las mismas de la cuadrícula). Aunque algunos formularios digan "m/s", son unidades del dibujo por segundo.

| Tipo | Efecto | Datos | Qué hace |
|---|---|---|---|
| **MRU** | Objeto | velocidad | Avanza en X a velocidad constante (negativa = hacia la izquierda). |
| **MRUA** | Objeto | velocidad inicial, aceleración | Avanza en X acelerando. |
| **Movimiento 2D** | Objeto | velocidad X, velocidad Y | Avanza en línea recta en cualquier dirección. |
| **Circular** | Objeto | pivote X/Y, velocidad angular (rad/s), sentido | Da vueltas alrededor del pivote. |
| **Oscilatorio** | Objeto | amplitud X/Y, frecuencia X/Y (rad/s) | Va y vuelve: `amplitud · sin(frecuencia · t)`. Una amplitud negativa empieza hacia el otro lado. |
| **LERP** | Objeto | punto final | Va en línea recta hasta el punto final, relativo a donde está, durante toda la duración del movimiento. |
| **Gravedad** | Objeto | velocidad inicial Y, gravedad | Sube o cae en Y. *Ojo:* como Y crece hacia abajo, con gravedad positiva el objeto acelera **hacia arriba** en pantalla. |
| **Parabólico** | Objeto | velocidad inicial, ángulo (°), gravedad | Lanzamiento con ángulo (ángulo positivo = hacia arriba). |
| **Rotación** | Figuras | velocidad, sentido, pivote X/Y | Gira continuamente alrededor del pivote. La velocidad está en **grados por segundo**, aunque el formulario diga "rad/s". |
| **Zoom** | Figuras | velocidad, pivote X/Y | Agranda o achica respecto al pivote (`0.5` = +50 % por segundo). |
| **Rotación Oscilatoria** | Figuras | amplitud (°), frecuencia (rad/s), pivote X/Y | Vaivén: `amplitud · sin(frecuencia · t)` grados. `6.28` = un vaivén por segundo. Amplitud negativa = empieza hacia el otro lado (contrafase). Ideal para patas, colas y péndulos. |

**Combinar movimientos:**
- Varios movimientos *Objeto* sobre un grupo **se suman**.
- Varios movimientos *Figuras* sobre la misma figura **se aplican en cadena**; por ejemplo, la rotación congelada de "Caminar" y luego la de "Sentarse".
- Un movimiento de **Figuras** sobre un grupo afecta a sus **hijos directos**, no a los nietos.

---

## 7. Biblioteca: agregar objetos a la escena

En la pestaña **Biblioteca** del panel derecho:

1. **Elige el proyecto.** Aparecen dos secciones:
   - **Assets animados:** el proyecto completo, dibujo y eventos. Tiene el ícono 🔗.
   - **Dibujos (copia editable):** cada animación del proyecto, solo el dibujo.

   Hay buscador y botón de recargar.
2. **Agrega lo que quieras,** de una de dos formas:
   - **arrastra la miniatura** al lienzo y queda donde la sueltas;
   - o **selecciónala** y usa **Agregar al centro**.

### Assets animados (instancias por referencia)

Un asset animado es un **objeto vivo**: la escena no copia su dibujo, lo **lee del proyecto original** cada vez que se abre. Por eso:
- **se mueve solo** con los eventos de su proyecto (por ejemplo, el perro camina y se sienta);
- si cambias el dibujo o los eventos del proyecto original y lo subes, **todas sus instancias cambian**;
- se guarda **solo la referencia** (posición, escala, rotación y qué evento reproduce), así que 50 perros pesan casi nada.

Al seleccionarlo, el **Inspector → Objeto** muestra el bloque **Instancia de …**:

| Campo | Qué hace |
|---|---|
| Evento que reproduce | Cuál evento del asset usa esta instancia: *EventoGeneral* (todo), *Caminar*, *Sentarse*… Un sub-evento se reproduce **en contexto**: *Sentarse* arranca donde terminó de caminar. |
| Desfase (ms) | Retrasa esta instancia respecto a la escena. Con desfases distintos, varios perros iguales no se mueven al unísono. Mientras no le toca, se queda en la pose inicial. |
| Repetir | Encendido: el evento se repite sin fin y el desplazamiento se acumula (el perro sigue avanzando). Apagado: se reproduce una vez y se queda en la pose final. |

Además, una instancia se puede mover, escalar, rotar, reflejar, ocultar, bloquear y cambiar de capa como cualquier objeto ([§7b](#7b-objetos-en-la-escena-seleccionar-mover-escalar-rotar)).

**Antes de agregarlo:**
- en la tarjeta del asset puedes elegir **qué evento reproducirá**; después se cambia en el Inspector;
- pasa el mouse por la tarjeta para ver la animación.

**No se puede entrar a sus partes.** Para cambiar su dibujo o sus movimientos, edita su proyecto.

**Editar el asset y versiones:**
- **Abrir para editar** abre el proyecto del asset en otra pestaña. Cámbialo ahí y haz **Subir**. Al volver a la escena, las instancias que siguen la **última** versión se actualizan solas; también puedes usar **Recargar**.
- **Versión del asset:**
  - **Última (se actualiza sola):** opción por defecto. Sigue cada cambio del original.
  - **v1, v2…:** fotos congeladas del asset. Una instancia fijada se ve siempre igual, aunque el original cambie. En el panel Objetos aparece con "· vN".
- **Fijar actual** toma una foto del asset **tal como está guardado ahora** y fija la instancia en ella. Para volver a seguir los cambios, elige *Última*.

**Desvincular (copia editable):** en el Inspector → Objeto, el botón **Desvincular** convierte la instancia en una copia normal del dibujo, en su pose de reposo.
- Ya puedes entrar a sus partes y animarlas con eventos de esta escena.
- **Ya no sigue al asset:** los cambios del original no le llegan.
- **No trae los eventos del asset:** queda quieta.
- No se puede deshacer, salvo recargando sin Subir.

Si el asset no se puede cargar (sin conexión, sesión vencida), el Inspector lo avisa y el editor reintenta cada 5 segundos.

### Dibujos (copia editable)

**Qué crea:**
- Cada vez que agregas una animación se crea un **objeto nuevo** en la escena. Es un grupo contenedor `<animación>_1`, `_2`…, con todos los grupos de la animación renombrados con ese prefijo, así puedes tener varios perros.
- Se omiten los grupos vacíos.

**Límites de los dibujos:**
- El objeto agregado es una **copia del dibujo**: **no trae sus eventos** y entra quieto.
- Si después cambias la animación original, las copias no se actualizan.

Si quieres que se mueva solo o que siga los cambios del original, usa un **asset animado**.

> **Grupos → Reemplazar grupos…** (pestaña Eventos del panel izquierdo) hace otra cosa: **reemplaza todos** los grupos del editor de eventos por los de una animación.

---

## 7b. Objetos en la escena: seleccionar, mover, escalar, rotar

Un **objeto** es cada grupo de primer nivel que tiene dibujo: el `perro`, una instancia agregada desde la Biblioteca, una casa… Se manipula en la modalidad **Evento**, la que se abre por defecto. En la modalidad *Movimiento*, el lienzo edita movimientos.

### Seleccionar

- **Clic sobre el objeto,** en cualquier parte de su dibujo. Aparece un rectángulo azul con manijas y el Inspector pasa a mostrar el **Objeto**.
- **Shift + clic:** agrega o quita objetos de la selección.
- **Clic en el vacío** o **Esc:** deselecciona (arrastrar el vacío sigue moviendo la vista).

### Manipular con el mouse

| Dónde arrastras | Qué hace |
|---|---|
| Interior del objeto | **Mover** (todos los seleccionados). |
| Manija de una **esquina** | **Escalar proporcionalmente**. Con **Shift**, libre. |
| Manija de un **lado** | **Escalar en un solo eje** (estirar o aplastar). |
| **Círculo** sobre el rectángulo | **Rotar**. Con **Shift**, en pasos de 15°. |

**El ancla:** la **cruz naranja** es el punto fijo al escalar y rotar. Por defecto está en los pies del objeto, así que al agrandarlo sigue apoyado en el suelo.

**Reflejar:** si arrastras una manija más allá del ancla, el objeto se **refleja**. También hay botones de espejo en el Inspector.

### Teclado (con el lienzo activo)

| Tecla | Acción |
|---|---|
| Flechas | Mover 1 unidad (con Shift, 10) |
| `Supr` / `Retroceso` | Borrar el objeto (con todo su dibujo) |
| `Ctrl + D` | Duplicar (la copia aparece desplazada y encima) |
| `Esc` | Deseleccionar |

### Inspector → Objeto

- **Campos:** posición X/Y, rotación (°), capa, escala X/Y y ancla X/Y. Se pueden escribir y se actualizan mientras arrastras las manijas.
- **Botones:** **Espejo H**, **Espejo V**, **Restablecer** (rotación 0 y escala 1), **Duplicar** y **Borrar**.
- **Volver a las propiedades del evento:** deselecciona.

### Cómo se combinan transformación y animación

- **La transformación se aplica al dibujar:** escalar, rotar o reflejar **no deforma la animación**. El perro al 60 % camina y se sienta igual que el grande.
- **El desplazamiento propio del objeto** (por ejemplo, un MRU en el `perro`) va **en el marco del objeto**:
  - reflejado, **avanza hacia donde mira**;
  - escalado, **avanza en proporción** y no "patina".

Recuerda **Subir** para guardar los cambios.

---

## 7c. Panel Objetos y entrar a un objeto

El panel izquierdo tiene dos pestañas: **Objetos** (la lista de la escena) y **Eventos** (selección de eventos, grupos y configuración).

### La lista de objetos

Cada fila muestra la miniatura del objeto, su nombre y cuántas partes tiene. **Arriba** está lo que se dibuja **adelante**.

| Acción | Cómo |
|---|---|
| Seleccionar | Clic en la fila (Shift + clic suma a la selección) |
| Entrar a sus partes | Doble clic en la fila |
| Renombrar | ✏️, escribir y Enter (Esc cancela). Los eventos que lo usan se actualizan solos. |
| Traer adelante / llevar atrás | ▲ / ▼ |
| Ocultar / mostrar | 👁 (oculta también todas sus partes) |
| Bloquear | 🔒: el objeto no se puede seleccionar en el lienzo. Útil para fondos y edificios. |

### Entrar a un objeto

**Doble clic** sobre un objeto (en el lienzo o en la lista) entra a editar sus **partes**:
- **Partes seleccionables:** por ejemplo, la cabeza, el cuerpo o una pata del perro. Se seleccionan y manipulan con las mismas manijas de [§7b](#7b-objetos-en-la-escena-seleccionar-mover-escalar-rotar).
- **Partes de partes:** si una parte tiene partes (la cabeza tiene oreja, ojo y nariz), se puede volver a entrar con doble clic.
- **Lo demás se ve atenuado** y no se puede seleccionar. El objeto activo se marca con un contorno naranja punteado.
- **Dónde estás:** la ruta aparece arriba del lienzo y de la lista ("Escena › perro"). Haz clic en un nivel para volver a él.
- **Salir:** **Esc** primero deselecciona y, sin selección, sale un nivel.
- **Movimientos:** en Inspector → Movimiento, el árbol de grupos muestra solo las partes del objeto activo.

---

## 7d. Animar con fotogramas clave

Un **fotograma clave** (clave) guarda cómo está un objeto en un instante: dónde está, cuánto está rotado, su tamaño o su opacidad. Pones claves en distintos instantes y el editor calcula lo de en medio. Sirve para cualquier cosa:
- un perro que va por la vereda y dobla en la esquina (claves de posición);
- una puerta que se abre (rotación);
- algo que crece (escala);
- algo que aparece o se desvanece (opacidad).

### Animar una propiedad paso a paso

1. **Selecciona el objeto** en el lienzo o en el panel Objetos.
2. **Lleva el cursor rojo de la línea de tiempo** al instante donde empieza la animación, por ejemplo 0 s.
3. En **Inspector → Objeto**, haz clic en el **rombo ◆** junto a la propiedad (Posición X/Y, Rotación, Escala X/Y, Opacidad). Se crea la primera clave con el valor actual.
4. **Lleva el cursor a otro instante,** por ejemplo 2 s.
5. **Cambia la propiedad** como siempre: arrastra el objeto, usa las manijas o escribe el número. Como esa propiedad ya está animada, el cambio crea una clave en ese instante.
6. Dale **▶** para verlo.

### El rombo de cada propiedad

| Rombo | Significa | Clic |
|---|---|---|
| ◇ gris | La propiedad no está animada. Los cambios modifican su valor fijo. | Crea la primera clave en este instante. |
| ◇ amarillo | Está animada, pero no hay clave en este instante. Un cambio crea una. | Agrega una clave con el valor actual. |
| ◆ amarillo relleno | Hay una clave en este instante. Un cambio la ajusta. | Quita esa clave. |

Si quitas todas las claves de una propiedad, vuelve a su valor fijo.

### Cómo pasa de una clave a la siguiente

Cuando el cursor está sobre una clave, el Inspector muestra **"Clave en N s · hacia la siguiente:"** y un selector:

| Opción | Efecto |
|---|---|
| Suave | Arranca y termina despacio. Es la opción por defecto y la más natural. |
| Lineal | Velocidad constante. |
| Acelera | Arranca despacio y termina rápido. |
| Frena | Arranca rápido y termina despacio. |
| Mantener | Se queda quieto y salta al valor siguiente al llegar a la otra clave. |

Antes de la primera clave y después de la última, la propiedad se queda en el valor de esa clave.

### Las claves en la línea de tiempo

Con un objeto seleccionado, la línea de tiempo muestra al pie una fila **◆ nombre** con sus claves. El rombo blanco es el del instante actual; los seleccionados tienen borde azul.

| Acción | Efecto |
|---|---|
| Clic en un rombo | Lo selecciona y lleva el cursor de tiempo a ese instante. |
| Shift + clic | Agrega o quita el rombo de la selección. |
| Arrastrar un rombo | Mueve en el tiempo todos los seleccionados juntos, de a 10 ms. |
| Arrastrar desde un espacio vacío de la fila | Selecciona los rombos que abarca el rectángulo. Con Shift los agrega a la selección. |
| Clic en la fila vacía | Deselecciona. |

Después de hacer clic en la línea de tiempo, estos atajos actúan sobre las claves, no sobre el objeto:

| Tecla | Efecto |
|---|---|
| Supr | Borra las claves seleccionadas. El objeto no se borra. |
| Ctrl + C | Copia las claves seleccionadas. |
| Ctrl + V | Pega a partir del cursor de tiempo en el objeto seleccionado, que **puede ser otro**: así copias un movimiento de un perro a otro. |
| Ctrl + A | Selecciona todas las claves del objeto. |
| Esc | Deselecciona. |

### El camino en el lienzo

Si el objeto seleccionado tiene claves de **posición**, el lienzo dibuja su **camino**:
- una línea punteada amarilla por donde pasan sus pies (el ancla);
- un rombo en cada clave, con su instante ("1.5s"); el del instante actual, en blanco.

**Arrastra un rombo del camino** para cambiar dónde está el objeto en ese instante, sin mover el cursor de tiempo. Es la forma más rápida de dibujar un recorrido: crea las claves en distintos instantes y luego acomoda los puntos.

El camino muestra solo las claves. Si el objeto además tiene movimientos de eventos (por ejemplo "Caminar"), avanza un poco más allá de la línea.

### Animar partes de un objeto

Las claves también funcionan en las **partes**. Entra al objeto con doble clic ([§7c](#7c-panel-objetos-y-entrar-a-un-objeto)), selecciona la parte (por ejemplo la cabeza) y anímala igual: rombo, mover el cursor, cambiar.

Las claves que trae un **asset animado** (las de su propio proyecto) se reproducen también en sus instancias.

### Repetir: qué pasa después de la última clave

Con al menos dos instantes con claves, el Inspector muestra **"Después de la última clave:"**:

| Opción | Efecto | Ejemplo |
|---|---|---|
| Quedarse en la última | Se queda como en la última clave (por defecto). | Una puerta que se abre y queda abierta. |
| Repetir | Vuelve a empezar desde la primera clave, sin fin. | Un auto que da vueltas a la manzana: la primera y la última clave en el mismo lugar. |
| Ir y volver | Recorre las claves hacia adelante y luego hacia atrás. | Alguien que pasea de un lado a otro. |
| Continuar (acumula) | Repite, pero cada vuelta empieza donde terminó la anterior (posición y rotación). | Una persona que sigue caminando por la calle, o una rueda que no deja de girar. |

Se repite el tramo entre la **primera y la última clave del objeto**, contando todas sus propiedades. En la línea de tiempo, las repeticiones se ven como rombos tenues.

### Cómo se combina con lo demás

- **Movimientos de eventos:** se suman. Si el perro tiene claves de posición y además su evento "Caminar" lo hace avanzar, avanza **desde** la posición que marcan las claves.
- **Assets animados:** las claves de la instancia la mueven por la escena mientras el asset anima sus patas. Así se arma un perro que camina **por un camino**.
- **Opacidad:** se hereda. Un objeto al 50 % deja a todas sus partes al 50 %.
- **Guardar:** las claves se guardan con **Subir**.

---

## 7e. Cámara y profundidad

### La cámara

Toda escena tiene una **Cámara**: es lo que se verá en el resultado. Aparece en el panel Objetos con el ícono 🎥, y en el lienzo como el **rectángulo punteado**; lo que queda fuera se ve más oscuro.

- **Seleccionarla:** haz clic en el **borde** del rectángulo (el interior es la escena) o en el panel Objetos.
- **Moverla:** arrástrala por el borde.
- **Inspector:**
  - **Centro X / Y:** el punto que mira;
  - **Zoom:** 2 = se acerca al doble, 0,5 = se aleja;
  - **Ancho / Alto del cuadro:** el tamaño del resultado, 1280×720 por defecto.
- **Animarla:** igual que cualquier objeto, con los rombos ◆ ([§7d](#7d-animar-con-fotogramas-clave)). Claves en el centro para recorrer una calle larga, claves de zoom para acercarse a algo. Su recorrido se ve como una línea punteada.
- **Vista de cámara** (interruptor en su Inspector): el lienzo sigue a la cámara cuadro a cuadro y lo de afuera queda casi negro. Así ves cómo quedará. Apágalo para volver a moverte libremente.
- La cámara no se puede borrar ni duplicar.

### Profundidad: quién tapa a quién

Por defecto, los objetos se dibujan según su **capa** (flechas ▲▼ del panel Objetos). En una escena vista "desde arriba", como una calle, conviene que **lo que está más abajo en la pantalla se dibuje delante**: una persona que pasa por delante de un auto lo tapa y, al pasar por detrás, queda tapada.

- **Botón Profundidad** (cabecera del panel Objetos): activa ese orden en el nivel donde estás, sea la escena o un objeto en el que entraste. El orden se recalcula en cada cuadro, así que funciona con objetos que se mueven.
- **Plano** (Inspector): para lo que debe quedar siempre detrás o siempre delante.

  | Plano | Uso |
  |---|---|
  | −1 | Fondo: edificios, cielo. Siempre detrás. |
  | 0 | Por defecto: se ordenan entre sí por altura. |
  | 1 | Primer plano: un poste delante de la cámara. Siempre delante. |

- La altura que cuenta es la de los **pies** del objeto (su ancla). Los assets agregados desde la Biblioteca ya la tienen en los pies.

---

## 8. Línea de tiempo

**Cabecera:** a la izquierda, el evento que se reproduce; al centro, los controles; a la derecha, el tiempo `actual / duración` y **⌄** para plegar el panel.

| Control | Acción |
|---|---|
| **↺** | Vuelve al inicio y pausa. |
| **▶ / ■** | Reproducir / detener. |
| **⏩** | *En desarrollo:* la velocidad de reproducción todavía no está implementada; el botón muestra un aviso del navegador que hay que cerrar. |

**Qué muestra:**
- **Columna de pistas:** el nombre de cada barra.
- **En las modalidades Evento, Script o Macro:** una barra azul por cada **sub-evento** del evento seleccionado ("SUB-EVENTOS").
- **En Inspector → Movimiento:** una barra naranja por cada **movimiento** del grupo elegido ("MOVIMIENTOS"), con su número y tipo, por ejemplo "1 · RotOsc". Si está inactivo muestra "(off)".

**Interacciones:**
- **Línea roja (cursor de tiempo):** arrástrala para ver cualquier instante; pausa la reproducción.
- **Arrastrar una barra** la mueve en el tiempo. **Arrastrar sus bordes** la alarga o acorta. El cambio se guarda en el evento o movimiento (recuerda **Subir**).
- **Arrastrar el fondo** desplaza el eje horizontal.
- **Mantén `Y` y arrastra** para desplazarte verticalmente cuando hay muchas pistas.
- Los tiempos se muestran en milisegundos (`0–4000`).

---

## 9. Para desarrolladores

### Transformación de objetos desde la consola

Lo normal es usar las manijas y el Inspector ([§7b](#7b-objetos-en-la-escena-seleccionar-mover-escalar-rotar)). Para pruebas, en **desarrollo** (`npm start`) el editor queda accesible desde la consola del navegador:

```js
const ed = window.__editorEvento.evento.current.edicion;
// grupo contenedor de un objeto agregado desde la Biblioteca (ej. "animacion-deafult_1")
for (const g of [ed.gestion_grupos_originales.getGrupo("animacion-deafult_1"),
                 ed.gestion_grupos.getGrupo("animacion-deafult_1")]) {
  Object.assign(g.transformacion, {escala_x: -0.6, escala_y: 0.6, rotacion: 0});
}
```

**Valores de `transformacion`:**
- **rotacion:** grados; positivo = sentido horario.
- **escala_x / escala_y:** 1 = tamaño original; negativo = espejo.
- **ancla_x / ancla_y:** el punto fijo, relativo al origen del contenedor. Por defecto es el centro inferior del objeto ("los pies").

**Cómo se aplica:** al dibujar, sin modificar las figuras, así la animación no se deforma. Se guarda con **Subir**.

`window.__editorEvento` no existe en el build de producción.

---

## 10. Editor de dibujo y sus atajos

El editor de dibujo (`/animacion/:id`, y el modo **Dibujo** del editor de eventos) se maneja en gran parte con el teclado.

**Cómo leer los atajos:**
- `Shift izq. + 1` significa mantener **Shift izquierdo** y presionar **1** en la **fila superior** del teclado (no el teclado numérico).
- Las teclas se combinan **manteniéndolas presionadas**.

### Espacios de trabajo

| Atajo | Espacio de trabajo |
|---|---|
| `Shift izq. + 0` | Ninguno |
| `Shift izq. + 1` | Figura |
| `Shift izq. + 2` | Lista de figuras |
| `Shift izq. + 3` | Grupos |
| `Shift izq. + 4` | Pintado |
| `Shift izq. + 5` | Atributos del lienzo |
| `Shift izq. + 6` | Imágenes del lienzo |
| `F` + arrastrar con el botón izquierdo | Seleccionar figuras con un rectángulo |

### Lista de figuras (sobre las figuras seleccionadas con el rectángulo)

| Atajo | Acción |
|---|---|
| `Q + E` | Mover las figuras |
| `Q + B` | Borrar las figuras |
| `Q + D` | Duplicar las figuras |
| `Q + G` | Rotar las figuras |
| `Shift izq. + A` | Agregar una figura igual a la última agregada |
| `Shift izq. + S` | Imán: unir extremos al editar |
| `Shift izq. + X` | Mover solo en el eje X |
| `Shift izq. + Y` | Mover solo en el eje Y |
| `Shift izq. + B` | Borrar la figura seleccionada |

### Grupos

| Atajo | Acción |
|---|---|
| `Q + G` | Rotar los grupos |

### Pintado

| Atajo | Acción |
|---|---|
| `S` | Seleccionar puntos para borrar |
| `Supr` | Borrar los puntos seleccionados |

### Atributos del lienzo

| Atajo | Acción |
|---|---|
| `E` + arrastrar | Mover el lienzo |
| `Z` + rueda | Zoom |
| `R` | Volver a las coordenadas originales |
| `S` | Mostrar u ocultar la información del lienzo |
| `P` | Activar o desactivar el pintado de los grupos |

### Imágenes del lienzo (con una imagen seleccionada)

| Atajo | Acción |
|---|---|
| `T` + rueda | Cambiar el tamaño de la imagen |
| `O` + rueda | Cambiar la opacidad de la imagen |

---

## 11. Ejemplo paso a paso: un perro que camina y se sienta

Así está armado el ejemplo del proyecto (animación `animacion-deafult`):

**1. El dibujo.** Grupo `perro` como contenedor; dentro, `cuerpo`, `cabeza` (con `oreja`, `ojo` y `nariz`), `cola` y cuatro patas. Las patas del lado lejano tienen **capa 0** para quedar detrás del cuerpo (capa 2).

**2. Los eventos.**

```
EventoGeneral (0 – 6,5 s)
├── Caminar  (0 – 4 s)
└── Sentarse (4 – 6,5 s)
```

**3. Caminar:**
- `perro`: **MRU** a 30 unidades/s; todo el perro avanza.
- **Cada pata:** **Rotación Oscilatoria** de ±20° con frecuencia 7,85 rad/s (un paso cada 0,8 s), con el pivote en la cadera. Las patas en diagonal van en fase y los dos pares en contrafase (amplitud 20 y −20).
- `cuerpo` y `cabeza`: **Oscilatorio** pequeño en Y (el rebote).
- `cola` y `oreja`: **Rotación Oscilatoria** al doble de frecuencia.
- 4 s son exactamente 5 pasos, así que al terminar las patas quedan rectas.

**4. Sentarse:** movimientos de 1,5 s que luego quedan congelados.
- `cuerpo`: **Rotación** −25° sobre el hombro delantero.
- **Patas traseras:** **Rotación** −80° / −70°, más un **LERP** para bajar con la cadera.
- `cola`: **Rotación** y **LERP**.
- `cabeza`: **LERP** para acomodarse.

**5. Probar:** selecciona `EventoGeneral` y dale **Play**. Selecciona solo "Sentarse" para ver ese tramo en contexto.

---

## 11b. Ejemplo incluido: una calle

El proyecto del perro trae una escena de ejemplo, **"Calle (escena)"**. Ábrela desde la lista de eventos del proyecto. Combina casi todo lo del editor.

**Assets del proyecto** (en la Biblioteca, *Assets animados*; cada uno también como dibujo editable):

| Asset | Qué tiene |
|---|---|
| Árbol, Casa roja / azul / amarilla, Farol, Nube, Calle | Estáticos. La Calle es una franja de 3000 de ancho con cielo, veredas, asfalto y líneas. |
| Auto | Ruedas que giran: claves de rotación con *Repetir*. |
| Persona, Persona 2 | Caminan en el lugar: piernas y brazos con *Ir y volver*. |
| Pájaro | Aletea. |
| Sol | Rayos que giran despacio. |

**La escena:**
- **Instancias por referencia** de todos los assets. El perro es tu asset del perro con el evento *Caminar*, al 55 %.
- **Claves de posición** con *Repetir*: autos en los dos sentidos (uno reflejado con Espejo), las personas, el pájaro (sube y baja) y las nubes.
- **Profundidad** activada:
  - plano −3: la calle;
  - plano −2: sol y nubes;
  - plano −1: casas, árboles y faroles del fondo;
  - plano 0: personas, perro y autos;
  - plano 1: el farol del frente.
- **Cámara** que recorre la calle en 16 s, de ida y vuelta. Actívale **Vista de cámara** y dale ▶.

Úsala como punto de partida: duplica objetos, cambia claves o arrastra más assets desde la Biblioteca.

---

## 12. Limitaciones conocidas

- **Velocidad de reproducción (⏩):** no implementada; muestra un aviso del navegador.
- **Campos de evento sin efecto:** `x`, `y`, `reposicionar` y `tiempo_relativo`.
- **Dibujos de la Biblioteca:** son copias sin sus eventos. Usa los *assets animados* para tener objetos con eventos.
- **Assets animados:**
  - al desvincular, la copia no conserva los eventos del asset;
  - las instancias agregadas antes del 2026-11-13 (2) muestran el nombre del documento (`evento_default`) en vez del proyecto;
  - un asset dentro de otro asset no se dibuja;
  - las versiones no se pueden borrar ni describir desde el editor.
- **Selección de objetos:** todavía no hay selección arrastrando un rectángulo en el vacío (usa Shift+clic). Escalar o rotar varios objetos a la vez no está disponible (sí moverlos y borrarlos).
- **Sin deshacer:** las operaciones sobre objetos (mover, borrar, duplicar…) no se pueden deshacer. Recargar la página sin "Subir" descarta todos los cambios.
- **Movimientos de Figuras:** afectan a los hijos directos, no a los nietos.
- **Sin sesión:** el editor muestra un error en vez de ir al inicio de sesión.
- **Menú Archivo:** todavía no tiene Importar, Guardar como ni Deshacer/Rehacer en el editor de eventos (el editor de dibujo sí tiene deshacer).
- **Script y Macro:** en desarrollo.
