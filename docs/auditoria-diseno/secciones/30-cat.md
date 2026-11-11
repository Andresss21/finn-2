# Auditoría de diseño · CAT (detalle de categoría y sus flujos) y MAS (Metas)

Casos: `tools/auditoria/casos/30-cat.cap.ts` (48 casos × 3 variantes = 144 capturas, todas en verde). Semilla A.7 (servidor 2026-10-15) para
las pantallas de lectura; semillas de las E2E (ESC-17, 35, 38, 42, 44, ESC-01) para archivar, fusionar, sacar, metas y período cerrado.
Capturas en `docs/auditoria-diseno/capturas/`, medidas en `medidas/`, análisis en `analisis/`.

Alcance de la comparación: teléfono claro, comparado uno a uno con su referencia; computadora claro mirado en `categoria__principal`,
`meta__nueva-para-fecha`, `categoria-sacar__hoja` y por el análisis de marco de todos los flujos; teléfono oscuro mirado en
`categoria__principal` (no hay diferencias de color: los hallazgos son los mismos que en claro). Los demás estados en computadora y oscuro se
midieron (marco, tocables, roles) pero no se miraron uno por uno.

**Dato ya medido, confirmado (CAT-01):** en teléfono el título de la categoría **no está en la barra superior**: está dentro del contenido y se
superpone al rótulo y a «Disponible».

## Inventario

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| categoria__principal | /presupuesto/categorias/[id] | `app/(finn)/presupuesto/categorias/[categoriaId]/pantalla.tsx` | S3-Detalle (telefono/computadora/oscuro) | CAT-01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 33 |
| categoria__con-meta | idem (Fondo de emergencia) | pantalla.tsx | S3-Detalle__con-meta | CAT-01, 03, 04 |
| categoria__sobregiro-tarjeta | idem (Gasolina) | pantalla.tsx | S3-Detalle__sobregiro-con-tarjeta | CAT-01, 04, 13 (color del héroe: bien, ver nota de CAT-13) |
| categoria__sin-movimientos | idem (Viaje) | pantalla.tsx | S3-Detalle__sin-movimientos | CAT-01, 02, 14 |
| categoria__historial-tabla | idem, selector en «Tabla» | historial.tsx | S3-Detalle__historial-como-tabla | CAT-08, 11, 12 |
| categoria__sin-historial | idem (Super, sin períodos previos) | historial.tsx | DECISIONES «Gráfico sin datos» · PANTALLAS §2.19 | bien (caja hundida con ícono y texto) |
| categoria__pago-tarjeta | idem (Visa Oro con deuda) | pago.tsx | S3-Detalle__categoria-de-pago-de-tarjeta + DECISIONES | CAT-01, 15, 16, 17 |
| categoria__pago-tarjeta-reservado | idem, todo reservado | pago.tsx | DECISIONES («Pagar la tarjeta») | CAT-15, 17 |
| categoria__periodo-cerrado | idem `?periodo=` cerrado | pantalla.tsx | SIN DISEÑO (PANTALLAS §2.6, §2.15) | CAT-01, 02; ver «Sin diseño» |
| categoria__archivada | idem (Gimnasio archivada) | pantalla.tsx, desarchivar.tsx | SIN DISEÑO (FALTANTES `archivadas`) | CAT-01, 18; ver «Sin diseño» |
| categoria__cargando | idem | `loading.tsx` (re-exporta el de `(finn)`) | 14-…/cargando | **no capturado como carga real** (ver abajo); proxy capturado |
| categoria__no-encontrada | idem con id inexistente | lector.tsx | 14-…/error y 404 | bien en estructura (hija con volver, ícono de búsqueda, «Esto ya no existe.», botón tonal); no se comparó contra el PNG de 14 |
| categoria-mas__cerrado | menú cerrado | pantalla.tsx | MA/cerrado | = categoria__principal |
| categoria-mas__abierto | menú abierto | `componentes/marco/mas-acciones.tsx` | MA/abierto | CAT-19 |
| categoria-mas__abierto-con-meta | menú, categoría con meta | mas-acciones.tsx | MA/abierto-con-meta | CAT-19 (se miró solo el análisis) |
| categoria-mas__periodo-cerrado | menú con período cerrado | mas-acciones.tsx | MA/abierto | sin referencia propia; medido, no mirado |
| categoria-mas__archivada | menú de archivada | mas-acciones.tsx | SIN DISEÑO | medido, no mirado |
| categoria-archivar__formulario | /…/archivar | `flujos/presupuesto-categorias-archivar/formulario.tsx` | 07/archivar-categoria | CAT-20, 21, 23, 32 |
| categoria-archivar__impacto | idem, paso «Revisá el impacto» | idem | 07/archivar-categoria | CAT-22 |
| categoria-archivar__sin-pendientes | idem (Viaje) | idem | 07/archivar-categoria | CAT-20, 21 |
| categoria-sacar__hoja | hoja sobre Presupuesto | `flujos/presupuesto-categorias-sacar/formulario.tsx` | 07/sacar-de-archivada | CAT-24, 25 |
| categoria-sacar__error-monto | idem, monto mayor al disponible | idem | 07/sacar-de-archivada | CAT-24, 26 |
| categoria-sacar__pagina | /…/sacar directo | `…/sacar/page.tsx` | 07/sacar-de-archivada | CAT-24, 27, 32 |
| categoria-sacar__desarchivar | resultado de «Desarchivar» | desarchivar.tsx | SIN DISEÑO | ver «Sin diseño» |
| categoria-fusionar__formulario | /…/fusionar | `flujos/presupuesto-categorias-fusionar/formulario.tsx` | 07/fusionar | CAT-28, 29 |
| categoria-fusionar__impacto | idem, paso «Revisá el impacto» | idem | 07/fusionar | CAT-22, 29, 30 |
| categoria-fusionar__sin-destinos | sin otra categoría activa | idem | 07/fusionar-destino-archivado (lo más cercano) | CAT-31 |
| categoria-fusionar__destino-archivado | rechazo forzado archivando el destino desde otra pestaña | idem | 07/fusionar-destino-archivado | CAT-31 |
| metas__lista | /metas | `app/(finn)/metas/pantalla.tsx` | 09a/lista | MAS-003, 004, 005 |
| metas__lista-varias | idem, rellenar / acumular / semanal | idem | 09a/lista | MAS-003, 004 |
| metas__vencida | idem con meta vencida | idem | 09a/vencida | MAS-004, 006 |
| metas__vacia | idem sin metas | idem | 09a/vacia | MAS-007 |
| metas__cargando | idem | hereda `loading.tsx` de `(finn)` | 14-…/cargando | **no capturado como carga real**; proxy |
| meta__nueva-mensual / semanal / anual / para-fecha / rellenar-hasta | /metas/nueva | `flujos/metas-nueva/formulario.tsx` | 09a/nueva | MAS-001, 002, 008, 009, 010, 011, CAT-32 |
| meta__nueva-error-vacio / error-sin-fecha / error-fecha-pasada | idem con errores | idem | 09a/nueva (sin estado de error) | MAS-012 |
| meta__nueva-sin-categorias | idem, todas con meta | idem | SIN DISEÑO | ver «Sin diseño» |
| meta__nueva-sin-preseleccion | idem sin `?categoria=` | idem | 09a/nueva | MAS-001 |
| meta__editar | /metas/[metaId] | `flujos/metas-meta/formulario.tsx` | SIN DISEÑO propio (09a/nueva) | MAS-001, 013, CAT-32 |
| meta__editar-vencida / editar-extender | idem con meta vencida | idem | 09a/vencida · FALTANTES `meta-vencida` | MAS-006, 014 |
| meta__editar-eliminar | confirmación de eliminar | idem | SIN DISEÑO | ver «Sin diseño» |
| meta__editar-conflicto | «cambió mientras editabas» | idem | 07/asignar-conflicto (lo más cercano) | MAS-015 |
| meta__editar-no-encontrada | /metas/[id] inexistente | `flujos/metas-meta/lector.tsx` | 14 | medido, no mirado |

