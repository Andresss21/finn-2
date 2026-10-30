#!/bin/bash
set +x
# tools/humo/pasos/comun.sh — lo que comparten los pasos de humo.sh (04 §17.2). Se carga con `.`; no es un paso.
# FINN_PG_EXEC antepone un comando a psql (solo la prueba PRU-SEG-OPER-103, como en tools/respaldo).
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$RAIZ"
PGX=${FINN_PG_EXEC:-}
# La base del proyecto: la de HUMO_ADMIN_URL (en Supabase, `postgres`)
BASE=${HUMO_ADMIN_URL##*/}
BASE=${BASE%%\?*}

# q <url> <sql>: una consulta, sin encabezados ni alineación, que falla con el primer error
q() { $PGX psql "$1" -X -q -At -v ON_ERROR_STOP=1 -c "$2"; }

# vercel_api <método> <ruta> [archivo]: la API de Vercel con VERCEL_TOKEN, que llega a curl por stdin (-K -), nunca
# como argumento; falla sin token o con un código HTTP de error (H-09 y H-12)
vercel_api() {
  [ -n "${VERCEL_TOKEN:-}" ] || return 1
  printf 'header = "Authorization: Bearer %s"\n' "$VERCEL_TOKEN" | curl -sf -K - -X "$1" \
    -H 'content-type: application/json' ${3:+--data-binary "@$3"} "https://api.vercel.com$2"
}

# url <rol> <puerto> [consulta]: el rol por el pooler, como `<rol>.<ref>` (03 §13.5 B3); sin HUMO_REF, el rol solo
url() {
  local clave
  case $1 in
    finn_migraciones) clave=$HUMO_CLAVE_MIGRACIONES ;;
    finn_app) clave=$HUMO_CLAVE_APP ;;
    finn_respaldo) clave=$HUMO_CLAVE_RESPALDO ;;
  esac
  echo "postgresql://$1${HUMO_REF:+.$HUMO_REF}:$clave@$HUMO_POOLER_HOST:$2/$BASE${3:+?$3}"
}
