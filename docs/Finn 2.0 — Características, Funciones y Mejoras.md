# **Características y Funciones de Finn 2.0**

## **1\. ¿Qué es Finn?**

Finn es una aplicación de finanzas personales construida para mí, basada en el método de presupuesto base cero (o "por sobres"): cada dólar real que tengo recibe un trabajo. Lo asigno a una categoría y, a partir de ahí, la aplicación me muestra en todo momento cuánto me queda, en qué lo gasté y cuánto dinero sigue sin asignar.
Su versión 1.0, aunque efectiva, tiene mucho espacio de mejora. Este documento busca plasmar qué es Finn, qué tiene y qué hace, y cuáles son las mejoras que debe incluir su versión 2.0. Las reglas exactas de cada función están en el registro de decisiones (00-decisiones.md); aquí describo el producto en palabras simples.

## **2\. ¿Por qué existe?**

El propósito de Finn es ayudarme a visualizar mis gastos, organizar mis finanzas y darme un panorama visual del progreso de mis compras y pagos período tras período. Existen aplicaciones que hacen algo similar (como YNAB), pero ninguna resolvía tres necesidades concretas:

> * **Bancos salvadoreños:** ninguna aplicación ofrece conexión con bancos de El Salvador (BAC, Banco Agrícola, Cuscatlán), por lo que automatizar el registro de compras era imposible.
> * **Ciclos personalizados:** mi presupuesto no funciona por mes calendario. Funciona por períodos alineados a la fecha de corte de mi tarjeta (por ejemplo, del 21 de un mes al 20 del siguiente).
> * **Uso intensivo de tarjeta de crédito:** hago la mayoría de mis compras con tarjeta para aprovechar beneficios (millas, cashback). Necesito que el presupuesto entienda que gastar con tarjeta no es lo mismo que gastar efectivo, y que me muestre con claridad cuánto debo y cuánto me falta reservar para pagarlo.

Desarrollar mi propia alternativa terminó siendo la respuesta. La lógica de presupuesto de Finn sigue la de YNAB, adaptada a mis períodos.

## **3\. La automatización: SMS \+ MacroDroid**

El primer aspecto técnico de la aplicación resolvió el problema principal. **MacroDroid** es una aplicación de Android que permite enviar webhooks a partir de triggers. Lee mis SMS y, cuando detecta un mensaje de una de mis tarjetas o cuentas, envía la información a Finn para su posterior revisión.
Ya no necesito ingresar manualmente cada transacción: llega sola a la aplicación y lo único que tengo que hacer es confirmar a qué categoría pertenece.
Al recibir un SMS, Finn hace lo siguiente:

> 1. Verifica que el mensaje venga de mi teléfono, mediante un token secreto.
> 2. Guarda el SMS original como registro, aunque luego falle el procesamiento.
> 3. Interpreta el mensaje según el formato de cada banco (BAC, Banco Agrícola y Cuscatlán): últimos cuatro dígitos de la tarjeta, monto, comercio y fecha de la compra. Si el mensaje no coincide con ningún formato, lo deja en la bandeja como "no reconocido" y me avisa.
> 4. Identifica a qué cuenta pertenece usando los últimos cuatro dígitos.
> 5. Busca si la compra corresponde a una transacción programada que estaba esperando (por ejemplo, una suscripción mensual), incluso si esa transacción ya se registró sola. Si coincide, la empareja y no crea otra.
> 6. Revisa si es un duplicado: si llega exactamente el mismo mensaje dos veces en pocos minutos (un reenvío de MacroDroid), descarta el segundo y lo deja registrado. Si solo se parece a otra compra (mismo monto y cuenta, texto distinto), la marca como "posible duplicado" y decido yo.
> 7. Aplica mis reglas de comercio para sugerir una categoría automáticamente (por ejemplo, "Super Selectos" → Supermercado).
> 8. Deja el movimiento en una bandeja de pendientes y me notifica.

Un SMS no afecta mis saldos ni mi presupuesto hasta que yo lo apruebo. Así nada entra a mis números sin mi revisión. La única excepción son las transacciones programadas que marqué como de aprobación automática.

Otros bancos o formatos se podrán agregar en el futuro. Las cuentas que no generan SMS (financieras o aplicaciones) funcionan con registro manual.

## **4\. Estructura general**

Finn como aplicación es simple y directa. Se instala en el teléfono como una aplicación (PWA), funciona también en escritorio, tiene modo claro y oscuro y está en español. Sus secciones son:

