# Auditoría de diseño de la app real

Finn 2.0 tal como corre, comparada pantalla por pantalla y estado por estado con el diseño aprobado de `docs/diseno/` (paquete `finn-diseno-fuente` más la entrega 3, «Salir a la vista», del 10/11/2026). Jerarquía usada: DECISIONES > `tokens.css` > PNG/HTML de referencia > `PANTALLAS.md` > demo. `05-auditoria-previa/` no se usó como fuente.

## Cómo se hizo

- **App real en local**, compilación de producción con la pila de Supabase y el usuario de prueba con segundo factor (`tools/auditoria/servir.mjs`), datos sembrados con operaciones reales del motor (la semilla de A.7 cuando el estado lo permitía, que es la de las referencias).
- **Capturas**: ~420 entradas del inventario en teléfono 390 × 844 a 2× claro y oscuro y computadora 1440 × 900 claro, de página completa y del primer pliegue, con las fuentes cargadas (`capturas/`, ~1.700 archivos). Responsive en 360, 768 y 1024 (38 pantallas). Recorrido completo de un usuario nuevo (32 pasos, llegó al final).
- **Medición**, no a ojo: un medidor en la página (`tools/auditoria/medir.ts`) registra con `getComputedStyle` y `getBoundingClientRect` cada texto (familia, tamaño, peso, interlineado, `font-stretch`, tnum, color, fondo, contraste), cada tocable (tamaño y área real de toque) y cada caja (fondo, radio, sombra, relleno); lo mismo se midió en los 574 HTML de referencia, y `tools/auditoria/analizar.mjs` cruza ambos contra los tokens (`analisis/`).
- **Movimiento**: videos de los momentos clave y registro cuadro a cuadro de cada animación real, con y sin `prefers-reduced-motion` (`videos/`, `movimiento/RESUMEN.md`). **Foco** con teclado en 14 pantallas (`foco/`).
- **Siete secciones** comparadas por agentes separados (`secciones/10-…` a `70-…`) y un repaso completo de Ajustes (`secciones/71-aju-repaso.md`).
- **Verificación independiente**: un agente que no vio estas conclusiones comparó 30 pantallas por su cuenta, incluidas todas las de acceso, ajustes y flujos (`MUESTRA-VERIFICACION.md`, `verificacion/VERIFICACION.md`). De sus 147 diferencias, 126 ya estaban, 9 se descartaron (datos de la semilla o artefactos) y 12 eran nuevas (`V-01` a `V-10`, `verificacion/CRUCE.md`). Como en Ajustes fueron más de 3, esa sección se repitió entera. `V-01` se comprobó en vivo y obligó a recapturar con margen todos los flujos con carga diferida: solo Editar transacción estaba afectado.

## Resumen

**417 hallazgos; 361 netos** después de consolidar en 15 globales lo que varias secciones reportaron por separado (los absorbidos siguen listados con «Consolidado en: GLO-nn», como pantallas afectadas).

| Severidad | Total | Netos |
|---|---|---|
| crítica | 12 | 6 |
| alta | 102 | 70 |
| media | 190 | 173 |
| baja | 113 | 112 |

| Sección | | crítica | alta | media | baja | total | netos |
|---|---|---|---|---|---|---|---|
| GLO | Global (medido y consolidado) | 2 | 15 | 8 | 3 | 28 | 28 |
| ACC | Acceso | 2 | 3 | 11 | 3 | 19 | 15 |
| GLO-1nn | Marco y estados globales (detalle por pantalla) | 3 | 6 | 9 | 7 | 25 | 15 |
| INI | Inicio | 0 | 5 | 6 | 6 | 17 | 14 |
| PRE | Presupuesto | 0 | 7 | 28 | 12 | 47 | 40 |
| CAT | Detalle de categoría | 0 | 4 | 18 | 11 | 33 | 29 |
| BAN | Bandeja y Revisar movimiento | 1 | 9 | 12 | 7 | 29 | 25 |
| REG | Registrar | 0 | 5 | 9 | 4 | 18 | 16 |
| ACT | Actividad y detalle de transacción | 1 | 14 | 16 | 7 | 38 | 32 |
| REP | Reportes | 0 | 7 | 9 | 7 | 23 | 22 |
| CTA | Cuentas | 1 | 8 | 23 | 17 | 49 | 46 |
| MAS | Metas, Programadas, Por cobrar, Reglas, Notificaciones | 1 | 10 | 26 | 15 | 52 | 44 |
| AJU | Ajustes | 1 | 9 | 15 | 14 | 39 | 35 |

**Lo que está bien, medido:** con «reducir movimiento» no se anima nada; Archivo carga con su eje de ancho y las cifras computan 72 % y 80 %; Big Shoulders en 700 y 800 y ninguna otra familia; los colores de `tokens.json` de la app coinciden uno a uno con los del diseño; el billete de Listo para asignar, aprobar en la Bandeja y la hoja Más secciones se mueven como dice §11; sin desplazamiento horizontal en 37 de 38 pantallas a 360, 768 y 1024; el recorrido de un usuario nuevo llega al final. Las pantallas que están bien figuran como «bien» en `INVENTARIO.md`.

## Las 20 prioridades

| # | Id | Qué | Severidad |
|---|---|---|---|
| 1 | GLO-20 | El código de verificación es un campo único: no hay 6 casillas, no avanza, no reparte el pegado ni se verifica solo (ingresar, inscribir, agregar factor) | crítica |
| 2 | GLO-21 | «Salir» de la entrega 3 no está: ni en Más secciones, ni en la barra lateral, ni en Ajustes; con borradores sale y los borra sin avisar | crítica |
| 3 | ACT-28 | Editar una transacción de una cuenta archivada deja el formulario vacío con «Guardar cambios» activo | crítica |
| 4 | CTA-01 | Editar tarjeta no permite cambiar límite, tasa, corte ni pago, y «Condiciones» de la tarjeta redirige: esos datos no se corrigen en ningún lado | crítica |
| 5 | AJU-15 | Con un solo factor, «Quitar» abre una pantalla que DECISIONES prohíbe; falta el aviso de advertencia con el botón tonal (AJU-14) | crítica |
| 6 | BAN-25 | Revisar una devolución desborda a 446 px en 390 y corta «Cambiar compra» | crítica |
| 7 | GLO-23 | Los flujos cortos de Cuentas, Actividad, Metas, Por cobrar y Reglas abren como página completa en vez de hoja o panel | alta |
| 8 | GLO-24 | La barra no sigue el tipo de pantalla: flujos con campana, subpáginas de Ajustes como flujo, Notificaciones con barra de pestaña | alta |
| 9 | GLO-25 | El título de la pantalla hija va dentro del contenido y se superpone a «Disponible» | alta |
| 10 | GLO-22 | «Registrar» queda solo como «+» en el teléfono de 390 | alta |
| 11 | REG-11 | Registrar gasto con la suma distinta del total: Guardar activo y sin aviso de problema | alta |
| 12 | GLO-28 | El impacto «Antes de guardar» no está en vivo, la app agrega pasos «Revisá el impacto» y muestra códigos crudos «AV-07» | alta |
| 13 | PRE-30 | Asignar edita el valor absoluto con un selector +/−; el diseño suma un monto con opciones rápidas | alta |
| 14 | GLO-27 | Después de asignar, mover o eliminar no queda el resultado en el lugar con «Deshacer» o «Restaurar» | alta |
| 15 | GLO-30 | Tablas que desbordan: tres reportes a 429 px en 390, con la barra superior fuera de pantalla | alta |
| 16 | MAS-112 | «undefined/undefined/» en el campo Fecha de fin de Programadas | alta |
| 17 | REG-01 · CTA-02 | Elegir el tipo (de registro y de cuenta) es una lista de texto o radios; el diseño son tarjetas con ícono | alta |
| 18 | GLO-01 · GLO-02 | Las pantallas entran todas igual (sin la dirección de §11) y Registrar abre sin animación | alta |
| 19 | GLO-26 | Enlaces subrayados donde el diseño pone botón tonal | alta |
| 20 | GLO-07 | El foco de teclado usa el anillo del navegador en 243 de 346 controles | alta |

## Contradicciones (no se resuelven en el código)

Van al agente de diseño o a un CH con las dos citas; están en `PROMPT-DISENO.md`, prioridad 1:

| | Cita A | Cita B | Hallazgos |
|---|---|---|---|
| D-1 | DECISIONES «Marco»: flujos con `max-width: 720px` | `S5-Registrar__computadora-claro.png` y `01-revisar-movimiento/listo__computadora-claro.png`: ~1144 px con dos columnas | BAN-01, REG-16, CAT-32 |
| D-2 | DECISIONES define 390 y 1440 | La app a 768 deja 424 px útiles | GLO-05 |
| D-3 | PANTALLAS §2.8 y §11: «Asignar» abre la hoja | CA-08.11 / P6-26: lleva a Presupuesto filtrado | INI-02, PRE-08 |
| D-4 | S1 y PANTALLAS §4: fila de sobregiro con monto | PF-2 de la app: sin monto | INI-05 |
| D-5 | Diseño 07: asignar en período cerrado es hoja con motivo | CA-10.8: redirige al detalle | PRE-37 |
| D-6 | `07/mover-excede`: bloquea | CA-11.2: acepta con aviso | PRE-41 |
| D-7 | `tableros/S1-Inicio__primer-uso-sin-cuentas.png` | `entrega-2/15-…/primeros-pasos-sin-cuentas` | INI-16 |
| D-8 | `02-actividad`: columna de filtros de 320 px | App y su E2E: 260 px | ACT-07 |
| D-9 | Referencia: «Vuelve a» | App: «Devolver a» | ACT-29 |

## Límites

- Los agentes compararon a ojo todas las pantallas en teléfono claro; en computadora y en oscuro, sobre todo los estados principales y los que el medidor marcaba. El resto de esas variantes quedó cubierto por las medidas (tipografía, color, contraste, márgenes, tocables, desbordes), no por una mirada.
- Sin capturar: el aviso «sin modelo» de Programadas (no se puede sembrar), «cargar más en curso» de Actividad y el aviso «Ver tarjeta →» del panel de notificaciones (la semilla no lo trae).
- `BAN-28` (Revisar un pago de tarjeta muestra el formulario genérico) puede venir de cómo se sembró el caso; confirmalo antes de arreglar.
- El arrastre de la Bandeja se grabó con ratón; en la captura del teléfono la pastilla flotante quedó cerca de la fila de origen y no se comprobó en un teléfono real (GLO-13).

## Otros entregables

`INVENTARIO.md` (cada ruta, pantalla, hoja y estado con su referencia y veredicto) · `SIN-DISENO.md` (lo que la app muestra sin referencia) · `PROMPT-FIXES.md` (para desarrollo) · `PROMPT-DISENO.md` (para el agente de diseño) · `capturas/` · `videos/` · `secciones/` (informes por sección, con su inventario detallado) · `verificacion/`.

## Hallazgos

### Cómo leer cada hallazgo

Formato: `### <ID> · <título> — <pantalla> · <variantes> · <severidad>`, con **Se ve** (captura y medida), **Debería** (referencia exacta), **Arreglo** (componentes, tokens y archivos) y **Cómo verificar**. Las rutas de captura son relativas a `docs/auditoria-diseno/`. Los hallazgos con **Consolidado en: GLO-nn** se arreglan en ese global; quedan acá porque nombran una pantalla afectada. Los `V-nn` salen de la verificación independiente.

## GLO · Global

#### GLO-01 · Todas las pantallas entran igual: falta la dirección de §11 — navegación entre pantallas · teléfono y computadora · alta
- **Se ve:** al cambiar de pestaña, abrir un detalle o volver, lo único que corre es `fz-item` (bloques de `main` que suben 8 px, 400 ms, 60 ms entre bloques). Medido en `docs/auditoria-diseno/movimiento/navegacion__video.json` y `navegacion__video-computadora.json`, momentos «pestaña a la derecha», «pestaña a la izquierda», «abrir un detalle» y «volver»; video `docs/auditoria-diseno/videos/navegacion__video.webm`.
- **Debería:** `docs/diseno/01-especificacion/PANTALLAS.md` §11: pestaña a la derecha entra desde 22 px a la derecha con opacidad 0→1 (320 ms, `--curva-estandar`); a la izquierda, igual desde la izquierda; abrir un detalle entra desde 70 px a la derecha (360 ms); volver entra desde 50 px a la izquierda (360 ms). Referencia de comportamiento: `docs/diseno/02-referencias/entrega-1/prototipo/`.
- **Arreglo:** dar a la entrada de pantalla una dirección según la relación entre origen y destino (pestaña a la derecha, a la izquierda, hija, volver) en `apps/web/src/componentes/marco/marco.tsx` y `apps/web/src/componentes/navegacion/pestanas.tsx` / `enlace-finn.tsx`, con keyframes nuevos en `apps/web/src/app/globals.css` que usen `--duracion-transicion` y `--curva-estandar`; el escalonado de bloques `fz-item` queda dentro de la pantalla que entra.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/90-movimiento -g "mov navegacion"` registra en cada uno de esos cuatro momentos una animación de `translateX` sobre el contenedor de la pantalla, con el signo y la distancia de §11, y sigue vacío en la corrida reducida.

#### GLO-02 · Registrar abre sin ninguna animación — /registrar · teléfono y computadora · alta
- **Se ve:** al tocar «Registrar» la pantalla cambia de golpe: cero animaciones en el momento «abrir Registrar (flujo largo)» (`docs/auditoria-diseno/movimiento/navegacion__video.json` y `navegacion__video-computadora.json`).
- **Debería:** PANTALLAS §11: «Registrar → flujo largo: sube desde abajo (420 ms, `--curva-entrada`)»; al cerrar, vuelve a donde estabas con 8 px hacia arriba (300 ms).
- **Arreglo:** animar la entrada de `apps/web/src/componentes/marco/pagina-flujo.tsx` con un keyframe de `translateY(100%)→0` en `apps/web/src/app/globals.css` usando `--duracion-lenta` y `--curva-entrada`, detrás de `prefers-reduced-motion`.
- **Cómo verificar:** el momento «abrir Registrar» registra una animación de `translateY` de 400–420 ms con `cubic-bezier(0.2, 0.9, 0.25, 1)`; la corrida reducida sigue vacía.

#### GLO-03 · El panel de notificaciones cae en 200 ms — campana · teléfono y computadora · media
- **Se ve:** `fz-dr-in` dura 200 ms (`--duracion-salida`) y el velo `fz-v-in` 200 ms (`movimiento/navegacion__video.json`, «abrir el panel de notificaciones»).
- **Debería:** PANTALLAS §11: cae desde arriba en 360 ms (token `--duracion-transicion`, 340 ms, por la tabla de redondeo de `INDICE-entrega-2.md` §3.3); velo en `--duracion-normal` (220 ms); al cerrar sube en 200 ms.
- **Arreglo:** en `apps/web/src/app/globals.css` (regla de `fz-dr-in`, línea ~440) usar `--duracion-transicion` para la entrada y dejar `--duracion-salida` solo para la salida; el velo de entrada (`fz-v-in`, línea ~461) con `--duracion-normal`.
- **Cómo verificar:** el registro muestra `fz-dr-in` 340 ms y `fz-v-in` 220 ms al abrir, 200 ms al cerrar.

#### GLO-04 · Las filas de la Bandeja no entran escalonadas — /bandeja · teléfono y computadora · media
- **Se ve:** entra la lista entera como un bloque (`fz-item` sobre `div[role=list]`, retraso 180 ms); las filas no tienen animación propia (`movimiento/bandeja__video.json`, «entrar a la Bandeja»).
- **Debería:** PANTALLAS §2.12: «Las filas entran escalonadas (400 ms, 60 ms entre filas)».
- **Arreglo:** aplicar la entrada escalonada a cada `div[role=listitem]` en `apps/web/src/app/(finn)/bandeja/lista.tsx` con `--duracion-lenta` y `--escalonado-bloque`, con el tope `--tope-escalonado`.
- **Cómo verificar:** el registro muestra una animación por fila con retrasos de 0, 60, 120… ms.

#### GLO-05 · En 768 px el contenido queda en 424 px junto a la barra lateral — todas las pantallas · 768 · alta
- **Se ve:** a 768 px ya se usa el marco de computadora: barra lateral de 248 px y `main` de 520 px con 48 px de relleno por lado, o sea 424 px útiles (`docs/auditoria-diseno/analisis/resp-inicio__a7.md`, variante `ancho-768`; captura `docs/auditoria-diseno/capturas/pliegue/resp-inicio__a7__ancho-768.png`). El selector de período del detalle de categoría se parte en cinco líneas (`capturas/pliegue/resp-categoria__a7__ancho-768.png`).
- **Debería:** DECISIONES «Marco y densidad» define el teléfono a 390 y la computadora a 1440 con relleno de 48 px; no define un marco intermedio. Con 424 px útiles el contenido es más angosto que en el teléfono más relleno, y las piezas de computadora no caben.
- **Arreglo:** subir el corte del marco de computadora (el `md:` de `apps/web/src/componentes/marco/marco.tsx` y de los componentes que lo acompañan) a un ancho donde el contenido tenga al menos el del teléfono holgado, o reducir el relleno lateral a `--espacio-6` entre 768 y 1024. Es una decisión de diseño: ver `PROMPT-DISENO.md`.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/91-responsive --project=ancho-768` sin textos partidos en el selector de período ni columnas de menos de 360 px.

#### GLO-06 · El detalle de categoría desborda en 768 px — /presupuesto/categorias/[categoriaId] · 768 · alta
- **Se ve:** el documento mide 794 px en una ventana de 768: la tabla del historial sale por la derecha (`table` en x=520, ancho 274) (`docs/auditoria-diseno/analisis/resp-categoria__a7.md`, `ancho-768`).
- **Debería:** DECISIONES, regla de marco: ningún contenido toca ni pasa el borde salvo las filas de filtros.
- **Arreglo:** envolver la tabla equivalente en un contenedor con desplazamiento propio en `apps/web/src/componentes/graficos/tabla-equivalente.tsx`, o colapsar las dos columnas del detalle por debajo de 1024 px en `apps/web/src/app/(finn)/presupuesto/categorias/[categoriaId]/page.tsx`.
- **Cómo verificar:** `desbordeHorizontal: false` en `medidas/resp-categoria__a7__ancho-768.json`.

#### GLO-07 · El foco de teclado usa el anillo del navegador en 243 de 346 controles — toda la app · computadora · alta
- **Se ve:** enlaces de la barra lateral, filas, pestañas y la mayoría de los enlaces muestran `outline: auto 1px rgb(16,16,16)` (el anillo por defecto), no el del diseño; solo 102 controles (botones y campos) usan `solid 3px` en `--foco`. Medido en `docs/auditoria-diseno/foco/*.json` (14 pantallas).
- **Debería:** `docs/diseno/02-referencias/entrega-2/componentes/P1-01-boton-secundario-tonal-todos-los-estados__claro.html` y `INDICE-entrega-2.md` §3.1 D1: foco = contorno `--foco` de 2 px, separado 2 px. PANTALLAS §2.2 para campos.
- **Arreglo:** una regla base `:focus-visible` en `apps/web/src/app/globals.css` con `outline` en `--foco` y la separación del token, para que enlaces y filas la hereden; los componentes que ya la traen (`apps/web/src/componentes/base/boton.tsx`, `campo.tsx`) quedan igual.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/92-foco --project=computadora-claro` sin ninguna entrada `auto 1px`.

#### GLO-08 · «Conectar los SMS» no muestra ningún foco — Inicio · computadora · media
- **Se ve:** la fila «Conectar los SMS» de Primeros pasos recibe el foco con `outline: none 0px` y sin sombra (`docs/auditoria-diseno/foco/inicio.json`).
- **Debería:** foco visible en todo control (DECISIONES regla 6 y punto 10 de accesibilidad; P1-01).
- **Arreglo:** quitar el `outline-none` de esa fila en `apps/web/src/app/(finn)/page.tsx` (bloque Primeros pasos) y dejar que herede la regla de GLO-07.
- **Cómo verificar:** la entrada de «Conectar los SMS» en `foco/inicio.json` tiene indicador `outline`.

#### GLO-09 · Tokens de movimiento con nombres propios en vez de los aprobados — tokens.css · media
- **Se ve:** `apps/web/src/app/tokens.css` define 18 variables que el diseño no tiene (`--duracion-opcion`, `--duracion-entrada-hoja`, `--duracion-salida`, `--duracion-barra`, `--duracion-crecer`, `--duracion-sacudida`, `--escalonado-*`, `--retraso-*`, `--tope-escalonado`, `--duracion-destello`, `--duracion-salida-fila`, `--espera-verificado`, `--duracion-periodo`) y le falta el bloque «Entrega 3 · aprobados de la entrega 2» (`diff` contra `docs/diseno/entrega-3/estilos/tokens.css`, líneas 264–286): `--espacio-0-5`, `--espacio-1-5`, `--despeje-barra-inferior`, `--radio-fino`, `--duracion-grafico`, `--duracion-bucle`, `--duracion-pulso` y los roles `titulo-pantalla-hija`, `titulo-pantalla-computadora`, `cifra-destacada`, `cifra-heroe`.
- **Debería:** DECISIONES regla 1 («Un valor nuevo se propone en `tokens-propuesta.css`») y fila «Tokens de la entrega 2»; `docs/diseno/entrega-3/estilos/tokens-propuesta.css` propone `--duracion-temblor`, `--retardo-cascada`, `--duracion-confirmacion`.
- **Arreglo:** incorporar el bloque aprobado a `apps/web/src/app/tokens.css` y `tokens.json` (y regenerar `apps/web/tailwind.css`), mapear las variables propias a las aprobadas donde el valor coincide (`--duracion-crecer`→`--duracion-grafico`, `--duracion-sacudida`→`--duracion-temblor`, `--escalonado-opcion`→`--retardo-cascada`, `--espera-verificado`→`--duracion-confirmacion`) y proponer el resto en `tokens-propuesta.css`.
- **Cómo verificar:** `diff` entre los dos `tokens.css` sin variables que falten; ninguna variable de la app fuera de `tokens.css` o `tokens-propuesta.css`.

#### GLO-10 · Valores sueltos de color en la cara de la tarjeta — componentes de dominio · baja
- **Se ve:** `apps/web/src/componentes/dominio/cara-tarjeta.tsx:11-14,66` (degradados del chip `#F3E3B5…`, `#EEF1F4…`, guilloché `rgba(255,255,255,.07)`, sombra `rgba(0,0,0,.18)`), `apps/web/src/componentes/dominio/colores-tarjeta.ts:5-17` (8 hex repetidos de los tokens `--tarjeta-*`) e `identidad-cuenta.tsx:67`.
- **Debería:** DECISIONES regla 1: ningún valor suelto.
- **Arreglo:** leer los colores de la muestra desde `tokens.json` en `colores-tarjeta.ts`; pasar chip, guilloché y luz interior a variables en `tokens-propuesta.css`.
- **Cómo verificar:** `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" apps/web/src/componentes` sin resultados fuera de pruebas.

#### GLO-11 · Duraciones sueltas en clases y CSS — billete, halo · baja
- **Se ve:** `animate-[finn-resplandor_6s…]`, `animate-[finn-guilloche_40s…]`, `animate-[finn-brillo_7s…]` y `_8s` en `apps/web/src/componentes/dominio/billete.tsx` y `cara-tarjeta.tsx`; `animation: finn-halo 2.8s` y `animation-delay: 1.4s` en `apps/web/src/app/globals.css:145-148`; `finn-cifra-rueda_1.4s`.
- **Debería:** `INDICE-entrega-2.md` §3.3: 5–8 s → `--duracion-ambiental`; 2.6–2.8 s → `--duracion-pulso`; 1.2–1.4 s → `--duracion-bucle`.
- **Arreglo:** reemplazar por los tokens (dependen de GLO-09).
- **Cómo verificar:** `grep -rnE "_[0-9.]+s_|[0-9.]+s " apps/web/src --include=*.tsx --include=*.css` sin duraciones literales fuera de `tokens.css`.

#### GLO-12 · 102 valores arbitrarios de Tailwind — toda la app · baja
- **Se ve:** `h-[180px]`, `h-[206px]`, `size-[22px]`, `right-[92px]`, `text-[2.75rem]`, `text-[1.5rem]`, `tracking-[.14em]`, `blur-[22px]`, rejillas con `40px`, `36px`, `110px`, `103px`, `260px`, `max-w-[1056px]`… (102 usos en `apps/web/src/**/*.tsx`).
- **Debería:** DECISIONES regla 1; `INDICE-entrega-2.md` §3.3 dice qué medida pasa a token y cuál se redondea (1.5rem → `cifra-destacada`, 44 → `--tactil-minimo`, etc.).
- **Arreglo:** pasar a tokens los que tienen uno (roles tipográficos nuevos, `--tactil-minimo`, `--despeje-barra-inferior`) y declarar como constantes de componente, con nombre, los que son geometría propia (cara de la tarjeta 206, chip, talón 103).
- **Cómo verificar:** el recuento de `-[…]` sin `var(--` baja a las constantes de componente documentadas.

#### GLO-13 · Arrastrar un movimiento a una categoría no tiene diseño — /bandeja · teléfono y computadora · media
- **Se ve:** al tomar el asa aparece una pastilla flotante «Super · $12.00» y un panel «Destinos del arrastre» con «Sugerida: Super» y «Otra categoría…»; sobre un destino solo cambia el fondo (220 ms); al soltar, la pastilla desaparece sin animación (`dropAnimation={null}`) y el resultado entra con `fz-pop-in`. Capturas `docs/auditoria-diseno/capturas/bandeja__arrastre-tomado__video.png`, `bandeja__arrastre-sobre-destino__video.png`, `bandeja__arrastre-soltado__video.png` (y `__video-computadora`); video `docs/auditoria-diseno/videos/arrastre__video.webm`.
- **Debería:** solo existe la nota de PANTALLAS §7: «Arrastrar a una categoría es un atajo; los botones siempre están». No hay referencia del estado ni fila en §11. SIN DISEÑO.
- **Arreglo:** ninguno en la app hasta que exista el diseño (ver `SIN-DISENO.md` y `PROMPT-DISENO.md`); después, `apps/web/src/app/(finn)/bandeja/arrastre.tsx`.
- **Cómo verificar:** existe la referencia y la app coincide con ella. A confirmar en un teléfono real: en la captura la pastilla queda cerca de la fila de origen con el cursor ya sobre el destino.

#### GLO-20 · El código de verificación es un campo único, no 6 casillas — Verificar, Inscribir y Agregar factor · todas · crítica
- **Se ve:** `EntradaTexto` «Código» en una sola caja; no avanza, no reparte el pegado, no se verifica sola al sexto dígito, el error no tiembla; el recorrido tuvo que tocar «Verificar» a mano. Capturas `capturas/acceso__verificar-vacio__telefono-claro.png`, `acceso__inscribir__telefono-claro.png`, `ajustes-seguridad__agregar-factor__telefono-claro.png`; `movimiento/codigo__video.json` sin ninguna animación. Reúne ACC-01, ACC-02, ACC-03 y AJU-17.
- **Debería:** `docs/diseno/01-especificacion/DECISIONES.md`, fila «Código de verificación (TOTP)»: 6 casillas de 44 × 52; escribir avanza, pegar reparte, Retroceso vuelve; se verifica sola al sexto dígito; casilla llena con línea de 3 px en `--accion`, sube 2 px y pop; error: el grupo tiembla 380 ms y `--problema-borde`; correcto: `--positivo-fondo` en cascada de 40 ms, check con pop y sigue a los 650 ms. Comportamiento en `docs/diseno/04-demo/finn-demo.html`.
- **Arreglo:** un componente `CasillasCodigo` en `apps/web/src/componentes/formularios/` usado por `apps/web/src/app/ingresar/verificar/formulario-verificar.tsx`, `apps/web/src/app/ingresar/inscribir/**` y `apps/web/src/flujos/ajustes-seguridad-factores-nuevo/**`; los tiempos con `--duracion-temblor`, `--retardo-cascada` y `--duracion-confirmacion` (propuestos en `docs/diseno/entrega-3/estilos/tokens-propuesta.css`).
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/90-movimiento -g "mov codigo"` registra el pop por casilla, el temblor de 380 ms y la cascada; la verificación sale sola al sexto dígito sin tocar el botón; 6 tocables de 44 × 52 con etiqueta.

#### GLO-21 · «Salir» de la entrega 3 no está implementado — marco, Ajustes y Seguridad · todas · crítica
- **Se ve:** Salir no está en la hoja Más secciones ni al pie de la barra lateral; Ajustes no tiene la tarjeta Salir y el enlace sigue en Seguridad; con borradores, Salir los borra sin avisar; sin conexión no se deshabilita. Reúne GLO-101, GLO-102, GLO-103, GLO-104, GLO-105, GLO-108 y AJU-02 (ver `secciones/10-acc-glo.md`, tabla «Entrega 3, punto por punto»).
- **Debería:** `docs/diseno/entrega-3/DECISIONES.md`, filas «Salir», «Tenés N cambios sin enviar», «Estados de Salir»; referencias `docs/diseno/entrega-3/pantallas/16-salir/`.
- **Arreglo:** según `docs/diseno/entrega-3/PROMPT-DESARROLLO.md`: fila Salir en `apps/web/src/componentes/navegacion/navegacion-app.tsx` (hoja y barra lateral), tarjeta en `apps/web/src/app/(finn)/ajustes/page.tsx`, quitarlo de `apps/web/src/app/(finn)/ajustes/seguridad/page.tsx`, hoja de cambios sin enviar sobre `apps/web/src/componentes/marco/superpuesto.tsx`.
- **Cómo verificar:** los 11 estados de `16-salir` reproducidos; con 2 borradores, Salir abre la hoja y «Quedarme» no borra nada.

#### GLO-22 · «Registrar» queda solo como «+» a 390 px — barra superior de las pestañas · teléfono · alta
- **Se ve:** la clase `max-[25rem]:sr-only` en `apps/web/src/componentes/navegacion/acceso-registrar.tsx:19` oculta el texto por debajo de 400 px; en el teléfono de 390 se ve un cuadrado azul con «+». Reúne INI-01, BAN-02, GLO-111, ACT-13 y el candidato de CAT. Captura `capturas/inicio__principal__telefono-claro.png`.
- **Debería:** PANTALLAS §3.1 y `docs/diseno/02-referencias/tableros/S1-Inicio__telefono-claro.png`: botón «+ Registrar» de 44 de alto, padding 0 14 0 10, `.t-etiqueta` 700.
- **Arreglo:** quitar el ocultamiento a ese ancho en `acceso-registrar.tsx`; si a 360 no entra, decidirlo con diseño en vez de esconder la etiqueta.
- **Cómo verificar:** a 390 y a 360 px el texto «Registrar» es visible y el título de la pestaña no se corta.

#### GLO-23 · Los flujos cortos abren como página completa — Cuentas, Actividad, Metas, Por cobrar, Reglas · teléfono y computadora · alta
- **Se ve:** pagar tarjeta, pagar cuota, archivar, eliminar, verificar saldo y ordenar (Cuentas); cambiar estado, eliminar y eliminar evento (transacción); nueva y editar meta; cobrar y renombrar; nueva regla: todas con «Cerrar» a pantalla completa. Reúne CTA-04, ACT-32, MAS-001, MAS-128 y MAS-129b.
- **Debería:** `docs/diseno/01-especificacion/INDICE-entrega-2.md` §6: los flujos cortos van en hoja inferior en el teléfono y en panel lateral de 440 px sobre velo en la computadora; PANTALLAS §2.17.
- **Arreglo:** montarlos en el slot `@superpuesto` con rutas interceptadas, como ya hacen asignar, mover y registrar (`apps/web/src/app/(finn)/@superpuesto/(.)…`), con `apps/web/src/componentes/marco/superpuesto.tsx`; la ruta directa queda como respaldo.
- **Cómo verificar:** desde la pantalla de origen cada uno abre un `role="dialog"` sobre el contenido, se cierra con Escape y el velo, y en computadora mide 440 px.

#### GLO-24 · Flujos con campana y barras de pestaña, y pantallas hijas tratadas como flujo — marco · teléfono y computadora · alta
- **Se ve:** en computadora archivar, fusionar, metas y sacar llevan campana y barra lateral (CAT-32); agregar factor lleva campana y barra inferior en el teléfono (AJU-17); al revés, ocho subpáginas de Ajustes usan `PaginaFlujoDeRuta` con «X» y sin campana (AJU-06), y Notificaciones lleva la barra de pestaña (MAS-134).
- **Debería:** DECISIONES «Marco y densidad»: pestañas con Registrar, campana y ☰; hijas con flecha «Volver a <padre>» y campana; Más secciones solo con campana; flujos (todo lo que termina en Guardar, Confirmar o Verificar) sin campana ni barra inferior. Entrega 3, «Campana en Ajustes».
- **Arreglo:** que el tipo de pantalla lo declare cada página y el marco (`apps/web/src/componentes/marco/marco.tsx`, `pagina-flujo.tsx`, `proveedor-encabezado.tsx`) dibuje la barra de ese tipo; pasar las subpáginas de Ajustes de `PaginaFlujoDeRuta` a pantalla hija.
- **Cómo verificar:** el analizador (`node tools/auditoria/analizar.mjs`) no marca «flujo con campana», «flujo con barra inferior», «hija sin Volver» ni «Más secciones con Registrar» en ninguna captura.

#### GLO-25 · El título de la pantalla hija va dentro del contenido y se superpone — pantallas hijas · teléfono · alta
- **Se ve:** en el detalle de categoría el título mide x=80, y=184.6, 60 de alto, encima del rótulo (y=184.6) y de «Disponible» (y=216.2); los títulos largos se cortan («FONDO DE EMERG…»); la barra superior no lleva título. Reúne GLO-113, CAT-01 y PRE-38. Captura `capturas/categoria__principal__telefono-claro.png`.
- **Debería:** DECISIONES «Marco»: la flecha «Volver a <padre>» a la izquierda del título, en la misma fila de la barra superior; PANTALLAS §3.1: título `.t-titulo-pantalla` 1.625rem con atrás, una línea con puntos suspensivos.
- **Arreglo:** `apps/web/src/componentes/navegacion/volver-en-titulo.tsx` y la barra de `apps/web/src/componentes/marco/marco.tsx`: el título de la hija va en la barra; el contenido empieza debajo.
- **Cómo verificar:** en todas las hijas (categoría, cuenta, transacción, gasto semanal, subpáginas de Ajustes) ningún texto del contenido se superpone al título.

#### GLO-26 · Enlaces subrayados donde el diseño pone un botón — toda la app · teléfono y computadora · alta
- **Se ve:** acciones secundarias de las filas de la Bandeja (BAN-04), «Volver a la cuenta» y los bloqueos de archivar y eliminar (CTA-05, CTA-06), «Seguir» al cerrar la inscripción (ACC-15), «Salir» de las sesiones (AJU-18), acciones de aviso (MAS-006, MAS-014) y las acciones de `AvisoEnLinea` de 17–18 px de alto.
- **Debería:** PANTALLAS §2.1 (secundaria tonal, pastilla de acción en filas) y `docs/diseno/02-referencias/entrega-2/componentes/P1-01-boton-secundario-tonal-todos-los-estados__claro.png`; DECISIONES regla 6 (44 × 44).
- **Arreglo:** usar `Boton` variante tonal (o pastilla en filas) de `apps/web/src/componentes/base/boton.tsx` en esos lugares; la acción de `apps/web/src/componentes/base/aviso.tsx` con tocable de 44.
- **Cómo verificar:** cada caso de la lista muestra un botón con fondo `--accion-tonal`; ningún tocable de acción menor de 44 en el analizador.

#### GLO-27 · Falta el resultado en el lugar después de una acción — Presupuesto, Actividad · todas · alta
- **Se ve:** después de asignar, mover, reordenar o eliminar una transacción no queda «Resultado de una acción» con «Deshacer» o «Restaurar»; donde aparece algo, no lleva `role="status"`. Reúne PRE-35, PRE-42, PRE-65, ACT-11 y ACT-12.
- **Debería:** DECISIONES regla 5 y PANTALLAS §2.13 (textos exactos, rebote de 300 ms con `--curva-enfasis`); `docs/diseno/02-referencias/entrega-2/pantallas/07-flujos-del-presupuesto/asignado__telefono-claro.png`.
- **Arreglo:** usar `apps/web/src/componentes/base/resultado.tsx` (el mismo que la Bandeja) en `apps/web/src/flujos/presupuesto-asignar-categoria`, `presupuesto-mover`, `presupuesto-estructura` y `actividad-eliminar`, con `role="status"`.
- **Cómo verificar:** tras cada acción, el resultado queda donde estaba el elemento, no desaparece solo, y `role="status"` > 0.

#### GLO-28 · El impacto «Antes de guardar» no está en vivo y la app agrega pasos «Revisá el impacto» — flujos · todas · alta
- **Se ve:** en Registrar gasto el impacto aparece solo al pulsar Guardar (REG-10); los flujos cortos de Registrar no lo tienen (REG-05); Revisar no muestra «Después de aprobar» (BAN-14); archivar, fusionar, nueva cuenta, editar, eliminar y pagar agregan una pantalla «Revisá el impacto» que el diseño no tiene (CAT-22, CTA, ACT); y el aviso sale como código crudo «AV-07» / «AV-03» (ACT-26).
- **Debería:** DECISIONES «Registrar gasto» (impacto «Antes de guardar» por línea); `docs/diseno/02-referencias/entrega-1/componentes/K4-Dominio-B__confirmacion-del-impacto__claro.html`; el impacto va en la misma pantalla del flujo.
- **Arreglo:** `apps/web/src/componentes/formularios/confirmacion-impacto.tsx` calculado en vivo desde la vista del motor (sin calcular montos en la interfaz, PF-3), en la misma pantalla; textos AV-03 y AV-07 en `apps/web/src/textos/transaccion.ts`. Si el paso aparte se queda, es decisión de diseño (`PROMPT-DISENO.md` ítem 22).
- **Cómo verificar:** al cambiar un monto el impacto cambia sin pulsar Guardar; ningún texto `AV-\d\d` visible.

#### GLO-29 · Márgenes laterales de 16 px en vez de 20 — Bandeja, avisos globales, esqueletos · teléfono · alta
- **Se ve:** 16 px laterales en Bandeja, Revisar y Registrar gasto (BAN-03), en el aviso global sin conexión (GLO-110) y en los esqueletos (GLO-122).
- **Debería:** DECISIONES «Marco y densidad»: 20 px (`--espacio-5`).
- **Arreglo:** el relleno del contenedor de esas pantallas en `apps/web/src/app/(finn)/bandeja/`, `apps/web/src/flujos/registrar-gasto/` y `apps/web/src/componentes/marco/marco.tsx` con `--espacio-5`.
- **Cómo verificar:** `margenIzq` = 20 en las medidas de esas capturas.

#### GLO-30 · Tablas anchas desbordan la página — Reportes y detalle de categoría · teléfono y 768 · alta
- **Se ve:** tendencia como tabla, tarjetas y cumplimiento a 429 px en 390 (REP-09) — la barra superior se estira y Registrar y la campana quedan fuera —, y el historial de categoría a 794 en 768 (GLO-06).
- **Debería:** DECISIONES «Marco»: nada pasa el borde salvo las filas de filtros.
- **Arreglo:** contenedor con desplazamiento propio en `apps/web/src/componentes/graficos/tabla-equivalente.tsx`.
- **Cómo verificar:** `desbordeHorizontal: false` en todas las medidas.

#### GLO-31 · Flujos destructivos con el botón azul de acción — eliminar, quitar, fusionar · todas · alta
- **Se ve:** confirmar eliminar una transacción, un evento y otros destructivos usan el primario `--accion` (ACT-33).
- **Debería:** PANTALLAS §2.1 (botón de peligro) e INDICE-entrega-2 §6: «Eliminar va en el botón `peligro`… Fusionar también usa `peligro`».
- **Arreglo:** `Boton variante="peligro"` en `apps/web/src/flujos/actividad-eliminar`, `actividad-eventos-eliminar`, `cuentas-eliminar` y `presupuesto-categorias-fusionar` (el repaso de Ajustes comprobó que `ajustes-seguridad-factores-quitar` ya usa `--peligro`).
- **Cómo verificar:** fondo `--peligro` en el botón final de cada uno.

#### GLO-32 · Esqueleto de carga genérico y barra sin título en cargando y error — `(finn)` · todas · media
- **Se ve:** un solo `loading.tsx` y `error.tsx` para todas las rutas, con la barra superior sin título y bloques con radio de pastilla (INI-13, INI-14, GLO-122).
- **Debería:** `docs/diseno/02-referencias/entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`; la barra conserva el título de la pantalla.
- **Arreglo:** `loading.tsx` por sección en `apps/web/src/app/(finn)/**` con la forma de su pantalla (falta diseño por pantalla: `PROMPT-DISENO.md` prioridad 3).
- **Cómo verificar:** durante la carga la barra muestra el título y el esqueleto coincide con la pantalla que llega.

#### GLO-33 · Pastillas de filtro, segmentados y selects fuera del componente — toda la app · media
- **Se ve:** pastillas de filtro en 16/400 con la activa fuera de vista (PRE-01, PRE-02); segmentados con segmentos desiguales y la pastilla que sobresale (MAS-010); `<select>` nativo con flecha gruesa en Ciclo, Reglas y formularios (MAS-118); casilla nativa de 48 px donde va interruptor (AJU-12).
- **Debería:** PANTALLAS §2.2 y §2.3; `docs/diseno/02-referencias/entrega-1/componentes/K5-Nuevos__selector-en-pastilla-filtros__claro.html`, `K2-Base__seleccion__claro.html`, `K2-Base__casilla-interruptor-opciones__claro.html`.
- **Arreglo:** `apps/web/src/componentes/base/pastillas.tsx`, `selector-segmentado.tsx`, `seleccion.tsx` y `interruptor-enlace.tsx` según K2/K5, y reemplazar los usos nativos.
- **Cómo verificar:** pastillas de 40 px, 700 la activa; segmentado con opciones iguales; ningún `<select>` sin estilo del juego.

#### GLO-34 · Botones con monto sin espacio y sin el monto — flujos cortos · todas · media
- **Se ve:** «Cubrir$26.30», «Asignar$75.00» (CAT-04) y botones de confirmar sin el monto («Guardar» en vez de «Asignar $75.00», PRE-33).
- **Debería:** PANTALLAS §2.17 («Asignar $75.00») y DECISIONES regla 3.
- **Arreglo:** el texto del botón en `apps/web/src/textos/` con espacio y monto formateado por `apps/web/src/formato/`.
- **Cómo verificar:** ningún botón con `\S\$\d`; los flujos de asignar y mover muestran el monto en el botón.

## ACC · Acceso

#### ACC-01 · El código de verificación es un campo único, no 6 casillas — Verificar · todas · crítica
- **Consolidado en:** GLO-20 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/acceso__verificar-vacio__telefono-claro.png`: un solo campo de texto de ancho completo («Código», `EntradaTexto`, `inputMode="numeric"`). No avanza por casilla, no reparte el pegado, no se verifica sola: el recorrido (`recorrido__03-inicio-primeros-pasos`) tuvo que tocar «Verificar» a mano. Hay temblor (`fz-jitter` 380 ms, medido en `acceso__codigo-incorrecto`) pero sobre el campo.
- **Debería:** DECISIONES, fila «Código de verificación (TOTP)»: 6 casillas de 44 × 52; escribir avanza, pegar reparte, Retroceso vuelve, se verifica sola al sexto dígito; casilla llena con línea de 3 px `--accion`, sube 2 px y pop; error: tiembla 380 ms y `--problema-borde`; correcto: `--positivo-fondo` en cascada de 40 ms, check con pop y sigue a los 650 ms. Referencia visual: `02-referencias/entrega-2/pantallas/13-acceso/verificar__telefono-claro.png`.
- **Arreglo:** componente nuevo `CodigoDeSeisCasillas` en `apps/web/src/componentes/formularios/` (un `input` por casilla con `inputMode="numeric"`, `autoComplete="one-time-code"` en la primera, grupo con `role="group"` y etiqueta «Código»), usado por `app/ingresar/verificar/formulario-verificar.tsx` en lugar de `EntradaTexto`. Tiempos como tokens (`--duracion-temblor`, `--retardo-cascada`, `--duracion-confirmacion`, hoy propuestos).
- **Cómo verificar:** pegar «482193» llena las 6 y envía sola; Retroceso en casilla vacía vuelve a la anterior; con código errado el grupo tiembla 380 ms y las 6 casillas quedan en `--problema-borde`; con `prefers-reduced-motion` no se anima.

#### ACC-02 · Inscribir y agregar factor tampoco tienen las 6 casillas — Inscribir · todas · crítica
- **Consolidado en:** GLO-20 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/acceso__inscribir__telefono-claro.png` y `acceso__inscribir-codigo-incorrecto__telefono-claro.png`: campo único «Código» con botón «Confirmar». `/ingresar/inscribir` y «Agregar un factor de respaldo» usan el mismo componente (`flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx:226`, `EntradaTexto`).
- **Debería:** igual que ACC-01 (DECISIONES cita explícitamente inscribir, verificar y agregar factor).
- **Arreglo:** usar el mismo `CodigoDeSeisCasillas` en `inscribir-factor.tsx`.
- **Cómo verificar:** mismos criterios de ACC-01 en `/ingresar/inscribir` y `/ajustes/seguridad/factores/nuevo`.

#### ACC-03 · El error del código sale como aviso arriba del campo, no en línea bajo las casillas — Verificar e inscribir · todas · alta
- **Consolidado en:** GLO-20 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/acceso__codigo-incorrecto__telefono-claro.png` y `acceso__codigo-vencido__…`: aviso en caja `--problema-fondo` entre la introducción y el campo; el campo queda con el anillo de foco azul, sin `--problema-borde`; el código escrito se borra.
- **Debería:** `13-acceso/codigo-incorrecto__telefono-claro.png` y `codigo-vencido__…`: sin caja; mensaje en línea debajo de las casillas con glifo `problema` y texto en `--problema-texto`; las casillas conservan los dígitos y toman `--problema-borde` (DECISIONES, fila TOTP).
- **Arreglo:** el mensaje pasa a `error` del componente de casillas (patrón de campo con error, PANTALLAS §2.2), no a `AvisoEnLinea`; no limpiar los dígitos al fallar. Archivos: `formulario-verificar.tsx`, `inscribir-factor.tsx`.
- **Cómo verificar:** tras un código incorrecto, el texto aparece bajo las casillas en `--problema-texto` con glifo, las casillas con borde `--problema-borde`, sin caja de fondo.

#### ACC-04 · El título de Ingresar no usa voseo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__ingresar__telefono-claro.png`: «INGRESAR».
- **Debería:** `13-acceso/ingresar__telefono-claro.png`: «INGRESÁ» (DECISIONES regla 4, voseo).
- **Arreglo:** `apps/web/src/textos/ingreso.ts:3`, `tituloIngresar: 'Ingresá'`.
- **Cómo verificar:** el `h1` de `/ingresar` dice «Ingresá».

#### ACC-05 · Título e introducción de Verificar difieren de la referencia — Verificar · todas · baja
- **Se ve:** «VERIFICÁ TU CÓDIGO» / «Escribí el código de 6 dígitos que muestra tu app de autenticación.» y etiqueta visible «Código».
- **Debería:** `13-acceso/verificar__telefono-claro.png`: «CÓDIGO DE VERIFICACIÓN» / «Escribí el código de 6 dígitos de tu app de autenticación.»; sin etiqueta visible sobre las casillas.
- **Arreglo:** `textos/ingreso.ts:14-15`; la etiqueta pasa a `aria-label` del grupo.
- **Cómo verificar:** textos idénticos a la referencia.

#### ACC-06 · En computadora el acceso no está en una tarjeta centrada — Acceso y página sin conexión · computadora-claro · alta
- **Se ve:** `capturas/acceso__verificar-vacio__computadora-claro.png`, `acceso__ingresar__computadora-claro.png`, `estado__sin-conexion-pagina__computadora-claro.png`: columna de 448 px alineada arriba (`main` en y≈64) sobre el fondo, sin contenedor.
- **Debería:** `13-acceso/verificar__computadora-claro.png` y `14-…/sin-conexion-pagina__computadora-claro.png`: tarjeta `--superficie` de unos 420 px con radio de contenedor y elevación, centrada en vertical y horizontal (INDICE-entrega-2 «13 · Acceso»: «tarjeta en computadora»).
- **Arreglo:** `app/ingresar/layout.tsx` (hoy `mx-auto flex min-h-dvh max-w-md … pt-16`) y `app/sin-conexion/layout.tsx`: a partir de `md`, centrar y envolver en un contenedor con `bg-superficie rounded-contenedor shadow-elevacion-…` y padding de 40 px (tokens).
- **Cómo verificar:** a 1440 × 900 la tarjeta queda centrada; en teléfono sigue sin tarjeta con 24 px laterales.

#### ACC-07 · Marca de acceso distinta a la de la referencia — Acceso · todas · media
- **Se ve:** cuadro oscuro redondeado con la «F» y «FINN» de 22 px, peso 700 (analizar: tamaño 22≠32, peso 700≠800, interlineado 25.3≠33.6), `capturas/acceso__ingresar__telefono-claro.png`.
- **Debería:** `13-acceso/ingresar__telefono-claro.png`: símbolo «F apilada» sin cuadro + «FINN» en Big Shoulders de 32 px, 800 (DECISIONES D1–D4: «barra lateral con el símbolo F apilada»).
- **Arreglo:** `apps/web/src/componentes/marco/marca.tsx` con variante `acceso` (símbolo a 32 px, wordmark con el rol `titulo-pantalla`).
- **Cómo verificar:** wordmark medido a 32 px / 800; símbolo sin cuadro.

#### ACC-08 · «Mostrar contraseña» es un enlace centrado inventado — Ingresar · todas · media
- **Se ve:** `acceso__ingresar__telefono-claro.png` y `acceso__ingresar-contrasena-visible__…`: enlace azul «Mostrar contraseña» de ancho completo entre el campo y el botón; empuja el botón 80 px (y=810 contra 700 en la referencia).
- **Debería:** la referencia no tiene control para mostrar la contraseña (SIN DISEÑO para el control).
- **Arreglo:** si se conserva, ícono `eye` de 44 × 44 dentro del campo (patrón PANTALLAS §2.2) con `aria-pressed` y etiqueta «Mostrar contraseña»; `formulario-ingresar.tsx`, `textos/ingreso.ts:6`.
- **Cómo verificar:** botón «Ingresar» a 16 px del campo, como en la referencia.

#### ACC-09 · Párrafo de «sin registro ni recuperación» inventado y con jerga técnica — Ingresar · todas · media
- **Se ve:** «Finn no tiene registro ni recuperación de contraseña en la app. Si la perdiste, seguí el procedimiento del repositorio.» bajo el botón en todas las capturas de Ingresar (`textos/ingreso.ts:13`).
- **Debería:** la referencia no tiene el párrafo; «alta de usuario» y «olvidé mi contraseña» están en FALTANTES sin diseño. «Repositorio» no es lenguaje para quien usa la app.
- **Arreglo:** retirar el párrafo o diseñarlo (FALTANTES `alta-usuario`, `olvide`) con voseo y sin jerga.
- **Cómo verificar:** Ingresar coincide con la referencia (título, 2 campos, botón).

#### ACC-10 · Con «demasiados intentos» el botón Ingresar sigue activo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__demasiados-intentos__telefono-claro.png`: botón azul activo.
- **Debería:** `13-acceso/demasiados-intentos__telefono-claro.png`: botón deshabilitado (`--superficie-hundida`, texto `--texto-deshabilitado`) (PANTALLAS §2.1).
- **Arreglo:** deshabilitar con `disabled` mientras dure el bloqueo en `formulario-ingresar.tsx` (con el motivo ya visible en el aviso).
- **Cómo verificar:** tras el aviso de demasiados intentos, el botón no responde y se ve deshabilitado.

#### ACC-11 · Credenciales inválidas: el campo contraseña no toma el borde de error — Ingresar · todas · media
- **Se ve:** `capturas/acceso__credenciales-invalidas__telefono-claro.png`: el aviso está, ambos campos con la línea gris normal.
- **Debería:** `13-acceso/credenciales-invalidas__telefono-claro.png`: el campo Contraseña con borde de 2 px `--problema-borde` (PANTALLAS §2.2, error).
- **Arreglo:** pasar `invalido` al campo de contraseña cuando el error es de credenciales (`formulario-ingresar.tsx:99`).
- **Cómo verificar:** borde de 2 px `--problema-borde` en Contraseña.

#### ACC-12 · Inscribir: QR y secreto sin la composición de la referencia, y secreto en fuente monoespaciada — Inscribir · todas · media
- **Se ve:** `capturas/acceso__inscribir__telefono-claro.png`: QR suelto sobre el fondo (sin tarjeta), rótulo «Secreto» y la clave en `ui-monospace` (el análisis marca familia ajena) con «Copiar» tonal sin ícono, sin contenedor.
- **Debería:** `13-acceso/inscribir__telefono-claro.png`: QR en tarjeta blanca de radio de contenedor, y la clave en un contenedor `--superficie` con elevación, en Archivo con espaciado, con «Copiar» tonal con ícono `copy` (el ícono de «copiado»: `check`).
- **Arreglo:** `inscribir-factor.tsx:188` (`font-mono` → rol tipográfico de cifra/etiqueta con `tracking`), envolver QR y clave en el contenedor estándar.
- **Cómo verificar:** sin fuentes fuera de los tokens; QR y clave en contenedores.

#### ACC-13 · Inscribir: textos distintos a la referencia — Inscribir · todas · baja
- **Se ve:** «Escaneá el código QR con tu app de autenticación. También podés copiar el secreto y guardarlo en tu gestor de contraseñas.», etiqueta «Código», botón «Confirmar».
- **Debería:** «Escaneá el código con tu app de autenticación o copiá la clave.», etiqueta «Código de la app» con placeholder «6 dígitos» (hasta que lleguen las casillas) y botón «Verificar y entrar».
- **Arreglo:** `textos/ingreso.ts` (bloque inscribir).
- **Cómo verificar:** textos idénticos.

#### ACC-14 · Inscribir y su cierre usan un título más grande que el resto del acceso — Inscribir · todas · media
- **Se ve:** «PROTEGÉ TU CUENTA» y «TU CUENTA QUEDÓ PROTEGIDA» a ≈ 2rem (alto de mayúsculas ≈ 60 px a 2×) frente a «INGRESAR» y «VERIFICÁ TU CÓDIGO» a 1.625rem, en `capturas/acceso__inscribir__…` y `acceso__inscribir-cierre__…`.
- **Debería:** `13-acceso/inscribir__telefono-claro.png`: mismo título que Ingresar y Verificar (`titulo-pantalla-hija`, 1.625rem).
- **Arreglo:** unificar el rol del `h1` en `inscribir-factor.tsx` con el de `formulario-verificar.tsx`.
- **Cómo verificar:** los 4 títulos del acceso miden lo mismo.

#### ACC-15 · Cierre de inscripción sin el aviso positivo y con «Seguir» como enlace — Inscribir (cierre) · todas · alta
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/acceso__inscribir-cierre__telefono-claro.png`: título «TU CUENTA QUEDÓ PROTEGIDA», texto «Te recomendamos agregar un factor de respaldo…», botón tonal «Agregar un factor de respaldo» y enlace «Seguir».
- **Debería:** `13-acceso/inscribir-cierre__telefono-claro.png`: aviso positivo (`--positivo-fondo`, check) «Factor verificado / Listo: tu autenticador quedó inscrito.», texto «Te conviene agregar un factor de respaldo por si perdés el teléfono.», tonal «Agregar un factor de respaldo» y botón principal «Seguir a Finn». Un enlace donde va el botón principal de la pantalla es el error de componente de §2.1; además el cierre es el momento en que DECISIONES pide el check con pop.
- **Arreglo:** `inscribir-factor.tsx` (rama de cierre) + `textos/ingreso.ts:36`: `AvisoEnLinea estado="positivo"` y `Boton` principal.
- **Cómo verificar:** composición idéntica a la referencia, con `role="status"` en el aviso.

#### ACC-16 · Varios factores: lista de radios en lugar del selector de la referencia — Verificar · todas · media
- **Se ve:** `capturas/acceso__verificar-varios-factores__telefono-claro.png`: dos filas con círculo de radio «Factor 1» y «Respaldo», todas visibles; el campo de código debajo con rótulo.
- **Debería:** `13-acceso/verificar-varios-factores__telefono-claro.png`: selector (PANTALLAS §2.2) con ícono `lock` y chevrón, valor «Autenticador», y las casillas debajo.
- **Arreglo:** `formulario-verificar.tsx` (bloque de factor): `Selector` del sistema de campos; nombres de factor con el nombre del factor, no «Factor 1».
- **Cómo verificar:** con 2 factores se ve un selector de 48 px; abierto, lista con `--superficie-elevada` y `check` en la activa.

#### ACC-17 · Dos botones sin nombre accesible en «varios factores» — Verificar · todas · baja
- **Se ve:** el análisis `acceso__verificar-varios-factores.md` marca 2 `button` sin nombre accesible (en x = 36, y = 250 y 298).
- **Debería:** DECISIONES regla 6 y PANTALLAS §11: todo control con etiqueta.
- **Arreglo:** dar `aria-label` o asociar la fila al `radiogroup` en `formulario-verificar.tsx`.
- **Cómo verificar:** el análisis ya no marca tocables sin nombre.

#### ACC-18 · Ingresar sin conexión muestra un aviso de problema y deja el botón activo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__ingresar-sin-conexion__telefono-claro.png`: «Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.» en aviso de problema con el botón activo.
- **Debería:** SIN DISEÑO propio; DECISIONES (Estados de Salir) fija el patrón para un envío sin conexión: control deshabilitado con el motivo «Sin conexión: no se puede …».
- **Arreglo:** `formulario-ingresar.tsx`: deshabilitar con `useConexion` y motivo bajo el botón (§2.1).
- **Cómo verificar:** offline, el botón queda deshabilitado con su motivo; sin aviso de problema.

#### ACC-19 · Sesión vencida: la pantalla es idéntica a Ingresar y no avisa — Ingresar · todas · media
- **Se ve:** `capturas/acceso__sesion-vencida__telefono-claro.png`: Ingresar vacío, sin ninguna indicación de que la sesión venció.
- **Debería:** SIN DISEÑO (FALTANTES `sesion-vencida`); como mínimo, un aviso en línea de advertencia.
- **Arreglo:** diseñar el estado; hasta entonces un `AvisoEnLinea estado="advertencia"` con voseo.
- **Cómo verificar:** al llegar por sesión vencida se ve el motivo.

## GLO-1nn · Marco y estados globales (detalle por pantalla)

#### GLO-101 · «Salir» no está en la hoja Más secciones — Hoja Más secciones · telefono-claro · telefono-oscuro · crítica
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`: Reportes, Metas, Programadas, Por cobrar, Reglas, Notificaciones (2), Ajustes y nada más.
- **Debería:** `entrega-3/pantallas/16-salir/mas-secciones__telefono-claro.png` y DECISIONES entrega 3 («Salir (cerrar sesión)»): última fila separada por una franja `--superficie-hundida` de 8 px, ícono `logout`, sin flecha, color `--texto`.
- **Arreglo:** `apps/web/src/componentes/navegacion/secciones.ts` y `hoja-diferida.tsx`: fila de acción (no `Link`) que invoca `salir()`; con los estados saliendo/error/sin conexión de GLO-108; ícono `logout` nuevo en el juego de íconos.
- **Cómo verificar:** última fila «Salir» de 52 px tras la franja; sale directo a `/ingresar`.

#### GLO-102 · «Salir» no está al pie de la barra lateral — Barra lateral · computadora-claro · crítica
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/marco__pestana__computadora-claro.png`: la lista termina en «Ajustes»; ni correo ni Salir.
- **Debería:** `entrega-3/pantallas/16-salir/mas-secciones__computadora-claro.png`: al pie, bajo una línea `--borde-sutil`, el correo de la sesión y la fila «Salir».
- **Arreglo:** `componentes/marco/marco.tsx` (barra lateral): pie con el correo (de la sesión, no del cliente) y la misma acción de GLO-101.
- **Cómo verificar:** a 1440 px, el pie queda fijo abajo con correo y Salir.

#### GLO-103 · Ajustes no tiene la tarjeta «Salir» — Ajustes · todas · alta
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/marco__ajustes__telefono-claro.png`: 10 filas y nada debajo.
- **Debería:** `entrega-3/pantallas/16-salir/ajustes-indice__telefono-claro.png`: tarjeta propia debajo de la lista, «Salir» con «{correo} · en este dispositivo».
- **Arreglo:** `app/(finn)/ajustes/page.tsx`: tarjeta con fila de acción.
- **Cómo verificar:** la tarjeta aparece bajo la lista, con el correo de la sesión.

#### GLO-104 · El enlace «Salir» sigue en Seguridad — Seguridad · todas · media
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/salir__seguridad__telefono-claro.png` y `…__computadora-claro.png`: enlace azul centrado «Salir» al fondo de la página.
- **Debería:** DECISIONES entrega 3: Seguridad ya no lo lleva (`16-salir/seguridad__*`).
- **Arreglo:** quitarlo de `app/(finn)/ajustes/seguridad/sesiones.tsx`.
- **Cómo verificar:** `/ajustes/seguridad` sin «Salir».

#### GLO-105 · Con borradores, «Salir» sale directo y los borra sin avisar — Seguridad · todas · crítica
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `docs/auditoria-diseno/medidas/_salir-con-borradores__telefono-claro.txt`: con 2 borradores (`finn:borrador:v1:/registrar/gasto` y `/cuentas/nueva`) tras tocar «Salir» la URL es `/ingresar` y `borradoresQueQuedan: 0`. No hay hoja ni panel.
- **Debería:** DECISIONES entrega 3, «Tenés N cambios sin enviar»: hoja inferior (teléfono) o panel de 440 px (computadora) con N, lista de borradores (flujo, detalle, hora), «Seguir» por borrador, «Quedarme» (tonal) y «Salir y borrarlos» en `--peligro`; con uno: «Tenés 1 cambio sin enviar» y «Salir y borrarlo». Referencias: `16-salir/cambios-sin-enviar__*`, `cambios-sin-enviar-uno__*`, `cambios-saliendo__*`, `cambios-error__*`.
- **Arreglo:** flujo corto nuevo en `componentes/navegacion/` que lee las claves `finn:borrador:v1:*` y se abre antes de invocar `salir()`; es el único camino destructivo y debe usar `--peligro`.
- **Cómo verificar:** con 2 borradores, Salir abre la hoja; «Quedarme» la cierra sin tocar nada; «Salir y borrarlos» borra y sale.

#### GLO-106 · Hoja Más secciones: la superficie y la capa no se pueden confirmar sin la fila de Salir — Hoja Más secciones · telefono-claro · baja
- **Se ve:** la hoja cubre la barra inferior (bien) y sus filas miden 52 px con contador «2» (bien), pero termina en «Ajustes» (`capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`); la última fila tiene el espacio bajo ella más ajustado que la referencia (≈ 20 px contra 48 en `mas-secciones__telefono-claro.png`).
- **Debería:** `16-salir/mas-secciones__telefono-claro.png`: 48 px de aire final tras la fila Salir (zona segura).
- **Arreglo:** padding inferior de la hoja en `hoja-diferida.tsx` con `--despeje-barra-inferior`.
- **Cómo verificar:** última fila a 48 px del borde inferior.

#### GLO-107 · Íconos: «Ajustes» y «Apariencia» siguen con el dibujo de sol — Hoja Más secciones, barra lateral, Ajustes · todas · media
- **Se ve:** el ícono de «Ajustes» es un sol de rayos (`capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`, barra lateral de `marco__pestana__computadora-claro.png`, fila Apariencia de `marco__ajustes__telefono-claro.png`).
- **Debería:** entrega 3, «Íconos»: `gear` redibujado como engranaje de 8 dientes; `sun` queda para Apariencia; `logout` nuevo.
- **Arreglo:** actualizar los SVG del juego de íconos (`docs/diseno/entrega-3/iconos/`) en el sistema de íconos de la app y usar `gear` en Ajustes.
- **Cómo verificar:** «Ajustes» con engranaje en las tres ubicaciones; «Apariencia» con `sun`.

#### GLO-108 · Estados de Salir: sin conexión no deshabilita el control — Seguridad (futuro marco) · todas · alta
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/salir__sin-conexion-tras-tocar__telefono-claro.png`: offline el enlace «Salir» sigue activo; al tocarlo aparece un aviso de problema «Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.». «Saliendo…» (`salir__saliendo__…`) existe como botón con texto.
- **Debería:** DECISIONES entrega 3, «Estados de Salir»: saliendo con indicador giratorio y «Saliendo…» con `aria-busy`; sin conexión: Salir deshabilitado con «Sin conexión: no se puede salir ahora.»; referencias `16-salir/mas-secciones-sin-conexion__*`, `-saliendo__*`, `-error__*`.
- **Arreglo:** acción de Salir compartida (hoja, barra lateral, Ajustes) con `useConexion` y el motivo.
- **Cómo verificar:** offline, Salir se ve deshabilitado con el texto exacto; el envío no se intenta.

#### GLO-109 · El aviso «Estás sin conexión» tapa el contenido — Marco · todas · alta
- **Se ve:** `capturas/estado__sin-conexion-en-la-app__telefono-claro.png`, `salir__sin-conexion-tras-tocar__telefono-claro.png` y `pliegue/marco__mas-secciones-sin-conexion__…`: barra oscura `fixed top-16` (`componentes/marco/marco.tsx:124`) sobre el contenido: oculta la etiqueta «LISTO PARA ASIGNAR» y el título «FACTORES» de Seguridad.
- **Debería:** `14-…/sin-conexion-en-la-app__telefono-claro.png`: el aviso ocupa su lugar en el flujo, bajo el título, y el contenido baja; no tapa nada.
- **Arreglo:** en `marco.tsx:124` pasar de `fixed` a un bloque dentro del flujo (o reservar su alto en el contenido).
- **Cómo verificar:** con el aviso visible ningún texto queda cubierto.

#### GLO-110 · El aviso global usa 16 px laterales, no 20 — Marco · telefono-claro · baja
- **Consolidado en:** GLO-29 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `marco.tsx:124`, `inset-x-4`: x = 16 (medido en `estado__sin-conexion-en-la-app__telefono-claro`); lo mismo en el aviso de PWA (GLO-124).
- **Debería:** DECISIONES, Marco: 20 px laterales.
- **Arreglo:** `inset-x-5` o, mejor, dejarlo en el flujo (GLO-109).
- **Cómo verificar:** 20 px a cada lado.

#### GLO-111 · «Registrar» pierde su etiqueta a 390 px — Barra superior · telefono-claro · telefono-oscuro · alta
- **Consolidado en:** GLO-22 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/marco__pestana__telefono-claro.png`: el botón es un cuadro de 44 × 44 con «+»; medido `Registrar` 44 × 44.
- **Debería:** PANTALLAS §3.1 y `K1-Navegacion__telefono-claro.png`: ícono `plus` + «Registrar» `.t-etiqueta` 700, 44 de alto, padding `0 14 0 10` (≈ 110 px de ancho).
- **Arreglo:** `componentes/navegacion/acceso-registrar.tsx:19`: el `max-[25rem]:w-11 max-[25rem]:p-0` oculta el texto en 390 px (25 rem = 400 px). Bajar ese corte (p. ej. 22 rem) y, si no cabe el título, abreviar el título, no el botón.
- **Cómo verificar:** a 390 px el botón mide ≈ 110 × 44 con la etiqueta; el título «PRESUPUESTO» sigue en una línea (o con puntos suspensivos como en `error-de-pantalla__telefono-claro.png`).

#### GLO-112 · El botón central de la Bandeja es más chico que el diseño — Barra inferior · telefono-claro · media
- **Se ve:** botón de ≈ 54 × 54 en `capturas/pliegue/marco__pestana__telefono-claro.png` (medido: tocable 54 de alto, caja 76 × 80) y sin borde de 4 px `--fondo`.
- **Debería:** PANTALLAS §3.1: 62 × 62, radio 18, borde de 4 px `--fondo`, `--elevacion-2`, sube 26 px; contador de 22 px (`K1-Navegacion__telefono-claro.png`).
- **Arreglo:** `componentes/navegacion/pestanas.tsx`.
- **Cómo verificar:** botón de 62 × 62 con borde, 26 px sobre la barra.

#### GLO-113 · En una pantalla hija el título se superpone al contenido y la barra superior no lo lleva — Pantalla hija · telefono-claro · alta
- **Consolidado en:** GLO-25 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/marco__pantalla-hija__telefono-claro.png` (`/presupuesto/categorias/[id]`): la barra tiene flecha, campana y ⋯ pero no título; «SUPERMERCADO» aparece en el cuerpo montado sobre la palabra «Disponible».
- **Debería:** PANTALLAS §3.1: en pantallas hijas la flecha «Volver a <padre>» va a la izquierda del título, en la misma fila (`.t-titulo-pantalla` 1.625rem). Nada se superpone.
- **Arreglo:** `componentes/navegacion/volver-en-titulo.tsx` y `componentes/marco/proveedor-encabezado.tsx`: el título del detalle debe publicarse en la barra; el cuerpo del detalle (`apps/web/src/app/(finn)/presupuesto/categorias/[categoriaId]/`) no repite el `h1` encima del héroe. Repetir con `/cuentas/[id]` y los demás detalles.
- **Cómo verificar:** título junto a la flecha en la barra; sin solapamiento (cajas de `medidas/marco__pantalla-hija__*.json` disjuntas).

#### GLO-114 · El panel de notificaciones tiene un filtro «Todas / Sin leer» que el diseño no tiene — Panel de notificaciones · todas · alta
- **Se ve:** `capturas/notificaciones-panel__con-sin-leer__telefono-claro.png`: selector segmentado «Todas | Sin leer · 2» y debajo, aparte, «Marcar todo como leído».
- **Debería:** `K1-Navegacion__notificaciones-abiertas-n7` (tablero) y PANTALLAS §2.17: una barra con «2 SIN LEER» (`.t-rotulo`) a la izquierda y «Marcar todo como leído» (`--enlace` 700) a la derecha, en una sola fila; al marcar, `check` + «Todo leído».
- **Arreglo:** `app/(finn)/@superpuesto/(.)notificaciones/page.tsx` y `marco/tarjeta-notificaciones.tsx`: quitar el segmentado y poner la barra. Si el filtro se quiere, requiere diseño.
- **Cómo verificar:** una sola fila de barra con el rótulo y el enlace.

#### GLO-115 · Las notificaciones muestran fecha y hora completas, no relativas — Panel de notificaciones · todas · media
- **Se ve:** «15/10/2026 08:00», «14/10/2026 12:00»; la hora larga ocupa el ancho y parte los títulos en 2-3 líneas («Visa Oro corta el / 25/10»).
- **Debería:** `K1-…notificaciones-abiertas-n7.png`: «Hace 2 h», «Hoy 8:00», «Ayer», «13/10», `--texto-terciario`.
- **Arreglo:** formateo relativo en `tarjeta-notificaciones.tsx` (con el reloj inyectado, no `Date.now()`).
- **Cómo verificar:** títulos de una o dos líneas como la referencia.

#### GLO-116 · Notificaciones en tarjetas agrupadas, no en filas planas separadas por línea — Panel de notificaciones · todas · media
- **Se ve:** cada grupo («Nuevas», «Anteriores») dentro de un contenedor `--superficie` con sombra y con el pie en otro bloque gris.
- **Debería:** `K1-…notificaciones-abiertas-n7.png`: filas directas sobre `--superficie-elevada` del panel, grupos separados por una línea `--borde-sutil`; título 700 y texto `.t-cuerpo-pequeno`.
- **Arreglo:** quitar el contenedor de grupo en `tarjeta-notificaciones.tsx`.
- **Cómo verificar:** sin sombras internas; línea de 1 px entre grupos.

#### GLO-117 · El pie del panel agrega texto y le falta la agarradera — Panel de notificaciones · todas · baja
- **Se ve:** pie «… Se guardan las notificaciones de los últimos 180 días.» sin agarradera inferior.
- **Debería:** PANTALLAS §2.17: el texto «Acá llegan recordatorios y avisos de Finn. Los movimientos de tus SMS por revisar están en la Bandeja.» y, en `K1-…n7.png`, la agarradera de 40 × 4 al pie.
- **Arreglo:** `textos/navegacion.ts` (pie) y `marco/superpuesto.tsx`.
- **Cómo verificar:** pie con la frase exacta y agarradera.

#### GLO-119 · 404 dentro de la app sin título en la barra y con otro texto — 404 · telefono-claro · media
- **Se ve:** `capturas/estado__404-dentro__telefono-claro.png`: barra con flecha y campana, sin título; círculo de 72 px con lupa grande; «…o que el enlace ya no sea válido.»; botón «Ir a Cuentas».
- **Debería:** `14-…/no-encontrado__telefono-claro.png`: título de la pantalla («TRANSACCIÓN») junto a la flecha; lupa chica en círculo; «…o que el enlace esté mal.»; «Ir a Actividad» (el padre).
- **Arreglo:** `app/(finn)/not-found.tsx` y `componentes/navegacion/vacios.tsx`: publicar el título, tamaño de ícono 20 px de la referencia, texto.
- **Cómo verificar:** coincide con la referencia.

#### GLO-120 · Error de pantalla: ícono al lado del título y botón sin ícono — Error · telefono-claro · media
- **Se ve:** `capturas/estado__error__telefono-claro.png`: ícono `info` a la izquierda de «Algo salió mal…», tarjeta con el título del marco ausente, botón «Intentar de nuevo» sin ícono.
- **Debería:** `14-…/error-de-pantalla__telefono-claro.png` y `K4-Dominio-B__error-de-pantalla`: ícono arriba, título de la pantalla en la barra (con puntos suspensivos si no cabe), botón con ícono de reintento.
- **Arreglo:** `componentes/navegacion/error-de-pantalla.tsx`.
- **Cómo verificar:** coincide con la referencia.

#### GLO-121 · Página sin conexión: texto y botón distintos — `/sin-conexion` · todas · baja
- **Se ve:** «Finn necesita internet para mostrarte tus números al día.» y botón de 168 px de alto 48; `capturas/estado__sin-conexion-pagina__telefono-claro.png`.
- **Debería:** `14-…/sin-conexion-pagina__telefono-claro.png`: «Finn necesita internet para mostrar tus datos. Cuando vuelva la conexión, intentá de nuevo.»; botón de 164 × 44.
- **Arreglo:** `app/sin-conexion/page.tsx` y `textos/navegacion.ts`.
- **Cómo verificar:** textos iguales.

#### GLO-122 · El esqueleto de carga no tiene la estructura de la pantalla — Cargando · todas · media
- **Consolidado en:** GLO-29 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/estado__cargando__telefono-claro.png`: 3 bloques genéricos con radio de pastilla (completamente redondeados), 16 px laterales, sin título (`app/(finn)/loading.tsx`, `p-4`, `rounded-pastilla`).
- **Debería:** `entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`: bloques con radio de contenedor, 20 px laterales, estructura de la pantalla (título, tarjetas, filas).
- **Arreglo:** `loading.tsx`: `px-5`, `rounded-contenedor`, formas por tipo de pantalla.
- **Cómo verificar:** laterales de 20 px; radios de contenedor.

#### GLO-124 · Aviso de actualización de la PWA: sin diseño — Inicio · todas · baja
- **Se ve:** `capturas/pliegue/estado__actualizacion-pwa__telefono-claro.png`: aviso informativo «Hay una versión nueva de Finn. Recargá para continuar.» con botón «Recargar», 16 px laterales, encima del contenido.
- **Debería:** SIN DISEÑO.
- **Arreglo:** diseñarlo y llevarlo a 20 px laterales (GLO-110).
- **Cómo verificar:** con diseño, igual a la referencia.

#### GLO-125 · Botón deshabilitado a ancho de contenido — Seguridad · telefono-claro · baja
- **Se ve:** `capturas/salir__sin-conexion-tras-tocar__telefono-claro.png`: «Cerrar las otras sesiones» deshabilitado se encoge a ≈ 220 px y su motivo «Sin conexión» queda debajo.
- **Debería:** PANTALLAS §2.1: el tonal mantiene su ancho (todo el ancho) al deshabilitarse; motivo en `.t-cuerpo-pequeno` (como en `14-…/sin-conexion-en-la-app` con «Guardar»).
- **Arreglo:** `sesiones.tsx`: mismo contenedor del botón en ambos estados.
- **Cómo verificar:** ancho constante.

#### GLO-130 · «Todavía no hay categorías» convive con un grupo «Gastos» vacío — Grupos y categorías (paso 15) · telefono-claro · media
- **Se ve:** `capturas/pliegue/recorrido__15-estructura-vacia__telefono-claro.png`: vacío «TODAVÍA NO HAY CATEGORÍAS» y debajo el grupo «GASTOS» con «Este grupo no tiene categorías.» y «Nueva categoría».
- **Debería:** un solo estado vacío coherente (PANTALLAS §2.19); el grupo por defecto no debería mostrarse junto a un vacío que dice que no hay nada.
- **Arreglo:** `app/(finn)/presupuesto/estructura/` (decidir si el vacío cubre todo o se muestra solo la lista).
- **Cómo verificar:** un solo mensaje.

#### GLO-131 · Etiqueta de categoría truncada en «Gasto registrado» — Registrar (paso 30) · telefono-claro · baja
- **Se ve:** `capturas/pliegue/recorrido__30-gasto-guardado__telefono-claro.png`: «SUPERMERC…» con espacio libre a la derecha.
- **Debería:** texto completo («SUPERMERCADO»); la tarjeta tiene sitio.
- **Arreglo:** quitar el límite de ancho en el resultado de `app/(finn)/registrar/gasto`.
- **Cómo verificar:** nombre completo.

**Resultado de cada paso** (`telefono-claro`, 32 de 32 pasos, el recorrido llegó al final; un caso por paso):

| Paso | Qué hace | Resultado | Notas |
|---|---|---|---|
| 01 | Ingresar con contraseña | bien | ACC-04, ACC-07, ACC-08, ACC-09 |
| 02 | Verificar el código | bien | campo único, no 6 casillas (ACC-01) |
| 03 | Inicio con Primeros pasos (0 de 3) | bien | no se verifica sola: hubo que tocar «Verificar» (ACC-01) |
| 04 | Formulario de cuenta nueva | bien | otros agentes (Cuentas) |
| 05-07 | Cuenta corriente, ahorro y billetera | bien | idem |
| 08-09 | Tarjeta (formulario y creada) | bien | idem |
| 10-11 | Préstamo (formulario y creado) | bien | idem |
| 12-13 | Inversión y lista con una cuenta de cada tipo | bien | idem |
| 14 | Inicio con 1 paso hecho | bien | — |
| 15 | Grupos y categorías vacío | bien (funciona) | GLO-130 |
| 16-17 | Plantilla de categorías (47 creadas) | bien | — |
| 18 | Presupuesto con categorías | bien | desde la pantalla «creadas» la salida es «Ir al presupuesto» |
| 19-20 | Conectar los SMS (token) | bien | Ajustes: otro agente |
| 21 | Inicio sin Primeros pasos | bien | desaparece al cumplir los tres |
| 22 | Bandeja con el SMS (contador 1) | bien | márgenes de 16 px en la Bandeja (otro agente) |
| 23-24 | Revisar y aprobar | bien | resultado en el lugar: «Aprobado: Super Selectos · $35.00 · Visa Oro · Supermercado» |
| 25 | Bandeja al día | bien | 0 filas |
| 26-27 | Asignar y presupuesto asignado | bien | — |
| 28 | Selector de Registrar | bien (funciona) | lista de 9 tarjetas de texto, la referencia es una rejilla de 2 columnas con íconos (`12-registrar-tipos-y-flujos-cortos/selector`): para el agente de Registrar |
| 29-30 | Registrar un gasto y guardarlo | bien | GLO-131 |
| 31 | Actividad con 8 transacciones | bien | — |
| 32 | Inicio final | bien | — |

Lo inventado o roto en el camino: el párrafo «sin registro» (ACC-09), el control «Mostrar contraseña» (ACC-08), la ausencia de «Salir» en todo el recorrido (GLO-101 a 103) y el aviso de conexión que tapa contenido (GLO-109).

## INI · Inicio

#### INI-01 · «Registrar» de la barra superior es solo un «+» en teléfono — todas las pestañas · teléfono-claro, teléfono-oscuro · alta
- **Consolidado en:** GLO-22 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/inicio__principal__telefono-claro.png` y `presupuesto__principal__telefono-claro.png`: un cuadrado azul de 44 × 44 con «+» y sin texto (medida: `medidas/presupuesto__principal__telefono-claro.json`, tocable «Registrar» 44 × 44). La clase `max-[25rem]:sr-only` oculta el texto a 390 px.
- **Debería:** botón «+ Registrar» con texto, alto 44, padding 0 14 0 10, `.t-etiqueta` 700 (PANTALLAS §3.1; `T/S1-Inicio__telefono-claro.png`, `T/S2-Presupuesto__telefono-claro.png`, `E2/D3-…/todas__telefono-claro.png`). El título largo se corta con puntos suspensivos («PRESUPUES…») para dejarle lugar.
- **Arreglo:** en `apps/web/src/componentes/navegacion/acceso-registrar.tsx` quitar `max-[25rem]:sr-only`, `max-[25rem]:w-11` y `max-[25rem]:p-0` de la variante `barra`, y dejar que el título de `titulo-pantalla` trunque (`truncate`, `min-w-0`) en `componentes/marco/marco.tsx`.
- **Cómo verificar:** a 390 px la barra de Inicio y Presupuesto muestra «+ Registrar» (texto visible, 44 de alto) y el título trunca con «…» sin empujarlo fuera.

#### INI-02 · «Asignar $312.40» de Inicio navega a Presupuesto en lugar de abrir la hoja Asignar — Inicio · todas · alta
- **Se ve:** `capturas/inicio__asignar-boton__telefono-claro.png`; nota `medidas/_nota__inicio__asignar-boton__telefono-claro.txt`: `url=http://localhost:3100/presupuesto?filtro=sin-fondos dialogo=0`. Es un enlace (`botonLpa` en `pantalla-inicio.tsx`).
- **Debería:** «Asignar $312.40 (abre la hoja Asignar)» (PANTALLAS §2.8 y §11: «Asignar, Más secciones → Hoja inferior»; `T/S1-Inicio__telefono-claro.png`). Con LPA negativo, «Quitar $86.15 de una categoría».
- **Arreglo:** el botón debe abrir un flujo corto de Asignar sin categoría elegida (hoja en teléfono, panel de 440 en computadora) o, si no se quiere ese flujo, decidirlo en DECISIONES. Hoy el código lo resuelve con CA-08.11/P6-26 de los documentos de la app, que contradicen PANTALLAS §2.8. **Contradicción para un CH**: PANTALLAS §2.8 («abre la hoja Asignar») frente a CA-08.11 («lleva a las categorías sin fondos»). Archivos: `apps/web/src/app/(finn)/page.tsx` (`haySinFondos`), `pantalla-inicio.tsx` (`botonLpa`), `componentes/dominio/billete.tsx`.
- **Cómo verificar:** tocar el botón no cambia la URL y abre un `role="dialog"` con la hoja Asignar; con LPA negativo el botón dice «Quitar $X de una categoría».

#### INI-03 · Hallazgos de ritmo como tarjetas de problema con botón tonal; la referencia usa un aviso de advertencia — Inicio · teléfono, computadora · alta
- **Se ve:** `capturas/inicio__ritmo__telefono-claro.png`, `inicio__principal__telefono-claro.png` y `inicio__principal__computadora-claro.png`: en «Necesita tu atención», un bloque grande `--problema-fondo`/`--deuda-sin-respaldo-fondo` por hallazgo, con glifo de problema, frase «Ya te pasaste $26.30 en Restaurantes…» y un botón tonal «Asignar $55.56» (alto ≈ 44, ancho ≈ 100). `HallazgosRitmo` pasa `estado={h.estado}` (problema) a `AvisoEnLinea`.
- **Debería:** aviso en línea de **advertencia** (`--advertencia-fondo`, triángulo) con título «Ritmo alto en Restaurantes», texto y una acción de enlace subrayada «Mover dinero» (PANTALLAS §2.14; `E2/15-…/ritmo-y-tarjetas__telefono-claro.png`). Un aviso de problema donde va una advertencia es error.
- **Arreglo:** en `apps/web/src/app/(finn)/reportes/[tipo]/ritmo-hallazgos.tsx` usar `estado="advertencia"` para los hallazgos de ritmo (reservar «problema» para algo ya consumado), título propio y acción como enlace (`AvisoEnLinea` acepta `accion`); mover la acción «Asignar $X» a la fila de detalle o a «Mover dinero».
- **Cómo verificar:** con la semilla de ritmo (`inicio__ritmo`) cada hallazgo es un aviso amarillo con título «Ritmo alto en X» y un enlace «Mover dinero»; no hay botón tonal dentro del aviso.

#### INI-04 · Texto y título de los hallazgos de ritmo distintos a la referencia — Inicio · todas · baja
- **Se ve:** «Ya te pasaste $20.00 en Epsilon y, a este ritmo, llegarías a $167.00 el 20/02.» y «Vas camino a pasarte $105.00 en Gama antes del 20/02.» (`capturas/inicio__ritmo__telefono-claro.png`; `apps/web/src/textos/inicio.ts` líneas 50-52). Sin título.
- **Debería:** «Ritmo alto en Restaurantes» + «Llevás $110.30 de $120.00 en Restaurantes y quedan 5 días. A este ritmo cerrás con −$26.30.» (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`; los textos son «propuestos» según INDICE-entrega-2 §6).
- **Arreglo:** `apps/web/src/textos/inicio.ts`: título y frase de la referencia, con U+2212 en el negativo.
- **Cómo verificar:** el texto coincide con el de la referencia y el monto negativo usa «−».

#### INI-05 · Las filas de «Necesita tu atención» no muestran el monto — Inicio · todas · alta
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`, `inicio__lpa-negativo__telefono-claro.png`, `inicio__lpa-cero__telefono-claro.png`: Restaurantes «Sobregiro con débito o efectivo» y Gasolina «Deuda sin reservar» son un `<details>` con chevrón y sin monto; el monto (−$26.30) solo aparece al desplegar. Código: `Sobregiro` en `pantalla-inicio.tsx` («Los sobregiros se ven sin monto (PF-2)»).
- **Debería:** fila de 68 con círculo de 36, nombre, etiqueta del estado, monto `.t-cifra` en el color del estado (−$26.30, $18.75) y chevrón, que enlaza al detalle de la categoría (PANTALLAS §4 punto 2; `T/S1-Inicio__telefono-claro.png`). Las filas de tarjeta sí llevan monto en la app («Te falta reservar $18.75»); las de categoría no.
- **Arreglo:** `apps/web/src/app/(finn)/pantalla-inicio.tsx`: dibujar `Sobregiro` con `FilaAtencion` y `monto` (en `-s.total` con U+2212) y enlace a `/presupuesto/categorias/[id]`. Si la decisión PF-2 («sin monto a la vista») es intencional, **es una contradicción con S1/PANTALLAS §4** para llevar como CH; mientras no se resuelva, el diseño manda.
- **Cómo verificar:** Restaurantes muestra «−$26.30» y Gasolina «$18.75» sin tocar nada; tocar la fila abre el detalle.

#### INI-06 · Falta el enlace «Ver las N →» en el encabezado de «Necesita tu atención» — Inicio · todas · media
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: el título «NECESITA TU ATENCIÓN» está solo (`Seccion` de `pantalla-inicio.tsx` no lleva enlace).
- **Debería:** «Ver las 6 →» a la derecha, hacia Presupuesto filtrado por sobregiradas (PANTALLAS §4; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `pantalla-inicio.tsx`: `Seccion` con `enlace={{ href: '/presupuesto?filtro=sobregiradas', texto: t.verLas(n) }}` y el texto en `textos/inicio.ts`.
- **Cómo verificar:** el encabezado muestra «Ver las N →» con N igual a la cantidad de filas y lleva a `/presupuesto?filtro=sobregiradas`.

#### INI-07 · Los pagos de tarjeta próximos van dentro de «Necesita tu atención»; la referencia tiene sección propia con insignia de fecha — Inicio · todas · alta
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: fila «Visa Oro · Se paga el 15/10 · $370.63» en estado advertencia, mezclada con las de sobregiro; sin insignia de fecha ni segunda tarjeta («Nada que pagar»).
- **Debería:** sección «Pagos de tarjeta próximos» con cada tarjeta como fila de insignia de fecha (NOV 15), «Pago 15/11 · para no generar intereses $512.40» y el indicador «Te falta reservar $18.75» o «Nada que pagar» (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`, `…__computadora-claro.png`; INDICE-entrega-2 §15).
- **Arreglo:** `pantalla-inicio.tsx`: sacar `a.pagosTarjetaProximos` de la lista de atención y dibujarlos en una `Seccion` nueva con `InsigniaDeFecha` (`componentes/dominio/insignia-fecha.tsx`) y `IndicadorEstado`.
- **Cómo verificar:** `inicio__pagos-tarjeta-proximos` muestra la sección «Pagos de tarjeta próximos» con insignia de fecha y el indicador de estado por tarjeta.

#### INI-08 · Las filas de Recientes no llevan insignia de fecha y el subtítulo es el estado bancario — Inicio · todas · media
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: «Sin comercio / Pendiente» + monto; código `FilaTransaccion` compacta (`componentes/dominio/fila-transaccion.tsx`, columnas sin insignia; subtítulo `dominio.estadoBancario`). («Sin comercio» es dato de la semilla.)
- **Debería:** columnas `[48][1fr][auto]` con insignia de fecha (OCT 15), título 600, subtítulo con la cuenta («Visa Oro») y monto `.t-cifra`, ingresos en `--positivo-texto` con «+» (PANTALLAS §2.16 y §4 punto 4; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `fila-transaccion.tsx`: variante compacta con `InsigniaDeFecha`, cuenta como subtítulo y «+» en ingresos; el DTO ya trae fecha y cuenta de la transacción.
- **Cómo verificar:** cada fila de Recientes tiene insignia «OCT 15», la cuenta debajo del título y «+$925.00» en el ingreso.

#### INI-09 · Dice «Patrimonio» y la referencia «Patrimonio neto» — Inicio · todas · baja
- **Se ve:** «Patrimonio» (`capturas/inicio__principal__telefono-claro.png`; `apps/web/src/textos/glosario.ts` línea 24).
- **Debería:** «Patrimonio neto» (PANTALLAS §4 punto 5; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `glosario.patrimonio` → «Patrimonio neto», revisando dónde más se usa el glosario.
- **Cómo verificar:** la fila dice «Patrimonio neto».

#### INI-10 · «Todo al día»: el título no usa Big Shoulders — Inicio · todas · media
- **Se ve:** `capturas/pliegue/inicio__al-dia__telefono-claro.png`: «Todo al día» en Archivo 700 (título de `AvisoEnLinea`).
- **Debería:** título en `titulo-seccion` (Big Shoulders, mayúsculas, color de estado), con el glifo grande de 24 (`T/S1-Inicio__todo-al-dia.png`).
- **Arreglo:** `inicio-secciones.tsx` (`TodoAlDia`): variante grande de `componentes/base/aviso.tsx` con rol `titulo-seccion`.
- **Cómo verificar:** el título aparece en la fuente de títulos, en `--positivo-texto`.

#### INI-11 · Indicador «Asignaste más de lo que tenés» en blanco; la referencia lo pinta con el color del estado — Inicio y Presupuesto · todas · baja
- **Se ve:** `capturas/inicio__lpa-negativo__telefono-claro.png`: círculo con glifo de problema pero el texto en `--texto-sobre-marca`.
- **Debería:** etiqueta en el color de problema (`T/S1-Inicio__listo-para-asignar-negativo.png`, `E2/15-…/lpa-negativo__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/indicador-estado.tsx` (`sobreMarca`): texto con el token de problema legible sobre `--marca` (comprobar contraste 4.5:1; si no llega, proponer token).
- **Cómo verificar:** la etiqueta se ve en el color de problema con contraste ≥ 4.5:1 en claro y en oscuro.

#### INI-12 · El monto del billete en computadora es más chico que el de la referencia — Inicio · computadora-claro · media
- **Se ve:** `capturas/inicio__principal__computadora-claro.png`: «$312.40» ocupa ≈ 160 px de ancho en el billete (medido sobre la captura).
- **Debería:** monto de 3.75rem en computadora (PANTALLAS §4: «monto 3.75rem»), ≈ 185 px en `T/S1-Inicio__computadora-claro.png`.
- **Arreglo:** `componentes/dominio/cifras-billete.tsx`: tamaño `md:` de 3.75rem para la variante `grande` (token `cifra-heroe`).
- **Cómo verificar:** a 1440 px el texto del monto mide 3.75rem de alto de fuente.

#### INI-13 · El esqueleto de carga no se parece al del diseño — todas las pantallas de `(finn)` · todas · media
- **Consolidado en:** GLO-32 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/inicio__cargando__telefono-claro.png` (loading real, navegación retenida): una pastilla de 32 px y dos bloques de 96 px con `rounded-pastilla` (cápsulas), padding lateral de 16 px (`p-4`), sin la forma de la pantalla.
- **Debería:** barras de 4 px de radio (10, 14 y 22 px de alto) y un bloque de 120 px, con 20 px laterales y sin números inventados (`entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`; INDICE-entrega-1 «Esqueleto de carga»).
- **Arreglo:** `apps/web/src/app/(finn)/loading.tsx`: clases de radio `rounded-fino`/`rounded-control` (token `--radio-fino`) y `px-5`; replicar la estructura de bloques del K2.
- **Cómo verificar:** el esqueleto tiene 20 px de margen lateral, radios de 4 px en las barras y no usa `rounded-pastilla`.

#### INI-14 · En cargando y en error la barra superior pierde el título de la pantalla — todas las pantallas de `(finn)` · teléfono · media
- **Consolidado en:** GLO-32 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/inicio__cargando__telefono-claro.png` y `inicio__error__telefono-claro.png`: la barra solo tiene Registrar, campana y ☰; el título («Inicio») no aparece (lo publica la página con `PublicarEncabezado`).
- **Debería:** el título sigue visible («PRESUPUES…» en `E2/14-…/error-de-pantalla__telefono-claro.png`).
- **Arreglo:** que `loading.tsx` y `error-de-pantalla.tsx` (`componentes/navegacion/`) publiquen el título de la sección según la ruta, o que el marco lo derive de `pathname` mientras la página no publica.
- **Cómo verificar:** durante la carga y en el error la barra muestra el nombre de la pestaña activa.

#### INI-15 · Error de pantalla: icono y botón distintos a la referencia — todas las pantallas · todas · baja
- **Se ve:** `capturas/pliegue/inicio__error__telefono-claro.png`: icono `informacion` en línea con el texto, referencia «E-PRU-213», botón «Intentar de nuevo» sin icono, tarjeta con 36 de padding.
- **Debería:** icono encima del texto, botón con icono de reintento, tarjeta con 36 px de padding (`E2/14-…/error-de-pantalla__telefono-claro.png`). (La referencia «E-PRU-213» es de la ruta de prueba.)
- **Arreglo:** `apps/web/src/componentes/navegacion/error-de-pantalla.tsx`.
- **Cómo verificar:** coincide con el PNG, con el icono de reintento en el botón.

#### INI-16 · Primeros pasos sin cuentas: iconos temáticos y falta la nota — Inicio · todas · baja
- **Se ve:** `capturas/pliegue/inicio__primer-uso__telefono-claro.png`: círculos con cartera, lista y mensaje; sin nota.
- **Debería:** círculos tonales con «+» y una nota neutra con `info`: «Sin cuentas, los Primeros pasos ocupan el lugar de “Necesita tu atención” y no se pueden ocultar.» (`E2/15-…/primeros-pasos-sin-cuentas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/app/(finn)/primeros-pasos.tsx` y `textos/primeros-pasos.ts`.
- **Cómo verificar:** coincide con el PNG.

#### INI-17 · «Ver cómo se compone» con la flecha a la derecha — Inicio y Presupuesto · todas · baja
- **Se ve:** Inicio `capturas/inicio__al-dia__telefono-claro.png`: «Ver cómo se compone ›» con chevrón a la derecha; Presupuesto: sin chevrón.
- **Debería:** chevrón a la izquierda del texto, alineado a la derecha (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`, `herramientas__telefono-claro.png`).
- **Arreglo:** `pantalla-inicio.tsx` (`ENLACE`) y `presupuesto/pantalla.tsx` (`COMO_SE_COMPONE`): icono `chevR` antes del texto en ambos.
- **Cómo verificar:** ambos lugares muestran «› Ver cómo se compone».

## PRE · Presupuesto

#### PRE-01 · Pastillas de filtro: 16 px / peso 400 y 44 de alto; la referencia usa 14 px / 500 y 40 — Presupuesto · todas · media
- **Consolidado en:** GLO-33 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `analisis/presupuesto__principal.md` (teléfono y computadora): «Sobregiradas» tamaño 16≠14, peso 400≠500; pastilla de 44 de alto (`capturas/pliegue/presupuesto__cubiertas__telefono-claro.png`).
- **Debería:** `.t-etiqueta` 14, inactiva 500, activa 700, 40 de alto (PANTALLAS §2.3; `E2/D3-…/todas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/componentes/base/pastillas.tsx`: rol `etiqueta`, `min-h-10` con área de toque de 44 por pseudo-elemento.
- **Cómo verificar:** texto 14 px / 500 (activa 700), pastilla de 40 de alto y área de toque ≥ 44.

#### PRE-02 · El filtro activo no se desplaza a la vista — Presupuesto · teléfono · media
- **Consolidado en:** GLO-33 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/presupuesto__cubiertas__telefono-claro.png`: «Cubiertas» activa queda cortada («Cu») en el borde derecho; la fila sangra y se desplaza (medida `_nota__presupuesto__filtros-desplazados__x.txt`: scroller 390, contenido 479), pero no se centra en la activa.
- **Debería:** D3 deja la activa visible («Cubi…») y que el último asome (`E2/D3-…/cubiertas__telefono-claro.png`).
- **Arreglo:** `pastillas.tsx`: al montar, `scrollIntoView({ inline: 'nearest' })` de la pastilla con `aria-current`, sin animar con movimiento reducido.
- **Cómo verificar:** con `?filtro=cubiertas` la pastilla activa queda con ≥ 60 % de su ancho visible.

#### PRE-03 · «Sin resultados»: componente distinto al del diseño — Presupuesto · todas · media
- **Se ve:** `capturas/pliegue/presupuesto__sin-resultados__telefono-claro.png`: círculo `--positivo-fondo` con check, «Ninguna categoría cumple este filtro», «Probá con otros filtros o quitalos para ver todo.», botón gris.
- **Debería:** caja de borde punteado, icono de filtro en círculo neutro, «Ninguna categoría coincide», «No hay categorías “Cubiertas” con este filtro en el período.» y botón tonal azul «Quitar filtros» (`T/S2-Presupuesto__sin-resultados.png`, `E2/D3-…/cubiertas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/componentes/base/vacio.tsx` (variante `filtro`) y `textos/presupuesto.ts` (`sinResultados`): texto con el nombre del filtro; botón con `TONAL` en lugar de `BOTON`.
- **Cómo verificar:** coincide con el PNG y el botón es tonal `--accion-tonal` / `--accion`.

#### PRE-04 · Con solo archivadas con dinero aparece «Ninguna categoría cumple este filtro» sin filtro activo — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__herramientas__telefono-claro.png`: con «Todas» activa se lee el vacío de filtro y «Quitar filtros» (`sinFilas && filtro === undefined && archivadas > 0` cae en `sinResultados`).
- **Debería:** sin filtro activo, el vacío de «Todavía no hay categorías» o ninguno (el diseño muestra las filas de Casa…); «Sin resultados» solo con filtro (PANTALLAS §5 «Estados»).
- **Arreglo:** `presupuesto/pantalla.tsx`: `sinResultados` solo si `filtro !== undefined`; sin filtro y sin categorías activas, el vacío «Todavía no hay categorías» con enlace a Estructura.
- **Cómo verificar:** la semilla ESC-44 no muestra «Quitar filtros» con «Todas».

#### PRE-05 · Selector de período: faltan el subtítulo de «Cerrado» y «Futuro» y «Ir al período actual» es un enlace liviano — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__periodo-cerrado__telefono-claro.png`: «🔒 Cerrado»; futuro: «Futuro»; «Ir al período actual» en 14 px, peso 400 (`selector-periodo.tsx`, `estadoVisible` solo usa `dominio.periodo.cerrado/futuro`).
- **Debería:** «Cerrado · Sin acciones de asignar» y «Futuro · Solo asignado, sin gasto»; «Ir al período actual» en enlace discreta 44 de alto, peso 700 (`T/S2-Presupuesto__periodo-cerrado.png`, `T/S2-Presupuesto__periodo-futuro.png`; PANTALLAS §2.15).
- **Arreglo:** `apps/web/src/componentes/navegacion/selector-periodo.tsx` y `textos/dominio.ts` (`periodo`).
- **Cómo verificar:** los subtítulos coinciden y el enlace es `.t-etiqueta` 700.

#### PRE-06 · Período futuro: muestra la franja de Listo para asignar y «Mover dinero»; la referencia no — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__periodo-futuro__telefono-claro.png`: franja con «Asignar», «Ver cómo se compone» y «Mover dinero» encima de las categorías.
- **Debería:** solo selector, filtros, categorías (con «+») y totales; sin franja ni pagos de tarjeta (`T/S2-Presupuesto__periodo-futuro.png`; PANTALLAS §5: «solo asignado, sin gasto ni indicadores, sin pagos de tarjeta»). Si la herramienta es deseable en futuro, hay que decidirlo (el PNG manda hasta entonces).
- **Arreglo:** `presupuesto/pantalla.tsx`: ocultar `ResumenListoParaAsignar` y `nav` de acciones cuando `futuro`.
- **Cómo verificar:** en un período futuro no hay franja ni «Mover dinero».

#### PRE-07 · Período cerrado: «Período cerrado» en una tercera línea; la referencia lo pone a la derecha — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__periodo-cerrado__telefono-claro.png`: línea propia con candado debajo de «Asignado… · Gastado…», repetida en cada fila.
- **Debería:** candado + «Período cerrado» a la derecha de la línea de montos, en `--texto-terciario` (`T/S2-Presupuesto__periodo-cerrado.png`; PANTALLAS §2.6).
- **Arreglo:** `componentes/dominio/fila-categoria.tsx`: columnas `[1fr][auto]` en la línea de montos cuando `periodoCerrado`.
- **Cómo verificar:** las filas cerradas no crecen una línea.

#### PRE-08 · El botón «Asignar» de la franja es un ancla a `#categorias` — Presupuesto · todas · media
- **Se ve:** `presupuesto/pantalla.tsx`: `accion={{ href: '#categorias', texto: t.acciones.asignar }}`; en `capturas/presupuesto__principal__telefono-claro.png` solo desplaza la página.
- **Debería:** abrir la hoja Asignar (PANTALLAS §2.8 «Versión franja» y §5 «“+” y “Asignar” abren la hoja Asignar»).
- **Arreglo:** igual que INI-02; mismo flujo sin categoría elegida.
- **Cómo verificar:** tocar «Asignar» abre `role="dialog"`.

#### PRE-09 · Franja con LPA negativo: el botón sigue diciendo «Asignar» y sobresale del relleno — Presupuesto · teléfono · media
- **Se ve:** `capturas/pliegue/presupuesto__lpa-negativo__telefono-claro.png`: «Asignar» llega a 8 px del borde de la franja (el relleno es 14) por el indicador largo.
- **Debería:** botón «Quitar $86.15» con el indicador en dos líneas a la izquierda (`E2/15-…/lpa-negativo__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/billete.tsx` (franja): texto `Quitar $X` cuando `lpaNegativo`, columna de texto `min-w-0` con salto de línea.
- **Cómo verificar:** el botón respeta el padding de 14 y dice «Quitar $86.15».

#### PRE-10 · Franja: «En camino» debajo del monto y botón 16/600 — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: «En camino $40.00» en una línea aparte; botón «Asignar» 16 px peso 600 (`analisis/presupuesto__principal.md`: 16≠14, 600≠700).
- **Debería:** «En camino $40.00» junto al monto (una fila) y botón `.t-etiqueta` 700 de 44 (`E2/15-…/herramientas__telefono-claro.png`).
- **Arreglo:** `billete.tsx` (`franja`): `flex-wrap items-baseline` y botón con rol `etiqueta` 700.
- **Cómo verificar:** la franja mide ≈ 76 px de alto y el botón 14/700.

#### PRE-11 · «Mover dinero» y «Auto-asignar» sin iconos — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: botones tonales con solo texto.
- **Debería:** iconos de intercambio y de actualizar a la izquierda (`E2/15-…/herramientas__telefono-claro.png`).
- **Arreglo:** `presupuesto/pantalla.tsx` (`TONAL`): `Icono nombre="swap"` y el de reintento/actualizar del set.
- **Cómo verificar:** coincide con el PNG.

#### PRE-12 · Fila de pago de tarjeta: el indicador baja a una segunda línea — Presupuesto · teléfono · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: «Disponible para pagar $623.43» y, debajo, «Te falta reservar»; el PNG los pone en la misma fila. «Al día» en lugar de «Deuda de tarjeta» para Mastercard con $0.00.
- **Debería:** misma fila: texto en `cuerpo-pequeno` (13) + indicador a la derecha (`T/S2-Presupuesto__telefono-claro.png`). La etiqueta de $0.00 la fija DECISIONES («$0.00 en `--texto`»); «Al día» vs «Deuda de tarjeta» queda a confirmar.
- **Arreglo:** `componentes/dominio/fila-pago.tsx`: texto de 13 px y `flex-nowrap` con `min-w-0`.
- **Cómo verificar:** con Visa Oro («Te falta reservar $18.75») la fila ocupa dos líneas, no tres.

#### PRE-13 · Etiquetas de estado en filas: 14 px; la referencia usa 13 — Presupuesto y otras listas · todas · baja
- **Se ve:** `analisis/presupuesto__principal.md`: «Meta cubierta», «Sobregiro con débito o efectivo», «Falta para la meta» 14≠13 (interlineado 18.9≠17.6) en teléfono y computadora.
- **Debería:** versión chica del indicador, etiqueta a .8125rem (PANTALLAS §2.4).
- **Arreglo:** `componentes/dominio/indicador-estado.tsx`: variante `chica` en `fila-categoria.tsx`.
- **Cómo verificar:** etiqueta de 13 px en las filas.

#### PRE-14 · Archivadas con dinero: tres elementos donde el diseño tiene una fila con «Sacar» — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__herramientas__telefono-claro.png`: título «ARCHIVADAS CON DINERO», párrafo, tarjeta con nombre, «Disponible $25.00», botón tonal largo «Sacar $25.00 a Listo para asignar» y enlace negro subrayado «Sacar el dinero de Gimnasio».
- **Debería:** una fila con nombre, «Archivada el 10/10 · Disponible $62.85» y pastilla tonal «Sacar» a la derecha (`E2/15-…/herramientas__telefono-claro.png`). El enlace subrayado en `--texto` además es un componente que no existe en el juego.
- **Arreglo:** `presupuesto/pantalla.tsx` (bloque `archivadas-con-dinero`) y `presupuesto/sacar-un-toque.tsx`: «Sacar» tonal de 38; el enlace a `…/sacar` pasa a ser la fila entera.
- **Cómo verificar:** cada archivada con dinero ocupa una fila con un solo botón «Sacar».

#### PRE-15 · Computadora: la tabla lleva una columna «+» que el diseño no tiene — Presupuesto · computadora-claro · baja
- **Se ve:** `capturas/presupuesto__principal__computadora-claro.png`: círculo «+» de 44 al final de cada fila; «Disponible» termina en x=866 (en la referencia, 953).
- **Debería:** tabla de 4 columnas sin «+» (`T/S2-Presupuesto__computadora-claro.png`; PANTALLAS §2.6 «Computadora: tabla con columnas…»).
- **Arreglo:** `fila-categoria.tsx`: sin botón en `md:`; asignar desde el detalle o desde el hover de la fila (decidir).
- **Cómo verificar:** las columnas Asignado, Gastado y Disponible quedan a 110 px.

#### PRE-16 · Computadora: el contenido de Presupuesto es 48 px más angosto que el de la referencia — Presupuesto · computadora-claro · media
- **Se ve:** `capturas/presupuesto__principal__computadora-claro.png`: contenido de x=296 a 1344 (1048); el análisis dice «Márgenes: izq 296 · der 96». El `main` mide 1144 con 48 de relleno.
- **Debería:** contenido de 1096 (x=297 a 1393 en `T/S2-Presupuesto__computadora-claro.png`: relleno de 48 a cada lado dentro del área de 1192) (DECISIONES: «contenido con max-width 1144 y relleno de 48»).
- **Arreglo:** `presupuesto/pantalla.tsx`: `max-w-6xl` (1152) se aplica a la caja con relleno; usar un contenedor sin relleno extra o `max-w-[calc(1144px+96px)]` desde un token de layout.
- **Cómo verificar:** a 1440 px el margen derecho del contenido es 48.

#### PRE-17 · Computadora: filas de la tabla con área de toque de 30 px — Presupuesto · computadora-claro · baja
- **Se ve:** `analisis/presupuesto__principal.md`: 4 tocables < 44 (554 × 30): Luz y agua, Internet y teléfono, Farmacia, Cuota del préstamo.
- **Debería:** tocables de al menos 44 × 44 (DECISIONES regla 6).
- **Arreglo:** `fila-categoria.tsx`: el enlace ocupa toda la fila (`min-h-11`, `after:absolute after:inset-0`).
- **Cómo verificar:** `analisis/presupuesto__principal.md` sin «Tocables < 44».

#### PRE-20 · Detalle de Listo para asignar: la descomposición no es la de la referencia — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`, `…__computadora-claro.png`: «DE DÓNDE SALE», «ENTRADAS AL PRESUPUESTO» (4 líneas), «LO QUE YA TIENE UN TRABAJO O LO REDUJO» (6 líneas), dos rótulos apilados.
- **Debería:** «CÓMO SE COMPONE HOY» con 6 líneas: Ingresos del período, Arrastre del período anterior, Otras entradas, Asignado en el período (−), Asignado a futuro (−) y Listo para asignar (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `presupuesto/listo-para-asignar/pantalla.tsx` (`descomposicion`): los términos de la referencia con U+2212 y total en negrita. Si se mantiene el desglose (cumple 03 «Efectivo − (asignado + arrastre) − en camino»), **proponer un CH** para actualizar el diseño.
- **Cómo verificar:** coincide con el PNG o con el diseño actualizado.

#### PRE-21 · Reducción proyectada: sin «Al cerrar el 20/10 quedaría $X» y con rótulos de más — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: párrafo «Al cierre del período actual…», «Reducción proyectada al cierre $26.30», «CATEGORÍAS» y «Restaurantes $26.30».
- **Debería:** «Restaurantes · sobregiro con débito −$26.30» y «Al cerrar el 20/10 quedaría $286.10» (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx`: fila por categoría con motivo y el total proyectado (el DTO tiene la reducción; el «quedaría» es LPA − reducción, que debe venir del motor, no calcularse en la interfaz: PF-3).
- **Cómo verificar:** aparece «Al cerrar el 20/10 quedaría $286.10» con el monto del motor.

#### PRE-22 · Historial: línea con cifra grande donde el diseño tiene barras con eje y selector arriba — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: título «HISTORIAL» dentro del contenedor, cifra «$1,165.75», línea de 6 puntos con etiquetas solapadas («$1,165.75» sobre la línea); en computadora (`…__computadora-claro.png`) gráfico y tabla juntos y a todo el ancho.
- **Debería:** «HISTORIAL» fuera del contenedor, a la izquierda del selector Gráfico/Tabla (que alterna), barras con eje $0 · $150 · $300 · $450 y el período actual en `--accion` (`E2/05-…/principal__telefono-claro.png`, `…__computadora-claro.png`, `tabla__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx` (sección `historial`) y `componentes/graficos/` (barras con eje); `tablaAlLado` solo con la tabla activa.
- **Cómo verificar:** coincide con los PNG de `principal` y `tabla`.

#### PRE-23 · Nota permanente de B-4 como aviso azul de información — Listo para asignar · todas · baja
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: aviso `--informacion-fondo` con texto largo.
- **Debería:** caja `--superficie-hundida` con icono `info` y «Finn no adelanta ingresos futuros: Listo para asignar solo cuenta el dinero que ya entró.» (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx` y `textos/listo-para-asignar.ts`.
- **Cómo verificar:** coincide con el PNG.

#### PRE-24 · Computadora: una sola columna a 1048 px; la referencia tiene dos — Listo para asignar · computadora-claro · media
- **Se ve:** `capturas/lpa__principal__computadora-claro.png`: billete, descomposición, reducción e historial uno bajo otro; flecha «←» a la izquierda del título.
- **Debería:** columna izquierda (billete + composición + reducción) y derecha (historial), enlace «← Presupuesto» sobre el título (`E2/05-…/principal__computadora-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx`: `md:grid md:grid-cols-2` y el cabezal con `rutaPadre` en `componentes/marco/`.
- **Cómo verificar:** a 1440 px hay dos columnas.

#### PRE-30 · Asignar edita un valor absoluto con un selector +/−; el diseño suma un monto con signo — Asignar · todas · alta
- **Se ve:** `capturas/pliegue/asignar__pagina-completa__telefono-claro.png`, `capturas/asignar__principal__telefono-claro.png`: campo «Nuevo valor de Asignado» precargado con 100.00 y un selector «+ / −» en el que el «−» casi no se lee (gris claro sobre gris).
- **Debería:** campo «Asignar» con prefijo «+$», precargado con la opción elegida (75.00), ayuda «Para quitar, escribí el monto con signo menos.» (`E2/07-…/asignar__telefono-claro.png`, `…__computadora-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/formulario.tsx`: el campo muestra el monto a sumar (la acción conserva `esperado` y el valor absoluto), sin el selector de signo; el signo menos se escribe. Si el valor absoluto es una decisión de 04/05 (CA-10.x), **proponer un CH** para el diseño.
- **Cómo verificar:** el campo se llama «Asignar», con «+$», y no hay selector +/−.

#### PRE-31 · Las opciones rápidas no son una selección y muestran valores absolutos — Asignar · todas · media
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: tres filas-botón «Lo que falta para la meta $175.00», «Lo mismo que el período pasado $250.00», «Tu promedio de gasto $0.00»; tocarlas guarda.
- **Debería:** grupo de radio (círculo con relleno en la elegida), importe a sumar ($75.00, $100.00) y «Tu promedio de gasto (3 períodos)»; elegir una rellena el campo y no guarda (`E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/rapida.tsx`: `role="radiogroup"` y radios de 44; el envío lo hace el botón principal.
- **Cómo verificar:** elegir una opción solo rellena el campo y marca el radio.

#### PRE-32 · Falta la tarjeta de impacto «Listo para asignar $312.40 → $237.40» — Asignar · todas · media
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: entre el campo y los botones no hay tarjeta (solo existe el aviso AV-11 con LPA negativo). No se probó con un valor escrito.
- **Debería:** tarjeta con «Listo para asignar $312.40 → $237.40» y «Fondo de emergencia · asignado $100.00 → $175.00» (`E2/07-…/asignar__telefono-claro.png`). Las cifras las da el servidor (PF-3).
- **Arreglo:** `formulario.tsx`: consultar la vista previa (`Vista.impacto`) al cambiar el monto y dibujar la tarjeta (`componentes/formularios/confirmacion-impacto.tsx`).
- **Cómo verificar:** con 75.00 escrito aparece la tarjeta con las dos líneas.

#### PRE-33 · Botones «Cancelar / Guardar» en lugar de «Cancelar / Asignar $75.00» — Asignar · todas · media
- **Consolidado en:** GLO-34 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: «Cancelar» y «Guardar».
- **Debería:** «Cancelar» (tonal) y «Asignar $75.00» en columnas 1fr 1.4fr (PANTALLAS §2.17; `E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` y `textos/presupuesto-asignar.ts`: etiqueta con el monto formateado por `formatearMonto`.
- **Cómo verificar:** el botón dice «Asignar $75.00».

#### PRE-34 · Encabezado de la hoja sin «Ahorro · meta mensual $175.00» y con «Falta para la meta» en dos líneas — Asignar · todas · baja
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: «La meta pide $175.00»; rótulo «FALTA PARA LA META» partido en dos líneas.
- **Debería:** subtítulo «Ahorro · meta mensual $175.00» y el rótulo «META» con «falta $75.00» (`E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` (`Cifra`) y `textos/presupuesto-asignar.ts`; el nombre del grupo debe llegar en el DTO.
- **Cómo verificar:** coincide con el PNG, sin rótulo partido.

#### PRE-35 · Después de asignar no aparece el resultado «Asignaste $75.00 a Fondo de emergencia. · Deshacer» — Presupuesto tras Asignar · todas · alta
- **Consolidado en:** GLO-27 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/asignar__resultado__telefono-claro.png` y `medidas/_nota__asignar__resultado__telefono-claro.txt`: `deshacer=0 status=0`; la hoja se cierra y Presupuesto queda sin mensaje ni `role="status"`.
- **Debería:** resultado en el lugar, arriba de la lista, que no desaparece solo y con «Deshacer» (DECISIONES regla 5; PANTALLAS §2.13 «Asignaste $75.00 a Fondo de emergencia. → Deshacer»; `E2/07-…/asignado__computadora-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/formulario.tsx` debe dejar el resultado (por ejemplo en `searchParams` o un estado de la ruta) y `presupuesto/pantalla.tsx` dibujarlo con el componente de resultado (`role="status"`, alto 56, rebote de 300 ms); «Deshacer» invoca la operación inversa.
- **Cómo verificar:** tras guardar aparece el resultado con «Deshacer» y persiste hasta cerrarlo; `role="status"` presente.

#### PRE-36 · Conflicto de edición: aviso de problema con botón en lugar de error de campo — Asignar · todas · media
- **Se ve:** `capturas/pliegue/asignar__conflicto__telefono-claro.png` (capturado en la ruta de página completa): bloque `--problema-fondo` con tres líneas y botón tonal «Usar el valor actual».
- **Debería:** borde de 2 px `--problema-borde` en el campo y debajo «Este valor cambió mientras lo editabas. Ahora es $1,180.00.» con glifo (`E2/07-…/asignar-conflicto__telefono-claro.png`).
- **Arreglo:** `formulario.tsx`: error de campo del conflicto y la acción «Usar el valor actual» como enlace en el mismo mensaje.
- **Cómo verificar:** el campo tiene borde `--problema-borde` y el mensaje con una línea.

#### PRE-37 · Asignar en un período cerrado redirige al detalle; el diseño es una hoja con el motivo — Asignar · todas · alta
- **Se ve:** `capturas/pliegue/asignar__periodo-cerrado__telefono-claro.png`: la navegación termina en `/presupuesto/categorias/[id]?periodo=…&motivo=periodo_cerrado`, con un aviso de información «Este período está cerrado: solo se puede mirar.». (CA-10.8 lo prescribe.)
- **Debería:** la hoja «Asignar a Supermercado» con aviso de problema «No se puede cambiar lo asignado en un período cerrado.», caja de candado «Período 21/08 – 20/09/2026. Para mover dinero hoy, usá el período actual.» y botones «Cerrar / Ir al período actual» (`E2/07-…/asignar-periodo-cerrado__telefono-claro.png`). En el período cerrado las filas ni siquiera ofrecen «+», así que el estado solo se alcanza por URL.
- **Arreglo:** `app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx` y `flujos/presupuesto-asignar-categoria/lector.tsx`: renderizar la hoja con el motivo en vez de `redirect()`. **Contradicción para un CH** entre CA-10.8 (redirección) y el diseño 07.
- **Cómo verificar:** abrir la URL con `?periodo=` cerrado muestra la hoja con los dos botones.

#### PRE-38 · Detalle de categoría (destino de la redirección): el título se solapa con «Disponible» — Categoría · teléfono-claro · alta
- **Consolidado en:** GLO-25 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/asignar__periodo-cerrado__telefono-claro.png`: «RESTAURANTES» pisa la palabra «Disponible» (ejes y= 600 en la captura de 2×); además la barra superior no tiene título.
- **Debería:** el título en su fila y debajo el rótulo del grupo y «Disponible» (`E2/07-…/mover-excede__telefono-claro.png` muestra el detalle).
- **Arreglo:** `app/(finn)/presupuesto/categorias/[categoriaId]/` (fuera de mi sección: pasarlo a quien audite Categoría).
- **Cómo verificar:** sin solapes a 390 px.

#### PRE-40 · Mover dinero: rótulos, atajos, impacto y botón distintos — Mover · todas · media
- **Se ve:** `capturas/pliegue/mover__principal__telefono-claro.png`: «Sacar de», «Poner en», «Monto a mover», sin atajos «Cubrir $26.30 / Todo $62.85», sin tarjeta de impacto, botón «Mover» y destino «Elegí una categoría.».
- **Debería:** «Desde», «Hacia», «Monto», atajos de pastilla, tarjeta «Supermercado $62.85 → $36.55 / Restaurantes −$26.30 → $0.00», botón «Mover $26.30», subtítulo «Hacia Restaurantes» cuando viene de una categoría (`E2/07-…/mover-dinero__telefono-claro.png`).
- **Arreglo:** `apps/web/src/flujos/presupuesto-mover/formulario.tsx` y `textos/`.
- **Cómo verificar:** coincide con el PNG.

#### PRE-41 · Mover más que el Disponible: la app lo permite; la referencia lo bloquea — Mover · todas · media
- **Se ve:** `capturas/pliegue/mover__excede__telefono-claro.png`: con $200 desde «Super» (Disponible $80.00) el botón queda activo y no hay mensaje de error (CA-11.2/AV-02 aceptan dejar la categoría en negativo).
- **Debería:** campo con borde `--problema-borde`, «Supermercado tiene $62.85.», atajos «Cubrir/Todo» y «Mover $80.00» deshabilitado (`E2/07-…/mover-excede__telefono-claro.png`).
- **Arreglo:** **Contradicción para un CH**: diseño 07 (bloquea) frente a CA-11.2 (acepta y avisa). No se resuelve en el código.
- **Cómo verificar:** queda definido en un CH y la hoja coincide.

#### PRE-42 · Mover: sin resultado visible después de mover — Presupuesto tras Mover · todas · media
- **Consolidado en:** GLO-27 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/mover__resultado__telefono-claro.png`: Presupuesto sin mensaje ni `role="status"`.
- **Debería:** resultado en el lugar con «Deshacer» (DECISIONES regla 5; sin PNG propio: seguir PANTALLAS §2.13).
- **Arreglo:** igual que PRE-35, en `flujos/presupuesto-mover/formulario.tsx`.
- **Cómo verificar:** aparece «Moviste $30.00 de Super a Salidas. · Deshacer».

#### PRE-50 · Auto-asignar: vista previa con estructura distinta — Auto-asignar · todas · media
- **Se ve:** `capturas/pliegue/auto-asignar__principal__telefono-claro.png`: título «ESTO ASIGNARÍA FINN», lista con divisores insertos, «Listo para asignar cambia −$100.00.», dos avisos de advertencia («Beta quedó sin cubrir por $10.00»), botón «Asignar»; intro en 16 px.
- **Debería:** lista a ancho completo con filas «falta para la meta +$75.00» y «queda sin cubrir −$132.22» (advertencia), tarjeta resumen «Se asigna / Listo para asignar $312.40 → $0.00 / Sin cubrir», botón «Asignar $312.40» e intro de `cuerpo-pequeno` (`E2/07-…/auto-asignar__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-auto-asignar/formulario.tsx` y `textos/`.
- **Cómo verificar:** coincide con el PNG; «auto-asignar-cubiertas» ya coincide.

#### PRE-60 · El título de Estructura es «Grupos y categorías»; la referencia dice «Estructura» — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`.
- **Debería:** «ESTRUCTURA» (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `textos/estructura.ts` (`titulo`).
- **Cómo verificar:** el título es «Estructura».

#### PRE-61 · «Pagos de tarjeta» va primero y sin el texto por fila — Estructura · todas · media
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: el grupo del sistema arriba, rótulo «Lo administra Finn» a la derecha y filas sin texto; en bases sin tarjetas, «Este grupo no tiene categorías.» (`estructura__vacia`, `estructura__movida`).
- **Debería:** al final, con «Del sistema: sin archivar ni eliminar» en la primera fila y «Del sistema» en las demás; sin el bloque si no hay tarjetas (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-estructura/lista.tsx` y `textos/estructura.ts` (`delSistema`, `sinCategorias`).
- **Cómo verificar:** coincide con el PNG.

#### PRE-62 · Las filas no muestran «Meta mensual $350.00» — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: solo el nombre.
- **Debería:** subtítulo «Meta mensual $350.00» cuando hay meta (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `lista.tsx` y el DTO de `lector.tsx`.
- **Cómo verificar:** Supermercado muestra su meta.

#### PRE-63 · Cabecera del grupo con un chevrón de más y flechas en azul — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: «Editar grupo» más un «⌃» de «Subir grupo»; flechas de fila en `--accion`.
- **Debería:** solo «Editar grupo» en la cabecera; flechas en `--texto` (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `lista.tsx`: mover grupos en «Editar grupo»; color de las flechas a `text-texto`.
- **Cómo verificar:** coincide con el PNG.

#### PRE-64 · Editar categoría y Nueva categoría son hojas inferiores; el diseño es un flujo largo — Estructura · todas · alta
- **Se ve:** `capturas/pliegue/estructura__editar-categoria__telefono-claro.png`: hoja sobre la lista con título «EDITAR CATEGORÍA», «Grupo» como lista de radios, «Guardar» tonal pequeño, «Eliminar categoría» parcial y enlaces subrayados «Archivar» / «Fusionar».
- **Debería:** pantalla completa con «×», título «EDITAR RESTAURANTES», «Grupo» como selección, «Eliminar» deshabilitado a todo el ancho con motivo, «Archivar» y «Fusionar con otra» como enlaces en negrita sin subrayar, y «Guardar» fijo al pie (`E2/08-…/editar-categoria__telefono-claro.png`; INDICE-entrega-2 §08).
- **Arreglo:** `app/(finn)/presupuesto/estructura/categorias/[categoriaId]/page.tsx`, quitando la intercepción de `@superpuesto` para esta ruta, y `flujos/presupuesto-estructura/formulario.tsx`.
- **Cómo verificar:** coincide con el PNG, con «Guardar» en el pie fijo.

#### PRE-65 · «Moviste Supermercado.»: aviso informativo en lugar del resultado — Estructura · todas · media
- **Consolidado en:** GLO-27 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/estructura__movida__telefono-claro.png`: aviso azul con «Deshacer» en una segunda línea.
- **Debería:** resultado blanco con check, «Subiste Café al primer lugar de Comida fuera.» y «↶ Deshacer» a la derecha en la misma fila (`E2/08-…/estructura-movida__telefono-claro.png`).
- **Arreglo:** `lista.tsx`: componente de resultado (§2.13) y `textos/estructura.ts` (`movido`).
- **Cómo verificar:** coincide con el PNG.

#### PRE-66 · Estructura vacía: bloque vacío más grupos vacíos — Estructura · todas · media
- **Se ve:** `capturas/pliegue/estructura__vacia__telefono-claro.png`: vacío + «Pagos de tarjeta» con «Este grupo no tiene categorías.» + grupo «Gastos» vacío con «Nueva categoría» + «Nuevo grupo». («Gastos» lo crea la semilla del arnés.) Botón «Usar la plantilla de categorías» vs «Empezar con una lista sugerida».
- **Debería:** solo el vacío, «Empezar con una lista sugerida» y «+ Crear un grupo» (`E2/08-…/estructura-vacia__telefono-claro.png`).
- **Arreglo:** `lista.tsx` y `textos/estructura.ts` (`usarPlantilla`): ocultar el grupo del sistema sin tarjetas.
- **Cómo verificar:** con base sin tarjetas no aparece «Pagos de tarjeta».

#### PRE-70 · Plantilla sugerida: todos los nombres son campos de texto; el diseño tiene filas con lápiz — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__sugerida__telefono-claro.png`: nombre del grupo y de cada categoría como campos con línea inferior, «×» azul, «Agregar categoría» por grupo.
- **Debería:** filas de texto con lápiz y «×» en `--texto`, rótulo de grupo simple, «+ Agregar grupo» (`E2/08-…/plantilla__telefono-claro.png`). Título «LISTA SUGERIDA» y texto «Quitá, renombrá o agregá lo que quieras. No se guarda nada hasta que tocás “Crear”.».
- **Arreglo:** `flujos/presupuesto-estructura-plantilla/plantilla.tsx` (modo edición por fila) y `textos/plantilla.ts`.
- **Cómo verificar:** coincide con el PNG.

#### PRE-71 · Creando la plantilla: sin barra de progreso ni pie «Guardando…» — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__creando__telefono-claro.png`: «Creando tu plantilla: 0 de 47…» en Archivo 700 y un párrafo; sin barra ni botón.
- **Debería:** título de sección «CREANDO TU PLANTILLA: 9 DE 12…», barra de progreso, aviso `info` «Podés salir…» y pie fijo con «Guardando…» con spinner (`E2/08-…/plantilla-creando__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx`: barra (`role="progressbar"`) y `PieDeHoja` con el botón enviando.
- **Cómo verificar:** coincide con el PNG; `aria-busy` presente.

#### PRE-72 · Creación cortada: lista plana de nombres en vez de resumen — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__cortada__telefono-claro.png`: aviso amarillo corto y un párrafo «Creadas 12 · Faltan: Ropa y calzado, Transporte, Gasolina, …» con grupos y categorías mezclados; botón «Seguir creando la plantilla (12 de 47 creadas)».
- **Debería:** aviso con título «Seguir creando la plantilla (9 de 12 creadas)», «La creación se cortó. Lo que ya se creó quedó guardado.» y enlace «Seguir creando»; tarjeta «Creadas 9 / Faltan Ahorro: Fondo de emergencia, Viaje · Casa: Alquiler» y botón «Seguir creando» (`E2/08-…/plantilla-cortada__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx` y `reanudar.ts` (agrupar lo que falta por grupo).
- **Cómo verificar:** coincide con el PNG.

#### PRE-73 · Resultado de la plantilla: una línea suelta — Plantilla · todas · alta
- **Se ve:** `capturas/pliegue/plantilla__resultado__telefono-claro.png`: «47 creadas.» y botón «Ir al presupuesto».
- **Debería:** resultado con check («11 creadas. 1 no se creó.»), enlace «Ir a Presupuesto» y una tarjeta por elemento no creado con motivo e indicador «Omitida» (`E2/08-…/plantilla-resultado__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx` (resumen), `textos/plantilla.ts`.
- **Cómo verificar:** coincide con el PNG, con `role="status"`.

#### PRE-75 · Plantilla: quitar borra la fila sin poder restaurarla — Plantilla · todas · alta
- **Se ve:** `capturas/pliegue/plantilla__vacia__telefono-claro.png`: al quitar todo desaparecen grupos y filas; solo queda «Agregar grupo» y «Crear 0 categorías» (angosto, no a todo el ancho).
- **Debería:** las filas quedan tachadas con un icono «restaurar» y el botón del pie «Crear» deshabilitado a todo el ancho con «Elegí al menos una categoría.» debajo (`E2/08-…/plantilla-vacia__telefono-claro.png`, `plantilla__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx`: estado «quitada» reversible; `PieDeHoja` a todo el ancho.
- **Cómo verificar:** quitar y restaurar vuelve a la fila original; con todo quitado el pie coincide con el PNG.

## CAT · Detalle de categoría

#### CAT-01 · Título de la pantalla hija en el contenido, superpuesto a «Disponible» — Detalle de categoría y pago de tarjeta · teléfono claro/oscuro · alta
- **Consolidado en:** GLO-25 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** la barra superior solo tiene flecha, campana y «⋯», sin título. El `h1` está dentro del contenido: en `capturas/categoria__principal__telefono-claro.png` mide x=80, y=184.6, alto 60 (interlineado 60, 26 px); el rótulo «Gastos» está en y=184.6 y «Disponible» en y=216.2, así que el título pisa a los dos (también en `categoria__archivada`, donde pisa «Categoría archivada»). Títulos largos se cortan: «FONDO DE EMERG…» en `categoria__con-meta__telefono-claro.png`. En computadora la flecha y el título sí comparten fila y no se pisan.
- **Debería:** PANTALLAS §3.1 y DECISIONES «Marco»: en pantallas hijas la flecha «Volver a <padre>» va a la izquierda del título, en la misma fila de la barra superior (`.t-titulo-pantalla` 1.625rem), y a la derecha campana + «Más acciones». Referencia `02-referencias/tableros/S3-Detalle__telefono-claro.png`.
- **Arreglo:** publicar el título de la categoría en la barra (`PublicarEncabezado` / `proveedor-encabezado.tsx`) en teléfono y quitar el `h1` visible del contenido debajo de `md` (dejarlo `sr-only` o solo en computadora), en `presupuesto/categorias/[categoriaId]/pantalla.tsx` (fila del título, líneas ~164-169, junto a `VolverEnTitulo`) y en `pago.tsx` (mismo patrón). Mismo cambio para el rótulo de grupo: debe quedar debajo del título como en la referencia.
- **Cómo verificar:** a 390 px, ningún texto de `main` solapa a otro (cajas sin intersección) y el título ocupa la barra con elipsis si no entra; `categoria__con-meta` muestra el título sin cortarse más de lo que corta la barra.

#### CAT-02 · Selector de período dentro del detalle — Detalle de categoría · teléfono y computadora · media
- **Se ve:** una tarjeta con flechas de período («21/09 – 20/10/2026 · Actual · 25 días transcurridos») ocupa unos 170 px arriba del héroe (`categoria__principal__telefono-claro.png`); en computadora va arriba de todo (`…computadora-claro.png`, y la flecha «Volver» queda más abajo).
- **Debería:** S3-Detalle no tiene selector de período; la pantalla lleva el contexto por `?periodo=` y el aviso de período cerrado. El héroe es lo primero tras la barra.
- **Arreglo:** si el selector se quiere conservar es una decisión nueva (proponer CH); si no, quitar `SelectorPeriodo` de `pantalla.tsx` y mantener solo el aviso «Este período está cerrado…».
- **Cómo verificar:** el pliegue a 390 × 844 muestra héroe, indicador y rejilla sin la tarjeta de período.

#### CAT-03 · Bloque «Meta» sin el resumen de meta del diseño — Detalle con meta · teléfono · media
- **Se ve:** `categoria__con-meta__telefono-claro.png`: sección «Meta» con título de sección y contenido suelto (indicador, «$1,350.00 de $3,000.00 · 45%», barra y «Pide…»), sin contenedor, sin el nombre ni «Para el 30/06/2027», con el % pegado al texto y sin «Sin fondos suficientes en Listo para asignar.». Bajo el héroe no hay indicador «Falta para la meta».
- **Debería:** `…/tableros/S3-Detalle__con-meta.png` y K3-Dominio-A «resumen de meta»: contenedor blanco con nombre + fecha a la derecha, línea «$ de $» con el % a la derecha en 700, barra de 6 px, «Pide…», indicador y explicación; indicador `advertencia` bajo el héroe; el botón «Asignar $75.00» debajo.
- **Arreglo:** usar el componente de dominio `ResumenMeta` (`componentes/dominio`) dentro de un contenedor, y mostrar el indicador bajo el héroe (`pantalla.tsx`, rama de meta).
- **Cómo verificar:** la sección Meta es un contenedor con las seis líneas de la referencia y un indicador visible bajo «Disponible».

#### CAT-04 · Falta el espacio en el texto del botón con monto — Detalle · teléfono, computadora, oscuro · media
- **Consolidado en:** GLO-34 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** «Cubrir$26.30», «Asignar$75.00», «Reservar$18.75» (texto y monto sin espacio) en `categoria__principal`, `categoria__con-meta`, `categoria__sobregiro-tarjeta`; el análisis mide el texto «Cubrir» y el monto como dos nodos contiguos. En la tarjeta de pago sí sale «Reservar $300.00».
- **Debería:** «Cubrir $26.30», «Asignar $75.00», «Reservar $18.75» (S3-Detalle, todos los PNG).
- **Arreglo:** el botón de acción de la categoría arma el texto con `<Monto>` sin separador; agregar el espacio (o `gap`) en el componente que renderiza `t.acciones.cubrir/asignar/reservar` + monto en `pantalla.tsx`; el de `pago.tsx` ya lo hace bien.
- **Cómo verificar:** el nombre accesible del enlace es «Cubrir $26.30» y se ve con espacio.

#### CAT-05 · «Cubrir» fuera del aviso y a todo el ancho — Detalle con sobregiro · teléfono · media
- **Se ve:** `categoria__principal__telefono-claro.png`: aviso del sobregiro y, debajo, un botón de 350 × 48 a todo el ancho.
- **Debería:** S3-Detalle y PANTALLAS §6.3: el botón principal de 44 va **dentro** del aviso, a su ancho natural; el aviso trae el monto en el título («Sobregiro con débito o efectivo · $26.30») y «con tarjeta $0.00».
- **Arreglo:** mover el botón dentro de `AvisoEnLinea` (acción de 44, no de 48/52) en `pantalla.tsx`; completar el título del aviso con el monto.
- **Cómo verificar:** el botón está dentro del aviso, alto 44, ancho al contenido.

#### CAT-06 · Título de cada consumo es un enlace subrayado con el nombre de la cuenta — Detalle · teléfono, computadora · media
- **Se ve:** en cada consumo, «Cuenta corriente» / «Visa Oro» en 600, subrayado (`text-decoration: underline`, x=94, alto 44), y debajo se repite «Débito · Cuenta corriente» (`consumos.tsx`, clase `underline` línea 14).
- **Debería:** S3-Detalle: comercio en 600 sin subrayado y debajo solo «Débito» / «Tarjeta».
- **Arreglo:** quitar `underline` del enlace de la fila (la fila entera ya es tocable) y no repetir la cuenta en la segunda línea cuando es el título; cuando no hay comercio, mostrar «Débito»/«Tarjeta» como título (decisión de producto: proponer CH). `app/(finn)/presupuesto/categorias/[categoriaId]/consumos.tsx`.
- **Cómo verificar:** ningún texto de la lista de consumos tiene subrayado y la cuenta aparece una sola vez.

#### CAT-07 · Falta «Reglas» — Detalle de categoría · teléfono, computadora · baja
- **Se ve:** no hay sección de reglas en `categoria__principal` (ni «Archivar» deshabilitado con motivo, que vive en «Más acciones», CH-115, aceptable).
- **Debería:** PANTALLAS §6.7 y S3-Detalle: pastillas «PIZZA HUT», «LA PAMPA» (si hay reglas que apuntan a la categoría).
- **Arreglo:** confirmar si la semilla A.7 carga reglas; si las carga, falta la sección en `pantalla.tsx` (`t.reglas`, que existe en `textos/categoria-detalle.ts`).
- **Cómo verificar:** con una regla hacia la categoría, aparece su pastilla de 36 px.

#### CAT-08 · Seguimiento de color y glifo de «Se pasó 2 de 6» — Historial · teléfono, computadora · media
- **Se ve:** «Se pasó 2 de 6» en texto plano negro, sin glifo ni color (`categoria__principal__telefono-claro.png`, y la tabla en `categoria__historial-tabla`).
- **Debería:** PANTALLAS §2.18 y S3-Detalle: indicador `problema` (círculo + glifo) en `--problema-texto`; tres señales por estado (DECISIONES regla 2).
- **Arreglo:** reemplazar el `<span data-se-paso>` de `historial.tsx` (línea ~94) por `IndicadorEstado estado="problema"` con la etiqueta.
- **Cómo verificar:** el indicador lleva glifo, color y texto.

#### CAT-09 · «Asignar» sin ícono «+» — Detalle · teléfono, computadora · baja
- **Se ve:** «Asignar» solo texto en el botón principal de la rejilla de acciones.
- **Debería:** S3-Detalle: principal con ícono `plus`.
- **Arreglo:** `pantalla.tsx`, nav «Acciones de la categoría»: agregar `Icono nombre="plus"`.
- **Cómo verificar:** el botón muestra el `+` a la izquierda.

#### CAT-10 · Selector Gráfico / Tabla agregado al calendario — Detalle · teléfono, computadora · baja
- **Se ve:** el calendario lleva un selector Gráfico / Tabla (44 de alto) arriba a la derecha dentro de la tarjeta.
- **Debería:** S3-Detalle: el calendario no tiene selector (la tabla equivalente va en el árbol de accesibilidad, PANTALLAS §11).
- **Arreglo:** quitar el selector de `calendario.tsx` o proponer CH si se quiere conservar.
- **Cómo verificar:** el calendario es solo la rejilla y la nota.

#### CAT-11 · Historial: selector dentro de la tarjeta y rótulos distintos — Historial · teléfono · baja
- **Se ve:** el selector Gráfico / Tabla está dentro de la tarjeta, bajo el encabezado; la cifra dice «Promedio gastado»; la leyenda es «Gasto · Se pasó · Asignado».
- **Debería:** S3-Detalle: selector a la derecha del título de la sección «Últimos 6 períodos»; «gastado en promedio por período»; leyenda «Gastado · Asignado · Se pasó».
- **Arreglo:** `componentes/graficos/vista-grafico.tsx` (posición del selector) y textos de `textos/categoria-detalle.ts` (historial).
- **Cómo verificar:** el selector queda en la fila del título de sección.

#### CAT-12 · Gráfico de historial: barras sin degradado y etiquetas «21/03» — Historial · teléfono, computadora · baja
- **Se ve:** barras negras planas y etiquetas de período «21/03…21/08»; las cifras del SVG no llevan `tabular-nums` (`$88.20`…`$118.90`, 6 montos según el análisis).
- **Debería:** PANTALLAS §2.18: barras con degradado de `--grafico-tinta` (100 % → 62 %), etiquetas de mes («mar», «abr»…), valores en Archivo 700 al 80 % con tnum.
- **Arreglo:** `componentes/graficos/grafico-barras.tsx`.
- **Cómo verificar:** `font-variant-numeric: tabular-nums` en los valores y degradado en las barras.

#### CAT-13 · Sobregiro con tarjeta: el aviso reemplaza al texto del diseño — Detalle (Gasolina) · teléfono · media
- **Se ve:** aviso rosado «Deuda sin reservar» con «Con tarjeta $18.75. Deuda sin reservar en Gasolina: $18.75. Esta deuda suma a lo que te falta reservar para Visa Oro.» y el botón de 350 × 48 fuera; además un bloque «Historial» con «Gráfico sin datos».
- **Debería:** PANTALLAS §6 «Sobregiro con tarjeta»: texto plano «Pagaste con Visa Oro $18.75 más de lo asignado. Esa deuda todavía no está reservada.» bajo el indicador, rejilla Asignado/Gastado/Con tarjeta (3 celdas) y botón «Reservar $18.75»; S3-Detalle__sobregiro-con-tarjeta.
- **Arreglo:** cambiar el copy en `textos/categoria-detalle.ts` y usar texto simple en lugar de `AvisoEnLinea`; la rejilla debe tener 3 celdas en este estado (hoy 6).
- **Cómo verificar:** coincide con el PNG (salvo datos). Nota: el héroe en `--deuda-sin-respaldo-texto` (magenta) es lo que dice PANTALLAS §1; el PNG lo dibuja naranja. Gana la especificación escrita; no es hallazgo.

#### CAT-14 · Glifo de vacío genérico (círculo punteado verde) — Estados vacíos · teléfono · baja
- **Se ve:** «Sin gastos en este período» con un anillo punteado verde sobre fondo verde claro (`categoria__sin-movimientos`, `categoria__con-meta`, `metas__vacia`).
- **Debería:** PANTALLAS §2.19: círculo de 72 con `--positivo-fondo` y glifo de 32 del tema; S3-Detalle__sin-movimientos usa una caja con «Sin consumos en este período.»; 09a/vacia usa círculo hundido con ícono `target`.
- **Arreglo:** pasar el ícono de cada vacío (`target` en metas, `receipt` en consumos) al componente de vacío (`componentes/base/…vacio`).
- **Cómo verificar:** cada vacío muestra su ícono.

#### CAT-15 · Categoría de pago: secciones que el diseño no tiene — Pago de tarjeta · teléfono · media
- **Se ve:** `categoria__pago-tarjeta__telefono-claro.png`: además de héroe, rejilla, «Para no generar intereses» y botón, aparecen botones «Asignar» y «Pagar tarjeta», «Números del período», «La tarjeta hoy» y «Traslados por categoría».
- **Debería:** DECISIONES «Categoría de pago de tarjeta (detalle)»: héroe, rejilla Deuda · Reservado · Te falta, «Para no generar intereses», botón principal y lista de pagos; sin historial.
- **Arreglo:** retirar o proponer CH para las tres secciones y el segundo par de botones en `pago.tsx`.
- **Cómo verificar:** la pantalla tiene solo los bloques de DECISIONES.

#### CAT-16 · «Para no generar intereses» como lista de tres filas — Pago de tarjeta · teléfono · media
- **Se ve:** título de sección «Para no generar intereses» y un contenedor con «Pago de contado $300.00 · Pagá antes del 15/02», «Deuda al corte anterior», «Cargos del ciclo actual», «Ya pagado en el ciclo».
- **Debería:** S3-Detalle__categoria-de-pago-de-tarjeta: una tarjeta con el rótulo «PARA NO GENERAR INTERESES», «Pagá antes del 15/11» a la izquierda y el monto en 700 a la derecha, y debajo «Es el saldo al corte anterior; lo demás puede esperar al próximo pago.»
- **Arreglo:** `pago.tsx`.
- **Cómo verificar:** coincide con el PNG.

#### CAT-17 · Pago de tarjeta: rejilla en caja hundida, nombre de tarjeta como enlace subrayado y «Pagar tarjeta» — Pago de tarjeta · teléfono · baja
- **Se ve:** la rejilla Deuda · Reservado · Te falta va en una caja `--superficie-hundida` sin elevación; «Tarjeta Visa Oro» es un enlace subrayado de 44 de alto bajo el título; el botón con todo reservado dice «Pagar tarjeta».
- **Debería:** contenedor blanco con elevación (PANTALLAS §1); DECISIONES: «Pagar la tarjeta».
- **Arreglo:** `pago.tsx` y `textos/categoria-pago.ts`.
- **Cómo verificar:** contenedor estándar y texto «Pagar la tarjeta».

#### CAT-18 · «Últimos 1 períodos» — Historial de una categoría con un solo período · teléfono · baja
- **Se ve:** «Últimos 1 períodos» y «Se pasó 0 de 1» en `categoria__archivada__telefono-claro.png`.
- **Debería:** concordancia de número («Último período»).
- **Arreglo:** `textos/categoria-detalle.ts`, `historial.titulo(n)` con plural.
- **Cómo verificar:** con n = 1 el título dice «Último período».

#### CAT-19 · Más acciones: textos, subtítulos e íconos distintos — Menú · teléfono · media
- **Se ve:** `capturas/pliegue/categoria-mas__abierto__telefono-claro.png`: «Editar nombre y grupo», «Crear una meta», «Mover dinero», «Archivar» (deshabilitado con motivo), «Fusionar con otra», «Eliminar» (deshabilitado). Íconos: inbox para archivar, flechas cruzadas para fusionar.
- **Debería:** `…/MA-detalle-de-categoria-mas-acciones/abierto__telefono-claro.png`: «Agregar meta» + «Mensual, semanal, anual o para una fecha», «Archivar» con candado y «Elegís a dónde va el Disponible.», «Fusionar con otra categoría» con ícono de check. (El PNG deja «Archivar» habilitado con Disponible −$26.30; la regla escrita —PANTALLAS §6.8 y la E2E CH-115— lo deshabilita, así que eso no es hallazgo.)
- **Arreglo:** `textos/categoria-detalle.ts` (acciones) y los íconos en `componentes/marco/mas-acciones.tsx`; subtítulo de cada ítem.
- **Cómo verificar:** textos y subtítulos iguales a MA/abierto.

#### CAT-20 · Archivar: título sin el nombre de la categoría — Archivar · teléfono · media
- **Se ve:** «ARCHIVAR CATEGORÍA» y el nombre en un renglón aparte.
- **Debería:** «Archivar Supermercado» (07/archivar-categoria).
- **Arreglo:** `textos/categorias-archivar.ts` y el encabezado del flujo (`archivar/page.tsx`).
- **Cómo verificar:** el título trae el nombre.

#### CAT-21 · Archivar: falta la mayor parte del contenido de la pantalla — Archivar · teléfono, computadora · alta
- **Se ve:** `categoria-archivar__formulario__telefono-claro.png`: un selector «Mandar $40.00 de Disponible a», una tarjeta blanca de texto y un selector de programada («Elegí una opción.»).
- **Debería:** `…/07-flujos-del-presupuesto/archivar-categoria__telefono-claro.png`: aviso informativo («Al archivar, X deja de aparecer…»), «Disponible $62.85» con dos opciones de radio (Devolver a Listo para asignar / Pasarlo a otra categoría), «Asignado en períodos futuros $350.00» con casilla, «Programadas · 1» con una tarjeta por programada («se va a desactivar») y un resumen «Listo para asignar $312.40 → $725.25» y «Reglas que apuntan aquí».
- **Arreglo:** reconstruir `flujos/presupuesto-categorias-archivar/formulario.tsx` con esos bloques (radios, casilla, tarjetas de programadas, resumen); los selectores nativos no son los controles del diseño.
- **Cómo verificar:** los seis bloques están en la misma pantalla, con el pie fijo «Archivar».

#### CAT-22 · Archivar y fusionar: paso «Revisá el impacto» que el diseño no tiene — Archivar, Fusionar · teléfono · media
- **Consolidado en:** GLO-28 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** al tocar «Archivar» o «Fusionar» aparece otra pantalla con el título de sección «Revisá el impacto», filas de texto («Listo para asignar: +$30.00») y «Volver a editar / Confirmar» (`categoria-archivar__impacto`, `categoria-fusionar__impacto`).
- **Debería:** el impacto va en la misma pantalla antes de pulsar el botón del pie (07/archivar-categoria, 07/fusionar); no hay un segundo paso.
- **Arreglo:** mostrar el resumen en vivo en el formulario y que el botón del pie confirme; si el segundo paso se conserva (05 §4.4 lo pide para fusionar), proponerlo como CH y diseñarlo.
- **Cómo verificar:** un solo paso, o el diseño del segundo paso aprobado.

#### CAT-23 · Aviso de «Tiene dinero asignado en 1 período futuro» sin componente de aviso — Archivar · teléfono · media
- **Se ve:** tarjeta blanca con sombra, sin glifo ni color de estado.
- **Debería:** aviso en línea (PANTALLAS §2.14) con fondo de estado, glifo y texto, o la casilla de «Asignado en períodos futuros».
- **Arreglo:** `AvisoEnLinea` en `formulario.tsx`.
- **Cómo verificar:** fondo `--<estado>-fondo` y glifo.

#### CAT-24 · Sacar el dinero: título, subtítulo, textos y botón distintos — Sacar de archivada · teléfono, computadora · media
- **Se ve:** «SACAR EL DINERO», sin subtítulo; campos «Poner en» y «Monto a sacar»; ayuda «Gimnasio: Disponible $25.00.»; botón «Sacar».
- **Debería:** `…/sacar-de-archivada__telefono-claro.png`: «SACAR DE SUPERMERCADO», subtítulo «Archivada · Disponible $62.85», frase «X está archivada y todavía tiene dinero.», «Hacia», «Monto», «X tiene $62.85.» y botón «Sacar $62.85».
- **Arreglo:** `textos/categorias-sacar.ts` y `flujos/presupuesto-categorias-sacar/formulario.tsx` (título con nombre, subtítulo, botón con monto).
- **Cómo verificar:** textos iguales a la referencia.

#### CAT-25 · Sacar el dinero: panel de 420 px en computadora — Sacar · computadora · baja
- **Se ve:** `capturas/pliegue/categoria-sacar__hoja__computadora-claro.png`: panel de unos 420 px.
- **Debería:** 440 px (DECISIONES «Marco», flujos cortos).
- **Arreglo:** el ancho del panel en `componentes/marco/superpuesto.tsx`.
- **Cómo verificar:** `getBoundingClientRect().width` = 440.

#### CAT-26 · Sacar: el error de monto no se anuncia — Sacar · teléfono · media
- **Se ve:** `categoria-sacar__error-monto`: el mensaje aparece, pero el análisis cuenta `status=0 alert=0` en la captura.
- **Debería:** PANTALLAS §2.14 y la regla 8: avisos y errores con `role="status"` o `alert`.
- **Arreglo:** `formulario.tsx` de sacar (y los otros flujos: ver MAS-012).
- **Cómo verificar:** el mensaje tiene `role="alert"`.

#### CAT-27 · Entrada directa a «Sacar» es una página de flujo con barra superior distinta — Sacar · teléfono · baja
- **Se ve:** `categoria-sacar__pagina` abre una página de flujo (sin barra inferior), mientras que desde Presupuesto es una hoja sobre la lista.
- **Debería:** un único comportamiento (hoja / panel) tanto por enlace como por URL.
- **Arreglo:** ruta interceptada `@superpuesto/(.)presupuesto/categorias/[categoriaId]/sacar` y su par `sacar/page.tsx`; revisar que la página se reutilice como hoja al abrirla en frío.
- **Cómo verificar:** misma presentación por ambos caminos.

#### CAT-28 · Fusionar: título, etiqueta repetida y opciones sin grupo — Fusionar · teléfono · media
- **Se ve:** título «FUSIONAR CATEGORÍAS»; el campo repite «Fusionar con» como etiqueta y como texto de ayuda dentro del selector; opciones sin el grupo debajo del nombre.
- **Debería:** «Fusionar Restaurantes», etiqueta «Fusionar Restaurantes con» y selector con nombre y grupo en dos líneas (07/fusionar).
- **Arreglo:** `textos/categorias-fusionar.ts` y `formulario.tsx`.
- **Cómo verificar:** coincide con el PNG.

#### CAT-29 · Fusionar: resumen como frases y avisos sin títulos — Fusionar · teléfono · media
- **Se ve:** «1 período con asignación», «1 transacción»… como líneas de texto; aviso de meta sin título («Se descarta la meta de Café.»); aviso informativo con el copy «Todo el historial de Café pasa a la categoría que elijas…».
- **Debería:** «QUÉ PASA A <DESTINO>» con filas rótulo/valor (Períodos con asignado 7, Transacciones 41, Condonaciones, Programadas, Reglas), aviso `advertencia` con título «Se descarta una meta» y aviso `información` «X desaparece y Y queda con el historial de las dos. No se puede deshacer.»
- **Arreglo:** `formulario.tsx` y textos de fusionar.
- **Cómo verificar:** coincide con 07/fusionar.

#### CAT-30 · Fusionar: «Confirmar» en azul para una acción irreversible — Fusionar (paso de impacto) · teléfono · media
- **Se ve:** `categoria-fusionar__impacto__telefono-claro.png`: «Confirmar» con el botón principal azul; solo el «Fusionar» del primer paso es rojo.
- **Debería:** DECISIONES / INDICE-entrega-2 §«Eliminar»: «Fusionar también usa `peligro` porque no se puede deshacer».
- **Arreglo:** variante `peligro` en el botón de confirmar (`formulario.tsx`), o eliminar el segundo paso (CAT-22).
- **Cómo verificar:** el botón que ejecuta la fusión es `peligro`.

#### CAT-31 · Fusionar con destino archivado: el flujo no lo resuelve como el diseño — Fusionar · teléfono · alta
- **Se ve:** el selector solo lista categorías activas; el rechazo del servidor (destino archivado a mitad de edición) reemplaza todo el formulario por un aviso genérico «No se puede fusionar con lo elegido. Volvé a editar y revisá la categoría.» y un botón tonal (`categoria-fusionar__destino-archivado__telefono-claro.png`). Sin otras categorías activas (`categoria-fusionar__sin-destinos`), el flujo dice «No hay otra categoría activa…».
- **Debería:** `…/fusionar-destino-archivado__telefono-claro.png`: el selector muestra «Comida rápida (archivada)», borde `--problema-borde`, mensaje en el campo «La categoría destino debe estar activa.», «Fusionar» deshabilitado y debajo el motivo «Elegí una categoría activa.».
- **Arreglo:** listar las archivadas con «(archivada)», validar en el cliente y mostrar el error en el campo con el motivo bajo el botón (`flujos/presupuesto-categorias-fusionar/formulario.tsx`, `rechazos` en `textos/categorias-fusionar.ts`).
- **Cómo verificar:** elegir una archivada deja el formulario a la vista con el error en el campo.

#### CAT-32 · Flujos en computadora con campana y barra lateral — Archivar, Fusionar, Meta nueva y editar, Sacar (página) · computadora · alta
- **Consolidado en:** GLO-24 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `meta__nueva-para-fecha__computadora-claro.png`: sidebar completa, campana en la esquina y el flujo en una columna de 720 px pegada a la izquierda. El análisis da `campana=true` y `lateral=true` en todos los flujos de CAT y MAS (archivar, fusionar, sacar por URL, nueva y editar meta).
- **Debería:** DECISIONES «Marco»: los flujos —todo lo que termina en Guardar, Confirmar o Verificar— no llevan campana; los flujos cortos se abren como panel lateral de 440 px sobre la lista (09a/nueva computadora).
- **Arreglo:** el marco de flujo de computadora (`componentes/marco/pagina-flujo.tsx`) debe ocultar la campana; las metas deben ser hoja/panel (MAS-001).
- **Cómo verificar:** a 1440 px, las páginas de flujo no tienen campana.

#### CAT-33 · Calendario: tocables de 42 × 44 — Detalle · teléfono · baja
- **Se ve:** los días con gasto miden 42 × 44 (6 en `categoria__principal`, 4 en `categoria__sobregiro-tarjeta`, 1 en archivada y período cerrado).
- **Debería:** 44 × 44 (DECISIONES regla 6).
- **Arreglo:** `calendario.tsx`, ancho mínimo 44.
- **Cómo verificar:** `tocables` sin elementos < 44.

## BAN · Bandeja y Revisar movimiento

#### BAN-01 · Computadora: la Bandeja no abre el panel de revisión a la derecha — Bandeja principal · computadora-claro · alta
- **Se ve:** `capturas/bandeja__principal__computadora-claro.png`: una sola columna de 1144 px con las filas a todo el ancho (monto a 1262 px del borde izquierdo, medida `medidas/bandeja__principal__computadora-claro.json`). No hay panel derecho. El panel solo existe al entrar a un movimiento (`capturas/revisar__listo__computadora-claro.png`), y entonces la lista se angosta y desaparece el título «Bandeja».
- **Debería:** `tableros/S4-Bandeja__computadora-claro.png` y PANTALLAS §7 «Computadora»: lista a la izquierda (≈534 px) y a la derecha, ya abierta, la revisión del movimiento seleccionado (comercio, monto grande, SMS citado, Cuenta/Fecha/Categoría, Aprobar · Editar · Descartar). Título «BANDEJA» siempre visible.
- **Arreglo:** que `B/page.tsx` en computadora monte la lista y el panel (`F/bandeja-movimiento/panel-navegacion.tsx` ya existe) con el primer movimiento preseleccionado, y que el título de página no se pierda al abrir el panel. Contenedor de la lista a `max-width` de columna, no a 1144.
- **Cómo verificar:** a 1440 px, `/bandeja` con A.7 muestra lista (3 filas) + panel con SUPER SELECTOS ESCALON; el título «Bandeja» está arriba en ambos estados.

#### BAN-02 · El botón «Registrar» pierde su etiqueta a 390 px — Barra superior de pestañas · telefono-claro y telefono-oscuro · alta
- **Consolidado en:** GLO-22 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/bandeja__principal__telefono-claro.png`: botón cuadrado de 44 px con solo «+» (en todas las pantallas de pestaña). La etiqueta está oculta por `max-[25rem]:sr-only` y `max-[25rem]:w-11` en `componentes/navegacion/acceso-registrar.tsx:18-35` (25 rem = 400 px, así que 390 px cae dentro).
- **Debería:** `tableros/S4-Bandeja__telefono-claro.png` y PANTALLAS §3.1: botón de 44 de alto, padding `0 14 0 10`, ícono `plus` + «Registrar» `.t-etiqueta` 700, a 390 px.
- **Arreglo:** quitar la variante `max-[25rem]` de `VARIANTES.barra` (o bajarla a ≤ 360 px), y comprobar que cabe junto al título más largo («Presupuesto»).
- **Cómo verificar:** a 390 px la barra de Bandeja, Inicio, Presupuesto, Actividad y Cuentas muestra «+ Registrar».

#### BAN-03 · Margen lateral de 16 px en lugar de 20 px — pantallas de pestaña y flujos de Revisar y Registrar gasto · telefono-claro y telefono-oscuro · alta
- **Consolidado en:** GLO-29 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `analisis/bandeja__principal.md`: `main` con `pad=16px/16px`, texto más a la izquierda en x=16 (esperado 20). Igual en las 27 capturas de Revisar y las de `registrar-gasto__*`: x=16 (`registrar__devolucion-compra-elegida` también). En los flujos cortos (`registrar__ingreso`, `registrar__selector`) el margen sí es 20. En `revisar__no-encontrado`/`sin-cuentas` es 55 y 36.
- **Debería:** DECISIONES «Marco y densidad»: relleno lateral del contenido 20 px (`--espacio-5`); `tableros/S4-Bandeja__telefono-claro.png` mide 20 px.
- **Arreglo:** el contenedor de contenido de pestañas y flujos largos usa `--espacio-4`; pasarlo a `--espacio-5` en el marco (`componentes/navegacion/` marco de `(finn)`), y la hoja/pie del flujo largo (16 px es correcto en el pie, PANTALLAS §3.1: padding 12 16 26).
- **Cómo verificar:** a 390 px el borde izquierdo del primer texto de `/bandeja`, `/bandeja/[id]` y `/registrar/gasto` está en x=20 y el derecho a 20 px del borde.

#### BAN-04 · Acciones secundarias de la fila como enlaces subrayados — Bandeja · telefono-claro y computadora-claro · alta
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** «Revisar», «Ver la programada», «Completar datos», «Registrar a mano» son `EnlaceFinn` con `underline`, 16 px peso 600 (`componentes/dominio/movimiento-bandeja.tsx:201-206`; el análisis marca «Revisar»: tamaño 16≠14, peso 600≠700, decoración underline≠none). Ver `capturas/bandeja__principal__telefono-claro.png` y `capturas/bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes__telefono-claro.png`.
- **Debería:** `tableros/S4-Bandeja__telefono-claro.png`: «Revisar» es botón de texto 14 px 700 `--accion`, sin subrayado; «Registrar a mano», «Completar datos», «Es otro gasto», «Intentar de nuevo» son botones **tonales** (`tableros/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png`); «Descartar» es botón de texto.
- **Arreglo:** usar `Boton` con variante `texto` para Revisar/Descartar y `tonal` para las acciones únicas de la fila (`movimiento-bandeja.tsx` y `componentes/base/boton.tsx`); reservar el enlace subrayado para «Ver transacción». «Ver la programada» en la fila de coincidencia: el diseño no lo pone, la línea dice «→ programada Netflix del 17/10».
- **Cómo verificar:** ninguna fila de Bandeja tiene texto subrayado salvo «Ver transacción»; las alturas de los tocables siguen ≥ 44.

#### BAN-05 · Fila con acciones de más, asa visible y sin flecha — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** la fila «lista» muestra Aprobar + Descartar + Revisar, y por ancho «Revisar» cae a una tercera línea (`capturas/bandeja__principal__telefono-claro.png`, y `bandeja__error-al-aprobar`); el asa ⋮⋮ de arrastre queda visible a la izquierda de las acciones (`movimiento-bandeja.tsx:127`); las filas sin acción no llevan flecha `chevR` cuando tienen un enlace (la de coincidencia).
- **Debería:** S4 teléfono: fila lista = «Aprobar» (principal) + «Revisar» (texto) en una sola línea; sin asa visible (el arrastre es un atajo discreto, PANTALLAS §7 nota); filas sin acción = toda la fila tocable con `chevR` a la derecha.
- **Arreglo:** mover «Descartar» a la pantalla de Revisar (ya está ahí) o a un menú; dejar el asa como `sr-only`/sin dibujo hasta el foco; en `movimiento-bandeja.tsx` mostrar `chevR` siempre que la fila abra Revisar.
- **Cómo verificar:** en la fila lista, Aprobar y Revisar caben en una línea a 390 px; las filas sin acción muestran flecha.

#### BAN-06 · Resultado de aprobar o descartar integrado en la lista, con glifo y texto distintos — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__aprobado-con-un-toque__telefono-claro.png`: el resultado es la primera fila del mismo contenedor de la lista, «Ver transacción» a la derecha del texto; resumen «2 pendientes». `capturas/bandeja__descartado__telefono-claro.png`: glifo check (no papelera) y «Descartaste Super $35.00.».
- **Debería:** `tableros/S4-Bandeja__aprobado-con-un-toque.png`: tarjeta propia, separada de la lista por 24 px, «Aprobado: COMERCIO · $35.00 · Visa Oro · Supermercado» y «Ver transacción» debajo, subrayado. `tableros/S4-Bandeja__descartado.png`: glifo papelera, «Descartado: FARMACIA SAN NICOLAS · $12.35» y «Restaurar» con ícono. El resumen dice «1 pendiente · 1 con coincidencia».
- **Arreglo:** `B/fila.tsx` y `componentes/base/resultado.tsx`: renderizar el resultado como contenedor propio (Contenedor §1) fuera de la tarjeta de filas; ícono `trash` para descartado; textos en `textos/bandeja.ts` (`textoDescartado`, `textoAprobado`) con el formato «Verbo: comercio · monto · cuenta · categoría».
- **Cómo verificar:** tras aprobar/descartar, el resultado es una tarjeta aparte con la medida de S4 y permanece hasta navegar.

#### BAN-07 · Descartados sin el resumen «N en los últimos 30 días» — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__vista-de-descartados__telefono-claro.png`: solo el título «DESCARTADOS», sin texto a la derecha.
- **Debería:** `tableros/S4-Bandeja__vista-de-descartados.png`: «2 en los últimos 30 días» `.t-cuerpo-pequeno` a la derecha; filas con el nombre en negrita 700 y «Descartado hoy»/«Descartado el 10/10» (no «Descartado · T · 20/…» truncado).
- **Arreglo:** `B/descartados.tsx`: agregar el resumen (texto en `textos/bandeja.ts`) y la línea de estado con fecha relativa, sin truncar.
- **Cómo verificar:** con 3 descartados se lee «3 en los últimos 30 días».

#### BAN-08 · Bandeja al día: ícono y texto distintos — Bandeja · telefono-claro y telefono-oscuro · baja
- **Se ve:** `capturas/bandeja__al-dia__telefono-claro.png`: ícono bandeja (`inbox`) en el disco y «No hay movimientos por revisar.»
- **Debería:** `tableros/S4-Bandeja__bandeja-al-dia.png`: ícono check en círculo y «No hay movimientos por revisar. Los SMS nuevos de tu banco van a aparecer aquí.»
- **Arreglo:** vacío 2.19 en `B/lista.tsx` / `textos/bandeja.ts`.
- **Cómo verificar:** coincide el glifo y la segunda frase.

#### BAN-09 · Metadatos de la fila: fecha completa, sin origen ni hora, sin línea de destino — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** «Visa Oro · 15/10/2026» (`bandeja__principal__telefono-claro`); la fila lista dice «→ Supermercado»; la de coincidencia no dice a qué programada se parece.
- **Debería:** S4: «Visa Oro · 15/10 · BAC 12:41», «→ Supermercado (por regla)», «→ programada Netflix del 17/10»; «Cuenta corriente · 14/10 · ayer 18:05».
- **Arreglo:** `movimiento-bandeja.tsx` y `textos/bandeja.ts`: fecha corta d/m (con año solo si no es el actual), fuente y hora, y la «razón» del destino («por regla», «del historial»).
- **Cómo verificar:** el subtítulo de la fila coincide en estructura con S4.

#### BAN-10 · Nota al pie sin la mitad de la frase — Bandeja · telefono-claro y computadora-claro · baja
- **Se ve:** «Tocá un movimiento para revisarlo completo.»
- **Debería:** PANTALLAS §7 y S4: «…Arrastrar a una categoría es un atajo; los botones siempre están.»
- **Arreglo:** `textos/bandeja.ts` (la nota).
- **Cómo verificar:** el texto es el de §7.

#### BAN-11 · Selector Por revisar / Descartados: opción activa sin borde y con peso 700 — Bandeja · telefono-claro, telefono-oscuro y computadora-claro · baja
- **Se ve:** la opción activa es una píldora blanca con sombra, peso 700 (`analisis/bandeja__principal.md`: «Por revisar · 3» peso 700≠500).
- **Debería:** S4: opción activa con borde de 1.5 px `--borde-fuerte`, fondo superficie, peso 500.
- **Arreglo:** `B/selector-vista.tsx` (o el segmentado compartido en `componentes/base/`).
- **Cómo verificar:** coincide el segmentado en claro y oscuro.

#### BAN-12 · Fila de «No reconocido» y «Con error»: título «Sin comercio» y sin fecha ni monto «—» — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes__telefono-claro.png`: «Sin comercio», sin monto, el SMS citado, sin hora; «Con error» sin el motivo («Algo falló al procesarlo.»); «Datos faltantes» sin «Falta la cuenta.»
- **Debería:** `tableros/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png`: «SMS de BAC», «Hoy 09:12 · sin monto ni comercio», monto «—», SMS citado con «· BAC · hoy 09:12», «Con error Algo falló al procesarlo.» + «Intentar de nuevo» y «Copiar referencia» con ícono, «Datos faltantes / Falta la cuenta.».
- **Arreglo:** `componentes/dominio/movimiento-bandeja.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** las cuatro filas coinciden con S4 en estructura.

#### BAN-13 · Orden de las filas distinto — Bandeja · telefono-claro · baja
- **Se ve:** Netflix (coincidencia), Farmacia, Super Selectos.
- **Debería:** S4: listo para aprobar primero, luego falta categoría, luego coincidencia.
- **Arreglo:** el criterio de orden de `B/lista.tsx`/`B/activos.ts` (verificar contra 05 antes de tocar: puede ser un orden por fecha del dato).
- **Cómo verificar:** con A.7, Super Selectos aparece primero. Puede ser solo de datos si el orden de la app es por fecha.

#### BAN-14 · Revisar: falta la confirmación del impacto «Después de aprobar» — Revisar movimiento · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Consolidado en:** GLO-28 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: después de la nota hay solo la casilla «Recordar esta categoría…» y el pie; no hay bloque de impacto antes de aprobar.
- **Debería:** `01-revisar-movimiento/listo__telefono-claro.png`: contenedor «DESPUÉS DE APROBAR» con «Supermercado · Disponible $62.85 → $27.85» y «Visa Oro · deuda $642.18 → $677.18» (también `dividido__*`, `devolucion__*`, `pago-de-tarjeta__*`).
- **Arreglo:** en `F/bandeja-movimiento/formulario.tsx`, montar `ConfirmacionImpactoDeVista` (`componentes/formularios/confirmacion-impacto-de-vista.tsx`) como bloque en vivo bajo la nota, no solo al confirmar.
- **Cómo verificar:** al abrir un movimiento listo aparece el bloque con las filas «valor actual → valor nuevo».

#### BAN-15 · Revisar: «Dividir» siempre abierto en lugar de Categoría + «Dividir en partes» — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: sección «DIVIDIR» con «1 LÍNEA», campo categoría + monto, «+ Agregar línea» y «Suma de las líneas». En `dividido`: rótulos de línea y «Agregar línea».
- **Debería:** `listo__telefono-claro.png`: campo «Categoría» (selector de ancho completo) y debajo el enlace «+ Dividir en partes»; solo al dividir aparecen «Parte 1», «Parte 2», «Agregar parte», «Suma de las partes» y la nota «Con más de una parte no se ofrece “Recordar esta categoría”.» (`dividido__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` y `F/registrar-gasto/lineas.tsx`: modo simple (una categoría) + botón «Dividir en partes»; rótulos «Parte n»/«partes» en `textos/bandeja.ts` para Revisar (Registrar gasto conserva «líneas», S5).
- **Cómo verificar:** el estado «listo» no muestra «Dividir»; al tocar «Dividir en partes» aparecen dos partes.

#### BAN-16 · Revisar en teléfono: falta el contador «1 de N» — Revisar movimiento · telefono-claro · baja
- **Se ve:** la barra superior solo tiene la «X» y el título.
- **Debería:** `listo__telefono-claro.png`: «1 de 6» a la derecha del título.
- **Arreglo:** `F/bandeja-movimiento/encabezado.tsx` / `panel-navegacion.tsx` mostrar el contador también en teléfono si hay más movimientos.
- **Cómo verificar:** con 3 movimientos por revisar, el encabezado dice «1 de 3».

#### BAN-17 · Revisar en computadora: título grande, flechas pegadas a la campana y panel sin la forma del diseño — Revisar movimiento · computadora-claro · media
- **Se ve:** `capturas/revisar__listo__computadora-claro.png`: «REVISAR MOVIMIENTO» como título de pantalla (40 px) con «3 de 3», flechas y X; la campana de la página se superpone a la flecha derecha; el panel arranca en el borde superior sin radio ni margen; la lista pierde el título «BANDEJA».
- **Debería:** `01-revisar-movimiento/listo__computadora-claro.png`: panel-tarjeta (radio contenedor, elevación 1) con rótulo pequeño «REVISAR MOVIMIENTO» a la izquierda y ← → ✕ a la derecha, 24 px de padding; título «BANDEJA» arriba del todo; fila seleccionada con raya lateral `--accion`.
- **Arreglo:** `F/bandeja-movimiento/encabezado.tsx` (rol `rotulo` en panel) y el contenedor del panel en `B/[movimientoId]/page.tsx`.
- **Cómo verificar:** la campana no toca los controles del panel y el título «Bandeja» sigue visible.

#### BAN-18 · «Descartar» como botón tonal de ancho completo en vez de botón de texto — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`, `revisar__no-reconocido`: botón tonal de 48 px con papelera.
- **Debería:** `01-revisar-movimiento/listo__telefono-claro.png`: «Descartar» es botón de texto (papelera + etiqueta) centrado bajo el principal, sin fondo. Excepción: «No es este pago» (coincidencia) y «Es duplicado» sí son tonales.
- **Arreglo:** variante `texto` de `Boton` en `F/bandeja-movimiento/formulario.tsx` y `estados.tsx`.
- **Cómo verificar:** el pie fijo muestra principal + texto.

#### BAN-19 · Revisar: controles que el diseño no tiene (chips Hoy/Ayer, casilla «Recordar») y casilla de 20 × 20 — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** chips «Hoy» «Ayer» bajo Fecha y casilla «Recordar esta categoría para este comercio» de 20 × 20 px (`analisis/revisar__listo.md`: «Tocables < 44»; repetido en `datos-faltantes`, `validacion`, `error-de-red`, `sin-conexion`, `aprobando`).
- **Debería:** `listo__telefono-claro.png`: Fecha sin atajos; la regla se ofrece **después** de aprobar («¿Siempre a Supermercado?» con «Crear regla»/«Ahora no», ver BAN-24). Si la casilla se queda, 44 × 44 de área de toque.
- **Arreglo:** quitar los chips en esta pantalla (`componentes/formularios/entrada-fecha.tsx` los pone por defecto) y mover «Recordar» a la propuesta posterior; si no, ampliar el área táctil.
- **Cómo verificar:** ningún tocable < 44; coincide con el diseño.

#### BAN-20 · Revisar: subtítulo, rótulo del SMS y etiquetas distintos — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** «Visa Oro · 15/10/2026 · Categoría sugerida: Supermercado (de tu historial)», recuadro «TEXTO DEL SMS» sin comillas, etiqueta «Cuenta o tarjeta», «Monto».
- **Debería:** «Visa Oro · 15/10 · categoría por la regla “SUPER SELECTOS”» (`listo__telefono-claro.png`); rótulo «SMS DE BAC · HOY 12:41» con el texto entre comillas; etiqueta «Cuenta»; nota con placeholder «Hasta 500 caracteres».
- **Arreglo:** `F/bandeja-movimiento/texto-sms.tsx`, `encabezado.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** los rótulos y el formato coinciden con la referencia.

#### BAN-21 · No reconocido: sin monto «—», sin el aviso de formato, aviso azul donde va uno neutro — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__no-reconocido__telefono-claro.png`: «SIN COMERCIO», un aviso `informacion` celeste, sin monto ni hora.
- **Debería:** `01-revisar-movimiento/no-reconocido__telefono-claro.png`: «SMS DE BAC», una raya «—» de monto, «Hoy 09:12 · sin monto ni comercio», dos avisos **neutros** (glifo circular punteado «No encontramos un formato de BAC…» y «Si corregís el formato en Ajustes › Formatos, este SMS se puede volver a procesar desde aquí.»).
- **Arreglo:** `F/bandeja-movimiento/estados.tsx`, `textos/bandeja.ts`; avisos con la variante neutra de `componentes/base/aviso.tsx`.
- **Cómo verificar:** coinciden los dos avisos y el encabezado.

#### BAN-22 · Con error: «Detalle del error» duplicado y referencia sin su tarjeta — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__con-error__telefono-claro.png`: bloque «Detalle del error» con `cuerpo_invalido: content_type`, repetido debajo en «Referencia: …», botón «Copiar referencia» tonal suelto y tres botones en el pie (incluye «Registrar a mano»).
- **Debería:** `01-revisar-movimiento/con-error__telefono-claro.png`: tarjeta «REFERENCIA / BDJ-4K2Q» (negrita, espaciado de letras) con «Copiar referencia» tonal a la derecha; la leyenda «La misma referencia aparece en Ajustes › Diagnóstico.»; pie con solo «Intentar de nuevo» y «Descartar».
- **Arreglo:** `F/bandeja-movimiento/detalle-error.tsx` y `formulario.tsx` (quitar el duplicado y el tercer botón del pie).
- **Cómo verificar:** una sola referencia, en su tarjeta.

#### BAN-23 · Coincidencia: formulario de edición completo en lugar del resumen de la programada — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__coincidencia__telefono-claro.png`: tras el aviso, una tabla de 3 filas (Programada, Fecha esperada, Monto esperado) y luego el formulario completo (Cuenta, Fecha, Monto, Hoy/Ayer, Comercio, Tipo, Dividir con «Elegí…» vacío, Nota). La categoría de la división aparece vacía.
- **Debería:** `01-revisar-movimiento/coincidencia__telefono-claro.png`: título «Coincide con Netflix del 17/10», tabla de 5 filas (Programada, Fecha esperada, Monto esperado, Cuenta, Categoría), el aviso neutro «Un movimiento con coincidencia no se descarta…» y nada más; pie «Confirmar» + «No es este pago».
- **Arreglo:** `F/bandeja-movimiento/coincidencia.tsx` y `formulario.tsx`: no montar los campos de edición en el estado de coincidencia; agregar Cuenta y Categoría a la tabla.
- **Cómo verificar:** la pantalla de coincidencia no tiene campos editables.

#### BAN-24 · Aprobado: faltan la propuesta de regla y «Siguen por revisar»; el cierre es «Volver a la Bandeja» — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__aprobado__telefono-claro.png`: el resultado sin tarjeta, «Ver transacción» subrayado a la derecha, el resto vacío y «Volver a la Bandeja».
- **Debería:** `01-revisar-movimiento/aprobado__telefono-claro.png`: tarjeta de resultado con «Ver transacción» debajo; tarjeta «¿Siempre a Supermercado?» con «Crear regla» (tonal) y «Ahora no»; sección «SIGUEN POR REVISAR» con las filas restantes; botón principal «→ Siguiente movimiento». (En el repo `textos/bandeja.ts:149` tiene `siguiente: 'Siguiente movimiento'`, pero la captura no lo muestra; no hay texto de la propuesta de regla en `textos/` ni en `F/bandeja-movimiento/`.)
- **Arreglo:** `F/bandeja-movimiento/resultado.tsx`: agregar la propuesta de regla (según diseño 05) y la lista de pendientes, y el botón siguiente cuando haya más movimientos.
- **Cómo verificar:** tras aprobar con otros 2 pendientes, el pie dice «Siguiente movimiento».

#### BAN-25 · Devolución: desborde horizontal y «Cambiar compra» cortado; la compra no se elige en lista — Revisar movimiento · telefono-claro y telefono-oscuro · crítica
- **Se ve:** `capturas/revisar__devolucion-compra-elegida__telefono-claro.png`: documento de 446 px en 390 (`analisis/revisar__devolucion-compra-elegida.md`: «Desborde horizontal», `form#formulario-revisar-movimiento > fieldset` x=20 w=425.8): el botón «Cambiar compra» queda cortado y el campo de monto sobresale; el rótulo del campo dice «Supermercado» (la categoría) y no «Monto». No se ve el encabezado ni el título porque el scroll quedó abajo.
- **Debería:** `01-revisar-movimiento/devolucion__telefono-claro.png`: título «¿QUÉ COMPRA TE DEVOLVIERON?» y lista de radios con comercio, fecha, categoría y «quedan $X por devolver»; bloque «Después de aprobar» con «Sobregiro con débito o efectivo»; pie «Aprobar devolución $18.50».
- **Arreglo:** `F/bandeja-movimiento/eleccion-compra.tsx` (`min-w-0` en el `fieldset`, rejilla que no supere el ancho) y reemplazar el botón por la lista de compras; rótulos en `textos/bandeja.ts`.
- **Cómo verificar:** `documentElement.scrollWidth` = 390 y la lista de compras se lee completa.

#### BAN-26 · Posible duplicado: nota fuera del pie y la fila original sin origen — Revisar movimiento · telefono-claro · baja
- **Se ve:** `capturas/revisar__posible-duplicado__telefono-claro.png`: la explicación de «Es duplicado» en un aviso neutro dentro del cuerpo; la tarjeta del gasto original con «T · 20/02/2027».
- **Debería:** `posible-duplicado__telefono-claro.png`: la nota va **bajo** los botones como texto terciario centrado dentro del pie; la tarjeta dice «Visa Oro · 14/10 · registrada desde un SMS a las 20:01». El resto (aviso de advertencia, botones) coincide.
- **Arreglo:** `F/bandeja-movimiento/estados.tsx`.
- **Cómo verificar:** coincide el pie.

#### BAN-27 · Ya aprobado: tabla de solo lectura en lugar de los campos deshabilitados; «Ver transacción» falta en el aviso — Revisar movimiento · telefono-claro · media
- **Se ve:** `capturas/revisar__ya-aprobado__telefono-claro.png`: aviso «Este movimiento ya se aprobó.» sin enlace y un contenedor «SOLO LECTURA» con filas; «Volver a la Bandeja» principal.
- **Debería:** `01-revisar-movimiento/ya-aprobado__telefono-claro.png`: aviso «Este movimiento ya está aprobado.» con «Ver transacción» dentro; los campos Cuenta, Fecha, Monto, Comercio y Nota en su forma deshabilitada (borde discontinuo, «Solo lectura» a la derecha de la etiqueta); «Volver a la Bandeja» tonal.
- **Arreglo:** `F/bandeja-movimiento/ya-resuelto.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** coincide el estado; en `ya-descartado` el texto es «Este movimiento ya está descartado.».

#### BAN-28 · Pago de tarjeta: aparece el formulario genérico de gasto — Revisar movimiento · telefono-claro · alta
- **Se ve:** `analisis/revisar__pago-de-tarjeta.md`: el estado muestra «Falta la categoría», «FARMACIA SAN NICOLAS», «Cuenta o tarjeta», Hoy/Ayer, «Sale de» y no aparecen «Pago a Visa Oro», «Tarjeta», «Desde», «Preseleccionada…», «Después de aprobar» ni «Te falta reservar / Meta cubierta». La captura no representa el movimiento de pago (puede ser el semillado del caso `revisar__pago-de-tarjeta`, línea 655 del archivo de casos; no pude confirmar sin repetir la semilla).
- **Debería:** `01-revisar-movimiento/pago-de-tarjeta__telefono-claro.png`: «Listo para aprobar», «Pago a Visa Oro», campos Tarjeta y Desde (preseleccionada), impacto «Después de aprobar».
- **Arreglo:** verificar primero el semillado en `tools/auditoria/casos/40-ban-reg.cap.ts` y, si es correcto, `F/bandeja-movimiento/formulario.tsx` no tiene la variante de pago.
- **Cómo verificar:** el estado muestra «Pago a Visa Oro» con Tarjeta/Desde.

#### V-08 · Revisar: el segmento «Gasto» elegido se dibuja con relleno y sombra — Revisar movimiento · telefono-claro · baja
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: el segmento seleccionado con relleno blanco y sombra.
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/01-revisar-movimiento/listo__telefono-claro.png` y K2 Selección: contorno de 1.5 px en `--borde-fuerte`, sin relleno diferenciado. Es el mismo patrón que GLO-33 y MAS-010 para otros segmentados.
- **Arreglo:** `apps/web/src/componentes/base/selector-segmentado.tsx`, usado por `apps/web/src/flujos/bandeja-movimiento/campos-movimiento.tsx`.
- **Cómo verificar:** el segmento activo tiene borde de 1.5 px `--borde-fuerte` y fondo igual al resto.
- **Sección:** BAN · **Fuente:** verificación independiente

## REG · Registrar

#### REG-01 · Selector de tipo: lista de 11 filas de texto en lugar de cuadrícula de 8 tarjetas con ícono — Registrar · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Se ve:** `capturas/registrar__selector__telefono-claro.png`: 11 filas de ancho completo con título largo («Un gasto», «Un ingreso», «Una transferencia entre mis cuentas»…), sin ícono, incluyendo «Un retiro de una inversión», «Un ajuste de valor», «Dinero que entra a una tarjeta» (sin diseño); sin la nota final.
- **Debería:** `12-…/selector__telefono-claro.png`: cuadrícula de 2 columnas, 8 tarjetas de ≈ 168 × 150 (radio contenedor, elevación 1), disco con ícono (gasto en `--accion-secundaria`, resto en `--superficie-hundida`), título «Gasto», «Ingreso», «Transferencia», «Devolución», «Inversión», «Desembolso», «Avance de efectivo», «Transferencia de deuda» y subtítulo corto («Con división y por cobrar»); nota «Solo aparecen los tipos que tus cuentas permiten: …».
- **Arreglo:** `F/registrar/lector.tsx` y `R/page.tsx` + textos del selector; agrupar retiro/ajuste dentro de «Inversión» («Aporte, retiro o ajuste») y la entrada a tarjeta dentro de la tarjeta correspondiente, o pedir diseño (ver Sin diseño).
- **Cómo verificar:** a 390 px se ve una cuadrícula 2 × 4 con íconos y la nota inferior.

#### REG-02 · Flujos cortos: la cuenta se elige con radios en lugar de un selector con ícono y subtítulo — Registrar (ingreso, transferencia, tarjeta, desembolso) · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png` y `registrar__transferencia__telefono-claro.png`: listas de radios («Cuenta corriente», «Cuenta de ahorro») bajo «Cuenta que recibe» / «Cuenta de origen» / «Cuenta de destino».
- **Debería:** `12-…/ingreso__telefono-claro.png`: selector de 52 con ícono de la cuenta, nombre 600 y subtítulo («Solo cuentas de efectivo»); transferencia: «Desde» (con «Saldo $1,284.60») y «Hacia».
- **Arreglo:** `F/registrar-tipo/formulario.tsx`: usar el selector de cuenta de Registrar gasto (`componentes/formularios/`, el que muestra «Visa Oro / Deuda $642.18») para estos campos; etiquetas «Cuenta», «Desde», «Hacia».
- **Cómo verificar:** no hay radios para elegir cuenta en los flujos cortos.

#### REG-03 · Radios sin nombre accesible — Registrar · telefono-claro y computadora-claro · media
- **Se ve:** `analisis/registrar__ingreso.md`: «Tocables sin nombre accesible (2): button@32,348; button@32,396» (`role="radio"`, nombre vacío en `medidas/registrar__ingreso__telefono-claro.json`); 4 en transferencia, 4 en transferencia-deuda, 3 en desembolso; en `registrar__cargando` dos enlaces vacíos de 270 × 44.
- **Debería:** DECISIONES regla 8 y PANTALLAS §11: todo control con nombre accesible.
- **Arreglo:** `aria-labelledby` hacia el texto de cada radio (si se mantienen) en `F/registrar-tipo/formulario.tsx`; los enlaces del loading (`R/loading.tsx`) con `aria-hidden` o texto.
- **Cómo verificar:** el análisis da 0 «sin nombre».

#### REG-04 · Fecha y Total apilados en vez de dos columnas; «Monto» en lugar de «Total» — Registrar (flujos cortos) · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png`: Fecha (ancho completo), luego Monto debajo, sin prefijo «$» (el «Se entiende como $925.00» lo reemplaza).
- **Debería:** `12-…/ingreso__telefono-claro.png`: Fecha y Total en dos columnas, Total con prefijo «$».
- **Arreglo:** `F/registrar-tipo/formulario.tsx` y `componentes/formularios/` (campo de monto con prefijo, el de Registrar gasto).
- **Cómo verificar:** coinciden las dos columnas y el prefijo.

#### REG-05 · Flujos cortos sin el impacto antes de guardar — Registrar (ingreso, transferencia, devolución, inversión, tarjeta, desembolso) · telefono-claro y computadora-claro · alta
- **Consolidado en:** GLO-28 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png`, `registrar__transferencia__telefono-claro.png`: ninguna fila de impacto; solo el botón.
- **Debería:** ingreso: contenedor «Listo para asignar $312.40 → $1,237.40»; transferencia: «No cambia el presupuesto.» (`12-…/ingreso__*`, `transferencia__*`).
- **Arreglo:** montar `ConfirmacionImpacto` (`componentes/formularios/confirmacion-impacto.tsx`) en vivo en `F/registrar-tipo/formulario.tsx` (hoy solo se muestra tras confirmar, ver `registrar__retroactivo`).
- **Cómo verificar:** al escribir un monto aparece la fila de impacto.

#### REG-06 · Pie de la hoja sin «Cancelar» y con el botón sin monto — Registrar (flujos cortos) · telefono-claro y computadora-claro · media
- **Se ve:** un solo botón «Guardar ingreso» / «Transferir» a todo el ancho.
- **Debería:** `12-…/ingreso__telefono-claro.png`: dos botones iguales, «Cancelar» (tonal) y «Guardar $925.00» (principal); «Transferir $100.00».
- **Arreglo:** pie del flujo corto en `F/registrar-tipo/formulario.tsx` y `componentes/formularios/`.
- **Cómo verificar:** coinciden las etiquetas y el par de botones.

#### REG-07 · Textos auxiliares que el diseño no tiene — Registrar (flujos cortos) · telefono-claro · baja
- **Se ve:** «Fecha elegida: 15/10/2026» y «Se entiende como $925.00» bajo los campos.
- **Debería:** no aparecen en `12-…/ingreso__telefono-claro.png`.
- **Arreglo:** pasarlos a `aria-live` visualmente oculto o proponer el diseño (si responden a una regla de 05 que el diseño no recogió).
- **Cómo verificar:** no se ven; se anuncian por lector.

#### REG-08 · Título de la hoja de transferencia — Registrar · telefono-claro · baja
- **Se ve:** «TRANSFERIR ENTRE CUENTAS».
- **Debería:** «TRANSFERENCIA» (`12-…/transferencia__telefono-claro.png`); «REGISTRAR INGRESO» coincide.
- **Arreglo:** `textos/` del flujo.
- **Cómo verificar:** título coincide.

#### REG-09 · Fecha en período cerrado: confirmación sin el aviso titulado, sin el período y con otros botones — Registrar · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar__retroactivo__telefono-claro.png`: título «REVISÁ EL IMPACTO», una sola fila «Listo para asignar cambia +$925.00.», advertencia sin título ni fechas del período, botones «Volver a editar» y «Confirmar».
- **Debería:** `12-…/retroactivo__telefono-claro.png`: título «REGISTRAR GASTO OLVIDADO» con el campo Fecha, aviso `advertencia` «Cambio retroactivo. La fecha cae en un período cerrado (21/08 – 20/09). Se registra allí y lo posterior se recalcula.», tres filas de impacto («Listo para asignar hoy $312.40 → $279.15», «Supermercado · Disponible», «Reducción proyectada al cierre») y «Cancelar» + «Confirmar y guardar». (La captura usa un ingreso; la referencia un gasto: diferencia de caso, no de composición.)
- **Arreglo:** `componentes/formularios/confirmacion-impacto-de-vista.tsx` y `textos/formularios.ts`.
- **Cómo verificar:** el aviso trae título y período; botones «Cancelar»/«Confirmar y guardar».

#### REG-10 · Registrar gasto: el impacto «Antes de guardar» solo aparece al pulsar Guardar — Registrar gasto · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Consolidado en:** GLO-28 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png` y `__computadora-claro.png`: con 3 líneas completas no hay bloque de impacto (`F/registrar-gasto/formulario.tsx:217-233` solo lo monta en estado `confirmando`).
- **Debería:** `entrega-1/referencia/S5-Registrar__telefono-claro.png` y `__computadora-claro.png`: contenedor «ANTES DE GUARDAR» con «Visa Oro · deuda $642.18 → $790.78», «Supermercado $62.85 → −$33.25» con el indicador «Deuda sin reservar», «Farmacia $27.65 → $5.15», «Carlos te debe $40.00 → $70.00» (PANTALLAS §8.6, DECISIONES «Registrar gasto»).
- **Arreglo:** previsualización en vivo (misma operación de previsualización, con espera) en `formulario.tsx`, usando `confirmacion-impacto-de-vista.tsx`.
- **Cómo verificar:** con A.7 y 3 líneas, aparece el bloque antes de tocar Guardar.

#### REG-11 · Registrar gasto: suma distinta del total sin aviso de problema y con Guardar activo — Registrar gasto · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/registrar-gasto__suma-distinta-del-total__telefono-claro.png`: «Falta repartir $10.00» como texto secundario sin glifo; el botón sigue «Guardar $148.60» activo.
- **Debería:** `S5-Registrar__suma-distinta-del-total.png`: aviso `problema` con glifo y color («Faltan $10.00 por repartir. La suma tiene que ser igual al total.», `role="alert"`) y «Guardar» deshabilitado con el motivo «La suma de las líneas no coincide con el total.» debajo (DECISIONES «Registrar gasto»; regla 2 tres señales).
- **Arreglo:** `F/registrar-gasto/lineas.tsx` y `formulario.tsx`: `AvisoEnLinea estado="problema"` y `disabled` + `aria-describedby` en el botón del pie.
- **Cómo verificar:** con diferencia, el botón está deshabilitado y el aviso tiene glifo y rol.

#### REG-12 · Registrar gasto: etiquetas, ayuda de cuenta y placeholder de la nota — Registrar gasto · telefono-claro y computadora-claro · media
- **Se ve:** «Cuenta o tarjeta», «Total del gasto»; sin «Propuesta: la cuenta que más usás en PRICESMART.»; Nota sin «Hasta 500 caracteres»; `analisis/registrar-gasto__principal.md`: faltan 7 textos / sobran 2.
- **Debería:** S5: «Cuenta», «Total», la línea de propuesta en `--texto-terciario`, placeholder «Hasta 500 caracteres».
- **Arreglo:** `textos/formularios.ts` y `F/registrar-gasto/formulario.tsx`.
- **Cómo verificar:** coinciden los textos de S5.

#### REG-13 · Registrar gasto: detalle de las líneas — Registrar gasto · telefono-claro · baja
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png`: el monto con «$» separado a la izquierda del campo; «+ Agregar línea» alineado a la izquierda; «Carlos (me lo …» truncado.
- **Debería:** S5: el monto es «$96.10» alineado a la derecha en el campo; «+ Agregar línea» centrado; la categoría parte en dos líneas «Carlos (me lo / debe)».
- **Arreglo:** `F/registrar-gasto/lineas.tsx` y `parte.tsx`.
- **Cómo verificar:** coincide el dibujo de las líneas.

#### REG-14 · Registrar gasto: pie y márgenes — Registrar gasto · telefono-claro y telefono-oscuro · media
- **Se ve:** texto a 16 px del borde (`analisis/registrar-gasto__*.md`: «margen izq 16»); el `main` mide 1080 px de máximo en teléfono (`max=1080px`).
- **Debería:** 20 px laterales (DECISIONES «Marco»); el pie fijo sí lleva 16 px.
- **Arreglo:** igual que BAN-03.
- **Cómo verificar:** x=20.

#### REG-15 · Guardado: título, enlaces por línea y falta «Ver transacción» — Registrar gasto · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__guardado__telefono-claro.png`: título «GASTO REGISTRADO»; enlaces «Ver Supermercado», «Ver Farmacia» (sin Carlos), «Registrar otro» y «Volver a Inicio».
- **Debería:** `S5-Registrar__guardado.png`: título «REGISTRAR GASTO», un único enlace «Ver transacción» dentro de la tarjeta de resultado; las cifras por línea en una tarjeta (con su contenedor interno).
- **Arreglo:** `F/registrar-gasto/resultado-gasto.tsx` y `textos/`.
- **Cómo verificar:** un solo «Ver transacción»; título igual a S5.

#### REG-16 · Registrar gasto en computadora: ancho, enlace de vuelta y barra lateral — Registrar gasto · computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__principal__computadora-claro.png`: `main` de 1144 px con dos columnas, «X» a la izquierda del título, ningún ítem activo en la barra lateral, campana presente.
- **Debería:** `S5-Registrar__computadora-claro.png`: enlace «← Inicio» sobre el título, ítem «Inicio» activo en la barra, impacto en la columna derecha. DECISIONES dice flujos con `max-width: 720px`; el propio S5 mide ≈ 1144 con dos columnas (ver Contradicciones).
- **Arreglo:** `R/gasto/page.tsx`: enlace de vuelta y estado activo de la barra según el origen.
- **Cómo verificar:** coincide el encabezado y la barra lateral.

#### V-06 · Registrar gasto: ícono de calendario en el campo Fecha — Registrar gasto · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png`: el campo Fecha lleva un ícono de calendario a la derecha.
- **Debería:** `docs/diseno/02-referencias/entrega-1/referencia/S5-Registrar__telefono-claro.png`: el campo Fecha sin ícono (el calendario se abre al tocar el campo).
- **Arreglo:** `apps/web/src/componentes/formularios/entrada-fecha.tsx`: quitar el ícono o hacerlo opcional con una propiedad; si el ícono es una decisión de accesibilidad, proponer un CH.
- **Cómo verificar:** el campo Fecha de Registrar gasto no muestra ícono y sigue abriendo el calendario al tocarlo.
- **Sección:** REG · **Fuente:** verificación independiente

#### V-07 · Registrar gasto en computadora: «Guardar» más cerca de la suma que de la tarjeta de impacto — Registrar gasto · computadora-claro · baja
- **Se ve:** `capturas/registrar-gasto__principal__computadora-claro.png`: «Guardar $148.60» a 52 px bajo la suma.
- **Debería:** `S5-Registrar__computadora-claro.png`: el botón bajo la tarjeta de impacto, a 18 px de ella. Depende de REG-10 (el impacto en vivo todavía no existe).
- **Arreglo:** `apps/web/src/flujos/registrar-gasto/formulario.tsx`: ordenar suma, tarjeta de impacto y botón con ese espaciado cuando se construya el impacto de REG-10.
- **Cómo verificar:** a 1440 px el botón queda a 18 px de la tarjeta de impacto.
- **Sección:** REG · **Fuente:** verificación independiente

## ACT · Actividad y detalle de transacción

#### ACT-01 · «Registrar» duplicado en el contenido de Actividad — Actividad · todas · alta
- **Se ve:** debajo de la barra superior aparece un botón tonal «Registrar» (16 px/600) que la referencia no tiene (`capturas/pliegue/actividad__lista__telefono-claro.png`, x=20, y≈76). En computadora hay otro «Registrar» tonal en la fila del título, además del azul de la barra lateral (`actividad__filtros-abiertos__computadora-claro.png`).
- **Debería:** un solo «Registrar»: en teléfono el azul con «+ Registrar» de la barra superior; en computadora el de la barra lateral (`02-referencias/entrega-2/pantallas/02-actividad/lista__telefono-claro.png`, `filtros__computadora-claro.png`; PANTALLAS §3.1).
- **Arreglo:** quitar el `EnlaceFinn href="/registrar"` de `apps/web/src/app/(finn)/actividad/pantalla.tsx:75` y la clave `t.registrar` de `textos/actividad.ts`.
- **Cómo verificar:** `/actividad` tiene un único enlace a `/registrar` visible por viewport.

#### ACT-02 · Buscador y «Filtros» apilados, no en una fila — Actividad · teléfono y computadora · alta
- **Se ve:** en teléfono el buscador ocupa todo el ancho y «Filtros» es una pastilla tonal a todo el ancho debajo (16 px/600, x=20). En computadora «Filtros» es una pastilla sobre la columna y el buscador va a la derecha sin botón (`pliegue/actividad__lista__telefono-claro.png`).
- **Debería:** buscador a la izquierda y botón «Filtros» (14 px/700, con el contador «Filtros · 3» en fondo `--texto` cuando hay filtros) a la derecha, en la misma fila; en computadora el botón queda junto al buscador y la columna de filtros es un panel con título «Filtros» (`lista__telefono-claro.png`, `filtrado__computadora-claro.png`).
- **Arreglo:** reestructurar la cabecera de `actividad/pantalla.tsx` (buscador + botón en `flex` de una fila) y el estilo `RESUMEN` de `actividad/filtros.tsx`; usar el rol `etiqueta` (14/700) en vez de 16/600.
- **Cómo verificar:** a 390 px buscador y botón comparten fila; el análisis ya no marca «Filtros» con tamaño 16≠14 ni x 20≠268.

#### ACT-03 · El estado «Pendiente» y «Por cobrar» usan 14 px en vez de 13 — Actividad · todas · baja
- **Se ve:** «Pendiente» y «Por cobrar» miden 14 px/20.3 de interlineado (`analisis/actividad__lista.md`).
- **Debería:** `cuerpo-pequeno` 13 px/18.9 (`lista__telefono-claro.html`).
- **Arreglo:** `apps/web/src/componentes/dominio/fila-transaccion.tsx`: usar la clase de rol con 13 px para las marcas de la fila.
- **Cómo verificar:** el análisis no muestra diferencias de tamaño en esas dos marcas.

#### ACT-04 · Búsqueda sin encabezado de resultados — Actividad · todas · media
- **Se ve:** al buscar «super» la lista se filtra pero no dice cuántos resultados hay ni ofrece «Quitar filtros» arriba de la lista (`capturas/actividad__buscando__telefono-claro.png`); «Quitar filtros» solo existe en el vacío y mide 86×18 (`analisis/actividad__buscando.md`: tocable < 44).
- **Debería:** línea «2 resultados para “pampa”» a la izquierda y «Quitar filtros» a la derecha, ambos tocables (`02-actividad/buscando__telefono-claro.png`).
- **Arreglo:** agregar la línea de resumen en `actividad/pantalla.tsx` (texto en `textos/actividad.ts`) con el enlace en una caja de 44 px de alto.
- **Cómo verificar:** con `?texto=` aparece la línea; el enlace mide ≥ 44 × 44.

#### ACT-05 · Los filtros no son una hoja inferior sino un panel que se expande en la página — Actividad · teléfono · alta
- **Se ve:** un `<details>` («Filtros») despliega en la propia página una tarjeta con seis campos apilados que empuja la lista hacia abajo; no hay velo, agarradera, título «Filtros» ni cerrar (`capturas/pliegue/actividad__filtros-abiertos__telefono-claro.png`, `actividad__filtrado__telefono-claro.png`: con filtros activos el panel queda abierto y tapa los resultados).
- **Debería:** hoja inferior (`--superficie-elevada`, `--radio-superpuesto`, `--elevacion-3`, agarradera, título «Filtros» y cerrar de 44, velo detrás), con «Quitar filtros» (tonal) y «Ver N resultados» (primario) en el pie (`02-actividad/filtros__telefono-claro.png`; PANTALLAS §2.17).
- **Arreglo:** reemplazar el `<details>` de `actividad/filtros.tsx:75` por la hoja del marco (`componentes/marco`) en teléfono; mantener la columna fija en computadora. El botón del pie pasa de «Filtrar» a «Ver N resultados».
- **Cómo verificar:** en 390 px, tocar «Filtros» abre un `role="dialog"` con velo; al aplicar se cierra y la lista queda a la vista.

#### ACT-06 · Tipo, Estado y Origen son listas desplegables, no selectores segmentados — Actividad · todas · alta
- **Se ve:** «Tipo», «Estado» y «Origen» son `select` de 52 px con «Todos» y chevron; «Cuenta» y «Categoría» sin ícono de la cuenta; fechas como «dd/mm/yyyy» nativo y «Opcional» como rótulo; montos sin símbolo `$` ni «0.00» (`actividad__filtros-abiertos__telefono-claro.png`).
- **Debería:** Tipo (Todos · Gasto · Ingreso · Movimiento), Estado bancario (Todos · Pendiente · Confirmada · Conciliada) y Origen (Todos · SMS · Manual · Programada) como control segmentado; Cuenta con el ícono de su tipo; fechas con la `EntradaFecha` dd/mm/aaaa con calendario; montos con «$ 0.00» (`filtros__telefono-claro.png`, `filtros__computadora-claro.png`; P1-03 en INDICE-entrega-2).
- **Arreglo:** `actividad/filtros.tsx`: `SelectorSegmentado` de `componentes/base` para los tres, `EntradaFecha` para Desde/Hasta y campo de monto con prefijo. El rótulo «Estado» pasa a «Estado bancario».
- **Cómo verificar:** los tres grupos son `radiogroup` con 4 opciones; las fechas se escriben con barras automáticas.

#### ACT-07 · Columna de filtros de 260 px, la referencia mide 320 — Actividad · computadora · baja
- **Se ve:** la columna mide 260 px (x 296–556) y la lista 752 px (`pliegue/actividad__filtros-abiertos__computadora-claro.png`), con el campo «Monto desde/hasta» partido en dos líneas y vacío.
- **Debería:** panel de 320 px con título «FILTROS» (`.t-titulo-seccion`) y campos de dos columnas legibles; la lista de ≈ 744 px (`filtros__computadora-claro.png`). La E2E del repo (PRU-E2E-TX-421) fija 260 px: si 260 es la decisión, la referencia debe corregirse; DECISIONES no fija el ancho.
- **Arreglo:** ancho de `[data-columna-filtros]` en `actividad/pantalla.tsx` (o corregir la referencia) y rótulos de monto en una línea.
- **Cómo verificar:** columna 320 px y rótulos «Monto desde» / «Monto hasta» en una línea.

#### ACT-08 · Con filtros activos faltan las fichas con su ×, el conteo y el total — Actividad · todas · alta
- **Se ve:** con `?tipo=gasto&desde=…` la pantalla muestra el panel abierto y las fichas «Gasto» y «22/09 – 21/10» sin ícono de cuenta ni ×; no hay «5 transacciones · −$229.09» ni «Quitar filtros» (textos de `medidas/actividad__filtrado__telefono-claro.json`).
- **Debería:** fichas tonales con × («Visa Oro ×», «Gasto ×», «21/09 – 15/10 ×») bajo el buscador; debajo, «5 transacciones · −$229.09» a la izquierda y «Quitar filtros» a la derecha (`02-actividad/filtrado__telefono-claro.png`).
- **Arreglo:** `actividad/chips.tsx` (ficha con × de 44 px de área) y una fila de resumen en `actividad/pantalla.tsx`; el total lo entrega el DTO (PF-3), no la interfaz.
- **Cómo verificar:** con 3 filtros hay 3 fichas con × y la línea de resumen; el panel no queda abierto.

#### ACT-09 · Vacío de Actividad sin acción y con el panel de filtros — Actividad · todas · media
- **Se ve:** «Todavía no hay transacciones» con el texto «Cuando registres un gasto, un ingreso o una transferencia…», sin botón, y con el buscador y los filtros encima (`capturas/actividad__vacio__telefono-claro.png`).
- **Debería:** buscador y «Filtros» visibles sin panel, círculo con glifo, el texto «Lo que registres o apruebes en la Bandeja va a aparecer aquí, agrupado por día.» y el botón «Registrar gasto» (`02-actividad/vacio__telefono-claro.png`; PANTALLAS §2.19).
- **Arreglo:** el vacío de `actividad/pantalla.tsx` y `textos/actividad.ts` (`vacioTexto`, botón «Registrar gasto»).
- **Cómo verificar:** el vacío trae círculo de 72 px, el texto y el botón.

#### ACT-10 · Sin resultados: texto distinto y «Quitar filtros» de 18 px de alto — Actividad · todas · baja
- **Se ve:** «Probá con otros filtros o quitalos para ver todo.» y el enlace «Quitar filtros» de 86×18 (`analisis/actividad__sin-resultados.md`, tocable < 44).
- **Debería:** «Probá con otra palabra o quitá algún filtro.» y un botón «Quitar filtros» de 44 px (`02-actividad/sin-resultados__telefono-claro.png`).
- **Arreglo:** `textos/actividad.ts` y el enlace de `actividad/pantalla.tsx` con `min-h-11` y variante tonal.
- **Cómo verificar:** el análisis no marca tocables < 44 en `actividad__sin-resultados`.

#### ACT-11 · Eliminar una transacción vuelve a Actividad sin el resultado en el lugar — Actividad · todas · alta
- **Consolidado en:** GLO-27 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** tras eliminar, la lista aparece sin aviso (`capturas/actividad__eliminada__telefono-claro.png`: primer texto del cuerpo «Actividad / Registrar / Filtros …»).
- **Debería:** aviso arriba de la lista «Eliminaste PRICESMART · $148.60. Los Disponibles y la deuda de Visa Oro se recalcularon.» con `role="status"` (`03-detalle-de-transaccion/eliminada__telefono-claro.png`; DECISIONES «resultado en el lugar»).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` (redirigir con el resultado) y `actividad/pantalla.tsx` (`AvisoEnLinea` con `role="status"`).
- **Cómo verificar:** después de eliminar, la lista muestra el aviso con el nombre y el monto.

#### ACT-12 · Los cambios de estado, devolución y eliminar evento vuelven al detalle sin aviso — Detalle · todas · media
- **Consolidado en:** GLO-27 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/transaccion__confirmada-tras-cambiar-estado__telefono-claro.png`, `transaccion__devolucion-registrada…`, `transaccion__evento-eliminado…`: el detalle se actualiza en silencio, sin confirmación visible ni anunciada.
- **Debería:** resultados en el lugar con el aviso de lo hecho (DECISIONES «resultados en el lugar»; PANTALLAS §11, «Guardar … el resultado aparece con `--curva-enfasis`»).
- **Arreglo:** `AvisoEnLinea` con `role="status"` en `actividad/[transaccionId]/pantalla.tsx`, alimentado por un parámetro `?hecho=` o el resultado de la acción.
- **Cómo verificar:** después de cada acción hay un `role="status"` con el texto.

#### ACT-13 · «Registrar» sin etiqueta en la barra superior del teléfono — Actividad · teléfono · media (candidato a global)
- **Consolidado en:** GLO-22 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** el botón de la barra es un «+» de 44 px sin texto (`pliegue/actividad__lista__telefono-claro.png`, x 242–286).
- **Debería:** «+ Registrar» azul con etiqueta de 14/700 (PANTALLAS §3.1: padding 0 14 0 10; `lista__telefono-claro.png`).
- **Arreglo:** componente de barra superior en `componentes/marco`: mostrar la etiqueta a 390 px; si no cabe con la hamburguesa, definirlo en DECISIONES.
- **Cómo verificar:** el botón mide ≈ 110 × 44 y su texto es visible.

#### ACT-14 · Falta «Programada» y el tratamiento del comercio en la fila — Actividad · todas · baja
- **Se ve:** las filas no traen la marca «Programada» en una compra programada, ni «Con devoluciones» en la compra que tiene devolución (`medidas/actividad__lista__telefono-claro.json` y el texto de `transaccion__con-devolucion`): la fila de la compra con devolución dice «Pendiente».
- **Debería:** insignia «Con devoluciones» y «Programada» con su glifo (`lista__telefono-claro.png`, filas LA PAMPA y NETFLIX.COM).
- **Arreglo:** `componentes/dominio/fila-transaccion.tsx`.
- **Cómo verificar:** la fila de una compra con devolución muestra «Con devoluciones» con el glifo `undo`.

#### ACT-15 · Estado de carga de Actividad: sin texto «Buscando…» — Actividad · todas · baja
- **Se ve:** esqueleto de cuatro filas con un `sr-only` «Cargando» (`actividad/loading.tsx`).
- **Debería:** la referencia lleva el rótulo «Buscando…» visible (`02-actividad/cargando__telefono-claro.html`). Comparación visual no hecha en detalle.
- **Arreglo:** revisar `actividad/loading.tsx` contra `cargando__*`.
- **Cómo verificar:** coincide con la referencia en las tres variantes.

#### ACT-16 · Partes sin signo y sin la raya rayada de «no cubierto» — Detalle · todas · alta
- **Se ve:** las partes muestran «$45.00» / «$15.00» sin signo y la porción no cubierta es un tramo de color suave liso con el texto anaranjado (`capturas/transaccion__dividida__telefono-claro.png`).
- **Debería:** montos de gasto con U+2212 («−$96.10») y la porción no cubierta con trazo rayado (`--problema-borde`), de modo que el estado no dependa del color: tres señales (`03/principal__telefono-claro.png`; DECISIONES «tres señales»; PANTALLAS §2.18).
- **Arreglo:** `Parte` en `actividad/[transaccionId]/pantalla.tsx` (`Monto` con signo) y la barra de cobertura (patrón rayado en `bg-[repeating-linear-gradient]` vía un token de `tokens.css`).
- **Cómo verificar:** el segmento «no cubierto» tiene rayado visible en escala de grises; los montos usan «−».

#### ACT-17 · «Pendiente» lleva el glifo de «Confirmada» — Detalle · todas · media (candidato a global)
- **Se ve:** la pastilla «Pendiente» usa el ícono `check` (círculo con visto) (`capturas/pliegue/transaccion__mas-acciones__telefono-claro.png`, `transaccion__dividida…`); en Actividad el mismo estado usa el reloj.
- **Debería:** glifo por estado: reloj para pendiente, visto para confirmada, doble visto para conciliada (`03/principal__telefono-claro.png`, `02-actividad/lista__telefono-claro.png`).
- **Arreglo:** el `<Icono nombre="check">` fijo de `actividad/[transaccionId]/pantalla.tsx` (header) por un mapa de estado → glifo, el mismo de la fila.
- **Cómo verificar:** las tres pastillas llevan glifos distintos.

#### ACT-18 · Falta «Efectos hoy» y sobra «Cuentas» — Detalle · todas · alta
- **Se ve:** tras «Partes» hay una sección «Cuentas» con «Cuenta corriente −$60.00» (`transaccion__dividida__telefono-claro.png`). No hay «Efectos hoy».
- **Debería:** «Efectos hoy» con una fila por efecto («Supermercado · Disponible $62.85», «Farmacia · Disponible −$5.15», «Carlos te debe $20.00», «Visa Oro · deuda $642.18») (`03/principal__telefono-claro.png`; INDICE «Datos, partes…, efectos, eventos…»).
- **Arreglo:** reemplazar la sección `Cuentas` de `pantalla.tsx` (líneas ≈ 280-290) por «Efectos hoy» con los efectos del DTO; si el DTO no los trae, es una contradicción para el Project (`dto.efectos` hoy solo trae cuenta y monto).
- **Cómo verificar:** aparece «Efectos hoy» con los Disponibles y la deuda.

#### ACT-19 · Encabezado del detalle: fecha, estado y «Editar» — Detalle · todas · media
- **Se ve:** «Cuenta corriente · 14 oct 2026» (sin día de la semana), pastilla «Desde Manual» con el ícono de SMS, y un enlace «Editar» suelto bajo las pastillas.
- **Debería:** «Visa Oro · jueves 15/10/2026»; la pastilla de origen con el glifo del origen («Desde SMS» con `sms`, «Manual» con `edit`) y sin «Desde» para manual; «Editar» dentro de «Más acciones» (`03/principal__telefono-claro.png`, `mas-acciones__telefono-claro.png`: el primer ítem del menú es «Editar», no hay enlace suelto).
- **Arreglo:** `actividad/[transaccionId]/pantalla.tsx` (header: `formatearFecha…` con día de la semana; mapa origen → ícono y texto; quitar `EnlaceFinn editar` de la línea 256 y ponerlo como acción del menú).
- **Cómo verificar:** el menú «Más acciones» abre con «Editar» y el encabezado no tiene el enlace.

#### ACT-20 · Faltan las secciones «Conciliación» (sin conciliar) y el aviso del origen — Detalle · todas · media
- **Se ve:** una transacción no conciliada no trae ningún bloque de conciliación (`transaccion__principal__telefono-claro.png`).
- **Debería:** «Conciliación» con «Sin conciliar. Se marca al conciliar el estado de cuenta o al verificar el saldo de Visa Oro.» (`03/principal__telefono-claro.png`).
- **Arreglo:** en `pantalla.tsx` mostrar el `AvisoEnLinea` también cuando `dto.conciliacion === undefined`, con título «Conciliación» y el texto nuevo en `textos/transaccion.ts`.
- **Cómo verificar:** una transacción sin conciliar muestra el bloque.

#### ACT-21 · La parte por cobrar no trae «Cobrar» ni «Condonar» — Detalle · todas · alta
- **Se ve:** «Por cobrar a Carlos $40.00 · Cobrado $0.00 · por cobrar $40.00» sin acciones (`transaccion__por-cobrar__telefono-claro.png`); el nombre es «Por cobrar a Ana» y no «Ana (por cobrar)».
- **Debería:** «Carlos (por cobrar)» con los enlaces «Cobrar» y «Condonar» dentro de la parte (`03/principal__telefono-claro.png`).
- **Arreglo:** `Parte` en `pantalla.tsx` con los enlaces a `por-cobrar/cobrar` y `por-cobrar/condonar`; el rótulo sale de `t.deudorPorCobrar` (ya existe en `textos/transaccion.ts`).
- **Cómo verificar:** la parte abierta muestra «Cobrar» y «Condonar» tocables de 44 px.

#### ACT-22 · Eventos como lista plana con «Eliminar», no como filas con ícono, título y monto con signo — Detalle · todas · media
- **Se ve:** «Cobrado | 14 oct 2026 | $10.00 | Eliminar» (`transaccion__por-cobrar-con-cobro__telefono-claro.png`, `transaccion__con-devolucion…`).
- **Debería:** fila con círculo-ícono, «Cobro de Carlos» / «Devolución parcial», «16/10 · a Cuenta corriente» y el monto en verde con «+» («+$10.00»); la eliminación pasa a «Más acciones» o al evento (`03/principal__telefono-claro.png`, `eliminar-bloqueado__telefono-claro.png`: «Eliminar evento» en rojo).
- **Arreglo:** componente `Eventos` en `pantalla.tsx` (línea ≈ 152 el enlace `eventos/eliminar`).
- **Cómo verificar:** los montos de eventos llevan signo y color positivo.

#### ACT-23 · Conciliada: el menú no restringe con motivo visible — Detalle · todas · media
- **Se ve:** `transaccion__conciliada__telefono-claro.png` muestra el aviso «Conciliada con el estado de cuenta del 15 oct 2026»; «Editar» no se restringe.
- **Debería:** «Está conciliada: solo podés cambiar categoría, comercio y nota.», «Registrar devolución» con «Quedan $… por devolver», «Marcar como pendiente» deshabilitado con «Una transacción conciliada no cambia de estado.» (`03/conciliada__telefono-claro.png`).
- **Arreglo:** `acciones` en `pantalla.tsx:205-216` (cada acción con `detalle`/`motivo`); `mas-acciones.tsx` ya admite `motivo`.
- **Cómo verificar:** con una conciliada, el menú muestra los tres motivos.

#### ACT-24 · «Más acciones» sin íconos, sin texto secundario y con un título extra — Detalle · todas · media
- **Se ve:** menú con el rótulo «SIN COMERCIO» arriba, ítems solo de texto y «Eliminar» en rojo; sin «Editar» (`pliegue/transaccion__mas-acciones__telefono-claro.png`).
- **Debería:** sin rótulo, con ícono de 20 px a la izquierda (`edit`, `undo`, `clock`, `trash`), una línea secundaria cuando aplica («Quedan $143.60 por devolver», «Hoy está confirmada») y Eliminar al final separado (`03/mas-acciones__telefono-claro.png`; P1-04).
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y la lista `acciones` del detalle (icono y `detalle`).
- **Cómo verificar:** el menú coincide con `mas-acciones__*` en las tres variantes.

#### ACT-25 · [corregido por V-01: la captura salió sin campos; ver V-01] Edición: no se capturó una diferencia estructural; se anota el acceso — Editar · todas · baja
- **Se ve:** la edición abre como flujo largo con «Cerrar» (X), campos y «Guardar cambios» fijo (`pliegue/transaccion-editar__principal__telefono-claro.png`), tal como la referencia; falta el bloque «Antes de guardar» con el efecto previo («Farmacia · Disponible −$5.15 → $0.85»).
- **Debería:** `03/editar__telefono-claro.png` incluye «Antes de guardar» con los efectos antes del botón.
- **Arreglo:** `flujos/actividad-editar/formulario.tsx`: mostrar el efecto estimado (DTO) antes de «Guardar cambios».
- **Cómo verificar:** al cambiar un monto aparece el bloque con el antes → después.

#### ACT-26 · «Revisá el impacto» muestra un código crudo — Editar y eliminar · todas · alta
- **Consolidado en:** GLO-28 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** un aviso amarillo que dice «AV-07» y, en eliminar evento, «AV-03», sin texto (`pliegue/transaccion-eliminar__revisar__telefono-claro.png`; textos de `medidas/transaccion-eliminar-evento__revisar__telefono-claro.json`); las frases de impacto parten «−» del número («cambia –⏎$76.45»).
- **Debería:** el texto del aviso en voseo y una tabla «Concepto → antes → después» con el menos U+2212 pegado al monto (`03/eliminar__telefono-claro.png`, `eliminar-evento__telefono-claro.png`).
- **Arreglo:** mapa de avisos en `textos/transaccion.ts` (`avisosEliminar` solo trae AV-01 y AV-16: faltan AV-03 y AV-07; también en `avisos`); `componentes/formularios/confirmacion-impacto.tsx` (filas con `white-space: nowrap` en el monto).
- **Cómo verificar:** ningún aviso muestra un código; el signo no queda solo al final de línea.

#### ACT-27 · Conflicto al guardar: aviso dentro del campo y sin la estructura de la referencia — Editar · todas · media
- **Se ve:** `capturas/transaccion-editar__conflicto__telefono-claro.png`: el texto «Cambió mientras la editabas / Este valor cambió mientras lo editabas. Recargá para ver el valor actual.» y el botón «Usar el valor actual» bajo el campo Nota.
- **Debería:** el mismo patrón, ubicado junto al campo en conflicto, con `role="alert"` (`03/editar-conflicto__telefono-claro.png`). No se comparó con más detalle.
- **Arreglo:** verificar el `role` y el lugar del aviso en `formulario.tsx`.
- **Cómo verificar:** el aviso tiene `role="alert"` y el foco pasa al campo.

#### ACT-28 · Editar con la cuenta archivada: el formulario queda vacío y «Guardar» sigue activo — Editar · todas · crítica
- **Se ve:** solo el aviso «Cuenta vieja está archivada. Desarchivala para registrar o cambiar movimientos.» y «Guardar cambios»; no aparece ningún campo (`pliegue/transaccion-editar__cuenta-archivada__telefono-claro.png`).
- **Debería:** el formulario completo con Cuenta, Fecha y Total en «Solo lectura» y editables solo la categoría de cada parte, el comercio y la nota; el aviso «…solo podés cambiar la categoría de cada parte, el comercio y la nota.» (`03/editar-cuenta-archivada__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-editar/lector.tsx` (rama `archivada`) y `formulario.tsx`: no ocultar los campos; marcar los bloqueados.
- **Cómo verificar:** con una cuenta archivada se ven los campos y los tres bloqueados dicen «Solo lectura».

#### ACT-29 · Devolver: el campo de la parte sin rótulo «Monto» y «Devolver a» en vez de «Vuelve a» — Devolver · todas · baja
- **Se ve:** `capturas/pliegue/transaccion-devolver__principal__telefono-claro.png`: el campo por parte no tiene rótulo; la cuenta se llama «Devolver a».
- **Debería:** rótulo «Monto» sobre cada campo de parte y «Vuelve a» (`03/devolver-excede__telefono-claro.png`); nota: `devolver__telefono-claro.png` mantiene «Devolver a». Verificar con el Project cuál rige.
- **Arreglo:** `flujos/actividad-devolver/formulario.tsx` y `textos/transaccion.ts` (`devolverA`).
- **Cómo verificar:** el campo de cada parte tiene etiqueta visible igual al nombre accesible `Monto de …`.

#### ACT-30 · Devolver más de lo que queda: el error no va en la parte y el botón sigue activo — Devolver · todas · alta
- **Se ve:** el aviso «Las devoluciones superarían el total de la compra ($30.00).» queda al final del formulario, el campo no cambia de borde y «Registrar devolución $99.00» sigue activo (`pliegue/transaccion-devolver__excede__telefono-claro.png`).
- **Debería:** el campo de la parte con borde `--problema-borde`, el aviso «En esa parte quedan $22.50 por devolver.» dentro de la tarjeta, justo debajo de esa parte, y el botón deshabilitado con «Corregí el monto de Farmacia.» debajo (`03/devolver-excede__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-devolver/formulario.tsx` (error por parte; `t.corregiMonto` ya existe en `textos/transaccion.ts` y no se usa en este caso).
- **Cómo verificar:** con un monto mayor, el campo queda en borde de problema, el aviso va bajo la parte y el CTA está deshabilitado.

#### ACT-31 · Sin nada por devolver: enlace subrayado donde va un botón — Devolver · todas · media
- **Se ve:** `actividad-devolver/sin-capacidad.tsx` dibuja «Volver a la transacción» como enlace subrayado (`font-bold text-enlace underline`).
- **Debería:** botón tonal ancho completo (`03/devolver-sin-capacidad__telefono-claro.png`; enlace subrayado donde va botón tonal es error).
- **Arreglo:** usar `BotonTonal`/`EnlaceBoton` de `componentes/base` en `sin-capacidad.tsx`.
- **Cómo verificar:** el control mide 44 px de alto con fondo `--accion-tonal`.

#### ACT-32 · Estado, eliminar y eliminar evento son pantallas completas, la referencia usa hoja inferior — Flujos cortos · todas · alta
- **Consolidado en:** GLO-23 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/pliegue/transaccion-eliminar__principal__telefono-claro.png` y `transaccion-eliminar__bloqueado…`: página completa con barra «Cerrar», título «Eliminar transacción», un botón azul «Ver qué cambia» y recién en un segundo paso el impacto; el detalle desaparece detrás.
- **Debería:** hoja inferior sobre el detalle (`--superficie-elevada`, agarradera, título «¿Eliminar PRICESMART?», subtítulo con monto/fecha/cuenta, impacto directo en una tabla y «Cancelar» / «Eliminar» en peligro) (`03/eliminar__telefono-claro.png`, `eliminar-bloqueado__…`, `eliminar-evento__…`, `cambiar-estado__…`; INDICE-entrega-2 «estado, eliminar y eliminar evento son flujos cortos»).
- **Arreglo:** `flujos/actividad-estado`, `actividad-eliminar`, `actividad-eventos-eliminar`: renderizar con la hoja del marco en vez de página, con el impacto ya calculado (una sola vista); el router puede mantener la URL como ruta interceptada.
- **Cómo verificar:** al elegir «Eliminar» en el menú, el detalle sigue visible detrás de un velo y no hay un paso «Ver qué cambia».

#### ACT-33 · El botón de confirmar eliminar es azul de acción, no de peligro — Eliminar · todas · alta
- **Consolidado en:** GLO-31 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** «Eliminar» es azul (`pliegue/transaccion-eliminar__revisar__telefono-claro.png`).
- **Debería:** botón peligro `--peligro` (rojo) junto a «Cancelar» tonal (`03/eliminar__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` y `actividad-eventos-eliminar`: variante `peligro` del botón.
- **Cómo verificar:** fondo `--peligro` y texto `--texto-sobre-peligro`.

#### ACT-34 · El impacto se muestra como frases y no como «antes → después» — Eliminar · todas · media
- **Se ve:** «Disponible de Supermercado cambia +$88.60.» (`transaccion-eliminar__revisar__telefono-claro.png`).
- **Debería:** filas «Supermercado · Disponible $62.85 → $158.95», «Visa Oro · deuda $642.18 → $493.58» (`03/eliminar__telefono-claro.png`, `eliminar-evento__telefono-claro.png`).
- **Arreglo:** `componentes/formularios/confirmacion-impacto.tsx` con filas rótulo/antes/después (el DTO debe traer ambos valores; si solo trae el delta, contradicción para el Project).
- **Cómo verificar:** cada fila trae dos montos con flecha.

#### ACT-35 · Eliminar bloqueado: no ofrece «Eliminar evento» ni «Entendido» — Eliminar · todas · alta
- **Se ve:** aviso de problema, una sola línea «Cobrado · 14 oct 2026 $10.00» y el enlace subrayado «Ver transacción» (`pliegue/transaccion-eliminar__bloqueado__telefono-claro.png`).
- **Debería:** lista de eventos («Cobro de Carlos 16/10 · $10.00» con «Eliminar evento» en rojo a la derecha) y botón tonal «Entendido» (`03/eliminar-bloqueado__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` (rama bloqueada) con las filas de evento y el botón.
- **Cómo verificar:** cada evento trae su acción y el único pie es «Entendido».

#### ACT-36 · Eliminar evento: título genérico y sin impacto visible en el primer paso — Eliminar evento · todas · media
- **Se ve:** «Eliminar evento» y la pregunta «¿Eliminar esta devolución?» más un botón de dos pasos (textos del flujo en `textos/transaccion.ts`).
- **Debería:** «¿Eliminar el cobro de Carlos?», «$10.00 · 16/10 · Cuenta corriente» y «Carlos vuelve a deberte $30.00 y Cuenta corriente baja $10.00.» con la tabla de impacto y «Eliminar cobro» (`03/eliminar-evento__telefono-claro.png`).
- **Arreglo:** `textos/transaccion.ts` (`eliminarEventoPregunta` con nombre y rótulo del botón por tipo) y el flujo.
- **Cómo verificar:** el botón dice «Eliminar cobro» / «Eliminar devolución» según el evento.

#### ACT-37 · Cambiar estado: opciones sin nombre accesible — Estado · todas · media
- **Se ve:** dos botones sin nombre accesible en (32,140) y (32,188) (`analisis/transaccion-estado__principal.md`).
- **Debería:** opciones de radio con su rótulo y descripción («Pendiente / El banco todavía no la confirmó.») como `radio` con nombre (`03/cambiar-estado__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-estado/formulario.tsx`: `radiogroup` con `aria-labelledby`.
- **Cómo verificar:** el análisis no lista tocables sin nombre.

#### V-01 · Editar transacción se ve vacío mientras carga sus campos, con «Guardar cambios» activo — Editar transacción · todas · media
- **Se ve:** comprobado en vivo (`tools/auditoria/casos/93-editar-tx.cap.ts`, resultado `verificacion/editar-tx.json`): al entrar por el enlace «Editar», a 0 ms hay 0 campos y a 1 s aparecen los 7; por URL directa, el documento llega con 0 campos y aparecen ~3 s después. Mientras tanto solo se ven el título y «Guardar cambios» azul y activo (`capturas/transaccion-editar__principal__telefono-claro.png` de la primera pasada; la recaptura con 3 s de margen, `capturas/pliegue/transaccion-editar__principal__telefono-claro.png`, ya muestra el formulario). Los campos son un `lazy(() => import('./edicion'))` con `<Suspense fallback={null}>` (`apps/web/src/flujos/actividad-editar/formulario.tsx:68` y `:170`), y el HTML del servidor no los trae aunque el comentario de la línea 67 dice que sí. Con la cuenta archivada el formulario no aparece nunca: eso es ACT-28 (confirmado con la misma espera).
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/03-detalle-de-transaccion/editar__telefono-claro.png` para el formulario; para la espera, el estado de carga de un campo (`docs/diseno/02-referencias/entrega-2/componentes/P1-02-cargando-y-error-en-campos-selecciones-y__claro.png`: el control conserva su etiqueta y su lugar con «Cargando…»); PANTALLAS §2.1: un botón sin acción posible va deshabilitado con su motivo.
- **Arreglo:** que el HTML del servidor traiga los campos (renderizar `Edicion` en el servidor o sin `lazy`) o que el `fallback` del `Suspense` de `formulario.tsx` sea el esqueleto de los campos; «Guardar cambios» deshabilitado hasta que los campos estén y haya un cambio.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/93-editar-tx --project=telefono-claro`: `porUrl.carga` y `porEnlace.0ms` mayores que 0, o un esqueleto visible en la captura `verificacion/editar-tx__url.png`; «Guardar cambios» deshabilitado sin cambios.
- **Sección:** ACT · **Fuente:** verificación independiente (confirmado y recalificado en vivo; además corrige ACT-25, que daba la pantalla por igual a la referencia mirando una captura sin campos)

## REP · Reportes

#### REP-01 · Reportes no marca Presupuesto en la barra inferior — Reportes · teléfono · alta (candidato a global)
- **Se ve:** ninguna pestaña activa en las 15 capturas de teléfono (`capturas/pliegue/reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** «Presupuesto» activa (`04-reportes/tendencia__telefono-claro.png`; INDICE-entrega-2 «Reportes en teléfono marca Presupuesto»; ídem `D2/una__…`).
- **Arreglo:** `componentes/navegacion/secciones.ts` (mapa de ruta → pestaña): `/reportes` y `/reportes/*` → `presupuesto`.
- **Cómo verificar:** `aria-current="page"` en Presupuesto en cualquier `/reportes/...`.

#### REP-02 · Falta la cifra grande con su subtítulo — Reportes · todas · alta
- **Se ve:** tras las pastillas viene el título de sección «TENDENCIA DE INGRESOS Y GASTOS» / «EN QUÉ SE VA TU DINERO» y el gráfico sin cifra (`reporte-tendencia__principal__telefono-claro.png`, `reporte-categorias__principal__telefono-claro.png`).
- **Debería:** cifra grande (`$635.60`, `.t-cifra-principal`) con «gastado en el período actual · promedio de 3: $675.88» y sin título de sección (`04/tendencia__telefono-claro.png`, `categorias__…`; PANTALLAS §2.18).
- **Arreglo:** `[tipo]/pantalla.tsx` y `vista-grafico.tsx` (`cifra`/`nota` ya existen como props); quitar el `h2` de la plantilla.
- **Cómo verificar:** todos los reportes de la plantilla traen la cifra y el subtítulo.

#### REP-03 · «Ver Gráfico / Tabla» está dentro del contenedor y sin rótulo «VER» — Reportes · teléfono · media
- **Se ve:** el selector va dentro de la tarjeta, arriba a la derecha (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** una fila «VER» (`.t-rotulo`) con el selector a la derecha, sobre la tarjeta (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `componentes/graficos/vista-grafico.tsx` (`data-grafico-encabezado`).
- **Cómo verificar:** el selector queda fuera de la tarjeta, con rótulo.

#### REP-04 · Selector de ventana: rótulos largos en dos líneas — Reportes · teléfono · media
- **Se ve:** «Período actual / Último período / 3 períodos / 6 períodos / 12 períodos» en dos líneas cada uno, con la opción activa de 2 líneas (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** «Actual · 1 · 3 · 6 · 12», una línea, alto de 44-48 (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `t.ventanas` en `textos/reportes.ts` y el selector en `[tipo]/pantalla.tsx` (etiqueta corta visible, larga en `aria-label`).
- **Cómo verificar:** el segmentado mide una sola línea.

#### REP-05 · Filtros que no están en la referencia: cuentas y grupo — Reportes · todas · media
- **Se ve:** una o dos filas extra de pastillas («Todos / Cuenta corriente / Cuenta de ahorro…», «Todos / Pagos de tarjeta / Gastos») bajo el selector de ventana (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** la referencia no las trae; el filtro de cuentas no tiene diseño (candidato a FALTANTES).
- **Arreglo:** definir en DECISIONES dónde viven (p. ej. una hoja «Filtros»); mientras tanto, `[tipo]/pantalla.tsx`.
- **Cómo verificar:** la pantalla coincide con `categorias__*` o la decisión nueva.

#### REP-06 · El gráfico de tendencia no trae eje de valores ni rejilla — Tendencia · todas · media
- **Se ve:** barras sobre una línea base y la etiqueta del valor sobre la barra, sin ejes (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** eje con $0 · $300 · $600 · $900 y rejilla suave `--grafico-rejilla` (`04/tendencia__telefono-claro.png`; el PNG manda sobre PANTALLAS §2.18, que dice «sin eje Y»).
- **Arreglo:** `componentes/graficos/grafico-barras.tsx`.
- **Cómo verificar:** aparecen las etiquetas del eje en 11 px `--texto-secundario`.

#### REP-07 · Falta el aviso «El período actual va por el día 25 de 30» — Tendencia · todas · baja
- **Se ve:** sin aviso bajo el gráfico.
- **Debería:** `AvisoEnLinea` de información (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `[tipo]/vistas.tsx` (tendencia).
- **Cómo verificar:** con el período actual en la ventana aparece el aviso.

#### REP-08 · Tendencia desaparece con una sola barra (ventana «actual») — Tendencia · todas · media
- **Se ve:** con la ventana por defecto el gráfico dibuja una sola barra y una línea punteada (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** la referencia trae 6 barras y la ventana «3» activa; el valor por defecto de la ventana de tendencia debería mostrar la serie (DECISIONES no fija el valor; la E2E 133 usa `ultimos-3`).
- **Arreglo:** `predeterminada(url)` de `[tipo]/pantalla.tsx` para `tendencia`.
- **Cómo verificar:** `/reportes/tendencia` sin parámetro muestra varios períodos.

#### REP-09 · Tendencia como tabla provoca desborde horizontal de la página — Reportes · teléfono · alta
- **Consolidado en:** GLO-30 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** la página mide 429 px en 390: la barra superior y la inferior se estiran a 429 y «Registrar»/campana quedan fuera de la pantalla (`analisis/reporte-tendencia__tabla.md`, `reporte-tarjetas__principal.md`, `reporte-cumplimiento__principal.md`; `capturas/pliegue/reporte-tarjetas__principal__telefono-claro.png`: la barra superior sin acciones, tabla cortada en «AP»).
- **Debería:** la tabla scrollea dentro de su contenedor (`overflow-x: auto`) y la página no desborda (PANTALLAS §2.18 «Tabla equivalente»).
- **Arreglo:** `componentes/graficos/tabla-equivalente.tsx`: envolver en un contenedor con `overflow-x-auto` y `min-w-0` en el padre `[data-reporte]`.
- **Cómo verificar:** `scrollWidth` del documento = 390 en tendencia (tabla), tarjetas y cumplimiento.

#### REP-10 · Porcentajes de la dona con dos decimales — Categorías · todas · baja
- **Se ve:** «44.32%», «22.58%» (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** enteros («41%», «21%») con `tabular-nums` (`04/categorias__telefono-claro.png`).
- **Arreglo:** `formatearPorcentaje` usado por `grafico-dona.tsx`.
- **Cómo verificar:** sin decimales.

#### REP-11 · Top de comercios: tocable de 40 px — Top comercios · teléfono · baja
- **Se ve:** «5» mide 40 × 44 (`analisis/reporte-top-comercios__principal.md`).
- **Debería:** ≥ 44 × 44.
- **Arreglo:** el selector de límite en `[tipo]/vistas-detalle.tsx`.
- **Cómo verificar:** el análisis no marca tocables < 44.

#### REP-12 · Hallazgos: tarjetas sin título ni acción como texto de tono, sin la introducción — Hallazgos · todas · media
- **Se ve:** cuatro avisos con el texto y un botón tonal azul dentro; sin título del hallazgo; encabezado «QUÉ AJUSTAR ESTE PERÍODO»; uno dice «(sin comercio) te cobra $104.75 cada mes» (`pliegue/reporte-hallazgos__principal__telefono-claro.png`).
- **Debería:** título en negrita por hallazgo («Ritmo alto en Restaurantes», «Pago de tarjeta próximo»), acción como enlace del color del tono («Reservar $18.75»), introducción «Hasta 5 hallazgos del período, cada uno con lo que podés hacer.» y sin encabezado de sección (`04/hallazgos__telefono-claro.png`).
- **Arreglo:** `[tipo]/hallazgos.tsx` y `AvisoEnLinea` (props `titulo` y `accion`); el texto sin comercio debe tener un caso propio en `textos/reportes.ts`.
- **Cómo verificar:** cada hallazgo tiene título y acción de tono.

#### REP-13 · Hallazgos vacío: aviso de texto sin ícono ni tono positivo — Hallazgos · todas · baja
- **Se ve:** «Todo en orden: no encontramos nada que ajustar este período.» (`medidas/reporte-hallazgos__vacio__telefono-claro.json`).
- **Debería:** la tarjeta positiva con visto de `04/hallazgos-vacio__telefono-claro.png`. No se comparó la imagen: revisar.
- **Arreglo:** `[tipo]/hallazgos.tsx`.
- **Cómo verificar:** coincide con `hallazgos-vacio__*`.

#### REP-14 · Sin movimientos: usa pastillas de cuentas y el título de sección — Reportes · todas · baja
- **Se ve:** estado vacío con el texto y «Ver 3 períodos» (`medidas/reportes__sin-movimientos__telefono-claro.json`).
- **Debería:** `04/sin-movimientos__telefono-claro.png`: gráfico sin datos en caja `--superficie-hundida` de 180 px con ícono `chart` (PANTALLAS §2.19). No se comparó la imagen.
- **Arreglo:** `[tipo]/pantalla.tsx` (estado vacío).
- **Cómo verificar:** caja hundida de 180 px con ícono.

#### REP-15 · Tablas de «Tarjetas» y «Cumplimiento» sin diseño y con desborde — Tarjetas, Cumplimiento · teléfono · media
- **Se ve:** tablas de 5-6 columnas cortadas (ver REP-09).
- **Debería:** sin diseño (FALTANTES `reportes-otros`); mínimo, la tabla equivalente de §2.18.
- **Arreglo:** igual que REP-09.
- **Cómo verificar:** sin desborde.

#### REP-16 · Gasto semanal: la barra superior es la de Reportes, no la de una pantalla hija — Gasto semanal · teléfono · alta
- **Se ve:** título «REPORTES», pastillas de tipo y encabezado «GASTO SEMANAL POR CATEGORÍA» (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** barra de hija: flecha «Volver a Reportes», título «GASTO SEMANAL» y campana, sin pastillas de tipo (PANTALLAS §10; `D2/una__telefono-claro.png`).
- **Arreglo:** `componentes/navegacion/secciones.ts` (`/reportes/gasto-semanal` como hija de `/reportes`) y `[tipo]/pantalla.tsx` (sin la fila de pastillas para este tipo).
- **Cómo verificar:** hay «Volver a Reportes» y no hay pastillas.

#### REP-17 · Selector de período sin flechas — Gasto semanal · todas · media
- **Se ve:** tarjeta «21/04 – 20/05/2027 · Actual · 25 días transcurridos · quedan 5» sin botones (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** botones circulares «‹» «›» de 44 px a los lados (`D2/una__telefono-claro.png`).
- **Arreglo:** `[tipo]/vistas-semanal.tsx`.
- **Cómo verificar:** los dos botones navegan entre períodos.

#### REP-18 · Selector de categorías sin muestra de color y con el activo en azul — Gasto semanal · todas · alta
- **Se ve:** pastilla activa «Supermercado» en `--accion` azul, sin muestra (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** pastilla activa con fondo `--texto` y una muestra de 10 px del color de su serie `grafico-serie-1…8`; con varias activas, cada una con su color (DECISIONES D2; `D2/una__…`, `D2/varias__…`).
- **Arreglo:** `[tipo]/vistas-semanal.tsx` (pastilla) y tokens `--grafico-serie-n` de `tokens.css`.
- **Cómo verificar:** la muestra de cada pastilla es el color de su serie en el gráfico.

#### REP-19 · Resumen: «Referencia a esta semana» en lugar de «Referencia hoy» — Gasto semanal · todas · baja
- **Se ve:** «REFERENCIA A ESTA SEMANA $326.67» (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** «REFERENCIA HOY $326.67» (PANTALLAS §10: «Referencia hoy $326.67»).
- **Arreglo:** `textos/reportes.ts`.
- **Cómo verificar:** el rótulo coincide.

#### REP-20 · Falta el selector «VER Gráficos | Tabla» general y se divide cada gráfico en su propia tarjeta — Gasto semanal · todas · alta
- **Se ve:** una sola tarjeta «POR SEMANA» con el selector adentro y las barras y la línea acumulada apiladas (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** «VER Gráficos | Tabla» sobre tres secciones con su título y tarjeta: «POR SEMANA», «ACUMULADO» y «CONTRA LOS 3 ANTERIORES» (`D2/una__telefono-claro.png`; PANTALLAS §10).
- **Arreglo:** `[tipo]/vistas-semanal.tsx` (tres `ContenedorGrafico`) y `vista-grafico.tsx`.
- **Cómo verificar:** hay tres tarjetas con título y un único selector «Ver».

#### REP-21 · Barras por semana: sin cifra de la semana, sin degradado, sin «faltan 2 días» y sin leyenda — Gasto semanal · todas · media
- **Se ve:** el valor sobre cada barra y «43 % de la referencia / Vas $39.52 por debajo» fuera de la tarjeta; barras planas; la semana futura como contorno punteado sin texto (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** cifra «$35.00 · esta semana · en curso» y «43% de la referencia» dentro de la tarjeta, barras con degradado `--grafico-tinta` 100 → 62 %, «faltan 2 días» y leyenda «Gasto · Semana en curso · Referencia $81.67» (`D2/una__telefono-claro.png`; PANTALLAS §2.18).
- **Arreglo:** `componentes/graficos/grafico-barras.tsx` y `leyenda-grafico.tsx`.
- **Cómo verificar:** la tarjeta coincide con la referencia.

#### REP-22 · Acumulado simplificado: sin área, referencia punteada, píldora ni distancia — Gasto semanal · todas · alta
- **Se ve:** una línea azul con puntos y dos etiquetas ($92.40 y $287.15), sin área, sin referencia, sin ejes ni leyenda (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** línea suavizada con área en degradado, referencia acumulada punteada, proyección, punto actual con halo, píldora con el monto, distancia a la referencia («−$39.52 de la referencia», `--positivo-texto`), «Asignado $350.00» y la cifra «$287.15 · gastado en 25 de 30 días · Vas $39.52 por debajo» con el indicador positivo (`D2/una__telefono-claro.png`; K5-Nuevos__grafico-acumulado).
- **Arreglo:** `componentes/graficos/grafico-lineas.tsx` (versión «acumulado») y `[tipo]/vistas-semanal.tsx`.
- **Cómo verificar:** coincide con `K5-Nuevos__grafico-acumulado__*`.

#### REP-23 · Gasto semanal en tabla: sin comparación de columnas ni la fila actual resaltada — Gasto semanal · todas · baja
- **Se ve:** `capturas/reporte-gasto-semanal__tabla__telefono-claro.png` (no se comparó pixel a pixel).
- **Debería:** Semana · Gasto (con barrita) · Ref. · Acum. · Ref. acum., la semana en curso en `--superficie-hundida` radio 10 (`S7-Semanal__vista-de-tabla.png`).
- **Arreglo:** `componentes/graficos/tabla-equivalente.tsx`.
- **Cómo verificar:** coincide con la referencia.

## CTA · Cuentas

#### CTA-01 · Editar tarjeta no permite cambiar límite, tasa, corte ni pago — Editar cuenta (tarjeta) · telefono-claro, computadora-claro · crítica
- **Se ve:** `capturas/cuenta-editar__tarjeta__telefono-claro.png`: solo Nombre, Institución, Últimos 4 y Fecha de apertura, y «Guardar cambios». No hay Límite, Tasa anual, Día de corte ni Día de pago (`flujos/cuentas-editar/formulario.tsx` no los tiene) y la ruta `/condiciones` de una tarjeta redirige al detalle (CTA-03). Esos datos no se corrigen desde ninguna pantalla.
- **Debería:** el menú de la tarjeta dice «Editar · Nombre, límite, tasa, corte y pago» (`docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/mas-acciones-tarjeta__telefono-claro.png`) y `editar__telefono-claro.png` de la misma carpeta es la pantalla donde se editan.
- **Arreglo:** agregar a `flujos/cuentas-editar/formulario.tsx` (y su `lector.tsx`) los campos Límite, Tasa anual, Día de corte y Día de pago con los mismos componentes de campo de `flujos/cuentas-nueva/formulario.tsx`, solo para tarjetas.
- **Cómo verificar:** editar la Visa Oro desde «Más acciones › Editar», cambiar y guardar los 4 datos; el detalle muestra los valores nuevos.

#### CTA-02 · Nueva cuenta no tiene el paso «¿Qué tipo de cuenta es?» — Nueva cuenta · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta-nueva__inicial__telefono-claro.png`: el tipo es una lista de 4 radios («Efectivo o ahorro, Tarjeta de crédito, Préstamo, Inversión») dentro del mismo formulario, con Efectivo ya elegido y «Crear cuenta» al final.
- **Debería:** `06-detalle-de-cuenta/nueva-tipo__telefono-claro.png`: primero cuatro tarjetas 2 × 2 (disco con ícono, título y descripción), un aviso informativo sobre el saldo inicial y «Continuar» deshabilitado con «Elegí un tipo de cuenta.». Luego `nueva-tarjeta__telefono-claro.png` muestra las 4 tarjetas compactas arriba con la elegida resaltada.
- **Arreglo:** en `flujos/cuentas-nueva/formulario.tsx`, reemplazar el radiogroup por el selector de tarjetas de tipo (radios con aspecto de tarjeta, `--radio-contenedor`, `--superficie`; elegido con `--accion-fondo` y borde `--accion`) y agregar el paso inicial con «Continuar».
- **Cómo verificar:** `/cuentas/nueva` abre sin tipo elegido y «Continuar» deshabilitado con motivo; al elegir un tipo aparece el formulario con las 4 tarjetas arriba.

#### CTA-03 · «Condiciones» en el menú de una tarjeta no abre nada y falta «Pagar tarjeta» — Más acciones (tarjeta) · telefono-claro · alta
- **Se ve:** `capturas/cuenta__mas-acciones-tarjeta__telefono-claro.png`: Editar, Condiciones, Verificar saldo, Conciliar, Ordenar cuentas, Archivar, Eliminar. `cuenta-condiciones__tarjeta` documenta que «Condiciones» redirige al detalle de la misma tarjeta.
- **Debería:** `mas-acciones-tarjeta__telefono-claro.png`: Editar, **Pagar tarjeta**, Verificar saldo, Conciliar con estado de cuenta, Archivar, Eliminar; sin «Condiciones» ni «Ordenar cuentas».
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y `app/(finn)/cuentas/[cuentaId]/acciones.tsx`: quitar «Condiciones» en tarjetas, sumar «Pagar tarjeta» y dejar «Ordenar cuentas» solo donde la referencia lo muestra; `flujos/cuentas-condiciones/lector.tsx` ya no necesita la redirección.
- **Cómo verificar:** el menú de la Visa Oro coincide fila por fila con la referencia y toda entrada abre una pantalla.

#### CTA-04 · Los flujos cortos de Cuentas son páginas completas, no hoja inferior (teléfono) ni panel lateral (computadora) — Pagar tarjeta, Pagar cuota, Archivar, Eliminar, Verificar saldo, Ordenar · telefono-claro, computadora-claro · alta
- **Consolidado en:** GLO-23 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png` y `…__computadora-claro.png`, `cuenta-cuota__principal`, `cuenta-archivar__bloqueado`, `cuenta-eliminar__bloqueado`, `cuenta-verificar-saldo__datos`, `cuentas-ordenar__principal`: pantalla completa con «X» y título, sin el detalle detrás. En computadora, Pagar es una página de 720 px.
- **Debería:** las referencias son una **hoja inferior** con tirador, título, «X» y botones al pie sobre el detalle atenuado (p. ej. `pagar-tarjeta__telefono-claro.png`, `archivar-bloqueado__telefono-claro.png`) y en computadora un **panel lateral** (`pagar-tarjeta__computadora-claro.png`; PANTALLAS §3.2: «Los flujos cortos se abren como panel lateral»). Conciliar sí es flujo largo.
- **Arreglo:** abrir esas rutas con la hoja/panel que usa Asignar (rutas interceptadas o hoja controlada por la ruta) en `app/(finn)/cuentas/[cuentaId]/{pagar,cuota,archivar,eliminar,verificar-saldo}` y `app/(finn)/cuentas/ordenar`; el contenido de `flujos/cuentas-*/formulario.tsx` se conserva.
- **Cómo verificar:** al abrir cada flujo se ve el detalle atenuado detrás y, en computadora, un panel a la derecha.

#### CTA-05 · Archivar con saldo no ofrece «Transferir el saldo» y «Volver a la cuenta» es un enlace subrayado — Archivar bloqueado · telefono-claro · alta
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/cuenta-archivar__bloqueado__telefono-claro.png`: aviso de problema y el enlace subrayado «Volver a la cuenta»; ninguna acción para resolverlo.
- **Debería:** `archivar-bloqueado__telefono-claro.png`: título «No se puede archivar», aviso, texto «Pasá el saldo a otra cuenta con una transferencia y volvé a intentarlo.» y botones «Cerrar» (tonal) y «Transferir el saldo» (principal).
- **Arreglo:** `flujos/cuentas-archivar/formulario.tsx` y `textos/cuentas-gestion.ts`: texto guía y dos botones del sistema (el principal abre la transferencia con el saldo precargado).
- **Cómo verificar:** con saldo, el bloqueo muestra los dos botones y «Transferir el saldo» abre la transferencia con $1,284.60.

#### CTA-06 · Eliminar con movimientos usa un enlace subrayado donde la referencia pone botones — Eliminar bloqueado · telefono-claro · alta
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `capturas/cuenta-eliminar__bloqueado__telefono-claro.png`: aviso de problema y el enlace subrayado «Archivar en lugar de eliminar».
- **Debería:** `eliminar-bloqueado__telefono-claro.png`: título «No se puede eliminar», aviso y botones «Cerrar» (tonal) + «Archivar» (principal).
- **Arreglo:** `flujos/cuentas-eliminar/formulario.tsx`: `Boton` tonal y principal en lugar del enlace.
- **Cómo verificar:** coincide con la referencia y «Archivar» abre el flujo de archivar.

#### CTA-07 · Verificar saldo: dos pantallas con lista de movimientos en lugar del cálculo en el lugar — Verificar saldo · telefono-claro · alta
- **Se ve:** `capturas/cuenta-verificar-saldo__datos__telefono-claro.png`: Fecha y «Saldo que muestra tu banco», «20 transacciones hasta esa fecha.» y «Ver diferencia»; luego (`__diferencia`) una lista de las 20 transacciones con casilla («Marcar como conciliadas»).
- **Debería:** `verificar-saldo__telefono-claro.png` y `verificar-diferencia__telefono-claro.png`: una hoja con Fecha y «Saldo según el banco» lado a lado, tarjeta «Saldo en Finn al 15/10 · Diferencia» que se actualiza al escribir y el resultado en el lugar: «Sin diferencia» con «Marcar como conciliadas», o «¿Alguna de estas explica la diferencia?» con solo los candidatos y «Registrar ajuste $12.40».
- **Arreglo:** `flujos/cuentas-verificar-saldo/formulario.tsx`: un solo paso con tarjeta de diferencia (`--superficie`, filas con `--borde-sutil`, diferencia en `--advertencia-texto` o `--positivo-texto`) y lista reducida a candidatos; textos en `textos/verificar-saldo.ts`.
- **Cómo verificar:** escribir 1,272.20 muestra $12.40 sin cambiar de pantalla y ofrece «Registrar ajuste $12.40».

#### CTA-08 · Verificar saldo: los datos van como párrafos sueltos y el aviso sin título — Verificar saldo · telefono-claro · media
- **Se ve:** `capturas/cuenta-verificar-saldo__diferencia__telefono-claro.png`: «Saldo de Finn al 15/10/2026: $1,284.60» y «Diferencia: −$12.40» como texto; el aviso amarillo en `cuerpo-pequeno` sin título.
- **Debería:** `verificar-diferencia__telefono-claro.png`: tarjeta con dos filas (nombre `cuerpo`, monto 700 a la derecha) y avisos con título `etiqueta` 700.
- **Arreglo:** componente de aviso en línea con `titulo` y la tarjeta de filas de CTA-07.
- **Cómo verificar:** título del aviso 700 en `--advertencia-texto`.

#### CTA-09 · Conciliar: el archivo se elige con el control nativo en inglés y faltan fecha de corte y saldo final — Conciliar · subir y error · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta-conciliar__subir__telefono-claro.png`: «Archivo CSV» y el texto nativo «Choose File No file chosen»; sin zona de arrastre ni campos de corte; «Revisar» activo dentro del flujo, sin pie fijo ni motivo. Con archivo (`__error`) el nombre también sale como texto nativo.
- **Debería:** `conciliar-subir__telefono-claro.png`: campos «Fecha de corte» y «Saldo final del estado», zona punteada con ícono, «Subí el estado de cuenta», «Archivo CSV que descargás del portal del banco.» y botón tonal «Elegir archivo»; pie fijo con «Revisar» deshabilitado y «Subí el archivo CSV.». `conciliar-error__telefono-claro.png`: nombre, tamaño, «Elegir otro archivo» y borde `--problema-borde`.
- **Arreglo:** `flujos/cuentas-conciliar/formulario.tsx`: ocultar el `<input type=file>` tras un botón tonal, zona con borde punteado y `--radio-contenedor`, los dos campos y `flujos/pie-de-hoja.tsx` para «Revisar».
- **Cómo verificar:** no aparece texto en inglés y sin archivo «Revisar» está deshabilitado con motivo visible.

#### CTA-10 · Conciliar resultado: saldos como texto, sin tarjeta, y «Terminar» no es pie fijo — Conciliar · resultado · telefono-claro · media
- **Se ve:** `capturas/cuenta-conciliar__resultado__telefono-claro.png`: tres líneas de texto («Saldo del estado… Saldo de Finn… Diferencia»); «Agregar» como botón tonal a todo el ancho con el select de categoría en el bloque; «Terminar» y «Elegir otro archivo» al final del contenido.
- **Debería:** `conciliar-resultado__telefono-claro.png`: tarjeta con tres filas (diferencia en `--advertencia-texto`), «Coinciden · 42 / Ver todas», filas compactas con «Agregar» tonal a la derecha, aviso informativo sobre el ajuste y «Terminar» principal en pie fijo.
- **Arreglo:** `flujos/cuentas-conciliar/formulario.tsx` con la tarjeta de filas de CTA-07 y `flujos/pie-de-hoja.tsx`.
- **Cómo verificar:** «Terminar» queda fijo al pie con 52 px de alto.

#### CTA-11 · Ordenar cuentas: grupos con «Subir/Bajar» de texto y «Guardar orden», sin asas ni guardado automático — Ordenar · telefono-claro · media
- **Se ve:** `capturas/cuentas-ordenar__principal__telefono-claro.png`: cuatro grupos por tipo con dos botones tonales por fila y «Guardar orden» al final.
- **Debería:** `ordenar__telefono-claro.png`: una lista en tarjeta con asa, flechas ↑ ↓ de 44 px, fila activa resaltada, «Arrastrá desde el asa o usá las flechas. Cada cambio se guarda solo y se puede deshacer.» y «Listo». DECISIONES transversal 5: el resultado queda en el lugar.
- **Arreglo:** `flujos/cuentas-ordenar/formulario.tsx`: lista única con íconos de flecha y asa, guardado por cambio con «Deshacer» y «Listo».
- **Cómo verificar:** mover una cuenta guarda sin otro botón y muestra el resultado en el lugar.

#### CTA-12 · Cuenta archivada: cuatro botones deshabilitados con el mismo texto repetido y aviso informativo en vez del bloque «Archivada» — Detalle archivada · telefono-claro · media
- **Se ve:** `capturas/cuenta__archivada__telefono-claro.png`: aviso azul «Esta cuenta está archivada: solo podés mirarla.», luego Pagar, Cuota, Conciliar y Registrar deshabilitados, cada uno con «La cuenta está archivada. Desarchivala para usar esta acción.», y «Desarchivar».
- **Debería:** `archivada__telefono-claro.png`: bloque «Archivada» con ícono, «Esta cuenta está archivada: se puede consultar pero no recibe movimientos nuevos.» y «Desarchivar»; la cuenta debajo con candado y «BAC · archivada el 02/09/2026»; sin botones de acción.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/acciones.tsx`: en archivada no renderizar los botones deshabilitados y mostrar el bloque de la referencia; fecha en `componentes/dominio/identidad-cuenta.tsx`.
- **Cómo verificar:** un único aviso con «Desarchivar» y ningún botón deshabilitado.

#### CTA-13 · La cara de la tarjeta no dice la red («Visa · crédito») — Lista y detalle de tarjeta · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png` y `cuenta__tarjeta__telefono-claro.png`: bajo «•••• 4821» no hay nada; el análisis marca «Visa · crédito» y «Mastercard · crédito» como ausentes. (En la vista previa de nueva tarjeta sí aparece: `cuenta-nueva__color-zafiro`.)
- **Debería:** PANTALLAS §2.9: «•••• 4821» + «Visa · crédito» `.t-rotulo`; `S6-Cuentas__telefono-claro.png`, `tarjeta__telefono-claro.png`.
- **Arreglo:** `componentes/dominio/cara-tarjeta.tsx`: mostrar el rótulo de la red también en lista y detalle.
- **Cómo verificar:** la cara de la Visa Oro dice «VISA · CRÉDITO».

#### CTA-14 · Cara de tarjeta: monto de 20 px (debe ser 28), nombre de 22 (debe ser 20) y sin tabular-nums — Lista y detalle de tarjeta · telefono-claro · media
- **Se ve:** `analisis/cuentas__principal.md`: «$642.18» 20 px / interlineado 25; «Visa Oro» 22 px; «•••• 4821» con tnum normal.
- **Debería:** PANTALLAS §2.9: nombre `.t-titulo-seccion` 1.25rem, monto `.t-cifra` 1.75rem, últimos 4 con `tabular-nums` (la referencia mide 28 y `tabular-nums`).
- **Arreglo:** `cara-tarjeta.tsx`: roles `cifra` (1.75rem) y `titulo-seccion` (1.25rem), `tabular-nums` en los últimos 4.
- **Cómo verificar:** medir 28 / 20 px y tnum.

#### CTA-15 · Detalle de la tarjeta al frente: «Confirmado» en línea aparte y fechas con año — Lista de Cuentas · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: «Te falta reservar $18.75», una línea «Confirmado $0.00» debajo y rejilla «Corte 25/10/2026 · Pago 15/10/2026 · Sin intereses».
- **Debería:** `S6-Cuentas__telefono-claro.png`: indicador y «Confirmado $607.18» en la misma fila y rejilla «Corte 25/10 · Pago 15/11 · Sin intereses $512.40» sin año (PANTALLAS §2.9).
- **Arreglo:** bloque de detalle de `componentes/dominio/billetera.tsx`: fila del indicador con el confirmado a la derecha y fechas `dd/mm`.
- **Cómo verificar:** el indicador ocupa una línea y las fechas no llevan año.

#### CTA-16 · «Ordenar» y «Nueva cuenta» como fila de botones bajo el título — Lista de Cuentas · telefono-claro, computadora-claro · baja
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: fila con dos botones tonales debajo del título (en computadora, en el encabezado). Ninguna referencia de Cuentas los incluye.
- **Debería:** `S6-Cuentas__telefono-claro.png`: del título cuelga la posición neta. El acceso a «Nueva cuenta» y «Ordenar» no tiene diseño (ver Sin diseño).
- **Arreglo:** decidir con diseño; si se mantienen, `app/(finn)/cuentas/pantalla.tsx` debería llevarlos a la barra superior o «Más acciones» para no desplazar 56 px el contenido.
- **Cómo verificar:** la posición neta empieza donde la referencia.

#### CTA-17 · Barra superior del teléfono: «Registrar» es solo un «+» sin texto — Todas las pestañas · telefono-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png` y la medida: botón de 44 × 44 con «+»; el análisis marca «Registrar» como texto ausente.
- **Debería:** PANTALLAS §3.1: botón de 44 de alto, padding 0 14 0 10, ícono `plus` 18 y `.t-etiqueta` 700 «Registrar» (`S6-Cuentas__telefono-claro.png`).
- **Arreglo:** barra superior en `componentes/marco`: mostrar «Registrar» a 390 px.
- **Cómo verificar:** pastilla «+ Registrar» junto a la campana.

#### CTA-18 · Posición neta: fila «En camino $40.00» que el diseño no tiene — Lista de Cuentas · telefono-claro · baja
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: bajo la cifra «ⓘ En camino $40.00»; en el desglose «Saldos a favor $0.00».
- **Debería:** PANTALLAS §2.11 y `S6-Cuentas__telefono-claro.png`: cifra y dos filas (Activos / Deudas) con «Efectivo · Inversiones · Por cobrar».
- **Arreglo:** `componentes/dominio/posicion-neta.tsx`: confirmar con diseño si «En camino» queda; si no, retirarla.
- **Cómo verificar:** la tarjeta coincide con §2.11.

#### CTA-19 · Posición neta: montos de Activos y Deudas en peso 400 (debe ser 700) — Lista de Cuentas · telefono-claro, computadora-claro · baja
- **Se ve:** `analisis/cuentas__principal.md`: «$6,520.20» y «$4,852.18» peso 400.
- **Debería:** referencia `S6-Cuentas__telefono-claro.html`: peso 700.
- **Arreglo:** `posicion-neta.tsx`: peso 700 en los montos de fila.
- **Cómo verificar:** medida 700.

#### CTA-20 · Totales de cada grupo en 16 px / 400 (debe ser 14 px / 600) — Lista de Cuentas · telefono-claro, computadora-claro · media
- **Se ve:** «$642.18», «$4,404.60», «$4,210.00», «$2,075.60»: tamaño 16, peso 400, interlineado 24.
- **Debería:** PANTALLAS §9: total `.t-cuerpo-pequeno` 600 (14 px, interlineado 20.3).
- **Arreglo:** encabezado de grupo en `app/(finn)/cuentas/pantalla.tsx`: rol `cuerpo-pequeno`, peso 600.
- **Cómo verificar:** medida 14 / 600.

#### CTA-21 · Billetera apilada con tres tarjetas: las de atrás no muestran el banco — Lista de Cuentas · telefono-claro · baja
- **Se ve:** `capturas/cuentas__subtipos-y-tres-tarjetas__telefono-claro.png`: la franja de la tarjeta de atrás muestra solo el nombre.
- **Debería:** PANTALLAS §2.9: de la de atrás se ve «su franja con nombre y banco» (`S6-Cuentas__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/billetera.tsx`: banco a la derecha de cada franja apilada.
- **Cómo verificar:** cada franja visible muestra nombre y banco.

#### CTA-22 · Cabecera de cuenta: línea «Saldo confirmado $0.00» que el diseño no tiene — Detalle de efectivo, préstamo y archivada · telefono-claro, computadora-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: bajo el saldo, «Saldo confirmado $0.00» (también préstamo, ahorro, billetera, archivada).
- **Debería:** `corriente__telefono-claro.png`: Saldo y nada más.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/cabecera.tsx`: mostrarlo solo si difiere del saldo.
- **Cómo verificar:** sin esa línea cuando coinciden.

#### CTA-23 · Aviso de diferencia: solo «Ver conciliación» subrayado, sin «Verificar saldo» — Detalle de efectivo · telefono-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: un enlace subrayado «Ver conciliación».
- **Debería:** `corriente__telefono-claro.png`: dos acciones en `--advertencia-texto` 700 («Verificar saldo», «Ver conciliación»; PANTALLAS §2.14).
- **Arreglo:** aviso en `app/(finn)/cuentas/[cuentaId]/conciliaciones.tsx` o `cabecera.tsx`: ambas acciones sin subrayado de enlace común.
- **Cómo verificar:** dos acciones.

#### CTA-24 · Detalle: selector de período y filtros Tipo/Estado/Filtrar donde la referencia no los muestra — Detalle de efectivo, tarjeta, inversión, vacía · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`, `cuenta__tarjeta`, `cuenta__inversion`, `cuenta__vacia`: tarjeta de período, dos `select` nativos y «Filtrar» antes de la lista. En la vacía los filtros aparecen sobre «Esta cuenta todavía no tiene movimientos».
- **Debería:** `corriente`, `tarjeta`, `inversion` y `vacia` (carpeta `06-detalle-de-cuenta`): los movimientos siguen directo al título; solo `prestamo__telefono-claro.png` muestra período y filtros.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/movimientos.tsx`: período y filtros solo cuando hay lista (nunca con la lista vacía) y detrás de una acción donde la referencia no los dibuja.
- **Cómo verificar:** vacía sin controles; corriente y tarjeta como la referencia.

#### CTA-25 · Lista de movimientos del detalle muestra todo el historial — Detalle · telefono-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: ~30 filas «Sin comercio» sin tope.
- **Debería:** `corriente__telefono-claro.png`: 4 filas y «Ver en Actividad».
- **Arreglo:** `movimientos.tsx`: tope de filas con el enlace a Actividad.
- **Cómo verificar:** el detalle muestra un tope y «Ver en Actividad».

#### CTA-26 · Detalle de tarjeta: falta la barra «Reservado $623.43 de $642.18 · 97.10 %» y la rejilla es otra — Detalle de tarjeta · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta__tarjeta__telefono-claro.png`: indicador «Te falta reservar $18.75», botón «Reservar $18.75», filas «Reservado / Deuda» y rejilla «Saldo a favor · Límite · Uso del límite · Ciclo de facturación»; sin barra.
- **Debería:** `tarjeta__telefono-claro.png`: barra de 8 px con «Reservado $623.43 de $642.18» y 97.10 % (parte sin reservar con `--patron-sin-reservar`) y rejilla de 3 «Corte · Pago · Límite».
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/por-tipo.tsx`: bloque de tarjeta con la barra y la rejilla de 3.
- **Cómo verificar:** coincide con la referencia en teléfono y computadora.

#### CTA-27 · «Reservar $18.75» como botón en fila propia — Detalle de tarjeta · telefono-claro · baja
- **Se ve:** pastilla principal bajo el indicador.
- **Debería:** `tarjeta__telefono-claro.png`: enlace «Reservar $18.75» a la derecha del indicador en `--enlace` 700.
- **Arreglo:** `por-tipo.tsx`: acción en la misma fila que el indicador.
- **Cómo verificar:** el indicador ocupa una fila.

#### CTA-28 · «Para no generar intereses»: rótulo partido y sin la fila final «Pagá antes del 15/11» — Detalle de tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta__tarjeta__telefono-claro.png`: encabezado en dos líneas («PARA NO GENERAR / INTERESES» + «Pagá antes del 15/10» en dos líneas) y cuatro filas sin total final destacado.
- **Debería:** `tarjeta__telefono-claro.png`: rótulo en una línea y fila final «Pagá antes del 15/11 · $512.40» en 700.
- **Arreglo:** `por-tipo.tsx` y `textos/cuenta-detalle.ts`.
- **Cómo verificar:** rótulo en una línea y total en negrita al pie.

#### CTA-29 · Préstamo: tabla de amortización de 6 columnas desborda la pantalla — Detalle de préstamo · telefono-claro · media
- **Se ve:** `capturas/cuenta__prestamo-con-amortizacion__telefono-claro.png`: N.º, Fecha, Capital, Interés, Seguro, Saldo; «Saldo» recortado al borde derecho (`desbordeHorizontal` verdadero en `medidas/cuenta__prestamo-con-amortizacion__telefono-claro.json`).
- **Debería:** `prestamo__telefono-claro.png`: 5 columnas (Cuota, Fecha, Capital, Interés, Saldo) que entran en 350 px, fila actual resaltada.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/filas-amortizacion.tsx`: quitar Seguro de la tabla en teléfono (queda en el detalle de la cuota) o contener el desplazamiento en la tabla.
- **Cómo verificar:** `scrollWidth` de la página = 390.

#### CTA-30 · Inversión: aportado/retirado/ajustes dentro de la tarjeta de identidad y sin las barras grandes — Detalle de inversión · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuenta__inversion__telefono-claro.png`: VALOR y la rejilla Aportado · Retirado · Ajustes dentro del fondo violeta, sin motivo de barras.
- **Debería:** `inversion__telefono-claro.png`: la tarjeta lleva «Depósito a plazo», VALOR y las seis barras; la rejilla va afuera, sobre los botones.
- **Arreglo:** `por-tipo.tsx` y `identidad-cuenta.tsx` (variante de detalle con las barras).
- **Cómo verificar:** coincide con la referencia.

#### CTA-31 · Inversión: «Aporte» sin ícono «+» — Detalle de inversión · telefono-claro · baja
- **Se ve:** botones «Aporte · Retiro · Ajuste» sin ícono.
- **Debería:** `inversion__telefono-claro.png`: «+ Aporte» con ícono `plus`.
- **Arreglo:** `por-tipo.tsx`.
- **Cómo verificar:** ícono visible.

#### CTA-32 · Cuenta sin movimientos: ícono y CTA distintos de la referencia — Detalle vacía · telefono-claro · media
- **Se ve:** `capturas/cuenta__vacia__telefono-claro.png`: círculo verde con anillo punteado, título pequeño, «Cuando registres algo con esta cuenta, lo vas a ver acá.» y «Registrar con esta cuenta» tonal.
- **Debería:** `vacia__telefono-claro.png`: círculo neutro con ícono `activity`, título más grande, «Los gastos e ingresos que registres con ella van a aparecer aquí con el saldo después de cada uno.» y botón principal «+ Registrar con esta cuenta».
- **Arreglo:** vacío de `movimientos.tsx` según PANTALLAS §2.19.
- **Cómo verificar:** botón principal y texto de la referencia.

#### CTA-33 · «Cuenta desarchivada» es texto con enlace subrayado sin contenedor — Detalle (resultado) · telefono-claro · baja
- **Se ve:** `capturas/cuenta__desarchivada__telefono-claro.png`: ícono + «Cuenta desarchivada.» y el enlace subrayado «↶ Archivar de nuevo» sin contenedor.
- **Debería:** PANTALLAS §2.13: contenedor sin borde de 56 px con ícono, texto y enlace 700 `--enlace`, con rebote `--curva-enfasis`.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/desarchivar.tsx`: componente de resultado de §2.13.
- **Cómo verificar:** contenedor `--superficie`, sin subrayado.

#### CTA-34 · Menú «Más acciones» sin los subtítulos de la referencia — Más acciones · telefono-claro · baja
- **Se ve:** `capturas/cuenta__mas-acciones__telefono-claro.png`: títulos de una línea.
- **Debería:** `mas-acciones__telefono-claro.png`: «Conciliar con estado de cuenta · Archivo CSV del banco»; `mas-acciones-tarjeta__telefono-claro.png`: «Editar · Nombre, límite, tasa, corte y pago».
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y `textos/cuenta-detalle.ts`: subtítulo `cuerpo-pequeno` en `--texto-secundario`.
- **Cómo verificar:** subtítulos visibles.

#### CTA-35 · Institución y Red como listas de radios; formulario largo y sin pie fijo — Nueva cuenta y Editar · telefono-claro · media
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`, `cuenta-editar__tarjeta`: Institución son 4 radios de 52 px y Red 3 radios; Límite, Tasa, Corte y Pago a todo el ancho; «Crear cuenta» al final del contenido (página de ~2 000 px).
- **Debería:** `nueva-tarjeta__telefono-claro.png` y `editar__telefono-claro.png`: Institución (select) + Últimos 4, Límite + Tasa, Corte + Pago y Red + Color en dos columnas; «Crear Visa Oro» / «Guardar cambios» en pie fijo.
- **Arreglo:** `flujos/cuentas-nueva/formulario.tsx` y `flujos/cuentas-editar/formulario.tsx`: rejilla de 2 columnas, select de institución y `flujos/pie-de-hoja.tsx`; el color puede seguir con las 8 muestras (DECISIONES).
- **Cómo verificar:** el formulario de tarjeta entra en ~2 pantallas y el botón queda fijo.

#### CTA-36 · Saldo inicial: «Debo / Tengo a favor» debajo del saldo y sin prefijo `$` — Nueva cuenta (tarjeta) · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`: «Saldo de la tarjeta», «Se entiende como $642.18» y el segmentado después.
- **Debería:** `nueva-tarjeta__telefono-claro.png`: «Saldo inicial» (segmentado) y luego «Saldo» con prefijo `$`.
- **Arreglo:** orden y prefijo en `formulario.tsx`.
- **Cómo verificar:** mismo orden y prefijo.

#### CTA-37 · Muestras de color de la tarjeta sin nombre ni marca de selección más que el borde — Nueva cuenta (tarjeta) · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__color-zafiro__telefono-claro.png`: 8 cuadrados de 44; el elegido solo se distingue por el borde, y ninguno dice su nombre.
- **Debería:** DECISIONES regla 2 (tres señales por estado: color, glifo y texto) y «Tarjetas de crédito» (8 colores).
- **Arreglo:** `flujos/cuentas-nueva/color-tarjeta.tsx`: nombre del color elegido junto a «Color de la tarjeta» y check en la muestra elegida.
- **Cómo verificar:** al elegir aparece el nombre y un check.

#### CTA-38 · Nombre repetido: aviso sin título ni dato de la otra tarjeta — Nueva cuenta · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__nombre-repetido__telefono-claro.png`: «Ya tenés una tarjeta llamada Visa Oro.».
- **Debería:** `nueva-nombre-repetido__telefono-claro.png`: título «Nombre repetido» y «Ya tenés una tarjeta llamada Visa Oro (BAC ***4821). Podés guardar igual; te conviene un nombre distinto para reconocerlas.».
- **Arreglo:** `textos/cuentas-nueva.ts` (`nombreEnUso`) y aviso con título.
- **Cómo verificar:** texto y título iguales.

#### CTA-39 · Editar efectivo: fecha de apertura editable y sin saldo ni aviso — Editar cuenta · telefono-claro · media
- **Se ve:** `capturas/cuenta-editar__principal__telefono-claro.png`: Fecha de apertura editable; no hay saldo.
- **Debería:** `editar__telefono-claro.png`: «Fecha de apertura» y «Saldo» de solo lectura (borde punteado, «Solo lectura») y aviso «El saldo cambia con los movimientos. Para corregir una diferencia con el banco, usá “Verificar saldo”.».
- **Arreglo:** `flujos/cuentas-editar/formulario.tsx`: campos de solo lectura y aviso informativo.
- **Cómo verificar:** ambos no editables y con el aviso.

#### CTA-40 · Condiciones del préstamo: campos y orden distintos de la referencia — Condiciones · telefono-claro · media
- **Se ve:** `capturas/cuenta-condiciones__sin-modelo__telefono-claro.png`: «Quién te prestó, Monto original, Tasa, Seguro, Comisión, Tipo de tasa (radios), Frecuencia (5 radios), Cuota pactada, Cantidad de cuotas, Modelo» en una columna larga.
- **Debería:** `condiciones-sin-modelo__telefono-claro.png`: Monto original + Tasa, Plazo + Cuotas pagadas, Primera cuota y «Modelo de cálculo» (select con «Solo se registra lo que pagás») con el aviso «Este préstamo no tiene un modelo de cálculo…»; pie fijo «Guardar condiciones».
- **Arreglo:** `flujos/cuentas-condiciones/formulario.tsx` y `campos.ts`: campos y orden de la referencia; el resto solo según el modelo elegido.
- **Cómo verificar:** con «Ninguno» solo se ven los campos de la referencia.

#### CTA-41 · Pagar tarjeta: la fila de chips no envuelve y «Lo reservado» queda fuera de pantalla — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png`: «Para no generar intereses» y «Toda la deuda» en una fila que sobresale del borde derecho; «Lo reservado» no se ve (sí en computadora).
- **Debería:** `pagar-tarjeta__telefono-claro.png`: tres chips que envuelven en dos filas.
- **Arreglo:** `flujos/cuentas-pagar/formulario.tsx`: `flex-wrap`.
- **Cómo verificar:** los tres chips dentro de los 20 px de margen.

#### CTA-42 · Pagar tarjeta: subtítulo sin la fecha de pago — Pagar tarjeta · telefono-claro · baja
- **Se ve:** «Deuda $642.18».
- **Debería:** «Deuda $642.18 · pago 15/11» (`pagar-tarjeta__telefono-claro.png`).
- **Arreglo:** `textos/cuentas-pagar.ts`.
- **Cómo verificar:** texto igual.

#### CTA-43 · Flujos de Cuentas en computadora llevan campana — Pagar y demás flujos · computadora-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__computadora-claro.png`: campana arriba a la derecha.
- **Debería:** regla de marco de DECISIONES: los flujos no llevan campana (la referencia es un panel lateral sin ella).
- **Arreglo:** marco de los flujos de `app/(finn)/cuentas/[cuentaId]/{pagar,cuota,archivar,eliminar,verificar-saldo,conciliar,editar,condiciones}` y `ordenar`.
- **Cómo verificar:** `marco.campana` falso en los flujos.

#### CTA-44 · Pagar más que la deuda: paso extra «Revisá el pago» y aviso duplicado — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__mas-que-la-deuda__telefono-claro.png`: pantalla intermedia con cuatro frases de impacto y dos avisos amarillos («Pagás $76.57 más…» y «Pagás más que la deuda…»).
- **Debería:** `pagar-saldo-a-favor__telefono-claro.png`: mismo formulario con el aviso «Pago mayor que la deuda» en línea y «Pagar $700.00»; el paso de revisión no tiene diseño (ver Sin diseño).
- **Arreglo:** `flujos/cuentas-pagar/formulario.tsx`: un solo aviso con título.
- **Cómo verificar:** un aviso y pago desde el formulario.

#### CTA-45 · Pagar cuota: origen como radios, título sin número, sin subtítulo y botón «Guardar pago» — Pagar cuota · telefono-claro · media
- **Se ve:** `capturas/cuenta-cuota__principal__telefono-claro.png`: «PAGAR CUOTA», «Capital pendiente: $4,210.00», radios de 4 cuentas (incluye tarjetas), campos en una columna y «Guardar pago».
- **Debería:** `cuota__telefono-claro.png`: «Pagar cuota 14», «Préstamo personal · vence 20/10», «Desde» (select con saldo), Fecha + Total, Categoría («Cuota del préstamo · Disponible $210.00»), Desglose Capital · Interés · Seguro y «Pagar $210.00».
- **Arreglo:** `flujos/cuentas-cuota/formulario.tsx`, `textos/cuentas-cuota.ts`.
- **Cómo verificar:** título, subtítulo y botón con monto.

#### CTA-46 · Cuota que no cuadra: «Guardar pago» activo y el campo sin borde de error — Pagar cuota · telefono-claro · media
- **Se ve:** `capturas/cuenta-cuota__no-cuadra__telefono-claro.png`: aviso «Capital, interés y seguro suman $209.00; el pago es de $210.00.» pero el botón sigue habilitado y ningún campo marca el error.
- **Debería:** `cuota-no-cuadra__telefono-claro.png`: campo en error con borde `--problema-borde`, el aviso y «Pagar $210.00» deshabilitado.
- **Arreglo:** `formulario.tsx` de cuota: `disabled` con motivo y `aria-invalid` en el campo.
- **Cómo verificar:** el botón no se activa hasta que la suma cuadra.

#### CTA-47 · Archivar (cuenta en cero): sin título con el nombre, sin saldo y con un solo botón — Archivar · telefono-claro · baja
- **Se ve:** `capturas/cuenta-archivar__tarjeta__telefono-claro.png`: frase «¿Archivar Mastercard Clásica? …» y un solo botón «Archivar».
- **Debería:** `archivar__telefono-claro.png`: título «¿Archivar Cuenta de ahorro?», «Saldo $0.00», explicación y «Cancelar» (tonal) + «Archivar» (principal).
- **Arreglo:** `flujos/cuentas-archivar/formulario.tsx`.
- **Cómo verificar:** dos botones y título con saldo.

#### V-09 · Nueva cuenta (tarjeta): rótulos y botón distintos de la referencia — Nueva cuenta · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`: «Últimos 4 dígitos · Opcional», «Saldo de la tarjeta», «Tasa anual (%)», «Fecha de apertura» y «Crear cuenta».
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/nueva-tarjeta__telefono-claro.png`: «Últimos 4», «Saldo», «Tasa anual», «Fecha de apertura en Finn» y «Crear Visa Oro». CTA-35 pide el pie fijo con «Crear Visa Oro» y CTA-36 el «Saldo», pero no listan los demás rótulos.
- **Arreglo:** `apps/web/src/textos/cuentas-nueva.ts` (y `cuentas-nueva-base.ts`), usados por `apps/web/src/flujos/cuentas-nueva/formulario.tsx`.
- **Cómo verificar:** los rótulos coinciden con el PNG de referencia.
- **Sección:** CTA · **Fuente:** verificación independiente

#### V-10 · Pagar tarjeta: el campo Monto no lleva etiqueta y el desglose no tiene separadores — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png`: `medidas/…json` coloca el campo Monto (x=20, y=480) y el campo Fecha (x=200, y=504) en la misma fila con 24 px de diferencia; solo Fecha tiene etiqueta. El desglose («Deuda anterior», «Cargos del ciclo», «Ya pagado»…) no lleva líneas entre filas y «Para no generar intereses» va en peso 400.
- **Debería:** `…/06-detalle-de-cuenta/pagar-tarjeta__telefono-claro.png`: «Monto» y «Fecha» con etiqueta, a la misma altura; filas del desglose separadas por `--borde-sutil` y la fila final en negrita (CTA-28 pide lo mismo para el detalle de la tarjeta).
- **Arreglo:** `apps/web/src/flujos/cuentas-pagar/formulario.tsx` (etiqueta y alineación de los dos campos; separadores del `<dl>` «Desglose del ciclo») y `apps/web/src/textos/cuentas-pagar.ts`.
- **Cómo verificar:** ambos campos tienen etiqueta visible y mismo `y` en las medidas; el desglose tiene separadores.
- **Sección:** CTA · **Fuente:** verificación independiente

## MAS · Más secciones: Metas, Programadas, Por cobrar, Reglas y Notificaciones

#### MAS-001 · Nueva y editar meta son páginas completas, el diseño las quiere como flujo corto — Metas · teléfono, computadora · crítica
- **Consolidado en:** GLO-23 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `meta__nueva-para-fecha__telefono-claro.png` y `meta__editar__telefono-claro.png`: pantalla propia con «Cerrar» y título «META PARA VIAJE» / «EDITAR META DE GAS», sin la lista detrás. En computadora, una columna de 720 px con sidebar (`…computadora-claro.png`).
- **Debería:** INDICE-entrega-2 («Se trató como corto: … metas») y `09a-metas/nueva__telefono-claro.png`: hoja inferior sobre Metas con agarradera y «Meta para Fondo de emergencia · Ahorro»; en computadora, panel lateral de 440 px sobre velo (`nueva__computadora-claro.png`).
- **Arreglo:** abrir `metas/nueva` y `metas/[metaId]` como ruta interceptada en `@superpuesto/(.)metas/…`, igual que `sacar`; la página directa queda como respaldo.
- **Cómo verificar:** desde Metas, «Editar»/«Crear una meta» abre hoja (teléfono) o panel (computadora) y la lista queda detrás.

#### MAS-002 · Nueva meta: faltan las etiquetas «Tipo» y «Modo» y el copy del modo es otro — Metas · teléfono · media
- **Se ve:** el selector de tipo no tiene etiqueta; el de modo dice «Acumular / Rellenar hasta».
- **Debería:** etiquetas «Tipo» y «Modo»; opciones «Asignar / Tener disponible» (09a/nueva).
- **Arreglo:** `flujos/metas-nueva/formulario.tsx` y `textos/metas.ts` (`tipo`, `modos`). Si el copy cambia, también el contrato de textos de metas (decisión de producto: CH).
- **Cómo verificar:** coincide con el PNG.

#### MAS-003 · Lista de metas: acciones «Editar» y «Ver la categoría» como enlaces subrayados — Metas · teléfono, computadora · media
- **Se ve:** `metas__lista__telefono-claro.png`: en cada tarjeta, «Editar» y «Ver la categoría» en `--texto` subrayado, 600.
- **Debería:** `09a-metas/lista__telefono-claro.png`: sin acciones por tarjeta; las filas de «Otras metas» son enlaces completos con estado y flecha.
- **Arreglo:** `app/(finn)/metas/pantalla.tsx`: hacer tocable toda la tarjeta hacia el detalle de la meta y quitar los enlaces sueltos.
- **Cómo verificar:** ninguna fila tiene enlaces subrayados; la tarjeta entera abre la meta.

#### MAS-004 · Lista de metas: estructura distinta (sin contenedor de resúmenes ni «Otras metas» compactas) — Metas · teléfono · alta
- **Se ve:** una sola tarjeta con todas las metas apiladas y filas largas: nombre, monto a la derecha, «Mensual · Acumular», indicador, línea de progreso solo en algunas, «Pide…», «Monto del período» y los enlaces.
- **Debería:** `09a-metas/lista__telefono-claro.png` y K3 «resumen de meta»: las metas con pedido van como resumen anidado (nombre + «Para el 30/06/2027», «$ de $ · 45 %», barra, «Pide…», indicador, «Sin fondos suficientes…»; las cubiertas con barra completa y «Meta cubierta») dentro de un contenedor; las demás en «OTRAS METAS» con nombre, «Mensual · $15.49», estado «Cubierta» o «Vencida» y flecha.
- **Arreglo:** usar `ResumenMeta` y la fila de «Otras metas» (`componentes/dominio`) en `metas/pantalla.tsx`.
- **Cómo verificar:** coincide con la jerarquía de la referencia.

#### MAS-005 · Lista: botón «Nueva meta» suelto arriba — Metas · teléfono · media
- **Se ve:** botón principal auto-ancho «Nueva meta» debajo del título (`metas__lista__telefono-claro.png`), que no está en la referencia.
- **Debería:** 09a/lista no tiene botón de alta (el alta aparece solo en «Crear una meta» del vacío y en «Categorías sin meta»); la entrada a crear queda sin diseño.
- **Arreglo:** decidir el punto de entrada (proponer CH) y dibujarlo; hasta entonces es una pieza inventada en `metas/pantalla.tsx`.
- **Cómo verificar:** el CH define dónde vive «Nueva meta».

#### MAS-006 · Meta vencida: acciones subrayadas en negro y copy sin el faltante — Metas · teléfono · media
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** aviso «Meta vencida» con «Extender la fecha» y «Ajustar el monto» subrayados en `--texto` (`metas__vencida__telefono-claro.png`); en el editor las mismas acciones son botones tonales con texto azul subrayado (`meta__editar-vencida__telefono-claro.png`). Copy: «La meta de Laptop venció el 15/05/2027 sin cumplirse.»
- **Debería:** `09a-metas/vencida__telefono-claro.png`: acciones en `--advertencia-texto` en 700, sin subrayar; copy «La meta de Viaje era para el 30/09 y faltaron $184.62.»; fila de «Otras metas» con estado «Vencida».
- **Arreglo:** `AvisoEnLinea` con acciones del estado (PANTALLAS §2.14) en `metas/pantalla.tsx` y en `flujos/metas-meta/formulario.tsx`; copy en `textos/metas.ts` (`vencida.texto`).
- **Cómo verificar:** misma presentación en la lista y en el editor.

#### MAS-007 · Vacío de Metas con glifo genérico y copy distinto — Metas · teléfono · baja
- **Se ve:** `metas__vacia__telefono-claro.png`: anillo punteado verde; «Todavía no tenés metas» / «Una meta dice cuánto falta asignar a una categoría. Nunca asigna sola.»
- **Debería:** `09a-metas/vacia__telefono-claro.png`: círculo hundido con ícono `target`; «Todavía no hay metas» / «…cada período, sin asignar sola.»
- **Arreglo:** ver CAT-14 y `textos/metas.ts`.
- **Cómo verificar:** ícono y texto de la referencia.

#### MAS-008 · Nueva meta: pie con un solo botón a todo el ancho — Metas · teléfono · media
- **Se ve:** «Crear meta» a todo el ancho; «Guardar cambios» del editor, en cambio, es auto-ancho (`meta__editar__telefono-claro.png`).
- **Debería:** «Cancelar» (tonal) y «Guardar meta» en columnas 1fr / 1.4fr (09a/nueva).
- **Arreglo:** pie del flujo corto en `formulario.tsx` de `metas-nueva` y `metas-meta`; mismo componente en ambos.
- **Cómo verificar:** pie idéntico en nueva y editar.

#### MAS-009 · Nueva meta: sin aviso informativo ni «$» en el campo de monto — Metas · teléfono · baja
- **Se ve:** campo «Monto de la meta» sin prefijo «$» y sin el aviso «La meta no asigna sola…».
- **Debería:** campo «Monto» con «$ 175.00» y aviso `información` (09a/nueva).
- **Arreglo:** `formulario.tsx` (campo de monto, `AvisoEnLinea`).
- **Cómo verificar:** coincide con el PNG.

#### MAS-010 · Selector segmentado: segmentos de ancho desigual y pastilla que sobresale — Metas · teléfono · media
- **Consolidado en:** GLO-33 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `meta__nueva-para-fecha__telefono-claro.png`: «Para una fecha» (activa) se parte en dos líneas y la pastilla mide 118 × 48 sobre un riel más bajo; en el selector de modo, el riel es de ancho completo pero los segmentos son del ancho del texto (`meta__editar__telefono-claro.png`).
- **Debería:** segmentos iguales (1fr) con la activa dentro del riel (09a/nueva).
- **Arreglo:** `componentes/base/selector-segmentado.tsx`: columnas iguales y alto de la pastilla = alto del riel − relleno.
- **Cómo verificar:** cuatro segmentos del mismo ancho; la pastilla activa queda dentro del riel.

#### MAS-011 · Nueva meta: falta el contexto de la categoría — Metas · teléfono · baja
- **Se ve:** título «Meta para Viaje»; no hay subtítulo con el grupo.
- **Debería:** subtítulo «Ahorro» bajo el título (09a/nueva).
- **Arreglo:** encabezado del flujo.
- **Cómo verificar:** subtítulo con el grupo.

#### MAS-012 · Errores de formulario sin `role="alert"` — Nueva meta · teléfono · media
- **Se ve:** `meta__nueva-error-vacio`: «Completá este campo.» con glifo y color (tres señales) pero `status=0 alert=0` en las medidas; igual en fecha pasada y sin fecha.
- **Debería:** DECISIONES regla 8 / PANTALLAS §14: avisos y errores anunciados.
- **Arreglo:** `componentes/base/campo` (mensaje de error con `role="alert"`).
- **Cómo verificar:** el análisis muestra `alert ≥ 1`.

#### MAS-013 · Editar meta: «Eliminar meta» como botón peligro a todo el ancho — Metas · teléfono · baja
- **Se ve:** botón rojo de 48 a todo el ancho al pie (`meta__editar__telefono-claro.png`).
- **Debería:** acción destructiva separada y discreta (INDICE-entrega-2: «Eliminar va en el botón `peligro` y siempre muestra el efecto antes de confirmar»); sí lo confirma dentro del flujo. Sin referencia de editar, es solo una observación.
- **Arreglo:** diseñar el editor (ver «Sin diseño») y decidir su jerarquía.
- **Cómo verificar:** según el diseño.

#### MAS-014 · Editar meta vencida: acciones como botones tonales con texto de enlace — Metas · teléfono · media
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** en `meta__editar-vencida__telefono-claro.png`, «Extender la fecha» y «Ajustar el monto» son botones tonales con texto azul subrayado.
- **Debería:** un enlace subrayado donde va un botón tonal es error (encargo común, punto 3); en el aviso de advertencia, la acción va en `--advertencia-texto` (PANTALLAS §2.14).
- **Arreglo:** ver MAS-006.
- **Cómo verificar:** una sola variante de acción de aviso en toda la app.

#### MAS-015 · Conflicto al editar: copy contradictorio — Metas · teléfono · baja
- **Se ve:** `meta__editar-conflicto__telefono-claro.png`: «Este valor cambió mientras lo editabas. Recargá para ver el valor actual.» con el botón «Usar el valor actual».
- **Debería:** una sola instrucción coherente con el botón (07/asignar-conflicto es la referencia más cercana; no se comparó píxel a píxel).
- **Arreglo:** `textos/metas.ts` o el texto de conflicto compartido.
- **Cómo verificar:** el texto y el botón dicen lo mismo.

#### MAS-101 · Horizonte como dos interruptores — Programadas · lista · teléfono y computadora · alta
- **Se ve:** `programadas__lista__telefono-claro.png`: dos interruptores "7 días" / "30 días" sin rótulo. No hay 90 días.
- **Debería:** selector segmentado "7 días · 30 días · 90 días" con el rótulo "Horizonte" encima (`11-…/09b-programadas/lista__telefono-claro.png`, INDICE-entrega-2 §09b; PANTALLAS §2.3).
- **Arreglo:** usar el segmentado de pastillas (K2 `casilla-interruptor-opciones`, el mismo de Gráfico/Tabla) en lugar de `InterruptorEnlace`; agregar `?horizonte=90` en `app/(finn)/programadas/page.tsx` y en `pantalla.tsx:60-72`.
- **Cómo verificar:** tres opciones, una activa, el rótulo "Horizonte" sobre el control, 90 días funciona.

#### MAS-102 · Atrasada en advertencia y no en problema — Programadas · lista · todas · media
- **Se ve:** aviso amarillo `advertencia` con triángulo (`programadas__lista__telefono-claro.png`).
- **Debería:** aviso de problema (`--problema-fondo`, ícono de prohibido) como en la referencia `lista__telefono-claro.png`.
- **Arreglo:** `estado="problema"` en `AvisoEnLinea` de `pantalla.tsx:87`.
- **Cómo verificar:** fondo y texto con tokens `problema`, glifo del juego de íconos de problema.

#### MAS-103 · «Atrasada» sin «Omitir» y sin monto en «Registrar» — Programadas · lista · alta
- **Se ve:** la acción es solo «Registrar» (enlace subrayado de 72 × 18, menor de 44) y el texto dice "se esperaba el 17 oct 2026 y no llegó el SMS" con año.
- **Debería:** dos acciones, "Registrar $58.40" y "Omitir", y la fecha "12/10" (`lista__telefono-claro.png`). Tocables de 44 mínimo.
- **Arreglo:** en `pantalla.tsx:97-110` agregar la acción Omitir (la hoja ya tiene `omitir`), poner `Registrar {monto}`, formatear la fecha con `dd/mm`, y dar a las dos acciones `min-h-11` (el análisis marca «Registrar» 72×18).
- **Cómo verificar:** ambas acciones visibles de 44 × 44 y con monto con tabular-nums.

#### MAS-104 · Botón «Nueva programada» en el encabezado — Programadas · lista y vacía · baja
- **Se ve:** botón tonal "+ Nueva programada" bajo el título en la lista y en la vacía (`programadas__lista`, `programadas__vacia`).
- **Debería:** ninguna acción en el encabezado de la lista; la vacía tiene un solo botón "Programar un pago" (`vacia__telefono-claro.png`).
- **Arreglo:** retirar el botón de `pantalla.tsx:40-43` o proponer el diseño de la entrada a "nueva" (FALTANTES programada-nueva); en la vacía dejar un único botón.
- **Cómo verificar:** coincidencia con la referencia o CH aprobado.

#### MAS-105 · Lista de «Programadas» duplicada con «Desactivar» a todo el ancho — Programadas · lista · alta
- **Se ve:** tras "Próximos" aparece otra sección "Programadas" con cada programada repetida y un botón tonal "Desactivar" de ancho completo (`programadas__lista__telefono-claro.png`, `…__computadora-claro.png`).
- **Debería:** una sola lista; la programada desactivada es una fila con "PAUSA —", título atenuado, "Desactivada" y el enlace "Reactivar" (`lista__telefono-claro.png`).
- **Arreglo:** fusionar `data-seccion="todas"` en la lista de próximos (`pantalla.tsx:118-146`); mover Desactivar a la pantalla de editar y dejar «Reactivar» como enlace en la fila pausada (`programadas/activar.tsx`).
- **Cómo verificar:** cada programada aparece una vez; la pausada muestra "PAUSA" y "Reactivar".

#### MAS-106 · Filas de próximos: sin flecha, sin fecha corta y títulos cortados — Programadas · lista · media
- **Se ve:** "CUOTA DEL PRESTA…" con puntos suspensivos (`analisis/programadas__lista.md`), sin `chevR` ni "20/10 · ".
- **Debería:** título que se parte en dos líneas, subtítulo "20/10 · Cuenta de ahorro · se registra sola", `chevR` a la derecha (`lista__telefono-claro.png`).
- **Arreglo:** quitar `truncate` en `pantalla.tsx:131`, agregar la fecha y el `Icono chevR`.
- **Cómo verificar:** ningún título con puntos suspensivos a 390 px.

#### MAS-107 · Una columna a 624 px en computadora — Programadas · lista · computadora · alta
- **Se ve:** `programadas__lista__computadora-claro.png`: contenido de 624 px de ancho, en una sola columna.
- **Debería:** contenido de 1144 con dos columnas (Horizonte y atrasadas a la izquierda, Próximos a la derecha) (`lista__computadora-claro.png`).
- **Arreglo:** el `<main>` de `pantalla.tsx:37` usa `max-w-3xl`; pasar al ancho de contenido del marco (1144) con `md:grid md:grid-cols-2`. Igual en Por cobrar (`max-w-3xl`), Reglas, Notificaciones (`max-w-3xl`) y Ajustes (`max-w-xl`, 576 px).
- **Cómo verificar:** a 1440 el contenido mide 1144 y el diseño coincide con la referencia de computadora.

#### MAS-108 · Estado desactivado distinto — Programadas · lista (desactivada) · media
- **Se ve:** "Visa Oro · Desactivada" en la línea de cuenta y un resultado "NETFLIX quedó desactivada." con "Reactivar" subrayado (`programadas__desactivada__telefono-claro.png`).
- **Debería:** insignia "PAUSA —" en la columna de la fecha, "Desactivada", y «Reactivar» como enlace de acción (no subrayado) (`lista__telefono-claro.png`).
- **Arreglo:** `pantalla.tsx` y `activar.tsx`.
- **Cómo verificar:** coincide con la fila "Gimnasio" de la referencia.

#### MAS-109 · Texto del estado vacío — Programadas · vacía · baja
- **Se ve:** "Todavía no tenés programadas / Cargá tus pagos que se repiten… / Crear la primera".
- **Debería:** "No hay pagos programados / Programá Netflix o la cuota del préstamo para verlos venir y emparejarlos con su SMS. / Programar un pago" (`vacia__telefono-claro.png`).
- **Arreglo:** `textos/programadas.ts` (`vacioTitulo`, `vacioTexto`, `crearUna`).
- **Cómo verificar:** textos idénticos a la referencia.

#### MAS-110 · «Cuota sin modelo» sin acción — Programadas · lista · baja (por código, sin capturar)
- **Se ve:** `pantalla.tsx:152-156`: aviso `informacion` con título y texto, sin acción.
- **Debería:** acción "Agregar condiciones" (`lista__telefono-claro.png`).
- **Arreglo:** pasar `accion` a `AvisoEnLinea` con el enlace al préstamo.
- **Cómo verificar:** la acción lleva a las condiciones del préstamo.

#### MAS-111 · Falta el segmentado «Tipo» y los tipos no coinciden — Programada · nueva y editar · alta
- **Se ve:** `programada__nueva__telefono-claro.png` trae Gasto · Pago de tarjeta · Cuota · Aporte, con "Pago de tarjeta" partido en dos líneas. `programada__editar` no tiene Tipo.
- **Debería:** Tipo: Gasto · Ingreso · Transferencia · Cuota, también en Editar (`editar__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-nueva/formulario.tsx:148` y el de edición; ajustar tipos al diseño (o CH si el dominio no soporta Ingreso/Transferencia); evitar el corte de texto en el segmentado.
- **Cómo verificar:** tipos y rótulos de una línea.

#### MAS-112 · «undefined/undefined/» en Fecha de fin — Programada · nueva y editar · alta
- **Se ve:** el campo vacío "Fecha de fin" muestra el texto «undefined/undefined/» (`programada__editar__telefono-claro.png`, `programada__nueva__telefono-claro.png`).
- **Debería:** campo vacío con marcador de formato `dd/mm/aaaa`.
- **Arreglo:** el componente de fecha del formulario (`flujos/programadas-nueva/formulario.tsx`, campo `fechaFin`) formatea un valor vacío; devolver cadena vacía.
- **Cómo verificar:** sin la palabra «undefined» en ninguna pantalla.

#### MAS-113 · Monto y Tolerancia sin prefijos — Programada · nueva y editar · media
- **Se ve:** campos sin "$" ni "±$", con la ayuda "Se entiende como $15.49" debajo.
- **Debería:** "$ 15.49" y "±$ 2.00" con prefijo dentro del campo, sin ayuda (`editar__telefono-claro.png`).
- **Arreglo:** campo de monto con prefijo (el de Condonar/Cobrar ya lo hace, ver `por-cobrar__condonar`).
- **Cómo verificar:** prefijos visibles.

#### MAS-114 · «Solo lectura» resuelto con campos deshabilitados — Programada · editar · media
- **Se ve:** Frecuencia deshabilitada (gris) y Primera fecha deshabilitada; el aviso es azul `informacion` y dice "Terminala y creá otra con el calendario nuevo".
- **Debería:** rótulo "Solo lectura" a la derecha de la etiqueta, campo de borde punteado, y debajo un aviso neutro (ícono de círculo punteado): "La primera fecha y la frecuencia no se pueden cambiar porque ya hay pagos registrados con esta programada." (`editar__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-programada/lector.tsx` y `formulario.tsx`; usar `AvisoEnLinea` neutro.
- **Cómo verificar:** coincide con la referencia.

#### MAS-115 · «Registrar sola» con casilla nativa — Programada · nueva y editar · media
- **Se ve:** casilla cuadrada de 48 px (`programada__editar__telefono-claro.png`).
- **Debería:** interruptor de K2 (`casilla-interruptor-opciones`), como en la referencia.
- **Arreglo:** `formulario.tsx:308-319` con el componente interruptor.
- **Cómo verificar:** interruptor de 44 de alto.

#### MAS-116 · Guardar fuera del pie fijo y botón «Desactivar» de más — Programada · editar · media
- **Se ve:** Guardar en la columna, seguido de «Desactivar» tonal.
- **Debería:** pie fijo (12 16 26, línea superior) con solo Guardar (`editar__telefono-claro.png`; PANTALLAS §3.1).
- **Arreglo:** `PaginaFlujo` con `acciones`; mover «Desactivar» a la lista (ver MAS-105).
- **Cómo verificar:** el pie queda fijo al desplazar.

#### MAS-118 · Select nativo con flecha gruesa — Programada y Regla · nueva · media (transversal)
- **Consolidado en:** GLO-33 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** en Cuenta, Categoría y Frecuencia el desplegable es distinto en cada pantalla; en Reglas (`regla__nueva`) y Ciclo se ve el chevron nativo grueso, no el `chev` del juego.
- **Debería:** selección rellena con `chev` fino (PANTALLAS §2.2).
- **Arreglo:** componente `componentes/base/seleccion` / el `<select>` de `flujos/ajustes-ciclo/panel.tsx:126` y de `reglas-nueva`.
- **Cómo verificar:** mismo chevron en todos los selects.

#### MAS-119 · Hoja de ocurrencia sin «Atrasada 3 días» ni «Programada» — Programada · ocurrencia · media
- **Se ve:** título "NETFLIX · 17 OCT 2026" y filas Fecha esperada, Cuenta, Categoría, sin tarjeta (`programada__ocurrencia__telefono-claro.png`).
- **Debería:** título "LUZ Y AGUA · 12/10", subtítulo "Atrasada 3 días", y las cuatro filas (Programada, Fecha esperada, Cuenta, Categoría) dentro de una tarjeta con elevación (`ocurrencia__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-ocurrencias-fecha-esperada/formulario.tsx`; título con `dd/mm`; subtítulo con los días de atraso que trae el DTO.
- **Cómo verificar:** coincide con la referencia.

#### MAS-120 · Tocables de acción menores de 44 — Programada · ocurrencia · media
- **Se ve:** «Registrar» 70.5 × 17 y «Ver transacción» 120 × 18 (`analisis/programada__ocurrencia.md`, `…__resuelta.md`).
- **Debería:** 44 × 44 mínimo (DECISIONES regla 6).
- **Arreglo:** `AvisoEnLinea` (`componentes/base/aviso.tsx`): acción con `min-h-11` y `min-w-11`.
- **Cómo verificar:** `tocables < 44` vacío en el análisis.

#### MAS-121 · La ocurrencia, en URL directa, es una página y no la hoja — Programada · ocurrencia-pagina y resuelta · baja
- **Se ve:** `programada__ocurrencia-pagina` y `…-resuelta` abren como página completa con X, sin fondo de Programadas.
- **Debería:** la referencia muestra siempre una hoja sobre la lista.
- **Arreglo:** se acepta (05 §1.4 lo prevé para URL directa); solo documentar.
- **Cómo verificar:** —

#### MAS-122 · Ocurrencia resuelta sin la fila «Monto» — Programada · ocurrencia-resuelta · media
- **Se ve:** Fecha esperada y Cuenta (`programada__ocurrencia-resuelta__telefono-claro.png`).
- **Debería:** Fecha, Monto ($58.40) y Cuenta (`ocurrencia-resuelta__telefono-claro.png`).
- **Arreglo:** `…/resuelta.tsx`: agregar la fila Monto con tabular-nums.
- **Cómo verificar:** la fila existe.

#### MAS-123 · Tarjeta de totales «Te deben / En camino» que el diseño no tiene — Por cobrar · lista · media
- **Se ve:** tarjeta con "TE DEBEN $65.00 · EN CAMINO $55.00" sobre el aviso (`por-cobrar__lista__telefono-claro.png`).
- **Debería:** solo el aviso "En camino" arriba (`lista__telefono-claro.png`).
- **Arreglo:** `(finn)/por-cobrar/pantalla.tsx` (`data-total-abierto`, `data-en-camino`): retirar o proponer CH.
- **Cómo verificar:** primera pieza es el aviso.

#### MAS-124 · Aviso «En camino» genérico — Por cobrar · lista · media
- **Se ve:** "Pagaste con débito por otras personas: Listo para asignar está más bajo por ese monto hasta que te paguen."
- **Debería:** "Carlos te debe $40.00. Como pagaste con débito, Listo para asignar está $20.00 más bajo hasta que te pague."
- **Arreglo:** `textos/por-cobrar.ts` y su uso en `pantalla.tsx`: con nombre del deudor y los dos montos.
- **Cómo verificar:** texto con deudor y montos.

#### MAS-125 · Todos los deudores expandidos — Por cobrar · lista · media
- **Se ve:** Ana y Carlos con todas sus partidas abiertas (`por-cobrar__lista__telefono-claro.png`); orden alfabético.
- **Debería:** el deudor con más deuda expandido; los demás como fila resumen "Te debe $15.00 · desde el 02/10" con `chevR` (`lista__telefono-claro.png`).
- **Arreglo:** `pantalla.tsx`: orden por monto abierto descendente, deudores secundarios como enlace.
- **Cómo verificar:** coincide.

#### MAS-126 · Línea de la partida y «Ver los cerrados» distintos — Por cobrar · lista · media
- **Se ve:** "02/10/2026 · Débito", insignia «Abierto/Parcial» aparte, «Compartido $…» y «Cobrado…»; «Ver los cerrados» es un interruptor (`por-cobrar__lista__telefono-claro.png`).
- **Debería:** una línea "15/10 · Visa Oro · cobrado $10.00 · abierto" y «Ver los cerrados» como enlace (`lista__telefono-claro.png`).
- **Arreglo:** `FilaPartida` en `pantalla.tsx:47-90` y `InterruptorEnlace` de `pantalla.tsx:171`.
- **Cómo verificar:** coincide.

#### MAS-127 · Fecha larga en lugar de dd/mm — Por cobrar · lista · baja
- **Se ve:** "02/10/2026", "desde el 06/10/2026".
- **Debería:** "desde el 02/10".
- **Arreglo:** `formatearFecha` en `pantalla.tsx`.
- **Cómo verificar:** sin año.

#### MAS-128 · Cobrar y Renombrar son páginas completas, no hojas — Por cobrar · cobrar y renombrar · alta
- **Consolidado en:** GLO-23 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `por-cobrar__cobrar__telefono-claro.png` y `…renombrar…`: página con X, sin la lista detrás; Condonar sí es hoja.
- **Debería:** flujo corto como hoja sobre Por cobrar, con Cancelar (`cobrar__telefono-claro.png`, `renombrar-repetido__telefono-claro.png`).
- **Arreglo:** crear `(finn)/@superpuesto/(.)por-cobrar/cobrar/page.tsx` y `(.)por-cobrar/deudores/[deudorId]/renombrar/page.tsx` como el de condonar; Renombrar necesita botón Cancelar.
- **Cómo verificar:** al tocar «Cobrar» aparece la hoja sobre la lista.

#### MAS-129 · Casilla «Reservar» de 48 px sólida — Por cobrar · cobrar · baja
- **Se ve:** cuadro azul de 48 px con check blanco grande, y línea extra "Saldo $1,264.60" bajo la cuenta.
- **Debería:** casilla redonda de 44 con check en círculo (K2); sin línea de saldo.
- **Arreglo:** `flujos/por-cobrar-cobrar/casilla-reservar.tsx`.
- **Cómo verificar:** coincide.

#### MAS-129b · «Nueva regla» es página de flujo y no hoja con Cancelar — Reglas · nueva y nueva-repetida · alta
- **Consolidado en:** GLO-23 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `regla__nueva__telefono-claro.png`: página con X y un solo botón «Guardar regla».
- **Debería:** hoja inferior sobre Reglas, con "Cancelar" (tonal) y "Guardar regla" (`nueva__telefono-claro.png`).
- **Arreglo:** crear `@superpuesto/(.)reglas/nueva/page.tsx` y `(.)reglas/[reglaId]`; agregar Cancelar a `flujos/reglas-nueva/formulario.tsx`.
- **Cómo verificar:** hoja sobre la lista y Cancelar la cierra.

#### MAS-130 · Texto del error de patrón repetido — Reglas · nueva-repetida · baja
- **Se ve:** "Ya hay una regla para PUMA."
- **Debería:** "Ya hay una regla con este patrón."
- **Arreglo:** el mensaje que trae el servidor (`patron_repetido`) o `textos/reglas.ts`.
- **Cómo verificar:** coincide.

#### MAS-131 · Lista de reglas: buscador y contador — Reglas · lista · baja
- **Se ve:** marcador "Comercio o categoría", flecha larga "→" como texto, sin "usada N veces", orden alfabético (`reglas__lista__telefono-claro.png`).
- **Debería:** "Buscá un comercio", flecha del juego de íconos, "· usada 9 veces" y orden por uso (`lista__telefono-claro.png`).
- **Arreglo:** `textos/reglas.ts` (`buscarMarcador`, `hacia`) y `reglas/pantalla.tsx`; el conteo requiere el DTO (decisión de producto: confirmar si existe).
- **Cómo verificar:** textos iguales.

#### MAS-133 · Falta «Coincide con: …» en Nueva regla — Reglas · nueva · media
- **Se ve:** sin vista previa de comercios.
- **Debería:** "Coincide con: SUPER SELECTOS ESCALON, SUPER SELECTOS SANTA ELENA." bajo la categoría (`nueva__telefono-claro.png`).
- **Arreglo:** `flujos/reglas-nueva/formulario.tsx` con la lista de comercios del DTO.
- **Cómo verificar:** aparece al escribir un patrón con coincidencias.

#### MAS-134 · Notificaciones lleva la barra de pestaña — Notificaciones · todas · alta
- **Consolidado en:** GLO-24 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** Registrar + campana + ☰ (`notificaciones__lista__telefono-claro.png`, `…__vacia`).
- **Debería:** pantallas de Más secciones llevan solo la campana (DECISIONES, marco).
- **Arreglo:** `(finn)/notificaciones/pantalla.tsx` y la configuración del marco: tratar `/notificaciones` como Más secciones.
- **Cómo verificar:** solo la campana arriba.

#### MAS-135 · Fechas absolutas y títulos partidos — Notificaciones · lista · media
- **Se ve:** "15/10/2026 08:00" junto al título, que se parte en 2 y 3 líneas.
- **Debería:** "Hace 2 h", "Hoy 8:00", "Ayer", "13/10" en una columna estrecha, título en una o dos líneas (`lista__telefono-claro.png`).
- **Arreglo:** `notificaciones/contenido.tsx` con formateo relativo.
- **Cómo verificar:** coincide.

#### MAS-136 · Filtro y «Marcar todo como leído» mal ubicados — Notificaciones · lista · media
- **Se ve:** el filtro tonal con sombra y "Marcar todo como leído" en otra fila debajo.
- **Debería:** filtro Todas / Sin leer · 2 con borde y "Marcar todo como leído" a la derecha, en la misma fila.
- **Arreglo:** `contenido.tsx` y `marcar-todo.tsx`.
- **Cómo verificar:** misma fila.

#### MAS-137 · Dos tarjetas por grupo — Notificaciones · lista · baja
- **Se ve:** "Nuevas" y "Anteriores" en tarjetas separadas.
- **Debería:** una tarjeta continua, con los grupos como en el panel (PANTALLAS §2.17) pero sin rótulos en la página (`lista__telefono-claro.png`).
- **Arreglo:** `contenido.tsx`.
- **Cómo verificar:** —

#### MAS-138 · Pie y vacía con caja de información — Notificaciones · lista y vacía · baja
- **Se ve:** caja `superficie-hundida` con 3 frases y "180 días".
- **Debería:** línea simple "Se guardan las notificaciones de los últimos 90 días." (lista) y sin caja en la vacía.
- **Arreglo:** `textos/notificaciones.ts` (`retencion`) y `contenido.tsx`. Verificar si 90 o 180 manda (04 §11).
- **Cómo verificar:** coincide.

## AJU · Ajustes

#### AJU-01 · Las filas del índice no traen resumen — Ajustes · índice · alta
- **Se ve:** una sola línea por fila (`ajustes__indice__telefono-claro.png`).
- **Debería:** nombre y resumen ("Empieza el día 21", "Conectado · último SMS hoy 12:41", "7 activos", "4", "Activas en este dispositivo", "2 factores · 1 sesión", "JSON y CSV", "Sin errores en 7 días", "Según el sistema") (`ajustes-indice__telefono-claro.png`).
- **Arreglo:** `ajustes/lista-ajustes.tsx` y la consulta `consultas/ajustes` (traer los resúmenes).
- **Cómo verificar:** cada fila con su resumen.

#### AJU-02 · «Salir» ausente en el índice — Ajustes · índice · alta
- **Consolidado en:** GLO-21 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** no hay tarjeta Salir; en Seguridad sigue el enlace (`ajustes-seguridad__un-factor`).
- **Debería:** tarjeta Salir con "{correo} · en este dispositivo" bajo la lista (entrega-3 `ajustes-indice`).
- **Arreglo:** ya reportado como GLO-103 y GLO-104.
- **Cómo verificar:** ver GLO-103.

#### AJU-03 · Títulos e íconos del índice — Ajustes · índice · baja
- **Se ve:** "Ciclo de los períodos" y "Exportar tus datos"; Diagnóstico con `activity`; Apariencia con el dibujo de `gear` (sol).
- **Debería:** "Ciclo", "Exportar", Diagnóstico con `info`, Apariencia con `sun` (entrega-3 `ajustes-indice`).
- **Arreglo:** `textos/ajustes-ciclo.ts`, `ajustes-exportar.ts`, `lista-ajustes.tsx:19-28`; el ícono es GLO-107.
- **Cómo verificar:** coincide.

#### AJU-04 · «Respaldo atrasado» como texto de problema — Ajustes · índice · media
- **Se ve:** texto naranja bajo el título (`ajustes__indice-respaldo-atrasado__telefono-claro.png`; 14 px, `problema-texto`).
- **Debería:** insignia de advertencia (triángulo, `advertencia-fondo`, 13 px) a la derecha de la fila; es un aviso de advertencia, no de problema (entrega-3 `ajustes-indice`).
- **Arreglo:** `lista-ajustes.tsx:57-61`.
- **Cómo verificar:** insignia con triángulo y token `advertencia`.

#### AJU-05 · Contenido a 624 px en computadora — Ajustes · índice · baja
- **Se ve:** `ajustes__indice__computadora-claro.png`: 624 px; la fila "Ajustes" de la barra está activa (bien).
- **Debería:** 720 px aproximados y sin campana pegada al borde (entrega-3 `ajustes-indice__computadora-claro.png`).
- **Arreglo:** `ajustes/page.tsx:18` (`max-w-xl`); ver MAS-107.
- **Cómo verificar:** el ancho coincide.

#### AJU-06 · Las subpáginas de Ajustes son «flujo»: X, sin campana y sin barra inferior — Ajustes · ciclo, conectar SMS, formatos, instituciones, exportar, respaldo, diagnóstico, apariencia · teléfono y computadora · alta
- **Consolidado en:** GLO-24 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** "Cerrar (X)" y sin barra inferior ni campana (`ajustes-ciclo__principal`, `ajustes-formatos__lista`, `ajustes-exportar__principal`, `ajustes-respaldo__atrasado`, `ajustes-diagnostico__con-referencia`, `ajustes-apariencia__sistema`, `ajustes-conectar-sms__sin-token`, `ajustes-instituciones__lista`). En computadora, X junto al título sin "← Ajustes". Solo Seguridad y Notificaciones de Ajustes sí llevan flecha + campana + barra.
- **Debería:** pantalla hija: flecha "Volver a Ajustes" + campana + barra inferior; en computadora, enlace "← Ajustes" sobre el título (entrega-3 DECISIONES «Campana en Ajustes»; `formatos__computadora-claro.png`).
- **Arreglo:** estas rutas usan `PaginaFlujoDeRuta` (`componentes/navegacion/flujo-de-ruta.tsx`, `componentes/marco/pagina-flujo.tsx`, oculta barras con `data-pagina-flujo`); cambiar a la plantilla de pantalla hija usada por `ajustes/seguridad`.
- **Cómo verificar:** en cada subpágina la barra superior tiene flecha y campana y se ve la barra inferior.

#### AJU-07 · Ciclo: aviso detrás de un botón — Ajustes · ciclo · media
- **Se ve:** al elegir el día no pasa nada hasta tocar «Ver el cambio»; select nativo (`ajustes-ciclo__aviso`).
- **Debería:** el aviso "Antes de confirmar" aparece al elegir el día, bajo el campo (`ciclo__telefono-claro.png`).
- **Arreglo:** `flujos/ajustes-ciclo/panel.tsx`: mostrar el aviso al cambiar el select; el botón sigue siendo «Cambiar el ciclo».
- **Cómo verificar:** el aviso aparece sin tocar nada más.

#### AJU-08 · Conectar los SMS: sin tarjeta y con la guía de MacroDroid — Ajustes · conectar SMS · media
- **Se ve:** `ajustes-conectar-sms__token-generado__telefono-claro.png`: sin tarjeta, "Copiar" sin ícono, y debajo una guía de 14 filas de MacroDroid.
- **Debería:** aviso de estado ("Conectado. El último SMS llegó…"), tarjeta "TOKEN DE MACRODROID" con el token y "Copiar" con ícono, "Se muestra completo una sola vez, al generarlo." y "Generar un token nuevo" con ícono (`conectar-sms__telefono-claro.png`).
- **Arreglo:** `ajustes/webhook/page.tsx` y `flujos/ajustes-webhook`; la guía sobra o va en un detalle desplegable (decisión de producto).
- **Cómo verificar:** coincide.

#### AJU-09 · URL partida a mitad de palabra — Ajustes · conectar SMS · baja
- **Se ve:** "http://localhost:3100/api/sm|s" (corte en medio).
- **Debería:** la URL en una línea o cortada por segmento.
- **Arreglo:** `overflow-wrap:anywhere` → `break-all` solo en el token; la URL con `break-word` por `/`.
- **Cómo verificar:** sin corte de palabras.

#### AJU-10 · Formatos: sin chevron, sin «+» y «Inactivo» solo como texto — Ajustes · formatos · media
- **Se ve:** `ajustes-formatos__lista__telefono-claro.png`: filas sin `chevR`, "Nuevo formato" sin `+`, un párrafo introductorio de más, "Inactivo" en el subtítulo, «Instituciones» subrayado.
- **Debería:** `chevR`, `+ Nuevo formato`, "Inactivo" con indicador (círculo + texto), enlace «Instituciones» sin subrayar (`formatos__telefono-claro.png`).
- **Arreglo:** `ajustes/formatos/lista.tsx`.
- **Cómo verificar:** coincide.

#### AJU-11 · Instituciones: enlace subrayado a Formatos — Ajustes · instituciones · baja
- **Se ve:** «Formatos bancarios» subrayado, filas sin chevron (`ajustes-instituciones__lista`).
- **Debería:** enlace de acción sin subrayar (`formatos__telefono-claro.png`).
- **Arreglo:** `ajustes/instituciones/lista.tsx`.
- **Cómo verificar:** coincide.

#### AJU-12 · Notificaciones: sin interruptor, sin tarjetas y con el agente crudo — Ajustes · notificaciones · concedido · alta
- **Se ve:** texto suelto "Las notificaciones están activas…"; el dispositivo se llama «Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 …» (cuatro líneas), con «Quitar» tonal (`ajustes-notificaciones__concedido__telefono-claro.png`).
- **Debería:** tarjeta con interruptor "Notificaciones en este dispositivo" y "Permiso del navegador: concedido."; lista "Dispositivos" en tarjeta con "Este teléfono · Activado el 03/10"; «Quitar» como texto de peligro; nota "Si el permiso está denegado…" (`notificaciones__telefono-claro.png`).
- **Arreglo:** `ajustes/notificaciones/panel.tsx:133` (nombre legible a partir del agente), `textos/notificaciones.ts`.
- **Cómo verificar:** coincide, nombre legible.

#### AJU-13 · Seguridad sin las sesiones en tarjeta limpia — Ajustes · seguridad · baja
- **Se ve:** «Este dispositivo» con ícono de persona.
- **Debería:** fila sin ícono (`seguridad__telefono-claro.png` de entrega-3).
- **Arreglo:** `ajustes/seguridad/sesiones.tsx`.
- **Cómo verificar:** coincide.

#### AJU-14 · Un solo factor sin aviso de advertencia — Ajustes · seguridad · un factor · alta
- **Se ve:** `ajustes-seguridad__un-factor__telefono-claro.png`: factor, botón «Agregar un factor de respaldo», sin aviso.
- **Debería:** aviso de advertencia (`--advertencia-fondo`, triángulo) "Agregá otro factor antes de quitar este." debajo del factor, antes del botón tonal (DECISIONES «Un solo factor»; `entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`).
- **Arreglo:** `ajustes/seguridad/lista-factores.tsx`: con un factor verificado, `AvisoEnLinea estado="advertencia"` (con `role="status"`).
- **Cómo verificar:** con un factor el aviso aparece con triángulo y token `advertencia`.

#### AJU-15 · «Quitar» con un factor abre la pantalla «Quitar un factor» — Ajustes · seguridad · un factor · crítica
- **Se ve:** al tocar «Quitar» navega a `/ajustes/seguridad/factores/[id]/quitar` con X (`ajustes-seguridad__quitar-un-factor__telefono-claro.png`).
- **Debería:** DECISIONES: «No hay pantalla "Quitar un factor"»; con un solo factor «Quitar» no abre nada (el aviso lo explica).
- **Arreglo:** `lista-factores.tsx:56-62`: con un factor, «Quitar» no es enlace (deshabilitado con `aria-disabled`, o ausente); `flujos/ajustes-seguridad-factores-quitar/lector.tsx` redirige a Seguridad si hay un solo factor.
- **Cómo verificar:** con un factor no existe la ruta navegable desde la lista.

#### AJU-16 · «Agregar un factor de respaldo» sin ícono — Ajustes · seguridad · baja
- **Se ve:** botón tonal sin glifo (`ajustes-seguridad__un-factor`, `…__dos-factores`).
- **Debería:** `+ Agregar un factor de respaldo` (referencia entrega-3).
- **Arreglo:** `lista-factores.tsx:70-76`, `Icono plus`.
- **Cómo verificar:** ícono visible.

#### AJU-17 · Agregar factor: campo único, sin márgenes y con barras de pestaña — Ajustes · agregar factor · alta
- **Consolidado en:** GLO-20 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** `ajustes-seguridad__agregar-factor__telefono-claro.png`: el texto, el secreto, el campo «Código» y el botón llegan a x = 0 (sin 20 px laterales); título cortado ("AGREGÁ UN FACTOR DE RESP…"); campana y barra inferior presentes en un flujo que termina en Confirmar; el código es un campo único.
- **Debería:** 20 px de margen; flujo sin campana ni barra inferior (DECISIONES, marco); 6 casillas de 44 × 52 (DECISIONES «Código de verificación»).
- **Arreglo:** `flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx` (contenedor sin `px-5`), pasar a `PaginaFlujo`, usar el componente de 6 casillas del acceso; título más corto (`textos/seguridad.ts`).
- **Cómo verificar:** margen 20, sin barras, 6 casillas.

#### AJU-18 · Sesiones: «Salir» como enlace — Ajustes · seguridad · alta (citado)
- **Consolidado en:** GLO-26 (se arregla allí; este id queda como pantalla afectada).
- **Se ve:** «Salir» como enlace en el pie de Seguridad.
- **Debería:** fuera de Seguridad (entrega 3).
- **Arreglo:** GLO-103.
- **Cómo verificar:** ver GLO-103.

#### AJU-19 · Exportar: estructura distinta — Ajustes · exportar · media
- **Se ve:** dos secciones con título grande, párrafos y botón tonal de ancho completo, y una nota final (`ajustes-exportar__principal__telefono-claro.png`).
- **Debería:** tarjeta de dos filas con ícono, "Todo en JSON" / "Transacciones en CSV", subtítulo y «Descargar» tonal compacto a la derecha (`exportar__telefono-claro.png`).
- **Arreglo:** `ajustes/exportar/page.tsx` y `descargas.tsx`.
- **Cómo verificar:** coincide.

#### AJU-20 · Respaldo: atraso como texto y sin tarjeta — Ajustes · respaldo · alta
- **Se ve:** "Atrasado. Pasaron más de 36 horas…" en texto naranja bajo el título; sin la fila «Lo hace» (`ajustes-respaldo__atrasado__telefono-claro.png`).
- **Debería:** aviso de advertencia "Respaldo atrasado" y tarjeta de tres filas: Último respaldo, Última prueba de restauración, Lo hace: GitHub Actions, cada noche (`respaldo__telefono-claro.png`).
- **Arreglo:** `ajustes/respaldo/page.tsx`, `AvisoEnLinea estado="advertencia"`.
- **Cómo verificar:** coincide.

#### AJU-21 · Diagnóstico: eventos como texto y sin severidad — Ajustes · diagnóstico · media
- **Se ve:** "Aviso · respaldo · 17/10/2026 00:00 / token_invalido" en texto, sin indicador (`ajustes-diagnostico__con-referencia__telefono-claro.png`); el buscador lleva «Opcional» y no tiene ícono.
- **Debería:** buscador con lupa, filas con referencia, hora y origen, e indicador «Error» / «Correcta» (tres señales) y botón «Ejecutar tareas ahora» con ícono (`diagnostico__telefono-claro.png`).
- **Arreglo:** `ajustes/diagnostico/panel.tsx`.
- **Cómo verificar:** cada evento con indicador de estado.

#### AJU-22 · Apariencia: orden, rótulos y tarjetas — Ajustes · apariencia · media
- **Se ve:** "Tema", Sistema / Claro / Oscuro en tarjetas separadas, texto "En otro dispositivo podés elegir uno distinto." (`ajustes-apariencia__oscuro__telefono-claro.png`).
- **Debería:** una tarjeta con Claro, Oscuro, Según el sistema (en ese orden) y "Se guarda en este dispositivo." (`apariencia__telefono-oscuro.png`).
- **Arreglo:** `ajustes/apariencia/panel.tsx` y `textos/ajustes-apariencia.ts`.
- **Cómo verificar:** coincide.

#### AJU-23 · Quitar un factor (con 2): sin Cancelar ni resultado — Ajustes · quitar factor · baja
- **Se ve:** "¿Quitar Respaldo? Con ese factor ya no vas a poder ingresar." y un botón rojo «Quitar» (`ajustes-seguridad__quitar-factor`).
- **Debería:** sin diseño (FALTANTES factor-quitar); como mínimo con Cancelar y el resultado en el lugar.
- **Arreglo:** `flujos/ajustes-seguridad-factores-quitar/formulario.tsx`, a la espera del diseño.
- **Cómo verificar:** con el diseño aprobado.

#### AJU-24 · Apariencia: botones sin nombre accesible — Ajustes · apariencia · media
- **Se ve:** el análisis marca 3 botones sin nombre (`analisis/ajustes-apariencia__claro.md`).
- **Debería:** cada opción con su nombre accesible.
- **Arreglo:** `componentes/base/seleccion.tsx` (el radio personalizado).
- **Cómo verificar:** el análisis no lista tocables sin nombre.

#### AJU-30 · Bloques de Seguridad a 10 px en vez de 24 — Seguridad · un factor, dos factores, inscripción sin terminar · teléfono y computadora · media
- **Se ve:** `capturas/ajustes-seguridad__dos-factores__telefono-claro.png`: la tarjeta de factores termina en y=249 y «Agregar un factor de respaldo» empieza en y=259 (10 px); la tarjeta de sesiones y «Cerrar las otras sesiones» también a 10 px. En computadora (`…__computadora-claro.png`) lo mismo: 10 px entre tarjeta y botón.
- **Debería:** `02-referencias/entrega-2/pantallas/11-ajustes/seguridad__telefono-claro.html`: contenedor `display:flex; flex-direction:column; gap:24px; padding:4px 20px 0`, y 10 px solo entre el rótulo de sección y su tarjeta. En el PNG la tarjeta termina en y=305 y el botón empieza en y=329 (24 px); igual en `seguridad__computadora-claro.png` (339 → 363) y en el estado de un factor (`entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`).
- **Arreglo:** en `apps/web/src/app/(finn)/ajustes/seguridad/page.tsx`, `lista-factores.tsx` y `sesiones.tsx`, separar tarjeta y botón con el token de espacio de 24 px del juego (no valores sueltos).
- **Cómo verificar:** en las medidas, la distancia entre el borde inferior de cada tarjeta y el botón siguiente es 24 ± 2 px.

#### AJU-31 · «Quitar» de Seguridad a 24 px del borde de la tarjeta, no a 16 — Seguridad · todas · teléfono y computadora · baja
- **Se ve:** `ajustes-seguridad__dos-factores__telefono-claro.png`: el texto «Quitar» termina en x=346 con la tarjeta hasta x=370 (24 px). En computadora termina en 896 con la tarjeta en 920.
- **Debería:** `seguridad__telefono-claro.png` y `seguridad__computadora-claro.png`: «Quitar» a 16 px del borde (padding 12 16 de la fila; el tocable de 44 de alto crece hacia dentro, no hacia afuera).
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/seguridad/lista-factores.tsx:56-62`: quitar el relleno horizontal extra del enlace «Quitar» (que el área de 44 use alto, no margen).
- **Cómo verificar:** `medidas/ajustes-seguridad__dos-factores__telefono-claro.json`: x + ancho del texto «Quitar» = ancho de tarjeta − 16.

#### AJU-32 · Seguridad y Notificaciones de Ajustes, en computadora, sin «← Ajustes» — Seguridad y Notificaciones · computadora · alta
- **Se ve:** `capturas/ajustes-seguridad__dos-factores__computadora-claro.png` y `ajustes-notificaciones__concedido__computadora-claro.png`: el título va solo a la izquierda, sin enlace de regreso (`analisis/…`: `volver=""`). En teléfono sí hay flecha «Volver a Ajustes» (`volver="Volver a Ajustes"`).
- **Debería:** `…/11-ajustes/seguridad__computadora-claro.png` y `notificaciones__computadora-claro.png`: enlace «← Ajustes» (14 px, gris) encima del título, más campana a la derecha. DECISIONES «Marco»: pantalla hija = flecha/enlace «Volver a <padre>».
- **Arreglo:** el marco de pantalla hija en computadora (`apps/web/src/componentes/marco/marco.tsx`, `componentes/navegacion/volver-en-titulo.tsx`) debe mostrar el enlace sobre el título; vale también para las demás subpáginas cuando AJU-06 las pase a pantalla hija.
- **Cómo verificar:** a 1440 px el analizador marca `volver="Volver a Ajustes"` en Seguridad y Notificaciones.

#### AJU-33 · «Quitar» con un factor: aviso de problema y enlaces subrayados — Seguridad · quitar-un-factor · teléfono · media
- **Se ve:** `capturas/ajustes-seguridad__quitar-un-factor__telefono-claro.png`: la frase «Agregá otro factor antes de quitar este.» va en aviso de problema (fondo `--problema-fondo`, octógono con raya), y debajo dos enlaces subrayados «Agregar un factor de respaldo» y «Volver a Seguridad».
- **Debería:** la misma frase es un aviso de **advertencia** (`--advertencia-fondo`, triángulo) en `entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`; las acciones son botones tonales. Regla 2 de DECISIONES: no es un error, es un impedimento previo.
- **Arreglo:** AJU-15 hace desaparecer esta pantalla; mientras exista, `flujos/ajustes-seguridad-factores-quitar/` debe usar `AvisoEnLinea estado="advertencia"` y `Boton` tonal. El mismo aviso, con advertencia, es el de AJU-14.
- **Cómo verificar:** el aviso lleva tokens `advertencia` y triángulo; ningún enlace subrayado de acción.

#### AJU-34 · Diagnóstico: otro orden y bloques que el diseño no tiene — Diagnóstico · todas · teléfono y computadora · media
- **Se ve:** `capturas/ajustes-diagnostico__con-referencia__telefono-claro.png`: intro «Los últimos eventos del sistema…», sección «TAREAS DEL DÍA» con texto y el botón «Ejecutar tareas ahora» arriba, luego «ÚLTIMOS EVENTOS», buscador con etiqueta y ayuda «Pegá la referencia que te mostró el error.» y los eventos al final.
- **Debería:** `…/11-ajustes/diagnostico__telefono-claro.png`: primero el buscador (con lupa, sin etiqueta, sin ayuda), después el resultado de la búsqueda, «ÚLTIMOS EVENTOS» en una tarjeta y «Ejecutar tareas ahora» tonal con ícono **al final**; sin intro ni sección «Tareas del día».
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/diagnostico/panel.tsx` y `apps/web/src/textos/` de diagnóstico: reordenar buscador, eventos y botón; quitar intro, «Tareas del día» y la ayuda, o llevarlos a CH. (AJU-21 cubre lupa, «Opcional» e indicador; no el orden.)
- **Cómo verificar:** el orden en la captura coincide con la referencia y no quedan los textos sobrantes.

#### AJU-35 · Diagnóstico: el evento muestra el código interno y fecha absoluta — Diagnóstico · con-referencia · teléfono y computadora · media
- **Se ve:** `ajustes-diagnostico__con-referencia__telefono-claro.png`: «Aviso · respaldo · 17/10/2026 00:00» y `token_invalido` (identificador interno, snake_case), sin tarjeta.
- **Debería:** `diagnostico__telefono-claro.png`: título legible («Error al procesar SMS», «Tarea diaria»), subtítulo «BDJ-4K2Q · ayer 21:40 · Banco Agrícola» / «Hoy 00:12 · 2 programadas registradas» en 14 px secundario, dentro de una tarjeta de filas.
- **Arreglo:** `ajustes/diagnostico/panel.tsx` y la consulta de eventos: textos legibles por tipo de evento (en `apps/web/src/textos/`), fecha relativa como en el resto de la app; nunca mostrar el código crudo.
- **Cómo verificar:** ningún texto con guion bajo visible; cada evento con título en español y hora relativa.

#### AJU-36 · Diagnóstico: el botón de limpiar el buscador es una «✕» de texto — Diagnóstico · sin-resultados · teléfono · baja
- **Se ve:** `ajustes-diagnostico__sin-resultados__telefono-claro.png`: «✕» pesada azul a la derecha del campo.
- **Debería:** ícono `x` del juego (trazo de 1.5, gris) como en `diagnostico__telefono-claro.png` (la «×» de la derecha).
- **Arreglo:** `ajustes/diagnostico/panel.tsx`: usar `Icono x` dentro de un botón de 44 × 44 con etiqueta «Limpiar búsqueda».
- **Cómo verificar:** mismo ícono y color que en la referencia; tocable ≥ 44.

#### AJU-37 · Notificaciones de Ajustes: la fila del dispositivo no sigue el patrón — Notificaciones · concedido · teléfono y computadora · baja
- **Se ve:** `ajustes-notificaciones__concedido__telefono-claro.png`: sin disco con campana; segunda línea «Renovada el 15/10/2026 10:00» y «· Este dispositivo» pegado al nombre.
- **Debería:** `…/11-ajustes/notificaciones__telefono-claro.png`: disco de 40 con ícono `bell`, título en 600 y «Activado el 03/10» (dd/mm, sin hora ni año); «Este teléfono» como nombre. AJU-12 pide la lista en tarjeta pero no el ícono ni el formato de fecha.
- **Arreglo:** `ajustes/notificaciones/panel.tsx` y `textos/notificaciones.ts`.
- **Cómo verificar:** cada dispositivo con ícono de campana y fecha `dd/mm`.

#### AJU-38 · Apariencia: la fila «Sistema» sin relleno y con un subtítulo que el diseño no tiene — Apariencia · sistema, claro, oscuro · todas · media
- **Se ve:** `ajustes-apariencia__sistema__telefono-claro.png`: las opciones son tarjetas de 44 px separadas 8 px; «Sistema» ocupa dos líneas (título + «Sigue el tema de tu dispositivo.») dentro de esos 44 px, con el texto pegado al borde superior e inferior (`medidas`: «Sistema» y=96 h=44, subtítulo y=120).
- **Debería:** `…/11-ajustes/apariencia__telefono-claro.png`: filas de 56 px con 22 px de radio de selección, sin subtítulo, en una sola tarjeta.
- **Arreglo:** `ajustes/apariencia/panel.tsx` y `textos/ajustes-apariencia.ts` (quitar el subtítulo; fila con `min-h` del juego y relleno vertical).
- **Cómo verificar:** filas de 56 px, texto centrado, una línea.

#### AJU-39 · Formatos (nuevo y detalle): casillas nativas del navegador — Formatos · nuevo y detalle · teléfono · media
- **Se ve:** `capturas/ajustes-formatos__nuevo__telefono-claro.png` y `…__detalle__…`: «Formatos de fecha» y «Activo» con casillas cuadradas de 44 px, azul puro del navegador (fuera de los tokens) y pegadas entre sí (4 px).
- **Debería:** casilla del juego (K2 `casilla-interruptor-opciones`): redonda de 44 con check en círculo y color `--accion`, 8 px de separación. No hay referencia de la pantalla (FALTANTES formato-nuevo); el componente sí.
- **Arreglo:** `ajustes/formatos/nuevo/page.tsx`, `formatos/[formatoId]/page.tsx` y el componente compartido de casilla (candidato global ya listado: casilla nativa).
- **Cómo verificar:** sin `accent-color` del navegador; colores de token; separación ≥ 8 px.

#### AJU-40 · Exportar: texto de introducción en gris secundario — Exportar · principal · baja
- **Se ve:** `ajustes-exportar__principal__telefono-claro.png`: «Descargá una copia de tus datos…» en `#474e58` (`texto-secundario`) y con otro texto.
- **Debería:** `exportar__telefono-claro.html`: el párrafo introductorio «Descargá tus transacciones y el presupuesto. El archivo se arma en el momento.» en `cuerpo-pequeno` con `var(--texto)`.
- **Arreglo:** `apps/web/src/textos/ajustes-exportar.ts` y `ajustes/exportar/page.tsx`.
- **Cómo verificar:** texto y color igual a la referencia.

#### V-02 · Ciclo: aviso en amarillo de advertencia con dos tarjetas — Ajustes · Ciclo (aviso) · telefono-claro · media
- **Se ve:** `capturas/ajustes-ciclo__aviso__telefono-claro.png`: el aviso de transición va en amarillo con triángulo (advertencia) y separado en dos tarjetas («Hoy empieza el día / Vigencia futura» y «Antes de confirmar»); AJU-07 solo cubre que el aviso está detrás del botón «Ver el cambio».
- **Debería:** `docs/diseno/02-referencias/entrega-3/pantallas/11-ajustes/ciclo__telefono-claro.png`: aviso informativo azul (`--informacion-fondo`, glifo `i`, título «Antes de confirmar») con el texto del período en la misma tarjeta; es información, no advertencia (regla 2: color, glifo y texto).
- **Arreglo:** en `apps/web/src/flujos/ajustes-ciclo/panel.tsx` usar `AvisoEnLinea estado="informacion"` (`apps/web/src/componentes/base/aviso.tsx`) con una sola tarjeta y el título «Antes de confirmar»; textos en `apps/web/src/textos/ajustes-ciclo.ts`.
- **Cómo verificar:** el aviso mide una sola caja con fondo `--informacion-fondo` y glifo `i`; el analizador no marca triángulo de advertencia en esta pantalla.
- **Sección:** AJU · **Fuente:** verificación independiente

#### V-03 · Notificaciones de Ajustes: título de sección largo — Ajustes · Notificaciones · telefono-claro · baja
- **Se ve:** `capturas/ajustes-notificaciones__concedido__telefono-claro.png`: sección «DISPOSITIVOS CON NOTIFICACIONES».
- **Debería:** `…/11-ajustes/notificaciones__telefono-claro.png`: «DISPOSITIVOS».
- **Arreglo:** el texto en `apps/web/src/textos/notificaciones.ts` y su uso en `apps/web/src/app/(finn)/ajustes/notificaciones/panel.tsx`.
- **Cómo verificar:** el rótulo de sección dice «Dispositivos».
- **Sección:** AJU · **Fuente:** verificación independiente

#### V-04 · Exportar: texto de advertencia final y espaciado del título — Ajustes · Exportar · telefono-claro · baja
- **Se ve:** `capturas/ajustes-exportar__principal__telefono-claro.png`: el título «EXPORTAR TUS DATOS» lleva la descripción a 12 px; abajo hay una nota «El archivo trae tus datos reales…» que la referencia no tiene. El texto de CSV dice «los negativos con guion» (`apps/web/src/textos/ajustes-exportar.ts:14`).
- **Debería:** `…/11-ajustes/exportar__telefono-claro.png`: descripción a 32 px del título y sin la nota final; DECISIONES regla 3 pide U+2212 en los montos que se muestran (el CSV puede seguir con guion ASCII para hojas de cálculo; decidir con diseño y quitar el texto o reformularlo).
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/exportar/page.tsx` (separación del título) y `apps/web/src/textos/ajustes-exportar.ts` (quitar la nota o dejarla como información en la tarjeta). El título corto «Exportar» ya lo cubre AJU-03.
- **Cómo verificar:** la separación título–descripción mide 32 px y no queda la nota final.
- **Sección:** AJU · **Fuente:** verificación independiente

#### V-05 · Respaldo: botón «Ver el diagnóstico» y párrafo que la referencia no tiene — Ajustes · Respaldo · telefono-claro · baja
- **Se ve:** `capturas/ajustes-respaldo__atrasado__telefono-claro.png`: botón tonal extra «Ver el diagnóstico» y un párrafo introductorio.
- **Debería:** `…/11-ajustes/respaldo__telefono-claro.png`: aviso, tarjeta de filas y nada más.
- **Arreglo:** quitar el botón y el párrafo en `apps/web/src/app/(finn)/ajustes/respaldo/page.tsx` y `apps/web/src/textos/ajustes-respaldo.ts`, o proponerlos como CH si el acceso al diagnóstico se quiere conservar.
- **Cómo verificar:** la pantalla solo tiene aviso, tarjeta y el pie de la referencia.
- **Sección:** AJU · **Fuente:** verificación independiente

#### Correcciones del repaso de Ajustes a hallazgos anteriores

- **AJU-06** (y la fila (c) de «Decisiones comprobadas»): dice que Seguridad y Notificaciones «sí llevan flecha + campana + barra». Es verdad solo en teléfono; en computadora no llevan «← Ajustes» (`analisis/ajustes-seguridad__dos-factores.md:7`, `ajustes-notificaciones__concedido.md:7`: `volver=""`). Cambiar a «solo en teléfono» y remitir a AJU-32.
- **AJU-05:** quitar «y sin campana pegada al borde»: en las dos imágenes la campana está en x≈1370 con el mismo círculo tonal; no hay diferencia. Queda solo el ancho (624 contra 720).
- **Inventario, `ajustes-seguridad__agregar-factor-codigo-malo`** (veredicto AJU-17): la captura solo tiene el código `000000` escrito; el caso (`tools/auditoria/casos/70-mas-aju.cap.ts:939-942`) hace `fill` y espera sin tocar «Confirmar», y no hay mensaje de error ni `role="alert"` (`medidas/…codigo-malo…json`: alert=0). No muestra el estado de error: pasar a «no capturado el error» y recapturar tocando «Confirmar». AJU-17 sigue valiendo para el resto.
- **GLO-31** (`secciones/01-glo-consolidado.md`): lista `ajustes-seguridad-factores-quitar` entre los destructivos con botón azul, pero `capturas/ajustes-seguridad__quitar-factor__telefono-claro.png` ya usa el rojo de peligro. Quitarlo de esa lista (AJU-23 sí lo dice bien).
- **AJU-08:** en el estado `token-generado` el aviso va en advertencia («Copiá este token ahora: no lo vas a poder ver de nuevo.»), no en «Conectado»; agregar que la referencia no tiene ese estado (el diseño ya está en el aviso de «Conectado» y la tarjeta enmascarada) y que sus dos botones «Copiar» (token y URL) también van sin ícono.