**No capturado como carga real:** `categoria__cargando` y `metas__cargando`. Se intentó retener la respuesta RSC (antes y después de la
precarga) y el `loading.tsx` no llegó a pintarse (la ruta responde antes de que el navegador lo muestre). Se capturó
`/pruebas/estados/carga`, que dibuja el mismo `loading.tsx` de `(finn)` que la categoría re-exporta (`categorias/[categoriaId]/loading.tsx`)
y que Metas hereda. Es un proxy, no la transición real.

## Hallazgos

### CAT-01 · Título de la pantalla hija en el contenido, superpuesto a «Disponible» — Detalle de categoría y pago de tarjeta · teléfono claro/oscuro · alta
- **Se ve:** la barra superior solo tiene flecha, campana y «⋯», sin título. El `h1` está dentro del contenido: en `capturas/categoria__principal__telefono-claro.png` mide x=80, y=184.6, alto 60 (interlineado 60, 26 px); el rótulo «Gastos» está en y=184.6 y «Disponible» en y=216.2, así que el título pisa a los dos (también en `categoria__archivada`, donde pisa «Categoría archivada»). Títulos largos se cortan: «FONDO DE EMERG…» en `categoria__con-meta__telefono-claro.png`. En computadora la flecha y el título sí comparten fila y no se pisan.
- **Debería:** PANTALLAS §3.1 y DECISIONES «Marco»: en pantallas hijas la flecha «Volver a <padre>» va a la izquierda del título, en la misma fila de la barra superior (`.t-titulo-pantalla` 1.625rem), y a la derecha campana + «Más acciones». Referencia `02-referencias/tableros/S3-Detalle__telefono-claro.png`.
- **Arreglo:** publicar el título de la categoría en la barra (`PublicarEncabezado` / `proveedor-encabezado.tsx`) en teléfono y quitar el `h1` visible del contenido debajo de `md` (dejarlo `sr-only` o solo en computadora), en `presupuesto/categorias/[categoriaId]/pantalla.tsx` (fila del título, líneas ~164-169, junto a `VolverEnTitulo`) y en `pago.tsx` (mismo patrón). Mismo cambio para el rótulo de grupo: debe quedar debajo del título como en la referencia.
- **Cómo verificar:** a 390 px, ningún texto de `main` solapa a otro (cajas sin intersección) y el título ocupa la barra con elipsis si no entra; `categoria__con-meta` muestra el título sin cortarse más de lo que corta la barra.

### CAT-02 · Selector de período dentro del detalle — Detalle de categoría · teléfono y computadora · media
- **Se ve:** una tarjeta con flechas de período («21/09 – 20/10/2026 · Actual · 25 días transcurridos») ocupa unos 170 px arriba del héroe (`categoria__principal__telefono-claro.png`); en computadora va arriba de todo (`…computadora-claro.png`, y la flecha «Volver» queda más abajo).
- **Debería:** S3-Detalle no tiene selector de período; la pantalla lleva el contexto por `?periodo=` y el aviso de período cerrado. El héroe es lo primero tras la barra.
- **Arreglo:** si el selector se quiere conservar es una decisión nueva (proponer CH); si no, quitar `SelectorPeriodo` de `pantalla.tsx` y mantener solo el aviso «Este período está cerrado…».
- **Cómo verificar:** el pliegue a 390 × 844 muestra héroe, indicador y rejilla sin la tarjeta de período.

### CAT-03 · Bloque «Meta» sin el resumen de meta del diseño — Detalle con meta · teléfono · media
- **Se ve:** `categoria__con-meta__telefono-claro.png`: sección «Meta» con título de sección y contenido suelto (indicador, «$1,350.00 de $3,000.00 · 45%», barra y «Pide…»), sin contenedor, sin el nombre ni «Para el 30/06/2027», con el % pegado al texto y sin «Sin fondos suficientes en Listo para asignar.». Bajo el héroe no hay indicador «Falta para la meta».
- **Debería:** `…/tableros/S3-Detalle__con-meta.png` y K3-Dominio-A «resumen de meta»: contenedor blanco con nombre + fecha a la derecha, línea «$ de $» con el % a la derecha en 700, barra de 6 px, «Pide…», indicador y explicación; indicador `advertencia` bajo el héroe; el botón «Asignar $75.00» debajo.
- **Arreglo:** usar el componente de dominio `ResumenMeta` (`componentes/dominio`) dentro de un contenedor, y mostrar el indicador bajo el héroe (`pantalla.tsx`, rama de meta).
- **Cómo verificar:** la sección Meta es un contenedor con las seis líneas de la referencia y un indicador visible bajo «Disponible».

