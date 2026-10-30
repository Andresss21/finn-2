#!/bin/bash
set +x
# tools/humo/pasos/base.sh <paso> — los pasos cortos de 04 §17.2: H-01 a H-04, H-07, H-11
# y H-12. Cada uno escribe `medido …` y `detalle …` y sale con 0 (pasa), 1 (falla) o 3 (omitido).
. "$(dirname "$0")/comun.sh"

# H-01 (P4-17): la versión real de PostgreSQL, como `postgres`. Pasa con 15, 16 o 17.
h01() {
  local num mayor repo
  num=$(q "$HUMO_ADMIN_URL" 'SHOW server_version_num')
  mayor=$((num / 10000))
  repo=$(sed -n 's/^PG_MAYOR=\([0-9]*\).*/\1/p' infra/versiones.env)
  echo "medido version $num"
  echo "medido mayor $mayor"
  echo "medido pg_mayor_repo $repo"
  [ "$mayor" = "$repo" ] || echo "detalle PG_MAYOR de infra/versiones.env ($repo) no es la versión real ($mayor)"
  if [ "$mayor" -gt 17 ]; then
    echo "detalle mayor que 17: revisar las notas de la versión antes de producción y configurar la CI con ella"
    return 1
  fi
  [ "$mayor" -ge 15 ] || { echo "detalle menor que 15: no previsto"; return 1; }
}

# H-02 (03 §13.5 B1): bootstrap.sql con `postgres` y los atributos de los tres roles (03 §8.2)
h02() {
  local roles lectura esperado='finn_app:0100 finn_migraciones:0000 finn_respaldo:0100'
  $PGX psql "$HUMO_ADMIN_URL" -X -q -v ON_ERROR_STOP=1 \
    -v clave_migraciones="$HUMO_CLAVE_MIGRACIONES" -v clave_app="$HUMO_CLAVE_APP" \
    -v clave_respaldo="$HUMO_CLAVE_RESPALDO" -f tools/db/bootstrap.sql >/dev/null
  # rolinherit, rolbypassrls, rolcreaterole y rolcreatedb, en ese orden
  roles=$(q "$HUMO_ADMIN_URL" "SELECT string_agg(format('%s:%s%s%s%s', rolname, rolinherit::int,
    rolbypassrls::int, rolcreaterole::int, rolcreatedb::int), ' ' ORDER BY rolname) FROM pg_roles
    WHERE rolname IN ('finn_migraciones', 'finn_app', 'finn_respaldo')")
  lectura=$(q "$HUMO_ADMIN_URL" "SELECT coalesce('default_transaction_read_only=on' = ANY (rolconfig), false)
    FROM pg_roles WHERE rolname = 'finn_respaldo'")
  echo "medido roles $roles"
  echo "medido respaldo_solo_lectura $lectura"
  [ "$roles" = "$esperado" ] || { echo "detalle se esperaba $esperado; alternativa: 03 §13.5"; return 1; }
  [ "$lectura" = t ] || { echo "detalle finn_respaldo sin default_transaction_read_only = on"; return 1; }
}

# H-03 (03 §13.5 B2): finn_migraciones tiene CREATE sobre la base
h03() {
  local v
  v=$(q "$HUMO_ADMIN_URL" "SELECT has_database_privilege('finn_migraciones', current_database(), 'CREATE')")
  echo "medido create $v"
  [ "$v" = t ] || { echo "detalle alternativa: 03 §13.5 (el bootstrap crea el esquema)"; return 1; }
}

