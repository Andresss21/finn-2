# Finn 2.0 — Plan de pruebas (07-pruebas.md)

**Fase:** 7. **Estado:** cerrada. Contiene la **Parte A** (estrategia, niveles, herramientas y CI), la **Parte B** (datos de prueba y matriz) y la **Parte C** (pruebas por área, verificaciones previas y manuales), y la **Parte D** (terminado, puerta de salida, errores de dinero, CT-07 y cierre), **aprobadas con ajustes**. Los CT-01 a CT-09 están **aplicados [F7]** en 02 a 06 y en `06-identidad-visual.md` (§34). **Fase 7 cerrada.**
**Verificación:** V7-01 a V7-06 (Parte A, §9), V7-07 a V7-10 (ajustes de la Parte A y Parte B, §14) V7-11 a V7-15 (ajustes de la Parte B y Parte C, §24) y V7-16 a V7-20 (Parte D y cierre, §35), con los archivos en `07-pruebas-verificacion.zip`.

**Enmiendas de la Fase 8** **[F8]**: los cambios CH-01 a CH-06 y CH-08 de `08-tareas.md` (§7 de ese documento), aprobados en sus revisiones, se aplicaron a este documento al cerrar la Fase 8 (23 de octubre de 2026). Cada sección afectada lleva la marca **[F8]** con el número del cambio; la lista está en "Enmiendas posteriores", al final.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento dice cómo se prueba Finn 2.0: qué se prueba, en qué nivel, con qué datos, dónde corre y cuándo algo está terminado. La Fase 8 lo usa para que cada tarea traiga sus pruebas: un agente abre una feature (FT-nn) y encuentra qué pruebas escribir, en qué archivo, con qué datos y con qué comando correrlas.

### 0.2 Alcance

- **Incluye:** niveles de prueba y su frontera; herramientas; reloj y zona horaria; base de datos en CI; jobs, disparadores, costo en minutos y control de pruebas inestables (Parte A). Datos de prueba, generadores y matriz de trazabilidad (Parte B). Pruebas por área y lista manual (Parte C). Definición de terminado, A.7 corregido, firma de resultados, puerta de salida, plan ante errores de dinero, riesgos y CT consolidados (Parte D).
- **No incluye:** las tareas de implementación (Fase 8).
- **No modifica** 00 a 06. Lo que una prueba necesite y no exista se propone como **CT-nn**, con su impacto en cada documento, y se aplica al cerrar la fase con la marca **[F7]** y su línea en "Enmiendas posteriores".

### 0.3 Precedencia

1. `00-decisiones.md` > `01-dominio.md` > `02-tecnologias.md` > `03-base-de-datos.md` > `04-backend.md` > `05-frontend.md` > `06-features.md`, cada uno con sus enmiendas posteriores; después, `06-identidad-visual.md`.
2. Este documento manda sobre cómo se prueba cada feature en la Fase 8.
3. Una contradicción entre documentos no se resuelve aquí: se plantea como pregunta (P7-n).

### 0.4 Convenciones

| Marca | Significado |
|---|---|
| **DP-nn** | Decisión de esta fase (registro en 0.6) |
| **CT-nn** | Cambio propuesto a un documento aprobado (registro en §10) |
| **V7-nn** | Verificación ejecutada en esta fase (§9) |
| **P7-n** | Pregunta de esta fase |
| **PRU-…** | Identificador estable de una prueba o suite (§2) |
| CA-nn.m, FT-nn | Criterio de aceptación y feature de `06-features.md` |
| OP-nn, AV-nn, ESC-nn, inv. n, §n | Referencias a `01-dominio.md` (OPT-nn, BE-nn, a `04-backend.md`) |
| ADR-nn, RT-nn, RK-nn | Referencias a `02-tecnologias.md` |
| DB-nn, R1–R14, C1–C6 | Referencias a `03-base-de-datos.md` (R14, de EN-2) |
| FE-nn, L1–L19 | Referencias a `05-frontend.md` |

Textos de este documento en español neutro; voseo solo en lo que ve el usuario.

### 0.5 Respuestas del Paso 1 incorporadas

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P7-1 | Material de fases anteriores adjunto (zips de 03, 04, 05 B/C/D y 06); no reconstruir desde los .md sin avisar | Los seis zips se abrieron sin errores. V7-01 usa las migraciones de 03 y la de EN-2; V7-03, `motor_min.py` de 06 |
| P7-2 | `auth.uid()` fue un desliz; Auth importa solo para el ingreso con TOTP en E2E. Pooler: suite chica detrás de PgBouncer en modo transacción; H-06 sigue siendo la prueba definitiva | §5.3, §5.4 (PRU-INT-POOL), V7-05 |
| P7-3 | Reloj cambiable en ejecución, con las salvaguardas de BE-30, imposible en producción y con una prueba que lo demuestre; `finn.ahora()` igual a `now()` en las migraciones de producción y simulable solo en bases de prueba; contar los usos de `now()` | §4, CT-01, CT-02, V7-02, V7-04 |
| P7-4 | `retries: 1` solo en E2E; cero en los demás niveles; aviso y cuarentena con fecha límite | §7 |
| P7-5 | Mediana de N corridas en el runner de GitHub; con menos de 30 % de margen, CT, no aflojar; los presupuestos deterministas bloquean siempre | §6.6 |
| P7-6 | 60 a 150 pushes al mes; E2E completo en `main` y en el nocturno; en el PR, las suites afectadas; cálculo con 150 y margen dentro de los 2.000 min; repositorio privado. **[CH-46]** El repositorio es público: la cuota no limita y las palancas quedan sin efecto mientras lo sea | §6.4, §6.5, P7-14 |
| P7-7 | Umbral de ramas solo en `@finn/dominio`, con el número que mida V7 | DP-09, V7-03 |
| P7-8 | Una sola puerta de salida; plan para un error de dinero en las primeras semanas | Parte D (anticipado en DP-11) |
| P7-9 | Android y Windows (NVDA); iOS y VoiceOver como riesgo aceptado; Playwright con WebKit como cobertura parcial; CT con esa precisión | DP-08, CT-03 (detalle en la Parte C) |
| Supuestos | Aprobados; `PG_MAYOR` en un solo lugar, 17 si 03 y H-01 no lo fijan | DP-06 |

### 0.6 Registro de decisiones de la Parte A

| ID | Decisión | Sección |
|---|---|---|
| DP-01 | Catorce niveles con frontera explícita; cada prueba vive en un solo nivel | §1 |
| DP-02 | Identificador `PRU-<NIVEL>-<ÁREA>-<nnn>` en el título; la matriz lee los títulos | §2 |
| DP-03 | Herramientas por nivel, con versiones fijadas en el lockfile | §3 |
| DP-04 | Tres relojes alineados en E2E (servidor por archivo, base por desfase, navegador con `page.clock`); ningún reloj de pared en las aserciones | §4 |
| DP-05 | Una base de prueba por archivo, clonada de una plantilla ya migrada y verificada | §5.2 |
| DP-06 | `PG_MAYOR` en `infra/versiones.env`; un control verifica que nada lo contradiga | §5.1 |
| DP-07 | Supabase en CI: roles reproducidos con el bootstrap; PgBouncer para el pooler; la pila local (db y auth) solo en E2E | §5.3 |
| DP-08 | Navegadores: Chromium en todos los niveles con navegador; WebKit parcial solo en el nocturno | §3.2 |
| DP-09 | Cobertura: ramas ≥ 90 % en `@finn/dominio`; sin umbral en el resto | §8 |
| DP-10 | Puerta de merge sin protección de rama: la verificación vive en el despliegue y en una regla de trabajo | §6.3 |
| DP-11 | Política de inestabilidad: determinismo por diseño, reintento solo en E2E, cuarentena con fecha | §7 |
| DP-12 | Presupuesto de minutos con palancas automáticas | §6.5 |

### 0.7 Respuestas de la revisión de la Parte A

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P7-10 | a), con **lista de permitidos**: el reloj de prueba solo se activa con `FINN_ENTORNO === 'pruebas'` y `VERCEL_ENV` sin definir; en cualquier otro caso, con `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO` la app no arranca y `relojDePrueba()` devuelve `null`. Casos nuevos en PRU-SEG-RELOJ-001 y 002 | §4.3, CT-01, V7-07 |
| P7-11 | a). Oráculo en `tools/pruebas/oraculo/` con el alcance congelado; CT menor a ADR-01 | §3.1, CT-05 |
| P7-12 | a), con b) como respaldo automático si C4 o H-05 no quedan vacíos | §4.4; el disparador, en la Parte D |
| P7-13 | a). Sin GitHub Pro | §6.3 |
| P7-14 | a). Nocturno 3 noches por semana; M4 al proyectar más de 1.700, con el permiso mínimo; si el primer mes real pasa de 1.700, recorte permanente en la Parte D; M6 descartado | §6.5 |
| POOL-04 | Que la base también lo impida: CT a 03 en la Parte C para revocar a `finn_app` (y a `PUBLIC` si hace falta) las funciones de bloqueo asesor de sesión, con la verificación en Supabase | §5.3; Parte C |
| Resto | Aprobado tal cual: niveles, identificadores, base por archivo, reloj de la base con R15 y L20, cuarentena con fecha, umbral de 90 % y CT-01 a CT-04 | — |

### 0.8 Respuestas de la revisión de la Parte B

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P7-15 | a). Los CA de fichas [P] se exigen cuando su ficha pasa a terminada. FT-49 queda bloqueada hasta el CT de CF-03, y la matriz la muestra como "diferida", no como falta | §13.4 (M13), informe de la matriz, V7-11 |
| P7-16 | a). CB-01 a CB-34 entran en la matriz, cada uno con al menos una prueba (normalmente `DOM` o `ESC@motor`) | §13.1, M14, §19.3 |
| P7-17 | b). A.7 completo con su coherencia comprobada; la semilla lo reproduce entero y una prueba comprueba la identidad y cada número de 3.5.12 y de A.7. Un número incoherente con 01 es un hallazgo, no se ajusta | §12.4; **V7-13 encontró incoherencias: P7-19** |
| P7-18 | a), con reglas: solo pasa a terminada con todas las pruebas automáticas de sus CA en verde y fuera de cuarentena; los manuales los registra solo el usuario en `pruebas/manuales/resultados.md`; con manuales pendientes la ficha no cumple para la puerta; `pr:mergear` muestra los cambios de estado y los manuales pendientes | §13.2 a §13.5 (M15, M16, M17), §22, V7-11, V7-12 |
| 01 completo | La matriz corrió sobre `01-dominio.md` completo (enmendado en la Fase 6): 28 invariantes, 34 CB, 50 ESC y 24 AV | V7-11 |
| Resto | Aprobado: escenarios como datos con dos ejecutores, estado por feature, `pnpm pruebas:ft`, barrera 1b con `vercel env ls` y M4 sin token personal | — |

### 0.9 Respuestas de la revisión de la Parte C

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P7-19 | a), con reglas: conservar los números que citan los CA cambiando solo datos que no aparecen en ellos; A.7 como semilla ejecutada por el motor, sin números a mano, con una prueba de la identidad y de cada número de pantalla; V6-01 repetido sobre la semilla completa; CT-07 en 06, 05 e identidad visual con la tabla "anterior → nuevo → dónde"; el diseño no se rehace; DP nueva sobre ejemplos numéricos; la semilla de 4.2 empieza antes de aprobar SUPER SELECTOS | §28, DP-27, V7-16 |
| P7-20 | a), con condiciones: clave dedicada con contraseña, nunca en `ssh-agent` ni en el agente de Windows; `firmantes-permitidos` con solo esa clave; control en `rapido` por cada entrada nueva; instrucciones para Windows en la lista manual; aviso antes de buscar otra alternativa si en Windows no funciona | §29, PRU-MAN-OPER-001, PRU-SEG-OPER-001, V7-17 |
| P7-21 | a). CT-06 en lugar de `REVOKE`, con la precisión de que protege contra errores accidentales, no contra código malicioso: falsificar la marca exige un `set_config` explícito, que la prueba estática prohíbe en `@finn/db` y `@finn/aplicacion`. POOL-04 queda como control | §19.5, §34; 03 Enmiendas |
| CT-03, CT-04 | Aprobados | §34 |

### 0.10 Respuestas de la revisión de la Parte D

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P7-22 | a). La 1.0 queda accesible solo como referencia durante las 8 semanas y se apaga al terminarlas, si la 2.0 no tuvo incidentes de integridad. La fecha queda como condición | §31.4, PRU-MAN-OPER-003 |
| P7-23 | b). CT-08 a 05: regenerar 15.1 y 15.2 y actualizar `trazabilidad.py --comprobar` y `cobertura.py`, para que todos los scripts anteriores pasen | §34, V7-19 |
| Minutos 1 | La Fase 8 arranca con el primer escalón del recorte permanente (M5) ya activo; se afloja solo si el primer mes medido queda por debajo de 1.600 | §32.2, DP-33 |
| Minutos 2 | Despliegue de emergencia sin Actions: procedimiento manual desde la PC con `vercel deploy --prod`, con las mismas suites de `rapido` e `integracion` en local y registro en `eventos_sistema`; solo para emergencias. Pediste saber si hace falta un CT a 02 (ADR-10): sí, CT-09 | §31.5, PRU-MAN-OPER-002, CT-09 (P7-24) |
| Ajuste propio | Control de dinero diario (§31.1): el resultado queda en el artefacto del job y el aviso es el correo de workflow fallido de GitHub. Ya no se registra en `eventos_sistema` ni envía un push. La versión aprobada necesitaba un evento nuevo en OPT-09 y un push sin aviso AV-nn (03 exige `aviso ~ '^AV-[0-9]{2}$'`), dos cambios a 03 y 04 sin CT que encontré al preparar CT-09. Así no hacen falta, y tampoco comparaba con nada real: el job no tiene el resultado memorizado de la app | §31.1 |
| P7-24 | a). CT-09 aprobado tal como está, con la restauración semanal durante las 8 semanas | §31.5 (vigente), §34, V7-20 |
| Reserva | El respaldo diario y la restauración nunca se recortan: ni M4 ni el recorte permanente los tocan, y el modelo de minutos les reserva su cuota fija. Si la proyección del mes amenaza esa reserva, se recortan primero `e2e` y el nocturno | §32.3, DP-36 |
| Ajustes propios | Aprobados: el control de dinero como job que falla con el correo de GitHub, y el área `OPER` | Filas siguientes |
| Ajuste propio | Área `OPER`: `PRU-SEG-MAN-001` y `PRU-MAN-SEG-001` usaban como área un código de nivel (`MAN`, `SEG`), que la matriz rechaza (M8). Pasan a `PRU-SEG-OPER-001` y `PRU-MAN-OPER-001` | §2.2, §22, §29, DP-35 |

---

## 1. Niveles de prueba (DP-01)

### 1.1 Niveles y frontera

Cada prueba pertenece a un solo nivel. Una regla de frontera dice qué va en cada uno; si una prueba necesita algo de otro nivel, se mueve a ese nivel.

| Nivel | Código | Qué prueba | Frontera (qué no hace) | Dónde vive | Corre en |
|---|---|---|---|---|---|
| Dominio | `DOM` | Funciones puras de `@finn/dominio` (motor, selectores, `Centavos`, `FechaLocal`, umbrales), intérprete y normalizadores de `@finn/sms`, adaptadores de `@finn/conciliacion` sobre texto ya decodificado, módulos de formato (V-18) | Sin E/S, sin base, sin `Date`, sin red | `packages/*/src/**/*.test.ts` | `rapido` |
| Escenarios | `ESC` | Los 50 escenarios de 01 §8 como datos, en dos ejecutores: `motor` (`aplicar` + `calcular`) e `int` (operación + consulta contra PostgreSQL) | El escenario no decide el nivel: es el mismo archivo en los dos | `packages/dominio/escenarios/datos/esc-nn.ts` | `rapido` (motor), `integracion` (int) |
| Propiedades | `PROP` | Invariantes de 01 §6 y equivalencias (memoria = carga nueva, `FechaLocal` frente a Temporal, redondeos, diferencial contra el oráculo) | Igual que `DOM`; generadores en lugar de casos fijos | `packages/*/src/**/*.prop.test.ts`; el diferencial, en `tools/pruebas/oraculo/diferencial.prop.test.ts` (lanza el oráculo: E/S fuera de `@finn/dominio`, CT-05) **[CH-19]** | `rapido` (300 casos), `main` (2.000), nocturno (10.000) |
| Contratos | `CTR` | Esquemas Zod de toda frontera: cuerpo del webhook (BE-60), entradas de las Server Actions, variables de entorno, filas de CSV ya extraídas, exportación JSON | Sin base; solo validación | `packages/aplicacion/src/**/*.ctr.test.ts`, `apps/web/src/**/*.ctr.test.ts` | `rapido` |
| Aplicación | `INT` | Operaciones y consultas de `@finn/aplicacion` contra PostgreSQL real con el esquema completo: protocolo de 04 §4.2, idempotencia (BE-17), conflictos (`revisionVista`), disparadores y códigos FN, RLS y privilegios como `finn_app`, migraciones de expansión, pooler | Sin Next ni navegador | `packages/aplicacion/test/**/*.int.test.ts`, `packages/db/test/**/*.int.test.ts` | `integracion` |
| Esquema | `ESQ` | Controles C1 a C6 de 03 §11.6, reglas R1 a R15, prueba de catálogo de CF-16 | No prueba operaciones | `tools/db/`, `packages/db/test/catalogo.int.test.ts` | `rapido` (C1, C2), `integracion` (C3 a C6), respaldo nocturno (C5, C6 contra producción) |
| Route Handlers | `RH` | `/api/sms`, acciones de notificación (`X-Finn-Accion`), exportar, cron, respaldo: el handler se importa y se llama con un `Request` en el mismo proceso, contra la base de prueba | Sin servidor HTTP ni navegador | `apps/web/src/app/api/**/*.rh.test.ts` | `integracion` |
| Componentes | `CMP` | Componentes de 05 §10.8 y formularios: nombre accesible, estados, teclado, axe por componente | Sin servidor ni base: datos por props | `apps/web/src/**/*.cmp.test.tsx` | `rapido`, si cambió `apps/web` |
| Punta a punta | `E2E` | Pantallas, flujos, estados de §7 de 05, recorridos de 06 §4, accesibilidad por ruta (05 §11.10) | Es el único nivel que usa la pila de Supabase y `next start` | `apps/web/e2e/**/*.e2e.ts` | `e2e` (PR afectadas, `main` completo), nocturno |
| Rendimiento | `REN` | Presupuestos de 04 §5.6 y §6.0.7 y de 05 §13.1 | Deterministas (bytes) y ruidosos (tiempos) por separado (§6.6) | `packages/dominio/bench/`, `apps/web/e2e/rendimiento/` | `e2e` en `main` (bytes), nocturno (tiempos) |
| Seguridad | `SEG` | AAL2 en toda acción y ruta, token del webhook, `X-Finn-Accion`, secretos, RLS como `finn_app` y como rol sin `BYPASSRLS`, barreras del reloj de prueba | Se reparte en `INT`, `RH`, `E2E` y `ESQ` según qué toca; el código `SEG` marca el propósito | Junto al nivel que la ejecuta | Según el nivel |
| Service worker | `SW` | Precache, sin conexión, actualización, eventos de push sintéticos (V5-29 a V5-33) | Sin servicio de push real | `apps/web/e2e/sw/*.e2e.ts` | nocturno; `e2e` si cambió `sw/` |
| Respaldo | `RES` | Volcado de una base sembrada, cifrado con `age`, restauración en una base sin `auth`, `verificar_todo()` e invariantes con el motor (03 §12, 04 §16.4) | Sin R2 ni proyecto real (eso es el respaldo de producción) | `tools/respaldo/test/` | nocturno |
| Manual | `MAN` | Lo que no se automatiza: teléfono con MacroDroid, push real, lectores de pantalla, pulsación larga, todo lo marcado ⚠ | — | Lista única de la Parte C | Según su disparador |

**Justificación.** Un nivel por prueba evita que una misma regla quede "probada" en tres lugares con distinto alcance. También deja claro qué corre en cada job y qué cuesta. Las fronteras siguen las de los paquetes de ADR-20 y PR-1: lo que no tiene E/S nunca espera a una base.

**Alternativas descartadas.**
- Pirámide de tres niveles (unidad, integración, E2E): mezcla escenarios, contratos y esquema, y no dice dónde va la prueba de catálogo ni la de respaldo.
- Probar los Route Handlers solo por E2E: obliga a levantar Supabase para cada caso del webhook (401, 5xx, 200) y vuelve lentas pruebas que son de entrada y salida.

### 1.2 Qué nivel elegir

Primero se mira si la regla tiene **E/S** (base, red, navegador); si no tiene, va en `DOM` o `PROP`. Si toca la base pero no Next, va en `INT`. Si toca Next pero no el navegador, va en `RH`. El navegador solo entra en `CMP` (sin servidor) o en `E2E`. Un criterio de aceptación puede citar varias pruebas de distintos niveles; la matriz (Parte B) exige al menos una.

---

## 2. Identificadores y ubicación (DP-02)

### 2.1 Formato

`PRU-<NIVEL>-<ÁREA>-<nnn>`, por ejemplo `PRU-INT-TARJ-004`.
- `NIVEL`: el código de §1.1.
- `ÁREA`: un código de la tabla 2.2.
- `nnn`: número dentro de la suite, estable. Una prueba que se elimina deja su número sin reutilizar, igual que FD-01 con las features.
- **Suite:** `PRU-<NIVEL>-<ÁREA>` es un bloque `describe` con ese título.
- **Escenarios:** `PRU-ESC-nn@motor` y `PRU-ESC-nn@int`, con `nn` = el número de ESC-nn.

El **título** de cada prueba empieza con su identificador y lleva entre corchetes lo que cubre:

```ts
it('PRU-INT-TARJ-004 [CA-30.4, ESC-10, AV-04, AV-10] pago mayor que lo reservado deja Pago T negativo y avisa', …)
```

La matriz de la Parte B lee esos corchetes con `vitest list --json` y `playwright test --list --reporter=json`, sin ejecutar nada.

**Justificación.** El identificador en el título sale en los informes de Vitest y Playwright, en las trazas y en los avisos de inestabilidad. Así una prueba que falla en CI se busca por nombre en este documento y en la matriz. *Alternativas descartadas:* anotaciones aparte (`test.info().annotations`), que Vitest no tiene igual y se desincronizan del título; IDs solo en un archivo de matriz escrito a mano, que deja pruebas sin dueño.

### 2.2 Áreas

| Código | Área | Features (06 §1.2) |
|---|---|---|
| `ACCESO` | Ingreso, TOTP, sesión, factores | FT-01, FT-02, FT-74 |
| `INICIO` | Inicio y primeros pasos | FT-04, FT-08 |
| `PRES` | Presupuesto, asignar, mover, LPA | FT-09 a FT-16 |
| `CATEG` | Grupos, categorías, archivo, fusión | FT-18 a FT-20 |
| `META` | Metas | FT-17 |
| `TX` | Registrar, editar, eliminar, actividad | FT-21 a FT-27 |
| `DEV` | Devoluciones | FT-28 |
| `TARJ` | Tarjetas y pagos | FT-29 a FT-33 |
| `BAND` | SMS, bandeja, formatos, conexión con MacroDroid | FT-03, FT-34 a FT-39, FT-73, FT-78 |
| `PROG` | Programadas y puesta al día | FT-40 a FT-42 |
| `CONC` | Conciliación y verificar saldo | FT-43, FT-44 |
| `COBRO` | Por cobrar, cobros, condonaciones | FT-45 a FT-49 |
| `CTA` | Cuentas, préstamos, inversiones | FT-50 a FT-59 |
| `REP` | Reportes | FT-60 a FT-68 |
| `NOTIF` | Push y centro de notificaciones | FT-06, FT-69 a FT-71 |
| `AJUS` | Ajustes, exportación, diagnóstico | FT-72, FT-75, FT-76 |
| `PWA` | Instalación, sin conexión, tema | FT-05, FT-77 |
| `MOTOR` | Núcleo de cálculo (01 §4) | Transversal |
| `VAL` | `Centavos`, `FechaLocal`, formato | Transversal |
| `RELOJ` | Reloj de prueba y zona horaria | Transversal |
| `POOL` | Pooler en modo transacción | Transversal |
| `ESQ` | Esquema, migraciones, catálogo | Transversal |
| `RESP` | Respaldo y restauración | Transversal |
| `OPER` | Operación: firmas de los resultados manuales, despliegue de emergencia, retiro de la 1.0 (Parte D) | Transversal |

**Cerrada en la Parte B (V7-09).** Las 77 fichas tienen un área, y cada feature está en una sola: FT-12 (asignación rápida) queda en `PRES`, y FT-42 (registro automático y puesta al día) en `PROG`, como dice su título en el catálogo. Los códigos no cambian. El área es la del archivo y del identificador; una prueba puede citar CA de otra área.

### 2.3 Archivos y comandos

| Nivel | Patrón de archivo | Proyecto de Vitest o Playwright | Comando local |
|---|---|---|---|
| `DOM`, `PROP` | `*.test.ts`, `*.prop.test.ts` | `unidad` | `pnpm test:unidad` |
| `ESC@motor` | `packages/dominio/escenarios/datos/*.ts` | `escenarios-motor` | `pnpm test:escenarios` |
| `CTR` | `*.ctr.test.ts` | `contratos` | `pnpm test:contratos` |
| `INT`, `ESC@int`, `RH`, `ESQ` (C3–C6) | `*.int.test.ts`, `*.rh.test.ts` | `integracion` | `pnpm test:integracion` (necesita Docker) |
| `CMP` | `*.cmp.test.tsx` | `componentes` (modo navegador) | `pnpm test:componentes` |
| `E2E`, `SW`, `REN` (web) | `apps/web/e2e/**/*.e2e.ts` | proyectos `movil`, `escritorio`, `zona-distinta`, `webkit-parcial` | `pnpm test:e2e -- --project=movil` |
| `REN` (motor) | `packages/dominio/bench/*.bench.ts` | `vitest bench` | `pnpm bench` |
| `REN` (carga) **[CH-33]** | `packages/db/test/*.int.test.ts` | `integracion` | `pnpm test:integracion -t PRU-REN` |
| `RES` | `tools/respaldo/test/` | script | `pnpm test:respaldo` |

- **Una prueba sola:** `pnpm test:integracion -t "PRU-INT-TARJ-004"`, o `pnpm test:e2e -- -g "PRU-E2E-PRES-012"`.
- **Todo lo de una feature:** `pnpm pruebas:ft FT-30`. El script de la matriz (Parte B) resuelve la feature a sus identificadores y llama a cada herramienta con su filtro.
- Los proyectos de Vitest se declaran en un solo `vitest.config.ts` de la raíz (`test.projects`), para que `pnpm test` corra todo lo que no necesita Docker.

---

## 3. Herramientas (DP-03)

### 3.1 Por nivel

| Herramienta | Versión fijada | Para qué | Origen |
|---|---|---|---|
| Vitest | 4.x en el lockfile (la verificación usó 3.2.7; mismo API para lo usado) | `DOM`, `ESC`, `PROP`, `CTR`, `INT`, `RH`, `CMP`, `REN` (bench) | ADR-19 |
| fast-check | 4.x (V7-03: 4.10.2) | `PROP` | ADR-19 |
| `@vitest/coverage-v8` | igual que Vitest | Cobertura de ramas de `@finn/dominio` (DP-09) | Nuevo, sin CT: es parte de Vitest |
| Testcontainers (`@testcontainers/postgresql`) | 11.x | PostgreSQL efímero en `integracion` | ADR-19 |
| PgBouncer | 1.22 o superior (paquete de Ubuntu del runner) | Aproximación del pooler (PRU-INT-POOL) | P7-2 b) |
| Supabase CLI | fijada en `infra/versiones.env` | Pila local para E2E: solo `db` y `auth` (más `kong`, que exige el cliente) | 04 §14.1 |
| Playwright (`@playwright/test`) | 1.56.x (V7-04) | `E2E`, `SW`, `REN` web, y proveedor del modo navegador de Vitest | ADR-19, 05 §14 |
| `@axe-core/playwright` y `axe-core` | 4.x | Accesibilidad en `E2E` (05 §11.10) y en `CMP` | 05 §11.10 |
| Lighthouse CI (`@lhci/cli`) | 0.15.x | LCP y CLS (05 §13.4) | 05 §13.4 |
| `otpauth` | 9.x | Código TOTP del usuario de prueba (05 §14.1) | 05 §14.1 |
| Python 3 (del runner) | la del runner | Oráculo diferencial `motor_min.py`, en `tools/pruebas/oraculo/` con el alcance congelado | P7-11 a); CT-05 a ADR-01 |
| gitleaks | binario fijado por versión y suma | Secretos en el diff del PR (`SEG`) | Nuevo, sin CT (herramienta de CI) |

**Modo navegador de Vitest para `CMP`.** Es el único nivel nuevo respecto de ADR-19. Usa el Chromium de Playwright que ya está en la caché, sin servidor ni base. Va como **CT-04**, porque agrega una fila a la tabla de niveles de ADR-19. Se verifica en la Parte C con un componente y axe.
- *Alternativas descartadas:* jsdom o happy-dom (no calculan estilos ni foco reales, y axe da falsos negativos de contraste); probar los componentes solo por E2E (cada caso de un componente obligaría a sembrar una base y navegar).

### 3.2 Navegadores (DP-08)

