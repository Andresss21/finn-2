"""V6-01 a V6-04: verificación del prototipo de reportes (06-features §3.4)."""
import random, sys
from fractions import Fraction
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from reportes import *

fallos = []
def ok(cond, msg):
    if not cond:
        fallos.append(msg)

# ---------------------------------------------------------------- V6-01: A.7
DT, DR = 25, 5     # hoy 15/10, período 21/09–20/10 (30 días)
V = 'visa_oro'
cats = [
    Cat('Supermercado', 6285, 35000, consumos=[Consumo(1, 9240, V), Consumo(8, 7115, V), Consumo(15, 8860, 'debito'), Consumo(25, 3500, V)]),
    Cat('Luz y agua', 660, 6500, consumos=[Consumo(5, 5840, 'debito')]),
    Cat('Internet y teléfono', 0, 4500, consumos=[Consumo(3, 4500, 'debito')]),
    Cat('Restaurantes', -2630, 12000, sob_d=2630, consumos=[
        Consumo(3, 4210, 'debito'), Consumo(10, 2560, V), Consumo(15, 875, 'debito'),
        Consumo(18, 2305, 'debito'), Consumo(21, 2830, 'debito'), Consumo(23, 1850, 'debito')]),
    Cat('Gasolina', -1875, 8000, sob_t={V: 1875}, consumos=[Consumo(4, 2500, V), Consumo(11, 2500, V), Consumo(17, 2500, V), Consumo(24, 2375, V)]),
    Cat('Netflix', 1549, 1549, prog_pend=[(1549, V)]),
    Cat('Fondo de emergencia', 135000, 135000, meta_ahorro=True),
    Cat('Viaje', 18462, 18462, meta_ahorro=True),
]
res = {c.nombre: ritmo(c, DT, DR) for c in cats}
hall = [c.nombre for c in cats if hallazgo_ritmo(c, res[c.nombre])]
print('Ritmo A.7:')
for c in cats:
    r = res[c.nombre]
    print(f"  {c.nombre:22} evaluable={r['evaluable']!s:5} proyVar={moneda(r['proy_var']):>9} dispProy={moneda(r['disp_proy']):>11} exceso={moneda(r['exceso']):>9}")
ok(hall == ['Restaurantes', 'Gasolina'], f'hallazgos A.7 {hall}')
ok(res['Restaurantes']['exceso'] == 5556, 'exceso Restaurantes')
ok(res['Gasolina']['exceso'] == 3850, 'exceso Gasolina')
ok(res['Netflix']['disp_proy'] == 0, 'Netflix con programada pendiente queda en 0')
ok(not res['Luz y agua']['evaluable'], 'Luz y agua (1 consumo) no se proyecta')

p = proyeccion_cierre(cats, DT, DR, S={V: 1875}, E={})
print('Proyección del cierre A.7:', {k: (moneda(v) if isinstance(v, int) else v) for k, v in p.items() if k != 'falta'},
      'falta', {k: moneda(v) for k, v in p['falta'].items()})
ok(p['sobregiradas'] == ['Restaurantes', 'Gasolina'], 'sobregiradas')
ok(p['reduccion'] == 5044, f"reducción {p['reduccion']}")
ok(p['falta'][V] == 4362, f"falta {p['falta']}")
ok(p['sobrante'] == 154664, f"sobrante {p['sobrante']}")

