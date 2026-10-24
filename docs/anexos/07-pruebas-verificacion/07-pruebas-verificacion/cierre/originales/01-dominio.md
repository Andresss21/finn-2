# Finn 2.0 — Modelo de dominio y reglas de negocio (01-dominio.md)

**Fase:** 1. **Estado:** Aprobado — Fase 1 cerrada. Contiene las partes A, B y C y el Anexo A. El modelo de Banco Agrícola del Anexo A sigue marcado para validarse contra un estado de cuenta real.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento especifica el dominio de Finn de forma completa y sin ambigüedad: conceptos, datos, reglas de cálculo, operaciones, invariantes, ciclos de vida y escenarios de verificación. Con él, cualquier desarrollador o agente debe poder implementar el dominio sin interpretar nada.

### 0.2 Alcance

Es una especificación conceptual, independiente de la tecnología. No define tablas, endpoints, arquitectura ni pantallas. Cuando se mencionan avisos o textos, se define qué información debe comunicarse, no cómo se muestra.

Quedan fuera del dominio:
- la autenticación del webhook de MacroDroid, salvo como precondición de "recibir SMS";
- las preferencias de la aplicación;
- el centro de notificaciones como pantalla.

### 0.3 Precedencia

1. `00-decisiones.md` manda sobre este documento y sobre el documento de producto.
2. Este documento manda sobre el documento de producto. Las discrepancias con el documento de producto se registran en la sección 10.
3. Las resoluciones de la Fase 1 (F1–F4, Q1–Q6 y supuestos aprobados) se citan con su identificador y se registran en la sección 10.

### 0.4 Convenciones

- **Moneda:** todo en USD. Los montos se representan en centavos enteros; no existen fracciones de centavo en ningún hecho ni derivado. [P14, supuesto 1]
- **Redondeo:**
  - Meta semanal: redondeo al centavo, con la mitad hacia arriba (H11).
  - Metas de ahorro: la división entre períodos se redondea hacia arriba al centavo (⌈·⌉), para que la suma alcance la meta.
  - Ninguna otra regla divide montos. [supuesto 1]
- **Fechas:** toda fecha de negocio es una fecha local de America/El_Salvador (UTC−6, sin horario de verano), sin hora. [P18]
- **Instantes:** la hora de registro y la clave de orden son instantes. Solo sirven para ordenar y nunca deciden un período. [D2]
- **Hoy:** la fecha local actual. Es una entrada externa (reloj), no un hecho del dominio.
- **Signos:**
  - Saldo de una cuenta de efectivo: positivo = dinero disponible.
  - Saldo de una tarjeta: negativo = deuda; positivo = saldo a favor.
  - Saldo de un préstamo: capital pendiente, siempre ≥ 0.
  - Valor de una inversión: ≥ 0.
  - Efecto en cuenta: monto con signo según la convención de su cuenta.
  - Disponible y Listo para asignar pueden ser negativos.
  - Todas las demás cantidades se expresan como montos ≥ 0 con su dirección nombrada.
