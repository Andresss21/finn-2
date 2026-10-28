import type { Escenario } from '../tipos';
// 01 §8, ESC-21 Compartido con débito: condonación a una categoría sin Disponible [I4]. Hoy: 10 feb (P1); el paso 4 pasa a 21 feb. Sin enmiendas.
// La columna "En camino" va en `extra` como `enCamino`. Paso 3: OP-32 hacia Ropa (sin asignación); AV-02 (sobregiro de débito).
export default {
  id: 'ESC-21',
  titulo: 'Compartido con débito: condonación a una categoría sin Disponible',
  refs: ['I4'],
  hoy: '2027-02-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-07', categoria: 'Ropa' },
  ],
  pasos: [
    {
      n: '1',
      ops: [
        { op: 'OP-21', monto: 200 },
        { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 60,
          etiqueta: 'compartida',
          lineas: [
            { categoria: 'Salidas', monto: 30 },
            { deudor: 'Beto', monto: 30 },
          ],
        },
      ],
      espera: { ef: 140, lpa: 120, disp: { Salidas: 20 }, sobta: 0, extra: { enCamino: 30 } },
    },
    {
      n: '2',
      ops: [{ op: 'OP-31', cobro: 'compartida', monto: 10 }],
      espera: { ef: 150, lpa: 130, disp: { Salidas: 20 }, sobta: 0, extra: { enCamino: 20 } },
    },
    {
      n: '3',
      ops: [{ op: 'OP-32', cobro: 'compartida', categoria: 'Ropa', monto: 20 }],
      espera: {
        ef: 150,
        lpa: 150,
        disp: { Salidas: 20, Ropa: -20 },
        sobta: 0,
        avisos: ['AV-02'],
        extra: { enCamino: 0 },
      },
    },
    {
      n: '4',
      hoy: '2027-02-21',
      ops: [],
      espera: { ef: 150, lpa: 130, disp: { Salidas: 20 }, sobta: 0, extra: { enCamino: 0 } },
    },
  ],
} satisfies Escenario;
