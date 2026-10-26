"""Estados sembrados y números esperados de los recorridos 4.3 y 4.6 (06-features.md), calculados con
motor_min.py y, para "Presupuesto contra la realidad", con el prototipo reportes.py (FD-12).

Uso: python3 -I recorridos.py   (desde esta carpeta; imprime cada paso y falla si un número no coincide)
"""
import sys, pathlib, copy
from datetime import date
sys.path.insert(0, str(pathlib.Path(__file__).parent))
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from motor_min import Estado, Gasto, Meta, m, d
import reportes

fallos = []


def esperar(nombre, valor, esperado):
    ok = valor == esperado
    print(f'  {"✓" if ok else "✗"} {nombre}: {valor if not isinstance(valor, int) else d(valor)}'
          + ('' if ok else f'  (esperado {esperado if not isinstance(esperado, int) else d(esperado)})'))
    if not ok: fallos.append(nombre)


# ------------------------------------------------------------------ control: ESC-17 y ESC-15 de 01
def control_01():
    print('Control con 01 §8 (el motor reproduce los escenarios aprobados)')
    e = Estado(hoy=date(2027, 2, 12), efectivo={'Ahorro': 0}, tarjetas={'T': 0},
               categorias=[('Casa', 'Super')])
    e.ingresos.append(('Ahorro', date(2027, 2, 1), m('500')))
    e.asig[('Super', date(2027, 1, 21))] = m('100')
    e.gastos += [Gasto('Ahorro', date(2027, 2, 10), 1000, [('Super', m('60'))]),
                 Gasto('T', date(2027, 2, 10), 1200, [('Super', m('70'))]),
                 Gasto('Ahorro', date(2027, 2, 10), 9999, [('Super', m('20'))])]   # registrado el 12, clave posterior
    n = e.numeros(); r = n['r'][('Super', e.A)]
    esperar('ESC-17 paso 2: LPA', n['lpa'], m('400')); esperar('ESC-17 paso 2: Super', n['disp']['Super'], m('-50'))
    esperar('ESC-17 paso 2: Pago T', n['disp']['Pago T'], m('40')); esperar('ESC-17 paso 2: SobT', r['sobt'], m('30'))
    esperar('ESC-17 paso 2: SobD', r['sobd'], m('20'))
    e.hoy = date(2027, 2, 21); n = e.numeros()
    esperar('ESC-17 paso 3: LPA', n['lpa'], m('380')); esperar('ESC-17 paso 3: S(T)', n['S']['T'], m('30'))


# ------------------------------------------------------------------ 4.3 Inicio de período
def estado_4_3():
    """Hoy 21 abr 2027, primer día de P4 (21 abr – 20 may). P1 = 21 ene – 20 feb, P2, P3 = 21 mar – 20 abr."""
    e = Estado(hoy=date(2027, 4, 21), efectivo={'Ahorro': m('900')},
               categorias=[('Casa', 'Super'), ('Casa', 'Farmacia'), ('Comida fuera', 'Restaurantes'),
                           ('Suscripciones', 'Netflix'), ('Ahorro', 'Fondo')])
    e.metas = {'Super': Meta('mensual', m('300')), 'Netflix': Meta('mensual', m('15.49')),
               'Fondo': Meta('fecha', m('600'), fo=date(2027, 4, 15))}
    P = [date(2027, 1, 21), date(2027, 2, 21), date(2027, 3, 21)]
    clave = iter(range(1, 10_000))
    for i, p in enumerate(P):
        e.ingresos.append(('Ahorro', date(p.year, p.month, 25), m('600')))
        e.asig[('Super', p)] = m('300'); e.asig[('Restaurantes', p)] = m('100')
        e.asig[('Netflix', p)] = m('15.49'); e.asig[('Fondo', p)] = [m('150'), m('150'), m('100')][i]
        e.gastos.append(Gasto('Ahorro', p, next(clave), [('Netflix', m('15.49'))], 'NETFLIX.COM'))   # registro automático del 21
        e.gastos.append(Gasto('Ahorro', date(p.year, p.month, 28), next(clave), [('Super', [m('280'), m('290'), m('310')][i])], 'SUPER SELECTOS'))
        e.gastos.append(Gasto('Ahorro', date(p.year, p.month, 27), next(clave), [('Restaurantes', [m('140'), m('145'), m('150')][i])], 'RESTAURANTES'))
    e.asig[('Farmacia', P[1])] = m('20'); e.asig[('Farmacia', P[2])] = m('35')
    e.gastos.append(Gasto('Ahorro', date(2027, 3, 2), next(clave), [('Farmacia', m('20'))], 'FARMACIA SAN NICOLAS'))
    e.gastos.append(Gasto('Ahorro', date(2027, 4, 2), next(clave), [('Farmacia', m('30.50'))], 'FARMACIA SAN NICOLAS'))
    return e


