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
| D12 | **Bucle:** la ventana inicio–fin define cuánto dura; con `bucle`, el contenido se repite cada `tiempo_bucle` ms dentro de ella y al terminar se congela. Los desplazamientos se acumulan entre vueltas. La raíz (`EventoGeneral`) no hace bucle. | Separa "cuánto dura" de "cada cuánto se repite" y conserva el encadenamiento (D1). Acumular evita que un personaje que camina en bucle vuelva al punto de partida. |
| D13 | **Fotogramas clave en vez de recorridos (Fase 7):** el movimiento por la escena se hace con claves genéricas de propiedades de objeto (posición, rotación, escala, opacidad), no con una herramienta de caminos. | Es el mecanismo de todos los editores de animación y sirve para cualquier escenario, no solo para la ciudad. Un recorrido es un caso particular (claves de posición). |
| D10 | La selección y manipulación de objetos vive en la modalidad **Evento** (la que se abre por defecto), sin modalidad nueva; la modalidad Movimiento conserva sus controles (ex pregunta P3). | En la modalidad Evento el lienzo no hacía nada salvo panear; agregar un modo "Escena" separado sumaba un concepto sin necesidad. Se puede revisar en la Fase 3. |
| D11 | El desplazamiento propio de un grupo con transformación (sus movimientos "Objeto") se interpreta **en su marco**: escala y rotación se aplican también al vector de desplazamiento. | Sin esto, un perro reflejado miraba a la izquierda pero avanzaba a la derecha ("moonwalk"), y uno escalado al 60 % avanzaba lo mismo que el grande ("patinaba"). Encaja con D7. |
| D9 | El ancla de la transformación es, por defecto, el **centro inferior** del objeto ("los pies"); se guarda por instancia y se puede cambiar (ex pregunta P4). | Al escalar, un personaje sigue apoyado en el suelo. Propuesto en el plan y aceptado por el usuario al iniciar la Fase 1. |
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
- ~~El lienzo se refresca cada 100 ms y el motor escribe en consola en cada cuadro~~ → resuelto en la Fase 4 (60 cuadros por segundo).
- ~~En cada cuadro se clonan **todos** los grupos (`grupos_trabajo`)~~ → resuelto en la Fase 4 (copia al escribir).
- No hay bucle de eventos ni de movimientos (`bucle`/`tiempo_bucle` existen en el modelo pero no se usan).
- Las instancias son copias (D5) y entran **quietas**: el dibujo se copia, los eventos del asset no.
- `grupoFigurasSchema` (backend) es estricto: cualquier campo nuevo en un grupo (ej. `transformacion`) **Mongoose lo descarta al guardar** si no se agrega al schema.
- ~~Lienzo de tamaño fijo 600×600 con la línea de tiempo dentro del mismo canvas y el centro del zoom (`300`) escrito a mano~~ → resuelto en la Fase 0.A.

**Herramienta de prueba:** durante el desarrollo se usó un simulador en Node que corre el motor real (`GestionEvento`) sin navegador y dibuja cuadros clave a PNG. Hoy vive fuera del repo (en una carpeta temporal); ver la tarea T1 en Pendientes.

---

## Fase 0 — Interfaz de editor profesional (lienzo grande) — IMPLEMENTADA (0.A + 0.B; quedan dos pruebas de arrastre sin hacer)

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

### Avance 0.B — IMPLEMENTADA (2026-11-12)

**Alcance realizado:**
1. **Inspector** (`SeccionEventos/Inspector.js`): el panel derecho tiene dos pestañas, **Inspector** y **Biblioteca**; ambas quedan montadas y la elegida se recuerda.
   - El inspector muestra el evento seleccionado con sus secciones **Evento / Movimiento / Script / Macro** (los mismos `PanelEventos`, `PanelMovimientos` y `PanelScripts` de antes).
   - La sección activa sigue la modalidad global: elegir "Movimiento" pone el lienzo y el timeline en modo movimientos.
   - El panel izquierdo "Escena" conserva la selección de evento (Lista / Árbol / Nuevo) y las pestañas Eventos / Grupos / Config.
   - En el inspector, los formularios de dos columnas se apilan en una sola y no hay desplazamiento horizontal.
2. **Lista de pistas** en el timeline (`TimelineCanvas._dibujarPistas`): columna de 150 px con el nombre de cada barra, alineado con ella ("SUB-EVENTOS": Caminar, Sentarse; "MOVIMIENTOS": "1 · RotOsc"…; un movimiento inactivo muestra "(off)").
   - Las barras, la regla y la línea roja se dibujan desplazadas y recortadas a la derecha de la columna, y el mouse se convierte a esas coordenadas.
   - Si el panel mide menos de 420 px, la columna se oculta.
3. **Selección inicial:** al cargar se selecciona `EventoGeneral` en `config_evento` (la selección que leen los paneles y el lienzo; antes solo se guardaba en `state.evento`). Ya no aparece "Evento: Ninguno". La selección aparece igual en Escena, Inspector y timeline.
4. **HUD de depuración** del lienzo oculto por defecto (`ver_info_lienzo = false`): la barra de estado ya muestra esa información.
5. **Avisos de React de `Lienzo.js`** eliminados: ya no pasa props del componente al `<canvas>` y usa `autoFocus` / `tabIndex`.
6. **Arreglos del armazón:**
   - Un panel oculto quedaba ocupando su ancho (el estilo inline le ganaba a la clase `.sin-*`).
   - El lienzo ahora mantiene centrado lo que se veía cuando cambia de tamaño (al mostrar u ocultar un panel).
   - Botones `btn-outline-secondary` con más contraste en tema oscuro (parecían deshabilitados).
   - Encabezados de tabla `table-light` reemplazados para que sigan el tema.

