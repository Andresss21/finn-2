#!/usr/bin/env bash
# V7-02: reloj de prueba de la base (CT-02). Requiere la base plantilla finn_v7 ya preparada.
set -uo pipefail
R=$(cd "$(dirname "$0")/.." && pwd)
A="psql -h /tmp -p 5433 -U postgres -qAtX"
r() { printf '%-62s %s\n' "$1" "$2"; }
# --- Plantilla (cuerpos de producción) ---
$A -d finn_v7 -f $R/tools/db/catalogo.sql > /tmp/claude-0/cat_plantilla.txt
r "P1 R15 en la plantilla (0 filas = pasa)" "$($A -d finn_v7 -f $R/tools/db/regla-r15.sql | wc -l)"
r "P2 plantilla: desfase de +1 año ignorado por ahora()" "$($A -d finn_v7 -U finn_app -c "BEGIN" -c "SELECT set_config('finn.desfase_ms', (365::bigint*86400000)::text, true)" -c "SELECT CASE WHEN finn.ahora() = now() THEN 'ignorado' ELSE 'APLICADO' END" -c "ROLLBACK" | tail -1)"
r "P3 plantilla: el override se niega (base sin marca de prueba)" "$($A -d postgres -c "DROP DATABASE IF EXISTS finn_prod_simulada" -c "CREATE DATABASE finn_prod_simulada TEMPLATE finn_v7" ; $A -d finn_prod_simulada -U finn_migraciones -v ON_ERROR_STOP=1 -f $R/tools/pruebas/reloj-simulado.sql 2>&1 | grep -o 'no está marcada.*' | head -1)"
# --- Base de prueba clonada de la plantilla ---
$A -d postgres -c "DROP DATABASE IF EXISTS finn_t1" -c "CREATE DATABASE finn_t1 TEMPLATE finn_v7" -c "ALTER DATABASE finn_t1 SET finn.reloj_simulado = 'on'"
$A -d finn_t1 -U finn_migraciones -v ON_ERROR_STOP=1 -f $R/tools/pruebas/reloj-simulado.sql
r "P4 R15 en la base de prueba (debe detectar el override)" "$($A -d finn_t1 -f $R/tools/db/regla-r15.sql | wc -l) filas"
$A -d finn_t1 -f $R/tools/db/catalogo.sql > /tmp/claude-0/cat_prueba.txt
r "P5 C6 plantilla vs prueba: líneas distintas" "$(diff /tmp/claude-0/cat_plantilla.txt /tmp/claude-0/cat_prueba.txt | grep -c '^[<>]') ($(diff /tmp/claude-0/cat_plantilla.txt /tmp/claude-0/cat_prueba.txt | grep '^[<>]' | cut -d'|' -f2 | sort -u | tr '\n' ' '))"
# ESC-46: SMS recibido el 20/02/2027 a las 19:00 en El Salvador (01:00 UTC del 21)
OBJ="2027-02-20 19:00:00-06"
SQL="BEGIN;
SELECT set_config('TimeZone','UTC',true);
SELECT set_config('finn.desfase_ms', (extract(epoch FROM (timestamptz '$OBJ' - now()))*1000)::numeric(20,0)::text, true);
SELECT set_config('finn.hoy', '2027-02-20', true);
INSERT INTO finn.sms_recibidos (texto, remitente) VALUES ('V7-02 prueba', 'BAC') RETURNING
  to_char(recibido_en AT TIME ZONE 'America/El_Salvador','YYYY-MM-DD HH24:MI') || ' local · ' || (recibido_en AT TIME ZONE 'UTC')::date || ' UTC · hoy() ' || finn.hoy();
SELECT CASE WHEN finn.instante() > finn.ahora() AND finn.instante() < finn.ahora() + interval '5 s' THEN 'instante monotono y coherente' ELSE 'MAL' END;
ROLLBACK;"
OUT=$($A -d finn_t1 -U finn_app <<<"$SQL")
r "P6 ESC-46: recibido_en por DEFAULT con el reloj simulado" "$(echo "$OUT" | sed -n 4p)"
r "P7 finn.instante() con el mismo desfase" "$(echo "$OUT" | sed -n 5p)"
r "P8 finn_app no puede cambiar el cuerpo de ahora()" "$($A -d finn_t1 -U finn_app -c "CREATE OR REPLACE FUNCTION finn.ahora() RETURNS timestamptz LANGUAGE sql AS 'SELECT now()'" 2>&1 | grep -o 'must be owner.*\|permission denied.*' | head -1)"
r "P9 finn_app no puede activar la marca de base de prueba" "$($A -d finn_v7 -U finn_app -c "ALTER DATABASE finn_v7 SET finn.reloj_simulado = 'on'" 2>&1 | grep -o 'must be owner.*\|permission denied.*' | head -1)"
# Control negativo de R15: una función nueva con now() y un DEFAULT con CURRENT_TIMESTAMP
$A -d finn_prod_simulada -U finn_migraciones -c "CREATE FUNCTION finn.x_mala() RETURNS timestamptz LANGUAGE sql SECURITY DEFINER SET search_path = finn, pg_catalog AS 'SELECT now()'" -c "ALTER TABLE finn.notificaciones ALTER COLUMN creada_en SET DEFAULT CURRENT_TIMESTAMP"
r "P10 control negativo R15 (2 violaciones sembradas)" "$($A -d finn_prod_simulada -f $R/tools/db/regla-r15.sql | wc -l) filas: $($A -d finn_prod_simulada -f $R/tools/db/regla-r15.sql | cut -c1-60 | tr '\n' ';')"