| Proyecto | Navegador | Dónde | Qué cubre | Qué no cubre |
|---|---|---|---|---|
| `movil` | Chromium, descriptor `Pixel 7` | PR (afectadas), `main`, nocturno | Todo lo de E2E (05 §14.1) | — |
| `escritorio` | Chromium, 1280 × 800 | nocturno | Las mismas rutas en escritorio (N6) | — |
| `zona-distinta` | Chromium, `timezoneId: 'Asia/Tokyo'` | nocturno | Ninguna fecha sale del reloj del dispositivo (05 §5.5) | — |
| `webkit-parcial` | WebKit de Playwright, descriptor `iPhone 13` | nocturno | Maquetación, foco y teclado, formularios y formatos de `Intl` en el motor de Safari; recorridos 4.1 a 4.3 | **No** cubre lo que el riesgo aceptado de P7-9 deja fuera: service worker e instalación en iOS (WebKit de Playwright no es Safari de iOS ni tiene su política de PWA), Web Push en iOS, VoiceOver, gestos táctiles reales y la pulsación larga de CA-78.15. No se usa para CA marcados "manual" |

Los resultados de `webkit-parcial` **no bloquean** el despliegue: abren un aviso (§7.3). La primera versión se declara probada en Android y en Chrome de escritorio (P7-9). La redacción de los criterios que pedían iPhone va en CT-03 (Parte C).

---

## 4. Reloj y zona horaria (DP-04, CT-01, CT-02)

### 4.1 Los tres relojes

Una prueba con fechas de 2027 (01 §8.0) necesita que los tres relojes digan lo mismo:

| Reloj | Quién lo lee | Cómo se fija en pruebas | Barrera en producción |
|---|---|---|---|
| **Servidor** (Next) | `escribir()`, `leer()` y el webhook, para fijar `finn.hoy` y el desfase de la transacción | Archivo de reloj de prueba (CT-01): la prueba escribe `{ instante, fijadoEn }` y el servidor lo relee en cada petición | Barreras 1 y 2 de 4.3 |
| **Base** | `finn.hoy()` (DB-08) y, con CT-02, `finn.ahora()` y `finn.instante()` | `set_config('finn.hoy', …, true)` y `set_config('finn.desfase_ms', …, true)` en cada transacción. Solo tienen efecto en bases con `finn.reloj_simulado = on` y con `tools/pruebas/reloj-simulado.sql` instalado | Barreras 3 y 4 de 4.3 |
| **Navegador** | Agenda de medianoche (05 §6.7), formatos | `page.clock.install({ time })` con el mismo instante | No aplica: el reloj del dispositivo nunca decide un número (05 §5.5) |

El reloj simulado **avanza** con el real: simulado = real + (instante − fijadoEn). Así el orden de los instantes dentro de una prueba se conserva. Fijar un instante nuevo es un salto.

### 4.2 Por qué hace falta cambiar el reloj en ejecución (CT-01)

04 §13.1.4 (BE-30) fija "hoy" con la variable `FINN_HOY_SIMULADO`, que queda fija mientras vive el proceso. Dos casos lo rompen:
- El recorrido 4.6 de 06 cruza el cierre en el paso 4, y ESC-05, ESC-10 y otros cambian "hoy" a mitad del escenario.
- ESC-46 necesita que `recibido_en` caiga a las 19:00 del 20 de febrero de 2027, y esa columna la fija la base con `DEFAULT now()`.

**Hallazgo de V7-04 (P7-10).** `next start`, que es el servidor de E2E según 05 §14.1 (FE-50), corre con `NODE_ENV=production` (PRU-E2E-RELOJ-003). BE-30 permite el reloj simulado "solo si `NODE_ENV !== 'production'`" y obliga a la app a no arrancar si la variable existe en producción. Leídos juntos, 04 §13.1.4 y 05 §14.1 dejan sin reloj simulado a toda la E2E. Era una contradicción entre dos documentos aprobados; se resolvió en P7-10 con la lista de permitidos de 4.3 (CT-01).

### 4.3 Barreras para que el reloj de prueba no exista fuera de las pruebas

**Regla (P7-10, lista de permitidos).** El reloj de prueba solo se permite si `FINN_ENTORNO === 'pruebas'` **y** `VERCEL_ENV` no está definida, con cualquier valor (vacía también cuenta como definida). En cualquier otro caso, si existe `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO` (aunque esté vacía), la app no arranca y `relojDePrueba()` devuelve `null`. La regla vive en una sola función sin E/S, `relojPermitido()`, que usan las dos barreras de la aplicación.
- **Por qué una lista de permitidos.** Vercel Hobby crea despliegues de vista previa (`VERCEL_ENV = 'preview'`), y con un solo proyecto de Supabase una vista previa apunta a la base real. Con una lista de bloqueados, una vista previa con el archivo pasaría las barreras 1 y 2: la base ignoraría el desfase (barreras 3 y 4), pero el motor y las validaciones de la app usarían un "hoy" distinto del de la base, contra datos reales.
- **`FINN_ENTORNO` no existe en Vercel**, en ningún entorno: solo la definen el job de CI y la máquina local. Con la regla nueva, producción ya no necesita `FINN_ENTORNO=produccion`.
- **`NODE_ENV` no se usa**, por el hallazgo de V7-04.
- **Dependencia de Vercel.** Vercel expone `VERCEL_ENV` en ejecución solo si está activada la casilla de acceso a las variables del sistema (en la configuración de variables de entorno del proyecto; viene activada y también la necesita la protección contra desfase de versiones). Si alguien la desactivara, la regla sigue impidiendo el reloj, porque `FINN_ENTORNO` no existe en Vercel; la barrera 1b lo comprueba en cada despliegue.

| # | Barrera | Dónde | Qué impide | Prueba |
|---|---|---|---|---|
| 1 | La app no arranca | `instrumentation.ts` (`register()`): si `relojPermitido()` es falso y existe una de las dos variables, registra el motivo y termina el proceso | Producción o una vista previa con la variable puesta por error | **PRU-SEG-RELOJ-001** (V7-07): `next start` con el archivo presente en 11 casos. Control positivo (`FINN_ENTORNO=pruebas` sin `VERCEL_ENV`: arranca con el reloj de prueba); `VERCEL_ENV=production`, `preview`, `development` y vacía; sin `FINN_ENTORNO`; `FINN_ENTORNO=produccion` y `Pruebas`; solo `FINN_HOY_SIMULADO`; `FINN_RELOJ_ARCHIVO` vacía; control sin variables de reloj con `VERCEL_ENV=preview` (arranca con el reloj real). Espera salida 1 en los 9 casos prohibidos |
| 1b | Ninguna variable de reloj en Vercel | `desplegar`, antes de `vercel deploy --prod`: `vercel env ls` de producción, vista previa y desarrollo | Que la variable exista en algún entorno de Vercel, aunque todavía no se haya desplegado | **PRU-SEG-RELOJ-006**: falla si aparece `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO` |
| 2 | Se ignora | `relojDePrueba()` devuelve `null` si `relojPermitido()` es falso, aunque exista el archivo | Que el archivo llegue por otra vía (por ejemplo, una variable agregada en caliente) | **PRU-SEG-RELOJ-002** (V7-07): la función, en proceso, con los mismos 11 casos |
| 3 | La base no lo acepta | En las migraciones, `finn.ahora()` es `SELECT now()` y `finn.instante()` es `SELECT clock_timestamp()`, sin leer ningún ajuste. La versión simulable solo la instala `tools/pruebas/reloj-simulado.sql`, que se niega a correr en una base sin la marca de prueba | Que el servidor, aunque mande `finn.desfase_ms`, cambie un instante en producción | PRU-ESQ-RELOJ-003: R15 (CT-02) en `integracion` y, cada noche, contra producción con `finn_respaldo` (03 §11.7). PRU-ESQ-RELOJ-004: en la plantilla, un desfase de un año se ignora (V7-02 P2) |
| 4 | `finn.hoy()` | Sin cambios: solo respeta `finn.hoy` con `finn.reloj_simulado = on` (DB-08), que `finn_app` no puede activar | — | PRU-ESQ-RELOJ-005 (V7-02 P9) |

**Justificación.** Cada barrera alcanza para impedir el efecto, y son independientes: la 1, la 1b y la 2 están en la aplicación y su despliegue; la 3 y la 4, en la base. La 3 cubre lo que pediste en P7-3: la base de producción no tiene ninguna función que lea un desfase. La 1b cubre el caso de la vista previa antes de que exista un despliegue.

**Alternativas descartadas.**
- Lista de bloqueados (`VERCEL_ENV === 'production'` o `FINN_ENTORNO === 'produccion'`, la versión anterior de CT-01): deja pasar las vistas previas (P7-10).
- Cabecera HTTP para fijar el reloj: cualquier cliente podría enviarla, y la barrera dependería solo de la aplicación.
- Reiniciar `next start` en cada cambio de fecha (P7-3 b).
- Seguir usando `NODE_ENV` (V7-04).

### 4.4 `finn.ahora()` y `finn.instante()` (CT-02)

**Diseño (V7-02).**
- `finn.ahora()` reemplaza a `now()`: el inicio de la transacción, para los `DEFAULT` y las comparaciones de retención.
- `finn.instante()` reemplaza a `clock_timestamp()` en el paso 3 de 04 §4.2 (el instante tomado después del bloqueo, BE-27).
- En producción son `SELECT now()` y `SELECT clock_timestamp()`.
- En las bases de prueba, `tools/pruebas/reloj-simulado.sql` les suma `finn.desfase()`, que lee `finn.desfase_ms`.

Hacen falta las dos funciones: si solo existiera `finn.ahora()`, una transacción aprobada desde un SMS (con `hora_registro = recibido_en` simulado, de 2027) quedaría ordenada respecto de una manual (con `clock_timestamp()` real, de 2026) por la fecha de calendario real, y D2 compararía instantes de dos relojes distintos.

**El esquema no diverge en lo que llega a producción.**
- Las dos funciones nacen en una migración manual, con su cuerpo de producción.
- El reemplazo solo ocurre en las bases de prueba, en el paso de siembra de CI, **después** de C3 a C6 sobre la plantilla.
- La diferencia entre plantilla y base de prueba es exactamente de tres funciones (`ahora`, `instante`, `desfase`; V7-02 P5). La regla R15 la detecta (V7-02 P4).
- **[CH-24]** R15 llega en dos pasos: `m_reloj` (TA-056) con las partes 1, 2 y 4, y la parte 3 (ningún `DEFAULT` con reloj directo) con `g_instantes_ahora` (TA-057), que es la que cambia los 9 `DEFAULT`.
- El `DEFAULT` nuevo en `schema.prisma` sigue P7-12 a): `@default(dbgenerated("finn.ahora()"))`, con b) como respaldo automático si C4 o H-05 no quedan vacíos. La Parte D registra qué prueba dispara el cambio y cómo se nota.

**Conteo de usos y su impacto.**

| Documento | Lugar | Hoy | Con CT-02 |
|---|---|---|---|
| 03 §3.17–§3.28 y §10.3 | 9 columnas de instantes técnicos: `sms_recibidos.recibido_en`, `sms_procesamientos.procesado_en`, `cambios_posteriores.registrado_en`, `eliminaciones.eliminada_en`, `suscripciones_push.creada_en` y `renovada_en`, `notificaciones.creada_en`, `eventos_sistema.ocurrido_en`, `token_webhook.creado_en` | `DEFAULT now()` en el diccionario (9 líneas) y `@default(now())` en Prisma (9 líneas): **18 apariciones** | `finn.ahora()` y `@default(dbgenerated("finn.ahora()"))` (P7-12) |
| 03 §4.1 y §10.4.5 | `finn.hoy()` | `now() AT TIME ZONE …` (2 apariciones) | **Sin cambio** (DB-08 aprobado; R15 lo exceptúa) |
| 03 §4.1 | Funciones auxiliares | — | Dos filas nuevas: `ahora()` e `instante()` |
| 03 §11.6 | Reglas de catálogo | R1–R14 | **R15** (texto en `tools/db/regla-r15.sql`): cuerpos de producción exactos, ningún reloj directo fuera de `ahora`, `instante` y `hoy`, ningún `DEFAULT` con reloj directo, ausencia de `finn.desfase()` |
| 03 §10.1 | Migraciones | 7 carpetas (+ EN-2 y las de la Fase 6) | `AAAAMMDDhhmmss_m_reloj` (funciones y cuerpo nuevo de `purgar_eliminaciones`) y `AAAAMMDDhhmmss_g_instantes_ahora` (los 9 `DEFAULT`, generada por Prisma). Las migraciones ya aplicadas no se editan (03 §11.2) |
| 04 §4.2, paso 3 | SQL del estado base | `clock_timestamp()` | `finn.instante()` (1 aparición) |
| 04 §4.2 (nota) y §13.1.2 | Explicación de BE-27 | "con `clock_timestamp()`, no con `now()`" (2 apariciones) | "con `finn.instante()` (`clock_timestamp()` en producción), no con `finn.ahora()`". La justificación no cambia |
| 04 §13.1.2, tabla | Instantes técnicos | "`DEFAULT now()` de 03" | "`DEFAULT finn.ahora()` de 03" (1) |
| 04 §13.6 | BE-33 | "`DEFAULT now()`" | "`DEFAULT finn.ahora()`" (1) |
| 04 §3.6 (OP-35 paso 1) y §8.2 paso 4 | `recibido_en` | "`now()` de la base" (2) | "`finn.ahora()` de la base" |
| 04 §8.6 | SMS sin resultado y barrido BE-62 | `recibido_en < now() − 2 min` (2) | `finn.ahora()` |
| 04 §10.1 | Ejecución en curso de la puesta al día | `ocurrido_en > now() − 5 min` (1) | `finn.ahora()` |
| 04 §10.2 (EN-2) | `purgar_eliminaciones()` | `now() - interval '30 days'` (1) | `finn.ahora()` |
| 04 §4.2 (nota), §13.1.1 y §13.1.2 (alternativas) | `hoy()` usa `now()`; alternativas descartadas | 3 apariciones | **Sin cambio** |
| 04 §13.1 (precisión nueva) | Instantes que escribe la aplicación (`leida_en`, `push_enviada_en`, `renovada_en` al actualizar, `terminada_en`) | 04 no dice de qué reloj salen | Siempre del `instante` del paso 3 de 04 §4.2 o de `finn.ahora()`, **nunca** de `Date.now()` del servidor; regla de lint nueva **L20** en `@finn/aplicacion` y `apps/web/src/app` (prohíbe `Date.now()` y `new Date()` sin argumentos fuera de los módulos de formato y del reloj de prueba) |
| 05 §6.7 | Agenda de medianoche (`Date.now()` del navegador) | 1 aparición | **Sin cambio**: es el reloj del dispositivo y solo mide cuánto falta |
| 06 | — | 0 apariciones | Sin cambio |

**Total:** 18 apariciones en 03 y 11 en 04 cambian. Quedan sin cambio 5: 2 en 03 (`hoy()`) y 3 en 04.

---

## 5. PostgreSQL y Supabase en CI

### 5.1 Versión (DP-06)

- `infra/versiones.env` es el único lugar: `PG_MAYOR=17`, `SUPABASE_CLI=…`, `PLAYWRIGHT=1.56.x`, `NODE=24`. Lo leen los workflows, el ayudante de Testcontainers y el paso que genera `supabase/config.toml`.
- Un control de `rapido` (`tools/pruebas/versiones.mjs`) falla si `supabase/config.toml` (`db.major_version`), `package.json` (`engines.node`) o el lockfile (`@playwright/test`) dicen otra cosa.
- 03 no fija la versión mayor (03 §10.5 se probó con 16) y H-01 todavía no se ejecutó. Por eso queda **17**, hasta que H-01 registre la real; cambiarla es una línea.
- **Hallazgo de entorno:** todas las verificaciones de esta fase corrieron en PostgreSQL 16.15, porque PostgreSQL 17 no se pudo instalar aquí (ver V7-01). Las funciones que usa el diseño existen en 16 y 17 (04 §17.2, H-01).

### 5.2 Base de prueba por archivo (DP-05)

1. Al empezar el job `integracion`, un contenedor de PostgreSQL `PG_MAYOR`, de la imagen oficial servida desde `public.ecr.aws/docker/library/postgres`. Docker Hub limita las descargas anónimas por dirección IP y los runners comparten direcciones.
2. Como superusuario: `bootstrap.sql` (03 §10.4.1) y `tools/pruebas/roles-supabase.sql`, que crea `anon`, `authenticated` y `service_role` sin privilegios, para que `m_seguridad` ejecute sus `REVOKE` como en Supabase y las pruebas `SEG` tengan un rol sin `BYPASSRLS`.
3. Como `finn_migraciones`: `prisma migrate deploy` (CLI nativa) sobre la base **plantilla** `finn_plantilla`.
4. Sobre la plantilla: C3, C4, C5 (R1 a R15) y C6. Si alguno falla, el job termina sin correr pruebas.
5. Cada archivo de prueba crea su base con `CREATE DATABASE … TEMPLATE finn_plantilla`, la marca con `finn.reloj_simulado = on` e instala `reloj-simulado.sql`. Las pruebas corren como `finn_app`; al terminar, se borra la base.

Medido en V7-01:
- Las 12 carpetas de migraciones (las 7 de 03, EN-2, las tres de expansión de la Fase 6 en versión de prototipo y `m_reloj`) aplican en **0,58 s**.
- Clonar y preparar una base de prueba toma **91 ms**.
- Con unos 60 archivos de integración, el aislamiento por archivo cuesta unos 6 s en total.

**Justificación.** Un archivo nunca ve los datos de otro, y los archivos pueden correr en paralelo, uno por núcleo. *Alternativas descartadas:* una sola base con `TRUNCATE` entre pruebas (`finn_app` no tiene `TRUNCATE`, y como dueño dispararía `revision_minima_incremental`); transacción revertida por prueba (el protocolo de 04 confirma su propia transacción, y las verificaciones diferidas solo corren al confirmar).

### 5.3 Lo propio de Supabase (DP-07)

| Pieza | En `integracion` | En `e2e` | Prueba definitiva |
|---|---|---|---|
| Roles `finn_*` y atributos (`BYPASSRLS`, `NOINHERIT`) | `bootstrap.sql` como superusuario | La misma, sobre la base de la pila local | H-02 (con `postgres` no superusuario) |
| Roles `anon`, `authenticated`, `service_role` | `roles-supabase.sql` | Los de la pila | H-11 (Data API) |
| Esquema `auth` | **No existe**, como en la prueba de restauración (ADR-22) | Lo trae la pila | — |
| Auth (email, contraseña, TOTP, AAL2) | No aplica | Servicio `auth` de la pila local; el usuario de prueba se crea al arrancar el job | H-10 |
| Supavisor en modo transacción | PgBouncer en modo transacción, sin sentencias preparadas (PRU-INT-POOL, V7-05) | No: la app de E2E se conecta directo a la base de la pila | H-04, H-06 |

**Pila local mínima en E2E.**
- `supabase start -x` excluye `studio`, `realtime`, `storage-api`, `imgproxy`, `edge-runtime`, `logflare`, `vector`, `postgres-meta`, `supavisor`, `postgrest` y `mailpit`. Quedan `db`, `auth` y `kong`.
- La Data API (PostgREST) queda fuera también en local, como en producción (ADR-04).
- **No verificado aquí:** este entorno no llega a Docker Hub (V7-01). Lo mide la primera corrida de CI de la Fase 8.

**PRU-INT-POOL (V7-05).** Corre en `integracion`, con PgBouncer como servicio del job. **[F8]** (CH-05): cada prueba tiene su identificador completo, PRU-INT-POOL-001 a 005; PRU-INT-POOL-006 (V-05) no cambia:

| Prueba | Qué comprueba | Resultado en V7-05 |
|---|---|---|
| PRU-INT-POOL-001 (POOL-01) **[F8]** | 50 escrituras seguidas con Prisma 7 + `@prisma/adapter-pg` y `pgbouncer=true`: bloqueo transaccional, `set_config(…, true)` y escritura | Pasa: 0 errores, 376 ms |
| PRU-INT-POOL-002 (POOL-02) **[F8]** | Las transacciones siguientes del pool no ven `finn.hoy`, ni la zona forzada, ni el bloqueo | Pasa |
| PRU-INT-POOL-003 (POOL-03) **[F8]** | Control: un `SET` de sesión (sin `LOCAL`) se ve desde otro cliente | Se detecta |
| PRU-INT-POOL-004 (POOL-04) **[F8]** | Control: un bloqueo asesor **de sesión** deja que otro cliente pase `tiene_bloqueo()` sin haber tomado el bloqueo | Se detecta (hallazgo, abajo) |
| PRU-INT-POOL-005 (POOL-05) **[F8]** | Control: una sentencia preparada con nombre falla con varios clientes concurrentes (`26000`) | Se detecta |

**Hallazgo de POOL-04.** `finn.tiene_bloqueo()` (03 §4.1) mira `pg_locks` por `pid`. Detrás de un pooler, el `pid` es el del servidor y no el del cliente. Si algún código tomara alguna vez `pg_advisory_lock` de sesión, otro cliente que reciba esa conexión pasaría el trigger `a_exigir_bloqueo` sin haberse serializado.
- Hoy ningún documento usa bloqueos de sesión, así que no es un error del diseño. Pero la base no lo impide.
- La protección queda en dos lugares: POOL-04 sigue en la suite, y la Parte C agrega una prueba estática que rechaza `pg_advisory_lock(` y `SET ` sin `LOCAL` en el código de `@finn/db` y `@finn/aplicacion`.
- **Decisión de la revisión:** la base también lo va a impedir. La Parte C propone un CT a 03 que revoca a `finn_app` (y a `PUBLIC`, si hace falta) el `EXECUTE` de las funciones de bloqueo asesor de sesión y deja solo las `_xact`, con la verificación de que el rol `postgres` de Supabase puede hacer ese `REVOKE`.

### 5.4 Lo que CI no reproduce

Lo que solo existe en el proyecto real queda en la prueba de humo de 04 §17, sin cambios: H-01 (versión), H-02 y H-03 (bootstrap con `postgres` no superusuario), H-04 y H-06 (Supavisor real), H-07 (zona por el pooler real), H-08 (respaldo por el pooler en modo sesión), H-09 (carga desde `iad1`), H-10 y H-11 (Auth y Data API) y H-12 (limpieza). Qué parte de cada paso sí entra en CI se detalla en la Parte C.

---

## 6. CI

### 6.1 Workflows y jobs

| Workflow | Disparador | Jobs (en orden) |
|---|---|---|
| `ci.yml` | `pull_request` (`opened`, `synchronize`, `ready_for_review`) y `push` a `main` | `rapido` → `integracion` → `e2e` → `desplegar` (solo `main`) |
| `nocturno.yml` | `schedule` lunes, miércoles y viernes 08:15 UTC (02:15 en El Salvador), solo si `main` cambió desde la última corrida verde (P7-14) | `nocturno` |
| `respaldo.yml` | Diario, 07:30 UTC (ADR-22), sin cambios. Fuera de todo recorte (§32.3) | `respaldo` (incluye C5, C6 y R15 contra producción, y el control de dinero de §31.1) |
| `restauracion.yml` | Mensual (ADR-22); **semanal** durante las primeras 8 semanas (CT-09, §31.1). Fuera de todo recorte (§32.3) | `restauracion` |

| Job | Cuándo corre | Contenido | Estimado |
|---|---|---|---|
| `rapido` | Siempre | Instalación con caché; `typecheck`; ESLint (fronteras, L1–L20); Prettier; `versiones.mjs`; gitleaks sobre el diff; C1 (lint de migraciones) y C2 (inmutabilidad); script de la matriz (Parte B); `DOM`, `ESC@motor`, `CTR`; `PROP` (300 casos en PR, 2.000 en `main`); diferencial contra el oráculo; cobertura de ramas de `@finn/dominio` (DP-09); `CMP` si cambió `apps/web`. Calcula y publica `afecta_db` y `afecta_web` para los jobs siguientes | 2,5–3 min |
| `integracion` | En el PR si `afecta_db` o si el PR pasa a listo; en `main` siempre | Plantilla y controles de 5.2; `INT`, `ESC@int`, `RH`, `ESQ`, PRU-INT-POOL; prueba de catálogo de CF-16 | 3–4 min |
| `e2e` | En el PR **listo** con `afecta_web` (suites afectadas); en `main` siempre (completo, proyecto `movil`) | `next build`; pila local mínima; usuario de prueba; Playwright; en `main`, además, tamaño de JS y de precache (deterministas, §6.6) | 6–8 min en PR; 10–11 en `main` |
| `desplegar` | Solo `main`, si todos los anteriores pasaron en la misma corrida | `prisma migrate deploy` en producción; C5, C6 y R15 con `finn_respaldo`; `vercel deploy --prod` (ADR-10, 03 §11.7) | 2–3 min |
| `nocturno` | Según 6.1 | E2E `escritorio`, `zona-distinta`, `webkit-parcial`; accesibilidad en los dos temas; `SW`; Lighthouse CI, INP y benchmark del motor y de la carga a 10 años (mediana de 5); `PROP` con 10.000 casos; `RES` con volumen sintético | 18–22 min |

**"Suites afectadas" en el PR.** El script de la matriz (Parte B) toma los archivos cambiados (`git diff --name-only origin/main...`), los resuelve a features por las rutas, operaciones y consultas que tocan, y devuelve el filtro `-g` de Playwright con los identificadores de esas features. Siempre se agregan los recorridos de 06 §4 que citan alguna de esas features. Si el diff toca el marco (`apps/web/src/app/(finn)/layout.tsx`, `componentes/navegacion/`, `sw/`), se corre la suite completa.

**Concurrencia.**
- En PR: `concurrency: { group: pr-<número>, cancel-in-progress: true }`. Un push nuevo cancela la corrida anterior.
- En `main`: `cancel-in-progress: false`. GitHub deja una sola corrida pendiente y reemplaza las que esperan, así que varios merges seguidos se prueban y despliegan juntos (uno en curso y uno pendiente). La estimación de 6.4 supone que los 40 merges del mes producen unas 25 corridas.

### 6.2 Orden y dependencias

`integracion` y `e2e` dependen de `rapido` (`needs`). `e2e` no depende de `integracion` y corren en paralelo; los minutos son los mismos. `desplegar` depende de los tres. Si `rapido` falla, no se gasta nada más.

### 6.3 Qué bloquea un merge (DP-10, P7-13)

**Hallazgo.** En un repositorio privado del plan gratuito de GitHub no hay protección de rama ni checks obligatorios: la documentación los da para repositorios públicos del plan gratuito y para los privados de Pro y Team. Ningún documento aprobado lo supone, así que no hay contradicción. Pero el merge no se puede bloquear técnicamente. La puerta queda así:

| Barrera | Qué impide | Cómo |
|---|---|---|
| **Despliegue** | Que algo rojo llegue a producción | `desplegar` tiene `needs` sobre los tres jobs de la misma corrida de `main`. Un `main` rojo no despliega, y la siguiente corrida verde despliega todo junto. Ya era el diseño de ADR-10 |
| **Regla de trabajo para los agentes** | Mergear un PR rojo | El archivo de instrucciones del repositorio (ADR-21) obliga a mergear solo con `pnpm pr:mergear <número>`. El script consulta `gh pr checks`, exige verde en `rapido` y, si corrieron, en `integracion` y `e2e`, y recién entonces llama a `gh pr merge --squash`. Un agente que mergea a mano incumple la instrucción, y la siguiente barrera lo hace visible |
| **`main` rojo visible** | Que nadie se entere | Si `ci.yml` falla en `main`, GitHub envía el correo de workflow fallido (TU-01, paso 4, de `08-tareas.md`); no hay push ni evento **[F8]** (CH-02) |

**Aprobado en P7-13 a).** *Alternativas descartadas:* hacer público el repositorio (descartado en P7-6); GitHub Pro (US$ 4 al mes, rompe el costo de $0).

### 6.4 Minutos al mes con 150 pushes (P7-6)

**[CH-46]** El repositorio es público y los runners estándar no se cobran: este modelo describe el uso, no un límite. Los márgenes contra 2.000 quedan sin efecto mientras sea público.

**Supuestos de volumen.**
- 150 pushes a ramas de PR al mes, en unos 40 PR (3,75 pushes por PR).
- 40 merges a `main`, que con la concurrencia de 6.1 dan unas 25 corridas.
- 40 % de los pushes tocan la base (`afecta_db`).
- 1,5 pushes por PR en estado "listo", de los cuales el 70 % toca la web.
- El nocturno corre 3 noches por semana (13 al mes).

**Supuestos de facturación.**
- Runner Linux estándar (2 núcleos en repositorios privados), sin multiplicador.
- Cada job se cobra **redondeado hacia arriba al minuto**. La página actual de facturación no lo dice; era la regla documentada, y el modelo la toma como peor caso.

**Base medida en V7-06**, en este entorno, que no es el runner:
- Instalación del monorepo en frío: 27 s; con el almacén en caché: 4 s. El almacén pesa 1,2 GB, y restaurarlo de la caché del runner toma de 20 a 40 s (estimado).
- `next build` de la app de prueba de 05 (14 rutas), limitada a 2 núcleos: 14 s. La app real tiene 78 rutas: estimado de 45 a 90 s.
- Propiedades: 5 invariantes con 300 casos tardan 1,7 s; con 2.000, 4,8 s; con 10.000, 17,7 s.
- 12 migraciones: 0,58 s. Clonar una base de prueba: 91 ms. 50 escrituras por PgBouncer: 0,38 s.
- E2E: 0,2 a 0,6 s por prueba simple, más 3 s de arranque.

