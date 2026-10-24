"""Cambios [R5] (revisión de la Parte E) a 06-features.md."""
import re, sys
p = '/home/claude/06-features.md'
s = open(p).read()


def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, f'{c} veces: {a[:90]!r}'
    s = s.replace(a, b)


def despues_linea(prefijo, texto):
    global s
    m = [x for x in re.finditer(r'^' + re.escape(prefijo) + r'.*$', s, re.M)]
    assert len(m) == 1, prefijo
    i = m[0].end()
    s = s[:i] + '\n' + texto.rstrip('\n') + s[i:]


def seccion(desde, hasta, nuevo):
    global s
    i = s.index(desde); j = s.index(hasta, i)
    s = s[:i] + nuevo + s[j:]


# ---------------- estado y convenciones
i = s.index('**Fase:** 6. **Estado:**'); j = s.index('\n', i)
s = s[:i] + ("**Fase:** 6. **Estado:** **Aprobado — Fase 6 cerrada** (21 de octubre de 2026). Partes A a E aprobadas (ajustes **[A1]**, "
             "**[R1]** a **[R5]**, **[B1]**, **[E]**). CF-01 a CF-25 aplicados a 00, 01, 03, 04 y 05 con su línea en \"Enmiendas "
             "posteriores\" (marca **[F6]** en 04 y 05), salvo CF-03, diferido. P6-26 y P6-27 resueltas como ajustes del diseño (5.6). "
             "Las verificaciones van en `06-features-verificacion.zip`.") + s[j:]
rep("| **[E]** | Agregado con la Parte E |", "| **[E]** | Agregado con la Parte E |\n| **[R5]** | Cambio de la revisión de la Parte E |")

# ---------------- 0.6 y 0.7
rep("| CF-25 **[E]** | Datos para los componentes visuales de R-8 (proporciones y diferencias calculadas en el servidor) y variante `cubrir_sobregiro` de OP-16 | — | — | — | §6.2, §6.3, §6.5, §6.8, §6.9.3, §6.14.4 | §10.8 | **Pendiente** de aprobación (5.8) |",
    "| CF-25 **[E]** **[R5]** | Datos para los componentes visuales de R-8 (proporciones y diferencias calculadas en el servidor, con sus bordes) y variante \"cubrir el sobregiro\" de OP-16 | — | OP-16 (variante, precisión) | — | §6.2, §6.3, §6.5, §6.8, §6.9.3, §6.14.4 | §10.8.1 | Al cerrar (aprobado en 0.16) |")

# ---------------- 0.16
rep("\n---\n\n## 1. Catálogo de features", """
### 0.16 Revisión de la Parte E **[R5]**

Aprobada, con FD-31, FD-32 y SE-1 a SE-3. Respuestas y correcciones:

| # | Pedido | Cómo quedó | Dónde |
|---|---|---|---|
| CF-25 | Aprobado con las correcciones 1 a 3 | Aplicado a 01, 04 y 05 | 5.8, 7.5 |
| P6-26 | Opción a) | El billete enlaza a `/presupuesto?filtro=sin-fondos`, o a `/presupuesto` si no hay categorías sin fondos; con LPA negativo, a `/presupuesto`. Ajuste del diseño, sin CF | 5.2, 5.6, CA-08.11 |
| P6-27 | Opción a) | Sin previsualización: `ConfirmacionImpacto` solo con AV-01 y el resultado después de guardar, con un enlace a cada categoría tocada. Ajuste del diseño, sin CF | 5.2, 5.6, CA-21.12 |
| Corrección 1 | Barra de gastado desde los derivados de 01 | Excedente = SobT + SobD; cubierto = lo cubierto del reparto D2; base = máx(máx(0, F), cubierto + excedente); `tipoExcedente` es el tipo de `SobregiroDto`; `null` solo sin fondo, sin consumos y sin sobregiro. Verificado con 20.000 casos aleatorios (con tarjeta, débito, devoluciones D-2 y asignaciones negativas): `excedenteBp > 0` ⇔ sobregiro, con el mismo tipo | 5.8, CA-09.8 a CA-09.13 |
| Corrección 2 | Proporciones de más de 100 % o sin base | Posición neta con escala relativa al mayor (`barras: { activosBp, deudasBp }`, en lugar de `deudasSobreActivosBp`); `usoSinReservarBp` nulo sin límite o con límite 0, con tope 10.000; `porcentajeReferenciaBp` nulo con referencia 0, sin tope (es un texto). El componente dibuja esos valores sin recalcular | 5.8, CA-51.6 a CA-51.8, CA-61.6 y CA-61.7 |
| Corrección 3 | La variante de OP-16 es de 01 | 01 incluido en el impacto de CF-25 (línea en sus "Enmiendas posteriores") y en 7.5 | 5.8, 7.5 |
| Corrección 4 | Estados únicos y reproducibles en 4.3 y 4.6 | Cada uno tiene un estado sembrado explícito y los números de cada paso, calculados con `recorridos/motor_min.py` (que reproduce ESC-17 como control) y, para la sugerencia de realidad, con el prototipo de 3.5 | 4.3, 4.6, V6-13 |
| Corrección 5 | Regla de duplicado en 4.4 | Confirmado contra 01 §4.17 y 04 §8.4: el pago registrado a mano tiene un efecto en la tarjeta, que es la cuenta del movimiento; la ventana es una diferencia de fechas de a lo sumo 1 día. Citado en el paso 4 | 4.4 |
| Corrección 6 | 62 frente a 63 operaciones | El script agregaba OP-53 a mano y, con 04 ya enmendado, la contaba también desde su encabezado: 63 era OP-53 repetida. Ahora el catálogo no tiene repeticiones: 62 en los dos casos. OP-54 no entra (sigue diferida) | 6.1, 7.6 |
| Menor | `reporte()` en FT-59 | Era un falso positivo del script: la introducción de 2.10 (que menciona `reporte()`) quedaba dentro de la última ficha de 2.9. El script corta ahora cada ficha en el siguiente encabezado de sección; FT-59 queda solo con `detalleCuenta()` | 6.3 |

---

## 1. Catálogo de features""")

