# Pruebas de capacidad: plan por fases (nov-2026)

Seguimos con lo que dejó [`planeacion_calidad.md`](planeacion_calidad.md). Hay dos tipos de fase: **mejoras del motor** (M) y **escenas de prueba** (E) que las usan.

**Forma de trabajo:** una fase a la vez. Al terminar cada fase, el usuario la revisa y recién entonces se pasa a la siguiente. El orden se puede cambiar.

## Reglas de todas las fases

- **No afectar lo existente:** todo es opcional y aditivo. Antes de tocar el motor se guarda la regresión visual (`herramientas/pruebas/regresion.mjs guardar`) y al terminar se compara. Las animaciones que ya existen deben dar **los mismos píxeles**.
- **Cada fase tiene su propio proyecto** ("Fase N - …"), para no mezclar las cosas. No se modifica nada del usuario.
- Cada fase termina con pruebas automáticas, un render o GIF para revisar, la documentación (guía, Manual si cambia algo visible y este documento) y la lista de **lo que no se probó**.
- Commits solo cuando el usuario los pide.

## Fases

| Fase | Tipo | Qué | Para qué | Estado |
|---|---|---|---|---|
| 1 | M | **Morphing de color** | Que cambien de color el pintado, los degradados y los bordes (sonrojarse, día → noche, metal que se calienta) | **aprobada** (proyecto "Fase 1 - Morphing de color") |
| 2 | M | **Esqueleto con cinemática inversa (IK)** | Brazos y piernas que siguen a una mano o a un pie | **aprobada** (proyecto "Fase 2 - Esqueleto con IK") |
| 3 | M | **Movimiento secundario (inercia)** | Cabello, telas, colas y antenas que siguen el movimiento con retraso y rebote | **aprobada** (proyecto "Fase 3 - Movimiento secundario") |
| 4 | M | **Sombras proyectadas** | Sombras en el piso según la posición de la luz | **aprobada** (proyecto "Fase 4 - Sombras proyectadas") |
| 5 | E | **Dos personajes conversan** | Turnos de habla, miradas, gestos y cortes de cámara | **aprobada** (proyecto "Fase 5 - Dos personajes conversan") |
| 6 | E | **Plano cinematográfico con clima** | Lluvia, relámpagos que iluminan, charcos, profundidad de campo y movimiento de cámara | **aprobada** (proyecto "Fase 6 - Plano de cine con lluvia") |
| 7 | E | **Destrucción encadenada** | Un edificio que se derrumba por partes, con polvo y sonido | **aprobada** (proyecto "Fase 7 - Demolición") |
| 8 | E | **Criatura** | Un dragón con alas articuladas (IK + morphing) que echa fuego | **aprobada** (proyecto "Fase 8 - Dragón") |
| 9 | E | **Pesca en el mar** | Un hombre pesca en un bote: olas, balanceo, caña y sedal, un pez que pica | **aprobada** (proyecto "Fase 9 - Pesca en el mar") |

**Ya existe:** exportar video **con sonido** desde el editor (*Archivo → Exportar video*, `Mp4.js`). No hace falta una fase.

---

## Fase 1 — Morphing de color

**Objetivo:** que las claves `forma` también interpolen los colores, y que haya una forma sencilla de animar solo el color.

1. **Colores en el morphing:** entre dos formas también se interpolan:
   - el color de cada pintado;
   - el color del borde (`color` del grupo);
   - los colores de los degradados que tengan la misma cantidad de paradas.

   Hasta ahora se tomaban siempre de la parte, así que una forma de destino con otro color no cambiaba nada. Ese comportamiento queda igual cuando la forma de destino tiene los **mismos** colores que la parte.
2. **Atajo `colores`:** en el formato simple, `colores: {clave: "#color" | {color, borde, degradado}}`, con las claves de `claves.forma`. Crea formas de destino con la **misma geometría** y otro color. Sirve para animar solo el color: un rubor, una luz que se enciende, el cielo que cambia.
3. **Formato de color:** se aceptan `#rgb`, `#rrggbb` y `rgb()/rgba()`. Si un color no se puede leer, salta a la mitad del tramo en vez de interpolar.

**Verificación**
- Pruebas: interpolación de color, de degradados, el atajo `colores` (ida y vuelta) y colores ilegibles.
- Regresión visual sin cambios.
- Una escena en memoria con el cielo pasando de día a atardecer y a noche, una cara que se sonroja y un metal que pasa a rojo vivo.

### Resultado de la fase 1 (2026-11-19)

**Hecho**
- `Claves.js`:
  - `leerColor`, `interpolarColor` (hex corto, hex largo, `rgb()` y `rgba()`; si un color no se puede leer, salta a la mitad);
  - `interpolarDegradado` (colores, paradas, extremos, centro y radio; con otro tipo u otra cantidad de paradas, salta);
  - `interpolarPintado`.
