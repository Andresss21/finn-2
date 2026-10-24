#!/usr/bin/env bash
# V-28: EN-2 finn.purgar_eliminaciones() (QC-4). Requiere sql/02, la migración EN-2 y sql/03 aplicados.
set -u; P="psql -h /tmp -p 5433 -d finn -qAt"
$P -U postgres -f sql/04_prueba_purga.sql >/dev/null
r() { echo "$1: $2"; }
r P1 "$($P -U finn_app -c 'DELETE FROM finn.eliminaciones' 2>&1)"
r P2 "$($P -U finn_app -c 'UPDATE finn.revision SET revision_minima_incremental = 0' 2>&1)"
r P3 "$($P -U finn_app -c 'SELECT finn.purgar_eliminaciones()')  (esperado 3)"
r P4 "$($P -U postgres -c "SELECT string_agg(revision::text, ',' ORDER BY revision) || ' / ' || (SELECT revision_minima_incremental FROM finn.revision) FROM finn.eliminaciones")  (esperado 20,21 / 10)"
r P5 "$($P -U finn_app -c 'SELECT finn.purgar_eliminaciones()')  (esperado 0)"
$P -U postgres -c "UPDATE finn.revision SET revision_minima_incremental = 50" -c "INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en) VALUES ('asignaciones', gen_random_uuid(), 3, now() - interval '40 days')" >/dev/null
$P -U finn_app -c 'SELECT finn.purgar_eliminaciones()' >/dev/null
r P6 "$($P -U postgres -c 'SELECT revision_minima_incremental FROM finn.revision')  (esperado 50: nunca baja)"
$P -U postgres -c "CREATE ROLE humo_publico LOGIN" -c "GRANT USAGE ON SCHEMA finn TO humo_publico" >/dev/null 2>&1
r P7 "$($P -U humo_publico -c 'SELECT finn.purgar_eliminaciones()' 2>&1)"
$P -U postgres -c "REVOKE USAGE ON SCHEMA finn FROM humo_publico" -c "DROP ROLE humo_publico" >/dev/null
$P -U postgres -c "GRANT EXECUTE ON FUNCTION finn.purgar_eliminaciones() TO PUBLIC" >/dev/null
r P8 "$($P -U postgres -f sql/03_regla_r14.sql)"
$P -U postgres -c "REVOKE EXECUTE ON FUNCTION finn.purgar_eliminaciones() FROM PUBLIC" -c "ALTER FUNCTION finn.purgar_eliminaciones() SECURITY INVOKER" >/dev/null
r P9 "$($P -U postgres -f sql/03_regla_r14.sql)"
$P -U postgres -c "ALTER FUNCTION finn.purgar_eliminaciones() SECURITY DEFINER" >/dev/null
r P10 "filas de R14: $($P -U postgres -f sql/03_regla_r14.sql | wc -l)  (esperado 0)"