# ---------------- criterios nuevos
despues_linea("- **CA-08.10**", """- **CA-08.11** **[R5]** Dado LPA $312.40 y al menos una categoría sin fondos, cuando toco "Asignar $312.40" en el billete, entonces abro `/presupuesto?filtro=sin-fondos`; sin categorías sin fondos, `/presupuesto`; con LPA −$86.15, "Quitar $86.15 de una categoría" abre `/presupuesto` (P6-26).
- **CA-08.12** **[R5]** Dado $40.00 en camino de un deudor, cuando miro el billete, entonces dice "En camino $40.00", sin el nombre del deudor (5.6).""")
despues_linea("- **CA-09.7**", """- **CA-09.8** **[R5]** Dado Asignado $120.00 y un gasto con débito de $146.30, cuando abro Presupuesto, entonces `barra` = cubierto 8,202 y excedente 1,798 puntos básicos, tipo `debito`, igual que el indicador "Sobregiro con débito o efectivo" (CF-25).
- **CA-09.9** **[R5]** Dado el paso 2 de ESC-17 (Super), cuando abro Presupuesto, entonces `barra` = cubierto 6,667 y excedente 3,333, tipo `mixto`.
- **CA-09.10** **[R5]** Dado una categoría con Asignado −$20.00 y sin consumos, cuando abro Presupuesto, entonces `barra` = cubierto 0 y excedente 10,000, tipo `debito` (01 supuesto 6), con el indicador de sobregiro con débito; nunca un cubierto negativo.
- **CA-09.11** **[R5]** Dado Asignado $50.00, un gasto con débito de $80.00 y una devolución en efectivo de $30.00 en el mismo período (D-2), cuando abro Presupuesto, entonces la categoría no está sobregirada y `barra` = cubierto 10,000, excedente 0, tipo nulo.
- **CA-09.12** **[R5]** Dado una categoría con Asignado $0.00, sin arrastre ni consumos, cuando abro Presupuesto, entonces `barra` es nulo y la fila no dibuja la barra.
- **CA-09.13** **[R5]** Para cualquier estado (prueba de propiedades, Fase 7): `excedenteBp > 0` si y solo si la categoría tiene sobregiro, con `tipoExcedente` igual al tipo de su `SobregiroDto`; `cubiertoBp ≥ 0` y `cubiertoBp + excedenteBp ≤ 10,000`.""")
despues_linea("- **CA-12.8**", """- **CA-12.9** **[R5]** Dado Restaurantes con Asignado $120.00 y Disponible −$26.30, cuando abro asignar desde "Cubrir $26.30", entonces la opción "Cubrir el sobregiro" trae $146.30 calculado por el servidor (`rapida.cubrirSobregiro`) y, al tocarla, Asignado queda en $146.30 con las reglas de OP-14 (AV-11 si LPA queda negativo); con Disponible ≥ 0, la opción no se ofrece (CF-25).""")
despues_linea("- **CA-14.6**", """- **CA-14.7** **[R5]** Dado el detalle de Restaurantes de A.7, cuando toco "Cubrir $26.30", entonces se abre asignar con $146.30 de `rapida.cubrirSobregiro` (CA-12.9); la interfaz no suma.
- **CA-14.8** **[R5]** Dado un período con gasto en tres días ($10.00, $40.00 y $20.00), cuando abro el calendario, entonces `intensidadBp` es 2,500, 10,000 y 5,000; un día cuyas devoluciones superan los consumos tiene 0; si ningún día tiene gasto positivo, todos son 0.
- **CA-14.9** **[R5]** Dado un historial de 6 períodos con gastado mayor que el asignado en 2, cuando abro el detalle, entonces `historialResumen.periodosExcedidos` es 2 ("Se pasó 2 de 6") y el promedio gastado lo da el servidor; con 3 períodos en el historial, "Se pasó k de 3".
- **CA-14.10** **[R5]** Dado Fondo de emergencia con $1,350.00 de una meta de ahorro de $3,000.00, cuando abro el detalle, entonces `meta.progresoBp` es 4,500, el mismo valor que en `metas()`; con más de $3,000.00, 10,000.""")
despues_linea("- **CA-21.11**", """- **CA-21.12** **[R5]** Dado un gasto de $148.60 con 3 líneas en el período activo, cuando toco "Guardar", entonces se guarda sin previsualizar y el resultado dice "Guardado: PRICESMART · $148.60 · Visa Oro · 3 líneas" con un enlace a cada categoría tocada; con la fecha en un período cerrado, primero aparece `ConfirmacionImpacto` con AV-01 (P6-27).""")
despues_linea("- **CA-29.7**", """- **CA-29.8** **[R5]** Dado Visa Oro con fecha de pago el 15/11, cuando abro su categoría de pago, entonces "Pagá antes del 15/11" sale de `desgloseAlPagar.proximoPago`, el mismo valor que `cuentas().tarjetas[].proximoPago`.""")
despues_linea("- **CA-35.10**", """- **CA-35.11** **[R5]** Dado la regla "PIZZA HUT → Restaurantes", cuando llega un SMS de PIZZA HUT, entonces `categoriaSugerida.porRegla` es verdadero y la fila dice "(por regla)"; si la sugerencia sale del historial, es falso y la fila no lo dice.""")
despues_linea("- **CA-51.5**", """- **CA-51.6** **[R5]** Dado el paso 4 de ESC-01 (activos $1,000.00, deudas $5,300.00), cuando abro Cuentas, entonces `posicionNeta.barras` = activos 1,887 y deudas 10,000 puntos básicos (escala relativa al mayor) y `PosicionNeta` dibuja esos anchos sin recalcular.
- **CA-51.7** **[R5]** Dado activos y deudas en $0.00, cuando abro Cuentas, entonces las dos barras son 0; con activos iguales a deudas, las dos son 10,000.
- **CA-51.8** **[R5]** Dado Visa Oro de A.7 (te falta reservar $18.75, límite $2,500.00), cuando abro Cuentas, entonces `usoSinReservarBp` es 75; con límite nulo o $0.00 es nulo y la barra no muestra la parte sin reservar; con te falta reservar mayor que el límite, 10,000.""")
despues_linea("- **CA-61.5**", """- **CA-61.6** **[R5]** Dado Supermercado de A.7 (Asignado $350.00, período de 30 días, semana 4 en curso con $35.00 de gasto y $287.15 acumulados), cuando abro el gasto semanal, entonces la referencia de la semana es $81.67, `porcentajeReferenciaBp` 4,286 ("43 % de la referencia") y `diferenciaReferencia` $39.52 ("Vas $39.52 por debajo").
- **CA-61.7** **[R5]** Dado Asignado negativo o $0.00, cuando abro el gasto semanal, entonces `porcentajeReferenciaBp` es nulo y no se muestra el porcentaje; un gasto mayor que la referencia da más de 10,000 sin tope, porque es un texto.""")