c = comparacion_promedio(14630 + 2926, [11220, 10475, 11890])
print('Comparación Restaurantes:', c)
ok(c == (6361, 11195, 5682), 'comparación')
ok(realidad([(10000, 11220), (12000, 10475), (12000, 11890)], 12000) is None, 'realidad Restaurantes sin sugerencia')
ok(realidad([(15000, 18000), (15000, 17500), (15000, 18500)], 15000) == ('se_pasa', 18000, 18000), 'ejemplo del producto §16')
ok(realidad([(5000, 0), (5000, 0), (5000, 0)], 5000) is None, 'fondo sin gasto no sugiere bajar')
ok(realidad([(10000, 6000), (10000, 7000), (10000, 6500)], 10000) == ('sobra', 6500, 6500), 'sobra')
ok(hormiga([('cafe', 450, False, [('Cafés', 450)])] * 4 + [('cafe', 1150, False, [('Cafés', 1150)]), ('super', 3500, False, [('Super', 3500)])]) == {}, 'hormiga: 4 compras no alcanzan')
# [R1] ejemplo del producto: 12 compras en cafeterías distintas -> solo por categoría
cafeterias = [(f'cafeteria_{i}', 533 + (i % 3), False, [('Cafés y antojos', 533 + (i % 3))]) for i in range(12)]
h = hormiga(cafeterias)
print('Hormiga (12 cafeterías distintas):', h)
ok(h == {('categoria', 'Cafés y antojos'): [12, sum(t[1] for t in cafeterias)]}, 'hormiga por categoría')
# solapamiento: 6 compras en el mismo café (grupo de comercio) dentro de 9 de la categoría -> queda la categoría
mezcla = [('starbucks', 600, False, [('Cafés y antojos', 600)])] * 6 + [('otro', 500, False, [('Cafés y antojos', 500)])] * 3
ok(hormiga(mezcla) == {('categoria', 'Cafés y antojos'): [9, 5100]}, 'solapamiento: gana el de mayor impacto')
# sin solapamiento: comercio en una categoría y otra categoría distinta, ambos quedan
dos = [('tienda', 500, False, [('Mercado y tienda', 500)])] * 5 + [('x', 450, False, [('Cafés y antojos', 450)]), ('y', 450, False, [('Cafés y antojos', 450)]),
       ('z', 450, False, [('Cafés y antojos', 450)]), ('w', 450, False, [('Cafés y antojos', 450)]), ('v', 450, False, [('Cafés y antojos', 450)])]
ok(set(hormiga(dos)) == {('categoria', 'Mercado y tienda'), ('categoria', 'Cafés y antojos')}, 'dos categorías')
ok(suscripcion([[(17, 1549)], [(17, 1549)], [], [(18, 1549)]]) == dict(mensual=1549, anual=18588), 'suscripción 3 de 4')
ok(suscripcion([[(17, 1549)], [], [], [(18, 1549)]]) is None, 'suscripción 2 de 4 no')
ok(moneda(-2630) == '−$26.30' and moneda(15466400) == '$154,664.00', 'formato')

# ---------------------------------------------------------- V6-02: aleatorio
random.seed(20261017)
N = 20000
for i in range(N):
    dur = random.choice([11, 28, 29, 30, 31])
    dt = random.randint(1, dur); dr = dur - dt
    tarjetas = ['t1', 't2', 't3'][:random.randint(0, 3)]
    medios = ['debito'] + tarjetas
    n = random.randint(0, 12)
    consumos = [Consumo(random.randint(1, dt), random.randint(1, 50000), random.choice(medios), random.random() < .1) for _ in range(n)]
    fondo = random.randint(-5000, 80000)
    gast = sum(k.monto for k in consumos)
    disp = fondo - gast
    sob_t, sob_d = {}, 0
    if disp < 0:  # reparto D2 simplificado y consistente con 01 §4.5
        rest = fondo
        for k in sorted(consumos, key=lambda k: k.fecha):
            cub = max(0, min(k.monto, rest)); rest -= cub
            nc = k.monto - cub
            if nc and k.medio != 'debito':
                sob_t[k.medio] = sob_t.get(k.medio, 0) + nc
        sob_d = -disp - sum(sob_t.values())
    pend = [(random.randint(1, 20000), random.choice(medios)) for _ in range(random.randint(0, 2))]
    c = Cat('c', disp, fondo, sob_t, sob_d, consumos, pend)
    r = ritmo(c, dt, dr)
    r2 = ritmo(Cat('c', disp, fondo, sob_t, sob_d, random.sample(consumos, len(consumos)), pend), dt, dr)
    ok(r == r2, f'determinismo {i}')
    ok(r['exceso'] >= max(0, -disp), f'exceso >= sobregiro actual {i}')
    ok(sum(r['futuro'].values()) == r['proy_var'] + r['pend'], f'futuro suma {i}')
    ok(all(v >= 0 for v in r['futuro'].values()), f'futuro no negativo {i}')
    if dr:
        ra = ritmo(c, dt, dr - 1)
        ok(ra['exceso'] <= r['exceso'], f'monotonía en días restantes {i}')
    try:
        pc = proyeccion_cierre([c], dt, dr, S={t: sob_t.get(t, 0) for t in tarjetas}, E={})
        ok(pc['reduccion'] >= sob_d, f'reducción >= SobD actual {i}')
        ok(sum(pc['falta'].values()) - sum(sob_t.values()) + (pc['reduccion'] - sob_d) == r['exceso'] - (sob_d + sum(sob_t.values())), f'conservación del exceso {i}')
    except AssertionError as e:
        ok(False, f'aserción {i}: {e}')

