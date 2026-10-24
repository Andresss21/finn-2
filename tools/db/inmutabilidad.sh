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

if [ -n "$cambios" ]; then
  echo "✗ C2: migraciones ya aplicadas en main editadas, renombradas o borradas:" >&2
  echo "$cambios" >&2
  echo "Un error se corrige con una migración nueva (03 §11.2)." >&2
  exit 1
fi

echo "✓ C2: ninguna migración de main cambió"