- **Marcas:**
  - [Decisión]: referencia a 00-decisiones.md (P1, H3, O2…).
  - [YNAB]: supuesto resuelto con el criterio de YNAB.
  - [Propio]: supuesto sin equivalente en YNAB.
  - [Q#], [F#], [supuesto #]: resoluciones de la Fase 1.

### 0.5 Notación

| Símbolo | Significado |
|---|---|
| c | categoría |
| p | período; p−1 y p+1 son el anterior y el siguiente |
| t | tarjeta de crédito |
| pago(t) | categoría de pago de la tarjeta t |
| A | período activo |
| Asig(c, p) | asignado a c en p |
| Act(c, p) | actividad de c en p |
| Arr(c, p) | arrastre de c hacia p |
| Disp(c, p) | Disponible de c en p |
| deuda(t) | deuda de la tarjeta t |
| S(t) | deuda sin respaldo de t |
| RE(t) | reserva excedente de t |
| LPA | Listo para asignar |
| máx, mín, ⌈x⌉, Σ | máximo, mínimo, redondeo hacia arriba al centavo, suma |

---

## 1. Glosario

Cada término remite a la fórmula que lo calcula (sección 4, Parte B) y a su decisión de origen.

### 1.1 Tiempo

- **Ciclo** — Regla que genera los períodos a partir de un día de inicio (1–31). Cada período empieza en el día de inicio de un mes y termina el día anterior al día de inicio del mes siguiente. Si el mes no tiene ese día, el período empieza el último día del mes. [P7, supuesto 15]
- **Vigencia del ciclo** — Hecho que fija un día de inicio y la fecha desde la que rige. La primera vigencia rige sin límite hacia el pasado. Un cambio de ciclo crea una vigencia nueva, que rige desde el primer período futuro sin asignaciones. [M5]
- **Período** — Intervalo de fechas [inicio, fin], ambos incluidos, generado por las vigencias del ciclo. Se identifica por su fecha de inicio. Los períodos no tienen huecos ni solapamientos. Es un dato derivado, nunca editable. [P7] → §4.2
- **Período de transición** — Período que se genera cuando cambia el ciclo. Va desde el día siguiente al fin del último período de la vigencia anterior hasta el día anterior al primer inicio según la vigencia nueva. Puede durar menos que un período normal. [Q5] → §4.2
- **Período de una fecha** — El único período que contiene esa fecha. → §4.2
- **Período activo (A)** — El período que contiene hoy. Siempre hay exactamente uno. [P7]
- **Período cerrado** — Período cuyo fin es anterior a hoy. [P7]
- **Período futuro** — Período cuyo inicio es posterior a hoy. [P7]
- **Cierre** — El paso de un período de activo a cerrado, que ocurre al llegar el inicio del siguiente. No es una operación ni requiere acción. Sus efectos (arrastres, sobregiros que pasan a Listo para asignar o a deuda sin respaldo) son derivados y se recalculan siempre. [P7, error 4 del documento base] → §4.6, §4.7
- **Fecha de transacción** — La fecha de la compra o del movimiento según el banco (SMS o estado de cuenta), nunca la de procesamiento ni la de aprobación. Determina el período. [P5]
- **Fecha de evento** — La fecha propia de un cobro, condonación o devolución. Determina el período del evento. [N3]
- **Hora de registro** — Instante en que se registró la transacción: recepción del SMS o creación manual. [D2]
- **Clave de orden** — Instante que ordena las compras de un mismo día en el reparto D2. Es la hora de registro; si después cambia la fecha de la transacción, pasa a ser el instante de ese cambio. [D2, supuesto 5]
- **Ciclo de facturación de la tarjeta** — Intervalo entre dos fechas de corte de una tarjeta, definido por su día de corte. Es distinto del período del presupuesto y solo alimenta el desglose informativo de un pago. [P8, supuesto 19] → §4.14

### 1.2 Cuentas

- **Cuenta** — Lugar donde vive dinero o deuda. Hay cuatro tipos: cuenta de efectivo, tarjeta de crédito, préstamo e inversión. Toda transacción tiene al menos un efecto en una cuenta.
- **Cuenta de efectivo** — Cuenta de ahorro, débito, financiera, aplicación o efectivo físico. Está dentro del presupuesto. Puede tener una tarjeta de débito asociada, identificada por sus últimos cuatro dígitos. [documento base §6]
- **Tarjeta de crédito** — Cuenta de deuda dentro del presupuesto. Tiene exactamente una categoría de pago. [R8]
- **Cuenta fuera del presupuesto** — Préstamo o inversión. Su saldo no es dinero para asignar. [P3]
- **Préstamo** — Cuenta fuera del presupuesto cuyo saldo es el capital pendiente. Solo el capital de un pago reduce ese saldo; el interés y el seguro son costos que se registran en la cuenta sin reducirlo. [P3, H6]
- **Inversión** — Cuenta fuera del presupuesto cuyo saldo es su valor: aportes − retiros ± ajustes de valor. [P3, supuesto 17]
- **Dentro del presupuesto** — Cuentas de efectivo y tarjetas. Solo los saldos de las cuentas de efectivo entran en la identidad de saldo. [N1]
- **Saldo de una cuenta** — Suma de los efectos de todas sus transacciones que cambian el saldo. Es derivado, nunca se guarda. [R1, error 2 del documento base] → §4.3
- **Saldo confirmado** — Saldo calculado solo con las transacciones en estado confirmada o conciliada. [P11] → §4.3
- **Deuda de una tarjeta** — máx(0, −saldo de la tarjeta). No pertenece a ningún período. [P8, Q4] → §4.3
- **Saldo a favor** — máx(0, saldo de la tarjeta). No cuenta como efectivo en la identidad de saldo. [Q4] → §4.3
- **Saldo inicial** — Transacción de tipo "saldo inicial" con el saldo de la cuenta en su fecha de apertura. No cuenta como historial para la regla de eliminación de cuentas. [P13, N7, O3]
  - En una cuenta de efectivo, entra a Listo para asignar.
  - En una tarjeta, es deuda sin respaldo.
  - En un préstamo en curso, es el capital pendiente, acompañado de las cuotas ya pagadas.
  - En una inversión, es su valor inicial.
- **Fecha de apertura** — Fecha desde la que existe la cuenta en Finn. Por defecto es el día de su creación. Ninguna transacción de la cuenta puede tener fecha anterior. [M1, supuesto 2]
- **Desembolso** — Transacción por la que el dinero de un préstamo nuevo llega a una cuenta de efectivo. Aumenta el capital pendiente y entra a Listo para asignar como "otras entradas". Un préstamo nuevo se crea con saldo inicial cero más su desembolso; un préstamo en curso, con saldo inicial igual a su capital pendiente. [H13, P13]
- **Patrimonio neto** — Saldos de cuentas de efectivo + saldos a favor + valor de inversiones + por cobrar abiertos − deudas de tarjeta − capital pendiente de préstamos. [P9] → §4.14

### 1.3 Transacciones

- **Transacción** — Hecho que registra un movimiento real de dinero o deuda. Tiene tipo, fecha, clave de orden, origen, estado bancario, uno o más efectos en cuentas y, según su tipo, líneas.
- **Tipo de transacción** — Conjunto cerrado de tipos (ver la tabla de 2.2.9). El tipo determina qué efectos en cuentas lleva, si tiene líneas y cuál es su efecto presupuestario.
- **Línea** — Parte presupuestaria de una transacción. Tiene un destino (una categoría o un por cobrar con su deudor) y un monto. No tiene fecha propia: su período es el de su transacción. [N3]
  - Solo los tipos con destino elegido tienen líneas: gasto, devolución, pago de tarjeta, cuota de préstamo y aporte a inversión.
  - En esos tipos, la suma de las líneas es igual al total.
- **Línea de categoría** — Línea cuyo destino es una categoría.
- **Línea por cobrar** — Línea cuyo destino es un por cobrar a nombre de un deudor. No afecta ninguna categoría. [P10, P9]
- **Efecto en cuenta** — Cómo cambia una transacción cada cuenta, separado de las líneas. En un pago de préstamo, el efecto se desglosa en capital, interés y seguro; solo el capital cambia el saldo. [N3, H6]
- **Efecto presupuestario** — Cambio que una transacción produce en Listo para asignar o en Disponibles. Lo determinan sus líneas o, en los tipos sin líneas, su tipo. → §4.4, §4.9
- **Evento posterior** — Cobro, condonación o devolución. Tiene fecha propia, está vinculado a una línea de otra transacción y nunca cambia la fecha de esa línea. [N3]
- **Medio de pago** — Atributo derivado de una compra: "tarjeta" si su cuenta es una tarjeta; "débito o efectivo" si es una cuenta de efectivo. Cambia si cambia la cuenta. [C1, criterio YNAB de 2.3]
- **Compra** — Transacción de tipo gasto.
- **Origen** — Cómo nació la transacción: SMS, manual, importada (desde una conciliación) o programada (registro automático). [documento base §8; "programada" es Propio]
- **Estado bancario** — Pendiente, confirmada o conciliada. No afecta el presupuesto. [P11] → §7.2
- **Comercio** — Texto del comercio o la contraparte. Sirve para las reglas de comercio y los reportes; no afecta cálculos.
- **Moneda y monto original** — Dato informativo opcional. Nunca se usa en cálculos. [P14, M4]

### 1.4 Presupuesto

- **Grupo** — Agrupación de categorías con fines de orden y presentación. No tiene números propios.
- **Categoría** — Sobre al que se asigna dinero. Tiene un Disponible por período. Puede ser normal o de pago.
- **Categoría de pago** — Categoría creada automáticamente con cada tarjeta, en relación 1:1. Reserva el dinero para pagarla. No tiene metas normales (I2) y no se fusiona, ni como origen ni como destino (F3). Se elimina junto con su tarjeta (O3). [R8]
- **Asignación** — Hecho: el monto neto asignado a una categoría c en un período p, denotado Asig(c, p). Puede ser negativo, por ejemplo al desasignar el arrastre. Si no se registró, vale 0. [supuesto 6]
- **Actividad** — Act(c, p): suma de las variaciones del Disponible de c en p que no son asignación ni arrastre. → §4.4
  - En una categoría normal: −líneas de gasto + devoluciones − condonaciones.
  - En una categoría de pago: + traslados de compras con tarjeta − pagos ± devoluciones de períodos posteriores.
- **Gastado** — Valor que se muestra de −Act(c, p) en una categoría normal. → §4.4
- **Consumo** — Cada salida de dinero de una categoría normal que participa en el reparto D2: líneas de categoría de gastos, cuotas, abonos y aportes, y condonaciones. Tiene categoría, monto neto, medio de pago, fecha y clave de orden. → §4.1, §4.5
- **Arrastre** — Arr(c, p) = máx(0, Disp(c, p−1)). Lo que sobra pasa al período siguiente; lo negativo vuelve a cero. [P6, C1] → §4.6
- **Disponible** — Disp(c, p) = Arr(c, p) + Asig(c, p) + Act(c, p). Es negativo cuando la categoría está sobregirada. → §4.6
- **Fondo del período** — Dinero de c en p que se reparte entre sus compras según D2: arrastre + asignado + entradas que no son devoluciones de compras del mismo período. No depende del momento en que se asignó. [H3, D2, Q2a] → §4.5
- **Respaldo** — Reparto del fondo del período entre las compras de la categoría, por fecha y clave de orden. [P1, H3, D2] → §4.5
- **Parte cubierta / parte no cubierta** — Para cada línea de compra, la parte que el fondo alcanza a cubrir y la que no. → §4.5
- **Traslado a la categoría de pago** — Dato derivado: la parte cubierta de una línea de compra con tarjeta pasa del Disponible de su categoría al de la categoría de pago, en el mismo período. No es una línea ni un hecho. [P1, H3] → §4.5
- **Sobregiro** — máx(0, −Disp(c, p)). Se divide en dos partes. [C1, supuesto 6] → §4.7
  - Parte de tarjeta: la suma de las partes no cubiertas de compras con tarjeta.
  - Parte de débito o efectivo: el resto, incluido el negativo que no se explica por compras.
- **Sobregiro con tarjeta del período abierto** — Suma de las partes de tarjeta de los sobregiros de todas las categorías en el período activo. Entra en la identidad de saldo. [N1] → §4.7
- **Pago excedente** — Disponible negativo de una categoría de pago. Se trata como un sobregiro de débito y reduce Listo para asignar al cierre. Su aviso depende de la causa: un pago, un cobro aplicado a la tarjeta o una devolución. [H5, O2, Q7] → §4.7
- **Pago implícito** — Efecto derivado de un cobro de un por cobrar pagado con débito que se deposita en una tarjeta t. Por el monto de la restitución, reduce el Disponible de pago(t), como si el cobro hubiera entrado en efectivo y se hubiera pagado la tarjeta. No es una transacción ni una línea. [Q7] → §4.10
- **Deuda sin respaldo** — S(t) = máx(0, deuda(t) − máx(0, Disp(pago(t), A))). Es derivada y nunca se guarda. [O2] → §4.8
- **"Te falta reservar"** — Número principal de la categoría de pago. Es exactamente S(t). [PS, O2, F4]
- **Reserva excedente** — RE(t) = máx(0, Disp(pago(t), A) − deuda(t)). Nunca vuelve sola a Listo para asignar; Finn avisa y ofrece devolverla. [Q4] → §4.8
- **Listo para asignar (LPA)** — Dinero de entradas al presupuesto que todavía no tiene un trabajo. Usa la definición acumulada de H2 con O1. Es el número principal de la aplicación. [H2, O1, PS] → §4.9
- **Entrada al presupuesto** — Movimiento que aumenta LPA: ingreso, saldo inicial de una cuenta de efectivo, desembolso, retiro de inversión, avance de efectivo, y, solo si se depositan en una cuenta de efectivo, el excedente de un cobro y la restitución de un por cobrar pagado con tarjeta. La restitución de un por cobrar con débito no es una entrada: reduce el descuento de "por cobrar abiertos". [H2, O1, H13, Q3, Q7] → §4.9
- **Clasificación para reportes** — Toda entrada se clasifica como ingreso, otras entradas o restitución. [D1, N9, O1, H13, Q3] → §4.13
  - Ingreso: dinero nuevo, por ejemplo un salario, un excedente de cobro o cashback.
  - Otras entradas: dinero desde cuentas fuera del presupuesto o un avance de efectivo.
  - Restitución: un cobro que solo cierra un por cobrar.
- **Mover dinero** — Operación que cambia dos asignaciones del mismo período a la vez: una baja y otra sube por el mismo monto. → §5

### 1.5 Por cobrar

- **Por cobrar** — Saldo que un deudor debe por una línea por cobrar. Su estado se deriva de la línea y de sus eventos. [P9, P10, N3] → §4.10
- **Deudor** — Persona a cuyo nombre queda un por cobrar.
- **Saldo abierto** — Monto de la línea − restituido por cobros − condonado − devuelto. Siempre ≥ 0. → §4.10
- **Dinero en camino** — Suma de los saldos abiertos de los por cobrar cuya compra fue con débito o efectivo. [D1] → §4.10
- **Cobro** — Evento vinculado a una línea por cobrar y materializado en una transacción de entrada a una cuenta. Su monto se reparte en una restitución y, si sobra, un excedente. → §4.10
  - Restitución: mín(monto, saldo abierto en esa fecha).
  - Excedente: el resto.
  - Si el depósito llega a una tarjeta y el por cobrar fue pagado con débito, la restitución va acompañada de un pago implícito a esa tarjeta, y el excedente solo reduce la deuda. [Q7]
  - Si el depósito llega a una tarjeta y el por cobrar fue pagado con tarjeta, todo el cobro solo reduce la deuda. [Q3]
- **Excedente de cobro** — Parte de un cobro que supera el saldo abierto. Es una entrada a LPA y cuenta como ingreso. [P9, N9]
- **Condonación** — Evento sin efecto en cuentas, con fecha propia, que cierra total o parcialmente un por cobrar. Lo convierte en gasto propio en la categoría elegida, en el período de la condonación. [P9, I4, H8, N3]
  - Si el por cobrar fue con tarjeta, ese gasto sigue la regla de respaldo como una compra con tarjeta (H8).
  - Si fue con débito, es gasto de tipo débito.
  - La categoría elegida debe estar activa. Si la categoría original está archivada, Finn propone otra activa. [I4, ajuste 1 a la Parte A]

### 1.6 Metas

- **Meta** — Objetivo asociado a una categoría normal (como máximo uno por categoría). Indica cuánto falta asignar; nunca asigna sola. [P6]
- **Meta por período** — Mensual o semanal, con modo "acumular" o "rellenar hasta". [P6, N8]
  - Mensual: pide el monto una vez por período.
  - Semanal: pide monto × días del período / 7.
- **Acumular** — Pide el monto completo cada período; lo que sobra se queda en la categoría. [P6]
- **Rellenar hasta** — Pide máx(0, monto − arrastre). [P6, supuesto 4]
- **Meta de ahorro** — Anual o "monto para una fecha". Pide lo que falta, repartido entre los períodos restantes hasta la fecha objetivo, incluido el actual. [N8, H11]
- **Fecha objetivo** — En una meta para una fecha, la fecha indicada. En una meta anual, la fecha indicada o, si no hay, un año después de su creación. Al llegar, la meta anual se renueva un año más. [N8, O5] → §4.12
- **Base de la meta** — Disponible actual de la categoría menos lo asignado en el período, es decir, arrastre + actividad. [F2, supuesto 3] → §4.12
- **Monto del período** — Lo que la meta pide en el período. → §4.12
- **Falta** — máx(0, monto del período − asignado en el período). → §4.12
- **Cumplida** — Meta de ahorro cuyo Disponible alcanza el monto antes de la fecha objetivo. [N8]
- **Vencida** — Meta para una fecha que llega a su fecha objetivo sin cumplirse. Pide todo lo que falta en el período actual. [O5]
- **Auto-asignar** — Operación que el usuario activa para asignar lo que falta según las metas. Nunca deja LPA negativo: si no alcanza, asigna en el orden de las categorías e informa qué quedó sin cubrir y por cuánto. [P6, supuesto 14 modificado]

### 1.7 Revisión y automatización

- **SMS recibido** — Hecho inmutable con el texto, el remitente y el instante de recepción. Se guarda antes de procesarlo, aunque el procesamiento falle. [documento base §3]
- **Formato bancario** — Configuración que reconoce un tipo de SMS de un banco y extrae sus campos: últimos cuatro dígitos, monto, comercio, fecha y tipo de movimiento. Agregar bancos o formatos no cambia la lógica central. [P20]
- **Movimiento en revisión** — Propuesta de transacción que nace de un SMS o de una importación. No es una transacción y no afecta saldos ni presupuesto. [P11, R8] → §7.1
- **No reconocido** — Movimiento cuyo SMS no coincide con ningún formato. Conserva el texto original. [P19]
- **Posible duplicado** — Movimiento con la misma cuenta, el mismo monto y una fecha de compra dentro de ±1 día respecto de otra transacción o movimiento, con texto distinto. Decide el usuario. [P16, supuesto 9]
- **Autodescartado** — Movimiento cuyo texto es idéntico al de otro SMS recibido dentro de los 10 minutos anteriores. Se descarta solo y queda registrado. [P16, H12]
- **Regla de comercio** — Asociación entre un patrón de comercio y una categoría, usada para sugerir la categoría. [documento base §3]
- **Transacción programada** — Plantilla de un movimiento recurrente: cuenta, monto y tolerancia, líneas, frecuencia y si se registra automáticamente. No reserva dinero ni afecta LPA. [P17]
- **Transacción esperada** — Cada ocurrencia de una programada en una fecha. Su existencia se deriva de la programada; su resolución (emparejada, registrada u omitida) es un hecho. [P17, M2] → §7.8
- **Emparejamiento** — Vínculo entre un movimiento y una transacción esperada (o la transacción ya registrada por ella). Requiere la misma cuenta, el monto exacto (o dentro de la tolerancia de la programada) y una fecha dentro de ±5 días. Se evalúa antes que los duplicados. [M2, supuesto 8]

### 1.8 Conciliación

- **Conciliación** — Comparación de una cuenta contra un estado de cuenta importado. Clasifica los movimientos en coincidencias, solo en el estado y solo en Finn. Nunca crea transacciones sola. [R8, documento base §11]
- **Coincidencia** — Transacción de Finn y movimiento del estado con la misma cuenta, el mismo monto y fechas dentro de ±3 días. [supuesto 10]
- **Registro de conciliación** — Hecho que guarda la cuenta, la fecha del estado, el saldo según el estado, el instante en que se terminó, la diferencia aceptada al terminar y los cambios posteriores. [P12, N6, supuesto 11 modificado]
- **Diferencia aceptada** — Saldo según el estado − saldo de Finn al terminar. Puede ser distinta de cero. Queda visible en el registro y en la cuenta. Finn sugiere una transacción de ajuste, pero no la crea. [supuesto 11 modificado]
- **Cambio posterior** — Entrada del registro que se crea cuando una transacción conciliada pierde ese estado (por cambio de monto, fecha o cuenta) o se elimina. [P12, N6]

### 1.9 Estructura y avisos

- **Archivar** — Retirar una categoría, grupo o cuenta de la vista diaria y de las operaciones nuevas, conservando intacto su historial. [H9, R4]
- **Fusionar** — Mover todo el historial de una categoría origen a una categoría destino y eliminar la origen. Es una de las dos excepciones al bloqueo de asignaciones de períodos cerrados. [H9, N4, O4, F3]
- **Eliminar** — Borrar una entidad sin historial. Excepción: una tarjeta con solo saldo inicial, que se elimina junto con su categoría de pago y es la segunda excepción al bloqueo de asignaciones (F1). [H9, N7, O3, F1]
- **Aviso** — Información que el dominio debe comunicar. Hay dos clases:
  - Aviso de operación: se emite antes o después de confirmar una operación.
  - Aviso de estado: una condición derivada que sigue vigente mientras se cumpla. Por ejemplo, reserva excedente > 0 o categoría archivada con Disponible positivo.
  - El catálogo está en 2.16 de 00-decisiones.md, más los de Q4 y Q7. → §5.0.7
- **Modelo de cálculo** — Componente intercambiable, por institución, que proyecta la tabla de amortización de un préstamo o el crecimiento de una inversión. El dominio define su contrato; las fórmulas van en el Anexo A. [Q6]

---

## 2. Entidades y relaciones

### 2.1 Mapa de relaciones

```
Vigencia del ciclo 1..* ──genera──▶ Período (derivado)

Cuenta ─┬─ Cuenta de efectivo
        ├─ Tarjeta 1 ──── 1 Categoría de pago
        ├─ Préstamo ───── 0..1 Modelo de cálculo
        └─ Inversión ──── 0..1 Modelo de cálculo

Grupo 1 ──── 0..* Categoría (normal | pago)
Categoría 1 ──── 0..* Asignación (por período)
Categoría normal 1 ──── 0..1 Meta

Transacción 1 ──── 1..2 Efecto en cuenta ──── 1 Cuenta
Transacción 1 ──── 0..* Línea ──┬── 1 Categoría
                                └── 1 Por cobrar ──── 1 Deudor
Línea 1 ──── 0..* Evento (cobro | condonación | devolución)
Evento cobro / devolución 1 ──── 1 Transacción de entrada
Evento condonación ──── 0..1 Categoría elegida

SMS recibido 1 ──── 0..1 Movimiento en revisión ──── 0..1 Transacción (al aprobar o vincular)
Transacción programada 1 ──── 0..* Transacción esperada ──── 0..1 Transacción
Regla de comercio *──── 1 Categoría

Cuenta 1 ──── 0..* Registro de conciliación ──── 0..* Transacción (conciliadas)
```

### 2.2 Fichas de entidades

Cada ficha lista los atributos de negocio. Los marcados (D) son derivados y se incluyen solo como referencia; no se guardan.

#### 2.2.1 Vigencia del ciclo
- **Atributos:** día de inicio (1–31); rige desde (fecha de inicio del primer período generado con esta vigencia; la primera vigencia no tiene límite hacia el pasado).
- **Relaciones:** genera los períodos de su intervalo.
- **Reglas:** M5, Q5.

#### 2.2.2 Período (D)
- **Atributos (D):** inicio, fin, estado (cerrado, activo o futuro), duración en días, si es de transición.
- **Relaciones:** las asignaciones, transacciones y eventos se ubican en un período por su fecha; las asignaciones, por su período.
- **Reglas:** P7, M5, Q5.

#### 2.2.3 Cuenta (común)
- **Atributos:** nombre; tipo (efectivo, tarjeta, préstamo o inversión); institución; últimos cuatro dígitos (opcional; sirven para reconocer SMS); fecha de apertura; orden; archivada (sí o no).
- **Atributos (D):** dentro del presupuesto (según el tipo), saldo, saldo confirmado.
- **Relaciones:** efectos en cuenta, registros de conciliación.

#### 2.2.4 Tarjeta de crédito (variante de cuenta)
- **Atributos:** límite de crédito, tasa de interés anual, día de corte, día de pago, red, color.
- **Atributos (D):** deuda, saldo a favor, porcentaje de uso del límite, deuda sin respaldo, reserva excedente, ciclo de facturación vigente.
- **Relaciones:** exactamente una categoría de pago, creada con la tarjeta.

#### 2.2.5 Préstamo (variante de cuenta)
- **Atributos:** contraparte (banco o persona); monto original; tasa nominal anual (opcional); tipo de tasa (fija o variable); seguro del primer mes (opcional); comisión (opcional); frecuencia de cuota; cuota pactada; plazo; modelo de cálculo (opcional); cuotas ya pagadas al crearlo en Finn (P13).
- **Atributos (D):** capital pendiente, tabla de amortización proyectada, comparación entre lo proyectado y lo pagado.
- **Reglas:** P3, H6, P13, Q6.

#### 2.2.6 Inversión (variante de cuenta)
- **Atributos:** tasa o rendimiento esperado (opcional), modelo de proyección (opcional).
- **Atributos (D):** valor, proyección.

#### 2.2.7 Grupo
- **Atributos:** nombre, orden, archivado.
- **Reglas:** se archiva solo si todas sus categorías están archivadas; se elimina solo si está vacío. [supuesto 18]

#### 2.2.8 Categoría
- **Atributos:** nombre; grupo; orden; clase (normal o pago); tarjeta (solo si es de pago); archivada.
- **Atributos (D):** por período, Asig, Act, Arr, Disp, sobregiro y sus partes, fondo; meta y su estado.
- **Reglas:** I2, F3, H10, M3, N5, O3, O4.

#### 2.2.9 Transacción
- **Atributos:** tipo; fecha; hora de registro; clave de orden; origen; estado bancario; comercio o descripción; nota; total (> 0); moneda y monto original (opcional); vínculo a su movimiento en revisión (si nació de uno); vínculo a su transacción esperada (si nació de una).
- **Atributos (D):** período, medio de pago (en compras).

**Tipos de transacción** (conjunto cerrado):

| Tipo | Efectos en cuentas | Líneas | Efecto presupuestario | Origen de la regla |
|---|---|---|---|---|
| Gasto (compra) | efectivo −total, o tarjeta −total | Sí, a categorías o por cobrar; suma = total | Según sus líneas; respaldo si es con tarjeta | P10, N3 |
| Ingreso | efectivo +total | No | Entrada a LPA (ingreso) | H2 |
| Saldo inicial | la cuenta, por su saldo inicial | No | Efectivo: entrada a LPA. Tarjeta: deuda sin respaldo. Préstamo e inversión: ninguno | P13 |
| Transferencia neutral | efectivo A −total; efectivo B +total | No | Ninguno | P15, supuesto 7 |
| Pago de tarjeta | efectivo −total; tarjeta +total | Sí: una línea a pago(t) por el total | Reduce Disp(pago(t)) | P8, H5 |
| Cuota de préstamo | efectivo o tarjeta −total; préstamo −capital; interés y seguro registrados como costo | Sí: una línea a la categoría de la cuota por el total | Reduce el Disponible de esa categoría; con tarjeta, sigue la regla de respaldo | P3, H6, supuesto C-1 |
| Abono a capital | efectivo o tarjeta −total; préstamo −total | Sí: una línea a la categoría elegida | Reduce el Disponible de esa categoría; con tarjeta, sigue la regla de respaldo | P3, H6, supuesto C-1 |
| Aporte a inversión | efectivo −total; inversión +total | Sí: una línea a la categoría elegida | Reduce el Disponible de esa categoría | P3 |
| Desembolso de préstamo | préstamo +total (capital); efectivo +total | No | Entrada a LPA (otras entradas) | H13 |
| Retiro de inversión | inversión −total; efectivo +total | No | Entrada a LPA (otras entradas) | H13 |
| Avance de efectivo | tarjeta −total; efectivo +total | No | Entrada a LPA (otras entradas); aumenta S(t) | Q3 |
| Entrada a la tarjeta | tarjeta +total | No | Ninguno sobre LPA ni categorías; reduce deuda y S(t) | Q3 |
| Transferencia entre tarjetas | tarjeta X −total; tarjeta Y +total | No | Ninguno sobre LPA ni categorías; cambia S de ambas | Q3 |
| Cobro | efectivo +total, o tarjeta +total | No; su efecto se deriva del evento | Según §4.10: depende de la cuenta de depósito y del medio de pago del por cobrar; en tarjeta con por cobrar de débito, incluye un pago implícito | D1, O1, N9, Q3, Q7 |
| Devolución | efectivo +total o tarjeta +total, en la cuenta de la compra original | Sí: cada línea apunta a la categoría o al por cobrar de la línea original (con evento) o a una categoría elegida (sin compra original) | Según §4.5 y §4.11 | H7, N2, I5, P10, Q2 |
| Ajuste de valor de inversión | inversión ±total | No | Ninguno | supuesto 17 |

Notas:
- Los cargos de tarjeta (intereses y comisiones) son gastos con tarjeta en su categoría. [P8]
- Una transacción de ajuste sugerida por la conciliación es un gasto o un ingreso que crea el usuario. [supuesto 11]

#### 2.2.10 Efecto en cuenta
- **Atributos:** cuenta; monto con signo.
- **Atributos adicionales en préstamos:** capital, interés y seguro. Solo el capital cambia el saldo; interés y seguro quedan registrados como costo.

#### 2.2.11 Línea
- **Atributos:** transacción; destino (una categoría, o un por cobrar con su deudor); monto (> 0); orden dentro de la transacción.
- **Atributos (D):** parte cubierta y parte no cubierta (si es una línea de categoría de una compra); estado del por cobrar (si es una línea por cobrar).
- **Reglas:** N3. No tiene fecha. Una compra puede combinar líneas de categoría y por cobrar (P10). Dos líneas de una misma compra pueden ir a la misma categoría; se ordenan por su orden dentro de la transacción.

#### 2.2.12 Evento
- **Atributos:** tipo (cobro, condonación o devolución); línea original; fecha; monto; clave de orden.
  - Cobro y devolución: transacción de entrada que lo materializa.
  - Condonación: categoría elegida.
- **Reglas:** N3, P9, I4, I5, H8.

#### 2.2.13 Deudor
- **Atributos:** nombre.

#### 2.2.14 Por cobrar (D)
- Vista derivada de una línea por cobrar y sus eventos.
- **Atributos (D):** deudor, monto original, restituido, condonado, devuelto, saldo abierto, medio de pago de origen, fecha de origen, estado.

#### 2.2.15 Meta
- **Atributos:** categoría; tipo (mensual, semanal, anual o para una fecha); modo (acumular o rellenar hasta; solo en metas por período); monto; fecha objetivo (obligatoria en metas para una fecha, opcional en anuales); fecha de creación.
- **Atributos (D):** fecha objetivo vigente (con renovaciones), monto del período, falta, estado.

#### 2.2.16 SMS recibido
- **Atributos:** texto; remitente; instante de recepción; interpretación aplicada (formato reconocido y campos extraídos, o "no reconocido"); resultado del procesamiento.
- **Regla:** inmutable una vez guardado.

#### 2.2.17 Formato bancario
- **Atributos:** banco; tipo de movimiento que reconoce (compra, depósito, pago a tarjeta o devolución); patrón; campos que extrae.

#### 2.2.18 Movimiento en revisión
- **Atributos:** origen (SMS o importación); cuenta identificada; fecha; monto; comercio; tipo de transacción propuesto; líneas propuestas (editables); nota; estado; marca de posible duplicado y la candidata; transacción esperada propuesta para emparejar.

#### 2.2.19 Regla de comercio
- **Atributos:** patrón de comercio; categoría destino.

#### 2.2.20 Transacción programada
- **Atributos:** cuenta; comercio; monto; tolerancia (por defecto 0); líneas; frecuencia; fecha de la primera ocurrencia; fecha de fin (opcional); registro automático (sí o no); activa.

#### 2.2.21 Transacción esperada
- **Atributos:** programada; fecha esperada; monto.
- **Hechos:** su resolución (emparejada, registrada u omitida) y la transacción vinculada.
- La existencia de las pendientes se deriva de la programada.

#### 2.2.22 Registro de conciliación
- **Atributos:** cuenta; fecha del estado de cuenta; saldo según el estado; instante en que se terminó; diferencia aceptada; transacciones conciliadas en ella; cambios posteriores.
- **Atributos (D):** diferencia actual.

#### 2.2.23 Modelo de cálculo (contrato)
- **Entradas:** atributos del préstamo o de la inversión, y los pagos o aportes reales.
- **Salidas:** proyección por cuota (fecha, interés, seguro, capital, saldo), desglose propuesto para un pago real y emparejamiento de un pago con su cuota.
- El detalle está en el Anexo A.

### 2.3 Decisiones de modelado

| # | Decisión | Justificación | Alternativas descartadas |
|---|---|---|---|
| DM-1 | El período es derivado de las vigencias del ciclo; no se guarda como registro. | Elimina por construcción los huecos, solapamientos y duplicados de la 1.0 (error 7) y el cierre a medias (error 4). | Guardar períodos: reintroduce duplicados y requiere un proceso de cierre. |
| DM-2 | La asignación se guarda como un monto neto por (categoría, período). | Las reglas (H4, I1, P4, O4, F1) se evalúan sobre el valor resultante. Ninguna decisión pide auditar cada movimiento de asignación. "Mover dinero" cambia dos celdas de forma atómica. | Un registro de movimientos de asignación: el asignado pasaría a ser derivado, con más complejidad y sin una regla que lo pida. |
| DM-3 | Cobro y devolución son una transacción de entrada más un evento vinculado a la línea original. La condonación es un evento sin transacción. | Cobro y devolución mueven dinero real y deben cuadrar los saldos de cuenta (error 2). La condonación no mueve dinero. La línea original nunca cambia de fecha (N3). | Editar la línea original: rompe N3. Condonación como transacción sin efectos en cuentas: rompe "toda transacción tiene un efecto en una cuenta". |
| DM-4 | El estado de un por cobrar se deriva de su línea y sus eventos. | Ningún saldo guardado puede desactualizarse (R1). | Guardar el saldo abierto: copia que puede desactualizarse. |
| DM-5 | Solo los tipos con destino elegido tienen líneas. Los demás tienen un efecto presupuestario fijado por su tipo. | N3 limita los destinos de una línea a una categoría o a un por cobrar; LPA no es destino de línea. | LPA como destino de línea: contradice N3. |
| DM-6 | La categoría de pago es una categoría de clase "pago", con la misma mecánica de asignación, arrastre y Disponible. | La identidad de saldo (N1) y la fórmula O2 las tratan como categorías. Se reutilizan todas las reglas de arrastre y cierre. | Una entidad aparte: duplica reglas. |
| DM-7 | La interpretación de un SMS, su marca de posible duplicado y la categoría sugerida se guardan como hechos al recibirlo. | Los formatos y las reglas cambian con el tiempo, pero el registro de lo que se recibió y se propuso no debe cambiar después. Estos datos no alimentan ningún número. | Recalcularlos: un SMS antiguo podría cambiar de interpretación. |
| DM-8 | En la conciliación, la diferencia aceptada y los cambios posteriores son hechos; la diferencia actual es derivada. | La diferencia aceptada es una decisión del usuario en un momento dado (supuesto 11 modificado), no un número que se recalcula. | Derivar también la diferencia aceptada: se perdería el registro histórico que piden P12 y N6. |

---

## 3. Hechos frente a derivados

**Regla de cierre:** solo se registran los datos marcados como hecho. Todo dato marcado como derivado se calcula siempre con su fórmula y está prohibido guardarlo, incluso como caché que pueda desactualizarse. Cada número tiene una sola fórmula y todas las vistas la usan. [R1, P4, error 11]

| Bloque | Dato | Clase | Fórmula o fuente | Decisión |
|---|---|---|---|---|
| Tiempo | Vigencias del ciclo | Hecho | — | P7, M5 |
| Tiempo | Períodos (inicio, fin, transición) | Derivado | §4.2 | P7, M5, Q5 |
| Tiempo | Estado del período | Derivado | §4.2 (fecha y hoy) | P7 |
| Tiempo | Hoy | Entrada externa | Reloj, en America/El_Salvador | P18 |
| Tiempo | Fechas de corte y ciclo de facturación de la tarjeta | Derivado | §4.14 (día de corte) | P8, supuesto 19 |
| Cuentas | Atributos de cuenta, tarjeta, préstamo e inversión | Hecho | — | documento base §6 |
| Cuentas | Fecha de apertura | Hecho | — | M1 |
| Cuentas | Archivada | Hecho | — | R4 |
| Cuentas | Saldo de cuenta | Derivado | §4.3 | R1, error 2 |
| Cuentas | Saldo confirmado | Derivado | §4.3 | P11 |
| Cuentas | Deuda y saldo a favor de tarjeta | Derivado | §4.3 | P8, Q4 |
| Cuentas | Porcentaje de uso del límite | Derivado | §4.3 | documento base §6 |
| Cuentas | Capital pendiente de préstamo | Derivado | §4.3 | H6 |
| Cuentas | Valor de inversión | Derivado | §4.3 | P3, supuesto 17 |
| Cuentas | Tabla de amortización y proyección | Derivado | Anexo A | Q6 |
| Cuentas | Patrimonio neto | Derivado | §4.14 | P9 |
| Transacciones | Tipo, fecha, hora de registro, origen, comercio, nota, total, moneda original | Hecho | — | P5, P14, M4 |
| Transacciones | Clave de orden | Hecho | Hora de registro, o instante del último cambio de fecha | D2, supuesto 5 |
| Transacciones | Estado bancario | Hecho | — | P11, P12 |
| Transacciones | Efectos en cuentas (incluido el desglose de préstamo) | Hecho | — | N3, H6, supuesto 16 |
| Transacciones | Líneas (destino, monto, orden) | Hecho | — | N3, P10 |
| Transacciones | Período de una transacción o evento | Derivado | §4.2 | P5 |
| Transacciones | Medio de pago de una compra | Derivado | Tipo de la cuenta | C1 |
| Transacciones | Efecto presupuestario de los tipos sin líneas | Derivado | Tabla de 2.2.9 y §4.9 | DM-5 |
| Eventos | Evento (tipo, línea, fecha, monto, categoría de condonación) | Hecho | — | N3 |
| Eventos | Restitución y excedente de un cobro | Derivado | §4.10 | D1, N9 |
| Eventos | Pago implícito | Derivado | §4.10 | Q7 |
| Eventos | Partes a y r de una devolución con tarjeta en un período posterior | Derivado | §4.4 | N2, Q2b |
| Por cobrar | Deudor | Hecho | — | P9 |
| Por cobrar | Restituido, condonado, devuelto, saldo abierto, estado | Derivado | §4.10 | P9, DM-4 |
| Por cobrar | Dinero en camino | Derivado | §4.10 | D1 |
| Presupuesto | Grupos y categorías (nombre, orden, clase, archivada) | Hecho | — | R4, H9 |
| Presupuesto | Asig(c, p) | Hecho | — | DM-2 |
| Presupuesto | Act(c, p), gastado | Derivado | §4.4 | — |
| Presupuesto | Fondo del período | Derivado | §4.5 | H3, D2 |
| Presupuesto | Parte cubierta y no cubierta por línea | Derivado | §4.5 | P1, H3, D2 |
| Presupuesto | Traslados a categorías de pago | Derivado | §4.5 | P1, H3 |
| Presupuesto | Arr(c, p) | Derivado | §4.6 | P6, C1 |
| Presupuesto | Disp(c, p) | Derivado | §4.6 | — |
| Presupuesto | Sobregiro total y sus partes de tarjeta y débito | Derivado | §4.7 | C1, supuesto 6 |
| Presupuesto | Sobregiro con tarjeta del período abierto | Derivado | §4.7 | N1 |
| Presupuesto | Pago excedente | Derivado | §4.7 | H5, O2 |
| Presupuesto | Reducción de LPA proyectada al cierre | Derivado | §4.7 | 2.3 de 00-decisiones |
| Tarjetas | Deuda sin respaldo S(t) | Derivado | §4.8 | O2 |
| Tarjetas | "Te falta reservar" | Derivado | §4.8 (= S(t)) | PS, F4 |
| Tarjetas | Reserva excedente RE(t) | Derivado | §4.8 | Q4 |
| Tarjetas | Desglose del pago | Derivado | §4.14 | P8 |
| Presupuesto | LPA | Derivado | §4.9 | H2, O1 |
| Presupuesto | LPA al cierre de cada período | Derivado | §4.9 | error 12 |
| Presupuesto | Clasificación para reportes | Derivado | §4.13 | D1, N9, H13, Q3 |
| Metas | Atributos de la meta | Hecho | — | P6, N8 |
| Metas | Fecha objetivo vigente | Derivado | §4.12 | N8, O5 |
| Metas | Base, monto del período, falta, estado | Derivado | §4.12 | H11, F2, O5 |
| Revisión | SMS recibido | Hecho (inmutable) | — | documento base §3 |
| Revisión | Interpretación, marca de duplicado y sugerencia iniciales | Hecho (al recibir) | — | DM-7 |
| Revisión | Campos editables y estado del movimiento | Hecho | — | P11 |
| Revisión | Formatos bancarios | Hecho | — | P20 |
| Revisión | Reglas de comercio | Hecho | — | documento base §3 |
| Programadas | Transacción programada | Hecho | — | P17 |
| Programadas | Existencia de las ocurrencias pendientes | Derivado | §4.16 | P17 |
| Programadas | Resolución de una ocurrencia | Hecho | — | M2 |
| Programadas | Próximos pagos | Derivado | Ocurrencias pendientes | P17 |
| Conciliación | Registro (cuenta, fecha, saldo del estado, instante, diferencia aceptada) | Hecho | — | DM-8 |
| Conciliación | Cambios posteriores | Hecho | — | P12, N6 |
| Conciliación | Diferencia actual | Derivado | Saldo del estado − saldo de las conciliadas | DM-8 |
| Avisos | Avisos de estado | Derivado | Condición de §4 y §5 | 2.16 de 00-decisiones, Q4 |

---

## 4. Reglas de cálculo

### 4.1 Convenciones de cálculo

1. **Funciones puras.** Todo derivado es una función de los hechos y de hoy. No hay estado oculto ni resultados intermedios guardados. [R1, inv. 26]
2. **Orden cronológico.** Transacciones y eventos se ordenan por (fecha, clave de orden). Dentro de una transacción, las líneas siguen su orden propio. [D2]
3. **Ámbito.** Ningún hecho tiene fecha posterior a hoy (inv. 12), así que la actividad de un período futuro siempre es cero.
4. **Orden de evaluación.** Los períodos se evalúan del más antiguo al más reciente. Dentro de cada período:
   1. reparto D2 de cada categoría normal (§4.5), que produce los traslados;
   2. Disponible de las categorías normales;
   3. Disponible de las categorías de pago, que reciben los traslados del paso 1;
   4. arrastre al período siguiente.
   Ninguna categoría de pago influye en una categoría normal del mismo período, así que el cálculo no tiene ciclos.
5. **Primer período.** El arrastre es cero en el período más antiguo que contiene algún hecho o asignación.
6. **Consumos.** Son consumos:
   - cada línea de categoría de un gasto, con el medio de pago de su cuenta;
   - cada línea de cuota, abono a capital o aporte, con el medio de su cuenta de origen: débito si es una cuenta de efectivo; tarjeta t si la cuota se pagó con tarjeta [supuesto C-1];
   - cada condonación, con el medio de pago de la compra de su por cobrar (tarjeta t o débito), su categoría elegida y la fecha y clave de orden del evento.
   Las líneas de pago de tarjeta no son consumos.

### 4.2 Períodos

**Datos:** vigencias V₁ … Vₙ ordenadas por su "rige desde" R₁ < R₂ < … < Rₙ, con R₁ = −∞, y sus días de inicio d₁ … dₙ.

1. **Inicio de mes:** IM(m, d) = fecha(año de m, mes de m, mín(d, días del mes m)). [supuesto 15]
2. **Inicios de la vigencia Vᵢ:** el conjunto formado por Rᵢ (si i ≥ 2) más todo IM(m, dᵢ) que cumpla Rᵢ < IM(m, dᵢ) < Rᵢ₊₁, con Rₙ₊₁ = +∞.
3. **Inicios de período:** la unión ordenada de los inicios de todas las vigencias.
4. **Período:** cada inicio s genera el período [s, s′ − 1 día], donde s′ es el inicio siguiente.
5. **Período de transición:** el que empieza en Rᵢ (i ≥ 2) cuando Rᵢ no coincide con ningún IM(m, dᵢ). Va de Rᵢ al día anterior al primer IM(m, dᵢ) posterior a Rᵢ. [Q5]
6. **Período de una fecha f:** el único período con inicio ≤ f ≤ fin.
7. **Estado:** cerrado si fin < hoy; activo si inicio ≤ hoy ≤ fin; futuro si inicio > hoy.
8. **Duración:** dur(p) = fin − inicio + 1, en días.
9. **"Rige desde" de una vigencia nueva** (OP-19): el inicio del primer período futuro P tal que ni P ni ningún período posterior tienen asignaciones. [M5; precisión: así ningún período con asignaciones se redefine]

**Ejemplo (Q5).** El día de inicio cambia de 21 a 1, y el último período con asignaciones es del 21 de noviembre al 20 de diciembre. Entonces R = 21 de diciembre. El período de transición va del 21 al 31 de diciembre (11 días), y después siguen 1–31 de enero, 1–28 de febrero, etc.

### 4.3 Saldos

| Dato | Fórmula |
|---|---|
| saldo(k) | Σ de los efectos de la cuenta k que cambian el saldo. En un préstamo, solo el capital. |
| saldo(k, f) | Lo mismo, solo con los efectos de transacciones con fecha ≤ f. |
| saldo confirmado(k) | Lo mismo, solo con las transacciones en estado confirmada o conciliada. [P11] |
| deuda(t) | máx(0, −saldo(t)) |
| saldo a favor(t) | máx(0, saldo(t)) |
| uso del límite(t) | deuda(t) / límite(t), como porcentaje informativo. |
| capital pendiente | saldo(préstamo) |
| valor de inversión | saldo(inversión) |

### 4.4 Devoluciones, actividad y gastado

**Clasificación de cada línea de devolución e** (monto X, cuenta k de la devolución, período q = período de la fecha de e). L es la línea original de categoría a la que está vinculada, si existe.

| Caso | Condición | Efecto en el presupuesto |
|---|---|---|
| D-1 Neteo | e está vinculada a L, k es la cuenta de L y q es el período de L | Reduce el consumo L: m_L baja X. No hay otro efecto. [Q2a] |
| D-2 Entrada en efectivo | k es una cuenta de efectivo y no es el caso D-1 | Aporte de +X a la categoría en q. |
| D-3 Posterior en la misma tarjeta | k = cuenta de L = tarjeta t y q es posterior al período de L | a = mín(X, U_L − A_L); r = X − a. Aporte de +r a la categoría en q y −r a pago(t) en q. La parte a solo reduce la deuda. [N2, Q2b] |
| D-4 Tarjeta sin consumo correspondiente | k es una tarjeta t, y la devolución no está vinculada o L es de otra cuenta | Aporte de +X a la categoría en q y −X a pago(t) en q. Es el caso D-3 con a = 0. [P10, supuesto 13] |

Donde:
- U_L = parte no cubierta del consumo L en su propio período, después del neteo (§4.5).
- A_L = suma de las partes a de las devoluciones D-3 anteriores de L, en orden cronológico.

En todos los casos con tarjeta, la deuda de la tarjeta k baja X por el efecto en cuenta. Las devoluciones sobre una línea por cobrar no afectan categorías; siguen §4.10.

**Consumo neto:** m_k = monto del consumo − Σ X de sus devoluciones D-1. Siempre ≥ 0 (inv. 10).

**Actividad**

- Categoría normal: Act(c, p) = −Σ m_k de los consumos de c con fecha en p + Σ aportes de devoluciones D-2, D-3 y D-4 a c en p.
- Categoría de pago: Act(pago(t), p) = Σ_c Tr(c, p, t) − Σ líneas de pago a pago(t) con fecha en p − Σ pagos implícitos en t con fecha en p (§4.10) − Σ r de devoluciones D-3 en t en p − Σ X de devoluciones D-4 en t en p.

**Gastado:** Gastado(c, p) = −Act(c, p), en categorías normales. Puede ser negativo si las devoluciones superan los consumos.

### 4.5 Respaldo y reparto D2

Para cada categoría normal c y período p:

1. **Entradas del período:** Ent(c, p) = Σ aportes de devoluciones D-2, D-3 y D-4 a c en p.
2. **Fondo:** F(c, p) = Arr(c, p) + Asig(c, p) + Ent(c, p). No importa en qué momento se asignó ni cuándo llegó la entrada. [H3]
3. **Orden:** los consumos de c en p, con su monto neto m_k, se ordenan por (fecha, clave de orden, orden de línea). [D2]
4. **Reparto:**
   ```
   restante ← F(c, p)
   para cada consumo k, en orden:
       cubierto_k    ← máx(0, mín(m_k, restante))
       no_cubierto_k ← m_k − cubierto_k
       restante      ← restante − cubierto_k
   ```
5. **Traslado:** Tr(c, p, t) = Σ cubierto_k de los consumos con medio tarjeta t. Se suma a Act(pago(t), p). [P1, H3]
6. **Parte de tarjeta del sobregiro:** SobT(c, p) = Σ no_cubierto_k de los consumos con medio tarjeta.
7. **Parte de débito del sobregiro:** SobD(c, p) = máx(0, −Disp(c, p)) − SobT(c, p). [supuesto 6]

**Propiedades:**
- **Disponible:** Disp(c, p) = F(c, p) − Σ m_k, porque Act(c, p) = Ent(c, p) − Σ m_k.
- **Las partes no cubiertas son un sufijo:** una vez que el fondo se agota en un consumo, todos los siguientes quedan sin cubrir. Por eso, reducir un consumo con una devolución D-1 libera primero su propia parte no cubierta (N2) y después cubre los consumos posteriores no cubiertos (H3, Q2a).
- **0 ≤ SobT(c, p) ≤ máx(0, −Disp(c, p))** (inv. 28):
  - Si F ≥ 0, la suma de las partes no cubiertas es máx(0, Σm − F) = máx(0, −Disp), y SobT es solo una parte de esa suma.
  - Si F < 0, nada se cubre: SobT ≤ Σm < Σm − F = −Disp.
- **Las asignaciones no tienen orden** y solo cambian F. Una asignación posterior que llega antes del cierre cubre las compras con tarjeta que estaban sin cubrir y las traslada a pago(t). [H3]

### 4.6 Disponible, arrastre y cierre

| Dato | Fórmula |
|---|---|
| Disp(c, p), categoría normal | Arr(c, p) + Asig(c, p) + Act(c, p) |
| Disp(pago(t), p) | Arr + Asig + Act(pago(t), p) |
| Arr(c, p) | máx(0, Disp(c, p − 1)); 0 en el primer período |
| Reinicio N(c, p) | máx(0, −Disp(c, p)): lo que vuelve a cero al pasar al período siguiente |

**Efectos del cierre de p** (p cerrado; derivados, se recalculan siempre):
- En una categoría normal, SobD(c, p) reduce LPA (§4.9). SobT(c, p) desaparece del Disponible y queda solo dentro de la deuda de la tarjeta, como parte de S(t), sin ningún término propio. [C1, C2]
- En una categoría de pago, E(t, p) = N(pago(t), p) reduce LPA. [H5]
- Una categoría archivada sigue exactamente las mismas reglas. [N5]

**Períodos futuros:** Disp(c, f) para f > A se calcula con la misma fórmula y actividad cero. Es una proyección que solo sirve para mostrarse. La identidad de saldo usa Disp(c, A) más las asignaciones futuras (Q1).

### 4.7 Sobregiros y pago excedente

| Dato | Fórmula |
|---|---|
| Sobregiro total | máx(0, −Disp(c, p)) = SobT(c, p) + SobD(c, p) |
| Sobregiro con tarjeta del período abierto | SobTA = Σ_c SobT(c, A) |
| Pago excedente | E(t, p) = máx(0, −Disp(pago(t), p)) |
| Reducción de LPA proyectada al cierre del activo | Σ_c SobD(c, A) + Σ_t E(t, A) |

**Atribución del pago excedente para el aviso** [Propio; solo afecta la presentación, no los números]. E(t, A) se reparte por causa, en este orden, cada una hasta su suma en el período activo:
1. cobros: los pagos implícitos de t;
2. devoluciones: las partes r de D-3 y los montos X de D-4 en t;
3. pagos: el resto.

Cada parte usa su propio aviso: AV-05, AV-06 o AV-04 (§5.0.7). [O2, Q7]

### 4.8 Deuda sin respaldo, "te falta reservar" y reserva excedente

| Dato | Fórmula |
|---|---|
| Reservado R⁺(t) | máx(0, Disp(pago(t), A)) |
| Deuda sin respaldo | S(t) = máx(0, deuda(t) − R⁺(t)) [O2] |
| "Te falta reservar" | S(t) [PS, O2] |
| Reserva excedente | RE(t) = máx(0, R⁺(t) − deuda(t)) [Q4] |

- **Descomposición:** deuda(t) = R⁺(t) + S(t) − RE(t). Al menos uno de S(t) y RE(t) vale cero.
- **Presentación (F4):** el número principal es "te falta reservar $S(t)". Si E(t, A) > 0, sus avisos aparecen como información secundaria. Si RE(t) > 0, se muestra el aviso AV-08.
- Las asignaciones a pago(t) en períodos futuros no entran en R⁺(t). [inv. 2]

### 4.9 Listo para asignar

**Entradas.** Σ de:
- ingresos;
- saldos iniciales de cuentas de efectivo (con signo);
- desembolsos;
- retiros de inversión;
- avances de efectivo;
- excedentes de cobros depositados en cuentas de efectivo;
- restituciones de cobros de por cobrar pagados con tarjeta, depositados en cuentas de efectivo.

No son entradas: las entradas a una tarjeta (Q3), los cobros depositados en una tarjeta (Q3, Q7) ni los saldos iniciales de tarjetas, préstamos e inversiones.

**Fórmula** [H2, O1, H5, D1]:

LPA = Entradas
  − Σ_c Σ_p Asig(c, p) — todas las categorías, incluidas las de pago y las archivadas, y todos los períodos, incluidos los futuros
  − Σ_{p cerrado} [ Σ_c SobD(c, p) + Σ_t E(t, p) ]
  − dinero en camino (§4.10)

**LPA al cierre de un período p** (historial; error 12) [Propio]:

LPA_p = Entradas con fecha ≤ fin(p) − Σ_c Σ_{q ≤ p} Asig(c, q) − Σ_{q ≤ p} [ Σ_c SobD(c, q) + Σ_t E(t, q) ] − dinero en camino al fin(p)

- Todos los hechos se toman con fecha ≤ fin(p).
- Representa el **dinero sin trabajo en los períodos hasta p**: las entradas hasta el fin de p menos lo asignado a los períodos hasta p y las reducciones de esos cierres. Excluye los adelantos a períodos posteriores, porque DM-2 no guarda cuándo se hizo cada asignación y no se puede saber qué adelantos existían en esa fecha. Por eso puede diferir del LPA que se veía ese día si ya había asignaciones en períodos futuros. [B-4]
- **Comprobación:** Σ saldos de efectivo al fin(p) = LPA_p + Σ_c Arr(c, p + 1).

**Descomposición para la pantalla de detalle:** entradas por clase (§4.13), asignado en períodos cerrados, asignado en el activo, asignado en futuros, reducciones por sobregiros de débito, reducciones por pagos excedentes y dinero en camino.

### 4.10 Por cobrar, cobros y pago implícito

**Saldo abierto de una línea por cobrar L** (monto M). Se recorren sus eventos en orden cronológico:

```
abierto ← M
para cada evento e de L, en orden:
    cobro de C:        R_e ← mín(C, abierto); Exc_e ← C − R_e; abierto ← abierto − R_e
    condonación de K:  abierto ← abierto − K     (K ≤ abierto; si no, se rechaza)
    devolución de X:   abierto ← abierto − X     (X ≤ abierto; si no, se rechaza)
```

| Dato | Fórmula |
|---|---|
| Restituido, condonado, devuelto | Σ de R_e, K y X, respectivamente |
| Dinero en camino | Σ abierto de las líneas cuya compra fue con débito o efectivo [D1] |
| Por cobrar en el patrimonio neto | Σ abierto de todas las líneas [P9] |

**Efectos de cada evento**, según el medio de pago de la compra de L y la cuenta del evento:

| Evento | Por cobrar con débito | Por cobrar con tarjeta t |
|---|---|---|
| Registro de la línea | Efectivo −M. Dinero en camino +M, así que LPA −M. | Deuda(t) +M y S(t) +M. LPA no cambia. |
| Cobro en una cuenta de efectivo | Efectivo +C. Abierto −R, así que LPA +R. Excedente: entrada a LPA (ingreso). [D1, N9] | Efectivo +C. R: entrada a LPA (restitución), con la propuesta AV-22 de asignarla a pago(t). Excedente: entrada a LPA (ingreso). [O1, N9] |
| Cobro en una tarjeta u | Deuda(u) −C. Abierto −R, así que LPA +R. Pago implícito R: Disp(pago(u)) −R en el período del cobro. El excedente solo reduce la deuda y se clasifica como ingreso. [Q7] | Deuda(u) −C. LPA no cambia. Todo el cobro solo reduce la deuda. [Q3] |
| Condonación de K | Consumo de débito K en la categoría elegida. Abierto −K, así que LPA +K. [I4] | Consumo con tarjeta t de K en la categoría elegida, que entra al reparto D2 en la fecha del evento. [H8] |
| Devolución de X | Efectivo +X. Abierto −X, así que LPA +X. [I5] | Deuda(t) −X y S(t) −X. [I5] |

**Verificación del pago implícito con la identidad.** Al depositarse el cobro, el efectivo no cambia, LPA sube R y Disp(pago(u)) baja R. La identidad se mantiene.

Si Disp(pago(u)) queda negativo, la diferencia es un pago excedente atribuido a un cobro (AV-05) y reduce LPA al cierre. El resultado neto, después del cierre, es: LPA sube mín(R, reserva previa) y la parte de R sin reserva reduce deuda que no estaba reservada. [Q7]

### 4.11 Movimientos de tarjeta: resumen de efectos

Cada fila es el efecto de un movimiento con monto X sobre la tarjeta t. "Ef." es la suma de saldos de las cuentas de efectivo; "ΣD" es Σ Disp(·, A) más las asignaciones futuras; SobTA es el sobregiro con tarjeta del período abierto. La última columna comprueba la identidad: Δ Ef. = Δ LPA + Δ ΣD + Δ SobTA.

| Movimiento | Δ Ef. | Δ LPA | Δ ΣD | Δ SobTA | Δ deuda(t) | Δ S(t) | Identidad |
|---|---|---|---|---|---|---|---|
| Compra cubierta | 0 | 0 | 0 (−X en la categoría, +X en pago) | 0 | +X | 0 | ✓ |
| Compra no cubierta | 0 | 0 | −X | +X | +X | +X | ✓ |
| Pago X ≤ R⁺ | −X | 0 | −X | 0 | −X | 0 | ✓ |
| Pago X > R⁺ (excedente) | −X | 0 (−exceso al cierre) | −X | 0 | −X | −(X − R⁺) | ✓ |
| Devolución D-1 de un consumo no cubierto | 0 | 0 | +X | −X | −X | −X | ✓ |
| Devolución D-3 (partes a y r) | 0 | 0 | 0 (+r en la categoría, −r en pago) | 0 | −X | −a, o crea RE | ✓ |
| Devolución D-4 | 0 | 0 | 0 | 0 | −X | 0, o crea RE | ✓ |
| Entrada a la tarjeta | 0 | 0 | 0 | 0 | −X | −mín(X, S), y el resto a RE | ✓ |
| Avance de efectivo | +X | +X | 0 | 0 | +X | +X | ✓ |
| Transferencia de deuda de t a u | 0 | 0 | 0 | 0 | −X en t, +X en u | t: −mín(X, S_t), el resto a RE_t; u: +X, o menos RE_u | ✓ |
| Cobro en la tarjeta (por cobrar con tarjeta) | 0 | 0 | 0 | 0 | −C | −mín(C, S), el resto a RE | ✓ |
| Cobro en la tarjeta (por cobrar con débito) | 0 | +R | −R (pago implícito) | 0 | −C | Si R ≤ R⁺: −mín(excedente, S), y el resto a RE. Si R > R⁺: la parte sin reserva queda como pago excedente (AV-05) | ✓ |
| Saldo inicial con deuda D | 0 | 0 | 0 | 0 | +D | +D | ✓ |
| Intereses y comisiones | Igual que una compra con tarjeta (cubierta o no) | | | | | | ✓ |

### 4.12 Metas

Sea c una categoría normal con meta y p un período activo o futuro. Base(c, p) = Arr(c, p) + Act(c, p) = Disp(c, p) − Asig(c, p). [F2, supuesto 3]

**Monto del período**

| Tipo | Monto del período | Pedido |
|---|---|---|
| Mensual | monto | Acumular: monto. Rellenar hasta: máx(0, monto − Arr(c, p)) |
| Semanal | redondeo al centavo, mitad hacia arriba, de monto × dur(p) / 7 | Igual que la mensual, con el monto del período |
| Anual o para una fecha | — | ⌈ máx(0, monto − Base(c, p)) / n(p) ⌉ |

En todos los tipos: **Falta(c, p) = máx(0, Pedido − Asig(c, p)).** [H11, P6, supuestos 3 y 4]

**Fecha objetivo y n(p)**

- **Meta para una fecha:** FO = la fecha indicada.
- **Meta anual:**
  - FO₀ = la fecha indicada o, si no hay, la fecha de creación + 1 año (29 de febrero → 28 de febrero).
  - FOₖ = FO₀ + k años.
  - Para el período p rige la menor FOₖ ≥ inicio(p). Así, la renovación surte efecto desde el período siguiente al que contiene la fecha objetivo. [N8, O5, precisión de Fase 1]
- **n(p)** = número de períodos desde p hasta el que contiene la FO vigente, ambos incluidos. Si inicio(p) > FO (meta para una fecha vencida o completada), n(p) = 1. [H11, O5]

**Estados (derivados con Disp(c, A))**

| Tipo | Estado | Condición |
|---|---|---|
| Por período | Cubierta | Falta = 0 |
| Por período | Con faltante | Falta > 0 |
| Anual | Cumplida | Disp(c, A) ≥ monto |
| Anual | En curso | Disp(c, A) < monto |
| Para una fecha (hoy ≤ FO) | Cumplida / En curso | Igual que la anual |
| Para una fecha (hoy > FO) | Completada | Disp(c, período de FO) ≥ monto, o Disp(c, A) ≥ monto. Pedido = 0. [A-4] |
| Para una fecha (hoy > FO) | Vencida | En los demás casos. Pide todo lo que falta (n = 1). [O5] |

Una meta de una categoría archivada se conserva, pero no se evalúa. [Propio]

### 4.13 Clasificación para reportes

| Movimiento | Clase |
|---|---|
| Ingreso, excedente de cobro (en cualquier cuenta), entrada a la tarjeta (cashback o pago de un tercero) | Ingreso [N9, Q3, Q7] |
| Desembolso, retiro de inversión, avance de efectivo | Otras entradas [H13, Q3] |
| Restitución de un cobro (cualquier medio y cuenta) | Restitución; no es ingreso [D1, O1] |
| Saldo inicial | Saldo inicial; fuera de los flujos del período |
| Consumos netos de devoluciones (incluidas condonaciones, cuotas y aportes) | Gasto de su categoría |
| Pagos de tarjeta, transferencias neutrales y entre tarjetas | No son ingreso ni gasto |
| Interés y seguro del desglose de una cuota | Costo financiero del préstamo; detalle informativo dentro del gasto de la categoría de la cuota [H6] |

### 4.14 Patrimonio neto y datos informativos de tarjeta

- **Patrimonio neto** = Σ saldos de efectivo + Σ saldos a favor + Σ valor de inversiones + Σ por cobrar abiertos − Σ deudas de tarjeta − Σ capital pendiente de préstamos. [P9]
- **Fecha de corte** de t en el mes m: fecha(m, mín(día de corte, días de m)). El ciclo de facturación va del día siguiente a un corte hasta el corte siguiente. [supuesto 19]
- **Desglose al pagar** en la fecha f, con c₀ = la última fecha de corte < f. Es informativo y no afecta ningún número. [P8]
  - Deuda anterior = máx(0, −saldo(t, c₀)).
  - Cargos del ciclo = Σ efectos negativos en t con fecha en (c₀, f].
  - Ya pagado = Σ efectos positivos en t con fecha en (c₀, f].
  - El pago se presenta aplicado primero a la deuda anterior.
- **Monto para no generar intereses** = máx(0, deuda anterior − ya pagado). Es informativo. [documento base §16]

### 4.15 Demostración de la identidad de saldo y de la deuda sin respaldo

**Identidad (inv. 1).** Se demuestra a partir de las definiciones, así que se cumple siempre, sin depender de las operaciones.

1. Desarrollando el arrastre, Disp(c, A) = Σ_{p ≤ A} [Asig(c, p) + Act(c, p)] + Σ_{p < A} N(c, p).
2. Al sumar Act sobre todas las categorías, los traslados cancelan la parte cubierta de los consumos con tarjeta. Los aportes r y X de D-3 y D-4 se cancelan con su efecto en pago(t). Queda:
   Σ_c Act(c, p) = −Σ m_k débito + Σ aportes D-2 − SobT(p) − Pagos(p) − Implícitos(p).
3. N(c, p) = SobT + SobD en categorías normales y E en categorías de pago. Sumando todos los períodos, los SobT de los períodos cerrados se cancelan y queda solo SobTA:
   Σ_c Disp(c, A) + Σ_{fut} Asig = Σ_{todos} Asig − DébitoNeto − Pagos − Implícitos − SobTA + Σ_{p<A} (SobD + E).
4. Sumando LPA (§4.9):
   LPA + Σ_c Disp(c, A) + Σ_{fut} Asig + SobTA = Entradas − EnCamino − DébitoNeto − Pagos − Implícitos.
5. Se desarrolla EnCamino = Σ líneas por cobrar con débito − restituciones de débito (en efectivo y por pago implícito) − condonaciones de débito − devoluciones a por cobrar con débito. Los términos de Implícitos y de condonaciones de débito se cancelan.
6. El resultado coincide término a término con Σ efectos en las cuentas de efectivo: saldos iniciales, ingresos, desembolsos, retiros, avances, cobros en efectivo (restitución + excedente), devoluciones en efectivo, menos consumos de débito, líneas por cobrar con débito y pagos de tarjeta. Las transferencias neutrales suman cero. ∎

**Deuda sin respaldo (inv. 2 y 3).**
- La descomposición deuda = R⁺ + S − RE se cumple por definición en los dos casos posibles: deuda ≥ R⁺ y deuda < R⁺.
- El cierre no cambia S(t):
  - deuda(t) no depende de los períodos;
  - Disp(pago(t)) solo cambia al cierre si era negativo, y en ese caso R⁺ vale 0 antes y después;
  - SobT del período sale de la identidad, pero sigue dentro de deuda(t) − R⁺(t).
- Así, la parte no cubierta "pasa" a S(t) sin cambiar ni un centavo, como exige C1.

### 4.16 Ocurrencias de transacciones programadas

- **Frecuencias:** semanal, quincenal (cada 14 días), mensual, anual o cada N días.
- **Ocurrencia k:**
  - Frecuencias por días: primera fecha + k × intervalo.
  - Mensual y anual: el mismo día de la primera fecha, recortado al último día del mes si hace falta.
- **Generación:** solo mientras la programada está activa y hasta su fecha de fin.
- **Pendientes:** las ocurrencias sin resolución, con fecha ≤ hoy + el horizonte de "próximos pagos". Las que tienen fecha < hoy se muestran como atrasadas. [A-6]

### 4.17 Criterios de comparación

| Criterio | Regla |
|---|---|
| Autodescarte [H12] | Texto idéntico, carácter por carácter, al de otro SMS recibido en los 10 minutos anteriores. |
| Emparejamiento [M2, supuesto 8] | Misma cuenta; diferencia de monto ≤ la tolerancia de la programada; diferencia de fechas ≤ 5 días; ocurrencia pendiente, o registrada y todavía sin emparejar. Si hay varias candidatas: la de fecha más cercana, después la de menor diferencia de monto, después la de fecha esperada más antigua. [Propio] |
| Posible duplicado [P16, supuesto 9] | Hay una transacción o un movimiento no descartado con la misma cuenta, el mismo monto, una diferencia de fechas ≤ 1 día y texto distinto. |
| Coincidencia de conciliación [supuesto 10] | Misma cuenta, mismo monto y diferencia de fechas ≤ 3 días. La relación es 1 a 1: se elige la fecha más cercana y, si empatan, la clave de orden más antigua. |
| Regla de comercio | El patrón está contenido en el comercio, sin distinguir mayúsculas. Si aplican varias, gana la de patrón más largo. Se ignoran las reglas que apuntan a categorías archivadas. [Propio] |
| Sugerencia por historial | Si ninguna regla aplica: la categoría de la línea única más reciente de una transacción aprobada con el mismo comercio (comparado sin mayúsculas ni espacios repetidos) y una categoría activa. [documento base §15, Propio] |

---

## 5. Operaciones del dominio

### 5.0 Reglas comunes

**5.0.1 Atomicidad.** Cada operación se evalúa sobre el estado que resultaría de aplicarla. Si alguna precondición o invariante falla, la operación se rechaza completa y no cambia ningún hecho. Las operaciones compuestas (archivar con sus pasos, fusionar, aprobar y recordar una regla) son una sola unidad. Toda precondición incumplida es un motivo de rechazo; en cada operación, "Rechazos" lista solo los motivos adicionales. [error 4]

**5.0.2 Recálculo.** Ninguna operación escribe derivados. Después de cada operación, todos los derivados son los de la sección 4. [R1, P4]

**5.0.3 Impacto retroactivo (C3).** Si una operación cambia un hecho con fecha en un período cerrado, o mueve un hecho entre períodos (I6):
- Finn calcula, antes de confirmar, la variación en el período activo: Δ LPA, Δ Disp(c, A) de cada categoría afectada, Δ S(t), Δ RE(t) y Δ de la reducción proyectada de LPA al cierre.
- Muestra ese impacto y, después de confirmar, emite el aviso AV-01.
- No crea ajustes automáticos ni desbloquea asignaciones.

**5.0.4 Bloqueo de períodos cerrados.** Asig(c, p) de un período cerrado solo cambia por OP-12 (fusión) y OP-06 (eliminar una tarjeta con solo saldo inicial). [P4, O4, F1]

**5.0.5 Archivo.** Se aplican el invariante 20 y los supuestos A-1 y A-5.
- Una cuenta archivada no recibe transacciones nuevas.
- Se rechaza editar o eliminar una de sus transacciones si eso cambia su saldo.

**5.0.6 Fechas.** Se aplica el invariante 12 a toda transacción y evento que se crea o edita.

**5.0.7 Catálogo de avisos**

| ID | Aviso | Clase | Origen |
|---|---|---|---|
| AV-01 | Impacto de un cambio retroactivo en el período activo (§5.0.3) | Antes de confirmar y después | C3 |
| AV-02 | Sobregiro de débito: "reducirá Listo para asignar en $X al cierre" | Estado; color de débito | 2.3, H1 |
| AV-03 | Sobregiro con tarjeta: "deuda sin reservar"; los montos aparecen al tocar | Estado; color de tarjeta | H1 |
| AV-04 | "Pagaste $X más de lo reservado; reducirá Listo para asignar al cierre" | Estado | O2 |
| AV-05 | "Un cobro de $X se aplicó a la tarjeta sin reserva; reducirá Listo para asignar al cierre" | Estado | Q7 |
| AV-06 | Si la tarjeta queda con saldo a favor: "La devolución de $X quedó como saldo a favor en tu tarjeta; reducirá Listo para asignar en $X al cierre". Si la tarjeta todavía tiene deuda: "La devolución de $X regresó a {categoría}, pero ese dinero ya se había usado para pagar la tarjeta; reducirá Listo para asignar en $X al cierre". Cuando compras cubiertas consumen el saldo a favor, se libera como reserva excedente (AV-08) | Estado | B-1, C-4 |
| AV-07 | "Te falta reservar $S para tu tarjeta" | Estado; número principal de la categoría de pago | PS, O2, F4 |
| AV-08 | "Tienes $X reservado de más para esta tarjeta", con la opción de devolverlo a LPA | Estado | Q4 |
| AV-09 | Dinero "en camino": $X | Estado | D1 |
| AV-10 | El pago supera lo reservado por $X; ese exceso reducirá LPA al cierre | Antes de confirmar | I3, H5 |
| AV-11 | La asignación dejará LPA en −$X | Antes de confirmar | H4 |
| AV-12 | Fecha desde la que aplica el nuevo ciclo, con el período de transición | Antes de confirmar | M5, Q5 |
| AV-13 | Impacto de una fusión: Δ por período, meta que se descarta, programadas y reglas que se mueven | Antes de confirmar | N4, O4 |
| AV-14 | Categoría archivada con Disponible de $X; se propone sacarlo | Estado | N5 |
| AV-15 | Impacto de eliminar una cuenta con solo saldo inicial (Δ LPA, Δ S y la categoría de pago que se elimina) | Antes de confirmar | N7, O3, F1 |
| AV-16 | Advertencia antes de editar o eliminar una transacción conciliada | Antes de confirmar | P12, N6 |
| AV-17 | Meta vencida, con la sugerencia de extender la fecha o ajustar el monto | Estado | O5 |
| AV-18 | Auto-asignar: categorías que quedaron sin cubrir y por cuánto | Después | supuesto 14 modificado |
| AV-19 | Aprobar todos: movimientos no aprobados y por qué | Después | ajuste 2 |
| AV-20 | LPA negativo | Estado | H4 |
| AV-21 | Diferencia de conciliación de $X (saldo según el estado − saldo de Finn, con su signo), con la sugerencia de crear una transacción de ajuste | Al terminar y en la cuenta | supuesto 11 modificado |
| AV-22 | Propuesta, preseleccionada, de asignar el cobro de $X a pago(t) | Después de cobrar | O1 |
| AV-23 | SMS nuevo, no reconocido, posible duplicado, coincidencia con una programada, registro automático | Notificación | documento base §12 |
| AV-24 | Cambio en "te falta reservar" de las dos tarjetas de una transferencia de deuda | Después | Q3 |

### 5.1 Cuentas

**OP-01 Crear cuenta** [P13, M1, R8, Q4]
- **Entrada:** tipo y atributos; institución y últimos cuatro dígitos (opcional); fecha de apertura (por defecto, hoy); saldo actual. Préstamo en curso: cuotas ya pagadas. Tarjeta: límite, día de corte y día de pago.
- **Precondiciones:** fecha de apertura ≤ hoy; atributos obligatorios del tipo; la combinación (institución, últimos cuatro dígitos) no se repite entre cuentas abiertas o archivadas. [Propio]
- **Hechos:**
  - La cuenta.
  - Si el saldo ≠ 0, una transacción de saldo inicial con fecha = fecha de apertura y el efecto con su signo: en una tarjeta, −deuda o +saldo a favor.
  - Si es una tarjeta, su categoría de pago, de clase pago, en el grupo del sistema "Pagos de tarjeta". [Propio]
- **Derivados:** saldo. En efectivo: LPA. En tarjeta: deuda, S y RE. En préstamo: tabla de amortización.
- **Avisos:** AV-01 si la fecha de apertura está en un período cerrado.

**OP-02 Editar cuenta** [M1]
- **Entrada:** atributos editables y fecha de apertura.
- **Precondiciones:**
  - El tipo no cambia. [Propio]
  - Una nueva fecha de apertura no puede ser posterior a ninguna transacción de la cuenta, salvo el saldo inicial, que se mueve con ella.
  - La combinación (institución, últimos cuatro dígitos) sigue siendo única.
- **Hechos:** atributos; fecha del saldo inicial.
- **Avisos:** AV-01 si el saldo inicial cambia de período.
- **Nota:** cambiar el monto del saldo inicial es OP-28 sobre esa transacción.

**OP-03 Reordenar cuentas.** Solo cambia el orden. No tiene efectos de cálculo.

**OP-04 Archivar cuenta** [R4, A-5]
- **Precondiciones:**
  - saldo(k) = 0.
  - Si es una tarjeta: deuda = 0, Disp(pago(t), A) = 0 y pago(t) sin asignaciones en períodos futuros. Finn ofrece devolverlas a LPA en el mismo paso.
- **Hechos:** archivada = sí. Si es una tarjeta, también su categoría de pago. Si se aceptó la oferta, Asig(pago(t), futuros) = 0.

**OP-05 Desarchivar cuenta** [A-1]
- **Hechos:** archivada = no, también para su categoría de pago.

**OP-06 Eliminar cuenta** [H9, N7, O3, F1]
- **Precondiciones:** la cuenta no tiene transacciones aparte de su saldo inicial.
- **Hechos:**
  - Se eliminan la cuenta y su saldo inicial.
  - Si es una tarjeta, se elimina pago(t) con todas sus asignaciones, también las de períodos cerrados. Es la excepción F1.
- **Derivados:**
  - LPA: −saldo inicial si era una cuenta de efectivo; +Σ Asig(pago(t), ·) si era una tarjeta.
  - S de la tarjeta: desaparece.
- **Avisos:** AV-15 antes de confirmar; AV-01 si había hechos en períodos cerrados.

### 5.2 Grupos y categorías

**OP-07 Crear grupo o categoría**
- **Precondiciones:** el nombre no se repite dentro del grupo [Propio]; la categoría queda en un grupo activo. Solo se crean categorías normales; las de pago nacen con su tarjeta (OP-01).
- **Hechos:** grupo o categoría, en estado activa.

**OP-08 Renombrar, reordenar o mover de grupo**
- **Precondiciones:** el nombre no se repite dentro del grupo; el grupo destino está activo; una categoría de pago se queda en "Pagos de tarjeta".
- **Hechos:** nombre, orden y grupo. No tiene efectos de cálculo. El historial muestra el nombre vigente.

**OP-09 Archivar categoría** (compuesta) [H10, M3, R4]
- **Entrada:**
  - Categoría c, de clase normal.
  - Destino de su Disponible: otra categoría activa o LPA.
  - Si Disp(c, A) < 0: con qué se cubre (LPA u otra categoría).
  - Confirmación de devolver a LPA sus asignaciones futuras.
  - Para cada programada activa de c: reasignarla a una categoría activa o desactivarla.
- **Precondiciones:** c está activa; el estado resultante cumple Disp(c, A) = 0, Asig(c, futuros) = 0 y no tiene programadas activas.
- **Hechos:** Asig(c, A) se ajusta para que Disp(c, A) = 0, con el ajuste opuesto en el destino (o en LPA); Asig(c, futuros) = 0; programadas actualizadas; archivada = sí. Su meta se conserva sin evaluarse.
- **Derivados:** Disp de c y del destino, LPA y metas.

**OP-10 Desarchivar categoría** [A-1]
- **Precondiciones:** su grupo está activo, o se desarchiva en el mismo paso. Una categoría de pago se desarchiva solo con su tarjeta (OP-05).
- **Hechos:** archivada = no.

**OP-11 Sacar el Disponible de una categoría archivada** [R4, N5]
- **Entrada:** c archivada; monto X; destino (categoría activa o LPA).
- **Precondiciones:** 0 < X ≤ Disp(c, A).
- **Hechos:** Asig(c, A) −= X; Asig(destino, A) += X, o nada si el destino es LPA, que sube por la fórmula.
- **Derivados:** Disp, LPA. Se resuelve AV-14 si Disp(c, A) llega a 0.

**OP-12 Fusionar categorías** [H9, N4, O4, F3]
- **Entrada:** origen o, destino d.
- **Precondiciones:** o ≠ d; ninguna es de pago; d está activa; o está activa o archivada.
- **Hechos:**
  - Para cada período p, incluidos los cerrados (excepción O4): Asig(d, p) += Asig(o, p).
  - Todas las líneas, condonaciones y devoluciones con destino o pasan a d.
  - Las programadas y reglas de o pasan a d.
  - La meta de o se elimina.
  - o se elimina.
- **Derivados:** todo el historial de d se recalcula: D2, SobT, SobD, arrastres. Cambian LPA (por sobregiros de débito de períodos cerrados que se compensan o aparecen) y S(t).
- **Avisos:** AV-13 antes de confirmar; AV-01.

**OP-13 Eliminar categoría, eliminar grupo o archivar grupo** [H9, supuesto 18]
- **Precondiciones:**
  - Categoría: sin líneas, eventos, asignaciones, programadas ni reglas. Una categoría de pago solo se elimina mediante OP-06.
  - Eliminar un grupo: está vacío.
  - Archivar un grupo: todas sus categorías están archivadas.
- **Hechos:** se eliminan o se archivan.

### 5.3 Presupuesto y metas

**OP-14 Asignar o desasignar** [H4, I1, P4, H3, A-1]
- **Entrada:** categoría c; período p; nuevo valor de Asig(c, p), o una variación δ.
- **Precondiciones:**
  - p está activo o es futuro.
  - Si δ > 0: c está activa.
  - Si p es futuro: LPA resultante ≥ 0.
- **Hechos:** Asig(c, p).
- **Derivados:** LPA; Disp(c, p) y siguientes; el reparto D2 de c en p (puede cubrir compras con tarjeta y trasladarlas, H3); S(t) y RE(t) si c es de pago o si tiene compras con tarjeta; metas.
- **Avisos:** AV-11 si p es el activo y LPA queda negativo; la operación se ejecuta solo después de que el usuario confirma.

**OP-15 Mover dinero entre categorías** [documento base §15, YNAB]
- **Entrada:** origen o, destino d, monto X > 0, período p (activo o futuro).
- **Precondiciones:** d está activa. La categoría que entrega (o) puede estar archivada; en ese caso equivale a OP-11.
- **Hechos:** Asig(o, p) −= X; Asig(d, p) += X. LPA no cambia.
- **Nota:** si X > Disp(o, p), o queda sobregirada por la diferencia, con las reglas normales. [YNAB]

**OP-16 Asignación rápida**
- Calcula un valor y lo aplica con las reglas de OP-14, incluido AV-11.
- **Variantes:**
  - "Lo que falta para la meta": δ = Falta(c, p).
  - "Lo mismo que el período pasado": Asig(c, p) = Asig(c, p − 1).
  - "El promedio de gasto": Asig(c, p) = redondeo, con la mitad hacia arriba, del promedio de Gastado(c, q) en los últimos 3 períodos cerrados en que existía c. [Propio]

**OP-17 Auto-asignar** [P6, supuesto 14 modificado]
- **Entrada:** período p (activo o futuro); opcionalmente, un subconjunto de categorías.
- **Hechos:** se recorren las categorías activas con meta y Falta > 0, por orden de grupo y orden de categoría. A cada una se le asigna x = mín(Falta(c, p), máx(0, LPA restante)). Si LPA ≤ 0 al empezar, no se asigna nada.
- **Invariante:** LPA nunca queda negativo por esta operación.
- **Avisos:** AV-18.

**OP-18 Crear, editar o eliminar una meta** [P6, N8, O5, I2]
- **Precondiciones:**
  - Categoría normal y activa, sin otra meta.
  - Monto > 0.
  - Metas mensuales y semanales: tienen modo.
  - Meta para una fecha: tiene fecha objetivo ≥ hoy al crearla.
  - Meta anual: fecha objetivo opcional.
- **Hechos:** la meta. "Extender la fecha" y "ajustar el monto" de una meta vencida son ediciones de estos mismos hechos.
- **Derivados:** fecha objetivo vigente, pedido, falta y estado.

**OP-19 Cambiar el ciclo** [P7, M5, Q5]
- **Entrada:** nuevo día de inicio d (1–31).
- **Precondiciones:** d es distinto del día vigente.
- **Hechos:** una vigencia nueva (d, R), con R calculado según §4.2 punto 9. Si ya existía una vigencia futura que aún no rige, se reemplaza. [Propio]
- **Derivados:** los períodos desde R, el período de transición, el monto de las metas semanales y n(p) de las metas de ahorro.
- **Avisos:** AV-12, con R y las fechas del período de transición, antes de confirmar.

### 5.4 Transacciones

**OP-20 Registrar gasto** (también intereses y comisiones) [P5, P10, N3, error 9]
- **Entrada:** cuenta (efectivo o tarjeta); fecha; total; comercio; líneas (cada una a una categoría normal activa o a un por cobrar con deudor); nota; moneda original (opcional); origen.
- **Precondiciones:** cuenta abierta; Σ líneas = total; cada línea > 0; ninguna línea va a una categoría archivada ni de pago.
- **Hechos:** la transacción, con clave de orden = instante de registro; el efecto en la cuenta (−total); las líneas; el deudor si es nuevo.
- **Derivados:** saldo; reparto D2 de cada categoría en el período de la fecha; traslados; Disp; SobT y SobD; deuda, S y RE si es con tarjeta; dinero en camino y LPA si hay líneas por cobrar con débito; metas.
- **Avisos:** AV-01 si el período está cerrado. AV-02 y AV-03 como estado.

**OP-21 Registrar ingreso** [H2]
- **Entrada:** cuenta de efectivo, fecha, total, descripción.
- **Hechos:** la transacción y su efecto (+total).
- **Derivados:** saldo; LPA (+total).
- **Nota:** dinero que llega a una tarjeta sin ser un cobro es OP-27b.

**OP-22 Transferencia neutral** [P15]
- **Entrada:** dos cuentas de efectivo distintas, fecha, total.
- **Hechos:** la transacción y sus dos efectos.
- **Derivados:** solo los saldos.

**OP-23 Pagar tarjeta** [P8, I3, H5]
- **Entrada:** cuenta de efectivo de origen, tarjeta t, monto P, fecha.
- **Precondiciones:** t está abierta.
- **Hechos:** transacción de pago con efectos (efectivo −P, t +P) y una línea a pago(t) por P.
- **Derivados:** Disp(pago(t)) −P en el período de la fecha; deuda; S y RE; E(t).
- **Avisos:**
  - Desglose informativo (§4.14).
  - AV-10 si P supera máx(0, Disp(pago(t)) en el período de la fecha).
  - Si P > deuda, se informa que quedará saldo a favor.
  - AV-01 si la fecha está en un período cerrado.

**OP-24 Pagar cuota de préstamo o abonar a capital** [P3, H6, supuesto 16]
- **Entrada:** cuenta de origen (efectivo, o tarjeta según el supuesto C-1); préstamo; fecha; total; categoría normal activa; desglose de capital, interés y seguro (propuesto por el modelo, si existe, y confirmado por el usuario); cuota emparejada (si hay modelo).
- **Precondiciones:**
  - capital + interés + seguro = total, cada componente ≥ 0.
  - capital ≤ capital pendiente.
  - En un abono a capital, interés = seguro = 0.
- **Hechos:** transacción de tipo cuota o abono, con efectos (cuenta de origen −total; préstamo −capital; interés y seguro registrados como costo) y una línea a la categoría por el total.
- **Derivados:** capital pendiente; un consumo en la categoría con el medio de la cuenta de origen (débito, o tarjeta t con reparto D2 y traslado); deuda y S(t) si se pagó con tarjeta; tabla de amortización y comparación (Anexo A).

**OP-25 Aportar, retirar o ajustar una inversión** [P3, H13, supuesto 17]
- **Aporte:** efectivo −X, inversión +X, una línea a una categoría normal activa. Es un consumo de débito.
- **Retiro:** inversión −X, efectivo +X, entrada a LPA (otras entradas). Precondición: X ≤ valor.
- **Ajuste de valor:** inversión ±X, sin efecto presupuestario. Precondición: el valor resultante es ≥ 0.

**OP-26 Registrar desembolso de préstamo** [H13]
- **Hechos:** efectos (préstamo +X en capital, efectivo +X).
- **Derivados:** capital pendiente; LPA (+X, otras entradas).

**OP-27 Movimientos de tarjeta sin compra** [Q3]
- **a) Avance de efectivo:** efectos (t −X, efectivo +X). LPA +X (otras entradas); S(t) +X.
- **b) Entrada a la tarjeta** (cashback o pago de un tercero): efecto (t +X). Sin efecto presupuestario; baja S(t) o crea RE(t). Se clasifica como ingreso.
- **c) Transferencia de deuda entre tarjetas:** efectos (t +X, u −X). Cambian S y RE de ambas. Aviso AV-24.
- **Precondiciones:** las cuentas están abiertas; t ≠ u.

