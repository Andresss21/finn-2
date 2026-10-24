"""V7-13: coherencia de A.7 (05, anexo A.7) con 01 y con 06 §3.5.12. Solo aritmética sobre los datos publicados;
cada comprobación cita la regla de 01. No ajusta nada: imprime lo que cuadra y lo que no."""
from decimal import Decimal as D
ok = []; mal = []
def chk(nombre, a, b, regla):
    (ok if a == b else mal).append(f"{'✓' if a == b else '✗'} {nombre}: {a} {'=' if a == b else '≠'} {b}  [{regla}]")
cats = {'Supermercado': ('350.00', '287.15', '0.00', '62.85'), 'Luz y agua': ('65.00', '58.40', '0.00', '6.60'),
        'Internet y teléfono': ('45.00', '45.00', '0.00', '0.00'), 'Restaurantes': ('120.00', '146.30', '0.00', '-26.30'),
        'Gasolina': ('80.00', '98.75', '0.00', '-18.75'), 'Netflix': ('15.49', '0.00', '0.00', '15.49'),
        'Fondo de emergencia': ('100.00', '0.00', '1250.00', '1350.00'), 'Viaje': ('0.00', '0.00', '184.62', '184.62')}
for c, (a, g, r, d) in cats.items(): chk(f'Disp({c}) = arrastre + asignado − gastado', D(r) + D(a) - D(g), D(d), '01 §4.6')
chk('totales.asignado', sum(D(v[0]) for v in cats.values()), D('775.49'), 'A.7 Presupuesto')
chk('totales.gastado', sum(D(v[1]) for v in cats.values()), D('635.60'), 'A.7 Presupuesto')
disp_listadas = sum(D(v[3]) for v in cats.values()); chk('totales.disponible', disp_listadas, D('1574.51'), 'A.7 Presupuesto')
ef = D('1284.60') + D('3120.00'); chk('efectivo (Cuentas)', ef, D('4404.60'), 'A.7 Cuentas')
chk('activos', ef + D('2075.60') + D('40.00'), D('6520.20'), '01 §4.14'); chk('deudas', D('642.18') + D('4210.00'), D('4852.18'), '01 §4.14')
chk('neto', D('6520.20') - D('4852.18'), D('1668.02'), '01 §4.14')
chk('S(Visa Oro) = deuda − reservado', D('642.18') - D('623.43'), D('18.75'), '01 §4.8')
chk('SobT(Gasolina) = te falta reservar', D('18.75'), D('18.75'), '01 §4.15')
chk('reducción proyectada al cierre = SobD(Restaurantes)', D('26.30'), D('26.30'), '01 §4.7')
# Identidad de saldo (inv. 1): Ef = LPA + Σ Disp(·, A) (todas, incluidas pago y archivadas) + futuros + SobTA
lpa, pago_visa, sobta = D('312.40'), D('623.43'), D('18.75')
farmacia, mascota = D('27.65'), D('8.00')   # aparecen en Registrar (catálogo) e Inicio (archivada con Disponible), no en Presupuesto
lado = lpa + disp_listadas + farmacia + mascota + pago_visa + sobta
chk('identidad de saldo con futuros = 0 (inv. 1)', lado, ef, '01 §6 inv. 1')
print(f"  diferencia: Ef − (LPA + ΣDisp + SobTA) = {ef - lado} (sin Farmacia y Mascota: {ef - (lado - farmacia - mascota)})")
# Pago Visa Oro: actividad = Σ partes cubiertas de compras con Visa en el período (arrastre 0, asignado 0, sin pagos) — 01 §4.4/4.5
max_cubierto = D('287.15') + D('58.40') + D('45.00') + D('80.00') + D('25.60')   # todo lo listado que podría ir con tarjeta, cubierto
chk('Pago Visa: actividad ≤ máximo cubierto con tarjeta en las categorías listadas', min(pago_visa, max_cubierto), pago_visa, '01 §4.5 paso 5')
print(f"  máximo posible {max_cubierto}; con el supuesto de 3.5.12 (un consumo de Supermercado con débito) es menor todavía")
# Para no generar intereses $512.40 con corte el 25: deuda al corte del 25/09 ≥ 512.40, pero arrastre de Pago Visa = 0 y S = 18.75
chk('deuda al corte 25/09 cabe en las compras con tarjeta del 21 al 25/09 de las categorías listadas (≤ Supermercado sem. 1, $92.40, + Gasolina $98.75 + Luz + Internet)',
    min(D('512.40'), D('92.40') + D('98.75') + D('58.40') + D('45.00')), D('512.40'), '01 §4.14')
# Historial de Restaurantes y arrastre (01 §4.6: Arr = máx(0, Disp anterior))
hist = [('mar', '100.00', '88.20', '11.80'), ('abr', '100.00', '101.50', '-1.50'), ('may', '100.00', '96.40', '3.60'), ('jun', '100.00', '112.20', '-12.20'), ('jul', '120.00', '104.75', '15.25'), ('ago', '120.00', '118.90', '1.10')]
arr = D('0')
for m, a, g, d in hist:
    calc = arr + D(a) - D(g); chk(f'Restaurantes {m}: Disp con arrastre {arr}', calc, D(d), '01 §4.6'); arr = max(D('0'), calc)
chk('Restaurantes: arrastre al período activo', arr, D('0.00'), '01 §4.6')
chk('Restaurantes: arrastre si se toma el historial publicado (ago $1.10)', max(D(0), D('1.10')), D('0.00'), '01 §4.6')
chk('promedio de los 3 últimos gastados (CA-63.3)', ((D('112.20') + D('104.75') + D('118.90')) / 3).quantize(D('0.01')), D('111.95'), '06 §3.5')
chk('sobrante (CA-62.2) = Σ Disp proyectados ≥ 0 de las 8 categorías listadas', D('5.42') + D('6.60') + D('0') + D('0') + D('1350.00') + D('184.62'), D('1546.64'), '06 §3.5.12')
print(f"  con Farmacia ($27.65, 1 consumo: no evaluable) el sobrante sería {D('1546.64') + farmacia}")
# SUPER SELECTOS 15/10 $35.00: está en recientes, en el gasto semanal (semana 4) y en "confirmado" de Visa (642.18 − 607.18), y también pendiente en la Bandeja
chk('SUPER SELECTOS 15/10 $35.00 no es a la vez transacción y movimiento pendiente', 'transacción y pendiente', 'una sola cosa', '01 inv. 15 / §7.1')
print('\n'.join(ok)); print('\n'.join(mal)); print(f"\n{len(ok)} cuadran, {len(mal)} no cuadran")