- `GestionEvento._aplicarClaves`: con `forma_color`, el pintado y el borde se interpolan junto con los puntos. Los contornos son siempre los de la parte.
  - La pose de la instancia lleva `lista_pintado` y `color` **solo** en esas partes.
- **Opt-in por parte** (`forma_color: true`): el compilador lo pone solo cuando alguna forma trae `color`, `borde` o `degradado`, o cuando se usa `colores`. Así, los morphings que ya existen (la boca de Lía 2) siguen igual aunque sus formas de destino tengan otro color guardado.
- Compilador: atajo **`colores: {clave: "#color" | {color, borde, degradado}}`** (misma geometría que la parte). En las formas con color, lo que no se dice se toma de la parte. Errores claros (clave repetida en formas y colores, valor inválido, parte sin forma).
- Descompilador: `forma_color`, y el borde con degradado se conserva exacto.
- Backend: campo `forma_color` en el esquema.
- `render_memoria.mjs` ahora también genera GIF (`--desde --hasta --fps --gif`).
- Ejemplo: `herramientas/ejemplos/color/`. Escena **"Prueba de color"** en el proyecto **"Fase 1 - Morphing de color"**, con 3 assets: *Paisaje que cambia de color*, *Herrero (sonrojo)* y *Yunque y barra*. El reporte no da avisos. Muestra el cielo pasando de día a atardecer y a noche, con sol, halo, estrellas, luna y ventanas que se encienden, y un herrero que calienta una barra (gris → rojo → naranja → blanco) y se sonroja con el calor.

**Verificado**
- 32 pruebas, dos de ellas nuevas para esta fase.
- Regresión: 142 documentos iguales, incluida Lía 2.
- Hoja de cuadros y GIF de la escena.

**No probado**
- En el editor del navegador.
- El render se revisó desde la base, pero no se abrió en el editor.

---

## Fase 2 — Esqueleto con IK

**Formato:** en el primer hueso, `ik: {hasta: "<segundo hueso>", punta: [x, y], objetivo: "<grupo>", doblez?: 1 | -1, orientar?: "<grupo>"}`.
- `hasta`: el segundo hueso, que es hijo directo.
- `punta`: el punto del segundo hueso que llega al objetivo, en sus coordenadas.
- `objetivo`: cualquier grupo; normalmente una parte vacía con claves `x`/`y`.
- `doblez`: hacia qué lado se dobla la articulación.
- `orientar`: hijo del segundo hueso que toma la rotación del objetivo (el pie queda plano).
- Los dos huesos giran sobre su `pivote` (hombro y codo).
- Pista opcional `claves.ik_peso` (0..1): mezcla las claves de rotación con el IK. Así un brazo puede balancearse con claves y pasar a IK para agarrar algo.

### Resultado de la fase 2 (2026-11-19)

**Hecho**
- `src/Clases/EditorEvento/Ik.js`:
  - `resolverDosHuesos`: ley de cosenos. Si el objetivo no se alcanza, el brazo apunta estirado hacia él.
  - `aplicarIk`: el objetivo se lleva al espacio del padre del primer hueso con las transformaciones de la cadena, así funciona aunque el torso esté girado.
- Se calcula en `GestionEvento._aplicarClaves`, después de las claves. Sirve en assets e instancias, porque la pose lleva la rotación.
- La rotación "sin IK" sale de las claves de ese cuadro o del original, nunca del cuadro anterior: el resultado es el mismo sin importar desde dónde se llega a un instante.
- Compilador:
  - campo `ik` y pista `ik_peso`;
  - errores si `hasta` u `orientar` no son hijos directos, si el objetivo no existe o está dentro de la cadena, o si `doblez` es inválido;
  - aviso si un hueso no tiene pivote.
- Descompilador, comparación y esquema del backend (`ik`).
- Ejemplo: `herramientas/ejemplos/ik/`. Escena **"IK: caminar y tomar la manzana"** (9,6 s) en el proyecto **"Fase 2 - Esqueleto con IK"**, con el asset *Caminante (IK)*:
  - camina 8 pasos y los pies apoyados son claves **constantes**, así que no patinan;
  - se agacha: baja la cadera y las rodillas se doblan solas;
  - el brazo pasa de balanceo con claves a IK (`ik_peso`) para tomar la manzana, que después sigue a la mano;
  - se levanta, la mira y la alza.
- **Aprendido:** `doblez` depende de hacia dónde mira el personaje. Con uno que mira a la derecha: piernas `1` (rodilla adelante) y brazos `-1` (codo abajo o atrás).

**Verificado**
- 38 pruebas. Las 6 nuevas de IK prueban que la muñeca llega al objetivo y lo sigue, los dos lados del codo, el objetivo fuera de alcance, el torso girado, `orientar`, `ik_peso`, el determinismo, la validación y la ida y vuelta.
- Regresión: 147 documentos iguales.
- Reporte sin avisos y GIF.

