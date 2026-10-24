# Enmiendas de la Fase 6 a 04-backend.md. Detalle normativo en 06-features.md (sección indicada).
d04 = Doc('04-backend.md')
F6 = '**[F6]**'

# Encabezado
d04.despues(
    "la lista está en 0.9 y en \"Enmiendas posteriores\", al final.\n",
    "\n**Enmiendas de la Fase 6** **[F6]**: los cambios CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22 y CF-24 de "
    "`06-features.md` (§0.7 de ese documento), aprobados en sus revisiones, se aplicaron a este documento al cerrar la "
    "Fase 6 (21 de octubre de 2026). Cada sección afectada lleva la marca **[F6]** con el número del cambio; la lista está "
    "en 0.9.2 y en \"Enmiendas posteriores\". CF-03 (unir deudores) queda diseñado y **diferido** (06 §3.4); CF-25 está "
    "pendiente de aprobación y no se aplica.\n")

# 0.9.2
d04.antes("### 0.10 Registro de cambios de las revisiones\n", """#### 0.9.2 Enmiendas de la Fase 6 a este documento **[F6]**

Aprobadas en la Fase 6 (`06-features.md`) y aplicadas aquí al cerrarla. El texto normativo completo está en la sección de 06 que se cita; aquí queda lo que cambia en cada sección. Las migraciones que piden CF-01, CF-16 y CF-20 están anotadas en las "Enmiendas posteriores" de 03.

| CF | Qué cambia | Secciones de este documento | Detalle en 06 |
|---|---|---|---|
| CF-01 | OP-53 Verificar saldo (conciliación sin CSV), `conciliaciones.modo`, rechazo `transaccion_fuera_de_verificacion`, variante `formulario({ operacion: 'verificar_saldo' })` y ajuste propuesto por AV-21 según la cuenta y el signo | 3.0.6, 3.0.8, 3.8 (OP-47 y OP-53), 6.6, 6.14.1, 6.14.4 | 3.2 |
| CF-02 | Reporte `flujo_efectivo` | 6.9, 6.9.7 | 3.3 |
| CF-04 | Reportes accionables (`ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos`), `HallazgoDto` y sus selectores | 6.0.3, 6.0.5, 6.9, 6.9.7, 7.10 | 3.5 |
| CF-05 | `Propuesta` extendida: aviso `hallazgo` y `AV-21`, operaciones OP-15, OP-18, OP-20, OP-21, OP-27 y OP-42, campo `ejecucion` | 3.0.3, 6.0.3 | 3.6 |
| CF-06 | `InicioDto.atencion`: `hallazgosRitmo` y `pagosTarjetaProximos` | 6.1 | 3.7 |
| CF-07 | Motivo `pago_tarjeta_proximo`: tarea diaria, política, contenido, destino `cuenta` y etiqueta `tarjetas` | 10.2, 11.2, 11.4 | 3.8 |
| CF-09 | `datos_base` queda sin ruta, como insumo de pruebas | 6.9.4 | 3.10 |
| CF-15 | Signo menos U+2212 en los textos del servidor que se muestran; exportaciones sin cambio | 7.10, 11.4 | 3.12 |
| CF-16 | `notificaciones.aviso` nulo para los motivos sin aviso; constante `MOTIVOS`; prueba de catálogo contra el esquema en CI; catálogo de eventos como constante | 11.1, 11.2, 14.1, 15.2 | 3.13 |
| CF-17 | Definición de "c existía en q" (selector `existiaEn`); historial del detalle; `rapida.promedioGasto` con los períodos usados | 6.0.5, 6.3, 6.9.3, 6.14.4 | 3.14 |
| CF-18 | `InicioDto.primerosPasos` | 6.1 | 3.15 |
| CF-19 | Variante en lote de OP-07 para la plantilla de categorías | 2.2.4, 3.0.8, OP-07 | 3.9.1 |
| CF-20 | `programadas.reactivada_desde`: ocurrencias desde la reactivación | OP-42, 6.12.1, 8.4 | 0.12 y 0.13 (P6-20) |
| CF-21 | Variante de OP-37 `{ categoriaId }` para aprobar arrastrando; rechazo `arrastre_no_permitido` | 3.0.6, OP-37 | 0.13 |
| CF-22 | `bandeja()`: `destinosArrastre` y `aprobacion.arrastrable` | 6.8 | 0.13 |
| CF-24 | Motivo `cuota_proxima` | 10.1, 10.2, 11.2, 11.4 | 3.16 |
| FD-31 | Regla única de qué monto puede llevar un push (precisión de 11.4; la aplican CF-07 y CF-24) | 11.4 | 0.15 |

""")
d04.despues("| **[F5]** Enmiendas CP-1 a CP-18 de la Fase 5 y precisión PF-3; sección \"Enmiendas posteriores\" | Cierre de la Fase 5 (`05-frontend.md`) | 0.9.1 y las secciones de su tabla |\n",
            "| **[F6]** Enmiendas CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22 y CF-24 de la Fase 6 y precisión FD-31; línea en \"Enmiendas posteriores\" | Cierre de la Fase 6 (`06-features.md`) | 0.9.2 y las secciones de su tabla |\n")

