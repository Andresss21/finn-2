#!/usr/bin/env bash
# Prototipo del paso "base de prueba" del job de integración (V7-01).
# Uso: preparar-base.sh <nombre_base> [simulada]
# Crea la base, ejecuta el bootstrap, aplica las migraciones en orden (como prisma migrate deploy,
# una transacción por carpeta, como finn_migraciones) y corre C5 y C6.
set -euo pipefail
B=$1; MODO=${2:-}
R=$(cd "$(dirname "$0")/.." && pwd)
ADM="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5433} -U postgres -v ON_ERROR_STOP=1 -qAtX"
t() { local s=$(date +%s%N); "$@"; echo "  $(( ($(date +%s%N)-s)/1000000 )) ms" >&2; }
echo "bootstrap" >&2
$ADM -d postgres -c "DROP DATABASE IF EXISTS $B" -c "CREATE DATABASE $B"
t $ADM -d $B -v clave_migraciones=m -v clave_app=a -v clave_respaldo=r -f $R/tools/db/bootstrap.sql >/dev/null
MIG="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5433} -U finn_migraciones -d $B -v ON_ERROR_STOP=1 -qAtX"
echo "migraciones" >&2
s=$(date +%s%N)
for d in $(ls -d $R/packages/db/prisma/migrations/*/ | sort); do
  $MIG -1 -f $d/migration.sql >/dev/null || { echo "FALLA en $d" >&2; exit 1; }
done
echo "  $(( ($(date +%s%N)-s)/1000000 )) ms ($(ls -d $R/packages/db/prisma/migrations/*/ | wc -l) carpetas)" >&2
if [ "$MODO" = simulada ]; then
  $ADM -d postgres -c "ALTER DATABASE $B SET finn.reloj_simulado = 'on'"
fi
