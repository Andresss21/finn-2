# Auditoría de diseño · ACT (Actividad, detalle de transacción y flujos) y REP (Reportes)

Casos: `tools/auditoria/casos/50-act-rep.cap.ts`. Capturas en `docs/auditoria-diseno/capturas/<id>__<variante>.png` (y `pliegue/`), medidas en `medidas/`, análisis en `analisis/<id>.md`. Las 3 variantes corrieron completas (188 de 189 en la primera pasada; `reportes__indice` en computadora falló por la redirección y se repitió en verde). Semillas: A.7 pura para las listas, A.7 más extras (dividida, devolución parcial y total, cobro, conciliada) para el detalle, y las semillas de las E2E para hormiga, suscripciones, tarjetas y gasto semanal.

Aclaración de método: en la semilla de A.7 de las E2E se quitan las confirmaciones del banco (OP-30), por eso todas las filas dicen «Pendiente» y «Sin comercio»: son diferencias de datos y no se reportan. Sí se reporta lo que revela un problema de composición.

## Inventario

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| actividad__lista | /actividad | `app/(finn)/actividad/pantalla.tsx` | 02-actividad/lista | ACT-01, ACT-02, ACT-03, ACT-14 |
| actividad__buscando | /actividad?texto= | `actividad/buscador.tsx` | 02-actividad/buscando | ACT-01, ACT-04 |
| actividad__filtros-abiertos | /actividad (hoja en teléfono, columna en computadora) | `actividad/filtros.tsx` | 02-actividad/filtros | ACT-05, ACT-06, ACT-07 |
| actividad__filtrado | /actividad?tipo=… | `actividad/chips.tsx` | 02-actividad/filtrado | ACT-05, ACT-08 |
| actividad__cargando | /actividad (carga) | `actividad/loading.tsx` | 02-actividad/cargando | no comparado en detalle (ver ACT-15) |
| actividad__cargar-mas | /actividad (60 filas, períodos cerrados) | `actividad/pantalla.tsx` | 02-actividad/cargar-mas | ACT-01 |
| actividad__vacio | /actividad sin transacciones | `actividad/pantalla.tsx` | 02-actividad/vacio | ACT-09 |
| actividad__sin-resultados | /actividad?texto=zzzz | `actividad/pantalla.tsx` | 02-actividad/sin-resultados | ACT-10 |
| actividad__eliminada | /actividad tras eliminar | `actividad/pantalla.tsx` | 03-detalle-de-transaccion/eliminada | ACT-11 |
| transaccion__principal | /actividad/[id] | `actividad/[transaccionId]/pantalla.tsx` | 03/principal | ACT-16, ACT-17, ACT-18, ACT-19, ACT-20 |
| transaccion__dividida | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-16, ACT-18, ACT-19 |
| transaccion__por-cobrar | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-21 |
| transaccion__por-cobrar-con-cobro | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-21, ACT-22 |
| transaccion__pendiente | /actividad/[id] | ídem | 03/principal | ACT-17 |
| transaccion__conciliada | /actividad/[id] | ídem | 03/conciliada | ACT-23 |
| transaccion__con-devolucion | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-22 |
| transaccion__cuenta-archivada | /actividad/[id] | ídem | 03/editar-cuenta-archivada | bien (el detalle no tiene diseño propio) |
| transaccion__mas-acciones | /actividad/[id] | `componentes/marco/mas-acciones.tsx` | 03/mas-acciones | ACT-24 |
| transaccion__no-encontrada | /actividad/[id] inexistente | `app/(finn)/not-found.tsx` | 14-sin-conexion-404…/no-encontrado | bien |
| transaccion__confirmada-tras-cambiar-estado, __devolucion-registrada, __evento-eliminado | /actividad/[id] | ídem | 03/principal | resultado en el lugar sin aviso: ACT-12 |
| transaccion-editar__principal | /actividad/[id]/editar | `flujos/actividad-editar/formulario.tsx` | 03/editar | ACT-25 |
| transaccion-editar__dividida | ídem | ídem | 03/editar | ACT-25 |
| transaccion-editar__con-devolucion | ídem | ídem | 03/editar | bien (cuenta fija con motivo) |
| transaccion-editar__revisar-impacto | ídem (AV-16) | `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO | ACT-26 |
| transaccion-editar__conflicto | ídem | `actividad-editar/formulario.tsx` | 03/editar-conflicto | ACT-27 |
| transaccion-editar__cuenta-archivada | ídem | ídem | 03/editar-cuenta-archivada | ACT-28 |
| transaccion-devolver__principal | /actividad/[id]/devolver | `flujos/actividad-devolver/formulario.tsx` | 03/devolver | ACT-29 |
| transaccion-devolver__dividida | ídem | ídem | 03/devolver | ACT-29 |
| transaccion-devolver__excede | ídem | ídem | 03/devolver-excede | ACT-30 |
| transaccion-devolver__sin-capacidad | ídem | `actividad-devolver/sin-capacidad.tsx` | 03/devolver-sin-capacidad | ACT-31 |
| transaccion-estado__principal, __confirmada | /actividad/[id]/estado | `flujos/actividad-estado/formulario.tsx` | 03/cambiar-estado | ACT-32, ACT-37 |
| transaccion-eliminar__principal | /actividad/[id]/eliminar | `flujos/actividad-eliminar/formulario.tsx` | 03/eliminar | ACT-32, ACT-33 |
| transaccion-eliminar__revisar | ídem (paso 2) | ídem | 03/eliminar | ACT-33, ACT-34 |
| transaccion-eliminar__bloqueado | ídem | ídem | 03/eliminar-bloqueado | ACT-32, ACT-35 |
| transaccion-eliminar-evento__principal, __cobro, __revisar | /actividad/[id]/eventos/eliminar | `flujos/actividad-eventos-eliminar/lector.tsx` | 03/eliminar-evento | ACT-32, ACT-34, ACT-36 |
| reportes__indice | /reportes (redirige a tendencia) | `reportes/page.tsx` | 04-reportes/tendencia | REP-01 a REP-05 |
| reporte-tendencia__principal | /reportes/tendencia | `reportes/[tipo]/pantalla.tsx` | 04/tendencia | REP-01 a REP-08 |
| reporte-tendencia__tabla | ídem (Tabla) | ídem | 04/tendencia-tabla | REP-02, REP-09 |
| reporte-tendencia__ventana-3 | ídem ?ventana=ultimos-3 | ídem | 04/tendencia | REP-04 |
| reporte-categorias__principal | /reportes/categorias | `[tipo]/vistas.tsx` | 04/categorias | REP-01 a REP-05, REP-10 |
| reporte-ingresos-gastos__principal | /reportes/ingresos-gastos | `[tipo]/vistas.tsx` | 04/ingresos-gastos | REP-01 a REP-05 (misma plantilla; no se vio uno por uno) |
| reporte-top-comercios__principal | /reportes/top-comercios | `[tipo]/vistas-detalle.tsx` | 04/top-comercios | REP-01 a REP-05, REP-11 |
| reporte-hallazgos__principal | /reportes/hallazgos | `[tipo]/hallazgos.tsx` | 04/hallazgos | REP-12 |
| reporte-hallazgos__vacio | ídem sin hallazgos | ídem | 04/hallazgos-vacio | REP-13 |
| reportes__sin-movimientos | /reportes/tendencia sin gasto | `[tipo]/pantalla.tsx` | 04/sin-movimientos | REP-14 |
| reporte-flujo-efectivo__principal | /reportes/flujo-efectivo | `[tipo]/flujo.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-ritmo__principal | /reportes/ritmo | `[tipo]/ritmo.tsx` | SIN DISEÑO | ídem |
| reporte-realidad__principal | /reportes/realidad | `[tipo]/realidad.tsx` | SIN DISEÑO | ídem |
| reporte-tarjetas__principal, __con-ciclos | /reportes/tarjetas | `[tipo]/tarjetas.tsx` | SIN DISEÑO | REP-15 |
| reporte-hormiga__principal | /reportes/hormiga | `[tipo]/hormiga.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-suscripciones__principal | /reportes/suscripciones | `[tipo]/suscripciones.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-remanente__principal | /reportes/remanente | `[tipo]/vistas.tsx` | SIN DISEÑO | ídem |
| reporte-cumplimiento__principal | /reportes/cumplimiento | `[tipo]/vistas-detalle.tsx` | SIN DISEÑO | REP-15 |
| reporte-patrimonio__principal | /reportes/patrimonio | `[tipo]/vistas-detalle.tsx` | SIN DISEÑO | ídem |
| reporte-gasto-semanal__una | /reportes/gasto-semanal | `[tipo]/vistas-semanal.tsx` | D2/una | REP-16 a REP-22 |
| reporte-gasto-semanal__varias | ídem | ídem | D2/varias | REP-16 a REP-22 |
| reporte-gasto-semanal__a7 | ídem (A.7: varias categorías) | ídem | D2/varias | REP-16 a REP-22 |
| reporte-gasto-semanal__tabla | ídem (Tabla) | ídem | S7-Semanal__vista-de-tabla | REP-23 |
| reporte-gasto-semanal__asignado-negativo | ídem | ídem | S7-Semanal__asignado-negativo | REP-16 a REP-22 (aviso presente; no se comparó pixel a pixel) |
| reporte-gasto-semanal__categoria-nueva | ídem | ídem | S7-Semanal__categoria-nueva | REP-16 a REP-22 (aviso presente) |
| reporte-gasto-semanal__sin-movimientos | ídem sin gasto | ídem | 04/sin-movimientos | no comparado |
| reportes__selector-de-tipos | /reportes/tendencia | `[tipo]/pantalla.tsx` | 04/tendencia | no es un control desplegable: es la fila de pastillas (REP-05) |
| reportes__cargando | /reportes/[tipo] (carga) | `[tipo]/loading.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte__no-encontrada (id `reporte__no-encontrado`) | /reportes/flujo-de-caja | `not-found.tsx` | 14/no-encontrado | bien |

No capturados: el estado «cargar más» en curso («Guardando…» en la referencia) no se puede forzar: el control es un enlace que navega. «Sin conexión» de Actividad y Reportes no se capturó (fuera del encargo). El selector de ventana no es una hoja: son segmentos en línea (REP-04). «Hormiga», «suscripciones», «flujo de efectivo», «ritmo» y «realidad» se capturaron una sola vez cada uno, en su estado principal.

## Hallazgos

### ACT-01 · «Registrar» duplicado en el contenido de Actividad — Actividad · todas · alta
- **Se ve:** debajo de la barra superior aparece un botón tonal «Registrar» (16 px/600) que la referencia no tiene (`capturas/pliegue/actividad__lista__telefono-claro.png`, x=20, y≈76). En computadora hay otro «Registrar» tonal en la fila del título, además del azul de la barra lateral (`actividad__filtros-abiertos__computadora-claro.png`).
- **Debería:** un solo «Registrar»: en teléfono el azul con «+ Registrar» de la barra superior; en computadora el de la barra lateral (`02-referencias/entrega-2/pantallas/02-actividad/lista__telefono-claro.png`, `filtros__computadora-claro.png`; PANTALLAS §3.1).
- **Arreglo:** quitar el `EnlaceFinn href="/registrar"` de `apps/web/src/app/(finn)/actividad/pantalla.tsx:75` y la clave `t.registrar` de `textos/actividad.ts`.
- **Cómo verificar:** `/actividad` tiene un único enlace a `/registrar` visible por viewport.

### ACT-02 · Buscador y «Filtros» apilados, no en una fila — Actividad · teléfono y computadora · alta
- **Se ve:** en teléfono el buscador ocupa todo el ancho y «Filtros» es una pastilla tonal a todo el ancho debajo (16 px/600, x=20). En computadora «Filtros» es una pastilla sobre la columna y el buscador va a la derecha sin botón (`pliegue/actividad__lista__telefono-claro.png`).
- **Debería:** buscador a la izquierda y botón «Filtros» (14 px/700, con el contador «Filtros · 3» en fondo `--texto` cuando hay filtros) a la derecha, en la misma fila; en computadora el botón queda junto al buscador y la columna de filtros es un panel con título «Filtros» (`lista__telefono-claro.png`, `filtrado__computadora-claro.png`).
- **Arreglo:** reestructurar la cabecera de `actividad/pantalla.tsx` (buscador + botón en `flex` de una fila) y el estilo `RESUMEN` de `actividad/filtros.tsx`; usar el rol `etiqueta` (14/700) en vez de 16/600.
- **Cómo verificar:** a 390 px buscador y botón comparten fila; el análisis ya no marca «Filtros» con tamaño 16≠14 ni x 20≠268.

### ACT-03 · El estado «Pendiente» y «Por cobrar» usan 14 px en vez de 13 — Actividad · todas · baja
- **Se ve:** «Pendiente» y «Por cobrar» miden 14 px/20.3 de interlineado (`analisis/actividad__lista.md`).
- **Debería:** `cuerpo-pequeno` 13 px/18.9 (`lista__telefono-claro.html`).
- **Arreglo:** `apps/web/src/componentes/dominio/fila-transaccion.tsx`: usar la clase de rol con 13 px para las marcas de la fila.
- **Cómo verificar:** el análisis no muestra diferencias de tamaño en esas dos marcas.

### ACT-04 · Búsqueda sin encabezado de resultados — Actividad · todas · media
- **Se ve:** al buscar «super» la lista se filtra pero no dice cuántos resultados hay ni ofrece «Quitar filtros» arriba de la lista (`capturas/actividad__buscando__telefono-claro.png`); «Quitar filtros» solo existe en el vacío y mide 86×18 (`analisis/actividad__buscando.md`: tocable < 44).
- **Debería:** línea «2 resultados para “pampa”» a la izquierda y «Quitar filtros» a la derecha, ambos tocables (`02-actividad/buscando__telefono-claro.png`).
- **Arreglo:** agregar la línea de resumen en `actividad/pantalla.tsx` (texto en `textos/actividad.ts`) con el enlace en una caja de 44 px de alto.
- **Cómo verificar:** con `?texto=` aparece la línea; el enlace mide ≥ 44 × 44.

### ACT-05 · Los filtros no son una hoja inferior sino un panel que se expande en la página — Actividad · teléfono · alta
- **Se ve:** un `<details>` («Filtros») despliega en la propia página una tarjeta con seis campos apilados que empuja la lista hacia abajo; no hay velo, agarradera, título «Filtros» ni cerrar (`capturas/pliegue/actividad__filtros-abiertos__telefono-claro.png`, `actividad__filtrado__telefono-claro.png`: con filtros activos el panel queda abierto y tapa los resultados).
- **Debería:** hoja inferior (`--superficie-elevada`, `--radio-superpuesto`, `--elevacion-3`, agarradera, título «Filtros» y cerrar de 44, velo detrás), con «Quitar filtros» (tonal) y «Ver N resultados» (primario) en el pie (`02-actividad/filtros__telefono-claro.png`; PANTALLAS §2.17).
- **Arreglo:** reemplazar el `<details>` de `actividad/filtros.tsx:75` por la hoja del marco (`componentes/marco`) en teléfono; mantener la columna fija en computadora. El botón del pie pasa de «Filtrar» a «Ver N resultados».
- **Cómo verificar:** en 390 px, tocar «Filtros» abre un `role="dialog"` con velo; al aplicar se cierra y la lista queda a la vista.

### ACT-06 · Tipo, Estado y Origen son listas desplegables, no selectores segmentados — Actividad · todas · alta
- **Se ve:** «Tipo», «Estado» y «Origen» son `select` de 52 px con «Todos» y chevron; «Cuenta» y «Categoría» sin ícono de la cuenta; fechas como «dd/mm/yyyy» nativo y «Opcional» como rótulo; montos sin símbolo `$` ni «0.00» (`actividad__filtros-abiertos__telefono-claro.png`).
- **Debería:** Tipo (Todos · Gasto · Ingreso · Movimiento), Estado bancario (Todos · Pendiente · Confirmada · Conciliada) y Origen (Todos · SMS · Manual · Programada) como control segmentado; Cuenta con el ícono de su tipo; fechas con la `EntradaFecha` dd/mm/aaaa con calendario; montos con «$ 0.00» (`filtros__telefono-claro.png`, `filtros__computadora-claro.png`; P1-03 en INDICE-entrega-2).
- **Arreglo:** `actividad/filtros.tsx`: `SelectorSegmentado` de `componentes/base` para los tres, `EntradaFecha` para Desde/Hasta y campo de monto con prefijo. El rótulo «Estado» pasa a «Estado bancario».
- **Cómo verificar:** los tres grupos son `radiogroup` con 4 opciones; las fechas se escriben con barras automáticas.

### ACT-07 · Columna de filtros de 260 px, la referencia mide 320 — Actividad · computadora · baja
- **Se ve:** la columna mide 260 px (x 296–556) y la lista 752 px (`pliegue/actividad__filtros-abiertos__computadora-claro.png`), con el campo «Monto desde/hasta» partido en dos líneas y vacío.
- **Debería:** panel de 320 px con título «FILTROS» (`.t-titulo-seccion`) y campos de dos columnas legibles; la lista de ≈ 744 px (`filtros__computadora-claro.png`). La E2E del repo (PRU-E2E-TX-421) fija 260 px: si 260 es la decisión, la referencia debe corregirse; DECISIONES no fija el ancho.
- **Arreglo:** ancho de `[data-columna-filtros]` en `actividad/pantalla.tsx` (o corregir la referencia) y rótulos de monto en una línea.
- **Cómo verificar:** columna 320 px y rótulos «Monto desde» / «Monto hasta» en una línea.

### ACT-08 · Con filtros activos faltan las fichas con su ×, el conteo y el total — Actividad · todas · alta
- **Se ve:** con `?tipo=gasto&desde=…` la pantalla muestra el panel abierto y las fichas «Gasto» y «22/09 – 21/10» sin ícono de cuenta ni ×; no hay «5 transacciones · −$229.09» ni «Quitar filtros» (textos de `medidas/actividad__filtrado__telefono-claro.json`).
- **Debería:** fichas tonales con × («Visa Oro ×», «Gasto ×», «21/09 – 15/10 ×») bajo el buscador; debajo, «5 transacciones · −$229.09» a la izquierda y «Quitar filtros» a la derecha (`02-actividad/filtrado__telefono-claro.png`).
- **Arreglo:** `actividad/chips.tsx` (ficha con × de 44 px de área) y una fila de resumen en `actividad/pantalla.tsx`; el total lo entrega el DTO (PF-3), no la interfaz.
- **Cómo verificar:** con 3 filtros hay 3 fichas con × y la línea de resumen; el panel no queda abierto.

### ACT-09 · Vacío de Actividad sin acción y con el panel de filtros — Actividad · todas · media
- **Se ve:** «Todavía no hay transacciones» con el texto «Cuando registres un gasto, un ingreso o una transferencia…», sin botón, y con el buscador y los filtros encima (`capturas/actividad__vacio__telefono-claro.png`).
- **Debería:** buscador y «Filtros» visibles sin panel, círculo con glifo, el texto «Lo que registres o apruebes en la Bandeja va a aparecer aquí, agrupado por día.» y el botón «Registrar gasto» (`02-actividad/vacio__telefono-claro.png`; PANTALLAS §2.19).
- **Arreglo:** el vacío de `actividad/pantalla.tsx` y `textos/actividad.ts` (`vacioTexto`, botón «Registrar gasto»).
- **Cómo verificar:** el vacío trae círculo de 72 px, el texto y el botón.

### ACT-10 · Sin resultados: texto distinto y «Quitar filtros» de 18 px de alto — Actividad · todas · baja
- **Se ve:** «Probá con otros filtros o quitalos para ver todo.» y el enlace «Quitar filtros» de 86×18 (`analisis/actividad__sin-resultados.md`, tocable < 44).
- **Debería:** «Probá con otra palabra o quitá algún filtro.» y un botón «Quitar filtros» de 44 px (`02-actividad/sin-resultados__telefono-claro.png`).
- **Arreglo:** `textos/actividad.ts` y el enlace de `actividad/pantalla.tsx` con `min-h-11` y variante tonal.
- **Cómo verificar:** el análisis no marca tocables < 44 en `actividad__sin-resultados`.

### ACT-11 · Eliminar una transacción vuelve a Actividad sin el resultado en el lugar — Actividad · todas · alta
- **Se ve:** tras eliminar, la lista aparece sin aviso (`capturas/actividad__eliminada__telefono-claro.png`: primer texto del cuerpo «Actividad / Registrar / Filtros …»).
- **Debería:** aviso arriba de la lista «Eliminaste PRICESMART · $148.60. Los Disponibles y la deuda de Visa Oro se recalcularon.» con `role="status"` (`03-detalle-de-transaccion/eliminada__telefono-claro.png`; DECISIONES «resultado en el lugar»).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` (redirigir con el resultado) y `actividad/pantalla.tsx` (`AvisoEnLinea` con `role="status"`).
- **Cómo verificar:** después de eliminar, la lista muestra el aviso con el nombre y el monto.

