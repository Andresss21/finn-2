# Finn 2.0 · juego de datos único de las referencias (cierre del diseño)

Fecha: 11/11/2026. Es el único juego de datos de las referencias de diseño y de la demo. **No es nuevo:** es **A.7 corregido por CT-07** (05 A.7, 07 §28.2 y 06 §3.5.12). Lo que A.7 no da lo fija este documento, con un solo valor por conflicto de la fila `datos-ejemplo` de FALTANTES. La fuente ejecutable es `herramientas/cierre/datos.py`: `comprobar()` verifica la identidad de saldo, los totales, los saldos corridos y la composición de Listo para asignar. Las referencias que cambian salen de ahí (`gen_datos.py`).

Para la implementación, los números de A.7 los da la semilla `estado-a7` ejecutada por el motor (DP-27). Este documento no la reemplaza: dice qué muestra cada pantalla de referencia con esa semilla y qué hechos de pantalla fija el diseño donde la semilla no dice nada.

## 1 · Momento y período

- Hoy: jueves 15/10/2026.
- Período activo: 21/09 – 20/10/2026 (25 días transcurridos, quedan 5).
- La semilla `estado-a7` es el momento **antes del paso 3 del recorrido 4.2**: 3 por revisar en la Bandeja y en la barra de todas las pantallas (07 §28.2).
- Las referencias muestran dos momentos de ese recorrido (CT-07):
  - **La Bandeja y Revisar movimiento** (`S4-bandeja/*`, `01-revisar-movimiento/*`): antes del paso 3, con **3 por revisar** (SUPER SELECTOS ESCALON, FARMACIA SAN NICOLAS y NETFLIX.COM).
  - **Todas las demás pantallas**: después del paso 3 (SUPER SELECTOS aprobado), con **2 por revisar**: 1 pendiente (FARMACIA SAN NICOLAS) y 1 con coincidencia (NETFLIX.COM).
- Para comparar una pantalla con su PNG, la app se lleva a ese momento: semilla para la Bandeja; semilla más el recorrido 4.2 hasta el paso 3 para las demás (CA-C-1 y CA-C-2 del PROMPT-DESARROLLO).

## 2 · Cuentas

| Cuenta | Dato |
|---|---|
| Cuenta corriente · Banco Agrícola ***3310 | Saldo $1,284.60 · confirmado $1,296.95 (FARMACIA del 11/10, pendiente) · conciliada el 30/09 sin diferencia |
| Cuenta de ahorro · BAC | $3,120.00 |
| Visa Oro · BAC ***4821 | Deuda $642.18 · confirmado $607.18 · límite $2,500.00 · uso 25.69 % · te falta reservar $18.75 · corte 25/10 · pago 15/11 · deuda al corte del 25/09 $570.63 · pagado desde el corte $200.00 (10/10) · cargos del ciclo $271.55 · **para no generar intereses $370.63** |
| Mastercard Clásica · Banco Cuscatlán ***0094 | Sin deuda · límite $1,000.00 |
| Préstamo personal · Banco Agrícola | Capital $4,210.00 · cuota 14 de 36, $210.00, el 20/10, **desde Cuenta de ahorro** · con modelo de cálculo |
| Depósito a plazo | $2,075.60 |
| Posición neta | Activos $6,520.20 (efectivo $4,404.60, inversiones $2,075.60, por cobrar $40.00) · deudas $4,852.18 · neto $1,668.02 |

## 3 · Presupuesto del período

| Grupo | Categoría | Asignado | Gastado | Arrastre | Disponible | Meta |
|---|---|---|---|---|---|---|
| Casa | Supermercado | $350.00 | $287.15 | — | $62.85 | Mensual $350.00, cubierta |
| Casa | Luz y agua | $65.00 | $58.40 | — | $6.60 | — |
| Casa | Internet y teléfono | $45.00 | $45.00 | — | $0.00 | — |
| Casa | **Farmacia** | $12.35 | $12.35 | — | $0.00 | — |
| Comida fuera | Restaurantes | $120.00 | $146.30 | $0.00 | −$26.30 (sobregiro con débito) | **Sin meta** |
| Transporte | Gasolina | $80.00 | $98.75 | — | −$18.75 (sobregiro con tarjeta) | — |
| Suscripciones | Netflix | $15.49 | $0.00 | — | $15.49 | Mensual $15.49, cubierta |
| Ahorro | Fondo de emergencia | $100.00 | $0.00 | $1,250.00 | $1,350.00 | Para el 30/06/2027, $3,000.00: pide $175.00, falta $75.00 |
| Ahorro | Viaje | $0.00 | $0.00 | $184.62 | $184.62 | **Anual $1,200.00: falta $92.31** |
| **Deudas** | **Cuota del préstamo** | $210.00 | $0.00 | — | $210.00 | — |
| Pagos de tarjeta | Visa Oro | $0.00 | actividad $166.60 | $456.83 | $623.43 reservado (deuda $642.18; te falta reservar $18.75) | — |
| Pagos de tarjeta | Mastercard Clásica | $0.00 | $0.00 | — | $0.00 | — |

