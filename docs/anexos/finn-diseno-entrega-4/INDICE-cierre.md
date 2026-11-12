# Finn 2.0 · exportación del diseño · cierre (entrega 4)

Fecha: 11/11/2026. Cierra la entrega 4: un solo juego de datos en las referencias, la demo navegable con todas las pantallas y estados, un solo PROMPT-DESARROLLO y los CH aprobados aplicados a 04, 05 y 06 con la marca [D4]. Las decisiones están en `DECISIONES.md`, sección «Cierre del diseño» (C-1 a C-25), y el juego de datos en `DATOS-EJEMPLO.md`.

El cierre se suma a las etapas 1 a 6: el paquete trae solo lo que cambia. La versión vigente de un estado es la de la entrega más reciente que lo dibujó (cierre, etapa 6, 5, 4, 3, 2, 1, entrega 3, entrega 2).

## 1 · Qué hay

- `pantallas/`: 878 HTML (con `data-rol` y `var(--token)`) y sus 878 PNG (teléfono a 2×, tableta y computadora a 1×, con «reducir movimiento»). Ningún estado nuevo: son estados existentes con los datos de A.7 corregido.
- `DATOS-EJEMPLO.md`: el juego de datos, las decisiones C-1 a C-20 y los estados que ilustran otra situación.
- `prompt/PROMPT-DESARROLLO.md`: el único prompt para la implementación; reemplaza las semillas de las etapas 1, 5 y 6.
- `docs/04-backend.md`, `05-frontend.md`, `06-features.md`: los documentos con los CH aplicados (también escritos en el proyecto).
- `herramientas/cierre/`: `datos.py` (el juego de datos con `comprobar()`), `gen_datos.py` y sus reglas, `post_cierre.py`, `pipeline.sh`, `auditar.py`, la demo (`demo/construir.py` y `demo/empaquetar.py`) y `aplicar_d4.py`.
- `DECISIONES.md` y `FALTANTES.md` al día.

## 2 · Estados que cambian, por carpeta

