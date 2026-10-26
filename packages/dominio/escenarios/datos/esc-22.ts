import type { Escenario } from '../tipos';
// 01 §8, ESC-22 Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago [O1, D1]. Hoy: 10 feb (P1). Sin enmiendas.
// Paso 2: AV-22 (preseleccionado). Paso 3: el usuario confirma la propuesta, que es asignar 40 a "Pago T" (OP-14).
export default {
  id: 'ESC-22',
  titulo: 'Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago',
  refs: ['O1', 'D1'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 80,
          etiqueta: 'compartida',
          lineas: [
            { categoria: 'Super', monto: 40 },
            { deudor: 'Ana', monto: 40 },
          ],
        },
      ],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Super: 260, 'Pago T': 40 },
        sobta: 0,
        tarjetas: { T: [80, 40, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 40 }],
      espera: {
        ef: 1040,
        lpa: 740,
        disp: { Super: 260, 'Pago T': 40 },
        sobta: 0,
        tarjetas: { T: [80, 40, 0] },
        avisos: ['AV-22'],
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: 40 }],
      espera: {
        ef: 1040,
        lpa: 700,
        disp: { Super: 260, 'Pago T': 80 },
        sobta: 0,
        tarjetas: { T: [80, 0, 0] },
      },
    },
  ],
} satisfies Escenario;