**No probado / límites**
- No se abrió en el editor.
- No hay controles en el editor para crear cadenas (solo el formato simple).
- No contempla espejos ni escalas dentro de la cadena. El espejo de toda la instancia sí funciona, porque se aplica al dibujar.
- Las cadenas son solo de dos huesos.

## Fase 3 — Movimiento secundario

**Formato:** en una parte, `inercia: true | {rigidez?, amortiguacion?, fuerza?, limite?, punta?}`. La parte es un **péndulo con resorte** que cuelga de su `pivote`.
- Cuando el pivote acelera o el padre gira, la parte se queda atrás, rebota y vuelve a su rotación, que es la de sus claves si las tiene.
- `rigidez`: frecuencia natural en Hz (2,5).
- `amortiguacion`: de 0 a 1 (0,25).
- `fuerza` (1) y `limite` en grados (70).
- `punta`: el peso; por defecto, el centro de la parte.
- Las cadenas (un segmento dentro de otro) se suman: cada segmento usa la inercia ya calculada de su padre.

### Resultado de la fase 3 (2026-11-19)

**Hecho**
- `src/Clases/EditorEvento/Inercia.js`: integra sobre una **grilla fija de 1/120 s desde t = 0** y guarda los estados.
  - Es **determinista**: un instante da siempre el mismo resultado, se llegue desde donde se llegue.
  - Si se edita algo de la cadena, la firma cambia y la simulación se rehace.
  - El impulso sale de las claves de la cadena: x, y, rotación y escala de la parte y de sus ancestros.
- **Lo calcula el motor de la escena**, también para las partes de instancias (`GestionEvento._aplicarInercia` + `_relojClaves`, que respeta el desfase, el evento y el bucle de la instancia). Así el pelo de una instancia reacciona al movimiento que le da la escena.
  - El motor de un asset usado como instancia no la calcula, para que no se duplique. El caché no se copia ni se guarda.
- Compilador: campo `inercia` con validación (números, rigidez mayor que 0, campos desconocidos) y aviso si no hay pivote. Descompilador, comparación y esquema del backend.
- `herramientas/lib/motor.mjs`: el paquete del motor se escribe de forma **atómica**. Varios archivos de prueba en paralelo lo rompían al rehacerlo.
- Ejemplo: `herramientas/ejemplos/inercia/` (con `--sin-inercia` para comparar). Escena **"Inercia: skate y perrito"** (9 s) en el proyecto **"Fase 3 - Movimiento secundario"**, con el asset *Skater con perrito*.
  - La chica acelera, salta un bache y frena en seco, y la cámara la sigue.
  - Lo que reacciona solo: la cola de caballo (3 segmentos), la bufanda (2), el llavero, y las orejas y la cola (2) del perro.
- **Aprendido:** en una cadena los ángulos se suman. Hay que bajar `limite` y `fuerza` en los segmentos de la punta (por ejemplo 40, 25 y 20 grados), o la cola da latigazos exagerados.

**Verificado**
- 43 pruebas. Las 5 nuevas de inercia prueban:
  - que se queda atrás al acelerar, se va adelante al frenar y se asienta;
  - el determinismo;
  - que quieta no se mueve;
  - la rigidez y el límite;
  - que en una instancia reacciona al movimiento de la escena;
  - la validación y la ida y vuelta.
- Regresión: 150 documentos iguales.
- Reporte sin avisos, GIF y comparación con y sin inercia.

**No probado / límites**
- No se abrió en el editor.
- No hay controles en el editor.
- La inercia no ve el movimiento de la física, de la IK ni de los movimientos viejos (MRU, etc.), solo el de las claves.
- La primera vez que se salta a un instante lejano, la simulación se calcula hasta ahí: unos 120 pasos por segundo de escena.

## Fase 4 — Sombras proyectadas

**Formato** (en un objeto de escena): `sombra: true | {luz?, alcance?, angulo?, piso?, largo?, aplastar?, opacidad?, desenfoque?, color?} | [ ...una por luz ]`.
- `luz`: `[x, y]` fijo o **el nombre de un objeto** (su origen en cada cuadro), así una luz que se mueve mueve las sombras. Sin `luz`, se usa `angulo` desde la vertical, como el sol.
- `alcance`: a esa distancia horizontal de la luz, la sombra ya no se ve (farolas).
- `piso`: por defecto, donde están los pies (`en[1]`).
- `aplastar`: el alto de la sombra (0,3). **Negativo = cae hacia adelante**, cuando la luz está detrás del objeto, contra el fondo.
- `largo`: multiplica la inclinación.
- Si el objeto se despega del piso (salta), la sombra se aclara y se desenfoca.

### Resultado de la fase 4 (2026-11-19)

