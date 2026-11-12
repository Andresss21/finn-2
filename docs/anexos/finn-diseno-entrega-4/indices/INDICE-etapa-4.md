# Finn 2.0 · exportación del diseño · entrega 4 · etapa 4 · Presupuesto, categorías y Más secciones

Fecha: 11/11/2026. Diseña los ítems 5, 6, 17, 18, 20, 21 y 25 de `docs/auditoria-diseno/PROMPT-DISENO.md` y aplica la corrección de D-11, con las respuestas del dueño del 11/11/2026. Las decisiones están en `DECISIONES.md`, sección «Entrega 4 · etapa 4» (E4-1 a E4-23), con su justificación, las alternativas descartadas, los textos nuevos y la tabla de filas que se sustituyen.

Esta etapa se suma a las etapas 1 a 3: el paquete trae solo lo nuevo y lo corregido.

## 1 · Qué hay

272 HTML (con `data-rol` y `var(--token)`) y sus 272 PNG (teléfono a 2×, computadora a 1×, con «reducir movimiento»).

**Estados nuevos** (cada uno en `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`):

| Carpeta | Estados |
|---|---|
| `pantallas/08-estructura-y-plantilla-inicial` | `estructura` (con «Archivadas · 2»), `archivadas-abiertas`, `desarchivada`, `nuevo-grupo`, `nuevo-grupo-nombre-vacio`, `nueva-categoria`, `nueva-categoria-nombre-repetido`, `editar-grupo`, `editar-categoria` |
| `pantallas/S3-detalle` | `archivada`, `archivada-mas-acciones`, `desarchivada`, `periodo-cerrado-mas-acciones` |
| `pantallas/S2-presupuesto` | `periodo-de-transicion`, `primer-periodo`, `filtro-sin-fondos` |
| `pantallas/06-detalle-de-cuenta` | `periodo-actual`, `periodo-anterior`, y los pasos `nueva-cuenta-impacto`, `pagar-tarjeta-impacto` |
| `pantallas/07-flujos-del-presupuesto` | `archivar-categoria-impacto`, `fusionar-impacto` |
| `pantallas/03-detalle-de-transaccion` | `eliminar`, `eliminar-impacto`, `eliminar-evento`, `eliminar-evento-impacto` |
| `pantallas/09a-metas` | `editar`, `editar-eliminar`, `vencida-extender`, `vencida-ajustar`, `extendida` |
| `pantallas/09b-programadas` | `nueva`, `editar` (sustituye al de la entrega 2), `editar-sin-historial`, `eliminar-programada`, `ocurrencia-omitida`, `lista` (corregida) |
| `pantallas/09c-por-cobrar` | `cerrados` |
| `pantallas/09d-reglas` | `editar`, `eliminar-confirmar`, `sin-coincidencias` |

**Correcciones de referencias aprobadas** (mismo nombre de archivo; sustituyen al anterior):
- Quitar el impacto en vivo (E4-2 a E4-4): los 13 estados de `S5-registrar`; en `01-revisar-movimiento`, `listo`, `dividido`, `pago-de-tarjeta`, `devolucion`, `ingreso`, `no-reconocido-a-mano`, `datos-faltantes`, `aprobando` y `periodo-cerrado` (paso con AV-01); en `03-detalle-de-transaccion`, `conciliada`, `editar`, `editar-conciliada` y `editar-conciliada-solo-categoria` (paso con AV-16), `editar-dividida-parte-menor` y `editar-con-devolucion`; en `12-registrar-tipos-y-flujos-cortos`, `ingreso`, `retroactivo` (paso con AV-01), `inversion-retiro`, `inversion-ajuste`, `entrada-a-tarjeta`, `avance-guardado`, `selector`, `una-cuenta-de-efectivo` y `sin-cuentas`.
- `S2-presupuesto`: los 5 estados aprobados, con el selector de períodos como enlaces (E4-10).
- `S3-detalle`: los 7 estados aprobados en computadora, con «Más acciones» (E4-8).
- `07-flujos-del-presupuesto`: archivar y fusionar en computadora a una columna de 720 px y sin campana; archivar con la decisión por programada (E4-24, E4-26).
- `08-estructura-y-plantilla-inicial`: «Subir» y «Bajar» con sus chevrones visibles (FT-18).
- `09a`–`09d`: todas las vistas de computadora de la entrega 2, con la fila activa correcta en la barra lateral (E4-23); en `09b`, `ocurrencia` y `ocurrencia-resuelta` con la lista corregida (E4-20).

Otros archivos:
- `DECISIONES.md`: sección «Entrega 4 · etapa 4».
- `FALTANTES.md`: lo de esta etapa marcado como diseñado y nueve filas nuevas (tres decisiones pendientes, cinco pendientes para la etapa 6 y los datos de ejemplo para el cierre).
- `herramientas/`: generadores (`lib*.py`, `gen_*.py`, `gen3_*.py`, `post3.py`), `renderizar.py`, `contraste_dom.py`, `barra_lateral3.py`, el armador de tableros con su `spec4.json` y `colocar4.py`.
- El prompt de desarrollo de la etapa 1 (§5 y CA-E4-21 a CA-E4-21d) quedó reescrito según la corrección de D-11; va al PROMPT-DESARROLLO único del cierre.

