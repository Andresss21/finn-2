# Finn 2.0 — Selección de tecnologías (02-tecnologias.md)

**Fase:** 2. **Estado:** Aprobado — Fase 2 cerrada (11 de octubre de 2026).
**Fecha de verificación de precios y límites:** 11 de octubre de 2026 (fuentes en la sección 9).

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento fija el stack tecnológico de Finn 2.0. Cada elección se justifica a partir de los requisitos que impone `01-dominio.md`. Las fases 3 (base de datos), 4 (backend) y 5 (frontend) se construyen sobre estas decisiones, que quedan cerradas.

### 0.2 Alcance

- **Incluye:** lenguaje, frameworks, runtime, base de datos, acceso a datos, ubicación del motor de cálculo, autenticación, hosting, tareas programadas, notificaciones, PWA, estilos, librerías, pruebas, repositorio, calidad, CI, respaldo, costos y riesgos.
- **No incluye:** el esquema de base de datos (Fase 3), la arquitectura interna del backend y del frontend (fases 4 y 5) ni el diseño visual (Fase 5). Cuando una decisión depende de algo que se define después, se marca como **supuesto para la Fase N**.
- **No modifica el dominio.** `01-dominio.md` está aprobado. Las precisiones técnicas que tocan una operación se registran como notas de alineación (sección 5), sin reabrirlo.

### 0.3 Precedencia

1. `00-decisiones.md` y `01-dominio.md` mandan sobre este documento.
2. Este documento manda sobre las decisiones técnicas de las fases 3 a 8.
3. Si en una fase posterior una tecnología elegida aquí resulta inviable, se avisa y se registra un ADR nuevo que reemplaza al anterior; no se cambia en silencio.

### 0.4 Convenciones

- Los requisitos técnicos se identifican como **RT-nn**; las decisiones, como **ADR-nn**; los riesgos, como **RK-nn**.
- Las referencias al dominio usan su notación: §n (sección), OP-nn, inv. n, AV-nn, ESC-nn.
- "Motor" significa el motor de cálculo del dominio (la implementación de la sección 4 de `01-dominio.md`).
- "Hechos" y "derivados" tienen el significado de la sección 3 de `01-dominio.md`.

### 0.5 Respuestas del usuario incorporadas (Paso 1 y revisión final de la fase)

| # | Tema | Respuesta | Dónde se aplica |
|---|---|---|---|
| 1 | Presupuesto | $0 al mes, con respaldo propio | ADR-04, ADR-22, sección 6 |
| 2 | Proyectos de Supabase | La 1.0 ocupa uno; la 2.0 cabe en el plan gratuito. Si no hay cupo, Neon como plan B | ADR-04 |
| 3 | Webhook | Token inválido → 401 sin guardar; fallo al guardar → 5xx; SMS guardado → siempre 200 | ADR-09, nota N-01 |
| 4 | Sin conexión | Solo en línea, con aviso y página de respaldo | ADR-13 |
| 9 | Medio de pago en Cloudflare | Aceptado, con alerta de facturación en $0 (o el mínimo disponible) | ADR-22 |
| 10 | SMS con resultado "error" | Visible en la bandeja con su texto y AV-23; reprocesar a mano o crear la transacción a mano; sin reintento automático | ADR-09, nota N-02 |
| 11 | Respaldo sin el esquema `auth` | Las tablas de la app no referencian `auth`; la prueba de restauración lo verifica | ADR-22, sección 8 |
| 5 | ORM | Prisma, con verificación de cuatro puntos | ADR-05, ADR-06 |
| 6 | Conciliación | Seis formatos CSV de la 1.0; detección de Windows-1252 | ADR-17 |
| 7 | Respaldo | Cloudflare R2, volcado cifrado, 30 diarios y 12 mensuales, prueba de restauración | ADR-22 |
| 8 | Inicio de sesión | Email y contraseña, sesión larga, TOTP en dispositivos nuevos, registro deshabilitado | ADR-08 |
| — | Fechas | Evaluar un tipo propio frente a Temporal | ADR-16 |
| — | Estilos | Conservar la identidad de la 1.0; shadcn/ui solo como primitivos | ADR-14 |

---

## 1. Resumen del stack

| Área | Decisión | ADR |
|---|---|---|
| Lenguaje | TypeScript estricto en todo el código | ADR-01 |
| Frontend | Next.js 16 (App Router) + React 19 | ADR-02 |
| Backend y runtime | La misma app Next (route handlers y server actions) en Vercel Functions, runtime Node.js 24 LTS | ADR-03 |
| Base de datos | PostgreSQL en Supabase, plan gratuito; Neon como plan B | ADR-04 |
| Acceso a datos | Prisma ORM 7 (GA) con `@prisma/adapter-pg`; no Prisma 8 | ADR-05 |
| Concurrencia y atomicidad | Bloqueo asesor global por transacción; escritura en READ COMMITTED tras el bloqueo; lectura en REPEATABLE READ de solo lectura; contador de revisión mantenido por triggers | ADR-06 |
| Motor de cálculo | Paquete TypeScript puro, ejecutado solo en el servidor; recálculo completo con memorización por `(revisión, hoy)` | ADR-07 |
| Autenticación | Supabase Auth: email y contraseña + TOTP obligatorio (AAL2); token propio para el webhook; secreto para las tareas programadas | ADR-08 |
| Webhook de SMS | Dos transacciones: guardar y procesar; códigos HTTP según la nota N-01 | ADR-09 |
| Hosting y despliegue | Vercel Hobby (región iad1) + Supabase en us-east-1; despliegue a producción desde GitHub Actions después de migrar | ADR-10 |
| Tareas programadas | Vercel Cron diario, idempotente, más ejecución al abrir la app; GitHub Actions para respaldo | ADR-11 |
| Notificaciones push | Web Push estándar (VAPID) con la librería `web-push`, más registro dentro de la app | ADR-12 |
| PWA | Manifest nativo de Next + Serwist (`@serwist/turbopack`), solo en línea | ADR-13 |
| Estilos | Tailwind CSS v4 con tokens propios; shadcn/ui como primitivos sin su tema; next-themes por clase; `next/font` | ADR-14 |
| Dinero | Tipo propio `Centavos` sobre enteros, sin librería | ADR-15 |
| Fechas | Tipo propio `FechaLocal` ('AAAA-MM-DD') con utilidades puras; `Intl` en la frontera; sin Temporal en el dominio | ADR-16 |
| CSV | PapaParse, decodificación UTF-8 estricta con respaldo Windows-1252, un adaptador por formato | ADR-17 |
| Validación | Zod en todas las fronteras | ADR-18 |
| Pruebas | Vitest (unidad, escenarios y propiedades con fast-check); integración con Testcontainers; E2E con Playwright | ADR-19 |
| Repositorio | Monorepo con pnpm workspaces | ADR-20 |
| Calidad y CI | TS estricto con banderas extra; ESLint con reglas de frontera; Prettier; GitHub Actions | ADR-21 |
| Respaldo y exportación | `pg_dump` nocturno cifrado con `age` hacia R2; prueba de restauración mensual; exportación JSON y CSV en la app | ADR-22 |
| Observabilidad | Registro propio de eventos del sistema en la base de datos; sin servicios de terceros | ADR-23 |
| **Costo mensual** | **$0** | Sección 6 |

---

## 2. Requisitos técnicos derivados del dominio

### 2.1 Lista de requisitos

| # | Requisito | Fuente en `01-dominio.md` | Implicación técnica | Se resuelve en |
|---|---|---|---|---|
| RT-01 | **Atomicidad.** Toda operación, incluidas las compuestas (archivar, fusionar, aprobar y recordar una regla), se aplica completa o se rechaza completa, evaluada sobre el estado resultante. | §5.0.1, §5.0.2, §6 | Una transacción de base de datos por operación. La validación de invariantes requiere el motor dentro de la misma transacción. Descarta escribir con llamadas sueltas de PostgREST. | ADR-05, ADR-06 |
| RT-02 | **Serialización de escrituras.** El usuario, el webhook y la tarea programada pueden escribir a la vez. Una precondición como "LPA resultante ≥ 0" (OP-14) no puede evaluarse sobre un estado que otra escritura está cambiando. | §5.0.1, inv. 19, OP-14, OP-43 | Bloqueo global de escritura de hechos. | ADR-06 |
| RT-03 | **Unidades atómicas independientes.** "Aprobar todos" y el registro automático usan una transacción por elemento; un fallo no revierte a los demás. | OP-38, OP-43 | Bucle de transacciones con resultado por elemento (AV-19, AV-23). | ADR-06, ADR-11 |
| RT-04 | **Los derivados no se guardan.** Prohibido guardar LPA, Disponible, reparto D2, S(t), RE(t) y el resto, incluso como caché que pueda desactualizarse. | §3 (regla de cierre), §4.1.1, inv. 26 | Motor de función pura `calcular(hechos, hoy)`. Sin columnas derivadas ni vistas materializadas. Cualquier memorización debe ser imposible de desactualizar. | ADR-07 |
| RT-05 | **Rendimiento del recálculo** con 5 a 10 años de datos. | §4.1, §4.5, §4.6 | Ver 2.2. | ADR-07 |
| RT-06 | **Simulación previa.** Antes de confirmar se calculan deltas en el período activo (AV-01, AV-10, AV-11, AV-13, AV-15) y la reducción proyectada. | §5.0.3, §5.0.7 | El motor acepta un conjunto de hechos hipotético. Se calcula antes y después, sin escribir. | ADR-07 |
| RT-07 | **Montos en centavos enteros.** Solo existen dos redondeos: mitad hacia arriba (meta semanal) y techo (metas de ahorro). | §0.4, §4.12, OP-16 | Aritmética entera; prohibidos los flotantes en montos. | ADR-15 |
| RT-08 | **Fechas locales sin hora** en America/El_Salvador. "Hoy" es una entrada externa. Los instantes solo ordenan y nunca deciden un período. | §0.4, P5, P18, OP-35 paso 5, ESC-46 | Tipo fecha-sin-hora en el dominio; `hoy` se calcula una vez por petición en la frontera; prohibido `Date` dentro del dominio; conversión controlada en la capa de datos. | ADR-16, ADR-05 |
| RT-09 | **Orden determinista.** (fecha, clave de orden, orden de línea), con desempate por orden de creación de la transacción. | §4.1.2, D2, CB-21, inv. 26 | La base de datos necesita una secuencia de creación monótona; un UUID aleatorio no sirve para desempatar. | Supuesto para la Fase 3 |
| RT-10 | **Una sola fórmula por número.** Todas las vistas usan la misma. | inv. 27, error 11 | El motor devuelve una instantánea inmutable; las pantallas solo seleccionan y formatean. Sin caché de framework que sirva números viejos. | ADR-07, ADR-02 |
| RT-11 | **Los 50 escenarios como pruebas automáticas**, una aserción por fila, con "hoy" variable y pasos encadenados ("continúa"). | §8.0 | Escenarios como datos; reloj inyectable en todos los niveles. | ADR-19 |
| RT-12 | **Invariantes comprobables en cualquier estado.** | §6, §4.15 | Pruebas de propiedades (identidad de saldo, descomposición de la deuda, independencia del orden de inserción, inv. 28). | ADR-19 |
| RT-13 | **Webhook de SMS.** Token secreto; guardar el SMS antes de procesarlo; resultado "error" si el procesamiento falla. | OP-35, DM-7, H12, P16 | Dos transacciones por petición; comparación del token en tiempo constante; recuperación de SMS sin resultado. | ADR-09, nota N-01 |
| RT-14 | **Formatos bancarios como datos.** Agregar bancos o formatos no cambia la lógica central. | P20, 2.2.17, §3 | Patrones con grupos nombrados y normalizadores declarativos guardados en la base; control de expresiones regulares costosas. | ADR-09, supuesto para la Fase 3 |
| RT-15 | **Registro automático de programadas.** Idempotente, con su fecha esperada, en orden cronológico; si una falla, notifica y sigue. | OP-43, inv. 15, ESC-50, CB-33 | Tarea diaria; puede repetirse sin efectos. El cierre de período no necesita tarea porque es derivado. | ADR-11 |
| RT-16 | **Conciliación por CSV.** Reconocer el formato, extraer, clasificar; ningún hecho hasta terminar. | OP-45 a OP-47, inv. 14 | Lectura en el servidor, detección de codificación, un adaptador por formato. La conciliación en curso no persiste hechos. | ADR-17 |
| RT-17 | **Notificaciones** (AV-23), algunas con acciones (confirmar o rechazar una coincidencia). | AV-23; producto §12 | Web Push con el service worker de la PWA y un registro dentro de la app. Las acciones llaman a operaciones autenticadas. | ADR-12 |
| RT-18 | **PWA instalable en Android**, modo claro y oscuro, uso ocasional en escritorio. | Producto §4 | Manifest, service worker, íconos; solo en línea. | ADR-13 |
| RT-19 | **Un solo usuario.** Credenciales separadas para la sesión del usuario, el webhook y la tarea programada. | §0.2; producto §13 | Registro deshabilitado; segundo factor; ningún acceso público a las tablas. | ADR-08, ADR-04 |
| RT-20 | **Respaldo y exportación.** | Producto §15 | Exportación restaurable de todos los hechos y CSV de transacciones; volcado externo periódico con prueba de restauración. | ADR-22 |
| RT-21 | **Cambio de "hoy" a medianoche local.** El período activo y los estados derivados cambian sin que ocurra ningún evento. | §4.2.7, §7.3, AV-17 | La interfaz recalcula al cambiar la fecha local; la tarea diaria detecta avisos de estado nuevos para notificar. | ADR-11, supuesto para la Fase 5 |
| RT-22 | **Hechos inmutables y registro histórico.** El SMS recibido es inmutable; la interpretación inicial se congela; los cambios posteriores de conciliación son hechos. | 2.2.16, DM-7, DM-8 | Restricciones e inserciones sin actualización en esas tablas. | Supuesto para la Fase 3 |

