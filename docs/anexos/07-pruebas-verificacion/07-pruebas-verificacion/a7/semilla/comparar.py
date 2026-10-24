"""V7-16: compara cada número de las pantallas calculado desde la semilla con el publicado en A.7, 3.5.12 y los CA.
'cita CA' marca los que P7-19 pide conservar. Sale con 1 si cambia alguno citado."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fractions import Fraction
from motor_min import m, d
from estado_a7 import construir, ajustar_saldo_inicial, pantallas
s = pantallas(ajustar_saldo_inicial(construir())); f = s['filas']
pct = lambda x: f'{float(x):.2f} %'
filas = []  # (dónde, qué, publicado, calculado, cita_ca)
def X(donde, que, publicado, calc, cita=False): filas.append((donde, que, publicado, calc if isinstance(calc, str) else d(calc), cita))
X('A.7 Inicio', 'LPA', '$312.40', s['lpa'], True)
X('A.7 Inicio', 'En camino', '$40.00', s['en_camino'])
X('A.7 Inicio', 'Reducción proyectada al cierre', '$26.30', s['reduccion_al_cierre'])
X('A.7 Inicio', 'Mascota (archivada) con Disponible', '$8.00', f['Mascota']['disp'])
X('A.7 Inicio', 'Patrimonio: activos', '$6,520.20', s['activos']); X('A.7 Inicio', 'Patrimonio: deudas', '$4,852.18', s['deudas']); X('A.7 Inicio', 'Patrimonio: neto', '$1,668.02', s['neto'])
pub = {'Supermercado': ('$350.00', '$287.15', '$0.00', '$62.85'), 'Luz y agua': ('$65.00', '$58.40', '$0.00', '$6.60'), 'Internet y teléfono': ('$45.00', '$45.00', '$0.00', '$0.00'),
       'Restaurantes': ('$120.00', '$146.30', '$0.00', '−$26.30'), 'Gasolina': ('$80.00', '$98.75', '$0.00', '−$18.75'), 'Netflix': ('$15.49', '$0.00', '$0.00', '$15.49'),
       'Fondo de emergencia': ('$100.00', '$0.00', '$1,250.00', '$1,350.00'), 'Viaje': ('$0.00', '$0.00', '$184.62', '$184.62'),
       'Farmacia': ('—', '—', '—', '$27.65 (Registrar)'), 'Cuota del préstamo': ('—', '—', '—', '— (no estaba)')}
for c, (a, g, r, di) in pub.items():
    for k, p in zip(('asig', 'gastado', 'arr', 'disp'), (a, g, r, di)): X('A.7 Presupuesto', f'{c}: {k}', p, f[c][k], c == 'Restaurantes' and k == 'disp')
X('A.7 Presupuesto', 'totales: asignado', '$775.49', s['totales']['asig']); X('A.7 Presupuesto', 'totales: gastado', '$635.60', s['totales']['gastado']); X('A.7 Presupuesto', 'totales: disponible', '$1,574.51', s['totales']['disp'])
X('A.7 Presupuesto', 'Pago Visa Oro: actividad', '$623.43', s['actividad_pago_visa']); X('A.7 Presupuesto', 'Pago Visa Oro: arrastre', '(no se mostraba; 0)', s['arrastre_pago_visa'])
X('A.7 Presupuesto', 'Pago Visa Oro: disponible (reservado)', '$623.43', s['reservado_visa']); X('A.7 Presupuesto', 'Visa Oro: te falta reservar', '$18.75', s['falta_reservar_visa'], True)
X('A.7 Presupuesto', 'Visa Oro: reserva excedente', '$0.00', s['reserva_excedente_visa'])
mt = s['metas']; X('A.7 Presupuesto', 'Fondo: pide / falta', '$175.00 / $75.00', f"{d(mt['Fondo de emergencia']['pedido'])} / {d(mt['Fondo de emergencia']['falta'])}")
X('A.7 Presupuesto', 'Viaje: falta', '$92.31', mt['Viaje']['falta']); X('A.7 Presupuesto', 'Supermercado: meta', 'cubierta', mt['Supermercado']['estado']); X('A.7 Presupuesto', 'Netflix: meta', 'cubierta', mt['Netflix']['estado'])
cons = ' · '.join(f"{fe.strftime('%d/%m')} {d(x)} ({d(cu)}/{d(nc)})" for fe, _, x, cu, nc in s['consumos_restaurantes'])
X('A.7 Detalle', 'Restaurantes: consumos (cubierto/no cubierto)', '23/09 $42.10 ($42.10/$0.00) · 30/09 $25.60 ($25.60/$0.00) · 05/10 $8.75 ($8.75/$0.00) · 08/10 $23.05 ($23.05/$0.00) · 11/10 $28.30 ($20.50/$7.80) · 13/10 $18.50 ($0.00/$18.50)', cons)
MES = {3: 'mar', 4: 'abr', 5: 'may', 6: 'jun', 7: 'jul', 8: 'ago'}
hist = ' · '.join(f"{MES[p.month]} {d(a)}/{d(g)}/{d(di)}" for p, a, g, di in s['historial_restaurantes'])
X('A.7 Detalle', 'Restaurantes: historial asig/gastado/disp', 'mar $100.00/$88.20/$11.80 · abr $100.00/$101.50/−$1.50 · may $100.00/$96.40/$3.60 · jun $100.00/$112.20/−$12.20 · jul $120.00/$104.75/$15.25 · ago $120.00/$118.90/$1.10', hist)
exc = sum(1 for _, a, g, _ in s['historial_restaurantes'] if g > a)
X('A.7 Detalle', 'Restaurantes: "Se pasó N de 6" (CA-14.9)', '2', str(exc))
X('A.7 Cuentas', 'Cuenta corriente: saldo', '$1,284.60', s['saldo_cc']); X('A.7 Cuentas', 'Cuenta corriente: confirmado', '$1,296.95', s['confirmado_cc'])
X('A.7 Cuentas', 'Cuenta de ahorro', '$3,120.00', s['saldo_ahorro']); X('A.7 Cuentas', 'Efectivo', '$4,404.60', s['efectivo'])
X('A.7 Cuentas', 'Visa Oro: deuda', '$642.18', s['deuda_visa']); X('A.7 Cuentas', 'Visa Oro: confirmado', '$607.18', s['confirmado_visa'])
X('A.7 Cuentas', 'Visa Oro: uso del límite', '25.69 %', pct(s['uso_limite_pct'])); X('A.7 Cuentas', 'Visa Oro: para no generar intereses', '$512.40', s['sin_intereses_visa'])
X('A.7 Gasto semanal', 'Supermercado por semana', '$92.40 · $71.15 · $88.60 · $35.00 · $0.00', ' · '.join(d(x) for x in s['super_semanas']))
rt = s['ritmo']
for c, pubv in [('Supermercado', '$5.42'), ('Restaurantes', '−$55.56'), ('Gasolina', '−$38.50'), ('Netflix', '$0.00'), ('Luz y agua', '$6.60'), ('Internet y teléfono', '$0.00')]:
    X('06 §3.5.12', f'{c}: Disp. proyectado', pubv, rt[c][0], c in ('Restaurantes', 'Gasolina'))
X('06 CA-62.1', 'hallazgos de ritmo', 'Restaurantes, Gasolina', ', '.join(s['hallazgos']), True)
pr = s['proyeccion']
X('06 CA-62.2', 'categorías sobregiradas al cierre', '2', str(len(pr['sobregiradas'])), True)
X('06 CA-62.2', 'LPA bajaría', '$50.44', pr['reduccion'], True); X('06 CA-62.2', 'te faltaría reservar (Visa Oro)', '$43.62', pr['falta']['Visa Oro'], True)
X('06 CA-62.2', 'te sobrarían', '$1,546.64', pr['sobrante'], True)
c = s['comparacion']; X('06 CA-63.3', 'Restaurantes: camino a / promedio / variación', '$175.56 / $111.95 / +56.82 %', f"{d(c[0] + c[1])} / {d(c[1])} / +{c[2] / 100:.2f} %" if c else 'sin comparación', True)
X('06 §3.5.12 (V6-01)', 'Presupuesto contra la realidad: Restaurantes', 'sin sugerencia', 'sin sugerencia' if s['realidad'] is None else str(s['realidad']))
X('LPA detalle', 'reducciones de períodos cerrados', '(no se mostraba)', ', '.join(f"{MES[p.month]} {d(v)}" for p, v in s['reducciones_cerradas'].items() if v))
X('LPA detalle', 'asignado en futuros', '(no se mostraba)', s['fut'])
igual = lambda p, c: p.replace(' ', '') == c.replace(' ', '')
mal = 0
for donde, que, p, c_, cita in filas:
    est = 'igual' if igual(p, c_) else ('CAMBIA (cita CA)' if cita else 'cambia')
    if est.startswith('CAMBIA'): mal += 1
    print(f'{est:17} | {donde:18} | {que:48} | {p:40} → {c_}')
print(f'\n{sum(1 for x in filas if igual(x[2], x[3]))} iguales, {sum(1 for x in filas if not igual(x[2], x[3]))} cambian, {mal} citados por CA cambian')
# Semilla de 4.2: antes del paso 3 (SUPER SELECTOS solo como movimiento pendiente, P7-19 punto 6)
b = pantallas(ajustar_saldo_inicial(construir(antes_del_paso_3=True)))
print(f"\nSemilla de 4.2 (antes del paso 3): LPA {d(b['lpa'])} · Supermercado gastado {d(b['filas']['Supermercado']['gastado'])}, disponible {d(b['filas']['Supermercado']['disp'])} · Visa Oro deuda {d(b['deuda_visa'])}, reservado {d(b['reservado_visa'])}, te falta reservar {d(b['falta_reservar_visa'])} · efectivo {d(b['efectivo'])} · identidad comprobada")
sys.exit(1 if mal else 0)
