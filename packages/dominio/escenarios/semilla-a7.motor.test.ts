// PRU-DOM-MOTOR-903 (07 §12.4 y §28; DP-27, V7-16, V6-01): `comparar.py` de la Fase 7 contra el motor real. La semilla
// `estado-a7.ts` (portada de `estado_a7.py`) pasa por `aplicar` y `calcular`; cada una de las 86 filas se lee de la
// instantánea y de los selectores, y se compara con lo que dice 07 §28: 68 salen iguales a lo publicado en A.7, 3.5.12 y los
// CA, y 18 con el valor nuevo de 07 §28.2. Ningún valor se ajusta: los esperados son los de §28, no los del motor.
import { expect, it } from 'vitest';
import { calcular } from '../src/index';
import type { Instantanea } from '../src/index';
import { Centavos } from '../src/valores/centavos';
import { cuentas } from '../src/selectores/cuentas';
import { detalleCategoria } from '../src/selectores/detalle-categoria';
import { detalleLpa } from '../src/selectores/detalle-lpa';
import { gastoSemanal } from '../src/selectores/reportes/gasto-semanal';
import { realidad } from '../src/selectores/reportes/realidad';
import { ritmo } from '../src/selectores/reportes/ritmo';
import { presupuesto } from '../src/selectores/presupuesto';
import { comparar } from './ejecutar';
import { ejecutorMotor, type Estado } from './motor';
import estadoA7, { paso3SuperSelectos } from './semillas/estado-a7';
import type { Escenario, Paso } from './tipos';

/** Patrimonio fuera de la semilla (05 A.7, Inicio): otros activos $2,075.60 y otras deudas $4,210.00, como en `estado_a7.py`. */
const OTROS_ACTIVOS = 207_560;
const OTRAS_DEUDAS = 421_000;

/** Siembra: los pasos de la semilla; cada uno debe cumplir la identidad de saldo (regla 3), sin ningún rechazo. */
async function sembrar(sem: Escenario, extra: Paso[] = []): Promise<Estado> {
  const s = await ejecutorMotor.iniciar(sem, sem.hoy ?? '2027-02-10');
  for (const p of [...sem.pasos, ...extra]) {
    const obs = await ejecutorMotor.paso(s, p);
    expect(obs.rechazo, `${sem.id} paso ${p.n}`).toBeUndefined();
    expect.soft(comparar({}, obs).fallos, `${sem.id} paso ${p.n}`).toEqual([]);
  }
  return s;
}

