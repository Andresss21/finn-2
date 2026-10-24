"""CF-25 (06 §5.8): fórmulas de los campos nuevos, casos borde de los criterios y propiedad de la barra.

Uso: python3 cf25.py
"""
import random, sys, pathlib
from datetime import date, timedelta
from fractions import Fraction
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from motor_min import Estado, Gasto, m, d, redondear

BP = 10_000


def bp(parte, base):
    return redondear(Fraction(parte * BP, base))


def barra(r):
    """FilaCategoria.barra desde los derivados de 01: cubierto del reparto D2 (§4.5) y sobregiro SobT + SobD (§4.7)."""
    fondo_pos, cub, exc = max(0, r['fondo']), r['cubierto'], r['sobt'] + r['sobd']
    base = max(fondo_pos, cub + exc)
    if base == 0:
        return None                     # sin fondo, sin consumos y sin sobregiro
    e = max(1, bp(exc, base)) if exc else 0
    c = min(bp(cub, base), BP - e)
    tipo = None if not exc else 'mixto' if r['sobt'] and r['sobd'] else 'tarjeta' if r['sobt'] else 'debito'
    return dict(cubiertoBp=c, excedenteBp=e, tipoExcedente=tipo)


def tipo_sobregiro(r):          # SobregiroDto.tipo (04 6.0.3), el del indicador
    if r['disp'] >= 0: return None
    return 'mixto' if r['sobt'] and r['sobd'] else 'tarjeta' if r['sobt'] else 'debito'


def barras_posicion(activos, deudas):
    mayor = max(activos, deudas)
    if mayor == 0: return dict(activosBp=0, deudasBp=0)
    f = lambda x: 0 if x == 0 else max(1, bp(x, mayor))
    return dict(activosBp=f(activos), deudasBp=f(deudas))


def uso_sin_reservar(S, limite):
    if not limite: return None
    return min(BP, bp(S, limite))


def porcentaje_referencia(gasto, ref):
    return None if ref <= 0 else bp(gasto, ref)


fallos = []


def ver(nombre, v, esp):
    ok = v == esp
    print(f'  {"✓" if ok else "✗"} {nombre}: {v}' + ('' if ok else f' (esperado {esp})'))
    if not ok: fallos.append(nombre)


def una(cat_asig, gastos, dev=0, hoy=date(2027, 2, 15)):
    e = Estado(hoy=hoy, efectivo={'Ahorro': m('1000')}, tarjetas={'T': 0}, categorias=[('G', 'C')])
    e.asig[('C', date(2027, 1, 21))] = cat_asig
    for i, (cu, x) in enumerate(gastos):
        e.gastos.append(Gasto(cu, date(2027, 2, 10), i, [('C', x)]))
    if dev: e.devoluciones.append(('Ahorro', date(2027, 2, 12), 'C', dev))
    return e.numeros()['r'][('C', e.A)]


print('Barra de gastado (FT-09)')
r = una(m('120'), [('Ahorro', m('146.30'))])
ver('CA-09.8 débito', barra(r), dict(cubiertoBp=8202, excedenteBp=1798, tipoExcedente='debito'))
r = una(m('100'), [('Ahorro', m('60')), ('T', m('70')), ('Ahorro', m('20'))])
ver('CA-09.9 mixto (ESC-17 paso 2)', barra(r), dict(cubiertoBp=6667, excedenteBp=3333, tipoExcedente='mixto'))
r = una(m('-20'), [])
ver('CA-09.10 desasignación sin consumos', (barra(r), tipo_sobregiro(r)), (dict(cubiertoBp=0, excedenteBp=10000, tipoExcedente='debito'), 'debito'))
r = una(m('50'), [('Ahorro', m('80'))], dev=m('30'))
ver('CA-09.11 con devolución D-2', (barra(r), tipo_sobregiro(r)), (dict(cubiertoBp=10000, excedenteBp=0, tipoExcedente=None), None))
r = una(0, [])
ver('CA-09.12 sin fondo ni consumos', barra(r), None)
r = una(m('-20'), [('Ahorro', m('30'))])
ver('fondo negativo con consumo (cubierto ≥ 0)', barra(r), dict(cubiertoBp=0, excedenteBp=10000, tipoExcedente='debito'))

print('Propiedad (CA-09.13): excedenteBp > 0 ⇔ sobregiro, mismo tipo; 0 ≤ cubierto; suma ≤ 10.000')
rnd = random.Random(6)
for _ in range(20_000):
    gs = [(rnd.choice(['Ahorro', 'T']), rnd.randint(1, 30_000)) for _ in range(rnd.randint(0, 5))]
    r = una(rnd.randint(-5_000, 40_000), gs, dev=rnd.choice([0, 0, rnd.randint(1, 10_000)]))
    b, t = barra(r), tipo_sobregiro(r)
    ok = (b is None and t is None and r['fondo'] <= 0 and not gs) or (
        b is not None and (b['excedenteBp'] > 0) == (t is not None) and b['tipoExcedente'] == t
        and b['cubiertoBp'] >= 0 and b['cubiertoBp'] + b['excedenteBp'] <= BP)
    if not ok:
        fallos.append(f'propiedad: {r} {b} {t}'); break
print('  ✓ 20.000 casos' if not any(f.startswith('propiedad') for f in fallos) else '  ✗ propiedad')

print('Posición neta y tarjetas (FT-51)')
ver('CA-51.6 ESC-01 paso 4 (activos $1,000.00, deudas $5,300.00)', barras_posicion(m('1000'), m('5300')), dict(activosBp=1887, deudasBp=10000))
ver('CA-51.7 sin activos ni deudas', barras_posicion(0, 0), dict(activosBp=0, deudasBp=0))
ver('CA-51.7 iguales', barras_posicion(m('10'), m('10')), dict(activosBp=10000, deudasBp=10000))
ver('CA-51.8 Visa Oro A.7 (S $18.75, límite $2,500.00)', uso_sin_reservar(m('18.75'), m('2500')), 75)
ver('CA-51.8 sin límite o límite 0', (uso_sin_reservar(m('18.75'), None), uso_sin_reservar(m('18.75'), 0)), (None, None))
ver('CA-51.8 tope', uso_sin_reservar(m('3000'), m('2500')), 10000)

print('Gasto semanal (FT-61)')
ref_acum = lambda k, dias: redondear(Fraction(m('350') * min(7 * k, 30), 30))
ref4 = ref_acum(4, 30) - ref_acum(3, 30)
ver('CA-61.6 A.7 semana 4: referencia', ref4, m('81.67'))
ver('CA-61.6 porcentajeReferenciaBp', porcentaje_referencia(m('35'), ref4), 4286)
ver('CA-61.6 diferenciaReferencia (ref. acumulada − gasto acumulado)', ref_acum(4, 30) - m('287.15'), m('39.52'))
ver('CA-61.7 asignado negativo o cero', (porcentaje_referencia(m('35'), 0),), (None,))

print('Detalle de categoría (FT-14) y meta')
ver('CA-14.7 cubrir el sobregiro de Restaurantes (A.7)', m('120') + m('26.30'), m('146.30'))
ver('CA-14.10 progreso de la meta (A.7, $1,350.00 de $3,000.00)', min(BP, bp(m('1350'), m('3000'))), 4500)

print('\nRESULTADO:', 'PASA' if not fallos else 'FALLA ' + str(fallos[:3]))
