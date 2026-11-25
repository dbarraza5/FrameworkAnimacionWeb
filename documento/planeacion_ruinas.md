# Proyecto "Ciudad en ruinas": ciudad apocalíptica de noche con zombis

> Pedido del usuario (2026-11-19): un proyecto nuevo con una ciudad apocalíptica en ruinas, zombis en las calles y de noche.

## La escena "Ciudad en ruinas (noche)" (18 s)

1. Un **sobreviviente** con linterna en la frente avanza por la calle, entre un auto que se quema, escombros y edificios derrumbados.
2. Se esconde detrás de un **auto volcado**. Por la derecha se acercan tres zombis: dos caminando, cojeando y con los brazos estirados, y uno **arrastrándose**.
3. La **farola** chisporrotea y se apaga.
4. El sobreviviente lanza una **bengala**, que vuela en arco con su estela y cae lejos. Los zombis se dan vuelta y van hacia la luz roja.
5. Él se escabulle agachado hasta la **puerta del refugio**. La puerta se abre con luz cálida, él entra y se cierra. Después se enciende una ventana arriba.
6. La cámara termina mostrando a los zombis reunidos alrededor de la bengala.

## Cómo está hecho

- **Generador:** `herramientas/ejemplos/apocalipsis/generar.mjs` escribe `asset_01..27.json` y `escena.json`.
- **Assets (27):**
  - **Cielo y ambiente:** Cielo nocturno, con estrellas que titilan y el brillo de los incendios en el horizonte; Luna; Ruinas lejanas; Niebla baja.
  - **Edificios:** Edificio en ruinas A, B y C, y Edificio del refugio. Son generados con un borde derrumbado, fierros a la vista, grietas y ventanas rotas; algunas tienen la luz del fuego que parpadea.
  - **Calle y objetos:** Calle en ruinas, Escombros, Auto quemado, Auto volcado, Bidón en llamas, Farola, Luz de farola, Semáforo roto, Puerta del refugio, Luz del refugio, Bengala.
  - **Personajes:** sobreviviente caminando, agachado, en sigilo y lanzando; zombis A, B y C (con distinto ritmo, inclinación y ropa) y el Zombi arrastrándose.
- **Técnicas:**
  - **Paralaje con claves:** el cielo, la luna y la silueta lejana acompañan a la cámara en una fracción (`paralaje(x0, f)` copia las claves de la cámara).
  - **Luces apagables:** la luz de la farola es un asset aparte, así que se apaga con claves de opacidad, y su parpadeo es irregular.
  - **Lanzar la bengala:** se usa `bucle: false` con `desfase` igual al instante del lanzamiento, así el brazo hace el movimiento una sola vez.
  - **Zombis que se dan vuelta:** una instancia por dirección (con `espejo`), y se alternan con opacidad.
  - **Fuego y humo:** partículas en el auto, el bidón, un edificio y la bengala, más cenizas.
  - **Niebla:** son bandas translucidas que derivan con claves `x`. La niebla con partículas se veía como manchas sólidas.
- **Sonido:** 10 sonidos sintetizados, provisorios:
  - Viento nocturno, Ambiente tenso, Fuego crepitando, Bengala (los cuatro en bucle);
  - Gemido de zombi, Gemido grave;
  - Pasos sigilosos, Farola que se apaga, Lanzamiento, Puerta.
  - En total, 18 clips en la escena.

## Verificado

- Los 27 assets y la escena validan y se crearon con una llave temporal, que ya se revocó.
- La "Calle en ruinas" se tuvo que simplificar a 356 figuras: con 540 el backend respondía *request entity too large*.
- El render, en 13 instantes, muestra toda la historia.
- `reporte.mjs` da 18 clips y el seguimiento de sonido no tiene avisos.
- Avisos de cámara esperados: dos edificios, unos escombros y dos zombis del fondo quedan a la derecha, fuera del recorrido de la cámara.

**No probado:** abrir la escena en el editor y escuchar la mezcla.