- Totales: asignado **$997.84** · gastado **$647.95** · Disponible **$1,784.51**.
- Archivadas, todas con Disponible $0.00: **Gimnasio** (Casa, archivada el 10/10/2026, meta mensual $30.00 en pausa, programada desactivada) y **Mascota** (grupo Mascotas, archivado). Inicio no tiene «archivadas con Disponible».
- Listo para asignar **$312.40** · en camino **$40.00** (Carlos, CINEMARK) · reducción proyectada al cierre $26.30 → $286.10.
- Identidad de saldo (01 inv. 1): $4,404.60 = $312.40 + $1,784.51 + $623.43 + $18.75 (sobregiro con tarjeta) + $1,665.51 (asignado a futuro).

## 4 · Movimientos del período

Un salario por período: **Salario quincena +$925.00 el 12/10** (decisión C-3).

| Fecha | Comercio | Cuenta | Destino | Monto | Estado |
|---|---|---|---|---|---|
| 22/09 | UNO LOS HEROES | Visa Oro | Gasolina | −$21.40 | confirmada |
| 23/09 | LA PAMPA | Cuenta corriente | Restaurantes | −$42.10 | conciliada |
| 24/09 | PUMA ESCALON | Visa Oro | Gasolina | −$24.10 | confirmada |
| 25/09 | TEXACO SAN BENITO | Visa Oro | Gasolina | −$23.25 | confirmada |
| 26/09 | SUPER SELECTOS ESCALON | Visa Oro | Supermercado | −$92.40 | confirmada |
| 30/09 | PIZZA HUT | Visa Oro | Restaurantes | −$25.60 | confirmada |
| 02/10 | DESPENSA DE DON JUAN | Cuenta corriente | Supermercado | −$71.15 | confirmada |
| 03/10 | TIGO | Cuenta corriente | Internet y teléfono | −$45.00 | confirmada |
| 04/10 | CINEMARK | Cuenta corriente | por cobrar a Carlos | −$40.00 | confirmada |
| 05/10 | STARBUCKS | Cuenta corriente | Restaurantes | −$8.75 | confirmada |
| 08/10 | POLLO CAMPERO | Cuenta corriente | Restaurantes | −$23.05 | confirmada |
| 09/10 | SUPER SELECTOS ESCALON | Visa Oro | Supermercado | −$88.60 | confirmada |
| 10/10 | Pago Visa Oro | Cuenta corriente → Visa Oro | — | −$200.00 | confirmada |
| 11/10 | LA PAMPA | Cuenta corriente | Restaurantes | −$28.30 | confirmada |
| 11/10 | FARMACIA SAN NICOLAS | Cuenta corriente | Farmacia | −$12.35 | pendiente |
| 11/10 | A ahorro | Cuenta corriente → Cuenta de ahorro | — | −$100.00 | confirmada |
| 12/10 | Salario quincena | Cuenta corriente | ingreso | +$925.00 | confirmada |
| 12/10 | DELSUR | Cuenta corriente | Luz y agua | −$58.40 | confirmada (programada) |
| 13/10 | PIZZA HUT | Cuenta corriente | Restaurantes | −$18.50 | confirmada |
| 14/10 | PUMA SANTA ELENA | Visa Oro | Gasolina | −$30.00 | confirmada |
| 15/10 | SUPER SELECTOS ESCALON | Visa Oro | Supermercado | −$35.00 | pendiente |

- Cuenta corriente: $1,007.20 al 21/09 → $1,284.60. Saldos corridos: 965.10 · 893.95 · 848.95 · 808.95 · 800.20 · 777.15 · 577.15 · 548.85 · 536.50 · 436.50 · 1,361.50 · 1,303.10 · 1,284.60.
- Gastos con tarjeta en el período: 8, $340.35. Flujo de efectivo: $4,027.20 + $925.00 − $307.60 (gastos con débito) − $40.00 (por cobrar con débito) − $200.00 (pago de tarjeta) = $4,404.60.
- Netflix no es una transacción todavía: es la coincidencia de la Bandeja con la programada del 17/10.
- **No hay transacción PRICESMART en el período activo.** PRICESMART aparece en los períodos cerrados (4 compras en Top comercios) y es el ejemplo del formulario de Registrar gasto (05 A.7). Los estados que lo muestran guardado (`S5-registrar/guardado` y `03-detalle-de-transaccion/*`) son la rama «después de guardarlo» (sección 7).

