# Finn 2.0 — Registro de decisiones (Fase 0)

Documento de cierre de la Fase 0 (comprensión del producto). Consolida las decisiones acordadas en la conversación de la Fase 0. Solo contiene la versión final de cada decisión: cuando una respuesta fue corregida después, se refleja únicamente la corrección.

**Estado:** Fase 0 cerrada.

**Identificadores:** P1–P20 (preguntas iniciales), R1–R10 (riesgos), C1–C3, I1–I6 y M1–M5 (segunda ronda), D1–D2 (tercera ronda), PS (presentación simple), S7 (corrección a la sección 7 del documento base), H1–H13 (huecos de la primera consolidación), N1–N9 (huecos de la segunda consolidación), O1–O5 (observaciones de la tercera consolidación).

**Principio general:** el modelo de presupuesto sigue la lógica de YNAB (base cero, por sobres), adaptada a períodos personalizados. Donde algo no esté definido, se propone la solución de YNAB y se marca para revisión.

---

## 1. Resumen del producto

Finn es una aplicación personal de finanzas, de un solo usuario, en El Salvador, basada en el presupuesto base cero: cada dólar real recibe un trabajo al asignarse a una categoría ("sobre"). Existe porque ninguna aplicación del mercado resuelve a la vez tres necesidades: conexión con bancos salvadoreños (BAC, Banco Agrícola, Cuscatlán), períodos alineados a la fecha de corte de la tarjeta en lugar del mes calendario (hoy del 21 al 20) y un uso intensivo de tarjeta de crédito, donde gastar con tarjeta no equivale a gastar efectivo. La 2.0 es un proyecto nuevo, no una corrección del código de la 1.0.

**Flujo principal:**

1. Llega un SMS de compra al teléfono; MacroDroid lo reenvía a Finn con un token secreto.
2. Finn guarda el SMS original, lo interpreta según el formato del banco (tarjeta, monto, comercio, fecha), identifica la cuenta por los últimos cuatro dígitos, lo empareja con transacciones esperadas, evalúa duplicados y sugiere una categoría por reglas de comercio.
3. El movimiento queda en la bandeja de revisión y se notifica. En ese estado no es una transacción y no afecta saldos ni presupuesto.
4. El usuario revisa, ajusta y aprueba o descarta.
5. Al aprobar, se convierte en transacción: afecta el saldo de la cuenta y el Disponible de las categorías de sus líneas, en el período que corresponde a la fecha de la compra.

---

## 2. Decisiones de negocio

### 2.1 Listo para asignar

- **H2 / O1** — "Listo para asignar" usa la definición acumulada de YNAB:
  **entradas de dinero al presupuesto** (ingresos, saldos iniciales, dinero desde cuentas fuera del presupuesto, excedentes de cobros, cobros de por cobrar pagados con tarjeta) **− total asignado en todos los períodos** (incluidas las categorías de pago de tarjeta y los períodos futuros) **− sobregiros de débito o efectivo de períodos cerrados − líneas por cobrar abiertas pagadas con débito o efectivo**.
  *Reemplaza la fórmula inicial de P1. O1 agrega los cobros de por cobrar pagados con tarjeta.*
- **H2** — Un Disponible negativo durante el período no afecta "Listo para asignar" hasta el cierre.
- **S7 / H5** — Qué reduce "Listo para asignar" y cuándo:
  - Asignaciones: de inmediato.
  - Sobregiros de débito o efectivo: al cierre.
  - Pagos de tarjeta que superan el Disponible de su categoría de pago: al cierre, exactamente como un sobregiro de débito (H5).
  - Líneas por cobrar pagadas con débito o efectivo: al registrarse; se restituyen al cobrarse o condonarse (D1).
  - La deuda de tarjeta sin respaldo **no** lo reduce.
  *Reemplaza la sección 7 del documento base (ver sección 3).*
- **H4** — En el período activo se permite asignar más de lo que hay en "Listo para asignar", con aviso; el número queda negativo.
- **I1** — En períodos futuros solo se asigna dinero que ya existe: asignar en un período futuro toma dinero del "Listo para asignar" actual (adelanto de dinero real), con el límite del dinero disponible para asignar. No se planea con montos que aún no se tienen.
- **P3 / H13** — El dinero que entra desde una cuenta fuera del presupuesto (desembolso de un préstamo, retiro de una inversión) entra a "Listo para asignar" (ver 2.12 para su tratamiento en reportes).
- **PS** — "Listo para asignar" es el número principal de la aplicación.

#### Identidad de saldo y deuda sin respaldo (N1, O2)

1. **Identidad de saldo (N1)**, debe cumplirse siempre, también con el período abierto:
   **Suma de saldos de cuentas de efectivo dentro del presupuesto = Listo para asignar + suma de Disponibles de todas las categorías** (incluidas las de pago de tarjeta y las de períodos futuros) **+ sobregiros con tarjeta del período abierto** (como monto positivo).
   Los sobregiros con débito del período abierto, incluido el de una categoría de pago por pago excedente, ya están en la suma de Disponibles como negativos. Las líneas por cobrar con débito ya están descontadas de "Listo para asignar".
