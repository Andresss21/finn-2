import type { Escenario } from '../tipos';
// 01 §8, ESC-20 Compartido con débito: en camino, cobro parcial y excedente [D1, N9; fila 2]. Hoy: 10 feb (P1). Sin enmiendas.
// "En camino" va en `extra` como `enCamino`. Reportes (§4.13): la tabla da la restitución de cada cobro (10 y 15), y la consulta es acumulada (10 y 25); el excedente de 5 es
// ingreso (`reporte:excedente`). AV-09 en el paso 2. Ana es la deudora de la línea por cobrar (se crea con la compra).
export default {
  id: 'ESC-20',
  titulo: 'Compartido con débito: en camino, cobro parcial y excedente',
  refs: ['D1', 'N9', 'fila 2'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
      ],
      espera: { ef: 1000, lpa: 700, disp: { Super: 300 }, sobta: 0, extra: { enCamino: 0 } },
    },
    {
      n: '2',
      ops: [
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          etiqueta: 'compartida',
          lineas: [
            { categoria: 'Super', monto: 25 },
            { deudor: 'Ana', monto: 25 },
          ],
        },
      ],
      espera: {
        ef: 950,
        lpa: 675,
        disp: { Super: 275 },
        sobta: 0,
        avisos: ['AV-09'],
        extra: { enCamino: 25 },
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 10 }],
      espera: {
        ef: 960,
        lpa: 685,
        disp: { Super: 275 },
        sobta: 0,
        extra: { enCamino: 15, 'reporte:restitucion': 10 },
      },
    },
    {
      n: '4',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 20 }],
      espera: {
        ef: 980,
        lpa: 705,
        disp: { Super: 275 },
        sobta: 0,
        extra: { enCamino: 0, 'reporte:restitucion': 25, 'reporte:excedente': 5 },
      },
    },
  ],
} satisfies Escenario;
