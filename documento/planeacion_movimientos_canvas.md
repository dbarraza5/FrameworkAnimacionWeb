# Planeación: interacción en el lienzo para movimientos de eventos

Fecha de la auditoría: 2026-08-17
Alcance: editor de eventos (`/evento/:id`), modalidad "Movimientos" (`GestionLienzoEvento.js`, `GestionMovimientos.js`, `OperacionesGrupo.js`, `Fisica.js`, formularios en `SeccionEventos/Movimientos/`).

Este documento está organizado en **fases secuenciales**. Cada fase tiene alcance cerrado y una checklist de verificación manual, para poder darla por terminada antes de pasar a la siguiente.

## 1. Estado actual (auditoría)

De los 10 tipos de movimiento definidos en `ConstanteEvento.js`, solo **2 tienen interacción en el lienzo**: Rotación (ya existía) y Circular (agregado en la sesión anterior). Los otros 8 solo se editan por formulario numérico, sin overlay ni arrastre con mouse.

| # | Tipo (`ConstanteEvento.js`) | Familia | `tipo_efecto` | Cálculo implementado | Interacción en lienzo | Campos de `datos` | Notas |
|---|---|---|---|---|---|---|---|
| 1 | `MOV_RECTILINEO_UNIFORME` (MRU) | Objetos | 1 | Sí | No | `velocidad` | Solo mueve en eje X, sin dirección configurable. |
| 2 | `MOV_RECTILINEO_ACELERADO` (MRUA) | Objetos | 1 | **Roto** | No | `velocidad`, `aceleracion` | `GestionMovimientos.js` lee `datos.v0`/`datos.a`, pero `FormularioMRUA` guarda `datos.velocidad`/`datos.aceleracion`. Nunca coinciden → el movimiento no hace nada (NaN). |
| 3 | `MOV_RECTILINEO_2D` | Objetos | 1 | Sí | No | `vx`, `vy` |  |
| 4 | `MOV_CIRCULAR` | Objetos | 1 | Sí | **Sí** | `pivote_x`, `pivote_y`, `velocidad_angular`, `sentido` | Implementado reutilizando el patrón de Rotación. |
| 5 | `MOV_OSCILATORIO` | Objetos | 1 | Sí | No | `amplitudX`, `frecuenciaX`, `amplitudY`, `frecuenciaY` | 4 parámetros, más complejo de representar. |
| 6 | `MOV_LERP` | Objetos | 1 | **Parcial** | No | `inicio`, `fin` | Solo interpola en X. Usa `tiempo` en segundos absolutos (no normalizado 0–1 respecto a la duración del movimiento), así que salvo que `inicio`/`fin` estén pre-escalados a la duración real, nunca llega a "fin". |
| 7 | `MOV_GRAVEDAD` | Objetos | 1 | Sí | No | `v0y`, `g` | Solo eje Y. |
| 8 | `MOV_PARABOLICO_ANGULO` | Objetos | 1 | Sí | No | `velocidadInicial`, `angulo`, `g` |  |
| 9 | `MOV_ROTACION` | Figuras | 2 | Sí | **Sí** | `pivoteX`, `pivoteY`, `velAngular`, `sentido` | Patrón de referencia (ya existía). |
| 10 | `MOV_ZOOM` | Figuras | 2 | **No implementado** | No | `velocidad`, `pivoteX`, `pivoteY` | `GestionMovimientos.movimientoFiguras` solo tiene rama para `MOV_ROTACION`; Zoom no hace nada al reproducir. Es un hueco más grande que "falta canvas": falta el cálculo mismo. |

## 2. El patrón base ya validado (Rotación / Circular)

`GestionLienzoEvento.js` ya resuelve, para movimientos de tipo "pivote + velocidad angular":

