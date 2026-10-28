import type { Escenario, Op, Paso } from '../tipos';
// Semilla de A.7 completa (CT-07, V7-16; 07 §28.1), portada de `estado_a7.py` (Fase 7) como operaciones. Hoy 15/10/2026;
// período activo 21/09 a 20/10/2026 (ciclo 21). Es el estado ANTES del paso 3 de 06 §4.2: SUPER SELECTOS ($35.00) no existe
// todavía (el paso 1 lo crea como movimiento pendiente desde el SMS). A.7 publicado es el estado después del paso 3:
// `paso3SuperSelectos` agrega esa compra. Ningún número se escribe aquí: salen del motor (DP-27).
//
// Hechos despejados por la Fase 7 (07 §28.1, "dos valores despejados") para conservar Cuenta corriente $1,284.60 y LPA $312.40:
// el saldo inicial de la Cuenta corriente (21/03/2026) y el asignado futuro de Viaje.
export const SALDO_INICIAL_CORRIENTE = 464.32;
export const VIAJE_FUTURO = 90.51;

const CC = 'Cuenta corriente';
const AHORRO = 'Cuenta de ahorro';
const VISA = 'Visa Oro';
const MASTERCARD = 'Mastercard Clásica';
const AHORRO_INICIAL = 3120;

/** Inicio de cada período desde marzo de 2026 (ciclo 21); `k` = 0 es el de marzo. */
const inicio = (k: number) => {
  const mes = 3 + k;
  const anio = 2026 + Math.floor((mes - 1) / 12);
  return `${anio}-${String(((mes - 1) % 12) + 1).padStart(2, '0')}-21`;
};
const ACTIVO = 6; // 21/09/2026

const asigna = (categoria: string, monto: number, hoy?: string): Op => ({
  op: 'OP-14',
  categoria,
  monto,
  ...(hoy && { hoy }),
});
/** Etiquetas de las transacciones confirmadas por el banco (OP-30): todas menos FARMACIA del 11/10 y SUPER SELECTOS del paso 3. */
const confirmadas: string[] = [];
let contador = 0;
const nueva = (pendiente = false) => {
  const etiqueta = `a7-${++contador}`;
  if (!pendiente) confirmadas.push(etiqueta);
  return etiqueta;
};
const gasto = (
  cuenta: string,
  categoria: string,
  monto: number,
  fecha: string,
  pendiente = false,
): Op => ({
  op: 'OP-20',
  cuenta,
  categoria,
  monto,
  fecha,
  etiqueta: nueva(pendiente),
});
const paso = (n: string, hoy: string, ops: Op[]): Paso => ({ n, hoy, ops, espera: {} });

/** Restaurantes de los seis períodos cerrados: [asignado, gastado el día 28]. CT-07: abril $102.00 y agosto $99.95. */
const RESTAURANTES = [
  [100, 88.2],
  [102, 101.5],
  [100, 96.4],
  [100, 112.2],
  [120, 104.75],
  [99.95, null],
] as const;

const historial = RESTAURANTES.flatMap(([asignado, gastado], k): Paso[] => {
  const ops: Op[] = [asigna('Restaurantes', asignado)];
  if (k >= 1) ops.push(asigna('Fondo de emergencia', 250)); // arrastre $1,250.00 (cinco períodos)
  if (k >= 4) ops.push(asigna('Viaje', 92.31)); // arrastre $184.62 (01 §4.12: 13 y 12 períodos)
  if (k === 5) ops.push(asigna('Supermercado', 350));
  const pasos = [paso(`h${k + 1}.1`, inicio(k), ops)];
  if (gastado !== null) {
    const dia28 = `${inicio(k).slice(0, 8)}28`;
    pasos.push(paso(`h${k + 1}.2`, dia28, [gasto(CC, 'Restaurantes', gastado, dia28)]));
  }
  return pasos;
});

