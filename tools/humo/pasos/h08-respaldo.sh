#!/bin/bash
set +x
# H-08 (04 §17.2; RK-21; 03 §12.1 y §12.2, pasos 2 a 8): `respaldar.mjs` como finn_respaldo por el puerto de sesión
# y `restaurar.sh` en un PostgreSQL local vacío de la misma versión mayor, en Docker, que se borra al terminar.
# La lista de catálogo esperada es catalogo-esperado.txt del commit actual; `hoy` es finn.hoy() del proyecto.
. "$(dirname "$0")/comun.sh"
command -v docker >/dev/null || { echo "detalle falta Docker para el contenedor de restauración"; exit 1; }
mayor=$(($(q "$HUMO_ADMIN_URL" 'SHOW server_version_num') / 10000))
hoy=$(q "$HUMO_ADMIN_URL" 'SELECT finn.hoy()')
trabajo=$(mktemp -d)
destino=$(docker run -d --rm -e POSTGRES_PASSWORD="$HUMO_CLAVE_DESTINO" -p 127.0.0.1::5432 \
  --add-host host.docker.internal:host-gateway "public.ecr.aws/docker/library/postgres:$mayor")
trap 'docker rm -f "$destino" >/dev/null 2>&1; rm -rf "$trabajo"' EXIT
listo=0
for _ in $(seq 600); do
  if docker exec "$destino" pg_isready -q -h 127.0.0.1; then listo=1; break; fi
done
[ "$listo" = 1 ] || { echo "detalle el PostgreSQL de restauración no quedó listo"; exit 1; }
puerto=$(docker port "$destino" 5432/tcp | head -n 1 | sed 's/.*://')
export PGHOST=127.0.0.1 PGPORT=$puerto PGUSER=postgres PGPASSWORD=$HUMO_CLAVE_DESTINO
# Solo la prueba: FINN_PG_EXEC corre psql, pg_dump y pg_restore dentro del contenedor de restauración
if [ -n "${FINN_PG_EXEC:-}" ]; then export FINN_PG_CONTENEDOR=$destino FINN_PG_DESTINO_PUERTO=$puerto; fi

node tools/respaldo/respaldar.mjs "$(url finn_respaldo "$HUMO_PUERTO_SESION")" "$trabajo/volcado.dump"
echo "medido snapshot pasa"
salida=$(bash tools/respaldo/restaurar.sh "$trabajo/volcado.dump" "$trabajo/volcado.dump.manifiesto.json" \
  packages/db/prisma/catalogo-esperado.txt finn_humo "$hoy" 2>&1) || { echo "$salida" | tail -n 6; exit 1; }
echo "medido conteos $(echo "$salida" | sed -n 's/^ *\([0-9]* tablas, [0-9]* diferencias\).*/\1/p')"
echo "medido restauracion pasa"
echo "detalle Restauración verificada (pasos 2 a 10 de restaurar.sh)"
