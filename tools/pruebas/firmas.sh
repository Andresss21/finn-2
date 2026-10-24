#!/usr/bin/env bash
# tools/pruebas/firmas.sh — PRU-SEG-OPER-001 (07 §22.2 y §29.1, M17, P7-20). Portado de V7-12 y V7-17.
# Uso: bash tools/pruebas/firmas.sh <rama-base>     (en `rapido`; sale con 0 si pasa, 1 si falla, 2 si no puede verificar)
#   1. lee pruebas/firmantes-permitidos de la rama BASE (nunca del PR) y exige exactamente una clave;
#   2. cada fila actual de los archivos protegidos viene de un commit firmado con esa clave (git blame);
#   3. todo commit que tocó un archivo protegido está firmado con esa clave, lo que cubre las filas borradas.
# Archivos protegidos: pruebas/manuales/resultados.md, pruebas/firmantes-permitidos y plan/tu.md (DT-04).
set -u
BASE=${1:?uso: firmas.sh <rama-base>}
cd "$(git rev-parse --show-toplevel)" || exit 2
FIRMANTES=pruebas/firmantes-permitidos
FILAS=(pruebas/manuales/resultados.md plan/tu.md)
PROTEGIDOS=(pruebas/manuales/resultados.md "$FIRMANTES" plan/tu.md)

git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || { echo "FALLA no existe la rama base $BASE"; exit 2; }
F=$(mktemp) || exit 2
trap 'rm -f "$F"' EXIT
if ! git show "$BASE:$FIRMANTES" >"$F" 2>/dev/null; then
  echo "FALLA $BASE no tiene $FIRMANTES (lo agrega el usuario en TU-05 con un push firmado a main)"
  exit 2
fi
# Una clave por línea; se ignoran las líneas vacías y los comentarios
CLAVES=$(grep -Ev '^[[:space:]]*(#|$)' "$F")
n=$(printf '%s' "$CLAVES" | grep -c .)
if [ "$n" -ne 1 ]; then
  echo "FALLA $FIRMANTES en $BASE tiene $n claves; debe tener exactamente 1 (07 §29.1)"
  exit 1
fi
printf '%s\n' "$CLAVES" >"$F"

# Verifica con ssh-keygen (no con el programa de firma de la sesión) contra los firmantes de la base
firmado() {
  git -c gpg.format=ssh -c gpg.ssh.program=ssh-keygen -c gpg.ssh.allowedSignersFile="$F" \
    verify-commit "$1" >/dev/null 2>&1
}
desc() { git log -1 --format='%h %s' "$1"; }
mal=0

# 2. git blame por fila (el árbol de trabajo: una fila sin confirmar también falla)
for archivo in "${FILAS[@]}"; do
  [ -f "$archivo" ] || continue
  for c in $(git blame --line-porcelain -- "$archivo" | grep -E '^[0-9a-f]{40} ' | cut -d' ' -f1 | sort -u); do
    if [ "$c" = 0000000000000000000000000000000000000000 ]; then
      echo "FALLA $archivo tiene filas sin confirmar"
      mal=1
    elif firmado "$c"; then
      echo "ok    filas de $archivo en $(desc "$c")"
    else
      echo "FALLA filas de $archivo en $(desc "$c"): commit sin firma válida"
      mal=1
    fi
  done
done

# 3. Todo commit que tocó un archivo protegido. Con la simplificación por defecto de git log: un merge que solo trae
# lo de main no cuenta como cambio, y uno que edita el archivo al resolver un conflicto sí aparece.
for c in $(git log --format=%H -- "${PROTEGIDOS[@]}"); do
  if ! firmado "$c"; then
    echo "FALLA commit $(desc "$c") tocó un archivo protegido sin firma válida"
    mal=1
  fi
done

if [ "$mal" -eq 0 ]; then echo "PASA"; else echo "FALLA"; fi
exit "$mal"
