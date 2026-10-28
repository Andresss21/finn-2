import type { Escenario } from '../tipos';
// 01 §8, ESC-48 Cobro de un por cobrar con débito depositado en la tarjeta [Q7, Q3, N9]. Hoy: 10 feb. Sin enmiendas.
// Dos tablas desde el mismo estado vacío: "con reserva" (pasos 1 y 2) y "sin reserva" (sr1 a sr3, alternativa del paso 1 y su rama).
// Columnas fuera de la instantánea en `extra`: `enCamino`, `reporte:restitucion` y `reporte:excedente` (el ingreso del excedente).
export default {
  id: 'ESC-48',
  titulo: 'Cobro de un por cobrar con débito depositado en la tarjeta',
  refs: ['Q7', 'Q3', 'N9'],
  hoy: '2027-02-10',
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
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          lineas: [
            { categoria: 'Super', monto: 25 },
            { deudor: 'Ana', monto: 25 },
          ],
          etiqueta: 'cobro',
        },
      ],
      espera: {
        ef: 950,
        lpa: 675,
        disp: { Super: 175, 'Pago T': 100 },
        sobta: 0,
        tarjetas: { T: [100, 0, 0] },
        extra: { enCamino: 25 },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-31', cobro: 'cobro', monto: 30, cuenta: 'T' }],
      espera: {
        ef: 950,
        lpa: 700,
        disp: { Super: 175, 'Pago T': 75 },
        sobta: 0,
        tarjetas: { T: [70, 0, 5] },
        avisos: ['AV-08'],
        extra: { enCamino: 0, 'reporte:restitucion': 25, 'reporte:excedente': 5 },
      },
    },
    {
      n: 'sr1',
      alternativaDe: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Salidas' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          lineas: [
            { categoria: 'Super', monto: 25 },
            { deudor: 'Ana', monto: 25 },
          ],
          etiqueta: 'cobro',
        },
      ],
      espera: {
        ef: 950,
        lpa: 675,
        disp: { Super: 275, Salidas: -100 },
        sobta: 100,
        tarjetas: { T: [100, 100, 0] },
        extra: { enCamino: 25 },
      },
    },
    {
      n: 'sr2',
      rama: 'sr1',
      ops: [{ op: 'OP-31', cobro: 'cobro', monto: 30, cuenta: 'T' }],
      espera: {
        ef: 950,
        lpa: 700,
        disp: { Super: 275, Salidas: -100, 'Pago T': -25 },
        sobta: 100,
        tarjetas: { T: [70, 70, 0] },
        avisos: ['AV-05'],
        extra: { enCamino: 0 },
      },
    },
    {
      n: 'sr3',
      rama: 'sr1',
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 950,
        lpa: 675,
        disp: { Super: 275 },
        sobta: 0,
        tarjetas: { T: [70, 70, 0] },
        extra: { enCamino: 0 },
      },
    },
  ],
} satisfies Escenario;
