import type { Escenario } from '../tipos';
// 01 §8, ESC-23 Compartido con tarjeta: cobro parcial y condonación [H8, I4]. Hoy: 12 feb (P1). Sin enmiendas.
// Fechas de la tabla: compra 5 feb, cobro 8 feb, condonación 10 feb. Paso 2: el usuario no acepta AV-22 (no se asigna a Pago T).
// Paso 3: la condonación es un consumo con T: se cubren 40 de Salidas y se trasladan a Pago T.
export default {
  id: 'ESC-23',
  titulo: 'Compartido con tarjeta: cobro parcial y condonación',
  refs: ['H8', 'I4'],
  hoy: '2027-02-12',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Salidas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 120,
          fecha: '2027-02-05',
          etiqueta: 'compartida',
          lineas: [
            { categoria: 'Salidas', monto: 60 },
            { deudor: 'Beto', monto: 60 },
          ],
        },
      ],
      espera: {
        ef: 500,
        lpa: 400,
        disp: { Salidas: 40, 'Pago T': 60 },
        sobta: 0,
        tarjetas: { T: [120, 60, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 20, fecha: '2027-02-08' }],
      espera: {
        ef: 520,
        lpa: 420,
        disp: { Salidas: 40, 'Pago T': 60 },
        sobta: 0,
        tarjetas: { T: [120, 60, 0] },
      },
    },
    {
      n: '3',
      ops: [
        {
          op: 'OP-32',
          cobro: 'compartida',
          categoria: 'Salidas',
          monto: 40,
          fecha: '2027-02-10',
        },
      ],
      espera: {
        ef: 520,
        lpa: 420,
        disp: { Salidas: 0, 'Pago T': 100 },
        sobta: 0,
        tarjetas: { T: [120, 20, 0] },
      },
    },
  ],
} satisfies Escenario;
