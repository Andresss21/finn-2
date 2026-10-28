import type { Escenario } from '../tipos';
// 01 §8, ESC-41 Aporte a inversión [P3]. Hoy: 10 feb (P1, DP-16). Sin enmiendas.
// La inversión empieza en 0 (columna Inversión, `valorInversion`); el aporte sale de Ahorro y se imputa a "Aporte inversión".
export default {
  id: 'ESC-41',
  titulo: 'Aporte a inversión',
  refs: ['P3'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion' },
    { op: 'OP-07', categoria: 'Aporte inversión' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Aporte inversión', monto: 200 },
      ],
      espera: {
        ef: 500,
        lpa: 300,
        disp: { 'Aporte inversión': 200 },
        extra: { 'valorInversion:Inversión': 0 },
      },
    },
    {
      n: '2',
      ops: [
        {
          op: 'OP-25',
          modalidad: 'aporte',
          inversion: 'Inversión',
          monto: 200,
          categoria: 'Aporte inversión',
        },
      ],
      espera: {
        ef: 300,
        lpa: 300,
        disp: {},
        extra: { 'valorInversion:Inversión': 200 },
      },
    },
  ],
} satisfies Escenario;
