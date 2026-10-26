import type { Escenario } from '../tipos';
// 01 §8, ESC-03 Ingreso, asignación, asignar de más y límite de futuros [H4, I1, supuesto 14]. Hoy: 5 feb (A = P1). Sin enmiendas.
// Mascota tiene meta mensual de 50 (estado previo). Paso 4: rechazo `lpa_negativo_en_futuro` (I1, 04 §3.0.6).
export default {
  id: 'ESC-03',
  titulo: 'Ingreso, asignación, asignar de más y límite de futuros',
  refs: ['H4', 'I1', 'supuesto 14'],
  hoy: '2027-02-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Salidas' },
    { op: 'OP-07', categoria: 'Gas' },
    { op: 'OP-07', categoria: 'Mascota' },
    { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  ],
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-21', monto: 1000 }],
      espera: { ef: 1000, lpa: 1000, disp: {}, sobta: 0 },
    },
    {
      n: '2',
      ops: [{ op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1' }],
      espera: { ef: 1000, lpa: 400, disp: { Super: 600 }, sobta: 0 },
    },
    {
      n: '3',
      ops: [{ op: 'OP-14', categoria: 'Salidas', monto: 300, periodo: 'P2' }],
      espera: { ef: 1000, lpa: 100, disp: { Super: 600 }, fut: 300, sobta: 0 },
    },
    {
      n: '4',
      ops: [{ op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P2' }],
      espera: { rechazo: 'lpa_negativo_en_futuro' },
    },
    {
      n: '5',
      ops: [{ op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' }],
      espera: {
        ef: 1000,
        lpa: -100,
        disp: { Super: 600, Gas: 200 },
        fut: 300,
        sobta: 0,
        avisos: ['AV-11', 'AV-20'],
      },
    },
    {
      n: '6',
      ops: [{ op: 'OP-17' }],
      espera: {
        ef: 1000,
        lpa: -100,
        disp: { Super: 600, Gas: 200 },
        fut: 300,
        sobta: 0,
        avisos: ['AV-18'],
      },
    },
  ],
} satisfies Escenario;