def recorrido_4_3():
    print('\n4.3 Inicio de período')
    e = estado_4_3()
    n = e.numeros()
    print('  Paso 0 (antes de la tarea diaria)')
    esperar('Ahorro', n['efectivo'], m('1,288.03')); esperar('LPA', n['lpa'], m('863.53'))
    esperar('reducción al cierre de P3', n['reducciones'][date(2027, 3, 21)], m('50'))
    esperar('reducciones P1, P2', [n['reducciones'][date(2027, 1, 21)], n['reducciones'][date(2027, 2, 21)]], [m('40'), m('45')])
    esperar('arrastres a P4', [n['disp'][c] for c in ('Super', 'Farmacia', 'Restaurantes', 'Netflix', 'Fondo')],
            [m('20'), m('4.50'), 0, 0, m('400')])
    esperar('meta Fondo', e.meta('Fondo')['estado'], 'vencida')
    print('  Paso 1: tarea diaria (registro automático de Netflix del 21/04)')
    e.gastos.append(Gasto('Ahorro', date(2027, 4, 21), 20_000, [('Netflix', m('15.49'))], 'NETFLIX.COM'))
    n = e.numeros()
    esperar('Ahorro', n['efectivo'], m('1,272.54')); esperar('LPA', n['lpa'], m('863.53'))
    esperar('Netflix', n['disp']['Netflix'], m('-15.49'))
    print('  Paso 3: detalle de LPA')
    esperar('reducciones por sobregiro con débito (P1 a P3)', sum(n['reducciones'].values()), m('135'))
    print('  Paso 4: extender la meta Fondo al 20/06/2027')
    e.metas['Fondo'].fo = date(2027, 6, 20)
    mt = e.meta('Fondo'); esperar('Fondo: estado', mt['estado'], 'en curso'); esperar('Fondo: pedido (n = 2)', mt['pedido'], m('100'))
    print('  Paso 5: auto-asignar')
    hecho, sin = e.auto_asignar(); n = e.numeros()
    esperar('asignado por auto-asignar', hecho, [('Super', m('300')), ('Netflix', m('15.49')), ('Fondo', m('100'))])
    esperar('sin cubrir (AV-18)', sin, []); esperar('LPA', n['lpa'], m('448.04'))
    esperar('Netflix', n['disp']['Netflix'], 0); esperar('Fondo', n['disp']['Fondo'], m('500'))
    print('  Paso 6: "Tu promedio de gasto" en Farmacia')
    prom = e.promedio_gasto('Farmacia'); esperar('promedio y períodos', prom, (m('25.25'), 2))
    e.asignar('Farmacia', prom[0]); n = e.numeros()
    esperar('Farmacia', n['disp']['Farmacia'], m('29.75')); esperar('LPA', n['lpa'], m('422.79'))
    print('  Paso 7: Presupuesto contra la realidad en Restaurantes')
    hist = e.historial('Restaurantes'); esperar('historial (asig, gastado)', hist,
                                                [(m('100'), m('140')), (m('100'), m('145')), (m('100'), m('150'))])
    real = reportes.realidad(hist, e.asig.get(('Restaurantes', e.A), 0))
    esperar('sugerencia', real, ('se_pasa', m('145'), m('145')))
    e.asignar('Restaurantes', real[2]); n = e.numeros()
    esperar('Restaurantes', n['disp']['Restaurantes'], m('145')); esperar('LPA', n['lpa'], m('277.79'))
    esperar('Ahorro (sin cambios desde el paso 1)', n['efectivo'], m('1,272.54'))