2. **Deuda sin respaldo (O2)**, dato derivado, nunca guardado:
   **deuda sin respaldo = máx(0, deuda de la tarjeta − máx(0, Disponible de su categoría de pago))**.
   *Reemplaza la identidad 2 de N1.*

**Verificación con los ejemplos:**

| Ejemplo | Cuentas | Listo para asignar | Suma de Disponibles | Sobregiro con tarjeta (abierto) | Identidad de saldo | Deuda sin respaldo |
|---|---|---|---|---|---|---|
| Ingreso $1,000; asigno $300 a Supermercado; compro $100 con tarjeta (cubierta) | $1,000 | $700 | Supermercado $200 + pago $100 = $300 | $0 | 700 + 300 + 0 = $1,000 ✓ | máx(0, 100 − 100) = $0 |
| Ingreso $1,000; asigno $300; compra de $50 con débito, $25 mía y $25 por cobrar | $950 | 700 − 25 = $675 | Supermercado $275 | $0 | 675 + 275 + 0 = $950 ✓ | No aplica |
| Ingreso $1,000; asigno $300 a Supermercado; compro $400 con tarjeta | $1,000 | $700 | Supermercado −$100 + pago $300 = $200 | $100 | 700 + 200 + 100 = $1,000 ✓ | máx(0, 400 − 300) = $100 |
| Pago excedente, antes del cierre: ingreso $200; asigno $100 a Supermercado; compra A $100 con tarjeta en Supermercado; compra B $50 con tarjeta en Salidas sin fondos; pago $150 a la tarjeta | $50 | $100 | Supermercado $0 + pago −$50 + Salidas −$50 = −$100 | $50 | 100 − 100 + 50 = $50 ✓ | máx(0, 0 − máx(0, −50)) = $0 |
| El mismo caso, después del cierre | $50 | 100 − 50 = $50 | $0 | $0 | 50 + 0 + 0 = $50 ✓ | $0 |

La demostración completa con escenarios (cierre de período, pago excedente, devoluciones, condonaciones y cambios retroactivos) se hace en la Fase 1.

### 2.2 Tarjetas de crédito

- **P1 / H3** — El respaldo se mide por categoría y se recalcula con el Disponible total de la categoría en el período (asignado + arrastre), sin importar en qué momento se asignó. La parte cubierta de las compras con tarjeta pasa a la categoría de pago de esa tarjeta y queda reservada para pagarla; la parte no cubierta queda sin respaldo y la categoría queda sobregirada por esa diferencia.
  *H3 reemplaza "en el momento de la compra" de P1.*
- **H3** — Si se asigna dinero a una categoría sobregirada por compras con tarjeta antes del cierre, ese dinero cubre esas compras y pasa a la categoría de pago. El orden de D2 solo reparte el Disponible entre compras (cuáles quedan cubiertas y cuáles no); no ordena asignaciones.
- **P1** — La deuda sin respaldo de períodos cerrados y la deuda inicial no se cubren asignando a una categoría normal: se cubren asignando dinero directamente a la categoría de pago de la tarjeta.
- **S7 / O2** — La deuda sin respaldo es un dato derivado de la tarjeta y su categoría de pago (fórmula en 2.1); nunca se guarda.
- **O2** — Un Disponible negativo en la categoría de pago (pago excedente, H5) no se trata como "falta reservar": es un sobregiro tipo débito.
- **P8** — Un pago reduce la deuda total de la tarjeta y el Disponible de su categoría de pago. No pertenece a ningún período de la tarjeta en particular. Se permiten pagos parciales.
- **P8** — El desglose al pagar (deuda anterior, cargos del período, ya pagado) es informativo; el pago se aplica primero a la deuda más antigua.
- **P8** — Intereses y comisiones son cargos en la tarjeta y se registran como gasto en una categoría (por ejemplo, "Intereses y comisiones").
- **I3 / H5** — Se permite pagar más que el Disponible de la categoría de pago, con aviso antes de confirmar. La categoría de pago queda sobregirada por la diferencia, y ese sobregiro se trata exactamente como uno de débito o efectivo: afecta "Listo para asignar" al cierre.
- **H7 / N2** — Una devolución con tarjeta es el inverso exacto de la compra devuelta: reduce la deuda de la tarjeta y devuelve el Disponible a la categoría de la línea. Si esa compra tenía una parte no cubierta, la devolución reduce primero esa parte no cubierta (de esa misma compra o categoría) y después la respaldada. Nunca reduce deuda sin respaldo de otras compras.
  *N2 corrige H7.*
- **I2 / O2** — Las categorías de pago no tienen metas normales. Muestran cuánto falta asignar para cubrir el total de la deuda, que es exactamente la deuda sin respaldo de la fórmula de 2.1.
- **R8** — Se conserva de la 1.0: cada tarjeta tiene su categoría de pago automática, y existe el desglose al pagar.

### 2.3 Sobregiros

- **C1 (tarjeta)** — Al cierre, la categoría vuelve a cero y la parte no cubierta queda solo como deuda sin respaldo en la tarjeta. No se descuenta de "Listo para asignar". Se cubre asignando a la categoría de pago. Cada dólar cuenta una sola vez.
  *Reemplaza P2 para el caso de tarjeta.*