| Carpeta | Estados | Con cambios de datos (los demás cambian solo la insignia de la Bandeja) |
|---|---|---|
| `01-revisar-movimiento` | 2 | solo la insignia de la Bandeja |
| `02-actividad` | 8 | `buscando`, `cargando`, `cargar-mas`, `filtrado`, `filtros`, `lista` |
| `03-detalle-de-transaccion` | 20 | `cambiar-estado`, `conciliada`, `editar`, `editar-conciliada`, `editar-conciliada-solo-categoria`, `editar-conflicto`, `editar-dividida-parte-menor`, `eliminada`, `eliminar-bloqueado`, `eliminar-evento`, `eliminar-evento-impacto`, `mas-acciones`, `principal` |
| `04-reportes` | 30 | `categorias`, `cumplimiento`, `filtro-de-cuentas`, `flujo-efectivo`, `flujo-efectivo-una-cuenta`, `hallazgos`, `hallazgos-vacio`, `hormiga`, `hormiga-vacio`, `ingresos-gastos`, `patrimonio`, `patrimonio-tabla`, `realidad`, `realidad-ajustado`, `realidad-ajustar`, `remanente`, `ritmo`, `ritmo-asignado`, `selector-de-tipos`, `sin-movimientos`, `suscripciones`, `suscripciones-desactivada`, `suscripciones-programada`, `suscripciones-reactivada`, `suscripciones-sin-historia`, `tarjetas`, `tarjetas-reservado`, `tendencia`, `tendencia-tabla`, `top-comercios` |
| `05-detalle-de-listo-para-asignar` | 3 | `negativo`, `principal`, `tabla` |
| `06-detalle-de-cuenta` | 45 | `ajuste-registrado`, `archivar-bloqueado`, `archivar-tarjeta`, `conciliada`, `conciliar-resultado`, `corriente`, `cuota`, `cuota-no-cuadra`, `eliminar-bloqueado`, `filtro-sin-resultados`, `mas-acciones`, `mas-acciones-tarjeta`, `ordenar`, `pagar-saldo-a-favor`, `pagar-tarjeta`, `pagar-tarjeta-impacto`, `periodo-actual`, `periodo-anterior`, `prestamo`, `saldo-verificado`, `tarjeta`, `tarjeta-pagada`, `verificar-diferencia`, `verificar-saldo`, `verificar-saldo-tarjeta` |
| `07-flujos-del-presupuesto` | 15 | `archivar-categoria`, `archivar-categoria-impacto`, `asignado`, `asignar`, `asignar-conflicto`, `asignar-periodo-cerrado`, `auto-asignar`, `auto-asignar-cubiertas`, `auto-asignar-impacto`, `fusionar`, `fusionar-destino-archivado`, `fusionar-impacto`, `mover-dinero`, `mover-excede`, `sacar-de-archivada` |
| `08-estructura-y-plantilla-inicial` | 17 | `archivadas-abiertas`, `desarchivada`, `desarchivada-con-grupo`, `editar-categoria`, `editar-grupo`, `estructura`, `estructura-movida`, `nueva-categoria`, `nueva-categoria-nombre-repetido`, `nuevo-grupo`, `nuevo-grupo-nombre-vacio` |
| `09a-metas` | 11 | `editar`, `editar-eliminar`, `lista`, `meta-eliminada`, `nueva`, `vencida`, `vencida-ajustar`, `vencida-extender` |
| `09b-programadas` | 11 | `desactivada`, `eliminada`, `lista` |
| `09c-por-cobrar` | 6 | `cerrados`, `cobrar`, `condonar`, `lista`, `renombrar-repetido` |
| `09d-reglas` | 8 | `editar`, `eliminar-confirmar`, `lista`, `nueva`, `nueva-repetida`, `regla-eliminada` |
| `10-notificaciones` | 3 | solo la insignia de la Bandeja |
| `11-ajustes` | 39 | `ciclo-impacto`, `ciclo-mismo-dia`, `formatos`, `formatos-guardado`, `indice`, `indice-instalar`, `indice-instalar-iphone`, `institucion-nombre-repetido`, `institucion-nueva`, `institucion-renombrar`, `instituciones`, `quitar-factor`, `seguridad-factor-agregado` |
| `12-registrar-tipos-y-flujos-cortos` | 16 | `inversion` |
| `14-sin-conexion-404-y-error-de-pantalla` | 9 | `no-encontrado-al-enviar`, `sin-conexion-navegacion-bloqueada`, `version-nueva` |
| `15-inicio-y-presupuesto-piezas-nuevas` | 5 | `herramientas`, `lpa-negativo`, `primeros-pasos`, `ritmo-y-tarjetas` |
| `16-salir` | 11 | `ajustes-indice`, `cambios-error`, `cambios-saliendo`, `cambios-sin-enviar`, `cambios-sin-enviar-uno`, `mas-secciones`, `mas-secciones-error`, `mas-secciones-saliendo`, `mas-secciones-sin-conexion` |
| `D2-gasto-semanal-paleta-validada` | 2 | solo la insignia de la Bandeja |
| `D3-presupuesto-filtros-que-se-desplazan` | 2 | `cubiertas`, `todas` |
| `K1-navegacion` | 5 | `notificaciones-abiertas-n7`, `notificaciones-error`, `notificaciones-todo-leido`, `notificaciones-vacio`, `principal` |
| `MA-detalle-de-categoria-mas-acciones` | 3 | `abierto`, `cerrado` |
| `S1-inicio` | 4 | `activar-notificaciones`, `listo-para-asignar-negativo`, `principal`, `todo-al-dia` |
| `S2-presupuesto` | 8 | `filtro-sin-fondos`, `filtro-sobregiradas`, `periodo-cerrado`, `periodo-de-transicion`, `periodo-futuro`, `primer-periodo`, `principal`, `sin-resultados` |
| `S3-detalle` | 12 | `categoria-de-pago-de-tarjeta`, `historial-como-tabla`, `mover-resultado`, `periodo-cerrado`, `periodo-cerrado-mas-acciones`, `principal`, `sin-movimientos` |
| `S4-bandeja` | 10 | `arrastre-otra-categoria`, `arrastre-sobre-destino`, `arrastre-tomado`, `muchos` |
| `S5-registrar` | 13 | solo la insignia de la Bandeja |
| `S6-cuentas` | 7 | `archivadas-visibles`, `con-billetera`, `menu-abierto`, `principal`, `tarjeta-con-saldo-a-favor-mastercard-al-frente`, `una-tarjeta` |
| `S7-semanal` | 5 | solo la insignia de la Bandeja |
| `T1-carga` | 8 | `flujo-corto` |
| `T2-navegacion` | 1 | `en-curso` |
| `T3-errores-de-flujo` | 6 | solo la insignia de la Bandeja |
| `T4-tableta` | 2 | `inicio`, `presupuesto` |

