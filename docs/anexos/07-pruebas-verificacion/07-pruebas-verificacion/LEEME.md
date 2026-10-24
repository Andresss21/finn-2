# 07-pruebas — verificaciones de las partes A, B y C (V7-01 a V7-15)

Entorno: Node 24.22.1 (paquete npm `node@24`), PostgreSQL 16.15 local en el puerto 5433 (socket en /tmp,
`timezone = America/Guatemala` para que la zona de la sesión no sea UTC por accidente), PgBouncer 1.22.0,
Prisma 7.10.0 + @prisma/adapter-pg, Vitest 3.2.7, fast-check 4.10.2, Next.js 16.4.1, React 19.3.1,
Playwright 1.56.0 (Chromium 141), Python 3.13. Sin acceso a Docker Hub, PGDG, binarios nativos de Prisma ni WebKit.
Son prototipos para verificar el plan, no código de la Fase 8. Las rutas absolutas (/home/claude/v7/…) hay que ajustarlas.

| Verificación | Archivos | Cómo se ejecuta | Salida |
|---|---|---|---|
| V7-01 base de CI | `base/ci/preparar-base.sh` + migraciones de `finn-fase3-base-de-datos.zip`, la de EN-2 (`04-backend-verificacion.zip`) y las de `base/migraciones/`; `proto/int/` | Copiar las migraciones a `packages/db/prisma/migrations/` del repo de prueba; `./ci/preparar-base.sh finn_v7 simulada`; `PGPASSWORD=m npx vitest run int/` | `salidas/v7_01.salida.txt` |
| V7-02 reloj de la base | `base/migraciones/20261022000000_m_reloj`, `base/tools/pruebas/reloj-simulado.sql`, `base/tools/db/regla-r15.sql`, `base/ci/v7_02.sh` | `./ci/v7_02.sh` (después de V7-01) | `salidas/v7_02.salida.txt` |
| V7-03 propiedades | `proto/dominio/` (núcleo, generadores, propiedades, diferencial), `oraculo/` (`motor_min.py` es el de la Fase 6) | `npx vitest run dominio/`; mutantes: `FINN_MUTANTE=arrastre\|traslado\|orden\|cierre FC_SEED=7 npx vitest run dominio/`; cobertura: `--coverage --coverage.include=dominio/nucleo.ts` | `salidas/v7_03.salida.txt` |
| V7-04 Next + Playwright + reloj | `web/` | `npm i && npx next build && npx playwright test`; barreras: ver `salidas/v7_04.salida.txt` (G1 a G4) | `salidas/v7_04.salida.txt` |
| V7-05 pooler | `pooler/pool.ts`, `pooler/pgbouncer.ini` | `pgbouncer -d pgbouncer.ini`; generar el cliente de Prisma con el `schema.prisma` de 03 (`PRISMA_SCHEMA_ENGINE_BINARY=/bin/true npx prisma generate`); `npx tsx pool/pool.ts` | `salidas/v7_05.salida.txt` |
| V7-06 tiempos | `monorepo-medicion/` (package.json de un monorepo realista) | `pnpm install --store-dir <dir>` en frío y con `--offline` | `salidas/v7_06.salida.txt` |
| C4 (no concluyente) | `arnes-c4/diff.mjs` | Intento de `migrate diff` con `@prisma/schema-engine-wasm`; falla al iniciar el motor | — |

Las tres migraciones `2026101700…` (CF-01, CF-16, CF-20) son un equivalente escrito a mano de lo que generará Prisma;
la Fase 8 las regenera desde `schema.prisma`. `m_reloj` es el prototipo de CT-02.

## Ajustes de la Parte A y Parte B (V7-07 a V7-10)

| Verificación | Archivos | Cómo se ejecuta | Salida |
|---|---|---|---|
| V7-07 barreras del reloj con lista de permitidos (P7-10) y minutos de M4 | `web/lib/reloj-permitido.ts`, `web/lib/reloj-prueba.ts`, `web/instrumentation.ts`, `web/seg/barreras.mjs`, `web/playwright.config.ts` (`FINN_ENTORNO=pruebas`); `matriz/tools/ci/minutos.ts` y `minutos.fixture.json` | `npx next build && npx tsx seg/barreras.mjs` (PRU-SEG-RELOJ-001 y 002, 11 casos cada una); `npx playwright test`; `node matriz/tools/ci/minutos.ts prueba matriz/tools/ci/minutos.fixture.json` | `salidas/v7_07.salida.txt` |
| V7-08 escenarios como datos | `proto/escenarios/` (`tipos.ts`, `datos/esc-*.ts`, `ejecutar.ts`, `motor.ts`, `int.ts`, pruebas y control) | `npx vitest run escenarios/escenarios.motor.test.ts`; con la plantilla de V7-01: `npx vitest run escenarios/escenarios.int.test.ts`; controles: `FINN_MUTANTE=… npx vitest run escenarios/control.test.ts`, `ALTERAR='ESC-06:3:lpa:601' …`, `INT_MUTANTE=clave …` | `salidas/v7_08.salida.txt` |
| V7-09 matriz | `matriz/tools/pruebas/matriz.ts` (M1–M13, `ft`, `afectadas`, `informe`), `listar.ts`, `control-matriz.ts`; `matriz/docs/01-extracto.md` | Copiar 04, 05 y 06 del proyecto a `matriz/docs/`; `FINN_MATRIZ_D01=docs/01-extracto.md node tools/pruebas/matriz.ts verificar`; `node tools/pruebas/control-matriz.ts` (inventario sintético completo, 15 mutaciones, modo incremental, `ft`, `afectadas`) | `salidas/v7_09.salida.txt` |
| V7-10 semillas de recorridos | `proto/semillas/recorridos.test.ts` (4.6 y Restaurantes de A.7) | `npx vitest run semillas` | `salidas/v7_10.salida.txt` |

