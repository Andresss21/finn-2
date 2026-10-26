import type { Escenario } from '../tipos';
// Semilla del recorrido 4.6 "Cerrar con sobregiros" (06 §4.6; `estado_4_6` de recorridos.py, 07 §12.4).
// Hoy 12/02/2027, P1 = 21/01 a 20/02. Super: sobregiro mixto (tarjeta $30.00, débito $20.00); Salidas: con débito.
// El débito olvidado de Super lleva fecha 10/02 y se registra hoy (12/02): su clave de orden es posterior.
export default {
  id: 'SEM-4.6',
  titulo: 'Semilla de 4.6 Cerrar con sobregiros',
  refs: ['REC-4.6'],
  hoy: '2027-02-12',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-07', categoria: 'Ropa' },
    { op: 'OP-21', monto: 1000, cuenta: 'Ahorro', fecha: '2027-02-01' },
    { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
    { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
    { op: 'OP-14', categoria: 'Ropa', monto: 80, periodo: 'P1' },
    { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas', fecha: '2027-02-08' },
    {
      op: 'OP-20',
      cuenta: 'Ahorro',
      monto: 60,
      categoria: 'Super',
      fecha: '2027-02-10',
      registrado: '2027-02-10T10:00',
    },
    {
      op: 'OP-20',
      cuenta: 'T',
      monto: 70,
      categoria: 'Super',
      fecha: '2027-02-10',
      registrado: '2027-02-10T12:00',
    },
    { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-02-10' },
  ],
  pasos: [],
} satisfies Escenario;
