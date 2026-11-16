# Planeación: autoría asistida (armar escenas junto con el asistente)

> Documento vivo, separado de `planeacion_escena_objetos.md` (que trata las capacidades del editor).
> Este trata **cómo hacer eficiente y confiable que el asistente (Claude) arme assets y escenas completas** a pedido del usuario, y de paso agrega capacidades útiles para el usuario, como exportar a video.

## Objetivo

Que un pedido como *"una escena de un incendio en la calle"* se resuelva así:

1. El asistente escribe la escena en un **formato corto**.
2. La **valida** con la API.
3. **Genera un GIF de prueba sin navegador** y lo revisa.
4. La entrega **ya verificada** en el proyecto del usuario.

Todo sin escribir directo en la base de datos y sin depender de una pestaña de Chrome.

## Contexto: qué costó al armar las escenas de ejemplo (2026-11-13)

| Problema | Ejemplo |
|---|---|
| **Geometría a mano, muy verbosa** | Cada polígono es una RECTA por lado más el contorno del pintado (`PUNTO1` de cada recta). Una casa ocupaba unas 40 líneas de datos. |
| **Sin API de autoría** | Los assets y las escenas (calle, meteorito, tornado, disparo) se crearon con scripts de `mongosh` escritos directo en Mongo, saltando las validaciones del backend. |
| **Verificación frágil en el navegador** | Chrome frena la pestaña en segundo plano; la sesión vence; `alert`/`confirm` congelan la pestaña; hubo que forzar cuadros a mano. Esto **escondió un error real**: el editor no cargaba ninguna escena (referencia circular en la copia JSON del motor) y en las pruebas no se vio. |
| **Código repetido fuera del proyecto** | Las funciones `casa()`, `persona()`, `arbol()`, `auto()`, `temblor()` vivían en scripts sueltos (`ciudad.js`, `escenas9.js`) en una carpeta temporal. |
| **Contexto que se pierde** | Cada sesión nueva tiene que reconstruir las convenciones (y crece hacia abajo, ancla en los pies, planos, formato de las claves…). |

## Decisiones tomadas

| # | Decisión | Por qué |
|---|---|---|
| A-D1 | La planeación de autoría va en **este documento aparte**. | Pedido del usuario: separarla de las fases del editor. |
| A-D2 | El orden empieza por **formato + API + render sin navegador** (fases A1–A3). | Son las tres que más reducen tiempo y errores. El render, además, es la base de **exportar a video** para el usuario. |
| A-D3 | El compilador del formato y el render **usan el motor real** (`Clases/`), no una copia. | Que lo que verifica el asistente sea exactamente lo que verá el usuario. El motor ya es independiente de React (se ejecutó en Node al inicio del proyecto). |
| A-D4 | (era AP1) El render corre en el **contenedor del frontend** con `canvas` (node-canvas), **que el proyecto ya tenía como dependencia** y funciona en el contenedor. No hizo falta `@napi-rs/canvas`. | Cero dependencias nuevas de sistema. |
| A-D5 | (era AP2) El motor se carga en Node empaquetándolo con **esbuild** (`herramientas/lib/motor.mjs`, en caché que se rehace sola cuando cambia `src/Clases`). | No hay que tocar los imports del código del editor. |
| A-D6 | (era AP3) Formato simple en **JSON**. | Sin dependencias. |
| A-D7 | (era AP5) GIF y PNG con **gifenc** (JS puro). MP4 queda para después (`ffmpeg`). | Sin dependencias de sistema. |
| A-D8 | Mientras no exista la API (A2), las herramientas leen y escriben **Mongo directo** desde el contenedor del frontend (driver `mongodb`, solo desarrollo). | Permite trabajar ya. La A2 reemplaza la escritura por la API. |

## Preguntas abiertas

| # | Pregunta | Propuesta | Afecta a |
|---|---|---|---|
| AP4 | Llave de API del asistente: ¿por proyecto o por usuario? ¿Qué permisos? | **Por proyecto**, revocable, con permiso de leer y escribir assets y escenas de ese proyecto, sin borrar. Se crea desde la página del proyecto. | A2 |