**No medido aquí** (sin acceso a Docker Hub): la descarga de imágenes de Testcontainers y de la pila local, y el arranque de `auth`. Estimados de 15 a 30 s para PostgreSQL y de 60 a 90 s para la pila mínima.

| Concepto | Corridas al mes | Minutos por corrida (cobrados) | Total |
|---|---|---|---|
| `rapido` en PR | 150 | 3 | 450 |
| `integracion` en PR (`afecta_db` o listo) | 150 × 0,4 = 60 | 4 | 240 |
| `e2e` en PR listo con `afecta_web` | 40 × 1,5 × 0,7 = 42 | 7 | 294 |
| `rapido` en `main` | 25 | 3 | 75 |
| `integracion` en `main` | 25 | 4 | 100 |
| `e2e` en `main` (completo) | 25 | 11 | 275 |
| `desplegar` | 25 | 3 | 75 |
| `nocturno` | 13 | 20 | 260 |
| `respaldo` (ADR-22) | 30 | 2 | 60 |
| `restauracion` (ADR-22) | 1 | 5 | 5 |
| **Total estimado** | | | **1.834** |

Margen dentro de los 2.000: **166 minutos (8 %)**. Con la incertidumbre de los tiempos no medidos (±25 % en los jobs con Docker), el rango va de unos **1.550 a 2.100 minutos**. **Con 150 pushes al mes, el plan no tiene un margen cómodo sin las palancas de 6.5.** Resuelto en P7-14 a): nocturno 3 noches por semana y M4 al proyectar más de 1.700.

Con 60 pushes al mes (el piso de P7-6: unos 16 PR y 12 corridas de `main`), el mismo modelo da unos **970 minutos**.

**Almacenamiento.**
- Artefactos (500 MB compartidos): trazas y videos de Playwright solo en fallos, con retención de 3 días; informes JSON de 1 a 2 MB por corrida.
- Caché (10 GB por repositorio): almacén de pnpm 1,2 GB, Chromium unos 180 MB, WebKit unos 100 MB y la caché de TypeScript y ESLint. Menos de 2 GB en total.

**Proyecto real.** Ni Vercel ni Supabase se usan en CI, salvo `desplegar` y el respaldo nocturno, que ya estaban en el costo de 02 §6.

### 6.5 Palancas para no pasar los 2.000 (DP-12)

**[CH-46]** Mientras el repositorio sea público, M4 y el recorte permanente quedan sin efecto: `minutos.ts` sigue midiendo y publicando el uso por job, pero `decidir` devuelve siempre `normal`, sin recortes ni aviso. M1, M2, M3 y M5 ya están en los workflows y no cambian.

| # | Palanca | Ahorro estimado | Cuándo se activa |
|---|---|---|---|
| M1 | `integracion` solo con `afecta_db` o PR listo (ya en la tabla) | — (incluido) | Siempre |
| M2 | `e2e` solo en PR listo (ya en la tabla; 05 §13.4 lo preveía) | — (incluido) | Siempre |
| M3 | Coalescer corridas de `main` (ya en la tabla) | — (incluido) | Siempre |
| M4 | Modo ahorro: nocturno 1 vez por semana (≈ −180) y `e2e` de PR una sola vez por PR, al pasar a listo, no en los pushes posteriores (≈ −100) | ~280 | Automático, **sin token personal**. El primer paso de `nocturno` calcula la proyección del mes con `tools/ci/minutos.ts` y la guarda en la caché de Actions. Los demás workflows la restauran al empezar. Detalle abajo. **Nunca toca `respaldo` ni `restauracion`** (§32.3) |
| M5 | Fusionar `rapido` e `integracion` en un solo job cuando corren los dos | ~60–90 (un arranque menos por corrida) | Si el primer mes medido supera 1.600 |
| M6 | ~~Runner propio en la PC con Windows~~ | — | **Descartado** (P7-14) |

**Permisos de M4 (P7-14).** Pediste un token de grano fino limitado a este repositorio, con lo mínimo para leer el uso y escribir variables de Actions.
- **La API de uso de una cuenta personal no admite ese alcance.** "Obtener el informe de uso de facturación de un usuario" funciona con tokens de grano fino, pero pide el permiso **"Plan" de usuario (lectura)**. Es un permiso de cuenta: lee la facturación de toda la cuenta, no se limita a un repositorio.
- **`GITHUB_TOKEN` no puede escribir variables de Actions.** Su lista de permisos no incluye "variables". Escribirlas pediría un token de grano fino con "Variables: lectura y escritura" sobre el repositorio, más "Metadata: lectura", que es obligatorio.
- **Diseño elegido, como pediste para este caso:** sin token personal.
  - `tools/ci/minutos.ts` suma la duración de cada job del mes con la API de ejecuciones de workflows (`/actions/runs?created=>=AAAA-MM-01` y `/actions/runs/{id}/jobs`). Usa el `GITHUB_TOKEN` del propio job con `permissions: { actions: read }`.
  - Redondea cada job hacia arriba al minuto, el peor caso de 6.4, y proyecta linealmente al fin de mes.
  - **No usa los endpoints de "uso de una ejecución" (`…/timing`):** GitHub anunció su retiro con la plataforma nueva de facturación.
  - El cálculo es el primer paso de `nocturno`, antes de mirar si `main` cambió, para que corra las 3 noches aunque el resto se salte.
  - El modo (`normal` o `ahorro`) no se guarda en una variable sino en la **caché de Actions**: el nocturno guarda `ci-modo.json` con la clave `ci-modo-AAAAMM-<run_id>`, y `ci.yml` la restaura por el prefijo `ci-modo-AAAAMM-`. La caché de `main` es visible desde las ramas de PR.
  - Si no hay entrada (principio de mes o caché expirada), el modo es `normal`.
  - Costo: unas 250 llamadas a la API por cálculo, 3 veces por semana, lejos del límite de 1.000 por hora del `GITHUB_TOKEN`.
  - Probado en V7-07 con datos de ejemplo: 4 jobs de 2:31, 3:20, 11:00 y 20:01 cuentan 39 minutos.
- **Recorte permanente.** Si el primer mes real pasa de 1.700, la Parte D fija un recorte permanente (por ejemplo, M5, o `e2e` de PR solo al pasar a listo), no M4 activándose todos los meses.

El primer mes de la Fase 8 sirve de calibración: el nocturno sube el uso real por job como artefacto `minutos-AAAAMM` (90 días), y la Parte D fija los valores con esos datos **[F8]** (CH-02).

### 6.6 Presupuestos de rendimiento en CI (P7-5)

| Presupuesto | Origen | Tipo | Dónde | Regla |
|---|---|---|---|---|
| Tamaño de JS compartido, de la biblioteca de formularios y por ruta | 05 §13.1 | Determinista (bytes) | `e2e` en `main` | Bloquea siempre (no despliega) |
| Tamaño del precache ≤ 1,5 MB | 05 §13.4 | Determinista | `e2e` en `main` | Bloquea siempre |
| `calcular` ≤ 150 ms y carga ≤ 500 ms a 10 años (volumen alto) | 02 §2.3, 04 §5.6 | Tiempo | nocturno | Mediana de 5 en el runner; si se supera, abre un aviso y fija `FINN_REN_ROJO` (§7.3). Si la mediana queda a menos de 30 % del presupuesto durante 3 noches, se propone un CT con los datos; no se ajusta solo |
| `aplicar` ≤ 300 ms, consulta ≤ 30 ms, escritura ≤ 400 ms | 04 §5.6, §6.0.7 | Tiempo | nocturno | Igual |
| LCP ≤ 2,5 s, CLS ≤ 0,1 | 05 §13.4 | Tiempo | nocturno | Mediana de 3 de Lighthouse (05 §13.4); regla de 30 % igual |
| INP de laboratorio ≤ 200 ms | 05 §13.4 | Tiempo | nocturno | Mediana de 3 (05 §13.4) |

Un presupuesto de tiempo superado no bloquea el despliegue del día: los runners compartidos tienen ruido, y P7-5 pidió no aflojarlos en silencio, pero tampoco tratar el ruido como un error. Lo que bloquea es la **persistencia**: con `FINN_REN_ROJO` activo más de 7 días, `rapido` falla hasta que se corrija o se apruebe un CT.

---

## 7. Pruebas inestables (DP-11)

### 7.1 Determinismo por diseño

| Fuente de inestabilidad | Regla |
|---|---|
| Reloj | Ninguna prueba compara contra el reloj de pared. `DOM` y `PROP` reciben `hoy`; `INT` y `RH` fijan `finn.hoy` y el desfase; `E2E` fija los tres relojes (§4). Lint en las pruebas: prohibido `Date.now()`, `new Date()` sin argumentos y `setTimeout` con espera fija en `e2e/` (además de `playwright/no-wait-for-timeout`, 05 §14.1) |
| Zona | `TZ=UTC` en el proceso de Node (ADR-05); la sesión de la base en UTC en cada transacción (BE-33); el navegador con `timezoneId: 'America/El_Salvador'`, salvo el proyecto `zona-distinta` |
| Orden | Base por archivo (§5.2); en E2E, `workers: 1` en lo que escribe (05 §14.1); Vitest con `sequence.shuffle: true` en `DOM`, `PROP` y `CTR`, con la semilla impresa, para que no quede ninguna dependencia de orden escondida |
| Aleatoriedad | fast-check con semilla por corrida (`FC_SEED` = número de corrida de CI), impresa en el resumen; un fallo se reproduce con `FC_SEED=<n> pnpm test:unidad -t <id>` |
| Identificadores | Los ids de las filas que se comparan salen de la semilla del escenario (UUIDv5 de V-19); nunca se compara un `gen_random_uuid()` |
| Red | E2E bloquea toda petición que no vaya al servidor de la app o a la pila local (`page.route('**/*', …)` en el ayudante de configuración); el servicio de push se reemplaza por un receptor local (Parte C) |
| Concurrencia | Las pruebas de dos escritores (ADR-06) coordinan con eventos explícitos (por ejemplo, el primero avisa que tomó el bloqueo), nunca con `sleep` |
| Espera de la pila | Los jobs esperan la salud de cada servicio (`pg_isready`, `/auth/v1/health`) con tiempo máximo, no un tiempo fijo |

### 7.2 Reintentos (P7-4)

- `E2E`, `SW` y `REN` web: `retries: 1` en CI, con `trace: 'on-first-retry'` (05 §14.1). Una prueba que pasa al reintentar queda como **inestable** en el informe.
- Todos los demás niveles: `retries: 0`. Vitest falla en el primer error. Una propiedad que falla siempre es un error: la semilla lo reproduce.

### 7.3 Aviso y cuarentena

1. **Aviso.** Al terminar `e2e` o `nocturno`, `tools/pruebas/inestables.mjs` lee el informe JSON de Playwright. Por cada prueba con estado `flaky` abre o actualiza un issue con la etiqueta `prueba-inestable`, con el identificador, la traza y la corrida.
2. **Cuarentena.** Si una prueba quedó inestable **2 veces en 7 días**, el mismo script la agrega a `pruebas/cuarentena.json`, con `{ id, motivo, desde, vence }`, donde `vence` = `desde` + 14 días.
3. **Mientras está en cuarentena:**
   - la prueba corre en el nocturno, pero no hace fallar el job;
   - en PR y en `main` se excluye con `--grep-invert`;
   - la matriz (Parte B) la cuenta como **sin prueba activa**. Si es la única prueba de un CA [I], la puerta de salida (Parte D) queda cerrada.
4. **Vencimiento.** Con una entrada vencida, `rapido` falla. Hay que corregir la prueba, que sale de la cuarentena en ese mismo PR, o eliminarla. Eliminarla deja el CA sin cobertura en la matriz, que vuelve a fallar.

**Justificación.** La cuarentena con fecha evita las dos fallas típicas: una prueba inestable que bloquea a todos, y una desactivada que nadie vuelve a mirar. Atarla a la matriz hace que una cuarentena larga no pueda esconder un criterio sin probar. *Alternativas descartadas:* reintentar en todos los niveles (P7-4); cuarentena sin fecha (se acumula).

---

## 8. Cobertura (DP-09, P7-7)

- **Umbral:** ramas ≥ **90 %** en `@finn/dominio`, medido con `@vitest/coverage-v8` sobre `DOM`, `ESC@motor` y `PROP` (300 casos) en `rapido`. Por debajo, `rapido` falla.
- **Lo que midió V7-03:** las propiedades y el diferencial dejan el núcleo de prototipo en **93,9 % de ramas** y 100 % de líneas. Las ramas sin cubrir son exactamente los interruptores de los mutantes de control (líneas 39, 45–49 y 64), así que la cobertura de las ramas reales es del 100 %. Con 300 casos se llega a la misma cobertura que con 2.000.
- **Por qué 90 y no 100.** El motor real tendrá ramas defensivas (rechazos que las precondiciones vuelven inalcanzables desde la API) y ramas que solo alcanza un escenario de la Fase 8. 90 deja ese margen sin premiar pruebas vacías. Se revisa en la Parte D con el motor real.
- **Fuera del umbral:** `@finn/aplicacion`, `@finn/db` y `apps/web`. Ahí manda la matriz: cada CA, ESC, AV, invariante y recorrido tiene su prueba (P7-7 b).
- **Mutantes.** V7-03 mostró que la cobertura no basta: la propiedad 003 (deuda = R⁺ + S − RE) se cumple por definición y no detecta ninguno de los 4 mutantes. Los detectan la identidad de saldo, el cierre, el orden de inserción y el diferencial. La Parte C propone ejecutar los mismos 4 mutantes como control negativo en el nocturno: si un mutante sobrevive, las propiedades dejaron de proteger esa regla.

---

## 9. Verificación de la Parte A

**Entorno.**
- Node 24.22.1; PostgreSQL 16.15 local; PgBouncer 1.22.0; Prisma 7.10.0 con `@prisma/adapter-pg`; Vitest 3.2.7; fast-check 4.10.2; Next.js 16.4.1; React 19.3.1; Playwright 1.56.0 con Chromium 141; Python 3.13 para el oráculo.
- **Sin acceso a:** Docker Hub, por lo que no hay Testcontainers ni pila de Supabase; el repositorio de PGDG, por lo que no hay PostgreSQL 17; los binarios nativos de Prisma (403); WebKit de Playwright.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V7-01 | Job de base de CI: bootstrap + 12 migraciones como `finn_migraciones`; C5, R14 y C6; suite `INT` de 6 pruebas como `finn_app` con base clonada por archivo | Migraciones: 0,58 s. C5: 0 filas. R14: 0 filas. C6: solo las diferencias esperadas (las funciones de EN-2 y de `m_reloj`, que faltan en la instantánea de 03, con su `EXECUTE` para `finn_app`, y `_prisma_migrations`, que no existe porque se aplicó con `psql`). Clonar: 91 ms. 6 de 6 pruebas: FN001 sin bloqueo; revisión +1 por transacción; ESC-01 paso 1 con reloj simulado; FN002 con fecha posterior a hoy; FN003 diferida al confirmar; rol sin `BYPASSRLS` ve 0 filas; `finn_app` sin `TRUNCATE` ni `DISABLE TRIGGER` | `catalogo.sql` (C6) no registra los `DEFAULT` de columna: un `DEFAULT` que volviera a `now()` solo lo detectan R15 (V7-02 P10) y C4. La prueba llamó dos veces a `finn.instante()` en una sentencia y `f_fechas_hoy` la rechazó con FN008 (S3-5). El diseño es correcto (04 §4.2 toma el instante una vez); la regla para las pruebas y la Fase 8 es un instante por operación | Testcontainers, PostgreSQL 17, `prisma migrate deploy` nativo (403) y C4 (P7-12) |
| V7-02 | Reloj de la base (CT-02): migración `m_reloj`, `reloj-simulado.sql`, regla R15 | 10 de 10: R15 da 0 en la plantilla; en la plantilla un desfase de un año se ignora; el override se niega en una base sin marca; en la base de prueba R15 detecta 3 filas; C6 difiere exactamente en `ahora()`, `instante()` y `desfase()`; ESC-46 da `recibido_en` 19:00 local del 20/02/2027 (21 en UTC) con `hoy()` 20; `instante()` monótono y coherente con `ahora()`; `finn_app` no puede reemplazar `ahora()` ni activar la marca; el control negativo de R15 detecta las 2 violaciones sembradas | — | El `DEFAULT` nuevo en `schema.prisma` frente a C4 (P7-12) |
| V7-03 | Propiedades reales sobre un núcleo del motor en TypeScript (períodos, D2, arrastre, tarjetas, S y RE, LPA) | 5 propiedades con 2.000 casos cada una pasan (inv. 1, 28, 2 y 3, 26 y §4.15). Diferencial contra `motor_min.py` (Fase 6): 1.000 casos idénticos. 4 de 4 mutantes detectados (arrastre negativo, traslado sin tope, sin orden D2, cierre adelantado). Cobertura de ramas: 93,9 % (100 % de las reales). Tiempos: 1,7 s, 4,8 s y 17,7 s con 300, 2.000 y 10.000 casos | La propiedad 003 es tautológica: no detecta ningún mutante sola. El oráculo y la identidad son los que protegen los valores | El motor real (Fase 8); devoluciones con tarjeta, cobros y metas quedan fuera del subconjunto del oráculo |
| V7-04 | Next 16 + Playwright con el reloj de prueba cambiado en ejecución; barreras de producción | 3 de 3: el servidor sigue el archivo en cada petición sin reiniciar; una pantalla abierta pasa al día siguiente a medianoche sin recargar (05 §6.7) con `page.clock`; `next start` corre con `NODE_ENV=production`. Barreras: con `VERCEL_ENV=production` o `FINN_ENTORNO=produccion` y el archivo, la app no arranca (salida 1); con `VERCEL_ENV=production` sin archivo arranca con el reloj real; la función devuelve `null` en producción | `NODE_ENV=production` en E2E contradice BE-30 (P7-10) | WebKit (no disponible aquí); la integración con `escribir()` real (Fase 8) |
| V7-05 | Pooler en modo transacción (PgBouncer 1.22, `max_prepared_statements = 0`, 2 conexiones de servidor) con Prisma 7 | 5 de 5 (tabla de 5.3) | POOL-04: un bloqueo de sesión engaña a `tiene_bloqueo()` detrás de un pooler (5.3) | Supavisor real (H-04, H-06) |
| V7-06 | Tiempos para el modelo de minutos | Ver la base de 6.4 | El almacén de pnpm del monorepo realista pesa 1,2 GB | Tiempos del runner real, descargas de imágenes y arranque de la pila; se calibran en el primer mes (6.5) |

**Arnés de C4 (no concluyente).** Intenté reproducir `prisma migrate diff` con el motor WebAssembly de Prisma 7.10 (`@prisma/schema-engine-wasm`) y el adaptador `pg`, como hizo la Fase 3. El motor falla al iniciar (`valueOf` de un valor indefinido, antes de enviar ninguna consulta). No lo depuré más: el arnés de la Fase 3 no está en su zip y el costo superaba el valor para esta parte. El intento queda en el zip (`prisma/arnes/diff.mjs`) como registro.

---

## 10. Cambios propuestos a documentos aprobados (CT)

Se aplicaron al cerrar la fase (§34).

| CT | Qué cambia | Documentos y secciones | Estado |
|---|---|---|---|
| **CT-01** | Reloj de prueba cambiable en ejecución: `FINN_RELOJ_ARCHIVO` reemplaza a `FINN_HOY_SIMULADO`; `escribir()`, `leer()` y la transacción de guardado del webhook fijan `finn.hoy` y `finn.desfase_ms`. **Lista de permitidos (P7-10):** el reloj de prueba solo se activa con `FINN_ENTORNO === 'pruebas'` y `VERCEL_ENV` sin definir; en cualquier otro caso, con `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO` la app no arranca (barrera 1) y `relojDePrueba()` devuelve `null` (barrera 2); `NODE_ENV` nunca decide. `FINN_ENTORNO` solo existe en CI y en local, nunca en Vercel, y `desplegar` lo comprueba (barrera 1b). Pruebas PRU-SEG-RELOJ-001, 002 y 006. El ayudante de E2E fija también `page.clock` | 04 §13.1.4 (BE-30), §4.2 pasos 2 y 3, §8.2 paso 4, §14 (variables: `FINN_ENTORNO` como variable de CI y local; ninguna variable nueva en Vercel), §15 (`desplegar`: paso de `vercel env ls`); 05 §14.1 ("Datos": reloj); 02 ADR-19 ("Reloj inyectable": la regla de permitidos) | Aprobado (P7-10 a), con la lista de permitidos); **aplicado [F7]** |
| **CT-02** | `finn.ahora()` y `finn.instante()`; los 9 `DEFAULT` con `dbgenerated("finn.ahora()")`, con el respaldo b) de P7-12 si C4 o H-05 no quedan vacíos; R15; L20; conteo de 4.4 | 03 §3.17–§3.28, §4.1, §10.1, §10.3, §11.6; 04 §3.6, §4.2, §8.2, §8.6, §10.1, §10.2 (EN-2), §13.1, §13.6, §5.8 (L20) | Aprobado (P7-12 a), con b) de respaldo); **aplicado [F7]** |
| **CT-03** | Criterios que pedían iPhone o VoiceOver: se declaran probados en Android y en Chrome de escritorio, con WebKit parcial como cobertura automática y el resto como riesgo aceptado (P7-9) | 06 CA-78.15, CA-70.7; 05 §11.10 (lista manual) | Redacción en la Parte C (§25); **aplicado [F7]** |
| **CT-04** | Nivel `CMP` con el modo navegador de Vitest (Chromium de Playwright) | 02 ADR-19 (tabla de niveles); 05 §14 (estructura de pruebas) | Aprobado; verificado en V7-15; **aplicado [F7]** |
| **CT-05** | ADR-01: "TypeScript estricto en todo el código de la aplicación; los activos de prueba fuera de `apps/` y `packages/` pueden usar otro lenguaje" (P7-11). Primer caso: el oráculo `tools/pruebas/oraculo/motor_min.py`, con el alcance congelado al subconjunto de V7-03 | 02 ADR-01 | Aprobado (P7-11 a)); **aplicado [F7]** |

---

## 11. Preguntas de la Parte A (resueltas)

| # | Pregunta | Respuesta | Dónde quedó |
|---|---|---|---|
| P7-10 | Contradicción entre BE-30 (`NODE_ENV`) y `next start` en E2E | a), con lista de permitidos | §4.3, CT-01, V7-07 |
| P7-11 | Oráculo en Python frente a ADR-01 | a), con CT menor a ADR-01 | §3.1, CT-05 |
| P7-12 | `DEFAULT finn.ahora()` frente a C4 | a), con b) de respaldo automático | §4.4, CT-02; disparador en la Parte D |
| P7-13 | Puerta de merge sin protección de rama | a) | §6.3 |
| P7-14 | Margen de minutos con 150 pushes | a); M4 sin token personal; M6 descartado | §6.5 |

---

# Parte B — Datos de prueba y matriz de trazabilidad

## 12. Datos de prueba (DP-13, DP-14, DP-16, DP-17)

### 12.1 Principios

- **Todo es sintético y vive en el repositorio como código.** Ningún dato real de cuentas, SMS ni estados de cuenta entra al repositorio. Las muestras reales que pide SP-01 se tratan en la Parte C (anonimización y dónde se guardan).
- **Los números esperados salen de los documentos aprobados**: 01 §8, 06 §4 y su `recorridos.py`, y A.7. Nunca se copian de lo que devuelve el código, porque una prueba que copia el resultado no prueba nada.
- **Montos en dólares** en los archivos de datos, como en las tablas de 01. El ejecutor los pasa a centavos con `usd(x) = Math.round(x * 100)`, que es exacto para literales de dos decimales.
- **Identificadores deterministas.** Las filas que se comparan llevan UUIDv5 derivados de la semilla del escenario (V-19); nunca se compara un `gen_random_uuid()`.
- **Fechas.** Las de 01 §8.0: 2027, ciclo con día 21. La excepción es 4.2, que usa las de A.7 (período del 21/09 al 20/10/2026).

### 12.2 Dónde vive cada tipo de dato

| Dato | Archivo | Lo usan | Fuente |
|---|---|---|---|
| Escenarios ESC-01 a ESC-50 | `packages/dominio/escenarios/datos/esc-nn.ts` | `ESC@motor`, `ESC@int`; E2E de 4.1, 4.4 y 4.5, que parten del estado de un paso | 01 §8 con sus enmiendas (PR-3 en ESC-50) |
| Formato y ejecutores de escenarios | `packages/dominio/escenarios/{tipos,ejecutar,motor}.ts`; `packages/aplicacion/test/escenarios/int.ts` | Los dos ejecutores | DP-13 |
| Semillas de los recorridos | `packages/dominio/escenarios/semillas/estado-4-n.ts` | E2E y su comprobación en `DOM` | 06 §4, `recorridos.py`, A.7 |
| Generadores | `packages/dominio/src/pruebas/generadores.ts` (subruta `@finn/dominio/pruebas`) | `PROP`, `REN`, `RES` | V7-03 |
| Volumen sintético | `tools/pruebas/volumen/` | `REN`, `RES`, H-09 | 02 §2.2: entre 70.000 (base) y 200.000 filas (alto) a los 10 años |
| Cuerpos de contratos | `packages/aplicacion/src/**/__datos__/*.json` | `CTR`, `RH` | 04 BE-60 y esquemas Zod |
| SMS y CSV sintéticos | `packages/sms/pruebas/`, `packages/conciliacion/pruebas/` | `DOM`, `INT`, `RH` | Formatos de 03 §9.5 (⚠ S6-1) |
| Oráculo | `tools/pruebas/oraculo/` | Diferencial en `PROP` | P7-11, CT-05 |
| Usuario de E2E | `tools/pruebas/e2e/usuario.ts` | `E2E` | 05 §14.1 |

La subruta `@finn/dominio/pruebas` solo la pueden importar archivos de prueba. Una regla de fronteras de ESLint (L1, 04 §5.8) lo hace cumplir, para que ningún generador llegue al bundle.

### 12.3 Escenarios como datos (DP-13)

Cada escenario de 01 §8 es **un archivo de datos**, y lo ejecutan **dos ejecutores**:
- **`motor`** aplica cada operación a los hechos en memoria (`aplicar`) y calcula (`calcular`).
- **`int`** ejecuta la operación real de `@finn/aplicacion` contra PostgreSQL, como `finn_app` y con el protocolo de 04 §4.2. Después lee con la consulta, que carga los hechos desde la base y calcula.

Que los dos pasen con el mismo archivo prueba a la vez el cálculo y que lo escrito y releído da lo mismo que la memoria, la "carga nueva" de 04.

**Formato** (prototipo en `escenarios/tipos.ts` del zip):

```ts
export default {
  id: 'ESC-06', titulo: 'Asignación posterior que cubre el sobregiro con tarjeta', refs: ['H3'],
  continua: { escenario: 'ESC-05', hastaPaso: '2' },          // "Continúa el paso 2 de ESC-05"
  pasos: [
    { n: '3', ops: [{ op: 'asignar', categoria: 'Super', monto: 100, periodo: 'P1' }],
      espera: { ef: 1000, lpa: 600, disp: { Super: 0, 'Pago T': 400 }, sobta: 0, tarjetas: { T: [400, 0, 0] } } },
  ],
} satisfies Escenario;
```

**Reglas del formato y del ejecutor**

| # | Regla | Por qué |
|---|---|---|
| 1 | Cada fila de la tabla de 01 es un paso con sus aserciones. Las columnas Ef, LPA, Disponibles, SobTA y Tarjeta (deuda · S · RE) se comparan siempre que la fila las trae | 01 §8.0: "cada fila es una aserción" |
| 2 | **Disponibles:** las categorías listadas se comparan con su valor; las no listadas deben valer 0 | 01 §8.0 lista "los Disp(·, A) distintos de cero" |
| 3 | La **identidad de saldo** se comprueba en cada fila, aunque la tabla no la escriba | inv. 1 |
| 4 | **"Continúa"**: el ejecutor corre la base hasta el paso indicado y también compara sus filas. Si la base no coincide, falla con el identificador de la base | Una base rota no puede dar por bueno el escenario que depende de ella |
| 5 | **Filas de contraste** (2′ de ESC-17, 1′ de ESC-45) y **alternativas** (3a y 3b de ESC-38): `alternativaDe` corre la fila en una rama, desde el estado anterior a la fila que reemplaza; las filas siguientes de esa rama llevan `rama` | Ninguna fila de contraste contamina la línea principal |
| 6 | **Estado inicial** ("Historial", paso 0): es un paso con las operaciones que lo construyen y sus aserciones | ESC-31, ESC-42, ESC-44 y ESC-50 lo traen como fila |
| 7 | **Rechazos:** `espera.rechazo` con el código de 04 (por ejemplo, `I1` en ESC-03 paso 4). La operación devuelve ese rechazo, y la instantánea completa queda igual a la anterior, no solo las columnas | 01 §5.0.1: atomicidad |
| 8 | **Avisos (DP-14):** la columna Notas es un **mínimo**: los avisos listados deben estar, y puede haber otros | En 01, Notas no es exhaustiva: ESC-05 paso 2 no menciona AV-07, que se cumple. El conjunto exacto de avisos por pantalla lo prueban los CA |
| 9 | **Columnas fuera de la instantánea** (patrimonio, reportes, desglose del pago, metas, préstamo): van en `espera.extra`, con el nombre de la consulta u operación que las devuelve | El ejecutor `int` las compara contra lo que devuelve la operación real |
| 10 | **Nada se omite en silencio.** Una aserción que un ejecutor no puede evaluar queda como "omitida" con su motivo. Debe evaluarla el otro ejecutor; si ninguno la evalúa, el escenario falla | V7-08: el desglose y AV-10 los evalúa `motor`, no la lectura de `int` |
| 11 | **Enmiendas:** el archivo sigue la versión enmendada y lo dice en un comentario. ESC-50 sigue PR-3: el paso 1 registra solo el 25 de febrero, y el paso 1b registra el 25 de enero con un toque | Los documentos con enmiendas mandan (0.3) |

