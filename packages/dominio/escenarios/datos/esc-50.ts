import type { Escenario } from '../tipos';
// 01 §8, ESC-50 Registro automático atrasado e idempotente [P17, B-12, inv. 15]. Hoy: 10 mar (A = P2). Sigue PR-3 (07 §12.3, regla 11):
// el paso 1 registra solo la ocurrencia del 25 feb (P2); la del 25 ene (P1, cerrado) queda pendiente con AV-23; el paso 1b registra el
// 25 ene de un toque (OP-43) con AV-01 y llega al estado final del paso 1 original; el paso 2 (idempotencia) parte de ahí.
// Paso 0 = "Historial": el ingreso de 100 y la asignación de P1 llevan su `hoy` (no se asigna a un período cerrado). La suscripción es
// de 10 al mes, con la tarjeta T, en la categoría Suscripciones y con registro automático (`automatico`).
export default {
  id: 'ESC-50',
  titulo: 'Registro automático atrasado e idempotente',
  refs: ['P17', 'B-12', 'inv. 15'],
  hoy: '2027-03-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Suscripciones' },
    {
      op: 'OP-42',
      etiqueta: 'Suscripción',
      cuenta: 'T',
      comercio: 'Suscripción',
      monto: 10,
      categoria: 'Suscripciones',
      primeraFecha: '2027-01-25',
      automatico: true,
    },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 100, fecha: '2027-01-25', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Suscripciones', monto: 10, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Suscripciones', monto: 10, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Suscripciones', monto: 10, periodo: 'P3' },
      ],
      espera: {
        ef: 100,
        lpa: 70,
        disp: { Suscripciones: 20 },
        fut: 10,
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '1',
      ops: [{ op: 'OP-43', modo: 'automatico' }],
      espera: {
        ef: 100,
        lpa: 70,
        disp: { Suscripciones: 10, 'Pago T': 10 },
        fut: 10,
        sobta: 0,
        tarjetas: { T: [10, 0, 0] },
        avisos: ['AV-23'],
      },
    },
    {
      n: '1b',
      ops: [{ op: 'OP-43', modo: 'toque', programada: 'Suscripción', fecha: '2027-01-25' }],
      espera: {
        ef: 100,
        lpa: 70,
        disp: { Suscripciones: 0, 'Pago T': 20 },
        fut: 10,
        sobta: 0,
        tarjetas: { T: [20, 0, 0] },
        avisos: ['AV-01'],
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-43', modo: 'automatico' }],
      espera: {
        ef: 100,
        lpa: 70,
        disp: { Suscripciones: 0, 'Pago T': 20 },
        fut: 10,
        sobta: 0,
        tarjetas: { T: [20, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
