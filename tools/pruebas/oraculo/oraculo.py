"""Oráculo diferencial (07 §3.1, CT-05; PRU-PROP-MOTOR-106). Adaptado del oraculo.py de V7-03.

Lee de la entrada estándar una lista JSON de casos en el formato de motor_min.py (Fase 6, alcance
congelado de V7-03) y escribe en la salida estándar, por caso, los números de motor_min: LPA, saldo
de efectivo, Disponibles del período activo, S(t), deuda(t), RE(t) y SobTA. RE no lo da motor_min:
sale de sus números con 01 §4.8, RE(t) = máx(0, R⁺(t) − deuda(t)), R⁺(t) = máx(0, Disp(pago(t), A)).
Un caso que rompe la identidad de saldo (la aserción de motor_min) devuelve {"error": ...}.
Se ejecuta con `python -I`: el directorio del script se agrega a mano para importar motor_min.
"""
import json
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor_min import Estado, Gasto  # noqa: E402


def d(s):
    return date.fromisoformat(s)


def numeros(h):
    e = Estado(hoy=d(h['hoy']), efectivo=dict(h['efectivo']), tarjetas=dict(h['tarjetas']),
               categorias=[('G', c) for c in h['categorias']],
               ingresos=[(c, d(f), m) for c, f, m in h['ingresos']],
               gastos=[Gasto(g['cuenta'], d(g['fecha']), g['clave'], [tuple(x) for x in g['lineas']])
                       for g in h['gastos']],
               pagos=[(o, t, d(f), m) for o, t, f, m in h['pagos']],
               asig={(c, d(p)): m for c, p, m in h['asig']},
               devoluciones=[(c, d(f), cat, m) for c, f, cat, m in h['devoluciones']])
    try:
        n = e.numeros()
    except AssertionError as x:
        return dict(error=str(x))
    deuda = {t: max(0, x) for t, x in n['deuda'].items()}
    re = {t: max(0, max(0, n['disp'][e.pago(t)]) - deuda[t]) for t in deuda}
    return dict(lpa=n['lpa'], efectivo=n['efectivo'], disp=n['disp'], S=n['S'], deuda=deuda, RE=re,
                sobta=n['sobta'])


json.dump([numeros(h) for h in json.load(sys.stdin)], sys.stdout)
