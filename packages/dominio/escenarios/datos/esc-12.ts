import type { Escenario } from '../tipos';
// 01 §8, ESC-12 Intereses y comisiones [P8]. Hoy: 16 feb (P1). Sin enmiendas.
// "Int" de la tabla es la categoría "Intereses y comisiones".
export default {
  id: 'ESC-12',
  titulo: 'Intereses y comisiones',
  refs: ['P8'],
  hoy: '2027-02-16',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Intereses y comisiones' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Intereses y comisiones', monto: 20, periodo: 'P1' },
      ],
      espera: {
        ef: 500,
        lpa: 480,
        disp: { 'Intereses y comisiones': 20 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-20', cuenta: 'T', monto: 25, categoria: 'Intereses y comisiones' }],
      espera: {
        ef: 500,
        lpa: 480,
        disp: { 'Intereses y comisiones': -5, 'Pago T': 20 },
        sobta: 5,
        tarjetas: { T: [25, 5, 0] },
      },
    },
  ],
} satisfies Escenario;