- Dos banderas de estado: `edicion_mov_rotacion_pivote`, `edicion_mov_rotacion_velocidad`.
- `calcularLargoFlecha(vel_angular)`: escala + largo mínimo/máximo para que la flecha sea visible y clickeable en cualquier rango de velocidad.
- Dibujo (`imprimiendoMovimientosObjeto`): línea punteada centro→pivote, círculo de trayectoria, punto de pivote, flecha de velocidad con color distinto mientras se edita.
- Interacción (`procesoEdicionMovimientos`): click cerca del pivote → modo "mover pivote"; click en la punta de la flecha → modo "editar velocidad"; siguiente click guarda y sale del modo edición.

**Advertencia de nombres:** las banderas y el método siguen llamándose `..._rotacion_...` aunque ya cubren Circular también. Esto se resuelve en la Fase 1.

---

## Fase 0 — Corregir deuda técnica que bloquea resultados reales (sin canvas) — IMPLEMENTADA

**Objetivo:** que los movimientos que se van a recibir overlay en fases siguientes funcionen correctamente al reproducir, antes de invertir tiempo en dibujarlos. Ninguna de estas tareas toca el lienzo.

**Alcance realizado:**
1. **MRUA**: `GestionMovimientos.movimientoGrupo` ahora lee `datos.velocidad`/`datos.aceleracion` (antes leía `datos.v0`/`datos.a`, que no existían).
2. **Zoom**: se agregó `if(tipo === MOV_ZOOM)` en `GestionMovimientos.movimientoFiguras`, más `OperacionesGrupo.calcularZoomFigura`/`calcularZoomGrupoFiguras` (mismo patrón estructural que `calcularRotacionFigura`/`calcularRotacionGrupoFiguras`, pero escalando la distancia de cada punto al pivote en vez de rotarla). **Nota importante:** el pipeline de aplicación (`GestionEvento.procesandoEventos`) solo aplica `cx`/`cy` y `x1`/`y1`/`x2`/`y2`, no `radiox`/`radioy` — así que el zoom se ve alejando/acercando cada punto de cada figura respecto al pivote (efecto visual de crecer/encoger el grupo compuesto), no cambiando el radio individual de un `CIRCULO`. Si se necesita que un `CIRCULO` suelto también cambie de radio, hace falta extender `procesandoEventos` (fuera del alcance de esta fase).
3. **LERP**: decisión tomada → **extender a 2D + tiempo normalizado**. Se implementó:
   - `FormularioLerp.js` ahora pide `inicio_x`/`inicio_y`/`fin_x`/`fin_y` en vez de `inicio`/`fin`.
   - `GestionMovimientos.movimientoGrupo` recibe un nuevo parámetro `duracion` y normaliza `tiempo/duracion` (acotado a [0,1]) antes de interpolar, para que siempre llegue al punto final sin importar cuánto dure el movimiento.
   - `GestionEvento.js` calcula `duracion_mov = tiempo_fin_mov - tiempo_inicio_mov` y la pasa en la llamada.

**Criterios de verificación (pendientes de probar en navegador):**
- [ ] Agregar un movimiento MRUA a un grupo, darle Play, y confirmar que el grupo se traslada (ya no queda estático por `NaN`).
- [ ] Agregar un movimiento Zoom a un grupo, darle Play, y confirmar que las figuras internas se alejan/acercan del pivote configurado.
- [ ] Agregar un movimiento LERP con un punto de inicio y uno final distintos, darle Play, y confirmar que el grupo llega efectivamente al punto final al terminar la ventana de tiempo del movimiento (no se queda a medio camino).

---

## Fase 1 — Refactor: generalizar el patrón pivote/flecha — IMPLEMENTADA

**Objetivo:** evitar repetir a mano la lógica de dibujo/interacción (~90 líneas) por cada tipo nuevo, como ya pasó entre Rotación y Circular.