> * **Inicio:** el resumen diario.
> * **Presupuesto:** asignar mi dinero a categorías.
> * **Cuentas:** dónde está mi dinero y cuánto debo.
> * **Actividad:** el historial de todas mis transacciones.
> * **SMS:** la bandeja de compras por revisar.
> * **Reportes:** estadísticas y tendencias.

Todo gira en torno a tres piezas: las **cuentas** (dónde vive el dinero), las **transacciones** (cada movimiento de dinero) y el **presupuesto** (qué trabajo tiene cada dólar), organizadas por **períodos**.

Aunque el modelo por dentro es preciso, la experiencia diaria debe ser tan simple como en la 1.0: cada número se muestra de la forma más simple posible, y el detalle aparece cuando lo toco.

## **5\. Inicio**

Es lo primero que veo cada día y responde tres preguntas de inmediato:

> * **¿Cuánto tengo para asignar?** El monto "Listo para asignar", junto con los días que quedan del período y una barra de avance. Si hay dinero que presté y aún no me devuelven, también veo cuánto está "en camino".
> * **¿Algo necesita mi atención?** Las compras por SMS sin revisar (incluidos los mensajes no reconocidos y los posibles duplicados), las categorías sobregiradas, lo que me falta reservar para mis tarjetas, los pagos próximos y cualquier cambio en un período pasado que afecte el actual.
> * **¿Qué gasté recientemente?** Los últimos movimientos y mi patrimonio neto (lo que tengo, incluido lo que me deben, frente a lo que debo).

## **6\. Cuentas**

Aquí agrego lo que sería el bloque grande: la cuenta, a la que toda transacción y todo dinero pertenece. Hay diferentes tipos:

> * **Cuenta de ahorro / débito:** es un lugar donde mi dinero está guardado. Puede ser una cuenta en un banco, una financiera o una aplicación. Puede tener una tarjeta de débito relacionada (es opcional, no obligatoria); si la tiene, la cuenta se representa por esa tarjeta y sus últimos cuatro dígitos permiten reconocer sus SMS. Este es el dinero real con el que cuenta mi presupuesto.
> * **Tarjeta de crédito:** representa mi tarjeta e incluye todos sus datos relacionados: límite de crédito, tasa de interés, fecha de corte, fecha de pago, red (Visa o Mastercard) y color. Muestra cuánto debo y qué porcentaje del límite estoy usando. Cada tarjeta crea automáticamente su categoría de pago dentro del presupuesto.
> * **Préstamo:** es un tipo de cuenta complicado que hace el seguimiento de mis préstamos, ya sean con personas particulares o con bancos. Suelen complicarse porque cada banco y cada tipo de préstamo funcionan diferente. Su saldo no forma parte de mi presupuesto: no es dinero para asignar.
  * Muestra el monto original, el saldo pendiente y la cuota del período (mensual, semanal u otra frecuencia).
  * Registra la fecha de apertura y los días de pago.
  * Si aplica, guarda la tasa nominal, el seguro, el tipo de tasa (fija o variable) y la comisión.
  * Despliega una tabla de amortización con cada período de pago: interés, seguro, capital y saldo.
  * Permite registrar pagos de cuota en fecha o abonos a capital. La tabla se actualiza según esas actividades y compara lo proyectado con lo realmente pagado.
  * La cuota la pago desde una cuenta de ahorro y, para mi presupuesto, sale de una categoría que yo asigno (por ejemplo, "Cuota préstamo"). En la cuenta del préstamo, ese pago se desglosa en capital, interés y seguro, y solo el capital reduce lo que debo.

> Esta tabla es sensible y compleja porque cada institución usa un modelo distinto. Por ejemplo, algunas calculan el interés por día y no de pago a pago. Por eso Finn maneja los cálculos como "modelos" intercambiables por institución; el primero es el de Banco Agrícola.

> * **Inversión:** funciona como un préstamo, pero a la inversa. Registra el monto invertido, los aportes, la tasa de interés o rendimiento y la proyección de cuánto crecerá en el tiempo. Tampoco forma parte del presupuesto: cada aporte sale de una categoría que asigno, y lo que retiro vuelve a mi dinero para asignar.

### **Crear una cuenta**

Al crear una cuenta indico su saldo actual, y Finn lo registra como su saldo inicial:

> * En una cuenta de ahorro, ese dinero queda listo para asignar.
> * En una tarjeta, la deuda que ya traía queda como deuda que me falta reservar, y la cubro asignando dinero a su categoría de pago.
> * En un préstamo que ya está en curso, indico el saldo actual y las cuotas que ya pagué, para que la tabla de amortización arranque en el punto correcto.

