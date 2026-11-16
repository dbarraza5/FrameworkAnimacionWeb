# Guía para armar escenas (para el asistente)

> Fase A0 de [`planeacion_autoria_asistida.md`](planeacion_autoria_asistida.md). Leer **antes** de crear o modificar assets o escenas a pedido del usuario. Se actualiza en cada fase de autoría (A1: formato simple, A2: API, A3: render…).
> Detalle completo del editor: [`../Manual.md`](../Manual.md). Plan del editor: [`planeacion_escena_objetos.md`](planeacion_escena_objetos.md).

## 1. Modelo en una página

- **Proyecto** → tiene **dibujos** (colección `animacions`, editor `/animacion/:id`) y **documentos de eventos** (colección `eventos`, editor `/evento/:id`).
- Un **documento de eventos** es a la vez:
  - un **asset** (dibujo + eventos propios; aparece en *Biblioteca → Assets animados*);
  - y/o una **escena** (objetos que son instancias de otros assets, más cámara, efectos y claves).
- **Grupo** = nodo del dibujo (`grupos_figuras`): `nombre`, `nodo_padre` (`"root"` o el nombre del padre), `cx, cy` relativos al padre, `capa`, `lista_figuras` (RECTA / PUNTO / CIRCULO) y `lista_pintado` (rellenos).
- **Objeto de la escena** = grupo de primer nivel. Campos opcionales:
  - `transformacion` `{rotacion, escala_x, escala_y, ancla_x, ancla_y}`;
  - `instancia` `{id_eventos, nombre, version, evento, bucle, desfase}`: instancia por referencia; sus partes son virtuales `<contenedor>::<grupo>` y **no se guardan**;
  - `claves` `{x, y, rotacion, escala_x, escala_y, opacidad, zoom: [{t, v, interp}]}` y `claves_bucle` (`repetir`, `ida_vuelta` o `continuar`);
  - `opacidad`, `plano`, `orden_profundidad`;
  - `fisica` `{modo: fijo|rigido|desarmar, nivel, masa, rebote, friccion}`;
  - `efecto` (grupos con la clase `efecto`) y `camara` (grupo con la clase `camara`).
- **Documento:** `escena` `{orden_profundidad}` y `eventos` (árbol `EventoGeneral` → sub-eventos, con `tiempo_inicio` / `tiempo_final` en ms relativos al padre).

## 2. Convenciones (no romperlas)

| Tema | Convención |
|---|---|
| Ejes | **x a la derecha, y hacia abajo.** Lo "alto" tiene y negativa respecto de los pies. |
| Assets | Dibujar con los **pies (la base) en y = 0 y centrados en x = 0**. Así `en: [x, y]` es donde quedan los pies y el ancla de escala está en `[0, 0]`. Excepción: *Calle* (origen arriba a la izquierda; pies en `[1500, 720]`). |
| Ancla | `transformacion.ancla_*` es relativa al origen del grupo; escala y rotación giran alrededor de ella. En instancias: **los pies**. |
| Tiempos | Claves, efectos y eventos en **ms**. El reloj de escena del motor (`_t_escena`) está en **segundos**. `aplicarInstancias(t)` recibe segundos. |
| Profundidad | Con `escena.orden_profundidad`, se ordena por `plano` (−3 calle/cielo, −2 sol y nubes, −1 casas, árboles y faroles del fondo, 0 personajes, 1 primer plano) y luego por la altura de los pies. |
| Caminar | La animación del personaje es **en el lugar** (D7). El avance lo dan las claves de la escena. Excepción: el perro (*evento_default*, evento "Caminar") avanza solo, a 30 px/s por la escala. |
| Espejo | `escala_x` negativa. El desplazamiento propio va en el marco del objeto (D11): reflejado, avanza hacia donde mira. |
| Cámara | Toda escena tiene una (`asegurarCamara`); `cx, cy` = **centro**; ve `ancho/zoom × alto/zoom` (1280×720 por defecto). |

## 3. Catálogo de assets del proyecto de ejemplo

Proyecto `6af48d71b2479cd1dfc94dea`. Caja = extremos del dibujo, en coordenadas del asset, sin transformaciones.