Node 24 ejecuta los `.ts` de `matriz/` sin compilar. Desde V7-11 la matriz lee `01-dominio.md` completo (copiarlo a `matriz/docs/` con 04, 05 y 06).

## Ajustes de la Parte B y Parte C (V7-11 a V7-15)

| Verificación | Archivos | Cómo se ejecuta | Salida |
|---|---|---|---|
| V7-11 matriz con 01 completo y M14–M16 | `matriz/tools/pruebas/matriz.ts`, `control-matriz.ts` | Con 01, 04, 05 y 06 en `matriz/docs/`: `node tools/pruebas/matriz.ts verificar`; `node tools/pruebas/control-matriz.ts` | `salidas/v7_11.salida.txt` |
| V7-12 firmas de los resultados manuales (M17) | `matriz/tools/pruebas/firmas.sh`, `firmas-escenarios.sh` | Generar dos claves con `ssh-keygen -t ed25519` en `/tmp/claude-0/firmas/` (usuario, agente) y `bash firmas-escenarios.sh` | `salidas/v7_12.salida.txt` |
| V7-13 coherencia de A.7 | `a7/coherencia_a7.py` | `python3 -I a7/coherencia_a7.py` | `salidas/v7_13.salida.txt` |
| V7-14 POOL-04: REVOKE y marca local (CT-06) | `pool04/v7_14.sql`, `pool04/marca.sql`, `pool04/correr.sh` | Rol `sb_postgres` NOSUPERUSER CREATEROLE CREATEDB; `psql -U sb_postgres -f v7_14.sql`; PgBouncer de V7-05 y `bash correr.sh` | `salidas/v7_14.salida.txt` |
| V7-15 CMP con el modo navegador de Vitest y axe (CT-04) | `cmp/` | `npm i -D vitest@3.2.7 @vitest/browser@3.2.7 playwright@1.56.0 vitest-browser-react@1 react@19.3.1 react-dom@19.3.1 axe-core@4 @vitejs/plugin-react@5`; `npx vitest run` | `salidas/v7_15.salida.txt` |

## Parte D y cierre (V7-16 a V7-18)

| Verificación | Archivos | Cómo se ejecuta | Salida |
|---|---|---|---|
| V7-16 A.7 corregido como semilla (CT-07) y V6-01 sobre la semilla completa | `a7/semilla/estado_a7.py` (hechos de A.7 y semilla de 4.2), `motor_min.py`, `reportes.py`, `comparar.py` | `cd a7/semilla && python3 -I comparar.py` (sale con error si cambia un número citado por un CA) | `salidas/v7_16.salida.txt` |
| V7-17 firmas por fila (`git blame`) y por commit, una sola clave (P7-20) | `firmas/verificar-firmas.sh` (= `matriz/tools/pruebas/firmas.sh`), `firmas/escenarios2.sh` | Generar las claves `usuario` y `agente` con `ssh-keygen -t ed25519 -N ''` en `/tmp/claude-0/firmas/`; `bash firmas/escenarios2.sh` (casos A a D) | `salidas/v7_17.salida.txt` |
| V7-18 enmiendas [F7] y scripts de las fases anteriores | `cierre/aplicar_f7.py` (originales → enmendados), `cierre/enmiendas_f7.py` (E1 a E6 y control negativo), `cierre/correr.sh` (04 `t17.py`; 05 `traz05.py`, `cob05.py`; 06 `traz06.py`, `revisar_fichas.py`, `prueba_reportes.py`, `recorridos/`) | `python3 -I cierre/aplicar_f7.py`; `python3 -I cierre/enmiendas_f7.py cierre/originales cierre/enmendados` y con `--negativo`; `bash cierre/correr.sh` (deja `base.txt` y `enm.txt`; deben ser iguales ordenados) | `salidas/v7_18.salida.txt` |

| V7-19 CT-08 y repetición de todos los scripts; CT-09 en seco | `cierre/fase5/trazabilidad.py` y `cobertura.py` (scripts de la Fase 5 actualizados por CT-08); `aplicar_f7.py` (CT-08 siempre; CT-09 con `--ct09`); `enmiendas_f7.py` (`--ct09`); `correr.sh <dir> [.|fase5]` | `python3 -I cierre/aplicar_f7.py cierre/originales cierre/enmendados`; `bash cierre/correr.sh $PWD/cierre/originales .` (antes: deja `base.txt`), `bash cierre/correr.sh $PWD/cierre/enmendados fase5` (después: `enm.txt`), `bash cierre/correr.sh $PWD/cierre/originales fase5` (control: `control.txt`); CT-09 (entonces propuesto) en una carpeta temporal | `salidas/v7_19.salida.txt` |

| V7-20 CT-09 aplicado; repetición de scripts y control de enmiendas | `cierre/aplicar_f7.py` (CT-09 incluido por defecto; `--sin-ct09` reproduce el estado de V7-19), `enmiendas_f7.py` | `python3 -I cierre/aplicar_f7.py cierre/originales cierre/enmendados`; `python3 -I cierre/enmiendas_f7.py cierre/originales cierre/enmendados` (y `--negativo`); `bash cierre/correr.sh $PWD/cierre/enmendados fase5` | `salidas/v7_20.salida.txt` |

`cierre/enmendados/` tiene los documentos con las enmiendas de la Fase 7 (CT-01 a CT-09), iguales a los publicados en el proyecto. `traz05.py` y `cob05.py` son los scripts originales de la Fase 5, que fallan sobre el 05 aprobado; `fase5/` tiene sus versiones de CT-08, que pasan.