# 2.2.4 (CF-19)
d04.despues("#### 2.2.4 Límite del cuerpo de las Server Actions (BE-06)\n",
            f"\n{F6} **CF-19.** La variante en lote de OP-07 lleva de 1 a 15 elementos por llamada; con nombres de hasta 80 caracteres ocupa menos de 4 KB, dentro de este límite.\n")

# 3.0.3 Propuesta (CF-05)
d04.despues("La interfaz ejecuta la propuesta tal cual (un toque) o abre el flujo correspondiente con la entrada como valores iniciales.\n",
"""
**[F6] `Propuesta` extendida (CF-05; 06 §3.6).** La unión se amplía y agrega cómo se ejecuta:

```ts
interface Propuesta {
  aviso: 'AV-08' | 'AV-14' | 'AV-21' | 'AV-22' | 'regla_comercio' | 'hallazgo';
  texto: string;
  operacion: 'OP-11' | 'OP-14' | 'OP-15' | 'OP-18' | 'OP-20' | 'OP-21' | 'OP-27' | 'OP-41' | 'OP-42';
  ejecucion: 'un_toque' | 'abrir_flujo';
  entrada: Record<string, unknown>;   // un_toque: entrada completa, validada por su contrato;
                                      // abrir_flujo: valores iniciales del flujo
}
```

| Propuesta | Operación | Ejecución | Entrada que arma el servidor |
|---|---|---|---|
| Hallazgo de ritmo: mover | OP-15 | Un toque | `origenId`, `destinoId`, `periodoInicio` = A, `monto` = exceso, `esperado` de las dos asignaciones |
| Hallazgo: asignar o reservar | OP-14 | Un toque | `montoNuevo` = Asig + monto, `esperado.monto` = Asig |
| Hallazgo de realidad: ajustar asignación | OP-14 | Un toque | `montoNuevo` = sugerido |
| Hallazgo de realidad: ajustar meta | OP-18 (editar) | Un toque | `metaId`, `monto` = sugerido, `esperado.monto` |
| Hallazgo de suscripción | OP-42 (crear) | Un toque o abrir flujo (06 §3.5.9) | La programada completa |
| Hallazgo de suscripción con programada desactivada | OP-42 (`activa`) | Un toque | `{ programadaId, activa: true }` |
| AV-21: ajuste de conciliación | OP-20, OP-21 u OP-27 (`entrada`), según la cuenta y el signo de la diferencia (tabla de OP-47) | Abrir flujo | Cuenta, fecha del estado, total y comercio "Ajuste de conciliación" |
| AV-08, AV-14, AV-22, regla de comercio | Sin cambios | Un toque | Sin cambios |

La interfaz nunca calcula ni modifica la entrada de una propuesta de un toque (PF-3).
""")

# 3.0.6 rechazos (CF-01, CF-21)
d04.despues("| `transaccion_ya_conciliada` | Marcar una transacción que ya está conciliada | \"Esa transacción ya está conciliada.\" | §7.2 |\n",
            "| `transaccion_fuera_de_verificacion` **[F6]** | OP-53: una transacción marcada tiene fecha posterior a la fecha verificada | \"Esa transacción es posterior a la fecha que verificaste.\" | CF-01 |\n")
d04.antes("| `movimiento_estado_no_valido` |",
          "| `arrastre_no_permitido` **[F6]** | Variante `{ categoriaId }` de OP-37 sobre un movimiento que no es un gasto pendiente con a lo sumo una línea hacia una categoría o sin destino | \"Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo.\" | CF-21 |\n")

# 3.0.8 índice (CF-01, CF-19)
d04.cambiar("| OP-07 | Crear grupo o categoría | presupuesto | Creación | — |\n",
            "| OP-07 | Crear grupo o categoría (**[F6]** y su variante en lote, CF-19) | presupuesto | Creación (por elemento) | — |\n")
