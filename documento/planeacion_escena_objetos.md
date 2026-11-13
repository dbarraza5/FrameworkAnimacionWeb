# Planeación: escena con objetos animados (hacia una ciudad 2D)

Creado: 2026-11-11 · Documento vivo: se actualiza al cerrar cada fase o cuando aparece un requerimiento nuevo.
Alcance: editor de eventos (`/evento/:id`) y motor de animación (`Clases/EditorEvento/`, `Clases/EditorAnimacion/`), más los cambios de modelo en el backend que cada fase necesite.

## Objetivo

Poder armar una **escena 2D** (meta de referencia: una ciudad con edificios, calle, autos y personas o perros caminando) a partir de **objetos** reutilizables. Un *objeto* (perro, casa, auto) se dibuja y se anima por separado, una sola vez, y después se inserta en la escena tantas veces como haga falta, con su propia posición, tamaño, orientación y animación.

**Naturaleza del proyecto** (restricción de diseño, no se negocia): animaciones **poligonales simples**, no realistas ni detallistas. Ante dos soluciones, se prefiere la más simple que encaje con el modelo de datos actual (cada trazo es un objeto JSON).

**Forma de trabajo:** por prototipos. Cada fase entrega algo que se puede probar en el editor, y las fases siguientes se ajustan con lo aprendido. El orden de abajo es el plan actual, no un compromiso.

---

## 1. Glosario

| Término | Significado en este documento |
|---|---|
| **Asset** | Una animación (`Animacion`: su `grupos_figuras`), y más adelante también sus eventos, pensada para reutilizarse. Ej.: "perro". |
| **Objeto / instancia** | Un uso de un asset dentro de la escena, con su propia transformación y estado. Ej.: `perro_1`, `perro_2`. |
| **Escena** | El lienzo del editor de eventos con todos sus objetos. Hoy es el documento `Eventos` del proyecto. |
| **Contenedor** | Grupo raíz que agrupa todos los grupos de una instancia (hoy lo crea `agregarInstanciaAnimacion`). |
| **Transformación de instancia** | `{x, y, rotacion, escala_x, escala_y, ancla}` aplicada **al dibujar**, después de calcular la animación. |
| **Nivel escena / nivel objeto** | Escena: se seleccionan y manipulan objetos completos. Objeto: se "entra" a uno para editar sus grupos y movimientos. |

---

## 2. Decisiones de diseño tomadas

Cada decisión registra de dónde salió, para no volver a discutirla sin un dato nuevo.

| # | Decisión | Motivo / evidencia |
|---|---|---|
| D1 | Los sub-eventos tienen tiempos **relativos al padre**; antes de su inicio no aportan nada y al terminar quedan **congelados** (conservan su efecto). | Permite encadenar eventos ("Caminar" 0–4 s → "Sentarse" 4–6,5 s). Implementado. |
| D2 | Al seleccionar un evento, Play lo reproduce **en contexto**: el reloj mide desde su inicio, pero el árbol completo se evalúa en el instante absoluto. | Elegido por el usuario. "Sentarse" arranca donde terminó "Caminar". Implementado. |
| D3 | Soltar una animación en el lienzo la **agrega como instancia** (contenedor nuevo + grupos renombrados); no reemplaza. | Elegido por el usuario. Implementado como prototipo (por copia, ver D5). |
| D4 | Escalar, rotar y reflejar un objeto debe ser una **transformación de instancia aplicada al dibujar**, no reescribir las coordenadas de las figuras. | Simulado con el motor real: escalar los datos del perro al 60 % rompe la animación (pivotes, LERP y amplitudes están en píxeles), mientras que escalar al final queda bien. Además, `OperacionesGrupo` redondea con `parseInt` y acumula error (bug ya registrado: "espejo reiterativo deforma figuras"). |
| D5 | Meta: instancias **por referencia** al asset (no copias). La copia actual es solo un prototipo. | Con copias, mejorar el perro no actualiza los perros de la escena, y 40 objetos × 12 grupos vuelven el árbol inmanejable. |
| D6 | Edición en **dos niveles**: en la escena, un clic selecciona el objeto completo; con doble clic se entra al objeto (los demás se atenúan) y Esc sale. | Patrón estándar (símbolos de Flash, aislamiento de Illustrator, componentes de Figma). El lienzo ya tiene un antecedente: el modo de selección de grupos baja a los hijos del grupo seleccionado. |
| D7 | La animación de un personaje es **en el lugar** (caminar sin avanzar); el desplazamiento por la escena lo da la escena, con velocidad proporcional a la escala. | Si el asset avanza por su cuenta, un perro escalado al 60 % avanza los mismos píxeles que el grande y "patina". |
| D8 | Antes de agregar más funciones, el editor pasa a una **distribución de editor profesional** (Fase 0): lienzo grande al centro, paneles fijos alrededor y la línea de tiempo fuera del canvas. | Requerimiento del usuario. Además, las Fases 2 y 3 agregan manijas, un inspector y un panel de objetos que no caben en la interfaz actual. |