### 2.2 Volumen estimado

Un usuario con uso intensivo de tarjeta. Se usan dos niveles: **base** (2.000 transacciones al año) y **alto** (5.000 al año).

| Dato | Por año (base / alto) | 10 años (base / alto) | ¿Entra al motor? |
|---|---|---|---|
| Transacciones | 2.000 / 5.000 | 20.000 / 50.000 | Sí |
| Líneas | 2.500 / 6.000 | 25.000 / 60.000 | Sí |
| Efectos en cuenta | 2.500 / 7.500 | 25.000 / 75.000 | Sí |
| Eventos | < 1.000 | < 10.000 | Sí |
| Asignaciones (≈ 50 categorías × 13 períodos) | ≈ 650 | ≈ 7.000 | Sí |
| Cuentas, categorías, metas, vigencias, programadas | < 300 en total | < 500 | Sí |
| SMS y movimientos en revisión | 2.500 / 5.000 | 25.000 / 50.000 | No (inv. 13) |

- **Entrada del motor a los 10 años:** entre unas 70.000 y 200.000 filas estrechas. En el protocolo de Postgres (texto) son entre 5 y 15 MB por carga completa. Durante los primeros tres años, menos de 4 MB.
- **Tamaño de la base:** menos de 100 MB a los 10 años, incluidos los textos de SMS. Muy por debajo de los 500 MB del plan gratuito.
- **Cálculo:** unos 130 períodos × 50 categorías ≈ 6.500 celdas, más una ordenación de los consumos por (categoría, período). Es O(n log n) y, en V8, del orden de decenas de milisegundos con el volumen alto. **El costo dominante es cargar los hechos, no calcular.**

### 2.3 Estrategia de cálculo

1. **Recálculo completo en memoria.** `calcular(hechos, hoy)` es una función pura sobre todos los hechos. Produce una instantánea inmutable con todos los derivados de la sección 4 de `01-dominio.md`: períodos, saldos, D2, Disponibles, sobregiros, S, RE, LPA, LPA histórico, metas y avisos de estado. Es la única implementación de cada fórmula.
2. **Memorización en el proceso**, con la clave `(revisión, hoy)`.
   - **Revisión:** un contador en la base que un trigger de sentencia incrementa en la misma transacción que cualquier cambio en una tabla de entrada del motor. Se incrementa aunque el cambio venga de fuera de la app (SQL manual o restauración).
   - **Lectura:** la revisión y los hechos se leen en una misma instantánea (ADR-06). Si la revisión coincide con la memorizada, se reutiliza la instantánea calculada; si no, se cargan los hechos y se recalcula.
   - **Determinismo:** la clave contiene todas las entradas de una función pura. Si la clave coincide, las entradas son idénticas y el resultado también. No puede devolverse un resultado de otros hechos ni de otro día.
   - **Sin persistencia:** la memoria vive solo en la instancia de la función. Nunca se escribe en la base (regla de §3).
   - **Prueba:** una prueba de propiedad compara siempre el resultado memorizado con un cálculo nuevo, sobre secuencias aleatorias de operaciones.
3. **Medición desde el día uno.** Cada carga registra filas, bytes aproximados y milisegundos (ADR-23). Un benchmark en CI con 10 años de datos sintéticos (nivel alto) fija presupuestos: cálculo ≤ 150 ms y carga ≤ 500 ms desde una base local.
4. **Contingencia: carga incremental.** Si el egreso de la base se acerca al límite del plan gratuito (ver RK-02), se activa la carga incremental de hechos: cada fila de entrada del motor lleva la revisión en que cambió y las eliminaciones dejan una marca. La instancia trae solo las filas con revisión mayor que la memorizada. Mantiene el determinismo porque reconstruye exactamente el conjunto de hechos de esa revisión, verificable con un conteo y una suma de control. **Supuesto para la Fase 3:** el esquema incluye desde el inicio la columna de revisión y la tabla de eliminaciones, aunque la carga incremental se active después.

**Alternativas descartadas:**

| Alternativa | Por qué se descarta |
|---|---|
| Calcular en SQL (vistas, funciones, CTE recursivas) | El reparto D2 es secuencial y el arrastre es una recurrencia con máx(0, ·). En SQL es difícil de escribir, de probar con los 50 escenarios y de mantener con agentes. Además partiría las fórmulas entre dos lenguajes (inv. 27). |
| Vistas materializadas o tablas de saldos | Son derivados guardados; pueden desactualizarse. Es el error 2 y el error 11 de la 1.0, y lo prohíbe §3. |
| Proyecciones incrementales por evento (estilo event sourcing) | La corrección retroactiva (C3) obliga a recalcular en cascada; una proyección incremental mal invalidada es justamente lo que §3 prohíbe. Complejidad alta sin necesidad con este volumen. |
| Calcular en el cliente | Habría que enviar todos los hechos al teléfono; las validaciones de las operaciones tienen que ocurrir en el servidor de todas formas, así que se duplicaría la ejecución del motor. |

---

## 3. Registro de decisiones técnicas (ADR)

Cada ADR incluye contexto, opciones evaluadas, decisión, consecuencias y alternativas descartadas.

### ADR-01 — Lenguaje: TypeScript estricto

- **Contexto.** El motor implementa fórmulas con signos, centavos y fechas donde un error de tipo es un error de dinero. El desarrollo lo harán agentes de IA.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **TypeScript** | Un solo lenguaje en front, back, dominio y pruebas; tipos marcados para `Centavos` y `FechaLocal`; lo que mejor conocen los agentes; experiencia de la 1.0 | El tipado no existe en ejecución; se necesita validación en fronteras |
| Kotlin o Go en el backend + TS en el front | Tipos más fuertes en ejecución | Dos lenguajes; el motor no se compartiría con la interfaz; más costo de hosting |

- **Decisión.** TypeScript en todo el repositorio, con `strict` y las banderas de ADR-21.
- **Consecuencias.** El motor, la capa de datos y la interfaz comparten tipos. Las fronteras (webhook, formularios, CSV, base de datos) validan con Zod (ADR-18).

### ADR-02 — Framework de frontend: Next.js 16 (App Router) + React 19

- **Contexto.** Interfaz instalable en Android y usable en escritorio. La 1.0 usó este framework sin problemas de plataforma.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Next.js 16 + React 19** | Conocido; front y back en un despliegue; server actions y route handlers; buen soporte en Vercel; los agentes lo conocen muy bien | Las cachés del framework pueden servir datos viejos si se configuran mal |
| Vite + React (SPA) + API aparte | Modelo mental simple | Dos despliegues; el webhook y las tareas necesitan otro servidor |
| React Router v7 o TanStack Start | Modernos | Menos experiencia previa; menos conocimiento en los agentes |
| SvelteKit | Ligero | Cambio de ecosistema sin ganancia para este dominio |

- **Decisión.** Next.js 16, App Router, React 19.
- **Consecuencias.**
  - Toda pantalla que muestra derivados se renderiza de forma dinámica. Está prohibido marcar con caché del framework (`"use cache"`, revalidación por tiempo) cualquier dato que provenga del motor. Después de cada operación se invalida la ruta. Así se protege inv. 27.
  - El servidor entrega a la interfaz solo la parte de la instantánea que necesita cada pantalla.
  - **Supuesto para la Fase 5:** la gestión de estado del cliente y la estrategia de refresco tras medianoche (RT-21).

### ADR-03 — Backend y runtime: monolito en la app Next sobre Node.js 24

