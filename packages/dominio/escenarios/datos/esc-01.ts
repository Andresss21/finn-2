import type { Escenario } from '../tipos';
// 01 §8, ESC-01 Saldos iniciales [P13, M1, P3]. Hoy: 5 feb (A = P1). Sin enmiendas.
// Los atributos del préstamo (contraparte, monto original, cuota y plazo) no los da 01 §8: son del dato y no entran
// en ninguna aserción (capital pendiente 5,000; 10 cuotas pagadas).
export default {
  id: 'ESC-01',
  titulo: 'Saldos iniciales',
  refs: ['P13', 'M1', 'P3'],
  hoy: '2027-02-05',
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' }],
      espera: { ef: 1000, lpa: 1000, disp: {}, sobta: 0 },
    },
    {
      n: '2',
      ops: [{ op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 }],
      espera: {
        ef: 1000,
        lpa: 1000,
        disp: {},
        sobta: 0,
        tarjetas: { T: [300, 300, 0] },
        avisos: ['AV-07'],
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' }],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { 'Pago T': 300 },
        sobta: 0,
        tarjetas: { T: [300, 0, 0] },
      },
    },
    {
      n: '4',
      ops: [
        {
          op: 'OP-01',
          cuenta: 'Préstamo',
          tipo: 'prestamo',
          saldo: 5000,
          prestamo: {
            contraparte: 'Banco',
            montoOriginal: 6000,
            cuota: 100,
            plazoCuotas: 60,
            cuotasPagadas: 10,
          },
        },
      ],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { 'Pago T': 300 },
        sobta: 0,
        tarjetas: { T: [300, 0, 0] },
        extra: { patrimonio: -4300 },
      },
    },
  ],
} satisfies Escenario;
