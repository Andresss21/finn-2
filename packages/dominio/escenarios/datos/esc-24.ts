import type { Escenario } from '../tipos';
// 01 §8, ESC-24 Split y compartido en la misma compra [P10]. Hoy: 10 feb (P1). Sin enmiendas.
export default {
  id: 'ESC-24',
  titulo: 'Split y compartido en la misma compra',
  refs: ['P10'],
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
        { op: 'OP-14', categoria: 'Mascota', monto: 50, periodo: 'P1' },
      ],
      espera: {
        ef: 500,
        lpa: 350,
        disp: { Super: 100, Mascota: 50 },
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
          monto: 200,
          lineas: [
            { categoria: 'Super', monto: 90 },
            { categoria: 'Mascota', monto: 30 },
            { deudor: 'Ana', monto: 80 },
          ],
        },
      ],
      espera: {
        ef: 500,
        lpa: 350,
        disp: { Super: 10, Mascota: 20, 'Pago T': 120 },
        sobta: 0,
        tarjetas: { T: [200, 80, 0] },
      },
    },
  ],
} satisfies Escenario;
