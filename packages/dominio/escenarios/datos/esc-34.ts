import type { Escenario } from '../tipos';
// 01 §8, ESC-34 Cambio de fecha que mueve la transacción de período [I6, supuesto 5]. Hoy: 25 feb (A = P2). Sin enmiendas.
// Paso 1: el ingreso de P1 se registra el 1 feb (la tabla no da fecha; dentro de P1, DP-16).
export default {
  id: 'ESC-34',
  titulo: 'Cambio de fecha que mueve la transacción de período',
  refs: ['I6', 'supuesto 5'],
  hoy: '2027-02-25',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Salidas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500, fecha: '2027-02-01', hoy: '2027-02-01' },
        { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P1', hoy: '2027-02-01' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 80,
          categoria: 'Salidas',
          fecha: '2027-02-19',
          hoy: '2027-02-19',
          etiqueta: 'debito',
        },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P2' },
      ],
      espera: {
        ef: 420,
        lpa: 320,
        disp: { Salidas: 100 },
        sobta: 0,
        extra: { reduccionesDebito: 30 },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-28', etiqueta: 'debito', fecha: '2027-02-22' }],
      espera: {
        ef: 420,
        lpa: 350,
        disp: { Salidas: 70 },
        sobta: 0,
        avisos: ['AV-01'],
        extra: { reduccionesDebito: 0 },
      },
    },
  ],
} satisfies Escenario;