### ACT-12 · Los cambios de estado, devolución y eliminar evento vuelven al detalle sin aviso — Detalle · todas · media
- **Se ve:** `capturas/transaccion__confirmada-tras-cambiar-estado__telefono-claro.png`, `transaccion__devolucion-registrada…`, `transaccion__evento-eliminado…`: el detalle se actualiza en silencio, sin confirmación visible ni anunciada.
- **Debería:** resultados en el lugar con el aviso de lo hecho (DECISIONES «resultados en el lugar»; PANTALLAS §11, «Guardar … el resultado aparece con `--curva-enfasis`»).
- **Arreglo:** `AvisoEnLinea` con `role="status"` en `actividad/[transaccionId]/pantalla.tsx`, alimentado por un parámetro `?hecho=` o el resultado de la acción.
- **Cómo verificar:** después de cada acción hay un `role="status"` con el texto.

### ACT-13 · «Registrar» sin etiqueta en la barra superior del teléfono — Actividad · teléfono · media (candidato a global)
- **Se ve:** el botón de la barra es un «+» de 44 px sin texto (`pliegue/actividad__lista__telefono-claro.png`, x 242–286).
- **Debería:** «+ Registrar» azul con etiqueta de 14/700 (PANTALLAS §3.1: padding 0 14 0 10; `lista__telefono-claro.png`).
- **Arreglo:** componente de barra superior en `componentes/marco`: mostrar la etiqueta a 390 px; si no cabe con la hamburguesa, definirlo en DECISIONES.
- **Cómo verificar:** el botón mide ≈ 110 × 44 y su texto es visible.

