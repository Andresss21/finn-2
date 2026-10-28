import type { Escenario } from '../tipos';
// 01 §8, ESC-38 Meta para una fecha: cumplida antes, vencida y extendida [O5, A-4]. Hoy: 25 ene 2027 (creación); cada paso corre en su período. Sin enmiendas.
// Meta de 600 en Laptop para el 15 may 2027 (P4). El ingreso inicial de 1,000 en P1 sale de la nota de identidad del paso 3a.
// 3a/3b son alternativas desde el estado anterior al paso 3a; 4b a 6b continúan la rama 3b. Pedido en `extra`: `metaPedido:Laptop`.
// "En P4 el pedido es 0; después de la FO, Completada" (nota de 3a) no es una fila de la tabla: no se compara aquí.
export default {
  id: 'ESC-38',
  titulo: 'Meta para una fecha: cumplida antes, vencida y extendida',
  refs: ['O5', 'A-4'],
  hoy: '2027-01-25',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Laptop' },
    { op: 'OP-18', categoria: 'Laptop', monto: 600, tipo: 'para_fecha', fecha: '2027-05-15' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Laptop', monto: 150, periodo: 'P1' },
      ],
      espera: {
        ef: 1000,
        lpa: 850,
        disp: { Laptop: 150 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 150 },
      },
    },
    {
      n: '2',
      hoy: '2027-02-21',
      ops: [{ op: 'OP-14', categoria: 'Laptop', monto: 150 }],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Laptop: 300 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 150 },
      },
    },
    {
      n: '3a',
      hoy: '2027-03-21',
      ops: [{ op: 'OP-14', categoria: 'Laptop', monto: 300 }],
      espera: {
        ef: 1000,
        lpa: 400,
        disp: { Laptop: 600 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 150 },
      },
    },
    {
      n: '3b',
      alternativaDe: '3a',
      hoy: '2027-03-21',
      ops: [],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Laptop: 300 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 150 },
      },
    },
    {
      n: '4b',
      rama: '3b',
      hoy: '2027-04-21',
      ops: [{ op: 'OP-14', categoria: 'Laptop', monto: 100 }],
      espera: {
        ef: 1000,
        lpa: 600,
        disp: { Laptop: 400 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 300 },
      },
    },
    {
      n: '5b',
      rama: '3b',
      hoy: '2027-05-21',
      ops: [],
      espera: {
        ef: 1000,
        lpa: 600,
        disp: { Laptop: 400 },
        sobta: 0,
        avisos: ['AV-17'],
        extra: { 'metaPedido:Laptop': 200 },
      },
    },
    {
      n: '6b',
      rama: '3b',
      ops: [{ op: 'OP-18', categoria: 'Laptop', editar: true, fecha: '2027-07-15' }],
      espera: {
        ef: 1000,
        lpa: 600,
        disp: { Laptop: 400 },
        sobta: 0,
        extra: { 'metaPedido:Laptop': 100 },
      },
    },
  ],
} satisfies Escenario;
