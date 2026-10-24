# Finn 2.0 — Arquitectura del backend (04-backend.md)

**Fase:** 4. **Estado:** **Aprobado — Fase 4 cerrada** (14 de octubre de 2026). Partes A, B1, B2, C y D aprobadas; los ajustes de la revisión de C están marcados [R4]. El código verificado está en `04-backend-verificacion.zip`.

Los cambios de cada revisión están marcados con **[R1]**, **[R2]**, **[R3]** y **[R4]**, y se listan en 0.10.

**Enmiendas de la Fase 5** **[F5]**: los cambios CP-1 a CP-18 de `05-frontend.md` (§0.9, §2.13 y §8 de ese documento), aprobados en su revisión, se aplicaron a este documento al cerrar la Fase 5 (15 de octubre de 2026). Cada sección afectada lleva la marca **[F5]** con el número del cambio; la lista está en 0.9 y en "Enmiendas posteriores", al final.

**Enmiendas de la Fase 6** **[F6]**: los cambios CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22, CF-24 y CF-25 de `06-features.md` (§0.7 de ese documento), aprobados en sus revisiones, se aplicaron a este documento al cerrar la Fase 6 (21 de octubre de 2026). Cada sección afectada lleva la marca **[F6]** con el número del cambio; la lista está en 0.9.2 y en "Enmiendas posteriores". CF-03 (unir deudores) queda diseñado y **diferido** (06 §3.4).

Plan de entrega aprobado:

| Parte | Secciones |
|---|---|
| A — Fundamentos | 0, 1, 2, 4, 5, 7, 13 |
| B1 — Operaciones | 3 |
| B2 — Consultas | 6 |
| C — Integraciones y operación | 8 a 12 y 14 a 17 |
| D — Cierre | 18, 19 |

Las secciones conservan la numeración del encargo. El orden del documento consolidado es el de la entrega: 0, 1, 2, 4, 5, 7, 13, 3, 6, 8 a 12, 14 a 17, 18 y 19.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento define la arquitectura de todo lo que corre en el servidor de Finn 2.0, con el detalle suficiente para que en la Fase 8 cualquier agente cree tareas precisas y las implemente sin tomar decisiones de diseño.

### 0.2 Alcance

- **Incluye:** paquetes y capas, frontera entre capas, operaciones de escritura, lecturas y cálculo de derivados, modelo de errores, tiempo y fechas, webhook de SMS, conciliación por CSV, tareas programadas, notificaciones push, autenticación, configuración, observabilidad, respaldo, prueba de humo y trazabilidad.
- **No incluye:** pantallas y componentes (Fase 5), especificación funcional por feature (Fase 6), plan de pruebas (Fase 7) y tareas (Fase 8). Para cada pantalla conocida sí se define qué datos devuelve su consulta (§6), para que la Fase 5 no invente consultas.
- **No modifica** `00-decisiones.md`, `01-dominio.md`, `02-tecnologias.md` ni `03-base-de-datos.md`. Lo que este documento necesita de ellos y no está decidido se registra como pregunta (0.8), no como decisión.

### 0.3 Precedencia

1. `00-decisiones.md` > `01-dominio.md` > `02-tecnologias.md` > `03-base-de-datos.md` mandan sobre este documento.
2. Este documento manda sobre la implementación del servidor en las fases 5 a 8.

### 0.4 Convenciones

| Marca | Significado |
|---|---|
| **BE-nn** | Decisión de esta fase (registro en 0.6) |
| **OP-nn** | Operación del dominio. OP-01 a OP-48 conservan el número de `01-dominio.md`; OP-49 en adelante son operaciones nuevas (P4-16) |
| **OPT-nn** | Operación técnica (token, push, notificaciones, formatos, exportación, respaldo) |
| **V-nn** | Verificación ejecutada en esta fase (0.7) |
| **QA-n** | Pregunta de la Parte A (0.8) |
| **QB-n** | Pregunta abierta de la Parte B1 (3.0.9) |
| **PR-n**, **EN-n** | Precisión o enmienda aprobada a un documento anterior (0.9) |
| **RZ-…** | Código de rechazo del dominio (catálogo en 3.0.6) |
| **[R1]** … **[R4]** | Cambio de la revisión 1, 2, 3 o 4 (0.10). [R4] aplica la revisión de la Parte C |
| **QC-n** | Pregunta de la Parte C (resueltas en 0.12) |
| **QD-n** | Pregunta de la Parte D (resuelta en 19.4) |
| **SP-nn** | Supuesto o requisito previo (§19.1) |
| **ESC-nn** en §18 | Escenario de `01-dominio.md` §8 |
| **RS-nn** | Riesgo de esta fase (§19.2) |
| **F6-n**, **FX-n** | Pregunta abierta para la Fase 6 u otra fase (§19.3) |
| ⚠ | Depende de algo todavía no disponible (muestras reales, proyecto de Supabase) |
| §n, OP-nn, inv. n, AV-nn, ESC-nn | Referencias a `01-dominio.md` |
| ADR-nn, RT-nn, RK-nn | Referencias a `02-tecnologias.md` |
| DB-nn, HZ-n, 03 §n | Referencias a `03-base-de-datos.md` |

**Nombres en código.** Identificadores en español, sin tildes: `camelCase` para variables y funciones, `PascalCase` para tipos, `kebab-case` para archivos. Tablas, columnas, triggers, funciones SQL y códigos se escriben exactamente como en 03.

### 0.5 Respuestas del Paso 1

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P4-1 | Entornos: local, CI y producción; sin preview (ADR-10) | §14 (Parte C) |
| P4-2 | El cron no cierra nada. Un push de cierre por período, con la reducción de LPA aplicada (SobD + E) y las metas vencidas (AV-17), deduplicado por período | §10, §11 (Parte C) |
| P4-3 | Contrato del parser y de los adaptadores; pruebas con SMS sintéticos; ⚠ lo que dependa de muestras; sin patrones para depósito, pago ni devolución. "Muestras reales" es requisito previo de la implementación del parser en la Fase 8 | §8, §9, §19 |
| P4-4 | Paquetes `@finn/aplicacion` y `@finn/sms`; `apps/web` nunca importa `@finn/db`, verificado en CI | BE-01 a BE-04 (§1) |
| P4-5 | Server Actions para mutaciones de la interfaz; Server Components para lecturas; Route Handlers para clientes que no son la interfaz. `serverActions.bodySizeLimit` configurado | BE-05, BE-06 (§2.2) |
| P4-6 | `aplicar(hechos, comando, hoy)` devuelve cambios, rechazos e impacto; la simulación es la misma llamada sin persistir. Orden de escritura determinista y documentado; un rechazo de la base es error interno | BE-09, BE-15, BE-25 (§2, §4, §7) |
| P4-7 | Previsualizar y confirmar con la revisión vista; si el impacto cambió, nueva previsualización | BE-13 (§4.3) |
| P4-8 | Id generado por el cliente como clave de idempotencia; ante 23505, comparar con la solicitud: coincide → "ya aplicada"; difiere → conflicto de id. Validar UUID | BE-17 (§4.6) |
| P4-9 | `hoy` con `SELECT finn.hoy()` dentro de la transacción; `Intl` solo para convertir instantes a fecha local | BE-12 (§4.2), §13 |
| P4-10 | Reportes de producto §10 con fórmulas [Propio]; gasto semanal por categoría también en esta fase; resto de §16 solo con datos base | §6 (Parte B2) |
| P4-11 | Política de push aprobada, incluidas acciones directas sobre coincidencias y el push de cierre | §11 (Parte C) |
| P4-12 | Inscripción de TOTP en la app; procedimiento de recuperación manual desde el panel | §12 (Parte C) |
| P4-13 | Formatos editables en Ajustes, con validación y "probar contra este SMS"; auditoría dentro de lo que 03 permite | §8 (Parte C); **QA-2** |
| P4-14 | Conciliación sin estado en el servidor; HMAC sobre cuenta, contenido normalizado, vencimiento de 24 h y versión de clave | §9 (Parte C) |
| P4-15 | Exportación JSON versionada y CSV; sin importación en la app | §3, §16 |
| P4-16 | OP-01..48 con su número; OP-49+ nuevas; OPT-nn técnicas | 0.4; §3 |
| P4-17 | Script de prueba de humo con criterios pasa/falla, ejecutado por el usuario; primer paso: verificar la versión real de PostgreSQL | §17 (Parte C) |
| P4-18 | Partes en Markdown; archivo final y zip al aprobar | — |
| Supuestos | Aprobados. Webhook con contrato nuevo `{ texto, remitente }`, `remitente` obligatorio, sin compatibilidad con `{ "sms": … }` de la 1.0; configuración de la macro en §8 | §8 (Parte C) |
| Estructura | Cuatro partes; la B se divide en B1 y B2 | Encabezado |

### 0.6 Registro de decisiones

Cada decisión se desarrolla, con su justificación y alternativas descartadas, en la sección indicada.

| ID | Decisión | Sección |
|---|---|---|
| BE-01 | Paquetes nuevos `@finn/aplicacion` y `@finn/sms` | 1.1 |
| BE-02 | Matriz cerrada de dependencias entre paquetes | 1.3 |
| BE-03 | Cuatro controles independientes de dependencias en CI | 1.5 |
| BE-04 | Puntos de entrada públicos por paquete y marca `server-only` | 1.4 |
| BE-05 | Server Actions para mutaciones, Server Components para lecturas, lista cerrada de Route Handlers | 2.2 |
| BE-06 | `experimental.serverActions.bodySizeLimit = '3mb'` y archivo CSV ≤ 2 MiB en el contrato | 2.2.4 |
| BE-07 | Autorización dentro de cada Server Action y Route Handler, no solo en `proxy.ts` | 2.2.5 |
| BE-08 | Contratos Zod en `@finn/aplicacion/contratos` | 2.6 |
| BE-09 | Contrato público del motor: `calcular`, `aplicar`, selectores y valores | 2.4 |
| BE-10 | Comando resuelto: la aplicación carga el contexto [H] e [I] antes de llamar a `aplicar` | 2.3.3 |
| BE-11 | Servicio de transacciones único (`escribir`, `leer`) en `@finn/db` | 4.1 |
| BE-12 | Primera consulta de toda transacción: revisión, `finn.hoy()` y el instante | 4.2 |
| BE-13 | Previsualizar en lectura; confirmar con `revisionVista` y comparación del impacto | 4.3 |
| BE-14 | `finn.operacion` solo con `set_config(…, true)` y lista cerrada de valores | 4.4 |
| BE-15 | Traductor de cambios en cuatro fases con un orden fijo de tablas | 4.5 |
| BE-16 | `lineas.orden` y `movimiento_lineas.orden` no cambian una vez escritos | 4.5.5 |
| BE-17 | Idempotencia por clase de operación | 4.6 |
| BE-18 | Política de reintentos en el servidor | 4.7 |
| BE-19 | Efectos externos solo después de confirmar | 4.9 |
| BE-20 | Lecturas en `REPEATABLE READ` + `READ ONLY` | 5.1 |
| BE-21 | Carga de hechos con una consulta por tabla que devuelve arreglos JSON compactos | 5.2 |
| BE-22 | Memoria por instancia: hechos por revisión e instantánea por (revisión, hoy). **[R1]** Después de escribir, la memoria se actualiza solo con los valores que devuelve la base, y se invalida ante cualquier duda | 5.3 |
| BE-23 | Presupuesto de rendimiento y disparador de la carga incremental. **[R1]** Disparo también por latencia | 5.6 |
| BE-24 | Formato único de error y siete categorías | 7.1 |
| BE-25 | Todo rechazo de la base es `INTERNO` | 7.4 |
| BE-26 | Registro de errores saneado en `eventos_sistema` | 7.8 |
| BE-27 | Instantes con precisión de milisegundos, tomados después del bloqueo | 13.1 |
| BE-28 | Montos de entrada como texto decimal; montos de salida como enteros en centavos | 13.3 |
| BE-29 | La revisión viaja como cadena decimal | 13.3 |
| BE-30 | Reloj simulado de pruebas con `set_config('finn.hoy', …, true)` | 13.1.4 |
| BE-31 **[R1]** | La aplicación genera los `id` de **todas** las filas nuevas y los entrega al dominio con un generador inyectado. **[R2]** Si la operación tiene id principal, el generador es determinista (UUIDv5 sobre el id principal); la huella del impacto excluye los ids de filas nuevas | 2.4.1, 4.3 |
| BE-32 **[R1]** | El traductor obtiene con `RETURNING` los valores que fija la base (`secuencia`, `revision`) y los incorpora a los hechos nuevos | 4.5.6 |
| BE-33 **[R1]** | Zona horaria de la sesión fijada en `UTC` dentro de cada transacción | 13.6 |
| BE-34 **[R1]** | Catálogo de mensajes en voseo salvadoreño y formatos `$1,234.50` y `dd/mm/aaaa` | 7.10 |
| BE-35 *(B1)* | El nombre de la categoría de pago es el de su tarjeta y lo sigue; nombres de tarjeta únicos | 3.1 (OP-01) |
| BE-36 *(B1)* | OP-31 puede asignar la restitución a pago(t) en la misma operación (AV-22 preseleccionada) | 3.5 (OP-31) |
| BE-37 *(B2)* | Horizonte de "próximos pagos" como parámetro de la consulta: 7 días en Inicio, 30 en Programadas | 6.1, 6.12 |
| BE-38 *(B2)* | AV-01 "después" se registra en `notificaciones` sin push, para que Inicio muestre los cambios retroactivos sin leer | 6.1 |
| BE-39 *(B2)* | Filtros de Presupuesto: sobregiradas, sin fondos suficientes y cubiertas, definidos sobre Disp y Falta | 6.2 |
| BE-40 *(B2)* | Fórmulas [Propio] de los reportes de producto §10 y del gasto semanal por categoría | 6.9 |
| BE-41 *(B2)* | Cuenta de origen propuesta para aprobar un pago de tarjeta recibido por SMS | 6.8 |
| BE-42 **[R3]** | Consulta `formulario` con parámetros por operación: catálogos comunes y contexto propio | 6.14 |
| BE-43 **[R3]** | Clave de agrupación de comercios: patrón de la regla que coincide o comercio normalizado, con variantes | 6.9.6 |
| BE-44 *(C)* | El webhook responde 200 al guardar y procesa en `after()`; los SMS sin resultado se recuperan después de 2 min (**[R4]** también en cada petición del webhook, BE-62) | 8.2, 8.6 |
| BE-45 *(C)* | La interpretación del SMS se hace fuera del bloqueo global | 8.4 |
| BE-46 *(C)* | Política de patrones: `recheck`, solo `safe` o polinomial de grado ≤ 2. **[R4]** Límite de 640 caracteres para interpretar (PR-2); la CI bloquea solo el despliegue hasta reescribir F-1..F-3 | 8.3, 8.5 |
| BE-47 *(C)* | Auditoría de formatos en la misma transacción, con la fila anterior y la nueva | 8.7 |
| BE-48 *(C)* | La clasificación de la conciliación vive en el dominio y se repite en OP-46 y OP-47 | 9.5 |
| BE-49 *(C)* | Formato de la carga firmada `version.cuerpo.mac` con HMAC-SHA256 | 9.6 |
| BE-50 *(C)* | Puesta al día desde el layout con `after()`, sin bloqueo propio. **[R4]** Evento `puesta_al_dia_inicio`: no se lanza si hay uno de hoy con menos de 5 min y sin fin | 10.1 |
| BE-51 *(C)* | Push de cierre solo del último período cerrado | 10.2 |
| BE-52 *(C)* | Purga de suscripciones push sin renovar en 60 días | 10.2 |
| BE-53 *(C)* | Política de push por motivo: urgencia, TTL, agrupación y acciones | 11.2 |
| BE-54 *(C)* | Protección de las acciones desde notificaciones: origen, cabecera propia y `getUser()` | 11.5 |
| BE-55 *(C)* | `getClaims()` para lecturas y `getUser()` para escrituras y acciones sensibles | 12.3 |
| BE-56 *(C)* | Recuperación sin factores con la API de administración, desde la computadora del usuario | 12.6 |
| BE-57 *(C)* | Verificación al arrancar de que el proceso corre en UTC | 14.2 |
| BE-58 *(C)* | Medición de la carga desde `iad1` con una función temporal y un esquema temporal | 17.2 |
| BE-59 *(C)* | Cuerpo del webhook ≤ 16 KiB; token solo en la cabecera | 8.1 |
| BE-60 **[R4]** | Cuerpo inválido con token válido: se guarda el cuerpo crudo (UTF-8 no estricto, sin NUL, ≤ 2.000 puntos de código) con `remitente = 'desconocido'`, intento en `error` y 200 | 8.2 |
| BE-61 **[R4]** | Dos variantes del contrato del webhook (JSON y texto con `X-Finn-Remitente`); se elige con la prueba en el teléfono y el endpoint acepta solo la de `FINN_WEBHOOK_FORMATO` | 8.1.1 |
| BE-62 **[R4]** | Cada petición del webhook barre hasta 5 SMS sin resultado | 8.6 |
| BE-63 *(D)* | Trazabilidad verificada por script: cada escenario y cada aviso tiene al menos una operación y una consulta | 18.4 |

### 0.7 Verificación realizada

**Entorno.**
- PostgreSQL 16.15 local. Node.js 22.22 (producción usará Node 24, ADR-03).
- Prisma ORM 7.10.0 con `@prisma/adapter-pg` 7.10.0 y `pg`. Cliente generado con `prisma generate` (generador `prisma-client`).
- Igual que en la Fase 3, los binarios nativos del motor de esquemas no se pueden descargar desde este entorno (403 en `binaries.prisma.sh`). `prisma generate` funciona sin ellos; `migrate` queda para la prueba de humo (§17).
- Esquema: **subconjunto de 03**. Las funciones `finn.rechazar`, `finn.clave_bloqueo`, `finn.tomar_bloqueo`, `finn.tiene_bloqueo`, `finn.hoy`, `finn.operacion`, `finn.tg_exigir_bloqueo`, `finn.tg_avanzar_revision` y `finn.tg_estampar_revision` se copiaron literalmente de 03 §10.4.5. Las tablas `revision`, `transacciones`, `lineas` y `asignaciones` llevan solo las columnas necesarias, con los triggers `a_exigir_bloqueo`, `b_avanzar_revision`, `c_estampar_revision`, una versión reducida de `g_asignacion` (FN002) y una reducida de `x_verificar_transaccion` (diferida, FN003). Roles `finn_migraciones` y `finn_app` con los atributos y privilegios de 03 §8.

| # | Qué se verificó | Resultado |
|---|---|---|
| V-01 | Escritura sin bloqueo | Rechazada con `FN001`. Prisma la entrega como `PrismaClientKnownRequestError` `P2039`, con el SQLSTATE en `meta.driverAdapterError.cause.originalCode` |
| V-02 | Escritura con bloqueo y varias sentencias | La revisión sube exactamente 1; las filas quedan estampadas con la revisión nueva; la primera consulta devuelve revisión, `finn.hoy()` e instante |
| V-03 | Restricción diferida que falla al confirmar | Llega como `DriverAdapterError` (no es una clase de Prisma), con `cause.originalCode = 'FN003'` |
| V-04 | Regla inmediata de un trigger | `FN002` como `P2039`, igual forma que V-01 |
| V-05 | `set_config('finn.operacion', 'fusion', true)` | Habilita la excepción dentro de la transacción y no se filtra a las siguientes seis transacciones del pool |
| V-06 | Inserción con un id ya existente enviado por el cliente | `P2002` con `meta.driverAdapterError.cause` = `UniqueConstraintViolation`, índice `transacciones_pkey` y tabla `transacciones` |
| V-07 | Lectura con `isolationLevel: RepeatableRead` + `SET TRANSACTION READ ONLY` como primera sentencia | `transaction_isolation = repeatable read`, `transaction_read_only = on`; un intento de escritura falla con `25006` |
| V-08 | Dos escritores con el patrón aprobado (`READ COMMITTED`, bloqueo primero) | El segundo espera ~1,3 s y, después del bloqueo, ve la fila confirmada por el primero |
| V-09 | Contraste: `REPEATABLE READ` en la escritura | Con una lectura antes del bloqueo, ve datos viejos. **Con el bloqueo como primera sentencia, también ve datos viejos** (la instantánea se toma en esa sentencia). Confirma la decisión de ADR-06 |
| V-10 | `lock_timeout` de 10 s de `finn.tomar_bloqueo()` | Falla a los 10,04 s con `55P03`, como `P2010` |
| V-11 | SQL que emite Prisma 7 en una transacción interactiva | `BEGIN`, `SET TRANSACTION ISOLATION LEVEL …`, sentencias con el protocolo extendido sin nombre, `COMMIT`/`ROLLBACK`. **Ningún `SAVEPOINT`** |
| V-12 | Privilegios de `finn_app` | No puede ejecutar `finn.operacion()` (`42501`); solo puede fijar el parámetro. Un `UPDATE` sin bloqueo que no afecta filas también falla con `FN001` (trigger por sentencia) |
| V-13 | Carga de 117.015 filas (50.000 transacciones, 60.007 líneas, 7.002 asignaciones) en `REPEATABLE READ` | `findMany`: 459–708 ms. `$queryRaw` por columnas: 316–557 ms. `$queryRaw` con `json_agg` de arreglos: 270–336 ms y 12,2 MB. Detalle en 5.6 |
| V-14 | Ida y vuelta de `@db.Date` | `2026-10-10` vuelve como `2026-10-10T00:00:00.000Z`. Con `TZ=America/El_Salvador`, `getDate()` devuelve **9**; `getUTCDate()` y `toISOString().slice(0, 10)` devuelven el día correcto. Confirma RK-04 |
| V-15 | Formatos de la frontera | La primera lectura de 4.2 devuelve la revisión, `hoy` y el instante como `2026-10-14T04:04:00.549Z`; `json_build_array` serializa una columna `date` como `"2026-10-10"` |
| V-16 **[R1]** | Corrección 1: la memoria de la instancia que escribe frente a una carga nueva, con 50.000 transacciones y 60.000 líneas en la base. Operación 1: alta de una transacción con tres líneas. Operación 2: edición que actualiza una línea, elimina otra e inserta una nueva (BE-16) | Con BE-31 y BE-32: **idénticas** en ambas operaciones (0 diferencias). Control negativo sin incorporar `RETURNING`: difiere en `secuencia` y `revision` de las filas nuevas, que es exactamente el error descrito en la corrección |
| V-17 **[R1]** | Escritura y lectura de `timestamptz` con Prisma 7 y `@prisma/adapter-pg` | **Hallazgo.** Prisma envía el instante como hora UTC **sin zona**, y PostgreSQL lo interpreta en la zona de la sesión. Con la sesión en `America/Guatemala`, `2026-10-14T04:00:00Z` queda guardado como `10:00Z`; al leer con Prisma un valor escrito por SQL (`04:00Z`) devuelve `22:00Z` del día anterior. No depende de `TZ` del proceso (probado con `UTC` y `America/El_Salvador`). Con la sesión en `UTC` todo coincide. Lo corrige BE-33. La primera corrida de V-16 detectó el desfase de 6 horas |
| V-18 **[R1]** | `Intl` en Node 24.21 (ICU 78.3) | `es-SV` moneda USD: `$1,234.50` y `-$45.00`; fecha `{day:'2-digit', month:'2-digit', year:'numeric'}`: `05/10/2026` (día/mes/año). Coincide con lo pedido; no hace falta otra configuración regional |
| V-19 **[R2]** | Ids secundarios deterministas (UUIDv5 con el id principal como espacio de nombres y el índice como nombre), con `node:crypto` | La misma operación produce los mismos ids en dos llamadas; un id principal distinto produce ids distintos; versión 5 y variante RFC 9562; el vector de ejemplo de RFC 9562 (`www.example.com` en el espacio DNS) da `2ed6657d-e927-568b-95e1-2665a8aea6a2`, como el RFC |
| V-20 **[R2]** | Huella del impacto con un aviso que cita las filas nuevas, generando los ids al azar en cada llamada | Incluyendo los ids nuevos, las huellas difieren (confirmación infinita, el problema del ajuste 1). Excluyéndolos (marcas `@nueva#k`), coinciden |
| V-21 **[R2]** | Ningún trigger de 03 modifica filas [M] distintas de la que se escribe | Revisión del código de 03 §10.4.5 y §10.4.6 (no ejecutada): ver 5.3.1 |
| V-22 *(B2)* | Referencia semanal con redondeo acumulado (6.9.3) | 100.000 casos aleatorios con períodos de 11, 28, 29, 30 y 31 días: la suma de las semanas es exactamente lo asignado y ninguna referencia es negativa |
| V-23 *(C)* | Intérprete de SMS (prototipo de `@finn/sms`) con los 3 patrones de 03 §9.5 y 13 SMS sintéticos | 13 de 13 con el resultado esperado, incluidos montos inválidos, fecha inexistente, coincidencia doble (`no_reconocido`) y el riesgo conocido de un comercio con 8 dígitos (fecha incorrecta). Detalle en 8.3 |
| V-24 *(C)* | Análisis de retroceso con `recheck` 4.5 y tiempo del peor caso | Los 3 patrones de 03 son **polinomiales de grado 3**: 3,8 s (F-1) y 3,3 s (F-2) con 2.000 caracteres de ataque. Tres patrones exponenciales de control se detectan. Detalle en 8.5 |
| V-25 *(C)* | Decodificación de CSV con PapaParse 5.7.0 | UTF-8 sin y con BOM, Windows-1252 y ASCII dan las mismas celdas, sin errores (9.3) |
| V-26 *(C)* | Carga firmada con HMAC-SHA256, vencimiento y versión de clave | Válida, otra cuenta, monto alterado, vencida, clave anterior y versión retirada se comportan como 9.6 |
| V-27 **[R4]** | Cuerpo del webhook (prototipo `webhook/cuerpo.ts`) contra las `CHECK` de 03 §3.17 (`sql/05_sms_subconjunto.sql`) | 12 de 12: válidos en ambas variantes; JSON sin escapar, sin remitente, vacío, 3.000 emojis, NUL, UTF-8 inválido y `Content-Type` de la otra variante se guardan como inválidos. Sin limpieza, la base rechaza NUL (`22021`), 2.001 caracteres y vacío (`23514`). Detalle en 8.2 |
| V-28 **[R4]** | EN-2: `finn.purgar_eliminaciones()` y regla R14 | `finn_app` no puede borrar ni actualizar directo (`42501`); la función borra solo > 30 días, fija máx + 1, devuelve 0 la segunda vez, nunca baja el valor; un rol sin permiso falla; R14 detecta `EXECUTE` a `PUBLIC` y `SECURITY INVOKER`. Detalle en 10.2 |
| V-29 *(D)* | Trazabilidad de §18 con `t17.py` (BE-63) | T1 a T7 pasan con el documento consolidado; el control negativo falla con los errores esperados. Detalle en 18.4 |
| V-30 *(D)* | Costo de las verificaciones diferidas al confirmar una escritura masiva (RK-22), con el trigger **reducido** del subconjunto (`t18.sh`) | ~13 µs por fila: 1.000 filas en ~15 ms, 10.000 en ~130 ms. Indicativa; la medición con el trigger completo queda para la Fase 8 (FX-4) |

Los scripts (`sql/00_subconjunto.sql` a `sql/05_sms_subconjunto.sql`, la migración de EN-2, `t1.ts` a `t15.ts`, `t16.sh`, `t17.py`, `t18.sh`, `sms/interpretar.ts`, `conc/decodificar.ts`, `webhook/cuerpo.ts`) van en el zip, con un `LEEME.md` que relaciona cada V-nn con su script. **[R1]** Para V-16 se agregaron al subconjunto `finn.secuencia_creacion`, la columna `transacciones.secuencia` y el trigger `c_asignar_secuencia`, copiados de 03.

### 0.8 Preguntas de la Parte A (resueltas) **[R1]**

| # | Pregunta | Resolución |
|---|---|---|
| QA-1 | `@finn/db`, `@finn/sms` y `@finn/conciliacion` necesitan funciones de `Centavos` y `FechaLocal`, no solo sus tipos | Aprobada la recomendación: punto de entrada `@finn/dominio/valores`, importable en ejecución por `db`, `sms` y `conciliacion`. Precisión de ADR-20 en 0.9 |
| QA-2 | Auditoría de cambios de formatos bancarios (P4-13) | Aprobada la recomendación: `eventos_sistema` con `datos.tipo = 'auditoria_formato'`, exceptuada de la purga de 90 días. Enmienda de 03 §13.4 en 0.9 |

### 0.9 Precisiones y enmiendas a documentos aprobados **[R1]** **[R4]**

PR-1 y EN-1, aprobadas en la revisión de la Parte A, no cambian el esquema. PR-2 y EN-2, aprobadas en la revisión de la Parte C; EN-2 agrega una función (migración aditiva). PR-3, aprobada en la revisión final. Cada una está anotada, con una línea, en la sección "Enmiendas posteriores" al final del documento afectado (01: PR-3; 02: PR-1; 03: PR-2, EN-1 y EN-2).

| # | Documento | Texto aprobado | Texto vigente | Origen |
|---|---|---|---|---|
| PR-1 | `02-tecnologias.md`, ADR-20 (dependencias permitidas) | `db → dominio` (solo tipos); `conciliacion → dominio` (solo tipos) | `db`, `sms` y `conciliacion` → `@finn/dominio/valores` (`Centavos` y `FechaLocal`: constructores, validación, conversión desde texto, aritmética) **en ejecución**; del resto de `@finn/dominio`, solo tipos. `sms` es un paquete nuevo (BE-01). Matriz completa en 1.3 | QA-1 |
| EN-1 | `03-base-de-datos.md`, §13.4 (purga de la tarea diaria) | "La tarea diaria purga `eliminaciones` (30 días) y `eventos_sistema` (90 días)" | La purga de 90 días de `eventos_sistema` **excluye** las filas con `datos->>'tipo' = 'auditoria_formato'`, que se conservan sin límite. El resto de la regla no cambia | QA-2 |
| PR-2 **[R4]** | `03-base-de-datos.md`, §7.6 (definición de "coincide") | Un formato coincide si su patrón encuentra coincidencia y los normalizadores tienen éxito | Además: si el texto tiene **más de 640 caracteres**, no se evalúa ningún patrón y el resultado es `no_reconocido` con motivo `demasiado_largo`. El SMS se guarda completo (hasta 2.000). Ver 8.3 | QC-2 |
| EN-2 **[R4]** | `03-base-de-datos.md`, §5.3 y §13.4 (purga de `eliminaciones`), §8.3 y DB-11 (privilegios de `finn_app`) | La tarea diaria purga `eliminaciones` y fija `revision_minima_incremental`; `finn_app` solo tiene `SELECT` sobre ambas tablas | Función nueva `finn.purgar_eliminaciones()` (`SECURITY DEFINER`, dueña `finn_migraciones`, `search_path = finn, pg_catalog`, `EXECUTE` solo para `finn_app`), plazo fijo de 30 días, actualiza `revision_minima_incremental` sin bajarla. Migración `20261014000000_m_purgar_eliminaciones` (`finn:manual`); regla de catálogo **R14**. Los privilegios de tabla de `finn_app` no cambian. Ver 10.2 | QC-4 |
| PR-3 | `01-dominio.md`, ESC-50 (paso 1) | Paso 1: el registro automático registra las ocurrencias del 25 ene (P1, cerrado) y del 25 feb, con AV-01 por P1 | Paso 1: el registro automático registra solo el 25 feb (P2); el 25 ene queda pendiente con AV-23 (`ocurrencia_en_periodo_cerrado`). Paso 1b nuevo: registro de un toque (OP-43) del 25 ene con AV-01, que llega al estado final del paso 1 original. El paso 2 (idempotencia) no cambia. Tabla completa en 19.4 | QD-1 ([R2] ajuste 2) |

#### 0.9.1 Enmiendas de la Fase 5 a este documento **[F5]**

Aprobadas en la Fase 5 (`05-frontend.md`) y aplicadas aquí al cerrarla. No cambian el esquema de 03 ni el dominio de 01. CP-6 aplica aquí la precisión PF-3, que es de `02-tecnologias.md` ADR-07 (anotada en su sección "Enmiendas posteriores").

| CP | Qué cambia | Secciones de este documento |
|---|---|---|
| CP-1 | Catálogo cerrado de destinos de las notificaciones (`DestinoNotificacion`) y carga útil del push (`CargaPush`) | 6.12.5, 11.1, 11.4 |
| CP-2 | `bandejaPorRevisar` en el `Encabezado` | 6.0.2 |
| CP-3 | Lecturas interactivas por Server Action (lista cerrada: `sugerencia` y búsqueda de compras), con valor precargado (precisión de CP-16) | 2.2.1, 6.14.3 |
| CP-4 | `estadoSeguridad()` para Ajustes > Seguridad | 6.11, 12.2 |
| CP-5 | El permiso de notificaciones se pide solo tras un gesto | 11.1 |
| CP-6 | La interfaz importa `@finn/dominio/valores` solo en los formularios y puede sumar lo que el usuario escribe como ayuda visual (PF-3) | 1.3, 13.3 |
| CP-7 | `import * as z from 'zod'` y configuración regional aparte | 2.6 |
| CP-8 | Forma de `Propuesta` | 3.0.3, 6.0.3 |
| CP-9 | `navegacion` en las consultas con período | 6.3, 6.6, 6.9.3 |
| CP-10 | `formulario`: asignado en el catálogo (`asignar`), ocurrencia de una programada, variante `regla` | 6.14.1, 6.14.2, 6.14.4 |
| CP-11 | Funciones de autenticación de la interfaz | 12.2 |
| CP-12 | `filtros` en los DTO de reportes; `GastoSemanalDto` y `DatosBaseDto` extienden `Encabezado` | 6.9 |
| CP-13 | Una consulta lanza `ExcepcionFinn` | 2.3.2, 6.0.1 |
| CP-14 | `proxy.ts`: cabecera `x-finn-ruta`; no redirige `/ingresar` | 12.4 |
| CP-15 | `aprobado` en la salida de OP-37 y OP-50 | 3.0.3, OP-37 |
| CP-16 | Variante `formulario({ operacion: 'conciliar' })`; la previsualización de OP-46 es la de la operación que ejecuta | 6.14.1, 6.14.4, OP-46 |
| CP-17 | Route Handler `GET /serwist/[path]` (service worker) y su exclusión en `proxy.ts` | 1.2, 2.2.1, 12.4 |
| CP-18 | `etiqueta` en `CargaPush` | 11.4 |

#### 0.9.2 Enmiendas de la Fase 6 a este documento **[F6]**

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
| CF-25 | Datos de los componentes visuales de la identidad: barra de gastado, resumen del historial, progreso de la meta, intensidad del calendario, próximo pago, uso sin reservar, barras de la posición neta, porcentaje y diferencia de la referencia semanal, `porRegla` y variante "cubrir el sobregiro" de OP-16 | 6.2, 6.3, 6.5, 6.8, 6.9.3, 6.14.4 | 5.8 |
| FD-31 | Regla única de qué monto puede llevar un push (precisión de 11.4; la aplican CF-07 y CF-24) | 11.4 | 0.15 |

### 0.10 Registro de cambios de las revisiones

| Cambio | Origen | Secciones |
|---|---|---|
| Respuestas a QA-1 y QA-2; precisión PR-1 de ADR-20 y enmienda EN-1 de 03 §13.4 | Revisión de la Parte A | 0.8, 0.9, 1.3 |
| La aplicación genera todos los `id` de filas nuevas y los entrega al dominio (BE-31) | Corrección 1 a | 2.3.1, 2.4.1, 4.6.1 |
| El traductor obtiene `secuencia` y `revision` con `RETURNING` y los incorpora a los hechos nuevos (BE-32) | Corrección 1 b | 4.2, 4.5.6 |
| Invalidación de la memoria ante cualquier fallo o duda; prueba obligatoria en CI de memoria = carga nueva | Corrección 1 c y d | 5.3 |
| Verificación de la corrección 1 (V-16) | Corrección 1 d | 0.7 |
| Hallazgo: `timestamptz` con Prisma 7 depende de la zona de la sesión (V-17); zona `UTC` fijada en cada transacción (BE-33) | Verificación de la corrección 1 | 0.7, 4.2, 5.1, 13.6 |
| Mensajes en voseo salvadoreño; montos `$1,234.50` y fechas `dd/mm/aaaa`, verificados en Node 24 (V-18, BE-34) | Corrección 2 | 7.6, 7.7, 7.10, 13.3, 13.4 |
| Disparador de la carga incremental también por latencia (p95 > 500 ms durante 7 días); medición de la transferencia en la prueba de humo | Corrección 3 | 5.6 |
| `getClaims()` frente a `getUser()` queda para evaluarse en §12 | Sugerencia para la Parte C | 2.2.5 |
| **[R2]** Ids secundarios deterministas con UUIDv5 cuando hay id principal; huella del impacto sin ids de filas nuevas; prueba obligatoria previsualizar → confirmar (V-19, V-20) | Ajuste 1 de la revisión de A r1 | 2.4.1, 4.3, 4.6.1 |
| **[R2]** Confirmado que ningún trigger de 03 modifica otras filas [M]; la memoria solo refleja cascadas (V-21) | Ajuste 1 de la revisión de A r1 | 5.3.1 |
| **[R2]** QB-1 y QB-2 aprobadas; OP-52 Renombrar deudor | Revisión de B1 | 3.0.9, 3.10 |
| **[R2]** `nombre_repetido` considera las categorías de pago de tarjetas archivadas, con su mensaje | Revisión de B1 (BE-35) | 3.0.6, OP-01, OP-02 |
| **[R2]** OP-43 automático no registra ocurrencias de períodos cerrados: quedan pendientes con notificación | Ajuste 2 | 3.0.5, OP-43 |
| **[R2]** Cuenta de origen propuesta para pagos de tarjeta por SMS (BE-41) | Ajuste 3 | OP-37, 6.8 |
| **[R2]** Conciliación manual sin CSV: no está en 01; anotada como pregunta para la Fase 6 | Pregunta de la revisión de B1 | 0.11 |
| **[R3]** Consulta `formulario` (BE-42), nuevos selectores y revisión de flujos de §3 sin datos | Ajuste 1 de la revisión de B2 | 6.0.1, 6.0.5, 6.13, 6.14 |
| **[R3]** `top_comercios` agrupa por regla de comercio o comercio normalizado y devuelve las variantes (BE-43) | Ajuste 2 | 6.9.2, 6.9.6 |
| **[R3]** Reporte `cashflow` renombrado `remanente`, presentado como "Lo que te quedó del período" | Ajuste 3 | 6.9.2, 6.9.5 |
| **[R3]** Gasto semanal: referencia 0 si lo asignado es negativo | Revisión propia | 6.9.3 |
| **[R4]** QC-1: cuerpo inválido con token válido se guarda y responde 200 (BE-60, V-27) | Revisión de C, QC-1 | 8.1, 8.2 |
| **[R4]** Dos variantes del contrato del webhook, regla para elegir y una sola aceptada (BE-61, `FINN_WEBHOOK_FORMATO`); prueba con comillas y saltos de línea | Revisión de C, QC-1 | 8.1.1, 8.8, 14.2 |
| **[R4]** Límite de 640 caracteres para interpretar (PR-2) | Revisión de C, QC-2 | 8.3, 8.5, 0.9 |
| **[R4]** Reescritura de F-1..F-3 en la Fase 8 con migración nueva; trabajo `politica-patrones` bloquea solo el despliegue | Revisión de C, QC-3 | 8.5, 14.1 |
| **[R4]** Enmienda EN-2: `finn.purgar_eliminaciones()`, migración y regla R14 (V-28) | Revisión de C, QC-4 | 10.2, 0.9 |
| **[R4]** El webhook barre hasta 5 SMS sin resultado por petición (BE-62) | Ajuste 1 | 8.2, 8.6, 10.2 |
| **[R4]** Puesta al día con evento `puesta_al_dia_inicio` y ventana de 5 min (BE-50) | Ajuste 2 | 10.1, 15.2 |
| **[R4]** Plan B de reintentos en la macro y prueba en el teléfono | Ajuste 3 | 8.8, §19 (RS-05) |
| Parte D: trazabilidad (§18, V-29, BE-63), medición indicativa de RK-22 (V-30), y supuestos, riesgos y preguntas (§19). Pregunta QD-1 sobre ESC-50 | Plan de entrega | 18, 19 |
| QD-1 aprobada como precisión PR-3 de 01 ESC-50 | Revisión final | 0.9, 18.2, 19.4 |
| Secciones "Enmiendas posteriores" agregadas al final de 01, 02 y 03, con una línea por enmienda | Revisión final | 0.9 |
| Migración de la reescritura de patrones nombrada `_m_` (convención DB-22 de 03) | Revisión propia de la revisión final | 8.5 |
| Estado: Aprobado — Fase 4 cerrada | Aprobación del usuario | Encabezado, 19.5 |
| **[F5]** Enmiendas CP-1 a CP-18 de la Fase 5 y precisión PF-3; sección "Enmiendas posteriores" | Cierre de la Fase 5 (`05-frontend.md`) | 0.9.1 y las secciones de su tabla |
| **[F6]** Enmiendas CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22, CF-24 y CF-25 de la Fase 6 y precisión FD-31; línea en "Enmiendas posteriores" | Cierre de la Fase 6 (`06-features.md`) | 0.9.2 y las secciones de su tabla |

### 0.11 Anotaciones para la Parte D (§18 y §19) **[R2]**

Todas quedaron aplicadas en §19: D-1 → F6-1, D-2 → SP-01, D-3 → RS-01, D-4 → F6-2, D-5 → RS-05, D-6 → RS-06.

| # | Anotación | Destino |
|---|---|---|
| D-1 | **Conciliación manual sin CSV.** 01 no la incluye: OP-45 a OP-47 parten de un estado de cuenta importado (§1.8 de 01, "comparación contra un estado de cuenta importado"), y la única forma de cerrar una diferencia es la transacción de ajuste que el usuario crea (supuesto 11 modificado). Para cuentas o bancos sin CSV, ¿se agrega una conciliación en la que el usuario escribe el saldo del banco y Finn registra la diferencia aceptada y propone el ajuste? Pregunta abierta para la Fase 6; no se agrega en esta fase | §19, preguntas para la Fase 6 |
| D-2 | **Muestras reales de SMS y CSV** como requisito previo de la implementación del parser y de los adaptadores en la Fase 8 (P4-3) | §19, supuestos y requisitos previos |
| D-3 | **Riesgo de egreso** posiblemente antes del año 4–5 de RK-02 (5.6) | §19, riesgos |
| D-4 **[R3]** | **Flujo de efectivo real** (variación de los saldos de las cuentas de efectivo por período): no lo pide el producto; si se quiere, pregunta para la Fase 6 (6.9.5) | §19, preguntas para la Fase 6 |
| D-5 *(C)* **[R4]** | **Reintentos de MacroDroid** ante un 5xx: N-01 cuenta con ellos; ⚠ confirmar en el dispositivo. Si la acción no los ofrece, plan B en la macro (8.8). Si tampoco es posible, un fallo al guardar pierde el SMS (se recupera conciliando) | §19, riesgos (RS-05) |
| D-6 *(C)* | **Rotación del token del webhook:** los SMS que llegan entre la rotación y la actualización de la macro reciben 401 y no se guardan | §19, riesgos |

### 0.12 Preguntas de la Parte C (resueltas) **[R4]**

| # | Pregunta | Resolución | Dónde |
|---|---|---|---|
| QC-1 | Cuerpo del webhook inválido con un token válido (MacroDroid podría no escapar comillas ni saltos de línea en el JSON) | Aprobada con cambios: se guarda igual (`texto` = cuerpo crudo truncado al máximo de 03, `remitente = 'desconocido'`), movimiento en `error`, respuesta 200 (BE-60). Además, prueba en el teléfono con comillas y saltos de línea y, si no escapa, variante B del contrato (`text/plain` + `X-Finn-Remitente`); el endpoint acepta solo la elegida (BE-61) | 8.1.1, 8.2, 8.8 |
| QC-2 | Límite de longitud para interpretar | Aprobada: más de 640 caracteres → `no_reconocido`, motivo `demasiado_largo`. Precisión PR-2 de 03 §7.6 | 8.3, 0.9 |
| QC-3 | Los formatos sembrados por 03 no pasan la política de patrones | Aprobada: se reescriben en la Fase 8 con las muestras reales en una migración nueva; hasta entonces la CI bloquea solo el despliegue a producción | 8.5, 14.1 |
| QC-4 | La tarea diaria no puede purgar `eliminaciones` | Aprobada con cambios: función `finn.purgar_eliminaciones()` sin parámetro (30 días fijos), que también actualiza `revision_minima_incremental`. Enmienda EN-2 con su migración y la regla R14 (V-28) | 10.2, 0.9 |

---

## 1. Estructura del monorepo y capas

### 1.1 Paquetes (BE-01)

pnpm workspaces sin Turborepo (ADR-20). Se agregan dos paquetes a los de ADR-20:

| Paquete | Responsabilidad | ¿Puro? | Dependencias de ejecución externas |
|---|---|---|---|
| `apps/web` | Next.js 16: páginas, componentes, Server Actions (adaptadores), Route Handlers (adaptadores), `proxy.ts`, service worker | No | `next`, `react`, `@supabase/ssr`, `@serwist/turbopack` |
| `@finn/aplicacion` *(nuevo)* | Casos de uso: operaciones de escritura, consultas por pantalla, webhook, conciliación, tareas, push, exportación, autorización, configuración, contratos Zod, errores y mensajes | No (orquesta E/S) | `zod`, `web-push` |
| `@finn/dominio` | Motor puro: hechos, `calcular`, `aplicar`, selectores, invariantes, `Centavos`, `FechaLocal`, modelos de préstamo (Anexo A de 01) | **Sí** | Ninguna (ADR-07) |
| `@finn/db` | Prisma 7: esquema, migraciones, cliente, servicio de transacciones, carga de hechos, traductor de cambios, conversiones de fechas y montos, repositorios de tablas [H], [I] y [T] | No | `@prisma/client`, `@prisma/adapter-pg`, `pg` |
| `@finn/sms` *(nuevo)* | Interpretación de un SMS contra formatos bancarios dados como datos (03 §7.6): coincidencia, normalizadores, validación de patrones | **Sí** (sin E/S ni reloj) | Biblioteca de análisis de expresiones regulares (ADR-09; se elige en la Parte C) |
| `@finn/conciliacion` | Decodificación del CSV, adaptadores por formato, normalización (ADR-17) | **Sí** (recibe bytes, sin E/S) | `papaparse` |
| `@finn/config` | `tsconfig`, ESLint y Prettier compartidos | — | — |
| `tools/` | `db/` (bootstrap, catálogo, reglas, lint de migraciones), `respaldo/`, `humo/` (prueba de humo, §17), `ci/` (controles de dependencias de 1.5) | No | — |

**Justificación.** La lógica de aplicación necesita una frontera que el lint pueda hacer cumplir: si viviera en `apps/web`, nada impediría que una página llamara a Prisma directamente. `@finn/sms` es puro y probado sin base, igual que `@finn/conciliacion`; separarlo de la aplicación permite probarlo con miles de SMS sintéticos en milisegundos.

**Alternativas descartadas.** Casos de uso dentro de `apps/web/src/servidor` (descartada en P4-4); parser dentro de `@finn/dominio` (el motor no debe conocer formatos de texto bancarios ni la biblioteca de expresiones regulares).

### 1.2 Árbol de carpetas

```
apps/web/
  next.config.ts                  bodySizeLimit (2.2.4), sin caché de datos
  src/
    proxy.ts                      redirección optimista a /ingresar (2.2.5)
    app/
      (finn)/…                    páginas autenticadas (Fase 5)
      ingresar/…                  login y TOTP (Parte C, §12)
      api/
        sms/route.ts              webhook (§8)
        tareas/diaria/route.ts    cron (§10)
        respaldo/[evento]/route.ts  endpoint del respaldo (§16)
        exportar/[formato]/route.ts descarga de exportaciones (§3)
        notificaciones/accion/route.ts acciones desde el service worker (§11)
      serwist/[path]/route.ts     **[F5]** service worker compilado por Serwist, estático (CP-17)
    servidor/
      acciones/<area>.ts          'use server'; un archivo por área (2.2.2)
      sesion.ts                   lectura de la sesión de Supabase para las acciones
    sw/                           service worker (Serwist + push)
packages/aplicacion/
  src/
    index.ts                      punto de entrada de servidor ('server-only')
    contratos/                    esquemas Zod de entrada y DTO de salida (2.6)
    errores/                      ErrorFinn, categorías, mensajes en español (§7)
    operaciones/<area>/OP-nn-*.ts definición de cada operación (2.3)
    consultas/<pantalla>.ts       una consulta por pantalla (§6)
    sms/ conciliacion/ tareas/ push/ exportacion/ autenticacion/
    tiempo/                       fechaLocalDeInstante (§13)
    config/                       variables de entorno validadas (§14)
packages/dominio/
  src/
    index.ts                      API pública (2.4)
    valores/                      Centavos, FechaLocal → punto de entrada "./valores" (PR-1)
    hechos/                       tipos de los hechos (espejo de las tablas [M])
    calculo/                      §4 de 01: períodos, saldos, D2, Disp, LPA, metas…
    operaciones/                  aplicar(): una función por OP
    selectores/                   lecturas de la instantánea
    avisos/                       AV-01 a AV-24
    prestamos/                    Anexo A
  escenarios/                     ESC-01..ESC-50 como datos (ADR-19)
packages/db/
  prisma.config.ts  prisma/       (03 §10.1)
  src/
    index.ts                      API pública (2.5)
    cliente.ts                    PrismaClient único con @prisma/adapter-pg
    transacciones.ts              escribir() y leer() (§4, §5)
    hechos/cargar.ts              carga JSON por tabla (5.2)
    hechos/traductor.ts           cambios → sentencias (4.5)
    mapeo/fechas.ts mapeo/montos.ts   conversiones (§13)
    errores.ts                    extracción del SQLSTATE (7.3)
    repositorios/                 tablas [H], [I], [T]
    generado/prisma/              cliente generado (no se versiona)
packages/sms/  src/{index.ts, interpretar.ts, normalizadores.ts, validar-formato.ts}
packages/conciliacion/  src/{index.ts, decodificar.ts, adaptadores/<formato>.ts}
```

### 1.3 Reglas de dependencia (BE-02)

"→" significa "puede importar". Toda dependencia no listada está prohibida.

| Desde \ Hacia | `dominio` (API) | `dominio/valores` | `db` | `sms` | `conciliacion` | `aplicacion` (servidor) | `aplicacion/contratos`, `/errores` |
|---|---|---|---|---|---|---|---|
| `apps/web` (servidor) | solo tipos | sí | **nunca** | nunca | nunca | sí | sí |
| `apps/web` (cliente: `'use client'`, `sw/`) | solo tipos | **[F5]** solo en `src/formularios/**` y `src/componentes/formularios/**`; en el resto, solo `import type` (CP-6) | nunca | nunca | nunca | **nunca** | sí |
| `@finn/aplicacion` | sí | sí | sí | sí | sí | — | — |
| `@finn/db` | solo tipos | **sí** (PR-1) **[R1]** | — | nunca | nunca | nunca | nunca |
| `@finn/sms` | solo tipos | **sí** (PR-1) **[R1]** | nunca | — | nunca | nunca | nunca |
| `@finn/conciliacion` | solo tipos | **sí** (PR-1) **[R1]** | nunca | nunca | — | nunca | nunca |
| `@finn/dominio` | — | — | nunca | nunca | nunca | nunca | nunca |

Reglas adicionales:
- Solo `@finn/db` importa `@prisma/client`, `@prisma/adapter-pg`, `pg` o el cliente generado (ADR-21).
- Dentro de `@finn/db`, solo `transacciones.ts` llama a `$transaction` (BE-11).
- `@finn/dominio` no importa ningún paquete de E/S, Node, Next ni Prisma, y no usa `Date`, `Date.now`, `Math.random` ni `new Intl.DateTimeFormat` (ADR-21).
- `@finn/sms` y `@finn/conciliacion` tampoco usan `Date` ni reloj: reciben las fechas como texto y devuelven `FechaLocal`.
- Ningún paquete importa paquetes de Prisma 8 (`@prisma/orm-*`) (ADR-21).

**Justificación.** La matriz deja una sola vía hacia la base (`web → aplicacion → db`) y un solo lugar con fórmulas (`dominio`), que es lo que piden ADR-07, ADR-20 y P4-4. El cliente del navegador solo recibe contratos y tipos, nunca código de servidor.

### 1.4 Puntos de entrada públicos (BE-04)

Cada paquete declara `exports` en su `package.json`; cualquier ruta interna (`@finn/db/src/...`) es inaccesible para Node y para el empaquetador.

| Paquete | Puntos de entrada |
|---|---|
| `@finn/dominio` | `.` (API de 2.4), `./valores` (PR-1), `./escenarios` (solo `devDependencies` de otros paquetes) |
| `@finn/aplicacion` | `.` (servidor; empieza con `import 'server-only'`), `./contratos`, `./errores` |
| `@finn/db` | `.` (2.5) |
| `@finn/sms` | `.` |
| `@finn/conciliacion` | `.` |

`import 'server-only'` en `@finn/aplicacion` hace que Next falle en la compilación si un componente de cliente lo importa. `./contratos` y `./errores` no importan nada de servidor (verificado por la regla de 1.5 c).

**Alternativa descartada:** un único punto de entrada por paquete; obligaría a que la interfaz cargue código de servidor para usar los esquemas Zod en formularios.

### 1.5 Verificación en CI (BE-03)

Cuatro controles en el job de lint (ADR-21, paso 1). Cada uno detecta una vía de violación distinta:

| # | Control | Herramienta | Detecta | Falla si |
|---|---|---|---|---|
| a | **Manifiestos** | `tools/ci/verificar-dependencias.mjs`: compara las `dependencies` y `devDependencies` de cada `package.json` del workspace con la matriz de 1.3 | Un paquete que declara una dependencia prohibida (por ejemplo, `apps/web` con `@finn/db`) | Cualquier dependencia `@finn/*` no permitida |
| b | **Aislamiento de pnpm** | `node-linker=isolated` (por defecto) y `hoist=false`, `public-hoist-pattern=[]` en `.npmrc` | Una importación de un paquete no declarado: pnpm no lo deja accesible | Falla la compilación o los tipos |
| c | **Grafo de importaciones** | `dependency-cruiser` sobre el código fuente, con reglas que reproducen la matriz de 1.3, incluidas importaciones dinámicas (`import()`), `require` y reexportaciones | Importaciones entre capas que ESLint no ve (reexportaciones, dinámicas) y que `./contratos` o `./errores` no lleguen a código de servidor | Alguna regla violada |
| d | **ESLint** | `no-restricted-imports` por paquete y por carpeta (por ejemplo, `apps/web/src/**/*.tsx` con `'use client'` no importa `@finn/aplicacion`), más las reglas de ADR-21 | La violación en el editor, antes del PR | Error de lint |

Además, la compilación de Next falla si un componente de cliente importa `@finn/aplicacion` (`server-only`).

**Justificación.** Los controles a y b impiden la dependencia; c verifica el grafo real; d da la señal temprana. Un agente que desactive una regla de ESLint con un comentario sigue bloqueado por a, b y c. Además, `verificar-dependencias.mjs` rechaza cualquier comentario `eslint-disable` que mencione una regla de frontera.

**Alternativas descartadas:** solo ESLint (un `eslint-disable` lo anula); Nx o Turborepo con etiquetas de proyecto (ADR-20 descartó Turborepo por tamaño).

---

## 2. Frontera entre capas

### 2.1 Vista general

```
                ┌────────────────────────── apps/web ──────────────────────────┐
 Navegador ──►  │ Server Component ─► consultas.<pantalla>()                   │
 (sesión AAL2)  │ Server Action    ─► operaciones.<OP>.previsualizar/confirmar │
                │ Route Handler    ─► sms / tareas / respaldo / exportar /     │
 MacroDroid ──► │                     acciones de notificación                 │
 Vercel Cron ─► │  (autorización + Zod + traducción a HTTP o ResultadoAccion)  │
 GitHub Act. ─► └───────────────────────────────┬──────────────────────────────┘
                                                ▼
                ┌──────────────────────── @finn/aplicacion ────────────────────┐
                │ resolver comando (contexto [H]/[I]) → dominio.aplicar()      │
                │ consultas → dominio.selectores; mensajes y errores           │
                └───────┬───────────────────────────────┬──────────────────────┘
                        ▼                               ▼
         ┌──────── @finn/dominio ───────┐     ┌──────── @finn/db ──────────────┐
         │ calcular / aplicar /         │     │ escribir() / leer()            │
         │ selectores (puro)            │     │ cargar hechos, traductor,      │
         └──────────────────────────────┘     │ repositorios, mapeos           │
                                              └──────────────┬─────────────────┘
                                                             ▼
                                              PostgreSQL (esquema finn, triggers)
```

### 2.2 Entrada (BE-05)

#### 2.2.1 Qué usa cada caso

| Caso | Mecanismo | Por qué |
|---|---|---|
| Lecturas de pantallas | **Server Components** que llaman a `consultas.<pantalla>()` de `@finn/aplicacion` | Sin HTTP intermedio; la sesión se lee de las cookies; el resultado llega como DTO serializable |
| Mutaciones desde la interfaz (OP-xx y OPT-xx), incluida la previsualización y la subida del CSV | **Server Actions** | CSRF resuelto por Next (comparación de `Origin`); tipado de extremo a extremo; un solo viaje que devuelve el resultado y el árbol actualizado |
| Webhook de MacroDroid | **Route Handler** `POST /api/sms` | Cliente externo; códigos HTTP 401/5xx/200 obligatorios (N-01) |
| Tarea diaria | **Route Handler** `GET /api/tareas/diaria` | Vercel Cron llama por HTTP con `Authorization: Bearer CRON_SECRET` (ADR-08) |
| Eventos del respaldo y de la restauración | **Route Handler** `POST /api/respaldo/{respaldo|restauracion|deriva}` | GitHub Actions (ADR-22, 03 §12) |
| Descarga de exportaciones | **Route Handler** `GET /api/exportar/{json|csv}` | Descarga con `Content-Disposition`; las Server Actions no transmiten archivos |
| Acciones desde una notificación | **Route Handler** `POST /api/notificaciones/accion` | El service worker no puede invocar Server Actions; usa `fetch` con la cookie de sesión (P4-11) |
| **[F5]** Lecturas interactivas (lista cerrada): `consultas.sugerencia({ comercio })` (6.14.3) y `consultas.formulario({ operacion: 'devolver', busqueda })` (6.14.4) | **Server Action de solo lectura**, con el envoltorio `lectura(definicion)`: `exigirSesionLectura()`, contrato Zod, `leer()`, sin `revalidatePath` y sin escrituras. Devuelve `ResultadoAccion` | Responden mientras el usuario escribe, o una vez con un valor precargado (conciliación); un Server Component obligaría a volver a pintar el formulario. Requisitos del cliente: espera de 300 ms, mínimo 2 caracteres, cancelación de la anterior y límite de resultados. Deben quedar en ≤ 30 ms en el servidor, porque Next despacha las Server Actions de una en una (CP-3) |
| **[F5]** Servir el service worker compilado | **Route Handler** `GET /serwist/[path]` (`createSerwistRoute` de `@serwist/turbopack`), estático (`dynamic = 'force-static'`, `dynamicParams = false`) | `@serwist/turbopack` compila el service worker en `next build` y lo sirve desde una ruta, con `Service-Worker-Allowed: /`. No lee la sesión, no lee la base y no recibe datos (CP-17) |

La lista de Route Handlers es **cerrada**: agregar uno es una decisión de diseño, no de implementación.

**Alternativas descartadas.** API REST para todas las mutaciones (descartada en P4-5); lecturas por Route Handlers consumidas desde el cliente (duplica serialización y autorización sin beneficio, y abre la puerta a cachés de cliente con números viejos, RK-11).

#### 2.2.2 Forma de una Server Action

Un archivo por área en `apps/web/src/servidor/acciones/` (por ejemplo `transacciones.ts`, `presupuesto.ts`). Cada acción es una línea que delega en un envoltorio común:

```ts
'use server';
import { operaciones } from '@finn/aplicacion';
import { accion } from '../accion';

export const registrarGasto = accion(operaciones.OP20_registrarGasto);
```

`accion(definicion)` hace, en este orden:
1. `exigirSesionAal2()` (2.2.5). Si falla: `{ ok: false, error: NO_AUTORIZADO }`.
2. Valida la entrada con `definicion.contrato` (Zod). Si falla: `VALIDACION` con los campos (7.6).
3. Llama a `definicion.previsualizar` o `definicion.confirmar` según `entrada.modo` (4.3).
4. Si el resultado es correcto y hubo escritura: `revalidatePath('/', 'layout')` (5.8).
5. Devuelve `ResultadoAccion<T>` (7.1). **Nunca lanza** hacia el cliente, salvo `redirect()` de Next.

#### 2.2.3 Forma de un Route Handler

Cada Route Handler: autentica según su cliente (§8, §10, §12, §16), valida el cuerpo con Zod, llama a `@finn/aplicacion` y traduce `ErrorFinn` a HTTP con la tabla de 7.9. Declara `export const runtime = 'nodejs'` y `export const dynamic = 'force-dynamic'`.

#### 2.2.4 Límite del cuerpo de las Server Actions (BE-06)

**[F6]** **CF-19.** La variante en lote de OP-07 lleva de 1 a 15 elementos por llamada; con nombres de hasta 80 caracteres ocupa menos de 4 KB, dentro de este límite.

```ts
// apps/web/next.config.ts
const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '3mb' },
  },
};
```

- La documentación de Next 16.4 ubica la opción en `experimental.serverActions.bodySizeLimit`, con 1 MB por defecto, y aclara que el límite incluye los bytes que agrega `multipart/form-data`.
- El contrato del CSV (§9) exige un archivo **≤ 2 MiB** (2.097.152 bytes). El límite de 3 MB deja margen para el sobre del formulario y el resto de campos.
- Un archivo mayor se rechaza con `VALIDACION` en el contrato, con un mensaje claro; uno que supere los 3 MB lo rechaza Next antes de llegar a la acción (`413`), y la interfaz muestra el mismo mensaje (Fase 5).

**Alternativa descartada:** `'2mb'` exacto; un CSV de 2 MiB no cabría con el sobre del formulario.

#### 2.2.5 Autorización (BE-07)

- `proxy.ts` hace una comprobación **optimista**: si no hay cookie de sesión, redirige a `/ingresar`. No es una barrera de seguridad: Next documenta que una Server Function queda fuera del `proxy` si cambia el `matcher` o la ruta.
- **Cada** Server Action (en `accion()`), cada Server Component con datos (en la consulta) y cada Route Handler para el usuario ejecutan `exigirSesionAal2()`: obtiene el usuario con `supabase.auth.getUser()` (verificado contra Supabase, no solo la cookie), exige `aal = 'aal2'` y que el id sea `FINN_USUARIO_ID` (ADR-08). El detalle está en §12 (Parte C).
- El webhook, el cron y el respaldo no usan sesión: cada uno tiene su secreto (§8, §10, §16).
- **[R1]** §12 (Parte C) evaluará si para las lecturas basta `getClaims()` (JWT verificado localmente con las claves asimétricas del proyecto), dejando `getUser()` para escrituras y acciones sensibles, según latencia y riesgo de sesión revocada. **[R4]** Resuelto en §12: `getClaims()` para lecturas y `getUser()` para escrituras y acciones sensibles (BE-55).

### 2.3 Aplicación

#### 2.3.1 Definición de una operación

Cada OP y OPT es un módulo que exporta una `DefinicionOperacion`:

```ts
interface DefinicionOperacion<Entrada, Resuelto, Salida> {
  id: `OP-${string}` | `OPT-${string}`;
  contrato: z.ZodType<Entrada>;              // 2.6
  idempotencia: ClaseIdempotencia;           // 4.6
  operacionDeclarada?: 'fusion' | 'eliminar_cuenta';  // 4.4; solo OP-12 y OP-06
  // Carga lo que aplicar() necesita y no está en los hechos [M] (BE-10)
  resolver(lector: LectorTx, entrada: Entrada): Promise<Resuelto>;
  // Construye el comando del dominio a partir de la entrada resuelta.
  // [R1] Incluye el id del hecho principal (de la entrada) y el generador de ids (2.4.1)
  comando(resuelto: Resuelto, instante: Instante, ids: GeneradorIds): ComandoDominio;
  // Escrituras en tablas que el motor no modela ([H] técnicas o [T]), si las hay
  extra?(escritor: EscritorTx, resuelto: Resuelto, resultado: ResultadoAplicar): Promise<void>;
  // Efectos después de confirmar (4.9)
  posteriores?(resultado: ResultadoAplicar): EfectoPosterior[];
  salida(resultado: ResultadoAplicar, resuelto: Resuelto): Salida;
}
```

`@finn/aplicacion` expone por cada operación dos funciones construidas con esta definición: `previsualizar(entrada)` y `confirmar(entrada)` (4.3). Las tareas internas (cron, webhook) usan `confirmar` sin `revisionVista`.

#### 2.3.2 Consultas

Cada pantalla tiene una función `consultas.<pantalla>(parametros)` (catálogo en §6, Parte B2). Su forma es siempre: `leer()` (5.1) → instantánea → selectores del dominio → DTO. Una consulta **no** calcula montos: solo selecciona, filtra, ordena y pagina lo que devuelven los selectores (inv. 27).

**[F5] Errores de una consulta (CP-13).** Una consulta devuelve su DTO o **lanza** `ExcepcionFinn` (de `@finn/aplicacion/errores`), que lleva un `ErrorFinn` completo (7.1). Para `INTERNO`, el `idError` ya está registrado en `eventos_sistema` (7.8) antes de lanzar. `NO_AUTORIZADO` lleva `datos.aal` (`'ninguna'` o `'aal1'`) para que la interfaz elija entre `/ingresar` y `/ingresar/verificar` (12.3). `ExcepcionFinn` se puede importar en el servidor de `apps/web`; la interfaz la traduce en un solo lugar (`consultar()`, 05 §7.3).

#### 2.3.3 Comando resuelto (BE-10)

`aplicar(hechos, comando, hoy)` recibe solo hechos [M] (los que carga el motor, 03 §0.4). Las operaciones de revisión, conciliación y formatos también necesitan filas [H] o [I] (el movimiento y sus líneas, el SMS, los movimientos candidatos a duplicado, el formato). `resolver()` las lee dentro de la misma transacción, después del bloqueo, y las incluye **en el comando**. Así la firma aprobada en P4-6 no cambia y el dominio sigue sin E/S.

**Alternativa descartada:** cargar también las tablas [H] en los hechos del motor; crecería la carga en 25.000–50.000 movimientos a los 10 años sin que ningún derivado los use (inv. 13).

### 2.4 Dominio: contrato público (BE-09)

```ts
// @finn/dominio
export function calcular(hechos: Hechos, hoy: FechaLocal): Instantanea;

export function aplicar(hechos: Hechos, comando: ComandoDominio, hoy: FechaLocal): ResultadoAplicar;

export type ResultadoAplicar =
  | { ok: false; rechazos: readonly Rechazo[] }                // 7.5
  | { ok: true;
      cambios: readonly Cambio[];                                // 4.5
      operacionDeclarada?: 'fusion' | 'eliminar_cuenta';
      hechosNuevos: Hechos;                                      // para la memoria (5.3)
      impacto: Impacto;                                          // 4.3
      avisos: readonly AvisoOperacion[] };                       // AV antes/después

export const seleccionar: Selectores;                           // §6
export function verificarInvariantes(i: Instantanea): readonly Violacion[]; // §6 de 01
```

Reglas:
- Un rechazo de negocio **no** es una excepción: vuelve en `rechazos`. `aplicar` solo lanza ante errores de programación (comando mal formado).
- `aplicar` calcula la instantánea antes y después y verifica las invariantes de §6 de 01 sobre el estado resultante (§5.0.1); si alguna falla, devuelve un rechazo `invariante_violada` (que la aplicación trata como `INTERNO`, porque significa un error del motor).
- `Impacto` contiene, para el período activo: Δ LPA, Δ Disp(c, A) por categoría afectada, Δ S(t) y Δ RE(t) por tarjeta, Δ de la reducción proyectada de LPA al cierre y la lista de avisos (§5.0.3). Es comparable por igualdad estructural (4.3).
- Las fórmulas internas no se exportan (ADR-07).

**Cambio** (lo consume el traductor de 4.5):

```ts
type Cambio =
  | { tipo: 'insertar';   tabla: TablaEscribible; fila: FilaHecho }
  | { tipo: 'actualizar'; tabla: TablaEscribible; id: Uuid; campos: Partial<FilaHecho> }
  | { tipo: 'eliminar';   tabla: TablaEscribible; id: Uuid }
  | { tipo: 'eliminarConciliacionesDeCuenta'; cuentaId: Uuid };   // 03 §4.6.4, HZ-1
```

`TablaEscribible` son las tablas [M] y [H] de 03 §0.4. Las filas usan tipos del dominio (`Centavos`, `FechaLocal`, `Instante`, `Uuid`) y nombres de campo iguales a los del modelo Prisma (03 §10.3), lo que hace mecánica la traducción.

#### 2.4.1 Identificadores y valores que fija la base (BE-31) **[R1]**

**Problema (corrección 1).** Si la base asignara valores que el dominio no conoce, los hechos que el dominio devuelve diferirían de los que hay en la base, y la memoria de la instancia que escribe (5.3) también. Una operación posterior que apunte a esa fila usaría un `id` inexistente, y D2 podría ordenar distinto. Hay tres valores así:

| Valor | Quién lo fija | Cómo lo obtiene el dominio |
|---|---|---|
| `id` de toda fila nueva (principal y secundarias: efectos, líneas, subtipos, programada_lineas…) | **La aplicación** (BE-31) | El comando trae el `id` del hecho principal (lo envía el cliente, 4.6.1) y un `GeneradorIds` para las filas secundarias |
| `secuencia` de `transacciones` y `condonaciones` | La base (`c_asignar_secuencia`, DB-21) | No lo conoce; el traductor la devuelve con `RETURNING` (BE-32) |
| `revision` de cada fila escrita | La base (`c_estampar_revision`) | No lo conoce; el traductor la devuelve con `RETURNING` (BE-32) |

**Generador inyectado.**

```ts
// @finn/dominio
export interface GeneradorIds { siguiente(): Uuid }

// @finn/aplicacion/ids.ts — [R2]
// Con id principal: determinista. Índice 1, 2, 3… en el orden en que el dominio pide ids.
export const generadorDerivado = (principal: Uuid): GeneradorIds => {
  let indice = 0;
  return { siguiente: () => uuidv5(String(++indice), principal) };   // espacio de nombres = id principal
};
// Sin id principal (por ejemplo, la primera asignación de una celda): aleatorio.
export const generadorAleatorio = (): GeneradorIds => ({ siguiente: () => crypto.randomUUID() as Uuid });
// En pruebas: un contador determinista ('00000000-0000-4000-8000-000000000001', …)
```

- **[R2] Determinismo (ajuste 1 a).** Si la operación tiene id principal (las de clase *creación*, 4.6), la aplicación le entrega al dominio `generadorDerivado(idPrincipal)`: UUIDv5 (RFC 9562) con el id principal como espacio de nombres y el índice de la fila como nombre. Como `aplicar` es determinista, previsualizar, confirmar y cualquier reintento producen **los mismos** ids. Las operaciones sin id principal usan `generadorAleatorio()`; sus ids nuevos nunca entran en la huella (4.3).
- **[R2] Dónde vive el cálculo.** UUIDv5 usa SHA-1 (`node:crypto`), así que vive en `@finn/aplicacion/ids.ts`, no en el dominio (ADR-07, ADR-21: sin módulos de Node en `@finn/dominio`). El dominio recibe siempre un `GeneradorIds` y no distingue cuál es; lo que pide el ajuste (mismos ids en todas las llamadas) se cumple igual. V-19 verificó la implementación contra el vector de ejemplo del RFC.
- El dominio sigue puro: no usa `crypto` ni azar; llama al generador que recibe.
- Toda fila que el dominio inserta lleva su `id` desde el comando. El traductor **siempre** envía el `id` (4.5.2); el `DEFAULT gen_random_uuid()` de 03 queda solo para inserciones fuera de la aplicación (SQL manual, migraciones de datos).
- En `hechosNuevos`, las filas nuevas llevan `secuencia` y `revision` como **pendientes** (`null`); la memoria solo acepta los hechos cuando BE-32 las completó (5.3).
- Las filas que la base elimina en cascada (efectos y líneas de una transacción eliminada, subtipos de una cuenta, meta de una categoría, líneas de una programada; DB-12) también se quitan de `hechosNuevos`: el dominio replica las cascadas de 03. La prueba de 5.3 detecta cualquier diferencia.

**Alternativas descartadas.** Una lista fija de `id` reservados (la aplicación no sabe de antemano cuántas filas creará la operación); dejar que la base genere los `id` secundarios y recargar después de cada escritura (anula la ventaja de la memoria y duplica el egreso, RK-02).

### 2.5 Persistencia: contrato de `@finn/db`

```ts
export function escribir<T>(trabajo: TrabajoEscritura<T>, opciones?: OpcionesEscritura): Promise<T>; // §4
export function leer<T>(trabajo: TrabajoLectura<T>): Promise<T>;                                     // §5
export type LectorTx;   // consultas de solo lectura sobre [M], [H], [I], [T] dentro de la transacción
export type EscritorTx; // LectorTx + aplicarCambios(cambios) + repositorios [T]
export function sqlstateDe(error: unknown): ErrorBase | null;                                        // 7.3
```

- **Cliente.** Un `PrismaClient` por proceso (guardado en `globalThis` en desarrollo), con `new PrismaPg({ connectionString: DATABASE_URL, max: 3 })` (ADR-05: de 1 a 3 conexiones por instancia).
- Ninguna función de `@finn/db` devuelve tipos de Prisma: devuelve tipos del dominio o DTO propios. `Date` nunca sale del paquete (§13).

### 2.6 Validación con Zod (BE-08)

| Frontera | Dónde vive el esquema | Quién lo aplica |
|---|---|---|
| Entrada de Server Actions y Route Handlers | `@finn/aplicacion/contratos` | `accion()` (2.2.2) y cada Route Handler |
| Cuerpo del webhook | `@finn/aplicacion/contratos/sms.ts` | Route Handler `/api/sms` |
| Filas extraídas de un CSV | `@finn/conciliacion` (salida de cada adaptador) | El propio paquete |
| Formato bancario al guardar | `@finn/aplicacion/contratos/formatos.ts` + `@finn/sms` (compilación y análisis) | OPT de formatos (Parte C) |
| Variables de entorno | `@finn/aplicacion/config` | Al arrancar (Parte C, §14) |
| Filas leídas de la base | **No se validan con Zod** | — |

- El dominio no depende de Zod (ADR-18); recibe tipos ya validados.
- Las filas de la base no se revalidan: las restricciones de 03 ya las garantizan y validar 200.000 filas por carga costaría más que cargarlas (5.6). El mapeo está tipado.
- **Primitivos compartidos** (`contratos/primitivos.ts`): `uuid` (`z.uuid()`, RFC 9562, cualquier versión; P4-8), `fechaLocal` (13.2), `montoTexto` y `montoTextoConSigno` (13.3), `revision` (13.3), `textoLimpio` (equivalente al "texto limpio" de 03 §0.4).
- Los mensajes de Zod se traducen a español con un mapa de errores propio (7.6).
- **[F5] Forma de importar (CP-7).** Todo esquema de `@finn/aplicacion/contratos` y de `apps/web` usa `import * as z from 'zod'`; la configuración regional en español se importa aparte (`import { es } from 'zod/locales'`). Una regla de lint prohíbe `import { z } from 'zod'`. Se mantiene Zod clásico (ADR-18); `zod/mini` queda descartado. 05 midió que en la compilación de Next las dos formas de importar pesan lo mismo; la regla se conserva por coherencia.

**Alternativa descartada:** esquemas en `apps/web`; el webhook, el cron y las pruebas de integración necesitan los mismos esquemas sin depender de Next.


---

## 4. Patrón transaccional único

### 4.1 Servicio de transacciones (BE-11)

Toda escritura de hechos pasa por `escribir()` de `@finn/db/transacciones.ts`, y toda lectura del motor por `leer()` (§5). Es el **único** módulo del repositorio que llama a `prisma.$transaction`. Fuera de él, ningún código recibe el `PrismaClient`: las operaciones solo ven `LectorTx` y `EscritorTx`, que envuelven el cliente de la transacción.

**Justificación.** ADR-06 exige que el protocolo (bloqueo primero, aislamiento, sin savepoints) no se repita en cada caso de uso. Con un solo módulo, un agente no puede olvidar un paso. El trigger `a_exigir_bloqueo` sigue siendo la última defensa (V-01).

**Alternativa descartada:** un decorador o envoltorio que cada operación aplica por su cuenta; se puede omitir.

### 4.2 Secuencia de una escritura (BE-12)

**[F7]** **CT-01 y CT-02.** En el paso 3, el instante del estado base es `finn.instante()` (en producción, `clock_timestamp()`), no `clock_timestamp()` directo; los pasos 2 y 3 fijan también `finn.desfase_ms` cuando el reloj de prueba está permitido (13.1.4). Donde esta sección explica BE-27 "con `clock_timestamp()`, no con `now()`", léase "con `finn.instante()` (`clock_timestamp()` en producción), no con `finn.ahora()`"; la justificación no cambia. **CT-06:** `finn.tomar_bloqueo()` deja además una marca local de la transacción que `finn.tiene_bloqueo()` exige; para la aplicación no cambia nada. Detalle en `07-pruebas.md` §4.4 y §19.5.

Opciones de Prisma: `{ isolationLevel: ReadCommitted, timeout: 20_000, maxWait: 5_000 }` (ADR-06; `timeout` ≥ 20 s porque la espera del bloqueo puede durar hasta 10 s).

| Paso | Qué hace | SQL o llamada |
|---|---|---|
| 1 | Toma el bloqueo global. **Primera sentencia** de la transacción | `SELECT finn.tomar_bloqueo()` |
| 2 | **[R1]** Fija la zona de la sesión en UTC (BE-33) y, solo en pruebas, el reloj simulado (BE-30) | `SELECT set_config('TimeZone', 'UTC', true)` y `SELECT set_config('finn.hoy', $1, true)` |
| 3 | Lee el estado base. Es la **primera lectura**, ya con el bloqueo | `SELECT valor::text AS revision, finn.hoy()::text AS hoy, to_char(date_trunc('milliseconds', clock_timestamp()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS instante FROM finn.revision WHERE id = 1` |
| 4 | Obtiene los hechos: de la memoria si `revision` coincide (5.3); si no, los carga (5.2) | — |
| 5 | Comprueba la idempotencia (4.6) | Lecturas puntuales por id |
| 6 | Resuelve el comando: carga el contexto [H] e [I] (BE-10) | `definicion.resolver()` |
| 7 | Aplica en memoria | `dominio.aplicar(hechos, comando, hoy)` |
| 8 | Si hay rechazos: termina sin escribir | `ROLLBACK` (no se escribió nada) |
| 9 | Si la operación requiere confirmación, compara el impacto (4.3) | — |
| 10 | Si la operación es OP-12 u OP-06, declara la excepción (4.4) | `SELECT set_config('finn.operacion', $1, true)` |
| 11 | Escribe los cambios en el orden de 4.5 y recoge los valores que fija la base (**[R1]** BE-32) | `EscritorTx.aplicarCambios()` → `ValoresDeLaBase` |
| 12 | Escrituras extra de la operación, si las hay ([H] técnicas o [T]) | `definicion.extra()` |
| 13 | Lee la revisión resultante (los triggers la subieron si se tocó una tabla [M]). **[R1]** Completa `hechosNuevos` con los valores del paso 11 y verifica que toda `revision` devuelta sea igual a la revisión resultante (4.5.6) | `SELECT valor::text FROM finn.revision WHERE id = 1` |
| 14 | Devuelve; Prisma ejecuta `COMMIT`. Las restricciones diferidas se evalúan aquí (V-03) | `COMMIT` |
| 15 | Después del `COMMIT`: actualiza la memoria con `(revisionNueva, hechosNuevos)` completados, o la **invalida** si el paso 13 no pudo completarlos (**[R1]** 5.3); ejecuta los efectos posteriores (4.9) | — |

Notas:
- **[R1] Zona de la sesión.** El paso 2 es obligatorio en toda transacción, de escritura o de lectura (13.6, V-17).
- **Por qué `READ COMMITTED`.** En `REPEATABLE READ` la instantánea se toma en la primera sentencia que no es de control, que sería la del bloqueo, antes de esperar. V-09 lo comprobó: con `REPEATABLE READ` la escritura ve datos viejos aun con el bloqueo primero. En `READ COMMITTED` cada lectura posterior al bloqueo ve todo lo confirmado (V-08), y como todo escritor de hechos toma el mismo bloqueo, nada cambia los hechos durante la transacción (ADR-06).
- **`hoy` y los triggers coinciden.** `finn.hoy()` usa `now()`, que es fijo durante toda la transacción. El paso 3 y los triggers (`f_fechas_hoy`, `g_asignacion`, `g_vigencia`) obtienen así el mismo día. El caso de 03 §4.1 (petición que cruza la medianoche) deja de existir dentro de una transacción (P4-9).
- **El instante se toma después del bloqueo** con `clock_timestamp()`, no con `now()`: `now()` es el inicio de la transacción, anterior a la espera del bloqueo, y dos escrituras podrían recibir instantes en orden inverso al de confirmación. Detalle en 13.1 (BE-27).
- **Escrituras que no son de hechos.** Guardar el SMS (OP-35 paso 1) y las tablas [T] no usan `escribir()` sino funciones de repositorio sin bloqueo (03 §5.1). Registrar un movimiento con estado `error` sí usa `escribir()` (03 §5.1, nota).

### 4.3 Previsualizar y confirmar (BE-13)

Cada operación expone dos funciones (P4-7):

**`previsualizar(entrada)`**
1. Se ejecuta con `leer()` (sin bloqueo, `REPEATABLE READ`, §5).
2. Resuelve el comando, ejecuta `aplicar` y **no persiste**.
3. Devuelve `{ revisionVista, huellaImpacto, impacto, avisos, rechazos }`.
   - `revisionVista`: la revisión leída.
   - `huellaImpacto`: SHA-256 en hexadecimal de la serialización canónica de `impacto` y `avisos` (claves ordenadas, montos como enteros).
   - **[R2] Sin ids de filas nuevas (ajuste 1 b).** Antes de serializar, todo valor igual al id de una fila que la operación inserta (los de los cambios `insertar`) se reemplaza por la marca `@nueva#k`, con `k` = orden de la fila en la lista de cambios. Así la huella no depende de cómo se generaron esos ids (V-20). Los ids de filas existentes sí entran: si cambia la categoría o la tarjeta afectada, el impacto cambió.

**`confirmar(entrada & { revisionVista?, huellaImpacto? })`**
1. Ejecuta la secuencia de 4.2 hasta el paso 8.
2. **Paso 9:** si `aplicar` produjo algún aviso de la clase "antes de confirmar" (AV-01, AV-10, AV-11, AV-12, AV-13, AV-15, AV-16; 01 §5.0.7), o la operación siempre exige confirmación (OP-06, OP-12, OP-19):
   - si la entrada no trae `huellaImpacto`, no escribe y devuelve `REQUIERE_CONFIRMACION` con la previsualización;
   - si la trae y es distinta de la recalculada, no escribe y devuelve `REQUIERE_CONFIRMACION` con la previsualización nueva;
   - si es igual, continúa.
3. Si no hay avisos previos, confirma directamente: las operaciones simples (por ejemplo, un gasto en el período activo) tienen un solo paso.

Se compara la **huella** y no solo la revisión: algunas operaciones dependen de filas [H] (un movimiento editado en otra pestaña) que no cambian la revisión. La revisión sirve para el diagnóstico y para que la interfaz detecte datos viejos.

**[R2] Prueba obligatoria (ajuste 1 c).** Para cada operación que puede requerir confirmación, una prueba de integración ejecuta `previsualizar` y después `confirmar` con la `revisionVista` y la `huellaImpacto` recibidas, sobre un estado sin cambios intermedios, y exige que la confirmación **escriba al primer intento**. Nunca puede devolver `REQUIERE_CONFIRMACION` dos veces seguidas con el mismo estado. La prueba recorre los escenarios de 01 §8 que pasan por esas operaciones y una muestra de la prueba de propiedades.

**Alternativas descartadas.** Ejecutar siempre sobre el estado actual sin comparar (descartada en P4-7); bloquear durante la previsualización (retendría el bloqueo mientras el usuario lee).

### 4.4 `finn.operacion` (BE-14)

- Solo dos operaciones declaran una excepción, con estos valores exactos (03 §13.4, DB-20):

| Operación | Valor | Excepción de la base que habilita |
|---|---|---|
| OP-12 Fusionar categorías | `fusion` | inv. 18 y 20 en `g_asignacion`; cambio de categoría de asignaciones |
| OP-06 Eliminar cuenta | `eliminar_cuenta` | F1 en `g_asignacion`; `finn.eliminar_conciliaciones_de_cuenta`; `e_solo_insercion` en `conciliaciones` y `cambios_posteriores` |

- La fija `escribir()` en el paso 10 con `set_config('finn.operacion', $1, true)`, equivalente a `SET LOCAL`, y solo si `DefinicionOperacion.operacionDeclarada` lo indica. El tipo admite solo esos dos valores.
- `set_config(…, true)` no se filtra a otras transacciones de la misma conexión (V-05).
- `finn_app` no tiene `EXECUTE` sobre `finn.operacion()` (03 §8.3; V-12); la aplicación nunca la lee.
- Una regla de lint prohíbe los textos `'fusion'`, `'eliminar_cuenta'` y `finn.operacion` fuera de `transacciones.ts` y de las dos definiciones.

### 4.5 Traductor de cambios (BE-15)

`EscritorTx.aplicarCambios(cambios)` convierte la lista de `Cambio` (2.4) en sentencias de Prisma, en un orden **determinista** que no depende del orden en que el dominio emitió los cambios.

#### 4.5.1 Orden de tablas

| # | Tabla | # | Tabla |
|---|---|---|---|
| 1 | `vigencias_ciclo` | 14 | `transacciones` |
| 2 | `instituciones` | 15 | `efectos` |
| 3 | `cuentas` | 16 | `lineas` |
| 4 | `tarjetas` | 17 | `condonaciones` |
| 5 | `prestamos` | 18 | `ocurrencias_resueltas` |
| 6 | `inversiones` | 19 | `cambios_posteriores` |
| 7 | `grupos` | 20 | `asignaciones` |
| 8 | `categorias` | 21 | `formatos_bancarios` |
| 9 | `metas` | 22 | `reglas_comercio` |
| 10 | `deudores` | 23 | `sms_recibidos` |
| 11 | `programadas` | 24 | `sms_procesamientos` |
| 12 | `programada_lineas` | 25 | `movimientos` |
| 13 | `conciliaciones` | 26 | `movimiento_lineas` |

Cada tabla aparece después de todas las tablas a las que apuntan sus claves foráneas hacia filas **nuevas** de la misma operación. `asignaciones` va en el puesto 20 (y no junto a `categorias`) para que, al eliminar en orden inverso, sus filas se borren antes que la transacción de saldo inicial, como pide el orden de OP-06 (03 §4.6.4).

#### 4.5.2 Cuatro fases

| Fase | Qué cambios | Orden | Motivo |
|---|---|---|---|
| **F1. Desvincular** | Cada `actualizar` que cambia una clave foránea cuyo valor anterior apunta a una fila que esta misma lista **elimina** | Tablas en orden 1→26; dentro de la tabla, por `id` | Las FK de 03 son `RESTRICT` e inmediatas (DB-12): hay que quitar o reapuntar la referencia antes de borrar. Casos: OP-29 (movimiento a `descartado` con `transaccion_id` nulo antes de borrar la transacción, 03 §4.6.1); OP-12 (líneas, condonaciones, programadas y reglas que pasan de la categoría origen a la destino antes de eliminar la origen) |
| **F2. Eliminar** | Todos los `eliminar` y el cambio `eliminarConciliacionesDeCuenta` | Tablas en orden 26→1; dentro de la tabla, por `id`. `eliminarConciliacionesDeCuenta` se ejecuta en la posición de `conciliaciones` (13) | Los hijos se borran antes que los padres. En OP-06 da exactamente el orden de 03 §4.6.4: asignaciones de la categoría de pago (20) → transacción de saldo inicial (14, sus efectos en cascada) → `SELECT finn.eliminar_conciliaciones_de_cuenta($1)` (13) → categoría de pago (8) → cuenta (3, su subtipo en cascada) |
| **F3. Insertar** | Todos los `insertar` | Tablas en orden 1→26; dentro de la tabla, en el orden en que los emitió el dominio | Los padres existen antes que los hijos. Una tabla con varias filas nuevas usa un solo `createMany` |
| **F4. Actualizar** | Los `actualizar` que no fueron a F1 | Tablas en orden 1→26; dentro de la tabla, por `id` | Una actualización puede apuntar a una fila insertada en F3: por ejemplo, el movimiento `aprobado` con su `transaccion_id` nuevo (OP-37), o una transacción `conciliada` con la `conciliacion_id` recién creada (OP-47, `h_transicion_estado_bancario` exige que la conciliación sea de esta transacción de base de datos) |

Reglas del traductor:
- Una actualización de F1 solo puede apuntar a una fila que ya existía; si apunta a una fila nueva, el traductor lanza un error interno (indica un error del dominio).
- `eliminar` sobre `conciliaciones` o `cambios_posteriores` está prohibido; la única vía es `eliminarConciliacionesDeCuenta` (03 §4.5.6, HZ-1). `finn_app` tampoco tiene `DELETE` sobre ellas.
- Asignaciones: el dominio emite `insertar` si Asig(c, p) pasa de 0 a otro valor, `actualizar` si cambia, y `eliminar` si llega a 0 (DB-14).
- Las restricciones diferidas (`x_*`) se evalúan en el `COMMIT`, así que su resultado no depende de este orden. Los triggers inmediatos que sí lo condicionan están en 4.5.3.
- El traductor nunca envía `secuencia` (03 §13.4, DB-21) ni `revision` (los fija `c_estampar_revision`).
- **[R1]** El traductor **siempre** envía el `id` de cada fila insertada; si un `insertar` llega sin `id`, lanza un error interno (BE-31).

#### 4.5.3 Triggers inmediatos que condicionan el orden

| Trigger (03 §4.3) | Condición | Cómo la respeta el traductor |
|---|---|---|
| FK `RESTRICT` (DB-12) | No se elimina una fila referenciada | F1 antes de F2; F2 de hijos a padres |
| `g_asignacion` | Asignaciones en períodos cerrados solo con `fusion` o con `eliminar_cuenta` en un `DELETE` de una categoría de pago | `finn.operacion` se fija en el paso 10, antes de F1 |
| `g_destino_activo` | Destino activo (y, salvo en `lineas`, normal) cuando se crea o cambia un destino | En OP-12 la categoría destino está activa; ninguna operación asigna un destino a una categoría que archiva en la misma operación |
| `h_transicion_movimiento` | Transiciones válidas de §7.1 | `aprobado → descartado` y `transaccion_id` nulo en la misma sentencia (F1) |
| `h_transicion_estado_bancario` | `conciliada` solo con una conciliación de esta transacción | Conciliación en F3 (13) antes que la actualización de la transacción en F4 (14) |
| `e_solo_insercion` | Sin `UPDATE`/`DELETE` en tablas de solo inserción, salvo HZ-1 | Prohibición del traductor (4.5.2) |
| `f_fechas_hoy` | `clave_orden` cambia solo con la fecha y aumenta | El dominio fija `clave_orden = máx(instante, clave_orden anterior + 1 ms)` (13.1) |

*Nota sobre OP-09.* `g_destino_activo` solo mira las altas de destinos, y `x_verificar_categoria` es diferida, así que el orden entre "archivar la categoría" y "llevar a cero su asignación" no provoca rechazos. Se deja explícito porque en F4 `categorias` (8) se actualiza antes que `asignaciones` (20).

#### 4.5.4 Ejemplo: OP-12 (fusionar Café en Salidas)

1. Paso 10: `set_config('finn.operacion', 'fusion', true)`.
2. F1: `lineas`, `condonaciones`, `programada_lineas` y `reglas_comercio` con `categoria_id` = Café → Salidas.
3. F2: `asignaciones` de Café (todas, incluidas las de períodos cerrados) → `metas` de Café → `categorias` Café.
4. F3: `asignaciones` nuevas de Salidas en los períodos donde Salidas no tenía.
5. F4: `asignaciones` de Salidas que ya existían, con el monto sumado.

#### 4.5.5 `orden` de las líneas (BE-16)

`lineas.orden` y `movimiento_lineas.orden` no cambian una vez escritos. Al editar una transacción (OP-28):
- una línea sin eventos que cambia o desaparece se elimina (F2) y, si corresponde, se inserta otra con un `orden` nuevo (F3), mayor que todos los existentes;
- una línea con eventos conserva su fila, su `id` y su `orden`, y solo cambia lo que OP-28 permite;
- puede haber huecos en `orden`; el dominio solo usa su orden relativo (2.2.11 de 01).

**Justificación.** `UNIQUE (transaccion_id, orden)` no es diferible: renumerar líneas dentro de una sentencia podría chocar a mitad de camino. Con esta regla nunca se actualiza `orden`.

**Alternativa descartada:** renumerar con valores temporales negativos; viola `CHECK (orden >= 1)`.

#### 4.5.6 Valores que devuelve la base (BE-32) **[R1]**

`aplicarCambios` devuelve, por cada fila insertada o actualizada en una tabla [M], los valores que fija la base:

| Fase | Cómo se obtienen | Columnas |
|---|---|---|
| F3 (insertar) | `createManyAndReturn({ data, select })` de Prisma 7, que usa `INSERT … RETURNING` y devuelve los valores finales después de los triggers `BEFORE` | `id`, `revision` y, en `transacciones` y `condonaciones`, `secuencia` |
| F1 y F4 (actualizar) | `update({ where: { id }, data, select })` por fila (`UPDATE … RETURNING`) | `id`, `revision` |
| Actualizaciones masivas de OP-12 | `updateManyAndReturn({ where, data, select })` | `id`, `revision` |
| F2 (eliminar) | — | Las filas eliminadas, incluidas las de cascada, ya no están en `hechosNuevos` |
| `eliminarConciliacionesDeCuenta` | `$queryRaw` de la función | Las conciliaciones de la cuenta ya no están en `hechosNuevos` |

En el paso 13 de 4.2, `escribir()`:
1. reemplaza en `hechosNuevos` los valores pendientes por los devueltos, fila por fila, buscando por `id`;
2. verifica que cada fila nueva de `hechosNuevos` tenga su valor devuelto y que no sobre ninguno;
3. verifica que toda `revision` devuelta sea igual a la revisión resultante (todas las escrituras de una transacción quedan con la misma revisión, porque `b_avanzar_revision` sube el contador una sola vez por transacción, V-02);
4. si alguna verificación falla, marca los hechos como **no aptos para la memoria** (5.3). La operación no falla por eso: la base ya validó y confirmará.

V-16 verificó este procedimiento con una transacción de tres líneas y con una edición que actualiza, elimina e inserta líneas.

**Alternativa descartada:** releer las filas escritas después de escribir; agrega consultas por operación sin dar más información que `RETURNING`.

### 4.6 Idempotencia (BE-17)

Cada operación declara una de cuatro clases:

| Clase | Operaciones | Clave | Comportamiento |
|---|---|---|---|
| **Creación** | Las que crean un hecho principal: OP-01, 07, 18, 20 a 27, 31, 32, 33, 41, 42, 47 y las OP-49+ que creen filas | `id` del hecho principal, generado por el cliente (`crypto.randomUUID()`) y validado como UUID | Ver 4.6.1 |
| **Valor absoluto** | Las que fijan valores: OP-02, 03, 08, 14, 15, 16, 28, 30, 36 | Valor esperado y valor nuevo de cada campo que cambia | Ver 4.6.2 |
| **Eliminación** | OP-06, 13, 29, 34, eliminar meta, regla o programada | `id` de la fila | Ver 4.6.3 |
| **Natural** | OP-35, 37, 38, 39, 40, 43, 44, 45, 46 y las compuestas que se ejecutan una vez por elemento | Restricciones de 03: `movimientos.sms_id`, `movimientos.transaccion_id`, `ocurrencias_resueltas (programada_id, fecha_esperada)`, transiciones de estado | Repetir no produce cambios: la transición ya no es válida o la fila ya existe, y la operación responde `ya_aplicada` |

La lista definitiva por operación se fija en el catálogo de §3 (Parte B1).

#### 4.6.1 Creación

1. El contrato exige el `id` como UUID válido (`z.uuid()`); si no lo es, `VALIDACION`.
2. **Bajo el bloqueo** (paso 5 de 4.2), `escribir()` busca una fila con ese `id` en la tabla del hecho principal.
3. Si no existe, la operación sigue.
4. Si existe, compara la fila con la solicitud mediante la **huella de creación** de la operación: las columnas de la fila principal que la solicitud determina (por ejemplo, en un gasto: `tipo`, `fecha`, `total`, `origen`, cuenta del efecto, montos y destinos de las líneas), excluyendo las que pone el sistema (`revision`, `secuencia`, `hora_registro`, `clave_orden`).
   - Si coinciden: responde `ya_aplicada`, con la misma salida que habría tenido la operación (el `id`), sin escribir.
   - Si difieren: `CONFLICTO_ID` (7.2). Nunca `ya_aplicada` (P4-8).
5. **Defensa:** si a pesar del paso 2 la base devuelve `23505` sobre la clave primaria de la tabla principal (`P2002` con `constraint.index = <tabla>_pkey`, V-06), `escribir()` revierte, vuelve a leer la fila en una lectura nueva y aplica la comparación del paso 4. Con el bloqueo esto no debería ocurrir; si ocurre, se registra un evento `aviso`.

Una fila creada y después editada por el usuario ya no coincide con un reintento tardío de su creación: el reintento recibe `CONFLICTO_ID`. Es lo seguro: no duplica ni sobrescribe.

**Relación con DB-02.** **[R1]** Las tablas conservan `DEFAULT gen_random_uuid()`, pero la aplicación envía el `id` de **todas** las filas que inserta (BE-31): el del hecho principal lo envía el cliente y es la clave de idempotencia; los de las filas secundarias (efectos, líneas, subtipos) los deriva la aplicación del id principal con UUIDv5 y los entrega al dominio con `GeneradorIds` (**[R2]** 2.4.1), así que un reintento produce las mismas filas con los mismos ids. La idempotencia solo mira el `id` principal. El orden nunca se toma del `id` (DB-02).

#### 4.6.2 Valor absoluto

La solicitud trae, para cada campo que cambia, el valor esperado (el que vio la interfaz) y el nuevo. Bajo el bloqueo:
- si el valor actual es el **nuevo** en todos los campos: `ya_aplicada`;
- si es el **esperado** en todos: se aplica;
- en otro caso: `CONFLICTO_DESACTUALIZADO`, con los valores actuales, para que la interfaz los muestre.

Ejemplo, OP-14: `{ categoriaId, periodoInicio, montoEsperado: "150.00", montoNuevo: "180.00" }`. El contrato acepta además una variación δ para la asignación rápida (OP-16), que la aplicación convierte en valor absoluto con el valor esperado que mostró la interfaz.

#### 4.6.3 Eliminación

- Si la fila existe: se aplica.
- Si no existe y la tabla es [M]: se busca `fila_id` en `eliminaciones` (03 §5.3). Si está, `ya_aplicada`; si no, `NO_ENCONTRADO`.
- Si no existe y la tabla es [H] (sin registro de eliminaciones): `NO_ENCONTRADO`; la interfaz lo muestra como "ya no existe" y refresca.
- `eliminaciones` se purga a los 30 días (03 §5.3); un reintento más antiguo recibe `NO_ENCONTRADO`.

### 4.7 Reintentos (BE-18)

| Situación | Cómo se reconoce (7.3) | Reintento en el servidor | Resultado si persiste |
|---|---|---|---|
| Bloqueo no obtenido a tiempo | SQLSTATE `55P03` (V-10) | Uno, tras 300–600 ms aleatorios, si el tiempo total va por debajo de 15 s | `OCUPADO` |
| Interbloqueo | `40P01` | Uno | `OCUPADO` |
| Conexión perdida **antes** de enviar el `COMMIT` (el callback no había terminado) | Error de conexión con la marca `callbackTerminado = false` | Uno | `INTERNO` |
| Conexión perdida **durante o después** del `COMMIT` | Error de conexión con `callbackTerminado = true` | **Ninguno** | `INCIERTO` |
| Restricción diferida que falla en el `COMMIT` | `DriverAdapterError` con SQLSTATE de clase `FN` (V-03) | Ninguno | `INTERNO` (BE-25) |
| Tiempo de la transacción agotado (20 s) | Prisma `P2028` | Ninguno | `INTERNO` |
| Cualquier otro error de la base | 7.3 | Ninguno | `INTERNO` |

- `escribir()` marca `callbackTerminado = true` justo antes de devolver el resultado del callback. Si `$transaction` falla después de esa marca con un error de conexión, el `COMMIT` pudo haberse aplicado o no: el resultado es `INCIERTO`.
- **El cliente** (Fase 5) puede reintentar una vez `OCUPADO` e `INCIERTO` con **la misma entrada** (los mismos `id` y valores esperados). La idempotencia de 4.6 resuelve el caso en que el primer intento sí se aplicó.
- Las tareas internas (cron, webhook) siguen la misma tabla; sus reintentos adicionales los define la Parte C.

**Alternativa descartada:** reintentos ilimitados con espera exponencial; con un solo escritor humano, un bloqueo de más de 10 s indica un problema que conviene mostrar.

### 4.8 Lotes

"Aprobar todos" (OP-38) y el registro automático (OP-43) ejecutan `escribir()` una vez **por elemento** (RT-03): cada elemento toma el bloqueo, aplica y confirma por separado. Entre elementos se libera el bloqueo, así que una escritura del usuario puede intercalarse. Un fallo en un elemento no afecta a los demás, y el resultado lista cada elemento con su estado (AV-19, AV-23).

### 4.9 Efectos posteriores (BE-19)

- Push, registro de notificaciones (`notificaciones`, [T]), revalidación de rutas y eventos del sistema se ejecutan **después** del `COMMIT` (ADR-06 punto 5), a partir de `definicion.posteriores(resultado)`.
- En Route Handlers y Server Actions se ejecutan con `after()` de Next, para no retrasar la respuesta.
- Si un efecto posterior falla, la operación ya está confirmada: el fallo se registra en `eventos_sistema` y no cambia la respuesta al usuario.

### 4.10 Prohibiciones verificadas por lint

| Prohibición | Motivo |
|---|---|
| `$transaction`, `$executeRawUnsafe` y `$queryRawUnsafe` fuera de `packages/db/src/transacciones.ts` | BE-11 |
| `SAVEPOINT`, `ROLLBACK TO` y transacciones anidadas en cualquier texto SQL | 03 §4.6.2: `es_de_esta_transaccion` compara `xmin`; un savepoint lo cambia. V-11 confirma que Prisma no emite savepoints |
| `SET ` sin `LOCAL` en SQL de la aplicación | Estado de sesión prohibido con el pooler en modo transacción (ADR-05) |
| Escrituras con el cliente de Prisma fuera de `EscritorTx` | BE-11 |
| **[R1]** Cualquier acceso a la base (lectura o escritura, incluidas las tablas [I] y [T]) fuera de una transacción de `transacciones.ts` | BE-33: sin el paso 2 de 4.2 la zona de la sesión no está garantizada (V-17) |
| Textos `fusion`, `eliminar_cuenta` y `finn.operacion` fuera de los lugares de 4.4 | BE-14 |

### 4.11 Lo que se verificó

V-01 a V-12 (0.7). En particular:
- el trigger de bloqueo se dispara antes que cualquier escritura, incluso sin filas afectadas (V-01, V-12);
- la revisión sube una vez por transacción (V-02);
- el patrón `READ COMMITTED` + bloqueo primero ve lo confirmado por el escritor anterior y `REPEATABLE READ` no (V-08, V-09);
- `set_config(…, true)` no se filtra entre transacciones del pool (V-05);
- Prisma 7 no emite savepoints (V-11);
- las tres formas en que llegan los errores de la base (V-01, V-03, V-06), que usa 7.3.


---

## 5. Lecturas y derivados

### 5.1 Transacción de lectura (BE-20)

`leer(trabajo)` en `@finn/db/transacciones.ts`:

| Paso | Qué hace | SQL o llamada |
|---|---|---|
| 1 | Abre la transacción | Prisma: `BEGIN` + `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ` (V-11) |
| 2 | La marca como de solo lectura. Es una sentencia de control: no toma la instantánea | `SET TRANSACTION READ ONLY` |
| 3 | **[R1]** Zona de la sesión en UTC (BE-33) y, solo en pruebas, reloj simulado (BE-30) | `SELECT set_config('TimeZone', 'UTC', true)` y `SELECT set_config('finn.hoy', $1, true)` |
| 4 | **Primera lectura**: toma la instantánea y lee la revisión y hoy | `SELECT valor::text AS revision, finn.hoy()::text AS hoy FROM finn.revision WHERE id = 1` |
| 5 | Obtiene la instantánea calculada de la memoria (5.3) o carga los hechos (5.2) y ejecuta `calcular(hechos, hoy)` | — |
| 6 | Ejecuta el trabajo: selectores y, si hace falta, lecturas de tablas [H], [I] o [T] en la misma instantánea | `LectorTx` |
| 7 | `COMMIT` | — |

- V-07 confirmó que la transacción queda en `repeatable read` y `read_only = on`, y que una escritura dentro de ella falla con `25006`.
- La revisión, los hechos y las filas [H] de la consulta salen de **la misma instantánea**, así que una pantalla nunca mezcla dos estados (ADR-06).
- Opciones de Prisma: `{ isolationLevel: RepeatableRead, timeout: 10_000, maxWait: 5_000 }`.

**Alternativa descartada:** leer fuera de una transacción. La revisión y los hechos podrían pertenecer a estados distintos y la memoria quedaría asociada a una revisión equivocada.

### 5.2 Carga de hechos (BE-21)

`cargarHechos(tx)` lee las 18 tablas [M] de 03 §5.5. Para cada tabla ejecuta **una** consulta `$queryRaw` que devuelve todas sus filas como un único arreglo JSON de arreglos, con las columnas en un orden fijo:

```sql
-- Ejemplo: transacciones (todas las columnas que usa el motor, sin "revision")
SELECT coalesce(json_agg(json_build_array(
         id, tipo, fecha, hora_ms, clave_ms, secuencia::text, origen, estado_bancario,
         conciliacion_id, comercio, total, linea_cobrada_id)), '[]')::text AS filas
FROM (SELECT t.*,
             to_char(hora_registro AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS hora_ms,
             to_char(clave_orden   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS clave_ms
      FROM finn.transacciones t) x;
```

- `@finn/db/hechos/cargar.ts` define, por tabla, la lista de columnas y la función que convierte cada arreglo en una fila del dominio. Las 18 consultas viven en ese único archivo; una prueba compara sus columnas con las de `schema.prisma` para detectar columnas olvidadas.
- **Fechas** (`date`): `json_build_array` las serializa como `"AAAA-MM-DD"`, que es exactamente `FechaLocal`. No pasan por `Date` (§13).
- **Instantes** (`timestamptz`): se convierten a texto ISO UTC con milisegundos (13.1).
- **Montos** (`integer`): números JSON; el mapeo crea `Centavos` con verificación de entero seguro.
- **`bigint`** (`secuencia`): como texto, convertido a `bigint` en el mapeo.
- **`numeric`** (`transacciones.monto_original`): **no se carga**; es informativo y nunca entra al motor (03 §3.12).
- No se ordena en SQL: el motor no depende del orden de entrada (inv. 26), y una prueba de propiedades lo verifica barajando los hechos.
- Las tablas [H] que necesitan las operaciones (BE-10) y las consultas se leen con el cliente de Prisma normal: son pocas filas y se benefician del tipado.

**Por qué así (V-13).** Con 117.015 filas de tres tablas, en una base local:

| Método | Tiempo (5–6 corridas) | Observación |
|---|---|---|
| `findMany` de Prisma con `select` | 459–708 ms | Construye objetos con metadatos por fila |
| `$queryRaw` por columnas | 316–557 ms | Una fila del protocolo por fila |
| `$queryRaw` con `json_agg` de arreglos | **270–336 ms** | Un solo valor de texto por tabla; 12,2 MB |
| `pg` directo (referencia, sin Prisma) | 372–420 ms | — |

**Alternativas descartadas.** `findMany` (el más lento, y a los 10 años supera el presupuesto, 5.6); una sola consulta para las 18 tablas (no mejora el tiempo de forma medible y dificulta medir por tabla); `$queryRawTyped` de Prisma (exige generar los tipos contra una base al compilar, lo que agrega un paso a la CI sin ganancia).

### 5.3 Memoria por instancia (BE-22)

Vive en el módulo `@finn/db/transacciones.ts`, en memoria del proceso; nunca se escribe en la base (03, regla de §3 de 01).

| Entrada | Clave | Capacidad | Contenido |
|---|---|---|---|
| Hechos | `revision` | 1 | `Hechos` (inmutable) |
| Instantánea | `(revision, hoy)` | 2 | `Instantanea` (inmutable) calculada con los hechos de esa revisión |

- **Dos instantáneas** cubren el cruce de medianoche: durante unos segundos conviven peticiones con `hoy` distinto.
- **Una sola carga a la vez.** Si dos peticiones concurrentes de la misma instancia (Fluid compute) necesitan cargar la misma revisión, la segunda espera la promesa de la primera, sin una segunda carga.
- **Escritura.** **[R1]** Después del `COMMIT`, `escribir()` reemplaza la entrada de hechos por `(revisionNueva, hechosNuevos)`, **solo si** el paso 13 de 4.2 completó todos los valores que fija la base (BE-32) y los marcó como aptos. La instancia que escribió no recarga. Es correcto porque, mientras se tuvo el bloqueo, nadie más cambió los hechos, y `revisionNueva` se leyó después de la última escritura, dentro de la misma transacción.
- **Invalidación ante la duda (corrección 1 c).** **[R1]** La memoria de hechos se **vacía** (la siguiente lectura recarga desde la base) si ocurre cualquiera de estas situaciones:
  - el paso 13 no pudo completar o verificar los valores de la base (4.5.6);
  - la transacción terminó en `INCIERTO` o con un error después de escribir;
  - `hechosNuevos` contiene alguna fila con `secuencia` o `revision` pendiente;
  - en una lectura, la `revision` de la base es **menor** que la memorizada (indica una restauración o un error).
- **Prueba obligatoria en CI (corrección 1 d).** **[R1]** El ejecutor de escenarios de integración (ADR-19) compara, después de **cada paso de cada escenario** de 01 §8 y de cada caso de la prueba de propiedades, la memoria de la instancia que escribió con una carga nueva desde la base, campo por campo y tabla por tabla. Cualquier diferencia hace fallar la CI. V-16 es la primera versión de esa prueba.
- Si la escritura solo tocó tablas [H] o [T], la revisión no cambia y la memoria tampoco.
- **Invalidación.** No hay invalidación explícita. La clave contiene todas las entradas de las funciones puras (ADR-07): otra revisión u otro día no coinciden y obligan a recargar o recalcular. Entre instancias no se comparte nada.
- Una prueba de propiedades compara siempre el resultado con memoria contra un cálculo nuevo (02 §2.3).

#### 5.3.1 Qué cambia la base además de las filas escritas **[R2]**

La memoria de la instancia que escribe solo es igual a una carga nueva si el dominio conoce **todo** lo que cambia en las tablas [M]. Revisión del código de 03 §10.4.5 y §10.4.6 (V-21):

| Mecanismo de 03 | ¿Modifica otras filas? | Tratamiento en la memoria |
|---|---|---|
| `b_avanzar_revision` | Sí, `finn.revision` ([T]) | No es un hecho; la revisión nueva se lee en el paso 13 de 4.2 |
| `c_estampar_revision`, `c_asignar_secuencia` | Solo la fila que se escribe (`NEW`) | `RETURNING` (BE-32) |
| `y_registrar_eliminacion` | Inserta en `eliminaciones` ([T]) | No es un hecho |
| `a_exigir_bloqueo`, `d_inmutables`, `e_solo_insercion`, `f_fechas_hoy`, `g_*`, `h_*`, `x_*` | No: solo leen y rechazan | — |
| `finn.eliminar_conciliaciones_de_cuenta` | Elimina `conciliaciones` ([M]) y `cambios_posteriores` ([H]) | Lo invoca explícitamente el cambio `eliminarConciliacionesDeCuenta`; el dominio quita esas conciliaciones de `hechosNuevos` |
| `ON DELETE CASCADE` (DB-12) | Elimina hijos [M]: `efectos` y `lineas` de una transacción, subtipos de una cuenta, `metas` de una categoría, `programada_lineas` de una programada | El dominio replica estas cascadas (2.4.1) |
| `ON DELETE SET NULL` (DB-12) | Solo columnas de tablas [H] e [I] (`sms_procesamientos`, `movimientos`, `movimiento_lineas`, `cambios_posteriores`) | No son hechos del motor |

Conclusión: ningún trigger modifica filas [M] distintas de la que se escribe. Las únicas modificaciones indirectas de [M] son las cascadas de eliminación, que el dominio replica, y la función de HZ-1, que se invoca como un cambio explícito. La prueba de CI de 5.3 (memoria = carga nueva) detectaría cualquier caso olvidado, incluido un trigger que se agregue en una migración futura.

**Memoria del proceso.** 12,2 MB de JSON para 117.000 filas producen, una vez convertidos, del orden de decenas de MB en el montón de V8; a los 10 años con el volumen alto, menos de 200 MB. Se mide en el benchmark (5.6); el límite de memoria de las funciones de Vercel Hobby se confirma en §14 (Parte C).

**Alternativas descartadas.** Más entradas en la memoria (no hay un patrón de acceso que las aproveche: casi siempre se lee la última revisión); caché compartida entre instancias (sería un servicio de pago o un derivado guardado, prohibido por 03).

### 5.4 Invocación del motor y selectores

- Toda consulta obtiene la `Instantanea` y llama a `seleccionar.<x>(instantanea, parametros)`. Las consultas de §6 (Parte B2) no contienen fórmulas: filtran, ordenan, paginan y arman DTO (inv. 27).
- La previsualización (4.3) usa la misma ruta y después llama a `aplicar` sobre los hechos en memoria.
- Los avisos de estado (AV-02 a AV-09, AV-14, AV-17, AV-20, AV-21) son selectores de la instantánea.

### 5.5 Qué ve cada pantalla de la revisión

Toda consulta devuelve además `{ revision, hoy, periodoActivo }`:
- `revision` permite a la interfaz enviar `revisionVista` (4.3) y detectar datos viejos;
- `hoy` y `periodoActivo` son los del servidor; la interfaz no calcula períodos (13.4).

### 5.6 Presupuesto de rendimiento (BE-23)

**Volumen** (02 §2.2): entrada del motor a los 10 años entre 70.000 (base) y 200.000 filas (alto).

**Medición y extrapolación** (V-13, base local, sin red):

| Volumen | Filas del motor | Carga `json_agg` (estimada) | JSON |
|---|---|---|---|
| Año 1, alto | ≈ 20.000 | ≈ 50 ms | ≈ 2 MB |
| Año 3, alto | ≈ 60.000 | ≈ 150 ms | ≈ 6 MB |
| Año 10, base | ≈ 70.000 | ≈ 170 ms | ≈ 7 MB |
| Año 10, alto | ≈ 200.000 | ≈ 480 ms | ≈ 21 MB |
| **Medido** | 117.015 | 270–336 ms | 12,2 MB |

La extrapolación es lineal desde la medición; el cálculo del motor no está medido porque el motor todavía no existe.

**Presupuestos** (verificados en el benchmark de CI, ADR-19):

| Métrica | Presupuesto | Origen |
|---|---|---|
| Carga completa, base local, 10 años nivel alto | ≤ 500 ms | 02 §2.3 |
| `calcular`, 10 años nivel alto | ≤ 150 ms | 02 §2.3 |
| `aplicar` de una operación típica con su doble cálculo | ≤ 300 ms | Nuevo |
| Consulta con memoria caliente (sin render) | ≤ 30 ms en el servidor | Nuevo |
| Escritura típica con memoria caliente (sin red de la petición) | ≤ 400 ms | Nuevo |

Con la medición de V-13, la carga a los 10 años de volumen alto queda **en el límite** del presupuesto de 02 §2.3 y solo con `json_agg`. A eso se suma la transferencia desde Supabase a la región `iad1`, que se mide en la prueba de humo (§17).

**Egreso de la base** (RK-02, 5 GB/mes en el plan gratuito):
- Cada carga completa transfiere aproximadamente el tamaño del JSON (los arreglos sin nombres de columna minimizan el volumen).
- Cada carga registra en `eventos_sistema` (origen `motor`, nivel `info`): filas por tabla, bytes del JSON y milisegundos (ADR-23, 03 §7.3).
- **Disparador de la carga incremental:** la tarea diaria (§10) proyecta el egreso del mes con los bytes cargados en los últimos 7 días (× 30 / 7). Si supera **2,5 GB** (50 % del límite, RK-02), envía un push "conviene activar la carga incremental" y lo registra como `aviso`.
- **[R1] Disparador por latencia (corrección 3).** Cada carga completa registra su duración en `eventos_sistema` (origen `motor`). La tarea diaria calcula el percentil 95 de las cargas completas de cada uno de los últimos 7 días. Si supera **500 ms en los 7 días**, envía el mismo push y lo registra como `aviso`. Los dos disparadores (egreso y latencia) se evalúan cada día; cualquiera de los dos basta.
- **[R1] Transferencia desde Supabase.** La medición de V-13 es local y no incluye la red. La prueba de humo (§17) carga en el proyecto real datos sintéticos de **volumen alto a 10 años** y mide desde la región `iad1` el tiempo y los bytes de la carga completa con la consulta de 5.2. Si supera 500 ms, se registra como riesgo y se decide si activar la carga incremental desde el inicio.
- Con el volumen alto, 20 cargas completas al día alcanzarían ese umbral alrededor del año 3 o 4 (20 × 6 MB × 30 ≈ 3,6 GB). RK-02 estimaba el riesgo desde el año 4–5; queda registrado en los riesgos de §19.

### 5.7 Carga incremental (diseño; queda inactiva)

Se activa con la variable `FINN_CARGA_INCREMENTAL=on` y una migración de expansión que agrega índices por `revision` (DB-19).

1. Si la memoria tiene `(revisionMemorizada, hechos)` y `revisionMemorizada ≥ revision.revision_minima_incremental`:
   - por cada tabla [M], carga solo las filas con `revision > revisionMemorizada` (misma consulta de 5.2 con `WHERE`) y las aplica sobre la copia memorizada;
   - lee `eliminaciones` con `revision > revisionMemorizada` y quita esas filas.
2. Si no, recarga completa.
3. **Verificación:** por cada tabla [M], la base devuelve `count(*)` y `sum(revision)`; el resultado incremental debe dar los mismos dos valores (la memoria guarda la `revision` de cada fila). Si no coinciden, recarga completa y registra un evento `aviso`.

Mantiene el determinismo porque reconstruye exactamente los hechos de esa revisión (02 §2.3).

### 5.8 Renderizado y caché

- Toda página con datos de usuario lee la sesión (cookies), lo que la hace dinámica en Next.
- Prohibidos, por lint, en `apps/web/src/app/(finn)` y en `@finn/aplicacion`: la directiva `'use cache'`, `export const revalidate`, `unstable_cache` y `fetch` con caché (ADR-02, RK-11).
- Después de cada escritura correcta, `accion()` ejecuta `revalidatePath('/', 'layout')`: se invalida todo el árbol, porque una operación puede cambiar números de cualquier pantalla (inv. 27).
- La estrategia de refresco en el cliente tras medianoche es de la Fase 5 (RT-21).


---

## 7. Modelo de errores

### 7.1 Formato único (BE-24)

```ts
// @finn/aplicacion/errores
type CategoriaError =
  | 'VALIDACION'                // la entrada no cumple el contrato (Zod)
  | 'DOMINIO'                   // el motor rechaza la operación (precondición de negocio)
  | 'REQUIERE_CONFIRMACION'     // hay que mostrar o renovar la previsualización (4.3)
  | 'CONFLICTO'                 // CONFLICTO_ID o CONFLICTO_DESACTUALIZADO (4.6)
  | 'NO_ENCONTRADO'
  | 'NO_AUTORIZADO'
  | 'OCUPADO'                   // bloqueo no obtenido tras el reintento (4.7)
  | 'INCIERTO'                  // no se sabe si el COMMIT se aplicó (4.7)
  | 'INTERNO';                  // error del sistema, incluido todo rechazo de la base (BE-25)

interface ErrorFinn {
  categoria: CategoriaError;
  codigo: string;               // estable: 'suma_lineas_distinta', 'conflicto_id', 'FN003'…
  mensaje: string;              // en español, listo para mostrar (7.7)
  campos?: Record<string, string>;   // VALIDACION y DOMINIO: campo → mensaje
  datos?: Record<string, unknown>;   // valores para la interfaz (por ejemplo, valores actuales en un conflicto)
  previsualizacion?: Previsualizacion; // solo REQUIERE_CONFIRMACION
  idError?: string;             // solo INTERNO, INCIERTO y OCUPADO (7.8)
}

type ResultadoAccion<T> =
  | { ok: true; valor: T; yaAplicada: boolean; avisos: readonly AvisoMostrado[] }
  | { ok: false; error: ErrorFinn };
```

`REQUIERE_CONFIRMACION` es una categoría del resultado, no una falla: la interfaz muestra la previsualización y vuelve a llamar con `huellaImpacto`.

**Alternativas descartadas.** Excepciones tipadas que atraviesan las capas hasta Next (las Server Actions no serializan excepciones de forma estable); un código numérico único (pierde la diferencia entre "lo rechazó el negocio" y "falló el sistema").

### 7.2 Categorías

| Categoría | Origen | ¿Se muestra? | ¿Se registra? (7.8) | ¿Reintento? |
|---|---|---|---|---|
| `VALIDACION` | Zod en el contrato | Sí, por campo | No | No; el usuario corrige |
| `DOMINIO` | `rechazos` de `aplicar` | Sí, con el mensaje del código | No | No |
| `REQUIERE_CONFIRMACION` | 4.3 | Previsualización | No | La interfaz confirma |
| `CONFLICTO` (`conflicto_id`, `conflicto_desactualizado`) | 4.6 | Sí; con los valores actuales | `conflicto_id`: sí, nivel `aviso`. `conflicto_desactualizado`: no | No |
| `NO_ENCONTRADO` | 4.6.3, lecturas | Sí ("ya no existe") | No | No |
| `NO_AUTORIZADO` | 2.2.5 | Redirige a `/ingresar` | Sí, nivel `aviso`, sin datos de la petición | No |
| `OCUPADO` | `55P03`, `40P01` tras el reintento | Sí ("Finn está ocupado; intentá de nuevo") | Sí, `aviso` | El cliente, una vez |
| `INCIERTO` | 4.7 | Sí ("no sabemos si se guardó; volvé a intentarlo") | Sí, `error` | El cliente, una vez, con la misma entrada |
| `INTERNO` | Cualquier otro | Mensaje genérico con referencia | Sí, `error` | No |

### 7.3 Extracción del SQLSTATE

`sqlstateDe(error)` en `@finn/db/errores.ts` reconoce las tres formas observadas (V-01, V-03, V-06, V-10):

| Forma | Cuándo aparece | Dónde está el SQLSTATE |
|---|---|---|
| `PrismaClientKnownRequestError` con `code` `P2039` (operación de modelo) o `P2010` (consulta cruda) | Error durante una sentencia: triggers inmediatos (`FN001`, `FN002`…), `55P03`, `25006`, `42501` | `error.meta.driverAdapterError.cause.originalCode` |
| `PrismaClientKnownRequestError` con `code` `P2002` (unicidad) o `P2003` (clave foránea) | Restricciones `UNIQUE`/PK y FK | `meta.driverAdapterError.cause.originalCode` (`23505`, `23503`) y, en `P2002`, `cause.constraint.index` y `cause.table` |
| `DriverAdapterError` (no es una clase de Prisma) | Fallo en el `COMMIT`: restricciones diferidas `x_*` | `error.cause.originalCode` |

Devuelve `{ sqlstate, restriccion?, tabla?, codigoPrisma? }` o `null` si el error no viene de la base. El mensaje de la base **no** se usa para decidir nada (DB-23).

### 7.4 Rechazos de la base (BE-25)

El motor valida todo antes de escribir. Si la base rechaza algo que el motor aceptó, hay un desacuerdo entre las dos implementaciones de una regla: es un **error interno**, nunca un error del usuario (P4-6). La transacción ya se revirtió.

| Código | Significado (03 §10.4) | Causa probable si llega a la aplicación | Mensaje al usuario |
|---|---|---|---|
| `FN001` | Escritura sin el bloqueo global | Código que escribe fuera de `escribir()` | Genérico (7.7) |
| `FN002` | Regla temporal (inv. 12, 18, 21; inicio de período) | Diferencia entre `es_inicio_de_periodo` y §4.2 del motor, o entre las fechas del dominio y `finn.hoy()` | Genérico |
| `FN003` | Forma de la transacción (inv. 6, 8) | El dominio emitió efectos o líneas que no corresponden al tipo | Genérico |
| `FN004` | Límites de eventos (inv. 9 a 11) | Diferencia en el cálculo de lo devuelto o condonado | Genérico |
| `FN005` | Cuenta (subtipo, inv. 22, saldo inicial, archivo, saldo negativo) | Cambios incompletos de OP-01, OP-02, OP-04 u OP-06 | Genérico |
| `FN006` | Categoría o grupo | Cambios incompletos de OP-09, OP-10 u OP-13 | Genérico |
| `FN007` | Transición de ciclo de vida | El dominio y la base no comparten la tabla de transiciones de §7.1, §7.2 o §7.8 | Genérico |
| `FN008` | Columna inmutable o tabla de solo inserción | El traductor actualizó una columna inmutable | Genérico |
| `FN009` | Programada | Forma por tipo o calendario con historial (P3-6b, HZ-3) | Genérico |
| `FN010` | Conciliación (P12, N6, OP-47) | Falta el cambio posterior o la transacción sigue conciliada | Genérico |
| `FN011` | Destino archivado o de clase incorrecta (inv. 20, 23) | El dominio aceptó un destino archivado | Genérico |
| `FN012` | Eliminación de cuenta (OP-06) | Orden de OP-06 distinto de 03 §4.6.4 | Genérico |
| `23505` | Unicidad | Si es la PK del hecho principal de una creación: 4.6.1 (idempotencia). En otro caso: el motor no detectó un duplicado (por ejemplo, un nombre) | Idempotencia según 4.6.1; si no, genérico |
| `23503` | Clave foránea | Orden de cambios incorrecto o referencia a una fila borrada | Genérico |
| `23514` | `CHECK` | Valor fuera de rango que el contrato o el dominio dejaron pasar | Genérico |
| `25006` | Escritura en transacción de solo lectura | Escritura dentro de `leer()` | Genérico |
| `42501` | Privilegios | Operación sobre una tabla o función no permitida a `finn_app` | Genérico |
| `55P03`, `40P01` | Bloqueo | 4.7 | `OCUPADO` |

**Excepción:** las unicidades de tablas [H] que el motor no carga (`reglas_comercio.patron`, nombre de `formatos_bancarios`, nombre de `instituciones`) las verifica la operación bajo el bloqueo antes de escribir y las devuelve como `DOMINIO`. Si aun así llega un `23505`, es `INTERNO`.

**Un caso esperado de discrepancia que ya no ocurre.** 03 §4.1 describía una petición que cruza la medianoche: la base veía un día posterior al del motor. Con BE-12, el motor y los triggers usan el mismo `finn.hoy()` dentro de la transacción, así que ese caso no produce `FN002`.

### 7.5 Rechazos del dominio

```ts
interface Rechazo {
  codigo: CodigoRechazo;          // unión cerrada de textos en snake_case, en español
  campo?: string;                 // ruta del campo de la entrada, si aplica
  datos?: Record<string, Centavos | FechaLocal | string | number>;
}
```

- El dominio no produce textos para el usuario; produce códigos y datos.
- `@finn/aplicacion/errores/mensajes.ts` convierte cada código en un mensaje en español, con las reglas de 7.10 (**[R1]** voseo, montos `$1,234.50`, fechas `dd/mm/aaaa`).
- El catálogo de códigos por operación se define en §3 (Parte B1). Ejemplos: `periodo_cerrado`, `lpa_negativo_en_futuro` (I1), `suma_lineas_distinta` (inv. 6), `categoria_archivada` (inv. 20), `saldo_abierto_insuficiente` (inv. 9), `cuenta_archivada`.
- Un rechazo `invariante_violada` (2.4) se trata como `INTERNO`.
- Una prueba exige que cada `CodigoRechazo` tenga mensaje.

### 7.6 Errores de validación

- `accion()` y los Route Handlers convierten los `issues` de Zod en `campos`: clave = ruta unida con puntos (`lineas.2.monto`), valor = primer mensaje de esa ruta.
- Los mensajes de Zod salen en español: configuración regional de Zod 4 en español y mensajes propios en los primitivos de `contratos/primitivos.ts` (por ejemplo, el de `montoTexto`).
- `mensaje` resume: "Revisá los campos marcados." **[R1]**

### 7.7 Qué ve el usuario **[R1]**

| Categoría | Ejemplo de mensaje |
|---|---|
| `VALIDACION` | "El monto debe tener como máximo dos decimales." |
| `DOMINIO` | "Las partes suman $45.00 y el total es $50.00." |
| `CONFLICTO` (`conflicto_desactualizado`) | "Este valor cambió mientras lo editabas. Ahora es $1,180.00." |
| `CONFLICTO` (`conflicto_id`) | "Ya existe un registro con este identificador y datos distintos. No se guardó nada." |
| `NO_ENCONTRADO` | "Esto ya no existe." |
| `OCUPADO` | "Finn está terminando otra operación. Intentá de nuevo en unos segundos." |
| `INCIERTO` | "No pudimos confirmar si se guardó. Volvé a intentarlo; no se duplicará." |
| `INTERNO` | "Algo salió mal y no se guardó nada. Referencia: E-7K2QPX." |

Reglas: sin SQL, sin nombres de tablas, sin identificadores internos salvo la referencia `idError`; voseo y formatos de 7.10.

### 7.8 Qué se registra (BE-26)

**Dónde.** `eventos_sistema` (03 §3.28) y, además, una línea JSON en la consola (logs de Vercel, 1 hora; ADR-23). El registro en la base se hace en una transacción propia, sin bloqueo (tabla [T]), **después** del `ROLLBACK`. Si el registro falla, queda solo la línea de la consola.

**`idError`.** `E-` + 6 caracteres del alfabeto Crockford base32 (sin I, L, O ni U), aleatorios. Se muestra al usuario y se guarda en `datos.idError`, para buscarlo en `eventos_sistema` (§15, Parte C).

**Fila de `eventos_sistema`:**

| Columna | Valor |
|---|---|
| `nivel` | `error` (`INTERNO`, `INCIERTO`) o `aviso` (`OCUPADO`, `NO_AUTORIZADO`, `conflicto_id`) |
| `origen` | `app`, `webhook`, `tarea_diaria` o `motor` (el valor permitido por 03) |
| `mensaje` | `<categoria> <codigo> <operacion>`, por ejemplo `INTERNO FN003 OP-20` |
| `datos` | `{ idError, operacion, categoria, codigo, sqlstate, restriccion, tabla, codigoPrisma, revision, duracionMs, mensajeSaneado }` |

**Saneamiento.** `datos` **nunca** contiene:
- la entrada del usuario (montos, comercios, notas, nombres de deudores);
- textos de SMS ni contenido de CSV;
- el mensaje original de la base sin sanear.

`mensajeSaneado` es el mensaje de la base con cada número y cada texto entre comillas reemplazados por `#`, conservando los UUID (no son datos financieros) y los nombres de restricciones. Por ejemplo, `finn: transacción 37bd…: la suma de las líneas (100) no es igual al total (300) (inv. 6)` queda como `finn: transacción 37bd…: la suma de las líneas (#) no es igual al total (#) (inv. #)`.

**Alternativa descartada:** guardar la entrada completa para reproducir el error; contiene datos financieros y queda 90 días en la base (ADR-23).

### 7.9 Traducción a HTTP (Route Handlers)

| Categoría | Estado HTTP |
|---|---|
| `VALIDACION` | 400 |
| `NO_AUTORIZADO` | 401 |
| `NO_ENCONTRADO` | 404 |
| `CONFLICTO`, `REQUIERE_CONFIRMACION` | 409 |
| `DOMINIO` | 422 |
| `OCUPADO` | 503, con `Retry-After: 2` |
| `INCIERTO`, `INTERNO` | 500 |

El webhook de SMS tiene reglas propias (401 / 5xx / 200, N-01), definidas en §8 (Parte C). El cuerpo de una respuesta de error es `ErrorFinn` en JSON, sin `previsualizacion` salvo en 409.

### 7.10 Catálogo de mensajes: idioma y formatos (BE-34) **[R1]**

Aplican a todo texto dirigido al usuario que produzca el servidor: errores, rechazos, avisos (AV-xx), notificaciones push y nombres de archivos exportados.

| Regla | Detalle | Ejemplo |
|---|---|---|
| **Voseo salvadoreño** | Imperativo y presente en vos: *revisá, intentá, volvé, elegí, asigná, tenés, podés*. Nunca "tú" (*revisa, puedes*) ni "usted" | "Revisá los campos marcados." "Te falta reservar $120.00 para tu tarjeta." "Podés devolverlo a Listo para asignar." |
| **Montos** | Símbolo `$` delante, coma de miles y punto decimal, siempre dos decimales; negativo con el signo antes del símbolo. **[F6] CF-15:** en todo texto que se muestra (errores, rechazos, avisos, propuestas, hallazgos, títulos y cuerpos de push) el signo es el menos U+2212; las exportaciones (OPT-08, §16) y los contratos de entrada siguen con el guion ASCII | `$1,234.50`, `$0.75`, `−$45.00` (export: `-45.00`) |
| **Fechas** | Día/mes/año con dos dígitos | `05/10/2026` |
| **Fechas en texto corrido** | Día, mes abreviado en minúscula y año | `5 oct 2026` |
| **Instantes** | Fecha + hora de 24 h en America/El_Salvador | `05/10/2026 14:32` |
| **Sin tecnicismos** | Sin SQL, nombres de tablas, códigos `FN`, ni "transacción de base de datos" | — |

**[F6]** **CF-04.** Los textos de los hallazgos (06 §3.5.4 a §3.5.11) y de las propuestas de CF-05 son mensajes de este catálogo, con las mismas reglas.

**Formato verificado (V-18).** En Node 24.21 (ICU 78.3), la configuración regional `es-SV` produce exactamente estos formatos:

```ts
// @finn/aplicacion/errores/formato.ts (y su gemelo en apps/web para la interfaz)
const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
// moneda.format(1234.5) → "$1,234.50"; moneda.format(-45) → "-$45.00"
const fecha = new Intl.DateTimeFormat('es-SV', {
  timeZone: 'America/El_Salvador', day: '2-digit', month: '2-digit', year: 'numeric' });
// fecha.format(…) → "05/10/2026"
```

- La conversión de centavos a unidades (`/ 100`) solo ocurre dentro de estos dos módulos de formato (ADR-21, 13.3).
- **Protección contra cambios de ICU.** Una prueba unitaria en CI fija las salidas esperadas (`$1,234.50`, `-$45.00`, `05/10/2026`). La interfaz formatea con el ICU del navegador, que puede diferir del de Node; la prueba E2E de Playwright (Chromium, ADR-19) verifica los mismos textos en pantalla. Si alguna de las dos falla tras una actualización, se fija el formato de forma explícita (por ejemplo, `en-US` para los números) en esos módulos, sin tocar el resto del código.
- Una prueba exige que todo mensaje del catálogo pase un control de voseo: rechaza las formas tuteadas más comunes (`revisa `, `intenta `, `vuelve `, `puedes`, `tienes`, `elige `, `asigna `) al inicio de oración o tras un signo de puntuación.

**Alternativas descartadas.** `en-US` desde el inicio (da el mismo formato numérico, pero las fechas salen mes/día/año); formateo propio sin `Intl` (más código que mantener, sin ventaja mientras ICU produzca el formato correcto).

---

## 13. Tiempo, fechas y montos en la frontera

### 13.1 Fuentes de tiempo

**[F7]** **CT-02.** Los instantes que escribe la aplicación (`leida_en`, `push_enviada_en`, `renovada_en` al actualizar, `terminada_en`) salen siempre del instante del paso 3 de 4.2 o de `finn.ahora()`, nunca de `Date.now()` del servidor. Regla de lint nueva **L20** en `@finn/aplicacion` y `apps/web/src/app`: prohíbe `Date.now()` y `new Date()` sin argumentos fuera de los módulos de formato y del reloj de prueba. En la tabla de instantes técnicos, "`DEFAULT now()` de 03" pasa a "`DEFAULT finn.ahora()` de 03". Detalle en `07-pruebas.md` §4.4.

#### 13.1.1 Hoy

- **Única fuente:** `SELECT finn.hoy()` dentro de la transacción de la operación o de la consulta (paso 3 de 4.2, paso 4 de 5.1; P4-9).
- En producción devuelve `(now() AT TIME ZONE 'America/El_Salvador')::date` (03 §4.1). Como `now()` es fijo durante la transacción, la aplicación y los triggers ven el mismo día (7.4).
- `hoy` entra al dominio como `FechaLocal` y es parte de la clave de la memoria (5.3).
- Ningún código de la aplicación calcula "hoy" con `Date` o `Intl`.

#### 13.1.2 El instante (BE-27)

| Uso | Valor |
|---|---|
| `transacciones.hora_registro` y `clave_orden` al registrar (manual, programada, importada) | `instante` del paso 3 de 4.2 |
| `transacciones.hora_registro` al aprobar un SMS (OP-37) | `sms_recibidos.recibido_en` del SMS, truncado a milisegundos (D2) |
| `transacciones.clave_orden` al cambiar la fecha (OP-28, supuesto 5) | `máx(instante, clave_orden anterior + 1 ms)` |
| `condonaciones.clave_orden` | `instante` |
| `sms_recibidos.recibido_en`, `procesado_en`, `registrado_en` y demás instantes técnicos | `DEFAULT now()` de 03 |

Reglas:
- **Después del bloqueo.** `instante` usa `clock_timestamp()` en la primera lectura posterior a `finn.tomar_bloqueo()`. Como las escrituras están serializadas por el bloqueo, los instantes de registro quedan en el mismo orden que la confirmación y que `secuencia` (03 §5.4). Con `now()` (inicio de la transacción, antes de esperar el bloqueo), una escritura que esperó podría quedar con un instante anterior al de otra que se confirmó antes.
- **Milisegundos.** `instante` se trunca a milisegundos en la base (`date_trunc('milliseconds', …)`), y todos los instantes que entran al motor se cargan con milisegundos (5.2). Así el valor guardado, el que tiene la aplicación y el que ve el motor son idénticos (un `Date` de JavaScript solo tiene milisegundos).
- Si la espera del bloqueo cruza la medianoche, `instante` puede caer en el día siguiente a `hoy`. No afecta ningún número: los instantes solo ordenan y nunca deciden un período (D2).
- El mismo `instante` sirve para todas las filas de una operación; los empates se resuelven con `secuencia` (CB-21).
- `máx(…, anterior + 1 ms)` garantiza la condición de `f_fechas_hoy` de que `clave_orden` aumente al cambiar la fecha (S3-5).

**Alternativas descartadas.** `now()` (orden inverso posible, explicado arriba); el reloj de la función de Vercel (`Date.now()`), que es otro reloj distinto del de la base.

#### 13.1.3 Instante a fecha local

`fechaLocalDeInstante(instante)` en `@finn/aplicacion/tiempo`:

```ts
const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit',
});
export const fechaLocalDeInstante = (i: Instante): FechaLocal =>
  FechaLocal.desdeTexto(formato.format(new Date(i)));   // 'AAAA-MM-DD'
```

Usos: la fecha de un SMS que no la trae (OP-35 paso 5, contada desde `recibido_en`; N-02) y la presentación de instantes en la interfaz. Es el **único** uso de `Intl` para fechas en el servidor (P4-9).

#### 13.1.4 Reloj simulado de pruebas (BE-30)

**[F7]** **CT-01.** Rige esta nota sobre el texto de esta sección. `FINN_HOY_SIMULADO` se reemplaza por **`FINN_RELOJ_ARCHIVO`**: un archivo `{ instante, fijadoEn }` que el servidor relee en cada petición, así el reloj se cambia sin reiniciar. **Lista de permitidos:** el reloj de prueba solo se activa si `FINN_ENTORNO === 'pruebas'` y `VERCEL_ENV` no está definida (con cualquier valor); en cualquier otro caso, si existe `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO`, la app no arranca (`instrumentation.ts`) y `relojDePrueba()` devuelve `null`. `NODE_ENV` no decide (`next start` corre con `NODE_ENV=production`). `escribir()`, `leer()` y la transacción de guardado del webhook fijan, además de `finn.hoy`, `finn.desfase_ms`, que solo tiene efecto en bases de prueba (CT-02). Detalle en `07-pruebas.md` §4.3.

- Variable `FINN_HOY_SIMULADO=AAAA-MM-DD`, permitida solo si `NODE_ENV !== 'production'` y `VERCEL_ENV` no es `production`. Si existe en producción, la aplicación no arranca (ADR-19).
- Cuando existe, `escribir()` y `leer()` ejecutan `SELECT set_config('finn.hoy', $1, true)` antes de la primera lectura (paso 2 de 4.2, paso 3 de 5.1).
- La base solo lo respeta si tiene `finn.reloj_simulado = on` como parámetro de base de datos (DB-08), que solo existe en las bases de prueba.
- Así los escenarios de 2027 (01 §8) corren por toda la pila con un único mecanismo de reloj: la base.

**Alternativa descartada:** inyectar `hoy` desde la aplicación sin pasar por la base; la aplicación y los triggers podrían discrepar.

### 13.2 `FechaLocal`

- Tipo de `@finn/dominio/valores` (ADR-16): `'AAAA-MM-DD'` con marca de tipo, construido solo con `FechaLocal.desdeTexto()`, que valida el formato y que el día exista.
- **Entre la base y el dominio** (solo en `@finn/db/mapeo/fechas.ts`, ADR-16):
  - **Lectura con `json_agg`** (carga del motor, 5.2): la base ya entrega `"AAAA-MM-DD"`; no hay `Date` en el camino.
  - **Lectura con Prisma** (tablas [H], filas sueltas): `Date` a medianoche UTC → `fecha.toISOString().slice(0, 10)`.
  - **Escritura con Prisma:** `new Date(`${fecha}T00:00:00.000Z`)`.
  - Prohibido usar `getDate()`, `getMonth()`, `getFullYear()`, `setHours()` y similares sobre fechas de la base: con una zona distinta de UTC devuelven el día anterior (V-14). La regla de lint (ADR-21) cubre todo el repositorio salvo `mapeo/fechas.ts`.
- **Zona del proceso:** `TZ=UTC` en todos los entornos (variable de Vercel, scripts de prueba y CI; ADR-05). Una prueba de integración corre la ida y vuelta con `TZ=America/El_Salvador` para demostrar que el mapeo no depende de la zona.
- **En la frontera JSON:** `FechaLocal` viaja como la misma cadena. El contrato la valida con el primitivo `fechaLocal` (`/^\d{4}-\d{2}-\d{2}$/` + día existente) y la convierte con `FechaLocal.desdeTexto`.

### 13.3 `Centavos`, revisión e identificadores en la frontera (BE-28, BE-29)

| Dato | Dominio | JSON hacia el servidor (entrada) | JSON hacia la interfaz (salida) | Base |
|---|---|---|---|---|
| Monto | `Centavos` (entero) | **Texto decimal**: `"1234.50"` (primitivo `montoTexto`) | Entero en centavos: `123450` | `integer` |
| Monto con signo (saldo inicial de tarjeta, ajuste de inversión, saldo del estado de cuenta) | `Centavos` | `"-1234.50"` (`montoTextoConSigno`) | Entero con signo | `integer` |
| Fecha de negocio | `FechaLocal` | `"2026-10-13"` | `"2026-10-13"` | `date` |
| Instante | `Instante` (texto ISO UTC con ms) | No se recibe del cliente | `"2026-10-14T04:04:00.549Z"` | `timestamptz` |
| Revisión | `bigint` | `"1234"` (`/^\d{1,19}$/`) | `"1234"` | `bigint` |
| Id | `Uuid` | `"…"` (`z.uuid()`) | `"…"` | `uuid` |

**Montos de entrada como texto (BE-28).**
- `montoTexto`: `/^\d{1,8}(\.\d{1,2})?$/`, convertido con `Centavos.desdeTexto()` sin pasar por flotantes (ADR-15).
- Máximo `21474836.47`: el límite de una columna `integer` en centavos (ADR-05). Un valor mayor es `VALIDACION`.
- La interfaz nunca hace aritmética con montos (ADR-07): envía lo que escribió el usuario y recibe enteros para formatear. **[F5] Excepción (CP-6, PF-3):** puede sumar y restar, con `@finn/dominio/valores`, los montos **que el usuario está escribiendo** (por ejemplo, la diferencia entre el total y las líneas de un gasto dividido), solo como ayuda visual; nunca envía un valor calculado así ni lo muestra como dato de Finn. Una regla de lint lo limita a los formularios (1.3).

**Montos de salida como enteros.** La interfaz los formatea con `Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })` (**[R1]** `$1,234.50`, V-18, 7.10) dividiendo entre 100 **solo para presentar**, en un único módulo de formato de `apps/web` exceptuado de la regla de lint sobre `/` (ADR-21). Las sumas del motor caben en `Number.isSafeInteger`.

**Revisión como texto (BE-29).** `bigint` no se serializa en JSON ni en las Server Actions de forma uniforme. La cadena decimal evita el problema y conserva el valor exacto.

**Alternativas descartadas.** Montos de entrada como enteros en centavos (obligaría a la interfaz a convertir texto en centavos: aritmética en el cliente); revisión como `number` (correcto hasta 2⁵³, pero obliga a convertir en cada frontera de todas formas).

### 13.4 Zona y "hoy" en la interfaz

- La interfaz no decide nada con la fecha del dispositivo: cada consulta devuelve `hoy` y `periodoActivo` del servidor (5.5).
- **[R1]** Fechas e instantes se muestran con los formatos de 7.10: `dd/mm/aaaa` y `dd/mm/aaaa HH:mm` en America/El_Salvador (`Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', … })`, V-18).
- El refresco al cambiar el día es de la Fase 5 (RT-21).

### 13.6 Zona horaria de la sesión de base de datos (BE-33) **[R1]**

**[F7]** **CT-02.** Donde BE-33 dice "`DEFAULT now()`", léase "`DEFAULT finn.ahora()`". Detalle en `07-pruebas.md` §4.4.

**Hallazgo (V-17).** Con Prisma 7 y `@prisma/adapter-pg`, una columna `timestamptz` escrita o leída con el cliente de Prisma (no con `$queryRaw`) se envía y se interpreta como hora UTC **sin zona**: PostgreSQL la convierte con la zona de la **sesión** (`TimeZone`). Si la sesión no está en UTC:
- un instante escrito con Prisma queda desplazado (con `America/Guatemala`, `04:00Z` se guarda como `10:00Z`);
- un instante escrito por la base (`DEFAULT now()`, `recibido_en`) se lee desplazado en sentido contrario;
- la comparación entre ambos (por ejemplo, `hora_registro` de una transacción aprobada desde un SMS frente a `recibido_en`, o el orden D2 frente a instantes escritos por SQL) se rompe.

No depende de `TZ` del proceso Node (probado con `UTC` y `America/El_Salvador`); solo de la sesión. `@db.Date` no se ve afectado.

**Decisión.**
1. `escribir()` y `leer()` ejecutan `SELECT set_config('TimeZone', 'UTC', true)` como segunda sentencia de **toda** transacción (paso 2 de 4.2, paso 3 de 5.1). Es estado de transacción, compatible con el pooler en modo transacción (ADR-05).
2. Toda escritura técnica sin bloqueo ([I] y [T]: guardar el SMS, notificaciones, eventos) también se hace dentro de una transacción corta del servicio que fija la zona. Ningún código accede a la base fuera de `@finn/db/transacciones.ts` (regla de lint de 4.10).
3. Segunda barrera: el cliente se crea con `new PrismaPg({ connectionString, options: '-c TimeZone=UTC', max: 3 })`. Supavisor podría no reenviar `options`; por eso no se confía solo en él. La prueba de humo (§17) registra si llega.
4. La primera consulta de cada transacción verifica `current_setting('TimeZone') = 'UTC'` en desarrollo y pruebas (aserción), para detectar una ruta que se salte el paso.
5. Una prueba de integración corre la ida y vuelta de instantes con la sesión de la base en `America/Guatemala` (`ALTER DATABASE … SET timezone`) para demostrar que el paso 1 basta.

**Alternativas descartadas.**
- Confiar en que Supabase usa UTC por defecto: no está garantizado para siempre ni lo controla Finn, y la base de CI o local puede no estarlo (como la de esta verificación).
- `ALTER ROLE finn_app SET timezone = 'UTC'` en el bootstrap: funciona, pero cambia `tools/db/bootstrap.sql` de 03; queda como mejora opcional para registrar si se reabre 03.
- Escribir todos los instantes con SQL crudo: renuncia al cliente tipado en todas las escrituras.

### 13.5 Verificación

- V-14: ida y vuelta de `@db.Date` y el fallo de `getDate()` con otra zona.
- **[R1]** V-17: desfase de `timestamptz` según la zona de la sesión; corregido con 13.6.
- **[R1]** V-18: formatos de `Intl` en Node 24.
- V-15: la consulta del paso 3 de 4.2 devuelve `revision`, `hoy` e `instante` con el formato esperado (`2026-10-14T04:04:00.549Z`), y `json_build_array` serializa una columna `date` como `"2026-10-10"`, sin hora.


---

# Parte B1

## 3. Catálogo de operaciones de escritura

### 3.0 Convenciones del catálogo

#### 3.0.1 Forma de cada ficha

Cada operación tiene una ficha con estos campos. Lo que una ficha no repite lo fijan las reglas comunes de 3.0.2 a 3.0.7.

| Campo | Contenido |
|---|---|
| **Entrada** | Campos del contrato Zod (`@finn/aplicacion/contratos`), con los primitivos de 2.6 y 13.3 |
| **Idempotencia** | Clase de 4.6 y su clave |
| **Confirmación** | Avisos que obligan a previsualizar y confirmar con `huellaImpacto` (4.3) |
| **Precondiciones** | Reglas que verifica `aplicar` (el dominio) o la aplicación bajo el bloqueo, con su código de rechazo (3.0.6) |
| **Hechos** | Filas que escribe, por tabla y fase del traductor (F1 a F4, 4.5.2). Solo se escriben hechos; los derivados se recalculan (§5.0.2 de 01) |
| **Avisos** | Avisos que produce: *antes* (previsualización), *después* (en el resultado) y *estado* (los muestran las consultas) |
| **Errores** | Códigos de rechazo propios de la operación (además de los comunes de 3.0.7) |
| **Posteriores** | Efectos después del `COMMIT` (4.9): notificación, push, revalidación |

`operacionDeclarada` (4.4) solo aparece en OP-06 y OP-12.

#### 3.0.2 Campos comunes de entrada

| Campo | Tipo | Dónde | Regla |
|---|---|---|---|
| `id` | `Uuid` | Operaciones de **creación** | Id del hecho principal, generado por el cliente; clave de idempotencia (4.6.1). Las filas secundarias reciben ids del `GeneradorIds` (BE-31) |
| `esperado` | Objeto con los valores vistos | Operaciones de **valor absoluto** | Un campo por cada valor que cambia, con el valor que mostró la interfaz (4.6.2) |
| `revisionVista` | `Revision` | Operaciones que pueden requerir confirmación | La de la previsualización (4.3) |
| `huellaImpacto` | `string` (64 hex) | Ídem | La de la previsualización (4.3) |

Primitivos: `Uuid`, `FechaLocal`, `MontoTexto` (> 0), `MontoTextoConSigno`, `TextoLimpio`, `Revision` (2.6, 13.3). "Opcional" significa que el campo puede faltar; ningún campo admite `null` salvo que se diga.

**Destino de una línea** (gastos, devoluciones sin compra, movimientos, programadas):

```ts
type DestinoLinea =
  | { categoriaId: Uuid }
  | { deudorId: Uuid }
  | { deudorNuevo: TextoLimpio };   // crea el deudor; si ya existe uno con ese nombre (sin mayúsculas), lo reutiliza
```

`deudorNuevo` reutiliza el deudor existente con el mismo nombre (sin distinguir mayúsculas, como la unicidad de 03 §3.11) y lo informa en el resultado. **Justificación:** un mismo nombre escrito dos veces es casi siempre la misma persona; la unicidad de 03 impediría crear otro.

#### 3.0.3 Salida común

```ts
type SalidaOperacion = {
  id?: Uuid;                       // el del hecho principal, si la operación lo crea
  avisos: AvisoMostrado[];         // los "después" (texto en voseo, 7.10)
  propuestas?: Propuesta[];        // ofertas de un toque: AV-08, AV-14, AV-22, regla de comercio…
};
```

Con `ResultadoAccion<T>` de 7.1 (`yaAplicada` indica idempotencia).

**[F5] Forma de `Propuesta` (CP-8).** Trae la entrada completa, calculada por el servidor, para que la interfaz no calcule montos:

```ts
interface Propuesta {
  aviso: 'AV-08' | 'AV-14' | 'AV-22' | 'regla_comercio';
  texto: string;                                       // en voseo (7.10)
  operacion: 'OP-14' | 'OP-11' | 'OP-41';
  entrada: Record<string, unknown>;                    // entrada completa de la operación, validada por su contrato,
                                                       // sin id, modo, revisionVista ni huellaImpacto
}
```

| Propuesta | Operación | Entrada que arma el servidor |
|---|---|---|
| AV-08 "devolver la reserva excedente" | OP-14 sobre pago(t) en A | `montoNuevo` = Asig − RE(t) como texto, `esperado.monto` = Asig |
| AV-14 "sacar el Disponible de una archivada" | OP-11 | `monto` = Disp(c, A), `destino: 'lpa'`, `esperado` |
| AV-22 después de un cobro sin asignar | OP-14 sobre pago(t) en A | `montoNuevo` = Asig + R, `esperado.monto` = Asig |
| "Recordar esta categoría para este comercio" | OP-41 crear | `patron`, `categoriaId` (el `id` lo agrega el cliente) |

La interfaz ejecuta la propuesta tal cual (un toque) o abre el flujo correspondiente con la entrada como valores iniciales.

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

**[F5] Salida de OP-37 y OP-50 (CP-15):** además de `SalidaOperacion`, `aprobado` (ver OP-37).

#### 3.0.4 Patrones de escritura reutilizados

**PT — Alta de una transacción.** Lo usan todas las operaciones que crean una transacción.

| Tabla | Fase | Columnas |
|---|---|---|
| `deudores` | F3 | Solo si una línea trae `deudorNuevo` y no existe: `id` (generador), `nombre` |
| `transacciones` | F3 | `id`; `tipo`; `fecha`; `hora_registro` = `instante` (o `recibido_en` del SMS en OP-37, 13.1.2); `clave_orden` = `hora_registro`; `origen`; `estado_bancario` = `confirmada` si `origen = 'importada'`, si no `pendiente` (03 §4.6.2); `comercio`; `nota`; `total`; `moneda_original` y `monto_original` (juntos u omitidos); `linea_cobrada_id` (solo `cobro`) |
| `efectos` | F3 | Uno o dos, con el signo y la cuenta de la tabla de 03 §4.5.1 para el tipo; `interes` y `seguro` solo en el efecto sobre el préstamo de una `cuota_prestamo` |
| `lineas` | F3 | Solo en los tipos con líneas (inv. 6): `orden` 1..n en el orden de la entrada; `monto`; exactamente uno de `categoria_id`, `deudor_id`, `linea_original_id` |

`secuencia` y `revision` las fija la base y vuelven por `RETURNING` (BE-32).

**PE — Edición de una transacción** (OP-28 y las que la usan, como OP-37 con coincidencia sobre una registrada):
- `transacciones` F4: `fecha` y `clave_orden` (= `máx(instante, anterior + 1 ms)`, 13.1.2), `total`, `comercio`, `nota`, `moneda_original`, `monto_original`.
- `efectos` F4 (cambio de monto o de cuenta), o F2 + F3 si cambia el número de efectos (no ocurre: el tipo es inmutable).
- `lineas`: según BE-16 (F2 + F3 para las líneas sin eventos que cambian; F4 de `categoria_id` o `monto` para las que tienen eventos).
- Si la transacción estaba `conciliada` y cambia `fecha`, `total` o el efecto sobre la cuenta conciliada (P12), se aplica **PC**.

**PC — Cambio posterior de una conciliación** (P12, N6; 03 §3.27 y §4.6.2):
- `cambios_posteriores` F3: `conciliacion_id` = la de la transacción; `transaccion_id` = la transacción (o **nulo** si la operación la elimina, porque la fila se borra en la misma operación y la FK no puede apuntar a ella); `motivos` (`monto`, `fecha`, `cuenta`, `eliminacion`); **foto** con los valores tal como se conciliaron: `fecha`, `monto_efecto` (el efecto sobre la cuenta conciliada, con signo) y `comercio`.
- `transacciones` F4 (si no se elimina): `estado_bancario = 'confirmada'`, `conciliacion_id = null`.
- Aviso AV-16 antes de confirmar.
- 03 exige que el cambio posterior se cree en la misma transacción de base de datos (`es_de_esta_transaccion`); por eso PC siempre va dentro de la operación que lo provoca.

**PM — Vínculo de un movimiento aprobado** (OP-37, OP-38, OP-50):
- `movimientos` F4: `estado = 'aprobado'`, `transaccion_id` = la transacción creada o vinculada.
- `ocurrencias_resueltas` F3 o F4 si hubo emparejamiento (3.6).

#### 3.0.5 Avisos por clase

| Aviso | Clase | ¿Obliga a confirmar? | Quién lo produce |
|---|---|---|---|
| AV-01 Impacto retroactivo en el período activo | Antes y después | **Sí** | Toda operación que cambie un hecho con fecha en un período cerrado o que lo mueva de período (§5.0.3). **[R2]** El registro automático (OP-43) nunca escribe en un período cerrado: deja la ocurrencia pendiente y notifica; OP-38 tampoco aprueba en lote nada retroactivo. **[R2]** Después de confirmar, AV-01 se registra en `notificaciones` sin push (BE-38) |
| AV-10 Pago que supera lo reservado | Antes | **Sí** | OP-23 |
| AV-11 LPA quedará negativo | Antes | **Sí** | OP-14, OP-15 (si deja LPA negativo), OP-16 |
| AV-12 Fecha desde la que aplica el ciclo | Antes | **Sí** | OP-19 |
| AV-13 Impacto de una fusión | Antes | **Sí** | OP-12 |
| AV-15 Impacto de eliminar una cuenta | Antes | **Sí** | OP-06 |
| AV-16 Edición o eliminación de una transacción conciliada | Antes | **Sí** | OP-28, OP-29, OP-34, OP-37 (coincidencia con una registrada conciliada) |
| AV-18 Auto-asignar: lo que quedó sin cubrir | Después | No | OP-17 |
| AV-19 Aprobar todos: no aprobados y motivo | Después | No | OP-38 |
| AV-21 Diferencia de conciliación | Después y estado | No | OP-47 |
| AV-22 Propuesta de asignar un cobro a pago(t) | Después (propuesta) | No | OP-31 |
| AV-23 Notificaciones de la bandeja | Notificación | No | OP-35, OP-43, OP-49 |
| AV-24 Cambio en "te falta reservar" de dos tarjetas | Después | No | OP-27c |
| AV-02 a AV-09, AV-14, AV-17, AV-20 | Estado | No | Selectores de la instantánea (§6, Parte B2). Una operación los incluye en `avisos` **después** solo si aparecen o cambian por ella |

Las operaciones OP-06, OP-12 y OP-19 **siempre** requieren confirmación, aunque el impacto sea nulo (4.3).

#### 3.0.6 Catálogo de rechazos del dominio

Cada código es un `CodigoRechazo` (7.5). Categoría `DOMINIO` salvo que se indique otra. Los textos entre llaves son datos del rechazo, formateados con 7.10.

**Comunes**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `fecha_posterior_a_hoy` | Una fecha de transacción o evento es posterior a `hoy` | "La fecha no puede ser posterior a hoy ({hoy})." | inv. 12 |
| `fecha_anterior_a_apertura` | La fecha es anterior a la apertura de una cuenta de sus efectos | "{cuenta} se abrió el {apertura}; la fecha no puede ser anterior. Podés cambiar la fecha de apertura." | inv. 12, CB-19 |
| `cuenta_archivada` | Se usa una cuenta archivada en un movimiento nuevo, o se cambia su saldo | "{cuenta} está archivada. Desarchivala para registrar o cambiar movimientos." | §5.0.5, A-1, CB-24 |
| `cuenta_tipo_no_valido` | El tipo de cuenta no corresponde a la operación | "Esta operación no se puede hacer con una cuenta de tipo {tipo}." | 2.2.9 |
| `cuentas_iguales` | Origen y destino son la misma cuenta | "Elegí dos cuentas distintas." | CB-29 |
| `categoria_archivada` | Destino nuevo en una categoría archivada, o δ > 0 | "{categoria} está archivada. Elegí una categoría activa." | inv. 20 |
| `categoria_de_pago_no_permitida` | Una línea, meta, regla o programada apunta a una categoría de pago | "Las categorías de pago de tarjeta no se pueden usar aquí." | inv. 8, 23 |
| `suma_lineas_distinta` | Σ líneas ≠ total | "Las partes suman {suma} y el total es {total}." | inv. 6 |
| `linea_sin_destino` | Una línea no tiene categoría ni deudor | "Cada parte necesita una categoría o un por cobrar." | inv. 8, error 9 |
| `invariante_violada` | El estado resultante rompe una invariante de §6 de 01 | Categoría **`INTERNO`** (2.4) | §5.0.1 |

**Cuentas**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `ultimos4_repetidos` | Otra cuenta de la misma institución tiene los mismos últimos cuatro dígitos | "Ya tenés una cuenta de {institucion} terminada en {ultimos4}." | OP-01, B-5 |
| `apertura_posterior_a_movimientos` | La nueva fecha de apertura es posterior a una transacción de la cuenta | "Hay movimientos desde el {fecha}; la apertura no puede ser posterior." | OP-02 |
| `cuenta_con_saldo` | Archivar con saldo ≠ 0 | "Para archivar {cuenta}, su saldo debe ser $0.00 (hoy es {saldo})." | R4 |
| `tarjeta_con_deuda` | Archivar una tarjeta con deuda | "{cuenta} todavía tiene una deuda de {deuda}." | R4 |
| `reserva_tarjeta_no_cero` | Archivar una tarjeta con Disp(pago(t), A) ≠ 0 | "La categoría de pago de {cuenta} tiene {disponible}; movelo antes de archivar." | OP-04, A-5 |
| `cuenta_con_movimientos` | Eliminar una cuenta con transacciones aparte del saldo inicial | "{cuenta} tiene movimientos. Podés archivarla en lugar de eliminarla." | H9, N7 |
| `cuenta_con_programadas` | Eliminar una cuenta que es origen o destino de una programada | "{cuenta} se usa en {n} transacciones programadas. Cambialas o eliminalas primero." | HZ-1 |
| `cuenta_ya_archivada`, `cuenta_no_archivada` | Transición de archivo inválida | "{cuenta} ya está archivada." / "{cuenta} no está archivada." | R4 |

**Categorías y grupos**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `nombre_repetido` | Nombre igual (sin mayúsculas) en el mismo grupo, o grupo con nombre repetido. **[R2]** En tarjetas (BE-35) se comparan **todas** las categorías de pago, también las de tarjetas archivadas | "Ya existe {nombre} en {grupo}." **[R2]** Si el nombre lo usa una tarjeta archivada: "El nombre {nombre} lo usa la tarjeta archivada {tarjeta}. Elegí otro o desarchivala." | OP-01, OP-02, OP-07, OP-52, S3-8 |
| `grupo_archivado` | Crear o mover a un grupo archivado, o desarchivar una categoría con su grupo archivado sin desarchivarlo | "{grupo} está archivado." | OP-07, OP-08, OP-10 |
| `grupo_del_sistema` | Crear o mover una categoría normal a "Pagos de tarjeta", sacar de ahí una de pago, o archivar o eliminar ese grupo | "El grupo Pagos de tarjeta lo administra Finn." | S3-9 |
| `categoria_ya_archivada`, `categoria_no_archivada` | Transición inválida | "{categoria} ya está archivada." / "{categoria} no está archivada." | OP-09, OP-10, OP-11 |
| `categoria_de_pago_con_tarjeta` | Archivar, desarchivar o eliminar una categoría de pago por su cuenta | "Esta categoría se archiva o elimina junto con su tarjeta." | OP-09, OP-10, OP-13 |
| `programada_sin_decision` | Archivar sin indicar qué hacer con cada programada activa | "Decidí qué hacer con {n} transacciones programadas de {categoria}." | M3 |
| `destino_igual_origen` | El destino del dinero es la misma categoría | "Elegí otra categoría." | OP-09, OP-11, OP-15 |
| `monto_mayor_que_disponible` | Sacar más que el Disponible de una archivada | "{categoria} tiene {disponible}." | OP-11 |
| `fusion_misma_categoria` | Origen = destino | "Elegí dos categorías distintas." | OP-12 |
| `fusion_categoria_de_pago` | Origen o destino es de pago | "Las categorías de pago de tarjeta no se fusionan." | F3 |
| `fusion_destino_archivado` | Destino archivado | "La categoría destino debe estar activa." | N4 |
| `categoria_con_historial` | Eliminar con líneas, eventos, asignaciones, programadas o reglas | "{categoria} tiene historial. Podés archivarla o fusionarla." | H9 |
| `grupo_no_vacio` | Eliminar un grupo con categorías | "{grupo} tiene categorías." | supuesto 18 |
| `grupo_con_categorias_activas` | Archivar un grupo con categorías activas | "Archivá primero todas las categorías de {grupo}." | supuesto 18 |

**Presupuesto, metas y ciclo**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `periodo_no_valido` | `periodoInicio` no es el inicio de un período | "Ese período no existe." | §4.2 |
| `periodo_cerrado` | Cambiar lo asignado en un período cerrado | "No se puede cambiar lo asignado en un período cerrado." | inv. 18 |
| `lpa_negativo_en_futuro` | Asignación en un período futuro que dejaría LPA < 0 | "Para asignar en un período futuro necesitás dinero listo para asignar; te faltan {faltante}." | I1, inv. 19 |
| `meta_ya_existe` | La categoría ya tiene meta | "{categoria} ya tiene una meta." | OP-18 |
| `meta_en_categoria_de_pago` | Meta en una categoría de pago | "Las categorías de pago de tarjeta no tienen metas." | I2 |
| `fecha_objetivo_pasada` | Meta para una fecha con fecha objetivo < hoy | "La fecha objetivo no puede ser anterior a hoy." | OP-18, CB-27 |
| `ciclo_sin_cambio` | El día de inicio nuevo es el vigente | "El ciclo ya empieza el día {dia}." | OP-19 |

**Transacciones y eventos**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `desglose_no_cuadra` | capital + interés + seguro ≠ total | "Capital, interés y seguro suman {suma}; el pago es de {total}." | OP-24 |
| `capital_mayor_que_pendiente` | capital > capital pendiente | "El capital ({capital}) supera lo que debés del préstamo ({pendiente})." | OP-24 |
| `retiro_mayor_que_valor` | Retiro > valor de la inversión | "La inversión vale {valor}." | OP-25 |
| `valor_inversion_negativo` | Ajuste que deja valor < 0 | "El valor de la inversión no puede quedar negativo." | OP-25 |
| `cambio_cuenta_con_devoluciones` | Cambiar la cuenta de una transacción con devoluciones vinculadas | "Esta compra tiene devoluciones; no se puede cambiar su cuenta." | OP-28 |
| `cambio_tipo_de_cuenta_incompatible` | La cuenta nueva no admite el tipo de transacción | "Esta transacción no puede pasar a {cuenta}." | OP-28 |
| `linea_menor_que_eventos` | Una línea queda por debajo de lo ya cobrado, condonado o devuelto | "Esa parte ya tiene {resuelto} cobrado, condonado o devuelto." | CB-03, inv. 9, 10 |
| `linea_con_eventos_cambio_destino` | Una línea con eventos cambia entre categoría y por cobrar, o de deudor | "Esa parte tiene cobros o devoluciones; no puede cambiar de destino." | OP-28 |
| `fecha_posterior_a_eventos` | La nueva fecha deja algún evento antes de su transacción | "Hay cobros o devoluciones del {fecha}; la compra no puede ser posterior." | OP-28, inv. 12 |
| `transaccion_con_eventos` | Eliminar una transacción con eventos vinculados | "Esta compra tiene cobros, condonaciones o devoluciones. Eliminalos primero." | CB-04 |
| `transicion_estado_bancario_invalida` | Cambio de estado bancario no permitido a mano | "Ese cambio de estado no está permitido." | §7.2 |
| `linea_no_es_por_cobrar` | Cobro o condonación sobre una línea de categoría | "Esa parte no es un por cobrar." | P9 |
| `sin_saldo_abierto` | Cobro sobre un por cobrar sin saldo abierto en esa fecha | "Ese por cobrar no tiene saldo pendiente al {fecha}." | B-7, CB-23 |
| `condonacion_mayor_que_abierto` | K > saldo abierto | "Solo quedan {abierto} por cobrar." | inv. 9, CB-22 |
| `devolucion_mayor_que_linea` | X_i > capacidad de su línea | "En esa parte quedan {capacidad} por devolver." | inv. 9, 10, I5 |
| `devolucion_mayor_que_total` | Σ devoluciones > total | "Las devoluciones superarían el total de la compra ({total})." | inv. 11 |
| `reparto_devolucion_distinto` | Σ X_i ≠ X | "El reparto suma {suma} y la devolución es de {total}." | OP-33a |
| `devolucion_de_no_gasto` | Devolución vinculada a algo que no es un gasto | "Solo las compras admiten devoluciones vinculadas." | C-3, CB-31 |
| `evento_anterior_a_original` | Fecha del evento < fecha de la transacción original | "El evento no puede ser anterior a la compra ({fecha})." | inv. 12 |
| `eliminar_evento_rompe_limites` | Eliminar el evento dejaría lo resuelto por encima del monto | "No se puede eliminar: otros eventos dependen de este." | OP-34 |

**Revisión, programadas y conciliación**

| Código | Condición | Mensaje | Origen |
|---|---|---|---|
| `arrastre_no_permitido` **[F6]** | Variante `{ categoriaId }` de OP-37 sobre un movimiento que no es un gasto pendiente con a lo sumo una línea hacia una categoría o sin destino | "Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo." | CF-21 |
| `movimiento_estado_no_valido` | La acción no corresponde al estado del movimiento | "Este movimiento ya está {estado}." | §7.1 |
| `movimiento_sin_cuenta` | Aprobar sin cuenta | "Elegí la cuenta de este movimiento." | CB-15 |
| `movimiento_incompleto` | Falta fecha, monto o tipo | "Completá {campos} antes de aprobar." | OP-37 |
| `ocurrencia_ya_resuelta` | La ocurrencia propuesta ya está resuelta | "Ese pago programado ya está registrado." | inv. 15, CB-16 |
| `ocurrencia_no_valida` | La fecha no es una ocurrencia de la programada | "Esa fecha no corresponde a la programada." | §4.16 |
| `sms_no_reprocesable` | Reprocesar un SMS cuyo movimiento no está en `error` | "Este SMS no tiene un error que reprocesar." | N-02 |
| `patron_repetido` | Regla con patrón repetido (sin mayúsculas) | "Ya hay una regla para {patron}." | OP-41 |
| `calendario_con_historial` | Cambiar primera fecha o frecuencia con resoluciones o con una coincidencia propuesta | "Esta programada ya tiene pagos registrados. Terminala y creá otra con el calendario nuevo." | P3-6b, HZ-3 |
| `programada_con_historial` | Eliminar una programada con historial | "Esta programada tiene historial. Podés desactivarla." | HZ-1 |
| `registro_automatico_sin_modelo` | Registro automático de una cuota sin modelo de cálculo | "Para registrar sola una cuota, el préstamo necesita un modelo de cálculo." | QB-1 **[R2]** |
| `formato_no_reconocido` | El CSV no coincide con ningún formato | "No reconocimos el formato. Descargá el estado de cuenta en CSV desde el portal del banco." | OP-45 |
| `formato_ambiguo` | Coinciden varios formatos | "El archivo coincide con más de un formato y no sabemos de qué banco es. Revisá que sea el estado de cuenta correcto." | ADR-17 |
| `archivo_pdf` | El archivo es PDF | "Finn lee el estado de cuenta en CSV, no en PDF." | ADR-17 |
| `firma_no_valida` | La firma HMAC no verifica | "El estado de cuenta cambió o no es válido. Volvé a subirlo." | P4-14 |
| `firma_vencida` | Pasaron más de 24 h | "Pasaron más de 24 horas. Volvé a subir el estado de cuenta." | P4-14 |
| `coincidencia_no_valida` | Un par marcado no cumple el criterio de §4.17 (misma cuenta, monto, ±3 días, 1 a 1) | "Ese movimiento no coincide con la transacción elegida." | supuesto 10 |
| `transaccion_ya_conciliada` | Marcar una transacción que ya está conciliada | "Esa transacción ya está conciliada." | §7.2 |
| `transaccion_fuera_de_verificacion` **[F6]** | OP-53: una transacción marcada tiene fecha posterior a la fecha verificada | "Esa transacción es posterior a la fecha que verificaste." | CF-01 |

Una prueba exige que todo código de esta tabla tenga mensaje y pase el control de voseo (7.10).

#### 3.0.7 Errores comunes a todas las operaciones

No se repiten en las fichas: `VALIDACION` (contrato), `NO_AUTORIZADO` (2.2.5), `NO_ENCONTRADO` (código `no_encontrado`, con `datos.entidad`, cuando un id de la entrada no existe; mensaje "Esto ya no existe."), `REQUIERE_CONFIRMACION` (4.3), `CONFLICTO` (`conflicto_id`, `conflicto_desactualizado`; 4.6), `OCUPADO`, `INCIERTO` e `INTERNO` (4.7, 7.4).

#### 3.0.8 Índice

| OP | Nombre | Área (archivo de acciones) | Idempotencia | Confirmación |
|---|---|---|---|---|
| OP-01 | Crear cuenta | cuentas | Creación (`cuentas.id`) | AV-01 |
| OP-02 | Editar cuenta | cuentas | Valor absoluto | AV-01 |
| OP-03 | Reordenar cuentas | cuentas | Valor absoluto (lista completa) | — |
| OP-04 | Archivar cuenta | cuentas | Natural (`archivada`) | — |
| OP-05 | Desarchivar cuenta | cuentas | Natural | — |
| OP-06 | Eliminar cuenta | cuentas | Eliminación | **Siempre** (AV-15, AV-01) |
| OP-07 | Crear grupo o categoría (**[F6]** y su variante en lote, CF-19) | presupuesto | Creación (por elemento) | — |
| OP-08 | Renombrar, reordenar o mover | presupuesto | Valor absoluto | — |
| OP-09 | Archivar categoría (compuesta) | presupuesto | Natural | — |
| OP-10 | Desarchivar categoría | presupuesto | Natural | — |
| OP-11 | Sacar el Disponible de una archivada | presupuesto | Valor absoluto | — |
| OP-12 | Fusionar categorías | presupuesto | Eliminación (origen) | **Siempre** (AV-13, AV-01) |
| OP-13 | Eliminar categoría o grupo; archivar grupo | presupuesto | Eliminación / natural | — |
| OP-14 | Asignar o desasignar | presupuesto | Valor absoluto | AV-11 |
| OP-15 | Mover dinero | presupuesto | Valor absoluto | AV-11 |
| OP-16 | Asignación rápida | presupuesto | Valor absoluto | AV-11 |
| OP-17 | Auto-asignar | presupuesto | Valor absoluto (conjunto) | — |
| OP-18 | Crear, editar o eliminar meta | metas | Creación / valor absoluto / eliminación | — |
| OP-19 | Cambiar el ciclo | ajustes | Valor absoluto | **Siempre** (AV-12) |
| OP-20 | Registrar gasto | transacciones | Creación | AV-01 |
| OP-21 | Registrar ingreso | transacciones | Creación | AV-01 |
| OP-22 | Transferencia neutral | transacciones | Creación | AV-01 |
| OP-23 | Pagar tarjeta | transacciones | Creación | AV-10, AV-01 |
| OP-24 | Cuota o abono a capital | transacciones | Creación | AV-01 |
| OP-25 | Aporte, retiro o ajuste de inversión | transacciones | Creación | AV-01 |
| OP-26 | Desembolso de préstamo | transacciones | Creación | AV-01 |
| OP-27 | Movimientos de tarjeta sin compra (a, b, c) | transacciones | Creación | AV-01 |
| OP-28 | Editar transacción | transacciones | Valor absoluto | AV-16, AV-01 |
| OP-29 | Eliminar transacción | transacciones | Eliminación | AV-16, AV-01 |
| OP-30 | Cambiar estado bancario | transacciones | Valor absoluto | — |
| OP-31 | Cobrar | eventos | Creación | AV-01 |
| OP-32 | Condonar | eventos | Creación | AV-01 |
| OP-33 | Devolver (a, b) | eventos | Creación | AV-01 |
| OP-34 | Eliminar evento | eventos | Eliminación | AV-16, AV-01 |
| OP-35 | Recibir SMS | webhook (§8) | Natural (`movimientos.sms_id`) | — |
| OP-36 | Editar movimiento | bandeja | Valor absoluto | — |
| OP-37 | Aprobar movimiento | bandeja | Natural (`movimientos.transaccion_id`) + creación | AV-01, AV-16 |
| OP-38 | Aprobar todos | bandeja | Natural por elemento | — |
| OP-39 | Descartar o restaurar movimiento | bandeja | Natural | — |
| OP-40 | Resolver coincidencia o posible duplicado | bandeja | Natural | Las de OP-37 al confirmar |
| OP-41 | Reglas de comercio | bandeja | Creación / valor absoluto / eliminación | — |
| OP-42 | Crear, editar, desactivar o reactivar programada | programadas | Creación / valor absoluto / natural | — |
| OP-43 | Registrar ocurrencia (un toque o automático) | programadas, tarea diaria (§10) | Natural (`ocurrencias_resueltas`) | AV-01 |
| OP-44 | Omitir ocurrencia | programadas | Natural | — |
| OP-45 | Iniciar conciliación (lectura) | conciliacion | — (no escribe) | — |
| OP-46 | Agregar desde el estado | conciliacion | Creación | AV-01 |
| OP-47 | Terminar conciliación | conciliacion | Creación (`conciliaciones.id`) | — |
| OP-48 | Condiciones del préstamo | cuentas | Valor absoluto | — |
| **OP-49** | Reprocesar un SMS con error (N-02) | bandeja | Natural (`intentoVisto`) | — |
| **OP-50** | Crear la transacción a mano desde un SMS con error (N-02) | bandeja | Como OP-37 | Como OP-37 |
| **OP-51** | Eliminar una programada sin historial (HZ-1) | programadas | Eliminación | — |
| **OP-52** **[R2]** | Renombrar deudor (QB-2) | eventos | Valor absoluto | — |
| **OP-53** **[F6]** | Verificar saldo (CF-01) | conciliacion | Creación (`conciliaciones.id`) | **Siempre** (previsualizar primero; AV-21 después) |
| OPT-01 … OPT-09 | Operaciones técnicas | 3.10 | 3.10 | — |

#### 3.0.9 Preguntas de la Parte B1 (resueltas) **[R2]**

| # | Pregunta | Resolución |
|---|---|---|
| QB-1 | Registro automático de una cuota de préstamo sin modelo de cálculo | Aprobada la recomendación: OP-42 rechaza `registro_automatico = true` en una programada de cuota cuyo préstamo no tiene modelo (`registro_automatico_sin_modelo`); si el modelo se quita después, OP-43 deja la ocurrencia pendiente y notifica |
| QB-2 | Renombrar o unir deudores | Aprobada: OP-52 Renombrar deudor (3.5). La unión de deudores queda para la Fase 6 (§19) |


### 3.1 Cuentas

#### OP-01 Crear cuenta

- **Entrada:** `id: Uuid`; `tipo: 'efectivo' | 'tarjeta' | 'prestamo' | 'inversion'`; `nombre: TextoLimpio`; `institucionId?: Uuid`; `ultimos4?: string` (`/^\d{4}$/`); `fechaApertura?: FechaLocal` (por defecto, hoy); `saldo: MontoTextoConSigno` (en tarjeta, positivo = deuda; ver nota).
  - Tarjeta: `limiteCredito: MontoTexto`, `tasaAnual?: string` (porcentaje con hasta 4 decimales, convertido a millonésimas, DB-13), `diaCorte: 1..31`, `diaPago: 1..31`, `red?: 'visa' | 'mastercard' | 'otra'`, `color?: /^#[0-9A-F]{6}$/`.
  - Préstamo: `contraparte`, `montoOriginal`, `tasaNominalAnual?`, `tipoTasa`, `seguroPrimerMes?`, `comision?`, `frecuencia`, `frecuenciaDias?`, `cuotaPactada`, `plazoCuotas`, `modeloCalculo?: 'banco_agricola'`, `cuotasPagadasAlCrear` (03 §3.6). `saldo` = capital pendiente (≥ 0).
  - Inversión: `rendimientoAnualEsperado?`. `saldo` = valor (≥ 0).
- **Idempotencia:** creación, `cuentas.id`.
- **Confirmación:** AV-01 si `fechaApertura` cae en un período cerrado.
- **Precondiciones:** `fechaApertura ≤ hoy` (`fecha_posterior_a_hoy`); (`institucionId`, `ultimos4`) único (`ultimos4_repetidos`); en una tarjeta, ninguna otra tarjeta, **abierta o archivada** (**[R2]**), con el mismo nombre sin mayúsculas, porque su categoría de pago lleva ese nombre y 03 exige nombres únicos por grupo (`nombre_repetido`, BE-35); atributos obligatorios del tipo (contrato).
- **Hechos:**
  - F3 `cuentas` (`id`, `tipo`, `nombre`, `institucion_id`, `ultimos4`, `fecha_apertura`, `orden` = máximo + 1, `archivada = false`).
  - F3 subtipo: `tarjetas`, `prestamos` o `inversiones`, con `cuenta_id` = `id`.
  - Tarjeta: F3 `categorias` de pago (`grupo_id` = grupo con `clave_sistema = 'pagos_tarjeta'`, `nombre` = nombre de la tarjeta, `clase = 'pago'`, `tarjeta_id`) (BE-35).
  - Si `saldo ≠ 0`: PT con `tipo = 'saldo_inicial'`, `fecha = fecha_apertura`, `origen = 'manual'`, un efecto en la cuenta: efectivo `+saldo` (o `−` si es sobregiro); tarjeta `−deuda` (o `+saldo a favor` si la entrada es negativa); préstamo e inversión `+saldo`.
- **Avisos:** después: AV-07 si es tarjeta con deuda; AV-01 si la apertura es retroactiva.
- **Errores:** `ultimos4_repetidos`, `nombre_repetido`, `fecha_posterior_a_hoy`.
- **BE-35. Nombre de la categoría de pago.** Es el nombre de la tarjeta y lo sigue al renombrarla. *Justificación:* 01 no fija el nombre, y el usuario reconoce la categoría por su tarjeta. *Alternativa descartada:* "Pago {tarjeta}" fijo al crear; se desactualiza si la tarjeta cambia de nombre.
- **Nota.** En la entrada de una tarjeta, "saldo" es lo que el usuario debe (positivo = deuda), como en el documento de producto §6; el dominio lo convierte a la convención de signos de §0.4 de 01.

#### OP-02 Editar cuenta

- **Entrada:** `cuentaId`; campos editables de OP-01 salvo `tipo`; `fechaApertura?`; `esperado` con los valores vistos de cada campo que cambia.
- **Idempotencia:** valor absoluto.
- **Confirmación:** AV-01 si el saldo inicial cambia de período.
- **Precondiciones:** la nueva apertura no es posterior a ninguna transacción salvo el saldo inicial (`apertura_posterior_a_movimientos`); (`institucionId`, `ultimos4`) sigue siendo único; `fechaApertura ≤ hoy`.
- **Hechos:** F4 `cuentas` y su subtipo (campos cambiados). Si cambia la apertura y hay saldo inicial: PE sobre esa transacción (solo `fecha` y `clave_orden`). Si es tarjeta y cambia el nombre: F4 `categorias.nombre` de su categoría de pago, que sigue al de la tarjeta (BE-35).
- **Avisos:** AV-01 después, si aplica.
- **Errores:** `apertura_posterior_a_movimientos`, `ultimos4_repetidos`, `nombre_repetido` (tarjeta, BE-35), `fecha_posterior_a_hoy`.
- **Nota.** Cambiar el **monto** del saldo inicial es OP-28 sobre esa transacción (01, OP-02).

#### OP-03 Reordenar cuentas

- **Entrada:** `orden: Uuid[]` (todas las cuentas abiertas, en el orden nuevo).
- **Idempotencia:** valor absoluto: si el orden actual ya es el pedido, `ya_aplicada`.
- **Precondiciones:** la lista contiene exactamente las cuentas abiertas (`conflicto_desactualizado` si no).
- **Hechos:** F4 `cuentas.orden` = posición × 10, solo en las filas que cambian.

#### OP-04 Archivar cuenta

- **Entrada:** `cuentaId`; tarjeta: `devolverAsignacionesFuturas: boolean`.
- **Idempotencia:** natural: si ya está archivada, `ya_aplicada`.
- **Precondiciones:** saldo = 0 (`cuenta_con_saldo`). Tarjeta: deuda = 0 (`tarjeta_con_deuda`); Disp(pago(t), A) = 0 (`reserva_tarjeta_no_cero`); sin asignaciones futuras en pago(t), o `devolverAsignacionesFuturas = true` (si no, rechazo `reserva_tarjeta_no_cero` con `datos.futuras`).
- **Hechos:** F2 `asignaciones` futuras de pago(t) si se aceptó; F4 `cuentas.archivada = true`; tarjeta: F4 `categorias.archivada = true` de pago(t) (03 §4.5.4, misma transacción).
- **Errores:** `cuenta_con_saldo`, `tarjeta_con_deuda`, `reserva_tarjeta_no_cero`, `cuenta_ya_archivada`.

#### OP-05 Desarchivar cuenta

- **Entrada:** `cuentaId`. **Idempotencia:** natural.
- **Hechos:** F4 `cuentas.archivada = false`; tarjeta: F4 `categorias.archivada = false` de pago(t).
- **Errores:** `cuenta_no_archivada`.

#### OP-06 Eliminar cuenta

- **Entrada:** `cuentaId`, `revisionVista`, `huellaImpacto`.
- **Idempotencia:** eliminación (`cuentas` en `eliminaciones`).
- **Confirmación:** siempre. La previsualización contiene AV-15: Δ LPA (−saldo inicial si es efectivo; +Σ Asig(pago(t), ·) si es tarjeta), Δ S(t), la categoría de pago que se elimina y **las conciliaciones que se eliminan** (precisión de AV-15, 03 §13.3); AV-01 si había hechos en períodos cerrados.
- **Precondiciones:** sin transacciones aparte del saldo inicial (`cuenta_con_movimientos`); no es origen ni destino de ninguna programada (`cuenta_con_programadas`; 03 HZ-1).
- **operacionDeclarada:** `eliminar_cuenta`.
- **Hechos** (orden de 03 §4.6.4, garantizado por 4.5.2):
  1. F2 `asignaciones` de pago(t), de todos los períodos (F1 de 01).
  2. F2 `transacciones` de saldo inicial (sus `efectos` en cascada).
  3. `eliminarConciliacionesDeCuenta` → `finn.eliminar_conciliaciones_de_cuenta(cuentaId)` (sus cambios posteriores incluidos).
  4. F2 `categorias` pago(t).
  5. F2 `cuentas` (su subtipo en cascada).
- **Errores:** `cuenta_con_movimientos`, `cuenta_con_programadas`.

### 3.2 Grupos y categorías

#### OP-07 Crear grupo o categoría

- **Entrada:** grupo: `{ id, nombre }`; categoría: `{ id, nombre, grupoId }`.
- **Idempotencia:** creación.
- **Precondiciones:** nombre único sin mayúsculas en el grupo, o entre grupos (`nombre_repetido`); el grupo está activo (`grupo_archivado`) y no es "Pagos de tarjeta" (`grupo_del_sistema`).
- **Hechos:** F3 `grupos` (`orden` = máximo + 1) o `categorias` (`clase = 'normal'`, `orden` = máximo del grupo + 1).
- **Errores:** `nombre_repetido`, `grupo_archivado`, `grupo_del_sistema`.
- **[F6] Variante en lote (CF-19; 06 §3.9.1).** Para la plantilla de grupos y categorías, sin operación de dominio nueva.
  - **Entrada:** `{ elementos: { id: Uuid; tipo: 'grupo' | 'categoria'; nombre: TextoLimpio; grupoId?: Uuid }[] }`, de 1 a 15 por llamada. El `grupoId` de una categoría es el de un grupo existente o el id de creación de un grupo de la misma plantilla, ya creado en esta llamada o en una anterior.
  - **Ejecución:** un `escribir()` por elemento, en orden y en serie, cada uno con su transacción, como OP-38 (4.8). No es atómica en conjunto: un elemento que falla no detiene los demás; si falla un grupo, sus categorías de esa llamada responden con el mismo motivo y no se intentan.
  - **Salida:** por elemento y en el orden de la entrada, `{ id, resultado: 'creado' | 'ya_aplicada' | ErrorFinn }`. Reenviar un elemento ya creado responde `ya_aplicada` (4.6.1), lo que permite reanudar con los ids guardados en el borrador.
  - **Revalidación:** una vez por llamada.

#### OP-08 Renombrar, reordenar o mover de grupo

- **Entrada:** `{ tipo: 'grupo' | 'categoria', id, nombre?, grupoId?, orden? }` + `esperado`.
- **Idempotencia:** valor absoluto.
- **Precondiciones:** nombre único; grupo destino activo; una categoría de pago no sale de "Pagos de tarjeta" y una normal no entra (`grupo_del_sistema`).
- **Hechos:** F4 `grupos` o `categorias` (`nombre`, `grupo_id`, `orden`). Reordenar dentro de un grupo actualiza el `orden` de las filas afectadas (posición × 10).
- **Errores:** `nombre_repetido`, `grupo_archivado`, `grupo_del_sistema`.

#### OP-09 Archivar categoría (compuesta)

- **Entrada:** `categoriaId`; `destinoDisponible: { categoriaId } | 'lpa'` (si Disp(c, A) > 0); `cubrirSobregiroCon?: { categoriaId } | 'lpa'` (si Disp(c, A) < 0); `devolverAsignacionesFuturas: true` (obligatorio si las hay); `programadas: { programadaId, accion: 'reasignar', categoriaId } | { programadaId, accion: 'desactivar' }[]` (una por cada programada activa con líneas hacia c).
- **Idempotencia:** natural (si ya está archivada, `ya_aplicada`).
- **Precondiciones:** c es normal y activa (`categoria_de_pago_con_tarjeta`, `categoria_ya_archivada`); destinos activos, normales y distintos de c (`categoria_archivada`, `destino_igual_origen`); una decisión por cada programada activa (`programada_sin_decision`).
- **Hechos:**
  - F4/F3/F2 `asignaciones` de c en A: el valor que deja Disp(c, A) = 0; la variación opuesta en la categoría destino (o ninguna si es LPA).
  - F2 `asignaciones` futuras de c.
  - F4 `programada_lineas.categoria_id` (reasignar) o F4 `programadas.activa = false` (desactivar).
  - F4 `categorias.archivada = true`. Su meta se conserva (B-11).
- **Avisos:** ninguno nuevo; la previsualización muestra el resumen de los pasos (no obliga a confirmar, 3.0.5).
- **Errores:** los de las precondiciones.

#### OP-10 Desarchivar categoría

- **Entrada:** `categoriaId`; `desarchivarGrupo?: boolean`.
- **Idempotencia:** natural.
- **Precondiciones:** su grupo está activo o `desarchivarGrupo = true` (`grupo_archivado`); no es de pago (`categoria_de_pago_con_tarjeta`).
- **Hechos:** F4 `grupos.archivado = false` (si se pidió); F4 `categorias.archivada = false`.

#### OP-11 Sacar el Disponible de una categoría archivada

- **Entrada:** `categoriaId`; `monto: MontoTexto`; `destino: { categoriaId } | 'lpa'`; `esperado: { asignacionOrigen, asignacionDestino? }` (valores de Asig en A).
- **Idempotencia:** valor absoluto.
- **Precondiciones:** c archivada (`categoria_no_archivada`); 0 < monto ≤ Disp(c, A) (`monto_mayor_que_disponible`); destino activo y normal.
- **Hechos:** F3/F4/F2 `asignaciones` de c en A (−monto) y del destino (+monto).
- **Avisos:** estado: AV-14 desaparece cuando Disp(c, A) llega a 0.

#### OP-12 Fusionar categorías

- **Entrada:** `origenId`, `destinoId`, `revisionVista`, `huellaImpacto`.
- **Idempotencia:** eliminación del origen (`categorias` en `eliminaciones` → `ya_aplicada`).
- **Confirmación:** siempre: AV-13 (Δ LPA y Δ Disp(destino, A) por período afectado, meta que se descarta, programadas y reglas que se mueven) y AV-01.
- **Precondiciones:** origen ≠ destino (`fusion_misma_categoria`); ninguna es de pago (`fusion_categoria_de_pago`); destino activo (`fusion_destino_archivado`).
- **operacionDeclarada:** `fusion`.
- **Hechos:** los de 4.5.4: F1 `lineas`, `condonaciones`, `programada_lineas`, `reglas_comercio` (y `movimiento_lineas` con `categoria_id` = origen, [H]) pasan al destino; F2 `asignaciones`, `metas` y `categorias` del origen; F3/F4 `asignaciones` del destino con la suma por período (incluidos los cerrados, O4).
- **Errores:** `fusion_misma_categoria`, `fusion_categoria_de_pago`, `fusion_destino_archivado`.

#### OP-13 Eliminar categoría o grupo; archivar grupo

- **Entrada:** `{ accion: 'eliminar_categoria' | 'eliminar_grupo' | 'archivar_grupo', id }`.
- **Idempotencia:** eliminación o natural.
- **Precondiciones:** categoría sin líneas, eventos, asignaciones, programadas ni reglas (`categoria_con_historial`), y normal (`categoria_de_pago_con_tarjeta`); grupo vacío (`grupo_no_vacio`) o con todas sus categorías archivadas (`grupo_con_categorias_activas`); nunca "Pagos de tarjeta" (`grupo_del_sistema`).
- **Hechos:** F2 `categorias` (su meta en cascada) o `grupos`; o F4 `grupos.archivado = true`.

### 3.3 Presupuesto, metas y ciclo

#### OP-14 Asignar o desasignar

- **Entrada:** `categoriaId`; `periodoInicio: FechaLocal`; `montoNuevo: MontoTextoConSigno` (puede ser negativo, supuesto 6); `esperado: { monto }`; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** valor absoluto sobre Asig(c, p).
- **Confirmación:** AV-11 si p es el activo y LPA queda negativo.
- **Precondiciones:** p es un inicio de período (`periodo_no_valido`), activo o futuro (`periodo_cerrado`); δ > 0 exige c activa (`categoria_archivada`); si p es futuro, LPA resultante ≥ 0 (`lpa_negativo_en_futuro`).
- **Hechos:** F3, F4 o F2 `asignaciones` (`categoria_id`, `periodo_inicio`, `monto`); 0 → eliminar (DB-14).
- **Avisos:** antes: AV-11. Estado: AV-07, AV-08, AV-20 pueden cambiar.
- **Usos derivados:** "devolver la reserva excedente a LPA" (AV-08) es OP-14 sobre pago(t) en A con `montoNuevo = Asig − RE(t)`; "asignar el cobro a pago(t)" (AV-22) es OP-14 sobre pago(t) en A.

#### OP-15 Mover dinero entre categorías

- **Entrada:** `origenId`, `destinoId`, `periodoInicio`, `monto: MontoTexto`, `esperado: { asignacionOrigen, asignacionDestino }`.
- **Idempotencia:** valor absoluto sobre las dos celdas.
- **Confirmación:** no aplica en general (LPA no cambia); AV-11 nunca se produce.
- **Precondiciones:** origen ≠ destino (`destino_igual_origen`); destino activo y normal o de pago (`categoria_archivada`); p activo o futuro (`periodo_cerrado`). El origen puede estar archivado (equivale a OP-11).
- **Hechos:** dos celdas de `asignaciones` (F2/F3/F4).
- **Avisos:** estado: AV-02, AV-03 si el origen queda sobregirado (YNAB).

#### OP-16 Asignación rápida

- **Entrada:** `categoriaId`, `periodoInicio`, `variante: 'falta_meta' | 'igual_periodo_anterior' | 'promedio_gasto'`, `esperado: { monto }`, `revisionVista?`, `huellaImpacto?`.
- **Comportamiento:** la aplicación pide al dominio el valor (selector de la instantánea) y ejecuta OP-14 con `montoNuevo` = ese valor. Variantes de 01 OP-16.
- **Idempotencia, confirmación, errores:** los de OP-14.

#### OP-17 Auto-asignar

- **Entrada:** `periodoInicio`; `categorias?: Uuid[]`; `esperado: { revision }` (la revisión vista: el resultado depende de todo el estado).
- **Idempotencia:** valor absoluto sobre la revisión: si la revisión cambió, `conflicto_desactualizado`. Repetir con la revisión nueva ya no asigna nada (todas las metas cubiertas o LPA ≤ 0), así que es inocuo.
- **Precondiciones:** p activo o futuro.
- **Hechos:** F3/F4 `asignaciones` de cada categoría cubierta, en el orden de grupo y categoría; nunca deja LPA < 0 (inv. 19).
- **Avisos:** después: AV-18.

#### OP-18 Crear, editar o eliminar meta

- **Entrada:** crear: `{ id, categoriaId, tipo, modo?, monto: MontoTexto, fechaObjetivo? }`; editar: `{ metaId, monto?, modo?, fechaObjetivo?, esperado }`; eliminar: `{ metaId }`.
- **Idempotencia:** creación / valor absoluto / eliminación.
- **Precondiciones:** categoría normal y activa (`meta_en_categoria_de_pago`, `categoria_archivada`); sin otra meta (`meta_ya_existe`); modo en metas por período (contrato); `para_fecha` con fecha objetivo ≥ hoy al crear (`fecha_objetivo_pasada`). "Extender la fecha" y "ajustar el monto" de una meta vencida son ediciones (01 OP-18).
- **Hechos:** F3 `metas` (`fecha_creacion` = hoy), F4 o F2.
- **Avisos:** estado: AV-17 desaparece al extender o ajustar.

#### OP-19 Cambiar el ciclo

- **Entrada:** `diaInicio: 1..31`, `revisionVista`, `huellaImpacto`.
- **Idempotencia:** valor absoluto: si la vigencia que regirá ya tiene ese día, `ya_aplicada`.
- **Confirmación:** siempre: AV-12 con R y las fechas del período de transición.
- **Precondiciones:** día distinto del vigente (`ciclo_sin_cambio`). R se calcula con §4.2.9; siempre existe (CB-12).
- **Hechos:** F2 `vigencias_ciclo` de la vigencia futura que todavía no rige, si existe (01 OP-19, [Propio]); F3 `vigencias_ciclo` (`dia_inicio`, `rige_desde` = R).
- **Errores:** `ciclo_sin_cambio`.


### 3.4 Transacciones

Reglas comunes de 3.4 y 3.5:
- Todas las altas usan **PT** (3.0.4) con `origen = 'manual'`, salvo que la ficha diga otra cosa.
- Precondiciones comunes: cuentas abiertas (`cuenta_archivada`) y del tipo correcto (`cuenta_tipo_no_valido`); `fecha ≤ hoy` (`fecha_posterior_a_hoy`) y ≥ apertura de cada cuenta (`fecha_anterior_a_apertura`).
- Confirmación común: AV-01 si la fecha está en un período cerrado (§5.0.3).
- Avisos de estado que pueden aparecer después: AV-02 y AV-03 (sobregiros), AV-04 a AV-08 (tarjeta), AV-09 (en camino), AV-14 (archivada con Disponible), AV-20 (LPA negativo).
- Campos comunes opcionales de las altas: `comercio?: TextoLimpio`, `nota?: string` (máximo 500 caracteres), `monedaOriginal?: /^[A-Z]{3}$/` con `montoOriginal?: string` decimal (juntos, M4).

#### OP-20 Registrar gasto (incluye intereses y comisiones)

- **Entrada:** `id`; `cuentaId` (efectivo o tarjeta); `fecha`; `total: MontoTexto`; `lineas: { monto: MontoTexto, destino: DestinoLinea }[]` (1 a 20); campos comunes.
- **Idempotencia:** creación (`transacciones.id`).
- **Precondiciones:** Σ líneas = total (`suma_lineas_distinta`); cada destino es una categoría normal y activa o un deudor (`categoria_archivada`, `categoria_de_pago_no_permitida`).
- **Hechos:** PT con `tipo = 'gasto'`, un efecto `−total` en la cuenta, una línea por entrada.
- **Avisos:** después: AV-01 si es retroactivo; estado: AV-02, AV-03, AV-07, AV-09.
- **Errores:** `suma_lineas_distinta`, `categoria_archivada`, `categoria_de_pago_no_permitida`.

#### OP-21 Registrar ingreso

- **Entrada:** `id`, `cuentaId` (efectivo), `fecha`, `total`, campos comunes.
- **Hechos:** PT con `tipo = 'ingreso'`, efecto `+total`.
- **Nota.** Dinero que llega a una tarjeta sin ser un cobro es OP-27b (01).

#### OP-22 Transferencia neutral

- **Entrada:** `id`, `origenId` y `destinoId` (efectivo), `fecha`, `total`, campos comunes.
- **Precondiciones:** cuentas distintas (`cuentas_iguales`).
- **Hechos:** PT con `tipo = 'transferencia'`: `−total` en el origen, `+total` en el destino.

#### OP-23 Pagar tarjeta

- **Entrada:** `id`, `origenId` (efectivo), `tarjetaId`, `fecha`, `total`, `revisionVista?`, `huellaImpacto?`.
- **Confirmación:** AV-10 si el pago supera máx(0, Disp(pago(t)) en el período de la fecha); AV-01 si la fecha está en un período cerrado (CB-26).
- **Precondiciones:** tarjeta abierta.
- **Hechos:** PT con `tipo = 'pago_tarjeta'`: `−total` en el origen, `+total` en la tarjeta; una línea a pago(t) por el total.
- **Avisos:** antes: el desglose informativo de §4.14 (deuda anterior, cargos del ciclo, ya pagado, monto para no generar intereses) y "quedará saldo a favor de {monto}" si el pago supera la deuda; después: AV-04 (estado) si hubo exceso.

#### OP-24 Pagar cuota de préstamo o abonar a capital

- **Entrada:** `id`; `modalidad: 'cuota' | 'abono'`; `origenId` (efectivo o tarjeta, C-1); `prestamoId`; `fecha`; `total`; `categoriaId`; cuota: `capital`, `interes`, `seguro` (`MontoTexto` o `"0"`), `numeroCuota?`.
- **Desglose propuesto:** la previsualización devuelve el desglose del modelo del préstamo (Anexo A de 01), si tiene modelo; el usuario lo confirma o lo corrige en la entrada.
- **Precondiciones:** capital + interés + seguro = total (`desglose_no_cuadra`); capital ≤ capital pendiente (`capital_mayor_que_pendiente`); categoría normal y activa.
- **Hechos:** PT con `tipo = 'cuota_prestamo'` (efectos: `−total` en el origen; en el préstamo `monto = −capital`, `interes`, `seguro`) o `'abono_capital'` (efectos: `−total` y `−total`); una línea a la categoría por el total.
- **Avisos:** estado: AV-02 o AV-03 si la categoría queda sobregirada (con tarjeta, D2 con traslado).
- **Errores:** `desglose_no_cuadra`, `capital_mayor_que_pendiente`, `categoria_archivada`, `categoria_de_pago_no_permitida`.

#### OP-25 Aportar, retirar o ajustar una inversión

- **Entrada:** `id`; `modalidad: 'aporte' | 'retiro' | 'ajuste'`; `inversionId`; `cuentaId` (efectivo; no aplica en ajuste); `fecha`; `total` (ajuste: `MontoTextoConSigno` ≠ 0); `categoriaId` (solo aporte).
- **Precondiciones:** retiro ≤ valor (`retiro_mayor_que_valor`); ajuste no deja valor < 0 (`valor_inversion_negativo`).
- **Hechos:** PT con `tipo` = `aporte_inversion` (efectivo `−`, inversión `+`, una línea), `retiro_inversion` (inversión `−`, efectivo `+`) o `ajuste_inversion` (inversión `±`).

#### OP-26 Registrar desembolso de préstamo

- **Entrada:** `id`, `prestamoId`, `cuentaId` (efectivo), `fecha`, `total`.
- **Hechos:** PT con `tipo = 'desembolso_prestamo'`: préstamo `+total`, efectivo `+total`.

#### OP-27 Movimientos de tarjeta sin compra

- **Entrada:** `id`; `modalidad: 'avance' | 'entrada' | 'transferencia_deuda'`; `tarjetaId`; `fecha`; `total`; avance: `cuentaId` (efectivo); transferencia: `tarjetaDestinoId` (la deuda pasa de `tarjetaId` a la destino).
- **Precondiciones:** tarjetas distintas (`cuentas_iguales`).
- **Hechos:** PT con `tipo` = `avance_efectivo` (tarjeta `−`, efectivo `+`), `entrada_tarjeta` (tarjeta `+`) o `transferencia_tarjetas` (destino `−`, origen `+`; la tarjeta que deja de deber recibe `+`).
- **Avisos:** después: AV-24 en la transferencia de deuda; estado: AV-07, AV-08.

#### OP-28 Editar transacción

- **Entrada:** `transaccionId`; cambios opcionales: `fecha`, `total`, `cuentaId` (o `origenId`/`destinoId` según el tipo), `lineas` (lista completa: `{ lineaId?, monto, destino }`; con `lineaId` se conserva la línea), `comercio`, `nota`, moneda original, desglose de cuota; `esperado` con los valores vistos de cada campo cambiado; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** valor absoluto.
- **Confirmación:** AV-16 si está conciliada y la edición cambia monto, fecha o cuenta, o también si solo cambia la categoría o la nota (P12 pide la advertencia antes de **editar** una conciliada); AV-01 si afecta un período cerrado (I6: ambos períodos).
- **Precondiciones** (tabla de 01 OP-28):
  - Σ líneas = total; cada línea ≥ lo ya resuelto sobre ella (`linea_menor_que_eventos`); una línea con eventos no cambia entre categoría y por cobrar ni de deudor (`linea_con_eventos_cambio_destino`).
  - Fecha: cumple inv. 12 y deja los eventos con fecha ≥ la nueva (`fecha_posterior_a_eventos`).
  - Cuenta: abierta, compatible con el tipo (`cambio_tipo_de_cuenta_incompatible`), sin devoluciones vinculadas (`cambio_cuenta_con_devoluciones`).
  - Si la transacción está en una cuenta archivada: solo se permiten cambios que no alteren su saldo (`cuenta_archivada`).
  - Categoría nueva normal y activa; las líneas de devolución vinculadas cambian de categoría con su línea (01 OP-28).
- **Hechos:** PE; si estaba conciliada y cambió `fecha`, `total` o el efecto en la cuenta conciliada: PC con los motivos que correspondan. Si es una edición de cuota: F4 `efectos` del préstamo (`monto`, `interes`, `seguro`).
- **Avisos:** antes: AV-16, AV-01; después: AV-01.

#### OP-29 Eliminar transacción

- **Entrada:** `transaccionId`, `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** eliminación.
- **Confirmación:** AV-16 si está conciliada; AV-01 si su fecha está en un período cerrado.
- **Precondiciones:** sin eventos vinculados (`transaccion_con_eventos`); si la cuenta está archivada, rechazo (`cuenta_archivada`).
- **Hechos:**
  - F1 `movimientos` que la tengan como `transaccion_id`: `estado = 'descartado'`, `transaccion_id = null` (03 §4.6.1).
  - F2 `ocurrencias_resueltas` con esa `transaccion_id` (la ocurrencia vuelve a pendiente).
  - F2 `transacciones` (efectos y líneas en cascada).
  - Si estaba conciliada: PC con `motivos = {eliminacion}`, `fecha` = su fecha y `transaccion_id = null` (3.0.4).
- **Nota.** Eliminar un saldo inicial equivale a saldo inicial 0 (01 OP-29).

#### OP-30 Cambiar estado bancario

- **Entrada:** `transaccionId`, `estadoNuevo: 'pendiente' | 'confirmada'`, `esperado: { estado }`.
- **Idempotencia:** valor absoluto.
- **Precondiciones:** solo `pendiente ↔ confirmada` (§7.2); `conciliada` solo la fija OP-47 (`transicion_estado_bancario_invalida`).
- **Hechos:** F4 `transacciones.estado_bancario`. Sin efecto en el presupuesto; cambia el saldo confirmado.

### 3.5 Eventos

#### OP-31 Cobrar

- **Entrada:** `id`; `lineaId` (línea por cobrar); `cuentaId` (efectivo o tarjeta); `fecha`; `total: MontoTexto`; `asignarAPagoTarjeta?: boolean`.
- **Idempotencia:** creación (`transacciones.id`).
- **Precondiciones:** la línea es por cobrar (`linea_no_es_por_cobrar`); saldo abierto > 0 en la fecha del cobro (`sin_saldo_abierto`, B-7); fecha ≥ fecha de la compra (`evento_anterior_a_original`).
- **Hechos:** PT con `tipo = 'cobro'`, `linea_cobrada_id = lineaId`, efecto `+total` en la cuenta.
- **Asignación propuesta (AV-22) — BE-36.** Si el por cobrar fue con tarjeta t y el cobro entra en una cuenta de efectivo, la previsualización incluye la propuesta de asignar la restitución R a pago(t) **preseleccionada**. Si la entrada trae `asignarAPagoTarjeta = true`, la misma operación ejecuta además las reglas de OP-14 sobre pago(t) en A con `Asig + R` (F3/F4 `asignaciones`), incluido AV-11 si dejara LPA negativo. La interfaz muestra la casilla marcada y el usuario puede desmarcarla (O1: "preseleccionada, pero la confirma el usuario").
  - *Justificación:* un solo toque y una sola transacción; si fueran dos operaciones, un fallo entre ambas dejaría el cobro sin la asignación que el usuario aceptó.
  - *Alternativa descartada:* OP-31 y después OP-14 desde la propuesta; sigue disponible si el usuario desmarca y asigna más tarde.
- **Avisos:** después: AV-22 (si no se asignó en el mismo paso), AV-05 (estado) si el pago implícito deja negativa la categoría de pago (Q7), AV-09 cambia.

#### OP-32 Condonar

- **Entrada:** `id`; `lineaId`; `monto: MontoTexto`; `fecha`; `categoriaId` (la propuesta es la primera línea de categoría de la misma compra si está activa; si no, ninguna).
- **Idempotencia:** creación (`condonaciones.id`).
- **Precondiciones:** línea por cobrar (`linea_no_es_por_cobrar`); 0 < monto ≤ saldo abierto (`condonacion_mayor_que_abierto`); categoría normal y activa (`categoria_archivada`, `categoria_de_pago_no_permitida`); fecha ≥ fecha de la compra.
- **Hechos:** F3 `condonaciones` (`id`, `linea_id`, `fecha`, `monto`, `clave_orden` = `instante`, `categoria_id`); `secuencia` por `RETURNING`.
- **Avisos:** estado: AV-02 o AV-03 si la categoría queda sobregirada; AV-09 cambia.

#### OP-33 Devolver

**a) Vinculada a una compra**
- **Entrada:** `id`; `transaccionOriginalId`; `fecha`; `cuentaId?` (por defecto, la de la compra); `total: MontoTexto`; `reparto: { lineaId, monto: MontoTexto }[]`.
- **Precondiciones:** la original es un `gasto` (`devolucion_de_no_gasto`); Σ reparto = total (`reparto_devolucion_distinto`); cada monto ≤ la capacidad de su línea (`devolucion_mayor_que_linea`); total ≤ total de la compra − devoluciones previas (`devolucion_mayor_que_total`); fecha ≥ la de la compra (`evento_anterior_a_original`); cuenta abierta.
- **Hechos:** PT con `tipo = 'devolucion'`, efecto `+total` en la cuenta, una línea por entrada del reparto con `linea_original_id` (su destino es el de la línea original, aunque esa categoría esté archivada, ajuste 1).
- **Avisos:** estado: AV-06 o AV-08 según el efecto en pago(t); AV-14 si una categoría archivada queda con Disponible; AV-01.

**b) Sin compra original**
- **Entrada:** `id`, `cuentaId`, `fecha`, `total`, `categoriaId`.
- **Hechos:** PT con `tipo = 'devolucion'`, una línea a la categoría (D-2 si es efectivo, D-4 si es tarjeta).

#### OP-34 Eliminar evento

- **Entrada:** `{ tipo: 'cobro' | 'devolucion', transaccionId } | { tipo: 'condonacion', condonacionId }`; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** eliminación.
- **Confirmación:** AV-16 si la transacción del evento está conciliada; AV-01.
- **Precondiciones:** después de eliminarlo se siguen cumpliendo inv. 9 a 11 (`eliminar_evento_rompe_limites`).
- **Hechos:** cobro o devolución: los de OP-29 sobre su transacción; condonación: F2 `condonaciones`.

#### OP-52 Renombrar deudor **[R2]** — nueva (QB-2)

- **Entrada:** `deudorId`, `nombre: TextoLimpio`, `esperado: { nombre }`.
- **Idempotencia:** valor absoluto.
- **Precondiciones:** nombre único sin mayúsculas entre los deudores (`nombre_repetido`, mensaje "Ya existe un deudor llamado {nombre}."). Unir deudores queda para la Fase 6.
- **Hechos:** F4 `deudores.nombre`. Sin efecto en cálculos: el nombre solo se muestra.

### 3.6 Revisión (bandeja de SMS)

#### OP-35 Recibir SMS

El flujo HTTP completo (autenticación, códigos 401/5xx/200, configuración de MacroDroid) está en §8 (Parte C). Aquí, los hechos.

- **Entrada** (cuerpo del webhook): `{ texto: string (1..2000), remitente: TextoLimpio }`, ambos obligatorios (contrato nuevo, sin compatibilidad con la 1.0).
- **Idempotencia:** natural. Un reenvío idéntico dentro de 10 minutos queda `autodescartado` (H12, N-01 punto 4); `movimientos.sms_id` es único.
- **Hechos:**
  1. **Guardar** (transacción propia sin bloqueo, 03 §5.1): F3 `sms_recibidos` (`texto`, `remitente`, `recibido_en` = `now()` de la base).
  2. **Procesar** (`escribir()`, con bloqueo; pasos 2 a 11 de OP-35 de 01, con `@finn/sms` para la interpretación):
     - F3 `sms_procesamientos` (`intento = 1`, `resultado`, `formato_id`, `formatos_coincidentes`, `tipo_movimiento`, campos extraídos, `cuenta_id`, `esperada_programada_id`/`esperada_fecha`, candidata a duplicado, `categoria_sugerida_id`).
     - F3 `movimientos` con el estado igual al resultado (`autodescartado`, `no_reconocido`, `con_coincidencia`, `posible_duplicado` o `pendiente`), copia editable de los campos (`cuenta_id`, `fecha`, `monto`, `comercio`, `tipo_propuesto`) y las candidatas.
     - F3 `movimiento_lineas`: una línea por el monto con la categoría sugerida (regla de comercio, historial o ninguna).
  3. **Si el procesamiento falla**: `escribir()` aparte (con bloqueo; si no lo obtiene, el SMS queda sin resultado y se reprocesa solo, ADR-09) con F3 `sms_procesamientos` (`resultado = 'error'`, `error_detalle` saneado según 7.8) y F3 `movimientos` con `estado = 'error'` (N-02).
- **Avisos:** AV-23 (nuevo, no reconocido, posible duplicado, coincidencia, error), después del `COMMIT` (4.9). Un `autodescartado` no notifica.
- **Sin efecto presupuestario** (inv. 13): no toca tablas [M].

#### OP-36 Editar movimiento

- **Entrada:** `movimientoId`; `cuentaId?`, `fecha?`, `monto?`, `comercio?`, `tipoPropuesto?`, `nota?`, `lineas?` (lista completa: `{ monto, destino?: DestinoLinea | { lineaOriginalId } }`); `esperado`.
- **Idempotencia:** valor absoluto.
- **Precondiciones:** estado `pendiente`, `con_coincidencia`, `posible_duplicado`, `no_reconocido` o `error` (`movimiento_estado_no_valido`).
- **Hechos:** F4 `movimientos`; F2 + F3 `movimiento_lineas` (BE-16: no se renumeran). Sin efecto en la revisión.

#### OP-37 Aprobar movimiento

- **Entrada:** `movimientoId`; `id` (para la transacción nueva; no se usa si se vincula a una registrada); `origenId?: Uuid` (obligatorio si `tipo_propuesto = 'pago_tarjeta'`: la cuenta de efectivo de la que salió el pago, que el SMS no informa); `recordarRegla?: boolean`; `revisionVista?`, `huellaImpacto?`.
- **Idempotencia:** natural: si el movimiento ya está `aprobado`, `ya_aplicada` con su `transaccion_id`; además, creación sobre `transacciones.id`.
- **Confirmación:** la de la operación que ejecuta (AV-01 si la fecha es de un período cerrado, como en ESC-46); AV-16 si vincula a una registrada conciliada y cambia su monto.
- **Precondiciones:**
  - estado `pendiente`, `con_coincidencia`, `no_reconocido` (con los datos completados a mano) o `error` (OP-50) (`movimiento_estado_no_valido`);
  - tiene cuenta abierta (`movimiento_sin_cuenta`, `cuenta_archivada`); tiene fecha, monto y tipo (`movimiento_incompleto`);
  - todas las líneas con destino y suma = monto (`linea_sin_destino`, `suma_lineas_distinta`);
  - las precondiciones de la operación de su tipo.
- **Operación ejecutada según `tipo_propuesto`:**

| `tipo_propuesto` | Operación | Datos que toma del movimiento |
|---|---|---|
| `gasto` | OP-20 | Cuenta, fecha, monto, comercio, nota, líneas |
| `ingreso` | OP-21 | Cuenta, fecha, monto |
| `pago_tarjeta` | OP-23 | La cuenta del movimiento es la tarjeta; el origen llega en `origenId` de esta entrada, porque `movimientos` no tiene columna para él (03 §3.19). ⚠ No hay formatos de pago todavía (P4-3) |
| `devolucion` | OP-33a o OP-33b | Líneas con `lineaOriginalId` (vinculada) o una línea a categoría |

  Todas con `origen = 'sms'` y `hora_registro = clave_orden = recibido_en` del SMS (D2, 13.1.2).

  **[R2] Origen propuesto (ajuste 3).** Para `pago_tarjeta`, la consulta de la bandeja propone como `origenId` la cuenta de efectivo del último pago a esa misma tarjeta (BE-41, 6.8). La interfaz lo envía preseleccionado, así que la aprobación individual es de un toque. `origenId` sigue siendo obligatorio en la entrada, y "Aprobar todos" sigue excluyendo estos movimientos.
- **Hechos:**
  - Sin coincidencia: PT (por la operación ejecutada) + PM.
  - Con coincidencia sobre una ocurrencia **pendiente**: PT con los datos del movimiento + PM + F3 `ocurrencias_resueltas` (`estado = 'emparejada'`, `transaccion_id`).
  - Con coincidencia sobre una ocurrencia **registrada**: no crea transacción. PE sobre la transacción registrada (su total pasa a ser el monto del SMS, con las reglas de OP-28; B-9) + PM con esa transacción + F4 `ocurrencias_resueltas.estado = 'emparejada'`.
  - Si `recordarRegla` y hay una sola línea de categoría: F3 o F4 `reglas_comercio` (`patron` = comercio del movimiento, `categoria_id`).
- **Avisos:** los de la operación ejecutada.
- **[F5] Salida (CP-15).** Además de `SalidaOperacion` (3.0.3), lo que se aprobó según el servidor, para que la interfaz no lo tome de la fila que mostraba:
  ```ts
  aprobado: {
    total: Centavos; comercio: string | null; fecha: FechaLocal;
    cuenta: Ref;
    destino: { categoria: Ref } | { deudor: Ref } | { partes: number };   // partes: más de una línea
  }
  ```
  Es un cambio de la salida, no de la entrada (sin `esperado`). Vale también para OP-50, que es la misma operación.
- **[F6] Variante "aprobar con categoría" (CF-21; FT-78).** Para soltar un movimiento sobre una categoría en la Bandeja, en una sola operación:
  ```ts
  { movimientoId: Uuid; id: Uuid; categoriaId: Uuid;
    esperado: MovimientoDto['esperado'];          // las líneas que vio la lista (valor absoluto, como OP-36)
    revisionVista?: Revision; huellaImpacto?: string }
  ```
  - **Precondiciones propias** (`arrastre_no_permitido`): estado `pendiente`; `tipo_propuesto = 'gasto'`; como máximo una línea, que va a una categoría o no tiene destino (no por cobrar ni vinculada a una línea original).
  - **Precondiciones de siempre:** categoría normal y activa (`categoria_archivada`, `categoria_de_pago_no_permitida`); después, las de OP-37. Las líneas actuales iguales a `esperado` (si no, `conflicto_desactualizado`).
  - **Hechos**, en un solo `escribir()`: F2 + F3 `movimiento_lineas` (una línea por el monto del movimiento hacia `categoriaId`; orden nuevo según BE-16) y, a continuación, los de OP-37 (PT con OP-20 + PM). Si algo falla, no queda ni el cambio de líneas (01 §5.0.1).
  - **Confirmación, idempotencia y salida:** las de OP-37 (con `aprobado`, CP-15). Con `REQUIERE_CONFIRMACION` no escribe nada, tampoco las líneas. `recordarRegla` no forma parte de la variante.

#### OP-38 Aprobar todos

- **Entrada:** `movimientoIds: Uuid[]` (los que la interfaz mostró como elegibles); `ids: Record<movimientoId, Uuid>` (un id de transacción por movimiento).
- **Comportamiento:** solo los movimientos en `pendiente` que cumplen las precondiciones de OP-37 (ajuste 2); un `escribir()` por movimiento (4.8). Los que fallan, incluidos los que ya no están en `pendiente`, quedan como están.
- **Avisos:** después: AV-19 con cada movimiento no aprobado y el mensaje de su rechazo.
- **Confirmación:** no se pide en lote. Un movimiento cuya aprobación exigiría confirmación (AV-01, retroactivo) **no se aprueba en lote**; queda con el motivo "Requiere revisión individual (afecta un período cerrado)." en AV-19. Tampoco se aprueban en lote los de tipo `pago_tarjeta`, que necesitan `origenId` (motivo: "Elegí de qué cuenta salió el pago.").

#### OP-39 Descartar o restaurar movimiento

- **Entrada:** `movimientoId`, `accion: 'descartar' | 'restaurar'`.
- **Idempotencia:** natural.
- **Descartar:** desde `pendiente`, `posible_duplicado`, `no_reconocido` o `error` → F4 `movimientos.estado = 'descartado'`.
- **Restaurar:** desde `descartado` o `autodescartado`: reevalúa emparejamiento y duplicados (pasos 7 y 8 de OP-35 de 01) y pasa directamente a `con_coincidencia`, `posible_duplicado` o `pendiente` (HZ-2); F4 `movimientos` (estado y candidatas vigentes).
- **Errores:** `movimiento_estado_no_valido`.

#### OP-40 Resolver una coincidencia o un posible duplicado

- **Entrada:** `movimientoId`, `decision: 'confirmar_coincidencia' | 'rechazar_coincidencia' | 'es_legitimo' | 'es_duplicado'`; para confirmar, los campos de OP-37.
- **Hechos:**
  - Confirmar: OP-37.
  - Rechazar coincidencia: evalúa duplicados; F4 `movimientos` a `pendiente` o `posible_duplicado`, con la propuesta quitada (`esperada_programada_id` y `esperada_fecha` nulos).
  - Es legítimo: F4 `movimientos.estado = 'pendiente'` (candidata quitada).
  - Es duplicado: F4 `movimientos.estado = 'descartado'`.
- **Acciones desde una notificación:** "confirmar" y "rechazar" de una coincidencia llegan por `POST /api/notificaciones/accion` (2.2.1) y ejecutan esta operación; sin sesión AAL2, la notificación abre la app (P4-11; §11).

#### OP-41 Reglas de comercio

- **Entrada:** crear `{ id, patron: TextoLimpio, categoriaId }`; editar `{ reglaId, patron?, categoriaId?, esperado }`; eliminar `{ reglaId }`.
- **Precondiciones:** patrón único sin mayúsculas (`patron_repetido`, verificado bajo el bloqueo, 7.4); categoría normal y activa.
- **Hechos:** F3, F4 o F2 `reglas_comercio`.

#### OP-49 Reprocesar un SMS con error (N-02) — nueva

- **Entrada:** `smsId`, `intentoVisto: number` (el último intento que vio la interfaz).
- **Idempotencia:** natural: si el último intento es mayor que `intentoVisto`, `ya_aplicada` con el estado actual.
- **Precondiciones:** el movimiento del SMS está en `error` (`sms_no_reprocesable`).
- **Comportamiento:** pasos 2 a 11 de OP-35 de 01 con el **instante de recepción original** (ventana de autodescarte y fecha por defecto, N-02 punto 2).
- **Hechos:** F3 `sms_procesamientos` con `intento` = último + 1 (los anteriores no se tocan); F4 `movimientos` con el estado resultante (cualquiera de los de OP-35, o de nuevo `error`), sus campos y candidatas; F2 + F3 `movimiento_lineas`.
- **Avisos:** AV-23 según el resultado.

#### OP-50 Crear la transacción a mano desde un SMS con error (N-02) — nueva

- Es OP-37 sobre un movimiento en estado `error`, después de completar sus datos con OP-36 (N-02 punto 3; transición `error → aprobado` de 03 §4.6.1). Misma entrada, precondiciones, hechos y avisos. Tiene número propio porque N-02 la define como una acción distinta en la bandeja.

### 3.7 Transacciones programadas

#### OP-42 Crear, editar, desactivar o reactivar programada

- **Entrada:**
  - crear: `{ id, tipo: 'gasto' | 'pago_tarjeta' | 'cuota_prestamo' | 'aporte_inversion', cuentaId, cuentaDestinoId?, comercio, monto, tolerancia?, frecuencia, frecuenciaDias?, primeraFecha, fechaFin?, registroAutomatico, lineas? }`;
  - editar: `{ programadaId, …campos, esperado }`;
  - activar/desactivar: `{ programadaId, activa: boolean }`.
- **Precondiciones:** cuentas abiertas y del tipo de 03 §4.5.4; líneas a categorías normales activas que suman el monto (ninguna en `pago_tarjeta`, DB-16); `primera_fecha`, `frecuencia` y `frecuencia_dias` no cambian si hay resoluciones o una coincidencia propuesta (`calendario_con_historial`, P3-6b, HZ-3); `registroAutomatico = true` en `cuota_prestamo` exige un préstamo con modelo de cálculo (`registro_automatico_sin_modelo`, QB-1 **[R2]**).
- **Hechos:** F3/F4 `programadas`; F2 + F3 `programada_lineas` (orden nuevo, BE-16). Monto, líneas y tolerancia solo afectan las ocurrencias futuras (P3-6).
- **[F6] Reactivar (CF-20).** `{ programadaId, activa: true }` sobre una programada inactiva fija además `reactivada_desde` = hoy (F4 `programadas`); desactivar no la toca. Desde entonces, las ocurrencias pendientes son las de fecha ≥ `primera_fecha` y ≥ `reactivada_desde` (incluida la de hoy): las del tramo inactivo no se generan, no se registran solas, no se emparejan ni se notifican. Las resoluciones anteriores siguen siendo hechos.
- **Sin efecto presupuestario** (inv. 13).

#### OP-43 Registrar una ocurrencia esperada

- **Un toque. Entrada:** `programadaId`, `fechaEsperada`, `id`, y opcionalmente los campos editables de la operación de su tipo (monto, líneas, desglose de cuota).
- **Automático:** lo ejecuta la tarea diaria y la puesta al día al abrir la app (§10); una ocurrencia por `escribir()`, en orden cronológico, con `id` generado por la aplicación.
- **Idempotencia:** natural: `UNIQUE (programada_id, fecha_esperada)` en `ocurrencias_resueltas`; una ocurrencia resuelta nunca se vuelve a registrar (inv. 15).
- **Precondiciones:** la fecha es una ocurrencia de la programada (`ocurrencia_no_valida`) y no está resuelta (`ocurrencia_ya_resuelta`); las de la operación de su tipo.
- **Hechos:** PT por la operación de su tipo (OP-20, OP-23, OP-24 o OP-25) con `origen = 'programada'` y `fecha` = **fecha esperada** (B-12); F3 `ocurrencias_resueltas` (`estado = 'registrada'`, `transaccion_id`).
- **Cuota con registro automático:** desglose del modelo de cálculo (Anexo A). Si el préstamo ya no tiene modelo (se quitó después de crear la programada): la ocurrencia queda pendiente y se notifica (QB-1 **[R2]**).
- **[R2] Período cerrado (ajuste 2).** El registro **automático** no registra una ocurrencia cuya fecha esperada está en un período cerrado (por ejemplo, el cron falló el día 20 y corre el 21). La deja pendiente y notifica una sola vez por ocurrencia (AV-23, motivo `ocurrencia_en_periodo_cerrado`, con push): "Pago programado pendiente en un período cerrado; revisalo." Es el mismo criterio que OP-38: nada retroactivo sin confirmación del usuario. El registro de **un toque** sí puede hacerlo, con la confirmación de AV-01.
- **Avisos:** un toque: AV-01 antes de confirmar si la fecha esperada está en un período cerrado. Automático: AV-23 (registro automático, su fallo y la ocurrencia pendiente en un período cerrado) **[R2]**.

#### OP-44 Omitir una ocurrencia

- **Entrada:** `programadaId`, `fechaEsperada`.
- **Idempotencia:** natural.
- **Hechos:** F3 `ocurrencias_resueltas` (`estado = 'omitida'`, `transaccion_id = null`).

#### OP-51 Eliminar una programada sin historial (HZ-1) — nueva

- **Entrada:** `programadaId`.
- **Idempotencia:** eliminación.
- **Precondiciones:** sin `ocurrencias_resueltas` y sin referencias desde `movimientos` ni `sms_procesamientos` (`programada_con_historial`; 03 §3.23).
- **Hechos:** F2 `programadas` (sus `programada_lineas` en cascada).

### 3.8 Conciliación

El flujo completo (decodificación, adaptadores, firma) está en §9 (Parte C).

#### OP-45 Iniciar conciliación (lectura)

- **Entrada:** `cuentaId`, archivo CSV (≤ 2 MiB, BE-06).
- **Comportamiento:** con `leer()`: decodifica, reconoce el formato, extrae los movimientos, la fecha del estado y el saldo final; clasifica en coincidencias, solo en el estado y solo en Finn (§4.17).
- **Salida:** la clasificación y una **carga firmada** (HMAC con la cuenta, el contenido normalizado, el vencimiento de 24 h y la versión de la clave; P4-14).
- **Hechos:** ninguno.
- **Errores:** `formato_no_reconocido`, `formato_ambiguo`, `archivo_pdf`.

#### OP-46 Agregar desde el estado

- **Entrada:** `id`; la carga firmada; `movimientoIndice` (cuál movimiento del estado); el tipo y los datos de la operación correspondiente (por ejemplo, líneas de un gasto).
- **Precondiciones:** firma válida y vigente (`firma_no_valida`, `firma_vencida`); el movimiento pertenece a la carga; las de la operación.
- **Hechos:** PT por la operación elegida, con `origen = 'importada'` (estado inicial `confirmada`), la fecha y el monto del estado.
- **Nota.** La conciliación nunca crea transacciones sola (inv. 14): cada alta es una acción explícita.
- **[F5] Previsualización (CP-16).** Es la de la operación que ejecuta: con tipo `cuota_prestamo`, devuelve el desglose del modelo a la fecha del movimiento, como OP-24. Los datos del formulario los entrega `formulario({ operacion: 'conciliar' })` (6.14).

#### OP-47 Terminar conciliación

- **Entrada:** `id` (de la conciliación); la carga firmada; `coincidencias: { transaccionId, movimientoIndice }[]` (las marcadas por el usuario).
- **Idempotencia:** creación (`conciliaciones.id`).
- **Precondiciones:** firma válida y vigente; cada par cumple el criterio de coincidencia y la relación es 1 a 1 (`coincidencia_no_valida`); ninguna transacción ya conciliada (`transaccion_ya_conciliada`).
- **Hechos:**
  - F3 `conciliaciones` (`cuenta_id`, `fecha_estado`, `saldo_estado`, `terminada_en` = `instante`, `diferencia_aceptada` = saldo según el estado − saldo(cuenta, fecha del estado)).
  - F4 `transacciones` marcadas: `estado_bancario = 'conciliada'`, `conciliacion_id` (03 exige que la conciliación sea de esta misma transacción de base de datos; lo garantiza el orden F3 → F4).
- **Avisos:** después y estado: AV-21 si la diferencia ≠ 0, con la sugerencia de una transacción de ajuste (que el usuario crea con OP-20 u OP-21).
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

#### OP-48 Registrar o editar las condiciones de un préstamo

- **Entrada:** `prestamoId`; campos de `prestamos` (03 §3.6) salvo `cuenta_id` y `tipo`; `esperado`.
- **Idempotencia:** valor absoluto.
- **Hechos:** F4 `prestamos`. Cambia la tabla de amortización proyectada (Anexo A); sin efecto presupuestario.

### 3.10 Operaciones técnicas (OPT)

No escriben hechos del motor. Las que escriben tablas [H] usan `escribir()`; las de tablas [T], una transacción corta sin bloqueo (03 §5.1, BE-33). El detalle está en la sección indicada (Parte C).

| OPT | Operación | Entrada | Tablas | Sección |
|---|---|---|---|---|
| OPT-01 | Rotar el token del webhook | — (lo genera el servidor; se muestra una vez) | F4 `token_webhook` (`hash_sha256`, `creado_en`) | §8, §12 |
| OPT-02 | Registrar o renovar suscripción push | `endpoint`, `claves.p256dh`, `claves.auth`, `agente?` | `suscripciones_push` (inserta o actualiza `renovada_en`) | §11 |
| OPT-03 | Eliminar suscripción push | `endpoint` | `suscripciones_push` | §11 |
| OPT-04 | Marcar notificaciones como leídas | `ids: Uuid[]` o `todas: true` | `notificaciones.leida_en` | §11 |
| OPT-05 | Crear, editar o desactivar un formato bancario | Campos de `formatos_bancarios` (03 §3.21) | `formatos_bancarios` ([H], con bloqueo) + auditoría en `eventos_sistema` (`datos.tipo = 'auditoria_formato'`, EN-1) | §8 |
| OPT-06 | Probar un formato contra un SMS | Formato (guardado o en edición) y `smsId` | Ninguna (lectura) | §8 |
| OPT-07 | Crear o renombrar una institución | `id`, `nombre` | `instituciones` ([H], con bloqueo) | §8 |
| OPT-08 | Exportar (JSON o CSV) | Formato | Ninguna (lectura) | §16 |
| OPT-09 | Registrar un evento del respaldo (respaldo correcto, restauración correcta, deriva C5/C6) | Según el evento | `estado_respaldo`, `eventos_sistema` | §16 |


---

# Parte B2

## 6. Catálogo de consultas por pantalla

### 6.0 Convenciones

#### 6.0.1 Forma de una consulta

- Cada pantalla tiene **una** consulta: `consultas.<nombre>(parametros) → DTO`, en `@finn/aplicacion/consultas/<nombre>.ts`.
- Ejecuta `leer()` (5.1): una transacción `REPEATABLE READ` de solo lectura, con la instantánea del motor de la memoria o recalculada, y, si hace falta, lecturas de tablas [H], [I] o [T] en la **misma** instantánea.
- **No contiene fórmulas.** Todo número sale de un selector de `@finn/dominio` (6.0.5). La consulta filtra, ordena, pagina y arma el DTO (inv. 27, error 11 de la 1.0).
- Los parámetros se validan con Zod (`@finn/aplicacion/contratos/consultas.ts`). Un parámetro inválido es `VALIDACION`; un id inexistente, `NO_ENCONTRADO`. **[F5]** Se señalan lanzando `ExcepcionFinn` (2.3.2, CP-13).
- La Fase 5 no agrega consultas: si una pantalla necesita un dato que no está aquí, se registra como cambio de esta sección.
- **[R3]** Los formularios de registro y edición tienen su propia consulta, `consultas.formulario` (6.14).

#### 6.0.2 Encabezado común

Todo DTO incluye:

```ts
interface Encabezado {
  revision: Revision;          // para revisionVista (4.3) y detectar datos viejos (5.5)
  hoy: FechaLocal;             // de finn.hoy() (13.1.1)
  periodoActivo: PeriodoDto;
  notificacionesNoLeidas: number;
  bandejaPorRevisar: number;   // [F5] CP-2: movimientos en pendiente, con_coincidencia, posible_duplicado, no_reconocido o error
}
interface PeriodoDto {
  inicio: FechaLocal; fin: FechaLocal; dias: number;
  estado: 'cerrado' | 'activo' | 'futuro';
  transicion: boolean;         // período de transición de un cambio de ciclo (Q5)
  diasTranscurridos: number;   // solo en el activo: hoy − inicio + 1
  diasRestantes: number;       // solo en el activo: fin − hoy
}
```

**[F5] `bandejaPorRevisar` (CP-2).** Es la suma de los cinco contadores de `InicioDto.atencion.bandeja` (6.1) y usa el mismo índice `ix_movimientos_estado`, en la misma instantánea de `leer()`. Agrega a toda consulta una lectura de [H]; el presupuesto de 6.0.7 (≤ 30 ms) se mantiene.

#### 6.0.3 Tipos comunes

| Tipo | Forma | Nota |
|---|---|---|
| Monto | `number` entero en centavos (`Centavos`) | Con signo cuando se indica; la interfaz solo formatea (13.3, 7.10) |
| Fecha | `FechaLocal` (`'AAAA-MM-DD'`) | |
| Instante | `string` ISO UTC con ms | |
| `Ref` | `{ id: Uuid; nombre: string; archivada?: true }` | Referencia a una cuenta, categoría, grupo o deudor |
| `SobregiroDto` | `{ tipo: 'debito' \| 'tarjeta' \| 'mixto'; total; parteTarjeta; parteDebito }` | Partes de §4.7. El color por tipo es de la Fase 5 (H1) |
| `AvisoEstadoDto` | `{ aviso: 'AV-nn'; texto: string; datos: Record<string, Centavos \| FechaLocal \| string>; accion?: Propuesta }` | Texto en voseo (7.10). **[F5]** `Propuesta` está definida en 3.0.3 (CP-8) |
| `Cursor` | `string` opaco (base64url de la clave de orden de la última fila) | Paginación estable (6.0.6) |
| Porcentaje | `number` entero en **puntos básicos** (1 % = 100) | Lo calcula el selector, con redondeo mitad hacia arriba; la interfaz no divide montos (ADR-07) |
| `HallazgoDto` **[F6]** | `{ tipo; clave; texto; impacto: Centavos; estado: 'advertencia' \| 'problema' \| 'deuda-sin-respaldo' \| 'informacion'; categoria?; tarjeta?; comercio?; accion: { propuesta: Propuesta } \| { enlace: DestinoHallazgo; texto } }` | CF-04 (06 §3.5.2). `estado` usa los identificadores de estado de 05 §10.3; `Propuesta` extendida por CF-05 (3.0.3) |

#### 6.0.4 Avisos de estado por pantalla

| Aviso | Inicio | Presupuesto | Detalle de categoría | Cuentas / detalle de cuenta | Otras |
|---|---|---|---|---|---|
| AV-01 (después, registrado, BE-38) | Lista de no leídos | — | — | — | Notificaciones |
| AV-02 Sobregiro de débito | Lista de sobregiradas | Fila (color) | Detalle | — | — |
| AV-03 Sobregiro con tarjeta | Lista de sobregiradas | Fila (color) | Detalle | — | — |
| AV-04, AV-05, AV-06 Pago excedente por causa | Secundario de la tarjeta | Grupo de pagos | Detalle de pago(t) | Tarjeta | — |
| AV-07 Te falta reservar | Lista por tarjeta | Grupo de pagos | Detalle de pago(t) | Tarjeta | — |
| AV-08 Reserva excedente | Lista por tarjeta (con propuesta) | Grupo de pagos | Detalle de pago(t) | Tarjeta | — |
| AV-09 En camino | Junto a LPA | Junto a LPA | — | Posición neta | Por cobrar, detalle de LPA |
| AV-14 Archivada con Disponible | Lista (con propuesta) | Sección "archivadas con dinero" | Detalle | — | — |
| AV-17 Meta vencida | Lista | Fila (meta) | Detalle | — | Metas |
| AV-20 LPA negativo | Junto a LPA | Junto a LPA | — | — | Detalle de LPA |
| AV-21 Diferencia de conciliación | — | — | — | Detalle de cuenta | — |
| AV-23 Bandeja | Contadores | — | — | — | Bandeja, notificaciones |

#### 6.0.5 Selectores del dominio que usan las consultas

Catálogo cerrado de `seleccionar.*` (2.4). Cada uno implementa una fórmula de 01 o una de esta sección; la consulta no recalcula nada.

| Selector | Devuelve | Fórmula |
|---|---|---|
| `periodos(desde, hasta)`, `periodoDe(fecha)`, `periodoActivo()` | `PeriodoDto` | §4.2 |
| `saldo(cuenta, fecha?)`, `saldoConfirmado(cuenta)`, `saldosCorridos(cuenta)` | Saldos | §4.3 (el saldo corrido es `saldo(k)` acumulado en el orden (fecha, clave de orden, secuencia)) |
| `tarjeta(t)` | deuda, saldo a favor, R⁺, S, RE, E(t, A) con causas, uso del límite | §4.3, §4.7, §4.8 |
| `categoria(c, p)` | Asig, Act, Gastado, Arr, Disp, fondo, entradas, SobT, SobD | §4.4 a §4.7 |
| `repartoD2(c, p)` | Consumos con cubierto y no cubierto | §4.5 |
| `lpa()`, `descomposicionLpa()`, `lpaAlCierre(p)`, `reduccionProyectada()` | LPA y su detalle | §4.9, §4.7 |
| `porCobrar(linea?)`, `enCamino()` | Saldos abiertos, restituido, condonado, devuelto | §4.10 |
| `patrimonio(fecha?)` | Activos y deudas | §4.14 |
| `desgloseAlPagar(t, fecha)` | Deuda anterior, cargos del ciclo, ya pagado, monto para no generar intereses | §4.14 |
| `meta(c, p)` | Monto del período, base, n, pedido, falta, FO vigente, estado | §4.12 |
| `ocurrencias(programada?, hasta)` | Pendientes, atrasadas | §4.16 |
| `amortizacion(prestamo)` | Proyección, desglose propuesto, estados, comparación | Anexo A |
| `avisosEstado()` | Lista de avisos vigentes | §5.0.7 |
| `clasificacion(movimiento)` | Ingreso, otras entradas, restitución | §4.13 |
| `reportes.*` | 6.9 | BE-40 |
| `origenPropuestoPagoTarjeta(t)` | Cuenta de efectivo | BE-41 (6.8) |
| `restriccionesTransaccion(id)` | Qué se puede editar o eliminar y por qué | Precondiciones de OP-28 y OP-29 |
| **[R3]** `sugerirCategoria(comercio, reglas)` | Categoría sugerida y su origen (`regla`, `historial`) | §4.17 (regla de comercio; si no, sugerencia por historial). Recibe las reglas [H] como dato |
| **[R3]** `comerciosRecientes(reglas, limite)` | Comercios distintos de los gastos, por último uso, con su categoría sugerida | §4.17 + 6.14.3 |
| **[R3]** `capacidadDevolucion(transaccion)` | Por línea: lo que queda por devolver; total restante | inv. 9 a 11 (01 OP-33a) |
| **[R3]** `porCobrarAbiertos(fecha?)` | Líneas por cobrar con saldo abierto a una fecha | §4.10 |
| **[R3]** `asignacionRapida(c, p)` | Valores de las tres variantes de OP-16 | 01 OP-16 |
| **[R3]** `desglosePropuesto(prestamo, fecha)` | Desglose del modelo para un pago en esa fecha y la cuota emparejada | Anexo A.2 punto 8 |
| **[R3]** `categoriaUltimaCuota(prestamo)` | Categoría de la última cuota o abono a ese préstamo | 6.14.4 |
| **[R3]** `impedimentosArchivo(c)` y `resumenFusion(origen)` | Datos para OP-09 y OP-12 | 6.14.4 |
| **[R3]** `reportes.topComercios(reglas, …)` | 6.9.6 | BE-43 |
| **[F6]** `reportes.ritmo`, `.realidad`, `.hormiga(reglas, …)`, `.suscripciones(reglas, …)`, `.tarjetas`, `.hallazgos`, `.flujoEfectivo` | 6.9.7 | 06 §3.3 y §3.5 (CF-02, CF-04); umbrales en un solo módulo del dominio (FD-18) |
| **[F6]** `existiaEn(c, q)` | Si c existía en q: Asig ≠ 0, un consumo, una entrada o un evento con fecha en q | 06 §3.14 (CF-17). Lo usan OP-16, 6.3, 6.9.3 y los reportes de comparación |

#### 6.0.6 Paginación y orden

- Las listas largas (Actividad, movimientos de una cuenta, descartados de la bandeja, notificaciones, eventos) usan **cursor**, nunca desplazamiento: una escritura entre dos páginas no repite ni salta filas.
- Orden de transacciones: (`fecha` desc, `clave_orden` desc, `secuencia` desc), el inverso exacto del orden del motor (§4.1.2, CB-21). El cursor codifica esos tres valores de la última fila.
- Tamaño de página: 50 por defecto, máximo 100.

#### 6.0.7 Rendimiento

Con la memoria caliente, una consulta solo ejecuta selectores sobre la instantánea y, a veces, una lectura indexada de tablas [H]: presupuesto ≤ 30 ms en el servidor (5.6). Las que leen tablas [H], [I] o [T] lo indican en su ficha.


### 6.1 Inicio

`consultas.inicio()` — sin parámetros.

```ts
interface InicioDto extends Encabezado {
  lpa: Centavos;                                   // §4.9
  enCamino: Centavos;                              // AV-09 (§4.10)
  lpaNegativo: boolean;                            // AV-20
  reduccionProyectadaAlCierre: Centavos;           // Σ SobD(c, A) + Σ E(t, A) (§4.7)
  atencion: {
    bandeja: { pendientes: number; conCoincidencia: number; posiblesDuplicados: number;
               noReconocidos: number; errores: number };          // movimientos ([H])
    sobregiradas: { categoria: Ref; grupo: Ref; sobregiro: SobregiroDto }[];  // Disp(c, A) < 0
    faltaReservar: { tarjeta: Ref; monto: Centavos }[];          // S(t) > 0 (AV-07)
    pagosExcedentes: { tarjeta: Ref; monto: Centavos; causas: { causa: 'cobro' | 'devolucion' | 'pago'; monto: Centavos }[] }[]; // AV-04/05/06
    reservaExcedente: { tarjeta: Ref; monto: Centavos; accion: Propuesta }[];  // AV-08
    proximosPagos: OcurrenciaDto[];                 // horizonte 7 días (BE-37)
    pagosAtrasados: OcurrenciaDto[];                // ocurrencias pendientes con fecha < hoy
    cambiosRetroactivos: NotificacionDto[];         // AV-01 no leídos (BE-38)
    metasVencidas: { categoria: Ref; falta: Centavos }[];        // AV-17
    archivadasConDisponible: { categoria: Ref; disponible: Centavos; accion: Propuesta }[]; // AV-14
    hallazgosRitmo: HallazgoDto[];                  // [F6] CF-06: los RITMO_INICIO_MAX de mayor impacto (06 §3.5.4); sin push
    pagosTarjetaProximos: { tarjeta: Ref; fechaPago: FechaLocal; paraNoGenerarIntereses: Centavos }[];  // [F6] CF-06/CF-07: fp − hoy ≤ 3 y monto > 0
  };
  primerosPasos: { cuenta: boolean; categorias: boolean; sms: boolean } | null;  // [F6] CF-18: null cuando los tres son true (06 §3.15)
  recientes: TransaccionFila[];                    // las 5 últimas por (fecha, clave_orden, secuencia)
  patrimonio: { activos: Centavos; deudas: Centavos; neto: Centavos };   // §4.14
}
interface OcurrenciaDto {
  programada: Ref; fechaEsperada: FechaLocal; monto: Centavos; cuenta: Ref;
  tipo: 'gasto' | 'pago_tarjeta' | 'cuota_prestamo' | 'aporte_inversion';
  registroAutomatico: boolean; atrasada: boolean;
}
```

- **Mismos números en todas las pantallas (error 11).** `sobregiradas` usa el mismo `Disp(c, A)` (con arrastre) que Presupuesto; ambas llaman a `seleccionar.categoria`.
- `atencion.bandeja` lee `movimientos` ([H]) con un `count` por estado (índice `ix_movimientos_estado`).
- `cambiosRetroactivos` lee `notificaciones` ([T]) con `aviso = 'AV-01'` y `leida_en` nulo.
- **[F6]** `hallazgosRitmo` usa el mismo selector que el reporte `ritmo` (error 11). `primerosPasos` se calcula con las cuentas y categorías que la consulta ya lee más `token_webhook` ([T], una fila): un paso está hecho porque el hecho existe; no cuenta para "Todo al día" (CF-18).
- **Puesta al día:** la primera petición del día dispara el registro automático y el reproceso de SMS sin resultado (ADR-11). Lo define §10 (Parte C); la consulta no escribe.

**BE-37. Horizonte de "próximos pagos".** §4.16 de 01 habla de "el horizonte de próximos pagos" sin fijar el valor. Es un parámetro de la consulta: **7 días** en Inicio y **30 días** en Programadas (6.12.1). *Justificación:* Inicio responde "¿algo necesita mi atención?" (producto §5); un mes completo de pagos lo saturaría. *Alternativa descartada:* un único horizonte configurable en Ajustes (agrega una preferencia sin necesidad clara).

**BE-38. Cambios retroactivos visibles en Inicio.** El producto (§5) pide ver en Inicio "cualquier cambio en un período pasado que afecte el actual". AV-01 "después" es un resultado de la operación y se perdería al cerrar la pantalla. Por eso, cuando una operación produce AV-01, `posteriores()` (4.9) registra una fila en `notificaciones` (`aviso = 'AV-01'`, `motivo = 'cambio_retroactivo'`, sin push) con el resumen del impacto. Inicio la muestra hasta que se marca como leída (OPT-04). *Alternativa descartada:* recalcular "cambios retroactivos recientes" a partir de los hechos; los hechos no guardan cuándo se registró un cambio de fecha ni su impacto en ese momento.

### 6.2 Presupuesto

**[F6] `barra` (CF-25).** Con F = fondo del período (§4.5 de 01, con las entradas), cubierto = Σ cubierto del reparto D2 y excedente = SobT + SobD (§4.7): base = máx(máx(0, F), cubierto + excedente); `excedenteBp` = excedente × 10.000 / base (mitad hacia arriba; al menos 1 si el excedente es positivo); `cubiertoBp` = mín(cubierto × 10.000 / base, 10.000 − `excedenteBp`), nunca negativo; `tipoExcedente` = tipo del `SobregiroDto` de la fila; `null` solo si base = 0. `metaBp` = el progreso de `metas()` (6.10), en metas de ahorro. Propiedad que prueba la Fase 7: `excedenteBp > 0` ⇔ `sobregiro ≠ null`, con el mismo tipo.

`consultas.presupuesto({ periodoInicio?: FechaLocal, filtro?: 'todas' | 'sobregiradas' | 'sin_fondos' | 'cubiertas' })` — por defecto, el período activo y `todas`.

```ts
interface PresupuestoDto extends Encabezado {
  periodo: PeriodoDto;
  navegacion: { anterior?: FechaLocal; siguiente: FechaLocal };   // inicios de los períodos vecinos
  lpa: Centavos; enCamino: Centavos; lpaNegativo: boolean;
  grupos: {
    grupo: Ref; orden: number;
    categorias: FilaCategoria[];
    totales: { asignado: Centavos; gastado: Centavos; disponible: Centavos };
  }[];
  pagosTarjeta: FilaPagoTarjeta[];                 // grupo del sistema "Pagos de tarjeta"
  archivadasConDinero: FilaCategoria[];            // solo el activo: archivadas con Disp(c, A) ≠ 0 (AV-14, N5)
  totales: { asignado: Centavos; gastado: Centavos; disponible: Centavos };
}
interface FilaCategoria {
  categoria: Ref; orden: number;
  asignado: Centavos; gastado: Centavos; arrastre: Centavos; disponible: Centavos;  // §4.4, §4.6
  sobregiro: SobregiroDto | null;
  meta: { tipo: TipoMeta; pedido: Centavos; falta: Centavos; estado: EstadoMeta } | null;  // §4.12
  clasificacion: 'sobregirada' | 'sin_fondos' | 'cubierta';                        // BE-39
  asignadoEsperado: Centavos;                       // el valor para "esperado" de OP-14 (4.6.2)
  barra: { cubiertoBp: number; excedenteBp: number;               // [F6] CF-25 (06 §5.8)
           tipoExcedente: 'debito' | 'tarjeta' | 'mixto' | null; metaBp?: number } | null;
}
interface FilaPagoTarjeta {
  tarjeta: Ref; categoria: Ref;
  asignado: Centavos; actividad: Centavos; arrastre: Centavos; disponible: Centavos;
  faltaReservar: Centavos;                          // S(t), número principal (AV-07, F4)
  reservaExcedente: Centavos;                       // RE(t) (AV-08)
  pagoExcedente: { total: Centavos; causas: { causa: 'cobro' | 'devolucion' | 'pago'; monto: Centavos }[] } | null; // E(t, A) (§4.7)
}
```

- **Períodos cerrados:** se muestran con los mismos campos y sin acciones de asignación (inv. 18). Incluyen las categorías archivadas que tuvieron asignación o actividad en ese período (producto §7, R4).
- **Períodos futuros:** Disp proyectado con actividad cero (§4.6); `faltaReservar` y `reservaExcedente` solo se calculan en el activo (S y RE usan Disp(pago(t), A), inv. 2).
- **Categorías archivadas** no aparecen en `grupos` del período activo ni de los futuros (R4); si tienen Disp ≠ 0 en el activo, aparecen en `archivadasConDinero`.

**BE-39. Filtros de Presupuesto.** El producto (§7) pide "todas, sin fondos suficientes, sobregiradas o cubiertas" sin definirlos. Definición [Propio], excluyente y completa:
- `sobregirada`: Disp(c, p) < 0.
- `sin_fondos`: Disp(c, p) ≥ 0 y la meta tiene Falta(c, p) > 0.
- `cubierta`: Disp(c, p) ≥ 0 y (sin meta o Falta = 0).

*Alternativa descartada:* "sin fondos" = Disp(c, p) = 0 (no distingue una categoría vacía que no necesita dinero de una que sí).

### 6.3 Detalle de categoría

`consultas.detalleCategoria({ categoriaId, periodoInicio? })`.

**Categoría normal**

```ts
interface DetalleCategoriaDto extends Encabezado {
  categoria: Ref; grupo: Ref; clase: 'normal';
  periodo: PeriodoDto;
  navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // [F5] CP-9: inicios de los períodos vecinos (selector periodos)
  numeros: { asignado; gastado; arrastre; disponible; fondo; entradas: Centavos };  // §4.4–§4.6
  sobregiro: SobregiroDto | null;
  consumos: {                                      // reparto D2 en su orden (§4.5)
    origen: { transaccionId: Uuid } | { condonacionId: Uuid };
    fecha: FechaLocal; comercio: string | null; cuenta: Ref;
    medio: 'tarjeta' | 'debito'; montoNeto: Centavos; cubierto: Centavos; noCubierto: Centavos;
  }[];
  entradasDelPeriodo: { transaccionId: Uuid; fecha: FechaLocal; monto: Centavos; caso: 'D-2' | 'D-3' | 'D-4' }[];
  meta: {
    tipo; modo?; monto; montoPeriodo; base; n?; fechaObjetivoVigente?: FechaLocal;
    pedido; falta; estado: EstadoMeta;
    progresoBp?: number;                           // [F6] CF-25: como en metas() (6.10), metas de ahorro; tope 10.000
  } | null;                                        // §4.12
  calendario: { fecha: FechaLocal; gastado: Centavos; intensidadBp: number }[];   // días con gasto ≠ 0 (R8); [F6] CF-25: máx(0, gastado) / máximo del período; 0 si el máximo ≤ 0
  historialResumen: { promedioGastado: Centavos; periodosExcedidos: number };   // [F6] CF-25: sobre `historial` (gastado > asignado)
  historial: { periodo: PeriodoDto; asignado; gastado; disponible: Centavos }[];  // [F6] CF-17: los 6 períodos cerrados anteriores en que existía c; si hay menos, los que haya
  programadas: { programada: Ref; monto: Centavos; proxima?: FechaLocal }[];
  reglas: { id: Uuid; patron: string }[];
  acciones: {
    puedeAsignar: boolean;                         // período activo o futuro y categoría activa
    puedeArchivar: boolean; bloqueosArchivo: ('disponible' | 'asignaciones_futuras' | 'programadas')[]; // OP-09
    puedeEliminar: boolean;                        // OP-13
    asignadoEsperado: Centavos;
  };
}
```

- `calendario`: `gastado` por día = consumos netos − entradas de ese día, el mismo cálculo que Gastado restringido a una fecha (selector `categoria(c, p).porDia`).
- Lee `programadas`, `programada_lineas` (hechos) y `reglas_comercio` ([H]).

**Categoría de pago (pago(t))**

```ts
interface DetallePagoTarjetaDto extends Encabezado {
  categoria: Ref; tarjeta: Ref; clase: 'pago';
  periodo: PeriodoDto;
  navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // [F5] CP-9: inicios de los períodos vecinos (selector periodos)
  numeros: { asignado; actividad; arrastre; disponible: Centavos };
  tarjetaHoy: { deuda; saldoAFavor; reservado; faltaReservar; reservaExcedente: Centavos };  // R⁺, S, RE (§4.8)
  pagoExcedente: { total: Centavos; causas: { causa; monto }[] } | null;   // §4.7
  traslados: { categoria: Ref; monto: Centavos }[];       // Tr(c, p, t) por categoría (§4.5)
  pagos: { transaccionId: Uuid; fecha: FechaLocal; monto: Centavos }[];
  pagosImplicitos: { transaccionId: Uuid; fecha: FechaLocal; monto: Centavos }[];   // Q7
  devoluciones: { transaccionId: Uuid; fecha: FechaLocal; caso: 'D-3' | 'D-4'; monto: Centavos }[];
  desgloseAlPagar: { deudaAnterior; cargosDelCiclo; yaPagado; paraNoGenerarIntereses: Centavos; ultimoCorte: FechaLocal;
                     proximoPago: FechaLocal };   // §4.14 a hoy; [F6] CF-25: el proximoPago de 6.5
  historial: { periodo: PeriodoDto; asignado; disponible: Centavos }[];
}
```

### 6.4 Listo para asignar (detalle)

`consultas.detalleLpa({ periodos?: number })` — historial de los últimos `periodos` (por defecto 12, máximo 60).

```ts
interface DetalleLpaDto extends Encabezado {
  lpa: Centavos; lpaNegativo: boolean;
  descomposicion: {                                    // §4.9
    entradas: { ingresos; otrasEntradas; restituciones; saldosIniciales: Centavos };  // por clase, §4.13
    asignadoPeriodosCerrados: Centavos;
    asignadoPeriodoActivo: Centavos;
    asignadoPeriodosFuturos: Centavos;
    reduccionesSobregiroDebito: Centavos;             // Σ SobD de períodos cerrados
    reduccionesPagoExcedente: Centavos;               // Σ E de períodos cerrados
    enCamino: Centavos;
  };
  reduccionProyectadaAlCierre: { total: Centavos; categorias: { categoria: Ref; monto: Centavos }[]; tarjetas: { tarjeta: Ref; monto: Centavos }[] };
  historial: { periodo: PeriodoDto; lpaAlCierre: Centavos }[];   // LPA_p (§4.9, error 12)
  notaHistorial: 'sin_adelantos';                     // B-4: el historial excluye los adelantos a períodos posteriores
}
```

La suma de la descomposición es exactamente `lpa` (lo verifica una prueba de propiedades).

### 6.5 Cuentas

`consultas.cuentas({ incluirArchivadas?: boolean })`.

```ts
interface CuentasDto extends Encabezado {
  efectivo: { cuenta: Ref; institucion?: string; ultimos4?: string; saldo; saldoConfirmado: Centavos;
              ultimaConciliacion?: { fechaEstado: FechaLocal; diferenciaActual: Centavos } }[];
  tarjetas: { cuenta: Ref; institucion?: string; ultimos4?: string; red?: string; color?: string;
              deuda; saldoAFavor; limite: Centavos; usoLimite: number /* puntos básicos */;
              faltaReservar; reservaExcedente: Centavos;
              proximoCorte: FechaLocal; proximoPago: FechaLocal; paraNoGenerarIntereses: Centavos;
              saldoConfirmado: Centavos;
              usoSinReservarBp: number | null }[];   // [F6] CF-25: S(t) × 10.000 / límite, tope 10.000; null sin límite o con 0
  prestamos: { cuenta: Ref; contraparte: string; capitalPendiente: Centavos;
               proximaCuota?: { fecha: FechaLocal; monto: Centavos; numero: number } }[];   // con modelo (Anexo A)
  inversiones: { cuenta: Ref; valor: Centavos }[];
  archivadas: Ref[];                                   // solo si incluirArchivadas
  posicionNeta: {                                      // §4.14
    activos: { efectivo; saldosAFavor; inversiones; porCobrar: Centavos; total: Centavos };
    deudas: { tarjetas; prestamos: Centavos; total: Centavos };
    neto: Centavos;
    barras: { activosBp: number; deudasBp: number };   // [F6] CF-25: el mayor total = 10.000, el otro en proporción (≥ 1 si > 0); 0 y 0 si los dos son 0
  };
  enCamino: Centavos;
}
```

- `proximoCorte` y `proximoPago`: primera fecha ≥ hoy con el día de corte o de pago, recortado al fin de mes (§4.14, supuesto 19).
- `usoLimite`: deuda × 10.000 / límite, mitad hacia arriba (6.0.3).

### 6.6 Detalle de cuenta

`consultas.detalleCuenta({ cuentaId, periodoInicio?, tipo?: TipoTransaccion, estado?: EstadoBancario, cursor?, limite? })`.

```ts
interface DetalleCuentaDto extends Encabezado {
  cuenta: Ref & { tipo: TipoCuenta; institucion?: string; ultimos4?: string; fechaApertura: FechaLocal; archivada: boolean };
  saldo: Centavos; saldoConfirmado: Centavos;
  navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // [F5] CP-9: vecinos de periodoInicio, o del activo (selector periodos)
  movimientos: (TransaccionFila & { efectoEnCuenta: Centavos; saldoDespues: Centavos })[];  // saldo corrido (6.0.5)
  siguienteCursor?: Cursor;
  conciliaciones: {
    id: Uuid; fechaEstado: FechaLocal; saldoEstado: Centavos; terminadaEn: Instante;
    diferenciaAceptada: Centavos; diferenciaActual: Centavos;    // DM-8; AV-21 si ≠ 0
    modo: 'estado_cuenta' | 'saldo';                             // [F6] CF-01: OP-47 o OP-53
    transaccionesConciliadas: number;
    cambiosPosteriores: { registradoEn: Instante; motivos: MotivoCambio[]; transaccionId?: Uuid;
                          foto: { fecha: FechaLocal; montoEfecto: Centavos; comercio?: string } }[];
  }[];
  programadas: { programada: Ref; rol: 'origen' | 'destino'; activa: boolean }[];
  tarjeta?: { deuda; saldoAFavor; reservado; faltaReservar; reservaExcedente; limite: Centavos; usoLimite: number;
              cicloFacturacion: { desde: FechaLocal; hasta: FechaLocal };
              desgloseAlPagar: { deudaAnterior; cargosDelCiclo; yaPagado; paraNoGenerarIntereses: Centavos } };
  prestamo?: {
    condiciones: CondicionesPrestamoDto;                 // columnas de prestamos (03 §3.6)
    capitalPendiente: Centavos;
    amortizacion: { numero: number; fecha: FechaLocal; interes; seguro; capital; saldo: Centavos;
                    estado: 'pagada' | 'parcial' | 'pendiente' | 'atrasada'; pagado: Centavos }[] | null;  // null sin modelo
    comparacion: { proyectadoHastaHoy: Centavos; pagadoHastaHoy: Centavos } | null;
    costoFinanciero: { interes: Centavos; seguro: Centavos };   // Σ del desglose registrado (H6)
  };
  inversion?: { valor: Centavos; aportes: Centavos; retiros: Centavos; ajustes: Centavos };
  acciones: { puedeArchivar: boolean; bloqueosArchivo: string[]; puedeEliminar: boolean; bloqueosEliminar: string[] };
}
```

- Lee `conciliaciones` (hechos) y `cambios_posteriores` ([H]).
- `diferenciaActual` = saldo según el estado − saldo de las conciliadas (DM-8); el selector la calcula por conciliación.

### 6.7 Actividad y detalle de transacción

#### 6.7.1 Actividad

`consultas.actividad({ texto?, montoDesde?, montoHasta?: MontoTexto, categoriaId?, cuentaId?, desde?, hasta?: FechaLocal, estado?: EstadoBancario, tipo?: TipoTransaccion, origen?: OrigenTransaccion, cursor?, limite? })`.

```ts
interface ActividadDto extends Encabezado {
  dias: { fecha: FechaLocal; transacciones: TransaccionFila[] }[];
  siguienteCursor?: Cursor;
}
interface TransaccionFila {
  id: Uuid; fecha: FechaLocal; tipo: TipoTransaccion;
  cuentas: { cuenta: Ref; monto: Centavos }[];        // efectos, con signo
  comercio: string | null; total: Centavos;
  montoPresentado: Centavos;                           // gasto y salidas en negativo; ingresos y entradas en positivo; 0 en movimientos neutros
  lineas: { destino: Ref & { tipo: 'categoria' | 'deudor' }; monto: Centavos }[];
  estadoBancario: EstadoBancario; origen: OrigenTransaccion;
  marcas: { porCobrar: boolean; conDevoluciones: boolean; conciliada: boolean; programada: boolean; periodoCerrado: boolean };
}
```

- Los filtros por cuenta, categoría, fechas, montos, estado, tipo y origen se aplican sobre los hechos en memoria.
- **Búsqueda por texto:** `nota` no se carga en los hechos del motor (5.2), así que `texto` se resuelve con una consulta en la misma instantánea: `SELECT id FROM finn.transacciones WHERE comercio ILIKE $1 OR nota ILIKE $1` (sin índice, como prevé 03 §6; con 50.000 filas es un recorrido secuencial de milisegundos), y el resultado filtra los hechos. El texto se escapa (`%` y `_`).
- `montoDesde` y `montoHasta` comparan con `total`.

#### 6.7.2 Detalle de transacción

`consultas.detalleTransaccion({ transaccionId })`.

```ts
interface DetalleTransaccionDto extends Encabezado {
  transaccion: TransaccionFila & {
    nota: string | null; horaRegistro: Instante; monedaOriginal?: string; montoOriginal?: string;
    periodo: PeriodoDto;
  };
  efectos: { cuenta: Ref; monto: Centavos; interes?: Centavos; seguro?: Centavos }[];
  lineas: {
    id: Uuid; orden: number; monto: Centavos;
    destino: { categoria: Ref } | { deudor: Ref } | { lineaOriginal: { id: Uuid; transaccionId: Uuid } };
    reparto?: { cubierto: Centavos; noCubierto: Centavos };         // líneas de categoría de un consumo (§4.5)
    porCobrar?: { abierto; restituido; condonado; devuelto: Centavos; estado: 'abierto' | 'parcial' | 'cerrado' };
    cobros: { transaccionId: Uuid; fecha: FechaLocal; monto; restitucion; excedente: Centavos }[];
    condonaciones: { id: Uuid; fecha: FechaLocal; monto: Centavos; categoria: Ref }[];
    devoluciones: { transaccionId: Uuid; fecha: FechaLocal; monto: Centavos; caso: 'D-1' | 'D-2' | 'D-3' | 'D-4' }[];
  }[];
  conciliacion?: { id: Uuid; fechaEstado: FechaLocal };
  cambiosPosteriores: { registradoEn: Instante; motivos: MotivoCambio[] }[];
  origenDetalle?: { sms: { texto: string; recibidoEn: Instante; movimientoId: Uuid } }
               | { programada: { programada: Ref; fechaEsperada: FechaLocal } };
  restricciones: {
    puedeEliminar: boolean; motivoNoEliminar?: CodigoRechazo;          // OP-29
    puedeCambiarCuenta: boolean; puedeCambiarFecha: { minima: FechaLocal; maxima: FechaLocal };  // OP-28, inv. 12
    lineasConEventos: Uuid[]; conciliada: boolean;                      // AV-16
  };
  esperado: Record<string, unknown>;                   // valores actuales para el "esperado" de OP-28 (4.6.2)
}
```

- Lee `nota`, `moneda_original` y `monto_original` de la fila, `movimientos` y `sms_recibidos` ([H], [I]) y `cambios_posteriores` ([H]).


### 6.8 Bandeja de SMS

`consultas.bandeja({ vista?: 'activos' | 'descartados', cursor? })` — por defecto `activos`.

```ts
interface BandejaDto extends Encabezado {
  contadores: { pendientes; conCoincidencia; posiblesDuplicados; noReconocidos; errores: number };
  movimientos: MovimientoDto[];          // activos: todos (máximo 200); descartados: paginados por recibido_en desc
  siguienteCursor?: Cursor;
  elegiblesAprobarTodos: Uuid[];         // los que OP-38 intentaría
  destinosArrastre: {                    // [F6] CF-22 (FT-78)
    frecuentes: Ref[];                   // hasta ARRASTRE_FRECUENTES_MAX (6)
    grupos: { grupo: Ref; categorias: Ref[] }[];   // todas las normales activas, por orden; sin "Pagos de tarjeta"
  };
}
interface MovimientoDto {
  id: Uuid; estado: EstadoMovimiento;
  sms: { id: Uuid; texto: string; remitente: string; recibidoEn: Instante };
  procesamiento: { intento: number; resultado: ResultadoProcesamiento; formato?: string;
                   formatosCoincidentes: string[]; errorDetalle?: string };        // último intento (OP-49: intentoVisto)
  cuenta: Ref | null; fecha: FechaLocal | null; monto: Centavos | null; comercio: string | null;
  tipoPropuesto: TipoTransaccion | null; nota: string | null;
  lineas: { monto: Centavos; destino: (Ref & { tipo: 'categoria' | 'deudor' }) | { lineaOriginalId: Uuid } | null }[];
  categoriaSugerida: (Ref & { porRegla: boolean }) | null;   // [F6] CF-25: origen 'regla' de sugerirCategoria
  coincidencia?: { programada: Ref; fechaEsperada: FechaLocal; montoEsperado: Centavos;
                   ocurrencia: 'pendiente' | 'registrada'; transaccionRegistradaId?: Uuid };
  duplicado?: { tipo: 'transaccion' | 'movimiento'; id: Uuid; fecha: FechaLocal; monto: Centavos;
                comercio: string | null; cuenta: Ref | null };
  origenPropuesto?: Ref;                 // solo tipo pago_tarjeta (BE-41)
  aprobacion: { posible: boolean; faltantes: ('cuenta' | 'fecha' | 'monto' | 'tipo' | 'destino' | 'origen')[];
                requiereConfirmacion: boolean;        // AV-01 si la fecha es de un período cerrado
                elegibleAprobarTodos: boolean; motivoNoElegible?: string;
                arrastrable: boolean };              // [F6] CF-22: precondiciones propias de la variante de OP-37 (CF-21)
  esperado: Record<string, unknown>;     // para OP-36
}
```

- Lee `movimientos`, `movimiento_lineas` ([H]), `sms_recibidos` y el último `sms_procesamientos` de cada SMS ([I]), y `formatos_bancarios` ([H]) para los nombres.
- `aprobacion` se calcula con las precondiciones de OP-37 y las reglas de exclusión de OP-38 (período cerrado, `pago_tarjeta`, estado distinto de `pendiente`); no es una fórmula nueva.
- `errorDetalle` es el detalle saneado (7.8).
- **[F6] Frecuentes (CF-22).** Las categorías normales y activas con más líneas en transacciones de tipo gasto con fecha en los últimos `ARRASTRE_FRECUENTES_DIAS` (90) días, hoy incluido; desempate por la línea más reciente y después por el orden del presupuesto. Sin historial, las primeras por orden de grupo y categoría. Se calculan sobre la instantánea, sin lecturas nuevas.

**BE-41. Cuenta de origen propuesta para un pago de tarjeta (ajuste 3).** Para un movimiento con `tipo_propuesto = 'pago_tarjeta'` y cuenta t:
1. Entre las transacciones de tipo `pago_tarjeta` cuyo efecto positivo es sobre t, se toma la última por (`fecha`, `clave_orden`, `secuencia`).
2. `origenPropuesto` es la cuenta de su efecto negativo (efectivo), si sigue abierta.
3. Si no hay pagos anteriores a t o esa cuenta está archivada, no hay propuesta y la aprobación exige elegirla (`faltantes` incluye `origen`).

Se deriva de los hechos, sin columna nueva. La interfaz envía `origenPropuesto` preseleccionado en `origenId` de OP-37, así que la aprobación individual es de un toque; OP-38 sigue excluyendo estos movimientos. *Alternativa descartada:* la cuenta de efectivo con más pagos a esa tarjeta (cambia más lento cuando el usuario cambia de cuenta de pago).

### 6.9 Reportes

`consultas.reporte({ tipo, ventana?: 'actual' | 'ultimos_1' | 'ultimos_3' | 'ultimos_6' | 'ultimos_12', cuentaIds?: Uuid[], ... })` — un tipo por llamada.

**[F5] Filtros (CP-12).** Todo DTO de reporte extiende `Encabezado` (6.0.2) y agrega `filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] }`, con las archivadas que tuvieron actividad en la ventana, para que la pantalla muestre los filtros por nombre. Vale también para `GastoSemanalDto` (6.9.3) y `DatosBaseDto` (6.9.4).

#### 6.9.1 Definiciones comunes (BE-40) [Propio]

**[F6]** Los tipos `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos` (CF-04) y `flujo_efectivo` (CF-02) están en 6.9.7.

Los reportes de producto §10 no tienen fórmula en 01; estas son las que implementa `seleccionar.reportes`. Solo combinan derivados de 01 §4.

- **Ventana W.** `actual` = {A}. `ultimos_n` = los n períodos **cerrados** más recientes (el producto distingue "el período actual" de "los últimos 1, 3, 6 o 12").
- **Filtro de cuentas K** (opcional): solo cuentan los consumos, entradas y devoluciones cuyo efecto está en una cuenta de K. Para una condonación, la cuenta es la de la compra de su por cobrar.
- **Ingresos(p):** Σ de los movimientos de clase *ingreso* con fecha en p (§4.13: ingresos, excedentes de cobro, entradas a la tarjeta).
- **OtrasEntradas(p):** Σ de clase *otras entradas* (desembolsos, retiros de inversión, avances de efectivo).
- **Restituciones(p):** Σ de clase *restitución*. Informativo; nunca es ingreso (D1, O1).
- **Gastos(p):** Σ de Gastado(c, p) de las categorías normales (§4.4: consumos netos menos aportes de devoluciones; incluye condonaciones, cuotas y aportes, §4.13). Con filtro K, la misma suma restringida a K.

#### 6.9.2 Reportes de producto §10

| `tipo` | Parámetros extra | Devuelve | Fórmula [Propio] |
|---|---|---|---|
| `tendencia` | — | Por período de W: `{ periodo, ingresos, gastos, otrasEntradas, gastosPorGrupo: { grupo, monto }[] }` | Definiciones de 6.9.1 |
| `categorias` | `grupoId?` | `{ categoria, grupo, gastado, porcentaje }[]` y `conDevolucionNeta: { categoria, gastado }[]` | Gastado acumulado en W por categoría normal (incluidas las archivadas con actividad). La dona usa las de gastado > 0; `porcentaje` = gastado / Σ positivos, en puntos básicos. Las de gastado ≤ 0 van aparte |
| `ingresos_gastos` | — | Por período: `{ periodo, ingresos, gastos, diferencia, otrasEntradas, restituciones }` | `diferencia` = Ingresos − Gastos; otras entradas y restituciones se muestran aparte (H13, D1) |
| `remanente` **[R3]** (producto §10, "Cashflow") | — | Por período: `{ periodo, neto, acumulado }` | `neto` = Ingresos − Gastos (lo que queda del dinero nuevo del período); `acumulado` = suma en W. Otras entradas no cuentan: un desembolso es deuda (H13). **No es un flujo de caja** (6.9.5) |
| `top_comercios` **[R3]** | `limite?` (10) | `{ clave, etiqueta, porRegla: boolean, monto, frecuencia, categoriaPrincipal, variantes: { comercio, monto, frecuencia }[] }[]` | Clave de agrupación de 6.9.6 (regla de comercio o comercio normalizado). Sobre las transacciones de tipo `gasto` con fecha en W: `monto` = Σ de sus líneas de categoría − Σ de las devoluciones vinculadas a esas líneas con fecha en W; `frecuencia` = número de transacciones; `categoriaPrincipal` = la de mayor monto. `variantes`: los comercios normalizados agrupados en la clave, con sus propios montos y frecuencias, ordenados por monto. Sin comercio: clave `(sin comercio)` |
| `cumplimiento` | — | Por categoría normal y período: `{ categoria, periodo, asignado, gastado, diferencia, porcentaje \| null }` | `diferencia` = Asig − Gastado; `porcentaje` = Gastado / Asig en puntos básicos, `null` si Asig ≤ 0 |
| `patrimonio` | — | `{ hoy: posicionNeta (6.5), serie: { periodo, activos, deudas, neto }[] }` | §4.14 hoy; la serie evalúa §4.14 al fin de cada período de W con saldos, por cobrar y valores a esa fecha |

#### 6.9.3 Gasto semanal por categoría (P4-10) [Propio]

`tipo: 'gasto_semanal'`, parámetros `periodoInicio?` (por defecto A), `categoriaIds?`.

- **Semanas del período:** sₖ = [inicio + 7(k − 1), mín(inicio + 7k − 1, fin)], k = 1 … ⌈dur(p) / 7⌉. La última puede tener de 1 a 7 días.
- **Gasto(c, sₖ):** Gastado(c, p) restringido a las fechas de sₖ (consumos netos − aportes de devoluciones de esos días).
- **Referencia(c, sₖ):** parte proporcional de lo asignado, con redondeo **acumulado** para que la suma de las semanas sea exactamente Asig(c, p). **[R3]** Si Asig(c, p) < 0 (desasignación, supuesto 6), la referencia de todas las semanas es 0:
  RefAcum(k) = redondeo mitad hacia arriba de Asig(c, p) × (días acumulados hasta sₖ) / dur(p); Ref(k) = RefAcum(k) − RefAcum(k − 1).
- V-22 verificó con 100.000 casos que la suma de las referencias es exactamente Asig(c, p).
- **Comparación con semanas anteriores:** el gasto de la misma semana k en los 3 períodos cerrados anteriores en que existía la categoría. **[F6]** "Existía" es el selector `existiaEn` (6.0.5, CF-17); sin ninguno, la categoría es nueva y no hay comparación.

```ts
interface GastoSemanalDto extends Encabezado {          // [F5] CP-12
  periodo: PeriodoDto;
  navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // [F5] CP-9: inicios de los períodos vecinos (selector periodos)
  filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] };   // [F5] CP-12
  categorias: {
    categoria: Ref; asignado: Centavos;
    semanas: { k: number; desde: FechaLocal; hasta: FechaLocal; dias: number; futura: boolean;
               gasto: Centavos; referencia: Centavos; gastoAcumulado: Centavos; referenciaAcumulada: Centavos;
               anteriores: { periodo: FechaLocal; gasto: Centavos }[] }[];
    semanaActual?: { k: number; porcentajeReferenciaBp: number | null };   // [F6] CF-25: gasto / Ref(k), sin tope; null si Ref(k) ≤ 0
    diferenciaReferencia?: Centavos;                // [F6] CF-25: RefAcum(k) − gasto acumulado a la semana en curso
  }[];
}
```

En el período activo, las semanas que empiezan después de hoy van con `futura = true` y gasto 0.

*Alternativas descartadas para BE-40:* semanas de calendario de lunes a domingo (no encajan con períodos del 21 al 20 y partirían el período en 5 o 6 tramos irregulares); referencia sin redondeo acumulado (la suma de las semanas podría diferir de lo asignado en centavos).

#### 6.9.5 Presentación del reporte `remanente` **[R3]**

La fórmula de BE-40 cuenta las compras con tarjeta en el período en que se hacen, no cuando se pagan, y no incluye pagos de tarjeta, transferencias ni otras entradas. Por eso **no es un flujo de caja**: un período con muchas compras con tarjeta que se pagan en el siguiente muestra un remanente bajo aunque el efectivo no haya bajado.

- La interfaz lo presenta como **"Lo que te quedó del período"**, con la explicación "Ingresos del período menos lo que gastaste, incluidas las compras con tarjeta". Nunca como "flujo de caja" ni "cashflow".
- El identificador del reporte es `remanente`; la referencia al nombre del documento de producto (§10, "Cashflow") queda solo como trazabilidad.
- Un flujo de efectivo real (variación de los saldos de las cuentas de efectivo) no está pedido en el producto; si se quiere, es una pregunta para la Fase 6 (0.11, D-4).

#### 6.9.6 Clave de agrupación de comercios (BE-43) **[R3]**

Los SMS traen variantes del mismo comercio ("SUPER SELECTOS ESCALON", "SUPER SELECTOS STA ELENA"). La clave de agrupación de `top_comercios` es:

1. **Por regla:** si el comercio normalizado contiene el patrón de alguna regla de comercio (sin distinguir mayúsculas), la clave es ese patrón. Si coinciden varias, gana el patrón más largo, y a igual largo, el primero en orden alfabético. Es el mismo criterio de coincidencia de §4.17, con una diferencia: **se consideran todas las reglas**, también las que apuntan a categorías archivadas, porque aquí se agrupa por comercio y no se sugiere una categoría. `etiqueta` = el patrón tal como está escrito en la regla; `porRegla = true`.
2. **Sin regla:** la clave es el comercio normalizado (minúsculas, sin espacios en los extremos ni repetidos, §4.17); `etiqueta` = la variante más frecuente tal como vino en la transacción; `porRegla = false`.

- Las reglas son [H]: la consulta las lee de `reglas_comercio` en la misma instantánea y se las pasa al selector, que es puro (`seleccionar.reportes.topComercios(instantanea, reglas, parametros)`).
- La agrupación usa las reglas **vigentes**: si el usuario crea o edita una regla, los reportes de períodos pasados se reagrupan. Es intencional: la regla describe qué es el comercio, no cuándo se registró.

*Alternativa descartada:* agrupar por la categoría sugerida (dos comercios distintos de la misma categoría quedarían juntos).

#### 6.9.7 Reportes accionables y flujo de efectivo **[F6]** (CF-02, CF-04)

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

#### 6.9.4 Datos base para los reportes de §16 (fórmulas en la Fase 6)

**[F6]** **CF-09.** Las fórmulas de §16 quedaron definidas en `06-features.md` §3.5 como selectores propios (6.9.7) y no usan `datos_base`. Este tipo sigue sin ruta en la interfaz, como **insumo de pruebas**: la Fase 7 lo usa para comprobar que esos selectores coinciden con los datos base donde se superponen. Donde el párrafo siguiente dice que "la Fase 6 define los cálculos", rige esta nota.

`tipo: 'datos_base'`, parámetros `ventana`, `cuentaIds?`. Sin fórmulas nuevas; la Fase 6 define los cálculos de ritmo de gasto, proyección del cierre, presupuesto contra la realidad, comparación con el promedio, gastos hormiga, suscripciones, tarjetas y hallazgos.

```ts
interface DatosBaseDto extends Encabezado {             // [F5] CP-12; más filtros
  categoriasPorPeriodo: { categoria: Ref; periodo: FechaLocal; asignado; gastado; arrastre; disponible;
                          sobregiroTarjeta; sobregiroDebito: Centavos; pedidoMeta?: Centavos }[];   // §4.4–§4.7, §4.12
  consumos: { fecha: FechaLocal; categoria: Ref; comercioNormalizado: string | null; cuenta: Ref;
              medio: 'tarjeta' | 'debito'; montoNeto: Centavos; transaccionId?: Uuid }[];   // §4.1.6, en W
  tarjetasPorPeriodo: { tarjeta: Ref; periodo: FechaLocal; cargos; pagos; deudaAlFin: Centavos; disponiblePago: Centavos }[];
  programadas: { programada: Ref; monto: Centavos; frecuencia: Frecuencia; frecuenciaDias?: number; activa: boolean }[];
  lpaAlCierre: { periodo: FechaLocal; lpa: Centavos }[];      // §4.9
  patrimonioAlCierre: { periodo: FechaLocal; neto: Centavos }[];  // §4.14
}
```

`tarjetasPorPeriodo.disponiblePago` es Disp(pago(t), p); S(t) solo existe para el período activo (inv. 2), por eso no se expone por período.

### 6.10 Metas

`consultas.metas()`.

```ts
interface MetasDto extends Encabezado {
  metas: {
    id: Uuid; categoria: Ref; grupo: Ref;
    tipo: TipoMeta; modo?: ModoMeta; monto: Centavos;
    fechaCreacion: FechaLocal; fechaObjetivoVigente?: FechaLocal;   // con renovaciones (§4.12)
    montoPeriodo?: Centavos; pedido: Centavos; falta: Centavos;
    disponible: Centavos; progreso?: number;          // metas de ahorro: Disp(c, A) / monto en puntos básicos (máximo 10.000)
    estado: EstadoMeta; vencida: boolean;              // AV-17
    esperado: Record<string, unknown>;                 // para OP-18 (editar)
  }[];
  categoriasSinMeta: Ref[];                            // normales y activas, para crear una
}
```

- Orden: vencidas primero; después por grupo y categoría.
- Las metas de categorías archivadas se conservan pero no se evalúan (§4.12, B-11); no aparecen.

### 6.11 Ajustes

`consultas.ajustes()`.

```ts
interface AjustesDto extends Encabezado {
  ciclo: { diaInicioVigente: number; vigenciaFutura?: { diaInicio: number; rigeDesde: FechaLocal } };
  webhook: { configurado: boolean; rotadoEn?: Instante };                // token_webhook (nunca el hash)
  formatos: { id: Uuid; institucion: Ref; nombre: string; tipoMovimiento: TipoMovimientoBancario;
              activo: boolean; usos: number; ultimoUso?: Instante }[];   // usos = procesamientos con ese formato
  instituciones: Ref[];
  suscripcionesPush: { endpointCorto: string; agente?: string; renovadaEn: Instante }[];
  respaldo: { ultimoRespaldoEn?: Instante; ultimaRestauracionEn?: Instante;
              respaldoAtrasado: boolean; restauracionAtrasada: boolean };    // > 36 h, > 35 días (03 §7.5)
  diagnostico: { ocurridoEn: Instante; nivel: 'aviso' | 'error'; origen: string; mensaje: string; idError?: string }[]; // 50 últimos (§15)
  exportaciones: { json: string; csv: string };                           // rutas de descarga (OPT-08)
}
```

- Lee tablas [H] (`formatos_bancarios`, `instituciones`), [I] (conteo de `sms_procesamientos` por `formato_id`) y [T] (`token_webhook`, `suscripciones_push`, `estado_respaldo`, `eventos_sistema`).
- `endpointCorto`: dominio del servicio de push y los últimos 8 caracteres; nunca las claves.
- El estado de los factores TOTP lo da Supabase Auth, no la base; lo define §12 (Parte C). **[F5]** La pantalla lo lee con `estadoSeguridad()` (12.2, CP-4); `AjustesDto` no cambia.

### 6.12 Otras pantallas conocidas

El producto menciona además estas pantallas (§9, §15 y §6 del documento de producto).

#### 6.12.1 Programadas y próximos pagos

`consultas.programadas({ horizonteDias?: number })` — por defecto 30 (BE-37).

```ts
interface ProgramadasDto extends Encabezado {
  programadas: { id: Uuid; tipo: TipoProgramada; comercio: string; cuenta: Ref; cuentaDestino?: Ref;
                 monto: Centavos; tolerancia: Centavos; frecuencia: Frecuencia; frecuenciaDias?: number;
                 primeraFecha: FechaLocal; fechaFin?: FechaLocal; registroAutomatico: boolean; activa: boolean;
                 lineas: { categoria: Ref; monto: Centavos }[];
                 proximas: FechaLocal[]; atrasadas: FechaLocal[];
                 calendarioEditable: boolean;          // false si tiene resoluciones o una coincidencia propuesta (P3-6b, HZ-3)
                 puedeEliminar: boolean;               // OP-51
                 avisoSinModelo: boolean }[];          // cuota con registro automático y préstamo sin modelo (QB-1)
  proximosPagos: OcurrenciaDto[];                      // consolidado, ordenado por fecha
}
```

`calendarioEditable` y `puedeEliminar` leen `movimientos` y `sms_procesamientos` (referencias a la programada).

**[F6]** **CF-20.** `proximas` y `atrasadas` (y `proximosPagos`) solo incluyen ocurrencias con fecha ≥ `reactivada_desde` cuando la columna no es nula.

#### 6.12.2 Reglas de comercio

`consultas.reglas()` → `{ reglas: { id; patron; categoria: Ref; categoriaArchivada: boolean }[] }`. Las reglas hacia categorías archivadas se muestran marcadas porque se ignoran al sugerir (§4.17, B-10).

#### 6.12.3 Por cobrar

`consultas.porCobrar({ incluirCerrados?: boolean })`.

```ts
interface PorCobrarDto extends Encabezado {
  enCamino: Centavos; totalAbierto: Centavos;            // AV-09; activo del patrimonio (P9)
  deudores: { deudor: Ref; abierto: Centavos;
              items: { lineaId: Uuid; transaccionId: Uuid; fechaOrigen: FechaLocal; comercio: string | null;
                       monto; restituido; condonado; devuelto; abierto: Centavos;
                       medio: 'tarjeta' | 'debito'; estado: 'abierto' | 'parcial' | 'cerrado';
                       categoriaPropuestaCondonacion?: Ref }[] }[];   // OP-32
}
```

#### 6.12.4 Administración de grupos y categorías

`consultas.estructura()` → árbol `{ grupo: Ref & { archivado, sistema: boolean }; categorias: { categoria: Ref; clase: 'normal' | 'pago'; archivada: boolean; tieneMeta: boolean; puedeEliminar: boolean; puedeArchivar: boolean }[] }[]`. `puedeEliminar` y `puedeArchivar` siguen las precondiciones de OP-09 y OP-13 (`reglas_comercio` es [H]).

#### 6.12.5 Centro de notificaciones

`consultas.notificaciones({ cursor?, soloNoLeidas? })` → `{ notificaciones: { id; creadaEn; aviso; motivo; titulo; cuerpo; destino?: DestinoNotificacion /* [F5] CP-1, 11.4 */; leida: boolean; existeDestino: boolean }[]; siguienteCursor? }`.
- Lee `notificaciones` ([T]), ordenadas por `creada_en` desc.
- `existeDestino`: si la entidad de `datos` ya no existe, la interfaz lo indica (03 §7.4).
- **[F5]** `destino` es el tipo cerrado `DestinoNotificacion` de 11.4 (CP-1). Un destino que no valida con el contrato se trata como ausente: la interfaz abre el centro de notificaciones.

#### 6.12.6 Conciliación

No tiene consulta propia: la pantalla muestra la salida de OP-45 (3.8) y, al terminar, el detalle de cuenta (6.6).

### 6.13 Cobertura de pantallas

| Pantalla (encargo y producto) | Consulta |
|---|---|
| Inicio | 6.1 |
| Presupuesto | 6.2 |
| Detalle de categoría (normal y de pago) | 6.3 |
| Listo para asignar | 6.4 |
| Cuentas y posición neta | 6.5 |
| Detalle de cuenta (incluye tabla de amortización y conciliaciones) | 6.6 |
| Actividad y detalle de transacción | 6.7 |
| Bandeja de SMS | 6.8 |
| Reportes | 6.9 |
| Metas | 6.10 |
| Ajustes (incluye formatos, token, push, respaldo, diagnóstico) | 6.11 |
| Programadas y próximos pagos | 6.12.1 |
| Reglas de comercio | 6.12.2 |
| Por cobrar | 6.12.3 |
| Administración de grupos y categorías | 6.12.4 |
| Centro de notificaciones | 6.12.5 |
| Conciliación | OP-45 (3.8) + 6.6 |
| Previsualizaciones de operaciones | `previsualizar` de cada operación (4.3, §3) |
| **[R3]** Formularios de registro y edición | `formulario` (6.14) |

### 6.14 Formularios (BE-42) **[R3]**

#### 6.14.1 Consulta

`consultas.formulario(parametros) → FormularioDto`. Alimenta los formularios de registro y edición de §3: lo que necesita el usuario para elegir y lo que necesita la interfaz para enviar la operación (valores `esperado`, propuestas). Como toda consulta, no calcula: cada número sale de un selector (6.0.5).

```ts
type ParametrosFormulario =
  | { operacion: 'registrar'; tipo: 'gasto' | 'ingreso' | 'transferencia' | 'devolucion_sin_compra'
                                    | 'aporte_inversion' | 'retiro_inversion' | 'ajuste_inversion'
                                    | 'desembolso' | 'avance' | 'entrada_tarjeta' | 'transferencia_deuda';
      cuentaId?: Uuid }                                              // OP-20, 21, 22, 25, 26, 27, 33b
  | { operacion: 'pagar_tarjeta'; tarjetaId?: Uuid }                 // OP-23
  | { operacion: 'cuota_prestamo'; prestamoId: Uuid; modalidad: 'cuota' | 'abono'; fecha?: FechaLocal } // OP-24
  | { operacion: 'editar_transaccion'; transaccionId: Uuid }         // OP-28
  | { operacion: 'cobrar'; lineaId?: Uuid; deudorId?: Uuid; fecha?: FechaLocal }  // OP-31
  | { operacion: 'condonar'; lineaId: Uuid }                         // OP-32
  | { operacion: 'devolver'; transaccionOriginalId?: Uuid;
      busqueda?: { texto?: string; cuentaId?: Uuid; desde?: FechaLocal; hasta?: FechaLocal; monto?: MontoTexto } } // OP-33a
  | { operacion: 'asignar'; categoriaId: Uuid; periodoInicio?: FechaLocal }    // OP-14, 15, 16
  | { operacion: 'archivar_categoria'; categoriaId: Uuid }           // OP-09
  | { operacion: 'fusionar'; origenId: Uuid }                        // OP-12
  | { operacion: 'cuenta'; cuentaId?: Uuid; tipo?: TipoCuenta }      // OP-01, 02, 48
  | { operacion: 'programada'; programadaId?: Uuid; fechaEsperada?: FechaLocal }  // OP-42; [F5] CP-10b: con fecha, OP-43 y OP-44
  | { operacion: 'movimiento'; movimientoId: Uuid }                  // OP-36, 37, 50
  | { operacion: 'formato'; formatoId?: Uuid }                       // OPT-05, 06, 07
  | { operacion: 'meta'; categoriaId?: Uuid; metaId?: Uuid }         // OP-18
  | { operacion: 'regla'; reglaId?: Uuid }                           // [F5] CP-10c: OP-41
  | { operacion: 'conciliar'; cuentaId: Uuid }                      // [F5] CP-16: OP-45, OP-46, OP-47
  | { operacion: 'verificar_saldo'; cuentaId: Uuid; fecha?: FechaLocal };  // [F6] CF-01: OP-53

interface FormularioDto extends Encabezado {
  catalogos: Catalogos;               // solo las partes que pide la operación (6.14.2)
  contexto: ContextoFormulario;       // propio de la operación (6.14.4)
}
```

**BE-42.** Una sola consulta con parámetros discriminados por operación, que devuelve catálogos comunes y un contexto propio. *Justificación:* los formularios comparten la mayor parte de los datos (cuentas, categorías, deudores, comercios); una consulta por formulario repetiría esos bloques en una docena de DTO. *Alternativa descartada:* que la interfaz combine consultas de pantallas (Cuentas, Presupuesto, Por cobrar) para armar un formulario: varias transacciones de lectura con posibles revisiones distintas en el mismo formulario.

#### 6.14.2 Catálogos

```ts
interface Catalogos {
  cuentas?: {                                     // abiertas, por tipo, en el orden de OP-03
    efectivo: { cuenta: Ref; saldo: Centavos }[];
    tarjetas: { cuenta: Ref; deuda: Centavos; saldoAFavor: Centavos }[];
    prestamos: { cuenta: Ref; capitalPendiente: Centavos; tieneModelo: boolean }[];
    inversiones: { cuenta: Ref; valor: Centavos }[];
  };
  categorias?: {                                  // normales y activas, agrupadas, con Disp(c, A)
    grupos: { grupo: Ref; categorias: { categoria: Ref; disponible: Centavos; sobregiro: SobregiroDto | null }[] }[];
  };
  categoriasPago?: { categoria: Ref; tarjeta: Ref; disponible: Centavos; faltaReservar: Centavos }[];  // solo donde aplica
  deudores?: { deudor: Ref; abierto: Centavos }[];          // por nombre
  comercios?: {                                   // autocompletar (6.14.3)
    comercio: string; ultimoUso: FechaLocal; usos: number;
    sugerencia: { categoria: Ref; origen: 'regla' | 'historial' } | null;
  }[];
  lpa?: { lpa: Centavos; enCamino: Centavos };
}
```

| Operación | `cuentas` | `categorias` | `categoriasPago` | `deudores` | `comercios` | `lpa` |
|---|---|---|---|---|---|---|
| `registrar` (gasto, devolución sin compra) | Sí | Sí | — | Sí (gasto) | Sí | — |
| `registrar` (ingreso, transferencia, inversión, desembolso, tarjeta) | Sí | Aporte: sí | — | — | — | — |
| `pagar_tarjeta` | Sí | — | Sí | — | — | — |
| `cuota_prestamo` | Sí | Sí | — | — | — | — |
| `editar_transaccion` | Sí | Sí | Pago de tarjeta: sí | Sí | Sí | — |
| `cobrar` | Sí | — | Sí (para AV-22) | Sí | — | — |
| `condonar` | — | Sí | — | — | — | — |
| `devolver` | Sí | — | — | — | — | — |
| `asignar` | — | Sí | Sí | — | — | Sí |
| `archivar_categoria` | — | Sí | — | — | — | Sí |
| `fusionar` | — | Sí | — | — | — | — |
| `cuenta` | — | — | — | — | — | — |
| `programada` | Sí | Sí | — | — | Sí | — |
| `movimiento` | Sí | Sí | — | Sí | Sí | — |
| `formato`, `meta` | — | `meta`: sí | — | — | — | — |

- `disponible` de las categorías es Disp(c, A) del período activo: el formulario no sabe todavía la fecha. Si la operación cae en otro período, la previsualización (4.3) muestra el impacto real, incluido AV-01.
- Los catálogos excluyen cuentas y categorías archivadas: no reciben movimientos ni destinos nuevos (inv. 20, §5.0.5). La edición de una transacción (6.14.4) incluye además, marcadas, las archivadas que ya usa.

#### 6.14.3 Comercios recientes y sugerencia

`seleccionar.comerciosRecientes(instantanea, reglas, 300)`:
- Recorre las transacciones de tipo `gasto` y agrupa por comercio normalizado (§4.17); `comercio` = la forma más reciente tal como se escribió; `ultimoUso` y `usos` de la agrupación.
- Ordena por `ultimoUso` descendente y devuelve hasta 300. La interfaz filtra mientras se escribe, sin más consultas.
- `sugerencia` = `sugerirCategoria(comercio, reglas)`: el **mismo** criterio de §4.17 que usa la bandeja (OP-35 paso 10): primero la regla de comercio (patrón contenido, sin mayúsculas, el más largo; se ignoran las que apuntan a categorías archivadas, B-10); si no hay, la categoría de la línea única más reciente de una transacción aprobada con el mismo comercio y una categoría activa.
- Las reglas son [H]: la consulta lee `reglas_comercio` en la misma instantánea.
- Cuando el usuario escribe un comercio nuevo que no está en la lista, la interfaz puede pedir la sugerencia con `consultas.sugerencia({ comercio })` → `{ sugerencia }` (mismo selector). Es la única consulta que acepta texto libre del usuario además de la búsqueda de Actividad.

#### 6.14.4 Contexto por operación

| Operación | `contexto` | Selector o fuente |
|---|---|---|
| `registrar` | `{ cuentaPropuesta?: Ref }`: la de `cuentaId` o, en gastos, la cuenta del último gasto registrado | Hechos |
| `pagar_tarjeta` | Por tarjeta: `{ tarjeta, deuda, saldoAFavor, reservado (R⁺), disponiblePago (Disp(pago(t), A)), faltaReservar (S), desgloseAlPagar: { deudaAnterior, cargosDelCiclo, yaPagado, paraNoGenerarIntereses, ultimoCorte }, origenPropuesto?: Ref }` | `tarjeta(t)`, `desgloseAlPagar(t, hoy)` (§4.14), `origenPropuestoPagoTarjeta(t)` (BE-41) |
| `cuota_prestamo` | `{ prestamo: Ref; capitalPendiente; cuotaPactada; tieneModelo; desglosePropuesto?: { capital; interes; seguro; total; numeroCuota }; cuotaEmparejada?: { numero; fecha; estado }; categoriaPropuesta?: Ref }` | `desglosePropuesto(prestamo, fecha ?? hoy)` (Anexo A.2 puntos 7 y 8); `categoriaUltimaCuota` (la categoría de la última cuota o abono a ese préstamo; si no hay, la de su programada de cuota activa) |
| `editar_transaccion` | Todo `DetalleTransaccionDto` (6.7.2), más las categorías y cuentas archivadas que ya usa la transacción (marcadas), más `capacidadDevolucion` si tiene devoluciones | `restriccionesTransaccion`, `capacidadDevolucion` |
| `cobrar` | `{ lineas: { lineaId; transaccionId; deudor; fechaOrigen; comercio; monto; abierto; medio: 'tarjeta' \| 'debito'; tarjeta?: Ref; propuestaAV22: boolean }[] }`: las líneas por cobrar con saldo abierto a `fecha ?? hoy`, filtradas por `lineaId` o `deudorId`. `propuestaAV22` = por cobrar con tarjeta (la asignación se ofrece si el cobro entra en efectivo) | `porCobrarAbiertos(fecha)` (§4.10) |
| `condonar` | `{ linea: { lineaId; deudor; abierto; medio; fechaOrigen }; categoriaPropuesta?: Ref }` | `porCobrar(linea)`; propuesta de 01 OP-32 |
| `devolver` | Sin `transaccionOriginalId`: `{ candidatas: { transaccionId; fecha; comercio; cuenta; total; restante }[] }` (hasta 20 gastos con `restante > 0`, filtrados por `busqueda` con las reglas de Actividad, 6.7.1). Con `transaccionOriginalId`: `{ compra: { transaccionId; fecha; comercio; cuenta; total; devuelto; restante }; lineas: { lineaId; destino; monto; devuelto; capacidad }[] }`, donde `capacidad` = monto − devuelto en una línea de categoría y el saldo abierto en una por cobrar | `capacidadDevolucion` (inv. 9 a 11) |
| `asignar` | `{ categoria: Ref; periodo; asignado; disponible; asignadoEsperado; meta?: { pedido; falta }; rapida: { faltaMeta?; igualPeriodoAnterior; promedioGasto?: { monto: Centavos; periodos: 1 \| 2 \| 3 }; cubrirSobregiro?: Centavos } }` (**[F6]** CF-25: `cubrirSobregiro` = Asig + máx(0, −Disp), solo si Disp < 0; variante "Cubrir el sobregiro" de 01 OP-16) (**[F6]** CF-17: promedio de los últimos 3 períodos cerrados en que existía c, o de los que haya; sin ninguno, no viene) | `categoria(c, p)`, `meta(c, p)`, `asignacionRapida(c, p)` (variantes de 01 OP-16, como valor de Asig resultante) |
| `archivar_categoria` | `{ categoria; disponible (Disp(c, A)); sobregiro; asignacionesFuturas: { periodo; monto }[]; programadasActivas: { programada: Ref; comercio; monto; montoHaciaCategoria; frecuencia }[]; meta?: Ref; asignadoEsperado }` | `impedimentosArchivo(c)`: Disp, asignaciones futuras y programadas activas con líneas hacia c (lo que pide OP-09) |
| `fusionar` | `{ origen: Ref; destinosValidos: Ref[] (normales, activas, ≠ origen); resumen: { periodosConAsignacion: number; transacciones: number; condonaciones: number; programadas: number; reglas: number; meta?: { tipo; monto } } }` | `resumenFusion(origen)`; el impacto por período lo da la previsualización (AV-13) |
| `cuenta` | Crear: `{ instituciones: Ref[]; nombresTarjetaUsados: { nombre; archivada }[]; modelosPrestamo: ['banco_agricola'] }`. Editar: además, todos los campos de la cuenta y de su subtipo con `esperado`, y `fechaAperturaMaxima` (la fecha de la primera transacción que no es saldo inicial) | Hechos; `nombresTarjetaUsados` sirve para avisar antes de enviar (BE-35) |
| `programada` | Crear: `{ prestamosConModelo: Uuid[] }` (QB-1). Editar: además, todos los campos con `esperado`, `calendarioEditable` y las próximas 5 ocurrencias | Hechos; [H] para `calendarioEditable` (6.12.1) |
| `movimiento` | El `MovimientoDto` de la bandeja (6.8) y, si `tipo_propuesto = 'devolucion'`, las `candidatas` de `devolver` filtradas por cuenta, monto y fechas cercanas | Bandeja + `capacidadDevolucion` |
| `formato` | `{ formato?: { id; institucion; nombre; tipoMovimiento; patron; banderas; montoSeparadorMiles; montoSeparadorDecimal; formatosFecha; activo; esperado }; instituciones: Ref[]; smsParaProbar: { smsId; texto; recibidoEn; estado }[] }` (los 20 SMS más recientes en `no_reconocido` o `error`) | [H] e [I] |
| `meta` | `{ meta?: … (6.10); categoriasSinMeta: Ref[] }` | `meta(c, p)` |

**[F6] `verificar_saldo` (CF-01).** Contexto:

```ts
{
  cuenta: Ref & { tipo: 'efectivo' | 'tarjeta' };
  fecha: FechaLocal;                                    // la pedida o hoy
  candidatas: { cantidad: number; recientes: TransaccionFila[] };   // pendientes o confirmadas con fecha ≤ fecha; hasta 200 más recientes
  ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; modo: 'estado_cuenta' | 'saldo'; diferenciaActual: Centavos };
}
```

#### 6.14.4.1 Enmiendas de la Fase 5 a `formulario` **[F5]**

- **CP-10a. Asignado en el catálogo.** Para `operacion: 'asignar'`, cada entrada de `catalogos.categorias` lleva además `asignado` (Asig(c, p)) y `disponible` del período pedido (`periodoInicio`, o A). Lo necesitan los `esperado` de OP-15 (`asignacionOrigen`, `asignacionDestino`) y de OP-11 (`asignacionDestino`).
- **CP-10b. Ocurrencia de una programada.** Con `fechaEsperada`, el contexto de `programada` agrega `ocurrencia: { fechaEsperada; estado: 'pendiente' | 'emparejada' | 'registrada' | 'omitida'; transaccionId?; monto; cuenta: Ref; lineas; desglosePropuesto? }` (el desglose solo en `cuota_prestamo`, con el selector `desglosePropuesto`). Lo necesita OP-43 de un toque con sus campos editables.
- **CP-10c. Reglas de comercio.** `operacion: 'regla'` → catálogo `categorias` y `contexto: { regla?: { id; patron; categoria: Ref; esperado } }` (6.14.5 asigna a OP-41 el catálogo `categorias`, que ninguna variante entregaba).
- **CP-16. Conciliar.** `operacion: 'conciliar'` → catálogos `cuentas`, `categorias`, `categoriasPago`, `deudores` y `comercios`, y:
  ```ts
  contexto: {
    cuenta: { cuenta: Ref; tipo: TipoCuenta; saldo: Centavos; saldoConfirmado: Centavos;
              ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; diferenciaActual: Centavos } };
    tiposAlta: { cargo: TipoTransaccion[]; abono: TipoTransaccion[] };   // tipos que admite un movimiento de esta cuenta según su signo
    origenPropuestoPago?: Ref;                                           // si la cuenta es tarjeta (BE-41)
    prestamos: { cuenta: Ref; tieneModelo: boolean; categoriaPropuesta?: Ref }[];
    porCobrarAbiertos: { lineaId: Uuid; transaccionId: Uuid; deudor: Ref; fechaOrigen: FechaLocal;
                         comercio: string | null; abierto: Centavos; medio: 'tarjeta' | 'debito' }[];
  }
  ```
  Lo que depende de cada movimiento del estado se resuelve sin otra consulta: el desglose de una cuota, con la previsualización de OP-46; las compras candidatas de una devolución, con la búsqueda de CP-3; la categoría sugerida, con `sugerencia` (CP-3) pedida una vez con la descripción del movimiento.

#### 6.14.5 Revisión de flujos de §3 sin datos

| Flujo | Datos que necesita | Dónde están |
|---|---|---|
| OP-04, OP-06 (archivar o eliminar cuenta) | Saldo, deuda, reserva, asignaciones futuras de pago(t), programadas, conciliaciones | `DetalleCuentaDto.acciones` (6.6) para habilitar; el impacto, en la previsualización (AV-15) |
| OP-09 (archivar categoría) | Disp, asignaciones futuras, programadas activas con sus montos | **Nuevo:** `formulario({ operacion: 'archivar_categoria' })` |
| OP-10, OP-11 (desarchivar, sacar Disponible) | Categorías archivadas con dinero, grupo | `PresupuestoDto.archivadasConDinero` (6.2), `estructura` (6.12.4) + catálogo `categorias` de `asignar` |
| OP-12 (fusionar) | Destinos válidos y resumen del origen | **Nuevo:** `formulario({ operacion: 'fusionar' })` |
| OP-13, OP-08, OP-07 | Árbol de grupos | `estructura` (6.12.4) |
| OP-14, OP-15, OP-16 | Asig, Disp de todas las categorías, LPA, valores de asignación rápida | **Nuevo:** `formulario({ operacion: 'asignar' })` |
| OP-17 (auto-asignar) | Faltas por meta | `PresupuestoDto` (6.2); el resultado, en la previsualización (AV-18) |
| OP-19 (ciclo) | Día vigente y vigencia futura | `AjustesDto.ciclo` (6.11); fechas, en la previsualización (AV-12) |
| OP-23 a OP-27, OP-31 a OP-33 | 6.14.4 | **Nuevo** |
| OP-30 | Estado actual | `TransaccionFila.estadoBancario` (6.7) |
| OP-34 (eliminar evento) | Eventos de cada línea | `DetalleTransaccionDto.lineas` (6.7.2) |
| OP-36, OP-37, OP-40, OP-49, OP-50 | Movimiento, catálogos, candidatas de devolución, `intentoVisto` | **Nuevo:** `formulario({ operacion: 'movimiento' })` + bandeja (6.8) |
| OP-38, OP-39 | Elegibles y descartados | Bandeja (6.8) |
| OP-41 | Reglas | `reglas` (6.12.2) + catálogo `categorias` |
| OP-42, OP-44, OP-51 | Programadas, préstamos con modelo | **Nuevo:** `formulario({ operacion: 'programada' })` + `programadas` (6.12.1) |
| OP-45, OP-46, OP-47 | Cuentas; la clasificación del estado | Catálogo `cuentas`; salida de OP-45 (3.8). OP-46 usa además el formulario `registrar` para completar el alta |
| OP-48 | Condiciones del préstamo | **Nuevo:** `formulario({ operacion: 'cuenta', cuentaId })` |
| OP-52 | Deudores | `porCobrar` (6.12.3) |
| OPT-01 a OPT-04, OPT-08, OPT-09 | Estado del token, suscripciones, notificaciones | `ajustes` (6.11), `notificaciones` (6.12.5) |
| OPT-05, OPT-06, OPT-07 | Formato completo, SMS para probar | **Nuevo:** `formulario({ operacion: 'formato' })` |

Con esto, cada operación de §3 tiene al menos una consulta que entrega los datos para invocarla.

---

# Parte C

## 8. Webhook de SMS

### 8.1 Contrato HTTP

| Elemento | Valor |
|---|---|
| Ruta | `POST /api/sms` (Route Handler, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `maxDuration = 30`) |
| Autenticación | Cabecera `Authorization: Bearer <token>` (ADR-08) |
| Cuerpo | Según la variante elegida (8.1.1, BE-61), máximo **16 KiB** (BE-59) |
| Esquema (variante A, JSON) | `Content-Type: application/json`; `{ "texto": string (1..2000), "remitente": string (texto limpio, 1..100) }`, ambos obligatorios. Campos extra: se ignoran. Sin compatibilidad con `{ "sms": "..." }` de la 1.0 |
| Esquema (variante B, texto) | [R4] `Content-Type: text/plain`; cuerpo = texto del SMS sin modificar (UTF-8, 1..2000 caracteres); remitente en la cabecera `X-Finn-Remitente` (texto limpio, 1..100) |
| Respuestas | 401 sin guardar; 413 si supera 16 KiB; 5xx si no se pudo guardar; **200** una vez guardado (N-01), **también con un cuerpo inválido** (BE-60) |
| Cuerpo de la respuesta 200 | `{ "recibido": true, "id": "<sms_recibidos.id>" }` |

**BE-59. Límite de 16 KiB y una sola cabecera de token.** El SMS más largo admitido (03: 2000 caracteres) cabe holgado; un cuerpo mayor no es un SMS. *Alternativa descartada:* el token en la URL (`?token=`); queda en los registros de Vercel y del proxy.

#### 8.1.1 Variantes del contrato y regla para elegir (BE-61) [R4]

| | Variante A — JSON | Variante B — texto |
|---|---|---|
| `Content-Type` | `application/json` | `text/plain` (con o sin `; charset=utf-8`) |
| Texto del SMS | Campo `texto` | El cuerpo completo, sin modificar |
| Remitente | Campo `remitente` | Cabecera `X-Finn-Remitente` |
| Depende de | Que MacroDroid escape comillas, barras invertidas y saltos de línea al sustituir la variable en el JSON | Nada: el cuerpo no tiene sintaxis que romper. El número o nombre del remitente no lleva saltos de línea |

**Regla para elegir.** Se decide una sola vez, en la prueba en el teléfono (8.8, paso de prueba 2): se configura la variante A y se envía un SMS de prueba con comillas dobles y un salto de línea.
- Si el SMS llega a la bandeja con el texto íntegro (`no_reconocido`, comillas y salto incluidos): **variante A**.
- Si llega como `error` con detalle `json_invalido` (BE-60): MacroDroid no escapa; se cambia la macro a la **variante B** y se repite la prueba, que debe dar `no_reconocido` con el texto íntegro.

**El endpoint acepta solo la elegida.** La variable `FINN_WEBHOOK_FORMATO` (`json` | `texto`, §14; por omisión `json`) fija la variante. Una petición con token válido en la otra variante (otro `Content-Type`) se trata como cuerpo inválido (BE-60, detalle `content_type`): se guarda, queda en `error` y se responde 200, así que un cambio a medias en la macro se ve en la bandeja y no se pierde ningún SMS.

**BE-61. Dos variantes documentadas, una activa.** *Justificación:* la variante A es el contrato aprobado y es la más simple si MacroDroid escapa; la B elimina el problema de raíz si no lo hace. Aceptar una sola evita dos caminos de lectura en producción y hace visible una macro mal configurada. *Alternativas descartadas:* aceptar ambas según el `Content-Type` (dos contratos vivos sin necesidad, y una macro desconfigurada pasaría sin aviso); reparar el JSON roto en el servidor (adivinar dónde terminan las comillas no es fiable); la variante B siempre (cambia el contrato aprobado sin evidencia de que haga falta).

### 8.2 Flujo de una petición (BE-44)

**[F7]** **CT-01 y CT-02.** `recibido_en` es `finn.ahora()` de la base (antes "`now()` de la base"); la transacción de guardado fija `finn.desfase_ms` cuando el reloj de prueba está permitido. Detalle en `07-pruebas.md` §4.4.

| Paso | Qué hace | Si falla |
|---|---|---|
| 1 | Lee el cuerpo como texto con límite de 16 KiB (si `Content-Length` lo supera o el flujo lo supera, corta) | 413, sin guardar. Solo puede ocurrir con un cliente que no es la macro |
| 2 | **Autentica:** SHA-256 del token recibido, comparado con `token_webhook.hash_sha256` con `timingSafeEqual` sobre los 32 bytes. El hash se lee en una transacción corta (BE-33) en cada petición: una rotación (OPT-01) rige de inmediato | 401, sin guardar nada (N-01 punto 1). Se registra un evento `aviso` en `eventos_sistema` sin datos de la petición |
| 3 | [R4] **Lee el cuerpo** según la variante activa (8.1.1): decodifica UTF-8 estricto y valida con Zod | Cuerpo inválido: **no responde 400**; prepara la fila con el cuerpo crudo (BE-60) y sigue al paso 4 |
| 4 | **Guarda** `sms_recibidos` (`texto`, `remitente`, `recibido_en` = `now()` de la base) en una transacción propia, sin bloqueo global (03 §5.1), con la zona en UTC (BE-33) | 503 con `Retry-After: 30`, sin escribir nada: MacroDroid reintenta (N-01 punto 2). Se registra un evento `error` |
| 5 | Responde **200** | — |
| 6 | Con `after()` de Next: procesa (8.4) y, si corresponde, notifica (AV-23, §11). Si el cuerpo fue inválido, no interpreta: va directo al paso d de 8.4 con `error_detalle = 'cuerpo_invalido: <detalle>'` | Ver 8.4 |
| 7 | [R4] Con el mismo `after()`, después del paso 6: procesa **hasta 5 SMS sin resultado** (8.6, BE-62) | Los que no alcance quedan para la próxima petición o la tarea diaria |

**BE-60. Cuerpo inválido con token válido: se guarda igual y se responde 200** [R4] (QC-1). Un 400 haría que MacroDroid no reintente y el SMS se perdería sin rastro. Con token válido el remitente es la macro, así que el contenido es un SMS real aunque llegue mal formado.

| Campo de `sms_recibidos` | Valor |
|---|---|
| `texto` | El cuerpo crudo decodificado como UTF-8 **no estricto** (bytes inválidos → U+FFFD), sin caracteres NUL (Postgres no los admite en `text`, `22021`), recortado a **2.000 puntos de código** (lo que cuenta `char_length` en 03 §3.17). Si queda vacío: `(cuerpo vacío)`, porque 03 exige al menos 1 carácter |
| `remitente` | `desconocido` |

Después, en `after()`, el paso d de 8.4 registra `sms_procesamientos` con `resultado = 'error'` y `error_detalle = 'cuerpo_invalido: <detalle>'` (`utf8_invalido`, `content_type`, `json_invalido` o `esquema`, sin contenido del cuerpo; 7.8) y crea el movimiento en `error` (N-02). El usuario lo ve en la bandeja y lo resuelve con OP-50 (crea la transacción a mano a partir del texto). OP-49 reprocesa el mismo texto guardado, así que solo sirve si algún patrón reconoce el SMS dentro del cuerpo crudo. Además se registra un evento `aviso` con `origen = 'webhook'` y `mensaje = 'cuerpo_invalido'`, con el detalle y sin el cuerpo (15.2).

Verificado (V-27, prototipo `webhook/cuerpo.ts`) contra las `CHECK` de 03 §3.17: JSON válido, JSON con comillas y salto de línea sin escapar, sin `remitente`, cuerpo vacío, 3.000 emojis, NUL, UTF-8 inválido, `Content-Type` de la otra variante y la variante B con y sin cabecera: los 12 casos se guardan y dan el resultado esperado. Controles: sin la limpieza, la base rechaza el NUL (`22021`), 2.001 caracteres y el texto vacío (`23514`).

*Alternativas descartadas:* responder 400 (pierde el SMS; ver QC-1); responder 200 sin guardar (igual de perdido y además silencioso); guardar el remitente que se pudiera rescatar del JSON roto (adivinar; `desconocido` es honesto y el texto crudo lo conserva).

**BE-44. El procesamiento va en `after()`, después de responder.** ADR-09 fija que el SMS guardado siempre responde 200; procesarlo antes de responder no cambia el código de respuesta y sí alarga la espera de la macro (y la probabilidad de que reintente por tiempo). Si la función se interrumpe después de responder, el SMS queda **sin resultado** y lo recupera la tarea diaria o la puesta al día (8.6), como prevé ADR-09. *Alternativa descartada:* procesar antes de responder (sin beneficio y con más reintentos espurios de la macro, que el autodescarte de H12 tendría que absorber).

### 8.3 `@finn/sms`: contrato del intérprete

Paquete puro (BE-01): sin E/S, sin reloj, sin `Date`. Recibe el texto y los formatos (datos de `formatos_bancarios`) y devuelve la interpretación.

```ts
// @finn/sms
export interface FormatoSms {
  id: Uuid; institucionId: Uuid; nombre: string;
  tipoMovimiento: 'compra' | 'deposito' | 'pago_tarjeta' | 'devolucion';
  patron: string; banderas: string;                         // 03 §3.21, §7.6
  montoSeparadorMiles: ',' | '.' | ''; montoSeparadorDecimal: '.' | ',';
  formatosFecha: ('AAAA/MM/DD' | 'AAAAMMDD' | 'AAAA-MM-DD' | 'DD/MM/AAAA')[];
  activo: boolean;
}
export interface CamposSms { ultimos4: string; monto: Centavos; comercio: string | null; fecha: FechaLocal | null }
export type Interpretacion =
  | { resultado: 'reconocido'; formato: FormatoSms; campos: CamposSms; coincidentes: Uuid[] }
  | { resultado: 'no_reconocido'; coincidentes: Uuid[]; motivo: 'ninguno' | 'varios' | 'demasiado_largo' };

export function interpretar(texto: string, formatos: readonly FormatoSms[]): Interpretacion;
export function probar(formato: FormatoSms, texto: string): { coincide: boolean; grupos?: Record<string, string>; campos?: CamposSms; fallo?: 'patron' | 'ultimos4' | 'monto' | 'fecha' };
export function validarFormato(formato: FormatoSms, opciones?: { timeoutMs?: number }): ValidacionFormato;   // 8.5
```

Reglas (03 §7.6, sin cambios):
- Solo se evalúan los formatos con `activo = true`.
- Un formato **coincide** si su patrón encuentra coincidencia **y** todos los normalizadores de los grupos presentes tienen éxito: `ultimos4` (`^\d{4}$`), `monto` (separadores del formato, `^\d+(\.\d{1,2})?$`, conversión por texto con `Centavos.desdeTexto`, > 0 y ≤ 21.474.836,47), `fecha` (formatos en orden; día existente) y `comercio` (recorte y espacios repetidos).
- Coincide uno solo → `reconocido`. Cero o más de uno → `no_reconocido` con los que coincidieron en `coincidentes` (P3-8).
- [R4] **Límite de 640 caracteres (PR-2, precisión de 03 §7.6; QC-2).** Si el texto tiene más de 640 caracteres, no se evalúa ningún patrón y el resultado es `no_reconocido` con `motivo = 'demasiado_largo'` y `coincidentes` vacío. El SMS se guarda completo (hasta 2.000, 03 §3.17); el límite es solo para interpretar. Ver 8.5.

**Pruebas con SMS sintéticos (V-23).** Con los tres patrones de 03 §9.5 copiados tal como quedan guardados:

| # | Caso | Resultado |
|---|---|---|
| S-01 | BAC con dos puntos y fecha `AAAA/MM/DD` | F-1, `123450`, `SUPER SELECTOS ESCALON`, `2026-10-12` |
| S-02 | BAC sin dos puntos, fecha `AAAAMMDD`, espacios repetidos en el comercio | F-1, `1230`, `PIZZA HUT STA ELENA`, `2026-10-12` |
| S-03 | Banco Agrícola | F-2, `4500` |
| S-04 | Cuscatlán | F-3, `799` |
| S-05, S-06, S-07 | Monto `12.`, `12.345` y `0.00` | `no_reconocido`: el normalizador rechaza; nunca un monto erróneo |
| S-08 | Fecha `2026/02/30` | `no_reconocido` |
| S-09 | Comercio con un texto de 8 dígitos (`TIENDA 20261001 CENTRO … 2026/10/12`) | F-1 con comercio `TIENDA` y **fecha `2026-10-01`** (incorrecta). Es el riesgo 2 y 4 que 03 §9.5 ya marcaba: se resuelve al reescribir los patrones con muestras reales (QC-3) |
| S-10 | Texto con `(1234)` antes del mensaje de BAC | Coinciden F-1 y F-2 → `no_reconocido` (`varios`), como pide P3-8 |
| S-11 | Mensaje sin movimiento (código de verificación) | `no_reconocido` |
| S-12 | Todo en minúsculas | F-1 (bandera `i`) |
| S-13 | Comercio `CAJA (5555)` | Solo F-1 |

Los textos de prueba son sintéticos, construidos para coincidir con los patrones; ⚠ no prueban que los patrones reconozcan los SMS reales de los bancos (P4-3).

### 8.4 Procesamiento (OP-35, pasos 2 a 11)

**[F6]** **CF-20.** El emparejamiento del paso c no propone ocurrencias del tramo inactivo de una programada reactivada (fecha < `reactivada_desde`).

| Paso | Dónde | Qué hace |
|---|---|---|
| a | `leer()` (sin bloqueo) | Lee el SMS y los formatos activos con su institución |
| b | En memoria, **fuera del bloqueo** (BE-45) | `interpretar(texto, formatos)` |
| c | `escribir()` (con bloqueo) | Pasos 2 a 11 de OP-35 de 01 sobre el estado actual: autodescarte (texto idéntico en **[t − 10 min, t)**, con t = `recibido_en`), identificación de la cuenta (institución del formato + `ultimos4`; archivada o inexistente → sin cuenta, CB-15), fecha (la del SMS o `fechaLocalDeInstante(recibido_en)`), tipo propuesto (`compra` → `gasto`, `deposito` → `ingreso`, `pago_tarjeta` → `pago_tarjeta`, `devolucion` → `devolucion`), emparejamiento y duplicados (§4.17, con la fecha del SMS), sugerencia de categoría (`sugerirCategoria`, 6.14.3). Escribe `sms_procesamientos` (intento siguiente), `movimientos` y `movimiento_lineas` (3.6, OP-35) |
| d | Si a, b o c fallan | `escribir()` aparte que registra el intento con `resultado = 'error'` y `error_detalle` saneado (7.8) y crea o deja el movimiento en `error` (N-02). Si tampoco obtiene el bloqueo, el SMS queda sin resultado (8.6) |
| e | Después del `COMMIT` | AV-23 con push según §11 (no en `autodescartado`) |

**BE-45. Interpretar fuera del bloqueo global.** Los patrones son expresiones regulares de JavaScript, que no se pueden interrumpir. Si se evaluaran con el bloqueo tomado, un patrón lento detendría todas las escrituras de la aplicación. La interpretación solo depende del texto y de los formatos, así que se hace antes; si un formato cambia entre a y c (raro), el resultado registrado es el de los formatos leídos en a, y el procesamiento guarda `formato_id` de ese momento (DM-7). *Alternativa descartada:* interpretar dentro de la transacción con bloqueo.

### 8.5 Política de patrones (BE-46)

**Hallazgo (V-24).** `recheck` 4.5 (analizador de retroceso de expresiones regulares para JavaScript; ADR-09 pedía "una librería de análisis") clasifica los **tres patrones de 03 §9.5 como vulnerables de grado polinomial 3**. Medido con la cadena de ataque que construye el analizador:

| Patrón | 161–261 caracteres | ~460 | ~860 | ~1.650 | 2.000 (máximo de 03) |
|---|---|---|---|---|---|
| F-1 | 2–5 ms | 34 ms | 246 ms | 2,1 s | **3,8 s** |
| F-2 | 2–4 ms | 29 ms | 250 ms | 1,8 s | **3,3 s** |
| F-3 | 1–3 ms | 23 ms | 177 ms | 0,35 s (1.016 car.) | — |

Un SMS normal de 2.000 caracteres se interpreta en microsegundos; el problema es un texto construido a propósito. La macro solo reenvía SMS de los remitentes bancarios configurados, así que el riesgo es bajo, pero no nulo (un remitente suplantado). La causa es el comercio `.+?` rodeado de `\s+`. Una reescritura ilustrativa de F-1 con espacios simples y `$` al final baja a grado 2; la reescritura real depende de las muestras (QC-3).

**Política al guardar un formato** (OPT-05, `validarFormato`):

| Verificación | Rechazo |
|---|---|
| Compila con `new RegExp(patron, banderas)` en Node 24 | `patron_invalido` |
| Banderas en `^i?m?s?u?$` (03) | `banderas_no_permitidas` |
| Grupos `ultimos4` y `monto` presentes; `fecha` presente ⇔ `formatos_fecha` no vacío (03 §3.21) | `grupos_obligatorios` |
| `recheck` (`checker: 'auto'`, `timeout: 10 s`): estado `safe`, o `vulnerable` **polinomial de grado ≤ 2** | `patron_lento` con el grado y la cadena de ataque; `unknown` (no terminó) también se rechaza |
| `probar` contra los SMS de ejemplo que el usuario indique | Informativo |

**Defensas adicionales:**
1. Interpretación fuera del bloqueo (BE-45).
2. [R4] Límite de 640 caracteres para interpretar (PR-2): con grado 2, 640 caracteres son ~0,4 millones de pasos; con grado 3 (los patrones actuales), ~120 ms en el peor caso medido.
3. [R4] **Reescritura de los patrones (QC-3).** F-1, F-2 y F-3 se reescriben en la Fase 8 con las muestras reales, en una **migración nueva** de datos (`AAAAMMDDHHMMSS_m_formatos_sms`, manual según DB-22, que hace `UPDATE` de `patron` en los tres formatos; 03 no se reabre). La CI ejecuta la misma política sobre los formatos que dejan las migraciones; hasta que esa migración exista, el resultado **bloquea solo el despliegue a producción** (trabajo `desplegar`), no la integración ni las pruebas: el trabajo `politica-patrones` de CI (§14.1) es requisito solo del job de despliegue de `main` (ADR-10). Hasta entonces, el límite de 640 caracteres acota el peor caso.

**Alternativas descartadas.** Solo rechazar grado exponencial (lo que decía ADR-09): deja pasar los grados 3 y mayores, que con 2.000 caracteres ya tardan segundos. Ejecutar la expresión en un `Worker` con tiempo límite: agrega un hilo por SMS y no es necesario si los patrones pasan la política.

### 8.6 SMS sin resultado y reproceso

**[F7]** **CT-02.** Las comparaciones `recibido_en < now() − 2 min` de esta sección usan `finn.ahora()`. Detalle en `07-pruebas.md` §4.4.

- **Sin resultado:** un `sms_recibidos` sin ninguna fila en `sms_procesamientos` y con `recibido_en < now() − 2 min` (el margen evita competir con un `after()` en curso).
- **Recuperación automática:** la tarea diaria y la puesta al día (§10) lo procesan con el paso 8.4, hasta 200 por ejecución, en orden de `recibido_en`. Es idempotente: `UNIQUE (sms_id, intento)` en `sms_procesamientos` y `UNIQUE` en `movimientos.sms_id`.
- [R4] **Barrido en cada petición del webhook (BE-62).** Después de procesar su propio SMS (paso 7 de 8.2), cada petición procesa también **hasta 5 SMS sin resultado** (`recibido_en < now() − 2 min`), en orden de `recibido_en`, uno por uno con el mismo paso 8.4. Si dos peticiones (o una petición y la tarea diaria) eligen el mismo SMS, el `escribir()` de 8.4 c vuelve a comprobar con el bloqueo tomado que siga sin resultado y, si ya lo tiene, lo omite; como respaldo, `UNIQUE (sms_id, intento)` y `UNIQUE (movimientos.sms_id)` rechazan el duplicado (`23505`, tratado como `ya_aplicada`, BE-17). No hay doble movimiento. El barrido se detiene si el tiempo transcurrido de la función supera 20 s (`maxDuration` = 30 s).
- **SMS con `error`:** no se reprocesan solos (N-02); el usuario usa OP-49 o crea la transacción a mano (OP-50).

**BE-62. Barrido de 5 en el webhook.** *Justificación:* con solo la tarea diaria, un SMS interrumpido podía esperar hasta un día (o hasta que el usuario abriera la aplicación) para aparecer en la bandeja; los SMS llegan durante el día, así que la siguiente petición lo rescata en minutos. 5 acota el trabajo extra por petición a unos segundos (cada uno es una lectura, una interpretación y un `escribir()`). *Alternativas descartadas:* un cron más frecuente (Hobby permite uno diario, ADR-11); procesar todos los pendientes (una petición podría acercarse al límite de 30 s después de una caída larga); no barrer (el supuesto de [R4] ajuste 1).

### 8.7 Gestión de formatos y auditoría (OPT-05, OPT-06, OPT-07; EN-1)

- **OPT-05** escribe `formatos_bancarios` con `escribir()` (tabla [H], con bloqueo) después de `validarFormato`. Los formatos nunca se eliminan; se desactivan (DB-17).
- **Auditoría (BE-47).** En la misma transacción, `definicion.extra()` (2.3.1) inserta en `eventos_sistema`:
  - `nivel = 'info'`, `origen = 'app'`, `mensaje = 'auditoria_formato <accion>'`;
  - `datos = { tipo: 'auditoria_formato', formatoId, accion: 'crear' | 'editar' | 'activar' | 'desactivar', sesion: <session_id del JWT>, antes: <fila completa o null>, despues: <fila completa> }`.
  - "Quién" es siempre el usuario único (FINN_USUARIO_ID, no se guarda); `sesion` identifica el dispositivo. "Cuándo" es `ocurrido_en`. No hay referencia a `auth` (ADR-22).
  - Si la escritura del formato se revierte, la auditoría también. La purga de 90 días excluye estas filas (EN-1).
- **OPT-06 Probar.** Lectura: `probar(formato, texto)` sobre el formato guardado o el que se está editando, contra un SMS elegido (`smsParaProbar`, 6.14.4). Muestra qué grupos capturó y qué normalizador falló. No escribe.
- **OPT-07 Instituciones.** Crear y renombrar; nombre único sin mayúsculas, verificado bajo el bloqueo (7.4).

### 8.8 Configuración de MacroDroid

⚠ Los nombres exactos de las variables de texto de MacroDroid se confirman en el selector de "texto mágico" de la app; la documentación en línea no se pudo consultar desde este entorno.

| Elemento | Configuración |
|---|---|
| Disparador | **SMS recibido**, filtrado por los remitentes de BAC, Banco Agrícola y Cuscatlán (los números o nombres que usa cada banco). Contenido: cualquiera |
| Acción | **HTTP Request** |
| Método | `POST` |
| URL | `https://<proyecto>.vercel.app/api/sms` |
| Cabeceras | Variante A: `Authorization: Bearer <token>`; `Content-Type: application/json`. Variante B [R4]: `Authorization: Bearer <token>`; `Content-Type: text/plain; charset=utf-8`; `X-Finn-Remitente: [sms_number]` |
| Cuerpo | Variante A: `{"texto":"[sms_message]","remitente":"[sms_number]"}`. Variante B: `[sms_message]` solo. ⚠ Usar las variables "cuerpo del SMS" y "número del remitente" del selector |
| Tiempo de espera | 30 s |
| Reintentos | Ver "Reintentos" abajo [R4] |

**Reintentos [R4] (ajuste 3).** En orden de preferencia:
1. Si la acción HTTP ofrece reintentar ante un código distinto de 2xx, activarlo (N-01 cuenta con él para el 5xx).
2. **Plan B en la macro**, si no lo ofrece: guardar el código de respuesta en una variable local (⚠ confirmar en el teléfono qué variable expone MacroDroid para el código de respuesta de la acción HTTP) y envolver la acción en un ciclo:

   ```
   intentos = 0
   repetir:
     HTTP Request (como arriba) → codigo
     si codigo = 200: terminar
     si intentos = 3: terminar          // 1 envío + 3 reintentos como máximo
     intentos = intentos + 1
     esperar 30 s
   ```

   Un reintento después de un 200 que no llegó al teléfono guarda un segundo `sms_recibidos` con el mismo texto; el autodescarte de 10 minutos (OP-35 paso 2) lo marca `autodescartado`, así que no hay duplicado en la bandeja. Un 401 no se reintenta en la práctica sin cambiar el token (los 3 reintentos darán 401); queda en el registro de MacroDroid.
3. Si tampoco es posible guardar el código: un 5xx pierde ese SMS. Queda como riesgo en §19 (RS-05), con la **conciliación** (§9) como recuperación.

**Prueba en el teléfono [R4].** Antes de dar por terminada la configuración:
1. "Probar acción" de MacroDroid, o un SMS de prueba desde otro teléfono con un remitente agregado temporalmente al filtro: debe aparecer en la bandeja como `no_reconocido`.
2. **Un SMS con comillas dobles y un salto de línea** (por ejemplo `Prueba "Finn"` + salto de línea + `segunda línea`): aplica la regla de 8.1.1 para elegir la variante.
3. Con la URL cambiada a una ruta inexistente (responde 404), verificar que la macro reintenta según el plan elegido y luego volver la URL a la correcta.
4. Quitar el remitente temporal del filtro.

**Token.** Se genera en Ajustes con OPT-01: el servidor crea 32 bytes aleatorios (`crypto.randomBytes`), los muestra **una sola vez** en base64url y guarda solo su SHA-256 en `token_webhook`. Rotarlo invalida el anterior al instante: los SMS que lleguen antes de actualizar la macro reciben 401 y no se guardan. Procedimiento: rotar y pegar el token nuevo en la macro de inmediato (RS-06 en §19).

---

## 9. Importación y conciliación por CSV

### 9.1 Flujo

```
Interfaz ── OP-45 (Server Action, archivo ≤ 2 MiB) ──► @finn/conciliacion: decodificar → detectar → extraer
                                                     ► @finn/dominio: clasificar (§4.17) sobre los hechos actuales
         ◄── clasificación + carga firmada (sin estado en el servidor, P4-14)
Interfaz ── OP-46 (por movimiento) con la carga firmada ──► verificar firma → reclasificar → alta (origen 'importada')
Interfaz ── OP-47 con la carga firmada y los pares marcados ──► verificar firma → reclasificar → conciliaciones + transacciones 'conciliada'
```

Nada se guarda entre pasos: ni el archivo ni la carga. Cada llamada reclasifica con los hechos del momento (BE-48).

### 9.2 Contrato de los adaptadores

```ts
// @finn/conciliacion — puro: recibe bytes, devuelve datos (BE-01)
export interface EstadoNormalizado {
  formato: IdFormatoCsv;                    // 'bac_tarjeta' | 'bac_debito' | 'ba_tarjeta_portal' | 'ba_tarjeta_pdf_csv' | 'ba_debito' | 'cuscatlan_tarjeta'
  fechaEstado: FechaLocal;                  // fecha de corte o del último movimiento, según el formato
  saldoFinal: Centavos;                     // con la convención de signos de la cuenta (01 §0.4): tarjeta negativa = deuda
  movimientos: {
    indice: number;                         // posición en el archivo; identifica el movimiento en OP-46 y OP-47
    fecha: FechaLocal;
    monto: Centavos;                        // con signo, como efecto en la cuenta: cargo negativo, abono positivo
    descripcion: string;                    // normalizada: recorte y espacios repetidos
    referencia?: string;                    // autorización o referencia, si el formato la trae
  }[];
}
export interface Adaptador {
  id: IdFormatoCsv;
  tipoCuenta: 'efectivo' | 'tarjeta';
  detectar(texto: string, filas: string[][]): boolean;      // firma de ADR-17
  extraer(filas: string[][]): EstadoNormalizado;           // lanza ErrorFormato con fila y motivo
}
export function leerEstado(bytes: Uint8Array): EstadoNormalizado | ErrorLectura;
// ErrorLectura: 'archivo_pdf' | 'formato_no_reconocido' | 'formato_ambiguo' | 'fila_invalida' (con fila)
```

| Formato (ADR-17) | Firma de detección | Tipo de cuenta | Extracción |
|---|---|---|---|
| `bac_tarjeta` | Contiene `Pro000000000000duct` o una sección que empieza con `Date,` | Tarjeta | ⚠ muestras |
| `bac_debito` | `Detalle de Estado Bancario` + `Saldo Inicial` | Efectivo | ⚠ muestras |
| `ba_tarjeta_portal` | Encabezado `Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)` | Tarjeta | ⚠ muestras |
| `ba_tarjeta_pdf_csv` | Líneas que empiezan con referencias `VT` | Tarjeta | ⚠ muestras |
| `ba_debito` | `Detalle de Estado Bancario` + `Referencia de Transacci` | Efectivo | ⚠ muestras |
| `cuscatlan_tarjeta` | `Historial de movimientos` | Tarjeta | ⚠ muestras |

- Detección de la más específica a la más general; si coinciden cero o más de uno: `formato_no_reconocido` o `formato_ambiguo` (ADR-17).
- El tipo de cuenta del formato debe coincidir con el de la cuenta elegida; si no, `cuenta_tipo_no_valido` (3.0.6).
- Archivo PDF (empieza con `%PDF-`): `archivo_pdf`.
- **Requisito previo (P4-3):** cada `extraer` se implementa en la Fase 8 con los archivos de muestra anonimizados; cada adaptador tiene pruebas con su muestra.

### 9.3 Decodificación (V-25)

1. Si los primeros bytes son `%PDF-`: `archivo_pdf`.
2. `new TextDecoder('utf-8', { fatal: true })` (quita el BOM si lo hay).
3. Si falla, `new TextDecoder('windows-1252')` (Node incluye ICU completo; ADR-17).
4. `Papa.parse(texto, { skipEmptyLines: 'greedy', delimiter: '' })` (detección automática del separador).

Verificado con PapaParse 5.7.0 sobre un mismo contenido con tildes, `Ñ` y un campo con coma entre comillas: UTF-8 sin BOM, UTF-8 con BOM y Windows-1252 producen las mismas celdas (`Descripción`, `PAGO, TARJETA ÑANDÚ`), sin errores; el ASCII puro se lee como UTF-8. Un archivo Windows-1252 cuyos bytes resulten ser UTF-8 válido (por ejemplo, `Ã³`) se lee como UTF-8; en un estado de cuenta en español esa secuencia no aparece de forma natural.

### 9.4 Normalización

- **Fechas:** `FechaLocal` con los formatos del adaptador (`DD/MM/AAAA` y los que traigan las muestras), validando que el día exista. Sin `Date`.
- **Montos:** `Centavos.desdeTexto(texto, { miles, decimal })` de `@finn/dominio/valores` (PR-1), sin flotantes. Columnas separadas de cargo y abono se combinan en un solo monto con signo; los paréntesis o el sufijo `CR` se interpretan según el formato (⚠ muestras).
- **Signo:** `monto` es el efecto en la cuenta (convención de 03 `efectos.monto`): en una tarjeta, una compra es negativa y un pago positivo; en una cuenta de efectivo, un débito es negativo.

### 9.5 Clasificación (BE-48)

`seleccionar.clasificarConciliacion(instantanea, cuentaId, estado)` en `@finn/dominio` (es §4.17 de 01, así que vive en el motor):
- Candidatas de Finn: las transacciones con efecto en la cuenta, no conciliadas, con fecha dentro de [primera fecha del estado − 3 días, `fechaEstado`].
- **Coincidencia** (supuesto 10): misma cuenta, mismo monto (el efecto en la cuenta), diferencia de fechas ≤ 3 días; relación 1 a 1, eligiendo la fecha más cercana y, si empatan, la clave de orden más antigua (y después `secuencia`).
- **Solo en el estado:** movimientos sin pareja. **Solo en Finn:** candidatas sin pareja.
- Además devuelve el **saldo de Finn a `fechaEstado`** (`saldo(cuenta, fechaEstado)`) y la diferencia propuesta (saldo final del estado − saldo de Finn), que será la diferencia aceptada si se termina sin cambios (OP-47).

**Reclasificación.** OP-46 y OP-47 vuelven a clasificar con los hechos del momento: si entre la subida y la confirmación cambió algo (otra transacción, una edición), el resultado lo refleja, y OP-47 rechaza los pares que ya no cumplen el criterio (`coincidencia_no_valida`). *Alternativa descartada:* confiar en la clasificación firmada; la firma garantiza el contenido del estado de cuenta, no el estado de Finn.

### 9.6 Carga firmada (BE-49, P4-14)

**Formato:** `<version>.<cuerpo>.<mac>`, las tres partes en base64url.

| Parte | Contenido |
|---|---|
| `version` | Identificador de la clave (`k1`, `k2`, …) |
| `cuerpo` | JSON canónico (claves ordenadas, sin espacios) de `{ v: version, cuentaId, vence: <instante en ms>, formato, fechaEstado, saldoFinal, movimientos }` — el `EstadoNormalizado` completo |
| `mac` | HMAC-SHA256 con la clave de esa versión sobre el texto `finn-conciliacion.<version>.<cuerpo>` |

- **Vencimiento:** `vence` = instante de OP-45 + 24 h (reloj del servidor; es un control técnico, no una fecha de negocio).
- **Verificación** (OP-46 y OP-47), en este orden: versión conocida (si no, `firma_no_valida`); `mac` con `timingSafeEqual`; `cuentaId` igual a la de la operación; `vence` ≥ ahora (si no, `firma_vencida`).
- **Claves:** variable `FINN_CONCILIACION_CLAVES` = `k2:<32 bytes en base64>,k1:<…>` y `FINN_CONCILIACION_CLAVE_ACTIVA` = `k2`. Se firma con la activa y se verifica con cualquiera de la lista.
- **Rotación:** agregar la versión nueva, marcarla activa y desplegar; retirar la anterior después de 24 h (ninguna carga firmada con ella sigue vigente).
- **Tamaño:** ~325 bytes con un movimiento; ~120 bytes por movimiento adicional (200 movimientos ≈ 25 KB). Viaja como campo de la Server Action, muy por debajo del límite (BE-06).

Verificado (V-26): firma válida → aceptada; otra cuenta → `firma_no_valida`; un monto alterado → `firma_no_valida`; 24 h + 1 ms → `firma_vencida`; carga firmada con `k1` después de activar `k2` → aceptada; versión retirada → rechazada.

*Alternativa descartada:* JWT con una librería; agrega una dependencia para un formato que se resuelve con `node:crypto`.

### 9.7 Hechos que produce

| Paso | Hechos |
|---|---|
| OP-45 | Ninguno |
| OP-46 | Una transacción por movimiento agregado, con `origen = 'importada'` y estado inicial `confirmada` (3.8) |
| OP-47 | `conciliaciones` (con `diferencia_aceptada`) y las transacciones marcadas pasan a `conciliada` con `conciliacion_id` (3.8) |

El archivo y su contenido no se guardan ni se registran (7.8): solo quedan los hechos que el usuario creó y el registro de conciliación.

---

## 10. Tareas programadas

### 10.1 Disparadores

**[F7]** **CT-02.** La ejecución en curso se detecta con `ocurrido_en > finn.ahora() − 5 min`. Detalle en `07-pruebas.md` §4.4.

| Disparador | Cómo | Autenticación | Qué ejecuta |
|---|---|---|---|
| **Vercel Cron** | `vercel.json`: `{ "path": "/api/tareas/diaria", "schedule": "5 6 * * *" }` (06:05 UTC = 00:05 en El Salvador). En Hobby se dispara una vez al día, en cualquier momento entre 06:05 y 06:59 UTC (verificado en la documentación de Vercel, 10.6) | `Authorization: Bearer <CRON_SECRET>`, que Vercel envía; comparación en tiempo constante | Todos los pasos de 10.2 |
| **Puesta al día** | El layout autenticado `(finn)` llama a `tareas.ponerAlDia()` dentro de `after()`, sin retrasar la página | Sesión AAL2 (lectura, 12.3) | Pasos 1 y 2 de 10.2 (ADR-11) y **[F6]** el aviso `cuota_proxima` del paso 4 (CF-24) |
| **Manual** | Botón "Ejecutar tareas ahora" en Ajustes > Diagnóstico | Sesión AAL2 (escritura) | Todos los pasos |

**Cuándo corre la puesta al día (BE-50, [R4] ajuste 2).** Con una lectura corta de `eventos_sistema` (`origen = 'tarea_diaria'`, `datos->>'hoy'` = hoy):
1. Si hay un evento de fin de hoy (`mensaje` `puesta_al_dia` o `diaria`): no corre.
2. Si hay un evento `puesta_al_dia_inicio` de hoy con `ocurrido_en > now() − 5 min` **y** sin evento de fin con su mismo `datos.ejecucion`: otra ejecución está en curso; no corre.
3. Si no: inserta `puesta_al_dia_inicio` con `datos = { hoy, ejecucion: <uuid aleatorio> }`, ejecuta los pasos 1 y 2 de 10.2 y al terminar registra el evento de fin (`puesta_al_dia`) con el mismo `ejecucion`.

Un inicio de más de 5 minutos sin fin se considera una ejecución interrumpida (los pasos 1 y 2 tienen tope de 200 elementos cada uno y una ejecución normal dura segundos), y la siguiente visita la vuelve a lanzar. La verificación y el registro del inicio no son atómicos: dos peticiones que llegan en el mismo instante todavía pueden ejecutarla dos veces, y sigue siendo **inocuo**, porque cada paso es idempotente (10.3). El evento de inicio solo evita el caso frecuente (varias pestañas o navegaciones seguidas). La purga de 90 días de `eventos_sistema` (paso 5) los elimina como al resto. La tarea diaria del cron no consulta este evento: corre siempre (es la autoridad del día).

*Alternativas descartadas:* un bloqueo asesor propio de tareas (complica sin necesidad, dado que la idempotencia ya lo resuelve; además, en el pooler en modo transacción un bloqueo de sesión no es fiable); no registrar nada y depender solo de la idempotencia (el supuesto anterior: con varias pestañas, la puesta al día corría varias veces por apertura).

### 10.2 Pasos de la tarea diaria, en orden

**[F7]** **CT-02.** `finn.purgar_eliminaciones()` (EN-2) compara con `finn.ahora() - interval '30 days'`. Detalle en `07-pruebas.md` §4.4.

| # | Paso | Detalle |
|---|---|---|
| 1 | **Registro automático (OP-43)** | Ocurrencias pendientes de programadas activas con `registro_automatico = true` y fecha esperada ≤ hoy, en orden cronológico; un `escribir()` por ocurrencia (RT-03). **No registra** las de períodos cerrados: quedan pendientes y se notifican una vez (motivo `ocurrencia_en_periodo_cerrado`, [R2] ajuste 2). Tampoco las cuotas sin modelo de cálculo (QB-1). Máximo 200 por ejecución; el resto, en la siguiente |
| 2 | **SMS sin resultado** | 8.6; máximo 200 por ejecución. [R4] Además, cada petición del webhook barre hasta 5 (BE-62), así que normalmente aquí quedan pocos |
| 3 | **Push de cierre (P4-2, BE-51)** | Si el período anterior al activo cerró y no tiene su push (clave `cierre:<inicio del período>`), envía uno con la reducción de LPA aplicada al cierre (Σ SobD(c, p) + Σ E(t, p), §4.6–§4.7) y las metas que vencieron en ese período (AV-17) |
| 4 | **Avisos de estado con push** | **[F6]** `pago_tarjeta_proximo` (CF-07: por tarjeta abierta, si su próxima fecha de pago fp cumple fp − hoy ≤ 3 y `paraNoGenerarIntereses` > 0; una vez por tarjeta y fp) y `cuota_proxima` (CF-24: por ocurrencia pendiente de una programada activa de tipo `cuota_prestamo` sin registro automático, con fecha ≥ `reactivada_desde` si existe y 0 ≤ fechaEsperada − hoy ≤ 3; una vez por programada y fecha); AV-17 (una vez por meta y fecha objetivo); respaldo con más de 36 h; restauración con más de 35 días (03 §7.5); deriva de catálogo informada por el respaldo (§16); disparadores de la carga incremental por egreso o latencia (5.6) |
| 5 | **Purgas** | `eliminaciones` de más de 30 días y `revision.revision_minima_incremental`, con `SELECT finn.purgar_eliminaciones()` (EN-2, [R4]); `eventos_sistema` de más de 90 días **salvo** `datos->>'tipo' = 'auditoria_formato'` (EN-1); `notificaciones` de más de 180 días (P4-11); `suscripciones_push` sin renovar en 60 días (BE-52) |
| 6 | **Métricas** | Egreso proyectado del mes y p95 diario de las cargas completas (5.6) |
| 7 | **Registro** | Un evento `info`, `origen = 'tarea_diaria'`, `mensaje = 'diaria'` (o `puesta_al_dia`), `datos = { hoy, pasos: { paso, resultado, cantidad, ms }[] }` |

Escrituras de cada paso: el paso 1 usa `escribir()` (hechos); los pasos 3 a 7 escriben tablas [T] en transacciones cortas sin bloqueo (03 §5.1), excepto la purga de `eliminaciones` y el cambio de `revision_minima_incremental`, que los hace la función `finn.purgar_eliminaciones()` (EN-2).

**Purga de `eliminaciones` (EN-2, [R4]; QC-4).** 03 da a `finn_app` solo `SELECT` sobre `eliminaciones` y `revision` (DB-11) y asigna la purga a la tarea diaria (03 §5.3, §13.4). La enmienda EN-2 agrega una función que hace ambas cosas con los privilegios de su dueña, sin ampliar los de `finn_app`:

```sql
-- migraciones/20261014000000_m_purgar_eliminaciones/migration.sql  (finn:manual)
CREATE FUNCTION finn.purgar_eliminaciones() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE v_max bigint; n integer;
BEGIN
  WITH borradas AS (
    DELETE FROM finn.eliminaciones WHERE eliminada_en < now() - interval '30 days' RETURNING revision)
  SELECT count(*), max(revision) INTO n, v_max FROM borradas;
  IF v_max IS NOT NULL THEN
    UPDATE finn.revision
       SET revision_minima_incremental = greatest(revision_minima_incremental, v_max + 1)
     WHERE id = 1;
  END IF;
  RETURN n;
END $$;
ALTER FUNCTION finn.purgar_eliminaciones() OWNER TO finn_migraciones;
REVOKE ALL ON FUNCTION finn.purgar_eliminaciones() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finn.purgar_eliminaciones() TO finn_app;
```

- **Plazo fijo de 30 días** dentro de la función, sin parámetro: `finn_app` no puede pedir una purga más agresiva.
- `revision_minima_incremental` = máxima revisión purgada + 1 y **nunca baja** (`greatest`): una carga incremental con una revisión anterior ya no puede ver todas las eliminaciones y hace carga completa (5.7).
- La tarea la llama en una transacción corta, sin el bloqueo global: no cambia hechos ni `revision.revision` (las filas de `eliminaciones` son [T] para el motor).
- **Regla de catálogo R14** (`reglas-catalogo.sql`, control C5): la función existe, sin argumentos, `SECURITY DEFINER`, `search_path = finn, pg_catalog`, dueña `finn_migraciones`, y `EXECUTE` solo para `finn_app` (y la dueña). Cualquier desviación da una fila.

Verificado (V-28, `t16.sh`): `finn_app` no puede `DELETE` en `eliminaciones` ni `UPDATE` en `revision` (`42501`); ejecutando la función borra solo las de más de 30 días (3 de 5), deja `revision_minima_incremental` en máx + 1, una segunda llamada devuelve 0, nunca baja el valor (fijado en 50, purga una revisión 3 → sigue en 50), un rol sin el permiso recibe `42501`, y R14 da 0 filas con la función correcta y detecta `EXECUTE` a `PUBLIC` y `SECURITY INVOKER`.

*Alternativas descartadas:* dar `DELETE` sobre `eliminaciones` y `UPDATE` sobre `revision` a `finn_app` (amplía el privilegio de la aplicación sobre tablas que el motor usa para la carga incremental); ejecutar la purga con `finn_migraciones` desde GitHub Actions (las credenciales de migración solo existen en el job de `main`, y mezclaría mantenimiento con despliegue); un parámetro de días (permitiría a la aplicación purgar de más).

**BE-51. Push de cierre: solo el último período cerrado.** Si la aplicación estuvo sin uso varios períodos, solo se notifica el más reciente; los anteriores se registran en `eventos_sistema` sin push. *Justificación:* un push por cada período atrasado no aporta nada que la pantalla de LPA no muestre. Deduplicación: la clave `cierre:<inicio>` se guarda en `notificaciones.datos.clave`; antes de enviar, se busca esa clave.

**BE-52. Suscripciones push sin renovar en 60 días.** La aplicación renueva la suscripción cada vez que se abre (ADR-12); una sin renovar en 60 días pertenece a un dispositivo que ya no se usa. *Alternativa descartada:* conservarlas hasta que el servicio responda 404 o 410 (solo pasa si se intenta enviar).

### 10.3 Idempotencia, fallos y días sin ejecución

| Paso | Idempotente porque | Si falla | Si no corre un día |
|---|---|---|---|
| 1 | `UNIQUE (programada_id, fecha_esperada)`; una ocurrencia resuelta no se vuelve a registrar (inv. 15) | Esa ocurrencia queda pendiente con notificación (AV-23); las demás siguen | La siguiente ejecución registra las pendientes con su **fecha esperada**; si alguna cayó en un período que ya cerró, queda pendiente con aviso (ajuste 2) |
| 2 | `UNIQUE` de `sms_procesamientos` y `movimientos` | Queda sin resultado | Los recupera la siguiente |
| 3 | Clave `cierre:<inicio>` | Evento `error`; se reintenta en la siguiente ejecución | Se envía en la siguiente (solo el último cerrado) |
| 4 | Clave por aviso (`av17:<meta>:<FO>`, `respaldo:<día>`, …) | Evento `error` | Se evalúa en la siguiente |
| 5 | Borrar lo que ya está borrado no cambia nada | Evento `error` | Borra más en la siguiente |
| 6, 7 | Solo lectura y un registro | Evento `error` | — |

- Un paso que falla no detiene los demás. Al terminar, si algún paso falló, se envía un push "La tarea diaria tuvo un error; revisá Diagnóstico" (una vez por día).
- Duración máxima: 300 s (Vercel Hobby). Los límites de 200 elementos por paso mantienen la ejecución muy por debajo.
- Las fechas que usa la tarea son siempre `finn.hoy()` dentro de cada transacción (P4-9). Si el cron corre cerca de la medianoche, cada paso usa el día de su propia transacción.

### 10.4 Lo que la tarea no hace

- **No cierra períodos:** el cierre es derivado (P7, ADR-11, P4-2).
- **No respalda:** el respaldo y la prueba de restauración corren en GitHub Actions (§16).
- **No reintenta SMS con `error`** (N-02).

### 10.5 Archivo de configuración

```json
// apps/web/vercel.json
{
  "regions": ["iad1"],
  "crons": [{ "path": "/api/tareas/diaria", "schedule": "5 6 * * *" }],
  "functions": {
    "src/app/api/tareas/diaria/route.ts": { "maxDuration": 300 },
    "src/app/api/sms/route.ts": { "maxDuration": 30 }
  }
}
```

### 10.6 Fuente verificada

Vercel, *Usage & Pricing for Cron Jobs* (actualizada el 15 de julio de 2026): en Hobby, 100 cron jobs por proyecto, intervalo mínimo de una vez al día y precisión por hora (±59 min); una expresión más frecuente falla al desplegar.

---

## 11. Notificaciones push

### 11.1 Componentes

| Pieza | Detalle |
|---|---|
| Claves VAPID | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` del usuario). Se generan una vez con `web-push generate-vapid-keys` |
| Envío | Librería `web-push` en `@finn/aplicacion/push`, siempre después del `COMMIT` (4.9) |
| Suscripción | **[F5] (CP-5)** El permiso **solo se pide tras un gesto del usuario**, desde la tarjeta "Activar notificaciones" (visible mientras el permiso no esté concedido ni denegado, y descartable) o desde Ajustes > Notificaciones; después, el cliente llama a OPT-02 con `endpoint`, `p256dh`, `auth` y el agente. Si el permiso ya está concedido, al abrir la app con sesión AAL2 el cliente renueva la suscripción con OPT-02 sin preguntar. Si está denegado, Ajustes explica cómo habilitarlo en el navegador. OPT-02 inserta o actualiza `renovada_en` |
| Registro | Toda notificación se guarda en `notificaciones` **antes** de intentar el push (ADR-12: el registro es la fuente de verdad); después se actualiza `push_enviada_en` o `push_error` |
| **[F6]** Catálogo de motivos (CF-16) | Constante exportada `MOTIVOS` de `@finn/aplicacion/push/motivos.ts`: un registro por motivo con su aviso (o `null`), push, urgencia, TTL y etiqueta. 11.2 se escribe desde ella y la prueba de catálogo de 14.1 la recorre. `MotivoNotificacion` es una unión cerrada |
| Service worker | `push` muestra la notificación; `notificationclick` abre la pantalla de `datos.destino` o ejecuta la acción (11.5). **[F5]** Se sirve en `/serwist/sw.js` (2.2.1, CP-17); el destino es `DestinoNotificacion` (11.4, CP-1) |

### 11.2 Política (P4-11, P4-2, [R2]; BE-53)

| Motivo (`notificaciones.motivo`) | Aviso | Push | Urgencia | TTL | Agrupación (`topic` y `tag`) | Acciones |
|---|---|---|---|---|---|---|
| `sms_nuevo` (pendiente) | AV-23 | Sí | `high` | 24 h | `sms` (11.3) | — |
| `sms_coincidencia` | AV-23 | Sí | `high` | 24 h | `sms` | Confirmar, Rechazar |
| `sms_posible_duplicado` | AV-23 | Sí | `high` | 24 h | `sms` | — |
| `sms_no_reconocido` | AV-23 | Sí | `normal` | 24 h | `sms` | — |
| `sms_error` | AV-23 | Sí | `normal` | 24 h | `sms` | — |
| `registro_automatico` | AV-23 | Sí | `normal` | 24 h | `programadas` | — |
| `registro_automatico_fallido` | AV-23 | Sí | `normal` | 3 días | `programadas` | — |
| `ocurrencia_en_periodo_cerrado` | AV-23 | Sí | `normal` | 7 días | — | — |
| `cierre_periodo` | — (P4-2) | Sí | `normal` | 7 días | `cierre` | — |
| `meta_vencida` | AV-17 | Sí | `low` | 7 días | — | — |
| `pago_tarjeta_proximo` **[F6]** CF-07 | — | Sí | `normal` | Hasta la fecha de pago | `tarjetas` | — |
| `cuota_proxima` **[F6]** CF-24 | — | Sí | `normal` | Hasta el final de la fecha esperada | `programadas` | — |
| `respaldo_atrasado`, `restauracion_atrasada`, `deriva_catalogo`, `tarea_fallida`, `carga_incremental` | — | Sí | `normal` | 3 días | `sistema` | — |
| `cambio_retroactivo` | AV-01 | **No** (BE-38) | — | — | — | — |
| Avisos que provoca el propio usuario (AV-14, AV-21, etc.) | — | No (P4-11) | — | — | — | — |
| `autodescartado` | — | No | — | — | — | — |

- Sin horario de silencio (P4-11).
- **[F6] CF-16.** Un motivo con "—" en la columna Aviso se registra con `notificaciones.aviso = null` (03, enmienda CF-16).
- `topic` (Web Push) hace que el servicio reemplace una notificación pendiente del mismo tema; `tag` hace que el dispositivo reemplace la que muestra.

### 11.3 Agrupación de SMS

Antes de enviar un push de motivo `sms_*`, se cuentan las notificaciones `sms_*` creadas en los últimos 5 minutos. Si son **más de 3**, el push lleva el texto agregado "Tenés N movimientos nuevos en la bandeja" con `topic = 'sms'` y `tag = 'sms'`, y reemplaza los anteriores. El registro en `notificaciones` sigue siendo uno por SMS.

### 11.4 Contenido

- Mínimo (ADR-12): tipo de aviso, comercio y monto (`$1,234.50`, 7.10). Nunca el texto del SMS, saldos ni nombres de deudores.
- **[F6] Qué monto puede llevar (FD-31).** Puede ir el importe de un **movimiento** (una transacción, un SMS, una ocurrencia programada) o de un **cambio que ya ocurrió** (la reducción de Listo para asignar aplicada al cierre, del ejemplo de abajo). No puede ir una cifra del **estado vigente** de una cuenta, una tarjeta o el presupuesto: saldos, deuda, Disponible, Listo para asignar, "te falta reservar", monto para no generar intereses. Por eso `cierre_periodo` y `cuota_proxima` llevan monto y `pago_tarjeta_proximo` no.
- **[F6] Textos nuevos.** `pago_tarjeta_proximo` (CF-07): "{tarjeta}: tu fecha de pago es el {fp}. Revisá cuánto pagar para no generar intereses." `cuota_proxima` (CF-24): "Cuota de {comercio} por {monto} el {fecha}. Registrala cuando la pagues." Los montos negativos llevan U+2212 (CF-15).
- Voseo (7.10). Ejemplos: "Compra en SUPER SELECTOS por $45.00. Revisala en la bandeja." / "Cerró el período del 21/09 al 20/10. Listo para asignar bajó $50.00 por sobregiros. Una meta venció."
- Carga útil ≤ 2 KB (el límite del protocolo es 4 KB).

**[F5] Destino y carga útil (CP-1, CP-18).** `notificaciones.datos.destino` es un tipo cerrado, que viaja también en la carga útil del push (sin montos ni nombres más allá de 11.4):

```ts
// @finn/aplicacion/contratos/notificaciones.ts (importable por el cliente y el service worker)
type DestinoNotificacion =
  | { pantalla: 'inicio' }
  | { pantalla: 'bandeja' }
  | { pantalla: 'movimiento'; movimientoId: Uuid }
  | { pantalla: 'transaccion'; transaccionId: Uuid }
  | { pantalla: 'programada'; programadaId: Uuid; fechaEsperada?: FechaLocal }
  | { pantalla: 'presupuesto'; periodoInicio: FechaLocal }
  | { pantalla: 'categoria'; categoriaId: Uuid; periodoInicio?: FechaLocal }
  | { pantalla: 'diagnostico' }
  | { pantalla: 'cuenta'; cuentaId: Uuid };                // [F6] CF-07
interface CargaPush {
  notificacionId: Uuid; titulo: string; cuerpo: string;
  etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema' | 'tarjetas';   // CP-18: el tag de 11.2 y 11.3; [F6] 'tarjetas' (CF-07)
  destino?: DestinoNotificacion; acciones?: ('confirmar' | 'rechazar')[];
}
```

| Motivo (11.2) | Destino |
|---|---|
| `sms_nuevo`, `sms_coincidencia`, `sms_posible_duplicado`, `sms_no_reconocido`, `sms_error` | `movimiento` |
| Push agrupado de 11.3 | `bandeja` (el registro sigue siendo uno por SMS, con `movimiento`) |
| `registro_automatico` | `transaccion` |
| `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado`, **[F6]** `cuota_proxima` (CF-24) | `programada` con `fechaEsperada` |
| **[F6]** `pago_tarjeta_proximo` (CF-07) | `cuenta` (la tarjeta) |
| `cierre_periodo` | `presupuesto` con el inicio del período que cerró |
| `meta_vencida` | `categoria` |
| `respaldo_atrasado`, `restauracion_atrasada`, `deriva_catalogo`, `tarea_fallida`, `carga_incremental` | `diagnostico` |
| `cambio_retroactivo` (sin push) | `inicio` |
| Sin destino o un destino que no valida | El centro de notificaciones |

- El backend fija `datos.destino` al registrar la notificación; el service worker y el centro lo validan con el mismo contrato antes de abrirlo. La traducción a rutas es de la interfaz (05 §3.5).
- El `movimientoId` que necesitan las acciones de 11.5 sale de `destino` (`pantalla: 'movimiento'`).

### 11.5 Acciones desde la notificación (BE-54)

- Solo en `sms_coincidencia`: **Confirmar** y **Rechazar** (OP-40).
- El service worker hace `fetch('POST /api/notificaciones/accion', { credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Finn-Accion': '1' }, body: { notificacionId, movimientoId, decision } })`.
- El Route Handler exige: `Origin` igual al de la app, la cabecera `X-Finn-Accion` (una petición entre sitios no puede agregarla sin preflight) y sesión AAL2 con `getUser()` (12.3). Ejecuta OP-40, que es idempotente (natural).
- Respuestas: 200 → el service worker muestra "Listo" brevemente; 401 → abre la app en la bandeja (P4-11); 409 o 422 (el movimiento cambió) → abre la app en ese movimiento.

### 11.6 Errores del envío

| Respuesta del servicio de push | Acción |
|---|---|
| 201 | `push_enviada_en` |
| 404, 410 | Elimina la suscripción (OPT-03); `push_error` |
| 413 | `push_error` y evento `error` (carga útil demasiado grande: un error de programación) |
| 429, 5xx, error de red | `push_error`; sin reintento. La notificación queda en el centro de notificaciones |

---

## 12. Autenticación y sesión

### 12.1 Configuración de Supabase Auth

- Registro de usuarios nuevos **deshabilitado**; la cuenta única se crea a mano (ADR-08).
- Proveedor email y contraseña; contraseña generada por un gestor.
- MFA con TOTP habilitado (inscripción y verificación).
- Claves de firma JWT **asimétricas** (necesarias para 12.3; se verifican en la prueba de humo, H-10).
- `FINN_USUARIO_ID`: el `sub` de la cuenta única, en la configuración del despliegue (no en la base, ADR-22).

### 12.2 Flujos

| Flujo | Pasos | Nivel resultante |
|---|---|---|
| **Ingresar** | `/ingresar`: email y contraseña (`signInWithPassword`) → si hay un factor verificado: `/ingresar/verificar` con `mfa.challenge` + `mfa.verify` | AAL2 |
| **Primera inscripción** (P4-12) | Con AAL1 y **cero** factores verificados: `/ingresar/inscribir` → `mfa.enroll({ factorType: 'totp' })` → QR y secreto → `mfa.challenge` + `mfa.verify` | AAL2 |
| **Segundo factor** (respaldo) | Ajustes > Seguridad, con AAL2: mismo flujo de inscripción | AAL2 |
| **Quitar un factor** | Ajustes > Seguridad, con AAL2 y al menos otro factor verificado: `mfa.unenroll` | AAL2 |
| **Salir** | `signOut({ scope: 'local' })` | — |

- La página de inscripción se niega si ya existe un factor verificado (se comprueba con `mfa.listFactors()` en el servidor).
- La sesión es larga y se renueva sola; el TOTP se pide al ingresar en un dispositivo nuevo o si la sesión se cierra (ADR-08).

**[F5] Funciones que llama la interfaz (CP-4, CP-11)**, en `@finn/aplicacion/autenticacion`. Leen Supabase Auth con el cliente de servidor (cookies); no son consultas de §6:

```ts
// Sin exigir AAL2: la usan las rutas de ingresar.
function estadoAcceso(): Promise<{
  sesion: 'ninguna' | 'aal1' | 'aal2';
  usuarioPermitido: boolean;                       // sub = FINN_USUARIO_ID
  factoresVerificados: { id: string; nombre: string | null }[];
}>;
// exigirSesionLectura(); mfa.listFactors() y mfa.getAuthenticatorAssuranceLevel()
function estadoSeguridad(): Promise<{
  aal: 'aal1' | 'aal2';
  factores: { id: string; nombre: string | null; creadoEn: Instante; estado: 'verificado' | 'sin_verificar' }[];
}>;
// Todas devuelven ResultadoAccion (7.1).
function ingresar(e: { email: string; contrasena: string }): Promise<ResultadoAccion<{ siguiente: 'verificar' | 'inscribir' | 'listo' }>>;
function verificarFactor(e: { factorId?: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function iniciarInscripcion(e: { nombre?: string }): Promise<ResultadoAccion<{ factorId: string; qrSvg: string; secreto: string; uri: string }>>;
function completarInscripcion(e: { factorId: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function quitarFactor(e: { factorId: string }): Promise<ResultadoAccion<{}>>;
function cerrarOtrasSesiones(): Promise<ResultadoAccion<{}>>;
function salir(): Promise<ResultadoAccion<{}>>;
```

- `ingresar` no exige sesión; `verificarFactor`, `iniciarInscripcion` y `completarInscripcion` del primer factor exigen AAL1 del usuario permitido; el resto, `exigirSesionEscritura()` (12.3).
- `iniciarInscripcion` quita antes los factores sin verificar de intentos anteriores (`mfa.unenroll`). Códigos propios: `credenciales_invalidas`, `demasiados_intentos`, `codigo_incorrecto`, `codigo_vencido`, `inscripcion_no_permitida`, `factor_unico` (mensajes en 05 §9.7). Sin idempotencia por id: no crean hechos de Finn.

### 12.3 Verificación en el servidor (BE-55)

Evaluación pedida en la revisión de la Parte A:

| | `getClaims()` | `getUser()` |
|---|---|---|
| Qué verifica | Firma y vigencia del JWT, **localmente** con las claves públicas del proyecto (JWKS en caché; Supabase documenta hasta 10 min en el borde y 10 min más en el cliente) | Envía el token al servidor de Auth en cada llamada |
| Latencia | Sin red con la caché caliente | Una petición a Supabase (misma región que la función, `iad1`/`us-east-1`) |
| Sesión cerrada o revocada | **No la detecta** hasta que el JWT vence (la documentación no indica lo contrario) | La detecta |
| Con claves simétricas | Hace la petición de red, como `getUser` | — |

**Decisión.** Dos funciones en `@finn/aplicacion/autenticacion`:
- **`exigirSesionLectura()`** — Server Components y consultas: `getClaims()`; exige `aal = 'aal2'`, `sub = FINN_USUARIO_ID` y que no haya vencido.
- **`exigirSesionEscritura()`** — toda Server Action que escribe, acciones desde notificaciones, exportación, OPT-01 (token), formatos (OPT-05), MFA y cierre de sesión de otros dispositivos: `getUser()` (revocación) **y** las mismas verificaciones de `aal` y `sub` sobre las *claims*.

*Justificación:* con un solo usuario, el riesgo de una sesión revocada que sigue leyendo durante el resto de la vida del JWT es bajo (no puede escribir), y las lecturas son la mayoría de las peticiones. *Alternativa descartada:* `getUser()` en todo (una petición de red extra por página). El vencimiento del JWT se deja en el valor por defecto del proyecto; la prueba de humo lo registra.

`accion()` (2.2.2) llama a `exigirSesionEscritura()`; las consultas (6.0.1), a `exigirSesionLectura()`. Si falla: `NO_AUTORIZADO` (7.2); si el nivel es AAL1 con factores, redirige a `/ingresar/verificar`.

### 12.4 `proxy.ts`

- Refresca las cookies de sesión de `@supabase/ssr` en cada navegación (`getClaims()` dentro de `createServerClient` con el adaptador de cookies), como recomienda Supabase para Next.
- Redirige a `/ingresar` sin sesión y a `/ingresar/verificar` con AAL1 (comprobación optimista, 2.2.5).
- `matcher`: todo salvo `_next/static`, `_next/image`, íconos, `manifest.webmanifest`, el service worker y `/api/sms`, `/api/tareas/*`, `/api/respaldo/*` (estas tienen su propio secreto). **[F5]** El service worker está en `/serwist/` (CP-17); se excluye también `/sin-conexion`.
- **[F5] (CP-14)** Agrega a cada petición la cabecera `x-finn-ruta` con la ruta y la búsqueda originales, para que la interfaz arme `?volver=` al pedir la sesión. La cabecera se reemplaza siempre; nunca se toma de la petición entrante.
- **[F5] (CP-14)** No redirige las rutas de `/ingresar`: su lógica está en las propias páginas (`estadoAcceso()`, 12.2).
- Corre en Node.js (Next 16).

### 12.5 Clientes que no son personas

| Cliente | Ruta | Secreto | Comparación |
|---|---|---|---|
| MacroDroid | `/api/sms` | Token del webhook; en la base solo su SHA-256 (`token_webhook`) | `timingSafeEqual` sobre los hashes (8.2) |
| Vercel Cron | `/api/tareas/diaria` | `CRON_SECRET` (Vercel lo envía como `Bearer`) | `timingSafeEqual` sobre SHA-256 de ambos lados (iguala longitudes) |
| GitHub Actions (respaldo) | `/api/respaldo/{respaldo,restauracion,deriva}` | `RESPALDO_SECRET` | Ídem |

Cada 401 se registra como evento `aviso` sin datos de la petición; Ajustes > Diagnóstico los muestra.

### 12.6 Recuperación si se pierden los dos factores (BE-56, P4-12)

Procedimiento manual, fuera de la app, con la clave `service_role` (que nunca se guarda en Vercel, GitHub ni el repositorio):

1. En el panel de Supabase, copiar la clave `service_role` del proyecto (Settings > API).
2. En la computadora del usuario, ejecutar `tools/recuperacion/borrar-factores.mjs` con `SUPABASE_URL`, la clave y `FINN_USUARIO_ID` como variables de entorno de esa sola ejecución. El script llama a `auth.admin.mfa.listFactors({ userId })` y a `auth.admin.mfa.deleteFactor({ id, userId })` por cada factor. Supabase documenta que borrar un factor verificado cierra todas las sesiones del usuario.
3. Ingresar con email y contraseña (AAL1, cero factores) → la app lleva a `/ingresar/inscribir` → inscribir un factor nuevo y, después, el de respaldo.
4. Si además se perdió la contraseña: "Send password recovery" para el usuario desde el panel de Supabase (Authentication > Users).
5. Rotar la clave `service_role` si se copió a un lugar inseguro.
6. Registrar en Diagnóstico (evento manual) que se hizo la recuperación.

⚠ La prueba de humo (H-10) ejecuta el script contra un usuario de prueba antes de deshabilitar el registro, para confirmar el procedimiento. Riesgo aceptado: entre los pasos 2 y 3, alguien con la contraseña podría inscribir su propio factor; la ventana dura minutos y exige la contraseña.

---

## 14. Configuración

### 14.1 Entornos (P4-1)

**[F7]** **CT-01.** Variables nuevas solo en CI y en local: `FINN_ENTORNO=pruebas` y `FINN_RELOJ_ARCHIVO`. **Ninguna** de las dos, ni `FINN_HOY_SIMULADO`, existe en ningún entorno de Vercel: el job `desplegar` lo comprueba con `vercel env ls` antes de `vercel deploy --prod` (PRU-SEG-RELOJ-006, barrera 1b). Detalle en `07-pruebas.md` §4.3.

**[F6]** **Prueba de catálogo (CF-16; 06 §3.13.2).** El job de integración de CI corre, contra la base con todas las migraciones aplicadas, una prueba generada desde los catálogos del código: una notificación por cada registro de `MOTIVOS` (con su aviso, título, cuerpo y un destino válido), los pares `origen`/`nivel` del catálogo de eventos (15.2) y los dos valores de `conciliaciones.modo`; inserta como `finn_app` en una transacción que se revierte y espera cero errores. Control negativo: un aviso mal formado y un origen inexistente se rechazan.

| Entorno | Base de datos | Aplicación | Reloj | Quién lo usa |
|---|---|---|---|---|
| **Local** | Postgres en Docker o la pila local de Supabase (Supabase CLI), con bootstrap y migraciones; `finn.reloj_simulado = on` opcional | `pnpm dev` | Real, o `FINN_HOY_SIMULADO` | Desarrollo y agentes |
| **CI** | Postgres efímero (Testcontainers) de la versión mayor del proyecto (§17, H-01), con `finn.reloj_simulado = on` | Pruebas, `next build` y E2E contra la pila local de Supabase | Simulado en escenarios | GitHub Actions |
| **Producción** | Proyecto de Supabase (plan gratuito, `us-east-1`) | Vercel Hobby, región `iad1` | Real | El usuario |

**No hay entorno de vista previa (preview).**
- Solo existe una base en la nube: el plan gratuito permite dos proyectos y la 1.0 ocupa el otro (ADR-04). Una vista previa apuntaría a los datos reales con código sin revisar.
- Una vista previa sin base solo serviría para mirar pantallas sin datos; la revisión visual se hace en local y en la E2E de CI.
- Configuración: el proyecto de Vercel **no** se conecta a GitHub con la integración automática; los despliegues los hace el job de `main` con `vercel deploy --prod` (ADR-10). Así no se crean despliegues de vista previa por cada rama.
- **[F7]** **CT-09.** Única excepción: el **despliegue de emergencia** desde la PC del usuario con `vercel deploy --prod` (PRU-MAN-OPER-002), solo si `desplegar` no puede correr (minutos de Actions agotados o Actions caído) y hay un error de dinero o de seguridad que `vercel rollback` no resuelve. Exige en local los mismos scripts de `rapido`, `integracion` y `politica-patrones` (`pnpm ci:<job>`), la barrera 1b y ninguna migración nueva; usa un token de Vercel limitado al proyecto y de vencimiento corto, revocado al terminar, nunca `vercel login`. Detalle en `07-pruebas.md` §31.5.
- [R4] **Trabajo `politica-patrones` (QC-3).** Aplica las migraciones en el Postgres de CI y ejecuta `validarFormato` (8.5) sobre todos los formatos activos que quedan. Corre en cada PR (informativo) y es **requisito solo del job de despliegue** de `main`: mientras F-1, F-2 y F-3 no se reescriban con las muestras reales (Fase 8, migración nueva), no hay despliegue a producción, pero sí integración y pruebas.

### 14.2 Variables de entorno

Todas se validan con Zod al arrancar (`@finn/aplicacion/config`, BE-08); si falta una o tiene un formato inválido, la aplicación no arranca y lo dice en la consola.

**Aplicación (Vercel, entorno Production; `.env.local` en desarrollo)**

| Variable | Contenido | Secreta |
|---|---|---|
| `DATABASE_URL` | `postgresql://finn_app.<ref>:<clave>@<pooler>:6543/postgres?sslmode=require&pgbouncer=true` (ADR-05) | Sí |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon o publishable) para Auth | No (es pública por diseño; la Data API está desactivada, ADR-04) |
| `FINN_USUARIO_ID` | `sub` del usuario único | No |
| `CRON_SECRET` | ≥ 32 bytes aleatorios | Sí |
| `RESPALDO_SECRET` | ≥ 32 bytes aleatorios | Sí |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Claves de Web Push | La privada |
| `FINN_CONCILIACION_CLAVES`, `FINN_CONCILIACION_CLAVE_ACTIVA` | 9.6 | Sí |
| `FINN_CARGA_INCREMENTAL` | `off` (por defecto) u `on` (5.7) | No |
| `FINN_WEBHOOK_FORMATO` | [R4] `json` (por defecto, variante A) o `texto` (variante B); la que se eligió en la prueba del teléfono (8.1.1, BE-61) | No |
| `FINN_HOY_SIMULADO` | **Prohibida en producción**: si existe con `VERCEL_ENV = production`, la app no arranca (13.1.4) | — |

`DIRECT_URL` no se configura en Vercel: la aplicación nunca migra.

**CI y respaldo (secretos de GitHub Actions)**

| Secreto | Uso |
|---|---|
| `DIRECT_URL` | `finn_migraciones` por el pooler en modo sesión (5432): `prisma migrate deploy` (ADR-10) |
| `RESPALDO_DB_URL` | `finn_respaldo` por el pooler en modo sesión (5432): respaldo y controles C5/C6 contra producción (§16) |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `vercel deploy --prod` |
| `AGE_PUBLIC_KEY`, `AGE_PRIVATE_KEY` | Cifrar el respaldo; descifrar en la prueba de restauración (ADR-22) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Subir y descargar respaldos; credencial limitada al bucket |
| `FINN_URL`, `RESPALDO_SECRET` | Llamar a `/api/respaldo/*` |

**Zona horaria del proceso (BE-57).** ADR-05 pide `TZ=UTC`. Las funciones de Vercel corren en UTC; en lugar de depender de una variable que la plataforma podría reservar, la aplicación **verifica al arrancar** que `Intl.DateTimeFormat().resolvedOptions().timeZone` sea `UTC` (o `Etc/UTC`) y no arranca si no lo es. Local y CI fijan `TZ=UTC` en los scripts. El código ya no depende de la zona del proceso (13.2, 13.6); la verificación es una barrera más.

### 14.3 Rol de base de datos por proceso

| Proceso | Rol | Conexión | Privilegios (03 §8.3) |
|---|---|---|---|
| Aplicación (Vercel): páginas, acciones, webhook, cron | `finn_app` | Pooler en modo transacción (6543), máximo 3 conexiones por instancia | Escritura de hechos solo con el bloqueo; sin DDL |
| Migraciones (CI, job de `main`) | `finn_migraciones` | Pooler en modo sesión (5432) | Dueño del esquema `finn` |
| Respaldo y controles nocturnos (GitHub Actions) | `finn_respaldo` | Pooler en modo sesión (5432) | Solo lectura (`default_transaction_read_only`) |
| Prueba de restauración | Superusuario del contenedor efímero | Local al runner | — |
| Bootstrap (una vez por base) | `postgres` de Supabase | Pooler en modo sesión o conexión directa | Crea los roles (§17, H-02) |
| Supabase Auth | Roles internos de Supabase | Interna | Esquema `auth`, fuera de `finn` |

### 14.4 Rotación de secretos

| Secreto | Cómo se rota | Efecto |
|---|---|---|
| Token del webhook | OPT-01 en Ajustes y pegar en MacroDroid | Inmediato; SMS en el intervalo → 401 (8.8) |
| `CRON_SECRET`, `RESPALDO_SECRET` | Variable nueva en Vercel (y en GitHub) y redesplegar | Inmediato tras el despliegue |
| Contraseñas de `finn_app`, `finn_migraciones`, `finn_respaldo` | Volver a ejecutar `bootstrap.sql` con claves nuevas (03 §10.4.1); actualizar las URL | Las conexiones existentes siguen hasta cerrarse |
| Claves de la carga firmada | 9.6 | Sin interrupción |
| Claves VAPID | Generar nuevas, desplegar; los navegadores renuevan la suscripción al abrir la app | Las suscripciones viejas fallan hasta renovarse |
| Clave de `age` | Nueva pareja; los respaldos viejos siguen cifrados con la anterior (guardarla en el gestor de contraseñas) | — |

### 14.5 Costo

Sin cambios respecto de 02 §6: **$0 al mes**. La Parte C no agrega servicios: el analizador de patrones, PapaParse, `web-push` y `node:crypto` son librerías; el push usa los servicios gratuitos de los navegadores.

---

## 15. Observabilidad

### 15.1 Fuentes

| Fuente | Retención | Qué contiene |
|---|---|---|
| `eventos_sistema` (03 §3.28) | 90 días; auditoría de formatos sin límite (EN-1) | Errores, tareas, cargas del motor, accesos rechazados, auditoría |
| `notificaciones` | 180 días | Lo que se notificó y si el push llegó |
| `estado_respaldo` | Fila única | Último respaldo y última restauración |
| Consola (logs de Vercel) | 1 hora en Hobby (ADR-23) | Una línea JSON por evento; para depurar en el momento |
| Logs de Supabase | 1 día en el plan gratuito | Errores de la base y de Auth |
| GitHub Actions | 90 días (por defecto) | Salida de respaldo, restauración, CI y despliegue |

### 15.2 Catálogo de eventos

**[F7]** **CT-09.** El catálogo agrega `app` · `aviso` · `despliegue_emergencia` · `{ commit, motivo, suites, e2e }`. La fila la inserta el usuario desde el editor SQL de Supabase al terminar PRU-MAN-OPER-002; la aplicación no la escribe. Detalle en `07-pruebas.md` §31.5.

**[F6]** **CF-16.** El catálogo es una constante exportada de `@finn/aplicacion/observabilidad/eventos.ts`, de la que sale esta tabla y que recorre la prueba de catálogo (14.1).

| `origen` | `nivel` | `mensaje` | `datos` (sin datos financieros del usuario) |
|---|---|---|---|
| `app` | `error` / `aviso` | `<categoría> <código> <operación>` | 7.8 |
| `app` | `info` | `auditoria_formato <accion>` | 8.7 |
| `webhook` | `aviso` | `token_invalido` | `{ ipPais? }` (cabecera de Vercel; sin IP completa) |
| `webhook` | `aviso` | `cuerpo_invalido` [R4] | `{ smsId, detalle }` (BE-60; sin el cuerpo) |
| `webhook` | `error` | `guardar_fallido` / `procesar_fallido` | `{ smsId?, sqlstate, idError }` |
| `tarea_diaria` | `info` | `puesta_al_dia_inicio` [R4] | `{ hoy, ejecucion }` (BE-50) |
| `tarea_diaria` | `info` | `diaria` / `puesta_al_dia` | 10.2 paso 7; la puesta al día agrega `ejecucion` |
| `tarea_diaria` | `error` | `paso_fallido` | `{ paso, idError }` |
| `motor` | `info` | `carga_completa` / `carga_incremental` | `{ revision, filasPorTabla, bytes, ms }` (5.6) |
| `motor` | `aviso` | `memoria_invalidada` | `{ motivo }` (5.3) |
| `respaldo` | `info` / `error` | `respaldo` / `restauracion` / `deriva` | `{ objeto, revision, bytes }` o `{ control, filas }` |

### 15.3 Reglas de saneamiento

- Nunca se registran: tokens, cookies, cabeceras `Authorization`, textos de SMS, contenido de CSV, montos, comercios, notas ni nombres de deudores.
- Los mensajes de la base pasan por el saneamiento de 7.8 (números y textos entre comillas → `#`).
- Los UUID y los nombres de restricciones sí se registran: no son datos financieros y permiten encontrar la fila.

### 15.4 Cómo diagnosticar un error en producción

1. El usuario ve "Referencia: E-7K2QPX" (7.7).
2. **Ajustes > Diagnóstico** (6.11) muestra los 50 eventos más recientes de nivel `aviso` o `error`, con su `idError`, origen y mensaje.
3. Para el detalle completo: en el editor SQL de Supabase, `SELECT * FROM finn.eventos_sistema WHERE datos->>'idError' = 'E-7K2QPX';`. Da la operación, el SQLSTATE, la restricción, la tabla, la revisión y la duración.
4. Si es un `INTERNO` con un código `FN0xx` (BE-25), es un desacuerdo entre el motor y la base: se reproduce localmente con los escenarios y la revisión registrada. Si hace falta el estado, se usa la exportación JSON (OPT-08) **en la computadora del usuario**, nunca en un servicio externo.
5. Si el error ocurrió hace menos de una hora, los logs de Vercel tienen la línea JSON con el mismo `idError`.

### 15.5 Alertas

Todas por push (§11), sin servicios externos: tarea diaria con algún paso fallido; respaldo atrasado (> 36 h) o restauración atrasada (> 35 días); deriva de catálogo (C5/C6) detectada por el respaldo; disparadores de la carga incremental (5.6). Los fallos de los jobs de GitHub Actions además llegan por correo de GitHub.

---

## 16. Respaldo

Precisa ADR-22 y 03 §12; no cambia sus decisiones.

### 16.1 Dónde y cuándo

| Job | Archivo | Calendario | Runner |
|---|---|---|---|
| Respaldo nocturno + controles C5/C6 contra producción | `.github/workflows/respaldo.yml` | `30 7 * * *` (07:30 UTC = 01:30 en El Salvador) y manual (`workflow_dispatch`) | `ubuntu-24.04` |
| Prueba de restauración | `.github/workflows/restauracion.yml` | `0 9 1 * *` (día 1 de cada mes) y manual | `ubuntu-24.04` con un contenedor `postgres:<versión mayor del proyecto>` |

`concurrency: respaldo` evita dos ejecuciones simultáneas. GitHub puede retrasar los `schedule`; la alerta de 36 h lo absorbe.

### 16.2 Herramientas del runner

- Cliente de PostgreSQL de **la misma versión mayor que el servidor**, instalado desde el repositorio oficial de PostgreSQL (PGDG). El job lee la versión con `SHOW server_version_num` y falla si no coincide con la instalada.
- `age` (cifrado) y la CLI `aws` configurada con el endpoint de R2 (`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`).
- Node 24 y pnpm para `respaldar.mjs` y `restaurar.sh` (03 §10.1).

### 16.3 Respaldo nocturno

1. `node tools/respaldo/respaldar.mjs` con `RESPALDO_DB_URL` (03 §12.1): transacción `REPEATABLE READ READ ONLY`, `pg_export_snapshot()`, manifiesto (`revision` y conteos por tabla) y `pg_dump --format=custom --schema=finn --snapshot=<id>` con la transacción abierta.
2. Cifra el volcado y el manifiesto con `age -r $AGE_PUBLIC_KEY`.
3. Sube `diarios/AAAA-MM-DD.dump.age` y `.manifiesto.json.age`. El día 1 copia también a `mensuales/AAAA-MM…`. La retención la aplican las reglas de ciclo de vida de R2 (30 y 365 días).
4. `POST /api/respaldo/respaldo` con `{ objeto, revision, bytes }` (OPT-09) → `estado_respaldo.ultimo_respaldo_en`.
5. Controles C5 (`reglas-catalogo.sql`) y C6 (`catalogo.sql` frente a `catalogo-esperado.txt` del commit desplegado en producción, que el job obtiene de la etiqueta que deja el despliegue). Si alguno falla: `POST /api/respaldo/deriva` con el control y el número de filas (sin contenido); la tarea diaria envía el push.
6. Si cualquier paso falla, el job falla (correo de GitHub) y no llama al paso 4: a las 36 h, push de respaldo atrasado.

**Si el pooler en modo sesión no permite usar una instantánea exportada (RK-21):** alternativa de 03 §11.8 — los conteos se toman de una segunda pasada `pg_dump --data-only` sobre la misma revisión. La prueba de humo lo decide (H-08).

### 16.4 Prueba de restauración

Los 11 pasos de 03 §12.2, con el paso 9 implementado como `tools/respaldo/verificar-motor.ts`: carga los hechos restaurados con el mismo `cargarHechos` de `@finn/db` (5.2), ejecuta `calcular(hechos, fechaDelVolcado)` y `verificarInvariantes` de `@finn/dominio`. Al terminar, `POST /api/respaldo/restauracion` → `estado_respaldo.ultima_restauracion_en`.

### 16.5 Restauración real (procedimiento de emergencia)

1. Crear un proyecto nuevo de Supabase (o usar Neon, plan B de ADR-04).
2. Ejecutar `bootstrap.sql` como administrador.
3. Descargar y descifrar el último respaldo (clave privada de `age` desde el gestor de contraseñas).
4. `pg_restore --exit-on-error --single-transaction` como administrador; `SELECT finn.verificar_todo()`.
5. Crear el usuario único en Auth, inscribir el TOTP y actualizar `FINN_USUARIO_ID` (el `sub` nuevo; ninguna tabla lo guarda, ADR-22).
6. Actualizar `DATABASE_URL`, las URL de Supabase y los secretos de GitHub; redesplegar.
7. Generar un token nuevo del webhook (OPT-01) y actualizar MacroDroid.
8. Conciliar las cuentas con los estados de cuenta del período para recuperar los movimientos posteriores al respaldo (hasta un día).

---

## 17. Prueba de humo de infraestructura

### 17.1 Cómo se ejecuta

- Script `tools/humo/humo.sh` (bash, `psql`, `pg_dump`, Node 24 y la CLI nativa de Prisma 7). Lo ejecuta el usuario en su computadora una vez creado el proyecto de Supabase y **antes** de cargar datos reales (P4-17).
- Entradas por variables de entorno de esa ejecución: `HUMO_ADMIN_URL` (rol `postgres`), `HUMO_REF` (referencia del proyecto), `HUMO_POOLER_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (solo para H-10) y `VERCEL_TOKEN` (solo para H-09).
- Salida: una línea JSON por paso, `{ paso, resultado: 'pasa' | 'falla' | 'omitido', medido, detalle }`, **sin secretos**. El usuario pega la salida en la conversación; el registro de la Fase 4 (o el de la Fase 8) anota los resultados y las alternativas aplicadas.
- Cada paso es independiente; un fallo no detiene los siguientes salvo que se indique.

### 17.2 Pasos

| # | Verifica | Cómo | Pasa si | Si falla: alternativa documentada |
|---|---|---|---|---|
| **H-01** | **Versión real de PostgreSQL** (P4-17, primer paso) | `SHOW server_version_num` como `postgres` | Se registra la versión mayor. Pasa si es 15, 16 o 17. El diseño no usa funciones exclusivas de una versión: `gen_random_uuid()` y `pg_current_xact_id()` existen desde la 13, y `json_agg`, `pg_export_snapshot`, `pg_advisory_xact_lock` y los triggers de restricción desde mucho antes | Mayor que 17: continuar y revisar las notas de la versión antes de producción; la CI (14.1) se configura con esa versión. Menor que 15: no previsto |
| **H-02** | Bootstrap con `postgres` no superusuario: roles con sus atributos, `BYPASSRLS` incluido (03 §13.5 B1) | `psql -f tools/db/bootstrap.sql` y consulta a `pg_roles` | `rolbypassrls`, `rolinherit`, `rolcreaterole`, `rolcreatedb` exactamente como 03 §8.2, y `finn_respaldo` con `default_transaction_read_only = on` | 03 §13.5: políticas `TO finn_app USING (true) WITH CHECK (true)` y `TO finn_respaldo USING (true)` en cada tabla; ajustar R2 y revisar 03 §8.5 |
| **H-03** | `GRANT CREATE ON DATABASE postgres TO finn_migraciones` (B2) | Incluido en el bootstrap; `has_database_privilege` | Verdadero | 03 §13.5: el bootstrap crea el esquema y se quita `CREATE SCHEMA IF NOT EXISTS` de la migración generada (excepción registrada) |
| **H-04** | Conexión de los tres roles por Supavisor, con `<rol>.<ref>`, en 6543 y 5432 (B3) | Seis conexiones con `psql` | En las seis, `current_user` es el rol; para `finn_migraciones`, `current_setting('search_path') = 'finn'` | 03 §13.5: conexión directa (IPv6) o complemento IPv4 para migraciones y respaldo; para `finn_app` en 6543, RK-06 (modo sesión también en ejecución) |
| **H-05** | Migraciones con la CLI **nativa** de Prisma 7 (03 §13.4) | `prisma migrate deploy` con `DIRECT_URL`; `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`; `reglas-catalogo.sql`; `catalogo.sql` frente a `catalogo-esperado.txt` | Las 7 migraciones aplican; `diff` vacío (código 0); 0 filas en R1–R13; 0 diferencias de catálogo | Revisar el hallazgo según el control que falló (03 §11.6). Si `diff` no queda vacío por un objeto manual nuevo, registrar como RK-19 |
| **H-06** | Patrón transaccional por el pooler en modo transacción (RK-06) | Script Node con Prisma 7 + `@prisma/adapter-pg` y `DATABASE_URL` (6543, `pgbouncer=true`): V-01, V-02, V-05, V-06, V-07, V-08, V-10 y V-11 de 0.7, más 50 escrituras seguidas en el mismo pool | Todos los resultados iguales a los locales; ningún error de sentencias preparadas | RK-06: `finn_app` por el pooler en modo sesión (5432) en ejecución |
| **H-07** | Zona horaria de la sesión (BE-33) | Por 6543: `SHOW TimeZone` sin `options`; con `options=-c TimeZone=UTC`; y dentro de una transacción después de `set_config('TimeZone','UTC',true)` | El tercer caso devuelve `UTC` (el paso 2 de 4.2 basta). Se registra si el segundo llega a la base | Si el tercero no da `UTC`: bloqueo de la Fase 8 hasta resolverlo (el diseño depende de él) |
| **H-08** | Respaldo por el pooler en modo sesión (RK-21) | `respaldar.mjs` como `finn_respaldo` y restauración en un contenedor local según 03 §12.2 (pasos 2 a 8) | `pg_dump --snapshot` funciona; conteos y revisión iguales al manifiesto; restauración sin errores | RK-21: conteos con una segunda pasada `--data-only` |
| **H-09** | **Carga del motor desde `iad1` con volumen alto a 10 años** ([R1] corrección 3, 5.6) | (a) Esquema temporal `humo` con copias de las tablas [M] sin triggers (`CREATE TABLE humo.x (LIKE finn.x)`), cargado con ~200.000 filas sintéticas como las de V-13. (b) Despliegue temporal en Vercel (`iad1`) de `tools/humo/funcion-carga`, una función que ejecuta las consultas de 5.2 contra `humo` diez veces y devuelve tiempos y bytes. (c) Se elimina el despliegue y `DROP SCHEMA humo CASCADE` | p95 de las 10 cargas ≤ **500 ms** (02 §2.3). Se registran también los bytes por carga (egreso) | Se registra como riesgo (RK-02) y se decide si la carga incremental (5.7) se activa desde el inicio |
| **H-10** | Auth: claves asimétricas, registro, TOTP y procedimiento de recuperación (12.1, 12.6) | `GET <SUPABASE_URL>/auth/v1/.well-known/jwks.json` (claves con `alg` asimétrico); con el registro todavía habilitado: crear un usuario de prueba, inscribir un TOTP, ejecutar `borrar-factores.mjs`, comprobar que se borró y que sus sesiones se cerraron; borrar el usuario; deshabilitar el registro y comprobar que un alta falla. Registrar el vencimiento del JWT | Todo según lo esperado | Claves simétricas: activar las asimétricas en el panel; si no se puede, `getClaims` hace la petición de red (12.3) y se acepta. Si el procedimiento de recuperación falla, se documenta otro antes de producción |
| **H-11** | Data API desactivada (ADR-04) | `GET <SUPABASE_URL>/rest/v1/` con la clave pública | No responde datos (desactivada) | Desactivarla en el panel y repetir |
| **H-12** | Limpieza | Borrar el esquema `humo`, el usuario de prueba y el despliegue temporal | Nada queda | — |

**BE-58. Medir la carga desde `iad1` con una función temporal.** La latencia que importa es la de la función de Vercel a Supabase. Medir desde la computadora del usuario (El Salvador) o desde un runner de GitHub (región variable) no la representa. Se usa un esquema temporal para no tocar las tablas reales ni la revisión. *Alternativa descartada:* cargar los datos sintéticos en las tablas `finn` y truncarlas después (dispararía los triggers, las verificaciones y la revisión, y dejaría `revision_minima_incremental` alterada).

### 17.3 Resultado esperado

La prueba se da por aprobada cuando H-01 a H-11 pasan o tienen su alternativa aplicada y registrada. Hasta entonces, la Fase 8 no despliega a producción.

---

# Parte D

## 18. Trazabilidad

### 18.1 Qué traza y cómo se lee

Cada escenario de `01-dominio.md` §8 (ESC-01 a ESC-50) y cada aviso de 01 §5.0.7 (AV-01 a AV-24) se relaciona con:
- **Operaciones:** las fichas de §3 (OP-nn, OPT-nn) que producen los hechos del escenario o el aviso.
- **Consultas:** las secciones de §6 que devuelven los números que el escenario afirma o donde se muestra el aviso, y **4.3** (previsualizar) cuando el escenario afirma un aviso "antes de confirmar" o un impacto. La previsualización es una lectura (`leer()`, BE-13), así que cuenta como consulta.

Convenciones de las tablas:
- "Reloj" indica un paso que solo avanza la fecha de hoy ("Hoy = 21 feb (cierre)"). En las pruebas lo hace el reloj simulado (BE-30); no es una operación.
- "Rechazo" indica un paso que el escenario espera rechazado; la columna da el código de 3.0.6 que debe producirse.
- Las pruebas de los escenarios son de la Fase 7. Esta tabla solo garantiza que cada escenario se puede ejecutar con las operaciones y comprobar con las consultas definidas aquí. Cada escenario es un archivo de datos en `packages/dominio/escenarios/` (1.2, ADR-19) y se ejecuta en dos niveles: el motor (`aplicar` + `calcular`) y la integración (operación + consulta contra Postgres).

### 18.2 Escenarios → operaciones y consultas

| ESC | Título (01 §8) | Operaciones | Consultas | Notas |
|---|---|---|---|---|
| ESC-01 | Saldos iniciales | OP-01, OP-14 | 6.5, 6.2, 6.1 | AV-07 en 6.1; patrimonio neto en 6.5 |
| ESC-02 | Saldo inicial con fecha en un período cerrado | OP-01 | 4.3, 6.4, 6.5 | AV-01; LPA_P1 en el historial de 6.4. Reloj |
| ESC-03 | Ingreso, asignación, asignar de más y límite de futuros | OP-21, OP-14, OP-17 | 4.3, 6.2, 6.4 | Paso 4: rechazo `lpa_negativo_en_futuro`. AV-11 (4.3), AV-20 (6.4), AV-18 (salida de OP-17) |
| ESC-04 | Compra con tarjeta cubierta | OP-21, OP-14, OP-20 | 6.2, 6.3, 6.5 | |
| ESC-05 | Compra con tarjeta no cubierta y cierre | OP-21, OP-14, OP-20 | 6.2, 6.3, 6.5 | Reparto D2 en 6.3. Reloj |
| ESC-06 | Asignación posterior que cubre el sobregiro con tarjeta | OP-14 | 6.2, 6.3 | Continúa ESC-05 |
| ESC-07 | Cubrir deuda sin respaldo de un período cerrado | OP-14 | 6.2, 6.5 | Continúa ESC-05 |
| ESC-08 | Pago parcial con desglose | OP-21, OP-14, OP-20, OP-23 | 6.14.4, 6.6, 6.2 | Desglose (§4.14) en el contexto de `pagar_tarjeta` (6.14.4) |
| ESC-09 | Pago total | OP-23 | 6.6, 6.2 | Continúa ESC-08 |
| ESC-10 | Pago excedente, antes y después del cierre | OP-21, OP-14, OP-20, OP-23 | 4.3, 6.2, 6.3, 6.4 | AV-10 (4.3), AV-03 y AV-04 (6.2). Reloj |
| ESC-11 | Pago excedente con deuda restante | OP-21, OP-14, OP-20, OP-23 | 6.2, 6.3, 6.6 | AV-07 principal y AV-04 secundario (F4) |
| ESC-12 | Intereses y comisiones | OP-21, OP-14, OP-20 | 6.2, 6.3 | |
| ESC-13 | Saldo a favor por pago y reserva excedente | OP-21, OP-14, OP-20, OP-23 | 4.3, 6.1, 6.2, 6.6 | AV-10, AV-04, AV-08 con propuesta (6.1); paso 5 es OP-14 (b1, usos derivados). Reloj |
| ESC-14 | Cashback, avance de efectivo y transferencia entre tarjetas | OP-21, OP-14, OP-20, OP-27 | 6.5, 6.6, 6.9, 6.1 | OP-27 a, b y c; clasificación en reportes (6.9); AV-24, AV-08 |
| ESC-15 | Sobregiro de débito y su efecto al cierre | OP-21, OP-14, OP-20 | 6.2, 6.4 | AV-02. Reloj |
| ESC-16 | Cubrir un sobregiro de débito antes del cierre | OP-21, OP-14, OP-20, OP-15 | 6.2 | Reloj |
| ESC-17 | Sobregiro mixto el mismo día, con una transacción agregada tarde | OP-21, OP-14, OP-20 | 6.3, 6.2 | Clave de orden: el instante lo fija el servidor (BE-27); el paso 2′ fija claves explícitas en el escenario de prueba. Reloj |
| ESC-18 | Cambio de medio de pago | OP-28 | 6.3, 6.7.2 | Continúa ESC-17 |
| ESC-19 | Split entre una categoría cubierta y otra no | OP-21, OP-14, OP-20 | 6.3, 6.7.2 | |
| ESC-20 | Compartido con débito: en camino, cobro parcial y excedente | OP-21, OP-14, OP-20, OP-31 | 6.12.3, 6.4, 6.9 | AV-09; restitución e ingreso en 6.9 |
| ESC-21 | Compartido con débito: condonación a una categoría sin Disponible | OP-21, OP-14, OP-20, OP-31, OP-32 | 6.12.3, 6.2, 6.14.4 | AV-02; categoría propuesta en 6.14.4. Reloj |
| ESC-22 | Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago | OP-21, OP-14, OP-20, OP-31 | 4.3, 6.14.4, 6.2 | AV-22 preseleccionada (BE-36); el paso 3 puede ir en la misma operación |
| ESC-23 | Compartido con tarjeta: cobro parcial y condonación | OP-21, OP-14, OP-20, OP-31, OP-32 | 6.12.3, 6.3 | |
| ESC-24 | Split y compartido en la misma compra | OP-21, OP-14, OP-20 | 6.7.2, 6.12.3, 6.2 | |
| ESC-25 | Devolución total con débito en un período posterior | OP-21, OP-14, OP-20, OP-33 | 6.14.4, 6.3 | OP-33 a; capacidad de devolución en 6.14.4. Reloj |
| ESC-26 | Devolución parcial con tarjeta en el mismo período, compra parcialmente cubierta | OP-21, OP-14, OP-20, OP-33 | 6.3, 6.6 | |
| ESC-27 | Devolución con tarjeta en el mismo período que cubre otra compra | OP-21, OP-14, OP-20, OP-33 | 6.3, 6.2 | |
| ESC-28 | Devolución con tarjeta en un período posterior y saldo a favor | OP-21, OP-14, OP-20, OP-23, OP-33 | 6.1, 6.2, 6.3 | AV-06 (dos variantes), AV-08. Reloj |
| ESC-29 | Devolución sobre una línea por cobrar y excedente repartido | OP-21, OP-14, OP-20, OP-31, OP-33 | 6.14.4, 6.12.3 | Paso 3: rechazo `devolucion_mayor_que_linea` (la capacidad de una línea por cobrar es su saldo abierto) |
| ESC-30 | Devolución sin compra original | OP-21, OP-14, OP-20, OP-33 | 6.2, 6.6 | OP-33 b (D-4 y D-2) |
| ESC-31 | Transacción olvidada con débito en un período cerrado, con efecto en cascada | OP-21, OP-14, OP-20 | 4.3, 6.1, 6.3 | AV-01 antes (4.3) y después (6.1, BE-38) |
| ESC-32 | Transacción olvidada con tarjeta en un período cerrado | OP-20 | 4.3, 6.5, 6.2 | AV-01 con Δ S |
| ESC-33 | Eliminación en un período cerrado que elimina un sobregiro | OP-29 | 4.3, 6.2 | Determinismo (inv. 26): el estado vuelve al paso 0 de ESC-31 |
| ESC-34 | Cambio de fecha que mueve la transacción de período | OP-21, OP-14, OP-20, OP-28 | 4.3, 6.3 | Clave de orden = instante del cambio |
| ESC-35 | Meta mensual: acumular frente a rellenar hasta | OP-18, OP-21, OP-14, OP-20 | 6.10, 6.2 | Reloj |
| ESC-36 | Meta semanal en períodos de distinta duración | OP-18, OP-21, OP-14 | 6.10, 6.2 | Monto del período por redondeo H11 |
| ESC-37 | Meta anual: reparto y renovación con dinero no gastado | OP-18, OP-21, OP-14, OP-20 | 6.10 | Reloj (varios períodos) |
| ESC-38 | Meta para una fecha: cumplida antes, vencida y extendida | OP-18, OP-21, OP-14 | 6.10, 6.1 | AV-17 (también push, 10.2 paso 4). Reloj |
| ESC-39 | Cuota de préstamo con desglose | OP-01, OP-48, OP-21, OP-14, OP-24 | 6.14.4, 6.6 | Desglose propuesto por el modelo en 6.14.4 |
| ESC-40 | Desembolso de préstamo y retiro de inversión | OP-01, OP-26, OP-25 | 6.5, 6.9 | Otras entradas en 6.9; patrimonio en 6.5 |
| ESC-41 | Aporte a inversión | OP-21, OP-14, OP-25 | 6.6, 6.2 | |
| ESC-42 | Fusión que afecta sobregiros de períodos cerrados | OP-18, OP-21, OP-14, OP-20, OP-12 | 4.3, 6.14.4, 6.2 | AV-13, AV-01 |
| ESC-43 | Eliminación de una tarjeta con asignaciones en un período cerrado | OP-01, OP-21, OP-14, OP-06 | 4.3, 6.5 | AV-15 (excepción F1) |
| ESC-44 | Archivar una categoría y devolución posterior hacia ella | OP-21, OP-14, OP-20, OP-42, OP-09, OP-33, OP-32, OP-11 | 6.2, 6.3, 6.14.4 | Paso 3: rechazo `categoria_archivada`; AV-14 |
| ESC-45 | Cambio de ciclo con período de transición | OP-21, OP-14, OP-19 | 4.3, 6.11, 6.10 | AV-12 |
| ESC-46 | SMS de las 7 pm del día 20 aprobado el día 21 | OP-35, OP-37 | 6.8, 4.3, 6.2 | Fecha local del SMS (13.2); AV-01 al aprobar. Reloj |
| ESC-47 | Conciliación con diferencia y edición posterior | OP-45, OP-47, OP-28 | 6.12.6, 6.6, 4.3 | AV-21 (6.6), AV-16 (4.3); diferencia actual en 6.6 |
| ESC-48 | Cobro de un por cobrar con débito depositado en la tarjeta | OP-21, OP-14, OP-20, OP-31 | 6.1, 6.2, 6.12.3, 6.9 | AV-05, AV-08; pago implícito. Reloj |
| ESC-49 | Tres períodos seguidos con asignaciones futuras | OP-21, OP-14, OP-20 | 6.2, 6.1, 4.3 | AV-02, AV-01. Reloj |
| ESC-50 | Registro automático atrasado e idempotente | OP-42, OP-21, OP-14, OP-43 | 6.12.1, 6.1 | Con la precisión **PR-3** (pasos 1 y 1b; 0.9, 19.4): el registro automático no escribe en P1 ([R2] ajuste 2) y el paso 1b es OP-43 de un toque con AV-01 |

### 18.3 Avisos → operaciones y consultas

| AV | Aviso (01 §5.0.7) | Clase | Operaciones que lo producen o lo resuelven | Consultas |
|---|---|---|---|---|
| AV-01 | Impacto retroactivo en el período activo | Antes y después | Toda operación que cambie un hecho con fecha en un período cerrado: OP-01, OP-02, OP-06, OP-12, OP-20 a OP-29, OP-31 a OP-34, OP-37, OP-43 (un toque), OP-46 | 4.3, 6.1, 6.12.5 |
| AV-02 | Sobregiro de débito | Estado | OP-20, OP-24, OP-32, OP-14 (desasignar) | 6.1, 6.2, 6.3 |
| AV-03 | Sobregiro con tarjeta | Estado | OP-20, OP-24, OP-32 | 6.1, 6.2, 6.3 |
| AV-04 | Pago excedente por pagos | Estado | OP-23 | 6.1, 6.2, 6.3, 6.6 |
| AV-05 | Pago excedente por un cobro en la tarjeta | Estado | OP-31 | 6.1, 6.2, 6.3, 6.6 |
| AV-06 | Pago excedente por una devolución | Estado | OP-33 | 6.1, 6.2, 6.3, 6.6 |
| AV-07 | Te falta reservar | Estado | OP-01, OP-20, OP-23, OP-14, OP-27 | 6.1, 6.2, 6.3, 6.6 |
| AV-08 | Reserva excedente (con propuesta) | Estado | OP-23, OP-27, OP-31, OP-33; se resuelve con OP-14 | 6.1, 6.2, 6.3, 6.6 |
| AV-09 | Dinero en camino | Estado | OP-20 (línea por cobrar con débito), OP-31, OP-32, OP-33 | 6.1, 6.2, 6.4, 6.12.3 |
| AV-10 | Pago que supera lo reservado | Antes | OP-23 | 4.3, 6.14.4 |
| AV-11 | LPA quedará negativo | Antes | OP-14, OP-15, OP-16 | 4.3 |
| AV-12 | Fecha desde la que aplica el ciclo | Antes | OP-19 | 4.3, 6.11 |
| AV-13 | Impacto de una fusión | Antes | OP-12 | 4.3, 6.14.4 |
| AV-14 | Categoría archivada con Disponible | Estado | OP-33, OP-28 (retroactivo); se resuelve con OP-11 | 6.1, 6.2, 6.3 |
| AV-15 | Impacto de eliminar una cuenta | Antes | OP-06 | 4.3, 6.14.5 |
| AV-16 | Edición o eliminación de una conciliada | Antes | OP-28, OP-29, OP-34, OP-37 | 4.3, 6.7.2 |
| AV-17 | Meta vencida | Estado (y push) | OP-18 (se resuelve al extender o ajustar); la tarea diaria lo notifica (10.2) | 6.1, 6.2, 6.10 |
| AV-18 | Auto-asignar: lo que quedó sin cubrir | Después | OP-17 | 4.3, 6.2 |
| AV-19 | Aprobar todos: no aprobados y motivo | Después | OP-38 | 6.8 |
| AV-20 | LPA negativo | Estado | OP-14 (manual en el activo); cierre con sobregiros (reloj) | 6.1, 6.2, 6.4 |
| AV-21 | Diferencia de conciliación | Después y estado | OP-47 | 6.6, 6.12.6 |
| AV-22 | Propuesta de asignar un cobro a pago(t) | Después (propuesta) | OP-31 (BE-36), OP-14 | 4.3, 6.14.4 |
| AV-23 | Notificaciones de la bandeja | Notificación | OP-35, OP-43, OP-49 | 6.8, 6.12.5, 6.1 |
| AV-24 | Cambio en "te falta reservar" de dos tarjetas | Después | OP-27 (c) | 4.3, 6.5, 6.6 |

Notas:
- **AV-19** viaja en la salida de OP-38 (`SalidaOperacion.avisos`, 3.0.3); la consulta 6.8 muestra los movimientos que quedaron en la bandeja con su estado.
- **AV-18** y **AV-24**: la salida de la operación trae el aviso; 4.3 muestra el impacto antes de confirmar y 6.2, 6.5 y 6.6, los números resultantes.
- Los avisos de estado (AV-02 a AV-09, AV-14, AV-17, AV-20) los calculan los selectores de la instantánea (6.0.5); una operación los incluye en su salida solo si aparecen o cambian por ella (3.0.5).

### 18.4 Verificación de la trazabilidad (BE-63, V-29)

**BE-63. La trazabilidad se verifica con un script, no a mano.** `tools/ci/trazabilidad.py` (prototipo `t17.py` en el zip) lee este documento y comprueba:

| # | Regla | Falla si |
|---|---|---|
| T1 | Cada ESC-01 a ESC-50 aparece exactamente una vez en 18.2 | Falta, sobra o se repite |
| T2 | Cada AV-01 a AV-24 aparece exactamente una vez en 18.3 | Igual |
| T3 | Cada fila tiene al menos una operación y al menos una consulta | Columna vacía o sin referencias válidas |
| T4 | Cada operación citada existe en el índice 3.0.8 (OP-01 a OP-52, OPT-01 a OPT-09) | Referencia a una operación inexistente |
| T5 | Cada consulta citada es 4.3 o un encabezado existente de §6 | Referencia a una sección inexistente |
| T6 | Cada AV citado en la columna de notas de 18.2 existe en 18.3 | Aviso inexistente |
| T7 | Cada código de rechazo citado en 18.2 existe en el catálogo 3.0.6 | Código inexistente |

Además informa (sin fallar) las operaciones que no aparecen en ningún escenario ni aviso; 18.5 es esa lista.

*Justificación:* las tablas cambian en las fases 5 a 8; un script en CI evita que una referencia quede rota sin que nadie lo note. *Alternativa descartada:* revisión manual en cada PR.

Verificado (V-29): con este documento consolidado, T1 a T7 pasan (50 escenarios, 24 avisos, 0 referencias rotas). Control negativo: al quitar la consulta de una fila, cambiar una referencia a `OP-99` y borrar ESC-50, el script falla con los tres errores.

### 18.5 Operaciones sin escenario numérico

El script informa las operaciones que ningún escenario ni aviso cita. No es un fallo: 01 §8 no tiene escenarios para ellas porque no cambian números del presupuesto. La Fase 7 debe cubrirlas con pruebas propias.

| Operación | Por qué no tiene escenario | Qué debe probar la Fase 7 |
|---|---|---|
| OP-03, OP-08 | Solo orden y nombres | Unicidad de nombres (3.0.6) y orden estable |
| OP-07 | Los escenarios parten de categorías ya creadas (datos iniciales de cada escenario) | Grupo del sistema, unicidad de nombres |
| OP-04, OP-05, OP-10, OP-13 | Archivar, desarchivar y eliminar sin efecto numérico directo | Precondiciones de 01 §7.6 y §7.7 |
| OP-22 | 01 no tiene escenario de transferencia neutral (solo cambia saldos) | Saldos de ambas cuentas e identidad |
| OP-30 | Estado bancario sin efecto presupuestario | Transiciones de 01 §7.2 y saldo confirmado |
| OP-36, OP-39, OP-40, OP-41 | Bandeja y reglas, sin efecto presupuestario (inv. 13) | Transiciones de 01 §7.1, reglas de comercio (§4.17) |
| OP-44 | Omitir ocurrencia | Inv. 15 y próximos pagos |
| OP-50, OP-51, OP-52 | Operaciones nuevas de esta fase | N-02, HZ-1, QB-2 |
| OPT-01 a OPT-09 | Técnicas | §8, §11, §16 |

OP-46 y OP-49 tampoco tienen escenario numérico, pero aparecen en 18.3 (AV-01 y AV-23); la Fase 7 las cubre igual (origen `importada`; reproceso de N-02).

---

## 19. Supuestos, riesgos y preguntas abiertas

### 19.1 Supuestos y requisitos previos

| # | Supuesto o requisito | Quién lo cumple y cuándo | Si no se cumple | Origen |
|---|---|---|---|---|
| SP-01 | **Muestras reales anonimizadas** de SMS (los tres bancos, todos los tipos de movimiento) y de los seis formatos de CSV | El usuario, antes de implementar `@finn/sms` y `@finn/conciliacion` en la Fase 8 | No se reescriben F-1..F-3 (QC-3) ni se implementa ningún `extraer` (9.2); el despliegue a producción queda bloqueado (RS-03) | P4-3, D-2 |
| SP-02 | **Prueba de humo §17 aprobada** (H-01 a H-11, o su alternativa registrada) | El usuario la ejecuta cuando exista el proyecto de Supabase | La Fase 8 no despliega a producción (17.3) | P4-17 |
| SP-03 | La versión mayor de PostgreSQL del proyecto es 15, 16 o 17 | H-01 lo verifica | El diseño se revisa antes de migrar | P4-17, H-01 |
| SP-04 | **Prueba en el teléfono** (8.8) con la variante elegida, `FINN_WEBHOOK_FORMATO` fijada y el plan de reintentos confirmado | El usuario, al configurar MacroDroid en la Fase 8 | Los SMS con comillas pueden llegar como `error` (BE-60) y los 5xx perderse (RS-05) | QC-1, [R4] ajuste 3 |
| SP-05 | Las verificaciones de 0.7 corrieron en Node 22 (salvo V-18, en Node 24) y PostgreSQL 16 local; se supone el mismo comportamiento en Node 24 y en la versión de Supabase | H-06 y H-07 repiten las verificaciones de transacciones y zona horaria en el entorno real | Se corrige el diseño antes de desplegar | 0.7 |
| SP-06 | Las verificaciones de base de datos usaron un **subconjunto** de 03 | El esquema completo se verifica con `prisma migrate deploy`, C5 y C6 en CI y en H-05 | La CI falla y se corrige la migración | 0.7 |
| SP-07 | Condiciones de Vercel Hobby (cron diario con ±59 min, 300 s por función) y del plan gratuito de Supabase, verificadas en la documentación de julio de 2026 | Se revisan si cambian (RK-16) | Se reevalúa §10 y el costo de $0 | 10.6, ADR-10 |
| SP-08 | Un solo usuario (`FINN_USUARIO_ID`) y un solo dispositivo Android con MacroDroid | — | Fuera del alcance de 2.0 | ADR-22, P4-12 |
| SP-09 | Los textos de los avisos y mensajes de 7.10 son definitivos en contenido; la Fase 5 decide solo su presentación | La Fase 5 | Un cambio de texto se hace en el catálogo de mensajes, sin tocar el motor | BE-34 |

### 19.2 Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación | Origen |
|---|---|---|---|---|---|
| RS-01 | El egreso de la base supera el umbral antes del año 4–5 que estimaba RK-02 (con volumen alto, alrededor del año 3 o 4) | Media | Medio | Memoria por revisión (5.3); disparadores por egreso y por latencia (5.6); carga incremental lista para activarse (5.7) | D-3, RK-02 |
| RS-02 | Los patrones F-1..F-3 de 03 son de grado 3 (3,8 s con 2.000 caracteres de ataque) | Alta (es el estado actual) | Medio | Límite de 640 caracteres (PR-2: ~120 ms en el peor caso); interpretación fuera del bloqueo (BE-45); la CI bloquea el despliegue hasta reescribirlos (QC-3) | V-24 |
| RS-03 | Las muestras reales (SP-01) no llegan a tiempo y el despliegue queda bloqueado | Media | Alto | Opción para decidir en la Fase 8: una migración que desactive F-1..F-3 (`activo = false`); la política solo evalúa formatos activos, así que se puede desplegar con todos los SMS como `no_reconocido` y registro manual desde la bandeja (OP-37 con datos completados) | QC-3 |
| RS-04 | MacroDroid no escapa la variable del SMS en el JSON | Media | Bajo | BE-60 guarda el SMS igual; la prueba en el teléfono decide la variante B (BE-61) | QC-1 |
| RS-05 | MacroDroid no reintenta ante un 5xx y no permite el plan B de 8.8 | Media | Medio: un fallo al guardar pierde ese SMS | Plan B en la macro (8.8); la conciliación (§9) encuentra el movimiento faltante ("solo en el estado") | D-5, [R4] ajuste 3 |
| RS-06 | Entre la rotación del token y la actualización de la macro, los SMS reciben 401 y no se guardan (N-01) | Baja | Bajo | Procedimiento de 8.8: rotar y pegar de inmediato; MacroDroid conserva el registro de la acción; la conciliación recupera lo perdido | D-6 |
| RS-07 | Una sesión revocada puede **leer** hasta que vence su JWT, porque las lecturas usan `getClaims()` | Baja | Bajo: no puede escribir (`getUser()` en escrituras) | BE-55; la vida del JWT se configura en Supabase; cerrar sesión en otros dispositivos revoca la renovación | BE-55 |
| RS-08 | El cron de Hobby corre una vez al día y en cualquier minuto de su hora | Alta (es la condición del plan) | Bajo | Puesta al día al abrir la app (BE-50), barrido del webhook (BE-62); ningún cálculo depende del cron (P4-2) | ADR-11 |
| RS-09 | Una función se interrumpe después de responder y deja un SMS sin resultado | Baja | Bajo | Barrido de 5 en cada petición del webhook (BE-62), puesta al día y tarea diaria (8.6) | BE-44 |
| RS-10 | Las verificaciones diferidas por fila encarecen una fusión con miles de líneas | Baja | Bajo | V-30 (indicativa, con el trigger reducido): ~13 µs por fila, 10.000 filas en ~130 ms al confirmar. La medición con el trigger completo de 03 queda para el benchmark de CI de la Fase 8 (FX-4); el `lock_timeout` de 10 s de las demás escrituras da un margen amplio | RK-22 |
| RS-11 | `prisma migrate` no se pudo ejecutar en esta fase (binarios no descargables) | Media | Medio | H-05 y la CI lo ejecutan antes del primer despliegue | 0.7 |
| RS-12 | El pooler en modo sesión no permite usar una instantánea exportada | Baja | Bajo | H-08 decide; alternativa de 03 §11.8 | RK-21 |
| RS-13 | Pérdida del único factor TOTP | Baja | Alto | Procedimiento de recuperación con la API de administración, desde la computadora del usuario (BE-56, 12.6); H-10 lo ensaya | P4-12 |
| RS-14 | El SMS S-09 (comercio con 8 dígitos) produce una fecha incorrecta con los patrones actuales | Media hasta reescribir | Bajo: el movimiento no afecta números hasta aprobarse (inv. 13) y el usuario ve la fecha | Reescritura con muestras (QC-3); caso de prueba obligatorio para los patrones nuevos | V-23 |

### 19.3 Preguntas abiertas para otras fases

**Para la Fase 6 (especificación funcional):**

| # | Pregunta | Contexto | Origen |
|---|---|---|---|
| F6-1 | **Conciliación manual sin CSV.** Para cuentas o bancos sin CSV, ¿se agrega una conciliación en la que el usuario escribe el saldo del banco y Finn registra la diferencia aceptada y propone el ajuste? | 01 no la incluye (OP-45 a OP-47 parten de un estado importado). No se agrega en esta fase | D-1 |
| F6-2 | **Flujo de efectivo real** (variación de los saldos de las cuentas de efectivo por período), además de "Lo que te quedó del período" (`remanente`) | No lo pide el producto | D-4, 6.9.5 |
| F6-3 | **Unir deudores** (dos deudores que son la misma persona) | OP-52 cubre renombrar; unir no está en 01 | QB-2 |
| F6-4 | **Fórmulas de los reportes de §16** del documento de producto | 6.9.4 entrega los datos base; las fórmulas son de la Fase 6 | P4-10 |

**Para la Fase 8 (implementación y puesta en marcha):**

| # | Pregunta o tarea pendiente | Contexto | Origen |
|---|---|---|---|
| FX-1 | Reescribir F-1..F-3 con las muestras reales (migración nueva) e implementar los seis `extraer` | SP-01 | QC-3, P4-3 |
| FX-2 | Validar el modelo de Banco Agrícola contra un estado de cuenta real | 01 Anexo A lo marca como pendiente | 01 A.2 |
| FX-3 | Elegir la variante del webhook y confirmar la variable de MacroDroid que expone el código de respuesta | 8.1.1, 8.8 (⚠) | QC-1, [R4] ajuste 3 |
| FX-4 | Medir las verificaciones diferidas con el esquema completo y una fusión de 10.000 líneas | V-30 fue indicativa | RK-22 |
| FX-5 | Si las muestras no llegan: decidir la desactivación temporal de F-1..F-3 (RS-03) | — | QC-3 |
| FX-6 | Al crear el repositorio, agregar la migración `20261014000000_m_purgar_eliminaciones` y la regla R14 en `reglas-catalogo.sql` (R1–R14), que viven en `04-backend-verificacion.zip` y no en el paquete de la Fase 3 | 03, "Enmiendas posteriores" | EN-2 |

**Para la Fase 7 (plan de pruebas):** pruebas de las operaciones sin escenario numérico (18.5) y de los casos W-01 a W-12 (V-27) y S-01 a S-13 (V-23) con los patrones nuevos.

### 19.4 Pregunta de la revisión final (resuelta)

**QD-1. ESC-50 frente a [R2] ajuste 2.** **Resolución: aprobada la recomendación** en la revisión final: precisión **PR-3** de 01 ESC-50 con los pasos 1 y 1b de la tabla siguiente (0.9). La Fase 7 implementa el escenario así.

Planteamiento original: ESC-50 (01 §8) espera que el registro automático del 10 de marzo (A = P2) registre las ocurrencias del 25 de enero (P1, **cerrado**) y del 25 de febrero, con AV-01 por P1. El ajuste 2 aprobado en la revisión de B1 dice lo contrario: el registro **automático** no registra una ocurrencia de un período cerrado; la deja pendiente y notifica (`ocurrencia_en_periodo_cerrado`). El escenario, tal como está escrito, no puede pasar. 01 es un documento aprobado, así que no lo cambio por mi cuenta.

Cómo quedaría el escenario con el ajuste 2 (calculado con las reglas de 01 §4.5):

| # | Operación | Ef | LPA | Disponibles | Identidad | Tarjeta T | Notas |
|---|---|---|---|---|---|---|---|
| 0 | Estado inicial | 100 | 70 | Susc 20; Susc(fut) 10 | 70 + 30 = 100 ✓ | 0 · 0 · 0 | Igual que 01 |
| 1 | Registro automático | 100 | 70 | Susc 10; Pago T 10; fut 10 | 70 + 30 = 100 ✓ | 10 · 0 · 0 | Solo 25 feb (P2): fondo 20, compra cubierta. 25 ene queda pendiente; AV-23 `ocurrencia_en_periodo_cerrado` |
| 1b | Registro de un toque de 25 ene, con AV-01 | 100 | 70 | Susc 0; Pago T 20; fut 10 | 70 + 30 = 100 ✓ | 20 · 0 · 0 | Llega al estado final del paso 1 de 01 |
| 2 | Registro automático otra vez | Sin cambios | | | ✓ | | Idempotente |

- *Recomendación:* registrarlo como **precisión PR-3 de 01 ESC-50** (pasos 1 y 1b como arriba). Conserva el estado final y la idempotencia que el escenario prueba, y el escenario pasa a probar también el ajuste 2.
- *Alternativa A:* exceptuar del ajuste 2 a las ocurrencias de un período cerrado cuyo cierre ocurrió mientras el cron no corría. Reintroduce una escritura retroactiva sin confirmación, que es lo que el ajuste 2 quería evitar.
- *Alternativa B:* dejar ESC-50 como está y deshacer el ajuste 2. Contradice tu decisión de la revisión de B1.

### 19.5 Registro de entregas del documento

| Versión | Contenido | Estado |
|---|---|---|
| Paso 1 | Resumen, preguntas P4-1 a P4-18, estructura | Respondido |
| Parte A | §0, 1, 2, 4, 5, 7, 13 | Aprobada con correcciones 1 a 3 |
| A r1 **[R1]** | Ids generados por la aplicación, `RETURNING`, zona horaria UTC, voseo, disparador por latencia | Aprobada con ajuste 1 |
| A r2 **[R2]** | UUIDv5, huella del impacto, triggers de 03 sin cascadas [M] | Aprobada |
| Parte B1 | §3 | Aprobada con ajustes 2 y 3 **[R2]** |
| Parte B2 | §6 | Aprobada con ajustes 1 a 3 |
| B2 r3 **[R3]** | Consulta `formulario`, agrupación de comercios, `remanente` | Aprobada |
| Parte C | §8 a 12, 14 a 17 | Aprobada con QC-1 a QC-4 y ajustes 1 a 3 |
| Consolidado **[R4]** + Parte D | Cambios de la revisión de C; §18 y §19 | Aprobado en la revisión final |
| Revisión final | QD-1 → PR-3; secciones "Enmiendas posteriores" en 01, 02 y 03; nombre de la migración de QC-3 corregido a `_m_` (DB-22) | **Aprobado — Fase 4 cerrada** (14 de octubre de 2026) |


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle. Los textos de este documento ya están actualizados y marcados **[F5]**.

- **CP-1 a CP-18** (Fase 5, aprobados en las revisiones de `05-frontend.md`): destinos y carga del push, `bandejaPorRevisar`, lecturas interactivas, funciones de autenticación, permiso de notificaciones tras un gesto, Zod, `Propuesta`, navegación entre períodos, ajustes a `formulario` (incluida la variante `conciliar`), filtros de reportes, errores de las consultas, `proxy.ts`, salida de OP-37, Route Handler del service worker y `etiqueta` en `CargaPush`. Tabla en 0.9.1; detalle en `05-frontend.md` §0.9, §2.13 y §8.
- **PF-3** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`). Es una precisión de `02-tecnologias.md` ADR-07 (anotada allí); en este documento se aplica con CP-6 (1.3 y 13.3): la interfaz puede sumar los montos que el usuario escribe solo como ayuda visual y nunca envía un valor calculado así. Detalle en `05-frontend.md` §0.8 y §5.1.
- **CF-01, CF-02, CF-04 a CF-07, CF-09, CF-15 a CF-22 y CF-24** y la precisión **FD-31** (Fase 6, aprobados en las revisiones de `06-features.md`): verificar saldo (OP-53), flujo de efectivo, reportes accionables y hallazgos, `Propuesta` extendida, Inicio (hallazgos de ritmo, pagos de tarjeta próximos, primeros pasos), motivos `pago_tarjeta_proximo` y `cuota_proxima`, `datos_base` como insumo de pruebas, signo menos U+2212, `aviso` nulo y prueba de catálogo, "categoría existía", lote de OP-07, reactivación de programadas, aprobar arrastrando y sus datos en `bandeja()`. Tabla en 0.9.2; detalle en `06-features.md` §0.7, §0.13, §0.15 y §3. CF-03 queda diferido.
- **CF-25** (Fase 6, aprobado en la revisión de la Parte E): datos de los componentes visuales de la identidad y variante "cubrir el sobregiro" de OP-16, con sus bordes (6.2, 6.3, 6.5, 6.8, 6.9.3, 6.14.4). Tabla en 0.9.2; detalle en `06-features.md` §5.8.
- **CT-01, CT-02 y CT-06** (Fase 7, aprobados en las revisiones de las partes A y C de `07-pruebas.md`). Reloj de prueba con `FINN_RELOJ_ARCHIVO` y lista de permitidos (13.1.4, 14.1); `finn.ahora()` y `finn.instante()` en lugar de `now()` y `clock_timestamp()` (4.2, 8.2, 8.6, 10.1, 10.2, 13.1, 13.6) y regla de lint L20; marca local del bloqueo, sin cambios para la aplicación (4.2). Marcas **[F7]** en cada sección. Detalle en `07-pruebas.md` §4 y §19.5.
- **CT-09** (Fase 7, aprobado en la revisión de la Parte D de `07-pruebas.md`). Despliegue de emergencia como única excepción al despliegue desde el job de `main` (14.1) y evento `despliegue_emergencia` en el catálogo (15.2). Marcas **[F7]** en cada sección. Detalle en `07-pruebas.md` §31.5.
