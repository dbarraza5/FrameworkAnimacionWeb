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

**Proyecto "P.U.L.S.E"** ([`planeacion_pulse.md`](planeacion_pulse.md)): ambientación del juego del usuario (nave industrial).
- 20 assets: muro, tubería, torres, pasarelas, operario en 3 poses, araña robot, torreta, vórtices, ascensor…
- Escena **P.U.L.S.E (escena)**, con sonidos del juego.
- Escena **Lago radiactivo (escena)** (`lago.mjs`): agua con olas que se desplazan (claves `x` en partes, `ida_vuelta`), resplandor en franjas, barriles que flotan y partículas (chorro, niebla, géiser).

**Proyecto "Ferro"** ([`planeacion_ferro.md`](planeacion_ferro.md)): puzle de imanes con arte propio. Escena **Ferro: nivel 1**: la bola cambia entre instancias (quieta y rodando), con campos que solo se ven activos y un imán que lleva a la bola por un riel (claves `x` compartidas). El choque contra las cajas es un `disparo` con `impacto: "objeto"`.

**Proyecto "Ciudad en ruinas"** ([`planeacion_ruinas.md`](planeacion_ruinas.md)): ciudad apocalíptica de noche con zombis. Muestra el paralaje con claves que copian las de la cámara, una luz apagable como asset aparte, una acción de una sola vez (`bucle: false` + `desfase`) y niebla de bandas translúcidas. (Con el límite viejo, de 100 kB, un asset de unas 540 figuras no entraba; hoy el backend acepta 15 MB.)

