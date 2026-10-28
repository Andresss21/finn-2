import type { Escenario } from '../tipos';
// 01 §8, ESC-40 Desembolso de préstamo y retiro de inversión [H13]. Hoy: 10 feb (P1, DP-16). Sin enmiendas.
// Paso 0 = estado inicial (Ahorro con saldo 0; inversión con valor 3,000). Los atributos del préstamo nuevo que 01 no da (contraparte,
// cuota, plazo) son del dato; se crea con saldo 0 y el desembolso lo lleva a 5,000 (01 §2, "Desembolso").
// Columnas fuera de la instantánea: Préstamo (`capitalPrestamo`), Inversión (`valorInversion`), Patrimonio (`patrimonio`) y Reportes.
// "Reportes" es lo que clasifica la operación de la fila (otras entradas 5,000; 1,000), no el acumulado del período: por eso
// `reporteFila`; `reporte:ingreso` es el acumulado y vale 0 en las dos filas.
export default {
  id: 'ESC-40',
  titulo: 'Desembolso de préstamo y retiro de inversión',
  refs: ['H13'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 3000 },
  ],
  pasos: [
    {
      n: '0',
      ops: [],
      espera: {
        ef: 0,
        lpa: 0,
        disp: {},
        extra: { 'valorInversion:Inversión': 3000, patrimonio: 3000 },
      },
    },
    {
      n: '1',
      ops: [
        {
          op: 'OP-01',
          cuenta: 'Préstamo',
          tipo: 'prestamo',
          saldo: 0,
          prestamo: {
            contraparte: 'Banco',
            montoOriginal: 5000,
            cuota: 500,
            plazoCuotas: 12,
            cuotasPagadas: 0,
          },
        },
        { op: 'OP-26', prestamo: 'Préstamo', monto: 5000 },
      ],
      espera: {
        ef: 5000,
        lpa: 5000,
        disp: {},
        extra: {
          'capitalPrestamo:Préstamo': 5000,
          'valorInversion:Inversión': 3000,
          'reporteFila:otras_entradas': 5000,
          patrimonio: 3000,
        },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-25', modalidad: 'retiro', inversion: 'Inversión', monto: 1000 }],
      espera: {
        ef: 6000,
        lpa: 6000,
        disp: {},
        extra: {
          'capitalPrestamo:Préstamo': 5000,
          'valorInversion:Inversión': 2000,
          'reporteFila:otras_entradas': 1000,
          'reporte:ingreso': 0,
          patrimonio: 3000,
        },
      },
    },
  ],
} satisfies Escenario;