### ACT-14 · Falta «Programada» y el tratamiento del comercio en la fila — Actividad · todas · baja
- **Se ve:** las filas no traen la marca «Programada» en una compra programada, ni «Con devoluciones» en la compra que tiene devolución (`medidas/actividad__lista__telefono-claro.json` y el texto de `transaccion__con-devolucion`): la fila de la compra con devolución dice «Pendiente».
- **Debería:** insignia «Con devoluciones» y «Programada» con su glifo (`lista__telefono-claro.png`, filas LA PAMPA y NETFLIX.COM).
- **Arreglo:** `componentes/dominio/fila-transaccion.tsx`.
- **Cómo verificar:** la fila de una compra con devolución muestra «Con devoluciones» con el glifo `undo`.

### ACT-15 · Estado de carga de Actividad: sin texto «Buscando…» — Actividad · todas · baja
- **Se ve:** esqueleto de cuatro filas con un `sr-only` «Cargando» (`actividad/loading.tsx`).
- **Debería:** la referencia lleva el rótulo «Buscando…» visible (`02-actividad/cargando__telefono-claro.html`). Comparación visual no hecha en detalle.
- **Arreglo:** revisar `actividad/loading.tsx` contra `cargando__*`.
- **Cómo verificar:** coincide con la referencia en las tres variantes.