d04.despues("| **OP-52** **[R2]** | Renombrar deudor (QB-2) | eventos | Valor absoluto | — |\n",
            "| **OP-53** **[F6]** | Verificar saldo (CF-01) | conciliacion | Creación (`conciliaciones.id`) | **Siempre** (previsualizar primero; AV-21 después) |\n")

# OP-07 (CF-19)
d04.despues("`categorias` (`clase = 'normal'`, `orden` = máximo del grupo + 1).\n- **Errores:** `nombre_repetido`, `grupo_archivado`, `grupo_del_sistema`.\n",
"""- **[F6] Variante en lote (CF-19; 06 §3.9.1).** Para la plantilla de grupos y categorías, sin operación de dominio nueva.
  - **Entrada:** `{ elementos: { id: Uuid; tipo: 'grupo' | 'categoria'; nombre: TextoLimpio; grupoId?: Uuid }[] }`, de 1 a 15 por llamada. El `grupoId` de una categoría es el de un grupo existente o el id de creación de un grupo de la misma plantilla, ya creado en esta llamada o en una anterior.
  - **Ejecución:** un `escribir()` por elemento, en orden y en serie, cada uno con su transacción, como OP-38 (4.8). No es atómica en conjunto: un elemento que falla no detiene los demás; si falla un grupo, sus categorías de esa llamada responden con el mismo motivo y no se intentan.
  - **Salida:** por elemento y en el orden de la entrada, `{ id, resultado: 'creado' | 'ya_aplicada' | ErrorFinn }`. Reenviar un elemento ya creado responde `ya_aplicada` (4.6.1), lo que permite reanudar con los ids guardados en el borrador.
  - **Revalidación:** una vez por llamada.
""")

# OP-37 (CF-21)
d04.despues("  Es un cambio de la salida, no de la entrada (sin `esperado`). Vale también para OP-50, que es la misma operación.\n",
"""- **[F6] Variante "aprobar con categoría" (CF-21; FT-78).** Para soltar un movimiento sobre una categoría en la Bandeja, en una sola operación:
  ```ts
  { movimientoId: Uuid; id: Uuid; categoriaId: Uuid;
    esperado: MovimientoDto['esperado'];          // las líneas que vio la lista (valor absoluto, como OP-36)
    revisionVista?: Revision; huellaImpacto?: string }
  ```
  - **Precondiciones propias** (`arrastre_no_permitido`): estado `pendiente`; `tipo_propuesto = 'gasto'`; como máximo una línea, que va a una categoría o no tiene destino (no por cobrar ni vinculada a una línea original).
  - **Precondiciones de siempre:** categoría normal y activa (`categoria_archivada`, `categoria_de_pago_no_permitida`); después, las de OP-37. Las líneas actuales iguales a `esperado` (si no, `conflicto_desactualizado`).
  - **Hechos**, en un solo `escribir()`: F2 + F3 `movimiento_lineas` (una línea por el monto del movimiento hacia `categoriaId`; orden nuevo según BE-16) y, a continuación, los de OP-37 (PT con OP-20 + PM). Si algo falla, no queda ni el cambio de líneas (01 §5.0.1).
  - **Confirmación, idempotencia y salida:** las de OP-37 (con `aprobado`, CP-15). Con `REQUIERE_CONFIRMACION` no escribe nada, tampoco las líneas. `recordarRegla` no forma parte de la variante.
""")

# OP-42 (CF-20)
d04.despues("- **Hechos:** F3/F4 `programadas`; F2 + F3 `programada_lineas` (orden nuevo, BE-16). Monto, líneas y tolerancia solo afectan las ocurrencias futuras (P3-6).\n",
            "- **[F6] Reactivar (CF-20).** `{ programadaId, activa: true }` sobre una programada inactiva fija además `reactivada_desde` = hoy (F4 `programadas`); desactivar no la toca. Desde entonces, las ocurrencias pendientes son las de fecha ≥ `primera_fecha` y ≥ `reactivada_desde` (incluida la de hoy): las del tramo inactivo no se generan, no se registran solas, no se emparejan ni se notifican. Las resoluciones anteriores siguen siendo hechos.\n")

