# Encargo TA-289 — FT-10 Asignar y desasignar

Sos el agente de la tarea TA-289 de Finn 2.0. Seguí `CLAUDE.md` (se carga solo). Esta es tu única tarea en esta sesión.

## Datos
- Bloque B6, hito HT-6, revisión **normal**. Depende de: TA-164, TA-174, TA-210, TA-212, TA-219, TA-224, TA-288 (deben figurar `terminada` en `plan/tareas.json`).
- Cubre: CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5, CA-10.6, CA-10.7, CA-10.8, RUTA-/presupuesto/asignar/[categoriaId]. Pruebas con identificador: —.
- **Modelo: sonnet** (DT-32): el orquestador lanza el subagente `tarea-sonnet`, en su propio worktree (DT-34).
- Tamaño estimado: prod=360 archivos=10 ca=8 migraciones=0 total=1000. Si el diff medido pasa un límite de DT-01, pará y proponé cómo partirla.
- Paralelo: libre. TU necesarias: —.

## Antes de empezar
Estás en tu worktree (DT-34). Primero: `git fetch origin`, `git branch -m ta-289-<tema>` y `pnpm install --frozen-lockfile`. Nunca toques `C:\finn\repo` fuera de tu worktree.

## Qué construir
- FT-10: las pantallas y flujos de su ficha (Flujo, Piezas, Estados, Errores y textos) para CA-10.1 a CA-10.8, con la consulta de 04 §6, los componentes de B4 y los textos del catálogo.
- Server Actions de las operaciones de la ficha en `servidor/acciones/<area>.ts`, una línea por operación (04 §2.2.2); `ACCESO-001` y la suite de accesibilidad las cubren solas (TA-218, TA-221).
- Rutas que esta tarea crea (dueña): `/presupuesto/asignar/[categoriaId]`.
- Último PR de la ficha: `pruebas/features.json` pasa FT-10 a `terminada` (07 §27, DT-06 condición 6).

## Leé solo esto
06 FT-10 completo, con sus marcas de revisión; 05 §2 (filas de sus rutas), §7 (estados); 06-identidad-visual §3 en la sección de su pantalla; 04 §6 (su consulta).

## Archivos
`apps/web/src/app/(finn)/<ruta>/**`, `apps/web/src/flujos/<flujo>/*`, `apps/web/src/servidor/acciones/<area>.ts`, `apps/web/src/textos/<area>.ts`, `apps/web/e2e/{pantallas,flujos}/<area>/*`.

## Pruebas primero
- Una prueba por CA de este trozo, en el nivel que fija 07 §17 (regla de nivel por tipo de CA), con el identificador nuevo de su área (DT-21) y el CA entre corchetes.
- Las E2E de la ficha citan ESC-03, ESC-06, ESC-07, AV-11, AV-20, CB-09, CB-10, CB-25 cuando el CA los nombra; sus pruebas de dominio e integración ya existen (B2 y B3).

## Comandos
`pnpm pruebas:ft FT-10` sin faltantes en los CA de este trozo; `pnpm ci:local` con la E2E de la ficha.

## Terminada cuando
`pruebas:ft` sin CA faltantes, la ficha en `terminada` con 07 §27 completo y el resumen de `pr:mergear` con sus manuales pendientes.

## Al terminar
1. `pnpm ci:local` en verde; máximo 2 pushes (DT-07).
2. `pnpm pr:mergear <n> --resumen` y pegá la salida en el PR.
3. Descripción del PR = el informe de `CLAUDE.md`, con **Qué mirar** apuntando a lo más riesgoso del cambio.
4. No mergeás ni usás `--aprobado`: tu respuesta final al orquestador es el informe, con el número de PR.
5. Si encontrás una contradicción entre documentos, no la resuelvas en el código: informala con una propuesta de CH y esperá.