- **Contexto.** El backend expone operaciones del dominio, el webhook, las tareas programadas y la exportación. Necesita conexiones TCP a Postgres.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Route handlers y server actions de Next en Vercel Functions (Node.js)** | Un despliegue; sin costo extra; el motor se importa como paquete | El backend queda acoplado al ciclo de despliegue del front (aceptable con un usuario) |
| Servicio NestJS aparte (Fly, Railway, Render) | Experiencia del usuario con NestJS; servidor persistente | Otro servicio y otro costo; los planes gratuitos persistentes duermen o cobran |
| Runtime Edge | Arranque más rápido | Sin TCP nativo a Postgres; restricciones de APIs de Node |

- **Decisión.** El backend vive en la misma app Next, en funciones Node.js de Vercel (Fluid compute). Versión de Node: **24.x**, la LTS por defecto que ofrece Vercel hoy. Node 26 no figura todavía entre las versiones disponibles en Vercel.
- **Consecuencias.**
  - La lógica de aplicación (casos de uso) vive en paquetes del monorepo y no en los archivos de rutas; Next es solo el adaptador HTTP. **Supuesto para la Fase 4:** la arquitectura interna de esos paquetes.
  - Duración máxima por función en Hobby: 300 s. El cálculo más pesado está muy por debajo.
  - El webhook, las tareas y la exportación son route handlers; las operaciones del usuario son server actions o route handlers (Fase 4).

### ADR-04 — Base de datos: PostgreSQL en Supabase (plan gratuito)

- **Contexto.** Se necesitan transacciones, triggers, bloqueos asesores y restricciones. Presupuesto $0.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Supabase (Postgres) gratuito** | Conocido por la 1.0; incluye Auth con TOTP gratuito; 500 MB; pooler; dos proyectos activos gratis | Pausa tras una semana de inactividad; sin respaldos automáticos en el plan gratuito; egreso de 5 GB al mes |
| Neon gratuito | Postgres serverless; ramas para pruebas | Habría que añadir un proveedor de autenticación; sin experiencia previa |
| SQLite (Turso) o Cloudflare D1 | Muy baratos | Sin bloqueos asesores ni el mismo modelo de transacciones; cambio de ecosistema |

- **Decisión.** Un **proyecto nuevo** de Supabase, plan gratuito, región **us-east-1**. La 1.0 ocupa el otro proyecto activo permitido. Si al crearlo no hay cupo, se usa **Neon** como plan B; ese cambio se registrará como un ADR que reemplaza a este y a la parte de Auth de ADR-08.
- **Condiciones verificadas del plan gratuito:** 500 MB de base, 5 GB de egreso, 50.000 MAU, TOTP incluido, sin respaldos automáticos, pausa después de una semana de inactividad, límite de dos proyectos activos.
- **Pausa por inactividad (confirmación pedida).** Supabase considera inactivo un proyecto que no recibe suficiente actividad de base de datos en la semana, y su documentación indica que unas pocas peticiones diarias bastan para evitar la pausa. El uso diario de la app más la tarea diaria (ADR-11) y el respaldo nocturno (ADR-22), que consultan la base todos los días, cumplen esa condición. Si aun así ocurriera, Supabase avisa por correo y el proyecto se restaura desde el panel sin perder datos; RK-01 detalla la mitigación.
- **Endurecimiento obligatorio:**
  - Desactivar la Data API (PostgREST), como recomienda la guía de Prisma de Supabase cuando solo se usa Prisma. Supabase Auth no depende de ella.
  - Activar RLS sin políticas en todas las tablas de la app, como defensa en profundidad.
  - Rol de base de datos propio para la app (no `postgres`) y un rol de solo lectura para el respaldo.
- **Consecuencias.** Sin entorno de staging en la nube: el plan gratuito permite dos proyectos y ambos están ocupados. El desarrollo local y la CI usan Postgres efímero (ADR-19).

### ADR-05 — Acceso a datos: Prisma ORM 7

- **Contexto.** El usuario eligió Prisma y pidió verificar cuatro puntos antes de aceptarlo.
- **Hallazgo previo: hay dos líneas de Prisma.**
  - **Prisma ORM 7** es la versión GA y sigue siendo la recomendada para producción; su API es `prisma.$transaction(...)`.
  - **Prisma ORM 8** es una reescritura en TypeScript con una API distinta (`db.transaction`, `tx.orm...`) y hoy está en **release candidate**. En Prisma 8, `db.transaction(...)` no acepta `isolationLevel`, `timeout` ni `maxWait`.
  - Prisma 7 tendrá soporte durante 18 meses después de la versión final de Prisma 8.
- **Decisión.** **Prisma ORM 7** (última 7.x en el lockfile; hoy 7.10.0), generador `prisma-client`, driver adapter **`@prisma/adapter-pg`**. **No se usa Prisma 8** mientras no sea GA y no se apruebe un ADR de migración.

**Verificación de los cuatro puntos pedidos:**

| # | Punto | Resultado | Cómo se usa en Finn |
|---|---|---|---|
| V1 | Transacciones interactivas con callback, con `pg_advisory_xact_lock` y verificación de invariantes dentro | **Viable.** `prisma.$transaction(async (tx) => …)` ejecuta todas las consultas de `tx` en una misma conexión y transacción. Si el callback lanza un error, se revierte todo. `tx.$executeRaw` y `tx.$queryRaw` corren dentro de la transacción, así que el bloqueo y el `SET LOCAL` se ejecutan dentro. El motor es código JS, así que evaluar invariantes dentro del callback y lanzar un error si fallan revierte la operación (§5.0.1). | Primera sentencia: `SELECT pg_advisory_xact_lock(<clave>)`. Después: cargar o reutilizar hechos, aplicar la operación en memoria, ejecutar el motor, verificar invariantes, escribir. Opciones: `timeout` ≥ 20 s (el valor por defecto es 5 s) y `SET LOCAL lock_timeout = '10s'`. |
| V2 | REPEATABLE READ para leer hechos y revisión | **Viable para la lectura.** Prisma 7 acepta `isolationLevel: RepeatableRead` en PostgreSQL. **Precisión importante para la escritura:** en REPEATABLE READ, Postgres toma la instantánea al empezar la primera sentencia, que sería la del bloqueo, *antes* de esperar el bloqueo. Si otra escritura confirma mientras se espera, la transacción leería hechos viejos. Por eso las escrituras usan READ COMMITTED: cada lectura posterior al bloqueo ve todo lo confirmado, y como toda escritura de hechos toma el mismo bloqueo, nadie cambia los hechos durante la transacción. El resultado es equivalente a una instantánea consistente. Detalle en ADR-06. | Lectura: transacción `RepeatableRead` de solo lectura (revisión + hechos). Escritura: `ReadCommitted` + bloqueo como primera sentencia. |
| V3 | Conexión desde Vercel a Supabase (pooler en modo transacción) sin romper las transacciones interactivas | **Viable.** Supabase recomienda el pooler compartido en modo transacción (puerto 6543) para funciones serverless. Prisma documenta que el modo transacción entrega una conexión por transacción, que es justo lo que requiere una transacción interactiva. Limitaciones del modo transacción: no admite sentencias preparadas (Supabase indica usar `pgbouncer=true` con Prisma) ni estado de sesión (`SET` sin `LOCAL`, bloqueos asesores de sesión, `LISTEN`). Finn solo usa estado de transacción. Las migraciones de Prisma no funcionan a través de un pooler en modo transacción: usan una URL directa. La conexión directa de Supabase es solo IPv6 en el plan gratuito; el pooler en **modo sesión** (puerto 5432) es IPv4 y sirve para migraciones y `pg_dump`. | `DATABASE_URL` = pooler en modo transacción (6543) con `pgbouncer=true`, usado por el adapter en tiempo de ejecución, pool de 1 a 3 conexiones por instancia y SSL obligatorio. `DIRECT_URL` = pooler en modo sesión (5432), usado por `prisma.config.ts` para migraciones y por el respaldo. **Prueba de humo obligatoria al iniciar la Fase 4** (RK-06): transacción interactiva con bloqueo, `SET LOCAL` y escrituras a través del pooler 6543. Si falla, se usa el pooler en modo sesión también en ejecución (admite sentencias preparadas), que basta para un usuario. |
| V4 | Impacto en el arranque en frío | **Aceptable.** Prisma 7 eliminó el motor de consultas en Rust y lo reemplazó por un compilador en TypeScript/WASM. Comparativas de terceros reportan arranques en frío del orden de 80–150 ms con Prisma 7, frente a 50–100 ms con Drizzle, y un paquete de alrededor de 1,6 MB. Con Fluid compute y uso diario de una persona, la mayoría de las peticiones encuentran la instancia caliente. | Cliente creado una vez por módulo. Se mide el arranque en frío en la prueba de humo de la Fase 4. |

- **Consecuencias.**
  - **Fechas:** Prisma devuelve un campo `@db.Date` como un `Date` a medianoche UTC. La conversión `Date ↔ FechaLocal` vive en **un solo módulo** de la capa de datos, que lee siempre con métodos UTC; el resto del código nunca ve un `Date` (ADR-16, RK-04). El runtime corre con `TZ=UTC`.
  - **Montos:** columnas enteras mapeadas a `number` (supuesto para la Fase 3: `Int` de 32 bits alcanza para $21.474.836,47 por fila; si la Fase 3 necesita `BigInt`, la conversión también vive en la capa de datos).
  - **Agentes:** la documentación por defecto de Prisma ya apunta a Prisma 8. Las instrucciones del repositorio para agentes enlazan la documentación de la versión 7 (`/docs/orm/v7`) y una regla de lint impide importar los paquetes de Prisma 8 (`@prisma/orm-*`).
  - **Migraciones:** `prisma migrate` con la URL del pooler en modo sesión; las migraciones se aplican antes del despliegue (ADR-10).
- **Alternativas descartadas.**

| Alternativa | Por qué se descarta |
|---|---|
| Prisma 8 | Release candidate; API nueva que los agentes conocen poco; sin `isolationLevel` ni `timeout` en `db.transaction`. |
| Drizzle | Técnicamente adecuado (más ligero, más cercano a SQL), pero el usuario prefiere Prisma y los cuatro puntos son viables con Prisma 7. La diferencia de arranque en frío no es relevante para un usuario. |
| SQL directo (postgres.js o pg) | Más código de mapeo y sin migraciones integradas. |
| supabase-js (PostgREST) | No permite transacciones interactivas; incumple RT-01. |

### ADR-06 — Concurrencia, atomicidad y aislamiento

- **Contexto.** RT-01, RT-02 y RT-03. Hay tres escritores posibles: el usuario, el webhook y la tarea programada. El volumen de escrituras es bajo.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Bloqueo asesor global por transacción** | Simple; serializa todas las escrituras de hechos; compatible con el pooler en modo transacción porque se libera al terminar la transacción | Escrituras estrictamente secuenciales (irrelevante con un usuario) |
| SERIALIZABLE con reintentos | Estándar | Reintentos ante errores 40001; difícil de razonar con un motor que lee todas las tablas |
| Bloqueos por fila (`SELECT … FOR UPDATE`) | Concurrencia fina | Las invariantes son globales (identidad de saldo, LPA): no hay una fila que proteger |