# OP-47 ajuste (CF-01, FD-06) y OP-53
d04.cambiar("- **Avisos:** después y estado: AV-21 si la diferencia ≠ 0, con la sugerencia de una transacción de ajuste (que el usuario crea con OP-20 u OP-21).\n\n### 3.9 Préstamos\n",
"""- **Avisos:** después y estado: AV-21 si la diferencia ≠ 0, con la sugerencia de una transacción de ajuste (que el usuario crea con OP-20 u OP-21).
- **[F6] Ajuste propuesto por AV-21 (CF-01, FD-06; 06 §3.2.5).** Con d = saldo según el estado − saldo de Finn, la propuesta (`ejecucion: 'abrir_flujo'`, 3.0.3) es: efectivo con d > 0 → OP-21 por d; efectivo con d < 0 → OP-20 por |d| con la categoría que elige el usuario; tarjeta con d > 0 (el banco muestra menos deuda) → OP-27b entrada a la tarjeta por d; tarjeta con d < 0 → OP-20 con la tarjeta por |d|. Comercio "Ajuste de conciliación". Vale igual para OP-53. `conciliaciones.modo` queda en `estado_cuenta` (valor por defecto).

#### OP-53 Verificar saldo **[F6]** (CF-01; 06 §3.2.2)

Conciliación sin CSV: el usuario escribe la fecha y el saldo que muestra su banco.

- **Entrada:** `id` (de la conciliación); `cuentaId`; `fechaEstado: FechaLocal`; `saldoEstado: MontoTextoConSigno` (en una tarjeta, positivo = deuda, como en OP-01; el dominio lo convierte a la convención de 01 §0.4); `marcar: { todas: true } | { ids: Uuid[] }`; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** creación (`conciliaciones.id`).
- **Confirmación:** siempre; previsualizar primero (05 FE-07). La previsualización devuelve `saldoFinn` = saldo(cuenta, fechaEstado), `diferencia` = saldoEstado − saldoFinn (convención de ESC-47) y la cantidad de transacciones que marcaría.
- **Precondiciones:** cuenta de efectivo o tarjeta (`cuenta_tipo_no_valido`), abierta (`cuenta_archivada`); `fechaEstado ≤ hoy` (`fecha_posterior_a_hoy`) y ≥ apertura (`fecha_anterior_a_apertura`); cada transacción marcada tiene un efecto en la cuenta, fecha ≤ `fechaEstado` (`transaccion_fuera_de_verificacion`) y no está conciliada (`transaccion_ya_conciliada`). Con `{ todas: true }` se marcan las transacciones de la cuenta con fecha ≤ `fechaEstado` en estado pendiente o confirmada.
- **Hechos:** F3 `conciliaciones` (`cuenta_id`, `fecha_estado`, `saldo_estado`, `terminada_en` = instante, `diferencia_aceptada` = saldoEstado − saldo(cuenta, fechaEstado), `modo = 'saldo'`); F4 `transacciones` marcadas: `estado_bancario = 'conciliada'`, `conciliacion_id` (orden F3 → F4, como OP-47).
- **Avisos:** después y estado: AV-21 si la diferencia ≠ 0, con la propuesta de ajuste de OP-47.
- Los cambios posteriores (3.0.4) y la diferencia actual (DM-8) funcionan igual que en una conciliación con CSV.

### 3.9 Préstamos
""")

# 6.0.3 (CF-04, CF-05)
d04.despues("| Porcentaje | `number` entero en **puntos básicos** (1 % = 100) | Lo calcula el selector, con redondeo mitad hacia arriba; la interfaz no divide montos (ADR-07) |\n",
            "| `HallazgoDto` **[F6]** | `{ tipo; clave; texto; impacto: Centavos; estado: 'advertencia' \\| 'problema' \\| 'deuda-sin-respaldo' \\| 'informacion'; categoria?; tarjeta?; comercio?; accion: { propuesta: Propuesta } \\| { enlace: DestinoHallazgo; texto } }` | CF-04 (06 §3.5.2). `estado` usa los identificadores de estado de 05 §10.3; `Propuesta` extendida por CF-05 (3.0.3) |\n")

# 6.0.5 (CF-04, CF-17)
d04.despues("| **[R3]** `reportes.topComercios(reglas, …)` | 6.9.6 | BE-43 |\n",
            "| **[F6]** `reportes.ritmo`, `.realidad`, `.hormiga(reglas, …)`, `.suscripciones(reglas, …)`, `.tarjetas`, `.hallazgos`, `.flujoEfectivo` | 6.9.7 | 06 §3.3 y §3.5 (CF-02, CF-04); umbrales en un solo módulo del dominio (FD-18) |\n"
            "| **[F6]** `existiaEn(c, q)` | Si c existía en q: Asig ≠ 0, un consumo, una entrada o un evento con fecha en q | 06 §3.14 (CF-17). Lo usan OP-16, 6.3, 6.9.3 y los reportes de comparación |\n")

