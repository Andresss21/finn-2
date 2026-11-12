# Finn 2.0 · exportación del diseño · entrega 4 · etapa 6 · Estados transversales, marco de 768–1023 y heredados

Fecha: 11/11/2026. Cierra las filas de FALTANTES de la etapa 6 con las respuestas del dueño del 11/11/2026. Las decisiones están en `DECISIONES.md`, sección «Entrega 4 · etapa 6» (E6-1 a E6-24), con la justificación, las alternativas descartadas, los textos nuevos y lo que sustituyen. La misma sección de la etapa 5 suma las respuestas del dueño a sus pendientes (textos aprobados con su destino, excepción de D-1, selector de reportes y clases de ruta de Ajustes).

Esta etapa se suma a las etapas 1 a 5: el paquete trae solo lo nuevo y lo corregido.

## 1 · Qué hay

373 HTML (con `data-rol` y `var(--token)`) y sus 373 PNG (teléfono a 2×, tableta y computadora a 1×, con «reducir movimiento»).

**Estados nuevos** (en `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`; `T4-tableta` solo en `__tableta-claro`, a 768 px):

| Carpeta | Estados |
|---|---|
| `T1-carga` | `inicio`, `presupuesto`, `cuentas`, `actividad`, `reportes`, `ajustes`, `detalle`, `flujo-corto` |
| `T2-navegacion` | `en-curso` |
| `T3-errores-de-flujo` | `corto-ocupado`, `corto-incierto`, `largo-validacion`, `largo-interno`, `largo-conflicto-id`, `version-nueva-en-un-flujo`, `arrastre-conflicto`, `lote-en-curso`, `lote-rechazo` |
| `T4-tableta` | `inicio`, `presupuesto`, `registrar-gasto`, `revisar-movimiento`, `flujo-corto` |
| `14-sin-conexion-404-y-error-de-pantalla` | `sin-conexion-navegacion-bloqueada`, `sin-conexion-flujo-corto`, `sin-conexion-revisar`, `sin-conexion-bandeja`, `sin-conexion-nueva-cuenta`, `sin-conexion-pagina-con-borrador`, `version-nueva`, `no-encontrado-al-enviar`, `transferencia-con-una-cuenta` |
| `K1-navegacion` | `notificaciones-vacio`, `notificaciones-todo-leido`, `notificaciones-error` |
| `S6-cuentas` | `menu-abierto` |
| `06-detalle-de-cuenta` | `filtro-sin-resultados`, `eliminar-impacto` |
| `07-flujos-del-presupuesto` | `auto-asignar-impacto` |
| `11-ajustes` | `ciclo-impacto`, `ciclo-mismo-dia` |
| `09a-metas` · `09b-programadas` · `09d-reglas` | `meta-eliminada`, `meta-ajustada` · `desactivada`, `eliminada` · `regla-eliminada` |
| `04-reportes` | `ritmo-asignado`, `tarjetas-reservado`, `suscripciones-programada`, `suscripciones-desactivada`, `suscripciones-reactivada`, `realidad-ajustar`, `realidad-ajustado` |
| `01-revisar-movimiento` | `traspaso-confirmar`, `traspaso-falta-dato` |
| `S4-bandeja` | `arrastre-regla-propuesta`, `arrastre-regla-creada` |

**Correcciones de referencias aprobadas** (mismo nombre de archivo; sustituyen al anterior):
- `04-reportes`: `categorias` (E6-22), `tendencia` y `tendencia-tabla` (E6-23), `top-comercios` (E6-24).
- `14-…`: `sin-conexion-en-la-app` (sin «Antes de guardar» en computadora y con el motivo enlazado), `sin-conexion-pagina` (texto de 05 §8.5) y `error-de-pantalla` (referencia «E-7K2QPX»).
- Pasada de heredados (E6-17 a E6-21), solo en las variantes que cambian: los textos de 06 §5.6 en Inicio, Presupuesto, Cuentas, Gasto semanal y en todo flujo que los muestra de fondo (`05-…`, `07-…`, `15-…`, `16-salir`, `D2-…`, `D3-…`, `K1-…`, `14-…`); el título de Presupuesto en el teléfono; la barra fija y el motivo de «suma distinta» en `S5-registrar`; los botones de fila, el asa reservada y la insignia en `S4-bandeja`; «Quitar» de `11-ajustes/notificaciones*`; «Inactivo» en `11-ajustes/formatos*`; y el símbolo y las filas de 44 de la barra lateral en toda vista de computadora entregada. La lista exacta es la de las carpetas del paquete.