## 5 · Lo demás

| Tema | Dato |
|---|---|
| Por cobrar | Carlos: CINEMARK, 04/10, con débito, $40.00 abiertos. Ana y Marta solo tienen partidas cerradas |
| Reglas | SUPER SELECTOS → Supermercado (9 usos) · PUMA → Gasolina (6) · PIZZA HUT → Restaurantes (5) · LA PAMPA → Restaurantes (4) · UNO → Gasolina (3) · SMART FIT → Gimnasio (no se aplica: archivada) |
| Programadas | Netflix 17/10 (Visa Oro, se registra sola) · Cuota del préstamo 20/10 (Cuenta de ahorro, se registra sola) · Aporte a Depósito a plazo 27/10 (Cuenta corriente) · Gimnasio desactivada · TIGO sin historial (primera fecha 25/10; el pago del 03/10 se registró antes de crearla). Ninguna atrasada |
| Formatos | BAC · compra con tarjeta (412 usos) · BAC · pago recibido (14) · Banco Agrícola · compra TD (188) · Banco Agrícola · abono (12) · Cuscatlán · compra con tarjeta (inactivo, 07 §30). 4 activos |
| Instituciones | BAC (2 formatos · 2 cuentas) · Banco Agrícola (2 · 2) · Cuscatlán (1 · 1) · Banco Promerica (sin formatos ni cuentas) |
| Ajustes | Primeros pasos 3 de 3 · token del webhook no se guarda ni se muestra (E5-18) |
| Notificaciones | 2 sin leer: Visa Oro corta el 25/10 · Cuota del préstamo el 20/10 |
| Listo para asignar, detalle | Ingresos del período $925.00 · arrastre del período anterior (cierre de sep) $425.24 · otras entradas $0.00 · asignado en el período −$997.84 · en camino −$40.00 → $312.40 |
| Restaurantes, historial | mar 100.00/88.20/11.80 · abr **102.00**/101.50/**12.30** · may 100.00/96.40/**15.90** · jun 100.00/112.20/**3.70** · jul 120.00/104.75/**18.95** · ago **99.95**/118.90/**0.00**. «Se pasó 2 de 6» son jun y ago (CA-14.9) |
| Reportes | Categorías: 6 con gasto, $647.95. Ritmo, proyección y comparación: los de 3.5.12. Gastos hormiga: ninguno en el período. SPOTIFY: $5.99 el día 18 en los 4 períodos cerrados |

## 6 · Decisiones del cierre sobre los datos

| ID | Conflicto (FALTANTES `datos-ejemplo`) | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|---|
| C-1 | Referencias con los números de A.7 sin CT-07 | Se aplica CT-07 a todas las referencias: totales, Farmacia, Cuota del préstamo, Mascota, historial de Restaurantes, Pago Visa Oro y «para no generar intereses» | CT-07 está aprobado. Las referencias que lo ignoran contradicen la semilla con la que se van a probar (DP-27) | Dejar que «las pantallas tomen los números al implementarse» (P7-19, punto 4): fue lo que dejó dos juegos de datos |
| C-2 | Bandeja con 3 en todas las pantallas | 2 fuera de la Bandeja y 3 en la Bandeja, como dice CT-07 | Es el momento de A.7 | Un solo número en todas: obligaría a rehacer el recorrido 4.2 |
| C-3 | Ingresos de un período: $925.00 o $1,850.00 | **Un salario por período** ($925.00 el 12/10) | Tendencia, Ingresos y gastos, Lo que te quedó y Patrimonio ya están dibujados con un ingreso de $925.00 por período. Con dos, habría que rehacer todas esas historias | Dos quincenas ($1,850.00): cambia cinco reportes y la historia del patrimonio |
| C-4 | «En camino» $20.00 o $40.00 | $40.00: CINEMARK de Carlos con débito (07 §28.2 n.º 10) | Es el hecho de la semilla | PIZZA HUT y PRICESMART de la referencia anterior: no hay transacción PRICESMART en el período activo de A.7 |
| C-5 | Pago a Visa Oro: $300.00 el 12/10 o $200.00 el 10/10 | $200.00 el 10/10 (07 §28.2 n.º 10) | Es el hecho de la semilla y da $370.63 | $300.00 el 12/10 (referencia anterior): no es el hecho de 07 §28.2 y cambia «para no generar intereses» |
| C-6 | Cuenta de la cuota del préstamo | Cuenta de ahorro (05 A.7). Cuenta corriente muestra su propia programada: el aporte al depósito | A.7 lo dice | Cuenta corriente: es lo que mostraba la referencia anterior, pero A.7 dice ahorro y cambiaría el saldo corrido de la corriente |
| C-7 | Fusión con «Comida rápida», que Estructura no tiene | Fusionar **Farmacia con Supermercado** (las dos en Casa); el destino archivado es Gimnasio; ninguna meta se descarta | Usa categorías que existen | Agregar «Comida rápida» a Estructura y al Presupuesto: cambia los totales de CT-07 |
| C-8 | Regla STARBUCKS → Café (archivada) | SMART FIT → Gimnasio (archivada, la de la programada desactivada) | Café no existe; STARBUCKS es de Restaurantes en A.7 | Archivar Café: no está en A.7 |
| C-9 | Estructura con Café y sin la mitad de los grupos; Restaurantes con meta | Los 6 grupos de A.7, Farmacia en Casa, Deudas; Restaurantes sin meta (A.7: «meta ninguna») | Estructura es la lista de A.7 | Agregar Café a A.7 para salvar la referencia: cambia los totales de CT-07 |
| C-10 | «Agregar meta» en una categoría con meta | Restaurantes no tiene meta: «Agregar meta» es correcto en su menú | A.7 | Dar meta a Restaurantes y mostrar «Editar meta»: contradice A.7 («meta ninguna») |
| C-11 | «Formatos bancarios · 7 activos» y 3 en la lista | 5 formatos, 4 activos, y las instituciones con sus cuentas (sección 5) | El pago recibido y el abono se leen en las referencias de Revisar; 07 §30 deja Cuscatlán inactivo | 3 formatos: el pago de tarjeta y el ingreso de Revisar no tendrían formato |
| C-12 | «Primeros pasos: 2 de 3» con todo hecho | 3 de 3 | Cuentas, categorías y SMS están hechos | Dejar «2 de 3» con un paso sin hacer (por ejemplo, SMS): contradice Ajustes, que muestra los SMS conectados |
| C-13 | Viaje con $50.00 asignados en Auto-asignar | $0.00 (A.7). Auto-asignar propone Fondo +$75.00 y Viaje +$92.31: se asignan $167.31 y Listo para asignar queda en $145.09 | A.7 | Mantener «sin cubrir»: con A.7, Listo para asignar alcanza |
| C-14 | Café, Mascota, Lavandería y Transporte público en Categorías | Las 6 categorías con gasto del período, $647.95; sin «Otras» (la regla de 8 porciones queda escrita en la nota) | A.7 | Inventar gasto en esas categorías para conservar el dibujo de 8 porciones con «Otras»: cambia los totales de CT-07 |
| C-15 | Regla propuesta SUPER SELECTOS ESCALON → Farmacia | El arrastre es FARMACIA SAN NICOLAS → Farmacia (06 §4.2 paso 4, CA-78.1); el panel de destinos pone Farmacia en Casa y agrega Deudas | No choca con la regla de SUPER SELECTOS | Mantener SUPER SELECTOS → Farmacia: propone una regla contraria a la que ya existe (SUPER SELECTOS → Supermercado) |
| C-16 | Netflix «sin suficientes compras» con «Al cierre $0.00» | «Se descuenta la programada del 17/10» (3.5.12) | Es por qué da $0.00 | Mantener «sin suficientes compras»: el $0.00 quedaría sin explicación |
| C-17 | Tendencia, titulada «de ingresos y gastos», con el gráfico solo de gastos | Se llama **Tendencia**; el gráfico muestra los gastos y la tabla, ingresos, gastos y otras entradas (E6-23) | El nombre no promete lo que el gráfico no dibuja | Dibujar una segunda serie: el DTO la trae, pero el gráfico de gastos ya está aprobado |
| C-18 | Colores sueltos heredados | Son la sombra del marco del teléfono (presentación, no producto) y el arte de las caras de tarjeta y del héroe de Listo para asignar (decorativos). Van como tokens decorativos en el PROMPT-DESARROLLO; las referencias no cambian | No son texto ni gráfico de datos: no tienen mínimo de contraste | Rehacer las caras de tarjeta con tokens nuevos: cambia arte aprobado |
| C-19 | Conciliaciones del 13–15/10 frente al saldo corrido | Saldos corridos que cuadran con los movimientos (sección 4); la historia de la diferencia de $12.40 (estado del 30/09 $952.70 frente a $965.10 en Finn) queda solo en los estados que la ilustran | A.7: conciliada el 30/09 sin diferencia | Llevar la diferencia a todas las pantallas: contradice A.7 y cambia el saldo de Cuentas |
| C-20 | Gastos hormiga en Café | Ninguno en el período; el estado con datos es de los últimos 3 períodos cerrados, en Restaurantes | Café no existe en A.7, y en el período activo ninguna categoría tiene compras chicas repetidas suficientes; el reporte ya mira períodos cerrados | Crear Café o compras chicas en el período: cambia los totales de CT-07 |

## 7 · Estados que ilustran otra situación

Algunos estados existen para mostrar una situación que A.7 no tiene. Parten de A.7 y cambian solo lo que la situación pide; lo demás es A.7.

| Estado | Lo propio |
|---|---|
| `S5-registrar/guardado` y `03-detalle-de-transaccion/*` | La rama «después de guardar PRICESMART» (15/10, Visa Oro, $148.60, del SMS de BAC de las 17:20: Supermercado $96.10, Farmacia $22.50, Carlos $30.00), con el cobro de $10.00 y la devolución de $5.00 del mismo día: Visa Oro debe $785.78, Supermercado −$28.25, Farmacia −$22.50, Carlos debe $60.00 |
| `S1-inicio/listo-para-asignar-negativo`, `05-…/negativo`, `15-…/lpa-negativo` | Asignado de más: Listo para asignar −$86.15 (asignado en el período −$1,396.39) |
| `06-detalle-de-cuenta/corriente`, `periodo-actual`, `periodo-anterior`, `mas-acciones`, `editar`, `filtro-sin-resultados`, `archivar-bloqueado`, `eliminar-bloqueado`, `ajuste-registrado`, `saldo-verificado`, `conciliar-*`, `verificar-*`, `conciliada` | La comisión de $12.40 del 30/09 que el banco cobró y Finn no tenía (estado del banco $952.70 frente a $965.10). En las demás pantallas, Cuenta corriente no tiene diferencia (A.7) |
| `01-revisar-movimiento/*`, `14-…/sin-conexion-*` y `T3-errores-de-flujo/*` donde se ve la Bandeja | El momento de la Bandeja: 3 por revisar, salvo los estados ya aprobados (`aprobado`, `ya-aprobado`), que muestran 2 |
| `11-ajustes/formato-*` | El SMS de prueba es el de PRICESMART del 15/10 a las 17:20 (BAC, VISA ***4821, $148.60), recibido sin reconocer a las 17:21 |
| `04-reportes/top-comercios` | Últimos 3 períodos cerrados: PRICESMART 4 compras, $412.80 |
| `07-flujos-del-presupuesto/archivar-categoria*` | Supermercado con una programada «Despensa quincenal» (cada 15 días), que no está en A.7, para mostrar que se desactiva |
| `15-…/ritmo-y-tarjetas` | Ritmo alto en Restaurantes y los dos pagos de tarjeta próximos (Visa Oro 15/11, Mastercard 02/11 sin deuda) |
| `S2-presupuesto/periodo-cerrado`, `S3-detalle/*` de período cerrado | Etiqueta del período 21/08–20/09. **Pendiente:** sus montos son todavía los del período activo; el dueño decide si se rehacen con el historial (pregunta 9 de la revisión del cierre) |
| `S3-detalle/archivada*`, `15-…/herramientas` | Gimnasio con $25.00 de una devolución del 12/10 |
| `09a-metas/vencida*`, `extendida`, `meta-ajustada` | Viaje con una meta para el 30/09 (faltaron $1,015.38) |
| `S6-cuentas/con-billetera`, `tarjeta-con-saldo-a-favor-…` | Billetera de $40.00; Mastercard con $25.00 a favor |
| `S4-bandeja/aprobar-todos*`, `muchos` | Más SMS en la Bandeja |
| Estados vacíos, de primer uso, de error y de carga | Lo que su nombre dice |

**Nota sobre Visa Oro (pendiente del dueño).** Con los consumos que fija CT-07 (06 §3.5.12), los cargos posteriores al corte del 25/09 suman $271.60 y no $271.55, y la actividad ($166.60) y el arrastre ($456.83) que CT-07 da para Visa Oro no salen de esos consumos. Las referencias muestran los valores de A.7 ($570.63 al corte, $271.55 de cargos, $370.63 para no generar intereses). El diseño no decide qué número corrige CT-07: queda como pregunta 1 de la revisión del cierre. La semilla `estado-a7` de la Fase 8 debe cuadrarlo.