### ACT-16 · Partes sin signo y sin la raya rayada de «no cubierto» — Detalle · todas · alta
- **Se ve:** las partes muestran «$45.00» / «$15.00» sin signo y la porción no cubierta es un tramo de color suave liso con el texto anaranjado (`capturas/transaccion__dividida__telefono-claro.png`).
- **Debería:** montos de gasto con U+2212 («−$96.10») y la porción no cubierta con trazo rayado (`--problema-borde`), de modo que el estado no dependa del color: tres señales (`03/principal__telefono-claro.png`; DECISIONES «tres señales»; PANTALLAS §2.18).
- **Arreglo:** `Parte` en `actividad/[transaccionId]/pantalla.tsx` (`Monto` con signo) y la barra de cobertura (patrón rayado en `bg-[repeating-linear-gradient]` vía un token de `tokens.css`).
- **Cómo verificar:** el segmento «no cubierto» tiene rayado visible en escala de grises; los montos usan «−».

### ACT-17 · «Pendiente» lleva el glifo de «Confirmada» — Detalle · todas · media (candidato a global)
- **Se ve:** la pastilla «Pendiente» usa el ícono `check` (círculo con visto) (`capturas/pliegue/transaccion__mas-acciones__telefono-claro.png`, `transaccion__dividida…`); en Actividad el mismo estado usa el reloj.
- **Debería:** glifo por estado: reloj para pendiente, visto para confirmada, doble visto para conciliada (`03/principal__telefono-claro.png`, `02-actividad/lista__telefono-claro.png`).
- **Arreglo:** el `<Icono nombre="check">` fijo de `actividad/[transaccionId]/pantalla.tsx` (header) por un mapa de estado → glifo, el mismo de la fila.
- **Cómo verificar:** las tres pastillas llevan glifos distintos.

### ACT-18 · Falta «Efectos hoy» y sobra «Cuentas» — Detalle · todas · alta
- **Se ve:** tras «Partes» hay una sección «Cuentas» con «Cuenta corriente −$60.00» (`transaccion__dividida__telefono-claro.png`). No hay «Efectos hoy».
- **Debería:** «Efectos hoy» con una fila por efecto («Supermercado · Disponible $62.85», «Farmacia · Disponible −$5.15», «Carlos te debe $20.00», «Visa Oro · deuda $642.18») (`03/principal__telefono-claro.png`; INDICE «Datos, partes…, efectos, eventos…»).
- **Arreglo:** reemplazar la sección `Cuentas` de `pantalla.tsx` (líneas ≈ 280-290) por «Efectos hoy» con los efectos del DTO; si el DTO no los trae, es una contradicción para el Project (`dto.efectos` hoy solo trae cuenta y monto).
- **Cómo verificar:** aparece «Efectos hoy» con los Disponibles y la deuda.

### ACT-19 · Encabezado del detalle: fecha, estado y «Editar» — Detalle · todas · media
- **Se ve:** «Cuenta corriente · 14 oct 2026» (sin día de la semana), pastilla «Desde Manual» con el ícono de SMS, y un enlace «Editar» suelto bajo las pastillas.
- **Debería:** «Visa Oro · jueves 15/10/2026»; la pastilla de origen con el glifo del origen («Desde SMS» con `sms`, «Manual» con `edit`) y sin «Desde» para manual; «Editar» dentro de «Más acciones» (`03/principal__telefono-claro.png`, `mas-acciones__telefono-claro.png`: el primer ítem del menú es «Editar», no hay enlace suelto).
- **Arreglo:** `actividad/[transaccionId]/pantalla.tsx` (header: `formatearFecha…` con día de la semana; mapa origen → ícono y texto; quitar `EnlaceFinn editar` de la línea 256 y ponerlo como acción del menú).
- **Cómo verificar:** el menú «Más acciones» abre con «Editar» y el encabezado no tiene el enlace.

### ACT-20 · Faltan las secciones «Conciliación» (sin conciliar) y el aviso del origen — Detalle · todas · media
- **Se ve:** una transacción no conciliada no trae ningún bloque de conciliación (`transaccion__principal__telefono-claro.png`).
- **Debería:** «Conciliación» con «Sin conciliar. Se marca al conciliar el estado de cuenta o al verificar el saldo de Visa Oro.» (`03/principal__telefono-claro.png`).
- **Arreglo:** en `pantalla.tsx` mostrar el `AvisoEnLinea` también cuando `dto.conciliacion === undefined`, con título «Conciliación» y el texto nuevo en `textos/transaccion.ts`.
- **Cómo verificar:** una transacción sin conciliar muestra el bloque.

### ACT-21 · La parte por cobrar no trae «Cobrar» ni «Condonar» — Detalle · todas · alta
- **Se ve:** «Por cobrar a Carlos $40.00 · Cobrado $0.00 · por cobrar $40.00» sin acciones (`transaccion__por-cobrar__telefono-claro.png`); el nombre es «Por cobrar a Ana» y no «Ana (por cobrar)».
- **Debería:** «Carlos (por cobrar)» con los enlaces «Cobrar» y «Condonar» dentro de la parte (`03/principal__telefono-claro.png`).
- **Arreglo:** `Parte` en `pantalla.tsx` con los enlaces a `por-cobrar/cobrar` y `por-cobrar/condonar`; el rótulo sale de `t.deudorPorCobrar` (ya existe en `textos/transaccion.ts`).
- **Cómo verificar:** la parte abierta muestra «Cobrar» y «Condonar» tocables de 44 px.

### ACT-22 · Eventos como lista plana con «Eliminar», no como filas con ícono, título y monto con signo — Detalle · todas · media
- **Se ve:** «Cobrado | 14 oct 2026 | $10.00 | Eliminar» (`transaccion__por-cobrar-con-cobro__telefono-claro.png`, `transaccion__con-devolucion…`).
- **Debería:** fila con círculo-ícono, «Cobro de Carlos» / «Devolución parcial», «16/10 · a Cuenta corriente» y el monto en verde con «+» («+$10.00»); la eliminación pasa a «Más acciones» o al evento (`03/principal__telefono-claro.png`, `eliminar-bloqueado__telefono-claro.png`: «Eliminar evento» en rojo).
- **Arreglo:** componente `Eventos` en `pantalla.tsx` (línea ≈ 152 el enlace `eventos/eliminar`).
- **Cómo verificar:** los montos de eventos llevan signo y color positivo.

