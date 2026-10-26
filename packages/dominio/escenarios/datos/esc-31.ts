import type { Escenario } from '../tipos';
// 01 §8, ESC-31 Transacción olvidada con débito en un período cerrado, con efecto en cascada [C3, P4]. Hoy: 5 abr (A = P3). Sin enmiendas.
// Paso 0 = "Historial": cada operación lleva su `hoy` (no se asigna a un período cerrado). La tabla no da la fecha del débito de Super (P1) ni del de Salidas de P2: se usan 4 feb y 1 mar (dentro de su período, DP-16).
// Se declara también la tarjeta T de 8.0 para que ESC-32 ("mismo historial") la use sin cambiar este paso. `reduccionesDebito` = SobD de los períodos cerrados.
export default {
  id: 'ESC-31',
  titulo: 'Transacción olvidada con débito en un período cerrado, con efecto en cascada',
  refs: ['C3', 'P4'],
  hoy: '2027-04-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Salidas', hoy: '2027-02-03' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 200, categoria: 'Super', hoy: '2027-02-04' },
        { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P2', hoy: '2027-02-21' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Salidas', hoy: '2027-03-01' },
        { op: 'OP-14', categoria: 'Salidas', monto: 60, periodo: 'P3', hoy: '2027-03-21' },
      ],
      espera: {
        ef: 670,
        lpa: 590,
        disp: { Salidas: 80 },
        sobta: 0,
        extra: { reduccionesDebito: 0 },
      },
    },
    {
      n: '1',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          categoria: 'Salidas',
          fecha: '2027-02-10',
          etiqueta: 'olvidado',
        },
      ],
      espera: {
        ef: 620,
        lpa: 560,
        disp: { Salidas: 60 },
        sobta: 0,
        avisos: ['AV-01'],
        extra: { reduccionesDebito: 30 },
      },
    },
  ],
} satisfies Escenario;
