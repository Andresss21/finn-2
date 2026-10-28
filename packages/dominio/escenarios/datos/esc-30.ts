import type { Escenario } from '../tipos';
// 01 §8, ESC-30 Devolución sin compra original [P10, D-4, D-2]. Hoy: 10 feb (P1). Sin enmiendas.
// Paso 2: OP-33 b con T a Super (D-4). Paso 3: OP-33 b en efectivo a Gas (D-2); Gas existe desde el inicio sin asignación.
export default {
  id: 'ESC-30',
  titulo: 'Devolución sin compra original',
  refs: ['P10', 'D-4', 'D-2'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Gas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 200 },
        { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Super' },
      ],
      espera: {
        ef: 200,
        lpa: 150,
        disp: { Super: 0, 'Pago T': 50 },
        sobta: 0,
        tarjetas: { T: [50, 0, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-33', cuenta: 'T', categoria: 'Super', monto: 30 }],
      espera: {
        ef: 200,
        lpa: 150,
        disp: { Super: 30, 'Pago T': 20 },
        sobta: 0,
        tarjetas: { T: [20, 0, 0] },
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-33', cuenta: 'Ahorro', categoria: 'Gas', monto: 10 }],
      espera: {
        ef: 210,
        lpa: 150,
        disp: { Super: 30, 'Pago T': 20, Gas: 10 },
        sobta: 0,
        tarjetas: { T: [20, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
