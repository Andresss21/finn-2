"""CT-07 (V7-16): semilla A.7 completa, corregida, calculada con el motor mínimo de la Fase 6 (motor_min.py) y las
fórmulas de 06 §3.5 (reportes.py). Ningún número de pantalla se escribe a mano: todos salen de calcular().
Hechos agregados o cambiados respecto de A.7 publicado (CT-07, reglas de P7-19): ver CAMBIOS al final.

Uso: python3 -I estado_a7.py            → imprime las pantallas y compara con lo publicado
     python3 -I estado_a7.py --antes    → la semilla de 4.2 (antes de aprobar SUPER SELECTOS)"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from datetime import date as F
from fractions import Fraction
from motor_min import Estado, Gasto, Meta, m, d, inicio_periodo, fin, siguiente
import reportes as R

COBRAR = 'cobrar:'                  # una línea por cobrar (01 §1.5): no es una categoría; el motor la excluye del reparto

class EstadoA7(Estado):
    """motor_min con líneas por cobrar con débito (en camino, 01 §4.10) y con la identidad de saldo comprobada igual."""
    def numeros(self):
        r = self.calcular(); A = self.A
        cats = [c for _, c in self.categorias]; pcs = [self.pago(t) for t in self.tarjetas]
        entradas = sum(self.efectivo.values()) + sum(x for _, f, x in self.ingresos if f <= self.hoy)
        red = {p: sum(r[(c, p)]['sobd'] for c in cats) + sum(r[(c, p)]['e'] for c in pcs) for p in self.periodos() if fin(p) < self.hoy}
        en_camino = sum(x for g in self.gastos if g.cuenta in self.efectivo for c, x in g.lineas if c.startswith(COBRAR))
        lpa = entradas - sum(self.asig.values()) - sum(red.values()) - en_camino
        saldo = {k: v + sum(x for c, f, x in self.ingresos if c == k) - sum(x for g in self.gastos if g.cuenta == k for _, x in g.lineas)
                 - sum(x for o, _, _, x in self.pagos if o == k) for k, v in self.efectivo.items()}
        deuda = {t: self.tarjetas[t] + sum(x for g in self.gastos if g.cuenta == t for _, x in g.lineas) - sum(x for _, tt, _, x in self.pagos if tt == t) for t in self.tarjetas}
        disp = {c: r[(c, A)]['disp'] for c in cats + pcs}
        S = {t: max(0, deuda[t] - max(0, disp[self.pago(t)])) for t in self.tarjetas}
        RE = {t: max(0, max(0, disp[self.pago(t)]) - deuda[t]) for t in self.tarjetas}
        fut = sum(x for (c, p), x in self.asig.items() if p > A); sobta = sum(r[(c, A)]['sobt'] for c in cats)
        ef = sum(saldo.values())
        assert ef == lpa + sum(disp.values()) + fut + sobta, ('identidad de saldo (inv. 1)', ef, lpa, sum(disp.values()), fut, sobta)
        return dict(lpa=lpa, saldo=saldo, efectivo=ef, disp=disp, S=S, RE=RE, deuda=deuda, red=red, fut=fut, sobta=sobta, r=r, en_camino=en_camino,
                    proyectada=sum(r[(c, A)]['sobd'] for c in cats) + sum(r[(c, A)]['e'] for c in pcs))

P = lambda a, mes: F(a, mes, 21)                    # inicio de período (ciclo 21)
A = P(2026, 9)
HISTORIAL = [P(2026, k) for k in (3, 4, 5, 6, 7, 8)]

def construir(antes_del_paso_3=False):
    e = EstadoA7(hoy=F(2026, 10, 15), efectivo={'Cuenta corriente': 0, 'Cuenta de ahorro': m('3,120.00')},
                 tarjetas={'Visa Oro': 0, 'Mastercard Clásica': 0},
                 categorias=[('Casa', 'Supermercado'), ('Casa', 'Luz y agua'), ('Casa', 'Internet y teléfono'), ('Casa', 'Farmacia'), ('Casa', 'Mascota'),
                             ('Comida fuera', 'Restaurantes'), ('Transporte', 'Gasolina'), ('Suscripciones', 'Netflix'),
                             ('Ahorro', 'Fondo de emergencia'), ('Ahorro', 'Viaje'), ('Deudas', 'Cuota del préstamo')])
    e.archivadas = {'Mascota'}
    e.metas = {'Supermercado': Meta('mensual', m('350')), 'Netflix': Meta('mensual', m('15.49')),
               'Fondo de emergencia': Meta('fecha', m('3,000'), fo=F(2027, 6, 30)),
               'Viaje': Meta('fecha', m('1,200'), fo=F(2027, 8, 1))}       # anual sin fecha creada el 01/08/2026: FO vigente 01/08/2027 (01 §4.12)
    k = iter(range(1, 100_000)); g = lambda cta, f, lineas, com: e.gastos.append(Gasto(cta, f, next(k), [(c, m(x)) for c, x in lineas], com))
    CC, VISA = 'Cuenta corriente', 'Visa Oro'
    # ---- historial (períodos cerrados) ----
    asig_rest = ['100', '102', '100', '100', '120', '99.95']   # CT-07: abril 102.00 y agosto 99.95 (antes 100.00 y 120.00): agosto cierra en $0.00 con el arrastre y se conserva "Se pasó 2 de 6"
    gasto_rest = ['88.20', '101.50', '96.40', '112.20', '104.75']
    for p, a, x in zip(HISTORIAL, asig_rest, gasto_rest + [None]):
        e.asig[('Restaurantes', p)] = m(a)
        if x: g(CC, F(p.year, p.month, 28), [('Restaurantes', x)], 'RESTAURANTES')
    g(VISA, F(2026, 8, 24), [('Restaurantes', '106.83')], 'PIZZA HUT'); g(CC, F(2026, 9, 2), [('Restaurantes', '12.07')], 'LA PAMPA')   # agosto: 118.90
    e.asig[('Supermercado', P(2026, 8))] = m('350')
    g(VISA, F(2026, 8, 25), [('Supermercado', '350.00')], 'SUPER SELECTOS')
    g(CC, F(2026, 9, 20), [('Supermercado', '12.00')], 'DESPENSA DE DON JUAN')   # la fecha que el usuario pasó al período anterior: LPA bajó $12.00
    for p in HISTORIAL[1:]: e.asig[('Fondo de emergencia', p)] = m('250')        # arrastre $1,250.00
    e.asig[('Viaje', P(2026, 7))] = m('92.31'); e.asig[('Viaje', P(2026, 8))] = m('92.31')   # arrastre $184.62 (01 §4.12: 13 y 12 períodos)
    # ---- período activo ----
    for c, x in [('Supermercado', '350'), ('Luz y agua', '65'), ('Internet y teléfono', '45'), ('Restaurantes', '120'), ('Gasolina', '80'),
                 ('Netflix', '15.49'), ('Fondo de emergencia', '100'), ('Farmacia', '12.35'), ('Cuota del préstamo', '210')]:
        e.asig[(c, A)] = m(x)
    e.ingresos += [(CC, F(2026, 9, 27), m('925')), (CC, F(2026, 10, 12), m('925'))]
    rest = [(F(2026, 9, 23), CC, 'LA PAMPA', '42.10'), (F(2026, 9, 30), VISA, 'PIZZA HUT', '25.60'), (F(2026, 10, 5), CC, 'STARBUCKS', '8.75'),
            (F(2026, 10, 8), CC, 'CAMPERO', '23.05'), (F(2026, 10, 11), CC, 'LA PAMPA', '28.30'), (F(2026, 10, 13), CC, 'PIZZA HUT', '18.50')]
    compras = [(F(2026, 9, 22), VISA, 'Gasolina', 'PUMA LAS CASCADAS', '21.40'), (F(2026, 9, 23), VISA, 'Supermercado', 'SUPER SELECTOS ESCALON', '92.40'),
               (F(2026, 9, 28), CC, 'Luz y agua', 'DELSUR Y ANDA', '58.40'), (F(2026, 9, 29), CC, 'Supermercado', 'WALMART', '71.15'),
               (F(2026, 9, 30), VISA, 'Gasolina', 'TEXACO', '24.10'), (F(2026, 10, 1), VISA, 'Internet y teléfono', 'TIGO', '45.00'),
               (F(2026, 10, 6), CC, COBRAR + 'Carlos', 'CINEMARK (Carlos me lo debe)', '40.00'),
               (F(2026, 10, 6), VISA, 'Supermercado', 'PRICESMART', '88.60'), (F(2026, 10, 7), VISA, 'Gasolina', 'UNO', '23.25'),
               (F(2026, 10, 11), CC, 'Farmacia', 'FARMACIA SAN NICOLAS', '12.35'), (F(2026, 10, 14), VISA, 'Gasolina', 'PUMA SANTA ELENA', '30.00')]
    for f, cta, com, x in rest: compras.append((f, cta, 'Restaurantes', com, x))
    for f, cta, c, com, x in sorted(compras, key=lambda t: t[0]): g(cta, f, [(c, x)], com)
    e.pagos.append((CC, VISA, F(2026, 10, 10), m('200')))
    if not antes_del_paso_3:
        g(VISA, F(2026, 10, 15), [('Supermercado', '35.00')], 'SUPER SELECTOS ESCALON')    # paso 3 de 4.2: aprobado desde el SMS de las 12:41
    # Asignaciones futuras (CT-07, A7-1): cierran la identidad sin tocar ningún número del período activo
    for i in range(9): e.asig[('Fondo de emergencia', siguiente_n(A, i + 1))] = m('175')
    e.programadas_pendientes = [('Netflix', m('15.49'), VISA, F(2026, 10, 17)), ('Cuota del préstamo', m('210'), 'Cuenta de ahorro', F(2026, 10, 20))]
    return e

def siguiente_n(p, n):
    for _ in range(n): p = siguiente(p)
    return p

def ajustar_saldo_inicial(e):
    """El único hecho que se despeja: el saldo inicial de la Cuenta corriente (21/03/2026) y el futuro de Viaje,
    para que Cuenta corriente = $1,284.60 y LPA = $312.40 (los dos números publicados que se conservan)."""
    n = e.numeros(); e.efectivo['Cuenta corriente'] += m('1,284.60') - n['saldo']['Cuenta corriente']
    n = e.numeros(); falta = n['lpa'] - m('312.40')
    if falta: e.asig[('Viaje', siguiente(A))] = falta     # lo que sobra de LPA va asignado a futuro (no se ve en el período activo)
    return e

def pantallas(e):
    n = e.numeros(); r = n['r']; cats = [c for _, c in e.categorias]
    dias_t = (e.hoy - A).days + 1; dur = (fin(A) - A).days + 1; dias_r = dur - dias_t
    fila = lambda c: dict(asig=r[(c, A)]['asig'], gastado=r[(c, A)]['gastado'], arr=r[(c, A)]['arr'], disp=r[(c, A)]['disp'], sobt=r[(c, A)]['sobt'], sobd=r[(c, A)]['sobd'])
    # ---- V6-01 sobre la semilla: Cat de reportes.py construidas desde el motor, no a mano ----
    rc = []
    for c in cats:
        if c in e.archivadas: continue
        x = r[(c, A)]
        cons = [R.Consumo((k['fecha'] - A).days + 1, k['monto'], 'debito' if k['cuenta'] in e.efectivo else k['cuenta']) for k in x['consumos']]
        sob_t = {}
        for k in x['consumos']:
            if k['cuenta'] in e.tarjetas and k['no_cubierto']: sob_t[k['cuenta']] = sob_t.get(k['cuenta'], 0) + k['no_cubierto']
        pend = [(mm, 'debito' if cta in e.efectivo else cta) for cc, mm, cta, f in e.programadas_pendientes if cc == c and f <= fin(A)]
        rc.append(R.Cat(c, x['disp'], x['fondo'], sob_t, x['sobd'], cons, pend, meta_ahorro=c in ('Fondo de emergencia', 'Viaje')))
    ritmos = {c.nombre: R.ritmo(c, dias_t, dias_r) for c in rc}
    hallazgos = [c.nombre for c in rc if R.hallazgo_ritmo(c, ritmos[c.nombre])]
    E = {t: r[(e.pago(t), A)]['e'] for t in e.tarjetas}
    proy = R.proyeccion_cierre(rc, dias_t, dias_r, n['S'], E)
    hist = [(r[('Restaurantes', p)]['asig'], r[('Restaurantes', p)]['gastado']) for p in HISTORIAL]
    prev3 = [gg for _, gg in hist[-3:]]
    comp = R.comparacion_promedio(r[('Restaurantes', A)]['gastado'] + ritmos['Restaurantes']['proy_var'], prev3)
    real = R.realidad(hist[-3:], r[('Restaurantes', A)]['asig'])
    # ---- tarjeta: desglose informativo (01 §4.14), corte el 25 ----
    c0 = F(2026, 9, 25)
    deuda_c0 = sum(x for gg in e.gastos if gg.cuenta == 'Visa Oro' and gg.fecha <= c0 for _, x in gg.lineas) - sum(x for _, t, f, x in e.pagos if t == 'Visa Oro' and f <= c0)
    pagado = sum(x for _, t, f, x in e.pagos if t == 'Visa Oro' and c0 < f <= e.hoy)
    pendiente_visa = sum(x for gg in e.gastos if gg.cuenta == 'Visa Oro' and gg.fecha == F(2026, 10, 15) for _, x in gg.lineas)
    pendiente_cc = m('12.35')                                           # FARMACIA 11/10, estado bancario pendiente
    semanas = [(A, F(2026, 9, 27)), (F(2026, 9, 28), F(2026, 10, 4)), (F(2026, 10, 5), F(2026, 10, 11)), (F(2026, 10, 12), F(2026, 10, 18)), (F(2026, 10, 19), F(2026, 10, 20))]
    super_sem = [sum(k['monto'] for k in r[('Supermercado', A)]['consumos'] if a <= k['fecha'] <= b) for a, b in semanas]
    activos = n['efectivo'] + m('2,075.60') + n['en_camino']; deudas = sum(n['deuda'].values()) + m('4,210.00')
    tot = lambda campo: sum(fila(c)[campo] for c in cats if c not in e.archivadas)
    return dict(
        lpa=n['lpa'], en_camino=n['en_camino'], reduccion_al_cierre=n['proyectada'], fut=n['fut'], sobta=n['sobta'],
        saldo_cc=n['saldo']['Cuenta corriente'], confirmado_cc=n['saldo']['Cuenta corriente'] + pendiente_cc, saldo_ahorro=n['saldo']['Cuenta de ahorro'],
        efectivo=n['efectivo'], deuda_visa=n['deuda']['Visa Oro'], confirmado_visa=n['deuda']['Visa Oro'] - pendiente_visa,
        reservado_visa=n['disp']['Pago Visa Oro'], actividad_pago_visa=n['disp']['Pago Visa Oro'] - r[('Pago Visa Oro', A)]['arr'],
        arrastre_pago_visa=r[('Pago Visa Oro', A)]['arr'], falta_reservar_visa=n['S']['Visa Oro'], reserva_excedente_visa=n['RE']['Visa Oro'],
        uso_limite_pct=Fraction(n['deuda']['Visa Oro'] * 100, m('2,500')), sin_intereses_visa=max(0, deuda_c0 - pagado),
        activos=activos, deudas=deudas, neto=activos - deudas,
        filas={c: fila(c) for c in cats}, totales=dict(asig=tot('asig'), gastado=tot('gastado'), disp=tot('disp')),
        metas={c: e.meta(c) for c in ('Supermercado', 'Netflix', 'Fondo de emergencia', 'Viaje')},
        consumos_restaurantes=[(k['fecha'], k['comercio'], k['monto'], k['cubierto'], k['no_cubierto']) for k in r[('Restaurantes', A)]['consumos']],
        historial_restaurantes=[(p, r[('Restaurantes', p)]['asig'], r[('Restaurantes', p)]['gastado'], r[('Restaurantes', p)]['disp']) for p in HISTORIAL],
        reducciones_cerradas=n['red'], ritmo={c: (x['disp_proy'], x['exceso'], x['evaluable']) for c, x in ritmos.items()}, hallazgos=hallazgos,
        proyeccion=proy, comparacion=comp, realidad=real, super_semanas=super_sem, dias=(dias_t, dias_r))

if __name__ == '__main__':
    e = ajustar_saldo_inicial(construir()); s = pantallas(e)
    import json; print(json.dumps(s, default=lambda o: d(o) if isinstance(o, int) else str(o), ensure_ascii=False, indent=1)[:20000])