**Hecho**
- `ImprimirAnimacion.dibujarSombras`:
  - arma la **silueta de todo el objeto**, con todas sus partes y transformaciones, en un lienzo aparte, para que las partes superpuestas no oscurezcan el doble;
  - la proyecta con una transformación afín sobre el piso: x2 = x + k·(P − y), y2 = P − (P − y)·aplastar;
  - la pega con su opacidad y un desenfoque, usando la sombra del canvas, que funciona en el navegador y en node-canvas.
- **Orden:** cada sombra se dibuja justo después del último objeto de un plano más atrás (el piso, el fondo) y nunca después del propio objeto.
- Modo silueta en `pintarGrupoAnimacion`: color sólido, sin degradado ni desenfoque.
- Compilador:
  - campo `sombra` (una o varias), con `piso` por defecto en los pies;
  - errores si un campo es desconocido, si no es un número o si la luz nombra un objeto que no existe.
- Descompilador, comparación y esquema del backend (`sombra`).
- El reporte usa un contexto falso: la sombra se salta si `getTransform()` no da una matriz.
- Ejemplo: `herramientas/ejemplos/sombras/`. Escena **"Sombras: calle de noche"** (11 s) en el proyecto **"Fase 4 - Sombras proyectadas"**, con los assets *Paseante* y *Farola*.
  - Un paseante cruza bajo dos farolas: cada una le da una sombra que gira, se estira y se desvanece (`alcance`), y entre las dos se ven dos sombras.
  - Una pelota rebota: su sombra queda en el piso y se aclara al subir.
- **Aprendido:**
  - Con las luces contra el fondo, las sombras van hacia adelante (`aplastar` negativo); si no, "suben" por el muro.
  - La luz conviene que sea un objeto vacío en el foco.

**Verificado**
- 49 pruebas. Las 6 nuevas de sombras miden píxeles:
  - sin el campo no hay sombra; la opacidad es exacta;
  - la dirección según la luz; `aplastar` negativo;
  - la luz que se mueve; la sombra más clara en el aire;
  - `alcance`; la silueta única;
  - la validación y la ida y vuelta.
- Regresión: 153 documentos iguales.
- GIF.
- El reporte avisa que `luz_a` y `luz_b` "nunca entran en cuadro". Es esperado, porque son objetos vacíos que marcan la luz.

**No probado / límites**
- No se abrió en el editor y no hay controles en el editor.
- La sombra es de objetos de escena (instancias u objetos dibujados), no de partes sueltas.
- El piso es una línea horizontal: no hay sombras sobre paredes ni escalones.
- La silueta usa un lienzo del tamaño del cuadro por sombra y por cuadro. Con muchas sombras grandes puede ser lento.

## Fase 5 — Dos personajes conversan

**Plan:** proyecto "Fase 5 - Dos personajes conversan". Ana y Bruno, sentados en un banco al atardecer, tienen un diálogo de 4 líneas. Usa todo lo de las fases 1 a 4.
- **Bocas con morphing** sincronizadas a cada texto (`labios()` arma una sola línea de tiempo por personaje).
- **Dos voces sintetizadas** con formantes en cascada: Ana aguda; Bruno grave, con formantes más bajos.
- **Dirección:**
  - quien escucha mira a quien habla, parpadea y asiente;
  - quien habla gesticula con una mano (IK) y levanta las cejas en las preguntas;
  - Bruno toma un sorbo de café: la mano lleva la taza a la boca con IK.
- **Inercia:** mechones y aretes de Ana.
- **Color:** Ana se sonroja con el cumplido final.
- **Cámara:** cortes (claves con `mantener`) entre un plano general y primeros planos de quien habla.

### Resultado de la fase 5 (2026-11-19)

**Hecho:** sin cambios en el motor; solo la escena.
- Generador `herramientas/ejemplos/conversacion/generar.mjs`. Arma dos assets, *Ana (conversación)* y *Bruno (conversación)*, que llevan dentro toda su línea de tiempo (22,7 s, instancias sin bucle): boca, parpadeos, cejas, cabeza, gestos y taza.
- Escena **"Conversación en el banco"** en el proyecto **"Fase 5 - Dos personajes conversan"**, con 4 líneas de diálogo original.
  - **Bocas:** una por personaje, con 9 formas y morphing. `labios(texto)` arma la línea de tiempo de cada uno y `clavesForma` hace las transiciones de unos 70 ms.
  - **Quien escucha** gira la cabeza hacia quien habla y asiente a mitad de la línea. Los dos parpadean.
  - **Quien habla** levanta las cejas al empezar y en las preguntas.
  - **Gestos con IK:** la mano del lado del otro sube y se mueve mientras habla. Codo abajo: `doblez` invertido en ese brazo.
  - **Bruno toma un sorbo de café** mientras Ana habla: la otra mano lleva la taza a la boca con IK, la taza sigue a la mano, él mira la taza y echa la cabeza un poco atrás. El vapor sube en bucle.
  - **Inercia:** los mechones y los aretes de Ana.
  - **Color:** Ana se sonroja con el cumplido (`colores` en el rubor) y los dos sonríen al final.
  - **Cámara:** 7 cortes con claves `mantener`. Plano general → primer plano de Ana → Bruno → los dos → Bruno → reacción de Ana → general.
  - Luz de atardecer: cielo y sol con degradados y `suma`, y luz de borde con `pantalla`.