Por defecto, la cuenta se abre el día en que la creo, pero puedo elegir una fecha anterior.

### **Funciones comunes**

Todos estos tipos de cuenta comparten las mismas funciones:

> * Ver la actividad de cada cuenta, filtrada por período, tipo de movimiento o estado.
> * Hacer transferencias entre cuentas.
> * Realizar pagos de tarjeta o de préstamo, eligiendo desde qué cuenta de ahorro sale el pago.
> * **Conciliar** la cuenta contra el estado de cuenta del banco (ver sección 11).
> * Editar y reordenar la cuenta.
> * **Archivar** una cuenta que ya no uso, siempre que su saldo esté en cero (una tarjeta con deuda no se puede archivar). Archivar no borra nada: su historial se conserva.
> * **Eliminar** una cuenta solo si no tiene movimientos aparte de su saldo inicial. Si es una tarjeta, se elimina con su categoría de pago. Finn me muestra el impacto antes de confirmar.

La vista general de cuentas muestra mi **posición neta**: el total de lo que tengo (incluido lo que me deben) frente al total de lo que debo.

## **7\. Presupuesto**

Es el corazón de Finn. Aquí decido qué trabajo tiene cada dólar.

### **Listo para asignar**

Es el número más importante de la aplicación: el dinero real que tengo y que todavía no está destinado a ninguna categoría. Puede ser positivo (me queda dinero por asignar), cero (todo tiene un trabajo) o negativo (asigné más de lo que tengo; Finn me avisa antes de hacerlo).

La deuda de mis tarjetas no lo reduce: esa deuda se maneja en la categoría de pago de cada tarjeta. Lo que sí lo reduce, además de mis asignaciones, es el dinero real que ya salió de mis cuentas sin estar presupuestado (un sobregiro con débito o efectivo, que se descuenta al cerrar el período) y el dinero que pagué por otros y aún no me devuelven. Este último aparece como dinero "en camino", para que entienda por qué el número está más bajo.

El dinero que llega desde fuera del presupuesto (por ejemplo, el desembolso de un préstamo o un retiro de inversión) también entra a "Listo para asignar".

Tiene su propia pantalla de detalle, que explica cómo se compone el número y cómo ha cambiado período a período.

### **Categorías y grupos**

Las categorías (Supermercado, Gasolina, Salidas, etc.) se organizan en grupos (Vida diaria, Vivienda, Suscripciones…). En cada período, cada categoría tiene:

> * **Asignado:** lo que decidí poner en ella este período.
> * **Gastado:** lo que ya salió de ella.
> * **Arrastrado:** lo que sobró del período anterior.
> * **Disponible:** lo que me queda. Si es negativo, la categoría está sobregirada.

Puedo filtrar las categorías (todas, sin fondos suficientes, sobregiradas o cubiertas), entrar al detalle de cada una, asignar dinero rápidamente y ver un calendario de los días en que gasté en ella. Los grupos y categorías se crean, renombran y reordenan desde una pantalla de administración.

### **Sobregiros**

Cuando gasto más de lo que tiene una categoría, Finn la marca con un color según cómo pagué:

> * **Con débito o efectivo:** ese dinero ya salió de mi cuenta. Finn me muestra cuánto reducirá mi "Listo para asignar" al cerrar el período, para que no sea una sorpresa. Si lo cubro antes con dinero de otra categoría o asignando más, no pasa nada.
> * **Con tarjeta:** es deuda que todavía no tengo reservada. No reduce mi "Listo para asignar"; queda como lo que me falta reservar para esa tarjeta. Si asigno dinero a la categoría antes del cierre, ese dinero cubre la compra y pasa a la categoría de pago de la tarjeta.

A la vista solo veo el color; los montos y el desglose aparecen al tocar la categoría. Si una categoría se sobregira con los dos medios en el mismo período, cada parte recibe su tratamiento.

### **Archivar, fusionar y eliminar categorías**

> * **Archivar:** una categoría que ya no uso sale de la vista diaria, pero se conserva con su nombre en el historial y en los reportes. Para archivarla, primero saco su dinero (a otra categoría o a "Listo para asignar"), quito sus asignaciones futuras y reasigno o desactivo sus transacciones programadas; Finn me ayuda con todo en el mismo paso. Si un cambio en el pasado le deja dinero, Finn me avisa para sacarlo.
> * **Fusionar:** si dos categorías en realidad son una, puedo fusionarlas. Todo el historial de una (transacciones, asignaciones, transacciones programadas y reglas de comercio) pasa a la otra, como si siempre hubieran sido una sola. Finn me muestra el impacto antes de confirmar.
> * **Eliminar:** solo es posible en una categoría que nunca se usó.