**OP-28 Editar transacción** [P12, I6, supuesto 5, supuesto 12, A-1]

Cualquier edición está sujeta a lo siguiente:
- Si la transacción está conciliada: AV-16 antes de confirmar.
- AV-01 si afecta un período cerrado.
- Se rechaza si cambia el saldo de una cuenta archivada.

| Campo | Precondiciones | Efecto |
|---|---|---|
| Total y líneas | Σ líneas = total. Cada línea ≥ lo ya devuelto o resuelto sobre ella (inv. 9 y 10). Una línea con eventos no cambia entre categoría y por cobrar, ni de deudor. [Propio] | Recalcula todo lo afectado. Si cambia el total y estaba conciliada: pasa a confirmada y se crea un cambio posterior. |
| Fecha | Cumple inv. 12 con la cuenta. Todo evento vinculado sigue con fecha ≥ la nueva fecha. | Clave de orden = instante del cambio. Si cambia de período, se recalculan ambos (I6). Si estaba conciliada: pasa a confirmada y se crea un cambio posterior. |
| Cuenta (incluido el medio de pago) | La cuenta nueva está abierta, es compatible con el tipo (por ejemplo, un gasto entre efectivo y tarjeta) y la fecha es ≥ su apertura. Se rechaza si la transacción tiene devoluciones vinculadas. [Propio] | Se recalcula la atribución del sobregiro según C1, D2 y H3 (criterio YNAB de 2.3). Si estaba conciliada: pasa a confirmada y se crea un cambio posterior. |
| Categoría de una línea | La categoría nueva es normal y activa. Si la línea tiene devoluciones, estas cambian de categoría con ella. | Recalcula ambas categorías. No rompe la conciliación (P12). |
| Comercio, nota, moneda original | — | Sin efectos de cálculo. |
| Desglose de una cuota | Cumple las precondiciones de OP-24. | Cambia el capital pendiente y la tabla. |