- **Sonido** (3 clips):
  - "Voz de Ana" y "Voz de Bruno" usan el sintetizador de formantes en cascada de Lía 2, generalizado. Ana: F0 de 232 a 192 Hz. Bruno: F0 de 128 a 102 Hz, con formantes al 84 %. En las preguntas la entonación sube.
  - "Parque al atardecer": viento suave y pájaros, en bucle.
  - Están en paneo: Ana a la izquierda y Bruno a la derecha.

**Verificado**
- Render desde la base, reporte sin avisos (3 clips) y GIF.
- Con `labios.mjs`, la herramienta reconoce el **94 %** de las vocales de Ana y el **100 %** de las de Bruno.
- 49 pruebas y regresión: 153 documentos iguales.

**Aprendido**
- `degradado: radial(...)`, nunca `...radial(...)`: esparcido, mete `colores` en la parte, que choca con el atajo de la fase 1. El validador lo detectó.
- Primer plano a zoom 2,6, centrado en la cara: el otro personaje queda fuera de cuadro.

**No probado:** no se abrió en el editor y no se escuchó (las voces siguen siendo sintéticas).

## Fase 6 — Plano cinematográfico con clima

**Plan:** proyecto "Fase 6 - Plano de cine con lluvia". Un solo plano largo de noche, bajo la lluvia.
- **Cámara:** "grúa" que baja del cielo y el horizonte a la calle y se acerca a una persona con paraguas que camina hasta una farola y se detiene.
- **Lluvia:** 3 capas de profundidad (lejos fina y lenta, cerca gruesa y rápida). Son trazos que se desplazan en bucle.
- **Salpicaduras:** partículas con emisores que barren el piso.
- **Charcos:** reflejo de la farola y ondas que se abren (claves de escala y opacidad).
- **Paraguas:** gotas que caen de su borde (partículas que siguen a la persona).
- **Relámpagos:** rayo en el cielo y destello sobre toda la escena (`suma`). El cielo se aclara y los truenos llegan con retraso.
- **Profundidad de campo:** el horizonte cambia de nítido a borroso (dos copias que se cruzan con opacidad) y los barrotes del primer plano están desenfocados.
- **Sombra** de la persona bajo la farola (fase 4).
- **Sonidos sintetizados:** lluvia en bucle y truenos.

### Resultado de la fase 6 (2026-11-19)

**Hecho**
- `herramientas/ejemplos/lluvia/generar.mjs` y `sonidos_backend.js`, que crea el proyecto y los sonidos y se corre en `backend_container`.
- Escena **"Lluvia de noche (plano)"** (13 s) en el proyecto **"Fase 6 - Plano de cine con lluvia"**. Assets: *Lluvia en capas*, *Persona con paraguas (camina)*, *Persona con paraguas (quieta)* y *Farola mojada*.
- **Un solo plano:**
  - la cámara mira el cielo con un relámpago lejano;
  - baja en grúa a la calle mientras el horizonte se desenfoca (dos copias que se cruzan con opacidad: un cambio de foco con claves);
  - se acerca a la persona, que camina con paraguas y se detiene bajo la farola. Con el último relámpago, la persona mira hacia arriba.
- **Lluvia:** 3 capas de trazos (lejos: finos, lentos y tenues; cerca: gruesos, rápidos y desenfocados). Cada capa se desplaza en bucle con claves `x`/`y` (`repetir`) y sus trazos están en 3 copias apiladas para que el bucle no se note.
- **Salpicaduras:** 3 emisores de partículas que barren la calle muy rápido, así cada gota nace en otro lugar; partículas suaves con `suma`.
- **Gotas del paraguas:** 2 emisores que siguen a la persona.
- **Charcos:** degradado, reflejo de la farola (más fuerte cerca de ella) y 3 ondas por charco que se abren y se desvanecen en bucle.
- **Relámpagos (3):** uno lejano y suave, uno triple y uno simple.
  - El rayo es un zigzag que solo se ve en los picos (opacidad `mantener`).
  - Un destello con `suma` cubre toda la escena.
  - El cielo cambia de color (morphing de color, fase 1). El relámpago lejano lo aclara menos.
- **Profundidad de campo:** barrotes de reja en primer plano con `desenfoque: 7`, más el cambio de foco del horizonte.
- **Sombra** de la persona bajo la farola (fase 4), en las dos instancias.
- **Sonidos** (sintetizados): lluvia en bucle (ruido rosado, gotitas y gotas grandes), un trueno cercano con chasquido y estruendo, y un trueno lejano. Los truenos llegan 0,7 a 2,2 s después del destello.
- **Mejoras generales encontradas en el camino:**
  - El compilador ahora acepta **`formas` y `colores` en objetos dibujados de la escena**, no solo en partes de un asset (por ejemplo, el cielo que cambia de color). En una instancia es un error claro.
  - Las partículas suaves ya no rompen el reporte, cuyo contexto falso no crea degradados.