**Verificado en el navegador:**
- [x] Al abrir: Escena "Evento: EventoGeneral", Inspector con sus propiedades, timeline con las pistas Caminar / Sentarse.
- [x] Elegir "Caminar" en la lista de eventos actualiza Escena, Inspector y timeline (duración 00:04.00, "Sin sub-eventos").
- [x] Inspector → Movimiento: el timeline pasa a "MOVIMIENTOS"; al elegir el grupo `pata_del_cercana` aparece la pista "1 · RotOsc" (0–4000) y el rectángulo de selección se dibuja sobre la pata con zoom al 47 %.
- [x] Al seleccionar el movimiento, su control (pivote en la cadera, círculo y flecha de amplitud) se dibuja alineado con la pata, también después de hacer zoom con la rueda (100 %).
- [x] Sin excepciones en la consola. Sin los avisos de `Lienzo.js`.
- [ ] Arrastrar el pivote o la flecha de un movimiento con zoom: no probado (solo se verificó que se dibujan en el lugar correcto).
- [ ] Arrastrar o estirar barras del timeline con la columna de pistas: no probado.

**Extra: cuadrícula como plano de coordenadas (2026-11-12, a pedido del usuario)** — `ConfiguracionLienzoEvento.dibujarGrilla` / `dibujarReglas`:
- Cuadrícula **infinita**: cubre todo lo visible, también la mesa de trabajo. Su densidad se adapta al zoom: paso 1, 2 o 5 × 10ⁿ con ≥10 px entre líneas, y principales cada 5 pasos.
- **Ejes** por el origen: X en rojo, Y en verde, rotulados "X →" e "Y ↓". Convención de pantalla: Y crece hacia abajo y el origen es la esquina superior izquierda del documento. Se decidió **no** invertir Y: obligaría a migrar los datos y los movimientos (gravedad, parabólico, LERP).
- **Reglas** numeradas arriba y a la izquierda, con el origen marcado y una marca de la posición del cursor. Los botones de zoom bajaron para no taparlas.
- Menú **Ver → Cuadrícula / Reglas**, recordado con el resto de la distribución.
- Se quitó la **hoja blanca** del documento: el lienzo es un único plano oscuro con la misma cuadrícula en todas partes. El área del documento (1280×720) queda indicada solo con un contorno punteado sutil.
- [x] Verificado en el navegador al 23 % y al 15 % de zoom.

**Extra: volver a mostrar paneles (2026-11-12, reportado por el usuario):** al ocultar un panel desaparecía su botón y la línea de tiempo no se podía plegar. Ahora hay tres formas de manejarlos:
- Tres botones fijos en la barra superior (izquierdo / línea de tiempo / derecho), resaltados si el panel está visible.
- Pestañas en el borde del lienzo ("Escena", "Inspector", "Línea de tiempo") cuando un panel está oculto.
- Botón ⌄ en la cabecera de la línea de tiempo para plegarla.
- [x] Verificado en el navegador: ocultar y reabrir los tres paneles.

**Queda pendiente (pasa a *Pendientes*):**
- Ajuste a la cuadrícula (*snap*) al mover cosas: cuando exista la manipulación de objetos (Fase 2).
- Con la ventana angosta (~980 px) los paneles laterales por defecto (320 + 320 px) dejan el lienzo muy chico: considerar anchos por defecto proporcionales a la ventana, o plegar un panel automáticamente.
- El menú Archivo perdió «Importar» (abría un modal que no existe en esta página), y también «Refrescar», «Guardar como» y «Deshacer/Rehacer», que no hacían nada. Reponerlos cuando tengan implementación.
- Avisos de React en otros componentes: `MenuLateral` (`href` inválido), `PanelEventos` (input controlado → no controlado), y en el editor de figuras del modo Dibujo (`SeleccionGrupo`, `TablaGrupos`, `ListaGrupos`, `PropiedadGrupoFiguras`).
- Sin sesión, `/evento/:id` muestra el error "Cannot read properties of undefined (reading 'token')" en vez de llevar al inicio de sesión (ya estaba en `Requerimientos.md`).
- `NavEditorEvento.js` quedó sin uso (la distribución vive en `EditorEvento.js`).

---

## Fase 1 — Transformación de instancia (no destructiva) — IMPLEMENTADA (falta probar guardar/recargar)

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

### Alcance realizado (2026-11-13)

1. **`Clases/EditorAnimacion/TransformacionInstancia.js`** (módulo compartido): `normalizarTransformacion`, `cadenaTransformaciones` (los ancestros con transformación de un grupo, del más externo al más interno; se componen si hay instancias dentro de instancias), `aplicarEnCanvas`, `transformarPunto` y su inversa `destransformarPunto` (para la Fase 2).
   - **Cambio respecto al plan:** la transformación no lleva `x`/`y`. La posición sigue siendo el `cx`/`cy` del contenedor, así los movimientos "Objeto" y el código existente lo siguen moviendo igual.
   - El ancla es relativa al origen del contenedor (`cx_solid`/`cy_solid`) y se mueve con él.
   - Rotación en grados, positiva = sentido horario en pantalla.
2. **Dibujo:** `ImprimirAnimacion.imprimirListaGrupos` hace `save` → aplica la cadena → dibuja el grupo (relleno y figuras) → `restore`. Lo usan tanto el editor de eventos como el de dibujo; sin transformaciones no cambia nada.
3. **`agregarInstanciaAnimacion`** crea el contenedor con `transformacion` neutra y el ancla en el centro inferior del objeto.
4. **Backend:** `transformacion` agregado a `grupoFigurasSchema` (`modelo/Animacion.js`; `Eventos` usa el mismo esquema).
5. **Solo en desarrollo:** `window.__editorEvento = {evento, lienzo}` (refs del editor) para probar desde la consola del navegador hasta que existan las manijas.

**Verificado:**
- [x] Navegador: el perro de la escena, metido en memoria en un contenedor con `escala 0.6`, camina (1,0 s) y se sienta (5,8 s) sin que se separen partes.
- [x] Navegador: `escala_x = -1` → mira **y avanza** hacia la izquierda (la cabeza pasa de ~125 a ~90 px entre 1,0 s y 3,5 s).
- [x] Navegador: `rotacion = 15` → el perro sentado gira entero, con la pose intacta.
- [x] La escena sin transformaciones se ve igual que antes.
- [x] Backend: los modelos `Animacion` y `Eventos` conservan `transformacion`; los grupos sin ella no cambian (probado con los modelos de Mongoose, sin escribir en la base).
- [x] Una instancia agregada nace con `transformacion` neutra y el ancla en los pies (ancla absoluta = punto donde se soltó, base del dibujo).
- [ ] Guardar con "Subir" y recargar en el navegador: no probado, para no escribir datos de prueba en la base del usuario.

