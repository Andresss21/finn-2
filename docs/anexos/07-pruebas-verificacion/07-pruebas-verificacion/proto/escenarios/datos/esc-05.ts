import type { Escenario } from '../tipos';
// 01 §8, ESC-05 Compra con tarjeta no cubierta y cierre [C1; fila 3]
export default {
  id: 'ESC-05', titulo: 'Compra con tarjeta no cubierta y cierre', refs: ['C1'], hoy: '2027-02-15',
  cuentas: { efectivo: ['Ahorro'], tarjetas: [{ nombre: 'T' }] }, categorias: ['Super'],
  pasos: [
    { n: '1', ops: [{ op: 'ingreso', monto: 1000 }, { op: 'asignar', categoria: 'Super', monto: 300 }],
      espera: { ef: 1000, lpa: 700, disp: { Super: 300 }, sobta: 0, tarjetas: { T: [0, 0, 0] } } },
    { n: '2', ops: [{ op: 'compra', ref: 'C400', cuenta: 'T', fecha: '2027-02-10', lineas: [['Super', 400]] }],
      espera: { ef: 1000, lpa: 700, disp: { Super: -100, 'Pago T': 300 }, sobta: 100, tarjetas: { T: [400, 100, 0] }, avisos: ['AV-03', 'AV-07'] } },
    { n: '3', hoy: '2027-02-21', ops: [],
      espera: { ef: 1000, lpa: 700, disp: { Super: 0, 'Pago T': 300 }, sobta: 0, tarjetas: { T: [400, 100, 0] } } },
  ],
} satisfies Escenario;