- **Decisión.**
  1. **Escritura de hechos:** `prisma.$transaction(fn, { isolationLevel: ReadCommitted, timeout: 20 s })`. La primera sentencia es `SELECT pg_advisory_xact_lock(<clave global de Finn>)` con `SET LOCAL lock_timeout`. Después: leer la revisión, cargar hechos (o reutilizar los memorizados si la revisión coincide), aplicar la operación en memoria, ejecutar el motor sobre el estado resultante, verificar precondiciones e invariantes, escribir y confirmar. Si algo falla, se lanza un error y se revierte todo.
  2. **Lectura:** transacción de solo lectura en `RepeatableRead`, que lee la revisión y, si hace falta, todos los hechos en una misma instantánea.
  3. **Garantía en la base:** el trigger que incrementa la revisión (2.3) **verifica que la transacción tenga el bloqueo** (consultando `pg_locks` para el `pid` actual) y aborta si no lo tiene. Ninguna escritura de hechos puede saltarse la serialización, aunque un agente olvide tomar el bloqueo.
  4. **Excepción:** guardar el SMS recibido (paso 1 de OP-35) no es entrada del motor y no toma el bloqueo, para que el guardado nunca espere una escritura larga.
  5. **Efectos externos** (push, correo) se ejecutan **después** de confirmar, nunca dentro de la transacción.
- **Consecuencias.**
  - **Supuesto para la Fase 3:** tabla de revisión, triggers de sentencia en cada tabla de entrada del motor y la verificación del bloqueo.
  - **Supuesto para la Fase 4:** la forma del servicio de transacciones que encapsula este protocolo, para que ningún caso de uso lo repita.
  - **Prueba de integración obligatoria:** dos escritores concurrentes, donde la segunda escritura debe ver la primera (ADR-19).

### ADR-07 — Motor de cálculo: paquete puro, ejecutado en el servidor

- **Contexto.** RT-04, RT-05, RT-06, RT-10 y la estrategia de 2.3.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Paquete TS puro, solo en el servidor** | Una sola fórmula; se prueba sin base de datos; simulación previa trivial | Hay que cargar los hechos en el servidor (ver 2.3) |
| Motor isomorfo (servidor y cliente) | Vista previa instantánea en el cliente | Enviar todos los hechos al teléfono; dos ejecuciones que vigilar |
| SQL | Sin carga de hechos | Ver 2.3, alternativas descartadas |

- **Decisión.**
  - Paquete `@finn/dominio`: TypeScript puro, **sin E/S, sin reloj, sin `Date`, sin dependencias de ejecución** (salvo, si se justifica, utilidades puras propias). Recibe `hechos` y `hoy`; devuelve una instantánea inmutable.
  - El motor expone funciones de cálculo y de aplicación de operaciones en memoria (para simular el estado resultante). Las fórmulas internas no se exportan; las pantallas consumen selectores sobre la instantánea.
  - Se ejecuta **solo en el servidor**. La simulación previa (RT-06) es una operación en seco: el servidor calcula antes y después y devuelve los deltas, sin escribir.
  - Memorización por `(revisión, hoy)` según 2.3, en memoria de la instancia, con una o dos entradas como máximo.
- **Consecuencias.**
  - Los 50 escenarios se ejecutan contra el paquete en milisegundos (ADR-19).
  - La interfaz no hace aritmética con montos; solo formatea `Centavos` recibidos.
  - **Supuesto para la Fase 4:** la forma de la instantánea y de los selectores.

### ADR-08 — Autenticación: Supabase Auth con TOTP obligatorio

- **Contexto.** Un solo usuario (RT-19). Sesión larga en el teléfono; segundo factor TOTP en dispositivos nuevos; registro deshabilitado. Además existen dos clientes que no son personas: MacroDroid (webhook) y la tarea programada.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Supabase Auth** | Conocido; TOTP incluido gratis en todos los proyectos; integración con Next mediante cookies | Depende del proveedor de la base |
| Better Auth o Auth.js con tablas propias | Independiente del proveedor | Más código de seguridad propio; los segundos factores requieren plugins |
| Protección a nivel de plataforma (Vercel Authentication) | Cero código | No cubre el webhook ni el uso como PWA; no es un login de la app |

- **Decisión.**
  - **Usuario:** Supabase Auth con email y contraseña; **registro de usuarios nuevos deshabilitado** en la configuración del proyecto; la cuenta única se crea a mano.
  - **Segundo factor:** TOTP obligatorio. Toda petición autenticada exige una sesión con nivel **AAL2**, verificado en el servidor (en el `proxy` de Next y en cada operación), nunca solo en el cliente. El servidor comprueba además que la sesión pertenezca al usuario único configurado (su identificador vive en la configuración del despliegue, no en las tablas de la app; ver ADR-22).
  - **"TOTP en dispositivos nuevos":** en Supabase el nivel AAL2 pertenece a la sesión. Como la sesión del teléfono es larga y se renueva sola, el código TOTP se pide al iniciar sesión en un dispositivo nuevo (o si la sesión se cierra), y no en el uso diario. No hace falta un mecanismo propio de "dispositivo recordado".
  - **Recuperación:** registrar dos factores TOTP (por ejemplo, el autenticador del teléfono y el secreto guardado en un gestor de contraseñas). Último recurso: borrar el factor desde el panel de Supabase.
  - **Webhook:** token aleatorio largo, enviado por MacroDroid en una cabecera; en la base solo se guarda su hash; comparación en tiempo constante; rotable desde Configuración (producto §13).
  - **Tarea programada:** secreto propio (`CRON_SECRET`) que Vercel Cron envía en la cabecera `Authorization`.
  - **Respaldo y despliegue:** credenciales propias en los secretos de GitHub, con roles de base de datos de privilegio mínimo.
- **Consecuencias.**
  - En el plan gratuito no están disponibles la protección contra contraseñas filtradas ni los tiempos límite de sesión configurables. Lo primero se compensa con una contraseña generada por gestor; lo segundo no se necesita porque se quiere una sesión larga.
  - **Supuesto para la Fase 4:** el flujo exacto de inscripción y verificación del TOTP y la protección de las acciones de las notificaciones (ADR-12).

### ADR-09 — Webhook de SMS

- **Contexto.** OP-35 y las respuestas del usuario (sección 0.5, punto 3). MacroDroid reintenta si la respuesta no es 200.
- **Decisión — flujo de una petición:**
  1. **Autenticar.** Si el token es inválido, responder **401** sin guardar nada.
  2. **Guardar el SMS** en una transacción propia (sin bloqueo global) y confirmarla. Si no se puede guardar, responder **5xx** para que MacroDroid reintente.
  3. **Procesar** (pasos 2 a 11 de OP-35) en una segunda transacción, con el bloqueo global (ADR-06), porque lee transacciones, programadas y movimientos para emparejar y detectar duplicados.
  4. Si el procesamiento falla, registrar en el SMS el resultado "error" en una transacción aparte.
  5. Una vez guardado el SMS, responder **siempre 200**, haya fallado o no el procesamiento.
  6. Enviar la notificación (AV-23) **después** de confirmar, sin retrasar la respuesta (con `after()` de Next).
- **Recuperación.** Si la función se interrumpe entre los pasos 2 y 4, el SMS queda guardado sin resultado. La tarea diaria y la apertura de la bandeja reprocesan los SMS **sin resultado**; el procesamiento es idempotente porque un SMS produce como máximo un movimiento (restricción única, supuesto para la Fase 3). Los SMS con resultado "error" **no** se reintentan solos: aparecen en la bandeja y el usuario decide si reprocesarlos o crear la transacción a mano (nota N-02).
- **Formatos bancarios.** Son datos (RT-14): patrón con grupos nombrados y normalizadores declarativos de monto y fecha. Al guardar un formato se rechazan los patrones con riesgo de retroceso exponencial (verificación con una librería de análisis de expresiones regulares) y se limita la longitud del texto de un SMS. **Supuesto para la Fase 3:** la representación exacta.
- **Consecuencias.** La nota N-01 (sección 5) alinea la redacción de OP-35 con estos códigos; la nota N-02 define el tratamiento de los SMS con resultado "error".

### ADR-10 — Hosting y despliegue

- **Contexto.** Presupuesto $0, un usuario en El Salvador, la base en Supabase.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Vercel Hobby** | Conocido; integración nativa con Next; Fluid compute; gratis para uso personal | Hobby es solo para uso personal no comercial (Finn lo cumple); cron solo diario; logs de 1 hora |
| Cloudflare Workers (OpenNext) | Generoso en el plan gratuito | Adaptador extra para Next; Postgres por TCP requiere Hyperdrive; menos experiencia |
| Fly.io o Railway | Servidor persistente | Sin plan gratuito estable; costo mensual |

- **Decisión.**
  - **Vercel Hobby**, funciones en la región **iad1** (Washington D. C.), junto a Supabase **us-east-1** (Virginia del Norte), para minimizar la latencia entre la función y la base.
  - **Despliegue a producción desde GitHub Actions**, no desde la integración automática de Vercel: en cada push a `main`, la CI ejecuta las pruebas, luego `prisma migrate deploy` (con la URL del pooler en modo sesión) y por último `vercel deploy --prod`. Así una migración siempre precede al código que la necesita y un fallo de pruebas nunca despliega.
  - **Despliegues de vista previa deshabilitados.** Solo existe una base en la nube (ADR-04); una vista previa apuntaría a datos reales. La revisión se hace en local y en la CI.
  - Las migraciones son compatibles hacia atrás (expandir y luego contraer), porque durante unos segundos conviven el código anterior y la base migrada.
- **Consecuencias.** Dominio: el subdominio gratuito `*.vercel.app`. Un dominio propio es opcional y no está incluido en el costo.

### ADR-11 — Tareas programadas

- **Contexto.** OP-43 (registro automático), reproceso de SMS sin resultado (ADR-09), avisos de estado que deben notificarse (por ejemplo AV-17 meta vencida), frescura del respaldo (ADR-22). El cierre de período **no** necesita tarea: es derivado.
- **Hallazgo.** En Vercel Hobby los cron jobs solo pueden ejecutarse una vez al día y la hora de disparo tiene una precisión de ±59 minutos.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Vercel Cron diario + ejecución al abrir la app** | Declarado en el repositorio; misma base de código; gratis | Una vez al día y con hora imprecisa |
| pg_cron + pg_net en Supabase llamando a un endpoint | Hora precisa | Lógica de disparo dentro de la base; secretos en Vault; más piezas |
| GitHub Actions `schedule` | Gratis | Retrasos en horas de carga; necesita credenciales de la app |