Cada estado parte de una referencia aprobada y cambia solo lo que cambia el estado: Estructura, Metas, Programadas, Por cobrar, Reglas y el detalle de cuenta, de la entrega 2; el detalle de categoría y Presupuesto, de la etapa 1; el menú «Más acciones», de `MA-detalle-de-categoria-mas-acciones` de la entrega 2.

## 2 · Componentes

Piezas nuevas, todas con tokens:
- **Paso «Revisá el impacto»** con la tarjeta K4 «Confirmación del impacto» (rótulo «Antes de confirmar»): reemplaza el formulario en hoja, panel o pantalla; en computadora, una columna de 720 px (E4-1).
- **Dato fijo**: rótulo, `lock`, valor en negrita y una línea con el porqué (E4-16).
- **Confirmar dentro del flujo**: caja `--problema-fondo` con la pregunta, qué cambia y qué no, «Cancelar» y «Eliminar» de peligro (E4-17).
- **Sección plegable** «Archivadas · N» / «Cerrados · N».
- **Campo con foco** (`--foco` de 3 px y anillo `--accion-tonal`), para los estados que abren con un campo enfocado.

Se usan además: hoja y panel lateral de 440 px, menú «Más acciones» de la entrega 2, aviso en línea (§2.14), resultado en el lugar (§2.13), botón deshabilitado con su motivo y glifo, SelectorPeriodo y el vacío punteado.

## 3 · Movimiento

Sin movimiento nuevo. Las hojas, el panel y el menú entran como en la referencia (`fz-sh-in`, `fz-v-in`, `fz-pop-in`); el resultado, con `fz-pop-in`. Con «reducir movimiento» no se anima nada.

## 4 · Contraste de los pares nuevos

Medido con los valores de `tokens.css`, en claro y en oscuro. Además se midió cada texto renderizado contra su fondo real en los archivos de esta etapa (`herramientas/contraste_dom.py`): todo pasa salvo los controles deshabilitados, que WCAG exime y que llevan su motivo escrito, y los textos sobre la cara de la tarjeta (degradado, medidos en la etapa 1). Ningún valor suelto nuevo frente a las referencias aprobadas.

| Qué | Par | Claro | Oscuro | Mínimo | |
|---|---|---|---|---|---|
| Período de transición | `informacion-texto` sobre `superficie` | 7.09:1 | 8.98:1 | 4.5:1 | ✓ |
| Confirmar en línea: pregunta | `problema-texto` sobre `problema-fondo` | 4.55:1 | 6.75:1 | 4.5:1 | ✓ |
| Confirmar en línea: detalle | `texto` sobre `problema-fondo` | 15.13:1 | 13.74:1 | 4.5:1 | ✓ |
| «Eliminar» de la confirmación | `texto-sobre-peligro` sobre `peligro` | 6.57:1 | 7.51:1 | 4.5:1 | ✓ |
| «Eliminar meta / regla / programada» (enlace) | `problema-texto` sobre `superficie` | 5.56:1 | 7.48:1 | 4.5:1 | ✓ |
| AV-14: «Elegir destino y monto» | `advertencia-texto` sobre `advertencia-fondo` | 5.40:1 | 8.62:1 | 4.5:1 | ✓ |
| Chip «Archivada el…» | `informacion-texto` sobre `fondo` | 6.30:1 | 9.81:1 | 4.5:1 | ✓ |
| Monto de un por cobrar cerrado | `texto-secundario` sobre `superficie` | 8.40:1 | 8.45:1 | 4.5:1 | ✓ |
| Estado «Cobrado» | `positivo-texto` sobre `superficie` | 6.40:1 | 9.27:1 | 4.5:1 | ✓ |
| Estado «Condonado» | `informacion-texto` sobre `superficie` | 7.09:1 | 8.98:1 | 4.5:1 | ✓ |
| Campo con foco: línea | `foco` sobre `superficie` | 7.29:1 | 6.20:1 | 3:1 | ✓ |
| «Desarchivar» tonal | `accion` sobre `accion-tonal` | 6.02:1 | 5.37:1 | 4.5:1 | ✓ |
| Dato fijo: candado | `texto-secundario` sobre `superficie` | 8.40:1 | 8.45:1 | 3:1 | ✓ |
| Fila activa: marca de 3 px | `accion` sobre `superficie-hundida` | 5.96:1 | 6.99:1 | 3:1 | ✓ |

## 5 · Canvas