### **Metas**

Cada categoría puede tener una meta. Las metas me dicen cuánto me falta asignar, pero nunca asignan dinero por sí solas: la asignación la hago yo, o un "auto-asignar" que yo activo. Lo que sobra en una categoría siempre se queda en ella al cerrar el período; si quiero liberarlo, lo desasigno a mano.

Hay dos familias de metas:

> * **Metas por período (semanal o mensual):** un monto que necesito cada período. Puedo elegir cómo trata lo que sobró:
>   * **Acumular:** lo que sobra se guarda y la meta vuelve a pedir el monto completo, ideal para ir juntando de más.
>   * **Rellenar hasta:** solo necesito asignar la diferencia para volver a tener el monto de la meta.
> * **Metas de ahorro (anual o un monto total para una fecha):** Finn reparte lo que falta entre los períodos que quedan, ideal para ahorrar para un viaje. Una meta anual se renueva cada año. Si una meta con fecha llega a su fecha sin cumplirse, queda como "vencida" y Finn me sugiere extender la fecha o ajustar el monto.

### **Tarjetas de crédito dentro del presupuesto**

Cuando compro con tarjeta, el dinero no sale de mi cuenta ese día, pero ya está comprometido. Finn lo maneja así:

> * Si compro con tarjeta en una categoría con fondos, el gasto sale del sobre y ese dinero queda reservado en la categoría de pago de la tarjeta.
> * Si la categoría no alcanza, solo la parte cubierta queda reservada; el resto es deuda que me falta reservar.
> * Al pagar la tarjeta, sale efectivo y baja la deuda. Mi presupuesto no se ve afectado dos veces.
> * Puedo hacer pagos parciales. El pago se aplica primero a la deuda más antigua.
> * Si pago más de lo que tenía reservado, Finn me avisa antes. Esa diferencia es dinero real que salió de mi cuenta sin estar presupuestado y se trata como un sobregiro con débito.
> * La deuda de períodos anteriores o la que ya traía la tarjeta se cubre asignando dinero directamente a su categoría de pago.
> * Los intereses y comisiones de la tarjeta se registran como un gasto en una categoría (por ejemplo, "Intereses y comisiones").

Por defecto, la categoría de pago de cada tarjeta me muestra un solo número: **"te falta reservar $X para tu tarjeta"**. Si pagué de más, en cambio me dice cuánto pagué de más y que eso reducirá "Listo para asignar" al cierre. Al tocarla veo el detalle: cuánto está reservado y cuánto me falta. Al pagar, Finn me muestra un desglose: cargos del período, deuda anterior y lo ya pagado.

### **Períodos**

El presupuesto funciona por períodos con fechas personalizadas (por ejemplo, del 21 al 20), que Finn genera a partir del día de inicio de mi ciclo. No hay huecos entre períodos ni fechas que tenga que crear a mano.

> * Solo hay un período activo a la vez. El siguiente se activa solo cuando llega su fecha de inicio, sin ningún botón que pueda fallar.
> * Puedo ver y asignar períodos futuros para planear con anticipación, pero solo con dinero que ya tengo: asignar en el futuro es adelantar dinero real.
> * En un período pasado no puedo cambiar lo asignado, pero sí puedo agregar o corregir transacciones con su fecha real. El historial siempre es fiel a lo que pasó, y Finn recalcula todo lo que viene después. Si eso afecta el período activo, me avisa para que decida cómo cubrirlo.
> * Al terminar un período, lo que sobró en cada categoría se queda en ella; un sobregiro con débito o efectivo reduce "Listo para asignar", y un sobregiro con tarjeta queda como deuda que me falta reservar.
> * Si cambio el día de inicio del ciclo, el cambio aplica desde el primer período futuro que no tenga asignaciones, y Finn me dice desde qué fecha antes de confirmar.

## **8\. Actividad (transacciones)**

Es el historial completo de todos mis movimientos, de todas las cuentas, agrupado por fecha. Hay tres tipos de transacción:

> * **Gasto:** dinero que sale. Puede ir a una sola categoría o repartirse en varias partes: cada parte va a una categoría o a un monto por cobrar, y entre todas suman el total.
> * **Ingreso:** dinero que entra (salario, reembolsos) y aumenta lo que tengo para asignar.
> * **Transferencia:** dinero que se mueve entre mis propias cuentas, incluyendo los pagos de tarjeta y de préstamo. Entre cuentas de mi presupuesto no afecta ninguna categoría; hacia un préstamo o una inversión, sale de la categoría que yo asigno.

Desde aquí puedo:

> * Registrar manualmente gastos que no generan SMS: efectivo, comercios pequeños o compras en el extranjero.
> * Registrar ingresos y transferencias.
> * Ver el detalle de cada transacción y editarla por completo: monto, fecha, cuenta, comercio, categorías y nota.
> * Marcarla como confirmada por el banco o eliminarla.
> * Registrar una transacción olvidada con su fecha real, aunque pertenezca a un período pasado.

La fecha que manda siempre es la de la compra (la que trae el SMS o el estado de cuenta), en hora de El Salvador. Esa fecha decide a qué período pertenece.

Todo se maneja en dólares. Una compra en el extranjero se registra por el monto que cobra el banco, y opcionalmente puedo anotar el monto y la moneda original como referencia.

Cada transacción indica su origen (SMS, manual o importada) y su estado ante el banco: pendiente (el banco aún no la confirma), confirmada o conciliada. Ese estado no cambia mi presupuesto; me permite ver mi saldo confirmado frente a mi saldo total. Es distinto de la revisión en la bandeja de SMS: lo que está en la bandeja todavía no es una transacción.

Antes de editar o eliminar una transacción conciliada, Finn me advierte. Si cambio el monto, la fecha o la cuenta, o si la elimino, deja de estar conciliada y la conciliación registra ese cambio. Cambiar la categoría o la nota no afecta la conciliación.

## **9\. SMS (bandeja de revisión)**

Es donde llegan los movimientos detectados por MacroDroid. Cada pendiente muestra:

> * El comercio y el monto.
> * La cuenta a la que pertenece.
> * El SMS original.
> * La categoría sugerida.

En la bandeja también aparecen:

> * **SMS no reconocidos:** mensajes de mi banco que Finn no pudo interpretar. Veo el texto original y puedo crear la transacción a mano o descartarlo.
> * **Posibles duplicados:** compras que se parecen a otra ya registrada. Decido yo si es un duplicado o una compra legítima; Finn nunca las descarta solo.

Con cada pendiente puedo:

> * Elegir o cambiar la categoría.
> * Dividirla en varias categorías o marcar una parte como por cobrar.
> * Corregir el nombre del comercio.
> * Agregar una nota.
> * Aprobarlo, o descartarlo si no corresponde.
> * Aprobar todos los pendientes de una sola vez.

Al aprobar, el movimiento se convierte en transacción y se refleja en mis saldos y mi presupuesto. Desde esta sección también administro las **reglas de comercio** (qué categoría asignar automáticamente a cada comercio) y las **transacciones programadas**: pagos recurrentes como suscripciones, servicios o cuotas.

Las transacciones programadas aparecen en mis próximos pagos aunque no llegue ningún SMS. Cuando llega el SMS, Finn lo empareja con la que estaba esperando. Si un cobro nunca genera SMS (por ejemplo, un débito automático), puedo registrarlo con un toque o hacer que se registre solo en su fecha. Las programadas no reservan dinero, pero sí me ayudan a decidir cuánto asignar.

## **10\. Reportes**

Muestran estadísticas de mis finanzas, siempre basadas en mis períodos y no en meses calendario. Puedo ver el período actual o los últimos 1, 3, 6 o 12 períodos, y filtrar por cuenta. Los reportes son:

> * **Tendencia:** la evolución de ingresos y gastos.
> * **Categorías:** en qué se va mi dinero, con un gráfico de dona.
> * **Ingresos frente a gastos:** la comparación período a período. El dinero que me devuelven por gastos compartidos no cuenta como ingreso (solo lo que me pagan de más). El dinero que viene de préstamos o inversiones aparece aparte, como "otras entradas".
> * **Cashflow:** cuánto me queda neto en cada período.
> * **Top comercios:** dónde gasto más y con qué frecuencia.
> * **Cumplimiento:** cuánto asigné frente a cuánto gasté por categoría.
> * **Patrimonio:** mis activos (incluido lo que me deben) frente a mis deudas.

Las categorías archivadas siguen apareciendo con su nombre en los reportes de los períodos en que se usaron.