**OP-29 Eliminar transacción** [H9, N6, supuesto 12, A-2]
- **Precondiciones:** no tiene eventos vinculados.
- **Hechos:**
  - Se elimina la transacción.
  - Si resultó de un movimiento, ese movimiento pasa a "Descartado".
  - Si resolvió una ocurrencia esperada, la ocurrencia vuelve a pendiente.
  - Si estaba conciliada, se crea un cambio posterior.
- **Avisos:** AV-16 si estaba conciliada; AV-01 si afecta un período cerrado.
- **Nota:** eliminar un saldo inicial equivale a saldo inicial 0. [Propio]

**OP-30 Cambiar estado bancario** [P11, A-3]
- Sigue las transiciones de §7.2. Sin efectos de cálculo, salvo en el saldo confirmado.

### 5.5 Eventos

**OP-31 Cobrar** [P9, D1, O1, N9, Q3, Q7]
- **Entrada:** línea por cobrar L; cuenta de depósito (efectivo o tarjeta); fecha; monto C > 0.
- **Precondiciones:** saldo abierto de L > 0 en la fecha del cobro [Propio]; fecha ≥ fecha de L; cuenta abierta.
- **Hechos:** transacción de tipo cobro, con el efecto en la cuenta (+C), y el evento de cobro vinculado a L.
- **Derivados:** según la tabla de §4.10: restitución, excedente, LPA, pago implícito, deuda, S y RE, dinero en camino.
- **Avisos:**
  - AV-22 si el por cobrar fue con tarjeta y el cobro entró en una cuenta de efectivo. La asignación propuesta, si el usuario la confirma, es OP-14 en el período activo.
  - AV-05 como estado si el pago implícito deja negativa la categoría de pago.
  - AV-01 si la fecha está en un período cerrado.