**Convenciones de completado (DP-16).** Algunas tablas de 01 no dicen todo lo que una operación necesita. Se completa siempre igual:
- hoy: el que diga el escenario o la fila; si no lo dice, el día siguiente a la última fecha que cita, dentro de su período (ESC-47: 16/02/2027); si no cita ninguna, el 10/02/2027 (P1);
- fecha de la transacción: el "hoy" del paso;
- hora de registro: hoy a las 12:00, más un minuto por operación en el orden de la tabla. Así se conserva el orden de registro que da la clave de orden (D2);
- apertura de las cuentas: 21/01/2027 (inicio de P1), salvo que el escenario diga otra;
- tarjetas: límite $5,000.00 y día de corte 15, salvo dato del escenario;
- grupo "Gastos" para las categorías normales;
- saldo inicial 0, salvo dato del escenario.

**Regla:** si una convención cambia un número de la tabla, es un problema del dato. Se plantea como pregunta y el número esperado nunca se ajusta. En V7-08 ninguna convención cambió un número.

**Cadenas "continúa" y "mismo historial" de 01:**
- ESC-06 ← ESC-05 paso 2.
- ESC-07 ← ESC-05 paso 3.
- ESC-09 ← ESC-08 paso 2.
- ESC-18 ← ESC-17 paso 2.
- ESC-32 ← ESC-31 paso 0 ("mismo historial").
- ESC-33 ← ESC-31 paso 1.

**Medido en V7-08:**
- 8 escenarios encadenados (ESC-05 a 10, 17 y 18) con 19 filas, incluida la fila de contraste 2′.
- `motor`: 14 ms en total.
- `int`: 0,33 s por escenario en promedio, contra el esquema real de 03. Solo se clona la base antes de una fila con contraste; ESC-17, que tiene una, tarda 1,3 s.
- Los 50 escenarios se estiman en unos 20 s en serie en `int`, y unos 6 s con 4 procesos, dentro de los 3 a 4 minutos de `integracion` (6.1).

### 12.4 Estados sembrados de los recorridos (DP-17)

| Recorrido | Estado inicial | Hoy | De dónde salen los números | Semilla |
|---|---|---|---|---|
| 4.1 Primer uso | Base recién sembrada (03 §9) y usuario sin factores | 05/02/2027 | ESC-01 y los CA citados | Ninguna: el recorrido crea todo por la interfaz |
| 4.2 Un día típico | **A.7 completo** (05, anexo del encargo de diseño; P7-17 b): todas sus pantallas como un solo estado | 15/10/2026 | A.7, 06 §3.5.12 y los CA que lo citan | `estado-a7.ts`, **pendiente de P7-19** (V7-13) |
| 4.3 Inicio de período | `estado_4_3` de `recorridos.py` | 21/04/2027 | `recorridos.py` | `estado-4-3.ts` |
| 4.4 Pagar la tarjeta | ESC-08 hasta el paso 1 | 19/02/2027 | 01 | El escenario |
| 4.5 Conciliar | ESC-47 paso 0 | 16/02/2027 (DP-16) | 01 | El escenario |
| 4.6 Cerrar con sobregiros | `estado_4_6` de `recorridos.py` | 12/02/2027 | `recorridos.py` | `estado-4-6.ts` |

- **Se siembra por operaciones** de `@finn/aplicacion`, no con SQL directo: así la base solo tiene estados alcanzables. El ayudante de E2E `sembrar(estado)` corre en el proceso de Playwright contra la base de la pila local, con el reloj simulado de cada hecho (fecha y hora de registro), antes de abrir el navegador.
- **Cada semilla tiene su comprobación en `DOM`** (`PRU-DOM-MOTOR-9nn [REC-4.n]`): el motor da los números de la fuente antes de que la E2E la use. Si la semilla está mal, falla esa prueba y no una E2E difícil de diagnosticar. V7-10 lo hizo con 4.6 y con Restaurantes de A.7.
- **A.7 completo (P7-17 b).** La semilla `estado-a7.ts` reproduce A.7 entero. `PRU-DOM-MOTOR-903 [REC-4.2, CA-62.1, CA-62.2, CA-63.3]` comprueba la identidad de saldo y que cada número de A.7 y de 3.5.12 sale igual del motor. Es también el estado de las capturas de `06-identidad-visual.md`.
- **V7-13 encontró que A.7, tal como está publicado, no es coherente con 01** en 6 puntos (identidad de saldo, actividad de Pago Visa Oro, monto para no generar intereses, arrastre de Restaurantes, SUPER SELECTOS duplicado, Farmacia y Mascota fuera del Presupuesto). No ajusté nada: van en P7-19, y la semilla no se escribe hasta resolverla.

### 12.5 Generadores (PROP)

| Generador | Qué produce | Restricciones que respeta | Lo usa |
|---|---|---|---|
| `fechaArb` | Fechas de 2027 con ciclo 21; con otro ciclo y transición (ESC-45) | Ninguna posterior a hoy | Todos |
| `montoArb` | 1 a 60.000 centavos, con los bordes 1, 99, 100 y 9.999 sesgados | > 0 (CB-28) | Todos |
| `hechosArb` (V7-03, extendido) | Cuentas, ingresos, gastos de varias líneas, pagos, asignaciones, devoluciones D-2 | inv. 6, 12 y DM-2 (una asignación por categoría y período); claves de orden únicas (CB-21) | inv. 1, 2, 3, 26, 28; diferencial |
| `operacionesArb` | Secuencias de operaciones de 01 §5 (modelo con `fc.commands`) | Las precondiciones las decide `aplicar`; un rechazo es un resultado válido | inv. 18, 19, 20, 21, 24; memoria = carga nueva |
| `smsArb` | Textos de los formatos sintéticos con ruido (espacios, mayúsculas, separadores) | Formato válido o inválido marcado | Intérprete y normalizadores |
| `csvArb` | Estados de cuenta sintéticos por formato de ADR-17 | — | Adaptadores de conciliación |

- **Semilla:** `FC_SEED` = número de corrida de CI (7.1).
- **Casos:** 300 en PR, 2.000 en `main` y 10.000 en el nocturno (1.1).

**Qué cubre cada invariante.** La matriz exige al menos una prueba `PROP`, `DOM`, `INT` o `ESQ` por invariante (M4). El reparto previsto, que la Parte C detalla por área:

| Invariantes | Nivel principal | Cómo |
|---|---|---|
| 1, 2, 3, 4, 5, 26, 27, 28 | `PROP` sobre el motor | `hechosArb` y diferencial |
| 6, 7, 8, 9, 10, 11, 12 | `INT` (rechazos FN de los triggers) y `PROP` | Casos fijos de cada código y `operacionesArb` |
| 13, 14, 15, 16 | `INT` | Operaciones de revisión, programadas y conciliación |
| 17, 21 | `PROP` | Períodos y vigencias generadas |
| 18, 19, 20 | `PROP` con `operacionesArb` y `INT` | La operación rechaza; la base no deja escribir |
| 22, 23, 24, 25 | `INT` y `ESQ` | Restricciones y verificaciones diferidas de 03 |

### 12.6 `datos_base` como oráculo (CF-09)

06 §3.10 deja `datos_base` (04 §6.9.4) como insumo de pruebas. Por cada par de campos que se superponen entre un selector de 06 §3.5 y `datos_base`, hay una propiedad `PRU-PROP-REP-nnn`: con `hechosArb`, los dos dan lo mismo.
- 06 nombra un par: `tarjetasPorPeriodo` frente a `TarjetasDto.periodos` (cargos, pagos y deuda al fin de cada período).
- Los demás pares se enumeran en la Parte C, en el área `REP`, al leer las firmas de 6.9.4 contra 3.5.
- Si un par no coincide, es un hallazgo: uno de los dos cálculos está mal, y el documento dice cuál manda (3.5).

### 12.7 Volumen sintético

- `tools/pruebas/volumen/generar.ts --nivel base|alto --anios 10 --semilla N` produce, de forma determinista, el volumen de 02 §2.2: unas 70.000 filas (base) o 200.000 (alto) a los 10 años.
- Usa 2 tarjetas, unas 40 categorías y frecuencias de uso realistas.
- **Carga:** en `INSERT … SELECT` por período, una transacción por período con el protocolo (bloqueo, `finn.hoy` = fin del período). Así pasan los triggers igual que en la app.
- Lo usan:
  - `REN` en el nocturno: `calcular` ≤ 150 ms y carga ≤ 500 ms (04 §5.6);
  - `RES`: respaldo y restauración con volumen;
  - la prueba de humo H-09 desde `iad1`.
- **No medido aquí:** el tiempo de carga del volumen alto. Se mide en la Parte C.

---

## 13. Matriz de trazabilidad (DP-15, DP-18, DP-19, DP-20)

### 13.1 Qué traza

| Objetivo | Cuántos | De dónde los lee el script | Qué cuenta como cubierto |
|---|---|---|---|
| CA | **492**: 233 [I], 232 [M], 24 [P] y 3 de FT-49 (diferida) | 06 §2, por ficha, con su prioridad y las marcas `(manual)`, `⚠` y `(S6-1)` | Una prueba activa que lo cita, o un procedimiento `PRU-MAN` completo; si está marcado `(manual)` o `⚠ (S6-1)`, además, su `PRU-MAN` |
| ESC | 50 | 01 §8 (`#### ESC-nn`) | `PRU-ESC-nn@motor` **y** `PRU-ESC-nn@int` |
| AV | 24 | 01 §5.0.7 | Al menos una prueba automática |
| Invariantes | 28 | 01 §6 (lista numerada) | Al menos una prueba `PROP`, `DOM`, `INT` o `ESQ` que cite `INV-nn` |
| Casos borde | 34 | 01 §9 (`\| CB-nn \|`) (P7-16) | Al menos una prueba automática que cite `CB-nn`, normalmente `DOM` o `ESC@motor` |
| Recorridos | 6 (4.1 a 4.6) | 06 §4, con las fichas que cita cada uno | Una prueba E2E que cite `REC-4.n` |
| Verificaciones previas | **92**: V-01 a V-30, V5-01 a V5-36, V6-01 a V6-13, H-01 a H-12 y la prueba de catálogo de CF-16 | 04, 05 y 06 (por expresión regular), más CF-16 | Una entrada en `pruebas/verificaciones-previas.json` con su prueba permanente (`destino`) o con el motivo por el que no lo es. La tabla V → prueba va en la Parte C |

Los conteos los dio el script sobre los documentos, con 01 completo (V7-09 y V7-11): 77 fichas (31 [I], 38 [M], 8 [P], 1 diferida), 492 CA, 50 ESC, 24 AV, 28 invariantes y 34 CB. La puerta de salida (P7-8) exige los **465** CA [I] y [M]; FT-49 aparece como "diferida" en el informe, no como falta.

**Formato de las referencias** dentro de los corchetes del título: `CA-nn.m`, `ESC-nn`, `AV-nn`, `INV-nn`, `CB-nn`, `REC-4.n`, `V-nn`, `V5-nn`, `V6-nn`, `H-nn`, `CF-nn`, `FT-nn`, `Q-<consulta>` **[CH-34]** (el nombre de la consulta de 04 §6 en camelCase, por ejemplo `Q-detalleLpa`) y `FORM-<operacion>` **[CH-37]** (la clave de operación de `formulario()` de 04 §6.14 en snake_case, por ejemplo `FORM-pagar_tarjeta`). Las decisiones de 00 y 01 (`C1`, `H3`, `Q2a`…) se aceptan como contexto, pero no cuentan como cobertura. Cualquier otra forma es un error (M7).

### 13.2 Entradas

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `docs/01-dominio.md`, `docs/04-backend.md`, `docs/05-frontend.md`, `docs/06-features.md` | Los documentos aprobados, copiados al repositorio con sus enmiendas | La Fase 8, al iniciar; se actualizan solo con un CT |
| `pruebas/inventario.json` | La lista de pruebas, generada **sin ejecutar nada**: `vitest list --json` más `playwright test --list --reporter=json`, unidas por `tools/pruebas/listar.ts` | `pnpm pruebas:listar`, en `rapido` |
| `pruebas/manuales.md` | Los procedimientos `PRU-MAN` (formato abajo) | La Parte C deja la lista; la Fase 8 la completa |
| `pruebas/verificaciones-previas.json` | `[{ id, destino?, motivo? }]` por cada una de las 92 | La Parte C |
| `pruebas/features.json` | Estado de cada ficha: `pendiente`, `en_curso` o `terminada` (DP-15) | El agente de la Fase 8, en el PR de la feature |
| `pruebas/manuales/resultados.md` | Una fila por ejecución de un manual: `\| PRU-MAN-… \| fecha \| dispositivo \| pasa o falla \| quién \| versión o commit \| nota \|` (P7-18) | **Solo el usuario**, con commits firmados con su clave (M17, §22.2) |
| `pruebas/firmantes-permitidos` | La clave pública SSH del usuario, en el formato `allowed_signers` de Git | El usuario, una vez |
| `pruebas/cuarentena.json` | Pruebas en cuarentena, con su vencimiento (7.3) | `tools/pruebas/inestables.mjs` |
| `pruebas/mapa-codigo.json` | Patrones de archivos → features, o `marco` (13.6) | La Fase 8; M12 obliga a que esté completo |
| `pruebas/pendientes-e2e.json` **[F8]** (CH-08) | CA de una ficha [I] probados con el estado sembrado porque la ficha que produce ese estado todavía no existe, con la ficha que los completa ("pendientes de punta a punta") | La tarea de la Fase 8 que cubre el CA; la que completa la ficha los cierra |

**Formato de un procedimiento manual (DP-20):**

```markdown
### PRU-MAN-BAND-001 [CA-03.5, H-03] Prueba en el teléfono con MacroDroid

**Disparador:** antes de marcar FT-03 como terminada, y después de cada cambio en `/api/sms`.

**Dispositivo:** el teléfono Android con MacroDroid (P7-9).

**Pasos:**
1. …
2. …

**Resultado esperado:** el SMS de prueba aparece en la Bandeja como no reconocido (04 §8.8).

**Registro:** fecha, versión desplegada y resultado, en `pruebas/registro-manual.md`.
```

El script exige **Disparador**, **Pasos** numerados y **Resultado esperado** (M10). Un procedimiento incompleto no cuenta como cobertura.

### 13.3 Reglas

| Regla | Qué exige | Cuándo (13.4) |
|---|---|---|
| M1 | Cada CA tiene una prueba activa o un `PRU-MAN` completo; un CA `(manual)` tiene su `PRU-MAN` | Fichas exigidas |
| M2 | Cada ESC tiene `@motor` y `@int` | Si alguna ficha exigida lo cita en su bloque Escenarios |
| M3 | Cada AV tiene una prueba automática | Si alguna ficha exigida lo cita en su bloque Avisos |
| M4 | Cada invariante tiene una prueba `PROP`, `DOM`, `INT` o `ESQ` | Desde la primera ficha terminada (el motor ya existe) |
| M5 | Cada recorrido tiene su E2E | Cuando todas las fichas que cita están exigidas |
| M6 | Las 92 verificaciones previas están en el JSON, con destino existente o con motivo | Siempre que estén en el JSON; el destino, en modo puerta |
| M7 | Toda referencia citada existe en los documentos (incluidas las `Q-<consulta>` de 06 §6.3, **[CH-34]**, y las `FORM-<operacion>` de `formulario()`, **[CH-37]**) | Siempre |
| M8 | Identificador bien formado, con nivel y área de las tablas 1.1 y 2.2; único; nivel coherente con el archivo (§2.3); todo archivo de prueba lleva identificador | Siempre |
| M9 | La cuarentena no cuenta como cobertura; una entrada vencida falla; la cuarentena no cita pruebas inexistentes | Siempre |
| M10 | Cada `PRU-MAN` tiene disparador, pasos y resultado esperado | Siempre |
| M11 | Un CA `⚠ (S6-1)` tiene el `PRU-MAN` que lo rehace con las muestras reales; un CA `⚠` sin S6-1 sin `PRU-MAN` es un aviso | Fichas exigidas |
| M12 | Cada archivo de código de `apps/web/src` y `packages/*/src` está en `mapa-codigo.json` | Siempre |
| M13 | `features.json` solo cita fichas que existen; una ficha diferida no puede salir de `pendiente` sin el CT que la active; un CA con pruebas en una ficha `pendiente` es un aviso | Siempre |
| M14 | Cada CB tiene una prueba automática (P7-16) | Desde la primera ficha terminada |
| M15 | Una ficha `terminada` tiene **todas** las pruebas automáticas de sus CA fuera de cuarentena y, con los resultados de la corrida (`--resultados`), en verde (P7-18) | Cuarentena: siempre; verde: en el job `cierre` (13.5) |
| M16 | Cada `PRU-MAN` de una ficha exigida tiene como **último** resultado "pasa" en `resultados.md`; si no, la ficha queda con "manual pendiente": aviso en modo incremental, falta en modo puerta. Las filas incompletas y los manuales inexistentes son errores | Siempre |
| M17 | Todo commit que toca `resultados.md` o `firmantes-permitidos` está firmado con una clave de `firmantes-permitidos` leída de la rama base; un PR no puede tocar esos dos archivos | Siempre (`tools/pruebas/firmas.sh`) |
| M18 **[F8]** (CH-08) | Cada CA de `pendientes-e2e.json` cita una ficha que existe; una ficha que completa pendientes no pasa a `terminada` sin una E2E que cite cada uno; `features.json` marca esos CA como `pendiente_e2e` hasta entonces; en modo puerta, un pendiente cuya ficha no es [P] es una falta | Siempre; la falta, en modo puerta |

### 13.4 Estados de feature y dos modos (DP-15)

**Problema.** Si la matriz exigiera la cobertura completa desde el primer día, `rapido` fallaría durante toda la Fase 8, porque las features se construyen de a una. Si no exigiera nada, una feature podría darse por terminada sin sus pruebas.

**Diseño.**
- `pruebas/features.json` dice el estado de cada ficha. La que no figura está `pendiente`.
- **Modo incremental** (`pnpm pruebas:matriz`, en `rapido` de cada PR):
  - exige todo lo de las fichas `terminada`;
  - de las `en_curso`, informa los CA que faltan como aviso;
  - de las `pendiente`, no exige nada.
  - Las reglas de forma (M6 a M10, M12, M13) se aplican siempre.
- **Modo puerta** (`pnpm pruebas:matriz --puerta`): exige todas las fichas [I] y [M], estén como estén en `features.json`. Corre en el nocturno como informe, y su resultado en verde es parte de la puerta de salida (Parte D).
- **Las [P] y la diferida** se exigen cuando su ficha pasa a `terminada`. FT-49 no puede pasar de `pendiente` sin el CT que aplique CF-03 (M13). Ver P7-15.

**Flujo de un agente de la Fase 8 con FT-30:**
1. Marca `"FT-30": "en_curso"` en `features.json`.
2. Corre `pnpm pruebas:ft FT-30`. Recibe los 7 CA, los ESC y AV de la ficha, el recorrido 4.4, las pruebas que ya existen con su archivo, y el comando de cada herramienta con su filtro.
3. Escribe las pruebas con `[CA-30.n]` en el título, en los archivos de §2.3.
4. Marca `"FT-30": "terminada"`. `rapido` verifica que no falte nada de FT-30 (M1 a M14); el PR corre las suites de FT-30 completas, E2E incluida, aunque no esté en "listo", y el job `cierre` comprueba que todas estén en verde (M15). Si falta algo, el PR queda rojo.
5. Si FT-30 tiene manuales, quedan "manual pendiente" hasta que el usuario registre el resultado (M16). La ficha puede quedar `terminada`, pero no cuenta para la puerta.

Salida real de `pruebas:ft FT-30` sobre el inventario sintético de V7-09 (los identificadores son los del inventario sintético):

```
pruebas:ft FT-30 → 7 CA, REC-4.4, 8 pruebas, comandos:
   pnpm test:e2e -- -g "PRU-E2E-TARJ-002|PRU-E2E-TARJ-003|PRU-E2E-INICIO-008"
   pnpm test:componentes -t "PRU-CMP-TARJ-002|PRU-CMP-TARJ-003"
   pnpm test:integracion -t "PRU-RH-TARJ-003"
   pnpm test:unidad -t "PRU-DOM-TARJ-003"
   pnpm test:integracion -t "PRU-INT-TARJ-003"
```

### 13.5 Comandos

| Comando | Qué hace | Dónde corre |
|---|---|---|
| `pnpm pruebas:listar` | Genera `pruebas/inventario.json` sin ejecutar pruebas | `rapido`, antes de la matriz |
| `pnpm pruebas:matriz` | M1 a M13 en modo incremental; sale con 1 si falla | `rapido` |
| `pnpm pruebas:matriz --puerta` | Lo mismo en modo puerta | Nocturno (informe); puerta de salida |
| `pnpm pruebas:matriz --resultados <dir>` | M15 con los informes JSON de Vitest y Playwright de la misma corrida | Job `cierre` del PR y de `main`, con `needs` sobre los tres jobs; `desplegar` depende también de él |
| `pnpm pruebas:resumen <features-base.json>` | Fichas que cambian de estado respecto de `origin/main` y manuales pendientes | `pnpm pr:mergear` lo imprime antes de mergear |
| `pnpm pruebas:ft FT-nn` | CA, ESC, AV y recorridos de la ficha; pruebas existentes con su archivo; comandos; CA sin cubrir | Local, para el agente |
| `pnpm pruebas:afectadas` | Filtros `-g` (Playwright) y `-t` (Vitest) para los archivos de `git diff --name-only origin/main...` | `rapido` publica la salida para `e2e` |
| `pnpm pruebas:informe` | Cobertura por ficha y estado de la puerta | Nocturno |

El script es TypeScript que Node 24 ejecuta sin compilar, sin dependencias (`node tools/pruebas/matriz.ts`).

### 13.6 Suites afectadas (DP-19)

**De archivo cambiado a features**, en este orden:
1. **Por las Piezas de 06.** Cada ficha lista sus operaciones, consultas y rutas. Por la estructura de 04 §1.2, una operación vive en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, una consulta en `packages/aplicacion/src/consultas/<pantalla>.ts` y una ruta en `apps/web/src/app/(finn)/<ruta>/**`; el script resuelve la operación por el patrón `**/OP-nn-*.ts` **[F8]** (CH-01). Así, el script resuelve sin mapa las fichas que citan esa pieza.
2. **Por `pruebas/mapa-codigo.json`**, para lo demás: componentes y módulos compartidos. M12 hace que ningún archivo quede sin mapear.
3. **`marco`**: el layout de `(finn)`, la navegación, `sw/`, `instrumentation.ts`, `middleware.ts` y la configuración de Next. Corre la suite E2E completa.
4. **Las pruebas de los archivos de prueba cambiados** se agregan siempre.

**Lo que no dispara E2E por sí mismo.** `packages/dominio` y `packages/db`: su efecto lo cubren `DOM`, `ESC`, `PROP` e `INT`, que corren completos en `rapido` e `integracion` cuando cambian. Las E2E de esas features corren completas en `main` (6.1).

**Medido en V7-09 (inventario sintético):**
- Un cambio en `operaciones/pagar-tarjeta.ts` resolvió FT-30 y 8 pruebas, 3 de ellas E2E.
- Un cambio en `layout.tsx` resolvió "suite completa".
- La resolución por las Piezas de 06 (punto 1) no está en el prototipo, que usa solo el mapa. La Fase 8 la agrega cuando existan las rutas reales.

### 13.7 Relación con `trazabilidad.py` de la Fase 6

`trazabilidad.py` (T1–T8) verifica que los documentos son coherentes entre sí: cada operación, consulta, ruta, ESC y AV está en una ficha. La matriz verifica que **las pruebas** cubren los documentos. No se superponen:
- `trazabilidad.py` corre en `rapido` solo si cambia `docs/`;
- con los documentos enmendados, al cerrar la fase, se repite junto con los demás scripts de las fases anteriores (encargo).

---

## 14. Verificación de la Parte B y de los ajustes de la Parte A

**Entorno:** el mismo de §9 (Node 24.22.1, PostgreSQL 16.15, Vitest 3.2.7, Next 16.4.1, Playwright 1.56.0 con Chromium). Salidas en `salidas/v7_07.salida.txt` y `v7_09.salida.txt` del zip.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V7-07 | Barreras 1 y 2 con la lista de permitidos (P7-10) en el prototipo de Next; E2E del reloj de nuevo; cálculo de minutos de M4 | **22 de 22**: los 11 casos de PRU-SEG-RELOJ-001 (`next start` real: 9 no arrancan con salida 1 y el motivo; el control positivo arranca con el reloj de prueba; el control sin variables, con `VERCEL_ENV=preview`, arranca con el reloj real) y los 11 de 002 en proceso. PRU-E2E-RELOJ-001 a 003: 3 de 3, con `FINN_ENTORNO=pruebas` en el `webServer`. `minutos.ts` sobre un JSON de ejemplo: 39 minutos cobrados (2:31, 3:20, 11:00 y 20:01 redondeados); 700 minutos al día 12 proyectan 1.808 → `ahorro` | El primer intento del arnés marcó falsos fallos: la expresión regular cortaba el texto de la página en el primer `<!-- -->` de React. Se corrigió el arnés, no la barrera. `VERCEL_ENV` depende de la casilla de variables del sistema de Vercel; por eso existe la barrera 1b | PRU-SEG-RELOJ-006 (`vercel env ls`), sin proyecto de Vercel aquí; `minutos.ts` contra la API real |
| V7-08 | Escenarios como datos con los dos ejecutores: ESC-05 a 10, 17 y 18, con las cadenas 05→06, 05→07, 08→09 y 17→18 y la fila de contraste 2′ | `motor`: 8 de 8, 19 filas, 0 omitidas, 14 ms. `int` (esquema real de 03, como `finn_app`, con protocolo, bloqueo y verificaciones diferidas): 8 de 8, 0,33 s por escenario. Controles: los 4 mutantes del núcleo (V7-03) los detectan los escenarios (arrastre, traslado, orden y cierre: 3, 9, 1 y 2 filas fallidas, y 1, 3, 0 y 1 escenarios con su base rota); un dato alterado (LPA 601 en ESC-06 paso 3) se detecta; en `int`, perder la clave de orden al cargar hace fallar la fila 2′ de ESC-17 | En `int`, el desglose de ESC-08 y AV-10 de ESC-10 quedan **omitidos** con su motivo: los devuelve la operación, no la lectura, y los evalúa `motor` (regla 10). La convención de completado de 12.3 no cambió ningún número | Los 42 escenarios restantes; rechazos (ESC-03) y ramas de varias filas (ESC-38), que el prototipo no implementa; la operación real de `@finn/aplicacion` (en el prototipo es SQL directo con las mismas tablas) |
| V7-09 | Script de la matriz sobre 06, 04, 05 y el extracto de 01 | Conteos: 77 fichas (31 [I], 38 [M], 8 [P], 1 diferida); 492 CA (233, 232, 24 y 3 diferidos); 50 ESC; 24 AV; 28 invariantes; 6 recorridos; 92 verificaciones previas. Con inventario vacío: 749 errores, exactamente la suma de objetivos más los 4 `(manual)` y los 3 `⚠ (S6-1)`. Con un inventario sintético completo (730 pruebas, 9 manuales): **pasa en modo puerta**. **15 de 15 mutaciones** detectadas, cada una por la regla esperada (M1 a M13). Modo incremental con solo FT-30 terminada y sin sus pruebas: 7 errores M1, todos de FT-30. Sobre el inventario real de los prototipos (32 pruebas de `vitest list` y `playwright --list`): lee bien los dos formatos | El área `PROTO` de las pruebas de V7-01 no existe en la tabla 2.2, y la prueba `control` de V7-08 no tiene identificador: los dos son defectos de los prototipos y la matriz los marca (M8). Se encontró y corrigió un error del conversor de patrones de `mapa-codigo.json` (`*` dentro de `**`). Las 77 fichas tienen área (cierre de 2.2) | 01 completo: el prototipo leyó un extracto con el formato exacto de 01 (§6, la tabla de 5.0.7 y los encabezados de §8), porque el documento no está como archivo en este entorno. La resolución por las Piezas de 06 (13.6, punto 1) |
| V7-10 | Semillas de los recorridos como datos | `PRU-DOM-MOTOR-901`: la semilla de 4.6 da los números de `recorridos.py` en los pasos 1, 3 y 4 (Ahorro $770.00, LPA $720.00, Super −$50.00, S(T) $30.00, reducción proyectada $70.00; después de mover, $20.00 de SobD; al cierre, LPA $700.00). `PRU-DOM-MOTOR-902`: Restaurantes de A.7 da −$26.30, todo sobregiro con débito, y el ritmo de CA-62.3 da $175.56 al 20/10, $55.56 sobre lo asignado | A.7 es coherente en lo que cita 4.2: los cubiertos de la tabla suman exactamente los $120.00 asignados | 4.3 (metas y auto-asignar, fuera del núcleo del prototipo); el resto de A.7 (P7-17); la siembra por operaciones en la pila local |

---

## 15. Cambios propuestos a documentos aprobados (Parte B)

