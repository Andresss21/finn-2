# GLO · hallazgos globales medidos (movimiento, responsive, foco, tokens)

Medidos por el orquestador con `tools/auditoria/casos/90-movimiento.video.ts`, `91-responsive.resp.ts`, `92-foco.cap.ts` y un
barrido del código. Evidencia: `docs/auditoria-diseno/movimiento/RESUMEN.md`, `docs/auditoria-diseno/videos/`,
`docs/auditoria-diseno/foco/*.json`, `docs/auditoria-diseno/analisis/resp-*.md`.

## Lo que está bien (medido)

- Con `prefers-reduced-motion: reduce` no corre ninguna animación ni transición en navegación, hojas, Bandeja, arrastre ni código (`movimiento/*__reducido.json`: todos los momentos vacíos).
- Archivo carga con el eje de ancho (`document.fonts`: `archivo|100 900|62% 125%`) y las cifras computan `font-stretch: 72%`/`80%`. Big Shoulders Display carga en 700 y 800. No hay otra familia.
- Los colores de `apps/web/src/app/tokens.json` coinciden uno a uno con los del diseño (`docs/diseno/entrega-3/estilos/tokens.json`).
- El billete de Listo para asignar: cifras que ruedan 1400 ms con 90 ms entre dígitos (PANTALLAS §2.8).
- Aprobar en la Bandeja: el resultado aparece en el lugar con `fz-pop-in` 340 ms y `--curva-enfasis`, y el contador rebota.
- Hoja Más secciones: sube en 380 ms con `--curva-entrada`, opciones escalonadas cada 40 ms; cierra en 200 ms con `--curva-salida`.
- Sin desplazamiento horizontal en 360, 768 y 1024 px en 37 de 38 pantallas recorridas (la excepción es GLO-06).

## Hallazgos

