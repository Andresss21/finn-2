import type { Escenario } from '../tipos';
// 01 §8, ESC-07 Cubrir deuda sin respaldo de un período cerrado [P1]. Sin enmiendas.
// Continúa el paso 3 de ESC-05 (hoy 21 feb, A = P2).
export default {
  id: 'ESC-07',
  titulo: 'Cubrir deuda sin respaldo de un período cerrado',
  refs: ['P1'],
  continua: { escenario: 'ESC-05', hastaPaso: '3' },
  pasos: [
    {
      n: '4',
      ops: [{ op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P2' }],
      espera: {
        ef: 1000,
        lpa: 600,
        disp: { Super: 100, 'Pago T': 300 },
        sobta: 0,
        tarjetas: { T: [400, 100, 0] },
      },
    },
    {
      n: '5',
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: 100, periodo: 'P2' }],
      espera: {
        ef: 1000,
        lpa: 500,
        disp: { Super: 100, 'Pago T': 400 },
        sobta: 0,
        tarjetas: { T: [400, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