# 6.1 (CF-06, CF-18)
d04.cambiar("    archivadasConDisponible: { categoria: Ref; disponible: Centavos; accion: Propuesta }[]; // AV-14\n  };\n",
            "    archivadasConDisponible: { categoria: Ref; disponible: Centavos; accion: Propuesta }[]; // AV-14\n"
            "    hallazgosRitmo: HallazgoDto[];                  // [F6] CF-06: los RITMO_INICIO_MAX de mayor impacto (06 §3.5.4); sin push\n"
            "    pagosTarjetaProximos: { tarjeta: Ref; fechaPago: FechaLocal; paraNoGenerarIntereses: Centavos }[];  // [F6] CF-06/CF-07: fp − hoy ≤ 3 y monto > 0\n"
            "  };\n"
            "  primerosPasos: { cuenta: boolean; categorias: boolean; sms: boolean } | null;  // [F6] CF-18: null cuando los tres son true (06 §3.15)\n")
d04.despues("- `cambiosRetroactivos` lee `notificaciones` ([T]) con `aviso = 'AV-01'` y `leida_en` nulo.\n",
            "- **[F6]** `hallazgosRitmo` usa el mismo selector que el reporte `ritmo` (error 11). `primerosPasos` se calcula con las cuentas y categorías que la consulta ya lee más `token_webhook` ([T], una fila): un paso está hecho porque el hecho existe; no cuenta para \"Todo al día\" (CF-18).\n")

# 6.3 (CF-17)
d04.cambiar("  historial: { periodo: PeriodoDto; asignado; gastado; disponible: Centavos }[];  // 6 períodos anteriores\n",
            "  historial: { periodo: PeriodoDto; asignado; gastado; disponible: Centavos }[];  // [F6] CF-17: los 6 períodos cerrados anteriores en que existía c; si hay menos, los que haya\n")

# 6.6 (CF-01)
d04.cambiar("    diferenciaAceptada: Centavos; diferenciaActual: Centavos;    // DM-8; AV-21 si ≠ 0\n",
            "    diferenciaAceptada: Centavos; diferenciaActual: Centavos;    // DM-8; AV-21 si ≠ 0\n"
            "    modo: 'estado_cuenta' | 'saldo';                             // [F6] CF-01: OP-47 o OP-53\n")

# 6.8 (CF-22)
d04.cambiar("  elegiblesAprobarTodos: Uuid[];         // los que OP-38 intentaría\n}\n",
            "  elegiblesAprobarTodos: Uuid[];         // los que OP-38 intentaría\n"
            "  destinosArrastre: {                    // [F6] CF-22 (FT-78)\n"
            "    frecuentes: Ref[];                   // hasta ARRASTRE_FRECUENTES_MAX (6)\n"
            "    grupos: { grupo: Ref; categorias: Ref[] }[];   // todas las normales activas, por orden; sin \"Pagos de tarjeta\"\n"
            "  };\n}\n")
d04.cambiar("                elegibleAprobarTodos: boolean; motivoNoElegible?: string };\n",
            "                elegibleAprobarTodos: boolean; motivoNoElegible?: string;\n"
            "                arrastrable: boolean };              // [F6] CF-22: precondiciones propias de la variante de OP-37 (CF-21)\n")
d04.despues("- `errorDetalle` es el detalle saneado (7.8).\n",
            "- **[F6] Frecuentes (CF-22).** Las categorías normales y activas con más líneas en transacciones de tipo gasto con fecha en los últimos `ARRASTRE_FRECUENTES_DIAS` (90) días, hoy incluido; desempate por la línea más reciente y después por el orden del presupuesto. Sin historial, las primeras por orden de grupo y categoría. Se calculan sobre la instantánea, sin lecturas nuevas.\n")

# 6.9 (CF-02, CF-04)
d04.despues("#### 6.9.1 Definiciones comunes (BE-40) [Propio]\n",
            f"\n{F6} Los tipos `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos` (CF-04) y `flujo_efectivo` (CF-02) están en 6.9.7.\n")
