import type { Escenario } from '../tipos';
// 01 §8, ESC-44 Archivar una categoría y devolución posterior hacia ella [H10, M3, N5, ajuste 1]. Hoy: 5 mar (A = P2). Sin enmiendas.
// Paso 0 = "Historial" (cada operación con su `hoy`). La programada activa (OP-42) es de 30 al mes en Gimnasio desde el 10 mar, sin registro
// automático: 01 no da sus atributos y así no genera ocurrencias ni cambia ningún número. La compra del 2 feb es el débito de 30.
// Paso 3: condonar exige una línea por cobrar que el historial no tiene; se registra en la misma fila (un gasto de 10 por cobrar a Ana) y el
// rechazo de la fila descarta ambas operaciones (01 §5.0.1), de modo que la instantánea queda igual.
export default {
  id: 'ESC-44',
  titulo: 'Archivar una categoría y devolución posterior hacia ella',
  refs: ['H10', 'M3', 'N5', 'ajuste 1'],
  hoy: '2027-03-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Gimnasio' },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 30,
          categoria: 'Gimnasio',
          fecha: '2027-02-02',
          hoy: '2027-02-02',
          etiqueta: 'gimnasio',
        },
        { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
        {
          op: 'OP-42',
          etiqueta: 'gimnasio',
          cuenta: 'Ahorro',
          comercio: 'Gimnasio',
          monto: 30,
          categoria: 'Gimnasio',
          primeraFecha: '2027-03-10',
        },
      ],
      espera: { ef: 670, lpa: 600, disp: { Gimnasio: 40 }, fut: 30, sobta: 0 },
    },
    {
      n: '1',
      ops: [
        {
          op: 'OP-09',
          categoria: 'Gimnasio',
          destino: 'LPA',
          devolverFuturas: true,
          desactivar: ['gimnasio'],
        },
      ],
      espera: { ef: 670, lpa: 670, disp: {}, fut: 0, sobta: 0 },
    },
    {
      n: '2',
      ops: [{ op: 'OP-33', compra: 'gimnasio', monto: 25 }],
      espera: {
        ef: 695,
        lpa: 670,
        disp: { Gimnasio: 25 },
        sobta: 0,
        avisos: ['AV-14'],
      },
    },
    {
      n: '3',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 10,
          lineas: [{ deudor: 'Ana', monto: 10 }],
          etiqueta: 'ana',
        },
        { op: 'OP-32', cobro: 'ana', categoria: 'Gimnasio', monto: 10 },
      ],
      espera: {
        ef: 695,
        lpa: 670,
        disp: { Gimnasio: 25 },
        sobta: 0,
        rechazo: 'categoria_archivada',
      },
    },
    {
      n: '4',
      ops: [{ op: 'OP-11', categoria: 'Gimnasio', monto: 25, destino: 'LPA' }],
      espera: { ef: 695, lpa: 695, disp: {}, sobta: 0 },
    },
  ],
} satisfies Escenario;