### CAT-04 · Falta el espacio en el texto del botón con monto — Detalle · teléfono, computadora, oscuro · media
- **Se ve:** «Cubrir$26.30», «Asignar$75.00», «Reservar$18.75» (texto y monto sin espacio) en `categoria__principal`, `categoria__con-meta`, `categoria__sobregiro-tarjeta`; el análisis mide el texto «Cubrir» y el monto como dos nodos contiguos. En la tarjeta de pago sí sale «Reservar $300.00».
- **Debería:** «Cubrir $26.30», «Asignar $75.00», «Reservar $18.75» (S3-Detalle, todos los PNG).
- **Arreglo:** el botón de acción de la categoría arma el texto con `<Monto>` sin separador; agregar el espacio (o `gap`) en el componente que renderiza `t.acciones.cubrir/asignar/reservar` + monto en `pantalla.tsx`; el de `pago.tsx` ya lo hace bien.
- **Cómo verificar:** el nombre accesible del enlace es «Cubrir $26.30» y se ve con espacio.

### CAT-05 · «Cubrir» fuera del aviso y a todo el ancho — Detalle con sobregiro · teléfono · media
- **Se ve:** `categoria__principal__telefono-claro.png`: aviso del sobregiro y, debajo, un botón de 350 × 48 a todo el ancho.
- **Debería:** S3-Detalle y PANTALLAS §6.3: el botón principal de 44 va **dentro** del aviso, a su ancho natural; el aviso trae el monto en el título («Sobregiro con débito o efectivo · $26.30») y «con tarjeta $0.00».
- **Arreglo:** mover el botón dentro de `AvisoEnLinea` (acción de 44, no de 48/52) en `pantalla.tsx`; completar el título del aviso con el monto.
- **Cómo verificar:** el botón está dentro del aviso, alto 44, ancho al contenido.

### CAT-06 · Título de cada consumo es un enlace subrayado con el nombre de la cuenta — Detalle · teléfono, computadora · media
- **Se ve:** en cada consumo, «Cuenta corriente» / «Visa Oro» en 600, subrayado (`text-decoration: underline`, x=94, alto 44), y debajo se repite «Débito · Cuenta corriente» (`consumos.tsx`, clase `underline` línea 14).
- **Debería:** S3-Detalle: comercio en 600 sin subrayado y debajo solo «Débito» / «Tarjeta».
- **Arreglo:** quitar `underline` del enlace de la fila (la fila entera ya es tocable) y no repetir la cuenta en la segunda línea cuando es el título; cuando no hay comercio, mostrar «Débito»/«Tarjeta» como título (decisión de producto: proponer CH). `app/(finn)/presupuesto/categorias/[categoriaId]/consumos.tsx`.
- **Cómo verificar:** ningún texto de la lista de consumos tiene subrayado y la cuenta aparece una sola vez.

### CAT-07 · Falta «Reglas» — Detalle de categoría · teléfono, computadora · baja
- **Se ve:** no hay sección de reglas en `categoria__principal` (ni «Archivar» deshabilitado con motivo, que vive en «Más acciones», CH-115, aceptable).
- **Debería:** PANTALLAS §6.7 y S3-Detalle: pastillas «PIZZA HUT», «LA PAMPA» (si hay reglas que apuntan a la categoría).
- **Arreglo:** confirmar si la semilla A.7 carga reglas; si las carga, falta la sección en `pantalla.tsx` (`t.reglas`, que existe en `textos/categoria-detalle.ts`).
- **Cómo verificar:** con una regla hacia la categoría, aparece su pastilla de 36 px.

### CAT-08 · Seguimiento de color y glifo de «Se pasó 2 de 6» — Historial · teléfono, computadora · media
- **Se ve:** «Se pasó 2 de 6» en texto plano negro, sin glifo ni color (`categoria__principal__telefono-claro.png`, y la tabla en `categoria__historial-tabla`).
- **Debería:** PANTALLAS §2.18 y S3-Detalle: indicador `problema` (círculo + glifo) en `--problema-texto`; tres señales por estado (DECISIONES regla 2).
- **Arreglo:** reemplazar el `<span data-se-paso>` de `historial.tsx` (línea ~94) por `IndicadorEstado estado="problema"` con la etiqueta.
- **Cómo verificar:** el indicador lleva glifo, color y texto.

### CAT-09 · «Asignar» sin ícono «+» — Detalle · teléfono, computadora · baja
- **Se ve:** «Asignar» solo texto en el botón principal de la rejilla de acciones.
- **Debería:** S3-Detalle: principal con ícono `plus`.
- **Arreglo:** `pantalla.tsx`, nav «Acciones de la categoría»: agregar `Icono nombre="plus"`.
- **Cómo verificar:** el botón muestra el `+` a la izquierda.

### CAT-10 · Selector Gráfico / Tabla agregado al calendario — Detalle · teléfono, computadora · baja
- **Se ve:** el calendario lleva un selector Gráfico / Tabla (44 de alto) arriba a la derecha dentro de la tarjeta.
- **Debería:** S3-Detalle: el calendario no tiene selector (la tabla equivalente va en el árbol de accesibilidad, PANTALLAS §11).
- **Arreglo:** quitar el selector de `calendario.tsx` o proponer CH si se quiere conservar.
- **Cómo verificar:** el calendario es solo la rejilla y la nota.

### CAT-11 · Historial: selector dentro de la tarjeta y rótulos distintos — Historial · teléfono · baja
- **Se ve:** el selector Gráfico / Tabla está dentro de la tarjeta, bajo el encabezado; la cifra dice «Promedio gastado»; la leyenda es «Gasto · Se pasó · Asignado».
- **Debería:** S3-Detalle: selector a la derecha del título de la sección «Últimos 6 períodos»; «gastado en promedio por período»; leyenda «Gastado · Asignado · Se pasó».
- **Arreglo:** `componentes/graficos/vista-grafico.tsx` (posición del selector) y textos de `textos/categoria-detalle.ts` (historial).
- **Cómo verificar:** el selector queda en la fila del título de sección.