# ---------------- 4.3, 4.4, 4.6
seccion("### 4.3 Inicio de período\n", "### 4.4 Pagar la tarjeta\n", """### 4.3 Inicio de período **[R5]**

**Estado sembrado** (`06-verificacion/recorridos/recorridos.py`, `estado_4_3`). Ciclo del 21 al 20: P1 = 21/01–20/02/2027, P2 = 21/02–20/03, P3 = 21/03–20/04, P4 = 21/04–20/05. **Hoy: 21/04/2027**, primer día de P4, antes de la tarea diaria.

- **Cuenta:** Ahorro (efectivo), apertura 21/01/2027 con saldo inicial $900.00. Ingresos de $600.00 el 25/01, 25/02 y 25/03.
- **Estructura, en orden:** Casa (Super, Farmacia), Comida fuera (Restaurantes), Suscripciones (Netflix), Ahorro (Fondo).
- **Metas:** Super mensual "acumular" $300.00; Netflix mensual "acumular" $15.49; Fondo "para una fecha" $600.00 al 15/04/2027 (cae en P3).
- **Asignaciones (P1, P2, P3):** Super $300.00 cada una; Restaurantes $100.00 cada una; Netflix $15.49 cada una; Fondo $150.00, $150.00 y $100.00; Farmacia $0.00, $20.00 y $35.00. Ninguna en P4.
- **Gastos con débito desde Ahorro:** Netflix $15.49 el 21 de cada mes (P1 a P3, registrados por la programada); Super $280.00, $290.00 y $310.00 el 28; Restaurantes $140.00, $145.00 y $150.00 el 27; Farmacia $20.00 el 02/03 y $30.50 el 02/04.
- **Programada:** Netflix, $15.49, mensual, día 21, desde Ahorro hacia Netflix, con registro automático.

**Derivados del estado (paso 0):** Ahorro $1,288.03; LPA $863.53; reducciones al cierre (sobregiros con débito de Restaurantes): P1 $40.00, P2 $45.00, P3 $50.00; Disponibles en P4 (arrastre): Super $20.00, Farmacia $4.50, Fondo $400.00; meta Fondo **vencida** ($400.00 < $600.00 al 15/04). Identidad: $863.53 + $424.50 = $1,288.03.

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | (Tarea diaria del 21/04) | — | 04 §10.2, pasos 1 y 3 | Registra Netflix $15.49 con fecha 21/04 (P4): Ahorro $1,272.54, Netflix −$15.49, LPA $863.53 sin cambios. Un solo push de cierre: "Cerró el período del 21/03 al 20/04. Listo para asignar bajó $50.00 por sobregiros. Una meta venció." | FT-42, FT-71 |
| 2 | Toca el push | `/presupuesto?periodo=2027-03-21` | `presupuesto()` | P3 en solo lectura: Restaurantes −$50.00 con "Sobregiro con débito o efectivo", sin "+" | FT-09, FT-16 |
| 3 | Va a P4 y abre el detalle de LPA | `/presupuesto/listo-para-asignar` | `detalleLpa()` | Reducciones por sobregiro con débito: $135.00 ($40.00, $45.00 y $50.00); la descomposición suma $863.53 | FT-15 |
| 4 | Extiende la meta Fondo al 20/06/2027 | `/metas/[metaId]` | OP-18 | AV-17 desaparece; "En curso", con n = 2 y pedido $100.00 = ⌈($600.00 − $400.00) / 2⌉ | FT-17 |
| 5 | Auto-asigna | `/presupuesto/auto-asignar` | OP-17 | En orden: Super $300.00, Netflix $15.49, Fondo $100.00; sin AV-18; LPA $448.04; Netflix $0.00; Fondo $500.00 | FT-13, FT-17 |
| 6 | En Farmacia, "Tu promedio de gasto (2 períodos)" | `/presupuesto/asignar/[categoriaId]` | OP-16 | $25.25 = ($20.00 + $30.50) / 2 (en P1 Farmacia no existía, CF-17); Farmacia $29.75; LPA $422.79 | FT-12 |
| 7 | Abre "Presupuesto contra la realidad" y acepta el ajuste de Restaurantes | `/reportes/realidad` | OP-14 (propuesta) | Gastado $140.00, $145.00 y $150.00 contra $100.00 asignados: "se pasa", sugerido $145.00 (3.5.6); Restaurantes $145.00; LPA $277.79; Ahorro $1,272.54 | FT-63 |

**Se verifica de punta a punta:** ningún botón cierra el período (01 §7.3); el arrastre de cada categoría es máx(0, Disponible anterior) (01 §4.6); la identidad de saldo se cumple en cada paso.

""")
rep("| 4 | Llega el SMS del pago | `/bandeja` | OP-35 | Movimiento de tipo pago de tarjeta, marcado como posible duplicado del pago del paso 3 (misma cuenta, mismo monto, ±1 día; 01 §4.17) | FT-34, FT-37 |",
    "| 4 | Llega el SMS del pago (fecha 19/02) | `/bandeja` | OP-35 | **[R5]** Movimiento de tipo `pago_tarjeta` cuya cuenta es la tarjeta (04 OP-37), en `posible_duplicado` con `MovimientoDto.duplicado.tipo = 'transaccion'` (`movimientos.duplicado_transaccion_id`) apuntando al pago del paso 3. Regla de 01 §4.17 (\"Posible duplicado\"), aplicada en 04 §8.4 paso c con la fecha del SMS: hay una transacción con un efecto en la misma cuenta (la tarjeta; 03 `ix_efectos_cuenta`), el mismo monto, una diferencia de fechas de a lo sumo 1 día (fecha del SMS entre f − 1 y f + 1; aquí 0) y texto distinto. Antes se evalúa el emparejamiento (M2), sin candidata aquí. ⚠ Depende de un formato de SMS de pago, que todavía no existe (P4-3, S6-1) | FT-34, FT-37 |")