- **C1 / C2 (débito o efectivo)** — Al cierre, la categoría vuelve a cero y el monto sobregirado se descuenta de "Listo para asignar" del período siguiente, porque ese dinero ya salió de la cuenta. No genera deuda de tarjeta.
- **H5 / O2** — El sobregiro de una categoría de pago por un pago excedente sigue la regla de débito o efectivo. Se muestra como "pagaste $X más de lo reservado; reducirá Listo para asignar al cierre".
- **Sobregiro de débito al cierre** — Reduce "Listo para asignar" al cierre, no durante el período. Durante el período se señala visualmente y Finn muestra cuánto reducirá "Listo para asignar" al cerrar.
- **C1 (mixto)** — Si una categoría se sobregira con ambos medios en el mismo período, cada parte recibe su tratamiento.
- **D2 / H3** — El Disponible total del período se reparte entre las compras por fecha de compra y, dentro del mismo día, por hora de registro (hora de recepción del SMS o hora de creación de la transacción). La hora de registro se guarda aparte y solo sirve para ordenar; nunca decide el período. Una transacción agregada después a una fecha pasada va, dentro de ese día, después de las que ya existían. Las asignaciones no participan en este orden.
- **Criterio YNAB (aprobado)** — Si una compra cambia de medio de pago (tarjeta o débito) o de fecha después de registrarse, la atribución del sobregiro (qué parte es de tarjeta y qué parte de débito) se recalcula según C1, D2 y H3, con la propagación de P4.
- **H1** — Por defecto, la categoría sobregirada se distingue solo por color: uno para sobregiro con débito o efectivo ("reducirá Listo para asignar al cierre") y otro para sobregiro con tarjeta ("deuda sin reservar"). Los montos y el desglose aparecen al tocar.
  *Reemplaza la distinción visual de C1 y resuelve la tensión con PS.*
- **C3** — Un sobregiro nuevo en un período cerrado (por una transacción agregada, corregida o eliminada) se recalcula y propaga automáticamente según C1: si fue con débito, reduce "Listo para asignar" del período siguiente y, por arrastre, el del activo; si fue con tarjeta, aumenta la deuda sin respaldo. No se desbloquean asignaciones ni se crean ajustes automáticos. Finn avisa del impacto en el período activo para que el usuario decida cómo cubrirlo.
- **N5** — Un sobregiro que un cambio retroactivo deja en una categoría archivada se trata con las reglas normales de C1 al cierre.

### 2.4 Períodos y cierre

- **P7** — Los períodos se generan a partir de la configuración del ciclo (día de inicio, hoy el 21). No hay huecos ni solapamientos, ni fechas libres.
- **P7** — El período siguiente se activa solo cuando llega su fecha de inicio, sin botón manual.
- **P7** — Se pueden ver y asignar períodos futuros, generados por la misma regla del ciclo (con el límite de I1).
- **M5** — Un cambio del día de inicio del ciclo aplica desde el primer período futuro que no tenga asignaciones. Antes de confirmar, Finn indica desde qué fecha se aplicará. Los períodos con asignaciones no se modifican.
  *Precisa P7 ("desde el próximo período").*
- **P4** — El historial siempre es fiel a la realidad. Una transacción olvidada se registra con su fecha original, en el período que le corresponde, y su efecto se propaga a los períodos siguientes (arrastres, sobregiros, deuda de tarjeta).
- **P4** — En un período cerrado se bloquea lo asignado. Las transacciones sí se pueden agregar, corregir o eliminar (H9). La única excepción explícita al bloqueo de asignaciones es la fusión de categorías (O4).
- **P4 / R1** — Los números derivados se recalculan de forma consistente y no se guardan como copias que puedan desactualizarse. La separación exacta entre hechos (se guardan) y derivados (se calculan) se define en la Fase 1, sin excepciones. Ya se fijó que la deuda sin respaldo es derivada (O2).
- **I6** — Si cambia la fecha de una transacción y pasa a otro período, se recalculan ambos períodos, incluso si alguno está cerrado.

### 2.5 Metas

- **P6 / N8** — "Acumular" y "Rellenar hasta" aplican solo a metas por período (mensual y semanal):
  - "Acumular": el sobrante se queda en la categoría y la meta pide el monto completo otra vez.
  - "Rellenar hasta": el sobrante se queda en la categoría y la meta solo pide la diferencia para llegar al monto. Ejemplo: meta $200, sobraron $80, se piden $120.
- **N8** — Las metas anuales y para una fecha son metas de ahorro hacia un total: siempre piden lo que falta dividido entre los períodos restantes (H11).
- **N8 / O5** — Una meta anual sin fecha explícita tiene como fecha objetivo un año después de su creación. Se renueva al llegar su fecha objetivo, se haya cumplido o no. Si se alcanza el monto antes, se muestra como cumplida hasta esa fecha.
- **O5** — Si una meta para una fecha llega a su fecha sin cumplirse, queda marcada como "vencida" y pide todo lo que falta en el período actual. Finn sugiere extender la fecha o ajustar el monto.
- **H11** — Traducción de metas a períodos de duración variable:
  - Mensual: el monto, una vez por período.
  - Semanal: el monto × (días del período / 7), redondeado al centavo.
  - Anual y monto para una fecha: lo que falta para la meta, dividido entre los períodos que quedan hasta la fecha objetivo (incluido el actual).
