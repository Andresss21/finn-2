import type { Escenario } from '../tipos';
// 01 §8, ESC-04 Compra con tarjeta cubierta [P1, H3; fila 1 de la tabla de 2.1]. Hoy: 10 feb (P1). Sin enmiendas.
export default {
  id: 'ESC-04',
  titulo: 'Compra con tarjeta cubierta',
  refs: ['P1', 'H3'],
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
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
      ],
      espera: { ef: 1000, lpa: 700, disp: { Super: 300 }, sobta: 0, tarjetas: { T: [0, 0, 0] } },
    },
    {
      n: '2',
      ops: [{ op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' }],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Super: 200, 'Pago T': 100 },
        sobta: 0,
        tarjetas: { T: [100, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
