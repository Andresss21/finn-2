# Finn 2.0 — Especificación funcional por feature (06-features.md)

**Fase:** 6. **Estado:** **Aprobado — Fase 6 cerrada** (21 de octubre de 2026). Partes A a E aprobadas (ajustes **[A1]**, **[R1]** a **[R5]**, **[B1]**, **[E]**). CF-01 a CF-25 aplicados a 00, 01, 03, 04 y 05 con su línea en "Enmiendas posteriores" (marca **[F6]** en 04 y 05), salvo CF-03, diferido. P6-26 y P6-27 resueltas como ajustes del diseño (5.6). Las verificaciones van en `06-features-verificacion.zip`.

El orden del documento es el de la entrega: 0, 1, 3 y después 2 (las fichas dependen de las resoluciones), como en 04 y 05.

Los cambios hechos al incorporar las respuestas a P6-16, P6-17 y P6-18 están marcados **[A1]**; los ajustes de la revisión de la Parte A, **[R1]**.

Plan de entrega aprobado:

| Parte | Secciones |
|---|---|
| **A — Fundamentos y resoluciones** | 0, 1, 3 |
| B — Fichas I | 2.1 Instalación y primer uso, 2.2 Presupuesto, 2.3 Transacciones, 2.4 Tarjetas |
| C — Fichas II | 2.5 Bandeja de SMS, 2.6 Programadas, 2.7 Conciliación, 2.8 Por cobrar, 2.9 Cuentas y préstamos |
| D — Fichas III | 2.10 Reportes, 2.11 Notificaciones, 2.12 Ajustes y seguridad |
| E — Cierre | 4 Recorridos, 5 Coherencia con el diseño, 6 Trazabilidad (script), 7 Supuestos, riesgos y preguntas |

Las resoluciones (§3) van antes que las fichas porque las fichas dependen de ellas.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento traduce el diseño técnico aprobado (01 a 05) a funciones que el usuario reconoce. Para cada feature dice qué hace, cómo se vive de punta a punta y cuándo está terminada. Un agente de la Fase 8 debe poder tomar una feature y saber qué operaciones, consultas, rutas y componentes usa y con qué criterios se da por lista. La Fase 7 convierte sus criterios de aceptación en pruebas.

### 0.2 Alcance

- **Incluye:** catálogo de features, fichas, resolución de las preguntas F6-1 a F6-4 y P13, recorridos de punta a punta, coherencia con `06-identidad-visual.md`, trazabilidad y supuestos, riesgos y preguntas.
- **No incluye:** plan de pruebas (Fase 7) ni tareas (Fase 8).
- **No modifica** 00 a 05. Todo lo que una feature necesita y no existe se propone como **cambio (CF-nn)** con su impacto en cada documento. Los CF aprobados se aplican al cerrar la fase, como hicieron 04 y 05, salvo los marcados **diferidos**.

### 0.3 Precedencia

1. `00-decisiones.md` > `01-dominio.md` > `02-tecnologias.md` > `03-base-de-datos.md` > `04-backend.md` > `05-frontend.md`, cada uno con sus enmiendas posteriores; después, el documento de producto y `06-identidad-visual.md`.
2. Este documento manda sobre la implementación de cada feature en las fases 7 y 8.
3. Donde `06-identidad-visual.md` contradice a 05, manda 05 hasta que se apruebe el CF correspondiente (A.0 punto 4 del encargo).

### 0.4 Convenciones

| Marca | Significado |
|---|---|
| **FT-nn** | Feature (§1). Los identificadores son estables: una feature retirada conserva su número marcado como retirada (FD-01) |
| **FD-nn** | Decisión de esta fase (registro en 0.6) |
| **CF-nn** | Cambio propuesto a un documento aprobado (registro en 0.7) |
| **V6-nn** | Verificación ejecutada en esta fase (0.8) |
| **CA-nn.m** | Criterio de aceptación m de la feature FT-nn (2.0) |
| **P6-n** | Pregunta de esta fase (0.5, 0.9, 0.11, 0.13 y 0.15, resueltas) |
| **[A1]** | Cambio al incorporar las respuestas a P6-16, P6-17 y P6-18 |
| **[R1]** | Ajuste de la revisión de la Parte A (0.10) |
| **[B]** | Agregado con la Parte B |
| **[B1]** | Cambio al incorporar las respuestas a P6-19, P6-21 y P6-22 (0.11) |
| **[R2]** | Corrección de la revisión de la Parte B (0.12) |
| **[C]** | Agregado con la Parte C |
| **[R3]** | Cambio de la revisión de la Parte C (0.13) |
| **[D]** | Agregado con la Parte D |
| **[R4]** | Cambio de la revisión de la Parte D (0.15) |
| **[E]** | Agregado con la Parte E |
| **[R5]** | Cambio de la revisión de la Parte E |
| **R-n** | Punto a reconciliar de `06-identidad-visual.md` |
| **[I] [M] [P]** | Prioridad: imprescindible, importante, posterior (FD-02) |
| **[Propio]** | Regla sin equivalente en YNAB, definida en esta fase |
| OP-nn, AV-nn, ESC-nn, inv. n, §n | Referencias a `01-dominio.md` (OP-49 en adelante y OPT-nn, a `04-backend.md`) |
| BE-nn, QB-n, CP-nn, SP-nn | Referencias a `04-backend.md` |
| FE-nn, PF-n, PB-n, N1–N8, L1–L19 | Referencias a `05-frontend.md` |
| DB-nn, HZ-n | Referencias a `03-base-de-datos.md` |

**Montos y textos.** **[A1]** Los montos negativos de los ejemplos y de los textos de pantalla llevan el signo menos U+2212 (`−$45.00`), como fija FD-25. Los textos de la interfaz van en voseo; los que aparecen aquí por primera vez se marcan **(nuevo)** y se agregan al catálogo que corresponde (04 §7.10 si los produce el servidor, 05 §12 si los produce la interfaz).

### 0.5 Respuestas del Paso 1

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P6-1 | `06-identidad-visual.md` está en el proyecto. Partes A a D sin él; la sección 5 va en la Parte E y lo usa como fuente. R-4 a R-7 se resuelven como preguntas; R-1, R-2, R-3 y R-8, como CF a 05 | 0.7 (CF-10 a CF-13), 0.9 (P6-16), §3.11 |
| P6-2 | La prioridad es un insumo para la Fase 8 (R10) | FD-02 |
| P6-3 | Features como capacidades; ficha abreviada para FT-05, FT-06, FT-75, FT-76 y FT-77 | FD-01, FD-03 |
| P6-4 | CF aprobado: motivo `pago_tarjeta_proximo`, 3 días antes del día de pago si `paraNoGenerarIntereses > 0`, una vez por tarjeta y ciclo, con su línea en `InicioDto.atencion` y el destino `{ pantalla: 'cuenta', cuentaId }` | FD-22, CF-07; P6-17 (hallazgo al redactar) |
| P6-5 | OP-53 "Verificar saldo" aprobada como se propuso; confirmar la columna `modo` | FD-05, FD-06, CF-01 |
| P6-6 | Reporte `flujo_efectivo` como CF, prioridad posterior | FD-07, CF-02 |
| P6-7 | Unir deudores: prioridad posterior y **CF diferido** (no se aplica al cerrar la Fase 6). En la primera versión, renombrar (OP-52) | FD-08, CF-03 |
| P6-8 | Fórmulas como selectores `seleccionar.reportes.*`; tipos y rutas nuevos como CF a 04 §6.9 y 05 §2.10 | FD-09, CF-04 |
| P6-9 | Fórmulas aprobadas, incluidas hormiga y suscripciones; cada hallazgo dice en voseo qué pasa y cuánto y ofrece su acción; verificación con prototipo | FD-10 a FD-17, V6-01 a V6-03 |
| P6-10 | Umbrales como constantes fijas en un solo módulo del dominio | FD-18 |
| P6-11 | `Propuesta` con aviso `hallazgo` y operaciones OP-15, OP-18 y OP-42, con la entrada calculada por el servidor | FD-20, CF-05 |
| P6-12 | Los 3 hallazgos de ritmo de más impacto en `InicioDto.atencion`, sin push | FD-21, CF-06 |
| P6-13 | **Sin migración desde Finn 1.0.** La 2.0 empieza desde cero con saldos iniciales. FT-07 se retira; P13 queda cerrada | FD-04, CF-14 |
| P6-14 | Plantilla opcional de grupos y categorías en FT-04, editable y aplicada con OP-07 por elemento | FD-23, CF-08 |
| P6-15 | `datos_base` queda sin ruta, como insumo de pruebas | FD-24, CF-09 |
| S6-1 a S6-7 | Aprobados | Todo el documento |
| P6-16 **[A1]** | Aprobada: U+2212 solo al mostrar montos (módulo de formato y mensajes del servidor que se muestran); texto accesible "menos $X"; exportaciones CSV y JSON con el guion. CF a 04 §7.10 y 05 §5.4 | FD-25, CF-15, 3.12 |
| P6-17 **[A1]** | Aprobada: `notificaciones.aviso` admite nulo, con migración de expansión. Prueba que inserte una notificación por cada motivo de 04 §11.2 (incluidos los nuevos) y revisión de las demás columnas de 03 frente a 04 | FD-26, CF-16, V6-04, 3.13 |
| P6-18 **[A1]** | Aprobada: una categoría existía en un período si tuvo Asig ≠ 0 o actividad (consumos, entradas o eventos) con fecha en él. Precisión de 01; se usa en todos los reportes que comparan con períodos anteriores | FD-27, CF-17, 3.14 |

### 0.6 Registro de decisiones

| ID | Decisión | Sección |
|---|---|---|
| FD-01 | Una feature es una capacidad que el usuario reconoce; los FT-nn son estables y FT-07 queda retirada | 1.1 |
| FD-02 | Criterio de prioridad (imprescindible, importante, posterior) como insumo de la Fase 8 | 1.1 |
| FD-03 | Ficha abreviada para FT-05, FT-06, FT-75, FT-76 y FT-77 | 1.1 |
| FD-04 | P13 cerrada: sin migración; arranque desde cero con saldos iniciales | 3.1 |
| FD-05 | OP-53 "Verificar saldo" (F6-1) y columna `conciliaciones.modo` | 3.2 |
| FD-06 | Ajuste propuesto por AV-21 según el tipo de cuenta y el signo de la diferencia | 3.2.5 |
| FD-07 | Reporte `flujo_efectivo` (F6-2) | 3.3 |
| FD-08 | OP-54 "Unir deudores" (F6-3), diseñada y diferida | 3.4 |
| FD-09 | Reportes accionables como selectores del dominio, con tipos y rutas propios | 3.5.1 |
| FD-10 | Ritmo de gasto | 3.5.4 |
| FD-11 | Proyección del cierre | 3.5.5 |
| FD-12 | Presupuesto contra la realidad | 3.5.6 |
| FD-13 | Comparación con el promedio | 3.5.7 |
| FD-14 | Gastos hormiga, por comercio y por categoría **[R1]** | 3.5.8 |
| FD-15 | Suscripciones detectadas; reactivar una programada desactivada en lugar de crear otra **[R1]** | 3.5.9 |
| FD-16 | Tarjetas en el tiempo; "pagado a tiempo" = "ya pagado" de 01 §4.14 **[R1]** | 3.5.10 |
| FD-17 | Hallazgos: forma, texto, orden y acción | 3.5.2, 3.5.11 |
| FD-18 | Umbrales en un módulo único del dominio | 3.5.3 |
| FD-19 | Reparto proporcional por resto mayor | 3.5.3 |
| FD-20 | `Propuesta` extendida (hallazgos y ajuste de AV-21) | 3.6 |
| FD-21 | Hallazgos de ritmo en Inicio | 3.7 |
| FD-22 | Recordatorio de pago de tarjeta (`pago_tarjeta_proximo`) | 3.8 |
| FD-23 | Plantilla de grupos y categorías, aplicada con OP-07 en lote, en tandas **[B1]** | 3.9 |
| FD-24 | `datos_base` como insumo de pruebas | 3.10 |
| FD-25 **[A1]** | Signo menos U+2212 en la presentación de montos | 3.12 |
| FD-26 **[A1]** | `notificaciones.aviso` admite nulo; prueba de catálogo contra el esquema en CI | 3.13 |
| FD-27 **[A1]** | Definición de "c existía en q" | 3.14 |
| FD-28 **[B1]** | "Primeros pasos" en Inicio, con "Ocultar por ahora" por dispositivo | 3.15 |
| FD-29 **[B1]** | Cantidad mínima de períodos según el uso: 1 en la asignación rápida, 3 en los reportes de patrón | 3.14 |
| FD-30 **[R3]** | Arrastre a una categoría: una sola operación, pulsación larga en el teléfono, panel de destinos, carga diferida y teclado | 0.13, FT-78 |
| FD-31 **[R4]** | Qué monto puede llevar un push: el de un movimiento o de un cambio ya ocurrido, nunca un saldo | 0.15, 3.8, 3.16 |
| FD-32 **[E]** | Revisión lateral de la Bandeja en computadora: resumen de solo lectura con las acciones de un toque; "Editar" abre el flujo largo | 5.7 |

### 0.7 Registro de cambios propuestos

"Al cerrar" = se aplica al documento afectado cuando se aprueba la Fase 6, con una línea en sus "Enmiendas posteriores". **Diferido** = queda diseñado y no se aplica.

| CF | Qué cambia | 00 | 01 | 03 | 04 | 05 | Cuándo |
|---|---|---|---|---|---|---|---|
| CF-01 | OP-53 Verificar saldo; `conciliaciones.modo`; ajuste de AV-21 | — | §1.8, §5.8, supuesto 11 | §3 (`conciliaciones`), §3.1 (enum) | §3.0.6, §3.0.8, §3.8, §6.6, §6.14 | §1.3, §2.7, FE-07, §15 | Al cerrar |
| CF-02 | Reporte `flujo_efectivo` | — | — | — | §6.9 | §1.3, §2.10 | Al cerrar |
| CF-03 | OP-54 Unir deudores | — | §1.5, OP-28, §5.5 | `g_linea_con_eventos`, `finn.operacion` | BE-14, §3.5, §4.4 | §1.3, §2.8 | **Diferido** |
| CF-04 | Reportes accionables: tipos `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos`; `HallazgoDto` | — | — | — | §6.0.5, §6.9 | §1.3, §2.10, §10.8 | Al cerrar |
| CF-05 | `Propuesta` extendida | — | — | — | §3.0.3, §6.0.3 | §4.13, §4.14 | Al cerrar |
| CF-06 | `InicioDto.atencion`: `hallazgosRitmo` y `pagosTarjetaProximos` | — | — | — | §6.1 | §2.3 | Al cerrar |
| CF-07 | Motivo `pago_tarjeta_proximo`, destino `cuenta`, etiqueta `tarjetas` | — | — | — (`motivo` es texto) | §10, §11.2, §11.4 | §3.5 | Al cerrar |
| CF-08 | Plantilla de grupos y categorías | — | — | — | — | §1.3, §2.3, §7.2, §12 | Al cerrar |
| CF-09 | `datos_base` sin ruta, insumo de pruebas | — | — | — | §6.9.4 | — | Al cerrar |
| CF-10 | R-1: tema por `data-theme="claro"\|"oscuro"` | — | — | — | — | §10.1, §10.6 | Al cerrar |
| CF-11 | R-2: variables sin prefijo `--finn-` | — | — | — | — | §10.1, §10.5 | Al cerrar |
| CF-12 | R-3: roles tipográficos como utilidades (`@utility`) generadas desde `tokens.json`; rol nuevo `rotulo` | — | — | — | — | §10.4 | Al cerrar |
| CF-13 | R-8: componentes visuales propios registrados en §10.8 (props en la Parte E, §5) | — | — | — | — | §10.8, §15.4 | Al cerrar |
| CF-14 | P13 cerrada: sin migración | §5.1 | — | §0.2 | — | — | Al cerrar |
| CF-15 **[A1]** | Signo menos U+2212 al mostrar montos | — | — | — | §7.10, §11.4 | §5.2, §5.4, §10.8 (`Monto`), V5-02 | Al cerrar |
| CF-16 **[A1]** | `notificaciones.aviso` admite nulo; mapa motivo → aviso en el código; prueba de catálogo en CI | — | — | §3.28, §10 (migración nueva) | §11.1, §11.2, §14.1, §15.2 | — | Al cerrar |
| CF-17 **[A1]** | Definición de "c existía en q". **[B1]** Precisión de OP-16: el promedio usa los períodos que haya, de 1 a 3, y con 0 no se ofrece (FD-29) | — | OP-16 (precisión) | — | §6.3 (historial), §6.9.3, §6.14.4 (`rapida.promedioGasto` con `periodos`) | §2.10 ("categoría nueva") | Al cerrar |
| CF-18 **[B1]** | "Primeros pasos" en Inicio (FD-28) | — | — | — | §6.1 (`InicioDto.primerosPasos`) | §2.3, §7.2, §2.11 (`/ajustes`: "Mostrar en Inicio") | Al cerrar |
| CF-19 **[B1]** | Variante en lote de OP-07 para la plantilla (FD-23) | — | — | — | §3.2 (OP-07, entrada `{ elementos }`), §3.0.8 (índice), §2.2.4 (tamaño del cuerpo) | §1.3 y §2.3 (ruta de CF-08), §4.11 (borrador con los ids), §11.3 (avance) | Al cerrar |
| CF-20 **[C]** | Ocurrencias desde la reactivación de una programada: columna `programadas.reactivada_desde` **[R3]** (P6-20 aprobada) | — | §4.16 y OP-42 (precisión) | §3.23 (columna nueva, migración de expansión) | OP-42 (hechos), §6.12.1 (`proximas`, `atrasadas`) y el selector de emparejamiento (§8.4 c) | — | Al cerrar |
| CF-21 **[R3]** | Variante de OP-37 `{ categoriaId }` para aprobar arrastrando (FT-78, FD-30); rechazo nuevo `arrastre_no_permitido` | — | — | — | §3.6 (OP-37), §3.0.6 (catálogo de rechazos), §7.10 (mensaje) | §4.15 (traspaso con la categoría), §1.3 y §2.5 (fila de `/bandeja`) | Al cerrar |
| CF-22 **[R3]** | `bandeja()`: `destinosArrastre` y `aprobacion.arrastrable` (FT-78) | — | — | — | §6.8 | §2.5, §10.8 (panel de destinos), §13 (carga diferida) | Al cerrar |
| CF-23 **[D]** | `/notificaciones` interceptada en `@superpuesto` desde la campana (R-5; **[R4]** P6-24 aprobada) | — | — | — | — | §1.3, §1.4, §10.7 (`Superpuesto` desde arriba) | Al cerrar |
| CF-24 **[R4]** | Motivo `cuota_proxima` (P6-25 b), 3.16 | — | — | — (`motivo` es texto) | §10.1 (puesta al día), §10.2 (paso 4), §11.2, §11.4 | — | Al cerrar |
| CF-25 **[E]** **[R5]** | Datos para los componentes visuales de R-8 (proporciones y diferencias calculadas en el servidor, con sus bordes) y variante "cubrir el sobregiro" de OP-16 | — | OP-16 (variante, precisión) | — | §6.2, §6.3, §6.5, §6.8, §6.9.3, §6.14.4 | §10.8.1 | Al cerrar (aprobado en 0.16) |

### 0.8 Verificación realizada

**Entorno.** Python 3 con `fractions` (aritmética exacta) y, para V6-04, PostgreSQL 16.15 local **[A1]**. Prototipo `reportes.py` y prueba `prueba_reportes.py`, que van en el zip de verificación de la fase. El prototipo **no** reimplementa el motor: recibe como entrada los derivados de 01 §4 (Disp, fondo, SobT, SobD, S, E), como haría el selector sobre la instantánea, y verifica solo las fórmulas de esta fase.

| # | Qué se verificó | Resultado |
|---|---|---|
| V6-01 | Fórmulas de 3.5 con los datos de A.7 (hoy 15/10/2026; período 21/09–20/10, 25 días transcurridos, 5 restantes) | Ritmo: Restaurantes −$55.56 y Gasolina −$38.50 proyectados al cierre; Supermercado $5.42 (sin hallazgo); Netflix $0.00 (la programada pendiente se descuenta y el gasto variable es 0); Luz y agua no se proyecta (un solo consumo). Proyección del cierre: 2 sobregiradas, reducción de LPA $50.44, te falta reservar Visa Oro $43.62, sobrante $1,546.64. Comparación de Restaurantes: $175.56 frente a un promedio de $111.95 (+56.82 %). Presupuesto contra la realidad: sin sugerencia para Restaurantes; con el ejemplo del producto §16 ($150 asignados y $180 gastados en promedio) sugiere $180.00. Detalle en 3.5.12 |
| V6-02 | 20.000 casos aleatorios de ritmo y proyección (períodos de 11, 28, 29, 30 y 31 días; 0 a 3 tarjetas; consumos emparejados con programadas; sobregiros con D2 simplificado), 5.000 de presupuesto contra la realidad, hallazgos y hormiga | Pasa: determinismo al barajar los consumos, exceso ≥ sobregiro actual, monotonía en los días restantes, partes del reparto sin negativos y con suma exacta, conservación del exceso entre débito y tarjeta, sugerencias en dólares enteros, "sobra" nunca con gasto cero, una sola fila por categoría y orden por impacto. **[R1]** Hormiga por comercio y por categoría: 12 compras en 12 cafeterías distintas dan un solo hallazgo, de categoría (Cafés y antojos, 12 compras, $64.08); con solapamiento queda el grupo de mayor total; dos categorías dan dos hallazgos; en los casos aleatorios ningún par de hallazgos comparte compras y el resultado no depende del orden. **Hallazgo:** la primera versión repartía con redondeo independiente por medio y en 28 casos de 20.000 la parte de débito quedaba en −$0.01; corregido con el reparto por resto mayor (FD-19) |
| V6-03 | Identidad del flujo de efectivo (3.3): saldo inicial + Σ filas = saldo final, con 5.000 conjuntos aleatorios de efectos en cuentas de efectivo de todos los tipos | Pasa: la tabla de filas cubre cada tipo con efecto en efectivo exactamente una vez y las transferencias neutrales se anulan |
| V6-04 **[A1]** | Catálogo de 04 frente a las restricciones de 03 (`v6_04_catalogo_notificaciones.sql`, PostgreSQL 16.15 local): las tablas `notificaciones` y `eventos_sistema` copiadas de 03; una inserción por cada motivo de 04 §11.2 más `pago_tarjeta_proximo` (17), y una por cada evento de 04 §15.2 (17) | **Antes de CF-16: 7 de 17 motivos fallan** con `23502` (`aviso` nulo): `cierre_periodo`, `respaldo_atrasado`, `restauracion_atrasada`, `deriva_catalogo`, `tarea_fallida`, `carga_incremental` y `pago_tarjeta_proximo`. Los 17 eventos pasan. **Después de CF-16: 34 de 34 pasan.** Control negativo: un aviso mal formado (`AV-1`) sigue rechazado con `23514`. **[R4] Repetida con `cuota_proxima` (18 motivos):** antes de CF-16 fallan 8 (los 7 anteriores y `cuota_proxima`); después, **35 de 35** pasan y el control negativo sigue rechazado |
| V6-05 **[R1]** | Tiempo de aplicar la plantilla (3.9) con una Server Action por elemento, cada una con `revalidatePath('/', 'layout')`, en una app de prueba con Next 16.4.1 y React 19.3.1 (`v6_05_plantilla/`). 47 elementos; cada escritura con una espera fija en el servidor (50, 150, 250 y 400 ms, este último el peor caso del presupuesto de escrituras de 04); perfil 4G de 05 §13.1 (RTT de 150 ms sumado a cada ida y vuelta, 1.6 Mbps de bajada, 750 kbps de subida, CPU ×4); 3 corridas por caso | **Una acción por elemento:** 11.5 s (50 ms), 16.1 s (150 ms), 20.8 s (250 ms) y **27.9 s (400 ms)**; cada acción tarda el tiempo del servidor más el RTT y unos 40 a 45 ms del navegador y Next. Revalidar solo al final ahorra menos de 0.5 s: el costo es la ida y vuelta, no la revalidación. **Pasa de 20 s** desde unos 250 ms por escritura (P6-19). **Un lote en una sola acción**, mismas escrituras en serie en el servidor: 2.5 s (50 ms), 7.2 s (150 ms) y 18.9 s (400 ms). Respuesta media de 8.6 KB por acción y 15.3 KB del lote. Nota de método: la latencia emulada por el protocolo de depuración del navegador es un mínimo que se solapa con el tiempo del servidor; por eso el RTT de 150 ms se sumó a la espera del servidor y la emulación de red solo limita el ancho de banda (`medir2.mjs`, `medir3.mjs`) |
| V6-06 **[B]** **[C]** **[D]** **[R4]** | Revisión mecánica de las fichas (`revisar_fichas.py`): fichas en el orden del catálogo; bloques de 2.0 presentes; criterios numerados sin saltos y al menos 3 por ficha; todo código de error citado existe en 04 §3.0.6, en 05 §9.7, en la política de patrones de 04 §8.5 o entre los nuevos de esta fase (`transaccion_fuera_de_verificacion`, `arrastre_no_permitido`); toda ruta citada existe en 05 §2 o la agrega un CF de esta fase; recuento de ESC y AV cubiertos | **Parte B:** 32 fichas y 199 criterios (207 con **[B1]**); 41 de 50 escenarios y 19 de 24 avisos. Control negativo: `linea_sin_destin0`, detectado. Corregidos antes de entregar: una ruta con `[id]` en lugar de `[categoriaId]` y las rutas concretas de `/registrar/[tipo]`, que el script no reconocía. **Parte C:** 58 fichas y 356 criterios; 49 escenarios y 23 avisos (faltaban ESC-45 y AV-12, de FT-72). Corregidos antes de entregar: una ruta con `[id]` en FT-35 y el rótulo de los criterios de FT-49 y FT-58. Con **[R3]** (FT-78): 59 fichas y 371 criterios. **Parte D:** 77 fichas (todas las vigentes) y 463 criterios; **50 de 50 escenarios y 24 de 24 avisos**. El script reconoce además las rutas de `/reportes/[tipo]` (05 §2.10, CF-04, CF-02) y los códigos de 04 §8.5. Control negativo: `patron_lent0`, detectado. Con **[R4]**: 77 fichas y 471 criterios. **Parte E:** el mismo recuento sobre el documento completo, con el corte de las fichas donde empieza la Parte E (V6-10) |
| V6-09 a V6-13 **[E]** **[R5]** | Trazabilidad, revisión final de fichas, prueba de reportes, revisión de las enmiendas aplicadas a 00 a 05, y recorridos 4.3 y 4.6 con CF-25 | 7.6 |
| V6-07 **[C]** | Peso de una librería de arrastre para R-7 (P6-23): `@dnd-kit/core` 6.3.1 con sus sensores de puntero, tacto y teclado, empaquetado con esbuild 0.25, minificado, sin React, gzip -9 (`v6_07_arrastre/`) | **12.6 KB** (12,617 bytes): un cuarto del presupuesto de 50 KB por ruta de 05 §13.1. Medida de esbuild; la compilación de Next puede diferir, como pasó con Zod en V5-13 |
| V6-08 **[R3]** | Arrastre en la Bandeja con la carga diferida (`v6_08_arrastre/`): página de prueba en Next 16.4.1 con 20 movimientos, `@dnd-kit/core` 6.3.1 cargado con `import()` en `requestIdleCallback` después de hidratar; perfil 4G de 05 §13.1 (150 ms, 1.6 Mbps, CPU ×4) con Playwright; comparada con la misma página sin arrastre y con una página vacía | **Carga:** la librería no se descarga antes de `load` (1.26 s): llega en un trozo aparte de **15.0 KB gzip** (librería más el componente del panel), pedido 30 ms después de hidratar (1.29 s) y listo a los 1.58 s. **Funcionamiento:** con el ratón, soltar sobre una categoría aprueba; con el teclado, Espacio, flechas y Espacio aprueban, Escape cancela y los anuncios se leen en la región de estado; con el tacto, deslizar 60 px en 100 ms no inicia el arrastre y una pulsación de 500 ms abre el panel y soltar aprueba. **Hallazgo:** con el paso por defecto del teclado (25 px), 60 pulsaciones no llegaron a ningún destino; se corrigió con el salto entre destinos (FD-30, condición 5). **No verificado:** dispositivos reales, lectores de pantalla y el menú contextual de iOS (CA-78.15, manual) |

### 0.9 Preguntas de la Parte A (resueltas) **[A1]**

| # | Pregunta | Resolución | Dónde |
|---|---|---|---|
| P6-16 | Signo menos tipográfico (R-4): el diseño usa U+2212; 04 §7.10 y 05 §5.4 fijan el guion | Aprobada la recomendación: U+2212 solo al mostrar; texto accesible "menos $X"; exportaciones con guion | FD-25, CF-15, 3.12 |
| P6-17 | `notificaciones.aviso` es obligatorio en 03, pero 04 §11.2 registra motivos sin aviso | Aprobada: admite nulo con una migración de expansión; prueba de catálogo en CI y revisión de las demás columnas de 03 | FD-26, CF-16, V6-04, 3.13 |
| P6-18 | "Períodos en que existía c" no está definido en 01 ni en 04 | Aprobada con la redacción del usuario: Asig ≠ 0 o actividad (consumos, entradas o eventos) con fecha en el período | FD-27, CF-17, 3.14 |

El planteamiento original de cada pregunta, con su alternativa descartada, está en la sección de su decisión.

### 0.10 Revisión de la Parte A **[R1]**

Aprobada con cuatro ajustes, aplicados así:

| # | Ajuste pedido | Cómo quedó | Dónde |
|---|---|---|---|
| 1 | Hormiga: agrupar también por categoría | Dos agrupaciones con los mismos umbrales; las compras compartidas se deduplican con "queda el de mayor impacto" (a igual total, el de categoría); texto y enlace del de categoría; `DestinoHallazgo` de Actividad con categoría, fechas y tope de monto | 3.5.2, 3.5.3, 3.5.8, 3.5.11, V6-02 |
| 2 | Suscripciones: reactivar una programada desactivada | Propuesta OP-42 `activa: true` de un toque, revertible con `activa: false`; si hay varias, la de resolución más reciente | 3.5.9, 3.6 |
| 3 | Tarjetas: confirmar "pagado a tiempo" contra 01 §4.14 | **Confirmado:** 01 cuenta todos los efectos positivos, no solo los pagos; se usa esa definición con f = fecha de pago y la fila se rotula "Pagado o acreditado a tiempo" | 3.5.10 |
| 4 | Plantilla: medir con la app de prueba | Medido (V6-05): **27.9 s** en el peor caso del presupuesto, más de 20 s. Se corrigió el conteo (36 categorías, 47 elementos). La alternativa queda como pregunta P6-19, sin agregar operaciones | 3.9.1, 3.9.2, V6-05 |

#### Preguntas abiertas de la revisión

**P6-19. Cómo se aplica la plantilla (FD-23).** **[B1] Resuelta: opción a) (0.11).** Con una Server Action por elemento, el peor caso medido es 27.9 s. Opciones:

| Opción | Tiempo medido (4G, 400 ms por escritura) | Qué cambia | Costo |
|---|---|---|---|
| **a) Recomendada:** lote en el servidor. La misma OP-07 recibe una variante de entrada `{ elementos: […] }` y la acción ejecuta un `escribir()` por elemento, en serie y con su propia transacción, como ya hace OP-38 con el lote de la Bandeja (04 §4.8). Devuelve cuántos creó y el primero que falló; volver a aplicar salta los que ya existen por nombre | 18.9 s (7.2 s a 150 ms) | Variante de entrada de OP-07 en 04 §3 y en `@finn/aplicacion`; ninguna operación de dominio nueva; cada elemento es un OP-07 con su propia transacción **[R2]** | Un CF a 04 (forma de la entrada) y a 05 (la pantalla deja de iterar). El avance pasa a ser "Creando tu plantilla…" sin conteo, salvo que la acción se divida en 3 o 4 lotes (unos 5 s cada uno), que es lo que propongo |
| b) Mantener una acción por elemento y aceptar hasta unos 28 s | 27.9 s | Nada en 04; la pantalla muestra "Creando 12 de 47…" y, si se corta, al volver ofrece "Seguir con la plantilla" con los que faltan | Pasa del límite de 20 s; se acepta porque ocurre una sola vez en la vida de la app |
| c) Achicar la plantilla (unos 25 elementos) | ~15 s | Solo el contenido de 3.9.2 | Menos ayuda al empezar; el usuario crea a mano lo que falte |

Descarté una operación de dominio nueva ("aplicar plantilla"): el encargo dice no agregar operaciones y el lote de a) llega a lo mismo con OP-07.

**P6-20. Ocurrencias del tiempo inactivo al reactivar una programada** (para la Parte C, junto con FT-36). 01 §4.16 dice que las ocurrencias se generan "solo mientras la programada está activa", pero no dice qué pasa al reactivar: si el cálculo se hace desde la primera fecha sin mirar los intervalos de inactividad, las fechas del tiempo en que estuvo desactivada aparecerían de golpe como atrasadas. Esto afecta la propuesta de 3.5.9. Lo planteo con opciones en la Parte C; hasta entonces, 3.5.9 asume que al reactivar solo cuentan las fechas desde el día de la reactivación. **[B1]** El usuario aceptó este supuesto como provisional. **[R3]** Resuelta en 0.13: opción a), CF-20.


### 0.11 Preguntas de la Parte B (resueltas) **[B1]**

| # | Pregunta | Resolución | Dónde |
|---|---|---|---|
| P6-19 | Cómo se aplica la plantilla: una acción por elemento mide 27.9 s en el peor caso (V6-05) | Aprobada la opción a): OP-07 en lote, un `escribir()` por elemento en serie (como OP-38), en 3 o 4 tandas para mostrar el avance. La reanudación usa los ids de creación del borrador; saltar por nombre es solo el respaldo sin borrador. CF a 04 §3 y 05 | FD-23, CF-19, 3.9.1, FT-04 |
| P6-21 | La guía de primer uso no incluye conectar los SMS y desaparece con la primera cuenta | Aprobados los "Primeros pasos" con tres pasos marcables, visibles hasta completar los tres, con "Ocultar por ahora" como preferencia del dispositivo (como el tema) | FD-28, CF-18, 3.15, FT-04, FT-08 |
| P6-22 | "El promedio de gasto" con menos de 3 períodos | Distinción por uso: la asignación rápida promedia los que haya (1 o 2) y lo dice; con 0 no se ofrece. "Presupuesto contra la realidad" y "comparación con el promedio" siguen exigiendo 3, porque buscan un patrón repetido. Precisión de 01 OP-16 | FD-29, CF-17, 3.14, FT-12 |

P6-20 se resolvió en la revisión de la Parte C (0.13, **[R3]**).

La nota de FT-31 (AV-08 en voseo en el catálogo del servidor) quedó confirmada.

### 0.12 Revisión de la Parte B y preguntas de la Parte C

**Revisión de la Parte B [R2].** Aprobada, con los cambios **[B1]** y el agregado de "Primeros pasos: {k} de 3" en `/ajustes`. Dos correcciones:

| # | Corrección pedida | Cómo quedó |
|---|---|---|
| 1 | CA-04.2 y la mención en P6-19 citaban `historial_operaciones` | **Confirmado: esa tabla no existe** en 03 (ni en 04). Se quitó de CA-04.2, de la tabla de P6-19 (0.10) y de 3.9.1. CA-04.2 dice ahora que `estructura()` devuelve exactamente los 11 grupos y 36 categorías en ese orden y que ningún grupo tiene dos categorías con el mismo nombre. Revisé el resto del documento buscando otros nombres de tabla que no estén en 03: no hay más (los demás nombres en minúscula con guion bajo son filas del reporte de flujo de efectivo y el valor `union_deudores` de CF-03, que ya se presentan como propuestos) |
| 2 | CA-03.5 decía "reintento ante 404" | Reescrito: la prueba verifica el reintento ante una respuesta de error del servidor, que es lo que N-01 exige para el 5xx. **Aviso:** 04 §8.8, paso 3 de "Prueba en el teléfono", provoca ese reintento apuntando la macro a una ruta inexistente (404), porque desde el teléfono no se puede forzar un 503 del servidor. El criterio conserva ese método y explica por qué vale: los dos mecanismos de 04 §8.8 reintentan ante cualquier código distinto de 2xx. Si preferís otro método para provocar un 5xx real, sería un cambio a 04 §8.8 |

**P6-20. Ocurrencias del tiempo inactivo al reactivar una programada (FT-40, 3.5.9).** 01 §4.16 dice que las ocurrencias se generan "solo mientras la programada está activa", pero la programada solo guarda `activa` (03 §3.23), sin fecha. Al reactivarla, el cálculo de 04 §6.12.1 parte de `primera_fecha` y no tiene cómo saber qué fechas cayeron mientras estuvo desactivada: aparecerían todas como atrasadas. Peor: si tiene registro automático, la tarea diaria (04 §10.2, paso 1) registraría como transacciones reales las del tramo inactivo que caen en el período activo.

| Opción | Qué hace | Costo |
|---|---|---|
| **a) Recomendada:** columna `programadas.reactivada_desde date NULL` | OP-42 con `activa: true` sobre una programada inactiva la fija en `hoy`; desactivar no la toca. Las ocurrencias pendientes son las de fecha ≥ `primera_fecha` y, si `reactivada_desde` no es nula, ≥ `reactivada_desde` (incluida la de hoy). Las resoluciones anteriores siguen siendo hechos y se ven en el historial. Las ocurrencias que quedaron sin resolver antes de desactivar tampoco vuelven: el usuario la desactivó | CF-20: migración de expansión en 03 (columna nula, sin valor por defecto); precisión de 01 §4.16 y OP-42; 04 OP-42 (hechos) y §6.12.1 (cálculo de `proximas` y `atrasadas`), y el emparejamiento (§4.17) deja de proponer fechas del tramo inactivo. Ninguna operación nueva |
| b) Generar todo desde `primera_fecha` | Lo que pasa hoy por omisión | Atrasadas que el usuario no espera y registros automáticos indebidos |
| c) Omitir en lote al reactivar | OP-42 escribe una resolución `omitida` (OP-44) por cada fecha del tramo inactivo | Sin columna, pero crea hechos que el usuario no decidió (52 filas por un año de una programada semanal) y "omitida" pasaría a significar dos cosas |
| d) Tabla de intervalos de inactividad | Exacto para todo el historial | Una tabla nueva para un dato que nadie consulta: las ocurrencias pasadas ya resueltas son hechos |

Hasta la respuesta, FT-40 y 3.5.9 aplican la opción a), con su marca. **[R3]** Aprobada (0.13).

**P6-23. Arrastrar un movimiento de la Bandeja a una categoría (R-7).** El diseño (06-identidad-visual, PANTALLAS §7) lo presenta como atajo, con los botones equivalentes siempre visibles. Lo que habría que decidir:

- **Qué hace el gesto.** Soltar sobre una categoría equivale a OP-36 (una sola línea a esa categoría) seguida de OP-37 (aprobar). Son dos operaciones que no forman una unidad; si se quiere un solo paso hace falta una entrada nueva de OP-37 con la categoría, o el gesto solo cambia la categoría y después hay que tocar "Aprobar".
- **Dónde están las categorías.** La lista compacta de la Bandeja en el teléfono no muestra categorías: haría falta un panel de destinos que hoy no existe.
- **Peso.** Medido (V6-07): `@dnd-kit/core` 6.3.1 con sus sensores de puntero, tacto y teclado ocupa **12.6 KB gzip** sin React, un cuarto del presupuesto de 50 KB por ruta (05 §13.1). El arrastre nativo de HTML no funciona de forma confiable con el tacto en Android.
- **Accesibilidad.** WCAG 2.5.7 exige una alternativa sin arrastre, y ya existe (FE-25 y la revisión del movimiento), así que el gesto no agrega ninguna capacidad.

| Opción | Qué cambia |
|---|---|
| **a) Recomendada:** no entra en la primera versión. Se registra como **FT-78 "Arrastrar un movimiento a una categoría" [P]**, que se reevalúa con el uso real | La nota de la pantalla "Arrastrar a una categoría es un atajo; los botones siempre están" se quita del diseño (Parte E, §5). Sin CF |
| b) Solo en computadora, donde el diseño ya muestra la revisión al lado de la lista | Panel de categorías como destinos, arrastre con teclado, una entrada nueva de OP-37 con la categoría (CF a 04) y el peso medido en la ruta |
| c) En teléfono y computadora | Lo de b) más un panel de destinos en el teléfono |

La acción más frecuente ya es de un toque cuando la categoría sugerida es la correcta (FE-25); cuando no lo es, el gesto ahorra un paso (abrir la revisión) a cambio de lo anterior.

**[R3]** Decisión del usuario: opción c), con el diseño de FD-30 (0.13).

### 0.13 Revisión de la Parte C **[R3]**

Aprobada. Respuestas:

| # | Respuesta | Dónde |
|---|---|---|
| P6-20 | Aprobada la opción a): `programadas.reactivada_desde`, fijada en hoy al reactivar; solo cuentan las ocurrencias desde ahí | CF-20 (ya sin "pendiente"), 3.5.9, FT-40 (CA-40.5 y CA-40.6 sin la marca de provisional) |
| CA-03.5 | Aceptada la explicación: el método de 04 §8.8 vale; sin cambio a 04 | FT-03 |
| P6-23 (R-7) | **Decisión del usuario:** el arrastre entra en la primera versión, en teléfono y computadora (opción c), con las siete condiciones de la revisión | FT-78, FD-30, CF-21, CF-22, V6-08 |

#### FD-30 Arrastrar un movimiento a una categoría

| # | Condición del usuario | Cómo queda | Alternativa descartada |
|---|---|---|---|
| 1 | Una sola operación | OP-37 con la variante `{ categoriaId }` (CF-21, abajo) | OP-36 y OP-37 por separado (pedido explícito) |
| 2 | Pulsación larga en el teléfono, arrastre normal en computadora | Sensores separados de la librería: tacto con 350 ms de espera y 8 px de tolerancia; ratón después de 6 px. El asa lleva `touch-action: manipulation`, `user-select: none` y `-webkit-touch-callout: none` para que la pulsación larga no abra el menú del sistema | Un solo sensor de puntero (con el dedo, el arrastre empezaría al deslizar y competiría con el desplazamiento de la lista); 500 ms de espera (se siente lento para la acción más frecuente) |
| 3 | Panel con la sugerida, las frecuentes y "Otra categoría…" | Datos en CF-22. Orden: sugerida, hasta 5 frecuentes distintas de la sugerida, "Otra categoría…". En computadora, el panel reemplaza la revisión lateral mientras dura el arrastre y lista también todas las categorías por grupo. La forma y la posición son del diseño; requisito: todos los destinos visibles sin desplazar la página en el teléfono y de 44 px de alto como mínimo (05 FE-47) | Un panel con todas las categorías en el teléfono (36 o más destinos en una pantalla de 390 px; para eso está "Otra categoría…") |
| 4 | Carga diferida, medida | `import()` en el primer momento libre después de hidratar (`requestIdleCallback`, tope de 2 s) o al primer toque o tecla sobre una fila, lo que pase antes. Medido en V6-08: fuera de lo que se descarga antes de `load`; 15.0 KB gzip en un trozo aparte | Cargar solo al primer gesto (esa primera pulsación larga se perdería mientras llega el trozo, unos 250 ms en 4G); incluirla en la carga inicial (+15 KB en la ruta) |
| 5 | Teclado y anuncios; botones visibles | Sensor de teclado con un cálculo propio de coordenadas que **salta entre los destinos del panel** con las flechas, y anuncios en voseo en la región de estado de la librería. Los botones de FT-35 no cambian | El paso por defecto de la librería (mover la ficha de a 25 px): en V6-08, 60 pulsaciones no llegaron a ningún destino |
| 6 | Confirmación o dato faltante: traspaso con la categoría puesta | Como 05 §4.15, con el borrador que agrega `{ variante: 'categoria', categoriaId }`. El flujo confirma con la misma variante, el mismo id y la `huellaImpacto`. Resultado igual al toque, sin "Deshacer" (PB-2) | — |
| 7 | FT-78 [M] y la nota del diseño | Ficha FT-78 en 2.5. La nota de la Bandeja ("Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están.") **se conserva**: nada de lo anterior la contradice. Se registra en §5 (Parte E) | — |

**Librería.** `@dnd-kit/core` 6.3.1 (licencia MIT, sin costo). Trae los sensores de tacto, ratón y teclado y los anuncios accesibles que pide la condición 5. *Alternativa descartada:* el arrastre nativo de HTML, que en Android no se dispara de forma confiable con el tacto y no tiene equivalente de teclado.

**Precisión que agregué a la condición 1** (para que la revises): "una sola línea" se limita a una línea **hacia una categoría o sin destino**. Un gasto con su única línea por cobrar queda fuera, porque soltarlo sobre una categoría convertiría en gasto propio algo que el usuario marcó como deuda de otra persona.

#### CF-21 Variante de OP-37 "aprobar con categoría" (a 04 §3.6)

```ts
// Entrada de la variante (FT-78)
{ movimientoId: Uuid; id: Uuid; categoriaId: Uuid;
  esperado: MovimientoDto['esperado'];          // las líneas que vio la lista (valor absoluto, como OP-36)
  revisionVista?: Revision; huellaImpacto?: string }
```

- **Precondiciones propias** (si no se cumplen, `arrastre_no_permitido`): estado `pendiente`; `tipo_propuesto = 'gasto'`; como máximo una línea, y esa línea va a una categoría o no tiene destino (no por cobrar ni vinculada a una línea original). Así quedan fuera las coincidencias, los posibles duplicados, los no reconocidos, los errores, los pagos de tarjeta, las devoluciones y los ingresos.
- **Precondiciones de siempre:** la categoría es normal y activa (`categoria_archivada`, `categoria_de_pago_no_permitida`); después, todas las de OP-37 (cuenta, fecha, monto, operación del tipo). Las líneas actuales iguales a `esperado` (si no, `conflicto_desactualizado`).
- **Hechos**, en un solo `escribir()`: F2 + F3 `movimiento_lineas` (una línea: `monto` = monto del movimiento, `categoria_id`; orden nuevo según BE-16) y, a continuación, los hechos de OP-37 (PT con OP-20 + PM). Si algo falla, no queda ni el cambio de líneas (01 §5.0.1).
- **Confirmación:** la de OP-37. Con `REQUIERE_CONFIRMACION` no escribe nada (04 §4.3), tampoco las líneas.
- **Idempotencia:** la de OP-37 (movimiento `aprobado` → `ya_aplicada`; creación sobre `transacciones.id`).
- **Salida:** la de OP-37 con `aprobado` (CP-15). `recordarRegla` no forma parte de la variante: la propuesta de regla llega después, como en FE-25.
- **Mensaje nuevo** (04 §7.10): `arrastre_no_permitido` → "Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo."

#### CF-22 Datos del arrastre en `bandeja()` (a 04 §6.8)

```ts
interface BandejaDto {
  // … lo de 04 §6.8
  destinosArrastre: {
    frecuentes: Ref[];                                   // hasta ARRASTRE_FRECUENTES_MAX
    grupos: { grupo: Ref; categorias: Ref[] }[];         // todas las normales activas, por orden; sin "Pagos de tarjeta"
  };
}
// MovimientoDto.aprobacion agrega:
arrastrable: boolean;                                    // precondiciones propias de CF-21
```

- **Frecuentes:** las categorías normales y activas con más líneas en transacciones de tipo gasto con fecha en los últimos `ARRASTRE_FRECUENTES_DIAS` días (hoy incluido); desempate por la línea más reciente y después por el orden del presupuesto. Sin historial: las primeras por orden de grupo y categoría. Constantes en el módulo de FD-18: `ARRASTRE_FRECUENTES_MAX` = 6 y `ARRASTRE_FRECUENTES_DIAS` = 90.
- **Sugerida:** la que ya trae cada movimiento (`categoriaSugerida`, 04 §6.8); no hace falta otro dato.
- **"Otra categoría…"** usa `grupos`, sin otra consulta.
- **Costo:** se calcula sobre los hechos ya cargados en la instantánea; no agrega lecturas a la base.

### 0.14 Preguntas de la Parte D (resueltas en 0.15) **[R4]**

Salieron al redactar las fichas de Notificaciones. Las fichas aplican la recomendación y lo dicen.

**P6-24. Panel de notificaciones que cae desde arriba (R-5).** El diseño (06-identidad-visual, PANTALLAS §2.17) abre las notificaciones como un panel sobre la pantalla actual. 05 exige una URL propia para cada sección (P5-10, N4) y clasifica `/notificaciones` como sección secundaria [S], que hoy se abre como página.

| Opción | Qué cambia | Costo |
|---|---|---|
| **a) Recomendada:** la misma ruta `/notificaciones`, **interceptada** en `@superpuesto` cuando se llega desde la campana de otra pantalla de la app, como los flujos cortos (05 FE-04, V5-06) | Desde la campana: panel sobre la pantalla de origen, que sigue montada; cerrar (o tocar el velo, o Escape) es `router.back()`. URL abierta directamente, recarga, deep link o "atrás" desde un destino: página completa. Tocar una notificación navega a su destino con `?notificacion=` (05 §3.5), y el panel se vacía como cualquier ruta interceptada | CF-23 a 05 §1.3 y §1.4 (una ruta [S] con interceptación, que hoy está reservada a los [C]) y §10.7 (`Superpuesto` con la variante "desde arriba", la forma es del diseño). Sin cambios en 04 |
| b) Panel de cliente sin URL | Ninguno en el árbol | Contradice P5-10: no se recarga ni se comparte, y el lector de pantalla no tiene una página que anunciar |
| c) Solo página completa | Nada | No sigue el diseño |

**P6-25. Contenido de Notificaciones (R-6).** El diseño propone, además de lo que ya existe, cuatro avisos que 04 §11.2 no tiene: corte de tarjeta con falta de reserva, cuotas próximas, metas cubiertas y reglas aplicadas.

| Aviso propuesto | Recomendación | Motivo |
|---|---|---|
| "Visa Oro corta el 25/10" | **No como motivo nuevo.** El ejemplo pasa a ser `pago_tarjeta_proximo` (FD-22): "Visa Oro: tu fecha de pago es el 15/11…" | Lo accionable es pagar antes de la fecha de pago, no el corte. La falta de reserva ya está en Inicio (AV-07) |
| "Cuota del préstamo el 20/10" | **No en la primera versión.** Inicio ya muestra los próximos pagos de 7 días (BE-37) y los atrasados | Un push por cada pago programado duplicaría Inicio. Si se quiere, la opción b) de abajo lo agrega solo para cuotas |
| "Netflix tiene su meta cubierta" | **No** | Lo provoca el propio usuario al asignar: P4-11 lo excluye del push y del centro |
| "La regla PIZZA HUT se aplicó" | **No** | Ocurriría en casi cada SMS; la Bandeja ya dice "(por regla)" en la fila |
| "Se cerró el período 21/08 – 20/09" | Ya existe (`cierre_periodo`) | — |

- **a) Recomendada:** ningún motivo nuevo además de `pago_tarjeta_proximo` (CF-07). Los ejemplos del diseño se ajustan a los motivos de 04 §11.2 en §5 (Parte E). El pie del panel ("Acá llegan recordatorios y avisos de Finn. Los movimientos de tus SMS por revisar están en la Bandeja.") no cambia, aunque los avisos `sms_*` también quedan en el centro (04 §11.2): conviene ajustar el texto a "Los movimientos por revisar se resuelven en la Bandeja." **(nuevo)**.
- **b)** Agregar `cuota_proxima`: para las programadas de tipo `cuota_prestamo` **sin** registro automático, una notificación con push 3 días antes de cada ocurrencia, una sola vez por ocurrencia, con destino `programada` y `fechaEsperada`. Sería CF a 04 §10.2 (paso 4), §11.2 y §11.4; sin migración (`motivo` es texto, CF-16 ya admite `aviso` nulo).
- **c)** Los cuatro avisos del diseño.

### 0.15 Revisión de la Parte D **[R4]**

Aprobada, con estas respuestas y correcciones:

| # | Pedido | Cómo quedó | Dónde |
|---|---|---|---|
| FT-78 | Aprobada la precisión: una sola línea hacia una categoría o sin destino; la única línea por cobrar queda fuera | Sin cambios (ya estaba así en CF-21) | 0.13 |
| P6-24 | Opción a) | CF-23 aprobado, sin "pendiente" | 0.7, FT-69 |
| P6-25 | Opción b): motivo `cuota_proxima` | CF-24 y 3.16; criterios nuevos en FT-71 y referencia en FT-41; V6-04 repetida con 18 motivos. Los otros tres avisos del diseño quedan fuera; el pie del panel nuevo, aprobado | 3.16, FT-41, FT-71, V6-04, §5 (Parte E) |
| Corrección 1 | El enlace de hormiga a Actividad no muestra siempre "exactamente esas compras" | El enlace agrega `&tipo=gasto` (05 §2.2), así quedan fuera las devoluciones, ingresos y otros tipos. Lo que puede sumar todavía: gastos pequeños que resolvieron una programada (hormiga los excluye) y, en el de comercio, transacciones cuya **nota** contiene el texto. 3.5.8 lo dice así y el criterio usa datos sin programadas ni notas que coincidan, más un criterio que documenta la diferencia | 3.5.8, CA-24.3, CA-64.2, CA-64.5 |
| Corrección 2 | ¿El push de cierre puede llevar la reducción de LPA? | **Confirmado contra 04:** §11.4 cita como ejemplo "Cerró el período del 21/09 al 20/10. Listo para asignar bajó $50.00 por sobregiros. Una meta venció.", y §10.2, paso 3, dice que el push de cierre se envía "con la reducción de LPA aplicada al cierre". CA-71.1 se queda con el monto y cita ese texto. La regla única que lo explica, y que se aplica a cierre, tarjeta y cuota, es FD-31 (3.8) | 3.8, 3.16, CA-71.1 |
| Corrección 3 | ¿`deuda-sin-respaldo` es el identificador real? | **Confirmado:** en 05 §10.3 el **estado** se llama `deuda-sin-respaldo` y su **etiqueta** es "Deuda sin reservar" (sobregiro con tarjeta) o "Te falta reservar" (tarjeta). `HallazgoDto.estado` usa el identificador del estado, no la etiqueta, así que no cambia. Agregué la aclaración en 3.5.2 para que no se confunda con el glosario | 3.5.2 |
| Limpieza | V6-06 mezclada y FD-30 antes de FD-29 | V6-06 reescrita con una redacción por parte, en orden; FD-29 y FD-30 ordenadas | 0.6, 0.8 |

**FD-31. Qué monto puede llevar un push.** 02 ADR-12 fija el contenido mínimo "tipo de aviso, comercio y monto", y 04 §11.4 agrega "nunca el texto del SMS, saldos ni nombres de deudores". La regla que separa "monto" de "saldo":

- **Puede ir:** el importe de un **movimiento** (una transacción, un SMS, una ocurrencia programada) o de un **cambio que ya ocurrió y no vuelve a moverse solo** (la reducción de Listo para asignar aplicada al cierre de un período, que es el ejemplo de 04 §11.4).
- **No puede ir:** una cifra que describe el **estado vigente** de una cuenta, una tarjeta o el presupuesto y que cambia con cada operación: saldos, deuda, Disponible, Listo para asignar, "te falta reservar", monto para no generar intereses.

| Motivo | Monto en el push | Por qué |
|---|---|---|
| `cierre_periodo` | Sí: la reducción aplicada al cierre | Es un cambio ya ocurrido, cerrado con el período (04 §10.2, paso 3; §11.4) |
| `pago_tarjeta_proximo` | **No** | El monto para no generar intereses es la deuda anterior menos lo ya pagado (01 §4.14): un estado vigente de la deuda que cambia con cada pago o compra |
| `cuota_proxima` | Sí: el monto de la cuota | Es el importe de un movimiento esperado (la ocurrencia de la programada), igual que el monto de un SMS |

*Alternativa descartada:* prohibir todo monto que no sea de una transacción. Contradice el ejemplo aprobado de 04 §11.4 para el cierre.

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

## 1. Catálogo de features

### 1.1 Criterios (FD-01, FD-02, FD-03)

**FD-01. Qué es una feature.** Una capacidad que el usuario reconoce y nombraría ("pagar la tarjeta", "aprobar un movimiento"), que puede agrupar varias operaciones, consultas y rutas. Los identificadores FT-nn son estables: una feature retirada conserva su número con la marca "retirada", para que las referencias de las revisiones no cambien de significado.
- *Justificación:* las pruebas de la Fase 7 y las tareas de la Fase 8 se organizan por lo que el usuario hace, y una feature por operación repetiría fichas casi iguales (crear, editar y eliminar una regla de comercio no son tres capacidades distintas).
- *Alternativas descartadas:* una feature por operación (más de 60 fichas repetitivas); renumerar al retirar (rompe las referencias del Paso 1, como FT-49 y FT-75).

**FD-02. Prioridad para la primera versión usable.** Es un insumo de la Fase 8, que fija el orden de construcción (00 R10).
- **Imprescindible [I]:** sin ella no se puede dejar la 1.0 en el uso diario, o corrige un error de integridad de la 1.0 (documento de producto §14, errores 1 a 6 y 9).
- **Importante [M]:** entra en la primera versión, pero puede llegar después de las imprescindibles sin bloquear el uso diario.
- **Posterior [P]:** después de la primera versión.
- *Alternativa descartada:* no priorizar y dejarlo todo a la Fase 8 (el encargo pide la prioridad).

**FD-03. Ficha abreviada.** FT-05, FT-06, FT-75, FT-76 y FT-77 llevan ficha abreviada (objetivo, referencias, criterios de aceptación y dependencias), porque están cerradas en 04 y 05 y no tienen reglas de negocio propias.

### 1.2 Catálogo

La columna "Piezas principales" es orientativa; la trazabilidad completa está en §6 (Parte E).

#### Instalación y primer uso

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-01 | Ingresar con contraseña y TOTP | I | Sin acceso no hay app (ADR-08) | `/ingresar`, `/ingresar/verificar`, CP-11 |
| FT-02 | Inscribir el primer factor TOTP | I | AAL2 es obligatorio desde el primer ingreso (04 §12.2) | `/ingresar/inscribir`, FE-37 |
| FT-03 | Conectar MacroDroid (token del webhook) | I | Sin token no llegan los SMS, que son la razón de Finn (producto §3) | OPT-01, `/ajustes/webhook`, 04 §8 |
| FT-04 | Primer uso guiado, con la plantilla de categorías | I | Arranque desde cero (FD-04): sin cuentas ni categorías el presupuesto no existe | `inicio()`, `/cuentas/nueva`, `/presupuesto/estructura/plantilla` (CF-08), OP-07 |
| FT-05 | Instalar como app y página sin conexión | M | Uso diario en el teléfono; la app funciona igual en el navegador (ficha abreviada) | 05 §8, `/sin-conexion` |
| FT-06 | Activar notificaciones en el dispositivo | M | Los SMS se ven igual en la Bandeja; el push acelera (ficha abreviada) | OPT-02, OPT-03, CP-5 |
| FT-07 | ~~Migración inicial desde Finn 1.0~~ | — | **Retirada** (P6-13, FD-04) | — |

#### Presupuesto

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-08 | Inicio: resumen diario y "¿algo necesita mi atención?" | I | Es la pantalla de todos los días (producto §5) | `inicio()`, `/` |
| FT-09 | Presupuesto del período: filtros, períodos cerrados y futuros | I | Corazón de Finn (producto §7); corrige el error 11 (mismos números en todas las pantallas) | `presupuesto()`, `/presupuesto` |
| FT-10 | Asignar y desasignar | I | Sin asignar no hay base cero | OP-14, `/presupuesto/asignar/[categoriaId]` |
| FT-11 | Mover dinero entre categorías | I | Es la forma diaria de cubrir un sobregiro (producto §15) | OP-15, `/presupuesto/mover` |
| FT-12 | Asignación rápida | M | Ahorra pasos; asignar a mano sigue funcionando | OP-16 |
| FT-13 | Auto-asignar | M | Ídem; las metas ya indican cuánto falta | OP-17, `/presupuesto/auto-asignar` |
| FT-14 | Detalle de categoría: reparto, calendario e historial | I | Es donde se entiende un sobregiro (PF-2: los montos al tocar) | `detalleCategoria()` |
| FT-15 | Detalle de Listo para asignar | M | Corrige el error 12 (historial aproximado), pero no bloquea el uso diario | `detalleLpa()` |
| FT-16 | Sobregiros y cierre automático del período | I | Corrige los errores 3, 4 y 7; sin cierre correcto los números se descuadran | Selectores §4.6–4.7, push `cierre_periodo` |
| FT-17 | Metas | I | Corrige el error 7 (metas que no arrastran) | OP-18, `metas()` |
| FT-18 | Grupos y categorías: crear, renombrar, reordenar y eliminar | I | Sin categorías no se puede presupuestar | OP-07, OP-08, OP-13, `estructura()` |
| FT-19 | Archivar y desarchivar categorías, y sacar el dinero de una archivada | I | Corrige el error 1 (eliminar destruye el historial) | OP-09, OP-10, OP-11 |
| FT-20 | Fusionar categorías | M | Necesaria cuando la estructura madura; no en el primer mes | OP-12 |

#### Transacciones

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-21 | Registrar gasto con división y por cobrar | I | Registro manual de lo que no llega por SMS; corrige el error 9 | OP-20, `/registrar/gasto` |
| FT-22 | Registrar ingreso | I | Sin ingresos no hay Listo para asignar | OP-21 |
| FT-23 | Transferencia entre cuentas propias | I | Movimiento frecuente entre cuentas | OP-22 |
| FT-24 | Actividad con búsqueda y filtros | I | Historial de todas las cuentas (producto §8, §16) | `actividad()` |
| FT-25 | Detalle y edición completa | I | Corrige el error 8 (solo se podía editar la categoría) | `detalleTransaccion()`, OP-28 |
| FT-26 | Eliminar y cambiar el estado bancario | I | Sin eliminar no se corrigen errores | OP-29, OP-30 |
| FT-27 | Transacción olvidada y cambios retroactivos | I | Corrige el error 3; muestra el impacto (AV-01) | AV-01, BE-38 |
| FT-28 | Devoluciones | M | Frecuentes, pero se pueden registrar como ingreso mientras tanto | OP-33, OP-34 |

#### Tarjetas

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-29 | Categoría de pago y "te falta reservar" | I | La razón del uso intensivo de tarjeta (producto §2) | `FilaPagoTarjeta`, AV-07 |
| FT-30 | Pagar tarjeta con desglose y pago excedente | I | Pago mensual | OP-23, `/cuentas/[cuentaId]/pagar` |
| FT-31 | Reserva excedente y saldo a favor | M | Situación menos frecuente; los números ya son correctos sin la acción | AV-08, OP-14 |
| FT-32 | Cashback, avance y transferencia de deuda | M | Menos frecuentes | OP-27 |
| FT-33 | Corte, pago y monto para no generar intereses, con recordatorio | M | Informa y avisa; no cambia números | `cuentas()`, CF-06, CF-07 |

#### Bandeja de SMS

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-34 | Recepción y procesamiento de SMS | I | El problema principal que resolvió la 1.0 (producto §3); corrige los errores 5 y 10 | OP-35, `POST /api/sms` |
| FT-35 | Revisar y aprobar: un toque, flujo completo y recordar regla | I | La acción más frecuente de la app (FE-25) | OP-36, OP-37, `/bandeja/[movimientoId]` |
| FT-36 | Aprobar todos | M | Atajo; aprobar uno por uno funciona | OP-38 |
| FT-37 | Descartar, restaurar, duplicados y coincidencias | I | Sin esto los duplicados entran a los números (error 10) | OP-39, OP-40 |
| FT-38 | SMS no reconocidos y con error | I | Sin esto se pierden compras reales (P19, N-02) | OP-49, OP-50 |
| FT-39 | Reglas de comercio | M | "Recordar regla" al aprobar (FT-35) cubre lo básico | OP-41, `/reglas` |
| FT-78 **[R3]** | Arrastrar un movimiento a una categoría | M | Decisión del usuario (P6-23); atajo de FT-35, con los botones siempre visibles | OP-37 (variante `categoriaId`, CF-21), `bandeja()` (CF-22) |

#### Programadas

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-40 | Administrar programadas | M | Pagos recurrentes; mientras tanto se registran a mano | OP-42, OP-51 |
| FT-41 | Próximos pagos, registro de un toque y omitir | M | Ídem | OP-43, OP-44 |
| FT-42 | Registro automático y puesta al día | M | Ídem | OP-43 automático, 04 §10 |

#### Conciliación

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-43 | Conciliar con estado de cuenta CSV | M | Mensual; depende de las muestras reales (SP-01) | OP-45, OP-46, OP-47 |
| FT-44 | Verificar saldo (conciliación manual) | M | Mensual; cubre las cuentas sin CSV y corrige el error 2 a la vista | OP-53 (CF-01) |

#### Por cobrar

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-45 | Por cobrar y dinero en camino | M | Gastos compartidos (producto §15); dividir con por cobrar ya está en FT-21 | `porCobrar()`, AV-09 |
| FT-46 | Cobrar | M | Ídem | OP-31 |
| FT-47 | Condonar | M | Ídem | OP-32 |
| FT-48 | Renombrar deudor | M | Corrige un nombre mal escrito | OP-52 |
| FT-49 | Unir deudores | P | Diferida (FD-08) | OP-54 (CF-03, diferido) |

#### Cuentas y préstamos

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-50 | Crear cuenta con saldo inicial | I | Arranque desde cero (FD-04) | OP-01, `/cuentas/nueva` |
| FT-51 | Cuentas y posición neta | I | Dónde está el dinero (producto §6) | `cuentas()` |
| FT-52 | Detalle de cuenta | I | Movimientos por cuenta y saldo confirmado; corrige el error 2 a la vista | `detalleCuenta()` |
| FT-53 | Editar, ordenar, archivar, desarchivar y eliminar cuentas | I | Corrige el error 1 en cuentas | OP-02 a OP-06 |
| FT-54 | Pagar cuota o abonar a capital | I | Corrige el error 6 (el pago bajaba mal el saldo) | OP-24 |
| FT-55 | Condiciones y tabla de amortización | M | Informativa; la cuota se paga sin ella | OP-48, Anexo A de 01 |
| FT-56 | Desembolso de préstamo | P | Ocasional; un préstamo en curso se crea con su saldo (P13) | OP-26 |
| FT-57 | Inversiones: aporte, retiro y ajuste | M | Mensual en algunos casos; no bloquea el presupuesto | OP-25 |
| FT-58 | Modelos de préstamo de otros bancos | P | 01 Anexo A solo define Banco Agrícola | — |
| FT-59 | Proyección de inversiones | P | 01 A.3 no tiene modelo de rendimiento | — |

#### Reportes

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-60 | Reportes base (producto §10) | M | Siete reportes ya definidos en 04 §6.9.2 | `reporte()`, `/reportes/[tipo]` |
| FT-61 | Gasto semanal | M | Definido en 04 §6.9.3 y en el diseño (A.7) | `gasto_semanal` |
| FT-62 | Ritmo de gasto y proyección del cierre | M | Empuja a ajustar antes del cierre (producto §16) | `ritmo` (CF-04) |
| FT-63 | Presupuesto contra la realidad y comparación con el promedio | M | Ajusta lo asignado con datos | `realidad` (CF-04) |
| FT-64 | Gastos hormiga | P | Requiere historia para ser útil | `hormiga` (CF-04) |
| FT-65 | Suscripciones detectadas | P | Requiere al menos 4 períodos cerrados | `suscripciones` (CF-04) |
| FT-66 | Tarjetas en el tiempo | M | "¿Pago el total o arrastro deuda?" (producto §16) | `tarjetas` (CF-04) |
| FT-67 | Hallazgos accionables | M | Resume los anteriores en acciones | `hallazgos` (CF-04) |
| FT-68 | Flujo de efectivo | P | No lo pide el producto; complementa `remanente` | `flujo_efectivo` (CF-02) |

#### Notificaciones

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-69 | Centro de notificaciones | M | Los avisos importantes también están en Inicio | `notificaciones()`, OPT-04 |
| FT-70 | Push de la bandeja con acciones | M | Acelera la revisión; la Bandeja funciona sin push | 04 §11, `POST /api/notificaciones/accion` |
| FT-71 | Push de programadas, cierre, metas, tarjetas y sistema | M | Ídem | 04 §11.2, CF-07 |

#### Ajustes y seguridad

| FT | Feature | Pri. | Justificación | Piezas principales |
|---|---|---|---|---|
| FT-72 | Cambiar el ciclo | M | La semilla ya trae el día 21 (03 §9.2) | OP-19 |
| FT-73 | Formatos bancarios e instituciones | M | Los formatos sembrados se reescriben con las muestras (FX-1); se ajustan sin desplegar | OPT-05, OPT-06, OPT-07 |
| FT-74 | Factores y sesiones | M | El primer factor está en FT-02; el de respaldo protege (RS-13) | CP-11, `/ajustes/seguridad` |
| FT-75 | Exportar | M | Requisito del producto (§15); ficha abreviada | OPT-08 |
| FT-76 | Respaldo y diagnóstico | M | El respaldo corre en GitHub Actions; la pantalla informa (ficha abreviada) | `ajustes()`, OPT-09 |
| FT-77 | Apariencia | P | El tema sigue al sistema por defecto (ficha abreviada) | `/ajustes/apariencia` |

### 1.3 Resumen

| Prioridad | Cantidad |
|---|---|
| Imprescindible | 31 |
| Importante | 38 **[R3]** |
| Posterior | 8 |
| Retirada | 1 (FT-07) |
| **Total** | **77 vigentes** **[R3]** (FT-78 se numera después de FT-77 porque los números son estables, FD-01) |

---

## 3. Resolución de las preguntas abiertas

### 3.1 Migración desde Finn 1.0 — P13 cerrada (FD-04)

**Decisión del usuario:** no hay migración. Finn 2.0 empieza desde cero con saldos iniciales, como ya decía 00 §5.1.

Consecuencias en el catálogo y en las fichas:
- FT-07 queda retirada (FD-01).
- El arranque es FT-04: crear las cuentas con su saldo actual (OP-01, M1: por defecto la apertura es hoy) y la estructura de grupos y categorías, opcionalmente con la plantilla (FD-23).
- Recomendación de uso (no es una regla): abrir las cuentas el primer día de un período, para que el primer período empiece completo.
- **CF-14:** 00 §5.1 ("Migración desde Finn 1.0 (P13): pendiente") y 03 §0.2 ("la migración desde Finn 1.0 (P13, pendiente)") reciben una línea en "Enmiendas posteriores": P13 cerrada sin migración. DB-02 no cambia: su justificación sigue valiendo para inserciones por SQL manual.

*Alternativas descartadas por el usuario:* migrar la estructura con un script; migrar el historial completo.

### 3.2 F6-1 — Verificar saldo, conciliación manual sin CSV (FD-05, FD-06)

#### 3.2.1 Qué es

Una conciliación en la que el usuario escribe la fecha y el saldo que muestra su banco (en la app del banco, el cajero o un estado en papel), en lugar de subir un CSV. Finn compara con su saldo a esa fecha, registra la diferencia aceptada y deja marcar como conciliadas las transacciones hasta esa fecha.

- Sirve para cuentas sin CSV (financieras, aplicaciones, efectivo físico; P20) y como verificación rápida de cualquier cuenta.
- Nunca crea transacciones (inv. 14): la diferencia se resuelve con un ajuste que crea el usuario (FD-06).

#### 3.2.2 OP-53 Verificar saldo (CF-01, a 04 §3.8 y 01 §5.8)

- **Entrada:** `id` (de la conciliación); `cuentaId`; `fechaEstado: FechaLocal`; `saldoEstado: MontoTextoConSigno` (en una tarjeta, positivo = deuda, como en OP-01; el dominio lo convierte a la convención de 01 §0.4); `marcar: { todas: true } | { ids: Uuid[] }`; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** creación (`conciliaciones.id`).
- **Previsualizar primero** (se agrega a la lista cerrada de FE-07): la primera llamada devuelve el impacto con `saldoFinn` = saldo(cuenta, fechaEstado), `diferencia` = saldoEstado − saldoFinn (convención de ESC-47) y la cantidad de transacciones que marcaría. La interfaz no calcula la diferencia (PF-3).
- **Precondiciones:**
  - cuenta de efectivo o tarjeta (`cuenta_tipo_no_valido`), abierta (`cuenta_archivada`);
  - `fechaEstado ≤ hoy` (`fecha_posterior_a_hoy`) y ≥ apertura (`fecha_anterior_a_apertura`);
  - cada transacción marcada tiene un efecto en la cuenta, fecha ≤ `fechaEstado` (`transaccion_fuera_de_verificacion`, **nuevo**) y no está conciliada (`transaccion_ya_conciliada`).
  - Con `{ todas: true }` se marcan todas las candidatas: transacciones de la cuenta con fecha ≤ `fechaEstado` en estado pendiente o confirmada.
- **Hechos:**
  - F3 `conciliaciones` (`cuenta_id`, `fecha_estado`, `saldo_estado`, `terminada_en` = instante, `diferencia_aceptada` = saldoEstado − saldo(cuenta, fechaEstado), `modo = 'saldo'`).
  - F4 `transacciones` marcadas: `estado_bancario = 'conciliada'`, `conciliacion_id` (orden F3 → F4, como OP-47).
- **Avisos:** después y estado: AV-21 si la diferencia ≠ 0, con la propuesta de ajuste de FD-06.
- **Errores:** los de las precondiciones. Mensaje nuevo: `transaccion_fuera_de_verificacion` → "Esa transacción es posterior a la fecha que verificaste."
- **Preselección en la interfaz** (aprobado en P6-5): todas las candidatas preseleccionadas si la diferencia de la previsualización es exactamente cero; ninguna si no. Comparar con cero no es aritmética (PF-3).

**Reglas que se mantienen sin cambios:** los cambios posteriores (P12, N6, PC de 04 §3.0.4) funcionan igual para una conciliación de modo `saldo`; la diferencia actual se recalcula igual (DM-8).

#### 3.2.3 Columna `conciliaciones.modo` (confirmada como necesaria)

- **Qué:** `modo modo_conciliacion NOT NULL DEFAULT 'estado_cuenta'`, con el enum nuevo `modo_conciliacion` = `estado_cuenta`, `saldo`. Inmutable (`e_solo_insercion` ya impide actualizar la fila).
- **Por qué hace falta:** P11 define "conciliada" como verificada formalmente contra un estado de cuenta. Una verificación de saldo es más débil: no compara movimiento por movimiento. El usuario (detalle de cuenta, detalle de transacción) y la Fase 7 tienen que poder distinguir una de otra, y ningún otro hecho permite deducirlo.
- **Migración:** de expansión (03 §11.4): tipo nuevo y columna con valor por defecto en una migración generada; las filas existentes quedan como `estado_cuenta`.
- *Alternativa descartada:* sin columna. La pantalla diría "conciliada" igual para un estado completo que para un saldo escrito a mano.

#### 3.2.4 Consulta, ruta y pantalla (CF-01, a 04 §6.14 y 05)

- **Variante de `formulario`:** `{ operacion: 'verificar_saldo'; cuentaId: Uuid; fecha?: FechaLocal }` → contexto:

```ts
{
  cuenta: Ref & { tipo: 'efectivo' | 'tarjeta' };
  fecha: FechaLocal;                                    // la pedida o hoy
  candidatas: { cantidad: number; recientes: TransaccionFila[] };   // pendientes o confirmadas con fecha ≤ fecha; hasta 200 más recientes
  ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; modo: 'estado_cuenta' | 'saldo'; diferenciaActual: Centavos };
}
```

- **Ruta nueva:** `/cuentas/[cuentaId]/verificar-saldo` **[L]** (lista de transacciones para marcar), con `?fecha=` del catálogo de 05 §2.2. Cambiar la fecha reemplaza el parámetro (`router.replace`) y trae las candidatas de esa fecha, como en `/cuentas/[cuentaId]/cuota`.
- **Borrador** (05 §4.11): fecha, saldo escrito y marcas.
- **Detalle de cuenta** (04 §6.6): cada conciliación agrega `modo`. La pantalla la nombra "Estado de cuenta" o "Verificación de saldo" **(nuevo)**.
- La previsualización de OP-53 muestra el saldo de Finn y la diferencia con `ConfirmacionImpacto`.

#### 3.2.5 Ajuste propuesto por AV-21 (FD-06)

01 supuesto 11 dice que el ajuste "es un gasto o un ingreso que crea el usuario". En una tarjeta con menos deuda en el banco que en Finn, un gasto no reduce la deuda y un ingreso no puede ir a una tarjeta (OP-21 exige una cuenta de efectivo). Se precisa así (CF-01 a 01 supuesto 11), con d = saldo según el banco − saldo de Finn:

| Cuenta | d > 0 | d < 0 |
|---|---|---|
| Efectivo (el banco tiene más) | OP-21 ingreso por d | OP-20 gasto por \|d\|, con la categoría que elige el usuario |
| Tarjeta (d > 0: el banco muestra menos deuda) | OP-27b entrada a la tarjeta por d (se clasifica como ingreso, 01 §4.13) | OP-20 gasto con tarjeta por \|d\| |

- La propuesta se ofrece como **apertura del flujo** con valores iniciales (cuenta, fecha del estado, monto y comercio "Ajuste de conciliación" **(nuevo)**), nunca como un toque, porque un gasto necesita la categoría (FD-20).
- Vale igual para AV-21 después de OP-47.

### 3.3 F6-2 — Flujo de efectivo (FD-07, CF-02)

**Qué responde:** cuánto cambió el efectivo real en el período y por qué. Complementa "Lo que te quedó del período" (`remanente`, 04 §6.9.5), que cuenta las compras con tarjeta cuando se hacen y no es un flujo de caja.

**Fórmula [Propio]** (selector `seleccionar.reportes.flujoEfectivo`), por cada período p de la ventana W y con el filtro de cuentas K de 04 §6.9.1 restringido a cuentas de efectivo:
- **Saldo inicial** = Σ saldo(k, inicio(p) − 1 día) de las cuentas de efectivo (01 §4.3), incluidas las archivadas.
- **Saldo final** = Σ saldo(k, mín(fin(p), hoy)).
- **Filas:** cada efecto en una cuenta de efectivo con fecha en p va a exactamente una fila, según el tipo de su transacción:

| Fila | Efectos que suma | Signo |
|---|---|---|
| `saldos_iniciales` | `saldo_inicial` de cuentas abiertas en p | ± |
| `ingresos` | `ingreso`; excedente de un `cobro` en efectivo (01 §4.10) | + |
| `restituciones` | Restitución de un `cobro` en efectivo | + |
| `devoluciones` | `devolucion` en efectivo | + |
| `otras_entradas` | `desembolso_prestamo`, `retiro_inversion`, `avance_efectivo` | + |
| `gastos_debito` | `gasto` en efectivo, por la suma de sus líneas de categoría | − |
| `por_cobrar_debito` | `gasto` en efectivo, por la suma de sus líneas por cobrar | − |
| `pagos_tarjeta` | `pago_tarjeta` | − |
| `prestamos_inversiones` | `cuota_prestamo`, `abono_capital` y `aporte_inversion` desde efectivo | − |
| — | `transferencia` entre cuentas de efectivo: se anula dentro de K. Si K deja una de las dos cuentas fuera, el efecto va a `transferencias` (fila que solo aparece con filtro) | ± |

- **Identidad:** saldo inicial + Σ filas = saldo final (V6-03).
- **Dato complementario:** `comprasConTarjeta` = Σ consumos con tarjeta con fecha en p (01 §4.1.6). Explica por qué el efectivo bajó menos que lo gastado.
- **Acción (FD-17):** si en el período activo `comprasConTarjeta > pagos_tarjeta` y alguna tarjeta tiene S(t) > 0, el reporte termina con la propuesta "Reservar {S} para {tarjeta}" (OP-14 sobre pago(t), con la tarjeta de mayor S(t)). Si no, termina con el enlace "Ver Lo que te quedó del período".

```ts
interface FlujoEfectivoDto extends Encabezado {
  filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] };
  periodos: { periodo: PeriodoDto; saldoInicial: Centavos; saldoFinal: Centavos;
              filas: { fila: FilaFlujo; monto: Centavos }[];         // con signo
              comprasConTarjeta: Centavos }[];
  hallazgos: HallazgoDto[];                                             // 3.5.2
}
```

- **Ruta:** `/reportes/flujo-efectivo`, título "Flujo de efectivo" **(nuevo)**, con la explicación "Cuánto cambió el dinero de tus cuentas y por qué." **(nuevo)**.
- **Prioridad:** posterior (P6-6).

### 3.4 F6-3 — Unir deudores, diseño diferido (FD-08, CF-03)

**No se aplica al cerrar la Fase 6** (P6-7). En la primera versión, OP-52 (renombrar) cubre el caso de un nombre mal escrito. Queda diseñado para una fase posterior.

**OP-54 Unir deudores**
- **Entrada:** `origenId`, `destinoId`, `revisionVista`, `huellaImpacto`.
- **Idempotencia:** eliminación del origen (como OP-12).
- **Confirmación:** siempre, con la previsualización: cantidad de líneas por cobrar que pasan, saldo abierto que pasa y el nombre que queda.
- **Precondiciones:** origen ≠ destino.
- **Hechos:** F1 `lineas.deudor_id` y `movimiento_lineas.deudor_id` del origen al destino; F2 `deudores` del origen.
- **Efecto en números:** ninguno. El deudor no entra en ninguna fórmula de 01 §4; `porCobrar()` agrupa por deudor y solo cambia la agrupación.

**Choque con lo aprobado y su resolución propuesta.** 01 OP-28 dice que una línea con eventos no cambia de deudor [Propio], y 03 lo hace cumplir con `g_linea_con_eventos`. Unir deudores cambia exactamente eso.

| Documento | Cambio |
|---|---|
| 01 | OP-54 en §5.5; §1.5 (unir es la única forma de que una línea cambie de deudor); excepción explícita a la regla de OP-28, como la fusión de categorías es excepción a P4 |
| 03 | `g_linea_con_eventos` permite el cambio de `deudor_id` si `finn.operacion() = 'union_deudores'`; `finn.operacion` admite ese tercer valor |
| 04 | BE-14: tercer valor de `finn.operacion` (`union_deudores`) para OP-54; ficha de OP-54 en §3.5; orden del traductor (F1 reapunta, F2 elimina) |
| 05 | Ruta `/por-cobrar/deudores/[deudorId]/unir` **[C]**, previsualizar primero (FE-07) |

### 3.5 F6-4 — Reportes accionables

#### 3.5.1 Arquitectura (FD-09, CF-04)

- Cada fórmula es un selector puro de `@finn/dominio` (`seleccionar.reportes.ritmo`, `.realidad`, `.hormiga`, `.suscripciones`, `.tarjetas`, `.hallazgos`), que lee la instantánea, como BE-40. La consulta `reporte()` no calcula (inv. 27).
- Los selectores que agrupan por comercio reciben las reglas de comercio [H] como dato, como `topComercios` (BE-43).
- **Tipos nuevos de `reporte()`** (04 §6.9) y rutas de `/reportes/[tipo]` (05 §2.10):

| `tipo` | Ruta | Título **(nuevo)** | Ventana |
|---|---|---|---|
| `ritmo` | `/reportes/ritmo` | "Ritmo de gasto" | Período activo |
| `realidad` | `/reportes/realidad` | "Presupuesto contra la realidad" | Período activo frente a los 3 cerrados anteriores en que existía cada categoría |
| `hormiga` | `/reportes/hormiga` | "Gastos hormiga" | `?periodo=` (por defecto, el activo) |
| `suscripciones` | `/reportes/suscripciones` | "Suscripciones" | Los 4 últimos períodos cerrados |
| `tarjetas` | `/reportes/tarjetas` | "Tarjetas" | `?ventana=` (por defecto `ultimos-6`) |
| `hallazgos` | `/reportes/hallazgos` | "Hallazgos" | Período activo |
| `flujo_efectivo` | `/reportes/flujo-efectivo` | "Flujo de efectivo" | `?ventana=` (3.3) |

- `datos_base` sigue sin ruta (FD-24): las fórmulas no lo usan, porque no trae el vínculo de un consumo con su programada, el desglose por ciclo de facturación ni el período activo.

#### 3.5.2 Hallazgo: forma común (FD-17)

Todo reporte accionable devuelve, además de sus datos, una lista de hallazgos. Un hallazgo es una frase en voseo que dice qué pasa y cuánto, y una acción.

```ts
interface HallazgoDto {
  tipo: 'ritmo' | 'realidad' | 'promedio' | 'hormiga' | 'suscripcion' | 'tarjeta' | 'flujo';
  clave: string;                       // 'categoria:<id>', 'tarjeta:<id>', 'comercio:<clave BE-43>' (3.5.11)
  texto: string;                       // del servidor, voseo y formatos de 04 §7.10
  impacto: Centavos;                   // para ordenar (3.5.11)
  estado: 'advertencia' | 'problema' | 'deuda-sin-respaldo' | 'informacion';   // tabla de 05 §10.3
  categoria?: Ref; tarjeta?: Ref; comercio?: string;
  accion: { propuesta: Propuesta } | { enlace: DestinoHallazgo; texto: string };   // exactamente una
}
type DestinoHallazgo =
  | { pantalla: 'categoria'; categoriaId: Uuid }
  | { pantalla: 'actividad'; texto?: string; categoriaId?: Uuid;      // [R1] /actividad?texto= o ?categoria=,
      desde: FechaLocal; hasta: FechaLocal; montoHasta?: Centavos }   // con ?desde=, ?hasta= y ?monto-hasta= (05 §2.2)
  | { pantalla: 'programada'; programadaId: Uuid }
  | { pantalla: 'pagar_tarjeta'; tarjetaId: Uuid }      // /cuentas/[id]/pagar
  | { pantalla: 'reporte'; tipo: 'remanente' };
```

- **Acción concreta:** una propuesta de un toque (asignar, mover, ajustar una meta, crear una programada) o, si no hay una entrada que el servidor pueda armar completa, un enlace a la pantalla donde se resuelve (revisar la categoría, el comercio en Actividad o la programada).
- `estado` elige el indicador de 05 §10.3 (tres señales), sin estados nuevos. **[R4]** Sus valores son los **identificadores de estado** de 05 §10.3 (`advertencia`, `problema`, `deuda-sin-respaldo`, `informacion`), no las etiquetas: el estado `deuda-sin-respaldo` se muestra con la etiqueta "Deuda sin reservar" en una categoría o "Te falta reservar" en una tarjeta (05 §12.3).
- Los textos de cada tipo están en su sección y se agregan al catálogo de mensajes del servidor (04 §7.10).

#### 3.5.3 Definiciones y umbrales comunes (FD-18, FD-19)

**Definiciones** (todas [Propio], sobre la instantánea):
- **Gasto variable** de c en p: Σ m_k de los consumos de c en p (01 §4.1.6, netos de devoluciones D-1) cuya transacción **no** resolvió una ocurrencia esperada (no está en `ocurrencias_resueltas` como emparejada ni registrada).
- **Programadas pendientes** de c hasta fin(A): Σ de las líneas hacia c de las ocurrencias pendientes (01 §4.16) con fecha esperada ≤ fin(A), incluidas las atrasadas; cada una con el medio de la cuenta de su programada.
- **Días:** `diasTranscurridos` y `diasRestantes` del `PeriodoDto` activo (04 §6.0.2).
- **Períodos de comparación** de c: los 3 períodos cerrados más recientes anteriores al activo en que existía c (FD-27, 3.14). **[A1]**
- **Clave de comercio:** la de BE-43 (regla de comercio o comercio normalizado).
- **Categorías consideradas:** normales y activas. Las archivadas no generan hallazgos.

**Umbrales (FD-18).** Constantes de `@finn/dominio/reportes/umbrales.ts`, el único lugar donde se definen; las pruebas y la interfaz las importan de ahí si las necesitan para un texto.

| Constante | Valor | Uso |
|---|---|---|
| `DIAS_MIN_RITMO` | 7 | Ritmo: días transcurridos mínimos |
| `CONSUMOS_MIN_RITMO` | 3 | Ritmo: consumos variables mínimos en el período |
| `EXCESO_MIN` | $5.00 | Ritmo: exceso mínimo para un hallazgo |
| `EXCESO_MIN_PCT` | 5 % del fondo | Ídem (se usa el mayor de los dos) |
| `REAL_TOL_MIN` | $10.00 | Realidad: tolerancia mínima por período |
| `REAL_TOL_PCT` | 10 % de lo asignado | Ídem (el mayor) |
| `PROM_VAR_MIN` | $20.00 | Promedio: diferencia mínima |
| `PROM_VAR_PCT` | 25 % | Promedio: variación mínima |
| `HORMIGA_MONTO_MAX` | $10.00 | Hormiga: monto máximo por compra |
| `HORMIGA_CANT_MIN` | 5 | Hormiga: compras mínimas por grupo (comercio o categoría) en el período **[R1]** |
| `HORMIGA_TOTAL_MIN` | $20.00 | Hormiga: total mínimo |
| `SUSC_PERIODOS_MIN` | 3 de 4 | Suscripciones: períodos cerrados con el cobro |
| `SUSC_MONTO_PCT` | 10 % | Suscripciones: tolerancia del monto respecto de la mediana |
| `SUSC_DIAS` | 5 | Suscripciones: tolerancia del día del mes |
| `RITMO_INICIO_MAX` | 3 | Inicio: hallazgos de ritmo que se muestran (FD-21) |
| `HALLAZGOS_MAX` | 5 | Reporte Hallazgos: cantidad máxima |

- *Justificación:* valores fijos, verificados con A.7 (V6-01), sin preferencias nuevas (P6-10). `CONSUMOS_MIN_RITMO` salió de V6-01: sin él, Luz y agua (una factura al mes) se proyectaba como si se pagara a diario.

**Redondeo.** Mitad hacia arriba al centavo, una sola vez por cálculo, sobre la expresión exacta (no se redondea un valor intermedio). Las sugerencias de lo asignado se redondean al dólar entero.

**Reparto proporcional (FD-19).** Cuando un monto se reparte en proporción a pesos (por ejemplo, el exceso proyectado entre débito y cada tarjeta), cada parte es la proporcional truncada y los centavos que faltan van a las partes con el resto mayor (empate: el nombre del medio, con `debito` antes que las tarjetas por orden alfabético de su id). La suma es exacta y ninguna parte es negativa.
- *Justificación:* V6-02 encontró que redondear cada parte por separado dejaba −$0.01 en débito en 28 de 20.000 casos.
- *Alternativa descartada:* redondear las tarjetas y dejar el resto en débito (la versión que falló).

#### 3.5.4 Ritmo de gasto (FD-10)

Para cada categoría c del período activo A:
1. **Evaluable** si `diasTranscurridos ≥ DIAS_MIN_RITMO` y c tiene al menos `CONSUMOS_MIN_RITMO` consumos variables en A.
2. **Proyección del gasto variable:** `proyVar` = redondeo(gasto variable × diasRestantes / diasTranscurridos); 0 si no es evaluable.
3. **Disponible proyectado:** `dispProy` = Disp(c, A) − proyVar − programadas pendientes de c.
4. **Exceso:** máx(0, −dispProy).
5. **Hallazgo** si c es evaluable y exceso ≥ máx(`EXCESO_MIN`, `EXCESO_MIN_PCT` × máx(0, F(c, A))).

**Texto** (servidor, **nuevo**):
- Sin sobregiro actual: "Vas camino a pasarte {exceso} en {categoría} antes del {fin}."
- Con sobregiro actual: "Ya te pasaste {sobregiro} en {categoría} y, a este ritmo, llegarías a {exceso} el {fin}."
- `estado`: `problema` si el sobregiro proyectado es de débito en su mayor parte, `deuda-sin-respaldo` si es de tarjeta (3.5.5).

**Acción**, en este orden:
1. **Mover** (OP-15, un toque) desde la categoría o con el mayor `dispProy` ≥ exceso, que no tenga meta de ahorro (anual o para una fecha) ni Falta > 0 en su meta; empate por orden de grupo y categoría. Texto: "Mover {exceso} desde {o}".
2. Si no hay origen y LPA ≥ exceso: **asignar** (OP-14, un toque): `montoNuevo` = Asig(c, A) + exceso. Texto: "Asignar {exceso}".
3. Si no: enlace a la categoría. Texto: "Revisar {categoría}".

**Ejemplo con A.7 (V6-01):** "Ya te pasaste $26.30 en Restaurantes y, a este ritmo, llegarías a $55.56 el 20/10." Ninguna categoría tiene $55.56 proyectados de sobra sin meta de ahorro (Supermercado $5.42, Luz y agua $6.60) y Listo para asignar es $312.40, así que la acción es "Asignar $55.56".

#### 3.5.5 Proyección del cierre (FD-11)

Resume cómo terminaría el período activo si se mantiene el ritmo. Va en el mismo reporte `ritmo`, arriba de los hallazgos por categoría.

Para cada categoría, con los valores de 3.5.4:
- **Sobregiro proyectado** = exceso. **Adicional** = exceso − (SobT(c, A) + SobD(c, A)), siempre ≥ 0 (V6-02).
- **Futuro por medio:** proyVar repartido por el peso de cada medio en el gasto variable de c (FD-19), más cada programada pendiente con el medio de su cuenta.
- **Reparto del adicional** entre débito y cada tarjeta, en proporción al futuro por medio (FD-19). Las compras futuras van después de las existentes en el orden D2 (01 §4.5), así que todo el adicional queda sin cubrir.

Totales del período:
- **Categorías sobregiradas al cierre:** las de dispProy < 0.
- **Reducción proyectada de LPA** = Σ_c (SobD(c, A) + parte de débito del adicional) + Σ_t E(t, A).
- **Te falta reservar proyectado** por tarjeta = S(t) + Σ_c parte de t del adicional.
- **Sobrante proyectado** = Σ_c máx(0, dispProy).

**Texto** (servidor, **nuevo**): "Si seguís así, al cerrar el {fin}: {n} categorías sobregiradas, Listo para asignar bajaría {reducción} y te faltaría reservar {total} para tus tarjetas. Te sobrarían {sobrante} en otras categorías."

Con A.7: 2 categorías, $50.44, $43.62 (Visa Oro), $1,546.64.

**Acciones:** las de los hallazgos por categoría de 3.5.4, que este resumen encabeza.

```ts
interface RitmoDto extends Encabezado {
  periodo: PeriodoDto;
  proyeccion: { sobregiradas: number; reduccionLpa: Centavos; sobrante: Centavos;
                faltaReservar: { tarjeta: Ref; actual: Centavos; proyectado: Centavos }[] };
  categorias: { categoria: Ref; grupo: Ref; evaluable: boolean; gastoVariable: Centavos;
                proyeccionVariable: Centavos; programadasPendientes: Centavos;
                disponible: Centavos; disponibleProyectado: Centavos; exceso: Centavos }[];
  hallazgos: HallazgoDto[];
}
```

#### 3.5.6 Presupuesto contra la realidad (FD-12)

Para cada categoría c sin meta de ahorro, con sus 3 períodos de comparación (si tiene menos de 3, no se evalúa):
- **Tolerancia** de cada período q: máx(`REAL_TOL_MIN`, `REAL_TOL_PCT` × |Asig(c, q)|).
- **Siempre te pasás:** Gastado(c, q) > Asig(c, q) + tolerancia en los 3.
- **Siempre te sobra:** Gastado(c, q) < Asig(c, q) − tolerancia **y** Gastado(c, q) > 0 en los 3. La segunda condición excluye los fondos que se acumulan sin gastarse (V6-02).
- **Promedio gastado** = redondeo(Σ Gastado / 3). **Sugerido** = promedio redondeado al dólar entero.
- **Hallazgo** si se cumple una de las dos condiciones y Sugerido ≠ Asig(c, A).

**Texto** (**nuevo**):
- Te pasás: "En los últimos 3 períodos gastaste en promedio {promedio} en {categoría} y asignaste {asignadoPromedio}. ¿Ajustar a {sugerido}?"
- Te sobra: "En los últimos 3 períodos gastaste en promedio {promedio} en {categoría} y te sobró dinero cada vez. ¿Ajustar a {sugerido}?"

**Acción:** OP-14 de un toque sobre el período activo, `montoNuevo` = Sugerido. Texto: "Ajustar a {sugerido}". Si c tiene meta mensual o semanal, la acción es editar la meta (OP-18, `monto` = Sugerido), porque la meta es lo que pide el monto cada período; texto: "Ajustar la meta a {sugerido}". Si la propuesta dejaría LPA negativo, la confirmación de AV-11 aplica como en cualquier asignación.

**Ejemplo del producto §16 (V6-01):** asignado $150.00 y gastado $180.00, $175.00 y $185.00 → "¿Ajustar a $180.00?".

#### 3.5.7 Comparación con el promedio (FD-13)

Va en el mismo reporte `realidad`, como una segunda sección.

- **Gasto comparado:** en el período activo, Gastado(c, A) + proyVar + programadas pendientes (3.5.4); en un período cerrado, Gastado.
- **Promedio:** de los 3 períodos de comparación; si es ≤ 0 o hay menos de 3, no se evalúa.
- **Hallazgo** si |gasto − promedio| ≥ `PROM_VAR_MIN` y |gasto − promedio| / promedio ≥ `PROM_VAR_PCT`.
- **Variación** en puntos básicos (04 §6.0.3), calculada por el selector.

**Texto** (**nuevo**): "En {categoría} vas camino a {gasto} este período, {variación} más que tu promedio de {promedio}." (o "menos"). Con A.7: "En Restaurantes vas camino a $175.56 este período, 56.82% más que tu promedio de $111.95."

**Acción:** enlace a la categoría ("Revisar {categoría}"). Si la categoría también tiene hallazgo de ritmo, la regla de una fila por clave (3.5.11) deja solo el de ritmo, que trae la acción de un toque.

```ts
interface RealidadDto extends Encabezado {
  categorias: { categoria: Ref; grupo: Ref; periodos: { periodo: FechaLocal; asignado: Centavos; gastado: Centavos }[];
                promedioGastado: Centavos | null; sugerido: Centavos | null;
                gastoComparado: Centavos; variacion: number | null }[];      // puntos básicos
  hallazgos: HallazgoDto[];
}
```

#### 3.5.8 Gastos hormiga (FD-14) **[R1]**

En el período elegido (por defecto, el activo):
- **Compras pequeñas:** transacciones de tipo `gasto` con total ≤ `HORMIGA_MONTO_MAX` que no resolvieron una ocurrencia esperada.
- **Dos agrupaciones [R1]:**
  - **por comercio:** clave de BE-43; cada compra cuenta una vez, por la suma de sus líneas de categoría;
  - **por categoría:** cada compra cuenta en cada categoría a la que tiene una línea, por el monto de esa línea. Así aparece el ejemplo del producto ("12 compras en cafeterías"), que son muchos comercios distintos y por comercio nunca llegaría al umbral.
- **Monto del grupo:** lo anterior menos las devoluciones vinculadas a esas líneas con fecha en el período (como `top_comercios`, 04 §6.9.2).
- **Hallazgo** por grupo si tiene al menos `HORMIGA_CANT_MIN` compras y suma al menos `HORMIGA_TOTAL_MIN` (los mismos umbrales para las dos agrupaciones).
- **Solapamiento [R1]:** un grupo de comercio y uno de categoría tienen claves distintas (`comercio:…` y `categoria:…`), así que la regla de una fila por clave de 3.5.11 no los une por sí sola. Por eso el selector los deduplica antes: si dos hallazgos de hormiga comparten al menos una compra, queda el de mayor impacto (el total); a igual total, el de categoría. Es la misma regla de 3.5.11 ("queda el de mayor impacto") aplicada a las compras compartidas.
- La categoría de un hallazgo de hormiga usa la clave `categoria:<id>`: en el reporte Hallazgos compite con los de ritmo, realidad y promedio de esa misma categoría (3.5.11).

**Texto** (**nuevo**):
- Por comercio: "{n} compras en {comercio} este período: {total}."
- Por categoría [R1]: "{n} compras pequeñas en {categoría} este período: {total}." Ejemplo del producto: "12 compras pequeñas en Cafés y antojos este período: $64.08."

**Acción** (enlace a Actividad con el período y el tope de monto, para que la lista muestre exactamente esas compras):
- Por comercio: `/actividad?texto={etiqueta}&tipo=gasto&desde={inicio}&hasta={fin}&monto-hasta=10.00`. Texto: "Ver las compras".
- Por categoría [R1]: `/actividad?categoria={id}&tipo=gasto&desde={inicio}&hasta={fin}&monto-hasta=10.00`. Texto: "Ver las compras".
- **[R4] Qué muestra el enlace:** las compras pequeñas del período en ese comercio o esa categoría. `&tipo=gasto` deja fuera devoluciones, ingresos y otros tipos. Puede incluir, además de las del hallazgo, gastos pequeños que resolvieron un pago programado (hormiga los excluye y Actividad no tiene ese filtro) y, en el enlace por comercio, transacciones cuya nota contiene el texto (`?texto=` busca en comercio y nota, 04 §6.7.1). No se agrega un filtro nuevo a Actividad: la diferencia es visible (la fila lleva la marca de programada) y no cambia ningún número.
- Todos los parámetros ya están en el catálogo de 05 §2.2.

```ts
interface HormigaDto extends Encabezado {
  periodo: PeriodoDto; navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };
  grupos: { agrupacion: 'comercio' | 'categoria';                    // [R1]
            clave: string; etiqueta: string; porRegla?: boolean; categoria?: Ref;
            compras: number; total: Centavos; categoriaPrincipal?: Ref }[];   // grupos con al menos 2 compras pequeñas, por total
  hallazgos: HallazgoDto[];
}
```

#### 3.5.9 Suscripciones detectadas (FD-15)

Sobre los 4 últimos períodos cerrados, por clave de comercio y con las transacciones de tipo `gasto`:
- **Mediana del monto** y **mediana del día del mes** de todas sus transacciones en esos períodos (mediana baja si hay un número par).
- **Período con cobro:** tiene al menos una transacción con monto a no más de `SUSC_MONTO_PCT` de la mediana y día a no más de `SUSC_DIAS` de la mediana del día.
- **Detectada** si hay al menos `SUSC_PERIODOS_MIN` períodos con cobro y ninguna programada activa tiene ese comercio (comparado con la clave de BE-43).
- **Programada desactivada [R1]:** si una programada **desactivada** tiene esa clave de comercio, la detección se marca como "desactivada" y la acción es reactivarla, no crear otra. Si hay varias, se propone la de resolución más reciente (la última ocurrencia emparejada o registrada); sin resoluciones, la de primera fecha más reciente.
- **Costo:** mensual = mediana; anual = 12 × mediana.
- Las programadas activas de tipo `gasto` también se listan, con su costo anual, en una sección aparte ("Ya programadas" **(nuevo)**).

**Texto** (**nuevo**):
- Sin programada: "{comercio} te cobra {mensual} cada mes ({anual} al año) y no la tenés programada."
- Con una programada desactivada [R1]: "{comercio} te sigue cobrando {mensual} cada mes, pero su programada está desactivada."

**Acción:**
- **[R1] Con una programada desactivada:** OP-42 de un toque con `{ programadaId, activa: true }`. Texto: "Reactivarla". Salida para revertir: OP-42 con `activa: false` (ya está en la tabla de 05 §4.14). **[R3]** Al reactivar, solo cuentan las ocurrencias desde ese día (`reactivada_desde`, CF-20, P6-20).
- Sin programada, si la categoría de la última transacción está activa: OP-42 de un toque, que crea la programada (tipo `gasto`, cuenta y comercio de la última transacción, monto = mediana, tolerancia = la mayor diferencia observada respecto de la mediana, frecuencia mensual, primera fecha = la siguiente fecha esperada, una línea a esa categoría, sin registro automático). Texto: "Programarla". La salida para revertir es OP-51 (FD-20).
- Si no: la misma propuesta como apertura del flujo `/programadas/nueva` con esos valores iniciales.
- En "Ya programadas": enlace a la programada ("Revisar").

```ts
interface SuscripcionesDto extends Encabezado {
  detectadas: { clave: string; etiqueta: string; mensual: Centavos; anual: Centavos; dia: number;
                periodosConCobro: number; cuenta: Ref; categoria: Ref | null;
                programadaDesactivada?: Ref }[];                                   // [R1]
  programadas: { programada: Ref; comercio: string; mensual: Centavos; anual: Centavos; frecuencia: Frecuencia }[];
  hallazgos: HallazgoDto[];
}
```

`mensual` de una programada no mensual se presenta convertida por el selector (semanal × 52 / 12, quincenal × 26 / 12, anual / 12, cada N días × 365 / N / 12), con el redondeo de 3.5.3.

#### 3.5.10 Tarjetas en el tiempo (FD-16)

Por cada tarjeta y cada ciclo de facturación cuyo **día de pago** ya pasó (fecha de pago < hoy) y cae en la ventana:
- **Corte** c0 y **fecha de pago** fp: la primera fecha posterior a c0 con el día de pago de la tarjeta, recortada al fin de mes (01 §4.14, supuesto 19).
- **Deuda del estado** = máx(0, −saldo(t, c0)).
- **Pagado a tiempo** = Σ efectos positivos en t con fecha en (c0, fp]. **[R1]** Es exactamente el "ya pagado" de 01 §4.14 ("Σ efectos positivos en t con fecha en (c₀, f]") con f = fp, y la misma cifra que usa 01 para el "monto para no generar intereses". 01 cuenta **todos** los efectos positivos, no solo los pagos: pagos de tarjeta (OP-23), devoluciones con tarjeta (OP-33), entradas a la tarjeta como cashback (OP-27b), cobros depositados en la tarjeta (OP-31) y la parte que recibe la tarjeta en una transferencia de deuda (OP-27c). Todos reducen lo que el banco cobra en ese corte, así que la definición se mantiene; el reporte la llama "Pagado o acreditado a tiempo" **(nuevo)** para que el texto no diga "pagado" cuando hubo una devolución.
- **Arrastre** = máx(0, deuda del estado − pagado a tiempo). "Pagás el total" si es 0.
- Además, por período del presupuesto: cargos, pagos y deuda al fin (los de `datos_base.tarjetasPorPeriodo`).

**Hallazgo** si el último ciclo evaluado tiene arrastre > 0.

**Texto** (**nuevo**): "Con {tarjeta} quedaron {arrastre} sin pagar del corte del {corte}: esa deuda puede generar intereses." Si todos los ciclos están en 0: "Con {tarjeta} pagás el total cada mes." (informativo, sin hallazgo).

**Acción:** si S(t) > 0, OP-14 de un toque sobre pago(t) en A con `montoNuevo` = Asig + S(t); texto "Reservar {S}". Si no, enlace a pagar la tarjeta; texto "Pagar {tarjeta}".

```ts
interface TarjetasDto extends Encabezado {
  filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] };
  tarjetas: { tarjeta: Ref;
              ciclos: { corte: FechaLocal; fechaPago: FechaLocal; deudaEstado: Centavos;
                        pagadoATiempo: Centavos;                 // [R1] "ya pagado" de 01 §4.14 con f = fecha de pago
                        arrastre: Centavos }[];
              periodos: { periodo: FechaLocal; cargos: Centavos; pagos: Centavos; deudaAlFin: Centavos }[];
              pagaElTotal: boolean }[];
  hallazgos: HallazgoDto[];
}
```

#### 3.5.11 Hallazgos (FD-17)

El reporte `hallazgos` junta los de ritmo, realidad, comparación con el promedio, hormiga, suscripciones y tarjetas del período activo:
- **Una fila por clave:** si una clave tiene varios hallazgos, queda el de mayor impacto; a igual impacto, el de menor orden de tipo. **[R1]** Antes, los hallazgos de hormiga de comercio y de categoría que comparten compras ya se deduplicaron con el mismo criterio (3.5.8).
- **Impacto:** ritmo, el exceso; realidad, |Sugerido − Asig(c, A)|; promedio, |gasto − promedio|; hormiga, el total; suscripción, el costo mensual; tarjeta, el arrastre.
- **Orden:** impacto descendente; después, orden de tipo (ritmo, tarjeta, realidad, suscripción, hormiga, promedio); después, la clave.
- **Máximo:** `HALLAZGOS_MAX`.
- Sin hallazgos: estado vacío "Todo en orden: no encontramos nada que ajustar este período." **(nuevo)**.

#### 3.5.12 Verificación con A.7 (V6-01)

| Categoría | Gasto variable | Consumos | Evaluable | Proyección | Disp. actual | Disp. proyectado | Hallazgo |
|---|---|---|---|---|---|---|---|
| Supermercado | $287.15 | 4 | Sí | $57.43 | $62.85 | $5.42 | No |
| Luz y agua | $58.40 | 1 | No | — | $6.60 | $6.60 | No |
| Internet y teléfono | $45.00 | 1 | No | — | $0.00 | $0.00 | No |
| Restaurantes | $146.30 | 6 | Sí | $29.26 | −$26.30 | −$55.56 | Sí (umbral $6.00) |
| Gasolina | $98.75 | 4 | Sí | $19.75 | −$18.75 | −$38.50 | Sí (umbral $5.00) |
| Netflix | $0.00 (la programada pendiente $15.49) | 0 | No | — | $15.49 | $0.00 | No |
| Fondo de emergencia, Viaje | $0.00 | 0 | No | — | $1,350.00; $184.62 | Iguales | No |

A.7 no da el detalle de los consumos de Supermercado y Gasolina; la prueba usa consumos que suman lo de A.7 (Supermercado con tres en Visa Oro y uno con débito; Gasolina con cuatro en Visa Oro). Proyección del cierre: Restaurantes reparte su adicional de $29.26 en $5.12 Visa Oro y $24.14 débito; Gasolina, $19.75 Visa Oro. Te falta reservar proyectado: $18.75 + $5.12 + $19.75 = $43.62. Reducción de LPA: $26.30 + $24.14 = $50.44.
**[F7]** **CT-07.** Los consumos de Supermercado y Gasolina ya no se suponen: los define la semilla `estado-a7` (Supermercado: $92.40, $88.60 y $35.00 con Visa Oro y $71.15 con débito; Gasolina: $21.40, $24.10, $23.25 y $30.00 con Visa Oro). V6-01 se repitió sobre la semilla completa (V7-16): todos los números de esta tabla y de CA-62.1, CA-62.2 y CA-63.3 salen iguales. Detalle en `07-pruebas.md` §28.

### 3.6 `Propuesta` extendida (FD-20, CF-05)

04 §3.0.3 (CP-8) define `Propuesta` como unión cerrada. Se extiende así:

```ts
interface Propuesta {
  aviso: 'AV-08' | 'AV-14' | 'AV-21' | 'AV-22' | 'regla_comercio' | 'hallazgo';
  texto: string;
  operacion: 'OP-11' | 'OP-14' | 'OP-15' | 'OP-18' | 'OP-20' | 'OP-21' | 'OP-27' | 'OP-41' | 'OP-42';
  ejecucion: 'un_toque' | 'abrir_flujo';
  entrada: Record<string, unknown>;   // un_toque: entrada completa, validada por su contrato (como hoy);
                                      // abrir_flujo: valores iniciales del flujo
}
```

| Propuesta | Operación | Ejecución | Entrada que arma el servidor | Salida para revertir (05 §4.14) |
|---|---|---|---|---|
| Hallazgo de ritmo: mover | OP-15 | Un toque | `origenId`, `destinoId`, `periodoInicio` = A, `monto` = exceso, `esperado` de las dos asignaciones | OP-15 con origen y destino intercambiados |
| Hallazgo: asignar o reservar | OP-14 | Un toque | `montoNuevo` = Asig + monto, `esperado.monto` = Asig | OP-14 con los valores intercambiados (como AV-08) |
| Hallazgo de realidad: ajustar asignación | OP-14 | Un toque | `montoNuevo` = Sugerido | Ídem |
| Hallazgo de realidad: ajustar meta | OP-18 (editar) | Un toque | `metaId`, `monto` = Sugerido, `esperado.monto` | OP-18 con los valores intercambiados |
| Hallazgo de suscripción | OP-42 (crear) | Un toque o abrir flujo (3.5.9) | La programada completa | OP-51 eliminar con el id creado |
| Hallazgo de suscripción con programada desactivada **[R1]** | OP-42 (`activa`) | Un toque | `{ programadaId, activa: true }` | OP-42 con `activa: false` |
| AV-21 ajuste (FD-06) | OP-20, OP-21 u OP-27 (`entrada`) | Abrir flujo | Cuenta, fecha, total, comercio "Ajuste de conciliación" | — |
| AV-08, AV-14, AV-22, regla de comercio | Sin cambios (CP-8) | Un toque | Sin cambios | Sin cambios |

- **Abrir el flujo:** la interfaz escribe los valores iniciales como borrador del flujo de destino (05 §4.11, el mismo mecanismo del traspaso de FE-25) y navega a su ruta: OP-20 → `/registrar/gasto`, OP-21 → `/registrar/ingreso`, OP-27 → `/registrar/entrada-tarjeta`, OP-42 → `/programadas/nueva`. No hace falta ningún parámetro de búsqueda nuevo.
- La interfaz nunca calcula ni modifica la entrada de una propuesta de un toque (PF-3).
- **Impacto:** 04 §3.0.3 y §6.0.3 (el tipo); 05 §4.13 (ejecución por tipo) y §4.14 (filas de la tabla de salidas para revertir).

### 3.7 Hallazgos de ritmo en Inicio (FD-21, CF-06)

`InicioDto.atencion` (04 §6.1) agrega:

```ts
hallazgosRitmo: HallazgoDto[];        // los RITMO_INICIO_MAX de mayor impacto de 3.5.4; sin push
pagosTarjetaProximos: { tarjeta: Ref; fechaPago: FechaLocal; paraNoGenerarIntereses: Centavos }[];   // FD-22
```

- Se muestran dentro de "Necesita tu atención" con su acción.
- El bloque "Todo al día" (05 §2.3) exige además que `hallazgosRitmo` y `pagosTarjetaProximos` estén vacíos.
- El cálculo es el selector de 3.5.4: Inicio y el reporte `ritmo` muestran el mismo número (error 11).

### 3.8 Recordatorio de pago de tarjeta (FD-22, CF-07)

- **Cuándo:** la tarea diaria (04 §10), para cada tarjeta abierta, toma su próxima fecha de pago fp ≥ hoy (`proximoPago`, 04 §6.5). Si fp − hoy ≤ 3 días y `paraNoGenerarIntereses` a hoy > 0, y no existe una notificación de motivo `pago_tarjeta_proximo` con `datos.tarjetaId` = t y `datos.fechaPago` = fp, registra la notificación y envía el push. Así queda una por tarjeta y ciclo (deduplicada).
- **Política** (04 §11.2): push sí; urgencia `normal`; TTL hasta fp; `topic` y `tag` = `tarjetas` (valor nuevo de `CargaPush.etiqueta`, CP-18); sin acciones.
- **Contenido** (04 §11.4): "{tarjeta}: tu fecha de pago es el {fp}. Revisá cuánto pagar para no generar intereses." **(nuevo)**. Sin el monto: 11.4 prohíbe saldos en el push, y el monto para no generar intereses se deriva de la deuda. El monto se ve en la app. **[R4]** Es la aplicación de FD-31 (0.15), la regla única para cierre, tarjeta y cuota: el push lleva el importe de un movimiento o de un cambio ya ocurrido (la reducción aplicada al cierre, como en el ejemplo de 04 §11.4; el monto de una cuota, 3.16), nunca una cifra del estado vigente de una cuenta o de la deuda.
- **Destino:** `{ pantalla: 'cuenta'; cuentaId: Uuid }` (nuevo en `DestinoNotificacion`) → `/cuentas/[cuentaId]` (05 §3.5).
- **Inicio:** `atencion.pagosTarjetaProximos` con la misma condición (fp − hoy ≤ 3 y monto > 0), sin depender de la notificación.
- **Base de datos:** `notificaciones.motivo` es texto (03), así que no hace falta migración para el motivo. **[A1]** Se registra con `aviso = null` (FD-26).

### 3.9 Plantilla de grupos y categorías (FD-23, CF-08)

#### 3.9.1 Comportamiento

- **Cuándo se ofrece:** desde el paso "Crear las categorías" de los Primeros pasos (3.15) y en `/presupuesto/estructura` mientras no exista ninguna categoría normal (dato de `estructura()`). Siempre es opcional. **[B1]**
- **Ruta nueva:** `/presupuesto/estructura/plantilla` **[L]**, con la consulta `estructura()`.
- **Edición antes de aplicar:** la lista se muestra agrupada; el usuario puede quitar grupos o categorías, renombrarlos y agregar otros. Nada se guarda hasta "Crear {n} categorías" **(nuevo)**.
- **Aplicación [B1] (P6-19, CF-19):** OP-07 en **lote**, sin operación de dominio nueva.
  - **Entrada de la variante:** `{ elementos: { id: Uuid; tipo: 'grupo' | 'categoria'; nombre: TextoLimpio; grupoId?: Uuid }[] }`, de 1 a 15 elementos por llamada. Cada `id` es el de creación del elemento (04 §4.6.1). La categoría lleva en `grupoId` el id de su grupo: el de un grupo existente o el id de creación de un grupo de la misma plantilla, que ya fue creado en una tanda anterior o antes en la misma.
  - **Ejecución:** la acción recorre los elementos en orden y ejecuta un `escribir()` por elemento, en serie, cada uno con su propia transacción, igual que OP-38 con el lote de la Bandeja (04 §4.8). No es atómica en conjunto: un elemento que falla (por ejemplo, `nombre_repetido`) no detiene los demás.
  - **Salida:** por elemento, `{ id, resultado: 'creado' | 'ya_aplicada' | ErrorFinn }`, en el orden de la entrada. Si falla un grupo, sus categorías de esa tanda responden con el motivo del grupo y no se intentan.
  - **Tandas:** la pantalla divide la lista en 4 tandas de hasta 12 elementos (3 si caben en 36 o menos), siempre con los grupos antes que sus categorías, y llama a la acción una vez por tanda. Entre tandas actualiza el avance ("Creando tu plantilla: 24 de 47…" **(nuevo)**) en la región `status` del marco (05 §11.3). La revalidación (`revalidatePath('/', 'layout')`) se hace una vez por tanda.
  - **Reanudación:** los ids de creación se generan al tocar "Crear" y se guardan en el borrador del flujo (05 §4.11) antes de la primera tanda. Si se corta, al volver se reenvían los elementos sin resultado con los mismos ids; lo ya creado responde `ya_aplicada` (04 §4.6.1). **Solo si no hay borrador** (otra pestaña, almacenamiento no disponible), la pantalla compara los nombres con `estructura()` (sin mayúsculas, dentro de su grupo) y no envía los que ya existen.
  - **Tiempo:** V6-05 midió el lote completo en 18.9 s con 400 ms por escritura y en 7.2 s con 150 ms, en el perfil 4G. Las 3 idas y vueltas adicionales de las tandas suman unos 0.6 s (V6-05: unos 190 ms cada una), lo que deja el peor caso en unos 19.5 s, dentro de 20 s. Es una estimación a partir de esas mediciones; la Fase 7 la repite con la aplicación real.
  - **Tamaño del cuerpo:** 15 elementos con nombres de hasta 80 caracteres ocupan menos de 4 KB, muy por debajo del límite de 04 §2.2.4.
- **Textos de la plantilla:** en `src/textos/plantilla.ts` (05 §12). No es un dato del servidor ni de la base.
- *Alternativas descartadas:* una operación nueva que cree todo en una transacción (agrega una operación de dominio y el usuario pidió no crearla); **[B1]** una acción por elemento (27.9 s en el peor caso, V6-05); un solo lote sin tandas (18.9 s sin ningún avance visible).

#### 3.9.2 Contenido propuesto

Grupos y categorías típicos de un presupuesto personal en El Salvador, en dólares. Los nombres son genéricos (sin marcas) para que sirvan con cualquier proveedor. "Pagos de tarjeta" ya existe (03 §9.3) y no forma parte de la plantilla.

| Grupo | Categorías |
|---|---|
| Vivienda | Alquiler o cuota de vivienda · Energía eléctrica · Agua · Internet y teléfono · Gas · Mantenimiento del hogar |
| Vida diaria | Supermercado · Mercado y tienda · Farmacia · Cuidado personal · Ropa y calzado |
| Transporte | Gasolina · Transporte y taxis · Parqueo · Mantenimiento del vehículo |
| Comida fuera | Restaurantes · Cafés y antojos |
| Salud | Consultas y exámenes · Seguro médico |
| Suscripciones | Streaming · Apps y servicios digitales |
| Familia y compromisos | Apoyo a la familia · Regalos · Donaciones · Mascota |
| Educación | Colegiatura · Cursos y libros |
| Entretenimiento | Salidas · Deporte y gimnasio · Pasatiempos |
| Finanzas | Intereses y comisiones · Cuota de préstamo · Aporte a inversión |
| Ahorro | Fondo de emergencia · Gastos anuales · Viaje |

- 11 grupos y 36 categorías: 47 elementos. **[R1]** La Parte A decía 40 categorías; V6-05 contó los elementos al construir la prueba.
- "Intereses y comisiones" y "Cuota de préstamo" son las que nombran P8 y P3 de 00.
- "Gastos anuales" cubre los pagos de una vez al año (tarjeta de circulación, declaración de renta, seguros anuales), pensada para una meta anual.
- La plantilla no crea metas: se crean después, desde la categoría (FT-17).

### 3.10 `datos_base` (FD-24, CF-09)

`datos_base` (04 §6.9.4) queda sin ruta (ya lo dice 05 §1.3) como **insumo de pruebas**: la Fase 7 lo usa para comprobar que los selectores de 3.5 coinciden con los datos base donde se superponen (por ejemplo, `tarjetasPorPeriodo` frente a `TarjetasDto.periodos`). CF-09 cambia la frase de 04 §6.9.4 "la Fase 6 define los cálculos …" por una referencia a 3.5 de este documento.

### 3.11 Puntos a reconciliar con el diseño (R-1 a R-8)

| R | Tratamiento | Dónde |
|---|---|---|
| R-1 Tema por `data-theme` | **CF-10:** next-themes con `attribute="data-theme"`, `value={{ light: 'claro', dark: 'oscuro' }}`, `defaultTheme="system"`, `enableSystem`; la variante de Tailwind pasa a `@custom-variant dark (&:where([data-theme=oscuro], [data-theme=oscuro] *))`. `tokens.css` queda como lo entregó el diseño (claro por defecto, oscuro por `data-theme` o por preferencia del sistema). Cambia 05 §10.1 y §10.6, y la prueba de temas de 05 §14.1 (`colorScheme: 'dark'` sigue sirviendo porque next-themes resuelve el sistema) | 0.7 |
| R-2 Variables sin prefijo | **CF-11:** 05 §10.1 adopta los nombres de `tokens.css` sin el prefijo `--finn-` (`--superficie`, `--radio-control`…). El puente de `@theme inline` las expone igual (`--color-superficie: var(--superficie)`). No chocan con los espacios de nombres de Tailwind 4 (`--color-*`, `--text-*`, `--radius-*`, `--spacing`, `--shadow-*`, `--ease-*`); `--spacing` toma el valor de `--espacio-1` | 0.7 |
| R-3 Roles como clases `.t-<rol>` | **CF-12:** los roles se generan como utilidades `@utility text-<rol>` desde `tokens.json` (`tipografia`), con fuente, tamaño, interlineado, peso, ancho (`font-stretch`), cifras tabulares y mayúsculas. Se conservan los nombres de 05 §10.4 (`text-cifra-principal`…) y se agrega `text-rotulo`. Las clases `.t-*` de `tokens.css` no se copian al proyecto, para que haya una sola fuente. La regla de movimiento reducido de `tokens.css` y la de `globals.css` (05 §11.6) se dejan en una sola, la de `globals.css` | 0.7 |
| R-4 Signo U+2212 | **[A1]** Resuelta en P6-16: FD-25, CF-15 | 3.12 |
| R-5 Panel de notificaciones desde arriba | **[R4]** Resuelta en P6-24: CF-23 | 0.15 |
| R-6 Contenido de Notificaciones | **[R4]** Resuelta en P6-25: `pago_tarjeta_proximo` (CF-07) y `cuota_proxima` (CF-24); los otros avisos del diseño quedan fuera; ejemplos ajustados en §5 | 0.15 |
| R-7 Arrastrar un movimiento a una categoría | **[R3]** Resuelta en P6-23 (decisión del usuario): entra en la primera versión como FT-78, con FD-30, CF-21 y CF-22. La nota de la pantalla de la Bandeja se conserva (§5, Parte E) | 0.13 |
| R-8 Componentes visuales propios | **CF-13:** se registran en 05 §10.8 como componentes de dominio. La lista y sus props, con la comparación pantalla por pantalla, van en la Parte E (§5), porque dependen de qué datos tiene cada DTO | 0.7 |

### 3.12 Signo menos al mostrar montos (FD-25, CF-15) **[A1]**

**Decisión (P6-16).** Los montos negativos se **muestran** con el signo menos U+2212 (`−$26.30`), como en el diseño. Se aplica en los dos módulos que ya concentran el formato:

| Dónde | Cambio |
|---|---|
| 05 §5.4, `formatearMonto` (y `formatearMontoTexto`) | Arma el texto con `formatToParts` y reemplaza la parte `minusSign` por U+2212. Sigue sin flotantes (entrada en texto decimal) |
| 05 §10.8, `Monto` (FE-45) | Sin cambios de contrato: el texto visible lleva U+2212 y queda fuera del árbol de accesibilidad; el texto accesible sigue siendo "menos $X" (`formatearMontoAccesible`) |
| 04 §7.10, formato de mensajes del servidor | Todo texto que se muestra en pantalla o en una notificación (errores, rechazos, avisos, propuestas, hallazgos, títulos y cuerpos de push, 04 §11.4) usa U+2212 |
| 05 §5.2, `limpiarPegado` | Además del guion, acepta U+2212 y U+2013 (raya corta) al inicio del texto pegado como signo negativo, para que un monto copiado de la propia app se pegue bien |
| Exportaciones (OPT-08, 04 §16) | **Sin cambios:** el CSV escribe montos con el guion ASCII y el JSON los escribe como enteros en centavos, porque los leen otros programas |
| Entrada de montos | Sin cambios: el signo nunca se escribe en el texto (05 §5.2); los contratos (`montoTextoConSigno`, 04 §13.3) siguen aceptando solo el guion ASCII |
| Pruebas | Las salidas fijadas de V5-02 y la prueba E2E de formatos (05 §5.4) pasan a `−$45.00`; se agrega un caso que comprueba que la exportación CSV mantiene `-45.00` |

- **Justificación:** con cifras tabulares, el guion es más angosto que un dígito y desalinea las columnas de montos; U+2212 tiene el ancho del signo más. El cambio queda en los dos módulos que existen justamente para que el formato cambie en un solo lugar (04 §7.10, 05 §5.4).
- **Alternativa descartada:** mantener el guion y pedir el ajuste al diseño (columnas desalineadas en Presupuesto, Actividad y las tablas de los reportes).
- **Lectores de pantalla:** sin cambio. V5-25 ya comprobó que el texto visible de `Monto` no entra en el árbol de accesibilidad; los mensajes del servidor que contienen montos dentro de una frase se leen con U+2212, que NVDA, VoiceOver y TalkBack leen como "menos" con la puntuación por defecto (se agrega a la lista de comprobación manual de 05 §11.10).

### 3.13 `notificaciones.aviso` y revisión de 03 frente a 04 (FD-26, CF-16) **[A1]**

#### 3.13.1 Decisión (P6-17)

`notificaciones.aviso` admite nulo. Los motivos que no corresponden a un aviso del dominio (01 §5.0.7) se registran con `aviso = null`.

| Documento | Cambio |
|---|---|
| 03 §3.28 | `aviso`: Nulo **Sí**; significado "Aviso del catálogo de §5.0.7, o nulo si el motivo no es un aviso del dominio (cierre de período, sistema, recordatorio de pago)". El `CHECK (aviso ~ '^AV-[0-9]{2}$')` no cambia: ya acepta `NULL` |
| 03 §10 | Migración nueva generada `AAAAMMDDHHMMSS_g_notificaciones_aviso_nulo` con `ALTER TABLE finn.notificaciones ALTER COLUMN aviso DROP NOT NULL`. Es de expansión (03 §11.4): el código anterior siempre escribe un aviso, así que convive sin problemas |
| 03 §10 (Prisma) | `aviso String?` en el modelo `Notificacion` |
| 04 §11.2 | Columna "Aviso": los motivos con "—" se registran con `aviso = null`; se agrega la fila `pago_tarjeta_proximo` (FD-22) |
| 04 §11.1 | El mapa **motivo → aviso** deja de estar solo en la tabla de 11.2 y pasa a ser una constante exportada de `@finn/aplicacion/push/motivos.ts` (`MOTIVOS`, un registro por motivo con su aviso o nulo, push, urgencia, TTL y etiqueta), de la que salen 11.2 y la prueba de 3.13.2. `MotivoNotificacion` es una unión cerrada |
| 04 §14.1 | La prueba de 3.13.2 entra en el job de integración de CI |

*Alternativa descartada:* agregar avisos al catálogo de 01 (AV-25 cierre, AV-26 sistema, AV-27 pago próximo). Cambia el dominio para cosas que no son reglas de negocio; 01 §0.2 deja el centro de notificaciones fuera del dominio.

#### 3.13.2 Prueba que evita esta clase de error

V6-04 reprodujo el error: con el esquema aprobado, 7 de los 17 motivos fallan al insertarse (`23502`); **[R4]** con `cuota_proxima`, 8 de 18. La prueba permanente (Fase 7 la escribe; la Fase 8 la deja en CI) es una **prueba de catálogo contra el esquema real**:

1. Corre contra la base de CI con todas las migraciones aplicadas (`prisma migrate deploy`), no contra un subconjunto.
2. **Se genera desde los catálogos del código**, no desde una lista escrita a mano: recorre `MOTIVOS` (3.13.1) e inserta una notificación por motivo con su `aviso`, un `titulo`, un `cuerpo` y un `datos.destino` válido para su tipo de `DestinoNotificacion`, como lo haría `posteriores()` (04 4.9). Un motivo nuevo queda cubierto sin tocar la prueba.
3. Hace lo mismo con los demás catálogos de texto que la aplicación escribe en tablas técnicas: los pares `origen`/`nivel` del catálogo de eventos (04 §15.2, constante exportada en `@finn/aplicacion/observabilidad/eventos.ts`) y los dos valores de `conciliaciones.modo` (CF-01).
4. Inserta como `finn_app`, dentro de una transacción que se revierte, y espera cero errores.
5. Control negativo: un aviso mal formado (`AV-1`) y un origen inexistente deben ser rechazados.

V6-04 es la primera versión de esa prueba (con los catálogos copiados a mano, porque el código todavía no existe).

#### 3.13.3 Revisión de las demás columnas de 03 frente a 04

Criterio: toda columna `NOT NULL` o con `CHECK` de una tabla que la aplicación escribe, comparada con los valores que 04 dice que escribe en ella. Las tablas [M] ya las cubrían V-16 y los escenarios de 04 §18 sobre el subconjunto, y la prueba obligatoria de 04 5.3 (memoria = carga nueva) las ejercita en CI; por eso la revisión se centra en las tablas [H], [I] y [T], donde no hay escenario numérico que las pruebe.

| Tabla.columna | Restricción en 03 | Lo que escribe 04 | Resultado |
|---|---|---|---|
| `notificaciones.aviso` | `NOT NULL`, `AV-nn` | Motivos sin aviso (§11.2) | **Falla** → CF-16 |
| `notificaciones.motivo`, `titulo`, `cuerpo` | `NOT NULL`; motivo texto limpio | Siempre presentes (11.4) | Bien |
| `eventos_sistema.origen` | `IN (webhook, tarea_diaria, motor, respaldo, app)` | Los cinco de 04 §15.2 | Bien (V6-04) |
| `eventos_sistema.nivel` | Enum `info`, `aviso`, `error` | Los tres | Bien (V6-04) |
| `sms_recibidos.texto` | 1 a 2.000 caracteres | Cuerpo crudo truncado y limpiado (BE-60) | Bien (V-27) |
| `sms_recibidos.remitente` | `<> ''` | `'desconocido'` si falta (BE-60) | Bien (V-27) |
| `sms_procesamientos.resultado` / `error_detalle` | `error` ⇔ detalle no nulo | Detalle saneado en `error` (04 8.4 d) | Bien |
| `sms_procesamientos.formato_id` / `formatos_coincidentes` | Formato ⇔ exactamente un coincidente; más de uno ⇒ `no_reconocido` | `interpretar` (04 8.3) | Bien |
| `movimientos.estado` | Tres `CHECK` (aprobado ⇔ transacción; coincidencia ⇒ esperada; duplicado ⇒ una candidata) | OP-29 (descartado + transacción nula, F1), OP-39 restaurar (reevalúa), OP-40 (quita la propuesta y pasa a pendiente) | Bien |
| `movimiento_lineas` | Destino ≤ 1; monto > 0 | OP-36 | Bien |
| `cambios_posteriores.transaccion_id` | Nula | PC con la transacción eliminada (04 3.0.4) | Bien |
| `cambios_posteriores.monto_efecto` | `<> 0` | Efecto en la cuenta conciliada | Bien: solo se concilian cuentas de efectivo y tarjetas (OP-45, OP-53), cuyos efectos nunca son 0 |
| `conciliaciones.terminada_en`, `diferencia_aceptada` | `NOT NULL` sin defecto | OP-47 y OP-53 los envían | Bien |
| `conciliaciones.modo` (nueva) | `NOT NULL DEFAULT 'estado_cuenta'` | OP-47 sin valor (defecto) y OP-53 `saldo` | Bien con CF-01 |
| `suscripciones_push.endpoint` | `https://%` | Endpoint del navegador (OPT-02) | Bien |
| `token_webhook.hash_sha256` | 64 hexadecimales | SHA-256 (OPT-01) | Bien |
| `formatos_bancarios.*` | 8 `CHECK` | OPT-05 valida con el mismo contrato (04 §8.7) | Bien |

**Observación sin falla.** PR-2 (04 §8.3) produce `no_reconocido` con motivo `demasiado_largo`, y `interpretar` distingue además `ninguno` y `varios`, pero `sms_procesamientos` no tiene columna para el motivo y `error_detalle` solo admite valor con `resultado = 'error'`. No falla ninguna escritura y el motivo se puede derivar (más de 640 caracteres en `sms_recibidos.texto`, cero o varios `formatos_coincidentes`). Si la Bandeja o el diagnóstico necesitan mostrarlo, lo derivan; no hace falta un CF.

### 3.14 "Una categoría existía en un período" (FD-27, CF-17) **[A1]**

**Definición (P6-18).** Una categoría c **existía** en el período q si en q se cumple al menos una de estas condiciones:
- Asig(c, q) ≠ 0;
- un consumo de c con fecha en q (01 §4.1.6: líneas de gasto, cuotas, abonos y aportes, y condonaciones hacia c);
- una entrada a c con fecha en q (devoluciones D-2, D-3 y D-4, 01 §4.4);
- un evento con fecha en q sobre una línea de c (devolución D-1).

- La fecha es la de la transacción o la del evento (N3), nunca la de registro.
- Una categoría archivada puede "existir" en un período posterior a su archivo si un cambio retroactivo le deja actividad allí (N5); se cuenta igual.
- Los períodos de transición (Q5) cuentan como cualquier otro.

**Dónde se aplica** (selector único `existiaEn(c, q)` de `@finn/dominio`, usado por todos):

| Uso | Documento |
|---|---|
| "El promedio de gasto" de la asignación rápida (OP-16) | 01 OP-16 (precisión) |
| "Misma semana en los 3 períodos cerrados anteriores en que existía la categoría" del gasto semanal | 04 §6.9.3 |
| Presupuesto contra la realidad y comparación con el promedio | 3.5.6, 3.5.7 |
| "Categoría nueva" (sin períodos anteriores) del gasto semanal y de los reportes de comparación | 05 §2.10, A.7 |
| Historial de 6 períodos del detalle de categoría | 04 §6.3: muestra los 6 períodos cerrados anteriores **en que existía c**; si hay menos, muestra los que haya |

No se aplica a suscripciones (3.5.9), hormiga (3.5.8) ni tarjetas (3.5.10), que agrupan por comercio o por tarjeta y usan ventanas fijas de períodos.

**Cantidad mínima de períodos según el uso (FD-29) [B1].**

| Uso | Períodos en que existía c | Con menos |
|---|---|---|
| "Tu promedio de gasto" (OP-16) | Los que haya entre los 3 últimos cerrados: 1, 2 o 3. El texto dice de cuántos sale cuando son menos de 3: "Tu promedio de gasto (2 períodos)" **(nuevo)** | Con 0, no se ofrece |
| Presupuesto contra la realidad (3.5.6) y comparación con el promedio (3.5.7) | Exactamente 3 | No se evalúa |
| Historial del detalle de categoría (04 §6.3) | Hasta 6 | Muestra los que haya |

- *Justificación:* la asignación rápida la pide el usuario con un toque y sabe de cuántos períodos sale el número; los reportes de patrón sugieren por su cuenta y necesitan un patrón repetido para decir "siempre te pasás".
- **Precisión de 01 OP-16** (CF-17): "el promedio de Gastado(c, q) en los últimos 3 períodos cerrados en que existía c; si existía en menos, en los que haya; si en ninguno, la variante no se ofrece". 04 §6.14.4: `rapida.promedioGasto?: { monto: Centavos; periodos: 1 | 2 | 3 }`.

*Alternativa descartada:* agregar `categorias.creada_en` en 03 y contar desde la creación. Contaría como "$0 gastado" los períodos en que la categoría existía sin usarse, lo que baja los promedios de las categorías estacionales (por ejemplo, Colegiatura o Gastos anuales).


### 3.15 Primeros pasos en Inicio (FD-28, CF-18) **[B1]**

**Qué es.** Un bloque de Inicio con tres pasos marcables. Reemplaza la guía de primer uso de 05 §7.2 en Inicio; en las demás secciones, el estado vacío de primer uso no cambia.

| Paso | Hecho cuando | Enlace |
|---|---|---|
| Crear una cuenta | Existe al menos una cuenta (abierta o archivada) | `/cuentas/nueva` |
| Crear las categorías | Existe al menos una categoría normal | `/presupuesto/estructura` (que ofrece la plantilla, 3.9) |
| Conectar los SMS | `token_webhook` está configurado | `/ajustes/webhook` |

**Datos (CF-18, 04 §6.1).**

```ts
primerosPasos: { cuenta: boolean; categorias: boolean; sms: boolean } | null;   // null cuando los tres son true
```

- Se calcula con hechos que la consulta ya lee (cuentas y categorías) más `token_webhook` ([T], una fila). No hay estado guardado: un paso está hecho porque el hecho existe.
- Es independiente de `atencion`: no cuenta para "Todo al día".

**Presentación.**
- Sin ninguna cuenta: los Primeros pasos ocupan el lugar del bloque de atención (como la guía de 05 §7.2).
- Con al menos una cuenta y algún paso pendiente: los Primeros pasos van encima de "Necesita tu atención", que se muestra completo.
- Cada paso hecho se muestra marcado, con su nombre accesible ("Hecho: Crear una cuenta" **(nuevo)**), y deja de ser enlace.

**"Ocultar por ahora".**
- Es una preferencia **del dispositivo**, como el tema: se guarda en `localStorage` (`finn:primeros-pasos:oculto`) con lecturas y escrituras dentro de `try/catch` (05 `cliente/almacen.ts`). No es un hecho ni viaja al servidor.
- No se ofrece mientras no haya ninguna cuenta, porque sin cuentas Inicio no tiene otra cosa que mostrar.
- Mientras esté oculto y queden pasos pendientes, `/ajustes` muestra "Primeros pasos: {k} de 3" **(nuevo)** con "Mostrar en Inicio" **(nuevo)**, que borra la preferencia. Con los tres hechos, no aparece en ningún lado.
- Si el almacenamiento no está disponible, el bloque se muestra siempre (no se puede ocultar) y no se avisa nada.

**Impacto en 05.** §2.3 (fila de `/`: el bloque y "Ocultar por ahora"), §7.2 (la clase "primer uso" en Inicio la resuelven los Primeros pasos), §2.11 (fila de `/ajustes`: el recordatorio y "Mostrar en Inicio").

*Alternativas descartadas:* ocultar guardándolo en el servidor (agrega una preferencia persistente y una operación técnica para algo de un solo dispositivo); no permitir ocultar (obliga a ver un paso que el usuario decidió dejar para después, como los SMS).

### 3.16 Aviso de cuota próxima (CF-24) **[R4]**

- **Cuándo:** para cada programada **activa** de tipo `cuota_prestamo` **sin** registro automático, y para cada ocurrencia **pendiente** (sin resolución: ni emparejada, ni registrada, ni omitida) con fecha esperada ≥ `reactivada_desde` si existe (CF-20): si `fechaEsperada − hoy ≤ 3` días y `fechaEsperada ≥ hoy`, y no existe una notificación de motivo `cuota_proxima` con `datos.programadaId` y `datos.fechaEsperada` iguales, se registra la notificación y se envía el push. Una sola vez por ocurrencia.
- **Dónde corre:** en la tarea diaria (04 §10.2, paso 4) y en la puesta al día del primer acceso del día (BE-50), que agrega este paso a los pasos 1 y 2. Las dos comprueban la misma clave, así que da igual cuál llegue primero.
- **Quedan fuera:** las cuotas con registro automático (si fallan, ya existe `registro_automatico_fallido`), las ocurrencias resueltas y las del tramo inactivo de una programada reactivada. Las atrasadas (fecha < hoy) tampoco: ya se ven en Inicio como pagos atrasados.
- **Política** (04 §11.2): push sí; urgencia `normal`; TTL hasta el final de la fecha esperada; `aviso` nulo (FD-26). Etiqueta (`topic` y `tag`): **`programadas`**, que ya existe en `CargaPush.etiqueta` (CP-18) y agrupa los avisos de pagos programados. Consecuencia aceptada: en el dispositivo, un aviso de cuota reemplaza a un `registro_automatico` que todavía se estuviera mostrando; los dos siguen en el centro de notificaciones.
- **Contenido** (04 §11.4, FD-31): "Cuota de {comercio} por {monto} el {fecha}. Registrala cuando la pagues." **(nuevo)**. Lleva el monto porque es el de un movimiento esperado.
- **Destino:** `{ pantalla: 'programada'; programadaId; fechaEsperada }` → `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (FT-41), sin destino nuevo.
- **Código:** el motivo se agrega a la constante `MOTIVOS` de `@finn/aplicacion/push/motivos.ts` (3.13.1) y entra solo en la prueba de catálogo (3.13.2). Sin migración: `motivo` es texto.
- **Impacto:** 04 §10.2 (paso 4 y la puesta al día de §10.1), §11.2 (fila nueva) y §11.4 (texto y destino).

---

# Parte B

## 2. Fichas por feature

### 2.0 Forma de una ficha

Cada ficha tiene estos bloques, siempre en este orden y con estos rótulos, para que el script de trazabilidad (§6, Parte E) los lea:

| Bloque | Contenido |
|---|---|
| Encabezado | FT, nombre, prioridad (FD-02) |
| **Objetivo** | Qué resuelve, en una o dos oraciones |
| **Historias** | Lo que el usuario quiere hacer, en primera persona |
| **Flujo** | Pasos con sus rutas (05 §1.3). [1T] = acción de un toque (05 §4.14) |
| **Piezas** | Operaciones, consultas, rutas y componentes (05 §10.8), por su nombre exacto |
| **Reglas** | Remiten a 01 (§, OP, inv.) y, si corresponde, a 04 y 05; esta ficha no las repite |
| **Estados** | Solo los propios de la feature. Los comunes (carga, error de la consulta, sin conexión, sesión vencida, versión nueva) son los de 05 §7 y no se repiten |
| **Errores y textos** | Códigos de 04 §3.0.6 o de 05 §9.7 que el usuario puede ver aquí, y los textos nuevos marcados **(nuevo)** |
| **Criterios de aceptación** | `CA-nn.m`, en forma Dado / Cuando / Entonces. Los numéricos citan el paso de un escenario de 01 §8 (S6-2) en lugar de copiar su tabla. "Manual" = no se automatiza y se dice cómo se comprueba |
| **Escenarios** y **Avisos** | ESC y AV que la feature cubre; los mismos que lee el script |
| **Dependencias** | Features que tienen que existir antes. **[F8]** (CH-07): **de construcción**, la ficha no se puede construir sin ellas; **de datos**, la ficha se construye y se prueba con el estado sembrado por operaciones, y los CA afectados quedan pendientes de punta a punta hasta que exista la ficha que produce ese estado (07 §13, M18). Cada ficha marca las suyas de datos |

Reglas comunes a todas las fichas:
- **Una consulta por pantalla** (05 FE-26) y **ningún cálculo de montos en el cliente** (05 PF-3, inv. 27): cuando un criterio dice "muestra X", X sale del DTO.
- **Montos:** con el módulo de formato (05 §5.4) y el signo U+2212 (FD-25).
- **Confirmación:** toda operación con un aviso "antes" de 04 §3.0.5 pasa por previsualizar y confirmar (05 §4.4); el criterio lo dice solo cuando el aviso es propio de la feature.
- **Idempotencia:** todo envío repetido con el mismo id responde `yaAplicada` sin duplicar hechos (04 §4.6). No se repite como criterio en cada ficha; lo cubre la Fase 7 de forma transversal.

---

### 2.1 Instalación y primer uso

#### FT-01 Ingresar con contraseña y TOTP [I]

**Objetivo.** Que solo el usuario permitido entre a Finn, con contraseña y un código TOTP, y llegue a la pantalla que quería abrir.

**Historias.**
- Quiero entrar con mi email, mi contraseña y el código de mi app de autenticación.
- Si abrí un enlace (por ejemplo, desde una notificación), quiero llegar a esa pantalla después de ingresar.

**Flujo.**
1. Cualquier ruta de `(finn)` sin sesión → `/ingresar?volver=<ruta>` (05 §7.3).
2. `/ingresar`: email y contraseña → `ingresar()`.
3. Con un factor verificado → `/ingresar/verificar?volver=`: código de 6 dígitos → `verificarFactor()`. Sin factores → FT-02.
4. Sesión AAL2 → navega a `volver` (saneado, 05 §3.6).
5. "Usar otra cuenta" → `salir()` y vuelve a `/ingresar`.

**Piezas.**
- Operaciones: funciones de autenticación `estadoAcceso()`, `ingresar()`, `verificarFactor()`, `salir()` (04 §12.2, CP-11).
- Consultas: ninguna de 04 §6 (excepción de 05 §2.1).
- Rutas: `/ingresar`, `/ingresar/verificar`.
- Componentes: campo de código de 05 §9.4; `ErrorPantalla`.

**Reglas.** ADR-08 (02); 04 §12.1 a §12.4; tabla de redirecciones de 05 §9.2 (FE-36); sin envío automático del código (FE-38); sin registro ni recuperación en la app (04 §12.6).

**Estados.**
- Varios factores verificados: se elige por nombre, con el primero preseleccionado.
- Usuario distinto del permitido con sesión AAL1: se cierra la sesión y se muestra el formulario con el mensaje de credenciales.

**Errores y textos.** `credenciales_invalidas`, `demasiados_intentos`, `codigo_incorrecto`, `codigo_vencido` (05 §9.7). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-01.1** Dado que no hay sesión, cuando abro `/presupuesto?periodo=2026-09-21`, entonces llego a `/ingresar?volver=%2Fpresupuesto%3Fperiodo%3D2026-09-21` y, al completar los dos pasos, a esa misma URL.
- **CA-01.2** Dado un email inexistente, una contraseña incorrecta o un usuario distinto de `FINN_USUARIO_ID`, cuando envío el formulario, entonces veo el mismo mensaje "El email o la contraseña no son correctos." en los tres casos.
- **CA-01.3** Dado un código incorrecto, cuando lo envío, entonces veo el mensaje de `codigo_incorrecto`, el campo queda vacío y con el foco.
- **CA-01.4** Dado que escribí los 6 dígitos, cuando no toco "Verificar" ni Enter, entonces no se envía nada.
- **CA-01.5** Dado `?volver=https://otro.sitio` o `?volver=//otro.sitio`, cuando termino de ingresar, entonces llego a `/`.
- **CA-01.6** Dado una sesión AAL2, cuando abro `/ingresar`, `/ingresar/verificar` o `/ingresar/inscribir`, entonces me redirige a `volver` (o a `/`) sin mostrar el formulario.
- **CA-01.7** Dado el código pegado como "123 456" o "123-456", cuando lo envío, entonces se envía "123456".

**Escenarios.** — **Avisos.** —

**Dependencias.** Ninguna (es la primera).

#### FT-02 Inscribir el primer factor TOTP [I]

**Objetivo.** Que el primer ingreso termine con un factor TOTP verificado (AAL2), sin dejar el secreto guardado en el dispositivo.

**Historias.**
- La primera vez que entro, quiero escanear un QR con mi app de autenticación y quedar protegido.
- Quiero guardar el secreto en mi gestor de contraseñas como respaldo.

**Flujo.**
1. Sesión AAL1 sin factores verificados → `/ingresar/inscribir` (05 §9.2).
2. Al abrir: `iniciarInscripcion({ nombre: 'Autenticador' })` quita factores sin verificar y crea uno nuevo.
3. Se muestran el QR y el secreto agrupado de a 4 caracteres, con "Copiar".
4. Código de la app → `completarInscripcion()` → AAL2.
5. Pantalla de cierre: recomienda un factor de respaldo con enlace a `/ajustes/seguridad/factores/nuevo` (FT-74) y sigue a `volver`.

**Piezas.**
- Operaciones: `iniciarInscripcion()`, `completarInscripcion()` (CP-11).
- Consultas: `estadoAcceso()`.
- Rutas: `/ingresar/inscribir`.
- Componentes: los de 05 §9.5.

**Reglas.** 04 §12.2 (primera inscripción, P4-12); 05 §9.5 (FE-37): protección del secreto.

**Estados.**
- Recarga a mitad: empieza una inscripción nueva y la anterior, sin verificar, se quita.
- Ya existe un factor verificado: la ruta se niega (redirige a `/ingresar/verificar`).

**Errores y textos.** `codigo_incorrecto`, `codigo_vencido`, `inscripcion_no_permitida` (05 §9.7). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-02.1** Dado AAL1 sin factores, cuando abro `/ingresar/inscribir` dos veces seguidas (recargando), entonces Supabase tiene un solo factor sin verificar (el último).
- **CA-02.2** Dado el QR mostrado, cuando reviso `sessionStorage`, `localStorage`, la caché del service worker y `eventos_sistema`, entonces el secreto no aparece en ninguno.
- **CA-02.3** Dado un código correcto, cuando lo envío, entonces la sesión es AAL2, veo la recomendación de un factor de respaldo y, al seguir, llego a `volver`.
- **CA-02.4** Dado un factor ya verificado y una sesión AAL1, cuando abro `/ingresar/inscribir`, entonces llego a `/ingresar/verificar`; si llamo a `iniciarInscripcion()` directamente, responde `inscripcion_no_permitida`.
- **CA-02.5 (manual)** Con Google Authenticator y con un gestor de contraseñas que lea TOTP, el QR y el secreto copiado generan códigos que verifican.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01.

#### FT-03 Conectar MacroDroid [I]

**Objetivo.** Que los SMS del banco lleguen a Finn: generar el token del webhook, ponerlo en MacroDroid y comprobar que un SMS de prueba aparece en la Bandeja.

**Historias.**
- Quiero generar el token una vez, copiarlo y pegarlo en MacroDroid.
- Si sospecho que el token se filtró, quiero cambiarlo y que el anterior deje de funcionar en el acto.

**Flujo.**
1. `/ajustes/webhook`: muestra si ya hay un token (`AjustesDto.webhook.configurado`, `rotadoEn`).
2. "Generar token" o "Cambiar token" → OPT-01. El token se muestra **una sola vez**, con "Copiar", y la URL `https://<dominio>/api/sms`.
3. Instrucciones de 04 §8.8 (disparador, acción HTTP, cabeceras, cuerpo, reintentos) y la prueba en el teléfono.
4. Un SMS de prueba aparece en la Bandeja como no reconocido (FT-38).

**Piezas.**
- Operaciones: OPT-01; `POST /api/sms` (OP-35, FT-34).
- Consultas: `ajustes()`.
- Rutas: `/ajustes/webhook`.
- Componentes: `Aviso`; botón "Copiar".

**Reglas.** 04 §8.1 y §8.8; 04 §12.5 (cliente que no es persona); 05 §2.11 (el token nunca va al borrador ni queda en el cliente al cerrar el flujo).

**Estados.**
- Sin token: "Todavía no conectaste tus SMS. Generá un token y pegalo en MacroDroid." **(nuevo)**.
- Con token: la fecha de `rotadoEn` y "Cambiar token", que advierte antes: "El token actual dejará de funcionar. Vas a tener que pegar el nuevo en MacroDroid." **(nuevo)**.

**Errores y textos.** Los comunes (04 §3.0.7). Textos nuevos: los dos anteriores y "Copiá este token ahora: no lo vas a poder ver de nuevo." **(nuevo)**.

**Criterios de aceptación.**
- **CA-03.1** Dado que genero un token, cuando cierro el flujo y lo vuelvo a abrir, entonces el token ya no se ve y `token_webhook` guarda solo su SHA-256 (64 hexadecimales).
- **CA-03.2** Dado un token rotado, cuando llega un `POST /api/sms` con el token anterior, entonces responde 401 y no se guarda ninguna fila en `sms_recibidos`; con el nuevo responde 200.
- **CA-03.3** Dado el token correcto y un texto que no coincide con ningún formato, cuando llega el SMS, entonces la Bandeja muestra un movimiento no reconocido con el texto original.
- **CA-03.4** Dado el token visible, cuando reviso `sessionStorage` y la caché del service worker, entonces no aparece.
- **CA-03.5 (manual)** **[R2]** Antes de dar la feature por terminada se completa la prueba en el teléfono de 04 §8.8:
  - un SMS con comillas dobles y un salto de línea llega completo a la Bandeja (regla de 8.1.1 para elegir la variante del cuerpo);
  - **la macro reintenta ante una respuesta de error del servidor**, que es lo que N-01 exige para el 5xx: el webhook responde 503 con `Retry-After: 30` cuando no pudo guardar (04 §8.2 paso 4), y el SMS solo se recupera si MacroDroid vuelve a enviarlo. Como desde el teléfono no se puede provocar un 503 del servidor, 04 §8.8 paso 3 lo simula apuntando la macro a una ruta inexistente (404). La simulación vale porque los dos mecanismos de 04 §8.8 reintentan ante cualquier código distinto de 2xx (el plan B, ante todo lo que no es 200); si se usa el reintento propio de la acción HTTP, se confirma además en su configuración que cubre los 5xx;
  - al terminar, la URL vuelve a la correcta y se quita el remitente temporal del filtro.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01; FT-34 y FT-38 para la comprobación (CA-03.3). **[F8]** (CH-07): de datos, FT-34, FT-38; las demás, de construcción.

#### FT-04 Primer uso guiado, con la plantilla de categorías [I]

**Objetivo.** Que, empezando desde cero (FD-04), el usuario pueda dejar Finn listo para el uso diario: sus cuentas con saldo inicial, sus grupos y categorías y los SMS conectados.

**Historias.**
- La primera vez que abro Finn, quiero saber qué hacer primero.
- Quiero partir de una lista de categorías típicas, quitar lo que no uso, renombrar y agregar, y crearlas todas de una vez.
- Quiero crear mis cuentas con el saldo que tienen hoy y que la deuda de mis tarjetas quede como "te falta reservar".

**Flujo.**
1. **[B1]** Inicio → "Primeros pasos" (3.15, CF-18): crear una cuenta (`/cuentas/nueva`, FT-50), crear las categorías (`/presupuesto/estructura`) y conectar los SMS (`/ajustes/webhook`, FT-03). Cada paso se marca solo cuando su hecho existe. Con al menos una cuenta, "Ocultar por ahora" lo oculta en ese dispositivo.
2. Sin categorías normales, `/presupuesto/estructura` ofrece "Empezar con una lista sugerida" **(nuevo)** → `/presupuesto/estructura/plantilla` (CF-08).
3. En la plantilla: la lista de 3.9.2 agrupada; quitar, renombrar y agregar grupos o categorías; nada se guarda hasta "Crear {n} categorías".
4. **[B1]** Aplicación con OP-07 en lote, en 3 o 4 tandas, con el avance entre tandas (3.9.1, CF-19).
5. Al terminar: resumen de lo creado y de lo que no se creó con su motivo; enlace a `/presupuesto`.
6. Cada cuenta nueva con saldo inicial (FT-50): en efectivo, el saldo entra a Listo para asignar; en una tarjeta, la deuda queda como "te falta reservar".

**Piezas.**
- Operaciones: OP-07 (variante en lote, CF-19); OP-01 (a través de FT-50); OPT-01 (FT-03).
- Consultas: `inicio()` (`primerosPasos`, CF-18), `estructura()`.
- Rutas: `/`, `/presupuesto/estructura`, `/presupuesto/estructura/plantilla` (CF-08), `/cuentas/nueva`, `/ajustes/webhook`, `/ajustes`.
- Componentes: `EstadoVacio` (clase `primer-uso`); lista editable de la plantilla (componente nuevo de `flujos/plantilla/`, cliente).

**Reglas.** 00 §5.1 y FD-04 (sin migración); 01 OP-07 (nombre único dentro del grupo; categoría en un grupo activo); 01 OP-01 (saldo inicial); 3.9 (plantilla) y 3.15 (Primeros pasos); 04 §4.6.1 y §4.8 (ids de creación y lote); 03 §9.3 ("Pagos de tarjeta" ya existe y no se ofrece).

**Estados.**
- Primer uso (sin cuentas): Inicio muestra los Primeros pasos en lugar del bloque de atención, sin "Ocultar por ahora"; el marco y "Registrar" siguen visibles (05 §7.2). **[B1]**
- Con cuentas y pasos pendientes: los Primeros pasos van encima de "Necesita tu atención". Ocultos: `/ajustes` muestra "Primeros pasos: {k} de 3" y "Mostrar en Inicio". **[B1]**
- Plantilla con todo quitado: "Crear" deshabilitado con el motivo "Elegí al menos una categoría." **(nuevo)**.
- Aplicación cortada (red, recarga, sesión vencida): al volver, "Seguir creando la plantilla ({k} de {n} creadas)" **(nuevo)**, con los mismos ids del borrador; sin borrador, se saltan por nombre los que ya existen (3.9.1). **[B1]**
- Con categorías normales ya creadas: `/presupuesto/estructura/plantilla` redirige a `/presupuesto/estructura` (la plantilla es solo para empezar), salvo que existan categorías de la lista sugerida y falten otras: entonces ofrece seguir (CA-04.10) **[CH-70]**.

**Errores y textos.** Por elemento: `nombre_repetido`, `grupo_archivado`, `grupo_del_sistema` (si el usuario agrega "Pagos de tarjeta"). Textos nuevos: los de "Estados", "Creando tu plantilla: {k} de {n}…" y "{n} creadas. {m} no se crearon:" **(nuevo)** seguido de cada nombre con su mensaje; los de 3.15 ("Hecho: {paso}", "Ocultar por ahora", "Primeros pasos: {k} de 3", "Mostrar en Inicio"). **[B1]**

**Criterios de aceptación.**
- **CA-04.1** **[B1]** Dado una base recién sembrada, cuando abro `/`, entonces veo los Primeros pasos con los tres pasos sin marcar y sus enlaces, sin "Ocultar por ahora", y no veo "Todo al día".
- **CA-04.2** Dado la plantilla sin cambios, cuando toco "Crear 36 categorías", entonces `estructura()` devuelve exactamente los 11 grupos y las 36 categorías de 3.9.2, en ese orden, más "Pagos de tarjeta", y ningún grupo tiene dos categorías con el mismo nombre (sin distinguir mayúsculas). **[R2]**
- **CA-04.3** Dado que quito el grupo "Educación" y renombro "Streaming" a "Netflix y Disney", cuando creo, entonces no existe "Educación" ni sus 2 categorías y existe "Netflix y Disney" en "Suscripciones".
- **CA-04.4** **[B1]** Dado que la conexión se corta después de la primera tanda (12 elementos), cuando vuelvo a abrir la plantilla y sigo, entonces se crean los 35 restantes con los ids del borrador, ninguno se duplica y, si reenvío la primera tanda, sus 12 elementos responden `ya_aplicada`.
- **CA-04.5** Dado que agrego "Supermercado" dos veces en "Vida diaria", cuando creo, entonces se crea una, la otra aparece en el resumen con el mensaje de `nombre_repetido` y las demás se crean.
- **CA-04.6** Dado una categoría normal ya creada, cuando abro `/presupuesto/estructura/plantilla`, entonces me redirige a `/presupuesto/estructura`.
- **CA-04.7** Dado los pasos 1 y 2 de ESC-01 hechos desde `/cuentas/nueva`, cuando abro Inicio, entonces Listo para asignar es $1,000.00 y "Te falta reservar" de T es $300.00.
- **CA-04.8** **[B1]** Dado la plantilla completa (47 elementos), cuando la aplico, entonces la pantalla hace 4 llamadas a la acción, ninguna con más de 15 elementos, los grupos van antes que sus categorías y el avance cambia después de cada tanda.
- **CA-04.9** **[B1]** En el perfil 4G de 05 §13.1, con 400 ms por escritura en el servidor, la aplicación de los 47 elementos termina en 20 s o menos (estimación de 3.9.1 a partir de V6-05; la Fase 7 lo mide con la aplicación real).
- **CA-04.10** **[B1]** Dado que la plantilla ya creó 12 elementos y el borrador no está disponible (otra pestaña), cuando sigo, entonces no se envían los 12 que ya existen por nombre y se crean los 35 restantes.
- **CA-04.11** **[B1]** Dado una cuenta creada y los SMS sin conectar, cuando toco "Ocultar por ahora", entonces los Primeros pasos desaparecen de Inicio en ese dispositivo, siguen visibles en otro y `/ajustes` muestra "Primeros pasos: 2 de 3" con "Mostrar en Inicio".
- **CA-04.12** **[B1]** Dado los tres pasos hechos, cuando abro Inicio o `/ajustes`, entonces los Primeros pasos no aparecen en ningún lado y `inicio().primerosPasos` es `null`.
- **CA-04.13** **[B1]** Dado que falla un grupo de la plantilla, cuando termina la tanda, entonces sus categorías aparecen en el resumen con el motivo del grupo y las de los demás grupos se crean.

**Escenarios.** ESC-01 (pasos 1 y 2).

**Avisos.** AV-07 (después de crear una tarjeta con deuda).

**Dependencias.** FT-01, FT-02; FT-50 (crear cuenta), FT-18 (estructura); FT-03; FT-77 (mismo mecanismo de preferencia del dispositivo que el tema). **[F8]** (CH-07): de datos, FT-77; las demás, de construcción.

#### FT-05 Instalar como app y página sin conexión [M] — ficha abreviada

**Objetivo.** Instalar Finn en el teléfono y mostrar una página propia, sin números, cuando no hay conexión.

**Referencias.** 05 §8.1 a §8.5 y §8.7 (FE-52 a FE-56, FE-58); 02 ADR-13; ruta `/sin-conexion`; componentes `RegistroServiceWorker`, `EnlaceFinn`, `useNavegacionFinn`.

**Criterios de aceptación.**
- **CA-05.1** Dado Android con Chrome y la app sin instalar, cuando abro `/ajustes`, entonces veo "Instalar Finn en este dispositivo" y, al tocarlo, el diálogo del navegador; ya instalada (`standalone`), no se ofrece.
- **CA-05.2** Dado Safari en iPhone sin instalar, cuando abro `/ajustes`, entonces veo las instrucciones "Compartir → Agregar a inicio".
- **CA-05.3** Dado una pantalla abierta y `navigator.onLine = false`, cuando toco un enlace interno, entonces la pantalla no cambia y se anuncia "Estás sin conexión. No se puede abrir esta pantalla".
- **CA-05.4** Dado sin conexión, cuando recargo cualquier ruta, entonces veo `/sin-conexion` sin ningún monto ni enlace a otras pantallas, con "Intentar de nuevo".
- **CA-05.5** Dado la compilación de producción, cuando pido `/serwist/sw.js.map`, entonces responde 404.
- **CA-05.6** Nunca aparece un aviso de instalación al abrir la app.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01.

#### FT-06 Activar notificaciones en el dispositivo [M] — ficha abreviada

**Objetivo.** Pedir el permiso de notificaciones solo tras un gesto del usuario y mantener viva la suscripción del dispositivo.

**Referencias.** CP-5 (04 §11.1); 05 §8.6 (FE-57); OPT-02, OPT-03; rutas `/` (tarjeta "Activar notificaciones") y `/ajustes/notificaciones`; consulta `ajustes()` (`suscripcionesPush`).

**Criterios de aceptación.**
- **CA-06.1** Dado el permiso sin decidir, cuando abro la app, entonces no se pide el permiso; Inicio muestra la tarjeta "Activar notificaciones", que se puede descartar.
- **CA-06.2** Dado que toco "Activar notificaciones" y acepto, entonces existe una fila en `suscripciones_push` con el `endpoint` del navegador y la tarjeta desaparece.
- **CA-06.3** Dado el permiso concedido, cuando abro la app con AAL2, entonces OPT-02 renueva `renovada_en` una sola vez por pestaña.
- **CA-06.4** Dado el permiso denegado, cuando abro `/ajustes/notificaciones`, entonces veo cómo habilitarlo en el navegador.
- **CA-06.5** Dado un iPhone sin instalar la app, cuando abro `/ajustes/notificaciones`, entonces se explica que hay que instalarla antes de activar las notificaciones.
- **CA-06.6** Dado un dispositivo en la lista, cuando toco "Quitar", entonces su fila desaparece (OPT-03) y, si era este dispositivo, se anula la suscripción local.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01, FT-05 (service worker).

### 2.2 Presupuesto

#### FT-08 Inicio: resumen diario y "¿algo necesita mi atención?" [I]

**Objetivo.** Responder cada día, en una pantalla, cuánto hay para asignar, qué necesita atención y qué se gastó, con los mismos números que el resto de la app (error 11).

**Historias.**
- Al abrir Finn quiero ver Listo para asignar, los días que quedan del período y cuánto está en camino.
- Quiero ver de un vistazo lo que necesita mi atención (SMS por revisar, sobregiros, lo que me falta reservar, pagos próximos, cambios en el pasado, hallazgos de ritmo) y resolverlo desde ahí.
- Quiero ver mis últimos movimientos y mi patrimonio.

**Flujo.**
1. `/` → `inicio()`.
2. Resumen: `ResumenListoParaAsignar` (LPA, en camino, negativo) y el período con sus días restantes.
3. "Necesita tu atención", en este orden: Bandeja, cambios retroactivos, sobregiradas, te falta reservar, pagos excedentes, reserva excedente, archivadas con Disponible, metas vencidas, pagos atrasados, pagos de tarjeta próximos (CF-07), próximos pagos (7 días), hallazgos de ritmo (CF-06).
4. Cada elemento enlaza a donde se resuelve o lleva su propuesta de un toque: AV-08 (OP-14), AV-14 (OP-11), hallazgo de ritmo (3.5.4, 3.6).
5. [1T] OPT-04 "Marcar como leído" en los cambios retroactivos.
6. Recientes (5) y patrimonio.
7. Tarjeta "Activar notificaciones" (FT-06) mientras el permiso esté sin decidir.

**Piezas.**
- Operaciones: OPT-04; propuestas OP-14 (AV-08, hallazgo), OP-11 (AV-14), OP-15 (hallazgo de ritmo).
- Consultas: `inicio()` con `atencion.hallazgosRitmo` y `atencion.pagosTarjetaProximos` (CF-06).
- Rutas: `/`; enlaces a `/bandeja`, `/presupuesto/asignar/[categoriaId]`, `/presupuesto/categorias/[categoriaId]`, `/programadas/[programadaId]/ocurrencias/[fechaEsperada]`, `/cuentas/[cuentaId]`, `/presupuesto/listo-para-asignar`, `/actividad/[transaccionId]`.
- Componentes: `ResumenListoParaAsignar`, `Aviso`, `IndicadorEstado`, `FilaTransaccion`, `Monto`, `EstadoVacio`.

**Reglas.** 01 §4.9 (LPA), §4.10 (en camino), §4.7 (sobregiros y reducción proyectada), §4.8 (S y RE), §4.16 (pendientes y atrasadas); 04 §6.1, BE-37 (7 días), BE-38 (cambios retroactivos); 3.7 y 3.8 de este documento; PF-2 (sobregiros sin montos a la vista).

**Estados.**
- Primer uso y pasos pendientes: los Primeros pasos de FT-04 (3.15). **[B1]** No cuentan para "Todo al día".
- "Todo al día": cuando todas las listas de `atencion` están vacías, incluidas `hallazgosRitmo` y `pagosTarjetaProximos` (3.7), y la Bandeja no tiene nada por revisar.
- LPA negativo (AV-20): el resumen lo marca con su estado y su texto.

**Errores y textos.** Los de las propuestas (los de OP-14, OP-11 y OP-15). Textos del servidor: los de cada aviso (04 §7.10) y de los hallazgos (3.5.4). Sin textos nuevos de interfaz.

**Criterios de aceptación.**
- **CA-08.1** Dado el estado del paso 2 de ESC-15, cuando abro Inicio, entonces Salidas aparece en sobregiradas con el indicador "Sobregiro con débito o efectivo", sin monto a la vista, y al tocar se ve $50.00 y que "reducirá Listo para asignar en $50.00 al cierre".
- **CA-08.2 (error 11)** Dado el paso 0 de ESC-31 y el paso 1 de ESC-05, cuando comparo `inicio().atencion.sobregiradas` con `presupuesto().grupos[].categorias[]` del período activo, entonces las categorías con Disponible negativo y sus montos son los mismos.
- **CA-08.3** Dado el paso 2 de ESC-20, cuando abro Inicio, entonces Listo para asignar es $675.00 y "En camino" es $25.00.
- **CA-08.4** Dado el paso 4 de ESC-01, cuando abro Inicio, entonces el patrimonio es −$4,300.00 (U+2212).
- **CA-08.5** Dado un cambio retroactivo confirmado (paso 1 de ESC-31), cuando abro Inicio, entonces veo su resumen (Δ LPA −$30.00, Δ Salidas −$20.00); al tocar "Marcar como leído" desaparece y no vuelve al recargar.
- **CA-08.6** Dado 5 categorías con hallazgo de ritmo, cuando abro Inicio, entonces veo solo las 3 de mayor impacto (`RITMO_INICIO_MAX`), con los mismos montos que el reporte `ritmo` (3.7).
- **CA-08.7** Dado el paso 4 de ESC-13 (reserva excedente $30.00), cuando toco la propuesta de AV-08, entonces Listo para asignar sube $30.00 (paso 5) y aparece "Deshacer" (05 §4.14).
- **CA-08.8** Dado ninguna condición de atención, cuando abro Inicio, entonces veo "Todo al día"; con una sola ocurrencia atrasada, no lo veo.
- **CA-08.9** Dado 7 transacciones, cuando abro Inicio, entonces "Recientes" muestra las 5 últimas por (fecha, clave de orden).
- **CA-08.10** Dado una tarjeta con fecha de pago en 2 días y monto para no generar intereses de $120.00, cuando abro Inicio, entonces aparece en "Pagos de tarjeta próximos" con enlace a su cuenta; con el monto en $0.00, no aparece (3.8).
- **CA-08.11** **[R5]** Dado LPA $312.40 y al menos una categoría sin fondos, cuando toco "Asignar $312.40" en el billete, entonces abro `/presupuesto?filtro=sin-fondos`; sin categorías sin fondos, `/presupuesto`; con LPA −$86.15, "Quitar $86.15 de una categoría" abre `/presupuesto` (P6-26).
- **CA-08.12** **[R5]** Dado $40.00 en camino de un deudor, cuando miro el billete, entonces dice "En camino $40.00", sin el nombre del deudor (5.6).

**Escenarios.** ESC-01 (paso 4), ESC-15 (paso 2), ESC-20 (paso 2), ESC-31 (paso 1).

**Avisos.** AV-01, AV-02, AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, AV-14, AV-17, AV-20, AV-23.

**Dependencias.** FT-01, FT-09, FT-16, FT-29; para los elementos de atención, las features que los producen (FT-27, FT-35, FT-41, FT-62). **[F8]** (CH-07): de datos, FT-16, FT-27, FT-41, FT-62; las demás, de construcción.

#### FT-09 Presupuesto del período: filtros, períodos cerrados y futuros [I]

**Objetivo.** Ver, para cualquier período, lo asignado, gastado, arrastrado y disponible de cada categoría, las categorías de pago y Listo para asignar, con filtros y sin poder cambiar lo que ya cerró.

**Historias.**
- Quiero ver mi presupuesto del período actual agrupado como lo organicé.
- Quiero filtrar las sobregiradas, las que no tienen fondos suficientes y las cubiertas.
- Quiero mirar un período pasado tal como quedó y planear uno futuro con dinero que ya tengo.

**Flujo.**
1. `/presupuesto` → `presupuesto({ periodoInicio, filtro })`.
2. `SelectorPeriodo` con "Período anterior", "Período siguiente" e "Ir al período actual" (05 §3.4).
3. Filtros `?filtro=sobregiradas|sin-fondos|cubiertas` (BE-39).
4. Cada fila enlaza al detalle (FT-14) y, si el período es activo o futuro, a asignar (FT-10).
5. Acciones del período: mover (FT-11), auto-asignar (FT-13); archivadas con dinero → sacar (FT-19).

**Piezas.**
- Operaciones: ninguna propia (enlaces a OP-14, OP-15, OP-17, OP-11; propuesta AV-08).
- Consultas: `presupuesto()`.
- Rutas: `/presupuesto`.
- Componentes: `ResumenListoParaAsignar`, `SelectorPeriodo`, `FilaCategoria`, `FilaPagoTarjeta`, `ResumenMeta`, `Aviso`, `EstadoVacio`.

**Reglas.** 01 §4.2 (períodos), §4.6 (Disponible y proyección de futuros), inv. 18 (cerrados), I1; 04 §6.2 y BE-39; 05 §3.4 (FE-31) y §7.7 (solo lectura).

**Estados.**
- Período cerrado: solo lectura, sin enlaces de asignar, mover ni auto-asignar; incluye las archivadas que tuvieron asignación o actividad en él.
- Período futuro: Disponible proyectado con actividad cero; las filas de tarjeta no muestran "te falta reservar" (inv. 2).
- Período de transición (Q5): el selector lo dice ("Período de transición, 11 días") **(nuevo)**.
- Sin categorías: enlace a la estructura (FT-04, FT-18).
- Filtro sin filas: "Ninguna categoría cumple este filtro" y "Quitar filtros".

**Errores y textos.** `periodo_no_valido` (un `?periodo=` inválido redirige sin el parámetro, 05 §2.2). Texto nuevo: el del período de transición.

**Criterios de aceptación.**
- **CA-09.1** Dado el paso 1 de ESC-49, cuando abro `/presupuesto?periodo=<inicio de P2>`, entonces Super muestra Disponible $700.00, y en P3, $1,000.00; en el período activo, $400.00.
- **CA-09.2** Dado el paso 3 de ESC-05 (P1 cerrado), cuando abro P1, entonces Super muestra Disponible −$100.00 y no hay enlace "Asignar" en ninguna fila.
- **CA-09.3** Dado una categoría con Disp −$10.00, otra con Disp $0.00 y meta con falta $50.00, y otra con Disp $20.00 sin meta, cuando aplico cada filtro, entonces cada una aparece solo en `sobregiradas`, `sin-fondos` y `cubiertas`, respectivamente.
- **CA-09.4** Dado el período activo, cuando toco "Período anterior" y luego "atrás" del navegador, entonces vuelvo al período activo y la URL no tiene `?periodo=`.
- **CA-09.5** Dado `?periodo=2026-09-22` (no es un inicio), cuando abro la URL, entonces me redirige a `/presupuesto` sin el parámetro.
- **CA-09.6** Dado una archivada con Disponible $25.00 (paso 2 de ESC-44), cuando abro el período activo, entonces aparece en "archivadas con dinero" con el enlace a sacar y no aparece entre las categorías de su grupo.
- **CA-09.7** Dado cualquier estado de 01 §8, cuando abro el período activo, entonces se cumple la identidad: Σ saldos de efectivo = LPA + Σ Disponibles mostrados + Σ asignaciones futuras + sobregiro con tarjeta (comprobación en la prueba, no en la pantalla).
- **CA-09.8** **[R5]** Dado Asignado $120.00 y un gasto con débito de $146.30, cuando abro Presupuesto, entonces `barra` = cubierto 8,202 y excedente 1,798 puntos básicos, tipo `debito`, igual que el indicador "Sobregiro con débito o efectivo" (CF-25).
- **CA-09.9** **[R5]** Dado el paso 2 de ESC-17 (Super), cuando abro Presupuesto, entonces `barra` = cubierto 6,667 y excedente 3,333, tipo `mixto`.
- **CA-09.10** **[R5]** Dado una categoría con Asignado −$20.00 y sin consumos, cuando abro Presupuesto, entonces `barra` = cubierto 0 y excedente 10,000, tipo `debito` (01 supuesto 6), con el indicador de sobregiro con débito; nunca un cubierto negativo.
- **CA-09.11** **[R5]** Dado Asignado $50.00, un gasto con débito de $80.00 y una devolución en efectivo de $30.00 en el mismo período (D-2), cuando abro Presupuesto, entonces la categoría no está sobregirada y `barra` = cubierto 10,000, excedente 0, tipo nulo.
- **CA-09.12** **[R5]** Dado una categoría con Asignado $0.00, sin arrastre ni consumos, cuando abro Presupuesto, entonces `barra` es nulo y la fila no dibuja la barra.
- **CA-09.13** **[R5]** Para cualquier estado (prueba de propiedades, Fase 7): `excedenteBp > 0` si y solo si la categoría tiene sobregiro, con `tipoExcedente` igual al tipo de su `SobregiroDto`; `cubiertoBp ≥ 0` y `cubiertoBp + excedenteBp ≤ 10,000`.

**Escenarios.** ESC-05 (paso 3), ESC-44 (paso 2), ESC-49 (paso 1).

**Avisos.** AV-02, AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, AV-14, AV-17, AV-20.

**Dependencias.** FT-18 (categorías), FT-50 (cuentas).

#### FT-10 Asignar y desasignar [I]

**Objetivo.** Darle a cada dólar un trabajo: cambiar lo asignado a una categoría en el período activo o en uno futuro.

**Historias.**
- Quiero asignar dinero a una categoría y ver cómo queda Listo para asignar.
- Quiero quitar dinero de una categoría (incluso por debajo de cero) y devolverlo a Listo para asignar.
- Quiero que Finn me avise antes si Listo para asignar quedaría negativo, y que no me deje adelantar dinero que no tengo.

**Flujo.**
1. Desde una fila de Presupuesto, el detalle o Inicio → `/presupuesto/asignar/[categoriaId]?periodo=` (flujo corto).
2. `formulario({ operacion: 'asignar' })`: asignado, disponible, meta y valores rápidos (FT-12).
3. Nuevo valor de Asignado con `EntradaMonto` (con signo); OP-14 con `esperado.monto`.
4. Si LPA quedaría negativo en el activo: confirmación AV-11 (05 §4.4).
5. Al cerrar, vuelve a la pantalla de origen con los números nuevos.

**Piezas.**
- Operaciones: OP-14.
- Consultas: `formulario` (`asignar`), `presupuesto()`.
- Rutas: `/presupuesto/asignar/[categoriaId]`.
- Componentes: `EntradaMonto` (`conSigno`), `ConfirmacionImpacto`, `Monto`.

**Reglas.** 01 OP-14, I1, H4, inv. 19, inv. 20, CB-09, CB-10, CB-25; H3 (una asignación posterior cubre compras con tarjeta del mismo período); 04 OP-14.

**Estados.**
- Período cerrado: el flujo no se abre; redirige al detalle con el motivo `periodo_cerrado`.
- Categoría archivada: solo se puede bajar (sacar); subir se rechaza.

**Errores y textos.** `periodo_cerrado`, `periodo_no_valido`, `lpa_negativo_en_futuro`, `categoria_archivada`, `conflicto_desactualizado`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-10.1** Dado el paso 1 de ESC-03, cuando asigno $600.00 a Super en P1, entonces Listo para asignar es $400.00 (paso 2).
- **CA-10.2** Dado el paso 3 de ESC-03, cuando intento asignar $200.00 a Gas en P2 (futuro), entonces se rechaza con `lpa_negativo_en_futuro` y el mensaje dice que faltan $100.00.
- **CA-10.3** Dado el paso 3 de ESC-03, cuando asigno $200.00 a Gas en P1, entonces veo AV-11 ("dejará Listo para asignar en −$100.00") antes de confirmar; al confirmar, LPA es −$100.00 y aparece AV-20 (paso 5).
- **CA-10.4** Dado el paso 2 de ESC-05, cuando asigno $100.00 más a Super en P1, entonces Super queda en $0.00, Pago T en $400.00 y "Te falta reservar" de T en $0.00 (ESC-06).
- **CA-10.5** Dado el paso 4 de ESC-07, cuando asigno $100.00 a Pago T en P2, entonces "Te falta reservar" de T pasa de $100.00 a $0.00 (paso 5).
- **CA-10.6** Dado Asignado $50.00, cuando escribo −$20.00, entonces Asignado queda en −$20.00 y, sin consumos, Disponible en −$20.00 de débito (CB-09).
- **CA-10.7** Dado que otra pestaña cambió lo asignado después de abrir el flujo, cuando envío, entonces responde `conflicto_desactualizado` y el flujo ofrece ver el valor actual (05 §4.7).
- **CA-10.8** Dado un período cerrado, cuando abro `/presupuesto/asignar/[categoriaId]?periodo=<cerrado>`, entonces llego al detalle de la categoría con el mensaje de `periodo_cerrado`.

**Escenarios.** ESC-03 (pasos 1 a 5), ESC-06, ESC-07.

**Avisos.** AV-11, AV-20.

**Dependencias.** FT-09.

#### FT-11 Mover dinero entre categorías [I]

**Objetivo.** Cubrir un sobregiro (o reacomodar) tomando dinero de otra categoría en un solo paso, sin tocar Listo para asignar.

**Historias.**
- Quiero cubrir Salidas con lo que sobra en Super en un solo paso.
- Quiero sacar dinero de una categoría archivada hacia una activa.

**Flujo.**
1. `/presupuesto/mover?categoria-origen=&categoria-destino=&periodo=` (flujo corto); desde un sobregiro, el destino viene preseleccionado.
2. Origen, destino y monto; OP-15 con `esperado` de las dos asignaciones (CP-10a).
3. Si el origen queda sobregirado, se informa con AV-02 o AV-03 después.

**Piezas.**
- Operaciones: OP-15.
- Consultas: `formulario` (`asignar`, con CP-10a).
- Rutas: `/presupuesto/mover`.
- Componentes: selector de categoría con su Disponible, `EntradaMonto`, `Monto`.

**Reglas.** 01 OP-15 (LPA no cambia; el origen puede quedar sobregirado, YNAB; el origen archivado equivale a OP-11); 04 OP-15.

**Estados.** Período cerrado: no se abre (como FT-10).

**Errores y textos.** `destino_igual_origen`, `categoria_archivada` (destino), `periodo_cerrado`, `conflicto_desactualizado`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-11.1** Dado el paso 1 de ESC-16, cuando muevo $50.00 de Super a Salidas, entonces Salidas queda en $0.00, Super en $30.00 y Listo para asignar sigue en $320.00 (paso 2); al cerrar el período, LPA sigue en $320.00 (paso 3).
- **CA-11.2** Dado Super con $30.00, cuando muevo $50.00 a Salidas, entonces se acepta, Super queda en −$20.00 y aparece AV-02 (débito) o AV-03 (tarjeta) según sus compras.
- **CA-11.3** Dado el mismo origen y destino, cuando envío, entonces se rechaza con `destino_igual_origen`.
- **CA-11.4** Dado Listo para asignar negativo, cuando muevo entre dos categorías, entonces no aparece AV-11 (LPA no cambia).

**Escenarios.** ESC-16.

**Avisos.** AV-02, AV-03.

**Dependencias.** FT-09, FT-10.

#### FT-12 Asignación rápida [M]

**Objetivo.** Asignar con un toque el valor que la meta pide, el del período pasado o el promedio de gasto.

**Historias.**
- Quiero asignar "lo que falta para la meta" sin hacer la cuenta.
- Quiero repetir lo que asigné el período pasado.
- Quiero asignar lo que suelo gastar.

**Flujo.**
1. En `/presupuesto/asignar/[categoriaId]`, las tres opciones con su valor (`contexto.rapida`, 04 §6.14.4).
2. Tocar una → OP-16 con su `variante`; el resultado es el mismo que asignar ese valor con OP-14 (AV-11 incluido).

**Piezas.**
- Operaciones: OP-16.
- Consultas: `formulario` (`asignar`).
- Rutas: `/presupuesto/asignar/[categoriaId]`.
- Componentes: botones con `Monto`.

**Reglas.** 01 OP-16 con la precisión de CF-17 **[B1]**; FD-27, FD-29 y 3.14 (períodos en que existía la categoría); 04 OP-16.

**Estados.**
- Sin meta o con Falta $0.00: no se ofrece "lo que falta para la meta".
- Sin períodos cerrados en que existía la categoría: no se ofrece "el promedio de gasto". **[B1]** Con 1 o 2, promedia los que haya y lo dice: "Tu promedio de gasto (2 períodos)" (FD-29).

**Errores y textos.** Los de OP-14. Textos de interfaz: "Lo que falta para la meta", "Lo mismo que el período pasado", "Tu promedio de gasto" y "Tu promedio de gasto ({n} períodos)" **(nuevo)** **[B1]**, cada uno con su monto.

**Criterios de aceptación.**
- **CA-12.1** Dado el paso 2 de ESC-35, cuando toco "Lo que falta para la meta" en Gas, entonces Asignado queda en $120.00 y la falta en $0.00.
- **CA-12.2** Dado Asignado $250.00 en el período anterior, cuando toco "Lo mismo que el período pasado", entonces Asignado queda en $250.00.
- **CA-12.3** Dado Gastado $100.00, $100.00 y $100.02 en los 3 períodos cerrados en que existía la categoría, cuando toco "Tu promedio de gasto", entonces Asignado queda en $100.01 (mitad hacia arriba de 10,000.67 centavos).
- **CA-12.4** Dado una categoría sin asignación ni actividad en el período cerrado más reciente, cuando calculo el promedio, entonces ese período no cuenta y se usan los 3 anteriores en que existía (3.14).
- **CA-12.5** Dado que el valor rápido dejaría LPA negativo en el activo, cuando lo toco, entonces aparece AV-11 antes de confirmar.
- **CA-12.6** **[B1]** Dado una categoría que existió en 2 períodos cerrados, con Gastado $80.00 y $90.00, cuando abro asignar, entonces se ofrece "Tu promedio de gasto (2 períodos)" con $85.00; con 1 período, "(1 período)" **(nuevo)** y su gastado.
- **CA-12.7** **[B1]** Dado una categoría creada en el período activo, cuando abro asignar, entonces no se ofrece "Tu promedio de gasto".
- **CA-12.8** **[B1]** Dado la misma categoría con 2 períodos, cuando abro el reporte de presupuesto contra la realidad, entonces no tiene hallazgo (3.5.6 exige 3).
- **CA-12.9** **[R5]** Dado Restaurantes con Asignado $120.00 y Disponible −$26.30, cuando abro asignar desde "Cubrir $26.30", entonces la opción "Cubrir el sobregiro" trae $146.30 calculado por el servidor (`rapida.cubrirSobregiro`) y, al tocarla, Asignado queda en $146.30 con las reglas de OP-14 (AV-11 si LPA queda negativo); con Disponible ≥ 0, la opción no se ofrece (CF-25).

**Escenarios.** ESC-35 (paso 2).

**Avisos.** AV-11.

**Dependencias.** FT-10, FT-17.

#### FT-13 Auto-asignar [M]

**Objetivo.** Llenar de una vez las categorías según lo que piden sus metas, sin dejar nunca Listo para asignar negativo.

**Historias.**
- Al empezar el período quiero que Finn asigne lo que piden mis metas, en el orden de mi presupuesto.
- Si no alcanza, quiero saber qué quedó sin cubrir y por cuánto.

**Flujo.**
1. `/presupuesto/auto-asignar?periodo=` (flujo corto) → previsualización (05 §4.4) con lo que asignaría a cada categoría y lo que quedaría sin cubrir.
2. Confirmar → OP-17 con `esperado.revision`.
3. Después: AV-18 si algo quedó sin cubrir.

**Piezas.**
- Operaciones: OP-17.
- Consultas: `presupuesto()`.
- Rutas: `/presupuesto/auto-asignar`.
- Componentes: `ConfirmacionImpacto`, `Aviso`.

**Reglas.** 01 OP-17, inv. 19, supuesto 14 modificado; 04 OP-17 (revisión vista).

**Estados.**
- Sin metas con falta: "Todas tus metas de este período están cubiertas." **(nuevo)**, sin confirmar.
- LPA ≤ 0: la previsualización dice que no asignará nada y muestra AV-18 con lo que falta.

**Errores y textos.** `periodo_cerrado`, `conflicto_desactualizado`. Texto nuevo: el de "Estados".

**Criterios de aceptación.**
- **CA-13.1** Dado el paso 5 de ESC-03 (LPA −$100.00), cuando auto-asigno P1, entonces no cambia ninguna asignación y AV-18 dice que Mascota quedó sin cubrir por $50.00 (paso 6).
- **CA-13.2** Dado LPA $100.00 y tres categorías con falta de $60.00, $50.00 y $30.00 en ese orden de grupo y categoría, cuando auto-asigno, entonces reciben $60.00, $40.00 y $0.00, LPA queda en $0.00 y AV-18 lista $10.00 y $30.00.
- **CA-13.3** Dado que otra pestaña cambió algo después de la previsualización, cuando confirmo, entonces responde `conflicto_desactualizado` y no asigna nada.
- **CA-13.4** Para cualquier estado, después de OP-17, LPA ≥ 0 (prueba de propiedades sobre inv. 19).

**Escenarios.** ESC-03 (paso 6).

**Avisos.** AV-18.

**Dependencias.** FT-10, FT-17.

#### FT-14 Detalle de categoría: reparto, calendario e historial [I]

**Objetivo.** Entender de dónde sale el Disponible de una categoría: qué compras cubrió el fondo, cuáles no y con qué medio, en qué días se gastó y cómo le fue en los períodos anteriores.

**Historias.**
- Al tocar una categoría sobregirada quiero ver cuánto es de tarjeta y cuánto de débito, y qué compras no se cubrieron.
- Quiero ver un calendario de los días en que gasté en ella.
- Quiero ver su meta, sus programadas y sus reglas.

**Flujo.**
1. `/presupuesto/categorias/[categoriaId]?periodo=` → `detalleCategoria()`.
2. Normal: números (asignado, gastado, arrastrado, disponible, fondo), sobregiro con sus dos partes, consumos en el orden D2 con cubierto y no cubierto, entradas, meta, calendario, historial de 6 períodos, programadas y reglas.
3. Pago: ver FT-29.
4. Acciones: asignar (FT-10), mover (FT-11), archivar y fusionar (FT-19, FT-20), meta (FT-17), sacar o desarchivar si está archivada (FT-19).

**Piezas.**
- Operaciones: enlaces a OP-14, OP-15, OP-09, OP-12, OP-18, OP-11; [1T] OP-10.
- Consultas: `detalleCategoria()` (con CP-9 y CF-17).
- Rutas: `/presupuesto/categorias/[categoriaId]`.
- Componentes: `Monto`, `IndicadorEstado`, `ResumenMeta`, `SelectorPeriodo`, `GraficoBarras` (calendario y su tabla), `Aviso`.

**Reglas.** 01 §4.4 a §4.7 (D2, SobT, SobD), §4.12 (metas); PF-2 (montos al tocar); 04 §6.3; 3.14 (historial en los períodos en que existía).

**Estados.**
- Sin consumos en el período: "Sin gastos en este período".
- Categoría archivada: sin asignar ni mover hacia ella; con "Sacar" si tiene Disponible y [1T] "Desarchivar".
- Período cerrado: sin acciones de asignación.

**Errores y textos.** `no_encontrado` (id inexistente → "Esto ya no existe."). Textos del glosario de 05 §12.3 ("Deuda sin reservar en {categoría}", "Esta deuda suma a lo que te falta reservar para {tarjeta}"). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-14.1** Dado el paso 1 de ESC-17, cuando abro Super, entonces los consumos aparecen en este orden: débito $60.00 (cubierto $60.00) y tarjeta $70.00 (cubierto $40.00, no cubierto $30.00); el sobregiro es de tarjeta, $30.00.
- **CA-14.2** Dado el paso 2 de ESC-17, cuando abro Super, entonces el débito olvidado de $20.00 aparece al final, no cubierto, y el sobregiro es mixto: tarjeta $30.00 y débito $20.00.
- **CA-14.3** Dado el paso 2 de ESC-19, cuando abro Super, entonces la línea de $110.00 de la compra con T muestra cubierto $100.00 y no cubierto $10.00.
- **CA-14.4** Dado compras en 3 días del período, cuando abro el calendario, entonces muestra esos 3 días con su gastado y la tabla equivalente tiene las mismas cifras.
- **CA-14.5** Dado una categoría que existió en 4 de los últimos 8 períodos cerrados, cuando abro su historial, entonces muestra esos 4 (3.14).
- **CA-14.6** Dado un sobregiro mixto, cuando miro la categoría sin tocar nada, entonces veo los dos indicadores con su nombre accesible y ningún monto del sobregiro; al tocar, aparecen los montos (PF-2).
- **CA-14.7** **[R5]** Dado el detalle de Restaurantes de A.7, cuando toco "Cubrir $26.30", entonces se abre asignar con $146.30 de `rapida.cubrirSobregiro` (CA-12.9); la interfaz no suma.
- **CA-14.8** **[R5]** Dado un período con gasto en tres días ($10.00, $40.00 y $20.00), cuando abro el calendario, entonces `intensidadBp` es 2,500, 10,000 y 5,000; un día cuyas devoluciones superan los consumos tiene 0; si ningún día tiene gasto positivo, todos son 0.
- **CA-14.9** **[R5]** Dado un historial de 6 períodos con gastado mayor que el asignado en 2, cuando abro el detalle, entonces `historialResumen.periodosExcedidos` es 2 ("Se pasó 2 de 6") y el promedio gastado lo da el servidor; con 3 períodos en el historial, "Se pasó k de 3".
- **CA-14.10** **[R5]** Dado Fondo de emergencia con $1,350.00 de una meta de ahorro de $3,000.00, cuando abro el detalle, entonces `meta.progresoBp` es 4,500, el mismo valor que en `metas()`; con más de $3,000.00, 10,000.

**Escenarios.** ESC-17 (pasos 1 y 2), ESC-19 (paso 2).

**Avisos.** AV-02, AV-03, AV-14, AV-17.

**Dependencias.** FT-09.

#### FT-15 Detalle de Listo para asignar [M]

**Objetivo.** Explicar cómo se compone Listo para asignar hoy y cuánto valía al cierre de cada período, con el valor exacto (error 12).

**Historias.**
- Quiero entender por qué Listo para asignar tiene ese valor: entradas, lo asignado y lo que redujeron los sobregiros y el dinero en camino.
- Quiero ver su historia, período a período.

**Flujo.**
1. `/presupuesto/listo-para-asignar?historial=` → `detalleLpa()`.
2. Descomposición, reducción proyectada al cierre (por categoría y tarjeta) e historial con gráfico y tabla.

**Piezas.**
- Operaciones: ninguna.
- Consultas: `detalleLpa()`.
- Rutas: `/presupuesto/listo-para-asignar`.
- Componentes: `Monto`, `GraficoLineas` con su tabla, `Aviso`.

**Reglas.** 01 §4.9 (LPA, LPA al cierre, B-4), §4.13 (clasificación); 04 §6.4.

**Estados.** Nota permanente de B-4 (`sin_adelantos`) junto al historial.

**Errores y textos.** `?historial=` fuera de 1 a 60 → se quita el parámetro (05 §2.2). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-15.1** Para cualquier estado, la suma de la descomposición es exactamente `lpa` (prueba de propiedades, 04 §6.4).
- **CA-15.2** Dado el paso 3 de ESC-02, cuando abro el historial, entonces LPA al cierre de P1 es $500.00.
- **CA-15.3** Dado el paso 3 de ESC-17, cuando abro el detalle, entonces "Reducciones por sobregiro con débito" es $20.00.
- **CA-15.4** Dado el paso 2 de ESC-15, cuando abro el detalle, entonces la reducción proyectada al cierre es $50.00 y lista Salidas.
- **CA-15.5** Dado el paso 1 de ESC-40, cuando abro el detalle, entonces "Otras entradas" es $5,000.00 e "Ingresos" $0.00.

**Escenarios.** ESC-02 (paso 3), ESC-17 (paso 3), ESC-40 (paso 1).

**Avisos.** AV-09, AV-20.

**Dependencias.** FT-09.

#### FT-16 Sobregiros y cierre automático del período [I]

**Objetivo.** Que cada período se cierre solo en su fecha, sin botón, y que los sobregiros reciban el trato de su medio: el de débito reduce Listo para asignar al cierre y el de tarjeta queda como deuda que falta reservar.

**Historias.**
- Quiero ver con color, y sin montos a la vista, qué categorías se sobregiraron y con qué medio.
- Quiero saber antes del cierre cuánto va a bajar Listo para asignar.
- Quiero que el período nuevo empiece solo, con los arrastres correctos, aunque no abra la app ese día.

**Flujo.**
1. Durante el período: los indicadores de sobregiro en Presupuesto, Inicio y el detalle; al tocar, los montos (PF-2).
2. Al llegar el inicio del período siguiente, el período anterior pasa a cerrado sin ninguna operación (01 §7.3).
3. La tarea diaria envía una vez el push de cierre con la reducción aplicada (04 §10.2 paso 3; FT-71) con destino `presupuesto` del período que cerró.

**Piezas.**
- Operaciones: ninguna (derivado).
- Consultas: `inicio()`, `presupuesto()`, `detalleCategoria()`, `detalleLpa()`.
- Rutas: `/`, `/presupuesto`, `/presupuesto/categorias/[categoriaId]`.
- Componentes: `IndicadorEstado`, `FilaCategoria`, `Aviso`.

**Reglas.** 01 §4.5 a §4.7 (D2, SobT, SobD, E), §4.15 (identidad), C1, C2, inv. 1 y 28; 01 §7.3 (período derivado); 04 §10.2 (push de cierre, BE-51); PF-2.

**Estados.** Sobregiro de débito, de tarjeta o mixto (05 §10.3), siempre con indicador no cromático.

**Errores y textos.** Sin errores propios. Textos de AV-02 y AV-03 (04 §7.10).

**Criterios de aceptación.**
- **CA-16.1** Dado el paso 2 de ESC-05, cuando la fecha de hoy pasa al 21 de febrero, entonces, sin ninguna operación, Super queda en $0.00, LPA sigue en $700.00 y "Te falta reservar" de T sigue en $100.00 (paso 3).
- **CA-16.2** Dado el paso 2 de ESC-15, cuando llega el cierre, entonces LPA baja de $400.00 a $350.00 (paso 3).
- **CA-16.3** Dado el paso 2 de ESC-17, cuando llega el cierre, entonces LPA baja $20.00 (solo la parte de débito) y "Te falta reservar" no cambia (paso 3).
- **CA-16.4** Dado el paso 3 de ESC-10, cuando llega el cierre, entonces LPA baja de $100.00 a $50.00 por el pago excedente (paso 4).
- **CA-16.5** Dado que la app no se usó durante 3 períodos, cuando se ejecuta la tarea diaria, entonces se envía un solo push de cierre (el del último período) y los anteriores quedan en `eventos_sistema` (BE-51).
- **CA-16.6** Dado el paso 2 de ESC-49, cuando llega el cierre de P1, entonces LPA queda en $450.00 y Super en P2 en $300.00 (paso 3).
- **CA-16.7** Para cualquier estado y cualquier "hoy", se cumplen inv. 1 y 28 (prueba de propiedades con el reloj simulado de 04 §13.1.4).

**Escenarios.** ESC-05, ESC-10 (paso 4), ESC-15, ESC-17 (paso 3), ESC-49.

**Avisos.** AV-02, AV-03, AV-04.

**Dependencias.** FT-09, FT-21, FT-30; FT-71 para el push. **[F8]** (CH-07): de datos, FT-71; las demás, de construcción.

#### FT-17 Metas [I]

**Objetivo.** Que cada categoría pueda tener una meta (mensual, semanal, anual o para una fecha) que diga cuánto falta asignar, sin asignar sola, y que arrastre bien (error 7).

**Historias.**
- Quiero una meta mensual con "acumular" o "rellenar hasta".
- Quiero ahorrar para un viaje con una meta para una fecha, repartida entre los períodos que faltan.
- Si una meta con fecha venció sin cumplirse, quiero extender la fecha o ajustar el monto.

**Flujo.**
1. Desde el detalle de categoría o `/metas` → `/metas/nueva?categoria=` o `/metas/[metaId]` (flujos cortos).
2. Tipo, modo (mensual y semanal), monto y fecha objetivo → OP-18.
3. El pedido y la falta aparecen en Presupuesto, el detalle y `/metas`.
4. Meta vencida: AV-17 en Inicio y `/metas`, con "Extender la fecha" y "Ajustar el monto" (OP-18 editar).

**Piezas.**
- Operaciones: OP-18.
- Consultas: `metas()`, `formulario` (`meta`).
- Rutas: `/metas`, `/metas/nueva`, `/metas/[metaId]`.
- Componentes: `ResumenMeta`, `BarraProgreso`, `Aviso`.

**Reglas.** 01 §4.12, OP-18, I2, N8, O5, F2, H11, A-4, B-3; 04 OP-18 y §6.10.

**Estados.**
- Sin metas: enlace a crear una con `categoriasSinMeta`.
- Categoría archivada con meta: la meta se conserva sin evaluarse (B-11).

**Errores y textos.** `meta_ya_existe`, `meta_en_categoria_de_pago`, `fecha_objetivo_pasada`, `categoria_archivada`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-17.1** Dado el paso 2 de ESC-35, cuando abro Presupuesto en P2, entonces Gas (rellenar hasta) pide $120.00 y Fondo (acumular) pide $200.00.
- **CA-17.2** Dado una meta semanal de $50.00, cuando abro P1 (31 días), P2 (28) y P4 (30), entonces el monto del período es $221.43, $200.00 y $214.29 (ESC-36).
- **CA-17.3** Dado la meta anual de ESC-37, cuando abro P1, entonces pide $92.31 con n = 13; y en el período siguiente a la renovación, con Base $600.00, pide $50.00 (paso 5).
- **CA-17.4** Dado la meta de ESC-38 sin cumplirse en P5 (paso 5b), cuando abro Inicio, entonces veo AV-17; al extender la fecha al 15 de julio, el pedido pasa a $100.00 y AV-17 desaparece (paso 6b).
- **CA-17.5** Dado una meta para una fecha con fecha objetivo anterior a hoy, cuando la creo, entonces se rechaza con `fecha_objetivo_pasada`.
- **CA-17.6** Dado una categoría de pago, cuando abro su detalle, entonces no se ofrece crear una meta.
- **CA-17.7** Dado cualquier meta, cuando pasa un período, entonces ninguna asignación cambia sola.

**Escenarios.** ESC-35, ESC-36, ESC-37, ESC-38.

**Avisos.** AV-17.

**Dependencias.** FT-09, FT-10.

#### FT-18 Grupos y categorías: crear, renombrar, reordenar y eliminar [I]

**Objetivo.** Administrar la estructura del presupuesto: grupos y categorías, su nombre, su orden y su grupo, y eliminar lo que nunca se usó.

**Historias.**
- Quiero crear grupos y categorías, renombrarlos y moverlos de grupo.
- Quiero reordenarlos como los pienso.
- Quiero eliminar una categoría que creé por error.

**Flujo.**
1. `/presupuesto/estructura` (flujo largo, pantalla completa) → `estructura()`.
2. Nuevo grupo: `/presupuesto/estructura/grupos/nuevo`; nueva categoría: `/presupuesto/estructura/categorias/nueva?grupo=` (OP-07).
3. Editar: `/presupuesto/estructura/grupos/[grupoId]` y `/presupuesto/estructura/categorias/[categoriaId]` (OP-08, OP-13).
4. [1T] Subir o bajar (OP-08 `orden`), con "Deshacer".
5. Sin categorías normales: la plantilla (FT-04).

**Piezas.**
- Operaciones: OP-07, OP-08, OP-13.
- Consultas: `estructura()`.
- Rutas: `/presupuesto/estructura`, `/presupuesto/estructura/grupos/nuevo`, `/presupuesto/estructura/grupos/[grupoId]`, `/presupuesto/estructura/categorias/nueva`, `/presupuesto/estructura/categorias/[categoriaId]`.
- Componentes: lista de la estructura, `EntradaTexto`, `Aviso`.

**Reglas.** 01 OP-07, OP-08, OP-13, H9, supuesto 18; 04 §6.12.4, S3-9 (grupo del sistema).

**Estados.**
- "Pagos de tarjeta": sin acciones (`grupo_del_sistema`); sus categorías se muestran sin archivar ni eliminar.
- Categoría con historial: "Eliminar" deshabilitado con el motivo y los enlaces a archivar (FT-19) o fusionar (FT-20).

**Errores y textos.** `nombre_repetido`, `grupo_archivado`, `grupo_del_sistema`, `categoria_con_historial`, `grupo_no_vacio`, `grupo_con_categorias_activas`, `categoria_de_pago_con_tarjeta`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-18.1** Dado "Supermercado" en "Vida diaria", cuando creo "supermercado" en el mismo grupo, entonces se rechaza con `nombre_repetido`; en otro grupo se acepta.
- **CA-18.2** Dado una categoría sin líneas, eventos, asignaciones, programadas ni reglas, cuando la elimino, entonces desaparece; con una asignación, "Eliminar" está deshabilitado con el mensaje de `categoria_con_historial`.
- **CA-18.3** Dado que toco "Bajar" en una categoría, cuando toco "Deshacer", entonces vuelve a su lugar.
- **CA-18.4** Dado el grupo "Pagos de tarjeta", cuando intento mover una categoría normal a él con OP-08, entonces se rechaza con `grupo_del_sistema`.
- **CA-18.5** Dado un grupo con categorías activas, cuando intento archivarlo, entonces se rechaza con `grupo_con_categorias_activas`; con todas archivadas, se archiva.
- **CA-18.6** Dado una categoría renombrada, cuando abro un período cerrado en que se usó, entonces aparece con el nombre nuevo (01 OP-08).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-01.

#### FT-19 Archivar y desarchivar categorías, y sacar el dinero de una archivada [I]

**Objetivo.** Retirar una categoría de la vista diaria sin perder su historial (error 1), resolviendo en el mismo paso su dinero, sus asignaciones futuras y sus programadas.

**Historias.**
- Quiero archivar una categoría que ya no uso y que Finn me ayude a mover su dinero, devolver lo futuro y decidir sus programadas.
- Si una devolución le deja dinero a una categoría archivada, quiero que Finn me avise y sacarlo.
- Quiero desarchivar una categoría si vuelvo a necesitarla.

**Flujo.**
1. Detalle de categoría → `/presupuesto/categorias/[categoriaId]/archivar` (flujo largo) → `formulario({ operacion: 'archivar_categoria' })`.
2. Decisiones: destino del Disponible (otra categoría o LPA), con qué se cubre un Disponible negativo, devolver las asignaciones futuras, y para cada programada activa reasignarla o desactivarla.
3. Previsualizar y confirmar → OP-09.
4. Archivada con Disponible: AV-14 con la propuesta de sacarlo (OP-11 de un toque) o `/presupuesto/categorias/[categoriaId]/sacar` (flujo corto) para elegir destino y monto.
5. [1T] Desarchivar (OP-10) desde el detalle o la estructura; ofrece el enlace al flujo de archivar como salida.

**Piezas.**
- Operaciones: OP-09, OP-10, OP-11.
- Consultas: `formulario` (`archivar_categoria`; `asignar` con CP-10a para sacar), `detalleCategoria()`, `presupuesto()`.
- Rutas: `/presupuesto/categorias/[categoriaId]/archivar`, `/presupuesto/categorias/[categoriaId]/sacar`.
- Componentes: `ConfirmacionImpacto`, `Aviso`, `EntradaMonto`.

**Reglas.** 01 OP-09 a OP-11, H10, M3, N5, R4, inv. 20, A-1, A-5, ajuste 1; 04 §6.14.4 (`archivar_categoria`).

**Estados.**
- Nada que decidir (Disp $0.00, sin futuras ni programadas): el flujo es solo la confirmación.
- Categoría de pago: no se ofrece (se archiva con su tarjeta, FT-53).

**Errores y textos.** `programada_sin_decision`, `categoria_ya_archivada`, `categoria_no_archivada`, `categoria_de_pago_con_tarjeta`, `destino_igual_origen`, `monto_mayor_que_disponible`, `grupo_archivado` (desarchivar). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-19.1** Dado el paso 0 de ESC-44, cuando archivo Gimnasio con su Disponible a LPA, las futuras devueltas y la programada desactivada, entonces LPA es $670.00, Gimnasio no aparece en Presupuesto y la programada queda inactiva (paso 1).
- **CA-19.2** Dado el paso 1 de ESC-44, cuando registro la devolución de $25.00 vinculada a la compra del 2 de febrero, entonces Gimnasio queda con $25.00 y aparece AV-14 en Inicio y Presupuesto (paso 2).
- **CA-19.3** Dado el paso 2 de ESC-44, cuando intento condonar hacia Gimnasio, entonces se rechaza y se propone una categoría activa (paso 3).
- **CA-19.4** Dado el paso 2 de ESC-44, cuando toco la propuesta de AV-14, entonces LPA sube a $695.00 y AV-14 desaparece (paso 4).
- **CA-19.5** Dado una categoría con una programada activa, cuando envío OP-09 sin decidir sobre ella, entonces se rechaza con `programada_sin_decision`.
- **CA-19.6** Dado una categoría archivada, cuando abro un período cerrado en que se usó, entonces aparece con su nombre y sus números (R4).
- **CA-19.7** Dado una categoría archivada en un grupo archivado, cuando la desarchivo sin desarchivar el grupo, entonces se rechaza con `grupo_archivado`.

**Escenarios.** ESC-44.

**Avisos.** AV-14.

**Dependencias.** FT-14, FT-18; FT-40 (programadas) para el paso de las programadas. **[F8]** (CH-07): de datos, FT-40; las demás, de construcción.

#### FT-20 Fusionar categorías [M]

**Objetivo.** Juntar dos categorías que en realidad son una, moviendo todo el historial de una a la otra, como si siempre hubieran sido una sola.

**Historias.**
- Quiero fusionar "Café" en "Salidas" y ver antes qué cambia en cada período.

**Flujo.**
1. Detalle de categoría → `/presupuesto/categorias/[categoriaId]/fusionar` (flujo largo) → `formulario({ operacion: 'fusionar' })`.
2. Elegir el destino entre los válidos; ver el resumen (períodos con asignación, transacciones, condonaciones, programadas, reglas, meta que se descarta).
3. Previsualizar: AV-13 (Δ por período) y AV-01; confirmar siempre (04 §4.3).
4. OP-12; vuelve al detalle del destino.

**Piezas.**
- Operaciones: OP-12.
- Consultas: `formulario` (`fusionar`).
- Rutas: `/presupuesto/categorias/[categoriaId]/fusionar`.
- Componentes: `ConfirmacionImpacto`.

**Reglas.** 01 OP-12, N4, O4, F3, inv. 18 (excepción), inv. 23, CB-20; 04 OP-12.

**Estados.** Sin destinos válidos: lo explica y no deja continuar.

**Errores y textos.** `fusion_misma_categoria`, `fusion_categoria_de_pago`, `fusion_destino_archivado`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-20.1** Dado el paso 0 de ESC-42, cuando fusiono Café en Salidas, entonces la previsualización muestra Δ LPA +$30.00, Δ Salidas −$30.00 y que se descarta la meta de Café; al confirmar, LPA es $850.00 y Salidas $30.00 (paso 1).
- **CA-20.2** Dado la fusión hecha, cuando abro P1, entonces Salidas muestra Asignado $150.00 y Gastado $120.00, y Café no existe.
- **CA-20.3** Dado que el impacto es nulo, cuando fusiono, entonces igual se pide confirmar.
- **CA-20.4** Dado una categoría de pago como origen o destino, cuando intento fusionar, entonces se rechaza con `fusion_categoria_de_pago`.
- **CA-20.5** Dado que el destino tiene meta, cuando fusiono, entonces el destino conserva la suya (CB-20).

**Escenarios.** ESC-42.

**Avisos.** AV-13, AV-01.

**Dependencias.** FT-14, FT-18.

### 2.3 Transacciones

#### FT-21 Registrar gasto con división y por cobrar [I]

**Objetivo.** Registrar a mano un gasto que no llegó por SMS, repartido en una o varias categorías y, si corresponde, con una parte por cobrar a otra persona, sin que ninguna parte quede sin destino (error 9).

**Historias.**
- Quiero registrar un gasto en efectivo o con tarjeta, con su fecha real.
- Quiero dividir una compra entre Supermercado y Mascota.
- Si pagué la cena de un amigo, quiero que su parte quede por cobrar a su nombre.
- Si se me corta la conexión o recargo, no quiero perder lo que escribí.

**Flujo.**
1. "Registrar" (marco) → `/registrar` → `/registrar/gasto?cuenta=` (flujo largo) → `formulario({ operacion: 'registrar', tipo: 'gasto' })`.
2. Cuenta (preseleccionada: la del último gasto o `?cuenta=`), fecha (por defecto `hoy` del `Encabezado`), total, comercio con sugerencia de categoría (`sugerencia`, CP-3), nota y moneda original opcional.
3. Líneas (`CampoLineas`, 1 a 20): categoría o por cobrar (deudor existente o nuevo).
4. Si la fecha cae en un período cerrado: confirmación AV-01 (FT-27).
5. OP-20; vuelve al origen. Después, en el destino: AV-02, AV-03, AV-07 o AV-09 si aparecen.

**Piezas.**
- Operaciones: OP-20.
- Consultas: `formulario` (`registrar`, `gasto`), `sugerencia` (CP-3).
- Rutas: `/registrar`, `/registrar/gasto`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `CampoLineas`, `Buscador`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-20, P5, P10, N3, inv. 6, 8, 12, 20; 01 §4.17 (sugerencia por regla y por historial); 04 OP-20 y `DestinoLinea` (`deudorNuevo` reutiliza el deudor del mismo nombre); 05 §4.11 (borrador), §5.2 (montos), PF-3 (la suma la valida el servidor; el cliente solo ayuda a ver la diferencia).

**Estados.**
- Borrador recuperado: "Recuperamos lo que estabas escribiendo" y "Descartar borrador" (05 §4.11).
- Sin cuentas: `/registrar` enlaza a `/cuentas/nueva`.
- Cuenta archivada: no se ofrece en la lista.

**Errores y textos.** `suma_lineas_distinta`, `linea_sin_destino`, `categoria_archivada`, `categoria_de_pago_no_permitida`, `cuenta_archivada`, `cuenta_tipo_no_valido`, `fecha_posterior_a_hoy`, `fecha_anterior_a_apertura`. Sin textos nuevos (el de la diferencia, "Falta repartir {monto}", ya está en 05 §12.1).

**Criterios de aceptación.**
- **CA-21.1** Dado el paso 1 de ESC-19, cuando registro una compra con T de $150.00 con $110.00 en Super y $40.00 en Mascota, entonces Super queda en −$10.00, Mascota en −$20.00, Pago T en $120.00 y "Te falta reservar" en $30.00 (paso 2).
- **CA-21.2** Dado el paso 1 de ESC-24, cuando registro una compra con T de $200.00 con $90.00 en Super, $30.00 en Mascota y $80.00 por cobrar a Ana, entonces Super queda en $10.00, Mascota en $20.00, Pago T en $120.00 y "Te falta reservar" en $80.00 (paso 2).
- **CA-21.3** Dado el paso 1 de ESC-20, cuando registro una compra con débito de $50.00 con $25.00 en Super y $25.00 por cobrar a Ana, entonces Listo para asignar baja a $675.00 y "En camino" es $25.00 (paso 2).
- **CA-21.4** Dado un deudor "Ana", cuando escribo "ana" como deudor nuevo, entonces la línea queda a nombre del deudor existente y el resultado lo dice.
- **CA-21.5** Dado líneas que suman $149.00 con un total de $150.00, cuando envío, entonces se rechaza con "Las partes suman $149.00 y el total es $150.00." junto al campo de líneas.
- **CA-21.6** Dado una línea sin categoría ni deudor, cuando envío, entonces se rechaza con `linea_sin_destino` y no se crea nada.
- **CA-21.7** Dado una fecha posterior a hoy o anterior a la apertura de la cuenta, cuando envío, entonces se rechaza con el código que corresponde y el mensaje nombra la fecha límite.
- **CA-21.8** Dado el paso 1 de ESC-12, cuando registro un cargo con T de $25.00 en "Intereses y comisiones", entonces Int queda en −$5.00 con sobregiro de tarjeta $5.00 y Pago T en $20.00 (paso 2).
- **CA-21.9** Dado un formulario a medio llenar, cuando recargo la pestaña, entonces se restauran los campos y las líneas, con el mismo id de creación.
- **CA-21.10** Dado un comercio con una regla hacia Supermercado, cuando lo escribo, entonces se sugiere Supermercado; sin regla, la categoría de la última compra aprobada en ese comercio (01 §4.17).
- **CA-21.11** Dado 21 líneas, cuando envío, entonces el contrato lo rechaza (máximo 20) antes de llegar al servidor.
- **CA-21.12** **[R5]** Dado un gasto de $148.60 con 3 líneas en el período activo, cuando toco "Guardar", entonces se guarda sin previsualizar y el resultado dice "Guardado: PRICESMART · $148.60 · Visa Oro · 3 líneas" con un enlace a cada categoría tocada; con la fecha en un período cerrado, primero aparece `ConfirmacionImpacto` con AV-01 (P6-27).

**Escenarios.** ESC-12, ESC-19, ESC-20 (paso 2), ESC-24.

**Avisos.** AV-01, AV-02, AV-03, AV-07, AV-09.

**Dependencias.** FT-50 (cuentas), FT-18 (categorías).

#### FT-22 Registrar ingreso [I]

**Objetivo.** Registrar dinero que entra a una cuenta de efectivo y que pasa a Listo para asignar.

**Historias.** Quiero registrar mi salario o cualquier ingreso con su fecha y verlo en Listo para asignar.

**Flujo.** `/registrar` → `/registrar/ingreso?cuenta=` (flujo corto) → cuenta de efectivo, fecha, total, descripción → OP-21.

**Piezas.**
- Operaciones: OP-21.
- Consultas: `formulario` (`registrar`, `ingreso`).
- Rutas: `/registrar/ingreso`.
- Componentes: `EntradaMonto`, `EntradaFecha`.

**Reglas.** 01 OP-21, H2, §4.13 (clase ingreso); dinero que llega a una tarjeta es FT-32 (OP-27b) y un cobro es FT-46 (OP-31).

**Estados.** Solo se ofrecen cuentas de efectivo abiertas.

**Errores y textos.** `cuenta_tipo_no_valido`, `cuenta_archivada`, `fecha_posterior_a_hoy`, `fecha_anterior_a_apertura`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-22.1** Dado una base con Ahorro en $0.00, cuando registro un ingreso de $1,000.00, entonces Listo para asignar es $1,000.00 (paso 1 de ESC-03).
- **CA-22.2** Dado una tarjeta como cuenta, cuando envío OP-21 directamente, entonces se rechaza con `cuenta_tipo_no_valido`.
- **CA-22.3** Dado un ingreso registrado, cuando abro el reporte de ingresos frente a gastos (FT-60), entonces aparece como ingreso.

**Escenarios.** ESC-03 (paso 1).

**Avisos.** AV-01.

**Dependencias.** FT-50.

#### FT-23 Transferencia entre cuentas propias [I]

**Objetivo.** Mover dinero entre dos cuentas de efectivo sin cambiar el presupuesto.

**Historias.** Quiero pasar dinero de mi cuenta de ahorro a la de débito.

**Flujo.** `/registrar/transferencia?cuenta=` (flujo corto) → origen, destino, fecha y total → OP-22.

**Piezas.**
- Operaciones: OP-22.
- Consultas: `formulario` (`registrar`, `transferencia`).
- Rutas: `/registrar/transferencia`.
- Componentes: `EntradaMonto`, `EntradaFecha`.

**Reglas.** 01 OP-22, P15, CB-29. El pago de tarjeta (FT-30) y el de préstamo (FT-54) no son transferencias en Finn.

**Estados.** Con una sola cuenta de efectivo, `/registrar` no ofrece la transferencia.

**Errores y textos.** `cuentas_iguales`, `cuenta_tipo_no_valido`, `cuenta_archivada`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-23.1** Dado Ahorro $500.00 y Débito $0.00, cuando transfiero $200.00, entonces quedan $300.00 y $200.00, y Listo para asignar y todos los Disponibles no cambian.
- **CA-23.2** Dado el mismo origen y destino, cuando envío, entonces se rechaza con "Elegí dos cuentas distintas.".
- **CA-23.3** Dado una transferencia, cuando abro Actividad, entonces se muestra con monto presentado $0.00 y las dos cuentas.

**Escenarios.** —

**Avisos.** AV-01.

**Dependencias.** FT-50.

#### FT-24 Actividad con búsqueda y filtros [I]

**Objetivo.** Ver todas las transacciones de todas las cuentas, agrupadas por día, y encontrar una por comercio, monto, nota, categoría, cuenta, fechas, estado, tipo u origen.

**Historias.**
- Quiero buscar "selectos" y ver todas mis compras ahí.
- Quiero filtrar por categoría y fechas, y por monto (por ejemplo, compras de hasta $10.00).
- Quiero ver qué transacciones siguen pendientes ante el banco.

**Flujo.**
1. `/actividad` con los parámetros de 05 §2.2 → `actividad()`.
2. Lista por día con `FilaTransaccion` (marcas: por cobrar, con devoluciones, conciliada, programada, período cerrado).
3. "Cargar más" con `?cursor=`.
4. Cada fila → detalle (FT-25), con `?volver=`.

**Piezas.**
- Operaciones: ninguna.
- Consultas: `actividad()`.
- Rutas: `/actividad`.
- Componentes: `FilaTransaccion`, `Monto`, `EntradaTexto`, `Seleccion`, `EntradaFecha`, `EntradaMonto`, `EstadoVacio`.

**Reglas.** 04 §6.7.1 (búsqueda en comercio y nota; `montoDesde` y `montoHasta` comparan con el total), §6.0.6 (paginación estable); 05 §2.6 (espera de 300 ms en `?texto=`).

**Estados.**
- Sin transacciones: "Todavía no hay transacciones".
- Con filtros y sin resultados: "Sin resultados con estos filtros" y "Quitar filtros".

**Errores y textos.** Un parámetro inválido se quita (05 §2.2). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-24.1** Dado compras en "SUPER SELECTOS" y una nota "selectos de la colonia" en otra transacción, cuando busco "selectos", entonces aparecen las dos.
- **CA-24.2** Dado `?texto=50%`, cuando busco, entonces `%` se trata como texto y no como comodín.
- **CA-24.3** **[R4]** Dado `?categoria=<Cafés>&tipo=gasto&desde=2026-09-21&hasta=2026-10-20&monto-hasta=10.00`, cuando abro la URL, entonces veo solo los gastos con una línea en esa categoría, en esas fechas y con total ≤ $10.00, sin devoluciones ni otros tipos (la acción del hallazgo de hormiga, 3.5.8, lleva a esta URL).
- **CA-24.4** Dado 120 transacciones, cuando cargo más dos veces, entonces veo las 120 sin repetidas ni faltantes, aunque se registre una nueva entre cargas.
- **CA-24.5** Dado un gasto, un ingreso y una transferencia, cuando los veo en la lista, entonces el monto presentado es negativo, positivo y $0.00, respectivamente.
- **CA-24.6** Dado que escribo "sel" rápido, cuando pasan menos de 300 ms entre teclas, entonces la URL cambia una sola vez.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-21.

#### FT-25 Detalle y edición completa [I]

**Objetivo.** Ver todo sobre una transacción y corregir cualquier campo (monto, fecha, cuenta, comercio, líneas, nota) con su efecto correcto en el presupuesto (error 8).

**Historias.**
- Quiero ver de dónde vino (SMS, manual, importada o programada), su reparto y sus eventos.
- Quiero corregir el monto, la fecha o la cuenta sin borrarla y crearla de nuevo.
- Si estaba conciliada, quiero que Finn me advierta antes.

**Flujo.**
1. `/actividad/[transaccionId]` → `detalleTransaccion()`: datos, efectos, líneas con reparto (cubierto y no cubierto), eventos, origen (texto del SMS), conciliación y cambios posteriores.
2. "Editar" → `/actividad/[transaccionId]/editar` (flujo largo) → `formulario({ operacion: 'editar_transaccion' })`.
3. Confirmación si corresponde: AV-16 (conciliada), AV-01 (período cerrado o cambio de período).
4. OP-28; vuelve al detalle.

**Piezas.**
- Operaciones: OP-28.
- Consultas: `detalleTransaccion()`, `formulario` (`editar_transaccion`), `sugerencia` (CP-3).
- Rutas: `/actividad/[transaccionId]`, `/actividad/[transaccionId]/editar`.
- Componentes: `Monto`, `CampoLineas`, `EntradaMonto`, `EntradaFecha`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-28 (tabla de campos), I6, supuesto 5 (clave de orden al cambiar la fecha), P12 y N6 (conciliada), criterio YNAB de 2.3 (cambio de medio), A-1, CB-24, CB-30, CB-32; 04 §6.7.2 (`restricciones`), §6.14.4 (archivadas marcadas).

**Estados.**
- Acciones no permitidas por `restricciones`: deshabilitadas con su motivo.
- Cuenta o categoría archivada que ya usa la transacción: aparece marcada y se puede conservar; no se puede elegir otra archivada.
- Cuenta archivada: solo categoría, comercio y nota (CB-24).

**Errores y textos.** `cambio_cuenta_con_devoluciones`, `cambio_tipo_de_cuenta_incompatible`, `linea_menor_que_eventos`, `linea_con_eventos_cambio_destino`, `fecha_posterior_a_eventos`, `cuenta_archivada`, `suma_lineas_distinta`, `conflicto_desactualizado`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-25.1** Dado el paso 2 de ESC-17, cuando cambio la cuenta de la compra T70 a Ahorro, entonces Super queda en −$50.00 todo de débito y "Te falta reservar" de T en $0.00 (paso 3 de ESC-18).
- **CA-25.2** Dado el paso 1 de ESC-34, cuando cambio la fecha del débito al 22 de febrero, entonces veo AV-01 (Δ LPA +$30.00, Δ Salidas −$30.00) antes de confirmar; al confirmar, LPA es $350.00 y Salidas $70.00 (paso 2), y la clave de orden es el instante del cambio.
- **CA-25.3** Dado el paso 1 de ESC-47, cuando edito el monto de A a $45.00, entonces veo AV-16 antes; al confirmar, A pasa a confirmada, se registra un cambio posterior y la diferencia actual es +$5.00 (paso 3).
- **CA-25.4** Dado una transacción conciliada, cuando cambio solo su categoría, entonces sigue conciliada y no se registra un cambio posterior (P12).
- **CA-25.5** Dado una compra con una devolución vinculada, cuando intento cambiar su cuenta, entonces se rechaza con `cambio_cuenta_con_devoluciones` y el campo está deshabilitado con ese motivo.
- **CA-25.6** Dado una línea por cobrar con $15.00 cobrados, cuando bajo la línea a $10.00, entonces se rechaza con `linea_menor_que_eventos` (CB-03).
- **CA-25.7** Dado que otra pestaña editó la transacción después de abrir el flujo, cuando envío, entonces responde `conflicto_desactualizado`.
- **CA-25.8** Dado una transacción de origen SMS, cuando abro el detalle, entonces veo el texto original del SMS.

**Escenarios.** ESC-18, ESC-34, ESC-47 (paso 3).

**Avisos.** AV-01, AV-16.

**Dependencias.** FT-24.

#### FT-26 Eliminar y cambiar el estado bancario [I]

**Objetivo.** Eliminar una transacción registrada por error, con su efecto en todo lo que depende de ella, y marcar si el banco ya la confirmó.

**Historias.**
- Quiero eliminar una transacción duplicada y que todo vuelva a como estaba.
- Quiero marcar una compra como confirmada por el banco y ver mi saldo confirmado.

**Flujo.**
1. Detalle → `/actividad/[transaccionId]/eliminar` (flujo corto): AV-16 y AV-01 si corresponden → OP-29.
2. Detalle → `/actividad/[transaccionId]/estado` (flujo corto): pendiente ↔ confirmada → OP-30.

**Piezas.**
- Operaciones: OP-29, OP-30.
- Consultas: `detalleTransaccion()`.
- Rutas: `/actividad/[transaccionId]/eliminar`, `/actividad/[transaccionId]/estado`.
- Componentes: `ConfirmacionImpacto`, `Seleccion`.

**Reglas.** 01 OP-29 (si vino de un movimiento, el movimiento pasa a descartado; si resolvió una ocurrencia, vuelve a pendiente; si estaba conciliada, cambio posterior), OP-30 y §7.2 (conciliada solo por OP-47), H9, N6, CB-04, inv. 26.

**Estados.**
- Con eventos vinculados: no se elimina; explica `transaccion_con_eventos` y enlaza a sus eventos.
- `conciliada` no se ofrece en el cambio de estado.

**Errores y textos.** `transaccion_con_eventos`, `transicion_estado_bancario_invalida`, `cuenta_archivada`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-26.1** Dado el paso 1 de ESC-31, cuando elimino el débito olvidado de $50.00, entonces veo AV-01 (Δ LPA +$30.00, Δ Salidas +$20.00) y, al confirmar, el estado es exactamente el del paso 0 (ESC-33).
- **CA-26.2** Dado una transacción aprobada desde un SMS, cuando la elimino, entonces su movimiento aparece en la vista de descartados de la Bandeja y se puede restaurar.
- **CA-26.3** Dado una transacción que registró una ocurrencia programada, cuando la elimino, entonces la ocurrencia vuelve a pendiente.
- **CA-26.4** Dado una compra con un cobro, cuando intento eliminarla, entonces se rechaza con `transaccion_con_eventos`.
- **CA-26.5** Dado una transacción pendiente de $40.00 en una cuenta con saldo $100.00 y saldo confirmado $60.00, cuando la marco confirmada, entonces el saldo confirmado pasa a $100.00 y el saldo no cambia.
- **CA-26.6** Dado una transacción conciliada, cuando la elimino, entonces veo AV-16 antes y se registra un cambio posterior en su conciliación.

**Escenarios.** ESC-33.

**Avisos.** AV-01, AV-16.

**Dependencias.** FT-25.

#### FT-27 Transacción olvidada y cambios retroactivos [I]

**Objetivo.** Registrar o corregir transacciones con su fecha real aunque sea de un período cerrado, con todo lo posterior recalculado y el impacto en el período activo a la vista (error 3).

**Historias.**
- Quiero registrar una compra olvidada del período pasado con su fecha real.
- Antes de confirmar quiero ver cómo cambia el período actual, y después quiero encontrar ese aviso en Inicio.

**Flujo.**
1. Cualquier alta o edición con fecha en un período cerrado, o que mueva un hecho de período (FT-21, FT-25, FT-26, FT-28, FT-30…).
2. La previsualización muestra AV-01: Δ LPA, Δ Disponible por categoría, Δ te falta reservar, Δ reserva excedente y Δ reducción proyectada (01 §5.0.3).
3. Al confirmar, se registra la notificación `cambio_retroactivo` sin push (BE-38), que Inicio muestra hasta marcarla como leída (FT-08).

**Piezas.**
- Operaciones: todas las de 04 §3.0.5 que producen AV-01; OPT-04.
- Consultas: la previsualización de cada operación (04 §4.3); `inicio()` (`atencion.cambiosRetroactivos`).
- Rutas: las de cada operación; `/`.
- Componentes: `ConfirmacionImpacto`, `Aviso`.

**Reglas.** 01 §5.0.3 (C3), §5.0.4, P4, inv. 18 y 26, CB-26; 04 §3.0.5 (AV-01 obliga a confirmar), BE-38; 04 §10.2 (el registro automático nunca escribe en un período cerrado).

**Estados.** El aviso "después" queda en Inicio aunque se cierre la pantalla.

**Errores y textos.** `REQUIERE_CONFIRMACION` (sin confirmar no se escribe). Textos de AV-01 del catálogo del servidor.

**Criterios de aceptación.**
- **CA-27.1** Dado el paso 0 de ESC-31, cuando registro un débito de $50.00 en Salidas con fecha 10 de febrero, entonces la previsualización muestra Δ LPA −$30.00 y Δ Salidas −$20.00; al confirmar, LPA es $560.00 y Salidas $60.00 (paso 1).
- **CA-27.2** Dado el paso 0 de ESC-31, cuando registro con T $50.00 en Salidas con fecha 10 de febrero, entonces el impacto es Δ Salidas −$20.00, Δ Pago T +$20.00, Δ te falta reservar +$30.00 y Δ LPA $0.00 (ESC-32).
- **CA-27.3** Dado el paso 5 de ESC-49, cuando registro un débito olvidado de $350.00 con fecha 1 de marzo, entonces LPA queda en $300.00 y Super en $300.00 (paso 6).
- **CA-27.4** Dado el paso 1 de ESC-17, cuando el 12 de febrero registro un débito olvidado de $20.00 con fecha 10 de febrero, entonces queda detrás de las compras del mismo día en el reparto D2 (paso 2), no delante (paso 2′).
- **CA-27.5** Dado una operación con AV-01 enviada sin `huellaImpacto`, cuando llega al servidor, entonces responde `REQUIERE_CONFIRMACION` y no cambia ningún hecho.
- **CA-27.6** Dado un cambio retroactivo confirmado, cuando abro Inicio en otro dispositivo, entonces veo el mismo resumen del impacto (es una notificación, no un estado de la pantalla).
- **CA-27.7** Dado un período cerrado, cuando intento cambiar lo asignado en él, entonces se rechaza con `periodo_cerrado` (lo retroactivo son las transacciones, no las asignaciones).

**Escenarios.** ESC-02, ESC-17 (paso 2), ESC-31, ESC-32, ESC-49 (paso 6).

**Avisos.** AV-01.

**Dependencias.** FT-21, FT-25, FT-08.

#### FT-28 Devoluciones [M]

**Objetivo.** Registrar la devolución de un comercio vinculada a la parte de la compra original, con el efecto que corresponde según el medio y el período, o sin compra original con la categoría que elija.

**Historias.**
- Quiero devolver parte de una compra y que el dinero vuelva a su categoría.
- Si la parte devuelta era de un amigo, quiero que reduzca lo que me debe.
- Si no encuentro la compra, quiero elegir la categoría.
- Quiero eliminar una devolución registrada por error.

**Flujo.**
1. Vinculada: detalle de un gasto → `/actividad/[transaccionId]/devolver` (flujo largo) → `formulario({ operacion: 'devolver', transaccionOriginalId })`: monto, reparto entre las líneas (con su capacidad), fecha y cuenta → OP-33a.
2. Sin compra: `/registrar/devolucion` → búsqueda de la compra (CP-3); si la elige, pasa al paso 1; si no, cuenta, fecha, monto y categoría → OP-33b.
3. Eliminar: detalle → `/actividad/[transaccionId]/eventos/eliminar?tipo-evento=devolucion&evento=` → OP-34.
4. Después: AV-06, AV-08 o AV-14 según el efecto.

**Piezas.**
- Operaciones: OP-33 (a y b), OP-34.
- Consultas: `formulario` (`devolver`, `registrar` con `devolucion_sin_compra`), búsqueda de CP-3, `detalleTransaccion()`.
- Rutas: `/actividad/[transaccionId]/devolver`, `/registrar/devolucion`, `/actividad/[transaccionId]/eventos/eliminar`.
- Componentes: `CampoLineas` (reparto), `Buscador`, `EntradaMonto`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-33, OP-34, §4.4 (casos D-1 a D-4), §4.5, §4.10 (líneas por cobrar), H7, N2, I5, Q2, inv. 9 a 11 y 20, C-3, CB-02, CB-06, CB-31, CB-32.

**Estados.**
- Compra sin capacidad restante: lo dice y no deja continuar.
- Línea original en una categoría archivada: la devolución va igual a esa categoría (inv. 20) y puede producir AV-14.

**Errores y textos.** `devolucion_mayor_que_linea`, `devolucion_mayor_que_total`, `reparto_devolucion_distinto`, `devolucion_de_no_gasto`, `evento_anterior_a_original`, `eliminar_evento_rompe_limites`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-28.1** Dado el paso 1 de ESC-25, cuando el 1 de marzo registro la devolución total con débito, entonces Ropa queda en $100.00 en P2 y sigue en $0.00 en P1 (paso 2).
- **CA-28.2** Dado el paso 1 de ESC-26, cuando devuelvo $30.00 y luego $20.00 más, entonces el sobregiro con tarjeta pasa de $40.00 a $10.00 y a $0.00, y la deuda de T a $70.00 y $50.00 (pasos 2 y 3).
- **CA-28.3** Dado el paso 1 de ESC-27, cuando devuelvo toda la compra A, entonces la compra B queda cubierta: Super $50.00, Pago T $50.00 y "Te falta reservar" $0.00 (paso 2).
- **CA-28.4** Dado el paso 2 de ESC-28 Parte A, cuando devuelvo $70.00, entonces a = $40.00 y r = $30.00: Ropa $30.00, Pago T $30.00, deuda $30.00 (paso 3).
- **CA-28.5** Dado el paso 1 de ESC-28 Parte B, cuando el 1 de marzo devuelvo $100.00, entonces aparece AV-06 con el texto del saldo a favor y Pago T queda en −$100.00 (paso 2).
- **CA-28.6** Dado el paso 2 de ESC-29, cuando intento aplicar $40.00 al por cobrar, entonces se rechaza con `devolucion_mayor_que_linea` ("En esa parte quedan $25.00 por devolver."); con $25.00 al por cobrar y $25.00 a Super, se acepta (paso 4).
- **CA-28.7** Dado el paso 1 de ESC-30, cuando registro una devolución con T de $30.00 sin compra original hacia Super, entonces Super queda en $30.00 y Pago T en $20.00 (paso 2).
- **CA-28.8** Dado una cuota de préstamo, cuando intento vincularle una devolución, entonces se rechaza con `devolucion_de_no_gasto`.
- **CA-28.9** Dado una devolución registrada, cuando la elimino, entonces el estado vuelve al anterior a registrarla.

**Escenarios.** ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30.

**Avisos.** AV-06, AV-08, AV-14.

**Dependencias.** FT-25; FT-45 para las líneas por cobrar.

---

### 2.4 Tarjetas

#### FT-29 Categoría de pago y "te falta reservar" [I]

**Objetivo.** Que cada tarjeta muestre un solo número principal, "te falta reservar", y que el detalle explique lo reservado, lo pagado de más y de dónde viene cada traslado.

**Historias.**
- Quiero saber cuánto me falta reservar para pagar cada tarjeta.
- Si pagué de más o una devolución dejó saldo a favor, quiero entender por qué y cuánto reducirá Listo para asignar al cierre.
- Quiero cubrir la deuda que ya traía la tarjeta asignando a su categoría de pago.

**Flujo.**
1. Presupuesto → grupo "Pagos de tarjeta": `FilaPagoTarjeta` con "Te falta reservar" y los indicadores de pago excedente o reserva excedente.
2. Detalle (`/presupuesto/categorias/[categoriaId]` con `clase = 'pago'`): números del período, tarjeta hoy (deuda, saldo a favor, reservado, te falta reservar, reserva excedente), pago excedente por causa, traslados por categoría, pagos, pagos implícitos, devoluciones, desglose al pagar e historial.
3. Acciones: asignar (FT-10), pagar (FT-30), devolver la reserva excedente (FT-31).

**Piezas.**
- Operaciones: enlaces a OP-14, OP-23; propuesta AV-08.
- Consultas: `presupuesto()`, `detalleCategoria()` (`DetallePagoTarjetaDto`), `cuentas()`.
- Rutas: `/presupuesto`, `/presupuesto/categorias/[categoriaId]`.
- Componentes: `FilaPagoTarjeta`, `TarjetaCredito`, `Monto`, `IndicadorEstado`, `Aviso`.

**Reglas.** 01 §4.5 (traslados), §4.7 (E y su atribución por causa), §4.8 (S, R⁺, RE), F4, O2, Q4, Q7, inv. 2, 3, 22, 23; 05 §12.3 ("Deuda sin reservar" por categoría frente a "Te falta reservar" por tarjeta).

**Estados.**
- Con falta de reserva, con reserva excedente, con pago excedente o al día (05 §10.8).
- Período futuro: sin "te falta reservar" (solo en el activo).
- Sin metas, fusión ni archivo propio (05 §7.7).

**Errores y textos.** Sin errores propios. Textos AV-04 a AV-08 del catálogo del servidor y los del glosario de 05 §12.3.

**Criterios de aceptación.**
- **CA-29.1** Dado el paso 2 de ESC-04, cuando abro Pago T, entonces Disponible es $100.00, "Te falta reservar" $0.00 y el traslado desde Super $100.00.
- **CA-29.2** Dado el paso 2 de ESC-05, cuando abro Pago T, entonces "Te falta reservar" es $100.00 y Super muestra el indicador "Deuda sin reservar"; al tocar Super, "Deuda sin reservar en Super: $100.00" y "Esta deuda suma a lo que te falta reservar para T".
- **CA-29.3** Dado el paso 2 de ESC-11, cuando abro Pago T, entonces el número principal es "Te falta reservar $30.00" y, como información secundaria, AV-04 por $20.00.
- **CA-29.4** Dado el paso 2 de ESC-48 (sin reserva), cuando abro Pago T, entonces el pago excedente de $25.00 se atribuye a un cobro y se muestra AV-05.
- **CA-29.5** Dado el paso 2 de ESC-01, cuando abro Pago T sin asignar nada, entonces "Te falta reservar" es $300.00; al asignar $300.00 a Pago T, $0.00 (paso 3).
- **CA-29.6** Dado deudas en dos tarjetas, cuando abro Presupuesto, Inicio y Cuentas, entonces "Te falta reservar" de cada tarjeta es el mismo en las tres pantallas.
- **CA-29.7** Dado un período futuro, cuando abro Presupuesto en él, entonces las filas de tarjeta no muestran "Te falta reservar".
- **CA-29.8** **[R5]** Dado Visa Oro con fecha de pago el 15/11, cuando abro su categoría de pago, entonces "Pagá antes del 15/11" sale de `desgloseAlPagar.proximoPago`, el mismo valor que `cuentas().tarjetas[].proximoPago`.

**Escenarios.** ESC-01 (pasos 2 y 3), ESC-04, ESC-05 (paso 2), ESC-11, ESC-48.

**Avisos.** AV-03, AV-04, AV-05, AV-06, AV-07.

**Dependencias.** FT-09, FT-50 (crear tarjeta).

#### FT-30 Pagar tarjeta con desglose y pago excedente [I]

**Objetivo.** Pagar una tarjeta desde una cuenta de efectivo viendo antes el desglose del ciclo y si el pago supera lo reservado.

**Historias.**
- Quiero pagar mi tarjeta y ver cuánto era deuda anterior, cuánto cargos del ciclo y cuánto ya pagué.
- Si pago más de lo reservado, quiero que Finn me avise antes y me diga cuánto reducirá Listo para asignar al cierre.

**Flujo.**
1. Desde la cuenta, Cuentas, Inicio o la categoría de pago → `/cuentas/[cuentaId]/pagar` (flujo corto) → `formulario({ operacion: 'pagar_tarjeta' })`.
2. Origen preseleccionado (`origenPropuesto`, BE-41); el desglose (deuda anterior, cargos del ciclo, ya pagado, para no generar intereses) y lo reservado.
3. Monto y fecha; previsualización con AV-10 si supera lo reservado, "quedará saldo a favor de {monto}" si supera la deuda, y AV-01 si la fecha es de un período cerrado.
4. OP-23; después, AV-04 si hubo exceso.

**Piezas.**
- Operaciones: OP-23.
- Consultas: `formulario` (`pagar_tarjeta`).
- Rutas: `/cuentas/[cuentaId]/pagar`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `Monto`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-23, §4.14 (desglose, "ya pagado", para no generar intereses), P8, I3, H5, O2, CB-01, CB-26; 04 OP-23, BE-41.

**Estados.** Tarjeta archivada: el flujo no se abre (05 §7.7).

**Errores y textos.** `cuenta_archivada`, `cuenta_tipo_no_valido`, `fecha_posterior_a_hoy`, `fecha_anterior_a_apertura`. Textos del desglose y de "quedará saldo a favor" del catálogo del servidor (04 OP-23).

**Criterios de aceptación.**
- **CA-30.1** Dado el paso 1 de ESC-08, cuando abro el flujo para pagar $150.00 el 19 de febrero, entonces el desglose muestra deuda anterior $200.00, cargos del ciclo $100.00 y ya pagado $0.00; al pagar, Pago T queda en $150.00 y el monto para no generar intereses en $50.00 (paso 2).
- **CA-30.2** Dado el paso 2 de ESC-08, cuando pago $150.00 más, entonces la deuda es $0.00 y Pago T $0.00 (ESC-09).
- **CA-30.3** Dado el paso 2 de ESC-10, cuando pago $150.00 con $100.00 reservados, entonces veo AV-10 por $50.00 antes de confirmar y, después, AV-04 con la reducción proyectada de $50.00 (paso 3).
- **CA-30.4** Dado el paso 1 de ESC-13, cuando pago $130.00 con una deuda de $100.00, entonces la previsualización dice "quedará saldo a favor de $30.00" además de AV-10 (paso 2).
- **CA-30.5** Dado una tarjeta sin deuda, cuando pago $20.00, entonces se acepta (CB-01) con AV-10 y queda saldo a favor de $20.00.
- **CA-30.6** Dado un pago con fecha en un período cerrado, cuando lo envío, entonces veo AV-01 y el pago afecta a Pago T en ese período (CB-26).
- **CA-30.7** Dado que la última vez pagué T desde Ahorro, cuando abro el flujo, entonces Ahorro viene preseleccionada.

**Escenarios.** ESC-08, ESC-09, ESC-10 (paso 3), ESC-13 (paso 2).

**Avisos.** AV-01, AV-04, AV-10.

**Dependencias.** FT-29, FT-50.

#### FT-31 Reserva excedente y saldo a favor [M]

**Objetivo.** Avisar cuando una tarjeta tiene más reservado que deuda y devolver ese dinero a Listo para asignar con un toque.

**Historias.** Si la tarjeta tiene reservado de más (por un saldo a favor que se consumió o un cashback), quiero devolverlo a Listo para asignar sin hacer cuentas.

**Flujo.**
1. AV-08 en Inicio, Presupuesto y la categoría de pago: "Tienes $X reservado de más para esta tarjeta" con la propuesta (CP-8).
2. [1T] Ejecutar la propuesta → OP-14 sobre pago(t) en A con `montoNuevo = Asig − RE(t)`; "Deshacer" la revierte (05 §4.14).

**Piezas.**
- Operaciones: OP-14 (propuesta AV-08).
- Consultas: `inicio()`, `presupuesto()`, `detalleCategoria()`.
- Rutas: `/`, `/presupuesto`, `/presupuesto/categorias/[categoriaId]`.
- Componentes: `Aviso`, `Resultado`.

**Reglas.** 01 §4.8, Q4, inv. 3; 04 OP-14 ("usos derivados"); 05 §4.14.

**Estados.** RE = $0.00: el aviso no aparece.

**Errores y textos.** `conflicto_desactualizado` si lo asignado cambió. Texto de AV-08 del catálogo del servidor. **Nota:** el texto de 01 AV-08 dice "Tienes" (tuteo); el catálogo del servidor lo escribe en voseo ("Tenés $X reservados de más para {tarjeta}"), como exige 04 §7.10; no es un cambio de regla.

**Criterios de aceptación.**
- **CA-31.1** Dado el paso 4 de ESC-13, cuando abro Inicio, entonces veo AV-08 por $30.00 y, al tocar la propuesta, LPA pasa de $340.00 a $370.00 y el aviso desaparece (paso 5).
- **CA-31.2** Dado la propuesta ejecutada, cuando toco "Deshacer", entonces LPA vuelve a $340.00 y AV-08 reaparece.
- **CA-31.3** Dado el paso 4 de ESC-28 Parte B, cuando ejecuto la propuesta, entonces LPA vuelve a $400.00 (paso 5).
- **CA-31.4** Dado el paso 4 de ESC-14, cuando abro Pago T, entonces veo AV-08 por $230.00.

**Escenarios.** ESC-13 (pasos 4 y 5), ESC-14 (paso 4), ESC-28 (Parte B, pasos 4 y 5).

**Avisos.** AV-08.

**Dependencias.** FT-29.

#### FT-32 Cashback, avance y transferencia de deuda [M]

**Objetivo.** Registrar los movimientos de tarjeta que no son compras: entrada a la tarjeta (cashback o pago de un tercero), avance de efectivo y transferencia de deuda entre tarjetas.

**Historias.**
- Quiero registrar el cashback y que baje lo que me falta reservar.
- Quiero registrar un avance de efectivo y que entre a Listo para asignar como "otras entradas".
- Quiero pasar deuda de una tarjeta a otra y ver cómo cambia lo que me falta reservar en las dos.

**Flujo.**
1. `/registrar/entrada-tarjeta`, `/registrar/avance` o `/registrar/transferencia-deuda` (flujos cortos) → `formulario({ operacion: 'registrar', tipo })`.
2. OP-27 (b, a o c). Después de la transferencia de deuda: AV-24.

**Piezas.**
- Operaciones: OP-27.
- Consultas: `formulario` (`registrar`: `entrada_tarjeta`, `avance`, `transferencia_deuda`).
- Rutas: `/registrar/entrada-tarjeta`, `/registrar/avance`, `/registrar/transferencia-deuda`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `Aviso`.

**Reglas.** 01 OP-27, Q3, §4.11, §4.13 (cashback = ingreso; avance = otras entradas); 05 §2.4 (cada tipo solo si existe la cuenta que necesita).

**Estados.** Sin tarjetas: los tres tipos no se ofrecen; con una sola tarjeta, la transferencia de deuda no se ofrece.

**Errores y textos.** `cuentas_iguales`, `cuenta_tipo_no_valido`, `cuenta_archivada`. Texto de AV-24 del catálogo del servidor.

**Criterios de aceptación.**
- **CA-32.1** Dado el paso 0 de ESC-14, cuando registro un cashback de $30.00 en T, entonces "Te falta reservar" pasa de $100.00 a $70.00 y LPA sigue en $700.00 (paso 1).
- **CA-32.2** Dado el paso 1 de ESC-14, cuando registro un avance de $200.00 de T a Ahorro, entonces LPA es $900.00 y "Te falta reservar" $270.00 (paso 2); en el detalle de LPA suma a "Otras entradas".
- **CA-32.3** Dado el paso 2 de ESC-14, cuando transfiero $100.00 de deuda de T a U, entonces T queda con $170.00 por reservar y U con $100.00, y AV-24 informa los dos cambios (paso 3).
- **CA-32.4** Dado el paso 3 de ESC-14, cuando registro un cashback de $400.00 en T, entonces T queda con reserva excedente de $230.00 y AV-08 (paso 4).

**Escenarios.** ESC-14.

**Avisos.** AV-24, AV-08.

**Dependencias.** FT-29, FT-50.

#### FT-33 Corte, pago y monto para no generar intereses, con recordatorio [M]

**Objetivo.** Mostrar para cada tarjeta su próximo corte, su próxima fecha de pago y cuánto pagar para no generar intereses, y recordarlo 3 días antes del pago.

**Historias.**
- Quiero ver cuándo corta y cuándo vence mi tarjeta, y cuánto tengo que pagar para no pagar intereses.
- Quiero que Finn me lo recuerde unos días antes.

**Flujo.**
1. `/cuentas` y `/cuentas/[cuentaId]`: `TarjetaCredito` con próximo corte, próximo pago, para no generar intereses, uso del límite y te falta reservar.
2. Inicio: "Pagos de tarjeta próximos" (3.8, CF-06) cuando faltan 3 días o menos y el monto es mayor que cero, con enlace a la cuenta.
3. Push `pago_tarjeta_proximo` (CF-07), una vez por tarjeta y ciclo, con destino `{ pantalla: 'cuenta', cuentaId }`; el envío y la política son de FT-71.

**Piezas.**
- Operaciones: ninguna del usuario; la tarea diaria registra la notificación (3.8).
- Consultas: `cuentas()`, `detalleCuenta()`, `inicio()` (`atencion.pagosTarjetaProximos`).
- Rutas: `/cuentas`, `/cuentas/[cuentaId]`, `/`.
- Componentes: `TarjetaCredito`, `BarraProgreso`, `Monto`, `Aviso`.

**Reglas.** 01 §4.14 (fechas de corte recortadas al fin de mes, supuesto 19; para no generar intereses); 04 §6.5 (`proximoCorte`, `proximoPago`, `usoLimite`); 3.8 de este documento (FD-22).

**Estados.** Monto para no generar intereses $0.00: sin recordatorio en Inicio ni push.

**Errores y textos.** Sin errores. Texto del push: el de 3.8 **(nuevo)**, sin montos.

**Criterios de aceptación.**
- **CA-33.1** Dado una tarjeta con día de corte 31 y hoy 10 de febrero de 2027, cuando abro Cuentas, entonces el próximo corte es el 28 de febrero de 2027.
- **CA-33.2** Dado el paso 2 de ESC-08, cuando abro la tarjeta, entonces "Para no generar intereses" es $50.00.
- **CA-33.3** Dado una fecha de pago dentro de 3 días y $50.00 para no generar intereses, cuando corre la tarea diaria dos veces el mismo día y una vez al día siguiente, entonces existe una sola notificación `pago_tarjeta_proximo` para esa tarjeta y fecha, con `aviso` nulo (CF-16).
- **CA-33.4** Dado esa notificación, cuando la toco, entonces abro `/cuentas/[cuentaId]?notificacion=<id>` y queda marcada como leída.
- **CA-33.5** Dado el texto del push, cuando lo reviso, entonces no contiene ningún monto (04 §11.4).
- **CA-33.6** Dado una deuda de $1,500.00 con un límite de $2,000.00, cuando abro la tarjeta, entonces el uso del límite es 75 % (`usoLimite` 7,500 puntos básicos).

**Escenarios.** ESC-08 (paso 2).

**Avisos.** —

**Dependencias.** FT-29, FT-30; FT-71 (push), FT-06.

---

# Parte C

### 2.5 Bandeja de SMS

#### FT-34 Recepción y procesamiento de SMS [I]

**Objetivo.** Que todo SMS bancario que reenvía MacroDroid quede guardado y se convierta en un movimiento de la Bandeja con su cuenta, fecha local, monto, comercio y categoría sugerida, sin entrar a los números hasta que el usuario lo apruebe (errores 5 y 10).

**Historias.**
- Cuando pago con la tarjeta quiero que la compra aparezca sola en la Bandeja, con la categoría ya sugerida.
- Si el SMS llega dos veces por un reenvío, quiero que el segundo se descarte solo; si son dos compras parecidas, quiero decidir yo.
- Si un SMS no se puede guardar, quiero que MacroDroid lo vuelva a enviar.

**Flujo.**
1. MacroDroid → `POST /api/sms` con el token (FT-03).
2. Autenticación, guardado en `sms_recibidos` y respuesta 200 (04 §8.2).
3. Después de responder, procesamiento (04 §8.4): autodescarte, interpretación con los formatos, cuenta por institución y últimos 4, fecha del SMS en hora local, tipo propuesto, emparejamiento con una programada, duplicados y categoría sugerida.
4. Movimiento en el estado que corresponda y AV-23 con push (FT-70), salvo el autodescartado.
5. La misma petición rescata hasta 5 SMS sin resultado (BE-62); la tarea diaria, los que queden.

**Piezas.**
- Operaciones: OP-35.
- Consultas: `bandeja()` (para ver el resultado).
- Rutas: `POST /api/sms`; `/bandeja`.
- Componentes: `MovimientoBandeja`.

**Reglas.** 01 OP-35, §4.17 (autodescarte, emparejamiento, duplicados, sugerencia), §7.1, P5, P16, P18, P19, H12, M2, inv. 13 y 16, CB-14 a CB-17; 04 §8.1 a §8.6, BE-44, BE-45, BE-60, BE-62, N-01, N-02, PR-2.

**Estados.** Resultado de cada SMS: autodescartado, no reconocido, con coincidencia, posible duplicado, pendiente o error (01 §7.1; error, 04 N-02). Sin cuenta (cuenta archivada o inexistente): el movimiento queda sin cuenta y no se puede aprobar hasta elegirla (CB-15).

**Errores y textos.** Respuestas HTTP: 401 (token), 413 (más de 16 KiB), 503 con `Retry-After: 30` (no se pudo guardar), 200 en los demás casos, también con un cuerpo inválido (BE-60). Sin mensajes para el usuario en esta feature; los textos de AV-23 son los de 04 §11.4.

**Criterios de aceptación.**
- **CA-34.1** Dado un token inválido, cuando llega un SMS, entonces responde 401 y no se guarda ninguna fila.
- **CA-34.2** Dado que la escritura de `sms_recibidos` falla, cuando llega un SMS, entonces responde 503 con `Retry-After: 30` y no queda ninguna fila.
- **CA-34.3** Dado un cuerpo JSON inválido con el token correcto, cuando llega, entonces responde 200, se guarda el texto crudo con remitente `desconocido` y el movimiento queda en `error` con `cuerpo_invalido` (BE-60).
- **CA-34.4** Dado un SMS idéntico a otro recibido 9 minutos antes, cuando llega, entonces su movimiento es `autodescartado` y no se envía push; a los 10 minutos o más, se evalúa normalmente (H12, inv. 16).
- **CA-34.5 (error 10)** Dado dos compras de $3.50 en la misma tarjeta con 2 minutos de diferencia y textos distintos (distinta hora), cuando llega la segunda, entonces queda como posible duplicado, no se descarta sola.
- **CA-34.6 (error 5)** Dado el SMS de ESC-46 (20 de febrero a las 19:00 local, con fecha 20/02), cuando se procesa, entonces el movimiento tiene fecha 2027-02-20; aprobado el 21 queda en P1 (paso 3 de ESC-46).
- **CA-34.7** Dado un SMS sin fecha recibido a las 23:30 del día 20 en hora local (05:30 UTC del 21), cuando se procesa, entonces la fecha es la del 20.
- **CA-34.8** Dado un SMS de una tarjeta terminada en 4821 del BAC y otra cuenta de Banco Agrícola con los mismos últimos 4, cuando llega uno del BAC, entonces se identifica la del BAC (CB-14).
- **CA-34.9** Dado una ocurrencia pendiente de Netflix de $15.49 el día 17 y un SMS de $15.49 el día 18 en la misma tarjeta, cuando llega, entonces el movimiento queda "con coincidencia" aunque en la Bandeja haya otro movimiento de $15.49 del día 17 en la misma tarjeta, que cumpliría el criterio de duplicado (el emparejamiento se evalúa primero, M2).
- **CA-34.10** Dado una regla "SELECTOS → Supermercado", cuando llega un SMS de "SUPER SELECTOS ESCALON", entonces la línea propuesta va a Supermercado.
- **CA-34.11** Dado un SMS de más de 640 caracteres, cuando se procesa, entonces queda como no reconocido sin evaluar los patrones (PR-2).
- **CA-34.12** Dado un SMS que quedó sin resultado hace más de 2 minutos, cuando llega otra petición, entonces esa petición lo procesa (BE-62); dos peticiones simultáneas no crean dos movimientos.
- **CA-34.13** Dado cualquier SMS procesado, cuando comparo los números antes y después, entonces ningún saldo, Disponible ni Listo para asignar cambió (inv. 13).
- **CA-34.14 ⚠ (S6-1)** Con SMS sintéticos de depósito, pago a tarjeta y devolución, el tipo propuesto es ingreso, pago de tarjeta y devolución. Se rehace con las muestras reales.

**Escenarios.** ESC-46 (pasos 1 y 2).

**Avisos.** AV-23.

**Dependencias.** FT-03; FT-73 (formatos). **[F8]** (CH-07): de datos, FT-73; las demás, de construcción.

#### FT-35 Revisar y aprobar: un toque, flujo completo y recordar regla [I]

**Objetivo.** Convertir un movimiento en transacción con un toque cuando está listo, o revisándolo completo cuando falta algo, sin que ninguna parte quede sin destino (error 9).

**Historias.**
- Si la categoría sugerida es la correcta, quiero aprobar con un toque desde la lista.
- Si no, quiero abrir el movimiento, ver el SMS original, cambiar la categoría, dividirlo o marcar una parte por cobrar.
- Quiero que Finn recuerde la categoría para ese comercio.
- Si coincide con un pago programado, quiero confirmarlo sin crear otra transacción.

**Flujo.**
1. `/bandeja` → `bandeja()`: lista con `MovimientoBandeja` y los contadores.
2. Movimiento listo (`aprobacion.posible` y sin confirmación): [1T] "Aprobar" (OP-37, FE-25). Resultado en el lugar con lo aprobado según el servidor (CP-15), "Ver transacción" y, si llega, la propuesta de regla [1T] (OP-41).
3. Si no, o si el servidor pide algo: `/bandeja/[movimientoId]` (flujo largo) → `formulario({ operacion: 'movimiento' })`: texto del SMS, cuenta, fecha, monto, comercio, tipo, líneas (`CampoLineas`), nota y "Recordar esta categoría para este comercio".
4. Con coincidencia: "Confirmar" (OP-40 `confirmar_coincidencia`, que ejecuta OP-37) o "No es este pago" (FT-37).
5. Pago de tarjeta: origen preseleccionado (BE-41). Devolución: elegir la compra entre las candidatas.
6. Confirmación AV-01 o AV-16 si corresponde.

**Piezas.**
- Operaciones: OP-36, OP-37, OP-40 (`confirmar_coincidencia`), OP-41 (propuesta).
- Consultas: `bandeja()`, `formulario` (`movimiento`), `sugerencia` y búsqueda de compras (CP-3).
- Rutas: `/bandeja`, `/bandeja/[movimientoId]`.
- Componentes: `MovimientoBandeja`, `Resultado`, `CampoLineas`, `EntradaMonto`, `EntradaFecha`, `Buscador`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-36, OP-37, OP-40, §7.1, error 9, M2, B-9 (el monto del SMS reemplaza al de la registrada), D2 (hora de registro = recepción), inv. 8 y 15; 04 OP-37, CP-15, BE-41; 05 §4.15 (FE-25: cuándo se ofrece el toque y el traspaso al flujo), §4.14 (Aprobar no tiene "Deshacer"; ofrece "Ver transacción").

**Estados.**
- Bandeja al día: "No hay movimientos por revisar".
- Movimiento ya aprobado o descartado al abrir el flujo: muestra su estado y el enlace que corresponde.
- Faltantes (`aprobacion.faltantes`): dichos en texto ("Falta la categoría") y sin "Aprobar" en la lista.
- **[R3]** Arrastrar a una categoría: atajo de FT-78 en las filas que lo admiten; esta feature no cambia.

**Errores y textos.** `movimiento_sin_cuenta`, `movimiento_incompleto`, `linea_sin_destino`, `suma_lineas_distinta`, `movimiento_estado_no_valido`, `ocurrencia_ya_resuelta`, `cuenta_archivada`, `categoria_archivada`. Sin textos nuevos (los del resultado están en 05 §4.15).

**Criterios de aceptación.**
- **CA-35.1** Dado un movimiento pendiente con cuenta, fecha en el período activo y la categoría sugerida, cuando toco "Aprobar" en la lista, entonces la fila se reemplaza por "Aprobado: {comercio} · {monto} · {cuenta} · {categoría}" con los datos de `valor.aprobado`, y "Ver transacción" abre `/actividad/[transaccionId]`.
- **CA-35.2** Dado el paso 2 de ESC-46 (hoy 21 de febrero, fecha del SMS 20 de febrero), cuando toco "Aprobar", entonces se abre el flujo con la confirmación AV-01; al confirmar, Super queda en $20.00 y Pago T en $30.00 en P1 (paso 3).
- **CA-35.3** Dado un movimiento con una línea sin destino, cuando intento aprobar desde el flujo, entonces se rechaza con `linea_sin_destino` y no se crea ninguna transacción (error 9).
- **CA-35.4** Dado que marco "Recordar esta categoría" con una sola línea a Farmacia, cuando apruebo, entonces existe la regla "{comercio} → Farmacia"; con dos líneas, la opción no se ofrece.
- **CA-35.5** Dado un movimiento con coincidencia sobre una ocurrencia pendiente, cuando confirmo, entonces se crea una transacción y la ocurrencia queda emparejada.
- **CA-35.6** Dado un movimiento con coincidencia sobre una ocurrencia ya registrada por el registro automático, cuando confirmo, entonces no se crea otra transacción: la registrada pasa al monto del SMS y queda vinculada (B-9).
- **CA-35.7** Dado un pago de tarjeta cuyo último pago salió de Ahorro, cuando abro el movimiento, entonces Ahorro viene como origen y "Aprobar" se ofrece con un toque; sin pagos anteriores, falta el origen.
- **CA-35.8** Dado una transacción aprobada desde un SMS, cuando abro su detalle, entonces su hora de registro y su clave de orden son el instante de recepción del SMS (D2).
- **CA-35.9** Dado que toco "Aprobar" en tres filas seguidas, cuando una falla, entonces las otras dos se aprueban y la que falló muestra su mensaje o pasa al flujo, según 05 §4.15.
- **CA-35.10** Dado un movimiento que se aprobó en otra pestaña, cuando toco "Aprobar", entonces la fila muestra "Este movimiento ya está aprobado." y la revalidación la quita.
- **CA-35.11** **[R5]** Dado la regla "PIZZA HUT → Restaurantes", cuando llega un SMS de PIZZA HUT, entonces `categoriaSugerida.porRegla` es verdadero y la fila dice "(por regla)"; si la sugerencia sale del historial, es falso y la fila no lo dice.

**Escenarios.** ESC-46 (paso 3).

**Avisos.** AV-01, AV-16, AV-23.

**Dependencias.** FT-34; FT-21 (el formulario de líneas); FT-41 (coincidencias). **[F8]** (CH-07): de datos, FT-41; las demás, de construcción.

#### FT-36 Aprobar todos [M]

**Objetivo.** Aprobar de una vez los movimientos pendientes que no necesitan decisión, e informar cuáles quedaron y por qué.

**Historias.** Cuando tengo varias compras listas, quiero aprobarlas todas con un toque y saber cuáles no se aprobaron.

**Flujo.**
1. En `/bandeja`, "Aprobar todos ({n})" **(nuevo)** con `elegiblesAprobarTodos` [1T].
2. OP-38: un `escribir()` por movimiento.
3. Resultado con AV-19: los no aprobados y su motivo.

**Piezas.**
- Operaciones: OP-38.
- Consultas: `bandeja()` (`elegiblesAprobarTodos`, `aprobacion.motivoNoElegible`).
- Rutas: `/bandeja`.
- Componentes: `Resultado`, `Aviso`.

**Reglas.** 01 OP-38, ajuste 2; 04 OP-38 (sin confirmación en lote: excluye lo retroactivo y los pagos de tarjeta); 05 §4.14 (sin operación inversa).

**Estados.** Sin elegibles: el botón no aparece.

**Errores y textos.** Motivos de AV-19: "Requiere revisión individual (afecta un período cerrado)." y "Elegí de qué cuenta salió el pago." (04 OP-38), más el mensaje de cada rechazo. Texto nuevo: "Aprobar todos ({n})".

**Criterios de aceptación.**
- **CA-36.1** Dado 4 pendientes listos, uno con coincidencia, uno posible duplicado y uno no reconocido, cuando toco "Aprobar todos (4)", entonces se aprueban los 4 y los otros 3 quedan como estaban.
- **CA-36.2** Dado un pendiente con fecha en un período cerrado, cuando apruebo todos, entonces no se aprueba y AV-19 dice "Requiere revisión individual (afecta un período cerrado)."
- **CA-36.3** Dado un pago de tarjeta pendiente, cuando apruebo todos, entonces no se aprueba y AV-19 dice "Elegí de qué cuenta salió el pago."
- **CA-36.4** Dado que uno de los elegibles se aprobó en otra pestaña entre la lista y el toque, cuando apruebo todos, entonces los demás se aprueban y ese aparece en AV-19 con su motivo.
- **CA-36.5** Dado cualquier ejecución, ninguna transacción creada tiene una línea sin destino (error 9).

**Escenarios.** —

**Avisos.** AV-19.

**Dependencias.** FT-35.

#### FT-37 Descartar, restaurar, duplicados y coincidencias [I]

**Objetivo.** Resolver los movimientos que no deben entrar a los números (duplicados reales, avisos que no son compras) sin perderlos, y decidir sobre las coincidencias y los posibles duplicados.

**Historias.**
- Quiero descartar un movimiento y poder restaurarlo si me equivoqué.
- Ante un posible duplicado, quiero decir si es otro gasto o el mismo.
- Si Finn propuso un pago programado que no corresponde, quiero rechazarlo.

**Flujo.**
1. En `/bandeja` o en `/bandeja/[movimientoId]`: [1T] "Descartar" (OP-39), con "Restaurar" como salida (05 §4.14).
2. Posible duplicado: [1T] "Es otro gasto" (OP-40 `es_legitimo`) o "Es duplicado" (OP-40 `es_duplicado`), con "Restaurar" como salida de este último.
3. Con coincidencia: [1T] "No es este pago" (OP-40 `rechazar_coincidencia`).
4. `/bandeja?vista=descartados`: descartados y autodescartados, paginados, con [1T] "Restaurar".

**Piezas.**
- Operaciones: OP-39, OP-40.
- Consultas: `bandeja({ vista })`.
- Rutas: `/bandeja`, `/bandeja/[movimientoId]`.
- Componentes: `MovimientoBandeja`, `Resultado`.

**Reglas.** 01 OP-39, OP-40, §7.1, P16, A-2, HZ-2 (restaurar reevalúa coincidencias y duplicados), CB-16, CB-17; 05 §4.14 (salidas para revertir y sus condiciones).

**Estados.** Vista de descartados vacía: "No hay movimientos descartados" **(nuevo)**.

**Errores y textos.** `movimiento_estado_no_valido`. Textos del resultado de 05 §4.14 ("Descartaste {comercio} {monto}. Restaurar"); "No es este pago" **(nuevo)**.

**Criterios de aceptación.**
- **CA-37.1** Dado un pendiente, cuando lo descarto, entonces sale de la lista y en su lugar queda "Descartaste {comercio} {monto}. Restaurar"; al restaurar, vuelve a la lista.
- **CA-37.2** Dado un autodescartado, cuando lo restauro desde la vista de descartados, entonces se reevalúa y queda como posible duplicado del original (mismo texto, misma cuenta y monto).
- **CA-37.3** Dado un posible duplicado, cuando toco "Es otro gasto", entonces pasa a pendiente sin candidata y no aparece ninguna salida para revertir.
- **CA-37.4** Dado una coincidencia rechazada, cuando el movimiento cumple el criterio de duplicado, entonces pasa a posible duplicado; si no, a pendiente; y la ocurrencia sigue pendiente.
- **CA-37.5** Dado dos SMS que corresponden a la misma ocurrencia, cuando el primero se emparejó, entonces el segundo no se empareja: se evalúa como posible duplicado (CB-16).
- **CA-37.6** Dado un movimiento con coincidencia, cuando intento descartarlo, entonces la acción no se ofrece (05 §4.14) y el servidor la rechaza con `movimiento_estado_no_valido`.

**Escenarios.** —

**Avisos.** AV-23.

**Dependencias.** FT-34, FT-35.

#### FT-38 SMS no reconocidos y con error [I]

**Objetivo.** Que ningún SMS del banco se pierda: los que Finn no entiende o que fallaron al procesarse quedan en la Bandeja con su texto original, para reintentar o registrarlos a mano.

**Historias.**
- Si Finn no reconoce un SMS, quiero ver el texto y registrar la compra a mano desde ahí o descartarlo.
- Si un SMS falló al procesarse, quiero reintentarlo o registrarlo a mano.

**Flujo.**
1. En la lista: no reconocido con el SMS citado y "Registrar a mano"; con error, "Intentar de nuevo" (OP-49) y "Copiar referencia".
2. "Registrar a mano" → `/bandeja/[movimientoId]`: completar cuenta, fecha, monto, tipo y líneas (OP-36) y aprobar (OP-37 o, si estaba en error, OP-50).
3. "Intentar de nuevo" → OP-49 con `intentoVisto`; el movimiento pasa al estado que resulte.

**Piezas.**
- Operaciones: OP-49, OP-50, OP-36, OP-37, OP-39.
- Consultas: `bandeja()`, `formulario` (`movimiento`).
- Rutas: `/bandeja`, `/bandeja/[movimientoId]`.
- Componentes: `MovimientoBandeja`, `CampoLineas`, `Resultado`.

**Reglas.** 01 P19, §7.1 (no reconocido → aprobado o descartado); 04 OP-49, OP-50, N-02, BE-60, PR-2; 04 §7.8 (`errorDetalle` saneado; la referencia es `idError`).

**Estados.** El texto del SMS siempre visible; el detalle del error, saneado, solo con su referencia.

**Errores y textos.** `sms_no_reprocesable`, más los de FT-35. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-38.1** Dado un no reconocido, cuando completo cuenta, fecha, monto, tipo gasto y una línea, y apruebo, entonces se crea la transacción con origen `sms` y la fecha que escribí.
- **CA-38.2** Dado un SMS en error por un fallo transitorio, cuando toco "Intentar de nuevo", entonces se registra un intento nuevo (los anteriores no cambian) y el movimiento queda pendiente.
- **CA-38.3** Dado que dos pestañas tocan "Intentar de nuevo" sobre el mismo intento, cuando llegan las dos, entonces solo una reprocesa y la otra responde `ya_aplicada` (`intentoVisto`).
- **CA-38.4** Dado un movimiento que ya no está en error, cuando llamo a OP-49, entonces se rechaza con `sms_no_reprocesable`.
- **CA-38.5** Dado un SMS en error, cuando lo reproceso, entonces la ventana de autodescarte y la fecha por defecto usan el instante de recepción original, no el del reproceso.
- **CA-38.6** Dado un error, cuando toco "Copiar referencia", entonces se copia el `idError`, que aparece en Ajustes > Diagnóstico.

**Escenarios.** —

**Avisos.** AV-23.

**Dependencias.** FT-34, FT-35.

#### FT-39 Reglas de comercio [M]

**Objetivo.** Administrar las reglas que sugieren la categoría de cada comercio.

**Historias.**
- Quiero ver mis reglas, corregir una y borrar las que ya no sirven.
- Quiero crear una regla sin esperar a aprobar un SMS.

**Flujo.**
1. `/reglas` → `reglas()`: patrón, categoría y marca si la categoría está archivada.
2. `/reglas/nueva` y `/reglas/[reglaId]` (flujos cortos) → OP-41.
3. También se crean desde la Bandeja (FT-35).

**Piezas.**
- Operaciones: OP-41.
- Consultas: `reglas()`, `formulario` (`regla`, CP-10c).
- Rutas: `/reglas`, `/reglas/nueva`, `/reglas/[reglaId]`.
- Componentes: `EntradaTexto`, `Seleccion`, `EstadoVacio`.

**Reglas.** 01 §4.17 (el patrón está contenido en el comercio, sin mayúsculas; gana el más largo; se ignoran las que apuntan a archivadas), OP-41, B-10.

**Estados.** Sin reglas: "Las reglas se crean al aprobar un movimiento con «Recordar esta categoría», o desde acá." **(nuevo)**. Regla hacia una categoría archivada: marcada como "No se aplica: la categoría está archivada" **(nuevo)**.

**Errores y textos.** `patron_repetido`, `categoria_archivada`, `categoria_de_pago_no_permitida`. Textos nuevos: los de "Estados".

**Criterios de aceptación.**
- **CA-39.1** Dado las reglas "SELECTOS → Supermercado" y "SUPER SELECTOS ESCALON → Restaurantes", cuando llega "SUPER SELECTOS ESCALON", entonces se sugiere Restaurantes (patrón más largo).
- **CA-39.2** Dado una regla "selectos", cuando creo "SELECTOS", entonces se rechaza con `patron_repetido`.
- **CA-39.3** Dado una regla hacia una categoría que se archivó, cuando llega un SMS de ese comercio, entonces la regla no se usa y la sugerencia sale del historial (§4.17).
- **CA-39.4** Dado que elimino una regla, cuando llega un SMS de ese comercio, entonces la sugerencia sale del historial o queda sin destino.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-18, FT-34.

#### FT-78 Arrastrar un movimiento a una categoría [M] **[R3]**

**Objetivo.** Aprobar un gasto de la Bandeja soltándolo sobre su categoría, en un solo paso y con una sola operación, como atajo de la revisión cuando la categoría sugerida no es la correcta (P6-23, decisión del usuario).

**Historias.**
- Cuando una compra llega sin categoría o con la equivocada, quiero arrastrarla a la categoría correcta y que quede aprobada.
- En el teléfono quiero que el arrastre empiece con una pulsación larga, sin que me estorbe al desplazar la lista.
- Con el teclado quiero poder hacer lo mismo, y los botones de siempre tienen que seguir ahí.

**Flujo.**
1. `/bandeja` carga y se hidrata sin la librería de arrastre. Después, en el primer momento libre (`requestIdleCallback`, con tope de 2 s) o al primer toque o tecla sobre una fila, se carga con `import()` (FD-30, V6-08). Mientras no está cargada, la pulsación larga no hace nada y los botones funcionan.
2. Solo las filas con `aprobacion.arrastrable` (CF-22) se pueden arrastrar.
3. Inicio del gesto: en el teléfono, pulsación larga de 350 ms con una tolerancia de 8 px (un deslizamiento antes de ese tiempo desplaza la lista); en computadora, arrastrar con el ratón después de moverlo 6 px; con el teclado, Espacio o Enter sobre la fila.
4. Al empezar, aparece el panel de destinos: la categoría sugerida del movimiento, las frecuentes (`destinosArrastre.frecuentes`) y "Otra categoría…". En computadora, el panel ocupa el lugar de la revisión lateral (06-identidad-visual, PANTALLAS §7) y lista además todas las categorías por grupo (`destinosArrastre.grupos`), con desplazamiento.
5. Soltar sobre una categoría → OP-37 con la variante `{ categoriaId }` (CF-21).
6. Soltar sobre "Otra categoría…" (o activarla con el teclado) termina el arrastre sin aprobar y abre el selector de categorías para ese movimiento; elegir una ejecuta la misma variante, sin volver a arrastrar.
7. Soltar fuera del panel o Escape cancela: no se envía nada.
8. Resultado:
   - Éxito: el mismo resultado de FE-25 ("Aprobado: {comercio} · {monto} · {cuenta} · {categoría}"), con "Ver transacción" y sin "Deshacer" (PB-2); si llega, la propuesta de regla de comercio de un toque (CP-8).
   - `REQUIERE_CONFIRMACION` (AV-01, AV-16) o un dato faltante: traspaso a `/bandeja/[movimientoId]` como en 05 §4.15, con el borrador que guarda además la categoría soltada y la variante. Confirmar en el flujo envía la misma variante con el mismo id y la `huellaImpacto`; si el usuario edita otros campos, el flujo vuelve al camino normal de FT-35.

**Piezas.**
- Operaciones: OP-37 (variante `{ categoriaId }`, CF-21); OP-41 (propuesta de regla).
- Consultas: `bandeja()` con `destinosArrastre` y `aprobacion.arrastrable` (CF-22); `formulario` (`movimiento`) en el traspaso.
- Rutas: `/bandeja`, `/bandeja/[movimientoId]`.
- Componentes: `MovimientoBandeja` (asa de arrastre); panel de destinos y su versión lateral (componentes nuevos de `componentes/dominio/`, cliente, cargados con `import()`); `Seleccion` o `Buscador` para "Otra categoría…"; `Resultado`.

**Reglas.** 01 OP-36 y OP-37 (la variante es su composición en una sola unidad, 01 §5.0.1), error 9, inv. 8 y 15; 04 OP-37 con CF-21; 05 §4.14 y §4.15 (resultado y traspaso), §13.1 (presupuesto de la ruta), §11 (WCAG 2.2: 2.5.7 movimientos de arrastre, 2.1.1 teclado, 4.1.3 mensajes de estado); FD-30.

**Estados.**
- Movimiento no arrastrable (con coincidencia, posible duplicado, no reconocido, error, pago de tarjeta, devolución, ingreso o más de una línea): sin asa; la fila funciona como en FT-35.
- Librería sin cargar todavía: sin asa activa y sin aviso; los botones funcionan.
- Movimiento arrastrable sin cuenta, fecha o monto: se puede arrastrar; el servidor responde el faltante y se hace el traspaso con la categoría ya puesta.
- Movimiento reducido: sin animación de la ficha que se arrastra ni del panel (05 §11.6).

**Errores y textos.** `arrastre_no_permitido` (nuevo, CF-21): "Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo." (por ejemplo, si cambió de estado en otra pestaña); `conflicto_desactualizado` (las líneas cambiaron después de cargar la lista); los de OP-37. Textos nuevos de la interfaz:
- nombre accesible del asa: "Arrastrar {comercio} {monto} a una categoría";
- instrucciones para lectores de pantalla: "Para arrastrar, presioná Espacio. Mientras arrastrás, usá las flechas para elegir una categoría, Espacio para soltar o Escape para cancelar.";
- anuncios: "Tomaste {comercio}.", "Sobre {categoría}.", "Soltaste {comercio} en {categoría}.", "Arrastre cancelado.";
- panel: "Sugerida: {categoría}", "Otra categoría…".

**Criterios de aceptación.**
- **CA-78.1** Dado un gasto pendiente de $35.00 sin líneas, cuando lo arrastro con el ratón y lo suelto sobre Supermercado, entonces una sola llamada a OP-37 con `{ categoriaId }` crea la transacción con una línea de $35.00 a Supermercado y la fila muestra "Aprobado: … · Supermercado" con "Ver transacción" y sin "Deshacer".
- **CA-78.2** Dado un gasto pendiente con una línea sugerida a Restaurantes, cuando lo suelto sobre Farmacia, entonces la transacción tiene una sola línea a Farmacia y el movimiento ya no tiene la línea de Restaurantes.
- **CA-78.3** Dado que la escritura de la transacción falla después de reemplazar las líneas, cuando miro el movimiento, entonces sigue pendiente con sus líneas originales (una sola transacción de base de datos, 01 §5.0.1).
- **CA-78.4** Dado un movimiento con coincidencia, un posible duplicado, un pago de tarjeta, una devolución o un gasto con dos líneas, cuando abro la Bandeja, entonces no tiene asa de arrastre; si se envía la variante igual, el servidor responde `arrastre_no_permitido`.
- **CA-78.5** Dado un gasto con fecha en un período cerrado, cuando lo suelto sobre Supermercado, entonces se abre `/bandeja/[movimientoId]` con Supermercado en la línea y la confirmación de AV-01; al confirmar, se aprueba con el mismo id.
- **CA-78.6** Dado un gasto sin cuenta, cuando lo suelto sobre una categoría, entonces se abre el flujo con la categoría puesta y el mensaje "Elegí la cuenta de este movimiento."
- **CA-78.7** Dado el teléfono, cuando deslizo una fila 60 px en menos de 350 ms, entonces no empieza ningún arrastre; con una pulsación de 350 ms o más, aparece el panel de destinos (V6-08).
- **CA-78.8** Dado el teclado, cuando enfoco el asa, presiono Espacio, bajo con las flechas hasta Supermercado y presiono Espacio, entonces el movimiento se aprueba en Supermercado y los anuncios se leen en la región de estado (V6-08).
- **CA-78.9** Dado un arrastre en curso, cuando presiono Escape o suelto fuera del panel, entonces no se envía ninguna operación y la fila queda como estaba.
- **CA-78.10** Dado un movimiento con categoría sugerida Supermercado, cuando empiezo a arrastrarlo, entonces el panel muestra primero "Sugerida: Supermercado", después hasta 5 frecuentes distintas de la sugerida y al final "Otra categoría…".
- **CA-78.11** Dado que suelto sobre "Otra categoría…", cuando elijo Mascota en el selector, entonces el movimiento se aprueba en Mascota sin volver a arrastrar.
- **CA-78.12** Dado la carga de `/bandeja` en el perfil 4G de 05 §13.1, cuando mido el JS, entonces la librería de arrastre no está en lo que se descarga antes del evento `load`: llega como un trozo aparte después de hidratar (V6-08: 15.0 KB gzip, pedido unos 30 ms después de hidratar y listo unos 250 ms después).
- **CA-78.13** Dado cualquier movimiento arrastrable, cuando miro su fila, entonces "Aprobar" o "Revisar" siguen visibles: el arrastre nunca es la única forma de hacer algo (WCAG 2.5.7).
- **CA-78.14** Dado dos pestañas, cuando una edita las líneas del movimiento y la otra lo suelta sobre una categoría, entonces la segunda responde `conflicto_desactualizado` y la fila lo dice.
- **CA-78.15 (manual)** En un Android real y en un iPhone, la pulsación larga sobre el asa no abre el menú contextual ni selecciona texto, y desplazar la lista sigue funcionando.
  - **[F7]** **CT-03.** Rige: "En un Android real, la pulsación larga sobre el asa…". iPhone: riesgo aceptado (P7-9); WebKit parcial no lo cubre. Procedimiento PRU-MAN-BAND-002 (`07-pruebas.md` §22).

**Escenarios.** —

**Avisos.** AV-01, AV-16, AV-23.

**Dependencias.** FT-35.

---

### 2.6 Programadas

#### FT-40 Administrar programadas [M]

**Objetivo.** Registrar los pagos recurrentes (suscripciones, servicios, cuotas, aportes) para verlos en los próximos pagos, emparejarlos con su SMS y, si se quiere, registrarlos solos.

**Historias.**
- Quiero cargar mi suscripción de Netflix con su monto, tarjeta, categoría y día.
- Quiero desactivarla cuando la cancelo y reactivarla si vuelvo, sin que aparezcan pagos atrasados del tiempo en que no la tuve.
- Quiero eliminar una programada que creé por error.

**Flujo.**
1. `/programadas` → `programadas({ horizonteDias })`: lista con próximas, atrasadas y aviso de cuota sin modelo.
2. `/programadas/nueva` y `/programadas/[programadaId]` (flujos largos) → `formulario({ operacion: 'programada' })`: tipo, cuenta (y destino), comercio, monto y tolerancia, líneas, frecuencia, primera fecha, fin y registro automático → OP-42.
3. [1T] Desactivar o reactivar (OP-42 `activa`), con la salida inversa (05 §4.14).
4. Eliminar (OP-51) solo si `puedeEliminar`.

**Piezas.**
- Operaciones: OP-42, OP-51.
- Consultas: `programadas()`, `formulario` (`programada`), `sugerencia` (CP-3).
- Rutas: `/programadas`, `/programadas/nueva`, `/programadas/[programadaId]`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `CampoLineas`, `Seleccion`, `Interruptor`, `Resultado`, `EstadoVacio`.

**Reglas.** 01 §4.16, OP-42, P17, M3, inv. 13; 04 OP-42 (P3-6b: el calendario no cambia con historial; QB-1), OP-51 (HZ-1), §6.12.1; P6-20 (0.13): al reactivar, solo cuentan las fechas desde la reactivación (`reactivada_desde`, CF-20) **[R3]**.

**Estados.**
- Sin programadas: enlace a crear la primera.
- `calendarioEditable = false`: primera fecha y frecuencia sin edición, con el motivo de `calendario_con_historial`.
- Cuota con registro automático y préstamo sin modelo: `avisoSinModelo`.

**Errores y textos.** `calendario_con_historial`, `programada_con_historial`, `registro_automatico_sin_modelo`, `cuenta_archivada`, `cuenta_tipo_no_valido`, `categoria_archivada`, `categoria_de_pago_no_permitida`, `suma_lineas_distinta`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-40.1** Dado una programada mensual de $15.49 el día 17 con Visa Oro a Streaming, cuando la creo, entonces aparece en próximos pagos de Inicio cuando faltan 7 días o menos y en `/programadas` cuando faltan 30 o menos.
- **CA-40.2** Dado una programada con una ocurrencia registrada, cuando intento cambiar su día, entonces se rechaza con `calendario_con_historial`; cambiar el monto sí se acepta y afecta solo las ocurrencias futuras.
- **CA-40.3** Dado una programada sin historial, cuando la elimino, entonces desaparece; con historial, "Eliminar" no se ofrece y la base rechaza la eliminación (`programada_con_historial`).
- **CA-40.4** Dado una cuota con registro automático y un préstamo sin modelo, cuando la guardo, entonces se rechaza con `registro_automatico_sin_modelo`.
- **CA-40.5** **[R3]** Dado una programada mensual del día 17, desactivada el 1 de junio y reactivada el 20 de septiembre, cuando abro `/programadas`, entonces no tiene atrasadas de junio, julio, agosto ni del 17 de septiembre, y la próxima es el 17 de octubre.
- **CA-40.6** **[R3]** Dado la misma programada con registro automático, cuando corre la tarea diaria el 20 de septiembre, entonces no registra ninguna ocurrencia del tramo inactivo.
- **CA-40.7** Dado que desactivo una programada, cuando toco "Reactivar" en el resultado, entonces vuelve a estar activa (salida inversa de 05 §4.14).
- **CA-40.8** Dado cualquier programada, cuando la creo, edito o desactivo, entonces ningún número del presupuesto cambia (inv. 13).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-50, FT-18.

#### FT-41 Próximos pagos, registro de un toque y omitir [M]

**Objetivo.** Ver los pagos que vienen y los atrasados, registrarlos con un toque cuando no llega SMS, u omitir los que no se cobraron.

**Historias.**
- Quiero ver qué pagos vienen esta semana y cuáles están atrasados.
- Si un débito automático no manda SMS, quiero registrarlo con un toque con su fecha.
- Si este mes no me cobraron, quiero omitirlo.

**Flujo.**
1. Inicio (7 días, atrasados) y `/programadas` (`?horizonte=`, 30 por defecto).
2. Una ocurrencia → `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (flujo corto): datos de la programada, editables según su tipo (monto, líneas, desglose de cuota).
3. "Registrar" (OP-43 de un toque), con AV-01 si la fecha es de un período cerrado; u "Omitir" (OP-44).

**Piezas.**
- Operaciones: OP-43 (un toque), OP-44.
- Consultas: `inicio()` (`proximosPagos`, `pagosAtrasados`), `programadas()`, `formulario` (`programada` con `fechaEsperada`, CP-10b).
- Rutas: `/`, `/programadas`, `/programadas/[programadaId]/ocurrencias/[fechaEsperada]`.
- Componentes: `Monto`, `EntradaMonto`, `CampoLineas`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-43, OP-44, §4.16, §7.8, A-6, B-12 (fecha esperada, nunca hoy), inv. 15; 04 BE-37 (horizontes), CP-10b.

**Estados.** Ocurrencia ya resuelta: lo dice y enlaza a su transacción. Es el destino de las notificaciones `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado` y **[R4]** `cuota_proxima` (3.16, CA-71.13).

**Errores y textos.** `ocurrencia_ya_resuelta`, `ocurrencia_no_valida` y los de la operación de su tipo. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-41.1** Dado una ocurrencia del 17 pendiente y hoy 19, cuando abro Inicio, entonces aparece en pagos atrasados; al registrarla con un toque, la transacción tiene fecha 17 y la ocurrencia queda registrada.
- **CA-41.2** Dado una ocurrencia omitida, cuando abro Inicio y Programadas, entonces ya no aparece y no se registra sola.
- **CA-41.3** Dado una ocurrencia ya registrada, cuando abro su ruta, entonces veo "Ese pago programado ya está registrado." con el enlace a la transacción.
- **CA-41.4** Dado una fecha que no corresponde a la programada en la ruta, cuando la abro o envío, entonces responde `ocurrencia_no_valida`.
- **CA-41.5** Dado el paso 1 de ESC-50 (con la enmienda PR-3), cuando registro con un toque la ocurrencia del 25 de enero (P1, cerrado), entonces veo AV-01 y, al confirmar, se llega al estado final del paso 1b.
- **CA-41.6** Dado una ocurrencia de cuota de préstamo con modelo, cuando abro su ruta, entonces el desglose viene propuesto y es editable antes de registrar.

**Escenarios.** ESC-50 (paso 1b).

**Avisos.** AV-01.

**Dependencias.** FT-40.

#### FT-42 Registro automático y puesta al día [M]

**Objetivo.** Que las programadas marcadas como automáticas se registren solas en su fecha, sin duplicarse y sin tocar períodos cerrados, aunque la tarea diaria falle un día.

**Historias.**
- Quiero que mi suscripción se registre sola el día que me cobran.
- Si algo impide registrarla, quiero enterarme.

**Flujo.**
1. La tarea diaria (cron, entre las 00:05 y las 00:59 de El Salvador) y la puesta al día, que el layout lanza en `after()` en la primera visita del día (BE-50), ejecutan OP-43 automático (04 §10.2, paso 1).
2. Por cada ocurrencia pendiente con fecha ≤ hoy, en orden cronológico, un `escribir()` con la fecha esperada.
3. Período cerrado o cuota sin modelo: no se registra, queda pendiente y se notifica una vez (AV-23).
4. Registros y fallos: notificaciones `registro_automatico` y `registro_automatico_fallido` (FT-71).

**Piezas.**
- Operaciones: OP-43 (automático).
- Consultas: `inicio()`, `programadas()`; `ajustes()` (diagnóstico de la tarea).
- Rutas: la tarea diaria de 04 §10 (sin pantalla propia); `/ajustes/diagnostico` ("Ejecutar tareas ahora").
- Componentes: —.

**Reglas.** 01 OP-43 (automático, idempotente, cada registro atómico por separado), B-12, CB-33, inv. 15; 02 ADR-11; 04 §10.1 a §10.3, BE-50, QB-1, PR-3 (ESC-50 enmendado); 05 §6.6.

**Estados.** Sin pantalla propia: el resultado se ve en Actividad (origen `programada`), en Inicio y en las notificaciones.

**Errores y textos.** Sin errores de interfaz. Textos de las notificaciones de 04 §11.4.

**Criterios de aceptación.**
- **CA-42.1** Dado el paso 0 de ESC-50 y hoy 10 de marzo, cuando corre la tarea, entonces registra solo la ocurrencia del 25 de febrero (P2) y deja pendiente la del 25 de enero (P1, cerrado) con una notificación `ocurrencia_en_periodo_cerrado` (PR-3, paso 1).
- **CA-42.2** Dado el paso 1, cuando la tarea corre otra vez el mismo día, entonces no cambia nada y no hay otra notificación (paso 2, idempotente).
- **CA-42.3** Dado una programada cuya cuenta se archivó, cuando corre la tarea, entonces esa ocurrencia queda pendiente con `registro_automatico_fallido` y las demás programadas se registran (CB-33).
- **CA-42.4** Dado 250 ocurrencias pendientes, cuando corre la tarea, entonces registra 200 y el resto en la siguiente ejecución.
- **CA-42.5** Dado que el cron no corrió hoy todavía, cuando abro la app, entonces la primera página se pinta sin esperar y la puesta al día registra lo pendiente después (`after()`, BE-50); la siguiente navegación o refresco ya lo muestra (05 §6.6, P5-8). Una segunda pestaña abierta en los 5 minutos siguientes no la vuelve a lanzar.
- **CA-42.6** Dado una ocurrencia registrada sola, cuando llega su SMS, entonces se empareja con la registrada y no se crea otra transacción (FT-35, CA-35.6).

**Escenarios.** ESC-50.

**Avisos.** AV-23.

**Dependencias.** FT-40, FT-41.

---

### 2.7 Conciliación

#### FT-43 Conciliar con estado de cuenta CSV [M]

**Objetivo.** Comparar una cuenta contra el estado de cuenta del banco: marcar las coincidencias como conciliadas, agregar lo que falta y terminar con la diferencia aceptada a la vista, sin que Finn cree nada por su cuenta (inv. 14).

**Historias.**
- Quiero subir el CSV del banco y ver qué coincide, qué falta en Finn y qué tiene Finn que el banco no.
- Quiero agregar con un toque lo que falta, con la fecha del estado.
- Si queda una diferencia, quiero verla y que Finn me proponga el ajuste.

**Flujo.**
1. Detalle de cuenta → `/cuentas/[cuentaId]/conciliar` (flujo largo) → `formulario({ operacion: 'conciliar' })` (CP-16).
2. Subir el CSV → OP-45: clasificación (coincidencias, solo en el estado, solo en Finn), saldo de Finn a la fecha del estado, diferencia propuesta y carga firmada.
3. Marcar coincidencias; por cada movimiento "solo en el estado", "Agregar" con el tipo de alta que admite su signo → OP-46 (origen `importada`, estado `confirmada`).
4. "Terminar" → OP-47 con los pares marcados.
5. Diferencia ≠ 0: AV-21 con la propuesta de ajuste (FD-06), que abre el flujo de alta con los valores iniciales.

**Piezas.**
- Operaciones: OP-45, OP-46, OP-47; propuesta de AV-21 (OP-20, OP-21 u OP-27b, 3.2.5).
- Consultas: `formulario` (`conciliar`), `sugerencia` y búsqueda de compras (CP-3), `detalleCuenta()`.
- Rutas: `/cuentas/[cuentaId]/conciliar`.
- Componentes: lista de clasificación con `Casilla`, `FilaTransaccion`, `Monto`, `ConfirmacionImpacto`, `Aviso`.

**Reglas.** 01 OP-45 a OP-47, §4.17 (coincidencia: misma cuenta, monto, ±3 días, 1 a 1), §7.2, P11, P12, N6, DM-8, supuesto 11 (precisado en FD-06), inv. 14; 04 §9 (decodificación, adaptadores, carga firmada de 24 h, reclasificación en cada paso), ADR-17; 05 §4.11 (borrador con la huella del archivo).

**Estados.**
- Formato no reconocido, ambiguo o PDF: el mensaje y volver a subir.
- Carga vencida (más de 24 h): pide volver a subir; con el mismo archivo se restauran las marcas.
- Cuenta archivada: el flujo no se abre (05 §7.7).
- ⚠ (S6-1) Los adaptadores esperan las muestras reales (P4-3).

**Errores y textos.** `formato_no_reconocido`, `formato_ambiguo`, `archivo_pdf`, `firma_no_valida`, `firma_vencida`, `coincidencia_no_valida`, `transaccion_ya_conciliada`, `cuenta_tipo_no_valido`. Texto del ajuste: "Ajuste de conciliación" (3.2.5).

**Criterios de aceptación.**
- **CA-43.1** Dado el paso 0 de ESC-47 y un estado al 15 de febrero con A $40.00, B $25.00 y D $10.00 y saldo −$75.00, cuando lo subo, entonces A y B salen como coincidencias, D como solo en el estado, C como solo en Finn y la diferencia propuesta es +$2.00.
- **CA-43.2** Dado esa clasificación, cuando termino sin resolver C ni D, entonces A y B quedan conciliadas, la diferencia aceptada es +$2.00 y aparece AV-21 con la propuesta de ajuste (paso 1).
- **CA-43.3** Dado el paso 1, cuando edito C a $10.00, entonces la diferencia actual pasa a $0.00 sin cambio posterior (paso 2).
- **CA-43.4** Dado una tarjeta y una diferencia de +$2.00 (el banco muestra menos deuda), cuando toco la propuesta, entonces se abre `/registrar/entrada-tarjeta` con la tarjeta, la fecha del estado, $2.00 y el comercio "Ajuste de conciliación" (FD-06).
- **CA-43.5** Dado un movimiento solo en el estado, cuando lo agrego como gasto con su categoría, entonces la transacción tiene origen `importada`, estado `confirmada` y la fecha del estado.
- **CA-43.6** Dado que entre la subida y "Terminar" edité el monto de A, cuando termino con A marcada, entonces se rechaza con `coincidencia_no_valida` (reclasificación, BE-48).
- **CA-43.7** Dado una carga firmada hace 24 h y 1 minuto, cuando agrego o termino, entonces responde `firma_vencida`; al subir el mismo archivo, las marcas se restauran del borrador.
- **CA-43.8** Dado un PDF, cuando lo subo, entonces responde `archivo_pdf`.
- **CA-43.9** Dado cualquier conciliación, cuando termino, entonces no se creó ni cambió ninguna transacción fuera de las que agregué y marqué (inv. 14).
- **CA-43.10 ⚠ (S6-1)** Con un CSV sintético por cada formato de ADR-17, la detección elige el formato correcto. Se rehace con las muestras anonimizadas.

**Escenarios.** ESC-47 (pasos 1 y 2).

**Avisos.** AV-21.

**Dependencias.** FT-52, FT-21; FT-25 (cambios posteriores).

#### FT-44 Verificar saldo (conciliación manual) [M]

**Objetivo.** Verificar una cuenta sin CSV escribiendo el saldo que muestra el banco a una fecha, con la diferencia registrada y la opción de marcar como conciliadas las transacciones hasta esa fecha (F6-1).

**Historias.**
- En mi financiera o mi efectivo no hay CSV: quiero escribir el saldo que veo y saber si Finn coincide.
- Si coincide, quiero marcar todo hasta esa fecha como conciliado de una vez.

**Flujo.**
1. Detalle de cuenta → `/cuentas/[cuentaId]/verificar-saldo?fecha=` (flujo largo, CF-01) → `formulario({ operacion: 'verificar_saldo' })`.
2. Fecha y saldo del banco (en una tarjeta, positivo = deuda).
3. Previsualizar OP-53: saldo de Finn, diferencia y cantidad de transacciones candidatas. Si la diferencia es $0.00, todas preseleccionadas; si no, ninguna (P6-5).
4. Confirmar → OP-53. Diferencia ≠ 0: AV-21 con la propuesta de ajuste (FD-06).

**Piezas.**
- Operaciones: OP-53 (CF-01); propuesta de AV-21.
- Consultas: `formulario` (`verificar_saldo`), `detalleCuenta()`.
- Rutas: `/cuentas/[cuentaId]/verificar-saldo`.
- Componentes: `EntradaFecha`, `EntradaMonto` (`conSigno` en tarjetas), lista con `Casilla`, `ConfirmacionImpacto`, `Aviso`.

**Reglas.** 3.2 de este documento (FD-05, FD-06, columna `modo`); 01 inv. 14, P12, N6, DM-8.

**Estados.** Sin candidatas: se puede verificar igual (registra la diferencia sin marcar nada). En el detalle de cuenta, la conciliación se nombra "Verificación de saldo" (3.2.4).

**Errores y textos.** `cuenta_tipo_no_valido`, `cuenta_archivada`, `fecha_posterior_a_hoy`, `fecha_anterior_a_apertura`, `transaccion_fuera_de_verificacion` (nuevo, 3.2.2), `transaccion_ya_conciliada`. Textos nuevos de 3.2.

**Criterios de aceptación.**
- **CA-44.1** Dado una cuenta de efectivo con saldo de Finn $1,250.00 al 15 de octubre, cuando escribo $1,250.00, entonces la diferencia es $0.00, todas las candidatas vienen marcadas y al confirmar quedan conciliadas con `modo = 'saldo'`.
- **CA-44.2** Dado el mismo caso con $1,262.00, cuando previsualizo, entonces la diferencia es +$12.00, ninguna candidata viene marcada y, al confirmar, aparece AV-21 con la propuesta de un ingreso de $12.00.
- **CA-44.3** Dado una tarjeta con deuda de $300.00 en Finn, cuando escribo $290.00 de deuda, entonces la diferencia es +$10.00 y la propuesta es una entrada a la tarjeta (3.2.5).
- **CA-44.4** Dado una transacción con fecha posterior a la verificada, cuando la marco, entonces se rechaza con `transaccion_fuera_de_verificacion`.
- **CA-44.5** Dado una verificación hecha, cuando abro el detalle de cuenta, entonces aparece como "Verificación de saldo", distinta de una conciliación por estado de cuenta.
- **CA-44.6** Dado una transacción conciliada por una verificación, cuando cambio su monto, entonces se registra un cambio posterior igual que con un CSV (P12).

**Escenarios.** —

**Avisos.** AV-21, AV-16.

**Dependencias.** FT-52.

---

### 2.8 Por cobrar

#### FT-45 Por cobrar y dinero en camino [M]

**Objetivo.** Ver cuánto me deben, quién y desde cuándo, y por qué Listo para asignar está más bajo cuando pagué por otros con débito.

**Historias.**
- Quiero ver lo que me debe cada persona, con cada compra y su saldo.
- Quiero entender qué es "en camino" en Listo para asignar.

**Flujo.**
1. `/por-cobrar?cerrados=1` → `porCobrar()`: por deudor, sus partidas (fecha, comercio, monto, cobrado, condonado, devuelto, abierto, medio, estado).
2. Por partida: cobrar (FT-46), condonar (FT-47); por deudor: renombrar (FT-48).
3. "En camino" en Inicio, Presupuesto y Cuentas con AV-09.

**Piezas.**
- Operaciones: enlaces a OP-31, OP-32, OP-52.
- Consultas: `porCobrar()`, `inicio()`, `cuentas()`.
- Rutas: `/por-cobrar`.
- Componentes: `Monto`, `IndicadorEstado`, `ResumenListoParaAsignar`, `EstadoVacio`.

**Reglas.** 01 §1.5, §4.10 (saldo abierto, dinero en camino solo de compras con débito), §7.4, P9, D1, DM-4; patrimonio con por cobrar (§4.14).

**Estados.** Sin por cobrar abiertos: "Nadie te debe nada". Con `?cerrados=1`, también los cerrados.

**Errores y textos.** Sin errores propios. Texto de AV-09 del catálogo del servidor.

**Criterios de aceptación.**
- **CA-45.1** Dado el paso 2 de ESC-20, cuando abro Por cobrar, entonces Ana debe $25.00 con medio débito y estado abierto, y "En camino" es $25.00.
- **CA-45.2** Dado el paso 1 de ESC-22 (por cobrar con tarjeta), cuando abro Por cobrar, entonces Ana debe $40.00, pero "En camino" es $0.00 (D1: con tarjeta no reduce LPA).
- **CA-45.3** Dado el paso 3 de ESC-20, cuando abro Por cobrar, entonces el saldo abierto de Ana es $15.00 y el estado parcial.
- **CA-45.4** Dado por cobrar abiertos de $25.00 con débito y $40.00 con tarjeta, cuando abro Cuentas, entonces la posición neta incluye $65.00 en activos por cobrar.
- **CA-45.5** Dado un por cobrar cerrado, cuando abro `/por-cobrar` sin `?cerrados=1`, entonces no aparece; con el parámetro, sí.

**Escenarios.** ESC-20 (pasos 2 y 3), ESC-22 (paso 1).

**Avisos.** AV-09.

**Dependencias.** FT-21.

#### FT-46 Cobrar [M]

**Objetivo.** Registrar lo que me devuelven por un gasto compartido, en una o varias veces, en efectivo o en la tarjeta, con su efecto correcto: restitución, excedente como ingreso y, si fue con tarjeta, la propuesta de reservarlo.

**Historias.**
- Cuando Ana me transfiere su parte, quiero vincularla a esa compra.
- Si me paga de más, quiero que el excedente cuente como ingreso.
- Si la compra fue con tarjeta, quiero que Finn me proponga reservar ese dinero para la tarjeta.

**Flujo.**
1. Desde Por cobrar, el detalle de la transacción o una partida → `/por-cobrar/cobrar?linea=&deudor=&fecha=` (flujo corto) → `formulario({ operacion: 'cobrar' })`.
2. Cuenta de depósito (efectivo o tarjeta), fecha y monto.
3. Por cobrar con tarjeta y depósito en efectivo: casilla "Reservar {R} para {tarjeta}" **preseleccionada** (AV-22, BE-36), que el usuario puede desmarcar.
4. OP-31; después, AV-22 si no se reservó en el mismo paso, AV-05 si el pago implícito deja negativa la categoría de pago.

**Piezas.**
- Operaciones: OP-31 (con `asignarAPagoTarjeta`).
- Consultas: `formulario` (`cobrar`).
- Rutas: `/por-cobrar/cobrar`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `Casilla`, `ConfirmacionImpacto`, `Aviso`.

**Reglas.** 01 OP-31, §4.10 (restitución, excedente, pago implícito), D1, O1, N9, Q3, Q7, B-7, CB-05, CB-23; 04 OP-31, BE-36.

**Estados.** Partida sin saldo abierto a la fecha elegida: no se ofrece.

**Errores y textos.** `linea_no_es_por_cobrar`, `sin_saldo_abierto`, `evento_anterior_a_original`, `cuenta_archivada`, `fecha_posterior_a_hoy`. Textos de AV-22 y AV-05 del catálogo del servidor.

**Criterios de aceptación.**
- **CA-46.1** Dado el paso 2 de ESC-20, cuando Ana paga $10.00 a Ahorro, entonces LPA es $685.00 y "En camino" $15.00 (paso 3); con $20.00 más, la restitución es $15.00, el excedente $5.00 como ingreso y LPA $705.00 (paso 4).
- **CA-46.2** Dado el paso 1 de ESC-22, cuando Ana paga $40.00 a Ahorro, entonces la casilla de reservar viene marcada; al confirmar así, LPA queda en $700.00, Pago T en $80.00 y "Te falta reservar" en $0.00 (pasos 2 y 3 en una sola operación).
- **CA-46.3** Dado el paso 1 de ESC-23, cuando Beto paga $20.00 y desmarco la casilla, entonces LPA sube a $420.00 y aparece AV-22 como propuesta en el resultado (paso 2).
- **CA-46.4** Dado el paso 1 de ESC-48 (con reserva), cuando Ana deposita $30.00 en T, entonces la restitución es $25.00 con pago implícito, LPA queda en $700.00, Pago T en $75.00 y T con reserva excedente de $5.00 (AV-08).
- **CA-46.5** Dado el paso 1 de ESC-48 (sin reserva), cuando Ana deposita $30.00 en T, entonces Pago T queda en −$25.00 y aparece AV-05.
- **CA-46.6** Dado un por cobrar cerrado, cuando intento cobrarlo, entonces se rechaza con `sin_saldo_abierto` (CB-23).
- **CA-46.7** Dado un cobro registrado, cuando abro el reporte de ingresos frente a gastos, entonces la restitución no aparece como ingreso y el excedente sí (D1, N9).

**Escenarios.** ESC-20 (pasos 3 y 4), ESC-22, ESC-23 (paso 2), ESC-48.

**Avisos.** AV-22, AV-05, AV-08, AV-09, AV-11.

**Dependencias.** FT-45.

#### FT-47 Condonar [M]

**Objetivo.** Perdonar todo o parte de lo que me deben, convirtiéndolo en un gasto mío en la categoría que elija, en el período en que lo perdono.

**Historias.** Si un amigo me pagó de menos o nunca me pagó, quiero perdonar el saldo y que pase a ser un gasto mío.

**Flujo.**
1. Desde Por cobrar o el detalle de la transacción → `/por-cobrar/condonar/[lineaId]` (flujo corto) → `formulario({ operacion: 'condonar' })`: monto (hasta el saldo abierto), fecha y categoría (propuesta: la primera de la misma compra si está activa).
2. OP-32; después, AV-02 o AV-03 si la categoría queda sobregirada.
3. Para deshacer: eliminar la condonación desde el detalle de la transacción (OP-34, FT-28).

**Piezas.**
- Operaciones: OP-32.
- Consultas: `formulario` (`condonar`).
- Rutas: `/por-cobrar/condonar/[lineaId]`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `Seleccion`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-32, §4.10, I4, H8 (con tarjeta, consumo con reparto D2), inv. 9 y 20, CB-22, ajuste 1.

**Estados.** Categoría original archivada: no se propone; se pide elegir una activa.

**Errores y textos.** `condonacion_mayor_que_abierto`, `linea_no_es_por_cobrar`, `categoria_archivada`, `categoria_de_pago_no_permitida`, `evento_anterior_a_original`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-47.1** Dado el paso 2 de ESC-21, cuando condono $20.00 a Ropa (Disponible $0.00), entonces LPA sube a $150.00, Ropa queda en −$20.00 con AV-02 y "En camino" en $0.00 (paso 3); al cierre, LPA baja a $130.00 (paso 4).
- **CA-47.2** Dado el paso 2 de ESC-23, cuando condono $40.00 a Salidas, entonces Salidas queda en $0.00, Pago T en $100.00 y "Te falta reservar" en $20.00 (paso 3, consumo con tarjeta cubierto).
- **CA-47.3** Dado un saldo abierto de $15.00, cuando intento condonar $20.00, entonces se rechaza con "Solo quedan $15.00 por cobrar." (CB-22).
- **CA-47.4** Dado el paso 2 de ESC-44, cuando intento condonar hacia Gimnasio (archivada), entonces se rechaza con `categoria_archivada` y la propuesta es otra categoría activa (paso 3).

**Escenarios.** ESC-21, ESC-23 (paso 3), ESC-44 (paso 3).

**Avisos.** AV-02, AV-03.

**Dependencias.** FT-45.

#### FT-48 Renombrar deudor [M]

**Objetivo.** Corregir el nombre de un deudor mal escrito sin tocar ningún número.

**Historias.** Si escribí "Carlso", quiero corregirlo a "Carlos" en todas sus partidas.

**Flujo.** Por cobrar → `/por-cobrar/deudores/[deudorId]/renombrar` (flujo corto) → OP-52 con `esperado.nombre`.

**Piezas.**
- Operaciones: OP-52.
- Consultas: `porCobrar()`.
- Rutas: `/por-cobrar/deudores/[deudorId]/renombrar`.
- Componentes: `EntradaTexto`.

**Reglas.** 04 OP-52 (QB-2); FD-08 (unir deudores queda para después, FT-49).

**Estados.** —

**Errores y textos.** `nombre_repetido` con el mensaje de OP-52 ("Ya existe un deudor llamado {nombre}."), `conflicto_desactualizado`.

**Criterios de aceptación.**
- **CA-48.1** Dado el deudor "Carlso" con dos partidas, cuando lo renombro a "Carlos", entonces las dos partidas aparecen a nombre de "Carlos" y ningún número cambia.
- **CA-48.2** Dado los deudores "Carlos" y "Carlso", cuando renombro "Carlso" a "carlos", entonces se rechaza con "Ya existe un deudor llamado carlos." (unir no está en la primera versión).
- **CA-48.3** Dado que otra pestaña lo renombró, cuando envío, entonces responde `conflicto_desactualizado`.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-45.

#### FT-49 Unir deudores [P] — diferida

**Objetivo.** Juntar dos deudores que son la misma persona, con todas sus partidas. **No entra en la primera versión** (P6-7): queda diseñada en 3.4 como CF-03 diferido.

**Historias.** Si creé "Carlos" y "Carlos M." para la misma persona, quiero juntarlos.

**Flujo.** Por cobrar → `/por-cobrar/deudores/[deudorId]/unir` (flujo corto, diferido) → previsualizar y confirmar → OP-54.

**Piezas.**
- Operaciones: OP-54 (CF-03, diferido).
- Consultas: `porCobrar()`.
- Rutas: `/por-cobrar/deudores/[deudorId]/unir` (CF-03, diferido).
- Componentes: `ConfirmacionImpacto`.

**Reglas.** 3.4 de este documento: excepción explícita a 01 OP-28 y a `g_linea_con_eventos` de 03.

**Estados.** Mientras no se implemente: renombrar (FT-48) rechaza un nombre repetido.

**Errores y textos.** Los de 3.4 cuando se implemente. Sin textos en la primera versión.

**Criterios de aceptación.** Para cuando se implemente:
- **CA-49.1** Dado "Carlos M." con una partida de $30.00 que tiene un cobro de $10.00, cuando lo uno a "Carlos", entonces la partida y su cobro quedan a nombre de "Carlos" con saldo abierto $20.00 y "Carlos M." deja de existir.
- **CA-49.2** Dado cualquier unión, cuando comparo los números antes y después, entonces LPA, Disponibles, en camino y patrimonio no cambian.
- **CA-49.3** Dado la unión sin confirmar, cuando la envío sin `huellaImpacto`, entonces responde `REQUIERE_CONFIRMACION`.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-48; CF-03.

---

### 2.9 Cuentas y préstamos

#### FT-50 Crear cuenta con saldo inicial [I]

**Objetivo.** Crear cada cuenta con el saldo que tiene hoy (o a su fecha de apertura) para empezar desde cero (FD-04): en efectivo entra a Listo para asignar, en una tarjeta queda como "te falta reservar", y en un préstamo en curso, como capital pendiente.

**Historias.**
- Quiero crear mi cuenta de ahorro con su saldo y verlo en Listo para asignar.
- Quiero crear mi tarjeta con la deuda que trae, su límite, corte y pago.
- Quiero crear un préstamo en curso con lo que debo y las cuotas que ya pagué.

**Flujo.**
1. `/cuentas/nueva?tipo-cuenta=` (flujo largo) → `formulario({ operacion: 'cuenta' })`.
2. Tipo, nombre, institución, últimos 4, fecha de apertura (por defecto, hoy) y saldo (en tarjeta, "Debo" / "Tengo a favor", 05 §5.2).
3. Campos del tipo: tarjeta (límite, tasa, corte, pago, red, color), préstamo (condiciones, cuotas pagadas, modelo), inversión (rendimiento).
4. Aviso antes de enviar si el nombre de la tarjeta ya se usa (`nombresTarjetaUsados`, BE-35). AV-01 si la apertura está en un período cerrado.
5. OP-01; una tarjeta crea su categoría de pago en "Pagos de tarjeta".

**Piezas.**
- Operaciones: OP-01.
- Consultas: `formulario` (`cuenta`).
- Rutas: `/cuentas/nueva`.
- Componentes: `EntradaTexto`, `EntradaMonto` (`conSigno`, `etiquetasSigno`), `EntradaFecha`, `Seleccion`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-01, P13, M1, R8, inv. 22, CB-14, CB-28; 04 OP-01, BE-35; FD-04.

**Estados.** Borrador (05 §4.11). Saldo $0.00: no se crea transacción de saldo inicial (CB-28).

**Errores y textos.** `ultimos4_repetidos`, `nombre_repetido` (incluida la variante de tarjeta archivada), `fecha_posterior_a_hoy`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-50.1** Dado una base vacía y hoy 5 de febrero, cuando creo Ahorro con $1,000.00 y T con deuda $300.00, entonces LPA es $1,000.00 y "Te falta reservar" de T $300.00, con AV-07 (pasos 1 y 2 de ESC-01).
- **CA-50.2** Dado hoy 5 de marzo, cuando creo Ahorro con apertura el 25 de enero y $500.00, entonces veo AV-01 con Δ LPA +$500.00 antes de confirmar (paso 1 de ESC-02).
- **CA-50.3** Dado un préstamo en curso con capital $5,000.00 y 10 cuotas pagadas, cuando lo creo, entonces LPA no cambia y el patrimonio baja $5,000.00 (paso 4 de ESC-01).
- **CA-50.4** Dado una tarjeta archivada "Visa Oro", cuando creo otra tarjeta "visa oro", entonces el formulario avisa antes de enviar y el servidor rechaza con el mensaje de la tarjeta archivada (BE-35).
- **CA-50.5** Dado una cuenta del BAC terminada en 4821, cuando creo otra del BAC con 4821, entonces se rechaza con `ultimos4_repetidos`; de Banco Agrícola con 4821, se acepta (CB-14).
- **CA-50.6** Dado una tarjeta creada, cuando abro Presupuesto, entonces su categoría de pago está en "Pagos de tarjeta" con el nombre de la tarjeta.
- **CA-50.7** Dado una cuenta con saldo $0.00, cuando la creo, entonces no tiene ninguna transacción.

**Escenarios.** ESC-01, ESC-02 (pasos 1 y 2).

**Avisos.** AV-01, AV-07.

**Dependencias.** FT-01.

#### FT-51 Cuentas y posición neta [I]

**Objetivo.** Ver dónde está el dinero y cuánto debo: cada cuenta con su saldo y saldo confirmado, las tarjetas con lo que falta reservar, préstamos, inversiones y la posición neta.

**Historias.**
- Quiero ver mis cuentas agrupadas por tipo con sus saldos.
- Quiero ver mi posición neta: lo que tengo, incluido lo que me deben, frente a lo que debo.
- Quiero ver también las archivadas cuando las necesito.

**Flujo.**
1. `/cuentas?archivadas=1` → `cuentas()`.
2. Grupos: tarjetas (`TarjetaCredito`), efectivo, préstamos e inversiones (`FilaCuenta`); posición neta con su desglose.
3. Acciones: nueva cuenta (FT-50), ordenar (FT-53), pagar una tarjeta (FT-30), cada detalle (FT-52).

**Piezas.**
- Operaciones: enlaces a OP-01, OP-03, OP-23.
- Consultas: `cuentas()`.
- Rutas: `/cuentas`.
- Componentes: `TarjetaCredito`, `FilaCuenta`, `BarraProgreso`, `Monto`, `EstadoVacio`.

**Reglas.** 01 §4.3, §4.14 (patrimonio), P9; 04 §6.5; 05 §12.3 ("Posición neta" en Cuentas, "Patrimonio" en Inicio y Reportes).

**Estados.** Sin cuentas: "Agregá tu primera cuenta". Cuenta con diferencia de conciliación: AV-21 en su fila.

**Errores y textos.** Sin errores propios. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-51.1** Dado el paso 4 de ESC-01, cuando abro Cuentas, entonces la posición neta es −$4,300.00: activos $1,000.00, deudas $5,300.00.
- **CA-51.2** Dado el paso 2 de ESC-40, cuando abro Cuentas, entonces el patrimonio es $3,000.00, igual que en el paso 0.
- **CA-51.3 (error 11)** Dado cualquier estado, cuando comparo la posición neta de Cuentas con el patrimonio de Inicio, entonces son el mismo número.
- **CA-51.4** Dado una cuenta archivada, cuando abro Cuentas sin `?archivadas=1`, entonces no aparece; con el parámetro, aparece marcada.
- **CA-51.5** Dado una cuenta con una transacción pendiente de $40.00, cuando abro Cuentas, entonces muestra saldo y saldo confirmado, con $40.00 de diferencia.
- **CA-51.6** **[R5]** Dado el paso 4 de ESC-01 (activos $1,000.00, deudas $5,300.00), cuando abro Cuentas, entonces `posicionNeta.barras` = activos 1,887 y deudas 10,000 puntos básicos (escala relativa al mayor) y `PosicionNeta` dibuja esos anchos sin recalcular.
- **CA-51.7** **[R5]** Dado activos y deudas en $0.00, cuando abro Cuentas, entonces las dos barras son 0; con activos iguales a deudas, las dos son 10,000.
- **CA-51.8** **[R5]** Dado Visa Oro de A.7 (te falta reservar $18.75, límite $2,500.00), cuando abro Cuentas, entonces `usoSinReservarBp` es 75; con límite nulo o $0.00 es nulo y la barra no muestra la parte sin reservar; con te falta reservar mayor que el límite, 10,000.

**Escenarios.** ESC-01 (paso 4), ESC-40.

**Avisos.** AV-07, AV-08, AV-09, AV-21.

**Dependencias.** FT-50.

#### FT-52 Detalle de cuenta [I]

**Objetivo.** Ver los movimientos de una cuenta con su saldo corrido, el saldo confirmado, sus conciliaciones con la diferencia actual y, según el tipo, la tarjeta, el préstamo o la inversión (error 2 a la vista).

**Historias.**
- Quiero ver los movimientos de una cuenta y el saldo después de cada uno.
- Quiero filtrar por período, tipo y estado.
- Quiero ver mis conciliaciones y si algo cambió después.

**Flujo.**
1. `/cuentas/[cuentaId]?periodo=&tipo=&estado=&cursor=` → `detalleCuenta()`.
2. Movimientos con `saldoDespues`; conciliaciones con diferencia aceptada, diferencia actual y cambios posteriores; programadas de la cuenta.
3. Según el tipo: tarjeta (deuda, reservado, te falta reservar, ciclo, desglose al pagar), préstamo (FT-55), inversión (aportes, retiros, ajustes).
4. Acciones: editar, condiciones, pagar, cuota, conciliar, verificar saldo, archivar, eliminar, desarchivar [1T], registrar con esta cuenta.

**Piezas.**
- Operaciones: enlaces a OP-02, OP-48, OP-23, OP-24, OP-45, OP-53, OP-04, OP-06; [1T] OP-05.
- Consultas: `detalleCuenta()` (con CP-9 y `modo` de CF-01).
- Rutas: `/cuentas/[cuentaId]`.
- Componentes: `FilaTransaccion`, `Monto`, `SelectorPeriodo`, `TarjetaCredito`, `Aviso`, `EstadoVacio`.

**Reglas.** 01 §4.3 (saldo = Σ efectos, inv. 4), §4.14, DM-8, P11; 04 §6.6.

**Estados.** Sin movimientos: "Esta cuenta todavía no tiene movimientos". Archivada: solo lectura (05 §7.7), con "Desarchivar".

**Errores y textos.** Sin errores propios. Textos de 3.2.4 ("Estado de cuenta", "Verificación de saldo").

**Criterios de aceptación.**
- **CA-52.1 (error 2)** Para cualquier estado, el saldo de cada cuenta es exactamente Σ de sus efectos y el `saldoDespues` del último movimiento es igual al saldo (prueba de propiedades sobre inv. 4).
- **CA-52.2** Dado el paso 3 de ESC-47, cuando abro la tarjeta, entonces su conciliación muestra diferencia aceptada +$2.00, diferencia actual +$5.00 y un cambio posterior de A.
- **CA-52.3** Dado `?periodo=` de un período cerrado, cuando abro la cuenta, entonces veo solo los movimientos con fecha en ese período y los enlaces a los períodos vecinos.
- **CA-52.4** Dado una cuenta archivada, cuando abro su detalle, entonces "Pagar", "Cuota", "Conciliar" y "Registrar" están deshabilitados con el motivo y "Desarchivar" está disponible.
- **CA-52.5** Dado 120 movimientos, cuando cargo más, entonces el saldo corrido sigue siendo coherente entre páginas.

**Escenarios.** ESC-47 (paso 3).

**Avisos.** AV-04, AV-05, AV-06, AV-07, AV-08, AV-21.

**Dependencias.** FT-51.

#### FT-53 Editar, ordenar, archivar, desarchivar y eliminar cuentas [I]

**Objetivo.** Mantener las cuentas sin perder historial (error 1): editar sus datos, ordenarlas, archivar las que ya no se usan y eliminar solo las que no tienen movimientos.

**Historias.**
- Quiero corregir el nombre, el banco o la fecha de apertura de una cuenta.
- Quiero archivar una tarjeta que cancelé, con su categoría de pago.
- Si creé una cuenta por error, quiero eliminarla y ver antes qué cambia.

**Flujo.**
1. Editar: `/cuentas/[cuentaId]/editar` (flujo largo) → OP-02 (AV-01 si el saldo inicial cambia de período).
2. Ordenar: `/cuentas/ordenar` (flujo corto) → OP-03.
3. Archivar: `/cuentas/[cuentaId]/archivar` (flujo corto) → OP-04; con bloqueos, los explica y no deja continuar. En una tarjeta, ofrece devolver las asignaciones futuras.
4. Desarchivar: [1T] OP-05, con "Archivar de nuevo" como salida.
5. Eliminar: `/cuentas/[cuentaId]/eliminar` (flujo corto) → previsualizar (AV-15, AV-01) y confirmar siempre → OP-06; con bloqueos, ofrece archivar.

**Piezas.**
- Operaciones: OP-02, OP-03, OP-04, OP-05, OP-06.
- Consultas: `formulario` (`cuenta`), `cuentas()`, `detalleCuenta()` (`acciones`).
- Rutas: `/cuentas/[cuentaId]/editar`, `/cuentas/ordenar`, `/cuentas/[cuentaId]/archivar`, `/cuentas/[cuentaId]/eliminar`.
- Componentes: `ConfirmacionImpacto`, `Resultado`, `Aviso`.

**Reglas.** 01 OP-02 a OP-06, R4, H9, N7, O3, F1, A-1, A-5, inv. 24 y 25; 04 OP-02 a OP-06, BE-35 (la categoría de pago sigue el nombre de la tarjeta), HZ-1.

**Estados.** Bloqueos de archivo (saldo, deuda, reserva, futuras) y de eliminación (movimientos, programadas), en texto.

**Errores y textos.** `apertura_posterior_a_movimientos`, `ultimos4_repetidos`, `nombre_repetido`, `cuenta_con_saldo`, `tarjeta_con_deuda`, `reserva_tarjeta_no_cero`, `cuenta_con_movimientos`, `cuenta_con_programadas`, `cuenta_ya_archivada`, `cuenta_no_archivada`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-53.1** Dado el paso 1 de ESC-43, cuando elimino U, entonces la previsualización muestra AV-15 (Δ LPA +$200.00, la categoría Pago U que se elimina) y, al confirmar, LPA es $1,000.00, incluidas las asignaciones del período cerrado (paso 2, F1).
- **CA-53.2** Dado una tarjeta con deuda $50.00, cuando intento archivarla, entonces se rechaza con "{tarjeta} todavía tiene una deuda de $50.00."
- **CA-53.3** Dado una tarjeta sin deuda con Pago T $0.00 y $30.00 asignados en un período futuro, cuando la archivo aceptando devolverlos, entonces la tarjeta y Pago T quedan archivadas y LPA sube $30.00.
- **CA-53.4** Dado una cuenta con una transacción además del saldo inicial, cuando intento eliminarla, entonces se rechaza con `cuenta_con_movimientos` y se ofrece archivar.
- **CA-53.5** Dado que renombro la tarjeta "Visa Oro" a "Visa Platino", cuando abro Presupuesto, entonces su categoría de pago se llama "Visa Platino" (BE-35).
- **CA-53.6** Dado una cuenta con movimientos desde el 10 de febrero, cuando cambio su apertura al 15 de febrero, entonces se rechaza con `apertura_posterior_a_movimientos`.
- **CA-53.7** Dado una cuenta desarchivada con un toque, cuando toco "Archivar de nuevo", entonces vuelve a quedar archivada.

**Escenarios.** ESC-43.

**Avisos.** AV-15, AV-01.

**Dependencias.** FT-52.

#### FT-54 Pagar cuota o abonar a capital [I]

**Objetivo.** Pagar la cuota de un préstamo o abonar a capital con el desglose correcto, de modo que solo el capital baje la deuda (error 6) y el total salga de la categoría elegida.

**Historias.**
- Quiero pagar la cuota y que Finn me proponga el desglose de capital, interés y seguro.
- Quiero hacer un abono a capital.
- Quiero ver cuánto llevo pagado en intereses y seguro.

**Flujo.**
1. Detalle del préstamo → `/cuentas/[cuentaId]/cuota?modalidad=cuota|abono&fecha=` (flujo corto) → `formulario({ operacion: 'cuota_prestamo' })`.
2. Origen (efectivo o tarjeta, C-1), fecha, total y categoría (propuesta: la de la última cuota).
3. Cuota con modelo: desglose propuesto, que se recalcula al cambiar la fecha si no se editó (05 §2.7).
4. OP-24; después, AV-02 o AV-03 si la categoría queda sobregirada.

**Piezas.**
- Operaciones: OP-24.
- Consultas: `formulario` (`cuota_prestamo`).
- Rutas: `/cuentas/[cuentaId]/cuota`.
- Componentes: `EntradaMonto`, `EntradaFecha`, `Seleccion`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-24, H6, P3, supuesto 16, C-1, CB-07, Anexo A; 04 OP-24.

**Estados.** Préstamo sin modelo: desglose a mano, sin propuesta. Abono: interés y seguro en $0.00.

**Errores y textos.** `desglose_no_cuadra`, `capital_mayor_que_pendiente`, `categoria_archivada`, `categoria_de_pago_no_permitida`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-54.1 (error 6)** Dado el paso 1 de ESC-39, cuando pago una cuota de $350.00 con capital $250.00, interés $90.00 y seguro $10.00, entonces el capital pendiente baja de $10,000.00 a $9,750.00, la categoría queda en $0.00 y el costo financiero suma $100.00 (paso 2).
- **CA-54.2** Dado un desglose que suma $349.00 para un total de $350.00, cuando envío, entonces se rechaza con "Capital, interés y seguro suman $349.00; el pago es de $350.00."
- **CA-54.3** Dado un capital de $10,500.00 con $10,000.00 pendientes, cuando envío, entonces se rechaza con `capital_mayor_que_pendiente`.
- **CA-54.4** Dado una cuota pagada con tarjeta, cuando la categoría no alcanza, entonces la parte no cubierta suma a "te falta reservar" de esa tarjeta (CB-07).
- **CA-54.5** Dado el préstamo del Anexo A con modelo y la fecha del 15 de febrero de 2027, cuando abro el flujo, entonces el desglose propuesto es interés $101.92, seguro $5.00 y capital $243.08.

**Escenarios.** ESC-39.

**Avisos.** AV-02, AV-03, AV-01.

**Dependencias.** FT-50, FT-55. **[F8]** (CH-07): de datos, FT-55; las demás, de construcción.

#### FT-55 Condiciones y tabla de amortización [M]

**Objetivo.** Registrar las condiciones de un préstamo y ver su tabla de amortización proyectada comparada con lo pagado, sin que eso cambie ningún número del presupuesto.

**Historias.**
- Quiero cargar la tasa, el seguro, la cuota y el plazo de mi préstamo.
- Quiero ver la tabla con cada cuota y si está pagada, parcial, pendiente o atrasada.

**Flujo.**
1. Detalle del préstamo → `/cuentas/[cuentaId]/condiciones` (flujo largo) → OP-48.
2. En el detalle: amortización (con modelo), comparación proyectado frente a pagado y costo financiero.

**Piezas.**
- Operaciones: OP-48.
- Consultas: `formulario` (`cuenta`), `detalleCuenta()` (`prestamo`).
- Rutas: `/cuentas/[cuentaId]/condiciones`.
- Componentes: tabla de amortización con `Monto`, `IndicadorEstado`.

**Reglas.** 01 Anexo A (A.1 contrato y límites; A.2 Banco Agrícola, ⚠ para validar), Q6, P3; 04 OP-48, §6.6.

**Estados.** Sin modelo: la tabla no se muestra, con "Este préstamo no tiene un modelo de cálculo; el capital pendiente es el que registraste." **(nuevo)**. ⚠ El modelo de Banco Agrícola se valida contra un estado de cuenta real.

**Errores y textos.** `conflicto_desactualizado`. Texto nuevo: el de "Estados".

**Criterios de aceptación.**
- **CA-55.1 ⚠** Dado el ejemplo de A.2 (M = $10,000.00, 12 %, seguro $5.00, cuota $350.00, apertura 15 de enero de 2027), cuando abro la tabla, entonces la cuota 1 es interés $101.92, seguro $5.00, capital $243.08 y saldo $9,756.92, y la 2 es $89.82, $4.88, $255.30 y $9,501.62.
- **CA-55.2 ⚠** Dado un abono a capital de $500.00 el 20 de marzo, cuando abro la tabla, entonces la cuota 3 es interés $91.74, seguro $4.50, capital $253.76 y saldo $8,747.86.
- **CA-55.3** Dado cualquier cambio de condiciones, cuando comparo los números del presupuesto antes y después, entonces no cambió ninguno, y el capital pendiente sigue siendo el registrado (A.1).
- **CA-55.4** Dado pagos que suman $346.50 en la cuota 1, cuando abro la tabla, entonces la cuota figura como pagada (≥ 99 % de la cuota, A.2 punto 6).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-50.

#### FT-56 Desembolso de préstamo [P]

**Objetivo.** Registrar el dinero de un préstamo nuevo que llega a una cuenta de efectivo y entra a Listo para asignar como "otras entradas".

**Historias.** Si saco un préstamo nuevo, quiero registrar el desembolso y asignar ese dinero.

**Flujo.** `/registrar/desembolso` (flujo corto) → préstamo, cuenta de efectivo, fecha y monto → OP-26.

**Piezas.**
- Operaciones: OP-26.
- Consultas: `formulario` (`registrar`, `desembolso`).
- Rutas: `/registrar/desembolso`.
- Componentes: `EntradaMonto`, `EntradaFecha`.

**Reglas.** 01 OP-26, H13, §4.13 (otras entradas); un préstamo en curso se crea con su saldo (FT-50, P13).

**Estados.** Sin préstamos: el tipo no se ofrece en `/registrar`.

**Errores y textos.** `cuenta_tipo_no_valido`, `cuenta_archivada`, `fecha_posterior_a_hoy`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-56.1** Dado el paso 0 de ESC-40, cuando registro un desembolso de $5,000.00, entonces LPA es $5,000.00, el capital pendiente $5,000.00 y el patrimonio sigue en $3,000.00 (paso 1).
- **CA-56.2** Dado el desembolso, cuando abro el detalle de LPA, entonces suma a "Otras entradas", no a "Ingresos".
- **CA-56.3** Dado una tarjeta como cuenta de destino, cuando envío, entonces se rechaza con `cuenta_tipo_no_valido`.

**Escenarios.** ESC-40 (paso 1).

**Avisos.** AV-01.

**Dependencias.** FT-50.

#### FT-57 Inversiones: aporte, retiro y ajuste [M]

**Objetivo.** Registrar aportes (que salen de una categoría), retiros (que vuelven a Listo para asignar) y ajustes de valor (sin efecto en el presupuesto) de una inversión.

**Historias.**
- Quiero aportar a mi depósito a plazo desde una categoría que asigno.
- Quiero retirar y que ese dinero vuelva a Listo para asignar.
- Quiero actualizar el valor cuando el banco me informa el rendimiento.

**Flujo.** `/registrar/aporte-inversion`, `/registrar/retiro-inversion` o `/registrar/ajuste-inversion` (flujos cortos) → OP-25.

**Piezas.**
- Operaciones: OP-25.
- Consultas: `formulario` (`registrar`: `aporte_inversion`, `retiro_inversion`, `ajuste_inversion`), `detalleCuenta()` (`inversion`).
- Rutas: `/registrar/aporte-inversion`, `/registrar/retiro-inversion`, `/registrar/ajuste-inversion`.
- Componentes: `EntradaMonto` (`conSigno` en el ajuste), `EntradaFecha`, `Seleccion`.

**Reglas.** 01 OP-25, P3, H13, supuesto 17, §4.13.

**Estados.** Sin inversiones: los tres tipos no se ofrecen.

**Errores y textos.** `retiro_mayor_que_valor`, `valor_inversion_negativo`, `categoria_archivada`, `cuenta_tipo_no_valido`. Sin textos nuevos.

**Criterios de aceptación.**
- **CA-57.1** Dado el paso 1 de ESC-41, cuando aporto $200.00, entonces el efectivo y LPA quedan en $300.00, la categoría en $0.00 y la inversión en $200.00 (paso 2).
- **CA-57.2** Dado el paso 1 de ESC-40, cuando retiro $1,000.00, entonces LPA es $6,000.00 como otras entradas y la inversión vale $2,000.00 (paso 2).
- **CA-57.3** Dado una inversión de $2,000.00, cuando retiro $2,500.00, entonces se rechaza con "La inversión vale $2,000.00."
- **CA-57.4** Dado un ajuste de +$75.60, cuando lo registro, entonces el valor sube y ningún número del presupuesto cambia.

**Escenarios.** ESC-40 (paso 2), ESC-41.

**Avisos.** AV-01.

**Dependencias.** FT-50.

#### FT-58 Modelos de préstamo de otros bancos [P]

**Objetivo.** Agregar modelos de cálculo para préstamos de otras instituciones, con el mismo contrato que el de Banco Agrícola.

**Historias.** Si tengo un préstamo de otro banco, quiero que Finn me proponga su desglose y su tabla.

**Flujo.** Sin pantalla nueva: el modelo nuevo aparece en el selector de modelo de `/cuentas/nueva` y `/cuentas/[cuentaId]/condiciones`, y alimenta FT-54 y FT-55.

**Piezas.**
- Operaciones: OP-48 (elegir el modelo).
- Consultas: `formulario` (`cuenta`: `modelosPrestamo`), `detalleCuenta()`.
- Rutas: `/cuentas/[cuentaId]/condiciones`.
- Componentes: los de FT-55.

**Reglas.** 01 Anexo A.1 (contrato y límites: el modelo nunca cambia hechos ni números del presupuesto), Q6.

**Estados.** Hasta que exista un modelo nuevo, `modelosPrestamo` solo ofrece `banco_agricola`.

**Errores y textos.** Sin errores propios.

**Criterios de aceptación.** Para cuando se implemente:
- **CA-58.1** Dado un modelo nuevo, cuando se agrega, entonces cumple las cinco salidas de A.1 con su propio ejemplo numérico validado contra un estado de cuenta real.
- **CA-58.2** Dado un préstamo que cambia de modelo, cuando comparo los números del presupuesto, entonces no cambió ninguno.
- **CA-58.3** Dado un préstamo con el modelo nuevo y una cuota con registro automático, cuando corre la tarea, entonces se registra con su desglose (QB-1 ya no la rechaza).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-55.

#### FT-59 Proyección de inversiones [P]

**Objetivo.** Mostrar cuánto crecería una inversión según su rendimiento, cuando exista un modelo de proyección aprobado (01 A.3).

**Historias.** Quiero ver cuánto valdrá mi depósito a plazo al vencer.

**Flujo.** Sin pantalla nueva: la proyección se agrega al bloque de inversión del detalle de cuenta.

**Piezas.**
- Operaciones: ninguna.
- Consultas: `detalleCuenta()` (`inversion`).
- Rutas: `/cuentas/[cuentaId]`.
- Componentes: `GraficoLineas` con su tabla.

**Reglas.** 01 Anexo A.3: mientras no haya modelo, solo se muestra el valor (§4.3).

**Estados.** Sin modelo (primera versión): solo el valor, sin proyección.

**Errores y textos.** Sin errores propios.

**Criterios de aceptación.**
- **CA-59.1** Dado la primera versión, cuando abro una inversión, entonces veo su valor, aportes, retiros y ajustes, y ninguna proyección.
- **CA-59.2** Dado un modelo aprobado (para cuando se implemente), cuando abro una inversión con rendimiento esperado, entonces la proyección tiene su tabla equivalente y no cambia ningún número del presupuesto.
- **CA-59.3** Dado un ajuste de valor, cuando abro la inversión, entonces el valor mostrado es aportes − retiros ± ajustes (supuesto 17).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-57.

---

# Parte D

### 2.10 Reportes

Reglas comunes a las fichas de reportes:
- Una consulta por pantalla: `reporte({ tipo, … })` con un `tipo` por ruta (04 §6.9, 3.5.1); las fórmulas son selectores del dominio y la consulta no calcula (FD-09, inv. 27).
- Todo gráfico tiene su tabla equivalente con los mismos datos y un nombre accesible con el dato principal (05 FE-44, P5-13). El cliente no divide montos: porcentajes en puntos básicos y ángulos del servidor (PF-3).
- Filtros de cuentas, grupo y categorías por nombre (CP-12), incluidas las archivadas con actividad en la ventana.
- Cada reporte accionable termina en hallazgos con su acción (FD-17); las propuestas de un toque tienen su salida para revertir (3.6).

#### FT-60 Reportes base (producto §10) [M]

**Objetivo.** Ver la tendencia de ingresos y gastos, en qué se va el dinero, ingresos frente a gastos, lo que quedó de cada período, los comercios donde más gasto, el cumplimiento del presupuesto y el patrimonio, siempre por períodos.

**Historias.**
- Quiero ver los últimos 1, 3, 6 o 12 períodos, o el actual, y filtrar por cuenta.
- Quiero saber en qué categorías se va mi dinero y dónde gasto más.
- Quiero ver cómo evoluciona mi patrimonio, no solo el valor de hoy.

**Flujo.**
1. `/reportes` redirige a `/reportes/tendencia`.
2. `/reportes/[tipo]` con `tendencia`, `categorias`, `ingresos-gastos`, `remanente`, `top-comercios`, `cumplimiento` o `patrimonio` → `reporte()`.
3. Parámetros: `?ventana=`, `?cuentas=`, `?grupo=` (categorías), `?limite=` (top de comercios).
4. Navegación entre reportes con `Pestanas` como enlaces (05 §10.7).

**Piezas.**
- Operaciones: ninguna.
- Consultas: `reporte()` (tipos de 04 §6.9.2).
- Rutas: `/reportes`, `/reportes/[tipo]`.
- Componentes: `GraficoBarras`, `GraficoLineas`, `GraficoDona`, `Monto`, `Pestanas`, `Seleccion`, `EstadoVacio`.

**Reglas.** 04 §6.9.1 y §6.9.2 (BE-40), §6.9.5 (`remanente` no es un flujo de caja), §6.9.6 (BE-43); 01 §4.13 (clasificación), D1, N9, H13, R4 (archivadas con su nombre).

**Estados.** Sin datos en la ventana: "No hay movimientos en estos períodos". `remanente` siempre con el título "Lo que te quedó del período" y su explicación (04 §6.9.5).

**Errores y textos.** Un `[tipo]` fuera de la tabla de 05 §2.10 da `notFound()`; un parámetro inválido se quita (05 §2.2). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-60.1** Dado el paso 4 de ESC-20, cuando abro `ingresos-gastos` del período, entonces los ingresos incluyen $5.00 de excedente y las restituciones ($25.00) aparecen aparte, no como ingreso (D1, N9).
- **CA-60.2** Dado el paso 2 de ESC-40, cuando abro `ingresos-gastos`, entonces "otras entradas" es $6,000.00 e "ingresos" $0.00 (H13).
- **CA-60.3** Dado el paso 1 de ESC-14, cuando abro `tendencia`, entonces el cashback de $30.00 cuenta como ingreso.
- **CA-60.4** Dado `?ventana=ultimos-3` con el período activo a la mitad, cuando abro cualquier reporte, entonces muestra los 3 períodos **cerrados** más recientes, sin el activo.
- **CA-60.5** Dado gastos en 10 categorías, cuando abro `categorias`, entonces la dona muestra 8 porciones más "Otras", los porcentajes suman 10,000 puntos básicos y la tabla lista las 10 con monto y porcentaje.
- **CA-60.6** Dado compras en "SUPER SELECTOS ESCALON" y "SUPER SELECTOS STA ELENA" y la regla "SELECTOS", cuando abro `top-comercios`, entonces aparecen juntas bajo "SELECTOS" con sus dos variantes y montos.
- **CA-60.7** Dado una categoría con Asignado $0.00 y Gastado $20.00, cuando abro `cumplimiento`, entonces su porcentaje es nulo y la diferencia −$20.00.
- **CA-60.8** Dado el paso 4 de ESC-01 al cierre del período, cuando abro `patrimonio`, entonces la serie de ese período tiene neto −$4,300.00 y coincide con la posición neta de Cuentas.
- **CA-60.9** Dado una categoría archivada con gastos en la ventana, cuando abro `categorias`, entonces aparece con su nombre.
- **CA-60.10** Dado `?cuentas=<Visa Oro>`, cuando abro `categorias`, entonces solo cuentan los consumos con efecto en Visa Oro.

**Escenarios.** ESC-01 (paso 4), ESC-14 (paso 1), ESC-20 (paso 4), ESC-40 (paso 2).

**Avisos.** —

**Dependencias.** FT-21, FT-09.

#### FT-61 Gasto semanal [M]

**Objetivo.** Ver cuánto gasto cada semana del período en una o varias categorías, frente a la parte proporcional de lo asignado y a las mismas semanas de los períodos anteriores.

**Historias.**
- Quiero saber si esta semana voy por encima de lo que me toca en Supermercado.
- Quiero comparar con las mismas semanas de los 3 períodos anteriores.

**Flujo.** `/reportes/gasto-semanal?periodo=&categorias=` → `reporte({ tipo: 'gasto_semanal' })`: por semana, gasto, referencia, acumulados y anteriores; `SelectorPeriodo` y selector de categorías.

**Piezas.**
- Operaciones: ninguna.
- Consultas: `reporte()` (`gasto_semanal`).
- Rutas: `/reportes/[tipo]` (`gasto-semanal`).
- Componentes: `GraficoBarras` con `referencia`, `GraficoLineas`, `SelectorPeriodo`, `Seleccion`.

**Reglas.** 04 §6.9.3 (semanas del período, referencia con redondeo acumulado, Asig < 0 → referencia 0), V-22; 3.14 (períodos en que existía la categoría).

**Estados.**
- Semanas futuras del período activo: sin gasto, distinguidas sin color (05 §10.8).
- Asignado negativo: aviso de que la referencia queda en $0.00.
- Categoría nueva (sin períodos anteriores en que existiera): sin comparación, con el aviso de "Categoría nueva".

**Errores y textos.** Sin errores propios. Textos de 05 §2.10 y del diseño.

**Criterios de aceptación.**
- **CA-61.1** Dado un período de 30 días y Asignado $350.00, cuando abro el reporte, entonces hay 5 semanas (7, 7, 7, 7 y 2 días) con referencias $81.67, $81.66, $81.67, $81.67 y $23.33, que suman $350.00, y la referencia acumulada de la semana 4 es $326.67.
- **CA-61.2** Dado Asignado −$20.00, cuando abro el reporte, entonces todas las referencias son $0.00 y se muestra el aviso.
- **CA-61.3** Dado una categoría que existió en 2 de los 3 últimos períodos cerrados, cuando abro la comparación, entonces usa esos 2 y el anterior en que existía (3.14).
- **CA-61.4** Dado hoy el día 25 de 30, cuando abro el período activo, entonces la semana 5 figura como futura, sin barra.
- **CA-61.5** Dado cualquier asignación entre $0.00 y $21,474,836.47 y cualquier duración de período, la suma de las referencias es exactamente lo asignado (prueba de propiedades, V-22).
- **CA-61.6** **[R5]** Dado Supermercado de A.7 (Asignado $350.00, período de 30 días, semana 4 en curso con $35.00 de gasto y $287.15 acumulados), cuando abro el gasto semanal, entonces la referencia de la semana es $81.67, `porcentajeReferenciaBp` 4,286 ("43 % de la referencia") y `diferenciaReferencia` $39.52 ("Vas $39.52 por debajo").
- **CA-61.7** **[R5]** Dado Asignado negativo o $0.00, cuando abro el gasto semanal, entonces `porcentajeReferenciaBp` es nulo y no se muestra el porcentaje; un gasto mayor que la referencia da más de 10,000 sin tope, porque es un texto.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-60.

#### FT-62 Ritmo de gasto y proyección del cierre [M]

**Objetivo.** Avisar antes del cierre qué categorías se van a pasar a este ritmo y cómo terminaría el período, con una acción de un toque para corregirlo.

**Historias.**
- A mitad del período quiero saber si voy a pasarme en Restaurantes y por cuánto.
- Quiero ver cómo cerraría el período si sigo igual: sobregiros, cuánto bajaría Listo para asignar y cuánto me faltaría reservar.
- Quiero corregirlo con un toque.

**Flujo.**
1. `/reportes/ritmo` → `reporte({ tipo: 'ritmo' })`: resumen de la proyección del cierre (3.5.5) y una fila por categoría con su proyección.
2. Hallazgos con su acción: mover (OP-15), asignar (OP-14) o revisar la categoría (3.5.4).
3. En Inicio, los 3 de mayor impacto (FT-08, 3.7).

**Piezas.**
- Operaciones: propuestas OP-15 y OP-14 (3.6).
- Consultas: `reporte()` (`ritmo`, CF-04), `inicio()` (`hallazgosRitmo`, CF-06).
- Rutas: `/reportes/[tipo]` (`ritmo`), `/`.
- Componentes: `Aviso`, `Resultado`, `Monto`, `IndicadorEstado`.

**Reglas.** 3.5.3 (definiciones y umbrales), 3.5.4 (ritmo), 3.5.5 (proyección y reparto por resto mayor, FD-19), 3.6, 3.7; FD-10, FD-11, FD-21.

**Estados.** Antes del día 7 del período o con menos de 3 consumos variables: la categoría figura como "Todavía no hay suficientes compras para proyectar" **(nuevo)**. Período sin hallazgos de ritmo: solo la proyección.

**Errores y textos.** Los de OP-14 y OP-15 al ejecutar la propuesta (por ejemplo `conflicto_desactualizado`). Textos de 3.5.4 y 3.5.5 y el nuevo de "Estados".

**Criterios de aceptación.**
- **CA-62.1** Dado los datos de A.7 (hoy 15/10, 25 días transcurridos y 5 restantes), cuando abro el reporte, entonces Restaurantes proyecta −$55.56 y Gasolina −$38.50, y son los dos únicos hallazgos (V6-01).
- **CA-62.2** Dado los mismos datos, cuando miro la proyección del cierre, entonces dice 2 categorías sobregiradas, Listo para asignar bajaría $50.44, te faltaría reservar $43.62 para Visa Oro y te sobrarían $1,546.64.
- **CA-62.3** Dado los mismos datos, cuando miro el hallazgo de Restaurantes, entonces dice "Ya te pasaste $26.30 en Restaurantes y, a este ritmo, llegarías a $55.56 el 20/10." con la acción "Asignar $55.56"; al tocarla, Asignado de Restaurantes sube $55.56 y aparece "Deshacer".
- **CA-62.4** Dado Netflix con su programada pendiente, cuando abro el reporte, entonces su disponible proyectado es $0.00 y no tiene hallazgo.
- **CA-62.5** Dado Luz y agua con un solo consumo, cuando abro el reporte, entonces no se proyecta.
- **CA-62.6** Dado el mismo estado, cuando comparo el exceso de Restaurantes en el reporte y en Inicio, entonces es el mismo número (error 11).
- **CA-62.7** Para 20,000 estados aleatorios, se cumplen las propiedades de V6-02 (determinismo, exceso ≥ sobregiro actual, monotonía, partes sin negativos, conservación).

**Escenarios.** —

**Avisos.** AV-02, AV-03, AV-11.

**Dependencias.** FT-09, FT-08.

#### FT-63 Presupuesto contra la realidad y comparación con el promedio [M]

**Objetivo.** Mostrar las categorías donde siempre me paso o siempre me sobra, con una sugerencia concreta que se aplica con un toque, y las que este período se alejan de su promedio.

**Historias.**
- Si en los últimos 3 períodos gasté $180 en Supermercado y asigno $150, quiero que Finn me proponga ajustar a $180 y aplicarlo con un toque.
- Quiero ver qué categorías subieron o bajaron mucho frente a mi promedio.

**Flujo.** `/reportes/realidad` → `reporte({ tipo: 'realidad' })`: sección "Presupuesto contra la realidad" (3.5.6) y "Comparación con tu promedio" (3.5.7), con sus hallazgos.

**Piezas.**
- Operaciones: propuestas OP-14 y OP-18 (editar meta) (3.6).
- Consultas: `reporte()` (`realidad`, CF-04).
- Rutas: `/reportes/[tipo]` (`realidad`).
- Componentes: `Aviso`, `Resultado`, `Monto`, tabla por período.

**Reglas.** 3.5.6, 3.5.7, 3.14 (FD-27; exige 3 períodos, FD-29); FD-12, FD-13.

**Estados.** Categoría con menos de 3 períodos en que existía: no se evalúa y lo dice: "Hace falta historia de 3 períodos para comparar." **(nuevo)**.

**Errores y textos.** Los de OP-14 y OP-18 al ejecutar. Textos de 3.5.6 y 3.5.7 y el nuevo de "Estados".

**Criterios de aceptación.**
- **CA-63.1** Dado $150.00 asignados y $180.00, $175.00 y $185.00 gastados en los 3 períodos de comparación, cuando abro el reporte, entonces sugiere ajustar a $180.00; al tocar "Ajustar a $180.00", Asignado del período activo queda en $180.00.
- **CA-63.2** Dado la misma categoría con una meta mensual, cuando toco la propuesta, entonces cambia el monto de la meta a $180.00 y no lo asignado.
- **CA-63.3** Dado los datos de A.7, cuando abro la comparación, entonces Restaurantes va camino a $175.56 frente a un promedio de $111.95 (+56.82 %); como también tiene hallazgo de ritmo, el reporte de hallazgos deja solo el de ritmo (3.5.11).
- **CA-63.4** Dado un fondo con $50.00 asignados y gasto $0.00 en los 3 períodos, cuando abro el reporte, entonces no sugiere bajarlo (3.5.6).
- **CA-63.5** Dado una categoría con 2 períodos de comparación, cuando abro el reporte, entonces no tiene hallazgo (FD-29), aunque la asignación rápida sí ofrezca su promedio (FT-12).

**Escenarios.** —

**Avisos.** AV-11.

**Dependencias.** FT-60, FT-17.

#### FT-64 Gastos hormiga [P]

**Objetivo.** Mostrar las compras pequeñas y frecuentes que, sumadas, representan mucho, por comercio o por categoría.

**Historias.** Quiero saber cuánto se me va en compras chicas de cafeterías este período.

**Flujo.** `/reportes/hormiga?periodo=` → `reporte({ tipo: 'hormiga' })`: grupos y hallazgos; la acción abre Actividad con las compras pequeñas del período en ese comercio o esa categoría (CA-24.3; lo que puede sumar, en 3.5.8) **[R4]**.

**Piezas.**
- Operaciones: ninguna.
- Consultas: `reporte()` (`hormiga`, CF-04).
- Rutas: `/reportes/[tipo]` (`hormiga`), `/actividad`.
- Componentes: `Aviso`, `Monto`, `SelectorPeriodo`.

**Reglas.** 3.5.8 (por comercio y por categoría, deduplicación de compras compartidas, **[R1]**), 3.5.3 (`HORMIGA_MONTO_MAX`, `HORMIGA_CANT_MIN`, `HORMIGA_TOTAL_MIN`); FD-14.

**Estados.** Sin grupos: "No encontramos compras pequeñas repetidas en este período." **(nuevo)**.

**Errores y textos.** Sin errores propios. Textos de 3.5.8 y el de "Estados".

**Criterios de aceptación.**
- **CA-64.1** Dado 12 compras de menos de $10.00 en 12 cafeterías distintas, todas en Cafés y antojos, por $64.08, cuando abro el reporte, entonces hay un solo hallazgo: "12 compras pequeñas en Cafés y antojos este período: $64.08." (V6-02, [R1]).
- **CA-64.2** **[R4]** Dado ese hallazgo, ninguna de esas compras resolvió un pago programado y ninguna otra transacción del período en Cafés y antojos es un gasto de $10.00 o menos, cuando toco "Ver las compras", entonces Actividad muestra exactamente esas 12 compras.
- **CA-64.3** Dado 4 compras pequeñas en un comercio, cuando abro el reporte, entonces no hay hallazgo (`HORMIGA_CANT_MIN` = 5).
- **CA-64.4** Dado un grupo de comercio y uno de categoría que comparten compras, cuando abro el reporte, entonces queda solo el de mayor total; a igual total, el de categoría.
- **CA-64.5** **[R4]** Dado además un pago programado de $9.99 en Cafés y antojos (una ocurrencia emparejada) y una devolución de $3.00 en esa categoría, cuando toco "Ver las compras", entonces Actividad muestra las 12 compras y el pago programado (con su marca de programada), pero no la devolución; el hallazgo sigue diciendo 12 compras y $64.08.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-60, FT-24.

#### FT-65 Suscripciones detectadas [P]

**Objetivo.** Detectar los cobros recurrentes que no están programados, con su costo mensual y anual, y programarlos (o reactivarlos) con un toque.

**Historias.**
- Quiero ver cuánto pago al año por cada suscripción.
- Si Finn detecta una que no tengo programada, quiero programarla con un toque.

**Flujo.** `/reportes/suscripciones` → `reporte({ tipo: 'suscripciones' })`: detectadas con su acción ("Programarla", "Reactivarla" o el flujo `/programadas/nueva` con valores iniciales) y "Ya programadas".

**Piezas.**
- Operaciones: propuestas OP-42 (crear o `activa: true`); salidas OP-51 y OP-42 `activa: false` (3.6).
- Consultas: `reporte()` (`suscripciones`, CF-04).
- Rutas: `/reportes/[tipo]` (`suscripciones`), `/programadas/nueva`.
- Componentes: `Aviso`, `Resultado`, `Monto`.

**Reglas.** 3.5.9 (FD-15, [R1], [R3]); CF-20 (reactivar cuenta desde el día de la reactivación).

**Estados.** Menos de 4 períodos cerrados: "Necesitamos 4 períodos cerrados para detectar suscripciones." **(nuevo)**.

**Errores y textos.** Los de OP-42 al ejecutar. Textos de 3.5.9 y el de "Estados".

**Criterios de aceptación.**
- **CA-65.1** Dado cobros de $15.49 de NETFLIX los días 17, 17 y 18 en 3 de los últimos 4 períodos cerrados y ninguna programada, cuando abro el reporte, entonces detecta Netflix con $15.49 al mes y $185.88 al año.
- **CA-65.2** Dado esa detección, cuando toco "Programarla", entonces se crea una programada mensual de $15.49 con la cuenta y la categoría de la última transacción, sin registro automático; "Deshacer" la elimina (OP-51).
- **CA-65.3** Dado una programada desactivada de Netflix, cuando abro el reporte, entonces la acción es "Reactivarla" y, al tocarla, la programada vuelve a estar activa sin atrasadas del tiempo inactivo (CF-20).
- **CA-65.4** Dado cobros en solo 2 de 4 períodos, cuando abro el reporte, entonces no se detecta.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-40, FT-60.

#### FT-66 Tarjetas en el tiempo [M]

**Objetivo.** Responder si pago el total de cada tarjeta o arrastro deuda, ciclo por ciclo, con cuánto cargo y pago por período.

**Historias.** Quiero saber si estoy pagando el total de mis tarjetas o si me quedó deuda que genera intereses.

**Flujo.** `/reportes/tarjetas?ventana=` → `reporte({ tipo: 'tarjetas' })`: por tarjeta, ciclos (deuda del estado, pagado o acreditado a tiempo, arrastre) y períodos (cargos, pagos, deuda al fin), con su hallazgo.

**Piezas.**
- Operaciones: propuesta OP-14 sobre pago(t) ("Reservar {S}"); enlace a OP-23.
- Consultas: `reporte()` (`tarjetas`, CF-04).
- Rutas: `/reportes/[tipo]` (`tarjetas`), `/cuentas/[cuentaId]/pagar`.
- Componentes: `GraficoBarras` con su tabla, `Aviso`, `Resultado`.

**Reglas.** 3.5.10 (FD-16, [R1]: "pagado a tiempo" = "ya pagado" de 01 §4.14 con f = fecha de pago); 01 §4.14 y supuesto 19.

**Estados.** Todos los ciclos en $0.00 de arrastre: "Con {tarjeta} pagás el total cada mes." (informativo, sin hallazgo).

**Errores y textos.** Los de OP-14 al ejecutar. Textos de 3.5.10.

**Criterios de aceptación.**
- **CA-66.1** Dado un corte con deuda de $500.00 y, antes de la fecha de pago, un pago de $300.00 y una devolución de $50.00 en la tarjeta, cuando abro el reporte, entonces "Pagado o acreditado a tiempo" es $350.00 y el arrastre $150.00, con el hallazgo de ese corte.
- **CA-66.2** Dado un ciclo cuya fecha de pago todavía no pasó, cuando abro el reporte, entonces no figura entre los ciclos evaluados.
- **CA-66.3** Dado un arrastre y "te falta reservar" de $80.00, cuando toco "Reservar $80.00", entonces Asignado de la categoría de pago sube $80.00 y "te falta reservar" queda en $0.00.
- **CA-66.4** Dado un día de pago 31 y un mes de 30 días, cuando se calcula la fecha de pago, entonces es el día 30 (supuesto 19).

**Escenarios.** —

**Avisos.** AV-07.

**Dependencias.** FT-29, FT-30, FT-60.

#### FT-67 Hallazgos accionables [M]

**Objetivo.** Juntar en una lista corta, ordenada por impacto, lo que vale la pena ajustar este período, cada cosa con su acción.

**Historias.** Quiero una sola pantalla que me diga qué ajustar y que me deje hacerlo ahí mismo.

**Flujo.** `/reportes/hallazgos` → `reporte({ tipo: 'hallazgos' })`: hasta 5 hallazgos, uno por clave, con su propuesta de un toque o su enlace.

**Piezas.**
- Operaciones: propuestas OP-14, OP-15, OP-18 y OP-42 (3.6).
- Consultas: `reporte()` (`hallazgos`, CF-04).
- Rutas: `/reportes/[tipo]` (`hallazgos`).
- Componentes: `Aviso`, `Resultado`, `IndicadorEstado`.

**Reglas.** 3.5.2 y 3.5.11 (una fila por clave, impacto, orden, `HALLAZGOS_MAX`), 3.6 (propuestas y salidas); FD-17, FD-20.

**Estados.** Sin hallazgos: "Todo en orden: no encontramos nada que ajustar este período." (3.5.11).

**Errores y textos.** Los de la operación de cada propuesta. Textos de 3.5.

**Criterios de aceptación.**
- **CA-67.1** Dado 8 hallazgos posibles en 6 claves, cuando abro el reporte, entonces muestra 5, uno por clave, ordenados por impacto descendente.
- **CA-67.2** Dado los datos de A.7, cuando abro el reporte, entonces Restaurantes aparece una sola vez, con el hallazgo de ritmo y su acción de un toque.
- **CA-67.3** Dado una propuesta ejecutada, cuando toco su salida para revertir, entonces vuelve el valor anterior y el hallazgo reaparece.
- **CA-67.4** Para 5,000 listas aleatorias de hallazgos, el resultado tiene como máximo 5, sin claves repetidas y en orden de impacto (V6-02).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-62 a FT-66.

#### FT-68 Flujo de efectivo [P]

**Objetivo.** Mostrar cuánto cambió el dinero de las cuentas de efectivo en cada período y por qué, como complemento de "Lo que te quedó del período".

**Historias.** Quiero entender por qué mi cuenta bajó menos de lo que gasté: cuánto fue con tarjeta y cuánto pagué de tarjetas.

**Flujo.** `/reportes/flujo-efectivo?ventana=&cuentas=` → `reporte({ tipo: 'flujo_efectivo' })`: saldo inicial, filas, saldo final y compras con tarjeta del período, con su hallazgo.

**Piezas.**
- Operaciones: propuesta OP-14 sobre pago(t) ("Reservar {S} para {tarjeta}").
- Consultas: `reporte()` (`flujo_efectivo`, CF-02).
- Rutas: `/reportes/[tipo]` (`flujo-efectivo`).
- Componentes: tabla de filas con `Monto`, `GraficoBarras`, `Aviso`.

**Reglas.** 3.3 (FD-07): una fila por efecto según su tipo; identidad saldo inicial + Σ filas = saldo final (V6-03).

**Estados.** Con filtro de cuentas que deja fuera una de las dos cuentas de una transferencia: aparece la fila de transferencias.

**Errores y textos.** Sin errores propios. Textos de 3.3.

**Criterios de aceptación.**
- **CA-68.1** Para cualquier estado y ventana, saldo inicial + Σ filas = saldo final en cada período (V6-03).
- **CA-68.2** Dado una transferencia de $200.00 entre dos cuentas de efectivo, cuando abro el reporte sin filtro, entonces no aparece en ninguna fila; filtrando solo la cuenta de origen, aparece como −$200.00 en "transferencias".
- **CA-68.3** Dado $400.00 en compras con tarjeta, $250.00 pagados de tarjeta en el período activo y "te falta reservar" de $150.00, cuando abro el reporte, entonces termina con "Reservar $150.00 para {tarjeta}".

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-60.

---

### 2.11 Notificaciones

#### FT-69 Centro de notificaciones [M]

**Objetivo.** Ver en un solo lugar las notificaciones de Finn, abrir cada una en la pantalla donde se resuelve y marcarlas como leídas.

**Historias.**
- Quiero ver lo que Finn me avisó, también si no tengo activadas las notificaciones del teléfono.
- Al tocar una, quiero llegar a donde se resuelve y que quede leída.
- Quiero marcar todo como leído.

**Flujo.**
1. Campana del marco con `notificacionesNoLeidas` del `Encabezado`.
2. `/notificaciones?no-leidas=1&cursor=` → `notificaciones()`. Desde la campana, se presenta como panel sobre la pantalla de origen (P6-24, CF-23) **[R4]**.
3. Tocar una → su destino con `?notificacion=` (05 §3.5), que la marca leída (OPT-04).
4. [1T] "Marcar todo como leído" (OPT-04 `todas`).

**Piezas.**
- Operaciones: OPT-04.
- Consultas: `notificaciones()`.
- Rutas: `/notificaciones`; los destinos de 05 §3.5.
- Componentes: lista de notificaciones, `Insignia`, `Resultado`, `Superpuesto` (P6-24), `EstadoVacio`.

**Reglas.** 04 §11.1 (el registro es la fuente de verdad), §6.12.5, §11.4 (destinos); 05 §3.5 (FE-32), §2.9; P6-24 (CF-23) y P6-25 (CF-24), resueltas en 0.15 **[R4]**.

**Estados.** Sin notificaciones: "No tenés notificaciones". Destino que ya no existe: sin enlace y con "Esto ya no existe".

**Errores y textos.** Si OPT-04 falla al abrir, no se muestra error (05 §3.5). Texto nuevo del pie: el de P6-25.

**Criterios de aceptación.**
- **CA-69.1** Dado 3 notificaciones sin leer, cuando abro cualquier pantalla, entonces la campana dice "Notificaciones, 3 sin leer" como nombre accesible.
- **CA-69.2** Dado una notificación `registro_automatico`, cuando la toco, entonces abro `/actividad/[transaccionId]?notificacion=<id>`, queda leída, el parámetro desaparece de la URL sin agregar una entrada al historial y la campana baja a 2.
- **CA-69.3** Dado una notificación de una transacción eliminada, cuando abro el centro, entonces se muestra sin enlace con "Esto ya no existe".
- **CA-69.4** Dado "Marcar todo como leído", cuando lo toco, entonces la campana desaparece y `?no-leidas=1` queda vacío.
- **CA-69.5** **[R4]** Dado que estoy en Presupuesto, cuando toco la campana, entonces se abre el panel sobre Presupuesto, la URL es `/notificaciones` y al cerrar vuelvo a Presupuesto sin recargarlo; abriendo `/notificaciones` directamente, se ve como página completa.
- **CA-69.6** Dado un destino que no valida con el contrato, cuando toco la notificación, entonces se queda en el centro.

**Escenarios.** —

**Avisos.** AV-01, AV-17, AV-23.

**Dependencias.** FT-01.

#### FT-70 Push de la bandeja con acciones [M]

**Objetivo.** Avisar en el teléfono de cada SMS nuevo, agrupando las ráfagas, y permitir confirmar o rechazar una coincidencia desde la notificación.

**Historias.**
- Quiero enterarme en el momento cuando llega una compra por revisar.
- Si llegan muchas juntas, quiero una sola notificación.
- Si una compra coincide con un pago programado, quiero confirmarla desde la notificación.

**Flujo.**
1. Después del `COMMIT` del procesamiento (FT-34): registro en `notificaciones` y push según 04 §11.2.
2. Más de 3 notificaciones `sms_*` en 5 minutos: un push agregado "Tenés N movimientos nuevos en la bandeja" que reemplaza a los anteriores (04 §11.3).
3. `sms_coincidencia`: acciones "Confirmar" y "Rechazar" → `POST /api/notificaciones/accion` (OP-40).
4. Tocar la notificación: el movimiento en la Bandeja (05 §3.5).

**Piezas.**
- Operaciones: OP-40 (por `POST /api/notificaciones/accion`).
- Consultas: `notificaciones()`.
- Rutas: `POST /api/notificaciones/accion`; `/bandeja/[movimientoId]`.
- Componentes: el service worker (05 §8.6).

**Reglas.** 04 §11.2 a §11.6 (BE-53, BE-54), ADR-12 (contenido mínimo), 05 FE-57; CP-18 (`etiqueta`).

**Estados.** Permiso no concedido: el push no se envía; la notificación queda en el centro (FT-06, FT-69).

**Errores y textos.** Respuestas del Route Handler: 200, 401, 409 o 422 (04 §11.5). Textos de 04 §11.4.

**Criterios de aceptación.**
- **CA-70.1** Dado un SMS de compra en SUPER SELECTOS por $45.00, cuando se procesa, entonces se registra una notificación y el push dice "Compra en SUPER SELECTOS por $45.00. Revisala en la bandeja.", sin el texto del SMS ni saldos.
- **CA-70.2** Dado 5 SMS en 3 minutos, cuando llega el quinto, entonces el dispositivo muestra una sola notificación agregada y el centro tiene 5 registros.
- **CA-70.3** Dado una coincidencia, cuando toco "Confirmar" con la sesión vigente, entonces se ejecuta OP-40 y aparece "Listo"; sin sesión, se abre `/bandeja`; si el movimiento cambió (409), se abre `/bandeja/[movimientoId]`.
- **CA-70.4** Dado una petición a `/api/notificaciones/accion` sin la cabecera `X-Finn-Accion` o desde otro origen, cuando llega, entonces se rechaza.
- **CA-70.5** Dado una suscripción que el servicio responde 410, cuando se intenta un push, entonces la suscripción se elimina y la notificación queda en el centro.
- **CA-70.6** Dado un SMS autodescartado, cuando se procesa, entonces no hay notificación.
- **CA-70.7 (manual)** La entrega real del push en Android y en un iPhone con la app instalada (05 §8.8).
  - **[F7]** **CT-03.** Rige: "La entrega real del push en Android con la app instalada (05 §8.8)". iPhone: riesgo aceptado (P7-9). Procedimiento PRU-MAN-NOTIF-001 (`07-pruebas.md` §22).

**Escenarios.** —

**Avisos.** AV-23.

**Dependencias.** FT-06, FT-34, FT-69.

#### FT-71 Push de programadas, cierre, metas, tarjetas y sistema [M]

**Objetivo.** Avisar de lo que pasa sin que el usuario abra la app: registros automáticos y sus fallos, el cierre del período, metas vencidas, el pago próximo de una tarjeta y los problemas del sistema.

**Historias.**
- Quiero enterarme cuando se registró solo un pago o cuando no se pudo.
- Quiero un resumen al cerrar el período.
- Quiero un recordatorio antes de la fecha de pago de mi tarjeta.
- **[R4]** Quiero un recordatorio antes de la cuota de un préstamo que pago a mano.
- Si el respaldo se atrasa, quiero saberlo.

**Flujo.** La tarea diaria (04 §10.2, pasos 1, 3 y 4), la puesta al día (`cuota_proxima`, 3.16) y las operaciones registran la notificación y envían el push según 04 §11.2, con los destinos de 04 §11.4, CF-07 y CF-24 **[R4]**.

**Piezas.**
- Operaciones: OP-43 (automático); tarea diaria; registro de `pago_tarjeta_proximo` (3.8) y de `cuota_proxima` (3.16, **[R4]**).
- Consultas: `notificaciones()`.
- Rutas: los destinos de 05 §3.5, más `/cuentas/[cuentaId]` (CF-07) y `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (`cuota_proxima`).
- Componentes: el service worker.

**Reglas.** 04 §11.2 (política por motivo), §10.2, BE-51 (un solo push de cierre), BE-38 (cambio retroactivo sin push); 3.8 (FD-22, CF-07); 3.16 (CF-24, **[R4]**); FD-31 (montos en el push); CF-16 (`aviso` nulo); P6-25 (opción b).

**Estados.** Sin horario de silencio (P4-11).

**Errores y textos.** Textos de 04 §11.4 y los de 3.8 y 3.16.

**Criterios de aceptación.**
- **CA-71.1** **[R4]** Dado el cierre de un período con $50.00 de reducción por sobregiros y una meta vencida, cuando corre la tarea, entonces hay un solo push, con el texto del ejemplo de 04 §11.4 (la reducción aplicada al cierre puede ir en el push, FD-31): "Cerró el período del 21/09 al 20/10. Listo para asignar bajó $50.00 por sobregiros. Una meta venció.", con destino Presupuesto de ese período.
- **CA-71.2** Dado que la tarea corre dos veces el mismo día, cuando ya se envió el push de cierre, entonces no se envía otro (clave `cierre:<inicio>`).
- **CA-71.3** Dado una meta vencida, cuando corre la tarea varios días, entonces se notifica una sola vez por meta y fecha objetivo.
- **CA-71.4** Dado el respaldo sin correr hace 37 horas, cuando corre la tarea, entonces se envía `respaldo_atrasado` con destino Ajustes > Diagnóstico.
- **CA-71.5** Dado un cambio retroactivo confirmado, cuando miro el teléfono, entonces no hubo push; la notificación está en Inicio y en el centro.
- **CA-71.6** **[R4]** Dado la prueba de catálogo de CF-16, cuando inserta una notificación de cada uno de los 18 motivos (incluidos `pago_tarjeta_proximo` y `cuota_proxima`), entonces todas se aceptan (V6-04).
- **CA-71.7** Dado `pago_tarjeta_proximo`, cuando lo recibo, entonces el push no tiene montos y abre la tarjeta (CA-33.3 a CA-33.5).
- **CA-71.8** **[R4]** Dado una programada de cuota de $210.00 del Préstamo personal, sin registro automático, con ocurrencia pendiente el 20/10 y hoy 17/10, cuando corre la tarea, entonces se registra una notificación `cuota_proxima` con `aviso` nulo y el push dice "Cuota de Préstamo personal por $210.00 el 20/10. Registrala cuando la pagues.", con la etiqueta `programadas`.
- **CA-71.9** **[R4]** Dado el caso anterior, cuando la tarea corre dos veces el mismo día, o la puesta al día corre después de la tarea, o la tarea corre otra vez el 18/10, entonces sigue habiendo una sola notificación para esa programada y esa fecha.
- **CA-71.10** **[R4]** Dado la misma cuota con registro automático, cuando corre la tarea el 17/10, entonces no hay notificación `cuota_proxima` (si el registro falla, llega `registro_automatico_fallido`).
- **CA-71.11** **[R4]** Dado que la ocurrencia del 20/10 ya está registrada (con un toque) o emparejada con un SMS, u omitida, cuando corre la tarea el 17/10, entonces no hay notificación.
- **CA-71.12** **[R4]** Dado una programada de cuota desactivada el 1/09 y reactivada el 18/10, con una ocurrencia del 20/09 sin resolver, cuando corre la tarea, entonces no se notifica la del 20/09 (anterior a `reactivada_desde`, CF-20) y sí la del 20/10 si faltan 3 días o menos.
- **CA-71.13** **[R4]** Dado la notificación de CA-71.8, cuando la toco, entonces abro `/programadas/[programadaId]/ocurrencias/[fechaEsperada]?notificacion=<id>` con la fecha 2026-10-20, queda leída y puedo registrar la cuota con un toque (FT-41).
- **CA-71.14** **[R4]** Dado una ocurrencia del 20/10 y hoy 21/10 sin notificación previa (la app no se usó), cuando corre la tarea, entonces no se envía `cuota_proxima`: la cuota figura como pago atrasado en Inicio.

**Escenarios.** ESC-50.

**Avisos.** AV-17, AV-23.

**Dependencias.** FT-06, FT-42, FT-16, FT-33, FT-40, FT-76.

---

### 2.12 Ajustes y seguridad

#### FT-72 Cambiar el ciclo [M]

**Objetivo.** Cambiar el día de inicio de los períodos sin redefinir ningún período con asignaciones, viendo antes desde qué fecha aplica y el período de transición.

**Historias.** Si cambia la fecha de corte de mi tarjeta, quiero mover el inicio de mis períodos y saber desde cuándo rige.

**Flujo.** `/ajustes/ciclo` (flujo corto) → `ajustes()` (día vigente y vigencia futura) → nuevo día → previsualizar AV-12 (fecha desde la que rige y período de transición) → confirmar siempre → OP-19.

**Piezas.**
- Operaciones: OP-19.
- Consultas: `ajustes()`.
- Rutas: `/ajustes/ciclo`.
- Componentes: `Seleccion`, `ConfirmacionImpacto`.

**Reglas.** 01 OP-19, §4.2 (punto 9), M5, Q5, inv. 21, CB-12, CB-13; 04 OP-19 (una vigencia futura que todavía no rige se reemplaza).

**Estados.** Con una vigencia futura: se muestra con su fecha y el día que fijará.

**Errores y textos.** `ciclo_sin_cambio`. Texto de AV-12 del catálogo del servidor.

**Criterios de aceptación.**
- **CA-72.1** Dado el estado de ESC-45 (hoy 10 de noviembre de 2027, asignaciones hasta el período 21 nov – 20 dic), cuando cambio el día a 1, entonces AV-12 dice que rige desde el 21 de diciembre con un período de transición del 21 al 31 de diciembre (11 días); al confirmar, Listo para asignar y los Disponibles no cambian.
- **CA-72.2** Dado el contraste del paso 1′ de ESC-45 (el período 21 dic – 20 ene también con asignaciones), cuando cambio a 1, entonces rige desde el 21 de enero.
- **CA-72.3** Dado el período de transición de 11 días, cuando abro una meta semanal de $50.00, entonces pide $78.57; una mensual de $200.00 pide $200.00 (paso 2 de ESC-45, ESC-36).
- **CA-72.4** Dado el día vigente 21, cuando elijo 21, entonces se rechaza con "El ciclo ya empieza el día 21."
- **CA-72.5** Dado que el impacto en dinero es nulo, cuando cambio el ciclo, entonces igual se pide confirmar.
- **CA-72.6** Dado el día 31, cuando se generan los períodos de febrero, entonces el período empieza el último día del mes (CB-13).

**Escenarios.** ESC-45, ESC-36.

**Avisos.** AV-12.

**Dependencias.** FT-09.

#### FT-73 Formatos bancarios e instituciones [M]

**Objetivo.** Ajustar sin desplegar cómo Finn lee los SMS de cada banco: crear, editar, probar y desactivar formatos, con una política que rechaza los patrones lentos y una auditoría de cada cambio.

**Historias.**
- Si el banco cambia el texto de sus SMS, quiero corregir el formato y probarlo contra un SMS real que no se reconoció.
- Quiero agregar una institución nueva.

**Flujo.**
1. `/ajustes/formatos` (lista con usos y último uso) → `/ajustes/formatos/nuevo` o `/ajustes/formatos/[formatoId]` (flujos largos) → OPT-05, con OPT-06 para probar contra uno de los 20 SMS recientes no reconocidos o con error.
2. `/ajustes/instituciones` → `/ajustes/instituciones/nueva` o `/ajustes/instituciones/[institucionId]` → OPT-07.
3. Después de corregir un formato, los SMS no reconocidos se pueden reprocesar desde la Bandeja (FT-38).

**Piezas.**
- Operaciones: OPT-05, OPT-06, OPT-07.
- Consultas: `ajustes()`, `formulario` (`formato`).
- Rutas: `/ajustes/formatos`, `/ajustes/formatos/nuevo`, `/ajustes/formatos/[formatoId]`, `/ajustes/instituciones`, `/ajustes/instituciones/nueva`, `/ajustes/instituciones/[institucionId]`.
- Componentes: `EntradaTexto`, `Seleccion`, `Casilla`, resultado de la prueba con los grupos capturados.

**Reglas.** 04 §8.5 (BE-46: compila, banderas, grupos obligatorios, grado de retroceso ≤ 2), §8.7 (auditoría BE-47, nunca se eliminan), PR-2, QC-3; 01 P20; S6-1 (muestras reales).

**Estados.** Formato inactivo: marcado y fuera de la interpretación. Borrador (05 §4.11).

**Errores y textos.** `patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios`, `patron_lento` (04 §8.5), `nombre_repetido` (institución). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-73.1** Dado un patrón con grado de retroceso 3 (como los de 03 §9.5), cuando lo guardo, entonces se rechaza con `patron_lento`, el grado y la cadena de ataque.
- **CA-73.2** Dado un patrón sin el grupo `monto`, cuando lo guardo, entonces se rechaza con `grupos_obligatorios`.
- **CA-73.3** Dado un SMS no reconocido, cuando pruebo un formato en edición contra él, entonces veo los grupos capturados y qué normalizador falló, sin guardar nada.
- **CA-73.4** Dado que edito un formato, cuando miro `eventos_sistema`, entonces hay una fila `auditoria_formato` con el antes y el después, que no se purga a los 90 días.
- **CA-73.5** Dado un formato desactivado, cuando llega un SMS que solo él reconocía, entonces queda como no reconocido.
- **CA-73.6 ⚠ (S6-1)** Con las muestras reales, cada formato reescrito pasa la política y reconoce sus muestras (QC-3).

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-34.

#### FT-74 Factores y sesiones [M]

**Objetivo.** Administrar los factores TOTP (agregar uno de respaldo, quitar uno) y las sesiones, sin poder quedarse sin factores.

**Historias.**
- Quiero agregar un segundo factor por si pierdo el teléfono.
- Quiero cerrar las sesiones de otros dispositivos.
- Quiero salir de este dispositivo.

**Flujo.**
1. `/ajustes/seguridad` → `ajustes()` + `estadoSeguridad()`: factores (nombre, alta, estado) y acciones.
2. `/ajustes/seguridad/factores/nuevo` (flujo largo): inscripción de 05 §9.5 con el nombre "Respaldo".
3. `/ajustes/seguridad/factores/[factorId]/quitar` (flujo corto): solo si queda otro verificado.
4. [1T] "Cerrar las otras sesiones"; "Salir".

**Piezas.**
- Operaciones: `iniciarInscripcion()`, `completarInscripcion()`, `quitarFactor()`, `cerrarOtrasSesiones()`, `salir()` (CP-11).
- Consultas: `ajustes()`, `estadoSeguridad()` (CP-4).
- Rutas: `/ajustes/seguridad`, `/ajustes/seguridad/factores/nuevo`, `/ajustes/seguridad/factores/[factorId]/quitar`.
- Componentes: los de 05 §9.5 y §9.6.

**Reglas.** 02 ADR-08; 04 §12.2, §12.6 (recuperación); 05 §9.5 a §9.7.

**Estados.** Factor sin verificar: "Inscripción sin terminar", con "Quitar". Único factor verificado: "Quitar" explica que se necesita otro antes.

**Errores y textos.** `factor_unico`, `codigo_incorrecto`, `codigo_vencido` (05 §9.7). Sin textos nuevos.

**Criterios de aceptación.**
- **CA-74.1** Dado un solo factor verificado, cuando intento quitarlo, entonces el flujo dice "Agregá otro factor antes de quitar este." con el enlace a agregarlo, y `quitarFactor()` responde `factor_unico`.
- **CA-74.2** Dado dos factores, cuando quito uno, entonces queda el otro y la sesión sigue en AAL2.
- **CA-74.3** Dado otra sesión abierta, cuando toco "Cerrar las otras sesiones", entonces esa sesión pide ingresar de nuevo y esta sigue.
- **CA-74.4** Dado que salgo, cuando vuelvo a abrir Finn, entonces pide ingresar, los borradores de la pestaña se borraron y la suscripción push del dispositivo sigue registrada.

**Escenarios.** —

**Avisos.** —

**Dependencias.** FT-02.

#### FT-75 Exportar [M] — ficha abreviada

**Objetivo.** Descargar las transacciones y el presupuesto en JSON y CSV.

**Referencias.** OPT-08; 05 §2.11 (`/ajustes/exportar`, descargas por `GET /api/exportar/{json|csv}`); FD-25 (las exportaciones usan el guion normal, no U+2212); consulta `ajustes()` (`exportaciones`).

**Criterios de aceptación.**
- **CA-75.1** Dado transacciones con montos negativos, cuando descargo el CSV, entonces los negativos llevan el guion `-` y no U+2212 (FD-25).
- **CA-75.2** Dado la descarga JSON, cuando la vuelvo a leer, entonces los montos están en centavos enteros y cada transacción tiene sus líneas y efectos.
- **CA-75.3** Dado una sesión AAL1 o sin sesión, cuando pido `/api/exportar/csv`, entonces se rechaza.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01.

#### FT-76 Respaldo y diagnóstico [M] — ficha abreviada

**Objetivo.** Ver si el respaldo y la prueba de restauración están al día, revisar los últimos eventos del sistema y ejecutar las tareas a mano.

**Referencias.** 04 §16 (respaldo nocturno en GitHub Actions, OPT-09), §10.1 ("Ejecutar tareas ahora"), §7.8 (`idError`); 05 §2.11 (`/ajustes/respaldo`, `/ajustes/diagnostico`); consulta `ajustes()` (`respaldo`, `diagnostico`).

**Criterios de aceptación.**
- **CA-76.1** Dado el último respaldo hace más de 36 h, cuando abro `/ajustes`, entonces el índice dice "Respaldo atrasado" y `/ajustes/respaldo` muestra la fecha del último.
- **CA-76.2** Dado la última restauración hace más de 35 días, cuando abro `/ajustes/respaldo`, entonces se marca como atrasada.
- **CA-76.3** Dado un error con su referencia, cuando la busco en `/ajustes/diagnostico`, entonces encuentro el evento entre los 50 últimos.
- **CA-76.4** Dado que toco "Ejecutar tareas ahora", cuando termina, entonces hay un evento `tarea_diaria` nuevo y una segunda ejecución inmediata no duplica ningún hecho (04 §10.3).

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01, FT-42.

#### FT-77 Apariencia [P] — ficha abreviada

**Objetivo.** Elegir tema claro, oscuro o el del sistema en cada dispositivo.

**Referencias.** 05 §2.11 (`/ajustes/apariencia`, next-themes, sin escritura en el servidor), §10.6; CF-10 (atributo `data-theme` con `claro` y `oscuro`, R-1); 3.15 (mismo mecanismo de preferencia del dispositivo que "Ocultar por ahora").

**Criterios de aceptación.**
- **CA-77.1** Dado ninguna elección, cuando abro Finn, entonces sigue el tema del sistema.
- **CA-77.2** Dado que elijo "Oscuro", cuando recargo, entonces `<html>` tiene `data-theme="oscuro"` y no hay destello del tema claro al cargar.
- **CA-77.3** Dado el tema elegido en un dispositivo, cuando abro Finn en otro, entonces este sigue con su propio tema.

**Escenarios.** — **Avisos.** —

**Dependencias.** FT-01.

---

# Parte E

## 4. Recorridos de punta a punta

Cada recorrido encadena las features en el orden en que el usuario las vive. Sirven a la Fase 7 como pruebas de punta a punta (Playwright, 05 §14) y como revisión de que las fichas encajan entre sí. Formato de cada paso: **acción → pantalla → operación o consulta → resultado verificable**. Los números salen de los escenarios de 01 §8; donde un paso repite un criterio, se cita.

### 4.1 Primer uso

**Precondición:** base recién sembrada (03 §9), un usuario permitido en Supabase Auth sin factores, la app instalada o en el navegador del teléfono. Hoy: 5 de febrero de 2027 (como ESC-01).

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | Abre Finn | `/` → `/ingresar` | `estadoAcceso()` | Pide email y contraseña (CA-01.1) | FT-01 |
| 2 | Ingresa | `/ingresar/inscribir` | `ingresar()`, `iniciarInscripcion()` | QR y secreto; nada en el almacenamiento del navegador (CA-02.2) | FT-02 |
| 3 | Escribe el código | `/` | `completarInscripcion()` | AAL2; recomienda un factor de respaldo (CA-02.3) | FT-02 |
| 4 | Mira Inicio | `/` | `inicio()` (`primerosPasos`) | Primeros pasos con 3 pasos sin marcar, sin "Ocultar por ahora" (CA-04.1) | FT-04, FT-08 |
| 5 | "Crear una cuenta": Ahorro con $1,000.00 | `/cuentas/nueva` | OP-01 | LPA $1,000.00 (paso 1 de ESC-01) | FT-50 |
| 6 | Crea la tarjeta T con deuda $300.00 | `/cuentas/nueva?tipo-cuenta=tarjeta` | OP-01 | AV-07: te falta reservar $300.00; "Pago T" en "Pagos de tarjeta" (CA-50.1, CA-50.6) | FT-50, FT-29 |
| 7 | "Crear las categorías" → lista sugerida; quita "Educación" | `/presupuesto/estructura/plantilla` | OP-07 en lote, 4 tandas | 10 grupos y 34 categorías; el paso queda marcado (CA-04.3, CA-04.8) | FT-04, FT-18 |
| 8 | "Conectar los SMS" → genera el token y lo pega en MacroDroid | `/ajustes/webhook` | OPT-01 | Token visible una sola vez (CA-03.1); los Primeros pasos desaparecen (CA-04.12) | FT-03 |
| 9 | Prueba en el teléfono (04 §8.8) | `/bandeja` | `POST /api/sms` (OP-35) | El SMS de prueba aparece como no reconocido (CA-03.3, CA-03.5) | FT-03, FT-34, FT-38 |
| 10 | Toca "Activar notificaciones" y acepta | `/` | OPT-02 | Suscripción registrada; la tarjeta desaparece (CA-06.2) | FT-06 |
| 11 | Asigna $300.00 a Pago T | `/presupuesto/asignar/[categoriaId]` | OP-14 | LPA $700.00; te falta reservar $0.00 (paso 3 de ESC-01) | FT-10, FT-29 |

**Se verifica de punta a punta:** el usuario llega de una base vacía a un presupuesto usable sin tocar Ajustes salvo el token, y la identidad de saldo se cumple en cada paso (CA-09.7).

### 4.2 Un día típico

**Precondición:** el estado de A.7 del diseño (período 21/09 – 20/10/2026, hoy 15/10) con Visa Oro, una cuenta de ahorro y las categorías de A.7.
**[F7]** **CT-07.** La precondición es la semilla `estado-a7` **antes del paso 3**: SUPER SELECTOS no existe todavía; el paso 1 lo crea como movimiento pendiente y el paso 3 lo aprueba. Los números de 3.5.12 valen después del paso 3. Detalle en `07-pruebas.md` §12.4 y §28.

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | Paga en SUPER SELECTOS con Visa Oro | (teléfono) | `POST /api/sms` (OP-35) | Movimiento pendiente con Supermercado sugerido por regla; push "Compra en SUPER SELECTOS…" (CA-34.10, CA-70.1) | FT-34, FT-70 |
| 2 | Toca la notificación | `/bandeja/[movimientoId]?notificacion=` | `formulario` (`movimiento`) | La notificación queda leída (CA-69.2) | FT-69 |
| 3 | Vuelve a la lista y toca "Aprobar" | `/bandeja` | OP-37 | "Aprobado: … · Supermercado", sin "Deshacer" (CA-35.1) | FT-35 |
| 4 | Llega FARMACIA sin categoría; lo arrastra a Farmacia | `/bandeja` | OP-37 `{ categoriaId }` | Aprobado en una sola operación (CA-78.1) | FT-78 |
| 5 | Abre Inicio | `/` | `inicio()` | Hallazgo de ritmo de Restaurantes: "Ya te pasaste $26.30…, llegarías a $55.56 el 20/10." (CA-62.3, CA-08.6) | FT-08, FT-62 |
| 6 | Toca "Asignar $55.56" | `/` | OP-14 (propuesta) | Restaurantes sube $55.56; "Deshacer" disponible (CA-62.3) | FT-62, FT-10 |
| 7 | Registra un almuerzo en efectivo de $8.50, mitad por cobrar a Carlos | `/registrar/gasto` | OP-20 | En camino +$4.25 (CA-21.3 con estos montos) | FT-21, FT-45 |
| 8 | Busca "selectos" en Actividad | `/actividad?texto=selectos` | `actividad()` | Aparece la compra del paso 3 (CA-24.1) | FT-24 |

**Se verifica de punta a punta:** el número de Restaurantes es el mismo en Inicio, Presupuesto, el detalle y el reporte de ritmo antes y después del paso 6 (error 11; CA-08.2, CA-62.6).

### 4.3 Inicio de período **[R5]**

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

### 4.4 Pagar la tarjeta

**Precondición:** ESC-08, paso 1 (hoy 19 de febrero, corte el 15); fecha de pago el 22.

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | (Tarea diaria del 19) | — | 3.8 | Push `pago_tarjeta_proximo` sin montos, una vez en el ciclo (CA-33.3, CA-33.5) | FT-33, FT-71 |
| 2 | Toca el push | `/cuentas/[cuentaId]` | `detalleCuenta()` | "Para no generar intereses: $200.00"; próximo pago el 22 (CA-33.2 con el paso 1) | FT-33, FT-52 |
| 3 | "Pagar" $150.00 desde Ahorro | `/cuentas/[cuentaId]/pagar` | OP-23 | Desglose: deuda anterior $200.00, cargos $100.00, ya pagado $0.00; después, para no generar intereses $50.00 (CA-30.1) | FT-30 |
| 4 | Llega el SMS del pago (fecha 19/02) | `/bandeja` | OP-35 | **[R5]** Movimiento de tipo `pago_tarjeta` cuya cuenta es la tarjeta (04 OP-37), en `posible_duplicado` con `MovimientoDto.duplicado.tipo = 'transaccion'` (`movimientos.duplicado_transaccion_id`) apuntando al pago del paso 3. Regla de 01 §4.17 ("Posible duplicado"), aplicada en 04 §8.4 paso c con la fecha del SMS: hay una transacción con un efecto en la misma cuenta (la tarjeta; 03 `ix_efectos_cuenta`), el mismo monto, una diferencia de fechas de a lo sumo 1 día (fecha del SMS entre f − 1 y f + 1; aquí 0) y texto distinto. Antes se evalúa el emparejamiento (M2), sin candidata aquí. ⚠ Depende de un formato de SMS de pago, que todavía no existe (P4-3, S6-1) | FT-34, FT-37 |
| 5 | Toca "Es duplicado" | `/bandeja` | OP-40 `es_duplicado` | Descartado con "Restaurar"; si no hubiera registrado el pago a mano, lo aprobaría con el origen Ahorro propuesto (CA-35.7) | FT-37, FT-35 |
| 6 | Paga los $150.00 restantes | `/cuentas/[cuentaId]/pagar` | OP-23 | Deuda $0.00 (ESC-09; CA-30.2) | FT-30 |
| 7 | (Variante) paga $150.00 con $100.00 reservados | `/cuentas/[cuentaId]/pagar` | OP-23 | AV-10 antes; AV-04 y reducción proyectada $50.00 después (CA-30.3) | FT-30, FT-29 |

**Se verifica de punta a punta:** "te falta reservar" de la tarjeta es el mismo en Presupuesto, Inicio y Cuentas en cada paso (CA-29.6) y el pago no afecta dos veces el presupuesto (01 §4.11).

### 4.5 Conciliar

**Precondición:** ESC-47, paso 0 (tarjeta T con A, B y C en Finn; estado al 15 de febrero con A, B y D).

| # | Acción | Pantalla | Operación o consulta | Resultado verificable | FT |
|---|---|---|---|---|---|
| 1 | Sube el CSV | `/cuentas/[cuentaId]/conciliar` | OP-45 | A y B coinciden, D solo en el estado, C solo en Finn, diferencia propuesta +$2.00 (CA-43.1) | FT-43 |
| 2 | Agrega D como gasto | `/cuentas/[cuentaId]/conciliar` | OP-46 | Transacción `importada`, `confirmada` (CA-43.5) | FT-43 |
| 3 | Termina con A y B | `/cuentas/[cuentaId]/conciliar` | OP-47 | A y B conciliadas; AV-21 con la diferencia (CA-43.2) | FT-43 |
| 4 | Toca la propuesta de ajuste | `/registrar/entrada-tarjeta` | OP-27b | Valores iniciales: tarjeta, fecha del estado, monto y "Ajuste de conciliación" (CA-43.4) | FT-43, FT-32 |
| 5 | Edita A a $45.00 | `/actividad/[transaccionId]/editar` | OP-28 | AV-16 antes; cambio posterior; diferencia actual +$5.00 (CA-25.3, CA-52.2) | FT-25, FT-52 |
| 6 | En su cuenta de una financiera sin CSV, verifica el saldo | `/cuentas/[cuentaId]/verificar-saldo` | OP-53 | Diferencia $0.00 y todas marcadas; queda como "Verificación de saldo" (CA-44.1, CA-44.5) | FT-44 |

**Se verifica de punta a punta:** la conciliación nunca crea transacciones por su cuenta (inv. 14; CA-43.9) y la diferencia actual se recalcula sola después de cada edición (DM-8).

### 4.6 Cerrar con sobregiros **[R5]**

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

### 4.7 Lo que la Fase 7 hace con los recorridos

- Cada recorrido es una prueba de Playwright con el reloj simulado (04 §13.1.4) y los datos sembrados del escenario que cita. **[R5]** 4.3 y 4.6 traen su propio estado sembrado, con los números de cada paso calculados en `06-verificacion/recorridos/recorridos.py`; la Fase 7 siembra exactamente ese estado.
- Las aserciones son las de los criterios citados, más la identidad de saldo (inv. 1) después de cada paso que escribe.
- Los pasos con push o con el teléfono (4.1, pasos 8 a 10; 4.4, paso 1) se prueban con eventos sintéticos del service worker, como V5-32; la entrega real queda en la lista manual (CA-70.7).

---

## 5. Coherencia con `06-identidad-visual.md`

### 5.1 Fuente y método

- **Fuente:** `06-identidad-visual.md` (ENTREGA, AGENTES, PANTALLAS, `tokens.css`, `tokens.json`), las capturas S1 a S7 y K1 a K5 del proyecto y `prototipo-logica.js`.
- **Método:** cada elemento de cada pantalla de PANTALLAS §4 a §10 y de cada tablero K se comparó con su ficha (§2) y con el DTO de 04 que lo alimenta. Para cada diferencia, una de cuatro resoluciones:
  - **Coincide:** el diseño y las fichas dicen lo mismo.
  - **Ajuste del diseño:** el diseño cambia para seguir lo aprobado (un texto, un dato que no existe, un elemento que falta). No toca 01 a 05; lo aplica la Fase 8 sobre el diseño.
  - **Precisión:** el diseño se mantiene y esta sección fija cómo se implementa sin cambiar ningún contrato.
  - **Cambio o pregunta:** hace falta un CF o una decisión del usuario (5.8).
- **Precedencia:** donde el diseño contradice a 05, manda 05 hasta que se apruebe el CF (0.3).

### 5.2 Pantalla por pantalla

| Pantalla | Elemento del diseño | Ficha | Resolución |
|---|---|---|---|
| S1 Inicio | Billete de Listo para asignar con "En camino $40.00 · Carlos te debe" | FT-08 | **Ajuste del diseño:** "En camino $40.00", sin nombre. `InicioDto` no trae deudores (y con dos o más no funcionaría); el detalle está en Por cobrar |
| S1 Inicio | Botón "Asignar $312.40" del billete, que abre la hoja Asignar | FT-08, FT-10 | **Ajuste del diseño (P6-26 a, [R5]):** el botón es un enlace a `/presupuesto?filtro=sin-fondos`, o a `/presupuesto` si no hay categorías sin fondos (CA-08.11) |
| S1 Inicio | Billete negativo con "Quitar $86.15 de una categoría" | FT-08, FT-10 | **Ajuste del diseño (P6-26 a):** enlace a `/presupuesto`. El monto es `lpa` con `Monto presentacion="absoluto"` (05 §10.8), sin aritmética |
| S1 Inicio | "Necesita tu atención" con sobregiradas y tarjetas | FT-08 | **Coincide.** **Ajuste del diseño:** faltan los elementos de 3.7 y 3.8 (hallazgos de ritmo con su acción, pagos de tarjeta próximos) y los de 04 §6.1 que el diseño no muestra (cambios retroactivos, reserva excedente, archivadas con dinero, metas vencidas, pagos atrasados). Usan las mismas filas y `Aviso` |
| S1 Inicio | "Ver las 6 →" a Presupuesto filtrado por sobregiradas | FT-08 | **Precisión:** el enlace aparece solo si hay más sobregiradas que las que se muestran, y va a `/presupuesto?filtro=sobregiradas` |
| S1 Inicio | "Patrimonio neto" | FT-08 | **Ajuste del diseño:** "Patrimonio" (glosario 05 §12.3) |
| S1 Inicio | Primer uso: "1. Agregá tu primera cuenta · 2. Sumá tus tarjetas · 3. Asigná lo que tenés" | FT-04 | **Ajuste del diseño:** los tres pasos de FD-28 (crear una cuenta, crear las categorías, conectar los SMS), con su marca de hecho y "Ocultar por ahora" (3.15) |
| S1 Inicio | "Todo al día" y LPA negativo | FT-08 | **Coincide** (CA-08.8, AV-20) |
| S2 Presupuesto | Selector de período, franja de LPA, filtros, grupos, pagos de tarjeta y totales | FT-09 | **Coincide** |
| S2 Presupuesto | Fila de pago: "Disponible para pagar $623.43" | FT-29 | **Ajuste del diseño:** "Reservado $623.43" (R⁺, glosario 05 §12.3) |
| S2 Presupuesto | Período futuro "sin pagos de tarjeta" | FT-09, FT-29 | **Ajuste del diseño:** las filas de pago se muestran con su asignado y sin "te falta reservar" (inv. 2), porque se puede asignar a una categoría de pago en un período futuro (OP-14) |
| S2 Presupuesto | Barra de gastado sobre asignado en cada fila | FT-09 | **CF-25:** el ancho de cada segmento es una proporción de montos, que la interfaz no calcula (ADR-07, 05 PF-3); el DTO tiene que traerla (5.4) |
| S3 Detalle | Héroe, números, desglose del sobregiro, consumos D2, reglas, acciones con "Archivar" deshabilitado y su motivo | FT-14, FT-19 | **Coincide** |
| S3 Detalle | "Cubrir $26.30" y "Reservar $18.75", que abren Asignar con el monto | FT-14, FT-10 | **CF-25:** abrir Asignar con Asignado + sobregiro ya puesto es una suma que la interfaz no puede hacer (PF-3 prohíbe armar un valor que se envía). Se agrega una variante rápida del servidor, "cubrir el sobregiro" |
| S3 Detalle | Calendario con un punto que crece con el gasto del día | FT-14 | **CF-25:** la intensidad de cada día (proporción del máximo del período) viene del DTO. "Tocá un día para ver sus consumos" filtra la lista ya cargada por fecha: **precisión**, sin aritmética |
| S3 Detalle | Historial de 6 períodos con "Se pasó 2 de 6" y el promedio gastado | FT-14 | **CF-25:** el conteo y el promedio vienen del DTO. Las barras y el tope de asignado se dibujan con la escala del servidor (05 FE-44) |
| S3 Detalle | Meta con barra "45 % · $1,350.00 de $3,000.00" | FT-17 | **CF-25:** `detalleCategoria().meta` no trae el progreso (sí `metas()`, 04 §6.10); se agrega el mismo campo |
| S3 Detalle | Categoría de pago: "Pagá antes del 15/11" | FT-29, FT-33 | **CF-25:** `DetallePagoTarjetaDto.desgloseAlPagar` no trae la fecha de pago; se agrega `proximoPago` (el de 04 §6.5) |
| S3 Detalle | Selector Gráfico / Tabla del historial | FT-14 | **Precisión:** estado local del componente (no es un filtro ni cambia la consulta), `role="radiogroup"`; la tabla equivalente existe siempre para el lector de pantalla (05 FE-44) |
| S4 Bandeja | Lista compacta con estados y acciones por fila | FT-35 a FT-38 | **Coincide** con 05 §4.15 y 06 §2.5. "Descartar" en un posible duplicado es OP-40 `es_duplicado` (con "Restaurar") |
| S4 Bandeja | "→ Supermercado (por regla)" | FT-35 | **CF-25:** `MovimientoDto` trae la categoría sugerida pero no si salió de una regla o del historial. Se agrega `porRegla`, calculado con las reglas vigentes como en BE-43 |
| S4 Bandeja | Nota "Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están." | FT-78 | **Se conserva** (5.5) |
| S4 Bandeja | Computadora: la revisión del movimiento a la derecha de la lista, con Aprobar · Editar · Descartar | FT-35, FT-78 | **Precisión (FD-32):** el panel lateral es un **resumen de solo lectura** del movimiento elegido (datos de `bandeja()`), con las acciones de un toque de la fila. "Editar" abre `/bandeja/[movimientoId]` a pantalla completa, porque 05 FE-04 no intercepta flujos largos. Mientras dura un arrastre, ese mismo panel muestra los destinos (FD-30) |
| S5 Registrar | Cuenta propuesta "la cuenta que más usás en PRICESMART" | FT-21 | **Ajuste del diseño:** "Propuesta: la cuenta de tu último gasto." (`cuentaPropuesta`, 04 §6.14.4) |
| S5 Registrar | Dividir con líneas, deudor "(me lo debe)", suma "$148.60 de $148.60" | FT-21 | **Coincide.** La suma es la ayuda permitida por PF-3 |
| S5 Registrar | Bloque "Antes de guardar" con valor actual → valor nuevo de la deuda y de cada categoría | FT-21 | **Ajuste del diseño (P6-27 a, [R5]):** el bloque se quita. Sin previsualización; `ConfirmacionImpacto` solo con AV-01 y, después de guardar, el resultado con un enlace a cada categoría tocada (CA-21.12) |
| S5 Registrar | Estados: suma distinta, monto mal escrito, fecha en período cerrado, guardando, guardado | FT-21, FT-27 | **Coincide** (mensajes de 05 §5.2 y 04 §3.0.6) |
| S6 Cuentas | Posición neta con barras de activos y deudas | FT-51 | **CF-25 [R5]:** las dos barras vienen del DTO con escala relativa a la mayor (`barras`), así que ninguna pasa de 100 % |
| S6 Cuentas | Billetera: cara de cada tarjeta en oro o plata | FT-51 | **Precisión:** las caras son decorativas y se asignan por orden (primera oro, segunda plata, y así). El `color` de la tarjeta (03 §3.5) se usa como acento del chip; no transmite información |
| S6 Cuentas | Detalle de la tarjeta: te falta reservar, confirmado, uso del límite con la parte sin reservar rayada, corte, pago, sin intereses | FT-33, FT-51 | **Coincide**, salvo la parte sin reservar de la barra: **CF-25** (`usoSinReservar` en puntos básicos) |
| S6 Cuentas | Identidad distinta para "Cuenta corriente" y "Cuenta de ahorro" | FT-51 | **Ajuste del diseño:** 03 no distingue subtipos de cuenta de efectivo (01 §1.2). Todas usan la identidad `cuenta-banco`; `cuenta-ahorro` queda sin uso. Distinguirlas sería una columna nueva en 03 (fuera de esta fase, §7.3) |
| S6 Cuentas | Cuenta de ahorro "BAC · confirmado igual" | FT-51 | **Ajuste del diseño:** "Confirmado $X" siempre. Decir "igual" exige comparar dos montos en la interfaz |
| S6 Cuentas | Talón del préstamo "Cuota 14 · 20/10 · $210.00" | FT-51, FT-55 | **Coincide** con `proximaCuota` (04 §6.5). Sin modelo de cálculo: el talón dice "Sin modelo" **(nuevo)** |
| S7 Gasto semanal | Resumen "Referencia hoy $326.67" | FT-61 | **Ajuste del diseño:** "Referencia a esta semana". $326.67 es la referencia acumulada al final de la semana 4, no la de hoy (CA-61.1) |
| S7 Gasto semanal | "43 % de la referencia" y "Vas $39.52 por debajo" / "−$39.52 de la referencia" | FT-61 | **CF-25:** el porcentaje y la diferencia vienen del DTO |
| S7 Gasto semanal | Barras con tope de referencia, acumulado, rango contra los 3 anteriores, tabla | FT-61 | **Coincide.** Las posiciones las calcula la escala del servidor (05 FE-44) sobre los montos del DTO |
| K1 Navegación | Barra inferior con la Bandeja al centro; barra lateral en computadora | — | **Coincide** con 05 §3 |
| K1 Navegación | Hoja "Más secciones" | — | **Precisión:** es un menú de navegación, no una sección: no necesita URL propia. Sus filas son enlaces a las secciones secundarias de 05 §1.3 |
| K1 Navegación | Panel de notificaciones que cae desde arriba | FT-69 | **CF-23** (aprobado): `/notificaciones` interceptada desde la campana |
| K2 a K4 | Componentes base y de dominio de 05 §10.7 y §10.8 | — | **Coincide** en nombres de estados y tres señales (CF-10 a CF-12 cubren los temas, las variables y la tipografía) |
| K5 Nuevos | Componentes visuales propios | — | 5.4 (R-8) |
| Reportes nuevos (ritmo, realidad, hormiga, suscripciones, tarjetas, hallazgos, flujo de efectivo) | No están en el diseño | FT-62 a FT-68 | **Precisión:** se construyen con los componentes existentes (`Aviso` para cada hallazgo, `GraficoBarras`, tabla equivalente, `Resultado`), como pide AGENTES ("Cuando algo no está especificado") |

### 5.3 Ejemplos de Notificaciones ajustados (R-6, P6-25)

El panel de ejemplo de PANTALLAS §2.17 se reemplaza por ejemplos de motivos que existen (04 §11.2 con CF-07 y CF-24), con los textos de FD-31:

| Ejemplo del diseño | Problema | Ejemplo ajustado | Motivo |
|---|---|---|---|
| "Visa Oro corta el 25/10 · Te falta reservar $18.75 para que la deuda quede cubierta antes del corte" → Cuentas con Visa al frente | No hay motivo de corte; además lleva un saldo (FD-31) | "Visa Oro: tu fecha de pago es el 15/11. Revisá cuánto pagar para no generar intereses." → "Ver tarjeta" abre el detalle de la tarjeta (destino `cuenta`, CF-07), no la billetera | `pago_tarjeta_proximo` |
| "Cuota del préstamo el 20/10 · Cuota 14 · $210.00 desde Cuenta de ahorro. Se registra sola." | Una cuota que se registra sola no lleva aviso de cuota próxima (3.16) | "Cuota de Préstamo personal por $210.00 el 20/10. Registrala cuando la pagues." → la ocurrencia | `cuota_proxima` |
| "Netflix tiene su meta cubierta" | Fuera (P6-25) | "Se registró Netflix por $15.49 el 17/10." (texto de ejemplo, **nuevo**) → la transacción | `registro_automatico` |
| "La regla PIZZA HUT se aplicó" | Fuera (P6-25) | "Compra en PIZZA HUT por $18.40. Revisala en la bandeja." → el movimiento | `sms_nuevo` (04 §11.4) |
| "Se cerró el período 21/08 – 20/09 · Sobregiros cubiertos: Listo para asignar no cambió." | Coincide con el motivo | "Cerró el período del 21/08 al 20/09. Listo para asignar no cambió." | `cierre_periodo` |

- Pie del panel: "Los movimientos por revisar se resuelven en la Bandeja." (aprobado en P6-25).
- "Marcar todo como leído" → OPT-04 `todas`; el contador de la campana y de "Más secciones" desaparece (CA-69.4).

### 5.4 Componentes visuales propios (R-8, CF-13)

Se registran en 05 §10.8 con estos props. Todos reciben fragmentos de DTO sin transformarlos; ningún componente calcula montos ni proporciones (ADR-07, PF-3). Los campos marcados **CF-25** no existen todavía en 04 (5.8).

| Componente | Props | Cliente | Datos del DTO | Estados y variantes |
|---|---|---|---|---|
| `ResumenListoParaAsignar` (05 §10.8), variante `billete` y `franja` | `{ lpa, enCamino, lpaNegativo, variante: 'billete' \| 'franja', accion?: { href; texto } }` | No | `InicioDto` y `PresupuestoDto` (`lpa`, `enCamino`, `lpaNegativo`) | Positivo, cero ("Todo asignado"), negativo; con "En camino". `accion` según P6-26 |
| `BarraGastado` **(nuevo)** | `{ barra: BarraCategoriaDto }` | No | **CF-25 [R5]:** `FilaCategoria.barra = { cubiertoBp; excedenteBp; tipoExcedente: 'debito' \| 'tarjeta' \| 'mixto' \| null; metaBp?: number } \| null` (5.8) | Dentro de lo asignado; sobregiro con débito, con tarjeta o mixto (segunda señal: rayado `patron-sin-reservar` en la parte con tarjeta); meta con falta o vencida |
| `BilleteraTarjetas` **(nuevo)** | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | `CuentasDto.tarjetas` (04 §6.5) más **CF-25** `usoSinReservarBp` (nulo sin límite; tope 10.000) | Te falta reservar, deuda reservada, saldo a favor, sin deuda. "Tocá la tarjeta de atrás para traerla al frente" es estado local; con teclado, cada cara es un botón |
| `IdentidadCuenta` **(nuevo)** | `{ tipo: 'efectivo'; fila: CuentasDto['efectivo'][number] } \| { tipo: 'prestamo'; fila: CuentasDto['prestamos'][number] } \| { tipo: 'inversion'; fila: CuentasDto['inversiones'][number] } \| { tipo: 'archivada'; cuenta: Ref }` | No | `CuentasDto.efectivo` (`saldo`, `ultimaConciliacion.diferenciaActual`), `prestamos` (`capitalPendiente`, `proximaCuota`), `inversiones`, `archivadas` | Por tipo (una sola identidad para efectivo, 5.2); con diferencia de conciliación (AV-21); archivada |
| `PosicionNeta` **(nuevo)** | `{ posicion: CuentasDto['posicionNeta'] }` | No | `posicionNeta` (04 §6.5) más **CF-25** `barras: { activosBp; deudasBp }` | La mayor de las dos al 100 % y la otra en proporción; deudas rayadas, para distinguirlas sin color. Dibuja los anchos tal cual |
| `SelectorVista` **(nuevo)** | `{ vista: 'grafico' \| 'tabla'; alCambiar }` | Sí | — | `role="radiogroup"`; no cambia la URL (5.2) |
| `GraficoAcumulado` **(nuevo, `componentes/graficos/`)** | `{ semanas: GastoSemanalDto['categorias'][number]['semanas']; asignado: Centavos; resumen }` | No | `gastoAcumulado`, `referenciaAcumulada`, `futura` (04 §6.9.3) más **CF-25** `diferenciaReferencia` | Con semanas futuras (proyección punteada); asignado negativo (sin referencia) |
| `GraficoRango` **(nuevo, `componentes/graficos/`)** | `{ semanas; resumen }` | No | `gasto`, `anteriores[].gasto`, `futura` | Categoría nueva (sin anteriores): no se dibuja el rango |
| `CalendarioPeriodo` **(nuevo)** | `{ periodo: PeriodoDto; dias: { fecha; gastado; intensidadBp }[]; hoy }` | Sí (filtrar por día) | `calendario` (04 §6.3) más **CF-25** `intensidadBp` | Días futuros, hoy, sin gasto |
| `MovimientoBandeja` (05 §10.8), fila compacta | Sin cambios de props | Sí | `MovimientoDto` más **CF-25** `categoriaSugerida.porRegla` | Los de 05 §10.8; asa de arrastre si `aprobacion.arrastrable` (CF-22) |
| `PanelDestinosArrastre` **(nuevo, FT-78)** | `{ sugerida?: Ref; frecuentes: Ref[]; grupos?: { grupo: Ref; categorias: Ref[] }[]; variante: 'telefono' \| 'lateral' }` | Sí (cargado con `import()`) | `bandeja().destinosArrastre` y `categoriaSugerida` (CF-22) | Teléfono (sugerida, frecuentes, "Otra categoría…"); lateral (además, todas por grupo) |
| Panel de notificaciones | Es `Superpuesto` con la variante "desde arriba" sobre la página de `/notificaciones` | Sí | `notificaciones()` | Con y sin no leídas; vacío (CF-23) |

Requisitos comunes: tres señales en todo estado (05 §10.3); tocables de 44 × 44; movimiento reducido sin animación; los decorativos (`cuenta-*`, `tarjeta-*`, `marca-grabado`) nunca llevan información.

### 5.5 La nota de arrastre de la Bandeja

"Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están." **se conserva sin cambios**: FD-30 mantiene el arrastre como atajo (FT-78) y los botones de FT-35 visibles (WCAG 2.5.7), así que nada la contradice. En el teléfono el arrastre empieza con una pulsación larga; el texto no lo dice, y no hace falta: la nota es una pista, no una instrucción, y el asa tiene su nombre accesible con la instrucción completa para lectores de pantalla (FT-78).

### 5.6 Textos del diseño que cambian

| Dónde | Texto del diseño | Texto aprobado |
|---|---|---|
| S1 billete | "En camino $40.00 · Carlos te debe" | "En camino $40.00" |
| S1 | "Patrimonio neto" | "Patrimonio" |
| S1 primer uso | Los tres pasos del diseño | Los de 3.15 |
| S2 fila de pago | "Disponible para pagar" | "Reservado" |
| S5 | "Propuesta: la cuenta que más usás en PRICESMART." | "Propuesta: la cuenta de tu último gasto." |
| S6 | "confirmado igual" | "Confirmado {monto}" |
| S7 | "Referencia hoy" | "Referencia a esta semana" |
| Panel de notificaciones | Pie y ejemplos | 5.3 |
| S1 billete **[R5]** | "Asignar $312.40" abre la hoja Asignar; "Quitar $86.15 de una categoría" | Los mismos textos, como enlaces a `/presupuesto?filtro=sin-fondos` (o `/presupuesto` sin categorías sin fondos) y a `/presupuesto` (P6-26 a) |
| S5 **[R5]** | Bloque "Antes de guardar" | Se quita; el resultado después de guardar enlaza a cada categoría tocada (P6-27 a) |

### 5.7 Decisión de esta sección

**FD-32. Revisión lateral de la Bandeja en computadora.** El panel derecho de la Bandeja en computadora es un resumen de solo lectura del movimiento elegido, con las acciones de un toque de la fila; "Editar" abre el flujo largo a pantalla completa. *Justificación:* sigue el diseño sin contradecir 05 FE-04 (los flujos largos nunca se interceptan) y sin otra consulta (los datos ya están en `bandeja()`). *Alternativa descartada:* el flujo `/bandeja/[movimientoId]` dentro del panel, que exige un CF a FE-04 y dos instancias de un formulario con borrador.

### 5.8 CF-25 y las preguntas de esta sección **[R5]**

**CF-25. Datos para los componentes visuales de R-8** (aprobado en 0.16, con las correcciones 1 a 3). Todo lo que el diseño muestra como proporción o diferencia de montos viene del DTO (ADR-07, PF-3), calculado por selectores del dominio sobre la misma instantánea, sin lecturas nuevas. Las proporciones van en puntos básicos con redondeo mitad hacia arriba; los componentes dibujan esos valores sin recalcular. Verificado en `recorridos/cf25.py` (V6-13).

| Consulta | Campo | Definición |
|---|---|---|
| `presupuesto()`, `FilaCategoria` | `barra: { cubiertoBp; excedenteBp; tipoExcedente: 'debito' \| 'tarjeta' \| 'mixto' \| null; metaBp?: number } \| null` | Con F = fondo del período (01 §4.5, incluye las entradas de devoluciones D-2 a D-4), cubierto = Σ cubierto del reparto D2 y excedente = SobT + SobD (01 §4.7): base = máx(máx(0, F), cubierto + excedente). `excedenteBp` = excedente / base, al menos 1 si el excedente es positivo; `cubiertoBp` = mín(cubierto / base, 10.000 − `excedenteBp`), siempre ≥ 0. `tipoExcedente` es el tipo del `SobregiroDto` de la fila (mixto si SobT y SobD son positivos). `null` solo si base = 0 (sin fondo, sin consumos y sin sobregiro). `metaBp`: el progreso de `metas()` (04 §6.10), solo en metas de ahorro |
| `detalleCategoria()` (normal) | `historialResumen: { promedioGastado; periodosExcedidos }`; `meta.progresoBp?`; `calendario[].intensidadBp` | Promedio (mitad hacia arriba) y conteo de gastado > asignado sobre los períodos del historial que trae (CF-17: los que haya, hasta 6); progreso como en `metas()`, tope 10.000; intensidad = máx(0, gastado del día) / máximo de los días del período; todas 0 si ese máximo es ≤ 0 |
| `detalleCategoria()` (pago) | `desgloseAlPagar.proximoPago` | El `proximoPago` de 04 §6.5 |
| `cuentas()` | `tarjetas[].usoSinReservarBp: number \| null`; `posicionNeta.barras: { activosBp; deudasBp }` | S(t) / límite, con tope 10.000; nulo si el límite es nulo o 0. Barras: escala relativa al mayor de los dos totales (el mayor = 10.000; el otro, su proporción, al menos 1 si es positivo); 0 y 0 si los dos son 0. Reemplaza al `deudasSobreActivosBp` de la propuesta, que con ESC-01 daba 53.000 |
| `reporte('gasto_semanal')` | `categorias[].semanaActual?: { k; porcentajeReferenciaBp: number \| null }`; `categorias[].diferenciaReferencia` | Gasto de la semana k / Ref(k), sin tope (se muestra como texto); nulo si Ref(k) ≤ 0 (asignado ≤ 0 o semana sin referencia). Diferencia = RefAcum(k) − gasto acumulado hasta k (negativa si se pasó) |
| `bandeja()` | `MovimientoDto.categoriaSugerida.porRegla` | Verdadero si el origen de `sugerirCategoria` es `regla` (04 §6.0.5, 01 §4.17) |
| `formulario('asignar')` | `contexto.rapida.cubrirSobregiro?` | Asig(c, p) + máx(0, −Disp(c, p)), solo si Disp(c, p) < 0 |

**Variante "cubrir el sobregiro" de OP-16** (precisión de 01 OP-16, corrección 3): Asig(c, p) = Asig(c, p) + máx(0, −Disp(c, p)); se ofrece solo con Disp(c, p) < 0 y se aplica con las reglas de OP-14, incluido AV-11. Es lo que hacen "Cubrir $26.30" y "Reservar $18.75" del detalle (S3).

**Impacto:** 01 OP-16 (línea en "Enmiendas posteriores"); 04 §6.2, §6.3, §6.5, §6.8, §6.9.3 y §6.14.4; 05 §10.8.1. Criterios: CA-09.8 a CA-09.13, CA-12.9, CA-14.7 a CA-14.10, CA-29.8, CA-35.11, CA-51.6 a CA-51.8, CA-61.6 y CA-61.7.

**P6-26 y P6-27** quedaron resueltas con la opción a) como ajustes del diseño (5.2, 5.6), sin cambios a 01 a 05. Criterios: CA-08.11 y CA-21.12.

---

## 6. Trazabilidad

### 6.1 Script y resultado

`06-verificacion/trazabilidad.py` lee este documento, `04-backend.md` y `05-frontend.md` y comprueba ocho reglas. Las tablas de 6.2 a 6.6 son su salida (`--tablas`), sin editar.

| # | Regla | Resultado |
|---|---|---|
| T1 | Cada operación de 04 (OP-01 a OP-52, OPT-01 a OPT-09) y OP-53 (CF-01) aparece en al menos una ficha. **[R5]** El catálogo no tiene repeticiones (con 04 ya enmendado, OP-53 sale de su encabezado y no se suma otra vez); OP-54 no entra porque sigue diferida | 62 de 62 |
| T2 | Cada consulta de 04 §6, cada tipo de reporte (04 §6.9.2, §6.9.3 y los de CF-02 y CF-04) y cada contexto de `formulario` de 04 §6.14.4 aparece en al menos una ficha | 19 consultas, 15 reportes y 15 formularios |
| T3 | Cada ruta de 05 §1.3 ([P], [S], [D], [C], [L], acceso, estática y redirección) y las rutas nuevas de CF-01 y CF-08 aparecen en al menos una ficha. `/registrar/[tipo]` y `/reportes/[tipo]` cuentan con una ruta concreta | 78 de 78 |
| T4 | Cada ficha cita al menos una operación o una consulta. Excepción declarada: FT-05 y FT-77 son solo del cliente (instalación y tema) y citan su ruta | 77 de 77 |
| T5 | ESC-01 a ESC-50 y AV-01 a AV-24 aparecen en el bloque Escenarios o Avisos de al menos una ficha | 50 de 50 y 24 de 24 |
| T6 | Cada CF de 0.7 aparece en al menos una ficha, en §3 o en §5 (CF-03 diferido) | 25 de 25 |
| T7 | Cada paso de los recorridos de §4 cita al menos una ficha, y todas existen | 45 pasos |
| T8 | El catálogo de §1 (sin FT-07, retirada) y las fichas coinciden | 77 = 77 |

**Resultado: PASA.** Control negativo (`--negativo`), comparado contra la corrida limpia: quitar la ficha FT-41 lo detectan T1 y T8; quitar las menciones de `/reglas`, T3; quitar ESC-46 del bloque Escenarios, T5; cambiar FT-50 por FT-99 en un recorrido, T7; quitar OP-26, T1 y T4. Los cinco se detectan.

Lo que el script **no** comprueba: que una ficha use bien la operación que cita (eso lo revisan los criterios y la Fase 7), ni la cobertura de BE-nn y FE-nn, que son decisiones de implementación con su propia verificación en 04 y 05.

### 6.2 Operaciones → fichas

| Operación | Fichas | Operación | Fichas |
|---|---|---|---|
| OP-01 | FT-04, FT-50, FT-51 | OP-02 | FT-52, FT-53 |
| OP-03 | FT-51, FT-53 | OP-04 | FT-52, FT-53 |
| OP-05 | FT-52, FT-53 | OP-06 | FT-52, FT-53 |
| OP-07 | FT-04, FT-18 | OP-08 | FT-18 |
| OP-09 | FT-14, FT-19 | OP-10 | FT-14, FT-19 |
| OP-11 | FT-08, FT-09, FT-11, FT-14, FT-19 | OP-12 | FT-14, FT-20 |
| OP-13 | FT-18 | OP-14 | FT-08, FT-09, FT-10, FT-12, FT-14, FT-29, FT-31, FT-62, FT-63, FT-66, FT-67, FT-68 |
| OP-15 | FT-08, FT-09, FT-11, FT-14, FT-62, FT-67 | OP-16 | FT-12 |
| OP-17 | FT-09, FT-13 | OP-18 | FT-14, FT-17, FT-63, FT-67 |
| OP-19 | FT-72 | OP-20 | FT-21, FT-43 |
| OP-21 | FT-22, FT-43 | OP-22 | FT-23 |
| OP-23 | FT-29, FT-30, FT-51, FT-52, FT-66 | OP-24 | FT-52, FT-54 |
| OP-25 | FT-57 | OP-26 | FT-56 |
| OP-27 | FT-22, FT-32, FT-43 | OP-28 | FT-25, FT-49 |
| OP-29 | FT-26 | OP-30 | FT-26 |
| OP-31 | FT-22, FT-45, FT-46 | OP-32 | FT-45, FT-47 |
| OP-33 | FT-28 | OP-34 | FT-28, FT-47 |
| OP-35 | FT-03, FT-34 | OP-36 | FT-35, FT-38, FT-78 |
| OP-37 | FT-35, FT-38, FT-78 | OP-38 | FT-36 |
| OP-39 | FT-37, FT-38 | OP-40 | FT-35, FT-37, FT-70 |
| OP-41 | FT-35, FT-39, FT-78 | OP-42 | FT-40, FT-65, FT-67 |
| OP-43 | FT-41, FT-42, FT-71 | OP-44 | FT-41 |
| OP-45 | FT-43, FT-52 | OP-46 | FT-43 |
| OP-47 | FT-26, FT-43 | OP-48 | FT-52, FT-55, FT-58 |
| OP-49 | FT-38 | OP-50 | FT-38 |
| OP-51 | FT-40, FT-65 | OP-52 | FT-45, FT-48 |
| OP-53 | FT-44, FT-52 | OPT-01 | FT-03, FT-04 |
| OPT-02 | FT-06 | OPT-03 | FT-06 |
| OPT-04 | FT-08, FT-27, FT-69 | OPT-05 | FT-73 |
| OPT-06 | FT-73 | OPT-07 | FT-73 |
| OPT-08 | FT-75 | OPT-09 | FT-76 |

### 6.3 Consultas, reportes y formularios → fichas

| Consulta, reporte o formulario | Fichas |
|---|---|
| `actividad()` | FT-24 |
| `ajustes()` | FT-03, FT-06, FT-42, FT-72, FT-73, FT-74, FT-75, FT-76 |
| `bandeja()` | FT-34, FT-35, FT-36, FT-37, FT-38, FT-78 |
| `cuentas()` | FT-29, FT-33, FT-45, FT-51, FT-53 |
| `detalleCategoria()` | FT-14, FT-16, FT-19, FT-29, FT-31 |
| `detalleCuenta()` | FT-33, FT-43, FT-44, FT-52, FT-53, FT-55, FT-57, FT-58, FT-59 |
| `detalleLpa()` | FT-15, FT-16 |
| `detalleTransaccion()` | FT-25, FT-26, FT-28 |
| `estructura()` | FT-04, FT-18 |
| `formulario()` | FT-10, FT-11, FT-12, FT-17, FT-19, FT-20, FT-21, FT-22, FT-23, FT-25, FT-28, FT-30, FT-32, FT-35, FT-38, FT-39, FT-78, FT-40, FT-41, FT-43, FT-44, FT-46, FT-47, FT-50, FT-53, FT-54, FT-55, FT-56, FT-57, FT-58, FT-73 |
| `inicio()` | FT-04, FT-08, FT-16, FT-27, FT-31, FT-33, FT-41, FT-42, FT-45, FT-62 |
| `metas()` | FT-14, FT-17 |
| `notificaciones()` | FT-69, FT-70, FT-71 |
| `porCobrar()` | FT-45, FT-48, FT-49 |
| `presupuesto()` | FT-08, FT-09, FT-10, FT-13, FT-16, FT-19, FT-29, FT-31 |
| `programadas()` | FT-40, FT-41, FT-42, FT-71 |
| `reglas()` | FT-39 |
| `reporte()` | FT-60, FT-61, FT-62, FT-63, FT-64, FT-65, FT-66, FT-67, FT-68 |
| `sugerencia()` | FT-21, FT-25, FT-35, FT-40, FT-43 |
| `reporte('categorias')` | FT-60 |
| `reporte('cumplimiento')` | FT-60 |
| `reporte('gasto_semanal')` | FT-61 |
| `reporte('ingresos_gastos')` | FT-60 |
| `reporte('patrimonio')` | FT-60 |
| `reporte('remanente')` | FT-60 |
| `reporte('tendencia')` | FT-60 |
| `reporte('top_comercios')` | FT-60 |
| `reporte('ritmo')` | FT-08, FT-62 |
| `reporte('realidad')` | FT-63 |
| `reporte('hormiga')` | FT-64 |
| `reporte('suscripciones')` | FT-65 |
| `reporte('tarjetas')` | FT-66 |
| `reporte('hallazgos')` | FT-67 |
| `reporte('flujo_efectivo')` | FT-68 |
| `formulario('registrar')` | FT-21, FT-22, FT-23, FT-28, FT-32, FT-56, FT-57 |
| `formulario('pagar_tarjeta')` | FT-30 |
| `formulario('cuota_prestamo')` | FT-54 |
| `formulario('editar_transaccion')` | FT-25 |
| `formulario('cobrar')` | FT-46 |
| `formulario('condonar')` | FT-47 |
| `formulario('devolver')` | FT-28 |
| `formulario('asignar')` | FT-10, FT-11, FT-12, FT-19 |
| `formulario('archivar_categoria')` | FT-19 |
| `formulario('fusionar')` | FT-20 |
| `formulario('cuenta')` | FT-33, FT-50, FT-53, FT-55, FT-58 |
| `formulario('programada')` | FT-40, FT-41, FT-42 |
| `formulario('movimiento')` | FT-35, FT-38, FT-78 |
| `formulario('formato')` | FT-73 |
| `formulario('meta')` | FT-17 |

### 6.4 Rutas → fichas

| Ruta | Fichas |
|---|---|
| `/` | FT-01, FT-04, FT-06, FT-08, FT-16, FT-27, FT-31, FT-33, FT-41, FT-62 |
| `/actividad` | FT-24, FT-64 |
| `/actividad/[transaccionId]` | FT-08, FT-25, FT-35, FT-69 |
| `/actividad/[transaccionId]/devolver` | FT-28 |
| `/actividad/[transaccionId]/editar` | FT-25 |
| `/actividad/[transaccionId]/eliminar` | FT-26 |
| `/actividad/[transaccionId]/estado` | FT-26 |
| `/actividad/[transaccionId]/eventos/eliminar` | FT-28 |
| `/ajustes` | FT-04, FT-05, FT-76 |
| `/ajustes/apariencia` | FT-77 |
| `/ajustes/ciclo` | FT-72 |
| `/ajustes/diagnostico` | FT-42, FT-76 |
| `/ajustes/exportar` | FT-75 |
| `/ajustes/formatos` | FT-73 |
| `/ajustes/formatos/[formatoId]` | FT-73 |
| `/ajustes/formatos/nuevo` | FT-73 |
| `/ajustes/instituciones` | FT-73 |
| `/ajustes/instituciones/[institucionId]` | FT-73 |
| `/ajustes/instituciones/nueva` | FT-73 |
| `/ajustes/notificaciones` | FT-06 |
| `/ajustes/respaldo` | FT-76 |
| `/ajustes/seguridad` | FT-74 |
| `/ajustes/seguridad/factores/[factorId]/quitar` | FT-74 |
| `/ajustes/seguridad/factores/nuevo` | FT-02, FT-74 |
| `/ajustes/webhook` | FT-03, FT-04 |
| `/bandeja` | FT-08, FT-34, FT-35, FT-36, FT-37, FT-38, FT-78, FT-70 |
| `/bandeja/[movimientoId]` | FT-35, FT-37, FT-38, FT-78, FT-70 |
| `/cuentas` | FT-33, FT-51 |
| `/cuentas/[cuentaId]` | FT-08, FT-33, FT-52, FT-59, FT-71 |
| `/cuentas/[cuentaId]/archivar` | FT-53 |
| `/cuentas/[cuentaId]/conciliar` | FT-43 |
| `/cuentas/[cuentaId]/condiciones` | FT-55, FT-58 |
| `/cuentas/[cuentaId]/cuota` | FT-54 |
| `/cuentas/[cuentaId]/editar` | FT-53 |
| `/cuentas/[cuentaId]/eliminar` | FT-53 |
| `/cuentas/[cuentaId]/pagar` | FT-30, FT-66 |
| `/cuentas/nueva` | FT-04, FT-21, FT-50, FT-58 |
| `/cuentas/ordenar` | FT-53 |
| `/ingresar` | FT-01 |
| `/ingresar/inscribir` | FT-01, FT-02 |
| `/ingresar/verificar` | FT-01, FT-02 |
| `/metas` | FT-17 |
| `/metas/[metaId]` | FT-17 |
| `/metas/nueva` | FT-17 |
| `/notificaciones` | FT-69 |
| `/por-cobrar` | FT-45 |
| `/por-cobrar/cobrar` | FT-46 |
| `/por-cobrar/condonar/[lineaId]` | FT-47 |
| `/por-cobrar/deudores/[deudorId]/renombrar` | FT-48 |
| `/presupuesto` | FT-01, FT-04, FT-08, FT-09, FT-16, FT-29, FT-31 |
| `/presupuesto/asignar/[categoriaId]` | FT-08, FT-10, FT-12 |
| `/presupuesto/auto-asignar` | FT-13 |
| `/presupuesto/categorias/[categoriaId]` | FT-08, FT-14, FT-16, FT-29, FT-31 |
| `/presupuesto/categorias/[categoriaId]/archivar` | FT-19 |
| `/presupuesto/categorias/[categoriaId]/fusionar` | FT-20 |
| `/presupuesto/categorias/[categoriaId]/sacar` | FT-19 |
| `/presupuesto/estructura` | FT-04, FT-18 |
| `/presupuesto/estructura/categorias/[categoriaId]` | FT-18 |
| `/presupuesto/estructura/categorias/nueva` | FT-18 |
| `/presupuesto/estructura/grupos/[grupoId]` | FT-18 |
| `/presupuesto/estructura/grupos/nuevo` | FT-18 |
| `/presupuesto/listo-para-asignar` | FT-08, FT-15 |
| `/presupuesto/mover` | FT-11 |
| `/programadas` | FT-40, FT-41 |
| `/programadas/[programadaId]` | FT-40 |
| `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` | FT-08, FT-41, FT-71 |
| `/programadas/nueva` | FT-40, FT-65 |
| `/registrar` | FT-21, FT-22, FT-23, FT-56 |
| `/registrar/[tipo]` | FT-21, FT-22, FT-23, FT-28, FT-32, FT-43, FT-56, FT-57 |
| `/registrar/gasto` | FT-21 |
| `/reglas` | FT-39 |
| `/reglas/[reglaId]` | FT-39 |
| `/reglas/nueva` | FT-39 |
| `/reportes` | FT-60 |
| `/reportes/[tipo]` | FT-60, FT-61, FT-62, FT-63, FT-64, FT-65, FT-66, FT-67, FT-68 |
| `/sin-conexion` | FT-05 |
| `/presupuesto/estructura/plantilla` | FT-04 |
| `/cuentas/[cuentaId]/verificar-saldo` | FT-44 |

### 6.5 Escenarios y avisos → fichas

| Escenario o aviso | Fichas | Escenario o aviso | Fichas | Escenario o aviso | Fichas |
|---|---|---|---|---|---|
| ESC-01 | FT-04, FT-08, FT-29, FT-50, FT-51, FT-60 | ESC-02 | FT-15, FT-27, FT-50 | ESC-03 | FT-10, FT-13, FT-22 |
| ESC-04 | FT-29 | ESC-05 | FT-09, FT-16, FT-29 | ESC-06 | FT-10 |
| ESC-07 | FT-10 | ESC-08 | FT-30, FT-33 | ESC-09 | FT-30 |
| ESC-10 | FT-16, FT-30 | ESC-11 | FT-29 | ESC-12 | FT-21 |
| ESC-13 | FT-30, FT-31 | ESC-14 | FT-31, FT-32, FT-60 | ESC-15 | FT-08, FT-16 |
| ESC-16 | FT-11 | ESC-17 | FT-14, FT-15, FT-16, FT-27 | ESC-18 | FT-25 |
| ESC-19 | FT-14, FT-21 | ESC-20 | FT-08, FT-21, FT-45, FT-46, FT-60 | ESC-21 | FT-47 |
| ESC-22 | FT-45, FT-46 | ESC-23 | FT-46, FT-47 | ESC-24 | FT-21 |
| ESC-25 | FT-28 | ESC-26 | FT-28 | ESC-27 | FT-28 |
| ESC-28 | FT-28, FT-31 | ESC-29 | FT-28 | ESC-30 | FT-28 |
| ESC-31 | FT-08, FT-27 | ESC-32 | FT-27 | ESC-33 | FT-26 |
| ESC-34 | FT-25 | ESC-35 | FT-12, FT-17 | ESC-36 | FT-17, FT-72 |
| ESC-37 | FT-17 | ESC-38 | FT-17 | ESC-39 | FT-54 |
| ESC-40 | FT-15, FT-51, FT-56, FT-57, FT-60 | ESC-41 | FT-57 | ESC-42 | FT-20 |
| ESC-43 | FT-53 | ESC-44 | FT-09, FT-19, FT-47 | ESC-45 | FT-72 |
| ESC-46 | FT-34, FT-35 | ESC-47 | FT-25, FT-43, FT-52 | ESC-48 | FT-29, FT-46 |
| ESC-49 | FT-09, FT-16, FT-27 | ESC-50 | FT-41, FT-42, FT-71 | AV-01 | FT-08, FT-20, FT-21, FT-22, FT-23, FT-25, FT-26, FT-27, FT-30, FT-35, FT-78, FT-41, FT-50, FT-53, FT-54, FT-56, FT-57, FT-69 |
| AV-02 | FT-08, FT-09, FT-11, FT-14, FT-16, FT-21, FT-47, FT-54, FT-62 | AV-03 | FT-08, FT-09, FT-11, FT-14, FT-16, FT-21, FT-29, FT-47, FT-54, FT-62 | AV-04 | FT-08, FT-09, FT-16, FT-29, FT-30, FT-52 |
| AV-05 | FT-08, FT-09, FT-29, FT-46, FT-52 | AV-06 | FT-08, FT-09, FT-28, FT-29, FT-52 | AV-07 | FT-04, FT-08, FT-09, FT-21, FT-29, FT-50, FT-51, FT-52, FT-66 |
| AV-08 | FT-08, FT-09, FT-28, FT-31, FT-32, FT-46, FT-51, FT-52 | AV-09 | FT-08, FT-09, FT-15, FT-21, FT-45, FT-46, FT-51 | AV-10 | FT-30 |
| AV-11 | FT-10, FT-12, FT-46, FT-62, FT-63 | AV-12 | FT-72 | AV-13 | FT-20 |
| AV-14 | FT-08, FT-09, FT-14, FT-19, FT-28 | AV-15 | FT-53 | AV-16 | FT-25, FT-26, FT-35, FT-78, FT-44 |
| AV-17 | FT-08, FT-09, FT-14, FT-17, FT-69, FT-71 | AV-18 | FT-13 | AV-19 | FT-36 |
| AV-20 | FT-08, FT-09, FT-10, FT-15 | AV-21 | FT-43, FT-44, FT-51, FT-52 | AV-22 | FT-46 |
| AV-23 | FT-08, FT-34, FT-35, FT-37, FT-38, FT-78, FT-42, FT-69, FT-70, FT-71 | AV-24 | FT-32 |  |  |

### 6.6 Cambios propuestos → fichas

| Cambio | Fichas |
|---|---|
| CF-01 | FT-44, FT-52, §3 |
| CF-02 | FT-68, §3 |
| CF-03 | FT-49, §3, diferido |
| CF-04 | FT-62, FT-63, FT-64, FT-65, FT-66, FT-67, §3 |
| CF-05 | §3 |
| CF-06 | FT-08, FT-33, FT-62, §3 |
| CF-07 | FT-08, FT-33, FT-71, §3, §5 |
| CF-08 | FT-04, §3 |
| CF-09 | §3 |
| CF-10 | FT-77, §3, §5 |
| CF-11 | §3 |
| CF-12 | §3, §5 |
| CF-13 | §3, §5 |
| CF-14 | §3 |
| CF-15 | §3 |
| CF-16 | FT-33, FT-71, §3 |
| CF-17 | FT-12, FT-14, §3, §5 |
| CF-18 | FT-04, §3 |
| CF-19 | FT-04, §3 |
| CF-20 | FT-40, FT-65, FT-71, §3 |
| CF-21 | FT-78, §3 |
| CF-22 | FT-78, §3, §5 |
| CF-23 | FT-69, §3, §5 |
| CF-24 | FT-69, FT-71, §3, §5 |
| CF-25 | FT-09, FT-12, §5 |

---

## 7. Supuestos, riesgos y preguntas

### 7.1 Supuestos

| # | Supuesto | Estado | Qué pasa si no se cumple |
|---|---|---|---|
| S6-1 a S6-7 | Los del Paso 1 | Aprobados (0.5) | — |
| S6-1 en particular | Los criterios de SMS y de estados de cuenta usan muestras sintéticas hasta tener las reales (P4-3) | Vigente | CA-34.14, CA-43.10 y CA-73.6 (marcados ⚠) se rehacen con las muestras reales; si un formato no las reconoce, se corrige el formato (OPT-05), no la ficha |
| SE-1 **[E]** | Los recorridos de §4 usan las fechas y montos de los escenarios de 01 §8 y de A.7 | Nuevo | La Fase 7 los automatiza con esos mismos datos; si cambia un escenario, cambia el recorrido |
| SE-2 **[E]** | Los ajustes del diseño de 5.2 y 5.6 los aplica la Fase 8 sobre el diseño, no Claude Design otra vez | Nuevo | Si se pide una ronda de diseño, se le entrega 5.2, 5.3 y 5.6 como encargo |
| SE-3 **[E]** | Las caras de las tarjetas (oro, plata) se asignan por orden y no dicen nada de la tarjeta | Nuevo | Si el usuario quiere elegir la cara, es un campo nuevo de la cuenta (fuera de esta fase) |

### 7.2 Riesgos

| # | Riesgo | Probabilidad e impacto | Mitigación |
|---|---|---|---|
| R6-1 | Los formatos de SMS reales no se parecen a los sintéticos | Media · alto: la Bandeja es el uso diario | S6-1; los adaptadores se prueban con las muestras en cuanto lleguen; "No reconocido" con "Registrar a mano" nunca deja un SMS sin salida (FT-38) |
| R6-2 | El arrastre falla en un teléfono real o con un lector de pantalla | Media · bajo: es un atajo | Botones siempre visibles (WCAG 2.5.7); CA-78.15 se prueba a mano en Android y iOS antes de publicar; si falla, se apaga el arrastre sin tocar FT-35 |
| R6-3 | Aplicar la plantilla tarda cerca de 20 s con un servidor lento | Baja · medio: pasa una vez | Lote en el servidor en tandas con avance (CF-19): 18.9 s en el peor caso medido (V6-05) y reanudable |
| R6-4 | Los reportes accionables tardan más que el presupuesto de lecturas de 04 §6.0.7 con varios años de datos | Media · medio | Se calculan sobre la instantánea con a lo sumo 4 períodos (3.5); la Fase 7 mide con `datos_base` (CF-09) y un año sintético |
| R6-5 | Un componente de R-8 recalcula una proporción en lugar de dibujar la del DTO | Baja · medio | CF-25 aprobado: todos los campos vienen del servidor; CA-09.13 y CA-51.6 lo prueban |
| R6-6 | Muchos CF aplicados a la vez en 01 a 05 dejan una referencia rota | Media · medio | Cada CF se aplica con su marca **[F6]** y su línea en "Enmiendas posteriores"; el script de trazabilidad y las verificaciones de 04 (V-29) y 05 se repiten sobre los documentos enmendados (7.6) |

### 7.3 Fuera de esta fase

- **Subtipos de cuenta de efectivo** (corriente y de ahorro con identidad propia, 5.2): una columna nueva en 03 y un campo en OP-01. Se puede proponer cuando se pida.
- **Unir deudores** (CF-03): diseñado en 3.4 y diferido; en la primera versión se renombra (FT-48).
- **Avisos del diseño que no entran** (P6-25): corte de tarjeta, meta cubierta y regla aplicada.

### 7.4 Preguntas abiertas

**[R5]** Ninguna. CF-25, P6-26 y P6-27 se resolvieron en la revisión de la Parte E (0.16).

### 7.5 Cambios a documentos aprobados, por documento

Estado al cerrar la Fase 6: **aplicado** = está en el documento con la marca **[F6]** y su línea en "Enmiendas posteriores"; **diferido** = diseñado y no aplicado. **[R5]** No queda ningún cambio pendiente; P6-26 y P6-27 son ajustes del diseño (5.6) y no cambian ningún documento.

| Documento | CF aplicados | Diferidos | Pendientes |
|---|---|---|---|
| `00-decisiones.md` | CF-14 (§5.1) | — | — |
| `01-dominio.md` | CF-01 (§1.8, §5.8, supuesto 11), CF-17 (OP-16, precisión), CF-20 (§4.16 y OP-42, precisión), **[R5]** CF-25 (OP-16, variante "cubrir el sobregiro") | CF-03 (§1.5, OP-28, §5.5) | — |
| `02-tecnologias.md` | Ninguno | — | — |
| `03-base-de-datos.md` | CF-01 (`conciliaciones.modo`), CF-14 (§0.2), CF-16 (`notificaciones.aviso` nulo), CF-20 (`programadas.reactivada_desde`) | CF-03 | — |
| `04-backend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-09, CF-15, CF-16, CF-17, CF-18, CF-19, CF-20, CF-21, CF-22, CF-24, **[R5]** CF-25 | CF-03 | — |
| `05-frontend.md` | CF-01, CF-02, CF-04, CF-05, CF-06, CF-07, CF-08, CF-10, CF-11, CF-12, CF-13, CF-15, CF-17, CF-18, CF-19, CF-21, CF-22, CF-23, **[R5]** CF-25 | CF-03 | — |

CF-07 y CF-24 no tocan 03: `motivo` es texto. CF-16 y CF-20 son las únicas migraciones (de expansión, 03 §10).

### 7.6 Verificación al cerrar

Resultados finales, con los cambios **[R5]** y sobre los documentos ya enmendados.

| # | Qué | Resultado |
|---|---|---|
| V6-09 **[E]** | Trazabilidad (6.1, `trazabilidad.py`) | **Pasa**, con 04 y 05 aprobados y con 04 y 05 enmendados: 77 fichas, 62 operaciones (sin repetir OP-53 y sin OP-54), 19 consultas, 15 tipos de reporte, 15 contextos de formulario, 78 rutas, 50 escenarios, 24 avisos, 25 CF y 45 pasos de recorridos. Control negativo: los cinco errores introducidos se detectan. **[R5]** Dos ajustes del script: el catálogo de operaciones no repite (antes contaba 63 con 04 enmendado, por OP-53 dos veces) y cada ficha termina en el siguiente encabezado de sección (FT-59 ya no muestra `reporte()`, que venía de la introducción de 2.10) |
| V6-10 **[E]** | Revisión de las fichas (`revisar_fichas.py`) | **Pasa:** 77 fichas y **492 criterios** (471 más 21 de **[R5]**); 50 de 50 escenarios y 24 de 24 avisos. Cortes: donde empieza la Parte E y en cada encabezado de sección |
| V6-11 **[E]** | Prueba de los reportes (`prueba_reportes.py`) | **Pasa:** 20.000 casos de ritmo y proyección, 5.000 de realidad, hallazgos y hormiga, 5.000 de flujo |
| V6-12 **[E]** | Enmiendas aplicadas a 00, 01, 03, 04 y 05 (`enmiendas_f6.py`): E1 cada CF de 7.5 está en su documento; E2 línea de la Fase 6 en "Enmiendas posteriores"; E3 00, 01 y 03 solo cambian al final; E4 en 04 y 05 cada CF tiene su marca **[F6]** en la sección afectada; E5 CF-03 no se aplica y el campo descartado `deudasSobreActivosBp` no aparece; E6 ninguna tabla quedó con columnas de más o de menos | **Pasa.** 04: 59 cambios y 62 marcas **[F6]** (CF-25: 14 cambios); 05: 45 cambios y 46 marcas (CF-25: 6); 03: 5 líneas; 01: 5 líneas (con CF-25); 00: 1 línea. Control negativo (quitar CF-22 de 04, tocar el cuerpo de 01, romper una fila de 05): detectado |
| V6-13 **[R5]** | Recorridos 4.3 y 4.6 (`recorridos/recorridos.py`, con `motor_min.py`) y CF-25 (`recorridos/cf25.py`) | **Pasa.** El motor mínimo reproduce ESC-17 (pasos 2 y 3) como control. Recorridos: 53 comprobaciones, con la identidad de saldo en cada consulta; la sugerencia de realidad sale del prototipo de 3.5. CF-25: 19 comprobaciones con los bordes de los criterios y 20.000 casos aleatorios de la propiedad de la barra (`excedenteBp > 0` ⇔ sobregiro, mismo tipo, cubierto ≥ 0, suma ≤ 10.000) |

---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle; en el texto, las marcas **[F7]** señalan dónde rige.

- **CT-03 y CT-07** (Fase 7, aprobados en las revisiones de las partes C y D de `07-pruebas.md`). CA-78.15 y CA-70.7 sin iPhone (riesgo aceptado, P7-9); 3.5.12 y el recorrido 4.2 sobre la semilla `estado-a7`, sin cambio en ningún número citado por los CA. Marcas **[F7]** en cada lugar. Detalle en `07-pruebas.md` §22 y §28.
- **CH-07** (Fase 8, aprobado en la revisión de la Parte C de `08-tareas.md`, aplicado al cerrarla el 23 de octubre de 2026). Dependencias de construcción y de datos (2.0) y las de datos de FT-03, FT-04, FT-08, FT-16, FT-19, FT-34, FT-35 y FT-54. Los CA no cambian. Marcas **[F8]**.