### GLO-01 · Todas las pantallas entran igual: falta la dirección de §11 — navegación entre pantallas · teléfono y computadora · alta
- **Se ve:** al cambiar de pestaña, abrir un detalle o volver, lo único que corre es `fz-item` (bloques de `main` que suben 8 px, 400 ms, 60 ms entre bloques). Medido en `docs/auditoria-diseno/movimiento/navegacion__video.json` y `navegacion__video-computadora.json`, momentos «pestaña a la derecha», «pestaña a la izquierda», «abrir un detalle» y «volver»; video `docs/auditoria-diseno/videos/navegacion__video.webm`.
- **Debería:** `docs/diseno/01-especificacion/PANTALLAS.md` §11: pestaña a la derecha entra desde 22 px a la derecha con opacidad 0→1 (320 ms, `--curva-estandar`); a la izquierda, igual desde la izquierda; abrir un detalle entra desde 70 px a la derecha (360 ms); volver entra desde 50 px a la izquierda (360 ms). Referencia de comportamiento: `docs/diseno/02-referencias/entrega-1/prototipo/`.
- **Arreglo:** dar a la entrada de pantalla una dirección según la relación entre origen y destino (pestaña a la derecha, a la izquierda, hija, volver) en `apps/web/src/componentes/marco/marco.tsx` y `apps/web/src/componentes/navegacion/pestanas.tsx` / `enlace-finn.tsx`, con keyframes nuevos en `apps/web/src/app/globals.css` que usen `--duracion-transicion` y `--curva-estandar`; el escalonado de bloques `fz-item` queda dentro de la pantalla que entra.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/90-movimiento -g "mov navegacion"` registra en cada uno de esos cuatro momentos una animación de `translateX` sobre el contenedor de la pantalla, con el signo y la distancia de §11, y sigue vacío en la corrida reducida.

### GLO-02 · Registrar abre sin ninguna animación — /registrar · teléfono y computadora · alta
- **Se ve:** al tocar «Registrar» la pantalla cambia de golpe: cero animaciones en el momento «abrir Registrar (flujo largo)» (`docs/auditoria-diseno/movimiento/navegacion__video.json` y `navegacion__video-computadora.json`).
- **Debería:** PANTALLAS §11: «Registrar → flujo largo: sube desde abajo (420 ms, `--curva-entrada`)»; al cerrar, vuelve a donde estabas con 8 px hacia arriba (300 ms).
- **Arreglo:** animar la entrada de `apps/web/src/componentes/marco/pagina-flujo.tsx` con un keyframe de `translateY(100%)→0` en `apps/web/src/app/globals.css` usando `--duracion-lenta` y `--curva-entrada`, detrás de `prefers-reduced-motion`.
- **Cómo verificar:** el momento «abrir Registrar» registra una animación de `translateY` de 400–420 ms con `cubic-bezier(0.2, 0.9, 0.25, 1)`; la corrida reducida sigue vacía.

### GLO-03 · El panel de notificaciones cae en 200 ms — campana · teléfono y computadora · media
- **Se ve:** `fz-dr-in` dura 200 ms (`--duracion-salida`) y el velo `fz-v-in` 200 ms (`movimiento/navegacion__video.json`, «abrir el panel de notificaciones»).
- **Debería:** PANTALLAS §11: cae desde arriba en 360 ms (token `--duracion-transicion`, 340 ms, por la tabla de redondeo de `INDICE-entrega-2.md` §3.3); velo en `--duracion-normal` (220 ms); al cerrar sube en 200 ms.
- **Arreglo:** en `apps/web/src/app/globals.css` (regla de `fz-dr-in`, línea ~440) usar `--duracion-transicion` para la entrada y dejar `--duracion-salida` solo para la salida; el velo de entrada (`fz-v-in`, línea ~461) con `--duracion-normal`.
- **Cómo verificar:** el registro muestra `fz-dr-in` 340 ms y `fz-v-in` 220 ms al abrir, 200 ms al cerrar.

### GLO-04 · Las filas de la Bandeja no entran escalonadas — /bandeja · teléfono y computadora · media
- **Se ve:** entra la lista entera como un bloque (`fz-item` sobre `div[role=list]`, retraso 180 ms); las filas no tienen animación propia (`movimiento/bandeja__video.json`, «entrar a la Bandeja»).
- **Debería:** PANTALLAS §2.12: «Las filas entran escalonadas (400 ms, 60 ms entre filas)».
- **Arreglo:** aplicar la entrada escalonada a cada `div[role=listitem]` en `apps/web/src/app/(finn)/bandeja/lista.tsx` con `--duracion-lenta` y `--escalonado-bloque`, con el tope `--tope-escalonado`.
- **Cómo verificar:** el registro muestra una animación por fila con retrasos de 0, 60, 120… ms.

### GLO-05 · En 768 px el contenido queda en 424 px junto a la barra lateral — todas las pantallas · 768 · alta
- **Se ve:** a 768 px ya se usa el marco de computadora: barra lateral de 248 px y `main` de 520 px con 48 px de relleno por lado, o sea 424 px útiles (`docs/auditoria-diseno/analisis/resp-inicio__a7.md`, variante `ancho-768`; captura `docs/auditoria-diseno/capturas/pliegue/resp-inicio__a7__ancho-768.png`). El selector de período del detalle de categoría se parte en cinco líneas (`capturas/pliegue/resp-categoria__a7__ancho-768.png`).
- **Debería:** DECISIONES «Marco y densidad» define el teléfono a 390 y la computadora a 1440 con relleno de 48 px; no define un marco intermedio. Con 424 px útiles el contenido es más angosto que en el teléfono más relleno, y las piezas de computadora no caben.
- **Arreglo:** subir el corte del marco de computadora (el `md:` de `apps/web/src/componentes/marco/marco.tsx` y de los componentes que lo acompañan) a un ancho donde el contenido tenga al menos el del teléfono holgado, o reducir el relleno lateral a `--espacio-6` entre 768 y 1024. Es una decisión de diseño: ver `PROMPT-DISENO.md`.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/91-responsive --project=ancho-768` sin textos partidos en el selector de período ni columnas de menos de 360 px.

### GLO-06 · El detalle de categoría desborda en 768 px — /presupuesto/categorias/[categoriaId] · 768 · alta
- **Se ve:** el documento mide 794 px en una ventana de 768: la tabla del historial sale por la derecha (`table` en x=520, ancho 274) (`docs/auditoria-diseno/analisis/resp-categoria__a7.md`, `ancho-768`).
- **Debería:** DECISIONES, regla de marco: ningún contenido toca ni pasa el borde salvo las filas de filtros.
- **Arreglo:** envolver la tabla equivalente en un contenedor con desplazamiento propio en `apps/web/src/componentes/graficos/tabla-equivalente.tsx`, o colapsar las dos columnas del detalle por debajo de 1024 px en `apps/web/src/app/(finn)/presupuesto/categorias/[categoriaId]/page.tsx`.
- **Cómo verificar:** `desbordeHorizontal: false` en `medidas/resp-categoria__a7__ancho-768.json`.