**Alcance realizado:**
- Se creó `ControlVectorLienzo.js`: clase reutilizable que resuelve lectura de `datos` (`leerVector`), largo de flecha con mínimo/máximo (`calcularLargoFlecha`), detección de click y arrastre (`procesarInteraccion`) y el dibujo completo (`dibujar`), configurable por nombres de campo (`configurar({campo_pivote_x, campo_pivote_y, campo_velocidad})`).
- `GestionLienzoEvento.js` quedó reducido de ~467 a ~292 líneas: los dos bloques `if(tipo === MOV_ROTACION || tipo === MOV_CIRCULAR)` (uno en `procesoEdicionMovimientos`, otro en `imprimiendoMovimientosObjeto`) se reemplazaron por un mapa `CAMPOS_VECTOR_POR_TIPO` + una instancia compartida `this.control_vector`.
- **Deferido a propósito:** "origen fijo vs. pivote arrastrable" y "flecha libre en 360°" (mencionados en el alcance original) **no se implementaron todavía** — hoy solo hay dos consumidores (Rotación, Circular) y ambos usan pivote arrastrable + flecha restringida a X, así que agregar esos modos ahora sería código sin nada real que lo ejercite. Quedan para cuando la Fase 2 los necesite (Parabólico y MRU 2D sí requieren flecha libre 360°), implementados contra un caso de uso real en vez de adivinados.

**Criterios de verificación (pendientes de probar en navegador):**
- [ ] Rotación sigue funcionando exactamente igual que antes de la migración (mismo click de pivote, misma flecha, mismos datos guardados).
- [ ] Circular sigue funcionando exactamente igual que antes de la migración.
- [x] Ningún `if(tipo === MOV_X)` de más de ~10 líneas queda duplicado entre Rotación y Circular en `GestionLienzoEvento.js` — verificado por inspección del archivo.

---

## Fase 2 — Movimientos de flecha simple (Parabólico, MRU 2D, Gravedad, MRU, MRUA) — IMPLEMENTADA

**Objetivo:** cubrir los movimientos que encajan directamente en el patrón de "flecha arrastrable" de la Fase 1, sin requerir cambios de modelo de datos.

**Alcance realizado:** estos 5 tipos no tienen pivote propio (el origen siempre es el centro del grupo) y dos de ellos (Parabólico, MRU 2D) necesitan una flecha libre en 360°, algo que `ControlVectorLienzo` no resolvía (fue construido para "pivote + flecha-medidor siempre horizontal"). Se creó una segunda clase, `ControlFlechaLienzo.js`, con origen fijo y una flecha que se arrastra directamente en cualquier dirección (o restringida a un eje). Se configura con `leerVector`/`guardarVector`, que traducen entre las unidades propias del tipo y un vector `{x,y}` genérico — necesario porque Parabólico no guarda cartesianas sino polares (`velocidadInicial` + `angulo`).

| Tipo | Interacción implementada | Restricción de eje |
|---|---|---|
| Parabólico (8) | Flecha libre: la punta define `velocidadInicial` (magnitud) y `angulo` a la vez, convirtiendo polar↔cartesiano en `leerVector`/`guardarVector`. | Ninguna (360°) |
| MRU 2D (3) | Flecha libre: la punta define `vx`/`vy` directamente (cartesiano, sin conversión). | Ninguna (360°) |
| Gravedad (7) | Flecha para `v0y`. | Restringida al eje Y |
| MRU (1) | Flecha para `velocidad`. | Restringida al eje X |
| MRUA (2) | Flecha para `velocidad` (velocidad inicial); `aceleracion` se mantiene como input numérico, sin control en el lienzo. | Restringida al eje X |

`GestionLienzoEvento.js` ahora arma `campos_vector` (Fase 1) o `config_flecha` (Fase 2) según el `tipo` del movimiento seleccionado y delega en el control correspondiente — ningún `if(tipo === MOV_X)` nuevo quedó embebido en el archivo, solo entradas en los mapas `CAMPOS_VECTOR_POR_TIPO`/`CONFIG_FLECHA_POR_TIPO`.

**Extra agregado (fuera del alcance original de la fase, pedido después):** para Parabólico, `ControlFlechaLienzo` ahora acepta un `calcularTrayectoria(vector, datos, duracion)` opcional que dibuja la curva real del lanzamiento (no solo la flecha de dirección/magnitud), usando la misma fórmula que `GestionMovimientos.movParabolicoAngulo`. Se actualiza en vivo mientras se arrastra la flecha, y usa la duración real del movimiento (`tiempo_final - tiempo_inicio`) como ventana de la curva. Ningún otro tipo de esta fase la usa (no aplica a MRU 2D, que es rectilíneo).