**Limitaciones conocidas (se resuelven en la Fase 2):** el rectángulo de selección de grupo y los controles de los movimientos (pivote, flecha, elipse) todavía se dibujan **sin** la transformación del objeto: con un objeto escalado o rotado no coinciden con lo que se ve. La Fase 2 los pasa por `transformarPunto` / `destransformarPunto`.

---

## Fase 2 — Seleccionar y manipular objetos en el lienzo — IMPLEMENTADA (sin selección por rectángulo)

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

### Alcance realizado (2026-11-13)

**Decisiones:** D10 (dónde vive la edición de escena, ex P3) y D11 (desplazamiento en el marco del objeto), ver *Decisiones*.

1. **Motor** (`GestionEvento`): `objetosEscena` (grupos de primer nivel con figuras), `limitesObjeto`, `asegurarTransformacion` (los objetos dibujados a mano, como `perro`, reciben su transformación al manipularlos por primera vez, con el ancla en los pies), `cambiarTransformacion`, `fijarPosicionObjeto` / `moverObjeto`, `duplicarObjeto` (renombra el sub-árbol y lo desplaza 20, 20) y `eliminarObjeto`. Todo escribe en los grupos originales y en la copia en vivo.
2. **`ControlObjetosLienzo.js`** (nuevo):
   - Selección con clic sobre cualquier parte del objeto (el de más arriba primero); Shift+clic suma o quita; clic en el vacío deselecciona (y panea, como antes).
   - Rectángulo de selección **transformado** (gira y escala con el objeto), con 8 manijas, manija circular de rotación, cruz naranja en el ancla y el nombre del objeto.
   - Arrastres: interior = mover (todos los seleccionados); esquinas = escala proporcional (Shift: libre); lados = un eje; círculo = rotación (Shift: de a 15°). Arrastrar una manija más allá del ancla refleja.
   - Teclado: flechas 1 (Shift: 10), Supr/Retroceso, Ctrl+D, Esc.
3. **Inspector → Objeto** (`PanelObjeto.js`): al seleccionar un objeto, el Inspector cambia solo a esta vista: posición, rotación, escala X/Y, ancla, capa (editables, sincronizados con las manijas por sondeo cada 200 ms) y botones Espejo H/V, Restablecer, Duplicar y Borrar.
   - **Cambio respecto al plan:** la "barra flotante junto a la selección" se reemplazó por estos botones en el Inspector (siempre en el mismo lugar y sin tapar el dibujo).
4. **Limitación de la Fase 1 resuelta:** en la modalidad Movimiento, el rectángulo del grupo, los rectángulos de navegación de grupos y los controles de movimiento (pivote, flecha, elipse) se dibujan con la transformación del objeto, y el mouse se lleva a su espacio propio antes de tocarlos (`GestionLienzoEvento.conTransformacion` / `cadenaDeGrupo`). Además, el hit-test de navegación de grupos ya no fallaba con el lienzo paneado.
5. **Robustez de la entrada** (el lienzo procesa ~10 veces por segundo):
   - `Lienzo.js` guarda el punto exacto donde se presionó el botón (`mouse_down_x/y`), y los clics se evalúan ahí; si se presiona y suelta dentro del mismo cuadro, la operación igual se completa.
   - **Cola de pulsaciones** (`cola_teclas`): cada `keydown` se anota y se procesa en el cuadro siguiente; antes una pulsación rápida (< 100 ms) se perdía. La cola se vacía al final de cada cuadro aunque no se use.
   - En cada cuadro se procesa primero el ratón y después el teclado (clic en el perro + Ctrl+D en el mismo cuadro duplicaba "nada").
   - Ctrl+D no abre "agregar marcador" del navegador.

**Verificado en el navegador:**
- [x] Clic sobre el perro → rectángulo con manijas, círculo de rotación, ancla y nombre; el Inspector cambia a "Objeto".
- [x] Esquina inferior derecha → escala proporcional ×1,879 con los pies en la misma línea; el Inspector muestra los valores nuevos.
- [x] Círculo de rotación → 26,8°, con rectángulo y manijas girando junto al perro. Arrastrar el interior → mueve (517, 390).
- [x] Espejo H + Play → camina y se sienta reflejado y **avanza hacia donde mira** (gracias a D11).
- [x] Ctrl+D → `perro_1` desplazado y encima; Shift+→ ×6 lo mueve 60; Supr borra el seleccionado.
- [x] Modalidad Movimiento con el perro escalado ×1,6 y rotado 20°: el rectángulo de la pata y el control de su movimiento quedan alineados con la pata.
- [ ] Arrastrar el pivote/flecha de un movimiento de un objeto transformado: no probado (solo el dibujo).
- [ ] Editar los campos numéricos del Inspector y ver el cambio en el lienzo: no probado en el navegador.
- [ ] Guardar ("Subir") y recargar: no probado (para no escribir datos de prueba).

**No incluido (queda para después):** rectángulo de selección arrastrando sobre el vacío (hoy el arrastre en el vacío panea); escalar o rotar varios objetos alrededor de un centro común; ajuste a la cuadrícula al mover; deshacer.

---

## Fase 3 — Panel de objetos de la escena + entrar/salir de un objeto — IMPLEMENTADA

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

### Alcance realizado (2026-11-13)

1. **Panel "Objetos"** (`SeccionEventos/PanelObjetosEscena.js`): el panel izquierdo tiene pestañas **Objetos** (por defecto) y **Eventos** (el contenido anterior).
   - Cada fila: miniatura, nombre, cantidad de partes y botones Renombrar, Subir/Bajar capa, Visible y Bloquear. Arriba va lo que se dibuja adelante.
   - Clic = seleccionar (Shift suma); doble clic = entrar.
   - Migas "Escena › perro" arriba de la lista.
   - **Cambio respecto al plan:** el orden de capa se cambia con flechas ▲/▼, no arrastrando (más simple y sin ambigüedad).