seccion("### 4.6 Cerrar con sobregiros\n", "### 4.7 Lo que la Fase 7 hace con los recorridos\n", """### 4.6 Cerrar con sobregiros **[R5]**

**Estado sembrado** (`recorridos.py`, `estado_4_6`). **Hoy: 12/02/2027** (P1 = 21/01–20/02).

- **Cuentas:** Ahorro (efectivo), saldo inicial $0.00, con un ingreso de $1,000.00 el 01/02; tarjeta T sin deuda inicial.
- **Asignaciones en P1:** Super $100.00, Salidas $100.00, Ropa $80.00.
- **Gastos:** Salidas $150.00 con débito el 08/02; en Super, el 10/02: débito $60.00 (registrado a las 10:00), T $70.00 (12:00) y un débito olvidado de $20.00 con fecha 10/02 registrado el 12/02 (clave de orden posterior).

**Derivados del estado:** Ahorro $770.00; LPA $720.00; Super −$50.00 (tarjeta $30.00, débito $20.00); Salidas −$50.00 (débito); Ropa $80.00; Pago T $40.00; te falta reservar T $30.00; reducción proyectada al cierre $70.00. Identidad: $720.00 + (−$50.00 − $50.00 + $80.00 + $40.00) + $30.00 = $770.00.

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | Abre Inicio | `/` | `inicio()` | Super (mixto) y Salidas (débito) en sobregiradas, con su indicador y sin montos a la vista; T con "Te falta reservar" $30.00; reducción proyectada $70.00 | FT-08, FT-16 |
| 2 | Toca Super | `/presupuesto/categorias/[categoriaId]` | `detalleCategoria()` | Reparto D2: débito $60.00 cubierto; T $70.00 con $40.00 cubiertos y $30.00 no; débito olvidado $20.00 al final, no cubierto; sobregiro mixto: tarjeta $30.00, débito $20.00 | FT-14 |
| 3 | Mueve $50.00 de Ropa a Salidas | `/presupuesto/mover` | OP-15 | Salidas $0.00; Ropa $30.00; LPA $720.00; reducción proyectada $20.00 | FT-11 |
| 4 | Llega el cierre (hoy 21/02) | — | (derivado) | LPA $700.00: baja $20.00, solo la parte de débito de Super; te falta reservar T sigue en $30.00; Disponibles en P2: Ropa $30.00 y Pago T $40.00 | FT-16 |
| 5 | Asigna $30.00 a Pago T en P2 | `/presupuesto/asignar/[categoriaId]` | OP-14 | Te falta reservar $0.00; Pago T $70.00; LPA $670.00 | FT-10, FT-29 |
| 6 | Abre el detalle de LPA | `/presupuesto/listo-para-asignar` | `detalleLpa()` | Reducción por sobregiro con débito de P1: $20.00; entradas $1,000.00 − asignado $310.00 − reducciones $20.00 = $670.00 | FT-15 |

**Se verifica de punta a punta:** la parte con tarjeta de un sobregiro no reduce Listo para asignar al cierre y pasa a "te falta reservar" sin cambiar ni un centavo (01 §4.15); la identidad de saldo se cumple en cada paso.

""")