### CAT-12 · Gráfico de historial: barras sin degradado y etiquetas «21/03» — Historial · teléfono, computadora · baja
- **Se ve:** barras negras planas y etiquetas de período «21/03…21/08»; las cifras del SVG no llevan `tabular-nums` (`$88.20`…`$118.90`, 6 montos según el análisis).
- **Debería:** PANTALLAS §2.18: barras con degradado de `--grafico-tinta` (100 % → 62 %), etiquetas de mes («mar», «abr»…), valores en Archivo 700 al 80 % con tnum.
- **Arreglo:** `componentes/graficos/grafico-barras.tsx`.
- **Cómo verificar:** `font-variant-numeric: tabular-nums` en los valores y degradado en las barras.

### CAT-13 · Sobregiro con tarjeta: el aviso reemplaza al texto del diseño — Detalle (Gasolina) · teléfono · media
- **Se ve:** aviso rosado «Deuda sin reservar» con «Con tarjeta $18.75. Deuda sin reservar en Gasolina: $18.75. Esta deuda suma a lo que te falta reservar para Visa Oro.» y el botón de 350 × 48 fuera; además un bloque «Historial» con «Gráfico sin datos».
- **Debería:** PANTALLAS §6 «Sobregiro con tarjeta»: texto plano «Pagaste con Visa Oro $18.75 más de lo asignado. Esa deuda todavía no está reservada.» bajo el indicador, rejilla Asignado/Gastado/Con tarjeta (3 celdas) y botón «Reservar $18.75»; S3-Detalle__sobregiro-con-tarjeta.
- **Arreglo:** cambiar el copy en `textos/categoria-detalle.ts` y usar texto simple en lugar de `AvisoEnLinea`; la rejilla debe tener 3 celdas en este estado (hoy 6).
- **Cómo verificar:** coincide con el PNG (salvo datos). Nota: el héroe en `--deuda-sin-respaldo-texto` (magenta) es lo que dice PANTALLAS §1; el PNG lo dibuja naranja. Gana la especificación escrita; no es hallazgo.

### CAT-14 · Glifo de vacío genérico (círculo punteado verde) — Estados vacíos · teléfono · baja
- **Se ve:** «Sin gastos en este período» con un anillo punteado verde sobre fondo verde claro (`categoria__sin-movimientos`, `categoria__con-meta`, `metas__vacia`).
- **Debería:** PANTALLAS §2.19: círculo de 72 con `--positivo-fondo` y glifo de 32 del tema; S3-Detalle__sin-movimientos usa una caja con «Sin consumos en este período.»; 09a/vacia usa círculo hundido con ícono `target`.
- **Arreglo:** pasar el ícono de cada vacío (`target` en metas, `receipt` en consumos) al componente de vacío (`componentes/base/…vacio`).
- **Cómo verificar:** cada vacío muestra su ícono.

### CAT-15 · Categoría de pago: secciones que el diseño no tiene — Pago de tarjeta · teléfono · media
- **Se ve:** `categoria__pago-tarjeta__telefono-claro.png`: además de héroe, rejilla, «Para no generar intereses» y botón, aparecen botones «Asignar» y «Pagar tarjeta», «Números del período», «La tarjeta hoy» y «Traslados por categoría».
- **Debería:** DECISIONES «Categoría de pago de tarjeta (detalle)»: héroe, rejilla Deuda · Reservado · Te falta, «Para no generar intereses», botón principal y lista de pagos; sin historial.
- **Arreglo:** retirar o proponer CH para las tres secciones y el segundo par de botones en `pago.tsx`.
- **Cómo verificar:** la pantalla tiene solo los bloques de DECISIONES.

### CAT-16 · «Para no generar intereses» como lista de tres filas — Pago de tarjeta · teléfono · media
- **Se ve:** título de sección «Para no generar intereses» y un contenedor con «Pago de contado $300.00 · Pagá antes del 15/02», «Deuda al corte anterior», «Cargos del ciclo actual», «Ya pagado en el ciclo».
- **Debería:** S3-Detalle__categoria-de-pago-de-tarjeta: una tarjeta con el rótulo «PARA NO GENERAR INTERESES», «Pagá antes del 15/11» a la izquierda y el monto en 700 a la derecha, y debajo «Es el saldo al corte anterior; lo demás puede esperar al próximo pago.»
- **Arreglo:** `pago.tsx`.
- **Cómo verificar:** coincide con el PNG.

### CAT-17 · Pago de tarjeta: rejilla en caja hundida, nombre de tarjeta como enlace subrayado y «Pagar tarjeta» — Pago de tarjeta · teléfono · baja
- **Se ve:** la rejilla Deuda · Reservado · Te falta va en una caja `--superficie-hundida` sin elevación; «Tarjeta Visa Oro» es un enlace subrayado de 44 de alto bajo el título; el botón con todo reservado dice «Pagar tarjeta».
- **Debería:** contenedor blanco con elevación (PANTALLAS §1); DECISIONES: «Pagar la tarjeta».
- **Arreglo:** `pago.tsx` y `textos/categoria-pago.ts`.
- **Cómo verificar:** contenedor estándar y texto «Pagar la tarjeta».

### CAT-18 · «Últimos 1 períodos» — Historial de una categoría con un solo período · teléfono · baja
- **Se ve:** «Últimos 1 períodos» y «Se pasó 0 de 1» en `categoria__archivada__telefono-claro.png`.
- **Debería:** concordancia de número («Último período»).
- **Arreglo:** `textos/categoria-detalle.ts`, `historial.titulo(n)` con plural.
- **Cómo verificar:** con n = 1 el título dice «Último período».