d04.antes("#### 6.9.4 Datos base para los reportes de §16 (fórmulas en la Fase 6)\n", """#### 6.9.7 Reportes accionables y flujo de efectivo **[F6]** (CF-02, CF-04)

Cada fórmula es un selector puro de `seleccionar.reportes` sobre la instantánea (BE-40); la consulta no calcula (inv. 27). Las fórmulas, umbrales, textos y DTO de cada tipo están en `06-features.md` §3.3 y §3.5; los umbrales viven en un solo módulo del dominio (FD-18) y el reparto proporcional es por resto mayor (FD-19). Todo DTO de estos tipos extiende `Encabezado`, trae `filtros` (CP-12) y una lista `hallazgos: HallazgoDto[]` (6.0.3), ordenada por impacto.

| `tipo` | Ruta (05 §2.10) | Ventana | Detalle en 06 |
|---|---|---|---|
| `ritmo` | `/reportes/ritmo` | Período activo | §3.5.4 y §3.5.5 (ritmo y proyección del cierre) |
| `realidad` | `/reportes/realidad` | Período activo frente a los 3 cerrados anteriores en que existía cada categoría | §3.5.6 y §3.5.7 |
| `hormiga` | `/reportes/hormiga` | `?periodo=` (por defecto, el activo) | §3.5.8 |
| `suscripciones` | `/reportes/suscripciones` | Los 4 últimos períodos cerrados | §3.5.9 |
| `tarjetas` | `/reportes/tarjetas` | `ventana` (por defecto `ultimos_6`) | §3.5.10 |
| `hallazgos` | `/reportes/hallazgos` | Período activo | §3.5.11 |
| `flujo_efectivo` | `/reportes/flujo-efectivo` | `ventana` | §3.3 (`FlujoEfectivoDto`; identidad saldo inicial + Σ filas = saldo final) |

""")

# 6.9.3 (CF-17)
d04.cambiar("- **Comparación con semanas anteriores:** el gasto de la misma semana k en los 3 períodos cerrados anteriores en que existía la categoría.\n",
            "- **Comparación con semanas anteriores:** el gasto de la misma semana k en los 3 períodos cerrados anteriores en que existía la categoría. **[F6]** \"Existía\" es el selector `existiaEn` (6.0.5, CF-17); sin ninguno, la categoría es nueva y no hay comparación.\n")

# 6.9.4 (CF-09)
d04.despues("#### 6.9.4 Datos base para los reportes de §16 (fórmulas en la Fase 6)\n",
            f"\n{F6} **CF-09.** Las fórmulas de §16 quedaron definidas en `06-features.md` §3.5 como selectores propios (6.9.7) y no usan `datos_base`. Este tipo sigue sin ruta en la interfaz, como **insumo de pruebas**: la Fase 7 lo usa para comprobar que esos selectores coinciden con los datos base donde se superponen. Donde el párrafo siguiente dice que \"la Fase 6 define los cálculos\", rige esta nota.\n")

# 6.12.1 (CF-20)
d04.despues("`calendarioEditable` y `puedeEliminar` leen `movimientos` y `sms_procesamientos` (referencias a la programada).\n",
            f"\n{F6} **CF-20.** `proximas` y `atrasadas` (y `proximosPagos`) solo incluyen ocurrencias con fecha ≥ `reactivada_desde` cuando la columna no es nula.\n")

# 6.14.1 (CF-01)
d04.cambiar("  | { operacion: 'conciliar'; cuentaId: Uuid };                     // [F5] CP-16: OP-45, OP-46, OP-47\n",
            "  | { operacion: 'conciliar'; cuentaId: Uuid }                      // [F5] CP-16: OP-45, OP-46, OP-47\n"
            "  | { operacion: 'verificar_saldo'; cuentaId: Uuid; fecha?: FechaLocal };  // [F6] CF-01: OP-53\n")

# 6.14.4 (CF-01, CF-17)
d04.cambiar("| `asignar` | `{ categoria: Ref; periodo; asignado; disponible; asignadoEsperado; meta?: { pedido; falta }; rapida: { faltaMeta?; igualPeriodoAnterior; promedioGasto? } }`",
            "| `asignar` | `{ categoria: Ref; periodo; asignado; disponible; asignadoEsperado; meta?: { pedido; falta }; rapida: { faltaMeta?; igualPeriodoAnterior; promedioGasto?: { monto: Centavos; periodos: 1 \\| 2 \\| 3 } } }` (**[F6]** CF-17: promedio de los últimos 3 períodos cerrados en que existía c, o de los que haya; sin ninguno, no viene)")
