import type { Escenario } from '../tipos';
// ESC-18 Cambio de medio de pago [criterio YNAB de 2.3, C1, D2]. Continúa el paso 2 de ESC-17 (hoy 12 feb).
export default {
  id: 'ESC-18', titulo: 'Cambio de medio de pago', refs: ['C1', 'D2'], continua: { escenario: 'ESC-17', hastaPaso: '2' },
  pasos: [
    { n: '3', ops: [{ op: 'cambiarCuenta', ref: 'T70', cuenta: 'Ahorro' }],
      espera: { ef: 350, lpa: 400, disp: { Super: -50 }, sobta: 0, tarjetas: { T: [0, 0, 0] } } },
    { n: '4', ops: [{ op: 'cambiarCuenta', ref: 'D60', cuenta: 'T' }],
      espera: { ef: 410, lpa: 400, disp: { Super: -50, 'Pago T': 60 }, sobta: 0, tarjetas: { T: [60, 0, 0] } } },
  ],
} satisfies Escenario;
