import type { Escenario } from '../tipos';
// 01 §8, ESC-16 Cubrir un sobregiro de débito antes del cierre [documento base §15]. Hoy: 10 feb (P1); el paso 3 pasa a 21 feb.
// Sin enmiendas. Paso 3: sin reducción de LPA (Super conserva 30 de arrastre).
export default {
  id: 'ESC-16',
  titulo: 'Cubrir un sobregiro de débito antes del cierre',
  refs: ['documento base §15'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
        { op: 'OP-14', categoria: 'Super', monto: 80, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
      ],
      espera: { ef: 350, lpa: 320, disp: { Salidas: -50, Super: 80 }, sobta: 0 },
    },
    {
      n: '2',
      ops: [{ op: 'OP-15', origen: 'Super', destino: 'Salidas', monto: 50 }],
      espera: { ef: 350, lpa: 320, disp: { Super: 30 }, sobta: 0 },
    },
    {
      n: '3',
      hoy: '2027-02-21',
      ops: [],
      espera: { ef: 350, lpa: 320, disp: { Super: 30 }, sobta: 0, extra: { reduccionesDebito: 0 } },
    },
  ],
} satisfies Escenario;