### CAT-19 · Más acciones: textos, subtítulos e íconos distintos — Menú · teléfono · media
- **Se ve:** `capturas/pliegue/categoria-mas__abierto__telefono-claro.png`: «Editar nombre y grupo», «Crear una meta», «Mover dinero», «Archivar» (deshabilitado con motivo), «Fusionar con otra», «Eliminar» (deshabilitado). Íconos: inbox para archivar, flechas cruzadas para fusionar.
- **Debería:** `…/MA-detalle-de-categoria-mas-acciones/abierto__telefono-claro.png`: «Agregar meta» + «Mensual, semanal, anual o para una fecha», «Archivar» con candado y «Elegís a dónde va el Disponible.», «Fusionar con otra categoría» con ícono de check. (El PNG deja «Archivar» habilitado con Disponible −$26.30; la regla escrita —PANTALLAS §6.8 y la E2E CH-115— lo deshabilita, así que eso no es hallazgo.)
- **Arreglo:** `textos/categoria-detalle.ts` (acciones) y los íconos en `componentes/marco/mas-acciones.tsx`; subtítulo de cada ítem.
- **Cómo verificar:** textos y subtítulos iguales a MA/abierto.

### CAT-20 · Archivar: título sin el nombre de la categoría — Archivar · teléfono · media
- **Se ve:** «ARCHIVAR CATEGORÍA» y el nombre en un renglón aparte.
- **Debería:** «Archivar Supermercado» (07/archivar-categoria).
- **Arreglo:** `textos/categorias-archivar.ts` y el encabezado del flujo (`archivar/page.tsx`).
- **Cómo verificar:** el título trae el nombre.

### CAT-21 · Archivar: falta la mayor parte del contenido de la pantalla — Archivar · teléfono, computadora · alta
- **Se ve:** `categoria-archivar__formulario__telefono-claro.png`: un selector «Mandar $40.00 de Disponible a», una tarjeta blanca de texto y un selector de programada («Elegí una opción.»).
- **Debería:** `…/07-flujos-del-presupuesto/archivar-categoria__telefono-claro.png`: aviso informativo («Al archivar, X deja de aparecer…»), «Disponible $62.85» con dos opciones de radio (Devolver a Listo para asignar / Pasarlo a otra categoría), «Asignado en períodos futuros $350.00» con casilla, «Programadas · 1» con una tarjeta por programada («se va a desactivar») y un resumen «Listo para asignar $312.40 → $725.25» y «Reglas que apuntan aquí».
- **Arreglo:** reconstruir `flujos/presupuesto-categorias-archivar/formulario.tsx` con esos bloques (radios, casilla, tarjetas de programadas, resumen); los selectores nativos no son los controles del diseño.
- **Cómo verificar:** los seis bloques están en la misma pantalla, con el pie fijo «Archivar».

### CAT-22 · Archivar y fusionar: paso «Revisá el impacto» que el diseño no tiene — Archivar, Fusionar · teléfono · media
- **Se ve:** al tocar «Archivar» o «Fusionar» aparece otra pantalla con el título de sección «Revisá el impacto», filas de texto («Listo para asignar: +$30.00») y «Volver a editar / Confirmar» (`categoria-archivar__impacto`, `categoria-fusionar__impacto`).
- **Debería:** el impacto va en la misma pantalla antes de pulsar el botón del pie (07/archivar-categoria, 07/fusionar); no hay un segundo paso.
- **Arreglo:** mostrar el resumen en vivo en el formulario y que el botón del pie confirme; si el segundo paso se conserva (05 §4.4 lo pide para fusionar), proponerlo como CH y diseñarlo.
- **Cómo verificar:** un solo paso, o el diseño del segundo paso aprobado.

### CAT-23 · Aviso de «Tiene dinero asignado en 1 período futuro» sin componente de aviso — Archivar · teléfono · media
- **Se ve:** tarjeta blanca con sombra, sin glifo ni color de estado.
- **Debería:** aviso en línea (PANTALLAS §2.14) con fondo de estado, glifo y texto, o la casilla de «Asignado en períodos futuros».
- **Arreglo:** `AvisoEnLinea` en `formulario.tsx`.
- **Cómo verificar:** fondo `--<estado>-fondo` y glifo.

### CAT-24 · Sacar el dinero: título, subtítulo, textos y botón distintos — Sacar de archivada · teléfono, computadora · media
- **Se ve:** «SACAR EL DINERO», sin subtítulo; campos «Poner en» y «Monto a sacar»; ayuda «Gimnasio: Disponible $25.00.»; botón «Sacar».
- **Debería:** `…/sacar-de-archivada__telefono-claro.png`: «SACAR DE SUPERMERCADO», subtítulo «Archivada · Disponible $62.85», frase «X está archivada y todavía tiene dinero.», «Hacia», «Monto», «X tiene $62.85.» y botón «Sacar $62.85».
- **Arreglo:** `textos/categorias-sacar.ts` y `flujos/presupuesto-categorias-sacar/formulario.tsx` (título con nombre, subtítulo, botón con monto).
- **Cómo verificar:** textos iguales a la referencia.

### CAT-25 · Sacar el dinero: panel de 420 px en computadora — Sacar · computadora · baja
- **Se ve:** `capturas/pliegue/categoria-sacar__hoja__computadora-claro.png`: panel de unos 420 px.
- **Debería:** 440 px (DECISIONES «Marco», flujos cortos).
- **Arreglo:** el ancho del panel en `componentes/marco/superpuesto.tsx`.
- **Cómo verificar:** `getBoundingClientRect().width` = 440.

### CAT-26 · Sacar: el error de monto no se anuncia — Sacar · teléfono · media
- **Se ve:** `categoria-sacar__error-monto`: el mensaje aparece, pero el análisis cuenta `status=0 alert=0` en la captura.
- **Debería:** PANTALLAS §2.14 y la regla 8: avisos y errores con `role="status"` o `alert`.
- **Arreglo:** `formulario.tsx` de sacar (y los otros flujos: ver MAS-012).
- **Cómo verificar:** el mensaje tiene `role="alert"`.

