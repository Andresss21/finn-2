import type { Escenario } from '../tipos';
// 01 §8, ESC-33 Eliminación en un período cerrado que elimina un sobregiro [P4, inv. 26]. Sin enmiendas.
// Continúa el paso 1 de ESC-31; el estado vuelve al paso 0 (determinismo).
export default {
  id: 'ESC-33',
  titulo: 'Eliminación en un período cerrado que elimina un sobregiro',
  refs: ['P4', 'inv. 26'],
  continua: { escenario: 'ESC-31', hastaPaso: '1' },
  pasos: [
    {
      n: '2',
      ops: [{ op: 'OP-29', etiqueta: 'olvidado' }],
      espera: {
        ef: 670,
        lpa: 590,
        disp: { Salidas: 80 },
        sobta: 0,
        avisos: ['AV-01'],
        extra: { reduccionesDebito: 0 },
      },
    },
  ],
} satisfies Escenario;