2. **Entrar a un objeto** (`ControlObjetosLienzo.ruta`):
   - Con doble clic en el lienzo (evento nativo `dblclick`) o en la lista, lo seleccionable pasan a ser sus **partes** (grupos hijos con dibujo). Se mueven, escalan y rotan con las mismas manijas; sirve también para partes de partes.
   - Las operaciones sobre una parte se calculan en el espacio de su objeto padre, aunque esté rotado o escalado.
   - Lo que queda fuera se dibuja **atenuado** (25 %), con contorno naranja punteado del objeto activo y migas sobre el lienzo.
   - **Esc** deselecciona; si no hay selección, sale un nivel (y deja seleccionado el objeto del que se salió).
   - En Inspector → Movimiento, el árbol de grupos se limita al objeto activo.
3. **Bloqueado:** no se puede seleccionar en el lienzo. Se guarda como la clase `"bloqueado"` en `clases`, que ya existe en el esquema: **sin cambios en el backend**.
4. **Visibilidad heredada:** ocultar un grupo ahora oculta también a sus descendientes (antes solo al grupo).
5. **Motor:** `objetosEscena(padre)`, `limitesObjeto` y `asegurarTransformacion` calculan con el árbol completo (sirven para partes); `esVisible` / `fijarVisible`, `estaBloqueado` / `fijarBloqueado`, `moverCapa` (renumera las capas de los hermanos) y `renombrarObjeto` (actualiza hijos, eventos que lo referencian y movimientos). `duplicarObjeto` pone la copia encima de sus hermanos.
6. **Teclado:** las pulsaciones de la cola se procesan todas y en orden (dos Esc seguidos: deseleccionar y salir).

**Verificado en el navegador:**
- [x] Panel Objetos con el perro (miniatura, "7 partes").
- [x] Doble clic en el perro → migas, contorno naranja, la lista muestra sus 7 partes con miniaturas.
- [x] Dentro del perro: seleccionar y **rotar la cabeza** con su manija.
- [x] Ocultar la cola con el ojo → desaparece del lienzo y la fila se atenúa.
- [x] Esc, Esc → deselecciona y sale; el perro queda seleccionado en la escena.
- [x] Duplicar y entrar a la copia → el perro original se ve atenuado; las partes de la copia aparecen renombradas (`perro_1_cabeza`…).
- [x] Bloquear el perro → clic sobre él en el lienzo no lo selecciona.
- [x] Renombrar `perro_1` → `perro_chico` desde la lista; sus 7 partes siguen colgando de él.
- [ ] Escena con 10+ objetos: no probado (no hay tantos assets todavía).
- [ ] Movimientos de una parte en el timeline estando "dentro": no probado.
- [ ] Persistencia de visible/bloqueado al guardar y recargar: no probado (para no escribir datos de prueba).

---

## Fase 4 — Rendimiento base — IMPLEMENTADA

**Objetivo:** que la escena se mueva fluida antes de llenarla de objetos.

**Alcance:**
1. Bucle de dibujo con `requestAnimationFrame` en vez de `useInterval(…, 100)`.
2. Quitar o condicionar a un modo debug los `console.log` del motor que corren en cada cuadro.
3. Evitar clonar **todos** los grupos en cada cuadro: clonar solo los grupos con movimientos de figuras activos.
4. Medición: cuadros por segundo visibles en el HUD (modo debug).

**Verificación:**
- [ ] Escena con 20 perros: animación fluida (objetivo ≥ 50 cuadros por segundo en un equipo normal).
- [ ] Los resultados del simulador no cambian (mismas poses en los mismos instantes).

### Alcance realizado (2026-11-13)

1. **Bucle con `requestAnimationFrame`** (`EditorEvento.js`): reemplaza `useInterval(…, 100)`. Va sincronizado con la pantalla (~60 cuadros por segundo) y el navegador lo pausa con la pestaña oculta. Un error en un cuadro no detiene el bucle (se informa en consola, como máximo 5 veces).
2. **Logs por cuadro eliminados:** los dos `console.log` de `GestionMovimientos` que corrían en cada cuadro en Circular y Oscilatorio (este serializaba JSON en cada cuadro y lo usa la caminata). Los demás logs del motor ocurren solo ante acciones (cargar, reproducir…), no por cuadro.
3. **Copia al escribir en `grupos_trabajo`:** en cada cuadro se hace una copia superficial de los grupos; la lista de figuras de un grupo se clona recién cuando un movimiento de figuras la modifica. Las listas no clonadas se comparten con los originales; la copia en vivo no modifica sus figuras (verificado por búsqueda en el código).
4. **Consultas O(n²) → O(n) por cuadro:**
   - `GestionEvento._indice` (nombre → grupo, padre → hijos, "tiene figuras") para `subarbol` y `objetosEscena`.
   - Mapas por nombre en `procesandoEventos`, donde antes había `getGrupo` (recorrido lineal) por cada grupo.
   - `limitesObjeto` usa las posiciones absolutas que el dibujo ya calcula, sin clonar todos los grupos.
5. **Medición:** la barra de estado ya mostraba los cuadros por segundo (Fase 0); para medir el costo de cada cuadro se instrumentó `procesarEventoLienzo` desde la consola.

**Verificado (Chrome, reproduciendo, medido durante 3 s):**

| Escena | Cuadros por segundo | ms por cuadro (promedio / p95) |
|---|---|---|
| 1 perro | 60 | 3,6 / 7,5 |
| 20 perros (19 copias quietas) | 60 | 5,3 / 8,3 |
| **20 perros caminando** (180 movimientos activos, 221 grupos) | **60** | **7,8 / 13,9** |

- [x] Escena con 20 perros caminando: 60 cuadros por segundo (antes el tope era ~10 por el intervalo de 100 ms).
- [x] **Resultados idénticos:** con el simulador se corrió el motor de antes (commit `cbdd393`) y el nuevo, volcando todas las coordenadas de todas las figuras en 9 instantes, más una segunda visita a un instante ya calculado. Los dos volcados son byte a byte iguales, lo que confirma que compartir las listas no altera los originales.

**Queda para más adelante:**
- Objetos estáticos dibujados una sola vez en un canvas oculto (Fase 8).
- `ControlObjetosLienzo` sigue recorriendo los objetos en cada clic (no en cada cuadro), así que no afecta la fluidez.
- Con cientos de objetos convendría un índice espacial.

