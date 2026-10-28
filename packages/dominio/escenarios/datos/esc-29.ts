import type { Escenario } from '../tipos';
// 01 §8, ESC-29 Devolución sobre una línea por cobrar y excedente repartido [I5, inv. 9]. Hoy: 10 feb (P1). Sin enmiendas.
// "En camino" va en `extra` como `enCamino`. Paso 3: el intento reparte 40 a la línea por cobrar (línea 2) y 10 a Super (línea 1);
// 04 §3.5 lo rechaza con `devolucion_mayor_que_linea` (la capacidad de una línea por cobrar es su saldo abierto, 25).
export default {
  id: 'ESC-29',
  titulo: 'Devolución sobre una línea por cobrar y excedente repartido',
  refs: ['I5', 'inv. 9'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 100,
          etiqueta: 'compartida',
          lineas: [
            { categoria: 'Super', monto: 60 },
            { deudor: 'Ana', monto: 40 },
          ],
        },
      ],
      espera: { ef: 400, lpa: 360, disp: { Super: 40 }, sobta: 0, extra: { enCamino: 40 } },
    },
    {
      n: '2',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 15 }],
      espera: { ef: 415, lpa: 375, disp: { Super: 40 }, sobta: 0, extra: { enCamino: 25 } },
    },
    {
      n: '3',
      ops: [
        {
          op: 'OP-33',
          compra: 'compartida',
          monto: 50,
          reparto: [
            { linea: 2, monto: 40 },
            { linea: 1, monto: 10 },
          ],
        },
      ],
      espera: { rechazo: 'devolucion_mayor_que_linea' },
    },
    {
      n: '4',
      ops: [
        {
          op: 'OP-33',
          compra: 'compartida',
          monto: 50,
          reparto: [
            { linea: 2, monto: 25 },
            { linea: 1, monto: 25 },
          ],
        },
      ],
      espera: { ef: 465, lpa: 400, disp: { Super: 65 }, sobta: 0, extra: { enCamino: 0 } },
    },
  ],
} satisfies Escenario;