### ACT-23 · Conciliada: el menú no restringe con motivo visible — Detalle · todas · media
- **Se ve:** `transaccion__conciliada__telefono-claro.png` muestra el aviso «Conciliada con el estado de cuenta del 15 oct 2026»; «Editar» no se restringe.
- **Debería:** «Está conciliada: solo podés cambiar categoría, comercio y nota.», «Registrar devolución» con «Quedan $… por devolver», «Marcar como pendiente» deshabilitado con «Una transacción conciliada no cambia de estado.» (`03/conciliada__telefono-claro.png`).
- **Arreglo:** `acciones` en `pantalla.tsx:205-216` (cada acción con `detalle`/`motivo`); `mas-acciones.tsx` ya admite `motivo`.
- **Cómo verificar:** con una conciliada, el menú muestra los tres motivos.

### ACT-24 · «Más acciones» sin íconos, sin texto secundario y con un título extra — Detalle · todas · media
- **Se ve:** menú con el rótulo «SIN COMERCIO» arriba, ítems solo de texto y «Eliminar» en rojo; sin «Editar» (`pliegue/transaccion__mas-acciones__telefono-claro.png`).
- **Debería:** sin rótulo, con ícono de 20 px a la izquierda (`edit`, `undo`, `clock`, `trash`), una línea secundaria cuando aplica («Quedan $143.60 por devolver», «Hoy está confirmada») y Eliminar al final separado (`03/mas-acciones__telefono-claro.png`; P1-04).
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y la lista `acciones` del detalle (icono y `detalle`).
- **Cómo verificar:** el menú coincide con `mas-acciones__*` en las tres variantes.

### ACT-25 · Edición: no se capturó una diferencia estructural; se anota el acceso — Editar · todas · baja
- **Se ve:** la edición abre como flujo largo con «Cerrar» (X), campos y «Guardar cambios» fijo (`pliegue/transaccion-editar__principal__telefono-claro.png`), tal como la referencia; falta el bloque «Antes de guardar» con el efecto previo («Farmacia · Disponible −$5.15 → $0.85»).
- **Debería:** `03/editar__telefono-claro.png` incluye «Antes de guardar» con los efectos antes del botón.
- **Arreglo:** `flujos/actividad-editar/formulario.tsx`: mostrar el efecto estimado (DTO) antes de «Guardar cambios».
- **Cómo verificar:** al cambiar un monto aparece el bloque con el antes → después.

### ACT-26 · «Revisá el impacto» muestra un código crudo — Editar y eliminar · todas · alta
- **Se ve:** un aviso amarillo que dice «AV-07» y, en eliminar evento, «AV-03», sin texto (`pliegue/transaccion-eliminar__revisar__telefono-claro.png`; textos de `medidas/transaccion-eliminar-evento__revisar__telefono-claro.json`); las frases de impacto parten «−» del número («cambia –⏎$76.45»).
- **Debería:** el texto del aviso en voseo y una tabla «Concepto → antes → después» con el menos U+2212 pegado al monto (`03/eliminar__telefono-claro.png`, `eliminar-evento__telefono-claro.png`).
- **Arreglo:** mapa de avisos en `textos/transaccion.ts` (`avisosEliminar` solo trae AV-01 y AV-16: faltan AV-03 y AV-07; también en `avisos`); `componentes/formularios/confirmacion-impacto.tsx` (filas con `white-space: nowrap` en el monto).
- **Cómo verificar:** ningún aviso muestra un código; el signo no queda solo al final de línea.

### ACT-27 · Conflicto al guardar: aviso dentro del campo y sin la estructura de la referencia — Editar · todas · media
- **Se ve:** `capturas/transaccion-editar__conflicto__telefono-claro.png`: el texto «Cambió mientras la editabas / Este valor cambió mientras lo editabas. Recargá para ver el valor actual.» y el botón «Usar el valor actual» bajo el campo Nota.
- **Debería:** el mismo patrón, ubicado junto al campo en conflicto, con `role="alert"` (`03/editar-conflicto__telefono-claro.png`). No se comparó con más detalle.
- **Arreglo:** verificar el `role` y el lugar del aviso en `formulario.tsx`.
- **Cómo verificar:** el aviso tiene `role="alert"` y el foco pasa al campo.