d04.antes("#### 6.14.4.1 Enmiendas de la Fase 5 a `formulario` **[F5]**\n",
"""**[F6] `verificar_saldo` (CF-01).** Contexto:

```ts
{
  cuenta: Ref & { tipo: 'efectivo' | 'tarjeta' };
  fecha: FechaLocal;                                    // la pedida o hoy
  candidatas: { cantidad: number; recientes: TransaccionFila[] };   // pendientes o confirmadas con fecha ≤ fecha; hasta 200 más recientes
  ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; modo: 'estado_cuenta' | 'saldo'; diferenciaActual: Centavos };
}
```

""")

# 7.10 (CF-15, CF-04)
d04.cambiar("| **Montos** | Símbolo `$` delante, coma de miles y punto decimal, siempre dos decimales; negativo con el signo antes del símbolo | `$1,234.50`, `$0.75`, `-$45.00` |\n",
            "| **Montos** | Símbolo `$` delante, coma de miles y punto decimal, siempre dos decimales; negativo con el signo antes del símbolo. **[F6] CF-15:** en todo texto que se muestra (errores, rechazos, avisos, propuestas, hallazgos, títulos y cuerpos de push) el signo es el menos U+2212; las exportaciones (OPT-08, §16) y los contratos de entrada siguen con el guion ASCII | `$1,234.50`, `$0.75`, `−$45.00` (export: `-45.00`) |\n")
d04.antes("**Formato verificado (V-18).**",
          f"{F6} **CF-04.** Los textos de los hallazgos (06 §3.5.4 a §3.5.11) y de las propuestas de CF-05 son mensajes de este catálogo, con las mismas reglas.\n\n")

# 8.4 (CF-20)
d04.despues("### 8.4 Procesamiento (OP-35, pasos 2 a 11)\n",
            f"\n{F6} **CF-20.** El emparejamiento del paso c no propone ocurrencias del tramo inactivo de una programada reactivada (fecha < `reactivada_desde`).\n")

# 10.1 (CF-24)
d04.cambiar("| Sesión AAL2 (lectura, 12.3) | Pasos 1 y 2 de 10.2 (ADR-11) |",
            "| Sesión AAL2 (lectura, 12.3) | Pasos 1 y 2 de 10.2 (ADR-11) y **[F6]** el aviso `cuota_proxima` del paso 4 (CF-24) |")

# 10.2 (CF-07, CF-24)
d04.cambiar("| 4 | **Avisos de estado con push** | AV-17 (una vez por meta y fecha objetivo); respaldo con más de 36 h;",
            "| 4 | **Avisos de estado con push** | **[F6]** `pago_tarjeta_proximo` (CF-07: por tarjeta abierta, si su próxima fecha de pago fp cumple fp − hoy ≤ 3 y `paraNoGenerarIntereses` > 0; una vez por tarjeta y fp) y `cuota_proxima` (CF-24: por ocurrencia pendiente de una programada activa de tipo `cuota_prestamo` sin registro automático, con fecha ≥ `reactivada_desde` si existe y 0 ≤ fechaEsperada − hoy ≤ 3; una vez por programada y fecha); AV-17 (una vez por meta y fecha objetivo); respaldo con más de 36 h;")

# 11.1 (CF-16)
d04.despues("| Registro | Toda notificación se guarda en `notificaciones` **antes** de intentar el push (ADR-12: el registro es la fuente de verdad); después se actualiza `push_enviada_en` o `push_error` |\n",
            "| **[F6]** Catálogo de motivos (CF-16) | Constante exportada `MOTIVOS` de `@finn/aplicacion/push/motivos.ts`: un registro por motivo con su aviso (o `null`), push, urgencia, TTL y etiqueta. 11.2 se escribe desde ella y la prueba de catálogo de 14.1 la recorre. `MotivoNotificacion` es una unión cerrada |\n")

# 11.2 (CF-07, CF-16, CF-24)
d04.cambiar("| `meta_vencida` | AV-17 | Sí | `low` | 7 días | — | — |\n",
            "| `meta_vencida` | AV-17 | Sí | `low` | 7 días | — | — |\n"
            "| `pago_tarjeta_proximo` **[F6]** CF-07 | — | Sí | `normal` | Hasta la fecha de pago | `tarjetas` | — |\n"
            "| `cuota_proxima` **[F6]** CF-24 | — | Sí | `normal` | Hasta el final de la fecha esperada | `programadas` | — |\n")