**OP-32 Condonar** [P9, I4, H8, ajuste 1]
- **Entrada:** línea por cobrar L; monto K; fecha; categoría elegida. La propuesta es la primera línea de categoría de la misma compra, si existe y está activa; si no, ninguna. [Propio]
- **Precondiciones:** 0 < K ≤ saldo abierto (inv. 9); categoría normal y activa; fecha ≥ fecha de L.
- **Hechos:** el evento de condonación.
- **Derivados:** saldo abierto; un consumo en la categoría (débito, o tarjeta t con el reparto D2 de H8); LPA si fue con débito; S si fue con tarjeta.
- **Avisos:** AV-01 si la fecha está en un período cerrado. AV-02 o AV-03 si la categoría queda sobregirada.

**OP-33 Devolver** [P10, H7, N2, I5, Q2, supuesto 13, ajuste 1]
- **a) Vinculada a una compra**
  - **Entrada:** la transacción original; el monto X; su reparto entre las líneas originales (X_i); la fecha; la cuenta (por defecto, la de la compra).
  - **Precondiciones:**
    - Σ X_i = X.
    - Cada X_i ≤ la capacidad de su línea: en una línea de categoría, el monto menos lo ya devuelto; en una línea por cobrar, el saldo abierto.
    - X ≤ el total menos las devoluciones previas (inv. 11).
    - Fecha ≥ la fecha original.
    - Cuenta abierta.
  - **Hechos:** transacción de devolución (+X en la cuenta); una línea por cada X_i con el destino de su línea original, aunque esa categoría esté archivada; un evento de devolución por línea.
  - **Derivados:** según los casos D-1 a D-4 (§4.4) y §4.10 para las líneas por cobrar.
  - **Avisos:** AV-14 si una categoría archivada queda con Disponible positivo; AV-06 o AV-08 según el efecto en pago(t); AV-01.
- **b) Sin compra original**
  - **Entrada:** cuenta, fecha, X y una categoría normal activa.
  - **Efecto:** caso D-2 si la cuenta es de efectivo; caso D-4 si es una tarjeta.

**OP-34 Eliminar evento** [supuesto 12]
- **Hechos:** en un cobro o una devolución, se eliminan el evento y su transacción; en una condonación, el evento.
- **Precondiciones:** después de eliminarlo se siguen cumpliendo los invariantes 9 a 11.
- **Avisos:** AV-16 si la transacción estaba conciliada; AV-01.

### 5.6 Revisión

**OP-35 Recibir SMS** [P5, P16, P18, P19, M2, H12, R8]
- **Precondición:** el token es válido. Si no lo es, se rechaza sin guardar nada.
- **Pasos** (una sola unidad atómica después de guardar el SMS):
  1. Guardar el SMS recibido. Si un paso posterior falla, el SMS queda guardado con el resultado "error".
  2. Si cumple el criterio de autodescarte (§4.17): crear el movimiento como Autodescartado y terminar.
  3. Interpretar con los formatos. Si ninguno coincide: crear el movimiento como No reconocido, emitir AV-23 y terminar.
  4. Identificar la cuenta por (institución del formato, últimos cuatro dígitos). Si no existe o está archivada, el movimiento queda sin cuenta y no se puede aprobar hasta asignarle una. [Propio]
  5. Fecha = la fecha que trae el SMS. Si no trae fecha, la fecha local del instante de recepción. [P5, P18, Propio]
  6. Tipo propuesto: compra → gasto; depósito → ingreso; pago a tarjeta → pago de tarjeta; devolución → devolución, con la vinculación pendiente de que la indique el usuario.
  7. Emparejamiento (§4.17). Si hay una candidata: estado Con coincidencia.
  8. Si no: duplicados (§4.17). Si hay una candidata: estado Posible duplicado.
  9. Si no: estado Pendiente.
  10. Líneas propuestas: por regla de comercio; si no hay, por historial; si no, sin destino.
  11. Emitir AV-23.
- **Derivados:** ninguno presupuestario (inv. 13).

**OP-36 Editar movimiento.** Cambia cuenta, fecha, monto, comercio, tipo, líneas o nota. Sin efectos de cálculo.

**OP-37 Aprobar movimiento** [error 9, M2, P11, D2]
- **Precondiciones:**
  - Estado Pendiente, Con coincidencia (confirmada) o No reconocido (con los datos completados a mano).
  - Tiene una cuenta abierta.
  - Todas sus líneas tienen destino y suman el total.
  - Cumple las precondiciones de la operación que corresponde a su tipo: OP-20 a OP-27, OP-31 u OP-33.
- **Hechos:**
  - Se ejecuta esa operación con origen SMS y hora de registro = instante de recepción del SMS (D2).
  - El movimiento pasa a Aprobado, con el vínculo a la transacción.
  - Con coincidencia sobre una esperada pendiente: la esperada pasa a emparejada.
  - Con coincidencia sobre una transacción ya registrada por la programada: no se crea otra transacción; se vincula y el monto de la registrada pasa a ser el del SMS, con las reglas de OP-28. [Propio]
  - Opcional, "recordar esta categoría para este comercio": crea o actualiza la regla de comercio (comercio → categoría) si el movimiento tiene una sola línea de categoría.
- **Avisos:** los de la operación ejecutada.

**OP-38 Aprobar todos** [error 9, ajuste 2]
- **Elegibles:** los movimientos en estado Pendiente que cumplen las precondiciones de OP-37. Los que están Con coincidencia, Posible duplicado o No reconocido necesitan una decisión individual. [Propio]
- **Hechos:** se ejecuta OP-37 para cada elegible, como operación atómica independiente. Los que fallan quedan en la bandeja sin cambios.
- **Avisos:** AV-19, con cada movimiento no aprobado y su motivo.

**OP-39 Descartar o restaurar movimiento** [A-2]
- **Descartar:** desde Pendiente, Posible duplicado o No reconocido, pasa a Descartado.
- **Restaurar:** desde Descartado o Autodescartado, vuelve a Pendiente y se reevalúan los pasos 7 y 8 de OP-35.

**OP-40 Resolver una coincidencia o un posible duplicado** [M2, P16]
- **Coincidencia:** confirmar ejecuta OP-37. Rechazar evalúa los duplicados y deja el movimiento en Pendiente o Posible duplicado.
- **Posible duplicado:** "es legítimo" lo deja en Pendiente. "Es duplicado" lo pasa a Descartado.

**OP-41 Crear, editar o eliminar reglas de comercio**
- **Precondiciones:** patrón no vacío; la categoría es normal y activa.

### 5.7 Transacciones programadas

**OP-42 Crear, editar, desactivar o reactivar una programada** [P17, M3]
- **Precondiciones:** la cuenta está abierta; las líneas van a categorías normales activas y suman el monto; tolerancia ≥ 0.
- **Hechos:** la programada.
- **Derivados:** ocurrencias pendientes y próximos pagos. Sin efecto presupuestario (inv. 13).

**OP-43 Registrar una ocurrencia esperada** [P17]
- **Con un toque:** se ejecuta OP-20, u otra operación según su tipo, con la fecha esperada y los datos de la programada (editables). La ocurrencia pasa a registrada.
- **Automático:** toda ocurrencia de una programada con registro automático, con fecha esperada ≤ hoy y sin resolver, se registra con su **fecha esperada** (nunca con la de hoy), con origen programada. Si hay varias, se registran en orden cronológico. [corrección B-12]
  - **Idempotencia:** una ocurrencia resuelta nunca se vuelve a registrar (inv. 15). Repetir la operación no produce cambios.
  - **Fallo:** si fallan las precondiciones (por ejemplo, la cuenta está archivada), esa ocurrencia no se registra, queda pendiente y se notifica (AV-23). Las demás siguen.
  - Cada registro es atómico por separado.
  - AV-01 si la fecha esperada cae en un período cerrado.

**OP-44 Omitir una ocurrencia esperada** [A-6]
- **Hechos:** la ocurrencia pasa a omitida.

### 5.8 Conciliación

**OP-45 Iniciar conciliación** [P20, R8]
- **Entrada:** cuenta; archivo CSV.
- **Pasos:**
  1. Reconocer el formato del banco.
  2. Extraer los movimientos (fecha, monto, descripción), la fecha del estado y el saldo final.
  3. Clasificar en coincidencias, solo en el estado y solo en Finn (§4.17).
- **Hechos:** ninguno hasta terminar. La conciliación en curso no cambia hechos del dominio.
- **Rechazos:** formato no reconocido.

**OP-46 Agregar desde el estado** [R8, A-3]
- Es una acción explícita del usuario por cada movimiento.
- Ejecuta OP-20 (u otra operación según el tipo) con origen importada, estado confirmada y la fecha del estado.

**OP-47 Terminar conciliación** [P11, P12, supuesto 11 modificado]
- **Hechos:**
  - Las coincidencias que el usuario marcó pasan a conciliada.
  - Se crea el registro: cuenta, fecha del estado, saldo según el estado, instante y diferencia aceptada = saldo según el estado − saldo(cuenta, fecha del estado).
- **Derivados:** diferencia actual = saldo según el estado − saldo(cuenta, fecha del estado), siempre recalculada.
- **Avisos:** AV-21 si la diferencia ≠ 0. Finn sugiere una transacción de ajuste, pero no la crea.

### 5.9 Préstamos

**OP-48 Registrar o editar las condiciones de un préstamo** [P3, Q6]
- **Hechos:** los atributos del préstamo y su modelo de cálculo.
- **Derivados:** tabla de amortización y comparación entre lo proyectado y lo pagado (Anexo A). Sin efecto presupuestario.

---

## 6. Invariantes

Deben cumplirse después de toda operación (sección 5) y en todo momento, también con el período abierto. Una operación que rompería alguna se rechaza completa.

**Conservación del dinero**

1. **Identidad de saldo.** Σ saldo de las cuentas de efectivo = LPA + Σ_c Disp(c, A) + Σ_c Σ_{p futuro} Asig(c, p) + sobregiro con tarjeta del período abierto. Se suman todas las categorías, incluidas las de pago y las archivadas. [N1, Q1]
2. **Deuda sin respaldo.** Para toda tarjeta t, S(t) = máx(0, deuda(t) − máx(0, Disp(pago(t), A))). Nunca se guarda. Las asignaciones a pago(t) en períodos futuros no reducen S(t) hasta que llega su período, igual que en I1. [O2, Q1]
3. **Reserva excedente.** Para toda tarjeta t, RE(t) = máx(0, Disp(pago(t), A) − deuda(t)). En todo momento, S(t) = 0 o RE(t) = 0. [Q4]
4. **Saldo de cuenta.** El saldo de cada cuenta es exactamente la suma de sus efectos que cambian el saldo; en un préstamo, solo el capital. [error 2, H6]
5. **Cada dólar una vez.** Ningún monto afecta a la vez LPA y un Disponible, ni dos Disponibles, salvo por los traslados derivados de §4.5, que restan de una categoría y suman a una de pago por el mismo monto. [C1]

**Transacciones, líneas y eventos**

6. En los tipos con líneas (gasto, devolución, pago de tarjeta, cuota, abono a capital, aporte), la suma de las líneas es igual al total. Los demás tipos no tienen líneas (2.2.9). [N3, DM-5]
7. Ninguna línea tiene fecha. El período de una línea es el de su transacción; el de un evento, el de su propia fecha. [N3]
8. Toda línea de una transacción aprobada tiene destino: una categoría normal o un por cobrar con deudor. Las líneas de pago de tarjeta van a su categoría de pago, y solo ellas. [error 9, P8]
9. Para cada línea por cobrar: restituido + condonado + devuelto ≤ monto de la línea. El saldo abierto nunca es negativo. [P9, I5]
10. Para cada línea de categoría: Σ devoluciones aplicadas ≤ monto de la línea. [I5]
11. Para cada transacción: Σ devoluciones aplicadas a sus líneas ≤ total. [I5]
12. La fecha de toda transacción cumple fecha de apertura de la cuenta ≤ fecha ≤ hoy. La fecha de todo evento cumple fecha de la transacción original ≤ fecha del evento ≤ hoy. [supuesto 2]
13. Los movimientos en revisión, las transacciones programadas y las esperadas no afectan saldos, Disponibles, LPA ni deuda sin respaldo. [R8, P11, P17]
14. Una conciliación nunca crea, modifica ni elimina transacciones por sí misma; solo cambia estados bancarios a conciliada. [R8]
15. Un movimiento aprobado produce exactamente una transacción nueva o se vincula a exactamente una existente. Una transacción esperada se resuelve como máximo una vez. [M2]
16. Solo se autodescarta un SMS cuyo texto es idéntico al de otro recibido dentro de los 10 minutos anteriores. Ningún otro caso se descarta solo. [P16, H12]

**Períodos y asignaciones**

17. Los períodos no tienen huecos ni solapamientos y hay exactamente un período activo. [P7]
18. Asig(c, p) de un período cerrado no cambia, salvo por dos operaciones: la fusión de categorías (O4) y la eliminación de una tarjeta con solo saldo inicial (F1). [P4, O4, F1]
19. Después de una asignación en un período futuro, o de un auto-asignar en cualquier período, LPA ≥ 0. Solo una asignación manual en el período activo puede dejar LPA negativo, y lo hace con aviso. [I1, H4, supuesto 14 modificado]
20. Una categoría archivada no recibe asignaciones positivas nuevas ni consumos nuevos: ni líneas de gastos, cuotas o aportes, ni condonaciones. Sí admite:
    - cambios retroactivos en sus líneas existentes;
    - devoluciones vinculadas a sus líneas existentes, porque son la reversión de un consumo y no un uso nuevo;
    - que se saque su Disponible.
    Si una devolución o un cambio retroactivo le deja Disp(c, A) > 0, se emite el aviso de N5. [R4, N5, I4, supuesto A-1, ajuste 1 a la Parte A]
21. Una vigencia nueva del ciclo nunca cambia las fechas de un período que tenga asignaciones. [M5]

**Estructura**

22. Cada tarjeta tiene exactamente una categoría de pago, y cada categoría de pago pertenece exactamente a una tarjeta. [R8]
23. Una categoría de pago no tiene meta y no participa en una fusión, ni como origen ni como destino. [I2, F3]
24. Una cuenta archivada tiene saldo cero. Una tarjeta con deuda no está archivada. [R4]
25. Ninguna entidad eliminada deja referencias. Solo se elimina lo que no tiene historial, con las excepciones de O3 y F1. [H9, N7, O3, F1]

**Cálculo**

26. **Determinismo.** Los mismos hechos y la misma fecha de hoy producen siempre los mismos derivados, sin importar el orden en que se registraron, salvo por la clave de orden, que es un hecho. [P4, D2]
27. **Una sola fórmula.** Cada derivado se calcula con una única fórmula de la sección 4, y todas las vistas usan esa misma fórmula. [error 11]
28. **Partes del sobregiro.** Para toda categoría y período, 0 ≤ parte de tarjeta ≤ sobregiro total. [C1, supuesto 6]

---

## 7. Ciclos de vida

Las transiciones no listadas no son válidas. "(D)" indica que el estado se deriva y no se guarda.

### 7.1 Movimiento en revisión

**Estados:**
- **Pendiente:** espera decisión del usuario.
- **Con coincidencia:** pendiente con una transacción esperada (o la transacción ya registrada por ella) propuesta para emparejar.
- **Posible duplicado:** pendiente con una candidata a duplicado.
- **No reconocido:** el SMS no coincide con ningún formato.
- **Aprobado** (terminal): resultó en una transacción nueva o se vinculó a una existente.
- **Descartado:** el usuario lo descartó.
- **Autodescartado:** se descartó solo por H12.

| Desde | Hacia | Causa | Regla |
|---|---|---|---|
| (llegada) | Autodescartado | Texto idéntico a un SMS recibido dentro de los 10 minutos anteriores | P16, H12 |
| (llegada) | No reconocido | Ningún formato coincide | P19 |
| (llegada) | Con coincidencia | Empareja con una esperada (M2, se evalúa primero) | M2, supuesto 8 |
| (llegada) | Posible duplicado | Sin coincidencia y con candidata de duplicado | P16, supuesto 9 |
| (llegada) | Pendiente | Ningún caso anterior | — |
| Con coincidencia | Aprobado | El usuario confirma: se vincula a la existente o se crea la transacción desde la esperada | M2 |
| Con coincidencia | Pendiente, o Posible duplicado | El usuario rechaza la coincidencia; se evalúan los duplicados | M2 |
| Posible duplicado | Pendiente | El usuario indica que es una compra legítima | P16 |
| Posible duplicado | Descartado | El usuario indica que es un duplicado | P16 |
| Pendiente | Aprobado | El usuario aprueba; requiere que todas las líneas tengan destino | error 9 |
| Pendiente | Descartado | El usuario lo descarta | — |
| No reconocido | Aprobado | El usuario crea la transacción a mano desde él | P19 |
| No reconocido | Descartado | El usuario lo descarta | P19 |
| Descartado o Autodescartado | Pendiente | El usuario lo restaura; se reevalúan coincidencias y duplicados | supuesto A-2 |
| Aprobado | Descartado | Se elimina la transacción que resultó de él; el movimiento puede restaurarse después | supuesto A-2, inv. 15 |

"Aprobar todos" aplica "Pendiente → Aprobado" a cada movimiento elegible, como una aprobación atómica independiente por movimiento. Los que no cumplen las precondiciones quedan en la bandeja, y Finn informa cuáles son y por qué. Nunca se aprueba un movimiento con alguna línea sin destino. [error 9, ajuste 2 a la Parte A] → OP-38

### 7.2 Transacción: estado bancario

**Estados:** pendiente, confirmada, conciliada. Además existe el fin de vida "eliminada".

**Estado inicial:**
- Origen SMS, manual o programada: pendiente.
- Importada desde una conciliación ("agregar desde el estado"): confirmada, y pasa a conciliada si se incluye al terminar esa conciliación. [supuesto A-3]

| Desde | Hacia | Causa | Regla |
|---|---|---|---|
| Pendiente | Confirmada | El usuario la marca | P11 |
| Confirmada | Pendiente | El usuario la desmarca | supuesto A-3 |
| Pendiente o Confirmada | Conciliada | Se incluye en una conciliación terminada | P11 |
| Conciliada | Confirmada | Cambia su monto, fecha o cuenta (con advertencia previa). Se crea un cambio posterior en el registro | P12 |
| Conciliada | Conciliada | Cambia su categoría, líneas sin cambio de total, comercio o nota | P12 |
| Cualquiera | Eliminada | El usuario la elimina. Si estaba conciliada: advertencia previa y cambio posterior en el registro. Se rechaza si tiene eventos vinculados | P12, N6, supuesto 12 |

### 7.3 Período (D)

**Estados:** futuro → activo → cerrado.

- La transición depende solo de la fecha de hoy: el período cuyo inicio llega pasa a activo y el anterior pasa a cerrado. No hay operación de cierre. [P7]
- Un período futuro sin asignaciones, y todos los siguientes, se redefinen cuando entra en vigor una vigencia nueva del ciclo. Un período con asignaciones nunca se redefine. [M5, Q5]

### 7.4 Por cobrar (D)

**Estados:**
- **Abierto:** saldo abierto = monto de la línea.
- **Parcial:** 0 < saldo abierto < monto.
- **Cerrado:** saldo abierto = 0.

