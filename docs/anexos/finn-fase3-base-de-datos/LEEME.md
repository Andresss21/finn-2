# Finn 2.0 — Fase 3: base de datos (archivos)

Fuente: `03-base-de-datos.md` (secciones 10 a 12). Probado contra PostgreSQL 16 con Prisma 7.10.

1. Una vez por base, como administrador:
   `psql "$URL_ADMIN" -v ON_ERROR_STOP=1 -v clave_migraciones=… -v clave_app=… -v clave_respaldo=… -f tools/db/bootstrap.sql`
2. Migraciones, como `finn_migraciones`: `pnpm --filter @finn/db exec prisma migrate deploy`
3. CI (11.6): `tools/db/verificar-migraciones.mjs`, `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`,
   `tools/db/reglas-catalogo.sql` (0 filas) y `tools/db/catalogo.sql` igual a `packages/db/prisma/catalogo-esperado.txt`.
4. Respaldo y prueba de restauración (12): `tools/respaldo/respaldar.mjs` y `tools/respaldo/restaurar.sh`.

Las fechas de las carpetas de migración son de referencia; el orden es el que importa.