Otros archivos:
- `DECISIONES.md`, `FALTANTES.md` (todas las filas de la etapa 6 cerradas; quedan `datos-ejemplo` para el cierre, `reprocesar-conteo` como criterio y `formato-historial` solo si el dueño lo pide).
- `prompt/`: semillas `etapa-5.md` y `etapa-6.md` del PROMPT-DESARROLLO único, y `CAMBIOS-PROPUESTOS.md` con CH-E5-1 a CH-E5-4, sin aplicar.
- `herramientas/`: generadores de la etapa (`lib6.py`, `gen_carga.py`, `gen_transversales.py`, `gen_flujos6.py`, `gen_tableta.py`, `gen_heredados.py`, `gen_reportes6.py`), `post3.py`, `renderizar6.py` (agrega la tableta), `contraste_dom.py`, el armador de tableros con `spec6.json` y `colocar6.py`.

## 1b · Para tener en cuenta

1. **«Reintentar» o «Intentar de nuevo».** En el error del panel de notificaciones usé «Intentar de nuevo», que es el texto de 05 §7.3 para el error de pantalla. Si preferís «Reintentar», es un CH a 05 que cambia todas las pantallas de error.
2. **Cambiar el ciclo es un flujo corto** (05 §2.11, [C]); la entrega 2 lo dibujaba como página. Se siguió 05.
3. **15 tipos de reporte.** 05 §2.10 lista 8 y la Fase 6 agrega 7: 15 en total. CH-E5-1 lo dice así.
4. **Tocables de 44 px:** se redibujaron en lo que esta etapa vuelve a entregar; en los PNG anteriores, manda la regla E6-18 (no se volvieron a entregar ~400 pantallas solo por la medida).

## 2 · Componentes

- **Esqueleto** (`Esqueleto` de 05 §10.7): barras de 12 px con radio 4, círculos del tamaño del ícono, bloque de gráfico de 168 px; todo en `--superficie-hundida`, sin animación (E6-1).
- **Señal de navegación**: punto de 8 px en el enlace y franja de 3 px `role="progressbar"` (E6-2).
- **Aviso del marco** («Estás sin conexión», «Hay una versión nueva de Finn.» con «Recargar»), con la forma aprobada (E6-3, E6-8).
- **Error del formulario**: caja `--problema-fondo` con `role="alert"` arriba del pie, con su acción (E6-5).
- **Resultado con salida para revertir**: el de 05 §4.14, con «Deshacer», «Reactivar» o «Desactivarla» tonal de 44 (E6-14, E6-15).
- **Marco de 768**: el de teléfono con el contenido a 640 (E6-10).

## 3 · Movimiento

Sin movimiento nuevo dibujado. La franja de navegación avanza con los tokens de movimiento de D-10 y queda fija con «reducir movimiento».

## 4 · Contraste

Cada texto renderizado de los 373 archivos se midió contra su fondo real (`contraste_dom.py`): todo pasa salvo los controles deshabilitados, que WCAG exime y llevan su motivo escrito, y los textos sobre la cara de las tarjetas (degradado, medidos en la etapa 1). Ningún valor suelto nuevo frente a las referencias aprobadas; todo `aria-*` y `for` apunta a un id que existe.

## 5 · Canvas

Tableros nuevos al final de su fila: en «Acceso, marco y Salir», E4-E6-Carga (a–c), E4-E6-Navegacion-y-Sin-Conexion (a, b), E4-E6-Errores-de-Flujo (a–d) y E4-E6-Panel-y-Tableta (a, b; la tableta lleva su columna «Tableta claro · 768»); en «Inicio y Presupuesto», E4-E6-Heredados (a–c); en «Cuentas», E4-E6-Cuentas-e-Impacto (a, b); en «Más secciones y Ajustes», E4-E6-Resultados (a–d). No se movió nada a Historial: 10 notas naranjas dicen qué corrige o completa esta etapa en E2-14, K1, S1, S2, S4, S5, S6, S7, E2-04 Reportes y E2-11 Ajustes. Las filas de abajo se corrieron para dejar 600 px antes de cada título.

