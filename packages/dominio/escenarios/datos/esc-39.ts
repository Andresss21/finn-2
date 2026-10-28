import type { Escenario } from '../tipos';
// 01 §8, ESC-39 Cuota de préstamo con desglose [H6, P3]. Hoy: 10 feb (P1, DP-16). Sin enmiendas.
// Los atributos del préstamo que 01 no da (contraparte, monto original, cuota de 350, plazo) son del dato; el capital pendiente es 10,000.
// Columna Préstamo en `extra`: `capitalPrestamo:Préstamo` y `costoFinanciero` (interés + seguro de las cuotas pagadas).
export default {
  id: 'ESC-39',
  titulo: 'Cuota de préstamo con desglose',
  refs: ['H6', 'P3'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    {
      op: 'OP-01',
      cuenta: 'Préstamo',
      tipo: 'prestamo',
      saldo: 10000,
      prestamo: {
        contraparte: 'Banco',
        montoOriginal: 10000,
        cuota: 350,
        plazoCuotas: 36,
        cuotasPagadas: 0,
      },
    },
    { op: 'OP-07', categoria: 'Cuota préstamo' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Cuota préstamo', monto: 350, periodo: 'P1' },
      ],
      espera: {
        ef: 1000,
        lpa: 650,
        disp: { 'Cuota préstamo': 350 },
        sobta: 0,
        extra: { 'capitalPrestamo:Préstamo': 10000 },
      },
    },
    {
      n: '2',
      ops: [
        {
          op: 'OP-24',
          prestamo: 'Préstamo',
          categoria: 'Cuota préstamo',
          capital: 250,
          interes: 90,
          seguro: 10,
        },
      ],
      espera: {
        ef: 650,
        lpa: 650,
        disp: {},
        sobta: 0,
        extra: { 'capitalPrestamo:Préstamo': 9750, costoFinanciero: 100 },
      },
    },
  ],
} satisfies Escenario;
