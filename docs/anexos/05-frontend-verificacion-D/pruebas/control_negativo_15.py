# Control negativo de V5-36: altera una fila de §15 y quita OP-48 del mapa; `trazabilidad.py --comprobar` debe fallar con 2 errores.
import sys, re
s = open(sys.argv[1], encoding='utf-8').read()
i = s.index('## 15. Trazabilidad'); a, b = s[:i], s[i:]
b = b.replace('| OP-20 | `/registrar/gasto`', '| OP-20 | `/registrar/gastos`', 1)
a = a.replace('OP-48', 'OP-4X')
open(sys.argv[2], 'w', encoding='utf-8').write(a + b)