## 3 · Qué cambió y en cuántos archivos

| Archivos | Cambio |
|---|---|
| 807 | Bandeja: 2 por revisar fuera de la Bandeja (CT-07) |
| 59 | Detalle de cuenta: movimientos y saldos corridos del juego de datos; Visa Oro con el corte del 25/09 y el pago de $200.00 |
| 54 | Presupuesto: Farmacia en Casa, $12.35 · $12.35 · $0.00 (CT-07) |
| 53 | Presupuesto: grupo Deudas con Cuota del préstamo $210.00 (CT-07) |
| 53 | Inicio: 5 cosas que atender (sin archivadas con Disponible, CT-07) |
| 51 | totales del Presupuesto $997.84 (CT-07) |
| 50 | Visa Oro: para no generar intereses $370.63 (CT-07) |
| 45 | totales del Presupuesto $647.95 (CT-07) |
| 42 | totales del Presupuesto $1,784.51 (CT-07) |
| 38 | Reportes: «Tendencia» (el gráfico muestra los gastos y la tabla, ingresos y gastos) |
| 33 | Estructura: los 6 grupos de A.7 (Farmacia en Casa, Deudas); sin Café; Restaurantes sin meta |
| 30 | Transacción PRICESMART (rama después de guardarla): eventos del 15/10 y números con A.7 |
| 29 | Ajustes: 4 formatos activos |
| 29 | Ajustes: Primeros pasos completos (3 de 3) |
| 27 | Porcentajes redondeados como 04 (97.08 %, 36.11 %) |
| 26 | Cuenta corriente: su programada es el aporte al depósito; la cuota sale de Cuenta de ahorro (A.7) |
| 25 | Inicio: recientes de A.7 (13/10 PIZZA HUT) |
| 21 | Restaurantes: historial con arrastre (CT-07 §28.2 n.º 1) |
| 15 | Por cobrar: en camino $40.00 baja Listo para asignar $40.00 |
| 15 | Por cobrar: Carlos, CINEMARK 04/10 con débito, $40.00 |
| 15 | Reglas: las 6 del juego de datos (PIZZA HUT y LA PAMPA → Restaurantes, UNO → Gasolina; SMART FIT → Gimnasio no se aplica) |
| 15 | Inicio: hallazgo de ritmo con el texto de CA-62.3 |
| 15 | Bandeja: el arrastre es FARMACIA SAN NICOLAS → Farmacia (06 §4.2 paso 4); la regla propuesta no choca con SUPER SELECTOS → Supermercado |
| 15 | Cuentas: Cuenta corriente sin diferencia (A.7: conciliada el 30/09 sin diferencia), confirmado $1,296.95 |
| 13 | Metas: Viaje anual $1,200.00, falta $92.31 (A.7) |
| 12 | Instituciones: formatos y cuentas de cada una |
| 10 | Bandeja: la insignia dice lo mismo que la lista de la pantalla |
| 9 | Suscripciones: SPOTIFY cobra el día 18 (ningún cargo en el período activo) |
| 9 | Listo para asignar: un salario por período; arrastre (cierre de sep) $425.24 y en camino −$40.00 |
| 9 | Fusionar: Farmacia con Supermercado (Casa); el destino archivado es Gimnasio; ninguna meta se descarta |
| 9 | Meta vencida (ilustrativa): faltaron $1,015.38 ($1,200.00 − $184.62) |
| 9 | Programadas: sin atrasadas (Luz y agua se registró el 12/10) |
| 9 | Programadas: el préstamo tiene modelo (cuota 14 de 36) |
| 9 | Por cobrar: Ana no debe nada (sus partidas están cerradas) |
| 6 | Actividad filtrada: 8 gastos con Visa Oro, −$340.35 |
| 6 | Actividad: movimientos del juego de datos (Pago Visa Oro $200.00 el 10/10, sin PRICESMART ni Netflix) |
| 6 | Ritmo: Netflix al cierre $0.00 por la programada (3.5.12) |
| 6 | Archivar Supermercado: una regla (SUPER SELECTOS) |
| 6 | Auto-asignar: Viaje pide $92.31 (A.7); se asignan $167.31 y Listo para asignar queda en $145.09 |
| 6 | Formatos: BAC (compra y pago), Banco Agrícola (compra y abono) y Cuscatlán inactivo (07 §30: F-3 inactivo) |
| 6 | Seguridad: el factor nuevo se dio de alta hoy, 15/10/2026 |
| 4 | Actividad en computadora: sin filtro de cuenta aplicado |
| 3 | Actividad: búsqueda «pampa» con los dos de LA PAMPA del período |
| 3 | Actividad: cargar más hasta el período cerrado, con los movimientos del juego de datos |
| 3 | Cargar más: «Cargando…» |
| 3 | Categorías: las 6 categorías con gasto del período, $647.95 (A.7) |
| 3 | Flujo de efectivo de Cuenta corriente: cuadra con sus movimientos |
| 3 | Flujo de efectivo: un salario por período; compras con tarjeta $340.35 |
| 3 | Hallazgos: sin gastos hormiga en el período (no hay Café) |
| 3 | Gastos hormiga: últimos 3 períodos cerrados, en Restaurantes (no hay Café) |
| 3 | Lo que te quedó: ingresos − gastos de Tendencia en cada período ($1,691.55 en 6) |
| 3 | Fusionar: Farmacia no tiene reglas |
| 3 | Cobrar: CINEMARK $40.00 con débito (sin reservar para la tarjeta) |
| 3 | Condonar: CINEMARK $40.00 |
| 3 | Reglas: la regla archivada es SMART FIT → Gimnasio |
| 3 | Aporte a la inversión: sale de Fondo de emergencia (no hay categoría Inversiones) |
| 3 | Archivadas con dinero (ilustrativo): Gimnasio con $25.00, como el detalle de Gimnasio |
| 3 | Pago Visa Oro: deuda $642.18, reservado $623.43 (CT-07 §28.2 n.º 4) |
| 3 | Detalle sin movimientos: Cuota del préstamo (sin gasto en el período) |
| 3 | Otra categoría: Farmacia en Casa (CT-07), sin el grupo «Salud» |
| 3 | Bandeja con muchos: comercios con reglas que existen |
| 2 | Filtros: 8 resultados |
| 2 | Panel de destinos: Farmacia en Casa (CT-07), sin el grupo «Salud» |

