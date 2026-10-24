# Genera la copia alterada de 05-frontend.md para el control negativo de V5-18.
import re, sys
s = open(sys.argv[1], encoding='utf-8').read()
s = re.sub(r'\n\| `/metas` \|[^\n]*', '', s, count=1)                                   # quita una fila
s = s.replace('AV-24 (después, `transferencia-deuda`)', '(después)')                    # quita el único AV-24
s = s.replace("`formulario({ operacion: 'regla' })`", "`formulario({ operacion: 'reglas' })`")  # variante mal escrita
s = s.replace("| `/ajustes/ciclo` | [C] | `ajustes()` |", "| `/ajustes/ciclo` | [C] | Sin consulta |")   # ruta sin consulta
s = s.replace("| `diagnostico` | `/ajustes/diagnostico` |", "| `diagnostico` | `/ajustes/diag` |")       # destino roto
s = s.replace('← `?horizonte=` (por defecto 30)', '← `?horizontes=` (por defecto 30)')   # parámetro fuera del catálogo
open(sys.argv[2], 'w', encoding='utf-8').write(s)