# ------------------------------------------------------------------ 4.6 Cerrar con sobregiros
def estado_4_6():
    """Hoy 12 feb 2027 (P1 = 21 ene – 20 feb). Super: sobregiro mixto; Salidas: sobregiro con débito."""
    e = Estado(hoy=date(2027, 2, 12), efectivo={'Ahorro': 0}, tarjetas={'T': 0},
               categorias=[('Casa', 'Super'), ('Comida fuera', 'Salidas'), ('Vida diaria', 'Ropa')])
    P1 = date(2027, 1, 21)
    e.ingresos.append(('Ahorro', date(2027, 2, 1), m('1000')))
    e.asig[('Super', P1)] = m('100'); e.asig[('Salidas', P1)] = m('100'); e.asig[('Ropa', P1)] = m('80')
    e.gastos += [Gasto('Ahorro', date(2027, 2, 8), 500, [('Salidas', m('150'))], 'LA PAMPA'),
                 Gasto('Ahorro', date(2027, 2, 10), 1000, [('Super', m('60'))], 'SUPER SELECTOS'),
                 Gasto('T', date(2027, 2, 10), 1200, [('Super', m('70'))], 'PRICESMART'),
                 Gasto('Ahorro', date(2027, 2, 10), 9999, [('Super', m('20'))], 'DESPENSA DE DON JUAN')]
    return e


def recorrido_4_6():
    print('\n4.6 Cerrar con sobregiros')
    e = estado_4_6(); n = e.numeros(); r = n['r'][('Super', e.A)]
    print('  Paso 1: Inicio')
    esperar('Ahorro', n['efectivo'], m('770')); esperar('LPA', n['lpa'], m('720'))
    esperar('Super', n['disp']['Super'], m('-50')); esperar('Salidas', n['disp']['Salidas'], m('-50'))
    esperar('Pago T', n['disp']['Pago T'], m('40')); esperar('S(T)', n['S']['T'], m('30'))
    esperar('reducción proyectada al cierre', n['proyectada'], m('70'))
    print('  Paso 2: detalle de Super (reparto D2)')
    esperar('consumos (monto, cubierto, no cubierto)', [(c['monto'], c['cubierto'], c['no_cubierto']) for c in r['consumos']],
            [(m('60'), m('60'), 0), (m('70'), m('40'), m('30')), (m('20'), 0, m('20'))])
    esperar('SobT / SobD', (r['sobt'], r['sobd']), (m('30'), m('20')))
    print('  Paso 3: mover $50.00 de Ropa a Salidas')
    e.mover('Ropa', 'Salidas', m('50')); n = e.numeros()
    esperar('Salidas', n['disp']['Salidas'], 0); esperar('Ropa', n['disp']['Ropa'], m('30')); esperar('LPA', n['lpa'], m('720'))
    esperar('reducción proyectada al cierre', n['proyectada'], m('20'))
    print('  Paso 4: cierre (hoy 21 feb, A = P2)')
    e.hoy = date(2027, 2, 21); n = e.numeros()
    esperar('LPA', n['lpa'], m('700')); esperar('S(T)', n['S']['T'], m('30'))
    esperar('Disponibles en P2', {c: v for c, v in n['disp'].items() if v}, {'Ropa': m('30'), 'Pago T': m('40')})
    print('  Paso 5: asignar $30.00 a Pago T en P2')
    e.asignar('Pago T', m('30')); n = e.numeros()
    esperar('S(T)', n['S']['T'], 0); esperar('Pago T', n['disp']['Pago T'], m('70')); esperar('LPA', n['lpa'], m('670'))
    print('  Paso 6: detalle de LPA')
    esperar('reducción de P1', n['reducciones'][date(2027, 1, 21)], m('20'))
    entradas = m('1000'); asignado = sum(e.asig.values())
    esperar('descomposición: entradas − asignado − reducciones', entradas - asignado - m('20'), n['lpa'])


control_01(); recorrido_4_3(); recorrido_4_6()
print('\nRESULTADO:', 'PASA' if not fallos else 'FALLA ' + ', '.join(fallos))
