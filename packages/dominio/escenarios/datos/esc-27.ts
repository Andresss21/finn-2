import type { Escenario } from '../tipos';
// 01 §8, ESC-27 Devolución con tarjeta en el mismo período que cubre otra compra [Q2a, H3]. Hoy: 10 feb (P1). Sin enmiendas.
// A = T 100 (3 feb, cubierta); B = T 50 (4 feb, no cubierta); la devolución total de A es del 6 feb.
export default {
  id: 'ESC-27',
  titulo: 'Devolución con tarjeta en el mismo período que cubre otra compra',
  refs: ['Q2a', 'H3'],
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
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 100,
          categoria: 'Super',
          fecha: '2027-02-03',
          etiqueta: 'A',
        },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 50,
          categoria: 'Super',
          fecha: '2027-02-04',
          etiqueta: 'B',
        },
      ],
      espera: {
        ef: 500,
        lpa: 400,
        disp: { Super: -50, 'Pago T': 100 },
        sobta: 50,
        tarjetas: { T: [150, 50, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-33', compra: 'A', monto: 100, fecha: '2027-02-06' }],
      espera: {
        ef: 500,
        lpa: 400,
        disp: { Super: 50, 'Pago T': 50 },
        sobta: 0,
        tarjetas: { T: [50, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