---

## Fase A0 — Guía del proyecto para el asistente — IMPLEMENTADA

**Objetivo:** que cada sesión arranque sabiendo cómo armar escenas, sin reconstruir el contexto.

**Alcance:**
- Una **skill** del proyecto (`.claude/skills/armar-escena/`), o una sección en `CLAUDE.md`, con:
  - convenciones: coordenadas (y hacia abajo), ancla en los pies, planos (−3 fondo … 1 primer plano), unidades de tiempo (ms en claves y eventos, s en el reloj de escena), escala y espejo;
  - catálogo de assets del proyecto con su tamaño y su ancla;
  - el formato de escena (A1) y los comandos (A2–A4);
  - errores conocidos (ver *Contexto*).
- Se mantiene al día en cada fase.

**Verificación:**
- [ ] En una sesión nueva, el asistente arma una escena simple solo con la guía, sin leer el código del motor.

### Alcance realizado (2026-11-13)
- **`documento/guia_armar_escenas.md`** (versionada en el repo del frontend):
  - modelo de datos;
  - convenciones (ejes, ancla en los pies, tiempos, profundidad, caminar, espejo, cámara);
  - **catálogo de assets** con ids, cajas medidas desde la base y eventos;
  - alturas útiles de la calle;
  - cómo crear (formato simple + herramientas) y cómo verificar (trampas conocidas);
  - valores de física que funcionaron.