## **11\. Conciliación**

Periódicamente comparo lo que tiene Finn con lo que dice el banco. Para eso subo el estado de cuenta en formato CSV y Finn reconoce automáticamente el formato. Acepta tarjetas y cuentas de BAC, Banco Agrícola y Cuscatlán. Luego separa los movimientos en tres grupos:

> * **Coincidencias:** están en el banco y en Finn. Las marco como conciliadas.
> * **Solo en el estado:** el banco los tiene y Finn no. Puedo agregarlos con un toque, con la fecha que trae el estado de cuenta.
> * **Solo en Finn:** Finn los tiene y el banco no. Pueden ser pendientes, duplicados o errores.

Finn nunca crea transacciones por su cuenta a partir del estado; yo decido qué hacer con cada diferencia. Al terminar, queda registrado cuándo concilié la cuenta y con qué saldo, y si después cambio o elimino algo ya conciliado, ese registro lo refleja.

## **12\. Notificaciones**

Finn me avisa dentro de la aplicación cuando ocurre algo relevante:

> * Llegó un SMS nuevo, un SMS no reconocido o un posible duplicado.
> * Una compra coincide con una transacción programada, o algo se aprobó o registró automáticamente.
> * Un cambio en un período pasado afecta mi período activo.
> * Una categoría archivada quedó con dinero por un cambio en el pasado.
> * Una meta con fecha venció sin cumplirse.

Algunas notificaciones permiten actuar directamente, por ejemplo para confirmar o rechazar una coincidencia.

## **13\. Configuración**

Aquí está todo lo que no es de uso diario:

> * El día de inicio de mi ciclo de presupuesto (el cambio aplica desde el primer período futuro sin asignaciones).
> * La gestión del token que usa MacroDroid.
> * Las reglas de comercio.
> * Las preferencias de la aplicación y de mi perfil.

# **Mejoras para Finn 2.0**

Usar Finn 1.0 durante estos meses me permitió identificar sus falencias. Es normal en una primera versión. Las organizo en tres grupos: errores que hay que corregir, funciones nuevas y mejoras a lo que ya existe.

## **14\. Errores a corregir**

### **Integridad de los datos (prioridad máxima)**

> 1. **Eliminar destruye el historial.** Hoy, eliminar una categoría, una cuenta o un grupo borra el registro por completo. Si borro una categoría que ya no usaré, los registros anteriores quedan corruptos (transacciones sin categoría, períodos pasados con números distintos) o directamente la base de datos no me deja hacerlo. Finn 2.0 debe **archivar en lugar de borrar**: lo archivado desaparece de la vista diaria, pero se conserva en el historial y en los reportes. Eliminar solo debe ser posible en lo que nunca se usó. Si quiero juntar dos categorías, existe una acción aparte, **fusionar**, que mueve todo el historial de una a la otra.
> 2. **Saldos que se descuadran.** El saldo de algunas cuentas no coincide con la suma de sus transacciones; en mi tarjeta LifeMiles hay una diferencia de \$119.73. El saldo de una cuenta debe ser siempre el resultado exacto de sus movimientos.
> 3. **Los períodos cerrados se pueden alterar sin control.** Aunque un período cerrado no permite cambiar lo asignado, sí permite agregar o borrar transacciones, y eso cambia hacia atrás los arrastres y la deuda de las tarjetas sin que nada se recalcule bien. En Finn 2.0, lo asignado en un período cerrado queda bloqueado, pero las transacciones sí se pueden agregar o corregir con su fecha real, porque el historial debe ser fiel a lo que pasó. Todo lo que viene después se recalcula correctamente y Finn me avisa del impacto en el período activo.
> 4. **Cerrar un período puede quedar a medias.** Si algo falla durante el cierre, el período anterior queda cerrado y el nuevo sin asignaciones. En Finn 2.0 no hay un botón de cierre: cada período se activa solo en su fecha. Y cualquier operación de varios pasos debe completarse entera o no hacerse.
> 5. **Fecha incorrecta en los SMS.** Las compras aprobadas desde SMS toman la fecha en hora universal y no la fecha del mensaje. Una compra hecha después de las 6 pm queda con fecha del día siguiente, y cerca del día 20 eso la pasa al período equivocado. La transacción debe usar la fecha real de la compra, en hora de El Salvador, nunca la fecha en que la proceso o la apruebo.
> 6. **El pago de préstamo baja mal el saldo.** Al pagar una cuota se descuenta del saldo del préstamo el total (interés \+ seguro \+ capital). Solo debería bajar el capital; el interés y el seguro son costo, no deuda pagada.