Tableros nuevos al final de su fila: en «Inicio y Presupuesto», E4-E4-Periodos (a, b) y E4-E4-Confirmar-Flujos; en «Detalle de categoría», E4-E4-Estructura (a, b) y E4-E4-Detalle-Archivada (a, b); en «Bandeja y Registrar», E4-E4-Confirmar-Registrar (a, b); en «Actividad y Reportes», E4-E4-Confirmar-Transaccion (a, b); en «Más secciones y Ajustes», E4-E4-Metas, E4-E4-Programadas (a, b) y E4-E4-Por-Cobrar-y-Reglas. No se movió nada a Historial: 12 notas naranjas dicen qué parte de cada tablero anterior sustituye o corrige esta etapa (D-11 en Decisiones, S5, S2, S3, los de la etapa 3 de Revisar, Registrar y Editar, y los de la entrega 2 de Revisar, Detalle de transacción, Metas y Programadas). Las filas de abajo se corrieron para dejar 600 px antes de cada título.

## 6 · Demo

La demo navegable se actualiza al cierre, con todas las etapas juntas (lo acordado).

## 7 · Revisión independiente

Un agente que no participó revisó la etapa completa (los PNG, el HTML, DECISIONES, FALTANTES, el INDICE y la semilla del prompt, contra 04, 05, 06 y las referencias). Encontró 2 bloqueantes, 12 importantes y unos 20 menores; esto es lo que se hizo.

| Hallazgo | Qué se hizo |
|---|---|
| **Bloqueante.** Eliminar y eliminar evento en computadora: el panel conservaba el impacto calculado de PRICESMART y no tenía botones; el fondo mezclaba PRICESMART, fechas posteriores a hoy y una conciliación contradictoria | El panel se arma igual que en el teléfono; el fondo es PIZZA HUT con su SMS y su conciliación; fechas al 15/10 |
| **Bloqueante.** «Archivar» en el menú de un período cerrado | Fuera (D-5); E4-9 lo dice |
| Campana y dos columnas en flujos largos de computadora | Sin campana en archivar, fusionar, nueva cuenta, editar y programadas; archivar, fusionar y programadas a 720 px (E4-26). Editar transacción sigue en dos columnas (E3-10) |
| «Eliminar programada» deshabilitado con historial | No se ofrece (06 CA-40.3); E4-19 |
| Programada con historial y primera fecha posterior a hoy | 17/01/2026; frecuencia y primera fecha como dato fijo |
| Fusionar sin Listo para asignar y con el estado de tarjeta en un sobregiro de débito | Fila de Listo para asignar; indicadores de 05 §10.3 en toda tarjeta K4, también el mixto y «Pago excedente» (E4-25) |
| Archivar sin poder decidir sobre la programada | «Desactivarla» / «Pasarla a otra categoría» (E4-24) |
| Subtotales del período futuro y de transición, y arrastres en el primer período | Recalculados (E4-27) |
| AV-01 de un gasto con tarjeta bajaba Listo para asignar; doble cuenta en el retroactivo | Con tarjeta no cambia: suma a «te falta reservar»; el retroactivo sin la fila repetida (E4-28) |
| Conciliaciones y saldos cruzados entre pantallas de distintas entregas | A FALTANTES `datos-ejemplo`, para el juego de datos único del cierre. Las conciliaciones del 14/10 ya existían en el detalle de Cuenta corriente aprobado |
| «Subir» y «Bajar» de Estructura invisibles o con el chevrón al revés | Corregidos en todos los estados |
| «Ir al grupo Mascotas» sin destino | Se mantiene, porque lo pidió el dueño; el destino queda con `desarchivar-grupo` en FALTANTES como decisión pendiente |
| Diálogos sin nombre accesible | `aria-labelledby` al título en todos (comprobado en los 272 archivos) |
| Monto de la meta vencida calculado por la interfaz | Abre con el monto actual; «Eliminar meta» también en esa hoja |
| Texto del push de cierre | El de 04 §11.4 y CA-71.1 (E4-14) |
| «Asignar» de la franja como botón | Enlace, en todos los estados de S2 |
| `aria-controls` sin destino, botones deshabilitados sin foco, menú con un rótulo dentro | Lista en el DOM con `hidden`; `aria-disabled` en las acciones bloqueadas nuevas; rótulo con `role="presentation"` y `aria-controls` en «Más acciones» |
| Nota de Ingreso distinta de E4-3; motivo del menú cerrado sin el nombre | E4-3 nombra la nota; el motivo usa el texto del catálogo con el nombre |
| CA-E4-21b sin el par de botones de eliminar | Agregado |
| Motivo de «suma distinta» en el teléfono (heredado) | FALTANTES `s5-motivo-suma`, etapa 6 |
| Valores sueltos en animaciones heredadas, tocables de 40 px heredados | Siguen en `decision-tokens-movimiento` y `heredados-menores` |

Después de los cambios: los 272 archivos se volvieron a renderizar, el contraste se midió otra vez (solo quedan los deshabilitados con su motivo), no hay valores sueltos nuevos frente a las referencias aprobadas, y todo `aria-describedby`, `aria-labelledby` y `aria-controls` apunta a un id que existe.