/** $1,234.56 y −$26.30, el formato de `comparar.py`. */
const d = (c: number) => {
  const [e, f] = [Math.floor(Math.abs(c) / 100), Math.abs(c) % 100];
  return `${c < 0 ? '−' : ''}$${String(e).replace(/\B(?=(\d{3})+$)/g, ',')}.${String(f).padStart(2, '0')}`;
};
/** Puntos básicos como porcentaje: 2569 → 25.69. */
const pct = (bp: number) => `${Math.floor(bp / 100)}.${String(bp % 100).padStart(2, '0')}`;
const dia = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}`;
const MES: Record<string, string> = {
  '03': 'mar',
  '04': 'abr',
  '05': 'may',
  '06': 'jun',
  '07': 'jul',
  '08': 'ago',
};

/** Una fila de `comparar.py`: lo publicado, el valor nuevo de 07 §28.2 (si cambia) y lo que da el motor. */
interface Fila {
  donde: string;
  que: string;
  publicado: string;
  nuevo?: string;
  calculado: string;
}

function filas(i: Instantanea): Fila[] {
  const out: Fila[] = [];
  const X = (donde: string, que: string, publicado: string, calculado: string, nuevo?: string) =>
    out.push({ donde, que, publicado, calculado, ...(nuevo !== undefined && { nuevo }) });
  const p = presupuesto(i);
  const todas = p.grupos.flatMap((g) => g.categorias);
  // Totales del Presupuesto de 05 A.7: Σ de las categorías normales. `p.totales.disponible` suma también las categorías de
  // pago de tarjeta (+$623.43 aquí): se informa en el PR como duda sobre 04 §6.2, no se ajusta.
  const totalDe = (k: 'asignado' | 'gastado' | 'disponible') =>
    p.grupos.reduce((a, g) => a + g.totales[k], 0);
  const fila = (nombre: string) => {
    const f = todas.find((x) => x.categoria.nombre === nombre);
    if (!f) throw new Error(`la semilla no tiene la categoría ${nombre} en el Presupuesto`);
    return f;
  };
  const idDe = (nombre: string) =>
    i.hechos.categorias.find((x) => x.nombre === nombre)?.id as never;
  const cts = cuentas(i);
  const visa = cts.tarjetas.find((t) => t.cuenta.nombre === 'Visa Oro');
  const pagoVisa = p.pagosTarjeta.find((t) => t.tarjeta.nombre === 'Visa Oro');
  if (!visa || !pagoVisa) throw new Error('la semilla no tiene Visa Oro');
  const celdaActiva = (nombre: string) =>
    i.presupuesto.celdas.find(
      (x) => x.categoriaId === idDe(nombre) && x.periodo.inicio === i.presupuesto.activo.inicio,
    );
  const efectivo = cts.efectivo.reduce((a, k) => a + k.saldo, 0);
  const cuenta = (n: string) => cts.efectivo.find((k) => k.cuenta.nombre === n);

  X('A.7 Inicio', 'LPA', '$312.40', d(i.lpa.total));
  X('A.7 Inicio', 'En camino', '$40.00', d(i.lpa.dineroEnCamino));
  X('A.7 Inicio', 'Reducción proyectada al cierre', '$26.30', d(i.reduccionProyectada));
  X(
    'A.7 Inicio',
    'Mascota (archivada) con Disponible',
    '$8.00',
    d(celdaActiva('Mascota')?.disponible ?? 0),
    '$0.00',
  );
  const pat = i.patrimonio;
  const activos = pat.efectivo + pat.saldosAFavor + pat.inversiones + pat.porCobrar + OTROS_ACTIVOS;
  const deudas = pat.deudasDeTarjeta + pat.prestamos + OTRAS_DEUDAS;
  X('A.7 Inicio', 'Patrimonio: activos', '$6,520.20', d(activos));
  X('A.7 Inicio', 'Patrimonio: deudas', '$4,852.18', d(deudas));
  X('A.7 Inicio', 'Patrimonio: neto', '$1,668.02', d(activos - deudas));

  const pub: Record<string, [string, string, string, string]> = {
    Supermercado: ['$350.00', '$287.15', '$0.00', '$62.85'],
    'Luz y agua': ['$65.00', '$58.40', '$0.00', '$6.60'],
    'Internet y teléfono': ['$45.00', '$45.00', '$0.00', '$0.00'],
    Restaurantes: ['$120.00', '$146.30', '$0.00', '−$26.30'],
    Gasolina: ['$80.00', '$98.75', '$0.00', '−$18.75'],
    Netflix: ['$15.49', '$0.00', '$0.00', '$15.49'],
    'Fondo de emergencia': ['$100.00', '$0.00', '$1,250.00', '$1,350.00'],
    Viaje: ['$0.00', '$0.00', '$184.62', '$184.62'],
    Farmacia: ['—', '—', '—', '$27.65 (Registrar)'],
    'Cuota del préstamo': ['—', '—', '—', '— (no estaba)'],
  };
  // Valores nuevos de 07 §28.2 #5 y #7: Farmacia y Cuota del préstamo entran a la identidad.
  const nuevoDe: Record<string, [string, string, string, string]> = {
    Farmacia: ['$12.35', '$12.35', '$0.00', '$0.00'],
    'Cuota del préstamo': ['$210.00', '$0.00', '$0.00', '$210.00'],
  };
  for (const [c, valores] of Object.entries(pub)) {
    const f = fila(c);
    const calc = [f.asignado, f.gastado, f.arrastre, f.disponible].map(d);
    (['asig', 'gastado', 'arr', 'disp'] as const).forEach((k, n) =>
      X('A.7 Presupuesto', `${c}: ${k}`, valores[n] as string, calc[n] as string, nuevoDe[c]?.[n]),
    );
  }
  X('A.7 Presupuesto', 'totales: asignado', '$775.49', d(totalDe('asignado')), '$997.84');
  X('A.7 Presupuesto', 'totales: gastado', '$635.60', d(totalDe('gastado')), '$647.95');
  X('A.7 Presupuesto', 'totales: disponible', '$1,574.51', d(totalDe('disponible')), '$1,784.51');
  X(
    'A.7 Presupuesto',
    'Pago Visa Oro: actividad',
    '$623.43',
    d(pagoVisa.asignado + pagoVisa.actividad),
    '$166.60',
  );
  X(
    'A.7 Presupuesto',
    'Pago Visa Oro: arrastre',
    '(no se mostraba; 0)',
    d(pagoVisa.arrastre),
    '$456.83',
  );
  X('A.7 Presupuesto', 'Pago Visa Oro: disponible (reservado)', '$623.43', d(pagoVisa.disponible));
  X('A.7 Presupuesto', 'Visa Oro: te falta reservar', '$18.75', d(pagoVisa.faltaReservar));
  X('A.7 Presupuesto', 'Visa Oro: reserva excedente', '$0.00', d(pagoVisa.reservaExcedente));
  const fondo = fila('Fondo de emergencia').meta;
  X(
    'A.7 Presupuesto',
    'Fondo: pide / falta',
    '$175.00 / $75.00',
    `${d(fondo?.pedido ?? 0)} / ${d(fondo?.falta ?? 0)}`,
  );
  X('A.7 Presupuesto', 'Viaje: falta', '$92.31', d(fila('Viaje').meta?.falta ?? 0));
  X(
    'A.7 Presupuesto',
    'Supermercado: meta',
    'cubierta',
    fila('Supermercado').meta?.estado ?? 'sin meta',
  );
  X('A.7 Presupuesto', 'Netflix: meta', 'cubierta', fila('Netflix').meta?.estado ?? 'sin meta');

  const det = detalleCategoria(i, idDe('Restaurantes'));
  const consumos = det.consumos
    .map((k) => `${dia(k.fecha)} ${d(k.montoNeto)} (${d(k.cubierto)}/${d(k.noCubierto)})`)
    .join(' · ');
  X(
    'A.7 Detalle',
    'Restaurantes: consumos (cubierto/no cubierto)',
    '23/09 $42.10 ($42.10/$0.00) · 30/09 $25.60 ($25.60/$0.00) · 05/10 $8.75 ($8.75/$0.00) · 08/10 $23.05 ($23.05/$0.00) · 11/10 $28.30 ($20.50/$7.80) · 13/10 $18.50 ($0.00/$18.50)',
    consumos,
  );
  const hist = det.historial
    .map(
      (h) =>
        `${MES[h.periodo.inicio.slice(5, 7)]} ${d(h.asignado)}/${d(h.gastado)}/${d(h.disponible)}`,
    )
    .join(' · ');
  X(
    'A.7 Detalle',
    'Restaurantes: historial asig/gastado/disp',
    'mar $100.00/$88.20/$11.80 · abr $100.00/$101.50/−$1.50 · may $100.00/$96.40/$3.60 · jun $100.00/$112.20/−$12.20 · jul $120.00/$104.75/$15.25 · ago $120.00/$118.90/$1.10',
    hist,
    'mar $100.00/$88.20/$11.80 · abr $102.00/$101.50/$12.30 · may $100.00/$96.40/$15.90 · jun $100.00/$112.20/$3.70 · jul $120.00/$104.75/$18.95 · ago $99.95/$118.90/$0.00',
  );
  X(
    'A.7 Detalle',
    'Restaurantes: "Se pasó N de 6" (CA-14.9)',
    '2',
    String(det.historialResumen.periodosExcedidos),
  );

  const cc = cuenta('Cuenta corriente');
  X('A.7 Cuentas', 'Cuenta corriente: saldo', '$1,284.60', d(cc?.saldo ?? 0));
  X('A.7 Cuentas', 'Cuenta corriente: confirmado', '$1,296.95', d(cc?.saldoConfirmado ?? 0));
  X('A.7 Cuentas', 'Cuenta de ahorro', '$3,120.00', d(cuenta('Cuenta de ahorro')?.saldo ?? 0));
  X('A.7 Cuentas', 'Efectivo', '$4,404.60', d(efectivo));
  X('A.7 Cuentas', 'Visa Oro: deuda', '$642.18', d(visa.deuda));
  X('A.7 Cuentas', 'Visa Oro: confirmado', '$607.18', d(Centavos.negar(visa.saldoConfirmado)));
  X('A.7 Cuentas', 'Visa Oro: uso del límite', '25.69 %', `${pct(visa.usoLimite)} %`);
  X(
    'A.7 Cuentas',
    'Visa Oro: para no generar intereses',
    '$512.40',
    d(visa.paraNoGenerarIntereses),
    '$370.63',
  );

  const semanas =
    gastoSemanal(i, { categoriaIds: [idDe('Supermercado')] }).categorias[0]?.semanas ?? [];
  X(
    'A.7 Gasto semanal',
    'Supermercado por semana',
    '$92.40 · $71.15 · $88.60 · $35.00 · $0.00',
    semanas.map((s) => d(s.gasto)).join(' · '),
  );

  const r = ritmo(i);
  const proyectado = (c: string) =>
    r.categorias.find((x) => x.categoria.nombre === c)?.disponibleProyectado ?? 0;
  for (const [c, pubv] of [
    ['Supermercado', '$5.42'],
    ['Restaurantes', '−$55.56'],
    ['Gasolina', '−$38.50'],
    ['Netflix', '$0.00'],
    ['Luz y agua', '$6.60'],
    ['Internet y teléfono', '$0.00'],
  ] as const)
    X('06 §3.5.12', `${c}: Disp. proyectado`, pubv, d(proyectado(c)));
  X(
    '06 CA-62.1',
    'hallazgos de ritmo',
    'Restaurantes, Gasolina',
    r.hallazgos.map((h) => h.categoria.nombre).join(', '),
  );
  X('06 CA-62.2', 'categorías sobregiradas al cierre', '2', String(r.proyeccion.sobregiradas));
  X('06 CA-62.2', 'LPA bajaría', '$50.44', d(r.proyeccion.reduccionLpa));
  X(
    '06 CA-62.2',
    'te faltaría reservar (Visa Oro)',
    '$43.62',
    d(r.proyeccion.faltaReservar.find((t) => t.tarjeta.nombre === 'Visa Oro')?.proyectado ?? 0),
  );
  X('06 CA-62.2', 'te sobrarían', '$1,546.64', d(r.proyeccion.sobrante));

  const re = realidad(i);
  const rr = re.categorias.find((x) => x.categoria.nombre === 'Restaurantes');
  X(
    '06 CA-63.3',
    'Restaurantes: camino a / promedio / variación',
    '$175.56 / $111.95 / +56.82 %',
    `${d(rr?.gastoComparado ?? 0)} / ${d(rr?.promedioGastado ?? 0)} / +${pct(rr?.variacion ?? 0)} %`,
  );
  const sugerencia = re.hallazgos.find(
    (h) => h.tipo === 'realidad' && h.categoria.nombre === 'Restaurantes',
  );
  X(
    '06 §3.5.12 (V6-01)',
    'Presupuesto contra la realidad: Restaurantes',
    'sin sugerencia',
    sugerencia ? 'con sugerencia' : 'sin sugerencia',
  );

  const lpa = detalleLpa(i);
  // Reducciones de LPA de los períodos cerrados: SobD por período (Σ = sobregirosDebito) más los pagos excedentes (0 aquí).
  const porPeriodo = new Map<string, number>();
  for (const x of i.presupuesto.celdas)
    if (x.periodo.fin < i.hoy)
      porPeriodo.set(x.periodo.inicio, (porPeriodo.get(x.periodo.inicio) ?? 0) + x.sobD);
  const reducciones = [...porPeriodo].filter(([, v]) => v !== 0);
  expect(reducciones.reduce((a, [, v]) => a + v, 0)).toBe(
    i.lpa.sobregirosDebito + i.lpa.pagosExcedentes,
  );
  X(
    'LPA detalle',
    'reducciones de períodos cerrados',
    '(no se mostraba)',
    reducciones.map(([inicio, v]) => `${MES[inicio.slice(5, 7)]} ${d(v)}`).join(', '),
    'ago $12.00',
  );
  X(
    'LPA detalle',
    'asignado en futuros',
    '(no se mostraba)',
    d(lpa.descomposicion.asignadoPeriodosFuturos),
    '$1,665.51',
  );
  return out;
}

it('PRU-DOM-MOTOR-903 [V6-01, REC-4.2, CA-62.1, CA-62.2, CA-63.3, CA-14.9] SEM-A7 (CT-07, DP-27, V7-16): 86 números de A.7 iguales a 07 §28, 68 sin cambio y 18 con su valor nuevo', async () => {
  const s = await sembrar(estadoA7, [paso3SuperSelectos]); // A.7 es el estado después del paso 3 de 4.2
  const i = calcular(s.hechos, s.hoy);
  const todas = filas(i);
  expect(todas.length).toBe(86);
  expect(todas.filter((f) => f.nuevo === undefined).length).toBe(68);
  expect(todas.filter((f) => f.nuevo !== undefined).length).toBe(18);
  const compara = (f: Fila) =>
    (f.nuevo ?? f.publicado).replaceAll(' ', '') === f.calculado.replaceAll(' ', '');
  const mal = todas
    .filter((f) => !compara(f))
    .map(
      (f) =>
        `${f.donde} | ${f.que}: esperado ${f.nuevo ?? f.publicado}, el motor da ${f.calculado}`,
    );
  expect(mal).toEqual([]);
});

it('PRU-DOM-MOTOR-903 [REC-4.2] SEM-A7: antes del paso 3 de 4.2, LPA $312.40, Supermercado $252.15 gastado y $97.85 de Disponible, Visa Oro deuda $607.18, reservado $588.43 y te falta reservar $18.75', async () => {
  const s = await sembrar(estadoA7);
  const i = calcular(s.hechos, s.hoy);
  const p = presupuesto(i);
  const super_ = p.grupos
    .flatMap((g) => g.categorias)
    .find((x) => x.categoria.nombre === 'Supermercado');
  const visa = p.pagosTarjeta.find((t) => t.tarjeta.nombre === 'Visa Oro');
  expect([
    d(i.lpa.total),
    d(super_?.gastado ?? 0),
    d(super_?.disponible ?? 0),
    d(visa?.disponible ?? 0),
    d(visa?.faltaReservar ?? 0),
    d(cuentas(i).efectivo.reduce((a, k) => a + k.saldo, 0)),
  ]).toEqual(['$312.40', '$252.15', '$97.85', '$588.43', '$18.75', '$4,404.60']);
  expect(d(cuentas(i).tarjetas.find((t) => t.cuenta.nombre === 'Visa Oro')?.deuda ?? 0)).toBe(
    '$607.18',
  );
});