### **Funcionales**

> 7. **Las metas no arrastran el sobrante.** Si le indico a una categoría que el siguiente período se acumule el excedente, o que se rellene con la diferencia necesaria, no se está realizando. Las causas encontradas:
   * El arrastre solo se calcula al usar "avanzar período". Si el siguiente período se crea a mano, nace sin asignaciones y sin arrastre.
   * Si ya existe un período futuro y luego se avanza, se crea otro período encima del existente.
   * "Rellenar hasta" nunca calcula ni asigna la diferencia que falta; hoy funciona igual que "acumular".

   En Finn 2.0 los períodos se generan solos a partir de mi ciclo, sin duplicados, y el sobrante siempre se queda en la categoría. Cada tipo de meta calcula correctamente cuánto me falta asignar.
> 8. **No se puede editar una transacción por completo.** Solo se pueden cambiar la categoría, la nota y el estado. Para corregir un monto, una fecha, una cuenta o un comercio hay que borrarla y crearla de nuevo.
> 9. **Se pueden aprobar SMS sin categoría.** Esto pasa también con "Aprobar todos", y deja gastos que el presupuesto no sabe dónde contar. Aprobar debe exigir que cada parte tenga una categoría o sea un monto por cobrar.
> 10. **Duplicados falsos.** Dos compras legítimas del mismo monto en la misma tarjeta dentro de 5 minutos (por ejemplo, dos cafés) se descartan como duplicadas. Solo un mensaje exactamente igual repetido en pocos minutos debe descartarse solo; cualquier otro parecido debe marcarse como posible duplicado para que yo decida.
> 11. **Números que no coinciden entre pantallas.** Inicio marca una categoría como sobregirada sin considerar lo arrastrado, mientras que Presupuesto sí lo considera. Todas las pantallas deben mostrar exactamente los mismos números.
> 12. **El historial de "Listo para asignar" es aproximado.** La gráfica de su evolución calcula ingresos menos asignado, no el valor real de cada período.

## **15\. Funciones nuevas**

### **Dividir una compra (split)**

Hay ocasiones en las que una compra no pertenece completamente a una sola categoría. Por ejemplo, si en el supermercado compro carnes y también la comida de mi perro, el banco lo procesa como una sola compra, pero para mí va a dos categorías: Supermercado y Gastos de mascota.
Al revisar una compra (desde SMS, Actividad o la conciliación) quiero poder dividirla y asignar una parte del monto a cada categoría. La división puede ser entre dos o más categorías, y una de las partes puede ser un monto por cobrar a otra persona. La transacción sigue siendo una sola para la cuenta y el banco, pero cada parte afecta su propia categoría. Finn debe asegurar que la suma de las partes sea igual al total.

### **Gastos compartidos y reembolsos**

Si estoy con un amigo y pago yo la comida, y luego me transfiere su parte, hoy el cobro completo resta de mi presupuesto. Aunque ingrese su transferencia a mi cuenta, la categoría ya recibió un gasto mayor al real.
Finn 2.0 debe permitir que:

> * La transacción quede guardada por el monto completo, porque mi tarjeta sí hizo esa compra por ese monto.
> * Solo mi parte reste de la categoría.
> * La otra parte quede como un monto **por cobrar**.
> * Mientras no me paguen, si la compra fue con débito o efectivo, ese dinero no esté disponible para asignar, porque ya salió de mi cuenta. Finn me muestra cuánto dinero tengo "en camino".
> * Si la compra fue con tarjeta, la parte de mi amigo quede como deuda de la tarjeta que me falta reservar. Cuando me pague, Finn me propone con un toque usar ese dinero para reservarlo en la tarjeta.
> * Cuando llegue el dinero de mi amigo, pueda vincularlo a ese cobro, incluso en varios pagos parciales. Ese dinero no cuenta como un ingreso en mis reportes, sino como el cierre de esa cuenta pendiente. Si me paga de más, el excedente sí es dinero nuevo.
> * Si me paga de menos o nunca me paga, pueda perdonar el saldo: pasa a ser un gasto mío en la categoría que elija, en el período en que lo perdono.
> * Pueda ver cuánto me deben, quién y desde cuándo, y que eso cuente como parte de mi patrimonio.

### **Devoluciones**

