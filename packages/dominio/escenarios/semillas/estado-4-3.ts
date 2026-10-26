import type { Escenario } from '../tipos';
// Semilla del recorrido 4.3 "Inicio de período" (06 §4.3; `estado_4_3` de recorridos.py, 07 §12.4). Hoy 21/04/2027, primer
// día de P4, antes de la tarea diaria. Se siembra día por día: OP-14 solo escribe en el período activo o futuro, y cada
// gasto lleva la fecha de su hoy. Los cargos de Netflix del 21 son los que registraría la programada (OP-25 no existe aún).
// Todas las categorías van en el grupo "Gastos": el ejecutor `motor` solo distingue nombres de categoría.
export default {
  id: 'SEM-4.3',
  titulo: 'Semilla de 4.3 Inicio de período',
  refs: ['REC-4.3'],
  hoy: '2027-01-21',
  pasos: [
    {
      n: '1.1',
      hoy: '2027-01-21',
      ops: [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 900 },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-07', categoria: 'Farmacia' },
        { op: 'OP-07', categoria: 'Restaurantes' },
        { op: 'OP-07', categoria: 'Netflix' },
        { op: 'OP-07', categoria: 'Fondo' },
        { op: 'OP-18', categoria: 'Super', tipo: 'mensual', monto: 300 },
        { op: 'OP-18', categoria: 'Netflix', tipo: 'mensual', monto: 15.49 },
        { op: 'OP-18', categoria: 'Fondo', tipo: 'para_fecha', monto: 600, fecha: '2027-04-15' },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Netflix', monto: 15.49, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Fondo', monto: 150, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 15.49, categoria: 'Netflix' },
      ],
      espera: {},
    },
    {
      n: '1.2',
      hoy: '2027-01-25',
      ops: [{ op: 'OP-21', monto: 600, cuenta: 'Ahorro' }],
      espera: {},
    },
    {
      n: '1.3',
      hoy: '2027-01-27',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 140, categoria: 'Restaurantes' }],
      espera: {},
    },
    {
      n: '1.4',
      hoy: '2027-01-28',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 280, categoria: 'Super' }],
      espera: {},
    },
    {
      n: '2.1',
      hoy: '2027-02-21',
      ops: [
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Netflix', monto: 15.49, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Fondo', monto: 150, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Farmacia', monto: 20, periodo: 'P2' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 15.49, categoria: 'Netflix' },
      ],
      espera: {},
    },
    {
      n: '2.2',
      hoy: '2027-02-25',
      ops: [{ op: 'OP-21', monto: 600, cuenta: 'Ahorro' }],
      espera: {},
    },
    {
      n: '2.3',
      hoy: '2027-02-27',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 145, categoria: 'Restaurantes' }],
      espera: {},
    },
    {
      n: '2.4',
      hoy: '2027-02-28',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 290, categoria: 'Super' }],
      espera: {},
    },
    {
      n: '2.5',
      hoy: '2027-03-02',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Farmacia' }],
      espera: {},
    },
    {
      n: '3.1',
      hoy: '2027-03-21',
      ops: [
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P3' },
        { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P3' },
        { op: 'OP-14', categoria: 'Netflix', monto: 15.49, periodo: 'P3' },
        { op: 'OP-14', categoria: 'Fondo', monto: 100, periodo: 'P3' },
        { op: 'OP-14', categoria: 'Farmacia', monto: 35, periodo: 'P3' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 15.49, categoria: 'Netflix' },
      ],
      espera: {},
    },
    {
      n: '3.2',
      hoy: '2027-03-25',
      ops: [{ op: 'OP-21', monto: 600, cuenta: 'Ahorro' }],
      espera: {},
    },
    {
      n: '3.3',
      hoy: '2027-03-27',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Restaurantes' }],
      espera: {},
    },
    {
      n: '3.4',
      hoy: '2027-03-28',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 310, categoria: 'Super' }],
      espera: {},
    },
    {
      n: '3.5',
      hoy: '2027-04-02',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 30.5, categoria: 'Farmacia' }],
      espera: {},
    },
    {
      n: '4.0',
      hoy: '2027-04-21',
      ops: [],
      espera: {},
    },
  ],
} satisfies Escenario;
