import type { Escenario } from '../tipos';
// 01 §8, ESC-35 Meta mensual: acumular frente a rellenar hasta [P6, supuesto 4]. Hoy: 10 feb (P1) y, desde el paso 2, 21 feb (P2). Sin enmiendas.
// Gas: meta de 200 con "rellenar hasta"; Fondo: meta de 200 con "acumular". Columna Metas en `extra`: `metaPedido:<cat>` y `metaFalta:<cat>`.
export default {
  id: 'ESC-35',
  titulo: 'Meta mensual: acumular frente a rellenar hasta',
  refs: ['P6', 'supuesto 4'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Gas' },
    { op: 'OP-07', categoria: 'Fondo' },
    { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta' },
    { op: 'OP-18', categoria: 'Fondo', monto: 200, modo: 'acumular' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Fondo', monto: 200, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 120, categoria: 'Gas' },
      ],
      espera: {
        ef: 880,
        lpa: 600,
        disp: { Gas: 80, Fondo: 200 },
        sobta: 0,
        extra: { 'metaFalta:Gas': 0, 'metaFalta:Fondo': 0 },
      },
    },
    {
      n: '2',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 880,
        lpa: 600,
        disp: { Gas: 80, Fondo: 200 },
        sobta: 0,
        extra: {
          'metaPedido:Gas': 120,
          'metaFalta:Gas': 120,
          'metaPedido:Fondo': 200,
          'metaFalta:Fondo': 200,
        },
      },
    },
    {
      n: '3',
      ops: [
        { op: 'OP-14', categoria: 'Gas', monto: 120 },
        { op: 'OP-14', categoria: 'Fondo', monto: 200 },
      ],
      espera: {
        ef: 880,
        lpa: 280,
        disp: { Gas: 200, Fondo: 400 },
        sobta: 0,
        extra: { 'metaFalta:Gas': 0, 'metaFalta:Fondo': 0 },
      },
    },
  ],
} satisfies Escenario;
