import type { Escenario } from '../tipos';
// 01 §8, ESC-26 Devolución parcial con tarjeta en el mismo período, compra parcialmente cubierta [N2, D-1]. Hoy: 10 feb (P1). Sin enmiendas.
// Compra del 5 feb; la devolución del paso 2 es del 8 feb y la del paso 3 (sin fecha en la tabla) del hoy, 10 feb (DP-16).
export default {
  id: 'ESC-26',
  titulo: 'Devolución parcial con tarjeta en el mismo período, compra parcialmente cubierta',
  refs: ['N2', 'D-1'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Ropa' },
  ],
  pasos: [
    {
      n: '1',
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
      n: '2',
      ops: [{ op: 'OP-33', compra: 'compra', monto: 30, fecha: '2027-02-08' }],
      espera: {
        ef: 500,
        lpa: 440,
        disp: { Ropa: -10, 'Pago T': 60 },
        sobta: 10,
        tarjetas: { T: [70, 10, 0] },
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-33', compra: 'compra', monto: 20 }],
      espera: {
        ef: 500,
        lpa: 440,
        disp: { Ropa: 10, 'Pago T': 50 },
        sobta: 0,
        tarjetas: { T: [50, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
