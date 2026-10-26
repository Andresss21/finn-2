import type { Escenario } from '../tipos';
// 01 §8, ESC-15 Sobregiro de débito y su efecto al cierre [C1, C2]. Hoy: 10 feb (P1); el paso 3 pasa a 21 feb. Sin enmiendas.
// Paso 3: SobD(Salidas, P1) = 50, que es lo que reducen los períodos cerrados (`reduccionesDebito`).
export default {
  id: 'ESC-15',
  titulo: 'Sobregiro de débito y su efecto al cierre',
  refs: ['C1', 'C2'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Salidas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
      ],
      espera: { ef: 500, lpa: 400, disp: { Salidas: 100 }, sobta: 0 },
    },
    {
      n: '2',
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' }],
      espera: { ef: 350, lpa: 400, disp: { Salidas: -50 }, sobta: 0, avisos: ['AV-02'] },
    },
    {
      n: '3',
      hoy: '2027-02-21',
      ops: [],
      espera: { ef: 350, lpa: 350, disp: {}, sobta: 0, extra: { reduccionesDebito: 50 } },
    },
  ],
} satisfies Escenario;