Hoy las **devoluciones** de comercios tampoco se pueden registrar bien. En Finn 2.0, una devolución se vincula a la parte de la compra original a la que corresponde y le devuelve el dinero a esa categoría, en el período en que ocurre la devolución. Puede ser parcial. Si la compra fue con tarjeta, la devolución deshace exactamente lo que hizo la compra. Si la parte devuelta era de mi amigo, reduce lo que me debe. Si no encuentro la compra original, elijo la categoría a la que vuelve el dinero.

### **Mover dinero entre categorías**

Poder cubrir un sobregiro tomando dinero de otra categoría con sobrante, en un solo paso, sin tener que desasignar en una y volver a asignar en otra.

### **Asignación rápida**

> * Botones como "asignar lo que falta para la meta", "asignar lo mismo que el período pasado" o "asignar el promedio de gasto".
> * Un **auto-asignar** que yo activo, por ejemplo al iniciar el período, que llene las categorías según sus metas.

### **Categorización inteligente**

> * Al aprobar un SMS, ofrecer "recordar esta categoría para este comercio" y crear la regla automáticamente.
> * Sugerir la categoría según mi historial: si las últimas compras en un comercio fueron a cierta categoría, proponerla.

### **Pantallas que faltan**

> * Administrar **reglas de comercio**.
> * Administrar **transacciones programadas** (suscripciones, servicios, cuotas), con la lista de próximos pagos.
> * Centro de **notificaciones**.
> * **Configuración**: ciclo del presupuesto, token de MacroDroid y preferencias.

### **Más tipos de SMS**

Hoy solo se leen compras. Finn 2.0 debe reconocer también depósitos, pagos a la tarjeta y devoluciones, y mostrar en la bandeja los mensajes que no logra reconocer.

### **Exportar y respaldar**

Poder exportar mis transacciones y mi presupuesto, y tener respaldos de mis datos.

## **16\. Mejoras a lo existente**

### **Reportes que generen acción**

Los reportes actuales no son muy útiles: muestran números, pero no me dicen mucho. Necesito reportes que muestren el **impacto** de mis gastos y que me provoquen tomar decisiones: ajustar cuentas, editar el presupuesto o cambiar hábitos.

> * **Gasto semanal por categoría:** cuánto gasto cada semana en cada categoría y cómo se compara con las semanas anteriores.
> * **Ritmo de gasto:** si voy a mitad de período y ya gasté el 80% de una categoría, Finn debe avisarme. Por ejemplo: "a este ritmo, Salidas se excederá por \$45 antes del día 20".
> * **Proyección del cierre:** cómo terminaría el período (categorías sobregiradas, cuánto me faltaría reservar para mis tarjetas, cuánto se reduciría "Listo para asignar" y dinero sobrante) si sigo gastando igual.
> * **Presupuesto contra la realidad:** categorías donde siempre me paso y categorías donde siempre me sobra, con una sugerencia concreta, como "en los últimos 3 períodos gastaste en promedio \$180 en Supermercado y asignas \$150; ¿ajustar a \$180?", y un botón para aplicarla.
> * **Comparación contra mi promedio:** cada categoría frente a su promedio de los últimos períodos, destacando las que subieron o bajaron significativamente.
> * **Gastos hormiga:** compras pequeñas y frecuentes que, sumadas, representan mucho. Por ejemplo: "12 compras en cafeterías este período: \$64".
> * **Suscripciones y cobros recurrentes:** detectados automáticamente, con su costo mensual y anual, para decidir cuáles cancelar.
> * **Tarjetas de crédito:** cuánto cargo por período, cuánta deuda me falta reservar y si estoy pagando el total o arrastrando deuda.
> * **Patrimonio en el tiempo:** la evolución de lo que tengo frente a lo que debo, período a período, no solo el valor de hoy.
> * **Hallazgos accionables:** cada reporte debe terminar en una acción posible (ajustar la asignación, crear una meta, mover dinero o revisar un comercio) y no solo en una gráfica.

### **Tarjeta de crédito completa**

Agregar la fecha de corte y la tasa de interés, una alerta antes de la fecha de pago y el monto que debo pagar para no generar intereses.

### **Préstamos e inversiones flexibles**

> * Soportar cuotas semanales, quincenales u otras frecuencias.
> * Soportar préstamos con personas particulares, sin tasa o con reglas simples.
> * Agregar modelos de cálculo para otros bancos.
> * Darle a la inversión su propio modelo de rendimiento y proyección.

### **Actividad con búsqueda y filtros**

Buscar por comercio, monto o nota, y filtrar por categoría, cuenta, rango de fechas y estado.
