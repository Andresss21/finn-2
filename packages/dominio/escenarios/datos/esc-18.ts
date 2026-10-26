import type { Escenario } from '../tipos';
// 01 §8, ESC-18 Cambio de medio de pago [criterio YNAB de 2.3, C1, D2]. Continúa el paso 2 de ESC-17 (hoy 12 feb). Sin enmiendas.
// OP-28 cambia la cuenta de T70 y de D60 (las etiquetas las da ESC-17). Paso 4: orden T60, D70 (40 cubiertos), D20; SobT = 0, SobD = 50.
export default {
  id: 'ESC-18',
  titulo: 'Cambio de medio de pago',
  refs: ['criterio YNAB de 2.3', 'C1', 'D2'],
  continua: { escenario: 'ESC-17', hastaPaso: '2' },
  pasos: [
    {
      n: '3',
      ops: [{ op: 'OP-28', etiqueta: 'T70', cuenta: 'Ahorro' }],
      espera: {
        ef: 350,
        lpa: 400,
        disp: { Super: -50 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '4',
      ops: [{ op: 'OP-28', etiqueta: 'D60', cuenta: 'T' }],
      espera: {
        ef: 410,
        lpa: 400,
        disp: { Super: -50, 'Pago T': 60 },
        sobta: 0,
        tarjetas: { T: [60, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