# H-04 (03 §13.5 B3): los tres roles por el pooler, en el puerto de transacción y en el de sesión
h04() {
  local mal=0 rol puerto r
  for rol in finn_migraciones finn_app finn_respaldo; do
    for puerto in "$HUMO_PUERTO_TX" "$HUMO_PUERTO_SESION"; do
      r=$(q "$(url "$rol" "$puerto")" "SELECT current_user || ' ' || current_setting('search_path')" 2>&1) || true
      if [ "${r%% *}" = "$rol" ] && { [ "$rol" != finn_migraciones ] || [ "${r#* }" = finn ]; }; then
        echo "medido ${rol}_$puerto pasa"
      else
        mal=$((mal + 1))
        echo "medido ${rol}_$puerto falla"
        echo "detalle $rol en $puerto: $r"
      fi
    done
  done
  [ "$mal" = 0 ] || { echo "detalle alternativa: 03 §13.5 (conexión directa) o RK-06"; return 1; }
}

# H-07 (BE-33): la zona de la sesión por el puerto de transacción, en sus tres casos
h07() {
  local sin con tx
  sin=$(q "$(url finn_app "$HUMO_PUERTO_TX")" 'SHOW TimeZone')
  con=$(q "$(url finn_app "$HUMO_PUERTO_TX" 'options=-c%20TimeZone%3DUTC')" 'SHOW TimeZone')
  tx=$($PGX psql "$(url finn_app "$HUMO_PUERTO_TX")" -X -q -At -v ON_ERROR_STOP=1 \
    -c "BEGIN; SELECT set_config('TimeZone', 'UTC', true); SHOW TimeZone; COMMIT;" | tail -n 1)
  echo "medido sin_options $sin"
  echo "medido con_options $con"
  echo "medido transaccion $tx"
  [ "$con" = UTC ] || echo "detalle options no llega a la base: la barrera es set_config (04 §13.6)"
  [ "$tx" = UTC ] || { echo "detalle bloqueo de la Fase 8: set_config('TimeZone', 'UTC', true) no da UTC"; return 1; }
}

# H-11 (ADR-04): la Data API no responde datos con la clave pública
h11() {
  local cuerpo codigo
  [ -n "${SUPABASE_URL:-}" ] || { echo "detalle falta SUPABASE_URL"; return 1; }
  [ -n "${HUMO_CLAVE_PUBLICA:-}" ] || { echo "detalle falta HUMO_CLAVE_PUBLICA: sin clave la respuesta no prueba nada"; return 1; }
  cuerpo=$(mktemp)
  codigo=$(curl -s -o "$cuerpo" -w '%{http_code}' -H "apikey: $HUMO_CLAVE_PUBLICA" \
    -H "Authorization: Bearer $HUMO_CLAVE_PUBLICA" "${SUPABASE_URL%/}/rest/v1/") || true
  rm -f "$cuerpo"
  echo "medido http $codigo"
  case $codigo in
    2??) echo "detalle la Data API responde: desactivarla en el panel y repetir"; return 1 ;;
    000) echo "detalle sin respuesta de SUPABASE_URL"; return 1 ;;
  esac
}

# H-12: limpieza. El esquema `humo` (H-09) y las filas `humo-%` de H-06 (TA-243); el usuario de prueba y el despliegue son de TA-253
h12() {
  local esquema filas
  q "$HUMO_ADMIN_URL" 'DROP SCHEMA IF EXISTS humo CASCADE' >/dev/null
  esquema=$(q "$HUMO_ADMIN_URL" "SELECT count(*) FROM pg_namespace WHERE nspname = 'humo'")
  filas=$(q "$(url finn_app "$HUMO_PUERTO_SESION")" "SELECT count(*) FROM finn.deudores WHERE nombre LIKE 'humo-%'")
  echo "medido esquema_humo $esquema"
  echo "medido filas_humo $filas"
  echo "detalle usuario de prueba y despliegue temporal: los limpia TA-253 (H-09, H-10)"
  [ "$esquema" = 0 ] && [ "$filas" = 0 ]
}

case ${1:-} in
  H-01) h01 ;; H-02) h02 ;; H-03) h03 ;; H-04) h04 ;; H-07) h07 ;; H-11) h11 ;; H-12) h12 ;;
  *) echo "detalle paso desconocido: ${1:-}"; exit 1 ;;
esac