### GLO-07 · El foco de teclado usa el anillo del navegador en 243 de 346 controles — toda la app · computadora · alta
- **Se ve:** enlaces de la barra lateral, filas, pestañas y la mayoría de los enlaces muestran `outline: auto 1px rgb(16,16,16)` (el anillo por defecto), no el del diseño; solo 102 controles (botones y campos) usan `solid 3px` en `--foco`. Medido en `docs/auditoria-diseno/foco/*.json` (14 pantallas).
- **Debería:** `docs/diseno/02-referencias/entrega-2/componentes/P1-01-boton-secundario-tonal-todos-los-estados__claro.html` y `INDICE-entrega-2.md` §3.1 D1: foco = contorno `--foco` de 2 px, separado 2 px. PANTALLAS §2.2 para campos.
- **Arreglo:** una regla base `:focus-visible` en `apps/web/src/app/globals.css` con `outline` en `--foco` y la separación del token, para que enlaces y filas la hereden; los componentes que ya la traen (`apps/web/src/componentes/base/boton.tsx`, `campo.tsx`) quedan igual.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/92-foco --project=computadora-claro` sin ninguna entrada `auto 1px`.

### GLO-08 · «Conectar los SMS» no muestra ningún foco — Inicio · computadora · media
- **Se ve:** la fila «Conectar los SMS» de Primeros pasos recibe el foco con `outline: none 0px` y sin sombra (`docs/auditoria-diseno/foco/inicio.json`).
- **Debería:** foco visible en todo control (DECISIONES regla 6 y punto 10 de accesibilidad; P1-01).
- **Arreglo:** quitar el `outline-none` de esa fila en `apps/web/src/app/(finn)/page.tsx` (bloque Primeros pasos) y dejar que herede la regla de GLO-07.
- **Cómo verificar:** la entrada de «Conectar los SMS» en `foco/inicio.json` tiene indicador `outline`.

### GLO-09 · Tokens de movimiento con nombres propios en vez de los aprobados — tokens.css · media
- **Se ve:** `apps/web/src/app/tokens.css` define 18 variables que el diseño no tiene (`--duracion-opcion`, `--duracion-entrada-hoja`, `--duracion-salida`, `--duracion-barra`, `--duracion-crecer`, `--duracion-sacudida`, `--escalonado-*`, `--retraso-*`, `--tope-escalonado`, `--duracion-destello`, `--duracion-salida-fila`, `--espera-verificado`, `--duracion-periodo`) y le falta el bloque «Entrega 3 · aprobados de la entrega 2» (`diff` contra `docs/diseno/entrega-3/estilos/tokens.css`, líneas 264–286): `--espacio-0-5`, `--espacio-1-5`, `--despeje-barra-inferior`, `--radio-fino`, `--duracion-grafico`, `--duracion-bucle`, `--duracion-pulso` y los roles `titulo-pantalla-hija`, `titulo-pantalla-computadora`, `cifra-destacada`, `cifra-heroe`.
- **Debería:** DECISIONES regla 1 («Un valor nuevo se propone en `tokens-propuesta.css`») y fila «Tokens de la entrega 2»; `docs/diseno/entrega-3/estilos/tokens-propuesta.css` propone `--duracion-temblor`, `--retardo-cascada`, `--duracion-confirmacion`.
- **Arreglo:** incorporar el bloque aprobado a `apps/web/src/app/tokens.css` y `tokens.json` (y regenerar `apps/web/tailwind.css`), mapear las variables propias a las aprobadas donde el valor coincide (`--duracion-crecer`→`--duracion-grafico`, `--duracion-sacudida`→`--duracion-temblor`, `--escalonado-opcion`→`--retardo-cascada`, `--espera-verificado`→`--duracion-confirmacion`) y proponer el resto en `tokens-propuesta.css`.
- **Cómo verificar:** `diff` entre los dos `tokens.css` sin variables que falten; ninguna variable de la app fuera de `tokens.css` o `tokens-propuesta.css`.

### GLO-10 · Valores sueltos de color en la cara de la tarjeta — componentes de dominio · baja
- **Se ve:** `apps/web/src/componentes/dominio/cara-tarjeta.tsx:11-14,66` (degradados del chip `#F3E3B5…`, `#EEF1F4…`, guilloché `rgba(255,255,255,.07)`, sombra `rgba(0,0,0,.18)`), `apps/web/src/componentes/dominio/colores-tarjeta.ts:5-17` (8 hex repetidos de los tokens `--tarjeta-*`) e `identidad-cuenta.tsx:67`.
- **Debería:** DECISIONES regla 1: ningún valor suelto.
- **Arreglo:** leer los colores de la muestra desde `tokens.json` en `colores-tarjeta.ts`; pasar chip, guilloché y luz interior a variables en `tokens-propuesta.css`.
- **Cómo verificar:** `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" apps/web/src/componentes` sin resultados fuera de pruebas.