**Proyecto "Rostro"** ([`planeacion_rostro.md`](planeacion_rostro.md)): mujer que habla. La boca tiene 9 visemas como instancias que se prenden con opacidad `mantener`, según `labios(texto)`. La misma línea de tiempo sintetiza la voz. Las partes de la cabeza son objetos con el mismo origen y las mismas claves, y la escena usa `profundidad: false` para que el orden por altura no tape las cejas. **"Lía 2"** (`ejemplos/rostro2/`) es la versión con las mejoras: una sola boca con morphing, un pivote "Cabeza" con `padre`, degradados, desenfoque, mezcla y una voz por formantes en cascada. Para revisar un generador **sin guardar nada**: `node herramientas/pruebas/render_memoria.mjs <carpeta> --t 0,1000 --hoja /tmp/render/x.png [--recorte x,y,w,h]`. **Rendimiento:** un desenfoque grande es caro (unos 0,7 s por cuadro a 1280 px con varios); para manchas de luz o sombra conviene un círculo con degradado radial hasta transparente (`rgba(…,0)`).
- Se generan con `herramientas/ejemplos/pulse/generar.mjs`.
- Piso principal en y 500 y nivel alto en y 260. Boca del cañón del operario apuntando: `[46, −67]` desde los pies. Boca de la torreta: `[−64, −22]`.
- Para desarmar un objeto entero con un disparo: `impacto: "objeto"`, fuerza ≈ 350–400. Con `"pieza"` se suelta una sola pieza.

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
$H "$K npm run autoria -- catalogo"                                  # assets, y escenas por capítulo (* = principal)
$H "$K npm run autoria -- validar  herramientas/ejemplos/molino.json"
$H "$K npm run autoria -- crear    herramientas/ejemplos/molino.json"  # asset = dibujo + eventos; escena = eventos
$H "$K npm run autoria -- crear    escena.json --capitulo \"Capítulo 1\""   # la escena queda al final del capítulo (se crea si no existe)
$H "$K npm run autoria -- capitulo \"<escena>\" \"Capítulo 2\""           # mover de capítulo (o --sin-capitulo); solo escenas
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
- **Calidad** ([`planeacion_calidad.md`](planeacion_calidad.md)). Son campos opcionales; sin ellos todo se dibuja igual que antes.
  - **`precision: "decimal"` en la escena:** usarlo siempre en escenas nuevas con personajes escalados o con zoom de cámara. Sin el campo, el motor redondea cada punto a enteros, y con escala por zoom los detalles chicos (ojos, bocas) se escalonan.
  - **Para mirar la calidad**, usar PNG a resolución completa, no GIF: el GIF tiene 256 colores y escalona los degradados.
  - **Al actualizar por nombre**, buscar el **nombre exacto** en el catálogo. "Lía 2" también aparece dentro de "Estudio (Lía 2)".
  - **Morphing:** una parte con `formas: {a: {poligono: …}, o: {…}}` y `claves: {forma: [[t, "a"], [t2, "o", "suave"], [t3, ""]]}`. Entre clave y clave, los puntos se interpolan; `""` es la forma base de la parte. Todas las formas deben tener **la misma cantidad de puntos** (si no, salta y el validador avisa). Sirve para bocas, párpados, llamas, agua o telas, y reemplaza "un asset por visema".
  - **Morphing de color** ([`planeacion_capacidades.md`](planeacion_capacidades.md), fase 1):
    - `colores: {tarde: {degradado: …}, noche: "#0b1530"}` + `claves.forma` anima **solo el color**, con la misma geometría (cielo, luces, metal caliente, rubor).
    - En `formas`, una forma con `color`, `borde` o `degradado` también interpola el color.
    - Los degradados se interpolan si tienen el mismo tipo y la misma cantidad de paradas.
    - Para brillos con degradado radial, el círculo tiene que medir **al menos** el radio mayor del degradado; si no, se ve un borde duro.
    - Ejemplo: `herramientas/ejemplos/color/`.
    - También funciona en **objetos dibujados de la escena** (no en instancias): por ejemplo, el cielo que se aclara con un relámpago en `ejemplos/lluvia/`.
  - **IK de dos huesos** (fase 2): en el primer hueso, `ik: {hasta, punta, objetivo, doblez, orientar}`, y el objetivo es una parte vacía con claves `x`/`y`.
    - Pies que no patinan: el objetivo del pie apoyado tiene claves constantes. Si se baja la cadera, las rodillas se doblan solas.
    - `ik_peso` (0..1) pasa de claves a IK.
    - Que la cadera quede algo más baja que la pierna estirada; si no, el pie se despega.
    - Ejemplo: `herramientas/ejemplos/ik/`.
  - **Inercia** (fase 3): en una parte con `pivote` donde se sujeta, `inercia: {rigidez, amortiguacion, limite, fuerza}`. Sirve para pelo, colas, bufandas, orejas, antenas y carteles.
    - Las cadenas se arman con segmentos anidados, cada uno con su pivote.
    - **No** se le ponen claves a lo que cuelga: reacciona solo al movimiento con claves de la escena y de sus padres.
    - Ejemplo: `herramientas/ejemplos/inercia/`.
  - **Cosas que tienen que encajar entre sí** (un bote sobre una ola, un sedal entre la caña y el pez, fase 9, `ejemplos/pesca/`): escribir el movimiento como funciones del tiempo en el generador y **muestrearlas en claves** (cada 50 ms, `lineal`).
    - Un "hilo" entre dos puntos que se mueven es un rect con pivote en un extremo y claves de `x`, `y`, `rotacion` y `escala_y`.
  - **Alas o mecanismos articulados** (fase 8, `ejemplos/dragon/`): una función genera las poses (con la misma cantidad de puntos por parte) y el morphing pasa de una a otra en bucle.
  - **Cámara con `temblor` y claves `x`/`y`:** el temblor se suma al movimiento de la cámara. Antes lo reemplazaba.
  - **Derrumbes con la física** (fase 7, `ejemplos/demolicion/`):
    - Para **soltar piezas sin lanzarlas**, usar una explosión con `umbral: 0.5`, el centro muy lejos debajo del objeto y `radio` justo hasta la altura que se quiere soltar.
    - Varias ondas seguidas sueltan de abajo hacia arriba.
    - Las piezas no chocan entre sí: el polvo (partículas suaves grandes) tapa el montón final.
  - **Sombras proyectadas** (fase 4): en un objeto de escena, `sombra: [{luz: "luz_a", alcance: 560, aplastar: -0.3}, …]`.
    - La luz es un objeto vacío en el foco, o `[x, y]`, o `angulo` para el sol.
    - Con las luces contra el fondo, usar `aplastar` negativo.
    - Ejemplo: `herramientas/ejemplos/sombras/`.
  - **Jerarquía:** un objeto de escena con `padre: "<otro objeto>"` va dentro del otro. Su `en` y sus claves `x`/`y` son relativos al origen del padre, y hereda la posición, la rotación, la escala, la opacidad y la visibilidad.
    - Un pivote sin dibujo es `{nombre: "Cabeza", en, partes: [], claves}`.
    - Los hijos se dibujan junto con el padre, en el orden de su `capa`, y **no se reordenan por profundidad** con el resto. Así se resuelve el problema de Lía sin desactivar `profundidad`.
    - En el editor, los hijos se ven al "entrar" al padre.
  - **Relleno degradado:** `degradado: {tipo: "lineal", de: [x,y], a: [x,y], colores: [[0, "#…"], [1, "#…"]]}` o `{tipo: "radial", centro, radio, colores}`, en coordenadas de la parte. Va en partes y en objetos dibujados.
  - **`desenfoque: px`** (luces, sombras suaves, niebla, fondo fuera de foco) y **`mezcla`**: `suma` o `pantalla` para brillos y luz, `multiplicar` para sombras, además de `superponer`, `aclarar` y `oscurecer`. Se heredan a las partes hijas y sirven también en instancias. Con desenfoque, el relleno sale de color plano (el degradado se ignora).
  - **Partículas:** `suave: "si"` (bordes difusos), `opacidad` (máxima, 0.9 por defecto) y `mezcla: "suma" | "pantalla"`. Con `suave` y `suma` la niebla y el fuego dejan de verse como manchas.
  - **Boca desde un audio:** `node herramientas/labios.mjs voz.wav --formas a=a,e=e,i=i,o=o,u=u,m=m,f=f,cerrada= --desfase <ms>` devuelve `claves.forma` listas para pegar en la parte de la boca.
    - Detecta silencio, las 5 vocales (por formantes), las fricativas (f/s) y los cierres breves (m/b/p).
    - Solo lee **WAV**; un MP3 hay que convertirlo antes.
    - Funciona mejor con una voz limpia. Probado con voces sintéticas de 100 a 260 Hz (`pruebas/labios.test.mjs`).
  - **Límite de tamaño:** el backend acepta hasta 15 MB por request (antes eran 100 kB, unas 500 figuras).
  - **Regresión visual:** `node herramientas/pruebas/regresion.mjs guardar /tmp/base.json` antes de tocar el motor y `… comparar /tmp/base.json` después. Dibuja **todos** los documentos de la base y lista los que cambiaron.
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

## Organización: capítulos (documento/planeacion_organizacion.md)

- **Assets:** son de todo el proyecto, no van en capítulos, y cualquier escena los usa. `--capitulo` con un asset da error.
- **Historias con varias escenas:** crea cada escena con `--capitulo "<nombre>"`. Va quedando al final del capítulo, en el orden en que la creas. El usuario las reordena en la pestaña Escenas.
- **El tipo del catálogo** es el mismo que muestra la página del proyecto: el automático, o el que el usuario eligió a mano. Una escena marcada a mano como asset aparece como asset.
