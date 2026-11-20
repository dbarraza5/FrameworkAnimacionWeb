# Organización del proyecto: escenas, assets y capítulos (nov-2026)

**Problema:** en la página del proyecto (`/list-animaciones/:id`), la pestaña "Eventos" es una lista plana de todos los documentos de eventos, assets y escenas mezclados, y cuesta encontrar la escena principal. Una historia con capítulos se vería plana y desordenada.

**Decisiones del usuario (2026-11-19)**
- Los capítulos **solo organizan**: carpetas anidadas con orden manual. Reproducirlos en secuencia queda para más adelante.
- Escena o asset se decide **automáticamente y se puede corregir**:
  - un documento es escena si tiene cámara, instancias o efectos;
  - un botón lo cambia;
  - los documentos existentes no se tocan.

**Forma de trabajo:** una fase a la vez. El usuario la revisa y recién después se pasa a la siguiente. Nada cambia los datos existentes: los campos nuevos son opcionales.

| Fase | Qué | Estado |
|---|---|---|
| 1 | **Escenas y assets separados**, escena **principal** ⭐ y el nombre del proyecto en el título | **hecha, a revisar** |
| 2 | **Capítulos y escenas** (ajustado el 2026-11-19, ver abajo): botones "Nuevo capítulo" y "Nueva escena", escenas dentro de capítulos con orden manual, mover escenas entre capítulos. Los assets **no** van en capítulos | **hecha, a revisar** |
| 3 | **Integración:** la biblioteca del editor muestra solo assets; la autoría (`catalogo`, `crear --capitulo`, `capitulo`) y el respaldo .zip llevan la organización | **hecha, a revisar** |

## Fase 1 — Escenas y assets

**Datos** (backend, `modelo/Eventos.js`): `organizacion: {tipo: "escena" | "asset" | null, principal: Boolean, carpeta, orden}`. Con `tipo: null`, o sin el campo, se usa el **tipo automático**.

**Tipo automático:** es escena si algún grupo tiene `instancia`, `efecto` o la clase `camara`, o si `escena` tiene configuración aparte de `reacciones`. Es la misma regla que `Descompilador.esEscena` del frontend.

**API** (sesión del dueño del proyecto):
- `GET /api/proyecto/:id/documentos` devuelve `{proyecto: {_id, nombre}, documentos: [{_id, nombre, fechas, tipo, tipo_auto, manual, principal, carpeta, orden}]}`. No trae las figuras: solo los campos necesarios para clasificar.
- `PATCH /api/eventos/:id/organizacion` recibe `{tipo?: "escena" | "asset" | null, principal?: bool}`.
  - `principal: true` desmarca la anterior: hay una sola principal por proyecto.
  - `tipo: null` vuelve al tipo automático.

**Página del proyecto:**
- El título muestra el **nombre** del proyecto.
- La pestaña "Eventos" se reemplaza por **Escenas** y **Assets**, cada una con su contador.
  - Escenas: la principal arriba y destacada, y las demás por fecha de actualización (la más reciente primero).
  - Cada fila tiene abrir, ⭐ marcar como principal (solo escenas) y "pasar a assets" o "pasar a escenas".
  - Una marca indica si el tipo fue elegido a mano.
  - Hay un buscador por nombre.
- La pestaña "Objetos" pasa a llamarse **Dibujos**, que es lo que lista.

### Resultado de la fase 1 (2026-11-19)

**Hecho**
- Backend:
  - `modelo/Eventos.js`: `organizacion`.
  - `controller/Organizacion.js`: `tipoAutomatico`, `filaDocumento` y `validarCambio`, que son funciones puras.
  - `routes/Organizacion.js` (montada en `/api` con sesión; solo el dueño del proyecto): `GET /api/proyecto/:id/documentos` y `PATCH /api/eventos/:id/organizacion`.
  - La principal es única por proyecto: al marcar una, se desmarcan las demás.
  - Organizar no toca `fecha_actualizacion`.
  - Las actualizaciones del editor y de la autoría usan `$set` de los campos que mandan, así que no borran `organizacion`.