# ---------------- §5
rep("| S1 Inicio | Botón \"Asignar $312.40\" del billete, que abre la hoja Asignar | FT-08, FT-10 | **Pregunta P6-26:** asignar necesita una categoría (OP-14) y la hoja del diseño no la pide |",
    "| S1 Inicio | Botón \"Asignar $312.40\" del billete, que abre la hoja Asignar | FT-08, FT-10 | **Ajuste del diseño (P6-26 a, [R5]):** el botón es un enlace a `/presupuesto?filtro=sin-fondos`, o a `/presupuesto` si no hay categorías sin fondos (CA-08.11) |")
rep("| S1 Inicio | Billete negativo con \"Quitar $86.15 de una categoría\" | FT-08, FT-10 | P6-26 (mismo caso).",
    "| S1 Inicio | Billete negativo con \"Quitar $86.15 de una categoría\" | FT-08, FT-10 | **Ajuste del diseño (P6-26 a):** enlace a `/presupuesto`.")
rep("| S5 Registrar | Bloque \"Antes de guardar\" con valor actual → valor nuevo de la deuda y de cada categoría | FT-21 | **Pregunta P6-27:** esos valores nuevos son derivados que solo da el servidor, y OP-20 no se previsualiza salvo con AV-01 (05 FE-07) |",
    "| S5 Registrar | Bloque \"Antes de guardar\" con valor actual → valor nuevo de la deuda y de cada categoría | FT-21 | **Ajuste del diseño (P6-27 a, [R5]):** el bloque se quita. Sin previsualización; `ConfirmacionImpacto` solo con AV-01 y, después de guardar, el resultado con un enlace a cada categoría tocada (CA-21.12) |")
