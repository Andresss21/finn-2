#!/bin/bash
set +x
# H-09 (04 §17.2; BE-58; 04 §5.6 [R1]): la carga completa del motor medida desde `iad1` con volumen alto a 10 años.
# (a) El esquema temporal `humo`, de finn_migraciones, con copias sin triggers de las tablas [M] y ~180.000 filas
#     del generador de TA-156 (funcion-carga/preparar.ts semilla). No toca las tablas `finn` ni la revisión.
# (b) Un proyecto temporal de Vercel con tools/humo/funcion-carga/api/carga.mjs en iad1, por la API y con
#     VERCEL_TOKEN (TU-07): se quita su protección de despliegue para poder llamarlo y se le envían por POST la URL
#     de finn_app por el pooler (6543) y las consultas de 04 §5.2; corre 10 cargas y devuelve tiempos y bytes.
# (c) Al terminar, siempre: se borra el proyecto por su id y `DROP SCHEMA humo CASCADE`. El id queda en $HUMO_ESTADO
#     hasta borrarlo: si este paso no llega a hacerlo, lo borra H-12.
# Pasa si el p95 de las 10 cargas es ≤ 500 ms (02 §2.3) y la función corrió en iad1. Sin VERCEL_TOKEN, omitido.
# FINN_HUMO_FUNCION_LOCAL=1 (solo la prueba PRU-SEG-OPER-103) corre la misma función en este proceso, sin desplegar.
. "$(dirname "$0")/comun.sh"
local_=${FINN_HUMO_FUNCION_LOCAL:-}
[ "$local_" = 1 ] || [ -n "${VERCEL_TOKEN:-}" ] || {
  echo "detalle falta VERCEL_TOKEN (TU-07): sin la función en iad1 no hay medición"
  exit 3
}
PREPARAR=tools/humo/funcion-carga/preparar.ts
MIGRACIONES=$(url finn_migraciones "$HUMO_PUERTO_SESION")
estado=${HUMO_ESTADO:-$(mktemp -d)}/h09-proyectos
trabajo=$(mktemp -d)
proyecto=''
limpiar() {
  if [ -n "$proyecto" ] && vercel_api DELETE "/v9/projects/$proyecto" >/dev/null; then
    grep -vx "$proyecto" "$estado" >"$trabajo/resto" || true
    cat "$trabajo/resto" >"$estado"
  fi
  q "$MIGRACIONES" 'DROP SCHEMA IF EXISTS humo CASCADE' >/dev/null || true
  rm -rf "$trabajo"
}
trap limpiar EXIT

node "$PREPARAR" semilla >"$trabajo/semilla.sql"
$PGX psql "$MIGRACIONES" -X -q -v ON_ERROR_STOP=1 -f "$trabajo/semilla.sql" >/dev/null
echo "medido semilla $(q "$MIGRACIONES" "SELECT count(*) FROM pg_tables WHERE schemaname = 'humo'") tablas"
export HUMO_LLAVE
HUMO_LLAVE=$(openssl rand -hex 16)
cuerpo() { HUMO_CARGA_URL="$(url finn_app "$HUMO_PUERTO_TX")" node "$PREPARAR" cuerpo; }

if [ "$local_" = 1 ]; then
  cuerpo | node "$PREPARAR" local >"$trabajo/respuesta.json"
else
  export HUMO_PROYECTO
  HUMO_PROYECTO="finn-humo-carga-$(openssl rand -hex 4)"
  node "$PREPARAR" despliegue >"$trabajo/despliegue.json"
  vercel_api POST '/v13/deployments?skipAutoDetectionConfirmation=1' "$trabajo/despliegue.json" >"$trabajo/d.json" ||
    { echo "detalle Vercel rechazó el despliegue"; exit 1; }
  campo() { node -e 'const j = JSON.parse(require("fs").readFileSync(0, "utf8")); console.log(j[process.argv[1]] ?? "")' "$1"; }
  proyecto=$(campo projectId <"$trabajo/d.json")
  [ -n "$proyecto" ] || { echo "detalle el despliegue no devolvió projectId"; exit 1; }
  echo "$proyecto" >>"$estado"
  despliegue=$(campo id <"$trabajo/d.json")
  dominio=$(campo url <"$trabajo/d.json")
  echo '{"ssoProtection":null}' >"$trabajo/proteccion.json"
  vercel_api PATCH "/v9/projects/$proyecto" "$trabajo/proteccion.json" >/dev/null ||
    { echo "detalle no se pudo quitar la protección del proyecto temporal"; exit 1; }
  listo=''
  for _ in $(seq 150); do
    listo=$(vercel_api GET "/v13/deployments/$despliegue" | campo readyState) || true
    case $listo in READY | ERROR | CANCELED) break ;; esac
    sleep 2
  done
  echo "medido despliegue $listo"
  [ "$listo" = READY ] || { echo "detalle el despliegue temporal no quedó listo"; exit 1; }
  cuerpo | curl -sf --max-time 120 -H 'content-type: application/json' -H "x-humo-llave: $HUMO_LLAVE" \
    --data-binary @- "https://$dominio/api/carga" >"$trabajo/respuesta.json" ||
    { echo "detalle la función temporal no respondió"; exit 1; }
fi
node "$PREPARAR" informe <"$trabajo/respuesta.json"