---

## 3. Estado actual (punto de partida)

Lo implementado en la rama `animacion` del frontend:

| Pieza | Estado | Dónde |
|---|---|---|
| Sub-eventos encadenados (D1) + movimientos de figuras aplicados en cadena | Commit `c9fbc8d` | `GestionEvento.procesarNodoEvento`, `aplicarMovimiento` |
| Rotación/zoom en grupos anidados (`cx_solid`) | Commit `c9fbc8d` | `OperacionesGrupo.origenGrupoX/Y` |
| Movimiento "Rotación Oscilatoria" (vaivén) | Commit `c9fbc8d` | `MOV_ROTACION_OSCILATORIA` |
| Reproducir el evento seleccionado (D2) | Commit `dd5bc8f` | `GestionEvento.eventoReproduccion`, `inicioAbsoluto` |
| Timeline de eventos (barras de sub-eventos, arrastrables) | Commit `dd5bc8f` | `TimelineCanvas` (`nivel`), `GestionLienzoEvento.actualizarTimelineEventos` |
| Biblioteca de animaciones (offcanvas con miniaturas) + soltar como instancia (D3) | **Sin commit** | `OffcanvasAnimaciones.js`, `Miniatura.js`, `GestionEvento.agregarInstanciaAnimacion` |

**Limitaciones conocidas que afectan a este plan:**
- El lienzo se refresca cada 100 ms (≈10 cuadros por segundo) y el motor escribe en consola en cada cuadro.
- En cada cuadro se clonan **todos** los grupos (`grupos_trabajo`): con muchos objetos va a pesar.
- No hay bucle de eventos ni de movimientos (`bucle`/`tiempo_bucle` existen en el modelo pero no se usan).
- Las instancias son copias (D5) y entran **quietas**: el dibujo se copia, los eventos del asset no.
- `grupoFigurasSchema` (backend) es estricto: cualquier campo nuevo en un grupo (ej. `transformacion`) **Mongoose lo descarta al guardar** si no se agrega al schema.
- ~~Lienzo de tamaño fijo 600×600 con la línea de tiempo dentro del mismo canvas y el centro del zoom (`300`) escrito a mano~~ → resuelto en la Fase 0.A.

**Herramienta de prueba:** durante el desarrollo se usó un simulador en Node que corre el motor real (`GestionEvento`) sin navegador y dibuja cuadros clave a PNG. Hoy vive fuera del repo (en una carpeta temporal); ver la tarea T1 en Pendientes.

---

## Fase 0 — Interfaz de editor profesional (lienzo grande) — EN CURSO (0.A implementada, falta 0.B)

**Objetivo:** que el editor de eventos se vea y se use como un editor de animación profesional. El lienzo ocupa todo el espacio disponible, cada cosa tiene un lugar fijo y predecible, y la interfaz queda lista para las fases siguientes (inspector, panel de objetos, manijas) (D8).

### Referencia: cómo distribuyen la pantalla los editores de animación

Revisión de editores 2D conocidos (Adobe Animate, Toon Boom Harmony, Spine, Rive, Synfig y OpenToonz) y de editores de diseño con el mismo esquema (Figma). Todos convergen en la misma distribución:

| Zona | Qué va ahí | Ejemplos | Tamaño habitual (aprox.) |
|---|---|---|---|
| Barra de menú / superior | Archivo, Editar, Ver…; nombre del documento; selector de **modo** (Diseño / Animar); guardar o exportar | Todos. Rive y Spine ponen arriba el cambio de modo (*Design/Animate*, *Setup/Animate*) | 36–48 px de alto |
| Barra de herramientas | Herramientas del lienzo: seleccionar, mover, rotar, escalar, mano, zoom | Vertical a la izquierda en Animate, Harmony y OpenToonz; horizontal arriba en Rive y Figma | 40–48 px de ancho (íconos de 20–24 px) |
| Panel izquierdo | Jerarquía o capas de la escena, biblioteca de assets | Rive y Figma (capas/jerarquía), Animate (biblioteca en pestaña) | 220–300 px, redimensionable |
| **Lienzo (centro)** | El escenario, sobre un fondo neutro ("mesa de trabajo") donde se ve el borde del documento; zoom y paneo libres | Todos | Todo el espacio restante (normalmente 60–70 % de la pantalla) |
| Panel derecho (inspector) | Propiedades de lo seleccionado: transformación, color, parámetros del movimiento o evento | Todos (Animate "Propiedades", Spine "Tree + Properties", Rive "Inspector") | 260–340 px, redimensionable |
| Línea de tiempo (abajo) | Lista de capas/pistas a la izquierda + regla de tiempo y barras a la derecha; controles de reproducción y tiempo actual en su cabecera | Animate, Harmony, Spine (Dopesheet), Rive (en modo Animar) | 180–320 px, redimensionable y plegable |
| Barra de estado | Zoom %, coordenadas del cursor, cuadros por segundo, avisos | Harmony, OpenToonz, Synfig | 22–28 px |