### CAT-27 · Entrada directa a «Sacar» es una página de flujo con barra superior distinta — Sacar · teléfono · baja
- **Se ve:** `categoria-sacar__pagina` abre una página de flujo (sin barra inferior), mientras que desde Presupuesto es una hoja sobre la lista.
- **Debería:** un único comportamiento (hoja / panel) tanto por enlace como por URL.
- **Arreglo:** ruta interceptada `@superpuesto/(.)presupuesto/categorias/[categoriaId]/sacar` y su par `sacar/page.tsx`; revisar que la página se reutilice como hoja al abrirla en frío.
- **Cómo verificar:** misma presentación por ambos caminos.

### CAT-28 · Fusionar: título, etiqueta repetida y opciones sin grupo — Fusionar · teléfono · media
- **Se ve:** título «FUSIONAR CATEGORÍAS»; el campo repite «Fusionar con» como etiqueta y como texto de ayuda dentro del selector; opciones sin el grupo debajo del nombre.
- **Debería:** «Fusionar Restaurantes», etiqueta «Fusionar Restaurantes con» y selector con nombre y grupo en dos líneas (07/fusionar).
- **Arreglo:** `textos/categorias-fusionar.ts` y `formulario.tsx`.
- **Cómo verificar:** coincide con el PNG.

### CAT-29 · Fusionar: resumen como frases y avisos sin títulos — Fusionar · teléfono · media
- **Se ve:** «1 período con asignación», «1 transacción»… como líneas de texto; aviso de meta sin título («Se descarta la meta de Café.»); aviso informativo con el copy «Todo el historial de Café pasa a la categoría que elijas…».
- **Debería:** «QUÉ PASA A <DESTINO>» con filas rótulo/valor (Períodos con asignado 7, Transacciones 41, Condonaciones, Programadas, Reglas), aviso `advertencia` con título «Se descarta una meta» y aviso `información` «X desaparece y Y queda con el historial de las dos. No se puede deshacer.»
- **Arreglo:** `formulario.tsx` y textos de fusionar.
- **Cómo verificar:** coincide con 07/fusionar.

### CAT-30 · Fusionar: «Confirmar» en azul para una acción irreversible — Fusionar (paso de impacto) · teléfono · media
- **Se ve:** `categoria-fusionar__impacto__telefono-claro.png`: «Confirmar» con el botón principal azul; solo el «Fusionar» del primer paso es rojo.
- **Debería:** DECISIONES / INDICE-entrega-2 §«Eliminar»: «Fusionar también usa `peligro` porque no se puede deshacer».
- **Arreglo:** variante `peligro` en el botón de confirmar (`formulario.tsx`), o eliminar el segundo paso (CAT-22).
- **Cómo verificar:** el botón que ejecuta la fusión es `peligro`.

### CAT-31 · Fusionar con destino archivado: el flujo no lo resuelve como el diseño — Fusionar · teléfono · alta
- **Se ve:** el selector solo lista categorías activas; el rechazo del servidor (destino archivado a mitad de edición) reemplaza todo el formulario por un aviso genérico «No se puede fusionar con lo elegido. Volvé a editar y revisá la categoría.» y un botón tonal (`categoria-fusionar__destino-archivado__telefono-claro.png`). Sin otras categorías activas (`categoria-fusionar__sin-destinos`), el flujo dice «No hay otra categoría activa…».
- **Debería:** `…/fusionar-destino-archivado__telefono-claro.png`: el selector muestra «Comida rápida (archivada)», borde `--problema-borde`, mensaje en el campo «La categoría destino debe estar activa.», «Fusionar» deshabilitado y debajo el motivo «Elegí una categoría activa.».
- **Arreglo:** listar las archivadas con «(archivada)», validar en el cliente y mostrar el error en el campo con el motivo bajo el botón (`flujos/presupuesto-categorias-fusionar/formulario.tsx`, `rechazos` en `textos/categorias-fusionar.ts`).
- **Cómo verificar:** elegir una archivada deja el formulario a la vista con el error en el campo.

### CAT-32 · Flujos en computadora con campana y barra lateral — Archivar, Fusionar, Meta nueva y editar, Sacar (página) · computadora · alta
- **Se ve:** `meta__nueva-para-fecha__computadora-claro.png`: sidebar completa, campana en la esquina y el flujo en una columna de 720 px pegada a la izquierda. El análisis da `campana=true` y `lateral=true` en todos los flujos de CAT y MAS (archivar, fusionar, sacar por URL, nueva y editar meta).
- **Debería:** DECISIONES «Marco»: los flujos —todo lo que termina en Guardar, Confirmar o Verificar— no llevan campana; los flujos cortos se abren como panel lateral de 440 px sobre la lista (09a/nueva computadora).
- **Arreglo:** el marco de flujo de computadora (`componentes/marco/pagina-flujo.tsx`) debe ocultar la campana; las metas deben ser hoja/panel (MAS-001).
- **Cómo verificar:** a 1440 px, las páginas de flujo no tienen campana.

### CAT-33 · Calendario: tocables de 42 × 44 — Detalle · teléfono · baja
- **Se ve:** los días con gasto miden 42 × 44 (6 en `categoria__principal`, 4 en `categoria__sobregiro-tarjeta`, 1 en archivada y período cerrado).
- **Debería:** 44 × 44 (DECISIONES regla 6).
- **Arreglo:** `calendario.tsx`, ancho mínimo 44.
- **Cómo verificar:** `tocables` sin elementos < 44.

### MAS-001 · Nueva y editar meta son páginas completas, el diseño las quiere como flujo corto — Metas · teléfono, computadora · crítica
- **Se ve:** `meta__nueva-para-fecha__telefono-claro.png` y `meta__editar__telefono-claro.png`: pantalla propia con «Cerrar» y título «META PARA VIAJE» / «EDITAR META DE GAS», sin la lista detrás. En computadora, una columna de 720 px con sidebar (`…computadora-claro.png`).
- **Debería:** INDICE-entrega-2 («Se trató como corto: … metas») y `09a-metas/nueva__telefono-claro.png`: hoja inferior sobre Metas con agarradera y «Meta para Fondo de emergencia · Ahorro»; en computadora, panel lateral de 440 px sobre velo (`nueva__computadora-claro.png`).
- **Arreglo:** abrir `metas/nueva` y `metas/[metaId]` como ruta interceptada en `@superpuesto/(.)metas/…`, igual que `sacar`; la página directa queda como respaldo.
- **Cómo verificar:** desde Metas, «Editar»/«Crear una meta» abre hoja (teléfono) o panel (computadora) y la lista queda detrás.

