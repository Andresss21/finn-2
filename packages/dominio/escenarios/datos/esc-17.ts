import type { Escenario } from '../tipos';
// 01 §8, ESC-17 Sobregiro mixto el mismo día, con una transacción agregada tarde [D2, C1]. Hoy: 12 feb (P1); las compras son del
// 10 feb. Sin enmiendas. D60 se registra el 10 feb a las 10:00 y T70 a las 12:00; el débito olvidado D20 se registra hoy (12 feb,
// después de las existentes) y en el contraste 2′ el 10 feb a las 09:00 (antes de todas). Paso 3: cierre del caso del paso 2.
export default {
  id: 'ESC-17',
  titulo: 'Sobregiro mixto el mismo día, con una transacción agregada tarde',
  refs: ['D2', 'C1'],
  hoy: '2027-02-12',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 60,
          categoria: 'Super',
          etiqueta: 'D60',
          fecha: '2027-02-10',
          registrado: '2027-02-10T10:00',
        },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 70,
          categoria: 'Super',
          etiqueta: 'T70',
          fecha: '2027-02-10',
          registrado: '2027-02-10T12:00',
        },
      ],
      espera: {
        ef: 440,
        lpa: 400,
        disp: { Super: -30, 'Pago T': 40 },
        sobta: 30,
        tarjetas: { T: [70, 30, 0] },
      },
    },
    {
      n: '2',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 20,
          categoria: 'Super',
          etiqueta: 'D20',
          fecha: '2027-02-10',
        },
      ],
      espera: {
        ef: 420,
        lpa: 400,
        disp: { Super: -50, 'Pago T': 40 },
        sobta: 30,
        tarjetas: { T: [70, 30, 0] },
      },
    },
    {
      n: '2′',
      alternativaDe: '2',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 20,
          categoria: 'Super',
          etiqueta: 'D20',
          fecha: '2027-02-10',
          registrado: '2027-02-10T09:00',
        },
      ],
      espera: {
        ef: 420,
        lpa: 400,
        disp: { Super: -50, 'Pago T': 20 },
        sobta: 50,
        tarjetas: { T: [70, 50, 0] },
      },
    },
    {
      n: '3',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 420,
        lpa: 380,
        disp: { 'Pago T': 40 },
        sobta: 0,
        tarjetas: { T: [70, 30, 0] },
      },
    },
  ],
} satisfies Escenario;