Rasgos comunes que conviene copiar:
- **Tema oscuro neutro** (grises entre #1e1e1e y #2d2d2d): no compite con los colores del dibujo. Texto compacto de 11–13 px y controles densos.
- **La interfaz ocupa toda la ventana** (100 % de alto, sin barra de desplazamiento de página). Los paneles se redimensionan arrastrando el borde y se pliegan.
- **Seleccionar → el inspector muestra sus propiedades.** No hace falta navegar pestañas: lo que se edita depende de lo seleccionado (objeto, evento o movimiento).
- **La línea de tiempo es un panel propio**, separado del lienzo, y tiene su propia lista de pistas a la izquierda alineada con las barras.
- **Lienzo con documento y mesa de trabajo:** el área del documento (ej. 1280×720) se ve como un rectángulo sobre un fondo más oscuro. "Ajustar a la vista" y "100 %" están a un clic, y el zoom se hace alrededor del cursor.

### Distribución propuesta

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ Archivo Editar Ver   ·  proyecto / animación   ·  [Diseño|Animar]  ⤓ Subir │  40 px
├────┬────────────────┬─────────────────────────────────────┬──────────────────┤
│ ▢  │ ESCENA         │                                     │ INSPECTOR        │
│ ✥  │ ▸ EventoGeneral│                                     │ (según selección)│
│ ⟲  │   ▸ Caminar    │            LIENZO                   │  Objeto:         │
│ ⤢  │   ▸ Sentarse   │   (documento sobre mesa de trabajo, │   x, y, rotación │
│ ✋ │ ─────────────  │    ocupa todo el espacio libre)      │   escala, espejo │
│ 🔍 │ OBJETOS        │                                     │  Evento: tiempos │
│    │  perro_1  👁 🔒│                              [−][+] │  Movimiento:     │
│    │  casa_1   👁 🔒│                              [⤢]    │   tipo y datos   │
│    │ ─────────────  │                                     │                  │
│    │ BIBLIOTECA     │                                     │                  │
│ 44 │    260 px      │              flexible               │     300 px       │
├────┴────────────────┴─────────────────────────────────────┴──────────────────┤
│ ⏮ ▶ ⏭  00:02.40 / 00:06.50  1x │ 0s    1s    2s    3s    4s    5s    6s    │
│ pistas:                         │ ▓▓▓▓▓▓▓ Caminar ▓▓▓▓▓▓▓▓▓|▓▓ Sentarse ▓▓    │  220 px
│  Caminar                        │                         ▲ cursor de tiempo │
│  Sentarse                       │                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ zoom 100 %   x: 412  y: 288   60 fps                                         │  24 px
└──────────────────────────────────────────────────────────────────────────────┘
```

Dónde termina cada pieza que ya existe:

| Hoy | Pasa a |
|---|---|
| Menú lateral `MenuEvento` (offcanvas izquierdo: Subir, Refrescar, Guardar como, Exportar, Importar) | Barra de menú superior (Archivo) + botón "Subir" visible |
| Pestañas de `NavEventos` (Eventos, Movimientos, Grupos, Config, Script, Macro) | Panel izquierdo (árbol de eventos, objetos, biblioteca) + inspector derecho (formularios de evento y de movimiento) |
| Biblioteca (offcanvas derecho, recién creada) | Pestaña "Biblioteca" del panel izquierdo (se sigue arrastrando al lienzo) |
| Línea de tiempo dibujada dentro del canvas del lienzo | Panel inferior propio, con su canvas y una lista de pistas |
| Botones de zoom, centrar y reproducir dentro del lienzo | Zoom y "ajustar a la vista" en una esquina del lienzo y en la barra de estado; reproducción en la cabecera de la línea de tiempo |
| Pestañas "Edición / Animación / Exportar" de `NavEditorEvento` | Selector de modo en la barra superior (ver pregunta P5) |

### Alcance

1. **Estructura de la página:** CSS grid a pantalla completa (100vh) con las zonas de la tabla; paneles laterales e inferior redimensionables (arrastrando el borde) y plegables, con sus tamaños recordados en `localStorage`.
2. **Lienzo que se adapta al espacio:**
   - El canvas toma el tamaño de su contenedor (`ResizeObserver`) y respeta `devicePixelRatio` para que se vea nítido.
   - Reemplazar los `600`/`300` escritos a mano por el tamaño real del canvas (centro de zoom = centro del lienzo).
   - Zoom alrededor del cursor, "ajustar a la vista", "100 %".
   - Área del documento (tamaño configurable, ej. 1280×720) dibujada sobre la mesa de trabajo.
3. **Línea de tiempo separada:** `TimelineCanvas` pasa a su propio canvas en el panel inferior, con una lista de pistas a la izquierda alineada con las barras y los controles de reproducción y el tiempo actual en su cabecera.
4. **Inspector derecho:** muestra los formularios existentes (evento, movimiento) según lo seleccionado. En la Fase 1 se suma la transformación del objeto.
5. **Tema oscuro** para el editor (Bootstrap 5.3 trae `data-bs-theme="dark"`), con tipografía compacta.
6. **Barra de estado:** zoom %, coordenadas del cursor y cuadros por segundo.

**Fuera de alcance:** funciones nuevas de edición (manijas, transformar objetos), que son de las Fases 1–3. Unificar el editor de dibujo y el de eventos en uno solo con modos (ver P5). El editor de dibujo (`/animacion/:id`) mantiene su aspecto actual hasta decidir P5.

**Verificación:**
- [ ] En 1920×1080 el lienzo ocupa al menos el 60 % del ancho y no hay barra de desplazamiento de página.
- [ ] Al agrandar o achicar la ventana, o al mover el borde de un panel, el lienzo se redimensiona sin deformarse ni perder nitidez.
- [ ] Con zoom y paneo aplicados, los controles de movimientos (pivote, flecha, elipse) siguen respondiendo exactamente donde se dibujan.
- [ ] La línea de tiempo en su panel: reproducir, arrastrar el cursor de tiempo, arrastrar y estirar barras (de eventos y de movimientos) funciona como antes.
- [ ] Soltar una animación desde la biblioteca cae donde se suelta.
- [ ] Todo lo que se podía hacer antes se puede seguir haciendo (lista de acciones de los menús y pestañas actuales, comprobada una por una).

### Avance 0.A — IMPLEMENTADA (2026-11-11, sin commit todavía)

La fase se dividió en dos entregas que se pueden probar por separado: **0.A** (armazón, lienzo y timeline) y **0.B** (inspector y detalles).

**Alcance realizado:**
1. **Armazón a pantalla completa** (`EditorEvento.js` + `EditorEvento.css`, tema oscuro con `data-bs-theme="dark"` solo en el editor). Grid con barra superior (40 px), panel izquierdo "Escena" (320 px), lienzo, panel derecho (300 px), timeline (230 px) y barra de estado (24 px).
   - Los paneles se redimensionan arrastrando el borde (`Layout/Separador.js`) y se ocultan desde el menú **Ver** o su botón «, ».
   - Tamaños y visibilidad se guardan en `localStorage` (`editor_evento_layout_v1`).
   - La ruta `/evento/:id` ya no usa el contenedor de `Home`. El menú de la aplicación (`MenuLateral`) se abre con el botón ☰ de la barra superior.
2. **Barra superior:** ☰ (menú de la app), **Archivo** (Subir, Exportar), **Ver** (paneles, Ajustar a la vista, Zoom 100 %), selector de modo **Animar / Dibujo** (Dibujo muestra el editor de figuras con su aspecto anterior; ver P5) y botón **Subir** visible.
3. **Lienzo adaptable:**
   - Toma el tamaño de su contenedor en cada cuadro y respeta `devicePixelRatio` (`GestionLienzoEvento.prepararCanvas`).
   - Se eliminaron los `300` escritos a mano. La vista es `pantalla = x_des_zoom + escala·(mundo + paneo)`, con `pantallaAMundo`, `zoomEnPunto`, `ajustarVista` y `zoomReal` en `ConfiguracionLienzoEvento`.
   - Rueda = zoom alrededor del cursor (10 %–800 %). Los botones ⊙ / − / + quedan arriba a la derecha (⊙ ahora "ajusta a la vista"). El paneo se corrigió para seguir al cursor con cualquier zoom.
   - **Documento** de 1280×720 (valor provisorio, ver P6) dibujado blanco sobre la mesa de trabajo gris, con la grilla solo dentro del documento. Al abrir se encuadra solo.
4. **Timeline en su propio canvas** (`#timeline-evento`, panel inferior):
   - Se adapta al tamaño del panel.
   - Cabecera con el evento que se reproduce a la izquierda, los controles centrados y el tiempo `actual / duración` a la derecha.
   - Se quitó el botón "cortina" (plegar es cosa del panel).
5. **Panel derecho:** por ahora la **Biblioteca** acoplada (la misma de `OffcanvasAnimaciones`, modo `embebido`). En la pestaña Grupos sigue el botón «Reemplazar grupos…».
6. **Barra de estado** (`Layout/BarraEstado.js`, sondeo 4 veces por segundo): zoom %, x/y del cursor en el dibujo, modalidad, grupo seleccionado, tamaño del lienzo y cuadros por segundo.

**Errores corregidos en el camino:**
- `Tiempo.modPasivo()` reiniciaba el reloj con el último instante consultado (0 si nunca se había consultado): el reloj general arrancaba contando desde que se abrió la página (se veía 00:22 en vez de 00:00 y la línea roja fuera de la vista). Ahora reinicia con `performance.now()`.
- El efecto `grupos_a_sincronizar` asignaba `null` a los grupos al montar (`JSON.parse(null)`), y el motor fallaba si el primer cuadro llegaba antes de la descarga.
- `Lienzo.js` daba el foco siempre a `#lienzo-animacion` (le quitaba el teclado al lienzo de eventos). Ahora enfoca el canvas sobre el que entra el mouse.
- La barra de selección de evento tenía colores claros fijos; ahora usa clases que siguen el tema.

**Verificado en el navegador (Chrome, 1536×682):**
- [x] El lienzo ocupa el área central (916×388 px con los paneles por defecto, contra ~600×360 antes) y no hay barra de desplazamiento de página.
- [x] Play: el perro camina y se sienta. El tiempo de la cabecera y la línea roja avanzan bien (00:02.48 → 00:04.69).
- [x] La rueda hace zoom alrededor del cursor (47 % → 74 %).
- [x] Arrastrar el borde del panel izquierdo lo ensancha y el lienzo se reacomoda.
- [x] Arrastrar una miniatura de la biblioteca al lienzo agrega la animación donde se suelta.
- [x] El modo Dibujo muestra el editor de figuras, y volver a Animar restaura la vista.
- [x] Sin excepciones en la consola al cargar.
- [ ] Controles de movimientos (pivote, flecha, elipse) con zoom y paneo: no probado todavía.
- [ ] Arrastrar y estirar barras del timeline en el panel nuevo: no probado todavía.
- [ ] Revisión una por una de todas las acciones anteriores: pendiente (0.B).

### Pendiente para 0.B

1. **Inspector derecho:** mover los formularios de evento y de movimiento (hoy en las sub-pestañas del panel izquierdo) a un inspector que muestre lo seleccionado. La biblioteca pasa a una pestaña.
2. **Lista de pistas** a la izquierda del timeline, alineada con las barras.
3. El panel izquierdo muestra "Evento: Ninguno" al abrir, aunque se reproduce `EventoGeneral`: `NavEventos` busca el evento seleccionado antes de que se descarguen los datos y no vuelve a intentarlo.
4. El HUD del lienzo (texto arriba a la izquierda) duplica la barra de estado y muestra `Mod: undefined`: quitarlo o dejarlo solo en modo debug.
5. Limpiar los avisos de React de `Lienzo.js` (props que no van al `<canvas>`, `autofocus`/`tabindex`).
6. El menú Archivo perdió «Importar» (abría un modal que no existe en esta página), y también «Refrescar», «Guardar como» y «Deshacer/Rehacer», que no hacían nada. Reponerlos cuando tengan implementación.

---

## Fase 1 — Transformación de instancia (no destructiva)

**Objetivo:** que cada objeto de la escena tenga posición, rotación, escala y espejo propios, sin tocar sus figuras ni romper su animación (D4).

**Alcance:**
1. **Modelo:** campo `transformacion` en el grupo contenedor: `{x, y, rotacion (grados), escala_x, escala_y, ancla_x, ancla_y}`. El espejo es `escala_x < 0` o `escala_y < 0`. El ancla es relativa al rectángulo del objeto (por defecto, centro inferior = "los pies").
   - Backend: agregar `transformacion` a `grupoFigurasSchema` (si no, se pierde al guardar).
2. **Dibujo:** al imprimir, cada grupo aplica la transformación de su contenedor (el ancestro con `transformacion`) usando `ctx.save / translate / rotate / scale / restore`. El zoom del lienzo ya funciona así (`ConfiguracionLienzoEvento`).
3. **Motor:** sin cambios: calcula la pose en el espacio propio del objeto. La transformación se aplica después.
4. `agregarInstanciaAnimacion` crea el contenedor con `transformacion` neutra, con el ancla en la posición donde se soltó.
5. Funciones de apoyo: `transformarPunto(objeto, p)` y su inversa (las usará la Fase 2 para detectar clics).

**Fuera de alcance:** la interfaz para editar la transformación (Fase 2); por ahora se prueba editando los valores.

**Verificación:**
- [ ] Simulador: perro con `escala 0.6` → camina y se sienta sin que se separen partes (comparar con la imagen de referencia de D4).
- [ ] Simulador: `escala_x = -1` → el perro mira y **camina** hacia la izquierda.
- [ ] Simulador: `rotacion = 15` → todo el perro inclinado, con la animación intacta.
- [ ] Navegador: guardar ("Subir"), recargar → la transformación persiste.
- [ ] Una escena sin transformaciones se ve idéntica a antes (no hay regresión).

---

## Fase 2 — Seleccionar y manipular objetos en el lienzo

**Objetivo:** las operaciones simples que hoy faltan al soltar un objeto: mover, redimensionar, rotar y reflejar, con el mouse.

**Alcance:**
1. **Selección a nivel objeto:** un clic sobre cualquier figura de un objeto selecciona su **contenedor**. Para detectar el clic se convierte el mouse al espacio del objeto (inversa de la Fase 1) y se compara con el rectángulo del objeto.
2. **Rectángulo de selección con manijas:**
   - 4 esquinas: redimensionan manteniendo la proporción.
   - 4 lados: redimensionan en un solo eje.
   - Manija superior: rota (Shift = pasos de 15°).
   - Arrastrar el interior: mueve.
3. **Barra flotante junto a la selección:** espejo horizontal, espejo vertical, duplicar, borrar.
4. **Teclado:** flechas = mover 1 px (Shift: 10 px), Supr = borrar, Ctrl+D = duplicar, Esc = deseleccionar.
5. **Panel de propiedades numérico:** x, y, rotación, escala, espejo y capa del objeto seleccionado.
6. **Selección múltiple:** Shift+clic o rectángulo de selección; mover y borrar en grupo. *(Escalar o rotar varios objetos alrededor de un centro común puede quedar para después.)*

**Decisiones a tomar al empezar:** en qué modalidad del editor vive esta interacción (¿una nueva "Escena", o dentro de "Grupos"?) y cómo convive con el modo de selección de grupos actual.

**Verificación:**
- [ ] Soltar un perro → clic sobre su pata selecciona el perro completo (rectángulo y manijas visibles).
- [ ] Arrastrar una esquina → crece o se achica proporcionalmente; Play → la animación se ve bien.
- [ ] Rotar con la manija y reflejar con la barra; Play → correcto.
- [ ] Con zoom y paneo del lienzo activos, las manijas siguen respondiendo en el lugar correcto.
- [ ] El valor del panel y el lienzo se mantienen sincronizados en ambas direcciones.

---

## Fase 3 — Panel de objetos de la escena + entrar/salir de un objeto

**Objetivo:** que una escena con muchos objetos siga siendo manejable (D6).

**Alcance:**
1. **Panel "Escena":** lista de objetos (contenedores) con miniatura (`Miniatura.js`), nombre editable, ojo (visible), candado (bloqueado) y orden de capa arrastrable. Los grupos internos no aparecen en este nivel.
2. **Entrar a un objeto:** doble clic en el lienzo o en el panel. Los demás objetos se atenúan y no se pueden seleccionar; el árbol de grupos y el panel de movimientos muestran solo los del objeto. Esc o una ruta "Escena › perro_1" para salir.
3. Un objeto bloqueado no se puede seleccionar en el lienzo (útil para el fondo y los edificios).

**Verificación:**
- [ ] Escena con 10+ objetos: el panel muestra 10 filas, no cientos de grupos.
- [ ] Doble clic en un perro → solo él es editable; sus movimientos aparecen en el timeline.
- [ ] Esc vuelve a la escena con la selección del objeto intacta.
- [ ] Ocultar y bloquear desde el panel funciona y persiste al guardar.

---

## Fase 4 — Rendimiento base

**Objetivo:** que la escena se mueva fluida antes de llenarla de objetos.

**Alcance:**
1. Bucle de dibujo con `requestAnimationFrame` en vez de `useInterval(…, 100)`.
2. Quitar o condicionar a un modo debug los `console.log` del motor que corren en cada cuadro.
3. Evitar clonar **todos** los grupos en cada cuadro: clonar solo los grupos con movimientos de figuras activos.
4. Medición: cuadros por segundo visibles en el HUD (modo debug).

**Verificación:**
- [ ] Escena con 20 perros: animación fluida (objetivo ≥ 50 cuadros por segundo en un equipo normal).
- [ ] Los resultados del simulador no cambian (mismas poses en los mismos instantes).

---

## Fase 5 — Bucle de eventos y movimientos

**Objetivo:** que un ciclo (caminar 0,8 s, el parpadeo de un semáforo) se repita sin estirarlo a mano. Es imprescindible para una ciudad.

**Alcance:**
1. `bucle` + `tiempo_bucle` en movimientos: el tiempo del movimiento pasa a ser `t mod periodo`.
2. `bucle` en eventos: un evento en bucle repite su contenido mientras su padre esté activo.
3. Definir y documentar cómo interactúa con D1: un evento en bucle no se "congela", se repite hasta que termina su padre.

**Verificación:**
- [ ] "Caminar" con un solo ciclo de 0,8 s en bucle dentro de un evento de 10 s → camina los 10 s.
- [ ] Al pasar de una vuelta a la siguiente no hay saltos (con un ciclo que cierra en la misma pose).

---

## Fase 6 — Instancias por referencia + animación por instancia

**Objetivo:** que cada objeto de la escena use el asset original (D5) y tenga su propia animación activa.

**Alcance (a refinar al llegar):**
1. **Modelo de escena:** `objetos: [{id, asset, version, transformacion, capa, evento, desfase, bucle, visible, bloqueado, overrides}]`.
2. **Dónde viven los eventos de un asset:** hoy los eventos son del proyecto (documento `Eventos`), no de la animación. Hay que decidir si cada asset tiene sus propios eventos ("Caminar", "Sentarse") y la escena solo elige cuál reproducir. Ver pregunta P2.
3. **Reproducción:** cada instancia evalúa su evento con su propio tiempo (`t_escena + desfase`). La pose calculada se puede compartir entre instancias con el mismo asset, evento y tiempo.
4. **"Desvincular":** convierte una instancia en una copia independiente (como hace hoy el prototipo) para personalizarla.
5. Migración de las instancias-copia creadas en el prototipo.

**Verificación:**
- [ ] Tres perros del mismo asset con desfases distintos caminan desincronizados.
- [ ] Modificar el dibujo del asset "perro" → los tres perros cambian.
- [ ] Un perro desvinculado ya no cambia con el asset.

---

## Fase 7 — Desplazamiento por la escena

**Objetivo:** personas, perros y autos que recorren la escena (D7).

**Alcance:** recorridos (segmentos o polilíneas) asignables a un objeto; velocidad proporcional a la escala; al llegar al final, opción de volver a empezar (salir por un borde y entrar por el otro), ir y volver, o detenerse; el espejo se ajusta solo según el sentido de avance.

**Verificación:**
- [ ] Un perro chico y uno grande recorren la misma vereda sin "patinar".
- [ ] Un auto da la vuelta a la calle en bucle; sus ruedas giran (rotación continua).

---

## Fase 8 — Mundo, cámara y capas de escena

**Objetivo:** escenas más grandes que el lienzo, con profundidad creíble.

**Alcance:** mundo de tamaño configurable y vista (cámara) que se desplaza sobre él; capas de escena fijas (fondo, edificios, calle, vereda, primer plano) y orden por Y dentro de las capas con objetos en movimiento; objetos estáticos (casas, edificios) dibujados una vez en un canvas oculto y luego copiados como imagen.

**Verificación:**
- [ ] Una calle 3 veces más ancha que el lienzo se recorre con la cámara.
- [ ] Una persona que pasa por delante de un auto lo tapa, y al pasar por detrás queda tapada.

---

## Pendientes (backlog)

Ideas y tareas que todavía no tienen fase. Al tomar una, se convierte en fase (o se suma a una) y se borra de aquí.

**Herramientas**
- **T1 — Llevar el simulador al repo** (ej. `herramientas/simulador/`): correr el motor en Node y generar PNG o tiras de cuadros, para verificar fases sin navegador y detectar regresiones. *Prioridad alta: lo usan las verificaciones de casi todas las fases.*
- Deshacer y rehacer en el editor de eventos (el de dibujo ya tiene una pila de deshacer).

**Animación (detectado en el análisis de limitaciones)**
- Movimiento **Pose**: guardar una pose del grupo e interpolar vértice a vértice hacia otra (dibujar posturas en vez de calcularlas).
- Suavizado (*easing*) en LERP, rotación y pose.
- "Rotar hasta X° en N ms" (objetivo + duración, en vez de velocidad).
- Pivote anclado a un punto con nombre de una figura, en vez de un desplazamiento desde el centro del rectángulo del grupo.
- Rotación que arrastre a todos los descendientes (cadenas muslo → pierna → pata).
- Movimientos de propiedades: visibilidad, color y capa en el tiempo (parpadeos, cambio de expresiones).
- Papel cebolla en el editor de eventos.

**Salida**
- Exportar a WebM o GIF (`canvas.captureStream` + `MediaRecorder`) y a sprite sheet PNG.
- Reproductor JS independiente que lea el JSON y reproduzca eventos por nombre como estados (para juegos).

**Deuda técnica**
- Redondeos `parseInt` en rotación y zoom (posibles saltos de 1 px).
- Campos de evento sin usar: `x`, `y`, `reposicionar`, `tiempo_relativo`.
- Script (usa `eval`) y Macro (vacío) en desarrollo.
- Datos de ejemplo: el evento `EventoGeneral` todavía tiene un objeto `cubo` que no existe; la animación del perro se llama `animacion-deafult`.

---

## Preguntas abiertas

| # | Pregunta | Afecta a |
|---|---|---|
| P1 | ¿Una instancia usa una **versión congelada** del asset o siempre la **última**? (`Requerimientos.md` sugiere congelada.) | Fase 6 |
| P2 | ¿Dónde viven los eventos de un asset: en el asset (nuevo) o en el documento `Eventos` del proyecto (actual)? | Fase 6 |
| P3 | ¿La edición de escena es una modalidad nueva del editor de eventos o un editor aparte ("Escena")? | Fases 2 y 3 |
| P4 | ¿El ancla por defecto es el centro inferior para todos los objetos, o se elige al crear el asset? | Fase 1 |
| P5 | ¿Se unifican el editor de dibujo (`/animacion`) y el de eventos (`/evento`) en un solo editor con modos **Diseño / Animar** (como Rive o Spine), o siguen siendo dos páginas con la misma distribución? | Fase 0 y siguientes |
| P6 | Tamaño del documento o escena por defecto (ej. 1280×720) y si se configura por proyecto o por escena. | Fases 0 y 8 |

---

## Cómo actualizar este documento

- **Al empezar una fase:** revisar su alcance con lo aprendido, cerrar las preguntas abiertas que la afecten (y moverlas a *Decisiones*) y anotar en el título "— EN CURSO".
- **Al cerrarla:** cambiar a "— IMPLEMENTADA", agregar un párrafo **"Alcance realizado"** con lo que se hizo de verdad y por qué difiere del plan (si difiere), los commits, y marcar las verificaciones que se probaron. Las que no se probaron quedan sin marcar y se dice explícitamente.
- **Requerimiento nuevo:** si encaja en una fase, se agrega a su alcance; si no, va a *Pendientes*, o a una fase nueva con la plantilla de abajo.
- Actualizar la tabla de **Estado actual** cuando algo pase a estar implementado.

**Plantilla de fase:**

```markdown
## Fase N — <nombre>

**Objetivo:** <qué problema resuelve, en una o dos frases>

**Alcance:**
1. ...

**Fuera de alcance:** <lo que se deja a propósito para después>

**Verificación:**
- [ ] <prueba concreta, en simulador o navegador, con el resultado esperado>
```
