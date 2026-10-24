import type { Escenario } from '../tipos';
// ESC-17 Sobregiro mixto el mismo día, con una transacción agregada tarde [D2, C1]. Hoy: 12 feb. Las compras son del 10 feb.
export default {
  id: 'ESC-17', titulo: 'Sobregiro mixto el mismo día, con una transacción agregada tarde', refs: ['D2', 'C1'], hoy: '2027-02-12',
  cuentas: { efectivo: ['Ahorro'], tarjetas: [{ nombre: 'T' }] }, categorias: ['Super'],
  pasos: [
    { n: '1', ops: [{ op: 'ingreso', monto: 500 },
        { op: 'asignar', categoria: 'Super', monto: 100 },
        { op: 'compra', ref: 'D60', cuenta: 'Ahorro', fecha: '2027-02-10', registrado: '2027-02-10T10:00', lineas: [['Super', 60]] },
        { op: 'compra', ref: 'T70', cuenta: 'T', fecha: '2027-02-10', registrado: '2027-02-10T12:00', lineas: [['Super', 70]] }],
      espera: { ef: 440, lpa: 400, disp: { Super: -30, 'Pago T': 40 }, sobta: 30, tarjetas: { T: [70, 30, 0] } } },
    { n: '2', ops: [{ op: 'compra', ref: 'D20', cuenta: 'Ahorro', fecha: '2027-02-10', lineas: [['Super', 20]] }],
      espera: { ef: 420, lpa: 400, disp: { Super: -50, 'Pago T': 40 }, sobta: 30, tarjetas: { T: [70, 30, 0] } } },
    { n: '2′', alternativaDe: '2', ops: [{ op: 'compra', ref: 'D20', cuenta: 'Ahorro', fecha: '2027-02-10', registrado: '2027-02-10T09:00', lineas: [['Super', 20]] }],
      espera: { ef: 420, lpa: 400, disp: { Super: -50, 'Pago T': 20 }, sobta: 50, tarjetas: { T: [70, 50, 0] } } },
    { n: '3', hoy: '2027-02-21', ops: [],
      espera: { ef: 420, lpa: 380, disp: { 'Pago T': 40 }, sobta: 0, tarjetas: { T: [70, 30, 0] } } },
  ],
} satisfies Escenario;
