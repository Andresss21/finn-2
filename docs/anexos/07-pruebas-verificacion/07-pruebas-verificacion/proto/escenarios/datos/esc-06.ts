import type { Escenario } from '../tipos';
// ESC-06 Asignación posterior que cubre el sobregiro con tarjeta [H3]. Continúa el paso 2 de ESC-05 (hoy 15 feb).
export default {
  id: 'ESC-06', titulo: 'Asignación posterior que cubre el sobregiro con tarjeta', refs: ['H3'],
  continua: { escenario: 'ESC-05', hastaPaso: '2' },
  pasos: [
    { n: '3', ops: [{ op: 'asignar', categoria: 'Super', monto: 100, periodo: 'P1' }],
      espera: { ef: 1000, lpa: 600, disp: { Super: 0, 'Pago T': 400 }, sobta: 0, tarjetas: { T: [400, 0, 0] } } },
  ],
} satisfies Escenario;
