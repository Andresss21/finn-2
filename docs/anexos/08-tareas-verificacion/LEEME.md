# 08-tareas-verificacion (Fase 8 cerrada: plan completo y enmiendas [F8])

- `08-tareas.md`: el plan, igual al entregado.
- `docs/`: 01 a 07 como quedan en el Project **con las enmiendas [F8]** (CH-01 a CH-08 en 04, 06 y 07). Son la entrada de las verificaciones.
- **[F8]** `cierre/`: `aplicar_f8.py` (aplica los CH) y `enmiendas_f8.py` (V8-06), con `cierre/orig/` (04, 06 y 07 antes de [F8]).
  `python3 -I cierre/enmiendas_f8.py cierre/orig docs --negativo`.
- **[F8]** `arranque/.claude/`: `settings.json`, `agents/tarea-opus.md`, `agents/tarea-sonnet.md` y `hooks/aprobar.mjs`, para el commit inicial de TU-04 (§37.10).
- `plan/objetivos.txt`: catálogo de objetivos de las partes A a D (`id | parte | fuente`), generado con
  `python3 -I tools/plan/catalogo.py docs plan/objetivos-parte-a.txt plan/objetivos.txt`.
  `plan/objetivos-parte-a.txt` es la lista de la Parte A con sus decisiones propias (DT, DP, BE, L, M…).
  **[C]** El catálogo suma el registro FE de 05, los recorridos de 06 §4 (Parte D) y DT-20.
- `tools/plan/verificar.ts`: V8-01 y V8-03.
  `node tools/plan/verificar.ts --plan 08-tareas.md --objetivos plan/objetivos.txt --docs docs --negativo`
  (sin `--parte`, el plan completo; `--parte A`, `B` o `C` para las partes anteriores).
  **[F8]** Regla E13: operaciones que necesita cada escenario (de 01 §8, o de los archivos de datos con `--escenarios <dir>`);
  `--escenarios-ops` imprime la lista derivada por escenario.
  **[D]** Reglas E7-hitos (hitos encadenados, transitivos) y E12 (pendientes de punta a punta: `pendiente: CA>FT` con su `e2e`, y `sin_pendientes: si` en HT-8 y HT-9).
  **[C]** Reglas E7-pruebas y E7-fichas: un hito con `pruebas:` o `fichas:` (HT-6) no se alcanza sin la tarea dueña de cada
  prueba exigida (las listadas, más los ESC `@motor` e `@int` y los CB que derivan de sus fichas en 06) y de cada CA de sus fichas.
- `tools/plan/estimacion.ts`: V8-02: `node tools/plan/estimacion.ts`.
- **[D]** `tools/plan/encargo.ts`: plantilla del encargo y V8-04.
  `node tools/plan/encargo.ts --plan 08-tareas.md --tarea TA-nnn` imprime el encargo de una tarea;
  `node tools/plan/encargo.ts --plan 08-tareas.md --docs docs --todas --negativo` genera los 243 y comprueba secciones y referencias.
- **[C]** `tools/plan/anexos.ts`: V8-05. `node tools/plan/anexos.ts --plan 08-tareas.md --anexos <carpeta> --negativo`.
  **[F8]** `--entrada` comprueba además la lista de TU-04 y los 52 íconos y 7 glifos de `finn-entrega.zip` (antes de TA-001, sobre `C:/finn/_entrada`).
  Lee las tablas "Archivos de los zips que cita …" del plan y busca cada archivo en la carpeta, abriendo los zips
  (también zips dentro de zips). Solo lee.
  `python3 -I tools/plan/anexos_prueba.py 08-tareas.md <carpeta-temporal>` prueba el script con una carpeta sintética
  de archivos **vacíos** con los nombres citados (no contiene nada de los anexos reales).
- `salidas/`: salida de cada corrida.
  - `v8_01.salida.txt`: plan completo con control negativo.
  - `v8_01_parteA.salida.txt`, `v8_01_parteB.salida.txt` y `v8_01_parteC.salida.txt`.
  - `v8_04.salida.txt` y `encargo-TA-289.md` (ejemplo).
  - `v8_02.salida.txt`.
  - `v8_03.salida.txt`.
  - `v8_05.salida.txt`: prueba sintética.
  - `v8_05_vacia.salida.txt`: lo que falta hoy, sin la carpeta de anexos.
  - `v8_06.salida.txt`: control de las enmiendas [F8].
  - `catalogo.salida.txt`.

Corrió en Node 22.22.0 con la eliminación de tipos (este entorno no tiene Node 24) y Python 3.13.