- **Skill `armar-escena`** en `d:\projecto_animacion\.claude\skills\` (la carpeta desde donde se abren las sesiones). Es un puntero corto que obliga a leer la guía; no se duplica el contenido.

## Fase A1 — Formato de escena simple y compilador — IMPLEMENTADA

**Objetivo:** describir assets y escenas en pocas líneas; el sistema genera el formato completo (`grupos_figuras`, `lista_figuras`, `lista_pintado`, eventos).

**Alcance:**
- **Módulo puro** compartido (`Clases/Autoria/Compilador.js`) que se usa desde el editor, la API y la línea de comandos.
- **Assets:**
  - formas: `poligono`, `rect`, `circulo`, `elipse`, `linea`;
  - partes con nombre y jerarquía, color de relleno y de borde, pivote de cada parte;
  - claves y bucle de claves (caminar, aletear, girar).
- **Escenas:**
  - `instancia` de un asset por nombre, en `[x, y]` (pies), con escala, espejo, plano y física;
  - claves (`x`, `y`, `rotacion`, `opacidad`…), efectos y cámara;
  - eventos y configuración de la escena.
- **Validación con errores claros:** asset inexistente, nombre repetido, clave fuera de la duración, polígono con menos de 3 puntos, efecto sin parámetros obligatorios…
- **Descompilar:** pasar una escena existente al formato simple, para que el asistente pueda leer y modificar escenas hechas a mano.

Ejemplo del formato (borrador):

```json
{
  "escena": "Incendio en la calle", "duracion": 10000, "profundidad": true,
  "camara": {"centro": [1150, 380], "zoom": 1},
  "objetos": [
    {"instancia": "Calle", "en": [1500, 720], "ancla": [1500, 720], "plano": -3},
    {"instancia": "Casa roja", "nombre": "casa", "en": [1100, 430], "plano": -1, "fisica": "desarmar"},
    {"instancia": "Persona", "en": [600, 668], "claves": {"x": [[0, 600], [6000, 900]]}}
  ],
  "efectos": [
    {"tipo": "particulas", "en": [1100, 300], "inicio": 0, "fin": 10000, "color_ini": "#ffcc33", "color_fin": "#333333"}
  ]
}
```

**Verificación:**
- [x] Las escenas de ejemplo (calle, meteorito, tornado, disparo) se reescriben en el formato simple y compilan a lo mismo que hay hoy en la base: mismo dibujo y misma simulación en los mismos instantes. (Se reescriben solas con `descompilar`; ver "Descompilar y pruebas".)
- [x] Compilar y luego descompilar una escena da un resultado equivalente.
- [x] Pruebas automáticas del compilador (las primeras del proyecto).

### Alcance realizado (2026-11-13)
- **`src/Clases/Autoria/Compilador.js`**: `compilar`, `compilarAsset`, `compilarEscena(def, buscarAsset)`. La referencia del formato está en su cabecera.
  - Partes anidadas con `poligono`, `rect`, `circulo` (con `lados`), `elipse`; `color` / `borde`; `pivote`, `rotacion`, `escala`; `claves` y `bucle`; atajo `giro`.
  - Escena: `instancia` (por nombre de asset, `en` = pies, `ancla`, `escala`, `espejo`, `plano`, `fisica`, `evento`, `desfase`, `version`; las claves x/y se dan en coordenadas de los pies) u objeto dibujado en línea; `camara`; `efectos` (con sus parámetros validados contra `TIPOS_EFECTO`); `profundidad`; `gravedad`.
  - **Validación con mensajes que dicen qué falla y qué es válido:** asset inexistente, evento que el asset no tiene, nombres repetidos, formas inválidas, interpolaciones, modos de bucle o física desconocidos, parámetros de efecto inexistentes (aviso), claves después del final (aviso).
- **`herramientas/autoria.mjs`** (`npm run autoria`): `catalogo`, `validar`, `compilar`, `crear`. `crear` hace el dibujo y el documento de eventos de un asset, o el documento de una escena, y **aborta si el nombre existe**.
- Ejemplos en `herramientas/ejemplos/`: `molino.json` (unas 20 líneas, 12 grupos y 55 figuras) y `calle_molino.json`.

**Verificado:**
- [x] `validar` reporta bien un archivo con 4 errores y 1 aviso.
- [x] `crear` del molino y de la escena (nombres `prueba_A1 …`): el render muestra el molino con las aspas girando (45° a los 7,5 s) y el editor real abre la escena igual. Documentos de prueba borrados.
- [x] Reescribir las escenas de ejemplo en el formato simple y comparar con las de la base (ver abajo).
- [x] Descompilar.
- [x] Pruebas automáticas.

### Descompilar y pruebas (2026-11-13)
- **`src/Clases/Autoria/Descompilador.js`**: `descompilar(doc, nombreAsset)` pasa un documento del editor al formato simple. Lo que es un polígono de RECTAs (todo lo que hay hoy) sale como `poligono`; lo demás (círculos, varios contornos) como `crudo`, que copia las figuras tal cual. Los eventos que no son el EventoGeneral vacío se copian tal cual (`eventos`). Lo que el formato no guarda se informa como aviso, no se pierde en silencio.
- Para que la vuelta sea **exacta**, el compilador ganó campos genéricos: `crudo` y `clases` en partes; forma propia en objetos dibujados; `capa`, `borde` y `escala: [sx, sy]` en objetos; `nombre` y `capa` en la cámara; `capa` en efectos; `eventos` en escenas.
- **`autoria.mjs descompilar "<nombre>" | --id <id> [--salida x.json]`**: además vuelve a compilar lo descompilado y avisa si la vuelta no es exacta.
- `herramientas/lib/comparar.mjs`: compara dos documentos por lo que significan (ignora `_id`, nombres internos de figuras, orden de grupos y transformaciones identidad; un parámetro de efecto que falta vale su valor por defecto, como lo lee el motor).
- **Pruebas automáticas** (`npm run pruebas`, `node:test`, dentro del contenedor del frontend), en `herramientas/pruebas/`:
  - `compilador.test.mjs` (sin base): formas, mensajes de error, ejemplos, cada generador, ida y vuelta de un asset y una escena "con todo", valores por defecto de efectos;
  - `base.test.mjs` (lee la base, se salta si no responde): **los 20 documentos del proyecto de ejemplo** vuelven exactos, y en las 5 escenas el **render del original y el de la vuelta es idéntico pixel a pixel** en 3 instantes (mismo dibujo y misma física).

**Verificado:** las 10 pruebas pasan. La prueba de pixeles detecta un cambio chico: mover una casa 5 px cambia 675 pixeles a los 0 s y 1252 a los 3,2 s.

## Fase A2 — API de autoría — IMPLEMENTADA

**Objetivo:** crear y modificar assets y escenas por la API, con validación, sin tocar Mongo directo.

**Alcance:**
- **Llave de API por proyecto** (AP4), enviada en una cabecera. No depende de la sesión del navegador ni de la contraseña del usuario. Se crea, lista y revoca desde la página del proyecto.
- **Rutas** (borrador):
  - `POST /api/autoria/validar`: compila y devuelve errores, sin guardar;
  - `POST /api/autoria/assets` y `POST /api/autoria/escenas`: crean desde el formato simple (dibujo + documento de eventos);
  - `PUT` de lo mismo para actualizar;
  - `GET /api/autoria/catalogo`: assets del proyecto con tamaño, ancla, eventos y miniatura.
- **Respaldo automático** antes de modificar algo existente (una versión congelada, Fase 6C).
- Las rutas comprueban que el documento sea del proyecto de la llave. Esto también cubre el pendiente de seguridad *"las rutas no comprueban el dueño"* para estas rutas.

**Verificación:**
- [ ] Crear un asset y una escena por la API; aparecen en la Biblioteca y en la lista del proyecto y se abren bien en el editor (probado de verdad, sin forzar cuadros).
- [ ] Una llave revocada deja de funcionar; una llave de otro proyecto no puede leer ni escribir.

### Alcance realizado (2026-11-13)
**Decisión A-D9:** el formato simple se **compila del lado del cliente** (herramienta o editor) y la API recibe el resultado compilado (`{nombre, grupos_figuras, eventos, escena}`). La API lo valida (estructura, nombres, padres, instancias del mismo proyecto, más el esquema de Mongoose), controla los permisos y hace los respaldos. Así el backend (CommonJS, otro repo) no copia el compilador del editor. Por la misma razón, el **render no se expone por la API**: sigue en la herramienta del contenedor del frontend (se retomará en A7).

- **Backend:**
  - `modelo/LlaveAutoria.js` (colección `llaves_autoria`: proyecto, nombre, prefijo, **hash sha256**, creada, último uso, revocada);
  - `middleware/LlaveAutoria.js`: cabecera `X-Llave-Autoria` o `Authorization: Llave …`;
  - `routes/Autoria.js` montado en **`/autoria`**, fuera de `/api` (sin sesión ni JWT):
    - `GET /catalogo`, `GET /eventos/:id`;
    - `POST /validar`, `POST /assets` (dibujo + eventos), `POST /escenas`;
    - `PUT /eventos/:id` con **respaldo automático** (versión congelada) antes de cambiar;
    - **sin rutas para borrar**; todo filtrado por el proyecto de la llave; 409 si el nombre existe.
  - Administración en `/api` (sesión y JWT, solo el **dueño** del proyecto): `GET` / `POST` / `DELETE /api/proyecto/:id/llaves`. La llave completa se devuelve **una sola vez**.
- **Frontend:**
  - pestaña **Asistente** en la página del proyecto (`Componentes/Home/LlavesAutoria.js`): crear (se muestra una vez, con Copiar), lista con último uso y Revocar;
  - `herramientas/autoria.mjs` usa la API cuando hay `AUTORIA_LLAVE` (comandos `catalogo`, `validar`, `compilar`, `crear` y el nuevo `actualizar --id`). La escritura directa en Mongo queda solo con `--directo` (desarrollo).

**Verificado** (con una llave de prueba creada desde la interfaz y borrada al final):
- [x] Catálogo sin indicar proyecto; crear asset (dibujo + eventos) y escena; render de lo creado.
- [x] Crear de nuevo: 409, no sobrescribe.
- [x] Sin llave, llave falsa y **llave revocada desde la interfaz**: rechazadas (401).
- [x] Documento de otro proyecto: 404. Instancia de un asset ajeno y padre inexistente: 400 con ambos errores.
- [x] Actualizar: primero un respaldo (versión 1 con la duración anterior) y luego el cambio; la llave registra su último uso.
- [ ] Pendiente: "llave de otro proyecto" no se probó con dos proyectos reales (el filtro por proyecto sí: 404 y 400 de arriba).
- [x] El render, el reporte y `descompilar` ya leen por la API con la llave (ver A3).

## Fase A3 — Render sin navegador (y exportar) — IMPLEMENTADA

**Objetivo:** dibujar cualquier instante de una escena a imagen, y una animación a GIF, con el motor real y sin Chrome.

**Alcance:**
- Comando de Node (AP1, AP2): `render --escena <id> --t 3000 --salida cuadro.png` y `render --escena <id> --desde 0 --hasta 8000 --fps 15 --gif salida.gif`.
- Usa la cámara de la escena (o el encuadre completo con `--todo`), resuelve instancias, claves, profundidad, física y partículas igual que el editor.
- Ruta de la API que lo expone (`GET /api/autoria/escenas/:id/render?t=…`) para que el asistente lo use sin entrar al contenedor.
- **Para el usuario:** *Archivo → Exportar video* (GIF y PNG; MP4 después, AP5) que usa lo mismo (ver A7).

**Verificación:**
- [ ] El cuadro a los 3 s de "Meteorito (escena)" se ve igual en el render y en el editor (comparación visual).
- [ ] GIF de 8 s a 15 fps de una escena con física en un tiempo razonable (meta: menos de 30 s).

### Alcance realizado (2026-11-13)
- **`herramientas/render.mjs`** (`npm run render`):
  - `--t T` para un PNG, `--t T1,T2,… --hoja` para varios cuadros con su tiempo en una imagen, y `--desde --hasta --fps --gif`;
  - opciones `--ancho`, `--todo` y `--fondo`;
  - busca la escena por id o por nombre (`--proyecto`).
  - Funcionamiento:
    - carga la escena con el **motor real** (`lib/motor.mjs`) y sus assets desde Mongo (`lib/datos.mjs`, también versiones congeladas), y espera a que carguen;
    - encuadra la cámara de la escena;
    - dibuja con el mismo `ImprimirAnimacion` del editor, más las partículas.
- Exporta también `prepararEscena` y `dibujarCuadro`, que reutilizarán la A2 (ruta de render) y la A4 (reporte).

**Verificado:**
- [x] "Meteorito (escena)" en 1,6 / 2,8 / 5,5 s: estela, explosión con piezas y columna de humo, igual que en el editor.
- [x] **GIF de 8 s a 15 fps (120 cuadros, 480×270) en 3,3 s.**
- [x] Menú *Exportar video* del editor: hecho en A7.

**Lectura por la API (2026-11-13).** Decisión: **no se hizo una ruta de render en el backend**. El backend no tiene el motor ni `canvas`, y el asistente ya corre las herramientas en el contenedor del frontend. Lo que faltaba era que las herramientas no leyeran Mongo directo:
- `herramientas/lib/datos.mjs`: con `AUTORIA_LLAVE`, el documento y sus assets se leen por `/autoria` (proyecto de la llave). Sin llave, sigue leyendo Mongo, solo para desarrollo. Lo usan `render`, `reporte` y las pruebas.
- Backend: `GET /autoria/versiones/:id`, la versión congelada de un documento del proyecto, para las instancias fijadas a una versión.
- `prepararEscena` también acepta un documento ya armado (por ejemplo, recién compilado, sin guardarlo).
- [x] Con la llave y **Mongo inalcanzable a propósito**: el render, el reporte y `descompilar` funcionan. Una versión creada con la llave se lee por la API con su contenido de entonces; una versión que no existe da 404.

## Fase A4 — Reporte de escena — IMPLEMENTADA

**Objetivo:** que el asistente encuentre problemas sin mirar capturas.

**Alcance:**
- Comando o ruta `reporte --escena <id> --t 0,2000,4000`, que entrega en JSON:
  - por objeto: posición, caja, si está **dentro de la cámara**, plano y visibilidad;
  - física: piezas sueltas, dónde terminan y cuáles **salen de cuadro**;
  - assets que no cargan, claves fuera de la duración, efectos que no afectan a nada, objetos tapados por completo.
- Avisos con sugerencia, por ejemplo: *"7 piezas de persona terminan fuera de cuadro: bajar fuerza de Explosión o subir zoom de la cámara"*.

**Verificación:**
- [x] Con la escena del meteorito, el reporte señala **38 piezas fuera de cuadro** (con el detalle por objeto) y 7 objetos que nunca entran en cuadro, con sugerencias. La escena de la calle sale sin avisos.

### Alcance realizado (2026-11-13)
- `herramientas/reporte.mjs` (`node herramientas/reporte.mjs <escena> [--t …] [--json]`), por defecto un instante por segundo más el final:
  - por instante: cada objeto **dentro, parcial o fuera** de la cámara, con su caja en el dibujo y el estado de la física (piezas sueltas y fuera de cuadro);
  - avisos con sugerencia: assets que no cargan, objetos que nunca se ven, piezas que terminan fuera de cuadro (por objeto), efectos que no afectan a nada o que ocurren después del final, ninguna pieza suelta, claves después del final, objetos ocultos.
- `cajaMundo(m, nombre)` en `Render.js`: la caja con toda la cadena de transformaciones.

## Fase A5 — Generadores de assets y recetas en el repositorio — IMPLEMENTADA

**Objetivo:** reutilizar y versionar lo que hoy está en scripts sueltos.

**Alcance:**
- `Clases/Autoria/Generadores.js`: `casa({ancho, alto, pared, techo})`, `persona({ropa, pantalon, piel, pelo})`, `arbol()`, `auto({color})`, `farol()`, `nube()`, `pajaro()`, `sol()`, `meteorito()`, `calle({largo})`…, que devuelven el formato simple (A1).
- **Recetas** de animación: ciclo de caminata, aleteo, rueda que gira, temblor de cámara, entrada y salida por un borde.
- Se pueden usar desde el formato simple (`{"generador": "casa", "ancho": 220}`) y desde el editor: *Biblioteca → Generar…*, un formulario con los parámetros.

**Verificación:**
- [x] Recrear con generadores los assets de ejemplo y obtener el mismo dibujo: **los 10 (casa, árbol, auto, persona, farol, nube, pájaro, sol, meteorito, calle) dan la misma cantidad de grupos y figuras y la misma caja** que los de la base (script de comparación).

### Alcance realizado (2026-11-13)
- `src/Clases/Autoria/Generadores.js`: `GENERADORES` (arbol, casa, auto, persona, farol, nube, pajaro, sol, meteorito, molino, calle), cada uno con `descripcion`, `parametros` por defecto y `crear(p)`, que devuelve partes del formato simple; además `expandirGenerador(def)` y la receta `claveTemblor(centro, {desde, hasta, amplitud})`.
- **Compilador:**
  - `{tipo: "asset", generador, parametros}` se expande, y avisa de parámetros inexistentes con la lista de válidos;
  - la cámara de una escena acepta `temblor: {desde, hasta, amplitud}`.
- `npm run autoria -- generadores` lista los generadores y sus parámetros.
- **Biblioteca → Generar…** en el editor (`SeccionEventos/ModalGenerarAsset.js`):
  - elegir el generador, ponerle nombre y ajustar sus parámetros (el tipo de cada campo sale de su valor por defecto: color, número o sí/no);
  - **vista previa animada en vivo**: es exactamente lo que se guarda;
  - al crear, el asset aparece en la Biblioteca, ya seleccionado para "Agregar al centro".
  - Backend: `POST /api/proyecto/:id/assets` (con sesión, solo el dueño del proyecto). Comparte con `/autoria/assets` la validación y la creación (`controller/AutoriaComun.js`).
- [x] Probado: casa de 300 de ancho con pared verde, creada desde el formulario. Aparece en la Biblioteca, se agrega a la escena y su instancia carga sus 8 partes. Se crearon el dibujo y el documento de eventos; ambos se borraron después.
- Pendiente: recetas de entrada y salida por un borde.

## Fase A6 — Proyecto de pruebas y respaldos — IMPLEMENTADA (sin proyecto sandbox)

**Objetivo:** que el asistente pruebe sin tocar los datos del usuario y que todo cambio sea reversible.

**Alcance:**
- Un proyecto **"Pruebas del asistente"** (sandbox) para experimentar, con limpieza automática de lo viejo.
- Respaldo antes de cada escritura sobre un documento del usuario (versión congelada, Fase 6C), con su lista y restauración desde la interfaz.
- **Modo prueba del editor** (`?prueba=1`), solo en desarrollo:
  - sin aviso al cerrar;
  - sin `alert` ni `confirm` (los errores van a un panel);
  - una API `window.__editor` estable: `irA(t)`, `capturar()`, `estado()`.

**Decisión:** en vez de un proyecto "sandbox" aparte, las pruebas se hacen en el proyecto del usuario con nombres `prueba_…` creados **con la llave**, y la llave puede **borrar solo lo que ella misma creó**. Así las escenas de prueba usan los assets reales del proyecto (las instancias no cruzan proyectos) y no hay una limpieza automática que pueda equivocarse.

**Alcance realizado:**
- `DELETE /autoria/eventos/:id` (backend): solo borra documentos cuyo `creado_por_llave` sea esa llave (si no, 403). Da 409 si otra escena lo usa como asset (salvo `?forzar=1`). También borra su dibujo y sus versiones. En la CLI: `autoria.mjs borrar --id <id> [--forzar]`.
- El respaldo antes de cada `PUT` ya estaba (A2) y se restaura desde las versiones del asset (6C).
- **Modo prueba** `?prueba=1` (solo desarrollo): no avisa al cerrar, `alert`/`confirm`/`prompt` van a la consola, y `window.__editor` ofrece `listo()`, `irA(s)`, `estado()`, `capturar(ancho)` e `historial()`.
- Arreglo encontrado al probar: `pausarEventos()` seguido de `buscarTiempo()` no aplicaba el nuevo tiempo, porque el reloj pisaba lo buscado. El render y la exportación usan ahora un **tiempo forzado** (`_t_forzado` en `procesandoEventos`), independiente de los relojes del editor. Se volvió a verificar que los cuadros del GIF exportado cambian.
- Arreglo: `irA` fija `tiempo_animacion` al momento, porque con la pestaña en segundo plano no corre el ciclo de dibujo.
- Arreglo: `render.mjs --hoja` sin nombre de archivo fallaba; ahora usa `--salida` o `hoja.png`.
- El modo prueba **no deja copia local** (autoguardado): una prueba que cambia la escena sin subirla dejaba al usuario el aviso de "cambios sin subir" la próxima vez que la abriera.
- El panel de llaves y el Manual ahora dicen: "solo puede borrar lo que ella misma creó".

**Verificación:**
- [x] Una sesión de trabajo completa del asistente no deja documentos temporales en el proyecto del usuario: el asset y la escena de prueba se crearon con llave, se probaron en modo prueba y se borraron, y el proyecto quedó con sus 20 documentos.
- [x] Borrar un asset en uso da 409; un documento que no creó la llave, 403; la escena y luego el asset, OK; con la llave revocada, 401.

## Fase A7 — Exportar video desde el editor (para el usuario) — IMPLEMENTADA (MP4, GIF, secuencia PNG y PNG)

**Objetivo:** sacar el resultado final del editor.

**Alcance:**
- *Archivo → Exportar video…*: rango de tiempo, cuadros por segundo, tamaño (el de la cámara) y formato (GIF, PNG en .zip, MP4 cuando esté AP5).
- Usa el render de A3 en el servidor, o el lienzo del navegador como alternativa.

**Verificación:**
- [ ] Exportar "Tornado (escena)" a GIF y reproducirlo fuera del editor.

### Alcance realizado (2026-11-13)
**Decisión A-D10:** se exporta **en el navegador** (no en el servidor), con el mismo motor de la escena abierta. El dibujo de cada cuadro se pasó a un **módulo compartido**, `src/Clases/Autoria/Render.js` (`dibujarCuadro`, `tamanoSalida`, `limitesEscena`), que ahora usan **el editor y la herramienta de Node** (`render.mjs`). Hay un solo código de dibujo del resultado, y no hace falta un servicio de render.

- `Componentes/EditorEvento/ModalExportarVideo.js`, en *Archivo → Exportar video…*:
  - **GIF animado** (desde, hasta, cuadros por segundo de 8 a 30, ancho de 320 a 1280; codificado con `gifenc`) o **PNG del cuadro actual**;
  - barra de avance y Cancelar; la página no se congela (cede cada 3 cuadros);
  - al terminar, el editor **vuelve al instante en que estaba** (y sigue reproduciendo si lo estaba).

**Verificado** (descarga interceptada en la página, sin bajar archivos):
- [x] "Meteorito (escena)" de 1,5 a 4,5 s a 10 cuadros por segundo: **GIF de 31 cuadros, 640×360, unos 500 KB, en 1,2 s**. El editor volvió a 2,6 s.
- [x] PNG del cuadro actual (2,6 s): el impacto, igual que en el editor.
- [x] La herramienta de Node, ya con el módulo compartido: GIF de 120 cuadros, igual que antes.
- [ ] No probado: abrir el GIF descargado fuera del editor (la descarga se interceptó en la prueba).
- [x] **Secuencia de PNG en `.zip`**, para montarla en un editor de video. `src/Clases/Autoria/Zip.js` es un `.zip` sin compresión ("store"), escrito sin dependencias: los PNG ya vienen comprimidos. Probado: "Tornado (escena)" de 2 a 3 s a 8 cuadros por segundo da 9 PNG de 320×180, todos distintos, con su CRC correcto, y se leen bien. Un `.zip` hecho con el mismo código pasa `unzip -t` sin errores.
- [x] **MP4**, con el visto bueno del usuario para la dependencia `mp4-muxer@5.2.2` (JS puro). `src/Clases/Autoria/Mp4.js` codifica H.264 con WebCodecs (el codificador del navegador), cuadro a cuadro, y `mp4-muxer` arma el archivo. El nivel del códec se elige según el tamaño, y el ancho y el alto se redondean a pares. Es el formato por defecto si el navegador lo soporta (Chrome y Edge). Probado: "Tornado (escena)" de 1 a 4 s a 12 cuadros por segundo da un MP4 de 37 cuadros, 640×360, 3,08 s y 196 KB, hecho en 1,1 s. Al reproducirlo en un `<video>`, los cuadros cambian.

---

## Orden propuesto

1. **A0** (guía): es barata y ayuda desde ya. Se completa a medida que avanzan las demás.
2. **A1** (formato) y **A3** (render): juntas, porque la verificación de A1 usa el render.
3. **A2** (API).
4. **A7** (exportar video para el usuario), que aprovecha A3.
5. **A4**, **A5** y **A6**.

## Cómo actualizar este documento

Igual que el plan principal: al empezar una fase se refina su alcance. Al cerrarla se marca **IMPLEMENTADA**, se agrega **"Alcance realizado"** con lo que se hizo y por qué difiere del plan, y se marcan las verificaciones probadas (las no probadas quedan sin marcar y se dice explícitamente). Las respuestas a las preguntas abiertas se pasan a *Decisiones tomadas*.
