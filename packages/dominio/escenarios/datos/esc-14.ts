import type { Escenario } from '../tipos';
// 01 §8, ESC-14 Cashback, avance de efectivo y transferencia entre tarjetas [Q3]. Hoy: 15 feb (P1). Sin enmiendas.
// Base (paso 0): ingreso 1,000; asignar 300 a Super; compra con T de 400 en Super. La columna "—" de U (pasos 0 a 2) no se
// compara; U existe con deuda 0. Reportes: cashback = ingreso (entrada_tarjeta), avance = otras entradas (§4.13);
// `reporte:ingreso` es el total acumulado de la clase (el ingreso de 1,000 más el cashback).
export default {
  id: 'ESC-14',
  titulo: 'Cashback, avance de efectivo y transferencia entre tarjetas',
  refs: ['Q3'],
  hoy: '2027-02-15',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super' },
      ],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [400, 100, 0] },
      },
    },
    {
      n: '1',
      ops: [{ op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 30 }],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [370, 70, 0] },
        extra: { 'reporte:ingreso': 1030 },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-27', modalidad: 'avance', tarjeta: 'T', monto: 200, cuenta: 'Ahorro' }],
      espera: {
        ef: 1200,
        lpa: 900,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [570, 270, 0] },
        extra: { 'reporte:otras_entradas': 200 },
      },
    },
    {
      n: '3',
      ops: [
        { op: 'OP-27', modalidad: 'transferencia_deuda', tarjeta: 'T', monto: 100, destino: 'U' },
      ],
      espera: {
        ef: 1200,
        lpa: 900,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [470, 170, 0], U: [100, 100, 0] },
        avisos: ['AV-24'],
      },
    },
    {
      n: '4',
      ops: [{ op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 400 }],
      espera: {
        ef: 1200,
        lpa: 900,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [70, 0, 230], U: [100, 100, 0] },
        avisos: ['AV-08'],
      },
    },
  ],
} satisfies Escenario;