| Desde | Hacia | Causa | Regla |
|---|---|---|---|
| (creación) | Abierto | Se aprueba o registra una transacción con una línea por cobrar | P10 |
| Abierto o Parcial | Parcial o Cerrado | Cobro, condonación o devolución aplicados | P9, I4, I5 |
| Parcial o Cerrado | Abierto o Parcial | Se elimina un evento vinculado | supuesto 12 |
| Cualquiera | (desaparece) | Se elimina la transacción; se rechaza si tiene eventos vinculados | supuesto 12 |

Notas:
- Al cerrarse por un cobro mayor que el saldo abierto, el excedente se clasifica como ingreso. [N9]
- Un cobro depositado en una tarjeta cierra el por cobrar igual que uno en efectivo. Sus efectos en LPA y en la categoría de pago siguen §4.10 (Q3, Q7).
- Una condonación nunca va a una categoría archivada. Si la categoría original lo está, Finn propone otra activa. [I4, ajuste 1]
- Una devolución aplicada a una línea por cobrar reduce su saldo abierto, aunque la compra tenga otras líneas en categorías archivadas. [I5]

### 7.5 Meta

**Metas por período (mensual o semanal)**
- **Estados:** activa o eliminada.
- **Estado del período (D):** cubierta si falta = 0; con faltante si falta > 0.

**Meta anual**

| Desde | Hacia | Causa (D) | Regla |
|---|---|---|---|
| En curso | Cumplida | Disponible ≥ monto antes de la fecha objetivo | N8 |
| Cumplida | En curso | Disponible < monto antes de la fecha objetivo | N8 |
| En curso o Cumplida | En curso (renovada) | Llega la fecha objetivo: se fija una nueva un año después, con o sin cumplimiento. El dinero no gastado cuenta para la nueva meta | N8, O5, F2 |

**Meta para una fecha**

| Desde | Hacia | Causa | Regla |
|---|---|---|---|
| En curso | Cumplida | Disponible ≥ monto antes de la fecha objetivo (D) | N8 |
| Cumplida | En curso | Disponible < monto antes de la fecha objetivo (D) | N8 |
| Cumplida | Completada | Llega la fecha objetivo estando cumplida (D). Ya no pide nada | supuesto A-4 |
| En curso | Vencida | Llega la fecha objetivo sin cumplirse (D). Pide todo lo que falta en el período actual | O5 |
| Vencida | En curso | El usuario extiende la fecha o ajusta el monto | O5 |
| Vencida | Completada | El Disponible alcanza el monto (D) | supuesto A-4 |

Cualquier meta puede eliminarse. Al fusionar categorías, la meta de la categoría origen se descarta. [O4]

### 7.6 Categoría

**Estados:** activa, archivada, eliminada.

| Desde | Hacia | Causa y precondiciones | Regla |
|---|---|---|---|
| (creación) | Activa | La crea el usuario; una categoría de pago, al crear su tarjeta | R8 |
| Activa | Archivada | Disp(c, A) = 0, sin asignaciones en períodos futuros (Finn ofrece devolverlas) y sin programadas activas (Finn ofrece reasignarlas o desactivarlas). Una categoría de pago solo se archiva junto con su tarjeta | H10, M3, supuesto A-5 |
| Archivada | Activa | El usuario la desarchiva | supuesto A-1 |
| Activa | Eliminada | Sin líneas, eventos, asignaciones ni programadas | H9 |
| Activa o Archivada | Eliminada (fusionada) | Fusión como origen hacia un destino activo; ninguna de las dos es de pago | N4, O4, F3 |
| (pago) Activa o Archivada | Eliminada | Se elimina su tarjeta con solo saldo inicial; sus asignaciones, también las de períodos cerrados, vuelven a LPA | O3, F1 |

Movimientos que admite una categoría archivada (inv. 20):
- Devoluciones vinculadas a sus líneas: crean su línea de devolución hacia esa categoría. [ajuste 1]
- Condonaciones: no admite. Finn propone otra categoría activa. [I4, ajuste 1]

Avisos de estado en una categoría archivada:
- Si un cambio retroactivo o una devolución le deja Disp(c, A) > 0, Finn avisa y propone sacarlo. [N5, ajuste 1]
- Si le deja un sobregiro, se aplica C1 al cierre. [N5]

### 7.7 Cuenta

**Estados:** abierta, archivada, eliminada.

| Desde | Hacia | Causa y precondiciones | Regla |
|---|---|---|---|
| (creación) | Abierta | Se crea con su saldo inicial; si es tarjeta, se crea su categoría de pago | P13, R8 |
| Abierta | Archivada | Saldo = 0. Si es tarjeta: deuda = 0 y su categoría de pago cumple las precondiciones de archivado (Disp = 0, sin asignaciones futuras); ambas se archivan juntas | R4, H10, supuesto A-5 |
| Archivada | Abierta | El usuario la desarchiva | supuesto A-1 |
| Abierta o Archivada | Eliminada | Sin transacciones aparte del saldo inicial. Si es tarjeta: se elimina con su categoría de pago y sus asignaciones de todos los períodos vuelven a LPA. Finn muestra el impacto antes | H9, N7, O3, F1 |

Una cuenta archivada no recibe transacciones nuevas. Se rechaza editar una de sus transacciones si eso cambia su saldo; primero hay que desarchivarla. [R4, supuesto A-1]

### 7.8 Transacción esperada

**Estados:** pendiente (D), emparejada, registrada, omitida.

| Desde | Hacia | Causa | Regla |
|---|---|---|---|
| (D) | Pendiente | La programada activa genera una ocurrencia en su fecha | P17 |
| Pendiente | Emparejada | Un movimiento en revisión se empareja y el usuario lo confirma | M2 |
| Pendiente | Registrada | Registro con un toque, o automático si la programada lo indica y la fecha esperada es ≤ hoy (OP-43) | P17 |
| Registrada | Emparejada | Llega el SMS que corresponde a la transacción ya registrada y el usuario confirma el vínculo; no se crea otra transacción | M2 |
| Pendiente | Omitida | El usuario la omite | supuesto A-6 |

Una ocurrencia pendiente cuya fecha pasó sigue pendiente y se muestra como atrasada. Con registro automático, esto solo ocurre si su registro falló. [supuesto A-6, B-12]

---

## 8. Escenarios numéricos

### 8.0 Convenciones de los escenarios

- **Ciclo:** día de inicio 21.

| Período | Fechas (2027) | Días |
|---|---|---|
| P1 | 21 ene – 20 feb | 31 |
| P2 | 21 feb – 20 mar | 28 |
| P3 | 21 mar – 20 abr | 31 |
| P4 | 21 abr – 20 may | 30 |
| P5 | 21 may – 20 jun | 31 |
| P6 | 21 jun – 20 jul | 30 |

- **Cuentas:** Ahorro (efectivo); tarjetas T y U, con categorías de pago "Pago T" y "Pago U". Montos en USD.
- **"Hoy"** se indica en cada escenario o paso; determina el período activo (A).
- **Columnas de las tablas:**
  - **Ef:** Σ saldos de las cuentas de efectivo.
  - **LPA:** Listo para asignar.
  - **Disponibles:** los Disp(·, A) distintos de cero y, con "(fut)", las asignaciones en períodos futuros.
  - **ΣD:** su suma.
  - **SobTA:** sobregiro con tarjeta del período abierto.
  - **Identidad:** LPA + ΣD + SobTA = Ef (inv. 1).
  - **Tarjeta:** deuda · S · RE.
- Cada escenario es independiente, salvo que diga "continúa".
- Todos los escenarios se convierten en pruebas automáticas: cada fila es una aserción sobre el estado después del paso.

### Base y saldos iniciales

#### ESC-01 Saldos iniciales [P13, M1, P3]
Hoy: 5 feb (A = P1).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Crear Ahorro (apertura 5 feb, saldo 1,000) | 1,000 | 1,000 | — | 0 | 1,000 + 0 + 0 = 1,000 ✓ | — | Entrada: saldo inicial |
| 2 | Crear T con deuda 300 | 1,000 | 1,000 | — | 0 | ✓ | 300 · 300 · 0 | AV-07 "te falta reservar $300" |
| 3 | Asignar 300 a Pago T (P1) | 1,000 | 700 | Pago T 300 | 0 | 700 + 300 = 1,000 ✓ | 300 · 0 · 0 | |
| 4 | Crear préstamo en curso (capital 5,000; 10 cuotas pagadas) | 1,000 | 700 | Pago T 300 | 0 | ✓ | 300 · 0 · 0 | Sin efecto presupuestario. Patrimonio = 1,000 − 300 − 5,000 = −4,300 |

#### ESC-02 Saldo inicial con fecha en un período cerrado [M1, P4, C3]
Hoy: 5 mar (A = P2).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Crear Ahorro con apertura 25 ene (P1), saldo 500 | 500 | 500 | — | 0 | 500 = 500 ✓ | — | AV-01: Δ LPA +500 |
| 2 | Crear T con apertura 25 ene, deuda 200 | 500 | 500 | — | 0 | ✓ | 200 · 200 · 0 | AV-01: Δ S +200 |
| 3 | Comprobación del historial (§4.9) | | LPA_P1 = 500 | | | Ef(20 feb) = 500 = LPA_P1 + Σ Arr(P2) = 500 + 0 ✓ | | |

#### ESC-03 Ingreso, asignación, asignar de más y límite de futuros [H4, I1, supuesto 14]
Hoy: 5 feb (A = P1). Mascota tiene meta mensual de 50.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000 | 1,000 | 1,000 | — | 0 | ✓ | |
| 2 | Asignar 600 a Super (P1) | 1,000 | 400 | Super 600 | 0 | 400 + 600 = 1,000 ✓ | |
| 3 | Asignar 300 a Salidas (P2) | 1,000 | 100 | Super 600; Salidas(fut) 300 | 0 | 100 + 900 = 1,000 ✓ | Q1: la asignación futura suma una sola vez |
| 4 | Asignar 200 a Gas (P2) | — | — | — | — | — | **Rechazado:** LPA quedaría en −100 (I1) |
| 5 | Asignar 200 a Gas (P1), con aviso | 1,000 | −100 | Super 600; Gas 200; Salidas(fut) 300 | 0 | −100 + 1,100 = 1,000 ✓ | AV-11 antes de confirmar; AV-20 |
| 6 | Auto-asignar (P1) | 1,000 | −100 | Sin cambios | 0 | ✓ | Con LPA ≤ 0 no asigna nada. AV-18: Mascota sin cubrir por 50 |

### Tarjeta de crédito

#### ESC-04 Compra con tarjeta cubierta [P1, H3; fila 1 de la tabla de 2.1]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super | 1,000 | 700 | Super 300 | 0 | 700 + 300 = 1,000 ✓ | 0 · 0 · 0 |
| 2 | Compra con T de 100 en Super | 1,000 | 700 | Super 200; Pago T 100 | 0 | 700 + 300 + 0 = 1,000 ✓ | 100 · 0 · 0 |

#### ESC-05 Compra con tarjeta no cubierta y cierre [C1; fila 3]
Hoy: 15 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super | 1,000 | 700 | Super 300 | 0 | ✓ | 0 · 0 · 0 |
| 2 | Compra con T de 400 en Super (10 feb): 300 cubiertos, 100 no | 1,000 | 700 | Super −100; Pago T 300 | 100 | 700 + 200 + 100 = 1,000 ✓ | 400 · 100 · 0 |
| 3 | Hoy = 21 feb (cierre de P1; A = P2) | 1,000 | 700 | Super 0; Pago T 300 | 0 | 700 + 300 + 0 = 1,000 ✓ | 400 · 100 · 0 |

El cierre no cambia LPA ni S: la parte no cubierta pasa a S sin cambiar ni un centavo (§4.15).

#### ESC-06 Asignación posterior que cubre el sobregiro con tarjeta [H3]
Continúa el paso 2 de ESC-05 (hoy 15 feb).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 3 | Asignar 100 más a Super (P1) | 1,000 | 600 | Super 0; Pago T 400 | 0 | 600 + 400 = 1,000 ✓ | 400 · 0 · 0 |

El fondo pasa a 400 y cubre toda la compra, aunque la asignación fue posterior.

#### ESC-07 Cubrir deuda sin respaldo de un período cerrado [P1]
Continúa el paso 3 de ESC-05 (A = P2).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 4 | Asignar 100 a Super (P2) | 1,000 | 600 | Super 100; Pago T 300 | 0 | 600 + 400 = 1,000 ✓ | 400 · 100 · 0 | Asignar a una categoría normal no cubre deuda de períodos cerrados |
| 5 | Asignar 100 a Pago T (P2) | 1,000 | 500 | Super 100; Pago T 400 | 0 | 500 + 500 = 1,000 ✓ | 400 · 0 · 0 | |

#### ESC-08 Pago parcial con desglose [P8]
T con día de corte 15. Hoy: 19 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 500 a Super; compras con T de 200 (3 feb) y 100 (18 feb) en Super | 1,000 | 500 | Super 200; Pago T 300 | 0 | 500 + 500 = 1,000 ✓ | 300 · 0 · 0 | |
| 2 | Pagar 150 (19 feb) | 850 | 500 | Super 200; Pago T 150 | 0 | 500 + 350 = 850 ✓ | 150 · 0 · 0 | Desglose: deuda anterior al corte del 15 feb = 200; cargos del ciclo = 100; ya pagado = 0. El pago se aplica a la deuda anterior. Monto para no generar intereses después del pago = 50 |

#### ESC-09 Pago total [P8]
Continúa ESC-08.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 3 | Pagar 150 | 700 | 500 | Super 200; Pago T 0 | 0 | 500 + 200 = 700 ✓ | 0 · 0 · 0 |

#### ESC-10 Pago excedente, antes y después del cierre [H5, O2; filas 4 y 5]
Hoy: 15 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 200; asignar 100 a Super | 200 | 100 | Super 100 | 0 | ✓ | 0 · 0 · 0 | |
| 2 | Compra A con T de 100 en Super; compra B con T de 50 en Salidas (sin fondos) | 200 | 100 | Super 0; Salidas −50; Pago T 100 | 50 | 100 + 50 + 50 = 200 ✓ | 150 · 50 · 0 | AV-03 en Salidas |
| 3 | Pagar 150 a T | 50 | 100 | Super 0; Salidas −50; Pago T −50 | 50 | 100 − 100 + 50 = 50 ✓ | 0 · 0 · 0 | AV-10 antes de confirmar. AV-04 "pagaste $50 más…". Reducción proyectada = 50 |
| 4 | Hoy = 21 feb (cierre) | 50 | 50 | — | 0 | 50 + 0 + 0 = 50 ✓ | 0 · 0 · 0 | E(T, P1) = 50 reduce LPA |

#### ESC-11 Pago excedente con deuda restante [F4]
Hoy: 15 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 300; asignar 100 a Super; compra con T de 100 en Super; compra con T de 50 en Salidas (sin fondos) | 300 | 200 | Super 0; Salidas −50; Pago T 100 | 50 | 200 + 50 + 50 = 300 ✓ | 150 · 50 · 0 | |
| 2 | Pagar 120 | 180 | 200 | Salidas −50; Pago T −20 | 50 | 200 − 70 + 50 = 180 ✓ | 30 · 30 · 0 | Principal: "te falta reservar $30". Secundario: AV-04 por 20 |

#### ESC-12 Intereses y comisiones [P8]
Hoy: 16 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 20 a "Intereses y comisiones" | 500 | 480 | Int 20 | 0 | ✓ | 0 · 0 · 0 |
| 2 | Cargo con T de 25 en Int: 20 cubiertos, 5 no | 500 | 480 | Int −5; Pago T 20 | 5 | 480 + 15 + 5 = 500 ✓ | 25 · 5 · 0 |

#### ESC-13 Saldo a favor por pago y reserva excedente [Q4, H5]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T (deuda · S · RE · a favor) | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super; compra con T de 100 en Super | 500 | 400 | Super 0; Pago T 100 | 0 | ✓ | 100 · 0 · 0 · 0 | |
| 2 | Pagar 130 | 370 | 400 | Pago T −30 | 0 | 400 − 30 = 370 ✓ | 0 · 0 · 0 · 30 | AV-10; AV-04 (30) |
| 3 | Hoy = 21 feb (cierre) | 370 | 370 | — | 0 | ✓ | 0 · 0 · 0 · 30 | |
| 4 | Asignar 30 a Super (P2); compra con T de 30 en Super | 370 | 340 | Super 0; Pago T 30 | 0 | 340 + 30 = 370 ✓ | 0 · 0 · 30 · 0 | El saldo a favor se consumió. AV-08 "tienes $30 reservado de más" |
| 5 | Devolver la reserva excedente a LPA (Asig(Pago T, P2) −30) | 370 | 370 | — | 0 | ✓ | 0 · 0 · 0 · 0 | El ciclo se cierra sin pérdida |

#### ESC-14 Cashback, avance de efectivo y transferencia entre tarjetas [Q3]
Hoy: 15 feb. Base (paso 0): ingreso 1,000; asignar 300 a Super; compra con T de 400 en Super.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | T (deuda · S · RE) | U (deuda · S · RE) | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 0 | Base | 1,000 | 700 | Super −100; Pago T 300 | 100 | 700 + 200 + 100 = 1,000 ✓ | 400 · 100 · 0 | — | |
| 1 | Cashback de 30 a T | 1,000 | 700 | Igual | 100 | ✓ | 370 · 70 · 0 | — | Ingreso en reportes; LPA no cambia |
| 2 | Avance de efectivo de 200 de T a Ahorro | 1,200 | 900 | Igual | 100 | 900 + 200 + 100 = 1,200 ✓ | 570 · 270 · 0 | — | Otras entradas |
| 3 | Transferir 100 de deuda de T a U | 1,200 | 900 | Igual (Pago U 0) | 100 | ✓ | 470 · 170 · 0 | 100 · 100 · 0 | AV-24; la S total no cambia (270) |
| 4 | Cashback de 400 a T | 1,200 | 900 | Igual | 100 | ✓ | 70 · 0 · 230 | 100 · 100 · 0 | AV-08 en T por 230 |

### Débito y sobregiros

#### ESC-15 Sobregiro de débito y su efecto al cierre [C1, C2]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Salidas | 500 | 400 | Salidas 100 | 0 | ✓ | |
| 2 | Compra con débito de 150 en Salidas | 350 | 400 | Salidas −50 | 0 | 400 − 50 = 350 ✓ | AV-02 "reducirá LPA en $50 al cierre" |
| 3 | Hoy = 21 feb (cierre) | 350 | 350 | — | 0 | ✓ | SobD(Salidas, P1) = 50 |

#### ESC-16 Cubrir un sobregiro de débito antes del cierre [documento base §15]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad |
|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Salidas y 80 a Super; compra con débito de 150 en Salidas | 350 | 320 | Salidas −50; Super 80 | 0 | 320 + 30 = 350 ✓ |
| 2 | Mover 50 de Super a Salidas | 350 | 320 | Salidas 0; Super 30 | 0 | ✓ |
| 3 | Hoy = 21 feb (cierre) | 350 | 320 | Super 30 | 0 | ✓ (sin reducción) |

#### ESC-17 Sobregiro mixto el mismo día, con una transacción agregada tarde [D2, C1]
Hoy: 12 feb. Las compras son del 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Reparto D2 |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super; débito 60 (registrado a las 10:00); T 70 (12:00) | 440 | 400 | Super −30; Pago T 40 | 30 | 400 + 10 + 30 = 440 ✓ | 70 · 30 · 0 | D60 cubierta; T70: 40 cubiertos, 30 no. SobT 30, SobD 0 |
| 2 | El 12 feb se registra un débito olvidado de 20 con fecha 10 feb | 420 | 400 | Super −50; Pago T 40 | 30 | 400 − 10 + 30 = 420 ✓ | 70 · 30 · 0 | Va después de las existentes: D20 queda sin cubrir. SobT 30, SobD 20 |
| 2′ | (Contraste) Si el débito de 20 se hubiera registrado a las 09:00 | 420 | 400 | Super −50; Pago T 20 | 50 | 400 − 30 + 50 = 420 ✓ | 70 · 50 · 0 | D20 y D60 cubiertas; T70: 20 cubiertos, 50 no |
| 3 | Hoy = 21 feb (cierre; caso del paso 2) | 420 | 380 | Pago T 40 | 0 | 380 + 40 = 420 ✓ | 70 · 30 · 0 | SobD 20 reduce LPA |

#### ESC-18 Cambio de medio de pago [criterio YNAB de 2.3, C1, D2]
Continúa el paso 2 de ESC-17 (hoy 12 feb).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 3 | Cambiar la cuenta de T70 a Ahorro (débito) | 350 | 400 | Super −50 | 0 | 400 − 50 = 350 ✓ | 0 · 0 · 0 |
| 4 | Cambiar la cuenta de D60 a T | 410 | 400 | Super −50; Pago T 60 | 0 | 400 + 10 = 410 ✓ | 60 · 0 · 0 |

En el paso 4 el orden es T60 (cubierta), D70 (40 cubiertos, 30 no) y D20 (no cubierta). SobT = 0 y SobD = 50.

### Split y gastos compartidos

#### ESC-19 Split entre una categoría cubierta y otra no [P10, N3]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super y 20 a Mascota | 500 | 380 | Super 100; Mascota 20 | 0 | ✓ | 0 · 0 · 0 |
| 2 | Compra con T de 150: Super 110, Mascota 40 | 500 | 380 | Super −10; Mascota −20; Pago T 120 | 30 | 380 + 90 + 30 = 500 ✓ | 150 · 30 · 0 |

#### ESC-20 Compartido con débito: en camino, cobro parcial y excedente [D1, N9; fila 2]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | En camino | Identidad | Reportes |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super | 1,000 | 700 | Super 300 | 0 | ✓ | |
| 2 | Compra con débito de 50: 25 Super, 25 por cobrar a Ana | 950 | 675 | Super 275 | 25 | 675 + 275 = 950 ✓ | AV-09 |
| 3 | Ana paga 10 (a Ahorro) | 960 | 685 | Super 275 | 15 | 685 + 275 = 960 ✓ | Restitución 10 |
| 4 | Ana paga 20: restitución 15, excedente 5 | 980 | 705 | Super 275 | 0 | 705 + 275 = 980 ✓ | Restitución 15; ingreso 5 |

#### ESC-21 Compartido con débito: condonación a una categoría sin Disponible [I4]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | En camino | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 200; asignar 50 a Salidas; compra con débito de 60: 30 Salidas, 30 por cobrar a Beto | 140 | 120 | Salidas 20 | 30 | 120 + 20 = 140 ✓ | |
| 2 | Beto paga 10 | 150 | 130 | Salidas 20 | 20 | 130 + 20 = 150 ✓ | |
| 3 | Condonar 20 a Ropa (Disponible 0) | 150 | 150 | Salidas 20; Ropa −20 | 0 | 150 + 0 = 150 ✓ | Consumo de débito en Ropa; AV-02 |
| 4 | Hoy = 21 feb (cierre) | 150 | 130 | Salidas 20 | 0 | 130 + 20 = 150 ✓ | SobD(Ropa) 20 reduce LPA |