| Asset (documento de eventos) | id | Caja (x · y) | Eventos (ms) | Notas |
|---|---|---|---|---|
| evento_default (**perro**) | `6af48d71b2479cd1dfc94e02` | 167..461 · 220..390 | General 6500, Caminar 0–4000, Sentarse 4000–6500 | Pies en ≈ `[300, 390]` (usar como ancla). Camina solo. |
| Árbol | `6af77bc04e21473e9f759275` | −78..78 · −221..0 | 1000 | estático |
| Casa roja / azul / amarilla | `…927a` / `…927f` / `…9284` | ±132 · −263..0 / ±152 · −325..0 / ±122 · −232..0 | 1000 | partes: pared, techo, puerta, ventanas, chimenea |
| Auto | `6af77bc04e21473e9f759289` | −126..128 · −118..0 | 1000 | ruedas que giran (claves, Repetir); mira a la derecha |
| Persona / Persona 2 | `…928e` / `…9293` | −17..19 · −189..0 | 1000 | camina en el lugar (piernas y brazos, Ir y volver); mira a la derecha |
| Persona armada | `6af7861edd92b55526caf870` | −17..32 · −189..0 | 1000 | de pie, brazo extendido; boca del arma ≈ `[85, −140]` |
| Farol | `…9298` | −14..60 · −236..0 | 1000 | estático |
| Nube | `…929d` | −77..82 · −71..−2 | 1000 | estático |
| Pájaro | `…92a2` | −16..25 · −44..−4 | 1000 | aletea |
| Sol | `…92a7` | ±78 · −158..−2 | 20000 | rayos que giran |
| Meteorito | `6af7861edd92b55526caf86b` | ±62 · −107..17 | 1000 | roca con resplandor; centro en y −45 |
| Calle | `6af77bc04e21473e9f7592ac` | 0..3000 · 0..720 | 1000 | cielo 0–425, vereda del fondo 425–475, asfalto 482–610, vereda del frente 617–680, pasto 680–720 |

**Proyecto "Ciudad"** `6afb111e2a252769672eb496` ([`planeacion_ciudad.md`](planeacion_ciudad.md)): 22 assets hechos con generadores (edificios cercanos y lejanos, autobús, parada, auto deportivo, camioneta, 6 personas, calle de 3600) y **Ciudad (escena)** `6afb122d2a252769672edde2`. Sus fuentes en formato simple están en `herramientas/ejemplos/ciudad/` (para cambiarlas: editar, `validar` y `actualizar --id`). Pies en la vereda del fondo: y 428 para los edificios y 458–468 para las personas; autobús y 540, camioneta y 602; capas: edificios lejanos −2 a escala 0,7–0,85, cercanos −1. **Ojo:** con ~1200 grupos, dibujar un cuadro cuesta 60–90 ms.

**Escenas de ejemplo:** Calle `…92de`, Meteorito `…caf8aa`, Tornado `…caf8e2`, Disparo `…caf912`, Disparo 2 `6af78db341d4694769b31303`.

**Alturas útiles en la calle:** pies en la vereda del fondo y 430–476; carril del fondo y ≈ 535; carril del frente y ≈ 598; vereda del frente y 668–676.

## 4. Cómo crear (formato simple + API con llave + render: Fases A1, A2 y A3)

Se escribe un **JSON simple** y lo compila `src/Clases/Autoria/Compilador.js` (la referencia completa del formato está en la cabecera de ese archivo). Ejemplos en `herramientas/ejemplos/`: `molino.json` (asset con aspas que giran) y `calle_molino.json` (escena).

Todo se ejecuta **dentro del contenedor del frontend** (Node 18). La escritura va por la **API `/autoria` con una llave del proyecto**, que el usuario crea en *Proyecto → pestaña Asistente* y me da. La llave define el proyecto; se pasa en la variable `AUTORIA_LLAVE` (no escribirla en archivos del repo ni repetirla en el chat; si hay que guardarla, en `/tmp` del contenedor con `chmod 600`, y borrarla al terminar).

```bash
# una vez: guardar la llave que dio el usuario en el contenedor (fuera del repo)
docker exec frontend_container sh -c 'printf %s "<llave>" > /tmp/llave && chmod 600 /tmp/llave'
H="docker exec -w /home/app frontend_container sh -c"   # en Git Bash, anteponer MSYS_NO_PATHCONV=1
K='AUTORIA_LLAVE=$(cat /tmp/llave)'
$H "$K npm run autoria -- catalogo"                                  # assets y escenas del proyecto de la llave
$H "$K npm run autoria -- validar  herramientas/ejemplos/molino.json"
$H "$K npm run autoria -- crear    herramientas/ejemplos/molino.json"  # asset = dibujo + eventos; escena = eventos
$H "$K npm run autoria -- actualizar escena.json --id <id_eventos>"   # guarda antes un RESPALDO (versión congelada)
$H "$K npm run autoria -- borrar --id <id_eventos>"                  # solo lo que creó esta llave; la escena antes que su asset
$H "$K npm run autoria -- descompilar \"<nombre>\" --salida /tmp/x.json" # escena o asset existente -> formato simple (vuelta exacta)
$H "$K npm run render -- \"<escena>\" --t 0,2000,4000 --hoja /tmp/render/x.png --ancho 480"   # lee por la API
$H "$K npm run render -- \"<escena>\" --desde 0 --hasta 8000 --fps 12 --gif /tmp/render/x.gif"
$H "$K node herramientas/reporte.mjs \"<escena>\""                      # objetos fuera de cámara, piezas perdidas...
docker cp frontend_container:/tmp/render/x.png <scratchpad>/x.png   # y mirarla con Read
# al terminar: docker exec frontend_container rm -f /tmp/llave
$H "npm run pruebas"                     # pruebas del compilador/descompilador (después de tocar src/Clases/Autoria)
```