rep("| S6 Cuentas | Posición neta con barras de activos y deudas | FT-51 | **CF-25:** la proporción deudas / activos viene del DTO |",
    "| S6 Cuentas | Posición neta con barras de activos y deudas | FT-51 | **CF-25 [R5]:** las dos barras vienen del DTO con escala relativa a la mayor (`barras`), así que ninguna pasa de 100 % |")
rep("| `BarraGastado` **(nuevo)** | `{ barra: BarraCategoriaDto }` | No | **CF-25:** `FilaCategoria.barra = { cubiertoBp; excedenteBp; tipoExcedente: 'debito' \\| 'tarjeta' \\| 'mixto' \\| null; metaBp?: number; estadoMeta?: EstadoMeta } \\| null` |",
    "| `BarraGastado` **(nuevo)** | `{ barra: BarraCategoriaDto }` | No | **CF-25 [R5]:** `FilaCategoria.barra = { cubiertoBp; excedenteBp; tipoExcedente: 'debito' \\| 'tarjeta' \\| 'mixto' \\| null; metaBp?: number } \\| null` (5.8) |")
rep("| `BilleteraTarjetas` **(nuevo)** | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | `CuentasDto.tarjetas` (04 §6.5) más **CF-25** `usoSinReservarBp` |",
    "| `BilleteraTarjetas` **(nuevo)** | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | `CuentasDto.tarjetas` (04 §6.5) más **CF-25** `usoSinReservarBp` (nulo sin límite; tope 10.000) |")
rep("| `PosicionNeta` **(nuevo)** | `{ posicion: CuentasDto['posicionNeta'] }` | No | `posicionNeta` (04 §6.5) más **CF-25** `deudasSobreActivosBp` | Activos al 100 %; deudas rayadas, para distinguirlas sin color |",
    "| `PosicionNeta` **(nuevo)** | `{ posicion: CuentasDto['posicionNeta'] }` | No | `posicionNeta` (04 §6.5) más **CF-25** `barras: { activosBp; deudasBp }` | La mayor de las dos al 100 % y la otra en proporción; deudas rayadas, para distinguirlas sin color. Dibuja los anchos tal cual |")