**Verificado**
- Render y GIF desde la base.
- Reporte: 14 avisos esperados (ventanitas decorativas del horizonte fuera de cuadro y el objeto vacío de la luz).
- 50 pruebas, una nueva para formas y colores en objetos de escena.
- Regresión: 153 documentos iguales.

**No probado:** no se abrió en el editor y no se escucharon los sonidos.

## Fase 7 — Destrucción encadenada

**Plan:** proyecto "Fase 7 - Demolición". Demolición controlada de una torre vieja de 10 pisos, vista desde detrás de una valla con curiosos.
- **Cargas:** explotan en la base en secuencia, con destellos (explosiones chicas con fuerza).
- **Colapso en cadena:** una "onda de liberación" (explosiones débiles de radio creciente, desde muy abajo a la izquierda) suelta los paneles **de abajo hacia arriba**. La torre se hunde piso por piso y se inclina hacia la derecha.
  - La torre es un asset con 40 paneles (4 por piso, con sus ventanas) más el tanque del techo.
  - En la escena tiene `fisica: "desarmar"`.
- **Polvo:** emisores en la base que suben (partículas suaves que crecen) y otros que ruedan por el piso.
- **Cámara:** tiembla (`temblor`) y se acerca despacio.
- **Sonidos sintetizados:**
  - las cargas, en secuencia;
  - el estruendo del derrumbe;
  - los escombros, con `al_tocar_suelo` (hasta 10 golpes, salen de la física);
  - el ambiente de ciudad.

### Resultado de la fase 7 (2026-11-19)

**Hecho:** sin cambios en el motor; usa la física de piezas que ya existía (fase 9A del editor).
- `herramientas/ejemplos/demolicion/generar.mjs` y `sonidos_backend.js`, que crea el proyecto y los sonidos y se corre en `backend_container`.
- Escena **"Demolición de la torre"** (11 s) en el proyecto **"Fase 7 - Demolición"**, con los assets *Torre vieja* (43 piezas: 40 paneles con ventanas, cornisa, tanque y antena) y *Curiosos*.
- **Secuencia:**
  - Plano fijo; los curiosos están detrás de una valla.
  - Explotan 8 cargas en la base, cada 70 ms, con fogonazos (`suma`) y chispas, y la base revienta hacia los costados.
  - **Colapso en cadena:** 12 "ondas de liberación", explosiones débiles de radio creciente cada 45 ms, sueltan los paneles **de abajo hacia arriba**. La torre baja casi en bloque, se aplasta piso por piso y termina como escombros en el suelo.
  - La nube de polvo sube y rueda por el piso.
  - La cámara tiembla (`temblor`) y se acerca despacio. Dos curiosos levantan el brazo.
- **Sonido** (13 clips):
  - "Cargas" (8 estallidos) es un clip de la escena.
  - "Derrumbe" sale de `al_soltarse` de la torre.
  - "Escombros" sale de **`al_tocar_suelo`**: 10 golpes en los instantes en que la física hace caer las piezas.
  - "Ciudad lejana" va en bucle.
  - Los efectos y los objetos decorativos tienen la marca `no_lleva`, así el seguimiento no tiene nada "sin decidir".
- **Aprendido (receta para derrumbes con la física actual, que no tiene choques entre piezas):**
  - **Soltar sin lanzar:** una explosión con `umbral` muy bajo (0,5) y el centro **muy lejos** (20 000 px abajo). La distancia depende casi solo de la altura, así cada onda suelta un piso entero, con el mismo empujón chico, y el piso cae junto.
  - Si el centro queda en diagonal, cada panel recibe un empujón distinto y la torre se deshace en piezas sueltas que flotan.
  - Ondas muy seguidas (45 ms): con 170 ms quedan huecos entre los pisos que caen.
  - El techo (tanque, antena) necesita su propia onda, o queda flotando.
  - El polvo tapa que las piezas se atraviesan al llegar al suelo.

**Verificado**
- Render y GIF desde la base.
- Reporte sin avisos: 43 de 43 piezas sueltas, ninguna fuera de cuadro, 13 clips y 0 "sin decidir".
- 50 pruebas y regresión: 153 documentos iguales.

**No probado:** no se abrió en el editor y no se escuchó.

## Fase 8 — Criatura: un dragón