- **P6** — Categoría sin meta: el sobrante también se queda en la categoría. El dinero nunca vuelve solo a "Listo para asignar"; para liberarlo se desasigna a mano.
- **P6** — Las metas nunca asignan dinero por sí solas: indican cuánto falta. La asignación la hace el usuario o un "auto-asignar" que el usuario activa.
- **I2** — Las categorías de pago de tarjeta no tienen metas normales (ver 2.2).
- **P17** — Las transacciones programadas alimentan las sugerencias de asignación y las metas.

### 2.6 Por cobrar y gastos compartidos

- **P10 / P9** — La transacción se guarda por el monto completo. Solo la parte propia resta de la categoría; la parte del otro es una línea "por cobrar".
- **N3** — Cobros y condonaciones son eventos nuevos, con su propia fecha, vinculados a la línea por cobrar original. La línea no cambia de fecha.
- **P9** — Se permiten varios cobros parciales contra un mismo por cobrar.
- **P9 / N9** — Si el otro paga de más, el excedente entra a "Listo para asignar" y cuenta como ingreso en reportes, porque es dinero nuevo real. El monto que solo restituye el por cobrar no cuenta como ingreso.
- **P9 / I4** — Si paga de menos o nunca paga, el saldo se puede condonar: pasa a ser gasto propio en el período de la condonación. Finn propone la categoría original, pero se puede elegir otra. Si la categoría elegida no tiene Disponible, queda sobregirada con el tratamiento normal.
- **H8 / N3** — La condonación de un por cobrar pagado con tarjeta es un evento que cierra el por cobrar y registra una compra propia en la categoría elegida, con la fecha de la condonación. Sigue la regla de respaldo normal (H3): si hay Disponible, la parte cubierta pasa a la categoría de pago y deja de estar sin respaldo.
- **P9** — Un cobro que llega en otro período no cambia los números del período de la compra. El por cobrar vive fuera del presupuesto hasta que se cobra o se condona.
- **P9** — Un por cobrar cuenta como activo en el patrimonio neto. Finn muestra cuánto se debe, quién y desde cuándo.
- **D1 / H2 (débito o efectivo)** — Una línea por cobrar pagada con débito o efectivo resta directamente de "Listo para asignar" al registrarse y se restituye al cobrarse o condonarse. Finn muestra cuánto dinero está "en camino".
- **D1 / O1 (tarjeta)** — La parte del otro queda sin respaldo en la tarjeta y "Listo para asignar" no cambia al comprar. El cobro es una entrada a "Listo para asignar" que no cuenta como ingreso en reportes. Al cobrar, Finn propone con un toque asignar ese dinero a la categoría de pago de la tarjeta usada; la opción viene preseleccionada, pero la confirma el usuario.
- **D1** — "No es dinero nuevo" significa que el cobro no se registra como ingreso en reportes ni estadísticas; solo cierra el por cobrar.
  *Precisa la sección 15 del documento base.*

### 2.7 Transacciones: líneas, efectos y eventos

- **N3** — Una transacción tiene tres conceptos distintos:
  - **Líneas:** la parte presupuestaria. Cada línea va a una categoría o a un por cobrar, y la suma de las líneas siempre es igual al total. Ninguna línea tiene fecha propia.
  - **Efectos en cuentas:** cómo afecta la transacción a cada cuenta, separado de las líneas (por ejemplo, el desglose de una cuota de préstamo, H6).
  - **Eventos posteriores:** cobro, condonación y devolución son eventos nuevos, con su propia fecha, vinculados a la línea original.
  *Precisa P10.*
- **P10** — Una misma compra puede combinar split y parte compartida.
- **P10** — Split, gasto compartido, devolución y transferencia se modelan con un mismo mecanismo, no como casos especiales aislados.
- **P10 / N3** — Una devolución puede ser parcial y se aplica, como evento, a una línea específica de la compra original.
- **H7** — Una devolución afecta el período de su propia fecha, no el de la compra original. Con tarjeta, sigue la regla de 2.2 (N2).
- **I5** — Una devolución aplicada a una línea de por cobrar reduce ese por cobrar. Una devolución no puede superar el monto de la línea a la que se aplica; si el comercio devuelve más, el excedente se reparte entre otras líneas de la misma compra que el usuario elige. El total devuelto nunca supera el total de la compra original.
- **P10** — Una devolución sin compra original identificable va a la categoría que el usuario elige, en el período de la fecha de la devolución.
- **P15** — Transferencia entre dos cuentas dentro del presupuesto: neutral, sin categoría. Transferencia hacia una cuenta fuera del presupuesto (préstamo, inversión): se categoriza (ver 2.12).

### 2.8 Estados de transacciones

- **P11** — Hay dos conceptos distintos:
  - **Revisión:** un movimiento detectado (SMS o importación) que aún no se aprueba. Vive en la bandeja, no es una transacción y no afecta saldos ni presupuesto.
  - **Estado bancario** de una transacción registrada: pendiente (el banco aún no la confirma), confirmada (marcada a mano o confirmada por una conciliación) y conciliada (verificada formalmente contra un estado de cuenta).
