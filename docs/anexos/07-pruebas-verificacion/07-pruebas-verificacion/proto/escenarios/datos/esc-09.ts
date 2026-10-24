import type { Escenario } from '../tipos';
// ESC-09 Pago total [P8]. Continúa ESC-08.
export default {
  id: 'ESC-09', titulo: 'Pago total', refs: ['P8'], continua: { escenario: 'ESC-08', hastaPaso: '2' },
  pasos: [
    { n: '3', ops: [{ op: 'pagar', tarjeta: 'T', monto: 150 }],
      espera: { ef: 700, lpa: 500, disp: { Super: 200, 'Pago T': 0 }, sobta: 0, tarjetas: { T: [0, 0, 0] } } },
  ],
} satisfies Escenario;