d04.cambiar("- Sin horario de silencio (P4-11).\n",
            "- Sin horario de silencio (P4-11).\n"
            "- **[F6] CF-16.** Un motivo con \"—\" en la columna Aviso se registra con `notificaciones.aviso = null` (03, enmienda CF-16).\n")

# 11.4 (CF-07, CF-15, CF-24, FD-31)
d04.cambiar("- Mínimo (ADR-12): tipo de aviso, comercio y monto (`$1,234.50`, 7.10). Nunca el texto del SMS, saldos ni nombres de deudores.\n",
            "- Mínimo (ADR-12): tipo de aviso, comercio y monto (`$1,234.50`, 7.10). Nunca el texto del SMS, saldos ni nombres de deudores.\n"
            "- **[F6] Qué monto puede llevar (FD-31).** Puede ir el importe de un **movimiento** (una transacción, un SMS, una ocurrencia programada) o de un **cambio que ya ocurrió** (la reducción de Listo para asignar aplicada al cierre, del ejemplo de abajo). No puede ir una cifra del **estado vigente** de una cuenta, una tarjeta o el presupuesto: saldos, deuda, Disponible, Listo para asignar, \"te falta reservar\", monto para no generar intereses. Por eso `cierre_periodo` y `cuota_proxima` llevan monto y `pago_tarjeta_proximo` no.\n"
            "- **[F6] Textos nuevos.** `pago_tarjeta_proximo` (CF-07): \"{tarjeta}: tu fecha de pago es el {fp}. Revisá cuánto pagar para no generar intereses.\" `cuota_proxima` (CF-24): \"Cuota de {comercio} por {monto} el {fecha}. Registrala cuando la pagues.\" Los montos negativos llevan U+2212 (CF-15).\n")
d04.cambiar("  | { pantalla: 'diagnostico' };\n",
            "  | { pantalla: 'diagnostico' }\n"
            "  | { pantalla: 'cuenta'; cuentaId: Uuid };                // [F6] CF-07\n")
d04.cambiar("  etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema';   // CP-18: el tag de 11.2 y 11.3\n",
            "  etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema' | 'tarjetas';   // CP-18: el tag de 11.2 y 11.3; [F6] 'tarjetas' (CF-07)\n")
d04.cambiar("| `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado` | `programada` con `fechaEsperada` |\n",
            "| `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado`, **[F6]** `cuota_proxima` (CF-24) | `programada` con `fechaEsperada` |\n"
            "| **[F6]** `pago_tarjeta_proximo` (CF-07) | `cuenta` (la tarjeta) |\n")

# 14.1 (CF-16)
d04.despues("### 14.1 Entornos (P4-1)\n",
            f"\n{F6} **Prueba de catálogo (CF-16; 06 §3.13.2).** El job de integración de CI corre, contra la base con todas las migraciones aplicadas, una prueba generada desde los catálogos del código: una notificación por cada registro de `MOTIVOS` (con su aviso, título, cuerpo y un destino válido), los pares `origen`/`nivel` del catálogo de eventos (15.2) y los dos valores de `conciliaciones.modo`; inserta como `finn_app` en una transacción que se revierte y espera cero errores. Control negativo: un aviso mal formado y un origen inexistente se rechazan.\n")

# 15.2 (CF-16)
d04.despues("### 15.2 Catálogo de eventos\n",
            f"\n{F6} **CF-16.** El catálogo es una constante exportada de `@finn/aplicacion/observabilidad/eventos.ts`, de la que sale esta tabla y que recorre la prueba de catálogo (14.1).\n")

# Enmiendas posteriores
d04.s = d04.s.rstrip('\n') + "\n- **CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22 y CF-24** y la precisión **FD-31** (Fase 6, aprobados en las revisiones de `06-features.md`): verificar saldo (OP-53), flujo de efectivo, reportes accionables y hallazgos, `Propuesta` extendida, Inicio (hallazgos de ritmo, pagos de tarjeta próximos, primeros pasos), motivos `pago_tarjeta_proximo` y `cuota_proxima`, `datos_base` como insumo de pruebas, signo menos U+2212, `aviso` nulo y prueba de catálogo, \"categoría existía\", lote de OP-07, reactivación de programadas, aprobar arrastrando y sus datos en `bandeja()`. Tabla en 0.9.2; detalle en `06-features.md` §0.7, §0.13, §0.15 y §3. CF-03 queda diferido.\n"
d04.n += 1