for i in range(5000):
    hist = [(random.randint(0, 30000), random.randint(0, 30000)) for _ in range(3)]
    r = realidad(hist, random.randint(0, 30000))
    if r:
        ok(r[2] % 100 == 0, 'sugerido en dólares enteros')
        ok(r[0] != 'sobra' or all(g > 0 for _, g in hist), 'sobra exige gasto')
    hs = [(random.randint(1, 9000), random.randint(1, 6), random.choice('ABCDEFGH'), '') for _ in range(random.randint(0, 15))]
    o = ordenar_hallazgos(hs)
    ok(len(o) <= HALLAZGOS_MAX and len({h[2] for h in o}) == len(o), 'una por categoría, máximo 5')
    ok(all(o[j][0] >= o[j + 1][0] for j in range(len(o) - 1)), 'orden por impacto')
    tx = []
    for _ in range(random.randint(0, 40)):
        tot = random.randint(100, 2000); cats = random.sample('PQRS', random.randint(1, 2))
        if len(cats) == 2:
            a = random.randint(1, tot - 1); lin = [(cats[0], a), (cats[1], tot - a)]
        else:
            lin = [(cats[0], tot)]
        tx.append((random.choice('abc'), tot, random.random() < .1, lin))
    h1 = hormiga(tx)
    ok(h1 == hormiga(random.sample(tx, len(tx))), 'hormiga independiente del orden')
    # sin solapamientos entre los grupos que quedan
    peq = [i for i, t in enumerate(tx) if t[1] <= HORMIGA_MONTO_MAX and not t[2]]
    def miembros(k):
        return {i for i in peq if (k[0] == 'comercio' and tx[i][0] == k[1]) or (k[0] == 'categoria' and any(c == k[1] for c, _ in tx[i][3]))}
    ks = list(h1)
    ok(all(not (miembros(a) & miembros(b)) for x, a in enumerate(ks) for b in ks[x + 1:]), 'hormiga sin solapamientos')

ok(redondear(Fraction(5, 2)) == 3 and redondear(Fraction(-5, 2)) == -2 and redondear(Fraction(7, 3)) == 2, 'redondeo')

# --------------------------------------------- V6-03: flujo de efectivo (F6-2)
FILA = {  # tipo de transacción -> fila del reporte (efectos en cuentas de efectivo)
    'saldo_inicial': 'saldos_iniciales', 'ingreso': 'ingresos', 'cobro_excedente': 'ingresos',
    'cobro_restitucion': 'restituciones', 'devolucion': 'devoluciones',
    'desembolso_prestamo': 'otras_entradas', 'retiro_inversion': 'otras_entradas', 'avance_efectivo': 'otras_entradas',
    'gasto': 'gastos_debito', 'pago_tarjeta': 'pagos_tarjeta', 'cuota_prestamo': 'prestamos_inversiones',
    'abono_capital': 'prestamos_inversiones', 'aporte_inversion': 'prestamos_inversiones', 'transferencia': None,
}
for i in range(5000):
    saldo_ini = random.randint(0, 500000)
    efectos = []
    for _ in range(random.randint(0, 40)):
        t = random.choice(list(FILA))
        m = random.randint(1, 50000)
        if t in ('gasto', 'pago_tarjeta', 'cuota_prestamo', 'abono_capital', 'aporte_inversion'):
            efectos.append((t, -m))
        elif t == 'transferencia':
            efectos += [(t, -m), (t, m)]
        elif t == 'saldo_inicial':
            efectos.append((t, random.choice([m, -m])))
        else:
            efectos.append((t, m))
    filas = {}
    for t, m in efectos:
        if FILA[t]:
            filas[FILA[t]] = filas.get(FILA[t], 0) + m
    ok(saldo_ini + sum(filas.values()) == saldo_ini + sum(m for _, m in efectos), f'identidad del flujo {i}')

print(f"\nCasos aleatorios: {N} de ritmo y proyección, 5000 de realidad/hallazgos/hormiga, 5000 de flujo.")
print('RESULTADO:', 'PASA' if not fallos else f'FALLA ({len(fallos)})')
for f in fallos[:20]:
    print('  -', f)
sys.exit(1 if fallos else 0)
