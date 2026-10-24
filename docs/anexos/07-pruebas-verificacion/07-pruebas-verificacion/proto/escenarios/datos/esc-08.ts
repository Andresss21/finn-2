import type { Escenario } from '../tipos';
// ESC-08 Pago parcial con desglose [P8]. T con día de corte 15. Hoy: 19 feb.
export default {
  id: 'ESC-08', titulo: 'Pago parcial con desglose', refs: ['P8'], hoy: '2027-02-19',
  cuentas: { efectivo: ['Ahorro'], tarjetas: [{ nombre: 'T', diaCorte: 15 }] }, categorias: ['Super'],
  pasos: [
    { n: '1', ops: [{ op: 'ingreso', monto: 1000 }, { op: 'asignar', categoria: 'Super', monto: 500 },
        { op: 'compra', ref: 'C200', cuenta: 'T', fecha: '2027-02-03', lineas: [['Super', 200]] },
        { op: 'compra', ref: 'C100', cuenta: 'T', fecha: '2027-02-18', lineas: [['Super', 100]] }],
      espera: { ef: 1000, lpa: 500, disp: { Super: 200, 'Pago T': 300 }, sobta: 0, tarjetas: { T: [300, 0, 0] } } },
    { n: '2', ops: [{ op: 'pagar', tarjeta: 'T', monto: 150, fecha: '2027-02-19' }],
      espera: { ef: 850, lpa: 500, disp: { Super: 200, 'Pago T': 150 }, sobta: 0, tarjetas: { T: [150, 0, 0] },
        desglose: { deudaAnterior: 200, cargosCiclo: 100, yaPagado: 0, paraNoGenerarIntereses: 50 } } },
  ],
} satisfies Escenario;