### GLO-11 · Duraciones sueltas en clases y CSS — billete, halo · baja
- **Se ve:** `animate-[finn-resplandor_6s…]`, `animate-[finn-guilloche_40s…]`, `animate-[finn-brillo_7s…]` y `_8s` en `apps/web/src/componentes/dominio/billete.tsx` y `cara-tarjeta.tsx`; `animation: finn-halo 2.8s` y `animation-delay: 1.4s` en `apps/web/src/app/globals.css:145-148`; `finn-cifra-rueda_1.4s`.
- **Debería:** `INDICE-entrega-2.md` §3.3: 5–8 s → `--duracion-ambiental`; 2.6–2.8 s → `--duracion-pulso`; 1.2–1.4 s → `--duracion-bucle`.
- **Arreglo:** reemplazar por los tokens (dependen de GLO-09).
- **Cómo verificar:** `grep -rnE "_[0-9.]+s_|[0-9.]+s " apps/web/src --include=*.tsx --include=*.css` sin duraciones literales fuera de `tokens.css`.

### GLO-12 · 102 valores arbitrarios de Tailwind — toda la app · baja
- **Se ve:** `h-[180px]`, `h-[206px]`, `size-[22px]`, `right-[92px]`, `text-[2.75rem]`, `text-[1.5rem]`, `tracking-[.14em]`, `blur-[22px]`, rejillas con `40px`, `36px`, `110px`, `103px`, `260px`, `max-w-[1056px]`… (102 usos en `apps/web/src/**/*.tsx`).
- **Debería:** DECISIONES regla 1; `INDICE-entrega-2.md` §3.3 dice qué medida pasa a token y cuál se redondea (1.5rem → `cifra-destacada`, 44 → `--tactil-minimo`, etc.).
- **Arreglo:** pasar a tokens los que tienen uno (roles tipográficos nuevos, `--tactil-minimo`, `--despeje-barra-inferior`) y declarar como constantes de componente, con nombre, los que son geometría propia (cara de la tarjeta 206, chip, talón 103).
- **Cómo verificar:** el recuento de `-[…]` sin `var(--` baja a las constantes de componente documentadas.

### GLO-13 · Arrastrar un movimiento a una categoría no tiene diseño — /bandeja · teléfono y computadora · media
- **Se ve:** al tomar el asa aparece una pastilla flotante «Super · $12.00» y un panel «Destinos del arrastre» con «Sugerida: Super» y «Otra categoría…»; sobre un destino solo cambia el fondo (220 ms); al soltar, la pastilla desaparece sin animación (`dropAnimation={null}`) y el resultado entra con `fz-pop-in`. Capturas `docs/auditoria-diseno/capturas/bandeja__arrastre-tomado__video.png`, `bandeja__arrastre-sobre-destino__video.png`, `bandeja__arrastre-soltado__video.png` (y `__video-computadora`); video `docs/auditoria-diseno/videos/arrastre__video.webm`.
- **Debería:** solo existe la nota de PANTALLAS §7: «Arrastrar a una categoría es un atajo; los botones siempre están». No hay referencia del estado ni fila en §11. SIN DISEÑO.
- **Arreglo:** ninguno en la app hasta que exista el diseño (ver `SIN-DISENO.md` y `PROMPT-DISENO.md`); después, `apps/web/src/app/(finn)/bandeja/arrastre.tsx`.
- **Cómo verificar:** existe la referencia y la app coincide con ella. A confirmar en un teléfono real: en la captura la pastilla queda cerca de la fila de origen con el cursor ya sobre el destino.