**Criterios de verificación (pendientes de probar en navegador, repetir por cada tipo de esta fase):**
- [ ] Al seleccionar un movimiento de este tipo, aparece la flecha desde el centro del grupo.
- [ ] Arrastrar la punta de la flecha actualiza el campo correcto en `datos` (verificar en el modal de edición que el valor cambió).
- [ ] Para Parabólico en particular: arrastrar la flecha hacia arriba-derecha debe dar un `angulo` positivo razonable y `velocidadInicial` acorde a lo largo que se arrastró.
- [ ] Los valores guardados por arrastre coinciden con lo que se ve reflejado al reproducir la animación.
- [ ] No se rompió el overlay de Rotación/Circular al agregar los tipos nuevos (no-regresión).

---

## Fase 3 — Zoom: overlay radial — IMPLEMENTADA

**Objetivo:** dar interacción visual a Zoom, ya con el cálculo real resuelto en la Fase 0.

**Alcance realizado:**
- Nuevo `ControlZoomLienzo.js`: mismo mecanismo de pivote arrastrable que `ControlVectorLienzo` (click a ≤5px del pivote → arrastrar → siguiente click guarda `pivoteX`/`pivoteY`), pero sin flecha de velocidad — la velocidad de zoom se sigue editando solo por formulario, no se arrastra (así estaba definido en el alcance original).
- Dibuja: línea punteada centro→pivote, círculo de "radio actual" (distancia pivote↔centro del grupo, sólido) y círculo de "radio proyectado" (punteado, en un color distinto) calculado con la misma fórmula que usa `GestionMovimientos.js` para aplicar el zoom real (`porcentaje = velocidad × tiempo`), fijando `tiempo_preview = 1` segundo como referencia visual de "qué tan rápido crece". Si `velocidad` es 0 no se dibuja el círculo proyectado (nada que previsualizar).
- Se agregó `resolverControl(tipo)` en `GestionLienzoEvento.js`, que reemplaza el ternario anidado de la Fase 2 por una cadena de `if` clara entre los 3 controles ahora existentes (vector, flecha, zoom).

**Criterios de verificación (pendientes de probar en navegador):**
- [ ] Aparece el pivote y los círculos concéntricos al seleccionar un movimiento Zoom.
- [ ] Arrastrar el pivote actualiza `pivoteX`/`pivoteY`.
- [ ] Con `velocidad` distinta de 0, aparece el círculo proyectado (punteado) más grande o más chico que el actual según el signo de `velocidad`.
- [ ] Al reproducir, las figuras se alejan/acercan del pivote mostrado en el overlay (coincide lo que se ve editando con lo que pasa en Play — recordar la limitación de la Fase 0: no cambia `radiox`/`radioy` de un `CIRCULO` suelto, solo posición respecto al pivote).

---

## Fase 4 — Oscilatorio: visual primero, mangos después — IMPLEMENTADA

**Objetivo:** representar 4 parámetros (`amplitudX`, `frecuenciaX`, `amplitudY`, `frecuenciaY`) sin sobrecargar el lienzo.

**Alcance realizado (4a y 4b juntas):** nuevo `ControlOscilatorioLienzo.js`, con origen fijo en el centro del grupo (igual convención que `ControlFlechaLienzo`). Dibuja una elipse punteada (`ctx.ellipse`, radio X = `amplitudX`, radio Y = `amplitudY`, sin escala — las amplitudes ya están en las mismas unidades de canvas que el resto de la app) y dos mangos circulares: uno en el borde derecho (eje X) y otro en el borde superior (eje Y). Cada mango se arrastra de forma independiente y solo actualiza su propia amplitud (`amplitudX`/`amplitudY`). `frecuenciaX`/`frecuenciaY` quedan solo en el formulario, sin control en el lienzo, tal como estaba planeado.

Conectado en `GestionLienzoEvento.js` vía `CAMPOS_OSCILATORIO_POR_TIPO` + una cuarta rama en `resolverControl(tipo)`.