- **P11** — El estado bancario no cambia el presupuesto. Sirve para mostrar "saldo confirmado" frente a "saldo total".
- **P12** — Antes de editar una transacción conciliada se muestra una advertencia. Si cambia el monto, la fecha o la cuenta, pierde el estado de conciliada y vuelve a confirmada; el registro de la conciliación refleja que hubo un cambio posterior. Cambiar la categoría o la nota no rompe la conciliación.
- **N6** — Eliminar una transacción conciliada sigue la misma regla: advertencia previa, y el registro de la conciliación refleja el cambio posterior.
- **R8** — La conciliación nunca crea transacciones sola.

### 2.9 Archivado, fusión y eliminación

- **H9** — Archivar conserva el historial intacto.
- **R4 / N5** — Una categoría archivada no recibe asignaciones nuevas ni aparece en la vista diaria, pero se conserva con su nombre en el historial y en los reportes. Sí permite sacar su Disponible: moverlo a otra categoría o devolverlo a "Listo para asignar".
- **N5** — Si un cambio retroactivo deja Disponible positivo en una categoría archivada, Finn avisa y propone sacarlo. Si le deja un sobregiro, aplica C1 al cierre.
- **H10** — Para archivar una categoría, su Disponible debe estar en cero en el período activo (se mueve a otra categoría o vuelve a "Listo para asignar") y no debe tener asignaciones en períodos futuros. Finn ofrece devolver esas asignaciones a "Listo para asignar" en el mismo paso.
  *Precisa R4.*
- **M3** — Una categoría con transacciones programadas activas no se puede archivar. Finn ofrece reasignarlas a otra categoría o desactivarlas, y después permite archivar.
- **R4** — Una cuenta solo se puede archivar con saldo cero. Una tarjeta con deuda no se puede archivar.
- **H9 / N4 / O4** — Fusionar categorías es una acción opcional y explícita, no parte del archivado:
  - Mueve las transacciones y las asignaciones de todos los períodos de la categoría origen a la destino, como si siempre hubieran sido una sola. Es una excepción explícita a P4: puede mover asignaciones de períodos cerrados, porque el total asignado por período no cambia, solo su categoría.
  - Las transacciones programadas y las reglas de comercio de la categoría origen pasan a la destino.
  - La meta de la categoría origen se descarta; la destino conserva la suya.
  - La categoría origen queda sin historial y se elimina. Los arrastres se recalculan (P4).
  - La categoría destino no puede estar archivada.
  - No se puede fusionar una categoría de pago de tarjeta.
  - Antes de confirmar, Finn muestra el resumen del impacto, incluida la meta que se descarta.
  *Corrige el error 1 del documento base.*
- **H9** — Eliminar solo se permite en entidades sin historial: una categoría sin transacciones ni asignaciones, o una cuenta sin transacciones.
- **N7** — El saldo inicial no cuenta como historial para esta regla. Una cuenta que solo tiene su saldo inicial se puede eliminar, con aviso del impacto en "Listo para asignar" (y en la deuda sin respaldo, si es tarjeta), y se recalcula según P4.
- **O3** — Una tarjeta que solo tiene su saldo inicial se puede eliminar aunque ese saldo sea deuda. Su categoría de pago se elimina junto con la tarjeta, aunque tenga asignaciones; esas asignaciones vuelven a "Listo para asignar". Es una excepción explícita a H9 para las categorías de pago. Finn muestra el impacto antes de confirmar.
- **H9** — Las transacciones sí se pueden eliminar, con su recálculo normal (P4).

### 2.10 SMS y duplicados

- **R8** — Un SMS no afecta nada hasta que se aprueba.
- **P16 / H12** — Si llega exactamente el mismo texto de SMS dos veces dentro de 10 minutos (reenvío de MacroDroid), el segundo se descarta automáticamente y queda registrado.
- **P16** — Cualquier otro caso parecido (mismo monto y cuenta, texto distinto) se marca como "posible duplicado" y decide el usuario. Nunca se descarta solo.
  *Corrige el error 10 y el paso 5 de la sección 3 del documento base.*
- **M2** — Al llegar un SMS, primero se intenta emparejar contra las transacciones esperadas, incluidas las que ya se registraron solas. Si coincide, se empareja con la existente y no se crea otra. Solo si no hay coincidencia se evalúa como posible duplicado.
- **P19** — Un SMS de banco que no coincide con ningún formato aparece en la bandeja como "no reconocido", con su texto original y una notificación. Desde ahí se puede crear la transacción a mano o descartarlo.
- **P20** — El reconocimiento de SMS y la conciliación aplican hoy a BAC, Banco Agrícola y Cuscatlán. El diseño debe permitir agregar bancos o formatos sin cambiar la lógica central. Las cuentas sin SMS (financieras, aplicaciones) funcionan con registro manual.

### 2.11 Transacciones programadas

