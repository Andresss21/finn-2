import type { Escenario } from '../tipos';
// 01 §8, ESC-46 SMS de las 7 pm del día 20 aprobado el día 21 [P5, P18; error 5 del documento base]. Sin enmiendas.
// Hoy: 20 feb (P1) en el paso 1 y 21 feb (P2) desde el paso 2. El SMS llega el 20 feb a las 19:00 local (21 feb 01:00 UTC) y trae fecha 20/02:
// compra con T de 30 en Super. El paso 3 aprueba el 21 feb a las 08:00 con la variante "aprobar con categoría" (OP-37, CF-21).
// T tiene institución y últimos cuatro dígitos para que OP-35 encuentre su cuenta.
export default {
  id: 'ESC-46',
  titulo: 'SMS de las 7 pm del día 20 aprobado el día 21',
  refs: ['P5', 'P18', 'error 5'],
  hoy: '2027-02-20',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
        {
          op: 'OP-35',
          etiqueta: 'sms',
          cuenta: 'T',
          monto: 30,
          comercio: 'Super',
          recibido: '2027-02-20T19:00',
          fecha: '2027-02-20',
        },
      ],
      espera: {
        ef: 500,
        lpa: 450,
        disp: { Super: 50 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '2',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 500,
        lpa: 450,
        disp: { Super: 50 },
        sobta: 0,
        tarjetas: { T: [0, 0, 0] },
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-37', etiqueta: 'sms', categoria: 'Super', aprobado: '2027-02-21T08:00' }],
      espera: {
        ef: 500,
        lpa: 450,
        disp: { Super: 20, 'Pago T': 30 },
        sobta: 0,
        tarjetas: { T: [30, 0, 0] },
        avisos: ['AV-01'],
      },
    },
  ],
} satisfies Escenario;
