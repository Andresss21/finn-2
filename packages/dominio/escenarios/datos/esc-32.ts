import type { Escenario } from '../tipos';
// 01 §8, ESC-32 Transacción olvidada con tarjeta en un período cerrado [C3, C1]. Hoy: 5 abr (A = P3). Sin enmiendas.
// "Mismo historial que el paso 0 de ESC-31" (07 §12.3, cadenas).
export default {
  id: 'ESC-32',
  titulo: 'Transacción olvidada con tarjeta en un período cerrado',
  refs: ['C3', 'C1'],
  continua: { escenario: 'ESC-31', hastaPaso: '0' },
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas', fecha: '2027-02-10' }],
      espera: {
        ef: 670,
        lpa: 590,
        disp: { Salidas: 60, 'Pago T': 20 },
        sobta: 0,
        tarjetas: { T: [50, 30, 0] },
        avisos: ['AV-01'],
      },
    },
  ],
} satisfies Escenario;