#### ESC-22 Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago [O1, D1]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super; compra con T de 80: 40 Super, 40 por cobrar a Ana | 1,000 | 700 | Super 260; Pago T 40 | 0 | 700 + 300 = 1,000 ✓ | 80 · 40 · 0 | La parte de Ana queda sin respaldo |
| 2 | Ana paga 40 a Ahorro | 1,040 | 740 | Igual | 0 | 740 + 300 = 1,040 ✓ | 80 · 40 · 0 | Restitución (no es ingreso). AV-22 preseleccionado |
| 3 | El usuario confirma: asignar 40 a Pago T | 1,040 | 700 | Super 260; Pago T 80 | 0 | ✓ | 80 · 0 · 0 | |

#### ESC-23 Compartido con tarjeta: cobro parcial y condonación [H8, I4]
Hoy: 12 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Salidas; compra con T de 120 (5 feb): 60 Salidas, 60 por cobrar a Beto | 500 | 400 | Salidas 40; Pago T 60 | 0 | ✓ | 120 · 60 · 0 | |
| 2 | Beto paga 20 a Ahorro (8 feb); el usuario no acepta AV-22 | 520 | 420 | Igual | 0 | 420 + 100 = 520 ✓ | 120 · 60 · 0 | |
| 3 | Condonar 40 a Salidas (10 feb) | 520 | 420 | Salidas 0; Pago T 100 | 0 | 420 + 100 = 520 ✓ | 120 · 20 · 0 | La condonación es un consumo con T: cubierta 40, trasladada a Pago T |

#### ESC-24 Split y compartido en la misma compra [P10]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super y 50 a Mascota | 500 | 350 | Super 100; Mascota 50 | 0 | ✓ | 0 · 0 · 0 |
| 2 | Compra con T de 200: 90 Super, 30 Mascota, 80 por cobrar a Ana | 500 | 350 | Super 10; Mascota 20; Pago T 120 | 0 | 350 + 150 = 500 ✓ | 200 · 80 · 0 |

### Devoluciones

#### ESC-25 Devolución total con débito en un período posterior [H7]

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Hoy 10 feb: ingreso 300; asignar 100 a Ropa; compra con débito de 100 en Ropa (5 feb) | 200 | 200 | Ropa 0 | 0 | ✓ | |
| 2 | Hoy 1 mar (A = P2): devolución de 100 vinculada (caso D-2) | 300 | 200 | Ropa 100 | 0 | 200 + 100 = 300 ✓ | Afecta P2; Ropa en P1 sigue en 0 |

#### ESC-26 Devolución parcial con tarjeta en el mismo período, compra parcialmente cubierta [N2, D-1]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 60 a Ropa; compra con T de 100 (5 feb): 60 cubiertos, 40 no | 500 | 440 | Ropa −40; Pago T 60 | 40 | 440 + 20 + 40 = 500 ✓ | 100 · 40 · 0 |
| 2 | Devolución de 30 (8 feb): reduce primero la parte no cubierta | 500 | 440 | Ropa −10; Pago T 60 | 10 | 440 + 50 + 10 = 500 ✓ | 70 · 10 · 0 |
| 3 | Devolución de 20 más | 500 | 440 | Ropa 10; Pago T 50 | 0 | 440 + 60 = 500 ✓ | 50 · 0 · 0 |

#### ESC-27 Devolución con tarjeta en el mismo período que cubre otra compra [Q2a, H3]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super; A = T 100 (3 feb, cubierta); B = T 50 (4 feb, no cubierta) | 500 | 400 | Super −50; Pago T 100 | 50 | 400 + 50 + 50 = 500 ✓ | 150 · 50 · 0 |
| 2 | Devolución total de A (6 feb) | 500 | 400 | Super 50; Pago T 50 | 0 | 400 + 100 = 500 ✓ | 50 · 0 · 0 |

#### ESC-28 Devolución con tarjeta en un período posterior y saldo a favor [Q2b, N2, Q4, AV-06, AV-08]

**Parte A: compra con una parte no cubierta**

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Hoy 10 feb: ingreso 500; asignar 60 a Ropa; compra con T de 100 (5 feb): 60 cubiertos, U_L = 40 | 500 | 440 | Ropa −40; Pago T 60 | 40 | ✓ | 100 · 40 · 0 |
| 2 | Hoy 1 mar (cierre de P1) | 500 | 440 | Pago T 60 | 0 | 440 + 60 = 500 ✓ | 100 · 40 · 0 |
| 3 | Devolución de 70 (D-3): a = mín(70, 40) = 40; r = 30 | 500 | 440 | Ropa 30; Pago T 30 | 0 | 440 + 60 = 500 ✓ | 30 · 0 · 0 |

**Parte B: compra ya pagada; el saldo a favor se consume y se libera como reserva excedente**

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | T (deuda · S · RE · a favor) | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Hoy 16 feb: ingreso 500; asignar 100 a Ropa; compra con T de 100 (5 feb, cubierta); pagar 100 (15 feb) | 400 | 400 | — | 0 | ✓ | 0 · 0 · 0 · 0 | |
| 2 | Hoy 1 mar: devolución de 100 (D-3): U_L = 0, así que a = 0 y r = 100 | 400 | 400 | Ropa 100; Pago T −100 | 0 | 400 + 0 = 400 ✓ | 0 · 0 · 0 · 100 | AV-06 "La devolución de $100 quedó como saldo a favor en tu tarjeta; reducirá Listo para asignar en $100 al cierre" |
| 3 | Hoy 21 mar (cierre de P2) | 400 | 300 | Ropa 100 | 0 | 300 + 100 = 400 ✓ | 0 · 0 · 0 · 100 | E(T, P2) = 100 |
| 4 | Compra con T de 100 en Ropa (25 mar, cubierta) | 400 | 300 | Ropa 0; Pago T 100 | 0 | 300 + 100 = 400 ✓ | 0 · 0 · 100 · 0 | Consume el saldo a favor. AV-08 "tienes $100 reservado de más" |
| 5 | Devolver la reserva excedente a LPA | 400 | 400 | — | 0 | ✓ | 0 · 0 · 0 · 0 | LPA vuelve a su valor; Ropa usó el dinero devuelto |

Si al devolver la tarjeta todavía tuviera deuda de otras compras, se usa la segunda variante de AV-06 (C-4).

#### ESC-29 Devolución sobre una línea por cobrar y excedente repartido [I5, inv. 9]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | En camino | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 100 a Super; compra con débito de 100: 60 Super, 40 por cobrar a Ana | 400 | 360 | Super 40 | 40 | 360 + 40 = 400 ✓ | |
| 2 | Ana paga 15 | 415 | 375 | Super 40 | 25 | ✓ | |
| 3 | Intento: devolución de 50 aplicando 40 al por cobrar | — | — | — | — | — | **Rechazado:** 40 > saldo abierto 25 (inv. 9) |
| 4 | Devolución de 50: 25 al por cobrar y 25 a la línea de Super (D-1) | 465 | 400 | Super 65 | 0 | 400 + 65 = 465 ✓ | |

#### ESC-30 Devolución sin compra original [P10, D-4, D-2]
Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T |
|---|---|---|---|---|---|---|---|
| 1 | Ingreso 200; asignar 50 a Super; compra con T de 50 en Super | 200 | 150 | Super 0; Pago T 50 | 0 | ✓ | 50 · 0 · 0 |
| 2 | Devolución con T de 30 sin compra original, a Super (D-4) | 200 | 150 | Super 30; Pago T 20 | 0 | 150 + 50 = 200 ✓ | 20 · 0 · 0 |
| 3 | Devolución en efectivo de 10 sin compra original, a Gas (D-2) | 210 | 150 | Super 30; Pago T 20; Gas 10 | 0 | 150 + 60 = 210 ✓ | 20 · 0 · 0 |

### Cambios retroactivos

#### ESC-31 Transacción olvidada con débito en un período cerrado, con efecto en cascada [C3, P4]
Hoy: 5 abr (A = P3).

Historial:
- P1: ingreso 1,000; asignar 100 a Salidas y 200 a Super; débitos de 80 en Salidas (3 feb) y 200 en Super.
- P2: asignar 50 a Salidas; débito de 50 en Salidas.
- P3: asignar 60 a Salidas.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 0 | Estado inicial | 670 | 590 | Salidas 80 | 0 | 590 + 80 = 670 ✓ | Salidas: P1 20 → P2 20 → P3 80 |
| 1 | Débito olvidado de 50 en Salidas con fecha 10 feb (P1) | 620 | 560 | Salidas 60 | 0 | 560 + 60 = 620 ✓ | P1 −30 (SobD 30); P2 0; P3 60. AV-01: Δ LPA −30; Δ Salidas(A) −20 |

#### ESC-32 Transacción olvidada con tarjeta en un período cerrado [C3, C1]
Mismo historial que el paso 0 de ESC-31.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | Compra con T de 50 en Salidas con fecha 10 feb (P1) | 670 | 590 | Salidas 60; Pago T 20 | 0 | 590 + 80 = 670 ✓ | 50 · 30 · 0 | P1: 20 cubiertos, 30 no (SobT). AV-01: Δ Salidas(A) −20; Δ Pago T +20; Δ S +30; Δ LPA 0 |

#### ESC-33 Eliminación en un período cerrado que elimina un sobregiro [P4, inv. 26]
Continúa el paso 1 de ESC-31.

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 2 | Eliminar el débito olvidado de 50 | 670 | 590 | Salidas 80 | 0 | ✓ | Vuelve exactamente al paso 0 (determinismo). AV-01: Δ LPA +30; Δ Salidas +20 |

#### ESC-34 Cambio de fecha que mueve la transacción de período [I6, supuesto 5]
Hoy: 25 feb (A = P2).

| # | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|
| 1 | P1: ingreso 500; asignar 50 a Salidas; débito de 80 en Salidas (19 feb). P2: asignar 100 a Salidas | 420 | 320 | Salidas 100 | 0 | 320 + 100 = 420 ✓ | P1 −30 (SobD 30) |
| 2 | Cambiar la fecha del débito a 22 feb (P2) | 420 | 350 | Salidas 70 | 0 | 350 + 70 = 420 ✓ | Se recalculan los dos períodos: P1 50 → P2 70. AV-01: Δ LPA +30; Δ Salidas −30. Clave de orden = instante del cambio |

### Metas

#### ESC-35 Meta mensual: acumular frente a rellenar hasta [P6, supuesto 4]
Gas tiene meta de 200 con "rellenar hasta"; Fondo tiene meta de 200 con "acumular".

| # | Operación | Ef | LPA | Disponibles | Identidad | Metas |
|---|---|---|---|---|---|---|
| 1 | P1: ingreso 1,000; asignar 200 a Gas y 200 a Fondo; débito de 120 en Gas | 880 | 600 | Gas 80; Fondo 200 | 600 + 280 = 880 ✓ | Falta 0 en ambas |
| 2 | Hoy = 21 feb (A = P2), antes de asignar | 880 | 600 | Gas 80; Fondo 200 | ✓ | Gas: pedido = 200 − 80 = 120, falta 120. Fondo: pedido 200, falta 200 |
| 3 | Asignar 120 a Gas y 200 a Fondo | 880 | 280 | Gas 200; Fondo 400 | 280 + 600 = 880 ✓ | Falta 0 en ambas |

#### ESC-36 Meta semanal en períodos de distinta duración [H11]
Meta de 50 por semana, con "acumular".

| Período | Días | Monto del período = redondeo(50 × días / 7) |
|---|---|---|
| P1 | 31 | 221.43 (221.428…) |
| P2 | 28 | 200.00 |
| P4 | 30 | 214.29 (214.285…) |
| Transición de 11 días (ESC-45) | 11 | 78.57 (78.571…) |

Identidad en P1, después de asignar 221.43 desde un LPA de 500: Ef 500 = 278.57 + 221.43 ✓.

#### ESC-37 Meta anual: reparto y renovación con dinero no gastado [N8, F2, O5, B-3]
Meta de 1,200 en Viaje, creada el 25 ene 2027 sin fecha. FO₀ = 25 ene 2028, que cae en el período 21 ene 2028 – 20 feb 2028.

| # | Momento | Base | n | Pedido | Estado | Identidad (ejemplo) |
|---|---|---|---|---|---|---|
| 1 | P1 | 0 | 13 | ⌈1,200 / 13⌉ = 92.31 | En curso | Ef 2,000 = LPA 1,907.69 + Viaje 92.31 ✓ |
| 2 | P2 (sin gastos) | 92.31 | 12 | ⌈1,107.69 / 12⌉ = 92.31 | En curso | |
| 3 | Período de FO₀; al inicio, Base 1,100 | 1,100 | 1 | 100 | En curso → Cumplida al asignar 100 | Ef 5,000 = LPA 3,800 + Viaje 1,200 ✓ |
| 4 | En el mismo período, débito de 600 en Viaje | | | | En curso (Disp 600) | Ef 4,400 = 3,800 + 600 ✓ |
| 5 | Período siguiente (renovada: FO₁ = 25 ene 2029) | 600 | 12 | ⌈600 / 12⌉ = 50 | En curso | Los 600 no gastados cuentan para la nueva meta (F2) |

#### ESC-38 Meta para una fecha: cumplida antes, vencida y extendida [O5, A-4]
Meta de 600 en Laptop para el 15 may 2027 (cae en P4), creada el 25 ene. n(P1) = 4.

| # | Período | Operación | Base | n | Pedido | Disp | Estado |
|---|---|---|---|---|---|---|---|
| 1 | P1 | Asignar 150 | 0 | 4 | 150 | 150 | En curso |
| 2 | P2 | Asignar 150 | 150 | 3 | 150 | 300 | En curso |
| 3a | P3 | Asignar 300 | 300 | 2 | 150 | 600 | Cumplida. En P4 el pedido es 0; después de la FO, Completada |
| 3b | P3 (alternativa) | No asigna | 300 | 2 | 150 | 300 | En curso |
| 4b | P4 | Asignar 100 | 300 | 1 | 300 | 400 | En curso |
| 5b | P5 (hoy > FO) | — | 400 | 1 | 200 | 400 | Vencida. AV-17 |
| 6b | P5 | Extender la FO al 15 jul (P6) | 400 | 2 | 100 | 400 | En curso |

Identidad en el paso 3a, con un ingreso inicial de 1,000 en P1 y sin otros movimientos: Ef 1,000 = LPA 400 + Laptop 600 ✓.

### Fuera del presupuesto

#### ESC-39 Cuota de préstamo con desglose [H6, P3]

| # | Operación | Ef | LPA | Disponibles | Identidad | Préstamo |
|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 350 a "Cuota préstamo" | 1,000 | 650 | Cuota 350 | ✓ | Capital 10,000 |
| 2 | Pagar la cuota de 350: capital 250, interés 90, seguro 10 | 650 | 650 | Cuota 0 | 650 = 650 ✓ | Capital 9,750; costo financiero 100 |

#### ESC-40 Desembolso de préstamo y retiro de inversión [H13]

| # | Operación | Ef | LPA | Identidad | Préstamo / Inversión | Reportes | Patrimonio |
|---|---|---|---|---|---|---|---|
| 0 | Ahorro con saldo 0; inversión con valor 3,000 | 0 | 0 | ✓ | — / 3,000 | | 3,000 |
| 1 | Crear préstamo nuevo y registrar desembolso de 5,000 | 5,000 | 5,000 | ✓ | 5,000 / 3,000 | Otras entradas 5,000 | 3,000 |
| 2 | Retirar 1,000 de la inversión | 6,000 | 6,000 | ✓ | 5,000 / 2,000 | Otras entradas 1,000; ingreso 0 | 3,000 |

#### ESC-41 Aporte a inversión [P3]

| # | Operación | Ef | LPA | Disponibles | Identidad | Inversión |
|---|---|---|---|---|---|---|
| 1 | Ingreso 500; asignar 200 a "Aporte inversión" | 500 | 300 | Aporte 200 | ✓ | 0 |
| 2 | Aportar 200 | 300 | 300 | Aporte 0 | 300 = 300 ✓ | 200 |

### Estructura y ciclo

#### ESC-42 Fusión que afecta sobregiros de períodos cerrados [O4, N4]
Hoy: 5 abr (A = P3). Café tiene meta mensual de 50.

Historial en P1: ingreso 1,000. Café: asignado 50, débito de 80 (−30). Salidas: asignado 100, débito de 40 (60).

| # | Operación | Ef | LPA | Disponibles | Identidad | Notas |
|---|---|---|---|---|---|---|
| 0 | Estado inicial | 880 | 820 | Salidas 60 | 820 + 60 = 880 ✓ | SobD(Café, P1) = 30 |
| 1 | Fusionar Café en Salidas | 880 | 850 | Salidas 30 | 850 + 30 = 880 ✓ | En P1, Salidas queda con asignado 150 y consumos 120 (30), sin sobregiro. AV-13: Δ LPA +30; Δ Salidas(A) −30; se descarta la meta de Café |

#### ESC-43 Eliminación de una tarjeta con asignaciones en un período cerrado [O3, F1]
Hoy: 5 mar (A = P2).

| # | Operación | Ef | LPA | Disponibles | Identidad | Tarjeta U |
|---|---|---|---|---|---|---|
| 1 | U con apertura 25 ene y deuda 200; ingreso de 1,000 en P1; asignado a Pago U: 150 en P1 y 50 en P2 | 1,000 | 800 | Pago U 200 | 800 + 200 = 1,000 ✓ | 200 · 0 · 0 |
| 2 | Eliminar U (solo tiene saldo inicial) | 1,000 | 1,000 | — | ✓ | — |

En el paso 2 se eliminan también las asignaciones de P1, un período cerrado (excepción F1). AV-15.

#### ESC-44 Archivar una categoría y devolución posterior hacia ella [H10, M3, N5, ajuste 1]
Hoy: 5 mar (A = P2).

Historial: ingreso 700 en P1. Gimnasio: asignado 70 en P1 y débito de 30 el 2 feb; 30 asignados en P3 (futuro); una programada activa.

| # | Operación | Ef | LPA | Disponibles | Identidad | Notas |
|---|---|---|---|---|---|---|
| 0 | Estado inicial | 670 | 600 | Gim 40; Gim(fut) 30 | 600 + 70 = 670 ✓ | |
| 1 | Archivar Gimnasio: 40 a LPA; los 30 futuros a LPA; programada desactivada | 670 | 670 | — | ✓ | |
| 2 | Devolución de 25 de la compra del 2 feb (D-2, hacia la categoría archivada) | 695 | 670 | Gim 25 | 670 + 25 = 695 ✓ | AV-14 |
| 3 | Intento: condonar algo a Gimnasio | — | — | — | — | **Rechazado.** Finn propone una categoría activa |
| 4 | Sacar 25 de Gimnasio a LPA | 695 | 695 | — | ✓ | Se resuelve AV-14 |

#### ESC-45 Cambio de ciclo con período de transición [M5, Q5, B-2]
Hoy: 10 nov 2027 (período 21 oct – 20 nov). Ef 1,000, LPA 900, Super(fut) 100 en el período 21 nov – 20 dic. El período 21 dic – 20 ene no tiene asignaciones.

| # | Operación | Resultado | Identidad |
|---|---|---|---|
| 1 | Cambiar el día de inicio a 1 | R = 21 dic. Períodos: 21 nov – 20 dic (sin cambio), **21 dic – 31 dic (transición, 11 días)**, 1 – 31 ene… AV-12 | 900 + 100 = 1,000 ✓ (sin cambios de dinero) |
| 1′ | (Contraste) Si 21 dic – 20 ene también tuviera asignaciones | R = 21 ene; transición del 21 al 31 ene | — |
| 2 | Metas en el período de transición | Semanal de 50: 78.57. Mensual de 200: 200 | — |

### Revisión y conciliación

#### ESC-46 SMS de las 7 pm del día 20 aprobado el día 21 [P5, P18; error 5 del documento base]
El SMS llega el 20 feb a las 19:00 hora local (21 feb 01:00 UTC) y trae fecha 20/02: compra con T de 30 en Super. Estado previo en P1: ingreso 500; asignado 50 a Super.

| # | Operación | Ef | LPA | Disponibles | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|
| 1 | Llega el SMS: movimiento Pendiente | 500 | 450 | Super 50 (A = P1) | ✓ | 0 · 0 · 0 | Sin efecto (inv. 13) |
| 2 | Hoy = 21 feb (A = P2), antes de aprobar | 500 | 450 | Super 50 (arrastre) | 450 + 50 = 500 ✓ | 0 · 0 · 0 | |
| 3 | Aprobar el 21 feb a las 08:00; fecha = 20 feb (P1) | 500 | 450 | Super 20; Pago T 30 | 450 + 50 = 500 ✓ | 30 · 0 · 0 | AV-01. Con la fecha en UTC (21 feb) habría caído en P2, que es el error 5 |

#### ESC-47 Conciliación con diferencia y edición posterior [P12, N6, supuesto 11 modificado]
T en Finn: A 40, B 25 y C 12, todas en Super con 100 asignados, ingreso 100. El estado de cuenta al 15 feb trae A 40, B 25 y D 10, con saldo −75.

| # | Operación | Presupuesto (identidad) | Conciliación |
|---|---|---|---|
| 0 | Estado inicial | Ef 100 = LPA 0 + Super 23 + Pago T 77 ✓ | — |
| 1 | Conciliar y terminar sin resolver C/D | Igual | A y B conciliadas. Diferencia aceptada = −75 − (−77) = +2. AV-21 |
| 2 | Editar C a 10 (no conciliada) | Ef 100 = 0 + 25 + 75 ✓ | Diferencia actual 0; sin cambio posterior |
| 3 | Editar A a 45 (conciliada) | Ef 100 = 0 + 20 + 80 ✓ | AV-16; A pasa a confirmada; cambio posterior registrado; diferencia actual = −75 − (−80) = +5 |

Convención de signo (la misma en el paso 1, OP-47 y AV-21): diferencia = saldo según el estado − saldo de Finn a la fecha del estado. Es positiva cuando el banco muestra un saldo mayor que Finn; en una tarjeta, eso significa menos deuda en el banco.

### Escenarios agregados en la Fase 1

#### ESC-48 Cobro de un por cobrar con débito depositado en la tarjeta [Q7, Q3, N9]

**Con reserva en la categoría de pago.** Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | En camino | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super; compra con T de 100 en Super; compra con débito de 50: 25 Super, 25 por cobrar a Ana | 950 | 675 | Super 175; Pago T 100 | 0 | 25 | 675 + 275 = 950 ✓ | 100 · 0 · 0 | |
| 2 | Ana deposita 30 en T: R = 25, excedente 5 | 950 | 700 | Super 175; Pago T 75 | 0 | 0 | 700 + 250 = 950 ✓ | 70 · 0 · 5 | Pago implícito 25. El excedente solo reduce la deuda: RE 5 (AV-08). Reportes: restitución 25, ingreso 5 |

**Sin reserva en la categoría de pago.** Hoy: 10 feb.

| # | Operación | Ef | LPA | Disponibles | SobTA | En camino | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Ingreso 1,000; asignar 300 a Super; compra con T de 100 en Salidas (sin fondos); compra con débito de 50: 25 Super, 25 por cobrar a Ana | 950 | 675 | Super 275; Salidas −100 | 100 | 25 | 675 + 175 + 100 = 950 ✓ | 100 · 100 · 0 | |
| 2 | Ana deposita 30 en T: R = 25, excedente 5 | 950 | 700 | Super 275; Salidas −100; Pago T −25 | 100 | 0 | 700 + 150 + 100 = 950 ✓ | 70 · 70 · 0 | AV-05 "un cobro de $25 se aplicó a la tarjeta sin reserva; reducirá Listo para asignar al cierre" |
| 3 | Hoy = 21 feb (cierre) | 950 | 675 | Super 275 | 0 | 0 | 675 + 275 = 950 ✓ | 70 · 70 · 0 | Neto: el cobro redujo deuda que no estaba reservada; LPA vuelve a su valor |