**Criterios de verificación (pendientes de probar en navegador):**
- [ ] La elipse dibujada coincide en proporciones con los valores de amplitud guardados (probar con 2-3 combinaciones distintas de amplitudX/amplitudY).
- [ ] Arrastrar el mango del eje X actualiza `amplitudX` sin afectar `amplitudY`, y viceversa.
- [ ] Al reproducir, el recorrido real del grupo se mantiene dentro de la elipse mostrada.

---

## Fase 5 — LERP: interacción de dos puntos — IMPLEMENTADA (y corregida)

En la Fase 0 se decidió extender el modelo de datos de LERP a 2D + tiempo normalizado, así que esta fase se ejecutó tal como estaba planeada. La implementación inicial usaba dos puntos arrastrables (`ControlLerpLienzo.js`, inicio y fin), pero se detectó una inconsistencia real: todos los demás movimientos "Objetos" (MRU, Gravedad, MRU 2D, Parabólico) devuelven offset `(0,0)` en `t=0` porque su fórmula es proporcional a `t` (ej. `x=v*t`), así que continúan sin salto desde la posición real del grupo. LERP con un `inicio` propio no cumplía eso: al arrancar el movimiento, el grupo saltaba de su posición actual a `origen + inicio_offset`.

**Corrección:** LERP ahora siempre parte de `(0,0)` — la posición real del grupo al ejecutarse, igual que el resto — y solo define el punto final (`fin_x`/`fin_y`) relativo a ese origen. Se quitó `inicio_x`/`inicio_y` del modelo de datos, del formulario y de `GestionMovimientos.js` (`x = lerp(0, fin_x, t_norm)`). Con esto, LERP quedó geométricamente idéntico a MRU 2D (un solo vector libre desde el origen del grupo), así que se reutiliza `ControlFlechaLienzo` en vez de una clase dedicada — se eliminó `ControlLerpLienzo.js` por quedar redundante.

Con esto, los 10 tipos de movimiento definidos en `ConstanteEvento.js` tienen overlay en el lienzo, en 4 clases de control (no 5).

**Criterios de verificación (pendientes de probar en navegador):**
- [ ] Al seleccionar un movimiento LERP recién agregado (sin editar), la flecha aparece en el centro del grupo (no en un punto separado).
- [ ] Arrastrar la punta de la flecha actualiza `fin_x`/`fin_y`.
- [ ] Al reproducir, el grupo parte de su posición actual (sin salto) y recorre la línea hasta el punto final durante la ventana de tiempo del movimiento, sin quedarse a medio camino.

---

## Resumen de fases

Todas las fases (0-5) están implementadas. Los 10 tipos de movimiento tienen overlay en el lienzo, repartidos en 4 clases de control: `ControlVectorLienzo` (Rotación, Circular), `ControlFlechaLienzo` (MRU, MRUA, MRU 2D, Gravedad, Parabólico, LERP), `ControlZoomLienzo` (Zoom) y `ControlOscilatorioLienzo` (Oscilatorio), elegidas desde `GestionLienzoEvento.resolverControl(tipo)`.

Queda pendiente, para todas las fases, la verificación manual en navegador marcada en cada checklist — ninguna se probó corriendo la app.

| Fase | Contenido | Depende de | Estado |
|---|---|---|---|
| 0 | Arreglar MRUA, implementar cálculo de Zoom, decidir modelo de datos de LERP | — | Implementada |
| 1 | Refactor: utilidad genérica de flecha/pivote | — (puede ir en paralelo con la Fase 0) | Implementada |
| 2 | Parabólico, MRU 2D, Gravedad, MRU, MRUA | Fase 1 (utilidad), Fase 0 (MRUA funcional) | Implementada |
| 3 | Zoom (overlay radial) | Fase 0 (cálculo de Zoom), Fase 1 (reutiliza el pivote arrastrable) | Implementada |
| 4 | Oscilatorio (visual + mangos) | Fase 1 | Implementada |
| 5 | LERP (dos puntos) | Fase 0 (decisión de datos) | Implementada |
