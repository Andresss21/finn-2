import type { Escenario } from '../tipos';
// 01 §8, ESC-10 Pago excedente, antes y después del cierre [H5, O2; filas 4 y 5]. Hoy: 15 feb; el paso 4 pasa a 21 feb. Sin enmiendas.
// Paso 3: reducción proyectada = 50 (§4.7); AV-10 antes de confirmar y AV-04 "pagaste $50 más…".
export default {
  id: 'ESC-10',
  titulo: 'Pago excedente, antes y después del cierre',
  refs: ['H5', 'O2'],
  hoy: '2027-02-15',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Salidas' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 200 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
      ],
      espera: { ef: 200, lpa: 100, disp: { Super: 100 }, sobta: 0, tarjetas: { T: [0, 0, 0] } },
    },
    {
      n: '2',
      ops: [
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
        { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas' },
      ],
      espera: {
        ef: 200,
        lpa: 100,
        disp: { Salidas: -50, 'Pago T': 100 },
        sobta: 50,
        tarjetas: { T: [150, 50, 0] },
        avisos: ['AV-03'],
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-23', tarjeta: 'T', monto: 150 }],
      espera: {
        ef: 50,
        lpa: 100,
        disp: { Salidas: -50, 'Pago T': -50 },
        sobta: 50,
        tarjetas: { T: [0, 0, 0] },
        avisos: ['AV-10', 'AV-04'],
        extra: { reduccionProyectada: 50 },
      },
    },
    {
      n: '4',
      hoy: '2027-02-21',
      ops: [],
      espera: { ef: 50, lpa: 50, disp: {}, sobta: 0, tarjetas: { T: [0, 0, 0] } },
    },
  ],
} satisfies Escenario;