- **Formato (resumen):**
  - asset: `{tipo: "asset", nombre, duracion, partes: [{nombre, en, poligono | rect | circulo | elipse, color, borde, pivote, rotacion, escala, claves, bucle, giro, partes}]}`;
  - escena: `{tipo: "escena", nombre, duracion, profundidad, camara: {centro, zoom, claves}, objetos: [{instancia, en (pies), ancla, escala, espejo, plano, fisica, evento, claves (x/y en coordenadas de los pies), repetir} | {nombre, en, partes}], efectos: [{tipo, en, ...parámetros, claves}]}`.
- **Para modificar algo existente:** `descompilar` → editar el JSON → `validar` → `actualizar --id` (con respaldo automático). Lo que no es un polígono simple sale como `crudo` (figuras tal cual): se puede dejar como está.
- **Sonido** ([`planeacion_sonido.md`](planeacion_sonido.md)): por nombre de sonido del proyecto (`autoria sonidos` los lista).
  - Escena: `sonidos: [{sonido, t, volumen?, bucle?, evento?}]` (sin `evento`, a la pista de la escena) y `sonido: "lleva" | "no_lleva"`.
  - Objetos y efectos: `sonidos`, `reacciones` (`"al_disparar": "Bang"`; disparo: `al_disparar` y `al_impactar`; explosión: `al_detonar`; objetos con física: `al_soltarse` y `al_tocar_suelo` con `max`) y `sonido` (marca).
  - Instancias: `audio: {volumen, silencio}`. Asset: `sonidos` (con `evento`), `reacciones` (las heredan sus instancias) y `marcas: {evento: marca}`.
  - **No subo audio:** si falta un sonido, `crear` o `actualizar` con `--crear-pendientes` lo deja **pendiente** (o `autoria sonido-pendiente "Ladrido" --nota "corto y seco"`), y el seguimiento le avisa al usuario que lo suba.
  - Marcar `"no_lleva"` lo que no debe sonar, para que el seguimiento no avise.
  - `reporte.mjs` lista los clips con sus instantes, incluidos los de la física.
- **Validar siempre antes de crear:** los errores dicen qué parte falla y qué valores son válidos.
- `crear` **nunca sobrescribe**: aborta si el nombre ya existe en el proyecto.
- **Revisar el resultado con el render**, que usa el motor real, igual que el editor. Después, abrir el editor una vez para confirmar.
- **No modificar documentos del usuario** sin pedirlo. Para probar, crear con la llave nombres `prueba_…` y **borrarlos al final** con `borrar` (se lleva su dibujo y sus versiones). Nunca apuntar `borrar` a documentos del usuario.
- Formato interno (por si hace falta tocarlo a mano): polígono = una RECTA por lado (`atributos: {x1, y1, x2, y2, cx, cy}` relativos a su centro) más un contorno `lista_pintado[0].elementos = [[{nombre, componente: "PUNTO1"}, …]]`.

## 5. Cómo verificar (y trampas conocidas)

1. **Probar como el usuario:** abrir `/evento/:id` y **esperar a que cargue solo**. No forzar cuadros con `procesarEventoLienzo()`: eso escondió que el editor no cargaba ninguna escena (referencia circular en la copia JSON del motor).
2. Chrome **frena la pestaña** si no está visible: las capturas fallan o el reloj va a 1–2 cuadros por segundo. Medir con `requestAnimationFrame` antes de culpar al editor.
3. La **sesión vence** (401 "no autenticado", o el editor queda vacío con el error "reading 'token'" en la consola). Reingresar desde `/` (borrar la cookie `usuario`). **Revisar siempre que `await __editor.listo()` dé `true`**: si da `false`, la escena no cargó y todo lo que se pruebe después sale en blanco. Un `alert` de error **congela la pestaña**: cerrarla.
4. Hook de desarrollo: `window.__editorEvento = {evento, lienzo}`. Datos útiles:
   - `edicion.fisica.estadosEn(t)`, `edicion.valorPropiedad(n, prop, t)`, `edicion.rectCamara()`;
   - `lienzo.configuracion_lienzo.vista_camara = true` para ver por la cámara;
   - `window.__miniatura` para dibujar miniaturas de prueba.
   - **Modo prueba** (Fase A6): abrir `/evento/:id?prueba=1`. No avisa al cerrar, y `alert`/`confirm`/`prompt` van a la consola (no congelan la pestaña). `window.__editor`: `await listo()` (escena y assets cargados), `irA(segundos)`, `estado()`, `await capturar(ancho)` (PNG en dataURL de lo que ve la cámara en ese instante) y `historial()`.
5. **Física:** revisar dónde terminan las piezas (`estadosEn(t)`); las livianas vuelan lejos. Valores que funcionaron:

   | Efecto | fuerza | radio | Notas |
   |---|---|---|---|
   | Explosión | ≈ 1150 | ≈ 1000 | |
   | Disparo (pieza) | ≈ 600 | | |
   | Disparo (objeto) | ≈ 380 | | |
   | Tornado | 1300 | 240 | elevación 3000 |

6. Al terminar, comprobar que los documentos originales siguen iguales (cantidad de grupos, `countDocuments`).

## 6. Al entregar
- Decir qué se creó (nombres e ids) y cómo verlo (desde la lista de eventos del proyecto; Cámara → Vista de cámara → ▶).
- Si algo no se probó, decirlo explícitamente.
