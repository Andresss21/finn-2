import type { Escenario } from '../tipos';
// 01 §8, ESC-19 Split entre una categoría cubierta y otra no [P10, N3]. Hoy: 10 feb (P1). Sin enmiendas.
export default {
  id: 'ESC-19',
  titulo: 'Split entre una categoría cubierta y otra no',
  refs: ['P10', 'N3'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Mascota' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Mascota', monto: 20, periodo: 'P1' },
      ],
      espera: {
        ef: 500,
        lpa: 380,
        disp: { Super: 100, Mascota: 20 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '2',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 150,
          lineas: [
            { categoria: 'Super', monto: 110 },
            { categoria: 'Mascota', monto: 40 },
          ],
        },
      ],
      espera: {
        ef: 500,
        lpa: 380,
        disp: { Super: -10, Mascota: -20, 'Pago T': 120 },
        sobta: 30,
        tarjetas: { T: [150, 30, 0] },
      },
    },
  ],
} satisfies Escenario;
