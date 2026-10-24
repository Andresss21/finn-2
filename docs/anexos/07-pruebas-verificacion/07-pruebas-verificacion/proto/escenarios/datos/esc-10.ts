import type { Escenario } from '../tipos';
// ESC-10 Pago excedente, antes y después del cierre [H5, O2; filas 4 y 5]. Hoy: 15 feb.
export default {
  id: 'ESC-10', titulo: 'Pago excedente, antes y después del cierre', refs: ['H5', 'O2'], hoy: '2027-02-15',
  cuentas: { efectivo: ['Ahorro'], tarjetas: [{ nombre: 'T' }] }, categorias: ['Super', 'Salidas'],
  pasos: [
    { n: '1', ops: [{ op: 'ingreso', monto: 200 }, { op: 'asignar', categoria: 'Super', monto: 100 }],
      espera: { ef: 200, lpa: 100, disp: { Super: 100 }, sobta: 0, tarjetas: { T: [0, 0, 0] } } },
    { n: '2', ops: [{ op: 'compra', ref: 'A', cuenta: 'T', lineas: [['Super', 100]] }, { op: 'compra', ref: 'B', cuenta: 'T', lineas: [['Salidas', 50]] }],
      espera: { ef: 200, lpa: 100, disp: { Super: 0, Salidas: -50, 'Pago T': 100 }, sobta: 50, tarjetas: { T: [150, 50, 0] }, avisos: ['AV-03'] } },
    { n: '3', ops: [{ op: 'pagar', tarjeta: 'T', monto: 150 }],
      espera: { ef: 50, lpa: 100, disp: { Super: 0, Salidas: -50, 'Pago T': -50 }, sobta: 50, tarjetas: { T: [0, 0, 0] }, avisos: ['AV-10', 'AV-04'] } },
    { n: '4', hoy: '2027-02-21', ops: [],
      espera: { ef: 50, lpa: 50, disp: {}, sobta: 0, tarjetas: { T: [0, 0, 0] } } },
  ],
} satisfies Escenario;