- **Decisión.**
  - **Vercel Cron, una vez al día**, programado para las 06:05 UTC (00:05 en El Salvador), sabiendo que puede dispararse hasta 59 minutos después. La tarea ejecuta, en este orden y cada paso de forma idempotente:
    1. OP-43 registro automático, una transacción por ocurrencia (RT-03);
    2. reproceso de SMS sin resultado;
    3. detección de avisos de estado nuevos que deben notificarse por push;
    4. verificación de que el último respaldo tiene menos de 36 horas (ADR-22).
  - **Ejecución al abrir la app:** la primera petición autenticada del día dispara los pasos 1 y 2. Como son idempotentes (inv. 15), da igual cuál de las dos rutas llegue primero; y la fecha registrada es siempre la fecha esperada, nunca la del momento de ejecución (OP-43).
  - El respaldo y la prueba de restauración corren en **GitHub Actions** (ADR-22), porque necesitan `pg_dump` y `age`.
- **Consecuencias.** La hora imprecisa no afecta ningún número: el dominio usa la fecha esperada y "hoy" se evalúa en cada cálculo. pg_cron queda como respaldo si Vercel Cron fallara.

### ADR-12 — Notificaciones push

- **Contexto.** AV-23 y producto §12: avisos de SMS nuevo, no reconocido, posible duplicado, coincidencia con una programada, registro automático; algunos con acciones.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Web Push estándar (VAPID) con la librería `web-push`** | Sin proveedor intermedio ni costo; funciona en Chrome para Android con la PWA instalada; admite acciones en la notificación | Hay que gestionar suscripciones y su expiración |
| Firebase Cloud Messaging directo | Muy usado | Un proveedor más y su SDK, sin ganancia para una PWA |
| OneSignal u otro servicio | Panel listo | Tercero con acceso al contenido de avisos financieros |

- **Decisión.**
  - Web Push con claves VAPID propias y la librería `web-push` en el servidor.
  - La suscripción del navegador se guarda en la base (supuesto para la Fase 3) y se renueva al abrir la app; las suscripciones que responden 404 o 410 se eliminan.
  - **Registro dentro de la app** de cada notificación enviada: es la fuente de verdad del centro de notificaciones, porque una notificación push puede perderse o retrasarse.
  - El contenido de la notificación es mínimo (tipo de aviso, comercio y monto). Las acciones ("confirmar", "rechazar") abren o llaman a la app con la sesión del usuario; nunca ejecutan una operación sin sesión AAL2.
- **Consecuencias.** **Supuesto para la Fase 4:** qué avisos generan push y cuáles solo quedan en el registro. **Supuesto para la Fase 5:** el centro de notificaciones como pantalla (fuera del dominio según §0.2).

### ADR-13 — PWA

- **Contexto.** RT-18. El usuario confirmó: solo en línea; sin red, aviso de "sin conexión" y una página de respaldo; no se registran operaciones sin conexión.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Manifest nativo de Next (`app/manifest.ts`) + Serwist** | Conocido por la 1.0; precarga de recursos estáticos; página de respaldo; Serwist ofrece integración con Turbopack (`@serwist/turbopack`), el empaquetador por defecto de Next 16 | Dependencia que debe seguir el ritmo de Next |
| Service worker escrito a mano | Sin dependencias | Más código propio para la precarga y la invalidación de versiones |
| Sin service worker | Nada que mantener | Sin Web Push ni instalación completa |

- **Decisión.** Manifest nativo de Next + **Serwist**. Estrategia de caché: solo recursos estáticos versionados y la página de respaldo. **Nunca** se guardan en caché respuestas con datos del usuario ni derivados (inv. 27 y privacidad). El mismo service worker recibe los Web Push (ADR-12).
- **Consecuencias.** Si la integración con Turbopack diera problemas, se compila con `next build --webpack` o se usa un service worker escrito a mano (RK-15).

### ADR-14 — Estilos y sistema de diseño

- **Contexto.** La 1.0 tiene identidad visual propia: tokens, tipografías Instrument Serif, Geist y Geist Mono, modo oscuro por clase. La decisión visual corresponde a la Fase 5; aquí solo se eligen herramientas que permitan conservarla. H1 exige distinguir sobregiro de débito y de tarjeta por color.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Tailwind CSS v4 con tokens propios + shadcn/ui como primitivos** | Conocido; tokens como variables CSS (`@theme`); shadcn copia componentes al repositorio, así que se pueden reescribir sin pelear con una librería; accesibilidad de Radix | Los componentes de shadcn traen un estilo por defecto que hay que reemplazar |
| CSS Modules + Radix sin estilos | Control total | Más CSS propio; menos productividad de los agentes |
| MUI o Mantine | Muchos componentes | Imponen su propia identidad; difícil conservar la de la 1.0 |

- **Decisión.**
  - **Tailwind CSS v4** con los tokens de la 1.0 definidos como variables CSS (colores, tipografía, espaciado, radios), incluidos tokens semánticos para débito y tarjeta (H1).
  - **shadcn/ui** solo como base de primitivos accesibles (Radix). Se adopta su estructura, no su tema: se reestilizan con los tokens propios.
  - **next-themes** con `attribute="class"` para el modo oscuro por clase.
  - **`next/font`** para Instrument Serif, Geist y Geist Mono (autohospedadas en el despliegue, sin peticiones a terceros).
- **Consecuencias.** **Supuestos para la Fase 5:** los valores de los tokens, los componentes y la librería de gráficos para Reportes.

### ADR-15 — Dinero: tipo `Centavos` propio

- **Contexto.** RT-07: centavos enteros y solo dos redondeos.
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Tipo marcado `Centavos` sobre `number` entero** | Sin dependencias; enteros exactos hasta 2^53 (unos 90 billones de dólares); suficiente para dos redondeos | Hay que escribir y probar las funciones |
| dinero.js | Librería especializada | Pensada para varias monedas; API más pesada; el dominio es solo USD |
| `bigint` | Sin límite | Incómodo de serializar y de usar en la interfaz; innecesario con este rango |

- **Decisión.**
  - `type Centavos = number & { readonly __marca: 'Centavos' }`, creado solo por constructores que verifican `Number.isSafeInteger`.
  - Operaciones: suma, resta, negación, mín, máx, comparación y las dos divisiones del dominio, con aritmética entera:
    - meta semanal, mitad hacia arriba: `redondear(m × d / 7) = ⌊(2·m·d + 7) / 14⌋` para m·d ≥ 0;
    - metas de ahorro, techo: `⌈a / n⌉ = ⌊(a + n − 1) / n⌋` para a ≥ 0.
  - Formato de presentación con `Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })`, solo en la interfaz.
  - Entrada del usuario: se convierte de texto a centavos sin pasar por flotantes.
- **Consecuencias.** Las pruebas verifican los valores de ESC-36 (221,43; 200,00; 214,29; 78,57) y de ESC-37 (92,31). Una regla de lint prohíbe operar montos con `/` fuera del módulo de dinero (ADR-21).

### ADR-16 — Fechas: tipo propio `FechaLocal`

- **Contexto.** RT-08 y la observación del usuario: evaluar un tipo propio frente a Temporal.
- **Estado de Temporal (verificado).** Temporal es estándar desde marzo de 2026 y está activo por defecto en Chrome y Edge 144+, Firefox 139+ y Node.js 26. Pero Vercel ofrece hoy Node 24.x como versión por defecto y no lista Node 26, así que en el servidor haría falta el polyfill.
- **Operaciones que necesita el dominio:** comparar, sumar días, días entre fechas, días del mes, inicio de mes con recorte (§4.2.1), sumar meses y años con recorte (§4.16, §4.12: 29 de febrero → 28), y obtener la fecha local de un instante (OP-35 paso 5, "hoy").
- **Opciones.**

| Opción | A favor | En contra |
|---|---|---|
| **Tipo propio `FechaLocal` ('AAAA-MM-DD')** | Serializable tal cual (JSON, componentes de servidor, columna `date`); la comparación de texto es cronológica; sin dependencias; conjunto pequeño y cerrado de operaciones; probado exhaustivamente | Código propio (unas 150 líneas) |
| Temporal (`PlainDate`) con polyfill | Semántica exacta; estándar | Polyfill pesado en el servidor hasta tener Node 26; los objetos no cruzan la serialización y habría que convertirlos en cada frontera |
| date-fns | Muy conocida | Basada en `Date`: reintroduce el riesgo de UTC del error 5 |

- **Decisión.** **Tipo propio `FechaLocal`** en `@finn/dominio`:
  - `type FechaLocal = string & { readonly __marca: 'FechaLocal' }`, validado con una expresión estricta y un día existente.
  - Implementación sobre **número de días desde una época**, con los algoritmos civiles estándar (de días a fecha y de fecha a días). Sin `Date` ni zona horaria.
  - **En la frontera** (fuera del dominio): `hoyEnElSalvador(instante)` usa `Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' })`, disponible en todos los runtimes. Lo mismo para la fecha local de recepción de un SMS sin fecha.
  - **Temporal como oráculo de pruebas:** pruebas de propiedades comparan cada operación propia con `Temporal.PlainDate` (polyfill como dependencia solo de desarrollo) sobre millones de fechas aleatorias.
- **Consecuencias.** La conversión entre `Date` de Prisma y `FechaLocal` vive solo en `@finn/db` (ADR-05). Si en el futuro Vercel ofrece Node 26, se puede reemplazar la implementación interna por Temporal sin cambiar el tipo público.

### ADR-17 — CSV y conciliación

- **Contexto.** OP-45 y los formatos de la 1.0 (todos CSV; los PDF se rechazan y se pide el CSV del portal).
- **Opciones de lectura.**

| Opción | A favor | En contra |
|---|---|---|
| **PapaParse** | Muy conocida; tolera comillas y saltos de línea; funciona en servidor | — |
| csv-parse | Robusta | API de streams más compleja para archivos pequeños |
| Parser propio | Sin dependencias | Los CSV bancarios tienen casos borde |

- **Decisión.**
  - El archivo se recibe en el servidor (límite de tamaño, por ejemplo 2 MB) y se procesa en memoria; no se guarda en almacenamiento externo.
  - **Codificación:** decodificar como UTF-8 en modo estricto (`TextDecoder('utf-8', { fatal: true })`, quitando el BOM); si falla, decodificar como **Windows-1252**. Node incluye ICU completo, así que no hace falta una librería de detección. El archivo ASCII de muestra de Banco Agrícola es válido en ambos casos.
  - **Lectura:** PapaParse sobre el texto ya decodificado.
  - **Reconocimiento:** un registro de adaptadores, uno por formato, cada uno con una función de detección y una de extracción (fecha, monto, descripción, fecha del estado, saldo final). Detección según las firmas de la 1.0:

