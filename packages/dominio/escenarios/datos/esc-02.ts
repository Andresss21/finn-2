import type { Escenario } from '../tipos';
// 01 §8, ESC-02 Saldo inicial con fecha en un período cerrado [M1, P4, C3]. Hoy: 5 mar (A = P2). Sin enmiendas.
// Paso 3 (comprobación del historial, §4.9): LPA_P1 = 500 y Ef(20 feb) = 500 = LPA_P1 + Σ Arr(P2) = 500 + 0.
export default {
  id: 'ESC-02',
  titulo: 'Saldo inicial con fecha en un período cerrado',
  refs: ['M1', 'P4', 'C3'],
  hoy: '2027-03-05',
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 500, apertura: '2027-01-25' }],
      espera: { ef: 500, lpa: 500, disp: {}, sobta: 0, avisos: ['AV-01'] },
    },
    {
      n: '2',
      ops: [{ op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 200, apertura: '2027-01-25' }],
      espera: {
        ef: 500,
        lpa: 500,
        disp: {},
        sobta: 0,
        tarjetas: { T: [200, 200, 0] },
        avisos: ['AV-01'],
      },
    },
    {
      n: '3',
      ops: [],
      espera: { extra: { 'lpaCierre:P1': 500, 'efAl:2027-02-20': 500, 'arrastre:P2': 0 } },
    },
  ],
} satisfies Escenario;
