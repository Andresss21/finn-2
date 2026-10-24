# Verificaciones de la Fase 4 (04-backend.md, 0.7)

Código con el que se ejecutaron las verificaciones V-01 a V-30. Son pruebas de diseño, no código de producción.

## Entorno

- PostgreSQL 16 local en el puerto **5433**, base `finn`, socket en `/tmp`.
- Roles `postgres`, `finn_migraciones` y `finn_app` (contraseña de prueba `a`), con los atributos de 03 §8.
- Node.js 22 o 24 con `npm install`. V-18 se ejecuta con Node 24.
- Prisma 7.10.0 + `@prisma/adapter-pg`. Los binarios del motor de esquemas no se pudieron descargar, así que el cliente se generó con:
  `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true npx prisma generate`
  `prisma migrate` no se ejecutó (queda para H-05 de la prueba de humo).

## Orden de preparación de la base

Todo como `postgres`, con `psql -v ON_ERROR_STOP=1 -f <archivo>`. Se probó desde una base vacía: termina con 50.000 transacciones, 60.000 líneas, 7.000 asignaciones y R14 en 0 filas.

1. `sql/00_subconjunto.sql` — roles (`CREATE ROLE`: comentarlos si ya existen en el clúster) y subconjunto de 03: funciones literales de 03 §10.4.5, tablas `revision`, `transacciones`, `lineas`, `asignaciones`, triggers reducidos.
2. `sql/06_volumen.sql` — datos de volumen para V-13 y V-16.
3. `sql/01_secuencia.sql` — `finn.secuencia_creacion`, `transacciones.secuencia` y `c_asignar_secuencia` (V-16).
4. `sql/02_eliminaciones_subconjunto.sql` — tabla `eliminaciones` con su trigger sobre `asignaciones`.
5. `migraciones/20261014000000_m_purgar_eliminaciones/migration.sql` — enmienda EN-2.
6. `sql/03_regla_r14.sql` — regla de catálogo R14 (0 filas = pasa).
7. `sql/05_sms_subconjunto.sql` — `sms_recibidos` con las `CHECK` de 03 §3.17 (V-27).

## Qué verifica cada script

| Script | Verificaciones | Cómo se ejecuta |
|---|---|---|
| `t1.ts` | V-01 a V-07 (errores de Prisma, bloqueo, diferidas, `finn.operacion`, 23505, lectura `READ ONLY`). V-11 y V-12 se observaron durante esta ejecución con el registro de sentencias del servidor y `psql` | `npx tsx t1.ts` |
| `t2.ts` | V-08, V-09, V-10 (concurrencia y `lock_timeout`) | `npx tsx t2.ts` |
| `t3.ts`, `t4.ts` | V-13 (carga de hechos: `findMany`, columnas, `json_agg`) | `npx tsx t3.ts`; `npx tsx t4.ts` |
| `t5.ts` | V-14 (`@db.Date` y `getDate()`) | `TZ=America/El_Salvador npx tsx t5.ts` |
| `t6.ts` | V-16 (memoria = carga nueva) | `npx tsx t6.ts` |
| `t7.ts`, `t8.ts` | V-17 (`timestamptz` y zona de la sesión) | `npx tsx t7.ts`; `npx tsx t8.ts` |
| `v18.mjs` | V-18 (`Intl` es-SV) | `node v18.mjs` (Node 24) |
| `t9.ts` | V-19, V-20 (UUIDv5 y huella del impacto) | `npx tsx t9.ts` |
| `t10.ts` | V-22 (referencia semanal) | `npx tsx t10.ts` |
| `t11.ts` + `sms/interpretar.ts` | V-23 (intérprete con 13 SMS sintéticos) y análisis de `recheck` | `npx tsx t11.ts` |
| `t12.ts`, `t13.ts` | V-24 (peor caso medido; reescrituras ilustrativas y controles) | `npx tsx t12.ts`; `npx tsx t13.ts` |
| `t14.ts` + `conc/decodificar.ts` | V-25 (decodificación de CSV), V-26 (carga firmada) | `npx tsx t14.ts` |
| `t15.ts` + `webhook/cuerpo.ts` | V-27 (cuerpo del webhook, BE-60 y BE-61) | `npx tsx t15.ts` |
| `t16.sh` + `sql/04_prueba_purga.sql` | V-28 (EN-2 y R14) | `./t16.sh` |
| `t17.py` | V-29 (trazabilidad de §18, BE-63) | `python3 t17.py 04-backend.md` |
| `t18.sh` | V-30 (verificaciones diferidas por fila, indicativa) | `./t18.sh` |

V-21 fue una revisión del código de 03 (no ejecutada); ver 5.3.1.

## Advertencias

- Los SMS de `t11.ts` son sintéticos: no prueban los patrones contra SMS reales (P4-3).
- `t18.sh` usa la versión reducida de `x_verificar_transaccion`; el costo real se mide en la Fase 8 (FX-4).
- Ningún script contiene secretos reales; las contraseñas son de la base local de prueba.