rep("| Panel de notificaciones | Pie y ejemplos | 5.3 |",
    "| Panel de notificaciones | Pie y ejemplos | 5.3 |\n| S1 billete **[R5]** | \"Asignar $312.40\" abre la hoja Asignar; \"Quitar $86.15 de una categoría\" | Los mismos textos, como enlaces a `/presupuesto?filtro=sin-fondos` (o `/presupuesto` sin categorías sin fondos) y a `/presupuesto` (P6-26 a) |\n| S5 **[R5]** | Bloque \"Antes de guardar\" | Se quita; el resultado después de guardar enlaza a cada categoría tocada (P6-27 a) |")

seccion("### 5.8 Lo que necesita aprobación\n", "\n---\n\n## 6. Trazabilidad", """### 5.8 CF-25 y las preguntas de esta sección **[R5]**

**CF-25. Datos para los componentes visuales de R-8** (aprobado en 0.16, con las correcciones 1 a 3). Todo lo que el diseño muestra como proporción o diferencia de montos viene del DTO (ADR-07, PF-3), calculado por selectores del dominio sobre la misma instantánea, sin lecturas nuevas. Las proporciones van en puntos básicos con redondeo mitad hacia arriba; los componentes dibujan esos valores sin recalcular. Verificado en `recorridos/cf25.py` (V6-13).

| Consulta | Campo | Definición |
|---|---|---|
| `presupuesto()`, `FilaCategoria` | `barra: { cubiertoBp; excedenteBp; tipoExcedente: 'debito' \\| 'tarjeta' \\| 'mixto' \\| null; metaBp?: number } \\| null` | Con F = fondo del período (01 §4.5, incluye las entradas de devoluciones D-2 a D-4), cubierto = Σ cubierto del reparto D2 y excedente = SobT + SobD (01 §4.7): base = máx(máx(0, F), cubierto + excedente). `excedenteBp` = excedente / base, al menos 1 si el excedente es positivo; `cubiertoBp` = mín(cubierto / base, 10.000 − `excedenteBp`), siempre ≥ 0. `tipoExcedente` es el tipo del `SobregiroDto` de la fila (mixto si SobT y SobD son positivos). `null` solo si base = 0 (sin fondo, sin consumos y sin sobregiro). `metaBp`: el progreso de `metas()` (04 §6.10), solo en metas de ahorro |
| `detalleCategoria()` (normal) | `historialResumen: { promedioGastado; periodosExcedidos }`; `meta.progresoBp?`; `calendario[].intensidadBp` | Promedio (mitad hacia arriba) y conteo de gastado > asignado sobre los períodos del historial que trae (CF-17: los que haya, hasta 6); progreso como en `metas()`, tope 10.000; intensidad = máx(0, gastado del día) / máximo de los días del período; todas 0 si ese máximo es ≤ 0 |
| `detalleCategoria()` (pago) | `desgloseAlPagar.proximoPago` | El `proximoPago` de 04 §6.5 |
| `cuentas()` | `tarjetas[].usoSinReservarBp: number \\| null`; `posicionNeta.barras: { activosBp; deudasBp }` | S(t) / límite, con tope 10.000; nulo si el límite es nulo o 0. Barras: escala relativa al mayor de los dos totales (el mayor = 10.000; el otro, su proporción, al menos 1 si es positivo); 0 y 0 si los dos son 0. Reemplaza al `deudasSobreActivosBp` de la propuesta, que con ESC-01 daba 53.000 |
| `reporte('gasto_semanal')` | `categorias[].semanaActual?: { k; porcentajeReferenciaBp: number \\| null }`; `categorias[].diferenciaReferencia` | Gasto de la semana k / Ref(k), sin tope (se muestra como texto); nulo si Ref(k) ≤ 0 (asignado ≤ 0 o semana sin referencia). Diferencia = RefAcum(k) − gasto acumulado hasta k (negativa si se pasó) |
| `bandeja()` | `MovimientoDto.categoriaSugerida.porRegla` | Verdadero si el origen de `sugerirCategoria` es `regla` (04 §6.0.5, 01 §4.17) |
| `formulario('asignar')` | `contexto.rapida.cubrirSobregiro?` | Asig(c, p) + máx(0, −Disp(c, p)), solo si Disp(c, p) < 0 |

**Variante "cubrir el sobregiro" de OP-16** (precisión de 01 OP-16, correción 3): Asig(c, p) = Asig(c, p) + máx(0, −Disp(c, p)); se ofrece solo con Disp(c, p) < 0 y se aplica con las reglas de OP-14, incluido AV-11. Es lo que hacen "Cubrir $26.30" y "Reservar $18.75" del detalle (S3).

**Impacto:** 01 OP-16 (línea en "Enmiendas posteriores"); 04 §6.2, §6.3, §6.5, §6.8, §6.9.3 y §6.14.4; 05 §10.8.1. Criterios: CA-09.8 a CA-09.13, CA-12.9, CA-14.7 a CA-14.10, CA-29.8, CA-35.11, CA-51.6 a CA-51.8, CA-61.6 y CA-61.7.

**P6-26 y P6-27** quedaron resueltas con la opción a) como ajustes del diseño (5.2, 5.6), sin cambios a 01 a 05. Criterios: CA-08.11 y CA-21.12.
""")

