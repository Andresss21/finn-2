import type { Escenario } from '../tipos';
// 01 §8, ESC-13 Saldo a favor por pago y reserva excedente [Q4, H5]. Hoy: 10 feb (P1); el paso 3 pasa a 21 feb (P2). Sin enmiendas.
// La 4.ª cifra de la columna Tarjeta (a favor) va en `extra` como `aFavor:T`. El paso 5 es OP-14 con δ = −30 sobre Pago T.
export default {
  id: 'ESC-13',
  titulo: 'Saldo a favor por pago y reserva excedente',
  refs: ['Q4', 'H5'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
      ],
      espera: {
        ef: 500,
        lpa: 400,
        disp: { 'Pago T': 100 },
        sobta: 0,
        tarjetas: { T: [100, 0, 0] },
        extra: { 'aFavor:T': 0 },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-23', tarjeta: 'T', monto: 130 }],
      espera: {
        ef: 370,
        lpa: 400,
        disp: { 'Pago T': -30 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        avisos: ['AV-10', 'AV-04'],
        extra: { 'aFavor:T': 30 },
      },
    },
    {
      n: '3',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 370,
        lpa: 370,
        disp: {},
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        extra: { 'aFavor:T': 30 },
      },
    },
    {
      n: '4',
      ops: [
        { op: 'OP-14', categoria: 'Super', monto: 30, periodo: 'P2' },
        { op: 'OP-20', cuenta: 'T', monto: 30, categoria: 'Super' },
      ],
      espera: {
        ef: 370,
        lpa: 340,
        disp: { 'Pago T': 30 },
        sobta: 0,
        tarjetas: { T: [0, 0, 30] },
        avisos: ['AV-08'],
        extra: { 'aFavor:T': 0 },
      },
    },
    {
      n: '5',
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: -30, periodo: 'P2' }],
      espera: {
        ef: 370,
        lpa: 370,
        disp: {},
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        extra: { 'aFavor:T': 0 },
      },
    },
  ],
} satisfies Escenario;
