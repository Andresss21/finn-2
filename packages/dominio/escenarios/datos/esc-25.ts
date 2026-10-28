import type { Escenario } from '../tipos';
// 01 §8, ESC-25 Devolución total con débito en un período posterior [H7]. Paso 1: hoy 10 feb (P1); paso 2: hoy 1 mar (A = P2). Sin enmiendas.
// La compra es del 5 feb. Paso 2: OP-33 vinculada (caso D-2); afecta P2 y Ropa en P1 sigue en 0.
export default {
  id: 'ESC-25',
  titulo: 'Devolución total con débito en un período posterior',
  refs: ['H7'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Ropa' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 300 },
        { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 100,
          categoria: 'Ropa',
          fecha: '2027-02-05',
          etiqueta: 'compra',
        },
      ],
      espera: { ef: 200, lpa: 200, disp: { Ropa: 0 }, sobta: 0 },
    },
    {
      n: '2',
      hoy: '2027-03-01',
      ops: [{ op: 'OP-33', compra: 'compra', monto: 100 }],
      espera: { ef: 300, lpa: 200, disp: { Ropa: 100 }, sobta: 0 },
    },
  ],
} satisfies Escenario;
