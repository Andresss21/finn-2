import type { Escenario } from '../tipos';
// 01 §8, ESC-49 Tres períodos seguidos con asignaciones futuras [Q1, C1, C3]. Hoy: el de cada fila (10 feb, 15 feb, 25 feb, 28 feb, 25 mar). Sin enmiendas.
// `fut` = Σ de las asignaciones en períodos futuros (Q1: no entran las proyecciones). `reduccionesDebito` = Σ SobD de los períodos cerrados (P1: 50 desde el paso 3; P2: 150 en el paso 6).
export default {
  id: 'ESC-49',
  titulo: 'Tres períodos seguidos con asignaciones futuras',
  refs: ['Q1', 'C1', 'C3'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1500 },
        { op: 'OP-14', categoria: 'Super', monto: 400, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P2' },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P3' },
      ],
      espera: { ef: 1500, lpa: 500, disp: { Super: 400 }, fut: 600, sobta: 0 },
    },
    {
      n: '2',
      hoy: '2027-02-15',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 450, categoria: 'Super' }],
      espera: {
        ef: 1050,
        lpa: 500,
        disp: { Super: -50 },
        fut: 600,
        sobta: 0,
        avisos: ['AV-02'],
      },
    },
    {
      n: '3',
      hoy: '2027-02-25',
      ops: [],
      espera: { ef: 1050, lpa: 450, disp: { Super: 300 }, fut: 300, sobta: 0 },
    },
    {
      n: '4',
      hoy: '2027-02-28',
      ops: [{ op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' }],
      espera: {
        ef: 1050,
        lpa: 450,
        disp: { Super: 200, 'Pago T': 100 },
        fut: 300,
        sobta: 0,
        tarjetas: { T: [100, 0, 0] },
      },
    },
    {
      n: '5',
      hoy: '2027-03-25',
      ops: [],
      espera: {
        ef: 1050,
        lpa: 450,
        disp: { Super: 500, 'Pago T': 100 },
        fut: 0,
        sobta: 0,
      },
    },
    {
      n: '6',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 350, categoria: 'Super', fecha: '2027-03-01' }],
      espera: {
        ef: 700,
        lpa: 300,
        disp: { Super: 300, 'Pago T': 100 },
        fut: 0,
        sobta: 0,
        avisos: ['AV-01'],
        extra: { reduccionesDebito: 200 },
      },
    },
  ],
} satisfies Escenario;
