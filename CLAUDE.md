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
