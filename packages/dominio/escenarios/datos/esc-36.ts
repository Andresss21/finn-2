import type { Escenario } from '../tipos';
// 01 §8, ESC-36 Meta semanal en períodos de distinta duración [H11]. Sin enmiendas. Meta de 50 por semana, "acumular".
// La tabla da el monto del período = redondeo(50 × días / 7) para P1 (31 días), P2 (28) y P4 (30): un paso por período (`metaPeriodo`),
// y la identidad de P1 (Ef 500 = 278.57 + 221.43). La fila "transición de 11 días" (78.57) depende del cambio de ciclo de ESC-45
// (aún sin ejecutor): queda fuera y la evalúa el escenario de ESC-45; ver el informe de TA-133.
export default {
  id: 'ESC-36',
  titulo: 'Meta semanal en períodos de distinta duración',
  refs: ['H11'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Semanal' },
    { op: 'OP-18', categoria: 'Semanal', monto: 50, tipo: 'semanal', modo: 'acumular' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Semanal', monto: 221.43, periodo: 'P1' },
      ],
      espera: {
        ef: 500,
        lpa: 278.57,
        disp: { Semanal: 221.43 },
        sobta: 0,
        extra: { 'metaPeriodo:Semanal': 221.43, 'metaFalta:Semanal': 0 },
      },
    },
    {
      n: '2',
      hoy: '2027-03-01',
      ops: [],
      espera: { ef: 500, extra: { 'metaPeriodo:Semanal': 200 } },
    },
    {
      n: '3',
      hoy: '2027-04-25',
      ops: [],
      espera: { ef: 500, extra: { 'metaPeriodo:Semanal': 214.29 } },
    },
  ],
} satisfies Escenario;
