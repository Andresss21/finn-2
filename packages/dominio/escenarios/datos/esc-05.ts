import type { Escenario } from '../tipos';
// 01 §8, ESC-05 Compra con tarjeta no cubierta y cierre [C1; fila 3]. Hoy: 15 feb (P1); el paso 3 pasa a 21 feb. Sin enmiendas.
// El cierre no cambia LPA ni S: la parte no cubierta pasa a S sin cambiar ni un centavo (§4.15).
export default {
  id: 'ESC-05',
  titulo: 'Compra con tarjeta no cubierta y cierre',
  refs: ['C1', 'fila 3'],
  hoy: '2027-02-15',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
      ],
      espera: { ef: 1000, lpa: 700, disp: { Super: 300 }, sobta: 0, tarjetas: { T: [0, 0, 0] } },
    },
    {
      n: '2',
      ops: [{ op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10' }],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { Super: -100, 'Pago T': 300 },
        sobta: 100,
        tarjetas: { T: [400, 100, 0] },
      },
    },
    {
      n: '3',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 1000,
        lpa: 700,
        disp: { 'Pago T': 300 },
        sobta: 0,
        tarjetas: { T: [400, 100, 0] },
      },
    },
  ],
} satisfies Escenario;
