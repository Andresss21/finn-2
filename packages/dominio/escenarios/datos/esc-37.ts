import type { Escenario } from '../tipos';
// 01 §8, ESC-37 Meta anual: reparto y renovación con dinero no gastado [N8, F2, O5, B-3]. Hoy: 25 ene 2027 (creación de la meta). Sin enmiendas.
// La tabla salta de P2 a "Base 1,100" en el período de FO₀ (P13, 21 ene 2028): el paso 3 completa el historial con 3,000 de ingreso y
// 1,007.69 más en Viaje en P2 (cada operación con su `hoy`), de modo que Base(P13) = 92.31 + 1,007.69 = 1,100 sin gastos (DP-16).
// Columna Pedido en `extra`: `metaPedido:Viaje`.
export default {
  id: 'ESC-37',
  titulo: 'Meta anual: reparto y renovación con dinero no gastado',
  refs: ['N8', 'F2', 'O5', 'B-3'],
  hoy: '2027-01-25',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Viaje' },
    { op: 'OP-18', categoria: 'Viaje', monto: 1200, tipo: 'anual' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 2000 },
        { op: 'OP-14', categoria: 'Viaje', monto: 92.31, periodo: 'P1' },
      ],
      espera: {
        ef: 2000,
        lpa: 1907.69,
        disp: { Viaje: 92.31 },
        sobta: 0,
        extra: { 'metaPedido:Viaje': 92.31 },
      },
    },
    {
      n: '2',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 2000,
        lpa: 1907.69,
        disp: { Viaje: 92.31 },
        sobta: 0,
        extra: { 'metaPedido:Viaje': 92.31 },
      },
    },
    {
      n: '3',
      hoy: '2028-01-21',
      ops: [
        { op: 'OP-21', monto: 3000, fecha: '2027-02-21', hoy: '2027-02-21' },
        { op: 'OP-14', categoria: 'Viaje', monto: 1007.69, periodo: 'P2', hoy: '2027-02-21' },
        { op: 'OP-14', categoria: 'Viaje', monto: 100 },
      ],
      espera: {
        ef: 5000,
        lpa: 3800,
        disp: { Viaje: 1200 },
        sobta: 0,
        extra: { 'metaPedido:Viaje': 100, 'metaFalta:Viaje': 0 },
      },
    },
    {
      n: '4',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 600, categoria: 'Viaje' }],
      espera: { ef: 4400, lpa: 3800, disp: { Viaje: 600 }, sobta: 0 },
    },
    {
      n: '5',
      hoy: '2028-02-21',
      ops: [],
      espera: {
        ef: 4400,
        lpa: 3800,
        disp: { Viaje: 600 },
        sobta: 0,
        extra: { 'metaPedido:Viaje': 50 },
      },
    },
  ],
} satisfies Escenario;