## 4 · Comprobaciones

- `datos.py comprobar()`: identidad de saldo, totales del Presupuesto, gastado por categoría desde los movimientos, saldo y confirmado de Cuenta corriente, confirmado y «para no generar intereses» de Visa Oro, composición de Listo para asignar.
- `auditar.py`: ningún valor viejo en las referencias vigentes (la única aparición de −$300.00 es el pago de septiembre en `periodo-anterior`, a propósito).
- Contraste de los 878 estados con `contraste_dom.py`: solo quedan botones deshabilitados (exentos) y las caras de tarjeta (arte decorativo, C-18).
- Identificadores: todo `aria-labelledby`, `aria-describedby`, `aria-controls` y `for` apunta a un id que existe; ningún id repetido; todo diálogo tiene nombre.
- Demo: navegación probada en el navegador (barra inferior, barra lateral, «←», filas, anterior y siguiente).

## 5 · Canvas y demo

- Canvas: notas naranjas «Cierre» junto a los tableros de las pantallas que cambiaron, con el resumen de C-1 a C-25. Los tableros anteriores no se borran.
- Demo: «Finn 2.0 · demo navegable» (la misma URL de la demo anterior).

## 6 · Revisión independiente del cierre

Un revisor que no hizo el trabajo comparó las referencias, `DATOS-EJEMPLO.md`, el PROMPT-DESARROLLO y los documentos con CH contra 04, 05, 06, 07 y DECISIONES. Lo que encontró y qué se hizo:

**Corregido en este cierre**

