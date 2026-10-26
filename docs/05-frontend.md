# Finn 2.0 — Arquitectura del frontend (05-frontend.md)

**Fase:** 5. **Estado:** **Aprobado — Fase 5 cerrada** (15 de octubre de 2026). Partes A, B, C y D aprobadas; los ajustes de cada revisión están marcados **[R1]** a **[R4]** (0.12). Los cambios CP-1 a CP-18 están aplicados en `04-backend.md` (su §0.9.1) y las precisiones PF-1 a PF-3, anotadas en las "Enmiendas posteriores" de 00, 01 y 02. El código de las verificaciones va en `05-frontend-verificacion-A.zip` a `05-frontend-verificacion-D.zip`.

**Enmiendas de la Fase 6** **[F6]**: los cambios CF-01, CF-02, CF-04 a CF-08, CF-10 a CF-13, CF-15, CF-17 a CF-19, CF-21 a CF-23 y CF-25 de `06-features.md` (§0.7 de ese documento) se aplicaron a este documento al cerrar la Fase 6 (21 de octubre de 2026). Cada sección afectada lleva la marca **[F6]**; la lista está en 0.13 y en "Enmiendas posteriores", al final. CF-03 queda diferido; CF-25 se aplicó con la revisión de la Parte E y P6-26 y P6-27 son ajustes del diseño (06 §5.6), sin cambios aquí. Los props de los componentes visuales de la identidad (CF-13) están en 10.8.1.

Plan de entrega aprobado:

| Parte | Secciones |
|---|---|
| A — Fundamentos | 0, 1, 4, 5, 6, 12 |
| B — Pantallas | 2, 3, 7, 9 |
| **C — Sistema de diseño y calidad** | 10, 11, 13, 14 |
| D — PWA y cierre | 8, 15, 16 |

Las secciones conservan la numeración del encargo. El orden del documento es el de la entrega: 0, 1, 4, 5, 6, 12, 2, 3, 7, 9, 10, 11, 13, 14, 8, 15 y 16, y al final el **Anexo A, "Encargo para Claude Design"** **[R3]**, que se entrega también por separado y se lee sin el resto.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento define la arquitectura de `apps/web` con el detalle suficiente para que, en la Fase 8, cualquier agente implemente cada pantalla sin tomar decisiones de diseño: qué rutas hay, qué consulta y qué operaciones usa cada una, cómo se comporta en cada estado y con qué componentes se construye.

### 0.2 Alcance

- **Incluye:** estructura de `apps/web`, rutas y layouts, frontera entre Server y Client Components, patrón de formularios y escritura, entrada de montos y fechas, formato, estado en el cliente, navegación, estados de pantalla, PWA, autenticación en la interfaz, contrato del sistema de diseño, accesibilidad, textos, rendimiento, convenciones para pruebas y trazabilidad.
- **No incluye:** identidad visual, especificación funcional por feature (Fase 6), plan de pruebas (Fase 7) y tareas (Fase 8). No agrega consultas ni operaciones: lo que falta se registra como cambio propuesto a 04 (0.9).
- **Regla general (respuesta al Paso 1).** La identidad visual **y los patrones de presentación** los define Claude Design. Este documento define la arquitectura de la información, las rutas, los datos y los comportamientos. No fija el tipo de menú (barra, lateral, pestañas…) ni el tipo de contenedor (hoja, diálogo, panel): define los **requisitos** que cualquier presentación debe cumplir y los componentes como **contratos** (qué reciben, qué exponen, qué estados expresan).

### 0.3 Precedencia

1. `00-decisiones.md` > `01-dominio.md` > `02-tecnologias.md` > `03-base-de-datos.md` > `04-backend.md`, cada uno con sus enmiendas posteriores, y el documento de producto, mandan sobre este documento.
2. Este documento manda sobre la implementación de `apps/web` en las fases 6 a 8.
3. Las precisiones a 00–02 se registran en 0.8; los cambios a 04, en 0.9. Ninguno se aplica a su documento hasta cerrar esta fase.

### 0.4 Convenciones

| Marca | Significado |
|---|---|
| **FE-nn** | Decisión de esta fase (registro en 0.6) |
| **V5-nn** | Verificación ejecutada en esta fase (0.7) |
| **PF-n** | Precisión o enmienda aprobada a 00, 01 o 02 (0.8) |
| **CP-n** | Cambio propuesto a 04, que se aplica al cerrar la fase (0.9) |
| **PA-n** | Pregunta abierta de la Parte A (0.10) |
| **P5-n** | Pregunta del Paso 1 (resueltas en 0.5) |
| **[Diseño]** | Lo decide Claude Design; aquí solo está el requisito |
| **[L]**, **[C]** | Flujo largo (pantalla completa) y flujo corto (presentación libre), FE-04 |
| **[1T]** | Acción de un toque, sin URL propia (FE-24) |
| **[R1]** | Cambio de la revisión de la Parte A (0.12) |
| **[R2]** | Cambio de la revisión de la Parte B (0.12) |
| **[R3]** | Cambio de la revisión de la Parte C (0.12) |
| **[R4]** | Cambio de la revisión de la Parte D (0.12) |
| **PD-n** | Pregunta de la Parte D (16.5) |
| **PC-n** | Pregunta de la Parte C (0.10) |
| **PB-n** | Pregunta de la Parte B (0.10) |
| *(B)*, *(C)*, *(D)* | Elemento agregado en la Parte B, C o D en una tabla o sección que viene de una parte anterior |
| OP-nn, OPT-nn, BE-nn, QB-n, SP-nn, RS-nn | Referencias a `04-backend.md` |
| ADR-nn, RT-nn, RK-nn | Referencias a `02-tecnologias.md` |
| §n, AV-nn, inv. n, ESC-nn | Referencias a `01-dominio.md` |

**Nombres.**
- Rutas: español, sin tildes, en minúscula y separadas por guiones (`/por-cobrar`, `/presupuesto/listo-para-asignar`). Parámetros de búsqueda en español y en minúscula (`?periodo=`, `?no-leidas=1`).
- Componentes: `PascalCase` en español (`EntradaMonto`, `FilaCategoria`). Hooks: `useX` con el resto en español (`useOperacion`). Archivos: `kebab-case`.
- Consultas, operaciones, DTO, códigos y avisos: exactamente como en 04.

### 0.5 Respuestas del Paso 1

| # | Respuesta | Dónde se aplica |
|---|---|---|
| Regla general | Presentación y forma visual las define Claude Design; aquí, requisitos y contratos | 0.2, todo el documento |
| P5-1 | Aprobada: precisión a ADR-14 (se conservan las herramientas; se retiran valores, tipografías e identidad de la 1.0) | PF-1 (0.8) |
| P5-2 | Aprobada: enmienda de H1 (color + indicador no cromático con nombre accesible; montos al tocar) | PF-2 (0.8); contrato en §10 (Parte C) |
| P5-3 | Aprobada con límites: sumas y restas de lo que el usuario escribe, solo como ayuda visual; nunca un valor enviado; regla de lint | PF-3 (0.8), CP-6 (0.9), FE-22, §5.1 |
| P5-4 | Aprobada: catálogo cerrado de destinos por motivo; sin destino → centro de notificaciones | CP-1 (0.9); rutas en §3 (Parte B) |
| P5-5 | Aprobada: `bandejaPorRevisar` en el `Encabezado` | CP-2 (0.9), FE-06 |
| P5-6 | Aprobada: Server Actions de solo lectura para sugerencia y búsqueda de compras, con espera, mínimo, cancelación y límite | CP-3 (0.9), FE-15 |
| P5-7 | Aprobada: `mfa.listFactors()` en el servidor | CP-4 (0.9) |
| P5-8 | Aprobada: `router.refresh()` al volver tras más de 60 s, al recuperar la conexión y a la medianoche | FE-21 |
| P5-9 | Aprobada; verificar la Skew Protection en Hobby | FE-13, V5-14 |
| P5-10 | Arquitectura de navegación sin fijar el tipo de menú | §3 (Parte B); secciones en el árbol de 1.2 |
| P5-11 | Flujos largos en pantalla completa; cortos con URL propia y presentación libre; rutas interceptadas | FE-04 |
| P5-12 | Aprobada: `inputMode="decimal"`, acepta "." y ",", signo aparte, sin calculadora | FE-17 |
| P5-13 | Aprobado: SVG propio con `d3-scale` y `d3-shape`, sujeto a medición; tabla o resumen accesible | V5-13 (medición); §10 y §13 (Parte C) |
| P5-14 | Aprobados los presupuestos y su verificación en CI | §13 (Parte C) |
| P5-15 | Aprobada: tarjeta "Activar notificaciones" con gesto, repetible desde Ajustes | CP-5 (0.9); §8 (Parte D) |
| Supuestos | Aprobados; los borradores de los flujos largos van en `sessionStorage` | FE-14 y el resto de la Parte A |

### 0.6 Registro de decisiones (Parte A)

| ID | Decisión | Sección |
|---|---|---|
| FE-01 | Estructura de carpetas de `apps/web` | 1.1 |
| FE-02 | Grupos de rutas y layouts: raíz, `(finn)` autenticado, `ingresar` y `sin-conexion` | 1.2 |
| FE-03 | Rutas en español; cada sección, pantalla y flujo con su URL; parámetros de búsqueda como estado | 1.3 |
| FE-04 | Flujos largos y cortos; los cortos se interceptan en el slot `@superpuesto` y funcionan como página completa | 1.4 |
| FE-05 | Regla de Server y Client Components | 1.5 |
| FE-06 | El `Encabezado` lo publica cada página hacia el marco; el layout no consulta | 1.6, 6.4 |
| FE-07 | Envío con `confirmar` por defecto; `previsualizar` primero solo en una lista cerrada | 4.4 |
| FE-08 | Id de creación perezoso, conservado hasta un éxito y guardado en el borrador | 4.5 |
| FE-09 | Instantánea de los valores `esperado` al abrir el flujo | 4.6 |
| FE-10 | Tratamiento de cada categoría de `ResultadoAccion` y reintento automático único | 4.7 |
| FE-11 | Fallo de red = `INCIERTO`; sin conexión no se envía | 4.8 |
| FE-12 | Prevención del doble envío | 4.9 |
| FE-13 | Desfase de versión: error propio "Hay una versión nueva" (sin Skew Protection en Hobby) | 4.10 |
| FE-14 | Borradores de los flujos largos en `sessionStorage` por pestaña | 4.11 |
| FE-15 | Lecturas interactivas: espera, mínimo, una en vuelo, descarte y límite | 4.12 |
| FE-16 | React Hook Form con el resolvedor de Zod sobre los contratos de 04 | 4.2 |
| FE-17 | `EntradaMonto`: normalización, pegado, signo y vista previa | 5.2 |
| FE-18 | Módulo único de formato, sin flotantes | 5.4 |
| FE-19 | Fechas de negocio como `FechaLocal`, "hoy" del servidor y formato por reordenamiento | 5.5 |
| FE-20 | Sin caché de números en el cliente; dónde vive cada estado | 6.1, 6.2 |
| FE-21 | Refresco automático (volver, reconexión, medianoche, atrás/adelante) | 6.7 |
| FE-22 | Reglas de lint del cliente | 1.7 |
| FE-23 | Catálogo de textos de la interfaz y glosario | §12 |
| FE-24 **[R1]** | Acciones de un toque sin URL y salida para revertir con la operación inversa | 4.14 |
| FE-25 **[R1]** | "Aprobar" con un toque en la lista de la bandeja; traspaso al flujo si el servidor pide datos | 4.15 |
| FE-26 *(B)* | Una consulta por página; tres excepciones sin consulta | 2.1 |
| FE-27 *(B)* | Conversión de los parámetros de búsqueda a los de la consulta | 2.2 |
| FE-28 *(B)* | `consultar()`: traducción de los errores de una consulta; `idError` como `digest` de Next | 7.3 |
| FE-29 *(B)* | Arquitectura de navegación: requisitos N1 a N8 y contratos | 3.1 a 3.3 |
| FE-30 *(B)* | Sección activa por prefijo de ruta | 3.3 |
| FE-31 *(B)* | Navegación entre períodos con enlaces y el período activo sin parámetro | 3.4 |
| FE-32 *(B)* | Destinos de las notificaciones: traducción a rutas y marca de leída al abrir | 3.5 |
| FE-33 *(B)* | Estados de carga: `loading.tsx` por segmento y en el slot | 7.1 |
| FE-34 *(B)* | Tres clases de estado vacío | 7.2 |
| FE-35 *(B)* | Comportamiento en pantalla sin conexión | 7.4 |
| FE-36 *(B)* | Rutas de acceso y su tabla de redirecciones | 9.2 |
| FE-37 *(B)* | Inscripción de TOTP: limpieza de factores sin verificar; el secreto nunca se guarda | 9.5 |
| FE-38 *(B)* | Código TOTP sin envío automático | 9.4 |
| FE-39 *(B)* | Señal inmediata al navegar: `EnlaceFinn` con `useLinkStatus` e indicador global | 7.1 |
| FE-40 *(C)* | Tokens como variables CSS `--finn-*` en `tokens.css`, expuestos a Tailwind con `@theme inline`; tema oscuro por clase | 10.1 |
| FE-41 *(C)* | Tabla única de estados financieros e indicador con triple señal (color, forma, nombre) | 10.3 |
| FE-42 *(C)* | Tipografía por roles abstractos; cifras tabulares y `rem` obligatorios | 10.4 |
| FE-43 *(C)* | Componentes en tres capas: `components/ui` (shadcn), `componentes/base` (API de Finn) y componentes de Finn | 10.7 |
| FE-44 *(C)* | Gráficos como Server Components; d3 nunca en el cliente | 10.8 |
| FE-45 *(C)* | `Monto` como único componente de montos, con texto accesible explícito ("menos $X") | 10.8 |
| FE-46 *(C)* | Objetivo WCAG 2.2 AA y verificación automática que bloquea la CI, más revisión manual por entrega | 11.10 |
| FE-47 *(C)* | Objetivos táctiles de 44 × 44 px | 11.5 |
| FE-48 *(C)* | Presupuestos verificados en CI midiendo en el navegador (tamaño, INP) y con Lighthouse CI (LCP, CLS) | 13.4 |
| FE-49 *(C)* | Reglas que mantienen el presupuesto de JS | 13.3 |
| FE-50 *(C)* | Configuración de Playwright: producción, dos tamaños, zona de El Salvador y zona distinta, un trabajador para datos | 14.1 |
| FE-51 *(C)* | Elementos por rol y nombre del catálogo de textos; atributos de prueba como contrato | 14.2, 14.3 |
| FE-52 *(D)* | Service worker con `@serwist/turbopack`, servido estático por `GET /serwist/[path]` (CP-17) | 8.1 |
| FE-53 *(D)* | El service worker solo precachea archivos estáticos y `/sin-conexion`; todo lo demás, solo red (sin `defaultCache`) | 8.3 |
| FE-54 *(D)* | Registro propio del service worker, sin `SerwistProvider` | 8.4 |
| FE-55 *(D)* | Actualización sin `skipWaiting`: aviso "Hay una versión nueva" y "Recargar" | 8.4 |
| FE-56 *(D)* | Sin conexión, `EnlaceFinn` y `useNavegacionFinn` no navegan; `/sin-conexion` para la navegación de documento | 8.5 |
| FE-57 *(D)* | Push: suscripción, evento `push`, toque y acciones desde la notificación | 8.6 |
| FE-58 *(D)* | Instalación a pedido desde Ajustes | 8.7 |
| FE-59 *(D)* | Nombre de la carpeta de un flujo derivado de su ruta | 15.5 |

### 0.7 Verificación realizada

**Entorno.** Node.js **24.22.0** (ICU 78.3, la versión de producción de ADR-03); Next.js **16.4.1** y React **19.3.1** (`next build` + `next start`, Turbopack); Chromium **141** con Playwright 1.56 (sin pantalla); esbuild 0.25; ESLint 9.39.5 con typescript-eslint 8.71.2; React Hook Form 7.90.0, `@hookform/resolvers` 5.9.1 y Zod 4.6.7.

Las verificaciones de la Parte B (V5-15 a V5-19) usan el mismo entorno y la misma aplicación de prueba, con rutas agregadas. Las de la Parte C (V5-20 a V5-28) usan una segunda aplicación de prueba con los tokens, Tailwind CSS **4.3.3** (`@tailwindcss/postcss`), axe-core **4.14.0** y Lighthouse **12.8.2**. Las de la Parte D (V5-29 a V5-36) usan una tercera, igual a la segunda más `@serwist/turbopack` y `serwist` **9.5.13** y esbuild **0.25**, y Chromium completo sin pantalla (`channel: 'chromium'`) para las notificaciones. La aplicación de prueba **no tiene base de datos**: simula en memoria las respuestas de 04 (`ResultadoAccion`, huella, idempotencia por id, conflictos) para verificar el contrato de la interfaz con Next real. Lo que verifica es el comportamiento del cliente y del framework, no el del backend.

| # | Qué se verificó | Resultado |
|---|---|---|
| V5-01 | Normalización de `EntradaMonto` (`normalizarMontoEscrito`, `limpiarPegado`) | 22 casos de tabla y 8 de pegado con el resultado esperado. Propiedad: 900.000 textos (cada monto de 0 a 21.474.836,47 escrito con punto, coma, ceros a la izquierda y sin decimales) producen un texto que cumple `montoTexto` de 04 §13.3 y vuelve exactamente a los mismos centavos. En Node 24 y en Chromium (configuración regional `es-SV` y `en-US`) |
| V5-02 | Módulo de formato (**[F6]** CF-15: las salidas fijadas pasan a `−$45.00`, y un caso comprueba que la exportación CSV sigue con `-45.00`) | `$1,234.50`, `-$45.00`, `$0.75`, `$21,474,836.47`, `05/10/2026`, `5 oct 2026`, `05/10/2026 14:32`, `45.5%`: correctos en Node 24 y en Chromium. 400.000 montos (los 200.000 alrededor de cero y 200.000 al azar en todo el rango) formateados desde texto decimal coinciden con una referencia construida a mano. **Observaciones:** ICU escribe septiembre como **"sept"** y separa fecha y hora del instante con **coma** (`05/10/2026, 14:32`); por eso el mes abreviado sale de una tabla propia y el instante se arma con `formatToParts` (5.4). El porcentaje de ICU para `es-SV` no lleva espacio (`45.5%`) |
| V5-03 | Escritura con Server Action en Next 16 | a) Una escritura simple actualiza la página con la respuesta de la acción (`revalidatePath('/', 'layout')`), sin refrescar a mano; el formulario conserva su `esperado` al abrir. b) `REQUIERE_CONFIRMACION` → se muestra la previsualización → confirmar con `revisionVista` y `huellaImpacto` escribe al primer intento: exactamente **dos** llamadas. c) Dos pestañas: la segunda recibe `conflicto_desactualizado` |
| V5-04 | Doble envío | Tres `requestSubmit()` en el mismo ciclo, con una acción de 800 ms → **una** llamada |
| V5-05 | Id conservado y reintento único | `OCUPADO` en el primer intento → reintento automático con el mismo id → éxito (2 llamadas). `INCIERTO` después de aplicar → reintento con el mismo id → `yaAplicada` sin duplicar. El siguiente envío tras un éxito usa un id nuevo |
| V5-06 | Flujo corto en ruta interceptada | a) Navegación interna a `/asignar`: se muestra en el slot y la página de origen sigue montada. b) Al terminar, `router.back()` lo cierra y vuelve a `/` con los datos nuevos. c) Recargar con el flujo abierto → página completa. d) Abrir la URL directamente → página completa. e) "Atrás" del navegador lo cierra |
| V5-07 | `router.refresh()` | Trae datos nuevos y conserva el estado de los componentes de cliente (un borrador a medio escribir sigue intacto) |
| V5-08 | Lectura interactiva | Con 1 carácter no consulta. Con "ab" (respuesta lenta) seguido de "abc", se hacen 2 consultas y la respuesta de "ab" se descarta |
| V5-09 | Desfase de versión | Pestaña abierta con la versión 1; se publica una versión 2 en la que la acción cambió de nombre. El envío recibe **409** y la llamada lanza `Server Action "…" was not found…`; el envoltorio lo reconoce como `version_nueva`. **Hallazgo:** los ids de las Server Actions son **estables** entre compilaciones mientras no cambien el archivo ni el nombre exportado (tres compilaciones, incluida una con el cuerpo de la acción cambiado, dieron los mismos ids) |
| V5-10 | Agenda de la medianoche de El Salvador | 8 de 8 (fin de mes, de año y bisiesto; reloj del dispositivo adelantado y atrasado; sin bucle), igual con `TZ` = UTC, America/El_Salvador y Asia/Tokyo |
| V5-11 | Orden de las Server Actions | Una escritura sola tarda 132 ms; la misma escritura lanzada mientras una lectura de 900 ms está en vuelo tarda **875 ms**. Next despacha las Server Actions del cliente **de una en una**. Consecuencias en 4.9 y 4.12 |
| V5-12 | Regla de lint de PF-3 | `@typescript-eslint/no-restricted-imports` con `allowTypeImports`: rechaza la importación en ejecución de `@finn/dominio/valores` fuera de los formularios, acepta `import type` en cualquier lugar y rechaza `@finn/dominio` incluso en los formularios |
| V5-13 | Peso (esbuild, minificado, gzip -9) | React Hook Form + resolvedor de Zod: **14,5 KB**. Zod 4 con `import { z } from 'zod'`: **92,5 KB** (arrastra todas las configuraciones regionales); con `import * as z from 'zod'`: **25,1 KB**; más la configuración regional en español: **25,9 KB**; `zod/mini`: **6,2 KB**. `d3-scale` + `d3-shape` (las funciones de los gráficos): **17,0 KB**. Son medidas de esbuild; la Parte C las repite con la compilación real de Next. **[R3] Corrección:** en la compilación real de Next (V5-20), `import { z } from 'zod'` **pesa lo mismo** que `import * as z from 'zod'` (+43,4 KB frente a +43,3 KB): Turbopack elimina las configuraciones regionales que no se usan, y la diferencia de 92,5 KB frente a 25,1 KB es solo de esbuild. Las cifras de esta fila no valen para Next. L9 se mantiene (PA-1) por coherencia, sin justificación de peso |
| V5-14 | Skew Protection de Vercel (documentación, actualizada el 16 de septiembre de 2026) | **Solo en los planes Pro y Enterprise**; no existe en Hobby. Además, no está disponible para despliegues `--prebuilt`. Ver FE-13 |
| V5-15 *(B)* | `error.tsx` en producción | a) Un `Error` con `digest = 'E-7K2QPX'` lanzado desde un Server Component llega a `error.tsx` con ese mismo `digest`: Next respeta un `digest` que ya trae el error. b) El mensaje original no llega al navegador (se recibe el mensaje genérico de React). c) Un error sin `digest` llega con un `digest` numérico de Next y sin su texto. El registro del servidor contiene el `digest` |
| V5-16 *(B)* | Sesión vencida en una consulta | a) `consultar()` con `NO_AUTORIZADO` redirige a `/ingresar?volver=/protegida%3Fperiodo%3D2026-09-21`, armado con la cabecera `x-finn-ruta` que agrega `proxy.ts` (ruta y búsqueda). b) `volver=//evil.example/x` se reemplaza por `/`. c) `volver=/\evil.example` también |
| V5-17 *(B)* | `NO_ENCONTRADO` en una consulta | `notFound()` muestra `not-found.tsx` con estado HTTP 404 |
| V5-18 *(B)* | Cobertura del mapa de pantallas (`cobertura.py`, al estilo de BE-63) | T1 a T8 pasan sobre este documento: 72 rutas del árbol de 1.3 y 76 filas en §2 (las 72 más 4 de acceso y estáticas); 18 de 18 consultas de 04 §6; 16 de 16 variantes de `formulario` (incluida la de CP-10c); 60 de 61 operaciones (falta solo OP-35, el webhook, que no tiene pantalla); 24 de 24 avisos; la matriz de 04 §6.0.4 completa; 9 destinos de notificación con su ruta. Control negativo: al quitar una fila, una consulta, un aviso y un destino, y al escribir mal una variante, falla con los 7 errores esperados |
| V5-19 *(B)* | Señal al navegar hacia un segmento lento (2 s) con `loading.tsx`, en una ruta normal y en una interceptada | Con el prefetch del enlace terminado, `loading.tsx` aparece en 6 de 6 navegaciones (61 a 122 ms). Con `prefetch={false}`, solo en 5 de 12; en las demás no hay señal hasta el contenido. `useLinkStatus` dentro del enlace marca la navegación pendiente en 5 de 6 navegaciones sin prefetch (64 a 147 ms). Ver FE-39 |
| V5-20 *(C)* | JS por ruta en la compilación real (tamaño transferido con gzip, contexto nuevo de Chromium) | Base (marco mínimo con `EnlaceFinn`): 139,1 KB. Formulario con React Hook Form y Zod: +43,3 KB; con la configuración en español: +44,6 KB; con `import { z }`: +43,4 KB; con `zod/mini`: +33,0 KB. Gráfico en Server Component: sin JS propio; en Client Component: +9,5 KB. Next 16 con Turbopack no imprime tamaños en `next build`. Ver 13.2 y PC-1 |
| V5-21 *(C)* | D-8 repetida esperando la hidratación (10 navegaciones sin prefetch hacia un segmento de 1,5 s) | `useLinkStatus` dio la señal en **10 de 10** (42 a 97 ms). b) Con los scripts demorados, un clic **antes** de hidratar no se pierde: React lo repite al hidratar y la navegación es del cliente (5 de 5), pero hasta entonces no hay ninguna señal |
| V5-22 *(C)* | Caché del enrutador con los `staleTimes` por defecto | Atrás y adelante restauran la página de la caché (mismo render); un enlace a la misma página hace un render nuevo. Confirma 6.1 y D-1 |
| V5-23 *(C)* | Contraste de los tokens provisionales (`contraste.py`) | 164 pares (82 por tema), 0 fallos. `texto-deshabilitado`: 2,56:1 y 2,29:1 (exento). **[R3]** Con los tokens de gráficos y marca: 224 pares (112 por tema), 0 fallos; peor serie 4,72:1 (claro) y 5,62:1 (oscuro) |
| V5-24 *(C)* | axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`) | Sin violaciones en la página de tokens (claro y oscuro) ni en las de base, formulario y gráfico. Control negativo: detecta los tres fallos sembrados (contraste, botón sin nombre, campo sin etiqueta) y `target-size` en los dos temas. `@theme inline` y `.dark` aplican los valores esperados; el CSS pesa 3,4 KB con gzip |
| V5-25 *(C)* | Árbol de accesibilidad (`ariaSnapshot` de Playwright) | `Monto` se lee "menos $1,234.50" y su texto visible queda fuera del árbol; `IndicadorEstado` aporta su etiqueta; el gráfico es `img` con nombre y tiene su tabla equivalente con encabezados |
| V5-26 *(C)* | Lighthouse 12 indicativo (perfil móvil) | Accesibilidad 100 en las cuatro páginas; LCP de 1,10 a 2,38 s; CLS 0; TBT de 134 a 423 ms, con ruido de la máquina compartida |
| V5-27 *(C)* | a) INP de laboratorio con CPU ×4; b) movimiento reducido | a) Interacción más lenta de 40 a 56 ms en 5 corridas (escribir, error de validación, enviar). b) Con `prefers-reduced-motion: reduce`, transiciones y animaciones de `1e-05s`; sin la preferencia, `0.3s` |
| V5-28 *(C)* | Foco y anunciador de rutas tras navegar con un enlace | El foco queda en `body`; el anunciador lee el título del documento o, si no cambió, el `h1`. Ver 11.2 |
| V5-29 *(D)* | Service worker con `@serwist/turbopack` en `next build` | `/serwist/sw.js` estático con `Service-Worker-Allowed: /`, alcance `/`, controla la app tras recargar; 11,7 KB con gzip. Precache de la app de prueba: 25 archivos, 248 KB con gzip. Después de navegar con red, ninguna página ni respuesta RSC en Cache Storage. Sin `sourcemap: false`, se publicaba `/serwist/sw.js.map` |
| V5-30 *(D)* | Sin conexión | a) Navegación de documento → contenido de `/sin-conexion` con la URL pedida. b) **Hallazgo:** un enlace del cliente sin red termina en navegación de documento y `/sin-conexion` (se pierde la pantalla). c) Con `EnlaceFinn` comprobando `navigator.onLine`, la pantalla se conserva y se emite el aviso. Playwright no aplica `setOffline` a los pedidos del service worker: hubo que detener el servidor |
| V5-31 *(D)* | Instalabilidad | Sin errores con un perfil persistente (`Page.getInstallabilityErrors`) |
| V5-32 *(D)* | Push y toque (eventos sintéticos en el service worker) | La notificación lleva título, cuerpo, `tag`, acciones y datos; una carga inválida muestra el texto genérico; el toque navega la ventana a `/bandeja/<id>?notificacion=<id>`; "Confirmar" con 404 abre el movimiento. La entrega real por el servicio de push no es alcanzable desde el contenedor |
| V5-33 *(D)* | Actualización con dos compilaciones | La pestaña vieja muestra "Hay una versión nueva"; un archivo de la versión 1 que el servidor nuevo ya no tiene (404) se sigue sirviendo desde el service worker viejo (200); "Recargar" activa la versión 2 |
| V5-34 *(D)* | Peso del registro | Registro propio: +0,5 KB en el compartido; `SerwistProvider`: +2,4 KB |
| V5-35 *(D)* **[R3]** | Método de 13.4 (PC-1) | Compartido 136,0 KB; biblioteca de formularios 46,2 KB (los archivos comunes a las rutas con formulario y a ninguna otra); JS propio de las rutas de 0 a 3,6 KB |
| V5-36 *(D)* | Trazabilidad generada (`trazabilidad.py`) | 18 de 18 consultas y 60 de 61 operaciones con pantalla (falta OP-35, el webhook); 49 carpetas de flujo, sin repetidas; §15 coincide con lo generado |

Los scripts y la aplicación de prueba van en el zip, con un `LEEME.md` que relaciona cada V5-nn con su archivo.

### 0.8 Precisiones y enmiendas a documentos aprobados

Se registran aquí y, al cerrar la fase, cada una se anota con una línea en la sección "Enmiendas posteriores" del documento afectado. **Anotadas al cerrar la Fase 5:** PF-1 en 02; PF-2 en 00 (H1 y 2.16), 01 (AV-02 y AV-03) y 02 (ADR-14); PF-3 en 02 (ADR-07), aplicada en 04 con CP-6.

| # | Documento | Texto aprobado | Texto vigente | Origen |
|---|---|---|---|---|
| PF-1 | `02-tecnologias.md`, ADR-14 (contexto y decisión) y 0.5 (fila "Estilos") | Tailwind v4 "con los tokens de la 1.0"; `next/font` "para Instrument Serif, Geist y Geist Mono"; "Conservar la identidad de la 1.0" | Se conservan las **herramientas**: Tailwind CSS v4 con tokens en `@theme`, shadcn/ui solo como primitivas, next-themes por clase y `next/font` (autohospedado). Se **retiran** los valores, las tipografías y toda la identidad de la 1.0: los tokens son los semánticos de 05 §10, con valores de Claude Design. Hasta entonces se usan valores neutros provisionales, marcados como tales, y la fuente del sistema. `next/font` se usará para las fuentes que elija el diseño | P5-1 |
| PF-2 | `00-decisiones.md`, H1 y 2.16 (PS); `01-dominio.md`, AV-02 y AV-03 (columna "Clase"); `02-tecnologias.md`, ADR-14 ("H1 exige distinguir … por color") | "A la vista por defecto, el tipo de sobregiro se distingue **solo por color**"; AV-02 "Estado; color de débito"; AV-03 "Estado; color de tarjeta" | El tipo de sobregiro se distingue a la vista con **color y un indicador no cromático con nombre accesible** ("sobregiro con débito o efectivo" o "deuda sin reservar", **[R2]** PB-1), sin montos. Los montos y el desglose aparecen al tocar. La forma del indicador la decide el diseño. AV-02: "Estado; color e indicador de débito"; AV-03: "Estado; color e indicador de tarjeta" | P5-2 (enmienda de H1; WCAG 2.2, criterio 1.4.1) |
| PF-3 | `02-tecnologias.md`, ADR-07 (consecuencias) | "La interfaz no hace aritmética con montos; solo formatea `Centavos` recibidos" | La interfaz no hace aritmética con montos, **salvo** sumas y restas con las funciones de `Centavos` de `@finn/dominio/valores`, solo en los componentes de formulario y solo como ayuda visual de lo que el usuario está escribiendo (cuánto falta repartir, cuánto suma un reparto, si el botón se habilita). Ese resultado nunca se envía al servidor (el total y cada línea los escribe el usuario), nunca reemplaza un derivado del motor y el servidor valida siempre. Una regla de lint limita la importación (FE-22) | P5-3 |

### 0.9 Cambios propuestos a 04

Se aplican a `04-backend.md` al cerrar esta fase, como hizo 04 con 01–03 (secciones afectadas y una línea en "Enmiendas posteriores"). CP-1 a CP-5 están aprobados (P5-4 a P5-7 y P5-15); CP-6 se deriva de P5-3; CP-7 y CP-8 se aprobaron en la revisión de la Parte A (PA-1 y PA-2) **[R1]**. CP-9 a CP-14 son de la Parte B (2.13) y se aprobaron con ella **[R2]**. CP-15 y CP-16 salen de la revisión de la Parte B (2.13) y se aprobaron con la Parte C **[R3]**. *(D)* CP-17 y CP-18 están en §8 (8.1 y 8.6) y se aprobaron con la Parte D **[R4]**. **Al cerrar la fase, CP-1 a CP-18 se aplicaron a `04-backend.md`**, marcados **[F5]**, con la tabla en su §0.9.1 y una línea en sus "Enmiendas posteriores". La lista completa está en 16.3.

#### CP-1 — Catálogo cerrado de destinos de las notificaciones (04 §11.1, §6.12.5; P5-4)

`notificaciones.datos.destino` deja de ser `{ pantalla: string; id? }` y pasa a ser un tipo cerrado, que también viaja en la carga útil del push (sin montos ni nombres, 04 §11.4):

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
  | { pantalla: 'diagnostico' };
interface CargaPush { notificacionId: Uuid; titulo: string; cuerpo: string; destino?: DestinoNotificacion; acciones?: ('confirmar' | 'rechazar')[] }
```

| Motivo (04 §11.2) | Destino |
|---|---|
| `sms_nuevo`, `sms_coincidencia`, `sms_posible_duplicado`, `sms_no_reconocido`, `sms_error` | `movimiento` |
| Push agrupado de 11.3 (más de 3 SMS en 5 min) | `bandeja` (el registro en `notificaciones` sigue siendo uno por SMS, con `movimiento`) |
| `registro_automatico` | `transaccion` |
| `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado` | `programada` con `fechaEsperada` |
| `cierre_periodo` | `presupuesto` con el inicio del período que cerró |
| `meta_vencida` | `categoria` |
| `respaldo_atrasado`, `restauracion_atrasada`, `deriva_catalogo`, `tarea_fallida`, `carga_incremental` | `diagnostico` |
| `cambio_retroactivo` (AV-01, sin push) | `inicio` (donde se listan, BE-38) |
| Cualquier motivo sin destino, o un `destino` que no valida con el contrato | El centro de notificaciones |

- El backend fija `datos.destino` al registrar la notificación; el service worker y el centro de notificaciones lo validan con el mismo contrato antes de abrirlo.
- La traducción de `DestinoNotificacion` a rutas es de la interfaz (§3, Parte B). `existeDestino` (6.12.5) no cambia.
- Las respuestas de la acción desde la notificación (11.5: 401 → bandeja; 409 o 422 → el movimiento) usan los mismos destinos.

#### CP-2 — `bandejaPorRevisar` en el `Encabezado` (04 §6.0.2; P5-5)

```ts
interface Encabezado {
  revision: Revision; hoy: FechaLocal; periodoActivo: PeriodoDto;
  notificacionesNoLeidas: number;
  bandejaPorRevisar: number;   // movimientos en pendiente, con_coincidencia, posible_duplicado, no_reconocido o error
}
```

- Es la suma de los cinco contadores de `InicioDto.atencion.bandeja` (6.1) y usa el mismo índice `ix_movimientos_estado`, en la misma instantánea de `leer()`.
- Agrega a toda consulta una lectura de [H]: el presupuesto de 6.0.7 (≤ 30 ms) se mantiene, pero cada ficha de §6 debe mencionarla.

#### CP-3 — Lecturas interactivas por Server Action (04 §2.2.1, BE-05; P5-6)

Se agrega una fila a la tabla de 2.2.1:

| Caso | Mecanismo | Por qué |
|---|---|---|
| Lecturas interactivas (lista cerrada): `consultas.sugerencia({ comercio })` (6.14.3) y `consultas.formulario({ operacion: 'devolver', busqueda })` (6.14.4) | **Server Action de solo lectura**, con el envoltorio `lectura(definicion)`: `exigirSesionLectura()`, contrato Zod, `leer()`, sin `revalidatePath` y sin escrituras. Devuelve `ResultadoAccion` | Responden mientras el usuario escribe; un Server Component obligaría a volver a pintar el formulario en cada pulsación |

- **Lista cerrada:** ninguna otra lectura usa este mecanismo sin una decisión nueva.
- Requisitos del cliente (FE-15): espera de 300 ms entre pulsaciones, mínimo 2 caracteres, cancelación de la anterior y límite de resultados (`sugerencia`: 1; búsqueda de compras: 20, como fija 6.14.4).
- V5-11 mostró que Next despacha las Server Actions del cliente de una en una: una lectura lenta retrasa la escritura siguiente. Por eso estas lecturas deben quedar dentro del presupuesto de 6.0.7 (≤ 30 ms en el servidor con memoria caliente).

#### CP-4 — Factores TOTP en Ajustes (04 §12.2 y §6.11; P5-7)

`AjustesDto` no cambia. Se agrega en `@finn/aplicacion/autenticacion`:

```ts
// Lee Supabase Auth con el cliente de servidor (cookies). No es una consulta de §6: no lee la base de Finn.
function estadoSeguridad(): Promise<{
  aal: 'aal1' | 'aal2';
  factores: { id: string; nombre: string | null; creadoEn: Instante; estado: 'verificado' | 'sin_verificar' }[];
}>;   // exigirSesionLectura(); usa mfa.listFactors() y mfa.getAuthenticatorAssuranceLevel()
```

La usan `/ajustes/seguridad` y la comprobación de `/ingresar/inscribir` que ya pide 04 §12.2. Las acciones de MFA (inscribir, verificar, quitar, cerrar las otras sesiones) siguen con `exigirSesionEscritura()` (12.3); su detalle va en §9 (Parte B).

#### CP-5 — Pedido del permiso de notificaciones (04 §11.1; P5-15)

Fila "Suscripción" de 11.1. Texto aprobado: "Al abrir la app con sesión AAL2, el cliente pide permiso (una vez) y llama a OPT-02…". Texto vigente:

> El permiso **solo se pide tras un gesto del usuario**, desde la tarjeta "Activar notificaciones" (visible mientras el permiso no esté concedido ni denegado, y descartable) o desde Ajustes > Notificaciones. Si el permiso ya está concedido, al abrir la app con sesión AAL2 el cliente renueva la suscripción con OPT-02 sin preguntar. Si está denegado, Ajustes explica cómo habilitarlo en el navegador.

#### CP-6 — Aritmética en el cliente (04 §1.3 y §13.3; P5-3, PF-3)

- §1.3, fila `apps/web (cliente)`, columna `dominio/valores`: de "sí" a "**solo en los formularios** (`src/formularios/**`, `src/componentes/formularios/**`); en el resto, solo `import type`". Lo hace cumplir FE-22 (V5-12).
- §13.3, "La interfaz nunca hace aritmética con montos (ADR-07)": se agrega la excepción de PF-3.

#### CP-7 — Forma de importar Zod en los contratos (04 §2.6) — aprobado (PA-1) **[R1]**

V5-13 midió que la forma de importar Zod cambia el peso del cliente de 92,5 KB a 25,1 KB (gzip), porque `import { z } from 'zod'` arrastra todas las configuraciones regionales. Como `@finn/aplicacion/contratos` se usa en los formularios (BE-08), la forma de escribir los contratos es parte del presupuesto de la interfaz. Propuesta, en 2.6:

- Todo esquema de `@finn/aplicacion/contratos` y de `apps/web` importa `import * as z from 'zod'`; la configuración regional en español se importa sola (`import { es } from 'zod/locales'`). Una regla de lint prohíbe `import { z } from 'zod'`.
- Se mantiene Zod "clásico" (ADR-18). `zod/mini` (6,2 KB) queda descartado por ahora: cambia la API de todos los contratos (validaciones con `.check(…)`) y los agentes la conocen menos; ver PA-1.
- La Parte C confirma la medida con la compilación real de Next (Turbopack).

#### CP-8 — Forma de `Propuesta` (04 §3.0.3 y §6.0.3) — aprobado (PA-2) **[R1]**

04 usa `Propuesta` (en `SalidaOperacion.propuestas` y en `AvisoEstadoDto.accion`) sin definirla. Para que la interfaz no calcule montos (PF-3), la propuesta debe traer la entrada completa, calculada por el servidor:

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
| "Recordar esta categoría para este comercio" | OP-41 crear | `patron`, `categoriaId` (el `id` lo agrega el cliente, 4.5) |

La interfaz ejecuta la propuesta tal cual (un toque) o abre el flujo correspondiente con la entrada como valores iniciales, donde el usuario puede cambiarla.

### 0.10 Preguntas

**Parte A (resueltas) [R1]**

| # | Pregunta | Resolución |
|---|---|---|
| PA-1 | Forma de importar Zod en los contratos | Aprobada: Zod clásico con `import * as z from 'zod'` y la configuración en español aparte; regla L9. Se aplica CP-7 |
| PA-2 | `Propuesta` sin definir en 04 | Aprobada: `Propuesta` con la entrada completa calculada por el servidor (CP-8) |
| PA-3 | Clasificación de los flujos que no estaban en P5-11 | Aprobada la clasificación (1.4), con el ajuste 1: la bandeja ofrece además "Aprobar" con un toque (FE-25) |
| PA-4 | Acciones de un toque sin datos ni confirmación | Aprobada: no tienen URL. Toda acción de un toque que se pueda revertir muestra, después del éxito y mientras siga en pantalla, una salida para revertirla con la operación inversa (FE-24) |

**Parte B (resueltas) [R2]**

| # | Pregunta | Recomendación | Alternativa |
|---|---|---|---|
| PB-1 | **Término del sobregiro con tarjeta (ajuste 3).** Los documentos aprobados no coinciden. Detalle abajo | **Resuelta:** se mantiene "deuda sin reservar" (00 H1 y 01 AV-03), sin enmienda, en el glosario, en el indicador de PF-2 y en los textos. "Te falta reservar" sigue siendo S(t) de la tarjeta; donde aparecen juntos, la interfaz aclara que el primero es por categoría y el segundo el total de la tarjeta (12.3) | — |
| PB-2 | **[R2] Resuelta: sin salida para revertir; la salida es "Ver transacción", como excepción registrada a la regla de PA-4 (4.14).** Planteamiento: **revertir "Aprobar" con un toque.** Aprobar no tiene una operación inversa única: OP-29 elimina la transacción pero deja el movimiento en `descartado` (04 OP-29), y volver a `pendiente` exige además OP-39 restaurar. Son dos operaciones que no forman una unidad atómica, y OP-29 puede pedir confirmación (AV-01, AV-16) | No ofrecer salida para revertir tras aprobar. En su lugar, "Ver transacción", desde donde se puede eliminar con su flujo (4.15) | Ofrecer "Deshacer" como OP-29 seguida de OP-39, con el riesgo de quedar a mitad si la segunda falla |
| PB-3 | **[R2] Resuelta: se acepta sin cambiar la entrada de OP-37. Mitigación: el resultado muestra exactamente lo aprobado, tomado de la respuesta del servidor (4.15, CP-15).** Planteamiento: **OP-37 no lleva valores `esperado`.** "Aprobar" con un toque aprueba el movimiento tal como está en el servidor. Si se editó en otra pestaña (OP-36) entre que se pintó la lista y el toque, se aprueba la versión editada, no la que se veía | Aceptarlo: es un solo usuario, la lista se refresca al volver a la pestaña (FE-21) y la transacción creada se ve después del éxito | Cambio a 04: OP-37 acepta un `esperado` opcional (`cuentaId`, `fecha`, `monto`, `tipoPropuesto` y líneas) y responde `conflicto_desactualizado` si no coincide |

**Parte C (resueltas) [R3].** PC-1 se aprobó con la recomendación: biblioteca de formularios con su propio presupuesto de 50 KB, medida aparte (13.1, 13.4, V5-35).

| # | Pregunta | Recomendación | Alternativas |
|---|---|---|---|
| PC-1 **[R3] Resuelta** | **Presupuesto de JS por ruta en las rutas con formulario.** V5-20 midió que React Hook Form, el resolvedor y Zod con su configuración en español suman **44,6 KB** en la compilación real. Con el límite aprobado de 50 KB por ruta, cada flujo tendría unos 5 KB para su propio código (`EntradaMonto`, `useOperacion`, `CampoLineas`, textos), que no alcanzan: casi todos los flujos fallarían el control de CI. Esos 44,6 KB están en archivos que comparten todas las rutas con formulario y, después del primer flujo, el navegador ya los tiene | **Contar la biblioteca de formularios como un presupuesto compartido propio: ≤ 50 KB para los archivos que cargan todas las rutas con formulario, y ≤ 50 KB por ruta para el resto.** El control de 13.4 ya separa lo común de lo propio; solo se agrega una línea a la tabla de 13.1. El JS compartido de toda la app sigue en ≤ 170 KB | (b) Subir a 100 KB el límite de las rutas con formulario, contando todo. (c) Cargar la biblioteca de formularios en el marco: el compartido pasaría a unos 184 KB y superaría los 170 KB. (d) Reabrir PA-1 y usar `zod/mini` (ahorra 11 KB y no alcanza solo) |

**PB-1 en detalle** (registro de la decisión). Qué dice cada documento:

| Documento | Texto para la parte con tarjeta del sobregiro de una categoría (SobT) |
|---|---|
| `00-decisiones.md`, H1 | "otro [color] para sobregiro con tarjeta (**"deuda sin reservar"**)" |
| `01-dominio.md`, AV-03 | "Sobregiro con tarjeta: **"deuda sin reservar"**; los montos aparecen al tocar" |
| Documento de producto, §7 *Sobregiros* | "Con tarjeta: **es deuda que todavía no tengo reservada**. No reduce mi "Listo para asignar"; **queda como lo que me falta reservar para esa tarjeta**" |
| Documento de producto, §7 *Tarjetas* y *Períodos* | "el resto es **deuda que me falta reservar**"; "un sobregiro con tarjeta queda como **deuda que me falta reservar**" |

Hallazgos:
1. 00 y 01 usan exactamente "deuda sin reservar", que es el término de la Parte A. El producto no lo usa: describe el concepto como "deuda que (me) falta reservar".
2. **"Deuda sin respaldo" no sirve como nombre de este indicador.** En 00 (O2) y 01 (§1.4, §4.8), "deuda sin respaldo" es S(t), un dato de la **tarjeta**, que 01 iguala a "te falta reservar". Usarlo para la categoría pondría el mismo nombre a los dos conceptos que el ajuste 3 quiere separar.
3. La cercanía con "te falta reservar" no es casual: la parte con tarjeta del sobregiro de una categoría **es parte** de S(t) de esa tarjeta (01 §4.6: al cierre "queda solo dentro de la deuda de la tarjeta, como parte de S(t)"). El producto lo describe así a propósito.

Opciones:
- **(a)** Mantener "Deuda sin reservar" (00 H1 y 01 AV-03, sin enmienda). En el detalle al tocar, explicar la relación: "Esta parte suma a lo que te falta reservar para {tarjeta}".
- **(b)** Usar el texto del producto, por ejemplo "Deuda que te falta reservar". Necesita enmendar H1 y AV-03, y queda todavía más cerca de "Te falta reservar".
- **(c)** Un término nuevo con el vocabulario de 01 §4.5 ("parte no cubierta"), por ejemplo "Tarjeta sin cubrir". Necesita enmendar H1 y AV-03.

**[R2] Decisión:** opción (a), con la aclaración de alcance de 12.3.

### 0.11 Anotaciones para la Parte D (§16)

| # | Anotación | Destino |
|---|---|---|
| D-1 | Atrás y adelante del navegador pueden mostrar una página restaurada de la caché del enrutador de Next; FE-21 la refresca si tiene más de 30 s | Riesgos |
| D-2 | Las Server Actions se despachan de una en una (V5-11): una lectura interactiva lenta retrasa una escritura | Riesgos |
| D-3 | Sin Skew Protection (V5-14), cambiar el nombre o el archivo de una Server Action, o el contrato de una operación, rompe las pestañas abiertas con la versión anterior; FE-13 lo convierte en "Hay una versión nueva" | Riesgos; regla para la Fase 8 |
| D-4 | Una actualización de ICU puede cambiar los formatos de `Intl` (V5-02 ya encontró "sept" y la coma del instante) | Riesgos (cubierto por las pruebas de 5.4) |
| D-5 | Los borradores en `sessionStorage` contienen montos y comercios mientras la pestaña está abierta | Supuestos (aceptado en el Paso 1: nada sale del dispositivo) |
| D-6 *(B)* | Un error no previsto en una página (que no pasó por `consultar()`) llega a `error.tsx` con el `digest` numérico de Next y no con un `idError`; solo queda en los registros de Vercel (1 hora) (V5-15c) | Riesgos |
| D-7 *(B)* | "Aprobar" con un toque aprueba la versión del servidor del movimiento (PB-3, aceptado); el resultado muestra lo aprobado (CP-15) | Supuestos |
| D-8 *(B)* | Sin prefetch terminado, ni `loading.tsx` ni `useLinkStatus` dieron señal en todas las navegaciones medidas (V5-19). *(C)* Repetida (V5-21): con la página hidratada, `useLinkStatus` da la señal en 10 de 10; antes de hidratar no hay señal (el clic se repite al hidratar). Mitigación: estado presionado solo con CSS (10.9) y presupuesto de JS (§13) | Riesgos |
| D-9 *(C)* | El INP se mide solo en el laboratorio: no hay forma de recoger el de uso real sin un Route Handler nuevo o un servicio externo (13.4) | Supuestos |
| D-10 *(C)* | El JS compartido medido (139 KB) deja unos 31 KB para el resto del marco; cualquier biblioteca en el marco lo consume (13.2) | Riesgos |
| D-11 *(D)* | La biblioteca de formularios mide 46 a 48 KB de su presupuesto de 50 KB (V5-35) | Riesgos |

*(D)* Todas se consolidan en §16 (16.1 y 16.2).

### 0.12 Registro de cambios de las revisiones

| Cambio | Origen | Secciones |
|---|---|---|
| **[R1]** PA-1 a PA-4 resueltas; CP-7 y CP-8 aprobados | Revisión de la Parte A | 0.9, 0.10 |
| **[R1]** Acciones de un toque sin URL, con salida para revertir mediante la operación inversa (FE-24) | PA-4 | 1.3, 4.1, 4.14 |
| **[R1]** "Aprobar" con un toque en la lista de la bandeja; traspaso a `bandeja/[movimientoId]` si el servidor pide confirmación o datos (FE-25) | Ajuste 1 | 1.3, 1.4, 4.15 |
| **[R1]** `conflicto_id`: "Ver lo guardado" como acción principal; "Guardar como nuevo" como secundaria con aviso; el formulario conserva lo escrito | Ajuste 2 | 4.5, 4.7 |
| **[R1]** Término del sobregiro con tarjeta: 00, 01 y el producto difieren; queda pendiente de PB-1 | Ajuste 3 | 0.8 (PF-2), 0.10, 12.3 |
| **[R1]** OP-05 (desarchivar cuenta) pasa a acción de un toque; ruta para quitar un factor TOTP | Revisión propia al escribir la Parte B | 1.3 |
| **[R2]** PB-1: "deuda sin reservar" en el glosario, en PF-2 y en los textos; aclaración de alcance frente a "te falta reservar" | Revisión de la Parte B | 0.8, 0.10, 12.3 |
| **[R2]** PB-2: aprobar con un toque no tiene salida para revertir; excepción registrada a la regla de PA-4 | Revisión de la Parte B | 4.14 |
| **[R2]** PB-3: el resultado de aprobar con un toque muestra lo aprobado según la respuesta del servidor; cambio de la salida de OP-37 (CP-15) | Revisión de la Parte B | 4.15, 2.13 |
| **[R2]** Parámetro de regreso: `?volver=` en lugar de `?desde=`; catálogo de parámetros con un solo significado por nombre; renombres `?historial=`, `?categoria-origen=`, `?categoria-destino=`, `?tipo-cuenta=` y `?tipo-evento=`; regla T9 en el script de cobertura | Ajuste 1 | 1.3, 2.2, 2.3, 2.6, 2.7, 3.3 |
| **[R2]** Conciliar: la variante de gasto no alcanza para OP-46; variante nueva `formulario({ operacion: 'conciliar' })` (CP-16) | Ajuste 2 | 2.7, 2.13 |
| *(C)* Reglas de lint L12 a L18; nota en V5-13 sobre el peso real de Zod; actualización de D-8; D-9 y D-10 | Mediciones y redacción de la Parte C | 0.7, 0.11, 1.7 |
| **[R3]** PC-1: biblioteca de formularios con presupuesto propio de 50 KB, medida aparte (V5-35) | Revisión de la Parte C | 0.10, 13.1, 13.2, 13.4 |
| **[R3]** Corrección de V5-13: en Next, `import { z }` pesa lo mismo que `import * as z` | Revisión de la Parte C | 0.7 |
| **[R3]** Claude Design puede agregar tokens, roles y variantes sin renombrar ni quitar; tokens `grafico-serie-1` a `-8`, `grafico-referencia`, `grafico-rejilla`, `marca` y `texto-sobre-marca`; `GraficoDona`; recursos de marca (10.11) | Ajuste 1 | 10.2, 10.8, 10.10, 10.11, V5-23 |
| **[R3]** Anexo A, "Encargo para Claude Design" | Ajuste 2 | Anexo A |
| *(D)* Ruta del service worker en el árbol; regla L19; `registro.update()` en el refresco automático; corrección de 7.4 (V5-30b); sin conexión en las pruebas con el servidor detenido | Mediciones y redacción de la Parte D | 1.2, 1.7, 6.7, 7.4, 14.5 |
| **[R4]** PD-1: el service worker guarda todos los archivos estáticos de la versión, con su tamaño informado en cada PR y un límite de 1,5 MB con gzip; CP-17 y CP-18 aprobados | Revisión de la Parte D | 8.3, 8.8, 13.1, 13.4, 16.3, 16.5 |
| **[R4]** Anexo A: sección A.0 "Punto de partida" (la identidad elegida en el proyecto de Claude Design, "F · Precisión con voz de basalto", se lleva al contrato); A.2 y A.10 actualizados; §10 aclara que "desde cero" es respecto de la 1.0 | Ajuste al Anexo A | Anexo A, §10 |
| Cierre: CP-1 a CP-18 aplicados a 04; PF-1 a PF-3 anotadas en 00, 01 y 02; estado "Aprobado — Fase 5 cerrada" | Aprobación del usuario | Encabezado, 0.8, 0.9, 16.3 |

---

### 0.13 Enmiendas de la Fase 6 **[F6]**

| CF | Qué cambia | Secciones de este documento | Detalle en 06 |
|---|---|---|---|
| CF-01 | Ruta `/cuentas/[cuentaId]/verificar-saldo` [L] (OP-53), previsualizar primero, nombres "Estado de cuenta" y "Verificación de saldo" | 1.3, 2.7, 4.4, 15.2 | 3.2 |
| CF-02 | Reporte `flujo-efectivo` | 1.3, 2.10 | 3.3 |
| CF-04 | Reportes `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos`; hallazgos con `Aviso` y su acción | 1.3, 2.10, 10.8 | 3.5 |
| CF-05 | Ejecución de `Propuesta` por `ejecucion` (`un_toque` o `abrir_flujo`) y salidas para revertir de las propuestas nuevas | 4.13, 4.14 | 3.6 |
| CF-06 | Inicio: hallazgos de ritmo y pagos de tarjeta próximos en "Necesita tu atención"; "Todo al día" los exige vacíos | 2.3 | 3.7 |
| CF-07 | Destino `cuenta` → `/cuentas/[cuentaId]` | 3.5 | 3.8 |
| CF-08 | Plantilla de grupos y categorías: ruta `/presupuesto/estructura/plantilla` [L], textos en `src/textos/plantilla.ts` | 1.3, 2.3, 7.2, 12 | 3.9 |
| CF-10 | Tema por `data-theme="claro" \| "oscuro"` | 10.1, 10.6 | 3.11 |
| CF-11 | Variables sin el prefijo `--finn-` | 10.1, 10.5 | 3.11 |
| CF-12 | Roles tipográficos generados como `@utility` desde `tokens.json`; rol nuevo `rotulo` | 10.4 | 3.11 |
| CF-13 | Componentes visuales propios de la identidad, con sus props | 10.8.1, 15.4 | §5.4 |
| CF-15 | Signo menos U+2212 al mostrar montos; `limpiarPegado` acepta U+2212 y U+2013; exportaciones sin cambio | 5.2, 5.4, 10.8 (`Monto`), 0.7 (V5-02) | 3.12 |
| CF-17 | "Categoría nueva" según `existiaEn`; "Tu promedio de gasto ({n} períodos)" | 2.10 | 3.14 |
| CF-18 | Primeros pasos en Inicio con "Ocultar por ahora"; recordatorio en `/ajustes` | 2.3, 2.11, 7.2 | 3.15 |
| CF-19 | Plantilla aplicada con OP-07 en lote, en tandas, con avance y reanudación desde el borrador | 1.3, 2.3, 4.11, 11.3 | 3.9.1 |
| CF-21 | Soltar un movimiento sobre una categoría aprueba con OP-37 `{ categoriaId }`; traspaso al flujo con la categoría puesta | 1.3, 2.5, 4.15 | 0.13, FT-78 |
| CF-22 | Panel de destinos del arrastre, carga diferida de `@dnd-kit/core` | 2.5, 10.8, 13.3 | 0.13, FT-78 |
| CF-23 | `/notificaciones` interceptada en `@superpuesto` desde la campana; `Superpuesto` con la variante "desde arriba" | 1.3, 1.4, 10.7 | 0.14, FT-69 |
| CF-25 | Los componentes visuales dibujan las proporciones que trae el DTO (barra de gastado, uso sin reservar, barras de la posición neta, intensidad del calendario, porcentaje de la referencia) sin recalcular | 10.8.1 | 5.8 |

## 1. Estructura de `apps/web`

### 1.1 Carpetas (FE-01)

Complementa el árbol de 04 §1.2, que ya fija `proxy.ts`, `app/api/…`, `servidor/acciones/` y `sw/`.

```
apps/web/
  next.config.ts                 bodySizeLimit (04 2.2.4); sin cacheComponents ni staleTimes propios (6.1)
  src/
    proxy.ts                     04 §12.4
    app/                         rutas (1.2 y 1.3)
    flujos/<flujo>/              un flujo por carpeta: lector.tsx (servidor) + formulario.tsx (cliente)
    componentes/
      base/                      primitivas de shadcn reestilizadas con los tokens (§10, Parte C)
      dominio/                   Monto, FilaCategoria, MovimientoBandeja… (§10, Parte C)
      formularios/               EntradaMonto, EntradaFecha, CampoLineas, ConfirmacionImpacto… (cliente)
      graficos/                  SVG con d3-scale y d3-shape (§10, Parte C)
      navegacion/                contratos de navegación (§3, Parte B)
      marco/                     Marco, ProveedorEncabezado, PublicarEncabezado, Superpuesto, PaginaFlujo
    formularios/                 hooks del patrón de §4: useOperacion, useBorrador, useLecturaInteractiva,
                                 useFormularioFinn, zod-es.ts
    cliente/                     useRefrescoAutomatico, useConexion, almacen.ts (sessionStorage), reloj.ts
    formato/                     módulo único de formato (5.4)
    textos/                      catálogo de textos de la interfaz (§12)
    servidor/
      accion.ts                  envoltorio de escritura (04 2.2.2)
      lectura.ts                 envoltorio de lecturas interactivas (CP-3)
      acciones/<area>.ts         'use server'; una línea por operación (04 2.2.2)
      lecturas/interactivas.ts   'use server'; solo las dos de CP-3
      sesion.ts                  04 §1.2
    sw/                          service worker (§8, Parte D)
```

- **`flujos/`** existe para que la versión interceptada y la versión de página completa de un flujo (FE-04) compartan el mismo código. Cada flujo exporta un `lector` (Server Component que llama a la consulta y arma las props) y un `formulario` (Client Component).
- **`formularios/` frente a `componentes/formularios/`:** la primera tiene la lógica (hooks), la segunda los componentes. Son las dos únicas carpetas que pueden importar `@finn/dominio/valores` en ejecución (PF-3, FE-22).

**Justificación.** Separar por responsabilidad (rutas, flujos, componentes, lógica de cliente, formato, textos) hace que cada regla de lint de 1.7 apunte a una carpeta concreta. *Alternativas descartadas:* todo junto a las rutas (`app/**/_componentes`), que obliga a duplicar los flujos en la ruta interceptada y en la completa; carpetas por feature (`features/presupuesto/…`), donde las reglas de frontera de PF-3 y de Server/Client quedarían repartidas en decenas de carpetas.

### 1.2 Grupos de rutas y layouts (FE-02)

```
app/
  layout.tsx                 raíz: <html lang="es">, proveedor de tema, fuentes, metadatos (Server)
  manifest.ts                §8 (Parte D)
  serwist/[path]/route.ts    *(D)* sirve el service worker compilado, estático (FE-52, CP-17)
  sin-conexion/page.tsx      página de respaldo estática, sin sesión ni datos (§8, Parte D)
  ingresar/                  sin sesión AAL2: page.tsx, verificar/page.tsx, inscribir/page.tsx (04 §12.2; §9, Parte B)
  (finn)/                    todo lo que exige sesión AAL2
    layout.tsx               marco autenticado (abajo)
    error.tsx, not-found.tsx §7 (Parte B)
    @superpuesto/            slot de los flujos cortos interceptados (FE-04)
      default.tsx            null
      [...todo]/page.tsx     null: cierra el slot al navegar a cualquier otra ruta
      (.)<ruta de cada flujo corto>/page.tsx
    …rutas de 1.3
  api/                       lista cerrada de 04 §2.2.1 (sin cambios)
```

**Layout `(finn)/layout.tsx`** (Server Component):
1. No llama a ninguna consulta de §6 (FE-06). La sesión la exigen las consultas de cada página (04 §12.3) y `proxy.ts` redirige de forma optimista (04 §12.4).
2. Lanza la puesta al día con `after(() => tareas.ponerAlDia())`, como fija 04 BE-50.
3. Renderiza `<Marco>` (cliente), que contiene `ProveedorEncabezado` (6.4), los contratos de navegación (§3, Parte B), `useRefrescoAutomatico` (6.7) y `useConexion` (6.9).
4. Renderiza `{children}` y `{superpuesto}`.

**Layout raíz:** `<html lang="es">`, el proveedor de next-themes con `attribute="class"` (ADR-14) y la fuente provisional del sistema (PF-1). No lee la sesión, para que `ingresar` y `sin-conexion` no dependan de ella.

**Justificación.** El grupo `(finn)` concentra en un solo layout todo lo que es común a las pantallas con sesión, sin poner el prefijo en las URL. `ingresar` queda fuera porque se usa justamente sin sesión AAL2, y `sin-conexion` porque el service worker la guarda como recurso estático (02 ADR-13). *Alternativa descartada:* un solo layout con condiciones según la ruta; mezcla el marco autenticado con las pantallas de acceso.

### 1.3 Árbol de rutas (FE-03)

Clases: **[P]** sección principal, **[S]** secundaria, **[D]** detalle, **[L]** flujo largo, **[C]** flujo corto (FE-04). La consulta, los parámetros, las operaciones y los avisos de cada ruta están en el mapa de pantallas (§2, Parte B).

```
(finn)/
  page.tsx                                            [P] Inicio                         /
  presupuesto/page.tsx                                [P] Presupuesto                    ?periodo= &filtro=
  presupuesto/listo-para-asignar/page.tsx             [D] Detalle de LPA                 ?historial= [R2]
  presupuesto/categorias/[categoriaId]/page.tsx       [D] Detalle de categoría (normal o de pago)  ?periodo=
  presupuesto/categorias/[categoriaId]/archivar/      [L] OP-09
  presupuesto/categorias/[categoriaId]/fusionar/      [L] OP-12
  presupuesto/categorias/[categoriaId]/sacar/         [C] OP-11
  presupuesto/asignar/[categoriaId]/                  [C] OP-14, OP-16                   ?periodo=
  presupuesto/mover/                                  [C] OP-15                          ?categoria-origen= &categoria-destino= &periodo= [R2]
  presupuesto/auto-asignar/                           [C] OP-17                          ?periodo=
  presupuesto/estructura/page.tsx                     [L] administración de grupos y categorías
  presupuesto/estructura/plantilla/                   [L] OP-07 en lote (plantilla) [F6] CF-08, CF-19
  presupuesto/estructura/grupos/nuevo/                [C] OP-07
  presupuesto/estructura/grupos/[grupoId]/            [C] OP-08, OP-13 (grupo)
  presupuesto/estructura/categorias/nueva/            [C] OP-07                          ?grupo=
  presupuesto/estructura/categorias/[categoriaId]/    [C] OP-08, OP-10, OP-13 (categoría)
  bandeja/page.tsx                                    [P] Bandeja                        ?vista=descartados &cursor=
  bandeja/[movimientoId]/                             [L] OP-36, OP-37, OP-40, OP-49, OP-50 (la lista ofrece además "Aprobar" [1T], FE-25) [R1]
  actividad/page.tsx                                  [P] Actividad                      ?texto= &cuenta= &categoria= &desde= &hasta=
                                                                                         &monto-desde= &monto-hasta= &estado= &tipo= &origen= &cursor=
  actividad/[transaccionId]/page.tsx                  [D] Detalle de transacción
  actividad/[transaccionId]/editar/                   [L] OP-28
  actividad/[transaccionId]/devolver/                 [L] OP-33a (PA-3)
  actividad/[transaccionId]/estado/                   [C] OP-30
  actividad/[transaccionId]/eliminar/                 [C] OP-29
  actividad/[transaccionId]/eventos/eliminar/         [C] OP-34                          ?tipo-evento= &evento= [R2]
  registrar/page.tsx                                  [C] elegir qué registrar
  registrar/gasto/                                    [L] OP-20 (con split)               ?cuenta=
  registrar/[tipo]/                                   [C] OP-21, 22, 25, 26, 27, 33b      ?cuenta=
  cuentas/page.tsx                                    [P] Cuentas                        ?archivadas=1
  cuentas/ordenar/                                    [C] OP-03
  cuentas/nueva/                                      [L] OP-01                          ?tipo-cuenta= [R2]
  cuentas/[cuentaId]/page.tsx                         [D] Detalle de cuenta              ?periodo= &tipo= &estado= &cursor=
  cuentas/[cuentaId]/editar/                          [L] OP-02
  cuentas/[cuentaId]/condiciones/                     [L] OP-48
  cuentas/[cuentaId]/pagar/                           [C] OP-23
  cuentas/[cuentaId]/cuota/                           [C] OP-24                          ?modalidad=cuota|abono
  cuentas/[cuentaId]/archivar/                        [C] OP-04 (OP-05, desarchivar, es [1T]) [R1]
  cuentas/[cuentaId]/eliminar/                        [C] OP-06
  cuentas/[cuentaId]/conciliar/                       [L] OP-45, OP-46, OP-47
  cuentas/[cuentaId]/verificar-saldo/                 [L] OP-53                          ?fecha= [F6] CF-01
  por-cobrar/page.tsx                                 [S] Por cobrar                     ?cerrados=1
  por-cobrar/cobrar/                                  [C] OP-31                          ?linea= &deudor=
  por-cobrar/condonar/[lineaId]/                      [C] OP-32
  por-cobrar/deudores/[deudorId]/renombrar/           [C] OP-52
  metas/page.tsx                                      [S] Metas
  metas/nueva/                                        [C] OP-18 (crear)                  ?categoria=
  metas/[metaId]/                                     [C] OP-18 (editar, eliminar)
  programadas/page.tsx                                [S] Programadas                    ?horizonte=
  programadas/nueva/                                  [L] OP-42 (crear)
  programadas/[programadaId]/                         [L] OP-42 (editar), OP-51
  programadas/[programadaId]/ocurrencias/[fechaEsperada]/  [C] OP-43 (un toque), OP-44
  reglas/page.tsx                                     [S] Reglas de comercio
  reglas/nueva/                                       [C] OP-41 (crear)
  reglas/[reglaId]/                                   [C] OP-41 (editar, eliminar)
  reportes/page.tsx                                   redirige a /reportes/tendencia
  reportes/[tipo]/page.tsx                            [S] Reportes                       ?ventana= &cuentas= &grupo= &periodo= &categorias= &limite=
  notificaciones/page.tsx (y @superpuesto/(.)notificaciones, [F6] CF-23)                             [S] Centro de notificaciones        ?no-leidas=1 &cursor=
  ajustes/page.tsx                                    [S] Ajustes (índice)
  ajustes/ciclo/                                      [C] OP-19
  ajustes/webhook/                                    [C] OPT-01
  ajustes/formatos/page.tsx                           [L] lista de formatos bancarios
  ajustes/formatos/nuevo/  ajustes/formatos/[formatoId]/   [L] OPT-05, OPT-06
  ajustes/instituciones/page.tsx                      [L] lista de instituciones
  ajustes/instituciones/nueva/  ajustes/instituciones/[institucionId]/   [C] OPT-07
  ajustes/notificaciones/                             [S] OPT-02, OPT-03 (§8, Parte D)
  ajustes/seguridad/                                  [S] factores TOTP (CP-4; §9, Parte B)
  ajustes/seguridad/factores/nuevo/                   [L] inscribir un factor más
  ajustes/seguridad/factores/[factorId]/quitar/       [C] quitar un factor (§9) [R1]
  ajustes/exportar/                                   [S] OPT-08 (descargas por /api/exportar)
  ajustes/respaldo/                                   [S] estado del respaldo
  ajustes/diagnostico/                                [S] eventos y "Ejecutar tareas ahora"
  ajustes/apariencia/                                 [S] tema
```

Reglas:
- **Cada sección, pantalla y flujo tiene su URL** (P5-10, P5-11). Las acciones de un toque [1T] sin datos ni confirmación no tienen URL (PA-4); su lista está en 4.14 **[R1]**.
- **[R1] Aprobar desde la bandeja.** `bandeja/[movimientoId]` es el flujo largo para revisar, editar o dividir un movimiento. Además, la lista de la bandeja ofrece "Aprobar" como acción de un toque cuando el movimiento lo permite, sin abrir el flujo; si el servidor pide confirmación o datos, se abre ese flujo con el mensaje (FE-25, 4.15).
- **Mismas rutas en teléfono y en computadora.** La jerarquía es la del árbol; la presentación la decide el diseño.
- `[tipo]` de `registrar` usa los nombres de la URL `ingreso`, `transferencia`, `devolucion`, `aporte-inversion`, `retiro-inversion`, `ajuste-inversion`, `desembolso`, `avance`, `entrada-tarjeta` y `transferencia-deuda`. Un valor fuera de la lista da `notFound()`. La tabla de equivalencias con `ParametrosFormulario.tipo` de 04 §6.14.1 va en §2 (Parte B).
- `reportes/[tipo]` usa los `tipo` de 04 §6.9 con guiones en lugar de guiones bajos: `tendencia`, `categorias`, `ingresos-gastos`, `remanente`, `top-comercios`, `cumplimiento`, `patrimonio` y `gasto-semanal`. `datos_base` no tiene ruta: alimenta los reportes de la Fase 6 (04 6.9.4).

**Justificación.** Rutas legibles y en el idioma de la interfaz, sin tildes para evitar URL codificadas. Los flujos cuelgan de la entidad sobre la que actúan, de modo que cerrar un flujo vuelve a su padre natural (4.13). *Alternativas descartadas:* rutas de acción planas (`/accion/asignar?categoria=…`), que pierden la jerarquía; flujos sin URL abiertos solo con estado, que P5-11 descarta.

**[F6]** `reportes/[tipo]` agrega `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos` (CF-04) y `flujo-efectivo` (CF-02) (tabla de 2.10). La lista de `bandeja/page.tsx` admite además soltar un movimiento sobre una categoría (OP-37 `{ categoriaId }`, CF-21; 2.5).

### 1.4 Flujos largos y cortos (FE-04)

| Clase | Qué incluye | Presentación | Interceptación |
|---|---|---|---|
| **[L] Largo** | Registrar con split, conciliar, editar transacciones, administración compleja (P5-11) y los de PA-3 | **Siempre pantalla completa** (preferencia del usuario) | Nunca |
| **[C] Corto** | Asignar, mover, pagar tarjeta, cobrar, condonar, estado bancario (P5-11) y los de PA-3 | [Diseño]: hoja, diálogo, panel o pantalla | Sí, en `@superpuesto`, cuando se llega desde otra pantalla de la app |

**Implementación de un flujo corto** (verificada en V5-06):

```
app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx                 → <PaginaFlujo><flujos.asignar.lector …/></PaginaFlujo>
app/(finn)/@superpuesto/(.)presupuesto/asignar/[categoriaId]/page.tsx → <Superpuesto><flujos.asignar.lector …/></Superpuesto>
```

- Navegación dentro de la app (enlace o `router.push`): el slot intercepta la ruta y muestra el flujo **sobre** la pantalla de origen, que sigue montada (V5-06a).
- URL abierta directamente, recarga, deep link desde una notificación o pestaña nueva: el flujo se muestra como **página completa** (V5-06c y d).
- `PaginaFlujo` y `Superpuesto` son contratos de §10 (Parte C): reciben el título, el contenido y la acción de cerrar, y exponen el rol y el nombre accesibles (`dialog` cuando se superpone). Su forma la decide el diseño.
- **Cerrar** (terminar o cancelar) usa `cerrarFlujo()`: si el flujo está superpuesto, `router.back()` (vuelve a la pantalla de origen sin recargarla, V5-06b y e); si es página completa, `router.replace(rutaPadre)`. Cada flujo declara su `rutaPadre` (por ejemplo, `asignar` → `/presupuesto?periodo=…`).
- `@superpuesto/[...todo]` y `default.tsx` devuelven `null`: el slot se vacía al navegar a cualquier otra ruta.

**[R1] Excepción de la bandeja.** "Aprobar" un movimiento es la acción más frecuente de la app. La revisión completa sigue siendo un flujo largo (`bandeja/[movimientoId]`, siempre en pantalla completa), pero aprobar un movimiento que ya está listo no abre ningún flujo: es una acción de un toque en la lista (FE-25). El flujo largo se abre solo si el servidor responde algo que necesita al usuario.

**[F6]** **Excepción de las notificaciones (CF-23).** `/notificaciones` es una sección [S], pero se intercepta como un flujo corto cuando se llega desde la campana de otra pantalla: `@superpuesto/(.)notificaciones/page.tsx` la muestra con `Superpuesto` en su variante "desde arriba" sobre la pantalla de origen, que sigue montada; cerrar (botón, velo o Escape) es `router.back()`. URL abierta directamente, recarga, deep link o "atrás" desde un destino: página completa. Tocar una notificación navega a su destino con `?notificacion=` (3.5), y el slot se vacía como con cualquier ruta interceptada.

**Justificación.** Cumple P5-11: URL propia, funciona al recargar y la forma queda libre. Compartir el `lector` evita dos implementaciones del mismo flujo. *Alternativas descartadas:* diálogos de cliente sin ruta (sin URL ni recarga); interceptar también los largos (contradice la preferencia de pantalla completa).

### 1.5 Server y Client Components (FE-05)

**Regla:** todo es Server Component salvo que necesite algo de esta lista. Un Client Component es una hoja tan pequeña como sea posible.

| Necesita | Ejemplos | Clase |
|---|---|---|
| Leer datos | Páginas, layouts, `lector` de cada flujo | **Servidor** |
| Mostrar datos sin interacción | Montos, filas, tablas, gráficos en SVG sin interacción, avisos de estado | **Servidor** |
| Estado local o eventos | Formularios, entradas, filtros que cambian la URL, "ver el detalle al tocar" cuando necesita estado | Cliente |
| APIs del navegador | `sessionStorage`, `visibilitychange`, `navigator.onLine`, Push y service worker, `crypto.randomUUID()`, tema | Cliente |
| Hooks de Next del cliente | `useRouter`, `useSearchParams`, `usePathname` | Cliente |
| Requisito de Next | `error.tsx` y `global-error.tsx` | Cliente |

Reglas adicionales:
- `page.tsx`, `layout.tsx`, `default.tsx` y `not-found.tsx` nunca llevan `'use client'`.
- Un Client Component recibe solo **props serializables**: partes de los DTO de 04 §6 (montos como enteros, fechas como `FechaLocal`, ids) y Server Actions. Nunca funciones de servidor ni la instantánea.
- El cliente importa solo `@finn/aplicacion/contratos`, `@finn/aplicacion/errores`, tipos de `@finn/dominio` y, en los formularios, `@finn/dominio/valores` (04 §1.3 con CP-6).
- Los Server Components no calculan: muestran lo que trae la consulta (inv. 27). Solo formatean con el módulo de 5.4.

**Justificación.** Con Server Components, los números llegan ya calculados y formateados sin JavaScript en el teléfono, y no hay una copia de los datos en el cliente que pueda quedar vieja (RK-11). *Alternativa descartada:* páginas de cliente que reciben el DTO completo; envía más JavaScript y abre la puerta a guardar números en el cliente.

### 1.6 Marco y `Encabezado` (FE-06)

El marco (navegación, contador de la bandeja, notificaciones, refresco) necesita el `Encabezado` de 04 §6.0.2 (con `bandejaPorRevisar`, CP-2), pero un layout de Next no recibe datos de la página. Por eso:

- Cada página llama a su consulta, que ya devuelve el `Encabezado`, y renderiza `<PublicarEncabezado encabezado={dto} />`, un componente de cliente sin salida visible.
- `PublicarEncabezado` lo entrega a `ProveedorEncabezado` (contexto del marco), junto con el instante en que lo recibió.
- Mientras ninguna página publicó (primera carga), el marco muestra sus contadores en estado "sin dato" [Diseño], nunca un cero inventado.

**Justificación.** El layout no consulta nada y cada página lee una sola vez, en una sola instantánea (04 5.1), así que el contador de la bandeja y los números de la página siempre son del mismo estado. *Alternativas descartadas:* una consulta propia del layout (sería una consulta nueva en 04 y una segunda lectura por navegación, con posibles revisiones distintas); pasar el contador por la URL.

### 1.7 Reglas de lint del cliente (FE-22)

Se suman a las de 02 ADR-21 y 04 §4.10 y §5.8.

| # | Regla | Herramienta | Excepción |
|---|---|---|---|
| L1 | `@finn/dominio/valores` en ejecución solo en `src/formularios/**` y `src/componentes/formularios/**`; en el resto de `apps/web`, solo `import type` (PF-3, CP-6) | `@typescript-eslint/no-restricted-imports` con `allowTypeImports` (V5-12) | — |
| L2 | `@finn/dominio` (API del motor) solo con `import type` en todo `apps/web` | Ídem | — |
| L3 | Sin operadores `+`, `-`, `*`, `/` ni `%` sobre valores de tipo `Centavos`; solo las funciones de `@finn/dominio/valores` | Regla propia con información de tipos (02 ADR-21) | `src/formato/**` (centavos a texto, 5.4) |
| L4 | Sin `'use client'` en `page`, `layout`, `default` ni `not-found` | Regla propia por nombre de archivo | — |
| L5 | `sessionStorage` y `localStorage` solo a través de `src/cliente/almacen.ts` | `no-restricted-globals` y `no-restricted-properties` | `almacen.ts`; next-themes (dependencia) |
| L6 | `new Intl.NumberFormat`, `new Intl.DateTimeFormat`, `toLocaleString` y `toFixed` solo en `src/formato/**` | `no-restricted-syntax` | — |
| L7 | `Date` solo en `src/formato/**` (instantes) y `src/cliente/reloj.ts` (agenda de la medianoche, 6.7) | `no-restricted-globals` | — |
| L8 | Texto literal en JSX prohibido fuera de `src/textos/**` (§12) | `react/jsx-no-literals` | Signos de puntuación sueltos |
| L9 | `import { z } from 'zod'` prohibido; `import * as z from 'zod'` (CP-7, si se aprueba PA-1) | `no-restricted-syntax` | — |
| L10 | Ninguna lectura por Server Action fuera de `src/servidor/lecturas/interactivas.ts` (CP-3) | Control de `tools/ci` que lista las exportaciones de ese archivo contra la lista cerrada | — |
| L11 *(B)* | `next/link` solo en `componentes/navegacion/enlace-finn.tsx` (FE-39) | `no-restricted-imports` | — |
| L12 *(C)* | Ningún color literal ni utilidad de la paleta de Tailwind; solo tokens (10.1) | `stylelint` y ESLint sobre `className` | `src/estilos/tokens.css` |
| L13 *(C)* | Ninguna clase de Tailwind armada con plantillas (10.1) | `no-restricted-syntax` | — |
| L14 *(C)* | Ningún valor arbitrario de espaciado, radio, sombra o duración (10.1) | ESLint sobre `className` | — |
| L15 *(C)* | `text-texto-deshabilitado` solo con `disabled` o `aria-disabled` (10.9) | Regla propia sobre JSX | — |
| L16 *(C)* | `components/ui/` y `@radix-ui/*` solo desde `componentes/base/` (10.7) | `no-restricted-imports` | — |
| L17 *(C)* | Sin `tabindex` positivo (11.2) | `jsx-a11y/tabindex-no-positive` (y el resto de `eslint-plugin-jsx-a11y` recomendado) | — |
| L18 *(C)* | Sin bibliotecas de fechas, formato o utilidades generales, ni paquetes de iconos completos (13.3) | `no-restricted-imports` | — |
| L19 *(D)* | `useRouter` de `next/navigation` solo en `componentes/navegacion/` y `formularios/`; la navegación programática pasa por `useNavegacionFinn` (8.5) | `no-restricted-imports` | — |

Ninguna regla de esta tabla admite un comentario `eslint-disable` (04 BE-03).

**Justificación de FE-22.** Cada regla protege una decisión aprobada (PF-3, inv. 27, 04 §7.10, FE-20) con una herramienta que falla en CI, como pidió 04 BE-03. *Alternativa descartada:* dejarlas como convención en las instrucciones para agentes (un agente puede no leerlas; el lint no se salta).

---

## 4. Patrón de formularios y escritura

### 4.1 Piezas

```
page.tsx (servidor) ──► flujos/<f>/lector.tsx (servidor) ──► consultas.formulario(…) u otra consulta de §6
                                   │ props serializables (DTO)
                                   ▼
                        flujos/<f>/formulario.tsx (cliente)
                          ├─ useFormularioFinn  → React Hook Form + contrato Zod de la operación (4.2)
                          ├─ useBorrador        → sessionStorage, solo flujos largos (4.11)
                          └─ useOperacion       → Server Action de 04 2.2.2 → ResultadoAccion (4.3 a 4.10)
```

Todo flujo de escritura usa estas tres piezas. Las acciones de un toque (4.14 y 4.15) usan solo `useOperacion` **[R1]**.

### 4.2 Contratos Zod en el cliente (FE-16)

- El formulario valida con el **mismo** contrato de `@finn/aplicacion/contratos` que aplica `accion()` en el servidor (04 BE-08), sin los campos que el usuario no escribe (`modo`, `revisionVista`, `huellaImpacto` y, en las creaciones, `id`), con `.omit()`.
- Los nombres de los campos del formulario son las **rutas del contrato** (`lineas.2.monto`). Así, los `campos` de un error `VALIDACION` o `DOMINIO` del servidor se asignan al campo con `setError(ruta)` sin traducción.
- Los valores se guardan como los escribe el usuario: montos como texto (`montoTexto`, 5.2), fechas como `FechaLocal` (5.5) e ids como texto.
- Validación en el cliente: al enviar, y al salir de un campo que ya se tocó. Si no pasa, **no se envía**. El servidor valida igual: la validación del cliente solo ahorra un viaje.
- Mensajes: la configuración regional en español de Zod y los mensajes propios de los primitivos (04 7.6) se cargan una vez en `formularios/zod-es.ts`; los textos son los mismos en el cliente y en el servidor.
- **Librería:** React Hook Form con `@hookform/resolvers/zod`. `useFieldArray` maneja las líneas del split, el reparto de una devolución y las coincidencias de la conciliación.

**Justificación de FE-16.** Las listas dinámicas (hasta 20 líneas), los errores por ruta y el estado "tocado" son exactamente lo que resuelve la librería; los agentes la conocen bien. Pesa 14,5 KB gzip (V5-13) y solo se carga en las rutas con formulario. *Alternativas descartadas:* un hook propio sobre `useState` (más código propio para las listas dinámicas y los errores por ruta); `useActionState` de React solo (no valida en el cliente ni maneja listas).

### 4.3 Ciclo de un envío

`useOperacion(accion)` es la única forma de llamar a una Server Action de escritura. Sus estados son:

| Estado | Significa | Pasa a |
|---|---|---|
| `editando` | El usuario escribe | `enviando` (envío válido) |
| `enviando` | Hay una llamada en vuelo, incluido el reintento automático (4.7) | `confirmando`, `listo` o `error` |
| `confirmando` | Llegó `REQUIERE_CONFIRMACION`; se muestra la previsualización | `enviando` (confirmar) o `editando` (volver a editar) |
| `listo` | `ok: true` (con `yaAplicada` o sin él) | El flujo se cierra (4.13) |
| `error` | Cualquier otra categoría | `editando` (corregir) o `enviando` (reintento manual, cuando 4.7 lo permite) |

Pasos de `enviar(entrada)`:
1. Si hay una llamada en vuelo, no hace nada (4.9).
2. Si no hay conexión, no envía y pasa a `error` con el código `sin_conexion` (4.8).
3. Completa la entrada: `modo`, el `id` de creación (4.5), los `esperado` de la instantánea (4.6) y, si viene de `confirmando`, `revisionVista` y `huellaImpacto`.
4. Llama a la acción y aplica la tabla de 4.7.

### 4.4 Previsualizar y confirmar (FE-07)

**Por defecto, el formulario envía `modo: 'confirmar'`.** Si el servidor encuentra un aviso de la clase "antes" (04 4.3: AV-01, AV-10, AV-11, AV-12, AV-13, AV-15, AV-16), no escribe y responde `REQUIERE_CONFIRMACION` con la previsualización. Las operaciones simples, como un gasto en el período activo, se guardan en un solo viaje.

**Previsualizar primero (lista cerrada).** Estos flujos empiezan llamando con `modo: 'previsualizar'`, porque su primera pantalla **es** el impacto:

| Operación | Por qué |
|---|---|
| OP-06 Eliminar cuenta | Siempre exige confirmación (AV-15) |
| OP-09 Archivar categoría | La previsualización resume los pasos compuestos (04 OP-09) |
| OP-12 Fusionar categorías | Siempre exige confirmación (AV-13) |
| OP-17 Auto-asignar | El usuario ve qué asignaría y qué quedaría sin cubrir antes de hacerlo |
| OP-19 Cambiar el ciclo | Siempre exige confirmación (AV-12, con el período de transición) |
| OP-53 Verificar saldo **[F6]** CF-01 | La primera pantalla es el saldo de Finn a la fecha y la diferencia, que la interfaz no calcula (PF-3) |

**Confirmar:**
1. Con la previsualización a la vista, el botón de confirmar envía **la misma entrada** más `revisionVista` y `huellaImpacto` de esa previsualización.
2. Si vuelve `REQUIERE_CONFIRMACION`, el impacto cambió entre medio (otra pestaña, el webhook): se reemplaza la previsualización, se indica "El impacto cambió" y se vuelve a pedir la confirmación. **Nunca se confirma de forma automática.**
3. Con el estado sin cambios, la confirmación escribe al primer intento: lo garantiza 04 4.3 y lo verificó V5-03b (dos llamadas exactas).

La previsualización se muestra con `ConfirmacionImpacto` (§10, Parte C): el impacto en el período activo, los avisos "antes" con su texto del servidor y los botones confirmar y volver a editar.

**Justificación.** Un solo viaje en el caso común, que es casi siempre el de un teléfono con 4G, y la misma seguridad de la huella cuando hay impacto. *Alternativa descartada:* previsualizar siempre antes de confirmar (dos viajes en cada gasto, sin información nueva en la mayoría).

### 4.5 Id de creación (FE-08)

- Lo usan las operaciones de clase **creación** de 04 4.6 y las que crean una transacción al aprobar (OP-37, OP-50) o al registrar una ocurrencia (OP-43).
- Se genera con `crypto.randomUUID()` en el **primer intento de envío**, no al montar el formulario: así no hay diferencias entre el render del servidor y el del cliente, y un formulario abierto y abandonado no consume un id.
- **Se conserva** en el reintento automático, en `confirmando`, ante un error de red, en el reintento manual y al recargar (se guarda en el borrador de los flujos largos, 4.11). Un `INCIERTO` seguido de una recarga reenvía el mismo id y el servidor responde `yaAplicada` (V5-05).
- **Se renueva** solo después de `ok: true` (si el flujo permite registrar otro) o si el usuario descarta el formulario.
- "Aprobar todos" (OP-38) genera un id por movimiento elegible al enviar y conserva el mapa completo en los reintentos.
- Las filas secundarias (líneas, efectos) nunca llevan id del cliente: los deriva el servidor del id principal (04 BE-31).
- **[R1] Cambiar los datos después de un `INCIERTO`.** Si el usuario corrige el formulario y vuelve a enviar con el mismo id, y el primer intento sí se había guardado, el servidor responde `conflicto_id` (04 4.6.1). 4.7 lo trata llevando al usuario a lo guardado, nunca creando otro registro como salida principal.

**Justificación.** Generarlo al primer envío evita ids distintos entre el render del servidor y el del cliente, y guardarlo hasta el éxito es lo que hace seguros los reintentos (04 4.6.1). *Alternativas descartadas:* generarlo al montar el formulario (diferencias de hidratación y ids consumidos sin uso); un id por intento (un reintento tras `INCIERTO` duplicaría el registro).

### 4.6 Valores `esperado` (FE-09)

- Las operaciones de valor absoluto (04 4.6.2) envían, por cada campo que cambian, el valor que **vio** el usuario. Esos valores vienen del DTO (`asignadoEsperado`, `esperado`) y se copian al estado del formulario **una vez, al abrir**.
- Si mientras tanto un `router.refresh()` trae props nuevas (6.7), el formulario **no** actualiza su copia: así un cambio hecho en otra parte termina en `conflicto_desactualizado`, en lugar de sobrescribirse en silencio (V5-03a y c).
- Los montos `esperado` viajan como texto decimal (04 4.6.2); el formulario los convierte desde los centavos del DTO con `centavosATextoDecimal` (5.4), que solo manipula texto.
- OP-17 usa `esperado: { revision }` con la `revision` del `Encabezado` al abrir.
- Si el `Encabezado` publicado trae una `revision` distinta de la que había al abrir un flujo largo, el formulario muestra un aviso no bloqueante: "Hubo cambios desde que abriste esto. Al guardar se verifica." No hace nada más: la protección real es `esperado` y la huella.

**Justificación.** `esperado` existe para detectar que otro cambió el valor (04 4.6.2); si el formulario lo actualizara con cada refresco, la detección desaparecería. *Alternativa descartada:* tomar el `esperado` del DTO más reciente al enviar (sobrescribiría en silencio un cambio hecho en otra pestaña o por el webhook).

### 4.7 Cada categoría de `ResultadoAccion` (FE-10)

| Categoría | La interfaz | Reintento | Datos y borrador |
|---|---|---|---|
| `ok: true` | Muestra los avisos "después" y las propuestas (4.13) y cierra el flujo. Con `yaAplicada`, el mismo final, con el texto "Ya estaba guardado" | — | Borra el borrador; renueva el id |
| `VALIDACION` | Cada mensaje en su campo (`campos`); el foco va al primer campo con error; `mensaje` como resumen | No | Conserva todo |
| `DOMINIO` | Si trae `campos`, en esos campos; si no, como mensaje del formulario. El texto es el del servidor (04 3.0.6) | No | Conserva todo |
| `REQUIERE_CONFIRMACION` | 4.4 | Confirmar es una acción del usuario | Conserva todo |
| `CONFLICTO` `conflicto_desactualizado` | Muestra el mensaje y los valores actuales (`datos`) junto a lo que escribió el usuario. Ofrece "Usar el valor actual": actualiza la copia de `esperado` con `datos` y deja el valor nuevo del usuario; el usuario vuelve a enviar | No | Conserva lo escrito |
| `CONFLICTO` `conflicto_id` **[R1]** | Muestra el mensaje del servidor ("Ya existe un registro con este identificador y datos distintos. No se guardó nada."). **Acción principal: "Ver lo guardado"**, que abre el detalle de lo que ya existe con ese id (tabla siguiente), desde donde se corrige con su edición. **Acción secundaria: "Guardar como nuevo"**, con el aviso visible "Esto crea un registro adicional; usalo solo si es un movimiento distinto."; genera un id nuevo y envía | No | Conserva lo escrito: antes de ir a lo guardado, el formulario guarda su estado como borrador **aunque sea un flujo corto**, así que "atrás" lo recupera (4.11) |
| `NO_ENCONTRADO` | "Esto ya no existe." Cierra el flujo y refresca la pantalla de destino | No | Borra el borrador |
| `NO_AUTORIZADO` | Va a `/ingresar?volver=<ruta del flujo>`; `ingresar` pasa a `verificar` si la sesión es AAL1 (§9, Parte B). Al volver, el flujo largo recupera su borrador | No | Conserva el borrador (flujos largos) |
| `OCUPADO` | Un reintento automático tras una espera aleatoria de 1 a 2 s, con la **misma entrada**. Si vuelve a fallar: el mensaje del servidor y el botón "Intentar de nuevo" | **Uno automático**; después, solo manual | Conserva todo, también el id |
| `INCIERTO` | Un reintento automático inmediato con la **misma entrada**. Si vuelve a fallar: el mensaje ("No pudimos confirmar si se guardó…") y "Intentar de nuevo" | **Uno automático**; después, solo manual | Conserva todo, también el id |
| `INTERNO` | El mensaje con la referencia `idError` (04 7.7). "Intentar de nuevo" disponible: es seguro porque la entrada es idempotente | No automático | Conserva todo |
| `INTERNO` `version_nueva` (FE-13) | "Hay una versión nueva" con "Recargar" | No | Conserva el borrador (flujos largos) |
| `sin_conexion` (cliente, 4.8) | "Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión." | No | Conserva todo |

- El reintento manual siempre reenvía la **misma entrada** con el **mismo id**: la idempotencia de 04 4.6 resuelve el caso en que el intento anterior sí se aplicó.
- **[R1] Dónde está "lo guardado"** ante `conflicto_id` (el id es el del hecho principal, 04 4.6):

| Operación de creación | "Ver lo guardado" abre | Desde ahí se corrige con |
|---|---|---|
| OP-20 a OP-27, OP-31, OP-33, OP-37, OP-43, OP-46, OP-50 (crean una transacción) | `/actividad/[id]` | `/actividad/[id]/editar` (OP-28) |
| OP-32 Condonar | `/actividad/[transaccionId]` de la compra de la línea (el formulario la conoce por su contexto) | Eliminar el evento (OP-34) y volver a condonar |
| OP-01 Crear cuenta | `/cuentas/[id]` | `/cuentas/[id]/editar` (OP-02) |
| OP-07 Crear grupo o categoría | `/presupuesto/estructura/grupos/[id]` o `/presupuesto/estructura/categorias/[id]` | El mismo flujo (OP-08) |
| OP-18 Crear meta | `/metas/[id]` | El mismo flujo (OP-18 editar) |
| OP-41 Crear regla | `/reglas/[id]` | El mismo flujo (OP-41 editar) |
| OP-42 Crear programada | `/programadas/[id]` | El mismo flujo (OP-42 editar) |
| OP-47 Terminar conciliación | `/cuentas/[cuentaId]`, en sus conciliaciones | — (una conciliación no se edita, 01 §1.8) |
| OPT-07 Crear institución | `/ajustes/instituciones/[id]` | El mismo flujo |
- `ok: false` nunca borra lo escrito.
- La presentación de cada mensaje (en el campo, en el formulario, como alerta) la decide el diseño, con estos requisitos: el mensaje queda asociado al campo para los lectores de pantalla (`aria-describedby`) y los errores del formulario se anuncian (§11, Parte C).

**Justificación.** Es la tabla de 04 7.2 llevada al cliente, con el reintento único de 04 4.7. *Alternativa descartada:* reintentos automáticos repetidos; con un solo escritor humano, un segundo `OCUPADO` indica algo que conviene mostrar (04 BE-18).

### 4.8 Red y conexión (FE-11)

- Si la llamada a la Server Action **lanza** un error de red (no hay `ResultadoAccion`), no se sabe si llegó al servidor: se trata como `INCIERTO` (reintento único y después manual).
- Si `navigator.onLine` es `false` **antes** de enviar, no se llama: el estado pasa a `error` con `sin_conexion` y el botón de enviar queda deshabilitado con su motivo visible mientras no haya conexión.
- Al volver la conexión no se reenvía nada solo: lo decide el usuario.
- La app es solo en línea (02 ADR-13): no hay cola de operaciones sin conexión.

**Justificación.** Sin conexión, la llamada no puede llegar; cuando la llamada falla en el camino, no se sabe si llegó, que es exactamente `INCIERTO`. *Alternativas descartadas:* una cola de operaciones sin conexión (02 ADR-13 fija la app solo en línea); tratar el fallo de red como `INTERNO` (no se reintentaría y el usuario no sabría si se guardó).

### 4.9 Doble envío (FE-12)

- `useOperacion` guarda una marca "en vuelo" en una referencia, no en el estado de React: un segundo envío en el mismo ciclo (doble toque, Enter repetido) se ignora antes de que React vuelva a pintar. V5-04: tres envíos en el mismo ciclo, una llamada.
- Mientras está `enviando`, el control de envío queda deshabilitado e indica que se está guardando [Diseño, con el requisito de §11: el foco no se pierde].
- Next despacha las Server Actions **de una en una** (V5-11). No cambia esta regla, pero implica que una acción posterior espera a la anterior: por eso las lecturas interactivas tienen límites (4.12).
- El id de creación (4.5) es la segunda barrera: aunque llegaran dos llamadas, el servidor aplicaría una sola.

**Justificación.** Deshabilitar el botón no basta: el estado de React se actualiza después del evento, y dos eventos del mismo ciclo lo ven habilitado; la referencia sí lo impide (V5-04). *Alternativa descartada:* confiar solo en la idempotencia del servidor (evitaría el duplicado, pero mostraría dos resultados y dos animaciones de envío).

### 4.10 Desfase de versión (FE-13)

**Verificación de P5-9 (V5-14).** La Skew Protection de Vercel solo existe en los planes **Pro y Enterprise**; no en Hobby. Además no está disponible para despliegues `--prebuilt`. Finn no la tiene.

**Cuándo ocurre (V5-09).** Los ids de las Server Actions son estables entre compilaciones mientras no cambie el archivo ni el nombre exportado. Una pestaña abierta con la versión anterior falla cuando la nueva versión:
- cambia el nombre o el archivo de una acción: el servidor responde 409 y la llamada lanza `Server Action "…" was not found on the server`;
- cambia el contrato de una operación: el servidor responde `VALIDACION` a una entrada que la pestaña vieja considera válida.

**Tratamiento:**
- `useOperacion` reconoce el primer caso por el mensaje del error y lo convierte en `INTERNO` con el código `version_nueva`. Muestra "Hay una versión nueva de Finn. Recargá para continuar." y el botón "Recargar" (`location.reload()`). No reintenta.
- Los flujos largos conservan su borrador, así que la recarga no pierde lo escrito (4.11). Los cortos pueden perder lo que se estaba escribiendo; es aceptable porque son cortos.
- El service worker avisa además cuando hay una versión nueva instalada (§8, Parte D), antes de que el usuario llegue a enviar.
- **Regla para la Fase 8** (D-3): cambiar el nombre o el archivo de una Server Action, o el contrato de una operación de forma incompatible, se trata como un cambio con versión anterior viva: se documenta en el PR y se despliega fuera del horario de uso.

**Justificación.** Sin la protección de la plataforma, el error se vuelve un mensaje claro y recuperable. *Alternativas descartadas:* pasar a Vercel Pro (rompe el costo de $0); mantener a mano las acciones viejas durante un tiempo (complejidad sin necesidad para un usuario).

### 4.11 Borradores (FE-14)

**Qué se guarda.** Solo los flujos largos: registrar con split, editar una transacción, devolver con reparto, revisar un movimiento de la bandeja y conciliar (sin la carga firmada). El resto de los largos de PA-3 (cuentas, programadas, formatos, archivar, fusionar) también, con el mismo mecanismo. **[R1]** Dos excepciones: cualquier flujo, corto o largo, guarda su borrador antes de ir a "Ver lo guardado" tras un `conflicto_id` (4.7); y la lista de la bandeja escribe el borrador de `bandeja/[movimientoId]` al traspasarle un movimiento (4.15).

**Dónde y cómo.**
- **[F6]** **CF-19.** La plantilla de categorías guarda además, antes de la primera tanda, los ids de creación de cada elemento; al volver se reenvían los elementos sin resultado con los mismos ids (lo creado responde `ya_aplicada`). Sin borrador, compara los nombres con `estructura()` y no envía los que ya existen.
- `sessionStorage` de la pestaña, a través de `cliente/almacen.ts`, que envuelve cada lectura y escritura en `try/catch`. Si el almacenamiento no está disponible, el formulario funciona igual, sin borrador y sin avisar.
- Clave: `finn:borrador:v1:<ruta del flujo sin parámetros de búsqueda>:<id de la entidad, si la hay>`.
- Contenido: `{ version: 1, guardadoEn, campos, id (creación), esperado (la copia al abrir), revisionAlAbrir }`.
- Se escribe con una espera de 500 ms después del último cambio.
- Se lee después de montar el formulario (en un efecto, no durante el render, para no romper la hidratación).

**Restaurar.** Si al abrir el flujo hay un borrador, se restaura y se muestra "Recuperamos lo que estabas escribiendo" con la opción "Descartar borrador". La copia de `esperado` restaurada es la del borrador (la de cuando se abrió por primera vez), así que un cambio hecho en otra parte termina en `conflicto_desactualizado`, como debe.

**Borrar.** Al terminar con `ok: true`, al descartar el formulario, ante `NO_ENCONTRADO` y al salir de la sesión (se borran todas las claves `finn:borrador:` de la pestaña).

**Conciliación.** La carga firmada nunca se guarda. El borrador guarda la cuenta, la huella SHA-256 del archivo (calculada con `crypto.subtle`), las coincidencias marcadas y los movimientos ya agregados. Si el usuario vuelve a subir **el mismo archivo** (misma huella), las marcas se restauran; con otro archivo, el borrador se descarta.

**Privacidad.** Montos, comercios y notas quedan en el `sessionStorage` de esa pestaña mientras está abierta. Nada sale del dispositivo ni se comparte con otras pestañas (D-5).

**Justificación.** La respuesta a los supuestos del Paso 1 pide que una recarga o una sesión vencida no pierdan lo escrito, sin que nada salga del dispositivo; `sessionStorage` vive solo en la pestaña y se borra al cerrarla. *Alternativas descartadas:* `localStorage` (persiste después de cerrar la pestaña y se comparte entre pestañas); guardar el borrador en el servidor (agregaría una tabla y una operación, fuera del alcance de esta fase).

### 4.12 Lecturas interactivas (FE-15)

Aplica CP-3 a las dos lecturas permitidas: la sugerencia de categoría mientras se escribe un comercio y la búsqueda de compras para devolver. Hook: `useLecturaInteractiva(lectura, { minimo: 2, esperaMs: 300 })`.

| Requisito (P5-6) | Cómo se cumple |
|---|---|
| Espera de 300 ms entre pulsaciones | La consulta sale 300 ms después de la última pulsación |
| Mínimo 2 caracteres | Con menos de 2 caracteres (sin espacios a los lados) no consulta y vacía el resultado |
| Cancelación de la anterior | La API de Server Actions no acepta una señal de cancelación, así que se cancela del lado del cliente: **a lo sumo una lectura en vuelo**; si el texto cambia mientras tanto, solo se guarda el último texto pendiente y sale al terminar la que está en vuelo; las intermedias nunca salen. Una respuesta que no corresponde al texto actual se descarta. V5-08: "ab" (lenta) y "abc": dos consultas y gana "abc" |
| Límite de resultados | El de la consulta: `sugerencia`, una; búsqueda de compras, 20 (04 6.14.4) |

Además: los errores de una lectura interactiva no se muestran como error del formulario (la sugerencia es opcional); si falla, simplemente no hay sugerencia. Por V5-11, una escritura del mismo formulario espera a la lectura en vuelo, que tiene el presupuesto de 30 ms de 04 6.0.7.

**Justificación.** Una sola lectura en vuelo es la cancelación posible con Server Actions, y además evita que varias lecturas retrasen una escritura, que Next despacha detrás de ellas (V5-11). *Alternativa descartada:* un Route Handler con `AbortController` (permitiría abortar, pero la lista de Route Handlers es cerrada y P5-6 eligió Server Actions).

### 4.13 Al terminar

- **Avisos "después"** (`SalidaOperacion.avisos`): se muestran con su texto del servidor en la pantalla a la que vuelve el flujo [Diseño, con el requisito de anunciarse a los lectores de pantalla].
- **Propuestas** (`SalidaOperacion.propuestas`, CP-8). **[F6] CF-05:** con `ejecucion: 'un_toque'` se ejecuta tal cual; con `'abrir_flujo'` la interfaz escribe `entrada` como borrador del flujo de destino (4.11) y navega a su ruta: OP-20 → `/registrar/gasto`, OP-21 → `/registrar/ingreso`, OP-27 → `/registrar/entrada-tarjeta`, OP-42 → `/programadas/nueva`: se ofrecen como acciones de un toque o como enlace a su flujo con la entrada como valores iniciales. La interfaz nunca calcula la entrada de una propuesta.
- **Navegación:** `cerrarFlujo()` (1.4). La pantalla de destino ya trae los datos nuevos con la respuesta de la acción, por `revalidatePath('/', 'layout')` (04 5.8, V5-03a): **no** se llama a `router.refresh()` después de escribir.
- Borra el borrador y renueva el id (4.5, 4.11).

### 4.14 Acciones de un toque y salida para revertir (FE-24) **[R1]**

**Qué son.** Acciones sin datos que completar ni confirmación previa. No tienen URL (PA-4): se ejecutan desde la pantalla donde están, con `useOperacion` (mismo envío, doble envío, reintentos y tabla de 4.7), y su resultado se ve en esa misma pantalla.

| Acción | Operación | Dónde | Salida para revertir (operación inversa) |
|---|---|---|---|
| Aprobar un movimiento listo | OP-37 | Bandeja | **Excepción registrada [R2]** (PB-2): sin salida para revertir; la salida es "Ver transacción" (4.15) |
| Aprobar todos | OP-38 | Bandeja | — (sin operación inversa) |
| Descartar un movimiento | OP-39 `descartar` | Bandeja, `bandeja/[movimientoId]` | **Restaurar**: OP-39 `restaurar` |
| Restaurar un movimiento | OP-39 `restaurar` | Bandeja (descartados) | **Descartar**: OP-39 `descartar`, solo si el estado resultante lo admite (`pendiente`, `posible_duplicado`, `no_reconocido`, `error`; no `con_coincidencia`, 04 OP-39) |
| Es duplicado | OP-40 `es_duplicado` | Bandeja, `bandeja/[movimientoId]` | **Restaurar**: OP-39 `restaurar` |
| Es legítimo | OP-40 `es_legitimo` | Bandeja, `bandeja/[movimientoId]` | — (ninguna operación vuelve a `posible_duplicado`) |
| Rechazar una coincidencia | OP-40 `rechazar_coincidencia` | Bandeja, `bandeja/[movimientoId]` | — (ninguna operación vuelve a proponer la coincidencia) |
| Marcar notificaciones como leídas | OPT-04 | Notificaciones, Inicio (cambios retroactivos) | — (sin operación inversa) |
| Desactivar una programada | OP-42 `activa: false` | Programadas, `programadas/[programadaId]` | **Reactivar**: OP-42 `activa: true` |
| Reactivar una programada | OP-42 `activa: true` | Ídem | **Desactivar**: OP-42 `activa: false` |
| Desarchivar una cuenta | OP-05 | `cuentas/[cuentaId]` | **Archivar de nuevo**: OP-04 con `devolverAsignacionesFuturas: false` |
| Desarchivar una categoría | OP-10 | `presupuesto/estructura/categorias/[categoriaId]`, detalle de la categoría | — (OP-09 puede necesitar decisiones); ofrece el enlace al flujo de archivar |
| Subir o bajar en el orden de la estructura | OP-08 (`orden`) | `presupuesto/estructura` | **Deshacer**: OP-08 con los valores intercambiados |
| Cerrar las otras sesiones | Autenticación (§9) | Ajustes > Seguridad | — |
| Ejecutar una propuesta (CP-8) | OP-14, OP-11 u OP-41 | Donde aparece el aviso | AV-08 y AV-22 (OP-14): **Deshacer**, OP-14 con `montoNuevo` y `esperado.monto` intercambiados. AV-14 (OP-11): — (no se puede volver a asignar a una categoría archivada, inv. 20). Regla de comercio (OP-41 crear): **Deshacer**, OP-41 eliminar con el id de la regla creada |
| **[F6]** Ejecutar una propuesta de CF-05 | OP-15, OP-14, OP-18, OP-42 | Donde aparece el hallazgo | Ritmo con OP-15: **Deshacer**, OP-15 con origen y destino intercambiados. OP-14: **Deshacer** como AV-08. Ajustar meta (OP-18): OP-18 con los valores intercambiados. Crear una programada (OP-42): OP-51 con el id creado. Reactivarla: OP-42 `activa: false`. Las de `abrir_flujo` no tienen salida (son un flujo) |

**Reglas de la salida para revertir:**
1. Aparece solo después de `ok: true` y solo si la tabla define una inversa. **[R2] Excepción registrada a la regla de PA-4:** "Aprobar" un movimiento sí se puede revertir, pero no con una operación inversa única (OP-29 deja el movimiento en `descartado` y volver a `pendiente` exige además OP-39, dos operaciones que no forman una unidad). Por eso no ofrece salida para revertir: ofrece "Ver transacción", desde donde se puede eliminar con su flujo (PB-2).
2. Se arma **solo** con la entrada de la acción y su resultado (ids y valores ya conocidos, intercambiados cuando hace falta). Nunca calcula montos (PF-3).
3. Sigue disponible **mientras la pantalla siga montada** y el elemento siga a la vista, **sin límite de tiempo** (WCAG 2.2, criterio 2.2.1). Desaparece al navegar a otra pantalla, al hacer otra acción sobre el mismo elemento o al usarla.
4. Si el elemento sale de la lista por la revalidación (por ejemplo, un movimiento descartado ya no está entre los activos), la salida queda en el lugar donde estaba [Diseño], con el nombre del elemento: "Descartaste SUPER SELECTOS $45.00. Restaurar".
5. La inversa es una operación más: usa su propio `useOperacion` con la tabla de 4.7. Si responde `REQUIERE_CONFIRMACION`, se muestra la previsualización como en cualquier flujo; si falla, se muestra su error.
6. Accesibilidad: el resultado y la salida se anuncian a los lectores de pantalla y se alcanzan con el teclado (detalle en §11, Parte C).

**Justificación.** Ejecutar sin preguntar es rápido; ofrecer la vuelta atrás cubre el error de toque sin agregar un paso a cada acción. *Alternativas descartadas:* pedir confirmación antes de cada acción de un toque (contradice PA-4); una salida que desaparece sola a los pocos segundos (no cumple WCAG 2.2.1 y se pierde si el usuario se distrae).

### 4.15 "Aprobar" con un toque en la bandeja (FE-25) **[R1]**

**[F6]** **Soltar sobre una categoría (CF-21).** Usa el mismo envío, con la variante `{ movimientoId, id, categoriaId, esperado }`. Si responde `REQUIERE_CONFIRMACION` o un faltante, el traspaso al flujo es el de esta sección, con el borrador que agrega `{ variante: 'categoria', categoriaId }`; el flujo confirma con la misma variante, el mismo id y la `huellaImpacto`. El resultado es el del toque, sin "Deshacer" (PB-2). `arrastre_no_permitido` muestra su mensaje en la fila.

**Cuándo se ofrece.** En cada fila de la lista de la bandeja cuyo `MovimientoDto` cumple `aprobacion.posible === true` y `aprobacion.requiereConfirmacion === false` (04 6.8). En los demás, la fila lleva al flujo `bandeja/[movimientoId]`.

**Entrada que envía** (OP-37, 04 3.6):

| Campo | Valor |
|---|---|
| `movimientoId` | El de la fila |
| `id` | `crypto.randomUUID()` al enviar (4.5); se conserva en el reintento de la misma fila |
| `origenId` | Solo si `tipoPropuesto = 'pago_tarjeta'`: `movimiento.origenPropuesto.id` (04 BE-41). Si no hay propuesta, `aprobacion.posible` ya es `false` (`faltantes` incluye `origen`) |
| `recordarRegla` | No se envía (falso). Si el servidor devuelve la propuesta de regla de comercio (CP-8), se ofrece después del éxito como acción de un toque con su salida para revertir (4.14) |
| `revisionVista`, `huellaImpacto` | No se envían: si hace falta confirmar, se pasa al flujo |

Cada fila tiene su propio `useOperacion`: se pueden aprobar varias seguidas (Next las despacha en orden, V5-11) y un fallo en una no afecta a las demás.

**Resultado:**

| Respuesta | Qué hace la lista |
|---|---|
| `ok: true` (o `yaAplicada`) | La fila sale de la lista por la revalidación (6.3). En su lugar queda el resultado **[R2]** con **exactamente lo aprobado, tomado de la respuesta del servidor** (`valor.aprobado`, CP-15), nunca de la fila que se veía: monto, comercio, cuenta y categoría, o "Dividido en {N} partes" si tiene más de una línea. Por ejemplo: "Aprobado: SUPER SELECTOS · $45.00 · Visa Oro · Supermercado". Lleva "Ver transacción" (`/actividad/[valor.id]`) y, si llegó, la propuesta de regla de comercio. Si el servidor no devolviera `aprobado`, el resultado dice solo "Aprobado" con "Ver transacción" (PB-3) |
| `REQUIERE_CONFIRMACION` (AV-01 o AV-16 que no se anticiparon) | **Traspaso al flujo** (abajo), con la previsualización |
| `VALIDACION`, `CONFLICTO`, o `DOMINIO` con un código que necesita datos del usuario (por ejemplo `movimiento_sin_cuenta`, `movimiento_incompleto`, `linea_sin_destino`, `suma_lineas_distinta`, `cuenta_archivada`, `categoria_archivada`, `ocurrencia_ya_resuelta`, `fecha_*`) | **Traspaso al flujo**, con el mensaje |
| `DOMINIO` `movimiento_estado_no_valido`, o `NO_ENCONTRADO` (el movimiento ya se aprobó o se descartó en otra parte) | Muestra el mensaje en la fila; la revalidación la actualiza. Sin traspaso |
| `OCUPADO`, `INCIERTO` | Reintento automático único con el mismo id (4.7); si persiste, el mensaje y "Intentar de nuevo" en la fila. Como OP-37 es idempotente por el estado del movimiento (04 4.6), un reintento después de un éxito responde `yaAplicada` |
| `INTERNO` | El mensaje con la referencia en la fila |
| `version_nueva` (FE-13) | El aviso global "Hay una versión nueva" |

**Traspaso al flujo.**
1. La lista escribe el borrador de `bandeja/[movimientoId]` (4.11) con `{ id, error }` y, si es `REQUIERE_CONFIRMACION`, también la previsualización.
2. Navega a `/bandeja/[movimientoId]` (flujo largo, pantalla completa).
3. El flujo restaura el borrador: muestra el mensaje junto al campo o, con `REQUIERE_CONFIRMACION`, la confirmación del impacto. Confirmar envía la entrada del movimiento con el **mismo id** y la `huellaImpacto` recibida (4.4).

**Justificación.** El caso más frecuente (un SMS reconocido, con categoría sugerida y en el período activo) se resuelve con un toque y sin cambiar de pantalla; los casos que necesitan al usuario siguen pasando por la revisión completa, con el mismo id y sin perder el mensaje. *Alternativas descartadas:* aprobar solo desde el flujo (agrega dos navegaciones a la acción más frecuente); aprobar con un toque también lo que requiere confirmación (dejaría pasar AV-01 o AV-16 sin que el usuario los vea).

---

## 5. Entrada de montos y fechas

### 5.1 Qué puede calcular el cliente (PF-3)

| Permitido (solo en `formularios/` y `componentes/formularios/`, con `sumar` y `restar` de `Centavos`) | Prohibido |
|---|---|
| Cuánto falta repartir: total escrito − Σ líneas escritas | Rellenar sola la última línea con lo que falta: ese valor se enviaría |
| Cuánto suma un reparto (devolución, cobro) | Calcular Disponible, LPA, "te falta reservar" o cualquier derivado resultante: eso lo da la previsualización |
| Habilitar o no el botón (por ejemplo, "las partes no suman el total") | Proporciones, promedios o redondeos de montos |
| Convertir centavos del DTO a texto para un `esperado` o un valor inicial (5.4, manipulación de texto) | Armar la entrada de una propuesta (CP-8) |

Las variantes de asignación rápida (OP-16) muestran los valores que trae el servidor (`contexto.rapida`, 04 6.14.4), pero envían la `variante`, no un monto.

### 5.2 `EntradaMonto` (FE-17)

**Contrato** (componente de cliente en `componentes/formularios/`; la forma visual es del diseño):

| Prop | Tipo | Significado |
|---|---|---|
| `nombre` | `string` | Ruta del campo en el contrato (`total`, `lineas.0.monto`) |
| `etiqueta` | `string` | Del catálogo de textos (§12) |
| `valor` | `string` | Texto tal como lo escribió el usuario (estado del formulario) |
| `alCambiar` | `(texto: string) => void` | Recibe el texto filtrado |
| `conSigno` | `boolean` | Solo en los campos `montoTextoConSigno` (saldo inicial, ajuste de inversión) |
| `signo`, `alCambiarSigno` | `'positivo' \| 'negativo'` | Control aparte del signo, solo con `conSigno` (P5-12) |
| `etiquetasSigno` | `{ positivo: string; negativo: string }` | Por ejemplo, "Debo" y "Tengo a favor" en el saldo inicial de una tarjeta (04 OP-01, nota) |
| `error` | `string \| undefined` | Mensaje del contrato o del servidor |
| `descripcion` | `string \| undefined` | Ayuda opcional |
| `requerido`, `deshabilitado` | `boolean` | — |

**Comportamiento:**
- Es un campo de texto con `inputMode="decimal"`, `autoComplete="off"` y `enterKeyHint` según el flujo. **No** es `type="number"` (que en Android no deja escribir coma y descarta lo que no entiende).
- **Al teclear** se descarta todo carácter que no sea un dígito, `.` o `,`. El signo nunca se escribe en el texto.
- **Al pegar** (`limpiarPegado`) (**[F6]** CF-15: además del guion, U+2212 y U+2013 al inicio marcan negativo): quita `$`, `USD`, `US$` y espacios; un `-` inicial o paréntesis marcan negativo (solo se aplica si `conSigno`). Si el texto pegado trae los dos separadores (`1,234.50` o `1.234,50`), el último es el decimal y los otros se quitan. Si trae un mismo separador repetido (`1,234,567`), son de miles y se quitan. Un único separador seguido de tres cifras (`1,234`) se deja tal cual para que la normalización lo marque como ambiguo.
- **Normalización** (`normalizarMontoEscrito`, V5-01). El único separador permitido, sea `.` o `,`, es el **decimal**:

| Escrito | Resultado | Texto que se envía | Mensaje (catálogo §12) |
|---|---|---|---|
| (vacío) | `vacio` | — | El del contrato si es obligatorio |
| `.` o `,` | `incompleto` | — | "Escribí un monto." |
| `5`, `5.`, `5,` | `valido` | `5` | — |
| `,75` | `valido` | `0.75` | — |
| `12,3` | `valido` | `12.3` | — |
| `0045,10` | `valido` | `45.10` | — |
| `1,234` o `1.234` | `invalido` (`max_dos_decimales`) | — | "Usá el punto o la coma solo para los centavos, sin separador de miles." |
| `1.2.3` | `invalido` (`mas_de_un_separador`) | — | Ídem |
| más de 8 cifras enteras o más de 21474836.47 | `invalido` (`demasiado_grande`) | — | "El monto máximo es $21,474,836.47." |
| `0`, `0,00` | `valido` con `esCero` | `0` | El contrato decide: `montoTexto` exige > 0 |

- El texto que se envía cumple `montoTexto` de 04 §13.3 (`/^\d{1,8}(\.\d{1,2})?$/`) y vuelve a los mismos centavos (propiedad de V5-01, 900.000 textos). Con `conSigno` y signo negativo se antepone `-`, nunca a un cero (`montoTextoConSigno`).
- **Vista previa:** con un valor válido, el campo muestra el monto formateado (`$1,234.50`) asociado al campo con `aria-describedby`, para que el usuario confirme qué entendió Finn [Diseño: dónde y cómo].
- **Sin calculadora** (P5-12): el campo no evalúa expresiones.

**Justificación.** Un único separador decimal resuelve la ambigüedad del teclado de Android, que según el idioma del teléfono muestra coma o punto, sin pedir separadores de miles que el usuario no necesita escribir. *Alternativas descartadas:* aceptar separadores de miles al escribir (`1,234` sería ambiguo entre $1.234 y $1,234.00); un teclado propio en pantalla (P5-12).

### 5.3 `EntradaFecha`

| Prop | Tipo | Significado |
|---|---|---|
| `nombre`, `etiqueta`, `error`, `requerido` | — | Como en `EntradaMonto` |
| `valor` | `FechaLocal` | `'AAAA-MM-DD'` |
| `alCambiar` | `(f: FechaLocal) => void` | — |
| `minima`, `maxima` | `FechaLocal` | Del DTO: apertura de la cuenta, `restricciones.puedeCambiarFecha` (04 6.7.2), `hoy` del `Encabezado` |

- El valor por defecto es el `hoy` del `Encabezado`, **nunca** la fecha del dispositivo (04 13.4).
- El componente puede usar el selector nativo (`<input type="date">` entrega `AAAA-MM-DD`) o uno del diseño, siempre que entregue una `FechaLocal` y respete `minima` y `maxima`. La fecha se muestra con el módulo de 5.4.

### 5.4 Módulo de formato (FE-18)

`src/formato/index.ts` es el **único** lugar de `apps/web` que formatea montos, fechas, instantes y porcentajes (L6) y el único que convierte centavos a texto (L3). Es el gemelo de 04 §7.10 para la interfaz.

| Función | Entrada | Salida verificada (V5-02) | Cómo |
|---|---|---|---|
| `centavosATextoDecimal(c)` | `Centavos` | `123450` → `"1234.50"`; `-1` → `"-0.01"` | Solo texto: relleno con ceros y corte de las dos últimas cifras |
| `formatearMonto(c)` (**[F6]** CF-15: arma el texto con `formatToParts` y cambia `minusSign` por U+2212; igual `formatearMontoTexto`) | `Centavos` | `$1,234.50`, `−$45.00`, `$0.75`, `$21,474,836.47` | `Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })` con el **texto decimal** como entrada (Intl acepta cadenas decimales), nunca `c / 100` |
| `formatearMontoTexto(t)` | texto normalizado de 5.2 | `"12.3"` → `$12.30` | Ídem |
| `formatearFecha(f)` | `FechaLocal` | `05/10/2026` | Reordenamiento del texto; sin `Date` ni `Intl` |
| `formatearFechaTexto(f)` | `FechaLocal` | `5 oct 2026`, `21 sep 2026` | Reordenamiento y una tabla propia de meses (`ene` … `dic`) |
| `formatearPeriodo(p)` | `PeriodoDto` | `21/09/2026 – 20/10/2026` | Con `formatearFecha` |
| `formatearPeriodoCorto(p)` | `PeriodoDto` | `21 sep – 20 oct 2026` | Con la tabla de meses; el año es el del fin |
| `formatearInstante(i)` | `Instante` | `05/10/2026 14:32` (America/El_Salvador, 24 h) | `Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', hourCycle: 'h23', … })` armado con `formatToParts` |
| `formatearPorcentaje(pb)` | puntos básicos (04 6.0.3) | `4550` → `45.5%`; `10000` → `100%` | `Intl.NumberFormat('es-SV', { style: 'percent', maximumFractionDigits: 2 })` con la cadena `"<pb>e-4"`, sin dividir |

Decisiones de detalle, todas por V5-02:
- **Sin flotantes.** El texto decimal se construye desde el entero. En 400.000 montos, el camino con `c / 100` también coincidió, pero la regla de 02 ADR-15 prohíbe flotantes en montos y el camino de texto no depende de esa coincidencia.
- **Meses propios.** ICU escribe septiembre como "sept"; 04 §7.10 fija meses abreviados de tres letras. La tabla propia hace el formato independiente de la versión de ICU.
- **Instante con `formatToParts`.** ICU separa fecha y hora con una coma (`05/10/2026, 14:32`); 04 §7.10 fija `05/10/2026 14:32`.
- **Porcentaje sin espacio**, como lo produce ICU para `es-SV`. 04 no fija este formato; queda fijado aquí.
- **Protección ante cambios de ICU** (D-4): una prueba unitaria en Node 24 y la prueba E2E en Chromium (02 ADR-19) fijan todas las salidas de la tabla. Si fallan tras una actualización, se corrige solo este módulo.
- La lectura de montos y estados por lectores de pantalla (por ejemplo, el signo de `-$45.00`) se define en §11 (Parte C).

**Justificación.** Un solo módulo con salidas fijadas por pruebas es lo que protege la regla de 04 §7.10 frente a cambios de ICU y de navegador. *Alternativas descartadas:* `toLocaleString` disperso en los componentes (formatos distintos entre pantallas); una librería de formato (más peso sin ventaja con `Intl` y dos tablas pequeñas).

### 5.5 Fechas de negocio y "hoy" (FE-19)

- Toda fecha de negocio viaja y se guarda en el cliente como `FechaLocal` (`'AAAA-MM-DD'`, 04 13.3), sin `Date`.
- "Hoy" y el período activo son siempre los del `Encabezado` (04 5.5): la interfaz nunca calcula un período ni decide qué día es con el reloj del dispositivo.
- La única excepción al uso de `Date` en el cliente es la agenda de la medianoche (6.7), que usa el reloj del dispositivo solo para **medir cuánto falta**, nunca para decidir el día.

**Justificación.** Es la regla del error 5 de la 1.0 (fecha en UTC) aplicada a la interfaz: el día lo decide el servidor (04 13.1.1). *Alternativa descartada:* `Date` en el cliente para fechas de negocio (con el teléfono en otra zona o con la hora mal puesta, la fecha por defecto o el período mostrado serían de otro día).

---

## 6. Estado y datos en el cliente

### 6.1 Sin caché de números (FE-20, RK-11)

- **La única fuente de un número es la consulta del servidor**, recibida en cada render de Server Component. El cliente no guarda ningún DTO ni ningún número en un almacén propio.
- Prohibido en `apps/web` (lint de 04 §5.8 y FE-22): SWR, React Query o cualquier caché de datos; almacenes globales de DTO (Zustand, Redux, contexto con datos de pantallas); guardar números en `localStorage`, `sessionStorage` o IndexedDB, **salvo** lo que el usuario está escribiendo en un borrador (4.11).
- `next.config.ts` no activa `cacheComponents` ni sube `staleTimes.dynamic`, que desde Next 15 vale 0 por defecto (la caché del enrutador no reutiliza páginas dinámicas al navegar hacia adelante); `'use cache'` ya está prohibido (04 §5.8). La Parte C lo comprueba en la compilación real.
- **Atrás y adelante del navegador** pueden mostrar una página restaurada desde la caché del enrutador. FE-21 la refresca si sus datos tienen más de 30 s (6.7, D-1).
- El `Encabezado` que guarda el marco (1.6) no es una caché: es el de la última página que se mostró, con el instante en que llegó, y se reemplaza en cada render.

**Justificación.** Con Server Components y `revalidatePath`, los números ya llegan frescos en cada render; una caché en el cliente solo podría servir números viejos, que es el error 11 de la 1.0. *Alternativa descartada:* una caché de cliente con invalidación tras escribir (no se entera de lo que escriben el webhook, la tarea diaria u otra pestaña).

### 6.2 Dónde vive cada estado (FE-20)

| Estado | Dónde | Ejemplos |
|---|---|---|
| Qué se está viendo | **URL** (ruta y parámetros de búsqueda) | Período (`?periodo=`), filtros de Presupuesto y Actividad, cursores, vista de la bandeja, ventana y cuentas de un reporte, flujo abierto |
| Números y datos | **Servidor**, en cada render | Todo dato de 04 §6 |
| Lo que el usuario escribe | **Componente** (React Hook Form) | Campos, líneas, signo |
| Borrador de un flujo largo | **`sessionStorage`** de la pestaña (4.11) | Campos, id de creación, copia de `esperado` |
| Estado de un envío | **Componente** (`useOperacion`) | `enviando`, `confirmando`, previsualización |
| Detalles abiertos "al tocar", pestañas internas sin URL propia | **Componente** | Desglose de un sobregiro (PF-2) |
| Preferencias del dispositivo | `localStorage` (next-themes) y estado del permiso del navegador | Tema; tarjeta "Activar notificaciones" descartada (CP-5) |
| `Encabezado` vigente | Contexto del marco (1.6) | Contadores, `hoy`, `revision` |

**Parámetros de búsqueda:**
- Solo se escriben cuando difieren del valor por defecto (por ejemplo, sin `?periodo=` se ve el período activo).
- Los cambia la interfaz con `router.replace` en los filtros y con `router.push` en la navegación entre períodos, para que "atrás" vuelva al período anterior [§3, Parte B].
- Un parámetro inválido (un `periodo` que no es inicio de período, un `cursor` corrupto) hace que la consulta responda `VALIDACION`; la página redirige a la misma ruta sin ese parámetro.
- Las listas van separadas por comas (`?cuentas=<id>,<id>`).

### 6.3 Revalidación tras escribir

- `accion()` ejecuta `revalidatePath('/', 'layout')` tras cada escritura correcta (04 §5.8). La respuesta de la Server Action ya trae la pantalla actual con los datos nuevos (V5-03a): el cliente **no** llama a `router.refresh()` después de escribir.
- Al cerrar un flujo superpuesto con `router.back()`, la pantalla de origen también muestra los datos nuevos (V5-06b): la revalidación invalida todo el árbol.

### 6.4 `Encabezado` en el marco (FE-06)

`ProveedorEncabezado` expone `{ encabezado, recibidoEn }` a los contratos de navegación (§3, Parte B), al refresco (6.7) y a los formularios (4.6). Cada página publica el suyo (1.6). Lo que muestra el marco sale de ahí:
- el contador de la bandeja: `bandejaPorRevisar` (CP-2);
- el contador de notificaciones: `notificacionesNoLeidas`;
- `hoy` y `periodoActivo` para la agenda de la medianoche y para mostrar el período activo en Presupuesto (P5-10).

### 6.5 Datos viejos

- La `revision` del `Encabezado` identifica el estado de los datos que se ven. Se usa en tres lugares:
  - la copia de `revisionAlAbrir` de un formulario largo, para el aviso no bloqueante de 4.6;
  - OP-17, como `esperado.revision`;
  - el diagnóstico (se registra con cada error, 04 7.8).
- Las escrituras no dependen de que la pantalla esté al día: las protegen `esperado` (4.6), la huella (4.4) y el id (4.5).
- Lo que mantiene la pantalla al día es el refresco automático (6.7) y la revalidación tras escribir (6.3).

### 6.6 Puesta al día del día

La puesta al día de 04 BE-50 corre en `after()` del layout, **después** de pintar la primera página del día. Esa página puede mostrarse sin las programadas que se registren solas ese día. Se acepta (P5-8): la siguiente navegación o refresco ya las muestra. No se agrega ningún sondeo.

### 6.7 Refresco automático (FE-21)

`useRefrescoAutomatico`, en el marco, llama a `router.refresh()` en estos casos. `router.refresh()` vuelve a pedir los Server Components de la ruta actual y **conserva** el estado de los componentes de cliente (V5-07: un borrador a medio escribir sigue intacto).

| Disparador | Regla |
|---|---|
| Volver a la pestaña | Al pasar `visibilitychange` a visible, si estuvo oculta **más de 60 s** (P5-8) |
| Recuperar la conexión | En el evento `online` (P5-8) |
| Medianoche de El Salvador | Agendada con el `hoy` del `Encabezado` (abajo) |
| Atrás o adelante del navegador | En `popstate`, si el `Encabezado` publicado tiene más de 30 s (D-1) |

Reglas comunes:
- Como mucho un refresco cada 10 s, salvo el de la medianoche.
- *(D)* Al volver a la pestaña tras más de 60 s también llama a `registro.update()` del service worker, para descubrir una versión nueva (8.4).
- No refresca mientras una llamada de `useOperacion` está en vuelo; lo hace al terminar.
- Los formularios abiertos conservan su copia de `esperado` (4.6) aunque lleguen props nuevas.

**Agenda de la medianoche** (`cliente/reloj.ts`, verificada en V5-10):
1. El objetivo es la medianoche que sigue al `hoy` del servidor: `hoy + 1 día` a las 00:00 de El Salvador, que es 06:00 UTC porque El Salvador está en UTC−6 sin horario de verano (00 P18). Se suman **5 s** de margen para que `finn.hoy()` ya devuelva el día nuevo.
2. La espera es `objetivo − Date.now()`, con el tope de un temporizador de JavaScript. El reloj del dispositivo solo mide cuánto falta.
3. Si la espera ya es ≤ 0 (reloj del dispositivo adelantado, o el servidor todavía no cambió de día), se refresca **una sola vez** por cada valor de `hoy`; si después de ese refresco `hoy` no cambió, se vuelve a intentar al minuto. No hay bucle.
4. Con la pestaña oculta los temporizadores se retrasan; al volver a estar visible se comprueba si ya pasó el objetivo y se refresca.
5. Cada `Encabezado` nuevo reprograma la agenda.

**Justificación.** Cumple RT-21 sin sondeo ni consulta nueva: el período activo, el estado de las metas y los avisos de estado cambian a medianoche sin ningún evento (04 13.1). *Alternativas descartadas:* sondeo periódico (más egreso y un Route Handler nuevo); refrescar solo al navegar (una pantalla abierta toda la noche mostraría el período anterior).

### 6.8 Conexión

`useConexion` (en el marco) expone `enLinea` a partir de `navigator.onLine` y los eventos `online` y `offline`. Lo usan `useOperacion` (4.8) y el aviso de "sin conexión" del marco; el comportamiento completo sin conexión y la página de respaldo están en §8 (Parte D).

---

## 12. Textos

### 12.1 Dos catálogos (FE-23)

**[F6]** **CF-08.** Los nombres de la plantilla de grupos y categorías van en `src/textos/plantilla.ts` (06 §3.9.2): no son datos del servidor ni de la base.

| Catálogo | Dónde | Qué contiene | Quién lo produce |
|---|---|---|---|
| **Mensajes del servidor** | `@finn/aplicacion/errores/mensajes.ts` (04 §7.10) | Errores (`ErrorFinn.mensaje`), rechazos, avisos (`AvisoMostrado.texto`, `AvisoEstadoDto.texto`), textos de las propuestas, títulos y cuerpos de las notificaciones | El servidor, ya compuestos y formateados |
| **Textos de la interfaz** | `apps/web/src/textos/<area>.ts` | Etiquetas, títulos de pantallas y secciones, botones, ayudas, estados vacíos y de carga, nombres accesibles, mensajes propios del cliente (`sin_conexion`, `version_nueva`, normalización de montos de 5.2, borradores) | La interfaz |

Reglas:
- La interfaz muestra los mensajes del servidor **tal como llegan**: no los reescribe, no los recorta y no arma su propia versión (04 SP-09). Si un texto del servidor no sirve, se cambia en el catálogo del servidor.
- Los mensajes de validación del cliente (Zod) son los mismos del servidor (4.2).
- Los textos de la interfaz son objetos `as const` por área, con funciones para los que llevan datos. Los datos se formatean con el módulo de 5.4:

```ts
// src/textos/presupuesto.ts
import { formatearMonto, formatearPeriodoCorto } from '@/formato';
import type { Centavos } from '@finn/dominio/valores';
import type { PeriodoDto } from '@finn/aplicacion/contratos';
export const presupuesto = {
  titulo: 'Presupuesto',
  listoParaAsignar: 'Listo para asignar',
  periodo: (p: PeriodoDto) => `Período ${formatearPeriodoCorto(p)}`,
  asignarA: (categoria: string) => `Asignar a ${categoria}`,
  faltaRepartir: (c: Centavos) => `Falta repartir ${formatearMonto(c)}`,
} as const;
```

- Sin librería de internacionalización: la interfaz tiene un solo idioma.
- Ningún texto literal en JSX fuera de `src/textos/` (L8, `react/jsx-no-literals`). Así los nombres accesibles que usan las pruebas (§14, Parte C) están en un solo lugar.

**Justificación.** Separar por quién produce el texto mantiene una sola fuente para cada mensaje: los del dominio no se duplican en la interfaz, y los de la interfaz no viajan al servidor. *Alternativas descartadas:* un catálogo único en `@finn/aplicacion` (llevaría etiquetas de pantallas al paquete de servidor); next-intl u otra librería de traducción (sin necesidad con un idioma y con peso en el cliente).

### 12.2 Voseo y formatos

- Voseo salvadoreño en todo texto de la interfaz, con las reglas de 04 §7.10: *revisá, intentá, volvé, elegí, asigná, tenés, podés*. Nunca "tú" ni "usted".
- Montos, fechas, instantes y porcentajes siempre con el módulo de 5.4.
- Sin tecnicismos: ni códigos (`FN003`, `conflicto_id`), ni nombres de tablas, ni "transacción de base de datos". La referencia `idError` es la única excepción (04 7.7).
- La prueba de voseo de 04 §7.10 se aplica también a `src/textos/` (rechaza *revisa*, *intenta*, *vuelve*, *puedes*, *tienes*, *elige*, *asigna* al inicio de oración o tras un signo de puntuación).

### 12.3 Glosario de la interfaz

Términos fijos. Una pantalla no usa un sinónimo para un término de esta lista.

| Concepto (01) | Texto en la interfaz | Notas |
|---|---|---|
| LPA | **Listo para asignar** | Número principal (PS) |
| Disp(c, p) | **Disponible** | |
| Asig(c, p) | **Asignado** | |
| Gastado(c, p) | **Gastado** | |
| Arr(c, p) | **Arrastrado** | Como en el producto §7 |
| S(t) | **Te falta reservar** | AV-07. Es el **total de la tarjeta** |
| R⁺(t) | **Reservado** | |
| RE(t) | **Reservado de más** | AV-08 |
| E(t, p) | **Pagaste de más** | AV-04 a AV-06 |
| Dinero en camino | **En camino** | AV-09 |
| Sobregiro de débito (nombre del indicador, PF-2) | **Sobregiro con débito o efectivo** | |
| Sobregiro con tarjeta: parte con tarjeta del sobregiro de una categoría (nombre del indicador, PF-2) | **Deuda sin reservar** **[R2]** | 00 H1 y 01 AV-03 (PB-1). Es por **categoría**. No se usa "deuda sin respaldo": en 00 y 01 es S(t), el total de la tarjeta |
| Movimiento en revisión | **Movimiento** | Solo en la Bandeja |
| Transacción | **Transacción** | Actividad y cuentas |
| Período activo / cerrado / futuro | **Período actual** / **Período cerrado** / **Período futuro** | |
| Estado bancario | **Pendiente**, **Confirmada**, **Conciliada** | §7.2 de 01 |
| Por cobrar | **Por cobrar** | |
| Patrimonio neto | **Patrimonio** en Inicio y Reportes; **Posición neta** en Cuentas | Como en el producto §5, §6 y §10 |
| Reporte `remanente` | **Lo que te quedó del período** | 04 6.9.5 |
| Bandeja | **Bandeja** | Sección principal (P5-10) |

**[R2] "Deuda sin reservar" y "te falta reservar" juntos.** La primera es por categoría (la parte con tarjeta de su sobregiro, SobT); la segunda es el total de la tarjeta (S(t)), que incluye esa parte. Donde aparecen en la misma pantalla o en el mismo detalle, el texto nombra siempre el alcance:
- "Deuda sin reservar en {categoría}: {monto}";
- "Te falta reservar para {tarjeta}: {monto} (total de la tarjeta)";
- en el detalle al tocar de una categoría: "Esta deuda suma a lo que te falta reservar para {tarjeta}".

Ninguno de los dos se muestra sin su categoría o su tarjeta cuando el otro está a la vista.

---

# Parte B

## 2. Mapa de pantallas

### 2.1 Reglas del mapa (FE-26)

- **Una consulta por página.** Cada `page.tsx` de `(finn)` llama a **una** consulta de 04 §6 a través de `consultar()` (7.3) y publica su `Encabezado` (FE-06). Así la pantalla entera sale de una sola instantánea (04 5.1).
- **Las lecturas interactivas** (CP-3: `sugerencia` y la búsqueda de `formulario({ operacion: 'devolver', busqueda })`) son la única lectura adicional permitida, y solo desde el cliente mientras el usuario escribe.
- **Excepciones sin consulta de §6.** No hay excepciones salvo estas tres:
  - las rutas de `ingresar`, que funcionan sin sesión AAL2 y leen Supabase Auth con `estadoAcceso()` (CP-11);
  - `/sin-conexion`, que es estática y la guarda el service worker (§8, Parte D);
  - `/reportes`, que solo redirige a `/reportes/tendencia`.
- **Ajustes > Seguridad** suma a su consulta `estadoSeguridad()` (CP-4), que no lee la base de Finn.
- Las columnas de cada tabla son:
  - **Consulta:** nombre exacto de 04 §6 y de dónde sale cada parámetro.
  - **Operaciones:** las que la pantalla dispara, como flujo ([L] o [C], con su ruta) o como acción de un toque ([1T], 4.14).
  - **Avisos:** los de 04 §6.0.4 para esa pantalla y los "antes" o "después" de sus operaciones.
  - **Notas:** estado vacío (7.2) y estados propios.

Los flujos (rutas [L] y [C]) leen con `consultas.formulario` u otra consulta en su `lector` (FE-04); su fila indica cuál.

**Justificación de FE-26.** Una consulta por página es lo que garantiza que todos los números de una pantalla salgan de la misma revisión (04 5.1, inv. 27) y que el `Encabezado` del marco sea el de esos mismos datos (FE-06). *Alternativa descartada:* componer una pantalla con varias consultas (por ejemplo, Presupuesto más Cuentas): dos lecturas, posiblemente con revisiones distintas, en la misma pantalla.

### 2.2 Parámetros de búsqueda (FE-27) **[R2]**

**Un nombre, un significado.** Cada parámetro de búsqueda tiene un único significado en toda la app. Un parámetro que nombra una entidad (`cuenta`, `categoria`, `grupo`, `linea`, `deudor`, `evento`) siempre lleva el id de esa entidad. En una lista, ese id **filtra**; en un flujo, **preselecciona**. El significado es el mismo: "la entidad de la que se trata".

Catálogo completo (la regla T9 de V5-18 rechaza cualquier parámetro de §1.3 o §2 que no esté aquí):

| Parámetro | Significado | Valor | Rutas |
|---|---|---|---|
| `?periodo=` | Inicio del período que se ve o al que se aplica la operación | `FechaLocal` | Presupuesto, detalle de categoría, asignar, mover, auto-asignar, detalle de cuenta, gasto semanal |
| `?historial=` | Cantidad de períodos del historial | Entero 1 a 60 | Detalle de LPA |
| `?filtro=` | Clasificación de las categorías (04 BE-39) | `sobregiradas`, `sin-fondos`, `cubiertas` | Presupuesto |
| `?categoria=` | Una categoría | Uuid | Actividad (filtra), nueva meta (preselecciona) |
| `?categoria-origen=`, `?categoria-destino=` | Las dos categorías de un movimiento de dinero | Uuid | Mover |
| `?categorias=` | Varias categorías | Uuids separados por comas | Gasto semanal |
| `?grupo=` | Un grupo | Uuid | Nueva categoría (preselecciona), reporte de categorías (filtra) |
| `?cuenta=` | Una cuenta | Uuid | Actividad (filtra), registrar (preselecciona) |
| `?cuentas=` | Varias cuentas | Uuids separados por comas | Reportes |
| `?tipo=` | Tipo de **transacción** (`TipoTransaccion`) | Enumerado con guiones | Actividad, detalle de cuenta |
| `?tipo-cuenta=` | Tipo de **cuenta** | `efectivo`, `tarjeta`, `prestamo`, `inversion` | Nueva cuenta |
| `?tipo-evento=` | Tipo de **evento** | `cobro`, `devolucion`, `condonacion` | Eliminar evento |
| `?evento=` | Un evento (transacción del cobro o la devolución, o la condonación) | Uuid | Eliminar evento |
| `?origen=` | Origen de la **transacción** (`OrigenTransaccion`) | `sms`, `manual`, `importada`, `programada` | Actividad |
| `?estado=` | Estado **bancario** | `pendiente`, `confirmada`, `conciliada` | Actividad, detalle de cuenta |
| `?texto=` | Texto a buscar en comercio y nota | Texto | Actividad |
| `?monto-desde=`, `?monto-hasta=` | Rango del total | `montoTexto` | Actividad |
| `?desde=`, `?hasta=` | Rango de **fechas de negocio** | `FechaLocal` | Actividad |
| `?fecha=` | Fecha de la operación que se registra | `FechaLocal` | Cobrar, cuota |
| `?linea=` | Una línea por cobrar | Uuid | Cobrar |
| `?deudor=` | Un deudor | Uuid | Cobrar |
| `?modalidad=` | Modalidad de pago de un préstamo | `cuota`, `abono` | Cuota |
| `?vista=` | Vista de la bandeja | `descartados` | Bandeja |
| `?archivadas=1` | Incluir cuentas archivadas | `1` | Cuentas |
| `?cerrados=1` | Incluir por cobrar cerrados | `1` | Por cobrar |
| `?no-leidas=1` | Solo notificaciones no leídas | `1` | Notificaciones |
| `?horizonte=` | Días de "próximos pagos" (04 BE-37) | Entero | Programadas |
| `?ventana=` | Ventana de un reporte | `actual`, `ultimos-1` … `ultimos-12` | Reportes |
| `?limite=` | Cantidad de filas de un reporte | Entero | Top de comercios |
| `?cursor=` | Posición en una lista paginada (04 6.0.6) | Texto opaco | Bandeja, Actividad, detalle de cuenta, Notificaciones |
| `?volver=` | **Ruta interna a la que se vuelve**: después de ingresar (3.6) o con el enlace "Volver" de un detalle (3.3) | Ruta interna, validada como en 3.6 | Rutas de `ingresar`, cualquier detalle [D] |
| `?notificacion=` | Notificación que se abrió (se marca como leída, FE-32) | Uuid | Cualquier destino de 3.5 |

Notas:
- **[R2] `?volver=` también para el regreso de los detalles.** El ajuste 1 pidió un nombre distinto de `?desde=`, que ya es el filtro de fechas de Actividad. Se usa `?volver=` y no un tercer nombre (por ejemplo `?regreso=`) porque su significado es el mismo que el de las rutas de `ingresar` (la ruta interna a la que se vuelve) y se valida igual. Dos nombres para un mismo significado también se evitan.
- **[R2] Otros renombres por la misma regla:**
  - `?periodos=` pasa a `?historial=`: era casi igual a `?periodo=` con otro significado;
  - `?origen=` y `?destino=` de Mover pasan a `?categoria-origen=` y `?categoria-destino=`, porque `?origen=` ya es el origen de una transacción en Actividad;
  - `?tipo=` de Nueva cuenta y de Eliminar evento pasan a `?tipo-cuenta=` y `?tipo-evento=`: `?tipo=` queda solo para el tipo de transacción.

**Conversión a los parámetros de la consulta.** Es mecánica, en `apps/web/src/servidor/parametros.ts`, y la misma para todas las páginas:

| En la URL | En la consulta | Ejemplo |
|---|---|---|
| Nombre en minúscula con guiones | `camelCase`, o el nombre del campo de la consulta si difiere | `?monto-desde=` → `montoDesde`; `?historial=` → `periodos`; `?tipo-cuenta=` → `tipo` |
| Valor de un enumerado con guiones | Con guiones bajos | `?filtro=sin-fondos` → `'sin_fondos'`; `?ventana=ultimos-3` → `'ultimos_3'` |
| Lista separada por comas | Arreglo | `?cuentas=<id>,<id>` → `cuentaIds: [..]` |
| `?periodo=AAAA-MM-DD` | `periodoInicio` | — |
| `?archivadas=1`, `?cerrados=1`, `?no-leidas=1` | `true` | `incluirArchivadas: true` |
| Ausente | El valor por defecto de la consulta | Sin `?periodo=` se ve el período activo |

- Las fechas, los montos y los ids pasan como texto; los valida el contrato de la consulta. Un parámetro inválido da `VALIDACION`, y `consultar()` redirige a la misma ruta sin los parámetros señalados en `campos` (7.3).
- Los segmentos dinámicos (`[categoriaId]`, `[movimientoId]`…) son ids; un id inexistente da `NO_ENCONTRADO` → `notFound()` (7.3).
- El `tipo` de `registrar/[tipo]` y de `reportes/[tipo]` se convierte con las tablas de 2.4 y 2.10.
- `?volver=` y `?notificacion=` no llegan a ninguna consulta: los usa la interfaz.

**Justificación.** Una sola regla evita que cada página invente su traducción y deja las URL legibles en español; un significado por nombre evita que un enlace o una prueba confundan un filtro con otro. *Alternativa descartada:* usar en la URL los nombres de los contratos (`?montoDesde=`, `sin_fondos`), que mezcla estilos dentro de una misma URL.

### 2.3 Inicio y Presupuesto

**[F6]** **Inicio.** "Necesita tu atención" muestra también `atencion.hallazgosRitmo` (cada uno con su `Aviso` y su acción) y `atencion.pagosTarjetaProximos` (CF-06); "Todo al día" exige además que los dos estén vacíos. **Primeros pasos** (CF-18; 06 §3.15): con `primerosPasos` distinto de nulo, un bloque con tres pasos marcables (crear una cuenta → `/cuentas/nueva`; crear las categorías → `/presupuesto/estructura`; conectar los SMS → `/ajustes/webhook`); sin cuentas ocupa el lugar de la atención, y con alguna cuenta va encima. "Ocultar por ahora" es una preferencia del dispositivo (`finn:primeros-pasos:oculto` en `localStorage`, con `cliente/almacen.ts`); no se ofrece sin cuentas. **Plantilla** (CF-08, CF-19; 06 §3.9): `/presupuesto/estructura/plantilla` [L], consulta `estructura()`, se ofrece desde el paso "Crear las categorías" y en `/presupuesto/estructura` mientras no haya categorías normales; la lista se edita antes de aplicar y se aplica con OP-07 en lote, en 3 o 4 tandas de hasta 12 elementos, grupos antes que sus categorías, con el avance "Creando tu plantilla: {k} de {n}…" en la región `status` (11.3).

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/` | [P] | `inicio()` | [1T] OPT-04 (marcar como leídos los cambios retroactivos); propuestas AV-08 (OP-14) y AV-14 (OP-11) (CP-8); tarjeta "Activar notificaciones" OPT-02 (CP-5); enlaces a `/registrar`, `/bandeja`, `/presupuesto/asignar/[categoriaId]`, `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (próximos pagos y atrasados) | AV-01 (`atencion.cambiosRetroactivos`), AV-02 y AV-03 (`atencion.sobregiradas`), AV-04, AV-05 y AV-06 (`atencion.pagosExcedentes`), AV-07 (`atencion.faltaReservar`), AV-08 (`atencion.reservaExcedente`), AV-09 (`enCamino`), AV-14 (`atencion.archivadasConDisponible`), AV-17 (`atencion.metasVencidas`), AV-20 (`lpaNegativo`), AV-23 (`atencion.bandeja`) | Primer uso (sin cuentas): guía con enlaces a `/cuentas/nueva` y `/presupuesto/estructura` (7.2). Sin nada que requiera atención: el bloque de atención dice "Todo al día" |
| `/presupuesto` | [P] | `presupuesto({ periodoInicio, filtro })` ← `?periodo=`, `?filtro=sobregiradas\|sin-fondos\|cubiertas` | [C] `/presupuesto/asignar/[categoriaId]` (OP-14, OP-16); [C] `/presupuesto/mover` (OP-15); [C] `/presupuesto/auto-asignar` (OP-17); [C] `/presupuesto/categorias/[categoriaId]/sacar` (OP-11, desde `archivadasConDinero`); propuestas AV-08 (OP-14); navegación entre períodos (3.4) | AV-02 y AV-03 (fila), AV-04 a AV-08 (`pagosTarjeta`), AV-09, AV-14 (`archivadasConDinero`), AV-17 (meta de la fila), AV-20 | Muestra el período activo y sus días restantes (N3). Período cerrado: solo lectura, sin asignar (inv. 18). Período futuro: Disp proyectado (04 6.2). Sin categorías: enlace a la estructura. Con filtro y sin filas: "Ninguna categoría cumple este filtro" |
| `/presupuesto/listo-para-asignar` | [D] | `detalleLpa({ periodos })` ← `?historial=` (1 a 60; por defecto 12) **[R2]** | Ninguna | AV-09, AV-20 | Gráfico del historial con su tabla equivalente (P5-13) y la nota `sin_adelantos` (B-4) |
| `/presupuesto/categorias/[categoriaId]` | [D] | `detalleCategoria({ categoriaId, periodoInicio })` ← `?periodo=` | Normal: [C] asignar, [C] mover, [L] `…/archivar` (OP-09), [L] `…/fusionar` (OP-12), [C] `/metas/nueva?categoria=` o `/metas/[metaId]` (OP-18), [C] `…/sacar` (OP-11, si está archivada), [1T] OP-10 (si está archivada). Pago: [C] `/cuentas/[tarjetaId]/pagar` (OP-23), propuesta AV-08 (OP-14) | Normal: AV-02, AV-03, AV-14, AV-17. Pago: AV-04 a AV-08 | Dos formas según `clase` (04 6.3). Navegación entre períodos con CP-9. Sin consumos en el período: "Sin gastos en este período" |
| `/presupuesto/categorias/[categoriaId]/archivar` | [L] | `formulario({ operacion: 'archivar_categoria', categoriaId })` | OP-09 (previsualizar primero, FE-07) | La previsualización resume los pasos | Si no hay nada que decidir (Disp 0, sin futuras ni programadas), el flujo es solo la confirmación |
| `/presupuesto/categorias/[categoriaId]/fusionar` | [L] | `formulario({ operacion: 'fusionar', origenId })` | OP-12 (previsualizar primero) | AV-13, AV-01 (antes) | Sin destinos válidos: lo explica y no deja continuar |
| `/presupuesto/categorias/[categoriaId]/sacar` | [C] | `formulario({ operacion: 'asignar', categoriaId })` (con CP-10a) | OP-11 | AV-14 deja de mostrarse al llegar a 0 | Solo para categorías archivadas; si no lo está, redirige al detalle |
| `/presupuesto/asignar/[categoriaId]` | [C] | `formulario({ operacion: 'asignar', categoriaId, periodoInicio })` ← `?periodo=` | OP-14; OP-16 (variantes de `contexto.rapida`) | AV-11 (antes) | Período cerrado: no se puede abrir (redirige al detalle con el motivo `periodo_cerrado`) |
| `/presupuesto/mover` | [C] | `formulario({ operacion: 'asignar', categoriaId, periodoInicio })` con `categoriaId` = `?categoria-origen=` o, si falta, `?categoria-destino=` (con CP-10a) **[R2]** | OP-15 | Estado: AV-02 y AV-03 si el origen queda sobregirado | — |
| `/presupuesto/auto-asignar` | [C] | `presupuesto({ periodoInicio })` ← `?periodo=` | OP-17 (previsualizar primero; `esperado.revision`) | AV-18 (después) | Sin metas con faltante: lo dice y no ofrece confirmar |
| `/presupuesto/estructura` | [L] | `estructura()` | [C] alta y edición (filas siguientes); [1T] OP-08 (subir o bajar); [L] `…/categorias/[categoriaId]/archivar` | — | Administración compleja: pantalla completa (P5-11) |
| `/presupuesto/estructura/grupos/nuevo` | [C] | `estructura()` | OP-07 (grupo) | — | — |
| `/presupuesto/estructura/grupos/[grupoId]` | [C] | `estructura()` | OP-08 (nombre), OP-13 (eliminar o archivar el grupo) | — | El grupo "Pagos de tarjeta" se muestra sin acciones (`grupo_del_sistema`) |
| `/presupuesto/estructura/categorias/nueva` | [C] | `estructura()` ← `?grupo=` | OP-07 (categoría) | — | — |
| `/presupuesto/estructura/categorias/[categoriaId]` | [C] | `estructura()` | OP-08 (nombre, grupo), OP-13 (eliminar), [1T] OP-10 (desarchivar) | — | Una categoría de pago se muestra sin acciones de archivo ni eliminación |
| `/presupuesto/estructura/plantilla` | [L] | `estructura()` | OP-07 en lote (`{ elementos }`, CF-19), en tandas (06 §3.9.1) | — | **[F7]** **CT-08.** Fila que CF-08 citaba en §2.3 y faltaba. Se ofrece desde los Primeros pasos y desde `/presupuesto/estructura` sin categorías normales; textos en `src/textos/plantilla.ts`; ids de creación en el borrador (4.11) |

### 2.4 Registrar

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/registrar` | [C] | `cuentas()` | Elegir qué registrar: enlaces a las rutas siguientes, a `/cuentas/[cuentaId]/pagar` (OP-23), `/cuentas/[cuentaId]/cuota` (OP-24) y `/por-cobrar/cobrar` (OP-31) | — | Cada tipo se ofrece solo si existe la cuenta que necesita (por ejemplo, "Avance de efectivo" requiere una tarjeta). Sin cuentas: enlace a `/cuentas/nueva` |
| `/registrar/gasto` | [L] | `formulario({ operacion: 'registrar', tipo: 'gasto', cuentaId })` ← `?cuenta=` | OP-20, con split y por cobrar; `sugerencia` (CP-3) | AV-01 (antes); después, en el destino: AV-02, AV-03, AV-07, AV-09 | Borrador (4.11) |
| `/registrar/[tipo]` | [C] | `formulario({ operacion: 'registrar', tipo, cuentaId })` ← `[tipo]` (tabla siguiente), `?cuenta=` | OP-21, OP-22, OP-25, OP-26, OP-27 u OP-33b según `[tipo]` | AV-01 (antes); AV-24 (después, `transferencia-deuda`) | `devolucion`: búsqueda de la compra con la lectura interactiva de CP-3; elegir una compra lleva a `/actividad/[transaccionId]/devolver` |

`[tipo]` de `/registrar/[tipo]`:

| URL | `ParametrosFormulario.tipo` (04 6.14.1) | Operación |
|---|---|---|
| `ingreso` | `ingreso` | OP-21 |
| `transferencia` | `transferencia` | OP-22 |
| `devolucion` | `devolucion_sin_compra` | OP-33b (y búsqueda para OP-33a) |
| `aporte-inversion` | `aporte_inversion` | OP-25 `aporte` |
| `retiro-inversion` | `retiro_inversion` | OP-25 `retiro` |
| `ajuste-inversion` | `ajuste_inversion` | OP-25 `ajuste` |
| `desembolso` | `desembolso` | OP-26 |
| `avance` | `avance` | OP-27 `avance` |
| `entrada-tarjeta` | `entrada_tarjeta` | OP-27 `entrada` |
| `transferencia-deuda` | `transferencia_deuda` | OP-27 `transferencia_deuda` |
| Cualquier otro valor (incluido `gasto`, que tiene su ruta propia) | — | `notFound()` |

### 2.5 Bandeja

**[F6]** **Arrastrar a una categoría (CF-21, CF-22; FT-78).** En las filas con `aprobacion.arrastrable`, un asa permite soltar el movimiento sobre una categoría del `PanelDestinosArrastre` (sugerida, `destinosArrastre.frecuentes` y "Otra categoría…" con `destinosArrastre.grupos`; en computadora, el panel lateral lista además todas por grupo). Soltar envía OP-37 `{ categoriaId }`; si el servidor pide confirmación o falta un dato, se abre `/bandeja/[movimientoId]` con la categoría ya puesta (4.15). Teléfono: pulsación larga de 350 ms (tolerancia 8 px); ratón: después de 6 px; teclado: Espacio, flechas que saltan entre destinos, Espacio o Escape, con anuncios en voseo. Los botones de un toque no cambian (WCAG 2.5.7). La nota "Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están." se conserva.

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/bandeja` | [P] | `bandeja({ vista, cursor })` ← `?vista=descartados`, `?cursor=` | [1T] OP-37 "Aprobar" (FE-25); [1T] OP-38 "Aprobar todos" (con `elegiblesAprobarTodos`); [1T] OP-39 descartar y restaurar; [1T] OP-40 (`es_legitimo`, `es_duplicado`, `rechazar_coincidencia`); [1T] propuesta de regla (OP-41); [L] `/bandeja/[movimientoId]` | AV-19 (después de OP-38), AV-23 (`contadores`) | Vacía: "No hay movimientos por revisar". Vista de descartados: paginada |
| `/bandeja/[movimientoId]` | [L] | `formulario({ operacion: 'movimiento', movimientoId })` | OP-36 (editar), OP-37 (aprobar, con `recordarRegla`), OP-40 (todas sus decisiones), OP-49 (reprocesar, con `intentoVisto`), OP-50 (crear a mano desde un SMS con error), [1T] OP-39; `sugerencia` y búsqueda de compras para devoluciones (CP-3) | AV-01 y AV-16 (antes); AV-23 | Muestra el texto del SMS siempre. Restaura el borrador del traspaso de 4.15. Si el movimiento ya no se puede editar (aprobado o descartado), muestra su estado y el enlace a lo que corresponda |

### 2.6 Actividad

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/actividad` | [P] | `actividad({ texto, montoDesde, montoHasta, categoriaId, cuentaId, desde, hasta, estado, tipo, origen, cursor, limite })` ← `?texto=`, `?monto-desde=`, `?monto-hasta=`, `?categoria=`, `?cuenta=`, `?desde=`, `?hasta=`, `?estado=`, `?tipo=`, `?origen=`, `?cursor=` | Enlaces a `/registrar` y a cada detalle | — | Sin transacciones: "Todavía no hay transacciones". Con filtros y sin resultados: "Sin resultados con estos filtros" y "Quitar filtros". `?texto=` con espera de 300 ms antes de cambiar la URL |
| `/actividad/[transaccionId]` | [D] | `detalleTransaccion({ transaccionId })` | [L] `…/editar` (OP-28); [L] `…/devolver` (OP-33a, solo gastos); [C] `…/estado` (OP-30); [C] `…/eliminar` (OP-29); [C] `…/eventos/eliminar` (OP-34); [C] `/por-cobrar/cobrar?linea=` (OP-31); [C] `/por-cobrar/condonar/[lineaId]` (OP-32) | AV-16 (al abrir una acción sobre una conciliada) | Las acciones que `restricciones` no permite se muestran deshabilitadas con su motivo (`motivoNoEliminar`, 04 6.7.2) |
| `/actividad/[transaccionId]/editar` | [L] | `formulario({ operacion: 'editar_transaccion', transaccionId })` | OP-28; `sugerencia` (CP-3) | AV-16 y AV-01 (antes) | Borrador (4.11). Muestra marcadas las cuentas y categorías archivadas que ya usa (04 6.14.4) |
| `/actividad/[transaccionId]/devolver` | [L] | `formulario({ operacion: 'devolver', transaccionOriginalId })` | OP-33a | AV-01 (antes); después, AV-06, AV-08, AV-14 | Borrador (4.11). Sin capacidad restante: lo dice y no deja continuar |
| `/actividad/[transaccionId]/estado` | [C] | `detalleTransaccion({ transaccionId })` | OP-30 | — | `conciliada` no se ofrece (solo OP-47) |
| `/actividad/[transaccionId]/eliminar` | [C] | `detalleTransaccion({ transaccionId })` | OP-29 | AV-16 y AV-01 (antes) | Con eventos vinculados: explica `transaccion_con_eventos` y enlaza a sus eventos |
| `/actividad/[transaccionId]/eventos/eliminar` | [C] | `detalleTransaccion({ transaccionId })` ← `?tipo-evento=cobro\|devolucion\|condonacion`, `?evento=` **[R2]** | OP-34 | AV-16 y AV-01 (antes) | — |

### 2.7 Cuentas

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/cuentas` | [P] | `cuentas({ incluirArchivadas })` ← `?archivadas=1` | [L] `/cuentas/nueva`; [C] `/cuentas/ordenar`; enlaces a cada detalle y a `/cuentas/[cuentaId]/pagar` | AV-07 y AV-08 (tarjetas), AV-09 (posición neta) | Sin cuentas: "Agregá tu primera cuenta" |
| `/cuentas/ordenar` | [C] | `cuentas()` | OP-03 | — | — |
| `/cuentas/nueva` | [L] | `formulario({ operacion: 'cuenta', tipo })` ← `?tipo-cuenta=` **[R2]** | OP-01 | AV-01 (antes, si la apertura es retroactiva); AV-07 (después, tarjeta con deuda) | Avisa antes de enviar si el nombre de la tarjeta ya se usa (`nombresTarjetaUsados`, BE-35). Borrador (4.11) |
| `/cuentas/[cuentaId]` | [D] | `detalleCuenta({ cuentaId, periodoInicio, tipo, estado, cursor, limite })` ← `?periodo=`, `?tipo=`, `?estado=`, `?cursor=` | [L] `…/editar`; [L] `…/condiciones` (préstamo); [C] `…/pagar` (tarjeta); [C] `…/cuota` (préstamo); [L] `…/conciliar`; [C] `…/archivar`; [C] `…/eliminar`; [1T] OP-05 (si está archivada); enlace a `/registrar/gasto?cuenta=` | AV-04 a AV-08 (tarjeta), AV-21 (conciliaciones) | Filtro por período con CP-9. Sin movimientos: "Esta cuenta todavía no tiene movimientos" |
| `/cuentas/[cuentaId]/editar` | [L] | `formulario({ operacion: 'cuenta', cuentaId })` | OP-02 | AV-01 (antes) | Borrador (4.11) |
| `/cuentas/[cuentaId]/condiciones` | [L] | `formulario({ operacion: 'cuenta', cuentaId })` | OP-48 | — | Solo préstamos; si no lo es, redirige al detalle |
| `/cuentas/[cuentaId]/pagar` | [C] | `formulario({ operacion: 'pagar_tarjeta', tarjetaId })` | OP-23 | AV-10 y AV-01 (antes); el desglose al pagar y "quedará saldo a favor" (04 OP-23) | Origen preseleccionado con `origenPropuesto` (BE-41) |
| `/cuentas/[cuentaId]/cuota` | [C] | `formulario({ operacion: 'cuota_prestamo', prestamoId, modalidad, fecha })` ← `?modalidad=cuota\|abono`, `?fecha=` | OP-24 | AV-01 (antes); AV-02 y AV-03 (después) | Cambiar la fecha reemplaza `?fecha=` (`router.replace`) y trae el desglose propuesto nuevo; se aplica a capital, interés y seguro solo si el usuario no los editó |
| `/cuentas/[cuentaId]/archivar` | [C] | `detalleCuenta({ cuentaId })` | OP-04 | — | Con bloqueos (`acciones.bloqueosArchivo`): los explica y no deja continuar |
| `/cuentas/[cuentaId]/eliminar` | [C] | `detalleCuenta({ cuentaId })` | OP-06 (previsualizar primero) | AV-15 y AV-01 (antes) | Con bloqueos (`acciones.bloqueosEliminar`): los explica y ofrece archivar |
| `/cuentas/[cuentaId]/verificar-saldo` **[F6]** CF-01 | [L] | `formulario({ operacion: 'verificar_saldo', cuentaId, fecha })` ← `?fecha=` (cambiarla usa `router.replace`) | OP-53 (previsualizar primero, 4.4) | AV-21 (después) con la propuesta de ajuste (abrir flujo) | Lista de candidatas para marcar: todas preseleccionadas si la diferencia de la previsualización es exactamente cero; ninguna si no. Borrador con fecha, saldo y marcas (4.11). En el detalle de cuenta, cada conciliación se nombra "Estado de cuenta" o "Verificación de saldo" según `modo` |
| `/cuentas/[cuentaId]/conciliar` | [L] | `formulario({ operacion: 'conciliar', cuentaId })` (CP-16) **[R2]** | OP-45 (subir el CSV), OP-46 (agregar desde el estado, con cualquier tipo de alta que admita el signo del movimiento), OP-47 (terminar); `sugerencia` y búsqueda de compras (CP-3, CP-16) | AV-01 (antes, OP-46); AV-21 (después, OP-47) | La carga firmada vive solo en el estado del componente; el borrador guarda la huella del archivo y las marcas (4.11). `firma_vencida`: pide volver a subir el archivo |

### 2.8 Por cobrar, Metas, Programadas y Reglas

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/por-cobrar` | [S] | `porCobrar({ incluirCerrados })` ← `?cerrados=1` | [C] cobrar, [C] condonar, [C] renombrar deudor | AV-09 | Sin por cobrar abiertos: "Nadie te debe nada" |
| `/por-cobrar/cobrar` | [C] | `formulario({ operacion: 'cobrar', lineaId, deudorId, fecha })` ← `?linea=`, `?deudor=`, `?fecha=` | OP-31 (con `asignarAPagoTarjeta` preseleccionado si `propuestaAV22`) | AV-11 y AV-01 (antes); AV-22 y AV-05 (después) | — |
| `/por-cobrar/condonar/[lineaId]` | [C] | `formulario({ operacion: 'condonar', lineaId })` | OP-32 | AV-01 (antes); AV-02 y AV-03 (después) | — |
| `/por-cobrar/deudores/[deudorId]/renombrar` | [C] | `porCobrar()` | OP-52 | — | — |
| `/metas` | [S] | `metas()` | [C] `/metas/nueva`, [C] `/metas/[metaId]` | AV-17 | Sin metas: enlace a crear una con `categoriasSinMeta` |
| `/metas/nueva` | [C] | `formulario({ operacion: 'meta', categoriaId })` ← `?categoria=` | OP-18 (crear) | — | — |
| `/metas/[metaId]` | [C] | `formulario({ operacion: 'meta', metaId })` | OP-18 (editar y eliminar) | AV-17 (se resuelve al extender o ajustar) | Eliminar se confirma dentro del flujo |
| `/programadas` | [S] | `programadas({ horizonteDias })` ← `?horizonte=` (por defecto 30) | [L] nueva y edición; [C] `/programadas/[programadaId]/ocurrencias/[fechaEsperada]`; [1T] OP-42 (`activa`) | Atrasadas; `avisoSinModelo` (QB-1) | Sin programadas: enlace a crear una |
| `/programadas/nueva` | [L] | `formulario({ operacion: 'programada' })` | OP-42 (crear); `sugerencia` (CP-3) | — | Borrador (4.11) |
| `/programadas/[programadaId]` | [L] | `formulario({ operacion: 'programada', programadaId })` | OP-42 (editar), OP-51 (eliminar, si `puedeEliminar`), [1T] OP-42 (`activa`) | — | Con `calendarioEditable = false`, los campos de calendario se muestran sin edición y con el motivo |
| `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` | [C] | `formulario({ operacion: 'programada', programadaId, fechaEsperada })` (CP-10b) | OP-43 (registro de un toque, con los campos editables de su tipo), OP-44 (omitir) | AV-01 (antes, si la fecha es de un período cerrado) | Destino de `registro_automatico_fallido` y `ocurrencia_en_periodo_cerrado` (CP-1). Ocurrencia ya resuelta: lo dice y enlaza a la transacción |
| `/reglas` | [S] | `reglas()` | [C] nueva y edición | — | Las reglas hacia categorías archivadas, marcadas (B-10). Sin reglas: explica que se crean al aprobar |
| `/reglas/nueva` | [C] | `formulario({ operacion: 'regla' })` (CP-10c) | OP-41 (crear) | — | — |
| `/reglas/[reglaId]` | [C] | `formulario({ operacion: 'regla', reglaId })` (CP-10c) | OP-41 (editar y eliminar) | — | — |

### 2.9 Notificaciones

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/notificaciones` | [S] | `notificaciones({ cursor, soloNoLeidas })` ← `?cursor=`, `?no-leidas=1` | [1T] OPT-04 (todas o una); abrir el destino (3.5) | AV-01, AV-17, AV-23 (registro de notificaciones) | Una notificación con `existeDestino = false` se muestra sin enlace y con "Esto ya no existe". Sin notificaciones: "No tenés notificaciones" |

### 2.10 Reportes

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/reportes/[tipo]` | [S] | `reporte({ tipo, ventana, cuentaIds, grupoId, periodoInicio, categoriaIds, limite })` ← `[tipo]` (tabla siguiente), `?ventana=actual\|ultimos-1\|ultimos-3\|ultimos-6\|ultimos-12`, `?cuentas=`, `?grupo=`, `?periodo=`, `?categorias=`, `?limite=` | Ninguna | — | Cada gráfico tiene su tabla o resumen accesible (P5-13). Los filtros por cuenta, grupo y categoría usan CP-12. Sin datos en la ventana: "No hay movimientos en estos períodos" |

`[tipo]` de `/reportes/[tipo]` (04 6.9.2 y 6.9.3):

| URL | `tipo` | Parámetros propios |
|---|---|---|
| `tendencia` | `tendencia` | — |
| `categorias` | `categorias` | `?grupo=` |
| `ingresos-gastos` | `ingresos_gastos` | — |
| `remanente` | `remanente` | — (título: "Lo que te quedó del período", 04 6.9.5) |
| `top-comercios` | `top_comercios` | `?limite=` |
| `cumplimiento` | `cumplimiento` | — |
| `patrimonio` | `patrimonio` | — |
| `gasto-semanal` | `gasto_semanal` | `?periodo=`, `?categorias=`; navegación entre períodos con CP-9 |
| `ritmo` **[F6]** | `ritmo` | — (período activo) |
| `realidad` **[F6]** | `realidad` | — |
| `hormiga` **[F6]** | `hormiga` | `?periodo=` |
| `suscripciones` **[F6]** | `suscripciones` | — |
| `tarjetas` **[F6]** | `tarjetas` | `?ventana=` (por defecto `ultimos-6`) |
| `hallazgos` **[F6]** | `hallazgos` | — |
| `flujo-efectivo` **[F6]** | `flujo_efectivo` | `?ventana=` (título "Flujo de efectivo") |
| Cualquier otro (incluido `datos_base`, que es para la Fase 6) | — | `notFound()` |

**[F6]** Los títulos de los tipos nuevos están en 06 §3.5.1 y §3.3. Cada hallazgo se muestra con `Aviso` (estado de 10.3) y su acción: una `Propuesta` (4.13) o un enlace. **CF-17:** "Categoría nueva" (gasto semanal y reportes de comparación) significa que la categoría no existía en ningún período anterior (selector `existiaEn` de 04); la asignación rápida muestra "Tu promedio de gasto ({n} períodos)" cuando sale de menos de 3.

### 2.11 Ajustes

**[F6]** **CF-18.** Mientras los Primeros pasos estén ocultos y quede alguno pendiente, `/ajustes` muestra "Primeros pasos: {k} de 3" con "Mostrar en Inicio", que borra la preferencia del dispositivo.

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/ajustes` | [S] | `ajustes()` | Índice de las páginas siguientes | — | Muestra un resumen de cada sección (por ejemplo, "Respaldo atrasado") |
| `/ajustes/ciclo` | [C] | `ajustes()` | OP-19 (previsualizar primero) | AV-12 (antes) | Muestra la vigencia futura, si existe |
| `/ajustes/webhook` | [C] | `ajustes()` | OPT-01 | — | El token nuevo se muestra **una sola vez**, con "Copiar"; nunca se guarda en el borrador ni en el cliente después de cerrar el flujo |
| `/ajustes/formatos` | [L] | `ajustes()` | [L] nuevo y edición | — | Lista con `usos` y `ultimoUso` |
| `/ajustes/formatos/nuevo` | [L] | `formulario({ operacion: 'formato' })` | OPT-05, OPT-06 (probar contra un SMS) | — | Borrador (4.11) |
| `/ajustes/formatos/[formatoId]` | [L] | `formulario({ operacion: 'formato', formatoId })` | OPT-05, OPT-06 | — | Borrador (4.11) |
| `/ajustes/instituciones` | [L] | `ajustes()` | [C] nueva y edición | — | — |
| `/ajustes/instituciones/nueva` | [C] | `ajustes()` | OPT-07 | — | — |
| `/ajustes/instituciones/[institucionId]` | [C] | `ajustes()` | OPT-07 (renombrar) | — | — |
| `/ajustes/notificaciones` | [S] | `ajustes()` | OPT-02 (activar en este dispositivo), OPT-03 (quitar un dispositivo) | — | Estado del permiso del navegador y la explicación si está denegado (CP-5). Detalle en §8 (Parte D) |
| `/ajustes/seguridad` | [S] | `ajustes()` + `estadoSeguridad()` (CP-4) | [L] `…/factores/nuevo`; [C] `…/factores/[factorId]/quitar`; [1T] cerrar las otras sesiones; salir (§9) | — | §9.6 |
| `/ajustes/seguridad/factores/nuevo` | [L] | `ajustes()` + `estadoSeguridad()` | Inscribir un factor (§9.5) | — | Sin borrador: el secreto nunca se guarda (FE-37) |
| `/ajustes/seguridad/factores/[factorId]/quitar` | [C] | `ajustes()` + `estadoSeguridad()` | Quitar un factor (§9.6) | — | Si es el único factor verificado: lo explica y no deja continuar |
| `/ajustes/exportar` | [S] | `ajustes()` | OPT-08 (descargas por `GET /api/exportar/{json\|csv}`, con enlaces de descarga) | — | — |
| `/ajustes/respaldo` | [S] | `ajustes()` | Ninguna (OPT-09 la hace GitHub Actions) | — | `respaldoAtrasado` y `restauracionAtrasada` |
| `/ajustes/diagnostico` | [S] | `ajustes()` | "Ejecutar tareas ahora" (disparador manual de 04 §10.1) | — | Los 50 últimos eventos, con `idError` buscable (04 7.8) |
| `/ajustes/apariencia` | [S] | `ajustes()` | Tema del dispositivo (next-themes; no escribe en el servidor) | — | — |

### 2.12 Acceso y otras rutas

| Ruta | Clase | Consulta | Operaciones | Avisos | Notas |
|---|---|---|---|---|---|
| `/ingresar` | Acceso | Sin consulta de §6: `estadoAcceso()` (CP-11) | Ingresar con email y contraseña | — | §9.3 |
| `/ingresar/verificar` | Acceso | Sin consulta de §6: `estadoAcceso()` | Verificar el código TOTP | — | §9.4 |
| `/ingresar/inscribir` | Acceso | Sin consulta de §6: `estadoAcceso()` | Inscribir el primer factor | — | §9.5 |
| `/sin-conexion` | Estática | Sin consulta | Ninguna | — | §8 (Parte D) |
| `/reportes` | Redirección | Sin consulta | — | — | Redirige a `/reportes/tendencia` |

### 2.13 Cambios propuestos a 04 que salen del mapa

Se suman a 0.9 y se aplican al cerrar la fase.

#### CP-9 — Navegación entre períodos en las consultas con período (04 §6.3, §6.6, §6.9.3)

Solo `PresupuestoDto` trae `navegacion` (04 6.2). La interfaz no puede calcular el período anterior o siguiente (los genera el motor, §4.2 de 01; FE-19). Se agrega el mismo campo, con el mismo selector `periodos(desde, hasta)`, a:

```ts
navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // inicios de los períodos vecinos
```

- `DetalleCategoriaDto` y `DetallePagoTarjetaDto` (6.3), respecto de su `periodo`;
- `DetalleCuentaDto` (6.6), respecto de `periodoInicio` si se pidió, o del período activo;
- `GastoSemanalDto` (6.9.3), respecto de su `periodo`.

#### CP-10 — Ajustes a la consulta `formulario` (04 §6.14)

- **a) Asignado en el catálogo de categorías.** Para `operacion: 'asignar'`, cada entrada de `catalogos.categorias` lleva además `asignado` (Asig(c, p)) y `disponible` del período pedido (`periodoInicio`, o A). Lo necesitan los `esperado` de OP-15 (`asignacionOrigen`, `asignacionDestino`) y de OP-11 (`asignacionDestino`), que hoy no tienen de dónde salir (04 6.14.2 solo trae Disp(c, A)).
- **b) Ocurrencia de una programada.** `{ operacion: 'programada'; programadaId: Uuid; fechaEsperada?: FechaLocal }`. Con `fechaEsperada`, el contexto agrega `ocurrencia: { fechaEsperada; estado: 'pendiente' | 'emparejada' | 'registrada' | 'omitida'; transaccionId?; monto; cuenta: Ref; lineas; desglosePropuesto? }` (el desglose solo en `cuota_prestamo`, con el selector `desglosePropuesto` del Anexo A de 01). Lo necesita OP-43 de un toque con sus campos editables (04 OP-43).
- **c) Reglas de comercio.** `{ operacion: 'regla'; reglaId?: Uuid }` → catálogo `categorias` y `contexto: { regla?: { id; patron; categoria: Ref; esperado } }`. 04 6.14.5 asigna a OP-41 "el catálogo `categorias`", pero ninguna variante de `formulario` lo entrega para reglas.

#### CP-11 — Funciones de autenticación de la interfaz (04 §12.2 y CP-4)

04 §12.2 fija los flujos, pero no las funciones que llama la interfaz. Se agregan a `@finn/aplicacion/autenticacion`:

```ts
// Sin exigir AAL2: la usan las rutas de ingresar.
function estadoAcceso(): Promise<{
  sesion: 'ninguna' | 'aal1' | 'aal2';
  usuarioPermitido: boolean;                       // sub = FINN_USUARIO_ID
  factoresVerificados: { id: string; nombre: string | null }[];   // para elegir el factor en /ingresar/verificar
}>;

// Todas devuelven ResultadoAccion (04 7.1). Códigos propios en la tabla de 9.7.
function ingresar(e: { email: string; contrasena: string }): Promise<ResultadoAccion<{ siguiente: 'verificar' | 'inscribir' | 'listo' }>>;
function verificarFactor(e: { factorId?: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function iniciarInscripcion(e: { nombre?: string }): Promise<ResultadoAccion<{ factorId: string; qrSvg: string; secreto: string; uri: string }>>;
function completarInscripcion(e: { factorId: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function quitarFactor(e: { factorId: string }): Promise<ResultadoAccion<{}>>;
function cerrarOtrasSesiones(): Promise<ResultadoAccion<{}>>;
function salir(): Promise<ResultadoAccion<{}>>;
```

La verificación de sesión de cada una sigue 04 §12.3: `ingresar` no exige sesión; `verificarFactor` e `iniciarInscripcion`/`completarInscripcion` del primer factor exigen AAL1 del usuario permitido; el resto, `exigirSesionEscritura()`.

#### CP-12 — Catálogo de filtros en los reportes (04 §6.9)

`reporte()` no devuelve los nombres de las cuentas, grupos y categorías que la pantalla necesita para sus filtros ("filtrar por cuenta", producto §10). Se agrega a todos sus DTO:

```ts
filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] };   // incluidas las archivadas con actividad en la ventana
```

y se aclara que `GastoSemanalDto` y `DatosBaseDto` también extienden `Encabezado` (04 6.0.2 lo exige para todo DTO, pero las interfaces de 6.9.3 y 6.9.4 no lo muestran).

#### CP-13 — Cómo señala un error una consulta (04 §2.3.2 y §6.0.1)

04 dice que una consulta produce `VALIDACION`, `NO_ENCONTRADO` o `NO_AUTORIZADO`, pero no **cómo** lo entrega a un Server Component. Se fija:

- Una consulta devuelve su DTO o **lanza** `ExcepcionFinn` (de `@finn/aplicacion/errores`), que lleva un `ErrorFinn` completo. Para `INTERNO`, el `idError` ya está registrado en `eventos_sistema` (04 7.8) antes de lanzar.
- `NO_AUTORIZADO` lleva `datos.aal` (`'ninguna'` o `'aal1'`), para que la interfaz elija entre `/ingresar` y `/ingresar/verificar` (04 12.3).
- `ExcepcionFinn` se puede importar en `apps/web` (servidor). `consultar()` (7.3) la traduce; ninguna página la captura por su cuenta.

#### CP-15 — Lo aprobado en la salida de OP-37 (04 §3.6 y §3.0.3) **[R2]**

Sale de la mitigación de PB-3. `SalidaOperacion` de 04 3.0.3 solo trae `id`, `avisos` y `propuestas`. Para que el resultado de "Aprobar" con un toque muestre lo aprobado según el servidor, la salida de OP-37 (y de OP-50, que es la misma operación) agrega:

```ts
aprobado: {
  total: Centavos; comercio: string | null; fecha: FechaLocal;
  cuenta: Ref;
  destino: { categoria: Ref } | { deudor: Ref } | { partes: number };   // partes: más de una línea
}
```

Es un cambio de la **salida**, no de la entrada: PB-3 aceptó no agregar `esperado`, y eso se mantiene. Sin este cambio, la única fuente de lo aprobado sería la fila que se veía, que es justo lo que la mitigación quiere evitar.

#### CP-16 — Variante `conciliar` de la consulta `formulario` (04 §6.14) **[R2]**

**Por qué no alcanza la variante de gasto (ajuste 2).** Qué necesita cada paso y qué entrega `formulario({ operacion: 'registrar', tipo: 'gasto', cuentaId })` (04 6.14.2 y 6.14.4):

| Paso | Necesita | ¿Lo entrega la variante de gasto? |
|---|---|---|
| OP-45 Subir el CSV | La cuenta (nombre, tipo, saldo) | Sí (catálogo `cuentas`) |
| OP-47 Terminar | La carga firmada y las coincidencias marcadas, que vienen de la salida de OP-45 (04 9.5) | No necesita nada del formulario |
| OP-46 → OP-20 gasto | Cuentas, categorías, deudores, comercios | Sí |
| OP-46 → OP-21, OP-22, OP-25, OP-26, OP-27 | Cuentas y, en aportes, categorías | Sí |
| OP-46 → OP-23 pago de tarjeta, conciliando una **tarjeta** | La cuenta de efectivo de origen propuesta (04 BE-41) | **No** |
| OP-46 → OP-24 cuota de préstamo | Qué préstamos tienen modelo, la categoría propuesta (`categoriaUltimaCuota`) y el desglose propuesto **a la fecha del movimiento** | **No** (solo `tieneModelo`) |
| OP-46 → OP-31 cobro (un abono que es el pago de alguien) | Las líneas por cobrar abiertas (`porCobrarAbiertos`, 04 6.14.4) | **No** |
| OP-46 → OP-33a devolución vinculada (un abono que es una devolución) | Las compras candidatas y su capacidad (`capacidadDevolucion`) | **No** |
| OP-46, cualquier tipo | Qué tipos de alta admite cada movimiento según el tipo de la cuenta y el signo del monto (cargo o abono, 04 9.4) | **No**: la interfaz tendría que deducirlo de la tabla de efectos de 03 §4.5.1, una regla del dominio |
| OP-46 → OP-20 | La categoría sugerida para la descripción del movimiento | No (solo para los comercios recientes) |

**Propuesta.** Una variante nueva, con la misma forma que las demás (04 BE-42):

```ts
| { operacion: 'conciliar'; cuentaId: Uuid }

// catalogos: cuentas, categorias, categoriasPago, deudores, comercios (como en 'registrar' gasto, más categoriasPago)
// contexto:
{
  cuenta: { cuenta: Ref; tipo: TipoCuenta; saldo: Centavos; saldoConfirmado: Centavos;
            ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; diferenciaActual: Centavos } };
  tiposAlta: { cargo: TipoTransaccion[]; abono: TipoTransaccion[] };   // tipos que admite un movimiento de esta cuenta según su signo
  origenPropuestoPago?: Ref;                                           // si la cuenta es tarjeta (BE-41)
  prestamos: { cuenta: Ref; tieneModelo: boolean; categoriaPropuesta?: Ref }[];
  porCobrarAbiertos: { lineaId: Uuid; transaccionId: Uuid; deudor: Ref; fechaOrigen: FechaLocal;
                       comercio: string | null; abierto: Centavos; medio: 'tarjeta' | 'debito' }[];
}
```

Lo que depende de cada movimiento del estado no puede venir en el formulario, porque el estado se conoce después de OP-45. Se resuelve así, sin otra consulta:
- **Desglose de una cuota a la fecha del movimiento:** lo devuelve la previsualización de OP-46 con tipo `cuota_prestamo`, igual que la de OP-24 (04 OP-24: "la previsualización devuelve el desglose del modelo"). Precisión de OP-46: su previsualización es la de la operación que ejecuta.
- **Compras candidatas para una devolución:** la búsqueda de compras de CP-3, con el monto y la fecha del movimiento como valores iniciales.
- **Categoría sugerida para un gasto:** la lectura `sugerencia` de CP-3, pedida una vez al abrir el alta con la descripción del movimiento como comercio. Precisión de CP-3: además de "mientras el usuario escribe", la lectura se pide una vez con un valor precargado; sigue en la lista cerrada y con los mismos límites.

*Alternativa descartada:* reutilizar la variante de gasto y pedir lo que falta con otras lecturas. Serían varias lecturas por pantalla, con revisiones posiblemente distintas, y la regla de los tipos de alta quedaría en la interfaz.

#### CP-14 — `proxy.ts` (04 §12.4)

- Agrega a cada petición la cabecera `x-finn-ruta` con la ruta y la búsqueda originales, para que `consultar()` arme `?volver=` (V5-16). La cabecera se reemplaza siempre, nunca se toma de la petición entrante.
- No redirige las rutas de `/ingresar`: su lógica es la de 9.2.

---

## 3. Navegación

Esta sección define la **arquitectura** de la navegación: jerarquía, requisitos y contratos. La forma (barra inferior, menú lateral, pestañas, cajón u otra) la decide Claude Design (P5-10).

### 3.1 Jerarquía (FE-29)

| Nivel | Secciones | Ruta raíz |
|---|---|---|
| **Principal** | Inicio | `/` |
| | Presupuesto | `/presupuesto` |
| | Bandeja | `/bandeja` |
| | Actividad | `/actividad` |
| | Cuentas | `/cuentas` |
| **Secundaria** | Reportes | `/reportes/tendencia` |
| | Metas | `/metas` |
| | Programadas | `/programadas` |
| | Por cobrar | `/por-cobrar` |
| | Reglas | `/reglas` |
| | Notificaciones | `/notificaciones` |
| | Ajustes | `/ajustes` |
| **Acceso global** | Registrar | `/registrar` |

Toda otra ruta (detalles y flujos) cuelga de una sección. La sección activa la calcula 3.3.

### 3.2 Requisitos (FE-29)

Cualquier presentación que elija el diseño debe cumplir todos:

| # | Requisito |
|---|---|
| N1 | **Registrar** se alcanza con **una** interacción desde cualquier pantalla principal. Desde un detalle de cuenta, abre `/registrar/gasto?cuenta=<id>` |
| N2 | La **Bandeja** con su contador (`bandejaPorRevisar`, CP-2) está **siempre visible o a una interacción**, en toda pantalla de `(finn)` |
| N3 | En Presupuesto, el **período que se ve** está siempre visible, con sus fechas y su estado (cerrado, actual, futuro o de transición). Si no es el activo, hay una forma visible de volver al período actual |
| N4 | Cada sección tiene su URL (3.1). La sección activa se marca (`aria-current="page"` en su enlace) |
| N5 | Toda sección secundaria se alcanza en **dos interacciones como máximo** desde cualquier pantalla principal |
| N6 | **Mismas rutas y misma jerarquía** en teléfono y en computadora. Ninguna pantalla ni acción existe en un solo tamaño |
| N7 | El contador de notificaciones no leídas (`notificacionesNoLeidas`) se ve junto al acceso a Notificaciones, dondequiera que esté |
| N8 | **Volver** dentro de la app es predecible: en un flujo, `cerrarFlujo()` (1.4); en un detalle, la `rutaPadre` de la pantalla (3.3). El "atrás" del navegador y del sistema también funciona y nunca deja un flujo a medio cerrar |

Además, de §11 (Parte C): la navegación es un *landmark* `nav` con nombre accesible, se recorre con el teclado en orden lógico, y un enlace "Saltar al contenido" la precede.

### 3.3 Contratos de navegación (FE-29, FE-30)

Componentes de cliente en `componentes/navegacion/`. Se definen por lo que reciben y exponen; su forma es del diseño (§10, Parte C).

**`NavegacionApp`**

| Recibe | Tipo |
|---|---|
| `secciones` | `{ id: IdSeccion; ruta: string; etiqueta: string; nivel: 'principal' \| 'secundaria' }[]`, en el orden de 3.1 (de `textos/navegacion.ts`) |
| `seccionActiva` | `IdSeccion \| null` |
| `contadores` | `{ bandeja: number \| null; notificaciones: number \| null }` (`null` = sin dato todavía, 1.6) |

Expone: un `nav` con nombre "Navegación principal"; un enlace por sección con su `aria-current`; los contadores dentro del nombre accesible del enlace ("Bandeja, 3 por revisar"). Si el diseño agrupa las secundarias detrás de un control (por ejemplo, "Más"), ese control es un botón con `aria-expanded` y su grupo cumple N5.

**`AccesoRegistrar`**: recibe `ruta` (`/registrar`, o `/registrar/gasto?cuenta=<id>` desde un detalle de cuenta). Expone un enlace con nombre "Registrar".

**`AccesoBandeja`**: recibe `contador` (`number | null`). Expone un enlace a `/bandeja` con el nombre "Bandeja" y el contador. Si el diseño pone la bandeja dentro de `NavegacionApp`, este componente no se usa por separado.

**`EnlaceFinn`** (FE-39): el único envoltorio de `Link` de Next. Recibe las props de `Link`; expone `aria-busy` mientras su navegación está pendiente (`useLinkStatus`) y lo informa al marco para el indicador global de 7.1. Todos los enlaces de estos contratos son `EnlaceFinn`.

**`VolverA`**: recibe `ruta` y `etiqueta` (por ejemplo, "Volver a Cuentas"). Expone un enlace. Lo usan los detalles; los flujos usan `cerrarFlujo()`.

**Sección activa** (`seccionDeRuta(pathname)`, función pura en `componentes/navegacion/`): el prefijo más largo de esta tabla. Si ninguno coincide, `null`.

| Prefijo | Sección | | Prefijo | Sección |
|---|---|---|---|---|
| `/` (exacto) | Inicio | | `/reportes` | Reportes |
| `/presupuesto` | Presupuesto | | `/metas` | Metas |
| `/bandeja` | Bandeja | | `/programadas` | Programadas |
| `/actividad` | Actividad | | `/por-cobrar` | Por cobrar |
| `/cuentas` | Cuentas | | `/reglas` | Reglas |
| `/registrar` | `null` (acceso global) | | `/notificaciones` | Notificaciones |
| | | | `/ajustes` | Ajustes |

**`rutaPadre` de los detalles:**

| Detalle | `rutaPadre` |
|---|---|
| `/presupuesto/categorias/[categoriaId]` | `/presupuesto` con el mismo `?periodo=` |
| `/presupuesto/listo-para-asignar` | `/presupuesto` |
| `/presupuesto/estructura` | `/presupuesto` |
| `/actividad/[transaccionId]` | `/actividad` (o `?volver=`, abajo) |
| `/cuentas/[cuentaId]` | `/cuentas` |
| Subpáginas de `/ajustes` | `/ajustes` |

**[R2] Regreso con `?volver=`.** Todo detalle [D] acepta `?volver=` con la ruta interna desde la que se llegó, por ejemplo `/actividad/<id>?volver=%2Factividad%3Fcuenta%3D…`, para que "Volver" regrese a la lista con sus filtros. Se valida exactamente como en 3.6 (empieza con `/` y no con `//` ni `/\`); si no es válida o falta, se usa la `rutaPadre` de la tabla. La etiqueta del enlace sale de la sección de esa ruta (`seccionDeRuta`): "Volver a Actividad", "Volver a Cuentas". Los enlaces de las listas a sus detalles agregan `?volver=` con la ruta y la búsqueda actuales.

**Justificación.** Contratos por datos y comportamiento dejan al diseño libre de elegir la forma sin que cambien las rutas ni las pruebas (§14, Parte C); la sección activa por prefijo hace que cualquier ruta nueva caiga en su sección sin configuración. *Alternativas descartadas:* fijar una barra inferior con cinco destinos (lo descarta la respuesta a P5-10); marcar la sección activa en cada página a mano (fácil de olvidar en una ruta nueva).

### 3.4 Navegación entre períodos (FE-31)

| Pantalla | Fuente de anterior y siguiente | Parámetro |
|---|---|---|
| Presupuesto | `PresupuestoDto.navegacion` (04 6.2) | `?periodo=` |
| Detalle de categoría | `navegacion` (CP-9) | `?periodo=` |
| Detalle de cuenta (filtro por período) | `navegacion` (CP-9) | `?periodo=` |
| Gasto semanal | `navegacion` (CP-9) | `?periodo=` |

Reglas:
- **Enlaces**, no botones con estado: "Período anterior" y "Período siguiente" son enlaces a la misma ruta con otro `?periodo=`. Navegar entre períodos agrega una entrada al historial, así que "atrás" vuelve al período anterior.
- El **período activo no lleva parámetro**: el enlace a él quita `?periodo=`. Así, una URL guardada sin parámetro siempre abre el período actual, también después de un cambio de día.
- El componente de §10 que muestra el período (`SelectorPeriodo`) recibe `{ periodo: PeriodoDto; periodoActivo: PeriodoDto; anterior?: FechaLocal; siguiente?: FechaLocal; ruta: string; parametros: Record<string, string> }` y expone los tres enlaces ("Período anterior", "Período siguiente", "Ir al período actual", este último solo si `periodo` no es el activo), con el período como texto (`formatearPeriodoCorto`).
- Al ir de Presupuesto a un detalle de categoría, y de vuelta, el `?periodo=` se conserva en los enlaces.
- La interfaz nunca calcula un período: si no hay `anterior`, el enlace no aparece. `siguiente` siempre existe porque los períodos futuros se generan (§4.2 de 01).

**Justificación de FE-31.** Con enlaces, cada período tiene una URL que se puede recargar, guardar y abrir desde una notificación (`cierre_periodo`, CP-1), y "atrás" funciona como se espera. *Alternativa descartada:* un selector con estado en el cliente que cambia el período sin cambiar la URL (se pierde al recargar y no deja volver con "atrás").

### 3.5 Destinos de las notificaciones (FE-32)

**Traducción de `DestinoNotificacion` (CP-1) a rutas**, en `componentes/navegacion/destinos.ts`, compartida por el centro de notificaciones y el service worker:

| `destino.pantalla` | Ruta |
|---|---|
| `inicio` | `/` |
| `bandeja` | `/bandeja` |
| `movimiento` | `/bandeja/[movimientoId]` |
| `transaccion` | `/actividad/[transaccionId]` |
| `programada` con `fechaEsperada` | `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` |
| `programada` sin `fechaEsperada` | `/programadas/[programadaId]` |
| `presupuesto` | `/presupuesto?periodo=[periodoInicio]` |
| `categoria` | `/presupuesto/categorias/[categoriaId]` (con `?periodo=` si viene) |
| `diagnostico` | `/ajustes/diagnostico` |
| `cuenta` **[F6]** CF-07 | `/cuentas/[cuentaId]` |
| Sin destino, o un destino que no valida con el contrato | `/notificaciones` |

**Marca de leída al abrir.**
- La ruta del destino se abre con el parámetro `?notificacion=<id>`.
- Un componente de cliente del marco (`MarcarLeidaAlAbrir`) lo detecta, ejecuta OPT-04 para ese id una sola vez y quita el parámetro con `router.replace`, sin agregar una entrada al historial.
- Si OPT-04 falla, no muestra error: la notificación queda sin leer.
- Desde el centro de notificaciones, tocar una notificación hace lo mismo: navega con `?notificacion=`.

**Acciones desde la notificación** (04 11.5, sin cambios): 200 → nada que abrir; 401 → `/bandeja` (y de ahí a `/ingresar?volver=/bandeja`); 409 o 422 → `/bandeja/[movimientoId]`.

**Comportamiento al abrir:**
- Un destino que es un flujo corto se abre como **página completa** (V5-06d) y `cerrarFlujo()` vuelve a su `rutaPadre`.
- Si la entidad ya no existe, la consulta responde `NO_ENCONTRADO` y la pantalla es la de 7.3.
- Si no hay sesión, la consulta lleva a `/ingresar?volver=<destino>` (V5-16), y al ingresar se abre el destino.
- El service worker enfoca una ventana abierta de la app y navega en ella, o abre una nueva (§8, Parte D).

**Justificación.** El parámetro marca la notificación como leída sin agregar un Route Handler (la lista de 04 2.2.1 es cerrada) y sin escribir durante el render de un Server Component. *Alternativas descartadas:* marcar como leída en el service worker antes de abrir (el service worker solo puede usar Route Handlers, y el de 04 11.5 es solo para confirmar o rechazar coincidencias); marcarla desde el Server Component de la página (una escritura en una lectura, que 04 prohíbe).

### 3.6 Volver después de ingresar

- `?volver=` lleva la ruta y la búsqueda de la pantalla que pidió la sesión (CP-14, V5-16a).
- Solo se acepta una ruta interna: debe empezar con `/` y no con `//` ni `/\`; si no, se usa `/` (V5-16b y c).
- Si `volver` apunta a un flujo largo, el flujo recupera su borrador (4.11).

---

## 7. Estados de cada pantalla

Cada pantalla de §2 tiene estos estados. Su forma la decide el diseño; aquí están los requisitos y el mecanismo.

| Estado | Mecanismo | Sección |
|---|---|---|
| Carga | `loading.tsx` del segmento (streaming) | 7.1 |
| Vacío | La propia página, según el DTO | 7.2 |
| Error de la consulta | `consultar()` + `error.tsx` o `not-found.tsx` | 7.3 |
| Sin conexión | Marco + service worker | 7.4 |
| Sesión vencida | `consultar()` y `useOperacion` | 7.5 |
| Versión nueva | `useOperacion` + service worker | 7.6 |
| Solo lectura | La propia página, según el DTO | 7.7 |

### 7.1 Carga (FE-33)

- **Un `loading.tsx` por segmento con página**: cada sección principal y secundaria, cada detalle y cada flujo. Next lo muestra en cuanto empieza la navegación, mientras la consulta se resuelve.
- **También en el slot `@superpuesto`**: cada ruta interceptada tiene su `loading.tsx`, así un flujo corto aparece de inmediato sobre la pantalla de origen, en estado de carga.
- **Sin `Suspense` dentro de una página.** Como cada página hace una sola consulta (FE-26), no hay partes que puedan llegar antes que otras. La excepción es Ajustes > Seguridad, cuya lista de factores (`estadoSeguridad()`) va en su propio `Suspense`.
- Requisitos del estado de carga [Diseño]:
  - mantiene la estructura de la pantalla (mismas regiones), para que no salte el contenido al llegar;
  - **nunca muestra números inventados** ni ceros como si fueran datos;
  - la región que carga lleva `aria-busy="true"`, y un texto accesible "Cargando {pantalla}" se anuncia una vez;
  - con movimiento reducido no hay animación (§11, Parte C).
- La carga dentro de un formulario (enviar, previsualizar) es el estado `enviando` de `useOperacion` (4.3). La de una lectura interactiva no bloquea el campo.

**Señal inmediata al navegar (FE-39).** V5-19 midió que `loading.tsx` solo aparece de inmediato si el *prefetch* del enlace ya terminó: con el prefetch terminado apareció en 6 de 6 navegaciones (61 a 122 ms); sin él, solo en 5 de 12, y el resto no tuvo ninguna señal hasta que llegó el contenido (unos 2 s en la prueba). En un teléfono con 4G, tocar un enlace antes de que termine su prefetch es frecuente. Por eso:
- todo enlace interno de `apps/web` usa `EnlaceFinn` (`componentes/navegacion/`), que envuelve `Link` de Next y lee `useLinkStatus()`: mientras la navegación está pendiente, el propio enlace lo indica (`aria-busy` y una señal visual [Diseño]) y avisa al marco, que muestra un indicador global de navegación en curso;
- V5-19 midió que `useLinkStatus` dio la señal sin prefetch en 5 de 6 navegaciones (64 a 147 ms). El caso restante se repite en la Parte C con la aplicación completa (D-8). *(C)* V5-21: con la página hidratada, 10 de 10; antes de hidratar no hay señal, y lo cubre el estado presionado solo con CSS (10.9);
- el prefetch por defecto de `Link` no se desactiva: en producción, Next lo hace solo con los enlaces visibles;
- una regla de lint prohíbe importar `next/link` fuera de `EnlaceFinn`.

*Alternativas descartadas:* depender solo de `loading.tsx` (sin señal en la mitad de los casos medidos sin prefetch); prefetch completo de todas las rutas al cargar (más egreso de la base, porque cada prefetch de una página dinámica ejecuta su consulta).

**Justificación de FE-33.** La navegación responde al instante en un teléfono con 4G aunque la consulta tarde, sin dividir la página en partes que vendrían de lecturas distintas. *Alternativas descartadas:* un solo `loading.tsx` en `(finn)` (reemplazaría también el marco y no respetaría la estructura de cada pantalla); `Suspense` por bloque con consultas separadas (rompe la regla de una instantánea por pantalla, 04 5.1).

### 7.2 Vacío (FE-34)

| Clase | Cuándo | Qué muestra |
|---|---|---|
| **Primer uso** (**[F6]** en Inicio lo resuelven los Primeros pasos, CF-18; desde "Crear las categorías" se ofrece la plantilla, CF-08) | No hay ninguna cuenta (`CuentasDto` y catálogos vacíos) | En Inicio, una guía con los primeros pasos: crear una cuenta (`/cuentas/nueva`) y revisar las categorías (`/presupuesto/estructura`). En las demás principales, el estado vacío de su sección con el enlace a crear la primera cuenta |
| **Vacío** | La sección no tiene elementos (sin metas, sin reglas, bandeja al día…) | Un texto que dice qué hay en esta sección y la acción para crear el primero, si existe. El texto de cada pantalla está en la columna "Notas" de §2 |
| **Sin resultados** | Hay elementos, pero los filtros de la URL no dejan ninguno | "Sin resultados con estos filtros" y "Quitar filtros" (enlace a la ruta sin los parámetros de filtro) |

- Los textos van en `src/textos/<area>.ts` (§12) y siguen el voseo.
- Un estado vacío nunca oculta los contadores del marco ni el acceso a Registrar (N1, N2).

**Justificación de FE-34.** Las tres clases piden respuestas distintas: el primer uso necesita una guía, una sección vacía necesita su primera acción y un filtro sin resultados necesita quitar el filtro. Un mensaje único ("No hay datos") no le dice al usuario qué hacer. *Alternativa descartada:* definir el vacío solo por pantalla, sin clases (cada pantalla resolvería el primer uso a su manera).

### 7.3 Error de la consulta (FE-28)

**`consultar()`** (`apps/web/src/servidor/consultar.ts`) envuelve cada llamada a una consulta desde un Server Component. Traduce la `ExcepcionFinn` de CP-13:

| Error de la consulta | Qué hace | Pantalla |
|---|---|---|
| `NO_AUTORIZADO` con `datos.aal = 'ninguna'` | `redirect('/ingresar?volver=' + x-finn-ruta)` | `/ingresar` (V5-16a) |
| `NO_AUTORIZADO` con `datos.aal = 'aal1'` | `redirect('/ingresar/verificar?volver=' + x-finn-ruta)` | `/ingresar/verificar` |
| `NO_ENCONTRADO` | `notFound()` | `not-found.tsx` de `(finn)`: "Esto ya no existe.", con el enlace a la sección (V5-17) |
| `VALIDACION` (parámetros de búsqueda) | `redirect` a la misma ruta sin los parámetros de `campos` | La pantalla con sus valores por defecto |
| `VALIDACION` (segmento dinámico, por ejemplo un id que no es UUID) | `notFound()` | `not-found.tsx` |
| `INTERNO`, `INCIERTO`, `OCUPADO` u otro | Lanza un `Error` cuyo `digest` es el `idError` (V5-15a) | `error.tsx` |

**`error.tsx`** (componente de cliente, uno en `(finn)` y uno en `@superpuesto`; `global-error.tsx` en la raíz):
- Muestra "Algo salió mal y no se pudo cargar esta pantalla." y "Referencia: {error.digest}" (§12).
- En producción, Next entrega a `error.tsx` solo el `digest` y un mensaje genérico: el mensaje original de la consulta no llega al navegador (V5-15b). Next respeta un `digest` que ya trae el error, así que la referencia es el mismo `idError` registrado en `eventos_sistema` (04 7.8) y visible en Ajustes > Diagnóstico.
- Un error que no pasó por `consultar()` (un fallo de programación en la página) llega con el `digest` numérico de Next (V5-15c). Se muestra igual como referencia; solo queda en los registros de Vercel (D-6).
- "Intentar de nuevo" ejecuta `router.refresh()` y `reset()` dentro de una transición, para volver a pedir los Server Components.
- En el slot, el error se muestra dentro del flujo superpuesto, sin tapar la pantalla de origen.
- El marco (navegación, contadores, Registrar) sigue visible, porque `error.tsx` de `(finn)` está por debajo de su layout.

**Justificación.** Un solo punto de traducción hace que todas las pantallas respondan igual a los mismos errores, y la referencia que ve el usuario es la misma que se busca en el diagnóstico. *Alternativas descartadas:* que cada página capture sus errores (comportamiento distinto en cada pantalla y fácil de olvidar); mostrar el `digest` numérico de Next (no se puede buscar en `eventos_sistema`).

### 7.4 Sin conexión (FE-35)

| Situación | Comportamiento |
|---|---|
| Se pierde la conexión con una pantalla abierta | El marco muestra un aviso persistente "Estás sin conexión" (`role="status"`). La pantalla sigue visible tal como estaba. Todo control de envío se deshabilita y muestra su motivo (4.8). Las lecturas interactivas no consultan |
| Se navega a otra pantalla sin conexión | *(D)* **Corregido (V5-30b):** si el pedido falla, Next hace una navegación de documento y el service worker responde con `/sin-conexion`. Para conservar la pantalla actual, `EnlaceFinn` y `useNavegacionFinn` no navegan cuando `navigator.onLine` es falso y el aviso lo explica (FE-56, 8.5). Una navegación de documento (recarga, abrir desde una notificación) la resuelve el service worker con `/sin-conexion` |
| Vuelve la conexión | El aviso desaparece y la pantalla se refresca (FE-21). Nada se reenvía solo (4.8) |

No se muestra ningún número guardado en el cliente: la app es solo en línea (02 ADR-13, FE-20).

**Justificación de FE-35.** Mantener la pantalla visible y deshabilitar solo los envíos es honesto con lo que la app puede hacer sin red, sin inventar una copia de los datos. *Alternativas descartadas:* reemplazar la pantalla por `/sin-conexion` en cuanto se corta la red (pierde lo que el usuario estaba mirando o escribiendo); guardar los últimos datos para mostrarlos sin conexión (lo prohíbe FE-20).

### 7.5 Sesión vencida

- **Al leer:** la consulta responde `NO_AUTORIZADO` y `consultar()` redirige a `/ingresar?volver=…` o a `/ingresar/verificar?volver=…` (7.3).
- **Al escribir:** la Server Action responde `NO_AUTORIZADO` (04 2.2.2) y `useOperacion` navega a `/ingresar?volver=<ruta del flujo>` (4.7). Los flujos largos conservan su borrador (4.11) y lo recuperan al volver.
- **Sin hacer nada:** no hay detección en segundo plano; el próximo pedido lo resuelve. `proxy.ts` redirige de forma optimista si la cookie ya no existe (04 12.4).

### 7.6 Versión nueva

FE-13 (4.10) para los envíos. Además, el service worker avisa cuando hay una versión instalada esperando (§8, Parte D). Las dos vías muestran el mismo aviso con "Recargar".

### 7.7 Solo lectura

Estados en los que la pantalla se ve pero no se puede actuar, siempre a partir del DTO:

| Caso | Fuente | Qué se deshabilita |
|---|---|---|
| Período cerrado en Presupuesto o en un detalle de categoría | `periodo.estado = 'cerrado'` | Asignar, mover, auto-asignar (inv. 18) |
| Cuenta archivada | `cuenta.archivada` | Registrar con esa cuenta, pagar, cuota, conciliar (§5.0.5 de 01) |
| Transacción con restricciones | `restricciones` (04 6.7.2) | Las acciones que no permite, con su motivo |
| Categoría de pago | `clase = 'pago'` | Metas, fusión y archivo propio (I2, F3) |
| Movimiento aprobado o descartado | `estado` | Edición; se muestra su estado y el enlace que corresponda |

Una acción deshabilitada se muestra con su motivo en texto (no solo con un estilo), para que se entienda y se lea con un lector de pantalla.

---

## 9. Autenticación en la interfaz

Aplica 04 §12 (flujos, `getClaims()` y `getUser()`, recuperación) a las pantallas. Las funciones de servidor son las de CP-11; las Server Actions que las exponen viven en `apps/web/src/servidor/acciones/autenticacion.ts`, con el envoltorio de escritura (`accion()`), y la interfaz las llama con `useOperacion` (§4).

### 9.1 Rutas

| Ruta | Para qué | Requiere |
|---|---|---|
| `/ingresar` | Email y contraseña | Nada |
| `/ingresar/verificar` | Código TOTP | Sesión AAL1 con al menos un factor verificado |
| `/ingresar/inscribir` | Primer factor TOTP | Sesión AAL1 con **cero** factores verificados (04 12.2) |
| `/ajustes/seguridad` | Factores y sesiones | AAL2 |
| `/ajustes/seguridad/factores/nuevo` | Factor de respaldo | AAL2 |
| `/ajustes/seguridad/factores/[factorId]/quitar` | Quitar un factor | AAL2 y otro factor verificado |

Las tres rutas de `ingresar` están fuera de `(finn)` (1.2): no tienen el marco autenticado ni ejecutan la puesta al día.

### 9.2 Redirecciones al entrar (FE-36)

Cada página de `ingresar` lee `estadoAcceso()` (CP-11) en el servidor y decide antes de mostrar nada:

| Estado | `/ingresar` | `/ingresar/verificar` | `/ingresar/inscribir` |
|---|---|---|---|
| Sin sesión | Muestra el formulario | → `/ingresar` | → `/ingresar` |
| AAL1, usuario no permitido (`usuarioPermitido = false`) | Cierra la sesión y muestra el formulario con el mensaje de credenciales inválidas | Ídem → `/ingresar` | Ídem → `/ingresar` |
| AAL1 con factores verificados (`factoresVerificados` no vacío) | → `/ingresar/verificar` | Muestra el código | → `/ingresar/verificar` |
| AAL1 sin factores verificados | → `/ingresar/inscribir` | → `/ingresar/inscribir` | Muestra la inscripción |
| AAL2 | → `volver` | → `volver` | → `volver` |

- Todas conservan `?volver=` (saneado como en 3.6).
- `proxy.ts` no redirige estas rutas (CP-14): la tabla es la única lógica.

**Justificación.** Con la tabla en el servidor, cualquier URL de acceso lleva al paso correcto, también si el usuario la guardó o vuelve con "atrás". *Alternativa descartada:* decidir en el cliente después de cargar (se vería un paso equivocado antes de redirigir).

### 9.3 `/ingresar`

- **Campos:** email (`type="email"`, `autoComplete="username"`) y contraseña (`type="password"`, `autoComplete="current-password"`, con la opción de mostrarla). Sin "Recordarme": la sesión ya es larga (ADR-08).
- **Envío:** `ingresar({ email, contrasena })`. Con `siguiente`: `verificar` → `/ingresar/verificar?volver=`; `inscribir` → `/ingresar/inscribir?volver=`; `listo` no ocurre (siempre hay un segundo paso).
- **Errores** (9.7): un solo mensaje para credenciales inválidas, sea el email, la contraseña o un usuario distinto del permitido, para no revelar cuál falló.
- **Sin registro ni recuperación de contraseña en la app** (registro deshabilitado, ADR-08; recuperación desde el panel de Supabase, 04 12.6). Un texto breve dice que la recuperación se hace con el procedimiento del repositorio.

### 9.4 `/ingresar/verificar` (FE-38)

- **Factor:** si hay un solo factor verificado, se usa ese. Si hay varios, se elige por su nombre (`estadoAcceso().factoresVerificados`, CP-11), con el primero preseleccionado.
- **Código:** un campo de 6 dígitos con `inputMode="numeric"`, `autoComplete="one-time-code"` y `pattern="\d{6}"`. Al pegar, se quitan espacios y guiones.
- **Sin envío automático** al completar los 6 dígitos: se envía con el botón o con Enter. Un cambio de pantalla al escribir sorprende y no cumple WCAG 2.2 (criterio 3.2.2).
- **Envío:** `verificarFactor({ factorId, codigo })` hace `mfa.challenge` y `mfa.verify` (04 12.2). Con éxito, la sesión pasa a AAL2 y se navega a `volver`.
- **Errores:** código incorrecto o vencido → el mensaje y el campo vacío con el foco; demasiados intentos → el mensaje de espera.
- "Usar otra cuenta" ejecuta `salir()` y vuelve a `/ingresar`.

**Justificación de FE-38.** El paso es corto y el botón no agrega demora real, mientras que el envío automático puede mandar un código a medio pegar. *Alternativa descartada:* enviar al sexto dígito (más rápido, pero cambia la pantalla sin una acción del usuario).

### 9.5 Inscribir un factor (FE-37)

Lo usan `/ingresar/inscribir` (primer factor, AAL1) y `/ajustes/seguridad/factores/nuevo` (respaldo, AAL2).

1. **Al abrir**, el componente de cliente llama a `iniciarInscripcion({ nombre })`. En el servidor:
   - se quitan los factores **sin verificar** de intentos anteriores (`mfa.unenroll`), para que un intento abandonado no deje un factor colgado;
   - se llama a `mfa.enroll({ factorType: 'totp', friendlyName })`.
   - El nombre por defecto es "Autenticador" (primer factor) o "Respaldo" (siguiente); se puede cambiar.
2. **Se muestran** el código QR (`qrSvg`, como imagen con texto alternativo "Código QR para tu app de autenticación") y el **secreto** en texto, agrupado de a 4 caracteres, con "Copiar", para guardarlo en el gestor de contraseñas como factor de respaldo (ADR-08).
3. **El usuario escribe el código** que muestra su app (mismo campo que 9.4). `completarInscripcion({ factorId, codigo })` hace `challenge` y `verify`; con éxito, la sesión es AAL2.
4. **Al terminar el primer factor**, la pantalla recomienda inscribir uno de respaldo, con el enlace a `/ajustes/seguridad/factores/nuevo` (ADR-08), y sigue a `volver`.

**Protección del secreto:**
- Nunca se guarda en `sessionStorage` (sin borrador) ni se registra en eventos.
- Solo vive en el estado del componente mientras la pantalla está abierta.
- Las páginas son dinámicas y no se guardan en la caché del service worker (§8, Parte D).
- Si el usuario recarga, se empieza una inscripción nueva y la anterior, sin verificar, se quita en el paso 1.
- `/ingresar/inscribir` se niega si ya existe un factor verificado (04 12.2; tabla de 9.2).

**Justificación.** Limpiar los factores sin verificar evita el límite de factores pendientes de Supabase y un estado confuso en Ajustes; no persistir el secreto mantiene fuera del dispositivo lo único que permitiría generar códigos. *Alternativa descartada:* guardar el paso en el borrador para sobrevivir a una recarga (dejaría el secreto TOTP en `sessionStorage`).

### 9.6 Ajustes > Seguridad

- **Lista de factores** (`estadoSeguridad()`, CP-4): nombre, fecha de alta y estado. Los factores sin verificar se muestran como "Inscripción sin terminar", con "Quitar".
- **Agregar un factor:** `/ajustes/seguridad/factores/nuevo` (9.5).
- **Quitar un factor:** `/ajustes/seguridad/factores/[factorId]/quitar`, con confirmación. Solo si queda otro factor verificado (04 12.2); si no, el flujo explica que se necesita otro factor antes y enlaza a agregarlo. Ejecuta `quitarFactor({ factorId })`.
- **Cerrar las otras sesiones** [1T]: `cerrarOtrasSesiones()` (`signOut({ scope: 'others' })`); sin salida para revertir (4.14).
- **Salir:** `salir()` (`signOut({ scope: 'local' })`, 04 12.2). Después, en el cliente: se borran los borradores de la pestaña (4.11) y se navega a `/ingresar`. La suscripción push del dispositivo **no** se quita; para eso está Ajustes > Notificaciones.

### 9.7 Errores de autenticación

Códigos propios de las funciones de CP-11 (categoría `DOMINIO` salvo que se indique). Los mensajes van en el catálogo del servidor (04 7.10) y siguen el voseo.

| Código | Cuándo | Mensaje |
|---|---|---|
| `credenciales_invalidas` | Email o contraseña incorrectos, o un usuario distinto de `FINN_USUARIO_ID` | "El email o la contraseña no son correctos." |
| `demasiados_intentos` | Límite de Supabase (429) | "Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar." |
| `codigo_incorrecto` | El código TOTP no verifica | "El código no es correcto. Revisá que sea el de Finn en tu app." |
| `codigo_vencido` | El desafío venció | "El código venció. Escribí el que muestra ahora tu app." |
| `inscripcion_no_permitida` | Ya hay un factor verificado y la sesión es AAL1 | "Ya tenés un factor. Ingresá con tu código." |
| `factor_unico` | Quitar el único factor verificado | "Agregá otro factor antes de quitar este." |
| `NO_AUTORIZADO` (categoría) | Sesión vencida en Ajustes > Seguridad | Como en 7.5 |

Las funciones de autenticación no tienen idempotencia por id (no crean hechos de Finn). El doble envío lo evita `useOperacion` (4.9).

---

## 10. Contrato del sistema de diseño

Esta sección define **qué** tiene que existir para que la interfaz funcione y sea accesible: nombres de tokens, estados, roles tipográficos, componentes con sus props y sus estados. **Cómo se ve** (colores, fuentes, glifos, forma de los contenedores y de la navegación) lo define Claude Design, sin nada de la 1.0 (P5-1, PF-1), a partir de la exploración de identidad que ya existe en su proyecto (Anexo A, A.0 **[R4]**). Todo valor de esta sección marcado **[Provisional]** es neutro, sirve para construir y probar, y se reemplaza sin cambiar ningún nombre.

### 10.1 Cómo se entrega y se reemplaza (FE-40)

| Pieza | Archivo | Contenido |
|---|---|---|
**[F6] CF-10 y CF-11.** `tokens.css` es el que entregó el diseño, con las variables **sin** el prefijo `--finn-` (`--superficie`, `--radio-control`…), claro por defecto y oscuro por `data-theme="oscuro"` o por preferencia del sistema. El puente usa `@custom-variant dark (&:where([data-theme=oscuro], [data-theme=oscuro] *))` y expone las mismas utilidades (`--color-superficie: var(--superficie)`); `--spacing` toma el valor de `--espacio-1`. Donde la tabla dice `--finn-*` y `.dark`, rige esta nota.

| Valores | `src/estilos/tokens.css` | Variables `--finn-*` en `:root` (tema claro) y en `.dark` (tema oscuro). **Es lo único que Claude Design reemplaza** |
| Puente con Tailwind | `src/estilos/globals.css` | `@import "tailwindcss"`, `@import "./tokens.css"`, `@custom-variant dark (&:where(.dark, .dark *))` y un bloque `@theme inline` que expone cada token como utilidad (`--color-superficie: var(--finn-superficie)` → `bg-superficie`, `text-problema-texto`…) |
| Lista de tokens | `src/estilos/tokens.json` | Nombres y valores; lo leen el control de contraste (10.2) y las pruebas |

Reglas (se agregan a 1.7):

| # | Regla | Herramienta |
|---|---|---|
| L12 | Ningún color literal en `apps/web` fuera de `tokens.css`: ni `#hex`, `rgb()` u `oklch()` en estilos, ni utilidades de la paleta de Tailwind (`text-red-600`, `bg-zinc-100`). Solo utilidades de tokens | `stylelint` (`color-no-hex` y lista de funciones) y una regla de ESLint sobre `className` (patrón de la paleta) |
| L13 | Ninguna clase de Tailwind armada con plantillas (`` `text-${estado}-texto` ``): Tailwind solo genera las clases que encuentra escritas. Las variantes por estado usan un mapa con clases literales (como `IndicadorEstado`, 10.3) | ESLint (`no-restricted-syntax` sobre `TemplateLiteral` dentro de `className`) |
| L14 | Ningún valor de espaciado, radio, sombra o duración arbitrario (`p-[13px]`, `duration-[250ms]`) | ESLint sobre `className` |

**Verificación en la app de prueba (V5-24).** Con Tailwind 4.3 y Next 16.4.1, `@theme inline` sobre las variables de `tokens.css` genera las utilidades esperadas; la clase `.dark` en un ancestro cambia los valores sin recompilar; el CSS resultante de la página de tokens pesa 3,4 KB con gzip.

**Justificación de FE-40.** Las variables CSS separan el nombre (estable, usado por componentes y pruebas) del valor (de Claude Design); `@theme inline` hace que la utilidad apunte a la variable y no a un valor fijo, así el tema oscuro solo redefine variables. *Alternativas descartadas:* definir los colores directamente en `@theme` (el tema oscuro necesitaría duplicar cada utilidad con `dark:`); tokens en TypeScript con estilos en línea (pierde las utilidades de Tailwind y los estados `hover`/`focus`); conservar los tokens de la 1.0 (lo descarta PF-1).

### 10.2 Tokens de color

Nombres definitivos; valores **[Provisional]** (escala gris neutra y tonos estándar, sin identidad).

**Superficies, bordes y texto**

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `fondo` | Fondo de la aplicación | #FAFAFA | #09090B |
| `superficie` | Contenedores, filas, campos | #FFFFFF | #18181B |
| `superficie-elevada` | Superpuestos (flujos cortos, menús) | #FFFFFF | #27272A |
| `superficie-hundida` | Zonas secundarias, controles deshabilitados | #F4F4F5 | #111113 |
| `borde-sutil` | Separadores decorativos (sin requisito de contraste) | #E4E4E7 | #27272A |
| `borde-control` | Borde de campos, casillas, interruptores (WCAG 1.4.11) | #8A8A93 | #7C7C85 |
| `foco` | Anillo de foco visible | #18181B | #FAFAFA |
| `velo` | Fondo detrás de un superpuesto | rgba(9,9,11,.5) | rgba(0,0,0,.6) |
| `texto` | Texto principal y montos | #18181B | #FAFAFA |
| `texto-secundario` | Etiquetas, metadatos | #52525B | #A1A1AA |
| `texto-terciario` | Notas, ayudas | #63636B | #9A9AA3 |
| `texto-deshabilitado` | Solo en controles deshabilitados (exento de contraste, WCAG 1.4.3) | #A1A1AA | #52525B |
| `enlace` | Enlaces dentro de texto | #1D4ED8 | #93C5FD |

**Acción**

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `accion`, `accion-hover`, `accion-presionada` | Botón principal en sus tres estados | #18181B, #3F3F46, #27272A | #FAFAFA, #E4E4E7, #D4D4D8 |
| `texto-sobre-accion` | Texto del botón principal | #FFFFFF | #18181B |
| `accion-secundaria` | Fondo del botón secundario | #F4F4F5 | #27272A |
| `peligro`, `texto-sobre-peligro` | Acciones destructivas (eliminar, quitar un factor) | #B91C1C, #FFFFFF | #F87171, #18181B |

**Estados financieros** (cada uno con `-texto`, `-fondo` y `-borde`; su significado está en 10.3)

| Estado | Texto (claro / oscuro) | Fondo (claro / oscuro) | Borde (claro / oscuro) |
|---|---|---|---|
| `positivo` | #166534 / #86EFAC | #F0FDF4 / #052E16 | #15803D / #22C55E |
| `cero` | #3F3F46 / #D4D4D8 | #F4F4F5 / #27272A | #71717A / #A1A1AA |
| `advertencia` | #854D0E / #FDE68A | #FEFCE8 / #422006 | #A16207 / #EAB308 |
| `problema` | #991B1B / #FCA5A5 | #FEF2F2 / #450A0A | #DC2626 / #EF4444 |
| `deuda` | #1E3A8A / #BFDBFE | #EFF6FF / #172554 | #2563EB / #3B82F6 |
| `deuda-sin-respaldo` | #6B21A8 / #E9D5FF | #FAF5FF / #3B0764 | #9333EA / #A855F7 |
| `informacion` | #155E75 / #A5F3FC | #ECFEFF / #083344 | #0E7490 / #06B6D4 |

**Gráficos [R3]**

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `grafico-serie-1` a `grafico-serie-8` | Paleta categórica: porciones de la dona de Reportes > Categorías, series de las líneas y barras con más de una serie. Se asignan en el orden que da el DTO; con más de 8 categorías, las que siguen se agrupan en "Otras" con `grafico-serie-8` | #2563EB, #C2410C, #15803D, #9333EA, #BE185D, #0E7490, #A16207, #52525B | #60A5FA, #FB923C, #4ADE80, #C084FC, #F472B6, #22D3EE, #FACC15, #A1A1AA |
| `grafico-referencia` | Líneas de referencia: lo asignado por semana en el gasto semanal, la meta, el límite de una tarjeta | #3F3F46 | #D4D4D8 |
| `grafico-rejilla` | Rejilla y ejes secundarios (decorativos, sin requisito de contraste) | #E4E4E7 | #3F3F46 |

Reglas de los gráficos:
- **Cada serie se distingue también sin color** (WCAG 1.4.1), con al menos uno de: etiqueta directa junto a la serie o la porción, patrón o forma de marcador distinta por serie, o la tabla equivalente de P5-13 (siempre presente, 10.8). La dona lleva etiqueta directa en las porciones que el diseño pueda rotular y la leyenda en el mismo orden que las porciones.
- **Contraste 3:1** de cada serie y de la referencia contra `fondo`, `superficie` y `superficie-elevada` (1.4.11). La referencia, además, se distingue por la forma de la línea (por ejemplo, discontinua) y por su nombre en la leyenda.
- La paleta categórica **no** comunica estados financieros: una porción de la dona nunca usa un token de 10.3, para que el color de una categoría no se lea como "problema" o "positivo".

**Marca [R3]**

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `marca` | Acento de identidad (opcional): el símbolo, la pantalla de ingreso, algún detalle del marco. Si el diseño no lo usa, vale `var(--finn-accion)` | `var(--finn-accion)` | `var(--finn-accion)` |
| `texto-sobre-marca` | Texto sobre `marca` | `var(--finn-texto-sobre-accion)` | `var(--finn-texto-sobre-accion)` |

`marca` nunca reemplaza a `accion` en los controles: el botón principal es siempre `accion`, para que la acción se reconozca igual en todas las pantallas.

`deuda-sin-respaldo` es el **nombre interno del token** (el del encargo y el concepto de 00 O2). Nunca aparece en pantalla: los textos visibles son los de 12.3 ("Deuda sin reservar" en una categoría, "Te falta reservar" en la tarjeta, PB-1).

**Contrastes exigidos** (los comprueba `scripts/contraste.py`, V5-23, sobre `tokens.json`; corre en CI y Claude Design lo usa para validar su propuesta):

| Par | Mínimo | Criterio WCAG |
|---|---|---|
| `texto`, `texto-secundario`, `texto-terciario` y `enlace` sobre `fondo`, `superficie`, `superficie-elevada` y `superficie-hundida` | 4,5:1 | 1.4.3 |
| `texto-sobre-accion` sobre `accion`, `accion-hover` y `accion-presionada`; `texto` sobre `accion-secundaria`; `texto-sobre-peligro` sobre `peligro` | 4,5:1 | 1.4.3 |
| Cada `<estado>-texto` sobre su `<estado>-fondo`, `fondo`, `superficie` y `superficie-elevada` | 4,5:1 | 1.4.3 |
| `borde-control` sobre `fondo`, `superficie` y `superficie-hundida`; `foco`, `accion` y `peligro` sobre `fondo`, `superficie` y `superficie-elevada`; cada `<estado>-borde` sobre su fondo, `superficie` y `fondo` | 3:1 | 1.4.11 |
| **[R3]** Cada `grafico-serie-n` y `grafico-referencia` sobre `fondo`, `superficie` y `superficie-elevada`; `marca` sobre `fondo` y `superficie` | 3:1 | 1.4.11 |
| **[R3]** `texto-sobre-marca` sobre `marca` | 4,5:1 | 1.4.3 |

Resultado con los valores provisionales: **224 pares (112 por tema), 0 fallos** (V5-23 [R3]; antes de [R3], 164). Peor caso de las series: 4,72:1 en claro y 5,62:1 en oscuro. `texto-deshabilitado` queda en 2,56:1 (claro) y 2,29:1 (oscuro), permitido solo en controles deshabilitados; L15 (10.9) impide usarlo en otro lugar.

### 10.3 Estados financieros e indicadores (FE-41)

**Un estado por situación, calculado con datos del DTO** (nunca con aritmética de montos). Las funciones son puras y viven en `componentes/dominio/estados.ts`; cada componente de dominio llama a la suya.

| Situación | Fuente en el DTO | Estado | Etiqueta del indicador (§12) |
|---|---|---|---|
| Disponible > 0 | `disponible > 0` (comparación con cero, PF-3) | `positivo` | — (sin indicador; el número ya lo dice) |
| Disponible = 0 | `disponible === 0` | `cero` | — |
| Sobregiro con débito o efectivo | `sobregiro.tipo = 'debito'` | `problema` | "Sobregiro con débito o efectivo" |
| Sobregiro con tarjeta | `sobregiro.tipo = 'tarjeta'` | `deuda-sin-respaldo` | "Deuda sin reservar" |
| Sobregiro mixto | `sobregiro.tipo = 'mixto'` | Los dos indicadores, en ese orden | Las dos etiquetas |
| Meta con faltante o sin fondos | `meta.estado` con faltante o en curso con `falta > 0`, o `clasificacion = 'sin_fondos'` | `advertencia` | "Falta para la meta" |
| Meta vencida | `meta.estado` vencida (AV-17) | `advertencia` | "Meta vencida" |
| Meta cubierta, cumplida o completada | `meta.estado` | `positivo` | "Meta cubierta", "Meta cumplida" o "Meta completada" |
| Te falta reservar en una tarjeta | `faltaReservar > 0` (S(t)) | `deuda-sin-respaldo` | "Te falta reservar" |
| Deuda de tarjeta reservada | `deuda > 0` y `faltaReservar === 0` | `deuda` | "Deuda de tarjeta" |
| Pago excedente | `pagoExcedente !== null` | `problema` | "Pago excedente" |
| Reserva excedente | `reservaExcedente > 0` | `informacion` | "Reserva excedente" |
| Listo para asignar negativo | `lpaNegativo` (AV-20) | `problema` | "Asignaste más de lo que tenés" |
| En camino | `enCamino > 0` (AV-09) | `informacion` | "En camino" |
| Diferencia de conciliación | `ultimaConciliacion.diferenciaActual !== 0` (AV-21) | `advertencia` | "Diferencia con el estado de cuenta" |

- Las comparaciones con cero de un `Centavos` del DTO no son aritmética (PF-3).
- Las etiquetas exactas van en `textos/estados.ts` (§12); esta tabla fija qué estado corresponde a cada situación y cuál es el término.
- **El estado nunca se transmite solo por color (PF-2, WCAG 1.4.1).** Todo estado con etiqueta se muestra con `IndicadorEstado`, que combina tres señales:
  1. **color** del estado (`-texto`, `-fondo`, `-borde`);
  2. **forma**: un glifo distinto por estado, que se distingue en escala de grises y en `forced-colors` [Diseño: los glifos; los del prototipo son provisionales];
  3. **nombre accesible**: la etiqueta, visible o solo para lectores de pantalla según la pantalla (con `visible = false` el glifo debe distinguirse sin color).
- Por PF-2, en las filas de Presupuesto el indicador del sobregiro va **sin montos**; el desglose (`parteTarjeta`, `parteDebito`) aparece al tocar la fila o el indicador, en el detalle.

**Justificación de FE-41.** Una tabla única evita que cada pantalla elija su color para la misma situación (el "error 11" de 04 aplicado a la presentación), y la triple señal cumple PF-2 en cualquier identidad visual. *Alternativas descartadas:* un estado por pantalla (inconsistente); patrones o texturas de fondo en lugar de glifos (se pierden en filas pequeñas y con `forced-colors`).

### 10.4 Tipografía (FE-42)

**Roles abstractos.** Los componentes usan roles, nunca tamaños; el diseño fija fuente, tamaño, interlineado y peso de cada rol.

| Rol | Uso | Utilidad | [Provisional] tamaño / interlineado / peso |
|---|---|---|---|
| `cifra-principal` | El número principal de una pantalla (Listo para asignar, saldo de la cuenta abierta) | `text-cifra-principal` | 2rem / 1,15 / 600 |
| `cifra` | Montos destacados en tarjetas y filas | `text-cifra` | 1.125rem / 1,3 / 600 |
| `titulo-pantalla` | `h1` de cada pantalla | `text-titulo-pantalla` | 1.5rem / 1,25 / 600 |
| `titulo-seccion` | `h2` y nombres de grupo | `text-titulo-seccion` | 1.125rem / 1,35 / 600 |
| `cuerpo` | Texto general, campos y botones | `text-cuerpo` | 1rem / 1,5 / 400 |
| `cuerpo-pequeno` | Metadatos de filas | `text-cuerpo-pequeno` | 0.875rem / 1,45 / 400 |
| `etiqueta` | Etiquetas de campos e indicadores | `text-etiqueta` | 0.875rem / 1,35 / 500 |

Reglas que no dependen del diseño:
- **Cifras tabulares obligatorias** en todo `Monto` y en toda columna numérica (`font-variant-numeric: tabular-nums`). Lo aplica `Monto`; una tabla de montos lo aplica en la columna.
- **Unidades en `rem`**, para que el texto crezca con el tamaño de letra del sistema (WCAG 1.4.4). Ningún tamaño de texto en `px`.
- Los campos usan el rol `cuerpo` con **16 px como mínimo** en el teléfono, para que Safari en iOS no amplíe la página al enfocarlos.
- **Fuente:** la del sistema (`system-ui`) hasta que el diseño elija; si elige fuentes propias, se cargan con `next/font` (autohospedadas, `display: swap`) y una de ellas debe tener cifras tabulares (PF-1).

**[F6]** **CF-12.** Los roles se generan como `@utility text-<rol>` desde `tokens.json` (`tipografia`: fuente, tamaño, interlineado, peso, `font-stretch`, cifras tabulares y mayúsculas), con los nombres de esta tabla más el rol nuevo `rotulo` (`text-rotulo`: encabezados de tabla y de bloque). Las clases `.t-*` de `tokens.css` no se copian. Los valores provisionales de la tabla quedan reemplazados por los de `tokens.json` (06-identidad-visual). La regla de movimiento reducido queda solo en `globals.css` (11.6). Fuentes: Big Shoulders Display (títulos, nunca montos) y Archivo (cuerpo y montos), autohospedadas.

**Justificación de FE-42.** Los roles permiten que Claude Design cambie la escala completa sin tocar componentes. *Alternativa descartada:* la escala numérica de Tailwind (`text-sm`, `text-2xl`) en los componentes (ata cada componente a un tamaño concreto).

### 10.5 Espaciado, radios, elevación, movimiento y capas

**[F6]** **CF-11.** Los nombres de los tokens son los de `tokens.css` sin prefijo; los radios nuevos (`radio-superpuesto`, `radio-identidad`, `radio-tarjeta`), la escala `espacio-1` a `espacio-16`, las duraciones y curvas nuevas son los de la entrega del diseño.

| Familia | Tokens | [Provisional] | Regla fija |
|---|---|---|---|
| Espaciado | `--spacing` de Tailwind (múltiplos) | 0.25rem (4 px) | Solo múltiplos de la escala (L14) |
| Radios | `radio-control`, `radio-contenedor`, `radio-pastilla` | 0.375rem, 0.75rem, 9999px | — |
| Elevación | `elevacion-1` (filas y tarjetas), `elevacion-2` (menús), `elevacion-3` (superpuestos) | Sombras grises suaves | La elevación nunca es la única señal de que algo se superpone: el superpuesto también tiene `velo` y rol `dialog` |
| Movimiento | `duracion-rapida`, `duracion-normal`, `duracion-lenta`; `curva-estandar` | 120 ms, 200 ms, 300 ms; `cubic-bezier(.2,0,0,1)` | Ninguna animación transmite información por sí sola. Con `prefers-reduced-motion: reduce`, todas las duraciones pasan a casi cero (V5-27b) |
| Capas | `capa-marco`, `capa-superpuesto`, `capa-aviso` | 10, 40, 50 | Un aviso global nunca tapa el control enfocado (WCAG 2.4.11, §11) |
| Tamaño táctil | `tactil-minimo` | 2.75rem (44 px) | Ver 11.5 |

### 10.6 Temas claro y oscuro

- **next-themes** con `attribute="data-theme"` y `value={ light: 'claro', dark: 'oscuro' }` (**[F6]** CF-10; antes `attribute="class"` y la clase `.dark`), `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange` y `storageKey="finn-tema"`. `<html>` lleva `suppressHydrationWarning` (next-themes cambia la clase antes de hidratar).
- El selector está en `/ajustes/apariencia` (§2): Sistema, Claro y Oscuro. Se guarda por dispositivo y no escribe en el servidor.
- Cada tema define `color-scheme` (`light` o `dark`), para que los controles nativos (selector de fecha, barras de desplazamiento) sigan el tema.
- `<meta name="theme-color">` con los dos valores de `fondo` por `media="(prefers-color-scheme: …)"`; next-themes no cambia esa etiqueta, así que con un tema forzado distinto del sistema puede no coincidir. Se acepta: es decorativo.
- **Los dos temas cumplen los mismos contrastes** (10.2) y las pruebas de accesibilidad corren en ambos (§14).

### 10.7 Componentes base (FE-43)

**Tres capas.**
1. `components/ui/`: el código que genera shadcn (Radix debajo), sin cambios a mano salvo los tokens. No se importa desde las pantallas.
2. `componentes/base/`: envoltorios con la API de Finn, que fijan las variantes, los tokens y los requisitos de accesibilidad. **Es lo que usan las pantallas.**
3. `componentes/dominio/`, `componentes/formularios/`, `componentes/graficos/`, `componentes/navegacion/` y `componentes/marco/`: componentes de Finn construidos con la capa 2.

Regla L16: fuera de `componentes/base/`, nadie importa de `components/ui/` ni de `@radix-ui/*`.

| Componente | Props principales | Estados que debe mostrar | Requisitos fijos |
|---|---|---|---|
| `Boton` | `variante: 'principal' \| 'secundaria' \| 'peligro' \| 'discreta'`; `tipo`; `deshabilitado`; `motivoDeshabilitado?: string`; `enviando?: boolean`; `textoEnviando?: string` | normal, hover, presionado, foco visible, deshabilitado, enviando | `<button>` nativo. Deshabilitado con motivo: el motivo se ve en texto y se asocia con `aria-describedby` (7.7). Enviando: `aria-disabled="true"` (no `disabled`, para no perder el foco, 4.3) y el texto de enviando. Tamaño mínimo 11.5 |
| `Campo` | `etiqueta`, `descripcion?`, `error?`, `requerido?`, `children` (el control) | normal, foco, error, deshabilitado, solo lectura | Genera los ids: `<label for>`, `aria-describedby` (descripción y error), `aria-invalid` con error. "Opcional" escrito en la etiqueta de los campos no requeridos |
| `EntradaTexto` | Las de `<input>`, más las de `Campo` | ídem | La etiqueta nunca es el `placeholder` |
| `Seleccion` | `opciones: { valor; etiqueta; descripcion? }[]`, `valor`, `alCambiar` | normal, abierta, foco, error, deshabilitada | Con hasta unas 7 opciones, el diseño puede usar opciones visibles (`radio`); con más, una lista desplegable |
| `Buscador` | `buscar: (texto) => Promise<Opcion[]>` (lectura interactiva, 4.12), `valor`, `alCambiar` | vacío, buscando, con resultados, sin resultados, error | Patrón *combobox* de ARIA; anuncia la cantidad de resultados en una región `status` |
| `Casilla`, `Interruptor`, `Opciones` | Las del control nativo o de Radix, más las de `Campo` | marcado, desmarcado, mixto (solo casilla), foco, deshabilitado | El nombre accesible es la etiqueta; el interruptor anuncia su estado |
| `Pestanas` | `pestanas: { id; etiqueta; href? }[]`, `activa` | activa, inactiva, foco | Si el contenido depende de la URL (filtros, vistas), son **enlaces** con `aria-current`, no pestañas de ARIA |
| `Superpuesto` (1.4; **[F6]** CF-23: variante `desde: 'abajo' \| 'lado' \| 'arriba'`, la de arriba para `/notificaciones`) | `titulo`, `descripcion?`, `alCerrar` (`cerrarFlujo`), `children`, `acciones` | abierto, cargando, error | Rol `dialog` con `aria-modal="true"` y nombre = título; foco atrapado; Escape cierra; al cerrar, el foco vuelve al disparador (11.2). La forma (hoja inferior, diálogo central, panel lateral) es del diseño |
| `PaginaFlujo` (1.4) | Las mismas | ídem | Página completa: `main` con `h1` = título; sin foco atrapado |
| `Menu` | `elementos: { etiqueta; alSeleccionar \| href; peligro? }[]`, `etiquetaDisparador` | cerrado, abierto, elemento activo | Patrón *menu button* de ARIA. Nunca es la única vía a una acción frecuente |
| `AvisoEnLinea` | `estado: EstadoFinanciero`, `titulo?`, `children`, `accion?` | — | `role="status"` si aparece después de cargar la pantalla; sin rol si viene con ella. Lleva `IndicadorEstado` |
| `Resultado` (4.13, 4.14) | `texto`, `salida?: { etiqueta; ejecutar }`, `enlace?` | — | Queda en el lugar del elemento afectado; se anuncia por la región del marco (11.3); **sin tiempo límite** (4.14 regla 3). No se usa un *toast* que desaparece |
| `Insignia` | `cantidad: number \| null`, `etiqueta` | sin dato, cero, con cantidad | Solo visual (`aria-hidden`): la cantidad va en el nombre del enlace al que acompaña (3.3) |
| `Esqueleto` | `forma` | — | `aria-hidden`; la región que carga lleva `aria-busy` (7.1). Sin animación con movimiento reducido |

**Justificación de FE-43.** Con una capa propia entre shadcn y las pantallas, los requisitos de accesibilidad y las variantes viven en un lugar, y Claude Design puede reestilizar o cambiar una primitiva sin tocar las pantallas. *Alternativas descartadas:* usar `components/ui/` directamente en las pantallas (cada pantalla tendría que recordar los requisitos); escribir todas las primitivas a mano (más código y menos probado que Radix en accesibilidad de teclado).

### 10.8 Componentes de dominio

Viven en `componentes/dominio/`, salvo que se indique. Son **Server Components** salvo que necesiten estado o eventos (lo marca la columna "Cliente"). Reciben fragmentos del DTO de 04 sin transformarlos; todo número sale del DTO y pasa por el módulo de formato (5.4).

| Componente | Props | Cliente | Estados y variantes | Requisitos |
|---|---|---|---|---|
| `Monto` (FE-45) | `centavos: Centavos`; `rol?: 'cifra-principal' \| 'cifra' \| 'cuerpo'`; `estado?: EstadoFinanciero`; `presentacion?: 'con-signo' \| 'absoluto'` | No | Negativo, cero, positivo; con estado (color del estado, sin indicador propio) | Texto visible `formatearMonto` y texto accesible explícito ("menos $1,234.50", V5-25), porque algunos lectores no leen el guion como "menos". Cifras tabulares, sin cortes de línea. Expone `data-centavos` para las pruebas (§14) |
| `IndicadorEstado` | `estado`, `etiqueta`, `visible?: boolean` | No | Uno por estado de 10.3 | 10.3. El glifo es `aria-hidden`; el nombre es la etiqueta |
| `FilaCategoria` | `fila: FilaCategoria` (04 6.2), `periodo: PeriodoDto`, `hrefDetalle`, `hrefAsignar?` | No | Normal; sobregirada (débito, tarjeta o mixta); con meta (advertencia, cubierta, vencida); período cerrado (sin `hrefAsignar`, 7.7) | Nombre de la categoría como enlace al detalle; Asignado, Gastado y Disponible etiquetados (en una tabla, por encabezado de columna); Disponible con `Monto` y el estado de 10.3; indicadores de sobregiro sin montos (PF-2) |
| `FilaPagoTarjeta` | `fila: FilaPagoTarjeta` (04 6.2), `periodo`, `hrefDetalle` | No | Con falta de reserva, con reserva excedente, con pago excedente, al día | El número principal es `faltaReservar` con la etiqueta "Te falta reservar" (F4); los demás avisos con su indicador |
| `ResumenListoParaAsignar` (**[F6]** CF-13: variantes `billete` y `franja`, 10.8.1) | `{ lpa, enCamino, lpaNegativo }` de `InicioDto` o `PresupuestoDto` | No | Positivo, cero, negativo (AV-20), con "en camino" (AV-09) | `Monto` con rol `cifra-principal`; enlace a `/presupuesto/listo-para-asignar` |
| `TarjetaCredito` | Un elemento de `CuentasDto.tarjetas` | No | Te falta reservar, deuda reservada, saldo a favor, sin deuda | Deuda, "Te falta reservar", uso del límite (`BarraProgreso` con `usoLimite`), próximos corte y pago, "para no generar intereses" |
| `FilaCuenta` | Un elemento de `CuentasDto.efectivo`, `prestamos` o `inversiones` | No | Con diferencia de conciliación (AV-21), archivada | Saldo y saldo confirmado, cada uno etiquetado |
| `BarraProgreso` | `puntosBasicos: number` (de 04), `etiqueta`, `estado` | No | 0, parcial, completo; con estado | `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow` = `puntosBasicos / 100` (conversión de unidad de un porcentaje del servidor, no aritmética de montos) y `aria-valuetext` con `formatearPorcentaje`. El progreso no se calcula en el cliente |
| `ResumenMeta` | `meta` de `FilaCategoria` o de `MetasDto` | No | Por estado de meta (10.3); vencida | Pedido y Falta con `Monto`; `BarraProgreso` solo si el DTO trae `progreso` (metas de ahorro, 04 6.10) |
| `Aviso` | `aviso: AvisoEstadoDto` | Sí, si tiene `accion` | Sin acción; con propuesta (CP-8, acción de un toque con su `Resultado`, 4.14) | El texto es el del servidor (voseo, 04 7.10); el estado sale de la tabla de 10.3 según `aviso.aviso` |
| `FilaTransaccion` | `fila: TransaccionFila` (04 6.7.1), `hrefDetalle` (con `?volver=`, 3.3) | No | Por tipo; con marcas (`porCobrar`, `conDevoluciones`, `conciliada`, `programada`, `periodoCerrado`); estado bancario | `montoPresentado` con `Monto`; cada marca como icono con nombre accesible, nunca solo icono; en Actividad, agrupadas por día con un encabezado por fecha |
| `MovimientoBandeja` (**[F6]** CF-22: asa de arrastre si `aprobacion.arrastrable`) | `movimiento: MovimientoDto` (04 6.8) | Sí (acciones de un toque) | Por `estado`; con coincidencia; posible duplicado; no reconocido; error; aprobable con un toque (4.15); con `faltantes` | Lo que falta se dice en texto ("Falta la categoría"); las acciones de un toque con `Resultado` en el lugar de la fila (4.14, 4.15) |
| `SelectorPeriodo` (`componentes/navegacion/`) | 3.4 | No | Activo, cerrado, futuro, transición | 3.4; el estado del período en texto (N3) |
| `ConfirmacionImpacto` (`componentes/formularios/`) | La previsualización de 4.4 | Sí | Con y sin avisos "antes" | Recibe el foco al aparecer (su título); lista el impacto con `Monto`; "Confirmar" y "Volver a editar" |
| `CampoLineas` (`componentes/formularios/`) | `useFieldArray` de las líneas (4.2) | Sí | 1 línea, varias, con error de suma | Agregar o quitar una línea anuncia la cantidad; la diferencia de la suma la muestra el servidor (PF-3) o la ayuda visual de PF-3 |
| `GraficoBarras`, `GraficoLineas` (`componentes/graficos/`, FE-44) | `titulo`, `series: { nombre; puntos }[]` del DTO de reportes, `referencia?: { nombre; puntos }` (lo asignado en el gasto semanal, `referencia` de 04 6.9.3), `resumen` | No | Con datos, vacío, un solo punto; con y sin referencia; semanas futuras (`futura`, sin gasto: se distinguen sin color, por ejemplo sin barra y con su etiqueta) | SVG `role="img"` con nombre (título y dato principal) y **tabla equivalente** con los mismos datos (P5-13, V5-25); series con `grafico-serie-n` y referencia con `grafico-referencia` (10.2) **[R3]**; el tamaño se adapta al contenedor con `viewBox` |
| `GraficoDona` **[R3]** (`componentes/graficos/`) | `titulo`, `porciones: { categoria: Ref; gastado: Centavos; porcentaje: number }[]` (reporte `categorias`, 04 6.9.2), `aparte?: { categoria; gastado }[]` (`conDevolucionNeta`) | No | Con datos, una sola porción, sin datos, con "Otras" (más de 8 categorías) | Las mismas reglas que las barras; cada porción con su etiqueta directa o en la leyenda en el mismo orden, y la tabla con categoría, monto y porcentaje (`formatearPorcentaje`). El ángulo de cada porción lo calcula d3-shape en el servidor con los `porcentaje` del DTO; el cliente no divide montos |
| `EstadoVacio` (7.2) | `clase: 'primer-uso' \| 'vacio' \| 'sin-resultados'`, `texto`, `accion?` | No | Las tres clases | El texto dice qué hacer |
| `ErrorPantalla` (7.3) | `digest`, `reintentar` | Sí | En la página y en el superpuesto | La referencia se puede seleccionar y copiar |

#### 10.8.1 Componentes visuales de la identidad **[F6]** (CF-13, CF-22; 06 §5.4)

Reciben fragmentos de DTO sin transformarlos; ninguno calcula montos ni proporciones (ADR-07, PF-3). Los campos marcados *(CF-25)* son los de 04 (CF-25, aplicado): el componente dibuja esos puntos básicos tal cual, y un valor nulo no se dibuja.

| Componente | Props | Cliente | Datos | Estados |
|---|---|---|---|---|
| `ResumenListoParaAsignar` | `{ lpa, enCamino, lpaNegativo, variante: 'billete' \| 'franja', accion?: { href; texto } }` | No | `InicioDto`, `PresupuestoDto` | Positivo, cero ("Todo asignado"), negativo; con "En camino" (sin nombre de deudor) |
| `BarraGastado` | `{ barra }` *(CF-25)* | No | `FilaCategoria.barra` | Dentro de lo asignado; sobregiro con débito, con tarjeta (rayado `patron-sin-reservar`) o mixto; con meta |
| `BilleteraTarjetas` | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | 04 6.5; `usoSinReservarBp` *(CF-25)*: nulo sin límite, tope 10.000 | Te falta reservar, deuda reservada, saldo a favor, sin deuda. Caras decorativas por orden; con teclado, cada cara es un botón |
| `IdentidadCuenta` | `{ tipo: 'efectivo' \| 'prestamo' \| 'inversion' \| 'archivada'; fila }` (la fila de `CuentasDto` de su tipo) | No | 04 6.5 | Una identidad para toda cuenta de efectivo; con diferencia de conciliación (AV-21); préstamo con talón de `proximaCuota` o "Sin modelo"; archivada |
| `PosicionNeta` | `{ posicion: CuentasDto['posicionNeta'] }` | No | 04 6.5; `barras: { activosBp; deudasBp }` *(CF-25)*, escala relativa al mayor | La mayor al 100 %; deudas rayadas para distinguirlas sin color |
| `SelectorVista` | `{ vista: 'grafico' \| 'tabla'; alCambiar }` | Sí | — | `role="radiogroup"`; estado local, no cambia la URL |
| `GraficoAcumulado` (`componentes/graficos/`) | `{ semanas; asignado; resumen }` | No | 04 6.9.3 | Con semanas futuras; asignado negativo (sin referencia) |
| `GraficoRango` (`componentes/graficos/`) | `{ semanas; resumen }` | No | 04 6.9.3 | Categoría nueva: sin rango |
| `CalendarioPeriodo` | `{ periodo; dias; hoy }` | Sí (filtrar por día) | `detalleCategoria().calendario`; intensidad *(CF-25)* | Días futuros, hoy, sin gasto |
| `PanelDestinosArrastre` | `{ sugerida?: Ref; frecuentes: Ref[]; grupos?: { grupo: Ref; categorias: Ref[] }[]; variante: 'telefono' \| 'lateral' }` | Sí (con `import()`) | `bandeja().destinosArrastre` (CF-22) | Teléfono: sugerida, frecuentes, "Otra categoría…"; lateral: además todas por grupo. Destinos de 44 px; todos visibles sin desplazar en el teléfono |

Requisitos comunes: tres señales en todo estado (10.3); tocables de 44 × 44; movimiento reducido sin animación; los tokens decorativos (`cuenta-*`, `tarjeta-*`, `marca-grabado`) nunca llevan información. Los hallazgos de los reportes nuevos (CF-04) usan `Aviso` y los componentes de gráficos existentes.

**[F6] `Monto` (CF-15).** El texto visible lleva U+2212; el accesible sigue siendo "menos $X".

**`Monto` (FE-45).** Es el único componente que muestra un monto. La salida accesible "menos $X" se arma en el módulo de formato (`formatearMontoAccesible`, función nueva del módulo de 5.4) para que el servidor (mensajes de 04 7.10) y el cliente lean igual. *Alternativas descartadas:* dejar que el lector lea "-$45.00" (NVDA y VoiceOver leen el guion de forma distinta según la configuración de puntuación); `aria-label` sobre un `<span>` sin rol (los lectores lo ignoran en elementos genéricos: por eso el prototipo usa un texto oculto y el visible con `aria-hidden`, V5-25).

**Gráficos en el servidor (FE-44).** V5-20 midió en la compilación real: el gráfico como Server Component no agrega JS al cliente (132,4 KiB en total, menos que `/base`, que incluye `EnlaceFinn`); el mismo gráfico en un Client Component agrega 9,3 KiB por `d3-scale` y el formato. Por eso las escalas de d3 se ejecutan solo en el servidor y el cliente recibe SVG. Si un reporte necesita interacción (por ejemplo, resaltar un punto), la isla de cliente recibe las posiciones ya calculadas y no importa d3. *Alternativa descartada:* gráficos en el cliente (más JS en Reportes, la pantalla con el presupuesto más alto, sin ganancia: la tabla equivalente ya da el detalle).

### 10.9 Estados de interacción comunes

| Estado | Señal mínima, en cualquier diseño | Tokens |
|---|---|---|
| Foco visible | Anillo de al menos 2 px con contraste 3:1 contra el fondo, en `:focus-visible`; nunca se quita sin reemplazo (WCAG 2.4.7 y 2.4.13 como buena práctica) | `foco` |
| Hover | Cambio de fondo o subrayado; nunca la única señal de que algo es interactivo | `accion-hover`, `superficie-hundida` |
| Presionado | Cambio de fondo | `accion-presionada` |
| Deshabilitado | Atenuado **y** motivo en texto (7.7) | `texto-deshabilitado`, `superficie-hundida` |
| Enviando | Texto de enviando y `aria-disabled`; el foco queda en el control | — |
| Error | Borde o fondo de `problema`, **y** mensaje en texto asociado al campo, **y** `aria-invalid` | `problema-*` |
| Actual o seleccionado | `aria-current` o `aria-selected` y una señal visual que no sea solo color (peso, borde, marca) | — |
| Pendiente de navegación (FE-39) | `aria-busy` en el enlace y el indicador global del marco. Además, todo enlace y botón tiene un estado **presionado solo con CSS** (`:active`), que se ve aunque la página todavía no esté hidratada (V5-21b) | — |

Regla L15: `text-texto-deshabilitado` solo puede aparecer junto con `disabled` o `aria-disabled` en el mismo elemento (ESLint sobre JSX).

### 10.10 Qué puede cambiar y agregar Claude Design **[R3]**

| Puede cambiar | Puede agregar **[R3]** | No puede cambiar ni quitar (lo usan el código y las pruebas) |
|---|---|---|
| Los valores de `tokens.css`, los glifos de los estados, las fuentes, los valores de los roles tipográficos, radios, sombras y duraciones | **Tokens, roles tipográficos y variantes nuevos** que la identidad necesite (por ejemplo, un tono de superficie más, un rol `cifra-gigante`, una variante de `Boton`) | Los **nombres** de los tokens, roles, estados y variantes existentes: no se renombran ni se quitan |
| La forma de la navegación (barra, cajón, menú lateral) y de los contenedores (hoja, diálogo, panel) | Componentes visuales propios dentro de `componentes/base/` y `componentes/dominio/` (por ejemplo, una ilustración de estado vacío) | Las rutas, la jerarquía y los requisitos N1 a N8 (§3) |
| La disposición de cada pantalla | Recursos de marca (10.11) | Las props de los componentes, sus nombres accesibles, sus roles y los atributos `data-*` de §14 |
| — | — | Los requisitos de 10.2 (contraste), 10.3 (triple señal), 10.9 y §11 |

**Condiciones para agregar [R3]:**
1. Todo token nuevo entra en `tokens.json` con valor para los dos temas y en `tokens.css`, y lo expone `@theme inline` (10.1).
2. Todo token nuevo de color que se use para texto, borde de control, foco o gráfico tiene su regla en `scripts/contraste.py` con el mínimo que le corresponde (10.2); uno decorativo se declara exento en el mismo script, con su motivo.
3. Un rol tipográfico nuevo cumple 10.4 (`rem`, cifras tabulares si muestra montos).
4. Una variante nueva de un componente cumple los requisitos fijos de su fila en 10.7 o 10.8.
5. Lo agregado se lista en el `LEEME` de la entrega del diseño, con su uso.

**Entrega del diseño:** `tokens.css` y `tokens.json` (con los tokens agregados), las reglas nuevas de `contraste.py`, la configuración de `next/font` si elige fuentes, los estilos de los componentes de `componentes/base/` y `componentes/dominio/`, y los recursos de 10.11. Todo pasa `contraste.py` y las pruebas de accesibilidad de 11.10 antes de integrarse.

### 10.11 Recursos de marca **[R3]**

El logotipo y el símbolo de Finn son recursos que **entrega el diseño**; esta fase solo fija dónde van y en qué formato.

| Recurso | Archivo en `apps/web/public/marca/` | Dónde se usa |
|---|---|---|
| Símbolo | `simbolo.svg` (un color, con `currentColor`) | Pantalla de ingreso (§9), `/sin-conexion` (§8), marco si el diseño lo pone. Como imagen decorativa (`alt=""`) junto al nombre "Finn" en texto, o con `alt="Finn"` si va solo |
| Logotipo | `logotipo.svg` (opcional) | Ingreso, si el diseño lo usa en lugar de símbolo y texto |
| Ícono de la app | `icono-192.png`, `icono-512.png` (`purpose: any`) | Manifiesto (§8.2), pantalla de inicio del teléfono |
| Ícono adaptable | `icono-maskable-512.png` (`purpose: maskable`, con el símbolo dentro del 80 % central) | Manifiesto: Android recorta el ícono a su forma |
| Ícono de Apple | `apple-touch-icon.png` (180 × 180, sin transparencia) | `metadata.icons.apple` |
| Favicon | `app/icon.svg` y `app/favicon.ico` (convención de archivos de Next) | Pestaña del navegador |
| Insignia de notificación | `insignia-96.png` (silueta blanca sobre transparente) | `badge` de las notificaciones push (§8.6): Android la muestra monocroma en la barra de estado |

- Mientras el diseño no entrega, se usan **recursos provisionales neutros** (un cuadrado del color `accion` con la letra F), marcados como tales en el `LEEME`.
- Los colores de los íconos (que no pueden usar variables CSS) se registran en `tokens.json` como `marca-icono-fondo` y `marca-icono-figura` [Diseño] y alimentan también `background_color` y `theme_color` del manifiesto (§8.2).

---

## 11. Accesibilidad (WCAG 2.2 AA)

**Objetivo (FE-46):** toda pantalla de §2 cumple WCAG 2.2 nivel AA en los dos temas, en teléfono y en computadora. Se comprueba de forma automática en cada PR (11.10) y a mano con lectores de pantalla antes de cada entrega de la Fase 8. Lo que la herramienta automática no puede comprobar lo fijan los requisitos de esta sección como contrato.

### 11.1 Estructura de cada pantalla

- `<html lang="es">`. Un texto en otro idioma dentro de la interfaz (el texto original de un SMS, un comercio) no lleva `lang` propio: son datos del usuario, sin idioma conocido.
- **Título del documento único** por pantalla: "{Pantalla} · Finn", con el dato que la distingue cuando existe ("Supermercado · Presupuesto · Finn"). Lo fija `generateMetadata` de cada página con textos de §12. El anunciador de rutas de Next lee ese título en cada navegación del cliente (V5-28).
- **Regiones:** el marco tiene un `header` (si el diseño lo usa), la `nav` de 3.3 y un `main` con `id="contenido"`. Un enlace "Saltar al contenido" es el primer elemento enfocable (WCAG 2.4.1) y se hace visible al enfocarlo.
- **Encabezados:** un `h1` por pantalla (en un superpuesto, el título del diálogo); `h2` por bloque (grupos de Presupuesto, días de Actividad, secciones de Inicio); sin saltos de nivel.
- **Listas y tablas:** las filas de categorías se presentan como una tabla con encabezados de columna (Asignado, Gastado, Disponible) o como una lista donde cada número tiene su etiqueta visible o accesible; el diseño elige, pero cada número debe poder leerse con su nombre. Las listas de transacciones y de movimientos son `ul`/`ol` con un elemento por fila.

### 11.2 Teclado y foco

| Situación | Comportamiento |
|---|---|
| Orden | El orden del foco sigue el orden visual y el de lectura (2.4.3). Sin `tabindex` positivos (L17, `jsx-a11y/tabindex-no-positive`) |
| Navegación entre pantallas | V5-28 midió en Next 16.4.1 que, tras navegar con un enlace, el foco queda en `body` y el anunciador de rutas lee el título del documento (o, si el título no cambió, el `h1`). Es el mismo punto de partida que una carga completa: el siguiente Tab llega a "Saltar al contenido". La página no mueve el foco por su cuenta, salvo al abrir un flujo. Por eso cada página tiene un título único (11.1) |
| Abrir un flujo superpuesto | El foco va al título del `Superpuesto` (o al primer campo si el flujo es solo un formulario corto) y queda atrapado dentro |
| Abrir un flujo de pantalla completa | El foco va al `h1` (`tabIndex={-1}`) |
| Cerrar un flujo (`cerrarFlujo`, Escape o "atrás") | El foco vuelve al control que lo abrió. Si ese control ya no existe (la fila salió de la lista), va al `h1` de la pantalla |
| Error al enviar | El foco va al primer campo con error; si el error es del formulario (no de un campo), al mensaje, que tiene `tabIndex={-1}` |
| `REQUIERE_CONFIRMACION` | El foco va al título de `ConfirmacionImpacto` |
| Acción de un toque | El foco queda en el lugar: si la fila desaparece, va al `Resultado` que la reemplaza (4.14) |
| Foco no tapado (2.4.11) | Un marco fijo (barra superior o inferior) no puede tapar el elemento enfocado: `scroll-padding` del documento igual a la altura del marco fijo, y los avisos globales no se superponen al contenido enfocado |
| Atajos de teclado | No hay atajos de una sola tecla (2.1.4) |

Ninguna acción depende del gesto de arrastrar (WCAG 2.5.7): el orden de la estructura se cambia con "Subir" y "Bajar" (OP-08, 4.14) y cualquier gesto de deslizar una fila que agregue el diseño tiene un botón equivalente.

### 11.3 Lectores de pantalla

**[F6]** **CF-19.** El avance de la plantilla ("Creando tu plantilla: {k} de {n}…") se anuncia en la región `status` del marco. **CF-21:** los anuncios del arrastre (tomar, mover sobre un destino, soltar, cancelar) van en voseo en la región de estado de la librería.

**Montos.** `Monto` expone el texto accesible explícito ("menos $1,234.50"); V5-25 comprobó que el árbol de accesibilidad de Chromium contiene "Disponible: menos $1,234.50" y que el texto visible queda fuera del árbol. El nombre de una fila incluye el nombre del dato ("Disponible, menos $45.00"), no solo el número.

**Estados.** Cada `IndicadorEstado` aporta su etiqueta al texto de la fila ("Supermercado, Disponible menos $45.00, Sobregiro con débito o efectivo"). El color y el glifo son `aria-hidden`.

**Gráficos.** El SVG tiene `role="img"` y un nombre con el título y el dato principal; la tabla equivalente sigue al gráfico, con `caption` y encabezados de fila y columna (V5-25). La tabla puede estar oculta a la vista detrás de "Ver datos" [Diseño], pero nunca fuera del árbol de accesibilidad.

**Regiones en vivo** (en `componentes/marco/`, una de cada tipo):

| Región | Rol | Qué anuncia |
|---|---|---|
| `AnunciosMarco` | `status` (cortés) | El `Resultado` de una acción ("Aprobado: SUPER SELECTOS · $45.00…"), "Guardado", el cambio de conexión ("Estás sin conexión", "Volviste a estar en línea"), "Cargando {pantalla}" (7.1) |
| `AlertasMarco` | `alert` (inmediata) | Solo lo que bloquea: sesión vencida antes de redirigir, "Hay una versión nueva" (FE-13), un error de envío sin campo asociado |

- Los componentes no crean sus propias regiones: llaman a `anunciar(texto, 'cortes' | 'inmediato')` del marco. Así no se pisan dos anuncios a la vez.
- Los contadores (bandeja, notificaciones) **no** se anuncian cuando cambian; están en el nombre del enlace (3.3).

**Nombres de controles.** Todo botón con solo un icono tiene nombre (`aria-label` desde §12); las acciones repetidas por fila incluyen el elemento en el nombre ("Asignar a Supermercado", "Descartar SUPER SELECTOS $45.00"), para que la lista de controles del lector sea comprensible fuera de contexto.

### 11.4 Formularios

- Cada control tiene etiqueta visible asociada (`Campo`, 10.7). El `placeholder` no reemplaza la etiqueta.
- Los campos obligatorios se marcan en texto; los opcionales dicen "Opcional".
- Errores (WCAG 3.3.1 y 3.3.3): mensaje en texto junto al campo, asociado con `aria-describedby`, con `aria-invalid`; dice cómo corregirlo (los mensajes de §12 y de 04 7.10 ya lo hacen: "Usá el punto o la coma solo para los centavos…").
- Con dos o más errores al enviar, un resumen al inicio del formulario lista los errores como enlaces a sus campos; el foco va al resumen.
- **Entrada redundante (3.3.7):** los flujos largos conservan lo escrito en el borrador (4.11) y no piden dos veces un dato que ya está en el DTO (cuenta, fecha propuesta).
- **Autenticación accesible (3.3.8):** se puede pegar en la contraseña y en el código TOTP, los campos tienen `autoComplete` para los gestores de contraseñas (9.3, 9.4) y no hay pruebas cognitivas (sin captcha).
- `EntradaMonto` anuncia su vista previa ("Se guardará $1,234.50") por `aria-describedby` (5.2), no por una región en vivo, para no interrumpir mientras se escribe.
- Ningún cambio de valor dispara una navegación o un envío (3.2.2; FE-38 para el código TOTP).

### 11.5 Tamaño de los objetivos (FE-47)

- **44 × 44 px CSS como mínimo** (`tactil-minimo`, 10.5) para todo control independiente: botones, enlaces de navegación, casillas con su etiqueta, filas tocables, controles del `SelectorPeriodo`.
- Es más que el mínimo de WCAG 2.2 (2.5.8 pide 24 × 24 px), porque la app se usa sobre todo en el teléfono con una mano.
- Exentos: enlaces dentro de un párrafo y controles nativos del navegador. Un control más chico que 44 px solo se acepta si tiene 24 px y la separación que pide 2.5.8, y lo registra el diseño como excepción.
- axe comprueba el mínimo de 24 px (`target-size`, lo detectó el control negativo de V5-24); el de 44 px lo comprueba una prueba de Playwright que mide los controles de cada pantalla (14.6).

**Justificación de FE-47.** 44 px es la recomendación de Apple y de WCAG 2.5.5 (AAA), y coincide con lo que Android Material pide (48 dp ≈ 44 a 48 px). *Alternativa descartada:* solo el mínimo de 24 px (cumple AA, pero es fácil errar con el pulgar en una fila de montos).

### 11.6 Movimiento

- Con `prefers-reduced-motion: reduce`, toda transición y animación dura casi cero: una regla global de `globals.css` (V5-27b midió `1e-05s` con la preferencia y `0.3s` sin ella).
- Ninguna animación dura más de 5 s ni parpadea (2.2.2, 2.3.1). Los esqueletos de carga no pulsan con movimiento reducido.
- Ningún contenido aparece solo después de una animación: con duración cero, el estado final se ve igual.

### 11.7 Color, contraste y modos del sistema

- Contrastes de 10.2 en los dos temas (V5-23) y comprobación en la página real con axe (V5-24).
- **Ningún dato solo por color** (1.4.1): 10.3 y 10.9.
- **`forced-colors: active`** (alto contraste de Windows): los indicadores conservan el glifo (`fill: currentColor`); los bordes de controles y tarjetas usan `border` real (no solo sombra), para que sigan visibles; el foco usa `outline`.
- El tema oscuro no es una inversión del claro: tiene sus propios valores verificados.

### 11.8 Texto, zoom y reflujo

- Texto en `rem` (10.4); al 200 % de tamaño de letra no se corta ni se superpone contenido (1.4.4).
- **Reflujo (1.4.10):** a 320 px CSS de ancho no hay desplazamiento horizontal, salvo en tablas de datos (reportes), que se desplazan dentro de su propio contenedor con nombre accesible y foco de teclado.
- Espaciado de texto (1.4.12): el diseño no fija alturas que corten el texto si el usuario aumenta interlineado o espacio entre letras.
- Orientación (1.3.4): la app funciona en vertical y horizontal.

### 11.9 Ayuda y consistencia

- **Ayuda consistente (3.2.6):** si una pantalla ofrece ayuda (por ejemplo, el texto sobre la recuperación de contraseña, 9.3), está en el mismo lugar relativo en todas las pantallas donde aparece.
- **Identificación consistente (3.2.4):** el mismo término para la misma cosa en todas las pantallas (glosario de 12.3) y el mismo nombre accesible para la misma acción.
- Tiempo (2.2.1): la app no tiene límites de tiempo propios; la salida para revertir no vence (4.14). La sesión larga es de 04 (ADR-08) y, al vencer, se conserva lo escrito en los flujos largos (7.5).

### 11.10 Verificación (FE-46)

**[F7]** **CT-03.** En la fila "Lector de pantalla" de la tabla siguiente rige: lista de comprobación manual con **TalkBack** (Android, Chrome) y **NVDA** (Windows, Chrome o Firefox); VoiceOver queda como riesgo aceptado (P7-9). **Lo registra el usuario** en `pruebas/manuales/resultados.md`, con un commit firmado con su clave (P7-18, P7-20), no el agente; un fallo abre un defecto. La primera versión se declara probada en Android y en Chrome de escritorio, con WebKit de Playwright como cobertura parcial en el nocturno. Detalle en `07-pruebas.md` §22.

| Qué | Cómo | Cuándo | Bloquea |
|---|---|---|---|
| Reglas automáticas | `@axe-core/playwright` con las etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` en cada ruta de 1.3, en los dos temas y en los dos tamaños de §14 | Cada PR (E2E) | Sí, ante cualquier violación |
| Contraste de tokens | `scripts/contraste.py` sobre `tokens.json` | Cada PR | Sí |
| Tamaño táctil de 44 px | Prueba de Playwright (14.6) | Cada PR | Sí |
| Reflujo a 320 px | Prueba de Playwright: `scrollWidth ≤ clientWidth` del documento en cada ruta | Cada PR | Sí |
| Movimiento reducido | Prueba de Playwright con `reducedMotion: 'reduce'` (V5-27b) | Cada PR | Sí |
| Árbol de accesibilidad de los componentes de dominio | Instantáneas `toMatchAriaSnapshot` de `Monto`, `IndicadorEstado`, `FilaCategoria`, `MovimientoBandeja` y un gráfico (V5-25) | Cada PR | Sí |
| Lector de pantalla | Lista de comprobación manual con TalkBack (Android, Chrome) y VoiceOver (macOS o iOS, Safari): Registrar un gasto, asignar, aprobar en la bandeja, conciliar, ingresar con TOTP | Antes de cerrar cada entrega de la Fase 8 | Lo registra el agente; un fallo abre un defecto |

**Lo que se verificó en esta parte.** V5-24: axe-core no encontró violaciones en la página de tokens (claro y oscuro) ni en las páginas prototipo de base, formulario y gráfico; su **control negativo** sí detectó los tres fallos sembrados (contraste con `texto-deshabilitado`, botón sin nombre, campo sin etiqueta) más `target-size`, en los dos temas, así que las reglas se están evaluando con los colores reales de cada tema. Lighthouse dio 100 en accesibilidad en las cuatro páginas medidas (V5-26).

**Justificación de FE-46.** Las reglas automáticas detectan una parte de los problemas (contraste, nombres, etiquetas, tamaños), sin costo y en cada cambio; lo que no detectan (orden lógico, sentido de los anuncios, foco al cerrar) queda escrito como contrato en 11.2 a 11.4 y se comprueba con las pruebas de flujo de la Fase 7 y la revisión manual. *Alternativas descartadas:* solo revisión manual (se pierde entre entregas); axe sin bloquear la CI (las violaciones se acumulan).

---

## 13. Rendimiento

### 13.1 Presupuestos (P5-14, aprobados)

Perfil de referencia: un Android de gama media con 4G. En el laboratorio es el perfil móvil por defecto de Lighthouse 12 (Moto G Power emulado, CPU ×4 más lenta, red 4G lenta simulada: 150 ms de latencia y 1,6 Mbps).

| Métrica | Presupuesto | Cómo se mide (13.4) |
|---|---|---|
| LCP | ≤ 2,5 s | Lighthouse CI, mediana de 3 corridas |
| INP | ≤ 200 ms | Playwright con Event Timing y CPU ×4 (no existe en Lighthouse de laboratorio) |
| CLS | ≤ 0,1 | Lighthouse CI |
| JS compartido | ≤ 170 KB gzip | Playwright: JS de una ruta mínima de `(finn)` |
| **[R3]** Biblioteca de formularios (React Hook Form, `@hookform/resolvers` y Zod con la configuración en español) | ≤ 50 KB gzip, medida aparte (PC-1) | Playwright: los archivos que cargan **todas** las rutas con formulario y ninguna ruta sin formulario |
| **[R4]** Precache del service worker (todos los archivos estáticos de la versión, §8.3) | ≤ 1,5 MB gzip | Playwright: suma de lo que guarda el precache tras instalarse |
| JS por ruta | ≤ 50 KB gzip; Reportes ≤ 120 KB. **[R3]** En una ruta con formulario, sin contar la biblioteca de formularios | Playwright: JS de la ruta menos el compartido y, si tiene formulario, menos la biblioteca de formularios |

KB = 1.000 bytes, tamaño **transferido con gzip** (la compresión de `next start`). Vercel sirve brotli, que comprime más: la medida de CI es conservadora.

### 13.2 Lo que se midió (V5-20, V5-26, V5-27)

Compilación de producción real (Next 16.4.1 con Turbopack, React 19.3, `next start`), JS descargado al abrir cada ruta en un contexto nuevo de Chromium:

| Ruta de prueba | Contenido | JS total | Sobre la base |
|---|---|---|---|
| `/base` | Marco mínimo: un Server Component con `Monto`, `IndicadorEstado` y un `EnlaceFinn` | 135,8 KiB (139,1 KB) | — |
| `/formulario` | + React Hook Form, resolvedor y Zod (`import * as z from 'zod'`) | 178,1 KiB | **+43,3 KB** |
| `/formulario-es` | ídem + `zod/locales` es (la configuración real, PA-1) | 179,4 KiB | **+44,6 KB** |
| `/formulario-llaves` | ídem con `import { z } from 'zod'` | 178,2 KiB | +43,4 KB |
| `/formulario-z` | ídem con `zod/mini` | 168,0 KiB | +33,0 KB |
| `/grafico-servidor` | Gráfico de barras con d3 en un Server Component | 132,4 KiB | −3,5 KB (no tiene `EnlaceFinn`) |
| `/grafico-cliente` | El mismo gráfico en un Client Component | 141,7 KiB | +9,5 KB sobre el de servidor |

Conclusiones:
1. **El compartido** (React, Next, el enrutador y `EnlaceFinn`) es de unos 139 KB: quedan unos 31 KB para el resto del marco (navegación, `ProveedorEncabezado`, refresco, conexión, regiones de anuncios, next-themes). Es suficiente si el marco no importa bibliotecas.
2. **Un formulario cuesta unos 45 KB** solo por React Hook Form y Zod con su configuración en español. Contados dentro de los 50 KB por ruta, quedarían unos 5 KB para el código propio del flujo. **[R3] Resuelto en PC-1:** la biblioteca de formularios tiene su propio presupuesto de 50 KB (con 44,6 KB medidos, le quedan 5,4 KB) y cada ruta con formulario conserva sus 50 KB para su código.
3. **Forma de importar Zod:** en la compilación real, `import { z } from 'zod'` pesa lo mismo que `import * as z from 'zod'` (Turbopack elimina las configuraciones regionales que no se usan). La diferencia de 92,5 KB frente a 25,1 KB de V5-13 era de esbuild. La regla L9 (PA-1, aprobada) se mantiene por coherencia y porque no cuesta nada, pero ya no la justifica el peso; se anota junto a V5-13 en 0.7, sin cambiar 4.2.
4. **`zod/mini`** ahorra unos 11 KB por formulario. PA-1 lo descartó (cambia la API de todos los contratos) y no se reabre; se registra el dato.
5. **Gráficos:** en el servidor no agregan JS (FE-44, 10.8).
6. El CSS de Tailwind con los tokens pesa 3,4 KB con gzip en la página de prueba.

Lighthouse 12 indicativo en el contenedor de pruebas (V5-26; CPU compartida, por eso las cifras varían entre corridas):

| Página | Rendimiento | Accesibilidad | LCP | TBT | CLS |
|---|---|---|---|---|---|
| `/base` | 87 | 100 | 2,38 s | 423 ms | 0 |
| `/formulario` | 96 | 100 | 1,10 s | 230 ms | 0 |
| `/grafico-servidor` | 96 | 100 | 1,65 s | 204 ms | 0 |
| `/tokens` | 99 | 100 | 1,63 s | 134 ms | 0 |

La página más simple fue la más lenta, lo que muestra el ruido de una sola corrida en una máquina compartida: por eso CI usa la mediana de 3 (13.4). INP en el laboratorio (V5-27a): escribir un monto, provocar un error de validación y enviar, con CPU ×4, dio como interacción más lenta 40 a 56 ms en 5 corridas (presupuesto 200 ms).

**Hallazgo para CI:** `next build` de Next 16 con Turbopack ya no imprime el tamaño de cada ruta (la tabla de rutas de la compilación solo muestra si es estática o dinámica). El control de tamaño de P5-14 no puede leer la salida de la compilación: se mide en el navegador, como V5-20 (FE-48).

### 13.3 Reglas que mantienen el presupuesto (FE-49)

| Regla | Por qué |
|---|---|
| Server Components por defecto; `'use client'` solo en hojas con estado o eventos (1.5) | El HTML llega con los números; el JS es solo de interacción |
| El marco no importa bibliotecas de terceros, salvo next-themes | Todo lo del marco va en el compartido de todas las rutas |
| Gráficos en el servidor (FE-44); d3 nunca en el cliente | 10.8 |
| **[F6]** `@dnd-kit/core` solo con `import()` en la Bandeja, en el primer momento libre después de hidratar (`requestIdleCallback`, tope de 2 s) o al primer toque o tecla sobre una fila (CF-22) | Medido en 06 V6-08: 15.0 KB gzip fuera de lo que se descarga antes de `load` |
| Sin bibliotecas de fechas, de formato ni de utilidades generales (moment, date-fns, dayjs, lodash, numeral); `Intl` y el módulo de 5.4 | Se agrega a la lista de 04 §5.8 como regla L18 (`no-restricted-imports`) |
| Sin bibliotecas de componentes además de Radix (a través de shadcn), ni de iconos completas: los iconos son SVG propios o se importan de a uno, nunca el paquete completo | Una biblioteca de iconos importada entera pesa más que todo el presupuesto de una ruta |
| Sin scripts de terceros (analítica, chat, mapas) | Además de peso, 00 y 04 no los prevén |
| Fuente del sistema mientras el diseño no elija; las que elija, con `next/font`, autohospedadas y con `display: swap`, como máximo dos familias | LCP y CLS |
| El código del QR de la inscripción (9.5) es el SVG que devuelve Supabase; sin biblioteca de QR | — |
| `import()` dinámico para partes pesadas que no se usan al abrir (por ejemplo, el lector del CSV de conciliación, si lo hay en el cliente) | Se descarga al usarlas |
| Esqueletos de carga con las mismas dimensiones que el contenido (7.1) y espacio reservado para avisos que llegan con la página | CLS |
| Prefetch por defecto de `Link` (FE-39), sin prefetch masivo | Navegación rápida sin egreso extra |

**Justificación de FE-49.** Con el compartido en 139 KB y un formulario en 45 KB, el margen es chico: las reglas impiden lo que más peso agrega sin aportar a la app. *Alternativa descartada:* revisar el peso solo cuando el control de CI falle (los agentes de la Fase 8 tendrían que deshacer trabajo).

### 13.4 Verificación en CI (FE-48)

Todo en GitHub Actions, en el job de E2E que ya existe para el entorno de CI de 04 14.1 (pila local de Supabase y `next start` con la compilación de producción), dentro de los minutos gratuitos.

| Control | Herramienta | Detalle | Falla la CI si |
|---|---|---|---|
| **Tamaño de JS** | Script de Playwright `e2e/rendimiento/tamano.e2e.ts` (método de V5-20) | Recorre las rutas de 1.3 (con datos de la semilla de la Fase 7 y sesión AAL2), cada una en un contexto nuevo y con el service worker bloqueado (`serviceWorkers: 'block'`, para que el precache de §8 no cuente); suma `responseBodySize` de los recursos `script`. **Compartido** = los archivos que cargan todas las rutas medidas. **[R3] Biblioteca de formularios** = los archivos que cargan todas las rutas con formulario (las de `flujos/`, 1.4) y ninguna ruta sin formulario. Si Turbopack reparte parte de la biblioteca en archivos que solo comparten algunas rutas con formulario, esa parte cuenta en cada una de esas rutas (la medida es conservadora). **Por ruta** = el resto de lo que descarga esa ruta. Escribe `tamanos.json` como artefacto y una tabla en el resumen del job | Se supera un presupuesto de 13.1 |
| **LCP y CLS** | `@lhci/cli` (Lighthouse CI), `numberOfRuns: 3`, preajuste móvil | Rutas: `/`, `/presupuesto`, `/actividad`, `/bandeja`, `/registrar/gasto`, `/reportes/tendencia`. Inicia sesión con un `puppeteerScript` que usa el usuario de prueba y genera el código TOTP | La mediana supera 2,5 s o 0,1 |
| **INP de laboratorio** | Playwright con `Emulation.setCPUThrottlingRate` 4 por CDP y un `PerformanceObserver` de tipo `event` (método de V5-27a) | Interacciones fijas: abrir Registrar, escribir un monto, enviar con error y sin error, cambiar de período, aprobar con un toque, abrir y cerrar un flujo superpuesto | La interacción más lenta de cada escenario supera 200 ms en la mediana de 3 |
| **Tamaño del precache** **[R4]** | Playwright (método de V5-29) | Con el service worker instalado, suma el tamaño con gzip de cada archivo de la caché de precache (los de `/_next/static`, `/marca` y `/sin-conexion`, 8.3) | Supera 1,5 MB |
| **TBT** | Lighthouse CI | Solo informativo (no es un presupuesto aprobado) | No falla |

- Los presupuestos viven en `apps/web/presupuestos.json`; los leen los tres controles.
- El job publica la comparación con `main` en el resumen del PR, para ver qué cambio agregó peso.
- Los datos de rendimiento de usuarios reales (INP de campo) no se recogen: no hay Route Handler para recibirlos (la lista de 04 2.2.1 es cerrada) y un servicio externo agregaría costo o un tercero. Se acepta medir solo en el laboratorio (D-9).

**Justificación de FE-48.** Medir en el navegador cuenta exactamente lo que descarga el usuario, incluidos los fragmentos que Turbopack comparte entre rutas, y no depende de una salida de la compilación que ya no existe. *Alternativas descartadas:* un analizador de paquetes (sirve para investigar, pero no da un número por ruta que haga fallar la CI); `size-limit` sobre los archivos de `.next/static` (no sabe qué fragmentos carga cada ruta); solo Lighthouse (no mide INP ni el JS por ruta con detalle).

---

## 14. Preparación para pruebas (Playwright)

Las pruebas se escriben en la Fase 7. Esta sección fija lo que el código de la Fase 8 tiene que exponer para que esas pruebas sean estables aunque cambie el diseño, y las convenciones del proyecto de Playwright (ADR-19: Chromium).

### 14.1 Estructura y configuración (FE-50)

**[F7]** **CT-01.** El reloj de la E2E es el de 04 §13.1.4 enmendado: el `webServer` de Playwright arranca `next start` con `FINN_ENTORNO=pruebas` y `FINN_RELOJ_ARCHIVO`; el ayudante fija el instante en el archivo y, con el mismo instante, `page.clock.install()` en el navegador. **CT-04:** se agrega el nivel **componentes** (`*.cmp.test.tsx`) con el modo navegador de Vitest y el Chromium de Playwright, con axe por componente. Detalle en `07-pruebas.md` §3.1, §4 y §19.8.

```
apps/web/
  playwright.config.ts
  e2e/
    configuracion/   inicio-sesion.setup.ts (sesión AAL2 reutilizable), semilla.ts
    ayudas/          esperas.ts, montos.ts, accesibilidad.ts, tactil.ts, totp.ts
    pantallas/       una carpeta por sección de §3.1 (presupuesto/, bandeja/…), un archivo por ruta de §2
    flujos/          un archivo por flujo largo o corto (registrar-gasto.e2e.ts…)
    estados/         carga, vacío, error, sin conexión, sesión vencida, versión nueva (§7)
    accesibilidad/   axe, tamaño táctil, reflujo y movimiento por ruta (11.10)
    rendimiento/     tamano.e2e.ts, inp.e2e.ts (13.4)
```

| Ajuste | Valor | Por qué |
|---|---|---|
| Servidor | `webServer`: `next build` + `next start` (producción), contra el entorno de CI de 04 14.1 | Las verificaciones de §7, §13 y FE-39 dependen del comportamiento de producción (prefetch, `digest`) |
| Proyectos | `movil` (descriptor `Pixel 7` de Playwright: 412 × 915, táctil) y `escritorio` (`Desktop Chrome`, 1280 × 800) | N6: las mismas rutas en los dos tamaños |
| Tema | Claro por defecto; la carpeta `accesibilidad/` corre además con `colorScheme: 'dark'` (next-themes sigue al sistema, 10.6) | 11.10 |
| Configuración regional | `locale: 'es-SV'`, `timezoneId: 'America/El_Salvador'` | Como el usuario real |
| Zona distinta | Un proyecto `zona-distinta` (`timezoneId: 'Asia/Tokyo'`, solo `pantallas/` con fechas) | Comprueba que ninguna fecha sale del reloj del dispositivo (5.5, 04 13.4) |
| Paralelismo | `workers: 1` en las carpetas que escriben datos | La app tiene un solo usuario (`FINN_USUARIO_ID`): dos pruebas en paralelo verían los datos de la otra |
| Reintentos | `retries: 1` en CI, con `trace: 'on-first-retry'` | Un reintento que pasa queda marcado como inestable en el informe |
| Esperas fijas | Prohibidas (`playwright/no-wait-for-timeout`, `playwright/no-networkidle`) | Se espera por estado (14.4) |

**Datos.** Cada archivo empieza desde un estado conocido: `semilla.ts` deja la base con un escenario de `packages/dominio/escenarios` (04, ADR-19) usando el ejecutor de integración. El escenario de cada archivo lo elige la Fase 7. El "hoy" del servidor se fija con el reloj simulado de 04 13.1 (`FINN_HOY_SIMULADO` y `finn.reloj_simulado`).

**Sesión.** `inicio-sesion.setup.ts` ingresa una vez por la interfaz (email, contraseña y código TOTP generado con el secreto del usuario de prueba, variable `E2E_TOTP_SECRETO`, con la biblioteca `otpauth` como dependencia de desarrollo) y guarda el `storageState`. Las pruebas de §9 usan un contexto sin sesión.

### 14.2 Cómo se encuentran los elementos (FE-51)

Orden de preferencia:

| # | Método | Ejemplo |
|---|---|---|
| 1 | `getByRole` con el nombre accesible **tomado del catálogo de textos** | `page.getByRole('link', { name: textos.navegacion.bandeja })` |
| 2 | `getByLabel` para campos | `page.getByLabel(textos.registrar.monto)` |
| 3 | `getByText` para mensajes del servidor, con el catálogo de 04 7.10 | `page.getByText(mensajes.monto_fuera_de_rango)` |
| 4 | `getByTestId` solo con los identificadores de 14.3 | `page.getByTestId('fila-categoria').filter({ has: … })` |

- Las pruebas importan `src/textos/` y `@finn/aplicacion/errores/mensajes`: un cambio de texto no rompe las pruebas, y un texto que falta en el catálogo sí (L8 ya obliga a que todo texto esté ahí).
- **Prohibido** en las pruebas: selectores CSS por clase o por estructura (`.bg-superficie`, `div > span`), XPath, y textos escritos a mano en la prueba. Regla de ESLint en `e2e/`.
- Que los elementos se encuentren por rol y nombre es en sí una prueba de accesibilidad: si `getByRole` no encuentra un botón, el lector de pantalla tampoco.

**Justificación de FE-51.** Rol y nombre son lo que Claude Design no puede cambiar (10.10), así que las pruebas sobreviven al cambio de identidad visual. *Alternativas descartadas:* `data-testid` en todo (las pruebas pasarían aunque el control no tuviera nombre accesible); textos literales en las pruebas (se rompen con cada ajuste de redacción).

### 14.3 Atributos de prueba (contrato)

Además de roles y nombres, el código expone estos atributos. Forman parte del contrato de 10.10: el diseño no los quita.

| Atributo | Dónde | Valor | Para qué |
|---|---|---|---|
| `data-centavos` | Todo `Monto` | El entero en centavos del DTO | Comprobar un número sin depender del formato |
| `data-estado` | `IndicadorEstado`, `AvisoEnLinea`, `Aviso` | El estado de 10.3 | Comprobar el estado sin depender del color |
| `data-testid` + `data-id` | Filas de lista: `fila-categoria`, `fila-pago-tarjeta`, `fila-transaccion`, `movimiento-bandeja`, `fila-cuenta`, `fila-meta`, `fila-programada`, `fila-notificacion` | `data-id` = el id de la entidad | Encontrar la fila de una entidad concreta |
| `data-testid="resultado"` | `Resultado` (4.14) | — | La salida de una acción de un toque |
| `data-hidratado="si"` | `<html>`, lo pone el marco en su primer efecto | — | Esperar la hidratación antes de interactuar. V5-21b: un clic previo a la hidratación no se pierde (React lo repite al hidratar y la navegación es del cliente), pero hasta entonces no hay señal de FE-39, y la prueba mediría otra cosa |
| `data-revision` y `data-hoy` | `<html>`, los actualiza `ProveedorEncabezado` | `revision` y `hoy` del `Encabezado` vigente | Esperar a que la pantalla muestre los datos de una escritura o de un refresco (6.3, 6.7) |
| `aria-busy` | `EnlaceFinn` y la región que carga | `true` mientras dura | Comprobar la señal de navegación (FE-39) y la carga (7.1) |

`data-revision` y `data-hoy` no exponen nada que el usuario no tenga ya (están en cada respuesta de la app); no hay datos personales en estos atributos.

### 14.4 Ayudas

| Ayuda | Qué hace |
|---|---|
| `esperarHidratacion(page)` | Espera `html[data-hidratado="si"]` |
| `esperarRevisionNueva(page, anterior)` | Espera a que `data-revision` cambie después de una escritura |
| `esperarMonto(localizador, centavos)` | Comprueba `data-centavos` y el texto accesible (`formatearMontoAccesible`, 10.8) |
| `revisarAccesibilidad(page)` | axe con las etiquetas de 11.10; falla con la lista de violaciones |
| `revisarTactil(page)` | Mide con `getBoundingClientRect` cada botón, enlace fuera de un párrafo, casilla y fila tocable; falla si alguno mide menos de 44 × 44 px y no está en la lista de excepciones del diseño (11.5) |
| `revisarReflujo(page)` | A 320 px de ancho, `document.documentElement.scrollWidth ≤ clientWidth` (11.8) |
| `codigoTotp()` | El código actual del usuario de prueba |

### 14.5 Cómo se provoca cada estado de §7

| Estado | Cómo |
|---|---|
| Carga | `page.route` que demora la respuesta RSC de la ruta destino; se comprueba `aria-busy` y la señal de FE-39 |
| Vacío y primer uso | Un escenario de semilla sin datos o sin elementos de la sección |
| Sin resultados | Filtros en la URL que no dejan filas |
| No encontrado | Una ruta con un UUID que no existe |
| Error de la consulta | Una ruta con un parámetro que provoca `INTERNO` en el entorno de CI (lo define la Fase 7, por ejemplo con la base detenida); se comprueba que la referencia mostrada es un `idError` de `eventos_sistema` |
| Sin conexión | `context.setOffline(true)` **y**, *(D)* para lo que pasa por el service worker, el servidor detenido (Playwright no aplica `setOffline` a sus pedidos, V5-30); se comprueba el aviso, los envíos deshabilitados, que un enlace no navega (V5-30c) y el refresco al volver |
| Sesión vencida | `context.clearCookies()` y una navegación o un envío; se comprueba `?volver=` y la recuperación del borrador |
| Versión nueva | Dos compilaciones con ids de acción distintos, como V5-09 |
| Cambio de día | `page.clock` para el reloj del dispositivo y el reloj simulado del servidor (6.7) |
| Solo lectura | Escenarios con un período cerrado, una cuenta archivada y una transacción con restricciones |

### 14.6 Nombres y etiquetas

- Archivos `*.e2e.ts`, uno por ruta o por flujo, con el nombre de la ruta (`presupuesto-categoria.e2e.ts`).
- Títulos de las pruebas en español y en términos del usuario: `test('aprobar con un toque muestra lo aprobado según el servidor')`.
- Etiquetas en el título para filtrar: `@humo` (lo mínimo que se corre antes de desplegar), `@a11y`, `@rendimiento`.

### 14.7 Fuera de esta fase

- **Comparación de capturas** (`toHaveScreenshot`): no se usa mientras la identidad sea provisional, porque cada cambio de Claude Design invalidaría todas las capturas. La Fase 7 decide si la agrega después de la entrega del diseño.
- Las pruebas de los escenarios y de las operaciones contra la base son de la Fase 7 (04 §18).

---

## 8. PWA

Finn se instala como aplicación, recibe notificaciones y muestra una página propia sin conexión, pero **no funciona sin conexión** (02 ADR-13, FE-20): ningún número se guarda en el dispositivo.

### 8.1 Piezas (FE-52)

| Pieza | Archivo | Detalle |
|---|---|---|
| Manifiesto | `app/manifest.ts` | 8.2; Next lo sirve en `/manifest.webmanifest` |
| Recursos de marca | `public/marca/` | 10.11 |
| Service worker (fuente) | `src/sw/sw.ts` | Serwist (`serwist` 9.5) con precache, respaldo sin conexión y push (8.3, 8.5, 8.6) |
| Service worker (servido) | `app/serwist/[path]/route.ts` | `createSerwistRoute` de `@serwist/turbopack` 9.5 (04 §1.1 ya lo fija como dependencia): compila `sw.ts` con esbuild durante `next build` y lo sirve **estático** en `/serwist/sw.js`, con `Service-Worker-Allowed: /`. Es un Route Handler nuevo: **CP-17** |
| Registro | `componentes/marco/registro-service-worker.tsx` (cliente, en el layout raíz) | 8.4 y 8.7 |
| Suscripción push | `componentes/marco/suscripcion-push.tsx` (cliente, en el layout de `(finn)`) y la tarjeta "Activar notificaciones" (CP-5) | 8.6 |
| Página sin conexión | `app/sin-conexion/page.tsx` (estática) | 8.5 |
| Destinos | `componentes/navegacion/destinos.ts` | 3.5; el service worker la importa (es código puro, sin React) |

Opciones de `createSerwistRoute`: `swSrc: 'src/sw/sw.ts'`, `useNativeEsbuild: true` (`esbuild` 0.25 como dependencia de desarrollo), `esbuildOptions: { sourcemap: false }` (sin mapa de fuentes público: V5-29 mostró que sin esta opción se publica `/serwist/sw.js.map` con el código fuente), `additionalPrecacheEntries: [{ url: '/sin-conexion', revision: <commit de CI> }]` y `globIgnores: ['**/*.map']`. `next.config.ts` se envuelve con `withSerwist` (agrega `esbuild` a `serverExternalPackages`).

**Verificado (V5-29).** Con Next 16.4.1 y Turbopack, `next build` genera `/serwist/sw.js` como página estática (SSG) con la cabecera `Service-Worker-Allowed: /`; el registro con `scope: '/'` controla toda la app; `sw.js` pesa 11,7 KB con gzip.

**Justificación de FE-52.** `@serwist/turbopack` es la integración de Serwist para compilar con Turbopack, que es lo que fija 04, y compila el service worker con el mismo `next build`. *Alternativas descartadas:* `@serwist/next` (exige compilar con webpack, `next build --webpack`, y perder Turbopack); un script propio con esbuild y `@serwist/build` después de `next build` que escriba `public/sw.js` (evita el Route Handler, pero reimplementa la inyección del manifiesto de precache que ya hace la ruta de Serwist); escribir el service worker sin Serwist (precache, limpieza de versiones y respaldo hechos a mano).

#### CP-17 — Route Handler del service worker (04 §2.2.1 y §12.4) — aprobado **[R4]**

| Caso | Mecanismo | Por qué |
|---|---|---|
| Servir el service worker compilado | **Route Handler** `GET /serwist/[path]` (`createSerwistRoute`), estático (`dynamic = 'force-static'`, `dynamicParams = false`) | `@serwist/turbopack` compila el service worker en la compilación y lo sirve desde una ruta; no lee la sesión, no lee la base y no recibe datos |

- 04 §12.4: el `matcher` de `proxy.ts` excluye también `/serwist/` (además de "el service worker", que ya figura) y `/sin-conexion`.
- El árbol de 04 §1.2 agrega `app/serwist/[path]/route.ts`.

### 8.2 Manifiesto

| Campo | Valor | Nota |
|---|---|---|
| `id`, `start_url`, `scope` | `/` | Una sola instalación por origen |
| `name`, `short_name` | "Finn" | — |
| `description` | "Tu presupuesto base cero." (§12) | — |
| `lang`, `dir` | `es-SV`, `ltr` | — |
| `display` | `standalone` | Sin la barra del navegador |
| `orientation` | **Sin fijar** | WCAG 1.3.4 (11.8): la app funciona en vertical y horizontal. La guía de Serwist sugiere `portrait`; se descarta |
| `background_color`, `theme_color` | Valores de `tokens.json` (`fondo` del tema claro, o `marca-icono-fondo` si el diseño lo define, 10.11) | El manifiesto no puede usar variables CSS. El color de la barra en la app abierta lo da `viewport.themeColor` con los dos temas (10.6) |
| `icons` | 192 y 512 (`any`) y 512 `maskable` (10.11) | — |
| `shortcuts` | "Registrar gasto" → `/registrar/gasto`; "Bandeja" → `/bandeja` | Atajos al mantener presionado el ícono en Android. Abren la ruta con la sesión normal (N1, N2) |

**Verificado (V5-31).** Con el manifiesto y el service worker, Chromium no reporta errores de instalabilidad (`Page.getInstallabilityErrors` vacío con un perfil persistente; en un contexto efímero el único error es `in-incognito`, propio del entorno de prueba).

### 8.3 Qué guarda el service worker (FE-53)

| Pedido | Estrategia | Se guarda |
|---|---|---|
| `/_next/static/**` (JS, CSS y fuentes con hash en el nombre) | Precache (manifiesto de Serwist) | Sí, por versión |
| `/marca/**` y `/sin-conexion` (y sus archivos) | Precache | Sí, por versión |
| Navegación de documento (`request.mode = 'navigate'`) | Red; si falla, `/sin-conexion` (8.5) | No |
| Pedidos RSC de la navegación del cliente, Server Actions (`POST`), `/api/**`, `/manifest.webmanifest`, `/serwist/**` | Solo red (`NetworkOnly`) | **Nunca** |
| Cualquier otro pedido | Solo red | Nunca |

- **No se usa `defaultCache` de Serwist.** Guarda páginas, respuestas RSC y `/api/*` con `NetworkFirst`: mostraría números viejos sin conexión, lo que prohíben FE-20 y 02 ADR-13. `runtimeCaching` tiene una sola regla: `NetworkOnly` para todo.
- Sin `navigationPreload`: con `NetworkOnly` no aporta.
- **Verificado (V5-29c):** después de navegar con red por páginas dinámicas, con enlaces del cliente y con recargas, Cache Storage tiene una sola caché (la de precache) y ninguna página ni respuesta RSC. La E2E repite este control (14.5).
- **Tamaño del precache.** En la app de prueba (12 páginas): 25 archivos, 248 KB con gzip. En la app real crece con cada ruta y se descarga una vez por versión. **[R4] PD-1 aprobada:** se precachean todos los archivos estáticos de la versión; el job de 13.4 informa el tamaño en cada PR y falla si supera **1,5 MB con gzip**.

**Justificación de FE-53.** El precache de los archivos estáticos acelera la navegación y deja que una pestaña con la versión anterior siga funcionando (8.4); las respuestas con datos nunca pasan por la caché. *Alternativas descartadas:* `defaultCache` (guarda datos); no tener service worker (sin push, sin instalación y sin página sin conexión, que 02 ADR-12 y ADR-13 piden).

### 8.4 Registro y actualización (FE-54, FE-55)

**Registro (FE-54).** `RegistroServiceWorker`, en el layout raíz (también registra en `/ingresar`), solo en producción (`process.env.NODE_ENV === 'production'`, para que `next dev` no guarde archivos de desarrollo):

```ts
navigator.serviceWorker.register('/serwist/sw.js', { scope: '/', updateViaCache: 'none' })
```

- `updateViaCache: 'none'`: el navegador nunca usa su caché HTTP para comprobar si hay un service worker nuevo.
- **Sin `SerwistProvider`.** Sus valores por defecto chocan con decisiones aprobadas: `cacheOnNavigation: true` pide al service worker guardar cada URL a la que se navega (FE-20), y `reloadOnOnline: true` recarga la página al volver la conexión, lo que pierde lo escrito en un formulario corto (FE-21 refresca sin perder el estado, V5-07). Además pesa más: V5-34 midió +2,4 KB con el proveedor y +0,5 KB con el registro propio.

**Actualización (FE-55).**

| Paso | Qué pasa |
|---|---|
| 1. Se publica una versión | El service worker nuevo tiene otro manifiesto de precache, así que su contenido cambia |
| 2. El navegador lo descubre | En la siguiente navegación de documento y, además, cuando `useRefrescoAutomatico` (FE-21) refresca al volver a la pestaña después de más de 60 s, que llama a `registro.update()` |
| 3. Se instala y **espera** | `skipWaiting: false` y `clientsClaim: false`: el service worker viejo sigue controlando las pestañas abiertas |
| 4. Aviso | `RegistroServiceWorker` ve `registro.waiting` con un controlador activo y muestra el aviso de 7.6, "Hay una versión nueva", con "Recargar" (el mismo de FE-13) |
| 5. "Recargar" | Envía `{ type: 'SKIP_WAITING' }` al service worker que espera; al recibir `controllerchange`, recarga la página **una sola vez** |

- Mientras espera, la pestaña vieja sigue funcionando con los archivos de su versión: **V5-33b** midió que un archivo de la versión 1 que el servidor nuevo ya no tiene (404) se sigue sirviendo desde el precache del service worker viejo (200). Cubre la falta de Skew Protection (D-3) para el código del cliente; las Server Actions que cambiaron siguen detectándose con FE-13.
- Los borradores de los flujos largos (4.11) sobreviven a la recarga.
- **Verificado (V5-33a y c):** con la versión 2 publicada, la pestaña con la versión 1 muestra el aviso; "Recargar" activa la versión 2 y el aviso desaparece.

**Justificación de FE-55.** Esperar a que el usuario recargue evita cambiar el código debajo de una pantalla abierta, y el precache viejo la mantiene funcionando hasta entonces. *Alternativas descartadas:* `skipWaiting: true` con `clientsClaim` (el service worker nuevo borra el precache viejo mientras la pestaña sigue usando esos archivos); recargar sola al detectar la versión (pierde lo escrito en un flujo corto).

### 8.5 Sin conexión (FE-56)

**Hallazgo (V5-30b).** Cuando falla el pedido RSC de una navegación del cliente, Next 16 hace una **navegación de documento** a la misma URL; el service worker responde con `/sin-conexion` y la pantalla que se veía se pierde. Lo que decía 7.4 ("la app se queda en la pantalla actual") no se cumple por sí solo. Se corrige así:

1. **`EnlaceFinn` no navega sin conexión.** Si `navigator.onLine === false`, cancela el clic y avisa al marco (`finn:navegacion-sin-conexion`), que anuncia "Estás sin conexión. No se puede abrir esta pantalla" por `AnunciosMarco` (11.3). **Verificado (V5-30c):** sin conexión, el clic en el enlace deja la pantalla intacta y emite el aviso.
2. **Navegación programática:** toda llamada a `router.push` y `router.replace` pasa por `useNavegacionFinn()` (`componentes/navegacion/`), con la misma comprobación. Regla **L19**: `useRouter` de `next/navigation` solo en `componentes/navegacion/` y en `formularios/` (donde `useOperacion` necesita `router.refresh`, que no navega). `router.back()` (cerrar un flujo) restaura desde la caché del enrutador y no se bloquea.
3. **Sin señal de red pero con `navigator.onLine === true`** (red que no responde): la navegación termina en `/sin-conexion`. La URL de la barra sigue siendo la pedida (V5-30a), así que "Intentar de nuevo" recarga esa URL.

**`/sin-conexion`.** Página estática, en el precache, sin sesión ni datos:
- símbolo de Finn (10.11), `h1` "Estás sin conexión", el texto "Finn necesita internet para mostrarte tus números al día." y, si hay un borrador en la pestaña, "Lo que estabas registrando sigue guardado en esta pestaña." (lo sabe por `almacen.ts`, sin leer montos);
- "Intentar de nuevo" (`location.reload()`; un componente de cliente mínimo, también en el precache);
- ningún número, ningún enlace a otras pantallas (todas necesitan red).

7.4 se corrige con una marca *(D)* que remite a esta sección.

**Justificación de FE-56.** Bloquear la navegación sin conexión conserva la pantalla que se estaba mirando, que es lo que FE-35 pretendía. *Alternativas descartadas:* devolver desde el service worker una respuesta RSC de error en lugar de dejar fallar el pedido (depende del formato interno de RSC de Next, que cambia entre versiones); aceptar el salto a `/sin-conexion` (se pierde lo escrito en un flujo corto, que no tiene borrador).

### 8.6 Notificaciones push (FE-57)

**Permiso y suscripción** (CP-5, `/ajustes/notificaciones`):

| Momento | Qué hace |
|---|---|
| Tocar "Activar notificaciones" (tarjeta de Inicio o Ajustes) | `Notification.requestPermission()` → si es `granted`, `registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY })` → OPT-02 con `endpoint`, `p256dh`, `auth` y el agente |
| Abrir la app con sesión AAL2 y permiso concedido | `SuscripcionPush` llama a `pushManager.getSubscription()`; si no hay, se suscribe; en ambos casos llama a OPT-02 (renueva `renovada_en`). Una vez por pestaña (marca en `almacen.ts`) |
| Permiso denegado | Ajustes explica cómo habilitarlo en el navegador (CP-5) |
| "Quitar" un dispositivo | OPT-03; si es este dispositivo, además `subscription.unsubscribe()` |
| iPhone o iPad | Web Push solo funciona con la app instalada en la pantalla de inicio: si `display-mode` no es `standalone`, Ajustes lo explica antes de pedir el permiso |

`pushsubscriptionchange` no se atiende en el service worker: no puede llamar a una Server Action (04 2.2.1). La próxima vez que se abre la app, `SuscripcionPush` detecta la suscripción nueva o ausente y llama a OPT-02. Mientras tanto, las notificaciones quedan en el centro (04 11.6).

**Evento `push`.** La carga útil es `CargaPush` (CP-1, con **CP-18**):

```ts
showNotification(carga.titulo, {
  body: carga.cuerpo, tag: carga.etiqueta, icon: '/marca/icono-192.png', badge: '/marca/insignia-96.png',
  data: { notificacionId, destino },
  actions: carga.acciones?.map((a) => ({ action: a, title: textos.push[a] })),   // "Confirmar", "Rechazar"
})
```

- Una carga que no se puede leer muestra "Finn" y "Tenés una notificación nueva." y abre el centro de notificaciones (V5-32a). Toda carga útil muestra una notificación: Chrome exige `userVisibleOnly`.
- `tag` reemplaza en el dispositivo la notificación del mismo grupo (04 11.2 y 11.3).

**Evento `notificationclick`:**

| Caso | Qué hace |
|---|---|
| Toque en la notificación | `rutaDeDestino(destino, notificacionId)` (3.5) agrega `?notificacion=` (para marcarla leída, 3.5). Si hay una ventana de la app, la **navega** a esa ruta y la enfoca; si no, abre una nueva (`clients.openWindow`) |
| "Confirmar" o "Rechazar" (solo `sms_coincidencia`) | `POST /api/notificaciones/accion` como en 04 11.5, con `movimientoId` de `destino`. 200 → notificación breve "Listo" (`tag` propio); 401 → abre `/bandeja`; 409, 422, otro estado o error de red → abre `/bandeja/[movimientoId]` |

- Se navega antes de enfocar: `focus()` puede fallar sin activación del usuario y no debe impedir la navegación.
- **Verificado (V5-32):** con eventos sintéticos dentro del service worker, la notificación lleva título, cuerpo, `tag`, acciones y datos de la carga; el toque navega la ventana abierta a `/bandeja/<id>?notificacion=<id>`; "Confirmar" con una respuesta 404 abre el movimiento. **No verificado:** la entrega real por el servicio de push (no es alcanzable desde el contenedor) ni el comportamiento con activación real del usuario; quedan en la lista manual de 8.8.
- Sin contador en el ícono (App Badging API): el contador se quedaría viejo mientras la app está cerrada, porque el service worker no consulta datos.

#### CP-18 — `etiqueta` en `CargaPush` (CP-1; 04 §11.2 y §11.3) — aprobado **[R4]**

04 11.2 fija un `tag` por grupo (`sms`, `programadas`, `cierre`, `sistema`) que el dispositivo usa para reemplazar notificaciones, pero `CargaPush` de CP-1 no lo lleva y el service worker no lo conoce. Se agrega:

```ts
interface CargaPush { notificacionId: Uuid; titulo: string; cuerpo: string;
                      etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema';   // = tag de 04 11.2
                      destino?: DestinoNotificacion; acciones?: ('confirmar' | 'rechazar')[] }
```

El `movimientoId` que necesitan las acciones de 11.5 sale de `destino` (`pantalla: 'movimiento'`), sin campo nuevo.

### 8.7 Instalación (FE-58)

- **Android (Chrome):** `RegistroServiceWorker` guarda el evento `beforeinstallprompt` (llama a `preventDefault()` para que el navegador no muestre su barra) y lo expone al marco. `/ajustes` muestra "Instalar Finn en este dispositivo" mientras el evento esté disponible; al tocarlo, `prompt()`. Con `appinstalled` desaparece.
- **iPhone o iPad (Safari):** no hay evento; si `display-mode` no es `standalone`, `/ajustes` muestra las instrucciones ("Compartir" → "Agregar a inicio").
- Ya instalada (`display-mode: standalone`): no se ofrece.
- Nunca se interrumpe al usuario con un aviso de instalación al abrir la app.

**Justificación de FE-58.** Un solo lugar, a pedido del usuario, igual que el permiso de notificaciones (CP-5). *Alternativa descartada:* una tarjeta en Inicio (Inicio responde "¿qué necesita mi atención?", y la instalación es una vez).

### 8.8 Verificación

| Qué | Cómo | Cuándo |
|---|---|---|
| El precache no guarda datos | E2E: después de recorrer las pantallas, Cache Storage solo tiene `/_next/static/**`, `/marca/**` y `/sin-conexion` (V5-29c) | Cada PR |
| Sin conexión | E2E con `context.setOffline(true)` **y** el servidor detenido: Playwright no aplica `setOffline` a los pedidos del service worker (hallazgo de V5-30), así que solo con la red cortada no se reproduce | Cada PR |
| Actualización | E2E con dos compilaciones (V5-33) | Cada PR que cambie `sw.ts` y semanal |
| Push y clic | Eventos sintéticos en el service worker (V5-32) | Cada PR |
| Tamaño del precache | El job de 13.4 informa el total con gzip y falla por encima de 1,5 MB **[R4]** | Cada PR |
| Prueba manual en el teléfono | Instalar, recibir un push real desde el webhook, tocarlo, usar "Confirmar", quitar la red y abrir un enlace, publicar una versión y recargar | Antes de cerrar la Fase 8 |

---

## 15. Trazabilidad

**[F7]** **CT-08.** Las tablas 15.1 y 15.2 y el resultado se regeneraron con `trazabilidad.py` actualizado (lee la ruta aunque la celda lleve una marca **[Fn]**, y conoce OP-53). Las filas que la Fase 6 había agregado a mano (OP-07 en lote, OP-53) salen ahora del mapa; las acciones de un toque de CF-05 (4.14) aparecen en 15.2. Detalle en `07-pruebas.md` §34.

Relaciona cada consulta y cada operación de 04 con su pantalla y su componente. Las tablas 15.1 y 15.2 **las genera** `tools/docs/fase5/trazabilidad.py` **[CH-18]** a partir del mapa de §2 y de las acciones de un toque de 4.14 (V5-36); no se editan a mano. Si cambia una fila de §2, se vuelven a generar y la CI comprueba que coincidan.

Resultado actual: Consultas: 18/18 · operaciones con pantalla: 61/62 (sin pantalla: OP-35, el webhook) · flujos: 51 · carpetas de flujo repetidas: 0.

### 15.1 Consultas → pantallas

| Consulta (04 §6) | Rutas | Cantidad |
|---|---|---|
| `inicio` | `/` | 1 |
| `presupuesto` | `/presupuesto`, `/presupuesto/auto-asignar` | 2 |
| `detalleCategoria` | `/presupuesto/categorias/[categoriaId]` | 1 |
| `detalleLpa` | `/presupuesto/listo-para-asignar` | 1 |
| `cuentas` | `/cuentas`, `/cuentas/ordenar`, `/registrar` | 3 |
| `detalleCuenta` | `/cuentas/[cuentaId]`, `/cuentas/[cuentaId]/archivar`, `/cuentas/[cuentaId]/eliminar` | 3 |
| `actividad` | `/actividad` | 1 |
| `detalleTransaccion` | `/actividad/[transaccionId]`, `/actividad/[transaccionId]/eliminar`, `/actividad/[transaccionId]/estado`, `/actividad/[transaccionId]/eventos/eliminar` | 4 |
| `bandeja` | `/bandeja` | 1 |
| `reporte` | `/reportes/[tipo]` | 1 |
| `metas` | `/metas` | 1 |
| `ajustes` | `/ajustes`, `/ajustes/apariencia`, `/ajustes/ciclo`, `/ajustes/diagnostico`, `/ajustes/exportar`, `/ajustes/formatos`, `/ajustes/instituciones`, `/ajustes/instituciones/[institucionId]`, `/ajustes/instituciones/nueva`, `/ajustes/notificaciones`, `/ajustes/respaldo`, `/ajustes/seguridad`, `/ajustes/seguridad/factores/[factorId]/quitar`, `/ajustes/seguridad/factores/nuevo`, `/ajustes/webhook` | 15 |
| `programadas` | `/programadas` | 1 |
| `reglas` | `/reglas` | 1 |
| `porCobrar` | `/por-cobrar`, `/por-cobrar/deudores/[deudorId]/renombrar` | 2 |
| `estructura` | `/presupuesto/estructura`, `/presupuesto/estructura/categorias/[categoriaId]`, `/presupuesto/estructura/categorias/nueva`, `/presupuesto/estructura/grupos/[grupoId]`, `/presupuesto/estructura/grupos/nuevo`, `/presupuesto/estructura/plantilla` | 6 |
| `notificaciones` | `/notificaciones` | 1 |
| `formulario` | `/actividad/[transaccionId]/devolver`, `/actividad/[transaccionId]/editar`, `/ajustes/formatos/[formatoId]`, `/ajustes/formatos/nuevo`, `/bandeja/[movimientoId]`, `/cuentas/[cuentaId]/conciliar`, `/cuentas/[cuentaId]/condiciones`, `/cuentas/[cuentaId]/cuota`, `/cuentas/[cuentaId]/editar`, `/cuentas/[cuentaId]/pagar`, `/cuentas/[cuentaId]/verificar-saldo`, `/cuentas/nueva`, `/metas/[metaId]`, `/metas/nueva`, `/por-cobrar/cobrar`, `/por-cobrar/condonar/[lineaId]`, `/presupuesto/asignar/[categoriaId]`, `/presupuesto/categorias/[categoriaId]/archivar`, `/presupuesto/categorias/[categoriaId]/fusionar`, `/presupuesto/categorias/[categoriaId]/sacar`, `/presupuesto/mover`, `/programadas/[programadaId]`, `/programadas/[programadaId]/ocurrencias/[fechaEsperada]`, `/programadas/nueva`, `/registrar/[tipo]`, `/registrar/gasto`, `/reglas/[reglaId]`, `/reglas/nueva` | 28 |

Las funciones que no son consultas de 04 §6 tienen su pantalla en 15.3.

### 15.2 Operaciones → pantallas y componentes

"Componente" es la carpeta del flujo en `flujos/` (FE-59) para los flujos largos y cortos, la página para las acciones dentro de una pantalla y el lugar de 4.14 para las acciones de un toque. OP-35 (recibir un SMS) no tiene pantalla: es el webhook (04 §8).

| Operación | Ruta o lugar | Clase | Componente |
|---|---|---|---|
| OP-01 | `/cuentas/nueva` | [L] | `flujos/cuentas-nueva/` |
| OP-02 | `/cuentas/[cuentaId]/editar` | [L] | `flujos/cuentas-editar/` |
| OP-03 | `/cuentas/ordenar` | [C] | `flujos/cuentas-ordenar/` |
| OP-04 | `/cuentas/[cuentaId]/archivar` | [C] | `flujos/cuentas-archivar/` |
| OP-05 | `/cuentas/[cuentaId]` | [D] | página `/cuentas/[cuentaId]` [1T] |
| OP-05 | acción de un toque | [1T] | `cuentas/[cuentaId]` |
| OP-06 | `/cuentas/[cuentaId]/eliminar` | [C] | `flujos/cuentas-eliminar/` |
| OP-07 | `/presupuesto/estructura/categorias/nueva` | [C] | `flujos/presupuesto-estructura-categorias-nueva/` |
| OP-07 | `/presupuesto/estructura/grupos/nuevo` | [C] | `flujos/presupuesto-estructura-grupos-nuevo/` |
| OP-07 | `/presupuesto/estructura/plantilla` | [L] | `flujos/presupuesto-estructura-plantilla/` |
| OP-08 | `/presupuesto/estructura` | [L] | `flujos/presupuesto-estructura/` |
| OP-08 | `/presupuesto/estructura/categorias/[categoriaId]` | [C] | `flujos/presupuesto-estructura-categorias-categoria/` |
| OP-08 | `/presupuesto/estructura/grupos/[grupoId]` | [C] | `flujos/presupuesto-estructura-grupos-grupo/` |
| OP-08 | acción de un toque | [1T] | `presupuesto/estructura` |
| OP-09 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-09 | `/presupuesto/categorias/[categoriaId]/archivar` | [L] | `flujos/presupuesto-categorias-archivar/` |
| OP-10 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-10 | `/presupuesto/estructura/categorias/[categoriaId]` | [C] | `flujos/presupuesto-estructura-categorias-categoria/` |
| OP-10 | acción de un toque | [1T] | `presupuesto/estructura/categorias/[categoriaId]`, detalle de la categoría |
| OP-11 | `/` | [P] | página `/` [1T] |
| OP-11 | `/presupuesto` | [P] | página `/presupuesto` |
| OP-11 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-11 | `/presupuesto/categorias/[categoriaId]/sacar` | [C] | `flujos/presupuesto-categorias-sacar/` |
| OP-11 | acción de un toque | [1T] | Donde aparece el aviso |
| OP-12 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-12 | `/presupuesto/categorias/[categoriaId]/fusionar` | [L] | `flujos/presupuesto-categorias-fusionar/` |
| OP-13 | `/presupuesto/estructura/categorias/[categoriaId]` | [C] | `flujos/presupuesto-estructura-categorias-categoria/` |
| OP-13 | `/presupuesto/estructura/grupos/[grupoId]` | [C] | `flujos/presupuesto-estructura-grupos-grupo/` |
| OP-14 | `/` | [P] | página `/` [1T] |
| OP-14 | `/presupuesto` | [P] | página `/presupuesto` |
| OP-14 | `/presupuesto/asignar/[categoriaId]` | [C] | `flujos/presupuesto-asignar-categoria/` |
| OP-14 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-14 | acción de un toque | [1T] | Donde aparece el aviso |
| OP-14 | acción de un toque | [1T] | Donde aparece el hallazgo |
| OP-15 | `/presupuesto` | [P] | página `/presupuesto` |
| OP-15 | `/presupuesto/mover` | [C] | `flujos/presupuesto-mover/` |
| OP-15 | acción de un toque | [1T] | Donde aparece el hallazgo |
| OP-16 | `/presupuesto` | [P] | página `/presupuesto` |
| OP-16 | `/presupuesto/asignar/[categoriaId]` | [C] | `flujos/presupuesto-asignar-categoria/` |
| OP-17 | `/presupuesto` | [P] | página `/presupuesto` |
| OP-17 | `/presupuesto/auto-asignar` | [C] | `flujos/presupuesto-auto-asignar/` |
| OP-18 | `/metas/[metaId]` | [C] | `flujos/metas-meta/` |
| OP-18 | `/metas/nueva` | [C] | `flujos/metas-nueva/` |
| OP-18 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-18 | acción de un toque | [1T] | Donde aparece el hallazgo |
| OP-19 | `/ajustes/ciclo` | [C] | `flujos/ajustes-ciclo/` |
| OP-20 | `/registrar/gasto` | [L] | `flujos/registrar-gasto/` |
| OP-21 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-22 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-23 | `/cuentas/[cuentaId]/pagar` | [C] | `flujos/cuentas-pagar/` |
| OP-23 | `/presupuesto/categorias/[categoriaId]` | [D] | página `/presupuesto/categorias/[categoriaId]` [1T] |
| OP-23 | `/registrar` | [C] | `flujos/registrar/` |
| OP-24 | `/cuentas/[cuentaId]/cuota` | [C] | `flujos/cuentas-cuota/` |
| OP-24 | `/registrar` | [C] | `flujos/registrar/` |
| OP-25 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-26 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-27 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-28 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-28 | `/actividad/[transaccionId]/editar` | [L] | `flujos/actividad-editar/` |
| OP-29 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-29 | `/actividad/[transaccionId]/eliminar` | [C] | `flujos/actividad-eliminar/` |
| OP-30 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-30 | `/actividad/[transaccionId]/estado` | [C] | `flujos/actividad-estado/` |
| OP-31 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-31 | `/por-cobrar/cobrar` | [C] | `flujos/por-cobrar-cobrar/` |
| OP-31 | `/registrar` | [C] | `flujos/registrar/` |
| OP-32 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-32 | `/por-cobrar/condonar/[lineaId]` | [C] | `flujos/por-cobrar-condonar-linea/` |
| OP-33 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-33 | `/actividad/[transaccionId]/devolver` | [L] | `flujos/actividad-devolver/` |
| OP-33 | `/registrar/[tipo]` | [C] | `flujos/registrar-tipo/` |
| OP-34 | `/actividad/[transaccionId]` | [D] | página `/actividad/[transaccionId]` |
| OP-34 | `/actividad/[transaccionId]/eventos/eliminar` | [C] | `flujos/actividad-eventos-eliminar/` |
| OP-36 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-37 | `/bandeja` | [P] | página `/bandeja` [1T] |
| OP-37 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-37 | acción de un toque | [1T] | Bandeja |
| OP-38 | `/bandeja` | [P] | página `/bandeja` [1T] |
| OP-38 | acción de un toque | [1T] | Bandeja |
| OP-39 | `/bandeja` | [P] | página `/bandeja` [1T] |
| OP-39 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-39 | acción de un toque | [1T] | Bandeja (descartados) |
| OP-39 | acción de un toque | [1T] | Bandeja, `bandeja/[movimientoId]` |
| OP-40 | `/bandeja` | [P] | página `/bandeja` [1T] |
| OP-40 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-40 | acción de un toque | [1T] | Bandeja, `bandeja/[movimientoId]` |
| OP-41 | `/bandeja` | [P] | página `/bandeja` [1T] |
| OP-41 | `/reglas/[reglaId]` | [C] | `flujos/reglas-regla/` |
| OP-41 | `/reglas/nueva` | [C] | `flujos/reglas-nueva/` |
| OP-41 | acción de un toque | [1T] | Donde aparece el aviso |
| OP-42 | `/programadas` | [S] | página `/programadas` [1T] |
| OP-42 | `/programadas/[programadaId]` | [L] | `flujos/programadas-programada/` |
| OP-42 | `/programadas/nueva` | [L] | `flujos/programadas-nueva/` |
| OP-42 | acción de un toque | [1T] | Donde aparece el hallazgo |
| OP-42 | acción de un toque | [1T] | Programadas, `programadas/[programadaId]` |
| OP-42 | acción de un toque | [1T] | Ídem |
| OP-43 | `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` | [C] | `flujos/programadas-ocurrencias-fecha-esperada/` |
| OP-44 | `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` | [C] | `flujos/programadas-ocurrencias-fecha-esperada/` |
| OP-45 | `/cuentas/[cuentaId]/conciliar` | [L] | `flujos/cuentas-conciliar/` |
| OP-46 | `/cuentas/[cuentaId]/conciliar` | [L] | `flujos/cuentas-conciliar/` |
| OP-47 | `/cuentas/[cuentaId]/conciliar` | [L] | `flujos/cuentas-conciliar/` |
| OP-48 | `/cuentas/[cuentaId]/condiciones` | [L] | `flujos/cuentas-condiciones/` |
| OP-49 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-50 | `/bandeja/[movimientoId]` | [L] | `flujos/bandeja-movimiento/` |
| OP-51 | `/programadas/[programadaId]` | [L] | `flujos/programadas-programada/` |
| OP-52 | `/por-cobrar/deudores/[deudorId]/renombrar` | [C] | `flujos/por-cobrar-deudores-renombrar/` |
| OP-53 | `/cuentas/[cuentaId]/verificar-saldo` | [L] | `flujos/cuentas-verificar-saldo/` |
| OPT-01 | `/ajustes/webhook` | [C] | `flujos/ajustes-webhook/` |
| OPT-02 | `/` | [P] | página `/` [1T] |
| OPT-02 | `/ajustes/notificaciones` | [S] | página `/ajustes/notificaciones` |
| OPT-03 | `/ajustes/notificaciones` | [S] | página `/ajustes/notificaciones` |
| OPT-04 | `/` | [P] | página `/` [1T] |
| OPT-04 | `/notificaciones` | [S] | página `/notificaciones` [1T] |
| OPT-04 | acción de un toque | [1T] | Notificaciones, Inicio (cambios retroactivos) |
| OPT-05 | `/ajustes/formatos/[formatoId]` | [L] | `flujos/ajustes-formatos-formato/` |
| OPT-05 | `/ajustes/formatos/nuevo` | [L] | `flujos/ajustes-formatos-nuevo/` |
| OPT-06 | `/ajustes/formatos/[formatoId]` | [L] | `flujos/ajustes-formatos-formato/` |
| OPT-06 | `/ajustes/formatos/nuevo` | [L] | `flujos/ajustes-formatos-nuevo/` |
| OPT-07 | `/ajustes/instituciones/[institucionId]` | [C] | `flujos/ajustes-instituciones-institucion/` |
| OPT-07 | `/ajustes/instituciones/nueva` | [C] | `flujos/ajustes-instituciones-nueva/` |
| OPT-08 | `/ajustes/exportar` | [S] | página `/ajustes/exportar` |
| OPT-09 | `/ajustes/respaldo` | [S] | página `/ajustes/respaldo` |

### 15.3 Funciones que no son consultas ni operaciones de 04 §6 y §3

| Función | Pantalla o pieza | Componente | Origen |
|---|---|---|---|
| `estadoAcceso()` | `/ingresar`, `/ingresar/verificar`, `/ingresar/inscribir` | Páginas de `ingresar/` (Server) | CP-11, 9.2 |
| `ingresar()` | `/ingresar` | Formulario de acceso | CP-11, 9.3 |
| `verificarFactor()` | `/ingresar/verificar` | Campo de código (9.4) | CP-11 |
| `iniciarInscripcion()`, `completarInscripcion()` | `/ingresar/inscribir`, `/ajustes/seguridad/factores/nuevo` | Inscripción (9.5) | CP-11 |
| `estadoSeguridad()` | `/ajustes/seguridad` y sus flujos | Lista de factores (9.6) | CP-4 |
| `quitarFactor()` | `/ajustes/seguridad/factores/[factorId]/quitar` | `flujos/ajustes-seguridad-factores-quitar/` | CP-11 |
| `cerrarOtrasSesiones()` | `/ajustes/seguridad` | Acción de un toque | CP-11, 4.14 |
| `salir()` | `/ajustes/seguridad`, `/ingresar/verificar` ("Usar otra cuenta") | — | CP-11 |
| `consultas.sugerencia()` | `/registrar/gasto`, `/bandeja/[movimientoId]`, flujos de programadas | `useLecturaInteractiva` en el campo de comercio | CP-3, 4.12 |
| `formulario({ operacion: 'devolver', busqueda })` | `/registrar/[tipo]` (`devolucion`), `/actividad/[transaccionId]/devolver` | `Buscador` de compras (10.7) | CP-3 |
| `GET /api/exportar/{json, csv}` (OPT-08) | `/ajustes/exportar` | Enlaces de descarga | 04 2.2.1 |
| `POST /api/notificaciones/accion` | Service worker | `notificationclick` (8.6) | 04 11.5 |
| `GET /serwist/[path]` | Service worker | `createSerwistRoute` (8.1) | CP-17 |
| Destinos de las notificaciones | Centro de notificaciones, service worker | `destinos.ts` (3.5) | CP-1 |

### 15.4 Pantallas clave → componentes de dominio

| Pantalla | Consulta | Componentes de 10.8 |
|---|---|---|
| `/` Inicio | `inicio` | **[F6]** `ResumenListoParaAsignar` (`billete`), `Aviso`, `FilaTransaccion` (recientes), `IndicadorEstado`, `Monto` |
| `/presupuesto` | `presupuesto` | `SelectorPeriodo`, `ResumenListoParaAsignar`, `FilaCategoria`, `FilaPagoTarjeta`, `ResumenMeta`, `IndicadorEstado` |
| `/presupuesto/categorias/[categoriaId]` | `detalleCategoria` | `SelectorPeriodo`, `Monto`, `IndicadorEstado`, `ResumenMeta`, `BarraProgreso`, `GraficoBarras` (calendario e historial), `FilaTransaccion` |
| `/bandeja` | `bandeja` | `MovimientoBandeja`, `Resultado`, `Pestanas` (activos, descartados), **[F6]** `PanelDestinosArrastre` |
| `/registrar/gasto` | `formulario` (`registrar`, `gasto`) | `EntradaMonto`, `EntradaFecha`, `CampoLineas`, `Buscador` (comercio), `ConfirmacionImpacto` |
| `/cuentas` | `cuentas` | `TarjetaCredito`, `FilaCuenta`, `BarraProgreso` (uso del límite), `Monto` |
| `/cuentas/[cuentaId]` | `detalleCuenta` | `SelectorPeriodo`, `FilaTransaccion`, `Aviso` (AV-21), `Monto` |
| `/actividad` | `actividad` | `FilaTransaccion`, `EstadoVacio` (sin resultados) |
| `/reportes/[tipo]` | `reporte` | `GraficoBarras`, `GraficoLineas` (con `referencia` en el gasto semanal), `GraficoDona` (`categorias`), tabla equivalente |
| `/metas` | `metas` | `ResumenMeta`, `BarraProgreso`, `IndicadorEstado` |

### 15.5 Nombre de la carpeta de un flujo (FE-59)

`flujos/<carpeta>/` se nombra a partir de la ruta: los segmentos sin los ids (`[…Id]`), en minúscula y con guiones; si la ruta **termina** en un id, se agrega su nombre sin "Id". Ejemplos: `/registrar/gasto` → `registrar-gasto`; `/cuentas/[cuentaId]/pagar` → `cuentas-pagar`; `/bandeja/[movimientoId]` → `bandeja-movimiento`; `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` → `programadas-ocurrencias-fecha-esperada`. El script de 15 comprueba que no haya dos flujos con la misma carpeta (hoy no hay ninguno).

*Justificación:* un nombre que se deriva de la ruta no hay que decidirlo en la Fase 8 y se encuentra sin buscar. *Alternativa descartada:* nombres libres por flujo (dos agentes podrían nombrar distinto el mismo flujo).

---

## 16. Supuestos, riesgos y preguntas

Consolida las anotaciones D-1 a D-11 (0.11) y lo que salió de la Parte D. Al cerrar la fase, esta sección y 0.9 son la lista de lo que se lleva a otros documentos.

### 16.1 Supuestos

| # | Supuesto | Origen | Consecuencia si no se cumple |
|---|---|---|---|
| S-1 | La app solo funciona con conexión; sin red se ve la pantalla que estaba abierta o `/sin-conexion`, nunca números guardados | 02 ADR-13, FE-20, FE-53 | — (es una decisión) |
| S-2 | Los borradores de los flujos largos guardan montos y comercios en `sessionStorage` mientras la pestaña está abierta | Paso 1, FE-14, D-5 | Si se quisiera cero datos en el dispositivo, los flujos largos perderían lo escrito al vencer la sesión |
| S-3 | "Aprobar" con un toque aprueba la versión del movimiento que está en el servidor; el resultado muestra lo aprobado | PB-3, CP-15, D-7 | — (aceptado) |
| S-4 | El INP se mide solo en el laboratorio | D-9, 13.4 | Una lentitud que solo aparezca en el teléfono real se detecta en la prueba manual (8.8), no en CI |
| S-5 | El usuario usa sobre todo Chrome en Android; Safari en iPhone recibe push solo con la app instalada | 8.6 | En iPhone sin instalar no hay notificaciones; Ajustes lo explica |
| S-6 | La identidad visual llega de Claude Design con el encargo del Anexo A; hasta entonces, valores neutros | PF-1, 10.10 | La Fase 8 puede avanzar con los provisionales; la integración del diseño solo cambia `tokens.css`, estilos y recursos |
| S-7 | Las pruebas E2E corren contra la compilación de producción en el entorno de CI de 04 14.1 | 14.1 | — |

### 16.2 Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación | Origen |
|---|---|---|---|---|---|
| RF-1 | Atrás y adelante muestran una página restaurada de la caché del enrutador con datos de hace un rato | Alta | Bajo | FE-21 refresca si tiene más de 30 s; V5-22 lo confirmó | D-1 |
| RF-2 | Las Server Actions van de una en una: una lectura interactiva lenta retrasa una escritura | Media | Bajo | Lecturas interactivas dentro de 30 ms (CP-3), espera de 300 ms y cancelación (FE-15) | D-2 |
| RF-3 | Sin Skew Protection, una pestaña vieja choca con una versión nueva | Media | Medio | Código del cliente: el service worker viejo sigue sirviendo sus archivos (V5-33b). Server Actions cambiadas: FE-13 ("Hay una versión nueva"). Regla para la Fase 8: no renombrar acciones sin necesidad | D-3, FE-55 |
| RF-4 | Una actualización de ICU cambia formatos de `Intl` | Baja | Medio | Pruebas de 5.4 y E2E de 04 7.10 | D-4 |
| RF-5 | Un error que no pasa por `consultar()` llega con el `digest` numérico de Next y no se encuentra en el diagnóstico | Baja | Bajo | Todas las consultas pasan por `consultar()`; los registros de Vercel guardan una hora | D-6 |
| RF-6 | Un toque antes de la hidratación no da señal hasta que termina de cargar el JS | Media | Bajo | Estado presionado solo con CSS (10.9); presupuesto de JS (§13) | D-8, V5-21b |
| RF-7 | El JS compartido (≈ 139 KB) deja poco margen bajo los 170 KB | Media | Medio | Reglas de 13.3; control de CI por PR | D-10 |
| RF-8 | La biblioteca de formularios mide 46 a 48 KB de su presupuesto de 50 KB (V5-35): una versión nueva de React Hook Form o Zod puede pasarse | Media | Medio | El control de CI lo detecta en el PR de la actualización; opciones entonces: fijar la versión o reabrir PA-1 (`zod/mini`, −11 KB) | D-11 *(D)* |
| RF-9 | Next cambia comportamientos internos de los que dependen decisiones verificadas: el `digest` de V5-15, el salto a navegación de documento de V5-30b, `useLinkStatus` de V5-19 | Media | Medio | Versiones fijas en el `pnpm-lock`; cada V5-nn tiene su prueba en la E2E (14.5) y una actualización de Next las corre antes de fusionarse | *(D)* |
| RF-10 | `@serwist/turbopack` es reciente y depende de esbuild en la compilación | Media | Medio | Versión fija (9.5.13); plan alternativo ya evaluado: compilar `sw.ts` con un script de esbuild y `@serwist/build` después de `next build` (FE-52) | *(D)* |
| RF-11 | El precache crece con cada ruta y se descarga una vez por versión | Media | Bajo | El job de 13.4 informa el tamaño y falla por encima de 1,5 MB con gzip (PD-1, **[R4]**) | *(D)* |
| RF-12 | La entrega real de push y la activación al tocar una notificación no se pueden probar en CI | Alta | Medio | Eventos sintéticos en CI (V5-32) y prueba manual en el teléfono antes de cerrar la Fase 8 (8.8) | *(D)* |
| RF-13 | Playwright no aplica `setOffline` a los pedidos del service worker | Alta | Bajo | Las pruebas sin conexión detienen además el servidor (8.8) | *(D)*, V5-30 |
| RF-14 | Con la identidad provisional, las pruebas de accesibilidad pasan, pero la identidad nueva puede no pasarlas | Media | Medio | El diseño valida con `contraste.py` y axe antes de integrarse (10.10) | *(C)* |

### 16.3 Cambios propuestos a 04

**Aplicados a `04-backend.md` al cerrar la fase** (marca **[F5]**, tabla en su §0.9.1 y una línea en sus "Enmiendas posteriores").

| CP | Qué cambia | Estado |
|---|---|---|
| CP-1 | Catálogo cerrado de destinos de las notificaciones y `CargaPush` | Aprobado |
| CP-2 | `bandejaPorRevisar` en el `Encabezado` | Aprobado |
| CP-3 | Lecturas interactivas por Server Action (lista cerrada) | Aprobado |
| CP-4 | `estadoSeguridad()` para Ajustes > Seguridad | Aprobado |
| CP-5 | Permiso de notificaciones solo tras un gesto | Aprobado |
| CP-6 | Excepción de aritmética de ayuda visual en el cliente | Aprobado |
| CP-7 | Forma de importar Zod en los contratos | Aprobado (PA-1) |
| CP-8 | `Propuesta` con la entrada completa | Aprobado (PA-2) |
| CP-9 a CP-14 | Navegación entre períodos, variantes de formulario, autenticación, filtros de reportes, `ExcepcionFinn` y `x-finn-ruta` | Aprobados (Parte B) |
| CP-15 | `aprobado` en la salida de OP-37 | Aprobado (R2) |
| CP-16 | Variante `formulario({ operacion: 'conciliar' })` | Aprobado (R2) |
| CP-17 | Route Handler `GET /serwist/[path]` y su exclusión en `proxy.ts` | Aprobado **[R4]** |
| CP-18 | `etiqueta` en `CargaPush` | Aprobado **[R4]** |

### 16.4 Precisiones y enmiendas a 00, 01 y 02

| # | Documento | Estado |
|---|---|---|
| PF-1 | 02 ADR-14: se conservan las herramientas y se retira la identidad de la 1.0 | Aprobada; anotada en 02 |
| PF-2 | 00 H1, 01 AV-02 y AV-03, 02 ADR-14: color e indicador no cromático con nombre | Aprobada; anotada en 00, 01 y 02 |
| PF-3 | 02 ADR-07 y, vía CP-6, 04 §1.3 y §13.3: sumas de ayuda visual en el cliente | Aprobada; anotada en 02 y aplicada en 04 |

### 16.5 Preguntas de la Parte D (resueltas) **[R4]**

PD-1 se aprobó con la recomendación: el service worker guarda todos los archivos estáticos de la versión, con el tamaño informado en cada PR y un límite de **1,5 MB con gzip** (8.3, 13.1, 13.4).

| # | Pregunta | Recomendación | Alternativas |
|---|---|---|---|
| PD-1 | **Qué guarda el precache.** Por defecto, Serwist precachea todo `/_next/static` (el JS y el CSS de todas las rutas). En la app de prueba son 248 KB con gzip para 12 páginas; en la app real será más, y se descarga una vez por versión, con datos móviles si el teléfono no está en wifi. A cambio, las navegaciones no vuelven a descargar código y una pestaña vieja sigue funcionando hasta "Recargar" (V5-33b) | **Precachear todo `/_next/static`**, con el tamaño informado en cada PR por el job de 13.4 y un límite de **1,5 MB con gzip** que falla la CI si se supera. Si se acerca al límite, se reduce a las rutas de las secciones principales | (b) Precachear solo `/sin-conexion` con sus archivos y los íconos (unos 150 KB): menos datos, pero se pierde la protección de la pestaña vieja (D-3) y cada pantalla nueva descarga su JS. (c) Precachear solo las secciones principales desde el inicio |

### 16.6 Lo que esta fase deja a las siguientes

| Para | Qué |
|---|---|
| Claude Design | El Anexo A, como encargo autocontenido |
| Fase 6 | Las fórmulas de los reportes de §16 de 04 (`datos_base`); la pantalla `/reportes/[tipo]` ya tiene ruta y contrato de gráficos |
| Fase 7 | Las pruebas, con las convenciones de §14, los estados de 14.5, los controles de 11.10, 13.4 y 8.8, y los scripts `cobertura.py` y `trazabilidad.py` en `tools/docs/fase5/` **[CH-18]** |
| Fase 8 | La implementación: cada pantalla con su fila de §2, su consulta, sus operaciones (§15), sus estados (§7) y sus componentes (§10); los cambios CP-1 a CP-18 en 04 |

---

## Anexo A. Encargo para Claude Design **[R3]**

*Este anexo se entrega tal cual a Claude Design y se lee sin el resto de los documentos. Es el encargo, no el diseño: no contiene decisiones visuales. Todo valor marcado "provisional" es neutro y existe solo para que la app funcione mientras se integra la identidad.*

### A.0 Punto de partida **[R4]**

**Ya existe una exploración de identidad en este proyecto de Claude Design.** La dirección elegida es la síntesis **"Propuesta 1 — Precisa, tranquila y con pulso"**, con su set de tokens **"F · Precisión con voz de basalto"** (en adelante, "F"). Se nutre de las exploraciones **"1 · Sobres"** y **"5 · Foco"** (componentes y pantallas) y de las ideas que la síntesis rescata de **Sobres, Foco, Caudal y Calendario**. Las direcciones **C** y **E** son antecedentes: se consultan, pero no mandan.

"Desde cero" significa solo que no se conserva nada de Finn 1.0. **El trabajo es partir de la identidad F y llevarla a este contrato, no reemplazarla:**

1. **Mapear cada token de F a los nombres de A.3.** Lo que no tenga equivalente se agrega como token nuevo, con las condiciones de A.10.
2. **Revisar la identidad contra la regla de las tres señales (A.4) y los mínimos de A.5, en los dos temas.** Si algún color de F no cumple el contraste como texto o como borde (por ejemplo, un acento amarillo sobre un fondo claro), se ajusta su valor o se limita su uso a fondos o rellenos donde sí cumpla, y se informa.
3. **Aplicar la identidad a los componentes de A.6 y a las pantallas de A.7, con sus datos reales**, y refinarla donde las pantallas reales lo pidan (por ejemplo, montos largos, varias líneas en un gasto dividido, una bandeja con muchos movimientos).
4. **Donde la exploración contradiga este contrato, manda el contrato.** Por ejemplo: nombres de tokens o de estados distintos, términos distintos de los de A.4, una navegación que no cumpla N1 a N8, estados que solo se distinguen por color, montos sin cifras tabulares. Se lista cada caso y cómo se resolvió.

**Entregables adicionales de este punto de partida** (se suman a los de A.10):
- una tabla **"token de F → token del contrato"**, con una fila por token de F (y "nuevo" cuando se agregó, o "no se usa" con el motivo);
- la **lista de ajustes hechos a la identidad original**, cada uno con su motivo (contraste, tres señales, contrato, pantallas reales).

### A.1 Qué es Finn

Finn es una aplicación web personal (que se instala como app en el teléfono) para llevar un **presupuesto base cero**: cada dólar que entra recibe un trabajo. El usuario vive en El Salvador, usa dólares y tarjetas de crédito con ciclos de corte y pago, y registra sus gastos a mano o desde los SMS de su banco, que llegan a una **bandeja** para revisarlos. Cada período (por ejemplo, del 21 de septiembre al 20 de octubre) reparte lo que tiene en categorías, ve cuánto le queda en cada una y si se pasó, y sabe cuánto le falta reservar para pagar cada tarjeta. Es una app de un solo usuario, en español, que se usa sobre todo en un Android de gama media, con una mano, y a veces en la computadora.

**Tono:** calma y control. El usuario debe sentir que sabe dónde está su dinero, también cuando algo salió mal. Sin alarmismo, sin culpa, sin celebraciones exageradas. Los textos usan el **voseo** salvadoreño ("Te falta reservar $18.75 para Visa Oro", "Asignaste más de lo que tenés", "Revisala en la bandeja"). Montos como `$1,234.50`, negativos como `-$45.00`, fechas como `15/10/2026` o `15 oct`.

### A.2 Qué se espera del diseño

1. La **identidad visual** de Finn 2.0, **partiendo de la dirección ya elegida en este proyecto (A.0)** y llevada al contrato de este anexo: colores, tipografía, glifos de los estados, forma de la navegación y de los contenedores, disposición de las pantallas. No se conserva nada de Finn 1.0. **[R4]**
2. Los **valores** de todos los tokens de A.3 para los temas claro y oscuro, y los tokens, roles y variantes nuevos que la identidad necesite.
3. Los estilos de los componentes de A.6.
4. Los recursos de marca de A.9.
5. Las pantallas clave de A.7 en teléfono y computadora, con los estados que se indican.

### A.3 Tokens

Los nombres son fijos; los valores son provisionales y los reemplaza el diseño. Se pueden **agregar** tokens; no se pueden renombrar ni quitar los existentes (A.10).

**Superficies, bordes y texto**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `fondo` | Fondo de la app | #FAFAFA | #09090B |
| `superficie` | Contenedores, filas, campos | #FFFFFF | #18181B |
| `superficie-elevada` | Lo que se superpone (flujos cortos, menús) | #FFFFFF | #27272A |
| `superficie-hundida` | Zonas secundarias, controles deshabilitados | #F4F4F5 | #111113 |
| `borde-sutil` | Separadores decorativos | #E4E4E7 | #27272A |
| `borde-control` | Borde de campos, casillas, interruptores | #8A8A93 | #7C7C85 |
| `foco` | Anillo de foco del teclado | #18181B | #FAFAFA |
| `velo` | Fondo detrás de un superpuesto | rgba(9,9,11,.5) | rgba(0,0,0,.6) |
| `texto` | Texto principal y montos | #18181B | #FAFAFA |
| `texto-secundario` | Etiquetas, metadatos | #52525B | #A1A1AA |
| `texto-terciario` | Notas, ayudas | #63636B | #9A9AA3 |
| `texto-deshabilitado` | Solo controles deshabilitados | #A1A1AA | #52525B |
| `enlace` | Enlaces dentro de un texto | #1D4ED8 | #93C5FD |

**Acción**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `accion`, `accion-hover`, `accion-presionada` | Botón principal en sus tres estados | #18181B, #3F3F46, #27272A | #FAFAFA, #E4E4E7, #D4D4D8 |
| `texto-sobre-accion` | Texto del botón principal | #FFFFFF | #18181B |
| `accion-secundaria` | Fondo del botón secundario | #F4F4F5 | #27272A |
| `peligro`, `texto-sobre-peligro` | Acciones destructivas (eliminar) | #B91C1C, #FFFFFF | #F87171, #18181B |

**Estados financieros** (cada uno con `-texto`, `-fondo` y `-borde`; qué significan en A.4)

| Estado | Texto (claro / oscuro) | Fondo (claro / oscuro) | Borde (claro / oscuro) |
|---|---|---|---|
| `positivo` | #166534 / #86EFAC | #F0FDF4 / #052E16 | #15803D / #22C55E |
| `cero` | #3F3F46 / #D4D4D8 | #F4F4F5 / #27272A | #71717A / #A1A1AA |
| `advertencia` | #854D0E / #FDE68A | #FEFCE8 / #422006 | #A16207 / #EAB308 |
| `problema` | #991B1B / #FCA5A5 | #FEF2F2 / #450A0A | #DC2626 / #EF4444 |
| `deuda` | #1E3A8A / #BFDBFE | #EFF6FF / #172554 | #2563EB / #3B82F6 |
| `deuda-sin-respaldo` | #6B21A8 / #E9D5FF | #FAF5FF / #3B0764 | #9333EA / #A855F7 |
| `informacion` | #155E75 / #A5F3FC | #ECFEFF / #083344 | #0E7490 / #06B6D4 |

`deuda-sin-respaldo` es un nombre interno; en pantalla se lee "Deuda sin reservar" o "Te falta reservar" (A.4).

**Gráficos**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `grafico-serie-1` a `grafico-serie-8` | Paleta categórica: porciones de la dona de gasto por categoría y series de líneas y barras. Con más de 8 categorías, el resto va en "Otras" | #2563EB, #C2410C, #15803D, #9333EA, #BE185D, #0E7490, #A16207, #52525B | #60A5FA, #FB923C, #4ADE80, #C084FC, #F472B6, #22D3EE, #FACC15, #A1A1AA |
| `grafico-referencia` | Líneas de referencia: lo asignado por semana, una meta, un límite | #3F3F46 | #D4D4D8 |
| `grafico-rejilla` | Rejilla y ejes secundarios (decorativos) | #E4E4E7 | #3F3F46 |

Reglas: cada serie se distingue **también sin color** (etiqueta directa, patrón o marcador distinto, y siempre una tabla con los mismos datos); cada serie y la referencia tienen contraste 3:1 contra `fondo`, `superficie` y `superficie-elevada`; la referencia se distingue además por la forma de su línea; la paleta categórica **no** usa los colores de los estados financieros, para que una categoría no parezca "problema" o "positivo".

**Marca**

| Token | Para qué | Provisional |
|---|---|---|
| `marca` | Acento de identidad opcional (símbolo, ingreso, algún detalle del marco). Si el diseño no lo usa, es igual a `accion` | `accion` |
| `texto-sobre-marca` | Texto sobre `marca` | `texto-sobre-accion` |
| `marca-icono-fondo`, `marca-icono-figura` | Colores fijos de los íconos de la app y del manifiesto (no admiten variables) | — (los define el diseño) |

El botón principal siempre usa `accion`, nunca `marca`.

**Otras familias** (nombres fijos, valores provisionales)

| Familia | Tokens | Provisional |
|---|---|---|
| Espaciado | Escala de múltiplos de una unidad base | 4 px |
| Radios | `radio-control`, `radio-contenedor`, `radio-pastilla` | 6 px, 12 px, redondo |
| Elevación | `elevacion-1` (filas, tarjetas), `elevacion-2` (menús), `elevacion-3` (superpuestos) | Sombras grises suaves |
| Movimiento | `duracion-rapida`, `duracion-normal`, `duracion-lenta`, `curva-estandar` | 120, 200 y 300 ms; `cubic-bezier(.2,0,0,1)` |
| Capas | `capa-marco`, `capa-superpuesto`, `capa-aviso` | 10, 40, 50 |
| Táctil | `tactil-minimo` | 44 px |

### A.4 Estados financieros y la regla de las tres señales

| Situación (en palabras simples) | Estado | Etiqueta en pantalla |
|---|---|---|
| A una categoría le queda dinero | `positivo` | — (el número lo dice) |
| A una categoría no le queda nada, sin pasarse | `cero` | — |
| Se gastó más de lo que tenía la categoría, **con débito o efectivo**: ese dinero salió de lo que había para asignar | `problema` | "Sobregiro con débito o efectivo" |
| Se gastó más de lo que tenía la categoría, **con tarjeta**: no salió dinero todavía, pero es deuda que no está reservada para pagarse | `deuda-sin-respaldo` | "Deuda sin reservar" |
| Las dos cosas a la vez | Los dos indicadores | Las dos etiquetas |
| Falta asignar para cumplir la meta de una categoría | `advertencia` | "Falta para la meta" |
| Pasó la fecha de una meta sin cumplirla | `advertencia` | "Meta vencida" |
| La meta está cubierta, cumplida o completada | `positivo` | "Meta cubierta", "Meta cumplida", "Meta completada" |
| A una tarjeta le falta dinero reservado para pagar su deuda (total de la tarjeta) | `deuda-sin-respaldo` | "Te falta reservar" |
| La deuda de una tarjeta está toda reservada | `deuda` | "Deuda de tarjeta" |
| Se pagó a una tarjeta más de lo que había reservado | `problema` | "Pago excedente" |
| Hay más reservado para una tarjeta del que se necesita | `informacion` | "Reserva excedente" |
| Se asignó más dinero del que hay | `problema` | "Asignaste más de lo que tenés" |
| Hay dinero prestado a otros que todavía no vuelve | `informacion` | "En camino" |
| El saldo no coincide con el último estado de cuenta | `advertencia` | "Diferencia con el estado de cuenta" |

"Deuda sin reservar" es **por categoría**; "Te falta reservar" es **el total de la tarjeta** (la suma de lo que dejaron sin reservar todas las categorías que se pasaron con ella, más lo que no se reservó por otros motivos). Donde aparecen juntos, el diseño deja claro cuál es cuál.

**Regla de las tres señales.** Un estado nunca se comunica solo con color. Todo indicador de estado tiene:
1. **color** del estado;
2. **forma**: un glifo distinto por estado, que se distingue en escala de grises y en el modo de alto contraste;
3. **nombre**: la etiqueta, visible o leída por el lector de pantalla.

En la lista del presupuesto, el indicador de un sobregiro va **sin montos**; los montos y el desglose aparecen al tocar.

### A.5 Tipografía y mínimos de accesibilidad

**Roles tipográficos** (el diseño fija fuente, tamaño, interlineado y peso de cada uno; los componentes solo usan roles):

| Rol | Uso | Provisional (tamaño / interlineado / peso) |
|---|---|---|
| `cifra-principal` | El número principal de una pantalla ("Listo para asignar", saldo de una cuenta) | 32 px / 1,15 / 600 |
| `cifra` | Montos destacados en tarjetas y filas | 18 px / 1,3 / 600 |
| `titulo-pantalla` | Título de cada pantalla | 24 px / 1,25 / 600 |
| `titulo-seccion` | Títulos de bloque y nombres de grupo | 18 px / 1,35 / 600 |
| `cuerpo` | Texto general, campos, botones | 16 px / 1,5 / 400 |
| `cuerpo-pequeno` | Metadatos de filas | 14 px / 1,45 / 400 |
| `etiqueta` | Etiquetas de campos e indicadores | 14 px / 1,35 / 500 |

- **Cifras tabulares obligatorias** en todo monto y en toda columna de números: la fuente elegida debe tenerlas.
- Tamaños en `rem`: el texto crece con el tamaño de letra del sistema.
- Campos con 16 px como mínimo en el teléfono.
- Mientras no haya fuente propia se usa la del sistema; las que elija el diseño se autohospedan (como máximo dos familias).

**Mínimos (WCAG 2.2 AA) que el diseño debe respetar en los dos temas:**

| Requisito | Mínimo |
|---|---|
| Contraste de texto (incluidos los textos de estado sobre su fondo) | 4,5:1 |
| Contraste de bordes de controles, foco, series de gráficos y elementos gráficos con significado | 3:1 |
| Tamaño de todo control tocable (botones, enlaces de navegación, filas tocables, casillas con su etiqueta) | 44 × 44 px |
| Foco visible | Anillo de al menos 2 px con 3:1 contra el fondo, siempre visible con teclado |
| Estados | Nunca solo color (A.4); un control deshabilitado muestra su motivo en texto |
| Movimiento | Ninguna animación transmite información; con "reducir movimiento" no hay animaciones |
| Reflujo | A 320 px de ancho no hay desplazamiento horizontal, salvo dentro de tablas de datos |
| Orientación | Vertical y horizontal |
| Gestos | Ninguna acción exige arrastrar: todo gesto tiene un botón equivalente |
| Mensajes | Las confirmaciones de una acción no desaparecen solas con un tiempo; quedan en el lugar del elemento |

### A.6 Navegación y componentes

**Secciones.** Principales: Inicio, Presupuesto, Bandeja, Actividad, Cuentas. Secundarias: Reportes, Metas, Programadas, Por cobrar, Reglas, Notificaciones, Ajustes. Acceso global: Registrar.

**Requisitos de navegación** (la forma es libre: barra inferior, menú lateral, cajón, pestañas u otra):

| # | Requisito |
|---|---|
| N1 | **Registrar** se alcanza con una interacción desde cualquier pantalla principal |
| N2 | La **Bandeja**, con su contador de movimientos por revisar, está siempre visible o a una interacción |
| N3 | En Presupuesto, el **período** que se ve está siempre visible, con sus fechas y su estado (cerrado, actual, futuro o de transición), y hay una forma visible de volver al período actual |
| N4 | Cada sección tiene su dirección propia y la sección activa se marca |
| N5 | Toda sección secundaria se alcanza en dos interacciones como máximo desde cualquier pantalla principal |
| N6 | Las mismas pantallas y la misma jerarquía en teléfono y en computadora |
| N7 | El contador de notificaciones no leídas se ve junto al acceso a Notificaciones |
| N8 | Volver es predecible: cerrar un flujo vuelve a donde se abrió; el "atrás" del sistema también funciona |

**Flujos.** Las tareas cortas (asignar, mover dinero, cambiar el estado de una transacción) se abren **sobre** la pantalla actual: la forma (hoja inferior, diálogo, panel lateral) la elige el diseño. Las largas (registrar un gasto con varias líneas, revisar un movimiento de la bandeja, conciliar una cuenta) ocupan la pantalla completa.

**Componentes base**

| Componente | Variantes y estados que debe tener |
|---|---|
| Botón | Principal, secundaria, peligro, discreta; normal, hover, presionado, foco, deshabilitado (con motivo visible), enviando (con texto "Guardando…") |
| Campo con etiqueta | Normal, foco, error (mensaje en texto debajo o junto), deshabilitado, solo lectura; "Opcional" en los no obligatorios |
| Selección | Cerrada, abierta, foco, error, deshabilitada; con pocas opciones puede mostrarlas todas |
| Buscador con sugerencias | Vacío, buscando, con resultados, sin resultados, error |
| Casilla, interruptor, opciones | Marcado, desmarcado, mixto (casilla), foco, deshabilitado |
| Pestañas o vistas | Activa, inactiva, foco |
| Superpuesto (flujo corto) | Abierto, cargando, error; con título, contenido, acciones y cerrar |
| Página de flujo (flujo largo) | Igual, a pantalla completa |
| Menú de acciones | Cerrado, abierto, elemento activo, elemento de peligro |
| Aviso en línea | Uno por estado financiero, con título opcional y una acción |
| Resultado de una acción | Texto con lo que pasó ("Aprobado: SUPER SELECTOS · $45.00 · Visa Oro · Supermercado") y una salida ("Deshacer", "Ver transacción"); queda en el lugar del elemento |
| Insignia de contador | Sin dato, cero, con número |
| Esqueleto de carga | Con la forma del contenido, sin números inventados |
| Indicador de navegación en curso | En el enlace tocado y global; un estado de presionado que se vea al instante |

**Componentes de dominio**

| Componente | Muestra | Estados y variantes |
|---|---|---|
| Monto | Un monto formateado (`$1,234.50`, `-$45.00`) | Negativo, cero, positivo; con color de estado; tamaños `cifra-principal`, `cifra`, `cuerpo` |
| Indicador de estado | Color + glifo + nombre (A.4) | Uno por estado; con etiqueta visible o solo para lector de pantalla |
| Fila de categoría | Nombre, Asignado, Gastado, Disponible, meta, indicadores | Normal; sobregirada (débito, tarjeta, ambas); con meta (falta, cubierta, vencida); período cerrado (sin acción de asignar) |
| Fila de pago de tarjeta | "Te falta reservar" como número principal, reserva excedente, pago excedente | Con falta, con exceso de reserva, con pago excedente, al día |
| Resumen "Listo para asignar" | El dinero sin asignar y lo que está "en camino" | Positivo, cero, negativo, con "en camino" |
| Tarjeta de crédito | Deuda, "Te falta reservar", uso del límite, próximos corte y pago, monto para no generar intereses | Con falta de reserva, deuda reservada, saldo a favor, sin deuda |
| Fila de cuenta | Saldo y saldo confirmado por el banco | Con diferencia de conciliación, archivada |
| Barra de progreso | Porcentaje (uso del límite, progreso de una meta de ahorro) | 0, parcial, completo; con color de estado |
| Resumen de meta | Pedido y falta del período, progreso si es de ahorro | Por estado de meta; vencida |
| Aviso | Texto del sistema con una acción propuesta opcional ("Mover $25.00 a Supermercado") | Sin acción, con acción y su resultado |
| Fila de transacción | Fecha, comercio, cuenta, monto con signo, marcas (por cobrar, con devoluciones, conciliada, programada, período cerrado) | Por tipo (gasto, ingreso, transferencia, pago de tarjeta…); estado bancario (pendiente, confirmado); agrupadas por día |
| Movimiento de la bandeja | Comercio, monto, cuenta, fecha, categoría sugerida, qué falta | Pendiente, con coincidencia con un pago programado, posible duplicado, no reconocido, con error, listo para aprobar con un toque, con datos faltantes |
| Selector de período | Período actual como texto, "Período anterior", "Período siguiente", "Ir al período actual" | Activo, cerrado, futuro, de transición |
| Confirmación del impacto | Qué va a cambiar antes de guardar (avisos y montos) | Con y sin avisos |
| Líneas de un gasto dividido | Varias líneas con monto y destino (categoría o persona que debe) | Una línea, varias, con diferencia entre la suma y el total |
| Gráfico de barras y de líneas | Series con su referencia y su tabla equivalente | Con datos, vacío, un solo punto, con semanas futuras |
| Gráfico de dona | Gasto por categoría con porcentajes y tabla | Con datos, una porción, sin datos, con "Otras" |
| Estado vacío | Primer uso (guía), sección vacía (primera acción), sin resultados (quitar filtros) | Tres clases |
| Error de pantalla | "Algo salió mal y no se pudo cargar esta pantalla." con una referencia copiable y "Intentar de nuevo" | En página y en superpuesto |
| Avisos globales | "Estás sin conexión", "Hay una versión nueva" con "Recargar" | — |

### A.7 Pantallas clave, con sus datos reales

**[F7]** **CT-07.** A.7 es el estado que produce la semilla `estado-a7` (`07-pruebas-verificacion.zip`, `a7/semilla/`) pasada por el motor, **después del paso 3 del recorrido 4.2** de 06 (SUPER SELECTOS ya aprobado). La pantalla Bandeja muestra el estado **anterior** al paso 3. Ningún número de A.7 se escribe a mano. Los números que citan los CA no cambian. Cambian, por coherencia con 01: Farmacia aparece en Casa con asignado y gastado $12.35 y Disponible $0.00 (Registrar: $0.00, no $27.65); Mascota (archivada) queda en $0.00 (Inicio: sin "archivadas con Disponible"); categoría nueva **Cuota del préstamo** (grupo Deudas, asignado y Disponible $210.00); totales $997.84 · $647.95 · $1,784.51; Pago Visa Oro: arrastre $456.83, actividad $166.60, Disponible $623.43; historial de Restaurantes: abril $102.00 asignados y $12.30 de Disponible, mayo $15.90, junio $3.70, julio $18.95, agosto $99.95 asignados y $0.00; Visa Oro "para no generar intereses" **$370.63** (antes $512.40); `bandejaPorRevisar` 2 y `atencion.bandeja` 1 pendiente y 1 con coincidencia fuera de la Bandeja. Tabla completa (anterior → nuevo → dónde) en `07-pruebas.md` §28.2.

Los datos de ejemplo son realistas. En los datos reales, los montos llegan como enteros en centavos (`28715` = $287.15) y la app solo los formatea; los nombres de campo son los que recibe cada pantalla. Hoy es el 15/10/2026; el período activo va del 21/09/2026 al 20/10/2026 (30 días, quedan 5).

**Datos que tiene toda pantalla** (encabezado): `hoy` 15/10/2026 · `periodoActivo` 21/09 – 20/10/2026 · `notificacionesNoLeidas` 2 · `bandejaPorRevisar` 3.

#### Inicio (`/`) — "¿algo necesita mi atención?"

| Campo | Ejemplo |
|---|---|
| `lpa` (Listo para asignar) | $312.40 |
| `enCamino` | $40.00 (lo que Carlos le debe) |
| `lpaNegativo` | no |
| `reduccionProyectadaAlCierre` | $26.30 (lo que bajará "Listo para asignar" al cerrar el período por sobregiros con débito) |
| `atencion.bandeja` | pendientes 2, con coincidencia 1, posibles duplicados 0, no reconocidos 0, errores 0 |
| `atencion.sobregiradas` | Restaurantes (Comida fuera): sobregiro con débito de $26.30 · Gasolina (Transporte): sobregiro con tarjeta de $18.75 |
| `atencion.faltaReservar` | Visa Oro: $18.75 |
| `atencion.pagosExcedentes` | — |
| `atencion.reservaExcedente` | — |
| `atencion.proximosPagos` (7 días) | Netflix $15.49 el 17/10 (Visa Oro, se registra sola) · Cuota del préstamo $210.00 el 20/10 (Cuenta de ahorro) |
| `atencion.pagosAtrasados` | — |
| `atencion.cambiosRetroactivos` | 1: "Cambiaste la fecha de un gasto al período anterior; Listo para asignar bajó $12.00" |
| `atencion.metasVencidas` | — |
| `atencion.archivadasConDisponible` | Mascota (archivada) con $8.00, con la propuesta "Pasar $8.00 a Listo para asignar" |
| `recientes` (5) | 15/10 SUPER SELECTOS ESCALON −$35.00 (Visa Oro) · 14/10 PUMA SANTA ELENA −$30.00 (Visa Oro) · 13/10 PIZZA HUT −$18.50 (débito) · 12/10 Salario quincena +$925.00 · 11/10 FARMACIA SAN NICOLAS −$12.35 |
| `patrimonio` | activos $6,520.20 · deudas $4,852.18 · neto $1,668.02 |

Estados a diseñar: con todo esto; primer uso (sin cuentas); todo al día (nada que atender); "Listo para asignar" negativo.

#### Presupuesto (`/presupuesto`)

| Campo | Ejemplo |
|---|---|
| `periodo` | 21/09 – 20/10/2026, estado activo, 25 días transcurridos, 5 restantes |
| `navegacion` | anterior 21/08/2026 · siguiente 21/10/2026 |
| `lpa` / `enCamino` | $312.40 / $40.00 |

`grupos` → `categorias` (cada fila: `asignado`, `gastado`, `arrastre`, `disponible`, `sobregiro`, `meta`, `clasificacion`):

| Grupo | Categoría | Asignado | Gastado | Arrastre | Disponible | Sobregiro | Meta |
|---|---|---|---|---|---|---|---|
| Casa | Supermercado | $350.00 | $287.15 | $0.00 | $62.85 | — | Mensual $350.00: cubierta |
| Casa | Luz y agua | $65.00 | $58.40 | $0.00 | $6.60 | — | — |
| Casa | Internet y teléfono | $45.00 | $45.00 | $0.00 | $0.00 | — | — |
| Comida fuera | Restaurantes | $120.00 | $146.30 | $0.00 | −$26.30 | Débito $26.30 | — |
| Transporte | Gasolina | $80.00 | $98.75 | $0.00 | −$18.75 | Tarjeta $18.75 | — |
| Suscripciones | Netflix | $15.49 | $0.00 | $0.00 | $15.49 | — | Mensual $15.49: cubierta |
| Ahorro | Fondo de emergencia | $100.00 | $0.00 | $1,250.00 | $1,350.00 | — | Para el 30/06/2027, $3,000.00: pide $175.00 este período, falta $75.00 (sin fondos suficientes) |
| Ahorro | Viaje | $0.00 | $0.00 | $184.62 | $184.62 | — | Anual $1,200.00: falta $92.31 |

`pagosTarjeta`:

| Tarjeta | Asignado | Actividad | Disponible | Te falta reservar | Reserva excedente | Pago excedente |
|---|---|---|---|---|---|---|
| Visa Oro | $0.00 | $623.43 | $623.43 | $18.75 | $0.00 | — |
| Mastercard Clásica | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | — |

`totales`: asignado $775.49 · gastado $635.60 · disponible $1,574.51.

Estados a diseñar: período activo con este contenido; período cerrado (sin acciones de asignar); período futuro (solo asignado, sin gasto); filtros (todas, sobregiradas, sin fondos, cubiertas) y "sin resultados".

#### Detalle de categoría (`/presupuesto/categorias/[id]`), Restaurantes

| Campo | Ejemplo |
|---|---|
| `numeros` | asignado $120.00 · gastado $146.30 · arrastre $0.00 · disponible −$26.30 · fondo $120.00 · entradas $0.00 |
| `sobregiro` | débito, total $26.30 (parte con tarjeta $0.00, con débito $26.30) |
| `consumos` (en orden) | 23/09 LA PAMPA $42.10 débito (cubierto $42.10) · 30/09 PIZZA HUT $25.60 tarjeta (cubierto) · 05/10 STARBUCKS $8.75 débito (cubierto) · 08/10 CAMPERO $23.05 débito (cubierto $23.05) · 11/10 LA PAMPA $28.30 débito (cubierto $20.50, no cubierto $7.80) · 13/10 PIZZA HUT $18.50 débito (no cubierto $18.50) |
| `meta` | ninguna |
| `calendario` (días con gasto) | 23/09 $42.10 · 30/09 $25.60 · 05/10 $8.75 · 08/10 $23.05 · 11/10 $28.30 · 13/10 $18.50 |
| `historial` (6 períodos anteriores: asignado / gastado / disponible) | mar $100.00 / $88.20 / $11.80 · abr $100.00 / $101.50 / −$1.50 · may $100.00 / $96.40 / $3.60 · jun $100.00 / $112.20 / −$12.20 · jul $120.00 / $104.75 / $15.25 · ago $120.00 / $118.90 / $1.10 |
| `programadas` | — |
| `reglas` | "PIZZA HUT", "LA PAMPA" |
| `acciones` | puede asignar: sí · puede archivar: no (tiene Disponible distinto de cero) |

Estados: con sobregiro con débito (este), con sobregiro con tarjeta, con meta (barra y falta), sin movimientos, categoría de pago de tarjeta (otra variante: deuda, reservado, te falta reservar, desglose para no generar intereses).

#### Bandeja (`/bandeja`)

`contadores`: pendientes 2 · con coincidencia 1 · posibles duplicados 0 · no reconocidos 0 · errores 0.

| `estado` | SMS (`sms.texto`, `remitente`, `recibidoEn`) | `cuenta` | `fecha` | `monto` | `comercio` | Sugerencia | `aprobacion` |
|---|---|---|---|---|---|---|---|
| pendiente | "BAC: Compra aprobada por USD 35.00 en SUPER SELECTOS ESCALON con tarjeta ***4821 el 15/10/2026 12:41" · BAC · hoy 12:41 | Visa Oro | 15/10 | $35.00 | SUPER SELECTOS ESCALON | Supermercado (por regla) | posible, un toque |
| pendiente | "Agricola: Compra por $12.35 en FARMACIA SAN NICOLAS..." · Banco Agrícola · ayer 18:05 | Cuenta corriente | 14/10 | $12.35 | FARMACIA SAN NICOLAS | — | falta la categoría |
| con coincidencia | "BAC: Cargo de USD 15.49 en NETFLIX.COM..." · BAC · 15/10 06:02 | Visa Oro | 15/10 | $15.49 | NETFLIX.COM | Netflix | coincide con la programada "Netflix" esperada el 17/10 por $15.49 |

Estados: lista con los tres; aprobado con un toque (resultado en el lugar de la fila con "Ver transacción"); descartado (con "Restaurar"); vista de descartados; bandeja al día (vacía); un SMS no reconocido y uno con error.

#### Registrar gasto con división (`/registrar/gasto`), flujo largo

Lo que recibe el formulario: `catalogos.cuentas` (efectivo: Cuenta corriente $1,284.60, Cuenta de ahorro $3,120.00; tarjetas: Visa Oro con deuda $642.18, Mastercard Clásica sin deuda) · `catalogos.categorias` por grupo con su Disponible (Supermercado $62.85, Farmacia $27.65, Restaurantes −$26.30…) · `catalogos.deudores` (Carlos, con $40.00 abiertos) · `catalogos.comercios` (recientes, con su categoría sugerida: SUPER SELECTOS → Supermercado, PRICESMART → Supermercado) · `contexto.cuentaPropuesta` Visa Oro.

Lo que envía (y por lo tanto, los campos): `cuentaId`, `fecha` (por defecto hoy), `total`, `comercio`, `nota` (opcional, hasta 500 caracteres) y `lineas` (1 a 20), cada una con `monto` y destino (una categoría o una persona que debe).

Ejemplo: PRICESMART, 15/10/2026, Visa Oro, total $148.60, dividido en: Supermercado $96.10 · Farmacia $22.50 · Carlos (me lo debe) $30.00.

Estados: una línea; varias líneas; la suma de las líneas no coincide con el total (el formulario lo muestra y no deja guardar); sugerencia de categoría al escribir el comercio; monto mal escrito ("Usá el punto o la coma solo para los centavos, sin separador de miles."); confirmación del impacto cuando la fecha cae en un período cerrado; guardando; guardado (con el resultado y el regreso).

#### Cuentas (`/cuentas`), con tarjeta

| Grupo | Ejemplo |
|---|---|
| `efectivo` | Cuenta corriente (Banco Agrícola, ***3310): saldo $1,284.60, confirmado $1,296.95, última conciliación 30/09 sin diferencia · Cuenta de ahorro (BAC): $3,120.00 |
| `tarjetas` | **Visa Oro** (BAC, ***4821, Visa): deuda $642.18 · saldo a favor $0.00 · límite $2,500.00 · uso del límite 25.69% · te falta reservar $18.75 · reserva excedente $0.00 · próximo corte 25/10 · próximo pago 15/11 · para no generar intereses $512.40 · confirmado $607.18. **Mastercard Clásica** (Banco Cuscatlán, ***0094): deuda $0.00, límite $1,000.00 |
| `prestamos` | Préstamo personal (Banco Agrícola): capital pendiente $4,210.00 · próxima cuota 20/10, $210.00, número 14 |
| `inversiones` | Depósito a plazo: $2,075.60 |
| `posicionNeta` | activos: efectivo $4,404.60, saldos a favor $0.00, inversiones $2,075.60, por cobrar $40.00, total $6,520.20 · deudas: tarjetas $642.18, préstamos $4,210.00, total $4,852.18 · neto $1,668.02 |

Estados: tarjeta con falta de reserva (Visa), sin deuda (Mastercard), con saldo a favor; cuenta con diferencia de conciliación; archivadas visibles.

#### Gasto semanal (`/reportes/gasto-semanal`)

Período 21/09 – 20/10/2026; categoría Supermercado, asignado $350.00. Semanas del período (la última puede ser corta):

| k | Desde – hasta | Días | Futura | Gasto | Referencia (asignado proporcional) | Gasto acumulado | Referencia acumulada | Misma semana en los 3 períodos anteriores |
|---|---|---|---|---|---|---|---|---|
| 1 | 21/09 – 27/09 | 7 | no | $92.40 | $81.67 | $92.40 | $81.67 | $77.20 · $88.10 · $95.35 |
| 2 | 28/09 – 04/10 | 7 | no | $71.15 | $81.66 | $163.55 | $163.33 | $64.80 · $70.45 · $81.20 |
| 3 | 05/10 – 11/10 | 7 | no | $88.60 | $81.67 | $252.15 | $245.00 | $90.15 · $79.60 · $84.00 |
| 4 | 12/10 – 18/10 | 7 | no (en curso) | $35.00 | $81.67 | $287.15 | $326.67 | $71.30 · $85.75 · $62.40 |
| 5 | 19/10 – 20/10 | 2 | sí | $0.00 | $23.33 | $287.15 | $350.00 | $18.90 · $25.00 · $0.00 |

Estados: varias categorías a la vez; una semana futura (sin gasto, distinguible sin color); asignado negativo (referencia 0); categoría nueva sin períodos anteriores.

### A.8 Lo que la app ya resuelve y el diseño no necesita decidir

Las direcciones de cada pantalla, qué datos llegan, los textos (catálogo propio en voseo), el formato de montos y fechas, la carga, el error y la ausencia de conexión como estados con sus textos, los nombres que leen los lectores de pantalla y el orden del teclado. El diseño da la forma a todo eso.

### A.9 Recursos de marca a entregar

| Recurso | Formato | Dónde se usa |
|---|---|---|
| Símbolo | SVG de un color (`currentColor`) | Pantalla de ingreso, página sin conexión, marco si el diseño lo pone |
| Logotipo (opcional) | SVG | Ingreso |
| Ícono de la app | PNG 192 × 192 y 512 × 512 | Pantalla de inicio del teléfono, manifiesto |
| Ícono adaptable | PNG 512 × 512 con el símbolo dentro del 80 % central | Android lo recorta a su forma |
| Ícono de Apple | PNG 180 × 180, sin transparencia | iPhone |
| Favicon | SVG y ICO | Pestaña del navegador |
| Insignia de notificación | PNG 96 × 96, silueta blanca sobre transparente | Barra de estado de Android |
| Colores de los íconos | `marca-icono-fondo`, `marca-icono-figura` | Íconos y color de fondo del manifiesto |

### A.10 Qué se entrega, qué se puede agregar y qué no se puede cambiar

**Se entrega:**
- `tokens.css` y `tokens.json` con los valores de los dos temas, incluidos los tokens agregados;
- las reglas de contraste de los tokens nuevos;
- las fuentes elegidas;
- los estilos de los componentes de A.6;
- los recursos de A.9;
- las pantallas de A.7;
- una lista de lo agregado, con su uso;
- **[R4]** la tabla "token de F → token del contrato" y la lista de ajustes a la identidad original, con su motivo (A.0).

**Se puede cambiar:**
- todos los valores de A.3, los glifos de los estados, las fuentes y los valores de los roles tipográficos;
- la forma de la navegación y de los contenedores;
- la disposición de cada pantalla.

**Se puede agregar** tokens, roles tipográficos, variantes de componentes y componentes visuales propios (por ejemplo, una ilustración para un estado vacío), con estas condiciones:
- todo token nuevo tiene valor en los dos temas;
- si es un color de texto, borde, foco o gráfico, cumple el contraste que le corresponde (A.5); si es decorativo, se declara así;
- un rol nuevo usa `rem` y, si muestra montos, cifras tabulares.

**No se puede cambiar:**
- los nombres de los tokens, roles, estados y variantes de A.3 a A.6 (no se renombran ni se quitan);
- las secciones y los requisitos N1 a N8;
- lo que muestra cada componente y sus estados (A.6);
- la regla de las tres señales y los mínimos de A.5;
- los términos de A.4 ("Deuda sin reservar", "Te falta reservar"…) y el voseo.


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle. Los textos de este documento ya están actualizados y marcados **[F6]**.

- **CF-01, CF-02, CF-04 a CF-08, CF-10 a CF-13, CF-15, CF-17 a CF-19 y CF-21 a CF-23** (Fase 6, aprobados en las revisiones de `06-features.md`): verificar saldo, flujo de efectivo y reportes accionables, propuestas que abren un flujo, Inicio (hallazgos, pagos próximos y primeros pasos), destino `cuenta`, plantilla de categorías en lote, tema y variables de la identidad visual, roles tipográficos, componentes visuales propios, signo menos U+2212, "categoría nueva", arrastrar a una categoría y notificaciones interceptadas. Tabla en 0.13; detalle en `06-features.md` §0.7, §0.13, §0.14, §3 y §5. CF-03 queda diferido.
- **CF-25** (Fase 6, aprobado en la revisión de la Parte E): los componentes de 10.8.1 dibujan las proporciones que trae el DTO, sin recalcular. Detalle en `06-features.md` §5.8.
- **CT-01, CT-03, CT-04, CT-07 y CT-08** (Fase 7, aprobados en las revisiones de las partes A a D de `07-pruebas.md`). Reloj de E2E (14.1); lector de pantalla con TalkBack y NVDA, registrado por el usuario (11.10); nivel de componentes con el modo navegador de Vitest (14.1); A.7 como semilla ejecutada por el motor, con los números corregidos (A.7). **CT-08:** fila de `/presupuesto/estructura/plantilla` en §2.3, que CF-08 citaba y faltaba, y tablas 15.1 y 15.2 regeneradas con `trazabilidad.py` actualizado (marcas en la celda de la ruta, OP-53 y `verificar_saldo`); con eso pasan `trazabilidad.py --comprobar` y `cobertura.py`. Marcas **[F7]** en cada sección. Detalle en `07-pruebas.md` §3, §4, §22, §28 y §34.
