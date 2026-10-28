import type { Escenario } from '../tipos';
// 01 §8, ESC-28 Devolución con tarjeta en un período posterior y saldo a favor [Q2b, N2, Q4, AV-06, AV-08]. Sin enmiendas.
// Dos partes independientes: la parte B corre en una rama desde el estado anterior a A1 (07 §12.3, regla 5), con sus filas B2 a B5 encadenadas.
// Parte A: hoy 10 feb; compra del 5 feb; cierre de P1 el 1 mar (A2); devolución de 70 (D-3) el 1 mar (A3).
// Parte B: hoy 16 feb; compra del 5 feb, pago del 15 feb; devolución el 1 mar; cierre de P2 el 21 mar; compra del 25 mar (DP-16: hoy 26 mar).
// La 4.ª cifra de la columna Tarjeta (a favor) va en `extra` como `aFavor:T`. B5 es OP-14 con δ = −100 sobre Pago T (P3), como ESC-13.
export default {
  id: 'ESC-28',
  titulo: 'Devolución con tarjeta en un período posterior y saldo a favor',
  refs: ['Q2b', 'N2', 'Q4', 'AV-06', 'AV-08'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Ropa' },
  ],
  pasos: [
    {
      n: 'A1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Ropa', monto: 60, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 100,
          categoria: 'Ropa',
          fecha: '2027-02-05',
          etiqueta: 'compra',
        },
      ],
      espera: {
        ef: 500,
        lpa: 440,
        disp: { Ropa: -40, 'Pago T': 60 },
        sobta: 40,
        tarjetas: { T: [100, 40, 0] },
      },
    },
    {
      n: 'A2',
      hoy: '2027-03-01',
      ops: [],
      espera: {
        ef: 500,
        lpa: 440,
        disp: { 'Pago T': 60 },
        sobta: 0,
        tarjetas: { T: [100, 40, 0] },
      },
    },
    {
      n: 'A3',
      ops: [{ op: 'OP-33', compra: 'compra', monto: 70 }],
      espera: {
        ef: 500,
        lpa: 440,
        disp: { Ropa: 30, 'Pago T': 30 },
        sobta: 0,
        tarjetas: { T: [30, 0, 0] },
      },
    },
    {
      n: 'B1',
      alternativaDe: 'A1',
      hoy: '2027-02-16',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 100,
          categoria: 'Ropa',
          fecha: '2027-02-05',
          etiqueta: 'compra',
        },
        { op: 'OP-23', tarjeta: 'T', monto: 100, fecha: '2027-02-15' },
      ],
      espera: {
        ef: 400,
        lpa: 400,
        disp: {},
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        extra: { 'aFavor:T': 0 },
      },
    },
    {
      n: 'B2',
      rama: 'B1',
      hoy: '2027-03-01',
      ops: [{ op: 'OP-33', compra: 'compra', monto: 100 }],
      espera: {
        ef: 400,
        lpa: 400,
        disp: { Ropa: 100, 'Pago T': -100 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        avisos: ['AV-06'],
        extra: { 'aFavor:T': 100 },
      },
    },
    {
      n: 'B3',
      rama: 'B1',
      hoy: '2027-03-21',
      ops: [],
      espera: {
        ef: 400,
        lpa: 300,
        disp: { Ropa: 100 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        extra: { 'aFavor:T': 100 },
      },
    },
    {
      n: 'B4',
      rama: 'B1',
      hoy: '2027-03-26',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 100,
          categoria: 'Ropa',
          fecha: '2027-03-25',
        },
      ],
      espera: {
        ef: 400,
        lpa: 300,
        disp: { Ropa: 0, 'Pago T': 100 },
        sobta: 0,
        tarjetas: { T: [0, 0, 100] },
        avisos: ['AV-08'],
        extra: { 'aFavor:T': 0 },
      },
    },
    {
      n: 'B5',
      rama: 'B1',
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: -100, periodo: 'P3' }],
      espera: {
        ef: 400,
        lpa: 400,
        disp: {},
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
        extra: { 'aFavor:T': 0 },
      },
    },
  ],
} satisfies Escenario;
