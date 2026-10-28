import type { Escenario } from '../tipos';
// 01 §8, ESC-43 Eliminación de una tarjeta con asignaciones en un período cerrado [O3, F1]. Hoy: 5 mar (A = P2). Sin enmiendas.
// U se crea con apertura 25 ene y deuda 200 (solo saldo inicial); el ingreso y la asignación de P1 llevan su `hoy` (no se asigna a un cerrado).
export default {
  id: 'ESC-43',
  titulo: 'Eliminación de una tarjeta con asignaciones en un período cerrado',
  refs: ['O3', 'F1'],
  hoy: '2027-03-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta', saldo: 200, apertura: '2027-01-25' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Pago U', monto: 150, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Pago U', monto: 50 },
      ],
      espera: {
        ef: 1000,
        lpa: 800,
        disp: { 'Pago U': 200 },
        sobta: 0,
        tarjetas: { U: [200, 0, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-06', cuenta: 'U' }],
      espera: { ef: 1000, lpa: 1000, disp: {}, sobta: 0, avisos: ['AV-15'] },
    },
  ],
} satisfies Escenario;