- Frontend:
  - `Componentes/Home/ListaDocumentos.js` (nuevo).
  - `Componentes/Home/Animacion.js`: el título lleva el nombre del proyecto (antes mostraba el id).
  - Pestañas: **Escenas** (activa al entrar) y **Assets**, con contadores, y **Dibujos** (antes "Objetos"). Se quitó la vieja pestaña "Eventos", cuyos botones de editar y borrar no hacían nada.
- Manual, §2.

**Verificado**
- 3 pruebas del backend (`node --test pruebas/`, en `backend_container`).
- **En el navegador**, con la sesión del usuario: proyecto "Fase 9" (1 escena, 3 assets) y proyecto "Rostro" (2 escenas de 23 documentos).
- Marcar la principal persiste después de recargar.
- "A escenas" muestra la marca "elegido a mano", y ↺ vuelve a la clasificación automática. Se probó con `evento_default` de "Fase 9" y quedó como estaba.
- Quedó marcada como principal "Pescando en el mar" (proyecto de prueba).

**Observación para la fase 2:** cada proyecto nuevo crea solo un documento vacío `evento_default`, que aparece en Assets. Podría ocultarse o mostrarse como "(vacío)".

## Ajuste del modelo (2026-11-19, pedido del usuario)

El usuario no encontraba en la interfaz cómo crear capítulos y escenas: en la fase 1 todavía no existen los capítulos, y una escena solo se crea con "Guardar como" desde el editor o con la autoría. Además aclaró que **los assets son transversales al proyecto: no pertenecen a ningún capítulo ni escena**.

Así queda el modelo:

```
Proyecto
├── Historia
│   ├── Capítulo 1 → Escena 1, Escena 2 …   (orden manual)
│   ├── Capítulo 2 → …
│   └── Sin capítulo → escenas sueltas
└── Assets (del proyecto; cualquier escena puede usar cualquiera)
    └── opcional: categorías planas (Personajes, Fondos, Objetos) solo para filtrar
```

**Fase 2, ajustada:**
- **Datos:** `proyecto.capitulos = [{_id, nombre}]`; el orden es el de la lista. Cada escena guarda `organizacion.capitulo` (id o null) y `organizacion.orden`. Los capítulos no se anidan.
- **Pestaña Escenas:**
  - botón **Nuevo capítulo**;
  - cada capítulo es una sección que se pliega, con renombrar, borrar (sus escenas pasan a "Sin capítulo") y subir/bajar;
  - las escenas tienen subir/bajar y "Mover a…" otro capítulo.
- **Nueva escena:** un botón por capítulo crea una escena vacía (cámara por defecto) ya dentro de ese capítulo y la abre en el editor.
- **Assets:** siguen siendo del proyecto, sin capítulo. Se filtran por categoría opcional y se oculta el `evento_default` vacío.

### Resultado de la fase 2 (2026-11-19)

**Hecho**
- Backend:
  - `modelo/Proyecto.js`: `capitulos: [{nombre}]`, en orden.
  - `modelo/Eventos.js`: `organizacion.capitulo` reemplaza a `carpeta`, que no se llegó a usar.
  - `controller/Organizacion.js`: `capitulosDe`, `validarNombre`, `moverEn`, `validarOrden` y `escenaVacia`, que son funciones puras.
  - `routes/Organizacion.js`:
    - `POST`, `PATCH` (`nombre` y `mover: -1|1`) y `DELETE /api/proyecto/:id/capitulos[/:id_cap]`;
    - `PUT /api/proyecto/:id/escenas/orden {capitulo, ids}` reordena las escenas o las pasa a un capítulo;
    - `POST /api/proyecto/:id/escenas {nombre, capitulo}` crea una escena vacía al final del capítulo;
    - el `GET` de documentos ahora trae también `capitulos`.
  - Borrar un capítulo no borra escenas: pasan a "Sin capítulo".
  - Organizar no cambia la fecha del proyecto ni la de los documentos.
- **Escena vacía:**
  - trae el evento general de 5 s, el grupo raíz y una **Cámara** de 1280×720 centrada;
  - tiene `precision: "decimal"` y orden por profundidad;
  - se clasifica sola como escena.
