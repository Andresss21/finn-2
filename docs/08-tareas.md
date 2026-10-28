# Finn 2.0 — Tareas de implementación (08-tareas.md)

**Fase:** 8. **Estado:** cerrada (23 de octubre de 2026). **Parte A** (criterios, hitos, fundación y tareas del usuario) **aprobada con ajustes**, aplicados y marcados **[A2]**. **Parte B** (base de datos, dominio y aplicación, §11 a §18) **aprobada con ajustes**, aplicados y marcados **[B2]**. **Parte C** (web base, operación y fichas [I], §19 a §25) **aprobada**, con las respuestas marcadas **[C2]**. **Parte D** (fichas [M] y [P], recorridos, puerta, plantilla del encargo y cierre, §26 a §36) **aprobada**, con los ajustes del cierre marcados **[F8]** y la ejecución con orquestador (§37). CH-01 a CH-08 **aplicados [F8]** en 04, 06 y 07 (§36.2). **Fase 8 cerrada.** Queda pendiente solo la comprobación de los anexos reales (V8-05, §36.3), que es condición de TA-001.
**Verificación:** V8-01 a V8-06 (§9, §17, §24, §35 y §36), con los archivos en `08-tareas-verificacion.zip`.

---

## 0. Propósito, alcance y convenciones

### 0.1 Propósito

Este documento convierte lo aprobado en 00 a 07 en tareas que un agente de programación ejecuta de a una, en orden, hasta abrir la puerta de salida de 07 §30. Cada tarea trae lo que el agente necesita sin leer los documentos completos: qué construir, qué secciones leer, qué archivos tocar, qué pruebas escribir primero, qué cubre, con qué comandos se verifica y cuándo está terminada.

### 0.2 Alcance

- **Incluye:** criterios de las tareas, hitos, tareas de infraestructura, base de datos, dominio, aplicación, web y features, tareas del usuario, plantilla del encargo, paralelismo y verificación del plan.
- **No incluye:** el código.
- **No modifica** 00 a 07. Los huecos y contradicciones se proponen como **CH-nn**, con su impacto en cada documento, y se aplican al cerrar la fase con la marca **[F8]** y su línea en "Enmiendas posteriores".

### 0.3 Precedencia

1. `00-decisiones.md` > `01-dominio.md` > `02-tecnologias.md` > `03-base-de-datos.md` > `04-backend.md` > `05-frontend.md` > `06-features.md` > `07-pruebas.md`, cada uno con sus enmiendas; después, `06-identidad-visual.md`.
2. Este documento manda sobre el orden y la forma de las tareas. No manda sobre ninguna regla de los anteriores.
3. Una contradicción no se resuelve aquí: se plantea como P8-n o CH-nn.

### 0.4 Convenciones

| Marca | Significado |
|---|---|
| **TA-nnn** | Tarea de un agente. Número estable; una tarea retirada conserva su número con la marca "retirada" |
| **TU-nn** | Tarea del usuario (solo vos podés hacerla) |
| **HT-n** | Hito (H-nn queda para la prueba de humo de 04 §17) |
| **DT-nn** | Decisión de esta fase (registro en 0.6, 0.8, 0.10 y 0.12) |
| **CH-nn** | Cambio propuesto a un documento aprobado (registro en §7) |
| **V8-nn** | Verificación ejecutada en esta fase (§9) |
| **P8-n** | Pregunta de esta fase |
| PRU-…, M1–M17, DP-nn | Referencias a `07-pruebas.md` |
| CA-nn.m, FT-nn, CF-nn | Referencias a `06-features.md` |
| BE-nn, OP-nn, OPT-nn, SP-nn | Referencias a `04-backend.md` |
| FE-nn, L1–L19 | Referencias a `05-frontend.md` (L20, de CT-02) |
| DB-nn, C1–C6, R1–R15 | Referencias a `03-base-de-datos.md` |

Textos en español neutro; voseo en lo que se le habla al usuario.

### 0.5 Respuestas del Paso 1 incorporadas

| # | Respuesta | Dónde se aplica |
|---|---|---|
| Repositorio | Repositorio nuevo y privado, separado del de la 1.0. TU para crearlo y TU para desactivar los workflows de la 1.0 (los 2.000 minutos son por cuenta) | TU-01, TU-02; §8.1 (revisión de dependencias con la 1.0) |
| P8-1 | a). Zips de las fases 3 a 7, `finn-entrega.zip` y el zip de la marca, copiados al repositorio | TU-04, TA-002. **[A2]** Los zips todavía no llegaron (§8.2, P8-15) |
| P8-2 | a). Windows nativo con Git Bash y Docker Desktop con WSL2; Docker ya instalado | TU-03 (verificación), DT-10 |
| P8-3 | a). Límites de tamaño propuestos | DT-01 |
| P8-4 | a). Push solo con las suites locales afectadas en verde, 2 o menos por PR; calcular los dos supuestos | DT-07, V8-02 |
| P8-5 | b). Dos agentes, como máximo tres; la E2E local de a uno | DT-10, campo `paralelo` de cada tarea |
| P8-6 | SP-01 temprano y parcial: SMS del BAC y CSV. Formatos sin muestras inactivos; confirmar que no abre la puerta en falso; TU para las muestras de BAC y para las de Agrícola | §6, DT-12, CH-03, TU-13, TU-14 |
| P8-7 | a). Dos hitos: infraestructura real verificada y primer despliegue | HT-4, HT-5 |
| P8-8 | a). Seguir 04 §1.2, CH a 07 §13.6 | CH-01 |
| P8-9 | b). CH a 07: `main` en rojo avisa con el correo de GitHub; el uso por job queda como artefacto | CH-02 |
| P8-10 | a). `plan/tareas.json`, controlado por el script | DT-04 |
| P8-11 | b). El agente mergea con `pr:mergear` en verde, salvo revisión obligatoria (migraciones, motor, seguridad, reloj, CI y workflows, `CLAUDE.md`) | DT-05 |
| Supuestos | Aprobados, incluido HT-1 | §2 y todo el documento |

### 0.6 Registro de decisiones de la Parte A

| ID | Decisión | Sección |
|---|---|---|
| DT-01 | Límite de tamaño de una tarea y cómo se mide | 1.1 |
| DT-02 | Numeración por rangos y orden explícito | 1.2 |
| DT-03 | Ficha de tarea con un bloque legible por el script | 1.3 |
| DT-04 | Estado de las tareas en `plan/tareas.json`, sin conflictos entre worktrees | 1.4 |
| DT-05 | Revisión obligatoria | 1.5 |
| DT-06 | Terminado de una tarea | 1.6 |
| DT-07 | Regla de push y suites locales | 1.7 |
| DT-08 | Hitos HT-0 a HT-9 | §2 |
| DT-09 | Contenido de `CLAUDE.md` | §4 |
| DT-10 | Windows, worktrees y paralelismo | 1.8 |
| DT-11 | C3 a C6 y R1 a R15 van con las migraciones (Parte B) | 3.1 |
| DT-12 | SP-01 parcial: formato del BAC reescrito, F-2 y F-3 inactivos | §6 |

### 0.7 Respuestas de la revisión de la Parte A **[A2]**

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P8-12 | a). Zips y `.md` de 01 a 07 como archivos; repetir V8-01 y V8-03 contra los documentos en disco | Los `.md` están en disco y V8-01 y V8-03 corren contra ellos (§9, §17). **Los zips no llegaron** (§8.2, P8-15) |
| P8-13 | Sin Cuscatlán (opción a); Banco Agrícola sí, y la puerta espera sus SMS (opción b); CSV solo del BAC; TU-14 comprueba si Agrícola ofrece CSV y, si no, exclusión firmada y FT-44; CH-03 aprobado | CH-03, TU-14, §6 |
| P8-14 | No aplica; TU-02 pasa a verificación; TU-19 exporta los datos de la 1.0 antes de apagarla | TU-02, TU-19 |
| Credenciales | Token de grano fino solo para `finn-2` en la configuración local de Claude Code; tu `gh` completo aparte o la web; Vercel sin sesión guardada y con tokens de vida corta; prueba de humo en una terminal tuya; permisos de Claude Code como barrera técnica con su prueba | TU-01, TU-07, TU-09, TU-12, TA-002, §4, §4.1, DT-13 |
| TU-03 | Memoria de WSL2 con una regla (la mitad de la RAM, mínimo 6 GB) | TU-03 |
| POOL | Identificadores completos para POOL-01 a POOL-05 | CH-05, TA-059 |
| CH-01, CH-02, CH-04 | Aprobados con el texto propuesto | §7 |
| Resto | Aprobado: DT-01 a DT-12, HT-0 a HT-9, TA-001 a TA-013, `CLAUDE.md` (con `settings.json`) y las TU | — |

### 0.8 Registro de decisiones de la Parte B

| ID | Decisión | Sección |
|---|---|---|
| DT-13 | Permisos de Claude Code como segunda barrera (revisión de la Parte A) | §4.1, §11.1 |
| DT-14 | Clase "portado" en la medida del tamaño (revisión de la Parte A) | §11.2 |
| DT-15 | Excepción de migraciones para TA-051 | §11.3 |
| DT-16 | Dos olas para el dominio y la aplicación | §11.4 |
| DT-17 | Identificadores de las pruebas nuevas desde 101 | §11.5 |
| DT-18 | Los CA son de las tareas de sus fichas | §11.6 |
| DT-19 | Route Handlers y autenticación web en la Parte C | §11.7 |

### 0.9 Respuestas de la revisión de la Parte B **[B2]**

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P8-15 | Los zips se recuperan y llegan en una carpeta propia. Mientras tanto, las tareas que dependen de los anexos quedan como "portar desde anexos"; la comprobación de que cada archivo citado existe corre cuando llegue la carpeta; ningún archivo se reconstruye desde los `.md` sin avisarte. Si el zip de la marca no aparece: qué tareas de la Parte C dependen de él y qué alternativa hay | V8-05 (`anexos.ts`), §23.2, §23.3 |
| P8-16 | Seguir 04 (precedencia): acciones de notificación con `Origin`, `X-Finn-Accion` y AAL2, sin HMAC. CH-06 corrige 07 y la referencia a V-26 | CH-06 **aprobado**; TA-217 |
| P8-17 | a). B4 usa TA-200 a TA-229; TA-230 a TA-249 queda para partir tareas | §1.2 (DT-02), §20 |
| P8-18 | Dos olas, con una condición antes de usar plata real: HT-6 exige en verde las propiedades de los invariantes 1 a 5 y 26 a 28, el diferencial contra el oráculo, todos los ESC que tocan sus fichas en `@motor` e `@int` y los CB de esas fichas. Va al criterio de HT-6 y al verificador | DT-25, HT-6, E7-pruebas y E7-fichas (§24) |
| Revisión obligatoria | Definir qué revisás antes de "mergeá" para que tome minutos; línea "Qué mirar" en el informe; proponer categorías que pasen a revisión normal sin perder protección | §1.5, §1.6, §4 (informe), TA-014, DT-20 |
| Resto | Aprobado, incluida la excepción DT-15 de TA-051. CH-05 queda aprobado con los cinco identificadores | §7 |

### 0.10 Registro de decisiones de la Parte C

| ID | Decisión | Sección |
|---|---|---|
| DT-20 | Qué hace obligatoria una revisión: solo los archivos de producción de las áreas críticas (revisión de la Parte B) | §1.5, §19.1 |
| DT-21 | Las tareas de fichas no preasignan identificadores de pruebas nuevas | §19.2 |
| DT-22 | Candado de la E2E local en lugar de pares en `paralelo` | §19.3 |
| DT-23 | Dueña de una ruta: la tarea de la ficha que la construye | §19.4 |
| DT-24 | Recursos de marca provisionales mientras no llegue el zip de la marca (05 §10.11) | §19.5 |
| DT-25 | HT-6 exige las pruebas de dinero de sus fichas (P8-18) | §19.6 |
| DT-26 | Dependencias entre fichas: duras hacia fichas [I] anteriores, blandas en el resto | §19.7 |

### 0.11 Respuestas de la revisión de la Parte C **[C2]**

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P8-19.1 | Dependencia blanda aprobada, con CH a 06 (dependencia de construcción y de datos) y una regla: cada CA [I] probado con datos sembrados porque su productora es [M] o [P] queda "pendiente de punta a punta" con la ficha que lo completa; esa ficha no pasa a `terminada` sin la E2E; HT-7 se alcanza con pendientes, HT-8 y HT-9 no (salvo [P]). Listar cuántos y de qué fichas | DT-27, TA-015, E12, CH-07, CH-08, §30 |
| P8-19.2 | Nada se reconstruye desde el `.md` ni se pide diseño nuevo. Bajás de nuevo `finn-entrega.zip` (trae `finn-marca.zip` adentro) y los zips de verificación de las fases 3 a 7 a una carpeta propia; cuando llegue, `anexos.ts` sobre los archivos reales y confirmar los 34 citados (con los 52 íconos y los tokens); si falta algo, avisar antes de buscar alternativa | §36.3 |
| Resto | Aprobado: las 25 tareas de web base, las 4 de operación, las 36 de fichas [I], el reparto de hitos y DT-20 | — |

### 0.12 Registro de decisiones de la Parte D

| ID | Decisión | Sección |
|---|---|---|
| DT-27 | CA pendientes de punta a punta (P8-19.1) | §26.1 |
| DT-28 | Cómo se arman y ordenan B7 y B8: dependencias derivadas de 06 §6.2 y §6.3 | §26.2 |
| DT-29 | Plantilla del encargo generada desde la ficha | §26.3, §32 |
| DT-30 | Hitos encadenados (`hitos:`) | §26.4 |
| DT-31 | FT-49 bloqueada con tarea | §26.5 |

### 0.13 Respuestas de la revisión de la Parte D y registro del cierre **[F8]**

| # | Respuesta | Dónde se aplica |
|---|---|---|
| P8-20 | Corrección aceptada (TA-139 y TA-194 a la ola 1), con una regla del verificador que derive del escenario las operaciones que necesita y falle si su dueña va en una ola u orden posterior, con control negativo | E13 en `verificar.ts`, §36.1 (V8-01) |
| P8-19.1 | Tabla de §30.1 aprobada, con la extensión a las fichas [I] posteriores | §30 |
| P8-21 | Aplicar CH-01 a CH-08 con [F8] y su línea en "Enmiendas posteriores"; repetir los scripts de las fases 4 a 7 y la matriz de 07; guardar 08 en el proyecto | §36.2 |
| Anexos | Cerrar igual; TU-04 dice que TA-002 no empieza sin la carpeta y sin `anexos.ts` en verde sobre los archivos reales; §36 deja escrito lo pendiente | TU-04, §36.3 |
| Orquestador | Una sesión de Claude Code coordina subagentes, uno por tarea; reglas de aprobación, worktrees, modelo por tarea, contradicciones y mensaje inicial | §37, §4 (`CLAUDE.md`), DT-32 a DT-35 |
| Carpetas | `C:\finn\_entrada\` legible (documentos y zips); `C:\finn\_privado\` con las muestras sin anonimizar, negada | DT-36, TU-04, TU-13, §4.1 |
| Arranque | De dónde lee el plan el orquestador antes de TA-002, cómo arma los primeros encargos y cuándo pasa al modo normal; lista exacta de archivos de TU-04 | §37.8, TU-04 |

| ID | Decisión | Sección |
|---|---|---|
| DT-32 | Modelo por tipo de tarea | §37.5 |
| DT-33 | Aprobación de las tareas obligatorias solo con tu mensaje en la sesión, registrada por un hook | §37.3 |
| DT-34 | Worktrees de los subagentes de Claude Code en lugar de `git worktree add` | §37.4, §1.8 |
| DT-35 | Rol del orquestador | §37.2, §4 |
| DT-36 | Carpetas de entrada: `_entrada` legible y `_privado` negada | §37.7, §4.1 |

---

## 1. Criterios de las tareas

### 1.1 Tamaño de una tarea (DT-01, P8-3)

| Medida | Límite | Qué cuenta |
|---|---|---|
| Código de producción cambiado | **≤ 400 líneas** (agregadas + borradas) | Todo archivo que no es prueba, dato ni generado, en `apps/`, `packages/` y `tools/`; también YAML de workflows y SQL de migraciones |
| Archivos de producción tocados | **≤ 12** | Ídem |
| CA cubiertos | **≤ 10** | Los `CA-nn.m` del campo `cubre` |
| Migraciones nuevas | **≤ 1** | Carpetas nuevas en `packages/db/prisma/migrations/` |
| Total cambiado | **≤ 1.200 líneas** | Producción + pruebas + datos, sin generados |

**Clasificación de archivos** (la aplica `tools/plan/tamano.ts`, TA-010):

| Clase | Patrones |
|---|---|
| Prueba | `*.test.ts`, `*.prop.test.ts`, `*.ctr.test.ts`, `*.int.test.ts`, `*.rh.test.ts`, `*.cmp.test.tsx`, `*.e2e.ts`, `*.bench.ts`, `**/test/**`, `**/pruebas/**` (salvo `tools/pruebas/*.ts`, que es código), `tools/lint/controles/**` |
| Dato | `packages/dominio/escenarios/datos/**`, `**/__datos__/**`, `**/muestras/**`, `pruebas/*.json`, `pruebas/manuales.md`, `plan/tareas.json`, `docs/**`, `*.md` |
| Generado | `pnpm-lock.yaml`, `**/generado/**`, `packages/db/prisma/catalogo-esperado.txt`, `pruebas/inventario.json` |
| Producción | Todo lo demás |

**Dónde se controla.**
- **En el plan:** cada tarea declara su estimación (`tamano`). El script de verificación (§9) rechaza una estimación que supere un límite.
- **En el PR:** `pnpm pr:mergear` mide el diff real con `git diff --numstat origin/main...` y la clasificación de arriba. Si supera un límite, no mergea y pide partir la tarea (DT-02: la parte nueva recibe un número nuevo). Una excepción de tamaño se registra solo con `pr:mergear <n> --excepcion-tamano "<motivo>"`. Para una tarea **normal** que excede un límite en hasta un 30 %, la aplica el orquestador por la regla permanente del usuario; para una **obligatoria**, o un exceso mayor al 30 %, solo vale junto con `--aprobado` después de que el usuario la acepte en la sesión. El motivo y las medidas quedan en el commit de merge (`Excepción-tamaño: prod=607/400 — <motivo>`). Fuera de esto, se parte la tarea (DT-02). **[CH-15]**

**Justificación.**
- 400 líneas de producción es el tamaño a partir del cual una revisión deja de ver los errores, y cabe con holgura en una sesión de un agente junto con la lectura de las secciones citadas.
- Separar pruebas y datos del límite evita castigar justo lo que el plan quiere: los escenarios de 01 §8 como datos y las pruebas escritas primero.
- Una sola migración por tarea hace que dos worktrees nunca compitan por el orden de las carpetas (DT-10).
- 10 CA es el máximo que una ficha grande de 06 reparte por tarea sin que el PR mezcle pantallas.

**Alternativas descartadas.** Solo CA (una ficha de 3 CA puede ser una pantalla entera de 900 líneas); solo tiempo estimado (no se puede medir después); límite total sin separar pruebas (empuja a escribir menos pruebas).

### 1.2 Numeración y orden (DT-02)

| Rango | Bloque | Parte |
|---|---|---|
| TA-001 a TA-049 | B0 Fundación: monorepo, lint, matriz, CI | A |
| TA-050 a TA-099 | B1 Base de datos: bootstrap, migraciones, controles C3 a C6, R1 a R15, siembra, reloj simulado | B |
| TA-100 a TA-149 | B2 `@finn/dominio`: valores, motor, selectores, reportes, escenarios | B |
| TA-150 a TA-199 | B3 `@finn/db`, `@finn/aplicacion`, `@finn/sms`, `@finn/conciliacion` | B |
| TA-200 a TA-229 | B4 Web base: marco, navegación, componentes, tokens, service worker | C |
| TA-230 a TA-249 | **[B2]** Reservado: partes de tareas de B2, B3 o B4 que `pr:mergear` obligue a partir (P8-17) | B y C |
| TA-250 a TA-279 | B5 Operación: humo, despliegue, respaldo, restauración, control de dinero | B y C |
| TA-280 a TA-399 | B6 Features [I] | C |
| TA-400 a TA-499 | B7 Features [M] | D |
| TA-500 a TA-549 | B8 Features [P] y FT-49 (bloqueada) | D |

- El número identifica; **el campo `orden` decide la secuencia**. Así una tarea de operación (B5) puede ir entre dos de features sin renumerar.
- Si una tarea se parte después de aprobada, la primera parte conserva el número y la segunda recibe el siguiente libre del rango.
- *Alternativa descartada:* numerar en orden de ejecución (cualquier inserción obligaría a renumerar, y los números deben ser estables).

### 1.3 Ficha de tarea (DT-03)

Cada tarea tiene un encabezado `#### TA-nnn Título` y un bloque de datos que lee el script de verificación (§9) y, en el repositorio, `pnpm plan:verificar`:

````
```tarea
orden: 12
bloque: B0
hito: HT-0
depende: TA-005, TA-007
tu: TU-05
revision: obligatoria
paralelo: no | con TA-nnn | libre
tamano: prod=320 archivos=9 ca=0 migraciones=0 total=640
cubre: L20, BE-03a, DP-33
pru: PRU-SEG-OPER-001
compartido: CT-01 (motivo)
```
````

| Campo | Significado |
|---|---|
| `orden` | Posición en la secuencia; única |
| `depende` | Tareas que deben estar `terminada` en `main` antes de empezar |
| `tu` | Tareas del usuario que deben estar hechas antes de **mergear** (no de empezar) |
| `revision` | `obligatoria` o `normal` (DT-05) |
| `paralelo` | `libre`: puede correr junto a cualquier otra libre; `con TA-…`: lista de las que no puede compartir; `no`: corre sola |
| `tamano` | Estimación (DT-01) |
| `cubre` | Objetivos de los que la tarea es dueña: CA, OP, consultas, rutas, migraciones, CF, CT, reglas (L, C, R, M), decisiones con efecto en código (DP, BE, FE) |
| `pru` | Identificadores de 07 que la tarea crea. Una prueba nueva sin identificador en 07 recibe uno en la tarea con su área de 07 §2.2 |
| `compartido` | Objetivo cuyo dueño es otra tarea y que esta extiende, con el motivo |

Debajo del bloque, siempre en este orden: **Qué construir**, **Leer** (secciones exactas), **Archivos**, **Pruebas primero**, **Comandos**, **Terminada cuando**.

### 1.4 Estado de las tareas: `plan/tareas.json` (DT-04, P8-10)

```json
{
  "TA-001": { "estado": "terminada", "pr": 1 },

  "TA-002": { "estado": "en_curso", "rama": "ta-002-docs-instrucciones" },

  "TA-003": { "estado": "pendiente" }
}
```

- **Estados:** `pendiente`, `en_curso`, `terminada`, `bloqueada` (con `motivo`), `retirada`.
- **Una entrada por bloque separado por una línea en blanco.** Git une sin conflicto cambios en entradas que no son vecinas; dos worktrees que cambian TA-101 y TA-150 nunca chocan. La misma regla vale para `pruebas/features.json` (07 §13.4).
- **Quién lo escribe:** el agente, en su rama. Al empezar marca `en_curso`; en el último commit del PR, `terminada`.
- **Qué controla `pnpm plan:verificar`** (en `rapido`):
  - toda tarea `en_curso` o `terminada` tiene sus `depende` en `terminada` **en la rama base**;
  - el estado coincide con el número de PR (`terminada` exige `pr`);
  - ninguna tarea `bloqueada` pasa a otro estado sin que su motivo desaparezca (FT-49: CF-03);
  - el plan (`docs/08-tareas.md`) sigue pasando las reglas de §9.
- `pnpm plan:siguiente` lista las tareas que se pueden empezar ahora (dependencias terminadas, TU hechas o que solo bloquean el merge) y con cuáles pueden correr en paralelo.
- **Quién marca una TU como hecha:** vos, con una fila firmada en `pruebas/manuales/resultados.md` cuando la TU tiene procedimiento `PRU-MAN`, o en `plan/tu.md` con commit firmado (M17 se extiende a ese archivo en TA-009). Un agente nunca la marca.

**Justificación.** El estado vive con el código y lo revisa el mismo `rapido`; un agente no puede empezar una tarea cuyas dependencias no están en `main`. *Alternativas descartadas:* issues de GitHub (fuera del control del script, P8-10); un archivo por tarea (doscientos archivos para un dato de una línea).

### 1.5 Revisión obligatoria (DT-05, P8-11)

Una tarea es de **revisión obligatoria** si toca alguno de estos:

| Área | Por qué |
|---|---|
| Migraciones y controles de esquema (`packages/db/prisma/**`, `tools/db/**`) | Una migración aplicada no se edita nunca (03 §11.2) |
| Motor (`packages/dominio/src/calculo/**`, `operaciones/**`, `valores/**`) | Un error es un error de dinero |
| Seguridad: autorización, AAL2, tokens, firmas, `proxy.ts`, `/api/**`, `tools/pruebas/firmas.sh` | No se ve en una prueba verde |
| Reloj de prueba (`relojPermitido`, `instrumentation.ts`, `reloj-simulado.sql`) | Barreras de 07 §4.3 |
| CI y workflows (`.github/**`, `tools/ci/**`, `scripts ci:*`) | Cambian lo que protege a todos los PR |
| `CLAUDE.md` | Cambia el comportamiento de todos los agentes |

- La tarea lo declara (`revision: obligatoria`) y `pr:mergear` también lo detecta por los archivos del diff: si el diff toca un área de la tabla y la tarea dice `normal`, se trata como obligatoria.
- En una tarea obligatoria, el agente abre el PR, deja el informe (§1.6) y **espera tu "mergeá"** en la sesión. `pr:mergear` exige además `--aprobado` y registra en el commit de merge `Aprobado-por: usuario`.
- **[B2] Qué hace obligatoria una tarea (DT-20).** Solo los archivos de **producción** (clase de §1.1) dentro de un área de la tabla. Un archivo de prueba, de datos o portado idéntico (DT-14, verificado por huella) dentro de un área crítica no la vuelve obligatoria: lo que protege a esas áreas es el código que cambia, y las pruebas y los escenarios los controlan la CI y la matriz. `CLAUDE.md`, `.claude/settings.json`, las migraciones y los workflows son siempre de producción para esta regla.

**[B2] Qué revisás antes de decir "mergeá".** El agente te deja todo en el PR; vos mirás cuatro cosas, en este orden. La meta es de 5 a 10 minutos por PR:

| # | Qué | Dónde | Qué buscás | Si falla |
|---|---|---|---|---|
| 1 | El informe | Descripción del PR | Primero **"Qué mirar"** (el agente señala lo más riesgoso del cambio y por qué); después "Desvíos", "Contradicciones" y "Sin verificar" | Una contradicción sin CH propuesto, o "Qué mirar" vacío o genérico: no mergeás |
| 2 | Las pruebas creadas | Sección "Pruebas" del resumen de `pr:mergear` | Cada prueba nueva o cambiada con su identificador y lo que cubre entre corchetes (CA, ESC, INV, CB, OP); el resumen marca cada objetivo de `cubre` sin prueba y cada prueba cuyo número esperado cambió (RS7-09) | Un objetivo sin prueba, o un número esperado que cambió sin motivo en el informe: pedís corrección |
| 3 | El resumen de `pr:mergear` | `pnpm pr:mergear <n> --resumen`, que el agente pega en el PR | Tamaño medido frente al declarado; archivos de las áreas críticas con sus líneas; portados con su fuente y huella; desvíos detectados (archivos fuera de `archivos`, dependencias npm nuevas, áreas críticas no declaradas) | Un archivo crítico que el informe no explica: lo abrís (paso 4) |
| 4 | El diff completo | GitHub | **Solo** si el PR toca migraciones (`packages/db/prisma/migrations/**`), `CLAUDE.md` o `.claude/settings.json`; en el resto, solo los archivos que nombra "Qué mirar" o que el paso 3 marcó | — |

Lo que no revisás: el resto del código línea por línea. Lo cubren las pruebas escritas primero, la matriz y la CI; tu revisión mira dónde un error no lo detecta una prueba verde.

**[B2] Categorías que pasan a revisión normal (DT-20).** Con la regla de arriba:
- **Tareas del motor que solo agregan escenarios como datos** (TA-131 a TA-134, TA-145 y TA-146): ya eran normales, porque `escenarios/datos/**` es dato. Siguen así.
- **TA-101** (tipos de los hechos, sin funciones): pasa a normal. `hechos/` no es un área crítica y un tipo mal escrito no compila.
- **Las tareas de fichas (B6)**, aunque agreguen Server Actions en `servidor/acciones/`: normales. La autorización la exige la prueba que recorre el registro de acciones (PRU-SEG-ACCESO-001, TA-218), que falla sola si una acción nueva no llama a `autorizar()`.
- **No bajan:** el motor (`calculo/`, `operaciones/`, `valores/`), las migraciones, la seguridad, el reloj, la CI y `CLAUDE.md`. Ahí un error de dinero o de acceso puede pasar con las pruebas en verde.

Con esto, las obligatorias son **51 de 112 en la Parte B** (eran 52) y **11 de 65 en la Parte C** (§22.6).

### 1.6 Terminado de una tarea (DT-06)

Una tarea está terminada cuando se cumple todo esto. Las condiciones de una **feature** son las de 07 §27 y se agregan cuando la tarea cierra su ficha.

| # | Condición | Quién lo comprueba |
|---|---|---|
| 1 | Las pruebas de `pru` existen con su identificador en el título y están en verde; se escribieron antes o en el mismo PR que el código que prueban | `rapido` (matriz, M8) y `cierre` |
| 2 | Los objetivos de `cubre` están cubiertos según su tipo (un CA por M1; una regla de lint por su archivo de control, que debe fallar; un control de CI por su caso negativo) | `rapido` y la revisión |
| 3 | `pnpm ci:rapido` y, si corresponde, `pnpm ci:integracion` y la E2E afectada pasaron en local antes del push (DT-07) | El agente, en el informe |
| 4 | El diff cumple DT-01 | `pr:mergear` |
| 5 | `plan/tareas.json` dice `terminada` con el número de PR; `pnpm plan:verificar` pasa | `rapido` |
| 6 | Si la tarea termina una ficha: 07 §27 completo, con `features.json` en `terminada` | Matriz y `cierre` |
| 7 | El PR se mergeó con `pnpm pr:mergear` (y con `--aprobado` si es de revisión obligatoria) | `pr:mergear` |
| 8 | El informe de la tarea está en la descripción del PR | El agente |

**Informe** (descripción del PR, obligatorio): tarea, qué se hizo, **[B2]** qué mirar (lo más riesgoso del cambio, con archivo y líneas, y por qué), pruebas creadas (identificadores con lo que cubren), comandos ejecutados con su resultado, tamaño medido, desvíos respecto del encargo con su motivo, contradicciones encontradas (como propuesta de CH, nunca resueltas en el código) y lo que quedó sin verificar. El formato exacto va con la plantilla del encargo (**[D]** §32).

### 1.7 Regla de push (DT-07, P8-4)

- Antes de cada push a una rama de PR, el agente corre `pnpm ci:local`, que ejecuta `ci:rapido` completo y, según los archivos cambiados (`pruebas:afectadas`), `ci:integracion` y la E2E de las suites afectadas.
- Objetivo: **2 pushes por PR o menos** (uno para abrir el PR y uno para correcciones). `pr:mergear` informa la cantidad.
- El PR pasa a "listo" en el último push, para que `e2e` de PR corra una sola vez (M2).
- Si `ci:local` falla, no hay push. La excepción es pedir ayuda: un push con el PR en borrador y la descripción "bloqueado: …".

### 1.8 Windows, worktrees y paralelismo (DT-10, P8-2, P8-5)

**Entorno.** Claude Code en Windows nativo, con Git Bash como shell; Docker Desktop con WSL2 como motor; Node 24 y pnpm por Corepack (TU-03).

| Tema | Regla | Por qué |
|---|---|---|
| Fin de línea | `.gitattributes` con `* text=auto eol=lf` y `*.sh text eol=lf`; `core.autocrlf false` | Los scripts bash y los SQL con CRLF fallan en CI y cambian las huellas de C6 |
| Rutas largas | `git config --system core.longpaths true` y `LongPathsEnabled` en Windows | `node_modules` de pnpm en worktrees pasa de 260 caracteres |
| Ubicación | Repositorio en `C:\finn\repo`; **[F8]** cada subagente trabaja en su worktree de Claude Code, `C:\finn\repo\.claude\worktrees\<nombre>\` (DT-34) | Rutas cortas; fuera de OneDrive (bloquea archivos y rompe Docker) |
| Ramas | `ta-nnn-<tema>`, una por tarea | `plan:verificar` relaciona rama y tarea |
| Crear | **[F8]** Lo crea Claude Code al lanzar el subagente (`isolation: worktree`, desde `origin/main` después de `git fetch`); el subagente renombra la rama a `ta-nnn-<tema>` y corre `pnpm install --frozen-lockfile` (DT-34). Antes: `git worktree add C:/finn/wt/ta-nnn` | El almacén de pnpm es global y se comparte por enlaces duros en el mismo disco, sin copiar |
| Scripts bash | `humo.sh`, `firmas.sh`, `restaurar.sh` corren en Git Bash en local y en Ubuntu en CI | Un solo script por tarea |
| Docker | Testcontainers sobre Docker Desktop; imágenes de `public.ecr.aws` (07 §5.2) | Igual que CI |

**Paralelismo** (2 agentes, máximo 3):

| No pueden correr a la vez | Motivo |
|---|---|
| Dos tareas con `migraciones=1` | El orden de carpetas lo fija la fecha de creación; la segunda tendría que renombrar (C2 lo rechaza después del merge) |
| Dos tareas que agregan dependencias npm | `pnpm-lock.yaml` choca siempre |
| Dos tareas que cambian `schema.prisma` | Ídem, y `catalogo-esperado.txt` |
| Dos tareas que ejecutan E2E local | La pila local de Supabase usa puertos fijos (P8-5). **[C]** Desde TA-219, el candado de `pnpm test:e2e` (DT-22) ordena solo las corridas: las tareas pueden ir en paralelo |
| Una tarea `paralelo: no` con cualquier otra | Toca la raíz o la configuración común |
| Dos tareas que editan el mismo archivo de producción | Se declara en `paralelo: con` |

La tabla completa de pares se consolida en la Parte D (**[D]** §31); cada tarea ya trae su campo `paralelo`.

---

## 2. Hitos (DT-08)

Cada hito tiene un criterio que se comprueba con un comando o un registro, no con una opinión. El bloque `hito` lo lee el script: `despues` es la última tarea en el orden, y `requiere`, lo que tiene que estar terminado.

### HT-0 CI en verde con el repositorio vacío

```hito
despues: TA-014
requiere: TA-001, TA-002, TA-003, TA-004, TA-005, TA-006, TA-007, TA-008, TA-009, TA-010, TA-011, TA-012, TA-013, TA-014
tu: TU-01, TU-02, TU-03, TU-04, TU-05
```

**Criterio:** la última corrida de `ci.yml` en `main` está en verde con `rapido` (typecheck, lint de fronteras y de cliente con sus controles negativos fallando como deben, Prettier, `versiones.mjs`, gitleaks, C1, C2, matriz incremental sin fichas, firmas, `plan:verificar`) y `cierre`; el nocturno corrió una vez y dejó el artefacto de minutos; `pnpm plan:siguiente` lista TA-050 y TA-100.

### HT-1 Base de datos verificada

```hito
despues: TA-059
requiere: TA-050, TA-051, TA-052, TA-053, TA-054, TA-055, TA-056, TA-057, TA-058, TA-059
tu: TU-03, TU-06
```

**Criterio:** en `integracion`, la plantilla con bootstrap y las 14 migraciones de B1 pasa C3 a C6 y R1 a R15; C4 vacío; PRU-INT-POOL-001 a 006 (CH-05) y PRU-ESQ-POOL-001 en verde; la siembra deja las filas de 03 §9 (PRU-INT-ESQ-102). La migración 15 (formatos del BAC, TA-181) llega en B3. **[A2]** Tareas: TA-050 a TA-059 (§12).

### HT-2 Motor con todos los escenarios

```hito
despues: TA-239
requiere: TA-100, TA-101, TA-102, TA-103, TA-104, TA-105, TA-106, TA-107, TA-108, TA-109, TA-110, TA-111, TA-112, TA-113, TA-114, TA-115, TA-116, TA-117, TA-118, TA-119, TA-120, TA-121, TA-122, TA-123, TA-124, TA-125, TA-126, TA-127, TA-128, TA-129, TA-130, TA-131, TA-132, TA-133, TA-134, TA-135, TA-136, TA-137, TA-138, TA-139, TA-140, TA-141, TA-142, TA-143, TA-144, TA-145, TA-146, TA-147, TA-230, TA-231, TA-234, TA-235, TA-236, TA-237, TA-238, TA-239, TA-232, TA-233, TA-240
tu: —
```

**Criterio:** los 50 `PRU-ESC-nn@motor` en verde; invariantes 1 a 5, 26 a 28 con `PROP`; diferencial contra el oráculo; cobertura de ramas de `@finn/dominio` ≥ 90 % (DP-09); los 4 mutantes mueren (07 §19.4). **[A2]** Tareas: B2 (§13). Por las olas (DT-16), HT-2 se cumple después de HT-6: la ola 1 da lo que las fichas [I] necesitan y la ola 2 completa el motor antes de las fichas [M].

### HT-3 Aplicación sobre PostgreSQL

```hito
despues: TA-199
requiere: TA-150, TA-151, TA-152, TA-153, TA-154, TA-155, TA-156, TA-158, TA-159, TA-160, TA-161, TA-162, TA-163, TA-164, TA-165, TA-166, TA-167, TA-168, TA-169, TA-170, TA-171, TA-172, TA-173, TA-174, TA-175, TA-176, TA-177, TA-178, TA-179, TA-180, TA-181, TA-182, TA-183, TA-184, TA-185, TA-186, TA-187, TA-188, TA-189, TA-190, TA-191, TA-192, TA-193, TA-194, TA-195, TA-196, TA-197, TA-198, TA-199
tu: TU-13
```

**Criterio:** `escribir()` y `leer()` con el protocolo de 04 §4.2; los 50 `PRU-ESC-nn@int` en verde; memoria = carga nueva (V-16); la prueba de catálogo de CF-16 (PRU-INT-NOTIF-002). **[A2]** Tareas: B3 (§14), salvo TA-157, que es condicional; TU-13 antes de mergear TA-181. Igual que HT-2, se cumple con la ola 2 (DT-16).

### HT-4 Infraestructura real verificada (P8-7)

```hito
despues: TA-253
requiere: TA-250, TA-251, TA-253
tu: TU-06, TU-07
```

**Criterio:** `tools/humo/humo.sh` contra el proyecto real con H-01 a H-12 en `pasa` (o con su alternativa de 04 §17.2 registrada); `PRU-MAN-ESQ-001` con resultado `pasa` firmado; `PG_MAYOR` de `versiones.env` igual a H-01; disparador de P7-12 resuelto (07 §32.1). **[A2]** Tareas: TA-251 (respaldo, que H-08 usa), TA-250 y TA-253 (§15), y TU-06, TU-07.

### HT-5 Primer despliegue desde CI (P8-7)

```hito
despues: TA-281
requiere: TA-200, TA-201, TA-202, TA-203, TA-204, TA-205, TA-206, TA-207, TA-214, TA-215, TA-216, TA-219, TA-210, TA-211, TA-212, TA-213, TA-224, TA-260, TA-280, TA-281
tu: TU-09, TU-12, TU-13
```

**Criterio:** el job `desplegar` de `main` corrió en verde: `politica-patrones` en verde con el formato del BAC reescrito y F-2 y F-3 inactivos (§6), migraciones aplicadas, C5, C6 y R15 contra producción, barrera 1b (PRU-SEG-RELOJ-006) y `vercel deploy --prod`. En producción: ingresar con contraseña y TOTP (FT-01, FT-02) y ver Inicio vacío. Requiere SP-01 del BAC (TU-13), Vercel (TU-09) y los secretos (TU-12). **[C]** Tareas: B4 de HT-5 (§20), TA-260 (§21), TA-280 y TA-281 (§22).

### HT-6 Uso diario mínimo

```hito
despues: TA-301
requiere: TA-112, TA-132, TA-133, TA-134, TA-189, TA-190, TA-191, TA-208, TA-209, TA-217, TA-218, TA-220, TA-221, TA-222, TA-223, TA-261, TA-262, TA-282, TA-283, TA-284, TA-285, TA-286, TA-287, TA-288, TA-289, TA-290, TA-291, TA-292, TA-293, TA-294, TA-295, TA-296, TA-297, TA-298, TA-299, TA-300, TA-301
fichas: FT-01, FT-02, FT-03, FT-04, FT-08, FT-09, FT-10, FT-14, FT-18, FT-21, FT-29, FT-34, FT-35, FT-37, FT-38, FT-50
pruebas: INV-01, INV-02, INV-03, INV-04, INV-05, INV-26, INV-27, INV-28, MOT-diferencial
tu: TU-11, TU-12, TU-15
```

**Criterio:** en producción, un SMS real del BAC enviado por MacroDroid llega a la Bandeja, se aprueba con un toque y cambia el Presupuesto, con los mismos números en Inicio, Presupuesto y el detalle; `PRU-MAN-BAND-001` firmado en `pasa` (SP-04). **[C]** Fichas: las 16 de `fichas` (FT-14, FT-37 y FT-38 se agregan a las 13 de la Parte A, §19.6), en `terminada`. El primer respaldo en R2 y el control de dinero en verde (TA-261, TA-262).

**[B2] Condición antes de usar plata real (P8-18, DT-25).** Además, en verde y con su tarea terminada:
- las propiedades de los invariantes 1 a 5 y 26 a 28 y el diferencial contra el oráculo (`pruebas`);
- todos los ESC que tocan las fichas de HT-6 según 06 §6.5, en `@motor` y en `@int`: ESC-01, ESC-02, ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-11, ESC-12, ESC-15, ESC-17, ESC-19, ESC-20, ESC-24, ESC-31, ESC-44, ESC-46, ESC-48, ESC-49 (19 escenarios, 38 pruebas);
- los CB que citan esas fichas: CB-09, CB-10, CB-14, CB-15, CB-16, CB-17, CB-25, CB-28.

El verificador deriva los ESC y los CB de las fichas y comprueba que la tarea dueña de cada prueba esté en `requiere` o en sus dependencias (E7-pruebas), y la de cada CA de las fichas (E7-fichas). Por eso `requiere` incluye TA-112, TA-132, TA-133, TA-134, TA-189, TA-190, TA-191, que no están en las dependencias de las fichas. **Quedan 17 tareas de la ola 2 después de HT-6** (§23.4).

### HT-7 Todas las fichas [I] terminadas

```hito
despues: TA-315
requiere: TA-263, TA-302, TA-303, TA-304, TA-305, TA-306, TA-307, TA-308, TA-309, TA-310, TA-311, TA-312, TA-313, TA-314, TA-315
tu: TU-11, TU-12, TU-16
```

**Criterio:** las 31 fichas [I] en `terminada` en `features.json`; `pnpm pruebas:matriz` sin errores; recorridos de 06 §4 cuyas fichas son todas [I] con su E2E en verde; manuales de fichas [I] registrados. **[C]** Ningún recorrido de 06 §4 tiene solo fichas [I] (todos incluyen alguna [M]), así que sus E2E van en la Parte D (§23.1); `restauracion.yml` (TA-263) queda activo.

### HT-8 Todas las fichas [M] terminadas

```hito
despues: TA-447
requiere: TA-400, TA-401, TA-402, TA-403, TA-404, TA-405, TA-406, TA-407, TA-408, TA-409, TA-410, TA-411, TA-412, TA-413, TA-414, TA-415, TA-416, TA-417, TA-418, TA-419, TA-420, TA-421, TA-422, TA-423, TA-424, TA-425, TA-426, TA-427, TA-428, TA-429, TA-430, TA-431, TA-432, TA-433, TA-434, TA-435, TA-436, TA-437, TA-438, TA-439, TA-446, TA-447
hitos: HT-2, HT-3, HT-7
sin_pendientes: si
tu: —
```

**Criterio:** las 38 fichas [M] en `terminada`; `pnpm pruebas:matriz --puerta` sin errores de M1 a M15 (los manuales pueden estar pendientes). **[D]** Sin CA pendientes de punta a punta salvo los de fichas [P] (DT-27); los recorridos de 06 §4 en verde (TA-446, TA-447); HT-2 y HT-3 cumplidos (la ola 2 completa).

### HT-9 Puerta de salida

```hito
despues: TA-470
requiere: TA-470
hitos: HT-4, HT-5, HT-6, HT-7, HT-8
fichas: FT-01, FT-02, FT-03, FT-04, FT-05, FT-06, FT-08, FT-09, FT-10, FT-11, FT-12, FT-13, FT-14, FT-15, FT-16, FT-17, FT-18, FT-19, FT-20, FT-21, FT-22, FT-23, FT-24, FT-25, FT-26, FT-27, FT-28, FT-29, FT-30, FT-31, FT-32, FT-33, FT-34, FT-35, FT-36, FT-37, FT-38, FT-39, FT-40, FT-41, FT-42, FT-43, FT-44, FT-45, FT-46, FT-47, FT-48, FT-50, FT-51, FT-52, FT-53, FT-54, FT-55, FT-57, FT-60, FT-61, FT-62, FT-63, FT-66, FT-67, FT-69, FT-70, FT-71, FT-72, FT-73, FT-74, FT-75, FT-76, FT-78
sin_pendientes: si
tu: TU-14, TU-16, TU-17
```

**Criterio:** `pnpm pruebas:puerta` abierta (07 §30, con CH-03): los 465 CA, SP-01 completo, SP-02, SP-04, firmas y el ensayo de la condición 6 (TU-17). **[D]** Además: F-2 de Banco Agrícola activo (TA-470, TU-14) y ningún pendiente de punta a punta salvo [P]. El bloque lista las 69 fichas [I] y [M] y encadena HT-4 a HT-8 (DT-30). Con esto empieza el paso de la 1.0 a la 2.0 (TU-18).

**Las fichas [P] y FT-49** quedan después de HT-9 y no forman parte de ningún hito (supuesto 5 del Paso 1).

**Justificación.** Los hitos siguen las fronteras de 07 §1 (cada nivel tiene su hito) y separan lo que depende de vos (HT-4, HT-5, HT-6, HT-9) de lo que no. Así se ve en qué hito el plan espera por una TU. *Alternativa descartada:* un hito por bloque de tareas (no dice qué se puede usar).

---

## 3. Bloque B0 — Fundación (HT-0)

### 3.1 Qué entra en B0 y qué no (DT-11)

- **Entra:** monorepo y paquetes de 02 (con los de 04 §1.1), `versiones.env`, `CLAUDE.md`, lint de 02 ADR-21, 04 BE-03, 05 L1–L19 y L20, arnés de pruebas, matriz de 07 §13, firmas, `pr:mergear`, controles C1 y C2, workflows `ci.yml` y `nocturno.yml` con M5 y la reserva de §32.3.
- **Va a la Parte B, con las migraciones:** C3 a C6 y R1 a R15. Sin esquema no tienen nada que comprobar, y su caso negativo necesita la plantilla. El job `integracion` existe desde B0 (fusionado con `rapido`, M5) y empieza a ejecutarlos en la primera tarea de B1.
- **Va a B5 (operación):** `desplegar`, `politica-patrones`, `respaldo.yml` y `restauracion.yml`. Necesitan Vercel, R2 o el esquema, y el control de dinero (07 §31.1) necesita el motor.
- *Alternativa descartada:* escribir C3 a C6 en B0 contra un esquema de juguete (habría que reescribirlos al llegar las migraciones reales).

### 3.2 Tareas

#### TA-001 Esqueleto del monorepo y versiones

```tarea
orden: 1
bloque: B0
hito: HT-0
depende: —
tu: TU-01, TU-03, TU-04
revision: normal
paralelo: no
tamano: prod=260 archivos=12 ca=0 migraciones=0 total=360
cubre: ADR-20, BE-01, BE-04, BE-03b, ADR-21-tipado, DP-06
pru: —
compartido: —
```

**Qué construir.**
- `pnpm-workspace.yaml` con `apps/web` y `packages/{dominio,db,aplicacion,sms,conciliacion,config}`; cada paquete con `package.json` (`name`, `exports` de 04 §1.4, `type: module`), `src/index.ts` vacío y `tsconfig.json` que extiende `@finn/config`.
- `@finn/config`: `tsconfig.base.json` con las banderas de ADR-21 (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`), Prettier.
- `.npmrc` con `hoist=false` y `public-hoist-pattern=` vacío (BE-03 b); `package.json` raíz con `packageManager` (pnpm fijado) y `engines.node` `24.x`.
- `.gitattributes`, `.editorconfig`, `.gitignore` (incluye `.env*`, `_entrada/`, `generado/`; **[A2]** `.claude/settings.local.json` y `.vercel/`; **[F8]** `.claude/worktrees/`, `_privado/` y `_aprobaciones/`).
- `infra/versiones.env` (`PG_MAYOR=17`, `NODE=24`, `PLAYWRIGHT=1.56.x`, `SUPABASE_CLI=<fijada>`), `tools/pruebas/versiones.mjs` (07 §5.1) y `tools/pruebas/generar-config-supabase.mjs`, que escribe `supabase/config.toml` desde `versiones.env`.
- Scripts raíz: `typecheck`, `formato`, `formato:comprobar`.

**Leer.** 02 ADR-20, ADR-21 (tipado); 04 §1.1, §1.4, §1.5 (b); 07 §5.1 (DP-06); DT-10 de este documento.

**Archivos.** Raíz (`package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitattributes`, `.editorconfig`, `.gitignore`), `infra/versiones.env`, `packages/*/package.json`, `packages/config/**`, `tools/pruebas/versiones.mjs`, `tools/pruebas/generar-config-supabase.mjs`.

**Pruebas primero.** `versiones.mjs` con un caso negativo en `tools/lint/controles/versiones/` (un `config.toml` con otra versión mayor debe hacerlo fallar).

**Comandos.** `pnpm install`; `pnpm typecheck`; `pnpm formato:comprobar`; `node tools/pruebas/versiones.mjs`.

**Terminada cuando.** Los cuatro comandos pasan en Windows (Git Bash) y el caso negativo de versiones falla como debe.

#### TA-002 Documentos, anexos e instrucciones para agentes

```tarea
orden: 2
bloque: B0
hito: HT-0
depende: TA-001
tu: TU-04
revision: obligatoria
paralelo: no
tamano: prod=395 archivos=8 ca=0 migraciones=0 total=1190
cubre: ADR-21-instrucciones, DT-03, DT-04, DT-09, DT-13
pru: PRU-SEG-OPER-101
compartido: —
```

**Qué construir.**
- `docs/`: copia de los 9 documentos con sus enmiendas (00 a 07, `06-identidad-visual.md`, el documento de producto) y `docs/08-tareas.md`.
- `docs/anexos/<zip>/`: el contenido de los zips que dejaste en `C:\finn\_entrada\` (TU-04, DT-36), sin cambios, con un `docs/anexos/INDICE.md` que lista cada archivo y el documento que lo cita. Los documentos de `docs/` también salen de `_entrada`.
- `CLAUDE.md` en la raíz con el contenido de §4, sin cambios.
- **[A2]** `.claude/settings.json` con el contenido de §4.1, sin cambios (DT-13). **[F8]** Ya está en `main` desde el commit inicial de TU-04; la tarea no lo escribe: lo comprueba.
- **[A2]** `tools/plan/permisos.test.ts` (**PRU-SEG-OPER-101**), que comprueba en `.claude/settings.json`:
  - que están todas las reglas `deny` de §4.1 (la lista esperada vive en la prueba);
  - que ninguna regla `allow` coincide con una `deny`;
  - que `permissions.defaultMode` no es `bypassPermissions` y que `disableBypassPermissionsMode` es `"disable"`;
  - que `.claude/settings.local.json` está en `.gitignore` y no existe en el índice de git;
  - que ningún archivo versionado contiene un patrón de token de GitHub (`github_pat_`, `ghp_`) ni de Vercel.
- `plan/tareas.json` con todas las tareas de `docs/08-tareas.md` en `pendiente` (DT-04).
- `tools/plan/verificar.ts`: el script de §9 (V8-01), copiado del zip de esta fase, y los comandos `plan:verificar` y `plan:siguiente`.
- **[B2]** `tools/plan/anexos.ts` (V8-05), copiado del zip de esta fase, y `pnpm plan:anexos`: falla si un archivo que una tarea manda portar no está en `docs/anexos/`.
- **[D]** `tools/plan/encargo.ts` (V8-04, §32), copiado del zip de esta fase, y `pnpm plan:encargo TA-nnn`.

**Leer.** §1.3, §1.4, §4 y §9 de este documento; 02 ADR-21 (instrucciones para agentes); 07 §13.2 (los documentos en `docs/`).

**Archivos.** `docs/**`, `CLAUDE.md`, `.claude/settings.json`, `.gitignore`, `plan/tareas.json`, `tools/plan/verificar.ts`, `tools/plan/permisos.test.ts`, `package.json` (scripts).

**Pruebas primero.** `pnpm plan:verificar --negativo`: el control negativo del script detecta las mutaciones de V8-01. PRU-SEG-OPER-101 con un control: quitar la regla `Bash(vercel *)` de una copia la hace fallar.

**Comandos.** `pnpm plan:verificar`; `pnpm plan:verificar --negativo`; `pnpm plan:siguiente`; **[B2]** `pnpm plan:anexos`.

**Terminada cuando.** Los tres pasan, PRU-SEG-OPER-101 pasa y `plan:siguiente` lista TA-003 y TA-005 como disponibles **[CH-11]**. Después del merge, una sesión nueva de Claude Code rechaza `vercel whoami` y la lectura de `~/.ssh/finn_resultados` (lo comprobás vos al abrir TA-003).

#### TA-003 Lint de fronteras de paquetes

```tarea
orden: 3
bloque: B0
hito: HT-0
depende: TA-001
tu: —
revision: normal
paralelo: con TA-004, TA-005
tamano: prod=340 archivos=6 ca=0 migraciones=0 total=700
cubre: ADR-21-lint-dominio, ADR-21-lint-prisma, ADR-21-lint-prisma8, ADR-21-lint-centavos, BE-02, BE-03a, BE-03c, BE-03d, L20
pru: —
compartido: —
```

**Qué construir.**
- ESLint en configuración plana con `typescript-eslint` estricto con tipos, en `@finn/config/eslint`.
- Reglas de ADR-21: en `@finn/dominio`, sin E/S, Prisma, Next ni Node y sin `Date`, `Date.now`, `Math.random` ni `new Intl.DateTimeFormat`; `@prisma/client` y el cliente generado solo en `@finn/db`; ningún `@prisma/orm-*`; `parseFloat`, `toFixed` y `/` sobre `Centavos` solo en los módulos de dinero y fechas.
- Matriz de dependencias de 04 §1.3 en tres controles: `tools/ci/verificar-dependencias.mjs` (a), `dependency-cruiser` con importaciones dinámicas y reexportaciones (c), `no-restricted-imports` por paquete (d).
- **L20** (CT-02): sin `Date.now()` ni `new Date()` sin argumentos en `@finn/aplicacion` y `apps/web/src/app`, salvo los módulos de formato y del reloj de prueba.
- Ningún `eslint-disable` en reglas de esta tarea (BE-03).

**Leer.** 02 ADR-21 (lint); 04 §1.3, §1.5; 07 §4.4 (fila de L20).

**Archivos.** `packages/config/eslint/**`, `eslint.config.mjs`, `tools/ci/verificar-dependencias.mjs`, `.dependency-cruiser.cjs`, `package.json` (scripts `lint`).

**Pruebas primero.** Un archivo de control por regla en `tools/lint/controles/paquetes/` (por ejemplo, `dominio-usa-date.ts`, `web-importa-db.ts`, `aplicacion-date-now.ts`) y `tools/lint/controles.test.ts`, que corre ESLint y los controles a y c sobre ellos y exige que **cada uno falle con su regla**.

**Comandos.** `pnpm lint`; `pnpm test:unidad -t "controles de lint"`; `node tools/ci/verificar-dependencias.mjs`; `pnpm depcruise`.

**Terminada cuando.** El repositorio pasa el lint y cada control falla con la regla que le corresponde.

#### TA-004 Lint del cliente (L1 a L19)

```tarea
orden: 4
bloque: B0
hito: HT-0
depende: TA-003
tu: —
revision: normal
paralelo: con TA-003
tamano: prod=360 archivos=7 ca=0 migraciones=0 total=760
cubre: L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18, L19
pru: PRU-DOM-VAL-006
compartido: —
```

**Qué construir.**
- Las 19 reglas de 05 §1.7 con su herramienta: `no-restricted-imports` con `allowTypeImports` (L1, L2), regla propia con tipos para `Centavos` (L3), por nombre de archivo (L4), `no-restricted-globals` y `no-restricted-syntax` (L5 a L7, L9, L13), `react/jsx-no-literals` (L8), control de `tools/ci` para las lecturas por Server Action (L10), `stylelint` y ESLint sobre `className` (L12, L14), `eslint-plugin-jsx-a11y` (L17) y las de importación (L11, L16, L18, L19).
- Las reglas apuntan a las carpetas de 05 §1.1; las carpetas todavía no tienen código, así que se prueban con los controles.

**Leer.** 05 §1.1, §1.7; 05 §10.1 (tokens, para L12 a L14); 02 Enmiendas, PF-3.

**Archivos.** `packages/config/eslint/web.mjs`, `packages/config/eslint/reglas/{centavos,archivos-servidor,jsx-deshabilitado}.mjs`, `tools/ci/lecturas-interactivas.mjs`, `stylelint.config.mjs`, `eslint.config.mjs`.

**Pruebas primero.** `tools/lint/controles/web/Lnn-*.tsx` (uno por regla) y **PRU-DOM-VAL-006** (V5-12): ESLint sobre el archivo de control de L1 y L3 debe fallar con esas reglas. El mismo `controles.test.ts` de TA-003 recorre los 19.

**Comandos.** `pnpm lint`; `pnpm test:unidad -t "PRU-DOM-VAL-006|controles de lint"`.

**Terminada cuando.** Los 19 controles fallan con su regla y el resto del repositorio pasa el lint.

#### TA-005 Arnés de pruebas

```tarea
orden: 5
bloque: B0
hito: HT-0
depende: TA-001
tu: —
revision: normal
paralelo: con TA-003
tamano: prod=300 archivos=8 ca=0 migraciones=0 total=520
cubre: DP-01, DP-03, DP-08, DP-09, DP-11-determinismo, CT-04
pru: —
compartido: —
```

**Qué construir.**
- `vitest.config.ts` en la raíz con `test.projects`: `unidad`, `escenarios-motor`, `contratos`, `integracion`, `componentes` (modo navegador con el Chromium de Playwright, CT-04). `retries: 0`; `sequence.shuffle: true` en `unidad` y `contratos`, con la semilla impresa; `FC_SEED` desde el número de corrida.
- Cobertura con `@vitest/coverage-v8` sobre `@finn/dominio`, umbral de ramas 90 % (DP-09), activo cuando el paquete tiene código.
- `apps/web/playwright.config.ts` con los proyectos `movil`, `escritorio`, `zona-distinta` y `webkit-parcial` (07 §3.2), `retries: 1` solo en CI, `trace: 'on-first-retry'`, `workers: 1`.
- Scripts `test`, `test:unidad`, `test:escenarios`, `test:contratos`, `test:integracion`, `test:componentes`, `test:e2e`, `bench`, `test:respaldo` (07 §2.3), todos con `--passWithNoTests` hasta que haya pruebas.
- Lint de las pruebas (07 §7.1): sin `Date.now()`, `new Date()` sin argumentos ni `setTimeout` con espera fija en `e2e/`; `playwright/no-wait-for-timeout`.

**Leer.** 07 §1.1, §2.3, §3, §7.1, §7.2, §8.

**Archivos.** `vitest.config.ts`, `apps/web/playwright.config.ts`, `packages/config/eslint/pruebas.mjs`, `package.json` (scripts), `tools/pruebas/semilla.ts`.

**Pruebas primero.** Un control por regla de 7.1 en `tools/lint/controles/pruebas/`, en el mismo `controles.test.ts`.

**Comandos.** `pnpm test`; `pnpm test:e2e -- --list`; `pnpm test:componentes`.

**Terminada cuando.** Todos los comandos pasan sin pruebas y los controles de 7.1 fallan como deben.

#### TA-006 Matriz I: inventario, formato y mapa

```tarea
orden: 6
bloque: B0
hito: HT-0
depende: TA-002, TA-005
tu: —
revision: normal
paralelo: con TA-011
tamano: prod=390 archivos=5 ca=0 migraciones=0 total=900
cubre: M7, M8, M12, M13, DP-15, DP-18
pru: —
compartido: —
```

**Qué construir.** Portar la matriz de 07 desde `docs/anexos/07/` (prototipo de V7-09 y V7-11), primera mitad:
- `tools/pruebas/listar.ts` (`vitest list --json` + `playwright test --list --reporter=json` → `pruebas/inventario.json`, sin ejecutar nada).
- `tools/pruebas/matriz.ts` con la lectura de los documentos de `docs/` (fichas, CA con prioridad y marcas, ESC, AV, invariantes, CB, recorridos, verificaciones previas) y las reglas **M7, M8, M12 y M13**.
- `pruebas/features.json` vacío (una línea en blanco entre entradas, DT-04), `pruebas/mapa-codigo.json` con `marco` y los patrones de 07 §13.6.
- Comandos `pruebas:listar` y `pruebas:matriz` (modo incremental).

**Leer.** 07 §2, §13.1 a §13.4, §13.6; `docs/anexos/07/` (prototipo de la matriz).

**Archivos.** `tools/pruebas/{listar,matriz,documentos}.ts`, `pruebas/features.json`, `pruebas/mapa-codigo.json`.

**Pruebas primero.** `tools/pruebas/matriz.test.ts` con las mutaciones de V7-09 que tocan M7, M8, M12 y M13 (referencia inexistente, identificador mal formado, archivo sin mapear, ficha inexistente en `features.json`).

**Comandos.** `pnpm pruebas:listar`; `pnpm pruebas:matriz`; `pnpm test:unidad -t "matriz"`.

**Terminada cuando.** Sobre los documentos de `docs/`, los conteos son los de 07 §35 (77 fichas; 492 CA: 233, 232, 24 y 3; 50 ESC; 24 AV; 28 invariantes; 34 CB; 6 recorridos; 92 verificaciones previas) y las mutaciones se detectan.

#### TA-007 Matriz II: cobertura, cuarentena y suites afectadas

```tarea
orden: 7
bloque: B0
hito: HT-0
depende: TA-006
tu: —
revision: normal
paralelo: con TA-011
tamano: prod=380 archivos=5 ca=0 migraciones=0 total=880
cubre: M1, M2, M3, M4, M5, M6, M9, M10, M11, M14, DP-19, DP-11-cuarentena, CH-01
pru: —
compartido: —
```

**Qué construir.**
- Reglas **M1 a M6, M9, M10, M11 y M14** y el **modo puerta** (`--puerta`).
- `pruebas/cuarentena.json` vacío y la lectura de cuarentena (M9).
- `pruebas:ft FT-nn` (07 §13.4), `pruebas:afectadas` con la resolución por Piezas de 06, el mapa y `marco` (07 §13.6) **con el patrón de CH-01** (`packages/aplicacion/src/operaciones/**/OP-nn-*.ts`, `consultas/<pantalla>.ts`), y `pruebas:informe`.

**Leer.** 07 §7.3, §13.3 a §13.6; CH-01 (§7).

**Archivos.** `tools/pruebas/{matriz,reglas,afectadas,ft}.ts`, `pruebas/cuarentena.json`.

**Pruebas primero.** Las mutaciones restantes de V7-09 y V7-11 (M1 a M6, M9 a M11, M14) en `matriz.test.ts`, y un caso de `afectadas` por cada punto de 07 §13.6, incluido uno con un archivo `operaciones/tarjetas/OP-23-pagar-tarjeta.ts`.

**Comandos.** `pnpm pruebas:matriz`; `pnpm pruebas:matriz --puerta` (debe fallar: no hay pruebas); `pnpm pruebas:ft FT-30`; `pnpm test:unidad -t "matriz|afectadas"`.

**Terminada cuando.** Las mutaciones se detectan, `--puerta` falla con exactamente los objetivos de 07 §13.1 y el modo incremental pasa sin fichas.

#### TA-008 Datos de la matriz: verificaciones previas y manuales

```tarea
orden: 8
bloque: B0
hito: HT-0
depende: TA-007
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=1 ca=0 migraciones=0 total=900
cubre: DP-20, DP-25, CH-04, CT-03
pru: PRU-MAN-ACCESO-001, PRU-MAN-OPER-001, PRU-MAN-OPER-002, PRU-MAN-OPER-003, PRU-MAN-BAND-001, PRU-MAN-BAND-002, PRU-MAN-NOTIF-001, PRU-MAN-BAND-003, PRU-MAN-CONC-001, PRU-MAN-BAND-004, PRU-MAN-CTA-001, PRU-MAN-PWA-001, PRU-MAN-PWA-002, PRU-MAN-ESQ-001, PRU-MAN-CTA-002
compartido: —
```

**Qué construir.**
- `pruebas/verificaciones-previas.json` con las 92 entradas de 07 §20 y §21 (`destino` o `motivo`).
- `pruebas/manuales.md` con los 15 procedimientos de 07 §22.1, §29.2 y §31 (incluido PRU-MAN-CTA-002, CH-04), cada uno con Disparador, Dispositivo, Pasos numerados, Resultado esperado y Registro (DP-20).
- `pruebas/manuales/resultados.md` no lo crea esta tarea: lo crea el usuario con su primera fila firmada (encabezado de 07 §22.2 más la fila), según TU-05 **[CH-13]**.

**Leer.** 07 §20, §21, §22, §29.2, §31.1, §31.4, §31.5; CH-04.

**Archivos.** `pruebas/verificaciones-previas.json`, `pruebas/manuales.md`, `tools/pruebas/matriz.ts` (solo el lector de M6, si hace falta). **[CH-13]**

**Pruebas primero.** M6 y M10 sobre los archivos reales: la matriz pasa en modo incremental. Control: quitar una entrada de verificaciones previas o los Pasos de un manual hace fallar M6 o M10.

**Comandos.** `pnpm pruebas:matriz`.

**Terminada cuando.** M6 y M10 pasan con las 92 verificaciones y los 15 manuales.

#### TA-009 Firmas y resultados manuales

```tarea
orden: 9
bloque: B0
hito: HT-0
depende: TA-007
tu: TU-05
revision: obligatoria
paralelo: con TA-010
tamano: prod=330 archivos=4 ca=0 migraciones=0 total=760
cubre: M15, M16, M17, DP-24, P7-20
pru: PRU-SEG-OPER-001
compartido: —
```

**Qué construir.**
- `tools/pruebas/firmas.sh` (07 §29.1): firmantes leídos de la rama base; `git blame` por fila de `resultados.md`; todo commit que tocó `resultados.md`, `firmantes-permitidos` o `plan/tu.md` firmado; exactamente una clave en `firmantes-permitidos`.
- Reglas **M15** (con `--resultados <dir>`) y **M16** en la matriz.
- `plan/tu.md` vacío con encabezado (estado de las TU, DT-04), protegido igual que `resultados.md`.
- `pruebas/firmantes-permitidos` **no** lo escribe el agente: lo agrega el usuario en TU-05 con un push firmado a `main`.

**Leer.** 07 §13.3 (M15 a M17), §22.2, §29.

**Archivos.** `tools/pruebas/firmas.sh`, `tools/pruebas/{matriz,reglas}.ts`, `plan/tu.md`.

**Pruebas primero.** **PRU-SEG-OPER-001**: los 4 casos de V7-17 y los 5 de V7-12 en un repositorio temporal con dos claves generadas en la prueba (`tools/pruebas/firmas.test.ts`, con `gpg.ssh.program=ssh-keygen`). Las mutaciones de M15 y M16 de V7-11.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-OPER-001|M15|M16"`; `bash tools/pruebas/firmas.sh origin/main`.

**Terminada cuando.** Los casos pasan y `firmas.sh` pasa sobre `main` con la clave de TU-05.

#### TA-010 `pr:mergear`, tamaño y resumen

```tarea
orden: 10
bloque: B0
hito: HT-0
depende: TA-009
tu: —
revision: obligatoria
paralelo: con TA-011
tamano: prod=395 archivos=5 ca=0 migraciones=0 total=820
cubre: P7-13, P7-18, DT-01, DT-05, DT-06, DT-14
pru: —
compartido: —
```

**Qué construir.**
- `tools/plan/tamano.ts`: clasificación y límites de DT-01 sobre `git diff --numstat`, con la clase **portado** de DT-14 (un archivo idéntico, byte a byte, a su fuente en `docs/anexos/` o a un bloque de código de `docs/` que nombra su ruta, no cuenta en producción, archivos ni total) y la excepción de DT-15 para la tarea que la declara.
- **[A2]** `pnpm plan:token`: verificación de TU-01 (`gh pr checks`, 403 en secretos, `git push --dry-run`, `pr:mergear --dry-run`) y aviso de vencimiento del token a 14 días (TU-20).
- `pnpm pruebas:resumen <features-base.json>` (07 §13.5).
- `pnpm pr:mergear <número> [--aprobado] [--dry-run]` (`--dry-run` hace todo menos el paso 6):
  1. `gh pr checks`: verde en `rapido` y `cierre`, y en `integracion` y `e2e` si corrieron;
  2. el diff no toca `pruebas/manuales/resultados.md`, `pruebas/firmantes-permitidos` ni `plan/tu.md`;
  3. tamaño (DT-01);
  4. revisión obligatoria (DT-05) por la tarea y por los archivos; sin `--aprobado`, no mergea;
  5. imprime el resumen de fichas que cambian de estado, manuales pendientes, pruebas cuyo título o datos cambiaron (RS7-09), cantidad de pushes y despliegue de emergencia pendiente (07 §31.5);
  6. `gh pr merge --squash` con `Tarea: TA-nnn` y, si corresponde, `Aprobado-por: usuario` en el mensaje.

**Leer.** 07 §6.3, §13.5, §22.2 (resumen), RS7-09; DT-01, DT-05 y DT-06 de este documento.

**Archivos.** `tools/plan/{tamano,mergear,token}.ts`, `tools/pruebas/resumen.ts`, `package.json` (scripts).

**Pruebas primero.** `tools/plan/tamano.test.ts` (clasificación de cada patrón de DT-01; un diff de 401 líneas de producción se rechaza) y `mergear.test.ts` con `gh` simulado: PR rojo, PR que toca `resultados.md`, obligatoria sin `--aprobado`, normal con un archivo de `.github/` (se trata como obligatoria).

**Comandos.** `pnpm test:unidad -t "tamano|mergear"`.

**Terminada cuando.** Los casos pasan (incluido un archivo portado idéntico que no cuenta y uno con una línea distinta que cuenta como producción), `pnpm plan:token` pasa con el token de TU-01 y esta misma tarea se mergea con `pr:mergear --aprobado`.

#### TA-011 Controles C1 y C2

```tarea
orden: 11
bloque: B0
hito: HT-0
depende: TA-003
tu: —
revision: obligatoria
paralelo: con TA-006, TA-007, TA-010
tamano: prod=300 archivos=3 ca=0 migraciones=0 total=520
cubre: C1, C2
pru: —
compartido: —
```

**Qué construir.**
- `tools/db/verificar-migraciones.mjs` (C1) desde `docs/anexos/03/`: nombres de carpeta, `_g_` sin objetos protegidos ni destructiva sin `-- finn:contraer`, `_m_` con `-- finn:manual` y con `finn.tomar_bloqueo()` si escribe datos.
- C2 en `tools/db/inmutabilidad.sh`: `git diff --diff-filter=MDR origin/main -- packages/db/prisma/migrations` vacío.
- `packages/db/prisma/migrations/migration_lock.toml`, sin migraciones todavía.

**Leer.** 03 §11.2, §11.4, §11.5, §11.6 (C1 y C2); `docs/anexos/03/tools/db/verificar-migraciones.mjs`.

**Archivos.** `tools/db/verificar-migraciones.mjs`, `tools/db/inmutabilidad.sh`, `packages/db/prisma/migrations/migration_lock.toml`.

**Pruebas primero.** `tools/db/controles.test.ts` con migraciones de control en `tools/lint/controles/migraciones/`: una `_g_` con `DROP` sin marca, una `_m_` sin `-- finn:manual`, una `_m_` que escribe sin el bloqueo, un nombre inválido; y un repositorio temporal con una migración editada para C2.

**Comandos.** `node tools/db/verificar-migraciones.mjs packages/db/prisma/migrations`; `bash tools/db/inmutabilidad.sh`; `pnpm test:unidad -t "C1|C2"`.

**Terminada cuando.** Pasan sobre el repositorio y cada control falla con su caso.

#### TA-012 Workflow `ci.yml`

```tarea
orden: 12
bloque: B0
hito: HT-0
depende: TA-005, TA-008, TA-010, TA-011
tu: TU-01, TU-02
revision: obligatoria
paralelo: no
tamano: prod=390 archivos=6 ca=0 migraciones=0 total=520
cubre: DP-10, DP-33, M5-fusion, WF-ci, SEG-gitleaks
pru: —
compartido: —
```

**Qué construir.**
- `.github/workflows/ci.yml` (07 §6.1 y §6.2) con los jobs:
  - **`rapido`**, que con **M5 activo** (DP-33) incluye `integracion` en el mismo job cuando corresponde. El job publica los dos resultados por separado (checks `rapido` e `integracion`), así la matriz y `pr:mergear` no se enteran de la fusión.
  - **`e2e`**: en PR listo con `afecta_web`, y siempre en `main`.
  - **`cierre`**: M15 con los informes de la misma corrida. En PR, solo si `features.json` pasa una ficha a `terminada`.
- `desplegar` **no** existe todavía (B5).
- Scripts `ci:rapido`, `ci:integracion` y `ci:e2e`: los workflows solo los llaman (DP-34). `ci:local` (DT-07). `ci:rapido` corre `plan:verificar`.
- Controles fijos de `rapido`:
  - `versiones.mjs`;
  - gitleaks fijado por versión y suma sobre el diff;
  - C1, C2 y `firmas.sh`.
- Concurrencia: `pr-<número>` con cancelación en PR; sin cancelación en `main`.
- `afecta_db` y `afecta_web` se publican desde `rapido`.
- Caché del almacén de pnpm y de los navegadores de Playwright.
- Permisos mínimos: a nivel del workflow, `contents: read`, `actions: read`, `pull-requests: read`. **Solo el job `rapido`** agrega `statuses: write`, para que `tools/ci/publicar-resultados.mjs` publique el estado de commit `integracion` cuando la fusión M5 lo corre. Ningún otro job tiene permisos de escritura. `gh pr checks` lista los estados de commit junto con los checks, así que `pr:mergear` lo lee igual. **[CH-16]**

**Leer.** 07 §6.1 a §6.3, §6.5 (M1 a M3), §32.2 (M5), §31.5 (DP-34); CH-02.

**Archivos.** `.github/workflows/ci.yml`, `tools/ci/{afecta,publicar-resultados}.mjs`, `package.json` (scripts `ci:*`), `.gitleaks.toml`.

**Pruebas primero.** `tools/ci/workflows.test.ts`, que lee el YAML y comprueba: los `needs`, la concurrencia, que cada job llame solo a `pnpm ci:<job>`, los permisos y que gitleaks esté fijado con suma. Un control: un secreto de prueba en `tools/lint/controles/secreto.txt` hace fallar gitleaks.

**Comandos.** `pnpm ci:local`; `pnpm test:unidad -t "workflows"`; el PR muestra los checks `rapido`, `integracion` y `cierre`.

**Terminada cuando.** La corrida del PR y la de `main` después del merge están en verde.

#### TA-013 Nocturno, minutos y cuarentena

```tarea
orden: 13
bloque: B0
hito: HT-0
depende: TA-012
tu: —
revision: obligatoria
paralelo: no
tamano: prod=390 archivos=5 ca=0 migraciones=0 total=760
cubre: WF-nocturno, M4-ahorro, DP-12, DP-36, DP-11-aviso, P7-5-persistencia, CH-02
pru: PRU-SEG-OPER-002
compartido: —
```

**Qué construir.**
- `.github/workflows/nocturno.yml`:
  - **Disparo:** lunes, miércoles y viernes a las 08:15 UTC, solo si `main` cambió.
  - **Primer paso:** `tools/ci/minutos.ts`, que siempre corre, aunque el resto se salte.
  - **Jobs del nocturno:** se agregan a medida que existen las suites (`escritorio`, `zona-distinta`, `webkit-parcial`, SW, REN, PROP 10.000, RES, mutantes).
- `tools/ci/minutos.ts` (07 §6.5 y §32.3):
  - suma los jobs del mes con `GITHUB_TOKEN` (`actions: read`) y redondea cada job hacia arriba;
  - proyecta al fin de mes e informa también la proyección sin M5;
  - calcula la **reserva pendiente**: respaldos que faltan × 3 + restauraciones que faltan × 5, y 0 mientras no exista producción;
  - decide el modo (`normal` o `ahorro`) y lo guarda en la caché de Actions con la clave `ci-modo-AAAAMM-<run_id>`.
- **CH-02:** el uso real por job se sube como artefacto `minutos-AAAAMM` (retención 90 días), no a `eventos_sistema`.
- `ci.yml` restaura el modo. En `ahorro`, `e2e` de PR corre solo al pasar a listo y el nocturno, 1 vez por semana. Nunca toca `respaldo` ni `restauracion`.
- `tools/pruebas/inestables.mjs` (07 §7.3): issue `prueba-inestable` por cada prueba `flaky` y entrada en `pruebas/cuarentena.json` a las 2 inestabilidades en 7 días. En `rapido`, una entrada vencida falla.
- `FINN_REN_ROJO` (07 §6.6): `rapido` falla si lleva más de 7 días activo.

**Leer.** 07 §6.4 a §6.6, §7.3, §32.2, §32.3; CH-02.

**Archivos.** `.github/workflows/nocturno.yml`, `.github/workflows/ci.yml` (restaurar el modo), `tools/ci/minutos.ts`, `tools/pruebas/inestables.mjs`, `tools/ci/minutos.fixture.json`.

**Pruebas primero.** **PRU-SEG-OPER-002** (07 §32.3) con `minutos.fixture.json`: con la reserva amenazada, M4 se activa y la lista de recortes no incluye `respaldo` ni `restauracion`; el YAML de esos dos workflows (cuando existan, B5) no tiene la condición de ahorro. El ejemplo de V7-07: 4 jobs de 2:31, 3:20, 11:00 y 20:01 dan 39 minutos; 700 minutos al día 12 proyectan 1.808 y activan `ahorro`.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-OPER-002|minutos|inestables"`; disparo manual del nocturno (`workflow_dispatch`).

**Terminada cuando.** Los casos pasan y una corrida manual del nocturno deja el artefacto de minutos y el modo en la caché.

#### TA-014 Resumen de revisión de `pr:mergear` y "Qué mirar" **[B2]**

```tarea
orden: 14
bloque: B0
hito: HT-0
depende: TA-010, TA-007
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=340 archivos=4 ca=0 migraciones=0 total=820
cubre: DT-20, DT-33
pru: —
compartido: —
```

**Qué construir.**
- `pnpm pr:mergear <número> --resumen`: hace las comprobaciones 1 a 5 de TA-010 sin mergear e imprime, en Markdown para pegar en el PR, las tres secciones de §1.5:
  - **Pruebas:** cada prueba nueva o cambiada del diff (por su título) con lo que cubre entre corchetes, cruzada con `cubre` y `pru` de la tarea; marca los objetivos sin prueba y las pruebas cuyo número esperado cambió (RS7-09).
  - **Tamaño y áreas:** medido frente a declarado; archivos de producción en áreas críticas con sus líneas; portados con fuente y huella.
  - **Desvíos:** archivos fuera del campo `archivos` de la ficha, dependencias npm nuevas, área crítica en una tarea `normal`, y si corresponde, "diff completo requerido" (migraciones, `CLAUDE.md`, `.claude/settings.json`).
- La regla de DT-20 en `tamano.ts`: solo los archivos de producción de un área crítica vuelven obligatoria una tarea.
- `pr:mergear` rechaza un PR cuyo informe no tenga la línea `Qué mirar:` o la tenga vacía o con "nada".
- **[F8] Aprobación (DT-33):** `--aprobado` exige `C:/finn/_aprobaciones/TA-nnn.json` (lo escribe el hook `.claude/hooks/aprobar.mjs` cuando el usuario escribe "mergeá TA-nnn"), con la tarea del PR y más nuevo que el último commit del PR; lo borra al mergear y copia su huella al mensaje del merge (`Aprobado-por: usuario (mensaje <huella>)`). Sin el archivo, no mergea. `--aprobado --terminal` es la alternativa sin hook: solo corre en una terminal interactiva (en tu ventana, nunca en Claude Code) y te pide escribir el número de tarea (§37.3).

**Leer.** §1.5 y §1.6 de este documento; 07 §13.5 y RS7-09.

**Archivos.** `tools/plan/{mergear,resumen-revision,tamano,aprobacion}.ts`.

**Pruebas primero.** **[F8]** Con el hook real en una sesión de Claude Code: "mergeá TA-999" escrito por el usuario crea el archivo, el mismo texto dicho por un subagente no lo crea, y `pr:mergear --aprobado` sin archivo, con el de otra tarea o con uno anterior al último commit no mergea (si el campo del mensaje en la entrada del hook no se llama `prompt`, se corrige el script, no la regla). `mergear.test.ts` con `gh` simulado: un PR sin "Qué mirar" se rechaza; uno con una migración pide el diff completo; uno con solo un archivo de escenarios en `packages/dominio/escenarios/datos/` queda `normal`; uno con un archivo de `calculo/` en una tarea `normal` se trata como obligatoria; el resumen marca un CA de `cubre` sin prueba.

**Comandos.** `pnpm test:unidad -t "mergear|resumen-revision"`; `pnpm ci:local`.

**Terminada cuando.** Los casos pasan y el PR de esta misma tarea lleva su propio resumen.

### 3.3 Paralelismo del bloque B0

| Tarea | Puede correr con |
|---|---|
| TA-001, TA-002 | Ninguna (raíz y documentos) |
| TA-003 | TA-004 (después de TA-003, misma configuración: en serie), TA-005 |
| TA-005 | TA-003 |
| TA-006, TA-007 | TA-011 |
| TA-009 | TA-010 no (depende); TA-011 sí |
| TA-012, TA-013 | Ninguna (CI) |

Con 2 agentes, B0 tiene 13 tareas en unas 9 rondas: 1; 2; 3 ∥ 5; 4 ∥ 11; 6; 7; 8 ∥ 9; 10; 12; 13.

---

## 4. Contenido de `CLAUDE.md` (DT-09)

Lo escribe TA-002 tal cual. Cambiarlo es una tarea de revisión obligatoria.

````markdown
# Finn 2.0 — instrucciones para agentes

Finn es una app personal de presupuesto base cero de un solo usuario. Este repositorio implementa un diseño cerrado. Vos implementás; no rediseñás.

## Fuentes de verdad

- `docs/` tiene los documentos aprobados con sus enmiendas. Precedencia: 00 > 01 > 02 > 03 > 04 > 05 > 06 > 07 > 08, y después `06-identidad-visual.md`.
- `docs/08-tareas.md` dice qué hacer y en qué orden. Tu tarea trae las secciones exactas que tenés que leer: leelas, y no leas documentos completos salvo que la tarea lo pida.
- `docs/anexos/` tiene prototipos y archivos verificados en fases anteriores. Si la tarea dice "portar desde anexos", partí de ese archivo; no lo reescribas de memoria.
- Prisma es la **versión 7**: documentación en https://www.prisma.io/docs/orm/v7 . Nunca uses Prisma 8 ni `@prisma/orm-*`.

## Si algo no cuadra

Si un documento contradice a otro, o la tarea pide algo que un documento prohíbe, **no lo resuelvas en el código**: detenete, escribilo en el informe como "Contradicción" con las dos citas y una propuesta de CH, y esperá. Nunca ajustes un número esperado para que una prueba pase: los números salen de los documentos y de las semillas (07 §12.1, DP-27).

## Cómo tomar una tarea

1. Tu tarea te la asigna el orquestador con su encargo (`pnpm plan:encargo TA-nnn`). No elegís otra.
2. Trabajás en el worktree que Claude Code creó para vos: `git fetch origin`, `git branch -m ta-nnn-<tema>` y `pnpm install --frozen-lockfile`. Nunca tocás `C:\finn\repo` fuera de tu worktree.
3. En `plan/tareas.json`, marcá la tarea `en_curso` con su rama.
4. Escribí primero las pruebas de `pru` (con el identificador al inicio del título y lo que cubren entre corchetes, 07 §2.1), después el código.
5. `pnpm ci:local` en verde. Recién entonces, push. **Máximo 2 pushes por PR.** El PR pasa a "listo" en el último push.
6. Último commit: `plan/tareas.json` en `terminada` con el número de PR; si cerrás una ficha, `pruebas/features.json` según 07 §27.
7. Descripción del PR = el informe (formato abajo).
8. No mergeás: dejás el PR listo, con el informe y la salida de `pnpm pr:mergear <número> --resumen`, y tu respuesta final al orquestador es ese informe. Nunca usás `--aprobado` ni `gh pr merge`.

## Reglas que no se discuten

- Tamaño: ≤ 400 líneas de producción, ≤ 12 archivos de producción, ≤ 10 CA, ≤ 1 migración, ≤ 1.200 líneas en total. Si no entra, pará y proponé cómo partirla.
- Ningún `eslint-disable` en reglas de frontera.
- `@finn/dominio` es puro: sin `Date`, reloj, `Math.random`, E/S ni Node.
- La interfaz no calcula montos (PF-3) ni guarda en caché datos del motor; nada de `"use cache"`.
- Solo `@finn/db` importa Prisma; solo `transacciones.ts` llama a `$transaction`.
- `Date.now()` y `new Date()` sin argumentos están prohibidos en `@finn/aplicacion` y `apps/web/src/app` (L20).
- Una migración aplicada en `main` no se edita nunca. Las `_m_` empiezan con `-- finn:manual`; las que escriben datos llaman antes a `finn.tomar_bloqueo()`.
- Los datos se corrigen con operaciones de `@finn/aplicacion`, nunca con SQL directo (DP-30).
- Nunca `pg_advisory_lock(`, `pg_try_advisory_lock(`, `SET ` sin `LOCAL` ni `set_config('finn.bloqueo_xact'` en `@finn/db` o `@finn/aplicacion`.
- `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` y `FINN_HOY_SIMULADO` solo existen en local y en CI.

## Lo que nunca hacés

- Tocar `pruebas/manuales/resultados.md`, `pruebas/firmantes-permitidos` o `plan/tu.md`. Son del usuario, con commits firmados.
- Desplegar: nada de `vercel deploy`, `vercel login`, `prisma migrate deploy` contra producción ni conexiones a la base real. Se despliega solo desde el job `desplegar`.
- Commitear secretos o archivos `.env`. La clave `service_role` de Supabase no existe para vos.
- Marcar una TU como hecha, ni dar por terminada una ficha con manuales pendientes como si contara para la puerta.
- Usar otra credencial de GitHub que el `GH_TOKEN` de `.claude/settings.local.json`: nada de `gh auth login`, `git credential` ni tokens copiados. Tampoco leer ese archivo.
- Leer o abrir `C:\finn\_privado\` o `~/.ssh/`, ni con las herramientas de archivos ni con un script. `C:\finn\_entrada\` se lee, nunca se escribe.
- Escribir en `C:\finn\_aprobaciones\` o aprobar una tarea en nombre del usuario: solo su mensaje "mergeá TA-nnn" en la sesión aprueba (DT-33).
- Buscar otra forma de hacer algo que `.claude/settings.json` te niega. Esas reglas repiten esta sección como barrera técnica (§4.1 del plan); si una te bloquea, parás y lo escribís en el informe.

## Pruebas y comandos

- Niveles y archivos: `docs/07-pruebas.md` §1 y §2.3. Una prueba vive en un solo nivel.
- `pnpm pruebas:ft FT-nn` te dice qué falta de una ficha.
- `pnpm test:integracion` necesita Docker Desktop encendido. La E2E local la corre un solo agente a la vez: `pnpm test:e2e` toma el candado (DT-22) y espera si otro lo tiene.
- Ninguna prueba usa el reloj de pared, `sleep` ni un orden implícito (07 §7.1).

## Rol del orquestador

Esta sección es para la sesión que coordina. Un subagente de tarea la ignora.

**Qué hacés.** Coordinás la ejecución del plan en `C:\finn\repo`: elegís tareas, lanzás un subagente por tarea con su encargo, revisás su informe, mergeás las normales con `pnpm pr:mergear` y le presentás al usuario las de revisión obligatoria. El estado vive en `plan/tareas.json` y en los PR: si tu contexto se llena o se cierra un hito, el usuario abre una sesión nueva con el mensaje inicial (`docs/08-tareas.md` §37.9) y retomás desde ahí.

**Qué no hacés.** No escribís código de producción, pruebas ni documentos (solo `plan/tareas.json` cuando una tarea queda `bloqueada`). No resolvés contradicciones. No marcás TU ni escribís en `plan/tu.md`. No aprobás en nombre del usuario. No reintentás con otro enfoque lo que un subagente dejó bloqueado.

**Cómo elegís y lanzás.**
1. `git fetch origin` y `pnpm plan:siguiente`: tareas disponibles (dependencias `terminada`, TU hechas), en orden, sin choques de `paralelo` ni de §31.
2. Hasta 3 subagentes a la vez (el límite está en `.claude/settings.json`); la E2E local la ordena el candado.
3. Por cada tarea: `pnpm plan:encargo TA-nnn` y lanzás el subagente que dice su campo **Modelo** (`tarea-opus` o `tarea-sonnet`, DT-32), en segundo plano, con el texto del encargo como único mensaje.
4. Si una tarea depende de una TU pendiente, se la recordás al usuario en tu resumen y seguís con otras.

**Cómo verificás el informe antes de mergear.**
1. El informe tiene todas las líneas del formato de abajo, con "Qué mirar" concreto (archivo y líneas).
2. `gh pr checks <n>` en verde y `pnpm pr:mergear <n> --resumen` sin objetivos de `cubre` sin prueba, sin archivos fuera de `archivos` sin explicar y con el tamaño dentro de DT-01.
3. "Contradicciones: ninguna". Si hay una, ver abajo.
4. Si algo falta, devolvés el PR al mismo subagente (o a uno nuevo con el mismo encargo y el PR) con lo que falta. Si una tarea de `tarea-sonnet` vuelve dos veces, la relanzás con `tarea-opus` (DT-32).
5. Normal y todo en orden: `pnpm pr:mergear <n>`, y borrás su worktree con `git worktree remove`.

**Cómo presentás una obligatoria.** Un mensaje por tarea, con: tarea y título; **Qué mirar** del informe; las pruebas creadas con lo que cubren; el resumen de `pr:mergear --resumen` (tamaño, archivos de áreas críticas, desvíos); el enlace al PR; y, si toca migraciones, `CLAUDE.md` o `.claude/settings.json`, la indicación de que el diff completo va en el paso 4 de §1.5. Terminás con: "Para aprobar, escribí: mergeá TA-nnn". Solo después de ese mensaje del usuario, nombrando esa tarea, corrés `pnpm pr:mergear <n> --aprobado` (DT-33). Un "sí", "ok" o un "mergeá" sin número no aprueban.

**Contradicciones.** Si un subagente reporta una contradicción: detenés esa tarea (`bloqueada` en `plan/tareas.json`, motivo "contradicción" y el PR en borrador), le pasás al usuario el CH propuesto con las dos citas, listo para llevar al Project, y seguís con las tareas que no dependen de ella. No la retomás hasta que el usuario diga cómo se resolvió.

**Resumen al usuario.** Al empezar y cada vez que cambia algo importante: hito actual, tareas en curso con su subagente, PR esperando revisión, tareas bloqueadas con su motivo y TU pendientes.

## Windows

Shell: Git Bash. Fin de línea LF. Rutas cortas en `C:/finn/`. Si `pnpm install` falla por rutas largas, avisá: es una TU.

## Informe (descripción del PR)

```
Tarea: TA-nnn — <título>
PR: #<n>
Revisión: obligatoria | normal
Modelo: opus | sonnet
Qué mirar: <archivo:líneas — lo más riesgoso del cambio y por qué; nunca "nada">
Hecho: <qué se construyó, en 3 a 6 líneas>
Pruebas creadas: <PRU-… [lo que cubre] uno por línea>
Resumen de pr:mergear: <salida de `pnpm pr:mergear <n> --resumen`>
Comandos: <comando → resultado>
Tamaño medido: prod=… archivos=… ca=… migraciones=… total=…
Pushes: <n>
Desvíos del encargo: <ninguno | qué y por qué>
Contradicciones: <ninguna | cita A, cita B, CH propuesto>
Sin verificar: <qué y por qué>
```
````

**Justificación.** Claude Code carga `CLAUDE.md` solo en cada sesión, así que las reglas llegan aunque el encargo no las repita. El contenido son las reglas que, rotas, no detecta una prueba (merge, despliegue, secretos, contradicciones) y las de frontera, con la sección de cada documento para profundizar. *Alternativas descartadas:* `AGENTS.md` (Claude Code no lo carga por sí solo); un archivo por paquete (las reglas comunes quedarían repetidas y desincronizadas).

### 4.1 Contenido de `.claude/settings.json` (DT-13) **[A2]**

**[F8]** Lo dejás vos en el commit inicial (TU-04), copiado de `arranque/.claude/settings.json` del zip de verificación, junto con los dos subagentes y el hook de §37.10. TA-002 lo comprueba con PRU-SEG-OPER-101, sin cambiarlo. Las reglas `Edit` de `.claude/settings.json`, `.claude/agents/**` y `.claude/hooks/**` impiden que un agente los edite; cambiarlos es un PR de revisión obligatoria con diff completo (§1.5).

**[F8] Cambios respecto de [A2]:**
- `C:\finn\_entrada\` pasa a ser legible (documentos y zips, DT-36); la lectura negada es la de `C:\finn\_privado\` (muestras sin anonimizar). `E:\finn-entrada\` desaparece.
- `Edit(.claude/**)` pasa a cuatro reglas concretas: así un subagente puede trabajar en su worktree, que vive en `.claude/worktrees/` (DT-34).
- Nuevas: `C:\finn\_aprobaciones\` sin escritura ni comandos (DT-33); el hook `UserPromptSubmit` de la aprobación; `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS = 3` (máximo de subagentes a la vez) y `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH = 1` (un subagente no lanza otros); `worktree.baseRef = "fresh"` (cada worktree sale de `origin/main`).

```json
{
  "env": {
    "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS": "3",
    "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "1"
  },
  "worktree": { "baseRef": "fresh" },
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/aprobar.mjs\"" } ] }
    ]
  },
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": [
      "Bash(vercel *)", "Bash(npx vercel *)", "Bash(pnpm dlx vercel *)", "Bash(pnpm exec vercel *)",
      "PowerShell(vercel *)", "PowerShell(npx vercel *)", "PowerShell(pnpm dlx vercel *)",
      "Bash(gh secret *)", "Bash(gh variable *)", "Bash(gh pr merge *)", "Bash(gh auth *)", "Bash(gh api *secrets*)", "Bash(gh api *variables*)",
      "PowerShell(gh secret *)", "PowerShell(gh variable *)", "PowerShell(gh pr merge *)", "PowerShell(gh auth *)",
      "Bash(git push * main)", "Bash(git push * HEAD:main)", "Bash(git push --force *)", "Bash(git push -f *)", "Bash(git push --force-with-lease *)",
      "Bash(git credential *)", "Bash(git config --global *)", "Bash(git config --system *)", "Bash(ssh-add *)", "Bash(ssh-keygen *)",
      "Bash(prisma migrate deploy *)", "Bash(pnpm prisma migrate deploy *)", "Bash(npx prisma migrate deploy *)",
      "Bash(supabase link *)", "Bash(supabase db push *)", "Bash(pnpm dlx supabase link *)", "Bash(pnpm dlx supabase db push *)",
      "Edit(pruebas/manuales/resultados.md)", "Edit(pruebas/firmantes-permitidos)", "Edit(plan/tu.md)",
      "Edit(.claude/settings.json)", "Edit(.claude/settings.local.json)", "Edit(.claude/agents/**)", "Edit(.claude/hooks/**)",
      "Read(.claude/settings.local.json)",
      "Read(//c/finn/_privado/**)", "Edit(//c/finn/_privado/**)",
      "Edit(//c/finn/_entrada/**)",
      "Edit(//c/finn/_aprobaciones/**)", "Bash(*_aprobaciones*)", "PowerShell(*_aprobaciones*)",
      "Read(~/.ssh/**)", "Edit(~/.ssh/**)",
      "Read(//c/Users/*/AppData/Roaming/GitHub CLI/**)", "Read(//c/Users/*/AppData/Roaming/com.vercel.cli/**)"
    ]
  }
}
```

**Qué protege y qué no.** Las reglas `deny` mandan sobre cualquier `allow` y se aplican a cada subcomando de un comando compuesto. Pero no son una frontera del sistema operativo. La documentación de Claude Code lo dice así:
- una regla de Bash compara el texto del comando, así que `Bash(git push * main)` no detecta `git -C . push origin main`;
- las reglas `Read` y `Edit` cubren las herramientas de archivos y los comandos que Claude Code reconoce (`cat`, `head`, `sed`…), pero no un script de Node o Python que abra el archivo por su cuenta;
- en Windows nativo no hay sandbox; existe en macOS, Linux y WSL2.

Por eso cada prohibición tiene además su barrera real:
- `pr:mergear` y la regla de trabajo para el merge;
- el job `desplegar` como único camino a producción;
- el token sin permisos de Secrets, Variables ni Administration (TU-01);
- las firmas de M17;
- las muestras sin anonimizar fuera del disco mientras un agente trabaja (TU-13, ahora en `C:\finn\_privado\` desmontada);
- **[F8]** la aprobación que solo escribe el hook de tu mensaje (DT-33).

Las reglas sirven para que un error del agente se detenga en el acto y quede a la vista.

*Alternativas descartadas:*
- Solo instrucciones en `CLAUDE.md`: ya están, pero no detienen nada.
- Un hook `PreToolUse` que analice cada comando: sería código propio de seguridad para mantener, con los mismos límites frente a un script.
- Correr los agentes en WSL2 para tener sandbox: cambia DT-10 y el entorno aprobado (P8-2).


---

## 5. Tareas del usuario (TU)

Cada TU dice cuándo hacerla, qué bloquea, los pasos en Windows y cómo se registra. "Bloquea" significa que la tarea citada no puede **mergearse** (o empezar, si se dice) sin la TU.

Registro: las TU con procedimiento `PRU-MAN` se registran en `pruebas/manuales/resultados.md`; las demás, en `plan/tu.md` (`| TU-nn | fecha | hecho | nota |`), siempre con commit firmado (TU-05). Antes de TU-05 no hay firma: TU-01 a TU-04 se registran cuando exista la clave.

### TU-01 Crear el repositorio y el token de los agentes

- **Cuándo:** primero. **Bloquea:** el inicio de TA-001.
- **Principio [A2]:** en la PC queda guardada **una sola credencial de GitHub**, la de los agentes, limitada a `finn-2`. Tus commits firmados (TU-05) usan esa misma credencial para el push. Lo que protege `resultados.md`, `firmantes-permitidos` y `plan/tu.md` es la firma con tu clave con contraseña, no la credencial. Lo que necesita más permisos (secretos y variables de Actions, configuración del repositorio) lo hacés en la web de GitHub, sin un `gh` con permisos completos guardado en disco.
- **Pasos:**
  1. En GitHub: New repository → nombre `finn-2` → **Private** → sin README, sin `.gitignore`, sin licencia y sin plantilla.
  2. Settings → General → Pull Requests: solo **Allow squash merging**; activar **Automatically delete head branches**.
  3. Settings → Actions → General: Actions permitidas; **Workflow permissions: Read repository contents**.
  4. Tu perfil → Settings → Notifications → Actions: activar el correo de **workflows fallidos** (CH-02 depende de esto).
  5. **Token de los agentes.** Tu perfil → Settings → Developer settings → Fine-grained tokens → Generate new token:
     - nombre `finn-2-agentes`, vencimiento **90 días** (lo renovás con TU-20);
     - Repository access: **Only select repositories → `finn-2`**;
     - permisos de repositorio, exactamente estos:

       | Permiso | Nivel | Para qué |
       |---|---|---|
       | Metadata | Read | Obligatorio en todo token |
       | Contents | Read and write | Push de ramas; merge con squash |
       | Pull requests | Read and write | Crear el PR, escribir el informe, mergear (`gh pr merge` dentro de `pr:mergear`) |
       | Workflows | Read and write | GitHub rechaza un push que cambia `.github/workflows/` sin este permiso (TA-012, TA-013 y las tareas de B5) |
       | Actions | Read | `gh run view` y los logs de una corrida |
       | Checks | Read | `gh pr checks` (corridas de check) |
       | Commit statuses | Read | `gh pr checks` (estados de commit) |
       | Issues | Read | Leer los issues `prueba-inestable` (07 §7.3) |

     - **Sin** Secrets, Variables, Administration, Environments, Deployments, Webhooks ni Codespaces. Sin permisos de cuenta.
  6. Guardá el token en el gestor de contraseñas.
  7. Clonar sin guardar credenciales en Windows: en PowerShell, `$env:GH_TOKEN = Read-Host "Token"` (lo que escribís en `Read-Host` no queda en el historial), después `gh repo clone <usuario>/finn-2 C:\finn\repo` y cerrar la ventana.
  8. En `C:\finn\repo`, credencial de git local al repositorio: `git config --local credential.helper ""` y `git config --local --add credential.helper "!gh auth git-credential"`. Así `git push` usa `GH_TOKEN` del entorno, y nada de GitHub queda en el Administrador de credenciales de Windows. Si ya hay una credencial de `github.com` ahí, borrala: Panel de control → Administrador de credenciales → Credenciales de Windows.
  9. Token en Claude Code: crear `C:\finn\repo\.claude\settings.local.json` con `{ "env": { "GH_TOKEN": "<token>" } }`. Ese archivo está en `.gitignore` (TA-001) y Claude Code lo lee en cada sesión del repositorio y de sus worktrees. **No** uses `gh auth login`.
- **Verificación (después de TA-010, y cada vez que renueves el token):** en una sesión de Claude Code, el agente corre `pnpm plan:token`. Ese comando comprueba que:
  - `gh pr checks` sobre el último PR responde;
  - `gh api repos/<usuario>/finn-2/actions/secrets` responde **403**;
  - `git push --dry-run` a una rama de prueba funciona;
  - `pnpm pr:mergear <n> --dry-run` llega hasta el paso de merge sin ejecutarlo.

  El resultado va en `plan/tu.md`.
- **Lo verificado y lo que no:** la documentación de GitHub confirma el permiso Checks (lectura) para tokens de grano fino en los endpoints de corridas de check. Que `gh pr merge` funcione con Contents y Pull requests en escritura es lo que dice la documentación de esos permisos; lo comprueba el `--dry-run` de arriba y, en la práctica, el merge de TA-010.
- **Nada del plan usa el repositorio de la 1.0** (revisión en §8.1).

### TU-02 Verificar que la 1.0 no gasta minutos

- **Cuándo:** antes de TA-012. **Bloquea:** TA-012 (los minutos son por cuenta, 07 §6.4).
- **[A2] La 1.0 no tiene workflows** (P8-14). Esta TU solo lo verifica, desde la web de GitHub, porque el token de los agentes no tiene acceso a ese repositorio:
  1. Repositorio de la 1.0 → pestaña **Actions**: no hay workflows, o todos aparecen desactivados.
  2. Tu perfil → Settings → Billing → Usage: la 1.0 no gasta minutos este mes.
- **Resultado:** sin workflows en la 1.0. Si apareciera alguno, desactivalo desde la web (Actions → el workflow → "Disable workflow").

### TU-03 Preparar la PC con Windows

- **Cuándo:** antes de TA-001. **Bloquea:** TA-001.
- **Pasos (PowerShell como administrador donde se indica):**
  1. Git for Windows actualizado; `git --version`. Como administrador: `git config --system core.longpaths true` y `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`.
  2. `git config --global core.autocrlf false`.
  3. Node 24 LTS (instalador oficial o `nvm-windows`); `node --version` empieza con `v24`. `corepack enable`.
  4. **Docker Desktop ya instalado** (P8-2): verificar la versión con `docker version`. Settings → General → **Use the WSL 2 based engine** activado.
  5. **Memoria de WSL2 [A2].** En `%UserProfile%\.wslconfig`:
     ```
     [wsl2]
     memory=<M>GB
     processors=<P>
     ```
     - **Regla:** M = la mitad de la RAM de la PC, redondeada hacia abajo, con un **mínimo de 6 GB** y un máximo de 16 GB. P = la mitad de los núcleos lógicos, mínimo 2.
     - **Mínimo absoluto: 6 GB.** Alcanza para un PostgreSQL de Testcontainers, la pila mínima de Supabase (`db`, `auth`, `kong`) y un `next build` a la vez.
     - **Con 12 GB de RAM o menos** (M = 6): un solo agente a la vez con Docker. El segundo agente puede hacer tareas sin `integracion` ni E2E (dominio puro, lint, documentos).
     - **Con 16 GB o más** (M ≥ 8): dos agentes con Docker, uno solo con E2E (P8-5).
     - Después: `wsl --shutdown` y reiniciar Docker Desktop. Comprobar con `wsl -e free -g` que el total coincide.
  6. Python 3 (oráculo de 07 §3.1): `py --version`.
  7. Claude Code instalado, con Git Bash como shell. `gh --version` (sin `gh auth login`, TU-01).
  8. Carpetas `C:\finn\repo`, **[F8]** `C:\finn\_entrada`, `C:\finn\_privado` (vacía: es el punto de montaje de TU-13) y `C:\finn\_aprobaciones`, fuera de OneDrive. `C:\finn\wt` ya no se usa (DT-34).
- **Resultado:** `docker run --rm public.ecr.aws/docker/library/postgres:17 postgres --version` funciona en Git Bash. La RAM total y M van a `plan/tu.md`.

### TU-04 Carpeta de entrada y commit inicial **[F8]**

- **Cuándo:** después de TU-01 y TU-03, antes de abrir el orquestador. **Bloquea:** TA-001 y TA-002. **TA-002 no empieza sin la carpeta completa y sin `anexos.ts` en verde sobre los archivos reales** (los 34 citados, con los 52 íconos, los 7 glifos y los tokens).
- **Qué dejás en `C:\finn\_entrada\`** (DT-36; solo material del diseño, nada sensible; los agentes lo leen y no lo escriben):
  1. Los 9 documentos: `00-decisiones.md`, `01-dominio.md`, `02-tecnologias.md`, `03-base-de-datos.md`, `04-backend.md`, `05-frontend.md`, `06-features.md`, `07-pruebas.md` y `08-tareas.md`, en su versión del Project (con las enmiendas [F8]).
  2. `05-anexo-encargo-claude-design.md`.
  3. `06-identidad-visual.md`.
  4. El documento de producto: `Finn 2.0 — Características, Funciones y Mejoras.md`.
  5. La verificación de 04 y 05 del Project. **[CH-09]** Se entregó como zips, no como `.md`: `04-backend-verificacion.zip` y `05-frontend-verificacion-A.zip` a `05-frontend-verificacion-D.zip`.
  6. Los zips de verificación de las fases 3 a 8, con su nombre original: al menos uno por fase, cuyo nombre empieza con `03-` a `08-` (el de la Fase 8 es `08-tareas-verificacion.zip`). **[CH-09]** El de la Fase 3 es `finn-fase3-base-de-datos.zip`, que no empieza con `03-`.
  7. `finn-entrega.zip` (trae `finn-marca.zip` adentro).
  8. `08-tareas-verificacion.zip` además **descomprimido** en `C:\finn\_entrada\08-tareas-verificacion\`: el orquestador usa de ahí `anexos.ts` y `encargo.ts` antes de TA-002 (§37.8).
- **Comprobación, antes de TA-001:** en Git Bash, `node C:/finn/_entrada/08-tareas-verificacion/tools/plan/anexos.ts --plan C:/finn/_entrada/08-tareas.md --anexos C:/finn/_entrada --entrada --negativo` debe terminar en `RESULTADO: PASA`. Comprueba la lista de arriba, los 34 archivos citados en las tablas del plan (abriendo los zips, también `finn-marca.zip` dentro de `finn-entrega.zip`), 52 íconos en `iconos/` y 7 glifos en `iconos/estados/`. Lo corre el orquestador al arrancar (§37.8) y se detiene si falla. **Si falta un archivo: aviso, nunca reconstrucción desde los `.md`** (§36.3).
- **Commit inicial** (en `C:\finn\repo`, que TU-01 dejó vacío): copiar la carpeta `arranque/.claude/` del zip de verificación a `C:\finn\repo\.claude\` (`settings.json`, `agents/tarea-opus.md`, `agents/tarea-sonnet.md`, `hooks/aprobar.mjs`; §37.10), y después `git add .claude/settings.json .claude/agents .claude/hooks`, `git commit -S -m "Inicio: permisos, subagentes y hook de aprobación"` y `git push origin main`. Con eso `main` existe (los worktrees salen de ahí) y las barreras rigen desde la primera sesión. `settings.local.json` (TU-01) no se versiona.
- **[A2]** Las muestras sin anonimizar nunca van a `_entrada` (TU-13).
- **Resultado:** **[CH-12]** la salida de `anexos.ts` va en la descripción del PR de TA-002, y vos la copiás a `plan/tu.md` con tu primer commit firmado (TU-05); `docs/anexos/INDICE.md` del PR de TA-002 lista cada archivo.

### TU-05 Clave SSH de firma

- **Cuándo:** antes de mergear TA-009. **Bloquea:** TA-009 (el control falla sin exactamente una clave).
- **Pasos:** los 6 de 07 §29.2 (PRU-MAN-OPER-001), en `C:\finn\repo`, en una ventana tuya fuera de Claude Code. **[A2]** La clave privada queda en `%UserProfile%\.ssh\finn_resultados`, con contraseña y fuera del agente de Windows; `.claude/settings.json` niega su lectura (TA-002), y aun si un proceso la leyera, sin la contraseña no puede firmar. El paso 4 es el primer commit firmado y push directo a `main` de `pruebas/firmantes-permitidos`. Antes de TA-009 el archivo no está protegido, pero ya debe ir firmado.
- **Registro:** primera fila de `resultados.md` (PRU-MAN-OPER-001), después de TA-008. Si la firma no funciona en Windows, avisás antes de buscar otra alternativa (P7-20).

### TU-06 Crear el proyecto de Supabase

- **Cuándo:** al empezar la Parte B. Cuanto antes, para fijar `PG_MAYOR`. **Bloquea:** el merge de TA-050, que fija `PG_MAYOR` con la versión que informes (**[A2]**), y TU-07.
- **Pasos:**
  1. supabase.com → New project → organización personal, plan **Free**, región **East US (North Virginia)**, nombre `finn-2`. Contraseña de la base generada por el gestor de contraseñas.
  2. SQL Editor: `SHOW server_version_num;`. Anotá la versión mayor; el agente la pone en `versiones.env` (H-01).
  3. Authentication → Providers → Email: activado. **No** desactives el registro todavía (H-10 lo usa con un usuario de prueba).
  4. Anotá en el gestor: referencia del proyecto, host del pooler (Settings → Database → Connection string), URL del proyecto y clave publicable. La `service_role` **no** se copia a ningún lado (04 §12.6).
- **Resultado:** proyecto activo y la versión mayor informada en la conversación.

### TU-07 Prueba de humo H-01 a H-12

- **Cuándo:** cuando TA-253 esté mergeada (**[A2]**: `humo.sh` se completa en TA-250 y TA-253). **Bloquea:** HT-4 y el primer despliegue (SP-02).
- **Dónde [A2]:** en **una ventana de Git Bash tuya, abierta fuera de Claude Code**, con ninguna sesión de Claude Code corriendo en ella. La clave `service_role` existe **solo en esa sesión de shell**: no se escribe en archivos, en `.env` ni en el historial, y la ventana se cierra al terminar. Ningún agente ejecuta la prueba de humo ni ve la clave.
- **Pasos:**
  1. `cd /c/finn/repo && git pull`.
  2. Definir las variables de esa sesión sin que queden en el historial: `read -rs HUMO_ADMIN_URL; export HUMO_ADMIN_URL` (lo mismo con `SUPABASE_SERVICE_ROLE`, copiada del panel en el momento y solo para H-10, y con `VERCEL_TOKEN`, de vida corta y solo para H-09). `HUMO_REF`, `HUMO_POOLER_HOST` y `SUPABASE_URL` no son secretos.
  3. `bash tools/humo/humo.sh | tee /c/finn/humo.jsonl`. La salida no tiene secretos (04 §17.1).
  4. Pegar la salida en la conversación.
  5. Cerrar la ventana. Revocar el token de Vercel. Rotar la `service_role` en el panel si dudás de dónde estuvo.
  6. Después de H-10: Authentication → Sign In / Providers → **desactivar** "Allow new users to sign up"; crear el usuario único (Authentication → Users → Add user) y anotar su `id` (`FINN_USUARIO_ID`).
- **Registro:** PRU-MAN-ESQ-001 en `resultados.md`, firmado, con la versión mayor y las alternativas aplicadas en la nota.

### TU-08 Reservada

Número reservado (DT-02).

### TU-09 Crear el proyecto de Vercel

- **Cuándo:** antes de TA-260 (`desplegar`, Parte C). **Bloquea:** esa tarea y HT-5.
- **Principio [A2]:** ninguna sesión de Vercel queda guardada en la PC. Nada de `vercel login`. El proyecto se vincula con un token de vida corta que se revoca al terminar. Es la misma regla de CT-09 para el despliegue de emergencia.
- **Pasos:**
  1. vercel.com, plan Hobby → Account Settings → Tokens → crear un token `finn-2-alta`, con alcance de tu cuenta y **vencimiento de 1 día** (el más corto que ofrezca el panel).
  2. En una ventana de PowerShell tuya, fuera de Claude Code, desde `C:\finn\repo`:
     - `$env:VERCEL_TOKEN = Read-Host "Token"` (no queda en el historial);
     - `pnpm dlx vercel@<versión fijada> link --yes --project finn-2 --token $env:VERCEL_TOKEN`. Crea el proyecto y escribe `.vercel/project.json`, que está en `.gitignore`. Anotá `orgId` y `projectId`.
  3. Revocar el token en el panel y cerrar la ventana.
  4. En el panel del proyecto:
     - Settings → Git: **sin repositorio conectado** (ADR-10).
     - Settings → Environment Variables: casilla **Automatically expose System Environment Variables** activada (07 §4.3).
     - Cargar en **Production**, desde la web, las variables de 04 §14.2: `DATABASE_URL` (`finn_app`, 6543), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `FINN_USUARIO_ID`, `CRON_SECRET`, `RESPALDO_SECRET`, las VAPID (TU-10), `FINN_CONCILIACION_CLAVES`, `FINN_CONCILIACION_CLAVE_ACTIVA`, `FINN_CARGA_INCREMENTAL=off` y `FINN_WEBHOOK_FORMATO=json`.
     - **Nunca** `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` ni `FINN_HOY_SIMULADO`, en ningún entorno.
  5. **Token para CI:** otro token, `finn-2-ci`, con **alcance del proyecto** y el vencimiento más largo que aceptes (lo renovás con TU-20). Va **solo** a los secretos de GitHub, cargado desde la web (TU-12); nunca a un archivo de la PC.
  6. **Comprobación final:** en una ventana nueva de Git Bash, `pnpm dlx vercel@<versión> whoami` debe **fallar** con "no credentials". Además, no existe `%AppData%\com.vercel.cli\Data\auth.json`, o no tiene token.
- **Secretos aleatorios:** en Git Bash, `openssl rand -base64 32` (no `Get-Random`, que no es criptográfico).

### TU-10 Claves VAPID

- **Cuándo:** con TU-09. **Bloquea:** el primer despliegue (la configuración las exige al arrancar, 04 §14.2).
- **Pasos:** en Git Bash, `pnpm dlx web-push generate-vapid-keys --json`; la pública va en `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, la privada en `VAPID_PRIVATE_KEY` (secreta) y `VAPID_SUBJECT=mailto:<tu correo>`, todas en Vercel. La privada también va al gestor de contraseñas.

### TU-11 Cloudflare R2 y clave de `age`

- **Cuándo:** antes de la tarea de B5 que activa `respaldo.yml` (**[C]** TA-261), después del primer despliegue. **Bloquea:** esa tarea, TA-263 y HT-6.
- **Pasos:**
  1. Cuenta de Cloudflare → R2 → registrar el medio de pago → Billing → **alerta en $0** (o el mínimo que permita); anotá el umbral (ADR-22).
  2. Bucket `finn-respaldos`, privado, sin dominio `r2.dev`. Reglas de ciclo de vida: `diarios/` a los 30 días, `mensuales/` a los 365.
  3. API token de R2 con **Object Read & Write** limitado a ese bucket.
  4. `age` para Windows (binario oficial): `age-keygen -o finn-age.txt`; la clave privada va al gestor de contraseñas; borrá el archivo.

### TU-12 Secretos de GitHub Actions

- **Cuándo:** por grupos, antes de la tarea que los usa. **Bloquea:** las tareas de B5 (`desplegar`, `respaldo`, `restauracion`: **[C]** TA-260, TA-261 y TA-263) y TA-180 (`FINN_ULTIMOS4_REALES`).
- **Pasos [A2]:** desde la **web**: `finn-2` → Settings → Secrets and variables → Actions → New repository secret. El token de los agentes no tiene el permiso Secrets, así que ningún agente puede leerlos ni escribirlos. Los secretos son los de 04 §14.2:
  - `DIRECT_URL`, `RESPALDO_DB_URL`;
  - `VERCEL_TOKEN` (el `finn-2-ci` de TU-09), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`;
  - `AGE_PUBLIC_KEY`, `AGE_PRIVATE_KEY`;
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`;
  - `FINN_URL`, `RESPALDO_SECRET`;
  - `FINN_ULTIMOS4_REALES` (07 §23: los últimos 4 dígitos reales de tus tarjetas y cuentas, separados por comas).
- **Nunca:** la `service_role`.

### TU-13 Muestras del BAC (SP-01, parte 1)

- **Cuándo:** al empezar la Parte B, para que la reescritura del formato del BAC llegue antes del primer despliegue (P8-6). **Bloquea:** el merge de TA-181 (formatos del BAC); TA-182 y TA-183 usan los CSV si ya llegaron. Por arrastre, HT-5.
- **Dónde están las muestras sin anonimizar [A2].** En Windows nativo, Claude Code no tiene sandbox del sistema operativo. La documentación de Claude Code lo dice: el sandbox existe en macOS, Linux y WSL2. La regla `Read` de `.claude/settings.json` (TA-002) bloquea las herramientas de archivos y los comandos que Claude Code reconoce (`cat`, `head`…), pero no un script de Node o Python que abra el archivo por su cuenta. Por eso la protección real es que **las muestras sin anonimizar no estén en el disco mientras un agente trabaja**:
  1. **[F8]** Guardalas en una carpeta cifrada que solo montás para este paso (un VHDX con BitLocker), montada en la carpeta vacía `C:\finn\_privado\` (DT-36), o en una memoria USB que copiás ahí y borrás al terminar. Nunca en `C:\finn\_entrada\` ni en el repositorio. `settings.json` niega su lectura, pero la protección real es que esté desmontada mientras un agente trabaja.
  2. Con ningún agente corriendo, en una ventana tuya: `node tools/pruebas/anonimizar.ts C:/finn/_privado C:/finn/repo` (TA-180). Escribe solo las salidas anonimizadas en `packages/sms/pruebas/muestras/` y `packages/conciliacion/pruebas/muestras/`, y genera `pruebas/muestras-cobertura.json` (CH-03).
  3. Expulsá la memoria USB o desmontá la carpeta cifrada.
  4. Revisá a mano el resultado. `git grep -nE "[0-9]{13,19}"` no debe encontrar nada.
  5. Commit firmado de las salidas en una rama `muestras-bac`. El agente de TA-181 parte de esa rama. PRU-SEG-BAND-002 corre en `rapido`.
- **Qué juntar:**
  - SMS del BAC de todos los tipos que tengas (compra, pago a tarjeta, depósito, devolución, avance, rechazo), uno por bloque separado por una línea vacía, en `C:\finn\_privado\sms\bac.txt`;
  - los CSV del BAC (tarjeta de crédito y débito o ahorro, los que tengas) en `C:\finn\_privado\csv\`.
- **`FINN_ULTIMOS4_REALES`** en los secretos (TU-12): PRU-SEG-BAND-002 lo usa.
- **Registro:** `plan/tu.md` con los tipos de SMS y formatos de CSV incluidos. `muestras-cobertura.json` es lo que verifica la puerta.

### TU-14 Muestras de Banco Agrícola y exclusiones (SP-01, parte 2)

- **Cuándo:** cuando tengas los SMS de Banco Agrícola. **Bloquea:** TA-470 (reescritura y activación de F-2, Parte D) y, por CH-03, la puerta (HT-9).
- **Pasos [A2]:**
  1. SMS de Banco Agrícola: el mismo procedimiento de TU-13, con `C:\finn\_privado\sms\agricola.txt`.
  2. **CSV de Banco Agrícola:** comprobá en su banca en línea si permite descargar estados de cuenta en CSV, para tarjeta y para débito o ahorro.
     - Si lo permite: descargalos y seguí el procedimiento de TU-13.
     - Si no lo permite: fila firmada en `resultados.md`, `exclusión SP-01 | csv:agricola_<formato> | el banco no ofrece CSV`, una por cada formato de Agrícola de ADR-17 que no tengas (tarjeta del portal, CSV convertido desde PDF, débito o ahorro). Esas cuentas se verifican con FT-44 (verificar saldo).
  3. **Cuscatlán (P8-13):** dos filas firmadas, `exclusión SP-01 | institucion:Cuscatlán | sin cuentas` y `exclusión SP-01 | csv:cuscatlan_tarjeta | sin cuentas`. F-3 queda inactivo (§6).
- **Registro:** las filas de exclusión en `resultados.md` y las muestras en `muestras-cobertura.json`. `pruebas:puerta` las cruza (CH-03).

### TU-15 MacroDroid y prueba en el teléfono (SP-04)

- **Cuándo:** después de HT-5, con FT-03 y FT-34 desplegadas. **Bloquea:** HT-6.
- **Pasos:** configuración de 04 §8.8 con la URL de producción y el token de `/ajustes/webhook`; la prueba en el teléfono de 04 §8.8 (comillas y saltos de línea; reintento con una ruta inexistente; volver a la URL correcta), elegir la variante del cuerpo y fijar `FINN_WEBHOOK_FORMATO` en Vercel si es la B.
- **Registro:** PRU-MAN-BAND-001 firmado, con la variante y el plan de reintentos en la nota.

### TU-16 Pruebas manuales por ficha

- **Cuándo:** según el disparador de cada procedimiento de `pruebas/manuales.md`, cuando `pr:mergear` las muestre como pendientes.
- **Lista:** PRU-MAN-ACCESO-001 (FT-02), PRU-MAN-BAND-002 (FT-78), PRU-MAN-NOTIF-001 (FT-70), PRU-MAN-BAND-003 y 004 y PRU-MAN-CONC-001 (muestras), PRU-MAN-CTA-001 (FT-55), PRU-MAN-PWA-001 (TalkBack) y PRU-MAN-PWA-002 (NVDA) al cerrar cada hito.
- **Registro:** pasos 5 y 6 de 07 §29.2.

### TU-17 Ensayo del despliegue de emergencia (condición 6)

- **Cuándo:** antes de HT-9, con producción estable. **Bloquea:** HT-9.
- **Pasos:** 3 a 11 de 07 §31.5 con el commit que ya está en producción y motivo `ensayo` (PRU-MAN-OPER-002).

### TU-18 Abrir la puerta y las 8 semanas

- **Cuándo:** HT-9. **Pasos:**
  1. Fila firmada `puerta abierta` con la fecha `F`.
  2. Cada semana, durante 8 semanas, verificar el saldo de cada cuenta con su banco: PRU-MAN-CTA-002 (CH-04).
  3. Ante un error de dinero, 07 §31.

### TU-19 Apagar la 1.0

- **Cuándo:** el día `fin_primeras_semanas`, sin incidentes de integridad.
- **Pasos:**
  1. **[A2] Antes de apagar, exportar los datos de la 1.0** como archivo de referencia: la exportación de la propia app de la 1.0, si la tiene, o un `pg_dump --format=custom` de su proyecto de Supabase con la cadena de conexión copiada en ese momento en una ventana tuya.
  2. Cifrar el archivo con tu clave de `age` (TU-11): `age -r <clave pública> -o finn-1.0-<fecha>.dump.age finn-1.0-<fecha>.dump`, y borrar el original.
  3. Guardarlo **fuera de los dos repositorios y fuera de `C:\finn\`**, por ejemplo en tu almacenamiento personal en la nube o en la memoria USB de TU-13.
  4. Comprobar que se puede descifrar (`age -d`) antes de seguir.
  5. Seguir con PRU-MAN-OPER-003 (07 §31.4) desde su paso 3: pausar el proyecto de Supabase de la 1.0 y quitar su despliegue de Vercel.
- **Registro:** fila firmada de PRU-MAN-OPER-003 con el nombre y la suma SHA-256 del archivo cifrado en la nota.

### TU-20 Renovar los tokens

- **Cuándo:** antes de que venzan: el de los agentes cada 90 días (TU-01) y el de Vercel para CI cuando lo indique su vencimiento (TU-09). `pnpm plan:token` avisa 14 días antes, porque lee la fecha de vencimiento de la cabecera `github-authentication-token-expiration`.
- **Pasos:** generar uno nuevo con los mismos permisos, reemplazarlo en `.claude/settings.local.json` (agentes) o en el secreto `VERCEL_TOKEN` (CI, desde la web), revocar el anterior y repetir la verificación de TU-01.

---

## 6. SP-01 parcial (DT-12, P8-6)

### 6.1 Qué se hace

| Pieza | Con muestras del BAC (TU-13) | Sin muestras (Agrícola, Cuscatlán) |
|---|---|---|
| Formatos de SMS | Migración `_m_formatos_bac`: reescribe F-1 con las muestras (pasa la política de 04 §8.5) y agrega filas para los tipos del BAC que tengan muestras (depósito, pago, devolución) | La **misma** migración pone F-2 y F-3 en `activo = false` (DB-17: los formatos no se eliminan) |
| Adaptadores de CSV | Se implementa `extraer` solo para los formatos con muestras (04 §9.2) | El adaptador no se registra; un CSV de ese banco se rechaza con "formato no reconocido" (OP-45). FT-44 (verificar saldo) cubre esas cuentas |
| SMS en producción | Se interpretan | Llegan como `no_reconocido` (CA-73.5) y se registran a mano (FT-38) |
| Más adelante (TU-14) | — | Migración `_m_formatos_<banco>` que reescribe y reactiva |

La desactivación va en una migración y no con OPT-05, que es lo que pediste. El motivo: `politica-patrones` corre en la base de CI construida desde las migraciones, **antes** del primer despliegue, cuando todavía no hay app para usar OPT-05. Después del despliegue, OPT-05 puede reactivar un formato solo si pasa `validarFormato`; los de 03 §9.5 no pasan (CA-73.1), así que no hay forma de reactivarlos por error sin reescribirlos.

### 6.2 Confirmación contra QC-3, RS-03 y 07 §30

| Documento | Qué dice | ¿Permite desplegar? |
|---|---|---|
| 04 QC-3 y §14.1 | `politica-patrones` valida "todos los formatos activos que quedan" y es requisito solo de `desplegar` | **Sí**: con F-2 y F-3 inactivos, la política evalúa solo F-1 reescrito |
| 04 RS-03 y 07 §23 | Si las muestras no llegan, "la decisión de desactivar F-1..F-3 es de la Fase 8" | **Sí**: esta es esa decisión (DT-12) |
| 04 SP-01 | Las muestras son "los tres bancos, todos los tipos de movimiento" y "los seis formatos de CSV" | Es el requisito completo; se cumple con TU-14 |
| 07 §30, condición 2 | Muestras recibidas y anonimizadas; PRU-MAN-BAND-003, 004 y PRU-MAN-CONC-001 en "pasa"; los CA ⚠ (S6-1) con pruebas reescritas | **Riesgo de abrir en falso**, abajo |

**Desplegar: sí, sin CH.** **La puerta: hace falta CH-03.** La condición 2 se comprueba hoy con las filas firmadas de `resultados.md`. Con solo las muestras del BAC, PRU-MAN-BAND-004 ("cada formato reescrito pasa la política y reconoce sus muestras") se cumple literalmente, porque el único formato reescrito es F-1. PRU-MAN-BAND-003 y PRU-MAN-CONC-001 también podrían registrarse en "pasa" con las muestras que hay. `pruebas:puerta` no sabe qué bancos cubren las muestras, así que la puerta se abriría con dos bancos sin interpretar.

**CH-03 (§7)** hace verificable la cobertura de SP-01:
- `anonimizar.ts` escribe `pruebas/muestras-cobertura.json`, con las instituciones y tipos de SMS que tienen muestras y los formatos de CSV con muestras;
- la condición 2 exige, además, al menos un formato activo y reescrito con muestras por cada institución de 03 §9.4, y muestras para cada uno de los seis formatos de CSV de ADR-17;
- `pruebas:puerta` lo comprueba.

Si alguna institución o formato no te aplica (pregunta P8-13), el mismo archivo lo declara con una fila firmada en `resultados.md`, y la condición la excluye.

---

## 7. Cambios propuestos a documentos aprobados (CH)

Se aplican al cerrar la fase, con la marca **[F8]** y su línea en "Enmiendas posteriores". **Los ocho están aplicados** (§36.2).

| CH | Qué cambia | Documentos y secciones | Estado |
|---|---|---|---|
| **CH-01** | Suites afectadas por la estructura de 04 §1.2. 07 §13.6, punto 1, y el supuesto 2 de 07 §16.2 pasan a: "una operación vive en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` y una consulta en `packages/aplicacion/src/consultas/<pantalla>.ts` (04 §1.2)". El script resuelve la operación por el patrón `**/OP-nn-*.ts` | 07 §13.6, §16.2 | **Aprobado** (revisión de la Parte A) |
| **CH-02** | `main` en rojo y uso por job sin escribir en la app. En 07 §6.3, la tercera barrera pasa a "Si `ci.yml` falla en `main`, GitHub envía el correo de workflow fallido (TU-01, paso 4); no hay push ni evento". En 07 §6.5, el último párrafo pasa a "el nocturno sube el uso real por job como artefacto `minutos-AAAAMM` (90 días); la Parte D fija los valores con esos datos". Sin cambios en 03 ni 04 | 07 §6.3, §6.5 | **Aprobado** (revisión de la Parte A) |
| **CH-03** | Cobertura verificable de SP-01 en la puerta (§6.2). `pruebas/muestras-cobertura.json` lo genera `anonimizar.ts` (TA-180). La condición 2 de 07 §30 pasa a exigir: (a) **SMS:** un formato activo reescrito con muestras reales por cada institución de 03 §9.4 que se use. Hoy: el BAC (TU-13) y Banco Agrícola (TU-14); la puerta espera las muestras de Agrícola. Cuscatlán queda excluido con la fila firmada `exclusión SP-01 \| institucion:Cuscatlán \| sin cuentas` y F-3 queda inactivo. (b) **CSV:** muestras de cada formato de ADR-17 de las instituciones usadas, o su exclusión firmada: los del BAC con muestras; los de Agrícola con muestras si el banco ofrece CSV, y si no, excluidos con su fila firmada y verificados con FT-44; el de Cuscatlán, excluido. `pruebas:puerta` cruza `muestras-cobertura.json` con las filas de exclusión. 04 SP-01 recibe una línea en sus Enmiendas sin cambiar el requisito | 07 §23, §30; 04 SP-01 | **Aprobado** (P8-13) |
| **CH-04** | Falta un procedimiento: 07 §31.1 cita **PRU-MAN-CTA-002** (verificar saldo semanal durante 8 semanas, firmado), pero 07 §22.1 no lo lista y la matriz lo rechazaría (M7, referencia inexistente; M16, manual inexistente). Se agrega a §22.1: cubre §31.1; Android o PC con la app de cada banco; disparador semanal entre `F` y `fin_primeras_semanas`; resultado esperado: diferencia cero o explicada en FT-44 | 07 §22.1 | **Aprobado** (revisión de la Parte A) |
| **CH-05** **[A2]** | Identificadores completos para la suite del pooler. En 07 §5.3, POOL-01 a POOL-05 pasan a **PRU-INT-POOL-001**, **PRU-INT-POOL-002**, **PRU-INT-POOL-003**, **PRU-INT-POOL-004** y **PRU-INT-POOL-005** (002 y 004 ya se citaban así en 07 §19.5 y §21); PRU-INT-POOL-006 (V-05) no cambia. Sin cambio de contenido | 07 §5.3 | **Aprobado** (revisión de la Parte B) |
| **CH-06** | **Contradicción entre 07 y 04 (§16.5).** 07 §19.1 define PRU-SEG-NOTIF-001 como "`X-Finn-Accion` con firma alterada, vencida o de clave retirada: rechazada (V-26)", y 07 §18 (área `NOTIF`) habla de "la carga firmada de las acciones (HMAC, vencimiento, versión de clave; V-26)". En 04, las acciones de notificación no llevan firma: el Route Handler exige `Origin`, la cabecera `X-Finn-Accion` y sesión AAL2 con `getUser()` (04 §11.5, BE-54). V-26 verificó la **carga firmada de la conciliación** (04 §9.6, BE-49). Propuesta: (a) PRU-SEG-NOTIF-001 pasa a "acción de notificación sin `Origin` de la app, sin `X-Finn-Accion` o sin AAL2: rechazada (BE-54)", sin cita a V-26; (b) prueba nueva **PRU-SEG-CONC-001**: "carga firmada de la conciliación válida, de otra cuenta, alterada, vencida, con la clave anterior y con una versión retirada (BE-49, V-26)"; (c) en 07 §20.1, V-26 pasa a tener como destino PRU-SEG-CONC-001; (d) en 07 §18, la fila `NOTIF` pierde la cita a la carga firmada y la fila `CONC` la gana | 07 §18, §19.1, §20.1 | **Aprobado** (P8-16): 04 manda; sin firma HMAC en las acciones de notificación |
| **CH-07** **[D]** | Dependencias de las fichas (P8-19.1). En 06 §2.0, la fila **Dependencias** pasa a: "Features que tienen que existir antes. **De construcción**: la ficha no se puede construir sin ellas. **De datos**: la ficha se construye y se prueba con el estado sembrado por operaciones; los CA afectados quedan pendientes de punta a punta hasta que exista la ficha que produce ese estado (07 §13, CH-08)". Las fichas FT-03, FT-04, FT-08, FT-16, FT-19, FT-34, FT-35 y FT-54 marcan cuáles de sus dependencias son de datos (las de DT-26, §19.7) | 06 §2.0 y esas 8 fichas | **Aprobado** (P8-19.1); **aplicado [F8]** |
| **CH-08** **[D]** | Pendientes de punta a punta en la matriz (DT-27). 07 §13 agrega `pruebas/pendientes-e2e.json` y la regla: una ficha que completa pendientes no pasa a `terminada` sin una E2E que cite cada CA; `features.json` marca esos CA de la ficha [I] como `pendiente_e2e`. 07 §27 agrega la condición. 07 §30 agrega a la puerta: "ningún CA pendiente de punta a punta, salvo los de fichas [P]" | 07 §13, §27, §30 | **Aprobado** (P8-19.1); **aplicado [F8]** |
| **CH-09** | Nombres de la entrega real (arranque de TA-002). (1) La verificación de 04 y 05 llegó como `04-backend-verificacion.zip` y `05-frontend-verificacion-{A,B,C,D}.zip`, no como `.md`, y eso satisface TU-04 punto 5. (2) El zip de la Fase 3 es `finn-fase3-base-de-datos.zip` (no empieza con `03-`) y satisface TU-04 punto 6. (3) `contraste.py` (§23.2, TA-201, PRU-DOM-PWA-001) es en la entrega `prototipos/tokens.py` de `05-frontend-verificacion-D.zip` (versión [R3]); TA-201 lo porta como `tools/pruebas/contraste.py`. `tools/plan/anexos.ts` cambia `ENTRADA_MD` y el patrón del zip de la Fase 3, y lee la cita nueva de §23.2 | 08 TU-04 (puntos 5 y 6), §23.2; `tools/plan/anexos.ts` | **Aprobado por el usuario** (arranque de TA-002); **aplicado [CH-09]** en TA-002 |
| **CH-10** | Tamaño de TA-002: §1.1 clasifica `docs/**` como dato, que suma al total de DT-01, y TA-002 copia los documentos y los zips sin cambios. En DT-14, un archivo de `docs/` o de `docs/anexos/` copiado byte a byte de `C:\finn\_entrada\` o de un zip de la entrega es portado y no suma al total | 08 §11.2 (DT-14) | **Aprobado por el usuario** (TA-002); **aplicado [CH-10]** en TA-002 |
| **CH-11** | "Terminada cuando" de TA-002 decía que `plan:siguiente` lista TA-003, TA-005 y TA-011, pero TA-011 depende de TA-003. Pasa a "lista TA-003 y TA-005"; TA-011 no cambia | 08 TA-002 | **Aprobado por el usuario** (TA-002); **aplicado [CH-11]** en TA-002 |
| **CH-12** | TU-04 pedía que TA-002 registrara la salida de `anexos.ts` en `plan/tu.md`, que `CLAUDE.md` (§4) y §4.1 le prohíben tocar. La salida va en la descripción del PR de TA-002 y el usuario la copia a `plan/tu.md` con su primer commit firmado (TU-05) | 08 TU-04 | **Aprobado por el usuario** (TA-002); **aplicado [CH-12]** en TA-002 |
| **CH-13** | Creación de `resultados.md`: TA-008 lo pedía, pero `CLAUDE.md`, §4.1 y M17 lo prohíben a los agentes; lo crea el usuario con su primera fila firmada | 08 TA-008 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-13]** en TA-008 |
| **CH-14** | Orden del reparto D2. 03 §5.4, 01 §4.1 conv. 2 y `cronologico` de TA-104 ordenan por (fecha, clave de orden, secuencia, orden de línea); 01 §4.5 paso 3, 02 RT-09 y PRU-DOM-MOTOR-104 de TA-105 decían otra cosa. Se unifica en (fecha, clave de orden, secuencia de creación, orden de línea) | 01 §4.5 (paso 3); 02 RT-09; 08 TA-105 (PRU-DOM-MOTOR-104) | **Aprobado por el usuario** (TA-105); **aplicado [CH-14]** en TA-105 |
| **CH-15** | Excepción de tamaño registrada. En §1.1, "No hay excepciones por comentario." pasa a: una excepción se registra solo con `pr:mergear <n> --excepcion-tamano "<motivo>"`; en una tarea normal con un exceso de hasta el 30 % la aplica el orquestador por la regla permanente del usuario; en una obligatoria, o con un exceso mayor, solo con `--aprobado` tras la aceptación del usuario en la sesión; motivo y medidas en el commit de merge (`Excepción-tamaño:`). El límite de migraciones no admite excepción; DT-15 no cambia | 08 §1.1 (DT-01) | **Aprobado por el usuario** (TA-014); **aplicado [CH-15]** en TA-014 |
| **CH-16** | Permisos de `ci.yml` con M5. Un job produce un solo check, así que publicar `integracion` desde `rapido` (07 §32.2, DP-33) requiere `statuses: write`, que la lista de permisos mínimos de TA-012 no tenía. Permisos a nivel del workflow: `contents: read`, `actions: read`, `pull-requests: read`; solo el job `rapido` agrega `statuses: write`, para que `tools/ci/publicar-resultados.mjs` publique el estado de commit `integracion`; ningún otro job escribe. `gh pr checks` lista los estados de commit junto con los checks. Descartado: un job `integracion` reflejo con `needs: rapido` (~85 min/mes, anula el ahorro de DP-33) | 08 TA-012 (Qué construir, permisos) | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-16]** en TA-012 |
| **CH-17** | Tercer redondeo para los modelos de préstamo. 01 §0.4, 02 RT-07 y ADR-15 decían que solo hay dos redondeos, y A.2 (reglas 2 y 3) divide el interés y el seguro. 01 §0.4 agrega: el interés y el seguro de cada cuota se redondean al centavo con la mitad hacia arriba, derivados informativos sin efecto presupuestario (A.1, Límites); "Ninguna otra regla divide montos" pasa a "Ninguna otra regla del motor divide montos". RT-07 y ADR-15 pasan a tres redondeos: `redondear(B × num / den) = ⌊(2·B·num + den) / (2·den)⌋` para B·num ≥ 0, en `bigint` dentro de `centavos.ts` (interés: num = tasa en millonésimas × d_k, den = 365 × 10⁶, DB-13; seguro: num = S₁, den = M). TA-111 agrega a **Archivos** `valores/centavos.ts` y `hechos/operaciones.ts`; PRU-DOM-CTA-101 cubre el borde del redondeo. No cambia ningún número de A.2 | 01 §0.4; 02 RT-07, ADR-15; 08 TA-111 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-17]** en TA-111 |
| **CH-18** | Ruta de los scripts de trazabilidad portados. TA-252 los porta a `tools/docs/`, pero 04 §18.4 decía `tools/ci/trazabilidad.py` y 05 §15 y §16, `tools/ci/` para `cobertura.py` y `trazabilidad.py`: quedaban dos scripts distintos con la misma ruta. 04 §18.4 (BE-63) pasa a `tools/docs/t17.py` (portado del zip), que `pnpm docs:comprobar` corre en `rapido` cuando el diff toca `docs/`; 05 §15 y §16 pasan a `tools/docs/fase5/trazabilidad.py` y `tools/docs/fase5/` (con `cobertura.py`); en TA-252, **Archivos** cambia "`.github/workflows/ci.yml` (paso condicional)" por "`tools/ci/afecta.mjs` (paso condicional de `rapido`, DP-34) y `package.json` (script)". Solo documentos | 04 §18.4; 05 §15, §16; 08 TA-252 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-18]** en TA-252 (corrección) |
| **CH-19** | Dónde vive el diferencial contra el oráculo. TA-112 pedía `packages/dominio/test/diferencial.prop.test.ts`, que lanza `motor_min.py` con `python -I`, pero 02 ADR-21 prohíbe E/S y módulos de Node en `@finn/dominio` (ESLint y dependency-cruiser lo aplican también a sus pruebas) y 07 §1.1 da a `PROP` la frontera de `DOM` (sin E/S). El diferencial pasa a `tools/pruebas/oraculo/diferencial.prop.test.ts`, junto al oráculo (07 §3.1, CT-05), nivel `PROP` del proyecto `unidad`; importa `calcular` y `hechosArb` por ruta relativa y `fast-check` 4.10.2 se agrega a la raíz. 07 §1.1 (fila `PROP`, "Dónde vive") y §19.4 (`FINN_MUTANTE` lo lee solo `vitest.config.ts`; L20 no lo cubre) se enmiendan; en TA-112 cambia **Archivos**. Sin excepciones de lint ni de depcruise | 07 §1.1, §19.4; 08 TA-112 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-19]** en TA-112 |
| **CH-20** | Cuarto redondeo para el reparto de los reportes. TA-129 implementó el reparto por resto mayor de 06 §3.5.3 (FD-19: cada parte es la proporcional truncada y los centavos que faltan van a las partes con el resto mayor) en `selectores/reportes/ritmo.ts`, con productos y restos de montos en `bigint` fuera de `centavos.ts`, pero 01 §0.4 dice "Ninguna otra regla del motor divide montos", 02 RT-07 y ADR-15 hablan de tres redondeos y ADR-21 deja a `centavos.ts` como único módulo que divide montos. 01 §0.4 agrega al "Redondeo" el reparto por resto mayor de los reportes, informativo y sin efecto presupuestario; RT-07 y ADR-15 pasan a cuatro: `⌊m·w_i / W⌋` en `bigint` dentro de `centavos.ts` y los centavos que faltan a los restos `(m·w_i) mod W` mayores, con el desempate que da el llamador. `Centavos.repartirPorRestoMayor` lo implementa y `repartir` de `ritmo.ts` la llama sin aritmética propia; PRU-DOM-VAL-103 cubre la suma exacta, el resto empatado y un producto mayor que 2^53. No cambia ningún número de PRU-PROP-REP-002 | 01 §0.4; 02 RT-07, ADR-15 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-20]** en TA-129 (corrección) |
| **CH-21** | `migrate deploy` en el arnés antes de que existan las migraciones de B1. TA-050 pide "`prisma migrate deploy` como `finn_migraciones` sobre `finn_plantilla`" y que la prueba pase en CI, pero el criterio de HT-1 dice "La migración 15 (formatos del BAC, TA-181) llega en B3", y esa migración ya está en `main` (#23) mientras las de TA-051 no: sobre la plantilla, `20261025000000_m_formatos_bac` falla con `ERROR: function finn.tomar_bloqueo() does not exist` (`tomar_bloqueo` la crea `m_funciones`, y `finn.formatos_bancarios`, `g_tablas`); además, la CLI de Prisma y `packages/db/prisma.config.ts` son archivos de TA-051. TA-050 deja el contenedor, el bootstrap, los roles de Supabase, `finn_plantilla` con el esquema `finn` de `finn_migraciones`, un gancho `prepararPlantilla(url)` sin migraciones y `crearBasePrueba()`; PRU-INT-ESQ-101 crea su propia tabla en cada base. TA-051 completa el gancho con `migrate deploy` y C3, C5 y C6 (`tools/db/plantilla.ts`) y agrega la CLI `prisma`. En TA-181, la dependencia de TA-051 queda como nota y no en `depende`, porque `plan:verificar` (S5) no acepta una tarea `terminada` con una dependencia `pendiente`; sus carpetas (20261011…) ordenan antes que 20261025, así que `migrate deploy` las aplica bien. En TA-050, **Archivos** usa el `vitest.config.ts` de la raíz (07 §2.3: un solo archivo con los proyectos) en lugar de `packages/db/vitest.config.ts`. 07 §5.2 no cambia: describe el job completo, que queda armado con TA-051 | 08 TA-050, TA-051, TA-181; criterio de HT-1 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-21]** en TA-050 |
| **CH-22** | La imagen de PostgreSQL de `integracion` en CI. 07 §5.2 (paso 1) pide "la imagen oficial servida desde `public.ecr.aws/docker/library/postgres`. Docker Hub limita las descargas anónimas por dirección IP y los runners comparten direcciones", y RS7-01 de 07 dice "si fallan, se corrige el workflow antes de la primera feature". En los PR de TA-050 (#80, #81), ECR anónimo también corta: `toomanyrequests: Data limit exceeded` y, con el run relanzado, `(HTTP code 404) No such image: public.ecr.aws/docker/library/postgres:17`. Resolución: `infra/versiones.env` fija `PG_IMAGEN_DIGEST` (digest del índice multiplataforma; `versiones.mjs` lo exige con formato `sha256:<64 hex>`); `rapido`, solo cuando corre `integracion` y antes de `ci:integracion`, restaura con `actions/cache` un `docker save` con clave `pg-<PG_MAYOR>-<digest>`; si no está, `docker pull` de ECR por digest con 3 intentos y espera creciente, y si fallan, del espejo oficial `mirror.gcr.io/library/postgres` por el mismo digest (contenido idéntico byte a byte); después `docker tag` a `public.ecr.aws/docker/library/postgres:<PG_MAYOR>`, para que Testcontainers la use sin bajarla, y `docker save` para la caché. La regla de 07 se mantiene: la fuente primaria es ECR y nunca se baja por tag desde otro registro (lo comprueba `tools/ci/workflows.test.ts`) | 07 §5.1, §5.2 (paso 1), RS7-01; 08 TA-050 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-22]** en TA-050 |
| **CH-23** | `m_formatos_bac` no aplica con `prisma migrate deploy`. 03 §11.3, punto 2, dice: "`prisma migrate deploy` como `finn_migraciones` con `DIRECT_URL`. Aplica las carpetas pendientes en orden de nombre, cada una en una transacción"; pero CLAUDE.md y 03 §11.2 dicen "Una migración aplicada en `main` no se edita nunca", y TA-051 pide que C3 aplique desde cero las 9 carpetas, incluida `20261025000000_m_formatos_bac` (TA-181, #23). En TA-051, con Prisma 7.10 nativo y PostgreSQL 17, las 8 carpetas de 03 y EN-2 aplican y la novena falla: `Database error code: FN001` / `ERROR: finn: escritura en formatos_bancarios sin el bloqueo global (ADR-06)`. `migrate deploy` no aplica la carpeta en una sola transacción, y el `SELECT finn.tomar_bloqueo();` suelto (bloqueo de transacción) ya no existe cuando llega el `UPDATE`; con `psql -1 -f` el mismo archivo aplica. Resolución: (1) `m_formatos_bac` se corrige una sola vez: el bloqueo y los dos `UPDATE` van en un único `DO $$ BEGIN PERFORM finn.tomar_bloqueo(); … END $$;`, con las mismas filas escritas que el original con `psql -1` (comparadas en TA-051); nunca se aplicó en ninguna base; (2) C2 (`tools/db/inmutabilidad.sh`) permite solo esa modificación (M), con el SHA-256 del archivo nuevo fijado en el script; cualquier otro cambio sigue fallando; (3) C1 (`verificar-migraciones.mjs`) rechaza una `_m_` que escribe en tablas [M] o [H] fuera de un `DO` que tome antes `finn.tomar_bloqueo()`, con controles negativos `m-bloqueo-suelto` y `m-bloqueo-tarde`; (4) 03 §10.5 y §11.3 quedan enmendados (RK-06). `CLAUDE.md` no cambia | 03 §10.5, §11.2, §11.3, §11.6 (C1, C2); CLAUDE.md; 08 TA-051, TA-181 | **Aprobado por el usuario** (en la sesión: "Aprobar CH-23"); **aplicado [CH-23]** en TA-051 |
| **CH-24** | La parte 3 de R15 no puede dar 0 filas en TA-056. 08 §TA-056 pide "PRU-ESQ-RELOJ-003: R15 da 0 filas en la plantilla", pero 07 §4.4 (tabla de conteo, fila 03 §10.1) reparte el cambio en dos migraciones: `m_reloj` ("funciones y cuerpo nuevo de `purgar_eliminaciones`") y `g_instantes_ahora` ("los 9 `DEFAULT`, generada por Prisma"), que es TA-057. Hasta TA-057, los 9 `DEFAULT CURRENT_TIMESTAMP` de `g_tablas` violan la parte 3 ("ningún `DEFAULT` con reloj directo"); el prototipo de la Fase 7 de `m_reloj` trae además los 9 `ALTER … SET DEFAULT finn.ahora()`, que dejarían C4 en rojo. Resolución: (1) TA-056 entrega R15 con las partes 1, 2 y 4 (cuerpos de producción exactos de `ahora()` e `instante()`; ningún reloj directo en funciones fuera de `ahora`, `instante` y `hoy`; ausencia de `finn.desfase()`): PRU-ESQ-RELOJ-003 comprueba 0 filas en la plantilla y un control negativo con 2 violaciones de esas partes (una función nueva con `now()` y el cuerpo de `finn.ahora()` alterado); `m_reloj` se porta del prototipo sin los 9 `ALTER … SET DEFAULT`, y todo lo demás queda igual; (2) TA-057 agrega la parte 3 de R15 en el mismo PR que `g_instantes_ahora`, extiende el control negativo de PRU-ESQ-RELOJ-003 con un `DEFAULT CURRENT_TIMESTAMP` sembrado (V7-02 P10) y suma `tools/db/regla-r15.sql` a sus archivos; si TA-057 termina con el respaldo b) de 07 §32.1, la parte 3 nace con la excepción de las 9 columnas. La definición de R15 y los números de 07 no cambian | 08 TA-056, TA-057; 07 §4.4 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-24]** en TA-056 |
| **CH-25** | Solo lectura de `leer()` y la regla de `SET ` sin `LOCAL`. 04 §5.1 (paso 2) y V-07 piden `SET TRANSACTION READ ONLY` como primera sentencia de `leer()` en `packages/db/src/transacciones.ts`, pero 07 §19.5 y §5.3 (PRU-ESQ-POOL-001), 08 ("Reglas que no se discuten" y TA-058) y `CLAUDE.md` prohíben `SET ` sin `LOCAL` en `@finn/db` y `@finn/aplicacion`, y `tools/lint/bloqueos-sesion.mjs` rechaza esa sentencia. Resolución (opción b): `leer()` usa `SET LOCAL transaction_read_only = on`, sentencia de control equivalente que tampoco toma la instantánea y vale solo para la transacción; PRU-INT-ESQ-006 comprueba `repeatable read`, `transaction_read_only = on` y `25006`. La regla de `SET ` sin `LOCAL`, el lint y `CLAUDE.md` no cambian | 04 §0.7 (V-07), §5.1; 08 TA-150 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-25]** en TA-150 |
| **CH-26** | Partición de TA-128 por tamaño (DT-02). El código de TA-128 midió prod≈1.148 y total≈1.902 contra una estimación de 320 y 760: pasa DT-01 por más del 30 %. Se parte en cuatro (cada una con prod ≤ 520 y total ≤ 1.560): TA-128 conserva `sugerencia.ts` y la `Propuesta` extendida (CF-05); TA-232, `bandeja.ts` (BE-41, CF-22); TA-233, `formulario.ts` parte 1; TA-240, `formulario.ts` parte 2. TA-140, TA-172 y TA-173 pasan a depender de la última parte que necesitan. El código completo queda en la rama `ta-128-origen-completo` (commit 103fcf9) | 08 §1.2 (DT-02); 08 TA-128, TA-232, TA-233, TA-240, TA-140, TA-172, TA-173 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-26]** en TA-128 |
| **CH-28** | La regla de dependency-cruiser no reconoce `import type`. 04 §1.3 dice: "`@finn/db` → `dominio` (API): solo tipos"; pero `.dependency-cruiser.cjs` (`db-dominio-solo-tipos`, con `dependencyTypesNot: ['type-only']`) no resuelve los paquetes del workspace (`@finn/dominio` con `exports` a `.ts`), les asigna el tipo `unknown` y marca también un `import type { Hechos } from '@finn/dominio'` (comprobado en TA-152). Además, TA-152 pedía que una prueba de `packages/db/test` llamara a `calcular`, un valor de dominio que 04 §1.3 prohíbe a `@finn/db`. Resolución: (1) `.dependency-cruiser.cjs` resuelve los paquetes del workspace (`tsConfig`, `enhancedResolveOptions` con `exportsFields` y `conditionNames`) y usa `tsPreCompilationDeps: 'specify'`, de modo que un `import type` cuenta como `type-only` en todas las reglas "solo tipos" (db, sms, conciliación y web); la regla sigue igual de estricta para los valores y no hay excepciones por ruta; (2) controles `db-valor-de-dominio` (falla con `db-dominio-solo-tipos`) y `db-tipo-de-dominio` (limpio), con el espacio de trabajo mínimo en `tools/lint/controles.test.ts`; (3) PRU-INT-MOTOR-101 pasa a `packages/aplicacion/test/cargar.int.test.ts`, que sí puede importar `calcular`; los hechos los escribe un ayudante de `packages/db/test/ayudantes`, porque aplicación no ve Prisma; (4) `@finn/db` exporta `cargarHechos`. 04 §1.3 no cambia | 04 §1.3, §1.5; 08 TA-152 | **Aprobado por el usuario** (delegado en el orquestador); **aplicado [CH-28]** en TA-152 |

---

## 8. Revisiones de la Parte A

### 8.1 El plan no depende del repositorio de la 1.0

| Qué se revisó | Resultado |
|---|---|
| Código | Ninguna tarea copia ni importa código de la 1.0 (00: proyecto nuevo) |
| Datos | Sin migración (CF-14) |
| Workflows y minutos | La cuota es por cuenta: TU-02 desactiva los de la 1.0. Si mantenés su respaldo, cuesta unos 60 minutos al mes (V8-02) |
| Supabase | La 1.0 conserva su proyecto (segundo cupo gratuito) hasta TU-19; la 2.0 usa uno nuevo (TU-06) |
| Vercel | Proyecto nuevo (TU-09); la 1.0 sigue en el suyo como referencia |
| Secretos | Todos nuevos (TU-09 a TU-12); ninguno se reutiliza de la 1.0 |
| Formatos de SMS y CSV | 03 §9.5 y ADR-17 parten de los patrones y firmas de la 1.0 como datos ya transcritos en los documentos; ningún archivo se lee del repositorio de la 1.0 |

### 8.2 Archivos de los zips que cita la Parte A

**[A2]** Los zips **siguen sin llegar**: la conversación solo recibió las capturas del diseño. Los documentos 01 a 07 sí están ahora completos en disco, leídos con la herramienta del proyecto (06 ya llega entero, 404.670 bytes), y V8-01 y V8-03 corren contra ellos (§9). Estos son los archivos de los zips que cita la Parte A; los de la Parte B están en §16.4:

| Archivo | Zip | Lo usa |
|---|---|---|
| Prototipo de la matriz (`matriz.ts` o equivalente) y su inventario sintético | 07 | TA-006, TA-007 |
| `firmas.sh` y los casos de V7-12 y V7-17 | 07 | TA-009 |
| `minutos.ts` y el JSON de ejemplo de V7-07 | 07 | TA-013 |
| `verificar-migraciones.mjs` | 03 | TA-011 |
| `tokens.css`, `tokens.json`, íconos y marca | `finn-entrega.zip`, zip de la marca | Parte C (**[C]** detalle en §23.2) |

---

## 9. Verificación de la Parte A

**Entorno:** Node 22.22.0 (este entorno no tiene Node 24; el script usa solo lo que Node 24 trae y corre con la eliminación de tipos de Node 22), Python 3.13. Archivos y salidas en `08-tareas-verificacion.zip`.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V8-01 | Script `tools/plan/verificar.ts` sobre esta Parte A (`--parte A`), con control negativo | **Pasa.** 13 tareas, 1 hito con bloque (HT-0), 19 TU, 90 objetivos de la Parte A, cada uno con exactamente una tarea dueña. Sin ciclos, sin dependencias hacia adelante, tamaños dentro de DT-01, HT-0 alcanzable con sus TU. **Control negativo: 10 de 10 mutaciones detectadas**, cada una por su regla: objetivo sin dueño (E8), ciclo (E4), dependencia posterior (E5), tamaño (E6), hito inalcanzable (E7), tarea duplicada (E1), dependencia inexistente (E2), PRU inexistente (E9), dos dueños (E8), TU inexistente (E3) | El primer intento marcó `gitleaks` como objetivo desconocido: el lector de objetivos solo acepta identificadores que empiezan con mayúscula. Se renombró a `SEG-gitleaks` en el plan y en el catálogo. HT-1 a HT-9 todavía no tienen bloque `hito`: el script los informa como aviso y se completan en B, C y D | El catálogo de objetivos y el extracto de 07 estaban transcritos (P8-12). **[A2]** Repetida contra los documentos en disco, con el catálogo generado: pasa (§17, V8-01). Node 24 (corrió en Node 22.22) |
| V8-02 | Minutos y meses con 3,75 y 2 pushes por PR (`tools/plan/estimacion.ts`) | **Tareas:** 186 a 247 (178 a 235 hasta la puerta). **3,75 pushes por PR:** 35,6 min por PR; 40 PR al mes (limita el tope de 150 pushes; con producción, 37 bajo 1.700); **4,7 a 6,2 meses** hasta la puerta. **2 pushes por PR:** 25,8 min por PR; 51 PR al mes con producción bajo 1.700 min (55 sin producción; 63 con la cuota completa); **3,4 a 4,5 meses**. Control del modelo: con 3,75 pushes y 40 PR da 1.794 min, frente a 1.804–1.834 de 07 §32.2 | **Con 2 pushes por PR, lo que limita ya no son los pushes sino los minutos**: 51 PR al mes usan unos 102 pushes y 1.686 min. Bajar más los pushes rinde poco; cada merge a `main` cuesta 12,5 min (la mitad del costo del PR). Mantener el respaldo de la 1.0 en Actions resta 2 PR al mes (P8-14) | Tiempos reales del runner y del primer mes (07 §6.5); el ritmo real de los agentes y de tus revisiones, que puede ser menor que el de la CI |
| V8-03 | Identificadores PRU citados en la Parte A frente a 07 | **23 de 23** identificadores están en 07 (extracto con la fila o la cita de cada uno). PRU-MAN-CTA-002 solo aparece citado en 07 §31.1, no en la lista de §22.1: el script lo acepta únicamente porque CH-04 lo nombra. Control: sin esa mención, falla con E9 en TA-008 | **CH-04**: 07 cita un manual que no define. 07 no tiene un identificador PRU completo para POOL-01 a POOL-05 (los nombra dentro de la suite PRU-INT-POOL); HT-1 los cita así | **[A2]** Repetida contra 07 en disco (§17, V8-03) |
| V8-04 | Prueba de la plantilla de encargo | Parte D | — | — |

---

## 10. Preguntas de la Parte A (resueltas)

| # | Respuesta | Dónde quedó |
|---|---|---|
| P8-12 | a): zips y `.md` de 01 a 07 como archivos | Los `.md` están en disco (§8.2) y V8-01 y V8-03 corren contra ellos. Los zips no llegaron: P8-15 |
| P8-13 | Sin cuentas de Cuscatlán (F-3 inactivo, excluido con fila firmada); Banco Agrícola sí, y la puerta espera sus SMS; CSV solo del BAC, y TU-14 comprueba si Agrícola ofrece CSV | CH-03 aprobado, TU-14, §6 |
| P8-14 | No aplica: la 1.0 no tiene workflows. TU-02 queda como verificación; TU-19 exporta los datos de la 1.0 antes de apagarla | TU-02, TU-19 |

---

# Parte B — Base de datos, dominio y aplicación

## 11. Decisiones de la Parte B y de la revisión de la Parte A

### 11.1 DT-13: permisos de Claude Code como segunda barrera **[A2]**

`.claude/settings.json` repite como reglas `deny` lo que `CLAUDE.md` prohíbe (§4.1), y PRU-SEG-OPER-101 (TA-002) comprueba que sigan ahí. No es una frontera del sistema operativo: en Windows nativo no hay sandbox, y las reglas de Bash comparan texto. Cada prohibición conserva su barrera real (§4.1). *Alternativas descartadas:* las de §4.1.

### 11.2 DT-14: clase "portado" en la medida del tamaño **[A2]**

Buena parte de B1 y B2 copia archivos ya verificados: migraciones, `schema.prisma`, `catalogo.sql`, el oráculo, el prototipo de los escenarios, `recorridos.py` y `estado_a7.py`. Copiarlos no es escribir código, pero DT-01 los contaría como producción. `tamano.ts` (TA-010) agrega una clase:
- **Portado:** un archivo idéntico, byte a byte, a su fuente. La fuente es un archivo de `docs/anexos/` (los zips) o, si no está en los zips, el contenido de un bloque de código de `docs/0n-*.md` cuya sección nombra esa ruta. Por ejemplo, las migraciones de 03 §10.4 y la de EN-2 en 04 §10.2.
- **[CH-10]** También es portado un archivo de `docs/` o de `docs/anexos/` copiado byte a byte de `C:\finn\_entrada\` o de un zip de la entrega.
- No cuenta en producción, archivos ni total. `pr:mergear` informa cada portado con su fuente y su huella.
- Una sola línea distinta lo vuelve producción.

**Justificación.** El revisor no necesita volver a leer lo que ya se verificó en una fase anterior, y la huella prueba que es lo mismo. *Alternativas descartadas:* subir el límite de las tareas que portan (no distingue copiar de escribir); partir una migración portada en varias tareas (C6 compara contra el conjunto completo).

### 11.3 DT-15: excepción de migraciones para TA-051

TA-051 trae las 7 migraciones de 03 y la de EN-2 juntas, contra la regla de una migración por tarea (DT-01). C6 compara contra `catalogo-esperado.txt`, que es la instantánea del conjunto completo: con una migración por tarea, las siete primeras tareas tendrían que regenerar una instantánea que no existe en ningún documento. Son archivos portados, verificados por huella. El campo `excepcion: DT-15 migraciones=8` lo acepta el script solo en TA-051 (tabla `EXCEPCIONES` de `verificar.ts`); en cualquier otra tarea es un error (control negativo). *Alternativa descartada:* una migración por tarea con instantáneas intermedias (habría que inventarlas; C6 dejaría de comparar contra lo aprobado).

### 11.4 DT-16: dos olas para el dominio y la aplicación

**Regla.**
- **Ola 1:** las operaciones, consultas, reportes y formularios que cita alguna ficha [I] en las tablas de 06 §6.2 y §6.3 (cálculo en §16.2), más lo que exige la operación antes de HT-6: el respaldo (OPT-09) y la anonimización.
- **Ola 2:** el resto.
- El motor completo (01 §4) va siempre en la ola 1, porque todas las invariantes dependen de él.
- Una tarea de la ola 1 puede incluir una pieza pequeña de la ola 2 cuando es del mismo archivo y del mismo tema (OP-38, OP-46 y OP-52); así no queda una tarea de diez líneas.

**Orden.**
- B1 tiene `orden` 20 a 29.
- La ola 1 de B2 y B3 va de 100 a 192, y TA-250, TA-251 y TA-253 de 193 a 195 (**[D]** eran 191 y 192 a 194: la ola 1 creció con TA-138, TA-139, TA-193 y TA-194).
- La Parte C (web y fichas [I]) usará 300 a 599.
- La ola 2 va de 600 a 628, antes de las fichas [M] de la Parte D.

**Efecto.** HT-6 (uso diario mínimo) llega sin esperar los reportes accionables, las programadas, las devoluciones ni el push. HT-2 y HT-3 se cumplen después de HT-6, con la ola 2. La prioridad [I] → [M] → [P] del encargo se respeta también dentro de B2 y B3.

**Alternativa descartada:** B2 y B3 completos antes de la web. Son unas 25 tareas más antes de la primera pantalla, y ninguna ficha [I] las necesita.

### 11.5 DT-17: identificadores de las pruebas nuevas

Una prueba que 07 no nombra recibe en su tarea `PRU-<NIVEL>-<ÁREA>-nnn`:
- con nivel de 07 §1.1 y área de 07 §2.2;
- con `nnn` desde **101** dentro de su suite, en orden de ejecución. Así no choca con un número que 07 reserve.

El script lo comprueba (E9). La Parte B crea 105 pruebas nuevas; la lista está en el campo `pru` de cada tarea. *Alternativa descartada:* continuar la numeración de 07 (un CH posterior a 07 podría usar el mismo número).

### 11.6 DT-18: los CA son de las fichas

Cada CA tiene como dueña la tarea de su ficha (partes C y D), que es la que la cierra con 07 §27. Una prueba de la Parte B puede citar un CA entre corchetes, y la matriz la cuenta como cobertura, pero esa tarea no es dueña del CA. Por ejemplo, el ejemplo de A.2 de TA-111 cita CA-55.1 y CA-55.2. Por eso las tareas de la Parte B declaran `ca=0`. *Alternativa descartada:* que la primera prueba que cita un CA sea su dueña (repartiría los CA de una ficha entre bloques y la ficha no podría cerrarse sola).

### 11.7 DT-19: los Route Handlers y la autenticación web van a la Parte C

B3 deja en `@finn/aplicacion` toda la lógica de los cinco Route Handlers de 04 §1.2:
- `recibirSms` devuelve el código HTTP que corresponde;
- la tarea diaria, los eventos del respaldo, la exportación y la ejecución de la acción de una notificación quedan como funciones.

Los archivos `route.ts`, sus pruebas `RH`, PRU-SEG-BAND-001, `proxy.ts`, `instrumentation.ts` y las funciones de autenticación de 04 §12.2 (que necesitan `@supabase/ssr`) van con el esqueleto de Next en B4. Hoy `apps/web` solo tiene su `package.json` (TA-001). Además, `after()`, que usa el webhook (BE-44), necesita el contexto de una petición de Next. *Alternativa descartada:* armar en B3 un Next mínimo solo para los Route Handlers (se rehace en B4).

### 11.8 Mapa de la Parte B

112 tareas: B1 10, B2 48 (38 en la ola 1 y 10 en la 2), B3 50 (43 y 7) y B5 4. 51 son de revisión obligatoria. En orden de ejecución:

| Orden | Tarea | Bloque | Ola | Hito | Revisión | Título | Prod. | Mig. |
|---|---|---|---|---|---|---|---|---|
| 20 | TA-050 | B1 | — | HT-1 | obligatoria | Arnés de PostgreSQL para pruebas | 280 | 0 |
| 21 | TA-051 | B1 | — | HT-1 | obligatoria | Esquema y migraciones de las fases 3 y 4, con C3, C5 y C6 | 240 | 1 |
| 22 | TA-052 | B1 | — | HT-1 | obligatoria | C4: diff de Prisma y prueba de catálogo de triggers | 180 | 0 |
| 23 | TA-053 | B1 | — | HT-1 | obligatoria | Migración de `conciliaciones.modo` (CF-01) | 40 | 1 |
| 24 | TA-054 | B1 | — | HT-1 | obligatoria | Migración de `notificaciones.aviso` nulo (CF-16) | 30 | 1 |
| 25 | TA-055 | B1 | — | HT-1 | obligatoria | Migración de `programadas.reactivada_desde` (CF-20) | 30 | 1 |
| 26 | TA-056 | B1 | — | HT-1 | obligatoria | Reloj de la base: `m_reloj`, R15 y reloj simulado (CT-02) | 210 | 1 |
| 27 | TA-057 | B1 | — | HT-1 | obligatoria | Instantes con `finn.ahora()`: `g_instantes_ahora` (CT-02, P7-12 a) | 60 | 1 |
| 28 | TA-058 | B1 | — | HT-1 | obligatoria | Marca local del bloqueo: `m_bloqueo_marca` (CT-06) | 120 | 1 |
| 29 | TA-059 | B1 | — | HT-1 | obligatoria | Suite del pooler con PgBouncer (CH-05) | 190 | 0 |
| 30 | TA-252 | B5 | — | — | obligatoria | Scripts de las fases anteriores en `rapido` (CT-08, BE-63) | 80 | 0 |
| 100 | TA-100 | B2 | 1 | HT-2 | obligatoria | Valores: `Centavos` y `FechaLocal` | 320 | 0 |
| 101 | TA-101 | B2 | 1 | HT-2 | normal | Tipos de los hechos y de la instantánea | 300 | 0 |
| 102 | TA-102 | B2 | 1 | HT-2 | normal | Generadores de prueba `@finn/dominio/pruebas` | 0 | 0 |
| 103 | TA-103 | B2 | 1 | HT-2 | obligatoria | Motor I: períodos y vigencias (01 §4.2) | 220 | 0 |
| 104 | TA-104 | B2 | 1 | HT-2 | obligatoria | Motor II: saldos, devoluciones D-1 a D-4 y actividad (01 §4.3, §4.4) | 260 | 0 |
| 105 | TA-105 | B2 | 1 | HT-2 | obligatoria | Motor III: reparto D2, respaldo y traslados (01 §4.5) | 200 | 0 |
| 106 | TA-106 | B2 | 1 | HT-2 | obligatoria | Motor IV: Disponible, arrastre, cierre, sobregiros y pago excedente (01 §4.6, §4.7) | 200 | 0 |
| 107 | TA-107 | B2 | 1 | HT-2 | obligatoria | Motor V: deuda sin respaldo, reserva excedente, LPA y por cobrar (01 §4.8 a §4.10) | 260 | 0 |
| 108 | TA-108 | B2 | 1 | HT-2 | obligatoria | Motor VI: metas, clasificación, patrimonio, tarjeta y ocurrencias (01 §4.12 a §4.14, §4.16) | 300 | 0 |
| 109 | TA-109 | B2 | 1 | HT-2 | obligatoria | Motor VII: `calcular()`, instantánea e invariantes | 240 | 0 |
| 110 | TA-110 | B2 | 1 | HT-2 | normal | Avisos de estado (AV de clase Estado) | 220 | 0 |
| 111 | TA-111 | B2 | 1 | HT-2 | obligatoria | Modelo de préstamo de Banco Agrícola y OP-48 (01 Anexo A) | 240 | 0 |
| 112 | TA-112 | B2 | 1 | HT-2 | obligatoria | Oráculo, diferencial y mutantes del nocturno | 140 | 0 |
| 113 | TA-113 | B2 | 1 | HT-2 | obligatoria | `aplicar()`: marco, rechazos, impacto y huella | 300 | 0 |
| 114 | TA-114 | B2 | 1 | HT-2 | obligatoria | `aplicar`: cuentas (OP-01 a OP-06) | 320 | 0 |
| 115 | TA-115 | B2 | 1 | HT-2 | obligatoria | `aplicar`: crear, archivar, sacar y fusionar categorías (OP-07, OP-09, OP-11, OP-12; parte 1; la parte 2 es TA-236) | 370 | 0 |
| 116 | TA-116 | B2 | 1 | HT-2 | obligatoria | `aplicar`: asignar, mover, auto-asignar y metas (OP-14, OP-15, OP-17, OP-18) | 300 | 0 |
| 117 | TA-117 | B2 | 1 | HT-2 | obligatoria | `aplicar`: registrar transacciones (OP-20 a OP-24, OP-27) | 380 | 0 |
| 118 | TA-118 | B2 | 1 | HT-2 | obligatoria | `aplicar`: editar, eliminar y estado bancario (OP-28 a OP-30) | 320 | 0 |
| 119 | TA-119 | B2 | 1 | HT-2 | obligatoria | `aplicar`: cobrar y renombrar deudor (OP-31, OP-52) | 240 | 0 |
| 120 | TA-120 | B2 | 1 | HT-2 | obligatoria | Criterios de comparación (01 §4.17) y OP-35 en el dominio | 280 | 0 |
| 121 | TA-121 | B2 | 1 | HT-2 | obligatoria | `aplicar`: editar, aprobar y resolver movimientos (OP-36, OP-37, OP-40) | 320 | 0 |
| 122 | TA-122 | B2 | 1 | HT-2 | obligatoria | `aplicar`: aprobar todos, descartar, reglas, reprocesar y crear a mano (OP-38, OP-39, OP-41, OP-49, OP-50) | 300 | 0 |
| 123 | TA-123 | B2 | 1 | HT-2 | obligatoria | `aplicar`: conciliación y verificar saldo (OP-45, OP-46, OP-47, OP-53) | 320 | 0 |
| 124 | TA-124 | B2 | 1 | HT-2 | normal | `operacionesArb` y propiedades de períodos, asignaciones y estructura | 0 | 0 |
| 125 | TA-125 | B2 | 1 | HT-2 | normal | Selectores de Presupuesto (parte 1; la parte 2 es TA-234) | 376 | 0 |
| 126 | TA-126 | B2 | 1 | HT-2 | normal | Selectores de detalle de categoría, metas y estructura | 280 | 0 |
| 127 | TA-231 | B2 | 1 | HT-2 | normal | Selector de detalle de categoría de pago de tarjeta (parte 2 de TA-126) | 300 | 0 |
| 128 | TA-127 | B2 | 1 | HT-2 | normal | Selectores de actividad y detalle de transacción (parte 1; la parte 2 es TA-237) | 398 | 0 |
| 129 | TA-128 | B2 | 1 | HT-2 | normal | Sugerencia de categoría, comercios recientes y `Propuesta` extendida (parte 1 de la bandeja y los formularios de la ola 1) | 130 | 0 |
| 130 | TA-129 | B2 | 1 | HT-2 | normal | Reporte de ritmo y hallazgos de ritmo en Inicio (CF-04, CF-06) | 240 | 0 |
| 131 | TA-130 | B2 | 1 | HT-2 | normal | Ejecutor de escenarios `motor` y ESC-01, ESC-02 | 260 | 0 |
| 132 | TA-131 | B2 | 1 | HT-2 | normal | Escenarios en el motor: ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10 | 20 | 0 |
| 133 | TA-132 | B2 | 1 | HT-2 | normal | Escenarios en el motor: ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20 | 20 | 0 |
| 134 | TA-133 | B2 | 1 | HT-2 | normal | Escenarios en el motor: ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36 | 20 | 0 |
| 135 | TA-135 | B2 | 1 | HT-2 | normal | Semillas de los recorridos 4.3 y 4.6 y Restaurantes de A.7 | 40 | 0 |
| 136 | TA-138 | B2 | 1 | HT-2 | obligatoria | `aplicar`: condonar, devolver y eliminar evento (OP-32 a OP-34) | 340 | 0 |
| 137 | TA-139 | B2 | 1 | HT-2 | obligatoria | `aplicar`: programadas (OP-42 a OP-44, OP-51) | 300 | 0 |
| 138 | TA-134 | B2 | 1 | HT-2 | normal | Escenarios en el motor: ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49 | 20 | 0 |
| 139 | TA-234 | B2 | 1 | HT-2 | normal | Selectores de Inicio y detalle de LPA (parte 2 de TA-125) | 275 | 0 |
| 140 | TA-235 | B2 | 1 | HT-2 | obligatoria | Proyección de períodos futuros en `calcular` (04 §6.2, 01 §4.6) | 120 | 0 |
| 141 | TA-237 | B2 | 1 | HT-2 | normal | Selectores de cuentas y detalle de cuenta (parte 2 de TA-127) | 400 | 0 |
| 142 | TA-236 | B2 | 1 | HT-2 | obligatoria | `aplicar`: renombrar, desarchivar, eliminar y crear en lote (OP-08, OP-10, OP-13, CF-19; parte 2 de TA-115) | 220 | 0 |
| 143 | TA-232 | B2 | 1 | HT-2 | normal | Selector de la bandeja de SMS (parte 2 de TA-128) | 400 | 0 |
| 144 | TA-233 | B2 | 1 | HT-2 | normal | Contextos de formulario: catálogos, registrar, pagar tarjeta y cuota de préstamo (parte 3 de TA-128) | 400 | 0 |
| 145 | TA-240 | B2 | 1 | HT-2 | normal | Contextos de formulario: editar, asignar, archivar, cuenta, movimiento y meta (parte 4 de TA-128) | 300 | 0 |
| 150 | TA-150 | B3 | 1 | HT-3 | obligatoria | `escribir()` y `leer()`: el protocolo de 04 §4.2 | 300 | 0 |
| 151 | TA-151 | B3 | 1 | HT-3 | normal | Errores de la base y conversiones de fechas y montos | 220 | 0 |
| 152 | TA-152 | B3 | 1 | HT-3 | normal | Carga de hechos (BE-21) | 240 | 0 |
| 153 | TA-153 | B3 | 1 | HT-3 | obligatoria | Traductor de cambios (BE-15, BE-16, BE-32) | 340 | 0 |
| 154 | TA-154 | B3 | 1 | HT-3 | normal | Memoria por instancia (BE-22) | 200 | 0 |
| 155 | TA-155 | B3 | 1 | HT-3 | normal | Repositorios de las tablas [I] y [T] y registro saneado (BE-26) | 300 | 0 |
| 156 | TA-156 | B3 | 1 | HT-3 | normal | Volumen sintético y presupuestos de rendimiento (BE-23) | 280 | 0 |
| 157 | TA-157 | B3 | 1 | — | obligatoria | Respaldo b de P7-12 (condicional) | 160 | 0 |
| 158 | TA-158 | B3 | 1 | HT-3 | normal | Errores, mensajes y contratos de la aplicación | 360 | 0 |
| 159 | TA-159 | B3 | 1 | HT-3 | normal | Marco de operaciones: previsualizar, confirmar, idempotencia e ids | 340 | 0 |
| 160 | TA-160 | B3 | 1 | HT-3 | obligatoria | Tiempo, configuración y reloj de prueba en la aplicación (CT-01) | 220 | 0 |
| 161 | TA-161 | B3 | 1 | HT-3 | obligatoria | Autorización del usuario único en la aplicación (BE-07, BE-55) | 160 | 0 |
| 162 | TA-162 | B3 | 1 | HT-3 | normal | Operaciones de cuentas (OP-01 a OP-06) | 340 | 0 |
| 163 | TA-163 | B3 | 1 | HT-3 | normal | Operaciones de grupos y categorías (OP-07 a OP-13) | 340 | 0 |
| 164 | TA-164 | B3 | 1 | HT-3 | normal | Operaciones de presupuesto y metas (OP-14, OP-15, OP-17, OP-18) | 260 | 0 |
| 165 | TA-165 | B3 | 1 | HT-3 | normal | Operaciones de registro (OP-20 a OP-24, OP-27) | 340 | 0 |
| 166 | TA-166 | B3 | 1 | HT-3 | normal | Editar, eliminar y estado bancario (OP-28 a OP-30) | 260 | 0 |
| 167 | TA-167 | B3 | 1 | HT-3 | normal | Cobrar, préstamo, deudor y verificar saldo (OP-31, OP-48, OP-52, OP-53) | 280 | 0 |
| 168 | TA-169 | B3 | 1 | HT-3 | normal | Consultas de Inicio, Presupuesto y detalle de LPA | 300 | 0 |
| 169 | TA-170 | B3 | 1 | HT-3 | normal | Consultas de detalle de categoría, metas y estructura | 240 | 0 |
| 170 | TA-171 | B3 | 1 | HT-3 | normal | Consultas de cuentas, detalle de cuenta, actividad y detalle de transacción | 320 | 0 |
| 171 | TA-172 | B3 | 1 | HT-3 | normal | Consultas de la bandeja, sugerencia y ajustes | 280 | 0 |
| 172 | TA-173 | B3 | 1 | HT-3 | normal | Consulta `formulario`: marco y contextos de registro | 300 | 0 |
| 173 | TA-174 | B3 | 1 | HT-3 | normal | Contextos de formulario de presupuesto y bandeja, y `reporte()` | 280 | 0 |
| 174 | TA-175 | B3 | 1 | HT-3 | normal | `@finn/sms`: intérprete y normalizadores | 260 | 0 |
| 175 | TA-176 | B3 | 1 | HT-3 | obligatoria | Política de patrones (BE-46) y `ci:politica-patrones` | 200 | 0 |
| 176 | TA-177 | B3 | 1 | HT-3 | obligatoria | Recibir SMS: guardar, procesar e intentos (OP-35, OPT-01) | 360 | 0 |
| 177 | TA-178 | B3 | 1 | HT-3 | normal | Bandeja I: editar, aprobar y resolver (OP-36, OP-37, OP-39, OP-40) | 340 | 0 |
| 178 | TA-179 | B3 | 1 | HT-3 | normal | Bandeja II: aprobar todos, reglas, reprocesar y crear a mano (OP-38, OP-41, OP-49, OP-50) | 280 | 0 |
| 179 | TA-180 | B3 | 1 | HT-3 | obligatoria | Anonimización de muestras (07 §23, CH-03) | 220 | 0 |
| 180 | TA-181 | B3 | 1 | HT-3 | obligatoria | Formatos del BAC reescritos; F-2 y F-3 inactivos (DT-12) | 80 | 1 |
| 181 | TA-182 | B3 | 1 | HT-3 | normal | `@finn/conciliacion`: decodificación, detección y BAC tarjeta | 280 | 0 |
| 182 | TA-183 | B3 | 1 | HT-3 | normal | Adaptadores BAC débito y de Banco Agrícola | 280 | 0 |
| 183 | TA-184 | B3 | 1 | HT-3 | obligatoria | Conciliar: iniciar, agregar y terminar con carga firmada (OP-45 a OP-47) | 320 | 0 |
| 184 | TA-185 | B3 | 1 | HT-3 | normal | Notificaciones: catálogo de motivos y registro (CF-16, BE-38, OPT-04) | 240 | 0 |
| 185 | TA-186 | B3 | 1 | HT-3 | normal | Tarea diaria y puesta al día (pasos 2, 5, 6 y 7) | 280 | 0 |
| 186 | TA-187 | B3 | 1 | HT-3 | obligatoria | Eventos del respaldo (OPT-09) | 140 | 0 |
| 187 | TA-188 | B3 | 1 | HT-3 | normal | Escenarios contra PostgreSQL: ESC-01, ESC-02, ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10 | 280 | 0 |
| 188 | TA-189 | B3 | 1 | HT-3 | normal | Escenarios contra PostgreSQL: ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20 | 40 | 0 |
| 189 | TA-190 | B3 | 1 | HT-3 | normal | Escenarios contra PostgreSQL: ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36 | 40 | 0 |
| 190 | TA-193 | B3 | 1 | HT-3 | normal | Condonar, devolver y eliminar evento (OP-32 a OP-34) | 280 | 0 |
| 191 | TA-194 | B3 | 1 | HT-3 | normal | Programadas y registro automático (OP-42 a OP-44, OP-51) | 340 | 0 |
| 192 | TA-191 | B3 | 1 | HT-3 | normal | Escenarios contra PostgreSQL: ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49 | 40 | 0 |
| 193 | TA-251 | B5 | — | HT-4 | obligatoria | Respaldo y restauración: scripts y prueba `RES` | 330 | 0 |
| 194 | TA-250 | B5 | — | HT-4 | obligatoria | Prueba de humo: `humo.sh` con H-01 a H-08, H-11 y H-12 | 360 | 0 |
| 195 | TA-253 | B5 | — | HT-4 | obligatoria | Prueba de humo: H-09 (carga desde `iad1`) y H-10 (Auth) | 300 | 0 |
| 600 | TA-136 | B2 | 2 | HT-2 | obligatoria | `aplicar`: asignación rápida y cambiar el ciclo (OP-16, OP-19) | 260 | 0 |
| 601 | TA-137 | B2 | 2 | HT-2 | obligatoria | `aplicar`: inversiones y desembolso (OP-25, OP-26) | 180 | 0 |
| 604 | TA-140 | B2 | 2 | HT-2 | normal | Selectores de por cobrar, programadas y contextos de formulario (ola 2) | 260 | 0 |
| 605 | TA-141 | B2 | 2 | HT-2 | normal | Reportes base (04 §6.9.2, §6.9.3; parte 1) | 396 | 0 |
| 606 | TA-230 | B2 | 2 | HT-2 | normal | Reportes: top de comercios y gasto semanal (parte 2 de TA-141) | 287 | 0 |
| 607 | TA-142 | B2 | 2 | HT-2 | normal | Reportes accionables: realidad y clave de agrupación (CF-04; parte 1) | 334 | 0 |
| 613 | TA-238 | B2 | 2 | HT-2 | normal | Reporte de gastos hormiga (parte 2 de TA-142) | 260 | 0 |
| 614 | TA-239 | B2 | 2 | HT-2 | normal | Reporte de suscripciones (parte 3 de TA-142) | 250 | 0 |
| 608 | TA-143 | B2 | 2 | HT-2 | normal | Reportes de tarjetas, hallazgos y flujo de efectivo (CF-02, CF-04) | 300 | 0 |
| 609 | TA-144 | B2 | 2 | HT-2 | normal | `datos_base` y sus pares con los selectores (CF-09) | 160 | 0 |
| 610 | TA-145 | B2 | 2 | HT-2 | normal | Escenarios en el motor: ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30 | 20 | 0 |
| 611 | TA-146 | B2 | 2 | HT-2 | normal | Escenarios en el motor: ESC-40, ESC-41, ESC-45, ESC-50 | 20 | 0 |
| 612 | TA-147 | B2 | 2 | HT-2 | normal | Semilla de A.7 completa (CT-07) | 30 | 0 |
| 620 | TA-168 | B3 | 2 | HT-3 | normal | Exportar en JSON y CSV (OPT-08) | 240 | 0 |
| 621 | TA-192 | B3 | 2 | HT-3 | normal | Asignación rápida, ciclo, inversiones y desembolso (OP-16, OP-19, OP-25, OP-26) | 280 | 0 |
| 624 | TA-195 | B3 | 2 | HT-3 | normal | Formatos bancarios e instituciones (OPT-05 a OPT-07, BE-47) | 260 | 0 |
| 625 | TA-196 | B3 | 2 | HT-3 | obligatoria | Envío de push, suscripciones y pasos de push de la tarea diaria | 340 | 0 |
| 626 | TA-197 | B3 | 2 | HT-3 | normal | Consultas de por cobrar, programadas, reglas y notificaciones | 280 | 0 |
| 627 | TA-198 | B3 | 2 | HT-3 | normal | Contextos de formulario y tipos de reporte de la ola 2 | 240 | 0 |
| 628 | TA-199 | B3 | 2 | HT-3 | normal | Escenarios contra PostgreSQL: ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30, ESC-40, ESC-41, ESC-45, ESC-50 | 40 | 0 |

---

## 12. Bloque B1 — Base de datos (HT-1)

### 12.1 Qué entra

- Arnés de PostgreSQL con base por archivo (07 §5.2).
- Las migraciones de 03 y de las enmiendas posteriores, en este orden:
  - las 7 de 03 y EN-2, portadas;
  - las 3 de expansión de la Fase 6 (CF-01, CF-16 y CF-20);
  - las 3 de la Fase 7 (CT-02 y CT-06).
- Los controles C3 a C6 y R1 a R15, el reloj simulado de la base y la suite del pooler.
- La migración de los formatos del BAC (TA-181) va en B3, porque necesita `@finn/sms` para pasar la política de patrones.

**Paralelismo.** Todo B1 es `paralelo: no`: cada tarea cambia `schema.prisma`, `catalogo-esperado.txt` o el workflow. Mientras corre B1, otro agente puede tomar TA-100 a TA-102 y TA-175, que no tocan la base.

**TU.** El merge de TA-050 espera TU-06, porque fija `PG_MAYOR` con la versión real (H-01). Docker Desktop (TU-03) es necesario desde TA-050.

### 12.2 Tareas

#### TA-050 Arnés de PostgreSQL para pruebas

```tarea
orden: 20
bloque: B1
hito: HT-1
depende: TA-005, TA-012
tu: TU-03, TU-06
revision: obligatoria
paralelo: no
tamano: prod=280 archivos=7 ca=0 migraciones=0 total=720
cubre: DP-05, DP-07, MIG-00
pru: PRU-INT-ESQ-101
compartido: —
```

**Qué construir.**
- `tools/db/bootstrap.sql` **portado** desde 03 §10.4.1 (DT-14): roles `finn_*`, esquema, `GRANT CREATE ON DATABASE`, `search_path` de `finn_migraciones`.
- `tools/pruebas/roles-supabase.sql`: `anon`, `authenticated` y `service_role` sin privilegios (07 §5.2, paso 2).
- `packages/db/test/ayudantes/base.ts`: contenedor de `PG_MAYOR` (leído de `infra/versiones.env`) desde `public.ecr.aws/docker/library/postgres`; bootstrap y roles como superusuario; `finn_plantilla` con el esquema `finn` de propiedad de `finn_migraciones` y el gancho `prepararPlantilla(url)`, sin migraciones **[CH-21]**; `crearBasePrueba()` con `CREATE DATABASE … TEMPLATE finn_plantilla`, marca `finn.reloj_simulado = on` y borrado al terminar el archivo.
- **[CH-21]** `prisma migrate deploy` como `finn_migraciones` sobre `finn_plantilla` y la CLI de Prisma pasan a TA-051, que completa el gancho.
- **[CH-22]** En CI, la imagen se baja por el digest `PG_IMAGEN_DIGEST` de `infra/versiones.env`: caché de `docker save`, ECR con 3 intentos y, si fallan, `mirror.gcr.io` por el mismo digest; se etiqueta como `public.ecr.aws/docker/library/postgres:<PG_MAYOR>`. La regla de 07 §5.2 se mantiene: la fuente primaria es ECR y nunca se baja por tag desde otro registro. Archivos: `.github/workflows/ci.yml`, `tools/pruebas/versiones.mjs`, `tools/ci/workflows.test.ts`, `tools/lint/controles/versiones/negativo.mjs`.
- `PG_MAYOR` en `infra/versiones.env` con la versión mayor que informaste en TU-06 (H-01); `versiones.mjs` sigue pasando.
- El job `integracion` (TA-012, fusionado con `rapido` por M5) llama al ayudante antes de las suites `INT`, `ESQ` y `ESC@int`.

**Leer.** 03 §10.4.1, §11.3; 07 §5.1, §5.2, §5.3 (tabla de piezas de Supabase); DT-14 de este documento.

**Archivos.** `tools/db/bootstrap.sql` (portado), `tools/pruebas/roles-supabase.sql`, `packages/db/test/ayudantes/base.ts`, `vitest.config.ts` (proyecto `integracion`, 07 §2.3) **[CH-21]**, `infra/versiones.env`, `package.json` (script `test:integracion`); `packages/db/package.json`, `packages/db/tsconfig.json` y `pnpm-lock.yaml` (Testcontainers y `pg`) **[CH-21]**.

**Pruebas primero.**
- **PRU-INT-ESQ-101** (nueva, DT-17): dos archivos de prueba en paralelo usan bases distintas clonadas de la plantilla; uno no ve las filas del otro.
- La prueba nueva de aislamiento corre dos archivos a la vez y comprueba que cada uno ve 0 filas del otro.
- Control: con `TEMPLATE` reemplazado por una base compartida, la prueba falla.

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-101"`; `node tools/pruebas/versiones.mjs`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa en Windows con Docker Desktop y en CI; `PG_MAYOR` coincide con H-01; el control falla como debe; `integracion` en verde en el PR. Sin migraciones aplicadas en la plantilla **[CH-21]**.

#### TA-051 Esquema y migraciones de las fases 3 y 4, con C3, C5 y C6

```tarea
orden: 21
bloque: B1
hito: HT-1
depende: TA-050, TA-011
tu: —
revision: obligatoria
paralelo: no
tamano: prod=240 archivos=6 ca=0 migraciones=1 total=980
cubre: MIG-01, MIG-02, MIG-03, MIG-04, MIG-05, MIG-06, MIG-07, MIG-08, MIG-schema, C3, C5, C6, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, CF-14
pru: PRU-SEG-ESQ-001, PRU-INT-ESQ-012, PRU-INT-ESQ-102
compartido: —
excepcion: DT-15 migraciones=8
```

**Qué construir.**
- **Portado** (DT-14), sin cambiar un byte: `packages/db/prisma/schema.prisma` (03 §10.3), las 7 carpetas de 03 §10.1 (`m_inicio`, `g_tablas`, `m_restricciones`, `m_funciones`, `m_triggers`, `m_seguridad`, `m_datos_iniciales`) y `m_purgar_eliminaciones` de EN-2 (04 §10.2), con las fechas de carpeta de 03 §10.1 y de EN-2.
- **Portado** desde el zip de la Fase 3: `tools/db/catalogo.sql`, `tools/db/reglas-catalogo.sql` (R1–R13) más R14 del zip de la Fase 4 (`sql/03_regla_r14.sql`), y `packages/db/prisma/catalogo-esperado.txt` regenerado en la plantilla (03 §11.5, paso 5).
- `tools/db/plantilla.ts`: C3 (bootstrap + `migrate deploy` desde cero), C5 (`reglas-catalogo.sql` sin filas) y C6 (`catalogo.sql` frente a `catalogo-esperado.txt`), en ese orden, sobre la plantilla del arnés. Si uno falla, `integracion` termina sin correr pruebas (07 §5.2, paso 4).
- **[CH-21]** `tools/db/plantilla.ts` completa el gancho `prepararPlantilla` de TA-050 con `migrate deploy` y C3, C5 y C6, y agrega la CLI `prisma`.
- Excepción de tamaño DT-15: esta es la única tarea con más de una migración, porque C6 compara contra una instantánea del conjunto completo de 03 y EN-2.
- **[CH-23]** Corrige `20261025000000_m_formatos_bac` (bloqueo y escrituras en un solo `DO`), con la excepción acotada de C2 por huella y la regla nueva de C1 contra el bloqueo en una sentencia suelta.
- CF-14: ninguna migración ni script importa datos de Finn 1.0 (P13 cerrada sin migración).

**Leer.** 03 §10.1, §10.3, §10.4 completo, §11.1 a §11.6; 04 §10.2 (EN-2) y V-12, V-28; 03 "Enmiendas posteriores" (EN-2, CF-14); DT-14 y DT-15.

**Archivos.** Portados: `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/*` (8 carpetas), `tools/db/{catalogo,reglas-catalogo}.sql`; generado: `catalogo-esperado.txt`; producción: `tools/db/plantilla.ts`, `packages/db/prisma.config.ts`, `packages/db/package.json`.

**Pruebas primero.**
- **PRU-INT-ESQ-102** (nueva, DT-17): la siembra deja exactamente las filas de 03 §9.1 a §9.5 (fila de revisión, vigencia día 21, grupo "Pagos de tarjeta", instituciones y formatos).
- PRU-SEG-ESQ-001 (V-12): como `finn_app`, sin `TRUNCATE`, sin `DISABLE TRIGGER`, sin `finn.operacion()` directo; como rol sin `BYPASSRLS`, 0 filas.
- PRU-INT-ESQ-012 (V-28): `purgar_eliminaciones()` borra solo lo de más de 30 días, fija máx + 1, devuelve 0 la segunda vez y nunca baja el valor.
- La prueba nueva de la siembra.
- Controles negativos de C5 y C6 sobre una copia dañada (trigger deshabilitado, índice de expresión borrado): fallan.

**Comandos.** `pnpm plan:tamano` (las carpetas portadas cuentan como portado); `pnpm test:integracion -t "PRU-SEG-ESQ-001|PRU-INT-ESQ-012|PRU-INT-ESQ-102"`; `pnpm ci:local`.

**Terminada cuando.** C3, C5 y C6 en verde en la plantilla; los controles negativos fallan; `tamano.ts` informa los portados como idénticos a su fuente.

#### TA-052 C4: diff de Prisma y prueba de catálogo de triggers

```tarea
orden: 22
bloque: B1
hito: HT-1
depende: TA-051
tu: —
revision: obligatoria
paralelo: no
tamano: prod=180 archivos=4 ca=0 migraciones=0 total=520
cubre: C4, P7-12-disparador, DP-23
pru: PRU-ESQ-ESQ-001
compartido: —
```

**Qué construir.**
- C4 en `integracion`: `prisma migrate diff --from-config-datasource --to-schema packages/db/prisma/schema.prisma --exit-code` contra la plantilla, con la CLI nativa de Prisma 7.
- `tools/db/c4-explicar.mjs` (07 §32.1): si C4 sale con código 2 y el diff contiene `ALTER COLUMN … SET DEFAULT` sobre una de las 9 columnas de CT-02, agrega al informe "P7-12: aplicar el respaldo b)"; si no, imprime el diff sin interpretar.
- PRU-ESQ-ESQ-001 (V-21, DP-23): con el catálogo, los cuerpos de las funciones de trigger no contienen `INSERT`, `UPDATE` ni `DELETE` sobre otras tablas [M], salvo la lista cerrada de excepciones (revisión y eliminaciones de EN-2).

**Leer.** 03 §11.6 (C4), §4.3, §5.3; 07 §19.2, §32.1; 04 V-21.

**Archivos.** `tools/db/c4.mjs`, `tools/db/c4-explicar.mjs`, `packages/db/test/catalogo-triggers.int.test.ts`, `.github/workflows/ci.yml` (paso de C4).

**Pruebas primero.**
- PRU-ESQ-ESQ-001 con su control: una función de trigger sembrada que escribe en otra tabla [M] la hace fallar.
- C4 con un `schema.prisma` alterado (una columna de más) sale con código 2.

**Comandos.** `pnpm test:integracion -t "PRU-ESQ-ESQ-001"`; `node tools/db/c4.mjs`; `pnpm ci:local`.

**Terminada cuando.** C4 vacío sobre la plantilla; los dos controles fallan como deben.

#### TA-053 Migración de `conciliaciones.modo` (CF-01)

```tarea
orden: 23
bloque: B1
hito: HT-1
depende: TA-052
tu: —
revision: obligatoria
paralelo: no
tamano: prod=40 archivos=2 ca=0 migraciones=1 total=220
cubre: MIG-09
pru: PRU-INT-ESQ-103
compartido: CF-01 (columna y enum; la operación es de TA-123 y TA-167)
```

**Qué construir.**
- Enum `modo_conciliacion` y columna `conciliaciones.modo NOT NULL DEFAULT 'estado_cuenta'` en `schema.prisma`; migración generada `g_conciliacion_modo` (expansión, 03 §11.4).
- `catalogo-esperado.txt` regenerado si cambia.

**Leer.** 03 "Enmiendas posteriores" (CF-01); 06 §3.2.3; 03 §11.2, §11.4.

**Archivos.** `schema.prisma`, `packages/db/prisma/migrations/<fecha>_g_conciliacion_modo/`, `catalogo-esperado.txt`.

**Pruebas primero.**
- **PRU-INT-ESQ-103** (nueva, DT-17): `conciliaciones.modo` vale `estado_cuenta` por defecto, admite `saldo` y es inmutable (`e_solo_insercion`).
- La prueba nueva, como `finn_app` con bloqueo.

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-103"`; C3 a C6 en `pnpm ci:local`.

**Terminada cuando.** C1 a C6 en verde con la migración nueva y la prueba en verde.

#### TA-054 Migración de `notificaciones.aviso` nulo (CF-16)

```tarea
orden: 24
bloque: B1
hito: HT-1
depende: TA-053
tu: —
revision: obligatoria
paralelo: no
tamano: prod=30 archivos=2 ca=0 migraciones=1 total=260
cubre: MIG-10
pru: PRU-INT-NOTIF-001
compartido: CF-16 (columna; el mapa motivo → aviso es de TA-185)
```

**Qué construir.**
- `aviso String?` en el modelo `Notificacion`; migración generada `g_notificaciones_aviso_nulo` con `ALTER COLUMN aviso DROP NOT NULL`; el `CHECK (aviso ~ '^AV-[0-9]{2}$')` no cambia.

**Leer.** 03 "Enmiendas posteriores" (CF-16); 06 §3.13 y V6-04.

**Archivos.** `schema.prisma`, `packages/db/prisma/migrations/<fecha>_g_notificaciones_aviso_nulo/`, `packages/db/test/notificaciones.int.test.ts`.

**Pruebas primero.**
- PRU-INT-NOTIF-001 (V6-04): las 35 inserciones del catálogo con `aviso` nulo entran; un `aviso` con otro formato sigue rechazado.

**Comandos.** `pnpm test:integracion -t "PRU-INT-NOTIF-001"`; `pnpm ci:local`.

**Terminada cuando.** 35 de 35 inserciones aceptadas y el control rechazado; C1 a C6 en verde.

#### TA-055 Migración de `programadas.reactivada_desde` (CF-20)

```tarea
orden: 25
bloque: B1
hito: HT-1
depende: TA-054
tu: —
revision: obligatoria
paralelo: no
tamano: prod=30 archivos=2 ca=0 migraciones=1 total=200
cubre: MIG-11
pru: PRU-INT-ESQ-104
compartido: CF-20 (columna; la regla de ocurrencias es de TA-139)
```

**Qué construir.**
- Columna `reactivada_desde date NULL` sin `DEFAULT`; migración generada `g_programadas_reactivada` (expansión).

**Leer.** 03 "Enmiendas posteriores" (CF-20); 06 §0.12.

**Archivos.** `schema.prisma`, `packages/db/prisma/migrations/<fecha>_g_programadas_reactivada/`.

**Pruebas primero.**
- **PRU-INT-ESQ-104** (nueva, DT-17): `programadas.reactivada_desde` es `date` nulo sin valor por defecto; una fila existente queda en nulo.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-104"`; `pnpm ci:local`.

**Terminada cuando.** C1 a C6 en verde y la prueba en verde.

#### TA-056 Reloj de la base: `m_reloj`, R15 y reloj simulado (CT-02)

```tarea
orden: 26
bloque: B1
hito: HT-1
depende: TA-055
tu: —
revision: obligatoria
paralelo: no
tamano: prod=210 archivos=5 ca=0 migraciones=1 total=640
cubre: MIG-12, R15, CT-02-base
pru: PRU-ESQ-RELOJ-003, PRU-ESQ-RELOJ-004, PRU-ESQ-RELOJ-005
compartido: —
```

**Qué construir.**
- Migración manual `m_reloj`: `finn.ahora()` (`SELECT now()`), `finn.instante()` (`SELECT clock_timestamp()`) y el cuerpo nuevo de `purgar_eliminaciones` con `finn.ahora()`; ningún ajuste leído en producción. **Portada** del prototipo del zip de la Fase 7 si coincide con 07 §4.4.
- `tools/db/regla-r15.sql` (R15) agregada a C5; `tools/pruebas/reloj-simulado.sql`, que se niega a correr sin la marca `finn.reloj_simulado` y reemplaza `ahora`, `instante` y agrega `desfase` en las bases de prueba (paso 5 de 07 §5.2, después de C3 a C6).
- `crearBasePrueba()` (TA-050) instala `reloj-simulado.sql` y expone `fijarReloj({ hoy, desfaseMs })` para las pruebas.

**Leer.** 07 §4.1, §4.3 (barreras 3 y 4), §4.4 completo; 03 "Enmiendas posteriores" (CT-02); 03 §4.1 (`hoy()`, DB-08).

**Archivos.** `packages/db/prisma/migrations/<fecha>_m_reloj/` (sin los 9 `ALTER … SET DEFAULT` del prototipo) **[CH-24]**, `tools/db/regla-r15.sql`, `tools/pruebas/reloj-simulado.sql`, `packages/db/test/ayudantes/base.ts`, `catalogo-esperado.txt`.

**Pruebas primero.**
- PRU-ESQ-RELOJ-003: R15 (partes 1, 2 y 4) da 0 filas en la plantilla; su control negativo (2 violaciones sembradas: una función nueva con `now()` y el cuerpo de `finn.ahora()` alterado) las detecta **[CH-24]**.
- PRU-ESQ-RELOJ-004: en la plantilla, un desfase de un año se ignora.
- PRU-ESQ-RELOJ-005: `finn.hoy()` solo respeta `finn.hoy` con la marca, y `finn_app` no puede activarla.

**Comandos.** `pnpm test:integracion -t "PRU-ESQ-RELOJ"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas y R15 (partes 1, 2 y 4; la 3 llega con TA-057) en verde **[CH-24]**; C6 difiere de la base de prueba exactamente en `ahora`, `instante` y `desfase` (V7-02).

#### TA-057 Instantes con `finn.ahora()`: `g_instantes_ahora` (CT-02, P7-12 a)

```tarea
orden: 27
bloque: B1
hito: HT-1
depende: TA-056
tu: —
revision: obligatoria
paralelo: no
tamano: prod=60 archivos=2 ca=0 migraciones=1 total=300
cubre: MIG-13, CT-02-defaults, P7-12-a
pru: —
compartido: —
```

**Qué construir.**
- Los 9 `@default(now())` de 07 §4.4 pasan a `@default(dbgenerated("finn.ahora()"))`; migración generada `g_instantes_ahora`.
- Si C4 (TA-052) no queda vacío por esas columnas, se aplica en esta misma tarea, sin volver a preguntar, la parte de esquema del respaldo b) de 07 §32.1: las 9 columnas siguen con `@default(now())` y sin migración, y R15 las exceptúa en su parte 3. La parte de la aplicación (`ahoraDb()`, L21 y PRU-INT-RELOJ-010) es TA-157. En ese caso, la prueba nueva no se escribe y su comprobación pasa a PRU-INT-RELOJ-010; el informe lo dice y el campo `pru` de esta tarea se corrige en el mismo PR.

**Leer.** 07 §4.4 (conteo y tabla), §32.1; 03 "Enmiendas posteriores" (CT-02).

**Archivos.** `schema.prisma`, `packages/db/prisma/migrations/<fecha>_g_instantes_ahora/`, `catalogo-esperado.txt`, `tools/db/regla-r15.sql` (parte 3) y `packages/db/test/reloj.int.test.ts` (control negativo de PRU-ESQ-RELOJ-003) **[CH-24]**.

**Pruebas primero.**
- **PRU-INT-RELOJ-101** (nueva, DT-17): con el reloj simulado, una inserción en cada una de las 9 tablas de CT-02 deja el instante simulado en su columna técnica.
- La prueba nueva, una aserción por tabla.
- **[CH-24]** PRU-ESQ-RELOJ-003 suma la parte 3 de R15: 0 filas en la plantilla y, en su control negativo, un `DEFAULT CURRENT_TIMESTAMP` sembrado (V7-02 P10). Con el respaldo b), la parte 3 nace con la excepción de las 9 columnas.

**Comandos.** `node tools/db/c4.mjs`; `pnpm test:integracion -t "PRU-INT-RELOJ-101"`; `pnpm ci:local`.

**Terminada cuando.** R15 completa (con su parte 3) en verde **[CH-24]**; C4 vacío con `dbgenerated` y la prueba en verde (TA-157 pasa a `retirada`); o, con el respaldo b), C4 vacío sin la migración y R15 con la excepción (TA-157 queda pendiente).

#### TA-058 Marca local del bloqueo: `m_bloqueo_marca` (CT-06)

```tarea
orden: 28
bloque: B1
hito: HT-1
depende: TA-057
tu: —
revision: obligatoria
paralelo: no
tamano: prod=120 archivos=4 ca=0 migraciones=1 total=420
cubre: MIG-14, CT-06
pru: PRU-ESQ-POOL-001
compartido: —
```

**Qué construir.**
- Migración manual `m_bloqueo_marca`: `finn.tomar_bloqueo()` agrega `set_config('finn.bloqueo_xact', pg_current_xact_id()::text, true)` y `finn.tiene_bloqueo()` exige además `coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text` (con el `coalesce`, hallazgo de V7-14).
- `tools/lint/bloqueos-sesion.mjs` (PRU-ESQ-POOL-001): falla si `packages/db/src` o `packages/aplicacion/src` contienen `pg_advisory_lock(`, `pg_try_advisory_lock(`, `SET ` sin `LOCAL` o `set_config('finn.bloqueo_xact'`.

**Leer.** 07 §5.3 (hallazgo de POOL-04), §19.5 completo; 03 "Enmiendas posteriores" (CT-06); 03 §4.1, §5.2.

**Archivos.** `packages/db/prisma/migrations/<fecha>_m_bloqueo_marca/`, `tools/lint/bloqueos-sesion.mjs`, `tools/lint/controles/bloqueos-sesion/*`, `catalogo-esperado.txt`.

**Pruebas primero.**
- PRU-ESQ-POOL-001 con sus controles: un archivo de control con cada patrón prohibido la hace fallar.

**Comandos.** `node tools/lint/bloqueos-sesion.mjs`; `pnpm ci:local`.

**Terminada cuando.** C1 a C6 en verde con la marca; los cuatro controles fallan.

#### TA-059 Suite del pooler con PgBouncer (CH-05)

```tarea
orden: 29
bloque: B1
hito: HT-1
depende: TA-058
tu: —
revision: obligatoria
paralelo: no
tamano: prod=190 archivos=4 ca=0 migraciones=0 total=640
cubre: P7-2-pooler, CH-05
pru: PRU-INT-POOL-001, PRU-INT-POOL-002, PRU-INT-POOL-003, PRU-INT-POOL-004, PRU-INT-POOL-005, PRU-INT-POOL-006
compartido: —
```

**Qué construir.**
- PgBouncer 1.22+ como servicio del job `integracion` (modo transacción, `max_prepared_statements = 0`, 2 conexiones de servidor) y en el ayudante local por Docker.
- Suite `PRU-INT-POOL` con Prisma 7 + `@prisma/adapter-pg` y `pgbouncer=true`, con los identificadores de CH-05: 001 (50 escrituras), 002 (nada se filtra entre transacciones; también H-07), 003 (control `SET` de sesión), 004 (bloqueo de sesión olvidado: **rechazado** con FN001 gracias a CT-06, con el caso "sin marca"), 005 (control de sentencia preparada con nombre) y 006 (V-05, `finn.operacion` no se filtra).

**Leer.** 07 §5.3 (tabla PRU-INT-POOL y hallazgo), §19.5; 04 V-05, §4.4; CH-05 de este documento.

**Archivos.** `.github/workflows/ci.yml` (servicio), `packages/db/test/ayudantes/pgbouncer.ts`, `packages/db/test/pool.int.test.ts`, `infra/pgbouncer.ini`.

**Pruebas primero.**
- Las seis pruebas; 003 y 005 son controles que detectan el riesgo, 004 espera el rechazo.

**Comandos.** `pnpm test:integracion -t "PRU-INT-POOL"`; `pnpm ci:local`.

**Terminada cuando.** Seis de seis en verde en local y en CI; HT-1 se cumple.

---

## 13. Bloque B2 — `@finn/dominio` (HT-2)

### 13.1 Qué entra y quién es dueño de cada regla

- Valores, tipos de los hechos y generadores.
- El motor en siete tareas, una por grupo de secciones de 01 §4.
- `calcular` con sus invariantes, los avisos de estado y el modelo de préstamo de A.2.
- El oráculo con los mutantes.
- `aplicar` por grupo de operaciones.
- Los selectores por pantalla, los reportes, los escenarios `@motor` en lotes y las semillas de los recorridos y de A.7.

Cada invariante (M4), caso borde (M14) y aviso (M3) tiene exactamente una tarea dueña, que escribe la prueba que lo cita. La ubicación sigue 07 §12.5 y §19.3:

**Invariantes (01 §6):**

|   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|
| INV-01 → TA-107 | INV-02 → TA-107 | INV-03 → TA-107 | INV-04 → TA-104 | INV-05 → TA-105 | INV-06 → TA-117 | INV-07 → TA-117 |
| INV-08 → TA-117 | INV-09 → TA-119 | INV-10 → TA-138 | INV-11 → TA-138 | INV-12 → TA-117 | INV-13 → TA-120 | INV-14 → TA-123 |
| INV-15 → TA-122 | INV-16 → TA-120 | INV-17 → TA-103 | INV-18 → TA-124 | INV-19 → TA-124 | INV-20 → TA-124 | INV-21 → TA-124 |
| INV-22 → TA-114 | INV-23 → TA-115 | INV-24 → TA-124 | INV-25 → TA-114 | INV-26 → TA-109 | INV-27 → TA-109 | INV-28 → TA-105 |

**Casos borde (01 §9):**

|   |   |   |   |   |   |
|---|---|---|---|---|---|
| CB-01 → TA-117 | CB-02 → TA-138 | CB-03 → TA-118 | CB-04 → TA-118 | CB-05 → TA-119 | CB-06 → TA-104 |
| CB-07 → TA-117 | CB-08 → TA-105 | CB-09 → TA-116 | CB-10 → TA-116 | CB-11 → TA-106 | CB-12 → TA-136 |
| CB-13 → TA-103 | CB-14 → TA-114 | CB-15 → TA-120 | CB-16 → TA-120 | CB-17 → TA-120 | CB-18 → TA-123 |
| CB-19 → TA-117 | CB-20 → TA-115 | CB-21 → TA-105 | CB-22 → TA-138 | CB-23 → TA-119 | CB-24 → TA-118 |
| CB-25 → TA-116 | CB-26 → TA-117 | CB-27 → TA-116 | CB-28 → TA-117 | CB-29 → TA-117 | CB-30 → TA-118 |
| CB-31 → TA-138 | CB-32 → TA-104 | CB-33 → TA-139 | CB-34 → TA-236 |

**Avisos (01 §5.0.7):**

|   |   |   |   |   |   |
|---|---|---|---|---|---|
| AV-01 → TA-113 | AV-02 → TA-110 | AV-03 → TA-110 | AV-04 → TA-110 | AV-05 → TA-110 | AV-06 → TA-110 |
| AV-07 → TA-110 | AV-08 → TA-110 | AV-09 → TA-110 | AV-10 → TA-117 | AV-11 → TA-116 | AV-12 → TA-136 |
| AV-13 → TA-115 | AV-14 → TA-110 | AV-15 → TA-114 | AV-16 → TA-118 | AV-17 → TA-110 | AV-18 → TA-116 |
| AV-19 → TA-122 | AV-20 → TA-110 | AV-21 → TA-123 | AV-22 → TA-119 | AV-23 → TA-120 | AV-24 → TA-117 |

### 13.2 Ola 1

#### TA-100 Valores: `Centavos` y `FechaLocal`

```tarea
orden: 100
bloque: B2
hito: HT-2
depende: TA-003, TA-005
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=5 ca=0 migraciones=0 total=860
cubre: ADR-15, ADR-16, PR-1-valores
pru: PRU-DOM-VAL-101, PRU-PROP-VAL-101
compartido: —
```

**Qué construir.**
- `packages/dominio/src/valores/centavos.ts` (02 ADR-15): tipo marcado, constructores con `Number.isSafeInteger`, operaciones y las divisiones con aritmética entera (mitad hacia arriba para la meta semanal; techo para las metas de ahorro).
- `packages/dominio/src/valores/fecha-local.ts` (02 ADR-16): días desde una época con los algoritmos civiles, sin `Date`; `inicioDeMes`, `sumarMeses` y `sumarAnios` con recorte (29 de febrero → 28).
- Punto de entrada `@finn/dominio/valores` (PR-1, 04 §1.4).

**Leer.** 02 ADR-15, ADR-16, "Enmiendas posteriores" (PR-1); 01 §0.4, §4.2 punto 1, §4.12 (redondeos); 04 §1.4, §13.2.

**Archivos.** `packages/dominio/src/valores/{centavos,fecha-local,index}.ts`, `packages/dominio/package.json` (`exports`).

**Pruebas primero.**
- **PRU-DOM-VAL-101** (nueva, DT-17): `Centavos`: constructores, suma, resta, mín, máx y las dos divisiones del dominio con los valores de ESC-36 (221.43, 200.00, 214.29, 78.57) y ESC-37 (92.31).
- **PRU-PROP-VAL-101** (nueva, DT-17): `FechaLocal` frente a `Temporal.PlainDate` (polyfill de desarrollo): sumar días, días entre fechas, inicio de mes con recorte y sumar meses y años con recorte, sobre fechas aleatorias.
- Las dos pruebas nuevas; la de propiedades con 300 casos en PR (07 §1.1).

**Comandos.** `pnpm test:unidad -t "PRU-DOM-VAL|PRU-PROP-VAL"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan; el lint de dominio (TA-003) no marca nada; cobertura de ramas ≥ 90 % en `valores/`.

#### TA-101 Tipos de los hechos y de la instantánea

```tarea
orden: 101
bloque: B2
hito: HT-2
depende: TA-100
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=6 ca=0 migraciones=0 total=420
cubre: BE-09-tipos
pru: PRU-DOM-MOTOR-101
compartido: —
```

**Qué construir.**
- `packages/dominio/src/hechos/`: un tipo por tabla [M] y [H] que el motor lee, con los nombres de campo del modelo Prisma de 03 §10.3 y tipos del dominio (`Centavos`, `FechaLocal`, `Instante`, `Uuid`); `secuencia` y `revision` pueden estar pendientes (04 §2.4.1).
- Tipos públicos de 04 §2.4: `Hechos`, `Instantanea`, `ComandoDominio` (unión vacía que cada OP extiende), `ResultadoAplicar`, `Cambio`, `TablaEscribible`, `Rechazo`, `Impacto`, `AvisoOperacion`, `GeneradorIds`.
- Sin funciones: solo tipos.

**Leer.** 04 §2.4, §2.4.1; 03 §0.4, §1.1, §3 (diccionario de las tablas [M] y [H]).

**Archivos.** `packages/dominio/src/hechos/*.ts`, `packages/dominio/src/index.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-101** (nueva, DT-17): los tipos públicos compilan con los nombres del modelo Prisma y `TablaEscribible` coincide con las tablas [M] y [H] de 03 §0.4 (`expectTypeOf`).
- La prueba nueva de tipos.

**Comandos.** `pnpm typecheck`; `pnpm test:unidad -t "PRU-DOM-MOTOR-101"`; `pnpm ci:local`.

**Terminada cuando.** Compila; las pruebas de tipos pasan.

#### TA-102 Generadores de prueba `@finn/dominio/pruebas`

```tarea
orden: 102
bloque: B2
hito: HT-2
depende: TA-101
tu: —
revision: normal
paralelo: libre
tamano: prod=0 archivos=0 ca=0 migraciones=0 total=560
cubre: GEN-base
pru: PRU-PROP-MOTOR-101
compartido: —
```

**Qué construir.**
- `packages/dominio/src/pruebas/generadores.ts`: `fechaArb`, `montoArb` (con los bordes 1, 99, 100 y 9.999 sesgados) y `hechosArb` (V7-03 extendido), con las restricciones de 07 §12.5.
- Subruta `@finn/dominio/pruebas`, importable solo desde archivos de prueba (regla L1, TA-004).
- `operacionesArb` llega en TA-124, cuando exista `aplicar`.

**Leer.** 07 §12.5, §7.1 (semilla `FC_SEED`); 04 §1.4.

**Archivos.** `packages/dominio/src/pruebas/generadores.ts` (clase prueba), `packages/dominio/package.json` (`exports`).

**Pruebas primero.**
- **PRU-PROP-MOTOR-101** (nueva, DT-17): los generadores respetan sus restricciones: ninguna fecha posterior a hoy, ningún monto ≤ 0, una asignación por categoría y período, claves de orden únicas.
- La prueba nueva de los generadores.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-MOTOR-101"`; `pnpm ci:local`.

**Terminada cuando.** Los generadores producen hechos válidos según sus restricciones y la regla L1 impide importarlos desde código de producción.

#### TA-103 Motor I: períodos y vigencias (01 §4.2)

```tarea
orden: 103
bloque: B2
hito: HT-2
depende: TA-101
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=3 ca=0 migraciones=0 total=620
cubre: MOT-4.2, INV-17, CB-13
pru: PRU-DOM-MOTOR-102, PRU-PROP-MOTOR-102
compartido: —
```

**Qué construir.**
- `calculo/periodos.ts`: inicios de cada vigencia, unión ordenada, período de una fecha, estado, duración y transición (01 §4.2 puntos 1 a 8).
- El punto 9 ("rige desde" de una vigencia nueva) va con OP-19 en TA-136.

**Leer.** 01 §1.1, §2.2.1, §2.2.2, §4.2; 01 §9 (CB-13).

**Archivos.** `packages/dominio/src/calculo/periodos.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-102** (nueva, DT-17): períodos con días de inicio 1, 21, 29, 30 y 31 (recorte), el período de transición del ejemplo de Q5 y el estado cerrado, activo o futuro.
- **PRU-PROP-MOTOR-102** (nueva, DT-17): inv. 17: con vigencias generadas, los períodos no tienen huecos ni solapamientos y hay exactamente un activo.
- Las dos pruebas nuevas, citando `[INV-17, CB-13]`.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-102|PRU-PROP-MOTOR-102"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan; cobertura de ramas ≥ 90 % en el archivo.

#### TA-104 Motor II: saldos, devoluciones D-1 a D-4 y actividad (01 §4.3, §4.4)

```tarea
orden: 104
bloque: B2
hito: HT-2
depende: TA-103
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=260 archivos=3 ca=0 migraciones=0 total=700
cubre: MOT-4.3, MOT-4.4, INV-04, CB-06, CB-32
pru: PRU-DOM-MOTOR-103, PRU-DOM-DEV-101
compartido: —
```

**Qué construir.**
- `calculo/saldos.ts` (§4.3) y `calculo/devoluciones.ts` (§4.4): consumo neto, aportes D-2 a D-4 y actividad de categorías normales y de pago (sin los traslados, que llegan en TA-105).

**Leer.** 01 §4.3, §4.4, §1.3 (efecto en cuenta), §2.2.10; 01 §9 (CB-06, CB-32).

**Archivos.** `packages/dominio/src/calculo/{saldos,devoluciones,actividad}.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-103** (nueva, DT-17): saldo, saldo confirmado, deuda y saldo a favor por tipo de cuenta, con el préstamo contando solo el capital.
- **PRU-DOM-DEV-101** (nueva, DT-17): clasificación D-1 a D-4 de cada línea de devolución con U_L y A_L, incluida una devolución en otra cuenta (CB-06) y una cuyo medio cambió después (CB-32).
- Las dos pruebas nuevas, citando `[INV-04]` y `[CB-06, CB-32]`.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-103|PRU-DOM-DEV-101"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan con los cuatro casos de §4.4.

#### TA-105 Motor III: reparto D2, respaldo y traslados (01 §4.5)

```tarea
orden: 105
bloque: B2
hito: HT-2
depende: TA-104
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=200 archivos=2 ca=0 migraciones=0 total=640
cubre: MOT-4.5, INV-05, INV-28, CB-08, CB-21
pru: PRU-DOM-MOTOR-104, PRU-PROP-MOTOR-103
compartido: —
```

**Qué construir.**
- `calculo/d2.ts`: fondo, reparto, traslados por tarjeta, SobT y SobD (01 §4.5, pasos 1 a 7).

**Leer.** 01 §4.1 (convenciones 2, 4 y 6), §4.5; 01 §6 (inv. 5, 28); 01 §9 (CB-08, CB-21).

**Archivos.** `packages/dominio/src/calculo/d2.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-104** (nueva, DT-17): reparto D2 con el orden (fecha, clave de orden, secuencia, orden de línea) **[CH-14]**, dos líneas de una compra en la misma categoría (CB-08) y el desempate por secuencia (CB-21).
- **PRU-PROP-MOTOR-103** (nueva, DT-17): inv. 28 y las propiedades de §4.5: 0 ≤ SobT ≤ sobregiro total; las partes no cubiertas son un sufijo; cada traslado resta y suma el mismo monto (inv. 5).
- Las dos pruebas nuevas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-104|PRU-PROP-MOTOR-103"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan; el mutante "sin orden D2" de 07 §19.4 las hace fallar (se comprueba a mano en el informe).

#### TA-106 Motor IV: Disponible, arrastre, cierre, sobregiros y pago excedente (01 §4.6, §4.7)

```tarea
orden: 106
bloque: B2
hito: HT-2
depende: TA-105
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=200 archivos=2 ca=0 migraciones=0 total=600
cubre: MOT-4.6, MOT-4.7, CB-11
pru: PRU-DOM-MOTOR-105
compartido: —
```

**Qué construir.**
- `calculo/disponible.ts` y `calculo/sobregiros.ts` con el orden de evaluación de §4.1 punto 4 (períodos del más antiguo al más reciente; normales antes que las de pago).

**Leer.** 01 §4.1, §4.6, §4.7; 01 §9 (CB-11).

**Archivos.** `packages/dominio/src/calculo/{disponible,sobregiros}.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-105** (nueva, DT-17): Disponible y arrastre en tres períodos, reinicio N(c, p), efectos del cierre en categorías normales, de pago y archivadas (CB-11), reducción proyectada y atribución del pago excedente por causa.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-105"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los mutantes "arrastre negativo" y "cierre adelantado" la hacen fallar.

#### TA-107 Motor V: deuda sin respaldo, reserva excedente, LPA y por cobrar (01 §4.8 a §4.10)

```tarea
orden: 107
bloque: B2
hito: HT-2
depende: TA-106
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=260 archivos=3 ca=0 migraciones=0 total=820
cubre: MOT-4.8, MOT-4.9, MOT-4.10, INV-01, INV-02, INV-03
pru: PRU-DOM-MOTOR-106, PRU-PROP-MOTOR-104
compartido: —
```

**Qué construir.**
- `calculo/tarjetas.ts`, `calculo/lpa.ts` y `calculo/por-cobrar.ts` (01 §4.8 a §4.10, con la descomposición para la pantalla de detalle de §4.9).

**Leer.** 01 §4.8, §4.9, §4.10, §4.11 (tabla de comprobación), §4.15; 01 §6 (inv. 1 a 3).

**Archivos.** `packages/dominio/src/calculo/{tarjetas,lpa,por-cobrar}.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-106** (nueva, DT-17): S(t), RE(t) y su descomposición; LPA con sus términos; LPA al cierre de un período con su comprobación; saldo abierto, dinero en camino y pago implícito.
- **PRU-PROP-MOTOR-104** (nueva, DT-17): inv. 1, 2 y 3 con `hechosArb`: identidad de saldo, deuda sin respaldo y S(t) = 0 o RE(t) = 0, en todo período.
- Las dos pruebas nuevas; la de propiedades cita `[INV-01, INV-02, INV-03]`.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-106|PRU-PROP-MOTOR-104"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan con 2.000 casos en local; el mutante "traslado sin tope" las hace fallar.

#### TA-108 Motor VI: metas, clasificación, patrimonio, tarjeta y ocurrencias (01 §4.12 a §4.14, §4.16)

```tarea
orden: 108
bloque: B2
hito: HT-2
depende: TA-107
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=4 ca=0 migraciones=0 total=820
cubre: MOT-4.12, MOT-4.13, MOT-4.14, MOT-4.16
pru: PRU-DOM-META-101, PRU-PROP-META-101, PRU-DOM-MOTOR-107
compartido: —
```

**Qué construir.**
- `calculo/metas.ts`, `calculo/clasificacion.ts`, `calculo/patrimonio.ts` (con §4.14) y `calculo/ocurrencias.ts` (§4.16; la regla de reactivación de CF-20 llega en TA-139).

**Leer.** 01 §4.12, §4.13, §4.14, §4.16; 01 §7.5.

**Archivos.** `packages/dominio/src/calculo/{metas,clasificacion,patrimonio,ocurrencias}.ts`.

**Pruebas primero.**
- **PRU-DOM-META-101** (nueva, DT-17): los cuatro tipos de meta con su pedido, falta y estado, la renovación anual y una meta para una fecha vencida.
- **PRU-PROP-META-101** (nueva, DT-17): en una meta de ahorro, la suma de los pedidos de los períodos restantes alcanza el monto (techo de 01 §0.4).
- **PRU-DOM-MOTOR-107** (nueva, DT-17): clasificación para reportes, patrimonio neto, fechas de corte con fin de mes, desglose al pagar y monto para no generar intereses; ocurrencias de programadas por frecuencia con recorte.
- Las tres pruebas nuevas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-META-101|PRU-PROP-META-101|PRU-DOM-MOTOR-107"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas pasan.

#### TA-109 Motor VII: `calcular()`, instantánea e invariantes

```tarea
orden: 109
bloque: B2
hito: HT-2
depende: TA-108, TA-102
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=240 archivos=3 ca=0 migraciones=0 total=640
cubre: BE-09-calcular, INV-26, INV-27
pru: PRU-PROP-MOTOR-105, PRU-DOM-MOTOR-108
compartido: —
```

**Qué construir.**
- `calcular(hechos, hoy)` arma la instantánea inmutable (`Object.freeze` profundo en desarrollo) con todos los derivados de 01 §3, en el orden de §4.1.
- `verificarInvariantes(i)` (04 §2.4) para los invariantes calculables de 01 §6.
- Inv. 27 por construcción: las fórmulas internas no se exportan; una prueba de la API pública falla si `index.ts` exporta algo de `calculo/`.

**Leer.** 01 §3 (regla de cierre), §4.1, §6; 04 §2.4; 02 §2.3.

**Archivos.** `packages/dominio/src/calculo/calcular.ts`, `packages/dominio/src/invariantes.ts`, `packages/dominio/src/index.ts`.

**Pruebas primero.**
- **PRU-PROP-MOTOR-105** (nueva, DT-17): inv. 26: los mismos hechos en cualquier orden de inserción producen la misma instantánea.
- **PRU-DOM-MOTOR-108** (nueva, DT-17): `verificarInvariantes` detecta cada invariante calculable roto en una instantánea alterada, y ninguno en una correcta.
- Las dos pruebas nuevas; la de la API pública cita `[INV-27]`.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-MOTOR-105|PRU-DOM-MOTOR-108"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan; cobertura de ramas de `@finn/dominio` ≥ 90 %.

#### TA-110 Avisos de estado (AV de clase Estado)

```tarea
orden: 110
bloque: B2
hito: HT-2
depende: TA-109
tu: —
revision: normal
paralelo: libre
tamano: prod=220 archivos=2 ca=0 migraciones=0 total=560
cubre: AV-02, AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, AV-14, AV-17, AV-20
pru: PRU-DOM-MOTOR-109
compartido: —
```

**Qué construir.**
- `avisos/estado.ts`: los avisos de estado de 01 §5.0.7 con sus montos, incluida la atribución de E(t, A) por causa (§4.7) y las dos variantes de AV-06 (C-4); el texto lo arma la aplicación (04 §7.10).

**Leer.** 01 §5.0.7, §4.7, §4.8; 04 §6.0 (avisos en los DTO).

**Archivos.** `packages/dominio/src/avisos/estado.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-109** (nueva, DT-17): cada aviso de estado aparece en la instantánea con sus datos exactamente cuando se cumple su condición, y desaparece cuando deja de cumplirse (AV-02 a AV-09, AV-14, AV-17, AV-20).
- La prueba nueva, un caso por aviso, citando cada `AV-nn`.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-109"`; `pnpm ci:local`.

**Terminada cuando.** Once avisos con su caso de aparición y desaparición.

#### TA-111 Modelo de préstamo de Banco Agrícola y OP-48 (01 Anexo A)

```tarea
orden: 111
bloque: B2
hito: HT-2
depende: TA-108
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=240 archivos=3 ca=0 migraciones=0 total=600
cubre: MOT-AnexoA, OP-48@dom
pru: PRU-DOM-CTA-101
compartido: —
```

**Qué construir.**
- `prestamos/agricola.ts` con el contrato de A.1 y las reglas de A.2; `prestamos/contrato.ts`.
- OP-48 en `aplicar` (condiciones y modelo de un préstamo), sin efecto presupuestario.
- Los puntos marcados "validar" quedan como están: PRU-MAN-CTA-001 los contrasta con un estado de cuenta real (07 §22.1).

**Leer.** 01 Anexo A (A.1, A.2), 2.2.5, 2.2.23, OP-48; 04 OP-48.

**Archivos.** `packages/dominio/src/prestamos/{contrato,agricola}.ts`, `packages/dominio/src/operaciones/op-48.ts`, `packages/dominio/src/valores/centavos.ts` (solo la proporción mitad hacia arriba del Anexo A) y `packages/dominio/src/hechos/operaciones.ts` (la variante de OP-48 en `ComandoDominio`). **[CH-17]**

**Pruebas primero.**
- **PRU-DOM-CTA-101** (nueva, DT-17): el ejemplo numérico de A.2 (cuotas 1 a 3 con el abono del 20 de marzo) sale exacto, con el emparejamiento por número y por fecha (±10 días) y el umbral de 0.99 × Q. Cubre también el borde del redondeo mitad hacia arriba de la proporción (01 §0.4). **[CH-17]**
- La prueba nueva cita `[CA-55.1, CA-55.2]` como contexto (los CA son de la ficha FT-55, DT-18).

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CTA-101"`; `pnpm ci:local`.

**Terminada cuando.** La tabla del ejemplo sale igual a A.2 al centavo.

#### TA-112 Oráculo, diferencial y mutantes del nocturno

```tarea
orden: 112
bloque: B2
hito: HT-2
depende: TA-109
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=140 archivos=4 ca=0 migraciones=0 total=520
cubre: CT-05, DP-26, MOT-diferencial
pru: PRU-PROP-MOTOR-106
compartido: —
```

**Qué construir.**
- **Portado** `tools/pruebas/oraculo/motor_min.py` (zip de la Fase 6, alcance congelado de V7-03, CT-05).
- El diferencial serializa los hechos, llama al oráculo con `python3 -I` y compara.
- Los 4 mutantes de 07 §19.4 detrás de `FINN_MUTANTE`, compilados solo en el nocturno; el nocturno corre `PROP` y `ESC@motor` con cada uno y falla si alguno sobrevive.

**Leer.** 07 §3.1 (oráculo), §8, §19.4; 02 "Enmiendas posteriores" (CT-05).

**Archivos.** `tools/pruebas/oraculo/motor_min.py` (portado), `tools/pruebas/oraculo/oraculo.py`, `tools/pruebas/oraculo/diferencial.prop.test.ts`, `packages/dominio/src/calculo/mutantes.ts`, los enganches en `packages/dominio/src/calculo/{d2,disponible,lpa}.ts`, `vitest.config.ts`, `tools/ci/afecta.mjs` (mutantes en `nocturno()`), `.github/workflows/nocturno.yml`, `tsconfig.json`, `package.json` y `pnpm-lock.yaml` (`fast-check` en la raíz). **[CH-19]**

**Pruebas primero.**
- **PRU-PROP-MOTOR-106** (nueva, DT-17): diferencial: para hechos del subconjunto congelado de V7-03, `calcular` y `motor_min.py` dan los mismos Disponibles, S, RE y LPA.
- La prueba nueva con 300 casos en PR y 10.000 en el nocturno.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-MOTOR-106"`; `FINN_MUTANTE=arrastre pnpm test:unidad -t "PRU-PROP-MOTOR"` (debe fallar); `pnpm ci:local`.

**Terminada cuando.** El diferencial pasa; cada mutante hace fallar al menos una prueba.

#### TA-113 `aplicar()`: marco, rechazos, impacto y huella

```tarea
orden: 113
bloque: B2
hito: HT-2
depende: TA-109, TA-110
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=5 ca=0 migraciones=0 total=760
cubre: BE-09, MOT-5.0, AV-01
pru: PRU-DOM-VAL-003, PRU-DOM-MOTOR-110
compartido: —
```

**Qué construir.**
- `aplicar(hechos, comando, hoy)`: despacho por OP, cálculo antes y después, verificación de invariantes (§5.0.1), `Cambio[]`, `hechosNuevos` con las cascadas de 03 (DB-12), impacto (§5.0.3) y avisos de operación.
- Bloqueo de períodos cerrados (§5.0.4), archivo (§5.0.5) y fechas (§5.0.6) como verificaciones comunes.
- Huella del impacto estable sin los ids nuevos (V-20, PRU-DOM-VAL-003).

**Leer.** 01 §5.0 completo; 04 §2.4, §2.4.1, §4.3 (huella), §7.5.

**Archivos.** `packages/dominio/src/operaciones/{aplicar,comunes,impacto,rechazos}.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-110** (nueva, DT-17): una operación que rompe una invariante se rechaza completa con `invariante_violada` y los hechos quedan iguales; el impacto retroactivo (AV-01) lista Δ LPA, Δ Disp, Δ S, Δ RE y Δ de la reducción proyectada.
- PRU-DOM-VAL-003 (V-20) y la prueba nueva con una operación de prueba interna.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-VAL-003|PRU-DOM-MOTOR-110"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-114 `aplicar`: cuentas (OP-01 a OP-06)

```tarea
orden: 114
bloque: B2
hito: HT-2
depende: TA-113
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=6 ca=0 migraciones=0 total=900
cubre: OP-01@dom, OP-02@dom, OP-03@dom, OP-04@dom, OP-05@dom, OP-06@dom, BE-35, INV-22, INV-25, CB-14, AV-15
pru: PRU-DOM-CTA-102
compartido: —
```

**Qué construir.**
- Una función por OP en `operaciones/`, con la entrada resuelta de 04 §3.1 (BE-10), sus precondiciones y rechazos, los `Cambio[]` y los avisos.

**Leer.** 01 §5.1 (OP-01 a OP-06), §7.7; 04 §3.0, §3.1; 01 §6 (inv. 22, 24, 25); 01 §9 (CB-14).

**Archivos.** `packages/dominio/src/operaciones/op-0{1..6}.ts`.

**Pruebas primero.**
- **PRU-DOM-CTA-102** (nueva, DT-17): OP-01 a OP-06: hechos que producen, cada rechazo de 01 §5.1 y 04 §3.1, la categoría de pago con el nombre de su tarjeta (BE-35), dos cuentas con los mismos 4 dígitos en instituciones distintas (CB-14), y la eliminación de una tarjeta con asignaciones en un período cerrado (F1, AV-15).
- La prueba nueva, con un caso por rechazo y por efecto.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CTA-102"`; `pnpm ci:local`.

**Terminada cuando.** Cada rechazo de 04 §3.1 tiene su caso y pasa.

#### TA-115 `aplicar`: crear, archivar, sacar y fusionar categorías (OP-07, OP-09, OP-11, OP-12; parte 1; la parte 2 es TA-236)

Partida por tamaño (DT-02, 08 §1.2): esta parte tiene las operaciones que necesitan los escenarios de la ola 1 (OP-07 para crear las categorías, OP-09 y OP-11 en ESC-44, OP-12 en ESC-42; E13) y las reglas comunes de búsqueda, nombre, grupo destino y dinero; renombrar, desarchivar, eliminar y la variante en lote de OP-07 son TA-236.

```tarea
orden: 115
bloque: B2
hito: HT-2
depende: TA-113
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=370 archivos=7 ca=0 migraciones=0 total=1000
cubre: OP-07@dom, OP-09@dom, OP-11@dom, OP-12@dom, INV-23, CB-20, AV-13
pru: PRU-DOM-CATEG-101
compartido: —
```

**Qué construir.**
- Una función por OP en `operaciones/op-07.ts`, `op-09.ts`, `op-11.ts` y `op-12.ts`, en la tabla de `aplicar.ts` y en `ComandoDominio`; OP-12 declara `operacionDeclarada: 'fusion'` (04 §4.4). `op-07.ts` deja `buscar`, `nombreOcupado` y `grupoValido`, y `op-09.ts` deja `ajustar`, `mover` y `destinoValido`, que usa TA-236.

**Leer.** 01 §5.2, §7.6; 04 §3.2, §4.4; 01 §6 (inv. 20, 23); 01 §9 (CB-20).

**Archivos.** `packages/dominio/src/operaciones/{op-07,op-09,op-11,op-12,aplicar,comunes}.ts`, `packages/dominio/src/hechos/operaciones.ts`.

**Pruebas primero.**
- **PRU-DOM-CATEG-101** (nueva, DT-17): OP-07, OP-09, OP-11 y OP-12: crear un grupo o una categoría, archivar como operación compuesta, sacar el Disponible de una archivada, fusión con asignaciones de períodos cerrados (O4) y su impacto (AV-13, ESC-42), fusión hacia una categoría con meta (CB-20) y la categoría de pago fuera de la fusión (inv. 23).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CATEG-101"`; `pnpm ci:local`.

**Terminada cuando.** Cada rechazo de 04 §3.2 de OP-07, OP-09, OP-11 y OP-12 tiene su caso y pasa; la fusión no rompe inv. 18.

#### TA-236 `aplicar`: renombrar, desarchivar, eliminar y crear en lote (OP-08, OP-10, OP-13, CF-19; parte 2 de TA-115)

Parte 2 de TA-115 (DT-02, 08 §1.2). Ningún escenario de la ola 1 usa estas operaciones (E13). La rama local `ta-236-estructura-wip` tiene un borrador completo de esta parte, con su prueba, sobre el que se puede partir.

```tarea
orden: 142
bloque: B2
hito: HT-2
depende: TA-115
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=6 ca=0 migraciones=0 total=520
cubre: OP-08@dom, OP-10@dom, OP-13@dom, CF-19, CB-34
pru: PRU-DOM-CATEG-104
compartido: —
```

**Qué construir.**
- Una función por OP en `operaciones/op-08.ts`, `op-10.ts` y `op-13.ts`, en la tabla de `aplicar.ts` y en `ComandoDominio`, con las reglas que dejó TA-115 en `op-07.ts`; OP-13 reusa `puedeEliminar` de `selectores/estructura.ts`.
- La variante en lote de OP-07 (CF-19, 04 §3.2, 06 §3.9.1): `{ elementos }` de 1 a 15, en orden y no atómica; las categorías de un grupo que falló responden con su motivo sin intentarse, y un id ya creado responde `ya_aplicada`.

**Leer.** 01 §5.2, §7.6; 04 §3.2, §4.6.1; 06 §3.9 (CF-19); 01 §9 (CB-34).

**Archivos.** `packages/dominio/src/operaciones/{op-08,op-10,op-13,op-07,aplicar}.ts`, `packages/dominio/src/hechos/operaciones.ts`.

**Pruebas primero.**
- **PRU-DOM-CATEG-104** (nueva, DT-17): OP-08, OP-10 y OP-13 con cada rechazo de 04 §3.2; reordenar con posición × 10 solo en las filas que cambian; la meta de una categoría archivada vuelve a evaluarse al desarchivar (CB-34); y la variante en lote de OP-07 (CF-19) con un grupo que falla y la reanudación con los mismos ids.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CATEG-104"`; `pnpm ci:local`.

**Terminada cuando.** Cada rechazo de 04 §3.2 de OP-08, OP-10 y OP-13 tiene su caso y pasa.

#### TA-116 `aplicar`: asignar, mover, auto-asignar y metas (OP-14, OP-15, OP-17, OP-18)

```tarea
orden: 116
bloque: B2
hito: HT-2
depende: TA-113
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=4 ca=0 migraciones=0 total=820
cubre: OP-14@dom, OP-15@dom, OP-17@dom, OP-18@dom, CB-09, CB-10, CB-25, CB-27, AV-11, AV-18
pru: PRU-DOM-PRES-101
compartido: —
```

**Qué construir.**
- Una función por OP; OP-16 y OP-19 van en la ola 2 (TA-136).

**Leer.** 01 §5.3 (OP-14, OP-15, OP-17, OP-18); 04 §3.3; 01 §9 (CB-09, CB-10, CB-25, CB-27).

**Archivos.** `packages/dominio/src/operaciones/op-1{4,5,7,8}.ts`.

**Pruebas primero.**
- **PRU-DOM-PRES-101** (nueva, DT-17): OP-14, OP-15, OP-17 y OP-18: LPA negativo en el activo con AV-11, rechazo en un futuro (I1), desasignar por debajo de cero (CB-09), LPA negativo al cierre (CB-10), asignar a una archivada (CB-25), meta con fecha pasada (CB-27) y auto-asignar con LPA insuficiente (AV-18).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PRES-101"`; `pnpm ci:local`.

**Terminada cuando.** Cada rechazo de 04 §3.3 de estas OP tiene su caso y pasa.

#### TA-117 `aplicar`: registrar transacciones (OP-20 a OP-24, OP-27)

```tarea
orden: 117
bloque: B2
hito: HT-2
depende: TA-113, TA-111
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=380 archivos=7 ca=0 migraciones=0 total=1000
cubre: OP-20@dom, OP-21@dom, OP-22@dom, OP-23@dom, OP-24@dom, OP-27@dom, INV-06, INV-07, INV-08, INV-12, CB-01, CB-07, CB-19, CB-26, CB-28, CB-29, AV-10, AV-24
pru: PRU-DOM-TX-101, PRU-PROP-TX-101
compartido: —
```

**Qué construir.**
- Una función por OP; OP-24 usa el desglose propuesto del modelo (TA-111) y lo acepta confirmado por el usuario.

**Leer.** 01 §5.4 (OP-20 a OP-24, OP-27), 2.2.9; 04 §3.4; 01 §6 (inv. 6 a 8, 12); 01 §9 (CB-01, CB-07, CB-19, CB-26, CB-28, CB-29).

**Archivos.** `packages/dominio/src/operaciones/op-2{0..4}.ts`, `op-27.ts`.

**Pruebas primero.**
- **PRU-DOM-TX-101** (nueva, DT-17): OP-20 a OP-24 y OP-27: líneas que no suman el total, fecha anterior a la apertura (CB-19), monto cero (CB-28), transferencia a la misma cuenta (CB-29), pago sin deuda (CB-01) y olvidado en un período cerrado (CB-26) con AV-10, cuota con tarjeta (CB-07) y transferencia de deuda con AV-24.
- **PRU-PROP-TX-101** (nueva, DT-17): inv. 6, 7, 8 y 12 sobre transacciones generadas: líneas que suman el total, destino válido y fechas entre la apertura y hoy.
- Las dos pruebas nuevas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-TX-101|PRU-PROP-TX-101"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan; cada rechazo de 04 §3.4 de estas OP tiene su caso.

#### TA-118 `aplicar`: editar, eliminar y estado bancario (OP-28 a OP-30)

```tarea
orden: 118
bloque: B2
hito: HT-2
depende: TA-117
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=4 ca=0 migraciones=0 total=860
cubre: OP-28@dom, OP-29@dom, OP-30@dom, CB-03, CB-04, CB-24, CB-30, AV-16
pru: PRU-DOM-TX-102
compartido: —
```

**Qué construir.**
- Una función por OP; la clave de orden pasa al instante del cambio cuando cambia la fecha (supuesto 5).

**Leer.** 01 §5.4 (OP-28 a OP-30), §7.2; 04 §3.4; 01 §9 (CB-03, CB-04, CB-24, CB-30).

**Archivos.** `packages/dominio/src/operaciones/op-2{8,9}.ts`, `op-30.ts`.

**Pruebas primero.**
- **PRU-DOM-TX-102** (nueva, DT-17): OP-28 por campo (tabla de 01 §5.4), OP-29 y OP-30: reducir una línea por debajo de lo resuelto (CB-03), eliminar con eventos (CB-04), cuenta archivada (CB-24), cambio de cuenta de una conciliada (CB-30) con AV-16 y el cambio posterior, y las transiciones de 01 §7.2.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-TX-102"`; `pnpm ci:local`.

**Terminada cuando.** Cada fila de la tabla de OP-28 tiene su caso y pasa.

#### TA-119 `aplicar`: cobrar y renombrar deudor (OP-31, OP-52)

```tarea
orden: 119
bloque: B2
hito: HT-2
depende: TA-117
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=240 archivos=3 ca=0 migraciones=0 total=640
cubre: OP-31@dom, OP-52@dom, BE-36, INV-09, CB-05, CB-23, AV-22
pru: PRU-DOM-COBRO-101, PRU-PROP-COBRO-101
compartido: —
```

**Qué construir.**
- OP-31 y OP-52 (04 §3.5).

**Leer.** 01 §5.5 (OP-31), §4.10; 04 §3.5 (OP-31, OP-52); 01 §9 (CB-05, CB-23).

**Archivos.** `packages/dominio/src/operaciones/op-31.ts`, `op-52.ts`.

**Pruebas primero.**
- **PRU-DOM-COBRO-101** (nueva, DT-17): OP-31 con los cuatro casos de §4.10 (débito o tarjeta, depósito en efectivo o tarjeta), excedente, pago implícito, cobro de un por cobrar cerrado (CB-23), cobro en tarjeta (CB-05), la asignación a pago(t) en la misma operación (BE-36, AV-22) y OP-52.
- **PRU-PROP-COBRO-101** (nueva, DT-17): inv. 9: restituido + condonado + devuelto ≤ monto de la línea y saldo abierto ≥ 0.
- Las dos pruebas nuevas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-COBRO-101|PRU-PROP-COBRO-101"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan.

#### TA-120 Criterios de comparación (01 §4.17) y OP-35 en el dominio

```tarea
orden: 120
bloque: B2
hito: HT-2
depende: TA-113
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=280 archivos=4 ca=0 migraciones=0 total=760
cubre: MOT-4.17, OP-35@dom, INV-13, INV-16, CB-15, CB-16, CB-17, AV-23
pru: PRU-DOM-BAND-101
compartido: —
```

**Qué construir.**
- `criterios/` con las reglas de §4.17 y los pasos 2 a 11 de OP-35 sobre la interpretación ya hecha por `@finn/sms` (fuera del bloqueo, BE-45); los datos de AV-23 para la notificación.
- Inv. 13: los movimientos, programadas y esperadas no entran a `calcular`.

**Leer.** 01 §4.17, OP-35, §7.1; 04 §3.6 (OP-35), §8.4; 01 §6 (inv. 13, 16); 01 §9 (CB-15 a CB-17).

**Archivos.** `packages/dominio/src/criterios/*.ts`, `packages/dominio/src/operaciones/op-35.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-101** (nueva, DT-17): autodescarte a 10 minutos exactos, emparejamiento con sus desempates, posible duplicado, regla de comercio de patrón más largo y sugerencia por historial; pasos 2 a 11 de OP-35 con cuenta archivada o inexistente (CB-15), dos SMS de la misma ocurrencia (CB-16) y candidatos aprobados o pendientes (CB-17).
- La prueba nueva, citando `[INV-13, INV-16]` y los CB.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con los bordes de 10 minutos, ±1 día y ±5 días.

#### TA-121 `aplicar`: editar, aprobar y resolver movimientos (OP-36, OP-37, OP-40)

```tarea
orden: 121
bloque: B2
hito: HT-2
depende: TA-120, TA-117, TA-119
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=4 ca=0 migraciones=0 total=840
cubre: OP-36@dom, OP-37@dom, OP-40@dom, CF-21
pru: PRU-DOM-BAND-102
compartido: —
```

**Qué construir.**
- OP-36, OP-37 (ejecuta la OP de su tipo con hora de registro = recepción del SMS, D2) y OP-40.

**Leer.** 01 §5.6 (OP-36, OP-37, OP-40), §7.1; 04 §3.6; 06 §0.7 (CF-21).

**Archivos.** `packages/dominio/src/operaciones/op-3{6,7}.ts`, `op-40.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-102** (nueva, DT-17): OP-37 por tipo de movimiento, con coincidencia sobre esperada pendiente y sobre transacción ya registrada, "recordar categoría", la variante `{ categoriaId }` y su rechazo `arrastre_no_permitido` (CF-21); OP-36 y OP-40 con las transiciones de 01 §7.1.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-102"`; `pnpm ci:local`.

**Terminada cuando.** Cada transición de 01 §7.1 de estas OP tiene su caso.

#### TA-122 `aplicar`: aprobar todos, descartar, reglas, reprocesar y crear a mano (OP-38, OP-39, OP-41, OP-49, OP-50)

```tarea
orden: 122
bloque: B2
hito: HT-2
depende: TA-121
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=5 ca=0 migraciones=0 total=780
cubre: OP-38@dom, OP-39@dom, OP-41@dom, OP-49@dom, OP-50@dom, INV-15, AV-19
pru: PRU-DOM-BAND-103
compartido: —
```

**Qué construir.**
- Una función por OP; OP-38 como lista de aprobaciones independientes.

**Leer.** 01 §5.6 (OP-38, OP-39, OP-41), §7.1; 02 N-02; 04 §3.6 (OP-38, OP-39, OP-41, OP-49, OP-50).

**Archivos.** `packages/dominio/src/operaciones/op-3{8,9}.ts`, `op-41.ts`, `op-49.ts`, `op-50.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-103** (nueva, DT-17): OP-38 con elegibles y no elegibles y su informe AV-19; OP-39 descartar y restaurar con reevaluación; OP-41; OP-49 con el instante de recepción original (N-02) y OP-50; inv. 15 (un movimiento aprobado, una transacción; una esperada, una resolución).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-123 `aplicar`: conciliación y verificar saldo (OP-45, OP-46, OP-47, OP-53)

```tarea
orden: 123
bloque: B2
hito: HT-2
depende: TA-118
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=5 ca=0 migraciones=0 total=820
cubre: OP-45@dom, OP-46@dom, OP-47@dom, OP-53@dom, BE-48, CF-01, INV-14, CB-18, AV-21
pru: PRU-DOM-CONC-101
compartido: —
```

**Qué construir.**
- Clasificación en el dominio (BE-48), OP-46 (origen importada, estado confirmada), OP-47 y OP-53 (modo `saldo`).

**Leer.** 01 §5.8, §1.8, "Enmiendas posteriores" (CF-01); 04 §3.8, §9.5, OP-53; 06 §3.2.

**Archivos.** `packages/dominio/src/operaciones/op-4{5,6,7}.ts`, `op-53.ts`, `packages/dominio/src/selectores/conciliacion.ts`.

**Pruebas primero.**
- **PRU-DOM-CONC-101** (nueva, DT-17): `seleccionar.clasificarConciliacion` (1 a 1, fecha más cercana, clave de orden), reclasificación en OP-46 y OP-47 con `coincidencia_no_valida`, diferencia aceptada con su signo en efectivo y en tarjeta (ESC-47, CF-01) y OP-53 sin estado de cuenta; ninguna conciliación crea transacciones (inv. 14).
- La prueba nueva, citando `[INV-14, CB-18, AV-21]`.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CONC-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con los signos de ESC-47.

#### TA-124 `operacionesArb` y propiedades de períodos, asignaciones y estructura

```tarea
orden: 124
bloque: B2
hito: HT-2
depende: TA-114, TA-115, TA-116, TA-117, TA-118, TA-119, TA-122, TA-123
tu: —
revision: normal
paralelo: libre
tamano: prod=0 archivos=0 ca=0 migraciones=0 total=620
cubre: GEN-operaciones, INV-18, INV-19, INV-20, INV-21, INV-24
pru: PRU-PROP-MOTOR-107
compartido: —
```

**Qué construir.**
- `operacionesArb` en `@finn/dominio/pruebas` sobre las OP de la ola 1; la ola 2 la extiende (TA-136 a TA-139, campo `compartido`).

**Leer.** 07 §12.5 (`operacionesArb`); 01 §6 (inv. 18 a 21, 24).

**Archivos.** `packages/dominio/src/pruebas/operaciones.ts` (clase prueba).

**Pruebas primero.**
- **PRU-PROP-MOTOR-107** (nueva, DT-17): con secuencias de operaciones generadas (`fc.commands`), después de cada paso aceptado se cumplen inv. 18, 19, 20, 21 y 24, y un rechazo deja los hechos iguales.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-MOTOR-107"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con 2.000 casos en local.

#### TA-125 Selectores de Presupuesto (parte 1; la parte 2 es TA-234)

Partida en dos por tamaño (DT-02, 08 §1.2): esta parte tiene los tipos comunes de los selectores y el selector de Presupuesto; Inicio y el detalle de LPA son TA-234. Un período posterior al último que calculó `calcular` lanza `RangeError` hasta que TA-235 lo proyecte.

```tarea
orden: 125
bloque: B2
hito: HT-2
depende: TA-110
tu: —
revision: normal
paralelo: libre
tamano: prod=376 archivos=2 ca=0 migraciones=0 total=775
cubre: SEL-presupuesto, BE-39
pru: PRU-DOM-PRES-102
compartido: CF-25 (proporciones de Presupuesto; dueño TA-136)
```

**Qué construir.**
- `selectores/comunes.ts` (`Ref`, `SobregiroDto`, `PeriodoDto`, nombres por id y causas del excedente) y `selectores/presupuesto.ts` con los campos de 04 §6.2 que salen del motor, los filtros de BE-39 y las proporciones de CF-25.

**Leer.** 04 §6.0.5, §6.2; 06 §5.8 (CF-25).

**Archivos.** `packages/dominio/src/selectores/{comunes,presupuesto}.ts`.

**Pruebas primero.**
- **PRU-DOM-PRES-102** (nueva, DT-17): los datos de `PresupuestoDto` (con los filtros de BE-39 y las proporciones de CF-25) salen de la instantánea sin fórmulas propias; período cerrado y período fuera del rango calculado.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PRES-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; ningún selector repite una fórmula de `calculo/` (revisión del informe).

#### TA-234 Selectores de Inicio y detalle de LPA (parte 2 de TA-125)

Parte 2 de TA-125 (DT-02, 08 §1.2): los selectores de Inicio (04 §6.1) y del detalle de Listo para asignar (04 §6.4).

```tarea
orden: 139
bloque: B2
hito: HT-2
depende: TA-125
tu: —
revision: normal
paralelo: libre
tamano: prod=275 archivos=2 ca=0 migraciones=0 total=480
cubre: SEL-inicio, SEL-detalleLpa, BE-37, CF-18
pru: PRU-DOM-PRES-104
compartido: —
```

**Qué construir.**
- `selectores/inicio.ts` y `selectores/detalle-lpa.ts` con los campos de 04 §6.1 y §6.4 que salen del motor (la consulta arma `Encabezado`, `bandeja`, `cambiosRetroactivos`, `hallazgosRitmo`, `recientes` y las `accion` de AV-08 y AV-14).

**Leer.** 04 §6.0.5, §6.1, §6.4; 06 §3.15 (CF-18).

**Archivos.** `packages/dominio/src/selectores/{inicio,detalle-lpa}.ts`.

**Pruebas primero.**
- **PRU-DOM-PRES-104** (nueva, DT-17): los datos de `InicioDto` y `DetalleLpaDto` salen de la instantánea sin fórmulas propias; próximos pagos con horizonte de 7 días (BE-37), primeros pasos (CF-18) y la descomposición de LPA que suma `lpa`.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PRES-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; ningún selector repite una fórmula de `calculo/` (revisión del informe).

#### TA-235 Proyección de períodos futuros en `calcular` (04 §6.2, 01 §4.6)

```tarea
orden: 140
bloque: B2
hito: HT-2
depende: TA-109
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=120 archivos=2 ca=0 migraciones=0 total=300
cubre: —
pru: PRU-DOM-MOTOR-111
compartido: —
```

**Qué construir.**
- `presupuesto()` de un período posterior al último de la instantánea da el Disponible proyectado con actividad cero (04 §6.2, 01 §4.6), sin que los selectores calculen nada. El diseño (extender el rango de períodos en `calcular` o una función del motor) lo decide esta tarea. Hoy `selectores/presupuesto.ts` lanza `RangeError` en ese caso (límite conocido de TA-125). No bloquea nada de B2; la necesita la consulta de presupuesto de B3 (TA-169).

**Leer.** 01 §4.6; 04 §2.4, §6.2.

**Archivos.** `packages/dominio/src/calculo/{calcular,disponible}.ts`.

**Pruebas primero.**
- **PRU-DOM-MOTOR-111** (nueva, DT-17): el período siguiente al último con datos tiene Arr = máx(0, último Disp), Asig = Act = 0 y se obtiene de la instantánea; las invariantes de `verificarInvariantes` siguen sin romperse.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-111"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; `PRU-PROP-MOTOR-105` sigue en verde.

#### TA-126 Selectores de detalle de categoría, metas y estructura

Partida por tamaño (DT-02, 08 §1.2): esta parte tiene el detalle de la categoría normal, las metas y la estructura; el detalle de la categoría de pago es TA-231.

```tarea
orden: 126
bloque: B2
hito: HT-2
depende: TA-110
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=3 ca=0 migraciones=0 total=680
cubre: SEL-metas, SEL-estructura, CF-17
pru: PRU-DOM-CATEG-102
compartido: —
```

**Qué construir.**
- `selectores/detalle-categoria.ts`, `metas.ts`, `estructura.ts` (04 §6.3, §6.10, §6.12.4) con la definición de CF-17.

**Leer.** 04 §6.3, §6.10, §6.12.4; 06 §3.14 (CF-17).

**Archivos.** `packages/dominio/src/selectores/{detalle-categoria,metas,estructura}.ts`.

**Pruebas primero.**
- **PRU-DOM-CATEG-102** (nueva, DT-17): reparto, calendario e historial de una categoría con "existía en el período" (CF-17), metas y estructura.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CATEG-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-231 Selector de detalle de categoría de pago de tarjeta (parte 2 de TA-126)

Parte 2 de TA-126 (DT-02, 08 §1.2): TA-126 tiene el detalle de la categoría normal, las metas y la estructura; esta parte tiene la variante `DetallePagoTarjetaDto` de 04 §6.3.

```tarea
orden: 127
bloque: B2
hito: HT-2
depende: TA-126
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=1 ca=0 migraciones=0 total=700
cubre: SEL-detalleCategoria
pru: PRU-DOM-CATEG-103
compartido: —
```

**Qué construir.**
- `selectores/detalle-pago-tarjeta.ts`: el detalle de pago(t) de 04 §6.3 (segundo bloque) con `tarjetaHoy`, `pagoExcedente`, los traslados, los pagos, los pagos implícitos, las devoluciones D-3 y D-4, el desglose al pagar (§4.14) y el historial. Lee la instantánea sin recalcular.

**Leer.** 04 §6.3 (categoría de pago); 01 §4.7, §4.8 y §4.14.

**Archivos.** `packages/dominio/src/selectores/detalle-pago-tarjeta.ts`.

**Pruebas primero.**
- **PRU-DOM-CATEG-103** (nueva, DT-17): traslados, pagos, pagos implícitos, devoluciones y desglose al pagar de una categoría de pago con un estado conocido.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CATEG-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-127 Selectores de actividad y detalle de transacción (parte 1; la parte 2 es TA-237)

Partida por tamaño (DT-02, 08 §1.2): esta parte tiene la actividad y el detalle de una transacción; las cuentas y el detalle de cuenta son TA-237.

```tarea
orden: 128
bloque: B2
hito: HT-2
depende: TA-110, TA-111
tu: —
revision: normal
paralelo: libre
tamano: prod=398 archivos=2 ca=0 migraciones=0 total=700
cubre: SEL-actividad, SEL-detalleTransaccion
pru: PRU-DOM-CTA-103
compartido: —
```

**Qué construir.**
- `selectores/actividad.ts` y `detalle-transaccion.ts` (04 §6.7). Dejan también `filaDe`, `indice`, `paginar` y `claveDe`, que usa TA-237.

**Leer.** 04 §6.7; 01 §4.10.

**Archivos.** `packages/dominio/src/selectores/{actividad,detalle-transaccion}.ts`.

**Pruebas primero.**
- **PRU-DOM-CTA-103** (nueva, DT-17): actividad con búsqueda, filtros y cursor, y el detalle de una transacción con sus eventos y restricciones.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CTA-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-237 Selectores de cuentas y detalle de cuenta (parte 2 de TA-127)

Parte 2 de TA-127 (DT-02, 08 §1.2): TA-127 tiene la actividad y el detalle de transacción; esta parte tiene las cuentas y el detalle de cuenta (04 §6.5 y §6.6). **Punto de partida:** el commit `ec25f1c` (rama local `ta-237-base`), que ya tiene `cuentas.ts` y `detalle-cuenta.ts` sin pruebas.

```tarea
orden: 141
bloque: B2
hito: HT-2
depende: TA-127
tu: —
revision: normal
paralelo: libre
tamano: prod=400 archivos=2 ca=0 migraciones=0 total=800
cubre: SEL-cuentas, SEL-detalleCuenta
pru: PRU-DOM-CTA-105
compartido: —
```

**Qué construir.**
- `selectores/cuentas.ts` y `detalle-cuenta.ts` (04 §6.5, §6.6): posición neta con sus barras, saldos por tipo, tarjetas con próximo corte y pago, préstamos, saldo corrido, conciliaciones, desglose al pagar y tabla de amortización. Reusa `filaDe`, `indice` y `paginar` de `actividad.ts`.
- El código del commit mide 474 líneas de producción: se espera un exceso de hasta el 30 %, que el orquestador acepta en el merge (CH-15). La ficha declara 400 porque el verificador no admite más.

**Leer.** 04 §6.5, §6.6; 01 §4.14.

**Archivos.** `packages/dominio/src/selectores/{cuentas,detalle-cuenta}.ts`.

**Pruebas primero.**
- **PRU-DOM-CTA-105** (nueva, DT-17; PRU-DOM-CTA-104 es de TA-137): posición neta, saldos por cuenta, desglose del pago y monto para no generar intereses, tabla de amortización y movimientos con su saldo corrido.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CTA-105"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-128 Sugerencia de categoría, comercios recientes y `Propuesta` extendida (parte 1 de la bandeja y los formularios de la ola 1)

Partida en cuatro por tamaño (DT-02, 08 §1.2, CH-26): esta parte tiene la sugerencia de categoría, los comercios recientes y la forma de `Propuesta` (CF-05); la bandeja es TA-232; los contextos de formulario son TA-233 y TA-240. **Punto de partida de las otras tres:** la rama `ta-128-origen-completo` (commit 103fcf9), que tiene todo el código y las pruebas de las cuatro partes.

```tarea
orden: 129
bloque: B2
hito: HT-2
depende: TA-122, TA-127
tu: —
revision: normal
paralelo: libre
tamano: prod=130 archivos=2 ca=0 migraciones=0 total=450
cubre: SEL-sugerencia, CF-05
pru: PRU-DOM-BAND-104
compartido: —
```

**Qué construir.**
- `selectores/sugerencia.ts` (04 §6.14.3, §3.0.3): `sugerencia`, `comerciosRecientes`, el tipo `Propuesta` extendida y sus constructores `propuestaDeRegla` y `propuestaDeAjuste` (AV-21). El texto de cada propuesta (voseo, 7.10) lo pone la aplicación.
- `ajuste` de `operaciones/op-47.ts` pasa a exportarse (una línea).

**Leer.** 04 §6.0.3, §3.0.3, §6.14.3; 06 §3.6 (CF-05).

**Archivos.** `packages/dominio/src/selectores/sugerencia.ts` y `packages/dominio/src/operaciones/op-47.ts` (solo el `export`).

**Pruebas primero.**
- **PRU-DOM-BAND-104** (nueva, DT-17): la regla de comercio manda sobre el historial, comercios recientes agrupados por comercio normalizado y la `Propuesta` extendida (regla de un toque y ajuste AV-21 que abre el flujo según la cuenta y el signo).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-232 Selector de la bandeja de SMS (parte 2 de TA-128)

Parte 2 de TA-128 (DT-02, 08 §1.2, CH-26). **Portar desde la rama `ta-128-origen-completo` (commit 103fcf9)**: `bandeja.ts` y las pruebas de la bandeja de `bandeja.test.ts` (fixture incluido). El código mide 423 líneas de producción: se espera un exceso de hasta el 30 %, que el orquestador acepta en el merge (CH-15); la ficha declara 400 porque el verificador no admite más.

```tarea
orden: 143
bloque: B2
hito: HT-2
depende: TA-128
tu: —
revision: normal
paralelo: libre
tamano: prod=400 archivos=2 ca=0 migraciones=0 total=800
cubre: SEL-bandeja, BE-41, CF-22
pru: PRU-DOM-BAND-107
compartido: —
```

**Qué construir.**
- `selectores/bandeja.ts` (04 §6.8): `bandeja()` con contadores, movimientos y `aprobacion` (precondiciones de OP-37 y exclusiones de OP-38), `origenPropuestoPagoTarjeta` (BE-41) y `destinosDeArrastre` con `aprobacion.arrastrable` (CF-22).
- `ARRASTRE_FRECUENTES_MAX` (6) y `ARRASTRE_FRECUENTES_DIAS` (90) en `selectores/reportes/umbrales.ts`.
- Desvíos aceptados por el orquestador: sin `Encabezado` (lo agrega la consulta); el cursor de los descartados es la clave en texto (`recibidoEn|id`) y la consulta lo codifica; los datos [H] e [I] llegan como parámetro `DatosDeBandeja`.

**Leer.** 04 §6.8 (BE-41); 06 §0.7 (CF-22).

**Archivos.** `packages/dominio/src/selectores/{bandeja,reportes/umbrales}.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-107** (nueva, DT-17): la bandeja con `destinosArrastre` y `arrastrable` (CF-22), contadores, elegibles de OP-38 con sus motivos y la cuenta de origen propuesta para un pago de tarjeta (BE-41).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-107"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-233 Contextos de formulario: catálogos, registrar, pagar tarjeta y cuota de préstamo (parte 3 de TA-128)

Parte 3 de TA-128 (DT-02, 08 §1.2, CH-26). **Portar desde la rama `ta-128-origen-completo` (commit 103fcf9)**: de `formulario.ts`, el marco (`ParametrosFormulario`, `pide`, catálogos, `formulario` y `contextoDe`) con los contextos `registrar`, `pagar_tarjeta` y `cuota_prestamo`; de `bandeja.test.ts`, las pruebas de esos tres. Las demás variantes de `ParametrosFormulario` se agregan en TA-240.

```tarea
orden: 144
bloque: B2
hito: HT-2
depende: TA-128, TA-232
tu: —
revision: normal
paralelo: libre
tamano: prod=400 archivos=1 ca=0 migraciones=0 total=800
cubre: SEL-formulario
pru: PRU-DOM-BAND-108
compartido: —
```

**Qué construir.**
- `selectores/formulario.ts` (04 §6.14): marco con los catálogos de 6.14.2 (`cuentas`, `categorias`, `categoriasPago`, `deudores`, `comercios`, `lpa`) y los contextos `registrar`, `pagar_tarjeta` y `cuota_prestamo`.
- Desvíos aceptados por el orquestador: `pagar_tarjeta` devuelve `{ tarjetas: [...] }`, una entrada por tarjeta (filtrada por `tarjetaId` si viene); en `cuota_prestamo` el parámetro `fecha` no cambia la cuota propuesta (siempre la primera no pagada) y sin modelo de cálculo no hay desglose.

**Leer.** 04 §6.14.

**Archivos.** `packages/dominio/src/selectores/formulario.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-108** (nueva, DT-17): catálogos de gasto y de transferencia, cuenta propuesta, contexto de pago de tarjeta (deuda, reservado, desglose al pagar y origen propuesto por tarjeta) y de cuota de préstamo (categoría de la última cuota, sin modelo).
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-108"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-240 Contextos de formulario: editar, asignar, archivar, cuenta, movimiento y meta (parte 4 de TA-128)

Parte 4 de TA-128 (DT-02, 08 §1.2, CH-26). **Portar desde la rama `ta-128-origen-completo` (commit 103fcf9)**: de `formulario.ts`, los contextos `editar_transaccion`, `asignar`, `archivar_categoria`, `cuenta`, `movimiento` y `meta`, con sus variantes de `ParametrosFormulario`; de `bandeja.test.ts`, sus pruebas. Exporta `promedio` de `selectores/reportes/realidad.ts`.

```tarea
orden: 145
bloque: B2
hito: HT-2
depende: TA-233
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=2 ca=0 migraciones=0 total=700
cubre: —
pru: PRU-DOM-BAND-109
compartido: SEL-formulario (los contextos de la ola 1 que quedan)
```

**Qué construir.**
- Los seis contextos restantes de la ola 1 de `formulario.ts` (04 §6.14.4, CP-10a): `editar_transaccion` (detalle, archivadas marcadas y `capacidadDevolucion`), `asignar` (con las variantes de asignación rápida de CF-17 y CF-25), `archivar_categoria`, `cuenta`, `movimiento` y `meta`.
- Desvío aceptado por el orquestador: el contexto `movimiento` trae el `MovimientoDto` sin `candidatas` de devolución; llegan con `devolver` en TA-140 (y OP-37 de devolución en TA-138).

**Leer.** 04 §6.14.4 y §6.14.4.1; 01 OP-16 (CF-17, CF-25).

**Archivos.** `packages/dominio/src/selectores/{formulario,reportes/realidad}.ts`.

**Pruebas primero.**
- **PRU-DOM-BAND-109** (nueva, DT-17): contexto de edición con las archivadas que ya usa; `asignar` con asignado, disponible, meta y las variantes rápidas; `archivar_categoria` con asignaciones futuras y programadas activas; `cuenta` al crear y al editar; `meta`; `movimiento` con el `MovimientoDto` de la bandeja.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-109"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-129 Reporte de ritmo y hallazgos de ritmo en Inicio (CF-04, CF-06)

```tarea
orden: 130
bloque: B2
hito: HT-2
depende: TA-125
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=2 ca=0 migraciones=0 total=640
cubre: REP-ritmo, CF-06
pru: PRU-PROP-REP-002
compartido: CF-04 (tipo `ritmo`; dueño TA-142)
```

**Qué construir.**
- Selector `ritmo` con la proyección del cierre de 06 §3.5 y `InicioDto.atencion.hallazgosRitmo` (CF-06).

**Leer.** 06 §3.5 (ritmo y proyección), §3.7 (CF-06); 04 §6.9.

**Archivos.** `packages/dominio/src/selectores/reportes/ritmo.ts`, `packages/dominio/src/selectores/inicio.ts`.

**Pruebas primero.**
- PRU-PROP-REP-002 (V6-02): 20.000 casos de ritmo y proyección en el nocturno, 300 en PR.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-REP-002"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-130 Ejecutor de escenarios `motor` y ESC-01, ESC-02

```tarea
orden: 131
bloque: B2
hito: HT-2
depende: TA-114, TA-115, TA-116, TA-117
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=4 ca=0 migraciones=0 total=760
cubre: DP-13, DP-14, DP-16, ESC-01@motor, ESC-02@motor
pru: —
compartido: —
```

**Qué construir.**
- `escenarios/{tipos,ejecutar,motor}.ts` **portados** del prototipo del zip de la Fase 7 y completados con las 11 reglas de 07 §12.3 (incluidos rechazos, ramas y `extra`).
- Proyecto `escenarios-motor` de Vitest; `pnpm test:escenarios`.
- ESC-01 y ESC-02 como primeros datos.
- **[F8]** Cada paso y el estado inicial nombran su operación con `op: 'OP-nn'`; `pnpm plan:verificar --escenarios packages/dominio/escenarios/datos` usa esos campos para la regla E13 (P8-20) desde esta tarea.

**Leer.** 07 §12.3 completo, §2.1 (`PRU-ESC-nn@motor`); 01 §8.0, ESC-01, ESC-02.

**Archivos.** `packages/dominio/escenarios/{tipos,ejecutar,motor}.ts`, `packages/dominio/escenarios/datos/esc-0{1,2}.ts`, `vitest.config.ts`.

**Pruebas primero.**
- `PRU-ESC-01@motor` y `PRU-ESC-02@motor`; control: un dato alterado se detecta con el identificador de la fila.

**Comandos.** `pnpm test:escenarios`; `pnpm ci:local`.

**Terminada cuando.** Los dos escenarios pasan; las reglas 1 a 11 tienen cada una un caso de prueba del ejecutor; `plan:verificar --escenarios` pasa (E13).

#### TA-131 Escenarios en el motor: ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10

```tarea
orden: 132
bloque: B2
hito: HT-2
depende: TA-130, TA-110
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=600
cubre: ESC-03@motor, ESC-04@motor, ESC-05@motor, ESC-06@motor, ESC-07@motor, ESC-08@motor, ESC-09@motor, ESC-10@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10 (con "Enmiendas posteriores" de 01); 07 §12.3 completo.

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-03@motor|PRU-ESC-04@motor|PRU-ESC-05@motor|PRU-ESC-06@motor|PRU-ESC-07@motor|PRU-ESC-08@motor|PRU-ESC-09@motor|PRU-ESC-10@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

#### TA-132 Escenarios en el motor: ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20

```tarea
orden: 133
bloque: B2
hito: HT-2
depende: TA-131, TA-118, TA-119
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=740
cubre: ESC-11@motor, ESC-12@motor, ESC-13@motor, ESC-14@motor, ESC-15@motor, ESC-16@motor, ESC-17@motor, ESC-18@motor, ESC-19@motor, ESC-20@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20 (con "Enmiendas posteriores" de 01); 07 §12.3 completo.

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-11@motor|PRU-ESC-12@motor|PRU-ESC-13@motor|PRU-ESC-14@motor|PRU-ESC-15@motor|PRU-ESC-16@motor|PRU-ESC-17@motor|PRU-ESC-18@motor|PRU-ESC-19@motor|PRU-ESC-20@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

#### TA-133 Escenarios en el motor: ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36

```tarea
orden: 134
bloque: B2
hito: HT-2
depende: TA-131, TA-118, TA-119
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=600
cubre: ESC-22@motor, ESC-24@motor, ESC-31@motor, ESC-32@motor, ESC-33@motor, ESC-34@motor, ESC-35@motor, ESC-36@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36 (con "Enmiendas posteriores" de 01); 07 §12.3 completo.

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-22@motor|PRU-ESC-24@motor|PRU-ESC-31@motor|PRU-ESC-32@motor|PRU-ESC-33@motor|PRU-ESC-34@motor|PRU-ESC-35@motor|PRU-ESC-36@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

#### TA-135 Semillas de los recorridos 4.3 y 4.6 y Restaurantes de A.7

```tarea
orden: 135
bloque: B2
hito: HT-2
depende: TA-130, TA-129
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=620
cubre: DP-17, SEM-4.3, SEM-4.6
pru: PRU-DOM-MOTOR-901, PRU-DOM-MOTOR-902, PRU-DOM-MOTOR-904
compartido: —
```

**Qué construir.**
- `escenarios/semillas/estado-4-3.ts` y `estado-4-6.ts` **portados** de `recorridos.py` (zip de la Fase 6) como operaciones en el formato de 07 §12.3.
- La semilla de Restaurantes de A.7 para PRU-DOM-MOTOR-902.

**Leer.** 07 §12.4; 06 §4.3, §4.6; 05 A.7 (Restaurantes, con la nota [F7]).

**Archivos.** `packages/dominio/escenarios/semillas/*.ts` (datos), `packages/dominio/test/semillas.test.ts`.

**Pruebas primero.**
- PRU-DOM-MOTOR-901 (4.6: Ahorro $770.00, LPA $720.00, Super −$50.00, S(T) $30.00, reducción $70.00; al cierre LPA $700.00), 902 (Restaurantes −$26.30 y ritmo $175.56) y 904 (4.3).

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-90"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas dan los números de su fuente sin ajustar ninguno.

#### TA-138 `aplicar`: condonar, devolver y eliminar evento (OP-32 a OP-34)

```tarea
orden: 136
bloque: B2
hito: HT-2
depende: TA-119, TA-124
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=340 archivos=3 ca=0 migraciones=0 total=900
cubre: OP-32@dom, OP-33@dom, OP-34@dom, INV-10, INV-11, CB-02, CB-22, CB-31
pru: PRU-DOM-DEV-102, PRU-PROP-DEV-101
compartido: GEN-operaciones (agrega OP-32 a OP-34)
```

**Qué construir.**
- OP-32, OP-33 (a y b) y OP-34.

**Leer.** 01 §5.5 (OP-32 a OP-34), §4.4, §4.10, §7.4; 04 §3.5; 01 §9 (CB-02, CB-22, CB-31).

**Archivos.** `packages/dominio/src/operaciones/op-3{2,3,4}.ts`.

**Pruebas primero.**
- **PRU-DOM-DEV-102** (nueva, DT-17): OP-33 vinculada y sin compra original con los cuatro casos de §4.4, devoluciones que superan la línea o la compra (CB-02), vinculada a una cuota (CB-31); OP-32 por encima del saldo abierto (CB-22) o hacia una archivada; OP-34.
- **PRU-PROP-DEV-101** (nueva, DT-17): inv. 10 y 11 con devoluciones generadas.
- Las dos pruebas nuevas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-DEV-102|PRU-PROP-DEV-101"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan.

#### TA-139 `aplicar`: programadas (OP-42 a OP-44, OP-51)

```tarea
orden: 137
bloque: B2
hito: HT-2
depende: TA-117, TA-124
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=4 ca=0 migraciones=0 total=760
cubre: OP-42@dom, OP-43@dom, OP-44@dom, OP-51@dom, CF-20, CB-33
pru: PRU-DOM-PROG-101
compartido: GEN-operaciones (agrega OP-42 a OP-44 y OP-51)
```

**Qué construir.**
- OP-42, OP-43, OP-44 y OP-51; ocurrencias pendientes desde `reactivada_desde`.

**Leer.** 01 §5.7, §4.16, §7.8, "Enmiendas posteriores" (PR-3, CF-20); 04 §3.7, §10.2 (paso 1); 01 §9 (CB-33).

**Archivos.** `packages/dominio/src/operaciones/op-4{2,3,4}.ts`, `op-51.ts`, `packages/dominio/src/calculo/ocurrencias.ts`.

**Pruebas primero.**
- **PRU-DOM-PROG-101** (nueva, DT-17): OP-42 con la reactivación (CF-20), OP-43 de un toque y automático (idempotente, en orden, con la fecha esperada, sin registrar períodos cerrados según PR-3), cuenta archivada (CB-33), OP-44 y OP-51.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PROG-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con ESC-50 según PR-3.

#### TA-134 Escenarios en el motor: ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49

```tarea
orden: 138
bloque: B2
hito: HT-2
depende: TA-131, TA-115, TA-121, TA-123, TA-138, TA-139
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=740
cubre: ESC-37@motor, ESC-38@motor, ESC-39@motor, ESC-42@motor, ESC-43@motor, ESC-44@motor, ESC-46@motor, ESC-47@motor, ESC-48@motor, ESC-49@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49 (con "Enmiendas posteriores" de 01); 07 §12.3 completo. ESC-44 pasa a este lote por la condición de HT-6 (DT-25); su estado inicial tiene una programada activa (OP-42, TA-139).

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-37@motor|PRU-ESC-38@motor|PRU-ESC-39@motor|PRU-ESC-42@motor|PRU-ESC-43@motor|PRU-ESC-44@motor|PRU-ESC-46@motor|PRU-ESC-47@motor|PRU-ESC-48@motor|PRU-ESC-49@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

### 13.3 Ola 2

#### TA-136 `aplicar`: asignación rápida y cambiar el ciclo (OP-16, OP-19)

```tarea
orden: 600
bloque: B2
hito: HT-2
depende: TA-116, TA-124
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=260 archivos=3 ca=0 migraciones=0 total=700
cubre: OP-16@dom, OP-19@dom, CF-25, CB-12, AV-12
pru: PRU-DOM-PRES-103
compartido: GEN-operaciones (agrega OP-16 y OP-19), CF-17 (promedio de OP-16)
```

**Qué construir.**
- OP-16 y OP-19; reemplazo de una vigencia futura que aún no rige.

**Leer.** 01 §5.3 (OP-16, OP-19), §4.2 punto 9, "Enmiendas posteriores" (CF-17, CF-25); 04 §3.3, §6.14.4; 01 §9 (CB-12).

**Archivos.** `packages/dominio/src/operaciones/op-1{6,9}.ts`, `packages/dominio/src/pruebas/operaciones.ts`.

**Pruebas primero.**
- **PRU-DOM-PRES-103** (nueva, DT-17): OP-16 con sus cuatro variantes (falta, período pasado, promedio de 1 a 3 períodos con CF-17 y cubrir el sobregiro de CF-25) y OP-19 con "rige desde" (01 §4.2 punto 9), períodos futuros con asignaciones (CB-12) y AV-12.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PRES-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con el ejemplo de Q5 y ESC-45.

#### TA-137 `aplicar`: inversiones y desembolso (OP-25, OP-26)

```tarea
orden: 601
bloque: B2
hito: HT-2
depende: TA-117
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=180 archivos=2 ca=0 migraciones=0 total=480
cubre: OP-25@dom, OP-26@dom
pru: PRU-DOM-CTA-104
compartido: GEN-operaciones (agrega OP-25 y OP-26)
```

**Qué construir.**
- OP-25 y OP-26.

**Leer.** 01 §5.4 (OP-25, OP-26), §4.13; 04 §3.4.

**Archivos.** `packages/dominio/src/operaciones/op-2{5,6}.ts`.

**Pruebas primero.**
- **PRU-DOM-CTA-104** (nueva, DT-17): OP-25 (aporte, retiro con X ≤ valor y ajuste con valor ≥ 0) y OP-26, con su clasificación en otras entradas.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CTA-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-140 Selectores de por cobrar, programadas y contextos de formulario (ola 2)

```tarea
orden: 604
bloque: B2
hito: HT-2
depende: TA-240, TA-138, TA-139
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=3 ca=0 migraciones=0 total=620
cubre: SEL-porCobrar, SEL-programadas
pru: PRU-DOM-COBRO-102
compartido: SEL-formulario (los contextos de la ola 2)
```

**Qué construir.**
- `selectores/por-cobrar.ts`, `programadas.ts` y los contextos restantes de `formulario.ts` (04 §6.12.1, §6.12.3, §6.14.4).

**Leer.** 04 §6.12.1, §6.12.3, §6.14.4.

**Archivos.** `packages/dominio/src/selectores/{por-cobrar,programadas,formulario}.ts`.

**Pruebas primero.**
- **PRU-DOM-COBRO-102** (nueva, DT-17): por cobrar por deudor con su estado y dinero en camino; programadas con próximos pagos a 30 días (BE-37); contextos de formulario de la ola 2.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-COBRO-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-141 Reportes base (04 §6.9.2, §6.9.3; parte 1)

Partida en dos por tamaño (DT-02, 08 §1.2): esta parte tiene los reportes base y `existiaEn`; el top de comercios y el gasto semanal son TA-230.

```tarea
orden: 605
bloque: B2
hito: HT-2
depende: TA-109
tu: —
revision: normal
paralelo: libre
tamano: prod=396 archivos=9 ca=0 migraciones=0 total=820
cubre: REP-categorias, REP-cumplimiento, REP-ingresos_gastos, REP-patrimonio, REP-remanente, REP-tendencia
pru: PRU-DOM-REP-101
compartido: —
```

**Qué construir.**
- Un selector por reporte base en `selectores/reportes/` (`tendencia`, `categorias`, `ingresos_gastos`, `remanente`, `cumplimiento`, `patrimonio`) con las fórmulas [Propio] de BE-40 (ventana W y filtro de cuentas K), y `existiaEn` (CF-17).

**Leer.** 04 §6.9.1 y §6.9.2; 06 §2.10 (FT-60).

**Archivos.** `packages/dominio/src/selectores/reportes/{comunes,existia-en,tendencia,categorias,ingresos-gastos,remanente,cumplimiento,patrimonio,index}.ts`.

**Pruebas primero.**
- **PRU-DOM-REP-101** (nueva, DT-17): cada reporte base con un estado conocido y su tabla equivalente con los mismos números.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-REP-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-230 Reportes: top de comercios y gasto semanal (parte 2 de TA-141)

Parte 2 de TA-141 (DT-02, 08 §1.2): el top de comercios (BE-43) y el gasto semanal con su referencia de redondeo acumulado.

```tarea
orden: 606
bloque: B2
hito: HT-2
depende: TA-141
tu: —
revision: normal
paralelo: libre
tamano: prod=290 archivos=3 ca=0 migraciones=0 total=660
cubre: REP-top_comercios, REP-gasto_semanal, BE-40
pru: PRU-PROP-REP-001, PRU-DOM-REP-102
compartido: —
```

**Qué construir.**
- `selectores/reportes/top-comercios.ts` (04 §6.9.2 y §6.9.6, BE-43) y `gasto-semanal.ts` (04 §6.9.3, BE-40) con la referencia semanal con redondeo acumulado, y su exportación en `index.ts`.

**Leer.** 04 §6.9.2 (`top_comercios`), §6.9.3 y §6.9.6; 06 §2.10 (FT-60, FT-61).

**Archivos.** `packages/dominio/src/selectores/reportes/{top-comercios,gasto-semanal,index}.ts`.

**Pruebas primero.**
- **PRU-DOM-REP-102** (nueva, DT-17): el top de comercios y el gasto semanal con un estado conocido y su tabla equivalente con los mismos números.
- PRU-PROP-REP-001 (V-22): la referencia semanal suma exactamente lo asignado y nunca es negativa.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-REP-001|PRU-DOM-REP-102"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-142 Reportes accionables: realidad y clave de agrupación (CF-04; parte 1)

Partida en tres por tamaño (DT-02, 08 §1.2): esta parte tiene `realidad` y la clave de agrupación de BE-43; los gastos hormiga son TA-238 y las suscripciones, TA-239.

```tarea
orden: 607
bloque: B2
hito: HT-2
depende: TA-129, TA-141
tu: —
revision: normal
paralelo: libre
tamano: prod=334 archivos=5 ca=0 migraciones=0 total=650
cubre: REP-realidad, BE-43, CF-04
pru: PRU-DOM-REP-104
compartido: —
```

**Qué construir.**
- Selector `realidad` (06 §3.5.6 y §3.5.7) con sus hallazgos como datos; `agrupacion.ts` con la clave de BE-43 (el top de comercios la usa); umbrales REAL_* y PROM_*.

**Leer.** 06 §3.5 (realidad y comparación con el promedio); 04 §6.9.5, §6.9.6 (BE-43).

**Archivos.** `packages/dominio/src/selectores/reportes/{realidad,agrupacion,top-comercios,umbrales,index}.ts`.

**Pruebas primero.**
- **PRU-DOM-REP-104** (nueva, DT-17): realidad con su sugerencia y la comparación con el promedio, y la clave de agrupación de BE-43 con sus variantes.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-REP-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

**Sin verificar.** El `estado` de los hallazgos (`advertencia` o `informacion`) frente a 05 §10.3: 06 no lo fija por tipo. `realidad` no recibe el filtro de cuentas K, porque `ritmo()` tampoco lo tiene.

#### TA-238 Reporte de gastos hormiga (parte 2 de TA-142)

Parte 2 de TA-142 (DT-02, 08 §1.2). El punto de partida es la rama `ta-142-reportes-accionables` (PR #60, sin mergear): trae `hormiga.ts` escrito y probado.

```tarea
orden: 613
bloque: B2
hito: HT-2
depende: TA-142
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=3 ca=0 migraciones=0 total=420
cubre: REP-hormiga
pru: PRU-DOM-REP-105
compartido: —
```

**Qué construir.**
- Selector `hormiga` (06 §3.5.8): grupos por comercio (BE-43) y por categoría, deduplicación por compras compartidas y enlace a Actividad; umbrales HORMIGA_* en `umbrales.ts`.

**Leer.** 06 §3.5.8; 04 §6.9.6 (BE-43).

**Archivos.** `packages/dominio/src/selectores/reportes/{hormiga,umbrales,index}.ts`.

**Pruebas primero.**
- **PRU-DOM-REP-105** (nueva, DT-17): 12 cafeterías dan un hallazgo de categoría; el solapamiento deja el de mayor total; 4 compras no alcanzan.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-REP-105"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

**Sin verificar.** El `estado` de los hallazgos frente a 05 §10.3; el filtro de cuentas K sí se aplica en este selector.

#### TA-239 Reporte de suscripciones (parte 3 de TA-142)

Parte 3 de TA-142 (DT-02, 08 §1.2). El punto de partida es la rama `ta-142-reportes-accionables` (PR #60, sin mergear): trae `suscripciones.ts` escrito y probado.

```tarea
orden: 614
bloque: B2
hito: HT-2
depende: TA-142
tu: —
revision: normal
paralelo: libre
tamano: prod=250 archivos=3 ca=0 migraciones=0 total=400
cubre: REP-suscripciones
pru: PRU-DOM-REP-106
compartido: —
```

**Qué construir.**
- Selector `suscripciones` (06 §3.5.9): detección sobre los 4 últimos períodos cerrados, programada desactivada, "Ya programadas" y acciones como datos; umbrales SUSC_* en `umbrales.ts`.

**Leer.** 06 §3.5.9; 04 §6.9.6 (BE-43).

**Archivos.** `packages/dominio/src/selectores/reportes/{suscripciones,umbrales,index}.ts`.

**Pruebas primero.**
- **PRU-DOM-REP-106** (nueva, DT-17): la clave de BE-43 une las variantes, reactiva la programada desactivada, exige 3 de 4 períodos y con menos de 4 cerrados no detecta.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-REP-106"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

**Sin verificar.** La tolerancia propuesta (la mayor diferencia respecto de la mediana entre los cobros que cuentan como tales; 06 §3.5.9 no aclara si son esos o todas las transacciones de la clave); el `estado` de los hallazgos frente a 05 §10.3.

#### TA-143 Reportes de tarjetas, hallazgos y flujo de efectivo (CF-02, CF-04)

```tarea
orden: 608
bloque: B2
hito: HT-2
depende: TA-142
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=3 ca=0 migraciones=0 total=820
cubre: REP-tarjetas, REP-hallazgos, REP-flujo_efectivo, CF-02
pru: PRU-PROP-REP-003, PRU-PROP-REP-004, PRU-DOM-REP-001
compartido: —
```

**Qué construir.**
- Selectores `tarjetas`, `hallazgos` y `flujo_efectivo` (06 §3.3, §3.5).

**Leer.** 06 §3.3 (CF-02), §3.5 (tarjetas, hallazgos); 04 §6.9.

**Archivos.** `packages/dominio/src/selectores/reportes/{tarjetas,hallazgos,flujo-efectivo}.ts`.

**Pruebas primero.**
- PRU-PROP-REP-003 (V6-03, identidad del flujo de efectivo), PRU-PROP-REP-004 (V6-11, prueba de los reportes) y PRU-DOM-REP-001 (V6-01, fórmulas de 3.5).

**Comandos.** `pnpm test:unidad -t "PRU-PROP-REP-00|PRU-DOM-REP-001"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas pasan.

#### TA-144 `datos_base` y sus pares con los selectores (CF-09)

```tarea
orden: 609
bloque: B2
hito: HT-2
depende: TA-143, TA-126
tu: —
revision: normal
paralelo: libre
tamano: prod=160 archivos=2 ca=0 migraciones=0 total=620
cubre: REP-datos_base, CF-09
pru: PRU-PROP-REP-101, PRU-PROP-REP-102, PRU-PROP-REP-103, PRU-PROP-REP-104, PRU-PROP-REP-105
compartido: —
```

**Qué construir.**
- Selector `datos_base` (04 §6.9.4), sin ruta (CF-09).

**Leer.** 04 §6.9.4; 06 §3.10; 07 §12.6, §19.7.

**Archivos.** `packages/dominio/src/selectores/reportes/datos-base.ts`.

**Pruebas primero.**
- **PRU-PROP-REP-101** (nueva, DT-17): `categoriasPorPeriodo` frente al historial del detalle y a "contra la realidad" (con el promedio de CF-17).
- **PRU-PROP-REP-102** (nueva, DT-17): `consumos` frente a ritmo, gastos hormiga y suscripciones.
- **PRU-PROP-REP-103** (nueva, DT-17): `tarjetasPorPeriodo` frente a `TarjetasDto.periodos`.
- **PRU-PROP-REP-104** (nueva, DT-17): `lpaAlCierre` frente al detalle de LPA.
- **PRU-PROP-REP-105** (nueva, DT-17): `patrimonioAlCierre` frente al reporte `patrimonio`.
- Las cinco propiedades nuevas, una por par de 07 §19.7.

**Comandos.** `pnpm test:unidad -t "PRU-PROP-REP"`; `pnpm ci:local`.

**Terminada cuando.** Las cinco pasan; si un par no coincide, es un hallazgo y la tarea para con una contradicción (manda 3.5).

#### TA-145 Escenarios en el motor: ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30

```tarea
orden: 610
bloque: B2
hito: HT-2
depende: TA-138, TA-131
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=600
cubre: ESC-21@motor, ESC-23@motor, ESC-25@motor, ESC-26@motor, ESC-27@motor, ESC-28@motor, ESC-29@motor, ESC-30@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30 (con "Enmiendas posteriores" de 01); 07 §12.3 completo.

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-21@motor|PRU-ESC-23@motor|PRU-ESC-25@motor|PRU-ESC-26@motor|PRU-ESC-27@motor|PRU-ESC-28@motor|PRU-ESC-29@motor|PRU-ESC-30@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

#### TA-146 Escenarios en el motor: ESC-40, ESC-41, ESC-45, ESC-50

```tarea
orden: 611
bloque: B2
hito: HT-2
depende: TA-115, TA-136, TA-137, TA-138, TA-139, TA-131
tu: —
revision: normal
paralelo: libre
tamano: prod=20 archivos=1 ca=0 migraciones=0 total=320
cubre: ESC-40@motor, ESC-41@motor, ESC-45@motor, ESC-50@motor
pru: —
compartido: —
```

**Qué construir.**
- Un archivo de datos por escenario en `packages/dominio/escenarios/datos/esc-nn.ts` para ESC-40, ESC-41, ESC-45, ESC-50, transcrito de 01 §8 con sus enmiendas, en el formato de 07 §12.3 y con las convenciones de completado de DP-16.
- Las filas "continúa", de contraste y alternativas siguen las reglas 4 y 5 de 07 §12.3; los rechazos, la regla 7; los avisos de la columna Notas son un mínimo (DP-14).
- Una aserción que el ejecutor `motor` no puede evaluar queda `omitida` con su motivo (regla 10) y la evalúa `ESC@int` en la tarea gemela de B3.

**Leer.** 01 §8.0 y ESC-40, ESC-41, ESC-45, ESC-50 (con "Enmiendas posteriores" de 01); 07 §12.3 completo. ESC-50 sigue PR-3 (pasos 1 y 1b).

**Archivos.** `packages/dominio/escenarios/datos/esc-nn.ts` (datos).

**Pruebas primero.**
- `PRU-ESC-nn@motor` de cada escenario (07 §2.1), una aserción por fila e identidad de saldo en cada fila.
- Control: alterar un número de una fila hace fallar ese escenario con el identificador de la fila.

**Comandos.** `pnpm test:escenarios -t "PRU-ESC-40@motor|PRU-ESC-41@motor|PRU-ESC-45@motor|PRU-ESC-50@motor"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan con 0 filas fallidas; las omitidas están listadas en el informe con el ejecutor que las evalúa.

#### TA-147 Semilla de A.7 completa (CT-07)

```tarea
orden: 612
bloque: B2
hito: HT-2
depende: TA-135, TA-139, TA-143
tu: —
revision: normal
paralelo: libre
tamano: prod=30 archivos=1 ca=0 migraciones=0 total=700
cubre: CT-07, DP-27, SEM-A7
pru: PRU-DOM-MOTOR-903
compartido: —
```

**Qué construir.**
- `escenarios/semillas/estado-a7.ts` **portado** de `estado_a7.py` (zip de la Fase 7) como operaciones, en el estado **antes** del paso 3 de 4.2 (07 §28.1).
- `comparar.py` pasa a PRU-DOM-MOTOR-903 contra el motor real: los 86 números de 07 §28.

**Leer.** 07 §28 completo; 05 A.7 (nota [F7]); 06 §3.5.12, §4.2.

**Archivos.** `packages/dominio/escenarios/semillas/estado-a7.ts` (datos), `packages/dominio/test/semilla-a7.test.ts`.

**Pruebas primero.**
- PRU-DOM-MOTOR-903 con la identidad de saldo en cada cálculo y los 86 números.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-MOTOR-903"`; `pnpm ci:local`.

**Terminada cuando.** 86 de 86 números iguales a 07 §28 (68 sin cambio y 18 con su valor nuevo) sin ajustar ninguno.

---

## 14. Bloque B3 — `@finn/db`, `@finn/aplicacion`, `@finn/sms`, `@finn/conciliacion` (HT-3)

### 14.1 Qué entra

- **`@finn/db`:** el protocolo de escritura y lectura, la carga, el traductor, la memoria, los repositorios y el volumen.
- **`@finn/aplicacion`:** los errores y mensajes, el marco de operaciones, el tiempo y el reloj de prueba (barrera 2), la autorización, las 53 operaciones y las 9 técnicas, las 19 consultas con los 15 contextos de formulario, el webhook sin su Route Handler, la conciliación, las notificaciones, la tarea diaria, el respaldo y la exportación.
- **`@finn/sms`** y **`@finn/conciliacion`** con la política de patrones.
- La anonimización de las muestras y la migración de los formatos del BAC.
- Los escenarios `@int`.

**TU.** El merge de TA-181 espera TU-13. Sin las muestras del BAC, `ci:politica-patrones` sigue fallando y HT-5 no se cumple (§6).

**Paralelismo.** TA-176, TA-181 y TA-182 agregan o usan dependencias de npm (`recheck`, `papaparse`) y se declaran entre sí. TA-157 es condicional (07 §32.1): se activa solo si TA-057 queda bloqueada.

### 14.2 Ola 1

#### TA-150 `escribir()` y `leer()`: el protocolo de 04 §4.2

```tarea
orden: 150
bloque: B3
hito: HT-3
depende: TA-059, TA-101
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=4 ca=0 migraciones=0 total=900
cubre: BE-11, BE-12, BE-14, BE-20, BE-27, BE-30, BE-33, CT-01-escritura, CT-02-instante
pru: PRU-INT-ESQ-001, PRU-INT-ESQ-002, PRU-INT-ESQ-006, PRU-INT-ESQ-007, PRU-INT-ESQ-008
compartido: —
```

**Qué construir.**
- `packages/db/src/cliente.ts` (un `PrismaClient` con `PrismaPg`, `max: 3`) y `transacciones.ts`, el único archivo con `$transaction` (BE-11).
- `escribir()`: `READ COMMITTED`, `timeout` 20 s, bloqueo como primera sentencia, `set_config` de zona (BE-33), de `finn.hoy` y `finn.desfase_ms` del reloj de prueba (BE-30, CT-01), y la primera consulta con revisión, `finn.hoy()` y `finn.instante()` (BE-12, BE-27, CT-02); `finn.operacion` solo con `set_config(…, true)` y su lista cerrada (BE-14).
- `leer()`: `REPEATABLE READ` + `READ ONLY` como primera sentencia (BE-20), con `SET LOCAL transaction_read_only = on` **[CH-25]**.

**Leer.** 04 §4.1, §4.2, §4.4, §5.1, §13.1, §13.6; 07 §4.1, §4.4; 02 ADR-06.

**Archivos.** `packages/db/src/{cliente,transacciones,index}.ts`, `packages/db/test/transacciones.int.test.ts`.

**Pruebas primero.**
- PRU-INT-ESQ-001 (V-01, FN001 sin bloqueo), 002 (V-02, revisión +1 y primera consulta), 006 (V-07, lectura), 007 (V-08, dos escritores) y 008 (V-09, contraste en `REPEATABLE READ`).

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-00"`; `pnpm ci:local`.

**Terminada cuando.** Las cinco pruebas pasan.

#### TA-151 Errores de la base y conversiones de fechas y montos

```tarea
orden: 151
bloque: B3
hito: HT-3
depende: TA-150
tu: —
revision: normal
paralelo: libre
tamano: prod=220 archivos=4 ca=0 migraciones=0 total=760
cubre: DB-errores, DB-mapeo
pru: PRU-INT-ESQ-003, PRU-INT-ESQ-004, PRU-INT-ESQ-009, PRU-INT-ESQ-010, PRU-INT-VAL-001, PRU-INT-VAL-003
compartido: —
```

**Qué construir.**
- `errores.ts` con `sqlstateDe()` (04 §7.3) para las formas de V-01, V-03 y V-06.
- `mapeo/fechas.ts` y `mapeo/montos.ts`: `Date` ↔ `FechaLocal` con métodos UTC y `timestamptz` con la sesión en UTC (04 §13, V-14, V-17); `Date` nunca sale del paquete.

**Leer.** 04 §7.3, §7.4, §13.1 a §13.3, §13.6; V-03, V-04, V-10, V-11, V-14, V-17.

**Archivos.** `packages/db/src/{errores,mapeo/fechas,mapeo/montos}.ts`, `packages/db/test/{errores,mapeo}.int.test.ts`.

**Pruebas primero.**
- PRU-INT-ESQ-003 (V-03), 004 (V-04), 009 (V-10, nocturno), 010 (V-11, sin `SAVEPOINT`), PRU-INT-VAL-001 (V-14) y PRU-INT-VAL-003 (V-17).

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-00|PRU-INT-ESQ-010|PRU-INT-VAL-00"`; `pnpm ci:local`.

**Terminada cuando.** Las seis pruebas pasan.

#### TA-152 Carga de hechos (BE-21)

```tarea
orden: 152
bloque: B3
hito: HT-3
depende: TA-151, TA-109
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=3 ca=0 migraciones=0 total=640
cubre: BE-21
pru: PRU-INT-MOTOR-101
compartido: —
```

**Qué construir.**
- `hechos/cargar.ts`: una consulta por tabla con arreglos JSON compactos dentro de `leer()` y la conversión a tipos del dominio.

**Leer.** 04 §5.2, §5.4; 03 §1.1.

**Archivos.** `packages/db/src/hechos/cargar.ts`, `packages/db/src/index.ts`, `packages/aplicacion/test/cargar.int.test.ts`, `.dependency-cruiser.cjs` **[CH-28]**. Se agregan, por la misma razón: el ayudante `packages/db/test/ayudantes/hechos-prueba.ts`, `tools/lint/controles.test.ts` con sus dos controles `tools/lint/controles/paquetes/db-valor-de-dominio.ts` y `db-tipo-de-dominio.ts`, y las dependencias de `packages/aplicacion` (`package.json`, `tsconfig.json`, `pnpm-lock.yaml`).

**Pruebas primero.**
- **PRU-INT-MOTOR-101** (nueva, DT-17): lo que `cargar` devuelve es igual, campo por campo, a los hechos escritos, con `secuencia` y `revision`, y `calcular` sobre ellos da la misma instantánea que sobre los hechos en memoria. Vive en `packages/aplicacion/test/cargar.int.test.ts` **[CH-28]**.
- Controles de `.dependency-cruiser.cjs` **[CH-28]**: un import de valor de `@finn/dominio` desde `packages/db/src` da `db-dominio-solo-tipos` y un `import type` no da ninguna violación.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-MOTOR-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-153 Traductor de cambios (BE-15, BE-16, BE-32)

```tarea
orden: 153
bloque: B3
hito: HT-3
depende: TA-152, TA-113
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=340 archivos=4 ca=0 migraciones=0 total=900
cubre: BE-15, BE-16, BE-32
pru: PRU-INT-ESQ-105
compartido: —
```

**Qué construir.**
- `hechos/traductor.ts`: `Cambio[]` → sentencias, con las fases y el orden de 04 §4.5 y `RETURNING` (BE-32).

**Leer.** 04 §4.5 completo, §2.4.1; 03 §4.6.4.

**Archivos.** `packages/db/src/hechos/traductor.ts`, `packages/db/test/traductor.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-ESQ-105** (nueva, DT-17): el traductor aplica las cuatro fases en el orden fijo de tablas, envía siempre el `id`, devuelve `secuencia` y `revision` con `RETURNING`, no cambia `lineas.orden` y elimina conciliaciones de una cuenta (HZ-1).
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-105"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con un cambio de cada tipo.

#### TA-154 Memoria por instancia (BE-22)

```tarea
orden: 154
bloque: B3
hito: HT-3
depende: TA-153, TA-124
tu: —
revision: normal
paralelo: libre
tamano: prod=200 archivos=2 ca=0 migraciones=0 total=620
cubre: BE-22
pru: PRU-INT-MOTOR-001
compartido: —
```

**Qué construir.**
- Memoria de hechos por revisión e instantánea por `(revisión, hoy)`, actualizada solo con los valores que devuelve la base e invalidada ante cualquier duda (04 §5.3).

**Leer.** 04 §5.3, V-16; 02 §2.3 punto 2.

**Archivos.** `packages/db/src/hechos/memoria.ts`, `packages/aplicacion/test/memoria.int.test.ts`.

**Pruebas primero.**
- PRU-INT-MOTOR-001 (V-16): después de cada operación, la memoria de la instancia que escribe es igual a una carga nueva; con `operacionesArb` en el nocturno.

**Comandos.** `pnpm test:integracion -t "PRU-INT-MOTOR-001"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-155 Repositorios de las tablas [I] y [T] y registro saneado (BE-26)

```tarea
orden: 155
bloque: B3
hito: HT-3
depende: TA-151
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=7 ca=0 migraciones=0 total=720
cubre: BE-26, DB-repositorios
pru: PRU-INT-ESQ-106
compartido: —
```

**Qué construir.**
- `repositorios/*.ts` (03 §3.17, §3.18, §3.28); `eventos.ts` con las reglas de saneamiento de 04 §15.3.

**Leer.** 03 §3.17, §3.18, §3.28, §7; 04 §7.8, §15.2, §15.3.

**Archivos.** `packages/db/src/repositorios/*.ts`, `packages/db/test/repositorios.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-ESQ-106** (nueva, DT-17): repositorios de `sms_recibidos`, `sms_procesamientos`, `notificaciones`, `eventos_sistema`, `estado_respaldo`, `token_webhook` y `suscripciones_push` con los privilegios de `finn_app`; el registro de un error no guarda montos ni textos de SMS (04 §15.3).
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-106"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-156 Volumen sintético y presupuestos de rendimiento (BE-23)

```tarea
orden: 156
bloque: B3
hito: HT-3
depende: TA-152, TA-153
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=4 ca=0 migraciones=0 total=640
cubre: BE-23, VOL-generador
pru: PRU-REN-MOTOR-001, PRU-REN-ESQ-001, PRU-REN-MOTOR-101
compartido: —
```

**Qué construir.**
- `tools/pruebas/volumen/generar.ts --nivel base|alto --anios 10 --semilla N` (07 §12.7), determinista, con salida como hechos en memoria y como carga por período con el protocolo.
- Benchmarks del nocturno con la regla de 07 §6.6 (aviso y `FINN_REN_ROJO`).

**Leer.** 07 §6.6, §12.7; 04 §5.6 (BE-23); 02 §2.2, §2.3.

**Archivos.** `tools/pruebas/volumen/*.ts`, `packages/dominio/bench/calcular.bench.ts`, `packages/db/test/carga-volumen.int.test.ts`, `.github/workflows/nocturno.yml`.

**Pruebas primero.**
- **PRU-REN-MOTOR-101** (nueva, DT-17): `calcular` sobre el volumen alto a 10 años: mediana de 5 corridas ≤ 150 ms (bench).
- PRU-REN-MOTOR-001 (V-13, carga ≤ 500 ms), PRU-REN-ESQ-001 (V-30, costo de las verificaciones diferidas) y la prueba nueva, en el nocturno.

**Comandos.** `pnpm bench`; `pnpm test:integracion -t "PRU-REN"`; `pnpm ci:local`.

**Terminada cuando.** Las tres corren en el nocturno con su mediana registrada.

#### TA-157 Respaldo b de P7-12 (condicional)

```tarea
orden: 157
bloque: B3
hito: —
depende: TA-057, TA-150
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=160 archivos=5 ca=0 migraciones=0 total=520
cubre: P7-12-b
pru: PRU-INT-RELOJ-010
compartido: —
```

**Qué construir.**
- **Solo si TA-057 terminó con el respaldo b).** Si terminó con `dbgenerated`, esta tarea pasa a `retirada` en `plan/tareas.json` con el motivo "C4 vacío con `dbgenerated`".
- La parte de la aplicación de 07 §32.1: `ahoraDb()` en `@finn/db`, que escribe `finn.ahora()` en cada inserción de las 9 columnas; la regla L21 (ninguna inserción en esas tablas sin la columna); y la prueba. El esquema y R15 ya los dejó TA-057.

**Leer.** 07 §32.1 completo.

**Archivos.** `packages/db/src/ahora.ts`, `packages/db/src/hechos/traductor.ts`, `packages/db/src/repositorios/*.ts`, `tools/lint/l21.mjs`.

**Pruebas primero.**
- PRU-INT-RELOJ-010.

**Comandos.** `node tools/db/c4.mjs`; `pnpm test:integracion -t "PRU-INT-RELOJ-010"`; `pnpm ci:local`.

**Terminada cuando.** La prueba en verde y L21 con su control negativo, o la tarea `retirada` con su motivo.

#### TA-158 Errores, mensajes y contratos de la aplicación

```tarea
orden: 158
bloque: B3
hito: HT-3
depende: TA-151
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=7 ca=0 migraciones=0 total=860
cubre: BE-08, BE-24, BE-25, BE-28, BE-29, BE-34, CF-15
pru: PRU-INT-VAL-002, PRU-DOM-VAL-001
compartido: —
```

**Qué construir.**
- `errores/`: `ErrorFinn`, las siete categorías y la traducción de rechazos de la base a `INTERNO` (BE-24, BE-25).
- `errores/mensajes.ts`: catálogo en voseo con `$1,234.50`, `dd/mm/aaaa` y el signo menos U+2212 al mostrar (BE-34, CF-15).
- `contratos/comunes.ts`: montos de entrada como texto decimal, de salida en centavos; revisión como cadena (BE-28, BE-29).

**Leer.** 04 §7.1 a §7.7, §7.10, §13.3, §2.6; 06 §3.12 (CF-15).

**Archivos.** `packages/aplicacion/src/errores/*.ts`, `packages/aplicacion/src/contratos/comunes.ts`.

**Pruebas primero.**
- PRU-INT-VAL-002 (V-15, formatos de la frontera) y PRU-DOM-VAL-001 (V-18, `Intl` en Node 24).

**Comandos.** `pnpm test:integracion -t "PRU-INT-VAL-002"`; `pnpm test:unidad -t "PRU-DOM-VAL-001"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-159 Marco de operaciones: previsualizar, confirmar, idempotencia e ids

```tarea
orden: 159
bloque: B3
hito: HT-3
depende: TA-154, TA-158, TA-155
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=5 ca=0 migraciones=0 total=900
cubre: BE-10, BE-13, BE-17, BE-18, BE-19, BE-31
pru: PRU-DOM-VAL-002, PRU-INT-ESQ-005
compartido: —
```

**Qué construir.**
- `operaciones/marco.ts`: definición de una operación (04 §2.3), comando resuelto (BE-10), previsualizar en lectura y confirmar con `revisionVista` y huella (BE-13), idempotencia por clase (BE-17), reintentos (BE-18), efectos solo después de confirmar (BE-19).
- `ids.ts`: `generadorDerivado` (UUIDv5) y `generadorAleatorio` (BE-31).

**Leer.** 04 §2.3, §2.4.1, §4.3, §4.6 a §4.9.

**Archivos.** `packages/aplicacion/src/operaciones/marco.ts`, `packages/aplicacion/src/ids.ts`.

**Pruebas primero.**
- PRU-DOM-VAL-002 (V-19, UUIDv5 con el vector del RFC) y PRU-INT-ESQ-005 (V-06, id repetido como `P2002` tratado como idempotente).

**Comandos.** `pnpm test:integracion -t "PRU-INT-ESQ-005"`; `pnpm test:unidad -t "PRU-DOM-VAL-002"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-160 Tiempo, configuración y reloj de prueba en la aplicación (CT-01)

```tarea
orden: 160
bloque: B3
hito: HT-3
depende: TA-158
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=4 ca=0 migraciones=0 total=560
cubre: BE-57, CT-01-funcion, APP-config
pru: PRU-SEG-RELOJ-002
compartido: —
```

**Qué construir.**
- `tiempo/`: `fechaLocalDeInstante` con `Intl` en America/El_Salvador (04 §13).
- `config/`: variables de 04 §14.2 validadas con Zod al arrancar y la comprobación de que el proceso corre en UTC (BE-57).
- `relojPermitido()` y `relojDePrueba()` con la lista de permitidos de 07 §4.3 (barrera 2); la barrera 1 (`instrumentation.ts`) es de la Parte C.

**Leer.** 07 §4.2, §4.3 (regla y barreras 1 y 2); 04 §13.1, §13.1.4, §14.2.

**Archivos.** `packages/aplicacion/src/tiempo/*.ts`, `packages/aplicacion/src/config/*.ts`, `packages/aplicacion/src/reloj-prueba.ts`.

**Pruebas primero.**
- PRU-SEG-RELOJ-002: la función, en proceso, con los 11 casos de 07 §4.3.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-RELOJ-002"`; `pnpm ci:local`.

**Terminada cuando.** Once de once casos.

#### TA-161 Autorización del usuario único en la aplicación (BE-07, BE-55)

```tarea
orden: 161
bloque: B3
hito: HT-3
depende: TA-158
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=160 archivos=3 ca=0 migraciones=0 total=440
cubre: BE-07, BE-55
pru: PRU-SEG-ACCESO-101
compartido: —
```

**Qué construir.**
- `autenticacion/autorizar.ts` con una interfaz de sesión que la Parte C implementa con `@supabase/ssr`; las operaciones y consultas la exigen como primer paso.

**Leer.** 04 §2.2.5, §12.3; 02 ADR-08.

**Archivos.** `packages/aplicacion/src/autenticacion/autorizar.ts`.

**Pruebas primero.**
- **PRU-SEG-ACCESO-101** (nueva, DT-17): `autorizar()` rechaza una sesión AAL1, una sesión de otro usuario y una sin sesión con `credenciales_invalidas`; acepta solo AAL2 de `FINN_USUARIO_ID`; `getUser()` para escrituras y `getClaims()` para lecturas.
- La prueba nueva, con una sesión falsa por caso.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-ACCESO-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-162 Operaciones de cuentas (OP-01 a OP-06)

```tarea
orden: 162
bloque: B3
hito: HT-3
depende: TA-159, TA-161, TA-114
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=900
cubre: OP-01, OP-02, OP-03, OP-04, OP-05, OP-06
pru: PRU-INT-CTA-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-01, OP-02, OP-03, OP-04, OP-05, OP-06: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.1, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-CTA-101** (nueva, DT-17): OP-01 a OP-06 por `@finn/aplicacion`; archivar una tarjeta con deuda se rechaza en la operación y en la base (inv. 24 como contexto).
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-CTA-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-163 Operaciones de grupos y categorías (OP-07 a OP-13)

```tarea
orden: 163
bloque: B3
hito: HT-3
depende: TA-162, TA-115, TA-236
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=900
cubre: OP-07, OP-08, OP-09, OP-10, OP-11, OP-12, OP-13
pru: PRU-INT-CATEG-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-07, OP-08, OP-09, OP-10, OP-11, OP-12, OP-13: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.2, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-CATEG-101** (nueva, DT-17): OP-07 a OP-13, con la variante en lote de OP-07 y `finn.operacion = 'fusion'` en OP-12.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-CATEG-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-164 Operaciones de presupuesto y metas (OP-14, OP-15, OP-17, OP-18)

```tarea
orden: 164
bloque: B3
hito: HT-3
depende: TA-162, TA-116
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=5 ca=0 migraciones=0 total=760
cubre: OP-14, OP-15, OP-17, OP-18
pru: PRU-INT-PRES-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-14, OP-15, OP-17, OP-18: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.3, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-PRES-101** (nueva, DT-17): OP-14, OP-15, OP-17 y OP-18.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-PRES-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-165 Operaciones de registro (OP-20 a OP-24, OP-27)

```tarea
orden: 165
bloque: B3
hito: HT-3
depende: TA-162, TA-117
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=900
cubre: OP-20, OP-21, OP-22, OP-23, OP-24, OP-27
pru: PRU-INT-TX-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-20, OP-21, OP-22, OP-23, OP-24, OP-27: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.4, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-TX-101** (nueva, DT-17): OP-20 a OP-24 y OP-27.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-TX-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-166 Editar, eliminar y estado bancario (OP-28 a OP-30)

```tarea
orden: 166
bloque: B3
hito: HT-3
depende: TA-165, TA-118
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=4 ca=0 migraciones=0 total=760
cubre: OP-28, OP-29, OP-30
pru: PRU-INT-TX-102
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-28, OP-29, OP-30: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.4, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-TX-102** (nueva, DT-17): OP-28 a OP-30, con el cambio posterior de una conciliada.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-TX-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-167 Cobrar, préstamo, deudor y verificar saldo (OP-31, OP-48, OP-52, OP-53)

```tarea
orden: 167
bloque: B3
hito: HT-3
depende: TA-165, TA-119, TA-123, TA-053
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=5 ca=0 migraciones=0 total=800
cubre: OP-31, OP-48, OP-52, OP-53
pru: PRU-INT-COBRO-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-31, OP-48, OP-52, OP-53: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.5, §3.8 (OP-53), §3.9, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-COBRO-101** (nueva, DT-17): OP-31 (con la asignación de BE-36), OP-48, OP-52 y OP-53 con `modo = saldo`.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-COBRO-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-169 Consultas de Inicio, Presupuesto y detalle de LPA

```tarea
orden: 168
bloque: B3
hito: HT-3
depende: TA-159, TA-125, TA-234, TA-235, TA-129
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=5 ca=0 migraciones=0 total=760
cubre: Q-inicio, Q-presupuesto, Q-detalleLpa
pru: PRU-INT-PRES-102
compartido: —
```

**Qué construir.**
- `consultas/inicio.ts`, `presupuesto.ts`, `detalle-lpa.ts` (04 §6.0, §6.1, §6.2, §6.4): `leer()`, selectores, tablas [H] e [I] en la misma transacción, sin fórmulas.

**Leer.** 04 §6.0, §6.1, §6.2, §6.4.

**Archivos.** `packages/aplicacion/src/consultas/{inicio,presupuesto,detalle-lpa}.ts`, `packages/aplicacion/src/contratos/consultas.ts`.

**Pruebas primero.**
- **PRU-INT-PRES-102** (nueva, DT-17): `inicio()`, `presupuesto()` y `detalleLpa()` devuelven el encabezado común y los mismos números que los selectores sobre la base sembrada, y la misma categoría tiene los mismos números en las tres.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-PRES-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-170 Consultas de detalle de categoría, metas y estructura

```tarea
orden: 169
bloque: B3
hito: HT-3
depende: TA-159, TA-126
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=4 ca=0 migraciones=0 total=640
cubre: Q-detalleCategoria, Q-metas, Q-estructura
pru: PRU-INT-CATEG-102
compartido: —
```

**Qué construir.**
- `consultas/detalle-categoria.ts`, `metas.ts`, `estructura.ts` (04 §6.3, §6.10, §6.12.4).

**Leer.** 04 §6.0, §6.3, §6.10, §6.12.4.

**Archivos.** `packages/aplicacion/src/consultas/{detalle-categoria,metas,estructura}.ts`.

**Pruebas primero.**
- **PRU-INT-CATEG-102** (nueva, DT-17): `detalleCategoria()`, `metas()` y `estructura()` con un id inexistente (`NO_ENCONTRADO`) y con datos sembrados.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-CATEG-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-171 Consultas de cuentas, detalle de cuenta, actividad y detalle de transacción

```tarea
orden: 170
bloque: B3
hito: HT-3
depende: TA-159, TA-127
tu: —
revision: normal
paralelo: libre
tamano: prod=320 archivos=5 ca=0 migraciones=0 total=800
cubre: Q-cuentas, Q-detalleCuenta, Q-actividad, Q-detalleTransaccion
pru: PRU-INT-CTA-102
compartido: —
```

**Qué construir.**
- `consultas/cuentas.ts`, `detalle-cuenta.ts`, `actividad.ts`, `detalle-transaccion.ts` (04 §6.5 a §6.7).

**Leer.** 04 §6.0, §6.5, §6.6, §6.7.

**Archivos.** `packages/aplicacion/src/consultas/{cuentas,detalle-cuenta,actividad,detalle-transaccion}.ts`.

**Pruebas primero.**
- **PRU-INT-CTA-102** (nueva, DT-17): las cuatro consultas con paginación y búsqueda de la actividad y las acciones habilitadas del detalle de cuenta.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-CTA-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-172 Consultas de la bandeja, sugerencia y ajustes

```tarea
orden: 171
bloque: B3
hito: HT-3
depende: TA-159, TA-232, TA-155
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=4 ca=0 migraciones=0 total=700
cubre: Q-bandeja, Q-sugerencia, Q-ajustes
pru: PRU-INT-BAND-101
compartido: —
```

**Qué construir.**
- `consultas/bandeja.ts`, `sugerencia.ts`, `ajustes.ts` (04 §6.8, §6.11, §6.12).

**Leer.** 04 §6.0, §6.8, §6.11, §6.12.

**Archivos.** `packages/aplicacion/src/consultas/{bandeja,sugerencia,ajustes}.ts`.

**Pruebas primero.**
- **PRU-INT-BAND-101** (nueva, DT-17): `bandeja()` con los estados de 01 §7.1 y `error`, `sugerencia()` y `ajustes()` con el estado del token, del respaldo y del ciclo.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-BAND-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-173 Consulta `formulario`: marco y contextos de registro

```tarea
orden: 172
bloque: B3
hito: HT-3
depende: TA-159, TA-233
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=6 ca=0 migraciones=0 total=760
cubre: Q-formulario, BE-42, FORM-registrar, FORM-pagar_tarjeta, FORM-cuota_prestamo, FORM-editar_transaccion, FORM-cuenta
pru: PRU-INT-TX-103
compartido: —
```

**Qué construir.**
- `consultas/formulario.ts` con parámetros por operación (BE-42) y los cinco contextos (04 §6.14).

**Leer.** 04 §6.14 completo.

**Archivos.** `packages/aplicacion/src/consultas/formulario/{index,registrar,pagar-tarjeta,cuota,editar,cuenta}.ts`.

**Pruebas primero.**
- **PRU-INT-TX-103** (nueva, DT-17): `formulario()` con catálogos comunes y los contextos `registrar`, `pagar_tarjeta`, `cuota_prestamo`, `editar_transaccion` y `cuenta`.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-TX-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-174 Contextos de formulario de presupuesto y bandeja, y `reporte()`

```tarea
orden: 173
bloque: B3
hito: HT-3
depende: TA-173, TA-129
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=6 ca=0 migraciones=0 total=720
cubre: FORM-asignar, FORM-archivar_categoria, FORM-movimiento, FORM-meta, Q-reporte
pru: PRU-INT-REP-101
compartido: —
```

**Qué construir.**
- Los cuatro contextos y `consultas/reporte.ts` con el despacho por tipo; la ola 2 agrega los tipos restantes (TA-198).

**Leer.** 04 §6.9 (despacho), §6.14.

**Archivos.** `packages/aplicacion/src/consultas/formulario/{asignar,archivar,movimiento,meta}.ts`, `packages/aplicacion/src/consultas/reporte.ts`.

**Pruebas primero.**
- **PRU-INT-REP-101** (nueva, DT-17): `formulario()` con `asignar`, `archivar_categoria`, `movimiento` y `meta`; `reporte('ritmo')` y un tipo desconocido rechazado con `VALIDACION`.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-REP-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-175 `@finn/sms`: intérprete y normalizadores

```tarea
orden: 174
bloque: B3
hito: HT-3
depende: TA-100
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=4 ca=0 migraciones=0 total=640
cubre: SMS-interprete, PR-2
pru: PRU-DOM-BAND-001
compartido: —
```

**Qué construir.**
- `interpretar.ts` y `normalizadores.ts` contra formatos dados como datos (04 §8.3, 03 §7.6), con el límite de 640 caracteres (PR-2) y "coincidencia doble" como `no_reconocido`.

**Leer.** 04 §8.3; 03 §7.6, §9.5, "Enmiendas posteriores" (PR-2); V-23.

**Archivos.** `packages/sms/src/{index,interpretar,normalizadores}.ts`, `packages/sms/pruebas/sinteticos/*`.

**Pruebas primero.**
- PRU-DOM-BAND-001 (V-23): los 13 SMS sintéticos con su resultado.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-001"`; `pnpm ci:local`.

**Terminada cuando.** 13 de 13.

#### TA-176 Política de patrones (BE-46) y `ci:politica-patrones`

```tarea
orden: 175
bloque: B3
hito: HT-3
depende: TA-175
tu: —
revision: obligatoria
paralelo: con TA-182
tamano: prod=200 archivos=4 ca=0 migraciones=0 total=520
cubre: BE-46, CI-politica-patrones
pru: PRU-DOM-BAND-002
compartido: —
```

**Qué construir.**
- `validar-formato.ts` con `recheck`: solo `safe` o polinomial de grado ≤ 2.
- Script `pnpm ci:politica-patrones` que evalúa cada formato **activo** de la siembra y de las migraciones; el job `desplegar` (Parte C) lo exige. Con F-1 a F-3 sin reescribir, falla (BE-46): por eso HT-5 espera a TA-181.

**Leer.** 04 §8.5, V-24; 07 §31.5 (paso 5).

**Archivos.** `packages/sms/src/validar-formato.ts`, `tools/ci/politica-patrones.ts`, `package.json` (script).

**Pruebas primero.**
- PRU-DOM-BAND-002 (V-24) con los tres patrones exponenciales de control.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-BAND-002"`; `pnpm ci:politica-patrones` (debe fallar hasta TA-181); `pnpm ci:local`.

**Terminada cuando.** La prueba pasa y el script falla con los formatos sembrados de 03 §9.5, como debe.

#### TA-177 Recibir SMS: guardar, procesar e intentos (OP-35, OPT-01)

```tarea
orden: 176
bloque: B3
hito: HT-3
depende: TA-159, TA-175, TA-120, TA-155
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=360 archivos=7 ca=0 migraciones=0 total=900
cubre: OP-35, OPT-01, BE-44, BE-45, BE-59, BE-60, BE-61, BE-62, N-02-intentos
pru: PRU-INT-BAND-001, PRU-CTR-BAND-001
compartido: —
```

**Qué construir.**
- `sms/recibir.ts`: token en tiempo constante contra el hash (OPT-01 lo rota y lo muestra una vez), contrato del cuerpo en sus dos variantes (BE-59, BE-61) con el cuerpo inválido guardado crudo (BE-60), guardado sin bloqueo, interpretación fuera del bloqueo (BE-45) y procesamiento con `escribir()`; intentos sin sobrescribir (N-02) y barrido de hasta 5 SMS sin resultado por petición (BE-62).
- Devuelve el código HTTP que corresponde (401, 5xx, 200) para que el Route Handler de la Parte C solo lo traduzca (BE-44).

**Leer.** 04 §8.1, §8.1.1, §8.2, §8.4, §8.6, §3.10 (OPT-01); 02 ADR-09, N-01, N-02; 03 §3.17, §3.18.

**Archivos.** `packages/aplicacion/src/sms/{recibir,procesar,token}.ts`, `packages/aplicacion/src/contratos/webhook.ts`.

**Pruebas primero.**
- PRU-CTR-BAND-001 y PRU-INT-BAND-001 (V-27): los 12 cuerpos contra las `CHECK` de 03 §3.17.

**Comandos.** `pnpm test:contratos -t "PRU-CTR-BAND-001"`; `pnpm test:integracion -t "PRU-INT-BAND-001"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan, con 12 de 12 cuerpos.

#### TA-178 Bandeja I: editar, aprobar y resolver (OP-36, OP-37, OP-39, OP-40)

```tarea
orden: 177
bloque: B3
hito: HT-3
depende: TA-177, TA-121, TA-122, TA-165
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=900
cubre: OP-36, OP-37, OP-39, OP-40
pru: PRU-INT-BAND-102
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-36, OP-37, OP-39, OP-40: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.6, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-BAND-102** (nueva, DT-17): OP-36, OP-37 (con la variante de CF-21), OP-39 y OP-40; un movimiento nunca cambia saldos ni Disponibles antes de aprobarse.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-BAND-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-179 Bandeja II: aprobar todos, reglas, reprocesar y crear a mano (OP-38, OP-41, OP-49, OP-50)

```tarea
orden: 178
bloque: B3
hito: HT-3
depende: TA-178
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=6 ca=0 migraciones=0 total=780
cubre: OP-38, OP-41, OP-49, OP-50
pru: PRU-INT-BAND-103
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-38, OP-41, OP-49, OP-50: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.6, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-BAND-103** (nueva, DT-17): OP-38 (una transacción por elemento, RT-03), OP-41, OP-49 y OP-50.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-BAND-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-180 Anonimización de muestras (07 §23, CH-03)

```tarea
orden: 179
bloque: B3
hito: HT-3
depende: TA-175
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=3 ca=0 migraciones=0 total=560
cubre: CH-03, SP-01-anonimizar
pru: PRU-SEG-BAND-002
compartido: —
```

**Qué construir.**
- `tools/pruebas/anonimizar.ts`: los reemplazos de 07 §23, la salida en `packages/{sms,conciliacion}/pruebas/muestras/` y `pruebas/muestras-cobertura.json` por institución y formato (CH-03).
- Lo corrés vos, sin ningún agente activo, sobre `C:\finn\_privado` (TU-13); el agente solo ve la salida.

**Leer.** 07 §23; CH-03 y §6 de este documento; TU-13.

**Archivos.** `tools/pruebas/anonimizar.ts`, `tools/pruebas/test/anonimizar.test.ts`.

**Pruebas primero.**
- PRU-SEG-BAND-002: falla si un archivo de muestras contiene una secuencia de 13 a 19 dígitos o unos últimos cuatro dígitos de `FINN_ULTIMOS4_REALES`.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-BAND-002"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa y su control (una muestra sin anonimizar) falla.

#### TA-181 Formatos del BAC reescritos; F-2 y F-3 inactivos (DT-12)

```tarea
orden: 180
bloque: B3
hito: HT-3
depende: TA-176, TA-180
tu: TU-13
revision: obligatoria
paralelo: con TA-176
tamano: prod=80 archivos=2 ca=0 migraciones=1 total=520
cubre: MIG-15, SP-01-BAC, DT-12
pru: PRU-DOM-BAND-105
compartido: —
```

**Qué construir.**
- Migración manual `m_formatos_bac` con bloqueo (03 §11.2): F-1 reescrito desde las muestras del BAC (más los formatos del BAC que aparezcan) y F-2 y F-3 con `activo = false` (OPT-05).
- Con esto `ci:politica-patrones` pasa (HT-5).
- **[CH-21]** La migración usa `finn.tomar_bloqueo()` y `finn.formatos_bancarios`, que crean `m_funciones` y `g_tablas`: `migrate deploy` la aplica solo con las carpetas de TA-051, que ordenan antes. TA-051 no va en `depende` porque esta tarea ya está `terminada` (S5 de `plan:verificar`).

**Leer.** 03 §7.6, §9.5, §11.2; 04 §8.5, OPT-05, SP-01, RS-03; §6 de este documento.

**Archivos.** `packages/db/prisma/migrations/<fecha>_m_formatos_bac/`, `packages/sms/pruebas/muestras/bac/*` (datos), `catalogo-esperado.txt`.

**Pruebas primero.**
- **PRU-DOM-BAND-105** (nueva, DT-17): cada formato del BAC reescrito reconoce sus muestras anonimizadas con los campos esperados y pasa la política de patrones.
- La prueba nueva sobre las muestras.

**Comandos.** `pnpm ci:politica-patrones`; `pnpm test:unidad -t "PRU-DOM-BAND-105"`; `pnpm ci:local`.

**Terminada cuando.** La política pasa con los formatos activos y cada muestra del BAC se reconoce.

#### TA-182 `@finn/conciliacion`: decodificación, detección y BAC tarjeta

```tarea
orden: 181
bloque: B3
hito: HT-3
depende: TA-100
tu: —
revision: normal
paralelo: con TA-176
tamano: prod=280 archivos=5 ca=0 migraciones=0 total=700
cubre: ADR-17, CONC-decodificar, CONC-BAC-tarjeta
pru: PRU-DOM-CONC-001
compartido: —
```

**Qué construir.**
- `decodificar.ts` (UTF-8 estricto, BOM, respaldo Windows-1252) con PapaParse.
- Registro de adaptadores con las seis firmas de ADR-17, de la más específica a la más general; Cuscatlán se reconoce y se rechaza como "formato excluido" (CH-03).
- Adaptador BAC tarjeta (04 §9.2) con las muestras anonimizadas de TU-13 si ya llegaron, o sintéticas marcadas ⚠ (S6-1) mientras tanto.

**Leer.** 02 ADR-17; 04 §9.1 a §9.4, V-25; CH-03.

**Archivos.** `packages/conciliacion/src/{index,decodificar,registro}.ts`, `packages/conciliacion/src/adaptadores/bac-tarjeta.ts`.

**Pruebas primero.**
- PRU-DOM-CONC-001 (V-25): UTF-8 con y sin BOM, Windows-1252 y ASCII dan las mismas celdas.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CONC-001"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-183 Adaptadores BAC débito y de Banco Agrícola

```tarea
orden: 182
bloque: B3
hito: HT-3
depende: TA-182
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=4 ca=0 migraciones=0 total=760
cubre: CONC-BAC-debito, CONC-Agricola
pru: PRU-DOM-CONC-102
compartido: —
```

**Qué construir.**
- Adaptadores BAC débito o ahorro (con muestras de TU-13) y los tres de Banco Agrícola (portal, convertido desde PDF, débito) con archivos sintéticos marcados ⚠ (S6-1); se reescriben con muestras reales en la Parte D si TU-14 confirma el CSV.

**Leer.** 02 ADR-17 (tabla de firmas); 04 §9.2, §9.4; CH-03; TU-14.

**Archivos.** `packages/conciliacion/src/adaptadores/{bac-debito,agricola-portal,agricola-pdf,agricola-debito}.ts`.

**Pruebas primero.**
- **PRU-DOM-CONC-102** (nueva, DT-17): cada adaptador extrae fecha, monto, descripción, fecha del estado y saldo final de su archivo; un archivo que coincide con dos firmas o con ninguna se rechaza.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-CONC-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con un archivo por adaptador.

#### TA-184 Conciliar: iniciar, agregar y terminar con carga firmada (OP-45 a OP-47)

```tarea
orden: 183
bloque: B3
hito: HT-3
depende: TA-183, TA-166, TA-123
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=320 archivos=6 ca=0 migraciones=0 total=860
cubre: OP-45, OP-46, OP-47, BE-49
pru: PRU-SEG-CONC-001
compartido: BE-06 (límite de 2 MiB del archivo en el contrato; la configuración de Next es de la Parte C)
```

**Qué construir.**
- OP-45 (lectura: decodificar, reconocer, clasificar y firmar), OP-46 y OP-47 verificando la carga firmada (BE-49: versión, `mac` con `timingSafeEqual`, cuenta y vencimiento).

**Leer.** 04 §3.8, §9.1 a §9.7; CH-06.

**Archivos.** `packages/aplicacion/src/conciliacion/*.ts`, `packages/aplicacion/src/operaciones/conciliacion/OP-4{5,6,7}-*.ts`.

**Pruebas primero.**
- PRU-SEG-CONC-001 (V-26, CH-06): firma válida, otra cuenta, monto alterado, vencida por 1 ms, clave anterior aceptada y versión retirada rechazada.

**Comandos.** `pnpm test:integracion -t "PRU-SEG-CONC-001"`; `pnpm ci:local`.

**Terminada cuando.** Seis de seis casos.

#### TA-185 Notificaciones: catálogo de motivos y registro (CF-16, BE-38, OPT-04)

```tarea
orden: 184
bloque: B3
hito: HT-3
depende: TA-155, TA-054, TA-159
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=4 ca=0 migraciones=0 total=620
cubre: CF-16, BE-38, OPT-04, NOTIF-catalogo
pru: PRU-INT-NOTIF-002
compartido: —
```

**Qué construir.**
- `push/catalogo.ts`: mapa motivo → aviso (o nulo) de 04 §11.2 con los motivos de CF-07 y CF-24.
- Registro en `notificaciones` sin push para AV-01 "después" (BE-38); OPT-04 marcar como leídas.

**Leer.** 04 §11.1, §11.2, §11.4, §3.10 (OPT-04), §6.1 (BE-38); 06 §3.13.

**Archivos.** `packages/aplicacion/src/push/{catalogo,registro}.ts`, `packages/aplicacion/src/operaciones/notificaciones/OPT-04-*.ts`.

**Pruebas primero.**
- PRU-INT-NOTIF-002: cada motivo del catálogo se inserta contra las restricciones de 03, con `aviso` nulo cuando no es un aviso del dominio.

**Comandos.** `pnpm test:integracion -t "PRU-INT-NOTIF-002"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con todos los motivos.

#### TA-186 Tarea diaria y puesta al día (pasos 2, 5, 6 y 7)

```tarea
orden: 185
bloque: B3
hito: HT-3
depende: TA-177, TA-185
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=4 ca=0 migraciones=0 total=700
cubre: TAREA-diaria, BE-50, BE-52, EN-1, EN-2-tarea
pru: PRU-INT-PROG-101
compartido: —
```

**Qué construir.**
- `tareas/diaria.ts` con los pasos 2, 5, 6 y 7 de 04 §10.2; los pasos 1, 3 y 4 llegan en la ola 2 (TA-194, TA-196).
- `tareas/puesta-al-dia.ts` (BE-50) que el layout de la Parte C llama con `after()`. El Route Handler `/api/tareas/diaria` es de la Parte C.

**Leer.** 04 §10.1 a §10.5; 03 "Enmiendas posteriores" (EN-1, EN-2).

**Archivos.** `packages/aplicacion/src/tareas/{diaria,puesta-al-dia,purgas}.ts`.

**Pruebas primero.**
- **PRU-INT-PROG-101** (nueva, DT-17): la tarea diaria corre dos veces el mismo día sin efectos nuevos; un paso que falla no detiene a los demás; la purga respeta EN-1, EN-2 y BE-52; la puesta al día no se lanza si hay una de hoy con menos de 5 minutos.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-PROG-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-187 Eventos del respaldo (OPT-09)

```tarea
orden: 186
bloque: B3
hito: HT-3
depende: TA-155, TA-159
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=140 archivos=3 ca=0 migraciones=0 total=420
cubre: OPT-09
pru: PRU-INT-RESP-101
compartido: —
```

**Qué construir.**
- `respaldo/eventos.ts` (04 §3.10, §16) con la verificación de `RESPALDO_SECRET` en tiempo constante. El Route Handler `/api/respaldo/[evento]` es de la Parte C.

**Leer.** 04 §3.10 (OPT-09), §16.1 a §16.4; 02 ADR-22.

**Archivos.** `packages/aplicacion/src/respaldo/eventos.ts`.

**Pruebas primero.**
- **PRU-INT-RESP-101** (nueva, DT-17): OPT-09 registra respaldo correcto, restauración correcta y deriva de C5 o C6 en `estado_respaldo` y `eventos_sistema`, y rechaza un secreto inválido.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-RESP-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-188 Escenarios contra PostgreSQL: ESC-01, ESC-02, ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10

```tarea
orden: 187
bloque: B3
hito: HT-3
depende: TA-163, TA-164, TA-165, TA-169, TA-171, TA-131
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=5 ca=0 migraciones=0 total=670
cubre: ESC-01@int, ESC-02@int, ESC-03@int, ESC-04@int, ESC-05@int, ESC-06@int, ESC-07@int, ESC-08@int, ESC-09@int, ESC-10@int
pru: —
compartido: —
```

**Qué construir.**
- `packages/aplicacion/test/escenarios/int.ts` **portado** del prototipo de V7-08 (zip de la Fase 7) y completado: base clonada por escenario y antes de cada fila de contraste, reloj simulado por paso (`fijarReloj`), operaciones reales de `@finn/aplicacion`.
- Los mismos archivos de datos de ESC-01, ESC-02, ESC-03, ESC-04, ESC-05, ESC-06, ESC-07, ESC-08, ESC-09, ESC-10 (B2) corren con el ejecutor `int`: cada operación por `@finn/aplicacion` contra PostgreSQL como `finn_app`, con el reloj simulado de cada paso, y la lectura por la consulta que corresponde (07 §12.3).
- Las aserciones que `motor` dejó omitidas se evalúan aquí; las que `int` no puede evaluar quedan omitidas con motivo y deben estar evaluadas en `motor` (regla 10).

**Leer.** 07 §12.3 (reglas 1 a 11), §5.2; 01 §8 (los mismos escenarios).

**Archivos.** `packages/aplicacion/test/escenarios/{int.ts,esc.int.test.ts}`.

**Pruebas primero.**
- `PRU-ESC-nn@int` de cada escenario del lote.

**Comandos.** `pnpm test:integracion -t "PRU-ESC-01@int|PRU-ESC-02@int|PRU-ESC-03@int|PRU-ESC-04@int|PRU-ESC-05@int|PRU-ESC-06@int|PRU-ESC-07@int|PRU-ESC-08@int|PRU-ESC-09@int|PRU-ESC-10@int"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan; ninguna aserción queda sin evaluar entre los dos ejecutores.

#### TA-189 Escenarios contra PostgreSQL: ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20

```tarea
orden: 188
bloque: B3
hito: HT-3
depende: TA-188, TA-166, TA-167, TA-132
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=370
cubre: ESC-11@int, ESC-12@int, ESC-13@int, ESC-14@int, ESC-15@int, ESC-16@int, ESC-17@int, ESC-18@int, ESC-19@int, ESC-20@int
pru: —
compartido: —
```

**Qué construir.**
- Los mismos archivos de datos de ESC-11, ESC-12, ESC-13, ESC-14, ESC-15, ESC-16, ESC-17, ESC-18, ESC-19, ESC-20 (B2) corren con el ejecutor `int`: cada operación por `@finn/aplicacion` contra PostgreSQL como `finn_app`, con el reloj simulado de cada paso, y la lectura por la consulta que corresponde (07 §12.3).
- Las aserciones que `motor` dejó omitidas se evalúan aquí; las que `int` no puede evaluar quedan omitidas con motivo y deben estar evaluadas en `motor` (regla 10).

**Leer.** 07 §12.3 (reglas 1 a 11), §5.2; 01 §8 (los mismos escenarios).

**Archivos.** `packages/aplicacion/test/escenarios/{int.ts,esc.int.test.ts}`.

**Pruebas primero.**
- `PRU-ESC-nn@int` de cada escenario del lote.

**Comandos.** `pnpm test:integracion -t "PRU-ESC-11@int|PRU-ESC-12@int|PRU-ESC-13@int|PRU-ESC-14@int|PRU-ESC-15@int|PRU-ESC-16@int|PRU-ESC-17@int|PRU-ESC-18@int|PRU-ESC-19@int|PRU-ESC-20@int"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan; ninguna aserción queda sin evaluar entre los dos ejecutores.

#### TA-190 Escenarios contra PostgreSQL: ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36

```tarea
orden: 189
bloque: B3
hito: HT-3
depende: TA-188, TA-166, TA-167, TA-170, TA-133
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=320
cubre: ESC-22@int, ESC-24@int, ESC-31@int, ESC-32@int, ESC-33@int, ESC-34@int, ESC-35@int, ESC-36@int
pru: —
compartido: —
```

**Qué construir.**
- Los mismos archivos de datos de ESC-22, ESC-24, ESC-31, ESC-32, ESC-33, ESC-34, ESC-35, ESC-36 (B2) corren con el ejecutor `int`: cada operación por `@finn/aplicacion` contra PostgreSQL como `finn_app`, con el reloj simulado de cada paso, y la lectura por la consulta que corresponde (07 §12.3).
- Las aserciones que `motor` dejó omitidas se evalúan aquí; las que `int` no puede evaluar quedan omitidas con motivo y deben estar evaluadas en `motor` (regla 10).

**Leer.** 07 §12.3 (reglas 1 a 11), §5.2; 01 §8 (los mismos escenarios).

**Archivos.** `packages/aplicacion/test/escenarios/{int.ts,esc.int.test.ts}`.

**Pruebas primero.**
- `PRU-ESC-nn@int` de cada escenario del lote.

**Comandos.** `pnpm test:integracion -t "PRU-ESC-22@int|PRU-ESC-24@int|PRU-ESC-31@int|PRU-ESC-32@int|PRU-ESC-33@int|PRU-ESC-34@int|PRU-ESC-35@int|PRU-ESC-36@int"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan; ninguna aserción queda sin evaluar entre los dos ejecutores.

#### TA-193 Condonar, devolver y eliminar evento (OP-32 a OP-34)

```tarea
orden: 190
bloque: B3
hito: HT-3
depende: TA-167, TA-138
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=5 ca=0 migraciones=0 total=780
cubre: OP-32, OP-33, OP-34
pru: PRU-INT-DEV-101
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-32, OP-33, OP-34: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.5, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-DEV-101** (nueva, DT-17): OP-32, OP-33 (a y b) y OP-34.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-DEV-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-194 Programadas y registro automático (OP-42 a OP-44, OP-51)

```tarea
orden: 191
bloque: B3
hito: HT-3
depende: TA-165, TA-139, TA-186, TA-055
tu: —
revision: normal
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=900
cubre: OP-42, OP-43, OP-44, OP-51, TAREA-paso1
pru: PRU-INT-PROG-102
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-42, OP-43, OP-44, OP-51: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.
- Paso 1 de la tarea diaria: registro automático, un `escribir()` por ocurrencia, sin registrar las de períodos cerrados (PR-3).

**Leer.** 04 §3.0, §3.7, §10.2 (paso 1), §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-PROG-102** (nueva, DT-17): OP-42 con `reactivada_desde`, OP-43 de un toque y automático idempotente, OP-44 y OP-51.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-PROG-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-191 Escenarios contra PostgreSQL: ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49

```tarea
orden: 192
bloque: B3
hito: HT-3
depende: TA-188, TA-163, TA-167, TA-170, TA-178, TA-184, TA-134, TA-193, TA-194
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=370
cubre: ESC-37@int, ESC-38@int, ESC-39@int, ESC-42@int, ESC-43@int, ESC-44@int, ESC-46@int, ESC-47@int, ESC-48@int, ESC-49@int
pru: —
compartido: —
```

**Qué construir.**
- Los mismos archivos de datos de ESC-37, ESC-38, ESC-39, ESC-42, ESC-43, ESC-44, ESC-46, ESC-47, ESC-48, ESC-49 (B2) corren con el ejecutor `int`: cada operación por `@finn/aplicacion` contra PostgreSQL como `finn_app`, con el reloj simulado de cada paso, y la lectura por la consulta que corresponde (07 §12.3).
- Las aserciones que `motor` dejó omitidas se evalúan aquí; las que `int` no puede evaluar quedan omitidas con motivo y deben estar evaluadas en `motor` (regla 10).

**Leer.** 07 §12.3 (reglas 1 a 11), §5.2; 01 §8 (los mismos escenarios).

**Archivos.** `packages/aplicacion/test/escenarios/{int.ts,esc.int.test.ts}`.

**Pruebas primero.**
- `PRU-ESC-nn@int` de cada escenario del lote.

**Comandos.** `pnpm test:integracion -t "PRU-ESC-37@int|PRU-ESC-38@int|PRU-ESC-39@int|PRU-ESC-42@int|PRU-ESC-43@int|PRU-ESC-44@int|PRU-ESC-46@int|PRU-ESC-47@int|PRU-ESC-48@int|PRU-ESC-49@int"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan; ninguna aserción queda sin evaluar entre los dos ejecutores.

### 14.3 Ola 2

#### TA-168 Exportar en JSON y CSV (OPT-08)

```tarea
orden: 620
bloque: B3
hito: HT-3
depende: TA-159
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=4 ca=0 migraciones=0 total=620
cubre: OPT-08
pru: PRU-CTR-AJUS-101
compartido: —
```

**Qué construir.**
- `exportacion/`: JSON completo de hechos con versión de formato y CSV de transacciones con sus líneas (04 §3.10, §16; 02 ADR-22). El Route Handler `/api/exportar/[formato]` es de la Parte C.

**Leer.** 04 §3.10 (OPT-08), §16; 02 ADR-22 (exportación).

**Archivos.** `packages/aplicacion/src/exportacion/*.ts`, `packages/aplicacion/src/contratos/exportacion.ts`.

**Pruebas primero.**
- **PRU-CTR-AJUS-101** (nueva, DT-17): la exportación JSON pasa su contrato Zod con versión de formato y el CSV de transacciones muestra `-45.00` con el signo ASCII (V5-02).
- La prueba nueva.

**Comandos.** `pnpm test:contratos -t "PRU-CTR-AJUS-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-192 Asignación rápida, ciclo, inversiones y desembolso (OP-16, OP-19, OP-25, OP-26)

```tarea
orden: 621
bloque: B3
hito: HT-3
depende: TA-164, TA-165, TA-136, TA-137
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=6 ca=0 migraciones=0 total=780
cubre: OP-16, OP-19, OP-25, OP-26
pru: PRU-INT-PRES-103
compartido: —
```

**Qué construir.**
- Una definición por operación en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` (04 §1.2, CH-01) para OP-16, OP-19, OP-25, OP-26: contrato Zod de entrada (BE-08), comando resuelto con su contexto [H] e [I] (BE-10), `aplicar` del dominio, `escribir()` con previsualizar y confirmar (BE-13) e idempotencia según su clase (04 §3.0, tabla de clases).
- Rechazos con su código y mensaje del catálogo (04 §7.10); avisos antes y después.

**Leer.** 04 §3.0, §3.3, §3.4, §4.2, §4.3, §4.6; 01 §5 (las mismas OP).

**Archivos.** `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, `packages/aplicacion/src/contratos/<area>.ts`, `packages/aplicacion/test/<area>.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-PRES-103** (nueva, DT-17): OP-16 con sus variantes, OP-19 con AV-12, OP-25 y OP-26.
- La prueba nueva contra PostgreSQL como `finn_app`: un caso por operación de punta a punta (previsualizar, confirmar, releer), uno de idempotencia con el mismo id y uno de conflicto con `revisionVista` vieja.

**Comandos.** `pnpm test:integracion -t "PRU-INT-PRES-103"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; los rechazos del dominio llegan con su código de 04 §3.0.6 y su mensaje.

#### TA-195 Formatos bancarios e instituciones (OPT-05 a OPT-07, BE-47)

```tarea
orden: 624
bloque: B3
hito: HT-3
depende: TA-176, TA-159
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=4 ca=0 migraciones=0 total=680
cubre: OPT-05, OPT-06, OPT-07, BE-47
pru: PRU-INT-BAND-104
compartido: —
```

**Qué construir.**
- OPT-05, OPT-06 y OPT-07 (04 §8.7).

**Leer.** 04 §3.10, §8.5, §8.7; 03 §3.21, "Enmiendas posteriores" (EN-1).

**Archivos.** `packages/aplicacion/src/operaciones/formatos/OPT-0{5,6,7}-*.ts`.

**Pruebas primero.**
- **PRU-INT-BAND-104** (nueva, DT-17): OPT-05 rechaza un patrón fuera de la política y audita en la misma transacción la fila anterior y la nueva (BE-47, EN-1); OPT-06 prueba un formato contra un SMS; OPT-07.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-BAND-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-196 Envío de push, suscripciones y pasos de push de la tarea diaria

```tarea
orden: 625
bloque: B3
hito: HT-3
depende: TA-185, TA-186
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=340 archivos=6 ca=0 migraciones=0 total=820
cubre: OPT-02, OPT-03, BE-51, BE-53, BE-54, CF-07, CF-24, TAREA-pasos3y4
pru: PRU-INT-NOTIF-101
compartido: —
```

**Qué construir.**
- `push/enviar.ts` con `web-push` y VAPID, OPT-02 y OPT-03, la política de BE-53 y la ejecución de la acción de una notificación (OP-40, BE-54) que el Route Handler de la Parte C llama.
- Pasos 3 y 4 de la tarea diaria.

**Leer.** 04 §11 completo, §10.2 (pasos 3 y 4), §3.10 (OPT-02, OPT-03); 06 §3.8 (CF-07), §3.16 (CF-24).

**Archivos.** `packages/aplicacion/src/push/{enviar,politica,accion}.ts`, `packages/aplicacion/src/tareas/diaria.ts`, `packages/aplicacion/test/push.int.test.ts`.

**Pruebas primero.**
- **PRU-INT-NOTIF-101** (nueva, DT-17): política de push por motivo (urgencia, TTL, agrupación y acciones), errores del servicio (404 y 410 eliminan la suscripción), push de cierre solo del último período (BE-51), `pago_tarjeta_proximo` y `cuota_proxima` una vez por clave, contra un receptor local.
- La prueba nueva, con el receptor local de 07 §7.1.

**Comandos.** `pnpm test:integracion -t "PRU-INT-NOTIF-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-197 Consultas de por cobrar, programadas, reglas y notificaciones

```tarea
orden: 626
bloque: B3
hito: HT-3
depende: TA-159, TA-140, TA-185
tu: —
revision: normal
paralelo: libre
tamano: prod=280 archivos=5 ca=0 migraciones=0 total=700
cubre: Q-porCobrar, Q-programadas, Q-reglas, Q-notificaciones
pru: PRU-INT-COBRO-102
compartido: —
```

**Qué construir.**
- `consultas/por-cobrar.ts`, `programadas.ts`, `reglas.ts`, `notificaciones.ts` (04 §6.12).

**Leer.** 04 §6.12.

**Archivos.** `packages/aplicacion/src/consultas/{por-cobrar,programadas,reglas,notificaciones}.ts`.

**Pruebas primero.**
- **PRU-INT-COBRO-102** (nueva, DT-17): `porCobrar()`, `programadas()` (horizonte de 30 días), `reglas()` y `notificaciones()`.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-COBRO-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-198 Contextos de formulario y tipos de reporte de la ola 2

```tarea
orden: 627
bloque: B3
hito: HT-3
depende: TA-174, TA-140, TA-141, TA-142, TA-143, TA-144
tu: —
revision: normal
paralelo: libre
tamano: prod=240 archivos=7 ca=0 migraciones=0 total=640
cubre: FORM-cobrar, FORM-condonar, FORM-devolver, FORM-formato, FORM-fusionar, FORM-programada
pru: PRU-INT-REP-102
compartido: Q-reporte (los 13 tipos restantes)
```

**Qué construir.**
- Seis contextos de `formulario` y el despacho de `reporte()` a los selectores de TA-141 a TA-144.

**Leer.** 04 §6.9, §6.14.4.

**Archivos.** `packages/aplicacion/src/consultas/formulario/{cobrar,condonar,devolver,formato,fusionar,programada}.ts`, `packages/aplicacion/src/consultas/reporte.ts`.

**Pruebas primero.**
- **PRU-INT-REP-102** (nueva, DT-17): los seis contextos de formulario de la ola 2 y cada tipo de `reporte()` con datos sembrados.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-INT-REP-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-199 Escenarios contra PostgreSQL: ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30, ESC-40, ESC-41, ESC-45, ESC-50

```tarea
orden: 628
bloque: B3
hito: HT-3
depende: TA-188, TA-163, TA-192, TA-193, TA-194, TA-145, TA-146
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=420
cubre: ESC-21@int, ESC-23@int, ESC-25@int, ESC-26@int, ESC-27@int, ESC-28@int, ESC-29@int, ESC-30@int, ESC-40@int, ESC-41@int, ESC-45@int, ESC-50@int
pru: —
compartido: —
```

**Qué construir.**
- Los mismos archivos de datos de ESC-21, ESC-23, ESC-25, ESC-26, ESC-27, ESC-28, ESC-29, ESC-30, ESC-40, ESC-41, ESC-45, ESC-50 (B2) corren con el ejecutor `int`: cada operación por `@finn/aplicacion` contra PostgreSQL como `finn_app`, con el reloj simulado de cada paso, y la lectura por la consulta que corresponde (07 §12.3).
- Las aserciones que `motor` dejó omitidas se evalúan aquí; las que `int` no puede evaluar quedan omitidas con motivo y deben estar evaluadas en `motor` (regla 10).

**Leer.** 07 §12.3 (reglas 1 a 11), §5.2; 01 §8 (los mismos escenarios).

**Archivos.** `packages/aplicacion/test/escenarios/{int.ts,esc.int.test.ts}`.

**Pruebas primero.**
- `PRU-ESC-nn@int` de cada escenario del lote.

**Comandos.** `pnpm test:integracion -t "PRU-ESC-21@int|PRU-ESC-23@int|PRU-ESC-25@int|PRU-ESC-26@int|PRU-ESC-27@int|PRU-ESC-28@int|PRU-ESC-29@int|PRU-ESC-30@int|PRU-ESC-40@int|PRU-ESC-41@int|PRU-ESC-45@int|PRU-ESC-50@int"`; `pnpm ci:local`.

**Terminada cuando.** Todos los escenarios del lote pasan; ninguna aserción queda sin evaluar entre los dos ejecutores.

---

## 15. Bloque B5 de la Parte B — respaldo y prueba de humo (HT-4)

TA-251 va primero porque H-08 usa `respaldar.mjs` y `restaurar.sh`. TA-250 arma `humo.sh` y TA-253 agrega H-09 y H-10, que necesitan la carga de hechos y el volumen. TA-252 pone en `rapido` los scripts de trazabilidad de las fases anteriores (CT-08); no depende de nada de la Parte B. Los workflows `respaldo.yml`, `restauracion.yml` y `desplegar` y el control de dinero son de la Parte C (DT-11).

#### TA-252 Scripts de las fases anteriores en `rapido` (CT-08, BE-63)

```tarea
orden: 30
bloque: B5
hito: —
depende: TA-002, TA-012
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=80 archivos=3 ca=0 migraciones=0 total=300
cubre: CT-08, BE-63, TRZ-fases
pru: PRU-SEG-OPER-102
compartido: —
```

**Qué construir.**
- **Portados** a `tools/docs/` (Python permitido por CT-05): `t17.py` (04), `trazabilidad.py --comprobar` y `cobertura.py` (05, versión de CT-08), `trazabilidad.py`, `revisar_fichas.py`, `prueba_reportes.py` y `recorridos.py` (06).
- `pnpm docs:comprobar` los corre todos; `rapido` lo llama solo si el diff toca `docs/` (07 §13.7).

**Leer.** 07 §13.7, §35 (tabla de scripts antes y después); 04 §18.4 (BE-63).

**Archivos.** `tools/docs/*.py` (portados), `tools/docs/comprobar.mjs`, `tools/ci/afecta.mjs` (paso condicional de `rapido`, DP-34) y `package.json` (script). **[CH-18]**

**Pruebas primero.**
- **PRU-SEG-OPER-102** (nueva, DT-17): con un documento de `docs/` alterado (una operación quitada de una ficha), el paso de trazabilidad de `rapido` falla.
- La prueba nueva.

**Comandos.** `pnpm docs:comprobar`; `pnpm ci:local`.

**Terminada cuando.** Los 7 scripts pasan sobre `docs/` con las salidas de V7-20 y el control falla.

#### TA-251 Respaldo y restauración: scripts y prueba `RES`

```tarea
orden: 193
bloque: B5
hito: HT-4
depende: TA-152, TA-109, TA-156
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=330 archivos=5 ca=0 migraciones=0 total=820
cubre: ADR-22-scripts, RESP-manifiesto
pru: PRU-RES-RESP-101
compartido: —
```

**Qué construir.**
- `tools/respaldo/respaldar.mjs` **portado** del zip de la Fase 3 (03 §12.1): instantánea exportada, manifiesto `{ revision, conteos }` y `pg_dump --snapshot`.
- `tools/respaldo/restaurar.sh` **portado** (03 §12.2), más el paso del motor: carga los hechos restaurados con `cargar` (TA-152) y corre `verificarInvariantes` (TA-109).
- Cifrado con `age` usando una clave de prueba generada en el job; nunca la clave real.
- La prueba corre en el nocturno (07 §1.1, nivel `RES`).

**Leer.** 03 §12.1, §12.2; 04 §16.3, §16.4; 07 §19.6; 02 ADR-22.

**Archivos.** `tools/respaldo/{respaldar.mjs,restaurar.sh,motor.ts}` (los dos primeros portados), `tools/respaldo/test/respaldo.test.sh`, `.github/workflows/nocturno.yml` (paso `test:respaldo`).

**Pruebas primero.**
- **PRU-RES-RESP-101** (nueva, DT-17): volcado de una base sembrada con el volumen base, cifrado con `age`, restaurado en una base sin `auth`: `verificar_todo()` sin filas, conteos y revisión iguales al manifiesto e invariantes calculadas con el motor.
- La prueba nueva; control: un volcado con una FK hacia `auth.users` falla al restaurar.

**Comandos.** `pnpm test:respaldo`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa en local y en el nocturno; el control falla como debe.

#### TA-250 Prueba de humo: `humo.sh` con H-01 a H-08, H-11 y H-12

```tarea
orden: 194
bloque: B5
hito: HT-4
depende: TA-059, TA-251, TA-150
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=360 archivos=6 ca=0 migraciones=0 total=700
cubre: HUMO-base
pru: PRU-SEG-OPER-103
compartido: —
```

**Qué construir.**
- `tools/humo/humo.sh` (bash, Git Bash y Ubuntu) con los pasos de 04 §17.2 H-01 a H-08, H-11 y H-12, cada uno independiente; los pasos H-09 y H-10 quedan como `omitido` hasta TA-253.
- H-05 usa C3 a C6 de B1; H-06 es `tools/humo/patron.ts`, que repite V-01, V-02, V-05 a V-08, V-10 y V-11 con `escribir()` y `leer()` de TA-150 por el pooler real; H-08 usa `respaldar.mjs` y `restaurar.sh` de TA-251.
- Entradas solo por variables de la sesión (04 §17.1); la salida nunca imprime secretos.

**Leer.** 04 §17.1 a §17.3 completos; TU-07 de este documento.

**Archivos.** `tools/humo/humo.sh`, `tools/humo/patron.ts`, `tools/humo/pasos/*.sh`, `tools/humo/test/humo.test.sh`.

**Pruebas primero.**
- **PRU-SEG-OPER-103** (nueva, DT-17): `humo.sh` contra una base local con el bootstrap: cada paso emite una línea JSON `{ paso, resultado, medido, detalle }` y ninguna línea contiene el valor de una variable secreta.
- La prueba nueva contra el contenedor local, con variables secretas de prueba cuyo valor se busca en la salida.

**Comandos.** `bash tools/humo/test/humo.test.sh`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; la salida es JSON por línea y sin secretos.

#### TA-253 Prueba de humo: H-09 (carga desde `iad1`) y H-10 (Auth)

```tarea
orden: 195
bloque: B5
hito: HT-4
depende: TA-250, TA-156
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=300 archivos=6 ca=0 migraciones=0 total=640
cubre: BE-56, BE-58, HUMO-iad1-auth
pru: PRU-SEG-ACCESO-102
compartido: —
```

**Qué construir.**
- H-09 (BE-58): esquema temporal `humo` con ~200.000 filas del generador de volumen (TA-156), función temporal `tools/humo/funcion-carga` desplegada en `iad1` con el token de vida corta de TU-07, que ejecuta las consultas de 04 §5.2 y devuelve tiempos; el paso la borra al terminar.
- H-10: `tools/humo/borrar-factores.mjs` (BE-56, 04 §12.6) y los pasos de 04 §17.2 con un usuario de prueba.
- H-12 limpia también lo de H-09 y H-10.

**Leer.** 04 §17.2 (H-09, H-10, H-12), §12.6, §5.2, §5.6; TU-07.

**Archivos.** `tools/humo/pasos/h09.sh`, `tools/humo/funcion-carga/**`, `tools/humo/pasos/h10.sh`, `tools/humo/borrar-factores.mjs`.

**Pruebas primero.**
- **PRU-SEG-ACCESO-102** (nueva, DT-17): `borrar-factores.mjs` contra la pila local de Supabase: borra los factores del usuario indicado, cierra sus sesiones y no imprime la clave.
- La prueba nueva contra la pila local (`supabase start -x …` de 07 §5.3).

**Comandos.** `bash tools/humo/test/humo.test.sh`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa en local; después del merge corrés TU-07 y registrás PRU-MAN-ESQ-001; HT-4 se cumple con H-01 a H-12 en `pasa` o con su alternativa registrada.

---

## 16. Revisiones de la Parte B

### 16.1 Cobertura

- **Objetivos de las partes A y B:** 719 del catálogo `plan/objetivos.txt`, cada uno con exactamente una tarea dueña (V8-01). De la Parte B:
  - las 53 operaciones de 04 §3, cada una dos veces: en `@finn/aplicacion` y como comando de `aplicar`;
  - las 9 operaciones técnicas;
  - los 50 escenarios, cada uno con sus dos ejecutores;
  - las 28 invariantes, los 34 casos borde y los 24 avisos;
  - las 19 consultas, los 15 reportes (más `datos_base`) y los 15 contextos de formulario;
  - las 15 migraciones más el bootstrap y `schema.prisma`, C3 a C6 y R1 a R15;
  - 52 PRU de la Parte B (48 de 07 y 4 de CH-05 y CH-06), y los CF y CT que tocan estos bloques.
- **El catálogo ya no está transcrito a mano.** `catalogo.py` lo arma desde los documentos en disco, y `verificar.ts --docs` comprueba que contenga todo lo que derivan 01, 04, 06 y 07 (E11):
  - 492 CA (233 de fichas [I], 259 de fichas [M], [P] y FT-49);
  - 53 operaciones y 9 técnicas;
  - 50 escenarios, 28 invariantes, 34 casos borde y 24 avisos;
  - 19 consultas, 15 reportes, 15 formularios y 78 rutas;
  - 110 PRU.
- **Pendientes para las partes C y D:** 637 objetivos (342 de la C y 295 de la D). Con `--parte todas`, el script los informa como E8 hasta entonces. **[C]** Con el registro FE de 05, los recorridos y DT-20, el catálogo pasa a 112 + 608 + 393 + 308 (§24).

### 16.2 Qué cae en la ola 1 (cálculo de DT-16)

Leído de 06 §6.2 y §6.3: una pieza es de la ola 1 si la cita alguna de las 31 fichas [I].

| Ola | Operaciones | Consultas y reportes | Formularios |
|---|---|---|---|
| 1 | OP-01 a OP-15 (salvo OP-16), OP-17, OP-18, OP-20 a OP-24, OP-27 a OP-31, OP-35 a OP-37, OP-39 a OP-41, OP-45, OP-47 a OP-50, OP-53, OPT-01, OPT-04 | `actividad`, `ajustes`, `bandeja`, `cuentas`, `detalleCategoria`, `detalleCuenta`, `detalleLpa`, `detalleTransaccion`, `estructura`, `formulario`, `inicio`, `metas`, `presupuesto`, `sugerencia`, `reporte('ritmo')` | `registrar`, `pagar_tarjeta`, `cuota_prestamo`, `editar_transaccion`, `asignar`, `archivar_categoria`, `cuenta`, `movimiento`, `meta` |
| 2 | OP-16, OP-19, OP-25, OP-26, ~~OP-32 a OP-34~~ (**[B2]** pasan a la 1), OP-38, ~~OP-42 a OP-44~~ (**[D]** pasan a la 1), OP-46, ~~OP-51~~ (**[D]**), OP-52, OPT-02, OPT-03, OPT-05 a OPT-09 | `notificaciones`, `porCobrar`, `programadas`, `reglas` y los otros 14 tipos de `reporte` | `cobrar`, `condonar`, `devolver`, `formato`, `fusionar`, `programada` |

Ajustes a la regla:
- **Pasan a la ola 1 por la operación de B5:** OPT-09 (eventos del respaldo), que el respaldo necesita antes de cargar datos reales (HT-6).
- **Pasan a la ola 1 por cohesión:** OP-38, OP-46 y OP-52 (DT-16).
- **[B2] Pasan a la ola 1 por la condición de HT-6 (P8-18, DT-25):** OP-32 a OP-34 en el dominio (TA-138) y en la aplicación (TA-193). ESC-44 toca una ficha de HT-6 (06 §6.5) y necesita OP-33; pasa a TA-134 (`@motor`) y TA-191 (`@int`). Dentro de cada ola, el `orden` es topológico: TA-138 queda antes de TA-134 y TA-193 antes de TA-191. **[D]** También pasan a la ola 1 OP-42 a OP-44 y OP-51 (TA-139 y TA-194): ESC-44 empieza con una programada activa (§26.6).

Los escenarios siguen a sus operaciones:
- ola 1: ESC-01 a ESC-20, ESC-22, ESC-24, ESC-31 a ESC-39, ESC-42 a ESC-44 y ESC-46 a ESC-49 (**[B2]** 38);
- ola 2: ESC-21, ESC-23, ESC-25 a ESC-30, ESC-40, ESC-41, ESC-45 y ESC-50 (**[B2]** 12).

### 16.3 Lo que se porta desde los documentos

Estos archivos existen completos en el texto de los documentos aprobados, así que no dependen de los zips. DT-14 los compara contra el bloque de código de su sección:
- `tools/db/bootstrap.sql` (03 §10.4.1);
- las 7 migraciones de 03 (§10.4.2 a §10.4.8);
- `schema.prisma` (03 §10.3);
- la migración de EN-2 (04 §10.2).

### 16.4 Archivos de los zips que cita la Parte B

Los zips siguen sin llegar (§8.2). Sin ellos, estas tareas no pueden portar y quedan bloqueadas. No planeo reconstruirlos sin tu respuesta (P8-1, P8-15). **[B2]** P8-15 resuelta: los recuperás y llegan en una carpeta propia; estas tareas quedan como "portar desde anexos", `anexos.ts` (V8-05) comprueba los archivos cuando llegue la carpeta y nada se reconstruye desde los `.md` sin avisarte. Los de la Parte C están en §23.2.

| Archivo | Zip | Tarea |
|---|---|---|
| `catalogo.sql`, `reglas-catalogo.sql` (R1–R13) | Fase 3 | TA-051 |
| `respaldar.mjs`, `restaurar.sh` | Fase 3 | TA-251 |
| `sql/03_regla_r14.sql` (R14) | Fase 4 | TA-051 |
| Los 13 SMS sintéticos de V-23 | Fase 4 | TA-175 |
| `webhook/cuerpo.ts` y los 12 casos de V-27 | Fase 4 | TA-177 |
| `t17.py` | Fase 4 | TA-252 |
| `trazabilidad.py` y `cobertura.py` (versión de CT-08) | Fase 5 / Fase 7 | TA-252 |
| `motor_min.py` (alcance de V7-03) | Fase 6 | TA-112 |
| `recorridos.py`, `trazabilidad.py`, `revisar_fichas.py`, `prueba_reportes.py`, `reportes.py` | Fase 6 | TA-135, TA-252 |
| Prototipo de `m_reloj`, `regla-r15.sql`, `reloj-simulado.sql` | Fase 7 | TA-056 |
| Prototipo de PRU-INT-POOL (V7-05) | Fase 7 | TA-059 |
| `escenarios/tipos.ts` y ejecutores `motor` e `int` (V7-08) | Fase 7 | TA-130, TA-188 |
| `estado_a7.py`, `comparar.py`, `motor_min.py` extendido | Fase 7 | TA-147 |

**Qué se puede escribir sin el zip, según el texto de 07:**
- R15 y `reloj-simulado.sql` (07 §4.4);
- la suite del pooler (07 §5.3);
- el formato de escenarios (07 §12.3).

En esos casos, el agente escribe código nuevo, con las mismas pruebas, y la tarea deja de ser "portado".

**Qué no tiene especificación completa fuera del zip:**
- `catalogo.sql` y las reglas R1 a R13;
- los scripts de trazabilidad;
- `motor_min.py`;
- `estado_a7.py`.

Reconstruirlos sería rehacer verificaciones de fases cerradas.

### 16.5 Contradicción entre 07 y 04: las acciones de notificación (CH-06)

07 da a PRU-SEG-NOTIF-001 una firma HMAC con vencimiento y versión de clave para `X-Finn-Accion`, citando V-26. 04 no firma las acciones de notificación:
- exige `Origin`, la cabecera `X-Finn-Accion` y AAL2 (04 §11.5, BE-54);
- V-26 es la carga firmada de la conciliación (04 §9.6, BE-49).

No lo resolví en las tareas. TA-184 usa el identificador que propone CH-06 para la conciliación (PRU-SEG-CONC-001). PRU-SEG-NOTIF-001 queda para el Route Handler de la Parte C, con el texto que decidas (P8-16).

### 16.6 Otros hallazgos

- **La numeración de B3 está llena.** B3 usa los 50 números de su rango (TA-150 a TA-199). Si `pr:mergear` obliga a partir una tarea de B3, DT-02 pide "el siguiente libre del rango", y no hay ninguno (P8-17). B2 deja libres TA-148 y TA-149. **[B2]** Resuelta: TA-230 a TA-249 (DT-02).
- **Carga de revisión.** **[B2]** 51 (eran 52; TA-101 pasa a normal por DT-20) de las 112 tareas de la Parte B son de revisión obligatoria (DT-05); qué revisás en cada una está en §1.5: todo B1, el motor, los workflows, el reloj y la seguridad. Cada una espera tu "mergeá". Para no frenar a los agentes, conviene que revises en tandas. Mientras tanto, cada agente toma la siguiente tarea disponible que no dependa de la pendiente (`plan:siguiente`).
- **07 no define PRU-INT-ESQ-011.** El salto de numeración no afecta nada: ninguna tarea lo usa.
- **El modelo de minutos es conservador para la Parte B.** Supone que el 40 % de los pushes toca la base y el 70 % de los PR listos toca la web. B2 no toca ni la base ni la web, así que sus PR solo pagan `rapido`.

### 16.7 Riesgos de la Parte B

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RB-1 | Los zips no llegan | Media | Alto | P8-15. Sin ellos, las tareas de §16.4 quedan `bloqueadas` con su motivo, y `plan:siguiente` ofrece las demás |
| RB-2 | C4 no acepta `dbgenerated("finn.ahora()")` | Media | Bajo | TA-157, la alternativa ya aprobada (07 §32.1) |
| RB-3 | Una tarea de operaciones de B3 con 6 o 7 operaciones pasa de 400 líneas | Media | Bajo | `pr:mergear` obliga a partirla; P8-17 da los números |
| RB-4 | Las muestras del BAC tardan y TA-181 no se mergea | Media | Alto | Bloquea HT-5, no el resto: B2, B3 y la Parte C siguen con datos sintéticos |
| RB-5 | Docker Desktop o Testcontainers fallan en Windows | Media | Alto | TA-050 lo descubre primero; RS7-01 y RS7-14 de 07 |

---

## 17. Verificación de la Parte B

**Entorno:** Node 22.22.0 con la eliminación de tipos (este entorno no tiene Node 24) y Python 3.13. Los documentos 01 a 07 están completos en disco, leídos del proyecto: `verificacion/docs/`. Las salidas están en `08-tareas-verificacion.zip`.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V8-01 | `verificar.ts` sobre las partes A y B (`--parte B --docs docs --negativo`) y sobre la A sola | **Pasa.** 125 tareas, 5 hitos con bloque (HT-0 a HT-4), 20 TU. 719 objetivos, cada uno con una sola tarea dueña. Sin ciclos ni dependencias hacia adelante. Tamaños dentro de DT-01, con la única excepción aprobada (DT-15). HT-1 a HT-4 alcanzables con sus TU. El catálogo contiene los 1.030 objetivos que derivan los documentos. **Control negativo: 15 de 15 mutaciones detectadas.** Las 10 de la Parte A y 5 nuevas: excepción en otra tarea (E6), PRU nueva con un área que 07 no tiene (E9), CA quitado del catálogo (E11), PRU de 07 sin dueño (E8) y TU de una tarea etiquetada que falta en el hito (E7). La Parte A sola también pasa, con 111 objetivos | Primera corrida, 3 errores reales, corregidos: <br>- HT-3 no listaba TU-13; <br>- una lista `compartido` con comas dentro del motivo, que el lector parte en varias entradas; <br>- PRU-INT-POOL-003 no aparecía literal en CH-05. <br>Antes, el catálogo leía 477 CA en lugar de 492: no veía los CA con marca (`(manual)`, `⚠`, `(error 11)`). Se corrigió la lectura y E11 lo cuida desde ahora | Node 24 (corrió en Node 22.22); las partes C y D |
| V8-02 | Minutos y meses (`estimacion.ts`) con B0 a B3 exactos | **Tareas:** 240 a 280 (232 a 268 hasta la puerta), frente a 186 a 247 en la Parte A. **2 pushes por PR:** 25,8 min por PR y 51 PR al mes con producción, **4,4 a 5,1 meses** hasta la puerta. **3,75 pushes por PR:** 40 PR al mes, 6,1 a 7,0 meses | Son 54 tareas más que en la estimación anterior: la Parte B tiene 112 tareas, frente a las 63 a 86 estimadas. El número de PR al mes no cambia; cambian los meses. El modelo sigue limitado por minutos con 2 pushes por PR | El ritmo real de agentes y revisiones (16.6, carga de revisión) |
| V8-03 | Cada PRU de un campo `pru` frente a 07 en disco | **163 PRU:** 65 definidos en 07, 5 por un CH (PRU-MAN-CTA-002 por CH-04; PRU-INT-POOL-001, 003 y 005 por CH-05; PRU-SEG-CONC-001 por CH-06) y 93 nuevos según DT-17, con nivel y área válidos. **Control:** sin la fila de CH-06, PRU-SEG-CONC-001 falla con E9 | CH-06 (§16.5). La Parte A citaba 23 PRU; ahora, contra 07 completo, la cuenta de la Parte A da 18 objetivos PRU, porque PRU-SEG-RELOJ-006, PRU-INT-NOTIF-002, PRU-ESQ-POOL-001, PRU-INT-POOL-002/004/006 y PRU-SEG-BAND-002 se citaban en textos de la Parte A, pero sus dueños son de B y C | — |
| V8-04 | Prueba de la plantilla de encargo | Parte D | — | — |

---

## 18. Preguntas de la Parte B (resueltas; respuestas en §0.9) **[B2]**

**P8-15. Los zips.** Siguen sin llegar. En esta conversación solo hay capturas del diseño. Las tareas de §16.4 los necesitan para portar sin reescribir. Opciones:
- a) Los adjuntás en un mensaje. O los dejás en una carpeta de tu Mac o de tu PC y la agregás a esta conversación con "Add folder".
- b) Reconstruyo lo que tiene especificación en 07 (R15, reloj simulado, pooler, formato de escenarios) como código nuevo, y bloqueo hasta los zips solo lo que no la tiene (catálogo y R1 a R13, scripts de trazabilidad, oráculo, A.7).
- c) Reconstruyo todo desde los documentos, con verificación propia.

*Recomiendo a).* b) sirve si los zips tardan. c) rehace verificaciones de fases cerradas.

**Respuesta [B2]:** a), con una carpeta propia. Nada se reconstruye desde los `.md` sin avisarte; V8-05 corre cuando llegue la carpeta.

**P8-16. CH-06 (acciones de notificación).** Opciones:
- a) CH-06 como está: PRU-SEG-NOTIF-001 prueba `Origin`, `X-Finn-Accion` y AAL2, y V-26 pasa a PRU-SEG-CONC-001.
- b) Mantener 07 y agregar firma HMAC a las acciones de notificación. Es un cambio a 04 BE-54 y a su Route Handler.

*Recomiendo a):* 04 es el diseño aprobado, y V-26 verificó la conciliación.

**Respuesta [B2]:** a). CH-06 aprobado.

**P8-17. Números cuando se parte una tarea de B3.** El rango de B3 está lleno (§16.6). Opciones:
- a) B4 pasa a TA-200 a TA-229, y TA-230 a TA-249 recibe las partes de tareas de B3 (o de B2, si se llena) que `pr:mergear` obligue a partir. DT-02 recibe una línea.
- b) La parte nueva toma un número de B2 libre (TA-148, TA-149) y después de B4.

*Recomiendo a):* B4 tiene 14 a 18 tareas estimadas, así que le sobran números.

**Respuesta [B2]:** a). B4 usa TA-200 a TA-224 (§20).

**P8-18. Olas (DT-16).** Opciones:
- a) Dos olas, con la Parte C entre medio (HT-2 y HT-3 después de HT-6).
- b) B2 y B3 completos antes de la web.

*Recomiendo a):* el uso diario llega unas 25 tareas antes y la prioridad [I] → [M] → [P] se respeta también en el dominio.

**Respuesta [B2]:** a), con la condición de HT-6 (DT-25).

---

# Parte C — Web base, operación y fichas [I]

## 19. Decisiones de la Parte C

### 19.1 DT-20: qué hace obligatoria una revisión **[B2]**

La regla y lo que revisás están en §1.5. Resumen: solo los archivos de **producción** de un área crítica vuelven obligatoria una tarea; los de prueba, de datos y los portados idénticos no. TA-014 la aplica en `pr:mergear` y agrega el resumen de revisión y la línea "Qué mirar".

**Justificación.** Lo que tu revisión agrega es mirar donde una prueba verde no protege: el código de dinero, de acceso, del reloj y de la CI. Un escenario nuevo como datos ya lo controlan la matriz y el ejecutor, y un portado, su huella. *Alternativas descartadas:* bajar el motor a revisión normal cuando tiene muchas pruebas (un error de dinero puede pasar con todas en verde: por eso existe el diferencial); revisar por muestreo (no sabés cuál PR es el riesgoso).

### 19.2 DT-21: las tareas de fichas no preasignan identificadores de pruebas

Las tareas de B4 y B5 traen sus pruebas nuevas con identificador (DT-17), como B2 y B3. Las de B6 **no**: cada CA recibe su prueba con el nivel que fija 07 §17 al escribirla, con el siguiente número libre de su suite (desde 101) y el CA entre corchetes. La matriz exige una prueba por CA (M1) y rechaza identificadores repetidos; si dos agentes toman el mismo número, el segundo PR falla en `rapido` y renumera el título. El campo `pru` de una tarea de B6 lista solo las PRU que 07 ya define.

**Justificación.** Son 233 CA en 36 tareas. Fijar hoy 250 o más identificadores obligaría a decidir el nivel de cada prueba antes de leer la ficha, y la regla de nivel de 07 §17 la aplica mejor el agente con el CA delante. M1 ya da la garantía que importa (ningún CA sin prueba). *Alternativa descartada:* un identificador por CA en el plan (el plan crece en cientos de líneas que la matriz ya controla).

### 19.3 DT-22: candado de la E2E local

`pnpm test:e2e` toma `C:/finn/e2e.lock` (TA-219) antes de levantar la pila local de Supabase y lo suelta al terminar; si otro agente lo tiene, espera y lo informa. Reemplaza la fila "Dos tareas que ejecutan E2E local" de los pares de §1.8 para la Parte C: casi todas las tareas de B4 y B6 corren E2E, así que como par las serializaría todas.

**Justificación.** Lo que choca son los puertos fijos de la pila (P8-5), no las tareas. Con el candado, dos agentes trabajan en paralelo y solo la corrida de E2E espera. *Alternativas descartadas:* puertos distintos por worktree (la pila de Supabase no los configura por proyecto sin editar `config.toml` en cada worktree); `paralelo: con` en cada par (inmanejable con 61 tareas).

### 19.4 DT-23: la dueña de una ruta

Cada ruta de 06 §6.4 tiene una sola tarea dueña: la de la ficha [I] cuya pantalla o flujo **es** esa ruta (por ejemplo, `/` es Inicio, FT-08, aunque FT-01 redirija a ella). Si ninguna ficha [I] la tiene como pantalla propia, la dueña es la primera ficha [I] que la cita, en `orden`. Las demás fichas que la citan agregan elementos a esa página. Dos excepciones, reflejadas en el catálogo:
- `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` pasa a la Parte D: la citan FT-08 (enlace desde Inicio) y FT-71, pero la construye FT-41 [M]. Hasta entonces, Inicio no muestra ocurrencias (no hay programadas en la ola 1).
- `/sin-conexion` pasa a la Parte C: es la página precacheada del service worker (05 §8.5), TA-223. FT-05 [M] agrega su texto de ayuda.

`TA-200` no crea páginas: deja los layouts y una página provisional "Inicio vacío" en `(finn)/page.tsx`, que reemplaza la tarea de FT-08. *Alternativa descartada:* crear todas las rutas vacías en B4 (una ruta vacía pasaría la prueba de acceso y la de accesibilidad sin contenido, y la tarea de la ficha no sabría que la posee).

### 19.5 DT-24: recursos de marca provisionales (05 §10.11)

`finn-marca.zip` está **dentro** de `finn-entrega.zip` (06-identidad-visual §2, tabla del paquete). Si `finn-entrega.zip` llega, la marca llega con él. Si no está, TA-203 usa los recursos provisionales neutros que 05 §10.11 **ya aprueba**: un cuadrado del color `accion` con la letra F, en los mismos nombres de archivo de `public/marca/` y con la marca "provisional" en su `LEEME.md`. Cuando lleguen los reales, se reemplazan los archivos sin tocar código (un PR de datos). Las tareas afectadas están en §23.3.

No se reconstruye nada desde los `.md`: los provisionales no copian la marca; son el reemplazo que 05 prevé.

### 19.6 DT-25: HT-6 exige las pruebas de dinero de sus fichas (P8-18)

**Fichas de HT-6.** Las 13 de la Parte A más **FT-14** (detalle de categoría: el criterio pide "los mismos números en Inicio, Presupuesto y el detalle"), **FT-37** (descartar y duplicados: un SMS real puede llegar repetido el primer día) y **FT-38** (no reconocidos y con error: sin esta ficha, la Bandeja no se puede vaciar). Son 16.

**Condición.** El bloque de HT-6 lista `fichas` y `pruebas`. El verificador:
- deriva de 06 §6.5 los ESC que tocan esas fichas y exige sus dos ejecutores (`@motor` e `@int`): 19 escenarios, 38 pruebas;
- deriva de cada ficha los CB que cita: CB-09, CB-10, CB-14, CB-15, CB-16, CB-17, CB-25, CB-28;
- agrega las de `pruebas`: las propiedades de los invariantes 1 a 5 y 26 a 28 y el diferencial contra el oráculo;
- comprueba que la dueña de cada una esté en `requiere` o en sus dependencias (E7-pruebas), y lo mismo con cada CA de las fichas (E7-fichas).

En total, 55 objetivos de prueba. Para cumplirlo, ESC-44 y OP-32 a OP-34 pasan a la ola 1 (§16.2), y `requiere` suma las tareas de escenarios y el diferencial que ninguna ficha tenía como dependencia: TA-112, TA-132, TA-133, TA-134, TA-189, TA-190, TA-191. Una tarea de otro hito puede estar en `requiere` solo si es dueña de una prueba exigida; si no, sigue siendo error E7.

*Alternativas descartadas:* exigir HT-2 y HT-3 completos antes de HT-6 (es la ola 2 entera, 17 tareas que ninguna ficha de HT-6 usa); dejar la condición solo en el texto del criterio (nadie la comprobaría al marcar el hito).

### 19.7 DT-26: dependencias entre fichas

El campo **Dependencias** de cada ficha de 06 se vuelve dependencia de tarea cuando apunta a una ficha [I] que va antes (de su última tarea). Es **blanda** cuando apunta a una ficha [M] o [P], a una [I] de un hito posterior o es mutua. Una dependencia blanda no bloquea la tarea; la parte de la ficha que la usa se prueba sembrando el estado con operaciones (DP-17), y la ficha de la que depende agrega la prueba de punta a punta cuando se construye.

| Ficha | Depende en 06 de | Por qué no es una dependencia de tarea | Cómo se prueba la parte que la usa |
|---|---|---|---|
| FT-03 | FT-34, FT-38 | Dependencia mutua: FT-34 depende de FT-03. FT-03 va primero | CA-03.3 (la comprobación) se prueba en `RH`/`INT`: el webhook crea el movimiento; la E2E de la Bandeja la agrega TA-294 |
| FT-04 | FT-77 [P] | Ficha [P] | El primer uso guarda la preferencia con el mecanismo de 05 (next-themes); FT-77 agrega la pantalla de Apariencia |
| FT-08 | FT-16, FT-27 [I, HT-7]; FT-41, FT-62 [M] | Producen elementos de atención que Inicio muestra; FT-08 es de HT-6 | La E2E de Inicio siembra esos elementos con operaciones (DP-17), sin usar sus pantallas; cada ficha que los produce agrega la E2E de punta a punta |
| FT-16 | FT-71 [M] | Push (Parte D) | Sin push: el cierre y su aviso en la app se prueban; el push lo agrega FT-71 |
| FT-19 | FT-40 [M] | Programadas (ola 2) | Sin programadas, el paso de las programadas no aparece; FT-40 agrega su caso |
| FT-34 | FT-73 [M] | Pantallas de formatos | Los formatos del BAC llegan por migración (TA-181, DT-12); FT-73 agrega su gestión |
| FT-35 | FT-41 [M] | Coincidencias con programadas (ola 2) | Sin programadas no hay coincidencias; FT-41 agrega el caso |
| FT-54 | FT-55 [M] | Condiciones del préstamo | El préstamo se crea con sus condiciones por OP-01 (FT-50); FT-55 agrega su edición |

**Esto toca 06** (las dependencias de 06 dicen "tienen que existir antes"). No lo cambié: lo planteo como **P8-19** (§25), porque cuatro fichas [I] dependen en 06 de fichas [M] y la prioridad del encargo pone las [I] primero.

### 19.8 Orden de la Parte C

- `orden` de 300 a 364, topológico: primero lo de HT-5, después HT-6 y después HT-7; dentro de cada grupo, por número.
- La ola 2 (600 a 628) sigue después de la Parte C, como fijó DT-16.

---

## 20. Bloque B4 — Web base

25 tareas, TA-200 a TA-224 (DT-02, P8-17). Construyen todo lo que 05 define fuera de las pantallas: estructura, tokens, componentes, patrón de escritura, marco, estados, autenticación, Route Handlers, arnés E2E, accesibilidad, rendimiento y service worker. Cada FE de 05 tiene una sola dueña (§23.1).

#### TA-200 Esqueleto de Next 16 en `apps/web`

```tarea
orden: 300
bloque: B4
hito: HT-5
depende: TA-004, TA-160, TA-158
tu: —
revision: normal
paralelo: no
tamano: prod=320 archivos=12 ca=0 migraciones=0 total=620
cubre: FE-01, FE-02, FE-03, FE-05, FE-59, BE-05, BE-06
pru: PRU-E2E-PWA-101
compartido: —
```

**Qué construir.**
- Next 16, React 19 y la estructura de carpetas de 05 §1.1 (FE-01), con `flujos/<flujo>/` y la regla de nombres de FE-59.
- Layouts de 05 §1.2 (FE-02): raíz, `(finn)` con el slot `@superpuesto`, `ingresar` y `sin-conexion`; convención de rutas de 05 §1.3 (FE-03) como regla de lint, sin crear páginas: cada ruta la crea su tarea dueña (DT-23); `(finn)/page.tsx` queda como página provisional «Inicio vacío» que reemplaza la tarea de FT-08.
- `next.config.ts` con `experimental.serverActions.bodySizeLimit = '3mb'` (BE-06) y sin caché de datos (05 §6.1); `servidor/accion.ts` y `servidor/acciones/<area>.ts` como único camino de escritura (BE-05).
- Regla de Server y Client Components de 05 §1.5 (FE-05) en el lint de TA-004.

**Leer.** 05 §1.1 a §1.5, §6.1; 04 §1.2, §2.2 (BE-05, BE-06).

**Archivos.** `apps/web/{package.json,next.config.ts,tsconfig.json}`, `apps/web/src/app/{layout,(finn)/layout,(finn)/page,ingresar/layout,sin-conexion/layout}.tsx`, `apps/web/src/servidor/{accion,sesion}.ts`.

**Pruebas primero.**
- **PRU-E2E-PWA-101** (nueva, DT-17): `next build` + `next start` sirven `/ingresar` sin sesión y `(finn)/` redirige a `/ingresar?volver=…`; `next.config.ts` no activa `cacheComponents` ni `staleTimes`.
- La prueba nueva con el reloj real (no necesita reloj de prueba).

**Comandos.** `pnpm --filter web build`; `pnpm test:e2e -- -g "PRU-E2E-PWA-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; `next build` sin advertencias de caché.

#### TA-201 Tokens, temas y fuentes

```tarea
orden: 301
bloque: B4
hito: HT-5
depende: TA-200
tu: —
revision: normal
paralelo: libre
tamano: prod=220 archivos=6 ca=0 migraciones=0 total=520
cubre: FE-40, FE-42, CF-10, CF-11, CF-12
pru: PRU-DOM-PWA-001
compartido: —
```

**Qué construir.**
- **Portar desde anexos:** `tokens.css` y `tokens.json` de `finn-entrega.zip` (DT-14), sin cambios, a `apps/web/src/app/`. Si el zip no llegó, la tarea queda `bloqueada`: su texto está en 06-identidad-visual §4 y §5, pero portarlo desde el `.md` requiere tu aprobación (P8-15, P8-19).
- Puente `@theme inline` de Tailwind v4 con los nombres sin prefijo (CF-11) y los roles tipográficos como `@utility` generadas desde `tokens.json`, con el rol `rotulo` (CF-12, FE-42).
- next-themes con `attribute="data-theme"` y valores `claro`/`oscuro` (CF-10); `viewport.themeColor` con los dos temas.
- Archivo (variable, `wght` y `wdth`) y Big Shoulders Display 700/800 con `next/font`, autohospedadas.

**Leer.** 05 §10.1 a §10.6; 06-identidad-visual §1 (fuentes), §4, §5; 06 §0.7 (CF-10 a CF-12).

**Archivos.** `apps/web/src/app/{tokens.css,globals.css,layout.tsx}`, `apps/web/tailwind.css`, `tools/pruebas/contraste.py` (portado del zip de la Fase 5).

**Pruebas primero.**
- PRU-DOM-PWA-001 (V5-23): `contraste.py` sobre `tokens.json` con los pares de 06-identidad-visual §1.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-PWA-001"`; `pnpm ci:local`.

**Terminada cuando.** El contraste pasa en los dos temas; ningún componente usa un color hexadecimal (lint L de TA-004).

#### TA-202 Íconos de la interfaz y glifos de estado

```tarea
orden: 302
bloque: B4
hito: HT-5
depende: TA-201
tu: —
revision: normal
paralelo: libre
tamano: prod=120 archivos=3 ca=0 migraciones=0 total=380
cubre: —
pru: PRU-CMP-VAL-101
compartido: —
```

**Qué construir.**
- **Portar desde anexos:** los 52 íconos y los 7 glifos de `iconos/` y `iconos/estados/` de `finn-entrega.zip` a `componentes/base/iconos/`, sin cambiar trazos. Sin el zip, la tarea queda `bloqueada` (P8-19).
- Componente `Icono` con el registro de nombres.

**Leer.** 06-identidad-visual §2 (AGENTES, tabla del paquete) y §3 (PANTALLAS §2.4); 05 §10.7.

**Archivos.** `apps/web/src/componentes/base/iconos/*` (portados), `apps/web/src/componentes/base/icono.tsx`.

**Pruebas primero.**
- **PRU-CMP-VAL-101** (nueva, DT-17): cada ícono del registro se dibuja con `currentColor`, tiene `aria-hidden` cuando acompaña un texto y nombre accesible cuando va solo; los 7 glifos de estado existen.
- La prueba nueva.

**Comandos.** `pnpm test:componentes -t "PRU-CMP-VAL-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con los 59 dibujos idénticos a su fuente.

#### TA-203 Recursos de marca y manifiesto

```tarea
orden: 303
bloque: B4
hito: HT-5
depende: TA-201
tu: —
revision: normal
paralelo: libre
tamano: prod=90 archivos=3 ca=0 migraciones=0 total=260
cubre: —
pru: PRU-E2E-PWA-102
compartido: —
```

**Qué construir.**
- **Portados** de `finn-marca.zip` a `public/marca/` los archivos de 05 §10.11 (símbolo, logotipo, íconos 192, 512, maskable, Apple, favicon e insignia), con sus nombres de destino.
- Si `finn-marca.zip` no llegó: los **recursos provisionales neutros** que 05 §10.11 ya aprueba (un cuadrado del color `accion` con la letra F), con la marca "provisional" en `public/marca/LEEME.md` (DT-24); se reemplazan sin tocar código.
- `app/manifest.ts` con los valores de 05 §8.2 y los colores de `tokens.json`.

**Leer.** 05 §8.2, §10.11; DT-24 de este documento.

**Archivos.** `apps/web/public/marca/*` (portados o provisionales), `apps/web/src/app/{manifest.ts,icon.svg,favicon.ico}`.

**Pruebas primero.**
- **PRU-E2E-PWA-102** (nueva, DT-17): `/manifest.webmanifest` tiene los campos de 05 §8.2, sus íconos responden 200 y el maskable mide 512 × 512.
- La prueba nueva.

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-PWA-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; el LEEME dice si los recursos son los de la marca o los provisionales.

#### TA-204 Componentes base I: botones, campos, selección y pastillas

```tarea
orden: 304
bloque: B4
hito: HT-5
depende: TA-202
tu: —
revision: normal
paralelo: libre
tamano: prod=380 archivos=10 ca=0 migraciones=0 total=900
cubre: FE-43, FE-47
pru: PRU-CMP-VAL-102
compartido: —
```

**Qué construir.**
- Primitivos de shadcn/ui en `components/ui` reestilizados con los tokens y la API de Finn en `componentes/base` (FE-43): Botón (principal, tonal, peligro, discreto, pastilla), Campo, Selección, Buscador, Pastillas, SelectorSegmentado (06-identidad-visual §3, 2.1 a 2.3).
- Tamaño táctil mínimo con `--tactil-minimo` (FE-47).

**Leer.** 05 §10.7, §10.9, §11.5; 06-identidad-visual §3 (PANTALLAS 2.1 a 2.3).

**Archivos.** `apps/web/src/components/ui/*`, `apps/web/src/componentes/base/{boton,campo,seleccion,pastillas,selector-segmentado}.tsx`.

**Pruebas primero.**
- **PRU-CMP-VAL-102** (nueva, DT-17): botones, campos, selección, pastillas de filtro y selector segmentado: nombre accesible, foco visible, estados deshabilitado con motivo y enviando, y objetivos de 44 × 44 px; axe sin violaciones en los dos temas.
- La prueba nueva.

**Comandos.** `pnpm test:componentes -t "PRU-CMP-VAL-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; las capturas K2 se comparan a mano en el informe.

#### TA-205 Componentes base II: superpuestos, avisos, resultados y vacíos

```tarea
orden: 305
bloque: B4
hito: HT-5
depende: TA-204
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=9 ca=0 migraciones=0 total=860
cubre: FE-04
pru: PRU-E2E-PRES-001, PRU-CMP-VAL-103
compartido: —
```

**Qué construir.**
- Superpuesto (hoja inferior en teléfono, panel lateral en computadora) y el slot `@superpuesto` con rutas interceptadas que también funcionan como página completa (FE-04).
- AvisoEnLinea, Resultado (`data-testid="resultado"`), Vacío y ErrorPantalla (06-identidad-visual §3, 2.13, 2.14, 2.17, 2.19).

**Leer.** 05 §1.4, §4.14, §7.2, §10.7; 06-identidad-visual §3 (2.13, 2.14, 2.17, 2.19).

**Archivos.** `apps/web/src/componentes/marco/{superpuesto,pagina-flujo}.tsx`, `apps/web/src/componentes/base/{aviso,resultado,vacio,error-pantalla}.tsx`, `apps/web/src/app/(finn)/@superpuesto/*`.

**Pruebas primero.**
- **PRU-CMP-VAL-103** (nueva, DT-17): hoja inferior y panel lateral con foco atrapado, Escape y velo; aviso en línea con tres señales; resultado de una acción con su enlace; vacío y error.
- PRU-E2E-PRES-001 (V5-06): un flujo corto abre interceptado sobre la pantalla y, recargando, como página completa.
- La prueba nueva.

**Comandos.** `pnpm test:componentes -t "PRU-CMP-VAL-103"`; `pnpm test:e2e -- -g "PRU-E2E-PRES-001"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-206 Formato, `Monto` e indicador de estado

```tarea
orden: 306
bloque: B4
hito: HT-5
depende: TA-204
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=6 ca=0 migraciones=0 total=760
cubre: FE-18, FE-41, FE-45
pru: PRU-DOM-VAL-005, PRU-CMP-VAL-005
compartido: CF-15 (signo U+2212 en la interfaz; dueño TA-158)
```

**Qué construir.**
- `formato/`: módulo único sin flotantes (FE-18), con U+2212 al mostrar y `-` en el CSV (CF-15).
- `Monto` (FE-45) con `data-centavos` y texto accesible "menos $X"; `IndicadorEstado` con color, glifo y nombre (FE-41, PF-2), con `data-estado`.

**Leer.** 05 §5.4, §10.3, §10.8 (`Monto`), §14.3; 06 §3.12.

**Archivos.** `apps/web/src/formato/*`, `apps/web/src/componentes/dominio/{monto,indicador-estado}.tsx`.

**Pruebas primero.**
- PRU-DOM-VAL-005 (V5-02) y PRU-CMP-VAL-005 (V5-25, árbol de accesibilidad del indicador por tipo).

**Comandos.** `pnpm test:unidad -t "PRU-DOM-VAL-005"`; `pnpm test:componentes -t "PRU-CMP-VAL-005"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-207 `EntradaMonto`, `EntradaFecha` y fechas de negocio

```tarea
orden: 307
bloque: B4
hito: HT-5
depende: TA-206
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=5 ca=0 migraciones=0 total=720
cubre: FE-17, FE-19
pru: PRU-DOM-VAL-004, PRU-PROP-VAL-001
compartido: —
```

**Qué construir.**
- `EntradaMonto` (FE-17): normalización, pegado, signo y vista previa, con la única suma permitida en el cliente (PF-3).
- `EntradaFecha` y fechas como `FechaLocal` con "hoy" del servidor (FE-19).

**Leer.** 05 §5.1 a §5.3, §5.5.

**Archivos.** `apps/web/src/componentes/formularios/{entrada-monto,entrada-fecha}.tsx`, `apps/web/src/formularios/normalizar-monto.ts`.

**Pruebas primero.**
- PRU-DOM-VAL-004 y PRU-PROP-VAL-001 (V5-01).

**Comandos.** `pnpm test:unidad -t "PRU-DOM-VAL-004|PRU-PROP-VAL-001"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-214 Autenticación web y `proxy.ts`

```tarea
orden: 308
bloque: B4
hito: HT-5
depende: TA-200, TA-161
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=340 archivos=8 ca=0 migraciones=0 total=820
cubre: AUTH-funciones, FE-36
pru: PRU-E2E-ACCESO-001
compartido: —
```

**Qué construir.**
- Funciones de 04 §12.2 (`estadoAcceso`, `ingresar`, `verificarFactor`, `salir`, `iniciarInscripcion`, `verificarInscripcion`) con `@supabase/ssr`, que implementan la interfaz de sesión de TA-161 (`getClaims()` para leer, `getUser()` para escribir).
- `proxy.ts` (04 §12.4) con el `matcher` que excluye `/serwist/`, `/sin-conexion`, `/api/` y los estáticos; tabla de redirecciones de FE-36.

**Leer.** 04 §12.1 a §12.5; 05 §9.1, §9.2, §3.6; 02 ADR-08.

**Archivos.** `apps/web/src/proxy.ts`, `apps/web/src/servidor/sesion.ts`, `packages/aplicacion/src/autenticacion/supabase.ts`.

**Pruebas primero.**
- PRU-E2E-ACCESO-001 (V5-16): sesión vencida en una consulta redirige con `volver`.

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-ACCESO-001"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa contra la pila local.

#### TA-215 Barrera 1 del reloj de prueba: `instrumentation.ts`

```tarea
orden: 309
bloque: B4
hito: HT-5
depende: TA-200, TA-160
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=80 archivos=2 ca=0 migraciones=0 total=420
cubre: CT-01-barrera1
pru: PRU-SEG-RELOJ-001
compartido: —
```

**Qué construir.**
- `instrumentation.ts`, `register()`: si `relojPermitido()` es falso y existe `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO`, registra el motivo y termina el proceso (07 §4.3, barrera 1).

**Leer.** 07 §4.2, §4.3; 04 §13.1.4.

**Archivos.** `apps/web/src/instrumentation.ts`, `apps/web/e2e/seguridad/reloj.e2e.ts`.

**Pruebas primero.**
- PRU-SEG-RELOJ-001: `next start` con el archivo en los 11 casos de 07 §4.3; los 9 prohibidos salen con 1.

**Comandos.** `pnpm test:e2e -- -g "PRU-SEG-RELOJ-001"`; `pnpm ci:local`.

**Terminada cuando.** Once de once casos.

#### TA-216 Route Handlers del webhook y de la tarea diaria

```tarea
orden: 310
bloque: B4
hito: HT-5
depende: TA-200, TA-177, TA-186
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=160 archivos=4 ca=0 migraciones=0 total=560
cubre: RH-sms, RH-tareas-diaria
pru: PRU-SEG-BAND-001, PRU-RH-BAND-101
compartido: —
```

**Qué construir.**
- `app/api/sms/route.ts` y `app/api/tareas/diaria/route.ts` como adaptadores de `@finn/aplicacion` (DT-19), y `vercel.json` con el cron diario de 04 §10.5.

**Leer.** 04 §8.1, §8.2, §10.1, §10.5; 02 N-01.

**Archivos.** `apps/web/src/app/api/{sms,tareas/diaria}/route.ts`, `apps/web/vercel.json`.

**Pruebas primero.**
- **PRU-RH-BAND-101** (nueva, DT-17): `/api/sms` traduce a HTTP lo que devuelve `recibirSms` (401, 5xx, 200) en las dos variantes de BE-61, procesa en `after()` y `/api/tareas/diaria` exige `CRON_SECRET`.
- PRU-SEG-BAND-001: sin token, con token viejo y con otra longitud, 401 sin guardar nada.
- La prueba nueva.

**Comandos.** `pnpm test:integracion -t "PRU-SEG-BAND-001|PRU-RH-BAND-101"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-219 Arnés E2E: pila local, usuario, semillas, tres relojes y candado

```tarea
orden: 311
bloque: B4
hito: HT-5
depende: TA-200, TA-188, TA-160, TA-012
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=380 archivos=10 ca=0 migraciones=0 total=900
cubre: FE-50, FE-51
pru: PRU-E2E-RELOJ-001, PRU-E2E-RELOJ-003
compartido: —
```

**Qué construir.**
- `playwright.config.ts` con los proyectos `movil`, `escritorio`, `zona-distinta` y `webkit-parcial` (FE-50, 07 §3.2); `webServer` con `next start`, `FINN_ENTORNO=pruebas` y `FINN_RELOJ_ARCHIVO`.
- Pila local mínima (`supabase start -x …`, 07 §5.3), usuario de prueba con TOTP (`otpauth`), `inicio-sesion.setup.ts`, `sembrar(estado)` por operaciones con el ejecutor `int` (DP-17), bloqueo de red, las ayudas de 05 §14.4 y los atributos de 05 §14.3 (FE-51).
- Los tres relojes alineados (DP-04): archivo del servidor, desfase de la base y `page.clock`.
- **Candado de E2E local (DT-22):** `pnpm test:e2e` toma `C:/finn/e2e.lock` y espera si otro agente lo tiene.
- El job `e2e` de `ci.yml` con la pila y las suites afectadas.

**Leer.** 05 §14 completo; 07 §3.2, §4.1, §5.3, §7.1, §12.4.

**Archivos.** `apps/web/playwright.config.ts`, `apps/web/e2e/{configuracion,ayudas}/*`, `tools/pruebas/e2e/{usuario,candado}.ts`, `.github/workflows/ci.yml`.

**Pruebas primero.**
- PRU-E2E-RELOJ-001 (el servidor sigue el archivo sin reiniciar) y 003 (`next start` corre con `NODE_ENV=production`).
- Control del candado: dos corridas simultáneas, la segunda espera.

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-RELOJ-00[13]"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan en Windows y en CI; la pila arranca en el job.

#### TA-210 Patrón de escritura: envío, resultado y doble envío

```tarea
orden: 312
bloque: B4
hito: HT-5
depende: TA-205, TA-207, TA-219
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=8 ca=0 migraciones=0 total=900
cubre: FE-07, FE-08, FE-09, FE-10, FE-11, FE-12, FE-16
pru: PRU-E2E-TX-001, PRU-E2E-TX-002, PRU-E2E-TX-003
compartido: —
```

**Qué construir.**
- `formularios/`: `useOperacion` y `useFormularioFinn` con React Hook Form y el resolvedor de Zod sobre los contratos de 04 (FE-16); confirmar por defecto y previsualizar en la lista cerrada (FE-07); id de creación perezoso (FE-08); `esperado` al abrir (FE-09); las categorías de `ResultadoAccion` con un reintento automático (FE-10); fallo de red como `INCIERTO` (FE-11); doble envío (FE-12).
- Flujo de prueba interno (`/__pruebas/eco`, solo con `FINN_ENTORNO=pruebas`) para estas pruebas.

**Leer.** 05 §4.1 a §4.9; 04 §2.2.2, §4.3, §4.6.

**Archivos.** `apps/web/src/formularios/*`, `apps/web/src/servidor/accion.ts`.

**Pruebas primero.**
- PRU-E2E-TX-001 (V5-03), 002 (V5-04) y 003 (V5-05).

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-TX-00[123]"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas pasan.

#### TA-211 Borradores, lecturas interactivas, un toque y versión nueva

```tarea
orden: 313
bloque: B4
hito: HT-5
depende: TA-210
tu: —
revision: normal
paralelo: libre
tamano: prod=320 archivos=7 ca=0 migraciones=0 total=820
cubre: FE-13, FE-14, FE-15, FE-24
pru: PRU-E2E-TX-004, PRU-E2E-TX-005, PRU-E2E-PWA-001
compartido: —
```

**Qué construir.**
- Borradores de flujos largos en `sessionStorage` (FE-14); lecturas interactivas (FE-15, CP-3); acciones de un toque con salida para revertir (FE-24); error propio "Hay una versión nueva" ante el desfase (FE-13).

**Leer.** 05 §4.10 a §4.14.

**Archivos.** `apps/web/src/formularios/{useBorrador,useLecturaInteractiva,useUnToque}.ts`, `apps/web/src/servidor/{lectura.ts,lecturas/interactivas.ts}`.

**Pruebas primero.**
- PRU-E2E-TX-004 (V5-07), 005 (V5-08) y PRU-E2E-PWA-001 (V5-09, nocturno con dos compilaciones).

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-TX-00[45]"`; `pnpm ci:local`.

**Terminada cuando.** Las tres pruebas pasan (la del desfase, en el nocturno).

#### TA-212 Marco y navegación

```tarea
orden: 314
bloque: B4
hito: HT-5
depende: TA-205, TA-203, TA-219
tu: —
revision: normal
paralelo: libre
tamano: prod=380 archivos=10 ca=0 migraciones=0 total=900
cubre: FE-06, FE-29, FE-30, FE-39
pru: PRU-E2E-PWA-005, PRU-E2E-PWA-009
compartido: —
```

**Qué construir.**
- Barra superior, barra inferior con la Bandeja al centro, barra lateral en computadora, hoja "Más secciones" y campana con contador (06-identidad-visual §3.1, §3.2), con los requisitos N1 a N8 (FE-29) y la sección activa por prefijo (FE-30).
- `ProveedorEncabezado` y `PublicarEncabezado` (FE-06), `EnlaceFinn` con `useLinkStatus` (FE-39), anunciador de rutas y foco.

**Leer.** 05 §1.6, §3.1 a §3.3, §6.4, §7.1 (FE-39); 06-identidad-visual §3 (3.1, 3.2, 11).

**Archivos.** `apps/web/src/componentes/marco/*`, `apps/web/src/componentes/navegacion/*`.

**Pruebas primero.**
- PRU-E2E-PWA-005 (V5-21) y PRU-E2E-PWA-009 (V5-28).

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-PWA-00[59]"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan en los proyectos `movil` y `escritorio`.

#### TA-213 Estados de pantalla, caché y parámetros

```tarea
orden: 315
bloque: B4
hito: HT-5
depende: TA-212
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=8 ca=0 migraciones=0 total=780
cubre: FE-20, FE-26, FE-27, FE-28, FE-33, FE-34
pru: PRU-E2E-PWA-002, PRU-E2E-PWA-003, PRU-E2E-PWA-004, PRU-E2E-PWA-006
compartido: —
```

**Qué construir.**
- `consultar()` con la traducción de errores y `idError` como `digest` (FE-28); `error.tsx`, `not-found.tsx` y `loading.tsx` por segmento (FE-33); tres clases de vacío (FE-34).
- Una consulta por página (FE-26) y conversión de parámetros de búsqueda (FE-27); sin caché de números en el cliente (FE-20).

**Leer.** 05 §2.1, §2.2, §6.1, §6.2, §7.1 a §7.3.

**Archivos.** `apps/web/src/servidor/consultar.ts`, `apps/web/src/app/(finn)/{error,not-found,loading}.tsx`, `apps/web/src/componentes/navegacion/parametros.ts`.

**Pruebas primero.**
- PRU-E2E-PWA-002 (V5-15), 003 (V5-17), 004 (V5-19) y 006 (V5-22).

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-PWA-00[2346]"`; `pnpm ci:local`.

**Terminada cuando.** Las cuatro pruebas pasan.

#### TA-224 Catálogo de textos de la interfaz

```tarea
orden: 316
bloque: B4
hito: HT-5
depende: TA-200
tu: —
revision: normal
paralelo: libre
tamano: prod=260 archivos=4 ca=0 migraciones=0 total=520
cubre: FE-23
pru: PRU-DOM-VAL-102
compartido: —
```

**Qué construir.**
- `textos/` con los dos catálogos de 05 §12.1 (interfaz y glosario), los textos de autenticación de 05 §9.7 y los términos de 05 §12.3; cada ficha agrega los suyos.

**Leer.** 05 §12; 04 §7.10.

**Archivos.** `apps/web/src/textos/*`.

**Pruebas primero.**
- **PRU-DOM-VAL-102** (nueva, DT-17): el catálogo de textos no tiene claves duplicadas ni textos vacíos, usa voseo en los verbos del glosario y cada mensaje de 05 §9.7 existe.
- La prueba nueva.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-VAL-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa.

#### TA-208 Componentes de dominio I: billete, filas y selector de período

```tarea
orden: 320
bloque: B4
hito: HT-6
depende: TA-206
tu: —
revision: normal
paralelo: libre
tamano: prod=380 archivos=7 ca=0 migraciones=0 total=900
cubre: FE-31, CF-13
pru: PRU-CMP-PRES-101
compartido: CF-25 (proporciones de las barras; dueño TA-136)
```

**Qué construir.**
- Billete "Listo para asignar" y su franja, FilaCategoria, FilaPagoTarjeta, BarraGastado, FilaTransaccion, SelectorPeriodo con enlaces y el período activo sin parámetro (FE-31), registrados en 05 §10.8 (CF-13).
- Los datos de proporciones salen del servidor (CF-25); el componente no calcula montos (PF-3).

**Leer.** 05 §3.4, §10.8; 06-identidad-visual §3 (2.5 a 2.8, 2.15, 2.16); 06 §5.4, §5.8.

**Archivos.** `apps/web/src/componentes/dominio/{billete,fila-categoria,fila-pago,barra-gastado,fila-transaccion,selector-periodo}.tsx`.

**Pruebas primero.**
- **PRU-CMP-PRES-101** (nueva, DT-17): billete de LPA en sus tres estados, fila de categoría con barra de gastado sobre asignado y sus indicadores, fila de pago de tarjeta, fila de transacción y selector de período con sus cuatro estados.
- La prueba nueva.

**Comandos.** `pnpm test:componentes -t "PRU-CMP-PRES-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa en los dos temas.

#### TA-209 Componentes de dominio II: cuentas, bandeja y gráficos

```tarea
orden: 321
bloque: B4
hito: HT-6
depende: TA-206
tu: —
revision: normal
paralelo: libre
tamano: prod=380 archivos=8 ca=0 migraciones=0 total=900
cubre: FE-44
pru: PRU-CMP-CTA-101
compartido: —
```

**Qué construir.**
- Componentes de 06-identidad-visual §3 (2.9 a 2.12, 2.18): billetera con su botón alternativo al toque (sin gesto obligatorio), identidad de cuenta, posición neta, fila de la bandeja.
- Gráficos como Server Components con d3-scale y d3-shape, nunca d3 en el cliente (FE-44), con `role="img"` y tabla equivalente.

**Leer.** 05 §10.8 (gráficos), §11.3; 06-identidad-visual §3 (2.9 a 2.12, 2.18).

**Archivos.** `apps/web/src/componentes/dominio/{billetera,identidad-cuenta,posicion-neta,movimiento-bandeja}.tsx`, `apps/web/src/componentes/graficos/*`.

**Pruebas primero.**
- **PRU-CMP-CTA-101** (nueva, DT-17): tarjeta de crédito y billetera, identidad por tipo de cuenta, posición neta, fila compacta de la bandeja con sus siete estados, gráfico de barras e historial con su tabla equivalente y el selector Gráfico / Tabla.
- La prueba nueva.

**Comandos.** `pnpm test:componentes -t "PRU-CMP-CTA-101"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa en los dos temas.

#### TA-217 Route Handlers del respaldo, la exportación y las acciones de notificación

```tarea
orden: 322
bloque: B4
hito: HT-6
depende: TA-216, TA-187
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=180 archivos=4 ca=0 migraciones=0 total=560
cubre: RH-respaldo, RH-exportar, RH-notificaciones-accion
pru: PRU-SEG-NOTIF-001
compartido: —
```

**Qué construir.**
- `/api/respaldo/[evento]` (OPT-09 con `RESPALDO_SECRET`), `/api/exportar/[formato]` (OPT-08, sesión AAL2; la función llega en la ola 2: hasta entonces responde 404 y la ruta queda probada solo en su autorización) y `/api/notificaciones/accion` con `Origin`, `X-Finn-Accion` y AAL2 con `getUser()` (BE-54, CH-06).

**Leer.** 04 §11.5, §16, §3.10 (OPT-08, OPT-09); CH-06.

**Archivos.** `apps/web/src/app/api/{respaldo/[evento],exportar/[formato],notificaciones/accion}/route.ts`.

**Pruebas primero.**
- PRU-SEG-NOTIF-001 (CH-06): sin `Origin` de la app, sin `X-Finn-Accion` o sin AAL2, rechazada.

**Comandos.** `pnpm test:integracion -t "PRU-SEG-NOTIF-001"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa con los tres casos de rechazo y uno aceptado.

#### TA-218 AAL2 en toda acción y ruta (DP-22)

```tarea
orden: 323
bloque: B4
hito: HT-6
depende: TA-214, TA-217
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=140 archivos=3 ca=0 migraciones=0 total=520
cubre: DP-22
pru: PRU-SEG-ACCESO-001, PRU-SEG-ACCESO-002
compartido: —
```

**Qué construir.**
- PRU-SEG-ACCESO-001 recorre el registro de Server Actions de `servidor/acciones/` y el árbol de `app/api` y falla si una entrada no exige AAL2 o su token; PRU-SEG-ACCESO-002 recorre el árbol de rutas real de `app/(finn)` en tiempo de prueba. Así, cada ficha que agrega una ruta o una acción queda cubierta sin tocar estas pruebas.

**Leer.** 07 §19.1 (DP-22); 04 §2.2.5 (BE-07), §12.3.

**Archivos.** `apps/web/src/servidor/acciones/indice.ts`, `apps/web/e2e/seguridad/acceso.e2e.ts`, `apps/web/src/servidor/acceso.int.test.ts`.

**Pruebas primero.**
- PRU-SEG-ACCESO-001 y 002 con su control: una acción de prueba sin `autorizar()` las hace fallar.

**Comandos.** `pnpm test:integracion -t "PRU-SEG-ACCESO-001"`; `pnpm test:e2e -- -g "PRU-SEG-ACCESO-002"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas y el control.

#### TA-220 Refresco automático y agenda de medianoche

```tarea
orden: 324
bloque: B4
hito: HT-6
depende: TA-212, TA-219
tu: —
revision: normal
paralelo: libre
tamano: prod=200 archivos=4 ca=0 migraciones=0 total=560
cubre: FE-21, FE-35
pru: PRU-DOM-RELOJ-001, PRU-E2E-RELOJ-002
compartido: —
```

**Qué construir.**
- `useRefrescoAutomatico` (volver, reconexión, medianoche, atrás y adelante) y `useConexion` con el comportamiento sin conexión de FE-35.

**Leer.** 05 §6.5 a §6.8, §7.4.

**Archivos.** `apps/web/src/cliente/{useRefrescoAutomatico,useConexion,reloj}.ts`.

**Pruebas primero.**
- PRU-DOM-RELOJ-001 y PRU-E2E-RELOJ-002 (V5-10): la pantalla abierta pasa al día siguiente a medianoche sin recargar.

**Comandos.** `pnpm test:unidad -t "PRU-DOM-RELOJ-001"`; `pnpm test:e2e -- -g "PRU-E2E-RELOJ-002"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan.

#### TA-221 Accesibilidad automática por ruta

```tarea
orden: 325
bloque: B4
hito: HT-6
depende: TA-219, TA-212
tu: —
revision: normal
paralelo: libre
tamano: prod=160 archivos=4 ca=0 migraciones=0 total=520
cubre: FE-46
pru: PRU-E2E-PWA-007, PRU-E2E-PWA-008
compartido: —
```

**Qué construir.**
- Suite `accesibilidad/` que recorre el árbol de rutas real: axe en los dos temas y los dos tamaños, táctil, reflujo a 320 px y movimiento reducido (05 §11.10). Como ACCESO-002, se extiende sola con cada ruta nueva.

**Leer.** 05 §11.10, §14.4; 07 §19.8.

**Archivos.** `apps/web/e2e/accesibilidad/*`.

**Pruebas primero.**
- PRU-E2E-PWA-007 (V5-24) y PRU-E2E-PWA-008 (movimiento reducido, V5-27).

**Comandos.** `pnpm test:e2e -- -g "PRU-E2E-PWA-00[78]"`; `pnpm ci:local`.

**Terminada cuando.** Las dos pruebas pasan sobre las rutas existentes.

#### TA-222 Presupuestos de rendimiento en CI

```tarea
orden: 326
bloque: B4
hito: HT-6
depende: TA-219
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=200 archivos=5 ca=0 migraciones=0 total=560
cubre: FE-48, FE-49
pru: PRU-REN-PWA-001, PRU-REN-PWA-002, PRU-REN-PWA-003, PRU-REN-PWA-004, PRU-REN-TX-001
compartido: —
```

**Qué construir.**
- Medición de bytes en `e2e` de `main` (bloquea siempre) y Lighthouse CI e INP en el nocturno con la regla de persistencia de 07 §6.6 (FE-48); reglas de FE-49.

**Leer.** 05 §13; 07 §6.6.

**Archivos.** `apps/web/e2e/rendimiento/*`, `lighthouserc.json`, `.github/workflows/{ci,nocturno}.yml`.

**Pruebas primero.**
- PRU-REN-PWA-001 (V5-13, V5-35), 002 (V5-20, V5-34), 003 (V5-26), 004 (V5-27) y PRU-REN-TX-001 (V5-11).

**Comandos.** `pnpm test:e2e -- -g "PRU-REN-PWA-00[12]"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas de bytes pasan en `main`; las de tiempo corren en el nocturno.

#### TA-223 Service worker, `/sin-conexion` e instalación

```tarea
orden: 327
bloque: B4
hito: HT-6
depende: TA-203, TA-220
tu: —
revision: normal
paralelo: libre
tamano: prod=300 archivos=7 ca=0 migraciones=0 total=760
cubre: FE-52, FE-53, FE-54, FE-55, FE-56, RUTA-/sin-conexion
pru: PRU-SW-PWA-001, PRU-SW-PWA-002, PRU-SW-PWA-003, PRU-SW-PWA-004
compartido: —
```

**Qué construir.**
- `src/sw/sw.ts` con Serwist: solo precache de estáticos y `/sin-conexion` (FE-53); `app/serwist/[path]/route.ts` estático (FE-52, CP-17); registro propio y actualización sin `skipWaiting` (FE-54, FE-55); sin conexión no se navega (FE-56).
- El push (FE-57) y la instalación a pedido (FE-58) son de la Parte D.

**Leer.** 05 §8.1, §8.3 a §8.5, §8.8.

**Archivos.** `apps/web/src/sw/sw.ts`, `apps/web/src/app/{serwist/[path]/route.ts,sin-conexion/page.tsx}`, `apps/web/src/componentes/marco/registro-service-worker.tsx`.

**Pruebas primero.**
- PRU-SW-PWA-001 (V5-29), 002 (V5-30), 003 (V5-31) y 004 (V5-33, nocturno).

**Comandos.** `pnpm test:e2e -- -g "PRU-SW-PWA"`; `pnpm ci:local`.

**Terminada cuando.** Las pruebas pasan; `/serwist/sw.js.map` no existe.


---

## 21. Bloque B5 — Operación (Parte C)

Continúa §15. TA-260 a TA-263; TA-254 a TA-259 quedan libres en el rango.

#### TA-260 Job `desplegar` con barrera 1b y política de patrones

```tarea
orden: 317
bloque: B5
hito: HT-5
depende: TA-219, TA-215, TA-176, TA-181, TA-051, TA-056, TA-253
tu: TU-09, TU-12
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=4 ca=0 migraciones=0 total=520
cubre: WF-desplegar, CT-01-barrera1b
pru: PRU-SEG-RELOJ-006
compartido: —
```

**Qué construir.**
- Job `desplegar` de `ci.yml` (solo `main`, `needs` sobre `rapido`, `integracion`, `e2e` y `cierre`): `ci:politica-patrones`, `prisma migrate deploy` con `DIRECT_URL`, C5, C6 y R15 con `finn_respaldo`, barrera 1b y `vercel deploy --prod` con el token de CI (02 ADR-10, 03 §11.7).
- `tools/ci/barrera-1b.mjs`: `vercel env ls` de los tres entornos; falla si aparece `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO`. Es el mismo script del despliegue de emergencia (07 §31.5).
- Si C5 o C6 fallan después de migrar: no despliega y el job falla (CH-02).

**Leer.** 03 §11.7; 04 §14.1, §15.2; 07 §4.3 (barrera 1b), §6.1, §31.5; CH-02.

**Archivos.** `.github/workflows/ci.yml`, `tools/ci/{barrera-1b,desplegar}.mjs`.

**Pruebas primero.**
- PRU-SEG-RELOJ-006 con una salida de `vercel env ls` grabada en un archivo de prueba, con y sin la variable.

**Comandos.** `pnpm test:unidad -t "PRU-SEG-RELOJ-006"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; el primer `desplegar` de `main` en verde cumple HT-5 junto con TU-09, TU-12 y TA-181.

#### TA-261 Workflow `respaldo.yml`

```tarea
orden: 328
bloque: B5
hito: HT-6
depende: TA-251, TA-217, TA-260
tu: TU-11, TU-12
revision: obligatoria
paralelo: libre
tamano: prod=160 archivos=3 ca=0 migraciones=0 total=420
cubre: WF-respaldo
pru: PRU-SEG-OPER-104
compartido: —
```

**Qué construir.**
- `respaldo.yml` (ADR-22): `respaldar.mjs` como `finn_respaldo`, cifrado con `age`, subida a R2 (`diarios/` y el primero del mes `mensuales/`), C5, C6 y R15 contra producción y OPT-09 con `RESPALDO_SECRET`. Fuera de todo recorte (07 §32.3).

**Leer.** 02 ADR-22; 04 §16.1 a §16.3; 07 §6.1, §32.3.

**Archivos.** `.github/workflows/respaldo.yml`, `tools/respaldo/subir.mjs`.

**Pruebas primero.**
- **PRU-SEG-OPER-104** (nueva, DT-17): `respaldo.yml` no lee el modo de M4 ni tiene condición de ahorro, corre a las 07:30 UTC y llama a OPT-09 solo después de subir el volcado.
- La prueba nueva (lectura del YAML, como PRU-SEG-OPER-002).

**Comandos.** `pnpm test:unidad -t "PRU-SEG-OPER-104"`; `pnpm ci:local`.

**Terminada cuando.** La prueba pasa; una ejecución manual (`workflow_dispatch`) deja el primer respaldo en R2 y el evento en Diagnóstico.

#### TA-262 Control de dinero diario (07 §31.1)

```tarea
orden: 329
bloque: B5
hito: HT-6
depende: TA-261, TA-152, TA-109
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=160 archivos=3 ca=0 migraciones=0 total=520
cubre: DP-29
pru: PRU-RES-RESP-102
compartido: —
```

**Qué construir.**
- Paso final de `respaldo.yml`: `tools/respaldo/control-dinero.ts` con los invariantes 1 a 4, 6, 9 a 12, 17, 22, 24, 26 y 28 y los conteos por tabla; el artefacto no tiene montos; si algo falla, el job falla (correo de GitHub).

**Leer.** 07 §31.1, §36.1 (DP-29).

**Archivos.** `tools/respaldo/control-dinero.ts`, `.github/workflows/respaldo.yml`.

**Pruebas primero.**
- **PRU-RES-RESP-102** (nueva, DT-17): el control de dinero carga los hechos con `finn_respaldo`, verifica los invariantes calculables y los conteos contra el día anterior, guarda un artefacto sin montos y falla con un invariante roto sembrado.
- La prueba nueva, con un control: una base con una línea que rompe inv. 6 hace fallar el paso.

**Comandos.** `pnpm test:respaldo -t "PRU-RES-RESP-102"`; `pnpm ci:local`.

**Terminada cuando.** La prueba y su control.

#### TA-263 Workflow `restauracion.yml` (mensual y semanal de CT-09)

```tarea
orden: 350
bloque: B5
hito: HT-7
depende: TA-261
tu: TU-11, TU-12
revision: obligatoria
paralelo: libre
tamano: prod=120 archivos=2 ca=0 migraciones=0 total=360
cubre: WF-restauracion, CT-09
pru: —
compartido: —
```

**Qué construir.**
- `restauracion.yml` con `restaurar.sh` sobre el último respaldo, `schedule` mensual y el semanal temporal de las 8 semanas (CT-09), que se quita en TU-18.
- El procedimiento de emergencia de 07 §31.5 queda con sus scripts (`ci:<job>` y `barrera-1b.mjs`, TA-260); `pr:mergear` lista un despliegue de emergencia pendiente de corrida completa.

**Leer.** 02 ADR-22 y Enmiendas (CT-09); 04 §16.4; 07 §31.5, §32.3.

**Archivos.** `.github/workflows/restauracion.yml`, `tools/plan/mergear.ts` (aviso del despliegue de emergencia).

**Pruebas primero.**
- La prueba nueva de TA-261 cubre también este YAML (no lee el modo de M4).

**Comandos.** `pnpm ci:local`; una ejecución manual.

**Terminada cuando.** Una ejecución manual restaura el respaldo de TA-261 sin diferencias.


---

## 22. Bloque B6 — Fichas [I]

### 22.1 Cómo se arman las tareas

- **Una tarea por ficha**; las de más de 10 CA se parten en dos (FT-04, FT-08, FT-09, FT-21, FT-34, FT-35). FT-22 y FT-23 (3 CA cada una, mismo formulario de registro) van juntas.
- Cada tarea cubre sus CA y, la primera de cada ficha, las rutas que posee (DT-23) y los FE y CF de la ficha. La última pasa la ficha a `terminada` (07 §27).
- Las pruebas de dominio e integración de la ficha (ESC, INV, CB, AV, operaciones y consultas) ya existen en B2 y B3. B6 agrega las de los CA en el nivel de 07 §17 (DT-21), la E2E de cada pantalla y sus manuales.
- `revision: normal` en todas (DT-20). La autorización la cuida PRU-SEG-ACCESO-001 (TA-218) y la accesibilidad la suite de TA-221, que recorren las acciones y rutas reales y se extienden solas.

### 22.2 Fichas, tareas y rutas

| Ficha | Título | CA | Hito | Tareas | Rutas que posee |
|---|---|---|---|---|---|
| FT-01 | Ingresar con contraseña y TOTP | 7 | HT-5 | TA-280 | `/ingresar`, `/ingresar/verificar` |
| FT-02 | Inscribir el primer factor TOTP | 5 | HT-5 | TA-281 | `/ingresar/inscribir`, `/ajustes/seguridad/factores/nuevo` |
| FT-03 | Conectar MacroDroid (token del webhook) | 5 | HT-6 | TA-284 | `/ajustes/webhook` |
| FT-04 | Primer uso guiado, con la plantilla de categorías | 13 | HT-6 | TA-285, TA-286 | `/ajustes`, `/presupuesto/estructura/plantilla` |
| FT-08 | Inicio: resumen diario y "¿algo necesita mi atención?" | 12 | HT-6 | TA-298, TA-299 | `/`, `/presupuesto/listo-para-asignar` |
| FT-09 | Presupuesto del período: filtros, períodos cerrados y futuros | 13 | HT-6 | TA-287, TA-288 | `/presupuesto` |
| FT-10 | Asignar y desasignar | 8 | HT-6 | TA-289 | `/presupuesto/asignar/[categoriaId]` |
| FT-11 | Mover dinero entre categorías | 4 | HT-7 | TA-302 | `/presupuesto/mover` |
| FT-14 | Detalle de categoría: reparto, calendario e historial | 10 | HT-6 | TA-290 | `/presupuesto/categorias/[categoriaId]` |
| FT-16 | Sobregiros y cierre automático del período | 7 | HT-7 | TA-304 | — |
| FT-17 | Metas | 7 | HT-7 | TA-305 | `/metas`, `/metas/[metaId]`, `/metas/nueva` |
| FT-18 | Grupos y categorías: crear, renombrar, reordenar y eliminar | 6 | HT-6 | TA-283 | `/presupuesto/estructura`, `/presupuesto/estructura/categorias/[categoriaId]`, `/presupuesto/estructura/categorias/nueva`, `/presupuesto/estructura/grupos/[grupoId]`, `/presupuesto/estructura/grupos/nuevo` |
| FT-19 | Archivar y desarchivar categorías, y sacar el dinero de una archivada | 7 | HT-7 | TA-306 | `/presupuesto/categorias/[categoriaId]/archivar`, `/presupuesto/categorias/[categoriaId]/sacar` |
| FT-21 | Registrar gasto con división y por cobrar | 12 | HT-6 | TA-292, TA-293 | `/registrar`, `/registrar/gasto` |
| FT-22 | Registrar ingreso | 3 | HT-7 | TA-307 | `/registrar/[tipo]` |
| FT-23 | Transferencia entre cuentas propias | 3 | HT-7 | TA-307 | `/registrar/[tipo]` |
| FT-24 | Actividad con búsqueda y filtros | 6 | HT-7 | TA-308 | `/actividad` |
| FT-25 | Detalle y edición completa | 8 | HT-7 | TA-309 | `/actividad/[transaccionId]`, `/actividad/[transaccionId]/editar` |
| FT-26 | Eliminar y cambiar el estado bancario | 6 | HT-7 | TA-310 | `/actividad/[transaccionId]/eliminar`, `/actividad/[transaccionId]/estado` |
| FT-27 | Transacción olvidada y cambios retroactivos | 7 | HT-7 | TA-311 | — |
| FT-29 | Categoría de pago y "te falta reservar" | 8 | HT-6 | TA-291 | — |
| FT-30 | Pagar tarjeta con desglose y pago excedente | 7 | HT-7 | TA-303 | `/cuentas/[cuentaId]/pagar` |
| FT-34 | Recepción y procesamiento de SMS | 14 | HT-6 | TA-294, TA-295 | `/bandeja` |
| FT-35 | Revisar y aprobar: un toque, flujo completo y recordar regla | 11 | HT-6 | TA-296, TA-297 | `/bandeja/[movimientoId]` |
| FT-37 | Descartar, restaurar, duplicados y coincidencias | 6 | HT-6 | TA-300 | — |
| FT-38 | SMS no reconocidos y con error | 6 | HT-6 | TA-301 | — |
| FT-50 | Crear cuenta con saldo inicial | 7 | HT-6 | TA-282 | `/cuentas/nueva` |
| FT-51 | Cuentas y posición neta | 8 | HT-7 | TA-312 | `/cuentas` |
| FT-52 | Detalle de cuenta | 5 | HT-7 | TA-313 | `/cuentas/[cuentaId]` |
| FT-53 | Editar, ordenar, archivar, desarchivar y eliminar cuentas | 7 | HT-7 | TA-314 | `/cuentas/[cuentaId]/archivar`, `/cuentas/[cuentaId]/editar`, `/cuentas/[cuentaId]/eliminar`, `/cuentas/ordenar` |
| FT-54 | Pagar cuota o abonar a capital | 5 | HT-7 | TA-315 | `/cuentas/[cuentaId]/cuota` |

36 tareas, TA-280 a TA-315, 233 CA (las 31 fichas [I]).

### 22.3 Fichas de HT-5

#### TA-280 FT-01 Ingresar con contraseña y TOTP

```tarea
orden: 318
bloque: B6
hito: HT-5
depende: TA-214, TA-212, TA-224, TA-210, TA-219
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-01.1, CA-01.2, CA-01.3, CA-01.4, CA-01.5, CA-01.6, CA-01.7, RUTA-/ingresar, RUTA-/ingresar/verificar, FE-38
pru: —
compartido: —
fichas: FT-01
```

**Qué construir.**
- FT-01: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-01.1 a CA-01.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/ingresar`, `/ingresar/verificar`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-01 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-01 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-01` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-281 FT-02 Inscribir el primer factor TOTP

```tarea
orden: 319
bloque: B6
hito: HT-5
depende: TA-280, TA-210, TA-212, TA-219, TA-224
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-02.1, CA-02.2, CA-02.3, CA-02.4, CA-02.5, RUTA-/ingresar/inscribir, RUTA-/ajustes/seguridad/factores/nuevo, FE-37
pru: —
compartido: —
fichas: FT-02
```

**Qué construir.**
- FT-02: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-02.1 a CA-02.5, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/ingresar/inscribir`, `/ajustes/seguridad/factores/nuevo`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-02 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-02.5 (manual) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).

**Leer.** 06 FT-02 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-02` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.


### 22.4 Fichas de HT-6

#### TA-282 FT-50 Crear cuenta con saldo inicial

```tarea
orden: 330
bloque: B6
hito: HT-6
depende: TA-162, TA-173, TA-210, TA-212, TA-219, TA-224, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-50.1, CA-50.2, CA-50.3, CA-50.4, CA-50.5, CA-50.6, CA-50.7, RUTA-/cuentas/nueva
pru: —
compartido: —
fichas: FT-50
```

**Qué construir.**
- FT-50: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-50.1 a CA-50.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas/nueva`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-50 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-50 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-01, ESC-02, AV-01, AV-07, CB-14, CB-28 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-50` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-283 FT-18 Grupos y categorías: crear, renombrar, reordenar y eliminar

```tarea
orden: 331
bloque: B6
hito: HT-6
depende: TA-163, TA-170, TA-210, TA-212, TA-219, TA-224, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-18.1, CA-18.2, CA-18.3, CA-18.4, CA-18.5, CA-18.6, RUTA-/presupuesto/estructura, RUTA-/presupuesto/estructura/categorias/[categoriaId], RUTA-/presupuesto/estructura/categorias/nueva, RUTA-/presupuesto/estructura/grupos/[grupoId], RUTA-/presupuesto/estructura/grupos/nuevo
pru: —
compartido: —
fichas: FT-18
```

**Qué construir.**
- FT-18: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-18.1 a CA-18.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/estructura`, `/presupuesto/estructura/categorias/[categoriaId]`, `/presupuesto/estructura/categorias/nueva`, `/presupuesto/estructura/grupos/[grupoId]`, `/presupuesto/estructura/grupos/nuevo`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-18 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-18 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-18` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-284 FT-03 Conectar MacroDroid (token del webhook)

```tarea
orden: 332
bloque: B6
hito: HT-6
depende: TA-216, TA-172, TA-213, TA-210, TA-212, TA-219, TA-224, TA-280, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-03.1, CA-03.2, CA-03.3, CA-03.4, CA-03.5, RUTA-/ajustes/webhook
pru: —
compartido: —
fichas: FT-03
pendiente: CA-03.3>FT-34
```

**Qué construir.**
- FT-03: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-03.1 a CA-03.5, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/ajustes/webhook`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-03 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-03.5 (manual) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-03.3 (lo completa FT-34). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-03 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-03` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-285 FT-04 Primer uso guiado, con la plantilla de categorías (1 de 2)

```tarea
orden: 333
bloque: B6
hito: HT-6
depende: TA-169, TA-170, TA-163, TA-213, TA-208, TA-210, TA-212, TA-219, TA-224, TA-280, TA-281, TA-284, TA-283, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-04.1, CA-04.2, CA-04.3, CA-04.4, CA-04.5, CA-04.6, CA-04.7, RUTA-/ajustes, RUTA-/presupuesto/estructura/plantilla, CF-08
pru: PRU-REN-INICIO-001
compartido: —
fichas: FT-04
```

**Qué construir.**
- FT-04: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-04.1 a CA-04.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/ajustes`, `/presupuesto/estructura/plantilla`.

**Leer.** 06 FT-04 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- PRU-REN-INICIO-001 (07).

**Comandos.** `pnpm pruebas:ft FT-04` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-286 FT-04 Primer uso guiado, con la plantilla de categorías (2 de 2)

```tarea
orden: 334
bloque: B6
hito: HT-6
depende: TA-169, TA-170, TA-163, TA-213, TA-208, TA-285
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-04.8, CA-04.9, CA-04.10, CA-04.11, CA-04.12, CA-04.13
pru: —
compartido: —
fichas: FT-04
```

**Qué construir.**
- FT-04: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-04.8 a CA-04.13, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-04 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-04 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-01, AV-07 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-04` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-287 FT-09 Presupuesto del período: filtros, períodos cerrados y futuros (1 de 2)

```tarea
orden: 335
bloque: B6
hito: HT-6
depende: TA-169, TA-208, TA-213, TA-210, TA-212, TA-219, TA-224, TA-283, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-09.1, CA-09.2, CA-09.3, CA-09.4, CA-09.5, CA-09.6, CA-09.7, RUTA-/presupuesto
pru: —
compartido: —
fichas: FT-09
```

**Qué construir.**
- FT-09: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-09.1 a CA-09.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto`.

**Leer.** 06 FT-09 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-09` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-288 FT-09 Presupuesto del período: filtros, períodos cerrados y futuros (2 de 2)

```tarea
orden: 336
bloque: B6
hito: HT-6
depende: TA-169, TA-208, TA-213, TA-287, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-09.8, CA-09.9, CA-09.10, CA-09.11, CA-09.12, CA-09.13
pru: —
compartido: —
fichas: FT-09
pendiente: CA-09.11>FT-28
```

**Qué construir.**
- FT-09: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-09.8 a CA-09.13, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-09 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-09.11 (lo completa FT-28). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-09 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-05, ESC-44, ESC-49, AV-02, AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, AV-14, AV-17, AV-20 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-09` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-289 FT-10 Asignar y desasignar

```tarea
orden: 337
bloque: B6
hito: HT-6
depende: TA-164, TA-174, TA-210, TA-212, TA-219, TA-224, TA-288
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5, CA-10.6, CA-10.7, CA-10.8, RUTA-/presupuesto/asignar/[categoriaId]
pru: —
compartido: —
fichas: FT-10
```

**Qué construir.**
- FT-10: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-10.1 a CA-10.8, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/asignar/[categoriaId]`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-10 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-10 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-03, ESC-06, ESC-07, AV-11, AV-20, CB-09, CB-10, CB-25 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-10` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-290 FT-14 Detalle de categoría: reparto, calendario e historial

```tarea
orden: 338
bloque: B6
hito: HT-6
depende: TA-170, TA-209, TA-210, TA-212, TA-219, TA-224, TA-288, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=10 migraciones=0 total=1000
cubre: CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5, CA-14.6, CA-14.7, CA-14.8, CA-14.9, CA-14.10, RUTA-/presupuesto/categorias/[categoriaId]
pru: —
compartido: —
fichas: FT-14
pendiente: CA-14.8>FT-28
```

**Qué construir.**
- FT-14: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-14.1 a CA-14.10, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/categorias/[categoriaId]`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-14 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-14.8 (lo completa FT-28). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-14 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-17, ESC-19, AV-02, AV-03, AV-14, AV-17 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-14` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-291 FT-29 Categoría de pago y "te falta reservar"

```tarea
orden: 339
bloque: B6
hito: HT-6
depende: TA-169, TA-170, TA-208, TA-210, TA-212, TA-219, TA-224, TA-288, TA-282, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-29.1, CA-29.2, CA-29.3, CA-29.4, CA-29.5, CA-29.6, CA-29.7, CA-29.8
pru: —
compartido: —
fichas: FT-29
pendiente: CA-29.4>FT-46
```

**Qué construir.**
- FT-29: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-29.1 a CA-29.8, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-29 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-29.4 (lo completa FT-46). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-29 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-01, ESC-04, ESC-05, ESC-11, ESC-48, AV-03, AV-04, AV-05, AV-06, AV-07 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-29` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-292 FT-21 Registrar gasto con división y por cobrar (1 de 2)

```tarea
orden: 340
bloque: B6
hito: HT-6
depende: TA-165, TA-173, TA-211, TA-207, TA-210, TA-212, TA-219, TA-224, TA-283, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-21.1, CA-21.2, CA-21.3, CA-21.4, CA-21.5, CA-21.6, RUTA-/registrar, RUTA-/registrar/gasto
pru: —
compartido: —
fichas: FT-21
```

**Qué construir.**
- FT-21: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-21.1 a CA-21.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/registrar`, `/registrar/gasto`.

**Leer.** 06 FT-21 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-21` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-293 FT-21 Registrar gasto con división y por cobrar (2 de 2)

```tarea
orden: 341
bloque: B6
hito: HT-6
depende: TA-165, TA-173, TA-211, TA-207, TA-292, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-21.7, CA-21.8, CA-21.9, CA-21.10, CA-21.11, CA-21.12
pru: —
compartido: —
fichas: FT-21
pendiente: CA-21.10>FT-39
```

**Qué construir.**
- FT-21: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-21.7 a CA-21.12, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-21 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-21.10 (lo completa FT-39). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-21 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-12, ESC-19, ESC-20, ESC-24, AV-01, AV-02, AV-03, AV-07, AV-09 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-21` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-294 FT-34 Recepción y procesamiento de SMS (1 de 2)

```tarea
orden: 342
bloque: B6
hito: HT-6
depende: TA-172, TA-209, TA-216, TA-210, TA-212, TA-219, TA-224, TA-284, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-34.1, CA-34.2, CA-34.3, CA-34.4, CA-34.5, CA-34.6, CA-34.7, RUTA-/bandeja
pru: —
compartido: —
fichas: FT-34
pendiente: CA-34.4>FT-70
```

**Qué construir.**
- FT-34: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-34.1 a CA-34.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/bandeja`.
- CA con marca: CA-34.5 (error 10); CA-34.6 (error 5) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-34.4 (lo completa FT-70). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-34 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-34` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-295 FT-34 Recepción y procesamiento de SMS (2 de 2)

```tarea
orden: 343
bloque: B6
hito: HT-6
depende: TA-172, TA-209, TA-216, TA-294, TA-015, TA-284
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-34.8, CA-34.9, CA-34.10, CA-34.11, CA-34.12, CA-34.13, CA-34.14
pru: —
compartido: —
fichas: FT-34
pendiente: CA-34.9>FT-41, CA-34.10>FT-39
e2e: CA-03.3
```

**Qué construir.**
- FT-34: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-34.8 a CA-34.14, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-34 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-34.14 ⚠ (S6-1) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-34.9 (lo completa FT-41), CA-34.10 (lo completa FT-39). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.
- **[D] Completa pendientes de punta a punta (DT-27):** CA-03.3. Una E2E por CA que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la otra ficha [I].

**Leer.** 06 FT-34 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-46, AV-23, CB-14, CB-15, CB-17 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-34` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-296 FT-35 Revisar y aprobar: un toque, flujo completo y recordar regla (1 de 2)

```tarea
orden: 344
bloque: B6
hito: HT-6
depende: TA-178, TA-174, TA-211, TA-210, TA-212, TA-219, TA-224, TA-293, TA-295, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-35.1, CA-35.2, CA-35.3, CA-35.4, CA-35.5, CA-35.6, RUTA-/bandeja/[movimientoId], FE-25
pru: —
compartido: —
fichas: FT-35
pendiente: CA-35.5>FT-41, CA-35.6>FT-42
```

**Qué construir.**
- FT-35: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-35.1 a CA-35.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/bandeja/[movimientoId]`.
- **[D] Pendientes de punta a punta (DT-27):** CA-35.5 (lo completa FT-41), CA-35.6 (lo completa FT-42). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-35 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-35` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-297 FT-35 Revisar y aprobar: un toque, flujo completo y recordar regla (2 de 2)

```tarea
orden: 345
bloque: B6
hito: HT-6
depende: TA-178, TA-174, TA-211, TA-296, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-35.7, CA-35.8, CA-35.9, CA-35.10, CA-35.11
pru: —
compartido: —
fichas: FT-35
pendiente: CA-35.11>FT-39
```

**Qué construir.**
- FT-35: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-35.7 a CA-35.11, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-35 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-35.11 (lo completa FT-39). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-35 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-46, AV-01, AV-16, AV-23 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-35` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-298 FT-08 Inicio: resumen diario y "¿algo necesita mi atención?" (1 de 2)

```tarea
orden: 346
bloque: B6
hito: HT-6
depende: TA-169, TA-208, TA-185, TA-210, TA-212, TA-219, TA-224, TA-280, TA-288, TA-291, TA-297, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-08.1, CA-08.2, CA-08.3, CA-08.4, CA-08.5, CA-08.6, RUTA-/, RUTA-/presupuesto/listo-para-asignar
pru: —
compartido: —
fichas: FT-08
pendiente: CA-08.5>FT-27, CA-08.6>FT-62
```

**Qué construir.**
- FT-08: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-08.1 a CA-08.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/`, `/presupuesto/listo-para-asignar`.
- CA con marca: CA-08.2 (error 11) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-08.5 (lo completa FT-27), CA-08.6 (lo completa FT-62). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-08 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-08` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA de este trozo con su prueba en verde; la ficha sigue `en_curso`.

#### TA-299 FT-08 Inicio: resumen diario y "¿algo necesita mi atención?" (2 de 2)

```tarea
orden: 347
bloque: B6
hito: HT-6
depende: TA-169, TA-208, TA-185, TA-298, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-08.7, CA-08.8, CA-08.9, CA-08.10, CA-08.11, CA-08.12
pru: —
compartido: —
fichas: FT-08
pendiente: CA-08.7>FT-30, CA-08.8>FT-41
```

**Qué construir.**
- FT-08: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-08.7 a CA-08.12, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-08 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-08.7 (lo completa FT-30), CA-08.8 (lo completa FT-41). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-08 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-01, ESC-15, ESC-20, ESC-31, AV-01, AV-02, AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, AV-14, AV-17, AV-20, AV-23 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-08` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-300 FT-37 Descartar, restaurar, duplicados y coincidencias

```tarea
orden: 348
bloque: B6
hito: HT-6
depende: TA-178, TA-210, TA-212, TA-219, TA-224, TA-295, TA-297, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-37.1, CA-37.2, CA-37.3, CA-37.4, CA-37.5, CA-37.6
pru: —
compartido: —
fichas: FT-37
pendiente: CA-37.4>FT-41, CA-37.5>FT-41
```

**Qué construir.**
- FT-37: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-37.1 a CA-37.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-37 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-37.4 (lo completa FT-41), CA-37.5 (lo completa FT-41). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-37 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan AV-23, CB-16, CB-17 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-37` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-301 FT-38 SMS no reconocidos y con error

```tarea
orden: 349
bloque: B6
hito: HT-6
depende: TA-179, TA-210, TA-212, TA-219, TA-224, TA-295, TA-297
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-38.1, CA-38.2, CA-38.3, CA-38.4, CA-38.5, CA-38.6
pru: —
compartido: —
fichas: FT-38
```

**Qué construir.**
- FT-38: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-38.1 a CA-38.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-38 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-38 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan AV-23 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-38` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.


### 22.5 Fichas de HT-7

#### TA-302 FT-11 Mover dinero entre categorías

```tarea
orden: 351
bloque: B6
hito: HT-7
depende: TA-164, TA-210, TA-212, TA-219, TA-224, TA-288, TA-289
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-11.1, CA-11.2, CA-11.3, CA-11.4, RUTA-/presupuesto/mover
pru: —
compartido: —
fichas: FT-11
```

**Qué construir.**
- FT-11: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-11.1 a CA-11.4, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/mover`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-11 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-11 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-16, AV-02, AV-03 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-11` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-303 FT-30 Pagar tarjeta con desglose y pago excedente

```tarea
orden: 352
bloque: B6
hito: HT-7
depende: TA-165, TA-173, TA-210, TA-212, TA-219, TA-224, TA-291, TA-282, TA-299
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-30.1, CA-30.2, CA-30.3, CA-30.4, CA-30.5, CA-30.6, CA-30.7, RUTA-/cuentas/[cuentaId]/pagar
pru: —
compartido: —
fichas: FT-30
e2e: CA-08.7
```

**Qué construir.**
- FT-30: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-30.1 a CA-30.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas/[cuentaId]/pagar`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-30 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Completa pendientes de punta a punta (DT-27):** CA-08.7. Una E2E por CA que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la otra ficha [I].

**Leer.** 06 FT-30 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-08, ESC-09, ESC-10, ESC-13, AV-01, AV-04, AV-10, CB-01, CB-26 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-30` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-304 FT-16 Sobregiros y cierre automático del período

```tarea
orden: 353
bloque: B6
hito: HT-7
depende: TA-169, TA-208, TA-210, TA-212, TA-219, TA-224, TA-288, TA-293, TA-303, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-16.1, CA-16.2, CA-16.3, CA-16.4, CA-16.5, CA-16.6, CA-16.7
pru: —
compartido: —
fichas: FT-16
pendiente: CA-16.5>FT-71
```

**Qué construir.**
- FT-16: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-16.1 a CA-16.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-16 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-16.5 (lo completa FT-71). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-16 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-05, ESC-10, ESC-15, ESC-17, ESC-49, AV-02, AV-03, AV-04 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-16` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-305 FT-17 Metas

```tarea
orden: 354
bloque: B6
hito: HT-7
depende: TA-164, TA-170, TA-174, TA-210, TA-212, TA-219, TA-224, TA-288, TA-289
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-17.1, CA-17.2, CA-17.3, CA-17.4, CA-17.5, CA-17.6, CA-17.7, RUTA-/metas, RUTA-/metas/[metaId], RUTA-/metas/nueva
pru: —
compartido: —
fichas: FT-17
```

**Qué construir.**
- FT-17: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-17.1 a CA-17.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/metas`, `/metas/[metaId]`, `/metas/nueva`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-17 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-17 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-35, ESC-36, ESC-37, ESC-38, AV-17 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-17` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-306 FT-19 Archivar y desarchivar categorías, y sacar el dinero de una archivada

```tarea
orden: 355
bloque: B6
hito: HT-7
depende: TA-163, TA-174, TA-210, TA-212, TA-219, TA-224, TA-290, TA-283, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-19.1, CA-19.2, CA-19.3, CA-19.4, CA-19.5, CA-19.6, CA-19.7, RUTA-/presupuesto/categorias/[categoriaId]/archivar, RUTA-/presupuesto/categorias/[categoriaId]/sacar
pru: —
compartido: —
fichas: FT-19
pendiente: CA-19.1>FT-40, CA-19.2>FT-28, CA-19.3>FT-47, CA-19.5>FT-40
```

**Qué construir.**
- FT-19: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-19.1 a CA-19.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/categorias/[categoriaId]/archivar`, `/presupuesto/categorias/[categoriaId]/sacar`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-19 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-19.1 (lo completa FT-40), CA-19.2 (lo completa FT-28), CA-19.3 (lo completa FT-47), CA-19.5 (lo completa FT-40). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-19 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-44, AV-14 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-19` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-307 FT-22 Registrar ingreso y FT-23 Transferencia entre cuentas propias

```tarea
orden: 356
bloque: B6
hito: HT-7
depende: TA-165, TA-167, TA-173, TA-210, TA-212, TA-219, TA-224, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-22.1, CA-22.2, CA-22.3, CA-23.1, CA-23.2, CA-23.3, RUTA-/registrar/[tipo]
pru: —
compartido: —
fichas: FT-22, FT-23
```

**Qué construir.**
- FT-22, FT-23: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-22.1 a CA-23.3, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/registrar/[tipo]`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-22, FT-23 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-22, FT-23 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-03, AV-01, CB-29 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-22` y `pnpm pruebas:ft FT-23` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-308 FT-24 Actividad con búsqueda y filtros

```tarea
orden: 357
bloque: B6
hito: HT-7
depende: TA-171, TA-211, TA-210, TA-212, TA-219, TA-224, TA-293, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-24.1, CA-24.2, CA-24.3, CA-24.4, CA-24.5, CA-24.6, RUTA-/actividad
pru: —
compartido: —
fichas: FT-24
pendiente: CA-24.3>FT-28
```

**Qué construir.**
- FT-24: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-24.1 a CA-24.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/actividad`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-24 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-24.3 (lo completa FT-28). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-24 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-24` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-309 FT-25 Detalle y edición completa

```tarea
orden: 358
bloque: B6
hito: HT-7
depende: TA-166, TA-171, TA-173, TA-210, TA-212, TA-219, TA-224, TA-308, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-25.1, CA-25.2, CA-25.3, CA-25.4, CA-25.5, CA-25.6, CA-25.7, CA-25.8, RUTA-/actividad/[transaccionId], RUTA-/actividad/[transaccionId]/editar
pru: —
compartido: —
fichas: FT-25
pendiente: CA-25.4>FT-43, CA-25.5>FT-28, CA-25.6>FT-46
```

**Qué construir.**
- FT-25: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-25.1 a CA-25.8, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/actividad/[transaccionId]`, `/actividad/[transaccionId]/editar`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-25 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-25.4 (lo completa FT-43), CA-25.5 (lo completa FT-28), CA-25.6 (lo completa FT-46). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-25 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-18, ESC-34, ESC-47, AV-01, AV-16, CB-03, CB-24, CB-30, CB-32 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-25` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-310 FT-26 Eliminar y cambiar el estado bancario

```tarea
orden: 359
bloque: B6
hito: HT-7
depende: TA-166, TA-171, TA-210, TA-212, TA-219, TA-224, TA-309, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-26.1, CA-26.2, CA-26.3, CA-26.4, CA-26.5, CA-26.6, RUTA-/actividad/[transaccionId]/eliminar, RUTA-/actividad/[transaccionId]/estado
pru: —
compartido: —
fichas: FT-26
pendiente: CA-26.3>FT-41, CA-26.4>FT-46, CA-26.6>FT-43
```

**Qué construir.**
- FT-26: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-26.1 a CA-26.6, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/actividad/[transaccionId]/eliminar`, `/actividad/[transaccionId]/estado`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-26 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Pendientes de punta a punta (DT-27):** CA-26.3 (lo completa FT-41), CA-26.4 (lo completa FT-46), CA-26.6 (lo completa FT-43). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-26 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-33, AV-01, AV-16, CB-04 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-26` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-311 FT-27 Transacción olvidada y cambios retroactivos

```tarea
orden: 360
bloque: B6
hito: HT-7
depende: TA-166, TA-169, TA-185, TA-210, TA-212, TA-219, TA-224, TA-299, TA-293, TA-309, TA-298
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-27.1, CA-27.2, CA-27.3, CA-27.4, CA-27.5, CA-27.6, CA-27.7
pru: —
compartido: —
fichas: FT-27
e2e: CA-08.5
```

**Qué construir.**
- FT-27: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-27.1 a CA-27.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `pruebas/features.json` pasa FT-27 a `terminada` (07 §27, DT-06 condición 6).
- **[D] Completa pendientes de punta a punta (DT-27):** CA-08.5. Una E2E por CA que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la otra ficha [I].

**Leer.** 06 FT-27 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-02, ESC-17, ESC-31, ESC-32, ESC-49, AV-01, CB-26 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-27` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-312 FT-51 Cuentas y posición neta

```tarea
orden: 361
bloque: B6
hito: HT-7
depende: TA-171, TA-209, TA-210, TA-212, TA-219, TA-224, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-51.1, CA-51.2, CA-51.3, CA-51.4, CA-51.5, CA-51.6, CA-51.7, CA-51.8, RUTA-/cuentas
pru: —
compartido: —
fichas: FT-51
```

**Qué construir.**
- FT-51: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-51.1 a CA-51.8, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-51 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-51.3 (error 11) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).

**Leer.** 06 FT-51 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-01, ESC-40, AV-07, AV-08, AV-09, AV-21 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-51` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-313 FT-52 Detalle de cuenta

```tarea
orden: 362
bloque: B6
hito: HT-7
depende: TA-171, TA-167, TA-210, TA-212, TA-219, TA-224, TA-312, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-52.1, CA-52.2, CA-52.3, CA-52.4, CA-52.5, RUTA-/cuentas/[cuentaId]
pru: —
compartido: —
fichas: FT-52
pendiente: CA-52.2>FT-43
```

**Qué construir.**
- FT-52: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-52.1 a CA-52.5, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas/[cuentaId]`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-52 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-52.1 (error 2) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-52.2 (lo completa FT-43). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-52 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-47, AV-04, AV-05, AV-06, AV-07, AV-08, AV-21 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-52` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-314 FT-53 Editar, ordenar, archivar, desarchivar y eliminar cuentas

```tarea
orden: 363
bloque: B6
hito: HT-7
depende: TA-162, TA-171, TA-173, TA-210, TA-212, TA-219, TA-224, TA-313
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-53.1, CA-53.2, CA-53.3, CA-53.4, CA-53.5, CA-53.6, CA-53.7, RUTA-/cuentas/[cuentaId]/archivar, RUTA-/cuentas/[cuentaId]/editar, RUTA-/cuentas/[cuentaId]/eliminar, RUTA-/cuentas/ordenar
pru: —
compartido: —
fichas: FT-53
```

**Qué construir.**
- FT-53: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-53.1 a CA-53.7, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas/[cuentaId]/archivar`, `/cuentas/[cuentaId]/editar`, `/cuentas/[cuentaId]/eliminar`, `/cuentas/ordenar`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-53 a `terminada` (07 §27, DT-06 condición 6).

**Leer.** 06 FT-53 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-43, AV-01, AV-15 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-53` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

#### TA-315 FT-54 Pagar cuota o abonar a capital

```tarea
orden: 364
bloque: B6
hito: HT-7
depende: TA-165, TA-173, TA-111, TA-210, TA-212, TA-219, TA-224, TA-282, TA-015
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-54.1, CA-54.2, CA-54.3, CA-54.4, CA-54.5, RUTA-/cuentas/[cuentaId]/cuota
pru: —
compartido: —
fichas: FT-54
pendiente: CA-54.5>FT-55
```

**Qué construir.**
- FT-54: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-54.1 a CA-54.5, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/cuentas/[cuentaId]/cuota`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-54 a `terminada` (07 §27, DT-06 condición 6).
- CA con marca: CA-54.1 (error 6) — tienen además su `PRU-MAN` de 07 §22.1 (TU-16).
- **[D] Pendientes de punta a punta (DT-27):** CA-54.5 (lo completa FT-55). Se prueban con el estado sembrado por operaciones y se agregan a `pruebas/pendientes-e2e.json`.

**Leer.** 06 FT-54 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-39, AV-01, AV-02, AV-03, CB-07 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

**Comandos.** `pnpm pruebas:ft FT-54` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.


### 22.6 Mapa de la Parte C

65 tareas: 25 de B4, 4 de B5 y 36 de B6. **11 de revisión obligatoria** (DT-20). 11 pruebas nuevas con identificador (DT-17), además de las de los CA (DT-21).

| Orden | Tarea | Bloque | Hito | Revisión | Título | Prod. |
|---|---|---|---|---|---|---|
| 300 | TA-200 | B4 | HT-5 | normal | Esqueleto de Next 16 en `apps/web` | 320 |
| 301 | TA-201 | B4 | HT-5 | normal | Tokens, temas y fuentes | 220 |
| 302 | TA-202 | B4 | HT-5 | normal | Íconos de la interfaz y glifos de estado | 120 |
| 303 | TA-203 | B4 | HT-5 | normal | Recursos de marca y manifiesto | 90 |
| 304 | TA-204 | B4 | HT-5 | normal | Componentes base I: botones, campos, selección y pastillas | 380 |
| 305 | TA-205 | B4 | HT-5 | normal | Componentes base II: superpuestos, avisos, resultados y vacíos | 360 |
| 306 | TA-206 | B4 | HT-5 | normal | Formato, `Monto` e indicador de estado | 300 |
| 307 | TA-207 | B4 | HT-5 | normal | `EntradaMonto`, `EntradaFecha` y fechas de negocio | 260 |
| 308 | TA-214 | B4 | HT-5 | obligatoria | Autenticación web y `proxy.ts` | 340 |
| 309 | TA-215 | B4 | HT-5 | obligatoria | Barrera 1 del reloj de prueba: `instrumentation.ts` | 80 |
| 310 | TA-216 | B4 | HT-5 | obligatoria | Route Handlers del webhook y de la tarea diaria | 160 |
| 311 | TA-219 | B4 | HT-5 | obligatoria | Arnés E2E: pila local, usuario, semillas, tres relojes y candado | 380 |
| 312 | TA-210 | B4 | HT-5 | normal | Patrón de escritura: envío, resultado y doble envío | 360 |
| 313 | TA-211 | B4 | HT-5 | normal | Borradores, lecturas interactivas, un toque y versión nueva | 320 |
| 314 | TA-212 | B4 | HT-5 | normal | Marco y navegación | 380 |
| 315 | TA-213 | B4 | HT-5 | normal | Estados de pantalla, caché y parámetros | 300 |
| 316 | TA-224 | B4 | HT-5 | normal | Catálogo de textos de la interfaz | 260 |
| 317 | TA-260 | B5 | HT-5 | obligatoria | Job `desplegar` con barrera 1b y política de patrones | 220 |
| 318 | TA-280 | B6 | HT-5 | normal | FT-01 Ingresar con contraseña y TOTP | 360 |
| 319 | TA-281 | B6 | HT-5 | normal | FT-02 Inscribir el primer factor TOTP | 360 |
| 320 | TA-208 | B4 | HT-6 | normal | Componentes de dominio I: billete, filas y selector de período | 380 |
| 321 | TA-209 | B4 | HT-6 | normal | Componentes de dominio II: cuentas, bandeja y gráficos | 380 |
| 322 | TA-217 | B4 | HT-6 | obligatoria | Route Handlers del respaldo, la exportación y las acciones de notificación | 180 |
| 323 | TA-218 | B4 | HT-6 | obligatoria | AAL2 en toda acción y ruta (DP-22) | 140 |
| 324 | TA-220 | B4 | HT-6 | normal | Refresco automático y agenda de medianoche | 200 |
| 325 | TA-221 | B4 | HT-6 | normal | Accesibilidad automática por ruta | 160 |
| 326 | TA-222 | B4 | HT-6 | obligatoria | Presupuestos de rendimiento en CI | 200 |
| 327 | TA-223 | B4 | HT-6 | normal | Service worker, `/sin-conexion` e instalación | 300 |
| 328 | TA-261 | B5 | HT-6 | obligatoria | Workflow `respaldo.yml` | 160 |
| 329 | TA-262 | B5 | HT-6 | obligatoria | Control de dinero diario (07 §31.1) | 160 |
| 330 | TA-282 | B6 | HT-6 | normal | FT-50 Crear cuenta con saldo inicial | 360 |
| 331 | TA-283 | B6 | HT-6 | normal | FT-18 Grupos y categorías: crear, renombrar, reordenar y eliminar | 360 |
| 332 | TA-284 | B6 | HT-6 | normal | FT-03 Conectar MacroDroid (token del webhook) | 360 |
| 333 | TA-285 | B6 | HT-6 | normal | FT-04 Primer uso guiado, con la plantilla de categorías (1 de 2) | 360 |
| 334 | TA-286 | B6 | HT-6 | normal | FT-04 Primer uso guiado, con la plantilla de categorías (2 de 2) | 360 |
| 335 | TA-287 | B6 | HT-6 | normal | FT-09 Presupuesto del período: filtros, períodos cerrados y futuros (1 de 2) | 360 |
| 336 | TA-288 | B6 | HT-6 | normal | FT-09 Presupuesto del período: filtros, períodos cerrados y futuros (2 de 2) | 360 |
| 337 | TA-289 | B6 | HT-6 | normal | FT-10 Asignar y desasignar | 360 |
| 338 | TA-290 | B6 | HT-6 | normal | FT-14 Detalle de categoría: reparto, calendario e historial | 360 |
| 339 | TA-291 | B6 | HT-6 | normal | FT-29 Categoría de pago y "te falta reservar" | 360 |
| 340 | TA-292 | B6 | HT-6 | normal | FT-21 Registrar gasto con división y por cobrar (1 de 2) | 360 |
| 341 | TA-293 | B6 | HT-6 | normal | FT-21 Registrar gasto con división y por cobrar (2 de 2) | 360 |
| 342 | TA-294 | B6 | HT-6 | normal | FT-34 Recepción y procesamiento de SMS (1 de 2) | 360 |
| 343 | TA-295 | B6 | HT-6 | normal | FT-34 Recepción y procesamiento de SMS (2 de 2) | 360 |
| 344 | TA-296 | B6 | HT-6 | normal | FT-35 Revisar y aprobar: un toque, flujo completo y recordar regla (1 de 2) | 360 |
| 345 | TA-297 | B6 | HT-6 | normal | FT-35 Revisar y aprobar: un toque, flujo completo y recordar regla (2 de 2) | 360 |
| 346 | TA-298 | B6 | HT-6 | normal | FT-08 Inicio: resumen diario y "¿algo necesita mi atención?" (1 de 2) | 360 |
| 347 | TA-299 | B6 | HT-6 | normal | FT-08 Inicio: resumen diario y "¿algo necesita mi atención?" (2 de 2) | 360 |
| 348 | TA-300 | B6 | HT-6 | normal | FT-37 Descartar, restaurar, duplicados y coincidencias | 360 |
| 349 | TA-301 | B6 | HT-6 | normal | FT-38 SMS no reconocidos y con error | 360 |
| 350 | TA-263 | B5 | HT-7 | obligatoria | Workflow `restauracion.yml` (mensual y semanal de CT-09) | 120 |
| 351 | TA-302 | B6 | HT-7 | normal | FT-11 Mover dinero entre categorías | 360 |
| 352 | TA-303 | B6 | HT-7 | normal | FT-30 Pagar tarjeta con desglose y pago excedente | 360 |
| 353 | TA-304 | B6 | HT-7 | normal | FT-16 Sobregiros y cierre automático del período | 360 |
| 354 | TA-305 | B6 | HT-7 | normal | FT-17 Metas | 360 |
| 355 | TA-306 | B6 | HT-7 | normal | FT-19 Archivar y desarchivar categorías, y sacar el dinero de una archivada | 360 |
| 356 | TA-307 | B6 | HT-7 | normal | FT-22 Registrar ingreso y FT-23 Transferencia entre cuentas propias | 360 |
| 357 | TA-308 | B6 | HT-7 | normal | FT-24 Actividad con búsqueda y filtros | 360 |
| 358 | TA-309 | B6 | HT-7 | normal | FT-25 Detalle y edición completa | 360 |
| 359 | TA-310 | B6 | HT-7 | normal | FT-26 Eliminar y cambiar el estado bancario | 360 |
| 360 | TA-311 | B6 | HT-7 | normal | FT-27 Transacción olvidada y cambios retroactivos | 360 |
| 361 | TA-312 | B6 | HT-7 | normal | FT-51 Cuentas y posición neta | 360 |
| 362 | TA-313 | B6 | HT-7 | normal | FT-52 Detalle de cuenta | 360 |
| 363 | TA-314 | B6 | HT-7 | normal | FT-53 Editar, ordenar, archivar, desarchivar y eliminar cuentas | 360 |
| 364 | TA-315 | B6 | HT-7 | normal | FT-54 Pagar cuota o abonar a capital | 360 |

---

## 23. Revisiones de la Parte C

### 23.1 Cobertura

- **Objetivos de la Parte C:** 393 del catálogo, cada uno con exactamente una tarea dueña (V8-01):
  - los 233 CA de las 31 fichas [I];
  - 55 FE de 05 (el registro completo, menos FE-22, que es L1 a L19 de la Parte A, y los tres de la Parte D);
  - 43 rutas de 06 §6.4, los 5 Route Handlers de 04 §1.2 y las funciones de autenticación de 04 §12.2;
  - 41 PRU de 07, los 3 workflows de operación, CF-08 y CF-10 a CF-13, CT-01 (barreras 1 y 1b) y CT-09, BE-05 y BE-06, DP-22 y DP-29.
- **[C] Cambios del catálogo**, con su motivo:
  - **FE** entra al catálogo (antes no estaba): 58 identificadores, 55 de la C y FE-32 (destinos de notificaciones), FE-57 (push) y FE-58 (instalación a pedido) de la D, porque dependen de FT-69, FT-71 y FT-05, fichas [M].
  - **Recorridos de 06 §4** (REC-4.1 a REC-4.6) a la Parte D: los seis incluyen alguna ficha [M], así que ninguno se puede recorrer de punta a punta con solo las [I]. Corrige el criterio de HT-7 (§2).
  - **CF-23** (`/notificaciones` interceptada) a la D: es de FT-69 [M].
  - **PRU-SW-NOTIF-001** (push sintético), **PRU-E2E-BAND-001** y **PRU-REN-BAND-001** (arrastre en la Bandeja) a la D: son de FT-71 y FT-78, fichas [M].
  - Las dos rutas de DT-23 (§19.4).
- **Pendientes para la Parte D:** 308 objetivos (259 CA, 35 rutas, 6 recorridos, 3 FE, 3 PRU, CF-03 y CF-23).

### 23.2 Archivos de los zips que cita la Parte C

La carpeta con los zips no llegó todavía (P8-15). Estas tareas quedan escritas como "portar desde anexos" y, si su archivo no está, en `bloqueada` con el motivo; `plan:siguiente` ofrece las demás.

| Archivo | Zip | Tarea |
|---|---|---|
| `tokens.css`, `tokens.json` | `finn-entrega.zip` | TA-201 |
| `iconos/`, `iconos/estados/` | `finn-entrega.zip` | TA-202 |
| `finn-marca.zip`, `manifest-icons.json` | `finn-entrega.zip` (zip dentro del zip) | TA-203 |
| `prototipos/tokens.py` | Fase 5 (`05-frontend-verificacion-D.zip`, versión [R3]) | TA-201 (PRU-DOM-PWA-001), que lo porta como `tools/pruebas/contraste.py` **[CH-09]** |

`anexos.ts` (V8-05) lee esta tabla y las de §8.2 y §16.4. Las capturas de `referencia/` no se portan: están entre los archivos del proyecto y cada tarea las usa para comparar.

### 23.3 Si el zip de la marca no aparece (P8-15)

**Dónde está.** `finn-marca.zip` viene **dentro** de `finn-entrega.zip` (06-identidad-visual §2, tabla "Qué hay en el paquete"). Si recuperás `finn-entrega.zip`, la marca llega con él; `anexos.ts` abre zips dentro de zips para comprobarlo.

**Tareas de la Parte C que usan la marca:**

| Tarea | Qué usa | Sin el zip de la marca |
|---|---|---|
| TA-203 Recursos de marca y manifiesto | Símbolo, logotipo, íconos 192, 512 y maskable, Apple, favicon, `manifest-icons.json` | Recursos provisionales de 05 §10.11 (DT-24) |
| TA-212 Marco y navegación | Símbolo en la barra lateral, si el diseño lo pone (05 §10.11) | Usa el provisional de TA-203; sin cambios de código |
| TA-223 Service worker y `/sin-conexion` | Símbolo en la página sin conexión | Ídem |
| TA-280 FT-01 Ingresar | Símbolo o logotipo en el ingreso | Ídem |

La insignia de las notificaciones push (`insignia-96.png`) es de la Parte D (FE-57).

**Alternativas, si tampoco aparece `finn-entrega.zip`:**
- a) **Recursos provisionales de 05 §10.11** (DT-24): ya aprobados por 05, sin copiar nada de la marca. Cuando aparezcan los reales, un PR de datos los reemplaza. *Es la que planeo para TA-203.*
- b) **Pedirle a Claude Design que vuelva a exportar** el paquete de la marca. Es tu decisión y no bloquea nada si mientras tanto rige a).
- c) **Redibujar el símbolo** desde las capturas: no lo propongo; sería rehacer la marca sin el diseño, y 06-identidad-visual no trae los SVG.

Lo que **no tiene alternativa aprobada** si falta `finn-entrega.zip` entero: los 52 íconos y los 7 glifos de estado (TA-202) y el texto exacto de `tokens.css` y `tokens.json` (TA-201). El texto de los tokens está completo en 06-identidad-visual §4 y §5, pero portarlo desde el `.md` es reconstruir desde un `.md`, y dijiste que no lo haga sin avisarte: lo pregunto en **P8-19**. Para los íconos no hay texto en los documentos.

### 23.4 La ola 2 después de HT-6 (P8-18)

Quedan **19 tareas** de la ola 2 cuando se cumple HT-6. **[D]** Son **17**: TA-139 y TA-194 (programadas) pasaron a la ola 1 por ESC-44 (§26.6).
- **B2 (10):** TA-136, TA-137, TA-140 a TA-147: asignación rápida y ciclo, inversiones, por cobrar y condonar, reportes accionables, oráculo extendido y escenarios de la ola 2.
- **B3 (7):** TA-168 (exportar), TA-192, TA-195 a TA-199: sus gemelas en la aplicación, push, formatos, consultas y formularios de la ola 2 y los escenarios `@int` restantes.

Antes eran 21: TA-138 y TA-193 (OP-32 a OP-34) pasaron a la ola 1 por ESC-44 (§16.2). Con la ola 2 terminada se cumplen HT-2 y HT-3, y empiezan las fichas [M] (Parte D).

### 23.5 Otros hallazgos

- **06 pone fichas [M] como dependencias de fichas [I]** (DT-26, P8-19). FT-08, FT-16, FT-19, FT-34, FT-35 y FT-54 dependen en 06 de fichas [M]; FT-04 de una [P]. La prioridad del encargo pone las [I] primero. Lo trato como dependencia blanda y lo pregunto.
- **`/api/exportar/[formato]` llega antes que su función.** El Route Handler es de la Parte C (DT-19, TA-217), pero OPT-08 es de la ola 2 (TA-168). Hasta entonces responde 404 y se prueba solo su autorización; TA-168 agrega la prueba de punta a punta.
- **HT-5 muestra un Inicio provisional.** El criterio de HT-5 dice "ver Inicio vacío"; Inicio (FT-08) es de HT-6. TA-200 deja una página provisional "Inicio vacío" que la tarea de FT-08 reemplaza (DT-23).
- **El tamaño de las tareas de B6 es una estimación uniforme** (360 líneas de producción, 10 archivos). Una ficha con 10 CA y una pantalla nueva puede pasar de 400: `pr:mergear` obliga a partirla y TA-230 a TA-249 dan los números (P8-17).
- **Revisión obligatoria en la Parte C:** 11 de 65 tareas (autenticación, reloj, Route Handlers, AAL2, arnés E2E, rendimiento y los cuatro workflows de operación). Ninguna tarea de fichas.
- **Recorridos de 06 §4** van todos a la Parte D (§23.1). Las E2E de cada pantalla [I] sí están en la C.

### 23.6 Riesgos de la Parte C

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RC-1 | `finn-entrega.zip` no aparece | Media | Alto | TA-201 y TA-202 quedan bloqueadas y con ellas casi toda la Parte C; P8-19 decide si los tokens se portan desde el `.md`. La marca tiene alternativa aprobada (DT-24) |
| RC-2 | La pila local de Supabase en Windows es lenta para correr E2E en cada PR | Media | Medio | Candado (DT-22) y `pruebas:afectadas`: solo las suites tocadas. La E2E completa corre en `main` |
| RC-3 | Una ficha grande pasa de 400 líneas | Media | Bajo | `pr:mergear` la parte; TA-230 a TA-249 |
| RC-4 | Las dependencias blandas esconden un hueco de una ficha [I] que solo se ve con su ficha [M] | Baja | Medio | Cada parte afectada tiene su prueba con el estado sembrado (DT-26); la E2E de punta a punta la agrega la ficha [M] |
| RC-5 | La condición de HT-6 se cumple tarde porque un escenario `@int` de la ola 1 falla | Media | Medio | Es justamente lo que P8-18 pide: no se usa plata real hasta que pase |

---

## 24. Verificación de la Parte C

**Entorno:** Node 22.22.0 con la eliminación de tipos (este entorno no tiene Node 24) y Python 3.13. Los documentos 01 a 07 están en disco (`verificacion/docs/`). Las salidas están en `08-tareas-verificacion.zip`.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V8-01 | `verificar.ts` sobre las partes A a C (`--parte C --docs docs --negativo`), y sobre A y B solas | **Pasa.** 191 tareas, 8 hitos con bloque (HT-0 a HT-7), 20 TU. 1.113 objetivos de las partes A a C, cada uno con una sola tarea dueña. Sin ciclos ni dependencias hacia adelante. Tamaños dentro de DT-01, con la única excepción aprobada (DT-15). HT-5 a HT-7 alcanzables con sus TU. **HT-6 con su condición (DT-25):** 55 objetivos de prueba exigidos (9 de `pruebas`, 38 ESC en sus dos ejecutores y 8 CB), cada uno con su dueña en `requiere` o en sus dependencias, y los 143 CA de sus 16 fichas. El catálogo contiene los 1.088 objetivos que derivan los documentos (con los 58 FE de 05). **Control negativo: 20 de 20 mutaciones detectadas**: las 15 anteriores y 5 nuevas (HT-6 sin un lote de ESC `@int`, sin el diferencial, sin la tarea de un trozo de ficha, con una tarea de otro hito que no es dueña de una prueba exigida, y un CA de una ficha de HT-6 sin dueño). Las partes A y B solas también pasan | Pasó en la primera corrida. Antes, al armar la Parte C, el generador encontró dos cosas que corregí: TA-138 quedaba después de TA-134, que ahora depende de ella (el `orden` pasó a ser topológico dentro de cada ola, sin cambiar ningún identificador de prueba aprobado), y las dependencias de 06 entre fichas tenían ciclos y saltos de hito (DT-26) | Node 24; la Parte D |
| V8-02 | Minutos y meses (`estimacion.ts`) con B0 a B6 exactos | **Tareas:** 243 a 257 (235 a 245 hasta la puerta). **2 pushes por PR:** 25,8 min por PR y 51 PR al mes con producción, **4,4 a 4,6 meses** hasta la puerta. **3,75 pushes por PR:** 37 a 40 PR al mes, 6,1 a 6,4 meses. Las tareas antes de HT-5 (sin producción) son exactas: 127 | Menos tareas que en la estimación de la Parte B (240 a 280): B4 dio 25, B6 dio 36 (estimadas 42 a 56) y B7 se recalibró con B6 (44 a 54) | El ritmo real de agentes y revisiones |
| V8-03 | Cada PRU de un campo `pru` frente a 07 en disco | **215 PRU:** 106 definidos en 07, 5 por un CH y 104 nuevos según DT-17. La Parte C aporta 52: 41 de 07 (todos los de la Parte C del catálogo, cada uno con una dueña) y 11 nuevos. Los de los CA de las fichas no se preasignan (DT-21) | — | — |
| V8-04 | Prueba de la plantilla de encargo | Parte D | — | — |
| V8-05 | `anexos.ts`: cada archivo citado en §8.2, §16.4 y §23.2 existe en la carpeta de anexos, con zips dentro de zips | **Corre contra la carpeta real cuando llegue** (P8-15). Hoy, con una carpeta vacía, lista los 31 archivos que faltan (de 34 citas en 3 tablas) y 3 "a revisar a mano" (citas con "o equivalente" o "prototipo"). **Prueba del script** con una carpeta sintética de archivos vacíos (solo los nombres, nada del contenido real), con zips comprimidos y `finn-marca.zip` dentro de `finn-entrega.zip`: **pasa**, y el control negativo (quitar un archivo del índice) se detecta | Las citas sin nombre de archivo (por ejemplo, "los 13 SMS sintéticos de V-23") no las puede comprobar: quedan para la revisión de TA-002 | Los zips reales |

---

## 25. Preguntas de la Parte C

**P8-19. Dependencias de 06 y tokens sin zip.** Dos decisiones que tocan lo aprobado:

1. **Dependencias de fichas [I] hacia fichas [M] o [P]** (DT-26, §19.7). 06 dice que esas fichas "tienen que existir antes". Opciones:
   - a) Dependencia blanda, como propone DT-26: la ficha [I] se termina con el estado sembrado por operaciones, y la ficha [M] agrega la prueba de punta a punta. Un CH a 06 §2.0 aclara que "Dependencias" incluye las parciales, y cuáles son.
   - b) Mover a [I] las fichas [M] de las que dependen (FT-41, FT-55, FT-62, FT-71, FT-73 y FT-40): son 45 CA más antes de HT-7, y FT-40 y FT-41 arrastran las programadas de la ola 2.
   - c) Mover a [M] las fichas [I] que dependen de ellas: FT-08 (Inicio) y FT-35 (aprobar), entre otras, que HT-6 necesita.

   *Recomiendo a):* respeta la prioridad del encargo y cada parte afectada sigue teniendo prueba.

2. **`tokens.css` y `tokens.json` si `finn-entrega.zip` no aparece** (§23.3). Opciones:
   - a) Esperar el zip; TA-201 y TA-202 quedan bloqueadas (y casi toda la Parte C con ellas).
   - b) Portar los tokens desde el texto de 06-identidad-visual §4 y §5, con DT-14 comparando contra ese bloque, y dejar los íconos bloqueados hasta el zip. Las pantallas avanzan sin íconos (con el nombre accesible en texto).
   - c) Ídem b) y, para los íconos, pedirle a Claude Design que los vuelva a exportar.

   *Recomiendo esperar el zip unos días y, si no aparece, c).* No hago b) ni c) sin tu respuesta.

---

# Parte D — Fichas [M] y [P], recorridos, puerta y cierre

## 26. Decisiones de la Parte D

### 26.1 DT-27: CA pendientes de punta a punta (P8-19.1)

Una dependencia blanda (DT-26) deja algunos CA de fichas [I] probados con el estado sembrado por operaciones, porque la ficha que produce ese estado todavía no existe. La regla que aprobaste los vuelve visibles y obliga a cerrarlos:

1. **Marca.** Cada uno de esos CA va en el campo `pendiente: CA>FT` de la tarea de B6 que lo cubre, y en `pruebas/pendientes-e2e.json` (TA-015). La matriz lo muestra como "pendiente de punta a punta" con la ficha que lo completa.
2. **Cierre.** La última tarea de la ficha que lo completa lleva ese CA en su campo `e2e` y escribe una E2E que recorre su flujo y verifica el resultado en la pantalla de la ficha [I]. Esa ficha no pasa a `terminada` sin esas E2E (TA-015, CH-08).
3. **Hitos.** HT-7 se alcanza con los pendientes marcados. HT-8 y HT-9 llevan `sin_pendientes: si`: no se alcanzan si queda un pendiente cuya ficha no es [P].
4. **Verificador (E12).** Cada `pendiente` tiene su E2E en la última tarea de la ficha que lo completa, y esa tarea depende de la dueña del CA; un hito con `sin_pendientes` exige esas tareas en `requiere` o en sus dependencias.

**Cuántos y de qué fichas: 31 CA** de 16 fichas [I] (FT-03, FT-08, FT-09, FT-14, FT-16, FT-19, FT-21, FT-24, FT-25, FT-26, FT-29, FT-34, FT-35, FT-37, FT-52, FT-54): **28** los completan fichas [M], **3** fichas [I] posteriores y **0** fichas [P]. La lista está en §30.

**Cómo se obtuvo la lista.** Un barrido de los 233 CA [I] buscó conceptos que solo produce una ficha [M] o [P] (ocurrencias, programadas, reglas, devoluciones, cobros, conciliaciones, push, modelo del préstamo…), con la tabla de 06 §6.2 como referencia; dio 49 aciertos, que revisé uno por uno: quedan como pendientes los que necesitan un estado que solo crea otra ficha, y se descartan los de §30.2 con su motivo. Dos aciertos cambian de ficha al revisarlos (CA-03.3 lo completa FT-34 y CA-08.7, FT-30, ambas [I]) y uno lo agregué a mano (CA-08.5, cambio retroactivo de FT-27), porque el barrido no lo detecta. Si al construir una ficha [I] el agente encuentra otro CA en la misma situación, lo agrega como `pendiente` y lo informa como desvío (§1.5, paso 1).

Las dependencias blandas hacia fichas [I] posteriores (FT-03 → FT-34, FT-08 → FT-27 y FT-30) siguen la misma regla, aunque no las pediste: así ningún CA queda probado solo con datos sembrados, tampoco dentro de las [I].

*Alternativas descartadas:* marcar la ficha [I] entera como pendiente (escondería cuáles CA faltan); exigir la E2E en la ficha [I] cuando llegue la [M] (la tarea [I] ya estaría cerrada y nadie la retomaría).

### 26.2 DT-28: cómo se arman y ordenan B7 y B8

- **Una tarea por ficha**; FT-71 (14 CA) y FT-78 (15 CA) se parten en dos. FT-43 y FT-60 tienen 10 CA y van enteras.
- **Dependencias derivadas, no escritas a mano:** para cada ficha, el generador busca en 06 §6.2 y §6.3 las operaciones, consultas, reportes y formularios que usa, y depende de la tarea que posee cada uno en el plan. Se agregan las dependencias de 06 hacia fichas anteriores y, en la tarea que completa pendientes, la dueña de cada CA (E12).
- **Orden:** B7 de 700 en adelante, B8 de 900, topológico (DT-16). La ola 2 (600 a 628) va antes: toda ficha [M] que usa una operación de la ola 2 depende de su tarea.
- **Rutas:** la regla de DT-23. La única que la tabla de 06 §6.4 atribuye a dos fichas [M] con pantalla propia es `/ajustes/diagnostico` (FT-42, FT-76): la posee FT-76 ("Respaldo y diagnóstico"); FT-42 agrega su sección.
- **Recorridos:** dos tareas (TA-446 y TA-447) después de las fichas de cada recorrido; sin datos sembrados a mitad de camino.

*Alternativa descartada:* orden por número de ficha (FT-15 y FT-45 usan piezas que construyen fichas de número mayor).

### 26.3 DT-29: plantilla del encargo

El encargo de cada tarea lo genera `pnpm plan:encargo TA-nnn` a partir de su ficha (§32). No se escribe a mano: la ficha ya es el encargo, y la plantilla solo agrega el marco común (qué leer, cómo terminar, cómo mergear). V8-04 genera los 243 encargos y comprueba que cada uno tenga sus seis secciones y que cada referencia "0n §x.y" de "Leer" exista en el documento.

*Alternativa descartada:* un encargo escrito por tarea (243 textos que se desincronizan de las fichas).

### 26.4 DT-30: hitos encadenados

Un hito puede listar `hitos:`; su alcance incluye lo que requieren esos hitos y su `despues` va después de los suyos (E7-hitos). HT-8 encadena HT-2, HT-3 y HT-7; HT-9 encadena HT-4 a HT-8 y lista las 69 fichas [I] y [M] (465 CA, los de 07 §30), así que el verificador comprueba la puerta entera: cada CA con su tarea, sin pendientes salvo [P].

### 26.5 DT-31: FT-49 bloqueada

FT-49 (unir deudores) está diferida (CF-03, M13). Tiene tarea (TA-549) para que sus 3 CA tengan dueña, pero `plan/tareas.json` la crea en `bloqueada` con el motivo "CF-03". No forma parte de ningún hito.

### 26.6 Corrección de la ola 1: programadas (ESC-44) **[D]**

Al revisar los CA de FT-19 encontré un error mío en el ajuste [B2]: **ESC-44 empieza con una programada activa** (01 §8, paso 0), y la programada se crea con OP-42, que estaba en la ola 2. Con ESC-44 en la ola 1 (DT-25), sus tareas (TA-134 y TA-191) no podían sembrar el estado inicial. El verificador no lo veía porque las dependencias de escenarios las escribí a mano.

**Corrección aplicada:** TA-139 (OP-42 a OP-44 y OP-51 en el dominio) y TA-194 (en la aplicación) pasan a la ola 1; TA-134 depende de TA-139 y TA-191 de TA-194. Quedan **17 tareas de la ola 2 después de HT-6** (eran 19). Revisé los otros 37 escenarios de la ola 1 buscando operaciones de la ola 2: no hay otro caso (ESC-08 y ESC-13 hablan del ciclo de la tarjeta, no de OP-19). Lo pregunto en P8-20 porque cambia lo aprobado en [B2].

---

## 27. Fundación: la matriz de pendientes

#### TA-015 Matriz: CA pendientes de punta a punta (DT-27) **[D]**

```tarea
orden: 299
bloque: B0
hito: —
depende: TA-007
tu: —
revision: obligatoria
paralelo: libre
tamano: prod=220 archivos=4 ca=0 migraciones=0 total=560
cubre: DT-27
pru: PRU-SEG-OPER-105
compartido: —
```

**Qué construir.**
- `pruebas/pendientes-e2e.json` (dato): una entrada por CA de una ficha [I] que se prueba con el estado sembrado porque la ficha que produce ese estado no existe todavía, con la ficha que lo completa (DT-27). Lo llena cada tarea de B6 con su campo `pendiente`.
- Regla de la matriz (CH-08): una ficha que completa pendientes no pasa a `terminada` sin una E2E cuyo título cite cada uno de esos CA; `features.json` marca esos CA de la ficha [I] como `pendiente_e2e` hasta entonces.
- `pruebas:matriz --puerta` falla si queda un pendiente cuya ficha no es [P]; el resumen de `pr:mergear` lista los pendientes que el PR abre o cierra.

**Leer.** 07 §13 (matriz), §27 (terminado de una ficha), §30 (puerta); DT-27 y CH-08 de este documento.

**Archivos.** `tools/pruebas/matriz/{pendientes,reglas}.ts`, `pruebas/pendientes-e2e.json` (dato), `tools/plan/resumen-revision.ts`.

**Pruebas primero.**
- **PRU-SEG-OPER-105** (nueva, DT-17): `pruebas:matriz` lee `pruebas/pendientes-e2e.json`: un CA pendiente sin la ficha que lo completa, o una ficha que lo completa en `terminada` sin una E2E que cite ese CA, es error; `--puerta` falla con un pendiente cuya ficha no es [P].
- La prueba nueva, con sus controles: una ficha que completa un pendiente pasa a `terminada` sin la E2E (error) y la puerta con un pendiente de una ficha [M] (falla).

**Comandos.** `pnpm test:unidad -t "PRU-SEG-OPER-105"`; `pnpm pruebas:matriz`; `pnpm ci:local`.

**Terminada cuando.** La prueba y sus controles pasan; `pendientes-e2e.json` existe vacío antes de la primera tarea de B6 que lo usa.


---

## 28. Bloque B7 — Fichas [M]

### 28.1 Fichas, tareas y rutas

| Ficha | Pri. | Título | CA | Tareas | Rutas que posee | Completa pendientes |
|---|---|---|---|---|---|---|
| FT-05 | M | Instalar como app y página sin conexión | 6 | TA-437 | — | — |
| FT-06 | M | Activar notificaciones en el dispositivo | 6 | TA-427 | `/ajustes/notificaciones` | — |
| FT-12 | M | Asignación rápida | 9 | TA-403 | — | — |
| FT-13 | M | Auto-asignar | 4 | TA-404 | `/presupuesto/auto-asignar` | — |
| FT-15 | M | Detalle de Listo para asignar | 5 | TA-400 | — | — |
| FT-20 | M | Fusionar categorías | 5 | TA-405 | `/presupuesto/categorias/[categoriaId]/fusionar` | — |
| FT-28 | M | Devoluciones | 9 | TA-406 | `/actividad/[transaccionId]/devolver`, `/actividad/[transaccionId]/eventos/eliminar` | CA-09.11, CA-14.8, CA-19.2, CA-24.3, CA-25.5 |
| FT-31 | M | Reserva excedente y saldo a favor | 4 | TA-401 | — | — |
| FT-32 | M | Cashback, avance y transferencia de deuda | 4 | TA-418 | — | — |
| FT-33 | M | Corte, pago y monto para no generar intereses, con recordatorio | 6 | TA-402 | — | — |
| FT-36 | M | Aprobar todos | 5 | TA-412 | — | — |
| FT-39 | M | Reglas de comercio | 4 | TA-411 | `/reglas`, `/reglas/[reglaId]`, `/reglas/nueva` | CA-21.10, CA-34.10, CA-35.11 |
| FT-40 | M | Administrar programadas | 8 | TA-413 | `/programadas`, `/programadas/[programadaId]`, `/programadas/nueva` | CA-19.1, CA-19.5 |
| FT-41 | M | Próximos pagos, registro de un toque y omitir | 6 | TA-414 | `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` | CA-08.8, CA-26.3, CA-34.9, CA-35.5, CA-37.4, CA-37.5 |
| FT-42 | M | Registro automático y puesta al día | 6 | TA-415 | — | CA-35.6 |
| FT-43 | M | Conciliar con estado de cuenta CSV | 10 | TA-416 | `/cuentas/[cuentaId]/conciliar` | CA-25.4, CA-26.6, CA-52.2 |
| FT-44 | M | Verificar saldo (conciliación manual) | 6 | TA-417 | `/cuentas/[cuentaId]/verificar-saldo` | — |
| FT-45 | M | Por cobrar y dinero en camino | 5 | TA-408 | `/por-cobrar` | — |
| FT-46 | M | Cobrar | 7 | TA-409 | `/por-cobrar/cobrar` | CA-25.6, CA-26.4, CA-29.4 |
| FT-47 | M | Condonar | 4 | TA-407 | `/por-cobrar/condonar/[lineaId]` | CA-19.3 |
| FT-48 | M | Renombrar deudor | 3 | TA-410 | `/por-cobrar/deudores/[deudorId]/renombrar` | — |
| FT-49 | P | Unir deudores | 3 | TA-549 | — | — |
| FT-55 | M | Condiciones y tabla de amortización | 4 | TA-419 | `/cuentas/[cuentaId]/condiciones` | CA-54.5 |
| FT-56 | P | Desembolso de préstamo | 3 | TA-500 | — | — |
| FT-57 | M | Inversiones: aporte, retiro y ajuste | 4 | TA-420 | — | — |
| FT-58 | P | Modelos de préstamo de otros bancos | 3 | TA-501 | — | — |
| FT-59 | P | Proyección de inversiones | 3 | TA-502 | — | — |
| FT-60 | M | Reportes base (producto §10) | 10 | TA-421 | `/reportes`, `/reportes/[tipo]` | — |
| FT-61 | M | Gasto semanal | 7 | TA-422 | — | — |
| FT-62 | M | Ritmo de gasto y proyección del cierre | 7 | TA-423 | — | CA-08.6 |
| FT-63 | M | Presupuesto contra la realidad y comparación con el promedio | 5 | TA-424 | — | — |
| FT-64 | P | Gastos hormiga | 5 | TA-503 | — | — |
| FT-65 | P | Suscripciones detectadas | 4 | TA-504 | — | — |
| FT-66 | M | Tarjetas en el tiempo | 4 | TA-425 | — | — |
| FT-67 | M | Hallazgos accionables | 4 | TA-426 | — | — |
| FT-68 | P | Flujo de efectivo | 3 | TA-505 | — | — |
| FT-69 | M | Centro de notificaciones | 6 | TA-428 | `/notificaciones` | — |
| FT-70 | M | Push de la bandeja con acciones | 7 | TA-429 | — | CA-34.4 |
| FT-71 | M | Push de programadas, cierre, metas, tarjetas y sistema | 14 | TA-430, TA-431 | — | CA-16.5 |
| FT-72 | M | Cambiar el ciclo | 6 | TA-432 | `/ajustes/ciclo` | — |
| FT-73 | M | Formatos bancarios e instituciones | 6 | TA-433 | `/ajustes/formatos`, `/ajustes/formatos/[formatoId]`, `/ajustes/formatos/nuevo`, `/ajustes/instituciones`, `/ajustes/instituciones/[institucionId]`, `/ajustes/instituciones/nueva` | — |
| FT-74 | M | Factores y sesiones | 4 | TA-434 | `/ajustes/seguridad`, `/ajustes/seguridad/factores/[factorId]/quitar` | — |
| FT-75 | M | Exportar | 3 | TA-435 | `/ajustes/exportar` | — |
| FT-76 | M | Respaldo y diagnóstico | 4 | TA-436 | `/ajustes/diagnostico`, `/ajustes/respaldo` | — |
| FT-77 | P | Apariencia | 3 | TA-506 | `/ajustes/apariencia` | — |
| FT-78 | M | Arrastrar un movimiento a una categoría | 15 | TA-438, TA-439 | — | — |

40 tareas de fichas (las 38 [M], 232 CA), 2 de recorridos y TA-470.

### 28.2 Tareas de fichas

#### TA-400 FT-15 Detalle de Listo para asignar

```tarea
orden: 700
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-169, TA-288
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-15.1, CA-15.2, CA-15.3, CA-15.4, CA-15.5
pru: —
compartido: —
fichas: FT-15
```

**Qué construir.**
- FT-15: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-15.1 a CA-15.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-15 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-15` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-401 FT-31 Reserva excedente y saldo a favor

```tarea
orden: 701
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-164, TA-169, TA-170, TA-291
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-31.1, CA-31.2, CA-31.3, CA-31.4
pru: —
compartido: —
fichas: FT-31
```

**Qué construir.**
- FT-31: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-31.1 a CA-31.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-31 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-31` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-402 FT-33 Corte, pago y monto para no generar intereses, con recordatorio

```tarea
orden: 702
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-169, TA-171, TA-173, TA-291, TA-303
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-33.1, CA-33.2, CA-33.3, CA-33.4, CA-33.5, CA-33.6
pru: —
compartido: —
fichas: FT-33
```

**Qué construir.**
- FT-33: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-33.1 a CA-33.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-33 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-33` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-403 FT-12 Asignación rápida

```tarea
orden: 703
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-164, TA-173, TA-174, TA-192, TA-289, TA-305
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=9 migraciones=0 total=1000
cubre: CA-12.1, CA-12.2, CA-12.3, CA-12.4, CA-12.5, CA-12.6, CA-12.7, CA-12.8, CA-12.9
pru: —
compartido: —
fichas: FT-12
```

**Qué construir.**
- FT-12: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-12.1 a CA-12.9, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-12 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-12` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-404 FT-13 Auto-asignar

```tarea
orden: 704
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-164, TA-169, TA-289, TA-305
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-13.1, CA-13.2, CA-13.3, CA-13.4, RUTA-/presupuesto/auto-asignar
pru: —
compartido: —
fichas: FT-13
```

**Qué construir.**
- FT-13: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-13.1 a CA-13.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/presupuesto/auto-asignar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-13 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-13` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-405 FT-20 Fusionar categorías

```tarea
orden: 705
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-163, TA-173, TA-198, TA-290, TA-283
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-20.1, CA-20.2, CA-20.3, CA-20.4, CA-20.5, RUTA-/presupuesto/categorias/[categoriaId]/fusionar
pru: —
compartido: —
fichas: FT-20
```

**Qué construir.**
- FT-20: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-20.1 a CA-20.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/presupuesto/categorias/[categoriaId]/fusionar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-20 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-20` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-406 FT-28 Devoluciones

```tarea
orden: 706
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-171, TA-173, TA-193, TA-198, TA-309, TA-288, TA-290, TA-306, TA-308
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=9 migraciones=0 total=1000
cubre: CA-28.1, CA-28.2, CA-28.3, CA-28.4, CA-28.5, CA-28.6, CA-28.7, CA-28.8, CA-28.9, RUTA-/actividad/[transaccionId]/devolver, RUTA-/actividad/[transaccionId]/eventos/eliminar
pru: —
compartido: —
fichas: FT-28
e2e: CA-09.11, CA-14.8, CA-19.2, CA-24.3, CA-25.5
```

**Qué construir.**
- FT-28: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-28.1 a CA-28.9, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/actividad/[transaccionId]/devolver`, `/actividad/[transaccionId]/eventos/eliminar`.
- **Completa pendientes de punta a punta (DT-27):** CA-09.11, CA-14.8, CA-19.2, CA-24.3, CA-25.5. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-28 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-28` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-407 FT-47 Condonar

```tarea
orden: 707
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-173, TA-193, TA-198, TA-306
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-47.1, CA-47.2, CA-47.3, CA-47.4, RUTA-/por-cobrar/condonar/[lineaId]
pru: —
compartido: —
fichas: FT-47
e2e: CA-19.3
```

**Qué construir.**
- FT-47: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-47.1 a CA-47.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/por-cobrar/condonar/[lineaId]`.
- **Completa pendientes de punta a punta (DT-27):** CA-19.3. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-47 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-47` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-408 FT-45 Por cobrar y dinero en camino

```tarea
orden: 708
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-169, TA-171, TA-193, TA-197, TA-293
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-45.1, CA-45.2, CA-45.3, CA-45.4, CA-45.5, RUTA-/por-cobrar
pru: —
compartido: —
fichas: FT-45
```

**Qué construir.**
- FT-45: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-45.1 a CA-45.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/por-cobrar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-45 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-45` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-409 FT-46 Cobrar

```tarea
orden: 709
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-173, TA-198, TA-408, TA-291, TA-309, TA-310
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-46.1, CA-46.2, CA-46.3, CA-46.4, CA-46.5, CA-46.6, CA-46.7, RUTA-/por-cobrar/cobrar
pru: —
compartido: —
fichas: FT-46
e2e: CA-25.6, CA-26.4, CA-29.4
```

**Qué construir.**
- FT-46: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-46.1 a CA-46.7, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/por-cobrar/cobrar`.
- **Completa pendientes de punta a punta (DT-27):** CA-25.6, CA-26.4, CA-29.4. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-46 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-46` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-410 FT-48 Renombrar deudor

```tarea
orden: 710
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-197, TA-408
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-48.1, CA-48.2, CA-48.3, RUTA-/por-cobrar/deudores/[deudorId]/renombrar
pru: —
compartido: —
fichas: FT-48
```

**Qué construir.**
- FT-48: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-48.1 a CA-48.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/por-cobrar/deudores/[deudorId]/renombrar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-48 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-48` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-411 FT-39 Reglas de comercio

```tarea
orden: 711
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-173, TA-179, TA-197, TA-283, TA-295, TA-293, TA-297
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-39.1, CA-39.2, CA-39.3, CA-39.4, RUTA-/reglas, RUTA-/reglas/[reglaId], RUTA-/reglas/nueva
pru: —
compartido: —
fichas: FT-39
e2e: CA-21.10, CA-34.10, CA-35.11
```

**Qué construir.**
- FT-39: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-39.1 a CA-39.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/reglas`, `/reglas/[reglaId]`, `/reglas/nueva`.
- **Completa pendientes de punta a punta (DT-27):** CA-21.10, CA-34.10, CA-35.11. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-39 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-39` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-412 FT-36 Aprobar todos

```tarea
orden: 712
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-179, TA-297
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-36.1, CA-36.2, CA-36.3, CA-36.4, CA-36.5
pru: —
compartido: —
fichas: FT-36
```

**Qué construir.**
- FT-36: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-36.1 a CA-36.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-36 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-36` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-413 FT-40 Administrar programadas

```tarea
orden: 713
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-173, TA-194, TA-197, TA-198, TA-283, TA-282, TA-306
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-40.1, CA-40.2, CA-40.3, CA-40.4, CA-40.5, CA-40.6, CA-40.7, CA-40.8, RUTA-/programadas, RUTA-/programadas/[programadaId], RUTA-/programadas/nueva
pru: —
compartido: —
fichas: FT-40
e2e: CA-19.1, CA-19.5
```

**Qué construir.**
- FT-40: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-40.1 a CA-40.8, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/programadas`, `/programadas/[programadaId]`, `/programadas/nueva`.
- **Completa pendientes de punta a punta (DT-27):** CA-19.1, CA-19.5. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-40 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-40` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-414 FT-41 Próximos pagos, registro de un toque y omitir

```tarea
orden: 714
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-169, TA-173, TA-194, TA-197, TA-198, TA-413, TA-295, TA-297, TA-299, TA-300, TA-310
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-41.1, CA-41.2, CA-41.3, CA-41.4, CA-41.5, CA-41.6, RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada]
pru: —
compartido: —
fichas: FT-41
e2e: CA-08.8, CA-26.3, CA-34.9, CA-35.5, CA-37.4, CA-37.5
```

**Qué construir.**
- FT-41: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-41.1 a CA-41.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/programadas/[programadaId]/ocurrencias/[fechaEsperada]`.
- **Completa pendientes de punta a punta (DT-27):** CA-08.8, CA-26.3, CA-34.9, CA-35.5, CA-37.4, CA-37.5. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-41 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-41` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-415 FT-42 Registro automático y puesta al día

```tarea
orden: 715
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-169, TA-172, TA-194, TA-197, TA-198, TA-413, TA-414, TA-297
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-42.1, CA-42.2, CA-42.3, CA-42.4, CA-42.5, CA-42.6
pru: —
compartido: —
fichas: FT-42
e2e: CA-35.6
```

**Qué construir.**
- FT-42: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-42.1 a CA-42.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- **Completa pendientes de punta a punta (DT-27):** CA-35.6. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-42 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-42` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-416 FT-43 Conciliar con estado de cuenta CSV

```tarea
orden: 716
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-165, TA-171, TA-172, TA-173, TA-184, TA-293, TA-309, TA-313, TA-310
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=10 migraciones=0 total=1000
cubre: CA-43.1, CA-43.2, CA-43.3, CA-43.4, CA-43.5, CA-43.6, CA-43.7, CA-43.8, CA-43.9, CA-43.10, RUTA-/cuentas/[cuentaId]/conciliar
pru: —
compartido: —
fichas: FT-43
e2e: CA-25.4, CA-26.6, CA-52.2
```

**Qué construir.**
- FT-43: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-43.1 a CA-43.10, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/cuentas/[cuentaId]/conciliar`.
- **Completa pendientes de punta a punta (DT-27):** CA-25.4, CA-26.6, CA-52.2. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-43 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-43` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-417 FT-44 Verificar saldo (conciliación manual)

```tarea
orden: 717
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-171, TA-173, TA-313
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-44.1, CA-44.2, CA-44.3, CA-44.4, CA-44.5, CA-44.6, RUTA-/cuentas/[cuentaId]/verificar-saldo
pru: —
compartido: —
fichas: FT-44
```

**Qué construir.**
- FT-44: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-44.1 a CA-44.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/cuentas/[cuentaId]/verificar-saldo`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-44 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-44` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-418 FT-32 Cashback, avance y transferencia de deuda

```tarea
orden: 718
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-165, TA-173, TA-291, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-32.1, CA-32.2, CA-32.3, CA-32.4
pru: —
compartido: —
fichas: FT-32
```

**Qué construir.**
- FT-32: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-32.1 a CA-32.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-32 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-32` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-419 FT-55 Condiciones y tabla de amortización

```tarea
orden: 719
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-171, TA-173, TA-282, TA-315
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-55.1, CA-55.2, CA-55.3, CA-55.4, RUTA-/cuentas/[cuentaId]/condiciones
pru: —
compartido: —
fichas: FT-55
e2e: CA-54.5
```

**Qué construir.**
- FT-55: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-55.1 a CA-55.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/cuentas/[cuentaId]/condiciones`.
- **Completa pendientes de punta a punta (DT-27):** CA-54.5. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-55 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-55` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-420 FT-57 Inversiones: aporte, retiro y ajuste

```tarea
orden: 720
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-171, TA-173, TA-192, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-57.1, CA-57.2, CA-57.3, CA-57.4
pru: —
compartido: —
fichas: FT-57
```

**Qué construir.**
- FT-57: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-57.1 a CA-57.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-57 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-57` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-421 FT-60 Reportes base (producto §10)

```tarea
orden: 721
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-141, TA-174, TA-288, TA-293
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=10 migraciones=0 total=1000
cubre: CA-60.1, CA-60.2, CA-60.3, CA-60.4, CA-60.5, CA-60.6, CA-60.7, CA-60.8, CA-60.9, CA-60.10, RUTA-/reportes, RUTA-/reportes/[tipo]
pru: —
compartido: —
fichas: FT-60
```

**Qué construir.**
- FT-60: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-60.1 a CA-60.10, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/reportes`, `/reportes/[tipo]`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-60 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-60` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-422 FT-61 Gasto semanal

```tarea
orden: 722
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-141, TA-174, TA-421
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-61.1, CA-61.2, CA-61.3, CA-61.4, CA-61.5, CA-61.6, CA-61.7
pru: —
compartido: —
fichas: FT-61
```

**Qué construir.**
- FT-61: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-61.1 a CA-61.7, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-61 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-61` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-423 FT-62 Ritmo de gasto y proyección del cierre

```tarea
orden: 723
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-129, TA-164, TA-169, TA-174, TA-299, TA-288
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-62.1, CA-62.2, CA-62.3, CA-62.4, CA-62.5, CA-62.6, CA-62.7
pru: —
compartido: —
fichas: FT-62
e2e: CA-08.6
```

**Qué construir.**
- FT-62: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-62.1 a CA-62.7, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- **Completa pendientes de punta a punta (DT-27):** CA-08.6. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-62 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-62` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-424 FT-63 Presupuesto contra la realidad y comparación con el promedio

```tarea
orden: 724
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-142, TA-164, TA-174, TA-305, TA-421
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-63.1, CA-63.2, CA-63.3, CA-63.4, CA-63.5
pru: —
compartido: —
fichas: FT-63
```

**Qué construir.**
- FT-63: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-63.1 a CA-63.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-63 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-63` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-425 FT-66 Tarjetas en el tiempo

```tarea
orden: 725
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-143, TA-164, TA-165, TA-174, TA-291, TA-303, TA-421
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-66.1, CA-66.2, CA-66.3, CA-66.4
pru: —
compartido: —
fichas: FT-66
```

**Qué construir.**
- FT-66: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-66.1 a CA-66.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-66 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-66` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-426 FT-67 Hallazgos accionables

```tarea
orden: 726
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-143, TA-164, TA-174, TA-194, TA-423, TA-425
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-67.1, CA-67.2, CA-67.3, CA-67.4
pru: —
compartido: —
fichas: FT-67
```

**Qué construir.**
- FT-67: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-67.1 a CA-67.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-67 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-67` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-427 FT-06 Activar notificaciones en el dispositivo

```tarea
orden: 727
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-196, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-06.1, CA-06.2, CA-06.3, CA-06.4, CA-06.5, CA-06.6, RUTA-/ajustes/notificaciones, FE-57
pru: PRU-SW-NOTIF-001
compartido: —
fichas: FT-06
```

**Qué construir.**
- FT-06: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-06.1 a CA-06.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/notificaciones`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-06 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- PRU-SW-NOTIF-001 (07).

**Comandos.** `pnpm pruebas:ft FT-06` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-428 FT-69 Centro de notificaciones

```tarea
orden: 728
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-185, TA-197, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-69.1, CA-69.2, CA-69.3, CA-69.4, CA-69.5, CA-69.6, RUTA-/notificaciones, FE-32, CF-23
pru: —
compartido: —
fichas: FT-69
```

**Qué construir.**
- FT-69: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-69.1 a CA-69.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/notificaciones`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-69 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-69` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-429 FT-70 Push de la bandeja con acciones

```tarea
orden: 729
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-178, TA-197, TA-427, TA-295, TA-428
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-70.1, CA-70.2, CA-70.3, CA-70.4, CA-70.5, CA-70.6, CA-70.7
pru: —
compartido: —
fichas: FT-70
e2e: CA-34.4
```

**Qué construir.**
- FT-70: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-70.1 a CA-70.7, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- **Completa pendientes de punta a punta (DT-27):** CA-34.4. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-70 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-70` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-430 FT-71 Push de programadas, cierre, metas, tarjetas y sistema (1 de 2)

```tarea
orden: 730
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-194, TA-197, TA-427, TA-304, TA-402, TA-413, TA-415
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-71.1, CA-71.2, CA-71.3, CA-71.4, CA-71.5, CA-71.6, CA-71.7
pru: —
compartido: —
fichas: FT-71
```

**Qué construir.**
- FT-71: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-71.1 a CA-71.7, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).

**Leer.** 06 FT-71 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-71` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA del trozo en verde; la ficha sigue `en_curso`.

#### TA-431 FT-71 Push de programadas, cierre, metas, tarjetas y sistema (2 de 2)

```tarea
orden: 731
bloque: B7
hito: HT-8
depende: TA-430, TA-304
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-71.8, CA-71.9, CA-71.10, CA-71.11, CA-71.12, CA-71.13, CA-71.14
pru: —
compartido: —
fichas: FT-71
e2e: CA-16.5
```

**Qué construir.**
- FT-71: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-71.8 a CA-71.14, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- **Completa pendientes de punta a punta (DT-27):** CA-16.5. Una E2E por CA, que recorre el flujo de esta ficha y verifica el resultado en la pantalla de la ficha [I], con el CA entre corchetes; esta tarea no pasa la ficha a `terminada` sin ellas (TA-015).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-71 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- Las E2E de los pendientes que completa (campo `e2e`).

**Comandos.** `pnpm pruebas:ft FT-71` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-432 FT-72 Cambiar el ciclo

```tarea
orden: 732
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-192, TA-288
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-72.1, CA-72.2, CA-72.3, CA-72.4, CA-72.5, CA-72.6, RUTA-/ajustes/ciclo
pru: —
compartido: —
fichas: FT-72
```

**Qué construir.**
- FT-72: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-72.1 a CA-72.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/ciclo`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-72 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-72` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-433 FT-73 Formatos bancarios e instituciones

```tarea
orden: 733
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-173, TA-195, TA-198, TA-295
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-73.1, CA-73.2, CA-73.3, CA-73.4, CA-73.5, CA-73.6, RUTA-/ajustes/formatos, RUTA-/ajustes/formatos/[formatoId], RUTA-/ajustes/formatos/nuevo, RUTA-/ajustes/instituciones, RUTA-/ajustes/instituciones/[institucionId], RUTA-/ajustes/instituciones/nueva
pru: —
compartido: —
fichas: FT-73
```

**Qué construir.**
- FT-73: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-73.1 a CA-73.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/formatos`, `/ajustes/formatos/[formatoId]`, `/ajustes/formatos/nuevo`, `/ajustes/instituciones`, `/ajustes/instituciones/[institucionId]`, `/ajustes/instituciones/nueva`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-73 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-73` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-434 FT-74 Factores y sesiones

```tarea
orden: 734
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-281
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-74.1, CA-74.2, CA-74.3, CA-74.4, RUTA-/ajustes/seguridad, RUTA-/ajustes/seguridad/factores/[factorId]/quitar
pru: —
compartido: —
fichas: FT-74
```

**Qué construir.**
- FT-74: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-74.1 a CA-74.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/seguridad`, `/ajustes/seguridad/factores/[factorId]/quitar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-74 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-74` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-435 FT-75 Exportar

```tarea
orden: 735
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-168, TA-172, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-75.1, CA-75.2, CA-75.3, RUTA-/ajustes/exportar
pru: —
compartido: —
fichas: FT-75
```

**Qué construir.**
- FT-75: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-75.1 a CA-75.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/exportar`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-75 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-75` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-436 FT-76 Respaldo y diagnóstico

```tarea
orden: 736
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-187, TA-280, TA-415
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-76.1, CA-76.2, CA-76.3, CA-76.4, RUTA-/ajustes/diagnostico, RUTA-/ajustes/respaldo
pru: —
compartido: —
fichas: FT-76
```

**Qué construir.**
- FT-76: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-76.1 a CA-76.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/diagnostico`, `/ajustes/respaldo`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-76 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-76` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-437 FT-05 Instalar como app y página sin conexión

```tarea
orden: 737
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=6 migraciones=0 total=1000
cubre: CA-05.1, CA-05.2, CA-05.3, CA-05.4, CA-05.5, CA-05.6, FE-58
pru: —
compartido: —
fichas: FT-05
```

**Qué construir.**
- FT-05: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-05.1 a CA-05.6, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-05 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-05` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-438 FT-78 Arrastrar un movimiento a una categoría (1 de 2)

```tarea
orden: 738
bloque: B7
hito: HT-8
depende: TA-210, TA-212, TA-219, TA-224, TA-172, TA-173, TA-174, TA-178, TA-179, TA-297
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=8 migraciones=0 total=1000
cubre: CA-78.1, CA-78.2, CA-78.3, CA-78.4, CA-78.5, CA-78.6, CA-78.7, CA-78.8
pru: PRU-E2E-BAND-001, PRU-REN-BAND-001
compartido: —
fichas: FT-78
```

**Qué construir.**
- FT-78: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-78.1 a CA-78.8, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).

**Leer.** 06 FT-78 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.
- PRU-E2E-BAND-001, PRU-REN-BAND-001 (07).

**Comandos.** `pnpm pruebas:ft FT-78` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** Los CA del trozo en verde; la ficha sigue `en_curso`.

#### TA-439 FT-78 Arrastrar un movimiento a una categoría (2 de 2)

```tarea
orden: 739
bloque: B7
hito: HT-8
depende: TA-438
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=7 migraciones=0 total=1000
cubre: CA-78.9, CA-78.10, CA-78.11, CA-78.12, CA-78.13, CA-78.14, CA-78.15
pru: —
compartido: —
fichas: FT-78
```

**Qué construir.**
- FT-78: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-78.9 a CA-78.15, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-78 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-78` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.


### 28.3 Recorridos y formatos de Banco Agrícola

#### TA-446 Recorridos de 06 §4.1, §4.2, §4.3 de punta a punta

```tarea
orden: 740
bloque: B7
hito: HT-8
depende: TA-400, TA-403, TA-404, TA-408, TA-415, TA-423, TA-424, TA-427, TA-428, TA-429, TA-431, TA-439
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=700
cubre: REC-4.1, REC-4.2, REC-4.3
pru: —
compartido: —
```

**Qué construir.**
- Una E2E por recorrido (06 §4.1), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Una E2E por recorrido (06 §4.2), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Una E2E por recorrido (06 §4.3), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Sin datos sembrados a mitad del recorrido: solo el estado de partida.

**Leer.** 06 §4.1, §4.2, §4.3 y §4.7; 07 §3.2 (proyectos de Playwright), §4.1 (relojes alineados), §12.4 (semillas).

**Archivos.** `apps/web/e2e/recorridos/*` (pruebas).

**Pruebas primero.**
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.1]` en el título.
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.2]` en el título.
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.3]` en el título.

**Comandos.** `pnpm test:e2e -- -g "REC-"`; `pnpm ci:local`.

**Terminada cuando.** Los recorridos pasan en `main` y en el nocturno.

#### TA-447 Recorridos de 06 §4.4, §4.5, §4.6 de punta a punta

```tarea
orden: 741
bloque: B7
hito: HT-8
depende: TA-400, TA-402, TA-416, TA-417, TA-418, TA-431
tu: —
revision: normal
paralelo: libre
tamano: prod=40 archivos=2 ca=0 migraciones=0 total=700
cubre: REC-4.4, REC-4.5, REC-4.6
pru: —
compartido: —
```

**Qué construir.**
- Una E2E por recorrido (06 §4.4), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Una E2E por recorrido (06 §4.5), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Una E2E por recorrido (06 §4.6), en el proyecto `movil`, que encadena las pantallas de sus fichas tal como las describe 06, con el estado de partida de 06 §4 y el reloj de prueba donde el recorrido cruza días (07 §4).
- Sin datos sembrados a mitad del recorrido: solo el estado de partida.

**Leer.** 06 §4.4, §4.5, §4.6 y §4.7; 07 §3.2 (proyectos de Playwright), §4.1 (relojes alineados), §12.4 (semillas).

**Archivos.** `apps/web/e2e/recorridos/*` (pruebas).

**Pruebas primero.**
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.4]` en el título.
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.5]` en el título.
- `PRU-E2E-REC-…` por recorrido (DT-21), con `[REC-4.6]` en el título.

**Comandos.** `pnpm test:e2e -- -g "REC-"`; `pnpm ci:local`.

**Terminada cuando.** Los recorridos pasan en `main` y en el nocturno.

#### TA-470 Formatos de Banco Agrícola reescritos y F-2 activo (SP-01, CH-03)

```tarea
orden: 742
bloque: B7
hito: HT-9
depende: TA-181, TA-176, TA-180, TA-433
tu: TU-14
revision: obligatoria
paralelo: no
tamano: prod=80 archivos=2 ca=0 migraciones=1 total=520
cubre: SP-01-Agricola
pru: PRU-DOM-BAND-106
compartido: —
```

**Qué construir.**
- Migración manual `m_formatos_agricola` con bloqueo (03 §11.2), como TA-181: F-2 reescrito desde las muestras de TU-14 y `activo = true`; F-3 (Cuscatlán) sigue inactivo con su exclusión firmada (CH-03).
- Si Agrícola no ofrece CSV (TU-14), la exclusión firmada queda en `resultados.md` (la escribís vos) y la conciliación de esas cuentas es FT-44.

**Leer.** 03 §7.6, §9.5, §11.2; 04 §8.5, SP-01; CH-03; §6 y TU-14 de este documento; TA-181.

**Archivos.** `packages/db/prisma/migrations/<fecha>_m_formatos_agricola/`, `packages/sms/pruebas/muestras/agricola/*` (datos), `catalogo-esperado.txt`.

**Pruebas primero.**
- **PRU-DOM-BAND-106** (nueva, DT-17): cada formato de Banco Agrícola reescrito reconoce sus muestras anonimizadas con los campos esperados y pasa la política de patrones; `muestras-cobertura.json` cubre la institución.
- La prueba nueva sobre las muestras.

**Comandos.** `pnpm ci:politica-patrones`; `pnpm test:unidad -t "PRU-DOM-BAND-106"`; `pnpm pruebas:puerta --simular`; `pnpm ci:local`.

**Terminada cuando.** La política pasa con F-2 activo y `pruebas:puerta` ya no marca la condición 2 de 07 §30 por los SMS de Agrícola.


---

## 29. Bloque B8 — Fichas [P] y FT-49

Después de HT-9, sin hito (supuesto 5 del Paso 1). Las 7 fichas [P] tienen 24 CA; FT-49, 3.

#### TA-500 FT-56 Desembolso de préstamo

```tarea
orden: 900
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-173, TA-192, TA-282
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-56.1, CA-56.2, CA-56.3
pru: —
compartido: —
fichas: FT-56
```

**Qué construir.**
- FT-56: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-56.1 a CA-56.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-56 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-56` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-501 FT-58 Modelos de préstamo de otros bancos

```tarea
orden: 901
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-167, TA-171, TA-173
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-58.1, CA-58.2, CA-58.3
pru: —
compartido: —
fichas: FT-58
```

**Qué construir.**
- FT-58: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-58.1 a CA-58.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-58 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-58` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-502 FT-59 Proyección de inversiones

```tarea
orden: 902
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-171
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-59.1, CA-59.2, CA-59.3
pru: —
compartido: —
fichas: FT-59
```

**Qué construir.**
- FT-59: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-59.1 a CA-59.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-59 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-59` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-503 FT-64 Gastos hormiga

```tarea
orden: 903
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-142, TA-174, TA-308
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=5 migraciones=0 total=1000
cubre: CA-64.1, CA-64.2, CA-64.3, CA-64.4, CA-64.5
pru: —
compartido: —
fichas: FT-64
```

**Qué construir.**
- FT-64: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-64.1 a CA-64.5, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-64 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-64` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-504 FT-65 Suscripciones detectadas

```tarea
orden: 904
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-142, TA-174, TA-194
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=4 migraciones=0 total=1000
cubre: CA-65.1, CA-65.2, CA-65.3, CA-65.4
pru: —
compartido: —
fichas: FT-65
```

**Qué construir.**
- FT-65: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-65.1 a CA-65.4, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-65 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-65` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-505 FT-68 Flujo de efectivo

```tarea
orden: 905
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-143, TA-164, TA-174
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-68.1, CA-68.2, CA-68.3
pru: —
compartido: —
fichas: FT-68
```

**Qué construir.**
- FT-68: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-68.1 a CA-68.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-68 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-68` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-506 FT-77 Apariencia

```tarea
orden: 906
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-280
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-77.1, CA-77.2, CA-77.3, RUTA-/ajustes/apariencia
pru: —
compartido: —
fichas: FT-77
```

**Qué construir.**
- FT-77: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-77.1 a CA-77.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que crea (dueña, DT-23): `/ajustes/apariencia`.
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-77 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-77` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.

#### TA-549 FT-49 Unir deudores

```tarea
orden: 907
bloque: B8
hito: —
depende: TA-210, TA-212, TA-219, TA-224, TA-166, TA-197
tu: —
revision: normal
paralelo: libre
tamano: prod=360 archivos=10 ca=3 migraciones=0 total=1000
cubre: CA-49.1, CA-49.2, CA-49.3, CF-03
pru: —
compartido: —
fichas: FT-49
```

**Qué construir.**
- **Bloqueada (DT-31):** FT-49 está diferida (CF-03, M13). La tarea existe para que sus CA tengan dueña; `plan/tareas.json` la crea en `bloqueada` con el motivo "CF-03" y `plan:siguiente` no la ofrece hasta que decidas sacarla de la lista diferida.
- FT-49: las pantallas y flujos de la ficha (Flujo, Piezas, Estados, Errores y textos) para CA-49.1 a CA-49.3, con las consultas y operaciones que ya existen (B2 y B3) y los componentes de B4.
- Server Actions de sus operaciones en `servidor/acciones/<area>.ts`; ACCESO-001 y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Último PR de la ficha: `features.json` en `terminada` (07 §27).

**Leer.** 06 FT-49 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7; 04 §6 (sus consultas); 06-identidad-visual §3 si su pantalla está en las capturas.

**Archivos.** `apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

**Pruebas primero.**
- Una prueba por CA de este trozo en el nivel de 07 §17 (DT-21), con el CA entre corchetes.

**Comandos.** `pnpm pruebas:ft FT-49` sin faltantes en este trozo; `pnpm ci:local` con la E2E de la ficha.

**Terminada cuando.** `pruebas:ft` sin CA faltantes, la ficha en `terminada` (07 §27) y, si completa pendientes, sus E2E en verde.


---

## 30. CA pendientes de punta a punta (P8-19.1)

### 30.1 Lista

**31 CA de 16 fichas [I].** 28 los completan 12 fichas [M]; 3, fichas [I] posteriores; 0, fichas [P].

| Ficha que lo completa | Pri. | CA pendientes (ficha [I] donde se prueban) | Cant. | Tarea que agrega la E2E |
|---|---|---|---|---|
| FT-27 Transacción olvidada y cambios retroactivos | I | CA-08.5 (TA-298) | 1 | TA-311 |
| FT-30 Pagar tarjeta con desglose y pago excedente | I | CA-08.7 (TA-299) | 1 | TA-303 |
| FT-34 Recepción y procesamiento de SMS | I | CA-03.3 (TA-284) | 1 | TA-295 |
| FT-28 Devoluciones | M | CA-09.11 (TA-288), CA-14.8 (TA-290), CA-19.2 (TA-306), CA-24.3 (TA-308), CA-25.5 (TA-309) | 5 | TA-406 |
| FT-39 Reglas de comercio | M | CA-21.10 (TA-293), CA-34.10 (TA-295), CA-35.11 (TA-297) | 3 | TA-411 |
| FT-40 Administrar programadas | M | CA-19.1 (TA-306), CA-19.5 (TA-306) | 2 | TA-413 |
| FT-41 Próximos pagos, registro de un toque y omitir | M | CA-08.8 (TA-299), CA-26.3 (TA-310), CA-34.9 (TA-295), CA-35.5 (TA-296), CA-37.4 (TA-300), CA-37.5 (TA-300) | 6 | TA-414 |
| FT-42 Registro automático y puesta al día | M | CA-35.6 (TA-296) | 1 | TA-415 |
| FT-43 Conciliar con estado de cuenta CSV | M | CA-25.4 (TA-309), CA-26.6 (TA-310), CA-52.2 (TA-313) | 3 | TA-416 |
| FT-46 Cobrar | M | CA-25.6 (TA-309), CA-26.4 (TA-310), CA-29.4 (TA-291) | 3 | TA-409 |
| FT-47 Condonar | M | CA-19.3 (TA-306) | 1 | TA-407 |
| FT-55 Condiciones y tabla de amortización | M | CA-54.5 (TA-315) | 1 | TA-419 |
| FT-62 Ritmo de gasto y proyección del cierre | M | CA-08.6 (TA-298) | 1 | TA-423 |
| FT-70 Push de la bandeja con acciones | M | CA-34.4 (TA-294) | 1 | TA-429 |
| FT-71 Push de programadas, cierre, metas, tarjetas y sistema | M | CA-16.5 (TA-304) | 1 | TA-431 |

Todos se cierran antes de HT-8; ninguno depende de una ficha [P], así que la puerta no tiene excepciones por esta regla.

### 30.2 Aciertos del barrido descartados

| CA | Por qué no es pendiente |
|---|---|
| CA-03.3 (FT-73) | "ningún formato": no necesita un formato creado por FT-73 (se mantiene como pendiente hacia FT-34, ficha [I]) |
| CA-04.8 | "avance" de la plantilla, no un avance de efectivo (FT-32) |
| CA-04.11 | FT-77 solo comparte el mecanismo de preferencia del dispositivo; el dato lo produce FT-04 |
| CA-08.3, CA-08.12 | "En camino" lo produce una línea por cobrar registrada con FT-21 (ficha [I]) |
| CA-08.10, CA-29.8 | La fecha de pago es un dato de la cuenta (FT-50) y el monto lo calcula el motor; FT-33 solo lo muestra |
| CA-09.12 | "arrastre" del Disponible, no el arrastre de FT-78 |
| CA-18.2 | Pide ausencia de programadas y reglas, no su existencia |
| CA-21.2, CA-21.3, CA-21.4, CA-21.6 | Las líneas por cobrar y los deudores los crea FT-21 misma |
| CA-27.6 | El resumen lo produce FT-27 misma; "otro dispositivo" no depende de FT-77 |
| CA-30.1 | "ciclo" de la tarjeta, no el cambio de ciclo de FT-72 |
| CA-30.4, CA-30.5 | El saldo a favor lo produce el pago de FT-30 misma |
| CA-34.14 | SMS sintéticos (⚠ S6-1); la devolución no se registra |
| CA-35.4 | La regla la crea FT-35 misma ("Recordar esta categoría") |
| CA-52.4 | "Conciliar" deshabilitado en una cuenta archivada; no necesita una conciliación |

---

## 31. Paralelismo consolidado (§1.8)

La tabla de pares de §1.8 queda así para todo el plan:

| Grupo | Tareas | Regla |
|---|---|---|
| Migraciones | TA-051, TA-053, TA-054, TA-055, TA-056, TA-057, TA-058, TA-181, TA-470 | Una a la vez (C2 rechaza el orden de carpetas cruzado); además, TA-051 a TA-059 son `paralelo: no` |
| `paralelo: no` | TA-050, TA-051, TA-052, TA-053, TA-054, TA-055, TA-056, TA-057, TA-058, TA-059, TA-200, TA-470 | Ninguna otra en paralelo |
| Dependencias npm nuevas | TA-200, TA-201, TA-204, TA-209, TA-210, TA-214, TA-219, TA-222, TA-223, TA-438 | Una a la vez: `pnpm-lock.yaml` choca. Una tarea que no figura aquí y necesita una dependencia la agrega como desvío (§1.5) y espera a que no corra otra del grupo |
| E2E local | Desde TA-219, todas | El candado de `pnpm test:e2e` (DT-22) ordena las corridas; las tareas van en paralelo |
| Mismo archivo de producción | Las declaradas en `paralelo: con` (B0 y TA-176, TA-181, TA-182) | Como dice cada ficha |
| Server Actions de un área | Dos tareas de fichas que agregan acciones al mismo `servidor/acciones/<area>.ts` | Pueden ir en paralelo: cada acción es una línea nueva; el segundo PR rebasa |

**Dependencias npm de cada tarea del grupo:** TA-200: next, react, react-dom; TA-201: tailwindcss, next-themes; TA-204: primitivos de shadcn/ui (Radix); TA-209: d3-scale, d3-shape; TA-210: react-hook-form, @hookform/resolvers; TA-214: @supabase/ssr; TA-219: @playwright/test, otpauth; TA-222: @lhci/cli; TA-223: @serwist/turbopack; TA-438: @dnd-kit/core (carga diferida, V6-08).

Con 2 agentes (P8-5), `pnpm plan:siguiente` ofrece la siguiente tarea disponible que no choca con la que está en curso según esta tabla.

---

## 32. Plantilla del encargo (DT-29)

Para asignar una tarea: abrís una sesión de Claude Code en `C:\finn\repo`, corrés `pnpm plan:siguiente`, y le pasás al agente la salida de `pnpm plan:encargo TA-nnn`. `CLAUDE.md` se carga solo; el encargo agrega la ficha. La plantilla es esta (las llaves son campos de la ficha):

````markdown
# Encargo {id} — {título}

Sos el agente de la tarea {id} de Finn 2.0. Seguí `CLAUDE.md` (se carga solo). Esta es tu única tarea en esta sesión.

## Datos
- Bloque {bloque}, hito {hito}, revisión **{revision}**. Depende de: {depende} (deben figurar `terminada` en `plan/tareas.json`).
- Cubre: {cubre}. Pruebas con identificador: {pru}. [Pendientes de punta a punta: {pendiente}.] [E2E que completás: {e2e}.]
- Tamaño estimado: {tamano}. Si el diff medido pasa un límite de DT-01, pará y proponé cómo partirla.
- Paralelo: {paralelo}. TU necesarias: {tu}.

## Qué construir / Leé solo esto / Archivos / Pruebas primero / Comandos / Terminada cuando
{las seis secciones de la ficha, tal cual}

## Al terminar
1. `pnpm ci:local` en verde; máximo 2 pushes (DT-07).
2. `pnpm pr:mergear <n> --resumen` y pegá la salida en el PR.
3. Descripción del PR = el informe de `CLAUDE.md`, con **Qué mirar** apuntando a lo más riesgoso del cambio.
4. Obligatoria: esperá el "mergeá" del usuario y `pnpm pr:mergear <n> --aprobado`. Normal: `pnpm pr:mergear <n>`.
5. Si encontrás una contradicción entre documentos, no la resuelvas en el código: informala con una propuesta de CH y esperá.
````

`tools/plan/encargo.ts` es la plantilla ejecutable (TA-002 lo copia del zip de esta fase con `plan:verificar`; `pnpm plan:encargo` lo llama). El encargo generado de TA-289 está en el zip de verificación (`salidas/encargo-TA-289.md`) como ejemplo.

---

## 33. Mapa de la Parte D

52 tareas: TA-015, 43 de B7 y 8 de B8. **2 de revisión obligatoria** (TA-015 y TA-470). 2 pruebas nuevas con identificador (DT-17), además de las de los CA (DT-21).

| Orden | Tarea | Bloque | Hito | Revisión | Título | Prod. | Mig. |
|---|---|---|---|---|---|---|---|
| 299 | TA-015 | B0 | — | obligatoria | Matriz: CA pendientes de punta a punta (DT-27) **[D]** | 220 | 0 |
| 700 | TA-400 | B7 | HT-8 | normal | FT-15 Detalle de Listo para asignar | 360 | 0 |
| 701 | TA-401 | B7 | HT-8 | normal | FT-31 Reserva excedente y saldo a favor | 360 | 0 |
| 702 | TA-402 | B7 | HT-8 | normal | FT-33 Corte, pago y monto para no generar intereses, con recordatorio | 360 | 0 |
| 703 | TA-403 | B7 | HT-8 | normal | FT-12 Asignación rápida | 360 | 0 |
| 704 | TA-404 | B7 | HT-8 | normal | FT-13 Auto-asignar | 360 | 0 |
| 705 | TA-405 | B7 | HT-8 | normal | FT-20 Fusionar categorías | 360 | 0 |
| 706 | TA-406 | B7 | HT-8 | normal | FT-28 Devoluciones | 360 | 0 |
| 707 | TA-407 | B7 | HT-8 | normal | FT-47 Condonar | 360 | 0 |
| 708 | TA-408 | B7 | HT-8 | normal | FT-45 Por cobrar y dinero en camino | 360 | 0 |
| 709 | TA-409 | B7 | HT-8 | normal | FT-46 Cobrar | 360 | 0 |
| 710 | TA-410 | B7 | HT-8 | normal | FT-48 Renombrar deudor | 360 | 0 |
| 711 | TA-411 | B7 | HT-8 | normal | FT-39 Reglas de comercio | 360 | 0 |
| 712 | TA-412 | B7 | HT-8 | normal | FT-36 Aprobar todos | 360 | 0 |
| 713 | TA-413 | B7 | HT-8 | normal | FT-40 Administrar programadas | 360 | 0 |
| 714 | TA-414 | B7 | HT-8 | normal | FT-41 Próximos pagos, registro de un toque y omitir | 360 | 0 |
| 715 | TA-415 | B7 | HT-8 | normal | FT-42 Registro automático y puesta al día | 360 | 0 |
| 716 | TA-416 | B7 | HT-8 | normal | FT-43 Conciliar con estado de cuenta CSV | 360 | 0 |
| 717 | TA-417 | B7 | HT-8 | normal | FT-44 Verificar saldo (conciliación manual) | 360 | 0 |
| 718 | TA-418 | B7 | HT-8 | normal | FT-32 Cashback, avance y transferencia de deuda | 360 | 0 |
| 719 | TA-419 | B7 | HT-8 | normal | FT-55 Condiciones y tabla de amortización | 360 | 0 |
| 720 | TA-420 | B7 | HT-8 | normal | FT-57 Inversiones: aporte, retiro y ajuste | 360 | 0 |
| 721 | TA-421 | B7 | HT-8 | normal | FT-60 Reportes base (producto §10) | 360 | 0 |
| 722 | TA-422 | B7 | HT-8 | normal | FT-61 Gasto semanal | 360 | 0 |
| 723 | TA-423 | B7 | HT-8 | normal | FT-62 Ritmo de gasto y proyección del cierre | 360 | 0 |
| 724 | TA-424 | B7 | HT-8 | normal | FT-63 Presupuesto contra la realidad y comparación con el promedio | 360 | 0 |
| 725 | TA-425 | B7 | HT-8 | normal | FT-66 Tarjetas en el tiempo | 360 | 0 |
| 726 | TA-426 | B7 | HT-8 | normal | FT-67 Hallazgos accionables | 360 | 0 |
| 727 | TA-427 | B7 | HT-8 | normal | FT-06 Activar notificaciones en el dispositivo | 360 | 0 |
| 728 | TA-428 | B7 | HT-8 | normal | FT-69 Centro de notificaciones | 360 | 0 |
| 729 | TA-429 | B7 | HT-8 | normal | FT-70 Push de la bandeja con acciones | 360 | 0 |
| 730 | TA-430 | B7 | HT-8 | normal | FT-71 Push de programadas, cierre, metas, tarjetas y sistema (1 de 2) | 360 | 0 |
| 731 | TA-431 | B7 | HT-8 | normal | FT-71 Push de programadas, cierre, metas, tarjetas y sistema (2 de 2) | 360 | 0 |
| 732 | TA-432 | B7 | HT-8 | normal | FT-72 Cambiar el ciclo | 360 | 0 |
| 733 | TA-433 | B7 | HT-8 | normal | FT-73 Formatos bancarios e instituciones | 360 | 0 |
| 734 | TA-434 | B7 | HT-8 | normal | FT-74 Factores y sesiones | 360 | 0 |
| 735 | TA-435 | B7 | HT-8 | normal | FT-75 Exportar | 360 | 0 |
| 736 | TA-436 | B7 | HT-8 | normal | FT-76 Respaldo y diagnóstico | 360 | 0 |
| 737 | TA-437 | B7 | HT-8 | normal | FT-05 Instalar como app y página sin conexión | 360 | 0 |
| 738 | TA-438 | B7 | HT-8 | normal | FT-78 Arrastrar un movimiento a una categoría (1 de 2) | 360 | 0 |
| 739 | TA-439 | B7 | HT-8 | normal | FT-78 Arrastrar un movimiento a una categoría (2 de 2) | 360 | 0 |
| 740 | TA-446 | B7 | HT-8 | normal | Recorridos de 06 §4.1, §4.2, §4.3 de punta a punta | 40 | 0 |
| 741 | TA-447 | B7 | HT-8 | normal | Recorridos de 06 §4.4, §4.5, §4.6 de punta a punta | 40 | 0 |
| 742 | TA-470 | B7 | HT-9 | obligatoria | Formatos de Banco Agrícola reescritos y F-2 activo (SP-01, CH-03) | 80 | 1 |
| 900 | TA-500 | B8 | — | normal | FT-56 Desembolso de préstamo | 360 | 0 |
| 901 | TA-501 | B8 | — | normal | FT-58 Modelos de préstamo de otros bancos | 360 | 0 |
| 902 | TA-502 | B8 | — | normal | FT-59 Proyección de inversiones | 360 | 0 |
| 903 | TA-503 | B8 | — | normal | FT-64 Gastos hormiga | 360 | 0 |
| 904 | TA-504 | B8 | — | normal | FT-65 Suscripciones detectadas | 360 | 0 |
| 905 | TA-505 | B8 | — | normal | FT-68 Flujo de efectivo | 360 | 0 |
| 906 | TA-506 | B8 | — | normal | FT-77 Apariencia | 360 | 0 |
| 907 | TA-549 | B8 | — | normal | FT-49 Unir deudores | 360 | 0 |

---

## 34. Revisiones de la Parte D

### 34.1 Cobertura

- **Objetivos de la Parte D:** 310 del catálogo, cada uno con una sola tarea dueña:
  - los 259 CA de las 38 fichas [M] (232), las 7 [P] (24) y FT-49 (3);
  - 35 rutas, los 6 recorridos de 06 §4, FE-32, FE-57 y FE-58, CF-03 y CF-23;
  - PRU-SW-NOTIF-001, PRU-E2E-BAND-001 y PRU-REN-BAND-001;
  - dos objetivos nuevos de esta parte: SP-01-Agricola (TA-470, CH-03) y DT-27 (TA-015).
- **El plan completo cubre los 1.424 objetivos del catálogo** (A 113, con DT-33 [F8]; B 608, C 393, D 310), y el catálogo contiene los 1.092 que derivan los documentos enmendados (V8-01).
- **FT-07** (migración desde la 1.0) está retirada en 06 (CF-14) y no tiene CA: no tiene tarea.

### 34.2 Hallazgos

- **ESC-44 necesita una programada (§26.6).** Error mío en el ajuste [B2], corregido: TA-139 y TA-194 pasan a la ola 1. Lo pregunto en P8-20.
- **Las dependencias de B7 salen de las tablas de 06** (DT-28), no de una lista escrita a mano. Así, una ficha [M] no puede quedar antes de la operación que usa: si pasara, el verificador lo marca como dependencia posterior (E5).
- **`/ajustes/diagnostico`** la citan FT-42 y FT-76. La posee FT-76 (DT-23); FT-42 agrega su sección "puesta al día".
- **Ningún pendiente de punta a punta depende de una ficha [P]** (§30.1), así que la regla de [P] de P8-19.1 hoy no se usa: queda para los que aparezcan al construir.
- **El tamaño de las tareas de fichas es una estimación uniforme**, como en B6. `pr:mergear` parte la que no entre (TA-230 a TA-249 o, en B7, TA-448 a TA-469 y TA-471 a TA-499).
- **Carga de revisión total: 71 de 243 tareas obligatorias.** Por parte: A 8 de 15 (con TA-014 y TA-015), B 51 de 112, C 11 de 65 y D 1 de 51 (TA-470). Las fichas [M] y [P] son todas normales (DT-20).

### 34.3 Riesgos de la Parte D

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RD-1 | Aparecen más CA pendientes de punta a punta al construir las fichas [I] | Media | Bajo | El agente los agrega como `pendiente` y los informa como desvío; E12 obliga a cerrarlos antes de HT-8 |
| RD-2 | Las muestras de Banco Agrícola no llegan | Media | Alto | TA-470 bloquea solo HT-9 (CH-03): el resto del plan sigue |
| RD-3 | FT-71 o FT-78 pasan del tamaño aun partidas | Media | Bajo | `pr:mergear` las parte otra vez |
| RD-4 | Las E2E de los recorridos son lentas en `main` | Media | Medio | Corren en `main` y en el nocturno, no en cada PR (07 §6) |

---

## 35. Verificación de la Parte D y del plan completo

**Entorno:** Node 22.22.0 con la eliminación de tipos (este entorno no tiene Node 24) y Python 3.13. Documentos 01 a 07 en disco (`verificacion/docs/`). Salidas en `08-tareas-verificacion.zip`.

| # | Qué se verificó | Resultado | Hallazgos | No verificado |
|---|---|---|---|---|
| V8-01 | `verificar.ts` sobre el plan completo (`--docs docs --negativo`, sin `--parte`), y sobre las partes A, B y C solas | **Pasa.** 243 tareas, 10 hitos con bloque (HT-0 a HT-9), 20 TU. **1.424 objetivos, cada uno con una sola tarea dueña** (**[F8]** con DT-33). Sin ciclos ni dependencias hacia adelante. Tamaños dentro de DT-01, con la única excepción aprobada (DT-15). HT-0 a HT-9 alcanzables con sus TU; HT-9 encadena HT-4 a HT-8 y cubre las 69 fichas [I] y [M] (465 CA). Los 31 pendientes de punta a punta tienen su E2E y se cierran antes de HT-8. **Control negativo: 24 de 24 mutaciones detectadas**: las 20 anteriores, 3 de la Parte D (un pendiente sin su E2E, HT-8 sin la tarea que lo cierra, HT-9 antes de HT-8) y 1 de E13 **[F8]**. Las partes A, B y C solas también pasan | Primera corrida, 2 errores reales, corregidos: <br>- la ola 1 creció (TA-139 y TA-194) y la última tarea de B3 chocó con TA-251 en el `orden` 192: TA-250, TA-251 y TA-253 pasan a 193 a 195; <br>- el encadenado de hitos no era transitivo: HT-9 no veía los escenarios de la ola 2, que exige por sus fichas [M] a través de HT-8 → HT-2 y HT-3. <br>Además, TA-015 tomaba un número de prueba que ya tenía TA-261; ahora las tareas agregadas después numeran al final, y **ningún identificador de prueba aprobado cambió** (comparado contra el documento de la Parte C) <br>**[F8] E13 (P8-20):** para cada uno de los 50 ESC, el verificador deriva de 01 §8 las operaciones que necesita. Mira el encabezado (historial, estado inicial, "continúa"), el paso 0 y la columna Operación de cada paso, más las cuentas y categorías de 01 §8.0 (OP-01 y OP-07). Exige que la dueña de cada operación (`OP-nn@dom` para `@motor`, `OP-nn` para `@int`) vaya antes que la tarea del escenario y esté entre sus dependencias. **Ningún otro escenario necesita una operación de una ola u orden posterior.** Encontró, en cambio, una dependencia que faltaba: los lotes de escenarios de la ola 1 (TA-130 a TA-133 y TA-188 a TA-190) necesitan crear categorías (OP-07) y no dependían de su tarea. El orden era correcto, pero `plan:siguiente` podía lanzarlos antes. Se agregaron TA-115 a TA-130 y TA-163 a TA-188; el resto las hereda. Control negativo nuevo: mover TA-139 a la ola 2 sin tocar las dependencias, el error original, falla con E13. **24 de 24 mutaciones detectadas.** La derivación lee texto con una tabla de palabras, revisada sobre los 50: dos falsos positivos corregidos ("devolver la reserva" no es OP-33; la columna Operación de ESC-49 está corrida por la columna de fecha). En el repositorio, desde TA-130, la regla lee los campos `op` de los archivos de datos (`--escenarios`) | Node 24 |
| V8-02 | Minutos y meses (`estimacion.ts`) con todos los bloques exactos | **243 tareas** (235 hasta la puerta). **2 pushes por PR:** 25,8 min por PR, 51 PR al mes con producción: **4,4 meses** hasta la puerta y 4,6 hasta terminar las [P]. **3,75 pushes por PR:** 6,1 meses. Antes de HT-5 (sin producción): 130 tareas | B7 dio 43 tareas (con TA-470 y los recorridos), apenas por debajo de lo estimado en la Parte C (44 a 54) | El ritmo real de agentes y revisiones: con 71 obligatorias, tu revisión puede marcar el paso más que la CI |
| V8-03 | Cada PRU de un campo `pru` frente a 07 en disco | **220 PRU:** 109 definidos en 07, 5 por un CH y 106 nuevos (DT-17). **[F8]** Con 07 enmendado: 114 definidos en 07 y ninguno solo por un CH, porque CH-04, CH-05 y CH-06 ya están en 07. Los 114 PRU de 07 que el catálogo pide tienen una sola dueña | — | — |
| V8-04 | Plantilla del encargo (`encargo.ts --todas --negativo`) | **Pasa.** 243 encargos generados, cada uno con sus seis secciones; **868 referencias "0n §x.y"** de los campos "Leer", todas existentes en su documento. Control negativo: una referencia inexistente y una sección vacía, detectadas. Ejemplo: `salidas/encargo-TA-289.md` | La primera corrida marcó 4 referencias: una real del lector (`01 §5.0.7` es un encabezado en negrita) y tres falsas, porque el lector confundía `(CF-02)` u `(OP-06)` con los documentos 02 y 06. Corregido el lector; las fichas no cambiaron | Referencias a `06-identidad-visual.md` (no está en `docs/`) y a secciones de este documento |
| V8-05 | `anexos.ts` contra los archivos reales | **Pendiente:** la carpeta no está conectada todavía (comprobado al empezar esta parte; tu equipo no tiene carpetas agregadas). La prueba sintética del script sigue pasando (`salidas/v8_05.salida.txt`) | — | Los 34 archivos reales (P8-19.2) |
| V8-06 **[F8]** | Enmiendas CH-01 a CH-08 (`cierre/enmiendas_f8.py --negativo`), y el plan contra los documentos enmendados | **Pasa.** Cada CH está en su documento, cada documento tiene su línea de la Fase 8 y toda línea cambiada lleva [F8]. 0 líneas borradas; las 6 filas nuevas de 07 son las previstas; los 492 CA de 06 quedan idénticos. Control negativo: 3 de 3. Con los documentos enmendados en `docs/`, V8-01, V8-03 y V8-04 dan los mismos resultados: el catálogo deriva 1.092 objetivos: los mismos 492 CA, 50 ESC, 28 invariantes, 34 CB, 24 AV, 78 rutas, 53 operaciones y 9 técnicas, más 4 PRU que 07 ahora define (PRU-SEG-CONC-001 y PRU-INT-POOL-001, 003 y 005); PRU-MAN-CTA-002 también está ya en la lista manual de 07 | La primera corrida de `aplicar_f8.py` se detuvo en un ancla repetida (§36.2). `catalogo.py` contaba dos veces los PRU que CH-05 y CH-06 ahora definen en 07: se corrigió | Los scripts de las fases 4 a 7 y la matriz de 07, que están en los zips (§36.3) |

---

## 36. Cierre de la fase

### 36.1 El plan

| Bloque | Tareas | Hito | Parte |
|---|---|---|---|
| B0 Fundación | 15 (TA-001 a TA-015) | HT-0 | A (TA-014 [B2], TA-015 [D]) |
| B1 Base de datos | 10 | HT-1 | B |
| B2 Dominio | 48 (38 en la ola 1) | HT-2 | B |
| B3 Aplicación, SMS y conciliación | 50 (43 en la ola 1) | HT-3 | B |
| B4 Web base | 25 | HT-5, HT-6 | C |
| B5 Operación | 8 | HT-4 a HT-7 | B y C |
| B6 Fichas [I] | 36 | HT-5 a HT-7 | C |
| B7 Fichas [M], recorridos y F-2 | 43 | HT-8, HT-9 | D |
| B8 Fichas [P] y FT-49 | 8 | — | D |
| **Total** | **243** | 10 hitos | 20 TU |

- **Secuencia:** HT-0 → HT-1 → HT-4 → HT-5 → HT-6 (plata real, con las pruebas de dinero de DT-25) → HT-7 → la ola 2 (HT-2, HT-3) → HT-8 → HT-9 (puerta) → las [P].
- **Revisión:** 71 obligatorias; qué revisás en cada una, en §1.5.
- **Estimación:** 4,4 meses de CI hasta la puerta con 2 pushes por PR.

### 36.2 Cambios a documentos aprobados **[F8]**

**Aplicados** el 23 de octubre de 2026 (P8-21 a), con la marca **[F8]** en cada sección afectada y su línea en "Enmiendas posteriores" de cada documento (0.2). Los documentos enmendados están en el Project y en `docs/` del zip de verificación.

| CH | Documento | Qué quedó | Marcas |
|---|---|---|---|
| CH-01 | 07 §13.6, §16.2 | Rutas de operaciones y consultas por 04 §1.2 | 2 |
| CH-02 | 07 §6.3, §6.5 | `main` en rojo avisa con el correo de GitHub; uso por job como artefacto | 2 |
| CH-03 | 07 §23, §30; 04 SP-01 | Cobertura verificable de SP-01 en la puerta; en 04, solo la línea de enmiendas | 2 en 07; línea en 04 |
| CH-04 | 07 §22.1 | PRU-MAN-CTA-002 en la lista manual | 1 |
| CH-05 | 07 §5.3 | PRU-INT-POOL-001 a 005 | 6 |
| CH-06 | 07 §18, §19.1, §20.1 | Acciones de notificación sin firma; PRU-SEG-CONC-001 y V-26 hacia ella | 5 |
| CH-07 | 06 §2.0 y 8 fichas | Dependencias de construcción y de datos; las de datos de FT-03, FT-04, FT-08, FT-16, FT-19, FT-34, FT-35 y FT-54 | 9 |
| CH-08 | 07 §13.2, §13.3, §27, §30 | `pendientes-e2e.json`, M18 y su condición en el terminado y en la puerta | 4 |

- **Cómo se aplicaron.** Con `cierre/aplicar_f8.py`, como `aplicar_f7.py` de la Fase 7: cada ancla debe aparecer exactamente una vez, y si no aparece, no se escribe nada. La primera corrida se detuvo en CH-05, porque "POOL-04" aparece también en 0.7 de 07. Se ancló en la fila de la tabla de §5.3.
- **00, 01, 02, 03 y 05 no cambian:** ningún CH los toca.
- **Control (V8-06).** `cierre/enmiendas_f8.py` comprueba que:
  - cada CH está en su documento;
  - cada documento tiene su línea de la Fase 8 en "Enmiendas posteriores";
  - toda línea cambiada lleva [F8], salvo las de la sección de enmiendas;
  - no se borró ninguna línea;
  - las filas de tabla nuevas son exactamente las 6 previstas en 07;
  - los 492 CA de 06 quedan idénticos.

  Pasa. Su control negativo detecta una marca quitada, un CA cambiado y la línea de 04 quitada.

### 36.3 Lo que queda pendiente: los anexos

La carpeta todavía no está agregada. **La Fase 8 se cierra igual, con esta comprobación pendiente, y es condición de TA-001** (TU-04).

1. **Cuando agregues la carpeta en esta conversación,** corro `anexos.ts --entrada` sobre los archivos reales. Solo lee, también dentro de `finn-entrega.zip` y de `finn-marca.zip`. Te confirmo:
   - la lista de TU-04;
   - los 34 archivos citados en §8.2, §16.4 y §23.2, uno por uno;
   - los 52 íconos y los 7 glifos contados;
   - los tokens.
2. **Con los zips de las fases 4 a 7, repito sus scripts y la matriz de 07 sobre los documentos enmendados**, como pediste en P8-21: `t17.py`, `trazabilidad.py` y `cobertura.py` de la Fase 5, los cuatro de la Fase 6 y la matriz de la Fase 7.
   - **Hoy no pude correrlos:** esos scripts solo están en los zips, y reconstruirlos desde los `.md` sería exactamente lo que no querés.
   - Lo que sí corrió sobre los documentos enmendados está en V8-06 y V8-01 (§35): el control de enmiendas y el verificador del plan, con los mismos conteos de 01, 04, 06 y 07.
3. **Si falta un archivo, o un script falla:** te aviso con el nombre y la tabla que lo cita, y espero.
   - Nunca se reconstruye un archivo desde los `.md`.
   - Nunca se busca una alternativa sin tu respuesta.
   - Las tareas que lo portan quedan `bloqueadas`, con ese motivo.
4. **Antes de TA-001,** el orquestador corre la misma comprobación sobre `C:\finn\_entrada\`, y no lanza nada si no da `PASA` (§37.8).

### 36.4 Cómo se empieza

1. TU-01 (repositorio y token), TU-02, TU-03 (PC y carpetas), TU-04 (`_entrada` con su lista, comprobación y commit inicial con `.claude/`) y TU-05 (clave de firma).
2. Una sesión de Claude Code en `C:\finn\repo` con el mensaje de §37.9. El orquestador está en la etapa 0 de §37.8 hasta que TA-002 esté mergeada, y en la etapa normal desde TA-014.

### 36.5 Preguntas de la Parte D (resueltas; respuestas en 0.13)

- **P8-20:** a), con la regla E13 del verificador (V8-01).
- **P8-21:** a). CH aplicados (§36.2) y `08-tareas.md` guardado en el Project como `claude/08-tareas.md`.

**No quedan preguntas abiertas de la Fase 8.** La comprobación de los anexos reales (§36.3) es una tarea pendiente, no una pregunta.

---

## 37. Ejecución con orquestador **[F8]**

### 37.1 Modelo de trabajo

- **Una sesión de Claude Code en `C:\finn\repo` es el orquestador.** No escribe código de producción.
- **Lanza un subagente por tarea**, con el texto de `pnpm plan:encargo TA-nnn` como único mensaje:
  - como máximo 3 a la vez;
  - la E2E local, de a una.
- **Con lo que recibe:**
  - lee el informe de cada subagente;
  - mergea las tareas normales con `pr:mergear`;
  - te presenta las de revisión obligatoria.
- **El estado vive en `plan/tareas.json` y en los PR.** El orquestador es reemplazable: abrís una sesión nueva al cerrar cada hito, o cuando su contexto se llena, con el mensaje de §37.9.

### 37.2 DT-35: rol del orquestador

El texto normativo es la sección "Rol del orquestador" de `CLAUDE.md` (§4):
- qué hace y qué no hace;
- cómo elige y lanza tareas;
- cómo verifica el informe;
- cómo te presenta las obligatorias;
- qué hace con una contradicción.

**Justificación.** El orquestador no toca código, y así su contexto alcanza para coordinar muchas tareas. Cada subagente empieza limpio con su encargo y su worktree. Como todo el estado está en el repositorio, cambiar de sesión no pierde nada.

*Alternativas descartadas:*
- Una sesión que hace todas las tareas en serie: pierde el paralelismo de P8-5 y llena el contexto.
- Sesiones independientes abiertas por vos: tendrías que repartir cada encargo a mano.

### 37.3 DT-33: aprobación de las tareas obligatorias

**Regla.** `pnpm pr:mergear <n> --aprobado` solo corre después de un mensaje tuyo en la sesión del orquestador que nombra la tarea: **"mergeá TA-nnn"**.
- Ni el orquestador ni un subagente aprueban en tu nombre.
- Un subagente nunca usa `--aprobado`; tampoco mergea.
- "Sí", "ok", "dale" o un "mergeá" sin número no aprueban.

**Refuerzo técnico (propuesto y aplicado en TA-014).**
1. **El hook.** `.claude/settings.json` declara un hook `UserPromptSubmit` (`.claude/hooks/aprobar.mjs`, §37.10). Claude Code lo ejecuta con cada mensaje que vos enviás. Si el mensaje es exactamente "mergeá TA-nnn", escribe `C:\finn\_aprobaciones\TA-nnn.json` con la hora y la huella del mensaje.
2. **`pr:mergear --aprobado` exige ese archivo,** con la tarea del PR y más nuevo que el último commit del PR. Al mergear, lo borra y copia la huella al commit de merge.
3. **Los agentes no pueden escribir en esa carpeta.** Hay reglas `deny` de `Edit` y de comandos (`Bash(*_aprobaciones*)`), y el texto que escribe un subagente no dispara `UserPromptSubmit`.

**Lo que no protege.** Como en DT-13, un script que un agente escribiera a propósito podría crear el archivo. Las reglas `deny` comparan texto, y Windows no tiene sandbox. Contra un error del agente alcanza; contra uno malicioso quedan:
- el registro: la huella en el commit de merge;
- tu revisión.

**Pendiente de verificar.** TA-014 prueba el hook en una sesión real:
- que el texto del mensaje llega en el campo `prompt` de la entrada;
- que un mensaje tuyo escrito mientras el orquestador trabaja también dispara el hook.

Si alguna de las dos falla, se ajusta el script o se te pide escribir "mergeá" con el orquestador en espera. La regla no cambia.

*Alternativa considerada:* que `--aprobado` exija una terminal interactiva y te pida escribir el número de tarea. Es más fuerte, porque Claude Code no tiene terminal interactiva en sus comandos. Pero te obliga a mergear vos, desde tu PowerShell, las 71 obligatorias. **No la recomiendo como regla general.** Queda disponible: `pnpm pr:mergear <n> --aprobado --terminal` en tu ventana hace lo mismo sin el hook.

### 37.4 DT-34: worktrees

**Elegido: el aislamiento de worktrees de los subagentes de Claude Code** (`isolation: worktree` en `tarea-opus` y `tarea-sonnet`), en lugar de `git worktree add C:/finn/wt/ta-nnn` (DT-10).

| Criterio | Subagente con `isolation: worktree` | `git worktree add C:/finn/wt/ta-nnn` |
|---|---|---|
| **Que un subagente no toque el checkout del orquestador** | **Lo impide Claude Code:** bloquea ediciones fuera de su worktree, comandos con directorio en el checkout principal y `git -C`, `--git-dir` o `cd` hacia él | Solo instrucciones: el subagente arranca en el directorio del orquestador y cada comando tendría que hacer `cd` |
| Rutas largas en Windows | `C:\finn\repo\.claude\worktrees\<nombre>\`: unos 20 caracteres más. Alcanza con `core.longpaths` y `LongPathsEnabled` (TU-03) | Más corta |
| Almacén de pnpm | Global, enlaces duros en el mismo disco: se comparte igual | Igual |
| Base de la rama | `origin/main` (`worktree.baseRef: "fresh"`). El orquestador hace `git fetch` antes de lanzar, porque Claude Code refresca `origin` solo si pasaron 24 h | `origin/main` explícito |
| Limpieza | Automática si no hay cambios; con cambios, la quita el orquestador con `git worktree remove` después del merge, o el barrido de Claude Code | Manual |
| `CLAUDE.md` y permisos | El subagente carga las instrucciones y las reglas `deny` y los hooks de la sesión principal | Ídem |

**Ajustes:**
- **DT-10 (§1.8):** filas "Ubicación" y "Crear".
- **`CLAUDE.md`:** pasos 1, 2 y 8 de "Cómo tomar una tarea".
- **TU-03:** `C:\finn\wt` ya no se usa.
- **`.gitignore`:** agrega `.claude/worktrees/`.
- **`settings.json`:** `Edit(.claude/**)` pasa a negar solo `settings.json`, `settings.local.json`, `agents/**` y `hooks/**`. La regla anterior habría negado también los archivos de los propios worktrees.
- **La rama:** el subagente la renombra a `ta-nnn-<tema>` al empezar (`git branch -m`), y `plan:verificar` sigue relacionando rama y tarea.

**Si el aislamiento falla en Windows** (por ejemplo, por rutas largas en `node_modules` que `core.longpaths` no cubre): se vuelve a DT-10 original. El orquestador crea `C:/finn/wt/ta-nnn` y lanza el subagente sin aislamiento, con el encargo empezando por `cd C:/finn/wt/ta-nnn`. Es un cambio de dos líneas en este documento, que se registra como enmienda.

### 37.5 DT-32: modelo por tipo de tarea

**Criterio.**
- **Opus:** toda tarea de **revisión obligatoria**. Son las que tocan producción en motor, migraciones, seguridad, reloj, CI o `CLAUDE.md` (DT-05, DT-20). Ahí un error puede pasar con las pruebas en verde.
- **Sonnet:** el resto. Las pruebas escritas primero, la matriz, la CI y, en el dominio, el diferencial y los escenarios detectan lo que Sonnet haga mal.

`encargo.ts` escribe el modelo en la línea **Modelo** de cada encargo, y el orquestador lanza `tarea-opus` o `tarea-sonnet` según ese campo. Con el criterio, 71 tareas van con Opus y 172 con Sonnet.

**Que no baje la calidad.**
1. **Escalamiento por tarea.** Una tarea de Sonnet que el orquestador devuelve dos veces (informe incompleto, CI roja, `pr:mergear --resumen` con objetivos sin prueba) se relanza con Opus. `plan/tareas.json` lo registra (`modelo: opus`, motivo).
2. **Revisión por tandas.** El orquestador cuenta, al cerrar cada hito, cuántas tareas de Sonnet escalaron y cuántas de cada modelo rompieron `main`.
   - Si escalaron más del 25 % de 10 o más tareas, o si una tarea de Sonnet rompió `main`, te propone pasar a Opus el bloque siguiente.
   - Lo decidís vos.

*Alternativa descartada:* Opus para todo. Cuesta más y no cambia lo que detectan las pruebas en las tareas normales.

### 37.6 Contradicciones

Cuando un subagente reporta una contradicción:
1. El orquestador detiene esa tarea: `bloqueada` en `plan/tareas.json`, con motivo "contradicción", y el PR en borrador.
2. Te pasa el CH propuesto con las dos citas, listo para llevar al Project.
3. Sigue con las tareas que no dependen de ella: `plan:siguiente` no ofrece las que dependen de una bloqueada.
4. La retoma cuando le decís cómo se resolvió. Si el CH cambia un documento, el cambio llega a `docs/` en un PR obligatorio, antes de retomar.

### 37.7 DT-36: carpetas de entrada

| Carpeta | Qué tiene | Agentes | En el repositorio |
|---|---|---|---|
| `C:\finn\_entrada\` | Documentos `.md`, zips y anexos (lista de TU-04) | **Leen, no escriben** (`Edit` negado) | No: está fuera de `C:\finn\repo`. Además, `_entrada/` va en `.gitignore`, por si alguien la copia adentro |
| `C:\finn\_privado\` | Muestras sin anonimizar (TU-13, TU-14). Es el punto de montaje del VHDX cifrado, montado solo para anonimizar | **No leen** (`Read` y `Edit` negados) | No: fuera del repositorio y de `_entrada` |
| `C:\finn\_aprobaciones\` | Aprobaciones de DT-33 | No escriben | No |

`anonimizar.ts` lee `_privado` en una ventana tuya, con ningún agente corriendo, y escribe la salida anonimizada en el repositorio (TU-13).

**Por qué las separo.** TA-002 necesita leer los documentos y los zips. Las muestras crudas no deben estar al alcance de nadie. Antes, una misma carpeta tenía las dos cosas con lectura negada, y TA-002 no podía hacer su trabajo.

### 37.8 Arranque: antes de TA-002

En la primera sesión no existen `CLAUDE.md`, `docs/`, `plan/tareas.json` ni los scripts del plan. El orquestador trabaja en tres etapas:

| Etapa | Desde | Plan y encargos | Merge |
|---|---|---|---|
| **0. Arranque** | TU-01, TU-03 y TU-04 hechas | Plan: `C:\finn\_entrada\08-tareas.md`, §37 y la sección "Rol del orquestador" de su §4. Encargos de TA-001 y TA-002: `node C:/finn/_entrada/08-tareas-verificacion/tools/plan/encargo.ts --plan C:/finn/_entrada/08-tareas.md --tarea TA-001` (y `TA-002`), del zip descomprimido en TU-04. Al encargo le agrega una línea: "`pr:mergear` todavía no existe: no hagas el paso 2 de 'Al terminar'" | Te presenta cada PR (las dos son obligatorias) y lo mergeás vos desde GitHub (**Squash and merge**), porque `gh pr merge` está negado y `pr:mergear` todavía no existe |
| **1. Plan en el repositorio** | TA-002 mergeada (`CLAUDE.md`, `docs/`, `plan/tareas.json`, `plan:verificar`, `plan:siguiente`, `plan:encargo`) | `CLAUDE.md` del repositorio, `pnpm plan:siguiente` y `pnpm plan:encargo` | Igual que en la etapa 0 hasta que TA-010 esté mergeada. Después, el orquestador mergea las normales con `pnpm pr:mergear <n>` y las obligatorias con `--aprobado` tras tu "mergeá TA-nnn" (todavía sin el archivo de aprobación) |
| **2. Normal** | TA-014 mergeada (`--resumen`, "Qué mirar" y el archivo de aprobación de DT-33) | Igual | Como dice §37.3 |

**Primer paso de la etapa 0, siempre:**
```
node C:/finn/_entrada/08-tareas-verificacion/tools/plan/anexos.ts --plan C:/finn/_entrada/08-tareas.md --anexos C:/finn/_entrada --entrada --negativo
```
- Si no termina en `RESULTADO: PASA`, el orquestador no lanza nada. Te muestra lo que falta y espera; nunca reconstruye un archivo desde los `.md` (§36.3).
- TA-001 y TA-002 corren en serie (TA-002 depende de TA-001), cada una en su worktree y con el subagente que dice su encargo (TA-001, `tarea-sonnet`; TA-002, `tarea-opus`).

### 37.9 Mensaje inicial del orquestador

Lo pegás tal cual en una sesión nueva de Claude Code abierta en `C:\finn\repo`, para arrancar o para retomar:

````text
Sos el orquestador de Finn 2.0 en C:\finn\repo. No escribís código de producción, pruebas ni documentos.

1. Etapa. Si existe CLAUDE.md en la raíz del repositorio, leé su sección "Rol del orquestador" y seguila; el plan es docs/08-tareas.md. Si no existe, estás en el arranque: leé C:\finn\_entrada\08-tareas.md, §37 completo y la sección "Rol del orquestador" de su §4, y seguí §37.8.
2. Comprobación. En el arranque, corré primero anexos.ts como dice §37.8; si no da PASA, mostrame lo que falta y no lances nada. En las demás etapas, `pnpm plan:verificar` debe pasar.
3. Estado. Leé plan/tareas.json (si existe), `gh pr list --state open` y `git worktree list`. Reconstruí: hito actual, tareas en curso y su PR, PR esperando mi revisión, tareas bloqueadas con su motivo y TU pendientes. Si una tarea figura en curso sin subagente vivo, revisá su PR: si está listo, seguí con la verificación del informe; si no, relanzala con su encargo y el PR existente.
4. Mostrame ese resumen en un solo mensaje, con las próximas tareas que vas a lanzar y su modelo.
5. Después lanzá: git fetch origin; hasta 3 subagentes a la vez (tarea-opus o tarea-sonnet según la línea Modelo del encargo), cada uno con el texto del encargo como único mensaje, en segundo plano.
6. Reglas que no cambian: --aprobado solo después de que yo escriba "mergeá TA-nnn" nombrando esa tarea; ante una contradicción, detenés esa tarea, me pasás el CH propuesto y seguís con las que no dependen de ella; no marcás TU; no resolvés contradicciones.
7. Cuando se cierre un hito o tu contexto se acerque al límite, avisame para abrir una sesión nueva con este mismo mensaje.
````

### 37.10 Archivos de arranque (`.claude/`)

Están en `arranque/.claude/` del zip de verificación. Los copiás en TU-04 y van en el commit inicial:
- `settings.json`: el de §4.1.
- `agents/tarea-opus.md` y `agents/tarea-sonnet.md`: subagentes con `isolation: worktree` y su modelo. Las instrucciones son las mismas: renombrar la rama e instalar; seguir el encargo y `CLAUDE.md`; no mergear ni usar `--aprobado`; responder con el informe o con la contradicción.
- `hooks/aprobar.mjs`: el hook de DT-33. Se probó con una entrada sintética: "mergeá TA-051" crea el archivo, y "mergeá TA-051 y TA-052" no crea nada.

Las reglas de `settings.json` impiden que un agente los cambie. Cambiarlos es un PR de revisión obligatoria, con el diff completo (§1.5).

### 37.11 Riesgos del modelo de trabajo

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RO-1 | El aislamiento de worktrees no funciona bien en Windows con pnpm y Docker | Media | Medio | Primera comprobación en TA-001; si falla, DT-10 original (§37.4) |
| RO-2 | El hook no recibe tus mensajes como se espera | Media | Medio | TA-014 lo prueba; mientras tanto, la regla rige como instrucción (etapa 1 de §37.8) |
| RO-3 | El orquestador pierde contexto en una sesión larga | Alta | Bajo | El estado vive en el repositorio; sesión nueva por hito con §37.9 |
| RO-4 | Tres subagentes con Docker superan la memoria de WSL2 | Media | Medio | Con 12 GB de RAM o menos, uno solo con Docker (TU-03); el orquestador lanza los demás con tareas sin `integracion` ni E2E |
