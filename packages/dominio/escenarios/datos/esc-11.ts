import type { Escenario } from '../tipos';
// 01 §8, ESC-11 Pago excedente con deuda restante [F4]. Hoy: 15 feb (P1). Sin enmiendas.
// Paso 2: AV-07 principal ("te falta reservar $30") y AV-04 secundario por 20 (F4).
export default {
  id: 'ESC-11',
  titulo: 'Pago excedente con deuda restante',
  refs: ['F4'],
  hoy: '2027-02-15',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Salidas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 300 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
        { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas' },
      ],
      espera: {
        ef: 300,
        lpa: 200,
        disp: { Salidas: -50, 'Pago T': 100 },
        sobta: 50,
        tarjetas: { T: [150, 50, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-23', tarjeta: 'T', monto: 120 }],
      espera: {
        ef: 180,
        lpa: 200,
        disp: { Salidas: -50, 'Pago T': -20 },
        sobta: 50,
        tarjetas: { T: [30, 30, 0] },
        avisos: ['AV-07', 'AV-04'],
      },
    },
  ],
} satisfies Escenario;