#### ESC-49 Tres períodos seguidos con asignaciones futuras [Q1, C1, C3]

| # | Hoy | Operación | Ef | LPA | Disponibles | SobTA | Identidad | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | 10 feb (P1) | Ingreso 1,500; asignar a Super 400 (P1), 300 (P2) y 300 (P3) | 1,500 | 500 | Super 400; Super(fut) 300 + 300 | 0 | 500 + 1,000 = 1,500 ✓ | Los Disponibles proyectados (P2 700, P3 1,000) no entran en la identidad (Q1) |
| 2 | 15 feb | Débito de 450 en Super | 1,050 | 500 | Super −50; fut 600 | 0 | 500 + 550 = 1,050 ✓ | AV-02 (50) |
| 3 | 25 feb (P2) | Cierre de P1 | 1,050 | 450 | Super 300; fut 300 | 0 | 450 + 600 = 1,050 ✓ | |
| 4 | 28 feb | Compra con T de 100 en Super | 1,050 | 450 | Super 200; Pago T 100; fut 300 | 0 | ✓ | T: 100 · 0 · 0 |
| 5 | 25 mar (P3) | Cierre de P2 | 1,050 | 450 | Super 500; Pago T 100 | 0 | 450 + 600 = 1,050 ✓ | |
| 6 | 25 mar | Débito olvidado de 350 en Super con fecha 1 mar (P2) | 700 | 300 | Super 300; Pago T 100 | 0 | 300 + 400 = 700 ✓ | P2: T100 cubierta; D350: 200 cubiertos, 150 no (SobD 150). AV-01: Δ LPA −150; Δ Super(A) −200 |

#### ESC-50 Registro automático atrasado e idempotente [P17, B-12, inv. 15]
Programada: Suscripción de 10 al mes con T, primera fecha 25 ene, registro automático. Asignado 10 por período en Suscripciones (P1, P2 y P3). Ingreso 100. Hoy: 10 mar (A = P2). Ninguna ocurrencia se ha registrado.

| # | Operación | Ef | LPA | Disponibles | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|
| 0 | Estado inicial | 100 | 70 | Susc 20; Susc(fut) 10 | 70 + 30 = 100 ✓ | 0 · 0 · 0 | Pendientes: 25 ene y 25 feb |
| 1 | Registro automático | 100 | 70 | Susc 0; Pago T 20; fut 10 | 70 + 30 = 100 ✓ | 20 · 0 · 0 | Se registran 25 ene (P1) y 25 feb (P2), en ese orden y con su fecha. AV-01 por P1 |
| 2 | Registro automático otra vez | Sin cambios | | | ✓ | | Idempotente |

---

## 9. Casos borde

| # | Situación | Resolución | Referencia |
|---|---|---|---|
| CB-01 | Pago a una tarjeta sin deuda | Se permite. Queda saldo a favor y Pago(t) negativo (E), que reduce LPA al cierre. Las compras posteriores liberan la reserva excedente | OP-23, §4.11, ESC-13 |
| CB-02 | Devoluciones acumuladas que superan una línea o la compra | Se rechazan | inv. 10 y 11, OP-33 |
| CB-03 | Reducir una línea por debajo de lo ya cobrado, condonado o devuelto | Se rechaza | OP-28, supuesto 12 |
| CB-04 | Eliminar una transacción con eventos vinculados | Se rechaza; primero se eliminan los eventos | OP-29, OP-34 |
| CB-05 | Cobro depositado en una tarjeta | Por cobrar con tarjeta: solo reduce la deuda. Por cobrar con débito: restitución con pago implícito | §4.10, ESC-48 |
| CB-06 | Devolución que llega a una cuenta distinta de la original | Se trata según el tipo de la cuenta: D-2 o D-4 | §4.4, supuesto 13 |
| CB-07 | Cuota de préstamo pagada con tarjeta | Se permite. Es un consumo con tarjeta en la categoría de la cuota, con reparto D2 y traslado | supuesto C-1, OP-24 |
| CB-08 | Dos líneas de una misma compra en la misma categoría | Se ordenan por su orden dentro de la transacción | 2.2.11, §4.5 |
| CB-09 | Desasignar por debajo de cero | Se permite. El negativo que no se explica por consumos es de tipo débito y reduce LPA al cierre | supuesto 6, §4.5 |
| CB-10 | LPA negativo al cierre | Se mantiene negativo. Bloquea asignaciones futuras (I1) y el auto-asignar no hace nada | §4.9, inv. 19 |
| CB-11 | Sobregiro retroactivo en una categoría archivada | Se aplica C1 al cierre | N5, §4.6 |
| CB-12 | Cambio de ciclo cuando hay períodos futuros con asignaciones | R = el período siguiente al último con asignaciones; siempre existe | §4.2.9 |
| CB-13 | Día de inicio 29, 30 o 31 | Se recorta al último día del mes | §4.2.1 |
| CB-14 | Dos cuentas con los mismos últimos cuatro dígitos | Se permite solo si son de instituciones distintas; el formato del SMS identifica la institución | OP-01, B-5 |
| CB-15 | SMS de una cuenta archivada o inexistente | El movimiento queda sin cuenta y no se puede aprobar hasta asignarle una | OP-35 paso 4 |
| CB-16 | Dos SMS que corresponden a la misma ocurrencia esperada | El segundo ya no puede emparejarse (inv. 15). Se evalúa como posible duplicado | §4.17 |
| CB-17 | Posible duplicado de una transacción ya aprobada o de un movimiento pendiente | Ambos cuentan como candidatos | §4.17 |
| CB-18 | Conciliación con diferencia | Se termina con la diferencia aceptada y la sugerencia de un ajuste | OP-47, ESC-47 |
| CB-19 | Transacción con fecha anterior a la apertura de la cuenta | Se rechaza; se puede adelantar la fecha de apertura (OP-02) | inv. 12 |
| CB-20 | Fusión hacia una categoría con meta | El destino conserva su meta; la del origen se descarta | OP-12 |
| CB-21 | Dos consumos con la misma fecha y la misma clave de orden | Desempate por el orden de creación de la transacción | supuesto C-2 |
| CB-22 | Condonar más que el saldo abierto | Se rechaza | inv. 9 |
| CB-23 | Cobro de un por cobrar ya cerrado | Se rechaza | B-7 |
| CB-24 | Editar una transacción de una cuenta archivada | Se rechaza si cambia el saldo; se permite cambiar categoría o nota | A-1, §5.0.5 |
| CB-25 | Asignar a una categoría archivada | Se rechaza δ > 0; se permite sacar dinero | inv. 20, OP-11 |
| CB-26 | Pago de tarjeta olvidado con fecha en un período cerrado | Afecta Pago(t) en ese período; un E que aparezca reduce LPA. AV-01 | §4.6, C3 |
| CB-27 | Meta para una fecha creada con fecha objetivo en el pasado | Se rechaza (≥ hoy) | OP-18 |
| CB-28 | Monto cero | Las transacciones, líneas y eventos exigen monto > 0. Un saldo inicial de 0 no crea transacción | OP-01, OP-20 |
| CB-29 | Transferencia de una cuenta a sí misma | Se rechaza | OP-22 |
| CB-30 | Cambiar la cuenta de una transacción conciliada | Pasa a confirmada y se registra un cambio posterior | P12, OP-28 |
| CB-31 | Devolución vinculada a una cuota, abono o aporte | No se admite; solo los gastos admiten devoluciones vinculadas | supuesto C-3 |
| CB-32 | Devolución de una línea cuyo medio de pago cambió después | U_L y el caso (D-1 a D-4) se derivan del estado actual de los hechos | §4.4, inv. 26 |
| CB-33 | Registro automático de una programada cuya cuenta se archivó | Esa ocurrencia queda pendiente con notificación; las demás siguen | OP-43, B-12 |
| CB-34 | Meta en una categoría que se archiva | Se conserva sin evaluarse; vuelve a evaluarse al desarchivar | B-11 |

---

## 10. Trazabilidad

### 10.1 Decisiones → secciones de este documento

| Decisión | Dónde se implementa |
|---|---|
| P1 | §1.4, §4.5, §4.6, OP-14 |
| P2 (sustituida por C1 en tarjeta) | §4.6, §4.7 |
| P3 | §1.2, 2.2.5, 2.2.6, OP-24 a OP-26 |
| P4 | §5.0.3, §5.0.4, inv. 18 y 26 |
| P5 | §1.1, OP-35, ESC-46 |
| P6 | §1.6, §4.12, OP-17 |
| P7 | §1.1, §4.2, §7.3 |
| P8 | §4.11, §4.14, OP-23, ESC-08 y ESC-09 |
| P9 | §1.5, §4.10, §4.14 |
| P10 | §1.3, 2.2.11, OP-20, OP-33 |
| P11 | §7.2, OP-30 |
| P12 | §7.2, OP-28 |
| P13 | §1.2, OP-01, ESC-01 |
| P14 | §0.4, §1.3 |
| P15 | 2.2.9, OP-22 |
| P16 | §4.17, OP-35 |
| P17 | §4.16, OP-42 a OP-44, ESC-50 |
| P18 | §0.4, OP-35 |
| P19 | §7.1, OP-35 |
| P20 | 2.2.17, OP-45 |
| R1 | §3 (regla de cierre), §4.1 |
| R4 | §7.6, §7.7, OP-04, OP-09 |
| R8 | 2.2.4, inv. 13, 14 y 22 |
| R10 | Fuera de alcance (Fase 8) |
| C1, C2 | §4.6, §4.7, ESC-05 y ESC-15 |
| C3 | §5.0.3, AV-01, ESC-31 y ESC-32 |
| I1 | inv. 19, OP-14, ESC-03 |
| I2 | inv. 23 |
| I3 | AV-10, OP-23 |
| I4 | OP-32, ESC-21 |
| I5 | inv. 9 a 11, OP-33, ESC-29 |
| I6 | OP-28, ESC-34 |
| M1 | §1.2, OP-01, ESC-02 |
| M2 | §4.17, §7.1, OP-37 |
| M3 | OP-09 |
| M4 | §1.3 |
| M5 | §4.2, OP-19, ESC-45 |
| D1 | §4.9, §4.10, ESC-20 |
| D2 | §4.5, ESC-17 |
| PS | §4.8, AV-07 |
| S7 | §4.9 |
| H1 | AV-02, AV-03 |
| H2 | §4.9 |
| H3 | §4.5, ESC-06 |
| H4 | AV-11, OP-14 |
| H5 | §4.7, ESC-10 |
| H6 | 2.2.9, OP-24, ESC-39 |
| H7 | §4.4, ESC-25 |
| H8 | §4.10, OP-32, ESC-23 |
| H9 | §7.6, §7.7, OP-06, OP-12, OP-13 |
| H10 | OP-09, ESC-44 |
| H11 | §4.12, ESC-36 |
| H12 | §4.17 |
| H13 | §4.13, ESC-40 |
| N1 | inv. 1, §4.15, todos los escenarios |
| N2 | §4.4 (D-3), §4.5, ESC-26 y ESC-28 |
| N3 | §1.3, 2.2.11, 2.2.12, DM-3 |
| N4 | OP-12, ESC-42 |
| N5 | §7.6, AV-14, ESC-44 |
| N6 | §7.2, OP-29 |
| N7 | OP-06 |
| N8 | §4.12, ESC-37 |
| N9 | §4.10, §4.13 |
| O1 | §4.9, §4.10, AV-22, ESC-22 |
| O2 | inv. 2, §4.8, ESC-10 |
| O3 | OP-06, ESC-43 |
| O4 | OP-12, inv. 18 |
| O5 | §4.12, AV-17, ESC-38 |
| Criterio YNAB de 2.3 | OP-28, ESC-18 |
| F1 | OP-06, inv. 18, ESC-43 |
| F2 | §4.12, ESC-37 |
| F3 | inv. 23, OP-12 |
| F4 | §4.8, ESC-11 |
| Q1 | inv. 1, §4.6, ESC-49 |
| Q2 | §4.4, §4.5, ESC-27 y ESC-28 |
| Q3 | §4.10, §4.11, OP-27, ESC-14 |
| Q4 | §4.8, AV-08, ESC-13 |
| Q5 | §4.2, ESC-45 |
| Q6 | 2.2.23, Anexo A |
| Q7 | §4.10, AV-05, ESC-48 |

### 10.2 Registro de resoluciones de la Fase 1

| ID | Resolución | Estado |
|---|---|---|
| F1–F4 | Según el encargo de la Fase 1 | Aprobadas |
| Q1–Q7 | Según las respuestas del usuario | Aprobadas |
| Supuestos 1–19 | 11 y 14 modificados por el usuario | Aprobados |
| A-1 a A-6 | Parte A | Aprobados |
| Ajustes 1 y 2 | Devoluciones y condonaciones con categorías archivadas; "Aprobar todos" | Aprobados |
| B-1 | AV-06 con un texto que explica la causa | Aprobado |
| B-2 | Interpretación de M5 (§4.2.9) | Aprobado |
| B-3 | La renovación anual surte efecto desde el período siguiente | Aprobado |
| B-4 | LPA histórico sin adelantos | Aprobado |
| B-5 a B-11 | Unicidad de institución y últimos cuatro dígitos; promedio de 3 períodos; cobro con saldo abierto > 0; no cambiar la cuenta si hay devoluciones; el monto del SMS sustituye al de la registrada; reglas hacia archivadas se ignoran; meta archivada se conserva | Aprobados |
| B-12 | Registro automático atrasado e idempotente (OP-43) | Corrección del usuario |
| C-1 | Una cuota o un abono se pueden pagar con tarjeta (consumo con tarjeta) | Aprobado |
| C-2 | Desempate de la clave de orden por el orden de creación | Aprobado |
| C-3 | Solo los gastos admiten devoluciones vinculadas | Aprobado |
| C-4 | Segunda variante de AV-06 cuando la tarjeta todavía tiene deuda, con la redacción del usuario | Aprobado |
| Corrección ESC-47 | Signo de la diferencia actual en el paso 3 (+5) y convención de signo explícita | Aplicada |

### 10.3 Discrepancias con el documento de producto

En todos los casos manda 00-decisiones.md (o la resolución citada).

| Sección del documento de producto | Qué dice | Qué rige |
|---|---|---|
| §8, Ingreso | "salario, reembolsos" | Los cobros de un por cobrar no son ingreso; "reembolso" se refiere a terceros sin por cobrar (D1) |
| §8, Transferencia | Los pagos de tarjeta, entre cuentas del presupuesto, "no afectan ninguna categoría" | El pago de tarjeta reduce el Disponible de su categoría de pago (P8) |
| §8, Origen | SMS, manual o importada | Se agrega "programada" (registro automático) |
| §7, Listo para asignar | Negativo porque "asigné más de lo que tengo; Finn me avisa antes" | También puede quedar negativo por sobregiros de débito o pagos excedentes al cierre, con aviso previo de estado (AV-02, AV-04) y no antes de confirmar |
| §15, Devoluciones | "Le devuelve el dinero a esa categoría" | Con tarjeta en un período posterior, la parte que no estaba cubierta solo reduce la deuda (N2, Q2b) |
| §9, "Aprobar todos" | Aprueba todos los pendientes | Solo los elegibles; el resto queda con su motivo (ajuste 2) |
| §3, paso 6 | "Pocos minutos" | 10 minutos exactos (H12) |

---

## Anexo A. Modelos de cálculo de préstamos e inversiones

### A.1 Contrato del modelo [Q6]

- **Entradas:**
  - del préstamo: monto original M, fecha de apertura F₀, tasa nominal anual i, seguro del primer mes S₁, cuota pactada Q, plazo n;
  - las cuotas y abonos reales registrados (fecha, capital, interés, seguro, número de cuota si se indicó).
- **Salidas:**
  1. Proyección por cuota: número, fecha, interés, seguro, capital y saldo.
  2. Desglose propuesto para un pago real (supuesto 16).
  3. Emparejamiento de un pago real con su cuota.
  4. Estado de cada cuota: pagada, parcial, pendiente o atrasada.
  5. Comparación entre lo proyectado y lo pagado.
- **Límites:**
  - El modelo nunca cambia hechos ni números del presupuesto.
  - El capital pendiente siempre es el de §4.3 (el capital registrado), no el que proyecta el modelo.

### A.2 Modelo "Banco Agrícola" (de Finn 1.0) — ⚠ para validar contra un estado de cuenta real

**Reglas**

1. **Cuota fija mensual Q.** Fecha de la cuota k: F_k = F₀ + k meses, con el mismo día de F₀ recortado al último día del mes. *(Validar el recorte.)*
2. **Interés:** I_k = redondeo(B_{k−1} × i / 365 × d_k), con d_k = F_k − F_{k−1} en días reales y B₀ = M. *(Validar la base de 365 días en años bisiestos y el tipo de redondeo; se asume mitad hacia arriba al centavo.)*
3. **Seguro:** Seg_k = redondeo(B_{k−1} × S₁ / M), proporcional al saldo. *(Validar si se aplica sobre el saldo antes de la cuota.)*
4. **Capital:** C_k = mín(Q − I_k − Seg_k, B_{k−1}). B_k = B_{k−1} − C_k. La última cuota puede ser menor que Q.
5. **Abono a capital:** reduce B desde la cuota siguiente. Q se mantiene y el plazo se acorta. *(Validar si el interés de la cuota siguiente se calcula sobre el saldo reducido durante todo el intervalo o en proporción a los días antes y después del abono.)*
6. **Cuota pagada:** cuando la suma de los pagos emparejados con ella es ≥ 0.99 × Q.
7. **Emparejamiento de un pago real:** por número de cuota si se indicó. Si no, con la cuota no pagada cuya fecha esté a ±10 días o menos; si hay varias, la más cercana.
8. **Desglose propuesto para un pago real:** I_k, Seg_k y C_k recalculados con el saldo real B = capital pendiente registrado y las fechas programadas F_k. *(Validar si el banco usa los días reales entre pagos efectivos.)*
9. **No modelado:** intereses moratorios y comisiones por atraso. *(Validar.)*

**Ejemplo numérico** (para validación): M = 10,000; i = 12%; S₁ = 5.00; Q = 350; F₀ = 15 ene 2027.

| k | Fecha | Días | Saldo inicial | Interés | Seguro | Capital | Saldo final |
|---|---|---|---|---|---|---|---|
| 1 | 15 feb 2027 | 31 | 10,000.00 | 101.92 | 5.00 | 243.08 | 9,756.92 |
| 2 | 15 mar 2027 | 28 | 9,756.92 | 89.82 | 4.88 | 255.30 | 9,501.62 |
| — | 20 mar 2027 | — | Abono a capital de 500 | — | — | 500.00 | 9,001.62 |
| 3 | 15 abr 2027 | 31 | 9,001.62 | 91.74 | 4.50 | 253.76 | 8,747.86 |

Cálculo del interés de la cuota 1: 10,000 × 0.12 / 365 × 31 = 101.9178 → 101.92.

### A.3 Modelo de inversión

Solo está definido el contrato:
- **Entradas:** aportes, retiros y ajustes de valor.
- **Salidas:** valor y proyección.

No hay un modelo de rendimiento aprobado. Mientras no exista, Finn muestra solo el valor (§4.3) sin proyección. *(Pendiente para una fase posterior: R10 y documento base §16.)*


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Este documento no se modifica; cada línea indica qué cambia y dónde está el detalle.

- **PR-3** (Fase 4, aprobada en la revisión final). **ESC-50, paso 1:** el registro automático registra solo la ocurrencia del 25 feb (P2); la del 25 ene (P1, cerrado) queda pendiente con AV-23. Se agrega el paso **1b**: registro de un toque (OP-43) del 25 ene con AV-01, que llega al estado final del paso 1 original. Detalle en `04-backend.md` §0.9 y `04-backend.md` §19.4.
- **PF-2** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`, P5-2; término confirmado en PB-1). **5.0.7, AV-02 y AV-03 (columna "Clase"):** AV-02 pasa a "Estado; color e indicador de débito" y AV-03 a "Estado; color e indicador de tarjeta": el tipo de sobregiro se distingue con color y un indicador no cromático con nombre accesible ("sobregiro con débito o efectivo", "deuda sin reservar"), y los montos siguen apareciendo al tocar. Detalle en `05-frontend.md` §0.8 y §10.3.
- **CF-01** (Fase 6, aprobada en el Paso 1 de `06-features.md`, P6-5). **§1.8 y §5.8:** nueva operación **OP-53 Verificar saldo**, una conciliación sin estado de cuenta: el usuario escribe la fecha y el saldo que muestra su banco, Finn registra la diferencia aceptada (saldo según el banco − saldo de Finn a esa fecha) y marca como conciliadas las transacciones elegidas con fecha ≤ esa fecha. Nunca crea transacciones (inv. 14); el registro de conciliación distingue su modo (estado de cuenta o saldo). **Supuesto 11 (precisión):** la transacción de ajuste que sugiere AV-21 depende de la cuenta y del signo de la diferencia d: en efectivo, ingreso (OP-21) si d > 0 o gasto (OP-20) si d < 0; en una tarjeta, entrada a la tarjeta (OP-27b) si d > 0 o gasto con la tarjeta (OP-20) si d < 0. Detalle en `06-features.md` §3.2 y `04-backend.md` OP-53.
- **CF-17** (Fase 6, P6-18 y P6-22). **OP-16, "El promedio de gasto" (precisión):** el promedio de Gastado(c, q) en los últimos 3 períodos cerrados en que existía c; si existía en menos, en los que haya; si en ninguno, la variante no se ofrece. Una categoría c **existía** en q si Asig(c, q) ≠ 0 o tuvo, con fecha en q, un consumo, una entrada o un evento sobre una de sus líneas. Detalle en `06-features.md` §3.14.
- **CF-20** (Fase 6, P6-20). **§4.16 y OP-42 (precisión):** al reactivar una programada se registra la fecha de reactivación; desde entonces, las ocurrencias pendientes son las de fecha ≥ la primera fecha y ≥ la de reactivación. Las del tiempo en que estuvo desactivada no se generan, no se registran solas ni se emparejan. Detalle en `06-features.md` §0.12 y `04-backend.md` OP-42.
- **CF-03** (Fase 6) queda **diferido**: OP-54 "Unir deudores" está diseñada en `06-features.md` §3.4 y no se aplica; §1.5 y OP-28 no cambian.
- **CF-25** (Fase 6, aprobado en la revisión de la Parte E de `06-features.md`). **OP-16, variante nueva "Cubrir el sobregiro" (precisión):** Asig(c, p) = Asig(c, p) + máx(0, −Disp(c, p)); se ofrece solo si Disp(c, p) < 0 y se aplica con las reglas de OP-14, incluido AV-11. Detalle en `06-features.md` §5.8 y `04-backend.md` §6.14.4.