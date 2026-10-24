K=1179209294
prueba() {
  echo "-- cliente A toma un bloqueo DE SESIÓN con la clave global y lo deja tomado (por el pooler):"
  PGPASSWORD=a psql -h 127.0.0.1 -p 6432 -U finn_app -d $1 -Atc "SELECT pg_advisory_lock($K)" 2>&1 | sed 's/^/   /'
  ok=0; rech=0
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if PGPASSWORD=a psql -h 127.0.0.1 -p 6432 -U finn_app -d $1 -v ON_ERROR_STOP=1 -qAt -c "BEGIN; INSERT INTO finn.deudores (nombre) VALUES ('sin bloqueo $i'); COMMIT;" >/dev/null 2>/tmp/claude-0/err.txt; then ok=$((ok+1)); else grep -q FN001 /tmp/claude-0/err.txt && rech=$((rech+1)); fi
  done
  echo "-- cliente B, 10 escrituras SIN tomar_bloqueo() por el pooler (2 conexiones de servidor): pasaron $ok, rechazadas con FN001 $rech"
  if PGPASSWORD=a psql -h 127.0.0.1 -p 6432 -U finn_app -d $1 -v ON_ERROR_STOP=1 -qAt -c "BEGIN; SELECT finn.tomar_bloqueo(); INSERT INTO finn.deudores (nombre) VALUES ('con bloqueo'); COMMIT;" >/dev/null 2>&1; then echo "-- con tomar_bloqueo(): pasa"; else echo "-- con tomar_bloqueo(): FALLA"; fi
  psql -h /tmp -p 5433 -U postgres -d postgres -qAtc "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname='$1'" >/dev/null
}
for b in p04_actual p04_marca; do psql -h /tmp -p 5433 -U postgres -d postgres -qc "DROP DATABASE IF EXISTS finn_$b WITH (FORCE)" -c "CREATE DATABASE finn_$b TEMPLATE finn_v7" 2>/dev/null; done
psql -h /tmp -p 5433 -U postgres -d finn_p04_marca -qf marca.sql
echo "== diseño actual de 03 (POOL-04)"; prueba finn_p04_actual
echo "== con la marca local de la transacción"; prueba finn_p04_marca
echo "== control: con la marca, una marca puesta a mano con otro valor no sirve"
PGPASSWORD=a psql -h 127.0.0.1 -p 6432 -U finn_app -d finn_p04_marca -qAt -c "BEGIN; SELECT set_config('finn.bloqueo_xact','1',true); INSERT INTO finn.deudores (nombre) VALUES ('marca falsa'); COMMIT;" 2>&1 | grep -c FN001 | sed 's/^/   rechazos FN001: /'