La Parte B no propone CT nuevos. Las convenciones de completado (DP-16) no cambian ningún número de 01, y los estados de feature (DP-15) solo afectan a archivos de la Fase 8. Si P7-15 se responde con c), cambia el alcance del encargo ("cada CA") y se registra aquí.

---

## 16. Decisiones, supuestos y preguntas de la Parte B

### 16.1 Decisiones

| ID | Decisión | Justificación | Alternativas descartadas |
|---|---|---|---|
| DP-13 | Escenarios como datos, un archivo por ESC, con dos ejecutores (`motor` e `int`) | El mismo archivo prueba el cálculo y la persistencia; las filas de 01 quedan como datos revisables, no enterradas en código | Escenarios escritos como código de prueba (dos versiones que se desincronizan); solo el ejecutor `motor` (no prueba que lo releído da lo mismo) |
| DP-14 | La columna Notas de 01 es un mínimo de avisos ("contiene") | Notas no es exhaustiva (ESC-05 paso 2 cumple AV-07 sin nombrarlo); el conjunto exacto lo prueban los CA de Errores y textos | Igualdad exacta (haría fallar escenarios correctos) |
| DP-15 | Estado por ficha en `features.json` y dos modos de la matriz | Permite construir de a una feature sin dejar `rapido` en rojo, y la puerta sigue exigiendo todo | Exigir todo desde el primer día (rojo permanente); no exigir hasta el final (las faltas se descubren tarde) |
| DP-16 | Convenciones de completado fijas para lo que 01 no dice; nunca se ajusta un número | Sin ellas, cada agente completaría distinto; con la regla, un dato insuficiente se convierte en pregunta | Que cada escenario complete a mano (inconsistente) |
| DP-17 | Semillas de los recorridos por operaciones, con una prueba `DOM` que las valida | Solo estados alcanzables; un error de la semilla se ve en una prueba barata | SQL directo (puede crear estados que ninguna operación produce); validar solo en E2E (diagnóstico caro) |
| DP-18 | Inventario sin ejecutar (`vitest list`, `playwright --list`) y script en TypeScript sin dependencias | Corre en segundos en `rapido`; lee el título, que es la fuente única (DP-02) | Leer los informes de ejecución (la matriz dependería de que todo haya corrido) |
| DP-19 | Suites afectadas por las Piezas de 06 y un mapa obligatorio | La mayor parte se deriva sola; M12 evita que un archivo nuevo quede fuera | Solo un mapa a mano (se desactualiza); correr siempre todo (minutos, 6.4) |
| DP-20 | Procedimientos manuales con formato verificable | Un manual sin pasos no es un procedimiento; la matriz lo trata como falta | Lista libre en un documento (no se puede verificar) |

### 16.2 Supuestos

