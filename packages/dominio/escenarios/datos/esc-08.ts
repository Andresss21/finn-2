import type { Escenario } from '../tipos';
// 01 §8, ESC-08 Pago parcial con desglose [P8]. T con día de corte 15. Hoy: 19 feb. Sin enmiendas.
// Desglose (§4.14): se observa antes del pago (deuda anterior al corte del 15 feb, cargos del ciclo, ya pagado) y el monto
// para no generar intereses, después del pago. El pago se aplica a la deuda anterior.
export default {
  id: 'ESC-08',
  titulo: 'Pago parcial con desglose',
  refs: ['P8'],
  hoy: '2027-02-19',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 15 },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 500, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 200, categoria: 'Super', fecha: '2027-02-03' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', fecha: '2027-02-18' },
      ],
      espera: {
        ef: 1000,
        lpa: 500,
        disp: { Super: 200, 'Pago T': 300 },
        sobta: 0,
        tarjetas: { T: [300, 0, 0] },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-23', tarjeta: 'T', monto: 150 }],
      espera: {
        ef: 850,
        lpa: 500,
        disp: { Super: 200, 'Pago T': 150 },
        sobta: 0,
        tarjetas: { T: [150, 0, 0] },
        extra: {
          'desgloseAntes:T:deudaAnterior': 200,
          'desgloseAntes:T:cargosDelCiclo': 100,
          'desgloseAntes:T:yaPagado': 0,
          'desglose:T:paraNoGenerarIntereses': 50,
        },
      },
    },
  ],
} satisfies Escenario;
