# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start   # react-scripts start --browser=opera -- launches CRA dev server on :3000, tries to open Opera
npm run build
npm test    # react-scripts test -- no test files currently exist in the repo
```

The backend URL is hardcoded in `src/config.js` (`SERVIDOR_BACKEND: "http://127.0.0.1:5000"`), not read from an env var.

## Architecture

### `Clases/` vs `Componentes/`

The codebase deliberately separates plain-JS engine logic from the React view layer:

- **`Clases/`** — framework-agnostic classes: canvas rendering, geometry/physics math, and mutable in-memory data managers (`GestionAnimacion`, `GestionEvento`, ...). These hold the actual drawing/animation data and are mutated directly; React components read from and dispatch into them, they are not themselves React state.
- **`Componentes/`** — React UI (panels, modals, forms) that wire user input to the `Clases/` layer and re-render on a version counter.

Redux (`Store/`) only holds UI/selection state (e.g. `id_grupo_seleccionado`, current tab/modality) — it is **not** the source of truth for figures or movements. That data lives in `GestionAnimacion`/`GestionEvento` instances and is persisted to the backend via `axios` calls that read/write the whole document.

### Two editors, same underlying data hierarchy

Routes (`Routes/RoutesMain.js`): `/animacion/:id_animacion` and `/evento/:id_evento`.

**`EditorAnimacion`** (drawing) — builds `grupos_figuras`: a tree of groups (`nodo_padre`-linked, recursively nestable) where each group's `lista_figuras` holds primitive shapes (`PUNTO`, `RECTA`, `CIRCULO`) and `lista_pintado` defines which figure points get connected into painted color contours. Key classes: `GestionAnimacion` (CRUD over `grupos_figuras`), `GestionLienzoAnimacion`, `OperacionesGrupo` (rotate/mirror/inflate transforms), `Fisica` (trig helpers).

**`EditorEvento`** (animation/choreography) — builds a tree of `eventos`, each with a time window and a list of `objetos` (references to groups by name) carrying `movimientos`. A movement's `tipo_efecto` decides what it acts on:
- `TIPO_EFECTO_MOV_OBJETOS` (1, "Objeto") — translates the whole referenced group as a rigid unit.
- `TIPO_EFECTO_MOV_FIGURAS` (2, "Figuras") — rotates/scales the group's individual figures around a pivot (each figure both orbits the pivot and re-orients itself — a true rigid rotation, not a translation).

An `Eventos` document holds its own copy of `grupos_figuras`/`meta_figuras` (synced from the `Animacion` document), so choreography works against a snapshot independent of live drawing edits.

Key classes: `GestionEvento` (event tree; each frame, resolves active movements and accumulates their per-figure deltas — multiple simultaneous movements on the same figure are summed), `GestionMovimientos` (the physics formula per movement type), `GestionLienzoEvento` (canvas rendering + mouse-driven editing).

### Movement types and their canvas controls

10 movement types are defined as `MOV_*` constants in `Clases/EditorEvento/ConstanteEvento.js`, with their formulas in `GestionMovimientos.js` (`movimientoGrupo` for the Objeto family, `movimientoFiguras` for the Figuras family). Each type also has an interactive overlay in the canvas, driven by `GestionLienzoEvento.resolverControl(tipo)`, which picks one of four reusable controller classes based on which config map contains the type:

| Controller | Movement types | Interaction |
|---|---|---|
| `ControlVectorLienzo` | Rotación, Circular | draggable pivot + a magnitude-gauge arrow (always drawn along X) for angular velocity |
| `ControlFlechaLienzo` | MRU, MRUA, MRU 2D, Gravedad, Parabólico, LERP | fixed origin (group center) + a free-direction or axis-restricted arrow; `leerVector`/`guardarVector` per type translate between the type's own fields (which may be polar, e.g. Parabólico's `velocidadInicial`+`angulo`) and a generic `{x,y}` vector |
| `ControlZoomLienzo` | Zoom | draggable pivot + two concentric circles (current/projected radius) instead of an arrow, since zoom is radial |
| `ControlOscilatorioLienzo` | Oscilatorio | fixed origin + a dashed ellipse (amplitude) with one drag handle per axis |

Adding a new movement type's canvas interaction means adding an entry to the relevant `CAMPOS_*_POR_TIPO` / `CONFIG_FLECHA_POR_TIPO` map in `GestionLienzoEvento.js` — not a new `if(tipo === MOV_X)` branch.

### Auth

JWT (in `Authorization: Bearer` header) + a session cookie, both required on every `/api/*` call. Token is stored via `react-cookie` after login; `axios` calls attach it manually per-request (see `Componentes/EditorEvento/SeccionEventos/PanelGrupos.js` for the pattern).

### Reference planning doc

`documento/planeacion_movimientos_canvas.md` documents the phased rollout of the canvas controllers above (audit of what existed, what was added per phase, verification checklists) — useful background if extending movement types further.