### ACT-28 · Editar con la cuenta archivada: el formulario queda vacío y «Guardar» sigue activo — Editar · todas · crítica
- **Se ve:** solo el aviso «Cuenta vieja está archivada. Desarchivala para registrar o cambiar movimientos.» y «Guardar cambios»; no aparece ningún campo (`pliegue/transaccion-editar__cuenta-archivada__telefono-claro.png`).
- **Debería:** el formulario completo con Cuenta, Fecha y Total en «Solo lectura» y editables solo la categoría de cada parte, el comercio y la nota; el aviso «…solo podés cambiar la categoría de cada parte, el comercio y la nota.» (`03/editar-cuenta-archivada__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-editar/lector.tsx` (rama `archivada`) y `formulario.tsx`: no ocultar los campos; marcar los bloqueados.
- **Cómo verificar:** con una cuenta archivada se ven los campos y los tres bloqueados dicen «Solo lectura».

### ACT-29 · Devolver: el campo de la parte sin rótulo «Monto» y «Devolver a» en vez de «Vuelve a» — Devolver · todas · baja
- **Se ve:** `capturas/pliegue/transaccion-devolver__principal__telefono-claro.png`: el campo por parte no tiene rótulo; la cuenta se llama «Devolver a».
- **Debería:** rótulo «Monto» sobre cada campo de parte y «Vuelve a» (`03/devolver-excede__telefono-claro.png`); nota: `devolver__telefono-claro.png` mantiene «Devolver a». Verificar con el Project cuál rige.
- **Arreglo:** `flujos/actividad-devolver/formulario.tsx` y `textos/transaccion.ts` (`devolverA`).
- **Cómo verificar:** el campo de cada parte tiene etiqueta visible igual al nombre accesible `Monto de …`.

### ACT-30 · Devolver más de lo que queda: el error no va en la parte y el botón sigue activo — Devolver · todas · alta
- **Se ve:** el aviso «Las devoluciones superarían el total de la compra ($30.00).» queda al final del formulario, el campo no cambia de borde y «Registrar devolución $99.00» sigue activo (`pliegue/transaccion-devolver__excede__telefono-claro.png`).
- **Debería:** el campo de la parte con borde `--problema-borde`, el aviso «En esa parte quedan $22.50 por devolver.» dentro de la tarjeta, justo debajo de esa parte, y el botón deshabilitado con «Corregí el monto de Farmacia.» debajo (`03/devolver-excede__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-devolver/formulario.tsx` (error por parte; `t.corregiMonto` ya existe en `textos/transaccion.ts` y no se usa en este caso).
- **Cómo verificar:** con un monto mayor, el campo queda en borde de problema, el aviso va bajo la parte y el CTA está deshabilitado.

### ACT-31 · Sin nada por devolver: enlace subrayado donde va un botón — Devolver · todas · media
- **Se ve:** `actividad-devolver/sin-capacidad.tsx` dibuja «Volver a la transacción» como enlace subrayado (`font-bold text-enlace underline`).
- **Debería:** botón tonal ancho completo (`03/devolver-sin-capacidad__telefono-claro.png`; enlace subrayado donde va botón tonal es error).
- **Arreglo:** usar `BotonTonal`/`EnlaceBoton` de `componentes/base` en `sin-capacidad.tsx`.
- **Cómo verificar:** el control mide 44 px de alto con fondo `--accion-tonal`.

### ACT-32 · Estado, eliminar y eliminar evento son pantallas completas, la referencia usa hoja inferior — Flujos cortos · todas · alta
- **Se ve:** `capturas/pliegue/transaccion-eliminar__principal__telefono-claro.png` y `transaccion-eliminar__bloqueado…`: página completa con barra «Cerrar», título «Eliminar transacción», un botón azul «Ver qué cambia» y recién en un segundo paso el impacto; el detalle desaparece detrás.
- **Debería:** hoja inferior sobre el detalle (`--superficie-elevada`, agarradera, título «¿Eliminar PRICESMART?», subtítulo con monto/fecha/cuenta, impacto directo en una tabla y «Cancelar» / «Eliminar» en peligro) (`03/eliminar__telefono-claro.png`, `eliminar-bloqueado__…`, `eliminar-evento__…`, `cambiar-estado__…`; INDICE-entrega-2 «estado, eliminar y eliminar evento son flujos cortos»).
- **Arreglo:** `flujos/actividad-estado`, `actividad-eliminar`, `actividad-eventos-eliminar`: renderizar con la hoja del marco en vez de página, con el impacto ya calculado (una sola vista); el router puede mantener la URL como ruta interceptada.
- **Cómo verificar:** al elegir «Eliminar» en el menú, el detalle sigue visible detrás de un velo y no hay un paso «Ver qué cambia».

### ACT-33 · El botón de confirmar eliminar es azul de acción, no de peligro — Eliminar · todas · alta
- **Se ve:** «Eliminar» es azul (`pliegue/transaccion-eliminar__revisar__telefono-claro.png`).
- **Debería:** botón peligro `--peligro` (rojo) junto a «Cancelar» tonal (`03/eliminar__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` y `actividad-eventos-eliminar`: variante `peligro` del botón.
- **Cómo verificar:** fondo `--peligro` y texto `--texto-sobre-peligro`.

### ACT-34 · El impacto se muestra como frases y no como «antes → después» — Eliminar · todas · media
- **Se ve:** «Disponible de Supermercado cambia +$88.60.» (`transaccion-eliminar__revisar__telefono-claro.png`).
- **Debería:** filas «Supermercado · Disponible $62.85 → $158.95», «Visa Oro · deuda $642.18 → $493.58» (`03/eliminar__telefono-claro.png`, `eliminar-evento__telefono-claro.png`).
- **Arreglo:** `componentes/formularios/confirmacion-impacto.tsx` con filas rótulo/antes/después (el DTO debe traer ambos valores; si solo trae el delta, contradicción para el Project).
- **Cómo verificar:** cada fila trae dos montos con flecha.

### ACT-35 · Eliminar bloqueado: no ofrece «Eliminar evento» ni «Entendido» — Eliminar · todas · alta
- **Se ve:** aviso de problema, una sola línea «Cobrado · 14 oct 2026 $10.00» y el enlace subrayado «Ver transacción» (`pliegue/transaccion-eliminar__bloqueado__telefono-claro.png`).
- **Debería:** lista de eventos («Cobro de Carlos 16/10 · $10.00» con «Eliminar evento» en rojo a la derecha) y botón tonal «Entendido» (`03/eliminar-bloqueado__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-eliminar/formulario.tsx` (rama bloqueada) con las filas de evento y el botón.
- **Cómo verificar:** cada evento trae su acción y el único pie es «Entendido».

### ACT-36 · Eliminar evento: título genérico y sin impacto visible en el primer paso — Eliminar evento · todas · media
- **Se ve:** «Eliminar evento» y la pregunta «¿Eliminar esta devolución?» más un botón de dos pasos (textos del flujo en `textos/transaccion.ts`).
- **Debería:** «¿Eliminar el cobro de Carlos?», «$10.00 · 16/10 · Cuenta corriente» y «Carlos vuelve a deberte $30.00 y Cuenta corriente baja $10.00.» con la tabla de impacto y «Eliminar cobro» (`03/eliminar-evento__telefono-claro.png`).
- **Arreglo:** `textos/transaccion.ts` (`eliminarEventoPregunta` con nombre y rótulo del botón por tipo) y el flujo.
- **Cómo verificar:** el botón dice «Eliminar cobro» / «Eliminar devolución» según el evento.

### ACT-37 · Cambiar estado: opciones sin nombre accesible — Estado · todas · media
- **Se ve:** dos botones sin nombre accesible en (32,140) y (32,188) (`analisis/transaccion-estado__principal.md`).
- **Debería:** opciones de radio con su rótulo y descripción («Pendiente / El banco todavía no la confirmó.») como `radio` con nombre (`03/cambiar-estado__telefono-claro.png`).
- **Arreglo:** `flujos/actividad-estado/formulario.tsx`: `radiogroup` con `aria-labelledby`.
- **Cómo verificar:** el análisis no lista tocables sin nombre.

### REP-01 · Reportes no marca Presupuesto en la barra inferior — Reportes · teléfono · alta (candidato a global)
- **Se ve:** ninguna pestaña activa en las 15 capturas de teléfono (`capturas/pliegue/reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** «Presupuesto» activa (`04-reportes/tendencia__telefono-claro.png`; INDICE-entrega-2 «Reportes en teléfono marca Presupuesto»; ídem `D2/una__…`).
- **Arreglo:** `componentes/navegacion/secciones.ts` (mapa de ruta → pestaña): `/reportes` y `/reportes/*` → `presupuesto`.
- **Cómo verificar:** `aria-current="page"` en Presupuesto en cualquier `/reportes/...`.

### REP-02 · Falta la cifra grande con su subtítulo — Reportes · todas · alta
- **Se ve:** tras las pastillas viene el título de sección «TENDENCIA DE INGRESOS Y GASTOS» / «EN QUÉ SE VA TU DINERO» y el gráfico sin cifra (`reporte-tendencia__principal__telefono-claro.png`, `reporte-categorias__principal__telefono-claro.png`).
- **Debería:** cifra grande (`$635.60`, `.t-cifra-principal`) con «gastado en el período actual · promedio de 3: $675.88» y sin título de sección (`04/tendencia__telefono-claro.png`, `categorias__…`; PANTALLAS §2.18).
- **Arreglo:** `[tipo]/pantalla.tsx` y `vista-grafico.tsx` (`cifra`/`nota` ya existen como props); quitar el `h2` de la plantilla.
- **Cómo verificar:** todos los reportes de la plantilla traen la cifra y el subtítulo.

### REP-03 · «Ver Gráfico / Tabla» está dentro del contenedor y sin rótulo «VER» — Reportes · teléfono · media
- **Se ve:** el selector va dentro de la tarjeta, arriba a la derecha (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** una fila «VER» (`.t-rotulo`) con el selector a la derecha, sobre la tarjeta (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `componentes/graficos/vista-grafico.tsx` (`data-grafico-encabezado`).
- **Cómo verificar:** el selector queda fuera de la tarjeta, con rótulo.

### REP-04 · Selector de ventana: rótulos largos en dos líneas — Reportes · teléfono · media
- **Se ve:** «Período actual / Último período / 3 períodos / 6 períodos / 12 períodos» en dos líneas cada uno, con la opción activa de 2 líneas (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** «Actual · 1 · 3 · 6 · 12», una línea, alto de 44-48 (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `t.ventanas` en `textos/reportes.ts` y el selector en `[tipo]/pantalla.tsx` (etiqueta corta visible, larga en `aria-label`).
- **Cómo verificar:** el segmentado mide una sola línea.

### REP-05 · Filtros que no están en la referencia: cuentas y grupo — Reportes · todas · media
- **Se ve:** una o dos filas extra de pastillas («Todos / Cuenta corriente / Cuenta de ahorro…», «Todos / Pagos de tarjeta / Gastos») bajo el selector de ventana (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** la referencia no las trae; el filtro de cuentas no tiene diseño (candidato a FALTANTES).
- **Arreglo:** definir en DECISIONES dónde viven (p. ej. una hoja «Filtros»); mientras tanto, `[tipo]/pantalla.tsx`.
- **Cómo verificar:** la pantalla coincide con `categorias__*` o la decisión nueva.

### REP-06 · El gráfico de tendencia no trae eje de valores ni rejilla — Tendencia · todas · media
- **Se ve:** barras sobre una línea base y la etiqueta del valor sobre la barra, sin ejes (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** eje con $0 · $300 · $600 · $900 y rejilla suave `--grafico-rejilla` (`04/tendencia__telefono-claro.png`; el PNG manda sobre PANTALLAS §2.18, que dice «sin eje Y»).
- **Arreglo:** `componentes/graficos/grafico-barras.tsx`.
- **Cómo verificar:** aparecen las etiquetas del eje en 11 px `--texto-secundario`.

### REP-07 · Falta el aviso «El período actual va por el día 25 de 30» — Tendencia · todas · baja
- **Se ve:** sin aviso bajo el gráfico.
- **Debería:** `AvisoEnLinea` de información (`04/tendencia__telefono-claro.png`).
- **Arreglo:** `[tipo]/vistas.tsx` (tendencia).
- **Cómo verificar:** con el período actual en la ventana aparece el aviso.

### REP-08 · Tendencia desaparece con una sola barra (ventana «actual») — Tendencia · todas · media
- **Se ve:** con la ventana por defecto el gráfico dibuja una sola barra y una línea punteada (`reporte-tendencia__principal__telefono-claro.png`).
- **Debería:** la referencia trae 6 barras y la ventana «3» activa; el valor por defecto de la ventana de tendencia debería mostrar la serie (DECISIONES no fija el valor; la E2E 133 usa `ultimos-3`).
- **Arreglo:** `predeterminada(url)` de `[tipo]/pantalla.tsx` para `tendencia`.
- **Cómo verificar:** `/reportes/tendencia` sin parámetro muestra varios períodos.

### REP-09 · Tendencia como tabla provoca desborde horizontal de la página — Reportes · teléfono · alta
- **Se ve:** la página mide 429 px en 390: la barra superior y la inferior se estiran a 429 y «Registrar»/campana quedan fuera de la pantalla (`analisis/reporte-tendencia__tabla.md`, `reporte-tarjetas__principal.md`, `reporte-cumplimiento__principal.md`; `capturas/pliegue/reporte-tarjetas__principal__telefono-claro.png`: la barra superior sin acciones, tabla cortada en «AP»).
- **Debería:** la tabla scrollea dentro de su contenedor (`overflow-x: auto`) y la página no desborda (PANTALLAS §2.18 «Tabla equivalente»).
- **Arreglo:** `componentes/graficos/tabla-equivalente.tsx`: envolver en un contenedor con `overflow-x-auto` y `min-w-0` en el padre `[data-reporte]`.
- **Cómo verificar:** `scrollWidth` del documento = 390 en tendencia (tabla), tarjetas y cumplimiento.

### REP-10 · Porcentajes de la dona con dos decimales — Categorías · todas · baja
- **Se ve:** «44.32%», «22.58%» (`reporte-categorias__principal__telefono-claro.png`).
- **Debería:** enteros («41%», «21%») con `tabular-nums` (`04/categorias__telefono-claro.png`).
- **Arreglo:** `formatearPorcentaje` usado por `grafico-dona.tsx`.
- **Cómo verificar:** sin decimales.

### REP-11 · Top de comercios: tocable de 40 px — Top comercios · teléfono · baja
- **Se ve:** «5» mide 40 × 44 (`analisis/reporte-top-comercios__principal.md`).
- **Debería:** ≥ 44 × 44.
- **Arreglo:** el selector de límite en `[tipo]/vistas-detalle.tsx`.
- **Cómo verificar:** el análisis no marca tocables < 44.

### REP-12 · Hallazgos: tarjetas sin título ni acción como texto de tono, sin la introducción — Hallazgos · todas · media
- **Se ve:** cuatro avisos con el texto y un botón tonal azul dentro; sin título del hallazgo; encabezado «QUÉ AJUSTAR ESTE PERÍODO»; uno dice «(sin comercio) te cobra $104.75 cada mes» (`pliegue/reporte-hallazgos__principal__telefono-claro.png`).
- **Debería:** título en negrita por hallazgo («Ritmo alto en Restaurantes», «Pago de tarjeta próximo»), acción como enlace del color del tono («Reservar $18.75»), introducción «Hasta 5 hallazgos del período, cada uno con lo que podés hacer.» y sin encabezado de sección (`04/hallazgos__telefono-claro.png`).
- **Arreglo:** `[tipo]/hallazgos.tsx` y `AvisoEnLinea` (props `titulo` y `accion`); el texto sin comercio debe tener un caso propio en `textos/reportes.ts`.
- **Cómo verificar:** cada hallazgo tiene título y acción de tono.

### REP-13 · Hallazgos vacío: aviso de texto sin ícono ni tono positivo — Hallazgos · todas · baja
- **Se ve:** «Todo en orden: no encontramos nada que ajustar este período.» (`medidas/reporte-hallazgos__vacio__telefono-claro.json`).
- **Debería:** la tarjeta positiva con visto de `04/hallazgos-vacio__telefono-claro.png`. No se comparó la imagen: revisar.
- **Arreglo:** `[tipo]/hallazgos.tsx`.
- **Cómo verificar:** coincide con `hallazgos-vacio__*`.

### REP-14 · Sin movimientos: usa pastillas de cuentas y el título de sección — Reportes · todas · baja
- **Se ve:** estado vacío con el texto y «Ver 3 períodos» (`medidas/reportes__sin-movimientos__telefono-claro.json`).
- **Debería:** `04/sin-movimientos__telefono-claro.png`: gráfico sin datos en caja `--superficie-hundida` de 180 px con ícono `chart` (PANTALLAS §2.19). No se comparó la imagen.
- **Arreglo:** `[tipo]/pantalla.tsx` (estado vacío).
- **Cómo verificar:** caja hundida de 180 px con ícono.

### REP-15 · Tablas de «Tarjetas» y «Cumplimiento» sin diseño y con desborde — Tarjetas, Cumplimiento · teléfono · media
- **Se ve:** tablas de 5-6 columnas cortadas (ver REP-09).
- **Debería:** sin diseño (FALTANTES `reportes-otros`); mínimo, la tabla equivalente de §2.18.
- **Arreglo:** igual que REP-09.
- **Cómo verificar:** sin desborde.

### REP-16 · Gasto semanal: la barra superior es la de Reportes, no la de una pantalla hija — Gasto semanal · teléfono · alta
- **Se ve:** título «REPORTES», pastillas de tipo y encabezado «GASTO SEMANAL POR CATEGORÍA» (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** barra de hija: flecha «Volver a Reportes», título «GASTO SEMANAL» y campana, sin pastillas de tipo (PANTALLAS §10; `D2/una__telefono-claro.png`).
- **Arreglo:** `componentes/navegacion/secciones.ts` (`/reportes/gasto-semanal` como hija de `/reportes`) y `[tipo]/pantalla.tsx` (sin la fila de pastillas para este tipo).
- **Cómo verificar:** hay «Volver a Reportes» y no hay pastillas.

### REP-17 · Selector de período sin flechas — Gasto semanal · todas · media
- **Se ve:** tarjeta «21/04 – 20/05/2027 · Actual · 25 días transcurridos · quedan 5» sin botones (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** botones circulares «‹» «›» de 44 px a los lados (`D2/una__telefono-claro.png`).
- **Arreglo:** `[tipo]/vistas-semanal.tsx`.
- **Cómo verificar:** los dos botones navegan entre períodos.

### REP-18 · Selector de categorías sin muestra de color y con el activo en azul — Gasto semanal · todas · alta
- **Se ve:** pastilla activa «Supermercado» en `--accion` azul, sin muestra (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** pastilla activa con fondo `--texto` y una muestra de 10 px del color de su serie `grafico-serie-1…8`; con varias activas, cada una con su color (DECISIONES D2; `D2/una__…`, `D2/varias__…`).
- **Arreglo:** `[tipo]/vistas-semanal.tsx` (pastilla) y tokens `--grafico-serie-n` de `tokens.css`.
- **Cómo verificar:** la muestra de cada pastilla es el color de su serie en el gráfico.

### REP-19 · Resumen: «Referencia a esta semana» en lugar de «Referencia hoy» — Gasto semanal · todas · baja
- **Se ve:** «REFERENCIA A ESTA SEMANA $326.67» (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** «REFERENCIA HOY $326.67» (PANTALLAS §10: «Referencia hoy $326.67»).
- **Arreglo:** `textos/reportes.ts`.
- **Cómo verificar:** el rótulo coincide.

### REP-20 · Falta el selector «VER Gráficos | Tabla» general y se divide cada gráfico en su propia tarjeta — Gasto semanal · todas · alta
- **Se ve:** una sola tarjeta «POR SEMANA» con el selector adentro y las barras y la línea acumulada apiladas (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** «VER Gráficos | Tabla» sobre tres secciones con su título y tarjeta: «POR SEMANA», «ACUMULADO» y «CONTRA LOS 3 ANTERIORES» (`D2/una__telefono-claro.png`; PANTALLAS §10).
- **Arreglo:** `[tipo]/vistas-semanal.tsx` (tres `ContenedorGrafico`) y `vista-grafico.tsx`.
- **Cómo verificar:** hay tres tarjetas con título y un único selector «Ver».

### REP-21 · Barras por semana: sin cifra de la semana, sin degradado, sin «faltan 2 días» y sin leyenda — Gasto semanal · todas · media
- **Se ve:** el valor sobre cada barra y «43 % de la referencia / Vas $39.52 por debajo» fuera de la tarjeta; barras planas; la semana futura como contorno punteado sin texto (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** cifra «$35.00 · esta semana · en curso» y «43% de la referencia» dentro de la tarjeta, barras con degradado `--grafico-tinta` 100 → 62 %, «faltan 2 días» y leyenda «Gasto · Semana en curso · Referencia $81.67» (`D2/una__telefono-claro.png`; PANTALLAS §2.18).
- **Arreglo:** `componentes/graficos/grafico-barras.tsx` y `leyenda-grafico.tsx`.
- **Cómo verificar:** la tarjeta coincide con la referencia.

### REP-22 · Acumulado simplificado: sin área, referencia punteada, píldora ni distancia — Gasto semanal · todas · alta
- **Se ve:** una línea azul con puntos y dos etiquetas ($92.40 y $287.15), sin área, sin referencia, sin ejes ni leyenda (`reporte-gasto-semanal__una__telefono-claro.png`).
- **Debería:** línea suavizada con área en degradado, referencia acumulada punteada, proyección, punto actual con halo, píldora con el monto, distancia a la referencia («−$39.52 de la referencia», `--positivo-texto`), «Asignado $350.00» y la cifra «$287.15 · gastado en 25 de 30 días · Vas $39.52 por debajo» con el indicador positivo (`D2/una__telefono-claro.png`; K5-Nuevos__grafico-acumulado).
- **Arreglo:** `componentes/graficos/grafico-lineas.tsx` (versión «acumulado») y `[tipo]/vistas-semanal.tsx`.
- **Cómo verificar:** coincide con `K5-Nuevos__grafico-acumulado__*`.

### REP-23 · Gasto semanal en tabla: sin comparación de columnas ni la fila actual resaltada — Gasto semanal · todas · baja
- **Se ve:** `capturas/reporte-gasto-semanal__tabla__telefono-claro.png` (no se comparó pixel a pixel).
- **Debería:** Semana · Gasto (con barrita) · Ref. · Acum. · Ref. acum., la semana en curso en `--superficie-hundida` radio 10 (`S7-Semanal__vista-de-tabla.png`).
- **Arreglo:** `componentes/graficos/tabla-equivalente.tsx`.
- **Cómo verificar:** coincide con la referencia.

## Candidatos a global

- ACT-13: el botón «Registrar» de la barra superior del teléfono es un «+» sin etiqueta (aparece en todas las pestañas con barra de pestaña).
- ACT-17: la pastilla de estado bancario usa siempre el glifo `check`, también para «Pendiente».
- ACT-26: avisos de impacto (`AV-xx`) que se muestran como código crudo (faltan textos AV-03 y AV-07 en `textos/transaccion.ts`; revisar todos los flujos que usan `confirmacion-impacto.tsx`).
- ACT-32 y ACT-33: los flujos cortos se dibujan como página completa y con el primario en azul también para acciones destructivas; revisar los otros flujos cortos de la app (archivar, eliminar cuenta, etc.).
- ACT-12: resultados en el lugar sin `role="status"` al volver de un flujo.
- REP-01: Reportes no marca Presupuesto en la barra inferior (todas las rutas `/reportes/...`).
- REP-09: desborde horizontal de la página por tablas anchas sin contenedor con scroll; revisar todas las tablas equivalentes.

## Sin diseño

Tipos de reporte que la app muestra y no tienen referencia propia (FALTANTES `reportes-otros`); se capturaron igual:

- Flujo de efectivo: `capturas/reporte-flujo-efectivo__principal__telefono-claro.png` (y `-oscuro`, `computadora-claro`).
- Ritmo: `capturas/reporte-ritmo__principal__telefono-claro.png`.
- Realidad: `capturas/reporte-realidad__principal__telefono-claro.png`.
- Tarjetas: `capturas/reporte-tarjetas__principal__telefono-claro.png`, `capturas/reporte-tarjetas__con-ciclos__telefono-claro.png`.
- Hormiga: `capturas/reporte-hormiga__principal__telefono-claro.png`.
- Suscripciones: `capturas/reporte-suscripciones__principal__telefono-claro.png`.
- Remanente: `capturas/reporte-remanente__principal__telefono-claro.png`.
- Cumplimiento: `capturas/reporte-cumplimiento__principal__telefono-claro.png`.
- Patrimonio: `capturas/reporte-patrimonio__principal__telefono-claro.png`.
- Estado de carga de Reportes: `capturas/reportes__cargando__telefono-claro.png`.

Otros estados sin referencia propia (ya anotados como «sin referencia propia» en los casos): detalle de transacción dividida, por cobrar con cobro, con devolución y pendiente (`capturas/transaccion__dividida__…`, `transaccion__por-cobrar__…`, `transaccion__por-cobrar-con-cobro__…`, `transaccion__con-devolucion__…`, `transaccion__pendiente__…`); «Revisá el impacto» de la edición (`capturas/transaccion-editar__revisar-impacto__…`), «Revisar» de eliminar y de eliminar evento (`transaccion-eliminar__revisar__…`, `transaccion-eliminar-evento__revisar__…`), y devolver una compra dividida (`transaccion-devolver__dividida__…`). FALTANTES `editar-tx` («Editar transacción, estados completos») cubre los estados de edición: el diseño trae `editar`, `editar-conflicto` y `editar-cuenta-archivada`, y falta, por ejemplo, la edición de una dividida con conciliación, la edición con devolución (la app la resuelve con la cuenta fija y su motivo, que parece correcto) y el error de línea menor que los eventos.

Revisados solo por texto o sin comparar imagen: `actividad__cargando`, `reporte-gasto-semanal__tabla`, `__asignado-negativo`, `__categoria-nueva`, `__sin-movimientos`, `reporte-ingresos-gastos__principal`, `reporte-hallazgos__vacio`, `reportes__sin-movimientos`, y las variantes `telefono-oscuro` de todos los casos (se corrieron; solo se miró el estado principal por la analizadora).
