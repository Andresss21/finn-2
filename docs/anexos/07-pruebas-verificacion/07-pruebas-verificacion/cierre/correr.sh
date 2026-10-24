#!/bin/sh
# Repite los scripts de las fases 4, 5 y 6 sobre un directorio de documentos ($1). Imprime el resultado de cada uno.
# $2 = carpeta de los scripts de la Fase 5: '.' (originales: traz05.py, cob05.py) o 'fase5' (actualizados por CT-08: trazabilidad.py, cobertura.py).
D=$1; S5=${2:-fase5}; cd "$(dirname "$0")"
if [ "$S5" = fase5 ]; then T5=fase5/trazabilidad.py; C5=fase5/cobertura.py; else T5=traz05.py; C5=cob05.py; fi
r() { echo "== $1"; shift; "$@" > /tmp/claude-0/sal.txt 2>&1; c=$?; tail -4 /tmp/claude-0/sal.txt; echo "-- salida $c"; }
r "04 t17.py (trazabilidad de 04, BE-63)" python3 -I t17.py $D/04-backend.md
r "05 trazabilidad.py --comprobar" python3 -I $T5 $D/05-frontend.md --comprobar
r "05 cobertura.py" python3 -I $C5 $D/05-frontend.md
r "06 trazabilidad.py (T1–T8)" python3 -I traz06.py $D/06-features.md $D/04-backend.md $D/05-frontend.md
r "06 revisar_fichas.py" python3 -I revisar_fichas.py $D/06-features.md $D/04-backend.md $D/05-frontend.md 77
r "06 prueba_reportes.py" python3 -I prueba_reportes.py
r "06 recorridos.py" python3 -I recorridos/recorridos.py