### MAS-002 · Nueva meta: faltan las etiquetas «Tipo» y «Modo» y el copy del modo es otro — Metas · teléfono · media
- **Se ve:** el selector de tipo no tiene etiqueta; el de modo dice «Acumular / Rellenar hasta».
- **Debería:** etiquetas «Tipo» y «Modo»; opciones «Asignar / Tener disponible» (09a/nueva).
- **Arreglo:** `flujos/metas-nueva/formulario.tsx` y `textos/metas.ts` (`tipo`, `modos`). Si el copy cambia, también el contrato de textos de metas (decisión de producto: CH).
- **Cómo verificar:** coincide con el PNG.

### MAS-003 · Lista de metas: acciones «Editar» y «Ver la categoría» como enlaces subrayados — Metas · teléfono, computadora · media
- **Se ve:** `metas__lista__telefono-claro.png`: en cada tarjeta, «Editar» y «Ver la categoría» en `--texto` subrayado, 600.
- **Debería:** `09a-metas/lista__telefono-claro.png`: sin acciones por tarjeta; las filas de «Otras metas» son enlaces completos con estado y flecha.
- **Arreglo:** `app/(finn)/metas/pantalla.tsx`: hacer tocable toda la tarjeta hacia el detalle de la meta y quitar los enlaces sueltos.
- **Cómo verificar:** ninguna fila tiene enlaces subrayados; la tarjeta entera abre la meta.

### MAS-004 · Lista de metas: estructura distinta (sin contenedor de resúmenes ni «Otras metas» compactas) — Metas · teléfono · alta
- **Se ve:** una sola tarjeta con todas las metas apiladas y filas largas: nombre, monto a la derecha, «Mensual · Acumular», indicador, línea de progreso solo en algunas, «Pide…», «Monto del período» y los enlaces.
- **Debería:** `09a-metas/lista__telefono-claro.png` y K3 «resumen de meta»: las metas con pedido van como resumen anidado (nombre + «Para el 30/06/2027», «$ de $ · 45 %», barra, «Pide…», indicador, «Sin fondos suficientes…»; las cubiertas con barra completa y «Meta cubierta») dentro de un contenedor; las demás en «OTRAS METAS» con nombre, «Mensual · $15.49», estado «Cubierta» o «Vencida» y flecha.
- **Arreglo:** usar `ResumenMeta` y la fila de «Otras metas» (`componentes/dominio`) en `metas/pantalla.tsx`.
- **Cómo verificar:** coincide con la jerarquía de la referencia.

### MAS-005 · Lista: botón «Nueva meta» suelto arriba — Metas · teléfono · media
- **Se ve:** botón principal auto-ancho «Nueva meta» debajo del título (`metas__lista__telefono-claro.png`), que no está en la referencia.
- **Debería:** 09a/lista no tiene botón de alta (el alta aparece solo en «Crear una meta» del vacío y en «Categorías sin meta»); la entrada a crear queda sin diseño.
- **Arreglo:** decidir el punto de entrada (proponer CH) y dibujarlo; hasta entonces es una pieza inventada en `metas/pantalla.tsx`.
- **Cómo verificar:** el CH define dónde vive «Nueva meta».

### MAS-006 · Meta vencida: acciones subrayadas en negro y copy sin el faltante — Metas · teléfono · media
- **Se ve:** aviso «Meta vencida» con «Extender la fecha» y «Ajustar el monto» subrayados en `--texto` (`metas__vencida__telefono-claro.png`); en el editor las mismas acciones son botones tonales con texto azul subrayado (`meta__editar-vencida__telefono-claro.png`). Copy: «La meta de Laptop venció el 15/05/2027 sin cumplirse.»
- **Debería:** `09a-metas/vencida__telefono-claro.png`: acciones en `--advertencia-texto` en 700, sin subrayar; copy «La meta de Viaje era para el 30/09 y faltaron $184.62.»; fila de «Otras metas» con estado «Vencida».
- **Arreglo:** `AvisoEnLinea` con acciones del estado (PANTALLAS §2.14) en `metas/pantalla.tsx` y en `flujos/metas-meta/formulario.tsx`; copy en `textos/metas.ts` (`vencida.texto`).
- **Cómo verificar:** misma presentación en la lista y en el editor.

### MAS-007 · Vacío de Metas con glifo genérico y copy distinto — Metas · teléfono · baja
- **Se ve:** `metas__vacia__telefono-claro.png`: anillo punteado verde; «Todavía no tenés metas» / «Una meta dice cuánto falta asignar a una categoría. Nunca asigna sola.»
- **Debería:** `09a-metas/vacia__telefono-claro.png`: círculo hundido con ícono `target`; «Todavía no hay metas» / «…cada período, sin asignar sola.»
- **Arreglo:** ver CAT-14 y `textos/metas.ts`.
- **Cómo verificar:** ícono y texto de la referencia.

### MAS-008 · Nueva meta: pie con un solo botón a todo el ancho — Metas · teléfono · media
- **Se ve:** «Crear meta» a todo el ancho; «Guardar cambios» del editor, en cambio, es auto-ancho (`meta__editar__telefono-claro.png`).
- **Debería:** «Cancelar» (tonal) y «Guardar meta» en columnas 1fr / 1.4fr (09a/nueva).
- **Arreglo:** pie del flujo corto en `formulario.tsx` de `metas-nueva` y `metas-meta`; mismo componente en ambos.
- **Cómo verificar:** pie idéntico en nueva y editar.

### MAS-009 · Nueva meta: sin aviso informativo ni «$» en el campo de monto — Metas · teléfono · baja
- **Se ve:** campo «Monto de la meta» sin prefijo «$» y sin el aviso «La meta no asigna sola…».
- **Debería:** campo «Monto» con «$ 175.00» y aviso `información` (09a/nueva).
- **Arreglo:** `formulario.tsx` (campo de monto, `AvisoEnLinea`).
- **Cómo verificar:** coincide con el PNG.