---

## Fase 5 — Bucle de eventos y movimientos — IMPLEMENTADA

**Objetivo:** que un ciclo (caminar 0,8 s, el parpadeo de un semáforo) se repita sin estirarlo a mano. Es imprescindible para una ciudad.

**Alcance:**
1. `bucle` + `tiempo_bucle` en movimientos: el tiempo del movimiento pasa a ser `t mod periodo`.
2. `bucle` en eventos: un evento en bucle repite su contenido mientras su padre esté activo.
3. Definir y documentar cómo interactúa con D1: un evento en bucle no se "congela", se repite hasta que termina su padre.

**Verificación:**
- [ ] "Caminar" con un solo ciclo de 0,8 s en bucle dentro de un evento de 10 s → camina los 10 s.
- [ ] Al pasar de una vuelta a la siguiente no hay saltos (con un ciclo que cierra en la misma pose).

### Alcance realizado (2026-11-13)

**Decisión D12 (semántica del bucle).** Cambia lo planteado en el punto 3 (un evento en bucle no se repite "hasta que termina su padre"):
- La ventana `[inicio, fin]` sigue diciendo **cuánto dura**.
- Con `bucle` y `tiempo_bucle` > 0, el contenido **se repite cada `tiempo_bucle` ms dentro de la ventana**, y al terminar la ventana queda congelado como cualquier evento (D1). Así se controla la duración total y el ciclo por separado, y se puede encadenar "Sentarse" después.
- Los **desplazamientos (Objeto) se acumulan** entre vueltas: cada vuelta sigue desde donde quedó la anterior. Las figuras se evalúan en el instante del ciclo en curso.
- `EventoGeneral` no hace bucle: es el rango de reproducción. Además, en los datos de ejemplo tiene `bucle` activo con 1200 ms.
- Justo al final de una vuelta se toma el final de esa vuelta, no el inicio de la siguiente (pose final congelada correcta).

1. **Motor** (`GestionEvento`):
   - `cicloBucle(t, bucle, tiempo_bucle)` → `{t en el ciclo, vueltas completas, periodo}`.
   - En `procesarNodoEvento`, los movimientos en bucle suman `vueltas × desplazamiento de un ciclo` y luego aplican el instante del ciclo; el periodo también se usa como duración (LERP se normaliza por vuelta).
   - Los sub-eventos en bucle obtienen el desplazamiento de un ciclo entero con `desplazamientosDe(evento, periodo)`, que evalúa el sub-árbol en modo "captura": solo desplazamientos, sin tocar figuras ni el estado del cuadro. Lo multiplican por las vueltas y luego procesan el ciclo en curso. Funciona anidado.
2. **Línea de tiempo:** las barras en bucle muestran "↻ N ms" y una marca punteada por cada vuelta.
3. **Formularios:** los campos "Bucle" y "Tiempo bucle (ms)" ya existían (evento y movimiento); se agregó una ayuda que explica la regla.

**Verificado:**
- [x] Simulador, variante A (**evento** "Caminar" en bucle de 800 ms, movimientos de 0 a 800 ms) y variante B (**movimientos** en bucle de 800 ms en una ventana de 10 s): resultados idénticos. El perro avanza de x = 300 a **x = 600** en 10 s (30 unidades/s), las patas siguen balanceándose en cada vuelta y después se sienta en x = 600.
- [x] Sin saltos entre vueltas: el máximo cambio de posición entre cuadros de 1/60 s es 1 unidad (el avance de 0,5 por cuadro, redondeado a enteros como ya hacía el motor).
- [x] Navegador: con la variante A en memoria, Play camina 10 s y se sienta en x ≈ 600; la barra muestra "Caminar 0–10000 ↻ 800 ms" con las marcas de cada vuelta.
- [ ] Activar el bucle desde el Inspector y guardar con "Subir": no probado en el navegador (las pruebas se hicieron en memoria para no tocar los datos).

---

## Fase 6 — Instancias por referencia + animación por instancia — IMPLEMENTADA (6A, 6B y 6C)

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

### Decisiones tomadas al empezar (2026-11-13)
- **P2 → opción A:** un asset es el **documento `Eventos` de un proyecto** (su dibujo + sus eventos "Caminar", "Sentarse"…). No hace falta un modelo nuevo: la escena elige cuál evento reproduce cada instancia.
- **P1 → última versión:** la instancia siempre usa lo último guardado del asset. Las versiones congeladas quedan para 6C.

### Alcance realizado — 6A (2026-11-13)
Diferencias con el plan: no se creó una lista `objetos` aparte. La instancia es un **grupo contenedor normal** de `grupos_figuras` con un campo nuevo, así siguen funcionando la selección, el panel Objetos, las transformaciones (Fase 1), la capa, la visibilidad y el bloqueo.

- **Modelo (backend):** campo `instancia: {id_eventos, evento, bucle, desfase}` en `grupoFigurasSchema` (`modelo/Animacion.js`). Solo se guarda el contenedor, nunca las partes del asset.
- **Carga del asset:** `GestionEvento._asset(id)` lo pide con `cargadorAssets` (GET `/api/evento/id/:id`, configurado en `EditorEvento.js`) y arma **un motor propio por asset**. Si falla, reintenta cada 5 s.
- **Partes virtuales:** `sincronizarInstancias()` inyecta los grupos del asset como `<contenedor>::<grupo>` con `_virtual: true` en las dos listas, y ignora las instancias anidadas. `gruposParaGuardar()` las excluye al Subir y al Exportar. Duplicar copia solo el contenedor.
- **Reproducción:** `aplicarInstancias(t_escena)` corre en cada cuadro.
  - El motor del asset evalúa el evento elegido con `evaluarEn(evento, t_escena − desfase, bucle)`, en contexto (D2). Con bucle, el desplazamiento se acumula por vuelta (D12).
  - La pose se comparte entre instancias con el mismo asset, evento, bucle e instante.
