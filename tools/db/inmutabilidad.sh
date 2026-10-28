#!/usr/bin/env bash
# tools/db/inmutabilidad.sh — C2 (03 §11.6): una migración aplicada en main no se edita, renombra
# ni borra. Falla si `git diff --diff-filter=MDR origin/main -- packages/db/prisma/migrations`
# no está vacío. Corre en el repositorio del directorio actual.
set -euo pipefail

DIR="packages/db/prisma/migrations"

if ! git rev-parse --verify --quiet origin/main >/dev/null; then
  echo "✗ C2: no existe origin/main (corré git fetch origin)" >&2
  exit 2
fi

cambios="$(git diff --no-ext-diff --name-status --diff-filter=MDR origin/main -- "$DIR")"

# [CH-23] Única excepción: m_formatos_bac (TA-181) llegó a main sin haberse aplicado en ninguna base,
# porque las migraciones de 03 que necesita llegaron después (TA-051). Con `prisma migrate deploy` fallaba
# con FN001 (bloqueo en una sentencia suelta). Se permite solo su modificación (M), y solo si el archivo
# nuevo tiene exactamente esta huella; cualquier otro contenido, borrado o renombrado sigue fallando.
BAC="$DIR/20261025000000_m_formatos_bac/migration.sql"
BAC_SHA256="5de4564d2d8ed58e29b91172cdb356f6fb5016078465578490d8dd5721cb2501"
if [ -f "$BAC" ] && [ "$(sha256sum "$BAC" | cut -d' ' -f1)" = "$BAC_SHA256" ]; then
  cambios="$(printf '%s\n' "$cambios" | grep -vxF "$(printf 'M\t%s' "$BAC")" || true)"
fi

if [ -n "$cambios" ]; then
  echo "✗ C2: migraciones ya aplicadas en main editadas, renombradas o borradas:" >&2
  echo "$cambios" >&2
  echo "Un error se corrige con una migración nueva (03 §11.2)." >&2
  exit 1
fi

echo "✓ C2: ninguna migración de main cambió"