- **P17** — Generan transacciones esperadas que aparecen en "próximos pagos", aunque no llegue un SMS.
- **P17** — Cuando llega el SMS, se empareja con la esperada (ver M2). Si el cobro no genera SMS (por ejemplo, un débito automático), se puede registrar con un toque o configurar que se registre sola en su fecha.
- **P17** — No reservan dinero ni afectan "Listo para asignar". Sí alimentan las sugerencias de asignación y las metas.
- **M3** — Bloquean el archivado de su categoría mientras estén activas (ver 2.9).
- **O4** — Al fusionar categorías, pasan de la categoría origen a la destino (ver 2.9).

### 2.12 Préstamos e inversiones

- **P3** — Préstamos e inversiones están fuera del presupuesto: su saldo no cuenta como dinero para asignar.
- **P3 / H6 / N3** — La cuota de un préstamo sale de una categoría normal asignada por el usuario (por ejemplo, "Cuota préstamo"). El pago es una sola transacción, de una cuenta de ahorro a la cuenta del préstamo:
  - Del lado del presupuesto tiene una sola línea: la categoría de la cuota, por el monto completo.
  - Del lado de la cuenta del préstamo, el efecto se desglosa en capital, interés y seguro. Solo el capital reduce el saldo; interés y seguro son costos registrados en la cuenta del préstamo sin reducir su saldo.
  El desglose es un detalle del pago, no son líneas presupuestarias. Alimenta la tabla de amortización y los reportes.
  *Corrige el error 6 del documento base.*
- **P3** — Un aporte a una inversión funciona igual: transferencia categorizada.
- **H13** — El dinero que entra desde una cuenta fuera del presupuesto entra a "Listo para asignar", pero no cuenta como ingreso en reportes: un desembolso de préstamo es deuda y un retiro de inversión es movimiento de patrimonio. Los reportes lo muestran como "otras entradas", separado de los ingresos.

### 2.13 Saldos iniciales

- **P13** — Al crear una cuenta se indica su saldo actual y se registra como transacción de "saldo inicial" con la fecha de apertura.
- **P13** — Cuenta de ahorro: el saldo inicial entra a "Listo para asignar". Tarjeta: la deuda inicial queda sin respaldo, a cubrir asignando a su categoría de pago. Préstamo en curso: se indican el saldo actual y las cuotas ya pagadas, para que la tabla de amortización arranque en el punto correcto.
- **M1** — El saldo inicial se registra en el período de la fecha de apertura. Por defecto, la fecha de apertura es el día en que se crea la cuenta en Finn (período activo). Si se elige una fecha anterior, aplica P4.
- **N7 / O3** — El saldo inicial no cuenta como historial para la regla de eliminación de cuentas (ver 2.9).

### 2.14 Fechas y zona horaria

- **P5** — La fecha que manda es la de la compra (la que trae el SMS o el estado de cuenta), nunca la de procesamiento ni la de aprobación. Esa fecha determina el período.
  *Corrige el error 5 del documento base.*
- **P18** — Todo se interpreta en America/El_Salvador (UTC−6, sin horario de verano). Las fechas de las transacciones se guardan como fecha local, sin hora.
- **D2** — La hora de registro se guarda aparte, solo para ordenar compras del mismo día (ver 2.3).
- **N3** — Las líneas no tienen fecha propia; cobros, condonaciones y devoluciones tienen la fecha de su propio evento.

### 2.15 Moneda

- **P14** — Todo se maneja en USD. Una compra en el extranjero se registra por el monto en USD que cobra el banco.
- **P14 / M4** — Se puede guardar, de forma opcional, el monto y la moneda original como dato informativo; no se usa en ningún cálculo.

### 2.16 Presentación simple

- **PS** — Se usa un solo modelo de presupuesto, pero la experiencia diaria debe ser tan simple como en la 1.0. Los conceptos internos pueden ser precisos, pero cada uno debe tener una forma simple de mostrarse.
- **PS / O2** — La categoría de pago de cada tarjeta se presenta por defecto como un solo número accionable ("te falta reservar $X para tu tarjeta"). Ese número es exactamente la deuda sin respaldo de la fórmula de 2.1.
- **O2** — Un pago excedente se muestra como "pagaste $X más de lo reservado; reducirá Listo para asignar al cierre", no como "falta reservar".
- **PS / H1** — El detalle (respaldado frente a sin respaldo, montos de sobregiros) está disponible al tocarlo. A la vista por defecto, el tipo de sobregiro se distingue solo por color.
- **PS** — "Listo para asignar" es el número principal de la aplicación.
- **Avisos acordados:** impacto en el período activo de un cambio retroactivo (C3); cuánto reducirá "Listo para asignar" un sobregiro de débito al cerrar (2.3); dinero "en camino" por por cobrar abiertos (D1); pago que supera la categoría de pago (I3); asignar más de lo que hay en "Listo para asignar" (H4); fecha desde la que aplica un cambio de ciclo (M5); impacto de una fusión de categorías, incluida la meta descartada (N4, O4); Disponible positivo en una categoría archivada (N5); impacto de eliminar una cuenta con solo saldo inicial, incluida su categoría de pago si es tarjeta (N7, O3); advertencia al editar o eliminar una transacción conciliada (P12, N6); meta para una fecha vencida, con sugerencia de extender la fecha o ajustar el monto (O5).
- **R8** — Se conservan de la 1.0: el calendario de gasto por categoría y la interfaz en español.

---

## 3. Correcciones al documento base