- **Biblioteca:** tiene una sección nueva, **Assets animados**: los documentos de eventos del proyecto, con miniatura. Se agregan arrastrando o con "Agregar al centro". La instancia queda centrada donde se suelta, con el ancla en los pies (D9).
- **Inspector → Objeto:** muestra el bloque "Instancia de …" con el evento que reproduce (lista de eventos del asset), el desfase (ms), el interruptor Repetir y el estado de carga o error.
- **Panel Objetos:** muestra un ícono de enlace y "asset · evento". No se puede "entrar" a una instancia, ni con doble clic ni desde el lienzo.

**Verificado en el navegador** (con el propio documento del perro como asset, sin guardar):
- [x] Las instancias se agregan desde la Biblioteca (botón) y por motor. Caminan sincronizadas con el perro original.
- [x] Semántica de los tiempos:
  - EventoGeneral camina 300→420 y se sienta;
  - en bucle, la siguiente vuelta sigue desde 420;
  - un desfase de 2 s espera en la pose inicial y luego va 2 s atrasado;
  - Caminar en bucle avanza sin parar; sin bucle se congela al final;
  - Sentarse arranca en contexto, ya caminado.
- [x] Lo que se guarda tiene solo el contenedor (13 grupos = 12 + 1, sin campos `_`). Un motor nuevo construido con esos datos reconstruye la instancia en la misma posición (586, 145).
- [x] Si la carga del asset falla, se recupera solo al reintentar.
- [x] **Subir y recargar de verdad**, hecho en la 6B sobre copias temporales del documento del perro, borradas al terminar. El original no se tocó.
- [x] Asset de **otro documento**: una instancia en la copia A apunta a la copia B. Al cambiar el color del cuerpo en B, la instancia de A sale azul al recargar. **La propagación funciona.**
- [ ] No probado: **arrastrar** la tarjeta del asset al lienzo; usa el mismo camino que el botón.
- [ ] No probado: tres perros con desfases distintos **a la vista**; sí se probó por motor.

### Alcance realizado — 6B (2026-11-13)
- **Desvincular:** `GestionEvento.desvincularInstancia(nombre)` y botón en Inspector → Objeto, con confirmación.
  - Las partes virtuales pasan a ser grupos reales `<contenedor>_<grupo>`, en la pose de reposo, y se quita `instancia`.
  - La copia queda quieta: los eventos del asset no se copian, porque referencian grupos por nombre de otro documento.
- **Nombre del asset:** se guarda en `instancia.nombre` (campo nuevo también en el backend) y se muestra con `nombreAsset(grupo)`.
  - Formato: el proyecto, más el documento si el proyecto tiene varios.
  - El objeto en escena se llama como el proyecto (`animacion1_1`).
  - Las instancias viejas sin `nombre` muestran el del documento.
- **Elegir el evento al agregar:** selector en cada tarjeta de asset; el paquete de arrastre lleva `evento`.
- **Miniatura animada:** con el mouse encima, la tarjeta reproduce en bucle el evento elegido.
  - Usa un motor propio y `evaluarEn`.
  - `dibujarMiniatura(canvas, grupos, margen, encuadre)` fija la escala con la pose de reposo para que no "respire" y sigue al dibujo en X (camina en el lugar).
- **Corrección en `evaluarEn` (bucle de assets):**
  - Antes, por cada vuelta se acumulaba el desplazamiento de **todos** los grupos, incluidos los que mueven la cola y las patas para sentarse. En la segunda vuelta de EventoGeneral el perro salía desarmado.
  - Ahora solo se acumula el de los grupos de **primer nivel** (el objeto entero avanza); las partes vuelven a su pose en cada vuelta.
  - Esto afecta solo a las instancias. El bucle de eventos del editor (Fase 5, D12) no cambia.
- **Desarrollo:** `window.__miniatura` (solo en desarrollo) expone las funciones de miniatura para probar desde la consola.

**Verificado en el navegador**, sobre copias temporales:
- [x] Subir guarda solo el contenedor, con evento, desfase, escala y `nombre`; al recargar la instancia vuelve igual.
- [x] El cambio en el asset se propaga.
- [x] Tarjeta con "Sentarse" elegido → la instancia reproduce Sentarse.
- [x] Las miniaturas en t = 0…14 s son correctas tras la corrección del bucle; la miniatura se anima al pasar el mouse.
- [x] Desvincular deja 12 grupos reales y ninguno virtual; se puede entrar a sus partes; se guarda y se recarga como copia.
- Nota: durante las pruebas Chrome entregaba ~1–2 cuadros por segundo con la ventana en segundo plano. El hilo principal estaba libre (~5 ms) y el motor tarda 0,7 ms por cuadro, así que no es un problema del editor.

### Alcance realizado — 6C (2026-11-13)
- **Versiones congeladas (backend):**
  - colección nueva `versiones_eventos` (`modelo/VersionEventos.js`) con `{id_eventos, numero, descripcion, fecha_creacion, contenido}`; `contenido` es la foto del documento como `Mixed`;
  - rutas `GET` / `POST /api/evento/id/:id/versiones` y `GET /api/evento/version/:id_version`, documentadas en el README del backend;
  - campo `instancia.version` en el schema del grupo.
- **Motor:**
  - el caché de assets usa la clave `id` o `id@version`, y `cargadorAssets(id, version)`;
  - `recargarAssets()` vuelve a pedir los assets que siguen "la última"; las versiones no cambian. La instancia sigue mostrando lo que tenía mientras carga, y al llegar `rev++` cambia la firma y se reinyectan las partes;
  - el caché de poses incluye la versión.
- **Inspector → Objeto**, en el bloque de instancia:
  - selector **Versión del asset**: "Última (se actualiza sola)" o v1, v2…;
  - **Fijar actual**: crea una versión con lo guardado ahora y fija la instancia en ella;
  - **Abrir para editar**: abre `/evento/<id>` en otra pestaña;
  - **Recargar**.
- **Recarga automática:** al volver a la pestaña (`focus` / `visibilitychange`, como mucho cada 2 s) el editor recarga los assets que siguen la última versión. Así, se edita el asset en otra pestaña, se hace Subir, se vuelve y la escena ya está al día.
- **Panel Objetos:** las instancias fijadas muestran "· vN".
- **Corrección:** al cambiar la versión, la instancia se quedaba sin partes un momento y el control la sacaba de la selección. Ahora una instancia sigue seleccionada mientras su asset carga.