### MAS-010 · Selector segmentado: segmentos de ancho desigual y pastilla que sobresale — Metas · teléfono · media
- **Se ve:** `meta__nueva-para-fecha__telefono-claro.png`: «Para una fecha» (activa) se parte en dos líneas y la pastilla mide 118 × 48 sobre un riel más bajo; en el selector de modo, el riel es de ancho completo pero los segmentos son del ancho del texto (`meta__editar__telefono-claro.png`).
- **Debería:** segmentos iguales (1fr) con la activa dentro del riel (09a/nueva).
- **Arreglo:** `componentes/base/selector-segmentado.tsx`: columnas iguales y alto de la pastilla = alto del riel − relleno.
- **Cómo verificar:** cuatro segmentos del mismo ancho; la pastilla activa queda dentro del riel.

### MAS-011 · Nueva meta: falta el contexto de la categoría — Metas · teléfono · baja
- **Se ve:** título «Meta para Viaje»; no hay subtítulo con el grupo.
- **Debería:** subtítulo «Ahorro» bajo el título (09a/nueva).
- **Arreglo:** encabezado del flujo.
- **Cómo verificar:** subtítulo con el grupo.

### MAS-012 · Errores de formulario sin `role="alert"` — Nueva meta · teléfono · media
- **Se ve:** `meta__nueva-error-vacio`: «Completá este campo.» con glifo y color (tres señales) pero `status=0 alert=0` en las medidas; igual en fecha pasada y sin fecha.
- **Debería:** DECISIONES regla 8 / PANTALLAS §14: avisos y errores anunciados.
- **Arreglo:** `componentes/base/campo` (mensaje de error con `role="alert"`).
- **Cómo verificar:** el análisis muestra `alert ≥ 1`.

### MAS-013 · Editar meta: «Eliminar meta» como botón peligro a todo el ancho — Metas · teléfono · baja
- **Se ve:** botón rojo de 48 a todo el ancho al pie (`meta__editar__telefono-claro.png`).
- **Debería:** acción destructiva separada y discreta (INDICE-entrega-2: «Eliminar va en el botón `peligro` y siempre muestra el efecto antes de confirmar»); sí lo confirma dentro del flujo. Sin referencia de editar, es solo una observación.
- **Arreglo:** diseñar el editor (ver «Sin diseño») y decidir su jerarquía.
- **Cómo verificar:** según el diseño.

### MAS-014 · Editar meta vencida: acciones como botones tonales con texto de enlace — Metas · teléfono · media
- **Se ve:** en `meta__editar-vencida__telefono-claro.png`, «Extender la fecha» y «Ajustar el monto» son botones tonales con texto azul subrayado.
- **Debería:** un enlace subrayado donde va un botón tonal es error (encargo común, punto 3); en el aviso de advertencia, la acción va en `--advertencia-texto` (PANTALLAS §2.14).
- **Arreglo:** ver MAS-006.
- **Cómo verificar:** una sola variante de acción de aviso en toda la app.

### MAS-015 · Conflicto al editar: copy contradictorio — Metas · teléfono · baja
- **Se ve:** `meta__editar-conflicto__telefono-claro.png`: «Este valor cambió mientras lo editabas. Recargá para ver el valor actual.» con el botón «Usar el valor actual».
- **Debería:** una sola instrucción coherente con el botón (07/asignar-conflicto es la referencia más cercana; no se comparó píxel a píxel).
- **Arreglo:** `textos/metas.ts` o el texto de conflicto compartido.
- **Cómo verificar:** el texto y el botón dicen lo mismo.

## Candidatos a global

- Título de pantalla hija dentro del contenido en teléfono en lugar de la barra (CAT-01): revisar todas las hijas (Cuenta, Transacción, Gasto semanal).
- Botón con monto sin espacio: «Cubrir$26.30», «Asignar$75.00» (CAT-04).
- Selector segmentado con segmentos de ancho desigual y pastilla que sobresale (MAS-010).
- Flujos en computadora con campana y barra lateral, y sin panel lateral de 440 px (CAT-32).
- Errores de formulario sin `role="alert"` (MAS-012, CAT-26).
- Acciones de aviso como enlaces subrayados en `--texto` o botones tonales con texto de enlace (MAS-006, MAS-014).
- Glifo de estado vacío genérico (anillo punteado verde) en todos los vacíos (CAT-14).
- Selector Gráfico / Tabla dentro de la tarjeta, no en la fila del título (CAT-11).
- Calendario de días de 42 × 44 (CAT-33).
- Botón «Registrar» de la barra superior solo con «+» en Presupuesto en teléfono (se ve en el fondo de `categoria-sacar__hoja__telefono-claro.png`); la referencia lleva el texto «Registrar».
- Plural en títulos de historial (CAT-18).

## Sin diseño

- **Categoría archivada** (`categoria__archivada`, `categoria-mas__archivada`): FALTANTES `archivadas`. La app muestra «Categoría archivada» como texto plano, «Sacar el dinero» y «Desarchivar» como botones tonales.
- **Resultado de «Desarchivar»** (`categoria-sacar__desarchivar`): sin referencia.
- **Detalle con período cerrado** (`categoria__periodo-cerrado`, `categoria-mas__periodo-cerrado`): solo existe la especificación escrita (PANTALLAS §2.6, §2.15); no hay PNG de detalle cerrado.
- **Editar una meta** (`meta__editar`, `meta__editar-vencida`, `meta__editar-extender`, `meta__editar-eliminar`, `meta__editar-no-encontrada`): INDICE-entrega-2 dice «nueva y editar como flujo corto», pero solo existe `nueva`. FALTANTES `meta-vencida` (extender o ajustar) tampoco tiene pantalla propia.
- **Nueva meta sin categorías** (`meta__nueva-sin-categorias`: «Todas tus categorías ya tienen meta.») y **errores de la nueva meta** (`meta__nueva-error-*`): sin referencia.
- **Menú Más acciones con período cerrado o categoría archivada:** sin referencia.
- **Paso «Revisá el impacto»** de archivar y fusionar: no está en el diseño (CAT-22).
- **Entrada «Nueva meta»** de la lista: sin diseño (MAS-005).
