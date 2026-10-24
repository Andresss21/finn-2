#!/bin/sh
# PRU-SEG-OPER-001 (M17, V7-12 y V7-17). Uso: firmas.sh <rama-base>
# 1) pruebas/firmantes-permitidos de la rama base tiene exactamente una clave (la del usuario, P7-20).
# 2) Cada fila actual de pruebas/manuales/resultados.md viene de un commit firmado con esa clave (git blame).
# 3) Todo commit que tocó resultados.md o firmantes-permitidos está firmado con esa clave (cubre filas borradas).
BASE=${1:-HEAD}
F=$(mktemp); git show "$BASE:pruebas/firmantes-permitidos" 2>/dev/null | grep -v '^\s*#' | grep -v '^\s*$' > "$F" || { echo "FALLA sin firmantes-permitidos en $BASE"; exit 2; }
n=$(wc -l < "$F"); [ "$n" -eq 1 ] || { echo "FALLA firmantes-permitidos tiene $n claves; debe tener exactamente 1"; rm -f "$F"; exit 1; }
verif() { git -c gpg.ssh.program=ssh-keygen -c gpg.ssh.allowedSignersFile="$F" verify-commit "$1" >/dev/null 2>&1; }
mal=0
if [ -f pruebas/manuales/resultados.md ]; then
  for c in $(git blame --line-porcelain pruebas/manuales/resultados.md | grep -E '^[0-9a-f]{40} ' | cut -d' ' -f1 | sort -u); do
    if [ "$c" = "0000000000000000000000000000000000000000" ]; then echo "FALLA filas sin confirmar en resultados.md"; mal=1; continue; fi
    verif "$c" && echo "ok    fila de $(git log -1 --format='%h %s' $c)" || { echo "FALLA fila de $(git log -1 --format='%h %s' $c): commit sin firma válida"; mal=1; }
  done
fi
for c in $(git log --format=%H -- pruebas/manuales/resultados.md pruebas/firmantes-permitidos); do
  verif "$c" || { echo "FALLA commit $(git log -1 --format='%h %s' $c) tocó los archivos de resultados sin firma válida"; mal=1; }
done
rm -f "$F"; [ $mal -eq 0 ] && echo "PASA"; exit $mal