**Verificado en el navegador**, sobre copias temporales A (escena) y B (asset), borradas al terminar junto con sus versiones; el original no se tocó:
- [x] "Fijar actual" crea v1, v2… y la selección se mantiene.
- [x] Cuerpo de B a rojo + Recargar → la instancia "última" se pone roja y la fijada sigue café.
- [x] Cuerpo de B a verde + volver a la pestaña → la "última" se pone verde sola.
- [x] Subir + recargar: `instancia.version` se guarda y la fijada se ve igual.
- [ ] No probado: el botón "Abrir para editar" (abre una pestaña nueva). Arma la URL `/evento/<id_eventos>`, la misma de la lista de proyectos.

**Fuera de alcance (backlog):** borrar versiones viejas, ponerles descripción desde la interfaz y comprobar el dueño del documento en las rutas. Las rutas existentes tampoco lo comprueban.

---

## Fase 7 — Fotogramas clave (keyframes) de propiedades de objeto — IMPLEMENTADA (7A, 7B y 7C)

**Cambio de enfoque (2026-11-13, D13):** el plan original era "recorridos" (caminos para que personajes y autos recorran la escena). Se descartó por demasiado específico. En su lugar va el mecanismo general de todos los editores de animación (After Effects, Rive, Spine, Flash): **fotogramas clave** sobre propiedades de cualquier objeto. Un recorrido es solo claves de posición; una puerta que se abre, claves de rotación; algo que aparece, claves de opacidad.

**Objetivo:** animar cualquier propiedad de cualquier objeto (posición, rotación, escala, opacidad) marcando su valor en instantes de la línea de tiempo; el editor calcula lo de en medio.

**Modelo:**
- `grupo.claves = {x:[{t, v, interp}], y, rotacion, escala_x, escala_y, opacidad}`, con `t` en ms de escena (reloj de EventoGeneral);
- `grupo.opacidad` es el valor base (0..1);
- interpolaciones: lineal, suave, acelera, frena, mantener (salto).

**Edición (estilo cronómetro de After Effects):**
- la propiedad sin claves se edita como siempre;
- el rombo ◆ crea su primera clave;
- desde ahí, cualquier cambio de esa propiedad (campo numérico, arrastrar, manijas, espejo) crea o ajusta la clave del instante actual.

**Partes:**
- **7A:** modelo, motor, Inspector con rombos, fila de claves en la línea de tiempo (ver, ir a, mover). *Hecha.*
- **7B:** bucle de claves por objeto (repetir cada N ms, para el auto que da vueltas) y selección múltiple, copiar y pegar y borrar claves en la línea de tiempo.
- **7C:** claves en las partes de un objeto al "entrar" (cabeza que gira); hoy funciona por motor pero falta revisarlo con la interfaz. Y una curva de trayectoria visible en el lienzo para las claves de posición.

### Alcance realizado — 7A (2026-11-13)
- **`Clases/EditorEvento/Claves.js`** (nuevo, funciones puras): `PROPIEDADES`, `INTERPOLACIONES`, `valorEn` (búsqueda binaria + curva), `ponerClave`, `quitarClave`, `moverClave`, `indiceClave`, `instantesConClaves`.
- **Motor (`GestionEvento`):**
  - `_aplicarClaves(t_ms)` en cada cuadro, después de `_volcarCuadro`, sobre la copia en vivo. La posición con claves reemplaza la base y conserva el desplazamiento de los movimientos del cuadro (en el marco del objeto, D11).
  - API: `valorPropiedad`, `tieneClaves`, `ponerClave`, `quitarClave`, `alternarClave`, `quitarPista`, `claveEn`, `clavesDe`, `moverClaves`, `cambiarInterpolacion`, `fijarOpacidad`, `tiempoActualMs`.
  - `posicionObjeto`, `fijarPosicionObjeto` y `cambiarTransformacion` respetan las claves. Por eso el arrastre, las manijas, las flechas y el espejo funcionan sin cambios.
  - Las instancias aplican también las claves de su asset (`evaluarEn` devuelve transformación y opacidad).
- **Render:** opacidad heredada (producto con los ancestros) en `ImprimirAnimacion`; con opacidad ≈ 0 el grupo no se dibuja.
- **Inspector → Objeto:**
  - rombo por propiedad: gris sin claves, contorno con pista, relleno con clave en el instante;
  - campo Opacidad nuevo;
  - fila "Clave en N s · hacia la siguiente: [interpolación]";
  - los campos muestran el valor del instante actual.
- **Línea de tiempo:** fila "◆ objeto" al pie con las claves del objeto seleccionado (en tiempo de escena convertido al eje del evento que se reproduce). Clic en un rombo lleva el cursor a ese instante; arrastrarlo mueve las claves de ese instante (pasos de 10 ms).
- **Backend:** `claves` (Mixed) y `opacidad` en `grupoFigurasSchema`.

**Verificado en el navegador** (en memoria sobre el original; guardado en una copia temporal, borrada):
- [x] Interpolación: y 300→100→300 y opacidad 1→0 en los instantes esperados.
- [x] Rombo de "Posición Y" en 0 s; en 2 s, arrastrar el perro en el lienzo crea sola la clave `y@2000` y no toca la base.
- [x] Arrastrar el rombo de 2 s a 3 s en la línea de tiempo.
- [x] En 0,75 s el perro está a medio camino (y = 210, rotación −12,5°) y las manijas siguen la rotación. En 1,5 s aparecen los rombos llenos y la fila de interpolación.
- [x] Subir + recargar conserva claves e interpolaciones.
- [ ] No probado con la interfaz: claves en una parte de un objeto ("entrar") y en instancias de assets con claves propias.

### Alcance realizado — 7B (2026-11-13)
- **Bucle de claves por objeto** (`grupo.claves_bucle`, también en el backend). Define qué hace el objeto después de su última clave:
  - **quedarse** (por defecto);
  - **repetir**;
  - **ir y volver**;
  - **continuar**: repite sumando lo avanzado en posición y rotación por vuelta, para alguien que sigue caminando.

  El tramo que se repite va de la primera a la última clave del objeto, contando todas sus propiedades, para que se mantengan sincronizadas.
  - Funciones puras en `Claves.js`: `MODOS_BUCLE`, `tramoClaves`, `tiempoEnBucle`, `valorObjeto`.
  - El motor las usa en `valorPropiedad` y `_aplicarClaves`.
