import type { Escenario } from '../tipos';
// 01 §8, ESC-06 Asignación posterior que cubre el sobregiro con tarjeta [H3]. Sin enmiendas.
// Continúa el paso 2 de ESC-05 (hoy 15 feb). El fondo pasa a 400 y cubre toda la compra, aunque la asignación fue posterior.
export default {
  id: 'ESC-06',
  titulo: 'Asignación posterior que cubre el sobregiro con tarjeta',
  refs: ['H3'],
  continua: { escenario: 'ESC-05', hastaPaso: '2' },
  pasos: [
    {
      n: '3',
      ops: [{ op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' }],
      espera: {
        ef: 1000,
        lpa: 600,
        disp: { 'Pago T': 400 },
        sobta: 0,
        tarjetas: { T: [400, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