| Hallazgo | Corrección |
|---|---|
| Bloqueante: el PROMPT pedía comparar todo con la semilla, pero la semilla es el momento antes del paso 3 y las referencias dibujan dos momentos | `DATOS-EJEMPLO.md` §1 separa los dos momentos; CA-C-1 y CA-C-2 dicen en qué momento se compara cada pantalla |
| Insignias de la Bandeja que no coincidían con la lista de su pantalla; 7 estados de Revisar en computadora con «6» de una corrida anterior | La insignia sale de la lista de cada pantalla; los 7 archivos viejos se quitaron y vale su versión anterior (3) |
| Actividad: grupo del 19/09 repetido, filtros con totales viejos, «Cargando…», filtro de cuenta aplicado en computadora | Grupos rehechos desde los movimientos; 8 movimientos · −$340.35; filtro en «Todas» |
| Lo que te quedó: barras que no sumaban el total | 5 períodos que suman $1,691.55 |
| Fechas de alta, porcentajes de cumplimiento y de uso, «Deudas» dos veces en el panel de destinos, S3 sin movimientos con una categoría con gasto | Corregidos (15/10/2026; 97.08 % y 36.11 %; un solo Deudas; Cuota del préstamo) |
| Fusionar y Archivar con un número de reglas que no es el de A.7 | Reglas 0 y «1 regla» |
| Comercio «POLLO CAMPERO» | «CAMPERO», como en A.7 |
| Decisiones C-x sin alternativas descartadas | Agregadas en `DATOS-EJEMPLO.md` §6 y en C-21 a C-25 |
| Estados que ilustran otra situación sin listar | `DATOS-EJEMPLO.md` §7 los lista (Cuenta corriente con diferencia, Revisar, formatos, Top comercios, Archivar categoría, ritmo y tarjetas, períodos cerrados) |
| CA-E4-21 contra E4-1; CA-E5-14 con la cadena literal; §1 sin C-21 a C-25 ni la sustitución de D-11; CA-T-1 sin método | Corregidos en el PROMPT |
| Consecuencias de los CH no aplicadas (05 §15.4, 06 FT-03, FT-73 y §6.4); marca en negrita dentro de un bloque de código en 05 §1.3 | Aplicadas con [D4]; marca simple dentro del bloque |
| Datos: «PRICESMART no existe», TIGO sin primera fecha, origen del SMS de PRICESMART | Reescritos (no hay transacción PRICESMART en el período activo; TIGO desde el 25/10; SMS de las 17:20) |

## 7 · Preguntas para el dueño

Contradicen un documento aprobado o piden una decisión que no es del diseño. No se resolvieron: las referencias muestran lo que dice cada punto hasta que respondas.

1. **Visa Oro.** Con los consumos de CT-07 los cargos del ciclo dan $271.60, no $271.55, y la actividad ($166.60) y el arrastre ($456.83) de CT-07 no salen de esos consumos. Las referencias usan A.7. ¿Qué número corrige CT-07?
2. **FARMACIA SAN NICOLAS** está dos veces: transacción pendiente del 11/10 en Cuenta corriente y SMS del 14/10 en la Bandeja. ¿Son dos compras o el SMS es la misma (y entonces es un posible duplicado)?
3. **Próximo pago de Visa Oro.** Las referencias dicen 15/11; la regla de 04 da 15/10 para el corte del 25/09. Y la condición de «Pagos de tarjeta próximos» en Inicio no está escrita. ¿Cuál vale?
4. **Préstamo personal.** Con las condiciones de A.7 (cuota 14 de 36, $210.00) el capital no da $4,210.00. ¿Se corrige el capital o las condiciones?
5. **«Sin fondos suficientes»** (texto de A.7) aparece con Listo para asignar en $312.40. ¿Se cambia el texto o el estado?
6. **Nombre del período 21/08–20/09.** La etapa 5 lo rotula «sep»; CT-07 lo llama «ago». ¿Cuál?
7. **«Arrastre» en el detalle de Listo para asignar.** No está en `DetalleLpaDto` (04 §6.4). ¿Se agrega al DTO con un CH o se quita de la pantalla?
8. **Editar transacción en computadora.** E4-26 la pone en dos columnas y E5-11 en 720 px. ¿Cuál manda?
9. **Pantallas de período cerrado** (`S2-presupuesto/periodo-cerrado` y las de S3 en período cerrado) tienen la etiqueta del período anterior pero los montos del activo. ¿Se rehacen con el historial?
10. **CH-C-2 (propuesto, no aplicado).** Conectar SMS muestra el último SMS recibido, que `AjustesDto.webhook` (04 §6.11) no trae. Propuesta: `webhook: { configurado: boolean; rotadoEn?: Instante; ultimoSms?: Instante }`. ¿Lo aprobás?

«Intentar de nuevo» (05 §7.3) se mantiene sin cambios (C-25).