Secciones de "Finn 2.0 — Características, Funciones y Mejoras" que quedaron desactualizadas.

| Sección | Qué decía | Qué dice ahora |
|---|---|---|
| 3, paso 5 | Descarta duplicados: mismo monto en la misma cuenta en pocos minutos. | Solo se descarta automáticamente el mismo texto exacto dentro de 10 minutos; el resto se marca como "posible duplicado" (P16, H12). |
| 3, paso 6 y sección 9 | Las programadas se reconocen cuando llega el SMS. | Generan transacciones esperadas aunque no llegue SMS, pueden registrarse solas en su fecha, y el emparejamiento ocurre antes de evaluar duplicados (P17, M2). |
| 6, Cuentas | "Editar, reordenar, archivar o eliminar la cuenta." | Archivar requiere saldo cero; una tarjeta con deuda no se archiva (R4). Eliminar solo se permite en una cuenta sin transacciones, sin contar el saldo inicial; una tarjeta eliminada se lleva su categoría de pago y sus asignaciones vuelven a "Listo para asignar" (H9, N7, O3). |
| 6, Préstamo e Inversión | No define su relación con el presupuesto. | Están fuera del presupuesto; cuotas y aportes son transferencias categorizadas. La cuota tiene una sola línea presupuestaria y su efecto en la cuenta del préstamo se desglosa en capital, interés y seguro; solo el capital reduce el saldo (P3, H6, N3). |
| 6, Posición neta | Lo que tengo frente a lo que debo. | Los por cobrar cuentan como activo (P9). |
| 7, Listo para asignar | Puede ser negativo por asignar de más "o tener deuda de tarjeta sin respaldo". | Fórmula acumulada de H2 (con O1) e identidad de saldo de N1. La deuda sin respaldo no lo reduce; lo que lo reduce y cuándo está en S7/H5. En el período activo puede quedar negativo al asignar de más (H4). |
| 7, Metas | La meta "define qué pasa con lo que sobra al cerrar el período". | El sobrante siempre se queda en la categoría. "Acumular" y "Rellenar hasta" aplican solo a metas por período; las anuales y para una fecha piden lo que falta entre los períodos restantes, con renovación y vencimiento definidos (P6, H11, N8, O5). |
| 7, Tarjetas | "Solo la deuda que nunca tuvo respaldo... reduce lo que tengo para asignar." | La deuda sin respaldo es un dato derivado de la tarjeta y su categoría de pago y no reduce "Listo para asignar" (S7, C1, O2). El respaldo se recalcula con el Disponible total del período (H3). El pago se aplica primero a la deuda más antigua y puede superar la categoría de pago (P8, I3, H5). |
| 7, Períodos | Se pueden crear o editar períodos; los anteriores son de solo lectura; al cerrar, Finn abre el siguiente. | Se generan por la regla del ciclo, sin fechas libres; se activan solos en su fecha; en un período cerrado solo se bloquea lo asignado (salvo la fusión de categorías) y las transacciones se pueden agregar, corregir o eliminar con recálculo (P4, P7, M5, H9, O4). |
| 7, Períodos (arrastre) | Al cerrar se arrastra el saldo pendiente de cada tarjeta. | La deuda de la tarjeta no pertenece a un período; los sobregiros siguen C1. |
| 8, Actividad | Estado: pendiente, confirmada o conciliada. | "Pendiente" es un estado bancario y es distinto de la revisión en la bandeja (P11). |
| 8, Transferencia | Neutral entre cuentas propias. | Neutral solo entre cuentas dentro del presupuesto; hacia préstamo o inversión se categoriza (P15). |
| 8, Conciliadas | "Avisan antes de permitir cambios." | Cambiar monto, fecha o cuenta, o eliminar la transacción, quita el estado de conciliada y queda reflejado en el registro de la conciliación (P12, N6). |
| 9, SMS | Solo compras reconocidas. | Existen SMS "no reconocidos" en la bandeja (P19). |
| 10, Reportes | Ingresos frente a gastos. | El monto de un cobro que restituye un por cobrar, con débito o con tarjeta, no cuenta como ingreso; el excedente sí (D1, N9, O1). El dinero desde cuentas fuera del presupuesto se muestra como "otras entradas", separado de los ingresos (H13). |
| 14, Error 1 | Archivar en lugar de borrar; al retirar una categoría, mover sus transacciones a otra. | Archivar conserva el historial intacto. Mover transacciones es una acción aparte y opcional ("fusionar categorías"), que mueve transacciones, asignaciones, programadas y reglas de comercio y elimina la categoría origen. Eliminar solo en entidades sin historial (H9, H10, N4, O4). |
| 14, Error 3 | Inmutable o recalcular. | Se recalcula; solo lo asignado se bloquea (P4). |
| 14, Error 4 | El cierre debe completarse entero o no hacerse. | No hay cierre manual; el período se activa por fecha (P7). La atomicidad general sigue como requisito. |
| 14, Error 7 | Arrastre solo al avanzar; "Rellenar hasta" igual que "Acumular". | Períodos generados por regla; semántica de metas en P6, H11, N8 y O5. |
| 14, Error 10 | Considerar el comercio y permitir confirmar. | Texto exacto dentro de 10 minutos se descarta solo; el resto es "posible duplicado" (P16, H12). |
| 15, Split | Dividir una compra entre categorías. | Se modela con líneas presupuestarias, separadas de los efectos en cuentas y de los eventos posteriores (P10, N3). |
| 15, Gastos compartidos | El ingreso del amigo "no debe contar como dinero nuevo para asignar". | El cobro entra a (o restituye) "Listo para asignar" y no cuenta como ingreso en reportes; el excedente sí es ingreso (D1, H2, N9, O1). |
| 15, Devoluciones | Devuelven el dinero a la categoría de la compra original. | Son eventos aplicados a una línea específica, con los límites de I5, en el período de la fecha de la devolución; con tarjeta, son el inverso exacto de la compra devuelta (H7, N2, N3). Sin compra original, van a la categoría elegida (P10). |
| 15, Asignación rápida | "Auto-asignar al iniciar el período." | El auto-asignar lo activa el usuario; las metas nunca asignan solas (P6). |