| Formato | Firma de detección |
|---|---|
| BAC tarjeta de crédito | Contiene "Pro000000000000duct" o una sección de datos que empieza con "Date," |
| BAC débito o ahorro | "Detalle de Estado Bancario" + "Saldo Inicial" |
| Banco Agrícola tarjeta (portal) | Encabezado "Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)" |
| Banco Agrícola, CSV convertido desde PDF | Líneas que empiezan con referencias "VT" |
| Banco Agrícola débito o ahorro | "Detalle de Estado Bancario" + "Referencia de Transacci" |
| Cuscatlán tarjeta | "Historial de movimientos" |

  - Las detecciones se evalúan de la más específica a la más general: los dos formatos con "Detalle de Estado Bancario" se distinguen por su segunda firma. Si ningún adaptador coincide, o coincide más de uno, se rechaza con "formato no reconocido" (OP-45).
  - Archivos PDF: rechazados con el mensaje de pedir el CSV del portal.
- **Consecuencias.** **Supuesto para la Fase 4:** la ubicación del registro de adaptadores (paquete `@finn/conciliacion`, ADR-20) y su contrato. Cada adaptador tendrá pruebas con los archivos de muestra anonimizados que el usuario entregará.

### ADR-18 — Validación en las fronteras: Zod

- **Decisión.** Zod (v4) valida toda entrada externa: cuerpo del webhook, formularios y server actions, filas de CSV ya extraídas, variables de entorno al arrancar y la exportación JSON al importarla en una restauración.
- **Alternativas descartadas.** Valibot (más pequeño, pero menos conocido por los agentes); validación manual (propensa a omisiones).
- **Consecuencias.** El dominio no depende de Zod: recibe tipos ya validados.

### ADR-19 — Pruebas

- **Contexto.** RT-11, RT-12 y los riesgos de concurrencia y fechas.
- **Decisión por nivel:**

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unidad | **Vitest** | Funciones del dominio, `Centavos`, `FechaLocal`, adaptadores de CSV, normalizadores de SMS |
| Escenarios | **Vitest**, ejecutando los 50 escenarios de §8 **como datos** | Cada escenario es un archivo con sus pasos (operación, "hoy") y las columnas esperadas (Ef, LPA, Disponibles, SobTA, identidad, tarjeta). Un ejecutor común aplica cada paso y comprueba cada fila. Los escenarios "continúa" reutilizan el estado del anterior. Se ejecutan contra el motor puro en cada push |
| Propiedades | **fast-check** | Identidad de saldo (inv. 1), deuda y reserva (inv. 2 y 3), inv. 28, determinismo frente al orden de inserción (inv. 26), memorización igual a cálculo nuevo, `FechaLocal` frente a Temporal, redondeos |
| Integración | **Vitest + Testcontainers** con Postgres de la misma versión mayor que el proyecto de Supabase | Migraciones, triggers de revisión y del bloqueo, ida y vuelta de fechas y montos, atomicidad, **dos escritores concurrentes**, flujo del webhook (401, 5xx, 200), idempotencia de OP-43; un subconjunto de escenarios ejecutado a través de la persistencia |
| Extremo a extremo | **Playwright** con viewport de Android, contra la app en local y la pila local de Supabase (Supabase CLI) | Flujos clave: login con TOTP, aprobar SMS, asignar, pagar tarjeta, conciliar; comprobación de que los números coinciden entre pantallas tras una operación (inv. 27) |
| Rendimiento | Benchmark en Vitest con datos sintéticos de 10 años (nivel alto) | Presupuestos de 2.3 |

- **Reloj inyectable.** El dominio recibe `hoy`. En integración y E2E, una variable de entorno **solo disponible fuera de producción** fija el instante actual; la app se niega a arrancar si esa variable existe en producción.
- **Alternativas descartadas.** Jest (más lento y con peor soporte de ESM); Cypress (peor emulación móvil); PGlite para integración (no reproduce el pooler ni todas las extensiones; Testcontainers usa Postgres real).

### ADR-20 — Estructura del repositorio: monorepo con pnpm workspaces

- **Opciones.** Un solo paquete Next (simple, pero no impide que la interfaz importe internos del dominio); **monorepo con pnpm workspaces** (fronteras explícitas entre paquetes); monorepo con Turborepo (caché de tareas, innecesaria con este tamaño).
- **Decisión.** pnpm workspaces, sin Turborepo por ahora:

```
apps/
  web/                Next.js: interfaz, route handlers, server actions, cron
packages/
  dominio/            @finn/dominio: motor puro, Centavos, FechaLocal, escenarios
  db/                 @finn/db: esquema y migraciones de Prisma, cliente, conversiones, servicio de transacciones
  conciliacion/       @finn/conciliacion: decodificación y adaptadores CSV
  config/             tsconfig, ESLint y Prettier compartidos
tools/
  respaldo/           scripts de pg_dump, cifrado, subida a R2 y restauración
docs/                 copia de los documentos de fase e instrucciones para agentes
```

- **Dependencias permitidas:** `web → dominio, db, conciliacion`; `db → dominio` (solo tipos); `conciliacion → dominio` (solo tipos); `dominio →` nada. Se aplican con reglas de lint (ADR-21).
- **Consecuencias.** **Supuesto para la Fase 4:** la organización interna de casos de uso (si viven en `packages/` o en `apps/web`) y nombres finales de los paquetes, sin cambiar las fronteras de arriba.

### ADR-21 — Calidad de código y CI