- Frontend:
  - `Componentes/Home/HistoriaEscenas.js` (nuevo) es la pestaña Escenas:
    - botones **Nuevo capítulo** y **Nueva escena**, más un buscador;
    - un aviso con la escena principal y su botón Abrir;
    - una tarjeta por capítulo que se abre y cierra, con Nueva escena, renombrar, subir, bajar y borrar;
    - al final, "Sin capítulo";
    - en cada escena: ⭐, número, subir, bajar, **Mover a…**, abrir, pasar a assets y ↺.
  - `ListaDocumentos.js` queda solo para **Assets**. Ahí `evento_default` se oculta (con un enlace para mostrarlo) y no cuenta en el número de la pestaña.
- Manual, §2.

**Verificado**
- 6 pruebas del backend.
- **En el navegador**, en el proyecto "Fase 9" con datos `prueba_` que después se borraron:
  - crear 2 capítulos y 3 escenas dentro de un capítulo;
  - bajar una escena, moverla a otro capítulo, subir un capítulo y renombrarlo;
  - marcar la principal;
  - borrar un capítulo (sus escenas pasaron a "Sin capítulo");
  - recargar: todo persiste;
  - la escena nueva abre en el editor con su cámara.
- Corregido durante la prueba: a la cámara de la escena vacía le faltaba `camara: {ancho, alto, zoom}`, y el editor creaba una "Cámara 2".

**Notas**
- En "Fase 9", "Pescando en el mar" está marcada a mano como asset; no lo hice yo en esta fase, así que la dejé así. Con ↺ vuelve a ser escena.
- Pendiente para la fase 3: que el respaldo .zip lleve los capítulos, la biblioteca del editor con solo assets y `crear --capitulo` en la autoría.

### Resultado de la fase 3 (2026-11-19)

**Hecho**
- **Biblioteca del editor** (`OffcanvasAnimaciones.js`):
  - lee los documentos con `GET /api/proyecto/:id/documentos`, con el mismo tipo que la página del proyecto;
  - por defecto muestra solo **assets**;
  - el interruptor **Incluir escenas (n)** agrega las escenas, con el ícono 🎞, para usarlas como sub-escenas;
  - nunca ofrece la escena que se está editando (`idActual`) ni el `evento_default` de ejemplo;
  - ya no descarga el documento completo de lo que oculta.
- **Respaldo .zip** (`controller/RespaldoProyecto.js`): al importar, cada capítulo recibe un id nuevo, y `organizacion.capitulo` de las escenas se cambia junto con él. Los capítulos y la escena principal viajan con el proyecto.
- **Autoría:**
  - `controller/OrganizacionDatos.js` (nuevo): `capituloPorNombre` (lo crea si hace falta), `ordenAlFinal` y `ubicarEnCapitulo`. Lo usan la autoría y la página del proyecto.
  - `GET /autoria/catalogo` trae `tipo` (automático o manual), `principal`, `capitulo` (el nombre), `orden` y la lista `capitulos`.
  - `POST /autoria/escenas` acepta `capitulo` (un nombre).
  - `PUT /autoria/eventos/:id/capitulo {capitulo: nombre | null}` mueve una escena de capítulo; con un asset responde 400.
  - CLI `herramientas/autoria.mjs`:
    - `catalogo` lista los assets y después las escenas por capítulo;
    - `crear ... --capitulo "X"`;
    - `capitulo "<escena>" "X" | --sin-capitulo`.
- Documentación: guía (§ Organización y comandos) y Manual §7.

**Verificado**
- 6 pruebas del backend.
- **Respaldo:** exportar e importar de verdad, con un capítulo y una escena `prueba_`. El capítulo recibe un id nuevo y la escena apunta a él. El proyecto importado y los datos de prueba se borraron.
- **Autoría** con una llave temporal de "Fase 9":
  - crear 2 escenas con `--capitulo` (el capítulo se creó solo);
  - mover una a otro capítulo y la otra a "sin capítulo";
  - mover un asset da error;
  - el catálogo muestra la agrupación.
  - Después se borraron las escenas y los capítulos, y se revocó la llave.
- **En el navegador**, en el editor de una de esas escenas:
  - la Biblioteca de "Fase 9" mostró solo los assets, sin la escena abierta ni `evento_default`;
  - con **Incluir escenas (1)** apareció la otra escena.