---

## 4. Criterios de YNAB

**Principio general:** donde no haya una decisión explícita, se aplica la lógica de YNAB y se marca para revisión.

**Pendientes de revisión:** ninguno.

**Origen YNAB, confirmados por el usuario** (se listan para trazabilidad):

- C1: el sobregiro con tarjeta se convierte en deuda sin respaldo y no se descuenta de "Listo para asignar".
- Sobregiro de débito: reduce "Listo para asignar" al cierre, no durante el período.
- I1: solo se asigna dinero que ya existe (en períodos futuros).
- H2: definición acumulada de "Listo para asignar".
- H3: asignar a una categoría sobregirada por tarjeta antes del cierre cubre esas compras y mueve el dinero a la categoría de pago.
- Recalcular la atribución del sobregiro si cambia el medio de pago o la fecha de una compra (2.3).

---

## 5. Temas pendientes, diferidos y observaciones

### 5.1 Diferidos por decisión

- **Migración desde Finn 1.0 (P13):** pendiente. Por ahora, la 2.0 arranca desde cero con saldos iniciales.
- **Demostración de la identidad de saldo y de la fórmula de deuda sin respaldo (N1, O2):** Fase 1, con escenarios completos de cierre de período, pago excedente (incluido el ejemplo de O2 antes y después del cierre), devoluciones, condonaciones y cambios retroactivos.
- **Separación de hechos y derivados (R1):** Fase 1.
- **Modelo de líneas, efectos en cuentas y eventos (N3):** Fase 1.
- **Alcance y orden de las funciones (R10):** Fase 8. El dominio se diseña completo.

### 5.2 Observaciones para la Fase 1

Los puntos O1–O5 quedaron resueltos. Al incorporarlos surgieron estos puntos, que se tratarán en la Fase 1 sin abrir otra ronda en la Fase 0.

- **F1. Eliminación de tarjeta y períodos cerrados (O3 frente a P4).** Si la categoría de pago de una tarjeta eliminada tiene asignaciones en períodos cerrados (posible con una fecha de apertura anterior, M1), devolverlas a "Listo para asignar" modifica asignaciones de períodos cerrados. P4 solo registra la fusión (O4) como excepción explícita a ese bloqueo.
- **F2. "Lo que falta" en metas de ahorro (H11, N8, O5).** No está definido si "lo que falta" se mide contra el Disponible actual de la categoría o contra lo asignado desde la creación o renovación de la meta. Cambia el resultado al renovar una meta anual cuyo dinero no se gastó.
- **F3. Alcance de "no se puede fusionar una categoría de pago" (N4).** No está explícito si la restricción aplica solo como origen o también como destino.
- **F4. Dos mensajes simultáneos en la categoría de pago (PS, O2).** Con un pago excedente y deuda restante a la vez (por ejemplo, deuda $150, categoría de pago $100, pago $120: queda deuda $30 y la categoría de pago en −$20), Finn tendría que mostrar "te falta reservar $30" y "pagaste $20 más de lo reservado" al mismo tiempo, frente al "solo número accionable" de PS. La regla de dominio cuadra; es una cuestión de presentación.

---

## Enmiendas posteriores

Aprobadas en fases posteriores. Este documento no se modifica; cada línea indica qué cambia y dónde está el detalle.

- **PF-2** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`, P5-2; término confirmado en PB-1). **2.3, H1, y 2.16, PS:** a la vista por defecto, el tipo de sobregiro se distingue con **color y un indicador no cromático con nombre accesible** ("sobregiro con débito o efectivo" o "deuda sin reservar"), sin montos; los montos y el desglose siguen apareciendo al tocar. Reemplaza "solo por color" (WCAG 2.2, criterio 1.4.1). La forma del indicador la decide el diseño. Detalle en `05-frontend.md` §0.8 y §10.3.
- **CF-14** (Fase 6, aprobada en el Paso 1 de `06-features.md`, P6-13). **5.1, migración desde Finn 1.0 (P13):** queda **cerrada sin migración**. La 2.0 arranca desde cero con saldos iniciales (OP-01) y la estructura de grupos y categorías, con una plantilla opcional; la feature de migración (FT-07) se retira. Detalle en `06-features.md` §3.1.