**Plan:** proyecto "Fase 8 - Dragón". Al atardecer, un dragón llega volando sobre las montañas, queda suspendido en el aire, ruge y le echa fuego a una torre de vigía de madera, que se incendia. Después se va.
- **Alas articuladas:** cada ala tiene hueso, antebrazo, 3 dedos y la membrana con bordes festoneados. Se generan en 8 poses del aleteo (el antebrazo se pliega al subir y se estira al bajar) y el **morphing** pasa de una a otra en bucle. El cuerpo sube y baja con cada aleteo.
- **Cuello con IK** (2 huesos): la cabeza sigue a un objetivo con claves y toma su rotación (`orientar`). La mandíbula se abre al rugir y al echar fuego.
- **Cola con inercia:** 5 segmentos encadenados.
- **Fuego:** partículas suaves con `suma` que salen de la boca hacia la torre, más el resplandor que ilumina.
- **La torre:** se prende (fuego y humo con partículas) y se oscurece hasta quedar carbonizada (morphing de color).
- **Además:** una sombra tenue en el suelo, temblor de cámara con el rugido y sonidos sintetizados (aleteo en bucle, rugido, llamarada, crepitar y viento).

### Resultado de la fase 8 (2026-11-19)

**Hecho**
- `herramientas/ejemplos/dragon/generar.mjs` y `sonidos_backend.js`, que se corre en `backend_container`.
- Escena **"El dragón y la torre"** (13 s) en el proyecto **"Fase 8 - Dragón"**, con el asset *Dragón*.
- **Alas articuladas:** cada ala tiene 7 partes (membrana, brazo, antebrazo, 3 dedos y garra) con **8 poses** generadas por `poseAla(p)`.
  - El ala apunta hacia atrás y barre de +70° a −45°. El antebrazo se pliega al subir y se estira al bajar, y los dedos se abren al bajar.
  - El **morphing** pasa de una pose a la siguiente en bucle (720 ms) y el cuerpo sube y baja con cada aleteo.
  - Hay dos alas: la lejana, más oscura y detrás del cuerpo, y la cercana.
- **Cuello con IK** (2 huesos y `orientar` de la cabeza): la cabeza sigue a un objetivo con claves. Reposo, luego arriba al rugir, luego adelante y abajo al echar fuego, y al final arriba al irse.
- **Mandíbula** que se abre al rugir y al echar fuego. El pecho se infla antes de la llamarada.
- **Cola** de 5 segmentos con **inercia**.
- **Fuego:**
  - llamarada de partículas suaves con `suma` y humo, con resplandor que parpadea;
  - la torre se prende con fuego en 3 alturas, humo y brasas;
  - la torre se **carboniza** (morphing de color de cada madera);
  - hay un resplandor naranja que parpadea.
- Sombra tenue del dragón en el suelo, temblor de cámara con el rugido, y cámara que lo sigue, se acerca al rugido y se abre para el fuego.
- **Sonidos** (5): aleteo en bucle con el mismo período que las alas, rugido (formantes, áspero), llamarada, fuego crepitando y viento de montaña.
- **Arreglo general encontrado en el camino:** la receta `temblor` de la cámara **reemplazaba** las claves `x`/`y` de la cámara, así que la cámara se quedaba quieta en el centro inicial y la torre nunca entraba en cuadro.
  - Ahora el temblor **se suma** al movimiento que ya tenga la cámara.
  - Sin claves propias funciona igual que antes.
  - Hay una prueba nueva.

**Aprendido:** en un ala vista de perfil, el ala apunta hacia atrás (ángulo 180 ± la elevación) y el antebrazo se pliega hacia atrás, restando ángulo. Con el pliegue sumado, el ala colgaba como un triángulo arrugado.

**Verificado**
- Render y GIF desde la base.
- Reporte sin avisos, 5 clips.
- 51 pruebas y regresión: 171 documentos iguales.

**No probado:** no se abrió en el editor y no se escuchó.

## Fase 9 — Pesca en el mar

**Plan:** proyecto "Fase 9 - Pesca en el mar". Por la mañana, un hombre pesca desde un bote de remos.
- **El mar:** 3 capas de olas senoidales que avanzan en bucle (claves `x` con `repetir`). La de adelante tapa la parte del casco que queda bajo el agua. Destellos del sol en el agua (`suma`, opacidad que titila).
- **El bote** sube, baja y se balancea con **la misma fórmula** que dibuja la ola donde está (altura y pendiente), muestreada en claves.
- **El hombre** sostiene la caña con las dos manos (**IK**: los objetivos son los puños de la caña, que giran con ella) y se echa hacia atrás al pelear.
- **La caña:** 3 tramos que se curvan cuando el pez tira y se enderezan.
- **El sedal:** une siempre la punta de la caña con el corcho, el pez bajo el agua o el pez colgando. Es un trazo con claves de posición, rotación y largo, calculadas cuadro a cuadro a partir del movimiento del bote y de la caña.
- **La historia:**
  - el corcho flota con las olas;
  - el pez mordisquea (dos tirones chicos) y después lo hunde;
  - el hombre tira y hay una pelea bajo el agua;
  - el pez **salta** fuera con salpicaduras y ondas;
  - al final lo sube colgando y el pez coletea.
