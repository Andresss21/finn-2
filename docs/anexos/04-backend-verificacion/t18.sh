#!/usr/bin/env bash
# V-30 (indicativa, RK-22): costo de las verificaciones diferidas por fila al confirmar una escritura masiva.
# Usa la versión REDUCIDA de x_verificar_transaccion del subconjunto; no reemplaza la medición con el esquema completo.
P="psql -h /tmp -p 5433 -U postgres -d finn -qAt"
for n in 1000 5000 10000; do
  $P <<SQL
\timing on
BEGIN; SET LOCAL ROLE finn_app; SELECT finn.tomar_bloqueo() \g /dev/null
UPDATE finn.lineas SET monto = monto WHERE id IN (SELECT id FROM finn.lineas ORDER BY id LIMIT $n);
\echo n=$n COMMIT (verificaciones diferidas):
COMMIT;
SQL
done
