import type { Escenario } from '../tipos';
// 01 §8, ESC-42 Fusión que afecta sobregiros de períodos cerrados [O4, N4]. Hoy: 5 abr (A = P3). Sin enmiendas.
// Paso 0 = "Historial": cada operación lleva su `hoy` (no se asigna a un período cerrado). La tabla no da las fechas de los débitos de P1:
// se usan 3 y 4 feb (dentro de su período, DP-16). Café tiene meta mensual de 50. `reduccionesDebito` = SobD de los períodos cerrados.
export default {
  id: 'ESC-42',
  titulo: 'Fusión que afecta sobregiros de períodos cerrados',
  refs: ['O4', 'N4'],
  hoy: '2027-04-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Café' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-18', categoria: 'Café', monto: 50 },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Café', monto: 50, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Café', hoy: '2027-02-03' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Salidas', hoy: '2027-02-04' },
      ],
      espera: {
        ef: 880,
        lpa: 820,
        disp: { Salidas: 60 },
        sobta: 0,
        extra: { reduccionesDebito: 30 },
      },
    },
    {
      n: '1',
      ops: [{ op: 'OP-12', origen: 'Café', destino: 'Salidas' }],
      espera: {
        ef: 880,
        lpa: 850,
        disp: { Salidas: 30 },
        sobta: 0,
        avisos: ['AV-13', 'AV-01'],
        extra: { reduccionesDebito: 0 },
      },
    },
  ],
} satisfies Escenario;