- **Decisión — tipado:** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`.
- **Decisión — lint:** ESLint (configuración plana) con `typescript-eslint` en modo estricto con tipos, más reglas propias de frontera:
  - en `@finn/dominio`: prohibido importar módulos de E/S, Prisma, Next o Node; prohibidos `Date`, `Date.now`, `Math.random` y `new Intl.DateTimeFormat`;
  - fuera de `@finn/db`: prohibido importar `@prisma/client` y el cliente generado;
  - en todo el repositorio: prohibido importar paquetes de Prisma 8 (`@prisma/orm-*`);
  - fuera de los módulos de dinero y fechas: prohibido usar `parseFloat`, `toFixed` y `/` sobre valores `Centavos` (regla de sintaxis restringida y revisión de tipos).
- **Decisión — formato:** Prettier.
- **Alternativa descartada:** Biome. Es más rápido y unifica lint y formato, pero no tiene el equivalente de las reglas con información de tipos que se necesitan para las fronteras, y los agentes conocen mejor ESLint.
- **Decisión — CI (GitHub Actions, repositorio privado):**
  1. En cada push y PR: instalación con caché, `typecheck`, lint, formato, unidad + escenarios + propiedades, integración con Testcontainers, benchmark.
  2. En PR marcados como listos y en `main`: E2E con Playwright y la pila local de Supabase.
  3. En `main`, si todo pasa: `prisma migrate deploy` y `vercel deploy --prod` (ADR-10).
  4. Concurrencia por rama con cancelación de ejecuciones anteriores, para cuidar los minutos gratuitos.
- **Instrucciones para agentes.** El repositorio incluye un archivo de instrucciones que enlaza los documentos de fase, la documentación de Prisma 7 y las reglas de esta sección.

### ADR-22 — Respaldo y exportación

- **Contexto.** RT-20 y las respuestas del usuario: R2, volcado cifrado, 30 diarios y 12 mensuales, prueba de restauración. El plan gratuito de Supabase no incluye respaldos automáticos.
- **Decisión — respaldo nocturno (GitHub Actions, 07:30 UTC):**
  1. `pg_dump` en formato personalizado de los esquemas de la app, con un rol de solo lectura, a través del pooler en **modo sesión** (IPv4; la conexión directa del plan gratuito es solo IPv6 y los runners de GitHub no la alcanzan de forma fiable). Versión del cliente igual a la versión mayor del servidor.
  2. Cifrado con **`age`** usando una clave pública guardada en los secretos de GitHub.
  3. Subida a **Cloudflare R2** con prefijo `diarios/AAAA-MM-DD.dump.age`. El primer día de cada mes se copia además a `mensuales/AAAA-MM.dump.age`.
  4. Retención con reglas de ciclo de vida de R2: `diarios/` se elimina a los 30 días; `mensuales/`, a los 365.
  5. Al terminar, el job llama a un endpoint autenticado de la app que registra "último respaldo correcto". La tarea diaria (ADR-11) envía un push si han pasado más de 36 horas.
- **El esquema `auth` de Supabase no se respalda.** Contiene el usuario y los factores TOTP; en una restauración en otro proyecto se recrea el único usuario y se vuelve a inscribir el TOTP. Así el respaldo no contiene hashes de contraseña ni secretos TOTP.
- **Restricción que lo hace posible: ninguna tabla de la app referencia el esquema `auth`.** Si una tabla tuviera una clave foránea o un valor que apunte a `auth.users`, el volcado no se podría restaurar en otro proyecto, porque el usuario recreado tendría otro identificador. Por eso:
  - las tablas de la app no tienen claves foráneas hacia `auth` ni guardan el identificador del usuario de Supabase;
  - la relación con el usuario único se resuelve en la capa de aplicación: la autorización comprueba que la sesión sea AAL2 y pertenezca al usuario configurado (ADR-08), y los datos no llevan columna de usuario, o como mucho un identificador propio de la app que no depende de `auth`;
  - **supuesto para la Fase 3** (sección 8).
- **Decisión — prueba de restauración mensual (GitHub Actions):**
  1. Descarga el último respaldo y lo descifra.
  2. Lo restaura en un Postgres efímero de la misma versión **que no tiene el esquema `auth` de Supabase**. La restauración debe completarse sin errores; cualquier referencia pendiente hacia `auth` la hace fallar.
  3. Comprueba en el catálogo (`pg_constraint`) que ninguna clave foránea de los esquemas de la app apunte fuera de ellos.
  4. Ejecuta el motor sobre los datos restaurados y verifica invariantes (identidad de saldo y reglas de §6) y conteos por tabla.
  5. Si algo falla, el job falla de forma visible y la tarea diaria envía un push (ADR-11).
- **Claves.** La clave privada de `age` se guarda en el gestor de contraseñas del usuario y también en los secretos de GitHub (la prueba de restauración la necesita). Es un compromiso aceptado: los secretos de GitHub están cifrados y el repositorio es privado.
- **Decisión — exportación en la app:**
  - **JSON completo de hechos**, con versión de formato: restaurable y legible sin la base.
  - **CSV de transacciones** con sus líneas, para hojas de cálculo.
  - **Supuesto para la Fase 4:** el formato exacto y si existe una importación desde el JSON.
- **Medio de pago y alerta de facturación.** R2 puede pedir un medio de pago para activarse, aunque el uso quede dentro del nivel gratuito; el usuario lo acepta. Como protección, al crear la cuenta se configura una **alerta de facturación de Cloudflare con umbral de $0**, o el mínimo que permita la cuenta si $0 no está disponible. El umbral efectivamente configurado se anota en las instrucciones de operación del repositorio. Además, el bucket es privado (sin acceso público ni dominio `r2.dev`) y la credencial de GitHub Actions solo tiene permiso de lectura y escritura de objetos en ese bucket.
- **Consecuencias.** Costo esperado $0 (sección 6); cualquier cargo inesperado genera un aviso antes de acumularse.

### ADR-23 — Observabilidad mínima propia

- **Contexto.** Los logs de ejecución de Vercel Hobby se conservan 1 hora y los de Supabase gratuito, 1 día. Los errores de la tarea nocturna o del webhook se perderían.
- **Opciones.** Servicio externo de errores (por ejemplo, Sentry): panel listo, pero envía trazas que pueden contener datos financieros a un tercero. **Registro propio en la base:** sin terceros ni costo.
- **Decisión.** Tabla de eventos del sistema (errores, resultados de tareas, métricas de carga del motor de 2.3, envíos de push), con retención limitada (por ejemplo, 90 días). Los fallos de las tareas generan además un push. Logs estructurados en la consola para depuración inmediata.
- **Consecuencias.** **Supuesto para la Fase 3:** la tabla. No es un hecho del dominio y no entra al motor.

---

## 4. Puntos del dominio con costo técnico

### 4.1 Ninguno bloquea

Ninguna regla de `01-dominio.md` resultó inviable con este stack. Estos puntos tienen costo y se dejan visibles:

| # | Punto | Costo | Tratamiento |
|---|---|---|---|
| D-1 | §3: derivados siempre calculados desde todos los hechos | Cargar todos los hechos consume egreso de la base (5 GB al mes en el plan gratuito) | Memorización por revisión; medición; carga incremental como contingencia (2.3, RK-02) |
| D-2 | §5.0.3: simular antes de confirmar | Duplica el cálculo en operaciones retroactivas | Aceptable: decenas de milisegundos |
| D-3 | OP-43 "automático" | En Hobby, solo una ejecución diaria con hora imprecisa | Ejecución diaria + al abrir; la fecha registrada es la esperada (ADR-11) |
| D-4 | CB-21: desempate por orden de creación | Requiere una secuencia monótona, no UUID aleatorio | Supuesto para la Fase 3 |
| D-5 | AV-23 con acciones | Una acción desde una notificación requiere sesión AAL2 | Las acciones abren la app con la sesión (ADR-12) |

### 4.2 Puntos que el dominio no definía

- **SMS con resultado "error".** OP-35 indica que el SMS queda guardado con el resultado "error", pero no definía qué puede hacer el usuario con él. El usuario lo resolvió en la revisión de esta fase: ver la nota **N-02** (sección 5).

---

## 5. Notas de alineación con el dominio

### N-01 — Respuestas HTTP de OP-35 (aprobada por el usuario en el Paso 1)

`01-dominio.md` no se modifica. Esta nota precisa cómo se implementa OP-35 en HTTP, y prevalece sobre cualquier lectura de "la respuesta siempre es 200":

1. **Token inválido:** la precondición falla, no se guarda nada y la respuesta es **401**. MacroDroid nunca envía un token inválido, así que no hay reintentos no deseados.
2. **Fallo al guardar el SMS (paso 1):** la respuesta es **5xx**, para que MacroDroid reintente. Sin este código, el SMS se perdería y se rompería "se guarda antes de procesarse".
3. **SMS guardado:** la respuesta es **siempre 200**, aunque el procesamiento posterior falle (en ese caso el SMS queda con el resultado "error", como dice OP-35).
4. **Reintentos después de un guardado correcto** (por ejemplo, si se perdió la respuesta 200): llegan con texto idéntico en pocos segundos y el autodescarte de H12 los registra como Autodescartado. Si un reintento llegara más de 10 minutos después, se evaluaría como posible duplicado y decidiría el usuario (P16).

### N-02 — SMS con resultado "error" (aprobada por el usuario en la revisión de la fase)

`01-dominio.md` no se modifica. Esta nota completa OP-35, que deja el SMS guardado con el resultado "error" pero no definía qué ocurre después:

1. **Visibilidad.** Un SMS con resultado "error" aparece en la bandeja con el estado **"error"** y su texto original, y genera una notificación (AV-23, igual que un "no reconocido").
2. **Reprocesar.** El usuario puede reprocesarlo: se vuelven a ejecutar los **pasos 2 a 11 de OP-35** sobre el mismo SMS, como una operación atómica con el bloqueo global (ADR-06).
   - El texto, el remitente y el instante de recepción no cambian (2.2.16).
   - Los pasos se evalúan con el **instante de recepción original**: la ventana de 10 minutos del autodescarte (H12) y la fecha por defecto del paso 5 se cuentan desde ese instante, no desde el momento del reproceso. Así el resultado no depende de cuándo se reprocesa, salvo por los hechos que hayan cambiado (formatos, cuentas, programadas, transacciones).
   - El resultado puede ser cualquiera de los de OP-35 (Autodescartado, No reconocido, Con coincidencia, Posible duplicado o Pendiente) o volver a ser "error".
   - Para respetar la inmutabilidad del registro (2.2.16, DM-7), cada intento de procesamiento se registra **sin sobrescribir** los anteriores; el resultado vigente es el del último intento.
3. **Crear a mano.** Desde el SMS con "error", el usuario puede crear la transacción a mano usando su texto, igual que con un "no reconocido" (P19). La transacción queda vinculada al SMS.
4. **Sin reintento automático.** Ni la tarea diaria ni la apertura de la app reprocesan un SMS con "error". El reproceso automático de ADR-09 se limita a los SMS **sin** resultado (procesamiento interrumpido).

---

## 6. Costos

### 6.1 Costo mensual del stack

| Servicio | Plan | Costo | Límites relevantes (verificados) | Uso estimado de Finn |
|---|---|---|---|---|
| Vercel | Hobby | $0 | 1.000.000 invocaciones; 4 h de CPU activa; 360 GB-h de memoria; 100 GB de transferencia; cron una vez al día; funciones de hasta 300 s; uso personal no comercial | Unos miles de invocaciones al mes; CPU muy por debajo del límite |
| Supabase | Free | $0 | 500 MB de base; 5 GB de egreso; 50.000 MAU; sin respaldos automáticos; pausa tras una semana de inactividad; 2 proyectos activos | < 100 MB en 10 años; egreso ver RK-02 |
| Cloudflare R2 | Nivel gratuito (con medio de pago registrado y alerta de facturación en $0 o el mínimo) | $0 | 10 GB-mes; 1 M operaciones clase A; 10 M clase B; egreso gratis | Unos 42 respaldos de pocos MB (< 0,5 GB); ~60 operaciones de escritura al mes |
| GitHub | Free, repositorio privado | $0 | 2.000 minutos de Actions al mes; 500 MB de artefactos | ~60 pushes × 10–15 min + respaldos (~60 min) + restauración ≈ 1.000 min |
| Web Push | Servicios de push de los navegadores | $0 | — | — |
| Dominio propio | Opcional | No incluido | — | Se usa `*.vercel.app` |
| **Total** | | **$0 al mes** | | |

### 6.2 Si un límite se vuelve insuficiente

| Disparador | Opción | Costo verificado |
|---|---|---|
| Egreso de la base o pausas de Supabase | Supabase Pro: sin pausas, 250 GB de egreso, respaldos diarios de 7 días | Desde $25 al mes |
| Necesidad de cron más frecuente o preciso | Vercel Pro (cron por minuto) | $20 por usuario al mes; o pg_cron en Supabase sin costo (ADR-11) |
| Minutos de GitHub Actions | Reducir E2E a `main`, o ejecutar en runners propios | — |

---

## 7. Riesgos técnicos y mitigación

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RK-01 | Supabase pausa el proyecto por inactividad (por ejemplo, durante un viaje sin uso) | Baja | Alto: la app y el webhook dejan de funcionar | La tarea diaria y el respaldo nocturno consultan la base todos los días; Supabase avisa por correo antes; se restaura desde el panel sin pérdida de datos; durante una pausa los SMS de MacroDroid recibirían 5xx y se reintentarían |
| RK-02 | El egreso de la base supera 5 GB al mes con los años, por cargar todos los hechos | Media a partir del año 4–5 | Medio | Memorización por revisión (con Fluid compute, una instancia caliente casi no recarga); métricas de bytes cargados (ADR-23); alerta al 50 % del límite proyectado; carga incremental preparada en el esquema (2.3); último recurso, Supabase Pro |
| RK-03 | Agentes que usan la documentación o la API de Prisma 8 | Media | Medio | Versión fijada en el lockfile; instrucciones con enlace a `/docs/orm/v7`; regla de lint que prohíbe `@prisma/orm-*` |
| RK-04 | Desfase de un día en fechas por `Date` a medianoche UTC (error 5 de la 1.0) | Media | Alto | `FechaLocal` en el dominio; conversión en un solo módulo con métodos UTC; `TZ=UTC`; pruebas de ida y vuelta en integración, incluido ESC-46 (SMS de las 19:00 del día 20) |
| RK-05 | Instantánea vieja en una escritura por REPEATABLE READ tomado antes del bloqueo | Baja (ya identificado) | Alto | ADR-06: escrituras en READ COMMITTED con el bloqueo como primera sentencia; trigger que exige el bloqueo; prueba de dos escritores concurrentes |
| RK-06 | Incompatibilidad entre el pooler en modo transacción y Prisma 7 (sentencias preparadas, estado de sesión) | Baja | Alto | Solo estado de transacción (`SET LOCAL`, bloqueo transaccional); `pgbouncer=true`; prueba de humo al iniciar la Fase 4; alternativa: pooler en modo sesión también en ejecución |
| RK-07 | La tarea diaria no se ejecuta o se retrasa | Media | Bajo | Idempotencia; ejecución adicional al abrir la app; registro de cada ejecución; push si una ejecución falla |
| RK-08 | Notificaciones push perdidas o suscripción expirada en Android | Media | Bajo | El registro dentro de la app es la fuente de verdad; renovación de la suscripción al abrir; limpieza de suscripciones con 404/410 |
| RK-09 | Quedar fuera de la cuenta por perder el TOTP | Baja | Alto | Dos factores registrados; secreto en el gestor de contraseñas; reinicio del factor desde el panel de Supabase |
| RK-10 | Un respaldo que no se puede restaurar (por ejemplo, por referencias al esquema `auth`), o una clave de cifrado perdida | Baja | Muy alto | Sin referencias hacia `auth` (supuesto para la Fase 3); prueba de restauración mensual en una base sin `auth`, con comprobación de claves foráneas y de invariantes; alerta si el respaldo tiene más de 36 h; clave privada en dos lugares |
| RK-18 | Cargo inesperado en Cloudflare tras registrar el medio de pago | Baja | Bajo | Alerta de facturación en $0 o el mínimo; bucket privado; credencial limitada al bucket; volumen muy por debajo del nivel gratuito |
| RK-11 | Caché del framework que sirve números viejos (error 11 de la 1.0) | Media | Alto | Renderizado dinámico para todo dato del motor; prohibido `"use cache"` sobre derivados; invalidación tras cada operación; E2E que compara números entre pantallas |
| RK-12 | Un agente reimplementa una fórmula en la interfaz o usa flotantes o `Date` en el dominio | Media | Alto | Reglas de lint de frontera (ADR-21); las fórmulas internas no se exportan; los 50 escenarios y las propiedades en cada push |
| RK-13 | El rendimiento del motor crece más de lo estimado | Baja | Medio | Benchmark con presupuesto en CI; perfilar antes de optimizar; cualquier optimización mantiene la función pura |
| RK-14 | Un patrón de formato bancario con retroceso exponencial bloquea la función | Baja | Medio | Verificación del patrón al guardarlo; límite de longitud del SMS; el SMS ya está guardado antes del procesamiento |
| RK-15 | Serwist deja de ser compatible con una versión de Next o Turbopack | Baja | Bajo | Versiones fijadas; alternativa con `--webpack` o service worker propio (ADR-13) |
| RK-16 | Vercel Hobby cambia sus condiciones o considera el uso fuera de lo permitido | Baja | Medio | Uso estrictamente personal; la app es portable (Next estándar); alternativas evaluadas en ADR-10 |
| RK-17 | Sin entorno de staging: una migración defectuosa llega a producción | Media | Alto | Migraciones probadas en CI contra Postgres real; compatibilidad hacia atrás; respaldo nocturno; despliegue solo desde CI |

---

## 8. Supuestos para las fases siguientes

| Fase | Supuesto | Origen |
|---|---|---|
| 3 | Secuencia de creación monótona para el desempate de CB-21 | RT-09 |
| 3 | Tabla de revisión, triggers de sentencia en cada tabla de entrada del motor y verificación del bloqueo | ADR-06, 2.3 |
| 3 | Columna de revisión por fila y tabla de eliminaciones, para la carga incremental | 2.3 |
| 3 | Columnas de montos enteras; fechas de negocio como `date`; instantes como `timestamptz` | ADR-05, ADR-15, ADR-16 |
| 3 | Restricción única SMS → movimiento; inmutabilidad del SMS y de su interpretación inicial | ADR-09, RT-22 |
| 3 | Representación de los formatos bancarios como datos | ADR-09 |
| 3 | Tablas técnicas: suscripciones push, registro de notificaciones, eventos del sistema, último respaldo, hash del token del webhook | ADR-08, ADR-12, ADR-22, ADR-23 |
| 3 | RLS activado sin políticas en todas las tablas; roles de la app y de respaldo | ADR-04 |
| 3 | Ninguna tabla de la app tiene claves foráneas hacia el esquema `auth` ni guarda el identificador de usuario de Supabase; la relación con el usuario único se resuelve en la capa de aplicación | ADR-22 |
| 3 | Registro de intentos de procesamiento de un SMS sin sobrescribir los anteriores (resultado vigente = último intento) | Nota N-02 |
| 4 | Servicio de transacciones que encapsula el protocolo de ADR-06 | ADR-06 |
| 4 | Forma de la instantánea del motor y de los selectores; operación en seco para la simulación previa | ADR-07 |
| 4 | Prueba de humo de Prisma 7 + pooler en modo transacción antes de construir sobre ella | ADR-05, RK-06 |
| 4 | Flujo de TOTP, protección de las acciones de las notificaciones, qué avisos generan push | ADR-08, ADR-12 |
| 4 | Operaciones sobre un SMS con resultado "error": reprocesar (pasos 2 a 11 de OP-35 con el instante de recepción original, atómico y con el bloqueo global) y crear la transacción a mano vinculada al SMS; notificación AV-23; sin reintento automático | Nota N-02 |
| 4 | La autorización comprueba el usuario único en la capa de aplicación, sin depender de claves foráneas hacia `auth` | ADR-08, ADR-22 |
| 4 | Contrato de los adaptadores CSV; formato de la exportación JSON | ADR-17, ADR-22 |
| 5 | Tokens de la identidad visual, componentes, librería de gráficos, refresco tras medianoche | ADR-14, RT-21 |

---

## 9. Fuentes (verificadas el 11 de octubre de 2026)

- Supabase, precios y límites del plan gratuito: https://supabase.com/pricing
- Supabase, pausa de proyectos gratuitos: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase, conexión a Postgres (modos del pooler, IPv4/IPv6, limitaciones del modo transacción): https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase, guía de Prisma: https://supabase.com/docs/guides/database/prisma
- Supabase, MFA con TOTP: https://supabase.com/docs/guides/auth/auth-mfa/totp
- Prisma 7, transacciones e isolation levels: https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions
- Prisma 7, PgBouncer y Supavisor: https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/pgbouncer
- Prisma, estado de versiones (Prisma 8 RC, soporte de Prisma 7): https://www.prisma.io/docs/orm/release-status
- Prisma 8, transacciones (sin isolationLevel ni timeout): https://www.prisma.io/docs/orm/fundamentals/transactions
- Prisma, fechas `@db.Date` devueltas a medianoche UTC: https://github.com/prisma/orm/discussions/29168
- Comparativa de arranque en frío Prisma 7 / Drizzle (fuente de terceros, orientativa): https://techsy.io/es/blog/prisma-vs-drizzle-orm-comparacion
- Vercel, plan Hobby: https://vercel.com/docs/plans/hobby
- Vercel, límites de funciones: https://vercel.com/docs/limits
- Vercel, límites de cron: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel, versiones de Node.js: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Cloudflare R2, precios y nivel gratuito: https://developers.cloudflare.com/r2/pricing/
- GitHub Actions, minutos incluidos: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Temporal en Node.js 26 y navegadores: https://nodesource.com/blog/javascript-temporal-history-nodejs-26
- Next.js 16, Turbopack por defecto: https://nextjs.org/docs/app/api-reference/turbopack
- node-postgres, conversión de tipos de fecha: https://node-postgres.com/features/types

---

## 10. Registro de cambios de la revisión final

| Cambio | Origen | Secciones afectadas |
|---|---|---|
| Alerta de facturación de Cloudflare en $0 (o el mínimo disponible) al registrar el medio de pago de R2 | Respuesta 1 de la revisión | 0.5, ADR-22, 6.1, RK-18 |
| SMS con resultado "error": visible en la bandeja, notificado, reprocesable a mano o convertible en transacción a mano; sin reintento automático | Respuesta 2 de la revisión | 0.5, ADR-09, 4.2, nota N-02, sección 8 |
| Sin referencias de la app hacia el esquema `auth`; la prueba de restauración se hace en una base sin `auth` y comprueba las claves foráneas | Corrección 3 de la revisión | 0.5, ADR-08, ADR-22, RK-10, sección 8 |
| Estado del documento: Aprobado — Fase 2 cerrada | Aprobación del usuario | Encabezado |


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Este documento no se modifica; cada línea indica qué cambia y dónde está el detalle.

- **PR-1** (Fase 4, aprobada en la revisión de la Parte A). **ADR-20, dependencias permitidas:** `db`, `sms` y `conciliacion` pueden importar en ejecución `@finn/dominio/valores` (`Centavos` y `FechaLocal`); del resto de `@finn/dominio`, solo tipos. `@finn/sms` y `@finn/aplicacion` son paquetes nuevos. Detalle en `04-backend.md` §0.9 y `04-backend.md` §1.3.
- **PF-1** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`, P5-1). **ADR-14 y 0.5 (fila "Estilos"):** se conservan las **herramientas** (Tailwind CSS v4 con tokens en `@theme`, shadcn/ui solo como primitivos, next-themes por clase y `next/font` autohospedado) y se **retiran** los valores, las tipografías (Instrument Serif, Geist y Geist Mono) y toda la identidad de la 1.0. Los tokens son los semánticos de `05-frontend.md` §10, con valores de Claude Design; hasta entonces, valores neutros provisionales y la fuente del sistema. Detalle en `05-frontend.md` §0.8 y §10.
- **PF-2** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`, P5-2). **ADR-14 ("H1 exige distinguir sobregiro de débito y de tarjeta por color"):** se distinguen con color **y** un indicador no cromático con nombre accesible. Detalle en `05-frontend.md` §0.8 y §10.3.
- **PF-3** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`, P5-3). **ADR-07 (consecuencias), "La interfaz no hace aritmética con montos":** salvo sumas y restas con las funciones de `Centavos` de `@finn/dominio/valores`, solo en los componentes de formulario y solo como ayuda visual de lo que el usuario está escribiendo; el resultado nunca se envía al servidor ni reemplaza un derivado del motor, y una regla de lint limita la importación. En `04-backend.md` se aplica con CP-6 (§1.3 y §13.3). Detalle en `05-frontend.md` §0.8 y §5.1.
- **CT-01, CT-04 y CT-05** (Fase 7, aprobados en las revisiones de las partes A y C de `07-pruebas.md`). **ADR-01:** TypeScript estricto en todo el código de la aplicación; los activos de prueba fuera de `apps/` y `packages/` pueden usar otro lenguaje (primer caso: el oráculo `tools/pruebas/oraculo/motor_min.py`). **ADR-19, "Reloj inyectable":** el reloj de prueba solo se activa con `FINN_ENTORNO === 'pruebas'` y `VERCEL_ENV` sin definir (lista de permitidos); fuera de eso, con la variable del reloj la app no arranca y la función lo ignora; `NODE_ENV` no decide. **ADR-19, niveles:** se agrega el nivel de componentes con el modo navegador de Vitest y el Chromium de Playwright. Detalle en `07-pruebas.md` §3.1, §4.3 y §10.
- **CT-09** (Fase 7, aprobado en la revisión de la Parte D de `07-pruebas.md`). **ADR-10:** el despliegue a producción sigue siendo desde GitHub Actions; única excepción, el despliegue de emergencia desde la PC del usuario con `vercel deploy --prod` (PRU-MAN-OPER-002), solo si `desplegar` no puede correr y hay un error de dinero o de seguridad que `vercel rollback` no resuelve, con los mismos scripts de `rapido`, `integracion` y `politica-patrones` en local y **sin migraciones** (la regla de que una migración precede al código no tiene excepción). **ADR-22:** durante las primeras 8 semanas desde la apertura de la puerta, la prueba de restauración corre cada semana; después vuelve a ser mensual. Detalle en `07-pruebas.md` §31.