/** Paso 3 de 06 §4.2: SUPER SELECTOS aprobado desde el SMS de las 12:41. Con él, el estado es el de A.7 publicado. */
export const paso3SuperSelectos: Paso = paso('3', '2026-10-15', [
  {
    op: 'OP-20',
    cuenta: VISA,
    categoria: 'Supermercado',
    monto: 35,
    fecha: '2026-10-15',
    etiqueta: 'super-selectos',
  },
]);

const dia = (n: string, fecha: string, ops: Op[]) => paso(n, fecha, ops);

export default {
  id: 'SEM-A7',
  titulo: 'A.7 completa, antes del paso 3 de 4.2',
  refs: ['REC-4.2', 'CT-07'],
  hoy: '2026-03-21',
  pasos: [
    dia('0', '2026-03-21', [
      { op: 'OP-01', cuenta: CC, saldo: SALDO_INICIAL_CORRIENTE, apertura: '2026-03-21' },
      { op: 'OP-01', cuenta: AHORRO, saldo: AHORRO_INICIAL, apertura: '2026-03-21' },
      {
        op: 'OP-01',
        cuenta: VISA,
        tipo: 'tarjeta',
        apertura: '2026-03-21',
        diaCorte: 25,
        diaPago: 15,
        limite: 2500,
      },
      { op: 'OP-01', cuenta: MASTERCARD, tipo: 'tarjeta', apertura: '2026-03-21', limite: 1000 },
      ...[
        'Supermercado',
        'Luz y agua',
        'Internet y teléfono',
        'Farmacia',
        'Mascota',
        'Restaurantes',
        'Gasolina',
        'Netflix',
        'Fondo de emergencia',
        'Viaje',
        'Cuota del préstamo',
      ].map((categoria): Op => ({ op: 'OP-07', categoria })),
      { op: 'OP-18', categoria: 'Supermercado', monto: 350 },
      { op: 'OP-18', categoria: 'Netflix', monto: 15.49 },
      {
        op: 'OP-18',
        categoria: 'Fondo de emergencia',
        tipo: 'para_fecha',
        monto: 3000,
        fecha: '2027-06-30',
      },
      // Anual sin fecha creada el 01/08/2026: la FO vigente es 01/08/2027 (01 §4.12).
      { op: 'OP-18', categoria: 'Viaje', tipo: 'para_fecha', monto: 1200, fecha: '2027-08-01' },
      { op: 'OP-09', categoria: 'Mascota', destino: 'LPA' },
    ]),
    ...historial,
    // Agosto: PIZZA HUT con Visa y LA PAMPA (lleva el gastado a $118.90), y SUPER SELECTOS de agosto.
    dia('a1', '2026-08-24', [gasto(VISA, 'Restaurantes', 106.83, '2026-08-24')]),
    dia('a2', '2026-08-25', [gasto(VISA, 'Supermercado', 350, '2026-08-25')]),
    dia('a3', '2026-09-02', [gasto(CC, 'Restaurantes', 12.07, '2026-09-02')]),
    // La fecha que el usuario pasó al período anterior: la reducción de LPA de agosto es $12.00.
    dia('a4', '2026-09-20', [gasto(CC, 'Supermercado', 12, '2026-09-20')]),
    dia('p0', inicio(ACTIVO), [
      ...(
        [
          ['Supermercado', 350],
          ['Luz y agua', 65],
          ['Internet y teléfono', 45],
          ['Restaurantes', 120],
          ['Gasolina', 80],
          ['Netflix', 15.49],
          ['Fondo de emergencia', 100],
          ['Farmacia', 12.35],
          ['Cuota del préstamo', 210],
        ] as const
      ).map(([c, x]) => asigna(c, x)),
    ]),
    dia('p1', '2026-09-22', [gasto(VISA, 'Gasolina', 21.4, '2026-09-22')]),
    dia('p2', '2026-09-23', [
      gasto(VISA, 'Supermercado', 92.4, '2026-09-23'),
      gasto(CC, 'Restaurantes', 42.1, '2026-09-23'),
    ]),
    dia('p3', '2026-09-27', [
      { op: 'OP-21', cuenta: CC, monto: 925, fecha: '2026-09-27', etiqueta: nueva() },
    ]),
    dia('p4', '2026-09-28', [gasto(CC, 'Luz y agua', 58.4, '2026-09-28')]),
    dia('p5', '2026-09-29', [gasto(CC, 'Supermercado', 71.15, '2026-09-29')]),
    dia('p6', '2026-09-30', [
      gasto(VISA, 'Gasolina', 24.1, '2026-09-30'),
      gasto(VISA, 'Restaurantes', 25.6, '2026-09-30'),
    ]),
    dia('p7', '2026-10-01', [gasto(VISA, 'Internet y teléfono', 45, '2026-10-01')]),
    dia('p8', '2026-10-05', [gasto(CC, 'Restaurantes', 8.75, '2026-10-05')]),
    dia('p9', '2026-10-06', [
      // CINEMARK: Carlos me lo debe. Línea por cobrar con débito (dinero en camino, 01 §4.10).
      {
        op: 'OP-20',
        cuenta: CC,
        monto: 40,
        lineas: [{ deudor: 'Carlos', monto: 40 }],
        fecha: '2026-10-06',
        etiqueta: nueva(),
      },
      gasto(VISA, 'Supermercado', 88.6, '2026-10-06'),
    ]),
    dia('p10', '2026-10-07', [gasto(VISA, 'Gasolina', 23.25, '2026-10-07')]),
    dia('p11', '2026-10-08', [gasto(CC, 'Restaurantes', 23.05, '2026-10-08')]),
    dia('p12', '2026-10-10', [
      {
        op: 'OP-23',
        tarjeta: VISA,
        monto: 200,
        origen: CC,
        fecha: '2026-10-10',
        etiqueta: nueva(),
      },
    ]),
    dia('p13', '2026-10-11', [
      gasto(CC, 'Farmacia', 12.35, '2026-10-11', true),
      gasto(CC, 'Restaurantes', 28.3, '2026-10-11'),
    ]),
    dia('p14', '2026-10-12', [
      { op: 'OP-21', cuenta: CC, monto: 925, fecha: '2026-10-12', etiqueta: nueva() },
    ]),
    dia('p15', '2026-10-13', [gasto(CC, 'Restaurantes', 18.5, '2026-10-13')]),
    dia('p16', '2026-10-14', [gasto(VISA, 'Gasolina', 30, '2026-10-14')]),
    dia('p17', '2026-10-15', [
      // Todo lo anterior está confirmado por el banco, salvo FARMACIA (11/10): "Cuenta corriente confirmado $1,296.95".
      ...['saldo-inicial:Cuenta corriente', 'saldo-inicial:Cuenta de ahorro', ...confirmadas].map(
        (etiqueta): Op => ({ op: 'OP-30', etiqueta, estado: 'confirmada' }),
      ),
      // Asignaciones futuras (CT-07, A7-1): cierran la identidad sin tocar ningún número del período activo.
      ...Array.from({ length: 9 }, (_, k) =>
        asigna('Fondo de emergencia', 175, inicio(ACTIVO + 1 + k)),
      ),
      asigna('Viaje', VIAJE_FUTURO, inicio(ACTIVO + 1)),
      // Programadas pendientes de la semana: Netflix (17/10, Visa) y la cuota del préstamo (20/10, desde Ahorro).
      {
        op: 'OP-42',
        etiqueta: 'Netflix',
        cuenta: VISA,
        comercio: 'NETFLIX',
        monto: 15.49,
        categoria: 'Netflix',
        primeraFecha: '2026-10-17',
      },
      {
        op: 'OP-42',
        etiqueta: 'Cuota',
        cuenta: AHORRO,
        comercio: 'CUOTA DEL PRESTAMO',
        monto: 210,
        categoria: 'Cuota del préstamo',
        primeraFecha: '2026-10-20',
      },
    ]),
  ],
} satisfies Escenario;