- **Inspector:** selector "Después de la última clave" (aparece cuando el objeto tiene al menos dos instantes con claves).
- **Línea de tiempo:**
  - rombos "fantasma" (contorno tenue) donde se repiten las claves, y fondo tenue después del tramo;
  - **clic** selecciona el instante y lleva el cursor; **Shift + clic** agrega o quita de la selección; **arrastrar** mueve todos los seleccionados juntos (`desplazarInstantes`, sin pasar de 0);
  - el timeline toma el foco al hacer clic y tiene atajos propios, que no chocan con los del lienzo: **Supr** borra las claves seleccionadas (no el objeto), **Ctrl + C / Ctrl + V** copian y pegan en el cursor, también en **otro** objeto (`copiarClaves` / `pegarClaves`), **Ctrl + A** selecciona todas y **Esc** deselecciona.

**Verificado en el navegador** (en memoria; guardado en una copia temporal, borrada):
- [x] Los cuatro modos dan los valores esperados en varias vueltas. Con x 300 → 600 en 0–2 s, a los 4,5 s: quedarse 600, repetir 375, ir y volver 375, continuar 975.
- [x] Rombos fantasma cada vuelta; en 2,5 s el perro está en la segunda vuelta.
- [x] Shift + clic en dos claves y arrastre: las dos se mueven 1 s juntas.
- [x] Ctrl + C en "perro", Ctrl + V en "perro_1" con el cursor en 4 s: quedan las claves en 4 y 5 s. Supr las borra y el objeto sigue existiendo.
- [x] `claves_bucle` se guarda con Subir.

### Alcance realizado — 7C (2026-11-13)
- **Trayectoria en el lienzo** (`ControlObjetosLienzo.trayectoria` / `_dibujarTrayectoria`). Con un objeto seleccionado que tiene claves de posición se dibuja:
  - la línea punteada del camino del **ancla** (los pies) entre su primera y su última clave de posición, muestreada cada 25 ms;
  - un rombo por clave con su instante ("1.5s"); el del instante actual, en blanco.

  Se calcula en el espacio del padre (origen del padre + posición + ancla) y se lleva al dibujo con la cadena del padre, así que funciona también con partes de un objeto transformado. No incluye el desplazamiento de los movimientos de eventos, que se suma encima.
- **Editar el camino en el lienzo:** arrastrar un rombo de la trayectoria cambia las claves x e y de **ese** instante (arrastre `clave_pos`), sin mover el cursor de tiempo. Tiene prioridad sobre las manijas.
- **Selección por rectángulo** en la fila de claves: arrastrar desde un espacio vacío selecciona los rombos abarcados; con Shift los agrega. Un clic en vacío deselecciona.

**Verificado en el navegador** (en memoria, sin guardar):
- [x] La trayectoria se dibuja con los rombos 0,0 / 1,5 / 3,0 s.
- [x] Arrastrar el rombo de 3,0 s cambia `y@3000` (350 → 538) con el cursor quieto en 0,8 s.
- [x] El rectángulo de 200 a 470 px selecciona las claves de 1,5 y 3 s.
- [x] **Partes:** entrar al perro, seleccionar "cabeza", rombo de Rotación en 0 s, ir a 1 s y escribir 30 → clave `rotacion@1000 = 30`, cabeza girada, fila "◆ cabeza" en la línea de tiempo.
- [x] **Assets con claves propias:** con claves de rotación y opacidad en el motor del asset, la instancia las reproduce (rotación 0 / −20 / −40, opacidad 1 / 0,65 / 0,3 en 0, 1 y 2 s).

**Verificación original de la fase** ("un perro chico y uno grande recorren la misma vereda", "un auto da vueltas"): ya se puede armar con claves de posición en instancias escaladas y "Repetir". Falta un asset de auto para probar lo segundo.

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

**Interfaz (restos de la Fase 0)**
- Reponer en Archivo «Importar», «Refrescar», «Guardar como», «Deshacer/Rehacer» cuando tengan implementación.
- Avisos de React en `MenuLateral`, `PanelEventos` y el editor de figuras (ver Avance 0.B).
- Sin sesión, `/evento/:id` falla en vez de redirigir al inicio de sesión.

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
| P1 | ~~¿Versión congelada o la última?~~ **Respondida:** por defecto la última; cada instancia se puede fijar a una versión (6C). | Fase 6 |
| P2 | ~~¿Dónde viven los eventos de un asset?~~ **Respondida:** en el documento `Eventos` del proyecto (opción A). | Fase 6 |
| P5 | ¿Se unifican el editor de dibujo (`/animacion`) y el de eventos (`/evento`) en un solo editor con modos **Diseño / Animar** (como Rive o Spine), o siguen siendo dos páginas con la misma distribución? | Fase 0 y siguientes |
| P6 | Tamaño del documento o escena por defecto (ej. 1280×720) y si se configura por proyecto o por escena. | Fases 0 y 8 |

---

## Cómo actualizar este documento

- **Al empezar una fase:** revisar su alcance con lo aprendido, cerrar las preguntas abiertas que la afecten (y moverlas a *Decisiones*) y anotar en el título "— EN CURSO".
- **Al cerrarla:** cambiar a "— IMPLEMENTADA", agregar un párrafo **"Alcance realizado"** con lo que se hizo de verdad y por qué difiere del plan (si difiere), los commits, y marcar las verificaciones que se probaron. Las que no se probaron quedan sin marcar y se dice explícitamente.
- **Requerimiento nuevo:** si encaja en una fase, se agrega a su alcance; si no, va a *Pendientes*, o a una fase nueva con la plantilla de abajo.
- Actualizar la tabla de **Estado actual** cuando algo pase a estar implementado.
- **Manual de uso (`Manual.md`):** al cerrar una fase (o agregar cualquier función visible), sumar una entrada en **Novedades** y actualizar la sección correspondiente y las **Limitaciones conocidas**. El manual es para quien anima; este documento, para quien desarrolla.

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
