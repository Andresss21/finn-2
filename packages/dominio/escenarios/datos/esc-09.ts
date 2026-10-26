import type { Escenario } from '../tipos';
// 01 §8, ESC-09 Pago total [P8]. Sin enmiendas. Continúa ESC-08 (paso 2; hoy 19 feb).
export default {
  id: 'ESC-09',
  titulo: 'Pago total',
  refs: ['P8'],
  continua: { escenario: 'ESC-08', hastaPaso: '2' },
  pasos: [
    {
      n: '3',
      ops: [{ op: 'OP-23', tarjeta: 'T', monto: 150 }],
      espera: {
        ef: 700,
        lpa: 500,
        disp: { Super: 200 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
