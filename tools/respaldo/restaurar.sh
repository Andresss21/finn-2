#!/bin/bash
# tools/respaldo/restaurar.sh — prueba de restauración (03-base-de-datos.md, 12.2).
# Requiere: PGHOST, PGPORT, PGUSER (superusuario del Postgres efímero), psql, pg_restore, node.
# Uso: tools/respaldo/restaurar.sh <volcado.dump> <manifiesto.json> <catalogo-esperado.txt> [base_destino] [hoy]
# Portado de la Fase 3 (TA-251). Cambios: el paso 9 llama al motor (motor.ts, 04 §16.4) con `hoy` = la fecha del
# volcado (AAAA-MM-DD), y FINN_PG_EXEC antepone un comando a psql y pg_restore (la prueba RES los corre en un
# contenedor, 07 §19.6). Los pasos 1 (descargar y descifrar) y 11 (endpoint) son del workflow (TA-263).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
VOLCADO=$1; MANIFIESTO=$2; ESPERADO=$3; BASE=${4:-finn_restaurada}; HOY=${5:-}
PGX=${FINN_PG_EXEC:-}
P="$PGX psql -X -q -v ON_ERROR_STOP=1"
APP_CLAVE=$(openssl rand -hex 16)

$P -d postgres -c "DROP DATABASE IF EXISTS $BASE" -c "CREATE DATABASE $BASE" >/dev/null

echo "2. Esquemas auth en la base destino: $($P -d "$BASE" -At -c "SELECT count(*) FROM pg_namespace WHERE nspname = 'auth'")"
test "$($P -d "$BASE" -At -c "SELECT count(*) FROM pg_namespace WHERE nspname = 'auth'")" = 0

echo "3. Roles (bootstrap sin esquema)"
$P -d "$BASE" -v solo_roles=1 -v clave_migraciones="$(openssl rand -hex 16)" -v clave_app="$APP_CLAVE" \
   -v clave_respaldo="$(openssl rand -hex 16)" -f "$RAIZ/tools/db/bootstrap.sql"

echo "4. pg_restore --exit-on-error --single-transaction"
$PGX pg_restore --exit-on-error --single-transaction --dbname="$BASE" "$VOLCADO"

echo "5. verificar_todo(): $($P -d "$BASE" -At -c 'SELECT finn.verificar_todo()') verificaciones sin rechazos"

echo "6. Reglas de catálogo"
VIOLACIONES=$($P -d "$BASE" -At -f "$RAIZ/tools/db/reglas-catalogo.sql")
if [ -n "$VIOLACIONES" ]; then echo "$VIOLACIONES"; exit 1; fi

echo "7. Instantánea de catálogo"
$P -d "$BASE" -At -f "$RAIZ/tools/db/catalogo.sql" > /tmp/catalogo-restaurado.txt
diff "$ESPERADO" /tmp/catalogo-restaurado.txt

echo "8. Conteos y revisión frente al manifiesto"
node --input-type=module - "$MANIFIESTO" "$BASE" <<'EOF'
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [manifiesto, base] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(manifiesto, 'utf8'));
const [cmd, ...pre] = [...(process.env.FINN_PG_EXEC ?? '').split(' ').filter(Boolean), 'psql'];
const q = (sql) => execFileSync(cmd, [...pre, '-X', '-At', '-d', base, '-c', sql]).toString().trim();
let mal = 0;
for (const [t, n] of Object.entries(m.conteos)) {
  const r = Number(q(`SELECT count(*) FROM finn."${t}"`));
  if (r !== n) { mal++; console.log(`   ${t}: ${r} ≠ ${n}`); }
}
const rev = q('SELECT valor FROM finn.revision');
console.log(`   ${Object.keys(m.conteos).length} tablas, ${mal} diferencias; revisión ${rev} (manifiesto ${m.revision})`);
if (mal || String(rev) !== String(m.revision)) process.exit(1);
EOF

echo "9. Motor sobre los hechos restaurados (@finn/dominio)"
node "$RAIZ/tools/respaldo/motor.ts" "postgresql://$PGUSER:${PGPASSWORD:-}@${PGHOST:-localhost}:${PGPORT:-5432}/$BASE" "$HOY"

echo "10. Triggers activos tras restaurar"
if PGPASSWORD="$APP_CLAVE" $PGX psql -X -At -U finn_app -d "$BASE" -c "INSERT INTO finn.deudores (nombre) VALUES ('restauracion')" 2>/dev/null; then
  echo "   una escritura sin bloqueo fue aceptada"; exit 1
fi
PGPASSWORD="$APP_CLAVE" $PGX psql -X -At -U finn_app -d "$BASE" -v ON_ERROR_STOP=1 -c "BEGIN; SELECT finn.tomar_bloqueo(); INSERT INTO finn.deudores (nombre) VALUES ('restauracion'); SELECT 'revisión tras escribir: ' || valor FROM finn.revision; ROLLBACK;" | grep revisi

echo "Restauración verificada."