- **Además:** gaviotas con alas que aletean (morphing).
- **Sonidos sintetizados:** mar, gaviotas, carrete, chapuzón y salpicadura.

### Resultado de la fase 9 (2026-11-19)

**Hecho:** sin cambios en el motor.
- `herramientas/ejemplos/pesca/generar.mjs` y `sonidos_backend.js`, que se corre en `backend_container`.
- Escena **"Pescando en el mar"** (14,5 s) en el proyecto **"Fase 9 - Pesca en el mar"**, con los assets *Bote con pescador* y *Gaviota*.
- **Técnica:** todo el movimiento sale de **funciones del tiempo** (ola, bote, caña, extremo del sedal) **muestreadas en claves cada 50 ms**. Así cada cosa encaja con las demás sin que el motor tenga que calcular relaciones.
  - **Olas:** 3 capas senoidales que avanzan en bucle (`x` con `repetir`). La de adelante es semitransparente y tapa el casco bajo el agua.
  - **El bote** usa la misma fórmula que la ola de adelante: su altura y su pendiente. Hay destellos del sol que titilan (`suma`).
  - **Caña:** 3 tramos. La caña entera gira (tirón y alzada) y los tramos 2 y 3 se curvan (`b` y `1,4·b`) cuando el pez tira.
  - **Manos con IK:** los objetivos son los puños de la caña, calculados con el mismo giro.
  - **Sedal:** un trazo con pivote en la punta de la caña, con claves de `x`, `y`, `rotacion` y `escala_y` (el largo) que lo llevan siempre de la punta (calculada desde la pose del bote y de la caña) al otro extremo.
  - El otro extremo es el corcho, después el pez bajo el agua, el salto (parábola) y por último el pez colgando, que se va subiendo.
- **Historia:**
  - el corcho flota con la ola, con ondas;
  - dos tirones chicos y después el pez lo hunde, con salpicadura y onda;
  - el hombre tira y se echa atrás, y la caña se curva en la pelea bajo el agua;
  - el pez **salta**: va de frente al avance, con salpicaduras al salir y al caer;
  - vuelve hacia el bote, sale colgando y coletea (rotación que se apaga);
  - el hombre lo alza y sonríe.
  - Dos gaviotas cruzan con alas que aletean (morphing).
- **Cámara:** plano general; al picar se acerca, sigue el salto y termina en el bote con el pez.
- **Sonidos** (8 clips): mar en bucle (olas y agua contra el casco), gaviotas, carrete (2 veces), chapuzón (2) y salpicadura (2).

**Verificado**
- Render y GIF desde la base.
- Reporte sin avisos: 8 clips y 0 "sin decidir".
- 51 pruebas y regresión: 174 documentos iguales.

**No probado:** no se abrió en el editor y no se escuchó.

---

## Después de las fases: precisión decimal (2026-11-19)

**Problema que vio el usuario:** las escenas más complejas se veían "pixeladas".
- **Causa:** el motor redondea a enteros cada punto de cada figura y la posición de cada grupo (`parseInt`). Con personajes a escala 1,5–1,7 y primeros planos con zoom de 2 a 2,6, cada redondeo se convierte en saltos de 4 a 5 píxeles: ojos, anteojos y bocas se escalonan, y el iris queda casi cuadrado.
- **Otro factor, aunque no del motor:** las vistas previas eran GIF de 560 px con 256 colores, que escalonan los degradados.

**Arreglo (opcional por escena):** `precision: "decimal"` en el formato simple, que se guarda como `escena.precision`.
- `GestionEvento._aplicarPrecision` marca los grupos, incluidas las partes de instancias, con `_decimal`. La marca es **no enumerable**, así que no se guarda ni se copia.
- `numPos` (en `GestionAnimacion.js`) usa decimales para esos grupos en `getCoorRecta`, `getCoorPunto`, `procesarPosicionFinalFiguras`, los círculos, los puntos y el origen de los degradados.
- Sin el campo, todo se redondea como siempre.

**Aplicado a:** las escenas de las 9 fases y "Lía 2". "Lía habla" y las escenas del usuario no se tocaron.

**Verificado**
- 52 pruebas (una nueva: con `decimal` una barra de 0,9 px a x = 640,6 cae en 644,8 con zoom 8; sin el campo, en 640).
- Regresión: solo cambiaron esas escenas. Las demás quedaron iguales.
- Comparación del primer plano de Bruno: escalonado contra liso.

**Incidente:** al actualizar "Lía 2", el script buscaba el nombre con "contiene" y sobrescribió primero el asset "Estudio (Lía 2)" con la escena.
- Se restauró con su definición original (`ejemplos/rostro2/asset_01.json`). La regresión lo confirma igual a la referencia, y además quedó el respaldo automático.
- El script ahora busca por **nombre exacto**.
