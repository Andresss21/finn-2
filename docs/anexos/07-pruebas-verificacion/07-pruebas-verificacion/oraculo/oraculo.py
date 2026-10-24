"""Oráculo diferencial (V7-03): ejecuta motor_min.py (Fase 6) sobre casos JSON y devuelve los números."""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datetime import date
from motor_min import Estado, Gasto
d = lambda s: date.fromisoformat(s)
out = []
for h in json.load(open(sys.argv[1])):
    e = Estado(hoy=d(h['hoy']), efectivo=dict(h['efectivo']), tarjetas=dict(h['tarjetas']),
               categorias=[('G', c) for c in h['categorias']],
               ingresos=[(c, d(f), m) for c, f, m in h['ingresos']],
               gastos=[Gasto(g['cuenta'], d(g['fecha']), g['clave'] * 1000 + int(g['id'][1:]), [tuple(l) for l in g['lineas']]) for g in h['gastos']],
               pagos=[(o, t, d(f), m) for o, t, f, m in h['pagos']],
               asig={(c, d(p)): m for c, p, m in h['asig']},
               devoluciones=[(c, d(f), cat, m) for c, f, cat, m in h['devoluciones']])
    try:
        n = e.numeros()
        out.append(dict(lpa=n['lpa'], efectivo=n['efectivo'], disp=n['disp'], S=n['S'], sobta=n['sobta']))
    except AssertionError as x:
        out.append(dict(error=str(x)))
json.dump(out, open(sys.argv[2], 'w'))