1. Los documentos aprobados se copian a `docs/` del repositorio al iniciar la Fase 8, y la matriz los lee de ahí.
2. Una operación vive en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` y una consulta en `packages/aplicacion/src/consultas/<pantalla>.ts` (04 §1.2), para que 13.6 funcione sin mapa **[F8]** (CH-01). Si no, el mapa crece y M12 lo obliga a estar completo.
3. Los escenarios corren en `ESC@int` con la base por archivo de 5.2: un escenario por archivo de prueba o varios por archivo, con una base clonada por escenario.

### 16.3 Preguntas (resueltas en la revisión; respuestas en 0.8)

**P7-15. Fichas [P] y diferida en la matriz.** El encargo pide una prueba para cada CA (492). Hay 24 CA de fichas [P] (después de la primera versión) y 3 de FT-49, diferida por CF-03.
- a) Exigirlos cuando su ficha pasa a `terminada` (DP-15). FT-49 queda bloqueada en `pendiente` hasta el CT que aplique CF-03. La puerta exige los 465 [I] y [M].
- b) Escribir ahora las pruebas de las 24 [P] (marcadas `skip`) y dejar solo los 3 diferidos sin prueba. Serían pruebas de código que no existe, y una prueba en `skip` no cuenta como cobertura.
- c) Excluir las [P] y la diferida de la matriz.
- *Recomiendo a).* Cada CA tiene su exigencia definida y se activa cuando su código existe.

**P7-16. Casos borde CB-01 a CB-34 (01 §9).** El encargo no los nombra, y 06 los cita solo en algunos CA.
- a) Incluirlos como objetivo: cada CB con al menos una prueba, exigida desde la primera ficha terminada, como los invariantes. Es una regla más (M14) y 34 objetivos.
- b) No incluirlos: quedan cubiertos solo donde algún CA los cita.
- *Recomiendo a).* Son reglas de rechazo y de borde que se escapan fácil, y las pruebas son baratas (`DOM` o `INT`).

**P7-17. Semilla de 4.2 y el resto de A.7.** A.7 es coherente en lo que 4.2 cita (V7-10), pero sus totales (Inicio, cuentas, Visa Oro) se diseñaron para las pantallas y no se comprobaron como un estado.
- a) La semilla de 4.2 trae solo lo que el recorrido y sus CA afirman, más la identidad de saldo en cada paso.
- b) Sembrar A.7 completo, comprobar primero su coherencia con el motor y, si algún total no cuadra, proponer un CT al anexo de 05.
- *Recomiendo a)* para la prueba. b) sirve si se quiere A.7 como base de demostración; se puede hacer después sin cambiar 4.2.

**P7-18. Quién marca una feature como terminada.**
- a) El agente de la Fase 8, en el PR de la feature. `pnpm pr:mergear` muestra en su resumen las fichas que pasan a `terminada` y sus CA, para revisarlo antes del merge.
- b) Solo el usuario: el agente propone y el cambio a `terminada` necesita una aprobación aparte.
- *Recomiendo a).* La matriz impide marcarla sin sus pruebas, y el resumen la hace visible.


---

# Parte C — Pruebas por área, verificaciones previas y manuales

## 17. Alcance de la Parte C

- **§18:** qué prueba cada área de §2.2, con qué niveles y datos, y qué hay que probar además de los CA de sus fichas.
- **§19:** las suites transversales (seguridad, esquema, casos borde, mutantes, pooler, respaldo, rendimiento y accesibilidad).
- **§20 y §21:** cada verificación previa (V, V5, V6 y CF-16) y cada paso H de la prueba de humo, con la prueba permanente que la reemplaza o el motivo por el que no la hay. Es el contenido de `pruebas/verificaciones-previas.json`.
- **§22:** la lista única de pruebas manuales y cómo se registran sus resultados (P7-18).
- **§23:** las muestras reales de SP-01.
- **§24 a §26:** verificación, CT, decisiones y preguntas.

La Parte C **no** enumera un caso por CA. La correspondencia CA → prueba la escribe la Fase 8 en los títulos, y la matriz la exige (M1). Aquí va lo que no sale de las fichas: qué nivel conviene para cada tipo de CA del área, los datos y las pruebas obligatorias que ninguna ficha nombra.

**Regla de nivel por tipo de CA** (se aplica en todas las áreas, con la frontera de §1.2):

| El CA dice… | Nivel |
|---|---|
| Un número que sale del motor ("entonces Disponible es…") | `DOM` o `ESC@motor`; si además depende de lo guardado, `INT` |
| Un rechazo con su código o una regla de la base | `INT` (y `DOM` si la operación lo rechaza antes) |
| Un texto, un estado o el foco de un componente | `CMP` |
| Una pantalla, una navegación o un flujo | `E2E` (proyecto `movil`) |
| Una respuesta de un Route Handler (`/api/sms`, acciones de notificación, exportar, cron) | `RH` |
| Algo que solo existe en un dispositivo real | `MAN` (§22) |

---

## 18. Pruebas por área

Cada fila lista las suites principales. Una suite es `PRU-<NIVEL>-<ÁREA>` (§2.1). En cada área hay además una E2E de cada estado de pantalla de 05 §7 que el área tenga.

| Área | Fichas | Suites principales | Datos | Obligatorias además de los CA | ESC · AV · CB que le tocan (orientativo) |
|---|---|---|---|---|---|
| `ACCESO` | FT-01, FT-02, FT-74 | `E2E` (ingreso, inscripción, factores), `RH` (callback de Auth), `SEG` | Usuario de E2E con `E2E_TOTP_SECRETO`; un segundo usuario no permitido | AAL2 obligatorio en toda ruta y acción (§19.1); un usuario distinto de `FINN_USUARIO_ID` recibe `credenciales_invalidas`; sesión vencida en una consulta redirige con `volver` (V5-16) | — · — · — |
| `INICIO` | FT-04, FT-08 | `E2E` (primer uso, plantilla en tandas, "¿algo necesita mi atención?"), `INT` (`inicio()`), `REN` (plantilla) | Base vacía (4.1); A.7 (P7-19) | Plantilla en 4 tandas sin repetir elementos al reanudar (CF-19, FD-23); los Primeros pasos desaparecen al completarse | ESC-01 · AV-01 a AV-09, AV-14, AV-17, AV-20, AV-23 · — |
| `PRES` | FT-09 a FT-16 | `ESC@motor`, `ESC@int`, `PROP` (D2, cierre, LPA), `E2E` (presupuesto, asignar, mover, detalle, LPA), `CMP` (`FilaCategoria`, `Monto`) | Escenarios; generadores | Los números de una categoría son los mismos en Inicio, Presupuesto, el detalle y los reportes (error 11; CA-08.2, CA-62.6): una E2E compara las cuatro vistas; el cierre ocurre sin acción, con el reloj (4.6) | ESC-03 a ESC-07, ESC-15 a ESC-18, ESC-49 · AV-02, AV-03, AV-11, AV-18, AV-20 · CB-09, CB-10, CB-25 |
| `CATEG` | FT-18 a FT-20 | `INT` (archivar, fusionar, eliminar, con sus rechazos), `ESC`, `E2E` | Escenarios ESC-42 a ESC-44 | La fusión es la única que cambia asignaciones de períodos cerrados (inv. 18): `PROP` con `operacionesArb` | ESC-42, ESC-43, ESC-44 · AV-13, AV-14, AV-15 · CB-11, CB-20, CB-34 |
| `META` | FT-17 | `DOM` (los cuatro tipos, redondeos, renovación), `ESC`, `E2E` | ESC-35 a ESC-38; ESC-45 (transición) | `PROP`: la suma de los pedidos de una meta de ahorro alcanza el monto (⌈·⌉ de 01 §0.4) | ESC-35 a ESC-38 · AV-17, AV-18 · CB-27, CB-34 |
| `TX` | FT-21 a FT-27 | `INT` (registrar, editar cada campo, eliminar, estado bancario), `ESC`, `E2E` (registrar con división, detalle, actividad con búsqueda), `CMP` (`EntradaMonto`) | Escenarios ESC-31 a ESC-34 | Idempotencia de cada escritura con el mismo id (BE-17, V-06); doble envío (V5-04); reintento con el mismo id (V5-05); impacto retroactivo antes de confirmar (AV-01) | ESC-31 a ESC-34 · AV-01, AV-16 · CB-03, CB-04, CB-19, CB-24, CB-28, CB-29 |
| `DEV` | FT-28 | `ESC` (D-1 a D-4), `PROP` (devoluciones acumuladas), `INT` | ESC-25 a ESC-30 | Los cuatro casos de 01 §4.4 con tarjeta y con efectivo, en el mismo período y en uno posterior | ESC-25 a ESC-30 · AV-06, AV-08, AV-14 · CB-02, CB-06, CB-31, CB-32 |
| `TARJ` | FT-29 a FT-33 | `ESC`, `PROP` (S, RE, inv. 2 y 3), `INT`, `E2E` (pagar con desglose, 4.4) | ESC-04 a ESC-14 | Desglose del pago y monto para no generar intereses con corte en fin de mes (01 §4.14, CB-13); recordatorio de corte y pago (FT-33) con el reloj | ESC-04 a ESC-14 · AV-04, AV-07, AV-08, AV-10, AV-24 · CB-01, CB-26 |
| `BAND` | FT-03, FT-34 a FT-39, FT-73, FT-78 | `RH` (`/api/sms`: 401, 5xx, 200 y sus variantes), `DOM` (intérprete, normalizadores, política de patrones), `INT` (OP-35 a OP-41), `E2E` (bandeja, aprobar con un toque, arrastrar), `CTR` (cuerpo del webhook) | SMS sintéticos (`smsArb`); muestras reales de SP-01 (§23) | El SMS se guarda **antes** de procesarlo aunque falle (OP-35 paso 1); autodescarte exacto a 10 minutos (inv. 16) con el reloj; ESC-46 con el SMS de las 19:00 del día 20; ningún patrón con retroceso exponencial (V-24) | ESC-46 · AV-19, AV-23 · CB-14 a CB-17 |
| `PROG` | FT-40 a FT-42 | `DOM` (ocurrencias), `INT` (registro automático, idempotencia, reactivación CF-20), `E2E` | ESC-50 con PR-3 | Puesta al día idempotente aunque corra dos veces el mismo día (inv. 15); ejecución en curso de 04 §10.1 | ESC-50 · AV-01, AV-23 · CB-16, CB-33 |
| `CONC` | FT-43, FT-44 | `DOM` (adaptadores de CSV, decodificación), `INT` (OP-45 a OP-47, OP-53), `E2E` (conciliar, verificar saldo) | CSV sintéticos (`csvArb`); muestras de SP-01 | Una conciliación nunca crea transacciones (inv. 14); el signo de la diferencia (ESC-47) en efectivo y en tarjeta (CF-01); la carga firmada de la conciliación (HMAC, vencimiento, versión de clave; BE-49, V-26) **[F8]** (CH-06) | ESC-47 · AV-16, AV-21 · CB-18, CB-30 |
| `COBRO` | FT-45 a FT-49 | `ESC`, `PROP` (saldo abierto, inv. 9), `INT`, `E2E` | ESC-19 a ESC-24, ESC-48 | Pago implícito con cobro en tarjeta (Q7); FT-49 queda diferida (M13) | ESC-19 a ESC-24, ESC-48 · AV-05, AV-09, AV-22 · CB-05, CB-22, CB-23 |
| `CTA` | FT-50 a FT-59 | `INT` (crear, editar, archivar, eliminar), `DOM` (modelo de Banco Agrícola, A.2), `ESC`, `E2E` | ESC-01, ESC-02, ESC-39 a ESC-41 | Ejemplo numérico de A.2 (CA-55.1, CA-55.2) automático **y** su validación manual contra un estado de cuenta real (⚠, §22) | ESC-01, ESC-02, ESC-39 a ESC-41, ESC-43 · AV-15 · CB-07, CB-14, CB-24 |
| `REP` | FT-60 a FT-68 | `DOM` (selectores de 06 §3.5), `PROP` (ritmo, proyección, realidad, hormiga, flujo; `datos_base`, §19.7), `E2E` (gráfico y tabla equivalentes) | Generadores; A.7 | Cada gráfico tiene su tabla equivalente con los mismos números (05); la referencia semanal suma exactamente lo asignado (V-22) | — · — · — |
| `NOTIF` | FT-06, FT-69 a FT-71 | `SW` (eventos de push sintéticos, acciones con `X-Finn-Accion`), `RH` (acciones de notificación), `INT` (catálogo, CF-16), `E2E` (centro de notificaciones) | Receptor local en lugar del servicio de push (7.1) | Las acciones de notificación exigen `Origin` de la app, la cabecera `X-Finn-Accion` y AAL2 (BE-54), sin firma **[F8]** (CH-06); la prueba de catálogo de CF-16 | — · AV-23 · — |
| `AJUS` | FT-72, FT-75, FT-76 | `INT` (cambiar el ciclo), `ESC` (ESC-45), `RH` (exportar), `E2E` | ESC-45 | La exportación JSON pasa su contrato (`CTR`) y el CSV sigue con `-45.00` (V5-02) | ESC-45 · AV-12 · CB-12, CB-13 |
| `PWA` | FT-05, FT-77 | `SW` (precache, sin conexión, actualización), `E2E` (instalación, temas, iPhone emulado para CA-05.2 y CA-06.5), `REN` (bytes) | — | Desfase de versión con dos compilaciones (V5-09, V5-33); las instrucciones de iPhone se prueban emulando su agente y `display-mode` en Chromium, sin iPhone real | — · — · — |
| `MOTOR` | Transversal | `PROP` (invariantes 1 a 5, 26 a 28), diferencial con el oráculo, mutantes (§19.4), `REN` (`calcular`) | `hechosArb`, `operacionesArb`, volumen | Memoria = carga nueva (V-16) con `operacionesArb` | Todos los ESC · — · CB-08, CB-21 |
| `VAL` | Transversal | `DOM` y `PROP` (`Centavos`, `FechaLocal`, formato, `EntradaMonto`), `INT` (fechas y `timestamptz` por Prisma) | — | V-14, V-15, V-17, V-18, V5-01, V5-02 (§20) | — · — · CB-28 |
| `RELOJ` | Transversal | `SEG` (barreras 1, 1b y 2), `ESQ` (barreras 3 y 4, R15), `E2E` (tres relojes, medianoche) | — | §4 y V7-07 | — · — · — |
| `POOL` | Transversal | `INT` detrás de PgBouncer (POOL-01 a POOL-05), estática de bloqueos y `SET` | — | §19.5 y CT-06 | — · — · — |
| `ESQ` | Transversal | `ESQ` (C1 a C6, R1 a R15, catálogo de CF-16), `INT` del protocolo | Plantilla de 5.2 | §19.2 | — · — · — |
| `RESP` | Transversal | `RES` (volcado cifrado, restauración sin `auth`, `verificar_todo()`, invariantes con el motor) | Volumen sintético | §19.6 | — · — · — |

---

## 19. Suites transversales

### 19.1 Seguridad (`SEG`)

| Prueba | Qué comprueba | Nivel y job |
|---|---|---|
| PRU-SEG-ACCESO-001 | **Toda** Server Action y todo Route Handler exige AAL2 o su token, salvo la lista cerrada de 05 §9 (acceso previo a AAL2), declarada en `servidor/acciones/indice.ts` **[CH-56]**. Una exportación fuera de la lista sin AAL2 hace fallar la prueba, y una entrada de la lista que no exista también. La prueba no lista las rutas a mano: recorre el registro de acciones de `apps/web` y el árbol de `app/api`, y falla si aparece una entrada sin su comprobación. Así, una ruta nueva entra sola en la prueba | `INT`/`RH`, `integracion` |
| PRU-SEG-ACCESO-002 | Cada ruta de 05 §1.3 sin sesión, con AAL1 y con AAL2: redirige, pide el segundo factor o muestra la página | `E2E`, `e2e` |
| PRU-SEG-BAND-001 | `/api/sms` sin token, con token viejo, con token de otra longitud: 401 sin guardar nada (OP-35, precondición) | `RH` |
| PRU-SEG-NOTIF-001 | Acción de notificación sin `Origin` de la app, sin `X-Finn-Accion` o sin AAL2: rechazada (BE-54) **[F8]** (CH-06) | `RH` |
| PRU-SEG-CONC-001 **[F8]** (CH-06) | Carga firmada de la conciliación válida, de otra cuenta, alterada, vencida, con la clave anterior y con una versión retirada (BE-49, V-26) | `INT` |
| PRU-SEG-ESQ-001 | Como `finn_app`: sin `TRUNCATE`, sin `DISABLE TRIGGER`, sin `finn.operacion()` (V-12); como rol sin `BYPASSRLS`: 0 filas (V7-01) | `INT` |
| PRU-SEG-RELOJ-001, 002 y 006 | Barreras del reloj de prueba (§4.3, V7-07) | `SEG`; la 006 en `desplegar` |
| PRU-SEG-OPER-001 | Firmas de `resultados.md` y `firmantes-permitidos` (M17, V7-12) | `rapido` |
| PRU-SEG-OPER-002 | Reserva fija de `respaldo` y `restauracion`: M4 y los recortes nunca los tocan (§32.3) | `rapido` |
| gitleaks | Secretos en el diff | `rapido` |

### 19.2 Esquema (`ESQ`)

- C1 (lint de migraciones) y C2 (inmutabilidad) en `rapido`; C3 a C6 y R1 a R15 sobre la plantilla, en `integracion` (5.2).
- C5, C6 y R15, además, contra producción en `desplegar` y en el respaldo diario (03 §11.7).
- **Prueba de catálogo de CF-16** (PRU-INT-NOTIF-002): el catálogo de notificaciones de 04 frente a las restricciones de 03, con `aviso` nulo (V6-04).
- **PRU-ESQ-ESQ-001 (V-21, nueva como prueba):** ningún trigger de 03 escribe en una tabla [M] distinta de la que dispara. La Fase 4 lo revisó leyendo el código. Ahora se comprueba con el catálogo: los cuerpos de las funciones de trigger no contienen `INSERT`, `UPDATE` ni `DELETE` sobre otras tablas [M], salvo la lista cerrada de excepciones documentadas (la revisión y las eliminaciones de EN-2). Es una prueba de esta fase, no una regla nueva de 03.

### 19.3 Casos borde (M14)

Cada CB tiene al menos una prueba automática. El área sugerida es la del CB; el nivel suele ser `DOM` o `ESC@motor` (P7-16):

| Área | CB |
|---|---|
| `TARJ` | CB-01, CB-26 |
| `DEV` | CB-02, CB-06, CB-31, CB-32 |
| `TX` | CB-03, CB-04, CB-19, CB-24, CB-28, CB-29 |
| `COBRO` | CB-05, CB-22, CB-23 |
| `CTA` | CB-07, CB-14 |
| `MOTOR` | CB-08, CB-21 |
| `PRES` | CB-09, CB-10, CB-25 |
| `CATEG` | CB-11, CB-20, CB-34 |
| `AJUS` | CB-12, CB-13 |
| `BAND` | CB-15, CB-16, CB-17 |
| `CONC` | CB-18, CB-30 |
| `META` | CB-27 |
| `PROG` | CB-33 |

### 19.4 Mutantes en el nocturno

Los 4 mutantes de V7-03 (arrastre, traslado, orden y cierre) se compilan en el motor real detrás de `FINN_MUTANTE` y solo en el job nocturno. El nocturno corre `PROP` y `ESC@motor` con cada uno.
- **Si un mutante sobrevive, el nocturno falla:** las pruebas dejaron de proteger esa regla.
- En V7-08, los escenarios mataron los 4.
- `FINN_MUTANTE` solo se lee en `vitest.config.ts`, que lo inyecta como constante de compilación `__FINN_MUTANTE__` en los proyectos de prueba; el dominio no lee el entorno **[CH-19]**. R15 no aplica porque es código de la aplicación sin reloj.

### 19.5 Pooler y bloqueos de sesión (CT-06)

**Lo pedido en la revisión de la Parte A:** que la base también impida el caso de POOL-04, revocando a `finn_app` (y a `PUBLIC`) las funciones de bloqueo asesor de sesión.

**Lo que mide V7-14:**
- Emulé el rol `postgres` de Supabase con un rol no superusuario (`NOSUPERUSER`, `CREATEROLE`, `CREATEDB`). `REVOKE EXECUTE ON FUNCTION pg_catalog.pg_advisory_lock(bigint) FROM PUBLIC` y `… FROM finn_app` responden `WARNING: no privileges could be revoked` y no cambian nada: `finn_app` sigue pudiendo llamarla.
- Solo el dueño de la función o un superusuario puede revocarla. En Supabase, `postgres` no es superusuario (H-02) y las funciones de `pg_catalog` no son suyas.
- Como superusuario sí funciona: `finn_app` recibe `permission denied`. Pero ese camino no existe en el proyecto real.
- **Conclusión:** en Supabase no se puede, con REVOKE. Lo confirma el paso H-02 de la prueba de humo, al que agrego la consulta.

**Propuesta que sí funciona (CT-06):** una **marca local de la transacción**.
- `finn.tomar_bloqueo()` hace además `set_config('finn.bloqueo_xact', pg_current_xact_id()::text, true)`.
- `finn.tiene_bloqueo()` exige, además del bloqueo en `pg_locks`, `coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text`.
- Un ajuste local no sobrevive al fin de la transacción. Detrás del pooler, un bloqueo de sesión olvidado puede quedar en la conexión, pero la marca no llega a la transacción de otro cliente.
- **V7-14, detrás de PgBouncer en modo transacción:**

| Diseño | Escrituras sin `tomar_bloqueo()` con un bloqueo de sesión olvidado | Flujo normal con `tomar_bloqueo()` |
|---|---|---|
| Actual de 03 (POOL-04) | **10 de 10 pasan** | Pasa |
| Con la marca (CT-06) | **10 de 10 rechazadas con FN001** | Pasa |

- **Hallazgo del prototipo:** la primera versión no tenía `coalesce` y dejó pasar las 10. Sin marca, `current_setting` devuelve NULL, la comparación da NULL e `IF NOT NULL` no rechaza. Por eso PRU-INT-POOL-004 incluye el caso "sin marca", y la prueba de catálogo fija el cuerpo de `tiene_bloqueo()`.
- **Alcance:** protege contra un error del código (un bloqueo de sesión olvidado), no contra código malicioso que pusiera la marca a mano. Para eso sigue la prueba estática: PRU-ESQ-POOL-001 rechaza `pg_advisory_lock(`, `pg_try_advisory_lock(` y `SET ` sin `LOCAL` en `@finn/db` y `@finn/aplicacion`.
- **Alternativa descartada:** sombrear `pg_advisory_lock` con una función de `finn` en el `search_path` de `finn_app`. `pg_catalog` se busca primero salvo que se ponga explícitamente después, y una llamada calificada lo saltaría igual.
- Con CT-06, POOL-04 pasa de "control que detecta el riesgo" a "prueba de que la base lo impide", y se conserva como control (P7-21).
- **Precisión aprobada (P7-21):** CT-06 protege contra errores accidentales, no contra código malicioso. Falsificar la marca exige un `set_config('finn.bloqueo_xact', …)` explícito, y la prueba estática PRU-ESQ-POOL-001 lo prohíbe en `@finn/db` y `@finn/aplicacion`.

### 19.6 Respaldo (`RES`)

- En el nocturno: volcado de una base sembrada con el volumen base, cifrado con `age`, restauración en una base sin esquema `auth` (ADR-22), `verificar_todo()` y las invariantes calculadas con el motor sobre los hechos restaurados.
- La restauración mensual de producción (ADR-22) es el workflow `restauracion.yml`, sin cambios. Su resultado se guarda en `eventos_sistema`, y el informe de la matriz lo muestra.

### 19.7 `datos_base` frente a los selectores de 06 §3.5 (CF-09)

Un `PRU-PROP-REP-nnn` por par que se superpone (04 §6.9.4 frente a 06 §3.5). Con `hechosArb`, los dos lados dan lo mismo:

| `datos_base` | Selector o consulta | Campos |
|---|---|---|
| `categoriasPorPeriodo` | Historial del detalle de categoría y "Presupuesto contra la realidad" | asignado, gastado, arrastre, disponible, sobregiros; el promedio de 3 períodos (CF-17) |
| `consumos` | Ritmo, gastos hormiga y suscripciones | monto neto, medio, fecha y comercio normalizado de cada consumo de la ventana |
| `tarjetasPorPeriodo` | `TarjetasDto.periodos` (nombrado en 06 §3.10) | cargos, pagos, deuda al fin y Disponible de pago |
| `lpaAlCierre` | Detalle de LPA (01 §4.9, LPA al cierre) | LPA de cada período cerrado |
| `patrimonioAlCierre` | Reporte `patrimonio` (04 §6.9.2) | neto de cada período |

### 19.8 Rendimiento y accesibilidad

- **Presupuestos y reglas:** los de §6.6. Los de bytes bloquean; los de tiempo, por persistencia (P7-5).
- **Accesibilidad automática:** 05 §11.10 sin cambios. axe en cada ruta, en los dos temas y en los dos tamaños; contraste de tokens; 44 px; reflujo a 320 px; movimiento reducido; árbol de accesibilidad de los componentes de dominio.
- **`CMP` con axe (CT-04, V7-15):** el modo navegador de Vitest con el Chromium de Playwright corrió 4 pruebas en 3,8 s:
  - nombre accesible del indicador de sobregiro por tipo (PF-2);
  - error asociado al campo y anunciado;
  - foco real con el tabulador;
  - un control negativo, en el que axe detectó `svg-img-alt` y `color-contrast`.

  axe da resultados reales porque calcula los estilos en un navegador (por eso se descartó jsdom en §3.1).
- **Lectores de pantalla:** manuales (§22), con TalkBack y NVDA (CT-03).

---

## 20. Verificaciones previas → pruebas permanentes

Es el contenido de `pruebas/verificaciones-previas.json` (M6). Las que quedan **sin prueba permanente** tienen motivo:
- verifican la coherencia de un documento, no el código;
- son un dato de documentación de un proveedor;
- o ya están cubiertas por otra prueba de la lista.

### 20.1 Fase 4 (V-01 a V-30)

| V | Qué verificó | Prueba permanente |
|---|---|---|
| V-01 | Escritura sin bloqueo → FN001 como `P2039` | PRU-INT-ESQ-001 |
| V-02 | La revisión sube 1 por transacción; primera consulta con revisión, hoy e instante | PRU-INT-ESQ-002 |
| V-03 | Restricción diferida → FN003 como `DriverAdapterError` | PRU-INT-ESQ-003 |
| V-04 | Regla inmediata → FN002 como `P2039` | PRU-INT-ESQ-004 |
| V-05 | `finn.operacion = 'fusion'` no se filtra a las transacciones siguientes del pool | PRU-INT-POOL-006 |
| V-06 | Id repetido → `P2002` (idempotencia, BE-17) | PRU-INT-ESQ-005 |
| V-07 | Lectura `REPEATABLE READ` y `READ ONLY` | PRU-INT-ESQ-006 |
| V-08 | Dos escritores: el segundo espera y ve lo confirmado | PRU-INT-ESQ-007 |
| V-09 | Contraste: `REPEATABLE READ` en la escritura ve datos viejos | PRU-INT-ESQ-008: protege la decisión: `escribir()` usa `READ COMMITTED` |
| V-10 | `lock_timeout` de 10 s → `55P03` | PRU-INT-ESQ-009 (nocturno: tarda 10 s) |
| V-11 | Prisma 7 no emite `SAVEPOINT` | PRU-INT-ESQ-010 (captura el SQL; falla si aparece `SAVEPOINT`) |
| V-12 | Privilegios de `finn_app` | PRU-SEG-ESQ-001 |
| V-13 | Carga de 117.015 filas con `json_agg` | PRU-REN-MOTOR-001 (nocturno, volumen) |
| V-14 | `@db.Date` y `TZ` | PRU-INT-VAL-001 |
| V-15 | Formatos de la frontera | PRU-INT-VAL-002 |
| V-16 | Memoria = carga nueva | PRU-INT-MOTOR-001, más `operacionesArb` en `PROP` |
| V-17 | `timestamptz` por Prisma sin zona | PRU-INT-VAL-003 |
| V-18 | `Intl` en Node 24 | PRU-DOM-VAL-001 |
| V-19 | Ids secundarios UUIDv5 deterministas | PRU-DOM-VAL-002 |
| V-20 | Huella del impacto estable | PRU-DOM-VAL-003 |
| V-21 | Ningún trigger modifica otras filas [M] (era revisión de código) | PRU-ESQ-ESQ-001 (§19.2) |
| V-22 | Referencia semanal suma lo asignado | PRU-PROP-REP-001 |
| V-23 | Intérprete de SMS con 13 sintéticos | PRU-DOM-BAND-001 (y se rehace con SP-01) |
| V-24 | Retroceso de los patrones (`recheck`) | PRU-DOM-BAND-002 (política QC-3 sobre cada patrón activo) |
| V-25 | Decodificación de CSV | PRU-DOM-CONC-001 |
| V-26 | Carga firmada con HMAC (de la conciliación) | PRU-SEG-CONC-001 **[F8]** (CH-06) |
| V-27 | Cuerpo del webhook contra las `CHECK` de 03 | PRU-CTR-BAND-001 y PRU-INT-BAND-001 |
| V-28 | `purgar_eliminaciones()` y R14 | PRU-INT-ESQ-012 |
| V-29 | Trazabilidad de 04 (`t17.py`) | **Sin prueba permanente:** verifica el documento, no el código. Se repite al cerrar la fase con los documentos enmendados |
| V-30 | Costo de las verificaciones diferidas | PRU-REN-ESQ-001 (nocturno) |

### 20.2 Fase 5 (V5-01 a V5-36)

| V5 | Qué verificó | Prueba permanente |
|---|---|---|
| V5-01 | Normalización de `EntradaMonto` | PRU-DOM-VAL-004 y PRU-PROP-VAL-001 |
| V5-02 | Módulo de formato (signo U+2212, CSV con `-`) | PRU-DOM-VAL-005 |
| V5-03 | Server Action actualiza la página | PRU-E2E-TX-001 |
| V5-04 | Doble envío → una llamada | PRU-E2E-TX-002 |
| V5-05 | Id conservado y reintento único | PRU-E2E-TX-003 |
| V5-06 | Flujo corto en ruta interceptada | PRU-E2E-PRES-001 |
| V5-07 | `router.refresh()` conserva el borrador | PRU-E2E-TX-004 |
| V5-08 | Lectura interactiva descarta respuestas viejas | PRU-E2E-TX-005 |
| V5-09 | Desfase de versión → 409 | PRU-E2E-PWA-001 (nocturno: dos compilaciones) |
| V5-10 | Agenda de medianoche | PRU-DOM-RELOJ-001 y PRU-E2E-RELOJ-002 |
| V5-11 | Orden de las Server Actions | PRU-REN-TX-001 (nocturno; es un tiempo) |
| V5-12 | Regla de lint de PF-3 | PRU-DOM-VAL-006 (ESLint sobre un archivo de control) |
| V5-13 | Peso de React Hook Form y Zod | PRU-REN-PWA-001 (biblioteca de formularios ≤ 50 KB) |
| V5-14 | Skew Protection solo en Pro | **Sin prueba permanente:** es un dato de la documentación de Vercel; su efecto lo cubre V5-09 |
| V5-15 | `error.tsx` con `digest` | PRU-E2E-PWA-002 |
| V5-16 | Sesión vencida redirige con `volver` | PRU-E2E-ACCESO-001 |
| V5-17 | `NO_ENCONTRADO` → pantalla «Esto ya no existe.» con su enlace y `noindex` (estado HTTP 200 con `loading.tsx`, **[CH-59]**) | PRU-E2E-PWA-003 |
| V5-18 | Cobertura del mapa de pantallas (`cobertura.py`) | **Sin prueba permanente:** verifica el documento; en el código lo reemplazan M12 y PRU-SEG-ACCESO-002, que recorren las rutas reales |
| V5-19 | Señal de carga: el prefetch del enlace termina y al navegar aparece la señal de `EnlaceFinn`; pintar el `loading.tsx` en navegación es una limitación conocida (**[CH-59]**) | PRU-E2E-PWA-004 |
| V5-20 | JS por ruta | PRU-REN-PWA-002 |
| V5-21 | `useLinkStatus` da la señal | PRU-E2E-PWA-005 |
| V5-22 | Caché del enrutador | PRU-E2E-PWA-006 |
| V5-23 | Contraste de tokens | PRU-DOM-PWA-001 (corre `contraste.py`) |
| V5-24 | axe-core | PRU-E2E-PWA-007 (cada ruta, dos temas, dos tamaños) |
| V5-25 | Árbol de accesibilidad | PRU-CMP-VAL-005 |
| V5-26 | Lighthouse | PRU-REN-PWA-003 (nocturno) |
| V5-27 | INP y movimiento reducido | PRU-REN-PWA-004 (INP, nocturno) y PRU-E2E-PWA-008 (movimiento reducido) |
| V5-28 | Foco y anunciador de rutas | PRU-E2E-PWA-009 |
| V5-29 | Service worker con Serwist | PRU-SW-PWA-001 |
| V5-30 | Sin conexión | PRU-SW-PWA-002 |
| V5-31 | Instalabilidad | PRU-SW-PWA-003 |
| V5-32 | Push sintético | PRU-SW-NOTIF-001 |
| V5-33 | Actualización con dos compilaciones | PRU-SW-PWA-004 (nocturno) |
| V5-34 | Peso del registro del service worker | PRU-REN-PWA-002 (dentro del JS compartido) |
| V5-35 | Método de medida de 13.4 | PRU-REN-PWA-001 (es el método de esa prueba) |
| V5-36 | Trazabilidad generada de 05 | **Sin prueba permanente:** verifica el documento; se repite al cerrar la fase |

### 20.3 Fase 6 (V6-01 a V6-13) y CF-16

| V6 | Qué verificó | Prueba permanente |
|---|---|---|
| V6-01 | Fórmulas de 3.5 con A.7 | PRU-DOM-MOTOR-903 (A.7 completo, **pendiente de P7-19**) y PRU-DOM-REP-001 |
| V6-02 | 20.000 casos de ritmo y proyección | PRU-PROP-REP-002 |
| V6-03 | Identidad del flujo de efectivo | PRU-PROP-REP-003 |
| V6-04 | Catálogo de notificaciones frente a 03 | PRU-INT-NOTIF-001 |
| V6-05 | Tiempo de aplicar la plantilla | PRU-REN-INICIO-001 (nocturno) |
| V6-06 | Revisión mecánica de las fichas | **Sin prueba permanente:** verifica 06; corre en `rapido` si cambia `docs/` |
| V6-07 | Peso de `@dnd-kit/core` | PRU-REN-BAND-001 (bytes de la Bandeja) |
| V6-08 | Arrastre con carga diferida | PRU-E2E-BAND-001 |
| V6-09 | Trazabilidad de 06 | **Sin prueba permanente:** ídem V6-06 |
| V6-10 | Revisión final de las fichas | **Sin prueba permanente:** ídem V6-06 |
| V6-11 | Prueba de los reportes | PRU-PROP-REP-004 |
| V6-12 | Enmiendas aplicadas a 00 a 05 | **Sin prueba permanente:** verifica documentos; se repite al cerrar esta fase |
| V6-13 | Recorridos 4.3 y 4.6 con el motor mínimo | PRU-DOM-MOTOR-901 (4.6) y PRU-DOM-MOTOR-904 (4.3) |
| CF-16 | Prueba de catálogo | PRU-INT-NOTIF-002 |

**Resumen:** de las 80 verificaciones de 20.1 a 20.3 (V, V5, V6 y CF-16), **72 tienen prueba permanente** y 8 tienen motivo. Las 7 de documentos se repiten al cerrar la fase (encargo), y V5-14 es un dato de proveedor.

---

## 21. Prueba de humo H-01 a H-12

Los pasos H existen solo contra el proyecto real (SP-02). Cada uno queda como **manual del usuario** (`PRU-MAN-ESQ-001`, §22), con su resultado en `resultados.md`. La parte que se puede ensayar en CI tiene su prueba, para que el día de la prueba de humo no haya sorpresas:

| H | Qué es | Parte en CI | Lo que queda solo en la prueba de humo |
|---|---|---|---|
| H-01 | Versión de PostgreSQL | `versiones.mjs` compara `PG_MAYOR` con lo registrado (5.1) | `SHOW server_version_num` en Supabase |
| H-02 | Bootstrap con `postgres` no superusuario | `bootstrap.sql` en `integracion`; **CT-06:** la consulta de V7-14 que muestra que `REVOKE` no aplica | El bootstrap en el proyecto real |
| H-03 | `CREATE` en la base para `finn_migraciones` | Ídem | Ídem |
| H-04 | Conexión de los tres roles por Supavisor | — | Todo |
| H-05 | Migraciones con la CLI nativa; `migrate diff` vacío | C4 en `integracion` | **Disparador de P7-12 b):** si el diff no queda vacío por `dbgenerated("finn.ahora()")` (Parte D) |
| H-06 | Patrón transaccional por el pooler real | PRU-INT-POOL (PgBouncer) | Supavisor real |
| H-07 | Zona de la sesión por el pooler | PRU-INT-POOL-002 | Supavisor real |
| H-08 | Respaldo por el pooler en modo sesión | `RES` con volumen | El proyecto real |
| H-09 | Carga desde `iad1` con volumen alto | PRU-REN-MOTOR-001 local | La red de Vercel a Supabase |
| H-10 | Auth: claves, registro, TOTP, recuperación | E2E con la pila local (`auth`) | El proyecto real |
| H-11 | Data API desactivada | — | Todo |
| H-12 | Limpieza | — | Todo |

En `verificaciones-previas.json`, los H tienen como `destino` la prueba de CI cuando existe, y como `motivo` "paso de la prueba de humo (SP-02), registrado en PRU-MAN-ESQ-001". Con esto quedan las 92: 80 de §20 y 12 de §21.

---

## 22. Pruebas manuales

### 22.1 Lista única

| Id | Cubre | Dispositivo | Disparador | Resultado esperado (resumen) |
|---|---|---|---|---|
| PRU-MAN-ACCESO-001 | CA-02.5 | Android (Google Authenticator) y un gestor de contraseñas con TOTP | Antes de terminar FT-02; al cambiar la inscripción | El QR y el secreto copiado generan códigos que verifican |
| PRU-MAN-OPER-001 | DP-24, M17 (P7-20) | PC con Windows y Git for Windows | Una vez, antes del primer resultado manual; al cambiar de PC o de clave | Pasos y resultado esperado en §29.2 |
| PRU-MAN-OPER-002 | §31.5, DP-34 (CT-09) | PC con Windows, Docker Desktop y la CLI de Vercel | Solo en una emergencia: `desplegar` no puede correr y hay un error de dinero o de seguridad que `vercel rollback` no resuelve; y un ensayo antes de abrir la puerta (vigente por CT-09) | Pasos y resultado esperado en §31.5 |
| PRU-MAN-OPER-003 | §31.4 (P7-22) | Paneles de Supabase y de Vercel de la 1.0 | El día `fin_primeras_semanas` (§31.4) | Pasos y resultado esperado en §31.4 |
| PRU-MAN-BAND-001 | CA-03.5; SP-04 | Android con MacroDroid | Antes de terminar FT-03; al cambiar `/api/sms` o `FINN_WEBHOOK_FORMATO` | La prueba del teléfono de 04 §8.8 llega como no reconocido, con la variante y el plan de reintentos de SP-04 |
| PRU-MAN-BAND-002 | CA-78.15 (CT-03) | Android | Antes de terminar FT-78 | La pulsación larga sobre el asa no abre el menú contextual ni selecciona texto; desplazar la lista sigue funcionando |
| PRU-MAN-NOTIF-001 | CA-70.7 (CT-03) | Android con la app instalada | Antes de terminar FT-70; al cambiar el service worker | El push real llega, con sus acciones, y el toque abre la ruta |
| PRU-MAN-BAND-003 | CA-34.14 ⚠ (S6-1) | — (muestras reales, §23) | Cuando lleguen las muestras de SP-01 | El tipo propuesto de depósito, pago a tarjeta y devolución es el esperado con los SMS reales |
| PRU-MAN-CONC-001 | CA-43.10 ⚠ (S6-1) | — (muestras reales) | Ídem | La detección elige el formato correcto con los CSV anonimizados |
| PRU-MAN-BAND-004 | CA-73.6 ⚠ (S6-1) | — (muestras reales) | Ídem (FX-1) | Cada formato reescrito pasa la política y reconoce sus muestras |
| PRU-MAN-CTA-001 | CA-55.1 ⚠, CA-55.2 ⚠ | Un estado de cuenta real de Banco Agrícola | Antes de terminar FT-55 | El modelo de A.2 coincide con el estado de cuenta, o se registra cada diferencia (01 Anexo A) |
| PRU-MAN-CTA-002 **[F8]** (CH-04) | §31.1 | Android o PC con la app de cada banco | Semanal, entre `F` y `fin_primeras_semanas` (§31.4) | Verificar saldo (FT-44) de cada cuenta con su banco: diferencia cero, o explicada en FT-44 |
| PRU-MAN-PWA-001 | 05 §11.10 (CT-03) | Android con TalkBack y Chrome | Antes de cerrar cada entrega de la Fase 8 | Registrar un gasto, asignar, aprobar en la bandeja, conciliar e ingresar con TOTP se completan con TalkBack |
| PRU-MAN-PWA-002 | 05 §11.10 (CT-03) | Windows con NVDA, en Chrome o Firefox | Ídem | Lo mismo con NVDA |
| PRU-MAN-ESQ-001 | H-01 a H-12; SP-02 | El proyecto real de Supabase y Vercel | Antes del primer despliegue a producción (17.3) | Cada paso de 04 §17.2 con su resultado |

- Las automáticas de estos mismos CA (por ejemplo, CA-55.1 con el ejemplo de A.2) se escriben igual: el manual complementa, no reemplaza.
- **iPhone, iPad y VoiceOver** no tienen procedimiento: son riesgo aceptado (P7-9). WebKit parcial cubre lo que dice §3.2.

### 22.2 Registro de resultados (P7-18)

**Formato.** `pruebas/manuales/resultados.md` tiene una fila por ejecución:

```markdown
| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |
|---|---|---|---|---|---|---|
| PRU-MAN-BAND-001 | 2027-03-02 | Android 15, MacroDroid 5.47 | pasa | Andrés | a1b2c3d | variante B |
```

**Qué cuenta.** Vale el último resultado de cada manual. Una falla posterior reabre el pendiente (M16).

**Cómo se garantiza que solo los registre el usuario.** Los agentes pueden editar cualquier archivo del repositorio, y en GitHub Free no hay protección de rama (6.3). Por eso la garantía es criptográfica: **commits firmados con una clave SSH que solo tiene el usuario**.
- `pruebas/firmantes-permitidos` tiene la clave pública del usuario.
- `tools/pruebas/firmas.sh` (PRU-SEG-OPER-001, en `rapido`) verifica con `git verify-commit` que cada commit que toca `resultados.md` o `firmantes-permitidos` esté firmado por esa clave.
- La lista de firmantes se lee de la rama base, no del PR. Así, un PR no puede agregar su propia clave.
- Un PR no puede tocar esos dos archivos: el usuario los cambia con un push firmado directo a `main`. `pr:mergear` también se niega.
- **V7-12**, en un repositorio de prueba con dos claves:
  - un commit firmado por la clave del usuario pasa;
  - uno firmado con otra clave falla;
  - uno sin firma falla;
  - un PR que agrega su clave a los firmantes y firma con ella falla;
  - como control, leyendo los firmantes del propio PR, ese último pasaría, y por eso se leen de la base.
- **Lo que pide al usuario:** crear una clave SSH de firma en la PC con Windows y configurar Git para firmar (`gpg.format ssh`, `user.signingkey`). Es una vez. Ver P7-20.

**En `pr:mergear`** (P7-18), el resumen muestra:
- las fichas que cambian de estado respecto de `main` (por ejemplo, `FT-30: en_curso → terminada`);
- los manuales pendientes de todas las fichas terminadas, con "sin resultado" o "falló el …".

V7-11 lo probó con el inventario sintético.

**Costo en minutos del job `cierre` (M15):**
- en `main`, es un paso de `desplegar`;
- en un PR, corre solo si `features.json` pasa alguna ficha a `terminada`, unas 15 veces al mes;
- agrega unos 15 minutos al mes al modelo de 6.4.

---

## 23. Muestras reales (SP-01)

- **Qué llega.** El usuario entrega las muestras anonimizadas de SMS (los tres bancos, todos los tipos) y de los seis formatos de CSV (04 SP-01).
- **Anonimización, antes de entrar al repositorio:**
  - últimos cuatro dígitos reemplazados por `0000` a `0009`;
  - nombres de personas por "PERSONA A" y "PERSONA B";
  - montos y fechas se conservan, porque el formato depende de ellos;
  - números de cuenta y de referencia, por ceros de la misma longitud.
- **Script de entrada.** `tools/pruebas/anonimizar.ts` hace los reemplazos y escribe en `packages/sms/pruebas/muestras/` y `packages/conciliacion/pruebas/muestras/`.
- **Control.** PRU-SEG-BAND-002 falla si un archivo de muestras contiene una secuencia de 13 a 19 dígitos o unos últimos cuatro dígitos que estén en `FINN_ULTIMOS4_REALES`, un secreto de CI que solo existe ahí.
- **Qué desbloquean.** Con las muestras se ejecutan PRU-MAN-BAND-003, PRU-MAN-BAND-004 y PRU-MAN-CONC-001. Los CA ⚠ (S6-1) pasan a tener sus pruebas automáticas reescritas con las muestras (FX-1), y las sintéticas quedan como casos adicionales.
- **Riesgo RS-03 de 04 sin cambios:** si las muestras no llegan, la decisión de desactivar F-1..F-3 es de la Fase 8. La Parte D lo registra en los riesgos de salida.
- **Cobertura verificable [F8] (CH-03).** `anonimizar.ts` genera `pruebas/muestras-cobertura.json` (institución, tipo de SMS y formato de CSV con muestras). La condición 2 de §30 lo cruza con las filas de exclusión firmadas.

---

## 24. Verificación de los ajustes de la Parte B y de la Parte C

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V7-11 | Matriz con 01 completo y las reglas nuevas (P7-15 a P7-18) | Conteos sobre `01-dominio.md` completo: **28 invariantes, 34 CB, 50 ESC, 24 AV**, con 492 CA en 77 fichas. Con el inventario sintético completo (764 pruebas, 9 manuales con resultado): pasa en modo puerta. **21 de 21 mutaciones** detectadas por su regla (las 15 de V7-09 más M14, dos de M15 —cuarentena y prueba fallida— y tres de M16 —sin resultado, falla posterior y fila incompleta—). FT-49 aparece como "diferida". Sin resultados manuales: modo incremental con 0 errores y 8 avisos; modo puerta cerrado por 8 fichas con manual pendiente. Resumen de `pr:mergear` con los cambios de estado y los manuales pendientes | — | Los informes JSON reales de una corrida (M15 se probó con resultados sintéticos) |
| V7-12 | Firmas de `resultados.md` (M17) | 5 casos con `git verify-commit` y claves SSH: el del usuario pasa; otra clave, sin firma y la clave agregada por el PR fallan; el control muestra por qué los firmantes se leen de la base | El entorno de la sesión tiene su propio programa de firma; la prueba fija `gpg.ssh.program=ssh-keygen` | La firma desde Windows (Git for Windows con OpenSSH) |
| V7-13 | Coherencia de A.7 con 01 y con 3.5.12 (P7-17) | **21 comprobaciones cuadran** (Disponibles, totales, efectivo, patrimonio, S de Visa Oro, reducción proyectada, promedio de CA-63.3, sobrante de CA-62.2 con las 8 categorías). **11 no cuadran**, agrupadas en 6 hallazgos (P7-19) | Ver P7-19 | La coherencia completa necesita los consumos de Supermercado y Gasolina, que A.7 no da (3.5.12 los supuso) |
| V7-14 | POOL-04: `REVOKE` como no superusuario, y la marca local (CT-06) detrás de PgBouncer | `REVOKE` → `WARNING: no privileges could be revoked`, sin efecto. Como superusuario funciona. Marca: diseño actual 10 de 10 escrituras pasan; con la marca, 10 de 10 rechazadas con FN001; el flujo normal pasa | El primer prototipo sin `coalesce` dejaba pasar todo (19.5) | Supabase real (H-02) |
| V7-15 | `CMP` con el modo navegador de Vitest 3.2.7, Chromium de Playwright 1.56 y axe-core 4 | 4 de 4 en 3,8 s, incluido el control negativo (`svg-img-alt`, `color-contrast`) | — | Vitest 4 (la versión que fija el plan) |

---

## 25. Cambios propuestos a documentos aprobados (Parte C)

| CT | Qué cambia | Documentos y secciones | Estado |
|---|---|---|---|
| **CT-03** | Lo que pedía iPhone o VoiceOver, con la precisión de P7-9. **CA-78.15:** "En un Android real, la pulsación larga…"; iPhone, riesgo aceptado (P7-9). **CA-70.7:** "La entrega real del push en Android con la app instalada (05 §8.8)"; iPhone, riesgo aceptado. **05 §11.10, fila Lector de pantalla:** "TalkBack (Android, Chrome) y NVDA (Windows, Chrome o Firefox)"; VoiceOver, riesgo aceptado (P7-9); y "Lo registra el usuario en `pruebas/manuales/resultados.md` (P7-18)" en lugar de "Lo registra el agente". La primera versión se declara probada en Android y en Chrome de escritorio, con WebKit parcial en el nocturno (§3.2) | 06 CA-78.15, CA-70.7; 05 §11.10 | **Aplicado [F7]** (§34) |
| **CT-06** | Marca local de la transacción en `finn.tomar_bloqueo()` y `finn.tiene_bloqueo()` (19.5), en una migración manual nueva `m_bloqueo_marca`. La instantánea de C6 cambia en esas dos funciones. PRU-INT-POOL-004 pasa a esperar el rechazo, con el caso "sin marca". Reemplaza la propuesta de `REVOKE`, que en Supabase no aplica (V7-14) | 03 §4.1 (las dos funciones), §10.1 (migración), §11.6 (C6); 04 §4.2 (nota sobre el protocolo: sin cambios para la aplicación) | **Aplicado [F7]** (P7-21 a)) |
| **CT-07** | Corrección de A.7 para que sea coherente con 01 | 05 anexo A.7; 06 §3.5.12 y §4.2; 06-identidad-visual §2.9 y §6 (los CA no cambian) | **Aplicado [F7]** (§28) |

---

## 26. Decisiones, supuestos y preguntas de la Parte C

### 26.1 Decisiones

| ID | Decisión | Justificación | Alternativas descartadas |
|---|---|---|---|
| DP-21 | Regla de nivel por tipo de CA (§17) y suites por área (§18) | El agente elige el nivel sin interpretar; la matriz exige la cobertura | Un caso por CA escrito en este documento (492 líneas que repetirían las fichas) |
| DP-22 | La prueba de AAL2 recorre el registro real de acciones y rutas (PRU-SEG-ACCESO-001) | Una ruta nueva entra sola; una lista a mano se desactualiza | Lista de rutas en la prueba |
| DP-23 | V-21 pasa de revisión de código a prueba de catálogo (PRU-ESQ-ESQ-001) | Lo que se revisó una vez puede romperse en la Fase 8 | Dejarlo como revisión |
| DP-24 | Resultados manuales con commits firmados por la clave del usuario (M17) | Es la única barrera que un agente con acceso al repositorio no puede saltar | Confiar en el autor del commit (los agentes usan la misma cuenta de GitHub); un formulario de issues (mismo problema) |
| DP-25 | Los pasos H quedan como un manual del usuario, con su ensayo en CI | SP-02 es del usuario; el ensayo reduce sorpresas | Marcarlos como verificaciones sin prueba |
| DP-26 | Mutantes del motor en el nocturno, que falla si alguno sobrevive | La cobertura no basta (V7-03); un mutante vivo muestra una regla desprotegida | Solo cobertura |

### 26.2 Supuestos

1. El registro de Server Actions de `apps/web` se puede enumerar en una prueba: un módulo índice o la convención de carpetas de 05. Si no, la Fase 8 agrega el índice.
2. El usuario puede firmar commits en Windows con Git for Windows y una clave SSH (P7-20).
3. Las muestras de SP-01 se entregan como archivos que el usuario pasa por el script de anonimización en su PC, antes de que entren al repositorio.

### 26.3 Preguntas

**P7-19. A.7 no es coherente con 01 (V7-13).** P7-17 pidió reproducir A.7 entero y avisar si algo no cuadra. No ajusté nada. Estos son los 6 hallazgos:

| # | Qué no cuadra | Regla de 01 | Qué afecta |
|---|---|---|---|
| A7-1 | **Identidad de saldo.** Efectivo $4,404.60 frente a LPA + Disponibles + Pago Visa Oro + SobTA = $2,564.74 (con Farmacia $27.65 y Mascota $8.00): faltan **$1,839.86**, que A.7 no muestra en ninguna parte (asignaciones futuras o categorías no listadas) | inv. 1 | La prueba de identidad de la semilla |
| A7-2 | **Actividad de Pago Visa Oro $623.43.** Con arrastre y asignado en $0.00, es la suma de lo cubierto con tarjeta en el período. Todo lo que las categorías listadas podrían haber comprado con tarjeta, cubierto, suma como máximo $496.15 | §4.5 paso 5 | "Te falta reservar" $18.75; deuda $642.18 |
| A7-3 | **"Para no generar intereses" $512.40** con corte el 25: exige una deuda de al menos $512.40 al 25/09. Con Pago Visa Oro sin arrastre y S = $18.75, esa deuda tendría que ser de compras del 21 al 25/09, y en ese tramo las categorías listadas suman como máximo $294.55 | §4.14 | Cuentas, detalle de la tarjeta |
| A7-4 | **Arrastre de Restaurantes.** El historial termina agosto con $1.10, así que el arrastre a septiembre debería ser $1.10, no $0.00 (−$25.20 en lugar de −$26.30). Además, el historial calcula cada período sin arrastre: con arrastre, abril sería $10.30 y no −$1.50 | §4.6 | CA-62.1 (−$55.56), CA-08.6, recorrido 4.2 paso 5; no CA-63.3 (el promedio usa solo los gastados) |
| A7-5 | **SUPER SELECTOS 15/10 $35.00** es a la vez transacción (está en recientes, en el gasto semanal y en el confirmado de Visa Oro: $642.18 − $607.18) y movimiento pendiente en la Bandeja | inv. 15, §7.1 | Recorrido 4.2 pasos 1 y 3 |
| A7-6 | **Farmacia ($27.65) y Mascota (archivada, $8.00)** existen en Registrar y en Inicio, pero no en el Presupuesto ni en sus totales. Con Farmacia, el sobrante de CA-62.2 sería $1,574.29, no $1,546.64 | inv. 1 (incluye archivadas); 06 §3.5 | CA-62.2 |

Opciones:
- a) **Propongo un A.7 corregido (CT-07) para que lo apruebes punto por punto.** Reglas:
  - mantener sin cambios los números que citan los CA y 3.5.12, siempre que se pueda. Por ejemplo, A7-4 se resuelve corrigiendo los asignados del historial, sin tocar los gastados, y CA-63.3 no cambia;
  - agregar solo hechos que no se ven en pantalla, como asignaciones futuras o compras de períodos anteriores;
  - listar cada número de pantalla que cambie y cada captura de `06-identidad-visual.md` afectada.
- b) **Se fija una regla para cada hallazgo** y la aplico.
- c) **Volver a P7-17 a)** para los CA, y dejar A.7 solo como dato de diseño.
- *Recomiendo a).* Algunos hallazgos (A7-2, A7-3) no tienen arreglo sin cambiar algún número visible: el CT lo diría con su efecto.
- **Pregunta aparte:** en A7-5, ¿el estado sembrado es el de **antes** del paso 1 de 4.2 (sin la transacción de $35.00; Supermercado gastado $252.15 hasta aprobarla)? Así, 4.2 la crea en el paso 3 y los números de 3.5.12 valen después de ese paso.

**P7-20. Clave de firma para los resultados manuales.** DP-24 exige que los commits de `resultados.md` vayan firmados con la clave SSH del usuario. Pide una configuración única en la PC con Windows (`ssh-keygen -t ed25519`, `git config gpg.format ssh`, `user.signingkey`) y registrar la clave pública en `pruebas/firmantes-permitidos`.
- a) Sí, con firma SSH.
- b) Sin firma: solo la regla de trabajo de `pr:mergear` y el autor del commit. Es más débil, porque los agentes usan la misma cuenta de GitHub.
- *Recomiendo a).*

**P7-21. CT-06 (marca local de la transacción).** El `REVOKE` que pediste no aplica en Supabase (V7-14). ¿Se acepta en su lugar CT-06, que impide en la base el caso de POOL-04 (V7-14: de 10 de 10 escrituras que pasan a 10 de 10 rechazadas)?
- a) Sí, CT-06, más la prueba estática.
- b) No cambiar 03: quedan la prueba estática y POOL-04 como control, y se registra el riesgo en la Parte D.
- *Recomiendo a).* Son dos líneas en dos funciones y no cambia nada para la aplicación.


---

# Parte D — Cierre: terminado, puerta de salida, errores de dinero y enmiendas

## 27. Definición de terminado de una feature

Una ficha pasa a `terminada` en `pruebas/features.json` solo si se cumple todo esto. Lo marca el agente (P7-18), y la matriz lo hace cumplir en el mismo PR:

| # | Condición | Quién lo comprueba |
|---|---|---|
| 1 | Cada CA de la ficha tiene al menos una prueba activa con su identificador en el título (M1) | `rapido` (matriz) |
| 2 | Los ESC y AV que cita la ficha tienen sus pruebas (M2, M3); los invariantes y los CB, desde la primera ficha terminada (M4, M14) | `rapido` |
| 3 | **Todas** las pruebas automáticas de sus CA pasaron en la corrida del PR y ninguna está en cuarentena (M15). El PR que cambia la ficha a `terminada` corre sus suites completas, E2E incluida | Job `cierre` |
| 4 | Los manuales de la ficha tienen su resultado "pasa" registrado y firmado por el usuario (M16, M17). Si no, la ficha queda **terminada con manual pendiente**, que no cuenta para la puerta | `rapido` y `pr:mergear` |
| 5 | Los presupuestos de bytes de las rutas de la ficha se cumplen (6.6) y axe no encuentra violaciones en sus rutas (05 §11.10) | `e2e` |
| 6 | Todo ejemplo numérico nuevo de la ficha sale de una semilla ejecutada por el motor, con su prueba (DP-27) | Revisión del PR; matriz (M7) para las referencias |
| 7 | `pr:mergear` mostró el resumen de cambios de estado y de manuales pendientes, y el PR se mergeó con él | `pr:mergear` |
| 8 **[F8]** (CH-08) | Si la ficha completa CA pendientes de punta a punta de otras fichas, cada uno tiene su E2E en verde (M18) | `rapido` (matriz) y `cierre` |

---

## 28. CT-07: A.7 corregido (P7-19)

### 28.1 Cómo se hizo

- **La semilla.** `estado_a7.py` (en `a7/semilla/` del zip) escribe A.7 como **hechos**: cuentas, categorías, metas, asignaciones de los 7 períodos, transacciones, el pago de la tarjeta, la programada y la línea por cobrar. Los pasa por el motor mínimo de la Fase 6 (`motor_min.py`, extendido con las líneas por cobrar con débito) y por las fórmulas de 06 §3.5 (`reportes.py`).
- **Ningún número de pantalla se escribe a mano**: todos salen de `calcular()`, y la identidad de saldo se comprueba en cada cálculo (`assert`).
- **Dos valores despejados.** Para conservar LPA $312.40 y Cuenta corriente $1,284.60, el script despeja el saldo inicial de la Cuenta corriente (21/03/2026) y el asignado futuro de Viaje.
- **Comparación.** `comparar.py` compara 86 números de las pantallas con lo publicado en A.7, 3.5.12 y los CA. Sale con error si cambia alguno de los que citan los CA.
- **Las reglas de P7-19:**
  1. se conservan los números que citan los CA cambiando datos que no aparecen en ellos;
  2. se agregan Farmacia y Mascota con Disponible $0.00;
  3. la identidad se cierra con hechos que no tocan las categorías citadas;
  4. lo que no se puede conservar se cambia al valor coherente y se lista.
- **Momento de A.7.** A.7 es el estado **después del paso 3 de 4.2**, con SUPER SELECTOS aprobado, porque así lo suponen 3.5.12 y el gasto semanal ($35.00 en la semana 4). La semilla de 4.2 es el mismo estado **antes del paso 3** (P7-19, punto 6).
  - SUPER SELECTOS no existe todavía; el paso 1 del recorrido lo crea como movimiento pendiente desde el SMS, y el paso 3 lo aprueba.
  - **Precisión de lectura:** pediste que "la compra existe solo como movimiento pendiente de la Bandeja". En 06 §4.2, ese movimiento nace en el paso 1 (`POST /api/sms`). Si estuviera sembrado, el SMS del paso 1 se autodescartaría. Por eso la semilla no lo trae y el paso 1 lo crea. Así lo dice la nota **[F7]** de 06 §4.2.
  - La pantalla Bandeja de A.7 muestra el estado entre los pasos 1 y 3: 3 por revisar.

**V7-16:** de 86 números, **68 salen iguales** y **18 cambian**; **0 de los citados por los CA cambian**.

### 28.2 Números que cambian (anterior → nuevo → dónde)

| # | Número | Anterior | Nuevo | Por qué (regla de 01) | Dónde aparece |
|---|---|---|---|---|---|
| 1 | Restaurantes, historial de 6 períodos (asignado / gastado / Disponible) | mar 100.00/88.20/11.80 · abr 100.00/101.50/−1.50 · may 100.00/96.40/3.60 · jun 100.00/112.20/−12.20 · jul 120.00/104.75/15.25 · ago 120.00/118.90/1.10 | mar 100.00/88.20/11.80 · abr **102.00**/101.50/**12.30** · may 100.00/96.40/**15.90** · jun 100.00/112.20/**3.70** · jul 120.00/104.75/**18.95** · ago **99.95**/118.90/**0.00** | El historial no llevaba el arrastre (§4.6); agosto en $1.10 habría arrastrado $1.10 a septiembre. Con abril en $102.00 se conserva "Se pasó 2 de 6" (CA-14.9); los gastados no cambian, así que el promedio $111.95 (CA-63.3) tampoco | 05 A.7 (Detalle); 06-identidad-visual §6 (historial y su tabla) |
| 2 | Pago Visa Oro: actividad | $623.43 | **$166.60** (arrastre **$456.83**, nuevo) | Las compras cubiertas del período no alcanzan $623.43 (§4.5); la deuda de agosto, reservada, llega como arrastre. El reservado sigue en $623.43 | 05 A.7 (Presupuesto, `pagosTarjeta`) |
| 3 | Visa Oro: "para no generar intereses" | $512.40 | **$370.63** | Deuda al corte del 25/09 ($570.63) menos lo pagado después ($200.00 el 10/10) (§4.14) | 05 A.7 (Cuentas); 06-identidad-visual §2.9 y §6 |
| 4 | Visa Oro: "deuda" en el estado *Categoría de pago de tarjeta* | $623.43 | **$642.18** (reservado $623.43) | El texto del diseño confundía deuda con reservado | 06-identidad-visual §6 |
| 5 | Farmacia | No estaba en el Presupuesto; Registrar la mostraba con $27.65 | En Casa: asignado **$12.35**, gastado **$12.35**, Disponible **$0.00** | Existía sin entrar a la identidad (inv. 1); asignado = gastado para no cambiar el sobrante | 05 A.7 (Presupuesto, Registrar) |
| 6 | Mascota (archivada) | Disponible $8.00 | **$0.00**; Inicio sin "archivadas con Disponible" | Ídem (inv. 1 incluye las archivadas) | 05 A.7 (Inicio) |
| 7 | Cuota del préstamo (categoría) | No estaba | Grupo Deudas: asignado **$210.00**, Disponible **$210.00** | La cuota programada del 20/10 (OP-24) necesita su categoría; su proyección da $0.00 y no cambia el sobrante | 05 A.7 (Presupuesto) |
| 8 | Totales del Presupuesto | $775.49 · $635.60 · $1,574.51 | **$997.84** · **$647.95** · **$1,784.51** | Suman Farmacia y Cuota del préstamo | 05 A.7; 06-identidad-visual §5 |
| 9 | `bandejaPorRevisar` y `atencion.bandeja` (fuera de la pantalla Bandeja) | 3; pendientes 2 y 1 con coincidencia | **2**; pendientes **1** y 1 con coincidencia | A.7 es después del paso 3 | 05 A.7 (encabezado, Inicio) |
| 10 | Hechos nuevos que no se ven en ninguna pantalla | — | Supermercado de agosto con $12.00 pasados al período anterior (reducción de LPA $12.00, el "cambio retroactivo" de Inicio); asignado a futuro $1,665.51 (Fondo de emergencia, $175.00 en 9 períodos, y Viaje, $90.51); pago a Visa Oro de $200.00 el 10/10; saldo inicial de la Cuenta corriente $464.32; consumos de Supermercado y Gasolina que 3.5.12 suponía; CINEMARK $40.00 por cobrar a Carlos | Cierran la identidad de saldo sin tocar ningún número citado | Solo en la semilla |

**Sin cambio**, entre otros:
- los números que citan los CA: −$26.30, $55.56, −$38.50, $50.44, $43.62, $1,546.64, $111.95, +56.82 %, "Se pasó 2 de 6", $312.40 y los dos hallazgos de ritmo;
- LPA, en camino, reducción proyectada;
- los ocho Disponibles publicados, metas y faltas;
- efectivo, Visa Oro (deuda $642.18, confirmado $607.18, 25.69 %, te falta reservar $18.75);
- patrimonio ($6,520.20 · $4,852.18 · $1,668.02);
- gasto semanal y consumos de Restaurantes con su reparto.

**Aplicación (CT-07):**
- en 05, una nota **[F7]** en A.7 con todos los cambios;
- en 06, en 3.5.12 y en la precondición de 4.2;
- en 06-identidad-visual, en §2.9 y §6.

Los textos de los CA no cambian. El diseño no se rehace: las pantallas toman los números nuevos al implementarse (P7-19, punto 4).

### 28.3 V6-01 repetido sobre la semilla completa

`pantallas()` construye las entradas de las fórmulas de 3.5 (`Cat` de `reportes.py`) **desde el resultado del motor sobre la semilla**: Disponibles, fondos, partes no cubiertas por tarjeta, consumos con su día y su medio, y programadas pendientes. No usa derivados escritos a mano, que es lo que dejó pasar el error en la Fase 6.

| Resultado | Valor |
|---|---|
| Disponibles proyectados (3.5.12) | Supermercado $5.42 · Luz y agua $6.60 · Internet $0.00 · Restaurantes −$55.56 · Gasolina −$38.50 · Netflix $0.00 · Farmacia $0.00 · Cuota del préstamo $0.00 |
| Hallazgos de ritmo (CA-62.1) | Restaurantes y Gasolina, los dos únicos |
| Proyección del cierre (CA-62.2) | 2 sobregiradas · LPA bajaría $50.44 · te faltaría reservar $43.62 · te sobrarían $1,546.64 |
| Comparación (CA-63.3) | $175.56 frente a $111.95 (+56.82 %) |
| Contra la realidad | Sin sugerencia para Restaurantes |

En la Fase 8, `estado_a7.py` se porta a `packages/dominio/escenarios/semillas/estado-a7.ts`, y `comparar.py` pasa a ser PRU-DOM-MOTOR-903 contra el motor real.

### 28.4 Regla nueva: ejemplos numéricos (DP-27)

Regla de P7-19, punto 5: **todo ejemplo numérico de los documentos sale de una semilla ejecutada por el motor, con su prueba. Sin cifras escritas a mano.**
- **En la Fase 8:**
  - un número que un CA, un texto de pantalla o un documento cita como resultado ("Dado A.7… entonces $X") tiene una semilla en `escenarios/semillas/` o un escenario;
  - tiene también una prueba que lo calcula con el motor;
  - el CA cita la semilla (`[REC-4.2]`, `[ESC-nn]` o el nombre de la semilla en el título).
- **Al cambiar un documento** (un CT posterior), los números nuevos se producen así. Un número que no sale de una semilla se rechaza en la revisión del CT.
- **Lo ya aprobado:**
  - los escenarios de 01 §8 ya cumplen: son las semillas de `ESC@motor`;
  - A.7 cumple desde CT-07;
  - 4.3 y 4.6 cumplen por `recorridos.py`;
  - los demás ejemplos de 06 (por ejemplo, CA con montos sueltos) se pasan a semilla cuando su ficha se implemente, como parte de la condición 6 de §27.

---

## 29. Firma de los resultados manuales (P7-20)

### 29.1 Condiciones

- Una clave **dedicada** solo a firmar resultados manuales, **con contraseña**. Nunca se carga en `ssh-agent` ni en el agente de Windows (servicio "OpenSSH Authentication Agent"): cada firma pide la contraseña, y un agente de la Fase 8 que corra en la PC del usuario no puede firmar sin el usuario.
- `pruebas/firmantes-permitidos` en el repositorio con **solo esa clave**: el control falla si tiene otra cantidad.
- **Control en `rapido`** (`tools/pruebas/firmas.sh`, PRU-SEG-OPER-001):
  1. lee los firmantes de la rama base;
  2. comprueba con `git blame` que **cada fila** actual de `resultados.md` venga de un commit firmado con esa clave;
  3. comprueba que todo commit que tocó `resultados.md` o `firmantes-permitidos` esté firmado, lo que cubre filas borradas.
- **V7-17** probó 4 casos:
  - todo firmado: pasa;
  - una fila cambiada de "falla" a "pasa" sin firma: falla;
  - una fila borrada sin firma, que `blame` no ve pero el control de commits sí: falla;
  - dos claves en firmantes: falla.

### 29.2 Instrucciones para Windows (PRU-MAN-OPER-001)

**Disparador:** una vez, antes del primer resultado manual. Repetir si cambias de PC o de clave.

**Dispositivo:** la PC con Windows, con Git for Windows instalado.

**Pasos:**
1. **Crear la clave dedicada, con contraseña.** En PowerShell: `ssh-keygen -t ed25519 -C "finn-resultados-manuales" -f "$env:USERPROFILE\.ssh\finn_resultados"`. Contraseña nueva y larga, guardada en el gestor de contraseñas. No se agrega con `ssh-add`.
2. **Comprobar que el agente de Windows no la tiene.** `ssh-add -l` no debe listar `finn-resultados-manuales`. Si el servicio "OpenSSH Authentication Agent" está activo por otras claves, puede seguir así, pero esta clave no se agrega nunca.
3. **Configurar Git solo en el repositorio de Finn**, sin `--global`, desde la carpeta del repositorio:
   - `git config gpg.format ssh`
   - `git config gpg.ssh.program "C:/Windows/System32/OpenSSH/ssh-keygen.exe"`, o el `ssh-keygen` de Git for Windows (`C:/Program Files/Git/usr/bin/ssh-keygen.exe`)
   - `git config user.signingkey "$env:USERPROFILE/.ssh/finn_resultados"` (la ruta de la clave **privada**, para que pida la contraseña en vez de buscar el agente)
   - `git config commit.gpgsign false` (no firmar todo; solo estos commits)
4. **Registrar la clave pública.** Agregar a `pruebas/firmantes-permitidos` una sola línea: `<email> ssh-ed25519 AAAA… finn-resultados-manuales`, con el contenido de `finn_resultados.pub`. Commit firmado y push directo a `main`: `git commit -S -m "firmantes"`. Pide la contraseña.
5. **Registrar un resultado.** Editar `pruebas/manuales/resultados.md` (una fila por ejecución); `git add pruebas/manuales/resultados.md`; `git commit -S -m "resultado PRU-MAN-…"`, con la contraseña; `git push` a `main`. Los PR no pueden tocar ese archivo (M16).
6. **Verificar en la PC.** `git -c gpg.ssh.allowedSignersFile=pruebas/firmantes-permitidos verify-commit HEAD` debe decir `Good "git" signature`.

**Resultado esperado:**
- el paso 6 da firma válida;
- `rapido` en `main` pasa PRU-SEG-OPER-001;
- un commit de prueba sin `-S` que toque `resultados.md` en una rama hace fallar `rapido`.

**Registro:** esta primera ejecución se registra como la primera fila de `resultados.md`, firmada.

**No verificado aquí:** Windows. Este entorno es Linux, y V7-12 y V7-17 probaron el mecanismo con OpenSSH 9 y Git 2.43. **Si la firma desde Windows no funciona en la práctica, se avisa al usuario antes de buscar otra alternativa** (P7-20). El punto con más riesgo es el paso 3: qué `ssh-keygen` usa Git y si pide la contraseña en la terminal.

---

## 30. Puerta de salida (P7-8)

**Una sola puerta, `pnpm pruebas:puerta`.** Está abierta solo si se cumple todo:

| # | Condición | Cómo se comprueba |
|---|---|---|
| 1 | Los **465 CA [I] y [M]** tienen sus pruebas automáticas en verde en la última corrida verde de `main`, o su manual con resultado "pasa" | `matriz --puerta --resultados <informes de esa corrida>` sin errores (M1 a M17), con ninguna ficha [I] o [M] "con manual pendiente" |
| 2 | **SP-01:** muestras reales recibidas, anonimizadas (§23) y con PRU-MAN-BAND-003, PRU-MAN-BAND-004 y PRU-MAN-CONC-001 en "pasa"; los CA ⚠ (S6-1) con sus pruebas automáticas reescritas. **[F8] (CH-03):** (a) **SMS:** un formato activo reescrito con muestras reales por cada institución de 03 §9.4 que se use: el BAC y Banco Agrícola; Cuscatlán excluido con la fila firmada `exclusión SP-01 \| institucion:Cuscatlán \| sin cuentas` y F-3 inactivo. (b) **CSV:** muestras de cada formato de ADR-17 de las instituciones usadas, o su exclusión firmada: los del BAC con muestras; los de Banco Agrícola con muestras si el banco ofrece CSV, y si no, excluidos con su fila firmada y verificados con FT-44; el de Cuscatlán, excluido | `resultados.md`, M11 y `pruebas:puerta`, que cruza `pruebas/muestras-cobertura.json` con las filas de exclusión |
| 3 | **SP-02:** prueba de humo H-01 a H-12 aprobada (PRU-MAN-ESQ-001 en "pasa"), con el disparador de P7-12 resuelto (§32.1) | `resultados.md` |
| 4 | **SP-04:** prueba en el teléfono con MacroDroid (PRU-MAN-BAND-001 en "pasa"), con la variante y el plan de reintentos registrados en la nota | `resultados.md` |
| 5 | Los resultados de 2 a 4 están firmados con la clave del usuario | M17 |
| 6 | Ensayo de PRU-MAN-OPER-002 (§31.5) en "pasa". El ensayo despliega el mismo commit que ya está en producción | `resultados.md` |
| 7 **[F8]** (CH-08) | Ningún CA pendiente de punta a punta, salvo los de fichas [P] | `matriz --puerta` (M18) |

**No entran en la puerta:**
- las fichas [P] y FT-49 (diferida);
- WebKit parcial (§3.2);
- los presupuestos de tiempo del nocturno, que bloquean solo por persistencia (6.6);
- los 8 avisos de M11 sin S6-1 (CA-55.1 y CA-55.2 tienen su manual, PRU-MAN-CTA-001, que **sí** cuenta porque FT-55 es [M]).

Con la puerta abierta empieza el paso de la 1.0 a la 2.0 y rige §31.

---

## 31. Si aparece un error de dinero en las primeras semanas

**Qué cuenta como error de dinero:**
- un invariante que no se cumple;
- una diferencia de conciliación que el usuario no puede explicar con un movimiento suyo;
- un número que difiere entre dos pantallas (error 11);
- un SMS que deja un monto, una fecha o una cuenta distintos del banco.

**Primeras semanas** = 8 semanas desde la apertura de la puerta: fecha `F`, registrada en `resultados.md`; fin `fin_primeras_semanas = F + 56 días` (§31.4).

### 31.1 Detección

| Señal | Mecanismo | Cuándo | Costo |
|---|---|---|---|
| **Control de dinero diario** | Paso nuevo al final de `respaldo.yml`. Con `finn_respaldo` (solo lectura) carga los hechos de producción por la misma consulta que la app, ejecuta el motor y comprueba los invariantes calculables (1 a 4, 6, 9 a 12, 17, 22, 24, 26 y 28). Cuenta las filas por tabla contra el día anterior. Guarda el resultado como artefacto del job, sin montos: solo los invariantes, si pasan y los conteos. Si algo falla, **el job falla** y GitHub envía al usuario su correo de workflow fallido. No toca la app ni la base: sin evento ni push nuevos (ajuste del cierre, 0.10) | Cada día, después del respaldo | +1 min por día (≈ 30 min al mes, dentro del margen de 6.4) |
| Restauración | `restauracion.yml` (ADR-22), con `verificar_todo()` sobre la copia restaurada; en las primeras 8 semanas, **semanal** en lugar de mensual | Semanal | +3 × 5 min al mes |
| Verificar saldo | El usuario verifica el saldo de cada cuenta con su banco una vez por semana (FT-44, `PRU-MAN-CTA-002`, con su resultado firmado). Una diferencia distinta de cero se investiga antes de ajustar | Semanal, 8 semanas | Tiempo del usuario |
| Igualdad entre pantallas | La E2E de `PRES` que compara las cuatro vistas (§18) corre en cada `main` y en el nocturno | Siempre | Ya incluida |

### 31.2 Diagnóstico

1. **Congelar la evidencia.** Ejecutar el respaldo a mano (FT-76, "Ejecutar tareas ahora") y exportar el JSON de hechos (FT-75), **antes** de tocar nada.
2. **Reproducir fuera de producción.** Restaurar el respaldo en una base local (03 §12.2) o cargar el JSON en el motor. Correr el control de dinero y ubicar el período, la categoría o la cuenta donde falla.
3. **Clasificar la causa:**
   - **cálculo**: el motor da un número equivocado con hechos correctos;
   - **hechos**: se guardó algo distinto de lo real, por un error de interpretación de un SMS, un formato o una operación;
   - **operación**: un rechazo o una precondición mal aplicada.
4. **Escribir primero la prueba que falla.** Un escenario nuevo con los hechos mínimos que reproducen el error, anonimizados y en el formato de 12.3. Va en `escenarios/datos/reg-nn.ts`, con identificador `PRU-ESC-REG-nn`, y queda como prueba permanente.

### 31.3 Corrección de los datos

| Causa | Corrección | Por qué |
|---|---|---|
| **Cálculo** | Se corrige el código y se despliega. **No hace falta migrar datos:** ningún derivado se guarda (01 §3, R1), así que todos los números, también los de períodos cerrados, quedan correctos con el código nuevo | Es la consecuencia de R1, y la razón de que sea la causa más fácil de reparar |
| **Hechos, pocos** | El usuario los corrige con las operaciones normales (editar, eliminar, registrar), que muestran el impacto retroactivo (AV-01) antes de confirmar | Pasan por las mismas validaciones y triggers |
| **Hechos, muchos** (por ejemplo, un formato que leyó mal 40 SMS) | Script `tools/correccion/<fecha>-<motivo>.ts` que llama a las **operaciones de `@finn/aplicacion`** con el protocolo de 04 §4.2, nunca SQL directo. Antes: respaldo manual y ejecución en seco con el impacto total (Δ LPA, Δ Disponibles, Δ S). El usuario lo revisa y aprueba la ejecución real. Después: el control de dinero en verde. Cada ejecución se registra en `eventos_sistema` | Un `UPDATE` directo saltaría las reglas que hacen correctos los números; además, los triggers lo rechazarían sin el bloqueo |
| **Operación** | Corrección del código y, si dejó hechos inválidos, el caso anterior | — |

### 31.4 Vuelta atrás mínima

- **Código.**
  - `vercel rollback` vuelve al despliegue de producción **inmediatamente anterior**: en Hobby es el único destino posible (documentación de Vercel).
  - Para volver más atrás: `git revert` en `main` y el despliegue normal de `desplegar`.
- **Esquema.**
  - Durante las 8 semanas solo se aplican migraciones de **expansión**; las de contracción esperan.
  - Así, cualquier versión anterior del código funciona con el esquema actual (ADR-10), y volver atrás el código nunca exige volver atrás la base.
- **Datos, último recurso.**
  - Restaurar el respaldo diario (ADR-22, 03 §12.2) si los hechos quedaron dañados de una forma que las operaciones no pueden corregir.
  - Se pierde lo registrado después del respaldo. Los SMS de ese lapso se reingresan desde el historial de MacroDroid o los estados de cuenta, y una conciliación por cuenta confirma el resultado.
- **Finn 1.0** como respaldo de uso (P7-22 a)): ver abajo.

**Finn 1.0 durante las primeras semanas (P7-22).**
- **Desde que se abre la puerta** y durante 8 semanas, la 1.0 queda **accesible solo como referencia**: no se registra nada en ella, no se compara a diario y no se le hacen cambios. Su proyecto de Supabase sigue activo (ocupa el segundo cupo gratuito, ADR-04).
- **Fecha como condición.** Al abrir la puerta, el usuario registra en `pruebas/manuales/resultados.md`, con firma, la fila `puerta abierta` con su fecha `F`. La fecha de fin es `fin_primeras_semanas = F + 56 días`. Es la misma fecha que cierra los demás plazos de las 8 semanas: migraciones solo de expansión, restauración semanal y verificación de saldo semanal.
- **Incidente de integridad:** un error de dinero confirmado (definición al inicio de §31) en la 2.0 entre `F` y `fin_primeras_semanas`. Se registra en `resultados.md` como `incidente de integridad`, con el escenario `PRU-ESC-REG-nn` que lo reproduce.
- **El día `fin_primeras_semanas`:**
  - **sin incidentes de integridad** registrados en el plazo: la 1.0 se apaga con PRU-MAN-OPER-003;
  - **con alguno:** la 1.0 **no** se apaga y la decisión vuelve al usuario, con la lista de incidentes y su corrección. Este documento no fija un plazo nuevo.
- **PRU-MAN-OPER-003 (apagar la 1.0).**
  - **Disparador:** el día `fin_primeras_semanas`, sin incidentes de integridad.
  - **Pasos:**
    1. comprobar en `resultados.md` que no hay filas `incidente de integridad` entre `F` y `fin_primeras_semanas`;
    2. exportar los datos de la 1.0 con su mecanismo de exportación, o con un volcado `pg_dump` del proyecto, y guardarlos fuera del repositorio;
    3. pausar el proyecto de Supabase de la 1.0 desde su panel;
    4. quitar el despliegue de producción de la 1.0 en Vercel.
  - **Resultado esperado:** la 1.0 no responde; la 2.0 sigue igual; queda libre el segundo cupo de Supabase.
  - **Registro:** fila firmada en `resultados.md`.

### 31.5 Despliegue de emergencia sin GitHub Actions (PRU-MAN-OPER-002)

**Solo para emergencias.** No es un segundo camino de despliegue: el camino normal sigue siendo `desplegar` en `main` (ADR-10).

**Por qué existe.**
- Si se agotan los 2.000 minutos del mes, los workflows se detienen hasta el mes siguiente (6.4), y con ellos `desplegar`.
- Eso puede pasar justo cuando hay que corregir un error de dinero (§31).
- `vercel rollback` no usa Actions y sigue disponible, pero solo vuelve al despliegue anterior: no sirve si la corrección es código nuevo.

**Disparador: se cumplen las dos condiciones.**
1. `desplegar` no puede correr: minutos de Actions agotados, o Actions caído según su página de estado.
2. Hay en producción un error de dinero (§31) o de seguridad que `vercel rollback` no resuelve.

**No se usa para:**
- features;
- cambios que se pueden esperar al mes siguiente;
- correcciones que necesitan una **migración**. La regla de ADR-10 de que una migración siempre precede al código no tiene excepción, y desde la PC no se aplican migraciones. En ese caso queda `vercel rollback` y esperar.

**Dispositivo:** la PC con Windows, con:
- Git;
- Node 24 y pnpm;
- Docker Desktop, que la suite de integración necesita (Testcontainers);
- la CLI de Vercel (`pnpm dlx vercel@<versión fijada en package.json>`).

**Pasos:**
1. **Descartar `vercel rollback`.** Si el error llegó con el último despliegue y volver al anterior lo evita, hacer `vercel rollback` y detenerse aquí.
2. **Llevar la corrección a `main`.**
   - Con Actions detenido no corren los checks ni `pr:mergear`.
   - El usuario revisa el diff y hace push a `main` de la rama de corrección, que debe ser un solo commit firmado: `git commit -S`, con la clave de §29.
   - `rapido` exige la firma solo para `resultados.md`; aquí la firma identifica que el push lo hizo el usuario.
3. **Estado limpio en ese commit.**
   - `git switch main && git pull --ff-only`.
   - `git status` sin cambios.
   - Anotar `git rev-parse HEAD`.
4. **Sin migraciones nuevas.** `git diff --name-only <commit desplegado>..HEAD -- packages/db/prisma/migrations` vacío. El commit desplegado se ve en `/ajustes/diagnostico` (FT-76). Si no está vacío, detenerse: este procedimiento no aplica.
5. **Las mismas suites, en local.** `pnpm install --frozen-lockfile`, y después:
   - `pnpm ci:rapido`;
   - `pnpm ci:integracion`;
   - `pnpm ci:politica-patrones`, que es requisito de `desplegar` (04 §14.1).

   Los tres deben quedar en verde. Son los **mismos scripts** que ejecutan los jobs `rapido` e `integracion` y el trabajo `politica-patrones` (DP-34): los workflows solo llaman a `pnpm ci:<job>`, así que lo local y lo de CI no pueden divergir. No corren las E2E: el registro lo dice.
6. **Token temporal de Vercel.**
   - Crear en el panel de Vercel (Account Tokens) un token **limitado al proyecto de Finn** (alcance Project) y con el **vencimiento más corto que ofrezca el panel**, idealmente 1 día.
   - En una ventana nueva de PowerShell: `$env:VERCEL_TOKEN = "<token>"`, `$env:VERCEL_ORG_ID = "<id>"`, `$env:VERCEL_PROJECT_ID = "<id>"`.
   - **No** usar `vercel login`, que dejaría una sesión guardada en la PC con la que un agente de la Fase 8 podría desplegar.
7. **Barrera 1b.** `node tools/ci/barrera-1b.mjs`: es el mismo script de `desplegar`, que con `vercel env ls` comprueba que `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` y `FINN_HOY_SIMULADO` no existan en ningún entorno de Vercel (CT-01).
8. **Desplegar.** `vercel deploy --prod --token $env:VERCEL_TOKEN`. La compilación ocurre en Vercel y no usa minutos de Actions.
9. **Comprobar.**
   - `/ajustes/diagnostico` muestra el commit del paso 3.
   - El caso que reproducía el error, el escenario `PRU-ESC-REG-nn` de §31.2, ya no se ve en la app.
   - "Verificar saldo" (FT-44) de la cuenta afectada da diferencia cero o la explicada.
10. **Revocar el token** en el panel de Vercel y cerrar esa ventana de PowerShell.
11. **Registrar.**
    - En el editor SQL de Supabase: `INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos) VALUES ('aviso', 'app', 'despliegue_emergencia', jsonb_build_object('commit', '<sha>', 'motivo', '<texto>', 'suites', 'rapido, integracion, politica-patrones', 'e2e', false));`
    - Además, una fila firmada en `resultados.md` con `PRU-MAN-OPER-002`, el commit y el motivo. Esa fila es el registro permanente; la de `eventos_sistema` se purga a los 90 días (ADR-23).

**Resultado esperado:**
- producción corre el commit corregido;
- el error ya no se reproduce;
- el token está revocado;
- quedan dos registros: `eventos_sistema` y `resultados.md`.

**Ensayo (condición 6 de §30).**
- Antes de abrir la puerta, el usuario hace los pasos 3 a 11 con el commit que ya está en producción.
- El motivo registrado es `ensayo`.
- Así se prueba el procedimiento en Windows sin una emergencia real.

**Después:**
- Cuando Actions vuelva, el siguiente push a `main` corre `desplegar` completo, E2E incluida.
- Si algo falla, es una corrida roja normal.
- `pr:mergear` lista el despliegue de emergencia pendiente de esa corrida completa hasta que pase.

**Vigente por CT-09** (aprobado, P7-24 a)): es la única excepción de ADR-10 y de 04 §14.1 al despliegue desde el job de `main`.

**No verificado aquí:**
- Docker Desktop y Testcontainers en Windows;
- la CLI de Vercel con un token de vencimiento corto.

El ensayo es la primera comprobación.

---

## 32. Disparadores pendientes y minutos

**[CH-46]** Los umbrales de 2.000, 1.700 y 1.600 de §32.2 y la protección de la reserva de §32.3 quedan sin efecto mientras el repositorio sea público; la prueba PRU-SEG-OPER-002 comprueba que, con cualquier uso, no hay recortes ni aviso, y que `respaldo.yml` y `restauracion.yml` no leen el modo. Si el repositorio vuelve a ser privado, se reabre con un CH. La consecuencia de seguridad está en §32.4.

### 32.1 P7-12: cuándo se pasa al respaldo b)

- **Qué prueba lo dispara:**
  - el control **C4** (`prisma migrate diff --from-config-datasource --to-schema schema.prisma --exit-code`) en el job `integracion`, sobre la plantilla, en la **primera corrida de CI** de la Fase 8 que tenga `g_instantes_ahora`;
  - y **H-05** en la prueba de humo.
- **Cómo se nota:** C4 sale con código 2 y el diff contiene `ALTER TABLE … ALTER COLUMN "<columna>" SET DEFAULT …` sobre alguna de las 9 columnas de CT-02, aunque la migración ya esté aplicada. Prisma no puede representar `dbgenerated("finn.ahora()")` de forma estable. El job queda rojo con el diff en el informe, y `tools/db/c4-explicar.mjs` agrega la línea "P7-12: aplicar el respaldo b)".
- **Qué hace el agente, sin volver a preguntar:**
  1. vuelve esas columnas a `@default(now())` en `schema.prisma`, con una migración generada;
  2. agrega `ahoraDb()` en `@finn/db`, que escribe `finn.ahora()` explícitamente en cada inserción de esas 9 columnas;
  3. agrega la regla de lint **L21**: ninguna inserción en esas tablas sin la columna;
  4. cambia la parte 3 de R15: esas 9 columnas quedan exceptuadas del "ningún `DEFAULT` con reloj directo";
  5. agrega PRU-INT-RELOJ-010: con el reloj simulado, cada inserción en esas tablas deja el instante simulado.
- **Registro:** una línea en `eventos_sistema` y una nota en el PR. Es la alternativa ya aprobada, no un cambio de diseño.

### 32.2 Minutos: recalibración y recorte permanente

- **Desde el inicio de la Fase 8, con el primer escalón ya activo (DP-33).**
  - **M5** queda activo desde el primer workflow: `rapido` e `integracion` se fusionan en un solo job cuando corren los dos. Reemplaza la condición de activación de M5 en la tabla de 6.4.
  - El job fusionado llama a `pnpm ci:rapido` y después a `pnpm ci:integracion`, los mismos scripts de §31.5. Los informes y los nombres de los checks no cambian: el job publica los dos resultados por separado (`rapido` e `integracion`), así que la matriz y `pr:mergear` no se enteran de la fusión.
- **Modelo con M5 activo.** 1.894 − (60 a 90) ≈ **1.804 a 1.834** minutos al mes, un margen del 8 al 10 % sobre 2.000.
- **Medición.** El primer mes de la Fase 8 se mide con `tools/ci/minutos.ts`, la proyección de M4, por job.
- **Aflojar M5.**
  - Se separan de nuevo los jobs **solo si el primer mes medido queda por debajo de 1.600**.
  - `minutos.ts` informa también la proyección sin M5 (medido + 60 a 90), para que la decisión se vea con su efecto.
  - Si se afloja, se registra como enmienda de este documento.
- **Si el mes medido pasa de 1.700**, con M5 activo, se agregan los escalones siguientes, que nunca tocan `respaldo` ni `restauracion` (§32.3), en este orden, hasta que la proyección quede en 1.600 o menos:
  1. `e2e` de PR **una sola vez por PR**, al pasar a listo (≈ −100);
  2. nocturno **2 noches** por semana (≈ −85).

  Cada escalón se registra en este documento como enmienda, no como M4 activándose cada mes (P7-14).
- **M4** queda solo como freno de emergencia dentro de un mes, y tampoco toca `respaldo` ni `restauracion` (§32.3).
- **Si aun así se agotan los minutos**, se detienen todos los workflows hasta el mes siguiente: `desplegar`, el respaldo diario con su control de dinero y la restauración.
  - Para desplegar queda §31.5.
  - Para el respaldo queda la exportación de FT-75 desde la app, que el usuario hace a mano una vez por día mientras dure.
- **Costos agregados en las partes C y D**, ya contados en el modelo:
  - job `cierre`: ≈ +15 min al mes;
  - control de dinero diario: ≈ +30;
  - restauración semanal durante 8 semanas: ≈ +15 en esos dos meses.

  El modelo de 6.4 pasa de 1.834 a unos 1.894 minutos sin recortes, y a unos 1.804 a 1.834 con M5.

### 32.3 Reserva fija: respaldo y restauración (DP-36)

`respaldo.yml` y `restauracion.yml` **nunca se recortan**: ni M4, ni M5, ni los escalones del recorte permanente los tocan.

**La reserva dentro del modelo:**

| Workflow | Cuota del mes |
|---|---|
| `respaldo` (30 corridas) | 60 (ADR-22, tabla de 6.4) |
| `restauracion` mensual | 5 |
| **Reserva base** | **65** |
| Control de dinero (§31.1), dentro del job `respaldo` | ≈ 30 |
| Restauración semanal de la transición (CT-09), solo en los dos meses de las 8 semanas | ≈ 15 |
| **Reserva total** | **≈ 95**, y **≈ 110** durante la transición |

- **Precisión sobre lo que pediste ("unos 65 minutos al mes más la restauración semanal").** El control de dinero diario corre dentro del job `respaldo`, así que esos ≈ 30 minutos son parte de lo que no se recorta. La reserva que protege `minutos.ts` es la total: 95, o 110 en la transición. Los 65 son la base de ADR-22.
- **Cómo se protege.** GitHub no prioriza unos workflows sobre otros: la reserva solo se protege recortando los demás a tiempo.
  - En cada corrida, `minutos.ts` calcula la **reserva pendiente del mes**: corridas de `respaldo` que faltan × 3 + restauraciones que faltan × 5.
  - La compara con los minutos que quedan (2.000 − usados).
  - Si **quedan menos que la reserva pendiente más la proyección del resto del mes**, M4 se activa, aunque la proyección total no pase de 1.700.
- **Orden de recorte cuando la reserva está amenazada**, primero `e2e` y el nocturno:
  1. `e2e` de PR una sola vez por PR, al pasar a listo;
  2. nocturno 1 vez por semana;
  3. si con eso sigue amenazada, `e2e` de PR y el nocturno se suspenden hasta fin de mes. `e2e` en `main` sigue, porque es requisito de `desplegar`.

  `rapido`, `integracion` y `desplegar` no se recortan solos. Si aun así la reserva sigue amenazada, `rapido` muestra el aviso "La reserva del respaldo está en riesgo: {k} minutos" en cada PR, y el usuario decide.
- **Prueba.** PRU-SEG-OPER-002, en `rapido`, con datos fijos de `minutos.fixture.json`:
  - con la reserva amenazada, M4 se activa y la lista de recortes nunca incluye `respaldo` ni `restauracion`;
  - los workflows `respaldo.yml` y `restauracion.yml` no leen el modo de M4: la prueba revisa que su YAML no tenga la condición `if:` de ahorro.

### 32.4 Repositorio público: logs y artefactos **[CH-46]**

Por ser público, los logs y los artefactos de Actions son visibles para cualquiera. **Ningún job puede escribir datos reales en ellos**: ni en la salida, ni en `test-results`, ni en `apps/web/test-results`, que son lo único que se publica. Los workflows no usan `pull_request_target`. Los respaldos ya van cifrados a R2 (ADR-22) y no cambian.

---

## 33. Riesgos de salida

| # | Riesgo | Prob. | Impacto | Mitigación o aceptación |
|---|---|---|---|---|
| RS7-01 | Testcontainers y la pila local de Supabase no se probaron (sin Docker Hub aquí) | Media | Medio | Imágenes desde `public.ecr.aws`; la primera corrida de CI de la Fase 8 las mide; si fallan, se corrige el workflow antes de la primera feature |
| RS7-02 | PostgreSQL 17 no se probó (todo corrió en 16.15) | Baja | Medio | `PG_MAYOR` en un solo lugar; H-01 fija la versión real; las funciones usadas existen en 16 y 17 |
| RS7-03 | C4 con `dbgenerated("finn.ahora()")` (P7-12) | Media | Bajo | Respaldo b) automático (§32.1) |
| RS7-04 | Supavisor real distinto de PgBouncer | Baja | Alto | H-04 y H-06; CT-06 quita el caso de POOL-04 aunque el pooler difiera |
| RS7-05 | iOS, Safari en iPhone y VoiceOver sin probar | — | Medio | **Aceptado** (P7-9); WebKit parcial en el nocturno |
| RS7-06 | Las muestras de SP-01 tardan y bloquean la puerta | Media | Alto | RS-03 de 04: la Fase 8 decide si desactiva F-1 a F-3; la puerta no se abre sin SP-01 (P7-8) |
| RS7-07 | **[CH-46]** Sin efecto mientras el repositorio sea público. El margen de minutos es del 8 al 10 % con M5 activo | Media | Medio | M5 activo desde el inicio y los escalones siguientes con su orden fijado (§32.2). Al pasar los 2.000 minutos se detienen los workflows, sin costo, pero también `desplegar`, el respaldo y el control de dinero. La reserva fija (§32.3) hace que se recorten antes `e2e` y el nocturno; si aun así se agotan, quedan §31.5 y la exportación manual de FT-75 |
| RS7-08 | La firma SSH desde Windows no funciona en la práctica | Media | Medio | Se avisa antes de buscar otra alternativa (P7-20); mientras tanto, la puerta queda cerrada por M16 y M17, sin un camino débil |
| RS7-09 | Un agente "arregla" una prueba roja cambiando la expectativa en lugar del código | Media | Alto | Los números esperados salen de documentos y semillas (12.1, DP-27); `pr:mergear` lista las pruebas cuyo título o archivo de datos cambió, para revisarlas; los mutantes del nocturno detectan pruebas que dejaron de proteger (19.4) |
| RS7-10 | El motor real difiere del núcleo y del motor mínimo de los prototipos | Media | Medio | El diferencial con el oráculo (P7-11) y los 50 escenarios en `ESC@motor` e `int`; A.7 y los recorridos con su semilla |
| RS7-11 | Los scripts de la Fase 5 (`trazabilidad.py`, `cobertura.py`) fallaban sobre 05 enmendado por la Fase 6 (hallazgo del cierre) | — | — | **Resuelto con CT-08** (P7-23 b)): los dos pasan (V7-19) |
| RS7-12 | Un error de dinero en las primeras semanas | Baja | Alto | §31 |
| RS7-13 | El despliegue de emergencia se usa como atajo, o un agente de la Fase 8 en la PC del usuario despliega sin CI | Baja | Alto | Disparador estricto y registro doble (§31.5); token de Vercel limitado al proyecto, de vencimiento corto, creado en el momento y revocado; nunca `vercel login`; commit firmado por el usuario |
| RS7-14 | Docker Desktop o la CLI de Vercel no funcionan en Windows cuando haga falta | Media | Alto | El ensayo de §31.5 es condición de la puerta (§30, condición 6): se descubre antes de una emergencia. Mientras tanto queda `vercel rollback`, que no depende de la PC |

---

## 34. CT consolidados y su aplicación

| CT | Qué cambia | Documentos | Estado |
|---|---|---|---|
| CT-01 | Reloj de prueba con `FINN_RELOJ_ARCHIVO`, lista de permitidos y barrera 1b | 02 ADR-19; 04 §4.2, §8.2, §13.1.4, §14.1; 05 §14.1 | **Aplicado [F7]** |
| CT-02 | `finn.ahora()` y `finn.instante()`; 9 `DEFAULT`; R15; L20 | 03 (Enmiendas: §3.17–§3.28, §4.1, §10.1, §10.3, §11.6); 04 §4.2, §8.2, §8.6, §10.1, §10.2, §13.1, §13.6 | **Aplicado [F7]** |
| CT-03 | Android y NVDA en lugar de iPhone y VoiceOver; resultados del lector registrados por el usuario | 06 CA-78.15, CA-70.7; 05 §11.10 | **Aplicado [F7]** |
| CT-04 | Nivel de componentes con el modo navegador de Vitest | 02 ADR-19; 05 §14.1 | **Aplicado [F7]** |
| CT-05 | ADR-01: activos de prueba en otro lenguaje fuera de `apps/` y `packages/` | 02 ADR-01 | **Aplicado [F7]** |
| CT-06 | Marca local de la transacción en el bloqueo (en lugar de `REVOKE`) | 03 (Enmiendas: §4.1, §10.1, §11.6); 04 §4.2 | **Aplicado [F7]** |
| CT-07 | A.7 corregido como semilla ejecutada por el motor | 05 A.7; 06 §3.5.12, §4.2; 06-identidad-visual §2.9, §6 | **Aplicado [F7]** |
| CT-08 | Fila de `/presupuesto/estructura/plantilla` en 05 §2.3, que CF-08 citaba y faltaba; tablas 15.1 y 15.2 y su resultado regenerados; `trazabilidad.py` y `cobertura.py` de la Fase 5 actualizados para leer la ruta aunque la celda lleve una marca **[Fn]** y para conocer OP-53 y `verificar_saldo` (P7-23 b)) | 05 §2.3, §15 | **Aplicado [F7]** |
| CT-09 | **ADR-10:** el despliegue de emergencia desde la PC (PRU-MAN-OPER-002) como única excepción al despliegue desde GitHub Actions, sin migraciones. **ADR-22:** restauración semanal durante las primeras 8 semanas. **04 §14.1:** la misma excepción; **04 §15.2:** evento `despliegue_emergencia`, que inserta el usuario | 02 (Enmiendas: ADR-10, ADR-22); 04 §14.1, §15.2 | **Aplicado [F7]** (P7-24 a)) |

**Cómo se aplicaron (`aplicar_f7.py`):**
- **00 y 01** no cambian: ningún CT los toca.
- **02 y 03** ("este documento no se modifica"): solo una línea nueva al final de "Enmiendas posteriores", como en las fases 4 a 6.
- **04, 05, 06 y 06-identidad-visual:**
  - una nota **[F7]** en cada sección afectada (9 en 04, 3 en 05, 4 en 06 y 2 en identidad visual). CT-08 agrega en 05 la fila de §2.3, con su marca en la columna de notas, y una nota al inicio de §15; CT-09 agrega 2 notas en 04 (11 en total);
  - una línea en "Enmiendas posteriores";
  - 06 e identidad visual no tenían esa sección y la estrenan.
- Cada ancla debe aparecer exactamente una vez; si no, el script no escribe nada.

---

## 35. Verificación de la Parte D y del cierre

| # | Qué se verificó | Resultado | No verificado |
|---|---|---|---|
| V7-16 | A.7 corregido (CT-07) y V6-01 sobre la semilla completa | 86 números comparados: 68 iguales, 18 cambian (§28.2), **0 citados por los CA cambian**. Identidad de saldo comprobada en cada cálculo, también en la semilla de 4.2 (antes del paso 3: LPA $312.40, Supermercado $252.15 gastado y $97.85 disponible, Visa Oro $607.18 de deuda, $588.43 reservado y $18.75 por reservar) | El motor real (Fase 8) |
| V7-17 | Control de firmas por fila (`git blame`) y por commit, con una sola clave | 4 de 4 casos (§29.1) | Windows (§29.2) |
| V7-18 | Enmiendas de la Fase 7 (`enmiendas_f7.py`) y scripts de las fases anteriores sobre los documentos enmendados | E1 a E6 **pasan**: cada CT está en su documento; última sección con la línea de la Fase 7; 00 y 01 idénticos; 02 y 03 solo cambian al final; marcas [F7] en el texto de 04, 05, 06 e identidad; tablas intactas; los **492 CA de 06 idénticos**. Control negativo: detecta una marca quitada y un cambio en 03 antes del final | — |
| V7-19 | CT-08 y repetición de todos los scripts de las fases anteriores sobre los documentos enmendados; CT-09 en seco | Los 7 scripts **pasan**, también los dos de la Fase 5. Control: los scripts actualizados sobre el 05 sin CT-08 fallan (falta la fila de la plantilla y las tablas no coinciden). `enmiendas_f7.py` con CT-08: E1 a E6 pasan, con E5 exceptuando solo las tablas que CT-08 cambia a propósito; el control negativo falla como debe. CT-09 en una carpeta temporal: E1 a E6 y los 7 scripts pasan. Matriz: mismos conteos; control de la matriz 21 de 21 mutaciones detectadas, con el área `OPER` | Windows (§29.2, §31.5) |
| V7-20 | CT-09 aplicado sobre los documentos enmendados; repetición de todos los scripts y del control de enmiendas | `aplicar_f7.py`: 11 notas [F7] en 04 y una línea de CT-09 en las enmiendas de 02 y de 04. `enmiendas_f7.py`: E1 a E6 **pasan**, con CT-09 exigido en 02 y 04; el control negativo falla como debe. Los 7 scripts de las fases 4 a 6 **pasan**, con las mismas salidas que en V7-19. Matriz: mismos conteos; control, 21 de 21 | Windows (§29.2, §31.5) |

**Scripts de las fases anteriores, antes y después de enmendar (V7-18 a V7-20):**

| Script | Antes | Después |
|---|---|---|
| 04 `t17.py` (T1 a T7) | Pasa: 50 escenarios, 24 avisos, 62 operaciones, 44 consultas, 77 rechazos | **Igual**. **[CH-27]** Desde CH-27, 78 rechazos (`devolucion_por_cobrar_otra_cuenta`); **[CH-45]** desde CH-45, 79 (`cuota_sin_coincidencia`); la prueba de `tools/ci/docs.test.ts` espera la salida vigente |
| 05 `trazabilidad.py --comprobar` | Falla: las tablas 15.1 y 15.2 de 05 no coinciden con las generadas | **Pasa** con CT-08: 18/18 consultas, 61/62 operaciones con pantalla (sin pantalla: OP-35, el webhook), 51 flujos, 0 carpetas repetidas |
| 05 `cobertura.py` | Falla: no conoce las rutas de CF-01 y CF-08 ni la variante `verificar_saldo` | **Pasa** con CT-08: T1 a T9; 74 rutas en el árbol, 78 filas en el mapa, 18/18 variantes, 24/24 avisos |
| 06 `trazabilidad.py` (T1 a T8) | Pasa: 77 fichas, 62 operaciones, 19 consultas, 15 reportes, 15 formularios, 78 rutas, 50 ESC, 24 AV, 25 CF, 45 pasos | **Pasa**, igual salvo 79 rutas: la de la plantilla ya está en el mapa (CT-08) |
| 06 `revisar_fichas.py` | Pasa | **Igual** |
| 06 `prueba_reportes.py` | Pasa (20.000 + 5.000 + 5.000 casos) | **Igual** |
| 06 `recorridos.py` | Pasa | **Igual** |
| Matriz de la Fase 7 sobre los documentos enmendados | — | 77 fichas (31 [I], 38 [M], 8 [P], 1 diferida); **492 CA** (233 / 232 / 24 / 3 diferidos); **50 ESC, 24 AV, 28 invariantes, 34 CB, 6 recorridos, 92 verificaciones previas** |

Las salidas completas están en `salidas/v7_16` a `v7_20`.

---

## 36. Decisiones, supuestos y preguntas de la Parte D

### 36.1 Decisiones

| ID | Decisión | Justificación | Alternativas descartadas |
|---|---|---|---|
| DP-27 | Todo ejemplo numérico sale de una semilla ejecutada por el motor, con su prueba (P7-19, punto 5) | Es lo que habría detectado A.7 en la Fase 6 | Revisar los números a mano (fue lo que falló) |
| DP-28 | Definición de terminado de 7 condiciones (§27) | Lo verificable lo verifica la matriz; el resto queda en `pr:mergear` | Una lista de comprobación libre |
| DP-29 | Control de dinero diario en `respaldo.yml`, con el rol de solo lectura | Detecta un error de dinero en menos de 24 horas sin agregar código a la app ni CT | Comprobar invariantes en cada petición de la app (cambiaría 04); solo la restauración mensual (demasiado tarde) |
| DP-30 | Corrección de hechos solo por operaciones de `@finn/aplicacion`, con ejecución en seco y respaldo previo | Las mismas reglas que protegen los números protegen la corrección | `UPDATE` directo como `finn_migraciones` |
| DP-31 | Solo migraciones de expansión durante 8 semanas | Volver atrás el código nunca exige volver atrás la base | Contraer al terminar cada feature |
| DP-32 | Orden fijo del recorte permanente de minutos (§32.2) | Si hace falta, se aplica sin discutirlo de nuevo | M4 todos los meses (descartado en P7-14) |
| DP-33 | M5 activo desde el inicio de la Fase 8; se afloja solo si el primer mes medido queda por debajo de 1.600 (revisión de la Parte D) | Lleva el margen del 5 % al 8 o 10 % sin reducir cobertura: solo ahorra un arranque de job. El job publica los dos resultados por separado, así que la matriz no cambia | Esperar al primer mes (con 5 % de margen, un mes con más PR agota los minutos); empezar con el escalón de E2E (reduce cobertura por PR) |
| DP-34 | Despliegue de emergencia con los mismos scripts `pnpm ci:<job>` que usan los workflows, token de Vercel limitado al proyecto y de vencimiento corto, y sin migraciones (§31.5) | "Las mismas suites" queda garantizado por construcción y no por disciplina. El token corto y la ausencia de `vercel login` impiden que un agente en la PC herede la capacidad de desplegar. Sin migraciones se respeta la única regla de ADR-10 que protege la base | Runner propio en la PC (descartado por ti, M6); `vercel login` permanente; permitir migraciones desde la PC (pondría credenciales de `finn_migraciones` en la PC) |
| DP-36 | Reserva fija para `respaldo` y `restauracion` (§32.3), protegida recortando primero `e2e` y el nocturno (revisión de la Parte D) | Perder el respaldo justo en un mes caro deja sin vuelta atrás de datos (§31.4). La reserva la calcula `minutos.ts` con lo que falta del mes y no con un umbral fijo | Un umbral fijo de 1.700 sin reserva (no ve que el mes termina); recortar también `rapido` e `integracion` en automático (sin ellos no hay PR seguro) |
| DP-35 | Área `OPER` para firmas, despliegue de emergencia y retiro de la 1.0 | Los identificadores tenían un código de nivel en el lugar del área, y la matriz los rechazaría (M8) | Reusar `ESQ` o `RESP` (no describen estas pruebas) |

### 36.2 Supuestos

1. El respaldo diario puede ejecutar el motor (Node 24 y `@finn/dominio`) en su mismo job: el runner ya instala el repositorio para el volcado.
2. La restauración semanal de las primeras 8 semanas usa el mismo workflow mensual, con un `schedule` temporal que se quita al terminar ese plazo (CT-09, ADR-22).
3. GitHub envía la notificación de una ejecución programada fallida a quien creó el workflow, o a quien cambió su `cron` por última vez. Los agentes usan la cuenta de GitHub del usuario, así que el destinatario es él. Si las notificaciones de Actions estuvieran apagadas en la cuenta, el usuario las activa.
4. `vercel deploy --prod` con `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` como variables de entorno despliega sin `vercel login`, como lo hace hoy el job `desplegar`.

### 36.3 Preguntas

**P7-22 y P7-23:** resueltas en la revisión (0.10).

**P7-24:** resuelta en la revisión: a), CT-09 aplicado (0.10, §34).

No quedan preguntas abiertas de la Fase 7.
---

## Fuentes consultadas

**Parte A**
- GitHub, facturación de Actions (2.000 minutos, 500 MB de artefactos y 10 GB de caché en el plan gratuito; runners propios sin costo): https://docs.github.com/en/billing/concepts/product-billing/github-actions
- GitHub, disponibilidad de ramas protegidas por plan: https://docs.github.com/en/enterprise-server@3.21/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

**Ajustes de la Parte A y Parte B**
- GitHub, API de uso de facturación ("Get billing usage report for a user": tokens de grano fino con el permiso "Plan" de usuario, lectura): https://docs.github.com/en/rest/billing/usage
- GitHub, permisos del `GITHUB_TOKEN` (sin permiso de variables): https://docs.github.com/en/enterprise-server@3.13/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
- GitHub, retiro de los endpoints de uso de workflows y de ejecuciones: https://github.blog/changelog/2025-02-02-actions-get-workflow-usage-and-get-workflow-run-usage-endpoints-closing-down
- Vercel, variables de entorno del sistema (`VERCEL_ENV`: production, preview o development; disponibles si está activado el acceso a las variables del sistema): https://vercel.com/docs/environment-variables/system-environment-variables

**Parte D**
- GitHub, notificaciones de workflows programados (correo a quien modificó por última vez el `cron`): https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs
- Vercel, tokens de acceso (alcance por proyecto y vencimiento elegido al crearlos): https://vercel.com/docs/accounts/access-tokens
- Vercel, volver atrás un despliegue de producción (`vercel rollback`; en Hobby, solo al despliegue anterior): https://vercel.com/docs/instant-rollback
- Git, firma de commits con SSH (`gpg.format ssh`, `gpg.ssh.allowedSignersFile`): https://git-scm.com/docs/git-config#Documentation/git-config.txt-gpgformat

---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle; en el texto, las marcas **[F8]** señalan dónde rige.

- **CH-01 a CH-06 y CH-08** (Fase 8, aprobados en las revisiones de `08-tareas.md`, aplicados al cerrarla el 23 de octubre de 2026). CH-01: rutas de operaciones y consultas por la estructura de 04 §1.2 (13.6, 16.2). CH-02: `main` en rojo avisa con el correo de GitHub y el uso por job queda como artefacto (6.3, 6.5). CH-03: cobertura verificable de SP-01 en la puerta (23, 30). CH-04: PRU-MAN-CTA-002 en la lista manual (22.1). CH-05: identificadores completos de la suite del pooler (5.3). CH-06: las acciones de notificación sin firma (BE-54) y V-26 a PRU-SEG-CONC-001 (18, 19.1, 20.1). CH-08: CA pendientes de punta a punta, M18 y su condición en el terminado y en la puerta (13.2, 13.3, 27, 30). Texto de cada cambio en `08-tareas.md` §7.