## 6 · Demo

La demo navegable se actualiza al cierre, con todas las etapas juntas (lo acordado).

## 7 · Revisión independiente

Un agente que no participó revisó la etapa completa (PNG, HTML, DECISIONES, FALTANTES y las semillas, contra 04, 05, 06 y las referencias). Encontró 2 bloqueantes, 14 importantes y 16 menores; esto es lo que se hizo.

| Hallazgo | Qué se hizo |
|---|---|
| **Bloqueante.** El conflicto después de soltar comparaba un saldo, que OP-37 no usa | Compara la categoría que se vio con la de ahora; la categoría soltada queda puesta (E6-5) |
| **Bloqueante.** `sin-conexion-en-la-app` en computadora conservaba «Antes de guardar» | Fuera, con el motivo de «Guardar» enlazado; la pasada lo quita en cualquier pantalla |
| Esqueletos con roles y nombres de datos, y el anuncio dentro de la región ocupada | Roles fuera, hijos `aria-hidden`, anuncio fuera de la región, «Cargando categoría», títulos de sección en esqueleto donde dependen de los datos (E6-1) |
| Tocables de 40 (los «+» de asignar), el nombre de las programadas de 24, vistas oscuras de computadora con «F» y filas de 40 | A 44; el símbolo y las filas de 44 también en las oscuras de la etapa 1 |
| Sin conexión en la Bandeja: «Descartar» y el arrastre activos | Deshabilitados con el aviso como motivo, que ahora nombra el arrastre |
| Resultados junto a cifras viejas (Ritmo, Suscripciones, Programadas) | Dibujadas como vuelven del servidor: Ritmo recalculado, SPOTIFY en «Ya programadas», Netflix en pausadas |
| Meta ajustada que desaparecía | Sigue en la lista, actualizada, con el resultado debajo |
| Transferir con una cuenta como hoja | Página completa (05 §1.4) |
| Resumen de validación con texto propio | El `mensaje` del servidor, «Revisá los campos marcados.»; el campo sin alerta propia |
| Texto de `/sin-conexion` distinto de 05 §8.5 y referencia «FIN-…» | Textos de 05 y formato «E-7K2QPX» en las pantallas que los muestran |
| Panel vacío o todo leído con «2 sin leer» en el marco; nombre del diálogo | Sin insignias; el diálogo se nombra por «Notificaciones»; «Copiar la referencia» en el error |
| E5-11 contradecía D-1 | Corregido: Registrar gasto y Revisar siguen en dos columnas |
| Error de los flujos largos lejos del formulario en el teléfono | Al final del formulario, justo antes de la barra fija |
| Barra fija a 16 px en otros flujos; montos sin cifras tabulares en botones | 20 px y cifras tabulares (E6-18) |
| Signo de «PRICESMART», «Eliminar Ahorro navideño» partido, causa inventada en «Esto ya no existe.», `ciclo_sin_cambio` con dos motivos | −$148.60; «Eliminar cuenta»; solo el texto del servidor; el mensaje en el campo y el botón enlazado a él |
| «Intentar de nuevo» junto al botón principal en los errores | Se mantiene: es lo que pide 05 §4.7 para `OCUPADO`, `INCIERTO` e `INTERNO` |
| Datos cruzados (Viaje, categorías de Categorías, regla propuesta, Netflix en Ritmo), colores sueltos heredados y Tendencia con solo gastos en el gráfico | A FALTANTES `datos-ejemplo`, para el juego de datos único del cierre |
| Cobertura (hallazgo que reaparece, propuestas de Flujo y Hallazgos, carga genérica) | Criterios del PROMPT (CA-E6-17); el detalle de categoría es la carga genérica |

Después de los cambios: los 373 archivos se volvieron a renderizar, el contraste pasa (salvo los deshabilitados con motivo y las caras de las tarjetas), no hay valores sueltos nuevos y todo `aria-*`, `for` y diálogo tiene su destino y su nombre.