# ---------------- §6 y §7
rep("| T1 | Cada operación de 04 (OP-01 a OP-52, OPT-01 a OPT-09) y OP-53 (CF-01) aparece en al menos una ficha | 62 de 62 |",
    "| T1 | Cada operación de 04 (OP-01 a OP-52, OPT-01 a OPT-09) y OP-53 (CF-01) aparece en al menos una ficha. **[R5]** El catálogo no tiene repeticiones (con 04 ya enmendado, OP-53 sale de su encabezado y no se suma otra vez); OP-54 no entra porque sigue diferida | 62 de 62 |")
rep("| T6 | Cada CF de 0.7 aparece en al menos una ficha, en §3 o en §5 (CF-03 diferido; CF-25 pendiente, en §5) | 25 de 25 |",
    "| T6 | Cada CF de 0.7 aparece en al menos una ficha, en §3 o en §5 (CF-03 diferido) | 25 de 25 |")
rep("| R6-5 | Sin CF-25, los componentes de R-8 no tienen los datos que dibujan | Alta si no se aprueba · medio | La pantalla funciona sin las barras (los montos ya están); con CF-25, ningún cálculo queda en la interfaz |",
    "| R6-5 | Un componente de R-8 recalcula una proporción en lugar de dibujar la del DTO | Baja · medio | CF-25 aprobado: todos los campos vienen del servidor; CA-09.13 y CA-51.6 lo prueban |")
seccion("### 7.4 Preguntas abiertas\n", "### 7.5 Cambios a documentos aprobados, por documento\n",
        "### 7.4 Preguntas abiertas\n\n**[R5]** Ninguna. CF-25, P6-26 y P6-27 se resolvieron en la revisión de la Parte E (0.16).\n\n")
rep("| `01-dominio.md` | CF-01 (§1.8, §5.8, supuesto 11), CF-17 (OP-16, precisión), CF-20 (§4.16 y OP-42, precisión) | CF-03 (§1.5, OP-28, §5.5) | — |",
    "| `01-dominio.md` | CF-01 (§1.8, §5.8, supuesto 11), CF-17 (OP-16, precisión), CF-20 (§4.16 y OP-42, precisión), **[R5]** CF-25 (OP-16, variante \"cubrir el sobregiro\") | CF-03 (§1.5, OP-28, §5.5) | — |")
rep("| `04-backend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-09, CF-15, CF-16, CF-17, CF-18, CF-19, CF-20, CF-21, CF-22, CF-24 | CF-03 | CF-25 |",
    "| `04-backend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-09, CF-15, CF-16, CF-17, CF-18, CF-19, CF-20, CF-21, CF-22, CF-24, **[R5]** CF-25 | CF-03 | — |")
rep("| `05-frontend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-08, CF-10, CF-11, CF-12, CF-13, CF-15, CF-17, CF-18, CF-19, CF-21, CF-22, CF-23 | CF-03 | P6-26 b) y P6-27 b) o c), si se eligen |",
    "| `05-frontend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-08, CF-10, CF-11, CF-12, CF-13, CF-15, CF-17, CF-18, CF-19, CF-21, CF-22, CF-23, **[R5]** CF-25 | CF-03 | — |")
rep("Estado al cerrar la Fase 6: **aplicado** = está en el documento con la marca **[F6]** y su línea en \"Enmiendas posteriores\"; **diferido** = diseñado y no aplicado; **pendiente** = espera aprobación.",
    "Estado al cerrar la Fase 6: **aplicado** = está en el documento con la marca **[F6]** y su línea en \"Enmiendas posteriores\"; **diferido** = diseñado y no aplicado. **[R5]** No queda ningún cambio pendiente; P6-26 y P6-27 son ajustes del diseño (5.6) y no cambian ningún documento.")
open(p, 'w').write(s)
print('ok')
